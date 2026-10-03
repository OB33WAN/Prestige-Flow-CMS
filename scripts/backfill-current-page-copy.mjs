import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { load } from 'cheerio';
import { collectCurrentCopyFields } from './current-copy-fields.mjs';

const root = process.cwd();
const refresh = process.argv.includes('--refresh');
let updated = 0;
for (const type of ['services', 'industries', 'areas']) {
  const dir = path.join(root, 'content', 'cms', 'current', type);
  for (const filename of await fs.readdir(dir)) {
    if (!filename.endsWith('.md')) continue;
    const recordPath = path.join(dir, filename);
    const record = matter(await fs.readFile(recordPath, 'utf8'));
    if (Array.isArray(record.data.page_copy) && !refresh) continue;
    const slug = path.basename(filename, '.md');
    const sourcePath = slug === 'overview'
      ? path.join(root, type, 'index.html')
      : path.join(root, type, slug, 'index.html');
    const $ = load(await fs.readFile(sourcePath, 'utf8'));
    record.data.page_copy = collectCurrentCopyFields($, type, slug);
    if (type === 'industries') delete record.data.sections;
    await fs.writeFile(recordPath, matter.stringify(record.content, record.data), 'utf8');
    updated += 1;
    console.log(`${type}/${slug}: ${record.data.page_copy.length} additional copy fields`);
  }
}
console.log(`${refresh ? 'Refreshed' : 'Backfilled'} ${updated} current page entries without overwriting their existing SEO or copy fields.`);
