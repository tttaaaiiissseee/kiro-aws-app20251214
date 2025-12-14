import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { validateRequired, validateServiceName, asyncHandler, ValidationError } from '../middleware/validation';

const router = Router();

// GET /api/services - サービス一覧取得（カテゴリフィルタ対応）
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { category, search, sort = 'name' } = req.query;
  
  // Build where clause
  const where: any = {};
  
  // Category filter - enhanced to support category filtering
  if (category && typeof category === 'string') {
    where.categoryId = category;
  }
  
  // Search filter - basic search for backward compatibility
  if (search && typeof search === 'string') {
    const searchTerm = search.trim();
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } }
      ];
    }
  }
  
  // Build orderBy clause with enhanced sorting options
  let orderBy: any;
  switch (sort) {
    case 'name':
    case 'alphabetical':
      orderBy = { name: 'asc' };
      break;
    case 'updated':
      orderBy = { updatedAt: 'desc' };
      break;
    case 'created':
      orderBy = { createdAt: 'desc' };
      break;
    case 'relevance':
      // For services endpoint, relevance defaults to name order
      orderBy = { name: 'asc' };
      break;
    default:
      orderBy = { name: 'asc' };
      break;
  }
  
  try {
    const services = await prisma.service.findMany({
      where,
      orderBy,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        _count: {
          select: {
            memos: true,
            fromRelations: true,
            toRelations: true
          }
        }
      }
    });
    
    res.json({
      data: services,
      count: services.length,
      ...(category && { categoryFilter: category }),
      ...(search && { searchQuery: search }),
      sort,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    throw new Error('サービス一覧の取得に失敗しました。');
  }
}));

// GET /api/services/:id - サービス詳細取得
router.get('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true
          }
        },
        memos: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            content: true,
            title: true,
            createdAt: true,
            updatedAt: true
          }
        },
        fromRelations: {
          include: {
            toService: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        },
        toRelations: {
          include: {
            fromService: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
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
    
    res.json({
      data: service,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    throw new Error('サービス詳細の取得に失敗しました。');
  }
}));

// POST /api/services - サービス作成
router.post('/', 
  validateRequired(['name', 'categoryId']),
  validateServiceName,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, description, categoryId } = req.body;
    
    try {
      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      
      if (!category) {
        res.status(400).json({
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: '指定されたカテゴリが存在しません。',
            details: { categoryId }
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      // Check for duplicate service name
      const existingService = await prisma.service.findUnique({
        where: { name }
      });
      
      if (existingService) {
        res.status(409).json({
          error: {
            code: 'DUPLICATE_SERVICE_NAME',
            message: '同じ名前のサービスが既に存在します。',
            details: { serviceName: name }
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      // Create service
      const service = await prisma.service.create({
        data: {
          name,
          description: description || null,
          categoryId
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true
            }
          }
        }
      });
      
      res.status(201).json({
        data: service,
        message: 'サービスが正常に作成されました。',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating service:', error);
      throw new Error('サービスの作成に失敗しました。');
    }
  })
);

// PUT /api/services/:id - サービス更新
router.put('/:id',
  validateServiceName,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, description, categoryId } = req.body;
    
    try {
      // Check if service exists
      const existingService = await prisma.service.findUnique({
        where: { id }
      });
      
      if (!existingService) {
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
      
      // If name is being updated, check for duplicates
      if (name && name !== existingService.name) {
        const duplicateService = await prisma.service.findUnique({
          where: { name }
        });
        
        if (duplicateService) {
          res.status(409).json({
            error: {
              code: 'DUPLICATE_SERVICE_NAME',
              message: '同じ名前のサービスが既に存在します。',
              details: { serviceName: name }
            },
            timestamp: new Date().toISOString(),
            path: req.path
          });
          return;
        }
      }
      
      // If categoryId is being updated, check if category exists
      if (categoryId && categoryId !== existingService.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: categoryId }
        });
        
        if (!category) {
          res.status(400).json({
            error: {
              code: 'CATEGORY_NOT_FOUND',
              message: '指定されたカテゴリが存在しません。',
              details: { categoryId }
            },
            timestamp: new Date().toISOString(),
            path: req.path
          });
          return;
        }
      }
      
      // Update service
      const updatedService = await prisma.service.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description: description || null }),
          ...(categoryId && { categoryId })
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true
            }
          }
        }
      });
      
      res.json({
        data: updatedService,
        message: 'サービスが正常に更新されました。',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating service:', error);
      throw new Error('サービスの更新に失敗しました。');
    }
  })
);

// DELETE /api/services/:id - サービス削除
router.delete('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            memos: true,
            fromRelations: true,
            toRelations: true
          }
        }
      }
    });
    
    if (!existingService) {
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
    
    // Delete service (cascade will handle related memos and relations)
    await prisma.service.delete({
      where: { id }
    });
    
    res.json({
      message: 'サービスが正常に削除されました。',
      details: {
        deletedService: {
          id: existingService.id,
          name: existingService.name
        },
        cascadeDeleted: {
          memos: existingService._count.memos,
          relations: existingService._count.fromRelations + existingService._count.toRelations
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    throw new Error('サービスの削除に失敗しました。');
  }
}));

export default router;