FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
COPY . .
RUN npm run check && npm run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json package-lock.json drizzle.config.ts ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json tsconfig.server.json ./
COPY api ./api
COPY contracts ./contracts
COPY db ./db
COPY scripts ./scripts
EXPOSE 3000
USER node
ENTRYPOINT ["sh", "./scripts/docker-entrypoint.sh"]
CMD ["node", "dist/boot.js"]
