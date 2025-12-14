// テスト用のダミーデータ
import { Category, Service, Memo } from '../types/api';

export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Compute',
    description: 'コンピューティングサービス',
    color: '#3B82F6',
    sortOrder: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    _count: { services: 3 },
  },
  {
    id: '2',
    name: 'Storage',
    description: 'ストレージサービス',
    color: '#10B981',
    sortOrder: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    _count: { services: 2 },
  },
  {
    id: '3',
    name: 'Database',
    description: 'データベースサービス',
    color: '#F59E0B',
    sortOrder: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    _count: { services: 4 },
  },
];

export const mockServices: Service[] = [
  {
    id: '1',
    name: 'EC2',
    description: 'Amazon Elastic Compute Cloud - 仮想サーバーサービス',
    categoryId: '1',
    category: mockCategories[0],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    memos: [],
  },
  {
    id: '2',
    name: 'Lambda',
    description: 'サーバーレスコンピューティングサービス',
    categoryId: '1',
    category: mockCategories[0],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    memos: [],
  },
  {
    id: '3',
    name: 'S3',
    description: 'Amazon Simple Storage Service - オブジェクトストレージ',
    categoryId: '2',
    category: mockCategories[1],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    memos: [],
  },
  {
    id: '4',
    name: 'RDS',
    description: 'Amazon Relational Database Service - マネージドデータベース',
    categoryId: '3',
    category: mockCategories[2],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    memos: [],
  },
];

export const mockMemos: Memo[] = [
  {
    id: '1',
    type: 'TEXT',
    content: 'EC2は仮想サーバーを提供するサービスです。インスタンスタイプを選択して、必要なリソースを確保できます。',
    title: 'EC2の基本',
    serviceId: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    type: 'LINK',
    content: 'https://docs.aws.amazon.com/ec2/',
    title: 'EC2公式ドキュメント',
    serviceId: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];