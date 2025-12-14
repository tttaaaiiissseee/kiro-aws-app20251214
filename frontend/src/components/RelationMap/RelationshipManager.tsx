import React, { useState } from 'react';
import { Service, RelationType, CreateRelationRequest } from '../../types/api';
import { useCreateRelation } from '../../hooks/useRelations';
import { useServices } from '../../hooks/useServices';

interface RelationshipManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedService?: Service | null;
}

const relationTypeOptions = [
  { value: RelationType.INTEGRATES_WITH, label: '統合する', description: 'サービス同士が連携して動作する' },
  { value: RelationType.DEPENDS_ON, label: '依存する', description: 'このサービスが他のサービスに依存している' },
  { value: RelationType.ALTERNATIVE_TO, label: '代替となる', description: 'このサービスが他のサービスの代替手段となる' },
];

const RelationshipManager: React.FC<RelationshipManagerProps> = ({
  isOpen,
  onClose,
  selectedService,
}) => {
  const { data: services = [] } = useServices();
  const createRelationMutation = useCreateRelation();
  // const deleteRelationMutation = useDeleteRelation(); // TODO: Implement delete functionality

  const [formData, setFormData] = useState<CreateRelationRequest>({
    type: RelationType.INTEGRATES_WITH,
    fromServiceId: selectedService?.id || '',
    toServiceId: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (selectedService) {
      setFormData(prev => ({
        ...prev,
        fromServiceId: selectedService.id,
      }));
    }
  }, [selectedService]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fromServiceId) {
      newErrors.fromServiceId = '開始サービスを選択してください';
    }
    if (!formData.toServiceId) {
      newErrors.toServiceId = '終了サービスを選択してください';
    }
    if (formData.fromServiceId === formData.toServiceId) {
      newErrors.toServiceId = '同じサービス同士の関係は作成できません';
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
      await createRelationMutation.mutateAsync(formData);
      
      // Reset form
      setFormData({
        type: RelationType.INTEGRATES_WITH,
        fromServiceId: selectedService?.id || '',
        toServiceId: '',
        description: '',
      });
      setErrors({});
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Failed to create relation:', error);
      setErrors({ submit: '関係の作成に失敗しました' });
    }
  };

  const handleInputChange = (field: keyof CreateRelationRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const availableServices = services.filter(service => service.id !== formData.fromServiceId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              新しい関係を作成
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* From Service */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                開始サービス
              </label>
              <select
                value={formData.fromServiceId}
                onChange={(e) => handleInputChange('fromServiceId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">サービスを選択...</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              {errors.fromServiceId && (
                <p className="mt-1 text-sm text-red-600">{errors.fromServiceId}</p>
              )}
            </div>

            {/* Relation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                関係タイプ
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value as RelationType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {relationTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {relationTypeOptions.find(opt => opt.value === formData.type)?.description}
              </p>
            </div>

            {/* To Service */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                終了サービス
              </label>
              <select
                value={formData.toServiceId}
                onChange={(e) => handleInputChange('toServiceId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">サービスを選択...</option>
                {availableServices.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              {errors.toServiceId && (
                <p className="mt-1 text-sm text-red-600">{errors.toServiceId}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                説明 (オプション)
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="関係の詳細説明..."
              />
            </div>

            {errors.submit && (
              <p className="text-sm text-red-600">{errors.submit}</p>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={createRelationMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors"
              >
                {createRelationMutation.isLoading ? '作成中...' : '作成'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RelationshipManager;