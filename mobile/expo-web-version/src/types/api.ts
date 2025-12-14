// Webアプリから移植した型定義
export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
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
  attributeValues?: ServiceAttributeValue[];
  createdAt: string;
  updatedAt: string;
}

export interface Memo {
  id: string;
  type: 'TEXT' | 'LINK' | 'IMAGE';
  content: string;
  title?: string;
  serviceId: string;
  service?: Service;
  createdAt: string;
  updatedAt: string;
}

export interface Relation {
  id: string;
  type: 'INTEGRATES_WITH' | 'DEPENDS_ON' | 'ALTERNATIVE_TO';
  fromServiceId: string;
  toServiceId: string;
  fromService?: Service;
  toService?: Service;
  description?: string;
  createdAt: string;
}

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

// Request types
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
  type: 'TEXT' | 'LINK' | 'IMAGE';
  content: string;
  title?: string;
}

export interface UpdateMemoRequest {
  type?: 'TEXT' | 'LINK' | 'IMAGE';
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
  type: 'INTEGRATES_WITH' | 'DEPENDS_ON' | 'ALTERNATIVE_TO';
  fromServiceId: string;
  toServiceId: string;
  description?: string;
}

export interface SearchParams {
  q?: string;
  category?: string;
  sort?: 'relevance' | 'name' | 'updated';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  services: Service[];
  total: number;
}

export interface ComparisonData {
  services: Service[];
  attributes: ComparisonAttribute[];
  values: Record<string, Record<string, string>>;
}

export interface CreateComparisonAttributeRequest {
  name: string;
  description?: string;
  dataType: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'URL';
}

export interface SetAttributeValueRequest {
  value: string;
}

export interface CompareServicesRequest {
  serviceIds: string[];
  attributeIds?: string[];
}

export interface ExportComparisonRequest {
  serviceIds: string[];
  attributeIds?: string[];
  format: 'PDF' | 'CSV';
}