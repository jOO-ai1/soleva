#!/usr/bin/env node

/**
 * Complete Database Reset Script
 * 
 * This script completely drops and recreates the database from scratch.
 * WARNING: This will permanently delete ALL data!
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 COMPLETE DATABASE RESET - ALL DATA WILL BE LOST!');
console.log('====================================================\n');

// Check if we're in the correct directory
const backendPath = path.join(__dirname, 'backend');
if (!fs.existsSync(backendPath)) {
  console.error('❌ Backend directory not found. Please run this script from the project root.');
  process.exit(1);
}

// Check if .env file exists
const envPath = path.join(backendPath, '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  No .env file found in backend directory.');
  console.log('Please create a .env file with your DATABASE_URL configuration.');
  process.exit(1);
}

// Read environment variables
require('dotenv').config({ path: envPath });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables.');
  process.exit(1);
}

try {
  console.log('🧹 Step 1: Cleaning existing migrations...');

  // Remove migration files (keeping the directory structure)
  const migrationsDir = path.join(backendPath, 'prisma', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrations = fs.readdirSync(migrationsDir);
    migrations.forEach((migration) => {
      if (migration !== '.gitkeep') {
        const migrationPath = path.join(migrationsDir, migration);
        if (fs.statSync(migrationPath).isDirectory()) {
          fs.rmSync(migrationPath, { recursive: true, force: true });
        }
      }
    });
  }
  console.log('✅ Existing migrations cleaned');

  console.log('\n🗄️  Step 2: Resetting database...');

  // Reset the database completely
  execSync('npx prisma db push --force-reset --accept-data-loss', {
    cwd: backendPath,
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Database reset completed');

  console.log('\n🔄 Step 3: Generating fresh Prisma client...');
  execSync('npx prisma generate', {
    cwd: backendPath,
    stdio: 'inherit'
  });
  console.log('✅ Prisma client generated');

  console.log('\n🌱 Step 4: Creating initial migration...');
  execSync('npx prisma migrate dev --name init --create-only', {
    cwd: backendPath,
    stdio: 'inherit'
  });
  console.log('✅ Initial migration created');

  console.log('\n📊 Step 5: Applying migration...');
  execSync('npx prisma migrate deploy', {
    cwd: backendPath,
    stdio: 'inherit'
  });
  console.log('✅ Migration applied');

  console.log('\n🌟 Step 6: Seeding database with initial data...');
  try {
    execSync('npm run seed', {
      cwd: backendPath,
      stdio: 'inherit'
    });
    console.log('✅ Database seeded successfully');
  } catch (seedError) {
    console.log('⚠️  Seeding failed, but database is ready for manual setup');
  }

  console.log('\n🎉 DATABASE RESET COMPLETED SUCCESSFULLY!');
  console.log('==========================================');
  console.log('\n📋 What was done:');
  console.log('✓ Dropped all existing tables and data');
  console.log('✓ Removed all migration history');
  console.log('✓ Created fresh database schema');
  console.log('✓ Generated new Prisma client');
  console.log('✓ Applied clean initial migration');
  console.log('✓ Seeded with initial data (if seed script exists)');

  console.log('\n🚀 Next steps:');
  console.log('1. Start your backend server: cd backend && npm run dev');
  console.log('2. Verify the API endpoints are working');
  console.log('3. Check frontend connectivity');

  console.log('\n✨ Your database is now clean and ready to use!');

} catch (error) {
  console.error('\n❌ Database reset failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Make sure PostgreSQL is running');
  console.log('2. Check your DATABASE_URL in backend/.env');
  console.log('3. Ensure the database exists and you have proper permissions');
  console.log('4. Try running: createdb your_database_name');

  process.exit(1);
}