import { Request, Response, NextFunction } from 'express';
import { isValidMemoType, isValidRelationType } from '../types/enums';

// Validation error class
export class ValidationError extends Error {
  public details: any;
  
  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

// Validate required fields
export const validateRequired = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing: string[] = [];
    
    for (const field of fields) {
      if (!req.body[field] || (typeof req.body[field] === 'string' && req.body[field].trim() === '')) {
        missing.push(field);
      }
    }
    
    if (missing.length > 0) {
      throw new ValidationError('必須フィールドが不足しています。', { missingFields: missing });
    }
    
    next();
  };
};

// Validate memo type
export const validateMemoType = (req: Request, res: Response, next: NextFunction) => {
  const { type } = req.body;
  
  if (type && !isValidMemoType(type)) {
    throw new ValidationError('無効なメモタイプです。', { 
      providedType: type,
      validTypes: ['TEXT', 'LINK', 'IMAGE']
    });
  }
  
  next();
};

// Validate relation type
export const validateRelationType = (req: Request, res: Response, next: NextFunction) => {
  const { type } = req.body;
  
  if (type && !isValidRelationType(type)) {
    throw new ValidationError('無効な関係タイプです。', {
      providedType: type,
      validTypes: ['INTEGRATES_WITH', 'DEPENDS_ON', 'ALTERNATIVE_TO']
    });
  }
  
  next();
};

// Validate URL format for link memos
export const validateUrl = (req: Request, res: Response, next: NextFunction) => {
  const { type, content } = req.body;
  
  if (type === 'LINK' && content) {
    try {
      new URL(content);
    } catch (error) {
      throw new ValidationError('無効なURL形式です。', { providedUrl: content });
    }
  }
  
  next();
};

// Validate service name uniqueness (to be used with database check)
export const validateServiceName = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body;
  
  if (name && typeof name === 'string') {
    // Trim whitespace and check length
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      throw new ValidationError('サービス名は空にできません。');
    }
    if (trimmedName.length > 100) {
      throw new ValidationError('サービス名は100文字以下である必要があります。', { maxLength: 100 });
    }
    // Update the request body with trimmed name
    req.body.name = trimmedName;
  }
  
  next();
};

// Validate category name uniqueness (to be used with database check)
export const validateCategoryName = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body;
  
  if (name && typeof name === 'string') {
    // Trim whitespace and check length
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      throw new ValidationError('カテゴリ名は空にできません。');
    }
    if (trimmedName.length > 50) {
      throw new ValidationError('カテゴリ名は50文字以下である必要があります。', { maxLength: 50 });
    }
    // Update the request body with trimmed name
    req.body.name = trimmedName;
  }
  
  next();
};

// Async wrapper for validation middleware
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};