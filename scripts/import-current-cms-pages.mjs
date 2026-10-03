import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { load } from 'cheerio';
import { collectCurrentCopyFields } from './current-copy-fields.mjs';

const root = process.cwd();
const groups = ['services', 'industries'];

async function main() {
  let imported = 0;
  for (const type of groups) {
    const sourceDir = path.join(root, type);
    const outputDir = path.join(root, 'content', 'cms', 'current', type);
    await fs.mkdir(outputDir, { recursive: true });
    for (const entry of await fs.readdir(sourceDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const slug = entry.name;
      const sourceFile = path.join(sourceDir, slug, 'index.html');
      let source;
      try { source = await fs.readFile(sourceFile, 'utf8'); }
      catch (error) { if (error.code === 'ENOENT') continue; throw error; }
      const $ = load(source);
      if ($('meta[http-equiv="refresh"]').length || /noindex/i.test($('meta[name="robots"]').attr('content') ?? '')) continue;
      const h1 = $('main h1').first();
      const intro = h1.next('p').text().trim();
      if (!h1.length || !intro) throw new Error(`Cannot identify current page heading and intro: ${type}/${slug}`);
      const page = {
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content')?.trim() ?? '',
        heading: h1.text().trim(),
        intro,
      };
      if (type === 'services') {
        page.service_summary = $('main h2').first().closest('section').find('p').first().text().trim();
        if (!page.service_summary) throw new Error(`Cannot identify service summary: ${type}/${slug}`);
        if (slug === 'cctv-surveys') {
          page.description = 'CCTV drain surveys in Reading, Maidenhead and London for blockages, defects and recurring problems. Contact us to confirm scope, access and availability and request a visit.';
          page.service_summary = 'The survey provides clear camera findings across service areas. Contact us to confirm access, scope and appointment availability before booking.';
        }
      }
      page.page_copy = collectCurrentCopyFields($, type, slug);
      const outputFile = path.join(outputDir, `${slug}.md`);
      await fs.writeFile(outputFile, matter.stringify('', page), 'utf8');
      imported += 1;
    }
  }
  const areasSource = await fs.readFile(path.join(root, 'areas', 'index.html'), 'utf8');
  const areas = load(areasSource);
  const areaHeading = areas('main h1').first();
  await fs.mkdir(path.join(root, 'content', 'cms', 'current', 'areas'), { recursive: true });
  const areaOverview = {
    title: areas('title').text().trim(),
    description: areas('meta[name="description"]').attr('content')?.trim() ?? '',
    heading: areaHeading.text().trim(),
    intro: areaHeading.next('p').text().trim(),
    page_copy: collectCurrentCopyFields(areas, 'areas', 'overview'),
  };
  await fs.writeFile(path.join(root, 'content', 'cms', 'current', 'areas', 'overview.md'), matter.stringify('', areaOverview), 'utf8');
  imported += 1;
  console.log(`Imported ${imported - 1} active service/industry pages and the current Areas overview. Retired/noindex area routes were left out.`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
