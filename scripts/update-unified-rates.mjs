import fs from 'node:fs/promises';
import path from 'node:path';
import { publicDirectories } from './site-files.mjs';

const root = process.cwd();
const pricingTable = `<section data-pricing-table="" class="container mx-auto px-4 py-12"><h2 class="text-2xl font-bold mb-4">Standard service rates across covered areas</h2><p><span><strong>Weekday daytime:</strong> Monday–Friday, 8am–6pm.</span><span><strong>Weekday evenings:</strong> Monday–Friday, 6pm–8am.</span><span><strong>Weekends:</strong> Saturday and Sunday.</span><span>All times are UK time.</span> These rates apply across our listed service areas; if your area is not listed, contact us to confirm coverage and the applicable price.</p><div style="overflow-x:auto"><table style="width:100%;text-align:left;border-collapse:collapse;min-width:700px"><caption style="text-align:left;padding:12px 0">Prices include 20% VAT; the price before VAT is shown in brackets.</caption><thead><tr><th style="padding:12px">Service</th><th>Weekday daytime</th><th>Weekday evenings</th><th>Weekends</th></tr></thead><tbody><tr><th style="padding:12px;border-top:1px solid #aaa">Drainage, emergency drainage &amp; blocked toilets</th><td>£144.00 (£120 + VAT)/hr</td><td>£168.00 (£140 + VAT)/hr</td><td>£168.00 (£140 + VAT)/hr</td></tr><tr><th style="padding:12px;border-top:1px solid #aaa">Plumbing</th><td>£126.00 (£105 + VAT)/hr</td><td>£138.00 (£115 + VAT)/hr</td><td>£138.00 (£115 + VAT)/hr</td></tr><tr><th style="padding:12px;border-top:1px solid #aaa">CCTV survey</th><td colspan="3">£210 (£175 + VAT), fixed price, Monday to Sunday</td></tr></tbody></table></div><p class="mt-4">Beyond the London M25, a £75 call-out fee covers travel up to 100 miles outside the M25. For distances beyond 100 miles, the call-out fee is adjusted accordingly. Rates may change during bank holidays, Christmas and New Year weeks, and periods of national lockdown or pandemic-related restrictions. Please confirm availability, access, travel and any additional work before the visit. Patch lining, groundworks and planned maintenance are quoted individually.</p><p class="mt-4"><a href="/booking/">Book online</a> · <a href="/quote/">Request a tailored quote</a></p></section>`;
const staleBookingIntro = 'Choose a service and send your preferred visit time. This is a request, not a confirmed appointment, and no payment is taken online. Call 07743 565339 to arrange and confirm your visit.';
const bookingIntro = 'Choose your service and preferred visit time. Secure online booking is being connected to Stripe. Call 07743 565339 to book directly until checkout is ready.';
const bookingCopy = [
  [staleBookingIntro, bookingIntro],
  ['Book Now - 10% Deposit', 'Book Online'],
  ['Book online with a 10% deposit', 'Book online with secure Stripe checkout'],
  ['Book online with secure Stripe checkout', 'Book Online'],
  ['standard rates before any booking offer', 'published standard rates'],
  ['Request your preferred appointment online. If you opt in to card-on-file payments, the 10% first-hour deposit is authorised at booking and captured only after we approve the slot; a declined request releases the hold.', 'Secure online booking is being connected to Stripe. Call 07743 565339 to arrange and confirm a booking until checkout is ready.'],
  ['Pricing is based on the agreed service and time-specific rate. At checkout, you can explicitly opt in to save your card for this booking. If you do, 10% of the first-hour charge is authorised when you book and captured only after we approve your requested slot. If we decline it, the authorisation is released. After the first hour, labour is charged in started 30-minute blocks; parts are separate. With your opt-in, the remaining labour balance is charged when we mark the job complete. Otherwise, we arrange the balance with you manually.', 'Secure online booking is being connected to Stripe. Call 07743 565339 to arrange and confirm a booking until checkout is ready. Labour beyond the first hour is charged in agreed half-hour blocks; parts are separate.'],
  ['For an online booking, At checkout, you can explicitly opt in to save your card for this booking. If you do, 10% of the first-hour charge is authorised when you book and captured only after we approve your requested slot. If we decline it, the authorisation is released. After the first hour, labour is charged in started 30-minute blocks; parts are separate. With your opt-in, the remaining labour balance is charged when we mark the job complete. Otherwise, we arrange the balance with you manually.', 'Secure online booking is being connected to Stripe. Call 07743 565339 to arrange and confirm a booking until checkout is ready. Labour beyond the first hour is charged in agreed half-hour blocks; parts are separate.'],
  ['Standard London drainage rates are £120/hr daytime and £140/hr evenings/weekends, plus VAT. Other regions are £120/hr daytime and £140/hr evenings/weekends, plus VAT. London plumbing is £105/£115 per hour; other regions £105/£115, plus VAT. CCTV surveys are £175 plus VAT (£210 including VAT), fixed price. See the rate table for full details.', 'Drainage is £120 + VAT per hour weekdays 8am–6pm and £140 + VAT per hour weekday evenings and weekends. Plumbing is £105 + VAT per hour weekdays 8am–6pm and £115 + VAT per hour weekday evenings and weekends. CCTV surveys are £175 + VAT (£210 including VAT), fixed price Monday to Sunday. These rates are the same across covered areas; a £75 travel call-out applies beyond the M25 for up to 100 miles outside it.'],
  ['Pricing differs between London and regional areas', 'The same published rates apply across covered areas'],
  ['Prices include 20% VAT, with the price before VAT in brackets.', 'Prices include 20% VAT; the price before VAT is shown in brackets.'],
  ['Rates depend on the service, postcode and time of attendance.', 'Rates depend on service and time of attendance, and are the same across covered areas.'],
  ['Rates may vary during bank holidays. Please contact us for current pricing.', 'Rates may vary during bank holidays, Christmas and New Year weeks, and periods of national lockdown or pandemic-related restrictions. Contact us for current pricing.'],
  ['Our pricing varies based on your specific location within our service areas.', 'Our published rates are the same across covered areas; a £75 travel call-out may apply beyond the M25.'],
  ['Prices vary by area and service.', 'Published service rates are the same across covered areas. A £75 travel call-out may apply beyond the M25.'],
  ['Online booking currently submits an appointment request and does not authorise or capture payment while Stripe checkout is being configured. Once enabled, the planned flow will ask for explicit consent before authorising 10% of the first-hour charge, capture it only after slot approval, release it if declined, and charge the remaining labour at completion in started 30-minute blocks after the first hour. Parts are separate.', 'Secure online booking is being connected to Stripe. Call 07743 565339 to arrange and confirm a booking until checkout is ready.'],
  ['Online booking currently sends an appointment request only; no payment is authorised or taken while Stripe checkout is being configured. We confirm availability and payment arrangements with you separately.', 'Secure online booking is being connected to Stripe. Call 07743 565339 to arrange and confirm a booking until checkout is ready.'],
  ['Online booking currently submits an appointment request and does not authorise or capture payment while Stripe checkout is being configured.', 'Secure online booking is being connected to Stripe. Call 07743 565339 to arrange and confirm a booking until checkout is ready.'],
  ['This sends a booking request only. No payment is taken and your appointment is not confirmed until you call us on 07743 565339 and we agree a time.', 'Secure online booking is being connected to Stripe. Call 07743 565339 to arrange and confirm a booking until checkout is ready.'],
  ['Online booking currently submits an appointment request and does not authorise or capture payment.', 'Secure online booking is being connected to Stripe. Call 07743 565339 to arrange and confirm a booking until checkout is ready.'],
  ['Get in touch for immediate assistance or request your booking online; we’ll confirm availability and arrange the 10% deposit.', 'Get in touch for immediate assistance or call 07743 565339 to arrange a booking. Secure online checkout will be available once Stripe is connected.'],
  ['Request a survey online or call 07743 565339. We confirm availability and arrange the 10% deposit after confirming the appointment; the request itself does not take payment.', 'Call 07743 565339 to book a survey. Secure online checkout will be available once Stripe is connected.'],
  ['Routine planned maintenance is quoted to scope; the 10% first-hour deposit applies to online service bookings, not bespoke maintenance proposals.', 'Routine planned maintenance is quoted to scope. Secure online checkout for standard services will be available once Stripe is connected.'],
  ['Routine PPM work is quoted to scope; the 10% first-hour deposit applies to online service bookings, not bespoke maintenance proposals.', 'Routine PPM work is quoted to scope. Secure online checkout for standard services will be available once Stripe is connected.'],
  ['Plumbing rates vary by service area and UK appointment time: weekday daytime, weekday evening or weekend. Check the published rate table, then call 07743 565339 or request a visit so we can confirm coverage and availability.', 'Plumbing rates vary by UK appointment time and are the same across listed service areas. If your area is not listed, call 07743 565339 to confirm coverage and the applicable rate.'],
  ['Our pricing is transparent and competitive regardless of your postcode.', 'Published rates apply across our listed service areas. Contact us to confirm coverage and the applicable price if your area is not listed.'],
  ['No Hidden Travel Charges', 'Clear Travel Pricing'],
  ['Unlike some companies, we don’t add excessive travel fees for locations outside central London. Published rates apply across our listed service areas. Contact us to confirm coverage and the applicable price if your area is not listed.', 'Beyond the London M25, a £75 call-out covers travel up to 100 miles outside the M25; farther distances are adjusted. We confirm any applicable travel charge before work starts.'],
  ["Unlike some companies, we don't add excessive travel fees for locations outside central London.", 'Beyond the London M25, a £75 call-out covers travel up to 100 miles outside the M25; farther distances are adjusted. We confirm any applicable travel charge before work starts.'],
  ['No Hidden Travel Charges', 'Clear Travel Pricing'],
  ['Clear rates by area and time', 'Published rates by service and time across listed areas'],
  ['£140/hr 24/7', 'From £120/hr + VAT'],
  ['Request a visit online', 'Book online once secure Stripe checkout is connected'],
  ['request a visit so we can confirm coverage and availability', 'call us to confirm coverage and the applicable rate; secure online booking will be available once Stripe checkout is connected'],
  ['Call for urgent drainage help, request a tailored quote, or send a booking request. We confirm availability and the applicable rate before work is agreed.', 'Call for urgent drainage help, request a tailored quote, or book online once secure Stripe checkout is connected. We confirm availability and the applicable rate before work is agreed.'],
  ['To request a visit, use the booking form. No appointment is confirmed until our team agrees a time. You can also call 07743 565339 to book.', 'Secure online booking is being connected to Stripe. No booking is submitted through this page yet. Call 07743 565339 to arrange a booking meanwhile.'],
  ['Request a Booking', 'Book Online'],
  ['Request a booking', 'Book online'],
];

