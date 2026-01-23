# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json yarn.lock ./

# Install dependencies
RUN apk add --no-cache python3 make g++
RUN yarn install --network-timeout 1000000

# Copy source code
COPY . .

# Set build-time environment variables with PLACEHOLDER values for runtime replacement
ENV REACT_APP_API_URL=__REACT_APP_API_URL__
ENV REACT_APP_PRODUCT_URL=__REACT_APP_PRODUCT_URL__
ENV REACT_APP_PRODUCT_NAME=__REACT_APP_PRODUCT_NAME__
ENV REACT_APP_PRODUCT_DESCRIPTION=__REACT_APP_PRODUCT_DESCRIPTION__
ENV REACT_APP_SENTRY_DSN=__REACT_APP_SENTRY_DSN__
ENV REACT_APP_PADDLE_VENDOR_ID=__REACT_APP_PADDLE_VENDOR_ID__
ENV REACT_APP_UMAMI_WEBSITE_ID=__REACT_APP_UMAMI_WEBSITE_ID__
ENV REACT_APP_UMAMI_URL=__REACT_APP_UMAMI_URL__
ENV REACT_APP_FREE_MODE=__REACT_APP_FREE_MODE__

# Build app
RUN yarn build

# Replace manifest.json values with placeholders for runtime replacement
RUN sed -i \
    -e 's/"short_name": "[^"]*"/"short_name": "__REACT_APP_PRODUCT_NAME__"/g' \
    -e 's/"name": "[^"]*"/"name": "__REACT_APP_PRODUCT_NAME__"/g' \
    -e 's/"description": "[^"]*"/"description": "__REACT_APP_PRODUCT_DESCRIPTION__"/g' \
    ./build/favicons/manifest.json

# Production stage
# Production stage
FROM nginx:alpine

# Build arguments for labels
ARG VERSION=latest
ARG BUILD_DATE
ARG VCS_REF

# OCI standard labels for GitHub Container Registry
LABEL org.opencontainers.image.title="Readdig App" \
    org.opencontainers.image.description="Readdig Web Application" \
    org.opencontainers.image.version="${VERSION}" \
    org.opencontainers.image.created="${BUILD_DATE}" \
    org.opencontainers.image.revision="${VCS_REF}" \
    org.opencontainers.image.source="https://github.com/readdig/readdig" \
    org.opencontainers.image.licenses="Apache-2.0"

# Copy build files to nginx html directory
COPY --from=builder /app/build /usr/share/nginx/html

# Copy entrypoint script for runtime env replacement
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Configure nginx for SPA (fallback to index.html)
RUN printf '%s\n' \
    'server {' \
    '    listen 80;' \
    '    listen [::]:80;' \
    '    root /usr/share/nginx/html;' \
    '    index index.html;' \
    '    location / {' \
    '        try_files $uri $uri/ /index.html;' \
    '    }' \
    '}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
