# AWS学習アプリ

AWSサービスの知識を体系的に整理・管理し、効率的な学習を支援するWebアプリケーションです。

## 機能

- **AWSサービス管理**: サービス情報の作成・編集・削除
- **メモ機能**: テキスト・リンク・画像メモの追加と管理
- **カテゴリ管理**: 
  - カテゴリの作成・編集・削除
  - ドラッグ&ドロップによる直感的な並び順変更
  - カスタムカラー設定
- **関係性可視化**: サービス間の関係をビジュアルマップで表示
- **比較機能**: 複数サービスの並列比較
- **検索・フィルタ**: 全文検索とカテゴリフィルタ

## 技術スタック

### Webフロントエンド
- React 18 + TypeScript
- Tailwind CSS
- React Router
- React Query
- React Flow
- @dnd-kit (ドラッグ&ドロップ機能)

### モバイルアプリ (React Native)
- React Native 0.83.0 + TypeScript
- React Navigation
- React Query
- React Native Vector Icons
- React Native Gesture Handler

### バックエンド
- Node.js + Express + TypeScript
- Prisma ORM
- SQLite

### インフラ
- Docker + Docker Compose

## セットアップ

### 前提条件
- Docker
- Docker Compose

### 開発環境の起動

1. リポジトリをクローン
```bash
git clone <repository-url>
cd aws-study-app
```

2. 環境変数ファイルをコピー
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Docker Composeで起動
```bash
docker-compose up -d
```

4. データベースの初期化
```bash
docker-compose exec backend npm run db:push
docker-compose exec backend npm run db:seed
```

### アクセス

- Webフロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:8000
- ヘルスチェック: http://localhost:8000/health

### モバイルアプリ開発

React Nativeモバイルアプリも利用可能です：

```bash
cd mobile
npm install

# iOS (macOSのみ)
npm run ios

# Android
npm run android
```

詳細は [mobile/REACT_NATIVE_IMPLEMENTATION.md](mobile/REACT_NATIVE_IMPLEMENTATION.md) を参照してください。

## 使用方法

### カテゴリ管理
1. サイドバーから「カテゴリ管理」を選択
2. 新しいカテゴリを作成するか、既存のカテゴリを編集
3. ドラッグ&ドロップでカテゴリの並び順を変更
4. カテゴリにカスタムカラーを設定して視覚的に区別

### サービス管理
1. カテゴリを選択してサービス一覧を表示
2. 新しいサービスを作成し、詳細情報を入力
3. メモ機能でテキスト、リンク、画像を追加
4. 関連マップでサービス間の関係を可視化

## 開発

### バックエンド開発

```bash
cd backend
npm install
npm run dev
```

### フロントエンド開発

```bash
cd frontend
npm install
npm run dev
```

### テスト実行

```bash
# バックエンド
cd backend
npm test

# フロントエンド
cd frontend
npm test
```

### コード品質

```bash
# Lint
npm run lint

# Format
npm run format
```

## プロジェクト構造

```
aws-study-app/
├── backend/                 # バックエンドAPI
│   ├── src/                # ソースコード
│   ├── prisma/             # データベーススキーマ
│   └── Dockerfile          # バックエンド用Docker設定
├── frontend/               # フロントエンドアプリ
│   ├── src/               # ソースコード
│   └── Dockerfile         # フロントエンド用Docker設定
└── docker-compose.yml     # Docker Compose設定
```

## データベーススキーマ

### 主要モデル

#### Category（カテゴリ）
- `id`: 一意識別子
- `name`: カテゴリ名（一意）
- `description`: 説明（オプション）
- `color`: UI表示用カラーコード（オプション）
- `sortOrder`: 並び順（デフォルト: 0）
- `services`: 関連するサービス一覧

#### Service（サービス）
- `id`: 一意識別子
- `name`: サービス名（一意）
- `description`: 説明
- `categoryId`: 所属カテゴリID
- `memos`: 関連するメモ一覧
- `attributeValues`: 比較用属性値

#### Memo（メモ）
- `id`: 一意識別子
- `type`: メモタイプ（TEXT, LINK, IMAGE）
- `content`: 内容またはファイルパス
- `title`: タイトル（オプション）
- `serviceId`: 関連するサービスID

#### Relation（関係性）
- `id`: 一意識別子
- `type`: 関係タイプ（INTEGRATES_WITH, DEPENDS_ON, ALTERNATIVE_TO）
- `fromServiceId`: 関係元サービスID
- `toServiceId`: 関係先サービスID
- `description`: 関係の詳細説明

### 最新の変更

- **カテゴリ並び順機能**: `Category`モデルに`sortOrder`フィールドを追加し、カテゴリの表示順序をカスタマイズ可能になりました
- **ドラッグ&ドロップ機能**: カテゴリ管理画面でドラッグ&ドロップによる直感的な並び順変更が可能になりました
- **カテゴリ並び順API**: `PUT /api/categories/reorder` エンドポイントを追加し、複数カテゴリの並び順を一括更新できるようになりました

## API仕様

### カテゴリ管理API

#### カテゴリ並び順更新
```
PUT /api/categories/reorder
```

**リクエスト:**
```json
{
  "categoryOrders": [
    { "id": "category-id-1" },
    { "id": "category-id-2" },
    { "id": "category-id-3" }
  ]
}
```

**レスポンス:**
```json
{
  "data": [
    {
      "id": "category-id-1",
      "name": "カテゴリ名",
      "description": "説明",
      "color": "#ff0000",
      "sortOrder": 0,
      "_count": { "services": 3 },
      "createdAt": "2025-12-13T03:40:06.410Z",
      "updatedAt": "2025-12-13T03:40:06.410Z"
    }
  ],
  "message": "カテゴリの並び順が正常に更新されました。",
  "timestamp": "2025-12-13T03:40:06.410Z"
}
```

**エラーレスポンス:**
- `400 INVALID_REQUEST_FORMAT`: リクエスト形式が不正
- `400 INVALID_CATEGORY_IDS`: 存在しないカテゴリIDが含まれている

詳細なAPI仕様については、開発が進むにつれて更新されます。

## ライセンス

MIT