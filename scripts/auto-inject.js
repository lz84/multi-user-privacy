/**
 * Multi-User Privacy - Auto Inject
 * 
 * 自动注入到 OpenClaw 运行时，拦截消息处理流程
 */

const path = require('path');
const fs = require('fs');

console.log('[Privacy AutoInject] 启动多用户隐私保护...');

// 查找 OpenClaw 运行时目录
const possiblePaths = [
    path.join(__dirname, '..', '..', '..', 'runtime'),
    path.join(__dirname, '..', '..', 'runtime'),
    '/usr/local/lib/node_modules/openclaw/runtime',
    path.join(process.env.HOME, '.openclaw', 'runtime')
];

let runtimeDir = null;
for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        runtimeDir = p;
        break;
    }
}

if (!runtimeDir) {
    console.warn('[Privacy AutoInject] ⚠️ 未找到 OpenClaw runtime 目录');
    console.warn('[Privacy AutoInject] 请手动配置注入路径');
    module.exports = { enabled: false };
    return;
}

console.log(`[Privacy AutoInject] 找到 runtime 目录：${runtimeDir}`);

// 加载 pre-handler
const preHandlerPath = path.join(__dirname, 'pre-handler.js');
let preHandler = null;

if (fs.existsSync(preHandlerPath)) {
    try {
        preHandler = require('./pre-handler.js');
        console.log('[Privacy AutoInject] ✅ pre-handler 加载成功');
    } catch (error) {
        console.error('[Privacy AutoInject] ❌ pre-handler 加载失败:', error.message);
    }
} else {
    console.error('[Privacy AutoInject] ❌ 未找到 pre-handler.js');
    module.exports = { enabled: false };
    return;
}

// 劫持消息处理函数
function interceptMessageHandling() {
    console.log('[Privacy AutoInject] 拦截消息处理流程...');
    
    // 保存原始函数
    const originalProcessMessage = global.processMessage || null;
    
    // 创建包装函数
    global.processMessage = async function(message, context) {
        console.log('[Privacy AutoInject] 拦截到消息处理');
        
        // 1. 预处理（身份识别）
        if (preHandler && preHandler.beforeHandle) {
            message = await preHandler.beforeHandle(message, context);
        }
        
        // 2. 调用原始处理函数
        let response;
        if (originalProcessMessage) {
            response = await originalProcessMessage(message, context);
        } else {
            // 如果没有原始函数，直接返回
            response = 'Message processed with privacy guard';
        }
        
        // 3. 后处理（隐私检查）
        if (preHandler && preHandler.afterHandle) {
            response = await preHandler.afterHandle(message, response);
        }
        
        return response;
    };
    
    console.log('[Privacy AutoInject] ✅ 消息处理流程已拦截');
}

// 执行拦截
interceptMessageHandling();

// 导出 API
module.exports = {
    enabled: true,
    preHandler,
    interceptMessageHandling,
    
    // 手动调用 API
    getUserId: (message) => preHandler.extractUserId(message),
    checkPrivacy: (text, userId) => {
        const isAdmin = (userId === 'ou_b96f5424607baf3a0455b55e0f4a2213');
        if (isAdmin) return [];
        
        const rules = {
            forbiddenTerms: ['老刘', '主人', '管理员', '主账号'],
            isolationCheck: true
        };
        return preHandler.checkPrivacy(text, rules);
    }
};

console.log('[Privacy AutoInject] 🎉 多用户隐私保护已激活');
