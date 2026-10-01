# Frontend Dockerfile - Simple build using pre-built dist
FROM nginx:alpine

# Copy built assets (built on host; paths are relative to the build context,
# which is the repo root - see docker-compose.yml and DEPLOYMENT_SPLIT.md)
COPY frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Env-aware security headers (drops X-Frame-Options: DENY in AI Studio preview)
COPY frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]