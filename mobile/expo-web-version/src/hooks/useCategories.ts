import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../services/api';
import { queryKeys } from '../config/queryClient';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types/api';

// カテゴリ一覧取得
export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: categoriesApi.getAll,
  });
};

// カテゴリ詳細取得
export const useCategory = (id: string) => {
  return useQuery({
    queryKey: queryKeys.category(id),
    queryFn: () => categoriesApi.getById(id),
    enabled: !!id,
  });
};

// カテゴリ作成
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
};

// カテゴリ更新
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) => 
      categoriesApi.update(id, data),
    onSuccess: (updatedCategory) => {
      queryClient.setQueryData(queryKeys.category(updatedCategory.id), updatedCategory);
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
};

// カテゴリ削除
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: queryKeys.category(deletedId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
};

// カテゴリ並び順更新
export const useReorderCategories = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (categoryOrders: { id: string }[]) => categoriesApi.reorder(categoryOrders),
    onSuccess: (reorderedCategories) => {
      queryClient.setQueryData(queryKeys.categories, reorderedCategories);
    },
  });
};