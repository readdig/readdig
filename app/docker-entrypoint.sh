#!/bin/sh
set -e

# Runtime environment variable replacement for React app
# This replaces placeholder values in the built JS and HTML files with actual environment variables
# External env vars (without REACT_APP_ prefix) are mapped to internal REACT_APP_ vars

# Replace placeholders in JS files
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i \
  -e "s|__REACT_APP_API_URL__|${API_URL:-/api}|g" \
  -e "s|__REACT_APP_PRODUCT_URL__|${PRODUCT_URL:-}|g" \
  -e "s|__REACT_APP_PRODUCT_NAME__|${PRODUCT_NAME:-Readdig}|g" \
  -e "s|__REACT_APP_PRODUCT_DESCRIPTION__|${PRODUCT_DESCRIPTION:-Readdig - RSS and Podcast Reader}|g" \
  -e "s|__REACT_APP_SENTRY_DSN__|${SENTRY_DSN:-}|g" \
  -e "s|__REACT_APP_PADDLE_VENDOR_ID__|${PADDLE_VENDOR_ID:-}|g" \
  -e "s|__REACT_APP_UMAMI_WEBSITE_ID__|${UMAMI_WEBSITE_ID:-}|g" \
  -e "s|__REACT_APP_UMAMI_URL__|${UMAMI_URL:-}|g" \
  {} \;

# Replace placeholders in HTML files (for index.html meta tags, title, and inline scripts)
find /usr/share/nginx/html -type f -name "*.html" -exec sed -i \
  -e "s|__REACT_APP_API_URL__|${API_URL:-/api}|g" \
  -e "s|__REACT_APP_PRODUCT_URL__|${PRODUCT_URL:-}|g" \
  -e "s|__REACT_APP_PRODUCT_NAME__|${PRODUCT_NAME:-Readdig}|g" \
  -e "s|__REACT_APP_PRODUCT_DESCRIPTION__|${PRODUCT_DESCRIPTION:-Readdig - RSS and Podcast Reader}|g" \
  -e "s|__REACT_APP_SENTRY_DSN__|${SENTRY_DSN:-}|g" \
  -e "s|__REACT_APP_PADDLE_VENDOR_ID__|${PADDLE_VENDOR_ID:-}|g" \
  -e "s|__REACT_APP_UMAMI_WEBSITE_ID__|${UMAMI_WEBSITE_ID:-}|g" \
  -e "s|__REACT_APP_UMAMI_URL__|${UMAMI_URL:-}|g" \
  {} \;

# Replace placeholders in JSON files (for manifest.json PWA config)
find /usr/share/nginx/html -type f -name "*.json" -exec sed -i \
  -e "s|__REACT_APP_PRODUCT_NAME__|${PRODUCT_NAME:-Readdig}|g" \
  -e "s|__REACT_APP_PRODUCT_DESCRIPTION__|${PRODUCT_DESCRIPTION:-Readdig - RSS and Podcast Reader}|g" \
  {} \;

echo "Environment variables replaced successfully"

# Start nginx
exec nginx -g "daemon off;"
