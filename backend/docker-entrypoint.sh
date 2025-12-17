#!/bin/sh
set -e

echo "Starting ProWidget Backend..."
echo "NODE_ENV: $NODE_ENV"

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is not set!"
    exit 1
fi
echo "DATABASE_URL is set"

# Run Prisma migrations
echo "Running Prisma migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Migrations completed. Starting server..."

# Start the server
exec node server.js
