export async function downloadFile(
  url: string,
  destPath: string,
): Promise<void> {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }

  const total = Number(res.headers.get("content-length") ?? 0);
  let downloaded = 0;

  const file = Bun.file(destPath);
  const writer = file.writer();

  for await (const chunk of res.body) {
    writer.write(chunk);
    downloaded += chunk.length;
    if (total > 0) {
      const pct = ((downloaded / total) * 100).toFixed(1);
      process.stdout.write(
        `\rDownloading ${destPath}: ${pct}% (${(downloaded / 1e6).toFixed(0)}MB / ${(total / 1e6).toFixed(0)}MB)`,
      );
    }
  }
  await writer.end();
  process.stdout.write("\n");
}
