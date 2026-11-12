-- Converts the four NPPES date columns from text (MM/DD/YYYY) to real `date`
-- columns. Only needed if you pushed the earlier text-based schema and want to
-- keep the rows already loaded; a fresh database just needs `bun run db:push`.
--
-- `drizzle-kit push` cannot do this on its own: Postgres refuses to cast text
-- to date implicitly, so run this once before pushing.
--
--   psql "$DATABASE_URL" -f migrations/0001_dates_to_date_type.sql
--
-- Values that aren't in MM/DD/YYYY form (including empty strings) become NULL.

ALTER TABLE physicians
  ALTER COLUMN enumeration_date TYPE date USING CASE
    WHEN enumeration_date ~ '^\d{1,2}/\d{1,2}/\d{4}$'
      THEN to_date(enumeration_date, 'MM/DD/YYYY')
  END,
  ALTER COLUMN last_update_date TYPE date USING CASE
    WHEN last_update_date ~ '^\d{1,2}/\d{1,2}/\d{4}$'
      THEN to_date(last_update_date, 'MM/DD/YYYY')
  END,
  ALTER COLUMN deactivation_date TYPE date USING CASE
    WHEN deactivation_date ~ '^\d{1,2}/\d{1,2}/\d{4}$'
      THEN to_date(deactivation_date, 'MM/DD/YYYY')
  END,
  ALTER COLUMN reactivation_date TYPE date USING CASE
    WHEN reactivation_date ~ '^\d{1,2}/\d{1,2}/\d{4}$'
      THEN to_date(reactivation_date, 'MM/DD/YYYY')
  END;
