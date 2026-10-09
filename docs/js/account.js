/* ================= الحساب: الدخول البسيط والتفضيلات والجولة التعريفية ================= */
/* الدخول اسم ورمز من أربعة أرقام، والغرض أن يتذكر الموقع تخصيصات كل مرب وقوالبه.
   على جوجل: الحسابات في مجلد «بيانات الموقع». وبدون خادم: في هذا المتصفح. */
const PREFS = { logos: {}, themes: [], tour: {}, fonts: null, lastTrack: '' };
let USER = null;       // {name, token}
/* الاتصال بالخادم: داخل Apps Script عبر google.script.run، أو من GitHub Pages عبر رابط الخادم في config.js */
const API = {
  ok: null,
  mode: function () {
    if (window.google && google.script && google.script.run) return 'gas';
    if (typeof API_URL !== 'undefined' && /^(https:|http:\/\/localhost)/.test(API_URL)) return 'http';
    return '';
  },
  has: function () { return !!API.mode(); },
  call: function (fn) {
    const args = Array.prototype.slice.call(arguments, 1);
    if (API.mode() === 'gas') return new Promise(function (ok, bad) { const r = google.script.run.withSuccessHandler(ok).withFailureHandler(bad); r[fn].apply(r, args); });
    // طلب بسيط بلا ملفات تعريف الارتباط: لا يمر بنظام دخول جوجل، فلا تظهر مشكلة تعدد الحسابات
    return fetch(API_URL, { method: 'POST', body: JSON.stringify({ fn: fn, args: args }), redirect: 'follow', credentials: 'omit' })
      .then(function (r) { if (!r.ok) throw new Error('تعذّر الاتصال بالخادم (' + r.status + ')'); return r.json(); })
      .then(function (j) { if (j.error) throw new Error(j.error); return j.result; });
  },
  probe: async function () {
    if (API.ok !== null) return API.ok;
    if (!API.has()) return (API.ok = false);
    try { await API.call('api_ping'); API.ok = true; } catch (e) { API.ok = false; }
    return API.ok;
  }
};
/* حزم القوالب الأسبوعية: من نسخة محفوظة في المتصفح فوراً، ثم تُحدَّث من الخادم في الخلفية */
function injectPacks(list) {
  (list || []).forEach(function (p) {
    const s = document.createElement('script');
    s.text = 'try {\n' + p.code + '\n} catch (e) { console.error("pack", ' + JSON.stringify(String(p.name)) + ', e); }';
    document.head.appendChild(s);
  });
}
async function loadPacks() {
  if (API.mode() !== 'http') return;   // داخل Apps Script تأتي الحزم مع الصفحة
  const cached = store('jz1.packs');
  const fresh = API.call('api_packs').then(function (t) { return JSON.parse(t); });
  if (cached && cached.list) {
    injectPacks(cached.list);
    fresh.then(function (list) {
      const sig = JSON.stringify(list.map(function (p) { return [p.name, p.at]; }));
      if (sig !== cached.sig) { store('jz1.packs', { sig: sig, list: list }); injectPacks(list); toast('أُضيفت قوالب جديدة إلى البوابة.'); if (!$('.editor')) route(); }
    }).catch(function () {});
    return;
  }
  try {
    const list = await Promise.race([fresh, new Promise(function (_, bad) { setTimeout(function () { bad(new Error('timeout')); }, 8000); })]);
    store('jz1.packs', { sig: JSON.stringify(list.map(function (p) { return [p.name, p.at]; })), list: list });
    injectPacks(list);
  } catch (e) { console.warn('packs', e); }
}
function userKey(name) { return norm(String(name || '').trim()).replace(/\s+/g, ' '); }

