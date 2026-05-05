FROM oven/bun:1-debian

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Force fresh Prisma client generation (clear stale cache)
RUN rm -rf node_modules/.prisma node_modules/@prisma/client && \
    bunx prisma generate

EXPOSE 3000

CMD ["bun", "run", "start"]
