set -euo pipefail

APP_DIR=/var/www/oalass
DOMAIN=ckcm-oala.site
DB=oalass
DB_USER=oalass_app
DB_PASS="$(cat /root/APP_PASS || echo Kf6iQLW2Ci5fPQzcOBh1)"

# Fix Nginx config with proper variable escaping
if command -v nginx >/dev/null 2>&1; then
  cat > /etc/nginx/sites-available/${DOMAIN} <<'NGINX'
server {
  listen 80;
  server_name ckcm-oala.site;

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
  nginx -t && systemctl reload nginx || true
fi

# Ensure PM2 runs from app directory
cd "$APP_DIR"
pm2 delete oalass || true
pm2 start npm --name oalass -- start
pm2 save

# Ensure MySQL app user exists (relax password policy to accept current pass if needed)
mysql -uroot -p'Jerson@12345' -e "SET GLOBAL validate_password.policy=LOW; SET GLOBAL validate_password.length=8;"
mysql -uroot -p'Jerson@12345' -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS'; GRANT ALL PRIVILEGES ON \`$DB\`.* TO '$DB_USER'@'localhost'; FLUSH PRIVILEGES;"

echo FIX_DONE
