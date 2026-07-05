#!/bin/sh
# RCA/docker/backend/entrypoint.sh
set -e

# Ensure Python can find the 'backend' package
export PYTHONPATH=/app

echo ">>> Running Alembic migrations..."
# No need to cd, WORKDIR is already /app/backend
alembic upgrade head

echo ">>> Migrations complete, starting application..."
exec "$@"
# end of RCA/docker/backend/entrypoint.sh