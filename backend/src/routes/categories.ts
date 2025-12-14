import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { validateRequired, validateCategoryName, asyncHandler } from '../middleware/validation';

const router = Router();

// GET /api/categories - カテゴリ一覧取得
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
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

// PUT /api/categories/reorder - カテゴリ並び順更新
router.put('/reorder', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { categoryOrders } = req.body;
  
  if (!Array.isArray(categoryOrders)) {
    res.status(400).json({
      error: {
        code: 'INVALID_REQUEST_FORMAT',
        message: 'categoryOrdersは配列である必要があります。',
        details: { received: typeof categoryOrders }
      },
      timestamp: new Date().toISOString(),
      path: req.path
    });
    return;
  }
  
  try {
    // Validate all category IDs exist
    const categoryIds = categoryOrders.map((item: any) => item.id);
    const existingCategories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true }
    });
    
    if (existingCategories.length !== categoryIds.length) {
      res.status(400).json({
        error: {
          code: 'INVALID_CATEGORY_IDS',
          message: '存在しないカテゴリIDが含まれています。',
          details: { 
            provided: categoryIds.length,
            found: existingCategories.length
          }
        },
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
    
    // Update sort orders in a transaction
    await prisma.$transaction(
      categoryOrders.map((item: any, index: number) =>
        prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: index }
        })
      )
    );
    
    // Fetch updated categories
    const updatedCategories = await prisma.category.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: {
            services: true
          }
        }
      }
    });
    
    res.json({
      data: updatedCategories,
      message: 'カテゴリの並び順が正常に更新されました。',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error reordering categories:', error);
    throw new Error('カテゴリの並び順更新に失敗しました。');
  }
}));

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
          ...(color !== undefined && { color: color || null }),
          ...(req.body.sortOrder !== undefined && { sortOrder: req.body.sortOrder })
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