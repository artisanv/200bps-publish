// Browser check of the dashboard (run by tests/test_ui.py): every tab opens without a JavaScript
// error, at desktop and phone size, light and dark; the PIX chat opens on its newest message;
// nothing spills past the screen edge. Usage: node ui_smoke.js <url> <out-dir> <puppeteer-core path> <chrome>
const [url, out, pptr, chrome] = process.argv.slice(2);
const puppeteer = require(pptr);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--no-sandbox'] });
  const report = { errors: [], tabs: [], overflow: [], chat: null };
  for (const [w, h, theme] of [[1400, 900, 'dark'], [390, 820, 'light']]) {
    const p = await b.newPage(); await p.setViewport({ width: w, height: h });
    p.on('pageerror', (e) => report.errors.push(`${w}px ${theme}: ${e.message}`));
    p.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) report.errors.push(`${w}px ${theme} console: ${m.text()}`); });
    await p.goto(url, { waitUntil: 'domcontentloaded' }); await wait(2500);
    await p.evaluate((th) => { document.documentElement.dataset.theme = th; }, theme);
    const tabs = await p.evaluate(() => [...document.querySelectorAll('.tabs button, .tabs [role=tab]')].map((t, i) => [i, t.textContent.trim()]));
    for (const [i, name] of tabs) {
      await p.evaluate((k) => document.querySelectorAll('.tabs button, .tabs [role=tab]')[k].click(), i); await wait(900);
      const spill = await p.evaluate(() => {          // elements wider than the screen (cut / sideways scroll)
        const vw = document.documentElement.clientWidth, bad = [];
        for (const el of document.querySelectorAll('main *, section *, .card *')) {
          const r = el.getBoundingClientRect(); if (!r.width || !el.offsetParent) continue;
          if (r.right > vw + 2 && getComputedStyle(el).position !== 'fixed' && !el.closest('[style*="overflow"], .cands, .heat, .tg, .cal, .table-wrap, .media-strip, .frames, .kpis, pre, .scroll-x, .tabs')) bad.push((el.className || el.tagName).toString().slice(0, 40));
        }
        return [...new Set(bad)].slice(0, 5);
      });
      if (spill.length) report.overflow.push(`${w}px ${name}: ${spill.join(', ')}`);
      report.tabs.push(`${w}px ${theme} ${name}`);
      await p.screenshot({ path: `${out}/ui_${w}_${i}.png` });
    }
    // PIX chat: opens on the newest message
    await p.evaluate(() => document.querySelector('#noteFab') && document.querySelector('#noteFab').click()); await wait(1500);
    const chat = await p.evaluate(() => { const l = document.querySelector('.chat-list'); return l ? l.scrollHeight - l.scrollTop - l.clientHeight : null; });
    if (w === 1400) report.chat = chat;
    await p.close();
  }
  await b.close();
  console.log(JSON.stringify(report));
})().catch((e) => { console.log(JSON.stringify({ fatal: String(e && e.stack || e) })); process.exit(1); });
