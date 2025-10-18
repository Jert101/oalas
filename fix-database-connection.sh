#!/bin/bash

echo "🔧 COMPREHENSIVE DATABASE CONNECTION FIX"
echo "========================================"

cd /var/www/oalass

echo "1. Checking current application status..."
pm2 status

echo -e "\n2. Stopping application..."
pm2 stop oalass

echo -e "\n3. Checking MySQL service..."
systemctl status mysql --no-pager -l

echo -e "\n4. Testing MySQL connection..."
mysql -u oalass_app -pKf6iQLW2Ci5fPQzcOBh1 -e "SELECT 'MySQL connection successful' as status;"

echo -e "\n5. Checking database tables..."
mysql -u oalass_app -pKf6iQLW2Ci5fPQzcOBh1 -e "USE oalass; SHOW TABLES;" | head -10

echo -e "\n6. Checking environment variables..."
if [ -f .env ]; then
    echo "✅ .env file exists"
    grep -E "DATABASE_URL|NODE_ENV" .env
else
    echo "❌ .env file not found"
fi

echo -e "\n7. Regenerating Prisma client..."
npm run db:generate

echo -e "\n8. Testing Prisma connection..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Prisma connected successfully');
    return prisma.users.count();
  })
  .then(count => {
    console.log('✅ Users count:', count);
    return prisma.\$disconnect();
  })
  .catch(error => {
    console.error('❌ Prisma error:', error.message);
    process.exit(1);
  });
"

echo -e "\n9. Rebuilding application..."
npm run build

echo -e "\n10. Starting application..."
pm2 start oalass

echo -e "\n11. Waiting for application to start..."
sleep 5

echo -e "\n12. Testing application health..."
curl -s http://127.0.0.1:3000/api/health

echo -e "\n13. Final application status..."
pm2 status

echo -e "\n🎉 Database connection fix completed!"