import fs from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { pageFiles } from './site-files.mjs';

const root = process.cwd();
const files = await pageFiles(root);
const logo = '<img class="pf-whatsapp-mark" src="/assets/whatsapp-mark-white.svg" alt="" width="20" height="20" loading="lazy" decoding="async">';
const footerLogo = '<img class="pf-whatsapp-mark pf-whatsapp-mark-footer" src="/assets/whatsapp-mark.svg" alt="" width="20" height="20" loading="lazy" decoding="async">';
let updated = 0;

for (const file of files) {
  const source = await fs.readFile(file, 'utf8');
  let original = source;
  // Normalize older muted-brown/bronze accents to the approved Trident gold.
  original = original
    .replaceAll('#996600', '#d4af37')
    .replaceAll('#b8960c', '#d4af37')
    .replaceAll('#9b7b13', '#d4af37')
    .replaceAll('#128C7E', '#25D366')
    .replaceAll('#075E54', '#20C05D')
    .replaceAll('#128c7e', '#25d366')
    .replaceAll('#075e54', '#20c05d');
  const $ = load(original);

  // Restore the missing homepage hero contact/booking choices and keep their
  // labels short enough to remain visible at narrow viewport widths.
  if (path.relative(root, file) === 'index.html') {
    const hero = $('h1').first().closest('section');
    const heroBackground = hero.find('div.absolute.inset-0').first();
    if (heroBackground.length && !heroBackground.find('[data-pf-hero-particles]').length) {
      heroBackground.append('<canvas class="pf-home-particles" data-pf-hero-particles aria-hidden="true"></canvas>');
    }

    const whatsapp = $('[data-testid="button-whatsapp-hero"]');
    if (whatsapp.length) {
      let row = $('.pf-hero-actions');
      if (!row.length) {
        row = $('<div class="pf-hero-actions" aria-label="Contact and book Prestige Flow"></div>');
        whatsapp.replaceWith(row);
      }
      row.empty().append(
        '<a class="pf-call-button" href="tel:+447743565339" data-testid="button-call-hero">Call 24/7: 07743 565339</a>',
        '<a class="pf-cta-gold" href="/booking/" data-testid="button-book-hero">Book Online</a>',
        '<a class="pf-cta-red" href="/quote/" data-testid="button-quote-hero">Get Free Quote</a>',
        `<a href="https://wa.me/447743565339" target="_blank" rel="noopener noreferrer" data-testid="button-whatsapp-hero" aria-label="Message Prestige Flow on WhatsApp">${logo}<span>WhatsApp</span></a>`
      );
    }

    // Make homepage pricing scannable: weekday evenings and weekends are
    // separate columns even when their rate is the same, and both next steps
    // are styled as clear, keyboard-accessible actions.
    const ratesSection = $('h2').filter((_, heading) =>
      /standard rates\s*[—-]\s*london\s*&\s*south east region/i.test($(heading).text())
    ).first().closest('section');
    const ratesTable = ratesSection.find('table').first();
    if (ratesTable.length) {
      ratesTable.addClass('pf-home-rates-table');
      ratesTable.closest('div').addClass('pf-home-rates-scroll');
      const headers = ratesTable.find('thead th');
      if (headers.length >= 3) {
        headers.eq(1).text('Weekday daytime');
        headers.eq(2).text('Weekday evenings');
        if (headers.length === 3) headers.eq(2).after('<th scope="col">Weekends</th>');
        else headers.eq(3).text('Weekends');
        ratesTable.find('thead th').slice(4).remove();
      }
      ratesTable.find('tbody tr').each((_, row) => {
        const cells = $(row).find('th, td');
        if (cells.length === 3) {
          cells.eq(2).after(`<td>${cells.eq(2).text()}</td>`);
        }
      });
      ratesTable.find('thead th').attr('scope', 'col');
      ratesTable.find('tbody tr th').attr('scope', 'row');
    }
    const rateSchedule = ratesSection.find('h2').first().next('p');
    if (rateSchedule.length) {
      rateSchedule.addClass('pf-rate-schedule').html(
        '<span><strong>Weekday daytime:</strong> Monday–Friday, 8am–6pm.</span>' +
        '<span><strong>Weekday evenings:</strong> Monday–Friday, 6pm–8am.</span>' +
        '<span><strong>Weekends:</strong> Saturday and Sunday.</span>' +
        '<span>All times are UK time. These rates apply across our listed service areas; if your area is not listed, contact us to confirm coverage and the applicable price.</span>'
      );
    }
    const rateActions = ratesSection.find('p').filter((_, paragraph) =>
      $(paragraph).find('a[href="/booking/"], a[href="/quote/"]').length > 0
    ).first();
    if (rateActions.length) {
      rateActions.addClass('pf-rates-actions');
      const bookAction = rateActions.find('a[href="/booking/"]')
        .addClass('pf-rate-book-button')
        .attr({ 'data-testid': 'button-home-rates-book', 'aria-label': 'Book a service online' });
      const quoteAction = rateActions.find('a[href="/quote/"]')
        .addClass('pf-rate-quote-button')
        .attr({ 'data-testid': 'button-home-rates-quote', 'aria-label': 'Request a tailored service quote' });
      rateActions.empty().append(bookAction, quoteAction);
    }
  }

  // The phone action is red site-wide, including the desktop/mobile header
  // and fixed contact control. Do not recolour ordinary inline phone links.
  for (const testId of ['button-header-call', 'button-mobile-header-call', 'button-floating-call', 'emergency-call-hero']) {
    const phone = $(`[data-testid="${testId}"]`);
    if (phone.length) phone.addClass('pf-call-button');
  }

  // Use the WhatsApp mark consistently for every wa.me action on every page.
  $('a[href^="https://wa.me/"]').each((_, element) => {
    const link = $(element);
    const mark = link.is('[data-testid="link-footer-whatsapp"]') ? $(footerLogo) : $(logo);
    const oldMark = link.find('svg, img.pf-whatsapp-mark').first();
    if (oldMark.length) oldMark.replaceWith(mark);
    else if (/whatsapp/i.test(link.text()) || link.is('[data-testid*="whatsapp"]')) link.prepend(mark);
    link.attr('aria-label', link.attr('aria-label') || 'Message Prestige Flow on WhatsApp');
    if (link.attr('target') === '_blank') link.attr('rel', 'noopener noreferrer');
  });

  // Add direct, working service routes to each industry detail page. The
  // cards are deliberately titled only by the service name for quick scanning.
  const relative = path.relative(root, file).split(path.sep).join('/');
  if (relative.startsWith('industries/') && relative !== 'industries/index.html') {
    const main = $('main');
    const hero = main.find('section').first();
    const title = main.find('h1').first();
    const sector = title.text()
      .replace(/^Drainage, Plumbing & CCTV Services for\s+/i, '')
      .replace(/\s+(?:drainage|plumbing|cctv)(?:\s*,?\s*(?:drainage|plumbing|cctv))?\s+services?\s*$/i, '')
      .replace(/\s+drainage\s+services?\s*$/i, '')
      .trim();
    const safeSector = sector || 'commercial and residential';

    // Put all three core services in each industry page's visible opening,
    // headings and search metadata while retaining its sector-specific copy.
    title.text(`Drainage, Plumbing & CCTV Services for ${safeSector}`);
    hero.find('p').first().text(`Drainage, plumbing & CCTV for ${safeSector}`);
    const intro = main.find('h1').first().nextAll('p').first();
    if (intro.length) {
      const serviceSentence = ` Our service covers reactive drainage, plumbing repairs and CCTV drain surveys for ${safeSector.toLowerCase()}; we confirm scope, site access and applicable rates before work begins.`;
      if (!/\bcctv\b/i.test(intro.text()) || !/\bplumbing\b/i.test(intro.text())) {
        intro.text(`${intro.text().trim()}${serviceSentence}`);
      }
    }
    const questions = main.find('section').filter((_, section) => /questions about/i.test($(section).find('h2').first().text())).first();
    if (questions.length) questions.find('h2').first().text(`Questions about drainage, plumbing & CCTV for ${safeSector.toLowerCase()}`);
    main.find('h2').filter((_, heading) => /need drainage or plumbing support\?/i.test($(heading).text())).text('Need drainage, plumbing or CCTV support?');

    const shortSector = ({
      'Co-working & Shared Workspaces': 'Co-working',
      'Commercial Offices': 'Offices',
      'Construction & Fit-out': 'Construction',
      'Facilities Management': 'Facilities',
      'Housing Associations & Property Managers': 'Housing',
      'Industrial & Manufacturing': 'Industrial',
      'Logistics & Warehousing': 'Logistics',
      'Residential Properties': 'Residential'
    })[safeSector] || safeSector;
    const titleValue = `${shortSector}: Drainage, Plumbing & CCTV | Prestige Flow`;
    const titleTag = $('head title');
    if (titleTag.length) titleTag.text(titleValue);
    const metaDescription = $('meta[name="description"]');
    const descriptionValue = `Drainage, plumbing and CCTV surveys for ${safeSector.toLowerCase()} across Reading, Maidenhead, Slough, London and the South East. Call 07743 565339.`;
    if (metaDescription.length) metaDescription.attr('content', descriptionValue);
    $('meta[property="og:title"], meta[name="twitter:title"]').attr('content', titleValue);
    $('meta[property="og:description"], meta[name="twitter:description"]').attr('content', descriptionValue);

    if (!main.find('.pf-industry-services').length) {
      const areaName = safeSector || 'your site';
      const cards = [
        ['Drainage', `Drain unblocking, emergency call-outs and agreed repairs for ${areaName.toLowerCase()} premises.`, '/services/emergency-drainage/'],
        ['Plumbing', `Repairs for leaks, pipework and faulty fixtures at ${areaName.toLowerCase()} premises.`, '/services/plumbing/'],
        ['CCTV surveys', `Camera surveys for ${areaName.toLowerCase()} sites to investigate repeat blockages and check drain condition.`, '/services/cctv-surveys/']
      ];
      const section = $('<section class="pf-industry-services max-w-5xl mx-auto py-10" aria-labelledby="industry-services-title"></section>');
      section.append('<h2 id="industry-services-title" class="font-heading text-2xl md:text-3xl font-bold mb-3">Drainage, Plumbing and CCTV services</h2>');
      section.append(`<p class="text-muted-foreground leading-relaxed mb-6">Explore the services available for ${areaName.toLowerCase()} sites. We confirm scope, postcode coverage and availability before work is agreed.</p>`);
      const grid = $('<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"></div>');
      for (const [title, description, href] of cards) {
        const card = $('<article class="pf-industry-service-card rounded-xl border border-card-border bg-card p-5 flex flex-col"></article>');
        card.append(`<h3 class="font-heading text-lg font-semibold mb-2">${title}</h3>`);
        card.append(`<p class="text-sm text-muted-foreground leading-relaxed mb-5">${description}</p>`);
        card.append(`<a class="mt-auto inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground" href="${href}">Learn more about ${title}</a>`);
        grid.append(card);
      }
      section.append(grid);
      if (questions.length) questions.before(section);
      else main.find('section').last().before(section);
    }
  }

  if (relative === 'industries/index.html') {
    const main = $('main');
    main.find('h1').first().text('Drainage, Plumbing & CCTV Services by Industry');
    const heroCopy = main.find('h1').first().nextAll('p').first();
    if (heroCopy.length) heroCopy.text('From homes and offices to hospitals, retail and restaurants, Prestige Flow provides reactive drainage, plumbing repairs and CCTV drain surveys tailored to each sector across Reading, Maidenhead, Slough, London and the South East.');
    const titleValue = 'Drainage, Plumbing & CCTV by Industry | Prestige Flow';
    const titleTag = $('head title');
    if (titleTag.length) titleTag.text(titleValue);
    const metaDescription = $('meta[name="description"]');
    const descriptionValue = 'Explore drainage, plumbing and CCTV drain survey support for residential, commercial and public-sector properties across Reading, Maidenhead, Slough, London and the South East.';
    if (metaDescription.length) metaDescription.attr('content', descriptionValue);
    $('meta[property="og:title"], meta[name="twitter:title"]').attr('content', titleValue);
    $('meta[property="og:description"], meta[name="twitter:description"]').attr('content', descriptionValue);
  }

  if (['contact/index.html', 'quote/index.html'].includes(relative) && ! $('[data-testid="published-rates-summary"]').length) {
    const rates = $('<section class="container mx-auto max-w-5xl px-4 py-10" data-testid="published-rates-summary" aria-labelledby="published-rates-title"></section>');
    rates.append('<h2 id="published-rates-title" class="font-heading text-2xl md:text-3xl font-bold mb-3">Clear service rates</h2>');
    rates.append('<p class="text-muted-foreground leading-relaxed mb-6">The same rates apply across our listed service areas. Prices below are per hour before VAT unless marked as fixed. We confirm the applicable time rate and any travel charge before work starts.</p>');
    const cards = $('<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"></div>');
    cards.append('<article class="rounded-xl border border-card-border bg-card p-5"><h3 class="font-heading text-lg font-semibold mb-2">Drainage</h3><p class="text-sm text-muted-foreground">Weekdays 8am–6pm: <strong>£120 + VAT/hr</strong><br>Weekday evenings 6pm–8am and weekends: <strong>£140 + VAT/hr</strong></p></article>');
    cards.append('<article class="rounded-xl border border-card-border bg-card p-5"><h3 class="font-heading text-lg font-semibold mb-2">Plumbing</h3><p class="text-sm text-muted-foreground">Weekdays 8am–6pm: <strong>£105 + VAT/hr</strong><br>Weekday evenings 6pm–8am and weekends: <strong>£115 + VAT/hr</strong></p></article>');
    cards.append('<article class="rounded-xl border border-card-border bg-card p-5"><h3 class="font-heading text-lg font-semibold mb-2">CCTV drain survey</h3><p class="text-sm text-muted-foreground"><strong>£175 + VAT</strong>, fixed price, Monday to Sunday.</p></article>');
    rates.append(cards);
    rates.append('<p class="mt-5 text-sm text-muted-foreground">Beyond the London M25, a £75 call-out covers up to 100 miles outside the M25; longer journeys are adjusted by distance. Rates may change on bank holidays, during Christmas and New Year weeks, or during national lockdown or pandemic restrictions. Parts and separately agreed work are additional.</p>');
    const formSection = $('main form').first().closest('section');
    if (formSection.length) formSection.before(rates);
    else $('main > div > section').first().after(rates);
  }
  if (['contact/index.html', 'quote/index.html'].includes(relative)) {
    const publishedRates = $('[data-testid="published-rates-summary"]');
    const rateCards = publishedRates.find('article');
    if (rateCards.length >= 3) {
      rateCards.eq(0).find('p').first().html('Weekdays 8am–6pm: <strong>£120 + VAT/hr</strong><br>Weekday evenings 6pm–8am: <strong>£140 + VAT/hr</strong><br>Weekends (Saturday and Sunday): <strong>£140 + VAT/hr</strong>');
      rateCards.eq(1).find('p').first().html('Weekdays 8am–6pm: <strong>£105 + VAT/hr</strong><br>Weekday evenings 6pm–8am: <strong>£115 + VAT/hr</strong><br>Weekends (Saturday and Sunday): <strong>£115 + VAT/hr</strong>');
      rateCards.eq(2).find('p').first().html('<strong>£175 + VAT</strong>, fixed price, Monday to Sunday.');
    }
  }

  // Let CTA rows wrap rather than clipping at card and mobile widths.
  $('main .flex.flex-wrap').each((_, element) => {
    const row = $(element);
    const linkedActions = row.children('a').filter((__, anchor) => /^(tel:|\/booking\/|\/quote\/|\/contact\/|\/services\/)/.test($(anchor).attr('href') || ''));
    if (linkedActions.length > 1) row.addClass('pf-button-row');
  });

  const output = $.html();
  if (output !== source) {
    await fs.writeFile(file, output, 'utf8');
    updated++;
  }
}

