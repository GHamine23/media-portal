/* ================= الدخول والحساب والرأس ================= */
function brandImg(kind, cls) { return el('img', { src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(BRAND[kind]), alt: 'منصة الأثر الإعلامي', class: cls || '' }); }

/* ---------- صفحة الدخول ---------- */
function floatCards() {
  // بطاقات تصميم مجردة تطفو بهدوء: إيحاء بالقوالب دون هوية برنامج بعينه
  const wrap = el('div', { class: 'fcards', 'aria-hidden': 'true' });
  [['#111', '#fff', -9, 0], ['#f7f7f7', '#111', 4, 1], ['#e9e6ff', '#6d60fc', -3, 2], ['#fff1e6', '#f88833', 8, 3], ['#e8f5ec', '#36a660', -6, 4]].forEach(function (c, i) {
    wrap.appendChild(el('div', { class: 'fc fc' + i, style: '--bg:' + c[0] + ';--fg:' + c[1] + ';--r:' + c[2] + 'deg;--d:' + c[3] }, [
      el('i', { class: 'l1' }), el('i', { class: 'l2' }), el('i', { class: 'l3' }), el('b')
    ]));
  });
  return wrap;
}
function showLogin() {
  document.title = 'الدخول — منصة الأثر الإعلامي';
  $('#top').hidden = true; $('#banner').innerHTML = '';
  const idI = el('input', { type: 'text', id: 'lg_id', autocomplete: 'username', dir: 'auto', placeholder: 'اسم المستخدم أو البريد', required: true });
  const pwI = el('input', { type: 'password', id: 'lg_pw', autocomplete: 'current-password', placeholder: '••••••••', required: true });
  const eye = el('button', { type: 'button', class: 'ib', 'aria-label': 'إظهار كلمة المرور', onclick: function () { pwI.type = pwI.type === 'password' ? 'text' : 'password'; eye.replaceChildren(ico(pwI.type === 'password' ? 'eye' : 'eyeoff')); } }, [ico('eye')]);
  const msg = el('p', { class: 'err', role: 'alert' });
  const btn = el('button', { type: 'submit', class: 'btn dark lg', style: 'width:100%' }, ['دخول']);
  const form = el('form', { class: 'lgform', onsubmit: async function (e) {
    e.preventDefault(); msg.textContent = ''; btn.disabled = true; btn.replaceChildren(el('span', { class: 'spin', style: 'width:18px;height:18px;border-color:#555;border-top-color:#fff' }));
    try {
      const r = await API6.json('auth_login', idI.value, pwI.value);
      V6.token = r.token; V6.me = r.me; ls('token', r.token);
      if (r.me.mustChange) return showChangePw(true);
      await afterLogin();
    } catch (err) { msg.textContent = err.message || String(err); form.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 320 }); }
    btn.disabled = false; btn.replaceChildren('دخول');
  } }, [
    el('div', { class: 'fld' }, [el('label', { for: 'lg_id', text: 'اسم المستخدم أو البريد' }), idI]),
    el('div', { class: 'fld' }, [el('label', { for: 'lg_pw', text: 'كلمة المرور' }), el('div', { class: 'pwrow' }, [pwI, eye])]),
    msg, btn,
    el('button', { type: 'button', class: 'linkbtn', text: 'نسيت كلمة المرور؟', onclick: function () {
      modal({ title: 'نسيت كلمة المرور', body: [el('p', { class: 'muted', text: 'كلمات المرور محفوظة مشفّرة، فلا يمكن لأحد استرجاعها. اطلب من مشرف برنامجك كلمة مرور مؤقتة جديدة، ثم اختر كلمتك عند أول دخول.' })], acts: [{ t: 'فهمت', cls: 'dark' }] });
    } })
  ]);
  view(el('section', { class: 'login' }, [
    el('div', { class: 'lgside' }, [floatCards()]),
    el('div', { class: 'lgmain' }, [
      el('div', { class: 'lglogo rv' }, [brandImg('b')]),
      H('h1', 'ادخل إلى منصتك', 'lgh'),
      el('p', { class: 'muted rv', style: '--d:2', text: 'قوالب بهوية برنامجك، ومحرر سهل، ومساعد يصمّم معك.' }),
      el('div', { class: 'card lgcard rv', style: '--d:3' }, [form]),
      el('p', { class: 'tiny rv', style: '--d:4', text: 'لا يوجد تسجيل ذاتي. حسابك ينشئه مدير المنصة أو مشرف برنامجك.' })
    ])
  ]));
  setTimeout(function () { idI.focus(); }, 300);
}

