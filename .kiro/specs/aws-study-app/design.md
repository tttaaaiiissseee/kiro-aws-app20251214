　# 設計文書

## 概要

AWS学習アプリは、AWSサービスの知識を体系的に管理するWebアプリケーションです。React/TypeScriptフロントエンド、Node.js/Expressバックエンド、SQLiteデータベースで構成され、Dockerコンテナで実行されます。ユーザーはAWSサービスの情報を登録し、メモを追加し、サービス間の関係を視覚化できます。

## アーキテクチャ

### システム構成

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   フロントエンド   │    │   バックエンド    │    │   データベース   │
│   React/TS      │◄──►│   Node.js/Express│◄──►│   SQLite        │
│   Port: 3000    │    │   Port: 8000     │    │   Volume Mount  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 技術スタック

**フロントエンド:**
- React 18 + TypeScript
- Tailwind CSS (レスポンシブデザイン)
- React Router (ルーティング)
- React Flow (関連マップ可視化)
- React Query (サーバー状態管理)
- Axios (HTTP通信)

**バックエンド:**
- Node.js + Express + TypeScript
- Prisma ORM (データベース操作)
- Multer (ファイルアップロード)
- CORS (クロスオリジン対応)
- Helmet (セキュリティ)

**データベース:**
- SQLite (軽量、Docker対応)
- Prisma Schema (型安全なデータアクセス)

**インフラ:**
- Docker + Docker Compose
- Multi-stage build (効率的なイメージ)
- Volume mounting (データ永続化)

## コンポーネントとインターフェース

### フロントエンドコンポーネント構成

```
App
├── Layout
│   ├── Header (検索バー、ナビゲーション)
│   ├── Sidebar (カテゴリフィルタ、メニュー)
│   └── Main (コンテンツエリア)
├── Pages
│   ├── ServiceList (サービス一覧)
│   ├── ServiceDetail (サービス詳細・メモ)
│   ├── RelationMap (関連マップ)
│   ├── Comparison (比較テーブル)
│   └── CategoryManagement (カテゴリ管理)
├── Components
│   ├── ServiceCard (サービス表示カード)
│   ├── MemoEditor (メモ作成・編集)
│   ├── ImageUpload (画像アップロード)
│   ├── SearchBar (検索機能)
│   └── ComparisonTable (比較表示)
└── Hooks
    ├── useServices (サービス操作)
    ├── useMemos (メモ操作)
    └── useCategories (カテゴリ操作)
```

### API エンドポイント設計

```typescript
// サービス管理
GET    /api/services              // サービス一覧取得
POST   /api/services              // サービス作成
GET    /api/services/:id          // サービス詳細取得
PUT    /api/services/:id          // サービス更新
DELETE /api/services/:id          // サービス削除

// メモ管理
GET    /api/services/:id/memos    // サービスのメモ一覧
POST   /api/services/:id/memos    // メモ作成
PUT    /api/memos/:id             // メモ更新
DELETE /api/memos/:id             // メモ削除

// カテゴリ管理
GET    /api/categories            // カテゴリ一覧
POST   /api/categories            // カテゴリ作成
PUT    /api/categories/:id        // カテゴリ更新
DELETE /api/categories/:id        // カテゴリ削除

// 関係性管理
GET    /api/relations             // 関係性一覧
POST   /api/relations             // 関係性作成
DELETE /api/relations/:id         // 関係性削除

// 検索・フィルタ
GET    /api/search?q=:query       // 全文検索
GET    /api/services?category=:id // カテゴリフィルタ

// ファイル管理
POST   /api/upload               // 画像アップロード
GET    /api/files/:filename      // ファイル取得
```

## データモデル

### データベーススキーマ

