import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useServices, useDeleteService, useSearchServices, useServicesByCategory } from '../hooks/useServices';
import { useCategories } from '../hooks/useCategories';
import { useSearchFilters } from '../hooks/useSearchFilters';
import ServiceCard from '../components/ServiceCard/ServiceCard';
import Pagination from '../components/Pagination/Pagination';
import SearchBar from '../components/SearchBar/SearchBar';
import FilterBar from '../components/FilterBar';
import { Service } from '../types/api';

const ITEMS_PER_PAGE = 12;

const ServiceList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Use the search filters hook
  const {
    filters,
    setSearchQuery,
    setSelectedCategory,
    setSortBy,
    clearFilters,
    clearSearchQuery,
    clearCategory,
    toSearchParams,
    hasActiveFilters,

  } = useSearchFilters();

  // Use search API only if there's a search query, otherwise use regular services API with category filter
  const searchParams = toSearchParams();
  const hasSearchQuery = !!filters.searchQuery;
  
  const { data: searchResult, isLoading: isSearchLoading, error: searchError } = useSearchServices(searchParams);
  const { data: allServices = [], isLoading: isServicesLoading, error: servicesError } = useServices();
  const { data: categoryServices = [], isLoading: isCategoryLoading, error: categoryError } = useServicesByCategory(filters.selectedCategory);
  const { data: categories = [] } = useCategories();
  const deleteServiceMutation = useDeleteService();

  // Determine which data to use based on filter state
  let services, isLoading, error;
  
  if (hasSearchQuery) {
    // Use search API when there's a search query
    services = searchResult?.services || [];
    isLoading = isSearchLoading;
    error = searchError;
  } else if (filters.selectedCategory) {
    // Use category-specific API when only category filter is applied
    services = categoryServices;
    isLoading = isCategoryLoading;
    error = categoryError;
  } else {
    // Use all services API when no filters are applied
    services = allServices;
    isLoading = isServicesLoading;
    error = servicesError;
  }

  // For non-search mode, we still need to sort locally
  const filteredServices = React.useMemo(() => {
    if (hasSearchQuery) {
      // Search API already handles filtering and sorting
      return services;
    }

    let filtered = services;

    // Sort services for non-search mode (category filter or all services)
    filtered = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'alphabetical':
          return a.name.localeCompare(b.name, 'ja');
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return filtered;
  }, [services, filters.sortBy, hasSearchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedServices = filteredServices.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to first page when search parameters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters.searchQuery, filters.selectedCategory, filters.sortBy]);



  const handleDeleteService = async (service: Service) => {
    if (deleteConfirm === service.id) {
      try {
        await deleteServiceMutation.mutateAsync(service.id);
        setDeleteConfirm(null);
      } catch (error) {
        console.error('Failed to delete service:', error);
      }
    } else {
      setDeleteConfirm(service.id);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-48"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                サービス一覧の読み込みに失敗しました
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>しばらく時間をおいてから再度お試しください。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            {filters.searchQuery ? '検索結果' : 'AWSサービス一覧'}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            {filters.searchQuery ? (
              <>
                「<span className="font-medium">{filters.searchQuery}</span>」の検索結果 ({filteredServices.length}件)
              </>
            ) : (
              <>登録されているAWSサービスの一覧です。({filteredServices.length}件)</>
            )}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/services/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新しいサービスを追加
          </Link>
        </div>
      </div>

      {/* Search Bar - Mobile/Desktop */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="max-w-2xl">
          <SearchBar 
            onSearch={setSearchQuery}
            placeholder="サービス名、説明、メモ内容を検索..."
            className="w-full"
            defaultValue={filters.searchQuery}
          />
        </div>
        {filters.searchQuery && (
          <div className="mt-3 flex items-center text-sm text-gray-600">
            <span>検索中: </span>
            <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
              {filters.searchQuery}
            </span>
            <button
              onClick={clearSearchQuery}
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              クリア
            </button>
          </div>
        )}
      </div>

      {/* Filters and Sort */}
      <FilterBar
        selectedCategory={filters.selectedCategory}
        sortBy={filters.sortBy}
        categories={categories}
        searchQuery={filters.searchQuery}
        onCategoryChange={setSelectedCategory}
        onSortChange={setSortBy}
        onClearCategory={clearCategory}
        onClearSearch={clearSearchQuery}
        onClearAll={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Services Grid */}
      {paginatedServices.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={filters.searchQuery ? "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" : "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"} />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filters.searchQuery ? '検索結果が見つかりません' : 'サービスが見つかりません'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.searchQuery ? (
              <>
                「{filters.searchQuery}」に一致するサービスが見つかりませんでした。
                {filters.selectedCategory && ' 選択されたカテゴリでは'}
              </>
            ) : filters.selectedCategory ? (
              'このカテゴリにはサービスが登録されていません。'
            ) : (
              'まだサービスが登録されていません。'
            )}
          </p>
          <div className="mt-6 space-x-3">
            {filters.searchQuery && (
              <button
                onClick={clearSearchQuery}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                検索をクリア
              </button>
            )}
            <Link
              to="/services/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {filters.searchQuery ? 'サービスを追加' : '最初のサービスを追加'}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedServices.map((service) => (
              <div key={service.id} className="relative">
                <ServiceCard
                  service={service}
                  searchQuery={filters.searchQuery}
                  onEdit={(service: Service) => {
                    // Navigate to edit page - will be implemented in task 12.2
                    window.location.href = `/services/${service.id}/edit`;
                  }}
                  onDelete={handleDeleteService}
                />
                
                {/* Delete confirmation overlay */}
                {deleteConfirm === service.id && (
                  <div className="absolute inset-0 bg-white bg-opacity-95 rounded-lg flex items-center justify-center">
                    <div className="text-center p-4">
                      <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">削除の確認</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        「{service.name}」を削除しますか？<br />
                        この操作は取り消せません。
                      </p>
                      <div className="flex justify-center space-x-3">
                        <button
                          onClick={handleCancelDelete}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={() => handleDeleteService(service)}
                          disabled={deleteServiceMutation.isLoading}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {deleteServiceMutation.isLoading ? '削除中...' : '削除する'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="mt-8"
            />
          )}
        </>
      )}
    </div>
  );
};

export default ServiceList;