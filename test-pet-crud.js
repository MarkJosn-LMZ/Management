const axios = require('axios');

class PetCRUDTester {
    constructor() {
        this.apiBase = 'http://localhost:3001/api/admin';
        this.token = null;
        this.testResults = [];
        this.testUserId = null;
        this.testPetId = null;
    }

    async init() {
        console.log('🐾 开始宠物信息CRUD功能测试...\n');
        
        try {
            // 1. 登录获取token
            await this.login();
            
            // 2. 创建测试用户
            await this.createTestUser();
            
            // 3. 测试宠物CRUD操作
            await this.testCreatePet();
            await this.testGetUserPets();
            await this.testUpdatePet();
            await this.testGetPetDetails();
            await this.testDeletePet();
            
            // 4. 清理测试数据
            await this.cleanup();
            
            // 5. 显示测试结果
            this.showResults();
            
        } catch (error) {
            console.error('❌ 测试失败:', error.message);
        }
    }

    async login() {
        try {
            const response = await axios.post(`${this.apiBase}/auth/login`, {
                petMeetId: 'admin001',
                nickName: '管理员'
            });
            
            if (response.data.success) {
                this.token = response.data.data.token;
                console.log('✅ 登录成功');
                this.recordTest('管理员登录', true);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            this.recordTest('管理员登录', false, error.message);
            throw error;
        }
    }

    async createTestUser() {
        try {
            const userData = {
                nickName: '宠物测试用户',
                avatarUrl: 'https://example.com/avatar.jpg',
                status: 'active',
                bio: '专门用于测试宠物CRUD功能的用户',
                gender: 'female',
                city: '深圳',
                province: '广东省',
                country: '中国',
                language: 'zh_CN',
                level: 1,
                experience: 0,
                isAIGenerated: false
            };

            const response = await this.makeRequest('POST', '/users', userData);
            
            if (response.success) {
                this.testUserId = response.data._id;
                console.log('✅ 测试用户创建成功:', this.testUserId);
                this.recordTest('创建测试用户', true);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            this.recordTest('创建测试用户', false, error.message);
            throw error;
        }
    }

    async testCreatePet() {
        try {
            const petData = {
                name: '小白',
                category: 'dog',
                breed: '金毛',
                age: '2岁',
                gender: 'male',
                weight: '25kg',
                birthDate: '2022-03-15',
                description: '一只活泼可爱的金毛犬，喜欢玩球和游泳',
                vaccinated: true,
                neutered: false
            };

            const response = await this.makeRequest('POST', `/users/${this.testUserId}/pets`, petData);
            
            if (response.success) {
                this.testPetId = response.data._id;
                console.log('✅ 宠物创建成功:', this.testPetId);
                console.log('   - 名称:', response.data.name);
                console.log('   - 类别:', response.data.category);
                console.log('   - 品种:', response.data.breed);
                this.recordTest('创建宠物信息', true, `成功创建宠物: ${response.data.name}`);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            this.recordTest('创建宠物信息', false, error.message);
            throw error;
        }
    }

    async testGetUserPets() {
        try {
            const response = await this.makeRequest('GET', `/users/${this.testUserId}/pets`);
            
            if (response.success) {
                console.log('✅ 获取用户宠物列表成功');
                console.log('   - 宠物数量:', response.data.length);
                
                if (response.data.length > 0) {
                    const pet = response.data[0];
                    console.log('   - 第一只宠物:', pet.name, `(${pet.category})`);
                }
                
                this.recordTest('获取用户宠物列表', true, `找到${response.data.length}只宠物`);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            this.recordTest('获取用户宠物列表', false, error.message);
            throw error;
        }
    }

    async testUpdatePet() {
        try {
            const updateData = {
                name: '小白白',
                weight: '26kg',
                description: '一只非常活泼可爱的金毛犬，喜欢玩球和游泳，最近长胖了一点',
                neutered: true
            };

            const response = await this.makeRequest('PUT', `/pets/${this.testPetId}`, updateData);
            
            if (response.success) {
                console.log('✅ 宠物信息更新成功');
                this.recordTest('更新宠物信息', true, '成功更新宠物信息');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            this.recordTest('更新宠物信息', false, error.message);
            throw error;
        }
    }

    async testGetPetDetails() {
        try {
            const response = await this.makeRequest('GET', `/pets/${this.testPetId}`);
            
            if (response.success) {
                console.log('✅ 获取宠物详情成功');
                console.log('   - 名称:', response.data.name);
                console.log('   - 体重:', response.data.weight);
                console.log('   - 已绝育:', response.data.neutered ? '是' : '否');
                this.recordTest('获取宠物详情', true, `获取到宠物: ${response.data.name}`);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            this.recordTest('获取宠物详情', false, error.message);
            throw error;
        }
    }

    async testDeletePet() {
        try {
            const response = await this.makeRequest('DELETE', `/pets/${this.testPetId}`);
            
            if (response.success) {
                console.log('✅ 宠物信息删除成功');
                this.recordTest('删除宠物信息', true);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            this.recordTest('删除宠物信息', false, error.message);
            throw error;
        }
    }

    async cleanup() {
        try {
            if (this.testUserId) {
                await this.makeRequest('DELETE', `/users/${this.testUserId}`);
                console.log('✅ 测试数据清理完成');
            }
        } catch (error) {
            console.warn('⚠️ 清理测试数据时出错:', error.message);
        }
    }

    async makeRequest(method, endpoint, data = null) {
        try {
            const config = {
                method,
                url: `${this.apiBase}${endpoint}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                }
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                config.data = data;
            }

            const response = await axios(config);
            return response.data;
        } catch (error) {
            if (error.response) {
                throw new Error(error.response.data?.message || error.response.statusText);
            }
            throw error;
        }
    }

    recordTest(testName, passed, details = '') {
        this.testResults.push({
            name: testName,
            passed,
            details
        });
    }

    showResults() {
        console.log('\n📊 测试结果总结:');
        console.log('==========================================');
        
        const passedTests = this.testResults.filter(t => t.passed).length;
        const totalTests = this.testResults.length;
        
        this.testResults.forEach(test => {
            const status = test.passed ? '✅' : '❌';
            console.log(`${status} ${test.name}${test.details ? ': ' + test.details : ''}`);
        });
        
        console.log('==========================================');
        console.log(`通过率: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
        
        if (passedTests === totalTests) {
            console.log('🎉 所有测试通过！宠物CRUD功能工作正常！');
        } else {
            console.log('⚠️ 部分测试失败，请检查相关功能');
        }
    }
}

// 运行测试
if (require.main === module) {
    const tester = new PetCRUDTester();
    tester.init().catch(console.error);
}

module.exports = PetCRUDTester; 