import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import { Relation, RelationType } from '../../types/api';

interface RelationEdgeData {
  relation: Relation;
  config: {
    color: string;
    label: string;
  };
}

const RelationEdge: React.FC<EdgeProps<RelationEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) => {
  const { relation, config } = data || {};

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  if (!relation || !config) {
    return null;
  }

  // Get arrow style based on relation type
  const getArrowStyle = () => {
    switch (relation.type) {
      case RelationType.DEPENDS_ON:
        return 'arrowclosed';
      case RelationType.INTEGRATES_WITH:
        return 'arrowclosed';
      case RelationType.ALTERNATIVE_TO:
        return 'arrow';
      default:
        return 'arrowclosed';
    }
  };

  // Get edge style based on relation type
  const getEdgeStyle = () => {
    switch (relation.type) {
      case RelationType.DEPENDS_ON:
        return { strokeDasharray: '5,5' }; // Dashed line for dependencies
      case RelationType.ALTERNATIVE_TO:
        return { strokeDasharray: '10,5' }; // Different dash pattern for alternatives
      default:
        return {}; // Solid line for integrations
    }
  };

  return (
    <>
      <path
        id={id}
        style={{
          stroke: config.color,
          strokeWidth: 2,
          fill: 'none',
          ...getEdgeStyle(),
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={`url(#${getArrowStyle()}-${config.color.replace('#', '')})`}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 10,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div 
            className="px-2 py-1 bg-white border rounded shadow-sm text-xs font-medium"
            style={{ 
              borderColor: config.color,
              color: config.color,
            }}
          >
            {config.label}
            {relation.description && (
              <div className="text-gray-500 text-xs mt-1">
                {relation.description}
              </div>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default RelationEdge;