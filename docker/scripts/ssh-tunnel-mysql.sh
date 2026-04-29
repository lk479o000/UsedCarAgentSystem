#!/usr/bin/env bash
set -euo pipefail

# 用法：
#   SSH_KEY=/path/to/xxx.pem ./ssh-tunnel-mysql.sh root@<你的服务器公网IP> [本地端口]
# 然后你本地用数据库客户端连：127.0.0.1:<本地端口>
#
# 说明：
# - 生产建议 MySQL 不开公网，只通过 SSH 隧道连接（最安全也最方便）。

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 user@server_ip [local_port]"
  echo "With pem: SSH_KEY=/path/to/xxx.pem $0 user@server_ip [local_port]"
  echo "Example: $0 root@1.2.3.4 13306"
  exit 1
fi

TARGET="$1"
LOCAL_PORT="${2:-${LOCAL_PORT:-13306}}"
REMOTE_PORT="${REMOTE_PORT:-3306}"
SSH_KEY="${SSH_KEY:-}"

echo "Creating SSH tunnel: 127.0.0.1:${LOCAL_PORT} -> ${TARGET}:127.0.0.1:${REMOTE_PORT}"
echo "Press Ctrl+C to stop."

SSH_ARGS=()
SSH_ARGS+=(-N)
SSH_ARGS+=(-L "127.0.0.1:${LOCAL_PORT}:127.0.0.1:${REMOTE_PORT}")
SSH_ARGS+=(-o ExitOnForwardFailure=yes)
SSH_ARGS+=(-o ServerAliveInterval=30)
SSH_ARGS+=(-o ServerAliveCountMax=3)
if [[ -n "$SSH_KEY" ]]; then
  SSH_ARGS+=(-i "$SSH_KEY")
  SSH_ARGS+=(-o IdentitiesOnly=yes)
fi

ssh "${SSH_ARGS[@]}" "${TARGET}"

