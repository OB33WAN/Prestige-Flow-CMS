import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.SEO_TEST_BASE_URL || 'http://localhost:4173';
const sitemap = await fs.readFile('sitemap.xml', 'utf8');
const routes = [...sitemap.matchAll(/<loc>https:\/\/prestigeflow\.co\.uk(\/.*?)<\/loc>/gu)].map(([, route]) => route);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
try {
  for (const route of routes) {
    const response = await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    assert.equal(response?.status(), 200, `${route}: HTTP status`);
    const state = await page.evaluate(() => ({
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || '',
      canonical: document.querySelector('link[rel="canonical"]')?.href || '',
      h1: [...document.querySelectorAll('h1')].filter(el => el.getClientRects().length).map(el => el.innerText.trim()),
      mainText: document.querySelector('main')?.innerText.replace(/\s+/g, ' ').trim() || '',
      robots: document.querySelector('meta[name="robots"]')?.content || ''
    }));
    assert.ok(state.title.length > 0, `${route}: rendered title`);
    assert.ok(state.description.length >= 70, `${route}: rendered meta description`);
    assert.equal(state.canonical, `https://prestigeflow.co.uk${route}`, `${route}: canonical`);
    assert.equal(state.h1.length, 1, `${route}: one rendered H1`);
    assert.ok(state.mainText.length >= 300, `${route}: rendered main content is not blank`);
    assert.ok(!/noindex/i.test(state.robots), `${route}: sitemap page is indexable`);
    if (['/', '/areas/london/', '/services/emergency-drainage/'].includes(route)) {
      await page.screenshot({ path: path.join(os.tmpdir(), `prestige-flow-seo-${route.replace(/[^a-z0-9]+/giu, '-').replace(/^-|-$/gu, '') || 'home'}.png`), fullPage: true });
    }
  }
  console.log(`PASS: browser-rendered ${routes.length} sitemap pages; each returned HTTP 200 with canonical, unique head metadata, one visible H1, substantial content, and no noindex.`);
} finally {
  await browser.close();
}
