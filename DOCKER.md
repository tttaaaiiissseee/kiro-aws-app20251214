# AWS学習アプリ Docker セットアップガイド

## 概要

このドキュメントでは、AWS学習アプリをDockerを使用して実行する方法について説明します。

## 前提条件

- Docker Engine 20.10以上
- Docker Compose 2.0以上
- Make（オプション、便利なコマンド用）

## クイックスタート

### 1. 環境設定

```bash
# リポジトリをクローン
git clone <repository-url>
cd aws-study-app

# 環境変数ファイルを作成
cp .env.example .env

# 必要に応じて.envファイルを編集
vim .env
```

### 2. 開発環境での起動

```bash
# Makeを使用する場合
make dev

# または直接Docker Composeを使用
docker-compose up -d
```

### 3. アクセス

- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:8000
- ヘルスチェック: http://localhost:8000/health

## 詳細な使用方法

### 開発環境

```bash
# サービスをビルド
make build

# サービスを起動
make up

# ログを確認
make logs

# サービスを停止
make down
```

### 本番環境

```bash
# 本番環境用イメージをビルド
make prod-build

# 本番環境で起動（nginxリバースプロキシ付き）
make prod

# 本番環境を停止
make prod-down
```

### 管理コマンド

```bash
# ヘルスチェック
make health

# サービス再起動
make restart

# 未使用リソースの削除
make clean

# データベースリセット
make db-reset

# シードデータ投入
make db-seed
```

## アーキテクチャ

### サービス構成

1. **frontend**: React/TypeScript フロントエンド
2. **backend**: Node.js/Express バックエンドAPI
3. **database**: SQLite データベース初期化
4. **nginx**: リバースプロキシ（本番環境のみ）

### ネットワーク

- 内部ネットワーク: `aws-study-network` (172.20.0.0/16)
- サービス間通信は内部ネットワーク経由

### ボリューム

- `sqlite_data`: データベースファイル永続化
- `uploads_data`: アップロードファイル永続化
- `frontend_cache`: フロントエンドビルドキャッシュ
- `backend_cache`: バックエンドキャッシュ
- `nginx_cache`: nginxキャッシュ（本番環境）
- `nginx_logs`: nginxログ（本番環境）

## 環境変数

### 主要な環境変数

| 変数名 | デフォルト値 | 説明 |
|--------|-------------|------|
| `NODE_ENV` | development | 実行環境 |
| `BUILD_TARGET` | dev | Dockerビルドターゲット |
| `FRONTEND_PORT` | 3000 | フロントエンドポート |
| `BACKEND_PORT` | 8000 | バックエンドポート |
| `REACT_APP_API_URL` | http://localhost:8000 | API URL |
| `JWT_SECRET` | your-secret-key... | JWT秘密鍵 |
| `UPLOAD_MAX_SIZE` | 5242880 | アップロード最大サイズ |

### 環境別設定ファイル

- `.env.example`: テンプレート
- `.env`: 開発環境（gitignore対象）
- `.env.production`: 本番環境設定

## ヘルスチェック

各サービスにはヘルスチェックが設定されています：

- **Frontend**: `wget http://localhost:3000`
- **Backend**: `wget http://localhost:8000/api/health`
- **Nginx**: `wget http://localhost/health`

## トラブルシューティング

### よくある問題

1. **ポートが使用中**
   ```bash
   # ポート使用状況確認
   lsof -i :3000
   lsof -i :8000
   
   # .envファイルでポートを変更
   FRONTEND_PORT=3001
   BACKEND_PORT=8001
   ```

2. **データベース接続エラー**
   ```bash
   # データベースボリュームをリセット
   docker-compose down -v
   make dev
   ```

3. **ビルドエラー**
   ```bash
   # キャッシュをクリア
   docker-compose build --no-cache
   ```

### ログ確認

```bash
# 全サービスのログ
make logs

# 特定サービスのログ
make logs-backend
make logs-frontend
make logs-nginx
```

### コンテナ内でのデバッグ

```bash
# バックエンドコンテナに接続
make shell-backend

# フロントエンドコンテナに接続
make shell-frontend
```

## セキュリティ考慮事項

### 本番環境での注意点

1. **JWT_SECRET**: 必ず変更してください
2. **ポート公開**: 必要最小限のポートのみ公開
3. **ボリューム権限**: 適切なファイル権限を設定
4. **ログ管理**: 機密情報がログに出力されないよう注意

### セキュリティヘッダー

nginxで以下のセキュリティヘッダーを設定：

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

## パフォーマンス最適化

### 本番環境での最適化

1. **Multi-stage build**: 本番イメージサイズを最小化
2. **Nginx gzip**: 静的ファイルの圧縮
3. **キャッシュ戦略**: 適切なキャッシュヘッダー設定
4. **ヘルスチェック**: サービス可用性監視

### モニタリング

```bash
# リソース使用状況
docker stats

# サービス状態
docker-compose ps

# ヘルスチェック状況
make health
```

## 開発ワークフロー

### 推奨開発フロー

1. 環境設定: `make setup`
2. 開発開始: `make dev`
3. ログ監視: `make logs`
4. テスト実行: `make test`
5. 停止: `make down`

### ホットリロード

開発環境では以下が自動的に有効になります：

- フロントエンド: Vite HMR
- バックエンド: nodemon による自動再起動
- ボリュームマウント: ソースコード変更の即座反映