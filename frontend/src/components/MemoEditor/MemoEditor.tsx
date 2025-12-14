import React, { useState, useEffect } from 'react';
import { Memo, MemoType, CreateMemoRequest, UpdateMemoRequest } from '../../types/api';
import { useCreateMemo, useUpdateMemo, useDeleteMemo } from '../../hooks/useMemos';
import { filesApi } from '../../services/api';
import { ImageUpload } from '../ImageUpload';
import { useToast } from '../Toast';

interface MemoEditorProps {
  serviceId: string;
  memo?: Memo;
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

export const MemoEditor: React.FC<MemoEditorProps> = ({
  serviceId,
  memo,
  onSave,
  onCancel,
  onDelete,
}) => {
  const [type, setType] = useState<MemoType>(memo?.type || MemoType.TEXT);
  const [title, setTitle] = useState(memo?.title || '');
  const [content, setContent] = useState(memo?.content || '');
  const [isEditing, setIsEditing] = useState(!memo);
  const [uploadingImage] = useState(false);

  const createMemo = useCreateMemo();
  const updateMemo = useUpdateMemo();
  const deleteMemo = useDeleteMemo();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (memo) {
      setType(memo.type);
      setTitle(memo.title || '');
      setContent(memo.content);
    }
  }, [memo]);

  const handleSave = async () => {
    if (!content.trim()) return;

    try {
      if (memo) {
        const updateData: UpdateMemoRequest = {
          type,
          content: content.trim(),
          title: title.trim() || undefined,
        };
        await updateMemo.mutateAsync({ id: memo.id, data: updateData });
        showSuccess('メモを更新しました');
      } else {
        const createData: CreateMemoRequest = {
          type,
          content: content.trim(),
          title: title.trim() || undefined,
        };
        await createMemo.mutateAsync({ serviceId, data: createData });
        showSuccess('メモを作成しました');
      }
      setIsEditing(false);
      onSave?.();
    } catch (error) {
      console.error('Failed to save memo:', error);
      showError('メモの保存に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!memo) return;
    
    if (window.confirm('このメモを削除しますか？')) {
      try {
        await deleteMemo.mutateAsync(memo.id);
        showSuccess('メモを削除しました');
        onDelete?.();
      } catch (error) {
        console.error('Failed to delete memo:', error);
        showError('メモの削除に失敗しました');
      }
    }
  };

  const handleImageUpload = (filename: string, _url: string) => {
    setContent(filename);
    setType(MemoType.IMAGE);
  };

  const handleImageUploadError = (error: string) => {
    console.error('Image upload error:', error);
    showError(`画像のアップロードに失敗しました: ${error}`);
  };

  const handleCancel = () => {
    if (memo) {
      setType(memo.type);
      setTitle(memo.title || '');
      setContent(memo.content);
      setIsEditing(false);
    }
    onCancel?.();
  };

  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メモタイプ
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as MemoType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={MemoType.TEXT}>テキスト</option>
              <option value={MemoType.LINK}>リンク</option>
              <option value={MemoType.IMAGE}>画像</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              タイトル（オプション）
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="メモのタイトルを入力..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              内容
            </label>
            {type === MemoType.IMAGE ? (
              <ImageUpload
                onUpload={handleImageUpload}
                onError={handleImageUploadError}
                disabled={uploadingImage}
                className="w-full"
              />
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  type === MemoType.LINK
                    ? 'URLを入力...'
                    : 'メモの内容を入力...'
                }
                rows={type === MemoType.TEXT ? 4 : 2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={!content.trim() || createMemo.isLoading || updateMemo.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMemo.isLoading || updateMemo.isLoading ? '保存中...' : '保存'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              キャンセル
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {title && (
          <h4 className="font-medium text-gray-900">{title}</h4>
        )}
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span className="px-2 py-1 bg-gray-100 rounded">
            {type === MemoType.TEXT && 'テキスト'}
            {type === MemoType.LINK && 'リンク'}
            {type === MemoType.IMAGE && '画像'}
          </span>
          <span>{new Date(memo!.createdAt).toLocaleDateString('ja-JP')}</span>
        </div>
        <div className="mt-2">
          {type === MemoType.TEXT && (
            <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
          )}
          {type === MemoType.LINK && (
            <a
              href={content}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline break-all"
            >
              {content}
            </a>
          )}
          {type === MemoType.IMAGE && (
            <img
              src={filesApi.getUrl(content)}
              alt={title || 'Memo image'}
              className="max-w-full max-h-64 object-contain border rounded"
            />
          )}
        </div>
        <div className="flex space-x-2 mt-2">
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            編集
          </button>
          <button
            onClick={handleDelete}
            className="text-sm text-red-600 hover:text-red-800"
            disabled={deleteMemo.isLoading}
          >
            {deleteMemo.isLoading ? '削除中...' : '削除'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      {renderContent()}
    </div>
  );
};

export default MemoEditor;