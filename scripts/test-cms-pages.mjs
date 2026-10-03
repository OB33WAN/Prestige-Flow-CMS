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
  const cmsConfig = await fs.readFile(path.join(root, 'admin', 'config.yml'), 'utf8');
  const cmsPreview = await fs.readFile(path.join(root, 'admin', 'preview.js'), 'utf8');
  execFileSync(process.execPath, ['scripts/generate-cms-preview-snapshots.mjs'], { cwd: root, stdio: 'pipe' });
  const snapshotSource = await fs.readFile(path.join(root, 'admin', 'page-snapshots.js'), 'utf8');
  const snapshotMatch = snapshotSource.match(/window\.PRESTIGE_CMS_PAGE_SNAPSHOTS = (.+);\s*$/u);
  assert.ok(snapshotMatch, 'Full-page preview snapshots are generated for the CMS.');
  const snapshots = JSON.parse(snapshotMatch[1]);
  assert.equal(Object.keys(snapshots.services).length, 8, 'The service overview and all 7 current service pages are available in the side preview.');
  assert.equal(Object.keys(snapshots.industries).length, 16, 'The industry overview and all 15 current industry pages are available in the side preview.');
  assert.match(snapshots.areas.overview, /postcode coverage/iu, 'The Areas preview retains its complete coverage content.');
  assert.match(snapshots.areas.overview, /£144\.00/u, 'Owner-controlled rate content remains visible in the page preview.');
  assert.match(cmsPreview, /dangerouslySetInnerHTML/u, 'Existing pages render their complete page markup in the side preview.');
  assert.match(cmsPreview, /id: 'root'/u, 'Existing page previews retain the site root styling context.');
  assert.match(cmsPreview, /currentPagePreview\(entry, collectionName, this\.props\)/u, 'Existing page previews receive Decap image assets.');
  assert.match(cmsPreview, /intro\.insertAdjacentElement\('afterend', figure\)/u, 'Uploaded images appear in current-page side previews.');
  assert.match(cmsPreview, /registerPreviewStyle\('\/admin\/preview\.css\?v=2'\)/u, 'CMS previews load responsive sizing and control styles.');
  assert.match(cmsPreview, /faq-answer/u, 'The page preview applies current CMS FAQ fields.');
  assert.match(await fs.readFile(path.join(root, 'admin', 'preview.css'), 'utf8'), /min-width:\s*0\s*!important/u, 'Wide pricing tables can fit the responsive preview viewport.');
  assert.match(cmsConfig, /preview_path: 'services\/\{\{slug\}\}\//u, 'Service records map to their live page routes.');
  assert.match(cmsConfig, /preview_path: 'industries\/\{\{slug\}\}\//u, 'Industry records map to their live page routes.');
  assert.match(cmsConfig, /preview_path: 'areas\/'/u, 'The current Areas overview links to /areas/.');
  assert.match(cmsConfig, /allow_add: false\s+allow_remove: false\s+allow_reorder: false/u, 'Existing page copy fields cannot be added, removed or reordered in the editor.');
  for (const collection of ['current_services', 'current_industries', 'current_areas', 'services', 'industries', 'areas']) {
    assert.ok(cmsPreview.includes("registerPreviewTemplate('" + collection + "'"), `CMS has a branded preview for ${collection}.`);
  }
  assert.ok(cmsPreview.includes("registerPreviewStyle('/assets/cms-pages.css')"), 'CMS previews load the site page styling.');
  execFileSync(process.execPath, ['--check', 'admin/preview.js'], { cwd: root, stdio: 'pipe' });

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

  for (const type of ['services', 'industries', 'areas']) {
    const currentDir = path.join(root, 'content', 'cms', 'current', type);
    for (const filename of await fs.readdir(currentDir)) {
      if (!filename.endsWith('.md')) continue;
      const slug = path.basename(filename, '.md');
      const record = matter(await fs.readFile(path.join(currentDir, filename), 'utf8')).data;
      const sourcePath = slug === 'overview'
        ? path.join(root, type, 'index.html')
        : path.join(root, type, slug, 'index.html');
      const outputPath = slug === 'overview'
        ? path.join(root, '.cms-generated-pages', type, 'index.html')
        : path.join(root, '.cms-generated-pages', type, slug, 'index.html');
      const sourcePage = load(await fs.readFile(sourcePath, 'utf8'));
      const outputPage = load(await fs.readFile(outputPath, 'utf8'));
      assert.ok(record.page_copy?.length > 0, `${type}/${slug} exposes additional existing page text in the CMS.`);
      for (const field of record.page_copy) {
        const [tag, index] = field.key.split(':');
        const target = tag === 'faq-answer'
          ? outputPage('main [data-testid^="text-answer"]').eq(Number(index)).find('.leading-relaxed')
          : outputPage(`main ${tag}`).eq(Number(index));
        assert.equal(target.text().trim(), field.text.trim(), `${type}/${slug} CMS field maps to its live page text: ${field.label}`);
      }
      if (type === 'areas') {
        assert.equal(outputPage('details').length, sourcePage('details').length, 'Area postcode disclosures remain owner-controlled.');
      }
    }
  }
  const healthcareRecord = matter(await fs.readFile(path.join(root, 'content', 'cms', 'current', 'industries', 'healthcare.md'), 'utf8')).data;
  assert.ok(healthcareRecord.page_copy.some((field) => field.text === 'Drainage'), 'Industry service card titles are available as editable copy.');
  assert.ok(healthcareRecord.page_copy.some((field) => field.text === 'Plumbing'), 'Industry plumbing copy is represented in the CMS.');
  assert.ok(healthcareRecord.page_copy.some((field) => field.text === 'CCTV surveys'), 'Industry CCTV copy is represented in the CMS.');
  assert.ok(healthcareRecord.page_copy.some((field) => /Can you attend urgently\?/u.test(field.text)), 'Industry FAQs are represented in the CMS.');

  const cctvRecordPath = path.join(root, 'content', 'cms', 'current', 'services', 'cctv-surveys.md');
  const cctvRecordSource = await fs.readFile(cctvRecordPath, 'utf8');
  const cctvRecord = matter(cctvRecordSource);
  const editableQuestion = cctvRecord.data.page_copy.find((field) => field.key === 'h3:3');
  const editableAnswer = cctvRecord.data.page_copy.find((field) => field.key === 'faq-answer:1');
  assert.ok(editableQuestion && editableAnswer, 'Safe service FAQs include editable question and answer fields.');
  editableQuestion.text = 'What is included in the camera survey?';
  editableAnswer.text = 'The visit includes camera inspection and a clear explanation of the findings and next steps.';
  try {
    await fs.writeFile(cctvRecordPath, matter.stringify(cctvRecord.content, cctvRecord.data), 'utf8');
    execFileSync(process.execPath, ['scripts/build-cms-pages.mjs'], { cwd: root, stdio: 'pipe' });
    const editedFaq = load(await fs.readFile(path.join(root, '.cms-generated-pages', 'services', 'cctv-surveys', 'index.html'), 'utf8'));
    const questionButton = editedFaq('[data-testid="button-faq-1"]');
    assert.equal(questionButton.text().trim(), editableQuestion.text, 'Editing an FAQ question preserves its accordion button and icon.');
    assert.ok(questionButton.find('svg').length, 'FAQ question edits preserve the disclosure icon.');
    assert.equal(editedFaq('[data-testid="text-answer-1"] .leading-relaxed').text().trim(), editableAnswer.text, 'FAQ answers are editable in the live page template.');
    const schema = JSON.parse(editedFaq('script[type="application/ld+json"]').first().text());
    const faqSchema = schema['@graph'].find((entity) => entity['@type'] === 'FAQPage');
    assert.equal(faqSchema.mainEntity[1].name, editableQuestion.text, 'FAQ schema follows the edited visible question.');
    assert.equal(faqSchema.mainEntity[1].acceptedAnswer.text, editableAnswer.text, 'FAQ schema follows the edited visible answer.');
  } finally {
    await fs.writeFile(cctvRecordPath, cctvRecordSource, 'utf8');
    execFileSync(process.execPath, ['scripts/build-cms-pages.mjs'], { cwd: root, stdio: 'pipe' });
  }

  const currentServiceFile = path.join(root, 'content', 'cms', 'current', 'services', 'drainage.md');
  const originalServiceRecord = await fs.readFile(currentServiceFile, 'utf8');
  const imagePath = path.join(root, 'assets', 'cms', 'cms-ci-test-image.jpg');
  const imageRecordPath = path.join(root, 'content', 'cms', 'current', 'services', 'cms-image-test.md');
  const imageSourcePath = path.join(root, 'services', 'cms-image-test', 'index.html');
  await fs.mkdir(path.dirname(imagePath), { recursive: true });
  await fs.mkdir(path.dirname(imageSourcePath), { recursive: true });
  await fs.copyFile(path.join(root, 'assets', 'camera_inspection_in_881c5ae9-CpB7Vb8q.jpg'), imagePath);
  try {
    const imageRecord = matter(originalServiceRecord);
    imageRecord.data.title = 'CMS image test | Prestige Flow';
    imageRecord.data.description = 'Temporary image verification confirms that the Prestige Flow editor can publish uploaded page images correctly.';
    imageRecord.data.heading = 'CMS image verification';
    imageRecord.data.intro = 'This temporary page verifies that editors can upload and publish an image on a current service page.';
    imageRecord.data.hero_image = '/assets/cms/cms-ci-test-image.jpg';
    imageRecord.data.hero_image_alt = 'Engineer carrying out a drain camera inspection';
    await fs.writeFile(imageRecordPath, matter.stringify(imageRecord.content, imageRecord.data), 'utf8');
    await fs.copyFile(path.join(root, 'services', 'drainage', 'index.html'), imageSourcePath);
    execFileSync(process.execPath, ['scripts/build-cms-pages.mjs'], { cwd: root, stdio: 'pipe' });
    const imagePage = load(await fs.readFile(path.join(root, '.cms-generated-pages', 'services', 'cms-image-test', 'index.html'), 'utf8'));
    assert.equal(imagePage('.cms-editorial-image img').attr('src'), '/assets/cms/cms-ci-test-image.jpg', 'Uploaded images render on current pages.');
    assert.equal(imagePage('.cms-editorial-image img').attr('alt'), 'Engineer carrying out a drain camera inspection', 'Uploaded images have meaningful alt text.');
    assert.ok(imagePage('link[rel="stylesheet"][href="/assets/cms-pages.css"]').length, 'Current pages load the scoped image styles.');
  } finally {
    await fs.rm(imageRecordPath, { force: true });
    await fs.rm(path.dirname(imageSourcePath), { recursive: true, force: true });
    await fs.rm(imagePath, { force: true });
    execFileSync(process.execPath, ['scripts/build-cms-pages.mjs'], { cwd: root, stdio: 'pipe' });
  }
  const priceTestOriginal = await fs.readFile(currentServiceFile, 'utf8');
  const invalidServiceRecord = matter(priceTestOriginal);
  invalidServiceRecord.data.service_summary = '£120/hr + VAT ' + invalidServiceRecord.data.service_summary;
  await fs.writeFile(currentServiceFile, matter.stringify(invalidServiceRecord.content, invalidServiceRecord.data), 'utf8');
  let rejectedExistingPrice = false;
  try { execFileSync(process.execPath, ['scripts/build-cms-pages.mjs'], { cwd: root, stdio: 'pipe' }); }
  catch (error) { rejectedExistingPrice = /pricing, payment or technical content controlled by the site owner/u.test(String(error.stderr)); }
  finally { await fs.writeFile(currentServiceFile, priceTestOriginal, 'utf8'); }
  assert.ok(rejectedExistingPrice, 'Existing-page copy edits must reject attempts to change owner-managed prices.');

  await fs.writeFile(source, fields, 'utf8');
  execFileSync(process.execPath, ['scripts/build-cms-pages.mjs'], { cwd: root, stdio: 'pipe' });
  const html = await fs.readFile(generated, 'utf8');
  assert.match(html, /<title>Drainage advice in Maidenhead \| Prestige Flow<\/title>/u);
  assert.match(html, /<link rel="canonical" href="https:\/\/prestigeflow\.co\.uk\/services\/cms-ci-test\/">/u);
  assert.match(html, /<h1>Drainage advice in Maidenhead<\/h1>/u);
  assert.match(html, /href="\/services\/drainage\/"/u);
  assert.ok(html.includes('href="/assets/styles.css"'), 'New CMS pages use the shared website stylesheet.');
  assert.ok(html.includes('src="/assets/static-site.js"'), 'New CMS pages use the shared website interactions.');
  assert.ok(html.includes('src="/assets/site-config.js"'), 'New CMS pages load the shared site configuration.');
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
  console.log('PASS: Current page inventory, text/image overlays, shared styles/scripts, protected code/pricing, new page generation, SEO metadata and safe copy.');
} finally {
  await fs.rm(source, { force: true });
  execFileSync(process.execPath, ['scripts/build-cms-pages.mjs'], { cwd: root, stdio: 'pipe' });
}
