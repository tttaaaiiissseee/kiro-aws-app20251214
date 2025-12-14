import React, { useState, useEffect } from 'react';
import { Service, ComparisonAttribute } from '../../types/api';
import { comparisonApi } from '../../services/api';
import { useToast } from '../Toast';

interface AttributeValueEditorProps {
  service: Service;
  attributes: ComparisonAttribute[];
  onValueUpdated?: (serviceId: string, attributeId: string, value: any) => void;
}

const AttributeValueEditor: React.FC<AttributeValueEditorProps> = ({
  service,
  attributes,
  onValueUpdated,
}) => {
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const { showToast } = useToast();

  // Initialize values (this would typically come from the service data)
  useEffect(() => {
    // In a real implementation, you'd fetch existing attribute values for this service
    // For now, we'll initialize with empty values
    const initialValues: Record<string, any> = {};
    attributes.forEach(attr => {
      if (!attr.isDefault) {
        initialValues[attr.id] = '';
      }
    });
    setValues(initialValues);
  }, [attributes]);

  const handleValueChange = (attributeId: string, value: any) => {
    setValues(prev => ({
      ...prev,
      [attributeId]: value,
    }));
  };

  const handleValueSave = async (attributeId: string) => {
    const value = values[attributeId];
    const attribute = attributes.find(attr => attr.id === attributeId);
    
    if (!attribute) return;

    // Validate value based on data type
    if (attribute.dataType === 'NUMBER' && value !== '' && isNaN(Number(value))) {
      showToast('数値を入力してください', 'error');
      return;
    }

    if (attribute.dataType === 'URL' && value !== '') {
      try {
        new URL(value);
      } catch {
        showToast('有効なURLを入力してください', 'error');
        return;
      }
    }

    try {
      setLoading(prev => ({ ...prev, [attributeId]: true }));
      
      await comparisonApi.setAttributeValue(service.id, attributeId, { value });
      
      showToast('属性値を保存しました', 'success');
      
      if (onValueUpdated) {
        onValueUpdated(service.id, attributeId, value);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || '属性値の保存に失敗しました';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(prev => ({ ...prev, [attributeId]: false }));
    }
  };

  const renderValueInput = (attribute: ComparisonAttribute) => {
    const value = values[attribute.id] || '';
    const isLoading = loading[attribute.id];

    switch (attribute.dataType) {
      case 'BOOLEAN':
        return (
          <select
            value={value.toString()}
            onChange={(e) => handleValueChange(attribute.id, e.target.value === 'true')}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={isLoading}
          >
            <option value="">選択してください</option>
            <option value="true">はい</option>
            <option value="false">いいえ</option>
          </select>
        );

      case 'NUMBER':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleValueChange(attribute.id, e.target.value)}
            placeholder="数値を入力"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={isLoading}
          />
        );

      case 'URL':
        return (
          <input
            type="url"
            value={value}
            onChange={(e) => handleValueChange(attribute.id, e.target.value)}
            placeholder="https://example.com"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={isLoading}
          />
        );

      case 'TEXT':
      default:
        return (
          <textarea
            value={value}
            onChange={(e) => handleValueChange(attribute.id, e.target.value)}
            placeholder="テキストを入力"
            rows={2}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={isLoading}
          />
        );
    }
  };

  const customAttributes = attributes.filter(attr => !attr.isDefault);

  if (customAttributes.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8 text-gray-500">
          <div className="text-gray-400 text-lg mb-2">📝</div>
          <p>カスタム属性がありません</p>
          <p className="text-sm">比較属性管理でカスタム属性を作成してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {service.name} の属性値設定
        </h3>

        <div className="space-y-6">
          {customAttributes.map(attribute => (
            <div key={attribute.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {attribute.name}
                    <span className="ml-1 text-xs text-gray-500">
                      ({attribute.dataType})
                    </span>
                  </label>
                  {attribute.description && (
                    <p className="text-xs text-gray-500 mb-2">
                      {attribute.description}
                    </p>
                  )}
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      {renderValueInput(attribute)}
                    </div>
                    <button
                      onClick={() => handleValueSave(attribute.id)}
                      disabled={loading[attribute.id]}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading[attribute.id] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        '保存'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttributeValueEditor;