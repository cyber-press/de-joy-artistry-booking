#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
env_file=.env.production
if [[ ! -f $env_file ]]; then
  echo "Missing .env.production. Run sudo ./ops/bootstrap-ubuntu.sh first."
  exit 1
fi

set -a
source "$env_file"
set +a
for key in DOMAIN ACME_EMAIL POSTGRES_PASSWORD SETUP_TOKEN; do
  if [[ -z ${!key:-} || ${!key} == replace-* ]]; then
    echo "Set $key in .env.production before deployment."
    exit 1
  fi
done

docker compose --env-file "$env_file" -f docker-compose.production.yml build --pull
docker compose --env-file "$env_file" -f docker-compose.production.yml up -d --remove-orphans
docker compose --env-file "$env_file" -f docker-compose.production.yml ps
echo "Deployment started. Check https://${DOMAIN}/api/health and then complete owner setup at https://${DOMAIN}/admin"
