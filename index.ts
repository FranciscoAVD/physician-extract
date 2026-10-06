import { $ } from "bun";
import { downloadFile } from "./src/download";
import { extractMainCsv } from "./src/extract";
import { parseAndUpsertPhysicians } from "./src/parse";
import { resolveMonthlyFileUrl } from "./src/resolveUrl";
import { upsertPhysicians } from "./src/db";

const WORK_DIR = ".tmp";

async function main() {
  const fileArgIndex = process.argv.indexOf("--file");
  const localFile = fileArgIndex !== -1 ? process.argv[fileArgIndex + 1] : undefined;

  let csvPath: string;
  let zipPath: string | undefined;

  if (localFile) {
    csvPath = localFile;
    console.log(`Using local file: ${csvPath}`);
  } else {
    await $`mkdir -p ${WORK_DIR}`.quiet();

    console.log("Resolving current NPPES file URL...");
    const url = await resolveMonthlyFileUrl();
    console.log(`Found: ${url}`);

    zipPath = `${WORK_DIR}/${url.split("/").pop()}`;
    await downloadFile(url, zipPath);

    console.log("Extracting main data file...");
    csvPath = await extractMainCsv(zipPath, WORK_DIR);
    console.log(`Extracted: ${csvPath}`);
  }

  console.log("Parsing and loading physicians...");
  const stats = await parseAndUpsertPhysicians(csvPath, upsertPhysicians);
  console.log(`Scanned ${stats.scanned} rows, upserted ${stats.matched} physicians.`);

  if (!localFile) {
    console.log("Cleaning up downloaded/extracted files...");
    await $`rm -f ${zipPath} ${csvPath}`.quiet();
  }
}

await main();
