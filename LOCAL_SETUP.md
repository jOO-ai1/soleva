# 🚀 Soleva Store - Local Development Setup Guide

This guide will help you set up the Soleva Store e-commerce platform on your local machine for development and testing.

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:

### Required Software
- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (v8.0.0 or higher) - Comes with Node.js
- **Docker** (v20.0.0 or higher) - [Download here](https://www.docker.com/get-started)
- **Docker Compose** (v2.0.0 or higher) - Comes with Docker Desktop
- **Git** - [Download here](https://git-scm.com/)

### Optional but Recommended
- **VS Code** - [Download here](https://code.visualstudio.com/)
- **Postman** - For API testing
- **pgAdmin** - For database management

## 🛠️ Installation Steps

### Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd soleva-store
```

### Step 2: Start Local Services
Start the required services (PostgreSQL, Redis, Mailhog, MinIO) using Docker:

```bash
# Start all local services
docker-compose -f docker-compose.local.yml up -d

# Verify services are running
docker-compose -f docker-compose.local.yml ps
```

**Services will be available at:**
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Mailhog (Email Testing): `http://localhost:8025`
- MinIO (File Storage): `http://localhost:9001`
- Adminer (DB Management): `http://localhost:8080`

### Step 3: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp env.local.example .env

# Edit the .env file with your configuration
# (See Environment Variables section below)

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with sample data
npx prisma db seed

# Start the backend server
npm run dev
```

The backend will be available at: `http://localhost:5000`

### Step 4: Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd ..

# Install dependencies
npm install

# Copy environment file
cp env.local.example .env.local

# Edit the .env.local file with your configuration
# (See Environment Variables section below)

# Start the frontend development server
npm run dev
```

The frontend will be available at: `http://localhost:3000`

### Step 5: Admin Panel Setup (Optional)

```bash
# Navigate to admin directory
cd admin

# Install dependencies
npm install

# Start the admin panel
npm run dev
```

The admin panel will be available at: `http://localhost:3001`

## 🔧 Environment Variables

### Frontend (.env.local)
```bash
# Copy from env.local.example
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=Soleva Store
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development

# Optional: Analytics (leave as placeholder for local dev)
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_FACEBOOK_PIXEL_ID=XXXXXXXXXXXXXXX
VITE_GOOGLE_TAG_MANAGER_ID=GTM-XXXXXXX

# Optional: Social Login (configure if needed)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_FACEBOOK_APP_ID=your-facebook-app-id
```

### Backend (.env)
```bash
# Copy from backend/env.local.example
DATABASE_URL="postgresql://soleva:soleva123@localhost:5432/soleva_dev?schema=public"
PORT=5000
NODE_ENV=development
API_BASE_URL=http://localhost:5000/api/v1

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-development-only
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-for-development-only
JWT_REFRESH_EXPIRES_IN=30d

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Email Configuration (for testing)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=Soleva Store
SMTP_FROM_EMAIL=test@solevaeg.com

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf

# Security Configuration
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000

# Encryption Configuration
ENCRYPTION_KEY=your-32-character-encryption-key-here
ENCRYPTION_IV=your-16-character-iv-here
```

## 🚀 Running the Application

### Start All Services
```bash
# Terminal 1: Start local services
docker-compose -f docker-compose.local.yml up -d

# Terminal 2: Start backend
cd backend
npm run dev

# Terminal 3: Start frontend
cd ..
npm run dev

# Terminal 4: Start admin panel (optional)
cd admin
npm run dev
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/v1
- **Admin Panel**: http://localhost:3001
- **Database Admin**: http://localhost:8080
- **Email Testing**: http://localhost:8025
- **File Storage**: http://localhost:9001

## 🧪 Testing the Setup

### 1. Frontend Testing
- Visit http://localhost:3000
- Test navigation between pages
- Try adding products to cart
- Test user registration/login
- Test language switching (Arabic/English)

### 2. Backend Testing
- Check API health: http://localhost:5000/health
- Test authentication endpoints
- Verify database connections
- Check file upload functionality

### 3. Database Testing
- Access Adminer at http://localhost:8080
- Login with: Server: `postgres`, Username: `soleva`, Password: `soleva123`, Database: `soleva_dev`
- Verify tables are created and seeded

### 4. Email Testing
- Access Mailhog at http://localhost:8025
- Trigger email sending (registration, password reset, etc.)
- Verify emails are captured

## 📁 Project Structure

```
soleva-store/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   └── utils/             # Utility functions
├── backend/               # Backend source code
│   ├── src/               # Backend source
│   ├── prisma/            # Database schema
│   └── uploads/           # File uploads
├── admin/                 # Admin panel
├── docker-compose.local.yml # Local services
└── docs/                  # Documentation
```

## 🔧 Development Commands

### Frontend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check
```

### Backend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests
npx prisma studio    # Open Prisma Studio
npx prisma migrate dev # Run migrations
npx prisma db seed   # Seed database
```

### Docker Commands
```bash
# Start services
docker-compose -f docker-compose.local.yml up -d

# Stop services
docker-compose -f docker-compose.local.yml down

# View logs
docker-compose -f docker-compose.local.yml logs -f

# Reset services (removes data)
docker-compose -f docker-compose.local.yml down -v
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :3000
   # Kill process
   kill -9 <PID>
   ```

2. **Database Connection Issues**
   ```bash
   # Check if PostgreSQL is running
   docker-compose -f docker-compose.local.yml ps postgres
   # Restart database
   docker-compose -f docker-compose.local.yml restart postgres
   ```

3. **Node Modules Issues**
   ```bash
   # Clear npm cache
   npm cache clean --force
   # Delete node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Prisma Issues**
   ```bash
   # Reset database
   npx prisma migrate reset
   # Regenerate client
   npx prisma generate
   ```

### Getting Help
- Check the logs: `docker-compose -f docker-compose.local.yml logs`
- Verify environment variables are set correctly
- Ensure all services are running: `docker-compose -f docker-compose.local.yml ps`

## 🎯 Features Available in Local Setup

✅ **Full E-commerce Functionality**
- Product catalog with filtering and search
- Shopping cart and checkout process
- User authentication and registration
- Order management and tracking
- Payment processing (test mode)
- Email notifications (captured in Mailhog)

✅ **Admin Panel**
- Product management
- Order management
- User management
- Analytics dashboard
- Multi-language support

✅ **Developer Features**
- Hot reload for frontend and backend
- Database management tools
- Email testing with Mailhog
- File storage with MinIO
- API documentation
- Error tracking and logging

## 🔒 Security Notes

- This setup is for **development only**
- Use strong passwords in production
- Never commit `.env` files to version control
- Use proper SSL certificates in production
- Implement proper CORS policies for production

## 📞 Support

If you encounter any issues during setup:
1. Check this guide thoroughly
2. Verify all prerequisites are installed
3. Check the troubleshooting section
4. Review the logs for error messages
5. Ensure all services are running correctly

---

**Happy coding! 🚀**
