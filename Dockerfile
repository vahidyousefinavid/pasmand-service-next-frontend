FROM node:18-alpine AS base
WORKDIR /app

# BuildKit cache mounts. Without them every build re-downloaded the whole
# dependency tree and recompiled every route from scratch, which on this box is
# most of the wall clock. The npm cache survives a package.json change; the
# .next cache lets Next reuse unchanged pages.
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm npm install --legacy-peer-deps

COPY . ./
RUN --mount=type=cache,target=/app/.next/cache npm run build

CMD ["npm", "start"]
