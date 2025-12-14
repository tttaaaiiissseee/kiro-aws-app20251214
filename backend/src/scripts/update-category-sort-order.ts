import prisma from '../lib/prisma';

async function updateCategorySortOrder() {
  try {
    console.log('既存カテゴリのsortOrderを更新中...');
    
    // 既存のカテゴリを名前順で取得
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    
    // 各カテゴリにsortOrderを設定
    for (let i = 0; i < categories.length; i++) {
      await prisma.category.update({
        where: { id: categories[i].id },
        data: { sortOrder: i }
      });
      console.log(`${categories[i].name}: sortOrder = ${i}`);
    }
    
    console.log(`${categories.length}個のカテゴリのsortOrderを更新しました。`);
  } catch (error) {
    console.error('sortOrder更新エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCategorySortOrder();