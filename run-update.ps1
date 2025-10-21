# OALASS Automated Update PowerShell Script
# This PowerShell script will run the update automatically

Write-Host "🚀 Starting OALASS Automated Update..." -ForegroundColor Green

# Make the update script executable and run it
bash update.sh

Write-Host "✅ Update completed!" -ForegroundColor Green
Write-Host "🌐 Your OALASS application has been updated!" -ForegroundColor Cyan
Write-Host "🏥 Check: ssh root@72.60.76.125 'curl -f http://localhost/api/health'" -ForegroundColor Yellow

Read-Host "Press Enter to continue"
