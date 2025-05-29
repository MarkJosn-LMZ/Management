const express = require('express');
const path = require('path');
const cors = require('cors');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const app = express();
const PORT = process.env.ADMIN_PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 文件上传中间件
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB限制
    abortOnLimit: true,
    responseOnLimit: '文件太大，最大支持50MB'
}));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// API路由
app.use('/api/admin', require('./routes/admin-panel'));

// 特殊页面路由
app.get('/test-sdk-parser.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-sdk-parser.html'));
});

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '页面不存在'
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err.message : '服务器错误'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 PetMeet 管理面板服务器运行在 http://localhost:${PORT}`);
    console.log(`📊 管理面板地址: http://localhost:${PORT}`);
    console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
}); 