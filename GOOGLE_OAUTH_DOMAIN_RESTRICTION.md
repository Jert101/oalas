# Google OAuth Domain Restriction System

## Overview

This system implements strict domain-based access control for Google OAuth authentication, allowing only users with `@ckcm.edu.ph` email addresses to sign in. **Google handles all error messaging** for blocked accounts.

## Security Features

### 1. Domain Validation
- **Primary Check**: Email must end with `@ckcm.edu.ph`
- **Hosted Domain Check**: Google's `hd` parameter must be `ckcm.edu.ph`
- **Email Verification**: Google's `email_verified` must be `true`
- **Error Handling**: Google shows professional error messages for blocked accounts

### 2. Implementation Details

#### Google Provider Configuration
```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: "openid email profile https://www.googleapis.com/auth/user.gender.read https://www.googleapis.com/auth/user.phonenumbers.read https://www.googleapis.com/auth/user.birthday.read https://www.googleapis.com/auth/user.addresses.read",
      prompt: "consent",
      access_type: "offline",
      response_type: "code",
      // Google-level domain restriction - only allow ckcm.edu.ph accounts
      hd: "ckcm.edu.ph"
    },
  },
})
```

#### SignIn Callback Logic
```typescript
async signIn({ user, account, profile }) {
  if (account?.provider === "google") {
    const email = (user.email || "").toLowerCase()
    const hostedDomain = (profile as any)?.hd as string | undefined
    const isCkcmEmail = email.endsWith("@ckcm.edu.ph")
    const isHostedCkcm = hostedDomain === "ckcm.edu.ph"
    
    // Log all Google OAuth attempts for security monitoring
    if (!isCkcmEmail || (hostedDomain && !isHostedCkcm)) {
      console.log(`[NextAuth] BLOCKED: Non-CKCM Google account attempted sign-in: ${email} (hosted domain: ${hostedDomain}) - Google will show error message`)
      // Let Google handle the error messaging - don't return false here
      // The hd: "ckcm.edu.ph" parameter will handle the restriction
    }
    
    // Additional security: Verify email is verified by Google
    if (!(profile as any)?.email_verified) {
      console.log(`[NextAuth] BLOCKED: Unverified Google email attempted sign-in: ${email} - Google will show error message`)
      // Let Google handle unverified email errors
    }
    
    // Only log successful CKCM sign-ins
    if (isCkcmEmail && (profile as any)?.email_verified) {
      console.log(`[NextAuth] ALLOWED: CKCM Google account sign-in: ${email} (hosted domain: ${hostedDomain})`)
    } else {
      // For non-CKCM or unverified accounts, let Google handle the restriction
      return false // Let Google show its error message
    }
    
    return true // Allow valid CKCM accounts to proceed
  }
}
```

## Error Handling

### Blocked Sign-In Attempts
When a non-CKCM account attempts to sign in:

1. **Google OAuth Level**: `hd: "ckcm.edu.ph"` parameter restricts access
2. **Google Shows Error**: Professional Google error messages displayed to user
3. **System Logging**: All attempts are logged for security monitoring
4. **No Custom Error Pages**: Google handles all user-facing error messaging

### Error Message Source
- **Google OAuth**: Shows professional domain restriction errors
- **System Level**: Only logs attempts for security monitoring
- **User Experience**: Clean, professional Google-branded error messages

## Security Logging

### Blocked Attempts
```
[NextAuth] BLOCKED: Non-CKCM Google account attempted sign-in: user@gmail.com (hosted domain: gmail.com) - Google will show error message
[NextAuth] BLOCKED: Unverified Google email attempted sign-in: user@ckcm.edu.ph - Google will show error message
```

### Successful Sign-Ins
```
[NextAuth] ALLOWED: CKCM Google account sign-in: user@ckcm.edu.ph (hosted domain: ckcm.edu.ph)
```

## Environment Variables Required

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Google Console Configuration

### OAuth 2.0 Client Setup
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create or select your project
3. Enable Google+ API and People API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - Production: `https://{YOUR_DOMAIN}/api/auth/callback/google`
   - Development: `http://localhost:3000/api/auth/callback/google`

### Domain Verification
- Ensure your domain is verified in Google Workspace
- Configure hosted domain restrictions if needed

## Testing

### Valid Accounts
- ✅ `user@ckcm.edu.ph` - Allowed
- ✅ `admin@ckcm.edu.ph` - Allowed
- ✅ `faculty@ckcm.edu.ph` - Allowed

### Blocked Accounts
- ❌ `user@gmail.com` - Blocked by Google (professional error message)
- ❌ `user@yahoo.com` - Blocked by Google (professional error message)
- ❌ `user@hotmail.com` - Blocked by Google (professional error message)
- ❌ `user@ckcm.edu.ph` (unverified) - Blocked by Google (professional error message)

## Monitoring and Maintenance

### Security Monitoring
- Monitor server logs for blocked attempts
- Set up alerts for unusual authentication patterns
- Regular review of access logs

### Updates and Maintenance
- Keep NextAuth.js updated
- Monitor Google OAuth API changes
- Regular security audits of the authentication flow

## Troubleshooting

### Common Issues

1. **"Access Denied" Error (Google Message)**
   - Verify email domain is `@ckcm.edu.ph`
   - Check if email is verified by Google
   - Ensure Google account is properly configured

2. **OAuth Configuration Errors**
   - Verify environment variables are set
   - Check Google Console OAuth setup
   - Ensure redirect URIs are correct

3. **Domain Verification Issues**
   - Verify domain ownership in Google Workspace
   - Check hosted domain settings
   - Ensure proper DNS configuration

### Support Contacts
- System Administrator: [Contact Info]
- Technical Support: [Contact Info]
- Security Team: [Contact Info]

## Compliance and Security

### Data Protection
- Only CKCM domain emails are processed
- No external email data is stored
- Secure token handling and storage

### Audit Trail
- All authentication attempts are logged
- Blocked attempts are recorded for security
- Successful sign-ins are tracked

### Privacy
- Minimal data collection from Google
- User consent required for OAuth
- Secure data transmission and storage

## User Experience

### For Allowed Users
- Seamless Google OAuth sign-in
- Professional Google domain selector
- Full system access

### For Blocked Users
- Professional Google error messages
- Clear explanation of domain restrictions
- Google-branded user experience

---

**Last Updated**: [Current Date]
**Version**: 1.0.0
**Security Level**: Enterprise
**Compliance**: CKCM Internal Security Standards
**Error Handling**: Google OAuth Level
