FROM node:20-bookworm-slim AS base

WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN apt-get update \
  && apt-get install -y --no-install-recommends dumb-init openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@9.15.9 --activate

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/server/package.json apps/server/package.json
COPY packages/prisma/package.json packages/prisma/package.json
COPY packages/prisma/prisma packages/prisma/prisma
COPY packages/shared/package.json packages/shared/package.json

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

RUN pnpm install --frozen-lockfile

FROM deps AS builder

COPY . .

RUN pnpm --filter @king/prisma prisma:generate \
  && pnpm --filter @king/shared build \
  && pnpm --filter @king/prisma build \
  && pnpm --filter @king/server build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nestjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/packages/prisma/package.json ./packages/prisma/package.json
COPY --from=builder /app/packages/prisma/dist ./packages/prisma/dist
COPY --from=builder /app/packages/prisma/prisma ./packages/prisma/prisma
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

RUN mkdir -p /app/uploads \
  && chown -R nestjs:nodejs /app/uploads /app/apps/server /app/packages

USER nestjs

EXPOSE 4000

CMD ["dumb-init", "sh", "-c", "cd /app/packages/prisma && pnpm prisma migrate deploy && cd /app && node apps/server/dist/main.js"]
