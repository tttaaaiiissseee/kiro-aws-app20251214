import React, { useState } from 'react';
import { Service, ComparisonAttribute } from '../types/api';
import { ServiceSelector } from '../components/ServiceSelector';
import { ComparisonTable } from '../components/ComparisonTable';
import { CustomAttributeManager } from '../components/CustomAttributeManager';
import { AttributeValueEditor } from '../components/AttributeValueEditor';

const Comparison: React.FC = () => {
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState<'compare' | 'attributes' | 'values'>('compare');
  const [attributes, setAttributes] = useState<ComparisonAttribute[]>([]);
  const [selectedServiceForValues, setSelectedServiceForValues] = useState<Service | null>(null);

  const handleServiceSelect = (service: Service) => {
    if (selectedServices.length >= 5) {
      return; // Max 5 services
    }
    setSelectedServices(prev => [...prev, service]);
  };

  const handleServiceDeselect = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
    
    // Clear selected service for values if it was deselected
    if (selectedServiceForValues?.id === serviceId) {
      setSelectedServiceForValues(null);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    // Export handling is done in ComparisonTable component
    console.log(`Exported as ${format}`);
  };

  const handleAttributeCreated = (attribute: ComparisonAttribute) => {
    setAttributes(prev => [...prev, attribute]);
  };

  const handleValueUpdated = (serviceId: string, attributeId: string, value: any) => {
    // Handle value update if needed
    console.log(`Updated ${serviceId} ${attributeId} to ${value}`);
  };

  const tabs = [
    { id: 'compare', name: '比較', icon: '📊' },
    { id: 'attributes', name: '属性管理', icon: '⚙️' },
    { id: 'values', name: '属性値設定', icon: '📝' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">サービス比較</h1>
          <p className="mt-2 text-sm text-gray-700">
            複数のAWSサービスを並べて比較できます。最大5つまでのサービスを選択してください。
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'compare' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Service Selector */}
          <div className="lg:col-span-1">
            <ServiceSelector
              selectedServices={selectedServices}
              onServiceSelect={handleServiceSelect}
              onServiceDeselect={handleServiceDeselect}
              maxServices={5}
            />
          </div>

          {/* Comparison Table */}
          <div className="lg:col-span-2">
            <ComparisonTable
              selectedServices={selectedServices}
              onServiceRemove={handleServiceDeselect}
              onExport={handleExport}
            />
          </div>
        </div>
      )}

      {activeTab === 'attributes' && (
        <div className="max-w-4xl">
          <CustomAttributeManager
            onAttributeCreated={handleAttributeCreated}
          />
        </div>
      )}

      {activeTab === 'values' && (
        <div className="space-y-6">
          {selectedServices.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center py-8 text-gray-500">
                <div className="text-gray-400 text-lg mb-2">📝</div>
                <p>属性値を設定するサービスを選択してください</p>
                <p className="text-sm">「比較」タブでサービスを選択してから戻ってきてください</p>
              </div>
            </div>
          ) : (
            <>
              {/* Service Selection for Values */}
              <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  属性値を設定するサービスを選択
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedServices.map(service => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedServiceForValues(service)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        selectedServiceForValues?.id === service.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{service.name}</div>
                      {service.description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {service.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attribute Value Editor */}
              {selectedServiceForValues && (
                <AttributeValueEditor
                  service={selectedServiceForValues}
                  attributes={attributes}
                  onValueUpdated={handleValueUpdated}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Comparison;