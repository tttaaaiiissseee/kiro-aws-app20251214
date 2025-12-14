import React, { useState, useEffect } from 'react';
import { ComparisonAttribute, CreateComparisonAttributeRequest } from '../../types/api';
import { comparisonApi } from '../../services/api';
import { useToast } from '../Toast';

interface CustomAttributeManagerProps {
  onAttributeCreated?: (attribute: ComparisonAttribute) => void;
}

const CustomAttributeManager: React.FC<CustomAttributeManagerProps> = ({
  onAttributeCreated,
}) => {
  const [attributes, setAttributes] = useState<ComparisonAttribute[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateComparisonAttributeRequest>({
    name: '',
    description: '',
    dataType: 'TEXT',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  // Load attributes
  useEffect(() => {
    const loadAttributes = async () => {
      try {
        setLoading(true);
        const attrs = await comparisonApi.getAttributes();
        setAttributes(attrs);
      } catch (err) {
        console.error('Failed to load attributes:', err);
        showToast('属性の読み込みに失敗しました', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadAttributes();
  }, [showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast('属性名を入力してください', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const newAttribute = await comparisonApi.createAttribute(formData);
      
      setAttributes(prev => [...prev, newAttribute]);
      setFormData({ name: '', description: '', dataType: 'TEXT' });
      setIsCreating(false);
      
      showToast('カスタム属性を作成しました', 'success');
      
      if (onAttributeCreated) {
        onAttributeCreated(newAttribute);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'カスタム属性の作成に失敗しました';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setFormData({ name: '', description: '', dataType: 'TEXT' });
  };

  const customAttributes = attributes.filter(attr => !attr.isDefault);
  const defaultAttributes = attributes.filter(attr => attr.isDefault);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            比較属性管理
          </h3>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              + 新しい属性
            </button>
          )}
        </div>

        {/* Create Form */}
        {isCreating && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              新しいカスタム属性を作成
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  属性名 *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例: 料金モデル、可用性、パフォーマンス"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  説明
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="この属性の詳細説明（オプション）"
                  rows={2}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="dataType" className="block text-sm font-medium text-gray-700">
                  データ型
                </label>
                <select
                  id="dataType"
                  value={formData.dataType}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataType: e.target.value as any }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="TEXT">テキスト</option>
                  <option value="NUMBER">数値</option>
                  <option value="BOOLEAN">真偽値</option>
                  <option value="URL">URL</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {submitting ? '作成中...' : '作成'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Default Attributes */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            標準属性
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {defaultAttributes.map(attr => (
              <div
                key={attr.id}
                className="p-3 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900">{attr.name}</h5>
                    {attr.description && (
                      <p className="text-xs text-gray-500 mt-1">{attr.description}</p>
                    )}
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {attr.dataType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Attributes */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            カスタム属性 ({customAttributes.length})
          </h4>
          {customAttributes.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <div className="text-gray-400 text-lg mb-2">📝</div>
              <p>カスタム属性がありません</p>
              <p className="text-sm">「新しい属性」ボタンから作成できます</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {customAttributes.map(attr => (
                <div
                  key={attr.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">{attr.name}</h5>
                      {attr.description && (
                        <p className="text-xs text-gray-500 mt-1">{attr.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        作成日: {new Date(attr.createdAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {attr.dataType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomAttributeManager;