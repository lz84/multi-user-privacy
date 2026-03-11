#!/usr/bin/env node

/**
 * 对话隔离自动检查 Hook
 * 
 * 用法：在 OpenClaw 主入口调用
 * node /home/user/.openclaw/skills/multi-user-privacy/auto-check-hook.js
 */

const privacyGuard = require('./privacy-guard');
const fs = require('fs');
const path = require('path');

// 从环境变量或运行时文件获取上下文
function getCurrentContext() {
  // 尝试从环境变量读取
  const contextEnv = process.env.OPENCLAW_CONTEXT;
  if (contextEnv) {
    try {
      return JSON.parse(contextEnv);
    } catch (e) {
      console.warn('Warning: Invalid OPENCLAW_CONTEXT');
    }
  }
  
  // 尝试从运行时文件读取
  const contextFile = path.join(process.env.HOME, '.openclaw', 'runtime', 'current-context.json');
  if (fs.existsSync(contextFile)) {
    try {
      return JSON.parse(fs.readFileSync(contextFile, 'utf-8'));
    } catch (e) {
      console.warn('Warning: Cannot read current-context.json');
    }
  }
  
  return null;
}

// 主函数
function main() {
  const context = getCurrentContext();
  
  if (!context) {
    console.log('[AutoCheck] ⚠️  未提供上下文，跳过检查');
    console.log('提示：设置 OPENCLAW_CONTEXT 环境变量或创建 current-context.json 文件');
    process.exit(0);
  }
  
  // 执行对话前检查
  const result = privacyGuard.preCheck(context);
  
  if (result.status === 'PASS') {
    console.log(`[AutoCheck] ✅ 检查通过`);
    console.log(`  用户：${result.userId}`);
    console.log(`  身份：${result.isAdmin ? '管理员' : '普通用户'}`);
    console.log(`  记忆：${result.memory.loaded.length} 个已加载`);
    
    // 输出到 stdout，供主程序读取
    console.log(`\n[AutoCheck] CONTEXT: ${JSON.stringify({
      userId: result.userId,
      isAdmin: result.isAdmin,
      timestamp: result.timestamp
    })}`);
    
    process.exit(0);
  } else {
    console.log(`[AutoCheck] ❌ 检查失败：${result.error}`);
    process.exit(1);
  }
}

main();
