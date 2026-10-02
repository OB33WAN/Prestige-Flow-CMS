import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.addInitScript(() => {
    if (!localStorage.getItem('pf_cookie_consent')) localStorage.setItem('pf_cookie_consent', 'accepted');
  });
  await page.route('https://www.googletagmanager.com/gtm.js*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: ''
  }));
  await page.goto('http://localhost:4173/contact/');
  await page.locator('a[href^="tel:"]').first().evaluate((link) => link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
  await page.locator('a[href^="mailto:"]').first().evaluate((link) => link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));

  const consentedEvents = await page.evaluate(() => window.dataLayer.filter((item) => item.event));
  assert.ok(consentedEvents.some((item) => item.event === 'phone_call_click'));
  assert.ok(consentedEvents.some((item) => item.event === 'email_click'));

  await page.evaluate(() => localStorage.setItem('pf_cookie_consent', 'rejected'));
  await page.reload();
  await page.locator('a[href^="tel:"]').first().evaluate((link) => link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
  const rejectedEvents = await page.evaluate(() => window.dataLayer || []);
  assert.ok(!rejectedEvents.some((item) => item.event === 'phone_call_click'), 'Phone-click analytics must not fire after consent is rejected.');

  console.log('PASS: phone and email click events fire after consent; rejected consent suppresses analytics.');
} finally {
  await browser.close();
}
