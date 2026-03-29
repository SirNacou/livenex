# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install Bun
RUN npm install -g bun

# Copy dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build app
RUN bun run build

# Runtime stage
FROM node:18-alpine
WORKDIR /app

# Install Bun in runtime
RUN npm install -g bun

# Copy built app from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/.env.local ./.env.local

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun run health-check || exit 1

# Expose port
EXPOSE 3000

# Start app
CMD ["bun", "run", "start"]
