// Real-user worst case: user scrolls to the Build-a-bar section while the page
// data is still loading, then the grid pops in under them. This is the session
// Cloudflare RUM attributes to #builder. Baseline vs. after-fix.
const { chromium } = require('playwright');
const URL = 'http://localhost:8791/index.html';
const WIDTHS = [1440, 600];

(async () => {
  const browser = await chromium.launch();
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.route('**/data/scripts.json', async (route) => {
      await new Promise(r => setTimeout(r, 1200));  // slow data
      route.continue();
    });
    await page.addInitScript(() => {
      window.__cls = 0; window.__shifts = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.hadRecentInput) continue;
          window.__cls += e.value;
          const src = (e.sources || []).map(s => {
            const n = s.node;
            if (!n || !n.tagName) return '(text)';
            return n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') +
              (n.className && n.className.baseVal === undefined
                ? '.' + String(n.className).trim().split(/\s+/).slice(0, 2).join('.') : '');
          });
          window.__shifts.push({ value: +e.value.toFixed(4), sources: src });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(URL, { waitUntil: 'commit' });
    // While data is still loading, scroll the builder into view.
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const b = document.getElementById('builder');
      if (b) b.scrollIntoView({ block: 'start' });
    });
    // Now the delayed data lands and grids populate under the user.
    await page.waitForFunction(() => {
      const g = document.getElementById('builderGrid');
      return g && g.children.length > 0;
    }, { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(700);
    const d = await page.evaluate(() => ({
      cls: +window.__cls.toFixed(4),
      shifts: window.__shifts.sort((a, b) => b.value - a.value).slice(0, 4),
    }));
    console.log(`\n=== viewport ${w}px (scrolled to #builder before 1200ms data load) ===`);
    console.log(`CLS: ${d.cls}  ${d.cls > 0.1 ? '❌ POOR' : d.cls > 0.05 ? '⚠️ needs work' : '✅ good'}`);
    for (const s of d.shifts) console.log(`  ${s.value}  <- ${s.sources.join(', ')}`);
    await ctx.close();
  }
  await browser.close();
})();