```prisma
model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?
  color       String?   // UI表示用カラーコード
  services    Service[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Service {
  id          String     @id @default(cuid())
  name        String     @unique
  description String?
  category    Category   @relation(fields: [categoryId], references: [id])
  categoryId  String
  memos       Memo[]
  fromRelations Relation[] @relation("FromService")
  toRelations   Relation[] @relation("ToService")
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Memo {
  id        String   @id @default(cuid())
  type      MemoType // TEXT, LINK, IMAGE
  content   String   // テキスト内容またはファイルパス
  title     String?  // オプションタイトル
  service   Service  @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  serviceId String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Relation {
  id           String      @id @default(cuid())
  type         RelationType // INTEGRATES_WITH, DEPENDS_ON, ALTERNATIVE_TO
  fromService  Service     @relation("FromService", fields: [fromServiceId], references: [id], onDelete: Cascade)
  fromServiceId String
  toService    Service     @relation("ToService", fields: [toServiceId], references: [id], onDelete: Cascade)
  toServiceId  String
  description  String?     // 関係の詳細説明
  createdAt    DateTime    @default(now())
  
  @@unique([fromServiceId, toServiceId, type])
}

enum MemoType {
  TEXT
  LINK
  IMAGE
}

enum RelationType {
  INTEGRATES_WITH
  DEPENDS_ON
  ALTERNATIVE_TO
}
```

### データ関係図

```
Category (1) ──── (N) Service (1) ──── (N) Memo
                     │
                     └── (N) Relation (N) ──── Service
```

## 正確性プロパティ

*プロパティとは、システムのすべての有効な実行において真であるべき特性や動作のことです。本質的に、システムが何をすべきかについての形式的な記述です。プロパティは、人間が読める仕様と機械で検証可能な正確性保証の橋渡しとなります。*

### プロパティ反映

事前作業分析を確認した結果、以下の冗長性を特定しました：

- **検索関連プロパティ**: 6.1（全文検索）と6.2（カテゴリフィルタ）は、より包括的な検索プロパティに統合可能
- **メモ操作プロパティ**: 2.1、2.2、2.3は、メモタイプに関係なく共通の作成動作をテストするため統合可能
- **カテゴリ関連プロパティ**: 3.1（関連付け）と3.5（フィルタ）は、カテゴリ-サービス関係の一貫性をテストするため統合可能
- **関係性プロパティ**: 4.1（作成）と4.4（削除）は、関係性のライフサイクル管理として統合可能

### コアプロパティ

**プロパティ 1: サービス作成の完全性**
*任意の*有効なサービスデータ（名前、カテゴリ、説明）について、サービス作成操作を実行すると、すべての情報が適切に保存され、一意のIDが割り当てられる
**検証対象: 要件 1.1**

**プロパティ 2: サービス更新の一貫性**
*任意の*既存サービスについて、更新操作を実行すると、変更された情報が保存され、更新タイムスタンプが現在時刻に更新される
**検証対象: 要件 1.2**

**プロパティ 3: カスケード削除の完全性**
*任意の*サービスとその関連データ（メモ、関係性）について、サービス削除操作を実行すると、すべての関連データも削除される
**検証対象: 要件 1.3**

**プロパティ 4: サービス名の一意性**
*任意の*サービス名について、同じ名前のサービスを重複作成しようとすると、操作が拒否される
**検証対象: 要件 1.5**

**プロパティ 5: 包括的検索機能**
*任意の*検索クエリとフィルタ条件について、検索結果はサービス名、説明、メモ内容を横断し、指定されたカテゴリ条件を満たすもののみを返す
**検証対象: 要件 1.4, 6.1, 6.2**

**プロパティ 6: メモ作成の型安全性**
*任意の*メモタイプ（テキスト、リンク、画像）について、メモ作成操作を実行すると、タイムスタンプ付きで適切な形式で保存される
**検証対象: 要件 2.1, 2.2, 2.3**

**プロパティ 7: メモ表示の時系列順序**
*任意の*サービスの複数メモについて、表示時は作成時刻の降順（新しい順）で並び、各メモにタイプ表示が含まれる
**検証対象: 要件 2.4**

**プロパティ 8: メモ削除のクリーンアップ**
*任意の*メモについて、削除操作を実行すると、メモデータと関連ファイル（画像の場合）がすべて削除される
**検証対象: 要件 2.5**

**プロパティ 9: カテゴリ-サービス関係の一貫性**
*任意の*カテゴリとサービスについて、カテゴリ割り当て後にカテゴリフィルタを適用すると、そのサービスが結果に含まれる
**検証対象: 要件 3.1, 3.5**

