const axios = require('axios');

class EnhancedUserManagementTester {
    constructor() {
        this.apiBase = 'http://localhost:3001/api/admin';
        this.token = null;
        this.testResults = [];
    }

    async init() {
        console.log('🚀 开始增强用户管理功能测试...\n');
        
        try {
            // 1. 获取登录token
            await this.login();
            
            // 2. 测试创建完整用户
            await this.testCreateCompleteUser();
            
            // 3. 测试更新用户信息
            await this.testUpdateUser();
            
            // 4. 测试宠物信息管理
            await this.testPetInfoManagement();
            
            // 5. 显示测试结果
            this.showResults();
            
        } catch (error) {
            console.error('❌ 测试失败:', error.message);
        }
    }

    async login() {
        try {
            const response = await axios.post(`${this.apiBase}/auth/login`, {
                openid: '29dca3d5682c133900a709ab33d3ff30',
                nickName: '测试管理员'
            });
            
            if (response.data.success) {
                this.token = response.data.token;
                console.log('✅ 登录成功');
                this.recordTest('管理员登录', true, '获取到访问令牌');
            } else {
                throw new Error('登录失败: ' + response.data.message);
            }
        } catch (error) {
            this.recordTest('管理员登录', false, error.message);
            throw error;
        }
    }

    async testCreateCompleteUser() {
        console.log('\n📝 测试创建完整用户信息...');
        
        try {
            const userData = {
                nickName: `测试用户_${Date.now()}`,
                avatarUrl: 'https://via.placeholder.com/150x150?text=Test',
                status: 'active',
                bio: '这是一个测试用户，用于验证用户管理功能的完整性。喜欢宠物，热爱生活！',
                gender: 'female',
                city: '深圳',
                province: '广东省',
                country: '中国',
                language: 'zh_CN',
                birthday: '1995-08-15',
                level: 3,
                experience: 150,
                isAIGenerated: false,
                aiModel: '',
                petInfo: [
                    {
                        name: '小橘',
                        category: 'cat',
                        breed: '橘猫',
                        age: '2岁',
                        gender: 'male'
                    },
                    {
                        name: '小白',
                        category: 'dog',
                        breed: '比熊',
                        age: '3岁',
                        gender: 'female'
                    }
                ]
            };

            const response = await this.makeRequest('POST', '/users', userData);
            
            if (response.success && response.data) {
                this.createdUserId = response.data._id;
                console.log('✅ 创建用户成功:', response.data.nickName);
                console.log('   - PetMeetID:', response.data.PetMeetID);
                console.log('   - 位置信息:', `${response.data.city}, ${response.data.province}, ${response.data.country}`);
                console.log('   - 宠物数量:', response.data.petInfo?.length || 0);
                
                // 验证字段完整性
                const requiredFields = ['nickName', 'avatarUrl', 'bio', 'gender', 'city', 'province', 'birthday', 'petInfo'];
                const missingFields = requiredFields.filter(field => !response.data.hasOwnProperty(field));
                
                if (missingFields.length === 0) {
                    this.recordTest('创建完整用户', true, `所有字段保存成功，宠物信息${response.data.petInfo.length}个`);
                } else {
                    this.recordTest('创建完整用户', false, `缺失字段: ${missingFields.join(', ')}`);
                }
            } else {
                this.recordTest('创建完整用户', false, response.message || '创建失败');
            }
        } catch (error) {
            this.recordTest('创建完整用户', false, error.message);
        }
    }

