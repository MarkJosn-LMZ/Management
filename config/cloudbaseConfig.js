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