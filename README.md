# AWS学習アプリ

AWSサービスの知識を体系的に整理・管理し、効率的な学習を支援するWebアプリケーションです。

## 機能

- AWSサービスの情報管理（作成・編集・削除）
- メモ機能（テキスト・リンク・画像）
- カテゴリ別整理
- サービス間関係性の可視化
- 比較機能
- 検索・フィルタ機能

## 技術スタック

### フロントエンド
- React 18 + TypeScript
- Tailwind CSS
- React Router
- React Query
- React Flow

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

- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:8000
- ヘルスチェック: http://localhost:8000/health

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

## API仕様

詳細なAPI仕様については、開発が進むにつれて更新されます。

## ライセンス

MIT