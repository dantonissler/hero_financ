import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(import.meta.dirname, '../public/contas');
const ofxFiles = readdirSync(dir).filter((name) => name.endsWith('.ofx')).sort();

writeFileSync(
  join(dir, 'manifest.json'),
  `${JSON.stringify({ files: ofxFiles }, null, 2)}\n`,
);

console.log(`manifest.json: ${ofxFiles.length} OFX`);
