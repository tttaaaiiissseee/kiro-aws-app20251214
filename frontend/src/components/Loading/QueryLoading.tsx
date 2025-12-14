import React from 'react';

interface QueryLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const QueryLoading: React.FC<QueryLoadingProps> = ({
  size = 'md',
  message = 'Loading...',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const containerClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-8',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
      {message && (
        <p className="mt-2 text-sm text-gray-600 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

// Skeleton loading component for lists
export const QueryListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="bg-gray-200 rounded-lg p-4">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Skeleton loading component for cards
export const QueryCardSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="bg-gray-200 rounded-lg p-4 h-48">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-2/3 mb-4"></div>
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QueryLoading;