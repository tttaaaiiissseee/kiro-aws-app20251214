import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoEditor } from './MemoEditor';
import { MemoType } from '../../types/api';
import { ToastProvider } from '../Toast';

// Mock the API
vi.mock('../../services/api', () => ({
  filesApi: {
    getUrl: (filename: string) => `http://localhost:8000/api/files/${filename}`,
  },
}));

// Mock the hooks
vi.mock('../../hooks/useMemos', () => ({
  useCreateMemo: () => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  }),
  useUpdateMemo: () => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  }),
  useDeleteMemo: () => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
};

describe('MemoEditor', () => {
  it('renders new memo form correctly', () => {
    const Wrapper = createWrapper();
    
    const { getByText } = render(
      <Wrapper>
        <MemoEditor serviceId="test-service-id" />
      </Wrapper>
    );

    expect(getByText('メモタイプ')).toBeInTheDocument();
    expect(getByText('テキスト')).toBeInTheDocument();
    expect(getByText('保存')).toBeInTheDocument();
    expect(getByText('キャンセル')).toBeInTheDocument();
  });

  it('renders existing memo correctly', () => {
    const Wrapper = createWrapper();
    const mockMemo = {
      id: 'memo-1',
      type: MemoType.TEXT,
      content: 'Test memo content',
      title: 'Test Title',
      serviceId: 'service-1',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    const { getByText } = render(
      <Wrapper>
        <MemoEditor serviceId="test-service-id" memo={mockMemo} />
      </Wrapper>
    );

    expect(getByText('Test Title')).toBeInTheDocument();
    expect(getByText('Test memo content')).toBeInTheDocument();
    expect(getByText('テキスト')).toBeInTheDocument();
    expect(getByText('編集')).toBeInTheDocument();
    expect(getByText('削除')).toBeInTheDocument();
  });
});