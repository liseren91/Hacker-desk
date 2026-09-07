# syntax=docker/dockerfile:1
FROM node:22-slim

# Prisma's query engine links against OpenSSL at runtime.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies first so the layer caches. prisma/ has to be present because
# the postinstall hook runs `prisma generate`.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
# Listen on every interface so Railway's proxy can reach the container.
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

# `npm start` = prisma migrate deploy (against the volume) && next start.
CMD ["npm", "run", "start"]
