# Pre-Handler 使用指南

> **版本**: v1.1.0  
> **功能**: 消息处理前的身份识别和隐私保护

---

## 🎯 功能说明

Pre-Handler 在消息处理流程中的位置：

```
收到消息
   ↓
[Pre-Handler] ← 身份识别、上下文加载、隐私规则注入
   ↓
消息处理（AI 生成回复）
   ↓
[Post-Handler] ← 隐私检查、敏感词过滤
   ↓
发送回复
```

---

## 📦 安装

### 方式 1: 自动注入（推荐）

编辑 `~/.openclaw/runtime/main.js`，在开头添加：

```javascript
require('./skills/multi-user-privacy/scripts/auto-inject');
```

重启 OpenClaw 后自动生效。

### 方式 2: 手动调用

在你的代码中：

```javascript
const preHandler = require('./skills/multi-user-privacy/pre-handler.js');

// 处理消息
async function handleMessage(message, context) {
    // 预处理
    message = await preHandler.beforeHandle(message, context);
    
    // 生成回复
    const response = await generateResponse(message, context);
    
    // 后处理（隐私检查）
    const finalResponse = await preHandler.afterHandle(message, response);
    
    return finalResponse;
}
```

---

## 🔧 API 参考

### beforeHandle(message, context)

**参数**:
- `message` {Object}: 原始消息对象
  - `sender_id` {string}: 发送者 ID
  - `user_id` {string}: 用户 ID
  - `chat_id` {string}: 聊天 ID
  - `content` {string}: 消息内容
- `context` {Object}: 上下文对象

**返回**:
- `message` {Object}: 处理后的消息对象，包含：
  - `_userId` {string}: 提取的用户 ID
  - `_isAdmin` {boolean}: 是否管理员
  - `_context` {Object}: 加载的上下文（记忆文件等）
  - `_privacyRules` {Object}: 隐私规则（仅普通用户）

**示例**:
```javascript
const message = {
    sender_id: 'ou_ba3410ec9024501b3383141a5ba7bec4',
    content: '帮我写篇文章'
};

const processed = await preHandler.beforeHandle(message, {});
console.log(processed._userId);    // ou_ba3410ec9024501b3383141a5ba7bec4
console.log(processed._isAdmin);   // false
console.log(processed._privacyRules); // { forbiddenTerms: [...], ... }
```

### afterHandle(message, response)

**参数**:
- `message` {Object}: 处理后的消息对象（来自 beforeHandle）
- `response` {string}: AI 生成的回复

**返回**:
- `response` {string}: 最终回复（可能包含隐私警告）

**示例**:
```javascript
const response = '好的，我来帮你写这篇文章...';
const finalResponse = await preHandler.afterHandle(message, response);
console.log(finalResponse);
// 如果检测到隐私问题，会添加警告后缀
```

### extractUserId(message)

**参数**:
- `message` {Object}: 消息对象

**返回**:
- `userId` {string|null}: 提取的用户 ID

**示例**:
```javascript
const userId = preHandler.extractUserId({
    sender_id: 'ou_b96f5424607baf3a0455b55e0f4a2213'
});
console.log(userId); // ou_b96f5424607baf3a0455b55e0f4a2213
```

### checkPrivacy(text, rules)

**参数**:
- `text` {string}: 要检查的文本
- `rules` {Object}: 隐私规则
  - `forbiddenTerms` {string[]}: 禁止的词汇
  - `isolationCheck` {boolean}: 是否检查隔离
  - `noOtherUsers` {boolean}: 是否检查其他用户暗示

**返回**:
- `issues` {string[]}: 问题列表

**示例**:
```javascript
const rules = {
    forbiddenTerms: ['老刘', '主人', '管理员'],
    isolationCheck: true
};

const issues = preHandler.checkPrivacy('老刘让我帮你', rules);
console.log(issues); // ['包含敏感词：老刘']
```

---

## 📋 配置

### 管理员 ID

在 `pre-handler.js` 中修改：

```javascript
const ADMIN_ID = 'ou_b96f5424607baf3a0455b55e0f4a2213';
```

### 隐私规则

在 `beforeHandle` 中自定义：

```javascript
message._privacyRules = {
    forbiddenTerms: [
        '老刘',
        '主人',
        '管理员',
        '你的敏感词'
    ],
    isolationCheck: true,
    noOtherUsers: true
};
```

---

## 🧪 测试

运行测试脚本：

```bash
cd ~/.openclaw/skills/multi-user-privacy/scripts
node test.js
```

预期输出：
```
🎉 所有测试通过！
```

---

## 📊 日志

### 访问日志

文件：`~/.openclaw/workspace/memory/privacy-audit.log`

格式：
```
[2026-03-20T13:00:00.000Z] User: ou_xxx | Admin: false | Action: message
```

### 隐私违规日志

文件：`~/.openclaw/workspace/memory/privacy-violations.log`

格式：
```
[2026-03-20T13:00:00.000Z] User: ou_xxx
Issues:
  - 包含敏感词：老刘
  - 可能泄露账号 ID: ou_xxx
Response Preview: ...
```

---

## 🔍 调试

### 启用详细日志

在 `pre-handler.js` 开头添加：

```javascript
process.env.PRIVACY_DEBUG = 'true';
```

### 查看日志

```bash
# 实时查看隐私审计日志
tail -f ~/.openclaw/workspace/memory/privacy-audit.log

# 查看隐私违规日志
tail -f ~/.openclaw/workspace/memory/privacy-violations.log
```

---

## ⚠️ 注意事项

1. **优先级**: Pre-Handler 优先级设为 100（最高），确保最先执行
2. **性能**: 每次消息处理都会调用，避免在 handler 中执行耗时操作
3. **错误处理**: Handler 中的错误不应影响主流程，已添加 try-catch
4. **隐私规则**: 只对普通用户启用，管理员不受限制

---

## 📝 更新日志

### v1.1.0 (2026-03-20)
- ✅ 添加 Pre-Handler 实时拦截
- ✅ 添加 Post-Handler 隐私检查
- ✅ 自动身份识别
- ✅ 上下文隔离
- ✅ 审计日志

### v1.0.0 (2026-03-18)
- ✅ 用户列表管理
- ✅ 基础隐私保护

---

**文档版本**: v1.1.0  
**最后更新**: 2026-03-20
