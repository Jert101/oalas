# VPS Database Access with Prisma Studio

## Method 1: Direct Connection (Recommended)

1. **Create a temporary .env file for VPS connection:**
   ```bash
   # Copy your current .env file
   cp .env .env.backup
   
   # Create new .env with VPS connection
   echo 'DATABASE_URL="mysql://root:oalass123@72.60.76.125:3306/oalass"' > .env.vps
   ```

2. **Run Prisma Studio with VPS connection:**
   ```bash
   # Use the VPS environment file
   cp .env.vps .env
   npx prisma studio --port 5555
   ```

3. **Access Prisma Studio:**
   - Open your browser and go to: `http://localhost:5555`
   - You'll see all your VPS database tables with a beautiful UI

## Method 2: SSH Tunnel (More Secure)

1. **Create SSH tunnel to VPS database:**
   ```bash
   ssh -L 3307:localhost:3306 root@72.60.76.125
   ```

2. **In another terminal, run Prisma Studio:**
   ```bash
   DATABASE_URL="mysql://root:oalass123@localhost:3307/oalass" npx prisma studio --port 5555
   ```

## Method 3: Direct VPS Access

1. **SSH into your VPS:**
   ```bash
   ssh root@72.60.76.125
   ```

2. **Navigate to your app directory:**
   ```bash
   cd /var/www/oala
   ```

3. **Run Prisma Studio on VPS:**
   ```bash
   npx prisma studio --host 0.0.0.0 --port 5555
   ```

4. **Access via browser:**
   - Go to: `http://72.60.76.125:5555`
   - (Make sure port 5555 is open in your VPS firewall)

## Important Notes:

- **Backup your current .env** before making changes
- **Restore your local .env** after viewing the VPS database
- **Port 5555** is the default Prisma Studio port
- **Database credentials** may need adjustment based on your VPS setup

## Troubleshooting:

- If connection fails, check VPS firewall settings
- Ensure MySQL is configured to accept remote connections
- Verify database credentials are correct
- Check if MySQL port 3306 is accessible from your IP
