/**
 * Optional helper — copies a local source PNG only when destination is missing.
 * Does NOT overwrite an existing donation-hands.png in assets.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const destination = path.resolve(scriptDir, '../src/assets/images/donation-hands.png');

if (fs.existsSync(destination)) {
  console.log(`Keeping existing asset: ${destination}`);
  process.exit(0);
}

const sources = [
  path.resolve('C:/Users/user/.cursor/projects/empty-window/assets/donation-hands.png'),
];

fs.mkdirSync(path.dirname(destination), { recursive: true });
const source = sources.find((candidate) => fs.existsSync(candidate));

if (!source) {
  console.error('No source image found and destination is missing.');
  process.exit(1);
}

fs.copyFileSync(source, destination);
console.log(`Copied ${source} -> ${destination}`);
