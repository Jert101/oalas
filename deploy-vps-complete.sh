#!/bin/bash

# Complete VPS Deployment Script for OALA System
# This script performs a complete wipe and redeployment

set -euo pipefail

VPS_HOST="72.60.76.125"
DOMAIN="ckcm-oala.site"
DB_NAME="oala"
APP_DIR="/var/www/oala"

echo "🚀 Starting complete VPS deployment for OALA system..."

# Step 1: Clean VPS Environment
echo "🧹 Step 1: Cleaning VPS environment..."
ssh root@$VPS_HOST << 'EOF'
    # Stop all PM2 processes
    pm2 stop all || true
    pm2 delete all || true
    
    # Remove old files
    rm -rf /var/www/* /root/* /home/*
    
    # Reset Nginx
    rm -rf /etc/nginx/sites-enabled/* /etc/nginx/sites-available/*
    systemctl restart nginx || true
    
    echo "✅ VPS cleanup completed"
EOF

# Step 2: Install Dependencies
echo "⚙️ Step 2: Installing dependencies..."
ssh root@$VPS_HOST << 'EOF'
    apt update -y
    apt install -y git nodejs npm mysql-server nginx
    npm install -g pm2
    
    # Start and enable services
    systemctl start mysql
    systemctl enable mysql
    systemctl start nginx
    systemctl enable nginx
    
    echo "✅ Dependencies installed"
EOF

# Step 3: Setup Database
echo "🗃️ Step 3: Setting up database..."
ssh root@$VPS_HOST << EOF
    mysql -u root -e "DROP DATABASE IF EXISTS $DB_NAME; CREATE DATABASE $DB_NAME;"
    echo "✅ Database created"
EOF

# Step 4: Clone Repository
echo "📥 Step 4: Cloning repository..."
ssh root@$VPS_HOST << EOF
    mkdir -p $APP_DIR
    cd $APP_DIR
    git clone https://github.com/Jert101/oalas.git .
    npm install
    echo "✅ Repository cloned and dependencies installed"
EOF

# Step 5: Create Environment File
echo "🔧 Step 5: Creating environment configuration..."
ssh root@$VPS_HOST << EOF
    cat > $APP_DIR/.env << 'ENVEOF'
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=oalass
NEXT_PUBLIC_SITE_URL=https://$DOMAIN
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=FPg72FVOHTh+9rzwB8wL4kUBZQrpG24QN+VJe6zzHGrE8wJupk35rTHLeKB0bJlw
DATABASE_URL=mysql://root:@localhost:3306/$DB_NAME?connection_limit=5
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
WS_PUBLIC_URL=wss://$DOMAIN/ws
TZ=Asia/Manila
ENVEOF
    chmod 600 $APP_DIR/.env
    echo "✅ Environment file created"
EOF

# Step 6: Setup Database Schema
echo "🏗️ Step 6: Setting up database schema..."
ssh root@$VPS_HOST << EOF
    cd $APP_DIR
    npx prisma generate
    npx prisma db push
    echo "✅ Database schema created"
EOF

# Step 7: Transfer and Import CSV Data
echo "📊 Step 7: Transferring and importing CSV data..."
scp -r csv_export_complete_2025-09-28T03-46-32 root@$VPS_HOST:$APP_DIR/

ssh root@$VPS_HOST << 'EOF'
    cd /var/www/oala/csv_export_complete_2025-09-28T03-46-32
    
    # Import data in dependency order
    mysql -u root oala -e "LOAD DATA LOCAL INFILE 'roleCategory.csv' INTO TABLE role_categories FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;" || true
    mysql -u root oala -e "LOAD DATA LOCAL INFILE 'role.csv' INTO TABLE roles FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;" || true
    mysql -u root oala -e "LOAD DATA LOCAL INFILE 'status.csv' INTO TABLE statuses FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;" || true
    mysql -u root oala -e "LOAD DATA LOCAL INFILE 'department.csv' INTO TABLE departments FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;" || true
    mysql -u root oala -e "LOAD DATA LOCAL INFILE 'termType.csv' INTO TABLE term_types FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;" || true
    mysql -u root oala -e "LOAD DATA LOCAL INFILE 'leave_types.csv' INTO TABLE leave_types FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;" || true
    mysql -u root oala -e "LOAD DATA LOCAL INFILE 'user.csv' INTO TABLE users FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;" || true
    mysql -u root oala -e "LOAD DATA LOCAL INFILE 'account.csv' INTO TABLE accounts FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;" || true
    mysql -u root oala -e "LOAD DATA LOCAL INFILE 'calendarPeriod.csv' INTO TABLE calendar_periods FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;" || true
    mysql -u root oala -e "LOAD DATA LOCAL INFILE 'leaveTypeFormField.csv' INTO TABLE leave_type_form_fields FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;" || true
    mysql -u root oala -e "LOAD DATA LOCAL INFILE 'leaveLimit.csv' INTO TABLE leave_limits FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;" || true
    mysql -u root oala -e "LOAD DATA LOCAL INFILE 'leaveBalance.csv' INTO TABLE leave_balances FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;" || true
    
    echo "✅ CSV data imported"
EOF

# Step 8: Build Application
echo "🔨 Step 8: Building application..."
ssh root@$VPS_HOST << EOF
    cd $APP_DIR
    npm run build
    echo "✅ Application built"
EOF

# Step 9: Start Application with PM2
echo "🚀 Step 9: Starting application..."
ssh root@$VPS_HOST << EOF
    cd $APP_DIR
    pm2 start npm --name "oala" -- run start
    pm2 save
    pm2 startup
    echo "✅ Application started with PM2"
EOF

# Step 10: Configure Nginx
echo "🌐 Step 10: Configuring Nginx..."
ssh root@$VPS_HOST << EOF
    cat > /etc/nginx/sites-available/oala << 'NGINXEOF'
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF
    
    ln -s /etc/nginx/sites-available/oala /etc/nginx/sites-enabled/
    nginx -t
    systemctl restart nginx
    echo "✅ Nginx configured"
EOF

# Step 11: Verify Deployment
echo "✅ Step 11: Verifying deployment..."
ssh root@$VPS_HOST << 'EOF'
    echo "PM2 Status:"
    pm2 list
    
    echo "Nginx Status:"
    systemctl status nginx --no-pager -l
    
    echo "MySQL Status:"
    systemctl status mysql --no-pager -l
    
    echo "Application Test:"
    curl -I http://localhost:3000 || echo "Application not responding on localhost:3000"
    
    echo "Domain Test:"
    curl -I http://ckcm-oala.site || echo "Domain not responding"
EOF

echo "🎉 Deployment completed! Check the output above for any issues."
echo "🌐 Your application should be available at: https://$DOMAIN"
echo "📊 Check PM2 status with: ssh root@$VPS_HOST 'pm2 list'"
echo "📝 Check logs with: ssh root@$VPS_HOST 'pm2 logs oala'"
