import React from 'react';
import { Link } from 'react-router-dom';
import { Service } from '../../types/api';

interface ServiceCardProps {
  service: Service;
  onEdit?: (service: Service) => void;
  onDelete?: (service: Service) => void;
  searchQuery?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onEdit, onDelete, searchQuery }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Highlight search terms in text
  const highlightSearchTerms = (text: string, query?: string): React.ReactNode => {
    if (!query?.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Link
              to={`/services/${service.id}`}
              className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors"
            >
              {highlightSearchTerms(service.name, searchQuery)}
            </Link>
            {service.category && (
              <div className="flex items-center mt-2">
                {service.category.color && (
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: service.category.color }}
                  />
                )}
                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                  {service.category.name}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            {onEdit && (
              <button
                onClick={() => onEdit(service)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="編集"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(service)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="削除"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        {service.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {highlightSearchTerms(service.description, searchQuery)}
          </p>
        )}

        {/* Memos count */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{(service as any)._count?.memos || service.memos?.length || 0} メモ</span>
          </div>
          <div className="text-xs">
            更新: {formatDate(service.updatedAt)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;