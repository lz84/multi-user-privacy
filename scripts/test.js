#!/usr/bin/env node
/**
 * Multi-User Privacy - Test Script
 * 
 * 测试身份识别和隐私检查功能
 */

const path = require('path');

// 加载 pre-handler
const preHandler = require('../pre-handler.js');

console.log('='.repeat(60));
console.log('Multi-User Privacy - 功能测试');
console.log('='.repeat(60));

// 测试用例
const testCases = [
    {
        name: '管理员身份识别',
        message: {
            sender_id: 'ou_b96f5424607baf3a0455b55e0f4a2213',
            type: 'message',
            content: '帮我检查服务器状态'
        },
        expected: {
            userId: 'ou_b96f5424607baf3a0455b55e0f4a2213',
            isAdmin: true
        }
    },
    {
        name: '普通用户身份识别',
        message: {
            sender_id: 'ou_ba3410ec9024501b3383141a5ba7bec4',
            type: 'message',
            content: '帮我写篇文章'
        },
        expected: {
            userId: 'ou_ba3410ec9024501b3383141a5ba7bec4',
            isAdmin: false
        }
    },
    {
        name: '隐私检查 - 敏感词',
        message: {
            sender_id: 'ou_ba3410ec9024501b3383141a5ba7bec4',
            content: '老刘让我帮你测试'
        },
        shouldFail: true
    },
    {
        name: '隐私检查 - 账号 ID',
        message: {
            sender_id: 'ou_ba3410ec9024501b3383141a5ba7bec4',
            content: '我的账号是 ou_b96f5424607baf3a0455b55e0f4a2213'
        },
        shouldFail: true
    },
    {
        name: '正常消息',
        message: {
            sender_id: 'ou_ba3410ec9024501b3383141a5ba7bec4',
            content: '今天天气不错'
        },
        shouldFail: false
    }
];

// 运行测试
async function runTests() {
    let passed = 0;
    let failed = 0;
    
    for (const test of testCases) {
        console.log(`\n测试：${test.name}`);
        console.log('-'.repeat(60));
        
        try {
            // 预处理
            const processed = await preHandler.beforeHandle(test.message, {});
            
            if (test.expected) {
                // 检查身份识别
                const userIdMatch = (processed._userId === test.expected.userId);
                const adminMatch = (processed._isAdmin === test.expected.isAdmin);
                
                if (userIdMatch && adminMatch) {
                    console.log('✅ 身份识别通过');
                    passed++;
                } else {
                    console.log('❌ 身份识别失败');
                    console.log(`   期望：userId=${test.expected.userId}, admin=${test.expected.isAdmin}`);
                    console.log(`   实际：userId=${processed._userId}, admin=${processed._isAdmin}`);
                    failed++;
                }
            }
            
            // 后处理（隐私检查）
            if (test.message.content) {
                const response = test.message.content; // 用 content 模拟 response
                const issues = [];
                
                if (!processed._isAdmin && processed._privacyRules) {
                    const checkResult = preHandler.checkPrivacy(response, processed._privacyRules);
                    issues.push(...checkResult);
                }
                
                if (test.shouldFail) {
                    if (issues.length > 0) {
                        console.log('✅ 隐私检查正确拦截');
                        console.log(`   问题：${issues.join(', ')}`);
                        passed++;
                    } else {
                        console.log('❌ 隐私检查应该拦截但未拦截');
                        failed++;
                    }
                } else {
                    if (issues.length === 0) {
                        console.log('✅ 隐私检查通过');
                        passed++;
                    } else {
                        console.log('❌ 隐私检查错误拦截');
                        console.log(`   问题：${issues.join(', ')}`);
                        failed++;
                    }
                }
            }
            
        } catch (error) {
            console.log(`❌ 测试异常：${error.message}`);
            failed++;
        }
    }
    
    // 统计结果
    console.log('\n' + '='.repeat(60));
    console.log('测试结果');
    console.log('='.repeat(60));
    console.log(`通过：${passed}/${testCases.length}`);
    console.log(`失败：${failed}/${testCases.length}`);
    console.log(`成功率：${(passed/testCases.length*100).toFixed(1)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 所有测试通过！');
    } else {
        console.log('\n⚠️  有测试失败，请检查实现');
    }
    
    return failed === 0;
}

// 运行测试
runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
});
