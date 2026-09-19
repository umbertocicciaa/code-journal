# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Placeholders for Next.js build; runtime values come from Compose env.
ENV BETTER_AUTH_SECRET=build-time-placeholder-secret-at-least-32-chars
ENV BETTER_AUTH_URL=http://localhost:3000
ENV APP_ENCRYPTION_KEY=MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/code_journal
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build
RUN ./node_modules/.bin/esbuild src/server/db/migrate.ts \
    --bundle \
    --platform=node \
    --format=cjs \
    --outfile=migrate.cjs

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/migrate.cjs ./migrate.cjs
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh && chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["/entrypoint.sh"]
