#!/bin/sh
set -e

echo "Running database migrations..."
bun x drizzle-kit migrate

echo "Running seed..."
bun run db:seed

echo "Starting dev server..."
exec bun run dev --host 0.0.0.0
