/**
 * Fetches the official list of Israeli localities (ערים ויישובים) from the
 * government open-data portal (data.gov.il, CKAN datastore) and writes a cleaned,
 * de-duplicated, sorted JSON array of Hebrew city names to
 * src/shared/data/israeliCities.json.
 *
 * The list is bundled (not fetched at runtime) so the app stays fast and works
 * offline / without depending on the portal's uptime or CORS. Re-run to refresh:
 *
 *   node scripts/fetch-israeli-cities.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RESOURCE_ID = '5c78e9fa-c2e2-4771-93ff-7f400a12f7ba'; // CBS localities resource
const NAME_FIELD = 'שם_ישוב'; // Hebrew name
const LATIN_NAME_FIELD = 'שם_ישוב_לועזי'; // Latin/English name (for English search)
const ENDPOINT = 'https://data.gov.il/api/3/action/datastore_search';

function titleCase(latin) {
  // The dataset stores Latin names in uppercase ("TEL AVIV - YAFO"); make them
  // friendlier for display/search ("Tel Aviv - Yafo").
  return latin
    .toLowerCase()
    .replace(/(^|[\s\-'/(])([a-z])/g, (_m, sep, ch) => sep + ch.toUpperCase());
}

// Placeholder / non-locality rows in the dataset that should not appear as choices.
const EXCLUDED = new Set(['לא רשום', 'ללא ישוב קבע']);

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '../src/shared/data/israeliCities.json');

async function fetchAll() {
  const url = `${ENDPOINT}?resource_id=${RESOURCE_ID}&limit=5000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (!json?.success) throw new Error('CKAN response was not successful');
  return json.result.records || [];
}

function clean(records) {
  const seen = new Set();
  const cities = [];
  for (const row of records) {
    const he = String(row[NAME_FIELD] ?? '').replace(/\s+/g, ' ').trim();
    if (!he || EXCLUDED.has(he) || seen.has(he)) continue;
    seen.add(he);
    const latinRaw = String(row[LATIN_NAME_FIELD] ?? '').replace(/\s+/g, ' ').trim();
    cities.push({ he, en: latinRaw ? titleCase(latinRaw) : '' });
  }
  // Sort by Hebrew name with Hebrew locale collation.
  return cities.sort((a, b) => a.he.localeCompare(b.he, 'he'));
}

async function main() {
  console.log('Fetching Israeli localities from data.gov.il…');
  const records = await fetchAll();
  const cities = clean(records);
  console.log(`Got ${records.length} rows → ${cities.length} unique localities.`);
  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, `${JSON.stringify(cities, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
