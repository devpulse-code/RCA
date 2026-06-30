# RCA/docker/nginx/Dockerfile
FROM nginx:1.25-alpine

# Install su-exec for switching from root to non‑root user in entrypoint
RUN apk add --no-cache su-exec

# Remove default config files
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom configs
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

# Create non‑root group and user
RUN addgroup -g 1000 nginxgroup && adduser -u 1000 -S nginxuser -G nginxgroup

# Copy our custom entrypoint script (must be executable)
COPY entrypoint-override.sh /usr/local/bin/entrypoint-override.sh
RUN chmod +x /usr/local/bin/entrypoint-override.sh

# Override the default entrypoint – our script will run as root initially
ENTRYPOINT ["/usr/local/bin/entrypoint-override.sh"]

# Default command (what nginx should run after entrypoint)
CMD ["nginx", "-g", "daemon off;"]
# end of RCA/docker/nginx/Dockerfile