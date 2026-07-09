const { chromium } = require('playwright');
const URL = 'https://forge.mograph.life/apps/ae/';
(async () => {
  const b = await chromium.launch();
  for (const w of [600]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      window.__cls = 0; window.__shifts = [];
      new PerformanceObserver(l => {
        for (const e of l.getEntries()) {
          if (e.hadRecentInput) continue;
          window.__cls += e.value;
          const src = (e.sources||[]).map(s => { const n=s.node;
            return n&&n.tagName ? n.tagName.toLowerCase()+(n.id?'#'+n.id:'')+(n.className&&n.className.baseVal===undefined?'.'+String(n.className).trim().split(/\s+/).slice(0,2).join('.'):'') : '(text)'; });
          window.__shifts.push({ v:+e.value.toFixed(4), t:Math.round(e.startTime), src });
        }
      }).observe({ type:'layout-shift', buffered:true });
    });
    await page.goto(URL, { waitUntil:'commit' });
    await page.waitForTimeout(150);
    await page.evaluate(() => document.getElementById('builder')?.scrollIntoView({block:'start'}));
    await page.waitForTimeout(2500);
    const d = await page.evaluate(() => ({ cls:+window.__cls.toFixed(4), shifts: window.__shifts.sort((a,b)=>b.v-a.v).slice(0,6) }));
    console.log(`live ${w}px  CLS ${d.cls}`);
    for (const s of d.shifts) console.log(`  ${s.v}  @${s.t}ms  <- ${s.src.join(', ')}`);
    await ctx.close();
  }
  await b.close();
})();
