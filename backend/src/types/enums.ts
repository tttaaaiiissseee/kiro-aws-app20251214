// TypeScript enums for type safety (SQLite doesn't support native enums)

export enum MemoType {
  TEXT = 'TEXT',
  LINK = 'LINK',
  IMAGE = 'IMAGE'
}

export enum RelationType {
  INTEGRATES_WITH = 'INTEGRATES_WITH',
  DEPENDS_ON = 'DEPENDS_ON',
  ALTERNATIVE_TO = 'ALTERNATIVE_TO'
}

// Validation functions
export function isValidMemoType(type: string): type is MemoType {
  return Object.values(MemoType).includes(type as MemoType);
}

export function isValidRelationType(type: string): type is RelationType {
  return Object.values(RelationType).includes(type as RelationType);
}