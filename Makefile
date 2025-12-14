# AWS学習アプリ Docker管理用Makefile

.PHONY: help dev prod build up down logs clean restart health test

# デフォルトターゲット
help:
	@echo "AWS学習アプリ Docker管理コマンド"
	@echo ""
	@echo "開発環境:"
	@echo "  make dev      - 開発環境でアプリケーションを起動"
	@echo "  make build    - 開発環境用イメージをビルド"
	@echo "  make up       - 開発環境でサービスを起動"
	@echo "  make down     - サービスを停止"
	@echo ""
	@echo "本番環境:"
	@echo "  make prod     - 本番環境でアプリケーションを起動"
	@echo "  make prod-build - 本番環境用イメージをビルド"
	@echo ""
	@echo "管理:"
	@echo "  make logs     - ログを表示"
	@echo "  make health   - ヘルスチェック"
	@echo "  make restart  - サービスを再起動"
	@echo "  make clean    - 未使用のリソースを削除"
	@echo "  make test     - テストを実行"

# 開発環境
dev: build up

build:
	@echo "🔨 開発環境用イメージをビルド中..."
	docker-compose build

up:
	@echo "🚀 開発環境でサービスを起動中..."
	docker-compose up -d
	@echo "✅ サービスが起動しました"
	@echo "🌐 フロントエンド: http://localhost:3000"
	@echo "🔗 バックエンドAPI: http://localhost:8000"
	@echo "❤️  ヘルスチェック: http://localhost:8000/health"

down:
	@echo "🛑 サービスを停止中..."
	docker-compose down

# 本番環境
prod: prod-build prod-up

prod-build:
	@echo "🔨 本番環境用イメージをビルド中..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

prod-up:
	@echo "🚀 本番環境でサービスを起動中..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d
	@echo "✅ 本番環境が起動しました"
	@echo "🌐 アプリケーション: http://localhost"
	@echo "❤️  ヘルスチェック: http://localhost/health"

prod-down:
	@echo "🛑 本番環境を停止中..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production down

# ログ管理
logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-nginx:
	docker-compose logs -f nginx

# ヘルスチェック
health:
	@echo "🔍 ヘルスチェック実行中..."
	@curl -s http://localhost:8000/health | jq . || echo "バックエンドが応答しません"
	@curl -s http://localhost:3000 > /dev/null && echo "✅ フロントエンドが正常です" || echo "❌ フロントエンドが応答しません"

# 管理コマンド
restart:
	@echo "🔄 サービスを再起動中..."
	docker-compose restart

clean:
	@echo "🧹 未使用のリソースを削除中..."
	docker system prune -f
	docker volume prune -f

clean-all:
	@echo "🧹 すべてのリソースを削除中..."
	docker-compose down -v --remove-orphans
	docker system prune -af
	docker volume prune -f

# テスト
test:
	@echo "🧪 テストを実行中..."
	docker-compose exec backend npm test
	docker-compose exec frontend npm test

# データベース管理
db-reset:
	@echo "🗄️ データベースをリセット中..."
	docker-compose exec backend npx prisma db push --force-reset
	docker-compose exec backend npm run db:seed

db-seed:
	@echo "🌱 データベースにシードデータを投入中..."
	docker-compose exec backend npm run db:seed

# 開発用ユーティリティ
shell-backend:
	docker-compose exec backend sh

shell-frontend:
	docker-compose exec frontend sh

# 環境設定
setup:
	@echo "⚙️ 環境設定中..."
	@if [ ! -f .env ]; then cp .env.example .env; echo "📝 .envファイルを作成しました"; fi
	@echo "✅ セットアップ完了"