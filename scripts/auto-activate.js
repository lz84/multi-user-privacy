/**
 * Multi-User Privacy - Auto Activate
 * 
 * 技能加载时自动激活，无需修改 OpenClaw 源码
 * 
 * 原理：
 * 1. 利用 Node.js 的 module._load 钩子
 * 2. 拦截消息处理相关模块
 * 3. 自动注入 Pre-Handler
 */

const path = require('path');
const Module = require('module');

console.log('[Privacy AutoActivate] 🚀 多用户隐私保护自动激活...');

// 保存原始 _load 函数
const originalLoad = Module._load;

// 需要拦截的模块
const TARGET_MODULES = [
    'openclaw',
    '@openclaw/core',
    '@openclaw/runtime',
    './message-handler',
    './agent'
];

// Pre-Handler 路径
const PRE_HANDLER_PATH = path.join(__dirname, '..', 'pre-handler.js');
let preHandler = null;

// 加载 Pre-Handler
try {
    preHandler = require('../pre-handler.js');
    console.log('[Privacy AutoActivate] ✅ Pre-Handler 加载成功');
} catch (error) {
    console.error('[Privacy AutoActivate] ❌ Pre-Handler 加载失败:', error.message);
    module.exports = { enabled: false };
    return;
}

// 拦截模块加载
Module._load = function(request, parent, isMain) {
    // 先调用原始 load
    const exported = originalLoad.apply(this, arguments);
    
    // 检查是否是目标模块
    if (TARGET_MODULES.some(target => request.includes(target))) {
        console.log(`[Privacy AutoActivate] 拦截到模块：${request}`);
        
        // 尝试注入 Pre-Handler
        if (exported && typeof exported === 'object') {
            // 如果是对象，尝试包装 processMessage 方法
            if (exported.processMessage && typeof exported.processMessage === 'function') {
                console.log('[Privacy AutoActivate] 注入 processMessage...');
                
                const originalProcessMessage = exported.processMessage;
                exported.processMessage = async function(message, context) {
                    console.log('[Privacy AutoActivate] 拦截消息处理');
                    
                    // 预处理
                    message = await preHandler.beforeHandle(message, context);
                    
                    // 原始处理
                    let response = await originalProcessMessage(message, context);
                    
                    // 后处理
                    response = await preHandler.afterHandle(message, response);
                    
                    return response;
                };
                
                console.log('[Privacy AutoActivate] ✅ processMessage 已注入');
            }
            
            // 如果是类，尝试包装 handleMessage 方法
            if (exported.prototype && exported.prototype.handleMessage) {
                console.log('[Privacy AutoActivate] 注入 handleMessage...');
                
                const originalHandleMessage = exported.prototype.handleMessage;
                exported.prototype.handleMessage = async function(message, context) {
                    console.log('[Privacy AutoActivate] 拦截 handleMessage');
                    
                    // 预处理
                    message = await preHandler.beforeHandle(message, context);
                    
                    // 原始处理
                    let response = await originalHandleMessage.call(this, message, context);
                    
                    // 后处理
                    response = await preHandler.afterHandle(message, response);
                    
                    return response;
                };
                
                console.log('[Privacy AutoActivate] ✅ handleMessage 已注入');
            }
        }
        
        // 如果是函数，直接包装
        if (typeof exported === 'function') {
            console.log('[Privacy AutoActivate] 包装导出函数...');
            
            const originalFn = exported;
            const wrappedFn = async function(...args) {
                console.log('[Privacy AutoActivate] 拦截函数调用');
                
                const [message, context] = args;
                
                // 预处理
                if (message && typeof message === 'object') {
                    await preHandler.beforeHandle(message, context || {});
                }
                
                // 原始调用
                const result = await originalFn.apply(this, args);
                
                // 后处理
                if (typeof result === 'string') {
                    return await preHandler.afterHandle(message || {}, result);
                }
                
                return result;
            };
            
            // 保留原始函数的属性
            Object.assign(wrappedFn, originalFn);
            
            return wrappedFn;
        }
    }
    
    return exported;
};

console.log('[Privacy AutoActivate] ✅ 模块拦截已设置');

// 导出 API
module.exports = {
    enabled: true,
    preHandler,
    
    // 手动 API
    getUserId: (message) => preHandler.extractUserId(message),
    checkPrivacy: (text, userId) => {
        const isAdmin = (userId === 'ou_b96f5424607baf3a0455b55e0f4a2213');
        if (isAdmin) return [];
        
        const rules = {
            forbiddenTerms: ['老刘', '主人', '管理员', '主账号'],
            isolationCheck: true
        };
        return preHandler.checkPrivacy(text, rules);
    },
    
    // 停用
    disable: () => {
        Module._load = originalLoad;
        console.log('[Privacy AutoActivate] ⚠️  已停用');
    }
};

console.log('[Privacy AutoActivate] 🎉 多用户隐私保护已激活（开箱即用）');
console.log('[Privacy AutoActivate] 📋 无需修改任何文件，技能已自动生效');
