/* نسخة التجربة: يعمل خادم المنصة (Code.gs) داخل المتصفح عبر محاكي خدمات جوجل.
   البيانات في المتصفح فقط، والبوت والتقويم محاكاة تظهر رسائلها في صفحة البوت. */
window.DEMO = (function () {
  const KEY = 'anshita-demo.state.v1';
  const G = window.GAS;
  let CTX = null, CREDS = {}, OUT = [], UPD = [], UID = 1, readyP = null, saveT = null;
  const enc = new TextEncoder(), dec = new TextDecoder();
  function snapshot() {
    const st = G._store(), files = {};
    Object.keys(st.files).forEach(k => { const f = st.files[k]; files[k] = Object.assign({}, f, { bytes: undefined, text: dec.decode(Uint8Array.from(f.bytes.map(b => b & 255))) }); });
    return JSON.stringify({ files, folders: st.folders, seq: st.seq, props: G._props, cal: G._cal, creds: CREDS, out: OUT, upd: UPD, uid: UID });
  }
  function restore(s) {
    const o = JSON.parse(s), st = G._store();
    st.files = {}; Object.keys(o.files).forEach(k => { const f = o.files[k]; st.files[k] = Object.assign({}, f, { bytes: Array.from(enc.encode(f.text)) }); delete st.files[k].text; });
    st.folders = o.folders; st.seq = o.seq;
    Object.keys(G._props).forEach(k => delete G._props[k]); Object.assign(G._props, o.props);
    Object.keys(G._cache).forEach(k => delete G._cache[k]);
    CREDS = o.creds || {}; OUT = o.out || []; UPD = o.upd || []; UID = o.uid || 1;
    return o.cal;
  }
  function persist() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, snapshot()); } catch (e) {} }, 250); }
  function boot(cal) {
    GAS_EXT(G, { cal: cal || null });
    G._fetch.handler = function (url, opt) {
      if (url.indexOf('meet.googleapis.com') >= 0) {   // ميت محاكاة: غرفة وهمية ومشرفون
        const m = (opt.method || 'get').toLowerCase(), body = typeof opt.payload === 'string' ? JSON.parse(opt.payload) : {}, p = url.split('/v2/')[1], r = () => Math.random().toString(36).slice(2, 5);
        if (m === 'post' && p === 'spaces') { const c = r() + '-' + r() + 'x-' + r(); return { code: 200, body: JSON.stringify({ name: 'spaces/' + c, meetingUri: 'https://meet.google.com/' + c, meetingCode: c }) }; }
        if (m === 'post' && /\/members$/.test(p)) return { code: 200, body: JSON.stringify({ name: p + '/' + r(), email: body.email, role: body.role }) };
        return { code: 200, body: '{}' };
      }
      if (url.indexOf('api.telegram.org') >= 0) {
        const m = url.split('/').pop(), p = opt.payload || {};
        if (m === 'getMe') return { code: 200, body: JSON.stringify({ ok: true, result: { id: 7, username: 'anshita_demo_bot', first_name: 'تذكيرات الأنشطة' } }) };
        if (m === 'deleteWebhook') return { code: 200, body: '{"ok":true,"result":true}' };
        if (m === 'getUpdates') { const off = +p.offset || 0; return { code: 200, body: JSON.stringify({ ok: true, result: UPD.filter(u => u.update_id >= off) }) }; }
        if (m === 'sendMessage') { OUT.push({ chat: String(p.chat_id), text: p.text, html: p.parse_mode === 'HTML', at: Date.now() }); if (OUT.length > 60) OUT.shift(); return { code: 200, body: JSON.stringify({ ok: true, result: { message_id: OUT.length } }) }; }
      }
      return { code: 404, body: '' };
    };
    const names = Object.keys(G).filter(k => k[0] !== '_');
    const f = new Function(...names, window.GAS_SRC + '\n;return {doPost:doPost,setup:setup,tick:tick};');
    CTX = f(...names.map(n => G[n]));
  }
  function call(fn, args) { const r = JSON.parse(CTX.doPost({ postData: { contents: JSON.stringify({ fn, args }) } }).getContent()); persist(); return Promise.resolve(r); }
  function c(fn, ...args) { const r = JSON.parse(CTX.doPost({ postData: { contents: JSON.stringify({ fn, args }) } }).getContent()); if (r.error) throw new Error(fn + ': ' + r.error); let v = r.result; try { v = JSON.parse(v); } catch (e) {} return v; }
  function upd(o) { UPD.push(Object.assign({ update_id: UID++ }, o)); }
  function seed() {
    const log = CTX.setup();
    log.split('\n').forEach(l => { const m = /المستخدم: (\S+) — كلمة المرور: (\S+)/.exec(l); if (m) CREDS[m[1]] = m[2]; });
    const A = c('login', 'admin', CREDS.admin).token;
    const S = window.SEM2 || {}, add = (s, n) => new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) + n * 864e5).toISOString().slice(0, 10);
    const cur = { sanabel: 2, budhoor: 2, judhoor: 2, ishraq: 2, ithmar2: 8, ithmar3: 2 };
    Object.keys(S).forEach(t => c('sem_put', A, t, cur[t], JSON.stringify({ days: S[t], src: 'جدول المقررات في درايف' })));
    const M = { judhoor: ['أبو عبد الله', 'أنس', 'معاذ', 'يوسف'], budhoor: ['عمر', 'خالد', 'سعد'], sanabel: ['حسام', 'بلال'], ishraq: ['حمزة', 'طارق', 'زياد'], ithmar2: ['مصعب', 'عاصم'], ithmar3: ['عبد الرحمن', 'إبراهيم'] };
    Object.keys(M).forEach(t => c('track_save', A, t, JSON.stringify({ members: M[t] })));
    const ids = {};
    const act = (t, w, d, type, title, who, idea, time, extra) => { if (!S[t]) return; const s = S[t][0].d, r = c('act_save', A, t, JSON.stringify(Object.assign({ title, type, d: add(s, (w - 1) * 7 + d), time: time || '', who, idea: idea || '' }, extra || {}))); ids[title] = r.act.id; };
    act('judhoor', 1, 1, 'لقاء', 'لقاء افتتاح الأنشطة «على بصيرة»', ['أبو عبد الله'], 'لقاء يفتتح الفصل: شعار الأنشطة، والجدول الثابت، وتعارف الطلاب بالفريق.', '20:00', { calOn: true });
    act('judhoor', 1, 3, 'المجموعة التفاعلية', 'سؤال اليوم: ما أول صلاة تذكرها؟', ['أنس'], 'منشور في المجموعة التفاعلية يفتح الحديث حول كتاب «أول مرة أصلي».');
    act('judhoor', 1, 6, 'كاهوت', 'كاهوت «أول مرة أصلي»', ['معاذ'], 'أسئلة على الجزء المقرر من الكتاب في لقاء مباشر.', '21:00');
    act('judhoor', 2, 4, 'كتابي', 'ملخص فوائد الأسبوع', ['أنس'], 'يجمع أبرز ما دوّنه الطلاب من فوائد في منشور واحد.');
    act('judhoor', 3, 0, 'تحدٍّ', 'تحدي «أذكاري» الأسبوعي', ['أنس'], 'ورد أذكار يُتابَع في المجموعة طوال الأسبوع.');
    act('judhoor', 3, 3, 'لقاء', 'لقاء مفتوح: الغفلة.. من أين تبدأ اليقظة؟', ['أبو عبد الله', 'يوسف'], 'نقاش مفتوح بعد محاضرة الغفلة بيوم.', '21:00', { calOn: true });
    act('judhoor', 3, 6, 'مسابقة', '«السهم الصاعد»: معركة اليرموك', ['معاذ', 'يوسف'], 'مسابقة فرق على حلقة اليرموك، تُعرض على الشاشة والإجابات في الشات.', '20:30');
    act('judhoor', 4, 2, 'كتابي', '«رسالة إلى الفاروق»', ['أنس'], 'يكتب الطالب رسالة قصيرة إلى عمر بعد حلقة مقتله.');
    act('judhoor', 5, 6, 'استضافة', 'استضافة: سيرة عثمان ذي النورين', ['أبو عبد الله'], '', '20:00');
    act('judhoor', 7, 6, 'مسابقة', '«معركة الفتوحات» مسابقة فرق', ['معاذ'], '', '20:30');
    act('judhoor', 10, 6, 'استضافة', 'استضافة: السميط.. رجل بأمة', ['أبو عبد الله'], '', '20:00');
    act('judhoor', 14, 6, 'لقاء', 'لقاء ختام الفصل وتكريم المتميزين', ['أبو عبد الله'], '', '20:00');
    act('budhoor', 1, 6, 'لقاء', 'لقاء تعارف', ['عمر'], '', '19:00'); act('budhoor', 2, 6, 'مسابقة', 'مسابقة قصص القرآن', ['خالد'], '', '19:30'); act('budhoor', 3, 5, 'كاهوت', 'كاهوت لبنات العقيدة', ['عمر'], '', '19:00'); act('budhoor', 4, 1, 'تحدٍّ', 'تحدي الصلاة على وقتها', ['سعد']);
    act('ishraq', 1, 2, 'لقاء', 'لقاء الافتتاح', [], '', '21:00'); act('ishraq', 2, 2, 'المجموعة التفاعلية', 'مدارسة «تهذيب الداء والدواء»', ['طارق']); act('ishraq', 2, 6, 'مسابقة', 'مسابقة «كامل الصورة»', ['زياد'], '', '21:00'); act('ishraq', 3, 4, 'لقاء', 'لقاء مفتوح: سؤال الواقع', ['حمزة'], '', '21:30');
    act('ithmar2', 1, 6, 'لقاء', 'لقاء الافتتاح', ['مصعب'], '', '21:00'); act('ithmar2', 2, 6, 'مسابقة', 'مسابقة الحقيبة الشرعية', ['عاصم'], '', '21:00'); act('ithmar2', 3, 3, 'المجموعة التفاعلية', 'مدارسة شرح المنهاج', ['مصعب']);
    act('sanabel', 1, 6, 'لقاء', 'لقاء الافتتاح مع أولياء الأمور', ['حسام'], '', '18:00'); act('sanabel', 2, 6, 'مسابقة', 'مسابقة أولي العزم', ['بلال'], '', '18:00'); act('sanabel', 3, 4, 'تحدٍّ', 'تحدي «أسمائي الحسنى»', ['حسام']);
    c('track_save', A, 'judhoor', JSON.stringify({ canEdit: true }));
    // البوت: ربط مجموعتي جذور وإشراق ومحادثة الإدارة
    let st = c('tg_token', A, '123456789:' + 'A'.repeat(35));
    const code = id => (st.tracks.find(t => t.id === id).link || '').split('startgroup=')[1];
    upd({ my_chat_member: { chat: { id: -100101, title: 'فريق أنشطة جذور', type: 'supergroup' }, new_chat_member: { status: 'member' } } });
    upd({ message: { chat: { id: -100101, title: 'فريق أنشطة جذور', type: 'supergroup' }, text: '/start@anshita_demo_bot ' + code('judhoor') } });
    upd({ my_chat_member: { chat: { id: -100104, title: 'أنشطة إشراق', type: 'supergroup' }, new_chat_member: { status: 'member' } } });
    upd({ message: { chat: { id: -100104, title: 'أنشطة إشراق', type: 'supergroup' }, text: '/start ' + code('ishraq') } });
    upd({ message: { chat: { id: 500, first_name: 'أمين', type: 'private' }, text: '/start ' + st.adminLink.split('start=')[1] } });
    c('tg_poll', A);
    const B = c('login', 'budhoor', CREDS.budhoor).token;
    c('edit_request', B, 'نريد إضافة مسابقة في الأسبوع الثالث');
    CTX.tick();
    const rk = c('report_key', A).key;
    c('report_send', rk, 'التقرير الأسبوعي — مثال', '## الخلاصة\nيبدأ الفصل السبت. خمسة مسارات وضعت أنشطة للأسبوع الأول، وإثمار ٣ لم يضع شيئًا بعد.\n\n## ما يحتاج قرارك\n- طلب بذور فتح تعديل الخطة لإضافة مسابقة في الأسبوع الثالث.\n- أربعة مسارات لم تُربط مجموعاتها بالبوت: سنابل، بذور، إثمار ٢، إثمار ٣.\n\n## جذور\n- **هذا الأسبوع:** لقاء الافتتاح الأحد ٨:٠٠ م (أبو عبد الله)، وكاهوت الجمعة.\n- الأسابيع القادمة كلها فيها أنشطة حتى الأسبوع الخامس.\n\n## إثمار ٣\n- لا أنشطة في الخطة بعد، والتعديل مغلق للفريق.', '');
  }
  function ready() {
    if (readyP) return readyP;
    readyP = new Promise(ok => {
      let saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
      if (saved) { try { const cal = restore(saved); boot(cal); ok(); return; } catch (e) { console.warn('demo restore', e); } }
      G._reset(); boot(null); seed(); persist(); ok();
    });
    return readyP;
  }
  return {
    ready, call,
    pass: u => CREDS[String(u || '').trim().toLowerCase()] || '',
    outbox: () => OUT.slice(),
    reset() { try { localStorage.removeItem(KEY); Object.keys(localStorage).filter(k => k.startsWith('anshita-demo.')).forEach(k => localStorage.removeItem(k)); } catch (e) {} location.hash = ''; location.reload(); },
    simJoin(href) {   // محاكاة: إضافة البوت إلى مجموعة عبر الرابط
      const m = /startgroup=([\w-]+)/.exec(href), p = /[?&]start=([\w-]+)/.exec(href);
      if (m) { const id = -100200 - UID; upd({ my_chat_member: { chat: { id, title: 'مجموعة الفريق (تجربة)', type: 'supergroup' }, new_chat_member: { status: 'member' } } }); upd({ message: { chat: { id, title: 'مجموعة الفريق (تجربة)', type: 'supergroup' }, text: '/start ' + m[1] } }); }
      else if (p) upd({ message: { chat: { id: 501, first_name: 'أمين', type: 'private' }, text: '/start ' + p[1] } });
      persist();
    }
  };
})();
