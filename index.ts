import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { extractMainCsv } from "./src/extract";
import { parseAndUpsertPhysicians } from "./src/parse";
import { upsertPhysicians } from "./src/db";
import { env } from "./src/env";

const WORK_DIR = ".tmp";

async function findInputFile(folderPath: string): Promise<string> {
  for (const pattern of ["*.zip", "*.csv"]) {
    const matches: string[] = [];
    for await (const name of new Bun.Glob(pattern).scan({ cwd: folderPath })) {
      matches.push(name);
    }

    if (matches.length === 1) return `${folderPath}/${matches[0]}`;
    if (matches.length > 1) {
      throw new Error(
        `Found multiple ${pattern} files in ${folderPath} (${matches.join(", ")}) — leave only the one to process.`,
      );
    }
  }

  throw new Error(`No .zip or .csv file found in ${folderPath}`);
}

async function main() {
  const filePath = await findInputFile(env.INPUT_DIR);

  let csvPath: string;
  // Each run extracts into its own directory so a leftover CSV from an earlier
  // (crashed) run can never be picked up in place of this month's file.
  let runDir: string | undefined;

  if (filePath.endsWith(".zip")) {
    await mkdir(WORK_DIR, { recursive: true });
    runDir = await mkdtemp(`${WORK_DIR}/run-`);

    console.log(`Extracting main data file from ${filePath}...`);
    csvPath = await extractMainCsv(filePath, runDir);
    console.log(`Extracted: ${csvPath}`);
  } else {
    csvPath = filePath;
    console.log(`Using local file: ${csvPath}`);
  }

  try {
    console.log("Parsing and loading physicians...");
    const stats = await parseAndUpsertPhysicians(csvPath, upsertPhysicians);
    console.log(`Scanned ${stats.scanned} rows, upserted ${stats.matched} physicians.`);
  } finally {
    if (runDir) {
      console.log("Cleaning up extracted files...");
      await rm(runDir, { recursive: true, force: true });
    }
  }
}

await main();
