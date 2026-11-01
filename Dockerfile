# Debian rather than Alpine: libsql and sharp both load glibc binaries here, the
# same ones package-lock.json pins for linux-x64.
FROM node:24-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Dev dependencies stay in: the build needs sass and typescript.
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Runs without a database, see src/server/catalogue.ts. No env vars reach this
# stage, and this image is public, so keep it that way.
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Standalone output carries only the node_modules files the server traced, but
# leaves out the static assets, so they're copied in by hand.
FROM base AS runner
# HOSTNAME has to be set: Docker's default is the container id, and the server
# would bind to that instead of accepting traffic from outside the container.
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
# Tuned for the 512 MB instance: with Node's defaults, resizing several images at once
# got the container OOM-killed. Fewer malloc arenas stop glibc holding on to memory
# sharp has freed, two threads cap parallel resizes, and the V8 limit leaves sharp room.
ENV MALLOC_ARENA_MAX=2 UV_THREADPOOL_SIZE=2 NODE_OPTIONS=--max-old-space-size=160
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
