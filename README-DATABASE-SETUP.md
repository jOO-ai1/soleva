# Complete Database Reset and Setup Guide

This guide will help you completely reset and set up a clean database environment for the Soleva backend.

## 🔥 **WARNING: Complete Data Loss**

The scripts in this guide will **permanently delete ALL existing data**. Only use these if you want to start completely fresh.

## 📋 Prerequisites

1. **PostgreSQL** installed and running
2. **Node.js** (v18 or higher)
3. **npm** package manager
4. Database credentials and permissions

## 🚀 Quick Setup (Recommended)

### Step 1: Complete Database Reset

Run the automated database reset script:

```bash
node database-reset.js
```

This script will:
- ✅ Clean existing migrations
- ✅ Drop and recreate database
- ✅ Generate fresh Prisma client
- ✅ Create initial migration
- ✅ Seed with sample data

### Step 2: Start Backend Server

```bash
chmod +x start-backend.sh
./start-backend.sh
```

Or manually:

```bash
cd backend
npm run dev
```

## 🛠️ Manual Setup Steps

### 1. Environment Configuration

Ensure your `backend/.env` file has the correct database URL:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Database Operations

```bash
# Reset database completely
npm run db:reset

# OR push schema without migrations
npm run db:push

# Generate Prisma client
npm run generate

# Seed database
npm run seed
```

### 4. Verify Setup

```bash
node ../verify-backend.js
```

## 🔧 Alternative Setup Scripts

### Clean Database Setup

If you prefer a step-by-step approach:

```bash
node setup-clean-database.js
```

### Verification Only

To check if everything is working:

```bash
node verify-backend.js
```

## 🌐 Testing the Setup

Once the backend is running, test these endpoints:

1. **Health Check**: `http://localhost:3001/health`
2. **API Base**: `http://localhost:3001/api/v1`
3. **Products**: `http://localhost:3001/api/v1/products`
4. **Categories**: `http://localhost:3001/api/v1/categories`
5. **Collections**: `http://localhost:3001/api/v1/collections`
6. **API Docs**: `http://localhost:3001/docs` (in development)

## 📊 What Gets Created

The seed script creates:
- 👤 **Admin user**: `admin@solevaeg.com` (password: `admin123`)
- 🏷️ **Brand**: Soleva
- 📁 **Categories**: Men's Shoes, Women's Shoes
- 🎯 **Collection**: Spring 2024
- 👟 **Products**: 2 sample shoes with variants
- 🌍 **Shipping**: Egyptian governorates and centers
- ⚙️ **Settings**: Store and integration configurations

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check if PostgreSQL is running
   pg_ctl status
   
   # Start PostgreSQL if needed
   brew services start postgresql  # macOS
   sudo systemctl start postgresql # Linux
   ```

2. **Database Doesn't Exist**
   ```bash
   # Create the database
   createdb solevaeg_dev
   ```

3. **Permission Denied**
   ```bash
   # Make scripts executable
   chmod +x *.js
   chmod +x *.sh
   ```

4. **Migration Errors**
   ```bash
   # Force reset everything
   cd backend
   rm -rf prisma/migrations/*
   npx prisma db push --force-reset --accept-data-loss
   ```

### Environment Issues

Check your `.env` file configuration:

```env
# Example working configuration
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://postgres:password@localhost:5432/solevaeg_dev?schema=public"
JWT_SECRET=your-long-secure-secret-key-here
```

### Network Issues

If the frontend can't connect to the backend:

1. **CORS Configuration**: Check `CORS_ORIGIN` in `.env`
2. **Port Conflicts**: Ensure port 3001 is available
3. **Firewall**: Allow connections on port 3001

## 📝 Next Steps

After successful setup:

1. **Start Frontend**: The frontend should now connect to the backend
2. **Admin Panel**: Use admin credentials to access admin features
3. **Testing**: Create test orders and verify functionality
4. **Production**: Configure production environment variables

## 🆘 Getting Help

If you encounter issues:

1. Check the error logs in the terminal
2. Verify all prerequisites are installed
3. Ensure database credentials are correct
4. Try the manual setup steps one by one
5. Check the `verify-backend.js` output for specific issues

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)