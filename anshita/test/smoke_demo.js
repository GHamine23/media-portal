// فحص سريع لنسخة التجربة في متصفح حقيقي (للصيانة الأسبوعية وقبل كل إصدار).
//   python3 anshita/tools/build.py --demo /tmp/x/demo.html
//   node anshita/test/smoke_demo.js /tmp/x/demo.html /tmp/x/shots
// يتحقق: لا أخطاء في الصفحة، ولا تمرير أفقي على الجوال، وكل صفحة تُرسم؛ ويحفظ لقطات بالوضعين الفاتح والداكن.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const [demo, outDir] = [process.argv[2], process.argv[3] || 'smoke-shots'];
if (!demo) { console.error('الاستعمال: node smoke_demo.js DEMO_HTML [OUT_DIR]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
let fails = 0;
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fails++; };
const PAGES = {
  admin: ['#home', '#tracks', '#t/judhoor', '#timeline', '#calendar', '#bot', '#accounts', '#alerts', '#reports'],
  judhoor: ['#home', '#t/judhoor', '#calendar']
};
const VIEWPORTS = [['desk', 1280, 860], ['mob', 390, 844]];

(async () => {
  const b = await chromium.launch();
  for (const [vn, w, h] of VIEWPORTS) {
    for (const theme of ['light', 'dark']) {
      const p = await b.newPage({ viewport: { width: w, height: h } }), errs = [];
      p.on('pageerror', e => errs.push(e.message));
      await p.goto('file://' + path.resolve(demo)); await p.waitForTimeout(1200);
      await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
      for (const who of Object.keys(PAGES)) {
        await p.click(`[data-act="lgwho"][data-id="${who}"]`); await p.click('#lgf button[type=submit]'); await p.waitForTimeout(1300);
        await p.evaluate(t => { P.theme = t; applyTheme(); render(); }, theme);
        for (const hash of PAGES[who]) {
          await p.evaluate(x => { location.hash = x; }, hash); await p.waitForTimeout(700);
          const st = await p.evaluate(() => ({ main: (document.querySelector('main') || document.body).innerText.trim().length, sw: document.documentElement.scrollWidth, iw: innerWidth }));
          ok(st.main > 20, `${vn}/${theme}/${who}${hash} يُرسم`);
          if (vn === 'mob') ok(st.sw <= st.iw + 1, `${vn}/${theme}/${who}${hash} بلا تمرير أفقي (${st.sw}/${st.iw})`);
          await p.screenshot({ path: path.join(outDir, `${vn}-${theme}-${who}-${hash.slice(1).replace(/\W+/g, '_') || 'home'}.png`) });
        }
        await p.evaluate(() => logout()); await p.waitForTimeout(500);
      }
      ok(!errs.length, `${vn}/${theme} بلا أخطاء في الصفحة` + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
      await p.close();
    }
  }
  await b.close();
  console.log(fails ? `✗ ${fails} إخفاق` : '✓ الفحص سليم');
  process.exitCode = fails ? 1 : 0;
})();
