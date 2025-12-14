import { Router, Request, Response } from 'express';
import { upload } from '../index';
import { asyncHandler } from '../middleware/validation';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const router = Router();

// POST /api/upload - 画像アップロード
router.post('/', upload.single('image'), asyncHandler(async (req: Request, res: Response): Promise<void> => {
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

  try {
    const originalPath = req.file.path;
    const filename = req.file.filename;
    const fileExtension = path.extname(filename);
    const baseName = path.basename(filename, fileExtension);
    
    // Generate thumbnail
    const thumbnailFilename = `${baseName}_thumb${fileExtension}`;
    const thumbnailPath = path.join(path.dirname(originalPath), thumbnailFilename);
    
    // Create thumbnail using sharp (300x300 max, maintain aspect ratio)
    await sharp(originalPath)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 }) // Convert to JPEG for consistency
      .toFile(thumbnailPath.replace(fileExtension, '.jpg'));
    
    // Update thumbnail filename to reflect JPEG conversion
    const finalThumbnailFilename = `${baseName}_thumb.jpg`;
    
    // Get file stats
    const stats = fs.statSync(originalPath);
    
    res.status(201).json({
      data: {
        filename: filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: Number(stats.size),
        thumbnail: finalThumbnailFilename,
        url: `/api/files/${filename}`,
        thumbnailUrl: `/api/files/${finalThumbnailFilename}`
      },
      message: '画像が正常にアップロードされました。',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing uploaded image:', error);
    
    // Clean up uploaded file if processing failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      error: {
        code: 'IMAGE_PROCESSING_ERROR',
        message: '画像の処理中にエラーが発生しました。',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
}));

// GET /api/files/:filename - ファイル取得
// This is handled by express.static middleware in the main server file
// But we can add a route for additional metadata if needed
router.get('/:filename', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { filename } = req.params;
  const uploadsDir = path.join(__dirname, '../../uploads');
  const filePath = path.join(uploadsDir, filename);
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        error: {
          code: 'FILE_NOT_FOUND',
          message: '指定されたファイルが見つかりません。',
          details: { filename }
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    const fileExtension = path.extname(filename).toLowerCase();
    
    // Determine content type
    let contentType = 'application/octet-stream';
    switch (fileExtension) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', Number(stats.size));
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('ETag', `"${stats.mtime.getTime()}-${Number(stats.size)}"`);
    
    // Check if client has cached version
    const clientETag = req.headers['if-none-match'];
    if (clientETag === `"${stats.mtime.getTime()}-${Number(stats.size)}"`) {
      res.status(304).end();
      return;
    }
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({
      error: {
        code: 'FILE_SERVE_ERROR',
        message: 'ファイルの配信中にエラーが発生しました。',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
}));

export default router;