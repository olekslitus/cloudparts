// Run after `next build`: deletes the files Next writes for client-side navigation (index.txt and
// __next.*.txt beside every page). Every link on the site is a plain <a> that loads the next page in full,
// so nothing fetches them, and they would more than double the size of the deployment.
import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const out = new URL('../out/', import.meta.url).pathname;
let removed = 0;
for (const entry of readdirSync(out, { recursive: true, withFileTypes: true })) {
  if (entry.isFile() && (entry.name === 'index.txt' || /^__next\..*\.txt$/.test(entry.name))) {
    rmSync(join(entry.parentPath, entry.name));
    removed++;
  }
}
console.log(`Removed ${removed} client-navigation files from out/`);
