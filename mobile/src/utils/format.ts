// 日付フォーマット関数
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'たった今';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分前`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}時間前`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}日前`;
  }
  
  return formatDate(dateString);
};

// テキストトランケート
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

// メモタイプの日本語表示
export const getMemoTypeLabel = (type: string): string => {
  switch (type) {
    case 'TEXT':
      return 'テキスト';
    case 'LINK':
      return 'リンク';
    case 'IMAGE':
      return '画像';
    default:
      return type;
  }
};

// 関係タイプの日本語表示
export const getRelationTypeLabel = (type: string): string => {
  switch (type) {
    case 'INTEGRATES_WITH':
      return '統合する';
    case 'DEPENDS_ON':
      return '依存する';
    case 'ALTERNATIVE_TO':
      return '代替となる';
    default:
      return type;
  }
};