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
  splashHide();
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
  splashHide();
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
  splash('أهلاً بك يا ' + String(V6.me.name || '').split(' ')[0] + '… نجهّز هوية برنامجك', true);
  try { ls('lastName', String(V6.me.name || '').split(' ')[0]); } catch (e) {}
  try { await loadBundle(); }
  catch (e) { splashHide(); view(el('div', { class: 'boot' }, [el('p', { class: 'err', text: 'تعذّر تحميل المنصة: ' + e.message }), el('button', { class: 'btn dark', text: 'إعادة المحاولة', onclick: afterLogin })])); return; }
  setMotion((V6.me.prefs && V6.me.prefs.motion) || 'calm'); applyAccent();
  buildTop();
  const after = ls('after'); ls('after', null);
  go(after && after !== '/login' ? '#' + after : '#/');
  // «ما الجديد» أولاً إن وُجد (وفيه زر الجولة)، وإلا الجولة. لا يظهران معاً
  loadNews().then(function (shown) { if (!shown) setTimeout(function () { if (document.body.dataset.page === 'home') maybeTour('home'); }, 700); });
}
async function restore() {
  V6.token = ls('token') || '';
  if (!V6.token) return false;
  try { V6.me = await API6.me('auth_me'); }
  catch (e) { V6.token = ''; ls('token', null); return false; }
  if (V6.me.mustChange) { showChangePw(true); return 'must'; }
  try { ls('lastName', String(V6.me.name || '').split(' ')[0]); } catch (e) {}
  splash('نجهّز هوية برنامجك…');
  await loadBundle();
  splash('نصفّ القوالب صفّاً منتظماً…');
  setMotion((V6.me.prefs && V6.me.prefs.motion) || 'calm'); applyAccent();
  buildTop(); loadNews();
  return true;
}
function isAdmin() { return V6.me && (V6.me.role === 'super' || V6.me.role === 'sup'); }
function isSuper() { return V6.me && V6.me.role === 'super'; }
// الاسم الظاهر والصورة: يغيّرهما المستخدم بنفسه
function profileCard() {
  const me = V6.me, nameI = el('input', { type: 'text', id: 'pf_name', value: me.name || '', maxlength: '60' });
  const pic = el('div', { class: 'pfpic' }); const setPic = function (src) { pic.innerHTML = ''; if (src) pic.appendChild(el('img', { src: src, alt: '' })); else pic.appendChild(el('span', { text: String(me.name || '؟').trim().slice(0, 1) })); };
  setPic(me.avatar);
  let newPic = null;
  const file = el('input', { type: 'file', accept: 'image/*', hidden: true, onchange: async function (e) {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { newPic = await squareThumb(f, 256); setPic(newPic); } catch (er) { toast('تعذّرت قراءة الصورة'); }
  } });
  const save = async function (o) { try { const r = await API6.me('me_profile', JSON.stringify(o)); V6.me.name = r.name; V6.me.avatar = r.avatar; V6.me.hasAvatar = r.hasAvatar; buildTop(); toast('حُفظ'); } catch (e) { toast(e.message); } };
  return el('div', { class: 'card rv pfcard' }, [el('h2', { class: 'ch', text: 'اسمك وصورتك' }),
    el('div', { class: 'row pfrow' }, [pic, el('div', { class: 'col' }, [
      el('button', { type: 'button', class: 'btn sm line', onclick: function () { file.click(); } }, [ico('upload'), 'اختر صورة']),
      el('button', { type: 'button', class: 'btn sm ghost', text: 'بلا صورة', onclick: function () { newPic = ''; setPic(''); } }), file])]),
    el('div', { class: 'fld' }, [el('label', { for: 'pf_name', text: 'الاسم الذي يظهر لك وللفريق' }), nameI]),
    el('button', { type: 'button', class: 'btn dark', text: 'حفظ', onclick: function () { const o = { name: nameI.value.trim() }; if (newPic !== null) o.avatar = newPic; save(o); } })]);
}
// صورة مربعة مقصوصة من المنتصف (للحساب فقط)
function squareThumb(file, n) {
  return new Promise(function (ok, bad) {
    const im = new Image(), url = URL.createObjectURL(file);
    im.onload = function () { const s = Math.min(im.width, im.height), c = document.createElement('canvas'); c.width = n; c.height = n; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, n, n); URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', 0.9)); };
    im.onerror = bad; im.src = url;
  });
}
// درجة التعديل في القوالب: للمشرفين كاملة، وللمستخدم ما حدّده المشرف له أو لبرنامجه
const EDIT_N = { content: 'المحتوى فقط', style: 'المحتوى والمظهر', full: 'كامل' };
function editLevel() { if (!V6.me || V6.me.role !== 'user') return 'full'; return V6.me.editLevel || (V6.prog && V6.prog.editLevel) || 'full'; }
function can(p) { return V6.me && (V6.me.role !== 'user' || !!(V6.me.perms && V6.me.perms[p])); }
// خيار مواقع التواصل: يتاح للمشرفين ومن مُنح الصلاحية، وإن سمح به البرنامج
function canSocial() { return can('social') && !(V6.prog && V6.prog.features && V6.prog.features.social === false); }
async function logout() {
  if (typeof ED !== 'undefined' && ED.open) ED.leaveOK = true; flushEv(); try { await API6.call('auth_logout', V6.token); } catch (e) {} V6.token = ''; ls('token', null); V6.me = null; go('#/login'); }
