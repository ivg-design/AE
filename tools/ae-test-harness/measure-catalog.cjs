// Measure the catalog app-window populated height at each breakpoint, so we can
// reserve it and stop it from growing (which shoves #builder down on mobile).
const { chromium } = require('playwright');
const URL = 'http://localhost:8791/index.html';
const WIDTHS = [1440, 900, 600];
(async () => {
  const b = await chromium.launch();
  for (const w of WIDTHS) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'load' });
    await page.waitForFunction(() => {
      const l = document.getElementById('scriptList');
      return l && l.children.length > 0;
    }).catch(() => {});
    await page.waitForTimeout(300);
    const d = await page.evaluate(() => {
      const q = s => document.querySelector(s);
      const h = el => el ? Math.round(el.getBoundingClientRect().height) : null;
      return {
        appWindow: h(q('.app-window')),
        winBody: h(q('.win-body')),
        sidebar: h(q('.sidebar')),
        content: h(q('.content')),
        scriptList: h(q('#scriptList')),
      };
    });
    console.log(`${w}px:  app-window=${d.appWindow}  win-body=${d.winBody}  sidebar=${d.sidebar}  content=${d.content}  list=${d.scriptList}`);
    await ctx.close();
  }
  await b.close();
})();
