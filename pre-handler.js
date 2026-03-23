/**
 * Multi-User Privacy - Pre Handler
 * 
 * 在消息处理前进行身份识别和上下文隔离
 * 优先级：100（最高，确保最先执行）
 */

const ADMIN_ID = 'ou_b96f5424607baf3a0455b55e0f4a2213';
const path = require('path');
const fs = require('fs');

module.exports = {
    name: 'multi-user-privacy-prehandler',
    version: '1.0.0',
    priority: 100, // 最高优先级
    
    /**
     * 消息处理前执行
     * @param {Object} message - 原始消息
     * @param {Object} context - 上下文
     * @returns {Object} 处理后的消息
     */
    async beforeHandle(message, context) {
        console.log('[Privacy PreHandler] 收到消息...');
        
        // 1. 提取用户 ID
        const userId = this.extractUserId(message);
        
        if (!userId) {
            console.warn('[Privacy PreHandler] ⚠️ 无法识别用户 ID');
            message._userId = 'unknown';
            message._isAdmin = false;
            return message;
        }
        
        console.log(`[Privacy PreHandler] 用户 ID: ${userId}`);
        
        // 2. 身份识别
        const isAdmin = (userId === ADMIN_ID);
        
        // 3. 注入身份标记
        message._userId = userId;
        message._isAdmin = isAdmin;
        message._timestamp = new Date().toISOString();
        
        // 4. 加载用户上下文
        const userContext = this.loadUserContext(userId, isAdmin);
        message._context = userContext;
        
        // 5. 设置隐私规则
        if (!isAdmin) {
            message._privacyRules = {
                forbiddenTerms: [
                    '老刘',
                    '主人',
                    '管理员',
                    '主账号',
                    '其他账号',
                    '另一个用户'
                ],
                isolationCheck: true,
                noOtherUsers: true,
                noSystemAccess: true
            };
            
            console.log(`[Privacy PreHandler] 普通用户模式，启用隐私保护`);
        } else {
            console.log(`[Privacy PreHandler] 管理员模式`);
        }
        
        // 6. 记录审计日志
        this.logAccess(userId, message);
        
        return message;
    },
    
    /**
     * 消息处理后执行（发送前检查）
     * @param {Object} message - 原始消息
     * @param {string} response - 生成的回复
     * @returns {string} 最终回复
     */
    async afterHandle(message, response) {
        // 只对普通用户进行隐私检查
        if (!message._isAdmin && message._privacyRules) {
            const issues = this.checkPrivacy(response, message._privacyRules);
            
            if (issues.length > 0) {
                console.error('[Privacy PostHandler] ❌ 检测到隐私问题:');
                issues.forEach(issue => {
                    console.error(`   - ${issue}`);
                });
                
                // 记录到审计日志
                this.logPrivacyViolation(message._userId, issues, response);
                
                // 可以选择阻止发送或修改响应
                // 这里选择添加警告但不阻止
                response += '\n\n[隐私检查警告：内容可能包含敏感信息]';
            }
        }
        
        return response;
    },
    
    /**
     * 从消息中提取用户 ID
     */
    extractUserId(message) {
        // 尝试多个字段
        const candidates = [
            message.sender_id,
            message.user_id,
            message.chat_id,
            message.account_id
        ];
        
        for (const id of candidates) {
            if (id && typeof id === 'string') {
                // 提取 ou_ 开头的 ID
                const match = id.match(/(ou_[a-z0-9]+)/);
                if (match) {
                    return match[1];
                }
                // 或者直接返回 ID
                if (id.startsWith('ou_')) {
                    return id;
                }
            }
        }
        
        return null;
    },
    
    /**
     * 加载用户上下文（记忆文件）
     */
    loadUserContext(userId, isAdmin) {
        const workspace = process.env.WORKSPACE || path.join(__dirname, '..', '..', 'workspace');
        const context = {
            memoryFiles: [],
            allowedActions: [],
            restrictions: []
        };
        
        if (isAdmin) {
            // 管理员：加载完整记忆
            const memoryPath = path.join(workspace, 'MEMORY.md');
            if (fs.existsSync(memoryPath)) {
                context.memoryFiles.push(memoryPath);
            }
            context.allowedActions = ['all'];
        } else {
            // 普通用户：只能访问自己的记忆
            const userMemoryPath = path.join(workspace, 'memory', 'users', `${userId}.md`);
            if (fs.existsSync(userMemoryPath)) {
                context.memoryFiles.push(userMemoryPath);
            }
            context.restrictions.push('no_system_access');
            context.restrictions.push('no_other_users');
            context.restrictions.push('no_memory_read');
        }
        
        // 所有用户都可以访问当日记忆
        const today = new Date().toISOString().split('T')[0];
        const todayPath = path.join(workspace, 'memory', `${today}.md`);
        if (fs.existsSync(todayPath)) {
            context.memoryFiles.push(todayPath);
        }
        
        // 加载 TOOLS.md（公开信息）
        const toolsPath = path.join(workspace, 'TOOLS.md');
        if (fs.existsSync(toolsPath)) {
            context.memoryFiles.push(toolsPath);
        }
        
        return context;
    },
    
    /**
     * 隐私检查
     */
    checkPrivacy(text, rules) {
        const issues = [];
        
        // 检查敏感词
        for (const term of rules.forbiddenTerms) {
            if (text.includes(term)) {
                issues.push(`包含敏感词：${term}`);
            }
        }
        
        // 检查是否暗示其他用户存在
        const isolationPatterns = [
            /其他账号/g,
            /另一个用户/g,
            /还有人/g,
            /除了你之外/g,
            /我的其他主人/g,
            /管理员账号/g
        ];
        
        for (const pattern of isolationPatterns) {
            if (pattern.test(text)) {
                issues.push(`暗示其他用户存在：${pattern.toString()}`);
            }
        }
        
        // 检查是否泄露账号 ID
        const accountIdPattern = /ou_[a-z0-9]{32}/g;
        const matches = text.match(accountIdPattern);
        if (matches) {
            issues.push(`可能泄露账号 ID: ${matches.join(', ')}`);
        }
        
        return issues;
    },
    
    /**
     * 记录访问日志
     */
    logAccess(userId, message) {
        try {
            const workspace = process.env.WORKSPACE || path.join(__dirname, '..', '..', 'workspace');
            const logFile = path.join(workspace, 'memory', 'privacy-audit.log');
            
            const timestamp = new Date().toISOString();
            const log = `[${timestamp}] User: ${userId} | Admin: ${userId === ADMIN_ID} | Action: ${message.type || 'message'}\n`;
            
            fs.appendFileSync(logFile, log, 'utf-8');
        } catch (error) {
            console.error('[Privacy PreHandler] 记录日志失败:', error.message);
        }
    },
    
    /**
     * 记录隐私违规
     */
    logPrivacyViolation(userId, issues, response) {
        try {
            const workspace = process.env.WORKSPACE || path.join(__dirname, '..', '..', 'workspace');
            const logFile = path.join(workspace, 'memory', 'privacy-violations.log');
            
            const timestamp = new Date().toISOString();
            const log = `[${timestamp}] User: ${userId}\n`;
            log += `Issues:\n${issues.map(i => `  - ${i}`).join('\n')}\n`;
            log += `Response Preview: ${response.substring(0, 200)}...\n`;
            log += `${'='.repeat(80)}\n`;
            
            fs.appendFileSync(logFile, log, 'utf-8');
        } catch (error) {
            console.error('[Privacy PostHandler] 记录违规失败:', error.message);
        }
    }
};
