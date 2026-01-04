# =============================================================================
# DOCKERFILE - KONSER YUK BACKEND
# =============================================================================
# Multi-stage build untuk optimalisasi ukuran image dan build time
# Stage 1: Dependencies installation
# Stage 2: Production runtime
# =============================================================================

# ---------------------------------------------------------------------------
# STAGE 1: Base image dengan dependencies
# ---------------------------------------------------------------------------
FROM node:18-alpine AS base

# Install dependencies yang diperlukan untuk bcrypt dan native modules
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files untuk dependency installation
COPY package*.json ./

# Install dependencies
# --production=false untuk menginstall devDependencies juga (nodemon)
RUN npm ci --production=false

# ---------------------------------------------------------------------------
# STAGE 2: Production image
# ---------------------------------------------------------------------------
FROM node:18-alpine AS production

# Install dumb-init untuk proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy node_modules dari stage sebelumnya
COPY --from=base /app/node_modules ./node_modules

# Copy application code
COPY . .

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Health check untuk memastikan aplikasi berjalan
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init untuk proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start application
# Default command untuk backend server (bisa di-override untuk worker)
CMD ["node", "server.js"]
