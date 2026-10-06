import { Readable } from "node:stream";
import { parse } from "csv-parse";
import { isAllowedState, physicianTaxonomyCodes } from "./filters";
import type { PhysicianRow } from "./schema";

const TAXONOMY_COLUMN_COUNT = 15;

export interface ParseStats {
  scanned: number;
  matched: number;
}

function matchedTaxonomyCode(record: Record<string, string>): string | undefined {
  for (let i = 1; i <= TAXONOMY_COLUMN_COUNT; i++) {
    const code = record[`Healthcare Provider Taxonomy Code_${i}`]?.trim();
    if (code && physicianTaxonomyCodes.has(code)) return code;
  }
  return undefined;
}

function toRow(record: Record<string, string>, taxonomyCode: string): PhysicianRow {
  const deactivationDate = record["NPI Deactivation Date"]?.trim() || null;
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
    enumerationDate: record["Provider Enumeration Date"] || null,
    lastUpdateDate: record["Last Update Date"] || null,

    isActive: deactivationDate === null,
    deactivationReasonCode: record["NPI Deactivation Reason Code"]?.trim() || null,
    deactivationDate,
    reactivationDate: record["NPI Reactivation Date"]?.trim() || null,
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
