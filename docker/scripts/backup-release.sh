#!/usr/bin/env bash
set -euo pipefail

# 备份“可恢复一次发布所需的一切”（不备份容器层，节省磁盘）：
# - 后端/前端源码与部署文件（默认 /root/ucar）
# - PC 前端构建产物（默认 /data/ucar/www）
#
# 适用：你服务器不保留 .git，只想在部署前做一次“发布快照”

APP_DIR="${APP_DIR:-/root/ucar}"
DATA_DIR="${DATA_DIR:-/data/ucar}"
RELEASE_DIR="${RELEASE_DIR:-$DATA_DIR/releases}"

NOW="$(date +"%Y%m%d-%H%M%S")"
ARCHIVE_APP="${RELEASE_DIR}/ucar-app-${NOW}.tar.gz"
ARCHIVE_WWW="${RELEASE_DIR}/ucar-www-${NOW}.tar.gz"

mkdir -p "$RELEASE_DIR"

if [[ ! -d "$APP_DIR" ]]; then
  echo "APP_DIR not found: $APP_DIR"
  exit 1
fi

if [[ ! -d "$DATA_DIR" ]]; then
  echo "DATA_DIR not found: $DATA_DIR"
  exit 1
fi

echo "Backing up app dir: ${APP_DIR} -> ${ARCHIVE_APP}"
tar -czf "$ARCHIVE_APP" \
  --exclude="$APP_DIR/**/node_modules" \
  --exclude="$APP_DIR/**/dist" \
  --exclude="$APP_DIR/**/.git" \
  -C "$(dirname "$APP_DIR")" "$(basename "$APP_DIR")"

if [[ -d "$DATA_DIR/www" ]]; then
  echo "Backing up www dist: ${DATA_DIR}/www -> ${ARCHIVE_WWW}"
  tar -czf "$ARCHIVE_WWW" -C "$DATA_DIR" "www"
else
  echo "WARN: ${DATA_DIR}/www not found, skip www backup."
fi

# 默认保留最近 10 份发布包（2C2G/40G 机器避免占盘）
ls -1t "${RELEASE_DIR}"/ucar-*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm -f

echo "Done."
echo "App archive: $ARCHIVE_APP"
echo "WWW archive: $ARCHIVE_WWW"

