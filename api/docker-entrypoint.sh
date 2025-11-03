#!/bin/sh
set -e

echo "Waiting for database to be ready..."
until pg_isready -d "$DATABASE_URL" -q; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo "Database is ready"

echo "Running database migrations..."
yarn db:migrate

echo "Clearing Redis queue cache..."
redis-cli -u "$CACHE_URL" --scan --pattern "queue:*" | xargs -r redis-cli -u "$CACHE_URL" DEL
redis-cli -u "$CACHE_URL" --scan --pattern "queue-status:*" | xargs -r redis-cli -u "$CACHE_URL" DEL
echo "Queue cache cleared"

echo "Starting application..."
exec "$@"
