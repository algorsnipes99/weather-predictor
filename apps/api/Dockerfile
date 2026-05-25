FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm ci && npm install -g tsx

COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/src ./apps/api/src

EXPOSE 4000

CMD ["tsx", "apps/api/src/index.ts"]
