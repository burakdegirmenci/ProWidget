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

# Extract host and port from DATABASE_URL
# DATABASE_URL format: postgresql://user:pass@host:port/db?schema=public
DB_HOST=$(echo $DATABASE_URL | sed -e 's/.*@//' -e 's/:.*//')
DB_PORT=$(echo $DATABASE_URL | sed -e 's/.*@[^:]*://' -e 's/\/.*//')

echo "Waiting for database at $DB_HOST:$DB_PORT..."

# Wait for database to be ready (max 60 seconds)
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
        echo "Database is accepting connections!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for database... attempt $RETRY_COUNT/$MAX_RETRIES"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "ERROR: Database is not available after $MAX_RETRIES attempts"
    exit 1
fi

# Additional wait for PostgreSQL to be fully ready
echo "Waiting for PostgreSQL to be fully ready..."
sleep 5

# Run Prisma migrations with retry
echo "Running Prisma migrations..."
MAX_MIGRATION_RETRIES=5
MIGRATION_RETRY=0
while [ $MIGRATION_RETRY -lt $MAX_MIGRATION_RETRIES ]; do
    if ./node_modules/.bin/prisma migrate deploy; then
        echo "Migrations completed successfully!"
        break
    fi
    MIGRATION_RETRY=$((MIGRATION_RETRY + 1))
    echo "Migration failed, retrying... attempt $MIGRATION_RETRY/$MAX_MIGRATION_RETRIES"
    sleep 5
done

if [ $MIGRATION_RETRY -eq $MAX_MIGRATION_RETRIES ]; then
    echo "ERROR: Migrations failed after $MAX_MIGRATION_RETRIES attempts"
    exit 1
fi

echo "Starting server..."

# Start the server
exec node server.js
