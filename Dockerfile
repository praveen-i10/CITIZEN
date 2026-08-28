# =========================================================================
# Dockerfile — citizen-civic-issue-platform, for deployment on Render
#
# Matches the real repo structure:
#   - single package.json at repo root (no workspaces)
#   - server.ts at repo root, imports ./src/server/routes.js
#   - "npm run build" -> vite build (frontend) + esbuild bundle of server.ts
#     -> both land in ./dist  (dist/index.html + assets, dist/server.cjs)
#   - "npm start" -> node dist/server.cjs
#   - server hardcodes PORT=3000 and binds 0.0.0.0 (server.ts) — matches
#     EXPOSE 3000 below; NODE_ENV=production is REQUIRED or the server
#     will try to boot a Vite dev server instead of serving dist/
# =========================================================================

FROM node:22-slim AS base
# better-sqlite3 compiles native bindings — needs build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---- Install deps (leverages Docker layer caching) -------------------------
COPY package.json package-lock.json ./
RUN npm ci

# ---- Copy source and build (vite build + esbuild server bundle) -----------
COPY . .
RUN npm run build

# ---- Drop devDependencies from the final image ------------------------------
RUN npm prune --omit=dev

# ---- Runtime ------------------------------------------------------------------
ENV NODE_ENV=production
ENV PORT=3000

# SQLite file location — attach a Render persistent Disk here if you need
# data to survive redeploys (Render's default disk is ephemeral)
RUN mkdir -p /app/data

EXPOSE 3000
CMD ["node", "dist/server.cjs"]
