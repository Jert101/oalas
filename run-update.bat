@echo off
REM OALASS Automated Update for Windows
REM This batch file will run the update automatically

echo 🚀 Starting OALASS Automated Update...

REM Make the update script executable and run it
bash update.sh

echo ✅ Update completed!
echo 🌐 Your OALASS application has been updated!
echo 🏥 Check: ssh root@72.60.76.125 'curl -f http://localhost/api/health'

pause
