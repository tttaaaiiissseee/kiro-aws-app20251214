import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// API base URL - will be configurable via environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Extend Axios config to include metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

// Enhanced error interface
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

// Create axios instance with default configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout for better reliability
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens and request logging
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add timestamp for request tracking
    config.metadata = { startTime: Date.now() };
    
    // Add auth token here if needed in the future
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors and response logging
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response time in development
    if (import.meta.env.DEV && response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
    }
    
    return response;
  },
  (error: AxiosError) => {
    // Enhanced error handling
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: error.response?.status,
    };

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          apiError.message = (data as any)?.message || 'Bad request - please check your input';
          break;
        case 401:
          apiError.message = 'Unauthorized - please log in again';
          // Handle token refresh or redirect to login
          break;
        case 403:
          apiError.message = 'Forbidden - you do not have permission to perform this action';
          break;
        case 404:
          apiError.message = 'Resource not found';
          break;
        case 409:
          apiError.message = (data as any)?.message || 'Conflict - resource already exists';
          break;
        case 422:
          apiError.message = (data as any)?.message || 'Validation error - please check your input';
          apiError.details = (data as any)?.errors;
          break;
        case 429:
          apiError.message = 'Too many requests - please try again later';
          break;
        case 500:
          apiError.message = 'Internal server error - please try again later';
          break;
        case 502:
        case 503:
        case 504:
          apiError.message = 'Service temporarily unavailable - please try again later';
          break;
        default:
          apiError.message = (data as any)?.message || `Server error (${status})`;
      }
      
      apiError.code = (data as any)?.code;
      apiError.details = (data as any)?.details;
    } else if (error.request) {
      // Network error
      apiError.message = 'Network error - please check your connection';
    } else {
      // Request setup error
      apiError.message = error.message || 'Request configuration error';
    }

    // Log error in development
    if (import.meta.env.DEV) {
      console.error('❌ API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: apiError.message,
        details: apiError.details,
      });
    }

    // Create enhanced error object
    const enhancedError = new Error(apiError.message);
    (enhancedError as any).status = apiError.status;
    (enhancedError as any).code = apiError.code;
    (enhancedError as any).details = apiError.details;
    (enhancedError as any).isApiError = true;

    return Promise.reject(enhancedError);
  }
);

// Utility functions for API client
export const apiUtils = {
  // Check if error is an API error
  isApiError: (error: any): error is ApiError => {
    return error && error.isApiError === true;
  },
  
  // Get error message from any error type
  getErrorMessage: (error: any): string => {
    if (apiUtils.isApiError(error)) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },
  
  // Create cancel token for request cancellation
  createCancelToken: () => axios.CancelToken.source(),
  
  // Check if error is a cancel error
  isCancelError: (error: any): boolean => {
    return axios.isCancel(error);
  },
};

export default apiClient;