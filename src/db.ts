import { getTableColumns, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sql";
import { env } from "./env";
import { physicians, type PhysicianRow } from "./schema";

export const db = drizzle(env.DATABASE_URL);

const BATCH_SIZE = 1000;

const updateColumns = Object.entries(getTableColumns(physicians))
  .filter(([key]) => key !== "npi")
  .reduce<Record<string, unknown>>((set, [key, column]) => {
    set[key] = sql.raw(`excluded.${column.name}`);
    return set;
  }, {});

export async function upsertPhysicians(rows: PhysicianRow[]): Promise<void> {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await db
      .insert(physicians)
      .values(batch)
      .onConflictDoUpdate({
        target: physicians.npi,
        set: updateColumns,
      });
  }
}
