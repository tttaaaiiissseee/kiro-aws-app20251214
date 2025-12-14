import request from 'supertest';
import express from 'express';

// Mock Prisma client
const mockPrisma = {
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as any;

// Mock the prisma import
jest.mock('../lib/prisma', () => mockPrisma);

import categoriesRouter from '../routes/categories';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/categories', categoriesRouter);

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

describe('Categories API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/categories', () => {
    it('should return list of categories', async () => {
      const mockCategories = [
        {
          id: 'cat1',
          name: 'Compute',
          description: 'Computing services',
          color: '#ff0000',
          _count: { services: 3 },
          createdAt: '2025-12-13T03:40:06.410Z',
          updatedAt: '2025-12-13T03:40:06.410Z',
        },
        {
          id: 'cat2',
          name: 'Storage',
          description: 'Storage services',
          color: '#00ff00',
          _count: { services: 2 },
          createdAt: '2025-12-13T03:40:06.410Z',
          updatedAt: '2025-12-13T03:40:06.410Z',
        },
      ];

      mockPrisma.category.findMany.mockResolvedValue(mockCategories);

      const response = await request(app).get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockCategories);
      expect(response.body.count).toBe(2);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              services: true,
            },
          },
        },
      });
    });
  });

  describe('POST /api/categories', () => {
    it('should create a new category', async () => {
      const newCategory = {
        name: 'Network',
        description: 'Networking services',
        color: '#0000ff',
      };

      const mockCreatedCategory = {
        id: 'cat3',
        ...newCategory,
        _count: { services: 0 },
        createdAt: '2025-12-13T03:40:06.484Z',
        updatedAt: '2025-12-13T03:40:06.484Z',
      };

      mockPrisma.category.findUnique.mockResolvedValue(null); // No duplicate
      mockPrisma.category.create.mockResolvedValue(mockCreatedCategory);

      const response = await request(app)
        .post('/api/categories')
        .send(newCategory);

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(mockCreatedCategory);
      expect(response.body.message).toBe('カテゴリが正常に作成されました。');
    });

    it('should create category with minimal data', async () => {
      const newCategory = {
        name: 'Security',
      };

      const mockCreatedCategory = {
        id: 'cat4',
        name: 'Security',
        description: null,
        color: null,
        _count: { services: 0 },
        createdAt: '2025-12-13T03:40:06.484Z',
        updatedAt: '2025-12-13T03:40:06.484Z',
      };

      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue(mockCreatedCategory);

      const response = await request(app)
        .post('/api/categories')
        .send(newCategory);

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(mockCreatedCategory);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ description: 'Missing name' });

      expect(response.status).toBe(400);
    });

    it('should return 409 for duplicate category name', async () => {
      const newCategory = {
        name: 'Compute',
      };

      const mockExistingCategory = { id: 'cat1', name: 'Compute' };

      mockPrisma.category.findUnique.mockResolvedValue(mockExistingCategory);

      const response = await request(app)
        .post('/api/categories')
        .send(newCategory);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('DUPLICATE_CATEGORY_NAME');
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update an existing category', async () => {
      const updateData = {
        name: 'Compute Updated',
        description: 'Updated computing services',
        color: '#ff00ff',
      };

      const mockExistingCategory = {
        id: 'cat1',
        name: 'Compute',
        description: 'Computing services',
        color: '#ff0000',
      };

      const mockUpdatedCategory = {
        ...mockExistingCategory,
        ...updateData,
        _count: { services: 3 },
        updatedAt: '2025-12-13T03:40:06.522Z',
      };

      mockPrisma.category.findUnique
        .mockResolvedValueOnce(mockExistingCategory) // First call to check existence
        .mockResolvedValueOnce(null); // Second call to check for duplicates
      mockPrisma.category.update.mockResolvedValue(mockUpdatedCategory);

      const response = await request(app)
        .put('/api/categories/cat1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockUpdatedCategory);
      expect(response.body.message).toBe('カテゴリが正常に更新されました。');
    });

    it('should update category with partial data', async () => {
      const updateData = {
        description: 'Updated description only',
      };

      const mockExistingCategory = {
        id: 'cat1',
        name: 'Compute',
        description: 'Old description',
        color: '#ff0000',
      };

      const mockUpdatedCategory = {
        ...mockExistingCategory,
        description: 'Updated description only',
        _count: { services: 3 },
        updatedAt: '2025-12-13T03:40:06.522Z',
      };

      mockPrisma.category.findUnique.mockResolvedValue(mockExistingCategory);
      mockPrisma.category.update.mockResolvedValue(mockUpdatedCategory);

      const response = await request(app)
        .put('/api/categories/cat1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockUpdatedCategory);
    });

    it('should return 404 for non-existent category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/categories/nonexistent')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('should return 409 for duplicate category name', async () => {
      const updateData = {
        name: 'Storage', // This name already exists
      };

      const mockExistingCategory = {
        id: 'cat1',
        name: 'Compute',
        description: 'Computing services',
        color: '#ff0000',
      };

      const mockDuplicateCategory = {
        id: 'cat2',
        name: 'Storage',
      };

      mockPrisma.category.findUnique
        .mockResolvedValueOnce(mockExistingCategory) // First call to check existence
        .mockResolvedValueOnce(mockDuplicateCategory); // Second call to check for duplicates

      const response = await request(app)
        .put('/api/categories/cat1')
        .send(updateData);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('DUPLICATE_CATEGORY_NAME');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete an existing category with no services', async () => {
      const mockExistingCategory = {
        id: 'cat1',
        name: 'Compute',
        _count: { services: 0 },
      };

      mockPrisma.category.findUnique.mockResolvedValue(mockExistingCategory);
      mockPrisma.category.delete.mockResolvedValue(mockExistingCategory);

      const response = await request(app).delete('/api/categories/cat1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('カテゴリが正常に削除されました。');
      expect(response.body.details.deletedCategory.name).toBe('Compute');
    });

    it('should return 404 for non-existent category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const response = await request(app).delete('/api/categories/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('should return 400 when trying to delete category with services', async () => {
      const mockExistingCategory = {
        id: 'cat1',
        name: 'Compute',
        _count: { services: 3 },
      };

      mockPrisma.category.findUnique.mockResolvedValue(mockExistingCategory);

      const response = await request(app).delete('/api/categories/cat1');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('CATEGORY_HAS_SERVICES');
      expect(response.body.error.details.serviceCount).toBe(3);
    });
  });
});