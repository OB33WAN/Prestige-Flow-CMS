import fs from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { pageFiles } from './site-files.mjs';

const origin = 'https://prestigeflow.co.uk';
const londonZones = ['central-london', 'east-london', 'north-london', 'northwest-london', 'southeast-london', 'southwest-london', 'west-london'];
const metadata = {
  '/': {
    title: 'Emergency Drainage & CCTV | Reading, Maidenhead & London',
    description: '24/7 emergency drainage, CCTV surveys & commercial maintenance in Reading, Maidenhead & London. Clear rates; 4-hour SLA for eligible postcodes; 50+ years’ team experience.'
  },
  '/services/emergency-drainage': {
    title: '24/7 Emergency Drainage | Reading, Maidenhead & London',
    description: 'Call 24/7 for emergency reactive drainage in Reading, Maidenhead or London. 4-hour SLA for eligible postcodes; coverage, attendance and rates confirmed before dispatch.'
  }
};

function applySearchMetadata($, route) {
  const values = metadata[route];
  if (!values) return;
  $('title').text(values.title);
  $('meta[name="title"]').attr('content', values.title);
  $('meta[name="description"]').attr('content', values.description);
  $('meta[property="og:title"], meta[name="twitter:title"]').attr('content', values.title);
  $('meta[property="og:description"], meta[name="twitter:description"]').attr('content', values.description);
  $('script[type="application/ld+json"]').each((_, script) => {
    try {
      const schema = JSON.parse($(script).text());
      for (const entity of (schema['@graph'] || [schema])) {
        if (entity['@type'] === 'WebPage') {
          entity.name = values.title;
          entity.description = values.description;
        }
      }
      $(script).text(JSON.stringify(schema));
    } catch {
      // Leave non-JSON scripts untouched; the site checker validates schema separately.
    }
  });
}

// Preserve the existing brand shell while replacing thin borough templates with
// one useful, honest London coverage page. No unverified local-office/SLA claims.
const londonPath = 'areas/london/index.html';
await fs.mkdir(path.dirname(londonPath), { recursive: true });
const source = load(await fs.readFile('areas/reading/index.html', 'utf8'));
source('title').text('London Drainage & CCTV Services | Prestige Flow');
source('meta[name="description"]').attr('content', 'Emergency drainage, CCTV drain surveys, plumbing and commercial maintenance across London. Confirm postcode coverage, availability and time-based rates before booking.');
source('link[rel="canonical"]').attr('href', `${origin}/areas/london/`);
source('meta[name="robots"]').remove();
source('meta[http-equiv="refresh"]').remove();
source('main').html(`<div class="min-h-screen" data-testid="page-location-london">
  <section class="py-20 md:py-28 bg-gradient-to-b from-primary/10 to-background"><div class="container mx-auto px-6 md:px-8 max-w-6xl">
    <p class="text-sm font-semibold uppercase tracking-wide text-primary">London service coverage</p>
    <h1 class="text-4xl md:text-5xl font-bold mt-4">Drainage &amp; Plumbing Services Across London</h1>
    <p class="text-lg mt-6 max-w-3xl">Prestige Flow provides emergency reactive drainage, CCTV drain surveys, plumbing repairs and planned commercial maintenance across Greater London. Coverage includes Central London, East London, North London, Northwest London, South East London, South West London and West London; we confirm service availability for your postcode and the applicable rate before work is agreed.</p>
    <div class="flex flex-wrap gap-4 mt-8"><a class="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground" href="tel:+447743565339">Call 07743 565339</a><a class="inline-flex items-center justify-center rounded-md border px-6 py-3 font-semibold" href="/booking/">Request a booking</a><a class="inline-flex items-center justify-center rounded-md border px-6 py-3 font-semibold" href="/quote/">Request a quote</a></div>
  </div></section>
  <section class="py-14"><div class="container mx-auto px-6 md:px-8 max-w-6xl"><h2 class="text-3xl font-bold">London services</h2><div class="grid md:grid-cols-2 gap-6 mt-8">
    <article class="rounded-xl border p-6"><h3 class="text-xl font-semibold">Emergency reactive drainage</h3><p class="mt-3">For blocked drains, overflowing systems and urgent faults. Call to check postcode coverage and the current response estimate; arrival times depend on location, access and availability.</p><a class="inline-block mt-4 underline" href="/services/emergency-drainage/">Emergency drainage service</a></article>
    <article class="rounded-xl border p-6"><h3 class="text-xl font-semibold">CCTV drain surveys</h3><p class="mt-3">Camera inspections help identify blockages, damage and the condition of pipework, with findings to support repair planning.</p><a class="inline-block mt-4 underline" href="/services/cctv-surveys/">CCTV drain surveys</a></article>
    <article class="rounded-xl border p-6"><h3 class="text-xl font-semibold">Plumbing and drainage repairs</h3><p class="mt-3">Reactive repairs for homes, landlords and commercial properties, including drainage faults, leaks and plumbing issues.</p><a class="inline-block mt-4 underline" href="/services/">Explore all services</a></article>
    <article class="rounded-xl border p-6"><h3 class="text-xl font-semibold">Commercial maintenance</h3><p class="mt-3">Planned drainage maintenance and tailored proposals for facilities teams, property managers and businesses.</p><a class="inline-block mt-4 underline" href="/services/ppm-maintenance/">Commercial maintenance</a></article>
  </div></div></section>
  <section class="py-14 bg-muted/30"><div class="container mx-auto px-6 md:px-8 max-w-6xl"><h2 class="text-3xl font-bold">Rates and booking</h2><p class="mt-4 max-w-4xl">Rates depend on service and time of attendance, and are the same across covered areas. Published standard rates are £120 + VAT per hour for drainage on weekdays 8am–6pm and £140 + VAT per hour at evenings, weekends and overnight. Plumbing is £105 + VAT per hour weekdays 8am–6pm and £115 + VAT at evenings, weekends and overnight. CCTV surveys are £175 + VAT fixed price. We confirm any travel charge and the total applicable rate before work starts.</p><p class="mt-4 max-w-4xl">The four-hour response service applies only to eligible Reading and Maidenhead postcodes; it is not a London arrival guarantee. Secure online booking is being connected to Stripe. Call 07743 565339 to arrange and confirm a booking until checkout is ready.</p><div class="flex flex-wrap gap-4 mt-8"><a class="underline" href="/areas/">See all service areas</a><a class="underline" href="/terms/">Booking and payment terms</a><a class="underline" href="/contact/">Contact Prestige Flow</a></div></div></section>
</div>`);
await fs.writeFile(londonPath, source.html());

