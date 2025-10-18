# Google OAuth Setup Guide

## 🚨 Current Issue
The Google OAuth is showing "invalid_client" error because the Google OAuth credentials are not properly configured.

## 🔧 Solution Steps

### 1. Create Environment File
Create a `.env` file in your project root with the following content:

```bash
# Database Configuration
DATABASE_URL="mysql://root@localhost:3306/oalass"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your-google-client-id-here"
GOOGLE_CLIENT_SECRET="your-google-client-secret-here"
GOOGLE_OAUTH_PROMPT="select_account"

# GitHub OAuth Configuration (Optional)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Email Configuration
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"

# Application Configuration
NODE_ENV="development"
```

### 2. Get Google OAuth Credentials

#### Step 2.1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable Google+ API and Google People API

#### Step 2.2: Create OAuth 2.0 Credentials
1. Go to "Credentials" in the left sidebar
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://ckcm-oala.site/api/auth/callback/google` (for production)
5. Copy the Client ID and Client Secret

#### Step 2.3: Update Environment Variables
Replace the placeholder values in your `.env` file:
```bash
GOOGLE_CLIENT_ID="your-actual-google-client-id"
GOOGLE_CLIENT_SECRET="your-actual-google-client-secret"
```

### 3. Generate NextAuth Secret
Generate a secure secret for NextAuth:
```bash
openssl rand -base64 32
```
Or use an online generator and update:
```bash
NEXTAUTH_SECRET="your-generated-secret-here"
```

### 4. Test Local Development
1. Start your development server:
   ```bash
   npm run dev
   ```
2. Test Google OAuth login at `http://localhost:3000`

## 🚀 Deployment Process

### Step 1: Fix Local System
1. Create `.env` file with proper credentials
2. Test Google OAuth locally
3. Commit changes to git

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Fix Google OAuth configuration"
git push origin main
```

### Step 3: Deploy to VPS
```bash
# SSH to VPS
ssh root@72.60.76.125

# Pull latest changes
cd /var/www/oala
git pull origin main

# Update environment variables on VPS
nano .env

# Restart application
pm2 restart oala
```

## 🔒 Security Notes

### Production Environment Variables
Make sure to set these on your VPS:
```bash
# Production Database
DATABASE_URL="mysql://root@localhost:3306/oalass"

# Production URLs
NEXTAUTH_URL="https://ckcm-oala.site"

# Google OAuth (same as development)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Secure NextAuth Secret
NEXTAUTH_SECRET="your-secure-production-secret"
```

### Domain Restrictions
The system is configured to only allow `@ckcm.edu.ph` email addresses for Google OAuth login.

## 📋 Checklist

- [ ] Create `.env` file with proper credentials
- [ ] Set up Google OAuth credentials in Google Cloud Console
- [ ] Test Google OAuth locally
- [ ] Commit and push changes to GitHub
- [ ] Update VPS environment variables
- [ ] Restart VPS application
- [ ] Test Google OAuth on production site

## 🆘 Troubleshooting

### Common Issues:
1. **"invalid_client" error**: Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correctly set
2. **"redirect_uri_mismatch"**: Ensure redirect URIs are properly configured in Google Cloud Console
3. **"access_denied"**: Check that the domain restriction is working (only @ckcm.edu.ph emails allowed)

### Debug Steps:
1. Check environment variables are loaded: `console.log(process.env.GOOGLE_CLIENT_ID)`
2. Verify Google Cloud Console configuration
3. Check browser network tab for OAuth errors
4. Review server logs for authentication errors