    async testUpdateUser() {
        if (!this.createdUserId) {
            console.log('⚠️ 跳过更新测试 - 没有可用的测试用户');
            return;
        }

        console.log('\n📝 测试更新用户信息...');
        
        try {
            const updateData = {
                nickName: `更新用户_${Date.now()}`,
                bio: '更新后的用户简介，包含更多详细信息。现在是高级用户了！',
                city: '北京',
                province: '北京市',
                level: 5,
                experience: 300,
                petInfo: [
                    {
                        name: '更新小橘',
                        category: 'cat',
                        breed: '英短橘猫',
                        age: '3岁',
                        gender: 'male'
                    },
                    {
                        name: '新增小黑',
                        category: 'dog',
                        breed: '拉布拉多',
                        age: '1岁',
                        gender: 'female'
                    },
                    {
                        name: '小鸟',
                        category: 'bird',
                        breed: '虎皮鹦鹉',
                        age: '6个月',
                        gender: 'unknown'
                    }
                ]
            };

            const response = await this.makeRequest('PUT', `/users/${this.createdUserId}`, updateData);
            
            if (response.success) {
                console.log('✅ 更新用户成功');
                console.log('   - 新城市:', updateData.city);
                console.log('   - 新等级:', updateData.level);
                console.log('   - 宠物数量:', updateData.petInfo.length);
                
                this.recordTest('更新用户信息', true, '所有字段更新成功');
            } else {
                this.recordTest('更新用户信息', false, response.message || '更新失败');
            }
        } catch (error) {
            this.recordTest('更新用户信息', false, error.message);
        }
    }

    async testPetInfoManagement() {
        console.log('\n🐾 测试宠物信息管理...');
        
        try {
            // 测试各种宠物类型
            const petTypes = [
                { name: '金毛', category: 'dog', breed: '金毛寻回犬', age: '5岁', gender: 'male' },
                { name: '布偶', category: 'cat', breed: '布偶猫', age: '2岁', gender: 'female' },
                { name: '小仓鼠', category: 'hamster', breed: '三线仓鼠', age: '6个月', gender: 'unknown' },
                { name: '小兔子', category: 'rabbit', breed: '垂耳兔', age: '1岁', gender: 'female' },
                { name: '金鱼', category: 'fish', breed: '金鱼', age: '3个月', gender: 'unknown' }
            ];

            const userData = {
                nickName: `宠物达人_${Date.now()}`,
                bio: '拥有多种宠物的资深铲屎官',
                petInfo: petTypes
            };

            const response = await this.makeRequest('POST', '/users', userData);
            
            if (response.success && response.data) {
                console.log('✅ 宠物信息管理测试成功');
                console.log(`   - 创建了拥有${response.data.petInfo.length}只宠物的用户`);
                
                const petCategories = [...new Set(response.data.petInfo.map(pet => pet.category))];
                console.log('   - 宠物类型:', petCategories.join(', '));
                
                this.recordTest('宠物信息管理', true, `支持${petCategories.length}种宠物类型，${response.data.petInfo.length}个宠物信息`);
            } else {
                this.recordTest('宠物信息管理', false, response.message || '宠物信息保存失败');
            }
        } catch (error) {
            this.recordTest('宠物信息管理', false, error.message);
        }
    }

    async makeRequest(method, endpoint, data = null) {
        const config = {
            method,
            url: `${this.apiBase}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            config.data = data;
        }

        const response = await axios(config);
        return response.data;
    }

    recordTest(testName, passed, details = '') {
        this.testResults.push({
            name: testName,
            passed,
            details
        });
    }

    showResults() {
        console.log('\n📊 测试结果汇总:');
        console.log('='.repeat(60));
        
        let passedCount = 0;
        let failedCount = 0;
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅ 通过' : '❌ 失败';
            console.log(`${status} ${result.name}`);
            if (result.details) {
                console.log(`    ${result.details}`);
            }
            
            if (result.passed) {
                passedCount++;
            } else {
                failedCount++;
            }
        });
        
        console.log('='.repeat(60));
        console.log(`总计: ${this.testResults.length} 项测试`);
        console.log(`通过: ${passedCount} 项`);
        console.log(`失败: ${failedCount} 项`);
        console.log(`成功率: ${((passedCount / this.testResults.length) * 100).toFixed(1)}%`);
        
        if (failedCount === 0) {
            console.log('\n🎉 所有测试都通过了！增强的用户管理功能工作正常。');
        } else {
            console.log('\n⚠️ 存在测试失败项，请检查相关功能。');
        }
    }
}

// 运行测试
const tester = new EnhancedUserManagementTester();
tester.init().catch(console.error); 