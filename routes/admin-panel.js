const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');

// 后端API基础地址 - 从环境变量读取，默认为本地
const BACKEND_API_BASE = process.env.BACKEND_API_BASE || 'http://localhost:3000';

// 调试日志函数
function debugLog(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        component: 'ADMIN-PANEL-API',
        message,
        data
    };
    
    console.log(`[${timestamp}] [${level.toUpperCase()}] [ADMIN-PANEL-API] ${message}`, data || '');
    
    // 根据级别选择控制台方法
    const consoleMethod = level === 'error' ? 'error' : 
                         level === 'warn' ? 'warn' : 
                         level === 'success' ? 'info' : 'log';
    
    if (data) {
        console[consoleMethod]('详细数据:', data);
    }
}

// 调用后端API的辅助函数（增强版）
async function callBackendAPI(endpoint, method = 'GET', data = null, token = null) {
    const requestId = Math.random().toString(36).substr(2, 9);
    
    try {
        debugLog('info', `API请求开始 [${requestId}]`, {
            endpoint,
            method,
            hasData: !!data,
            hasToken: !!token,
            backendBase: BACKEND_API_BASE
        });

        const config = {
            method,
            url: `${BACKEND_API_BASE}/api/admin${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 120000 // 增加到120秒，因为AI生成可能需要较长时间
        };

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            debugLog('info', `添加Authorization头 [${requestId}]`, { 
                tokenPrefix: token.substring(0, 20) + '...' 
            });
        }

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.data = data;
            debugLog('info', `添加请求数据 [${requestId}]`, { 
                dataKeys: Object.keys(data),
                dataSize: JSON.stringify(data).length + ' bytes'
            });
        }

        debugLog('info', `发送HTTP请求 [${requestId}]`, {
            url: config.url,
            method: config.method,
            headers: Object.keys(config.headers)
        });

        const startTime = Date.now();
        const response = await axios(config);
        const duration = Date.now() - startTime;

        debugLog('success', `API请求成功 [${requestId}]`, {
            status: response.status,
            statusText: response.statusText,
            duration: duration + 'ms',
            responseSize: JSON.stringify(response.data).length + ' bytes',
            responseDataKeys: response.data ? Object.keys(response.data) : []
        });

        return response.data;
    } catch (error) {
        const duration = Date.now() - (error.config?.startTime || Date.now());
        
        debugLog('error', `API请求失败 [${requestId}]`, {
            errorName: error.name,
            errorMessage: error.message,
            duration: duration + 'ms',
            responseStatus: error.response?.status,
            responseStatusText: error.response?.statusText,
            responseData: error.response?.data,
            requestConfig: {
                url: error.config?.url,
                method: error.config?.method,
                timeout: error.config?.timeout
            }
        });

        if (error.response) {
            debugLog('error', `后端API错误响应 [${requestId}]`, {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
                headers: error.response.headers
            });
            throw new Error(error.response.data?.message || '后端API调用失败');
        }
        throw error;
    }
}

// JWT认证中间件（增强版）
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    debugLog('info', 'JWT认证检查开始', {
        hasAuthHeader: !!authHeader,
        hasToken: !!token,
        userAgent: req.headers['user-agent'],
        clientIP: req.ip || req.connection.remoteAddress
    });

    if (!token) {
        debugLog('warn', 'JWT认证失败：缺少访问令牌', {
            authHeader: authHeader || 'null'
        });
        return res.status(401).json({
            success: false,
            message: '访问令牌未提供'
        });
    }

    const secret = process.env.JWT_SECRET || 'petmeet-admin-secret';
    debugLog('info', 'JWT令牌验证中', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
        secretConfigured: !!process.env.JWT_SECRET
    });

    jwt.verify(token, secret, (err, user) => {
        if (err) {
            debugLog('error', 'JWT令牌验证失败', {
                errorName: err.name,
                errorMessage: err.message,
                tokenExpired: err.name === 'TokenExpiredError',
                tokenInvalid: err.name === 'JsonWebTokenError'
            });
            return res.status(403).json({
                success: false,
                message: '访问令牌无效'
            });
        }
        
        debugLog('success', 'JWT认证成功', {
            userId: user.id,
            userOpenid: user.openid,
            tokenExp: new Date(user.exp * 1000).toISOString()
        });
        
        req.user = user;
        req.token = token; // 保存token用于后续API调用
        next();
    });
};

// ==================== 认证相关 ====================

// 管理员登录 - 调用后端API（增强版）
router.post('/auth/login', async (req, res) => {
    const loginId = Math.random().toString(36).substr(2, 9);
    
    try {
        debugLog('info', `管理员登录请求开始 [${loginId}]`, {
            clientIP: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            requestBody: req.body
        });

        const { petMeetId, nickName } = req.body;
        
        debugLog('info', `解析登录请求数据 [${loginId}]`, {
            petMeetId,
            nickName: nickName || '(未提供)',
            petMeetIdType: typeof petMeetId,
            petMeetIdLength: petMeetId ? petMeetId.toString().length : 0
        });
        
        if (!petMeetId) {
            debugLog('warn', `登录验证失败：缺少PetMeet ID [${loginId}]`);
            return res.status(400).json({
                success: false,
                message: 'PetMeet ID是必需的'
            });
        }

        // 数据库连接和查询
        debugLog('info', `开始数据库查询 [${loginId}]`, {
            searchPetMeetId: petMeetId
        });

        const { getDatabase } = require('../../后端/config/cloudbaseConfig');
        const db = getDatabase();
        
        try {
            debugLog('info', `执行数据库查询 [${loginId}]`, {
                collection: 'user_profile',
                whereCondition: { PetMeetID: petMeetId },
                limit: 1
            });

            const queryStartTime = Date.now();
            const { data: users } = await db.collection('user_profile')
                .where({ PetMeetID: petMeetId })
                .limit(1)
                .get();
            const queryDuration = Date.now() - queryStartTime;
            
            debugLog('info', `数据库查询完成 [${loginId}]`, {
                queryDuration: queryDuration + 'ms',
                resultCount: users ? users.length : 0,
                foundUser: !!users && users.length > 0
            });
            
            if (!users || users.length === 0) {
                debugLog('warn', `用户不存在 [${loginId}]`, {
                    searchedPetMeetId: petMeetId,
                    searchResult: 'not_found'
                });
                return res.status(404).json({
                    success: false,
                    message: '未找到对应的PetMeet ID用户，请检查ID是否正确'
                });
            }
            
            const user = users[0];
            debugLog('success', `找到用户 [${loginId}]`, { 
                userId: user._id,
                userNickName: user.nickName, 
                userOpenid: user._openid,
                userCreatedAt: user.createdAt,
                userLevel: user.level
            });

            // 调用后端登录API
            debugLog('info', `准备调用后端登录API [${loginId}]`, {
                backendEndpoint: '/auth/login',
                loginData: {
                    openid: user._openid,
                    nickName: nickName || user.nickName
                }
            });

            const backendStartTime = Date.now();
            const result = await callBackendAPI('/auth/login', 'POST', { 
                openid: user._openid, // 使用用户的真实openid
                nickName: nickName || user.nickName
            });
            const backendDuration = Date.now() - backendStartTime;

            debugLog('success', `后端登录API调用成功 [${loginId}]`, {
                backendDuration: backendDuration + 'ms',
                resultSuccess: result.success,
                hasToken: !!result.token,
                hasUser: !!result.user
            });
            
            res.json(result);
            
        } catch (dbError) {
            debugLog('error', `数据库操作失败 [${loginId}]`, {
                errorName: dbError.name,
                errorMessage: dbError.message,
                errorStack: dbError.stack
            });
            return res.status(500).json({
                success: false,
                message: '数据库查询失败，请重试'
            });
        }
        
    } catch (error) {
        debugLog('error', `管理面板登录失败 [${loginId}]`, {
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack
        });
        res.status(500).json({
            success: false,
            message: '登录失败: ' + error.message
        });
    }
});

// 验证JWT token - 调用后端API（增强版）
router.get('/auth/validate', authenticateToken, async (req, res) => {
    const validateId = Math.random().toString(36).substr(2, 9);
    
    try {
        debugLog('info', `Token验证请求开始 [${validateId}]`, {
            userId: req.user.id,
            userOpenid: req.user.openid,
            clientIP: req.ip || req.connection.remoteAddress
        });

        const result = await callBackendAPI('/auth/validate', 'GET', null, req.token);
        
        debugLog('success', `Token验证成功 [${validateId}]`, {
            backendResult: result.success,
            userValid: !!result.user
        });
        
        res.json(result);
    } catch (error) {
        debugLog('error', `Token验证失败 [${validateId}]`, {
            errorName: error.name,
            errorMessage: error.message
        });
        res.status(500).json({
            success: false,
            message: 'Token验证失败: ' + error.message
        });
    }
});

// ==================== 用户管理 ====================

// 获取所有用户 - 调用后端API
router.get('/users', authenticateToken, async (req, res) => {
    try {
        debugLog('info', '管理面板获取用户列表 - 调用后端API');
        const result = await callBackendAPI('/users', 'GET', null, req.token);
        res.json(result);
    } catch (error) {
        debugLog('error', '获取用户列表失败', {
            errorName: error.name,
            errorMessage: error.message
        });
        res.status(500).json({
            success: false,
            message: '获取用户列表失败: ' + error.message
        });
    }
});

// 获取虚拟用户（过滤AI生成的用户）
router.get('/virtual-users', authenticateToken, async (req, res) => {
    try {
        console.log('📋 管理面板获取虚拟用户列表 - 调用后端API');
        const result = await callBackendAPI('/users', 'GET', null, req.token);
        
        if (result.success && result.data) {
            // 在前端过滤虚拟用户 - 只要有isAIGenerated字段就认为是虚拟用户
            const virtualUsers = result.data.filter(user => user.hasOwnProperty('isAIGenerated'));
            res.json({
                success: true,
                data: virtualUsers,
                total: virtualUsers.length
            });
        } else {
            res.json(result);
        }
    } catch (error) {
        console.error('获取虚拟用户列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取虚拟用户列表失败: ' + error.message
        });
    }
});

// 获取单个用户详情 - 调用后端API
router.get('/users/:id', authenticateToken, async (req, res) => {
    try {
        const result = await callBackendAPI(`/users/${req.params.id}`, 'GET', null, req.token);
        res.json(result);
    } catch (error) {
        console.error('获取用户详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户详情失败: ' + error.message
        });
    }
});

// 创建用户 - 调用后端API
router.post('/users', authenticateToken, async (req, res) => {
    try {
        const { 
            nickName, 
            avatarUrl, 
            status, 
            PetMeetID, 
            gender, 
            city,
            province,
            country,
            language,
            birthday,
            bio, 
            level, 
            experience,
            petInfo,
            isAIGenerated,
            aiModel,
            _openid
        } = req.body;
        
        if (!nickName) {
            return res.status(400).json({
                success: false,
                message: '用户昵称是必需的'
            });
        }

        console.log('🆕 管理面板创建用户:', { nickName, isAIGenerated, city, province });

        // 调用后端API创建用户，传递所有字段
        const result = await callBackendAPI('/users', 'POST', {
            nickName,
            avatarUrl,
            status,
            PetMeetID,
            gender,
            city,
            province,
            country,
            language,
            birthday,
            bio,
            level,
            experience,
            petInfo,
            isAIGenerated,
            aiModel,
            _openid
        }, req.token);

        res.json(result);
    } catch (error) {
        console.error('创建用户失败:', error);
        res.status(500).json({
            success: false,
            message: '创建用户失败: ' + error.message
        });
    }
});

// 更新用户 - 调用后端API
router.put('/users/:id', authenticateToken, async (req, res) => {
    try {
        const result = await callBackendAPI(`/users/${req.params.id}`, 'PUT', req.body, req.token);
        res.json(result);
    } catch (error) {
        console.error('更新用户失败:', error);
        res.status(500).json({
            success: false,
            message: '更新用户失败: ' + error.message
        });
    }
});

// 删除用户 - 调用后端API
router.delete('/users/:id', authenticateToken, async (req, res) => {
    try {
        const result = await callBackendAPI(`/users/${req.params.id}`, 'DELETE', null, req.token);
        res.json(result);
    } catch (error) {
        console.error('删除用户失败:', error);
        res.status(500).json({
            success: false,
            message: '删除用户失败: ' + error.message
        });
    }
});

// ==================== 帖文管理 ====================

// 获取所有帖文 - 调用后端API (修改为获取所有用户的帖文)
router.get('/posts', authenticateToken, async (req, res) => {
    try {
        console.log('📋 管理面板获取帖文列表 - 通过用户列表获取所有帖文');
        
        // 首先获取所有用户
        const usersResult = await callBackendAPI('/users', 'GET', null, req.token);
        if (!usersResult.success) {
            throw new Error('获取用户列表失败');
        }
        
        const users = usersResult.data || [];
        let allPosts = [];
        
        // 为每个用户获取帖文
        for (const user of users) {
            try {
                const userPostsResult = await callBackendAPI(`/users/${user._id}/posts`, 'GET', null, req.token);
                if (userPostsResult.success && userPostsResult.data) {
                    // 为每个帖文添加用户信息
                    const postsWithUserInfo = userPostsResult.data.map(post => ({
                        ...post,
                        authorInfo: {
                            _id: user._id,
                            nickName: user.nickName,
                            avatarUrl: user.avatarUrl
                        }
                    }));
                    allPosts = allPosts.concat(postsWithUserInfo);
                }
            } catch (error) {
                console.warn(`获取用户 ${user._id} 的帖文失败:`, error.message);
                // 继续处理其他用户
            }
        }
        
        // 按创建时间排序
        allPosts.sort((a, b) => new Date(b.createdAt || b.createTime) - new Date(a.createdAt || a.createTime));
        
        res.json({
            success: true,
            data: allPosts,
            total: allPosts.length,
            message: `获取帖文列表成功，共 ${allPosts.length} 篇帖文`
        });
    } catch (error) {
        console.error('获取帖文列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取帖文列表失败: ' + error.message
        });
    }
});

// 创建帖文 - 调用后端API
router.post('/posts', authenticateToken, async (req, res) => {
    try {
        const { 
            title, 
            content, 
            longPost, 
            authorId, 
            topics, 
            location, 
            permission, 
            contentType, 
            status, 
            images, 
            breedingRequirements 
        } = req.body;
        
        if (!content) {
            return res.status(400).json({
                success: false,
                message: '帖文内容是必需的'
            });
        }

        // 调用后端API创建帖文
        const result = await callBackendAPI('/posts', 'POST', {
            title,
            content,
            longPost,
            authorId,
            topics,
            location,
            permission,
            contentType,
            status,
            images,
            breedingRequirements
        }, req.token);

        res.json(result);
    } catch (error) {
        console.error('创建帖文失败:', error);
        res.status(500).json({
            success: false,
            message: '创建帖文失败: ' + error.message
        });
    }
});

// 更新帖文 - 调用后端API
router.put('/posts/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            title, 
            content, 
            longPost, 
            authorId, 
            topics, 
            location, 
            permission, 
            contentType, 
            status, 
            images, 
            breedingRequirements,
            category
        } = req.body;

        // 调用后端API更新帖文
        const result = await callBackendAPI(`/posts/${id}`, 'PUT', {
            title,
            content,
            longPost,
            authorId,
            topics,
            location,
            permission,
            contentType,
            status,
            images,
            breedingRequirements,
            category
        }, req.token);

        res.json(result);
    } catch (error) {
        console.error('更新帖文失败:', error);
        res.status(500).json({
            success: false,
            message: '更新帖文失败: ' + error.message
        });
    }
});

// 删除帖文 - 调用后端API
router.delete('/posts/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // 调用后端API删除帖文
        const result = await callBackendAPI(`/posts/${id}`, 'DELETE', null, req.token);
        
        res.json(result);
    } catch (error) {
        console.error('删除帖文失败:', error);
        res.status(500).json({
            success: false,
            message: '删除帖文失败: ' + error.message
        });
    }
});

// ==================== AI模型管理 ====================

// 获取所有AI模型 - 调用后端API
router.get('/ai-models', authenticateToken, async (req, res) => {
    try {
        console.log('📋 管理面板获取AI模型列表 - 调用后端API');
        const result = await callBackendAPI('/ai/models', 'GET', null, req.token);
        res.json(result);
    } catch (error) {
        console.error('获取AI模型列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取AI模型列表失败: ' + error.message
        });
    }
});

// 创建AI模型 - 后端暂无此功能
router.post('/ai-models', authenticateToken, async (req, res) => {
    try {
        console.log('🆕 管理面板创建AI模型');
        
        const { name, description, version, status, apiKey, endpoint, type, provider, model, baseURL, config } = req.body;
        
        if (!name || !type || !provider || !model || !baseURL) {
            return res.status(400).json({
                success: false,
                message: '必填字段不能为空 (name, type, provider, model, baseURL)'
            });
        }

        // 调用后端API创建AI模型
        const result = await callBackendAPI('/ai-models', 'POST', {
            name,
            description,
            version,
            status,
            apiKey,
            endpoint,
            type,
            provider,
            model,
            baseURL,
            config
        }, req.token);
        
        res.json(result);
    } catch (error) {
        console.error('创建AI模型失败:', error);
        res.status(500).json({
            success: false,
            message: '创建AI模型失败: ' + error.message
        });
    }
});

// 更新AI模型 - 调用后端API
router.put('/ai-models/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        console.log(`📝 管理面板更新AI模型: ${id}`, updateData);
        
        // 调用后端API更新AI模型
        const result = await callBackendAPI(`/ai/models/${id}`, 'PUT', updateData, req.token);
        
        res.json(result);
    } catch (error) {
        console.error('更新AI模型失败:', error);
        res.status(500).json({
            success: false,
            message: '更新AI模型失败: ' + error.message
        });
    }
});

// 删除AI模型 - 调用后端API
router.delete('/ai-models/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // 调用后端API删除AI模型
        const result = await callBackendAPI(`/ai-models/${id}`, 'DELETE', null, req.token);
        
        res.json(result);
    } catch (error) {
        console.error('删除AI模型失败:', error);
        res.status(500).json({
            success: false,
            message: '删除AI模型失败: ' + error.message
        });
    }
});

// 测试AI模型 - 调用后端API
router.post('/ai-models/:id/test', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // 调用后端API测试AI模型
        const result = await callBackendAPI(`/ai-models/${id}/test`, 'POST', null, req.token);
        
        res.json(result);
    } catch (error) {
        console.error('测试AI模型失败:', error);
        res.status(500).json({
            success: false,
            message: '测试AI模型失败: ' + error.message
        });
    }
});

// 获取单个AI模型详情（用于编辑） - 调用后端API
router.get('/ai-models/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📋 获取AI模型详情 - 调用后端API');
                                        
        // 调用后端API获取AI模型详情
        const result = await callBackendAPI(`/ai/models/${id}`, 'GET', null, req.token);
        
        res.json(result);
    } catch (error) {
        console.error('获取AI模型详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取AI模型详情失败: ' + error.message
        });
    }
});

// ==================== 评论管理 ====================

// 获取所有评论 - 后端暂无此功能
router.get('/comments', authenticateToken, async (req, res) => {
    try {
        console.log('📋 管理面板获取评论列表 - 功能暂未开放');
        
        // 后端暂时没有统一的评论管理接口，返回空数据和提示
        res.json({
            success: true,
            data: [],
            total: 0,
            message: '评论管理功能暂未开放，请通过帖文详情页面管理评论'
        });
    } catch (error) {
        console.error('获取评论列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取评论列表失败: ' + error.message
        });
    }
});

// ==================== AI生成功能 ====================

// AI生成用户 - 调用后端API
router.post('/generate/users', authenticateToken, async (req, res) => {
    try {
        const { modelId, count, previewOnly } = req.body;
        
        if (!modelId || !count || count < 1) {
            return res.status(400).json({
                success: false,
                message: '参数无效'
            });
        }

        if (count > 20) {
            return res.status(400).json({
                success: false,
                message: '单次生成用户数量不能超过20个'
            });
        }

        console.log('🤖 AI生成用户请求:', { modelId, count, previewOnly });

        // 调用后端API生成用户数据
        const result = await callBackendAPI('/generate/users', 'POST', {
            modelId,
            count,
            previewOnly
        }, req.token);

        res.json(result);
    } catch (error) {
        console.error('AI生成用户失败:', error);
        res.status(500).json({
            success: false,
            message: 'AI生成用户失败: ' + error.message
        });
    }
});

// AI生成帖文（增强版：包含图像生成） - 调用后端API
router.post('/generate/posts', authenticateToken, async (req, res) => {
    try {
        const { modelId, count, topic, authorId, previewOnly, enableImageGeneration = false, selectedImageModel } = req.body;
        
        if (!modelId || !count || count < 1) {
            return res.status(400).json({
                success: false,
                message: '参数无效'
            });
        }

        if (count > 15) {
            return res.status(400).json({
                success: false,
                message: '单次生成帖文数量不能超过15个'
            });
        }

        console.log('🤖 AI生成帖文请求:', { modelId, count, topic, authorId, previewOnly, enableImageGeneration, selectedImageModel });

        // 调用后端API生成帖文数据
        const result = await callBackendAPI('/generate/posts', 'POST', {
            modelId,
            count,
            topic,
            authorId,
            previewOnly,
            enableImageGeneration,
            selectedImageModel
        }, req.token);

        res.json(result);
    } catch (error) {
        console.error('AI生成帖文失败:', error);
        res.status(500).json({
                success: false,
            message: 'AI生成帖文失败: ' + error.message
            });
        }
});

// 保存预览用户到数据库 - 调用后端API
router.post('/save-preview-users', authenticateToken, async (req, res) => {
    try {
        const { users, modelId } = req.body;
        
        if (!users || !Array.isArray(users) || users.length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有要保存的用户数据'
            });
        }

        console.log('💾 保存预览用户请求:', { count: users.length, modelId });

        // 调用后端API保存预览用户数据
        const result = await callBackendAPI('/save-preview-users', 'POST', {
            users,
            modelId
        }, req.token);

        res.json(result);

            } catch (error) {
        console.error('保存预览用户失败:', error);
        res.status(500).json({
                success: false,
            message: '保存预览用户失败: ' + error.message
            });
        }
});

// 保存预览帖文到数据库 - 调用后端API
router.post('/save-preview-posts', authenticateToken, async (req, res) => {
    try {
        const { posts, modelId, authorId } = req.body;
        
        if (!posts || !Array.isArray(posts) || posts.length === 0) {
                return res.status(400).json({
                    success: false,
                message: '没有要保存的帖文数据'
                });
            }

        console.log('💾 保存预览帖文请求:', { count: posts.length, modelId, authorId });

        // 调用后端API保存预览帖文数据
        const result = await callBackendAPI('/save-preview-posts', 'POST', {
            posts,
            modelId,
            authorId
        }, req.token);

        res.json(result);

    } catch (error) {
        console.error('保存预览帖文失败:', error);
        res.status(500).json({
            success: false,
            message: '保存预览帖文失败: ' + error.message
        });
    }
});
                    
// ==================== 环境变量管理 ====================

// 获取可用的API密钥环境变量 - 调用后端API
router.get('/env/api-keys', authenticateToken, async (req, res) => {
    try {
        const result = await callBackendAPI('/env/api-keys', 'GET', null, req.token);
        res.json(result);
    } catch (error) {
        console.error('获取环境变量列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取环境变量列表失败: ' + error.message
        });
    }
});
                        
// 获取环境变量的实际值（用于应用到模型配置） - 调用后端API
router.post('/env/get-api-key', authenticateToken, async (req, res) => {
    try {
        const { keyName } = req.body;
        
        if (!keyName) {
            return res.status(400).json({
                success: false,
                message: '请提供环境变量名称'
            });
                        }
                        
        // 调用后端API获取环境变量值
        const result = await callBackendAPI('/env/get-api-key', 'POST', { keyName }, req.token);

        res.json(result);
    } catch (error) {
        console.error('获取环境变量值失败:', error);
        res.status(500).json({
            success: false,
            message: '获取环境变量值失败: ' + error.message
        });
    }
                                });
                                
// 修复帖文中的空图片URL - 调用后端API
router.post('/fix-empty-images', authenticateToken, async (req, res) => {
    try {
        console.log('🔧 开始修复帖文中的空图片URL...');
        
        // 调用后端API修复帖文中的空图片URL
        const result = await callBackendAPI('/fix-empty-images', 'POST', null, req.token);
        
        res.json(result);
    } catch (error) {
        console.error('修复帖文图片失败:', error);
        res.status(500).json({
            success: false,
            message: '修复帖文图片失败: ' + error.message
        });
    }
});

// ==================== 宠物信息管理 ====================

// 获取用户的所有宠物 - 调用后端API
router.get('/users/:userId/pets', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('🐾 管理面板获取用户宠物列表:', userId);
        
        const result = await callBackendAPI(`/users/${userId}/pets`, 'GET', null, req.token);
        res.json(result);
    } catch (error) {
        console.error('获取用户宠物列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取宠物列表失败: ' + error.message
        });
    }
});

// 创建宠物信息 - 调用后端API
router.post('/users/:userId/pets', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const petData = req.body;
        
        console.log('🐾 管理面板创建宠物信息:', userId, petData.name);
        
        if (!petData.name || !petData.category) {
            return res.status(400).json({
                success: false,
                message: '宠物名称和类别是必需的'
            });
        }
        
        const result = await callBackendAPI(`/users/${userId}/pets`, 'POST', petData, req.token);
        res.json(result);
    } catch (error) {
        console.error('创建宠物信息失败:', error);
        res.status(500).json({
            success: false,
            message: '创建宠物信息失败: ' + error.message
        });
    }
});

// 更新宠物信息 - 调用后端API
router.put('/pets/:petId', authenticateToken, async (req, res) => {
    try {
        const { petId } = req.params;
        const petData = req.body;
        
        console.log('🐾 管理面板更新宠物信息:', petId);
        
        const result = await callBackendAPI(`/pets/${petId}`, 'PUT', petData, req.token);
        res.json(result);
    } catch (error) {
        console.error('更新宠物信息失败:', error);
        res.status(500).json({
            success: false,
            message: '更新宠物信息失败: ' + error.message
        });
    }
});

// 删除宠物信息 - 调用后端API
router.delete('/pets/:petId', authenticateToken, async (req, res) => {
    try {
        const { petId } = req.params;
        
        console.log('🐾 管理面板删除宠物信息:', petId);
        
        const result = await callBackendAPI(`/pets/${petId}`, 'DELETE', null, req.token);
        res.json(result);
    } catch (error) {
        console.error('删除宠物信息失败:', error);
        res.status(500).json({
            success: false,
            message: '删除宠物信息失败: ' + error.message
        });
    }
});

// 获取单个宠物详情 - 调用后端API
router.get('/pets/:petId', authenticateToken, async (req, res) => {
    try {
        const { petId } = req.params;
        
        console.log('🐾 管理面板获取宠物详情:', petId);
        
        const result = await callBackendAPI(`/pets/${petId}`, 'GET', null, req.token);
        res.json(result);
    } catch (error) {
        console.error('获取宠物详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取宠物详情失败: ' + error.message
        });
    }
});

module.exports = router;

// ==================== 文件上传代理 ====================

// 上传帖文图片 - 代理到后端
router.post('/upload/post-image', authenticateToken, async (req, res) => {
    try {
        console.log('📸 管理面板代理帖文图片上传请求');
        
        // 创建FormData来转发文件
        const FormData = require('form-data');
        const form = new FormData();
                                    
        // 从请求中获取文件数据
        if (req.files && req.files.file) {
            const file = req.files.file;
            form.append('file', file.data, {
                filename: file.name,
                contentType: file.mimetype
            });
                                        } else {
            return res.status(400).json({
                success: false,
                message: '没有上传文件'
            });
        }
        
        // 调用后端上传API
        const uploadResponse = await axios.post(
            `${BACKEND_API_BASE}/api/upload/post-image`,
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Bearer ${req.token}`
                },
                timeout: 60000 // 文件上传增加到60秒
            }
        );
        
        console.log('✅ 帖文图片上传成功');
        res.json(uploadResponse.data);

    } catch (error) {
        console.error('帖文图片上传失败:', error);
        res.status(500).json({
            success: false,
            message: '帖文图片上传失败: ' + error.message
        });
    }
});

