# Ask Canada — production container (Next.js standalone output).
# Build:  docker build -t ask-canada --build-arg COUNTRY=ca .
# Run:    docker run -p 3000:3000 -e ANTHROPIC_API_KEY=… ask-canada
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
ARG COUNTRY=ca
ENV COUNTRY=$COUNTRY NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/src/app/_og ./src/app/_og
USER app
EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://127.0.0.1:3000/robots.txt >/dev/null || exit 1
CMD ["node", "server.js"]
