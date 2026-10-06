# physician-extract

Downloads CMS's monthly [NPPES NPI Registry](https://download.cms.gov/nppes/NPI_Files.html) full-replacement file, filters it down to physicians, and upserts the matches into a Postgres database via Drizzle ORM.

Filtering rules:
- Only `Entity Type Code = 1` (individual providers) — organizations/institutions are always excluded, regardless of taxonomy code.
- Only rows with a taxonomy code listed in [`config/taxonomy-codes.ts`](config/taxonomy-codes.ts) (pre-populated with NUCC's "Allopathic & Osteopathic Physicians" grouping).
- Optionally restricted to a set of practice-location states in [`config/states.ts`](config/states.ts) (empty = all states).
- Deactivated physicians are kept, not dropped — see `is_active` below.

## Setup

Install dependencies:

```bash
bun install
```

Copy `.env.example` to `.env` and point `DATABASE_URL` at a Postgres database:

```bash
cp .env.example .env
```

Push the schema (defined in `src/schema.ts`) to that database:

```bash
bun run db:push
```

## Run

```bash
bun run start
```

This resolves the current month's file URL, downloads the ZIP, extracts the main data CSV, streams it into the `physicians` table (upserting by NPI so re-running a later month's file updates existing rows instead of duplicating them), then deletes the downloaded ZIP and extracted CSV.

To test against a local CSV instead of downloading the full file:

```bash
bun run start -- --file path/to/sample.csv
```

## Running in Docker

Build the image:

```bash
docker build -t physician-extract .
```

Run it, pointing `DATABASE_URL` at a reachable Postgres instance (e.g. on the same Docker network, or via `host.docker.internal`):

```bash
docker run --rm -e DATABASE_URL=postgres://user:password@host:5432/dbname physician-extract
```

The schema still needs to be pushed once from the host (`bun run db:push`) before the container's first run, since the image only installs production dependencies (`drizzle-kit` is a dev-only tool).

To test against a local CSV instead of the full download, mount it in and pass `--file`:

```bash
docker run --rm \
  -e DATABASE_URL=postgres://user:password@host:5432/dbname \
  -v $(pwd)/sample.csv:/sample.csv:ro \
  physician-extract --file /sample.csv
```

## Configuration

- `config/taxonomy-codes.ts` — which NUCC taxonomy codes count as "physician". Edit to narrow/widen the specialty list.
- `config/states.ts` — which practice-location states to keep. Leave `allowedStates` empty to keep every state.

## Schema

The `physicians` table (`src/schema.ts`) stores name, credential, primary taxonomy code and name (`primary_taxonomy_name` is `null` if the code isn't in `config/taxonomy-codes.ts`'s map), mailing and practice addresses, phone, enumeration/update dates, and an `is_active` flag derived from NPPES's deactivation fields (plus the raw `deactivation_reason_code`, `deactivation_date`, `reactivation_date` for history).

---

This project was created using `bun init` in bun v1.3.14. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