async function hashPin(name, pin) {   // للحفظ المحلي فقط
  const s = 'jz|' + userKey(name) + '|' + pin;
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(b)).map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  catch (e) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return 'h' + h; }
}
async function login(name, pin) {
  name = String(name || '').trim(); pin = String(pin || '').trim();
  if (name.length < 2) throw new Error('اكتب اسمك كما يعرفك زملاؤك');
  if (!/^[0-9٠-٩]{4}$/.test(pin)) throw new Error('الرمز أربعة أرقام');
  pin = pin.replace(/[٠-٩]/g, function (c) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)); });
  if (await API.probe()) {
    const r = JSON.parse(await API.call('api_login', name, pin));
    USER = { name: r.name, token: r.token, isNew: r.isNew };
    applyPrefs(r.prefs || {}); store('jz1.prefcache', r.prefs || {});
  } else {
    const users = store('jz1.users') || {}, k = userKey(name), h = await hashPin(name, pin);
    if (users[k] && users[k].h !== h) throw new Error('الرمز لا يطابق هذا الاسم. إن نسيته فادخل باسم مختلف قليلاً، أو اطلب من المشرف مسحه.');
    const isNew = !users[k];
    if (isNew) { users[k] = { name: name, h: h, prefs: {} }; store('jz1.users', users); }
    USER = { name: users[k].name, token: 'local:' + k, isNew: isNew };
    applyPrefs(users[k].prefs || {});
  }
  store('jz1.session', USER);
  return USER;
}
function logout() { USER = null; store('jz1.session', 'out'); store('jz1.prefcache', {}); Object.assign(PREFS, { logos: {}, themes: [], tour: {}, fonts: null, lastTrack: '' }); applyFonts(); }
function applyPrefs(p) {
  PREFS.logos = p.logos || {}; PREFS.themes = p.themes || []; PREFS.tour = p.tour || {}; PREFS.fonts = p.fonts || null; PREFS.lastTrack = p.lastTrack || '';
  applyFonts();
}
function applyFonts() {
  const f = PREFS.fonts || store('jz1.fonts');
  FS.title = 'tajarib'; FS.body = 'tajarib'; FS.tw = '';
  if (f) { if (FONTS[f.title]) FS.title = f.title; if (FONTS[f.body]) FS.body = f.body; FS.tw = f.tw || ''; }
}
let prefT = 0;
function savePrefs() {
  clearTimeout(prefT);
  prefT = setTimeout(async function () {
    if (!USER) { store('jz1.guestprefs', PREFS); return; }
    if (USER.token.slice(0, 6) === 'local:') {
      const users = store('jz1.users') || {}, k = USER.token.slice(6);
      if (users[k]) { users[k].prefs = JSON.parse(JSON.stringify(PREFS)); store('jz1.users', users); }
      return;
    }
    store('jz1.prefcache', PREFS);
    try { await API.call('api_prefs', USER.token, JSON.stringify(PREFS)); } catch (e) { console.warn('prefs', e); }
  }, 600);
}
async function restoreSession() {
  const s = store('jz1.session');
  if (s && s !== 'out' && s !== 'guest' && s.token) {
    USER = s;
    if (s.token.slice(0, 6) === 'local:') { const u = (store('jz1.users') || {})[s.token.slice(6)]; if (u) applyPrefs(u.prefs || {}); else USER = null; }
    else {
      // نعرض الموقع فوراً بتفضيلات محفوظة في المتصفح، ونتحقق من الحساب في الخلفية
      applyPrefs(store('jz1.prefcache') || {});
      (async function () {
        if (!(await API.probe())) return;
        try { const r = JSON.parse(await API.call('api_me', s.token)); USER.name = r.name; applyPrefs(r.prefs || {}); store('jz1.prefcache', r.prefs || {}); userChip(); }
        catch (e) { USER = null; store('jz1.session', 'out'); userChip(); }
      })();
    }
  } else if (s === 'guest') { applyPrefs(store('jz1.guestprefs') || {}); }
  return s;
}
function userChip() {
  const box = $('#userbox'); if (!box) return;
  box.innerHTML = '';
  box.appendChild(el('button', { type: 'button', class: 'tbtn', title: 'جولة تعريفية بالموقع', onclick: function () { startTour(pageKind(), true); } }, [el('span', { class: 'q', text: '؟' }), el('span', { class: 'lg', text: 'جولة' })]));
  if (USER) box.appendChild(el('button', { type: 'button', class: 'tbtn user', title: 'حسابك', onclick: accountMenu }, [el('span', { class: 'av', text: USER.name.trim().slice(0, 1) }), el('span', { class: 'lg', text: USER.name })]));
  else box.appendChild(el('button', { type: 'button', class: 'tbtn', onclick: function () { showWelcome(true); } }, [el('span', { text: 'دخول' })]));
}
function accountMenu() {
  const old = $('.saved'); if (old) old.remove();
  const dlg = el('div', { class: 'saved', role: 'dialog', 'aria-label': 'حسابك' }, [el('div', { class: 'sv' }, [
    el('b', { text: 'مرحباً ' + USER.name }),
    el('p', { text: 'يتذكر الموقع خطوطك وألوانك المحفوظة ونسخ الشعارات وقوالبك، فتجدها كلما دخلت باسمك' + (USER.token.slice(0, 6) === 'local:' ? ' من هذا المتصفح.' : ' من أي جهاز.') }),
    el('p', { text: 'ألوانك المحفوظة: ' + PREFS.themes.length + '  ·  قوالبك: تجدها في «قوالبي» داخل أي مسار.' }),
    el('div', { class: 'sbrow' }, [
      el('button', { type: 'button', class: 'btn', text: 'خروج', onclick: function () { logout(); dlg.remove(); userChip(); showWelcome(true); } }),
      el('button', { type: 'button', class: 'btn main', text: 'إغلاق', onclick: function () { dlg.remove(); } })
    ])
  ])]);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.remove(); });
  document.body.appendChild(dlg);
}

