import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { useSearchFilters } from './useSearchFilters';

// Wrapper component for React Router with clean state
const createWrapper = (initialEntries: string[] = ['/']) => {
  return ({ children }: { children: React.ReactNode }) => 
    React.createElement(MemoryRouter, { initialEntries }, children);
};

describe('useSearchFilters', () => {
  it('initializes with default values', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearchFilters(), { wrapper });
    
    expect(result.current.filters.searchQuery).toBe('');
    expect(result.current.filters.selectedCategory).toBe('');
    expect(result.current.filters.sortBy).toBe('updated');
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.isSearchMode).toBe(false);
  });

  it('updates search query', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearchFilters(), { wrapper });
    
    act(() => {
      result.current.setSearchQuery('test query');
    });
    
    await waitFor(() => {
      expect(result.current.filters.searchQuery).toBe('test query');
      expect(result.current.hasActiveFilters).toBe(true);
      expect(result.current.isSearchMode).toBe(true);
    });
  });

  it('updates selected category', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearchFilters(), { wrapper });
    
    act(() => {
      result.current.setSelectedCategory('category-id');
    });
    
    await waitFor(() => {
      expect(result.current.filters.selectedCategory).toBe('category-id');
      expect(result.current.hasActiveFilters).toBe(true);
      expect(result.current.isSearchMode).toBe(false); // Only search query makes it search mode
    });
  });

  it('updates sort by', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearchFilters(), { wrapper });
    
    act(() => {
      result.current.setSortBy('alphabetical');
    });
    
    await waitFor(() => {
      expect(result.current.filters.sortBy).toBe('alphabetical');
    });
  });

  it('clears search query', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearchFilters(), { wrapper });
    
    act(() => {
      result.current.setSearchQuery('test');
    });
    
    await waitFor(() => {
      expect(result.current.filters.searchQuery).toBe('test');
      expect(result.current.hasActiveFilters).toBe(true);
    });
    
    act(() => {
      result.current.clearSearchQuery();
    });
    
    await waitFor(() => {
      expect(result.current.filters.searchQuery).toBe('');
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  it('clears category', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearchFilters(), { wrapper });
    
    act(() => {
      result.current.setSelectedCategory('category-id');
    });
    
    await waitFor(() => {
      expect(result.current.filters.selectedCategory).toBe('category-id');
    });
    
    act(() => {
      result.current.clearCategory();
    });
    
    await waitFor(() => {
      expect(result.current.filters.selectedCategory).toBe('');
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  it('converts to search params correctly', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearchFilters(), { wrapper });
    
    // Set search query first
    act(() => {
      result.current.setSearchQuery('test');
    });
    
    await waitFor(() => {
      expect(result.current.filters.searchQuery).toBe('test');
    });
    
    // Set category
    act(() => {
      result.current.setSelectedCategory('category-id');
    });
    
    await waitFor(() => {
      expect(result.current.filters.selectedCategory).toBe('category-id');
    });
    
    // Set sort
    act(() => {
      result.current.setSortBy('alphabetical');
    });
    
    await waitFor(() => {
      expect(result.current.filters.sortBy).toBe('alphabetical');
      
      const searchParams = result.current.toSearchParams();
      expect(searchParams.q).toBe('test');
      expect(searchParams.category).toBe('category-id');
      expect(searchParams.sort).toBe('alphabetical');
    });
  });

  it('excludes empty values from search params', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearchFilters(), { wrapper });
    
    const searchParams = result.current.toSearchParams();
    
    expect(searchParams.q).toBeUndefined();
    expect(searchParams.category).toBeUndefined();
    expect(searchParams.sort).toBe('updated');
  });
});