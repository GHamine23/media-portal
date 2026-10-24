/* ================= شاشات التطبيق: الرئيسية، القوالب، المزيد ================= */
function mHome() {
  POSTS = null;
  const P = V6.prog, me = V6.me, nm = firstName(me.name);
  document.title = 'أثر';
  if (!P) { const s0 = mscreen({ title: 'أثر' }, [mempty('palette', 'لا برنامج لحسابك بعد. اطلب من مدير المنصة إضافتك.')]); view(s0.node); return; }
  const tracks = tracksOf(), tid = ls('lastTrack') && TRACKS[ls('lastTrack')] ? ls('lastTrack') : (tracks[0] || {}).id;
  const quick = el('div', { class: 'mquick' }, [
    el('a', { href: '#/make' + (tid ? '?tid=' + tid : ''), class: 'mq ai wide', onclick: function () { haptic(); } }, [el('span', { class: 'mi' }, [ico('ai')]), el('span', { class: 'mt' }, [el('b', { text: 'اصنع إعلانك' }), el('br'), el('small', { text: 'اكتب فكرتك بكلماتك، ويقترح المساعد تصاميم بهوية برنامجك' })]), ico('chev', 'chev')]),
    // القوالب والتقويم في شريط التبويب، فلا يتكرران هنا
    tid ? el('a', { href: '#/e/' + tid + '/blank', class: 'mq', onclick: function () { haptic(); } }, [el('span', { class: 'mi', style: 'background:#5856d6' }, [ico('wand')]), el('b', { text: 'صفحة بيضاء' }), el('small', { text: 'صمّم من الصفر' })]) : null,
    tid ? el('a', { href: '#/s/' + tid, class: 'mq', onclick: function () { haptic(); } }, [el('span', { class: 'mi', style: 'background:#ff9500' }, [ico('slides')]), el('b', { text: 'الشرائح' }), el('small', { text: 'عروض للقاءات والمحاضرات' })]) : null,
    el('a', { href: '#/mine', class: 'mq', onclick: function () { haptic(); } }, [el('span', { class: 'mi', style: 'background:#34c759' }, [ico('heart')]), el('b', { text: 'تصاميمي' }), el('small', { text: 'ما حفظته وما شاركه فريقك' })]),
    el('a', { href: '#/tips', class: 'mq', onclick: function () { haptic(); } }, [el('span', { class: 'mi', style: 'background:#d9a400' }, [ico('star')]), el('b', { text: 'نصائح التصميم' }), el('small', { text: 'نصيحة جديدة كل يوم' })])
  ]);
  const upcoming = el('div', { class: 'mgroup' }, [el('div', { class: 'mskel', style: 'height:56px;border-radius:0' })]);
  const recent = el('div', { class: 'mstrip' }), models = el('div', { class: 'mstrip' });
  const recentSec = msection('آخر تصاميمك', '#/mine', [recent]); recentSec.hidden = true;
  const modelsSec = msection('نماذج جاهزة', '#/mine', [models]); modelsSec.hidden = true;
  const sc = mscreen({ title: 'أثر', right: [el('a', { class: 'nb', href: '#/more', 'aria-label': 'حسابك', onclick: function () { M.dir = 'fwd'; } }, [me.avatar ? el('img', { src: me.avatar, alt: '', style: 'width:30px;height:30px;border-radius:50%' }) : ico('user')])] }, [
    el('div', { class: 'mhero' }, [el('span', { class: 'greet', text: timeGreeting(nm) + ' · ' + P.name }), el('h2', { text: 'ماذا ستصمّم اليوم؟' })]),
    typeof installBanner === 'function' ? installBanner() : null,
    quick,
    msection('القادم في التقويم', '#/cal', [upcoming]),
    modelsSec, recentSec,
    tracks.length ? msection('الهويات', '#/tpl', [el('div', { class: 'mids' }, tracks.map(function (t) { return midAvatar(t, false); }))]) : null,
    el('button', { type: 'button', class: 'mweb', onclick: function () { haptic(); toWeb(); } }, [ico('globe'), el('span', { text: 'انتقل إلى نسخة الويب' }), el('small', { text: 'ويفتحها هذا الجهاز بعد ذلك' })])
  ]);
  view(sc.node);
  pullToRefresh(sc, async function () { CAL.loaded = false; POSTS = null; await Promise.all([fillUpcoming(), fillRecent()]); toast('حُدّث'); });
  async function fillUpcoming() {
    try { await calLoad(true); } catch (e) {}
    const now = Date.now();
    const items = CAL.posts.filter(function (x) { return x.status === 'queued' && x.when >= now - 600000; }).map(function (x) { return { k: 'post', t: x.when, x: x }; })
      .concat(CAL.tasks.filter(function (t) { return t.status !== 'done' && (t.mine || t.to === ''); }).map(function (t) { return { k: 'task', t: t.due || now + 1e12, x: t }; })).sort(function (a, b) { return a.t - b.t; }).slice(0, 4);
    upcoming.innerHTML = '';
    if (!items.length) { upcoming.appendChild(el('div', { class: 'mrow noicon' }, [el('span', { class: 'mt' }, [el('b', { text: 'لا شيء قادم' }), el('small', { text: 'جدول منشوراً من المحرر، أو أضف مهمة من التقويم' })])])); return; }
    items.forEach(function (it) {
      if (it.k === 'post') { const x = it.x; upcoming.appendChild(el('a', { class: 'mrow', href: '#/cal?post=' + x.id }, [el('span', { class: 'mi', style: 'background:#007aff' }, [ico('send')]), el('span', { class: 'mt' }, [el('b', { text: x.title || 'منشور' }), el('small', { text: fmtTime(x.when) + (x.repeat ? ' · ' + repeatLabel(x.repeat) : '') })]), ico('chev', 'chev')])); }
      else { const t = it.x; upcoming.appendChild(el('a', { class: 'mrow', href: '#/cal?task=' + t.id }, [el('span', { class: 'mi', style: 'background:' + (t.prio === 'high' ? '#ff3b30' : '#ff9500') }, [ico('check')]), el('span', { class: 'mt' }, [el('b', { text: t.title }), el('small', { text: (t.due ? fmtTime(t.due) : 'بلا موعد') + (t.from !== V6.me.uid ? ' · من ' + t.fromName : '') })]), ico('chev', 'chev')])); }
    });
  }
  async function fillRecent() {
    try {
      const all = await API6.me('item_list');
      const ms = all.filter(function (x) { return x.model && x.program === P.id && TRACKS[x.track]; }).slice(0, 10), mine = all.filter(function (x) { return x.mine && x.program === P.id; }).slice(0, 10);
      models.innerHTML = ''; recent.innerHTML = '';
      ms.forEach(function (x) { models.appendChild(mSmallCard(x)); }); mine.forEach(function (x) { recent.appendChild(mSmallCard(x)); });
      modelsSec.hidden = !ms.length; recentSec.hidden = !mine.length;
    } catch (e) {}
  }
  fillUpcoming(); fillRecent();
}
function mSmallCard(x) { const T = TRACKS[x.track]; return el('a', { class: 'mcardsm', href: '#/d/' + x.id, onclick: function () { haptic(); M.dir = 'fwd'; } }, [el('img', { src: x.thumb || '', alt: '', loading: 'lazy' }), el('b', { text: x.name }), el('small', { text: x.model ? (T ? T.name : 'نموذج') : ago(x.at) })]); }
function midAvatar(t, on, href) {
  const im = IMG[t.logo];
  return el('a', { href: href || '#/g/' + t.id, class: 'mid' + (on ? ' on' : ''), style: '--tc:' + t.c.p, onclick: function () { haptic(); M.dir = 'fwd'; } }, [el('span', { class: 'av' }, [im ? el('img', { src: ASSETS[t.logo], alt: '' }) : el('span', { text: t.name })]), el('small', { text: t.name })]);
}

