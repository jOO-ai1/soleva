#!/usr/bin/env node

/**
 * Backend Verification Script
 * 
 * This script verifies that the backend is properly configured and can connect
 * to the database successfully.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying backend configuration...');
console.log('=====================================\n');

const backendPath = path.join(__dirname, 'backend');

function checkFile(filePath, name) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${name} exists`);
    return true;
  } else {
    console.log(`❌ ${name} missing`);
    return false;
  }
}

function runCheck(command, description, options = {}) {
  try {
    console.log(`🔄 ${description}...`);
    execSync(command, {
      cwd: backendPath,
      stdio: 'pipe',
      ...options
    });
    console.log(`✅ ${description} - OK`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} - FAILED`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function verifyBackend() {
  let allChecks = true;

  // File existence checks
  console.log('📁 Checking required files...');
  allChecks &= checkFile(path.join(backendPath, 'package.json'), 'package.json');
  allChecks &= checkFile(path.join(backendPath, '.env'), '.env file');
  allChecks &= checkFile(path.join(backendPath, 'prisma', 'schema.prisma'), 'Prisma schema');
  allChecks &= checkFile(path.join(backendPath, 'src', 'server.ts'), 'Server file');
  allChecks &= checkFile(path.join(backendPath, 'node_modules'), 'Dependencies (node_modules)');

  console.log('\n🔧 Checking backend functionality...');

  // Dependencies check
  allChecks &= runCheck('npm list --depth=0', 'Dependencies check');

  // Prisma checks
  allChecks &= runCheck('npx prisma generate', 'Prisma client generation');
  allChecks &= runCheck('npx prisma db pull', 'Database connection');

  // TypeScript compilation
  allChecks &= runCheck('npm run build', 'TypeScript compilation');

  console.log('\n📊 Verification Results:');
  console.log('========================');

  if (allChecks) {
    console.log('🎉 All checks passed! Backend is ready.');
    console.log('\n🚀 To start the backend server:');
    console.log('   cd backend && npm run dev');
    console.log('\n🌐 Server will be available at:');
    console.log('   http://localhost:3001');
  } else {
    console.log('⚠️  Some checks failed. Please review the errors above.');
    console.log('\n🔧 Common fixes:');
    console.log('1. Run: npm install (in backend directory)');
    console.log('2. Check DATABASE_URL in .env file');
    console.log('3. Make sure PostgreSQL is running');
    console.log('4. Run: npx prisma db push --force-reset');
  }

  return allChecks;
}

verifyBackend().catch(console.error);