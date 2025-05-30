// PetMeet 管理面板调试配置
const DebugConfig = {
    // 调试开关
    enabled: process.env.NODE_ENV !== 'production',
    
    // 日志级别
    logLevels: {
        ERROR: 0,   // 只显示错误
        WARN: 1,    // 显示警告和错误
        INFO: 2,    // 显示信息、警告和错误
        DEBUG: 3    // 显示所有日志
    },
    
    // 当前日志级别
    currentLevel: process.env.DEBUG_LEVEL || 'INFO',
    
    // 前端调试配置
    frontend: {
        // 是否显示调试面板
        showDebugPanel: true,
        
        // 日志保留数量
        maxLogEntries: 1000,
        
        // 是否自动导出错误日志
        autoExportErrors: false,
        
        // API请求拦截
        interceptAPI: true,
        
        // 性能监控
        performanceMonitoring: true,
        
        // 用户操作跟踪
        trackUserActions: true
    },
    
    // 后端调试配置
    backend: {
        // 详细API日志
        verboseAPILogs: true,
        
        // 数据库查询日志
        logDatabaseQueries: true,
        
        // JWT认证日志
        logAuthentication: true,
        
        // 错误堆栈跟踪
        includeStackTrace: true,
        
        // 请求ID追踪
        useRequestIds: true
    },
    
    // 日志格式配置
    logFormat: {
        // 时间戳格式
        timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
        
        // 包含组件名称
        includeComponent: true,
        
        // 包含请求ID
        includeRequestId: true,
        
        // 数据截断长度
        maxDataLength: 1000
    },
    
    // 特定功能的调试开关
    features: {
        // 登录流程调试
        loginDebug: true,
        
        // 用户管理调试
        userManagementDebug: true,
        
        // AI功能调试
        aiDebug: true,
        
        // 文件上传调试
        fileUploadDebug: true,
        
        // 数据库操作调试
        databaseDebug: true
    },
    
    // 调试工具配置
    tools: {
        // 网络请求监控
        networkMonitoring: true,
        
        // 性能分析
        performanceAnalysis: true,
        
        // 内存使用监控
        memoryMonitoring: false,
        
        // 自动错误报告
        autoErrorReporting: false
    },
    
    // 生产环境安全设置
    production: {
        // 禁用所有调试输出
        disableAllLogs: true,
        
        // 只记录错误
        errorsOnly: true,
        
        // 隐藏敏感信息
        hideSensitiveData: true,
        
        // 最小化日志详情
        minimalLogs: true
    }
};

// 工具函数
DebugConfig.shouldLog = function(level) {
    const levels = this.logLevels;
    const currentLevelValue = levels[this.currentLevel] || levels.INFO;
    const requestedLevelValue = levels[level] || levels.INFO;
    
    return requestedLevelValue <= currentLevelValue;
};

// 获取当前环境配置
DebugConfig.getCurrentConfig = function() {
    if (process.env.NODE_ENV === 'production') {
        return { ...this, ...this.production };
    }
    return this;
};

// 格式化日志消息
DebugConfig.formatLogMessage = function(level, component, message, data = null, requestId = null) {
    const timestamp = new Date().toISOString();
    const parts = [];
    
    // 时间戳
    parts.push(`[${timestamp}]`);
    
    // 日志级别
    parts.push(`[${level.toUpperCase()}]`);
    
    // 组件名称
    if (this.logFormat.includeComponent && component) {
        parts.push(`[${component}]`);
    }
    
    // 请求ID
    if (this.logFormat.includeRequestId && requestId) {
        parts.push(`[${requestId}]`);
    }
    
    // 消息
    parts.push(message);
    
    // 构建完整消息
    let fullMessage = parts.join(' ');
    
    // 添加数据
    if (data) {
        let dataStr = '';
        try {
            dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
            
            // 截断过长的数据
            if (this.logFormat.maxDataLength && dataStr.length > this.logFormat.maxDataLength) {
                dataStr = dataStr.substring(0, this.logFormat.maxDataLength) + '... (truncated)';
            }
            
            fullMessage += `\n数据: ${dataStr}`;
        } catch (e) {
            fullMessage += `\n数据: [无法序列化: ${e.message}]`;
        }
    }
    
    return fullMessage;
};

// 获取调试状态摘要
DebugConfig.getDebugSummary = function() {
    const config = this.getCurrentConfig();
    
    return {
        enabled: config.enabled,
        environment: process.env.NODE_ENV || 'development',
        logLevel: config.currentLevel,
        features: Object.keys(config.features).filter(key => config.features[key]),
        tools: Object.keys(config.tools).filter(key => config.tools[key])
    };
};

// 浏览器环境检测
if (typeof window !== 'undefined') {
    // 前端环境
    window.DebugConfig = DebugConfig;
    
    // 添加调试信息到控制台
    if (DebugConfig.enabled) {
        console.log('🐛 PetMeet 管理面板调试模式已启用');
        console.log('📊 调试配置:', DebugConfig.getDebugSummary());
    }
} else {
    // Node.js 环境
    module.exports = DebugConfig;
} 