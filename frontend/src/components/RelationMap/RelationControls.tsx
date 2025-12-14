import React from 'react';
import { Panel } from 'reactflow';
import { RelationType } from '../../types/api';

interface RelationControlsProps {
  selectedNode: string | null;
  onClearSelection: () => void;
  onCreateRelation: () => void;
  relationTypeConfig: Record<RelationType, { color: string; label: string }>;
}

const RelationControls: React.FC<RelationControlsProps> = ({
  selectedNode,
  onClearSelection,
  onCreateRelation,
  relationTypeConfig,
}) => {
  return (
    <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-4 max-w-xs">
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-gray-900">コントロール</h3>
        
        {selectedNode ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-600">
              ノードが選択されています。関連サービスがハイライトされています。
            </p>
            <div className="space-y-2">
              <button
                onClick={onCreateRelation}
                className="w-full px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
              >
                関係を作成
              </button>
              <button
                onClick={onClearSelection}
                className="w-full px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                選択をクリア
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-600">
            ノードをクリックして関連サービスを表示
          </p>
        )}

        <div className="border-t pt-3">
          <h4 className="font-medium text-xs text-gray-900 mb-2">操作方法</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• ノードをドラッグして移動</li>
            <li>• マウスホイールでズーム</li>
            <li>• 右下のミニマップで全体表示</li>
            <li>• ノードクリックで関連表示</li>
          </ul>
        </div>

        <div className="border-t pt-3">
          <h4 className="font-medium text-xs text-gray-900 mb-2">関係タイプ</h4>
          <div className="space-y-1">
            {Object.entries(relationTypeConfig).map(([type, config]) => (
              <div key={type} className="flex items-center text-xs">
                <div 
                  className="w-3 h-0.5 mr-2"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-gray-700">{config.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
};

export default RelationControls;