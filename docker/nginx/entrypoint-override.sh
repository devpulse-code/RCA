#!/bin/sh
# RCA/docker/nginx/entrypoint-override.sh
set -e

# Ensure the directories that will be mounted as tmpfs exist
# and are owned by nginxuser after tmpfs is mounted (default tmpfs perms 1777)
mkdir -p /var/cache/nginx/client_temp /var/log/nginx
chown -R nginxuser:nginxgroup /var/cache/nginx /var/log/nginx

# Switch to the non‑root user and run the original Nginx entrypoint
exec su-exec nginxuser /docker-entrypoint.sh "$@"
# end of RCA/docker/nginx/entrypoint-override.sh