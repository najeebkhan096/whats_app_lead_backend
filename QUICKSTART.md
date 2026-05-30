# Quick Start Guide

Get Lead Finder SaaS Backend running in 5 minutes.

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis 6+

## Quick Setup

### 1. Install & Configure

```bash
# Navigate to project
cd whats_lead_backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env (minimum required)
DATABASE_URL=postgresql://user:password@localhost:5432/whats_lead
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-key
```

### 2. Setup Database

```bash
# Run migrations
npm run db:migrate

# Seed with test data (optional)
npm run db:seed
```

### 3. Start Development

```bash
# Terminal 1: Start API
npm run dev

# Terminal 2: Start Worker
npm run worker
```

## Quick API Test

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "Password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

Save the `accessToken` from response.

### Start Scan
```bash
curl -X POST http://localhost:5000/api/scan/start \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "restaurants in new york",
    "reviewLimit": 10,
    "checkWhatsapp": true,
    "scanMode": "both"
  }'
```

Save the `jobId` from response.

### Get Scan Status
```bash
curl -X GET http://localhost:5000/api/scan/JOB_ID/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Results
```bash
curl -X GET "http://localhost:5000/api/scan/JOB_ID/results?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Using Docker Compose

```bash
# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend npm run db:migrate

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## API Documentation

- **Swagger UI**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health

## Database Management

```bash
# View database in Prisma Studio
npm run db:studio

# Check database
psql -U whats_lead -d whats_lead

# View logs
tail -f logs/all.log
```

## Troubleshooting

### Database won't connect
```bash
# Check PostgreSQL is running
psql -U whats_lead -d whats_lead -c "SELECT 1"

# Check connection string in .env
echo $DATABASE_URL
```

### Redis won't connect
```bash
# Check Redis is running
redis-cli ping

# Should output: PONG
```

### Port already in use
```bash
# Find process on port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

## Next Steps

1. Read [README.md](README.md) for complete documentation
2. Check [API_DOCS.md](API_DOCS.md) for all endpoints
3. Follow [SETUP.md](SETUP.md) for detailed setup guide
4. Review [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment

## Key Features

✅ Google Maps business scraping
✅ Lead classification & scoring
✅ Website data extraction
✅ WhatsApp validation
✅ User authentication (JWT)
✅ Background job processing
✅ Excel/CSV export
✅ RESTful API
✅ Swagger documentation
✅ Docker ready

## Useful Commands

```bash
# Development
npm run dev              # Start API server
npm run worker           # Start background worker
npm run db:studio        # Open database editor
npm run lint             # Check code quality
npm run format           # Format code

# Production
npm run build            # Build TypeScript
npm start                # Start production server

# Database
npm run db:migrate       # Run migrations
npm run db:push          # Sync schema
npm run db:seed          # Seed data

# Testing
npm run test             # Run tests
npm run type-check       # TypeScript check
```

## Support

- **Issues**: Check existing documentation
- **Logs**: View logs in `logs/` directory
- **Database**: Use `npm run db:studio`
- **API**: Test via Swagger UI at `/api-docs`

## Production Deployment

For production deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

Key steps:
1. Generate strong secrets
2. Setup PostgreSQL backups
3. Configure Redis persistence
4. Setup SSL/TLS certificates
5. Deploy with Docker Compose or Kubernetes
6. Configure monitoring and logging

---

**Version**: 1.0.0
**Last Updated**: 2024
**License**: MIT
