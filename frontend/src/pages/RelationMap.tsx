import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useServices } from '../hooks/useServices';
import { useRelations } from '../hooks/useRelations';
import { Service, Relation, RelationType } from '../types/api';
import ServiceNode from '../components/RelationMap/ServiceNode';
import RelationEdge from '../components/RelationMap/RelationEdge';
import RelationControls from '../components/RelationMap/RelationControls';
import RelationshipManager from '../components/RelationMap/RelationshipManager';
import RelationDetails from '../components/RelationMap/RelationDetails';

// Custom node and edge types
const nodeTypes: NodeTypes = {
  serviceNode: ServiceNode,
};

const edgeTypes: EdgeTypes = {
  relationEdge: RelationEdge,
};

// Relation type colors and labels
const relationTypeConfig = {
  [RelationType.INTEGRATES_WITH]: {
    color: '#10b981', // green
    label: '統合',
  },
  [RelationType.DEPENDS_ON]: {
    color: '#f59e0b', // amber
    label: '依存',
  },
  [RelationType.ALTERNATIVE_TO]: {
    color: '#8b5cf6', // violet
    label: '代替',
  },
};

const RelationMap: React.FC = () => {
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: relations = [], isLoading: relationsLoading } = useRelations();
  
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [showRelationshipManager, setShowRelationshipManager] = useState(false);
  const [showRelationDetails, setShowRelationDetails] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState<Relation | null>(null);

  // Convert services to React Flow nodes
  const initialNodes = useMemo(() => {
    if (!services.length) return [];

    return services.map((service: Service, index: number) => {
      // Simple grid layout
      const x = (index % 5) * 250;
      const y = Math.floor(index / 5) * 150;

      return {
        id: service.id,
        type: 'serviceNode',
        position: { x, y },
        data: {
          service,
          isSelected: selectedNode === service.id,
          isHighlighted: highlightedNodes.has(service.id),
          onSelect: (serviceId: string) => handleNodeSelect(serviceId),
        },
      };
    });
  }, [services, selectedNode, highlightedNodes]);

  // Convert relations to React Flow edges
  const initialEdges = useMemo(() => {
    if (!relations.length) return [];

    return relations.map((relation: Relation) => ({
      id: relation.id,
      source: relation.fromServiceId,
      target: relation.toServiceId,
      type: 'relationEdge',
      data: {
        relation,
        config: relationTypeConfig[relation.type],
      },
      style: {
        stroke: relationTypeConfig[relation.type].color,
        strokeWidth: 2,
      },
      markerEnd: 'arrowclosed',
    }));
  }, [relations]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when data changes
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Update edges when data changes
  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Handle node selection and highlighting
  const handleNodeSelect = useCallback((serviceId: string) => {
    setSelectedNode(serviceId);
    
    // Find connected services
    const connectedServices = new Set<string>();
    relations.forEach((relation: Relation) => {
      if (relation.fromServiceId === serviceId) {
        connectedServices.add(relation.toServiceId);
      }
      if (relation.toServiceId === serviceId) {
        connectedServices.add(relation.fromServiceId);
      }
    });
    
    setHighlightedNodes(connectedServices);
  }, [relations]);

  // Handle connection creation (for future use)
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle edge click to show relation details
  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: any) => {
    const relation = relations.find(r => r.id === edge.id);
    if (relation) {
      setSelectedRelation(relation);
      setShowRelationDetails(true);
    }
  }, [relations]);

  // Get selected service object
  const selectedService = useMemo(() => {
    return selectedNode ? services.find(s => s.id === selectedNode) : null;
  }, [selectedNode, services]);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedNode(null);
    setHighlightedNodes(new Set());
  }, []);

  // Handle create relation
  const handleCreateRelation = useCallback(() => {
    setShowRelationshipManager(true);
  }, []);

  // Handle close modals
  const handleCloseRelationshipManager = useCallback(() => {
    setShowRelationshipManager(false);
  }, []);

  const handleCloseRelationDetails = useCallback(() => {
    setShowRelationDetails(false);
    setSelectedRelation(null);
  }, []);

  if (servicesLoading || relationsLoading) {
    return (
      <div className="space-y-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">関連マップ</h1>
            <p className="mt-2 text-sm text-gray-700">
              AWSサービス間の関係性を視覚的に表示します。
            </p>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">読み込み中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">関連マップ</h1>
          <p className="mt-2 text-sm text-gray-700">
            AWSサービス間の関係性を視覚的に表示します。ノードをクリックして関連サービスをハイライト、エッジをクリックして関係詳細を表示できます。
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={handleCreateRelation}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            関係を作成
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div style={{ height: '600px' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                if (node.data?.isSelected) return '#3b82f6';
                if (node.data?.isHighlighted) return '#10b981';
                return '#6b7280';
              }}
              nodeStrokeWidth={3}
              zoomable
              pannable
            />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            
            {/* Custom controls */}
            <RelationControls
              selectedNode={selectedNode}
              onClearSelection={handleClearSelection}
              onCreateRelation={handleCreateRelation}
              relationTypeConfig={relationTypeConfig}
            />
          </ReactFlow>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">関係タイプ</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(relationTypeConfig).map(([type, config]) => (
            <div key={type} className="flex items-center">
              <div 
                className="w-4 h-1 mr-2"
                style={{ backgroundColor: config.color }}
              />
              <span className="text-sm text-gray-700">{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Relationship Management Modal */}
      <RelationshipManager
        isOpen={showRelationshipManager}
        onClose={handleCloseRelationshipManager}
        selectedService={selectedService}
      />

      {/* Relation Details Modal */}
      <RelationDetails
        relation={selectedRelation}
        isOpen={showRelationDetails}
        onClose={handleCloseRelationDetails}
      />
    </div>
  );
};

export default RelationMap;