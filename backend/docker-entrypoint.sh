#!/bin/sh
set -e

echo "Starting ProWidget Backend..."
echo "NODE_ENV: $NODE_ENV"
echo "DATABASE_URL exists: $(if [ -n "$DATABASE_URL" ]; then echo 'yes'; else echo 'NO - MISSING!'; fi)"

# Run Prisma migrations
echo "Running Prisma migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Migrations completed. Starting server..."

# Start the server
exec node server.js
