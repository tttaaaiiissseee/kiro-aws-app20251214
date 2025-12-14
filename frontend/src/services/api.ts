import { apiClient } from '../lib/api';
import {
  Service,
  Category,
  Memo,
  Relation,
  CreateServiceRequest,
  UpdateServiceRequest,
  CreateMemoRequest,
  UpdateMemoRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateRelationRequest,
  SearchParams,
  SearchResult,
  ComparisonAttribute,
  ServiceAttributeValue,
  ComparisonData,
  CreateComparisonAttributeRequest,
  SetAttributeValueRequest,
  CompareServicesRequest,
  ExportComparisonRequest,
} from '../types/api';

// Services API
export const servicesApi = {
  getAll: async (): Promise<Service[]> => {
    const response = await apiClient.get('/services');
    return response.data.data || response.data;
  },

  getById: async (id: string): Promise<Service> => {
    const response = await apiClient.get(`/services/${id}`);
    return response.data.data || response.data;
  },

  create: async (data: CreateServiceRequest): Promise<Service> => {
    const response = await apiClient.post('/services', data);
    return response.data;
  },

  update: async (id: string, data: UpdateServiceRequest): Promise<Service> => {
    const response = await apiClient.put(`/services/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/services/${id}`);
  },

  search: async (params: SearchParams): Promise<SearchResult> => {
    const response = await apiClient.get('/search', { params });
    return response.data.data ? { services: response.data.data, total: response.data.count } : response.data;
  },

  getByCategory: async (categoryId: string): Promise<Service[]> => {
    const response = await apiClient.get('/services', {
      params: { category: categoryId },
    });
    return response.data.data || response.data;
  },
};

// Categories API
export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await apiClient.get('/categories');
    return response.data.data || response.data;
  },

  getById: async (id: string): Promise<Category> => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },

  create: async (data: CreateCategoryRequest): Promise<Category> => {
    const response = await apiClient.post('/categories', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCategoryRequest): Promise<Category> => {
    const response = await apiClient.put(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },

  reorder: async (categoryOrders: { id: string }[]): Promise<Category[]> => {
    const response = await apiClient.put('/categories/reorder', { categoryOrders });
    return response.data.data || response.data;
  },
};

// Memos API
export const memosApi = {
  getByService: async (serviceId: string): Promise<Memo[]> => {
    const response = await apiClient.get(`/services/${serviceId}/memos`);
    return response.data.data || response.data;
  },

  create: async (serviceId: string, data: CreateMemoRequest): Promise<Memo> => {
    const response = await apiClient.post(`/services/${serviceId}/memos`, data);
    return response.data.data || response.data;
  },

  update: async (id: string, data: UpdateMemoRequest): Promise<Memo> => {
    const response = await apiClient.put(`/memos/${id}`, data);
    return response.data.data || response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/memos/${id}`);
  },
};

// Relations API
export const relationsApi = {
  getAll: async (): Promise<Relation[]> => {
    const response = await apiClient.get('/relations');
    return response.data.data || response.data;
  },

  create: async (data: CreateRelationRequest): Promise<Relation> => {
    const response = await apiClient.post('/relations', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/relations/${id}`);
  },
};

// File upload API
export const filesApi = {
  upload: async (file: File): Promise<{ filename: string; url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getUrl: (filename: string): string => {
    return `${apiClient.defaults.baseURL}/files/${filename}`;
  },
};

// Comparison API
export const comparisonApi = {
  getAttributes: async (): Promise<ComparisonAttribute[]> => {
    const response = await apiClient.get('/comparison/attributes');
    return response.data.data || response.data;
  },

  createAttribute: async (data: CreateComparisonAttributeRequest): Promise<ComparisonAttribute> => {
    const response = await apiClient.post('/comparison/attributes', data);
    return response.data.data || response.data;
  },

  setAttributeValue: async (serviceId: string, attributeId: string, data: SetAttributeValueRequest): Promise<ServiceAttributeValue> => {
    const response = await apiClient.post(`/comparison/services/${serviceId}/attributes/${attributeId}`, data);
    return response.data.data || response.data;
  },

  compareServices: async (data: CompareServicesRequest): Promise<ComparisonData> => {
    const response = await apiClient.post('/comparison/compare', data);
    return response.data.data || response.data;
  },

  exportComparison: async (data: ExportComparisonRequest): Promise<Blob> => {
    const response = await apiClient.post('/comparison/export', data, {
      responseType: 'blob',
    });
    return response.data;
  },
};