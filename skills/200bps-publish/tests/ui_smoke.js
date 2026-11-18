// Browser check of the dashboard (run by tests/test_ui.py): every tab opens without a JavaScript
// error, at desktop and phone size, light and dark; the PIX chat opens on its newest message;
// nothing spills past the screen edge. Usage: node ui_smoke.js <url> <out-dir> <puppeteer-core path> <chrome>
// With a 5th argument "replies": only the Inbox, in English and Arabic, at desktop and phone size, and
// what its cards show for replies written inside a thread (test_ui.py puts those comments in the cache first),
// that a long list is drawn 40 at a time with "Show 40 more", and what "Ask PIX to draft replies" sends.
const [url, out, pptr, chrome, mode] = process.argv.slice(2);
const puppeteer = require(pptr);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const fail = (e) => { console.log(JSON.stringify({ fatal: String(e && e.stack || e) })); process.exit(1); };

async function replies() {
  const b = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--no-sandbox'] });
  const report = { errors: [], views: [] };
  for (const [w, h, theme, lang] of [[1400, 900, 'dark', 'en'], [390, 820, 'light', 'ar'], [390, 820, 'dark', 'en'], [1400, 900, 'light', 'ar']]) {
    const p = await b.newPage(); await p.setViewport({ width: w, height: h });
    const tag = `${w}px ${theme} ${lang}`;
    p.on('pageerror', (e) => report.errors.push(`${tag}: ${e.message}`));
    p.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) report.errors.push(`${tag} console: ${m.text()}`); });
    await p.evaluateOnNewDocument((l) => { try { localStorage.setItem('bps.lang', l); localStorage.setItem('bps.view', 'inbox'); } catch (e) {} }, lang);
    await p.goto(url, { waitUntil: 'domcontentloaded' }); await wait(2500);
    await p.evaluate((th) => { document.documentElement.dataset.theme = th; }, theme);
    await p.evaluate(() => document.querySelector('.tab[data-view=inbox]').click()); await wait(700);
    const waiting = await p.evaluate(() => document.querySelector('#cmtCount').textContent.trim());
    // a long list: 40 cards, "Showing 40 of N" and a button for the rest; a new filter starts again at 40
    const page = () => p.evaluate(() => { const m = document.querySelector('#comments .ibx-showmore');
      return { cards: document.querySelectorAll('#comments .ibx-card').length, line: m ? m.querySelector('.label').textContent : null, btn: m ? m.querySelector('.btn').textContent : null }; });
    const more = async () => { await p.evaluate(() => document.querySelector('#comments .ibx-showmore .btn').click()); await wait(400); };
    const pick = async (k) => { await p.evaluate((i) => document.querySelectorAll('#comments .ibx-bar .seg button')[i].click(), k); await wait(400); };
    const paging = { waiting: await page() };
    await more(); paging.waitingMore = await page();
    await pick(2); paging.all = await page();                      // All
    await pick(0); paging.waitingAgain = await page(); await pick(2);
    await more(); paging.allMore = await page();
    const v = await p.evaluate(() => {
      const vw = document.documentElement.clientWidth, host = document.querySelector('#comments');
      const cards = [...host.querySelectorAll('.ibx-card')].map((c) => {
        const l = c.querySelector('.inbox-replyto'), q = l && l.querySelector('.irt-q'), r = l && l.getBoundingClientRect();
        return { who: c.querySelector('.ibx-who b').textContent, text: c.querySelector('.ibx-text').textContent, done: c.classList.contains('done'),
          labels: [...c.querySelectorAll('.ibx-lab .chip.ok')].map((x) => x.textContent),
          line: l ? l.textContent : null, title: l ? l.getAttribute('title') : null,
          oneLine: l ? r.height < 32 : null, inside: l ? r.left >= 0 && r.right <= vw + 1 : null, cut: q ? q.scrollWidth > q.clientWidth : null,
          beforeText: l ? !!(l.compareDocumentPosition(c.querySelector('.ibx-text')) & Node.DOCUMENT_POSITION_FOLLOWING) : null };
      });
      const spill = [];
      for (const el of host.querySelectorAll('*')) {
        const r = el.getBoundingClientRect(); if (!r.width || !el.offsetParent) continue;
        if (r.right > vw + 2 || r.left < -2) spill.push((el.className || el.tagName).toString().slice(0, 40));
      }
      return { cards, more: [...host.querySelectorAll('.ibx-more')].map((x) => x.textContent), spill: [...new Set(spill)].slice(0, 5),
        html: !!host.querySelector('.inbox-replyto img, .inbox-replyto i, .ibx-text img') || !!window.__bpsInjected,
        junk: /null|undefined/.test(host.textContent) };
    });
    await (await p.$('#view-inbox .card')).screenshot({ path: `${out}/inbox_replies_${lang}_${w}.png` });   // the whole comments card
    // a click opens the line (the whole comment), and the reply box opens on a reply item like on any comment
    v.opens = await p.evaluate(() => {
      const l = [...document.querySelectorAll('#comments .inbox-replyto')].find((x) => x.querySelector('.irt-q')); if (!l) return null;
      l.click(); return l.classList.contains('open') && getComputedStyle(l.querySelector('.irt-q')).whiteSpace !== 'nowrap';
    });
    v.replyBox = await p.evaluate(async () => {
      const card = [...document.querySelectorAll('#comments .ibx-card')].find((c) => c.querySelector('.inbox-replyto') && !c.classList.contains('done'));
      const btn = card && card.querySelector('.ibx-acts .btn'); if (!btn) return null;
      btn.click(); await new Promise((r) => setTimeout(r, 300));
      const ta = document.querySelector('#comments .ibx-comp textarea');
      return !!(ta && ta.closest('.ibx-card').querySelector('.inbox-replyto'));
    });
    v.paging = paging;
    if (!report.views.length) {                                    // once: what "Ask PIX to draft replies" sends
      const sent = [];
      p.on('request', (r) => { if (r.method() === 'POST' && /\/api\/inbox$/.test(r.url())) { try { sent.push(JSON.parse(r.postData())); } catch (e) {} } });
      await p.evaluate(() => document.querySelector('#comments .ibx-draftall').click()); await wait(900);
      v.drafts = (sent.find((x) => x.op === 'ask_drafts') || {}).items || null;
    }
    report.views.push({ tag, lang, waiting, ...v });
    await p.close();
  }
  await b.close();
  console.log(JSON.stringify(report));
}

if (mode === 'replies') replies().catch(fail);
else (async () => {
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
})().catch(fail);
