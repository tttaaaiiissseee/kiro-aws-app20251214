import request from 'supertest';
import express from 'express';
import { MemoType } from '../types/enums';

// Mock Prisma client
const mockPrisma = {
  service: {
    findUnique: jest.fn(),
  },
  memo: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as any;

// Mock the prisma import
jest.mock('../lib/prisma', () => mockPrisma);

// Mock fs for file operations
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

import memosRouter from '../routes/memos';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/services', memosRouter);
app.use('/api/memos', memosRouter);

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

describe('Memos API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/services/:serviceId/memos', () => {
    it('should return memos for a service', async () => {
      const mockService = { id: 'service1', name: 'EC2' };
      const mockMemos = [
        {
          id: 'memo1',
          type: MemoType.TEXT,
          content: 'This is a text memo',
          title: 'Test Memo',
          createdAt: '2025-12-13T03:40:06.410Z',
          updatedAt: '2025-12-13T03:40:06.410Z',
        },
        {
          id: 'memo2',
          type: MemoType.LINK,
          content: 'https://example.com',
          title: 'Useful Link',
          createdAt: '2025-12-13T03:40:06.420Z',
          updatedAt: '2025-12-13T03:40:06.420Z',
        },
      ];

      mockPrisma.service.findUnique.mockResolvedValue(mockService);
      mockPrisma.memo.findMany.mockResolvedValue(mockMemos);

      const response = await request(app).get('/api/services/service1/memos');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockMemos);
      expect(response.body.count).toBe(2);
      expect(response.body.serviceId).toBe('service1');
      expect(mockPrisma.memo.findMany).toHaveBeenCalledWith({
        where: { serviceId: 'service1' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          content: true,
          title: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should return 404 for non-existent service', async () => {
      mockPrisma.service.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/services/nonexistent/memos');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('SERVICE_NOT_FOUND');
    });
  });

  describe('POST /api/services/:serviceId/memos', () => {
    it('should create a text memo', async () => {
      const mockService = { id: 'service1', name: 'EC2' };
      const newMemo = {
        type: MemoType.TEXT,
        content: 'This is a new text memo',
        title: 'New Memo',
      };

      const mockCreatedMemo = {
        id: 'memo1',
        ...newMemo,
        serviceId: 'service1',
        createdAt: '2025-12-13T03:40:06.410Z',
        updatedAt: '2025-12-13T03:40:06.410Z',
      };

      mockPrisma.service.findUnique.mockResolvedValue(mockService);
      mockPrisma.memo.create.mockResolvedValue(mockCreatedMemo);

      const response = await request(app)
        .post('/api/services/service1/memos')
        .send(newMemo);

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(mockCreatedMemo);
      expect(response.body.message).toBe('メモが正常に作成されました。');
    });

    it('should create a link memo with valid URL', async () => {
      const mockService = { id: 'service1', name: 'EC2' };
      const newMemo = {
        type: MemoType.LINK,
        content: 'https://aws.amazon.com/ec2/',
        title: 'EC2 Documentation',
      };

      const mockCreatedMemo = {
        id: 'memo2',
        ...newMemo,
        serviceId: 'service1',
        createdAt: '2025-12-13T03:40:06.420Z',
        updatedAt: '2025-12-13T03:40:06.420Z',
      };

      mockPrisma.service.findUnique.mockResolvedValue(mockService);
      mockPrisma.memo.create.mockResolvedValue(mockCreatedMemo);

      const response = await request(app)
        .post('/api/services/service1/memos')
        .send(newMemo);

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(mockCreatedMemo);
    });

    it('should return 400 for invalid URL in link memo', async () => {
      const mockService = { id: 'service1', name: 'EC2' };
      const newMemo = {
        type: MemoType.LINK,
        content: 'not-a-valid-url',
        title: 'Invalid Link',
      };

      mockPrisma.service.findUnique.mockResolvedValue(mockService);

      const response = await request(app)
        .post('/api/services/service1/memos')
        .send(newMemo);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_URL_FORMAT');
    });

    it('should return 400 for empty text memo content', async () => {
      const mockService = { id: 'service1', name: 'EC2' };
      const newMemo = {
        type: MemoType.TEXT,
        content: '   ', // Only whitespace
        title: 'Empty Memo',
      };

      mockPrisma.service.findUnique.mockResolvedValue(mockService);

      const response = await request(app)
        .post('/api/services/service1/memos')
        .send(newMemo);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_TEXT_CONTENT');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/services/service1/memos')
        .send({ title: 'Missing type and content' });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent service', async () => {
      mockPrisma.service.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/services/nonexistent/memos')
        .send({
          type: MemoType.TEXT,
          content: 'Test memo',
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('SERVICE_NOT_FOUND');
    });
  });

  describe('PUT /api/memos/:id', () => {
    it('should update an existing memo', async () => {
      const updateData = {
        content: 'Updated memo content',
        title: 'Updated Title',
      };

      const mockExistingMemo = {
        id: 'memo1',
        type: MemoType.TEXT,
        content: 'Original content',
        title: 'Original Title',
        serviceId: 'service1',
      };

      const mockUpdatedMemo = {
        ...mockExistingMemo,
        ...updateData,
        updatedAt: '2025-12-13T03:40:06.430Z',
      };

      mockPrisma.memo.findUnique.mockResolvedValue(mockExistingMemo);
      mockPrisma.memo.update.mockResolvedValue(mockUpdatedMemo);

      const response = await request(app)
        .put('/api/memos/memo1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockUpdatedMemo);
      expect(response.body.message).toBe('メモが正常に更新されました。');
    });

    it('should return 404 for non-existent memo', async () => {
      mockPrisma.memo.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/memos/nonexistent')
        .send({ content: 'Updated content' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('MEMO_NOT_FOUND');
    });
  });

  describe('DELETE /api/memos/:id', () => {
    it('should delete an existing text memo', async () => {
      const mockExistingMemo = {
        id: 'memo1',
        type: MemoType.TEXT,
        content: 'Text memo content',
        title: 'Text Memo',
        service: { id: 'service1', name: 'EC2' },
      };

      mockPrisma.memo.findUnique.mockResolvedValue(mockExistingMemo);
      mockPrisma.memo.delete.mockResolvedValue(mockExistingMemo);

      const response = await request(app).delete('/api/memos/memo1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('メモが正常に削除されました。');
      expect(response.body.details.deletedMemo.id).toBe('memo1');
      expect(response.body.details.service.name).toBe('EC2');
    });

    it('should return 404 for non-existent memo', async () => {
      mockPrisma.memo.findUnique.mockResolvedValue(null);

      const response = await request(app).delete('/api/memos/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('MEMO_NOT_FOUND');
    });
  });
});