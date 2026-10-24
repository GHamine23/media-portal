/* وضع التجربة المحلي (لا يُنشر): يشغّل ملف الخادم نفسه server/Code.gs داخل المتصفح عبر المحاكي.
   يُفتح من خادم محلي يخدم مجلد /home/claude: /media-portal/dist6/index.html */
(function () {
  // جذر نسخة العمل التي تخدم الصفحة (/media-portal/ أو /wt/<name>/)، فيشغّل كل نسخة خادمَها هي
  const ROOT = (location.pathname.match(/^(.*\/)dist6\/[^/]*$/) || [0, '/media-portal/'])[1];
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
    else if (url.indexOf('api.telegram.org') >= 0) {
      window.DEMO_TG = (window.DEMO_TG || []).concat([{ url: url, payload: opt.payload }]);
      if (/getMe$/.test(url)) return { code: 200, body: JSON.stringify({ ok: true, result: { id: 777, username: 'athar_demo_bot', first_name: 'أثر' } }) };
      if (/getUpdates$/.test(url)) return { code: 200, body: JSON.stringify({ ok: true, result: [{ update_id: 1, my_chat_member: { chat: { id: -1001, title: 'قناة الأكاديمية التجريبية', type: 'channel', username: 'jeel_demo' }, date: Math.floor(Date.now() / 1000) - 3600, new_chat_member: { status: 'administrator' } } }, { update_id: 2, message: { chat: { id: -2002, title: 'مجموعة المشرفين', type: 'supergroup' }, date: Math.floor(Date.now() / 1000) - 600, text: 'hi' } }] }) };
      if (/getChat$/.test(url)) return { code: 200, body: JSON.stringify({ ok: true, result: { id: -1001, title: 'قناة الأكاديمية التجريبية', type: 'channel', username: 'jeel_demo', members_count: 120 } }) };
      if (/getChatMember$/.test(url)) return { code: 200, body: JSON.stringify({ ok: true, result: { status: 'administrator', can_post_messages: true } }) };
      return { code: 200, body: JSON.stringify({ ok: true, result: { message_id: 100 + window.DEMO_TG.length } }) };
    }
    else if (url.indexOf('api.openverse.org/v1/images/') >= 0) { const q = decodeURIComponent((/[?&]q=([^&]*)/.exec(url) || [])[1] || ''); return { code: 200, body: JSON.stringify({ result_count: 3, page_count: 1, page: 1, results: ['img_mosque', 'img_arch', 'img_dome'].map(function (k, i) { const u = location.origin + ROOT + 'assets/img/' + k + '.webp'; return { id: 'ov' + i, title: q + ' ' + (i + 1), url: 'https://live.staticflickr.com/demo/' + k + '.webp', thumbnail: u, creator: 'مصوّر تجريبي', creator_url: 'https://flickr.com/demo', license: 'by', license_version: '2.0', license_url: 'https://creativecommons.org/licenses/by/2.0/', foreign_landing_url: 'https://flickr.com/p/' + i, width: 1600, height: 1000, source: 'flickr', provider: 'flickr' }; }) }) }; }
    else if (url.indexOf('live.staticflickr.com/demo/') >= 0) { local = ROOT + 'assets/img/' + url.split('/demo/')[1]; }
    else if (url.indexOf('api.islamic.app/v1/hadith/search') >= 0) return { code: 200, body: JSON.stringify({ code: 200, data: { total: 1, results: [{ collection: 'bukhari', hadithNumber: '1', ar: { text: 'حَدَّثَنَا الْحُمَيْدِيُّ قَالَ سَمِعْتُ رَسُولَ اللَّهِ صلى الله عليه وسلم يَقُولُ " إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى "', grades: [{ grade: 'صحيح' }] } }] } }) };
    else if (url.indexOf('api.pexels.com') >= 0) { const q = decodeURIComponent((/query=([^&]*)/.exec(url) || [])[1] || ''); return { code: 200, body: JSON.stringify({ total_results: 3, page: 1, photos: ['img_mosque', 'img_arch', 'img_dome'].map(function (k, i) { const u = location.origin + ROOT + 'assets/img/' + k + '.webp'; return { id: i + 1, width: 1600, height: 1000, src: { medium: u, large2x: u, original: 'https://images.pexels.com/demo/' + k + '.webp' }, photographer: 'مصوّر تجريبي', photographer_url: 'https://www.pexels.com/@demo', url: 'https://www.pexels.com/photo/' + (i + 1) + '/', alt: q + ' ' + (i + 1), avg_color: '#8a7a6a' }; }) }) }; }
    else if (url.indexOf('images.pexels.com/demo/') >= 0) { local = ROOT + 'assets/img/' + url.split('/demo/')[1]; }
    else if (url.indexOf('api.alquran.cloud/v1/surah') >= 0) return { code: 200, body: JSON.stringify({ data: [{ number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ' }, { number: 17, name: 'سُورَةُ الإِسۡرَاءِ' }, { number: 31, name: 'سُورَةُ لُقۡمَانَ' }] }) };
    else if (url.indexOf('api.alquran.cloud/v1/ayah/') >= 0) { const m = /ayah\/(\d+):(\d+)/.exec(url); return { code: 200, body: JSON.stringify({ data: { text: m[1] === '17' ? 'وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا' : 'يَا بُنَيَّ أَقِمِ الصَّلَاةَ وَأْمُرْ بِالْمَعْرُوفِ', surah: { number: +m[1], name: m[1] === '17' ? 'سُورَةُ الإِسۡرَاءِ' : 'سُورَةُ لُقۡمَانَ' }, numberInSurah: +m[2] } }) }; }
    else if (url.indexOf('api.alquran.cloud/v1/search/') >= 0) return { code: 200, body: JSON.stringify({ data: { count: 1, matches: [{ text: 'وَوَصَّيْنَا الْإِنسَانَ بِوَالِدَيْهِ حُسْنًا', surah: { number: 29, name: 'سُورَةُ العَنكَبُوتِ' }, numberInSurah: 8 }] } }) };
    else if (url.indexOf('dorar.net/dorar_api.json') >= 0) return { code: 200, body: JSON.stringify({ ahadith: { result: '<div class="hadith" style="text-align:justify;">إنَّ اللهَ يُحِبُّ إذا عَمِلَ أحدُكُم عملًا أن يُتقِنَه</div><div class="hadith-info"><span class="info-subtitle">الراوي:</span> عائشة أم المؤمنين <span class="info-subtitle">المحدث:</span> الألباني <span class="info-subtitle">المصدر:</span> صحيح الجامع <span class="info-subtitle">الصفحة أو الرقم:</span> 1880 <span class="info-subtitle">خلاصة حكم المحدث:</span> <span >حسن</span></div>--------------<br/><div class="hadith" style="text-align:justify;">نص ضعيف للتجربة</div><div class="hadith-info"><span class="info-subtitle">الراوي:</span> فلان <span class="info-subtitle">المحدث:</span> الألباني <span class="info-subtitle">المصدر:</span> ضعيف الجامع <span class="info-subtitle">الصفحة أو الرقم:</span> 12 <span class="info-subtitle">خلاصة حكم المحدث:</span> <span >ضعيف</span></div>' } }) };
    else if (url.indexOf('text.pollinations.ai') >= 0 && window.DEMO_AI) return { code: 200, body: JSON.stringify({ choices: [{ message: { content: window.DEMO_AI(opt.payload) } }] }) };
    else if (url.indexOf('generativelanguage.googleapis.com') >= 0 && window.DEMO_AI) return { code: 200, body: JSON.stringify({ candidates: [{ content: { parts: [{ text: window.DEMO_AI(opt.payload) }] } }] }) };
    if (!local) return { code: 404, body: '' };
    const b = syncGet(local, true); return b ? { code: 200, body: b } : { code: 404, body: '' };
  };
  const code = syncGet(ROOT + 'server/Code.gs');
  const names = ['DriveApp', 'CacheService', 'PropertiesService', 'LockService', 'Utilities', 'ContentService', 'HtmlService', 'UrlFetchApp', 'ScriptApp'];
  const srv = new Function(names.join(','), code + '\nreturn { doPost: doPost, bootstrap: bootstrap, tgTick: tgTick };').apply(null, names.map(function (n) { return GAS[n]; }));
  try { const saved = localStorage.getItem('demo.gas'); if (saved) GAS._load(saved); } catch (e) {}
  window.DEMO = {
    call: function (fn, args) {
      return new Promise(function (ok, bad) {
        setTimeout(function () {
          const out = JSON.parse(srv.doPost({ postData: { contents: JSON.stringify({ fn: fn, args: args }) } }).getContent());
          if (/^(auth_|acc_|prog_|asset_put|asset_del|asset_meta|item_save|item_del|item_model|arc_put|pack_put|pack_toggle|tg_send|tg_cancel|tg_update|tg_requeue|task_|nt_seen|me_profile|font_family|fb_|bc_|cl_|set_|prefs_)/.test(fn)) { try { localStorage.setItem('demo.gas', GAS._dump()); } catch (e) {} }
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
    // المؤقّت كما يشغّله Apps Script كل عشر دقائق (للاختبار): يرسل المجدول ويرسل تذكيرات المهام
    tick: function () { srv.tgTick(); try { localStorage.setItem('demo.gas', GAS._dump()); } catch (e) {} },
    reset: function () { GAS._reset(); localStorage.removeItem('demo.gas'); }
  };
  window.DEMO_ON = true;
})();
