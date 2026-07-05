# RCA/docker/nginx/Dockerfile
FROM nginx:1.25-alpine

# Remove default config files
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom configs
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

# Create non‑root group and user
RUN addgroup -g 1000 nginxgroup && adduser -u 1000 -S nginxuser -G nginxgroup

# Create writable cache directory and set correct ownership
RUN mkdir -p /var/cache/nginx/client_body \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp \
    /var/cache/nginx/logs \
    && chown -R nginxuser:nginxgroup /var/cache/nginx

# Switch to non‑root user for the container runtime
USER nginxuser

# Default command (runs under nginxuser)
CMD ["nginx", "-g", "daemon off;"]
# end of RCA/docker/nginx/Dockerfile