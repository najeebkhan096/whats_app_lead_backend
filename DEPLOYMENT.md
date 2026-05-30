# Deployment Guide

Complete guide for deploying Lead Finder to production.

## Pre-Deployment Checklist

- [ ] Code is tested and bug-free
- [ ] All dependencies are up to date
- [ ] Environment variables are configured
- [ ] Database backups are set up
- [ ] SSL/TLS certificates are obtained
- [ ] Monitoring and logging are configured
- [ ] Rate limiting is appropriate for production load
- [ ] Database indexes are created
- [ ] Security headers are configured

## Deployment Options

### Option 1: Docker Compose on VPS

#### Prerequisites
- VPS with Docker and Docker Compose installed
- 2GB+ RAM, 2+ CPU cores recommended
- PostgreSQL backups configured
- Redis persistence enabled

#### Steps

1. **Prepare Server**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

2. **Deploy Application**
```bash
# Clone repository
cd /opt
sudo git clone <repo-url> whats-lead-backend
cd whats-lead-backend

# Create production environment file
sudo cp .env.example .env
sudo nano .env  # Configure for production

# Set permissions
sudo chmod 600 .env
```

3. **Configure Environment**
```bash
# Generate strong secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
openssl rand -base64 32  # For REDIS_PASSWORD

# Update .env with production values
sudo nano .env
```

4. **Start Services**
```bash
# Build and start
sudo docker-compose up -d

# Check status
sudo docker-compose ps

# View logs
sudo docker-compose logs -f backend

# Run migrations
sudo docker-compose exec backend npm run db:migrate

# Seed (optional)
sudo docker-compose exec backend npm run db:seed
```

5. **Setup Reverse Proxy (Nginx)**
```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/leadfinder

# Add configuration:
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/leadfinder /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

6. **Setup SSL/TLS**
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com

# Configure auto-renewal
sudo systemctl enable certbot.timer
```

### Option 2: Kubernetes Deployment

#### Prerequisites
- Kubernetes cluster (EKS, GKE, AKS, or self-hosted)
- kubectl configured
- Helm (optional but recommended)

#### Steps

1. **Create Deployment Manifest**
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: leadfinder-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: leadfinder-backend
  template:
    metadata:
      labels:
        app: leadfinder-backend
    spec:
      containers:
      - name: backend
        image: your-registry/leadfinder:latest
        ports:
        - containerPort: 5000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: REDIS_HOST
          value: redis-service
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
```

2. **Deploy to Kubernetes**
```bash
# Create namespace
kubectl create namespace leadfinder

# Create secrets
kubectl create secret generic app-secrets \
  --from-literal=database-url=postgresql://... \
  --from-literal=jwt-secret=... \
  -n leadfinder

# Create ConfigMap for non-sensitive config
kubectl create configmap app-config \
  --from-literal=NODE_ENV=production \
  -n leadfinder

# Deploy
kubectl apply -f deployment.yaml -n leadfinder

# Expose service
kubectl expose deployment leadfinder-backend \
  --type=LoadBalancer \
  --port=5000 \
  -n leadfinder

# Check status
kubectl get pods -n leadfinder
kubectl logs -f deployment/leadfinder-backend -n leadfinder
```

### Option 3: Cloud Platform (Heroku, Railway, Render)

#### Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Create project
railway create --name leadfinder-backend

# Add services
railway add postgresql
railway add redis

# Deploy
railway up

# View logs
railway logs
```

## Production Configuration

### Environment Variables
```env
NODE_ENV=production
PORT=5000
API_BASE_URL=https://api.yourdomain.com

# Database (Production)
DATABASE_URL=postgresql://user:strong_password@prod-db.example.com:5432/whats_lead

# JWT
JWT_SECRET=<64-char-hex-string>
JWT_REFRESH_SECRET=<64-char-hex-string>
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# Redis (Production)
REDIS_HOST=prod-redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=<strong-password>

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/12345
```

## Database Management

### PostgreSQL Backups

```bash
# Automated daily backup
0 2 * * * pg_dump -U whats_lead whats_lead > /backups/whats_lead_$(date +\%Y\%m\%d).sql

# Restore from backup
psql -U whats_lead whats_lead < /backups/whats_lead_20240101.sql

# Cloud backup (AWS S3)
0 3 * * * pg_dump -U whats_lead whats_lead | gzip | aws s3 cp - s3://my-bucket/db-backups/whats_lead_$(date +\%Y\%m\%d).sql.gz
```

