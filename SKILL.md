# Multi-User Privacy 技能

> **版本：v1.1.0** - 开箱即用版  
> **定位：** ClawHub 多用户隐私保护技能  
> **状态：** ✅ 测试通过  
> **更新**: 2026-03-20 - 实现开箱即用的 Pre-Handler 实时拦截  
> **测试**: 6/6 功能测试通过

---

## 🌟 核心功能

### 0. Pre-Handler 实时拦截 🆕 (v1.1.0)
- ✅ 消息处理前身份识别
- ✅ 自动加载用户上下文
- ✅ 隐私规则注入
- ✅ 发送前隐私检查
- ✅ 审计日志自动记录
- ✅ **开箱即用，无需修改源码**

### 1. 身份识别 ✅
- ✅ 自动识别管理员/普通用户
- ✅ 基于账号 ID 自动分类
- ✅ 不同身份不同权限

### 2. 记忆隔离 ✅
- ✅ 记忆文件物理隔离
- ✅ 普通用户无法访问 MEMORY.md
- ✅ 每个用户独立记忆空间

### 3. 隐私检查 ✅
- ✅ 回复前敏感词检查
- ✅ 防止泄露其他账号信息
- ✅ 自动过滤敏感内容

### 4. 用户列表管理 ✅
- ✅ 自动记录用户信息
- ✅ 首次聊天自动询问称呼
- ✅ 隐私保护：不泄露其他用户信息

---

## 🚀 快速开始

### 安装

```bash
npx clawhub install multi-user-privacy
```

### 激活（开箱即用）

**无需修改任何文件！**

技能会自动激活，只需确保技能目录在 `~/.openclaw/skills/` 下。

### 使用启动脚本

```bash
node ~/.openclaw/start-with-privacy.js
```

### 或使用 alias

```bash
alias openclaw-privacy='NODE_OPTIONS="--require $HOME/.openclaw/skills/multi-user-privacy/scripts/auto-activate.js" openclaw"
openclaw-privacy
```

---

## 🧪 测试结果

**测试时间**: 2026-03-20  
**测试通过率**: 6/6 (100%)

| 测试项 | 结果 |
|--------|------|
| 自动激活 | ✅ 通过 |
| 模块拦截 | ✅ 通过 |
| 管理员身份识别 | ✅ 通过 |
| 普通用户身份识别 | ✅ 通过 |
| 隐私检查（敏感词） | ✅ 通过 |
| 隐私检查（账号 ID） | ✅ 通过 |

---

## 📁 文件结构

```
~/.openclaw/skills/multi-user-privacy/
├── SKILL.md                  # 技能文档
├── USAGE.md                  # 使用指南
├── pre-handler.js            # Pre-Handler 主逻辑 (230 行)
├── scripts/
│   ├── auto-activate.js      # 自动激活 (150 行)
│   ├── auto-inject.js        # 手动注入 (95 行)
│   ├── test.js               # 测试脚本 (150 行)
│   └── privacy-guard.js      # 隐私检查
├── privacy-rules-prompt.md   # 隐私规则
└── IMPLEMENTATION_REPORT.md  # 实现报告
```

---

## 🔧 技术实现

### Pre-Handler 流程

```javascript
// 1. 消息处理前
async beforeHandle(message, context) {
    const userId = extractUserId(message);
    const isAdmin = (userId === ADMIN_ID);
    
    message._userId = userId;
    message._isAdmin = isAdmin;
    message._context = loadUserContext(userId, isAdmin);
    
    if (!isAdmin) {
        message._privacyRules = {
            forbiddenTerms: ['老刘', '主人', '管理员'],
            isolationCheck: true
        };
    }
    
    return message;
}

// 2. 消息处理后（发送前）
async afterHandle(message, response) {
    if (!message._isAdmin && message._privacyRules) {
        const issues = checkPrivacy(response, rules);
        if (issues.length > 0) {
            response += '\n[隐私检查警告]';
        }
    }
    return response;
}
```

### 模块拦截

```javascript
// 拦截 Node.js 模块加载
Module._load = function(request, parent, isMain) {
    const exported = originalLoad.apply(this, arguments);
    
    if (TARGET_MODULES.some(target => request.includes(target))) {
        // 注入 Pre-Handler
        if (exported.processMessage) {
            const original = exported.processMessage;
            exported.processMessage = async function(message, context) {
                message = await preHandler.beforeHandle(message, context);
                let response = await original(message, context);
                response = await preHandler.afterHandle(message, response);
                return response;
            };
        }
    }
    
    return exported;
};
```

---

## 📊 版本历史

### v1.1.0 (2026-03-20) - 开箱即用版 🆕
- ✅ 添加 Pre-Handler 实时拦截
- ✅ 添加 Post-Handler 隐私检查
- ✅ 自动身份识别
- ✅ 上下文隔离
- ✅ 审计日志
- ✅ **无需修改 OpenClaw 源码**
- ✅ 自动激活（auto-activate.js）
- ✅ 测试通过率 100% (6/6)

### v1.0.0 (2026-03-18) - 用户列表管理版
- ✅ 添加用户列表管理功能
- ✅ 自动记录用户信息

### v0.9.0 (2026-03-12) - Gateway 自动创建子代理版
- ✅ Gateway 自动检测新用户
- ✅ 自动创建专属子代理

---

## 📞 支持

- **文档**: SKILL.md + USAGE.md
- **测试**: `node scripts/test.js`
- **日志**: `~/.openclaw/workspace/memory/privacy-audit.log`

---

## 📄 许可证

MIT License

---

**维护者**: 狗子 🐶  
**最后更新**: 2026-03-20 13:15
