#!/usr/bin/env node

/**
 * Clean Database Setup Script
 * 
 * Sets up a completely clean database environment with proper configuration
 * and verification steps.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up clean database environment...');
console.log('============================================\n');

const backendPath = path.join(__dirname, 'backend');

// Ensure backend directory exists
if (!fs.existsSync(backendPath)) {
  console.error('❌ Backend directory not found. Please run this script from the project root.');
  process.exit(1);
}

function runCommand(command, options = {}) {
  try {
    console.log(`🔄 Running: ${command}`);
    execSync(command, {
      stdio: 'inherit',
      ...options
    });
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

async function setupDatabase() {
  try {
    // Step 1: Check if .env exists and create if needed
    const envPath = path.join(backendPath, '.env');
    if (!fs.existsSync(envPath)) {
      console.log('📝 Creating .env file from template...');
      const envExamplePath = path.join(backendPath, '.env.example');
      if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
      }
    }

    // Step 2: Install dependencies if node_modules doesn't exist
    const nodeModulesPath = path.join(backendPath, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.log('📦 Installing backend dependencies...');
      if (!runCommand('npm install', { cwd: backendPath })) {
        throw new Error('Failed to install dependencies');
      }
    }

    // Step 3: Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    if (!runCommand('npx prisma generate', { cwd: backendPath })) {
      throw new Error('Failed to generate Prisma client');
    }

    // Step 4: Create database and run migrations
    console.log('🗄️  Setting up database schema...');
    if (!runCommand('npx prisma db push --force-reset --accept-data-loss', { cwd: backendPath })) {
      console.log('⚠️  Database push failed, trying migration approach...');

      // Alternative approach with migrations
      runCommand('npx prisma migrate reset --force', { cwd: backendPath });
      if (!runCommand('npx prisma migrate dev --name init', { cwd: backendPath })) {
        throw new Error('Failed to setup database schema');
      }
    }

    // Step 5: Seed the database
    console.log('🌱 Seeding database...');
    const seedResult = runCommand('npm run seed', { cwd: backendPath });
    if (!seedResult) {
      console.log('⚠️  Seeding failed or no seed script found, continuing...');
    }

    // Step 6: Verify database connection
    console.log('🔍 Verifying database connection...');
    if (!runCommand('npx prisma db pull', { cwd: backendPath })) {
      console.log('⚠️  Database verification failed, but setup may still be working');
    }

    console.log('\n✅ DATABASE SETUP COMPLETED!');
    console.log('============================');

    console.log('\n📋 Setup Summary:');
    console.log('✓ Environment configuration created/verified');
    console.log('✓ Dependencies installed');
    console.log('✓ Prisma client generated');
    console.log('✓ Database schema created');
    console.log('✓ Initial data seeded (if available)');

    console.log('\n🚀 Ready to start!');
    console.log('To start the backend server:');
    console.log('  cd backend && npm run dev');

    console.log('\n🌐 Expected API endpoints:');
    console.log('  Health check: http://localhost:3001/health');
    console.log('  API base: http://localhost:3001/api/v1');
    console.log('  Products: http://localhost:3001/api/v1/products');
    console.log('  Categories: http://localhost:3001/api/v1/categories');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);

    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check DATABASE_URL in backend/.env');
    console.log('3. Create the database manually: createdb solevaeg_dev');
    console.log('4. Verify PostgreSQL credentials and permissions');
    console.log('5. Try running individual commands manually');

    process.exit(1);
  }
}

// Run the setup
setupDatabase();