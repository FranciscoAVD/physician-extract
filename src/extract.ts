import { $ } from "bun";

/**
 * Extracts just the main npidata_pfile_*.csv from the NPPES zip
 * (skipping the bundled othername/pl/endpoint reference files)
 * and returns its path.
 */
export async function extractMainCsv(
  zipPath: string,
  destDir: string,
): Promise<string> {
  await $`unzip -o ${zipPath} "npidata_pfile_*.csv" -d ${destDir}`.quiet();

  const glob = new Bun.Glob("npidata_pfile_*.csv");
  for await (const relPath of glob.scan({ cwd: destDir })) {
    if (relPath.includes("FileHeader")) continue;
    return `${destDir}/${relPath}`;
  }

  throw new Error(`No npidata_pfile_*.csv found in ${zipPath} after extraction`);
}
