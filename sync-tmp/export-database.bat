@echo off
echo Exporting database from XAMPP...
"C:\xampp\mysql\bin\mysqldump" -u root oalas > database_backup.sql
echo Database exported to database_backup.sql
pause
