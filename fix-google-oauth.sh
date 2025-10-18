#!/bin/bash

# Google OAuth Fix Script for OALAS
# This script helps you fix the Google OAuth configuration

echo "🔧 Google OAuth Configuration Fix"
echo "================================="
echo ""

echo "🚨 ISSUE IDENTIFIED:"
echo "The system is using placeholder values instead of actual Google OAuth credentials."
echo "Current values: GOOGLE_CLIENT_ID='{{GOOGLE_CLIENT_ID}}'"
echo ""

echo "📋 SOLUTION STEPS:"
echo ""

echo "1️⃣ Get Google OAuth Credentials:"
echo "   • Go to: https://console.cloud.google.com/"
echo "   • Create/select a project"
echo "   • Enable Google+ API and Google People API"
echo "   • Go to 'Credentials' → 'Create Credentials' → 'OAuth 2.0 Client IDs'"
echo "   • Choose 'Web application'"
echo "   • Add redirect URIs:"
echo "     - http://localhost:3000/api/auth/callback/google"
echo "     - https://ckcm-oala.site/api/auth/callback/google"
echo "   • Copy the Client ID and Client Secret"
echo ""

echo "2️⃣ Update VPS Environment Variables:"
echo "   ssh root@72.60.76.125"
echo "   cd /var/www/oala"
echo "   nano .env"
echo ""

echo "3️⃣ Replace these placeholder values:"
echo "   GOOGLE_CLIENT_ID=\"{{GOOGLE_CLIENT_ID}}\"     → GOOGLE_CLIENT_ID=\"your-actual-client-id\""
echo "   GOOGLE_CLIENT_SECRET=\"{{GOOGLE_CLIENT_SECRET}}\" → GOOGLE_CLIENT_SECRET=\"your-actual-client-secret\""
echo "   NEXTAUTH_SECRET=\"{{NEXTAUTH_SECRET}}\"       → NEXTAUTH_SECRET=\"your-secure-random-string\""
echo ""

echo "4️⃣ Generate NextAuth Secret:"
echo "   openssl rand -base64 32"
echo ""

echo "5️⃣ Restart Application:"
echo "   pm2 restart oala"
echo ""

echo "6️⃣ Test Google OAuth:"
echo "   Visit: https://ckcm-oala.site"
echo "   Click 'Continue with Google'"
echo ""

echo "🔒 SECURITY NOTES:"
echo "• Only @ckcm.edu.ph emails are allowed (configured in code)"
echo "• Use strong, unique secrets for production"
echo "• Keep credentials secure and never commit them to git"
echo ""

echo "📞 NEED HELP?"
echo "• Check GOOGLE_OAUTH_SETUP_GUIDE.md for detailed instructions"
echo "• Verify redirect URIs in Google Cloud Console"
echo "• Test with CKCM email accounts only"
echo ""

echo "✅ After fixing, Google OAuth will work properly!"
