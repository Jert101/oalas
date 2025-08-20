@echo off
echo Exporting database from XAMPP...

REM Set your database name
set DB_NAME=oalas

REM Set the path to your XAMPP MySQL bin directory
set MYSQL_PATH=C:\xampp\mysql\bin

REM Export the database
"%MYSQL_PATH%\mysqldump.exe" -u root %DB_NAME% > database_backup.sql

echo Database has been exported to database_backup.sql
echo You can now import this file to InfinityFree using phpMyAdmin
pause
