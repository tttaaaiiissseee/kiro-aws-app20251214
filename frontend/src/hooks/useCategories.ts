import { useQuery, useMutation, useQueryClient } from 'react-query';
import { categoriesApi } from '../services/api';
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types/api';
import { apiUtils } from '../lib/api';
import { serviceKeys } from './useServices';

// Query keys factory for better organization
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters: string) => [...categoryKeys.lists(), { filters }] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
  withServices: () => [...categoryKeys.all, 'withServices'] as const,
};

// Enhanced categories query with better error handling
export const useCategories = (options?: {
  enabled?: boolean;
  includeServiceCount?: boolean;
}) => {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: categoriesApi.getAll,
    enabled: options?.enabled,
    select: (data: Category[]) => {
      // Categories are already sorted by sortOrder and name from the backend
      return data;
    },
    onError: (error) => {
      console.error('Failed to fetch categories:', apiUtils.getErrorMessage(error));
    },
  });
};

// Enhanced category detail query
export const useCategory = (id: string, options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => categoriesApi.getById(id),
    enabled: !!id && (options?.enabled !== false),
    onSuccess: (category) => {
      // Update the category in the categories list cache if it exists
      queryClient.setQueryData<Category[]>(categoryKeys.lists(), (oldData) => {
        if (!oldData) return [];
        const index = oldData.findIndex(c => c.id === category.id);
        if (index >= 0) {
          const newData = [...oldData];
          newData[index] = category;
          return newData;
        }
        return oldData;
      });
    },
    onError: (error) => {
      console.error(`Failed to fetch category ${id}:`, apiUtils.getErrorMessage(error));
    },
  });
};

// Enhanced create category with optimistic updates
export const useCreateCategory = (options?: {
  onSuccess?: (category: Category) => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoriesApi.create(data),
    onMutate: async (newCategory) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(categoryKeys.lists());

      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData<Category[]>(categoryKeys.lists());

      // Optimistically update to the new value
      if (previousCategories) {
        const optimisticCategory: Category = {
          id: `temp-${Date.now()}`,
          name: newCategory.name,
          description: newCategory.description,
          color: newCategory.color,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _count: { services: 0 },
        };

        queryClient.setQueryData(categoryKeys.lists(), [...previousCategories, optimisticCategory]);
      }

      return { previousCategories };
    },
    onError: (error, _newCategory, context) => {
      // Rollback on error
      if (context?.previousCategories) {
        queryClient.setQueryData(categoryKeys.lists(), context.previousCategories);
      }
      console.error('Failed to create category:', apiUtils.getErrorMessage(error));
      options?.onError?.(error);
    },
    onSuccess: (createdCategory) => {
      // Invalidate and refetch to get the real data
      queryClient.invalidateQueries(categoryKeys.lists());
      options?.onSuccess?.(createdCategory);
    },
  });
};

// Enhanced update category with optimistic updates
export const useUpdateCategory = (options?: {
  onSuccess?: (category: Category) => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      categoriesApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel queries
      await queryClient.cancelQueries(categoryKeys.detail(id));
      await queryClient.cancelQueries(categoryKeys.lists());

      // Snapshot previous values
      const previousCategory = queryClient.getQueryData<Category>(categoryKeys.detail(id));
      const previousCategories = queryClient.getQueryData<Category[]>(categoryKeys.lists());

      // Optimistically update
      if (previousCategory) {
        const optimisticCategory = {
          ...previousCategory,
          ...data,
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData(categoryKeys.detail(id), optimisticCategory);
      }

      if (previousCategories) {
        const updatedCategories = previousCategories.map(category =>
          category.id === id
            ? { ...category, ...data, updatedAt: new Date().toISOString() }
            : category
        );
        queryClient.setQueryData(categoryKeys.lists(), updatedCategories);
      }

      return { previousCategory, previousCategories };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousCategory) {
        queryClient.setQueryData(categoryKeys.detail(_variables.id), context.previousCategory);
      }
      if (context?.previousCategories) {
        queryClient.setQueryData(categoryKeys.lists(), context.previousCategories);
      }
      console.error('Failed to update category:', apiUtils.getErrorMessage(error));
      options?.onError?.(error);
    },
    onSuccess: (updatedCategory) => {
      // Update cache with real data
      queryClient.setQueryData(categoryKeys.detail(updatedCategory.id), updatedCategory);
      queryClient.invalidateQueries(categoryKeys.lists());
      // Also invalidate services since category name might have changed
      queryClient.invalidateQueries(serviceKeys.lists());
      options?.onSuccess?.(updatedCategory);
    },
  });
};

