# Deploy Dean Access Fix
Write-Host "Deploying Dean Access Fix..." -ForegroundColor Green

# Connect to VPS and run deployment commands
$commands = @(
    "cd /var/www/oala",
    "git pull origin main",
    "rm -rf .next",
    "npm install",
    "npm run build",
    "pm2 restart oalass",
    "pm2 status"
)

foreach ($cmd in $commands) {
    Write-Host "Running: $cmd" -ForegroundColor Yellow
    ssh root@72.60.76.125 $cmd
    Write-Host ""
}

Write-Host "Deployment completed!" -ForegroundColor Green
