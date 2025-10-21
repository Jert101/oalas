// Simple Deployment Validation Tests
const fs = require('fs');
const path = require('path');

describe('Deployment Configuration Validation', () => {
  const projectRoot = path.join(__dirname, '../..');

  test('All deployment files exist', () => {
    const requiredFiles = [
      'docker/Dockerfile',
      'docker/docker-compose.yml',
      'docker/nginx/nginx.conf',
      'config/production.env',
      'config/env.example',
      'src/app/api/health/route.ts',
      'ecosystem.config.js',
      'scripts/deploy.sh',
      'scripts/rollback.sh',
      '.github/workflows/deploy.yml'
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(projectRoot, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('Dockerfile contains required elements', () => {
    const dockerfilePath = path.join(projectRoot, 'docker/Dockerfile');
    const content = fs.readFileSync(dockerfilePath, 'utf8');
    
    expect(content).toContain('FROM node:18-alpine');
    expect(content).toContain('HEALTHCHECK');
    expect(content).toContain('EXPOSE 3000');
    expect(content).toContain('USER nextjs');
  });

  test('Docker Compose has all required services', () => {
    const composePath = path.join(projectRoot, 'docker/docker-compose.yml');
    const content = fs.readFileSync(composePath, 'utf8');
    
    expect(content).toContain('mysql:');
    expect(content).toContain('app:');
    expect(content).toContain('nginx:');
    expect(content).toContain('pm2:');
    expect(content).toContain('oalass-network');
  });

  test('Environment configuration is complete', () => {
    const prodEnvPath = path.join(projectRoot, 'config/production.env');
    const content = fs.readFileSync(prodEnvPath, 'utf8');
    
    const requiredVars = [
      'NODE_ENV=production',
      'DATABASE_URL=',
      'NEXTAUTH_SECRET=',
      'NEXTAUTH_URL=',
      'GOOGLE_CLIENT_ID=',
      'EMAIL_SERVER_HOST='
    ];

    requiredVars.forEach(varName => {
      expect(content).toContain(varName);
    });
  });

  test('Health check endpoint is properly implemented', () => {
    const healthPath = path.join(projectRoot, 'src/app/api/health/route.ts');
    const content = fs.readFileSync(healthPath, 'utf8');
    
    expect(content).toContain('export async function GET');
    expect(content).toContain('healthData');
    expect(content).toContain('database');
    expect(content).toContain('application');
    expect(content).toContain('uptime');
  });

  test('PM2 configuration is valid', () => {
    const ecosystemPath = path.join(projectRoot, 'ecosystem.config.js');
    const content = fs.readFileSync(ecosystemPath, 'utf8');
    
    expect(content).toContain('module.exports');
    expect(content).toContain('apps:');
    expect(content).toContain('instances:');
    expect(content).toContain('exec_mode: \'cluster\'');
  });

  test('Nginx configuration includes security features', () => {
    const nginxPath = path.join(projectRoot, 'docker/nginx/nginx.conf');
    const content = fs.readFileSync(nginxPath, 'utf8');
    
    expect(content).toContain('upstream oalass_app');
    expect(content).toContain('ssl_certificate');
    expect(content).toContain('Strict-Transport-Security');
    expect(content).toContain('X-Frame-Options');
    expect(content).toContain('location /api/');
  });

  test('Deployment scripts have proper structure', () => {
    const deployPath = path.join(projectRoot, 'scripts/deploy.sh');
    const rollbackPath = path.join(projectRoot, 'scripts/rollback.sh');
    
    const deployContent = fs.readFileSync(deployPath, 'utf8');
    const rollbackContent = fs.readFileSync(rollbackPath, 'utf8');
    
    expect(deployContent).toContain('set -e');
    expect(deployContent).toContain('docker-compose');
    expect(rollbackContent).toContain('set -e');
    expect(rollbackContent).toContain('docker-compose');
  });

  test('CI/CD pipeline includes required steps', () => {
    const workflowPath = path.join(projectRoot, '.github/workflows/deploy.yml');
    const content = fs.readFileSync(workflowPath, 'utf8');
    
    expect(content).toContain('test:');
    expect(content).toContain('build:');
    expect(content).toContain('deploy:');
    expect(content).toContain('npm run test:all');
  });
});
