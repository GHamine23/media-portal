/* الدخول مرة واحدة بين منصة الأنشطة وأثر في متصفح حقيقي: الموقعان المبنيان من docs على نطاق واحد،
   وطلباتهما إلى الخادمين تُوجَّه إلى الخادمين نفسيهما يعملان في Node (link_env.js).
   node anshita/test/e2e_link.js [مجلد اللقطات] */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..'), OUT = process.argv[2] || '';
const env = require('./link_env.js')(), { A, N } = env;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const call = (ctx, fn, ...args) => { const o = JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify({ fn, args }) } }).getContent()); if (o.error) throw new Error(o.error); try { return JSON.parse(o.result); } catch (e) { return o.result; } };

// تجهيز: المدير العام في أثر، والمنصة، وعضو مربوط
const t0 = /كلمة المرور المؤقتة: (\w+)/.exec(A.bootstrap())[1];
call(A, 'auth_password', call(A, 'auth_login', 'admin', t0).token, t0, 'AtarBoss#2026');
const cred = {}; N.setup().split('\n').forEach(l => { const m = /المستخدم: (\S+) — كلمة المرور: (\S+)/.exec(l); if (m) cred[m[1]] = m[2]; });
const AD = call(N, 'login', 'admin', cred.admin).token;
const s1 = call(N, 'acc_save', AD, JSON.stringify({ user: 'salem', name: 'سالم', role: 'team', track: 'judhoor' }));
const gs = call(N, 'acc_save', AD, JSON.stringify({ user: 'gen.sup', name: 'مشرف عام', role: 'sup' }));

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.otf': 'font/otf', '.webmanifest': 'application/manifest+json' };
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 860 } }), errs = [];
  await ctx.route('**/*', async r => {
    const u = new URL(r.request().url());
    if (u.host === 'script.google.com') {
      const which = u.pathname.indexOf(N.CONFIG_API_ID || 'AKfycbzvZx6Q') >= 0 ? 'anshita' : 'atar';
      return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: env.post(which, r.request().postData() || '{}') });
    }
    if (u.host === 'local.test') {
      let f = path.join(ROOT, 'docs', decodeURIComponent(u.pathname.replace(/^\/media-portal\//, '')));
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
      if (fs.existsSync(f)) return r.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
      return r.fulfill({ status: 404, body: '' });
    }
    return r.abort();
  });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  const ANS = 'http://local.test/media-portal/anshita/', ATAR = 'http://local.test/media-portal/';
  // ١) الدخول إلى المنصة بكلمة المرور يفتح جلسة في أثر
  await p.goto(ANS); await p.waitForTimeout(1500);
  await p.click('[data-act="lgother"]'); await p.fill('#lg-u', 'salem'); await p.fill('#lg-p', s1.pass); await p.click('#lgf button[type=submit]');
  await p.waitForFunction(() => typeof D !== 'undefined' && D && D.me && localStorage.getItem('mp6.token'), null, { timeout: 20000 }).catch(() => {});
  ok(await p.evaluate(() => !!(typeof D !== 'undefined' && D && D.me.user === 'salem' && D.me.linked)), 'دخل المنصة بحساب مربوط');
  ok(await p.evaluate(() => !!localStorage.getItem('mp6.token')), 'وفُتحت له جلسة في أثر');
  if (OUT) await p.screenshot({ path: path.join(OUT, 'e2e-1-anshita.png') });
  // ٢) فتح أثر: يدخل بحسابه نفسه دون تسجيل دخول
  await p.goto(ATAR); await p.waitForFunction(() => typeof V6 !== 'undefined' && V6.me, null, { timeout: 30000 }).catch(() => {});
  ok(await p.evaluate(() => !!(typeof V6 !== 'undefined' && V6.me && V6.me.username === 'salem' && V6.me.anshita)), 'أثر مفتوح بحسابه نفسه');
  if (OUT) { await p.waitForTimeout(1500); await p.screenshot({ path: path.join(OUT, 'e2e-2-atar.png') }); }
  // ٣) الخروج من أثر وحده (قرار أمين): يبقى في المنصة، ولا يُفتح له أثر منها تلقائيًا
  await p.evaluate(() => logout()); await p.waitForTimeout(800);
  ok(await p.evaluate(() => !localStorage.getItem('mp6.token') && !!localStorage.getItem('anshita.tok')), 'الخروج من أثر لا يُخرج من المنصة');
  await p.goto(ATAR); await p.waitForTimeout(3000);
  ok(await p.evaluate(() => !(typeof V6 !== 'undefined' && V6.me)), 'وأثر يطلب الدخول بعدها');
  await p.goto(ANS); await p.waitForFunction(() => typeof D !== 'undefined' && D && D.me, null, { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => !!(typeof D !== 'undefined' && D && D.me.user === 'salem') && !localStorage.getItem('mp6.token')), 'والمنصة مفتوحة، ولا تعيد فتح أثر من نفسها');
  // ٤) الدخول إلى أثر بكلمة المرور
  await p.goto(ATAR + '#/login'); await p.waitForSelector('#lg_id', { timeout: 20000 });
  for (let i = 0; i < 3; i++) { if (await p.$('.modal')) { await p.keyboard.press('Escape'); await p.waitForTimeout(300); } }
  await p.evaluate(() => document.querySelectorAll('.modal,.coach').forEach(x => x.remove()));
  await p.fill('#lg_id', 'salem'); await p.fill('#lg_pw', s1.pass); await p.click('.lgform button[type=submit]');
  await p.waitForFunction(() => typeof V6 !== 'undefined' && V6.me && localStorage.getItem('mp6.token'), null, { timeout: 30000 }).catch(() => {});
  ok(await p.evaluate(() => !!(typeof V6 !== 'undefined' && V6.me && V6.me.username === 'salem')), 'يدخل أثر من جديد بكلمته');
  // ٥) الخروج من المنصة وحدها: يبقى في أثر، ولا تُفتح له المنصة منه تلقائيًا
  await p.goto(ANS); await p.waitForFunction(() => typeof D !== 'undefined' && D && D.me, null, { timeout: 20000 }).catch(() => {});
  await p.evaluate(() => logout()); await p.waitForTimeout(800);
  ok(await p.evaluate(() => !localStorage.getItem('anshita.tok') && !!localStorage.getItem('mp6.token')), 'الخروج من المنصة لا يُخرج من أثر');
  await p.goto(ANS); await p.waitForTimeout(3000);
  ok(await p.evaluate(() => !(typeof D !== 'undefined' && D) && !!document.querySelector('#lg-u, [data-act="lgother"]')), 'والمنصة تطلب الدخول بعدها');
  await p.goto(ATAR); await p.waitForFunction(() => typeof V6 !== 'undefined' && V6.me, null, { timeout: 30000 }).catch(() => {});
  ok(await p.evaluate(() => !!(typeof V6 !== 'undefined' && V6.me && V6.me.username === 'salem')), 'وأثر ما زال مفتوحًا');
  // ٦) دخول جديد في أثر بكلمة المرور يفتح المنصة من جديد
  await p.evaluate(() => logout()); await p.waitForTimeout(800);
  await p.goto(ATAR + '#/login'); await p.waitForSelector('#lg_id', { timeout: 20000 });
  await p.evaluate(() => document.querySelectorAll('.modal,.coach').forEach(x => x.remove()));
  await p.fill('#lg_id', 'salem'); await p.fill('#lg_pw', s1.pass); await p.click('.lgform button[type=submit]');
  await p.waitForFunction(() => typeof V6 !== 'undefined' && V6.me && localStorage.getItem('mp6.token'), null, { timeout: 30000 }).catch(() => {});
  await p.goto(ANS); await p.waitForFunction(() => typeof D !== 'undefined' && D && D.me, null, { timeout: 20000 }).catch(() => {});
  ok(await p.evaluate(() => !!(typeof D !== 'undefined' && D && D.me.user === 'salem')), 'دخول جديد في أثر يفتح المنصة بحسابه');
  // ٧) دخول جديد في المنصة يفتح أثر من جديد
  await p.evaluate(() => logout()); await p.goto(ATAR); await p.waitForFunction(() => typeof V6 !== 'undefined' && V6.me, null, { timeout: 30000 }).catch(() => {});
  await p.evaluate(() => logout()); await p.waitForTimeout(800);
  await p.goto(ANS); await p.waitForTimeout(1500);
  await p.click('[data-act="lgother"]'); await p.fill('#lg-u', 'salem'); await p.fill('#lg-p', s1.pass); await p.click('#lgf button[type=submit]');
  await p.waitForFunction(() => typeof D !== 'undefined' && D && D.me && localStorage.getItem('mp6.token'), null, { timeout: 20000 }).catch(() => {});
  ok(await p.evaluate(() => !!localStorage.getItem('mp6.token') && !localStorage.getItem('mp6.nosso')), 'دخول جديد في المنصة يفتح أثر');
  // ٨) المشرف العام في المنصة: كل المسارات بلا صفحات الإدارة
  await p.evaluate(() => logout()); await p.waitForTimeout(500);
  await p.goto(ANS); await p.waitForTimeout(1200);
  await p.click('[data-act="lgother"]'); await p.fill('#lg-u', 'gen.sup'); await p.fill('#lg-p', gs.pass); await p.click('#lgf button[type=submit]');
  await p.waitForFunction(() => typeof D !== 'undefined' && D && D.me, null, { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(800);
  ok(await p.evaluate(() => D.me.role === 'sup' && document.querySelectorAll('.side .nl[href^="#t/"]').length === D.tracks.length && !document.querySelector('.side a[href="#accounts"], .side a[href="#bot"], .side a[href="#alerts"]')), 'المشرف العام: المسارات كلها في القائمة، بلا صفحات الإدارة');
  if (OUT) await p.screenshot({ path: path.join(OUT, 'e2e-3-sup-home.png') });
  await p.goto(ANS + '#accounts'); await p.waitForTimeout(800);
  ok(await p.evaluate(() => location.hash === '#home'), 'وصفحة الحسابات تعيده إلى الرئيسية');
  await p.goto(ANS + '#t/' + (await p.evaluate(() => D.tracks[1].id))); await p.waitForTimeout(800);
  ok(await p.evaluate(() => !!document.querySelector('.thead') && !document.querySelector('[data-act="toggleedit"]')), 'يفتح خطة أي مسار، بلا مفتاح صلاحيات المسار');
  if (OUT) await p.screenshot({ path: path.join(OUT, 'e2e-4-sup-track.png') });
  ok(!errs.length, 'بلا أخطاء في الصفحتين' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close();
  console.log((fail ? '✗' : '✓') + ' ' + pass + ' فحصًا ناجحًا في المتصفح' + (fail ? '، و' + fail + ' فاشلة' : ''));
  process.exit(fail ? 1 : 0);
})();
