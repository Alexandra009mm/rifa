# Multi-stage production-ready Dockerfile for Raffle Application

# ===================================================
# Stage 1: Build & Dependencies
# ===================================================
FROM node:20-alpine AS dependencies

WORKDIR /usr/src/app

# Install dependencies needed for production
COPY package*.json ./
RUN npm ci --omit=dev

# ===================================================
# Stage 2: Production Runtime
# ===================================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root system group and user for security hardening
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production node_modules from dependencies stage
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY package*.json ./

# Copy application source code and public assets
COPY src/ ./src/
COPY public/ ./public/
COPY img/ ./img/

# Set ownership to non-root user
RUN chown -R appuser:appgroup /usr/src/app

# Switch to non-root user
USER appuser

# Expose server port
EXPOSE 3000

# Health check to ensure service readiness
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

# Launch production server
CMD ["node", "src/server.js"]