const htmlFiles = [path.join(root, 'index.html')];
async function collect(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await collect(file);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(file);
  }
}
for (const directory of publicDirectories) await collect(path.join(root, directory));
let changed = 0;
let tablesReplaced = 0;
for (const file of htmlFiles) {
  const relative = path.relative(root, file);
  let html = await fs.readFile(file, 'utf8');
  const tableRegex = /<section data-pricing-table=""[^>]*>[\s\S]*?<\/section>/g;
  const tableMatches = [...html.matchAll(tableRegex)];
  if (tableMatches.length) {
    html = html.replace(tableRegex, '__PF_UNIFIED_PRICING_TABLE__');
    tablesReplaced += tableMatches.length;
  }
  for (const [from, to] of bookingCopy) html = html.replaceAll(from, to);
  if (relative === path.join('about', 'index.html')) {
    html = html.replace(/(<span class="text-sm text-muted-foreground">8am-6pm<\/span><span class="font-semibold">)[^<]*/, '$1£120/hr + VAT');
    html = html.replace(/(<span class="text-sm text-muted-foreground">6pm-8am<\/span><span class="font-semibold">)[^<]*/, '$1£140/hr + VAT');
    html = html.replace(/(<span class="text-sm text-muted-foreground">Weekends<\/span><span class="font-semibold">)[^<]*/, '$1£140/hr + VAT');
  }
  if (['services/groundworks/index.html', 'services/patch-lining/index.html', 'services/ppm-maintenance/index.html'].includes(relative.split(path.sep).join('/'))) html = html.replaceAll('From £140/hr + VAT', 'From £120/hr + VAT');
  html = html.replaceAll('__PF_UNIFIED_PRICING_TABLE__', pricingTable);
  if (relative === path.join('booking', 'index.html')) {
    html = html.replace(/(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*(">)/g, '$1Book drainage, plumbing or CCTV in Reading, Maidenhead and London. Stripe checkout is being connected; call 07743 565339 to book meanwhile.$2');
  }
  if (html !== await fs.readFile(file, 'utf8')) {
    await fs.writeFile(file, html, 'utf8');
    changed++;
  }
}

const aiPath = path.join(root, 'ai.txt');
let ai = await fs.readFile(aiPath, 'utf8');
ai = ai.replace(/- Drainage, emergency drainage and blocked toilets:.*\n- London plumbing:.*\n- Other-region plumbing:.*\n- CCTV survey:.*/, [
  '- Drainage, emergency drainage and blocked toilets: £120/hr + VAT, Monday–Friday 8am–6pm; £140/hr + VAT evenings and weekends.',
  '- Plumbing: £105/hr + VAT, Monday–Friday 8am–6pm; £115/hr + VAT evenings and weekends.',
  '- CCTV survey: £175 + VAT fixed price, Monday to Sunday.',
  '- Rates are the same across covered areas. Beyond the M25, a £75 call-out covers up to 100 miles outside the M25; longer journeys are adjusted accordingly.'
].join('\n'));
await fs.writeFile(aiPath, ai, 'utf8');

const llmsPath = path.join(root, 'llms.txt');
let llms = await fs.readFile(llmsPath, 'utf8');
llms = llms.replace(/Scheduled bookings require a 10% deposit\..*?(?=\n|$)/, 'Online checkout is being connected to Stripe. Call 07743 565339 to arrange and confirm a booking until secure checkout is available. Emergency services are available 24/7. See the Services page for current rates and VAT details.');
await fs.writeFile(llmsPath, llms, 'utf8');

console.log(`Updated ${changed} HTML files; replaced ${tablesReplaced} embedded rate tables with the September 2026 unified schedule.`);