/* ---------- القوالب: هوية ← نوع ← شبكة ---------- */
function mTemplates(tid, type) {
  const tracks = tracksOf(); if (!tracks.length) { view(mscreen({ title: 'القوالب' }, [mempty('palette', 'لم تُضف هوية برنامجك بعد.')]).node); return; }
  tid = (tid || '').split('?')[0]; type = (type || 'all').split('?')[0];
  const T = trackOf(tid) || trackOf(ls('lastTrack')) || tracks[0]; ls('lastTrack', T.id);
  document.title = 'قوالب ' + T.name;
  const VIS = visibleTpls(), types = TYPES.filter(function (ty) { return VIS.some(function (t) { return t.type === ty.id; }); });
  let cur = type, q = '';
  const ids = el('div', { class: 'mids' }, tracks.map(function (t) { return midAvatar(t, t.id === T.id, '#/g/' + t.id); }));
  const chips = el('div', { class: 'mchips' }, [['all', 'الكل'], ['new', 'الجديد']].concat(types.map(function (t) { return [t.id, t.name]; })).map(function (c) {
    return el('button', { type: 'button', class: 'mchip' + (c[0] === cur ? ' on' : ''), text: c[1], onclick: function (e) { haptic(); cur = c[0]; $$('.mchip', chips).forEach(function (x) { x.classList.remove('on'); }); e.currentTarget.classList.add('on'); fill(); history.replaceState(null, '', '#/g/' + T.id + (cur === 'all' ? '' : '/' + cur)); } });
  }));
  const search = el('input', { type: 'search', placeholder: 'ابحث في القوالب…', 'aria-label': 'بحث', oninput: function (e) { q = norm(e.target.value); fill(); } });
  const grid = el('div', { class: 'mtgrid' });
  function fill() {
    grid.innerHTML = '';
    const qs = q.split(/\s+/).filter(Boolean);
    let list = cur === 'all' ? VIS : cur === 'new' ? VIS.filter(function (t) { return t.isNew || t.pack; }) : VIS.filter(function (t) { return t.type === cur; });
    list = list.filter(function (t) { const ty = TYPES.find(function (x) { return x.id === t.type; }) || {}; const hay = norm([t.name, t.tags, ty.name].join(' ')); return qs.every(function (w) { return hay.indexOf(w) >= 0; }); });
    if (!list.length) { grid.appendChild(mempty('search', 'لا قالب يطابق بحثك.')); return; }
    list.forEach(function (tpl, i) {
      const ty = TYPES.find(function (x) { return x.id === tpl.type; }) || { name: '' }, szk = sizesFor(tpl)[0];
      grid.appendChild(el('a', { class: 'mtc', href: '#/e/' + T.id + '/' + tpl.id, onclick: function () { haptic(); M.dir = 'fwd'; } }, [el('div', { class: 'th' }, [tplThumb(tpl, T, szk, 220, null, i < EAGER_N)]), (tpl.isNew || tpl.pack) ? el('span', { class: 'new', text: 'جديد' }) : null, el('b', { text: tpl.name }), el('small', { text: ty.name })]));
    });
  }
  const sc = mscreen({ title: 'القوالب', sub: T.full.replace('ـ', ''), right: [el('a', { class: 'nb', href: '#/e/' + T.id + '/blank', 'aria-label': 'صفحة بيضاء', onclick: function () { haptic(); } }, [ico('plus')])] }, [
    ids, el('div', { class: 'msearch' }, [ico('search'), search]), chips, grid
  ]);
  view(sc.node); fill();
}

