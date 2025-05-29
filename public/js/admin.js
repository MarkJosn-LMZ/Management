// PetMeet 管理面板 JavaScript
function adminPanel() {
    return {
        // 当前视图
        currentView: 'dashboard',
        
        // 加载状态
        loading: false,
        
        // 数据
        users: [],
        posts: [],
        aiModels: [],
        comments: [],
        
        // 搜索
        userSearch: '',
        postSearch: '',
        
        // 统计数据
        stats: {
            totalUsers: 0,
            totalPosts: 0,
            totalAIModels: 0,
            totalComments: 0
        },
        
        // 模态框状态
        showUserModal: false,
        showPostModal: false,
        showAIModelModal: false,
        
        // 表单数据
        userForm: {
            nickName: '',
            avatarUrl: '',
            status: 'active',
            bio: '',
            gender: '',
            city: '',
            province: '',
            country: '中国',
            language: 'zh_CN',
            birthday: '',
            PetMeetID: '',
            _openid: '',
            level: 1,
            experience: 0,
            isAIGenerated: false,
            aiModel: ''
        },
        postForm: {
            title: '',
            content: '',
            longPost: '',
            authorId: '',
            topics: [],
            location: null,
            permission: 'public',
            contentType: 'standard',
            status: 'approved',
            images: [],
            category: '管理员创建',
            breedingRequirements: {
                size: 'any',
                breed: '',
                vaccine: 'any',
                age: 'any',
                additional: ''
            }
        },
        aiModelForm: {
            name: '',
            description: '',
            version: '1.0',
            status: 'active',
            apiKey: '',
            endpoint: '',
            type: 'text',
            provider: '',
            model: '',
            baseURL: '',
            config: {
                max_tokens: 4000,
                supportsStreaming: true,
                supportsThinking: false,
                temperature: 0.7
            }
        },
        
        // 编辑状态
        editingUser: null,
        editingPost: null,
        editingAIModel: null,
        
        // AI生成相关
        selectedAIModel: '',
        selectedAIModelForPosts: '',
        selectedPostAuthor: '', // 选择的帖文作者
        selectedImageModel: '', // 选择的图像模型
        userGenerationCount: 5,
        postGenerationCount: 10,
        postTopic: '',
        enableImageGeneration: false, // 是否启用AI图像生成
        imageModels: [], // 可用的图像模型列表
        
        // AI生成用户预览功能
        showUserPreview: false, // 是否显示详细预览的开关
        previewUsers: [], // 预览中的用户数据
        
        // AI生成帖文预览功能
        showPostPreview: false, // 是否显示帖文预览的开关
        previewPosts: [], // 预览中的帖文数据
        
        // API基础URL
        apiBase: '/api/admin',
        
        // SDK代码解析相关
        sdkCode: '',
        availableApiKeys: [],
        selectedApiKey: '',
        parsedModelInfo: null,
        showCodeParser: false,
        
        // 虚拟用户列表（只包含AI生成的用户）
        virtualUsers: [],
        
        // 当前编辑用户的宠物列表
        currentUserPets: [],
        
        // 宠物信息表单
        petForm: {
            name: '',
            category: '',
            breed: '',
            age: '',
            gender: '',
            weight: '',
            birthDate: '',
            description: '',
            vaccinated: false,
            neutered: false
        },
        
        // 宠物管理相关状态
        showPetModal: false,
        editingPet: null,
        loadingPets: false,
        
        // 获取认证头
        getAuthHeaders() {
            const token = localStorage.getItem('adminToken');
            return {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
        },
        
        // 初始化
        async init() {
            await this.loadAllData();
            await this.loadVirtualUsers(); // 加载虚拟用户
        },
        
        // 获取视图标题
        getViewTitle() {
            const titles = {
                'dashboard': '仪表板',
                'users': '用户管理',
                'posts': '帖文管理',
                'ai-models': 'AI模型管理',
                'ai-generation': 'AI生成工具'
            };
            return titles[this.currentView] || '管理面板';
        },
        
        // 加载所有数据
        async loadAllData() {
            this.loading = true;
            try {
                await Promise.all([
                    this.loadUsers(),
                    this.loadPosts(),
                    this.loadAIModels(),
                    this.loadComments()
                ]);
                this.updateStats();
            } catch (error) {
                console.error('加载数据失败:', error);
                this.showNotification('加载数据失败', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        // 加载用户数据
        async loadUsers() {
            try {
                const response = await fetch(`${this.apiBase}/users`, {
                    headers: this.getAuthHeaders()
                });
                const result = await response.json();
                if (result.success) {
                    this.users = result.data;
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('加载用户失败:', error);
                throw error;
            }
        },
        
        // 加载帖文数据
        async loadPosts() {
            try {
                const response = await fetch(`${this.apiBase}/posts`, {
                    headers: this.getAuthHeaders()
                });
                const result = await response.json();
                if (result.success) {
                    this.posts = result.data;
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('加载帖文失败:', error);
                throw error;
            }
        },
        
        // 加载AI模型数据
        async loadAIModels() {
            try {
                const response = await fetch(`${this.apiBase}/ai-models`, {
                    headers: this.getAuthHeaders()
                });
                const result = await response.json();
                
                if (result.success) {
                    // 修正：后端返回的数据结构是 { data: { models: [...] } }
                    this.aiModels = result.data.models || result.data || [];
                    
                    // 筛选图像模型 - 修复字段名匹配问题
                    this.imageModels = this.aiModels.filter(model => {
                        const isImageType = model.type === 'image';
                        const isActive = model.isActive === true || model.status === 'active';
                        const hasApiKey = model.apiKey && model.apiKey !== '未设置' && model.apiKey.trim() !== '';
                        
                        console.log(`筛选图像模型 ${model.name}:`, {
                            类型: model.type,
                            是图像模型: isImageType,
                            激活状态: model.isActive,
                            状态字段: model.status,
                            已激活: isActive,
                            API密钥: model.apiKey ? `${model.apiKey.substring(0, 10)}...` : '无',
                            有API密钥: hasApiKey
                        });
                        
                        return isImageType && isActive && hasApiKey;
                    });
                    
                    console.log('📋 加载AI模型成功:', {
                        总数: this.aiModels.length,
                        图像模型: this.imageModels.length,
                        图像模型列表: this.imageModels.map(m => ({ name: m.name, id: m._id }))
                    });
                } else {
                    this.showMessage('加载AI模型失败: ' + result.message, 'error');
                }
            } catch (error) {
                console.error('加载AI模型失败:', error);
                this.showMessage('加载AI模型失败', 'error');
            }
        },
        
        // 加载评论数据
        async loadComments() {
            try {
                const response = await fetch(`${this.apiBase}/comments`, {
                    headers: this.getAuthHeaders()
                });
                const result = await response.json();
                if (result.success) {
                    this.comments = result.data;
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('加载评论失败:', error);
                throw error;
            }
        },
        
        // 加载虚拟用户（只包含AI生成的用户）
        async loadVirtualUsers() {
            try {
                const response = await fetch(`${this.apiBase}/virtual-users`, {
                    headers: this.getAuthHeaders()
                });
                const result = await response.json();
                if (result.success) {
                    this.virtualUsers = result.data;
                    console.log('✅ 加载虚拟用户:', this.virtualUsers.length, '个');
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('加载虚拟用户失败:', error);
                // 如果加载失败，使用现有用户中的AI生成用户
                this.virtualUsers = this.users.filter(user => user.hasOwnProperty('isAIGenerated'));
            }
        },
        
        // 更新统计数据
        updateStats() {
            this.stats = {
                totalUsers: this.users.length,
                totalPosts: this.posts.length,
                totalAIModels: this.aiModels.length,
                totalComments: this.comments.length
            };
        },
        
        // 过滤用户
        get filteredUsers() {
            if (!this.userSearch) return this.users;
            return this.users.filter(user => 
                user.nickName?.toLowerCase().includes(this.userSearch.toLowerCase()) ||
                user.PetMeetID?.toLowerCase().includes(this.userSearch.toLowerCase()) ||
                user._openid?.toLowerCase().includes(this.userSearch.toLowerCase())
            );
        },
        
        // 过滤帖文
        get filteredPosts() {
            let filtered = this.posts;
            
            // 应用搜索过滤
            if (this.postSearch) {
                filtered = filtered.filter(post => 
                    post.title?.toLowerCase().includes(this.postSearch.toLowerCase()) ||
                    post.content?.toLowerCase().includes(this.postSearch.toLowerCase()) ||
                    post.authorName?.toLowerCase().includes(this.postSearch.toLowerCase())
                );
            }
            
            // 按时间倒序排序，确保最新帖文显示在最前面
            return filtered.sort((a, b) => {
                // 优先使用 createdAt，然后 createTime，最后 _createTime
                const getTime = (post) => {
                    const timeStr = post.createdAt || post.createTime || post._createTime;
                    if (!timeStr) return 0;
                    return new Date(timeStr).getTime();
                };
                
                const timeA = getTime(a);
                const timeB = getTime(b);
                
                // 倒序排序：时间越晚的排在前面
                return timeB - timeA;
            });
        },
        
        // 用户管理方法
        openUserModal(user = null) {
            this.editingUser = user;
            if (user) {
                // 编辑模式：加载现有数据，确保所有字段都有默认值
                this.userForm = {
                    nickName: user.nickName || '',
                    avatarUrl: user.avatarUrl || '',
                    status: user.status || 'active',
                    bio: user.bio || '',
                    gender: user.gender || '',
                    city: user.city || '',
                    province: user.province || '',
                    country: user.country || '中国',
                    language: user.language || 'zh_CN',
                    birthday: user.birthday || '',
                    PetMeetID: user.PetMeetID || '',
                    _openid: user._openid || '',
                    level: user.level || 1,
                    experience: user.experience || 0,
                    isAIGenerated: user.isAIGenerated || false,
                    aiModel: user.aiModel || ''
                };
                
                // 加载用户的宠物信息
                this.loadUserPets(user._id);
            } else {
                // 新建模式：初始化空表单
                this.userForm = {
                    nickName: '',
                    avatarUrl: '',
                    status: 'active',
                    bio: '',
                    gender: '',
                    city: '',
                    province: '',
                    country: '中国',
                    language: 'zh_CN',
                    birthday: '',
                    PetMeetID: '',
                    _openid: '',
                    level: 1,
                    experience: 0,
                    isAIGenerated: false,
                    aiModel: ''
                };
                
                // 清空宠物列表
                this.currentUserPets = [];
            }
            this.showUserModal = true;
        },
        
        closeUserModal() {
            this.showUserModal = false;
            this.editingUser = null;
        },
        
        async saveUser() {
            this.loading = true;
            try {
                const url = this.editingUser 
                    ? `${this.apiBase}/users/${this.editingUser._id}`
                    : `${this.apiBase}/users`;
                
                const method = this.editingUser ? 'PUT' : 'POST';
                
                // 创建提交数据，不包含宠物信息
                const submitData = { ...this.userForm };
                
                const response = await fetch(url, {
                    method,
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify(submitData)
                });
                
                const result = await response.json();
                if (result.success) {
                    await this.loadUsers();
                    this.updateStats();
                    this.closeUserModal();
                    this.showNotification(
                        this.editingUser ? '用户更新成功' : '用户创建成功', 
                        'success'
                    );
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('保存用户失败:', error);
                this.showNotification('保存用户失败: ' + error.message, 'error');
            } finally {
                this.loading = false;
            }
        },
        
        editUser(user) {
            this.openUserModal(user);
        },
        
        async deleteUser(userId) {
            if (!confirm('确定要删除这个用户吗？')) return;
            
            this.loading = true;
            try {
                const response = await fetch(`${this.apiBase}/users/${userId}`, {
                    method: 'DELETE',
                    headers: this.getAuthHeaders()
                });
                
                const result = await response.json();
                if (result.success) {
                    await this.loadUsers();
                    this.updateStats();
                    this.showNotification('用户删除成功', 'success');
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('删除用户失败:', error);
                this.showNotification('删除用户失败: ' + error.message, 'error');
            } finally {
                this.loading = false;
            }
        },
        
        // 帖文管理方法
        openPostModal(post = null) {
            this.editingPost = post;
            if (post) {
                // 编辑模式：加载现有数据
                this.postForm = {
                    title: post.title || '',
                    content: post.content || '',
                    longPost: post.longPost || '',
                    authorId: post.authorId || '',
                    topics: post.topics || [],
                    location: post.location || null,
                    permission: post.permission || 'public',
                    contentType: post.contentType || 'standard',
                    status: post.status || 'approved',
                    images: post.images || [],
                    category: post.category || '管理员创建',
                    breedingRequirements: post.breedingRequirements || {
                        size: 'any',
                        breed: '',
                        vaccine: 'any',
                        age: 'any',
                        additional: ''
                    }
                };
            } else {
                // 新建模式：初始化空表单，确保包含所有字段
                this.postForm = {
                    title: '',
                    content: '',
                    longPost: '',
                    authorId: '',
                    topics: [],
                    location: null,
                    permission: 'public',
                    contentType: 'standard',
                    status: 'approved',
                    images: [],
                    category: '管理员创建',
                    breedingRequirements: {
                        size: 'any',
                        breed: '',
                        vaccine: 'any',
                        age: 'any',
                        additional: ''
                    }
                };
            }
            // 重置临时变量
            this.newPostTopic = '';
            this.postLocationSearch = '';
            this.showPostModal = true;
        },
        
        closePostModal() {
            this.showPostModal = false;
            this.editingPost = null;
        },
        
        // 新增话题管理方法
        newPostTopic: '',
        postLocationSearch: '',
        
        addPostTopic() {
            if (this.newPostTopic.trim() && !this.postForm.topics.includes(this.newPostTopic.trim())) {
                this.postForm.topics.push(this.newPostTopic.trim());
                this.newPostTopic = '';
            }
        },
        
        removePostTopic(index) {
            this.postForm.topics.splice(index, 1);
        },
        
        // 搜索位置 - 使用后端API代替前端模拟
        async searchPostLocation() {
            if (!this.postLocationSearch.trim()) return;
            
            try {
                this.loading = true;
                console.log('🗺️ 搜索位置:', this.postLocationSearch);
                
                // 调用管理面板的地理编码代理API
                const response = await fetch(`${this.apiBase}/geocode/search?query=${encodeURIComponent(this.postLocationSearch)}`, {
                    headers: this.getAuthHeaders()
                });
                
                const result = await response.json();
                
                if (result.success && result.data) {
                    // 使用后端返回的真实地理编码数据
                    this.postForm.location = {
                        name: this.postLocationSearch.trim(),
                        address: result.data.address || this.postLocationSearch.trim(),
                        latitude: result.data.latitude || null,
                        longitude: result.data.longitude || null,
                        city: result.data.city || null,
                        district: result.data.district || null
                    };
                    this.postLocationSearch = '';
                    this.showNotification('位置设置成功', 'success');
                } else {
                    // 如果后端地理编码失败，使用基本信息
                    this.postForm.location = {
                        name: this.postLocationSearch.trim(),
                        address: this.postLocationSearch.trim(),
                        latitude: null,
                        longitude: null
                    };
                    this.postLocationSearch = '';
                    this.showNotification('位置设置成功（未获取到精确坐标）', 'success');
                }
            } catch (error) {
                console.error('搜索位置失败:', error);
                // 回退到基本模式
                this.postForm.location = {
                    name: this.postLocationSearch.trim(),
                    address: this.postLocationSearch.trim(),
                    latitude: null,
                    longitude: null
                };
                this.postLocationSearch = '';
                this.showNotification('位置设置成功（离线模式）', 'success');
            } finally {
                this.loading = false;
            }
        },
        
        removePostLocation() {
            this.postForm.location = null;
        },
        
        // 图片上传相关方法 - 使用后端API代替前端base64处理
        async handlePostImageUpload(event) {
            const files = Array.from(event.target.files);
            if (files.length === 0) return;
            
            // 检查图片数量限制
            if (this.postForm.images.length + files.length > 9) {
                this.showNotification('最多只能上传9张图片', 'error');
                return;
            }
            
            this.loading = true;
            try {
                const uploadPromises = files.map(file => this.uploadPostImage(file));
                const results = await Promise.all(uploadPromises);
                
                // 添加成功上传的图片URL
                const successfulUploads = results.filter(result => result && result.url);
                this.postForm.images.push(...successfulUploads.map(result => result.url));
                
                this.showNotification(`成功上传${successfulUploads.length}张图片`, 'success');
            } catch (error) {
                console.error('上传图片失败:', error);
                this.showNotification('上传图片失败', 'error');
            } finally {
                this.loading = false;
            }
        },
        
        async uploadPostImage(file) {
            try {
                console.log('📸 开始上传图片:', file.name);
                
                // 检查文件类型
                if (!file.type.startsWith('image/')) {
                    throw new Error('只能上传图片文件');
                }
                
                // 检查文件大小 (5MB限制)
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error('图片文件不能超过5MB');
                }
                
                // 创建FormData
                const formData = new FormData();
                formData.append('file', file);
                
                // 调用管理面板的文件上传代理API
                const response = await fetch(`${this.apiBase}/upload/post-image`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                        // 注意：不要设置Content-Type，让浏览器自动设置multipart/form-data
                    },
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    console.log('✅ 图片上传成功:', result.url);
                    return {
                        url: result.url,
                        fileID: result.fileID
                    };
                } else {
                    throw new Error(result.message || '上传失败');
                }
            } catch (error) {
                console.error('❌ 图片上传失败:', error);
                this.showNotification(`图片上传失败: ${error.message}`, 'error');
                return null;
            }
        },
        
        removePostImage(index) {
            this.postForm.images.splice(index, 1);
            // 确保移除空字符串、base64图片和无效URL
            this.postForm.images = this.postForm.images.filter(imageUrl => {
                if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
                    return false;
                }
                
                // 拒绝base64格式的图片
                if (imageUrl.trim().startsWith('data:image/')) {
                    this.showNotification('不支持base64格式的图片，请使用图片URL', 'error');
                    return false;
                }
                
                return true;
            });
        },
        
        previewPostImage(imageUrl) {
            // 检查图片URL是否有效
            if (!imageUrl || imageUrl.trim() === '') {
                this.showNotification('图片链接无效', 'error');
                return;
            }
            
            // 检查是否是base64格式
            if (imageUrl.trim().startsWith('data:image/')) {
                this.showNotification('base64格式图片无法预览，请使用图片URL', 'error');
                return;
            }
            
            window.open(imageUrl, '_blank');
        },
        
        async savePost() {
            this.loading = true;
            try {
                // 在提交前过滤掉无效的图片URL，包括base64图片
                const filteredImages = this.postForm.images.filter(imageUrl => {
                    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
                        return false;
                    }
                    
                    const trimmedUrl = imageUrl.trim();
                    
                    // 拒绝base64格式的图片
                    if (trimmedUrl.startsWith('data:image/')) {
                        console.warn('拒绝保存base64格式图片:', trimmedUrl.substring(0, 50) + '...');
                        return false;
                    }
                    
                    // 检查是否是有效的HTTP/HTTPS URL
                    try {
                        const url = new URL(trimmedUrl);
                        return url.protocol === 'http:' || url.protocol === 'https:';
                    } catch (error) {
                        console.warn('无效的图片URL:', trimmedUrl);
                        return false;
                    }
                });
                
                // 如果原来有图片但过滤后没有了，提示用户
                if (this.postForm.images.length > 0 && filteredImages.length === 0) {
                    this.showNotification('检测到无效的图片格式（如base64），已自动移除。请使用有效的图片URL。', 'warning');
                }
                
                // 创建提交数据，使用过滤后的图片
                const submitData = {
                    ...this.postForm,
                    images: filteredImages
                };
                
                const url = this.editingPost 
                    ? `${this.apiBase}/posts/${this.editingPost._id}`
                    : `${this.apiBase}/posts`;
                
                const method = this.editingPost ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method,
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify(submitData)
                });
                
                const result = await response.json();
                if (result.success) {
                    await this.loadPosts();
                    this.updateStats();
                    this.closePostModal();
                    this.showNotification(
                        this.editingPost ? '帖文更新成功' : '帖文创建成功', 
                        'success'
                    );
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('保存帖文失败:', error);
                this.showNotification('保存帖文失败: ' + error.message, 'error');
            } finally {
                this.loading = false;
            }
        },
        
        editPost(post) {
            this.openPostModal(post);
        },
        
        async deletePost(postId) {
            if (!confirm('确定要删除这个帖文吗？')) return;
            
            this.loading = true;
            try {
                const response = await fetch(`${this.apiBase}/posts/${postId}`, {
                    method: 'DELETE',
                    headers: this.getAuthHeaders()
                });
                
                const result = await response.json();
                if (result.success) {
                    await this.loadPosts();
                    this.updateStats();
                    this.showNotification('帖文删除成功', 'success');
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('删除帖文失败:', error);
                this.showNotification('删除帖文失败: ' + error.message, 'error');
            } finally {
                this.loading = false;
            }
        },
        
        // AI模型管理方法
        async openAIModelModal(model = null) {
            this.editingAIModel = model;
            
            if (model) {
                // 编辑模式：从后端获取完整的模型信息
                this.loading = true;
                try {
                    console.log('📋 获取模型详情用于编辑:', model._id);
                    
                    const response = await fetch(`${this.apiBase}/ai-models/${model._id}`, {
                        headers: this.getAuthHeaders()
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        const fullModel = result.data;
                        
                        console.log('🔍 从后端获取的完整模型数据:', fullModel);
                        
                        this.aiModelForm = {
                            name: fullModel.name || '',
                            description: fullModel.description || '',
                            version: fullModel.version || '1.0',
                            status: fullModel.status || 'active',
                            apiKey: fullModel.apiKey || '',
                            endpoint: fullModel.endpoint || fullModel.baseURL || '',
                            type: fullModel.type || 'text',
                            provider: fullModel.provider || '',
                            model: fullModel.model || '',
                            baseURL: fullModel.baseURL || fullModel.endpoint || '',
                            config: {
                                max_tokens: 4000,
                                supportsStreaming: false,
                                supportsThinking: false,
                                temperature: 0.7,
                                ...(fullModel.config || {})
                            }
                        };
                        
                        console.log('🔍 设置到表单的数据:', this.aiModelForm);
                        console.log('🔍 关键字段检查:', {
                            type: this.aiModelForm.type,
                            provider: this.aiModelForm.provider,
                            model: this.aiModelForm.model,
                            baseURL: this.aiModelForm.baseURL,
                            apiKey: this.aiModelForm.apiKey ? `${this.aiModelForm.apiKey.substring(0, 10)}...` : '无'
                        });
                        
                        console.log('✅ 成功加载模型详情:', {
                            name: this.aiModelForm.name,
                            type: this.aiModelForm.type,
                            provider: this.aiModelForm.provider,
                            hasApiKey: !!this.aiModelForm.apiKey,
                            hasBaseURL: !!this.aiModelForm.baseURL
                        });
                    } else {
                        throw new Error(result.message);
                    }
                } catch (error) {
                    console.error('获取模型详情失败:', error);
                    this.showNotification('获取模型详情失败: ' + error.message, 'error');
                    
                    // 如果获取失败，使用列表中的数据作为备选
                    this.aiModelForm = { 
                        ...model,
                        // 确保必要字段存在
                        type: model.type || 'text',
                        provider: model.provider || '',
                        model: model.model || '',
                        baseURL: model.baseURL || model.endpoint || '',
                        config: {
                            max_tokens: 4000,
                            supportsStreaming: false,
                            supportsThinking: false,
                            temperature: 0.7,
                            ...(model.config || {})
                        }
                    };
                } finally {
                    this.loading = false;
                }
            } else {
                // 新建模式：使用默认值
                this.aiModelForm = {
                    name: '',
                    description: '',
                    version: '1.0',
                    status: 'active',
                    apiKey: '',
                    endpoint: '',
                    type: 'text',
                    provider: '',
                    model: '',
                    baseURL: '',
                    config: {
                        max_tokens: 4000,
                        supportsStreaming: true,
                        supportsThinking: false,
                        temperature: 0.7
                    }
                };
            }
            
            this.showCodeParser = false;
            this.sdkCode = '';
            this.parsedModelInfo = null;
            this.loadAvailableApiKeys();
            this.showAIModelModal = true;
        },
        
        closeAIModelModal() {
            this.showAIModelModal = false;
            this.editingAIModel = null;
            this.showCodeParser = false;
            this.sdkCode = '';
            this.parsedModelInfo = null;
            this.selectedApiKey = '';
        },
        
        async saveAIModel() {
            this.loading = true;
            try {
                // 验证必填字段
                if (!this.aiModelForm.name || !this.aiModelForm.model || !this.aiModelForm.baseURL) {
                    throw new Error('请填写模型名称、模型标识和API地址');
                }

                const url = this.editingAIModel 
                    ? `${this.apiBase}/ai-models/${this.editingAIModel._id}`
                    : `${this.apiBase}/ai-models`;
                
                const method = this.editingAIModel ? 'PUT' : 'POST';
                
                // 构建提交数据
                const submitData = {
                    ...this.aiModelForm,
                    // 确保config对象存在
                    config: {
                        max_tokens: 4000,
                        supportsStreaming: true,
                        supportsThinking: false,
                        temperature: 0.7,
                        ...this.aiModelForm.config
                    }
                };

                console.log('提交AI模型数据:', submitData);
                
                const response = await fetch(url, {
                    method,
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify(submitData)
                });
                
                const result = await response.json();
                if (result.success) {
                    await this.loadAIModels();
                    this.updateStats();
                    this.closeAIModelModal();
                    this.showNotification(
                        this.editingAIModel ? 'AI模型更新成功' : 'AI模型创建成功', 
                        'success'
                    );
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('保存AI模型失败:', error);
                this.showNotification('保存AI模型失败: ' + error.message, 'error');
            } finally {
                this.loading = false;
            }
        },
        
        editAIModel(model) {
            this.openAIModelModal(model);
        },
        
        async deleteAIModel(modelId) {
            if (!confirm('确定要删除这个AI模型吗？')) return;
            
            this.loading = true;
            try {
                const response = await fetch(`${this.apiBase}/ai-models/${modelId}`, {
                    method: 'DELETE',
                    headers: this.getAuthHeaders()
                });
                
                const result = await response.json();
                if (result.success) {
                    await this.loadAIModels();
                    this.updateStats();
                    this.showNotification('AI模型删除成功', 'success');
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('删除AI模型失败:', error);
                this.showNotification('删除AI模型失败: ' + error.message, 'error');
            } finally {
                this.loading = false;
            }
        },
        
        // 测试单个AI模型
        async testAIModel(model) {
            if (!model || !model._id) return;
            
            this.loading = true;
            try {
                const response = await fetch(`${this.apiBase}/ai-models/${model._id}/test`, {
                    method: 'POST',
                    headers: this.getAuthHeaders()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    let message = `✅ ${result.message}\n响应时间: ${result.data.responseTime}ms`;
                    
                    // 根据模型类型显示不同的结果
                    if (result.data.modelType === 'image') {
                        message += `\n生成图片: ${result.data.imageUrl ? '成功' : '失败'}`;
                        message += `\n测试提示词: ${result.data.prompt}`;
                        
                        // 如果有图片URL，询问是否查看
                        if (result.data.imageUrl) {
                            const viewImage = confirm(message + '\n\n是否查看生成的测试图片？');
                            if (viewImage) {
                                window.open(result.data.imageUrl, '_blank');
                            }
                        } else {
                            this.showNotification(message, 'success');
                        }
                    } else {
                        message += `\nAI响应: ${result.data.response}`;
                        this.showNotification(message, 'success');
                    }
                    
                    // 重新加载模型列表以更新测试状态
                    await this.loadAIModels();
                } else {
                    this.showNotification(`❌ 测试失败: ${result.message}`, 'error');
                }
            } catch (error) {
                console.error('测试AI模型失败:', error);
                this.showNotification(`❌ 测试失败: ${error.message}`, 'error');
            } finally {
                this.loading = false;
            }
        },

        // 一键测试所有AI模型
        async testAllAIModels() {
            if (!confirm('确定要测试所有AI模型吗？这可能需要一些时间。')) return;
            
            this.loading = true;
            const totalModels = this.aiModels.length;
            let successCount = 0;
            let failedModels = [];
            
            try {
                console.log(`🧪 开始批量测试 ${totalModels} 个AI模型`);
                
                for (let i = 0; i < this.aiModels.length; i++) {
                    const model = this.aiModels[i];
                    console.log(`测试进度: ${i + 1}/${totalModels} - ${model.name}`);
                    
                    try {
                        const response = await fetch(`${this.apiBase}/ai-models/${model._id}/test`, {
                            method: 'POST',
                            headers: this.getAuthHeaders()
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            successCount++;
                            console.log(`✅ ${model.name} 测试成功`);
                        } else {
                            failedModels.push({
                                model: model,
                                error: result.message
                            });
                            console.log(`❌ ${model.name} 测试失败: ${result.message}`);
                        }
                    } catch (error) {
                        failedModels.push({
                            model: model,
                            error: error.message
                        });
                        console.log(`❌ ${model.name} 测试失败: ${error.message}`);
                    }
                    
                    // 每测试一个模型后稍微延迟，避免API请求过于频繁
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                // 刷新AI模型列表
                await this.loadAIModels();
                
                // 显示测试结果
                const failedCount = failedModels.length;
                let message = `批量测试完成！成功：${successCount}个，失败：${failedCount}个`;
                
                if (failedCount > 0) {
                    // 询问是否删除失败的模型
                    if (confirm(`${message}\n\n检测到 ${failedCount} 个无法连通的AI模型，是否自动删除？`)) {
                        await this.deleteFailedModels(failedModels);
                    }
                } else {
                    this.showNotification(message, 'success');
                }
                
            } catch (error) {
                console.error('批量测试AI模型失败:', error);
                this.showNotification('批量测试失败: ' + error.message, 'error');
            } finally {
                this.loading = false;
            }
        },

        // 删除失败的AI模型
        async deleteFailedModels(failedModels) {
            let deletedCount = 0;
            
            try {
                for (const failedModel of failedModels) {
                    try {
                        const response = await fetch(`${this.apiBase}/ai-models/${failedModel.model._id}`, {
                            method: 'DELETE',
                            headers: this.getAuthHeaders()
                        });
                        
                        const result = await response.json();
                        if (result.success) {
                            deletedCount++;
                            console.log(`🗑️ 已删除无效模型: ${failedModel.model.name}`);
                        }
                    } catch (error) {
                        console.error(`删除模型 ${failedModel.model.name} 失败:`, error);
                    }
                    
                    // 删除间隔
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
                
                // 刷新列表
                await this.loadAIModels();
                this.updateStats();
                
                this.showNotification(`已自动删除 ${deletedCount} 个无效的AI模型`, 'success');
                
            } catch (error) {
                console.error('删除失败模型出错:', error);
                this.showNotification('删除失败模型时出错: ' + error.message, 'error');
            }
        },
        
        // AI生成用户
        async generateUsers() {
            if (!this.selectedAIModel || this.userGenerationCount < 1) return;
            
            this.loading = true;
            try {
                const response = await fetch(`${this.apiBase}/generate/users`, {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({
                        modelId: this.selectedAIModel,
                        count: this.userGenerationCount,
                        previewOnly: this.showUserPreview
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    if (this.showUserPreview) {
                        // 显示预览模式
                        this.previewUsers = result.data.generatedUsers || [];
                        this.showPreviewModal = true;
                        this.showNotification(`成功生成 ${this.previewUsers.length} 个用户预览，请检查后保存`, 'success');
                    } else {
                        // 直接保存模式
                        await this.loadUsers();
                        this.updateStats();
                        this.showNotification(`成功生成并保存 ${result.data.count} 个用户`, 'success');
                    }
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('生成用户失败:', error);
                this.showNotification('生成用户失败: ' + error.message, 'error');
            } finally {
                this.loading = false;
            }
        },
        
        // AI生成帖文
        async generatePosts() {
            if (!this.selectedAIModelForPosts || this.postGenerationCount < 1) return;
            
            this.loading = true;
            try {
                const response = await fetch(`${this.apiBase}/generate/posts`, {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({
                        modelId: this.selectedAIModelForPosts,
                        count: this.postGenerationCount,
                        topic: this.postTopic,
                        authorId: this.selectedPostAuthor,
                        previewOnly: this.showPostPreview,
                        enableImageGeneration: this.enableImageGeneration,
                        selectedImageModel: this.selectedImageModel
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    const { data } = result;
                    const imageInfo = data.imageGenerationEnabled ? 
                        `，其中${data.imagesGenerated || 0}个包含AI生成图片` : '';
                    
                    if (this.showPostPreview) {
                        // 显示预览模式
                        this.previewPosts = data.generatedPosts || [];
                        this.showNotification(`成功生成 ${this.previewPosts.length} 个帖文预览${imageInfo}，请检查后保存`, 'success');
                    } else {
                        // 直接保存模式
                        await this.loadPosts();
                        this.updateStats();
                        this.showNotification(`成功生成并保存 ${data.count} 个帖文${imageInfo}`, 'success');
                    }
                    
                    // 如果启用了图像生成，显示额外信息
                    if (data.imageGenerationEnabled) {
                        console.log('🎨 图像生成统计:', {
                            总帖文数: data.count,
                            包含图片的帖文: data.imagesGenerated,
                            使用的图像模型: data.imageModelUsed
                        });
                    }
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('生成帖文失败:', error);
                this.showNotification('生成帖文失败: ' + error.message, 'error');
            } finally {
                this.loading = false;
            }
        },
        
        // 工具方法
        formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN');
        },
        
        // 显示通知
        showNotification(message, type = 'info') {
            // 创建通知元素
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
                type === 'error' ? 'bg-red-500 text-white' : 
                type === 'success' ? 'bg-green-500 text-white' : 
                'bg-blue-500 text-white'
            }`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            // 3秒后自动移除
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        },

        // 退出登录
        logout() {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = '/login.html';
        },

        // 加载可用的API Keys（环境变量）
        async loadAvailableApiKeys() {
            try {
                const response = await fetch(`${this.apiBase}/env/api-keys`, {
                    headers: this.getAuthHeaders()
                });
                const result = await response.json();
                
                if (result.success) {
                    this.availableApiKeys = result.data;
                    console.log('✅ 加载可用API密钥:', this.availableApiKeys);
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('获取API密钥列表失败:', error);
                // 回退到本地数据
                this.availableApiKeys = [
                    { name: 'TENCENT_AI_API_KEY', description: '腾讯云AI API密钥', hasValue: false },
                    { name: 'DEEP_SEEK_API_KEY', description: 'DeepSeek API密钥', hasValue: false },
                    { name: 'DOU_BAO_API_KEY', description: '豆包(火山方舟) API密钥', hasValue: false }
                ];
            }
        },

        // 应用选择的API Key
        async applySelectedApiKey() {
            if (!this.selectedApiKey) {
                this.showNotification('请先选择一个API密钥', 'error');
                return;
            }

            this.loading = true;
            try {
                const response = await fetch(`${this.apiBase}/env/get-api-key`, {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({
                        keyName: this.selectedApiKey
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    this.aiModelForm.apiKey = result.data.keyValue;
                    this.showNotification(`已应用环境变量 ${this.selectedApiKey} (${result.data.preview})`, 'success');
                    console.log('✅ 成功应用API密钥:', result.data.preview);
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('应用API密钥失败:', error);
                this.showNotification('应用API密钥失败: ' + error.message, 'error');
            } finally {
                this.loading = false;
            }
        },

        // 解析SDK代码
        parseSDKCode() {
            if (!this.sdkCode.trim()) {
                this.showNotification('请输入SDK代码', 'error');
                return;
            }

            try {
                const parsed = this.extractModelInfoFromCode(this.sdkCode);
                if (parsed) {
                    this.parsedModelInfo = parsed;
                    this.fillFormFromParsedInfo(parsed);
                    this.showNotification('SDK代码解析成功！', 'success');
                } else {
                    this.showNotification('无法解析SDK代码，请检查格式', 'error');
                }
            } catch (error) {
                console.error('解析SDK代码失败:', error);
                this.showNotification('解析SDK代码失败: ' + error.message, 'error');
            }
        },

        // 从代码中提取模型信息
        extractModelInfoFromCode(code) {
            const result = {
                baseURL: '',
                model: '',
                apiKeyVar: '',
                provider: '',
                type: 'text',
                supportsStreaming: false,
                supportsThinking: false
            };

            // 清理代码，移除注释
            let cleanCode = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/#.*$/gm, '');

            // 提取baseURL或base_url
            const baseUrlPatterns = [
                /baseURL\s*:\s*["']([^"']+)["']/i,
                /base_url\s*=\s*["']([^"']+)["']/i,
                /baseURL\s*=\s*["']([^"']+)["']/i,
                /baseUrl\s*:\s*["']([^"']+)["']/i
            ];

            for (const pattern of baseUrlPatterns) {
                const match = cleanCode.match(pattern);
                if (match) {
                    result.baseURL = match[1];
                    break;
                }
            }

            // 提取model
            const modelPatterns = [
                /model\s*:\s*["']([^"']+)["']/i,
                /model\s*=\s*["']([^"']+)["']/i,
                /"model"\s*:\s*["']([^"']+)["']/i
            ];

            for (const pattern of modelPatterns) {
                const match = cleanCode.match(pattern);
                if (match) {
                    result.model = match[1];
                    break;
                }
            }

            // 提取API Key环境变量
            const apiKeyPatterns = [
                /apiKey\s*:\s*process\.env\.get\(["']([^"']+)["']\)/i,
                /api_key\s*=\s*os\.environ\.get\(["']([^"']+)["']\)/i,
                /apiKey\s*:\s*process\.env\[["']([^"']+)["']\]/i,
                /apiKey\s*:\s*["']([^"']+)["']/i, // 直接的API Key
                /api_key\s*=\s*["']([^"']+)["']/i
            ];

            for (const pattern of apiKeyPatterns) {
                const match = cleanCode.match(pattern);
                if (match) {
                    result.apiKeyVar = match[1];
                    break;
                }
            }

            // 检测流式传输支持
            result.supportsStreaming = /stream\s*:\s*true/i.test(cleanCode) || /stream\s*=\s*True/i.test(cleanCode);

            // 根据baseURL推断provider和其他信息
            if (result.baseURL) {
                result.provider = this.inferProviderFromURL(result.baseURL);
                result.supportsThinking = this.checkThinkingSupport(result.model, result.provider);
            }

            // 检测类型（文本/图像）
            if (result.model) {
                result.type = this.inferModelType(result.model);
            }

            return result.baseURL && result.model ? result : null;
        },

        // 根据URL推断提供商
        inferProviderFromURL(url) {
            if (url.includes('deepseek')) return 'deepseek';
            if (url.includes('openai')) return 'openai';
            if (url.includes('volces') || url.includes('ark')) return 'volcengine';
            if (url.includes('tencent') || url.includes('tcloudbase')) return 'tencent';
            if (url.includes('alibaba') || url.includes('aliyun')) return 'alibaba';
            if (url.includes('baidu')) return 'baidu';
            if (url.includes('anthropic')) return 'anthropic';
            return 'unknown';
        },

        // 检查模型是否支持思维链
        checkThinkingSupport(model, provider) {
            const thinkingModels = [
                'deepseek-r1', 'deepseek-reasoner',
                'o1-preview', 'o1-mini', 'o1-pro',
                'claude-3-opus-thinking'
            ];
            return thinkingModels.some(tm => model.toLowerCase().includes(tm.toLowerCase()));
        },

        // 推断模型类型
        inferModelType(model) {
            const imageKeywords = ['dall-e', 'dalle', 'image', 'stable-diffusion', 'midjourney', 'sd'];
            return imageKeywords.some(keyword => model.toLowerCase().includes(keyword)) ? 'image' : 'text';
        },

        // 根据解析信息填充表单
        fillFormFromParsedInfo(parsed) {
            this.aiModelForm.baseURL = parsed.baseURL;
            this.aiModelForm.model = parsed.model;
            this.aiModelForm.type = parsed.type;
            this.aiModelForm.provider = parsed.provider;
            
            // 生成模型名称
            const providerName = this.getProviderDisplayName(parsed.provider);
            this.aiModelForm.name = `${parsed.model}-${providerName}`;
            
            // 生成描述
            this.aiModelForm.description = this.generateDescription(parsed);
            
            // 更新配置
            this.aiModelForm.config.supportsStreaming = parsed.supportsStreaming;
            this.aiModelForm.config.supportsThinking = parsed.supportsThinking;
            
            // 设置API Key变量
            if (parsed.apiKeyVar && !parsed.apiKeyVar.startsWith('ey') && !parsed.apiKeyVar.startsWith('sk-')) {
                // 这是环境变量名
                this.selectedApiKey = parsed.apiKeyVar;
            } else if (parsed.apiKeyVar) {
                // 这是直接的API Key
                this.aiModelForm.apiKey = parsed.apiKeyVar;
            }
        },

        // 获取提供商显示名称
        getProviderDisplayName(provider) {
            const names = {
                'deepseek': 'DeepSeek',
                'openai': 'OpenAI',
                'volcengine': '火山方舟',
                'tencent': '腾讯云',
                'alibaba': '阿里云',
                'baidu': '百度',
                'anthropic': 'Anthropic'
            };
            return names[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
        },

        // 生成描述
        generateDescription(parsed) {
            let desc = `${parsed.model}模型`;
            if (parsed.provider !== 'unknown') {
                desc += `通过${this.getProviderDisplayName(parsed.provider)}访问`;
            }
            if (parsed.supportsThinking) {
                desc += '，支持思维链推理';
            }
            if (parsed.supportsStreaming) {
                desc += '，支持流式输出';
            }
            return desc;
        },

        // 生成模型ID
        generateModelId() {
            if (!this.aiModelForm.type || !this.aiModelForm.provider || !this.aiModelForm.model) {
                return '';
            }
            return `${this.aiModelForm.type}_${this.aiModelForm.provider}_${this.aiModelForm.model}`.replace(/[^a-zA-Z0-9_-]/g, '-');
        },

        // 用户预览相关函数
        clearPreviewUsers() {
            this.previewUsers = [];
            this.showNotification('已清空用户预览', 'info');
        },

        removePreviewUser(index) {
            this.previewUsers.splice(index, 1);
        },

        async savePreviewUsers() {
            if (this.previewUsers.length === 0) {
                this.showNotification('没有要保存的用户', 'error');
                return;
            }

            this.loading = true;
            try {
                const response = await fetch(`${this.apiBase}/save-preview-users`, {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({
                        users: this.previewUsers,
                        modelId: this.selectedAIModel
                    })
                });

                const result = await response.json();
                if (result.success) {
                    await this.loadUsers();
                    this.updateStats();
                    this.showNotification(`成功保存 ${result.data.count} 个用户`, 'success');
                    this.clearPreviewUsers();
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('保存预览用户失败:', error);
                this.showNotification('保存预览用户失败: ' + error.message, 'error');
            } finally {
                this.loading = false;
            }
        },

        // 帖文预览相关函数
        clearPreviewPosts() {
            this.previewPosts = [];
            this.showNotification('已清空帖文预览', 'info');
        },

        removePreviewPost(index) {
            this.previewPosts.splice(index, 1);
        },

        async savePreviewPosts() {
            if (this.previewPosts.length === 0) {
                this.showNotification('没有要保存的帖文', 'error');
                return;
            }

            this.loading = true;
            try {
                const response = await fetch(`${this.apiBase}/save-preview-posts`, {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({
                        posts: this.previewPosts,
                        modelId: this.selectedAIModelForPosts,
                        authorId: this.selectedPostAuthor
                    })
                });

                const result = await response.json();
                if (result.success) {
                    await this.loadPosts();
                    this.updateStats();
                    this.showNotification(`成功保存 ${result.data.count} 个帖文`, 'success');
                    this.clearPreviewPosts();
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('保存预览帖文失败:', error);
                this.showNotification('保存预览帖文失败: ' + error.message, 'error');
            } finally {
                this.loading = false;
            }
        },
        
        async fixEmptyImages() {
            if (!confirm('这将修复所有帖文中的空图片和base64格式图片，继续吗？')) {
                return;
            }
            
            this.loading = true;
            try {
                console.log('🔧 开始修复帖文图片...');
                
                const response = await fetch(`${this.apiBase}/fix-empty-images`, {
                    method: 'POST',
                    headers: this.getAuthHeaders()
                });
                
                const result = await response.json();
                if (result.success) {
                    await this.loadPosts(); // 重新加载帖文列表
                    this.showNotification(
                        `修复完成！处理了 ${result.data.totalPosts} 个帖文，修复了 ${result.data.fixedCount} 个包含无效图片的帖文`,
                        'success'
                    );
                    console.log('✅ 帖文图片修复完成:', result.data);
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('修复帖文图片失败:', error);
                this.showNotification('修复帖文图片失败: ' + error.message, 'error');
            } finally {
                this.loading = false;
            }
        },
        
        // ==================== 宠物信息管理方法 ====================
        
        // 加载用户的宠物列表
        async loadUserPets(userId) {
            if (!userId) {
                this.currentUserPets = [];
                return;
            }

            this.loadingPets = true;
            try {
                const response = await fetch(`${this.apiBase}/users/${userId}/pets`, {
                    headers: this.getAuthHeaders()
                });
                
                const result = await response.json();
                if (result.success) {
                    this.currentUserPets = result.data || [];
                    console.log(`✅ 加载到${this.currentUserPets.length}只宠物`);
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('加载宠物列表失败:', error);
                this.showNotification('加载宠物列表失败: ' + error.message, 'error');
                this.currentUserPets = [];
            } finally {
                this.loadingPets = false;
            }
        },
        
        // 打开宠物模态框
        openPetModal(pet = null) {
            this.editingPet = pet;
            if (pet) {
                // 编辑模式
                this.petForm = {
                    name: pet.name || '',
                    category: pet.category || '',
                    breed: pet.breed || '',
                    age: pet.age || '',
                    gender: pet.gender || '',
                    weight: pet.weight || '',
                    birthDate: pet.birthDate || '',
                    description: pet.description || '',
                    vaccinated: pet.vaccinated || false,
                    neutered: pet.neutered || false
                };
            } else {
                // 新建模式
                this.petForm = {
                    name: '',
                    category: '',
                    breed: '',
                    age: '',
                    gender: '',
                    weight: '',
                    birthDate: '',
                    description: '',
                    vaccinated: false,
                    neutered: false
                };
            }
            this.showPetModal = true;
        },
        
        // 关闭宠物模态框
        closePetModal() {
            this.showPetModal = false;
            this.editingPet = null;
        },
        
        // 保存宠物信息
        async savePet() {
            if (!this.editingUser) {
                this.showNotification('请先选择用户', 'error');
                return;
            }

            this.loading = true;
            try {
                const url = this.editingPet 
                    ? `${this.apiBase}/pets/${this.editingPet._id}`
                    : `${this.apiBase}/users/${this.editingUser._id}/pets`;
                
                const method = this.editingPet ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method,
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify(this.petForm)
                });
                
                const result = await response.json();
                if (result.success) {
                    await this.loadUserPets(this.editingUser._id);
                    this.closePetModal();
                    this.showNotification(
                        this.editingPet ? '宠物信息更新成功' : '宠物信息创建成功', 
                        'success'
                    );
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('保存宠物信息失败:', error);
                this.showNotification('保存宠物信息失败: ' + error.message, 'error');
            } finally {
                this.loading = false;
            }
        },
        
        // 编辑宠物信息
        editPet(pet) {
            this.openPetModal(pet);
        },
        
        // 删除宠物信息
        async deletePet(petId) {
            if (!confirm('确定要删除这只宠物的信息吗？')) return;
            
            this.loading = true;
            try {
                const response = await fetch(`${this.apiBase}/pets/${petId}`, {
                    method: 'DELETE',
                    headers: this.getAuthHeaders()
                });
                
                const result = await response.json();
                if (result.success) {
                    await this.loadUserPets(this.editingUser._id);
                    this.showNotification('宠物信息删除成功', 'success');
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('删除宠物信息失败:', error);
                this.showNotification('删除宠物信息失败: ' + error.message, 'error');
            } finally {
                this.loading = false;
            }
        },
        
        // 获取宠物类别的中文名称
        getPetCategoryName(category) {
            const categoryNames = {
                'dog': '狗',
                'cat': '猫', 
                'bird': '鸟',
                'fish': '鱼',
                'rabbit': '兔子',
                'hamster': '仓鼠',
                'other': '其他'
            };
            return categoryNames[category] || category;
        },
    };
} 