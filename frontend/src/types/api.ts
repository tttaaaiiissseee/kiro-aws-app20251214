// Enums matching the backend
export enum MemoType {
  TEXT = 'TEXT',
  LINK = 'LINK',
  IMAGE = 'IMAGE',
}

export enum RelationType {
  INTEGRATES_WITH = 'INTEGRATES_WITH',
  DEPENDS_ON = 'DEPENDS_ON',
  ALTERNATIVE_TO = 'ALTERNATIVE_TO',
}

// Core data models
export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    services: number;
  };
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: Category;
  memos?: Memo[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    memos: number;
  };
}

export interface Memo {
  id: string;
  type: MemoType;
  content: string;
  title?: string;
  serviceId: string;
  service?: Service;
  createdAt: string;
  updatedAt: string;
}

export interface Relation {
  id: string;
  type: RelationType;
  fromServiceId: string;
  toServiceId: string;
  fromService?: Service;
  toService?: Service;
  description?: string;
  createdAt: string;
}

// API request/response types
export interface CreateServiceRequest {
  name: string;
  description?: string;
  categoryId: string;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  categoryId?: string;
}

export interface CreateMemoRequest {
  type: MemoType;
  content: string;
  title?: string;
}

export interface UpdateMemoRequest {
  type?: MemoType;
  content?: string;
  title?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  color?: string;
}

export interface CreateRelationRequest {
  type: RelationType;
  fromServiceId: string;
  toServiceId: string;
  description?: string;
}

export interface SearchParams {
  q?: string;
  category?: string;
  sort?: 'relevance' | 'alphabetical' | 'updated';
}

export interface SearchResult {
  services: Service[];
  total: number;
}

// Comparison types
export interface ComparisonAttribute {
  id: string;
  name: string;
  description?: string;
  dataType: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'URL';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceAttributeValue {
  id: string;
  serviceId: string;
  attributeId: string;
  value: string;
  service?: Service;
  attribute?: ComparisonAttribute;
  createdAt: string;
  updatedAt: string;
}

export interface ComparisonService {
  id: string;
  name: string;
  description?: string;
  category: Category;
  attributes: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ComparisonData {
  services: ComparisonService[];
  attributes: Array<{
    name: string;
    displayName: string;
    dataType: string;
    isDefault: boolean;
    description?: string;
  }>;
  metadata: {
    serviceCount: number;
    attributeCount: number;
    generatedAt: string;
  };
}

export interface CreateComparisonAttributeRequest {
  name: string;
  description?: string;
  dataType: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'URL';
}

export interface SetAttributeValueRequest {
  value: any;
}

export interface CompareServicesRequest {
  serviceIds: string[];
  attributeIds?: string[];
}

export interface ExportComparisonRequest {
  serviceIds: string[];
  attributeIds?: string[];
  format: 'csv' | 'pdf';
}

// Error response type
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}