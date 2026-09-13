FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run check

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 UPLOAD_DIR=/app/uploads
RUN apk add --no-cache dumb-init su-exec && mkdir -p /app/uploads && chown -R node:node /app
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/server ./server
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["dumb-init","--","/usr/local/bin/docker-entrypoint.sh"]
CMD ["node","--import","tsx","server/index.ts"]
