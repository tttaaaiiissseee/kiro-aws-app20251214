import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { validateRequired, asyncHandler } from '../middleware/validation';
import { RelationType, isValidRelationType } from '../types/enums';

const router = Router();

// GET /api/relations - 関係性一覧取得
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { fromServiceId, toServiceId, type } = req.query;
  
  // Build where clause for filtering
  const where: any = {};
  
  if (fromServiceId && typeof fromServiceId === 'string') {
    where.fromServiceId = fromServiceId;
  }
  
  if (toServiceId && typeof toServiceId === 'string') {
    where.toServiceId = toServiceId;
  }
  
  if (type && typeof type === 'string' && isValidRelationType(type)) {
    where.type = type;
  }
  
  try {
    const relations = await prisma.relation.findMany({
      where,
      include: {
        fromService: {
          select: {
            id: true,
            name: true,
            description: true,
            category: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        },
        toService: {
          select: {
            id: true,
            name: true,
            description: true,
            category: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      data: relations,
      count: relations.length,
      filters: {
        ...(fromServiceId && { fromServiceId }),
        ...(toServiceId && { toServiceId }),
        ...(type && { type })
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching relations:', error);
    throw new Error('関係性一覧の取得に失敗しました。');
  }
}));

// GET /api/relations/services/:id - 指定サービスの関連サービス取得
router.get('/services/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id },
      select: { id: true, name: true }
    });
    
    if (!service) {
      res.status(404).json({
        error: {
          code: 'SERVICE_NOT_FOUND',
          message: '指定されたサービスが見つかりません。',
          details: { serviceId: id }
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
    
    // Get all relations where this service is involved
    const [outgoingRelations, incomingRelations] = await Promise.all([
      // Relations where this service is the source
      prisma.relation.findMany({
        where: { fromServiceId: id },
        include: {
          toService: {
            select: {
              id: true,
              name: true,
              description: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  color: true
                }
              }
            }
          }
        }
      }),
      // Relations where this service is the target
      prisma.relation.findMany({
        where: { toServiceId: id },
        include: {
          fromService: {
            select: {
              id: true,
              name: true,
              description: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  color: true
                }
              }
            }
          }
        }
      })
    ]);
    
    // Transform the data to provide a unified view of related services
    const relatedServices = new Map();
    
    // Process outgoing relations
    outgoingRelations.forEach(relation => {
      const serviceId = relation.toService.id;
      if (!relatedServices.has(serviceId)) {
        relatedServices.set(serviceId, {
          service: relation.toService,
          relations: []
        });
      }
      relatedServices.get(serviceId).relations.push({
        id: relation.id,
        type: relation.type,
        direction: 'outgoing',
        description: relation.description,
        createdAt: relation.createdAt
      });
    });
    
    // Process incoming relations
    incomingRelations.forEach(relation => {
      const serviceId = relation.fromService.id;
      if (!relatedServices.has(serviceId)) {
        relatedServices.set(serviceId, {
          service: relation.fromService,
          relations: []
        });
      }
      relatedServices.get(serviceId).relations.push({
        id: relation.id,
        type: relation.type,
        direction: 'incoming',
        description: relation.description,
        createdAt: relation.createdAt
      });
    });
    
    const result = Array.from(relatedServices.values());
    
    res.json({
      data: {
        service,
        relatedServices: result,
        summary: {
          totalRelatedServices: result.length,
          totalRelations: outgoingRelations.length + incomingRelations.length,
          outgoingRelations: outgoingRelations.length,
          incomingRelations: incomingRelations.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching related services:', error);
    throw new Error('関連サービスの取得に失敗しました。');
  }
}));

// POST /api/relations - 関係性作成
router.post('/',
  validateRequired(['fromServiceId', 'toServiceId', 'type']),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { fromServiceId, toServiceId, type, description } = req.body;
    
    // Validate relation type
    if (!isValidRelationType(type)) {
      res.status(400).json({
        error: {
          code: 'INVALID_RELATION_TYPE',
          message: '無効な関係タイプです。',
          details: { 
            providedType: type,
            validTypes: Object.values(RelationType)
          }
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
    
    // Prevent self-referencing relations
    if (fromServiceId === toServiceId) {
      res.status(400).json({
        error: {
          code: 'SELF_REFERENCE_NOT_ALLOWED',
          message: 'サービス自身との関係は作成できません。',
          details: { serviceId: fromServiceId }
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
    
    try {
      // Check if both services exist
      const [fromService, toService] = await Promise.all([
        prisma.service.findUnique({
          where: { id: fromServiceId },
          select: { id: true, name: true }
        }),
        prisma.service.findUnique({
          where: { id: toServiceId },
          select: { id: true, name: true }
        })
      ]);
      
      if (!fromService) {
        res.status(404).json({
          error: {
            code: 'FROM_SERVICE_NOT_FOUND',
            message: '関係元のサービスが見つかりません。',
            details: { fromServiceId }
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      if (!toService) {
        res.status(404).json({
          error: {
            code: 'TO_SERVICE_NOT_FOUND',
            message: '関係先のサービスが見つかりません。',
            details: { toServiceId }
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      // Check if relation already exists
      const existingRelation = await prisma.relation.findFirst({
        where: {
          fromServiceId,
          toServiceId,
          type
        }
      });
      
      if (existingRelation) {
        res.status(409).json({
          error: {
            code: 'RELATION_ALREADY_EXISTS',
            message: '同じ関係が既に存在します。',
            details: {
              fromService: fromService.name,
              toService: toService.name,
              type,
              existingRelationId: existingRelation.id
            }
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      // Create the relation
      const relation = await prisma.relation.create({
        data: {
          fromServiceId,
          toServiceId,
          type,
          description: description || null
        },
        include: {
          fromService: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          toService: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      });
      
      res.status(201).json({
        data: relation,
        message: '関係性が正常に作成されました。',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating relation:', error);
      throw new Error('関係性の作成に失敗しました。');
    }
  })
);

// DELETE /api/relations/:id - 関係性削除
router.delete('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    // Check if relation exists
    const existingRelation = await prisma.relation.findUnique({
      where: { id },
      include: {
        fromService: {
          select: {
            id: true,
            name: true
          }
        },
        toService: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!existingRelation) {
      res.status(404).json({
        error: {
          code: 'RELATION_NOT_FOUND',
          message: '指定された関係性が見つかりません。',
          details: { relationId: id }
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
    
    // Delete the relation
    await prisma.relation.delete({
      where: { id }
    });
    
    res.json({
      message: '関係性が正常に削除されました。',
      details: {
        deletedRelation: {
          id: existingRelation.id,
          type: existingRelation.type,
          fromService: existingRelation.fromService.name,
          toService: existingRelation.toService.name
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting relation:', error);
    throw new Error('関係性の削除に失敗しました。');
  }
}));

export default router;