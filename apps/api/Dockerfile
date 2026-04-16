# --- Build stage ---
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# Copy workspace config
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/ packages/

# Install all deps (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY apps/api/ apps/api/
RUN pnpm --filter @air-ticket/api prisma:generate
RUN pnpm --filter @air-ticket/api build

# --- Production stage ---
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/ packages/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy built output and Prisma client
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/prisma apps/api/prisma
COPY --from=builder /app/node_modules/.pnpm/@prisma+client*/node_modules/.prisma node_modules/.prisma

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
