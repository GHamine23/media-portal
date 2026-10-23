/* وضع التجربة المحلي (لا يُنشر): يشغّل ملف الخادم نفسه server/Code.gs داخل المتصفح عبر المحاكي.
   يُفتح من خادم محلي يخدم مجلد /home/claude: /media-portal/dist6/index.html */
(function () {
  const ROOT = '/media-portal/';
  function syncGet(url, binary) {
    const x = new XMLHttpRequest(); x.open('GET', url, false);
    if (binary) x.overrideMimeType('text/plain; charset=x-user-defined');
    x.send(); if (x.status !== 200) return null;
    if (!binary) return x.responseText;
    const t = x.responseText, out = new Array(t.length); for (let i = 0; i < t.length; i++) out[i] = t.charCodeAt(i) & 255; return out;
  }
  GAS._fetch.handler = function (url, opt) {
    let local = null;
    if (url.indexOf('raw.githubusercontent.com/GHamine23/media-portal/main/assets/') >= 0) local = ROOT + 'assets/' + url.split('/main/assets/')[1];
    else if (url.indexOf('raw.githubusercontent.com/google/fonts/main/ofl/') >= 0) local = '/gfonts/' + decodeURIComponent(url.split('/ofl/')[1]).replace(/[\[\],]/g, '_');
    else if (url.indexOf('generativelanguage.googleapis.com') >= 0 && window.DEMO_AI) return { code: 200, body: JSON.stringify({ candidates: [{ content: { parts: [{ text: window.DEMO_AI(JSON.parse(opt.payload)) }] } }] }) };
    if (!local) return { code: 404, body: '' };
    const b = syncGet(local, true); return b ? { code: 200, body: b } : { code: 404, body: '' };
  };
  const code = syncGet(ROOT + 'server/Code.gs');
  const names = ['DriveApp', 'CacheService', 'PropertiesService', 'LockService', 'Utilities', 'ContentService', 'HtmlService', 'UrlFetchApp', 'ScriptApp'];
  const srv = new Function(names.join(','), code + '\nreturn { doPost: doPost, bootstrap: bootstrap };').apply(null, names.map(function (n) { return GAS[n]; }));
  try { const saved = localStorage.getItem('demo.gas'); if (saved) GAS._load(saved); } catch (e) {}
  window.DEMO = {
    call: function (fn, args) {
      return new Promise(function (ok, bad) {
        setTimeout(function () {
          const out = JSON.parse(srv.doPost({ postData: { contents: JSON.stringify({ fn: fn, args: args }) } }).getContent());
          if (/^(auth_|acc_|prog_|asset_put|asset_del|asset_meta|item_save|item_del|item_model|arc_put|pack_put|pack_toggle|fb_|bc_|cl_|set_|prefs_)/.test(fn)) { try { localStorage.setItem('demo.gas', GAS._dump()); } catch (e) {} }
          if (out.error) { if (/انتهت الجلسة|موقوف/.test(out.error) && fn !== 'auth_login' && typeof sessionLost === 'function') sessionLost(out.error); bad(new Error(out.error)); } else ok(out.result);
        }, 20);
      });
    },
    srv: srv,
    // تهيئة سريعة للاختبار: المدير بكلمة معروفة، وخطوط ثمانية للواجهة، وحسابا مشرف ومستخدم
    seed: async function (thm) {
      const log = srv.bootstrap(), temp = (/كلمة المرور المؤقتة: (\w+)/.exec(log) || [])[1];
      const call = function (fn) { const a = Array.prototype.slice.call(arguments, 1); const o = JSON.parse(srv.doPost({ postData: { contents: JSON.stringify({ fn: fn, args: a }) } }).getContent()); if (o.error) throw new Error(fn + ': ' + o.error); return typeof o.result === 'string' && /^[\[{]/.test(o.result) ? JSON.parse(o.result) : o.result; };
      let tok = call('auth_login', 'admin', temp).token; call('auth_password', tok, temp, 'Admin#2026');
      tok = call('auth_login', 'admin', 'Admin#2026').token;
      for (const f of (thm || [])) {
        const b = syncGet('/fonts_thm/' + f, true); if (!b) continue;
        let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.slice(i, i + 0x8000));
        const fam = /display/.test(f) ? 'thm-display' : /text/.test(f) ? 'thm-text' : 'thm-sans', w = { Light: '300', Regular: '400', Medium: '500', Bold: '700', Black: '900' }[f.split('-')[1].replace('.otf', '')];
        call('asset_put', tok, JSON.stringify({ kind: 'font', name: f, family: fam, label: fam, weight: w, mime: 'font/otf', scope: 'global', ui: true }), btoa(s));
      }
      const sup = call('acc_save', tok, JSON.stringify({ username: 'mushrif', name: 'مشرف الأكاديمية', role: 'sup', programs: ['academy'] }));
      const usr = call('acc_save', tok, JSON.stringify({ username: 'ahmad', name: 'أحمد السالم', role: 'user', programs: ['academy', 'alim'], perms: { ai: true, upload: true, slides: true } }));
      [[sup.temp, 'mushrif', 'Mushrif#2026'], [usr.temp, 'ahmad', 'Ahmad#2026']].forEach(function (q) { const t = call('auth_login', q[1], q[0]).token; call('auth_password', t, q[0], q[2]); });
      try { localStorage.setItem('demo.gas', GAS._dump()); } catch (e) {}
      return { admin: 'Admin#2026' };
    },
    reset: function () { GAS._reset(); localStorage.removeItem('demo.gas'); }
  };
  window.DEMO_ON = true;
})();
