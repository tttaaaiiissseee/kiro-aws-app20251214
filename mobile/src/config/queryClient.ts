import { QueryClient } from '@tanstack/react-query';

// React Query設定
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // デフォルトのstaleTime（データが古いと判断される時間）
      staleTime: 5 * 60 * 1000, // 5分
      // デフォルトのcacheTime（キャッシュ保持時間）
      gcTime: 10 * 60 * 1000, // 10分
      // エラー時のリトライ設定
      retry: (failureCount, error: any) => {
        // ネットワークエラーの場合は3回まで、その他は1回まで
        if (error?.code === 'NETWORK_ERROR') {
          return failureCount < 3;
        }
        return failureCount < 1;
      },
      // リトライ間隔
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // ミューテーション失敗時のリトライ設定
      retry: false,
    },
  },
});

// クエリキー定数
export const queryKeys = {
  // Services
  services: ['services'] as const,
  service: (id: string) => ['services', id] as const,
  servicesByCategory: (categoryId: string) => ['services', 'category', categoryId] as const,
  
  // Categories
  categories: ['categories'] as const,
  category: (id: string) => ['categories', id] as const,
  
  // Memos
  memos: (serviceId: string) => ['memos', serviceId] as const,
  memo: (id: string) => ['memo', id] as const,
  
  // Relations
  relations: ['relations'] as const,
  
  // Search
  search: (params: any) => ['search', params] as const,
  
  // Comparison
  comparisonAttributes: ['comparison', 'attributes'] as const,
  comparison: (serviceIds: string[]) => ['comparison', serviceIds] as const,
};