# Multi-stage build for React frontend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Build-time API configuration for Vite (must be present during npm run build)
ARG VITE_API_BASE=https://api-dev.educreds.xyz
ARG VITE_CERT_API_BASE=https://api-dev.educreds.xyz
ARG VITE_MARKETPLACE_API_BASE=https://api-dev.educreds.xyz
ARG VITE_CONTRACT_ADDRESS=0x2a9a849ae747e01c464edda29543f064bd544aba
ARG VITE_ETHEREUM_RPC_URL=https://sepolia.base.org
ARG VITE_NETWORK=testnet
ARG VITE_BLOCKCHAIN_CHAIN_ID=84532
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_CERT_API_BASE=$VITE_CERT_API_BASE
ENV VITE_MARKETPLACE_API_BASE=$VITE_MARKETPLACE_API_BASE
ENV VITE_CONTRACT_ADDRESS=$VITE_CONTRACT_ADDRESS
ENV VITE_ETHEREUM_RPC_URL=$VITE_ETHEREUM_RPC_URL
ENV VITE_NETWORK=$VITE_NETWORK
ENV VITE_BLOCKCHAIN_CHAIN_ID=$VITE_BLOCKCHAIN_CHAIN_ID

# Install build dependencies
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev

# Copy package files
COPY package*.json ./

# Install dependencies with npm ci for deterministic, faster builds
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Verify package.json exists and has build script
RUN test -f package.json && npm run 2>&1 | grep build || (echo "ERROR: package.json missing or build script not found" && cat package.json && exit 1)

# Build the application (frontend + server)
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install security updates, runtime dependencies and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init curl python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built dist and node_modules from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Switch to non-root user for production
USER nodejs

# Expose production port
EXPOSE 5002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5002 || exit 1

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
