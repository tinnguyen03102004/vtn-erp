# ================================================
# VTN ERP — Multi-stage Dockerfile
# ================================================

# ── Stage 1: Base ──
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ── Stage 2: Dependencies ──
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY prisma/ ./prisma/
RUN npm ci
RUN npx prisma generate

# ── Stage 3: Development ──
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]

# ── Stage 4: Builder ──
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ── Stage 5: Production ──
FROM base AS production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

CMD ["node", "server.js"]
