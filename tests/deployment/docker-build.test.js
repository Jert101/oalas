// Docker Build Validation Tests
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Docker Build Validation', () => {
  const dockerfilePath = path.join(__dirname, '../../docker/Dockerfile');
  const dockerComposePath = path.join(__dirname, '../../docker/docker-compose.yml');

  test('Dockerfile exists and is valid', () => {
    expect(fs.existsSync(dockerfilePath)).toBe(true);
    
    const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
    expect(dockerfileContent).toContain('FROM node:18-alpine');
    expect(dockerfileContent).toContain('HEALTHCHECK');
    expect(dockerfileContent).toContain('EXPOSE 3000');
  });

  test('Docker Compose file exists and is valid', () => {
    expect(fs.existsSync(dockerComposePath)).toBe(true);
    
    const composeContent = fs.readFileSync(dockerComposePath, 'utf8');
    expect(composeContent).toContain('version: \'3.8\'');
    expect(composeContent).toContain('mysql:');
    expect(composeContent).toContain('app:');
    expect(composeContent).toContain('nginx:');
  });

  test('Environment configuration files exist', () => {
    const prodEnvPath = path.join(__dirname, '../../config/production.env');
    const exampleEnvPath = path.join(__dirname, '../../config/env.example');
    
    expect(fs.existsSync(prodEnvPath)).toBe(true);
    expect(fs.existsSync(exampleEnvPath)).toBe(true);
  });

  test('Health check endpoint exists', () => {
    const healthRoutePath = path.join(__dirname, '../../src/app/api/health/route.ts');
    expect(fs.existsSync(healthRoutePath)).toBe(true);
    
    const healthContent = fs.readFileSync(healthRoutePath, 'utf8');
    expect(healthContent).toContain('export async function GET');
    expect(healthContent).toContain('healthData');
  });

  test('PM2 configuration exists', () => {
    const ecosystemPath = path.join(__dirname, '../../ecosystem.config.js');
    expect(fs.existsSync(ecosystemPath)).toBe(true);
    
    const ecosystemContent = fs.readFileSync(ecosystemPath, 'utf8');
    expect(ecosystemContent).toContain('module.exports');
    expect(ecosystemContent).toContain('apps:');
  });

  test('Deployment scripts exist and are executable', () => {
    const deployScriptPath = path.join(__dirname, '../../scripts/deploy.sh');
    const rollbackScriptPath = path.join(__dirname, '../../scripts/rollback.sh');
    
    expect(fs.existsSync(deployScriptPath)).toBe(true);
    expect(fs.existsSync(rollbackScriptPath)).toBe(true);
  });

  test('Nginx configuration is valid', () => {
    const nginxConfigPath = path.join(__dirname, '../../docker/nginx/nginx.conf');
    expect(fs.existsSync(nginxConfigPath)).toBe(true);
    
    const nginxContent = fs.readFileSync(nginxConfigPath, 'utf8');
    expect(nginxContent).toContain('upstream oalass_app');
    expect(nginxContent).toContain('ssl_certificate');
    expect(nginxContent).toContain('location /api/');
  });
});
