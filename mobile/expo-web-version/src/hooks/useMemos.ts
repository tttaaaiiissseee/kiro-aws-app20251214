import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memosApi } from '../services/api';
import { queryKeys } from '../config/queryClient';
import { Memo, CreateMemoRequest, UpdateMemoRequest } from '../types/api';

// サービスのメモ一覧取得
export const useMemos = (serviceId: string) => {
  return useQuery({
    queryKey: queryKeys.memos(serviceId),
    queryFn: () => memosApi.getByService(serviceId),
    enabled: !!serviceId,
  });
};

// メモ作成
export const useCreateMemo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: string; data: CreateMemoRequest }) => 
      memosApi.create(serviceId, data),
    onSuccess: (newMemo) => {
      // メモ一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: queryKeys.memos(newMemo.serviceId) });
      // サービス詳細のキャッシュも無効化（メモ数が変わるため）
      queryClient.invalidateQueries({ queryKey: queryKeys.service(newMemo.serviceId) });
    },
  });
};

// メモ更新
export const useUpdateMemo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemoRequest }) => 
      memosApi.update(id, data),
    onSuccess: (updatedMemo) => {
      // メモ一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: queryKeys.memos(updatedMemo.serviceId) });
    },
  });
};

// メモ削除
export const useDeleteMemo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => memosApi.delete(id),
    onSuccess: (_, deletedId) => {
      // 全てのメモキャッシュを無効化（serviceIdが分からないため）
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'memos'
      });
      // 全てのサービスキャッシュも無効化
      queryClient.invalidateQueries({ queryKey: queryKeys.services });
    },
  });
};