import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import matter from 'gray-matter';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'content', 'cms', 'services', '.cms-ci-test.md');
const generated = path.join(root, '.cms-generated-pages', 'services', 'cms-ci-test', 'index.html');
const paragraph = 'A careful on-site assessment records the symptoms, access conditions, pipe layout and any previous repair history. This context helps the engineer explain suitable next steps and identify when a specialist inspection may be useful. Clear communication supports owners, occupants and property managers while keeping decisions tied to the condition found at the property. We explain access needs and discuss additional work before it proceeds. These notes can also help organise future maintenance and provide a useful record for anyone responsible for the building. These practical observations help explain clear options without assuming what the inspection will find. Example input <script>window.cmsXss=1</script> stays as text.';
const fields = [
  '---',
  'title: Drainage advice in Maidenhead | Prestige Flow',
  'slug: cms-ci-test',
  "description: Practical drainage advice for Maidenhead properties, including symptoms, investigation options and how to prepare for an engineer's visit.",
  'heading: Drainage advice in Maidenhead',
  'intro: Prestige Flow helps property owners understand drainage symptoms and plan a useful next step. We discuss the site, access and service needs before arranging a visit.',
  "hero_image: ''",
  "hero_image_alt: ''",
  'sections:',
  '  - heading: Understand the symptoms',
  '    body: >-',
  `      ${paragraph}`,
  '  - heading: Choose an appropriate investigation',
  '    body: >-',
  `      ${paragraph}`,
  '  - heading: Prepare for a site visit',
  '    body: >-',
  `      ${paragraph}`,
  'internal_links:',
  '  - label: Drainage services',
  '    url: /services/drainage/',
  '---',
  ''
].join('\n');

try {
  execFileSync(process.execPath, ['scripts/build-cms-pages.mjs'], { cwd: root, stdio: 'pipe' });
  const currentServicePath = path.join(root, '.cms-generated-pages', 'services', 'drainage', 'index.html');
  const currentIndustryPath = path.join(root, '.cms-generated-pages', 'industries', 'healthcare', 'index.html');
  const currentAreasPath = path.join(root, '.cms-generated-pages', 'areas', 'index.html');
  const sourceService = load(await fs.readFile(path.join(root, 'services', 'drainage', 'index.html'), 'utf8'));
  const builtService = load(await fs.readFile(currentServicePath, 'utf8'));
  const sourceIndustry = load(await fs.readFile(path.join(root, 'industries', 'healthcare', 'index.html'), 'utf8'));
  const builtIndustry = load(await fs.readFile(currentIndustryPath, 'utf8'));
  const sourceAreas = load(await fs.readFile(path.join(root, 'areas', 'index.html'), 'utf8'));
  const builtAreas = load(await fs.readFile(currentAreasPath, 'utf8'));
  assert.equal(builtService('main h1').text(), sourceService('main h1').text(), 'Current service pages are prefilled with existing copy.');
  assert.equal(builtIndustry('main h1').text(), sourceIndustry('main h1').text(), 'Current industry pages are prefilled with existing copy.');
  assert.equal(builtAreas('main h1').text(), sourceAreas('main h1').text(), 'The consolidated current areas page is prefilled.');
  assert.deepEqual(builtService('script[src]').map((_, element) => builtService(element).attr('src')).get(), sourceService('script[src]').map((_, element) => sourceService(element).attr('src')).get(), 'Existing page JavaScript references stay unchanged.');
  assert.deepEqual(builtService('link[rel="stylesheet"]').map((_, element) => builtService(element).attr('href')).get(), sourceService('link[rel="stylesheet"]').map((_, element) => sourceService(element).attr('href')).get(), 'Existing page stylesheets stay unchanged.');
  assert.equal(builtAreas('details').length, sourceAreas('details').length, 'Existing postcode groups remain unchanged.');
  assert.match(builtService('main').text(), /£120\s*\/\s*hour\s*\+\s*VAT|£120\/hr\s*\+\s*VAT/u, 'Existing service pricing stays in its owner-managed page section.');

  const currentServiceFile = path.join(root, 'content', 'cms', 'current', 'services', 'drainage.md');
  const originalServiceRecord = await fs.readFile(currentServiceFile, 'utf8');
  const invalidServiceRecord = matter(originalServiceRecord);
  invalidServiceRecord.data.service_summary = '£120/hr + VAT ' + invalidServiceRecord.data.service_summary;
  await fs.writeFile(currentServiceFile, matter.stringify(invalidServiceRecord.content, invalidServiceRecord.data), 'utf8');
  let rejectedExistingPrice = false;
  try { execFileSync(process.execPath, ['scripts/build-cms-pages.mjs'], { cwd: root, stdio: 'pipe' }); }
  catch (error) { rejectedExistingPrice = /pricing, payment or technical content controlled by the site owner/u.test(String(error.stderr)); }
  finally { await fs.writeFile(currentServiceFile, originalServiceRecord, 'utf8'); }
  assert.ok(rejectedExistingPrice, 'Existing-page copy edits must reject attempts to change owner-managed prices.');

  await fs.writeFile(source, fields, 'utf8');
  execFileSync(process.execPath, ['scripts/build-cms-pages.mjs'], { cwd: root, stdio: 'pipe' });
  const html = await fs.readFile(generated, 'utf8');
  assert.match(html, /<title>Drainage advice in Maidenhead \| Prestige Flow<\/title>/u);
  assert.match(html, /<link rel="canonical" href="https:\/\/prestigeflow\.co\.uk\/services\/cms-ci-test\/">/u);
  assert.match(html, /<h1>Drainage advice in Maidenhead<\/h1>/u);
  assert.match(html, /href="\/services\/drainage\/"/u);
  assert.doesNotMatch(html, /<script>window\.cmsXss/u, 'Raw editor HTML must not be emitted as executable markup.');

  await fs.writeFile(source, fields.replace(paragraph, `£120/hr ${paragraph}`), 'utf8');
  let rejected = false;
  try { execFileSync(process.execPath, ['scripts/build-cms-pages.mjs'], { cwd: root, stdio: 'pipe' }); }
  catch (error) { rejected = /Pricing, payment and API content is centrally managed/u.test(String(error.stderr)); }
  assert.ok(rejected, 'Build must reject CMS content that introduces rates or payment promises.');

  await fs.writeFile(source, fields.replace(paragraph, `${paragraph} [Contact by email](mailto:info@example.com)`), 'utf8');
  rejected = false;
  try { execFileSync(process.execPath, ['scripts/build-cms-pages.mjs'], { cwd: root, stdio: 'pipe' }); }
  catch (error) { rejected = /email, telephone, payment and external links are centrally managed/u.test(String(error.stderr)); }
  assert.ok(rejected, 'Build must reject email, telephone, payment and external links in CMS copy.');

  await fs.writeFile(source, fields.replace(paragraph, `${paragraph} Contact our team at info@example.com`), 'utf8');
  rejected = false;
  try { execFileSync(process.execPath, ['scripts/build-cms-pages.mjs'], { cwd: root, stdio: 'pipe' }); }
  catch (error) { rejected = /Email addresses and email links are centrally managed/u.test(String(error.stderr)); }
  assert.ok(rejected, 'Build must reject new email addresses in CMS copy.');
  console.log('PASS: Current page inventory, text-only page overlays, protected styles/scripts/pricing, new page generation, SEO metadata and safe copy.');
} finally {
  await fs.rm(source, { force: true });
  execFileSync(process.execPath, ['scripts/build-cms-pages.mjs'], { cwd: root, stdio: 'pipe' });
}
