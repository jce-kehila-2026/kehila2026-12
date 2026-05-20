import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(scriptDir, '../src/assets/images/support-areas');

const images = {
  'inspiration-stories.jpg':
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1400&q=85',
  'lectures-workshops.jpg':
    'https://images.unsplash.com/photo-1529390079851-2d976244fd5f?auto=format&fit=crop&w=1400&q=85',
  'support-groups.jpg':
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=85',
  'women-events.jpg':
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=85',
  'donations-community.jpg':
    'https://images.unsplash.com/photo-1469574916224-7f2314531620?auto=format&fit=crop&w=1400&q=85',
  'chat-support.jpg':
    'https://images.unsplash.com/photo-1573497019236-f5c4bbfbaa8e?auto=format&fit=crop&w=1400&q=85',
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
