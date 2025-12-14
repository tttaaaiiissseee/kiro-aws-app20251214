import { useServices, useServiceStats } from './useServices';
import { useCategories, useCategoryStats } from './useCategories';
import { useRelations, useRelationStats } from './useRelations';
// import { useMemoStats } from './useMemos'; // Not used in this hook

/**
 * Comprehensive hook that provides access to all application data
 * and statistics in a single interface
 */
export const useAppData = () => {
  // Fetch all core data
  const servicesQuery = useServices();
  const categoriesQuery = useCategories();
  const relationsQuery = useRelations();

  // Get statistics
  const serviceStats = useServiceStats();
  const categoryStats = useCategoryStats();
  const relationStats = useRelationStats();

  // Calculate loading and error states
  const isLoading = servicesQuery.isLoading || categoriesQuery.isLoading || relationsQuery.isLoading;
  const isError = servicesQuery.isError || categoriesQuery.isError || relationsQuery.isError;
  const error = servicesQuery.error || categoriesQuery.error || relationsQuery.error;

  // Calculate overall app statistics
  const appStats = {
    ...serviceStats,
    ...categoryStats,
    ...relationStats,
    dataLastUpdated: Math.max(
      servicesQuery.dataUpdatedAt || 0,
      categoriesQuery.dataUpdatedAt || 0,
      relationsQuery.dataUpdatedAt || 0
    ),
    isStale: servicesQuery.isStale || categoriesQuery.isStale || relationsQuery.isStale,
  };

  return {
    // Data
    services: servicesQuery.data ?? [],
    categories: categoriesQuery.data ?? [],
    relations: relationsQuery.data ?? [],

    // Query states
    isLoading,
    isError,
    error,
    isRefetching: servicesQuery.isRefetching || categoriesQuery.isRefetching || relationsQuery.isRefetching,

    // Statistics
    stats: appStats,

    // Refetch functions
    refetch: () => {
      servicesQuery.refetch();
      categoriesQuery.refetch();
      relationsQuery.refetch();
    },

    // Individual query objects for more granular control
    queries: {
      services: servicesQuery,
      categories: categoriesQuery,
      relations: relationsQuery,
    },
  };
};

/**
 * Hook for getting application health and status information
 */
export const useAppHealth = () => {
  const { isLoading, isError, stats, queries } = useAppData();

  const health = {
    status: isError ? 'error' : isLoading ? 'loading' : 'healthy',
    hasData: stats.totalServices > 0 || stats.totalCategories > 0,
    lastSync: stats.dataLastUpdated,
    errors: {
      services: queries.services.error,
      categories: queries.categories.error,
      relations: queries.relations.error,
    },
    retryCount: {
      services: queries.services.failureCount,
      categories: queries.categories.failureCount,
      relations: queries.relations.failureCount,
    },
  };

  return health;
};

/**
 * Hook for managing application-wide cache operations
 */
export const useAppCache = () => {
  const { queries } = useAppData();

  return {
    // Clear all cache
    clearAll: () => {
      queries.services.remove();
      queries.categories.remove();
      queries.relations.remove();
    },

    // Refresh all data
    refreshAll: () => {
      queries.services.refetch();
      queries.categories.refetch();
      queries.relations.refetch();
    },

    // Get cache status
    getCacheStatus: () => ({
      services: {
        isCached: !!queries.services.data,
        isStale: queries.services.isStale,
        lastFetched: queries.services.dataUpdatedAt,
      },
      categories: {
        isCached: !!queries.categories.data,
        isStale: queries.categories.isStale,
        lastFetched: queries.categories.dataUpdatedAt,
      },
      relations: {
        isCached: !!queries.relations.data,
        isStale: queries.relations.isStale,
        lastFetched: queries.relations.dataUpdatedAt,
      },
    }),
  };
};

export default useAppData;