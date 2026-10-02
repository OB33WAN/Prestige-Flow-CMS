import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import { load } from 'cheerio';

const root = process.cwd();
const sourceRoot = path.join(root, 'content', 'cms');
const existingRoot = path.join(sourceRoot, 'current');
const outputRoot = path.join(root, '.cms-generated-pages');
const pageTypes = ['services', 'industries', 'areas'];
const siteOrigin = 'https://prestigeflow.co.uk';
const markdown = new MarkdownIt({ html: false, linkify: false, typographer: true });
const escape = (value) => String(value ?? '').replace(/[&<>"']/gu, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const wordCount = (value) => String(value ?? '').trim().split(/\s+/u).filter(Boolean).length;
const fail = (file, message) => { throw new Error(`CMS page ${path.relative(root, file)}: ${message}`); };

function validateContentLinks(body, file) {
  for (const token of markdown.parse(body, {})) {
    if (token.type !== 'inline') continue;
    for (const child of token.children ?? []) {
      if (child.type === 'image') fail(file, 'Add images through the Hero image field, not inside page copy.');
      if (child.type !== 'link_open') continue;
      const href = child.attrGet('href') ?? '';
      if (!/^\/(?!\/)[a-z0-9/_-]*\/?$/iu.test(href)) {
        fail(file, 'Page copy may link only to an internal site path; email, telephone, payment and external links are centrally managed.');
      }
    }
  }
}

async function listMarkdown(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const nested = await Promise.all(entries.map(async (entry) => {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) return listMarkdown(file);
      return entry.isFile() && entry.name.endsWith('.md') ? [file] : [];
    }));
    return nested.flat();
  } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}

function validateString(value, label, file, { min = 1, max = 2000 } = {}) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) fail(file, `${label} must be ${min}–${max} characters.`);
  if (/lorem ipsum|placeholder|coming soon|insert (text|copy)|your (service|business|city) here|test page/iu.test(value)) fail(file, `${label} contains placeholder wording.`);
  return value.trim();
}

function validateExistingCopy(value, label, file, { min = 1, max = 2000 } = {}) {
  const text = validateString(value, label, file, { min, max });
  if (/£\s*\d|\bGBP\s*\d|\b\d+(?:\.\d+)?\s*(?:plus\s+VAT|per\s+(?:hour|hr)|\/(?:hour|hr))|\b\d+%\s+deposit|\b(?:Stripe|checkout|webhook|API)\b/iu.test(text)) {
    fail(file, `${label} contains pricing, payment or technical content controlled by the site owner.`);
  }
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu.test(text)) fail(file, `${label} must not contain an email address.`);
  return text;
}

