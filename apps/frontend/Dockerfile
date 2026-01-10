FROM node:lts

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json & lockfile
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["pnpm", "run", "dev"]
