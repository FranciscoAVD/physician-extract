# physician-extract

Takes CMS's monthly [NPPES NPI Registry](https://download.cms.gov/nppes/NPI_Files.html) full-replacement file (downloaded manually — see below), filters it down to physicians, and upserts the matches into a Postgres database via Drizzle ORM.

Filtering rules:
- Only `Entity Type Code = 1` (individual providers) — organizations/institutions are always excluded, regardless of taxonomy code.
- Only rows with a taxonomy code listed in [`config/taxonomy-codes.ts`](config/taxonomy-codes.ts) (pre-populated with NUCC's "Allopathic & Osteopathic Physicians" grouping). Of a provider's matching codes, the one NPPES flags as primary (`Healthcare Provider Primary Taxonomy Switch_N = Y`) is recorded; if no match is flagged primary, the first matching code is used.
- Optionally restricted to a set of practice-location states in [`config/states.ts`](config/states.ts) (empty = all states).
- Deactivated physicians are kept, not dropped — see `is_active` below.

## Setup

Install dependencies:

```bash
bun install
```

Copy `.env.example` to `.env`, point `DATABASE_URL` at a Postgres database, and set `INPUT_DIR` to the folder where you'll drop the monthly download:

```bash
cp .env.example .env
```

Push the schema (defined in `src/schema.ts`) to that database:

```bash
bun run db:push
```

## Run

Each month, download the current full-replacement ZIP from the [NPI_Files.html](https://download.cms.gov/nppes/NPI_Files.html) page yourself into `INPUT_DIR` (and make sure that folder has nothing else matching `*.zip`/`*.csv` in it), then run:

```bash
bun run parse
```

This finds the single `.zip` in `INPUT_DIR`, extracts the main data CSV from it, streams it into the `physicians` table (upserting by NPI so re-running a later month's file updates existing rows instead of duplicating them), then deletes the extracted CSV (the ZIP you downloaded is left alone).

If `INPUT_DIR` has no `.zip` but has a single `.csv` instead, that's used directly (handy for a local sample file when testing).

## Running in Docker

Build the image:

```bash
docker build -t physician-extract .
```

Run it, pointing `DATABASE_URL` at a reachable Postgres instance (e.g. on the same Docker network, or via `host.docker.internal`), mounting in the folder containing the monthly ZIP (or a local CSV for testing) and pointing `INPUT_DIR` at it:

```bash
docker run --rm \
  -e DATABASE_URL=postgres://user:password@host:5432/dbname \
  -e INPUT_DIR=/downloads \
  -v $(pwd)/downloads:/downloads:ro \
  physician-extract
```

The schema still needs to be pushed once from the host (`bun run db:push`) before the container's first run, since the image only installs production dependencies (`drizzle-kit` is a dev-only tool).

## Configuration

- `INPUT_DIR` (`.env`) — folder scanned each run for the single `.zip`/`.csv` to process.
- `config/taxonomy-codes.ts` — which NUCC taxonomy codes count as "physician". Edit to narrow/widen the specialty list.
- `config/states.ts` — which practice-location states to keep. Leave `allowedStates` empty to keep every state.

## Schema

The `physicians` table (`src/schema.ts`) stores name, credential, primary taxonomy code and name (`primary_taxonomy_name` is `null` if the code isn't in `config/taxonomy-codes.ts`'s map), mailing and practice addresses, phone, and enumeration/update dates.

`is_active` is derived from NPPES's deactivation fields: a record with no deactivation date is active, and one that was deactivated counts as active again if it carries a later reactivation date (NPPES keeps both dates on reactivated NPIs). The raw `deactivation_reason_code`, `deactivation_date` and `reactivation_date` are kept alongside it for history.

`enumeration_date`, `last_update_date`, `deactivation_date` and `reactivation_date` are real Postgres `date` columns — NPPES's `MM/DD/YYYY` values are converted on the way in, so they sort and compare directly in SQL (`where last_update_date >= date '2025-01-01'`). A value NPPES writes in some other format is stored as `null`.

If you already pushed the earlier schema, where these were `text`, `bun run db:push` can't convert them in place (Postgres won't cast text to date implicitly). Either reload from scratch — the table is fully derived from the monthly file, so dropping it loses nothing:

```bash
psql "$DATABASE_URL" -c 'drop table physicians'
bun run db:push
```

…or convert in place, keeping the rows you have, then push:

```bash
psql "$DATABASE_URL" -f migrations/0001_dates_to_date_type.sql
bun run db:push   # should report "No changes detected"
```

---

This project was created using `bun init` in bun v1.3.14. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