// Keep the text pricing reference aligned with the latest rates explicitly
// confirmed by the customer: £120/£140 drainage and £105/£115 plumbing.
const ratesPath = path.join(root, 'Rates.txt');
const rateSection = `Drainage Service\nMon-Fri 8am-6pm: £120/hour + VAT\nMon-Fri 6pm-8am: £140/hour + VAT\nWeekends (Sat & Sun): £140/hour + VAT\n\nEmergency Drainage\nMon-Fri 8am-6pm: £120/hour + VAT\nMon-Fri 6pm-8am: £140/hour + VAT\nWeekends (Sat & Sun): £140/hour + VAT\n\nPlumbing Service\nMon-Fri 8am-6pm: £105/hour + VAT\nMon-Fri 6pm-8am: £115/hour + VAT\nWeekends (Sat & Sun): £115/hour + VAT\n\nCCTV Surveys\nFixed price: £175 + VAT\n\nBlocked Toilet\nMon-Fri 8am-6pm: £120/hour + VAT\nMon-Fri 6pm-8am: £140/hour + VAT\nWeekends (Sat & Sun): £140/hour + VAT`;
await fs.writeFile(ratesPath, `LONDON & SOUTH EAST REGION\n\n${rateSection}\n--------------------------------------------------------\nALL COVERED AREAS\n\n${rateSection}\n`, 'utf8');

console.log(`Updated ${updated} static pages with restored contact CTAs, WhatsApp branding and industry-service links.`);
