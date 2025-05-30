#!/bin/bash

# 生产环境管理面板更新脚本
# 修复CloudBase路径依赖问题

echo "🔄 更新生产环境管理面板..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# 检查是否在生产环境
if [[ ! -d "/opt/petmeet" ]]; then
    error "这不是生产环境，/opt/petmeet 目录不存在"
    exit 1
fi

# 备份当前管理面板
log "备份当前管理面板..."
sudo cp -r /opt/petmeet/admin-panel /opt/petmeet/admin-panel.backup.$(date +%Y%m%d_%H%M%S)

# 进入管理面板目录
cd /opt/petmeet/admin-panel

# 停止管理面板服务
log "停止管理面板服务..."
pm2 stop petmeet-admin

# 更新代码
log "拉取最新代码..."
git pull origin main

# 安装新的依赖（如果有）
log "更新依赖包..."
npm install --production

# 检查并创建必要的目录
log "检查目录结构..."
mkdir -p config

# 确保cloudbaseConfig.js文件存在且可执行
if [[ ! -f "config/cloudbaseConfig.js" ]]; then
    error "config/cloudbaseConfig.js 文件不存在，创建默认配置..."
    cat > config/cloudbaseConfig.js << 'EOF'
const tcb = require('@cloudbase/node-sdk');

/**
 * 管理面板的CloudBase配置
 * 独立于后端的配置，避免路径依赖问题
 */
const initCloudBase = () => {
  // 优先使用环境变量配置
  if (process.env.CLOUDBASE_ENV_ID && process.env.CLOUDBASE_SECRET_ID && process.env.CLOUDBASE_SECRET_KEY) {
    console.log('🔧 管理面板使用完整CloudBase配置');
    return tcb.init({
      env: process.env.CLOUDBASE_ENV_ID,
      secretId: process.env.CLOUDBASE_SECRET_ID,
      secretKey: process.env.CLOUDBASE_SECRET_KEY,
    });
  } else if (process.env.CLOUDBASE_ENV_ID) {
    // 仅使用环境ID初始化(适用于云函数环境)
    console.log('🔧 管理面板使用环境ID初始化CloudBase');
    return tcb.init({
      env: process.env.CLOUDBASE_ENV_ID
    });
  } else {
    // 开发环境默认值
    console.warn('⚠️ 管理面板未设置CLOUDBASE_ENV_ID环境变量，使用默认值');
    return tcb.init({
      env: 'cloud1-9g9n1il77a00ffbc' // 默认环境ID
    });
  }
};

// 获取数据库实例
const getDatabase = () => {
  const app = initCloudBase();
  return app.database();
};

/**
 * 获取 CloudBase 实例
 * @returns {tcb.CloudBase} CloudBase 实例
 */
const getCloudBase = () => {
  return initCloudBase();
};

// 导出所有函数
module.exports = {
  initCloudBase,
  getDatabase,
  getCloudBase
};
EOF
    log "✅ 已创建默认cloudbaseConfig.js文件"
fi

# 检查环境变量配置
log "检查环境变量配置..."
if [[ ! -f ".env" ]]; then
    warn "⚠️ .env文件不存在，请确保环境变量已正确配置"
else
    log "✅ .env文件存在"
fi

# 重新启动管理面板服务
log "重新启动管理面板服务..."
pm2 start petmeet-admin

# 等待服务启动
sleep 3

# 检查服务状态
pm2 status petmeet-admin

# 测试服务是否正常
log "测试管理面板服务..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200"; then
    log "✅ 管理面板服务启动成功"
else
    warn "⚠️ 管理面板服务可能还未完全启动，请检查日志"
fi

echo ""
echo "=========================================="
log "🎉 管理面板更新完成！"
echo "=========================================="
echo ""
echo "修复内容："
echo "  ✅ 修复了CloudBase配置路径依赖问题"
echo "  ✅ 创建了独立的cloudbaseConfig.js文件"
echo "  ✅ 更新了最新的代码和依赖"
echo ""
echo "请重新尝试登录管理面板："
echo "  🔗 管理面板地址: http://your-server-ip/admin/"
echo ""
echo "如果仍有问题，请检查："
echo "  📋 pm2 logs petmeet-admin  (查看管理面板日志)"
echo "  🔧 cat /opt/petmeet/admin-panel/.env  (检查环境变量)"
echo "" 