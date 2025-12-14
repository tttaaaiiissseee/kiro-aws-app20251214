import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useService, useUpdateService, useDeleteService, useCreateService } from '../hooks/useServices';
import { useCategories } from '../hooks/useCategories';
import { CreateServiceRequest, UpdateServiceRequest } from '../types/api';
import { MemoList } from '../components/MemoEditor';

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewService = id === 'new';
  
  const [isEditing, setIsEditing] = useState(isNewService);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: service, isLoading, error } = useService(isNewService ? '' : id || '');
  

  const { data: categories = [] } = useCategories();

  
  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();
  const deleteServiceMutation = useDeleteService();

  const [formData, setFormData] = useState<CreateServiceRequest>({
    name: '',
    description: '',
    categoryId: '',
  });

  // Initialize form data when service loads or when editing starts
  React.useEffect(() => {
    if (service && !isNewService) {
      setFormData({
        name: service.name,
        description: service.description || '',
        categoryId: service.categoryId,
      });
    }
  }, [service, isNewService]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isNewService) {
        const newService = await createServiceMutation.mutateAsync(formData);
        navigate(`/services/${newService.id}`);
      } else {
        const updateData: UpdateServiceRequest = {
          name: formData?.name !== service?.name ? formData?.name : undefined,
          description: formData?.description !== service?.description ? formData?.description : undefined,
          categoryId: formData?.categoryId !== service?.categoryId ? formData?.categoryId : undefined,
        };
        
        // Only send fields that have changed
        const hasChanges = Object.values(updateData).some(value => value !== undefined);
        if (hasChanges) {
          await updateServiceMutation.mutateAsync({ id: id!, data: updateData });
        }
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save service:', error);
    }
  };

  const handleDelete = async () => {
    if (!service) return;
    
    try {
      await deleteServiceMutation.mutateAsync(service.id);
      navigate('/services');
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  };

  const handleCancel = () => {
    if (isNewService) {
      navigate('/services');
    } else {
      setIsEditing(false);
      // Reset form data
      if (service) {
        setFormData({
          name: service.name,
          description: service.description || '',
          categoryId: service.categoryId,
        });
      }
    }
  };

  // Validation
  const isFormValid = formData?.name?.trim() && formData?.categoryId;
  const isSubmitting = createServiceMutation.isLoading || updateServiceMutation.isLoading;

  if (isLoading && !isNewService) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !isNewService) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                サービスの読み込みに失敗しました
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>サービスが見つからないか、アクセスできません。</p>
              </div>
              <div className="mt-4">
                <Link
                  to="/services"
                  className="text-sm font-medium text-red-800 hover:text-red-600"
                >
                  サービス一覧に戻る →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link to="/services" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">サービス一覧</span>
                  <svg className="flex-shrink-0 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0L3.586 10l4.707-4.707a1 1 0 011.414 1.414L6.414 10l3.293 3.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <Link to="/services" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                    サービス一覧
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">
                    {isNewService ? '新しいサービス' : service?.name || 'サービス詳細'}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {isNewService ? '新しいサービスを追加' : isEditing ? 'サービスを編集' : service?.name}
          </h1>
        </div>

        {!isNewService && !isEditing && (
          <div className="mt-4 flex space-x-3 sm:mt-0">
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              編集
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              削除
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {isEditing || isNewService ? (
            /* Edit/Create Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  サービス名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData?.name || ''}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="例: Amazon EC2"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                  カテゴリ <span className="text-red-500">*</span>
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData?.categoryId || ''}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">カテゴリを選択してください</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  説明
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData?.description || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="サービスの説明を入力してください..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '保存中...' : isNewService ? '作成' : '保存'}
                </button>
              </div>
            </form>
          ) : (
            /* View Mode */
            <div className="space-y-6">
              {/* Service Info */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">サービス名</dt>
                  <dd className="mt-1 text-sm text-gray-900">{service?.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">カテゴリ</dt>
                  <dd className="mt-1 flex items-center">
                    {service?.category?.color && (
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: service.category.color }}
                      />
                    )}
                    <span className="text-sm text-gray-900">{service?.category?.name}</span>
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">説明</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {service?.description || '説明が設定されていません'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">作成日</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {service && new Date(service.createdAt).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">最終更新</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {service && new Date(service.updatedAt).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </dd>
                </div>
              </div>

              {/* Memos Section */}
              <div className="border-t border-gray-200 pt-6">

                {service?.id ? (
                  <MemoList serviceId={service.id} />
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      メモ (読み込み中...)
                    </h3>
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                      <div className="space-y-3">
                        <div className="h-20 bg-gray-100 rounded"></div>
                        <div className="h-20 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">サービスを削除</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  「{service?.name}」を削除しますか？この操作は取り消せません。
                  関連するすべてのメモと関係性も削除されます。
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-4 py-2 bg-white text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteServiceMutation.isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {deleteServiceMutation.isLoading ? '削除中...' : '削除する'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDetail;