import prisma from './prisma';

/**
 * Initialize database connection and verify it's working
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🔌 Connecting to database...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection established');
    
    // Verify database is accessible by running a simple query
    const categoryCount = await prisma.category.count();
    console.log(`📊 Database contains ${categoryCount} categories`);
    
    // If no categories exist, suggest running seed
    if (categoryCount === 0) {
      console.log('💡 No categories found. Consider running: npm run db:seed');
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(): Promise<{ status: string; details: any }> {
  try {
    // Simple query to test database responsiveness
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;
    
    // Get basic statistics
    const [categoryCount, serviceCount, memoCount, relationCount] = await Promise.all([
      prisma.category.count(),
      prisma.service.count(),
      prisma.memo.count(),
      prisma.relation.count()
    ]);
    
    return {
      status: 'healthy',
      details: {
        responseTime: `${responseTime}ms`,
        statistics: {
          categories: categoryCount,
          services: serviceCount,
          memos: memoCount,
          relations: relationCount
        },
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    };
  }
}