import { Readable } from "node:stream";
import { parse } from "csv-parse";
import { taxonomyCodeNames } from "../config/taxonomy-codes";
import { isAllowedState, physicianTaxonomyCodes } from "./filters";
import type { PhysicianRow } from "./schema";

const TAXONOMY_COLUMN_COUNT = 15;

export interface ParseStats {
  scanned: number;
  matched: number;
}

/**
 * Picks the physician taxonomy code to record as primary. NPPES flags a
 * provider's primary taxonomy with "Y" in the matching Primary Taxonomy Switch
 * column, so that slot wins when its code is a physician code; otherwise we
 * fall back to the first physician code on the record (a provider whose
 * flagged primary is some non-physician taxonomy still counts as a physician
 * on the strength of their other codes).
 */
function matchedTaxonomyCode(record: Record<string, string>): string | undefined {
  let fallback: string | undefined;

  for (let i = 1; i <= TAXONOMY_COLUMN_COUNT; i++) {
    const code = record[`Healthcare Provider Taxonomy Code_${i}`]?.trim();
    if (!code || !physicianTaxonomyCodes.has(code)) continue;

    const isPrimary =
      record[`Healthcare Provider Primary Taxonomy Switch_${i}`]?.trim().toUpperCase() === "Y";
    if (isPrimary) return code;

    fallback ??= code;
  }

  return fallback;
}

/**
 * Converts an NPPES `MM/DD/YYYY` date to the ISO `YYYY-MM-DD` form Postgres
 * `date` columns take, or null if absent/unparseable. Deliberately string-based
 * rather than going through `Date`, so a date-only value can't be shifted a day
 * by a timezone offset.
 */
function toIsoDate(value: string | null): string | null {
  if (!value) return null;

  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const [, month, day, year] = match;
  if (!month || !day || !year) return null;

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/**
 * An NPI with a deactivation date is inactive unless NPPES later reactivated
 * it — reactivated records keep both dates, so the newer one decides. The
 * decision keys off the *raw* values so that a date NPPES wrote in an
 * unexpected format (which can't land in a `date` column) still counts as
 * deactivated rather than silently reading as active.
 */
function derivedIsActive(
  rawDeactivation: string | null,
  rawReactivation: string | null,
  deactivationDate: string | null,
  reactivationDate: string | null,
): boolean {
  if (!rawDeactivation) return true;
  if (!rawReactivation) return false;
  // A reactivation is on record; trust it if either date failed to parse.
  if (!deactivationDate || !reactivationDate) return true;

  // ISO dates sort lexicographically, so a plain comparison is chronological.
  return reactivationDate >= deactivationDate;
}

function toRow(record: Record<string, string>, taxonomyCode: string): PhysicianRow {
  const rawDeactivation = record["NPI Deactivation Date"]?.trim() || null;
  const rawReactivation = record["NPI Reactivation Date"]?.trim() || null;
  const deactivationDate = toIsoDate(rawDeactivation);
  const reactivationDate = toIsoDate(rawReactivation);
  const npi = record["NPI"];
  const entityTypeCode = record["Entity Type Code"];
  if (!npi || !entityTypeCode) {
    throw new Error("Row is missing NPI or Entity Type Code");
  }

  return {
    npi,
    entityTypeCode,
    lastName: record["Provider Last Name (Legal Name)"] || null,
    firstName: record["Provider First Name"] || null,
    middleName: record["Provider Middle Name"] || null,
    credential: record["Provider Credential Text"] || null,
    primaryTaxonomyCode: taxonomyCode,
    primaryTaxonomyName: taxonomyCodeNames[taxonomyCode] ?? null,

    mailingAddress1: record["Provider First Line Business Mailing Address"] || null,
    mailingAddress2: record["Provider Second Line Business Mailing Address"] || null,
    mailingCity: record["Provider Business Mailing Address City Name"] || null,
    mailingState: record["Provider Business Mailing Address State Name"] || null,
    mailingZip: record["Provider Business Mailing Address Postal Code"] || null,

    practiceAddress1: record["Provider First Line Business Practice Location Address"] || null,
    practiceAddress2: record["Provider Second Line Business Practice Location Address"] || null,
    practiceCity: record["Provider Business Practice Location Address City Name"] || null,
    practiceState: record["Provider Business Practice Location Address State Name"] || null,
    practiceZip: record["Provider Business Practice Location Address Postal Code"] || null,

    phone: record["Provider Business Practice Location Address Telephone Number"] || null,
    enumerationDate: toIsoDate(record["Provider Enumeration Date"]?.trim() || null),
    lastUpdateDate: toIsoDate(record["Last Update Date"]?.trim() || null),

    isActive: derivedIsActive(
      rawDeactivation,
      rawReactivation,
      deactivationDate,
      reactivationDate,
    ),
    deactivationReasonCode: record["NPI Deactivation Reason Code"]?.trim() || null,
    deactivationDate,
    reactivationDate,
  };
}

export async function parseAndUpsertPhysicians(
  csvPath: string,
  upsertBatch: (rows: PhysicianRow[]) => Promise<void>,
  batchSize = 1000,
): Promise<ParseStats> {
  const stats: ParseStats = { scanned: 0, matched: 0 };
  let batch: PhysicianRow[] = [];

  const flush = async () => {
    if (batch.length === 0) return;
    await upsertBatch(batch);
    batch = [];
  };

  const input = Readable.fromWeb(Bun.file(csvPath).stream() as any);
  const parser = input.pipe(
    parse({ columns: true, relax_quotes: true, skip_empty_lines: true }),
  );

  for await (const record of parser as AsyncIterable<Record<string, string>>) {
    stats.scanned++;

    if (record["Entity Type Code"] !== "1") continue;

    const taxonomyCode = matchedTaxonomyCode(record);
    if (!taxonomyCode) continue;

    const practiceState =
      record["Provider Business Practice Location Address State Name"]?.trim() ?? "";
    if (!isAllowedState(practiceState)) continue;

    stats.matched++;
    batch.push(toRow(record, taxonomyCode));

    if (batch.length >= batchSize) {
      await flush();
    }
  }

  await flush();
  return stats;
}
