set -euo pipefail

APP_DIR=/var/www/oalass
DOMAIN=ckcm-oala.site
DB=oalass
DB_USER=oalass_app
DB_PASS="$(cat /root/APP_PASS || echo Kf6iQLW2Ci5fPQzcOBh1)"
NEXTAUTH_SECRET="$(cat /root/NEXTAUTH_SECRET || echo FPg72FVOHTh+9rzwB8wL4kUBZQrpG24QN+VJe6zzHGrE8wJupk35rTHLeKB0bJlw)"

echo "==> Ensure directories"
mkdir -p "$APP_DIR"

echo "==> MySQL: create DB/user/grants"
mysql -uroot -p'Jerson@12345' -e "
CREATE DATABASE IF NOT EXISTS \`$DB\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB\`.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
"

echo "==> Write .env"
cat > "$APP_DIR/.env" <<ENVEOF
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=oalass
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
NEXTAUTH_URL=https://${DOMAIN}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
DATABASE_URL=mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB}?connection_limit=5
PRISMA_LOG_LEVEL=warn

EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_ALLOWED_DOMAIN=

SESSION_STRATEGY=jwt
JWT_MAX_AGE=2592000
WS_PORT=4001
WS_HOST=0.0.0.0
WS_PUBLIC_URL=wss://${DOMAIN}/ws
TZ=Asia/Manila
ENVEOF
chmod 600 "$APP_DIR/.env"

echo "==> Extract app"
if [ -f /root/oalass-upload.tgz ]; then
  tar -xzf /root/oalass-upload.tgz -C "$APP_DIR"
fi

echo "==> Install deps and build"
cd "$APP_DIR"
npm ci || npm install
npx prisma generate
npx prisma migrate deploy || true
npm run build

echo "==> PM2 processes"
pm2 delete oalass || true
pm2 start "npm start" --name oalass --time
pm2 save

echo "==> Nginx (basic reverse proxy)"
if command -v nginx >/dev/null 2>&1; then
  cat >/etc/nginx/sites-available/${DOMAIN} <<NGINX
server {
  listen 80;
  server_name ${DOMAIN};
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
NGINX
  ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/${DOMAIN}
  nginx -t && systemctl reload nginx
fi

echo "==> Done."
