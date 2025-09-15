# 🚀 Soleva Store - Quick Start Guide

## Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

## One-Command Setup
```bash
# Clone and setup everything
git clone <your-repo>
cd soleva-store
./start-local.sh
```

## Manual Setup
```bash
# 1. Start services
docker-compose -f docker-compose.local.yml up -d

# 2. Setup backend
cd backend
cp env.local.example .env
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev

# 3. Setup frontend (new terminal)
cd ..
cp env.local.example .env.local
npm install
npm run dev

# 4. Setup admin (new terminal)
cd admin
npm install
npm run dev
```

## Access Points
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000/api/v1
- **Admin**: http://localhost:3001
- **Database**: http://localhost:8080
- **Email Test**: http://localhost:8025
- **File Storage**: http://localhost:9001

## Stop Everything
```bash
./stop-local.sh
```

## Database Credentials
- **Host**: localhost:5432
- **Database**: soleva_dev
- **Username**: soleva
- **Password**: soleva123

## Default Admin User
- **Email**: admin@solevaeg.com
- **Password**: admin123

## Troubleshooting
- Check logs: `docker-compose -f docker-compose.local.yml logs`
- Reset database: `npx prisma migrate reset`
- Restart services: `docker-compose -f docker-compose.local.yml restart`

For detailed instructions, see [LOCAL_SETUP.md](./LOCAL_SETUP.md)
