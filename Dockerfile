# ── Stage 1: Build Frontend ──
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Serve Backend & Frontend ──
FROM node:20-alpine

WORKDIR /app

# Copy package files for backend dependencies
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy the Express server file
COPY server.js .

# Copy the built React app from the builder stage
COPY --from=builder /app/dist ./dist

# Cloud Run uses PORT env var (default 8080)
ENV PORT=8080
EXPOSE 8080

# Start the Node.js Express server
CMD ["node", "server.js"]
