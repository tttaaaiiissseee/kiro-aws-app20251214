import React from 'react';
import { Category } from '../../types/api';

interface FilterBarProps {
  selectedCategory: string;
  sortBy: 'relevance' | 'alphabetical' | 'updated';
  categories: Category[];
  searchQuery?: string;
  onCategoryChange: (categoryId: string) => void;
  onSortChange: (sort: 'relevance' | 'alphabetical' | 'updated') => void;
  onClearCategory: () => void;
  onClearSearch: () => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  sortBy,
  categories,
  searchQuery,
  onCategoryChange,
  onSortChange,
  onClearCategory,
  onClearSearch,
  onClearAll,
  hasActiveFilters,
}) => {
  const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name;

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
        {/* Left side - Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <label htmlFor="category-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              カテゴリ:
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm min-w-[120px]"
            >
              <option value="">すべて</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <label htmlFor="sort-by" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              並び順:
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as 'relevance' | 'alphabetical' | 'updated')}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm min-w-[120px]"
            >
              {searchQuery && <option value="relevance">関連度順</option>}
              <option value="updated">更新日順</option>
              <option value="alphabetical">名前順</option>
            </select>
          </div>
        </div>

        {/* Right side - Active filters and clear actions */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">アクティブフィルタ:</span>
              
              {searchQuery && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  検索: {searchQuery.length > 20 ? `${searchQuery.substring(0, 20)}...` : searchQuery}
                  <button
                    onClick={onClearSearch}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none"
                    title="検索をクリア"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              
              {selectedCategory && selectedCategoryName && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  カテゴリ: {selectedCategoryName}
                  <button
                    onClick={onClearCategory}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-600 focus:outline-none"
                    title="カテゴリフィルタをクリア"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Clear all button */}
          {hasActiveFilters && (
            <button
              onClick={onClearAll}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              すべてクリア
            </button>
          )}
        </div>
      </div>

      {/* Filter summary */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            <span>
              {searchQuery && selectedCategory
                ? `「${searchQuery}」を「${selectedCategoryName}」カテゴリで検索中`
                : searchQuery
                ? `「${searchQuery}」を検索中`
                : selectedCategory
                ? `「${selectedCategoryName}」カテゴリでフィルタ中`
                : 'フィルタが適用されています'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;