#!/bin/sh
set -e

echo "Waiting for database to be ready..."
until node -e "
const postgres = require('postgres');
const client = postgres(process.env.DATABASE_URL);
client\`SELECT 1\`.then(() => {
  console.log('Database is ready');
  process.exit(0);
}).catch(() => {
  process.exit(1);
});
" 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Running database migrations..."
yarn db:migrate

echo "Starting application..."
exec "$@"
