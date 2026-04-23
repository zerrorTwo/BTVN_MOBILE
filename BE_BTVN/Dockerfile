# syntax=docker/dockerfile:1.7

# ---------- Stage 1: build ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install all deps (including dev) for tsc
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy sources and compile
COPY src ./src
RUN npm run build

# Drop dev deps — only prod deps end up in the final image
RUN npm prune --omit=dev

# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# wget is handy for the healthcheck below
RUN apk add --no-cache wget

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- http://localhost:5000/ || exit 1

CMD ["node", "dist/server.js"]
