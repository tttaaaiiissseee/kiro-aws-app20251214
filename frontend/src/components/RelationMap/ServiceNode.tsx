import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Service } from '../../types/api';

interface ServiceNodeData {
  service: Service;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: (serviceId: string) => void;
}

const ServiceNode: React.FC<NodeProps<ServiceNodeData>> = ({ data }) => {
  const { service, isSelected, isHighlighted, onSelect } = data;

  const handleClick = () => {
    onSelect(service.id);
  };

  const getNodeStyle = () => {
    if (isSelected) {
      return 'border-blue-500 bg-blue-50 shadow-lg';
    }
    if (isHighlighted) {
      return 'border-green-500 bg-green-50 shadow-md';
    }
    return 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md';
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 cursor-pointer transition-all duration-200 min-w-[180px] ${getNodeStyle()}`}
      onClick={handleClick}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />

      {/* Node content */}
      <div className="text-center">
        <h3 className="font-semibold text-sm text-gray-900 mb-1">
          {service.name}
        </h3>
        {service.category && (
          <div className="text-xs text-gray-600 mb-1">
            {service.category.name}
          </div>
        )}
        {service.description && (
          <p className="text-xs text-gray-500 line-clamp-2">
            {service.description}
          </p>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
      )}
    </div>
  );
};

export default ServiceNode;