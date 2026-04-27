#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.prod}"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.prod.yml}"
DATA_DIR="${DATA_DIR:-/data/ucar}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  echo "Copy $ROOT_DIR/.env.prod.example to $ROOT_DIR/.env.prod and edit it."
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

BACKUP_DIR="$DATA_DIR/backup"
mkdir -p "$BACKUP_DIR"

NOW="$(date +"%Y%m%d-%H%M%S")"
OUT="$BACKUP_DIR/${MYSQL_DATABASE}-${NOW}.sql.gz"

echo "Backing up database '${MYSQL_DATABASE}' -> ${OUT}"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T mysql \
  mysqldump -uroot -p"${MYSQL_ROOT_PASSWORD}" \
  --single-transaction --quick --routines --events --triggers \
  "${MYSQL_DATABASE}" | gzip > "$OUT"

# 保留最近 14 天备份（你可按需改）
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +14 -delete

echo "Done."

