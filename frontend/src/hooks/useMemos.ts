import { useQuery, useMutation, useQueryClient } from 'react-query';
import { memosApi } from '../services/api';
import {
  Memo,
  CreateMemoRequest,
  UpdateMemoRequest,
} from '../types/api';
import { serviceKeys } from './useServices';
import { apiUtils } from '../lib/api';

// Query keys factory for better organization
export const memoKeys = {
  all: ['memos'] as const,
  lists: () => [...memoKeys.all, 'list'] as const,
  list: (filters: string) => [...memoKeys.lists(), { filters }] as const,
  details: () => [...memoKeys.all, 'detail'] as const,
  detail: (id: string) => [...memoKeys.details(), id] as const,
  byService: (serviceId: string) => [...memoKeys.all, 'service', serviceId] as const,
  byType: (type: string) => [...memoKeys.all, 'type', type] as const,
};

// Enhanced memos by service query
export const useMemosByService = (
  serviceId: string,
  options?: { enabled?: boolean; sortBy?: 'createdAt' | 'updatedAt' | 'type' }
) => {
  return useQuery({
    queryKey: memoKeys.byService(serviceId),
    queryFn: () => memosApi.getByService(serviceId),
    enabled: !!serviceId && (options?.enabled !== false),
    select: (data: Memo[]) => {
      // Sort memos based on the specified criteria
      const sortBy = options?.sortBy || 'createdAt';
      return data.sort((a, b) => {
        if (sortBy === 'type') {
          return a.type.localeCompare(b.type);
        }
        // Default to date sorting (newest first)
        return new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime();
      });
    },
    onError: (error) => {
      console.error(`Failed to fetch memos for service ${serviceId}:`, apiUtils.getErrorMessage(error));
    },
  });
};

// Enhanced create memo with optimistic updates
export const useCreateMemo = (options?: {
  onSuccess?: (memo: Memo) => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: string; data: CreateMemoRequest }) =>
      memosApi.create(serviceId, data),
    onMutate: async ({ serviceId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(memoKeys.byService(serviceId));

      // Snapshot the previous value
      const previousMemos = queryClient.getQueryData<Memo[]>(memoKeys.byService(serviceId));

      // Optimistically update to the new value
      if (previousMemos) {
        const optimisticMemo: Memo = {
          id: `temp-${Date.now()}`,
          type: data.type,
          content: data.content,
          title: data.title,
          serviceId: serviceId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Add to the beginning of the list (newest first)
        queryClient.setQueryData(memoKeys.byService(serviceId), [optimisticMemo, ...previousMemos]);
      }

      return { previousMemos, serviceId };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousMemos && context?.serviceId) {
        queryClient.setQueryData(memoKeys.byService(context.serviceId), context.previousMemos);
      }
      console.error('Failed to create memo:', apiUtils.getErrorMessage(error));
      options?.onError?.(error);
    },
    onSuccess: (newMemo, variables) => {
      // Invalidate to get real data
      const serviceId = newMemo.serviceId || variables.serviceId;
      queryClient.invalidateQueries(memoKeys.byService(serviceId));
      queryClient.invalidateQueries(memoKeys.all);
      queryClient.invalidateQueries(serviceKeys.lists());
      options?.onSuccess?.(newMemo);
    },
  });
};

