import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '../services/api';
import { queryKeys } from '../config/queryClient';
import { Service, CreateServiceRequest, UpdateServiceRequest, SearchParams } from '../types/api';

// サービス一覧取得
export const useServices = () => {
  return useQuery({
    queryKey: queryKeys.services,
    queryFn: servicesApi.getAll,
  });
};

// サービス詳細取得
export const useService = (id: string) => {
  return useQuery({
    queryKey: queryKeys.service(id),
    queryFn: () => servicesApi.getById(id),
    enabled: !!id,
  });
};

// カテゴリ別サービス取得
export const useServicesByCategory = (categoryId: string) => {
  return useQuery({
    queryKey: queryKeys.servicesByCategory(categoryId),
    queryFn: () => servicesApi.getByCategory(categoryId),
    enabled: !!categoryId,
  });
};

// サービス検索
export const useSearchServices = (params: SearchParams) => {
  return useQuery({
    queryKey: queryKeys.search(params),
    queryFn: () => servicesApi.search(params),
    enabled: !!params.q || !!params.category,
  });
};

// サービス作成
export const useCreateService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateServiceRequest) => servicesApi.create(data),
    onSuccess: () => {
      // キャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: queryKeys.services });
    },
  });
};

// サービス更新
export const useUpdateService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceRequest }) => 
      servicesApi.update(id, data),
    onSuccess: (updatedService) => {
      // 個別サービスのキャッシュを更新
      queryClient.setQueryData(queryKeys.service(updatedService.id), updatedService);
      // サービス一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: queryKeys.services });
    },
  });
};

// サービス削除
export const useDeleteService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess: (_, deletedId) => {
      // 削除されたサービスのキャッシュを削除
      queryClient.removeQueries({ queryKey: queryKeys.service(deletedId) });
      // サービス一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: queryKeys.services });
    },
  });
};