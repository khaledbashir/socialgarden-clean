# Stage 1: Build the application
FROM node:18-alpine AS builder
WORKDIR /app
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --no-frozen-lockfile
COPY frontend/ .
RUN pnpm build

# Stage 2: Create the final production image
FROM node:18-alpine
WORKDIR /app

# Install pnpm in final image
RUN npm install -g pnpm

# Copy built artifacts from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001
CMD ["npm", "run", "start"]
