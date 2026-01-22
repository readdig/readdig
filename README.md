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
- Feed organization with folders and tags
- Article starring and reading history
- OPML import/export
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
git clone https://github.com/readdig/readdig.git
cd readdig
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

This is the recommended way to deploy Readdig for production use. It uses pre-built images from GitHub Container Registry.

#### 1. Get Configuration Files

You can clone the repository to get the necessary configuration files (or just download the specific files you need):

```bash
git clone https://github.com/readdig/readdig.git
cd readdig
```

#### 2. Configure Environment

1.  **Docker Compose**:
    ```bash
    cp docker-compose.example.yml docker-compose.yml
    ```

2.  **Edit Configuration**:
    Open `docker-compose.yml` and modify the `environment` sections for both `api` and `app` services.
    *   **Database**: Set `POSTGRES_PASSWORD` and update `DATABASE_URL` to match.
    *   **Security**: Set a secure `JWT_SECRET`.
    *   **Domain**: Update `PRODUCT_URL`, `REACT_APP_PRODUCT_URL` and `REACT_APP_API_URL`.

3.  **Nginx (Optional but Recommended)**:
    If you want to run Nginx as a reverse proxy in front of the containers:
    ```bash
    cp nginx.example.conf nginx.conf
    # Edit to match your server_name, then include it in your Nginx setup
    ```

#### 3. Start Services

```bash
# Pull the latest images
docker compose pull

# Start containers in background
docker compose up -d

# Check status
docker compose ps
```

The services will be available at:
*   **Frontend**: `http://localhost:3000` (or `http://localhost` if using Nginx)
*   **API**: `http://localhost:8000` (or `http://localhost/api` if using Nginx)

#### 4. Customizing Configuration (Advanced)

*   **API Scaling**: The API service defaults to 1 instance. If you need to scale or change PM2 settings, you can mount a custom config file to `/app/ecosystem.prod.config.js`. See `docker-compose.yml` for an example.
*   **Database Migrations**: Migrations run automatically on container startup.

#### 5. Verify

```bash
curl http://localhost:8000/health
# Should return {"status":"ok"}
```

## Configuration

### Docker Environment Variables

Configure these values in your `docker-compose.yml` file under the `environment` section for each service.

#### API Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `API_PORT` | API server port | Yes |
| `API_HOST` | API server host | No |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `CACHE_URL` | Redis connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `PRODUCT_URL` | Product URL | Yes |
| `PRODUCT_NAME` | Product name | Yes |
| `USER_AGENT` | User agent for feed fetching | No |
| `STATIC_PATH` | Static files path (default: `./static`) | No |
| `EMAIL_BACKEND` | Email backend (only `sendgrid` supported, leave empty to disable) | No |
| `EMAIL_SENDGRID_SECRET` | SendGrid API key | No |
| `EMAIL_SENDER_SUPPORT_NAME` | Support email sender name | No |
| `EMAIL_SENDER_SUPPORT_EMAIL` | Support email sender address | No |
| `CLOUDFLARE_PROXY_URL` | Cloudflare worker proxy URL | No |
| `CLOUDFLARE_PROXY_SECRET` | Cloudflare worker proxy secret | No |
| `PADDLE_PUBLIC_KEY` | Paddle public key | No |
| `PADDLE_API_URL` | Paddle API URL | No |
| `PADDLE_VENDOR_ID` | Paddle vendor ID | No |
| `PADDLE_VENDOR_AUTH_CODE` | Paddle vendor auth code | No |
| `SENTRY_DSN` | Sentry error tracking DSN | No |
| `GRAVATAR_CDN` | Gravatar CDN URL (leave empty for default) | No |

#### App Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PRODUCT_URL` | Product URL | Yes |
| `PRODUCT_NAME` | Product name | Yes |
| `PRODUCT_DESCRIPTION` | Product description | No |
| `API_URL` | API endpoint URL | Yes |
| `SENTRY_DSN` | Sentry DSN | No |
| `PADDLE_VENDOR_ID` | Paddle vendor ID | No |
| `UMAMI_WEBSITE_ID` | Umami Website ID | No |
| `UMAMI_URL` | Umami Instance URL | No |

### Production Deployment with Reverse Proxy

For production, it is highly recommended to use the provided `nginx.example.conf` (renamed to `nginx.conf`) or your own reverse proxy to:
- Handle SSL/TLS certificates
- Route requests to appropriate services
- Serve both app and API from the same domain

Structure:
## Security Best Practices

1. **Change Default Passwords**: Update database password in `docker-compose.yml`
2. **Use Strong JWT Secret**: Generate a secure random string for `JWT_SECRET`
3. **Enable HTTPS**: Use a reverse proxy with SSL/TLS certificates
4. **Restrict Ports**: Only expose necessary ports to the public
5. **Regular Updates**: Keep Docker images and dependencies updated
6. **Environment Variables**: Never commit `.env` files to version control
7. **Database Backups**: Set up automated database backups

## Development Scripts

```bash
yarn api          # Start API server
yarn dev          # Start all services with PM2
yarn db:migrate   # Run database migrations
yarn start        # Start App development server
```

## Support

1. **Change Default Passwords**: Update database password in `docker-compose.yml`
2. **Use Strong JWT Secret**: Generate a secure random string for `JWT_SECRET`
3. **Enable HTTPS**: Use a reverse proxy with SSL/TLS certificates
4. **Restrict Ports**: Only expose necessary ports to the public
5. **Regular Updates**: Keep Docker images and dependencies updated
6. **Environment Variables**: Never commit `.env` files to version control

## Development Scripts

```bash
yarn api          # Start API server
yarn dev          # Start all services with PM2
yarn db:migrate   # Run database migrations
yarn start        # Start App development server
```

## Support

If you find this project helpful, consider supporting the development:

<a href="https://buymeacoffee.com/debugging" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" >
</a>
