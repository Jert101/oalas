-- TeachStack Database Setup for XAMPP MySQL
-- Run this script in phpMyAdmin or MySQL Workbench

-- Create the database
CREATE DATABASE IF NOT EXISTS `oalass` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE `oalass`;

-- Grant privileges (if needed)
-- GRANT ALL PRIVILEGES ON oalass.* TO 'root'@'localhost';
-- FLUSH PRIVILEGES;

-- The tables will be created automatically by Prisma when you run:
-- npx prisma db push

-- Verify database creation
SHOW DATABASES LIKE 'oalass';