/* ---------- شاشة الترحيب ---------- */
function showWelcome(force) {
  const old = $('.welcome'); if (old) old.remove();
  const nameI = el('input', { type: 'text', autocomplete: 'name', placeholder: 'مثل: أ. خالد العمر', 'aria-label': 'اسمك' });
  const pinI = el('input', { type: 'password', inputmode: 'numeric', maxlength: '4', autocomplete: 'current-password', placeholder: '••••', 'aria-label': 'رمزك من أربعة أرقام', class: 'pin' });
  const msg = el('p', { class: 'wmsg', role: 'status' });
  const go = el('button', { type: 'submit', class: 'btn main wide', text: 'دخول' });
  const form = el('form', { class: 'wform', onsubmit: async function (e) {
    e.preventDefault(); msg.textContent = 'لحظة…'; go.disabled = true;
    try { await login(nameI.value, pinI.value); msg.textContent = ''; close(); if (USER.isNew) toast('أهلاً ' + USER.name + '، أُنشئ حسابك. احفظ رمزك لتدخل به لاحقاً.'); }
    catch (err) { msg.textContent = err.message || String(err); }
    go.disabled = false;
  } }, [
    el('label', { class: 'fld' }, [el('span', { text: 'اسمك' }), nameI]),
    el('label', { class: 'fld' }, [el('span', { text: 'رمزك (أربعة أرقام)' }), pinI]),
    go, msg,
    el('p', { class: 'wnote', text: 'أول مرة؟ اكتب اسمك واختر أي أربعة أرقام، فيُنشأ لك حساب يحفظ ألوانك وقوالبك وتفضيلاتك.' }),
    el('button', { type: 'button', class: 'link', text: 'تصفّح دون دخول', onclick: function () { store('jz1.session', 'guest'); applyPrefs(store('jz1.guestprefs') || {}); close(); } })
  ]);
  const fan = el('div', { class: 'fan', 'aria-hidden': 'true' });
  const picks = [['ann_night', 'tiryaq', 'post'], ['ann_cards', 'ithmar', 'post'], ['story_quote', 'budhoor', 'story'], ['ann_circle', 'judhoor', 'post'], ['ann_program', 'ishraq', 'post']];
  picks.forEach(function (p, i) {
    const tpl = TEMPLATES.find(function (t) { return t.id === p[0]; }), T = TRACKS[p[1]]; if (!tpl || !T) return;
    const c = el('canvas', { class: 'fc f' + i });
    fan.appendChild(c);
    setTimeout(function () { renderTo(c, tpl, p[2], { d: defaults(tpl, T), variant: tpl.variants[0].id, k: 1 }, T, 0.26); }, 60 + i * 50);
  });
  const stripes = el('div', { class: 'stripes', 'aria-hidden': 'true' }, [ACADEMY.orange, ACADEMY.red, ACADEMY.purple, ACADEMY.teal].map(function (c, i) { return el('i', { style: 'background:' + c + ';animation-delay:' + (i * 0.12) + 's' }); }));
  const w = el('div', { class: 'welcome', role: 'dialog', 'aria-label': 'مرحباً بك' }, [
    el('div', { class: 'wbg' }, [stripes]),
    el('div', { class: 'win' }, [
      el('div', { class: 'wtext' }, [
        el('img', { src: ASSETS.lg_academy, alt: 'أكاديمية الجيل الصاعد', class: 'wlogo' }),
        el('h1', { text: 'البوابة الإعلامية للبرامج الإلكترونية' }),
        el('p', { class: 'lead', text: 'صمّم إعلانات مسارك ونشاطك بهويتها الرسمية: اختر القالب، واكتب، وحمّل بجودة عالية. لا تحتاج مصمماً، ولا تخرج الهوية عن أصلها.' }),
        el('ul', { class: 'wfeat' }, ['خمسة مسارات وأنشطة تربوية، والقوالب نفسها لكلٍّ منها', 'قصص ومنشورات لمواقع التواصل، وشرائح للعروض', 'مساعد يقترح عليك التصميم من المعلومات التي تكتبها'].map(function (t) { return el('li', { text: t }); })),
        fan
      ]),
      el('div', { class: 'wcard' }, [el('h2', { text: 'ادخل باسمك' }), form])
    ])
  ]);
  function close() { w.classList.add('out'); setTimeout(function () { w.remove(); }, 350); userChip(); route(); setTimeout(function () { startTour(pageKind()); }, 500); }
  document.body.appendChild(w);
  setTimeout(function () { nameI.focus(); }, 300);
}
function toast(t) {
  const o = $('.toast'); if (o) o.remove();
  const e = el('div', { class: 'toast', role: 'status', text: t }); document.body.appendChild(e);
  setTimeout(function () { e.classList.add('out'); setTimeout(function () { e.remove(); }, 400); }, 4200);
}

