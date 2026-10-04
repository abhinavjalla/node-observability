# =========================
# Build stage
# =========================
FROM node:24-alpine AS builder

WORKDIR /app

# Root workspace
COPY package.json package-lock.json ./

# Workspace package manifests
COPY reusable/package.json ./reusable/package.json
COPY orders/package.json ./orders/package.json


# Install dependencies
RUN npm ci

# Copy source
COPY reusable/ ./reusable/
COPY orders/ ./orders/

# Build reusable package first
RUN npm run build --workspace=@node-observability/reusable

# Build orders service
RUN npm run build --workspace=orders


# =========================
# Production stage
# =========================
FROM node:24-alpine

WORKDIR /app

# Workspace manifests
COPY package.json package-lock.json ./
COPY reusable/package.json ./reusable/package.json
COPY orders/package.json ./orders/package.json


# Production dependencies only
RUN npm ci --omit=dev

# Compiled reusable package
COPY --from=builder /app/reusable/dist ./reusable/dist

# Compiled orders service
COPY --from=builder /app/orders/dist ./orders/dist

WORKDIR /app/orders

USER node

EXPOSE 5000

CMD ["npm", "start"]