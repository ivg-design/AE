import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 }, deviceScaleFactor: 2 });
await page.goto('http://localhost:8790/', { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(600);
// open a script WITH an expression sim — Linearizer
await page.locator('[data-name="Linearizer"]').first().click();
await page.waitForTimeout(700);

// Inspect detail DOM: section titles, canvas/svg, sliders.
const dom = await page.evaluate(() => {
  const detail = document.querySelector('[class*="detail"],[class*="panel"],main,aside,#detail') || document.body;
  const headings = [...detail.querySelectorAll('h1,h2,h3,h4,[class*="section"]>*:first-child,[class*="title"]')]
    .map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 20);
  return {
    detailSelector: detail.className || detail.id || detail.tagName,
    headings,
    canvases: detail.querySelectorAll('canvas').length,
    svgs: detail.querySelectorAll('svg').length,
    sliders: detail.querySelectorAll('input[type="range"]').length,
    sliderInfo: [...detail.querySelectorAll('input[type="range"]')].map((s) => ({ min: s.min, max: s.max, val: s.value })),
  };
});
console.log(JSON.stringify(dom, null, 1));

// Screenshot the detail region only (right pane).
const detailBox = await page.evaluate(() => {
  const el = document.querySelector('[class*="detail"]') || document.querySelector('main') || document.querySelector('aside');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 2000) };
});
if (detailBox) await page.screenshot({ path: '/tmp/dash-detail.png', clip: detailBox });
else await page.screenshot({ path: '/tmp/dash-detail.png' });

// If there's a slider, drag it and screenshot the curve region to prove live redraw.
const sliders = await page.locator('input[type="range"]').count();
if (sliders > 0) {
  const s = page.locator('input[type="range"]').first();
  await s.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForTimeout(300);
  const canvas = page.locator('canvas,svg').first();
  if (await canvas.count()) await canvas.screenshot({ path: '/tmp/dash-curve.png' });
}
console.log('sliders:', sliders);
await browser.close();
