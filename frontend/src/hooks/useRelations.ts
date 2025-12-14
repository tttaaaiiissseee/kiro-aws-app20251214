import { useQuery, useMutation, useQueryClient } from 'react-query';
import { relationsApi } from '../services/api';
import {
  Relation,
  CreateRelationRequest,
} from '../types/api';
import { apiUtils } from '../lib/api';

// Query keys factory for better organization
export const relationKeys = {
  all: ['relations'] as const,
  lists: () => [...relationKeys.all, 'list'] as const,
  list: (filters: string) => [...relationKeys.lists(), { filters }] as const,
  byService: (serviceId: string) => [...relationKeys.all, 'service', serviceId] as const,
  byType: (type: string) => [...relationKeys.all, 'type', type] as const,
};

// Enhanced relations query with better error handling
export const useRelations = (options?: {
  enabled?: boolean;
  filterByService?: string;
  filterByType?: string;
}) => {
  return useQuery({
    queryKey: options?.filterByService 
      ? relationKeys.byService(options.filterByService)
      : options?.filterByType
      ? relationKeys.byType(options.filterByType)
      : relationKeys.lists(),
    queryFn: relationsApi.getAll,
    enabled: options?.enabled,
    select: (data: Relation[]) => {
      let filteredData = data;

      // Filter by service if specified
      if (options?.filterByService) {
        filteredData = data.filter(relation => 
          relation.fromServiceId === options.filterByService || 
          relation.toServiceId === options.filterByService
        );
      }

      // Filter by type if specified
      if (options?.filterByType) {
        filteredData = filteredData.filter(relation => relation.type === options.filterByType);
      }

      // Sort by creation date (newest first)
      return filteredData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    onError: (error) => {
      console.error('Failed to fetch relations:', apiUtils.getErrorMessage(error));
    },
  });
};

// Get relations for a specific service
export const useServiceRelations = (serviceId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: relationKeys.byService(serviceId),
    queryFn: relationsApi.getAll,
    enabled: !!serviceId && (options?.enabled !== false),
    select: (data: Relation[]) => {
      // Filter relations where the service is either source or target
      const serviceRelations = data.filter(relation => 
        relation.fromServiceId === serviceId || relation.toServiceId === serviceId
      );

      // Separate incoming and outgoing relations
      const outgoing = serviceRelations.filter(relation => relation.fromServiceId === serviceId);
      const incoming = serviceRelations.filter(relation => relation.toServiceId === serviceId);

      return {
        all: serviceRelations,
        outgoing,
        incoming,
        totalCount: serviceRelations.length,
      };
    },
    onError: (error) => {
      console.error(`Failed to fetch relations for service ${serviceId}:`, apiUtils.getErrorMessage(error));
    },
  });
};

// Enhanced create relation with optimistic updates
export const useCreateRelation = (options?: {
  onSuccess?: (relation: Relation) => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRelationRequest) => relationsApi.create(data),
    onMutate: async (newRelation) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(relationKeys.lists());

      // Snapshot the previous value
      const previousRelations = queryClient.getQueryData<Relation[]>(relationKeys.lists());

      // Optimistically update to the new value
      if (previousRelations) {
        const optimisticRelation: Relation = {
          id: `temp-${Date.now()}`,
          type: newRelation.type,
          fromServiceId: newRelation.fromServiceId,
          toServiceId: newRelation.toServiceId,
          description: newRelation.description,
          createdAt: new Date().toISOString(),
          fromService: undefined, // Will be populated by server response
          toService: undefined,   // Will be populated by server response
        };

        queryClient.setQueryData(relationKeys.lists(), [...previousRelations, optimisticRelation]);
      }

      return { previousRelations };
    },
    onError: (error, _newRelation, context) => {
      // Rollback on error
      if (context?.previousRelations) {
        queryClient.setQueryData(relationKeys.lists(), context.previousRelations);
      }
      console.error('Failed to create relation:', apiUtils.getErrorMessage(error));
      options?.onError?.(error);
    },
    onSuccess: (createdRelation) => {
      // Invalidate and refetch to get the real data
      queryClient.invalidateQueries(relationKeys.lists());
      // Also invalidate service-specific relation queries
      queryClient.invalidateQueries(relationKeys.byService(createdRelation.fromServiceId));
      queryClient.invalidateQueries(relationKeys.byService(createdRelation.toServiceId));
      options?.onSuccess?.(createdRelation);
    },
  });
};