async function savePrefs6(patch) { V6.me.prefs = Object.assign({}, V6.me.prefs || {}, patch); try { await API6.call('prefs_save', V6.token, JSON.stringify(V6.me.prefs)); } catch (e) {} }

/* ---------- الرأس ----------
   كل وجهة في مكان واحد: الأقسام في شريط التنقل، وما يخصك (حسابك ونشاطك) في قائمة صورتك.
   على الشاشات الضيقة يختفي شريط التنقل، فتنتقل أقسامه إلى أعلى قائمة الصورة. */
function navItems() {
  return [['#/', 'home', 'الرئيسية', 'home'], ['#/make', 'make', 'اصنع إعلانك', 'ai'], ['#/mine', 'mine', 'تصاميمي', 'heart'], ['#/cal', 'cal', 'التقويم', 'cal'], ['#/tips', 'tips', 'نصائح', 'star'],
    isAdmin() ? ['#/admin', 'admin', 'الإدارة', 'gear'] : null].filter(Boolean);
}
function navHidden() { const n = $('#top .nav'); return !n || n.getBoundingClientRect().width === 0; }
function buildTop() {
  const top = $('#top'); top.hidden = false; top.innerHTML = '';
  const nav = el('nav', { class: 'nav', 'aria-label': 'التنقل' }, navItems().map(function (n) { return el('a', { href: n[0], 'data-r': n[1], text: n[2] }); }));
  const progs = V6.bundle.programs;
  const psw = el('button', { type: 'button', class: 'prog-sw', id: 'progsw', 'aria-label': 'تبديل البرنامج', onclick: function () {
    if (progs.length < 2) return;
    popMenu(psw, [{ hd: 'برامجك' }].concat(progs.map(function (p) { return { t: p.name, sw: p.color, fn: async function () { await useProgram(p.id); buildTop(); go('#/'); toast('انتقلت إلى ' + p.name); } }; })));
  } }, [el('i', { style: 'background:' + (V6.prog ? V6.prog.color : '#000') }), el('span', { text: V6.prog ? V6.prog.name : 'لا برنامج' }), progs.length > 1 ? ico('chevd') : null]);
  const bell = el('button', { type: 'button', class: 'ib', id: 'bell', title: 'الإشعارات وما الجديد', 'aria-label': 'الإشعارات وما الجديد', onclick: function () { showNews(); } }, [ico('bell')]);
  const fb = el('button', { type: 'button', class: 'ib', id: 'fbbtn', title: 'أبلغ عن مشكلة أو اقترح فكرة', 'aria-label': 'ملاحظة للفريق', onclick: function () { showFeedback6(); } }, [ico('chat')]);
  const av = el('button', { type: 'button', class: 'avatar', id: 'avatar', 'aria-label': 'حسابك', 'aria-haspopup': 'menu', text: V6.me.avatar ? '' : String(V6.me.name || '؟').trim().replace(/^(أ\.|د\.|م\.)\s*/, '').slice(0, 1), onclick: function () {
    const narrow = navHidden(), fbHidden = !$('#fbbtn') || $('#fbbtn').getBoundingClientRect().width === 0;
    popMenu(av, [{ hd: V6.me.name + ' · ' + (V6.me.roleName || '') }]
      .concat(narrow ? navItems().map(function (n) { return { t: n[2], ic: n[3], href: n[0] }; }).concat(['-']) : [])
      .concat([
        { t: 'حسابي', ic: 'user', href: '#/account' },
        { t: 'أسبوعي في أثر', ic: 'chart', href: '#/week' },
        { t: 'مراجعاتي', ic: 'review', href: '#/reviews' },
        fbHidden ? { t: 'ملاحظة للفريق', ic: 'chat', fn: function () { showFeedback6(); } } : null,
        { t: 'جولة تعريفية', ic: 'play', fn: function () { maybeTour(document.body.dataset.page || 'home', true); } },
        '-', { t: 'خروج', ic: 'logout', fn: logout }]).filter(Boolean));
  } });
  if (V6.me.avatar) av.appendChild(el('img', { src: V6.me.avatar, alt: '' }));
  top.appendChild(el('div', { class: 'wrap in' }, [
    el('a', { href: '#/', class: 'logo', 'aria-label': 'الرئيسية' }, [brandImg('c', 'lg-full'), brandImg('mark', 'lg-mark')]), nav, el('span', { class: 'sp' }), psw, fb, bell, av
  ]));
  markNav();
}
// الصفحات الشخصية (الحساب، أسبوعي، مراجعاتي) تُعلَّم على الصورة لأنها من قائمتها
function markNav() { const pg = document.body.dataset.page || ''; $$('.nav a').forEach(function (a) { a.classList.toggle('on', a.dataset.r === pg); }); const av = $('#avatar'); if (av) av.classList.toggle('on', pg === 'account'); }
window.addEventListener('scroll', function () { const t = $('#top'); if (t) t.classList.toggle('scrolled', scrollY > 4); }, { passive: true });