// Enhanced delete category with optimistic updates
export const useDeleteCategory = (options?: {
  onSuccess?: (deletedId: string) => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onMutate: async (id) => {
      // Cancel queries
      await queryClient.cancelQueries(categoryKeys.lists());

      // Snapshot previous values
      const previousCategories = queryClient.getQueryData<Category[]>(categoryKeys.lists());

      // Optimistically remove from list
      if (previousCategories) {
        const filteredCategories = previousCategories.filter(category => category.id !== id);
        queryClient.setQueryData(categoryKeys.lists(), filteredCategories);
      }

      return { previousCategories };
    },
    onError: (error, _id, context) => {
      // Rollback on error
      if (context?.previousCategories) {
        queryClient.setQueryData(categoryKeys.lists(), context.previousCategories);
      }
      console.error('Failed to delete category:', apiUtils.getErrorMessage(error));
      options?.onError?.(error);
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache and invalidate
      queryClient.removeQueries(categoryKeys.detail(deletedId));
      queryClient.invalidateQueries(categoryKeys.lists());
      // Also invalidate services since they might be affected
      queryClient.invalidateQueries(serviceKeys.lists());
      options?.onSuccess?.(deletedId);
    },
  });
};

// Utility hook for prefetching categories
export const usePrefetchCategory = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery(
      categoryKeys.detail(id),
      () => categoriesApi.getById(id),
      {
        staleTime: 5 * 60 * 1000, // 5 minutes
      }
    );
  };
};

// Utility hook for category statistics
export const useCategoryStats = () => {
  const { data: categories } = useCategories();

  return {
    totalCategories: categories?.length ?? 0,
    categoriesWithServices: categories?.filter(category => (category._count?.services ?? 0) > 0).length ?? 0,
    averageServicesPerCategory: categories?.length 
      ? categories.reduce((sum, category) => sum + (category._count?.services ?? 0), 0) / categories.length 
      : 0,
    mostPopularCategory: categories?.reduce((max, category) => 
      (category._count?.services ?? 0) > (max._count?.services ?? 0) ? category : max
    , categories[0]) ?? null,
  };
};

// Enhanced reorder categories with optimistic updates
export const useReorderCategories = (options?: {
  onSuccess?: (categories: Category[]) => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryOrders: { id: string }[]) => categoriesApi.reorder(categoryOrders),
    onMutate: async (categoryOrders) => {
      // Cancel queries
      await queryClient.cancelQueries(categoryKeys.lists());

      // Snapshot previous values
      const previousCategories = queryClient.getQueryData<Category[]>(categoryKeys.lists());

      // Optimistically update
      if (previousCategories) {
        const reorderedCategories = categoryOrders.map((order, index) => {
          const category = previousCategories.find(c => c.id === order.id);
          return category ? { ...category, sortOrder: index } : null;
        }).filter(Boolean) as Category[];
        
        queryClient.setQueryData(categoryKeys.lists(), reorderedCategories);
      }

      return { previousCategories };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousCategories) {
        queryClient.setQueryData(categoryKeys.lists(), context.previousCategories);
      }
      console.error('Failed to reorder categories:', apiUtils.getErrorMessage(error));
      options?.onError?.(error);
    },
    onSuccess: (reorderedCategories) => {
      // Update cache with real data
      queryClient.setQueryData(categoryKeys.lists(), reorderedCategories);
      options?.onSuccess?.(reorderedCategories);
    },
  });
};

// Utility hook for getting category colors
export const useCategoryColors = () => {
  const { data: categories } = useCategories();

  return categories?.reduce((acc, category) => {
    if (category.color) {
      acc[category.id] = category.color;
    }
    return acc;
  }, {} as Record<string, string>) ?? {};
};