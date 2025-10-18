# 🔐 Admin Seeder Documentation

## Overview

The Admin Seeder is a dedicated database seeding utility that creates administrator accounts for the OALass (Online Application for Leave and Travel Order System). This seeder ensures that your system has proper admin accounts with full access privileges.

## Features

✅ **Multiple Admin Accounts** - Creates 3 different admin accounts for different purposes  
✅ **Secure Passwords** - Uses bcrypt hashing with strong default passwords  
✅ **Role & Department Management** - Automatically creates necessary roles and departments  
✅ **Email Verification** - Pre-verifies admin emails for immediate access  
✅ **Idempotent Operations** - Safe to run multiple times (won't create duplicates)  
✅ **Comprehensive Logging** - Detailed output showing all operations  

## Usage

### Quick Start

```bash
# Run the admin seeder
npm run db:seed:admin

# Or run directly with tsx
npx tsx prisma/admin-seeder.ts
```

### What Gets Created

#### 1. **Roles**
- `Admin` - System Administrator role with full access

#### 2. **Statuses** 
- `Regular` - Regular employee status with full benefits

#### 3. **Departments**
- `Administration` - System Administration and IT Department

#### 4. **Admin Accounts**

| Account | Email | User ID | Password | Purpose |
|---------|-------|---------|----------|---------|
| System Administrator | `admin@oalass.com` | `ADMIN001` | `Admin@123!` | Primary system admin |
| Super Administrator | `superadmin@oalass.com` | `SUPER001` | `Super@123!` | Super admin privileges |
| Development Administrator | `dev@oalass.com` | `DEV001` | `Dev@123!` | Development/testing |

## Account Details

All created admin accounts have the following characteristics:

- ✅ **Email Verified** - Ready for immediate login
- ✅ **Active Status** - Accounts are enabled and functional
- 🔐 **Admin Role** - Full system access and user management
- 🏢 **Administration Department** - Assigned to admin department
- 🛡️ **Secure Passwords** - Strong passwords with special characters

## Security Notes

🚨 **IMPORTANT**: Change default passwords immediately after first login!

### Default Password Policy
- Minimum 8 characters
- Contains uppercase letters
- Contains lowercase letters  
- Contains numbers
- Contains special characters (`@`, `!`)

### Recommended Actions After Seeding

1. **Change Passwords** - Update all default passwords
2. **Review Access** - Ensure only authorized personnel have admin credentials
3. **Enable 2FA** - Consider implementing two-factor authentication
4. **Audit Logs** - Monitor admin account activities

## Running in Different Environments

### Development
```bash
npm run db:seed:admin
```

### Production
```bash
# Ensure proper environment variables are set
DATABASE_URL="your-production-db-url"
npx tsx prisma/admin-seeder.ts
```

### Testing
```bash
# Safe to run multiple times
npm run db:seed:admin
```

## Troubleshooting

### Common Issues

#### Database Connection Error
```bash
Error: Can't reach database server
```
**Solution**: Ensure your database is running and `DATABASE_URL` is correct.

#### Role/Department Already Exists
```bash
Unique constraint failed
```
**Solution**: This is normal - the seeder uses `upsert` operations to handle existing data safely.

#### Permission Denied
```bash
Access denied for user
```
**Solution**: Ensure your database user has CREATE, INSERT, UPDATE permissions.

## File Structure

```
prisma/
├── admin-seeder.ts          # Main admin seeder file
├── schema.prisma            # Database schema
└── seed.ts                  # General application seeder

package.json                 # Contains db:seed:admin script
```

## Advanced Usage

### Customizing Admin Accounts

Edit `prisma/admin-seeder.ts` to modify:

```typescript
const adminUsers = [
  {
    users_id: 'ADMIN001',
    email: 'your-admin@company.com',
    password: 'YourSecurePassword!',
    name: 'Your Administrator Name',
    firstName: 'Your',
    lastName: 'Administrator'
  }
  // Add more admin accounts as needed
]
```

### Integration with Main Seeder

The admin seeder can be run independently or as part of the main seeding process:

```bash
# Run full database reset with admin accounts
npm run db:reset && npm run db:seed:admin
```

## API Endpoints for Admin Management

After seeding, admin accounts can access:

- `GET /api/admin/users` - User management
- `POST /api/admin/users` - Create new users  
- `PUT /api/admin/users/:id` - Update users
- `DELETE /api/admin/users/:id` - Delete users
- `GET /api/admin/roles` - Role management
- `GET /api/admin/departments` - Department management

## Related Documentation

- [Main Application Seeder](./prisma/seed.ts)
- [Database Schema](./prisma/schema.prisma)
- [Authentication System](./DEPLOYMENT_COMPLETE.md)
- [Admin Dashboard](./ADMIN_DASHBOARD_COMPLETE.md)

## Support

For issues with the admin seeder:

1. Check the console output for detailed error messages
2. Verify database connectivity
3. Ensure all dependencies are installed (`npm install`)
4. Check the database schema is up to date (`npm run db:push`)

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Compatible with**: OALass v0.1.0+




