/* ================= شاشات التطبيق: الرئيسية، القوالب، المزيد ================= */
function mHome() {
  POSTS = null;
  const P = V6.prog, me = V6.me, nm = firstName(me.name);
  document.title = 'أثر';
  if (!P) { const s0 = mscreen({ title: 'أثر' }, [mempty('palette', 'لا برنامج لحسابك بعد. اطلب من مدير المنصة إضافتك.')]); view(s0.node); return; }
  const tracks = tracksOf(), tid = ls('lastTrack') && TRACKS[ls('lastTrack')] ? ls('lastTrack') : (tracks[0] || {}).id;
  const quick = el('div', { class: 'mquick' }, [
    el('a', { href: '#/make' + (tid ? '?tid=' + tid : ''), class: 'mq ai wide', onclick: function () { haptic(); } }, [el('span', { class: 'mi' }, [ico('ai')]), el('span', { class: 'mt' }, [el('b', { text: 'اصنع إعلانك' }), el('br'), el('small', { text: 'اكتب فكرتك بكلماتك، ويقترح المساعد تصاميم بهوية برنامجك' })]), ico('chev', 'chev')]),
    el('a', { href: '#/tpl', class: 'mq', onclick: function () { haptic(); } }, [el('span', { class: 'mi', style: 'background:#ff9500' }, [ico('grid')]), el('b', { text: 'القوالب' }), el('small', { text: 'جاهزة بهوية كل مسار' })]),
    tid ? el('a', { href: '#/e/' + tid + '/blank', class: 'mq', onclick: function () { haptic(); } }, [el('span', { class: 'mi', style: 'background:#5856d6' }, [ico('wand')]), el('b', { text: 'صفحة بيضاء' }), el('small', { text: 'صمّم من الصفر' })]) : null,
    el('a', { href: '#/cal', class: 'mq', onclick: function () { haptic(); } }, [el('span', { class: 'mi', style: 'background:#007aff' }, [ico('cal')]), el('b', { text: 'التقويم' }), el('small', { text: 'منشوراتك ومهامك' })]),
    el('a', { href: '#/mine', class: 'mq', onclick: function () { haptic(); } }, [el('span', { class: 'mi', style: 'background:#34c759' }, [ico('heart')]), el('b', { text: 'تصاميمي' }), el('small', { text: 'ما حفظته وما شاركه فريقك' })])
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
    tracks.length ? msection('الهويات', '#/tpl', [el('div', { class: 'mids' }, tracks.map(function (t) { return midAvatar(t, false); }))]) : null
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
    list.forEach(function (tpl) {
      const ty = TYPES.find(function (x) { return x.id === tpl.type; }) || { name: '' }, szk = sizesFor(tpl)[0];
      grid.appendChild(el('a', { class: 'mtc', href: '#/e/' + T.id + '/' + tpl.id, onclick: function () { haptic(); M.dir = 'fwd'; } }, [el('div', { class: 'th' }, [tplThumb(tpl, T, szk, 220)]), (tpl.isNew || tpl.pack) ? el('span', { class: 'new', text: 'جديد' }) : null, el('b', { text: tpl.name }), el('small', { text: ty.name })]));
    });
  }
  const sc = mscreen({ title: 'القوالب', sub: T.full.replace('ـ', ''), right: [el('a', { class: 'nb', href: '#/e/' + T.id + '/blank', 'aria-label': 'صفحة بيضاء', onclick: function () { haptic(); } }, [ico('plus')])] }, [
    ids, el('div', { class: 'msearch' }, [ico('search'), search]), chips, grid
  ]);
  view(sc.node); fill();
}

/* ---------- المزيد: الحساب والإعدادات والتثبيت ---------- */
function mMore() {
  const me = V6.me;
  document.title = 'المزيد';
  const notifOn = notifyOn();
  const sc = mscreen({ title: 'المزيد' }, [
    el('a', { class: 'mprofile', href: '#/account', onclick: function () { haptic(); M.dir = 'fwd'; } }, [el('span', { class: 'pav' }, [me.avatar ? el('img', { src: me.avatar, alt: '' }) : el('span', { text: String(me.name || '؟').trim().replace(/^(أ\.|د\.|م\.)\s*/, '').slice(0, 1) })]), el('span', { class: 'mt' }, [el('b', { text: me.name }), el('small', { text: (me.roleName || '') + (V6.prog ? ' · ' + V6.prog.name : '') })]), ico('chev', 'chev')]),
    V6.bundle.programs.length > 1 ? mgroup([{ t: 'البرنامج الحالي', value: V6.prog ? V6.prog.name : '', ic: 'prog', color: V6.prog ? V6.prog.color : '#000', fn: function () { mactions(null, V6.bundle.programs.map(function (p) { return { t: p.name, sw: p.color, fn: async function () { await useProgram(p.id); go('#/'); toast('انتقلت إلى ' + p.name); } }; }), 'برامجك'); } }]) : null,
    mgroup([
      { t: 'تصاميمي', ic: 'heart', color: '#34c759', href: '#/mine' },
      { t: 'التقويم والمهام', ic: 'cal', color: '#007aff', href: '#/cal' },
      { t: 'أسبوعي في أثر', ic: 'chart', color: '#5856d6', href: '#/week' },
      { t: 'مراجعاتي', ic: 'review', color: '#ff9500', href: '#/reviews' },
      { t: 'نصائح التصميم', ic: 'star', color: '#ffcc00', href: '#/tips' }
    ]),
    mgroup([
      { t: 'التنبيه بصوت وإشعار عند انتهاء المساعد', ic: 'bell', color: '#ff3b30', toggle: notifOn, onToggle: async function (on) { if (on) { await askNotify(); chime6(); } else ls('notify', false); } },
      { t: 'الحركة في الواجهة', ic: 'sparkles', color: '#af52de', value: ({ calm: 'هادئة', normal: 'متوسطة', lively: 'حيوية' })[(me.prefs && me.prefs.motion) || 'normal'], fn: function () { mactions(null, [['calm', 'هادئة'], ['normal', 'متوسطة'], ['lively', 'حيوية']].map(function (o) { return { t: o[1], fn: function () { setMotion(o[0]); savePrefs6({ motion: o[0] }); mMore(); } }; }), 'شدة الحركة'); } }
    ], 'التفضيلات'),
    mgroup([
      isStandalone() ? { t: 'التطبيق مثبّت على جهازك', ic: 'check', color: '#34c759', sub: 'يفتح من الشاشة الرئيسية' } : { t: 'ثبّت التطبيق على الشاشة الرئيسية', ic: 'download', color: '#007aff', fn: function () { installSheet(); } },
      { t: 'النسخة الكاملة للحاسوب', ic: 'globe', color: '#8e8e93', sub: 'المحرر الموسّع ولوحة الإدارة', href: '../v6/#/' },
      isAdmin() ? { t: 'لوحة الإدارة', ic: 'gear', color: '#000', sub: 'تُفتح في النسخة الكاملة', href: '../v6/#/admin' } : null,
      { t: 'ملاحظة أو اقتراح للفريق', ic: 'chat', color: '#ff9500', fn: function () { showFeedback6(); } },
      { t: 'ما الجديد', ic: 'megaphone', color: '#5ac8fa', fn: function () { showNews(); } }
    ], 'التطبيق'),
    mgroup([{ t: 'تغيير كلمة المرور', ic: 'key', color: '#8e8e93', href: '#/password' }, { t: 'خروج', ic: 'logout', color: '#ff3b30', fn: async function () { if (await ask('خروج', 'تخرج من حسابك على هذا الجهاز.', 'خروج', true)) logout(); } }]),
    el('p', { class: 'mfoot', style: 'text-align:center', text: 'أثر · الإصدار ' + V6.version + (isStandalone() ? ' · تطبيق' : '') })
  ]);
  view(sc.node);
}