**プロパティ 10: カテゴリ名の一意性**
*任意の*カテゴリ名について、同じ名前のカテゴリを重複作成しようとすると、操作が拒否される
**検証対象: 要件 3.3**

**プロパティ 11: カテゴリ別グループ化**
*任意の*カテゴリセットについて、カテゴリ別表示では各カテゴリに属するサービスのみがそのカテゴリ下に表示される
**検証対象: 要件 3.2**

**プロパティ 12: 関係性のライフサイクル管理**
*任意の*2つのサービス間について、関係作成後は関連マップに双方向接続が表示され、関係削除後は接続が除去される
**検証対象: 要件 4.1, 4.4**

**プロパティ 13: 関連サービス取得の正確性**
*任意の*サービスについて、そのサービスに接続されたサービス一覧を取得すると、実際に関係性が定義されたサービスのみが返される
**検証対象: 要件 4.3**

**プロパティ 14: 比較機能の制限遵守**
*任意の*サービス選択について、5つまでのサービスは比較テーブル形式で表示され、6つ以上の選択は制限される
**検証対象: 要件 5.1, 5.5**

**プロパティ 15: 比較データの完全性**
*任意の*比較対象サービスについて、比較テーブルには料金モデル、ユースケース、制限を含む主要属性が表示される
**検証対象: 要件 5.2**

**プロパティ 16: カスタム比較属性の反映**
*任意の*カスタム属性定義について、比較テーブルに追加後は該当属性が比較項目に含まれる
**検証対象: 要件 5.3**

**プロパティ 17: エクスポート機能の正確性**
*任意の*比較データについて、エクスポート操作を実行すると、指定形式（PDF/CSV）で比較内容を含むファイルが生成される
**検証対象: 要件 5.4**

**プロパティ 18: 検索結果ソートの一貫性**
*任意の*検索結果について、ソート条件（関連度、アルファベット順、更新日）を適用すると、指定された順序で結果が並び替えられる
**検証対象: 要件 6.3**

**プロパティ 19: 検索語ハイライトの正確性**
*任意の*検索クエリについて、検索結果内で検索語に一致する部分が適切にマークされる
**検証対象: 要件 6.5**

**プロパティ 20: レスポンシブレイアウトの機能保持**
*任意の*画面サイズ変更について、レイアウト調整後もすべての機能が利用可能である
**検証対象: 要件 8.4**

## エラーハンドリング

### バリデーションエラー
- **必須フィールド検証**: サービス名、カテゴリIDの必須チェック
- **データ型検証**: URL形式、画像ファイル形式の検証
- **一意性制約**: サービス名、カテゴリ名の重複チェック
- **関係性制約**: 自己参照関係の防止

### ファイル操作エラー
- **アップロード制限**: ファイルサイズ、形式制限
- **ストレージエラー**: ディスク容量不足、権限エラー
- **画像処理エラー**: サムネイル生成失敗時の代替処理

### データベースエラー
- **接続エラー**: データベース接続失敗時の再試行
- **制約違反**: 外部キー制約、一意性制約違反の適切な処理
- **トランザクション**: 複数操作の原子性保証

### API エラーレスポンス
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}
```

## テスト戦略

### 二重テストアプローチ

**単体テスト**:
- 特定の例やエッジケース、エラー条件の検証
- コンポーネント間の統合ポイントのテスト
- 具体的なバグを捕捉するための例示的テスト

**プロパティベーステスト**:
- すべての入力に対して成り立つべき普遍的プロパティの検証
- 一般的な正確性の確認
- 包括的なカバレッジの提供

**プロパティベーステストライブラリ**: fast-check (JavaScript/TypeScript用)

**テスト設定要件**:
- 各プロパティベーステストは最低100回の反復実行
- 各プロパティベーステストには設計文書の正確性プロパティへの明示的な参照コメント
- フォーマット: `**Feature: aws-study-app, Property {number}: {property_text}**`
- 各正確性プロパティは単一のプロパティベーステストで実装

**単体テスト範囲**:
- API エンドポイントの基本動作
- データベース操作の正確性
- ファイルアップロード・処理機能
- エラーハンドリングの適切性

**プロパティベーステスト範囲**:
- データ整合性の維持
- 操作の冪等性
- 入力検証の網羅性
- 状態遷移の正確性