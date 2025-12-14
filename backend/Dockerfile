# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install security updates and required packages
RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    ca-certificates

# Set working directory
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies with cache optimization
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS dev

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies including dev dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create uploads directory
RUN mkdir -p uploads && chmod 755 uploads

# Expose port
EXPOSE 8000

# Start development server
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies for building
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage - optimized for security and performance
FROM base AS production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --gid 1001 nodejs

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Create necessary directories with proper permissions
RUN mkdir -p uploads prisma && \
    chown -R nodejs:nodejs uploads prisma && \
    chmod 755 uploads prisma

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start production server
CMD ["node", "dist/index.js"]