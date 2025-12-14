// ナビゲーションの型定義
export type RootStackParamList = {
  Main: undefined;
  ServiceDetail: { serviceId: string };
  ServiceForm: { serviceId?: string; categoryId?: string };
  CategoryForm: { categoryId?: string };
  MemoForm: { serviceId: string; memoId?: string };
};

export type MainTabParamList = {
  Services: undefined;
  Categories: undefined;
  Relations: undefined;
  Comparison: undefined;
  Search: undefined;
};

export type ServicesStackParamList = {
  ServiceList: { categoryId?: string };
  ServiceDetail: { serviceId: string };
  ServiceForm: { serviceId?: string; categoryId?: string };
};

export type CategoriesStackParamList = {
  CategoryList: undefined;
  CategoryForm: { categoryId?: string };
};