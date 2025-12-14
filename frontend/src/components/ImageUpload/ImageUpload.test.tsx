import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ImageUpload } from './ImageUpload';

// Mock the API
vi.mock('../../services/api', () => ({
  filesApi: {
    upload: vi.fn().mockResolvedValue({
      filename: 'test-image.jpg',
      url: 'http://localhost:8000/api/files/test-image.jpg',
    }),
  },
}));

describe('ImageUpload', () => {
  it('renders upload area correctly', () => {
    const mockOnUpload = vi.fn();
    
    const { getByText } = render(
      <ImageUpload onUpload={mockOnUpload} />
    );

    expect(getByText('クリックして画像を選択')).toBeInTheDocument();
    expect(getByText('または ドラッグ&ドロップ')).toBeInTheDocument();
    expect(getByText('PNG, JPG, GIF, WebP (5MB以下)')).toBeInTheDocument();
  });

  it('handles drag over events', () => {
    const mockOnUpload = vi.fn();
    
    const { container } = render(
      <ImageUpload onUpload={mockOnUpload} />
    );

    const uploadArea = container.querySelector('div[class*="border-dashed"]');
    expect(uploadArea).toBeInTheDocument();

    if (uploadArea) {
      fireEvent.dragOver(uploadArea);
      expect(uploadArea.className).toContain('border-blue-500');
    }
  });

  it('shows disabled state correctly', () => {
    const mockOnUpload = vi.fn();
    
    const { container } = render(
      <ImageUpload onUpload={mockOnUpload} disabled={true} />
    );

    const uploadArea = container.querySelector('div[class*="border-dashed"]');
    expect(uploadArea?.className).toContain('opacity-50');
    expect(uploadArea?.className).toContain('cursor-not-allowed');
  });
});