/* ---------- الجولة التعريفية ---------- */
function pageKind() {
  if ($('.deck')) return 'deck';
  if ($('.editor')) return 'editor';
  if ($('.gallery.all') || $('.entries')) return 'gallery';
  return 'home';
}
const TOURS = {
  home: [
    ['.hero', 'أهلاً بك في البوابة', 'من هنا تصمّم إعلانات المسارات والأنشطة بهويتها الرسمية. نأخذ جولة سريعة في دقيقة.'],
    ['[data-tour=quick]', 'اختصارات سريعة', 'اصنع إعلاناً من معلوماتك، أو قصصاً لمواقع التواصل، أو عرض شرائح، أو افتح قوالبك المحفوظة.'],
    ['[data-tour=tracks]', 'المسارات', 'كل مسار بهويته: شعاره وألوانه. والقوالب نفسها موجودة في كل المسارات.'],
    ['[data-tour=acts]', 'الأنشطة التربوية', 'هويات الأنشطة مثل ترياق والملتقى الجامعي ورفاق الأنشطة، وتستعمل القوالب كلها كذلك.'],
    ['#userbox', 'حسابك والجولة', 'من هنا تدخل باسمك ليحفظ الموقع ألوانك وقوالبك، وتعيد هذه الجولة متى شئت.']
  ],
  gallery: [
    ['.entries', 'ثلاث طرق للبدء', '«اصنع إعلانك»: تكتب المعلومات فنقترح التصاميم. «المصمم المساعد»: صفحة بيضاء ومساعد. «قوالبي»: ما حفظته.'],
    ['.search', 'البحث', 'اكتب ما تريد: مسابقة، شكر، قصة، جدول…'],
    ['.chips', 'أنواع التصاميم', 'إعلانات ومقرر يومي ومسابقات وتهنئة وعبارات ومواقع تواصل وأغلفة ويوتيوب.'],
    ['.gallery', 'القوالب', 'اضغط أي قالب لتعديله. الشارة في الزاوية تخبرك بنوعه.']
  ],
  editor: [
    ['.tabs', 'لوحة التعديل', 'المحتوى للنصوص والصور، والمكتبة للعناصر الإضافية، والألوان، والخط، والعناصر للإظهار والإخفاء.'],
    ['.stage', 'المعاينة', 'ما تراه هو ما سيُحمَّل. اضغط أي عنصر لتحريكه، فتظهر مواضع مقترحة له.'],
    ['[data-tour=idsw]', 'غيّر الهوية', 'انقل التصميم نفسه بنصوصه إلى أي مسار أو نشاط آخر بضغطة.'],
    ['.actions', 'التحميل والحفظ', 'حمّل بجودة عالية، أو احفظه قالباً لك لتبدأ منه كل مرة.']
  ],
  deck: [
    ['.strip', 'الشرائح', 'هنا شرائح العرض. اضغط شريحة لتعديلها، وأضف شرائح جديدة من الزر +.'],
    ['.tabs', 'المحتوى والتخطيط', 'اكتب نص الشريحة، أو غيّر تخطيطها، أو ألوان العرض كله.'],
    ['.actions', 'التحميل', 'حمّل العرض كاملاً ملف PDF، أو الشريحة الحالية صورة.']
  ]
};
function startTour(kind, force) {
  if (!force && PREFS.tour[kind]) return;
  if ($('.welcome') || $('.tour')) return;
  const steps = (TOURS[kind] || []).filter(function (s) { return $(s[0]); });
  if (!steps.length) return;
  let i = 0;
  const hole = el('div', { class: 'thole' }), tip = el('div', { class: 'ttip', role: 'dialog' });
  const wrap = el('div', { class: 'tour' }, [hole, tip]);
  document.body.appendChild(wrap);
  function end() { wrap.remove(); PREFS.tour[kind] = 1; savePrefs(); window.removeEventListener('resize', show); }
  function show() {
    const s = steps[i], t = $(s[0]); if (!t) return end();
    t.scrollIntoView({ block: 'center', behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
    const r = t.getBoundingClientRect(), pad = 8;
    Object.assign(hole.style, { left: (r.left - pad) + 'px', top: (r.top - pad) + 'px', width: (r.width + pad * 2) + 'px', height: Math.min(r.height + pad * 2, innerHeight * 0.7) + 'px' });
    tip.innerHTML = '';
    tip.appendChild(el('small', { text: (i + 1) + ' من ' + steps.length }));
    tip.appendChild(el('b', { text: s[1] })); tip.appendChild(el('p', { text: s[2] }));
    tip.appendChild(el('div', { class: 'sbrow' }, [
      el('button', { type: 'button', class: 'btn main', text: i === steps.length - 1 ? 'تم' : 'التالي', onclick: function () { if (++i >= steps.length) end(); else show(); } }),
      i ? el('button', { type: 'button', class: 'btn', text: 'السابق', onclick: function () { i--; show(); } }) : null,
      el('button', { type: 'button', class: 'link', text: 'تخطي الجولة', onclick: end })
    ]));
    const below = r.bottom + 200 < innerHeight;
    const tw = Math.min(340, innerWidth - 24);
    tip.style.width = tw + 'px';
    tip.style.left = Math.max(12, Math.min(innerWidth - tw - 12, r.left + r.width / 2 - tw / 2)) + 'px';
    tip.style.top = (below ? Math.min(r.bottom + 16, innerHeight - 190) : Math.max(12, r.top - 200)) + 'px';
  }
  window.addEventListener('resize', show);
  setTimeout(show, 50);
}

/* ---------- الألوان المحفوظة ---------- */
function themesBlock(body, onApply) {
  body.appendChild(el('h3', { class: 'sh', text: 'ألواني المحفوظة' }));
  const has1 = Object.keys(S.ov).some(function (k) { return S.ov[k]; });
  if (!PREFS.themes.length) body.appendChild(el('p', { class: 'note', text: has1 ? 'احفظ الألوان المخصصة الحالية لتجدها هنا في كل قالب.' : 'حين تختار ألواناً مخصصة يمكنك حفظها هنا، فتجدها في كل قالب وكل مرة تدخل.' }));
  else body.appendChild(el('div', { class: 'themes' }, PREFS.themes.map(function (t, i) {
    const on = S.ov.bg === t.bg && S.ov.title === t.title && S.ov.accent === t.accent;
    return el('div', { class: 'theme' + (on ? ' on' : '') }, [
      el('button', { type: 'button', class: 'tapply', title: 'تطبيق', onclick: function () { const o = {}; ['bg', 'title', 'accent'].forEach(function (k) { if (t[k]) o[k] = t[k]; }); onApply(o); } }, [
        el('span', { class: 'dots' }, ['bg', 'title', 'accent'].map(function (k) { return el('i', { style: 'background:' + (t[k] || '#ffffff') }); })), el('span', { text: t.name })]),
      el('button', { type: 'button', class: 'x', title: 'حذف', 'aria-label': 'حذف ' + t.name, text: '×', onclick: function () { PREFS.themes.splice(i, 1); savePrefs(); buildEditor(true); } })
    ]);
  })));
  if (has1) {
    const nm = el('input', { type: 'text', placeholder: 'اسم لهذه الألوان', value: 'ألواني ' + (PREFS.themes.length + 1), 'aria-label': 'اسم الألوان' });
    body.appendChild(el('div', { class: 'tsave' }, [nm, el('button', { type: 'button', class: 'mini accent', text: 'احفظ الألوان الحالية', onclick: function () {
      PREFS.themes.push({ name: nm.value || 'ألواني', bg: S.ov.bg || '', title: S.ov.title || '', accent: S.ov.accent || '' }); savePrefs(); buildEditor(true);
      if (!USER) toast('حُفظت في هذا المتصفح. ادخل باسمك لتجدها على كل أجهزتك.');
    } })]));
  }
}