/* ---------- حسابي: كل ما يخصك في صفحة واحدة ----------
   ملفك، والمظهر، ونشاطك (أسبوعك ومراجعاتك وملاحظاتك)، وتطبيق الجوال. في التطبيق المظهر وأسبوعي ومراجعاتي في «المزيد» فلا تتكرر هنا. */
async function showAccount() {
  const me = V6.me, inApp = document.body.classList.contains('mapp');
  const motion = segOf([['calm', 'هادئة'], ['normal', 'متوسطة'], ['lively', 'حيوية']], (me.prefs && me.prefs.motion) || 'calm', function (v) { setMotion(v); savePrefs6({ motion: v }); toast('حُفظ'); });
  const fbList = el('div', { class: 'fblist' }, [el('div', { class: 'skel', style: 'height:80px' })]);
  const rvBox = el('a', { class: 'card acrv rv hover-lift', href: '#/reviews', style: '--d:1' }, [el('span', { class: 'icon-tile t-or' }, [ico('review')]), el('h3', { text: 'مراجعاتي' }), el('p', { class: 'muted small', text: 'رأي إدارة أثر في تصاميمك.' })]);
  const wkSlot = el('div', { class: 'acwk' }); weekMiniCard().then(function (c) { wkSlot.appendChild(c); });
  const appUrl = location.origin + location.pathname.replace(/v6\/?(index\.html)?$/, '') + 'app/';
  view(el('div', { class: 'wrap page acpage' }, [
    el('div', { class: 'phead' }, [H('h1', 'حسابي'), el('p', { class: 'muted rv', text: me.name + ' · ' + (me.roleName || '') + (me.email ? ' · ' + me.email : '') })]),
    el('div', { class: 'grid two acgrid' }, [
      profileCard(),
      el('div', { class: 'card rv' }, [el('h2', { class: 'ch', text: 'بياناتك' }),
        el('dl', { class: 'kv' }, [el('dt', { text: 'اسم المستخدم' }), el('dd', { dir: 'auto', text: me.username }), el('dt', { text: 'البرامج' }), el('dd', { text: (me.programsInfo || []).map(function (p) { return p.name; }).join('، ') || '—' }),
          el('dt', { text: 'الصلاحيات' }), el('dd', { text: permsText(me) }),
          el('dt', { text: 'تصاميمك' }), el('dd', { class: 'small', text: 'لك وحدك حتى تشاركها. وما تنزّله أو تشاركه تُحفظ نسخته في أرشيف البرنامج لمشرفه.' })]),
        el('div', { class: 'row' }, [el('a', { class: 'btn dark', href: '#/password' }, [ico('key'), 'تغيير كلمة المرور'])])]),
      inApp ? null : el('div', { class: 'card rv aclook', style: '--d:1' }, [el('h2', { class: 'ch', text: 'المظهر' }), el('p', { class: 'muted small', text: 'يتبعك على كل أجهزتك، في الموقع والتطبيق.' }),
        el('h3', { class: 'acsub', text: 'لون الواجهة' }), accentPicker(function (id, nm) { toast('لون الواجهة: ' + nm); }),
        el('h3', { class: 'acsub', text: 'الحركة في الواجهة' }), motion]),
      inApp ? null : el('div', { class: 'card rv acapp', style: '--d:2' }, [el('h2', { class: 'ch', text: 'تطبيق الجوال' }), el('p', { class: 'muted small', text: 'افتح الرابط من هاتفك، وثبّته على الشاشة الرئيسية.' }),
        el('div', { class: 'row wrapr' }, [el('a', { class: 'btn dark', href: appHref(), onclick: function () { ls('preferWeb', null); } }, [ico('phone'), 'افتح التطبيق']), el('button', { type: 'button', class: 'btn line', onclick: function (e) { copyText(appUrl); btnDone(e.currentTarget, 'نُسخ الرابط'); } }, [ico('link'), 'انسخ الرابط للهاتف'])])])
    ]),
    inApp ? null : el('section', { class: 'hsec', id: 'acact' }, [el('div', { class: 'shead' }, [el('div', {}, [H('h2', 'نشاطك'), el('p', { class: 'muted small rv', text: 'أرقام أسبوعك، ومراجعات تصاميمك.' })])]),
      el('div', { class: 'acacts' }, [wkSlot, rvBox])]),
    el('section', { class: 'hsec', id: 'acfb' }, [el('div', { class: 'shead' }, [el('div', {}, [H('h2', 'ملاحظاتي وبلاغاتي'), el('p', { class: 'muted small rv', text: 'ما أرسلته للفريق، وحالته وردّه.' })]),
      el('button', { type: 'button', class: 'btn sm line', onclick: function () { showFeedback6(); } }, [ico('chat'), 'ملاحظة جديدة'])]), fbList])
  ]));
  if (/[?&]fb\b/.test(location.hash)) setTimeout(function () { const t = $('#acfb'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 400);
  API6.me('rv_mine').then(function (list) {
    const open = list.filter(function (x) { return x.status !== 'done'; }).length, done = list.length - open;
    const p = rvBox.querySelector('p'); if (!p) return;
    p.textContent = list.length ? [done ? done + ' رُدّ عليها' : '', open ? open + ' تنتظر المراجعة' : ''].filter(Boolean).join(' · ') : 'لم تطلب مراجعة بعد؛ تطلبها من زر «مراجعة» في المحرر.';
  }).catch(function () {});
  try {
    const list = await API6.me('fb_mine');
    fbList.innerHTML = '';
    if (!list.length) { fbList.appendChild(el('p', { class: 'empty', text: 'لم ترسل ملاحظة بعد.' })); return; }
    list.forEach(function (x) { fbList.appendChild(fbCard(x, false)); });
    revealAll(fbList);
  } catch (e) { fbList.innerHTML = ''; fbList.appendChild(el('p', { class: 'err', text: e.message })); }
}
function permsText(me) {
  if (me.role !== 'user') return 'كل الصلاحيات في برامجك';
  const n = { social: 'مواقع التواصل', ai: 'المساعد', upload: 'رفع الصور', fonts: 'رفع الخطوط', slides: 'الشرائح', send: 'الإرسال إلى القناة' };
  const on = Object.keys(me.perms || {}).filter(function (k) { return me.perms[k]; }).map(function (k) { return n[k]; }).filter(Boolean);
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
