# Dockerfile for Next.js mailbox-forwarding project (uses Yarn & Node 25)

# 1) Builder stage
FROM node:25-alpine AS builder

# Set working directory
WORKDIR /app

# Only copy package manifests and install dependencies (cached layer)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the Next.js app
RUN yarn build

# Install only production dependencies (omit dev deps)
RUN yarn install --production --frozen-lockfile


# 2) Runner stage
FROM node:25-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy production build and dependencies
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/node_modules ./node_modules

# Expose the default Next.js port
EXPOSE 3000

# Start the Next.js server
CMD ["yarn", "start"]
