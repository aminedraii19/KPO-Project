#!/bin/sh
set -eu

npm run db:migrate
if [ "${SEED_DEMO_DATA:-true}" = "true" ]; then
  npm run db:seed
fi

exec "$@"