/* ---------- تغيير كلمة المرور (إجباري بعد المؤقتة) ---------- */
function pwStrength(p) { let s = 0; if (p.length >= 8) s++; if (p.length >= 12) s++; if (/[a-z؀-ۿ]/i.test(p) && /\d/.test(p)) s++; if (/[^\w؀-ۿ]/.test(p)) s++; return s; }
function showChangePw(forced) {
  $('#top').hidden = !!forced;
  const oldI = el('input', { type: 'password', id: 'cp_old', autocomplete: 'current-password' });
  const newI = el('input', { type: 'password', id: 'cp_new', autocomplete: 'new-password', minlength: '8' });
  const rep = el('input', { type: 'password', id: 'cp_rep', autocomplete: 'new-password' });
  const bar = el('div', { class: 'pwbar' }, [el('i'), el('i'), el('i'), el('i')]);
  const hint = el('small', { text: 'ثمانية أحرف على الأقل، والأفضل أن تجمع حروفاً وأرقاماً.' });
  newI.addEventListener('input', function () { const s = pwStrength(newI.value); $$('i', bar).forEach(function (x, i) { x.className = i < s ? 'on s' + s : ''; }); });
  const msg = el('p', { class: 'err', role: 'alert' });
  const form = el('form', { class: 'lgform', onsubmit: async function (e) {
    e.preventDefault(); msg.textContent = '';
    if (newI.value !== rep.value) { msg.textContent = 'كلمتا المرور غير متطابقتين'; return; }
    try { V6.me = await API6.me('auth_password', oldI.value, newI.value); toast('حُفظت كلمة المرور الجديدة'); if (forced) await afterLogin(); else go('#/account'); }
    catch (err) { msg.textContent = err.message; }
  } }, [
    el('div', { class: 'fld' }, [el('label', { for: 'cp_old', text: forced ? 'كلمة المرور المؤقتة' : 'كلمة المرور الحالية' }), oldI]),
    el('div', { class: 'fld' }, [el('label', { for: 'cp_new', text: 'كلمة المرور الجديدة' }), newI, bar, hint]),
    el('div', { class: 'fld' }, [el('label', { for: 'cp_rep', text: 'أعد كتابتها' }), rep]),
    msg, el('button', { type: 'submit', class: 'btn dark lg', style: 'width:100%' }, ['حفظ ومتابعة'])
  ]);
  view(el('section', { class: 'login one' }, [el('div', { class: 'lgmain' }, [
    el('div', { class: 'lglogo rv' }, [brandImg('c')]),
    H('h2', forced ? 'أهلاً ' + (V6.me ? V6.me.name : '') + '، اختر كلمة مرورك' : 'تغيير كلمة المرور'),
    el('p', { class: 'muted rv', style: '--d:2', text: forced ? 'دخلت بكلمة مؤقتة. اختر كلمتك الخاصة، فلا يعرفها غيرك.' : 'ستحتاجها في دخولك القادم من أي جهاز.' }),
    el('div', { class: 'card lgcard rv', style: '--d:3' }, [form])
  ])]));
  setTimeout(function () { oldI.focus(); }, 300);
}

