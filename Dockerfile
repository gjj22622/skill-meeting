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
ENV DATABASE_PATH=/app/data/skill-meeting.db
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /app/node_modules/bindings ./node_modules/bindings
COPY --from=builder /app/node_modules/prebuild-install ./node_modules/prebuild-install
COPY --from=builder /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["node", "server.js"]
