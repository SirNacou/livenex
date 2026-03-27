# Unified Livenex Application
# Multi-stage build for optimal image size
# Supports both development and production modes

FROM oven/bun:latest AS builder

WORKDIR /app

# Copy package files and source
COPY package.json bun.lockb* ./
COPY src ./src
COPY tsconfig.json vite.config.ts index.html ./
COPY drizzle.config.ts ./

# Install dependencies
RUN bun install --frozen-lockfile

# Build the application
RUN bun run build

# Runtime stage
FROM oven/bun:latest

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/drizzle.config.ts ./

# Expose port (will be mapped by docker-compose or ingress)
EXPOSE 3000

# Default to production mode
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["bun", "dist/server/index.js"]
