#!/bin/bash

# PetMeet 管理面板启动脚本

echo "🚀 启动 PetMeet 管理面板..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

# 进入管理面板目录
cd "$(dirname "$0")"

# 检查package.json是否存在
if [ ! -f "package.json" ]; then
    echo "❌ package.json 文件不存在"
    exit 1
fi

# 安装依赖（如果node_modules不存在）
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
fi

# 检查.env文件
if [ ! -f ".env" ]; then
    echo "⚠️  .env 文件不存在，创建默认配置..."
    cat > .env << EOF
# 管理面板端口
ADMIN_PORT=3001

# JWT密钥（请修改为您自己的密钥）
JWT_SECRET=petmeet-admin-secret-key-$(date +%s)

# 腾讯云配置（请填入您的配置）
CLOUDBASE_ENV_ID=your-env-id
CLOUDBASE_SECRET_ID=your-secret-id
CLOUDBASE_SECRET_KEY=your-secret-key
EOF
    echo "✅ 已创建默认 .env 文件，请根据需要修改配置"
fi

# 启动服务
echo "🌟 启动管理面板服务..."
echo "📊 管理面板地址: http://localhost:3001"
echo "🔧 按 Ctrl+C 停止服务"
echo ""

npm start 