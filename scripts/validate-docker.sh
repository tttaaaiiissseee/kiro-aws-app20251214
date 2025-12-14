#!/bin/bash

# AWS学習アプリ Docker設定検証スクリプト

echo "🔍 Docker設定を検証中..."

# Docker Compose設定の検証
echo "📋 Docker Compose設定を検証..."
if docker-compose config --quiet; then
    echo "✅ Docker Compose設定は有効です"
else
    echo "❌ Docker Compose設定にエラーがあります"
    exit 1
fi

# Dockerfileの存在確認
echo "📄 Dockerfileの存在を確認..."
if [ -f "frontend/Dockerfile" ] && [ -f "backend/Dockerfile" ]; then
    echo "✅ Dockerfileが存在します"
else
    echo "❌ Dockerfileが見つかりません"
    exit 1
fi

# 環境設定ファイルの確認
echo "⚙️ 環境設定ファイルを確認..."
if [ -f ".env.example" ]; then
    echo "✅ .env.exampleが存在します"
else
    echo "❌ .env.exampleが見つかりません"
    exit 1
fi

# nginx設定の確認
echo "🌐 nginx設定を確認..."
if [ -f "nginx/nginx.conf" ]; then
    echo "✅ nginx設定が存在します"
else
    echo "❌ nginx設定が見つかりません"
    exit 1
fi

# Makefileの確認
echo "🔨 Makefileを確認..."
if [ -f "Makefile" ]; then
    echo "✅ Makefileが存在します"
else
    echo "❌ Makefileが見つかりません"
    exit 1
fi

echo ""
echo "🎉 すべての検証が完了しました！"
echo ""
echo "📚 使用方法:"
echo "  開発環境: make dev"
echo "  本番環境: make prod"
echo "  ヘルプ: make help"
echo ""
echo "📖 詳細なドキュメント: DOCKER.md"