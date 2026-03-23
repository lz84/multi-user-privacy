# 方案 A vs 方案 B+ - 对比分析

**日期**: 2026-03-20  
**目的**: 选择最佳的多用户隐私保护实现方案

---

## 📊 方案对比

| 维度 | 方案 A（运行时注入） | 方案 B+（技能自动激活）✅ |
|------|---------------------|------------------------|
| **修改 OpenClaw 源码** | ❌ 需要修改 runtime/main.js | ✅ **不需要** |
| **开箱即用** | ❌ 需要手动配置 | ✅ **完全开箱即用** |
| **升级兼容性** | ❌ 升级会被覆盖 | ✅ **不受影响** |
| **实现复杂度** | 低 | 中（Module._load 钩子） |
| **可靠性** | 高（直接注入） | 高（拦截模块加载） |
| **性能影响** | ~5ms/消息 | ~5ms/消息 |
| **维护成本** | 高（需同步源码更新） | 低（独立技能） |
| **技能市场发布** | ❌ 不适合 | ✅ **适合** |

---

## 🔍 方案 A 分析

### 实现方式
```javascript
// 修改 ~/.openclaw/runtime/main.js
require('./skills/multi-user-privacy/scripts/auto-inject');
```

### 优点
1. ✅ 实现简单
2. ✅ 直接控制消息处理流程
3. ✅ 可靠性高

### 缺点
1. ❌ **需要修改 OpenClaw 源码**
2. ❌ 升级 OpenClaw 时会被覆盖
3. ❌ 需要手动配置，不是开箱即用
4. ❌ 不适合发布到技能市场

---

## 🔍 方案 B+ 分析

### 实现方式
```javascript
// 无需修改任何文件
// 技能加载时自动激活
require('./skills/multi-user-privacy/scripts/auto-activate');
```

### 优点
1. ✅ **无需修改 OpenClaw 源码**
2. ✅ **开箱即用**
3. ✅ 升级不受影响
4. ✅ 适合发布到技能市场
5. ✅ 完全独立，自包含

### 缺点
1. ⚠️ 使用 Module._load 钩子，实现稍复杂
2. ⚠️ 依赖模块加载顺序（已处理）

---

## 🎯 推荐方案：B+ ✅

### 理由

1. **无需修改源码** - 最重要！不侵入 OpenClaw 核心
2. **开箱即用** - 安装即可用，用户体验好
3. **升级兼容** - OpenClaw 升级不影响技能
4. **技能市场** - 可以发布到 ClawHub，让更多人使用
5. **独立性** - 技能完全自包含，易维护

---

## 📝 实现细节

### 方案 B+ 的核心机制

```javascript
// scripts/auto-activate.js

// 1. 拦截 Node.js 模块加载
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    const exported = originalLoad.apply(this, arguments);
    
    // 2. 检查是否是目标模块（openclaw, runtime 等）
    if (TARGET_MODULES.some(target => request.includes(target))) {
        // 3. 注入 Pre-Handler
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

### 为什么能开箱即用？

1. **技能目录约定** - OpenClaw 会自动加载 `~/.openclaw/skills/` 下的技能
2. **Module._load 钩子** - 在模块加载时拦截，不需要修改源码
3. **自动激活** - 技能文件被 require 时自动执行

---

## 🧪 测试验证

### 方案 B+ 测试

```bash
cd ~/.openclaw/skills/multi-user-privacy/scripts
node test.js
```

**结果**：
```
✅ 管理员身份识别
✅ 普通用户身份识别
✅ 隐私检查 - 敏感词
✅ 隐私检查 - 账号 ID
✅ 正常消息

通过率：5/5 (100%)
```

---

## 📦 发布到 ClawHub

方案 B+ 可以发布到技能市场：

```bash
# 打包技能
npx clawhub publish ~/.openclaw/skills/multi-user-privacy

# 其他人安装
npx clawhub install multi-user-privacy
```

**安装后自动生效**，无需任何配置！

---

## ⚠️ 注意事项

### 方案 B+ 的限制

1. **模块加载顺序** - 必须在目标模块之前加载
   - 解决：技能放在 skills 目录，OpenClaw 会优先加载

2. **Node.js 版本** - 需要 Node.js 12+
   - 原因：Module._load API 兼容性

3. **多进程环境** - 每个进程都需要激活
   - 解决：在每个 worker 中 require auto-activate

---

## 🎉 结论

**推荐方案 B+**，因为：

1. ✅ 无需修改 OpenClaw 源码
2. ✅ 开箱即用
3. ✅ 升级兼容
4. ✅ 适合技能市场发布
5. ✅ 测试通过（5/5）

**方案 A 适用场景**：
- 需要深度集成到 OpenClaw 核心
- 控制整个消息处理流程
- 不打算发布到技能市场

---

**建议**: 使用方案 B+，实现开箱即用的多用户隐私保护技能！🐶
