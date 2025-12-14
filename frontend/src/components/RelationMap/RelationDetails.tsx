import React from 'react';
import { Relation, RelationType } from '../../types/api';
import { useDeleteRelation } from '../../hooks/useRelations';

interface RelationDetailsProps {
  relation: Relation | null;
  isOpen: boolean;
  onClose: () => void;
}

const relationTypeLabels = {
  [RelationType.INTEGRATES_WITH]: '統合する',
  [RelationType.DEPENDS_ON]: '依存する',
  [RelationType.ALTERNATIVE_TO]: '代替となる',
};

const relationTypeDescriptions = {
  [RelationType.INTEGRATES_WITH]: 'サービス同士が連携して動作します',
  [RelationType.DEPENDS_ON]: 'このサービスが他のサービスに依存しています',
  [RelationType.ALTERNATIVE_TO]: 'このサービスが他のサービスの代替手段となります',
};

const relationTypeColors = {
  [RelationType.INTEGRATES_WITH]: 'bg-green-100 text-green-800 border-green-200',
  [RelationType.DEPENDS_ON]: 'bg-amber-100 text-amber-800 border-amber-200',
  [RelationType.ALTERNATIVE_TO]: 'bg-violet-100 text-violet-800 border-violet-200',
};

const RelationDetails: React.FC<RelationDetailsProps> = ({
  relation,
  isOpen,
  onClose,
}) => {
  const deleteRelationMutation = useDeleteRelation();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const handleDelete = async () => {
    if (!relation) return;

    try {
      await deleteRelationMutation.mutateAsync(relation.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Failed to delete relation:', error);
    }
  };

  if (!isOpen || !relation) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              関係の詳細
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

          <div className="space-y-4">
            {/* Services */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">サービス関係</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {relation.fromService?.name || 'Unknown Service'}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {relation.fromService?.category?.name}
                    </div>
                  </div>
                  
                  <div className="mx-4">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                  
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {relation.toService?.name || 'Unknown Service'}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {relation.toService?.category?.name}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Relation Type */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">関係タイプ</h4>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${relationTypeColors[relation.type]}`}>
                {relationTypeLabels[relation.type]}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {relationTypeDescriptions[relation.type]}
              </p>
            </div>

            {/* Description */}
            {relation.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">説明</h4>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  {relation.description}
                </p>
              </div>
            )}

            {/* Metadata */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">作成情報</h4>
              <div className="text-sm text-gray-600">
                <div>作成日: {new Date(relation.createdAt).toLocaleString('ja-JP')}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
              >
                削除
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-60">
          <div className="relative top-1/2 transform -translate-y-1/2 mx-auto p-5 border w-80 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">関係を削除</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  この関係を削除してもよろしいですか？この操作は取り消せません。
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteRelationMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-md transition-colors"
                >
                  {deleteRelationMutation.isLoading ? '削除中...' : '削除'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelationDetails;