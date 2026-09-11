#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run this script as root: sudo ./ops/bootstrap-ubuntu.sh"
  exit 1
fi

if [[ ! -f .env.production ]]; then
  cp .env.production.example .env.production
  postgres_password="$(openssl rand -hex 24)"
  setup_token="$(openssl rand -hex 32)"
  sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${postgres_password}|" .env.production
  sed -i "s|^SETUP_TOKEN=.*|SETUP_TOKEN=${setup_token}|" .env.production
  chmod 600 .env.production
  echo "Created .env.production with generated secrets. Set DOMAIN and ACME_EMAIL before launch."
fi

apt-get update
apt-get install -y ca-certificates curl gnupg openssl ufw
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
printf '%s\n' "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo \"${UBUNTU_CODENAME:-$VERSION_CODENAME}\") stable" > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

echo "Bootstrap complete. Edit .env.production, point DNS to this server, then run ./ops/deploy.sh."