// Enhanced update memo with optimistic updates
export const useUpdateMemo = (options?: {
  onSuccess?: (memo: Memo) => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemoRequest }) =>
      memosApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Find the memo in cache to get its serviceId
      let serviceId: string | undefined;
      const allMemoQueries = queryClient.getQueriesData(memoKeys.all);
      
      for (const [_queryKey, queryData] of allMemoQueries) {
        if (Array.isArray(queryData)) {
          const memo = queryData.find((m: Memo) => m.id === id);
          if (memo) {
            serviceId = memo.serviceId;
            break;
          }
        }
      }

      if (!serviceId) return {};

      // Cancel queries
      await queryClient.cancelQueries(memoKeys.byService(serviceId));

      // Snapshot previous values
      const previousMemos = queryClient.getQueryData<Memo[]>(memoKeys.byService(serviceId));

      // Optimistically update
      if (previousMemos) {
        const updatedMemos = previousMemos.map(memo =>
          memo.id === id
            ? { ...memo, ...data, updatedAt: new Date().toISOString() }
            : memo
        );
        queryClient.setQueryData(memoKeys.byService(serviceId), updatedMemos);
      }

      return { previousMemos, serviceId };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousMemos && context?.serviceId) {
        queryClient.setQueryData(memoKeys.byService(context.serviceId), context.previousMemos);
      }
      console.error('Failed to update memo:', apiUtils.getErrorMessage(error));
      options?.onError?.(error);
    },
    onSuccess: (updatedMemo) => {
      // Invalidate to get real data
      if (updatedMemo.serviceId) {
        queryClient.invalidateQueries(memoKeys.byService(updatedMemo.serviceId));
      }
      queryClient.invalidateQueries(memoKeys.all);
      queryClient.invalidateQueries(serviceKeys.lists());
      options?.onSuccess?.(updatedMemo);
    },
  });
};

// Enhanced delete memo with optimistic updates
export const useDeleteMemo = (options?: {
  onSuccess?: (deletedId: string) => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => memosApi.delete(id),
    onMutate: async (id) => {
      // Find the memo in cache to get its serviceId
      let serviceId: string | undefined;
      let memoToDelete: Memo | undefined;
      const allMemoQueries = queryClient.getQueriesData(memoKeys.all);
      
      for (const [_queryKey, queryData] of allMemoQueries) {
        if (Array.isArray(queryData)) {
          const memo = queryData.find((m: Memo) => m.id === id);
          if (memo) {
            serviceId = memo.serviceId;
            memoToDelete = memo;
            break;
          }
        }
      }

      if (!serviceId) return {};

      // Cancel queries
      await queryClient.cancelQueries(memoKeys.byService(serviceId));

      // Snapshot previous values
      const previousMemos = queryClient.getQueryData<Memo[]>(memoKeys.byService(serviceId));

      // Optimistically remove from list
      if (previousMemos) {
        const filteredMemos = previousMemos.filter(memo => memo.id !== id);
        queryClient.setQueryData(memoKeys.byService(serviceId), filteredMemos);
      }

      return { previousMemos, serviceId, memoToDelete };
    },
    onError: (error, _id, context) => {
      // Rollback on error
      if (context?.previousMemos && context?.serviceId) {
        queryClient.setQueryData(memoKeys.byService(context.serviceId), context.previousMemos);
      }
      console.error('Failed to delete memo:', apiUtils.getErrorMessage(error));
      options?.onError?.(error);
    },
    onSuccess: (_, deletedId) => {
      // Invalidate all memo queries and services list
      queryClient.invalidateQueries(memoKeys.all);
      queryClient.invalidateQueries(serviceKeys.lists());
      options?.onSuccess?.(deletedId);
    },
  });
};

// Utility hook for memo statistics
export const useMemoStats = (serviceId?: string) => {
  const { data: memos } = useMemosByService(serviceId || '', { enabled: !!serviceId });

  return {
    totalMemos: memos?.length ?? 0,
    memosByType: memos?.reduce((acc, memo) => {
      acc[memo.type] = (acc[memo.type] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>) ?? {},
    recentMemos: memos?.slice(0, 5) ?? [], // Last 5 memos
    oldestMemo: memos?.length ? memos[memos.length - 1] : null,
    newestMemo: memos?.length ? memos[0] : null,
  };
};

// Utility hook for prefetching memos
export const usePrefetchMemos = () => {
  const queryClient = useQueryClient();

  return (serviceId: string) => {
    queryClient.prefetchQuery(
      memoKeys.byService(serviceId),
      () => memosApi.getByService(serviceId),
      {
        staleTime: 2 * 60 * 1000, // 2 minutes
      }
    );
  };
};