/* ---------- بعد الدخول ---------- */
async function afterLogin() {
  view(el('div', { class: 'boot' }, [brandImg('c', 'bootlogo'), el('p', { class: 'muted', text: 'نجهّز هوية برنامجك…' }), el('div', { class: 'bootbar' }, [el('i')])]));
  try { await loadBundle(); }
  catch (e) { view(el('div', { class: 'boot' }, [el('p', { class: 'err', text: 'تعذّر تحميل المنصة: ' + e.message }), el('button', { class: 'btn dark', text: 'إعادة المحاولة', onclick: afterLogin })])); return; }
  setMotion((V6.me.prefs && V6.me.prefs.motion) || 'calm');
  buildTop(); loadNews();
  const after = ls('after'); ls('after', null);
  go(after && after !== '/login' ? '#' + after : '#/');
  setTimeout(function () { maybeTour('home'); }, 900);
}
async function restore() {
  V6.token = ls('token') || '';
  if (!V6.token) return false;
  try { V6.me = await API6.me('auth_me'); }
  catch (e) { V6.token = ''; ls('token', null); return false; }
  if (V6.me.mustChange) { showChangePw(true); return 'must'; }
  await loadBundle();
  setMotion((V6.me.prefs && V6.me.prefs.motion) || 'calm');
  buildTop(); loadNews();
  return true;
}
function isAdmin() { return V6.me && (V6.me.role === 'super' || V6.me.role === 'sup'); }
function isSuper() { return V6.me && V6.me.role === 'super'; }
function can(p) { return V6.me && (V6.me.role !== 'user' || !!(V6.me.perms && V6.me.perms[p])); }
// خيار مواقع التواصل: يتاح للمشرفين ومن مُنح الصلاحية، وإن سمح به البرنامج
function canSocial() { return can('social') && !(V6.prog && V6.prog.features && V6.prog.features.social === false); }
async function logout() { flushEv(); try { await API6.call('auth_logout', V6.token); } catch (e) {} V6.token = ''; ls('token', null); V6.me = null; go('#/login'); }
async function savePrefs6(patch) { V6.me.prefs = Object.assign({}, V6.me.prefs || {}, patch); try { await API6.call('prefs_save', V6.token, JSON.stringify(V6.me.prefs)); } catch (e) {} }

/* ---------- الرأس ---------- */
function buildTop() {
  const top = $('#top'); top.hidden = false; top.innerHTML = '';
  const nav = el('nav', { class: 'nav', 'aria-label': 'التنقل' }, [
    el('a', { href: '#/', 'data-r': 'home', text: 'الرئيسية' }),
    el('a', { href: '#/mine', 'data-r': 'mine', text: 'تصاميمي' }),
    el('a', { href: '#/make', 'data-r': 'make', text: 'اصنع إعلانك' }),
    isAdmin() ? el('a', { href: '#/admin', 'data-r': 'admin', text: 'الإدارة' }) : null
  ]);
  const progs = V6.bundle.programs;
  const psw = el('button', { type: 'button', class: 'prog-sw', id: 'progsw', 'aria-label': 'تبديل البرنامج', onclick: function () {
    if (progs.length < 2) return;
    popMenu(psw, [{ hd: 'برامجك' }].concat(progs.map(function (p) { return { t: p.name, sw: p.color, fn: async function () { await useProgram(p.id); buildTop(); go('#/'); toast('انتقلت إلى ' + p.name); } }; })));
  } }, [el('i', { style: 'background:' + (V6.prog ? V6.prog.color : '#000') }), el('span', { text: V6.prog ? V6.prog.name : 'لا برنامج' }), progs.length > 1 ? ico('chevd') : null]);
  const bell = el('button', { type: 'button', class: 'ib', id: 'bell', title: 'ما الجديد', 'aria-label': 'ما الجديد', onclick: showNews }, [ico('bell')]);
  const fb = el('button', { type: 'button', class: 'ib', id: 'fbbtn', title: 'أبلغ عن مشكلة أو اقترح فكرة', 'aria-label': 'ملاحظة', onclick: function () { showFeedback6(); } }, [ico('chat')]);
  const av = el('button', { type: 'button', class: 'avatar', id: 'avatar', 'aria-label': 'حسابك', text: String(V6.me.name || '؟').trim().replace(/^(أ\.|د\.|م\.)\s*/, '').slice(0, 1), onclick: function () {
    popMenu(av, [{ hd: V6.me.name + ' · ' + (V6.me.roleName || '') },
      { t: 'حسابي', ic: 'user', href: '#/account' },
      { t: 'تصاميمي', ic: 'grid', href: '#/mine' },
      isAdmin() ? { t: 'لوحة الإدارة', ic: 'gear', href: '#/admin' } : null,
      { t: 'ملاحظة للفريق', ic: 'chat', fn: function () { showFeedback6(); } },
      { t: 'جولة تعريفية', ic: 'play', fn: function () { maybeTour(document.body.dataset.page || 'home', true); } },
      '-', { t: 'خروج', ic: 'logout', fn: logout }].filter(Boolean));
  } });
  top.appendChild(el('div', { class: 'wrap in' }, [
    el('a', { href: '#/', class: 'logo', 'aria-label': 'الرئيسية' }, [brandImg('c', 'lg-full'), brandImg('mark', 'lg-mark')]), nav, el('span', { class: 'sp' }), psw, fb, bell, av
  ]));
  markNav();
}
function markNav() { const pg = document.body.dataset.page || ''; $$('.nav a').forEach(function (a) { a.classList.toggle('on', a.dataset.r === pg); }); }
window.addEventListener('scroll', function () { const t = $('#top'); if (t) t.classList.toggle('scrolled', scrollY > 4); }, { passive: true });

