// Measure interaction latency (INP proxy) for the #builder controls, on a
// throttled CPU to approximate a mid-range real-user device.
const { chromium } = require('playwright');
const URL = 'http://localhost:8791/index.html';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // Event Timing observer to capture interaction durations.
  await page.addInitScript(() => {
    window.__events = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.duration > 0) window.__events.push({ name: e.name, dur: Math.round(e.duration) });
      }
    }).observe({ type: 'event', durationThreshold: 16, buffered: true });
  });

  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() => {
    const g = document.getElementById('builderGrid');
    return g && g.children.length > 0;
  });

  // Throttle CPU 4x (mid-range phone-ish) via CDP.
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  // Time "Select all" (full 32-tile innerHTML rebuild + lucide re-init).
  async function timeClick(sel, label) {
    const t = await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const t0 = performance.now();
      el.click();               // synchronous handler runs the render
      return performance.now() - t0;
    }, sel);
    console.log(`${label}: main-thread handler = ${t === null ? 'n/a' : Math.round(t) + 'ms'}`);
    await page.waitForTimeout(300);
  }

  await timeClick('#selAll', '"Select all" click');
  await timeClick('#selNone', '"Clear" click');
  await timeClick('#selAll', '"Select all" again');

  await page.waitForTimeout(400);
  const events = await page.evaluate(() => window.__events.sort((a, b) => b.dur - a.dur).slice(0, 6));
  console.log('\nlongest Event-Timing interactions (>16ms):');
  for (const e of events) console.log(`  ${e.dur}ms  ${e.name}`);

  await browser.close();
})();
