// 后端API配置文件
// 管理面板调用后端API的配置

// 后端API基础地址配置
const BACKEND_CONFIG = {
    // 开发环境配置
    development: {
        host: 'localhost',
        port: 3000,
        protocol: 'http',
        baseURL: 'http://localhost:3000'
    },
    
    // 生产环境配置
    production: {
        host: process.env.BACKEND_HOST || 'localhost',
        port: process.env.BACKEND_PORT || 3000,
        protocol: process.env.BACKEND_PROTOCOL || 'http',
        baseURL: process.env.BACKEND_API_BASE || 'http://localhost:3000'
    },
    
    // 测试环境配置
    test: {
        host: 'localhost',
        port: 3001,
        protocol: 'http',
        baseURL: 'http://localhost:3001'
    }
};

// 获取当前环境的配置
const getCurrentConfig = () => {
    const env = process.env.NODE_ENV || 'development';
    return BACKEND_CONFIG[env] || BACKEND_CONFIG.development;
};

// 构建完整的API URL
const buildAPIURL = (endpoint) => {
    const config = getCurrentConfig();
    return `${config.baseURL}/admin${endpoint}`;
};

// API端点定义
const API_ENDPOINTS = {
    // 认证相关
    AUTH: {
        LOGIN: '/auth/login',
        VALIDATE: '/auth/validate'
    },
    
    // 用户管理
    USERS: {
        LIST: '/users',
        DETAIL: '/users/:id',
        CREATE: '/users',
        UPDATE: '/users/:id',
        DELETE: '/users/:id',
        POSTS: '/users/:id/posts'
    },
    
    // 帖文管理
    POSTS: {
        LIST: '/posts',
        CREATE: '/posts',
        UPDATE: '/posts/:id',
        DELETE: '/posts/:id'
    },
    
    // AI模型管理
    AI_MODELS: {
        LIST: '/ai-models',
        CREATE: '/ai-models',
        DETAIL: '/ai-models/:id',
        UPDATE: '/ai-models/:id',
        DELETE: '/ai-models/:id',
        TEST: '/ai-models/:id/test'
    },
    
    // AI配置
    AI_CONFIG: {
        GET: '/ai/config',
        UPDATE: '/ai/config'
    },
    
    // AI生成功能
    GENERATE: {
        USERS: '/generate/users',
        POSTS: '/generate/posts'
    },
    
    // 数据保存
    SAVE: {
        PREVIEW_USERS: '/save-preview-users',
        PREVIEW_POSTS: '/save-preview-posts'
    },
    
    // 评论管理
    COMMENTS: {
        LIST: '/comments'
    },
    
    // 环境变量管理
    ENV: {
        API_KEYS: '/env/api-keys',
        GET_API_KEY: '/env/get-api-key'
    },
    
    // 数据修复工具
    TOOLS: {
        FIX_EMPTY_IMAGES: '/fix-empty-images'
    },
    
    // 统计信息
    STATS: {
        OVERVIEW: '/stats'
    }
};

// 替换路径参数
const replacePathParams = (path, params = {}) => {
    let result = path;
    Object.keys(params).forEach(key => {
        result = result.replace(`:${key}`, params[key]);
    });
    return result;
};

module.exports = {
    BACKEND_CONFIG,
    getCurrentConfig,
    buildAPIURL,
    API_ENDPOINTS,
    replacePathParams
}; 