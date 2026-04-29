#!/usr/bin/env bash
set -euo pipefail

# 从发布包还原（代码 + 前端 dist），然后你再 docker compose --build 重启即可。
#
# 用法：
#   ./restore-release.sh /data/ucar/releases/ucar-app-YYYYmmdd-HHMMSS.tar.gz [/data/ucar/releases/ucar-www-YYYYmmdd-HHMMSS.tar.gz]

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /path/to/ucar-app-*.tar.gz [/path/to/ucar-www-*.tar.gz]"
  exit 1
fi

APP_TAR="$1"
WWW_TAR="${2:-}"

APP_DIR="${APP_DIR:-/root/ucar}"
DATA_DIR="${DATA_DIR:-/data/ucar}"

if [[ ! -f "$APP_TAR" ]]; then
  echo "App archive not found: $APP_TAR"
  exit 1
fi

if [[ -n "$WWW_TAR" && ! -f "$WWW_TAR" ]]; then
  echo "WWW archive not found: $WWW_TAR"
  exit 1
fi

NOW="$(date +"%Y%m%d-%H%M%S")"

echo "Stopping services (best effort)..."
if [[ -f "$APP_DIR/docker/docker-compose.prod.2g.yml" && -f "$APP_DIR/docker/.env.prod" ]]; then
  (cd "$APP_DIR/docker" && docker compose -f docker-compose.prod.2g.yml --env-file .env.prod down) || true
fi

if [[ -d "$APP_DIR" ]]; then
  echo "Moving current app dir to: ${APP_DIR}.bak.${NOW}"
  mv "$APP_DIR" "${APP_DIR}.bak.${NOW}"
fi

echo "Restoring app -> ${APP_DIR}"
mkdir -p "$(dirname "$APP_DIR")"
tar -xzf "$APP_TAR" -C "$(dirname "$APP_DIR")"

if [[ -n "$WWW_TAR" ]]; then
  echo "Restoring www -> ${DATA_DIR}/www"
  mkdir -p "$DATA_DIR"
  tar -xzf "$WWW_TAR" -C "$DATA_DIR"
fi

echo "Done."
echo "Next:"
echo "  cd ${APP_DIR}/docker && docker compose -f docker-compose.prod.2g.yml --env-file .env.prod up -d --build"

