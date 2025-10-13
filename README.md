# Readdig

Readdig is an RSS and Podcast reader application.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Development Setup](#development-setup)
  - [Docker Deployment](#docker-deployment)
- [Configuration](#configuration)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

- RSS feed reader
- Podcast player
- User authentication and management
- Feed organization with folders and tags
- Article starring and reading history
- OPML import/export
- Email notifications
- Payment integration with Paddle

## Architecture

The application consists of:

- **API**: Node.js backend service (Express.js)
- **App**: React frontend (Create React App)
- **Database**: PostgreSQL
- **Cache**: Redis
- **Queue**: Bull (Redis-based)

## Prerequisites

- Node.js 18.20.8 or later
- PostgreSQL 12 or later
- Redis 6 or later
- Docker and Docker Compose (for Docker deployment)

## Installation

### Development Setup

#### 1. Clone Repository

```bash
git clone <your-repository-url>
cd readdig_pg
```

#### 2. Setup API

```bash
cd api

# Install dependencies
yarn install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run database migrations
yarn db:migrate

# Start development server
yarn dev
```

The API will be available at `http://localhost:8000`

#### 3. Setup App

```bash
cd ../app

# Install dependencies
yarn install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start development server
yarn start
```

The app will be available at `http://localhost:3000`

### Docker Deployment

#### 1. Clone Repository

```bash
git clone <your-repository-url>
cd readdig_pg
```

#### 2. Configure API Service

```bash
cd api

# Copy configuration templates
cp docker-compose.yml.example docker-compose.yml
cp .env.example .env
cp ecosystem.config.prod.cjs.example ecosystem.config.prod.cjs
```

Edit `api/.env`:

```bash
# Production environment
NODE_ENV=production

# API Configuration
API_PORT=8000
API_HOST=0.0.0.0

# Product Information
PRODUCT_URL=https://www.readdig.com
PRODUCT_NAME=Readdig.com
USER_AGENT=ReaddigBot/1.0 (https://www.readdig.com)

# Security - IMPORTANT: Generate secure keys
JWT_SECRET=your-jwt-secret-key-here

# Email Configuration (SendGrid)
EMAIL_SENDER_SUPPORT_NAME=Readdig Support
EMAIL_SENDER_SUPPORT_EMAIL=support@readdig.com
EMAIL_SENDGRID_SECRET=your-sendgrid-api-key

# Optional: Cloudflare Worker Proxy
CLOUDFLARE_PROXY_URL=https://your-worker.workers.dev
CLOUDFLARE_PROXY_SECRET=your-cloudflare-secret

# Optional: Paddle Payment Integration
PADDLE_PUBLIC_KEY=your-paddle-public-key
PADDLE_API_URL=https://vendors.paddle.com/api/2.0
PADDLE_VENDOR_ID=your-vendor-id
PADDLE_VENDOR_AUTH_CODE=your-auth-code

# Optional: Sentry Error Tracking
SENTRY_DSN=your-sentry-dsn
```

Edit `api/docker-compose.yml` to set a secure database password:

```yaml
api:
  environment:
    DATABASE_URL: postgresql://readdig:your-secure-password@database:5432/readdig

database:
  environment:
    POSTGRES_PASSWORD: your-secure-password
```

**Important**: Make sure the database password in `database.environment.POSTGRES_PASSWORD` matches the one in `api.environment.DATABASE_URL`

**Note**: Redis runs without password in the internal Docker network, which is secure for private deployments.

#### 3. Start API Services

```bash
# Build and start all services (API, PostgreSQL, Redis)
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f api
```

The API will be available at `http://localhost:8000`

**Note**: Database migrations will run automatically when the API container starts.

#### 4. Configure App Service

```bash
cd ../app

# Copy configuration templates
cp docker-compose.yml.example docker-compose.yml
cp .env.example .env
```

Edit `app/.env`:

```bash
# React App Configuration
NODE_ENV=production

# Product Information
REACT_APP_PRODUCT_URL=https://www.readdig.com
REACT_APP_PRODUCT_NAME=Readdig.com
REACT_APP_PRODUCT_DESCRIPTION=Readdig.com an RSS and Podcast reader

# API Endpoint - IMPORTANT: Point to your actual API
REACT_APP_API_URL=https://api.readdig.com
# Or if API is on same domain: https://www.readdig.com/api

# Optional: Analytics and Monitoring
REACT_APP_SENTRY_DSN=your-sentry-dsn
REACT_APP_PADDLE_VENDOR_ID=your-paddle-vendor-id
REACT_APP_GOOGLE_ANALYTICS=your-ga-tracking-id
```

#### 5. Build and Start App Service

```bash
# Build the app (compiles React with environment variables)
docker-compose build

# Start the app service
docker-compose up -d

# View logs
docker-compose logs -f app
```

The frontend will be available at `http://localhost:80`

#### 6. Verify Deployment

```bash
# Check API health
curl http://localhost:8000/health

# Expected response: {"status":"ok"}
```

Open your browser:
- Frontend: `http://localhost:80`
- API: `http://localhost:8000`

## Configuration

### Environment Variables

#### API Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `API_PORT` | API server port | Yes |
| `API_HOST` | API server host | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `CACHE_URL` | Redis connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `EMAIL_SENDGRID_SECRET` | SendGrid API key | No |
| `SENTRY_DSN` | Sentry error tracking DSN | No |
| `PADDLE_VENDOR_ID` | Paddle vendor ID | No |

#### App Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_PRODUCT_URL` | Product URL | Yes |
| `REACT_APP_PRODUCT_NAME` | Product name | Yes |
| `REACT_APP_API_URL` | API endpoint URL | Yes |
| `REACT_APP_SENTRY_DSN` | Sentry DSN | No |
| `REACT_APP_PADDLE_VENDOR_ID` | Paddle vendor ID | No |
| `REACT_APP_GOOGLE_ANALYTICS` | Google Analytics ID | No |

### Production Deployment with Reverse Proxy

For production, use a reverse proxy (Nginx/Caddy) to:
- Handle SSL/TLS certificates
- Route requests to appropriate services
- Serve both app and API from the same domain

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name www.readdig.com;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Maintenance

### View Logs

```bash
# API logs
cd api && docker-compose logs -f api

# App logs
cd app && docker-compose logs -f app

# Database logs
cd api && docker-compose logs -f database
```

### Restart Services

```bash
# Restart API
cd api && docker-compose restart api

# Restart App
cd app && docker-compose restart app
```

### Update Application

```bash
# Pull latest code
git pull

# Update API
cd api
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Update App (requires rebuild when env vars change)
cd ../app
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Backup Database

```bash
# Create backup
docker exec database pg_dump -U readdig readdig > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker exec -i database psql -U readdig readdig < backup_20231201_120000.sql
```

### Monitor Resources

```bash
# View resource usage
docker stats

# View disk usage
docker system df
```

## Troubleshooting

### API Cannot Connect to Database

1. Check database is running:
   ```bash
   docker-compose ps database
   ```

2. Verify `DATABASE_URL` in `.env`:
   ```bash
   DATABASE_URL=postgresql://readdig:password@database:5432/readdig
   ```

3. Check database logs:
   ```bash
   docker-compose logs database
   ```

### App Shows API Connection Error

1. Verify `REACT_APP_API_URL` in `app/.env`
2. Rebuild the app (React env vars are set at build time):
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Port Already in Use

Change the port mapping in `docker-compose.yml`:

```yaml
ports:
  - '8080:8000'  # Use port 8080 instead of 8000
```

### Out of Disk Space

Clean up Docker resources:

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Clean everything
docker system prune -a --volumes
```

### Environment Variables Not Working

**For API**: Restart the container after changing `.env`:
```bash
docker-compose restart api
```

**For App**: Rebuild the image (React bakes env vars at build time):
```bash
docker-compose build --no-cache
docker-compose up -d
```

## Security Best Practices

1. **Change Default Passwords**: Update database password in both `docker-compose.yml` and `.env`
2. **Use Strong JWT Secret**: Generate a secure random string for `JWT_SECRET`
3. **Enable HTTPS**: Use a reverse proxy with SSL/TLS certificates
4. **Restrict Ports**: Only expose necessary ports to the public
5. **Regular Updates**: Keep Docker images and dependencies updated
6. **Environment Variables**: Never commit `.env` files to version control
7. **Database Backups**: Set up automated database backups

## Development

### Available Scripts

#### API Scripts

```bash
yarn api          # Start API server
yarn conductor    # Start conductor worker
yarn feed         # Start feed worker
yarn og           # Start OG worker
yarn clean        # Start clean worker
yarn dev          # Start all services with PM2
yarn build        # Build for production
yarn db:migrate   # Run database migrations
yarn db:studio    # Open Drizzle Studio
```

#### App Scripts

```bash
yarn start        # Start development server
yarn build        # Build for production
yarn test         # Run tests
```

## License

[Your License Information]
