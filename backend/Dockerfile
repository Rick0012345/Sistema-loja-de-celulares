FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./

FROM base AS deps
RUN npm ci

FROM deps AS dev
ENV NODE_ENV=development
COPY . .
EXPOSE 3001
CMD ["sh", "-c", "npm run prisma:generate && npm run db:migrate && npm run start:dev"]

FROM deps AS build
COPY . .
RUN npm run build

FROM base AS prod-deps
ENV NODE_ENV=production
RUN npm ci --omit=dev

FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./
EXPOSE 3001
CMD ["sh", "-c", "npm run db:migrate && node dist/main.js"]
