#!/bin/bash

echo "🚀 Starting Afterwon AI Generation Server..."

# 의존성 설치
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# 개발 모드로 서버 실행
echo "🔥 Starting server in development mode..."
npm run dev 