import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { initializeDatabase, checkDatabaseHealth } from './lib/database';

const app = express();
const PORT = process.env.PORT || 8000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for images only
const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Single file upload
  }
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin requests for uploaded files
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000', // Web frontend
  'http://localhost:3001', // Mobile frontend
  process.env.FRONTEND_URL || ''
].filter(origin => origin !== '');

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/api/files', express.static(uploadsDir));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoints
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    res.json({ 
      status: 'OK', 
      message: 'AWS学習アプリ バックエンドが正常に動作しています',
      database: dbHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'サービスが利用できません',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    res.json({ 
      status: 'OK', 
      message: 'AWS学習アプリ バックエンドが正常に動作しています',
      database: dbHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'サービスが利用できません',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Import routes
import servicesRouter from './routes/services';
import memosRouter from './routes/memos';
import uploadRouter from './routes/upload';
import categoriesRouter from './routes/categories';
import searchRouter from './routes/search';
import relationsRouter from './routes/relations';
import comparisonRouter from './routes/comparison';

// API routes
app.use('/api/services', servicesRouter);
app.use('/api/services', memosRouter);
app.use('/api/memos', memosRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/files', uploadRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/search', searchRouter);
app.use('/api/relations', relationsRouter);
app.use('/api/comparison', comparisonRouter);

app.get('/api', (req, res) => {
  res.json({ 
    message: 'AWS学習アプリ API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      services: '/api/services',
      memos: '/api/memos',
      categories: '/api/categories',
      upload: '/api/upload',
      search: '/api/search',
      relations: '/api/relations',
      comparison: '/api/comparison'
    }
  });
});

// Global error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'ファイルサイズが大きすぎます。5MB以下のファイルをアップロードしてください。',
          details: { maxSize: '5MB' }
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        error: {
          code: 'INVALID_FILE_FIELD',
          message: '無効なファイルフィールドです。',
          details: { expectedField: 'image' }
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
  }

  // Handle file type errors
  if (err.message.includes('Invalid file type')) {
    res.status(400).json({
      error: {
        code: 'INVALID_FILE_TYPE',
        message: '無効なファイル形式です。JPEG、PNG、GIF、WebP形式の画像のみアップロード可能です。',
        details: { allowedTypes: ['JPEG', 'PNG', 'GIF', 'WebP'] }
      },
      timestamp: new Date().toISOString(),
      path: req.path
    });
    return;
  }

  // Handle validation errors
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

  // Handle database errors
  if (err.code === 'P2002') { // Prisma unique constraint error
    res.status(409).json({
      error: {
        code: 'DUPLICATE_ENTRY',
        message: '重複するデータが存在します。',
        details: err.meta
      },
      timestamp: new Date().toISOString(),
      path: req.path
    });
    return;
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: statusCode === 500 ? 'サーバー内部エラーが発生しました。' : err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: '指定されたルートが見つかりません。',
      details: { path: req.originalUrl, method: req.method }
    },
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// Start server with database initialization
async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📁 Uploads directory: ${uploadsDir}`);
      console.log(`🌐 CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API endpoint: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();