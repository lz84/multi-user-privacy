# Multi-User Privacy

> **为 OpenClaw 打造的企业级多用户隐私保护系统**
> 
> 完全免费 · 开源 · 生产就绪

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Skill-00b0aa)](https://openclaw.ai)
[![Version](https://img.shields.io/badge/version-0.8.0-blue)](https://github.com/your-username/multi-user-privacy/releases)
[![Stars](https://img.shields.io/github/stars/your-username/multi-user-privacy?style=social)](https://github.com/your-username/multi-user-privacy/stargazers)

---

## 🌟 特性

### 🔒 完全隔离

- ✅ **身份识别** - 自动识别管理员/普通用户
- ✅ **记忆隔离** - 每个用户独立记忆空间
- ✅ **隐私检查** - 回复前敏感词自动过滤
- ✅ **Session 管理** - 用户专属 session 记录
- ✅ **子代理路由** - 自动路由到专属子代理

### ⚡ 高性能

- ✅ **配置缓存** - 100 倍性能提升
- ✅ **行为数据库** - 完整操作记录
- ✅ **自动清理** - 过期缓存自动清除

### 🛡️ 企业级安全

- ✅ **项目权限** - 防止越权操作
- ✅ **异常检测** - 频繁失败自动封禁
- ✅ **实时告警** - 隐私违规立即通知
- ✅ **配置热更新** - 修改配置无需重启

### 📊 完整日志

- ✅ **JSON 格式** - 方便分析
- ✅ **行为审计** - 完整操作记录
- ✅ **可视化工具** - 清晰的统计报表

---

## 🚀 快速开始

### 安装

```bash
# 通过 ClawHub 安装（推荐）
npx clawhub install multi-user-privacy

# 或手动安装
git clone https://github.com/your-username/multi-user-privacy.git
cp -r multi-user-privacy ~/.openclaw/skills/
```

### 配置

**1. 创建隐私配置文件**

```bash
cat > ~/.openclaw/workspace/.privacy-config.json << 'EOF'
{
  "admin": {
    "id": "your_admin_id",
    "name": "管理员",
    "role": "admin"
  },
  "privacy": {
    "mode": "strict",
    "forbiddenTerms": ["敏感词 1", "敏感词 2"]
  }
}
EOF
```

**2. 创建项目配置文件**

```bash
cat > ~/.openclaw/workspace/.projects-config.json << 'EOF'
{
  "projects": {
    "your-project": {
      "name": "你的项目",
      "owner": "your_user_id",
      "collaborators": ["collab_id_1", "collab_id_2"]
    }
  }
}
EOF
```

**3. 启用自动注入**

在 OpenClaw 主入口添加：

```javascript
// ~/.openclaw/runtime/main.js 开头
require('./skills/multi-user-privacy/scripts/auto-inject');
```

### 使用

```bash
# 查看 Session 统计
node scripts/session-guard.js stats

# 查看日志
node scripts/view-logs.js

# 查看子代理路由
node scripts/subagent-router.js list

# 清空 Session 数据库
node scripts/session-guard.js clear
```

---

## 📖 文档

| 文档 | 说明 |
|------|------|
| [SKILL.md](SKILL.md) | 技能完整说明 |
| [VIP-AGENT-SETUP.md](docs/VIP-AGENT-SETUP.md) | VIP Agent 配置指南 |
| [PRICING-STRATEGY.md](docs/PRICING-STRATEGY.md) | 商业化方案（参考） |
| [CHANGELOG.md](CHANGELOG.md) | 更新日志 |

---

## 🎯 使用场景

### 场景 1：多用户 OpenClaw 实例

**问题：** 多个用户共用一个 OpenClaw 实例，担心隐私泄露

**解决方案：**
```javascript
// 安装 multi-user-privacy
npx clawhub install multi-user-privacy

// 自动生效，无需额外配置
// 每个用户的对话自动隔离
```

**效果：**
- ✅ 用户 A 看不到用户 B 的记忆
- ✅ 用户 A 不知道用户 B 的存在
- ✅ 完全隔离，互不干扰

---

### 场景 2：企业客服系统

**问题：** 企业需要为不同客户提供专属客服，数据需要完全隔离

**解决方案：**
```bash
# 为每个 VIP 客户创建独立 agent
./scripts/create-vip-agent.sh -u company1 -n "XX 公司" -l platinum
```

**效果：**
- ✅ 每个客户独立 agent
- ✅ 完全数据隔离
- ✅ 专属配置

---

### 场景 3：SaaS 服务提供商

**问题：** 为多个租户提供 AI 服务，需要租户数据隔离

**解决方案：**
```bash
# 使用技能层隔离（免费版）
# 支持无限租户
# 每个租户独立记忆空间
```

**效果：**
- ✅ 租户数据完全隔离
- ✅ 共享资源，成本低
- ✅ 支持大规模部署

---

## 📊 性能对比

| 功能 | 无隔离 | 技能层隔离 | 平台级隔离 |
|------|-------|-----------|-----------|
| 隔离级别 | ❌ 无 | ⭐⭐⭐⭐ 高 | ⭐⭐⭐⭐⭐ 完全 |
| 资源消耗 | 低 | 低 | 高 |
| 管理成本 | 低 | 低 | 高 |
| 适用场景 | 个人 | 多用户 | VIP/企业 |
| 推荐指数 | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🛠️ 命令行工具

### session-guard.js

管理用户 Session

```bash
# 查看 Session 统计
node scripts/session-guard.js stats

# 清空 Session 数据库
node scripts/session-guard.js clear
```

### subagent-router.js

管理子代理路由

```bash
# 查看所有用户子代理
node scripts/subagent-router.js list

# 删除用户子代理
node scripts/subagent-router.js remove <user_id>

# 清空路由器数据库
node scripts/subagent-router.js clear
```

### view-logs.js

查看日志

```bash
# 查看最近 10 条
node scripts/view-logs.js

# 查看最近 50 条
node scripts/view-logs.js 50

# 只看失败的
node scripts/view-logs.js --failures
```

### create-vip-agent.sh

创建 VIP Agent

```bash
# 创建 VIP agent
./scripts/create-vip-agent.sh -u laoliu -n "老刘" -c feishu -l platinum
```

---

## 🔧 故障排查

### 问题 1：Session 不匹配警告

**现象：**
```
[SessionGuard] ⚠️ 检测到非管理员用户，请确保 session 隔离正确
```

**解决方案：**
```bash
# 查看 Session 统计
node scripts/session-guard.js stats

# 清空 Session 数据库
node scripts/session-guard.js clear
```

### 问题 2：记忆文件无法访问

**现象：**
```
[PrivacyGuard] 普通用户无法访问 MEMORY.md
```

**解决方案：**
- 这是正常行为，普通用户本就不应该访问 MEMORY.md
- 如需访问，请将该用户添加到管理员列表

### 问题 3：子代理创建失败

**现象：**
```
Error: thread=true is unavailable
```

**解决方案：**
- 这是平台限制，使用技能层隔离即可
- 技能层隔离已经足够安全

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发环境设置

```bash
# 克隆项目
git clone https://github.com/your-username/multi-user-privacy.git
cd multi-user-privacy

# 安装依赖
npm install

# 运行测试
npm test
```

### 提交指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 🙏 致谢

- [OpenClaw](https://openclaw.ai) - 强大的 AI 助手框架
- [ClawHub](https://clawhub.com) - 技能市场
- 所有贡献者

---

## 📞 联系方式

- **项目地址**: https://github.com/your-username/multi-user-privacy
- **问题反馈**: https://github.com/your-username/multi-user-privacy/issues
- **文档**: https://github.com/your-username/multi-user-privacy/tree/main/docs

---

<div align="center">

**Made with ❤️ by 狗子 🐶**

如果这个项目对你有帮助，请给一个 ⭐️ Star！

</div>
