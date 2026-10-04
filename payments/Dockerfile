# =========================
# Build stage
# =========================
FROM node:24-alpine AS builder

WORKDIR /app

# Root workspace
COPY package.json package-lock.json ./

# Workspace package manifests
COPY reusable/package.json ./reusable/package.json
COPY payments/package.json ./payments/package.json


# Install dependencies
RUN npm ci

# Copy source
COPY reusable/ ./reusable/
COPY payments/ ./payments/

# Build reusable package first
RUN npm run build --workspace=@node-observability/reusable

# Build payments service
RUN npm run build --workspace=payments


# =========================
# Production stage
# =========================
FROM node:24-alpine

WORKDIR /app

# Workspace manifests
COPY package.json package-lock.json ./
COPY reusable/package.json ./reusable/package.json
COPY payments/package.json ./payments/package.json


# Production dependencies only
RUN npm ci --omit=dev

# Compiled reusable package
COPY --from=builder /app/reusable/dist ./reusable/dist

# Compiled payments service
COPY --from=builder /app/payments/dist ./payments/dist

WORKDIR /app/payments

USER node

EXPOSE 4000

CMD ["npm", "start"]