# Quick Admin Seeder Guide

## 🚀 Run Admin Seeder

```bash
npm run db:seed:admin
```

## 👤 Default Admin Accounts

| Email | Password | User ID | Role |
|-------|----------|---------|------|
| admin@oalass.com | Admin@123! | ADMIN001 | Admin |
| superadmin@oalass.com | Super@123! | SUPER001 | Admin |
| dev@oalass.com | Dev@123! | DEV001 | Admin |

## 🔐 Security Checklist

- [ ] Change default passwords after first login
- [ ] Review admin access permissions
- [ ] Enable audit logging for admin actions
- [ ] Document admin account usage

## 📁 Files

- `prisma/admin-seeder.ts` - Main seeder script
- `ADMIN_SEEDER_README.md` - Full documentation
- `package.json` - Contains `db:seed:admin` script

## 🛠️ Troubleshooting

- Database connection issues: Check `DATABASE_URL`
- Permission errors: Ensure database user has proper privileges
- Duplicate errors: Normal behavior, seeder handles existing data safely





