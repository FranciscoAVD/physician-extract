const NPI_FILES_PAGE = "https://download.cms.gov/nppes/NPI_Files.html";
const BASE_URL = "https://download.cms.gov/nppes/";

const FULL_FILE_PATTERN =
  /NPPES_Data_Dissemination_[A-Za-z]+_\d{4}(?:_V\d+)?\.zip/;

export async function resolveMonthlyFileUrl(): Promise<string> {
  const res = await fetch(NPI_FILES_PAGE);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch ${NPI_FILES_PAGE}: ${res.status} ${res.statusText}`,
    );
  }
  const html = await res.text();

  const match = html.match(FULL_FILE_PATTERN);
  if (!match) {
    throw new Error(
      `Could not find the monthly NPPES file link on ${NPI_FILES_PAGE}`,
    );
  }

  return BASE_URL + match[0];
}
