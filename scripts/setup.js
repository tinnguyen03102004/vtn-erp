#!/usr/bin/env node

/**
 * VTN ERP — Setup Script
 * 
 * Initializes the project for first-time development:
 * 1. Checks Node.js version
 * 2. Copies .env.example → .env (if not exists)
 * 3. Installs dependencies
 * 4. Generates Prisma client
 * 5. Prints success message
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ── Helpers ──
function log(msg) { console.log(`\x1b[36m[setup]\x1b[0m ${msg}`); }
function success(msg) { console.log(`\x1b[32m✓\x1b[0m ${msg}`); }
function warn(msg) { console.log(`\x1b[33m⚠\x1b[0m ${msg}`); }
function error(msg) { console.error(`\x1b[31m✗\x1b[0m ${msg}`); }

function run(cmd, opts = {}) {
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts });
    return true;
  } catch {
    return false;
  }
}

// ── Step 1: Check Node.js ──
log('Checking Node.js version...');
const nodeVersion = process.version;
const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);
if (major < 20) {
  error(`Node.js ${nodeVersion} detected. Minimum required: 20.x`);
  process.exit(1);
}
success(`Node.js ${nodeVersion}`);

// ── Step 2: .env ──
log('Checking environment file...');
const envPath = path.join(ROOT, '.env');
const envExamplePath = path.join(ROOT, '.env.example');
if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    success('.env created from .env.example');
    warn('Edit .env with your credentials before starting');
  } else {
    warn('.env.example not found — create .env manually');
  }
} else {
  success('.env already exists');
}

// ── Step 3: Install ──
log('Installing dependencies...');
if (!run('npm install')) {
  error('npm install failed');
  process.exit(1);
}
success('Dependencies installed');

// ── Step 4: Prisma ──
log('Generating Prisma client...');
if (!run('npx prisma generate')) {
  warn('Prisma generate failed — check DATABASE_URL in .env');
} else {
  success('Prisma client generated');
}

// ── Done ──
console.log('');
console.log('\x1b[32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
console.log('\x1b[32m  VTN ERP — Setup Complete! 🎉     \x1b[0m');
console.log('\x1b[32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
console.log('');
console.log('  Next steps:');
console.log('  1. Edit .env with your credentials');
console.log('  2. npm run dev');
console.log('  3. Open http://localhost:3000');
console.log('');
