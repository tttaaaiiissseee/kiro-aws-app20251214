import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { validateRequired, validateCategoryName, asyncHandler } from '../middleware/validation';

const router = Router();

// GET /api/categories - カテゴリ一覧取得
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            services: true
          }
        }
      }
    });
    
    res.json({
      data: categories,
      count: categories.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('カテゴリ一覧の取得に失敗しました。');
  }
}));

// POST /api/categories - カテゴリ作成
router.post('/', 
  validateRequired(['name']),
  validateCategoryName,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, description, color } = req.body;
    
    try {
      // Check for duplicate category name
      const existingCategory = await prisma.category.findUnique({
        where: { name }
      });
      
      if (existingCategory) {
        res.status(409).json({
          error: {
            code: 'DUPLICATE_CATEGORY_NAME',
            message: '同じ名前のカテゴリが既に存在します。',
            details: { categoryName: name }
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      // Create category
      const category = await prisma.category.create({
        data: {
          name,
          description: description || null,
          color: color || null
        },
        include: {
          _count: {
            select: {
              services: true
            }
          }
        }
      });
      
      res.status(201).json({
        data: category,
        message: 'カテゴリが正常に作成されました。',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating category:', error);
      throw new Error('カテゴリの作成に失敗しました。');
    }
  })
);

// PUT /api/categories/:id - カテゴリ更新
router.put('/:id',
  validateCategoryName,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, description, color } = req.body;
    
    try {
      // Check if category exists
      const existingCategory = await prisma.category.findUnique({
        where: { id }
      });
      
      if (!existingCategory) {
        res.status(404).json({
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: '指定されたカテゴリが見つかりません。',
            details: { categoryId: id }
          },
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }
      
      // If name is being updated, check for duplicates
      if (name && name !== existingCategory.name) {
        const duplicateCategory = await prisma.category.findUnique({
          where: { name }
        });
        
        if (duplicateCategory) {
          res.status(409).json({
            error: {
              code: 'DUPLICATE_CATEGORY_NAME',
              message: '同じ名前のカテゴリが既に存在します。',
              details: { categoryName: name }
            },
            timestamp: new Date().toISOString(),
            path: req.path
          });
          return;
        }
      }
      
      // Update category
      const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description: description || null }),
          ...(color !== undefined && { color: color || null })
        },
        include: {
          _count: {
            select: {
              services: true
            }
          }
        }
      });
      
      res.json({
        data: updatedCategory,
        message: 'カテゴリが正常に更新されました。',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating category:', error);
      throw new Error('カテゴリの更新に失敗しました。');
    }
  })
);

// DELETE /api/categories/:id - カテゴリ削除
router.delete('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    // Check if category exists and get service count
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            services: true
          }
        }
      }
    });
    
    if (!existingCategory) {
      res.status(404).json({
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: '指定されたカテゴリが見つかりません。',
          details: { categoryId: id }
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
    
    // Check if category has associated services
    if (existingCategory._count.services > 0) {
      res.status(400).json({
        error: {
          code: 'CATEGORY_HAS_SERVICES',
          message: 'このカテゴリには関連するサービスが存在するため削除できません。',
          details: { 
            categoryId: id,
            categoryName: existingCategory.name,
            serviceCount: existingCategory._count.services
          }
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
    
    // Delete category
    await prisma.category.delete({
      where: { id }
    });
    
    res.json({
      message: 'カテゴリが正常に削除されました。',
      details: {
        deletedCategory: {
          id: existingCategory.id,
          name: existingCategory.name
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    throw new Error('カテゴリの削除に失敗しました。');
  }
}));

export default router;