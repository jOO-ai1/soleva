#!/usr/bin/env node

/**
 * Database Setup Script for Phone-Based Password Recovery
 * 
 * This script helps set up the database for the phone-based password recovery feature.
 * Run this after setting up your database connection.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🗄️  Setting up database for phone-based password recovery...\n');

// Check if we're in the backend directory
const backendPath = path.join(__dirname, 'backend');
if (!fs.existsSync(backendPath)) {
  console.error('❌ Backend directory not found. Please run this script from the project root.');
  process.exit(1);
}

// Check if .env file exists
const envPath = path.join(backendPath, '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  No .env file found. Creating a basic one...');

  const envContent = `# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/solevaeg_db?schema=public"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-for-development
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-minimum-32-characters-for-development
JWT_REFRESH_EXPIRES_IN=30d

# Server Configuration
NODE_ENV=development
PORT=3001
API_VERSION=v1
CORS_ORIGIN=http://localhost:5173

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@solevaeg.com
SMTP_PASS=your-smtp-password

# Email Addresses
EMAIL_INFO=info@solevaeg.com
EMAIL_SALES=sales@solevaeg.com
EMAIL_BUSINESS=business@solevaeg.com
EMAIL_SUPPORT=support@solevaeg.com
EMAIL_ADMIN=admin@solevaeg.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-key-minimum-32-characters-long-for-development

# Admin Configuration
ADMIN_EMAIL=admin@solevaeg.com
ADMIN_PASSWORD=admin123

# Social Login Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Development Only
SEED_DATABASE=true
DEBUG_MODE=true
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file. Please update the DATABASE_URL with your actual database credentials.\n');
}

try {
  console.log('🔄 Running Prisma migration...');
  execSync('npx prisma migrate dev --name add_password_reset_tokens', {
    cwd: backendPath,
    stdio: 'inherit'
  });
  console.log('✅ Migration completed successfully!\n');

  console.log('🔄 Generating Prisma client...');
  execSync('npx prisma generate', {
    cwd: backendPath,
    stdio: 'inherit'
  });
  console.log('✅ Prisma client generated!\n');

  console.log('🎉 Database setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Uncomment the password reset token operations in backend/src/routes/auth.ts');
  console.log('2. Test the registration with phone number');
  console.log('3. Test the forgot password flow');
  console.log('\n✨ Your phone-based password recovery system is ready to use!');

} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Make sure PostgreSQL is running');
  console.log('2. Check your DATABASE_URL in the .env file');
  console.log('3. Ensure the database exists');
  console.log('4. Check your database credentials');
  process.exit(1);
}