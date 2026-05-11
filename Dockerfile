FROM node:20-slim

RUN npm install -g pnpm@9

WORKDIR /app

COPY package.json pnpm-workspace.yaml .npmrc tsconfig.json tsconfig.base.json ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/db/package.json ./lib/db/
COPY lib/api-zod/package.json ./lib/api-zod/

RUN pnpm install --frozen-lockfile || pnpm install

COPY . .

RUN pnpm --filter @workspace/api-server run build

ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
