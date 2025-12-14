import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { relationsApi } from '../services/api';
import { queryKeys } from '../config/queryClient';
import { Relation, CreateRelationRequest } from '../types/api';

// 関係性一覧取得
export const useRelations = () => {
  return useQuery({
    queryKey: queryKeys.relations,
    queryFn: relationsApi.getAll,
  });
};

// 関係性作成
export const useCreateRelation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateRelationRequest) => relationsApi.create(data),
    onSuccess: () => {
      // 関係性一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: queryKeys.relations });
    },
  });
};

// 関係性削除
export const useDeleteRelation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => relationsApi.delete(id),
    onSuccess: () => {
      // 関係性一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: queryKeys.relations });
    },
  });
};