// Remove legacy London borough doorway pages from the index and consolidate
// their equity into a single London page (keeping London coverage visible).
for (const zone of londonZones) {
  const file = `areas/${zone}/index.html`;
  await fs.writeFile(file, `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page moved | Prestige Flow</title><meta name="robots" content="noindex, follow"><link rel="canonical" href="${origin}/areas/london/"><meta http-equiv="refresh" content="0; url=/areas/london/"></head><body><p>This London service coverage page has moved. <a href="/areas/london/">View drainage and plumbing services across London</a>.</p></body></html>\n`);
}

// Ensure search-facing metadata remains location-relevant without obsolete
// geo meta tags (Google does not use these to determine local relevance).
for (const file of await pageFiles()) {
  const $ = load(await fs.readFile(file, 'utf8'));
  $('meta[name="geo.region"], meta[name="geo.placename"]').remove();
  const route = '/' + path.relative(process.cwd(), file).split(path.sep).join('/').replace(/(?:^|\/)index\.html$/u, '');
  const oldDestination = $('link[rel="canonical"]').attr('href') || '';
  const refresh = $('meta[http-equiv="refresh"]').attr('content') || '';
  if ($('meta[http-equiv="refresh"]').length && route.startsWith('/areas/')) {
    const areaSlug = route.split('/').filter(Boolean)[1] || '';
    const directTarget = londonZones.includes(areaSlug) ? '/areas/london/' : ['reading', 'maidenhead', 'slough'].includes(areaSlug) ? null : '/areas/';
    if (directTarget) {
      $('link[rel="canonical"]').attr('href', `${origin}${directTarget}`);
      $('meta[http-equiv="refresh"]').attr('content', `0; url=${directTarget}`);
      $('a[href^="/areas/"]').attr('href', directTarget).text(directTarget === '/areas/london/' ? 'View drainage and plumbing services across London' : 'View all service areas');
    }
  }
  if (route === '/areas/london') {
    $('title').text('London Drainage & CCTV Services | Prestige Flow');
    $('meta[name="description"]').attr('content', 'Emergency drainage, CCTV drain surveys, plumbing and commercial maintenance across London. Confirm postcode coverage, availability and time-based rates before booking.');
  }
  applySearchMetadata($, route);
  const html = $.html().replaceAll('10% Deposit - Book Online', 'Request a Booking').replaceAll('Book Online - 10% Deposit', 'Request a Booking');
  await fs.writeFile(file, html);
}

