/* ================= أثر داخل تيليجرام (التطبيق المصغّر لبوت أثر) =================
   يعمل فقط حين يُفتح التطبيق من البوت (app/?tg=1) ومعه Telegram.WebApp.initData؛ وخارج تيليجرام لا يغيّر شيئاً.
   - الدخول: tg_login ببيانات تيليجرام الموقّعة، والجلسة «رمز#tg#initData» فيتحقق الخادم منها في كل طلب، ولا تُحفظ في المتصفح.
   - من ليس له حساب: نموذج «اطلب الدخول»، ثم شاشة الانتظار.
   - التنزيل: يُرسل التصميم إلى الخادم فيصل صاحبه في المحادثة ملفاً بجودته الكاملة.
   - زر الرجوع في تيليجرام، وسمة تيليجرام (فاتح/داكن) مع هوية أثر. */
const TG6 = {
  init: '',
  wa: function () { try { return window.Telegram && Telegram.WebApp && Telegram.WebApp.initData ? Telegram.WebApp : null; } catch (e) { return null; } },
  on: function () { return !!TG6.init; },
  // بيانات تيليجرام من الرابط نفسه (#tgWebAppData=…) إن لم يحمّل سكربت تيليجرام بعد
  fromHash: function () { const m = /[#&]tgWebAppData=([^&]*)/.exec(location.hash); try { return m ? decodeURIComponent(m[1]) : ''; } catch (e) { return ''; } },
  start: function () {
    const wa = TG6.wa(), raw = wa ? '' : TG6.fromHash();
    if (!wa && !raw) { TG6.lost = /[?&]tg=1/.test(location.search); return; }
    TG6.init = wa ? wa.initData : raw;
    document.documentElement.classList.add('tgapp');
    if (wa) {
      try { wa.ready(); wa.expand(); } catch (e) {}
      try { document.documentElement.dataset.theme = wa.colorScheme === 'dark' ? 'dark' : 'light'; wa.onEvent('themeChanged', function () { document.documentElement.dataset.theme = wa.colorScheme === 'dark' ? 'dark' : 'light'; }); } catch (e) {}
    }
    // الوجهة من الزر (r)، وتيليجرام يضع بياناته في الرابط بعد #: نعيده إلى مسار أثر
    const m = /[?&]r=([^&#]+)/.exec(location.search), r = m ? decodeURIComponent(m[1]) : '';
    const dest = r && /^\/[\w\-\/?=&.%]*$/.test(r) ? r : (/^#\//.test(location.hash) ? location.hash.slice(1) : '/');
    try { history.replaceState(null, '', location.pathname + '?tg=1#' + dest); } catch (e) {}
    if (!wa) return;
    try { wa.BackButton.onClick(function () { if (history.length > 1) history.back(); else location.hash = '#/'; }); } catch (e) {}
    window.addEventListener('hashchange', TG6.back); TG6.back();
  },
  back: function () { const wa = TG6.wa(); if (!wa) return; try { const h = location.hash; if (!h || h === '#/' || h === '#') wa.BackButton.hide(); else wa.BackButton.show(); } catch (e) {} },
  // يعيد رمز الجلسة، أو null بعد أن يعرض نموذج الطلب أو شاشة الانتظار
  login: async function () {
    let r;
    // الطلب بدأ مبكرًا من رأس الصفحة (TG_EARLY) مع تحميل الملفات، فلا يُنتظر بعدها؛ ومعه حزمة الحساب
    const early = window.TG_EARLY && TG_EARLY.init === TG6.init ? TG_EARLY.p : null; window.TG_EARLY = null;
    try {
      if (early) { const j = await early.catch(function () { return null; }); if (j && j.error) throw new Error(j.error); r = j && j.result != null ? (typeof j.result === 'string' ? JSON.parse(j.result) : j.result) : null; }
      if (!r) r = await API6.json('tg_login', TG6.init, '{"b":1}');
    } catch (e) { TG6.screen('تعذّر الدخول', e.message, null); return null; }
    if (r && r.token) { TG6.tgOnly = !!(r.me && r.me.tgOnly); TG6.me = r.me || null; if (r.bundle && r.bundle.programs) V6.preBundle = r.bundle; return r.token + '#tg#' + TG6.init; }
    if (r && r.pending) { TG6.screen('أهلاً بك في أثر 🌿', 'يتم مراجعة حسابك قبل قبول الدخول، وتصلك رسالة في البوت حين يُقبل.', null); return null; }
    TG6.request(r || {}); return null;
  },
  shell: function (kids) {
    splashHide(); const top = $('#top'); if (top) top.hidden = true;
    view(el('section', { class: 'tgx wrap page' }, [el('div', { class: 'lglogo' }, [brandImg('b')])].concat(kids)));
  },
  screen: function (title, text, acts) {
    TG6.shell([H('h1', title), el('p', { class: 'muted', text: text }), acts ? el('div', { class: 'row wrapr' }, acts) : null,
      el('button', { type: 'button', class: 'btn line', onclick: function () { try { TG6.wa().close(); } catch (e) {} } }, ['إغلاق'])]);
  },
  request: function (r) {
    const progs = r.programs || [];
    const nameI = el('input', { type: 'text', class: 'inp', value: r.name || '', maxlength: '80', autocomplete: 'name', 'aria-label': 'اسمك' });
    const userI = el('input', { type: 'text', class: 'inp', dir: 'ltr', value: String(r.user || '').toLowerCase().replace(/[^a-z0-9._\-]/g, '').slice(0, 30), maxlength: '30', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'اسم الدخول' });
    const progS = el('select', { class: 'inp', 'aria-label': 'البرنامج' }, progs.map(function (p) { return el('option', { value: p.id, text: p.name }); }));
    const trS = el('select', { class: 'inp', 'aria-label': 'المسار' });
    const fillTr = function () { const p = progs.find(function (x) { return x.id === progS.value; }) || { tracks: [] }; trS.replaceChildren.apply(trS, [el('option', { value: '', text: 'كل المسارات / لا أعرف' })].concat(p.tracks.map(function (t) { return el('option', { value: t.id, text: t.name }); }))); };
    progS.addEventListener('change', fillTr); fillTr();
    const msg = el('p', { class: 'err', role: 'alert' });
    const btn = el('button', { type: 'submit', class: 'btn dark lg', style: 'width:100%' }, ['اطلب الدخول']);
    const form = el('form', { class: 'lgform', onsubmit: async function (e) {
      e.preventDefault(); msg.textContent = ''; btn.disabled = true;
      try {
        await API6.json('tg_request', TG6.init, JSON.stringify({ name: nameI.value.trim(), username: userI.value.trim().toLowerCase(), program: progS.value, track: trS.value }));
        TG6.screen('وصل طلبك 🌿', 'يتم مراجعة حسابك قبل قبول الدخول، وتصلك رسالة في البوت حين يُقبل.', null);
      } catch (er) { msg.textContent = er.message; btn.disabled = false; }
    } }, [
      el('div', { class: 'fld' }, [el('label', { text: 'اسمك كما يعرفك فريقك' }), nameI]),
      el('div', { class: 'fld' }, [el('label', { text: 'اسم الدخول (تختاره أنت)' }), userI, el('small', { class: 'tiny', text: 'حروف إنجليزية صغيرة وأرقام ونقطة، يبدأ بحرف. به تدخل الموقع العادي إن جعلت لنفسك كلمة سر.' })]),
      el('div', { class: 'fld' }, [el('label', { text: 'برنامجك' }), progS]),
      el('div', { class: 'fld' }, [el('label', { text: 'مسارك' }), trS]),
      msg, btn]);
    TG6.shell([H('h1', 'اطلب الدخول إلى أثر'),
      el('p', { class: 'muted', text: 'أثر منصة تصميم إعلانات البرامج بهويتها. يُراجَع طلبك قبل قبول الدخول، ثم تدخل من تيليجرام بلا كلمة سر.' }),
      el('div', { class: 'card lgcard' }, [form]),
      el('p', { class: 'tiny', text: 'إن كان لك حساب في أثر فلا تطلب حساباً جديداً: ادخل الموقع، ومن «حسابي» اضغط «اربط تيليجرام».' })]);
  },
  expired: function () { TG6.screen('انتهت الجلسة', 'أغلق أثر وافتحه من البوت من جديد.', null); },
  // التصميم إلى المحادثة بجودته الكاملة
  deliver: async function (blob, name, meta) {
    toast('نرسل التصميم إلى المحادثة…');
    try {
      const b64 = await new Promise(function (ok, no) { const fr = new FileReader(); fr.onload = function () { ok(String(fr.result).split(',')[1] || ''); }; fr.onerror = no; fr.readAsDataURL(blob); });
      await API6.me('tg_deliver', JSON.stringify(Object.assign({ b64: b64, mime: blob.type, fileName: name }, meta || {})));
      try { TG6.wa().HapticFeedback.notificationOccurred('success'); } catch (e) {}
      modal({ title: 'وصلك في المحادثة ✓', body: [el('p', { class: 'muted', text: 'أرسلنا التصميم إلى محادثتك مع بوت أثر ملفاً بجودته الكاملة (' + (blob.size / 1048576).toFixed(1) + ' ميغابايت).' })],
        acts: [{ t: 'اذهب إلى المحادثة', cls: 'dark', fn: function () { try { TG6.wa().close(); } catch (e) {} } }, { t: 'أكمل هنا' }] });
      return true;
    } catch (e) { toast('تعذّر الإرسال: ' + e.message); return false; }
  },
  // كلمة سر للموقع العادي في المتصفح
  pwPage: function () {
    const me = V6.me || {};
    const pI = el('input', { type: 'password', class: 'inp', autocomplete: 'new-password', 'aria-label': 'كلمة السر' }), p2 = el('input', { type: 'password', class: 'inp', autocomplete: 'new-password', 'aria-label': 'أعد كتابتها' });
    const msg = el('p', { class: 'err', role: 'alert' });
    const form = el('form', { class: 'lgform', onsubmit: async function (e) {
      e.preventDefault(); msg.textContent = '';
      if (pI.value.length < 8) { msg.textContent = 'ثمانية أحرف على الأقل'; return; }
      if (pI.value !== p2.value) { msg.textContent = 'الكلمتان مختلفتان'; return; }
      try { const r = await API6.me('tg_site_pw', pI.value); V6.me.noPw = false; TG6.tgOnly = false; modal({ title: 'صارت لك كلمة سر ✓', body: [el('p', { class: 'muted', text: 'ادخل الموقع في المتصفح باسم المستخدم «' + r.username + '» وهذه الكلمة.' })], acts: [{ t: 'حسناً', cls: 'dark', fn: function () { go('#/'); } }] }); }
      catch (er) { msg.textContent = er.message; }
    } }, [el('div', { class: 'fld' }, [el('label', { text: 'كلمة السر (ثمانية أحرف على الأقل)' }), pI]), el('div', { class: 'fld' }, [el('label', { text: 'أعد كتابتها' }), p2]), msg,
      el('button', { type: 'submit', class: 'btn dark lg', style: 'width:100%' }, ['احفظ'])]);
    view(el('div', { class: 'wrap page tgx' }, [H('h1', 'كلمة سر للموقع'),
      el('p', { class: 'muted', text: 'دخولك من تيليجرام لا يحتاج كلمة سر، لأن تيليجرام نفسه يثبت أنه أنت. أما الموقع في متصفح الحاسوب أو الجوال فلا يعرف تيليجرام، فيسألك اسم المستخدم وكلمة السر.' }),
      el('p', {}, ['اسم المستخدم: ', el('bdi', { dir: 'ltr', text: me.username || '' })]),
      el('div', { class: 'card lgcard' }, [form])]));
  },
  // زر «اربط تيليجرام» البارز في الرأس (الموقع) وفي رأس الرئيسية (تطبيق الجوال): لمن لم يربط بعد، والبوت مضبوط
  needLink: function () { const me = V6.me || {}; return !!(me.bot && !me.tg && !TG6.on()); },
  // تُفتح النافذة قبل انتظار الخادم كي لا يمنعها المتصفح، ثم يوضع فيها رابط البوت
  linkGo: async function (btn) {
    let w = null; try { w = window.open('', '_blank'); } catch (e) {}
    if (btn) btn.disabled = true;
    try {
      const r = await API6.me('tg_link_code');
      if (w && !w.closed) w.location.href = r.url; else location.href = r.url;
      toast('في البوت اضغط «ابدأ»، فيُربط حسابك');
      // بعد عودته من تيليجرام: نعيد قراءة حسابه، فيختفي الزر إن رُبط
      window.addEventListener('focus', async function once() {
        window.removeEventListener('focus', once);
        try { const me = await API6.me('auth_me'); if (me && me.tg) { V6.me.tg = true; if (typeof buildTop === 'function') buildTop(); $$('.tglink').forEach(function (x) { x.remove(); }); toast('رُبط حسابك بتيليجرام ✓'); } } catch (e) {}
      });
    } catch (e) { try { if (w) w.close(); } catch (x) {} toast(e.message); }
    finally { if (btn) btn.disabled = false; }
  },
  linkBtn: function (cls) {
    if (!TG6.needLink()) return null;
    return el('button', { type: 'button', class: 'tglink ' + (cls || ''), title: 'اربط حسابك ببوت أثر في تيليجرام: تدخل منه بلا كلمة سر، ويصلك تصميمك في المحادثة', onclick: function (e) { TG6.linkGo(e.currentTarget); } }, [ico('send'), el('span', { text: 'اربط تيليجرام' })]);
  },
  // في الموقع: ربط الحساب بتيليجرام برمز لمرة واحدة
  linkCard: function () {
    const me = V6.me || {};
    return el('div', { class: 'card rv actg' }, [el('h2', { class: 'ch', text: 'بوت أثر في تيليجرام' }),
      el('p', { class: 'muted small', text: me.tg ? 'حسابك مربوط بتيليجرام: تدخل أثر من البوت بلا كلمة سر، ويصلك تصميمك في المحادثة.' : 'اربط حسابك بتيليجرام لتدخل أثر من البوت بلا كلمة سر، ويصلك تصميمك في المحادثة بجودته الكاملة.' }),
      el('div', { class: 'row wrapr' }, [el('button', { type: 'button', class: 'btn ' + (me.tg ? 'line' : 'dark'), onclick: function (e) {
        return TG6.linkGo(e.currentTarget);
      } }, [ico('send'), me.tg ? 'اربط حساباً آخر في تيليجرام' : 'اربط تيليجرام'])])]);
  }
};
TG6.start();
if (typeof route6 === 'function') route6(/^\/tgpw$/, function () { if (!TG6.on()) return go('#/account'); TG6.pwPage(); }, { page: 'account', noVT: true });