async function renderPageImage(data, file) {
  const heroImage = String(data.hero_image ?? '').trim();
  const heroAlt = String(data.hero_image_alt ?? '').trim();
  if (!heroImage) {
    if (heroAlt) fail(file, 'Image alt text is set but no image is selected.');
    return '';
  }
  if (!/^\/assets\/cms\/[A-Za-z0-9._/-]+\.(?:png|jpe?g|webp|avif|gif)$/iu.test(heroImage) || heroImage.includes('..')) {
    fail(file, 'Uploaded images must be stored in the CMS media folder.');
  }
  if (!heroAlt || heroAlt.length > 180) fail(file, 'Provide useful image alt text (up to 180 characters).');
  const imagePath = path.join(root, heroImage.replace(/^\//u, ''));
  try { await fs.access(imagePath); } catch { fail(file, `Image does not exist: ${heroImage}`); }
  return `<figure class="cms-editorial-image"><img class="cms-page-hero-image" src="${escape(heroImage)}" alt="${escape(heroAlt)}" width="1200" height="750" loading="eager"></figure>`;
}

function setMeta($, selector, attribute, value) {
  let element = $(selector).first();
  if (!element.length) {
    const match = selector.match(/^meta\[(name|property)="([^"]+)"\]$/u);
    if (!match) throw new Error(`Unsupported metadata selector: ${selector}`);
    element = $('<meta>').attr(match[1], match[2]).appendTo('head');
  }
  element.attr(attribute, value);
}

async function renderExistingPage(type, data, file) {
  const slug = path.basename(file, '.md');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) fail(file, 'Existing page filename must use a safe lowercase slug.');
  const sourceFile = path.join(root, type, slug === 'overview' ? 'index.html' : path.join(slug, 'index.html'));
  let source;
  try { source = await fs.readFile(sourceFile, 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') fail(file, `No existing ${type} page matches /${type}/${slug}/.`); throw error; }
  const $ = load(source);
  if ($('meta[http-equiv="refresh"]').length || /noindex/i.test($('meta[name="robots"]').attr('content') ?? '')) {
    fail(file, 'This page is retired or noindex and cannot be edited as a current page.');
  }
  const title = validateExistingCopy(data.title, 'SEO title', file, { max: 60 });
  const description = validateExistingCopy(data.description, 'Meta description', file, { min: 70, max: 180 });
  const heading = validateExistingCopy(data.heading, 'Page heading', file, { max: 100 });
  const intro = validateExistingCopy(data.intro, 'Introductory copy', file, { min: 40, max: 900 });
  const h1 = $('main h1').first();
  if (!h1.length || !h1.next('p').length) fail(file, 'The existing page template does not have the expected heading and introduction.');

  $('title').first().text(title);
  setMeta($, 'meta[name="description"]', 'content', description);
  setMeta($, 'meta[property="og:title"]', 'content', title);
  setMeta($, 'meta[property="og:description"]', 'content', description);
  setMeta($, 'meta[name="twitter:title"]', 'content', title);
  setMeta($, 'meta[name="twitter:description"]', 'content', description);
  h1.text(heading);
  h1.next('p').text(intro);
  if (type === 'services' && slug !== 'overview') {
    const summary = validateExistingCopy(data.service_summary, 'Service summary', file, { min: 60, max: 1000 });
    const summaryParagraph = $('main h2').first().closest('section').find('p').first();
    if (!summaryParagraph.length) fail(file, 'The service page does not have the expected overview paragraph.');
    summaryParagraph.text(summary);
  } else if (type === 'industries' && slug !== 'overview') {
    if (!Array.isArray(data.sections) || data.sections.length !== 3) fail(file, 'Keep the three existing editorial sections for this industry page.');
    const headings = $('main h2').toArray().slice(0, 3);
    if (headings.length !== 3) fail(file, 'The industry template no longer has its three editable editorial sections.');
    data.sections.forEach((section, index) => {
      const sectionHeading = validateExistingCopy(section?.heading, `Section ${index + 1} heading`, file, { max: 100 });
      const sectionBody = validateExistingCopy(section?.body, `Section ${index + 1} copy`, file, { min: 60, max: 3000 });
      const headingNode = $(headings[index]);
      const paragraph = headingNode.closest('section').find('p').first();
      if (!paragraph.length) fail(file, `Industry section ${index + 1} has no editable copy paragraph.`);
      headingNode.text(sectionHeading);
      paragraph.text(sectionBody);
    });
  }

  const imageHtml = await renderPageImage(data, file);
  if (imageHtml) {
    const introParagraph = h1.next('p');
    if (!introParagraph.length) fail(file, 'The existing page has no introduction element for the image placement.');
    introParagraph.after(imageHtml);
    if (!$('link[rel="stylesheet"][href="/assets/cms-pages.css"]').length) $('head').append('<link rel="stylesheet" href="/assets/cms-pages.css">');
  }

  return { route: slug === 'overview' ? `/${type}/` : `/${type}/${slug}/`, html: $.html() };
}

async function renderPage(type, data, file) {
  const slug = validateString(data.slug, 'URL slug', file, { max: 70 });
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) fail(file, 'URL slug must use lowercase letters, numbers and single hyphens.');
  const title = validateString(data.title, 'SEO title', file, { max: 60 });
  const description = validateString(data.description, 'Meta description', file, { min: 70, max: 160 });
  const heading = validateString(data.heading, 'Page heading', file, { max: 90 });
  const intro = validateString(data.intro, 'Introduction', file, { min: 100, max: 900 });
  if (!Array.isArray(data.sections) || data.sections.length < 3) fail(file, 'Add at least three useful content sections.');
  const sectionHtml = data.sections.map((section, index) => {
    const headingText = validateString(section?.heading, `Section ${index + 1} heading`, file, { max: 100 });
    const body = validateString(section?.body, `Section ${index + 1} content`, file, { min: 100, max: 7000 });
    validateContentLinks(body, file);
    return `<section class="cms-content-section"><h2>${escape(headingText)}</h2>${markdown.render(body)}</section>`;
  }).join('\n');
  const allCopy = [title, description, heading, intro, ...data.sections.map((section) => section.body)].join(' ');
  if (wordCount(allCopy) < 300) fail(file, `Page copy must contain at least 300 words (currently ${wordCount(allCopy)}).`);
  if (/£\s*\d|\bGBP\s*\d|\b\d+(?:\.\d+)?\s*(?:plus\s+VAT|per\s+(?:hour|hr)|\/(?:hour|hr))|\b\d+%\s+deposit|\b(?:prices?|pricing|rates?|fees?|charges?|deposit|VAT|payments?|stripe|checkout|API|webhook)\b/iu.test(allCopy)) {
    fail(file, 'Pricing, payment and API content is centrally managed; remove it from this page.');
  }
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu.test(allCopy)) {
    fail(file, 'Email addresses and email links are centrally managed; remove them from this page.');
  }

  const imageHtml = await renderPageImage(data, file);

  let linksHtml = '';
  if (data.internal_links != null) {
    if (!Array.isArray(data.internal_links)) fail(file, 'Internal links must be a list.');
    const links = data.internal_links.map((link, i) => {
      const label = validateString(link?.label, `Internal link ${i + 1} label`, file, { max: 100 });
      const url = validateString(link?.url, `Internal link ${i + 1} URL`, file, { max: 180 });
      if (!/^\/(?!\/)[a-z0-9/_-]*\/?$/iu.test(url)) fail(file, `Internal link ${i + 1} must be a site-relative path.`);
      return `<li><a href="${escape(url)}">${escape(label)}</a></li>`;
    });
    if (links.length) linksHtml = `<aside class="cms-related"><h2>Related services and information</h2><ul>${links.join('')}</ul></aside>`;
  }

  const route = `/${type}/${slug}/`;
  const canonical = `${siteOrigin}${route}`;
  const typeLabel = ({ services: 'Services', industries: 'Industries', areas: 'Areas' })[type];
  const businessSchema = JSON.stringify(JSON.parse(await fs.readFile(path.join(root, 'local-business-schema.jsonld'), 'utf8'))).replace(/</gu, '\\u003c');
  return { route, html: `<!doctype html>
<html lang="en-GB"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(title)}</title><meta name="description" content="${escape(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <link rel="canonical" href="${canonical}">
  <meta property="og:site_name" content="Prestige Flow LTD"><meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}"><meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}"><meta property="og:image" content="${siteOrigin}/share-image.jpg">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(description)}">
  <link rel="icon" href="/favicon.jpg" type="image/jpeg"><link rel="stylesheet" href="/assets/styles.css"><link rel="stylesheet" href="/assets/static-site.css"><link rel="stylesheet" href="/assets/cms-pages.css">
  <script type="application/ld+json">${businessSchema}</script>
</head><body class="cms-page">
  <a class="cms-skip-link" href="#main-content">Skip to content</a>
  <header class="cms-header"><a class="cms-brand" href="/" aria-label="Prestige Flow home"><img src="/logo.jpg" alt="Prestige Flow" width="54" height="54"><span>Prestige Flow</span></a>
    <nav aria-label="Main navigation"><a href="/services/">Services</a><a href="/industries/">Industries</a><a href="/areas/">Areas</a><a href="/contact/">Contact</a></nav>
    <a class="cms-header-call" href="tel:+447743565339">Call 07743 565339</a>
  </header>
  <main id="main-content" class="cms-main">
    <nav class="cms-breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">›</span><a href="/${type}/">${typeLabel}</a><span aria-hidden="true">›</span><span aria-current="page">${escape(heading)}</span></nav>
    <section class="cms-hero"><div><p class="cms-eyebrow">Prestige Flow · ${typeLabel}</p><h1>${escape(heading)}</h1><p class="cms-intro">${escape(intro)}</p><div class="cms-actions"><a class="cms-button cms-button-primary" href="/booking/">Book online</a><a class="cms-button cms-button-secondary" href="/quote/">Request a quote</a></div><p class="cms-booking-note">We confirm availability before a visit. See our booking page for current rates and payment terms.</p></div>${imageHtml}</section>
    <div class="cms-article">${sectionHtml}${linksHtml}</div>
    <section class="cms-contact"><h2>Need help with ${escape(heading.toLowerCase())}?</h2><p>Speak with Prestige Flow about your site, symptoms or service requirements.</p><a class="cms-button cms-button-primary" href="tel:+447743565339">Call 07743 565339</a></section>
  </main>
  <footer class="cms-footer"><p><strong>Prestige Flow LTD</strong> · Drainage, plumbing and CCTV services across London and the South East.</p><p><a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a> · <a href="/contact/">Contact</a></p></footer>
  <script src="/assets/site-config.js" defer></script><script src="/assets/static-site.js" defer></script>
</body></html>` };
}

async function main() {
  const resolved = path.resolve(outputRoot);
  if (resolved !== path.resolve(root, '.cms-generated-pages')) throw new Error('Refusing to clear unexpected CMS output path.');
  await fs.rm(outputRoot, { recursive: true, force: true });
  const allFiles = (await Promise.all(pageTypes.map((type) => listMarkdown(path.join(sourceRoot, type))))).flat();
  const routes = new Set();
  for (const type of ['services', 'industries', 'areas']) {
    const currentFiles = await listMarkdown(path.join(existingRoot, type));
    for (const file of currentFiles) {
      const page = await renderExistingPage(type, matter(await fs.readFile(file, 'utf8')).data, file);
      if (routes.has(page.route)) fail(file, `Duplicate CMS URL: ${page.route}`);
      routes.add(page.route);
      const slug = path.basename(file, '.md');
      const output = slug === 'overview'
        ? path.join(outputRoot, type, 'index.html')
        : path.join(outputRoot, type, slug, 'index.html');
      await fs.mkdir(path.dirname(output), { recursive: true });
      await fs.writeFile(output, page.html, 'utf8');
    }
  }
  for (const file of allFiles) {
    const relative = path.relative(sourceRoot, file).split(path.sep).join('/');
    const [type] = relative.split('/');
    const { data } = matter(await fs.readFile(file, 'utf8'));
    const page = await renderPage(type, data, file);
    if (routes.has(page.route)) fail(file, `Duplicate CMS URL: ${page.route}`);
    routes.add(page.route);
    const existingSourceRoute = path.join(root, type, data.slug, 'index.html');
    try { await fs.access(existingSourceRoute); fail(file, `This URL already belongs to a hand-built page: ${page.route}`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const output = path.join(outputRoot, type, data.slug, 'index.html');
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, page.html, 'utf8');
  }
  console.log(`Rendered ${routes.size} CMS-managed static pages.`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
