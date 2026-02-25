# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# OrbitFlow CRM - Production Dockerfile
# Multi-stage build optimized for Next.js 16 + Prisma v7
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ──────────────────────────────────────────────────────────
# Stage 1: Dependencies
# Install all dependencies and generate Prisma client
# ──────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

# Install system dependencies required for Prisma
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy Prisma schema and configuration
COPY prisma ./prisma
COPY prisma.config.ts ./

# Generate Prisma Client (CRITICAL: must happen before Next.js build)
RUN npx prisma generate

# ──────────────────────────────────────────────────────────
# Stage 2: Builder
# Build Next.js application with standalone output
# ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application (creates .next/standalone)
RUN npm run build

# ──────────────────────────────────────────────────────────
# Stage 3: Runner
# Minimal production image with only runtime files
# ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets (PWA files, icons)
COPY --from=builder /app/public ./public

# Copy standalone Next.js server and static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma generated client
COPY --from=builder /app/src/generated ./src/generated

# Switch to non-root user
USER nextjs

# Expose port 3000
EXPOSE 3000

# Set port and hostname
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