### Performance Tuning

```sql
-- Create essential indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_scan_jobs_user_id ON scan_jobs(user_id);
CREATE INDEX idx_scan_jobs_status ON scan_jobs(status);
CREATE INDEX idx_scan_jobs_created_at ON scan_jobs(created_at DESC);
CREATE INDEX idx_leads_scan_job_id ON leads(scan_job_id);
CREATE INDEX idx_leads_lead_type ON leads(lead_type);
CREATE INDEX idx_leads_rating ON leads(rating DESC);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Analyze query plans
ANALYZE;
```

## Monitoring & Logging

### Application Monitoring

```bash
# Install PM2 for process management
npm install -g pm2

# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'api',
      script: 'dist/server.js',
      instances: 4,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'worker',
      script: 'dist/workers/index.js',
      instances: 2,
      exec_mode: 'cluster'
    }
  ]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Log Aggregation (ELK Stack)

```yaml
# Filebeat configuration
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /app/logs/*.log

output.elasticsearch:
  hosts: ["elasticsearch:9200"]

processors:
  - add_kubernetes_metadata: ~
```

### Uptime Monitoring

```bash
# Use services like:
# - Healthchecks.io
# - Uptime Kuma
# - Zabbix
# - New Relic

# Health check endpoint
curl https://api.yourdomain.com/health
```

## Scaling

### Horizontal Scaling

```yaml
# Docker Compose with load balancer
version: '3.8'
services:
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf

  backend:
    image: leadfinder:latest
    deploy:
      replicas: 3
    environment:
      - DATABASE_URL=postgresql://...
```

### Vertical Scaling

```bash
# Increase memory and CPU allocation
# Update docker-compose.yml or Kubernetes manifest with higher limits
```

## Security Hardening

### WAF Configuration (if using CloudFlare)
- Enable DDoS protection
- Configure rate limiting
- Block suspicious countries

### Network Security
```bash
# Configure firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### Database Security
```sql
-- Restrict user permissions
REVOKE ALL ON DATABASE whats_lead FROM public;
GRANT CONNECT ON DATABASE whats_lead TO whats_lead;
GRANT USAGE ON SCHEMA public TO whats_lead;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO whats_lead;
```

## Disaster Recovery

### Backup Strategy
- Daily automated backups
- Monthly full backups retained for 1 year
- Cross-region replication for critical data

### Recovery Procedures
```bash
# Automated failover script
#!/bin/bash
if ! curl -f http://localhost:5000/health; then
  docker-compose restart backend
  docker-compose exec backend npm run db:migrate
fi
```

## Monitoring Commands

```bash
# Check application status
curl https://api.yourdomain.com/health

# View logs
docker-compose logs -f backend
docker-compose logs -f worker

# Database health
docker-compose exec postgres pg_isready

# Redis health
docker-compose exec redis redis-cli ping

# System resources
docker stats
```

## Post-Deployment

1. **Verify Services**
   - API is responding
   - Database is connected
   - Workers are processing jobs
   - Logs are being recorded

2. **Performance Testing**
   - Load testing with k6 or Apache JMeter
   - Database query optimization
   - Cache hit rates

3. **Security Audit**
   - Vulnerability scanning
   - Penetration testing
   - SSL/TLS verification

4. **Documentation**
   - Update runbooks
   - Document procedures
   - Train team

## Troubleshooting

### Services Won't Start
```bash
# Check logs
docker-compose logs backend

# Verify configuration
docker-compose config

# Reset and restart
docker-compose down -v
docker-compose up -d
```

### Database Connection Issues
```bash
# Test connection
docker-compose exec backend psql $DATABASE_URL -c "SELECT 1"

# Check PostgreSQL status
docker-compose exec postgres pg_isready
```

### High Memory Usage
```bash
# Check memory usage
docker stats

# Optimize Node.js
NODE_OPTIONS=--max-old-space-size=2048

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHDB
```

## Rollback Procedure

```bash
# Keep previous version
docker save leadfinder:v1.0 > leadfinder-v1.0.tar

# Rollback
docker load < leadfinder-v1.0.tar
docker-compose down
docker-compose up -d
```

## Cost Optimization

- Use appropriate server size
- Auto-scaling based on load
- CDN for static assets
- Database query optimization
- Connection pooling
- Caching strategies
