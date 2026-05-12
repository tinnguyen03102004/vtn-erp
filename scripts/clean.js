#!/usr/bin/env node

/**
 * VTN ERP — Clean Script
 * 
 * Removes build artifacts, caches, and generated files.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function log(msg) { console.log(`\x1b[36m[clean]\x1b[0m ${msg}`); }
function success(msg) { console.log(`\x1b[32m✓\x1b[0m ${msg}`); }

const DIRS_TO_CLEAN = [
  '.next',
  '.turbo',
  'node_modules/.cache',
  'coverage',
  'test-results',
  'playwright-report',
];

const FILES_TO_CLEAN = [
  'tsconfig.tsbuildinfo',
];

log('Cleaning build artifacts...');

for (const dir of DIRS_TO_CLEAN) {
  const fullPath = path.join(ROOT, dir);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    success(`Removed ${dir}/`);
  }
}

for (const file of FILES_TO_CLEAN) {
  const fullPath = path.join(ROOT, file);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    success(`Removed ${file}`);
  }
}

log('Clean complete! ✨');
