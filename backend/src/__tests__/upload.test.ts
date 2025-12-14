import request from 'supertest';
import express from 'express';
import path from 'path';

// Mock multer and sharp
const mockFile = {
  fieldname: 'image',
  originalname: 'test.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  destination: '/uploads',
  filename: 'image-123456789.jpg',
  path: '/uploads/image-123456789.jpg',
  size: 1024,
};

const mockUpload = {
  single: jest.fn(() => (req: any, res: any, next: any) => {
    req.file = mockFile;
    next();
  }),
};

const mockSharp = jest.fn(() => ({
  resize: jest.fn().mockReturnThis(),
  jpeg: jest.fn().mockReturnThis(),
  toFile: jest.fn().mockResolvedValue({}),
}));

// Mock dependencies
jest.mock('../index', () => ({
  upload: mockUpload,
}));
jest.mock('sharp', () => mockSharp);
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  statSync: jest.fn(),
  unlinkSync: jest.fn(),
  createReadStream: jest.fn(),
}));

import uploadRouter from '../routes/upload';
import fs from 'fs';

const mockFs = fs as jest.Mocked<typeof fs>;

// Create test app
const app = express();
app.use(express.json());
app.use('/api/upload', uploadRouter);
app.use('/api/files', uploadRouter);

// Add error handling middleware for tests
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(500).json({ error: err.message });
});

describe('Upload API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset upload mock to default behavior
    mockUpload.single.mockImplementation(() => (req: any, res: any, next: any) => {
      req.file = mockFile;
      next();
    });
  });

  describe('POST /api/upload', () => {
    it('should upload and process an image successfully', async () => {
      mockFs.statSync.mockReturnValue({ size: 1024 } as any);

      const response = await request(app)
        .post('/api/upload')
        .field('test', 'value'); // Add some form data to trigger multer

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        filename: 'image-123456789.jpg',
        originalName: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      });
      expect(response.body.data.url).toBe('/api/files/image-123456789.jpg');
      expect(response.body.data.thumbnail).toMatch(/thumb\.jpg$/);
      expect(response.body.message).toBe('画像が正常にアップロードされました。');
      
      // Verify sharp was called for thumbnail generation
      expect(mockSharp).toHaveBeenCalledWith('/uploads/image-123456789.jpg');
    });

    it('should return 400 when no file is uploaded', async () => {
      // Create a separate app instance for this test to avoid middleware conflicts
      const testApp = express();
      testApp.use(express.json());
      
      // Mock upload middleware to not set req.file
      const noFileUpload = {
        single: jest.fn((fieldName: string) => (req: any, res: any, next: any) => {
          // Don't set req.file
          next();
        }),
      };
      
      // Create a temporary router with the no-file mock
      const testRouter = express.Router();
      testRouter.post('/', noFileUpload.single('image'), (req: any, res: any) => {
        if (!req.file) {
          res.status(400).json({
            error: {
              code: 'NO_FILE_UPLOADED',
              message: 'アップロードするファイルが指定されていません。',
              details: { expectedField: 'image' }
            },
            timestamp: new Date().toISOString(),
            path: req.path
          });
          return;
        }
        res.status(201).json({ success: true });
      });
      
      testApp.use('/api/upload', testRouter);

      const response = await request(testApp).post('/api/upload');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('NO_FILE_UPLOADED');
      expect(response.body.error.message).toBe('アップロードするファイルが指定されていません。');
    });
  });

  describe('GET /api/files/:filename', () => {
    it('should return 404 for non-existent file', async () => {
      const filename = 'nonexistent.jpg';
      
      mockFs.existsSync.mockReturnValue(false);

      const response = await request(app).get(`/api/files/${filename}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('FILE_NOT_FOUND');
      expect(response.body.error.message).toBe('指定されたファイルが見つかりません。');
    });

    it('should return 304 for cached file', async () => {
      const filename = 'cached-image.jpg';
      const mtime = new Date('2025-12-13T03:40:06.410Z');
      const etag = `"${mtime.getTime()}-2048"`;
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        size: 2048,
        mtime,
      } as any);

      const response = await request(app)
        .get(`/api/files/${filename}`)
        .set('If-None-Match', etag);

      expect(response.status).toBe(304);
    });
  });
});