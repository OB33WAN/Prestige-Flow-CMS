# Prestige Flow SEO audit — second pass

**Checked:** 1 October 2026  
**Scope:** SEO Checks.pdf, SEO requirements from chat, Google Search Central guidance, the local build, the test domain, and the current production domain.

## Result

**Local build: PASS for the checks listed below. Production/release: NOT PASS.** The CRM-free website archive has not been deployed. The production domain still serves the old GitHub build; the staging domain has the newer site, but it still points to the CRM test API and is noindex.

## Local build — PASS

- The public sitemap contains 30 canonical, indexable pages. Every page has a unique title and meta description, one H1, a canonical URL, server-rendered main content, and matching Open Graph/Twitter metadata.
- The robots file declares the production sitemap and keeps administration endpoints out of crawling. The CRM app shell has a `noindex, nofollow` directive.
- 358 legacy route documents now redirect to canonical pages through the deployment redirect configuration; the configuration covers 1,074 URL forms (slash, slashless, and `index.html`). Redirect destinations are direct sitemap destinations.
- Seven near-duplicate London zone pages are consolidated into `/areas/london/`. The new page retains London and its zone terms, gives service/rate/coverage details, and distinguishes the four-hour SLA for eligible Reading and Maidenhead postcodes from London arrival estimates. Other retired town pages lead to the general service-area page or the existing Reading, Maidenhead, and Slough pages.
- The homepage keeps Reading, Maidenhead, and London, and targets emergency reactive drainage, CCTV surveys, and commercial maintenance. It includes the requested four-hour eligible-postcode SLA, transparent pricing, and 50+ combined-years message. The emergency landing page includes call and booking actions.
- The quote page now explains the details needed to scope a request and states that a quote request is not a confirmed booking. The static booking copy now states that no online payment is taken and directs customers to call to confirm a visit.
- Business, service, breadcrumbs, visible FAQ, and article structured data parse and agree with page content. Article author/date markup matches visible bylines/dates. No fabricated ratings/review schema or invented business coordinates are emitted.
- Product/Offer markup is intentionally absent: hourly prices vary by area and appointment time, and applying one fixed price offer would misstate what customers pay. FAQ markup matches visible page answers, but Google currently limits FAQ rich-result display to well-known authoritative government and health sites, so no FAQ search enhancement is promised.
- The local price data and booking path passed 24 service/region/time combinations, mocked CRM API rate propagation, required-field and back-navigation checks, VAT totals, mobile-width checks, and the explicit “no payment taken” state while Stripe checkout is not connected.
- Consent-aware phone/email analytics tests pass; no personal data is placed in the tested lead event.
- The CRM entry document is noindex so private management pages do not compete in public search.

## Current deployed domains — FAIL / stale

- `https://prestigeflow.co.uk/` still serves the older build. Its title lacks the requested target areas. Its homepage describes a 10% online discount, drainage at £160/hour as a 24/7 rate, a 60–90 minute response aim, and 15+ years’ experience. These conflict with the current intended deposit model, time-specific rates, four-hour eligible-postcode SLA, and 50+ combined team years.
- The production sitemap currently lists 387 URLs. It still includes the many town/service area URLs and the London zone pages that the local build consolidates. Sampled pages include 45–60 minute or 60–90 minute arrival promises and should be reviewed/redirected as part of the staged release.
- `https://test.prestigeflow.co.uk/` now serves 30 sitemap routes; a browser check returned HTTP 200 with canonical, unique metadata, one visible H1 and substantive rendered content for all 30. `/areas/london/` returns HTTP 200. This is the `web` service with `crm-test.prestigeflow.co.uk` in its public config, not the CRM-free `old-web` archive. The staging host is intentionally `noindex` and must stay out of production search.
- The production sitemap and robots endpoints are reachable, but this audit did not log into Search Console or verify which URLs Google has indexed. A sitemap being reachable is not proof that Google has submitted, crawled, or indexed its contents.

## Remaining checks that require account access or a deployed build

- **Search Console:** verify the production property, submit the new sitemap, inspect representative canonical URLs, and review Page Indexing, Crawl Stats, and Core Web Vitals after deployment.
- **Analytics:** check GA4 Realtime/DebugView and the Search Console–GA4 link on the actual deployed domain. The local consent/event code tests are not a live analytics verification.
- **Performance:** collect mobile Lighthouse/PageSpeed lab results and real-user field data. Google’s “good” Core Web Vitals targets are LCP ≤2.5s, INP ≤200ms, and CLS ≤0.1 at the 75th percentile. No field-data PASS is claimed here.
- **Local/off-page:** confirm Google Business Profile name, address visibility, phone, hours, categories and service area with the account owner; audit real review compliance, citations, referring domains, local links, and competitor visibility. Those external assets cannot be verified from this repository.
- **Business claims:** confirm the 4-hour SLA boundary, 50+ combined-years wording, service coverage, displayed rates and response wording with Prestige Flow before deployment. Replace evidence-sensitive claims only with verified company records.
- **Structured data:** run Google’s Rich Results Test and URL Inspection against the deployed pages after they become publicly available. Structured data can help Google understand pages but does not guarantee a rich result.
- **VPS release:** EasyPanel `old-web` is still at its Source upload screen. The separate archive is ready, but it has not been uploaded, built, assigned the apex domain, or issued an EasyPanel certificate. Do not change Cloudflare apex records until the deployed copy passes staging checks.

## Validation run

- `npm run check` — PASS (metadata, canonical/sitemap coverage, redirects, structured data/content parity, key homepage/emergency/London SEO requirements, and internal routes).
- `npm run test:seo:browser` — PASS (30 sitemap pages rendered HTTP 200 with metadata, canonical, one visible H1 and substantial content).
- `npm run test:booking` — PASS (24 service/area/time scenarios and live CRM price propagation; checkout remains disabled pending Stripe connection details).
- `npm run test:analytics` — PASS (consent-gated events).

## Google guidance used

- [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Search Essentials](https://developers.google.com/search/docs/essentials)
- [Spam policies — doorway abuse](https://developers.google.com/search/docs/essentials/spam-policies)
- [Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Local Business structured data](https://developers.google.com/search/docs/appearance/structured-data/local-business)
- [Structured data general guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)
- [FAQ rich-result changes](https://developers.google.com/search/blog/2023/08/howto-faq-changes)
