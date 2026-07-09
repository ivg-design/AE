const { chromium } = require('playwright');
const URL = 'https://forge.mograph.life/apps/ae/';
(async () => {
  const b = await chromium.launch();
  for (const w of [1440, 600]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
        .observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(URL, { waitUntil: 'commit' });
    await page.waitForTimeout(150);
    await page.evaluate(() => document.getElementById('builder')?.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(1500);
    const cls = await page.evaluate(() => +window.__cls.toFixed(4));
    console.log(`live ${w}px (scrolled to #builder):  CLS ${cls}  ${cls > 0.1 ? '❌' : cls > 0.05 ? '⚠️' : '✅ good'}`);
    await ctx.close();
  }
  await b.close();
})();
