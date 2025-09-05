# ClimaHealth AI Backend - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Production Deployment](#production-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Cloud Deployment](#cloud-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)

## Prerequisites

### System Requirements
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher
- **MongoDB**: Version 5.0 or higher
- **Memory**: Minimum 2GB RAM (4GB recommended for production)
- **Storage**: Minimum 10GB available space

### External Services
- **MongoDB Atlas** (recommended for production)
- **OpenWeatherMap API** account and API key
- **AQICN** account and token
- **OpenAI API** account and key (optional)

## Local Development

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd climahealth-ai-backend

# Install dependencies
npm install

# Install development dependencies
npm install --save-dev jest supertest nodemon
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGO_URI=mongodb://localhost:27017/climahealth_dev

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-key-min-32-chars
JWT_EXPIRES=7d

# External API Keys
OPENWEATHER_API_KEY=your-openweather-api-key
AQICN_TOKEN=your-aqicn-token
POLLEN_API_KEY=your-pollen-api-key
OPENAI_API_KEY=your-openai-api-key

# Default Location (Lagos, Nigeria)
DEFAULT_LAT=6.5244
DEFAULT_LON=3.3792
DEFAULT_CITY=Lagos
DEFAULT_COUNTRY=NG

# Development Settings
LOG_LEVEL=debug
ENABLE_CORS=true
```

### 3. Database Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# macOS
brew install mongodb-community

# Ubuntu
sudo apt-get install mongodb

# Start MongoDB
mongod --dbpath /path/to/your/db
```

**Option B: MongoDB Atlas**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Configure network access (add your IP)
4. Create database user
5. Get connection string and update `MONGO_URI`

### 4. Start Development Server

```bash
# Start with hot reload
npm run dev

# Or start normally
npm start
```

The server will be available at `http://localhost:4000`

### 5. Verify Installation

```bash
# Check health endpoint
curl http://localhost:4000/health

# Expected response:
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

## Production Deployment

### 1. Server Preparation

**Ubuntu 20.04 LTS Setup:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y

# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Application Deployment

```bash
# Create application directory
sudo mkdir -p /var/www/climahealth-api
sudo chown $USER:$USER /var/www/climahealth-api

# Clone and setup application
cd /var/www/climahealth-api
git clone <repository-url> .
npm ci --only=production

# Create production environment file
sudo nano .env
```

**Production `.env` file:**
```env
NODE_ENV=production
PORT=4000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/climahealth
JWT_SECRET=your-production-jwt-secret-64-chars-minimum
JWT_REFRESH_SECRET=your-production-refresh-secret-64-chars-minimum
JWT_EXPIRES=7d
FRONTEND_URL=https://your-frontend-domain.com
OPENWEATHER_API_KEY=your-production-api-key
AQICN_TOKEN=your-production-token
OPENAI_API_KEY=your-production-openai-key
```

### 3. PM2 Configuration

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'climahealth-api',
    script: 'src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

Start the application:
```bash
# Create logs directory
mkdir logs

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### 4. Nginx Configuration

Create `/etc/nginx/sites-available/climahealth-api`:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (no rate limiting)
    location /health {
        proxy_pass http://localhost:4000/health;
        access_log off;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/climahealth-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Certificate

```bash
# Obtain SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Docker Deployment

### 1. Dockerfile

```dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Bundle app source
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

CMD ["npm", "start"]
```

### 2. Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    container_name: climahealth-api
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/climahealth
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY}
      - AQICN_TOKEN=${AQICN_TOKEN}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - mongo
      - redis
    volumes:
      - ./logs:/app/logs
    networks:
      - climahealth-network

  mongo:
    image: mongo:5.0
    container_name: climahealth-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: climahealth
    volumes:
      - mongo_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - climahealth-network

  redis:
    image: redis:7-alpine
    container_name: climahealth-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - climahealth-network

  nginx:
    image: nginx:alpine
    container_name: climahealth-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - api
    networks:
      - climahealth-network

volumes:
  mongo_data:
  redis_data:

networks:
  climahealth-network:
    driver: bridge
```

### 3. Environment File for Docker

Create `.env` file:
```env
# MongoDB
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=secure_password_here

# Application
JWT_SECRET=your-jwt-secret-64-chars-minimum
JWT_REFRESH_SECRET=your-refresh-secret-64-chars-minimum
OPENWEATHER_API_KEY=your-api-key
AQICN_TOKEN=your-token
OPENAI_API_KEY=your-openai-key
```

### 4. Deploy with Docker Compose

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f api

# Scale API service
docker-compose up -d --scale api=3

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```