// Enhanced delete relation with optimistic updates
export const useDeleteRelation = (options?: {
  onSuccess?: (deletedId: string) => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => relationsApi.delete(id),
    onMutate: async (id) => {
      // Cancel queries
      await queryClient.cancelQueries(relationKeys.lists());

      // Snapshot previous values
      const previousRelations = queryClient.getQueryData<Relation[]>(relationKeys.lists());
      const relationToDelete = previousRelations?.find(relation => relation.id === id);

      // Optimistically remove from list
      if (previousRelations) {
        const filteredRelations = previousRelations.filter(relation => relation.id !== id);
        queryClient.setQueryData(relationKeys.lists(), filteredRelations);
      }

      return { previousRelations, relationToDelete };
    },
    onError: (error, _id, context) => {
      // Rollback on error
      if (context?.previousRelations) {
        queryClient.setQueryData(relationKeys.lists(), context.previousRelations);
      }
      console.error('Failed to delete relation:', apiUtils.getErrorMessage(error));
      options?.onError?.(error);
    },
    onSuccess: (_, deletedId, context) => {
      // Invalidate relations list
      queryClient.invalidateQueries(relationKeys.lists());
      
      // Also invalidate service-specific queries if we know which services were involved
      if (context?.relationToDelete) {
        queryClient.invalidateQueries(relationKeys.byService(context.relationToDelete.fromServiceId));
        queryClient.invalidateQueries(relationKeys.byService(context.relationToDelete.toServiceId));
      }
      
      options?.onSuccess?.(deletedId);
    },
  });
};

// Utility hook for relation statistics
export const useRelationStats = () => {
  const { data: relations } = useRelations();

  return {
    totalRelations: relations?.length ?? 0,
    relationsByType: relations?.reduce((acc, relation) => {
      acc[relation.type] = (acc[relation.type] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>) ?? {},
    mostConnectedServices: relations?.reduce((acc, relation) => {
      // Count connections for each service
      acc[relation.fromServiceId] = (acc[relation.fromServiceId] ?? 0) + 1;
      acc[relation.toServiceId] = (acc[relation.toServiceId] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>) ?? {},
    recentRelations: relations?.slice(0, 5) ?? [], // Last 5 relations
  };
};

// Utility hook for getting related services
export const useRelatedServices = (serviceId: string) => {
  const { data: relationData } = useServiceRelations(serviceId);

  return {
    // Services that this service connects to
    connectedServices: relationData?.outgoing.map(relation => ({
      serviceId: relation.toServiceId,
      relationType: relation.type,
      relationId: relation.id,
      description: relation.description,
    })) ?? [],
    
    // Services that connect to this service
    connectingServices: relationData?.incoming.map(relation => ({
      serviceId: relation.fromServiceId,
      relationType: relation.type,
      relationId: relation.id,
      description: relation.description,
    })) ?? [],
    
    // All unique related service IDs
    allRelatedServiceIds: [
      ...(relationData?.outgoing.map(r => r.toServiceId) ?? []),
      ...(relationData?.incoming.map(r => r.fromServiceId) ?? []),
    ],
    
    totalConnections: relationData?.totalCount ?? 0,
  };
};

// Utility hook for checking if two services are related
export const useServicesRelation = (serviceId1: string, serviceId2: string) => {
  const { data: relations } = useRelations();

  return relations?.find(relation => 
    (relation.fromServiceId === serviceId1 && relation.toServiceId === serviceId2) ||
    (relation.fromServiceId === serviceId2 && relation.toServiceId === serviceId1)
  ) ?? null;
};