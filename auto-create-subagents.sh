#!/bin/bash
# Auto-Create SubAgents - 定期检查并创建 pending 的子代理
# 添加到 crontab: */5 * * * * ~/.openclaw/skills/multi-user-privacy/auto-create-subagents.sh

SKILL_DIR="$HOME/.openclaw/skills/multi-user-privacy"
PENDING_FILE="$SKILL_DIR/.pending-sessions.json"
LOG_FILE="$HOME/.openclaw/logs/subagent-create.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "开始检查 pending sessions..."

if [ ! -f "$PENDING_FILE" ]; then
    log "✅ 没有 pending 的 sessions"
    exit 0
fi

# 读取 pending 队列
PENDING_COUNT=$(cat "$PENDING_FILE" | grep -c '"userId"' || echo "0")

if [ "$PENDING_COUNT" -eq 0 ]; then
    log "✅ pending 队列为空"
    exit 0
fi

log "发现 $PENDING_COUNT 个 pending sessions"

# 处理每个 pending session
node -e "
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pendingFile = '$PENDING_FILE';
const logFile = '$LOG_FILE';

function log(msg) {
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
    fs.appendFileSync(logFile, \`[\${timestamp}] \${msg}\\n\`);
}

try {
    const pending = JSON.parse(fs.readFileSync(pendingFile, 'utf-8'));
    
    if (pending.length === 0) {
        log('✅ pending 队列为空');
        process.exit(0);
    }
    
    log(\`🔄 开始处理 \${pending.length} 个 pending sessions\`);
    
    const completed = [];
    
    for (const session of pending) {
        if (session.status === 'created') {
            continue;
        }
        
        log(\`🆕 创建子代理：\${session.userName} (\${session.userId})\`);
        
        try {
            // 调用 sessions_spawn
            const cmd = \`openclaw sessions spawn --task=\"\${session.task}\" --label=\"\${session.label}\" --runtime=\"subagent\" --mode=\"run\"\`;
            log(\`执行：\${cmd}\`);
            
            const result = execSync(cmd, { encoding: 'utf-8' });
            log(\`✅ 创建成功：\${result}\`);
            
            session.status = 'created';
            session.createdAt = new Date().toISOString();
            completed.push(session);
            
        } catch (e) {
            log(\`❌ 创建失败：\${e.message}\`);
        }
    }
    
    // 保存更新
    fs.writeFileSync(pendingFile, JSON.stringify(pending, null, 2), 'utf-8');
    log(\`✅ 处理完成，创建成功：\${completed.length}\`);
    
} catch (e) {
    log(\`❌ 错误：\${e.message}\`);
}
" 2>&1 | tee -a "$LOG_FILE"

log "检查完成"