/* ---------- المزيد: الحساب والمظهر والتطبيق ----------
   تصميم خاص بالمنصة (لا نسخة من إعدادات النظام): بطاقة شخصية بلون الواجهة، مربعات ملوّنة للأقسام، وبطاقات للمظهر والتطبيق. */
function toWeb() { ls('preferWeb', true); const h = location.hash; location.href = '../' + (/^#\/(tpl|more)\b/.test(h) ? '#/' : h || '#/'); }
function mTile(t, ic, color, href, fn) {
  return el(href ? 'a' : 'button', { class: 'mtile', type: href ? null : 'button', href: href || null, style: '--tc:' + color, onclick: function () { haptic(); M.dir = 'fwd'; if (fn) fn(); } }, [el('span', { class: 'ti' }, [ico(ic)]), el('b', { text: t })]);
}
function mCard(title, ic, kids) { return el('section', { class: 'mcard2' }, [el('h3', {}, [el('span', { class: 'ci' }, [ico(ic)]), title])].concat(kids.filter(Boolean))); }
function mLine(t, sub, ic, act, opt) {
  opt = opt || {};
  return el(opt.href ? 'a' : 'button', { class: 'mline' + (opt.danger ? ' danger' : ''), type: opt.href ? null : 'button', href: opt.href || null, onclick: function () { haptic(); if (act) act(); } }, [el('span', { class: 'li' }, [ico(ic)]), el('span', { class: 'mt' }, [el('b', { text: t }), sub ? el('small', { text: sub }) : null]), opt.badge ? el('span', { class: 'lb', text: opt.badge }) : ico('chev', 'chev')]);
}
function mMore() {
  const me = V6.me;
  document.title = 'المزيد';
  const initial = String(me.name || '؟').trim().replace(/^(أ\.|د\.|م\.)\s*/, '').slice(0, 1);
  const progs = V6.bundle.programs || [];
  const hero = el('section', { class: 'mpro' }, [
    el('a', { class: 'pav', href: '#/account', 'aria-label': 'حسابي', onclick: function () { haptic(); M.dir = 'fwd'; } }, [me.avatar ? el('img', { src: me.avatar, alt: '' }) : el('span', { text: initial })]),
    el('div', { class: 'pt' }, [el('b', { text: me.name }), el('small', { text: me.roleName || '' })]),
    el('div', { class: 'pacts' }, [
      el('a', { class: 'pchip', href: '#/account', onclick: function () { haptic(); M.dir = 'fwd'; } }, [ico('user'), 'حسابي']),
      V6.prog ? el(progs.length > 1 ? 'button' : 'span', { class: 'pchip prog', type: progs.length > 1 ? 'button' : null, onclick: progs.length > 1 ? function () { mactions(null, progs.map(function (p) { return { t: p.name, sw: p.color, fn: async function () { await useProgram(p.id); go('#/'); toast('انتقلت إلى ' + p.name); } }; }), 'برامجك'); } : null }, [el('i', { style: 'background:' + (V6.prog.color || '#fff') }), V6.prog.name, progs.length > 1 ? ico('chevd') : null]) : null
    ])
  ]);
  const tiles = el('div', { class: 'mtiles four' }, [
    // تصاميمي ونصائح التصميم في الرئيسية، والتقويم في شريط التبويب، فلا تتكرر هنا
    mTile('أسبوعي', 'chart', '#7c5cf0', '#/week'),
    mTile('مراجعاتي', 'review', '#f08a1c', '#/reviews'),
    mTile('ما الجديد', 'megaphone', '#14a38b', null, function () { showNews(); }),
    mTile('ملاحظة للفريق', 'chat', '#2f7cf6', null, function () { showFeedback6(); })
  ]);
  const motion = (me.prefs && me.prefs.motion) || 'normal';
  const look = mCard('المظهر', 'palette', [
    el('div', { class: 'msub', text: 'لون الواجهة' }),
    accentPicker(function () { haptic('ok'); }),
    el('div', { class: 'msub', text: 'الحركة في الواجهة' }),
    segOf([['calm', 'هادئة'], ['normal', 'متوسطة'], ['lively', 'حيوية']], motion, function (v) { haptic(); setMotion(v); savePrefs6({ motion: v }); }),
    el('label', { class: 'mtog' }, [el('span', { class: 'mt' }, [el('b', { text: 'نبّهني حين ينتهي المساعد' }), el('small', { text: 'صوت وإشعار إن كنت في تطبيق آخر' })]), el('input', { type: 'checkbox', class: 'msw', checked: notifyOn(), onchange: async function (e) { haptic(); if (e.target.checked) { await askNotify(); chime6(); } else ls('notify', false); } })])
  ]);
  const app = mCard('التطبيق', 'phone', [
    isStandalone() ? mLine('التطبيق مثبّت على جهازك', 'يفتح من الشاشة الرئيسية', 'check', null, { badge: '✓' }) : mLine('ثبّت التطبيق على الشاشة الرئيسية', 'يفتح بملء الشاشة وأسرع', 'download', function () { installSheet(); }),
    mLine('انتقل إلى نسخة الويب', 'المحرر الموسّع، ويفتحها هذا الجهاز بعد ذلك', 'globe', toWeb),
    isAdmin() ? mLine('لوحة الإدارة', 'في نسخة الويب', 'gear', function () { ls('preferWeb', true); location.href = '../#/admin'; }) : null
  ]);
  // كلمة المرور في «حسابي» (بطاقة بياناتك)، والخروج هنا
  const bottom = el('div', { class: 'mbtns' }, [
    el('button', { type: 'button', class: 'btn danger', onclick: async function () { if (await ask('خروج', 'تخرج من حسابك على هذا الجهاز.', 'خروج', true)) logout(); } }, [ico('logout'), 'خروج'])
  ]);
  const sc = mscreen({ title: 'المزيد' }, [hero, tiles, look, app, bottom,
    el('p', { class: 'mfoot', style: 'text-align:center', text: 'أثر · الإصدار ' + V6.version + (isStandalone() ? ' · تطبيق' : '') })]);
  view(sc.node);
}
