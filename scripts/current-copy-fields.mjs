const forbiddenCopy = /£\s*\d|\bGBP\s*\d|\b\d+(?:\.\d+)?\s*(?:plus\s+VAT|per\s+(?:hour|hr)|\/(?:hour|hr))|\b\d+%\s+deposit|\b(?:Stripe|checkout|webhook|API)\b/iu;
const protectedFaqCopy = /\b(?:rates?|prices?|pricing|payment|fees?|charges?|costs?|deposit|VAT|card|refund|call[ -]out)\b/iu;

function inLinkedControl($, element) {
  const node = $(element);
  if (node.closest('a, input, select, textarea, details, summary, form').length) return true;
  const button = node.closest('button');
  if (!button.length) return false;
  const faqItem = button.closest('div.border-b');
  const faqSection = button.closest('section').filter((_, section) => /frequently asked questions|questions about/iu.test($(section).find('h2').first().text()));
  return !faqItem.length || !faqSection.length || forbiddenCopy.test(faqItem.text()) || protectedFaqCopy.test(faqItem.text());
}

function nearestFaqItem($, element) {
  const faq = $(element).closest('section').filter((_, section) => {
    const heading = $(section).find('h2').first().text();
    return /frequently asked questions|questions about/iu.test(heading);
  });
  if (!faq.length) return null;
  const question = $(element).closest('div.border-b');
  return question.length ? question : $(element);
}

function isProtectedElement($, element, type, slug, summaryParagraph) {
  if (element === summaryParagraph || inLinkedControl($, element)) return true;
  const node = $(element);
  if (/standard rates|service details\s*&\s*pricing|postcode coverage|clear travel terms/iu.test(node.text())) return true;
  if (type === 'areas') {
    if (node.closest('details, .pf-area-card, [data-area-postcodes]').length) return true;
    // The postcode inventory and its expandable district lists are owner-managed.
    // Their containing markup differs between versions, so use the page's source order.
    let inCoverageInventory = false;
    for (const candidate of $('main h2, main h3, main p, main li, main [data-testid^="text-answer"]').toArray()) {
      if (candidate === element) break;
      if (candidate.tagName === 'h2') {
        const text = $(candidate).text();
        if (/postcode coverage/iu.test(text)) inCoverageInventory = true;
        else if (/need emergency|not sure if we cover/iu.test(text)) inCoverageInventory = false;
      }
    }
    if (inCoverageInventory) return true;
  }

  let lockedSection = false;
  let inRateSection = false;
  for (const candidate of $('main h2, main h3, main p, main li, main [data-testid^="text-answer"]').toArray()) {
    if (candidate === element) break;
    if (candidate.tagName === 'h2') {
      inRateSection = /standard rates|pricing/iu.test($(candidate).text());
      lockedSection = false;
    }
    if (candidate.tagName === 'h2' && /standard rates|pricing/iu.test($(candidate).text())) lockedSection = true;
  }
  if (inRateSection || lockedSection) return true;

  const faqItem = nearestFaqItem($, element);
  if (faqItem && (forbiddenCopy.test(faqItem.text()) || protectedFaqCopy.test(faqItem.text()))) return true;
  if (forbiddenCopy.test(node.text())) return true;
  return false;
}

export function collectCurrentCopyFields($, type, slug) {
  const h1 = $('main h1').first();
  const intro = h1.next('p').get(0);
  let summaryParagraph = null;
  if (type === 'services' && slug !== 'overview') {
    const summaryHeading = $('main h2').filter((_, element) => /service details\s*&\s*pricing/iu.test($(element).text())).first();
    summaryParagraph = summaryHeading.closest('section').find('p').first().get(0) ?? null;
  }

  const selected = [];
  const contextByTag = new Map();
  $('main h2, main h3, main p, main li, main [data-testid^="text-answer"]').each((_, element) => {
    const tag = element.tagName.toLowerCase();
    const kindTag = $(element).is('[data-testid^="text-answer"]') ? 'faq-answer' : tag;
    const text = $(element).text().trim().replace(/\s+/gu, ' ');
    if (!text || element === intro || element === summaryParagraph || isProtectedElement($, element, type, slug, summaryParagraph)) return;
    if (tag === 'h2') contextByTag.set('h3', '');
    if (tag === 'h2' || tag === 'h3') contextByTag.set(tag, text);
    const context = tag === 'h2' ? '' : (contextByTag.get('h3') || contextByTag.get('h2') || 'Page copy');
    const kind = kindTag === 'faq-answer' ? 'FAQ answer' : tag === 'h2' || tag === 'h3' ? 'Heading' : tag === 'li' ? 'List item' : 'Paragraph';
    const label = context ? `${kind} — ${context}: ${text.slice(0, 90)}` : `${kind}: ${text.slice(0, 110)}`;
    const index = kindTag === 'faq-answer'
      ? $('main [data-testid^="text-answer"]').toArray().indexOf(element)
      : $(`main ${tag}`).toArray().indexOf(element);
    selected.push({ key: `${kindTag}:${index}`, label, text });
  });
  return selected;
}

export function applyCurrentCopyFields($, type, slug, fields, file, validate) {
  const targets = collectCurrentCopyFields($, type, slug);
  if (!Array.isArray(fields) || fields.length !== targets.length) {
    throw new Error(`CMS page ${file}: page copy fields no longer match this page template. Re-import the current page fields before editing.`);
  }
  const suppliedKeys = fields.map((field) => String(field?.key ?? ''));
  const targetKeys = targets.map((field) => field.key);
  if (suppliedKeys.some((key, index) => key !== targetKeys[index])) {
    throw new Error(`CMS page ${file}: page copy field mapping was changed. Restore the hidden field keys before building.`);
  }
  fields.forEach((field, index) => {
    const text = validate(field?.text, `Page copy ${fields[index]?.label || index + 1}`, file, { min: 1, max: 3000 });
    const [tag, rawIndex] = field.key.split(':');
    const element = tag === 'faq-answer'
      ? $('main [data-testid^="text-answer"]').eq(Number(rawIndex))
      : $(`main ${tag}`).eq(Number(rawIndex));
    if (!element.length) throw new Error(`CMS page ${file}: page copy target ${field.key} no longer exists.`);
    if (tag === 'faq-answer') {
      const copy = element.find('.leading-relaxed').first();
      (copy.length ? copy : element).text(text);
    } else if (tag === 'h3' && element.find('button').length) {
      const label = element.find('button').first().contents().filter((_, child) => child.type === 'text').first();
      if (!label.length) throw new Error(`CMS page ${file}: FAQ question ${field.key} has no safe text node.`);
      label.replaceWith(text);
    } else {
      element.text(text);
    }
  });
}
