#!/bin/bash

echo "========================================"
echo "    COMPLETE CACHE FIX FOR OALASS"
echo "========================================"
echo ""

echo "Step 1: Clear all server-side caches"
ssh root@72.60.76.125 "cd /var/www/oalass && rm -rf .next && rm -rf node_modules/.cache && npm cache clean --force"

echo ""
echo "Step 2: Clear nginx cache (if any)"
ssh root@72.60.76.125 "rm -rf /var/cache/nginx/* 2>/dev/null || true"

echo ""
echo "Step 3: Reload nginx configuration"
ssh root@72.60.76.125 "nginx -s reload"

echo ""
echo "Step 4: Force rebuild application"
ssh root@72.60.76.125 "cd /var/www/oalass && npm run build"

echo ""
echo "Step 5: Restart application with fresh build"
ssh root@72.60.76.125 "cd /var/www/oalass && pm2 restart oalass"

echo ""
echo "Step 6: Add cache-busting headers to nginx"
ssh root@72.60.76.125 "cat > /etc/nginx/sites-available/ckcm-oala.site << 'EOF'
server {
  server_name ckcm-oala.site;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    
    # Force no caching
    add_header Cache-Control \"no-cache, no-store, must-revalidate\";
    add_header Pragma \"no-cache\";
    add_header Expires \"0\";
  }

  listen 443 ssl;
  ssl_certificate /etc/letsencrypt/live/ckcm-oala.site-0001/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/ckcm-oala.site-0001/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
  if (\$host = ckcm-oala.site) {
    return 301 https://\$host\$request_uri;
  }
  listen 80;
  server_name ckcm-oala.site;
  return 404;
}
EOF"

echo ""
echo "Step 7: Test nginx configuration and reload"
ssh root@72.60.76.125 "nginx -t && nginx -s reload"

echo ""
echo "Step 8: Verify application status"
ssh root@72.60.76.125 "cd /var/www/oalass && pm2 status"

echo ""
echo "Step 9: Test the application"
ssh root@72.60.76.125 "curl -I http://127.0.0.1:3000/admin/manage-accounts"

echo ""
echo "========================================"
echo "    CACHE FIX COMPLETED"
echo "========================================"
echo ""
echo "The following caches have been cleared:"
echo "✅ Next.js build cache (.next)"
echo "✅ Node modules cache"
echo "✅ NPM cache"
echo "✅ Nginx cache"
echo "✅ Added no-cache headers"
echo ""
echo "Test your application now:"
echo "https://ckcm-oala.site"
echo ""
echo "If changes still don't appear, try:"
echo "1. Hard refresh: Ctrl+F5"
echo "2. Incognito/Private mode"
echo "3. Clear browser cache completely"
echo "4. Different browser"
echo ""