const replaceParagraph = async (file, oldText, newText) => {
  const $ = load(await fs.readFile(file, 'utf8'));
  const p = $('p').filter((_, el) => $(el).text().replace(/\s+/gu, ' ').trim() === oldText);
  if (p.length) p.first().text(newText);
  await fs.writeFile(file, $.html());
};
const bookingPolicy = 'Online booking currently submits an appointment request and does not authorise or capture payment while Stripe checkout is being configured. Once enabled, the planned flow will ask for explicit consent before authorising 10% of the first-hour charge, capture it only after slot approval, release it if declined, and charge the remaining labour at completion in started 30-minute blocks after the first hour. Parts are separate.';
for (const file of await pageFiles()) {
  const $ = load(await fs.readFile(file, 'utf8'));
  $('*').filter((_, el) => $(el).children().length === 0).each((_, el) => {
    const label = $(el).text().replace(/\s+/gu, ' ').trim();
    if (/10%\s*deposit\s*-\s*book\s*online|book\s*online\s*-\s*10%\s*deposit/i.test(label)) $(el).text('Request a Booking');
    else if (/book online with a 10% deposit/i.test(label)) $(el).text('Request a Booking');
  });
  $('p').each((_, el) => {
    const text = $(el).text().replace(/\s+/gu, ' ').trim();
    if (/online booking requests do not take payment.*arrange the 10% deposit|confirm availability(?: first)?(?: before| and then) arrang(?:e|ing) the 10% deposit|confirm availability and arrange the deposit/i.test(text)) $(el).text('Online booking currently sends an appointment request only; no payment is authorised or taken while Stripe checkout is being configured. We confirm availability and payment arrangements with you separately.');
  });
  $('[data-testid^="button-faq-"]').each((_, button) => {
    const question = $(button).text().replace(/\s+/gu, ' ').trim();
    const answerId = $(button).attr('aria-controls');
    if (!/payment methods/i.test(question) || !answerId) return;
    const answer = $('[id]').filter((_, el) => $(el).attr('id') === answerId);
    if (answer.length) answer.text(bookingPolicy);
  });
  await fs.writeFile(file, $.html());
}
await replaceParagraph('index.html', 'Request your appointment online; we’ll confirm availability and arrange the 10% deposit.', 'Request your preferred appointment online. Booking currently sends an appointment request only; no payment is authorised or taken while Stripe checkout is being configured.');
await replaceParagraph('about/index.html', 'Pricing is based on site scope and agreed in a written proposal. Online service bookings take a deposit of 10% of the first hour; the balance is due on site.', `Pricing is based on the agreed service and time-specific rate. ${bookingPolicy}`);
await replaceParagraph('booking/index.html', 'Request your appointment online; we’ll confirm availability and arrange the 10% deposit.', `Choose a service and request your preferred slot. ${bookingPolicy}`);
for (const file of ['services/drainage/index.html', 'services/plumbing/index.html', 'services/cctv-surveys/index.html']) {
  const $ = load(await fs.readFile(file, 'utf8'));
  $('p').each((_, el) => {
    const text = $(el).text().replace(/\s+/gu, ' ').trim();
    if (/confirm availability before arranging the 10% deposit|no payment is taken when you submit the request|deposit arranged after confirmation|10% deposit is authorised|deposit is charged/i.test(text)) $(el).text(`For an online booking, ${bookingPolicy}`);
  });
  $('[data-testid^="button-faq-"]').each((_, button) => {
    const question = $(button).text().replace(/\s+/gu, ' ').trim();
    const answerId = $(button).attr('aria-controls');
    if (!answerId) return;
    const answer = $('[id]').filter((_, el) => $(el).attr('id') === answerId);
    if (/payment methods|deposit|required for ppm/i.test(question) && answer.length) answer.text(bookingPolicy);
  });
  await fs.writeFile(file, $.html());
}
{
  const file = 'services/ppm-maintenance/index.html';
  const $ = load(await fs.readFile(file, 'utf8'));
  $('li, p').each((_, el) => {
    if (/Remaining 50% payment on completion/i.test($(el).text())) $(el).text('Final payment terms are confirmed in the written proposal');
  });
  await fs.writeFile(file, $.html());
}
{
  const file = 'terms/index.html';
  const $ = load(await fs.readFile(file, 'utf8'));
  $('p').each((_, el) => {
    if (/payment is made through secure Stripe checkout links/i.test($(el).text())) $(el).text('Online booking currently submits a request and does not take or authorise payment while Stripe checkout is being configured. Payment arrangements are confirmed with you before work. Once online checkout is enabled, the booking flow will request explicit consent before taking a 10% first-hour deposit; it will be captured only when the requested slot is approved, released if the request is declined, and any opted-in remaining labour balance will be charged at job completion. Parts are charged separately.');
  });
  await fs.writeFile(file, $.html());
}

// Map London keyword targets to the consolidated canonical London landing page.
const keywords = await fs.readFile('data/seo-keywords.csv', 'utf8');
await fs.writeFile('data/seo-keywords.csv', keywords.replace(/https:\/\/prestigeflow\.co\.uk\/areas\/(?:central|east|north|northwest|southeast|southwest|west)-london\//gu, `${origin}/areas/london/`));

console.log(`SEO second pass content updates complete; consolidated ${londonZones.length} London zone URLs into /areas/london/.`);
