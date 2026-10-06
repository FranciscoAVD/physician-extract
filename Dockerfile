FROM oven/bun:1-slim

# unzip: required by src/extract.ts to pull the data CSV out of the NPPES zip.
# ca-certificates is already present in the base image (needed for the https
# download from download.cms.gov).
RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

COPY . .

USER bun

ENTRYPOINT ["bun", "run", "index.ts"]
