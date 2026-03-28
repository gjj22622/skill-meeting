FROM node:22-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN NODE_ENV=development npm ci
COPY . .
RUN mkdir -p public
ENV NODE_ENV=production
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
