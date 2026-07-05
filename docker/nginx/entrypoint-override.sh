#!/bin/sh
# RCA/docker/nginx/entrypoint-override.sh
set -e

# Create required directories with correct ownership (runs as root here)
mkdir -p /var/cache/nginx/client_temp /var/log/nginx /var/run/nginx
chown -R nginxuser:nginxgroup /var/cache/nginx /var/log/nginx /var/run/nginx

# Drop privileges and start nginx directly (no official entrypoint overhead)
exec su-exec nginxuser nginx -g "daemon off;"
# end of RCA/docker/nginx/entrypoint-override.sh