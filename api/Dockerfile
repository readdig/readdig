# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json yarn.lock ./

# Install dependencies
RUN apk add --no-cache python3 make g++
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build
RUN rm -rf ./dist && mkdir ./dist && yarn build

# Copy email templates to dist
COPY ./src/utils/email/templates ./dist/utils/email/templates

# Production stage
FROM node:20-alpine

# Build arguments for labels
ARG VERSION=latest
ARG BUILD_DATE
ARG VCS_REF

# OCI standard labels for GitHub Container Registry
LABEL org.opencontainers.image.title="Readdig API" \
    org.opencontainers.image.description="Readdig API Server" \
    org.opencontainers.image.version="${VERSION}" \
    org.opencontainers.image.created="${BUILD_DATE}" \
    org.opencontainers.image.revision="${VCS_REF}" \
    org.opencontainers.image.source="https://github.com/readdig/readdig" \
    org.opencontainers.image.licenses="Apache-2.0"

# Install PM2 and tools
RUN yarn global add pm2 && apk add --no-cache redis postgresql-client

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/ecosystem.prod.config.js ./
COPY --from=builder /app/src/db/migrations ./db/migrations
COPY --from=builder /app/drizzle.config.js ./

# Update migration path in drizzle.config.js for production structure
RUN sed -i 's|./src/db/migrations|./db/migrations|g' drizzle.config.js

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["pm2-runtime", "start", "ecosystem.prod.config.js"]
