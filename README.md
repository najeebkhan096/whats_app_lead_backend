# Lead Finder SaaS Backend

A complete enterprise-level Lead Finder backend system built with Node.js, Express, Playwright, PostgreSQL, Prisma ORM, and Redis Queue.

## 🚀 Deployment (Railway)

1. Connect this repo to [Railway.app](https://railway.app).
2. Add **PostgreSQL** and **Redis** services.
3. Set Variables:
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
   - `REDIS_HOST`: `${{Redis.REDIS_HOST}}`
   - `REDIS_PORT`: `${{Redis.REDIS_PORT}}`
   - `REDIS_PASSWORD`: `${{Redis.REDIS_PASSWORD}}`
4. Deploy a **Worker Service**:
   - Create a second service from the same repo.
   - Settings -> Deploy -> Start Command: `npm run worker:prod`

## Features

- 🔍 **Google Maps Scraper**: Automated business discovery and data extraction
- 📊 **Lead Classification**: Intelligent lead categorization and scoring
- 🌐 **Website Scraper**: Extract contact information and social media links
- 📱 **WhatsApp Validation**: Check WhatsApp number validity
- 👤 **User Authentication**: JWT-based auth with refresh tokens
- 🔄 **Background Jobs**: BullMQ queue for async processing
- 📈 **Export Tools**: Generate Excel and CSV reports
- 📚 **API Documentation**: Swagger/OpenAPI documentation
- 🔒 **Security**: Rate limiting, CORS, input validation
- 🐳 **Docker Support**: Ready for containerized deployment

## Tech Stack

- **Runtime**: Node.js (LTS)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Queue**: BullMQ + Redis
- **Browser Automation**: Playwright
- **Authentication**: JWT + bcrypt
- **Validation**: Joi
- **Logging**: Winston
- **Documentation**: Swagger/OpenAPI

## Project Structure

```
src/
├── app.ts                 # Express app setup
├── server.ts              # Server entry point
├── config/                # Configuration files
│   ├── env.ts
│   ├── database.ts
│   └── redis.ts
├── routes/                # API routes
│   ├── auth.ts
│   ├── scan.ts
│   └── export.ts
├── controllers/           # Request handlers
│   ├── authController.ts
│   ├── scanController.ts
│   └── exportController.ts
├── services/              # Business logic
│   ├── AuthService.ts
│   ├── ScanService.ts
│   ├── GoogleMapsScraperService.ts
│   ├── WebsiteScraperService.ts
│   └── ExportService.ts
├── repositories/          # Data access layer
│   ├── UserRepository.ts
│   ├── ScanJobRepository.ts
│   └── LeadRepository.ts
├── middleware/            # Express middleware
│   ├── auth.ts
│   ├── errorHandler.ts
│   └── validation.ts
├── workers/               # Background job workers
│   ├── scanWorker.ts
│   └── index.ts
├── utils/                 # Utility functions
│   ├── logger.ts
│   ├── errors.ts
│   ├── jwt.ts
│   ├── password.ts
│   ├── pagination.ts
│   └── validation.ts
├── docs/                  # Documentation
│   └── swagger.ts
└── prisma/                # Database schema
    └── schema.prisma
```

## Installation

### Prerequisites

- Node.js 18+ LTS
- PostgreSQL 12+
- Redis 6+
- npm or yarn

### Step 1: Clone and Setup

```bash
# Navigate to project directory
cd whats_lead_backend

# Install dependencies
npm install
```

### Step 2: Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/whats_lead

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Server
NODE_ENV=development
PORT=5000
```

### Step 3: Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed database with test data (optional)
npm run db:seed

# View database in Prisma Studio
npm run db:studio
```

### Step 4: Start Development Server

```bash
# Terminal 1: Start API server
npm run dev

# Terminal 2: Start worker (in another terminal)
npm run worker
```

The API will be available at `http://localhost:5000`
API Documentation: `http://localhost:5000/api-docs`

## Docker Setup

### Using Docker Compose (Recommended)

```bash
# Create .env file from example
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Run database migrations in container
docker-compose exec backend npm run db:migrate

# Seed database
docker-compose exec backend npm run db:seed

# Stop services
docker-compose down
```

**Docker Compose includes:**
- PostgreSQL database
- Redis server
- Backend API
- Background worker

## API Endpoints

### Authentication

```
POST /api/auth/register          # Register new user
POST /api/auth/login             # Login user
POST /api/auth/refresh           # Refresh access token
GET  /api/auth/profile           # Get user profile
```

### Scans

```
POST /api/scan/start              # Start new scan
GET  /api/scan/:jobId/status      # Get scan status
GET  /api/scan/:jobId/results     # Get scan results
DELETE /api/scan/:jobId           # Cancel/delete scan
GET  /api/scan/user/jobs          # Get user's scans
```

### Export

```
GET /api/export/excel/:jobId      # Export to Excel
GET /api/export/csv/:jobId        # Export to CSV
```

### Health

```
GET /health                       # Health check
```

## API Examples

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "SecurePassword123"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

### Start Scan

```bash
curl -X POST http://localhost:5000/api/scan/start \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "dentists in doha",
    "reviewLimit": 10,
    "checkWhatsapp": true,
    "scanMode": "both"
  }'
```

### Get Scan Results

```bash
curl -X GET "http://localhost:5000/api/scan/SCAN_JOB_ID/results?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Export to Excel

```bash
curl -X GET http://localhost:5000/api/export/excel/SCAN_JOB_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -o leads.xlsx
```

## Database Schema

### Users

```sql
- id (UUID)
- email (String, unique)
- name (String)
- password (String, hashed)
- role (ADMIN | USER)
- createdAt, updatedAt
```

### ScanJobs

```sql
- id (UUID)
- userId (Foreign key)
- query (String)
- status (PENDING | RUNNING | COMPLETED | FAILED | CANCELLED)
- progress (0-100)
- totalBusinesses (Integer)
- processedBusinesses (Integer)
- reviewLimit (Integer)
- checkWhatsapp (Boolean)
- scanMode (String)
- errorMessage (String, optional)
- createdAt, completedAt, updatedAt
```

### Leads

```sql
- id (UUID)
- scanJobId (Foreign key)
- businessName (String)
- category (String)
- address (String)
- phone (String)
- email (String)
- website (String)
- rating (Float)
- reviewCount (Integer)
- whatsappNumber (String)
- whatsappValid (Boolean)
- facebook, instagram, linkedin, youtube, tiktok (URLs)
- mapsUrl (String)
- lastReviewDate (String)
- leadType (CATEGORY_A | CATEGORY_B | NORMAL)
- suggestion (String)
- hasRecentOneStar (Boolean)
- leadQuality (0-100)
- createdAt, updatedAt
```

## Development

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check

# Run tests
npm run test
```

### Building for Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## Deployment

### Production Checklist

- [ ] Update `.env` with production values
- [ ] Set strong JWT secrets
- [ ] Configure PostgreSQL backups
- [ ] Set up Redis persistence
- [ ] Enable CORS for production domain
- [ ] Configure SSL/TLS certificates
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting appropriately
- [ ] Enable database connection pooling

### Environment Variables for Production

```env
NODE_ENV=production
JWT_SECRET=<generate_strong_secret>
JWT_REFRESH_SECRET=<generate_strong_secret>
DATABASE_URL=postgresql://<user>:<pass>@<host>/<db>
REDIS_HOST=<redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<strong_password>
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
psql -U whats_lead -d whats_lead -c "SELECT 1"

# Reset migrations
npm run db:migrate reset

# Check connection string
echo $DATABASE_URL
```

### Redis Connection Issues

```bash
# Check Redis is running
redis-cli ping

# Check Redis password
redis-cli -a $REDIS_PASSWORD ping
```

### Worker Issues

```bash
# Check logs
tail -f logs/all.log

# Restart worker
npm run worker

# Check Redis queue
redis-cli
> LLEN bull:scan-jobs:*
```

## Performance Optimization

- Database query optimization with indexes
- Redis caching for frequent queries
- Connection pooling for PostgreSQL
- Concurrent job processing (3 jobs by default)
- Pagination for large result sets
- Rate limiting to prevent abuse

## Security Best Practices

- JWT tokens with expiration
- Password hashing with bcrypt
- Input validation with Joi
- SQL injection prevention via Prisma
- CORS configuration
- Helmet for HTTP headers
- Rate limiting middleware
- Error handling without sensitive data leakage

## License

MIT

## Support

For issues and questions, please refer to the documentation or create an issue in the repository.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Roadmap

- [ ] Advanced search filters
- [ ] Bulk operations API
- [ ] Email notifications
- [ ] Webhook support
- [ ] API rate limit per user
- [ ] Custom export templates
- [ ] Lead scoring algorithms
- [ ] CRM integrations
- [ ] Mobile app API optimization
- [ ] Multi-language support
# whats_app_lead_backend
