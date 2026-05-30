# Environment Setup Guide

## Development Environment

### 1. Install Prerequisites

#### macOS
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install PostgreSQL
brew install postgresql@15

# Install Redis
brew install redis

# Verify installations
node --version
npm --version
psql --version
redis-server --version
```

#### Ubuntu/Debian
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Verify installations
node --version
npm --version
psql --version
redis-server --version
```

#### Windows
- Download and install [Node.js](https://nodejs.org/) (LTS)
- Download and install [PostgreSQL](https://www.postgresql.org/download/windows/)
- Download and install [Redis](https://github.com/microsoftarchive/redis/releases)

### 2. PostgreSQL Setup

#### macOS
```bash
# Start PostgreSQL
brew services start postgresql@15

# Create database and user
createuser whats_lead -P
# Enter password: whats_lead_secure_password

createdb -O whats_lead whats_lead

# Verify
psql -U whats_lead -d whats_lead -c "SELECT 1"
```

#### Ubuntu/Debian
```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE USER whats_lead WITH PASSWORD 'whats_lead_secure_password';
CREATE DATABASE whats_lead OWNER whats_lead;
ALTER ROLE whats_lead CREATEDB;
\q

# Verify
psql -U whats_lead -d whats_lead -c "SELECT 1"
```

### 3. Redis Setup

#### macOS
```bash
# Start Redis
brew services start redis

# Verify
redis-cli ping
# Output: PONG
```

#### Ubuntu/Debian
```bash
# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping
# Output: PONG
```

### 4. Project Setup

```bash
# Clone repository
cd whats_lead_backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your settings
nano .env
```

### 5. Database Configuration

```bash
# Set DATABASE_URL in .env
DATABASE_URL="postgresql://whats_lead:whats_lead_secure_password@localhost:5432/whats_lead"

# Run Prisma migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 6. Start Development

```bash
# Terminal 1: Start API server
npm run dev

# Terminal 2: Start worker
npm run worker

# Terminal 3 (optional): View database
npm run db:studio
```

## Docker Setup (Recommended for Production)

### Prerequisites
- Docker
- Docker Compose

### Steps

```bash
# Copy environment file
cp .env.example .env

# Update .env with your configuration
nano .env

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Run migrations
docker-compose exec backend npm run db:migrate

# Seed database (optional)
docker-compose exec backend npm run db:seed

# Verify services
docker-compose ps

# Stop services
docker-compose down
```

## Environment Variables

### Database
- `DATABASE_URL`: PostgreSQL connection string

### JWT
- `JWT_SECRET`: Secret key for access tokens
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens
- `JWT_EXPIRY`: Access token expiration (default: 24h)
- `JWT_REFRESH_EXPIRY`: Refresh token expiration (default: 7d)

### Redis
- `REDIS_HOST`: Redis server host (default: localhost)
- `REDIS_PORT`: Redis server port (default: 6379)
- `REDIS_PASSWORD`: Redis password (optional)

### Server
- `NODE_ENV`: Environment (development/production/test)
- `PORT`: Server port (default: 5000)
- `API_BASE_URL`: API base URL for documentation

### Logging
- `LOG_LEVEL`: Log level (debug/info/warn/error)

### CORS
- `CORS_ORIGIN`: Allowed origins (comma-separated)

### Playwright
- `PLAYWRIGHT_HEADLESS`: Run browser in headless mode (default: true)
- `PLAYWRIGHT_TIMEOUT`: Browser timeout in ms (default: 30000)

## Troubleshooting

### PostgreSQL Connection Failed
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify credentials
psql -U whats_lead -d whats_lead -c "SELECT 1"

# Check .env DATABASE_URL format
echo $DATABASE_URL
```

### Redis Connection Failed
```bash
# Check if Redis is running
redis-cli ping

# If Redis requires password
redis-cli -a YOUR_PASSWORD ping

# Check Redis configuration
redis-cli CONFIG GET "*"
```

### Node Modules Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

## Production Deployment

### Generate Strong Secrets
```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Environment for Production
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@prod-db:5432/whats_lead
JWT_SECRET=<strong-secret>
JWT_REFRESH_SECRET=<strong-secret>
REDIS_HOST=prod-redis
REDIS_PASSWORD=<strong-password>
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

### Deployment Checklist
- [ ] All secrets configured
- [ ] Database backups configured
- [ ] Redis persistence enabled
- [ ] SSL/TLS certificates installed
- [ ] Rate limiting configured
- [ ] Monitoring and alerting set up
- [ ] Logging aggregation configured
- [ ] Environment variables validated

## Performance Tuning

### PostgreSQL
```sql
-- Create indexes for common queries
CREATE INDEX idx_scan_jobs_user_id ON scan_jobs(user_id);
CREATE INDEX idx_scan_jobs_status ON scan_jobs(status);
CREATE INDEX idx_leads_scan_job_id ON leads(scan_job_id);
CREATE INDEX idx_leads_lead_type ON leads(lead_type);

-- Enable connection pooling
-- Use pgBouncer or similar
```

### Redis
```bash
# Increase maxmemory
redis-cli CONFIG SET maxmemory 1gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Persist data
redis-cli CONFIG SET appendonly yes
```

### Node.js
```bash
# Increase memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm start
```

## Monitoring

### Health Endpoint
```bash
curl http://localhost:5000/health
```

### Logs
```bash
# View logs
tail -f logs/all.log

# View errors
tail -f logs/error.log
```

### Database
```bash
# Connect to PostgreSQL
psql -U whats_lead -d whats_lead

# Check table sizes
\dt+ leads
\dt+ scan_jobs

# Check slow queries
EXPLAIN ANALYZE SELECT * FROM leads WHERE rating > 4;
```

## Additional Resources

- [Node.js Documentation](https://nodejs.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Prisma ORM Guide](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Playwright Documentation](https://playwright.dev/)
