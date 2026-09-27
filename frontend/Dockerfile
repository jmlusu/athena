# Frontend Dockerfile - Simple build using pre-built dist
FROM nginx:alpine

# Copy built assets (built on host)
COPY dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Env-aware security headers (drops X-Frame-Options: DENY in AI Studio preview)
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]