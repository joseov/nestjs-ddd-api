# ==============================================================================
# Base stage: Common setup for all stages
# ==============================================================================
FROM node:22.22.0-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# ==============================================================================
# Dependencies stage: Install all dependencies
# ==============================================================================
FROM base AS dependencies

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# ==============================================================================
# Build stage: Build the application
# ==============================================================================
FROM base AS build

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# ==============================================================================
# Production dependencies stage: Install only production dependencies
# ==============================================================================
FROM base AS production-dependencies

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

# ==============================================================================
# Production stage: Final optimized image
# ==============================================================================
FROM node:22.22.0-alpine AS production

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=production-dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --chown=nestjs:nodejs package.json ./

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main.js"]

# ==============================================================================
# Development stage: For local development with hot-reload and debugging
# ==============================================================================
FROM base AS development

ENV NODE_ENV=development

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

EXPOSE 3000 9229

CMD ["pnpm", "start:debug"]
