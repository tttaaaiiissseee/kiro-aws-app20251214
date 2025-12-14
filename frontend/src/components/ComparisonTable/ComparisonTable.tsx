import React, { useState, useEffect } from 'react';
import { Service, ComparisonData, ComparisonAttribute } from '../../types/api';
import { comparisonApi } from '../../services/api';
import { useToast } from '../Toast';

interface ComparisonTableProps {
  selectedServices: Service[];
  onServiceRemove: (serviceId: string) => void;
  onExport?: (format: 'csv' | 'pdf') => void;
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({
  selectedServices,
  onServiceRemove,
  onExport,
}) => {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [attributes, setAttributes] = useState<ComparisonAttribute[]>([]);
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Load available attributes
  useEffect(() => {
    const loadAttributes = async () => {
      try {
        const attrs = await comparisonApi.getAttributes();
        setAttributes(attrs);
      } catch (err) {
        console.error('Failed to load comparison attributes:', err);
        showToast('比較属性の読み込みに失敗しました', 'error');
      }
    };

    loadAttributes();
  }, [showToast]);

  // Generate comparison data when services change
  useEffect(() => {
    if (selectedServices.length === 0) {
      setComparisonData(null);
      return;
    }

    const generateComparison = async () => {
      setLoading(true);
      setError(null);

      try {
        const serviceIds = selectedServices.map(s => s.id);
        const data = await comparisonApi.compareServices({
          serviceIds,
          attributeIds: selectedAttributeIds.length > 0 ? selectedAttributeIds : undefined,
        });
        setComparisonData(data);
      } catch (err: any) {
        const errorMessage = err.response?.data?.error?.message || '比較データの生成に失敗しました';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };

    generateComparison();
  }, [selectedServices, selectedAttributeIds, showToast]);

  const handleAttributeToggle = (attributeId: string) => {
    setSelectedAttributeIds(prev => {
      if (prev.includes(attributeId)) {
        return prev.filter(id => id !== attributeId);
      } else {
        return [...prev, attributeId];
      }
    });
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!comparisonData || selectedServices.length === 0) {
      showToast('エクスポートするデータがありません', 'error');
      return;
    }

    try {
      const serviceIds = selectedServices.map(s => s.id);
      const blob = await comparisonApi.exportComparison({
        serviceIds,
        attributeIds: selectedAttributeIds.length > 0 ? selectedAttributeIds : undefined,
        format,
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aws-services-comparison-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(`${format.toUpperCase()}ファイルをダウンロードしました`, 'success');
      
      if (onExport) {
        onExport(format);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'エクスポートに失敗しました';
      showToast(errorMessage, 'error');
    }
  };

  if (selectedServices.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg mb-2">📊</div>
          <p className="text-gray-500">
            比較するサービスを選択してください（最大5つまで）
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">比較データを生成中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <div className="text-red-400 text-lg mb-2">⚠️</div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!comparisonData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Service Selection Summary */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            選択中のサービス ({selectedServices.length}/5)
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              CSV出力
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              PDF出力
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {selectedServices.map(service => (
            <div
              key={service.id}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
            >
              {service.name}
              <button
                onClick={() => onServiceRemove(service.id)}
                className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Attributes Selection */}
      {attributes.filter(attr => !attr.isDefault).length > 0 && (
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            カスタム比較属性
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {attributes
              .filter(attr => !attr.isDefault)
              .map(attr => (
                <label key={attr.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedAttributeIds.includes(attr.id)}
                    onChange={() => handleAttributeToggle(attr.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{attr.name}</span>
                </label>
              ))}
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            サービス比較表
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    属性
                  </th>
                  {comparisonData.services.map(service => (
                    <th
                      key={service.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center space-x-2">
                        <span>{service.name}</span>
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: service.category.color || '#6B7280' }}
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comparisonData.attributes.map((attribute, index) => (
                  <tr key={attribute.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div>
                        <div>{attribute.displayName}</div>
                        {attribute.description && (
                          <div className="text-xs text-gray-500">{attribute.description}</div>
                        )}
                      </div>
                    </td>
                    {comparisonData.services.map(service => {
                      const value = service.attributes[attribute.name];
                      return (
                        <td key={service.id} className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs">
                            {value !== null && value !== undefined ? (
                              attribute.dataType === 'URL' ? (
                                <a
                                  href={value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  {value}
                                </a>
                              ) : attribute.dataType === 'BOOLEAN' ? (
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {value ? 'はい' : 'いいえ'}
                                </span>
                              ) : (
                                <span className="break-words">{String(value)}</span>
                              )
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-600">
          <p>
            生成日時: {new Date(comparisonData.metadata.generatedAt).toLocaleString('ja-JP')}
          </p>
          <p>
            比較サービス数: {comparisonData.metadata.serviceCount} / 
            比較属性数: {comparisonData.metadata.attributeCount}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTable;