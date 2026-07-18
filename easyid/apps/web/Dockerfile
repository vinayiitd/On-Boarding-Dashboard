# syntax=docker/dockerfile:1.7
# =============================================================================
# apps/web · production image
# Multi-stage build. Produces a Next.js `standalone` output — the final
# image ships only the compiled server + minimal node runtime.
# =============================================================================

ARG NODE_VERSION=20-bookworm-slim

# ---- deps ------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable

WORKDIR /repo

# Copy just what's needed for install to maximise layer cache reuse.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/config/package.json ./packages/config/
COPY packages/domain/package.json ./packages/domain/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/

RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---- builder ---------------------------------------------------------------
FROM node:${NODE_VERSION} AS builder
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps ./apps
COPY --from=deps /repo/packages ./packages
COPY . .

RUN pnpm --filter @easyid/web build

# ---- runtime ---------------------------------------------------------------
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs --create-home --home-dir /home/nextjs nextjs

WORKDIR /app

# Next.js `standalone` output ships every runtime file needed.
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "http.get('http://127.0.0.1:'+process.env.PORT+'/',(r)=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "apps/web/server.js"]
