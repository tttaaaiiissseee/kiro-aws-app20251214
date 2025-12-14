import React, { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories';
import { useToast } from '../components/Toast';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types/api';

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

const CategoryManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: DEFAULT_COLORS[0],
  });
  const [errors, setErrors] = useState<Partial<CategoryFormData>>({});

  const { data: categories = [], isLoading, error } = useCategories();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const { showSuccess, showError } = useToast();

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: DEFAULT_COLORS[0],
    });
    setErrors({});
    setEditingCategory(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || DEFAULT_COLORS[0],
    });
    setEditingCategory(category);
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CategoryFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'カテゴリ名は必須です';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'カテゴリ名は2文字以上で入力してください';
    }

    // Check for duplicate names (excluding current category when editing)
    const isDuplicate = categories.some(
      cat => cat.name.toLowerCase() === formData.name.trim().toLowerCase() && 
      cat.id !== editingCategory?.id
    );
    if (isDuplicate) {
      newErrors.name = 'このカテゴリ名は既に使用されています';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
      };

      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          data: categoryData as UpdateCategoryRequest,
        });
        showSuccess('カテゴリが更新されました');
      } else {
        await createCategoryMutation.mutateAsync(categoryData as CreateCategoryRequest);
        showSuccess('カテゴリが作成されました');
      }

      closeModal();
    } catch (error: any) {
      showError(error.response?.data?.error?.message || 'エラーが発生しました');
    }
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`「${category.name}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    try {
      await deleteCategoryMutation.mutateAsync(category.id);
      showSuccess('カテゴリが削除されました');
    } catch (error: any) {
      showError(error.response?.data?.error?.message || '削除に失敗しました');
    }
  };

  const handleInputChange = (field: keyof CategoryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">カテゴリの読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">カテゴリ管理</h1>
          <p className="mt-2 text-sm text-gray-700">
            AWSサービスのカテゴリを管理します。
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            新しいカテゴリを追加
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="bg-white shadow rounded-lg">
        {categories.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">カテゴリがありません</p>
            <button
              onClick={openCreateModal}
              className="mt-2 text-blue-600 hover:text-blue-500"
            >
              最初のカテゴリを作成する
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {categories.map((category) => (
              <div
                key={category.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color || DEFAULT_COLORS[0] }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    <button
                      onClick={() => openEditModal(category)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="編集"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="削除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  作成日: {new Date(category.createdAt).toLocaleDateString('ja-JP')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCategory ? 'カテゴリを編集' : '新しいカテゴリを作成'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    カテゴリ名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.name ? 'border-red-300' : ''
                    }`}
                    placeholder="例: Compute"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Description Field */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    説明
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="カテゴリの説明を入力してください"
                  />
                </div>

                {/* Color Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カテゴリ色
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {DEFAULT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleInputChange('color', color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.color === color
                            ? 'border-gray-900 scale-110'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="mt-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      className="w-full h-8 rounded border border-gray-300"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={createCategoryMutation.isLoading || updateCategoryMutation.isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createCategoryMutation.isLoading || updateCategoryMutation.isLoading
                      ? '保存中...'
                      : editingCategory
                      ? '更新'
                      : '作成'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;