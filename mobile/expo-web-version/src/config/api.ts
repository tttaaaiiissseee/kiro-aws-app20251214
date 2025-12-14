import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API設定
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000/api'  // 開発環境
  : 'https://your-production-api.com/api';  // 本番環境

// Axiosインスタンス作成
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター（認証トークンなど）
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // 将来的に認証が必要な場合
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター（エラーハンドリング）
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // サーバーエラー
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // ネットワークエラー
      console.error('Network Error:', error.request);
    } else {
      // その他のエラー
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// エラーメッセージ取得ユーティリティ
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return '予期しないエラーが発生しました';
};