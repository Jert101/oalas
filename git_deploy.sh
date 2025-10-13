#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/var/www/oalass
REPO=https://github.com/Jert101/oalas.git
BRANCH=main

mkdir -p "$APP_DIR"

# Preserve existing .env if present
ENV_TMP="/root/oalass.env.bak"
if [ -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env" "$ENV_TMP"
fi

if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch --all --prune
  git reset --hard "origin/${BRANCH}"
else
  rm -rf "$APP_DIR"
  git clone -b "$BRANCH" "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# Restore .env if we had it
if [ -f "$ENV_TMP" ]; then
  mv "$ENV_TMP" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
fi

# Install, migrate, build
npm ci || npm install
npx prisma generate
npx prisma migrate deploy || true
npm run build

# PM2
pm2 delete oalass || true
pm2 start "npm start" --name oalass --time
pm2 save

# Nginx reload if available
if command -v nginx >/dev/null 2>&1; then
  nginx -t && systemctl reload nginx || true
fi

echo GIT_DEPLOY_DONE