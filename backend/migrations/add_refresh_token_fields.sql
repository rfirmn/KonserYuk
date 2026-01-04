# Migration SQL - Database Schema Updates for Refactored System

## User Table - Add Refresh Token Fields

```sql
-- Add refresh_token and refresh_token_expires columns to users table
ALTER TABLE users
ADD COLUMN refresh_token TEXT NULL COMMENT 'JWT refresh token untuk mendapatkan access token baru',
ADD COLUMN refresh_token_expires DATETIME NULL COMMENT 'Waktu expiry untuk refresh token';
```

## Verify Tables (Optional)

```sql
-- Check jika kolom sudah ditambahkan
DESCRIBE users;

-- Verify all tables exist
SHOW TABLES;
```

## Notes:
- Migration ini akan otomatis diterapkan jika menggunakan `sequelize.sync({ alter: true })` di development
- Untuk production, sebaiknya gunakan migration tools seperti Sequelize CLI
- Backup database sebelum melakukan migration
