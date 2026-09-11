#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
backup_root="${BACKUP_DIR:-/var/backups/dejoy}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup_root"

docker compose --env-file .env.production -f docker-compose.production.yml exec -T database pg_dump -U dejoy -d dejoy -Fc > "$backup_root/database-${stamp}.dump"
docker compose --env-file .env.production -f docker-compose.production.yml exec -T app tar -czf - -C /app/uploads . > "$backup_root/uploads-${stamp}.tar.gz"
find "$backup_root" -type f -mtime +14 -delete
echo "Backup completed: $stamp"
