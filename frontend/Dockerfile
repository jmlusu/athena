# Frontend Dockerfile - Multi-stage build
FROM node:22-alpine AS builder

WORKDIR /app

# Enable Corepack and use pnpm
RUN corepack enable

# Copy workspace manifest files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Copy frontend package manifest
COPY frontend/package.json ./frontend/

# Install dependencies with pnpm (frozen lockfile)
RUN pnpm install --frozen-lockfile --filter athena-frontend

# Copy source code
COPY frontend/ ./frontend/

# Bake Athena API key into the client bundle (override at build time for prod)
ARG VITE_ATHENA_API_KEY=dev-admin-key
ENV VITE_ATHENA_API_KEY=$VITE_ATHENA_API_KEY

# Build the application
RUN pnpm --filter athena-frontend run build

# Production stage - nginx
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Env-aware security headers (drops X-Frame-Options: DENY in AI Studio preview)
COPY frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]