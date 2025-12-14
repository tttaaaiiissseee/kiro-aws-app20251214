import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchParams } from '../types/api';

export interface FilterState {
  searchQuery: string;
  selectedCategory: string;
  sortBy: 'relevance' | 'alphabetical' | 'updated';
}

export const useSearchFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial state from URL parameters
  const initialState: FilterState = {
    searchQuery: searchParams.get('q') || '',
    selectedCategory: searchParams.get('category') || '',
    sortBy: (searchParams.get('sort') as 'relevance' | 'alphabetical' | 'updated') || 'updated',
  };

  const [filters, setFilters] = useState<FilterState>(initialState);

  // Update local state when URL parameters change
  useEffect(() => {
    setFilters({
      searchQuery: searchParams.get('q') || '',
      selectedCategory: searchParams.get('category') || '',
      sortBy: (searchParams.get('sort') as 'relevance' | 'alphabetical' | 'updated') || 'updated',
    });
  }, [searchParams]);

  // Update URL parameters when filters change
  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    const newParams = new URLSearchParams();

    if (updatedFilters.searchQuery.trim()) {
      newParams.set('q', updatedFilters.searchQuery.trim());
    }
    if (updatedFilters.selectedCategory) {
      newParams.set('category', updatedFilters.selectedCategory);
    }
    if (updatedFilters.sortBy !== 'updated') {
      newParams.set('sort', updatedFilters.sortBy);
    }

    setSearchParams(newParams);
  };

  // Individual update functions
  const setSearchQuery = (query: string) => {
    updateFilters({ searchQuery: query });
  };

  const setSelectedCategory = (categoryId: string) => {
    updateFilters({ selectedCategory: categoryId });
  };

  const setSortBy = (sort: 'relevance' | 'alphabetical' | 'updated') => {
    updateFilters({ sortBy: sort });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Clear specific filter
  const clearSearchQuery = () => {
    updateFilters({ searchQuery: '' });
  };

  const clearCategory = () => {
    updateFilters({ selectedCategory: '' });
  };

  // Convert to API search params
  const toSearchParams = (): SearchParams => ({
    q: filters.searchQuery || undefined,
    category: filters.selectedCategory || undefined,
    sort: filters.sortBy,
  });

  // Check if any filters are active
  const hasActiveFilters = !!(filters.searchQuery || filters.selectedCategory);

  // Check if search mode (has query only, not category filter)
  const isSearchMode = !!filters.searchQuery;

  return {
    filters,
    setSearchQuery,
    setSelectedCategory,
    setSortBy,
    clearFilters,
    clearSearchQuery,
    clearCategory,
    toSearchParams,
    hasActiveFilters,
    isSearchMode,
  };
};