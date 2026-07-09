// Reproduce the LIVE condition: app.js downloads late (not the data). First
// paint has empty grids; app.js runs at ~800ms and populates -> shift.
const { chromium } = require('playwright');
const URL = 'http://localhost:8791/index.html';
module.exports = async (label) => {
  const b = await chromium.launch();
  for (const w of [1440, 600]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.route('**/js/app.js*', async (r) => { await new Promise(x=>setTimeout(x,800)); r.continue(); });
    await page.addInitScript(() => {
      window.__cls = 0; window.__shifts = [];
      new PerformanceObserver(l => { for (const e of l.getEntries()) { if (e.hadRecentInput) continue; window.__cls += e.value;
        window.__shifts.push({ v:+e.value.toFixed(4), src:(e.sources||[]).map(s=>{const n=s.node; return n&&n.tagName?n.tagName.toLowerCase()+(n.id?'#'+n.id:''):'(t)';}) }); } })
        .observe({ type:'layout-shift', buffered:true });
    });
    await page.goto(URL, { waitUntil:'commit' });
    await page.waitForTimeout(150);
    await page.evaluate(() => document.getElementById('builder')?.scrollIntoView({block:'start'}));
    await page.waitForFunction(() => document.querySelectorAll('#builderGrid .kbar-tile').length>0, {timeout:6000}).catch(()=>{});
    await page.waitForTimeout(700);
    const d = await page.evaluate(() => ({ cls:+window.__cls.toFixed(4), top:window.__shifts.sort((a,b)=>b.v-a.v)[0] }));
    console.log(`  ${label} ${w}px:  CLS ${d.cls}  ${d.cls>0.1?'❌':d.cls>0.05?'⚠️':'✅'}   top: ${d.top?d.top.v+' <- '+d.top.src.slice(0,3).join(','):'-'}`);
    await ctx.close();
  }
  await b.close();
};
if (require.main === module) module.exports('BASELINE');
