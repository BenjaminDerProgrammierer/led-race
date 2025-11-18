# Multi-stage Dockerfile for Next.js LED Race App

# Stage 1: Dependencies
FROM node:lts-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:lts-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js app with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner
FROM node:lts-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start Next.js with turbopack in production
CMD ["node", "server.js"]
