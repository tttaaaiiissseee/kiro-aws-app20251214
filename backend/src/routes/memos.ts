import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { validateRequired, validateMemoType, validateUrl, asyncHandler, ValidationError } from '../middleware/validation';
import { MemoType, isValidMemoType } from '../types/enums';
import fs from 'fs';
import path from 'path';

const router = Router();

// GET /api/services/:id/memos - サービスのメモ一覧取得
router.get('/:serviceId/memos', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { serviceId } = req.params;
  
  try {
    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });
    
    if (!service) {
      res.status(404).json({
        error: {
          code: 'SERVICE_NOT_FOUND',
          message: '指定されたサービスが見つかりません。',
          details: { serviceId }
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
    
    // Get memos for the service, ordered by creation time (newest first)
    const memos = await prisma.memo.findMany({
      where: { serviceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        content: true,
        title: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json({
      data: memos,
      count: memos.length,
      serviceId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching memos:', error);
    throw new Error('メモ一覧の取得に失敗しました。');
  }
}));

// POST /api/services/:id/memos - メモ作成
router.post('/:serviceId/memos',
  validateRequired(['type']),
  validateMemoType,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { serviceId } = req.params;
    const { type, content, title } = req.body;
    
    // Validate content is provided
    if (content === undefined || content === null) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'バリデーションエラーが発生しました。',
          details: { missingFields: ['content'] }
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
    
    try {
      // Check if service exists
      const service = await prisma.service.findUnique({
        where: { id: serviceId }
      });
      
      if (!service) {
        res.status(404).json({
          error: {
            code: 'SERVICE_NOT_FOUND',
            message: '指定されたサービスが見つかりません。',
            details: { serviceId }
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      // Validate content based on memo type
      if (type === MemoType.TEXT && content.trim().length === 0) {
        res.status(400).json({
          error: {
            code: 'INVALID_TEXT_CONTENT',
            message: 'テキストメモの内容は空にできません。',
            details: { type }
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      if (type === MemoType.LINK) {
        try {
          new URL(content);
        } catch (error) {
          res.status(400).json({
            error: {
              code: 'INVALID_URL_FORMAT',
              message: 'リンクメモには有効なURL形式が必要です。',
              details: { providedUrl: content }
            },
            timestamp: new Date().toISOString(),
            path: req.path
          });
          return;
        }
      }
      
      // Create memo
      const memo = await prisma.memo.create({
        data: {
          type,
          content: content.trim(),
          title: title ? title.trim() : null,
          serviceId
        }
      });
      
      res.status(201).json({
        data: memo,
        message: 'メモが正常に作成されました。',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating memo:', error);
      throw new Error('メモの作成に失敗しました。');
    }
  })
);

// PUT /api/memos/:id - メモ更新
router.put('/:id',
  validateMemoType,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { type, content, title } = req.body;
    
    try {
      // Check if memo exists
      const existingMemo = await prisma.memo.findUnique({
        where: { id }
      });
      
      if (!existingMemo) {
        res.status(404).json({
          error: {
            code: 'MEMO_NOT_FOUND',
            message: '指定されたメモが見つかりません。',
            details: { memoId: id }
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      // Validate content based on memo type (if type is being updated)
      const memoType = type || existingMemo.type;
      const memoContent = content !== undefined ? content : existingMemo.content;
      
      if (memoType === MemoType.TEXT && (!memoContent || memoContent.trim().length === 0)) {
        res.status(400).json({
          error: {
            code: 'INVALID_TEXT_CONTENT',
            message: 'テキストメモの内容は空にできません。',
            details: { type: memoType }
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      if (memoType === MemoType.LINK && memoContent) {
        try {
          new URL(memoContent);
        } catch (error) {
          res.status(400).json({
            error: {
              code: 'INVALID_URL_FORMAT',
              message: 'リンクメモには有効なURL形式が必要です。',
              details: { providedUrl: memoContent }
            },
            timestamp: new Date().toISOString(),
            path: req.path
          });
          return;
        }
      }
      
      // Update memo
      const updatedMemo = await prisma.memo.update({
        where: { id },
        data: {
          ...(type && { type }),
          ...(content !== undefined && { content: content.trim() }),
          ...(title !== undefined && { title: title ? title.trim() : null })
        }
      });
      
      res.json({
        data: updatedMemo,
        message: 'メモが正常に更新されました。',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating memo:', error);
      throw new Error('メモの更新に失敗しました。');
    }
  })
);

// DELETE /api/memos/:id - メモ削除
router.delete('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    // Check if memo exists
    const existingMemo = await prisma.memo.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!existingMemo) {
      res.status(404).json({
        error: {
          code: 'MEMO_NOT_FOUND',
          message: '指定されたメモが見つかりません。',
          details: { memoId: id }
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
    
    // If it's an image memo, delete the associated files
    if (existingMemo.type === MemoType.IMAGE && existingMemo.content) {
      const uploadsDir = path.join(__dirname, '../../uploads');
      const imagePath = path.join(uploadsDir, existingMemo.content);
      
      // Delete original image
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (error) {
          console.warn('Failed to delete image file:', imagePath, error);
        }
      }
      
      // Delete thumbnail (assuming it follows the naming convention)
      const fileExtension = path.extname(existingMemo.content);
      const baseName = path.basename(existingMemo.content, fileExtension);
      const thumbnailPath = path.join(uploadsDir, `${baseName}_thumb.jpg`);
      
      if (fs.existsSync(thumbnailPath)) {
        try {
          fs.unlinkSync(thumbnailPath);
        } catch (error) {
          console.warn('Failed to delete thumbnail file:', thumbnailPath, error);
        }
      }
    }
    
    // Delete memo
    await prisma.memo.delete({
      where: { id }
    });
    
    res.json({
      message: 'メモが正常に削除されました。',
      details: {
        deletedMemo: {
          id: existingMemo.id,
          type: existingMemo.type,
          title: existingMemo.title
        },
        service: existingMemo.service
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting memo:', error);
    throw new Error('メモの削除に失敗しました。');
  }
}));

export default router;