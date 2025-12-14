import React, { useState } from 'react';
import { useMemosByService } from '../../hooks/useMemos';
import MemoEditor from './MemoEditor';

interface MemoListProps {
  serviceId: string;
}

export const MemoList: React.FC<MemoListProps> = ({ serviceId }) => {
  const [showNewMemoForm, setShowNewMemoForm] = useState(false);
  const { data: memos, isLoading, error } = useMemosByService(serviceId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-gray-500">メモを読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-4">
        メモの読み込みに失敗しました
      </div>
    );
  }

  const sortedMemos = memos?.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          メモ ({sortedMemos.length})
        </h3>
        <button
          onClick={() => setShowNewMemoForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          + メモを追加
        </button>
      </div>

      {showNewMemoForm && (
        <div className="border-2 border-blue-200 rounded-lg">
          <MemoEditor
            serviceId={serviceId}
            onSave={() => setShowNewMemoForm(false)}
            onCancel={() => setShowNewMemoForm(false)}
          />
        </div>
      )}

      {sortedMemos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>まだメモがありません</p>
          <p className="text-sm">「メモを追加」ボタンから最初のメモを作成しましょう</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedMemos.map((memo) => (
            <MemoEditor
              key={memo.id}
              serviceId={serviceId}
              memo={memo}
              onDelete={() => {
                // The memo will be automatically removed from the list
                // due to React Query cache invalidation
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MemoList;