import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';

// Mock Prisma client
const mockPrisma = {
  service: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  category: {
    findUnique: jest.fn(),
  },
} as any;

// Mock the prisma import
jest.mock('../lib/prisma', () => mockPrisma);

import servicesRouter from '../routes/services';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/services', servicesRouter);

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

describe('Services API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/services', () => {
    it('should return list of services', async () => {
      const mockServices = [
        {
          id: '1',
          name: 'EC2',
          description: 'Virtual servers',
          categoryId: 'cat1',
          category: { id: 'cat1', name: 'Compute', color: '#ff0000' },
          _count: { memos: 2, fromRelations: 1, toRelations: 1 },
          createdAt: '2025-12-13T03:40:06.410Z',
          updatedAt: '2025-12-13T03:40:06.410Z',
        },
      ];

      mockPrisma.service.findMany.mockResolvedValue(mockServices);

      const response = await request(app).get('/api/services');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockServices);
      expect(response.body.count).toBe(1);
      expect(mockPrisma.service.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: 'asc' },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          _count: {
            select: {
              memos: true,
              fromRelations: true,
              toRelations: true,
            },
          },
        },
      });
    });

    it('should filter services by category', async () => {
      mockPrisma.service.findMany.mockResolvedValue([]);

      await request(app).get('/api/services?category=cat1');

      expect(mockPrisma.service.findMany).toHaveBeenCalledWith({
        where: { categoryId: 'cat1' },
        orderBy: { name: 'asc' },
        include: expect.any(Object),
      });
    });

    it('should search services by name and description', async () => {
      mockPrisma.service.findMany.mockResolvedValue([]);

      await request(app).get('/api/services?search=EC2');

      expect(mockPrisma.service.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'EC2' } },
            { description: { contains: 'EC2' } },
          ],
        },
        orderBy: { name: 'asc' },
        include: expect.any(Object),
      });
    });
  });

  describe('GET /api/services/:id', () => {
    it('should return service details', async () => {
      const mockService = {
        id: '1',
        name: 'EC2',
        description: 'Virtual servers',
        categoryId: 'cat1',
        category: { id: 'cat1', name: 'Compute', description: 'Computing services', color: '#ff0000' },
        memos: [],
        fromRelations: [],
        toRelations: [],
        createdAt: '2025-12-13T03:40:06.475Z',
        updatedAt: '2025-12-13T03:40:06.475Z',
      };

      mockPrisma.service.findUnique.mockResolvedValue(mockService);

      const response = await request(app).get('/api/services/1');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockService);
    });

    it('should return 404 for non-existent service', async () => {
      mockPrisma.service.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/services/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('SERVICE_NOT_FOUND');
    });
  });

  describe('POST /api/services', () => {
    it('should create a new service', async () => {
      const newService = {
        name: 'S3',
        description: 'Object storage',
        categoryId: 'cat2',
      };

      const mockCategory = { id: 'cat2', name: 'Storage' };
      const mockCreatedService = {
        id: '2',
        ...newService,
        category: { id: 'cat2', name: 'Storage', color: '#00ff00' },
        createdAt: '2025-12-13T03:40:06.484Z',
        updatedAt: '2025-12-13T03:40:06.484Z',
      };

      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.service.findUnique.mockResolvedValue(null); // No duplicate
      mockPrisma.service.create.mockResolvedValue(mockCreatedService);

      const response = await request(app)
        .post('/api/services')
        .send(newService);

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(mockCreatedService);
      expect(response.body.message).toBe('サービスが正常に作成されました。');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/services')
        .send({ description: 'Missing name and categoryId' });

      expect(response.status).toBe(400);
    });

    it('should return 409 for duplicate service name', async () => {
      const newService = {
        name: 'EC2',
        categoryId: 'cat1',
      };

      const mockCategory = { id: 'cat1', name: 'Compute' };
      const mockExistingService = { id: '1', name: 'EC2' };

      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.service.findUnique.mockResolvedValue(mockExistingService);

      const response = await request(app)
        .post('/api/services')
        .send(newService);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('DUPLICATE_SERVICE_NAME');
    });

    it('should return 400 for non-existent category', async () => {
      const newService = {
        name: 'NewService',
        categoryId: 'nonexistent',
      };

      mockPrisma.category.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/services')
        .send(newService);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });
  });

  describe('PUT /api/services/:id', () => {
    it('should update an existing service', async () => {
      const updateData = {
        name: 'EC2 Updated',
        description: 'Updated description',
      };

      const mockExistingService = {
        id: '1',
        name: 'EC2',
        description: 'Old description',
        categoryId: 'cat1',
      };

      const mockUpdatedService = {
        ...mockExistingService,
        ...updateData,
        category: { id: 'cat1', name: 'Compute', color: '#ff0000' },
        updatedAt: '2025-12-13T03:40:06.522Z',
      };

      mockPrisma.service.findUnique
        .mockResolvedValueOnce(mockExistingService) // First call to check existence
        .mockResolvedValueOnce(null); // Second call to check for duplicates
      mockPrisma.service.update.mockResolvedValue(mockUpdatedService);

      const response = await request(app)
        .put('/api/services/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockUpdatedService);
      expect(response.body.message).toBe('サービスが正常に更新されました。');
    });

    it('should return 404 for non-existent service', async () => {
      mockPrisma.service.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/services/nonexistent')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('SERVICE_NOT_FOUND');
    });
  });

  describe('DELETE /api/services/:id', () => {
    it('should delete an existing service', async () => {
      const mockExistingService = {
        id: '1',
        name: 'EC2',
        _count: { memos: 2, fromRelations: 1, toRelations: 1 },
      };

      mockPrisma.service.findUnique.mockResolvedValue(mockExistingService);
      mockPrisma.service.delete.mockResolvedValue(mockExistingService);

      const response = await request(app).delete('/api/services/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('サービスが正常に削除されました。');
      expect(response.body.details.deletedService.name).toBe('EC2');
      expect(response.body.details.cascadeDeleted.memos).toBe(2);
    });

    it('should return 404 for non-existent service', async () => {
      mockPrisma.service.findUnique.mockResolvedValue(null);

      const response = await request(app).delete('/api/services/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('SERVICE_NOT_FOUND');
    });
  });
});