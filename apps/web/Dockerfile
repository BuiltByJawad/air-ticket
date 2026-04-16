# --- Build stage ---
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY packages/ packages/

RUN pnpm install --frozen-lockfile

COPY apps/web/ apps/web/

# Build-time env vars (override at build time with --build-arg)
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter @air-ticket/web build

# --- Production stage ---
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY packages/ packages/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/web/.next apps/web/.next
COPY --from=builder /app/apps/web/public apps/web/public 2>/dev/null || true
COPY --from=builder /app/apps/web/next.config.mjs apps/web/next.config.mjs
COPY --from=builder /app/apps/web/package.json apps/web/package.json

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "apps/web/node_modules/.bin/next", "start"]
