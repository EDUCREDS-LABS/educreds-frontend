# Multi-stage build for React frontend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application (frontend + server)
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install security updates, runtime dependencies and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init curl python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for vite and build tools)
RUN npm install --legacy-peer-deps && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
# The server looks for vite output in dist/public, so we need to create that structure
RUN mkdir -p ./dist/public && \
    mv ./dist/index.html ./dist/assets ./dist/public/ 2>/dev/null || true && \
    [ -f ./dist/index.js ] || true && \
    chmod -R 775 ./node_modules

# Don't switch to nodejs user for development mode (vite needs write permissions)
# USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]