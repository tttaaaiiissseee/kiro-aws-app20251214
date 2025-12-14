import { useQuery, useMutation, useQueryClient } from 'react-query';
import { servicesApi } from '../services/api';
import {
  Service,
  CreateServiceRequest,
  UpdateServiceRequest,
  SearchParams,
} from '../types/api';
import { apiUtils } from '../lib/api';

// Query keys factory for better organization
export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (filters: string) => [...serviceKeys.lists(), { filters }] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
  search: (params: SearchParams) => [...serviceKeys.all, 'search', params] as const,
  infinite: (filters?: string) => [...serviceKeys.all, 'infinite', filters] as const,
};

// Enhanced services query with better error handling
export const useServices = (options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) => {
  return useQuery({
    queryKey: serviceKeys.lists(),
    queryFn: servicesApi.getAll,
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
    select: (data: Service[]) => {
      // Sort services by name for consistent ordering
      return data.sort((a, b) => a.name.localeCompare(b.name));
    },
    onError: (error) => {
      console.error('Failed to fetch services:', apiUtils.getErrorMessage(error));
    },
  });
};

// Enhanced service detail query with prefetching
export const useService = (id: string, options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => servicesApi.getById(id),
    enabled: !!id && (options?.enabled !== false),
    onSuccess: (service) => {
      // Update the service in the services list cache if it exists
      queryClient.setQueryData<Service[]>(serviceKeys.lists(), (oldData) => {
        if (!oldData) return [];
        const index = oldData.findIndex(s => s.id === service.id);
        if (index >= 0) {
          const newData = [...oldData];
          newData[index] = service;
          return newData;
        }
        return oldData;
      });
    },
    onError: (error) => {
      console.error(`Failed to fetch service ${id}:`, apiUtils.getErrorMessage(error));
    },
  });
};

// Enhanced search with debouncing support
export const useSearchServices = (
  params: SearchParams,
  options?: { enabled?: boolean; keepPreviousData?: boolean }
) => {
  return useQuery({
    queryKey: serviceKeys.search(params),
    queryFn: () => servicesApi.search(params),
    enabled: !!params.q && (options?.enabled !== false),
    keepPreviousData: options?.keepPreviousData ?? true,
    staleTime: 30000, // Keep search results fresh for 30 seconds
    onError: (error) => {
      console.error('Search failed:', apiUtils.getErrorMessage(error));
    },
  });
};

// Enhanced category filtering
export const useServicesByCategory = (
  categoryId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: serviceKeys.list(`category-${categoryId}`),
    queryFn: () => servicesApi.getByCategory(categoryId),
    enabled: !!categoryId && (options?.enabled !== false),
    select: (data: Service[]) => {
      // Sort by name for consistent ordering
      return data.sort((a, b) => a.name.localeCompare(b.name));
    },
    onError: (error) => {
      console.error(`Failed to fetch services for category ${categoryId}:`, apiUtils.getErrorMessage(error));
    },
  });
};

// Enhanced create service with optimistic updates
export const useCreateService = (options?: {
  onSuccess?: (service: Service) => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceRequest) => servicesApi.create(data),
    onMutate: async (newService) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(serviceKeys.lists());

      // Snapshot the previous value
      const previousServices = queryClient.getQueryData<Service[]>(serviceKeys.lists());

      // Optimistically update to the new value
      if (previousServices) {
        const optimisticService: Service = {
          id: `temp-${Date.now()}`,
          name: newService.name,
          description: newService.description,
          categoryId: newService.categoryId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          category: undefined, // Will be populated by server response
          memos: [],
          _count: { memos: 0 },
        };

        queryClient.setQueryData(serviceKeys.lists(), [...previousServices, optimisticService]);
      }

      return { previousServices };
    },
    onError: (error, _newService, context) => {
      // Rollback on error
      if (context?.previousServices) {
        queryClient.setQueryData(serviceKeys.lists(), context.previousServices);
      }
      console.error('Failed to create service:', apiUtils.getErrorMessage(error));
      options?.onError?.(error);
    },
    onSuccess: (createdService) => {
      // Invalidate and refetch to get the real data
      queryClient.invalidateQueries(serviceKeys.lists());
      options?.onSuccess?.(createdService);
    },
  });
};

// Enhanced update service with optimistic updates
export const useUpdateService = (options?: {
  onSuccess?: (service: Service) => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceRequest }) =>
      servicesApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel queries
      await queryClient.cancelQueries(serviceKeys.detail(id));
      await queryClient.cancelQueries(serviceKeys.lists());

      // Snapshot previous values
      const previousService = queryClient.getQueryData<Service>(serviceKeys.detail(id));
      const previousServices = queryClient.getQueryData<Service[]>(serviceKeys.lists());

      // Optimistically update
      if (previousService) {
        const optimisticService = {
          ...previousService,
          ...data,
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData(serviceKeys.detail(id), optimisticService);
      }

      if (previousServices) {
        const updatedServices = previousServices.map(service =>
          service.id === id
            ? { ...service, ...data, updatedAt: new Date().toISOString() }
            : service
        );
        queryClient.setQueryData(serviceKeys.lists(), updatedServices);
      }

      return { previousService, previousServices };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousService) {
        queryClient.setQueryData(serviceKeys.detail(_variables.id), context.previousService);
      }
      if (context?.previousServices) {
        queryClient.setQueryData(serviceKeys.lists(), context.previousServices);
      }
      console.error('Failed to update service:', apiUtils.getErrorMessage(error));
      options?.onError?.(error);
    },
    onSuccess: (updatedService) => {
      // Update cache with real data
      queryClient.setQueryData(serviceKeys.detail(updatedService.id), updatedService);
      queryClient.invalidateQueries(serviceKeys.lists());
      options?.onSuccess?.(updatedService);
    },
  });
};

// Enhanced delete service with optimistic updates
export const useDeleteService = (options?: {
  onSuccess?: (deletedId: string) => void;
  onError?: (error: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onMutate: async (id) => {
      // Cancel queries
      await queryClient.cancelQueries(serviceKeys.lists());

      // Snapshot previous values
      const previousServices = queryClient.getQueryData<Service[]>(serviceKeys.lists());

      // Optimistically remove from list
      if (previousServices) {
        const filteredServices = previousServices.filter(service => service.id !== id);
        queryClient.setQueryData(serviceKeys.lists(), filteredServices);
      }

      return { previousServices };
    },
    onError: (error, _id, context) => {
      // Rollback on error
      if (context?.previousServices) {
        queryClient.setQueryData(serviceKeys.lists(), context.previousServices);
      }
      console.error('Failed to delete service:', apiUtils.getErrorMessage(error));
      options?.onError?.(error);
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache and invalidate
      queryClient.removeQueries(serviceKeys.detail(deletedId));
      queryClient.invalidateQueries(serviceKeys.lists());
      options?.onSuccess?.(deletedId);
    },
  });
};

// Utility hook for prefetching services
export const usePrefetchService = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery(
      serviceKeys.detail(id),
      () => servicesApi.getById(id),
      {
        staleTime: 5 * 60 * 1000, // 5 minutes
      }
    );
  };
};

// Utility hook for service statistics
export const useServiceStats = () => {
  const { data: services } = useServices();

  return {
    totalServices: services?.length ?? 0,
    servicesByCategory: services?.reduce((acc, service) => {
      const categoryName = service.category?.name ?? 'Uncategorized';
      acc[categoryName] = (acc[categoryName] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>) ?? {},
    servicesWithMemos: services?.filter(service => (service._count?.memos ?? 0) > 0).length ?? 0,
  };
};