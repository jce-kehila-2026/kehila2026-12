/**
 * Optional: download stock hospital hero placeholders.
 * Production heroes are the user-provided *-building.* files in src/assets/images/
 * (wired in medicalPartnerImages.js). This script is not used by the build.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(scriptDir, '../src/assets/images');

const images = {
  'assuta-building.jpeg':
    'https://images.unsplash.com/photo-1764885518098-781b23d50e7f?auto=format&fit=crop&w=1400&q=85',
  'ichilov-building.jpg':
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1400&q=85',
  'barzilai-building.jpg':
    'https://images.unsplash.com/photo-1587351021355-a479a299d2f9?auto=format&fit=crop&w=1400&q=85',
  'shamir-building.jpg':
    'https://images.unsplash.com/photo-1743461821527-4f02ea2f582a?auto=format&fit=crop&w=1400&q=85',
};

fs.mkdirSync(outDir, { recursive: true });

for (const [filename, url] of Object.entries(images)) {
  const destination = path.join(outDir, filename);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download ${filename}: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destination, buffer);
  console.log(`Wrote ${filename} (${buffer.length} bytes)`);
}
