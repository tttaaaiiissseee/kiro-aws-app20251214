import request from 'supertest';
import express from 'express';
import { RelationType } from '../types/enums';

// Mock Prisma client
const mockPrisma = {
  relation: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  service: {
    findUnique: jest.fn(),
  },
} as any;

// Mock the prisma import
jest.mock('../lib/prisma', () => mockPrisma);

import relationsRouter from '../routes/relations';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/relations', relationsRouter);

// Add error handling middleware for tests
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'バリデーションエラーが発生しました。',
        details: err.details || err.message
      },
      timestamp: new Date().toISOString(),
      path: req.path
    });
    return;
  }
  res.status(500).json({ error: err.message });
});

describe('Relations API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/relations', () => {
    it('should return list of relations', async () => {
      const mockRelations = [
        {
          id: '1',
          type: RelationType.INTEGRATES_WITH,
          fromServiceId: 'service1',
          toServiceId: 'service2',
          description: 'Test relation',
          createdAt: '2025-12-13T03:40:06.410Z',
          fromService: {
            id: 'service1',
            name: 'EC2',
            description: 'Virtual servers',
            category: { id: 'cat1', name: 'Compute', color: '#ff0000' }
          },
          toService: {
            id: 'service2',
            name: 'S3',
            description: 'Object storage',
            category: { id: 'cat2', name: 'Storage', color: '#00ff00' }
          }
        }
      ];

      mockPrisma.relation.findMany.mockResolvedValue(mockRelations);

      const response = await request(app).get('/api/relations');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockRelations);
      expect(response.body.count).toBe(1);
      expect(mockPrisma.relation.findMany).toHaveBeenCalledWith({
        where: {},
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
    });

    it('should filter relations by fromServiceId', async () => {
      mockPrisma.relation.findMany.mockResolvedValue([]);

      await request(app).get('/api/relations?fromServiceId=service1');

      expect(mockPrisma.relation.findMany).toHaveBeenCalledWith({
        where: { fromServiceId: 'service1' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should filter relations by type', async () => {
      mockPrisma.relation.findMany.mockResolvedValue([]);

      await request(app).get(`/api/relations?type=${RelationType.DEPENDS_ON}`);

      expect(mockPrisma.relation.findMany).toHaveBeenCalledWith({
        where: { type: RelationType.DEPENDS_ON },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('GET /api/relations/services/:id', () => {
    it('should return related services for a given service', async () => {
      const mockService = { id: 'service1', name: 'EC2' };
      const mockOutgoingRelations = [
        {
          id: 'rel1',
          type: RelationType.INTEGRATES_WITH,
          description: 'Integrates with S3',
          createdAt: '2025-12-13T03:40:06.410Z',
          toService: {
            id: 'service2',
            name: 'S3',
            description: 'Object storage',
            category: { id: 'cat2', name: 'Storage', color: '#00ff00' }
          }
        }
      ];
      const mockIncomingRelations = [
        {
          id: 'rel2',
          type: RelationType.DEPENDS_ON,
          description: 'Lambda depends on EC2',
          createdAt: '2025-12-13T03:40:06.420Z',
          fromService: {
            id: 'service3',
            name: 'Lambda',
            description: 'Serverless functions',
            category: { id: 'cat3', name: 'Compute', color: '#0000ff' }
          }
        }
      ];

      mockPrisma.service.findUnique.mockResolvedValue(mockService);
      mockPrisma.relation.findMany
        .mockResolvedValueOnce(mockOutgoingRelations) // outgoing relations
        .mockResolvedValueOnce(mockIncomingRelations); // incoming relations

      const response = await request(app).get('/api/relations/services/service1');

      expect(response.status).toBe(200);
      expect(response.body.data.service).toEqual(mockService);
      expect(response.body.data.relatedServices).toHaveLength(2);
      expect(response.body.data.summary.totalRelatedServices).toBe(2);
      expect(response.body.data.summary.totalRelations).toBe(2);
    });

    it('should return 404 for non-existent service', async () => {
      mockPrisma.service.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/relations/services/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('SERVICE_NOT_FOUND');
    });
  });

  describe('POST /api/relations', () => {
    it('should create a new relation', async () => {
      const newRelation = {
        fromServiceId: 'service1',
        toServiceId: 'service2',
        type: RelationType.INTEGRATES_WITH,
        description: 'Test integration'
      };

      const mockFromService = { id: 'service1', name: 'EC2' };
      const mockToService = { id: 'service2', name: 'S3' };
      const mockCreatedRelation = {
        id: 'rel1',
        ...newRelation,
        createdAt: '2025-12-13T03:40:06.410Z',
        fromService: {
          id: 'service1',
          name: 'EC2',
          description: 'Virtual servers'
        },
        toService: {
          id: 'service2',
          name: 'S3',
          description: 'Object storage'
        }
      };

      mockPrisma.service.findUnique
        .mockResolvedValueOnce(mockFromService)
        .mockResolvedValueOnce(mockToService);
      mockPrisma.relation.findFirst.mockResolvedValue(null); // No existing relation
      mockPrisma.relation.create.mockResolvedValue(mockCreatedRelation);

      const response = await request(app)
        .post('/api/relations')
        .send(newRelation);

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(mockCreatedRelation);
      expect(response.body.message).toBe('関係性が正常に作成されました。');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/relations')
        .send({ type: RelationType.INTEGRATES_WITH });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid relation type', async () => {
      const response = await request(app)
        .post('/api/relations')
        .send({
          fromServiceId: 'service1',
          toServiceId: 'service2',
          type: 'INVALID_TYPE'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_RELATION_TYPE');
    });

    it('should return 400 for self-referencing relation', async () => {
      const response = await request(app)
        .post('/api/relations')
        .send({
          fromServiceId: 'service1',
          toServiceId: 'service1',
          type: RelationType.INTEGRATES_WITH
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('SELF_REFERENCE_NOT_ALLOWED');
    });

    it('should return 404 for non-existent from service', async () => {
      mockPrisma.service.findUnique
        .mockResolvedValueOnce(null) // from service not found
        .mockResolvedValueOnce({ id: 'service2', name: 'S3' });

      const response = await request(app)
        .post('/api/relations')
        .send({
          fromServiceId: 'nonexistent',
          toServiceId: 'service2',
          type: RelationType.INTEGRATES_WITH
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('FROM_SERVICE_NOT_FOUND');
    });

    it('should return 409 for duplicate relation', async () => {
      const mockFromService = { id: 'service1', name: 'EC2' };
      const mockToService = { id: 'service2', name: 'S3' };
      const mockExistingRelation = { id: 'existing', type: RelationType.INTEGRATES_WITH };

      mockPrisma.service.findUnique
        .mockResolvedValueOnce(mockFromService)
        .mockResolvedValueOnce(mockToService);
      mockPrisma.relation.findFirst.mockResolvedValue(mockExistingRelation);

      const response = await request(app)
        .post('/api/relations')
        .send({
          fromServiceId: 'service1',
          toServiceId: 'service2',
          type: RelationType.INTEGRATES_WITH
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('RELATION_ALREADY_EXISTS');
    });
  });

  describe('DELETE /api/relations/:id', () => {
    it('should delete an existing relation', async () => {
      const mockExistingRelation = {
        id: 'rel1',
        type: RelationType.INTEGRATES_WITH,
        fromService: { id: 'service1', name: 'EC2' },
        toService: { id: 'service2', name: 'S3' }
      };

      mockPrisma.relation.findUnique.mockResolvedValue(mockExistingRelation);
      mockPrisma.relation.delete.mockResolvedValue(mockExistingRelation);

      const response = await request(app).delete('/api/relations/rel1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('関係性が正常に削除されました。');
      expect(response.body.details.deletedRelation.type).toBe(RelationType.INTEGRATES_WITH);
    });

    it('should return 404 for non-existent relation', async () => {
      mockPrisma.relation.findUnique.mockResolvedValue(null);

      const response = await request(app).delete('/api/relations/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('RELATION_NOT_FOUND');
    });
  });
});