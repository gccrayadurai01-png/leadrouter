# Multi-stage build for LeadRouter

# Stage 1: Build React app
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build server
FROM node:18-alpine AS server-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY server/ ./server/

# Stage 3: Production image
FROM node:18-alpine
WORKDIR /app

# Install PostgreSQL client for migrations
RUN apk add --no-cache postgresql-client

# Copy server files
COPY --from=server-builder /app/node_modules ./node_modules
COPY --from=server-builder /app/server ./server
COPY --from=server-builder /app/package.json ./

# Copy built client
COPY --from=client-builder /app/client/build ./client/build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server/index.js"]


