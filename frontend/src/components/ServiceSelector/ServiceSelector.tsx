import React, { useState, useEffect } from 'react';
import { Service, Category } from '../../types/api';
import { servicesApi, categoriesApi } from '../../services/api';
import { useToast } from '../Toast';

interface ServiceSelectorProps {
  selectedServices: Service[];
  onServiceSelect: (service: Service) => void;
  onServiceDeselect: (serviceId: string) => void;
  maxServices?: number;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedServices,
  onServiceSelect,
  onServiceDeselect,
  maxServices = 5,
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Load services and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [servicesData, categoriesData] = await Promise.all([
          servicesApi.getAll(),
          categoriesApi.getAll(),
        ]);
        setServices(servicesData);
        setCategories(categoriesData);
        setFilteredServices(servicesData);
      } catch (err) {
        console.error('Failed to load data:', err);
        showToast('データの読み込みに失敗しました', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [showToast]);

  // Filter services based on category and search query
  useEffect(() => {
    let filtered = services;

    // Filter by category
    if (selectedCategoryId) {
      filtered = filtered.filter(service => service.categoryId === selectedCategoryId);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(query) ||
        (service.description && service.description.toLowerCase().includes(query))
      );
    }

    setFilteredServices(filtered);
  }, [services, selectedCategoryId, searchQuery]);

  const handleServiceToggle = (service: Service) => {
    const isSelected = selectedServices.some(s => s.id === service.id);
    
    if (isSelected) {
      onServiceDeselect(service.id);
    } else {
      if (selectedServices.length >= maxServices) {
        showToast(`最大${maxServices}つまでのサービスを選択できます`, 'warning');
        return;
      }
      onServiceSelect(service);
    }
  };

  const isServiceSelected = (serviceId: string) => {
    return selectedServices.some(s => s.id === serviceId);
  };

  const canSelectMore = selectedServices.length < maxServices;

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          サービス選択 ({selectedServices.length}/{maxServices})
        </h3>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              検索
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="サービス名または説明で検索..."
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ
            </label>
            <select
              id="category"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">すべてのカテゴリ</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Service List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredServices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery || selectedCategoryId ? 
                '条件に一致するサービスが見つかりません' : 
                'サービスがありません'
              }
            </div>
          ) : (
            filteredServices.map(service => {
              const isSelected = isServiceSelected(service.id);
              const category = categories.find(c => c.id === service.categoryId);
              
              return (
                <div
                  key={service.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } ${!canSelectMore && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (canSelectMore || isSelected) {
                      handleServiceToggle(service);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {service.name}
                        </h4>
                        {category && (
                          <span
                            className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: category.color || '#6B7280' }}
                            title={category.name}
                          />
                        )}
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                      {category && (
                        <p className="text-xs text-gray-400 mt-1">
                          {category.name}
                        </p>
                      )}
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={!canSelectMore && !isSelected}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selection Status */}
        {selectedServices.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              {selectedServices.length}つのサービスが選択されています
              {selectedServices.length >= maxServices && (
                <span className="block text-xs text-blue-600 mt-1">
                  最大選択数に達しました
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceSelector;