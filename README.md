# PetMeet 管理面板

一个现代化的PetMeet后端管理面板，使用TailwindCSS构建，提供完整的用户、帖文、AI模型管理功能。

## 功能特性

### 🎯 核心功能
- **用户管理**: 完整的用户CRUD操作，支持搜索和状态管理
- **帖文管理**: 帖文的创建、编辑、删除和状态管理
- **AI模型管理**: AI模型的配置、测试和管理
- **AI生成工具**: 使用AI模型批量生成用户和帖文
- **数据统计**: 实时显示系统数据统计

### 🔐 安全特性
- JWT Token认证
- 基于OpenID的用户验证
- API接口权限保护
- 安全的会话管理

### 🎨 界面特性
- 现代简约的白色主题设计
- 响应式布局，支持移动端
- 直观的操作界面
- 实时数据更新

## 技术栈

- **前端**: HTML5, TailwindCSS, Alpine.js
- **后端**: Node.js, Express.js
- **数据库**: 腾讯云CloudBase
- **认证**: JWT (JSON Web Tokens)

## 安装和部署

### 1. 安装依赖

```bash
cd admin-panel
npm install
```

### 2. 环境配置

创建 `.env` 文件：

```env
# 管理面板端口
ADMIN_PORT=3001

# JWT密钥
JWT_SECRET=your-jwt-secret-key

# 腾讯云配置（继承主项目配置）
CLOUDBASE_ENV_ID=your-env-id
CLOUDBASE_SECRET_ID=your-secret-id
CLOUDBASE_SECRET_KEY=your-secret-key
```

### 3. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 4. 访问管理面板

打开浏览器访问: `http://localhost:3001`

## 使用指南

### 登录管理面板

1. 访问管理面板地址
2. 输入有效的PetMeet ID
3. 可选输入昵称
4. 点击登录按钮

### 用户管理

- **查看用户**: 在用户管理页面查看所有用户列表
- **搜索用户**: 使用搜索框按昵称、ID或OpenID搜索
- **添加用户**: 点击"添加用户"按钮创建新用户
- **编辑用户**: 点击用户行的"编辑"按钮修改用户信息
- **删除用户**: 点击"删除"按钮移除用户（需确认）

### 帖文管理

- **查看帖文**: 浏览所有帖文列表
- **搜索帖文**: 按标题、内容或作者搜索帖文
- **创建帖文**: 添加新的帖文内容
- **编辑帖文**: 修改现有帖文
- **删除帖文**: 移除不需要的帖文

### AI模型管理

- **查看模型**: 查看所有配置的AI模型
- **添加模型**: 配置新的AI模型
- **测试模型**: 测试AI模型的连接和响应
- **编辑模型**: 修改模型配置
- **删除模型**: 移除不需要的模型

### AI生成工具

#### 生成用户
1. 选择要使用的AI模型
2. 设置生成数量（1-50）
3. 点击"生成用户"按钮
4. 查看生成结果和历史记录

#### 生成帖文
1. 选择AI模型
2. 设置生成数量
3. 可选输入主题关键词
4. 点击"生成帖文"按钮
5. 查看生成的帖文内容

## API接口

### 认证接口

```
POST /api/admin/auth/login     # 管理员登录
GET  /api/admin/auth/validate  # 验证Token
```

### 用户管理接口

```
GET    /api/admin/users        # 获取用户列表
GET    /api/admin/users/:id    # 获取用户详情
POST   /api/admin/users        # 创建用户
PUT    /api/admin/users/:id    # 更新用户
DELETE /api/admin/users/:id    # 删除用户
```

### 帖文管理接口

```
GET    /api/admin/posts        # 获取帖文列表
POST   /api/admin/posts        # 创建帖文
PUT    /api/admin/posts/:id    # 更新帖文
DELETE /api/admin/posts/:id    # 删除帖文
```

### AI模型管理接口

```
GET    /api/admin/ai-models        # 获取AI模型列表
POST   /api/admin/ai-models        # 创建AI模型
PUT    /api/admin/ai-models/:id    # 更新AI模型
DELETE /api/admin/ai-models/:id    # 删除AI模型
POST   /api/admin/ai-models/:id/test # 测试AI模型
```

### AI生成接口

```
POST /api/admin/generate/users  # AI生成用户
POST /api/admin/generate/posts  # AI生成帖文
```

## 数据库集合

管理面板操作以下数据库集合：

- `user_profile`: 用户信息
- `ai_post`: 社区帖子
- `AI_Model`: AI模型配置
- `ai_comment`: 帖子评论

## 安全注意事项

1. **JWT密钥**: 确保使用强密钥并定期更换
2. **HTTPS**: 生产环境建议使用HTTPS
3. **访问控制**: 限制管理面板的访问IP
4. **数据备份**: 定期备份重要数据
5. **日志监控**: 监控异常访问和操作

## 开发和扩展

### 添加新功能

1. 在 `routes/admin-panel.js` 中添加新的API路由
2. 在 `public/js/admin.js` 中添加前端逻辑
3. 在 `public/index.html` 中添加UI界面

### 自定义样式

管理面板使用TailwindCSS，可以通过修改HTML类名来自定义样式。

### 集成新的AI模型

1. 在AI模型管理中添加新模型配置
2. 在生成功能中实现对应的API调用逻辑
3. 测试模型的连接和响应

## 故障排除

### 常见问题

1. **登录失败**: 检查PetMeet ID是否存在于用户数据库中
2. **Token过期**: 重新登录获取新的Token
3. **数据加载失败**: 检查数据库连接和权限配置
4. **AI生成失败**: 验证AI模型配置和网络连接

### 日志查看

服务器日志会显示详细的错误信息，帮助诊断问题：

```bash
# 查看实时日志
npm run dev

# 查看生产日志
pm2 logs admin-panel
```

## 更新日志

### v1.0.0
- 初始版本发布
- 完整的用户、帖文、AI模型管理功能
- JWT认证系统
- AI生成工具
- 响应式界面设计

## 支持和反馈

如有问题或建议，请联系开发团队或提交Issue。

---

**PetMeet Team** - 致力于打造最好的宠物社区管理工具 