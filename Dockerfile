# Vyoma OTT Platform - Production Multi-Stage Dockerfile for AWS App Runner / ECS
FROM node:20-alpine AS base

# Install dependencies required by Prisma and native modules on Alpine
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Step 1: Dependencies installation
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci

# Step 2: Build the Next.js standalone application
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV BUILD_STANDALONE=true

RUN npm run build

# Step 3: Minimal production runner container
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create unprivileged system user for container security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy RDS SSL certificate bundle
COPY global-bundle.pem ./global-bundle.pem

# Copy public static assets and standalone server build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
