# 📧 SETUP GUIDE: Real Gmail Email Delivery for OALASS

## 🎯 Goal
Send actual emails to `jersoncatadman88@gmail.com` when probation periods end.

## 📋 Current Status
- ✅ Email system working with test service (Ethereal Email)
- ✅ Professional HTML email template created
- ✅ Email preview URLs generated: https://ethereal.email/message/aJOCJktUvPQAzHVraJOCK6qYuaj5H1NIAAAAA...
- ⚠️ **Need to configure Gmail SMTP for real delivery**

## 🔧 Setup Steps for Real Gmail Delivery

### Step 1: Enable Gmail App Password
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** in the left sidebar
3. Under "Signing in to Google", click **2-Step Verification**
4. Scroll down and click **App passwords**
5. Select **Mail** from the dropdown
6. Click **Generate**
7. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 2: Update Environment Variables
Edit `c:\Users\Lenovo\Documents\oalass\.env.local`:
```
GMAIL_USER="your-actual-gmail@gmail.com"
GMAIL_APP_PASSWORD="your-16-character-app-password"
```

### Step 3: Update Email Service Code
In `src/lib/real-email-service.ts`, find this comment:
```typescript
// IMPORTANT: For real Gmail, replace the test account setup above with:
```

Replace the test transporter with:
```typescript
const transporter = nodemailer.default.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})
```

### Step 4: Test Real Email Delivery
Run the test:
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/test/send-probation-email" -Method POST
```

## 📧 Alternative: Use Your Own Gmail Account

If you want to use your own Gmail to send emails:

1. **Set up your Gmail App Password** (steps above)
2. **Update .env.local**:
   ```
   GMAIL_USER="your-gmail@gmail.com"
   GMAIL_APP_PASSWORD="your-app-password"
   FROM_EMAIL="Your Name <your-gmail@gmail.com>"
   ```
3. **Update the email service** to use your Gmail

## 🚀 Quick Test Command

After setting up Gmail credentials:
```powershell
cd c:\Users\Lenovo\Documents\oalass
Invoke-WebRequest -Uri "http://localhost:3001/api/test/send-probation-email" -Method POST
```

## 📱 What You'll See

### Success Response:
```json
{
  "success": true,
  "message": "Email sent successfully!",
  "recipient": "jersoncatadman88@gmail.com",
  "userName": "Jersona l Catadmana jr",
  "messageId": "<unique-message-id>",
  "timestamp": "2025-08-07T..."
}
```

### In Your Inbox:
- **From:** OALASS HR Department
- **Subject:** 🎉 Congratulations! Your Probation Period is Complete - OALASS
- **Content:** Professional HTML email with company branding

## 🔍 Troubleshooting

### If Email Doesn't Arrive:
1. **Check spam folder**
2. **Verify Gmail App Password** is correct
3. **Ensure 2-factor authentication** is enabled
4. **Check server logs** for error messages

### If Setup Fails:
1. **Restart the development server** after updating .env.local
2. **Verify environment variables** are loaded correctly
3. **Check Gmail account security settings**

## 🎉 Expected Result

Once configured, `jersoncatadman88@gmail.com` will receive:
- Professional congratulations email
- Mobile-responsive HTML design
- Personalized content with user name
- Company branding and colors
- Clear information about promotion to Regular status

## 📞 Need Help?

The current preview email can be viewed at:
https://ethereal.email/message/aJOCJktUvPQAzHVraJOCK6qYuaj5H1NIAAAAA...

This shows exactly what the real email will look like once Gmail delivery is configured.
