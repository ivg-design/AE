// Measure #builderGrid rendered height + cumulative layout shift at each breakpoint.
const { chromium } = require('playwright');

const URL = 'http://localhost:8791/index.html';
const WIDTHS = [1440, 900, 600]; // desktop(12col), <=1080(8col), <=760(5col)

(async () => {
  const browser = await chromium.launch();
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    // Install a layout-shift observer BEFORE anything loads.
    await page.addInitScript(() => {
      window.__cls = 0;
      window.__shifts = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.hadRecentInput) continue;
          window.__cls += e.value;
          const src = (e.sources || []).map(s => {
            const n = s.node;
            if (!n || !n.tagName) return '(detached)';
            return n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') +
                   (n.className && n.className.baseVal === undefined
                     ? '.' + String(n.className).trim().split(/\s+/).join('.') : '');
          });
          window.__shifts.push({ value: +e.value.toFixed(4), sources: src });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(URL, { waitUntil: 'load' });
    // wait until the builder grid is populated
    await page.waitForFunction(() => {
      const g = document.getElementById('builderGrid');
      return g && g.children.length > 0;
    }, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(900); // let shifts settle
    const data = await page.evaluate(() => {
      const g = document.getElementById('builderGrid');
      return {
        gridHeight: g ? Math.round(g.getBoundingClientRect().height) : null,
        rows: g ? g.children.length : null,
        cls: +window.__cls.toFixed(4),
        shifts: window.__shifts
          .sort((a, b) => b.value - a.value)
          .slice(0, 4),
      };
    });
    console.log(`\n=== viewport ${w}px ===`);
    console.log(`#builderGrid height: ${data.gridHeight}px  (rows: ${data.rows})`);
    console.log(`CLS: ${data.cls}`);
    console.log('top shift sources:');
    for (const s of data.shifts) console.log(`  ${s.value}  <- ${s.sources.join(', ') || '(none)'}`);
    await ctx.close();
  }
  await browser.close();
})();
