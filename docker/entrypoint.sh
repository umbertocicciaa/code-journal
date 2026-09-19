#!/bin/sh
set -e

echo "Running database migrations..."
npx tsx src/server/db/migrate.ts

echo "Starting Code Journal..."
if [ -f server.js ]; then
  exec node server.js
fi
exec node .next/standalone/server.js
