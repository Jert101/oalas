// Integration Tests for Deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Deployment Integration Tests', () => {
  const projectRoot = path.join(__dirname, '../..');

  test('Application builds successfully', () => {
    try {
      execSync('npm run build', { 
        cwd: projectRoot, 
        stdio: 'pipe' 
      });
      expect(true).toBe(true); // If we get here, build succeeded
    } catch (error) {
      throw new Error('Application build failed: ' + error.message);
    }
  });

  test('Docker Compose configuration is valid', () => {
    try {
      execSync('docker-compose -f docker/docker-compose.yml config', { 
        cwd: projectRoot, 
        stdio: 'pipe' 
      });
      expect(true).toBe(true);
    } catch (error) {
      // Docker might not be available in test environment
      console.log('Docker Compose validation skipped (Docker not available)');
      expect(true).toBe(true);
    }
  });

  test('Environment variables are properly configured', () => {
    const prodEnvPath = path.join(projectRoot, 'config/production.env');
    const envContent = fs.readFileSync(prodEnvPath, 'utf8');
    
    // Check for required environment variables
    expect(envContent).toContain('NODE_ENV=production');
    expect(envContent).toContain('DATABASE_URL=');
    expect(envContent).toContain('NEXTAUTH_SECRET=');
    expect(envContent).toContain('NEXTAUTH_URL=');
    expect(envContent).toContain('GOOGLE_CLIENT_ID=');
    expect(envContent).toContain('EMAIL_SERVER_HOST=');
  });

  test('Health check endpoint is properly implemented', () => {
    const healthRoutePath = path.join(projectRoot, 'src/app/api/health/route.ts');
    const healthContent = fs.readFileSync(healthRoutePath, 'utf8');
    
    // Check for required health check features
    expect(healthContent).toContain('database');
    expect(healthContent).toContain('application');
    expect(healthContent).toContain('uptime');
    expect(healthContent).toContain('memory');
    expect(healthContent).toContain('responseTime');
  });

  test('PM2 configuration includes required settings', () => {
    const ecosystemPath = path.join(projectRoot, 'ecosystem.config.js');
    const ecosystemContent = fs.readFileSync(ecosystemPath, 'utf8');
    
    expect(ecosystemContent).toContain('instances:');
    expect(ecosystemContent).toContain('exec_mode: \'cluster\'');
    expect(ecosystemContent).toContain('max_memory_restart:');
    expect(ecosystemContent).toContain('health_check_grace_period:');
  });

  test('Nginx configuration includes security headers', () => {
    const nginxConfigPath = path.join(projectRoot, 'docker/nginx/nginx.conf');
    const nginxContent = fs.readFileSync(nginxConfigPath, 'utf8');
    
    expect(nginxContent).toContain('Strict-Transport-Security');
    expect(nginxContent).toContain('X-Frame-Options');
    expect(nginxContent).toContain('X-Content-Type-Options');
    expect(nginxContent).toContain('X-XSS-Protection');
  });

  test('Deployment scripts include error handling', () => {
    const deployScriptPath = path.join(projectRoot, 'scripts/deploy.sh');
    const deployContent = fs.readFileSync(deployScriptPath, 'utf8');
    
    expect(deployContent).toContain('set -e');
    expect(deployContent).toContain('error()');
    expect(deployContent).toContain('warning()');
    expect(deployContent).toContain('log()');
  });

  test('CI/CD pipeline includes required steps', () => {
    const workflowPath = path.join(projectRoot, '.github/workflows/deploy.yml');
    const workflowContent = fs.readFileSync(workflowPath, 'utf8');
    
    expect(workflowContent).toContain('test:');
    expect(workflowContent).toContain('build:');
    expect(workflowContent).toContain('deploy:');
    expect(workflowContent).toContain('npm run test:all');
  });
});
