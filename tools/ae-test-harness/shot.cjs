const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1200, height: 900 });
  await p.goto('http://localhost:8791/index.html', { waitUntil: 'load' });
  await p.waitForTimeout(500);
  await p.evaluate(() => document.getElementById('builder')?.scrollIntoView({block:'start'}));
  await p.waitForTimeout(300);
  await p.screenshot({ path: '/Users/ivg/Desktop/ae-builder-check.png' });
  await b.close();
})();
