import { QueryClient } from 'react-query';

// Enhanced error handler for queries
const queryErrorHandler = (error: unknown): void => {
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  console.error('Query error:', message);
  
  // You can add toast notifications here if needed
  // toast.error(message);
};

// Enhanced error handler for mutations
const mutationErrorHandler = (error: unknown): void => {
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  console.error('Mutation error:', message);
  
  // You can add toast notifications here if needed
  // toast.error(message);
};

// Create a query client with enhanced options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes - data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time: 10 minutes - data stays in cache for 10 minutes after becoming unused
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch behavior
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      // Error handling
      onError: queryErrorHandler,
      // Suspense support for React 18
      suspense: false,
      // Use error boundaries
      useErrorBoundary: false,
    },
    mutations: {
      // Retry failed mutations once for network errors only
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry once for network/server errors
        return failureCount < 1;
      },
      retryDelay: 1000,
      // Error handling
      onError: mutationErrorHandler,
      // Use error boundaries for mutations
      useErrorBoundary: false,
    },
  },
});

// Query client methods for manual cache management
export const queryUtils = {
  // Invalidate all queries
  invalidateAll: () => queryClient.invalidateQueries(),
  
  // Clear all cache
  clearCache: () => queryClient.clear(),
  
  // Prefetch a query
  prefetch: (queryKey: unknown[], queryFn: () => Promise<any>) => 
    queryClient.prefetchQuery(queryKey, queryFn),
  
  // Set query data manually
  setQueryData: (queryKey: unknown[], data: any) => 
    queryClient.setQueryData(queryKey, data),
  
  // Get query data from cache
  getQueryData: (queryKey: unknown[]) => 
    queryClient.getQueryData(queryKey),
};

export default queryClient;