/* ---------- حسابي ---------- */
async function showAccount() {
  const me = V6.me;
  const motion = segOf([['calm', 'هادئة'], ['normal', 'متوسطة'], ['lively', 'حيوية']], (me.prefs && me.prefs.motion) || 'calm', function (v) { setMotion(v); savePrefs6({ motion: v }); toast('حُفظ'); });
  const fbList = el('div', { class: 'fblist' }, [el('div', { class: 'skel', style: 'height:80px' })]);
  view(el('div', { class: 'wrap page' }, [
    el('div', { class: 'phead' }, [H('h1', 'حسابي'), el('p', { class: 'muted rv', text: me.name + ' · ' + (me.roleName || '') + (me.email ? ' · ' + me.email : '') })]),
    el('div', { class: 'grid two' }, [
      el('div', { class: 'card rv' }, [el('h3', { text: 'بياناتك' }),
        el('dl', { class: 'kv' }, [el('dt', { text: 'اسم المستخدم' }), el('dd', { dir: 'auto', text: me.username }), el('dt', { text: 'البرامج' }), el('dd', { text: (me.programsInfo || []).map(function (p) { return p.name; }).join('، ') || '—' }),
          el('dt', { text: 'الصلاحيات' }), el('dd', { text: permsText(me) })]),
        el('div', { class: 'row' }, [el('a', { class: 'btn dark', href: '#/password', text: 'تغيير كلمة المرور' })])]),
      el('div', { class: 'card rv', style: '--d:1' }, [el('h3', { text: 'الحركة في الواجهة' }), el('p', { class: 'muted small', text: 'اختر شدة الحركة التي تريحك.' }), motion])
    ]),
    el('h2', { class: 'sh rv', text: 'ملاحظاتي وبلاغاتي' }), fbList
  ]));
  try {
    const list = await API6.me('fb_mine');
    fbList.innerHTML = '';
    if (!list.length) { fbList.appendChild(el('p', { class: 'empty', text: 'لم ترسل ملاحظة بعد. زر الملاحظة في أعلى كل صفحة.' })); return; }
    list.forEach(function (x) { fbList.appendChild(fbCard(x, false)); });
  } catch (e) { fbList.innerHTML = ''; fbList.appendChild(el('p', { class: 'err', text: e.message })); }
}
function permsText(me) {
  if (me.role !== 'user') return 'كل الصلاحيات في برامجك';
  const n = { social: 'مواقع التواصل', ai: 'المساعد', upload: 'رفع الصور', fonts: 'رفع الخطوط', slides: 'الشرائح' };
  const on = Object.keys(me.perms || {}).filter(function (k) { return me.perms[k]; }).map(function (k) { return n[k]; });
  return on.length ? on.join('، ') : 'الأساسية';
}
const FB_ST = { 'new': ['وصل', 'bl'], work: ['قيد العمل', 'or'], done: ['تم', 'gr'], wont: ['لن يُنفّذ', ''] };
const FB_K = { bug: 'مشكلة', idea: 'اقتراح', q: 'سؤال' };
function fbCard(x, admin) {
  const st = FB_ST[x.status] || FB_ST['new'];
  return el('div', { class: 'card flat fbc rv' }, [
    el('div', { class: 'row sb' }, [el('div', { class: 'row' }, [el('span', { class: 'pill ' + st[1], text: st[0] }), el('span', { class: 'pill', text: FB_K[x.kind] || '' }), admin ? el('b', { text: x.name }) : null]), el('span', { class: 'tiny', text: ago(x.at) })]),
    el('p', { text: x.text }),
    x.reply ? el('p', { class: 'reply', text: 'الرد: ' + x.reply }) : null
  ]);
}
