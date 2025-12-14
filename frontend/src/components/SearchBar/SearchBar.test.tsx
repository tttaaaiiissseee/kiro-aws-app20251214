// import React from 'react'; // Not needed in this test file
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
  it('renders with placeholder text', () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} placeholder="Test placeholder" />);
    
    expect(screen.getByPlaceholderText('Test placeholder')).toBeInTheDocument();
  });

  it('calls onSearch when form is submitted', () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByRole('textbox');
    const form = input.closest('form');
    
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.submit(form!);
    
    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });

  it('shows clear button when there is text', () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    
    expect(screen.getByRole('button', { name: /クリア/i })).toBeInTheDocument();
  });

  it('clears input when clear button is clicked', () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test' } });
    
    const clearButton = screen.getByRole('button', { name: /クリア/i });
    fireEvent.click(clearButton);
    
    expect(input.value).toBe('');
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  it('updates input value when defaultValue changes', () => {
    const mockOnSearch = vi.fn();
    const { rerender } = render(<SearchBar onSearch={mockOnSearch} defaultValue="initial" />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('initial');
    
    rerender(<SearchBar onSearch={mockOnSearch} defaultValue="updated" />);
    expect(input.value).toBe('updated');
  });
});