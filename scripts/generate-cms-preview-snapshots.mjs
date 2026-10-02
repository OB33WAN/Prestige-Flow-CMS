import fs from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const groups = ['services', 'industries', 'areas'];
const snapshots = Object.fromEntries(groups.map((group) => [group, {}]));

for (const group of groups) {
  const directory = path.join(root, group);
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const file = path.join(directory, entry.isDirectory() ? entry.name : '', entry.isDirectory() ? 'index.html' : entry.name);
    if (!entry.isDirectory() && entry.name !== 'index.html') continue;
    const slug = entry.isDirectory() ? entry.name : 'overview';
    const html = await fs.readFile(file, 'utf8');
    const $ = load(html);
    if ($('meta[http-equiv="refresh"]').length || /noindex/i.test($('meta[name="robots"]').attr('content') ?? '')) continue;
    const main = $('main').first();
    if (!main.length || !main.find('h1').length) continue;
    const rootElement = $('#root');
    const markup = [rootElement.children('header').first().prop('outerHTML'), main.prop('outerHTML'), rootElement.children('footer').first().prop('outerHTML')]
      .filter(Boolean).join('\n');
    snapshots[group][slug] = markup;
  }
}

const output = `/* Generated from the existing public page templates. Do not edit by hand. */\nwindow.PRESTIGE_CMS_PAGE_SNAPSHOTS = ${JSON.stringify(snapshots)};\n`;
await fs.writeFile(path.join(root, 'admin', 'page-snapshots.js'), output, 'utf8');
console.log(`Generated full-page CMS previews for ${Object.values(snapshots).reduce((count, group) => count + Object.keys(group).length, 0)} existing pages.`);
