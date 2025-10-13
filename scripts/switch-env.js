// Usage: node scripts/switch-env.js <localhost|deployed>
// - Backs up current .env to .env.backup-YYYYMMDDHHmmss if present
// - Copies .env.localhost or .env.deployed to .env

const fs = require('fs')
const path = require('path')

const root = process.cwd()
const choice = (process.argv[2] || '').toLowerCase()

if (!['localhost', 'deployed'].includes(choice)) {
  console.error('Please provide environment to switch to: localhost | deployed')
  process.exit(1)
}

const envPath = path.join(root, '.env')
const srcPath = path.join(root, `.env.${choice}`)

if (!fs.existsSync(srcPath)) {
  console.error(`Source env file not found: ${srcPath}`)
  process.exit(1)
}

if (fs.existsSync(envPath)) {
  const ts = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 14)
  const backup = path.join(root, `.env.backup-${ts}`)
  fs.copyFileSync(envPath, backup)
  console.log(`Backed up existing .env -> ${backup}`)
}

fs.copyFileSync(srcPath, envPath)
console.log(`Switched environment -> ${choice} (copied ${path.basename(srcPath)} to .env)`)