// 上传头像 - 代理到后端
router.post('/upload/avatar', authenticateToken, async (req, res) => {
    try {
        console.log('👤 管理面板代理头像上传请求');
        
        // 创建FormData来转发文件
        const FormData = require('form-data');
        const form = new FormData();
        
        // 从请求中获取文件数据
        if (req.files && req.files.file) {
            const file = req.files.file;
            form.append('file', file.data, {
                filename: file.name,
                contentType: file.mimetype
            });
        } else {
            return res.status(400).json({
                success: false,
                message: '没有上传文件'
            });
        }

        // 调用后端上传API
        const uploadResponse = await axios.post(
            `${BACKEND_API_BASE}/api/upload/avatar`,
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Bearer ${req.token}`
                },
                timeout: 60000 // 文件上传增加到60秒
            }
        );

        console.log('✅ 头像上传成功');
        res.json(uploadResponse.data);

    } catch (error) {
        console.error('头像上传失败:', error);
        res.status(500).json({
            success: false,
            message: '头像上传失败: ' + error.message
        });
    }
});

// ==================== 地理编码代理 ====================

// 地理编码搜索 - 代理到后端
router.get('/geocode/search', authenticateToken, async (req, res) => {
    try {
        const { query: searchQuery } = req.query;
        
        if (!searchQuery) {
            return res.status(400).json({
                success: false,
                message: '缺少搜索关键词'
            });
        }

        console.log('🗺️ 管理面板代理地理编码搜索:', searchQuery);

        // 调用后端地理编码搜索API
        const geocodeResponse = await axios.get(
            `${BACKEND_API_BASE}/api/hospitals/geocode/search`,
            {
                params: { query: searchQuery },
                headers: {
                    'Authorization': `Bearer ${req.token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );
        
        res.json(geocodeResponse.data);

    } catch (error) {
        console.error('地理编码搜索失败:', error);
        res.status(500).json({
            success: false,
            message: '地理编码搜索失败: ' + error.message
        });
    }
});

// 逆地理编码 - 代理到后端
router.get('/geocode/reverse', authenticateToken, async (req, res) => {
    try {
        const { longitude, latitude } = req.query;
        
        if (!longitude || !latitude) {
            return res.status(400).json({
                success: false,
                message: '缺少经纬度参数'
            });
        }
        
        console.log('🗺️ 管理面板代理逆地理编码:', { longitude, latitude });
        
        // 调用后端医院路由的逆地理编码API
        const geocodeResponse = await axios.get(
            `${BACKEND_API_BASE}/api/hospitals/geocode`,
            {
                params: { longitude, latitude },
                headers: {
                    'Authorization': `Bearer ${req.token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );

        res.json(geocodeResponse.data);
        
    } catch (error) {
        console.error('逆地理编码失败:', error);
        res.status(500).json({
            success: false,
            message: '逆地理编码失败: ' + error.message
        });
    }
});

// ==================== 云存储代理 ====================

// 获取临时文件URL - 代理到后端
router.get('/storage/file-url', authenticateToken, async (req, res) => {
    try {
        const { fileID } = req.query;
        
        if (!fileID) {
            return res.status(400).json({
                success: false,
                message: '缺少fileID参数'
            });
        }

        console.log('☁️ 管理面板代理获取文件URL:', fileID);
        
        // 调用后端云存储API
        const storageResponse = await axios.get(
            `${BACKEND_API_BASE}/api/cloud/file-url`,
            {
                params: { fileID },
                headers: {
                    'Authorization': `Bearer ${req.token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );
        
        res.json(storageResponse.data);
        
    } catch (error) {
        console.error('获取文件URL失败:', error);
        res.status(500).json({
            success: false,
            message: '获取文件URL失败: ' + error.message
        });
    }
});

// 批量获取临时文件URL - 代理到后端
router.post('/storage/batch-file-urls', authenticateToken, async (req, res) => {
    try {
        const { fileIDs } = req.body;
        
        if (!fileIDs || !Array.isArray(fileIDs)) {
            return res.status(400).json({
                success: false,
                message: '缺少fileIDs参数或格式不正确'
            });
        }

        console.log('☁️ 管理面板代理批量获取文件URL:', fileIDs.length);
        
        // 调用后端云存储API
        const storageResponse = await axios.post(
            `${BACKEND_API_BASE}/api/cloud/batch-file-urls`,
            { fileIDs },
            {
                headers: {
                    'Authorization': `Bearer ${req.token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // 批量操作增加到60秒
            }
        );
        
        res.json(storageResponse.data);
        
    } catch (error) {
        console.error('批量获取文件URL失败:', error);
        res.status(500).json({
            success: false,
            message: '批量获取文件URL失败: ' + error.message
        });
    }
});

// 扩展callBackendAPI函数以支持查询参数
async function callBackendAPIWithParams(endpoint, method = 'GET', data = null, token = null, params = null) {
    try {
        const config = {
            method,
            url: `${BACKEND_API_BASE}/admin${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 120000 // 增加到120秒，与主函数保持一致
        };

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (params && method === 'GET') {
            config.params = params;
        }

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.data = data;
        }

        console.log(`🔗 调用后端API: ${method} ${config.url}`, params ? { params } : {});
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error('❌ 后端API调用失败:', error.message);
        if (error.response) {
            console.error('❌ 后端API错误响应:', error.response.data);
            throw new Error(error.response.data?.message || '后端API调用失败');
        }
        throw error;
    }
} 