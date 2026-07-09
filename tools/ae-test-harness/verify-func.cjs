const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('http://localhost:8791/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => ({
    inlineUsed: Array.isArray(window.__SCRIPTS__) ? window.__SCRIPTS__.length : 'absent',
    builderTiles: document.querySelectorAll('#builderGrid .kbar-tile').length,
    listRows: document.querySelectorAll('#scriptList .script-row').length,
    countLabel: (document.getElementById('builderCount') || {}).textContent,
  }));
  // exercise a builder interaction
  await page.click('#selAll');
  await page.waitForTimeout(150);
  const afterSelAll = await page.evaluate(() =>
    document.querySelectorAll('#builderGrid .kbar-tile.sel').length);
  console.log('inline __SCRIPTS__ length:', r.inlineUsed);
  console.log('builder tiles rendered :', r.builderTiles);
  console.log('catalog list rows      :', r.listRows);
  console.log('builder count label    :', JSON.stringify(r.countLabel));
  console.log('selected after Select-all:', afterSelAll);
  console.log('console/page errors    :', errors.length ? errors : 'none');
  await b.close();
})();
