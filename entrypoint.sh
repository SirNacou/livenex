#!/bin/sh
set -e

echo "Running database migrations..."
bun x drizzle-kit migrate

echo "Running seed..."
bun run db:seed

echo "Starting application..."
exec bun run .output/server/index.mjs
