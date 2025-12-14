import React, { useState, useMemo, useCallback } from 'react';
import { useSearchServices } from './useServices';
import { useServices } from './useServices';
import { useCategories } from './useCategories';
import { Service, Category, SearchParams } from '../types/api';

export interface GlobalSearchFilters {
  query: string;
  categoryId?: string;
  sortBy?: 'relevance' | 'name' | 'updated' | 'created';
  sortOrder?: 'asc' | 'desc';
}

export interface GlobalSearchResult {
  services: Service[];
  categories: Category[];
  totalResults: number;
  isLoading: boolean;
  isError: boolean;
  error: any;
}

/**
 * Enhanced global search hook that provides comprehensive search and filtering
 * capabilities across services and categories
 */
export const useGlobalSearch = (initialFilters?: Partial<GlobalSearchFilters>) => {
  const [filters, setFilters] = useState<GlobalSearchFilters>({
    query: '',
    sortBy: 'relevance',
    sortOrder: 'desc',
    ...initialFilters,
  });

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState(filters.query);

  // Debounce the search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.query]);

  // Get all data for filtering
  const { data: allServices = [] } = useServices();
  const { data: allCategories = [] } = useCategories();

  // Search API call for when there's a query
  const searchParams: SearchParams = {
    q: debouncedQuery,
    category: filters.categoryId,
    sort: filters.sortBy === 'relevance' ? undefined : 
          filters.sortBy === 'name' ? 'alphabetical' : 
          filters.sortBy === 'created' ? 'updated' : filters.sortBy,
  };

  const searchQuery = useSearchServices(searchParams, {
    enabled: !!debouncedQuery.trim(),
    keepPreviousData: true,
  });

  // Filter and sort results
  const results: GlobalSearchResult = useMemo(() => {
    let services: Service[] = [];
    let categories: Category[] = [];

    if (debouncedQuery.trim()) {
      // Use search API results when there's a query
      if (searchQuery.data) {
        services = searchQuery.data.services || [];
      }

      // Filter categories by query
      categories = allCategories.filter(category =>
        category.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(debouncedQuery.toLowerCase()))
      );
    } else {
      // Show all data when no query
      services = allServices;
      categories = allCategories;

      // Apply category filter
      if (filters.categoryId) {
        services = services.filter(service => service.categoryId === filters.categoryId);
      }

      // Apply sorting when not using search API
      if (filters.sortBy !== 'relevance') {
        services = [...services].sort((a, b) => {
          let comparison = 0;
          
          switch (filters.sortBy) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'updated':
              comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
              break;
            case 'created':
              comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              break;
          }

          return filters.sortOrder === 'desc' ? -comparison : comparison;
        });

        categories = [...categories].sort((a, b) => {
          let comparison = 0;
          
          switch (filters.sortBy) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'updated':
              comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
              break;
            case 'created':
              comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              break;
          }

          return filters.sortOrder === 'desc' ? -comparison : comparison;
        });
      }
    }

    return {
      services,
      categories,
      totalResults: services.length + categories.length,
      isLoading: searchQuery.isLoading,
      isError: searchQuery.isError,
      error: searchQuery.error,
    };
  }, [
    debouncedQuery,
    searchQuery.data,
    searchQuery.isLoading,
    searchQuery.isError,
    searchQuery.error,
    allServices,
    allCategories,
    filters.categoryId,
    filters.sortBy,
    filters.sortOrder,
  ]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<GlobalSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  }, []);

  // Quick filter functions
  const setQuery = useCallback((query: string) => {
    updateFilters({ query });
  }, [updateFilters]);

  const setCategory = useCallback((categoryId?: string) => {
    updateFilters({ categoryId });
  }, [updateFilters]);

  const setSorting = useCallback((sortBy: GlobalSearchFilters['sortBy'], sortOrder?: GlobalSearchFilters['sortOrder']) => {
    updateFilters({ sortBy, sortOrder: sortOrder || filters.sortOrder });
  }, [updateFilters, filters.sortOrder]);

  return {
    // Current state
    filters,
    results,
    
    // Actions
    updateFilters,
    clearFilters,
    setQuery,
    setCategory,
    setSorting,
    
    // Utilities
    hasActiveFilters: !!(filters.query || filters.categoryId),
    isEmpty: results.totalResults === 0,
    hasQuery: !!debouncedQuery.trim(),
  };
};

/**
 * Hook for managing recent searches
 */
export const useRecentSearches = (maxItems = 10) => {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aws-study-app-recent-searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addSearch = useCallback((query: string) => {
    if (!query.trim()) return;

    setRecentSearches(prev => {
      const filtered = prev.filter(item => item !== query);
      const updated = [query, ...filtered].slice(0, maxItems);
      
      try {
        localStorage.setItem('aws-study-app-recent-searches', JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      
      return updated;
    });
  }, [maxItems]);

  const removeSearch = useCallback((query: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(item => item !== query);
      
      try {
        localStorage.setItem('aws-study-app-recent-searches', JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      
      return updated;
    });
  }, []);

  const clearSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('aws-study-app-recent-searches');
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  return {
    recentSearches,
    addSearch,
    removeSearch,
    clearSearches,
  };
};

export default useGlobalSearch;