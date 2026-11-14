# physician-extract

Takes CMS's monthly [NPPES NPI Registry](https://download.cms.gov/nppes/NPI_Files.html) full-replacement file (downloaded manually — see below), filters it down to the providers a cytology/histology lab can have as customers, and upserts the matches into a Postgres database via Drizzle ORM.

"Customer" means a clinician whose practice generates cytology or histology specimens that get sent out for sign-out — dermatology, GI, OB/GYN, urology, surgery and so on. [`config/taxonomy-codes.ts`](config/taxonomy-codes.ts) is deliberately *not* a list of every physician: specialties that neither cut tissue nor collect cells (anesthesiology, psychiatry, PM&R, emergency medicine, preventive medicine, radiation oncology, pain, hospice, sports and sleep medicine) are left out, and so are pathologists and lab staff themselves — they're peers and competitors, not customers.

Filtering rules:
- Only `Entity Type Code = 1` (individual providers) — organizations/institutions are always excluded, regardless of taxonomy code. This also means laboratories, which NPPES records as entity type 2, can never appear.
- Only rows with a taxonomy code listed in [`config/taxonomy-codes.ts`](config/taxonomy-codes.ts). Of a provider's matching codes, the one NPPES flags as primary (`Healthcare Provider Primary Taxonomy Switch_N = Y`) is recorded; if no match is flagged primary, the first matching code is used. A provider whose flagged primary is some unrelated taxonomy still counts as a customer on the strength of their other codes.
- Non-physician customers (PAs, nurse practitioners, podiatrists, oral & maxillofacial surgeons) are included alongside MD/DOs, since they carry their own NPI and account for a large share of skin biopsy, nail, cervical cytology and oral specimen volume. They live in a separate `nonPhysicianCustomerCodeNames` map — drop it from the spread at the bottom of the file to restrict the extract to physicians only.
- Optionally restricted to a set of practice-location states in [`config/states.ts`](config/states.ts) (empty = all states).
- Deactivated providers are kept, not dropped — see `is_active` below.

## Setup

Requirements: [Bun](https://bun.com), a Postgres database, and `unzip` on `PATH` (used to pull the data CSV out of the monthly ZIP — the Docker image installs it for you).

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

Each month, download the current full-replacement ZIP from the [NPI_Files.html](https://download.cms.gov/nppes/NPI_Files.html) page yourself into `INPUT_DIR` (and make sure that folder has nothing else matching `*.zip`/`*.csv` in it — more than one match is an error rather than a guess), then run:

```bash
bun run parse
```

This finds the single `.zip` in `INPUT_DIR` and extracts just the main `npidata_pfile_*.csv` from it (the bundled othername/pl/endpoint reference files are skipped) into a fresh per-run directory under `.tmp/`. It then streams that CSV into the `physicians` table in batches, upserting by NPI so re-running a later month's file updates existing rows instead of duplicating them, and prints how many rows were scanned and how many physicians were upserted. The run directory is deleted afterwards — including when the load fails, so a leftover CSV from a crashed run can never be picked up in place of this month's file. The ZIP you downloaded is left alone.

If `INPUT_DIR` has no `.zip` but has a single `.csv` instead, that's used directly and nothing is extracted or deleted (handy for a local sample file when testing).

Nothing in the pipeline deletes or diffs rows: an NPI that disappears from a later monthly file stays in the table as it was last seen.

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

The mount can be read-only: extraction goes to `/app/.tmp` inside the container, not next to the input file.

The schema still needs to be pushed once from the host (`bun run db:push`) before the container's first run, since the image only installs production dependencies (`drizzle-kit` is a dev-only tool).

## Configuration

- `INPUT_DIR` (`.env`) — folder scanned each run for the single `.zip`/`.csv` to process.
- `DATABASE_URL` (`.env`) — Postgres connection string, used both by the extract and by `bun run db:push`.
- `config/taxonomy-codes.ts` — which NUCC taxonomy codes count as a customer, and the display name stored for each. Split into `physicianCustomerCodeNames` and `nonPhysicianCustomerCodeNames`; edit either to narrow/widen the specialty list. Codes and display names are taken verbatim from NUCC taxonomy v26.1 (July 2026).
- `config/states.ts` — which practice-location states to keep. Leave `allowedStates` empty to keep every state.

## Project layout

- `index.ts` — entry point: locates the month's file, extracts, loads, cleans up.
- `src/extract.ts` — pulls the main `npidata_pfile_*.csv` out of the NPPES ZIP.
- `src/parse.ts` — streams the CSV, applies the filters, maps rows to the table shape.
- `src/filters.ts` — taxonomy-code and state predicates built from `config/`.
- `src/db.ts` — Drizzle client and the batched upsert.
- `src/schema.ts` — the `physicians` table definition (source of truth for `db:push`).
- `src/env.ts` — environment-variable validation.
- `migrations/` — hand-written SQL for changes `db:push` can't make in place.

## Schema

The `physicians` table (`src/schema.ts`) — named from when the extract kept every physician; it now holds the customer population described above — stores name, credential, primary taxonomy code and name (`primary_taxonomy_name` is `null` if the code isn't in `config/taxonomy-codes.ts`'s map), mailing and practice addresses, phone, and enumeration/update dates. `npi` is the primary key; every other column is overwritten on each load.

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
