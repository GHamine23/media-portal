/* ================= الرئيسية ومعرض القوالب ================= */
// تحويل رابط قديم أو من التطبيق إلى مكانه دون أن يبقى في سجل الرجوع
function redirect6(h) { history.replaceState(null, '', h); render(); }
function firstName(n) { return String(n || '').trim().replace(/^(أ\.|د\.|م\.|الأستاذ|الأستاذة)\s*/, '').split(/\s+/)[0] || ''; }
function tracksOf(group) { return Object.keys(TRACKS).map(function (k) { return TRACKS[k]; }).filter(function (t) { return !group || t.group === group; }); }
// القوالب المتاحة لهذا المستخدم: مواقع التواصل لمن له صلاحيتها
// طقم قوالب (t.set) يظهر في البرامج التي فعّله المشرف فيها فقط
function setOn(t) { if (!t.set) return true; const P = typeof V6 !== 'undefined' && V6.prog; return !!(P && P.sets && P.sets.indexOf(t.set) >= 0); }
function visibleTpls() { return TEMPLATES.filter(function (t) { return !t.hidden && t.type !== 'slide' && setOn(t) && (canSocial() || t.type !== 'social'); }); }
function sizesFor(tpl) { const s = tpl.sizes.filter(function (z) { return canSocial() || z !== 'story'; }); return s.length ? s : tpl.sizes.slice(0, 1); }

// رسم مصغّر عند ظهور البطاقة فقط، فلا تتأخر الصفحة
let THUMB_IO = null;
function lazyThumb(cv, fn) {
  if (!THUMB_IO) THUMB_IO = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { THUMB_IO.unobserve(e.target); const f = e.target._draw; if (f && !e.target.classList.contains('drawn')) requestAnimationFrame(function () { try { f(); } catch (er) { console.warn(er); } e.target.classList.add('drawn'); }); } }); }, { rootMargin: '200px' });
  cv._draw = fn; THUMB_IO.observe(cv);
}
// eager: يُرسم فوراً (أول ما تقع عليه العين)، بالتتابع إطاراً بعد إطار حتى لا تتجمد الصفحة؛ والباقي عند ظهوره
let EAGER_Q = [], EAGER_ON = false;
function eagerThumb(cv, fn) {
  cv._draw = fn; EAGER_Q.push(cv);
  if (EAGER_ON) return; EAGER_ON = true;
  const step = function () {
    const c = EAGER_Q.shift(); if (!c) { EAGER_ON = false; return; }
    if (c._draw && c.isConnected && !c.classList.contains('drawn')) { try { c._draw(); } catch (er) { console.warn(er); } c.classList.add('drawn'); if (THUMB_IO) THUMB_IO.unobserve(c); }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function tplThumb(tpl, T, szk, w, st, eager) {
  const sz = SIZES[szk], sc = w / sz.w;
  const cv = el('canvas', { width: Math.round(sz.w * sc), height: Math.round(sz.h * sc), class: 'thumbcv' });
  const draw = function () { renderTo(cv, tpl, szk, st || { d: defaults(tpl, T), variant: tpl.variants[0].id, k: 1 }, T, sc * (window.devicePixelRatio > 1 ? 2 : 1)); cv.style.width = '100%'; };
  if (eager) eagerThumb(cv, draw); else lazyThumb(cv, draw);
  return cv;
}
const EAGER_N = 12;

function showHome() {
  POSTS = null;
  const P = V6.prog, me = V6.me;
  document.title = 'منصة الأثر الإعلامي';
  if (!P) { view(el('div', { class: 'wrap page' }, [H('h1', 'لا برنامج لحسابك بعد'), el('p', { class: 'muted', text: 'اطلب من مدير المنصة إضافتك إلى برنامجك.' })])); return; }
  const tracks = tracksOf();
  const first = tracks[0];
  const search = el('input', { type: 'search', class: 'hsearch', placeholder: 'ابحث في القوالب: مسابقة، ورشة، تهنئة، جدول…', 'aria-label': 'ابحث في القوالب', onkeydown: function (e) { if (e.key === 'Enter' && first) go('#/g/' + (ls('lastTrack') || first.id) + '?q=' + encodeURIComponent(search.value)); } });
  const lastT = TRACKS[ls('lastTrack')] ? ls('lastTrack') : (first && first.id);
  void lastT;
  const groups = [['track', 'المسارات'], ['act', 'الأنشطة والهويات']];
  const idSections = tracks.length ? groups.map(function (g) {
    const list = tracksOf(g[0]); if (!list.length) return null;
    return el('section', { class: 'hsec' }, [el('div', { class: 'shead' }, [H('h2', g[1])]),
      el('div', { class: 'idgrid' }, list.map(function (t, i) { return idCard6(t, i); }))]);
  }) : [el('div', { class: 'section empty-prog rv' }, [el('span', { class: 'icon-tile t-or' }, [ico('palette')]), el('h3', { text: 'هوية ' + P.name + ' لم تُضف بعد' }),
    el('p', { class: 'muted', text: isAdmin() ? 'أضف ألوان البرنامج وشعاره من لوحة الإدارة، فتظهر كل القوالب بهويته.' : 'يجهّز المشرف هوية البرنامج، وتظهر القوالب هنا قريباً.' }),
    isAdmin() ? el('a', { class: 'btn dark', href: '#/admin/programs', text: 'أضف الهوية' }) : null])];
  const recent = el('div', { class: 'strip', id: 'recent' });
  const models = el('div', { class: 'strip models-strip', id: 'models' });
  const newOnes = visibleTpls().filter(function (t) { return t.isNew || t.pack; }).slice(0, 10);
  const nm = firstName(me.name);
  const wkSlot = el('div', { class: 'wkslot' }); weekMiniCard().then(function (c) { wkSlot.appendChild(c); });
  const msg = el('h1', { class: 'rotmsg', text: 'ماذا ستصمّم اليوم يا ' + nm + '؟' }), src = el('span', { class: 'rotsrc' });
  view(
    el('section', { class: 'hero hero2 wrap' }, [
      el('div', { class: 'hgreet' }, [
        progMark(P, '', timeGreeting(nm)) || el('span', { class: 'eyebrow rv', text: timeGreeting(nm) + ' · ' + P.name }),
        msg, src,
        el('div', { class: 'searchrow rv', style: '--d:2' }, [ico('search'), search]),
        // القادم في التقويم بجانب الساعة: يملأ العمود ولا يترك فراغاً تحت التحية
        el('div', { class: 'hup rv', style: '--d:3' }, [calHomeWidget()])
      ]),
      clockCard(),
      aiDesignerBox()
    ]),
    el('div', { class: 'wrap' }, [appPromo()]),
    el('div', { class: 'wrap hgrid2' }, [tipOfDayCard(), wkSlot]),
    el('div', { class: 'wrap' }, [el('section', { class: 'hsec', id: 'modelsec', hidden: true }, [el('div', { class: 'shead' }, [H('h2', 'نماذج جاهزة'), el('a', { class: 'btn sm line', href: '#/mine', onclick: function () { ls('mineTab', 'models'); }, text: 'كل النماذج' })]), stripNav(models)])].concat(idSections).concat([
      el('section', { class: 'hsec', id: 'recentsec', hidden: true }, [el('div', { class: 'shead' }, [H('h2', 'آخر تصاميمك'), el('a', { class: 'btn sm line', href: '#/mine', text: 'كل تصاميمي' })]), stripNav(recent)]),
      newOnes.length && first ? el('section', { class: 'hsec' }, [el('div', { class: 'shead' }, [H('h2', 'جديد القوالب')]),
        stripNav(el('div', { class: 'strip' }, newOnes.map(function (tpl, i) { const T = tracks[i % tracks.length]; const szk = sizesFor(tpl)[0]; return el('a', { class: 'scard hover-lift', href: '#/e/' + T.id + '/' + tpl.id }, [tplThumb(tpl, T, szk, 220, null, i < 6), el('b', { text: tpl.name })]); })))]) : null
    ]))
  );
  loadRecent(recent);
  rotateMessages(msg, src, nm);
}

/* ---------- شعار البرنامج المفتوح في الرئيسية: الشعار الذي اختاره المشرف (أو شعار هويته الوحيدة) مع رقم الدفعة ---------- */
function progLogoInfo(P) {
  P = P || V6.prog; if (!P) return null;
  const ids = P.identities || [];
  let key = P.logo && IMG[P.logo] ? P.logo : '';
  if (!key && ids.length === 1 && IMG[ids[0].logo]) key = ids[0].logo;
  if (!key) return null;
  const T = TRACKS[(ids.find(function (t) { return t.logo === key || (t.logos || []).some(function (l) { return l[0] === key; }); }) || {}).id] || null;
  return { key: key, T: T };
}
// الشعار بارتفاع معيّن (لا بعرض)، بلونه الأصلي ورقم الدفعة، بلا إطار
function progLogoCanvas(P, hCss) {
  const inf = progLogoInfo(P); if (!inf) return null;
  const im = IMG[inf.key], ar = srcW(im) / srcH(im), dpr = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
  const H = hCss * dpr, W = H * ar, pad = H * 0.08;
  const cv = el('canvas', { class: 'pmark-cv', width: Math.round(W + pad * 2), height: Math.round(H + pad * 2), role: 'img', 'aria-label': 'شعار ' + P.name });
  const ctx = cv.getContext('2d'); ctx.imageSmoothingQuality = 'high';
  const T = inf.T ? Object.assign({}, inf.T, { logo: inf.key }) : { logo: inf.key, c: { a: P.color || '#c08f4e', s: P.color || '#c08f4e', p: P.color || '#222222' } };
  LGO = lgoOf(T, null);
  try {
    const L = LGO, mode = L.col || 'color', src = mode === 'color' ? im : tinted(inf.key, mode);
    ctx.drawImage(src, pad, pad, W, H);
    if (L.show && L.n) batchMark(ctx, T, { x: pad, y: pad, w: W, h: H }, mode, L);
  } finally { LGO = null; }
  cv.style.height = Math.round((H + pad * 2) / dpr) + 'px'; cv.style.width = 'auto';
  return cv;
}
// سطر الترحيب في الرئيسية: شعار البرنامج المفتوح يُكتب من اليمين، ثم الدفعة والتحية
function progMark(P, cls, greet) {
  P = P || V6.prog; const cv = P && progLogoCanvas(P, cls === 'm' ? 40 : 54); if (!cv) return null;
  const T = (progLogoInfo(P) || {}).T, gold = (T && T.c && T.c.a) || P.color || '#c08f4e';
  return el('div', { class: 'pmark' + (cls ? ' pmark-' + cls : ''), style: '--pm-ac:' + gold }, [
    el('span', { class: 'pmark-logo' }, [cv]),
    el('span', { class: 'pmark-txt' }, [P.tagline ? el('b', { class: 'pmark-tag', text: P.tagline }) : null, greet ? el('span', { class: 'pmark-greet', text: greet }) : null])
  ]);
}

/* ---------- دعوة إلى تطبيق الجوال (تظهر على الشاشات الصغيرة في الموقع) ---------- */
function appPromo() {
  if (document.body.classList.contains('mapp') || window.innerWidth > 760 || (ls('appPromoOff') && !ls('preferWeb'))) return null;
  const b = el('div', { class: 'apppromo rv' }, [el('img', { src: 'icons/icon-192.png', alt: '', onerror: function (e) { e.target.remove(); } }), el('div', { class: 'grow' }, [el('b', { text: 'تطبيق أثر للجوال' }), el('span', { class: 'tiny', text: 'صمّم وانشر من هاتفك بواجهة خاصة به.' })]),
    el('a', { class: 'btn sm dark', href: appHref(), text: 'افتح التطبيق', onclick: function () { ls('preferWeb', null); } }), el('button', { type: 'button', class: 'ib sm', 'aria-label': 'إخفاء', onclick: function () { ls('appPromoOff', true); b.remove(); } }, [ico('close')])]);
  return b;
}
/* ---------- إشارة «المزيد في الأسفل»: تظهر حتى يبدأ التمرير ---------- */
function scrollCue() {
  const c = el('a', { class: 'scue', href: '#modelsec', 'aria-label': 'انزل إلى الأقسام', onclick: function (e) { e.preventDefault(); const t = document.querySelector('.hgrid2') || document.querySelector('.hsec'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, [el('span', { class: 'scue-t', text: 'المزيد في الأسفل' }), el('span', { class: 'scue-m' }, [el('span', { class: 'scue-d' })])]);
  const on = function () { if (window.scrollY > 80) { c.classList.add('gone'); window.removeEventListener('scroll', on); } };
  window.addEventListener('scroll', on, { passive: true });
  return c;
}
/* ---------- طرق البدء داخل كل هوية (تصاميمي في شريط التنقل، فلا تتكرر هنا) ---------- */
function quickCards(tid) {
  return el('div', { class: 'quick' }, [
    progFeat('ai') ? ['#/make?tid=' + tid, 'اصنع إعلانك', 'اكتب فكرتك، ونقترح التصاميم', 'ai', 't-pu'] : null,
    ['#/e/' + tid + '/blank', 'صفحة بيضاء', 'صمّم من الصفر بحرية كاملة', 'wand', 't-ink'],
    progFeat('slides') ? ['#/s/' + tid, 'الشرائح', 'عروض للقاءات والمحاضرات', 'slides', 't-bl'] : null
  ].filter(Boolean).map(function (q, i) {
    return el('a', { href: q[0], class: 'qcard hover-lift rv', style: '--d:' + i, 'data-tour': 'q' + i }, [el('span', { class: 'icon-tile ' + q[4] }, [ico(q[3])]), el('div', {}, [el('b', { text: q[1] }), el('span', { text: q[2] })])]);
  }));
}

/* ---------- المصمّم الذكي في الرئيسية: فكرة بكلماتك، وحركة مستمرة لبطاقات تتشكّل ---------- */
function aiDesignerBox() {
  if (!progFeat('ai')) return null;
  const ta = el('textarea', { class: 'aita', rows: '2', dir: 'auto', 'aria-label': 'فكرة الإعلان', placeholder: 'اكتب فكرة إعلانك بكلماتك: لقاء، مسابقة، تهنئة، ورشة… أو اتركه يبدع' });
  const start = function (creative) { const t = ta.value.trim(); ls('make', Object.assign(ls('make') || {}, { text: t, creative: !!creative })); go('#/make' + (creative ? '?creative=1' : '')); };
  ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); start(false); } });
  const ai = typeof aiReady === 'function' && aiReady();
  // ثلاث بطاقات تتبدّل تخطيطاتها وألوانها بلا توقف
  const tracks = tracksOf(), cols = tracks.slice(0, 5).map(function (t) { return t.c; });
  const cards = [0, 1, 2].map(function (i) { return el('div', { class: 'aic c' + i, 'aria-hidden': 'true' }, [el('i', { class: 'l1' }), el('i', { class: 'l2' }), el('i', { class: 'l3' }), el('b')]); });
  const orb = el('div', { class: 'aiorb', 'aria-hidden': 'true' }, [el('i'), el('i'), el('i')]);
  const stage = el('div', { class: 'aistage' }, cards.concat([orb]));
  let k = 0;
  const cycle = function () {
    if (!stage.isConnected) return;
    cards.forEach(function (c, i) { const col = cols[(k + i) % Math.max(1, cols.length)] || { p: '#171717', a: '#f88833', paper: '#f4f4f4' }; c.style.setProperty('--p', col.p); c.style.setProperty('--a', col.a); c.style.setProperty('--paper', col.paper); c.dataset.layout = String((k + i) % 4); });
    k++; setTimeout(cycle, 3200);
  };
  cycle();
  return el('section', { class: 'aibox rv', style: '--d:3', 'data-tour': 'q0' }, [
    el('div', { class: 'aitext' }, [
      el('span', { class: 'aichip' }, [ico('sparkles'), 'المصمّم الذكي']),
      el('h2', { text: 'قل ما تريد، ونصمّمه لك' }),
      el('p', { class: 'muted', text: ai ? 'يقترح تصاميم جاهزة بهوية برنامجك من كلماتك، أو يسألك أسئلة قصيرة ليصيب ما تريد بالضبط.' : 'يسألك أسئلة قصيرة ويقترح القوالب الأنسب بهوية برنامجك.' }),
      ta,
      el('div', { class: 'row wrapr' }, [
        el('button', { type: 'button', class: 'btn dark lg', onclick: function () { start(false); } }, [ico('ai'), 'ابدأ التصميم']),
        el('button', { type: 'button', class: 'btn line', onclick: function () { start(true); } }, [ico('wand'), 'دعه يبدع'])
      ])
    ]),
    stage
  ]);
}

/* ---------- تحية الوقت، ورسائل تتبدّل باسم المستخدم ---------- */
function timeGreeting(n) {
  const h = new Date().getHours(), fri = new Date().getDay() === 5;
  if (fri && h >= 5 && h < 20) return 'جمعة مباركة يا ' + n;
  if (h >= 5 && h < 12) return 'صباح الخير يا ' + n;
  if (h >= 12 && h < 16) return 'طاب يومك يا ' + n;
  if (h >= 16 && h < 20) return 'مساء الخير يا ' + n;
  if (h >= 20) return 'مساء النور يا ' + n;
  return 'ما زلت مستيقظاً يا ' + n + '؟';
}
// [النص، المصدر إن وُجد]. {n} اسم المستخدم
const HOME_MSGS = [
  ['ماذا ستصمّم اليوم يا {n}؟'], ['كيف حالك اليوم يا {n}؟'], ['أيّ أثرٍ ستترك اليوم يا {n}؟'], ['عساك بخير يا {n}، وعسى يومك مباركاً'],
  ['لا تقلق يا {n}، زرّ التراجع صديقك الوفي'], ['القهوة جاهزة؟ إذن نبدأ يا {n}'], ['تصميم واحد متقن خيرٌ من عشرة على عجل'], ['الشعار في مكانه؟ ممتاز، نصف المهمة انتهى'],
  ['«إنّ الله يحبّ إذا عمل أحدكم عملاً أن يتقنه»', 'حديث حسن، رواه أبو يعلى والطبراني'], ['«إنّ الله كتب الإحسان على كلّ شيء»', 'رواه مسلم'],
  ['«ونكتب ما قدموا وآثارهم»', 'سورة يس: ١٢'],
  ['إعلانك قد يكون أول ما يراه شابٌّ عن البرنامج، فاجعله يليق'], ['وراء كل تصميم لقاء، ووراء كل لقاء قلوبٌ تتربّى'], ['الإتقان في التفاصيل الصغيرة: المسافات، والخط، والهدوء'],
  ['جدّد نيّتك يا {n}، فالعمل الصغير يكبر بها'], ['ما بين *نجمتين* يظهر بلون مميّز، جرّبها يا {n}'], ['خطّ العنوان يسألك: هل جرّبتني كبيراً؟'], ['تصميم اليوم دعوةٌ إلى خير، فبارك الله في يدك']
];
function rotateMessages(h1, src, n) {
  const late = new Date().getHours() < 5;
  const list = HOME_MSGS.slice();
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = list[i]; list[i] = list[j]; list[j] = t; }
  list.unshift(late ? ['لا تنسَ نصيبك من الراحة يا {n}'] : HOME_MSGS[0]);
  let i = 0, paused = false;
  const show = function (m) {
    const txt = m[0].replace(/\{n\}/g, n);
    h1.innerHTML = ''; txt.split(/(\*[^*]+\*)/).forEach(function (part) { if (/^\*.+\*$/.test(part)) h1.appendChild(el('em', { text: part.slice(1, -1) })); else if (part) h1.appendChild(document.createTextNode(part)); });
    h1.classList.toggle('long', txt.length > 34); src.textContent = m[1] || '';
  };
  show(list[0]);
  h1.parentNode.addEventListener('mouseenter', function () { paused = true; }); h1.parentNode.addEventListener('mouseleave', function () { paused = false; });
  const tm = setInterval(function () {
    if (!h1.isConnected) { clearInterval(tm); return; }
    if (paused || document.hidden) return;
    i = (i + 1) % list.length;
    h1.classList.add('out'); src.classList.add('out');
    setTimeout(function () { show(list[i]); h1.classList.remove('out'); src.classList.remove('out'); }, 420);
  }, 7000);
}

/* ---------- الساعة والتاريخ الهجري والميلادي وتقويم الشهر ---------- */
function hijriParts(d) {
  try {
    const p = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(d);
    const o = {}; p.forEach(function (x) { o[x.type] = +String(x.value).replace(/\D/g, '') || x.value; }); return { d: o.day, m: o.month, y: o.year };
  } catch (e) { return null; }
}
function hijriMonthName(d) { try { return new Intl.DateTimeFormat('ar-u-ca-islamic-umalqura-nu-latn', { month: 'long' }).format(d).replace('ربيع الآخر', 'ربيع الثاني').replace('جمادى الآخرة', 'جمادى الثانية'); } catch (e) { return ''; } }
const WD = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
function clockCard() {
  let mode = ls('calMode') || 'h', off = 0;
  const time = el('b', { class: 'ctime' }), ampm = el('small', { class: 'campm' }), wd = el('div', { class: 'cwd' }), dh = el('div', { class: 'cdh' }), dg = el('div', { class: 'cdg' });
  const cal = el('div', { class: 'cal6' }), title = el('b', { class: 'ctitle' });
  const tick = function () {
    const d = new Date(); let h = d.getHours(); const m = String(d.getMinutes()).padStart(2, '0');
    ampm.textContent = h < 12 ? 'ص' : 'م'; h = h % 12 || 12; time.textContent = h + ':' + m;
    const hp = hijriParts(d);
    wd.textContent = WD[d.getDay()];
    dh.textContent = hp ? hp.d + ' ' + hijriMonthName(d) + ' ' + hp.y + ' هـ' : '';
    dg.textContent = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(d) + ' م';
  };
  function grid() {
    cal.innerHTML = '';
    const today = new Date(); today.setHours(12, 0, 0, 0);
    let days = [];
    if (mode === 'g') {
      const first = new Date(today.getFullYear(), today.getMonth() + off, 1, 12);
      title.textContent = new Intl.DateTimeFormat('ar-u-nu-latn', { month: 'long', year: 'numeric' }).format(first);
      for (let x = new Date(first); x.getMonth() === first.getMonth(); x.setDate(x.getDate() + 1)) days.push({ dt: new Date(x), n: x.getDate() });
    } else {
      // الشهر الهجري: نرجع إلى أوله ثم نتقدم حتى يتغير الشهر
      if (!hijriParts(today)) return;
      const first1 = function (d) { while (hijriParts(d).d !== 1) d = new Date(d.getTime() - 864e5); return d; };
      let x = first1(new Date(today));
      for (let k = 0; k < Math.abs(off); k++) x = first1(new Date(x.getTime() + (off > 0 ? 31 : -1) * 864e5));
      const hp0 = hijriParts(x), hm = hp0.m, hy = hp0.y;
      title.textContent = hijriMonthName(x) + ' ' + hy + ' هـ';
      for (let y = new Date(x); hijriParts(y).m === hm; y = new Date(y.getTime() + 864e5)) days.push({ dt: new Date(y), n: hijriParts(y).d });
    }
    // الأسبوع يبدأ بالسبت
    const lead = (days[0].dt.getDay() + 1) % 7;
    ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'].forEach(function (w) { cal.appendChild(el('span', { class: 'cw', text: w })); });
    for (let k = 0; k < lead; k++) cal.appendChild(el('span'));
    days.forEach(function (q) {
      const isT = q.dt.toDateString() === today.toDateString(), fri = q.dt.getDay() === 5, key = q.dt.toDateString();
      const other = mode === 'g' ? hijriParts(q.dt).d : q.dt.getDate(), n = (POSTS_BY_DAY[key] || []).length;
      cal.appendChild(el('a', { href: '#/cal?d=' + localISO(q.dt), class: 'cd' + (isT ? ' today' : '') + (fri ? ' fri' : '') + (n ? ' has' : ''), title: (n ? n + ' منشور مجدول · ' : '') + (mode === 'g' ? other + ' ' + hijriMonthName(q.dt) : q.dt.toLocaleDateString('ar-u-nu-latn', { day: 'numeric', month: 'long' })) }, [String(q.n), n ? el('i', { class: 'pdot6' }) : null]));
    });
  }
  const seg = segOf([['h', 'هجري'], ['g', 'ميلادي']], mode, function (v) { mode = v; off = 0; ls('calMode', v); grid(); });
  const nav = el('div', { class: 'cnav' }, [
    el('button', { type: 'button', class: 'ib sm', 'aria-label': 'الشهر السابق', onclick: function () { off--; grid(); } }, [ico('chev')]),
    title,
    el('button', { type: 'button', class: 'ib sm nx', 'aria-label': 'الشهر التالي', onclick: function () { off++; grid(); } }, [ico('chev')])
  ]);
  tick(); grid();
  const card = el('aside', { class: 'clock6 rv', style: '--d:1', 'aria-label': 'الوقت والتاريخ' }, [
    el('div', { class: 'ctop' }, [el('div', { class: 'cclock' }, [time, ampm]), el('div', { class: 'cdates' }, [wd, dh, dg])]),
    el('details', { class: 'cdet', open: innerWidth > 700 }, [el('summary', { text: 'التقويم' }), el('div', { class: 'chead' }, [nav, seg]), cal])
  ]);
  const t = setInterval(function () { if (!card.isConnected) { clearInterval(t); return; } tick(); }, 15000);
  // أيام المنشورات المجدولة تُعلَّم في الشهر (القائمة نفسها في عمود التحية)
  if (V6.settings && V6.settings.tg) calLoad().then(grid).catch(function () {});
  return card;
}
let POSTS = null, POSTS_BY_DAY = {};
function loadPosts(cb) {
  if (!V6.settings || !V6.settings.tg) return;
  const done = function (list) { POSTS = list; POSTS_BY_DAY = {}; list.forEach(function (x) { if (x.status !== 'queued') return; const k = new Date(x.when).toDateString(); (POSTS_BY_DAY[k] = POSTS_BY_DAY[k] || []).push(x); }); cb(list); };
  if (POSTS) { done(POSTS); return; }
  API6.me('tg_queue', V6.prog.id).then(done).catch(function () {});
}
function idCard6(t, i) {
  const im = IMG[t.logo];
  const box = el('div', { class: 'idlogo' });
  if (im) box.appendChild(el('img', { src: ASSETS[t.logo], alt: '' }));
  else box.appendChild(el('span', { class: 'idname', style: 'color:' + t.c.p, text: t.name }));
  return el('a', { href: '#/g/' + t.id, class: 'idcard hover-lift rv', style: '--d:' + (i % 6) + ';--tc:' + t.c.p, 'data-tour': i === 0 ? 'identity' : null }, [
    box,
    el('div', { class: 'idmeta' }, [el('b', { text: t.full.replace('ـ', '') }), el('div', { class: 'sw' }, ['pd', 'p', 'pl', 's', 'a'].map(function (k) { return el('i', { style: 'background:' + t.c[k] }); }))])
  ]);
}
// النماذج: تصاميم جاهزة اختارها المشرف لكل مستخدمي البرنامج (تُفتح نسخة لهم)
function modelCard(x) {
  const T = TRACKS[x.track];
  return el('a', { class: 'scard hover-lift', href: '#/d/' + x.id }, [el('img', { src: x.thumb || '', alt: '', loading: 'lazy' }), el('b', { text: x.name }), el('span', { class: 'tiny', text: T ? T.name : '' })]);
}
async function loadRecent(box) {
  try {
    const all = await API6.me('item_list');
    const ms = all.filter(function (x) { return x.model && x.program === V6.prog.id && TRACKS[x.track]; }).slice(0, 12), mb = $('#models');
    if (ms.length && mb) { $('#modelsec').hidden = false; ms.forEach(function (x) { mb.appendChild(modelCard(x)); }); }
    const list = all.filter(function (x) { return x.mine && x.program === V6.prog.id; }).slice(0, 8);
    if (!list.length) return;
    $('#recentsec').hidden = false;
    list.forEach(function (x) { box.appendChild(el('a', { class: 'scard hover-lift', href: '#/d/' + x.id }, [el('img', { src: x.thumb || '', alt: '', loading: 'lazy' }), el('b', { text: x.name }), el('span', { class: 'tiny', text: ago(x.at) })])); });
  } catch (e) {}
}

/* ---------- معرض قوالب الهوية ---------- */
function showGallery6(tid, type) {
  const q0 = (location.hash.split('?q=')[1] || '');
  tid = tid.split('?')[0]; type = (type || 'all').split('?')[0];
  const T = trackOf(tid); if (!T) return go('#/');
  ls('lastTrack', T.id);
  document.title = 'قوالب ' + T.name;
  const VIS = visibleTpls();
  const types = TYPES.filter(function (ty) { return VIS.some(function (t) { return t.type === ty.id; }); });
  let cur = type;
  const chips = el('div', { class: 'chips rv' }, [['all', 'الكل'], ['new', 'الجديد']].concat(types.map(function (t) { return [t.id, t.name]; })).map(function (c) {
    return el('button', { type: 'button', class: 'chip' + (c[0] === cur ? ' on' : ''), onclick: function (e) { cur = c[0]; $$('.chip', chips).forEach(function (x) { x.classList.remove('on'); }); e.currentTarget.classList.add('on'); fill(); history.replaceState(null, '', '#/g/' + T.id + (cur === 'all' ? '' : '/' + cur)); } }, [c[1]]);
  }));
  const search = el('input', { type: 'search', class: 'inp gsearch', placeholder: 'ابحث في القوالب…', value: decodeURIComponent(q0), 'aria-label': 'بحث' });
  const grid = el('div', { class: 'tgrid' });
  const empty = el('p', { class: 'empty', text: 'لا قالب يطابق بحثك.', hidden: true });
  function fill() {
    grid.innerHTML = '';
    const qs = norm(search.value).split(/\s+/).filter(Boolean);
    let list = cur === 'all' ? VIS : cur === 'new' ? VIS.filter(function (t) { return t.isNew || t.pack; }) : VIS.filter(function (t) { return t.type === cur; });
    list = list.filter(function (t) { const ty = TYPES.find(function (x) { return x.id === t.type; }) || {}; const hay = norm([t.name, t.tags, ty.name].join(' ')); return qs.every(function (w) { return hay.indexOf(w) >= 0; }); });
    empty.hidden = list.length > 0;
    list.forEach(function (tpl, i) {
      const ty = TYPES.find(function (x) { return x.id === tpl.type; }) || { name: '' };
      const szs = sizesFor(tpl), szk = szs[0];
      grid.appendChild(el('a', { class: 'tcard6 hover-lift', href: '#/e/' + T.id + '/' + tpl.id, style: '--d:' + (i % 8) }, [
        el('div', { class: 'tthumb' }, [tplThumb(tpl, T, szk, 300, null, i < EAGER_N), (tpl.isNew || tpl.pack) ? el('span', { class: 'pill or tnew', text: 'جديد' }) : null]),
        el('div', { class: 'tmeta6' }, [el('b', { text: tpl.name }), el('span', { class: 'tiny', text: ty.name + ' · ' + szs.map(function (s) { return SIZES[s].name; }).join('، ') })])
      ]));
    });
  }
  search.addEventListener('input', fill);
  const im = IMG[T.logo];
  view(el('div', { class: 'wrap page' }, [
    el('div', { class: 'ghead6' }, [
      el('a', { href: '#/', class: 'ib back', 'aria-label': 'رجوع' }, [ico('chev')]),
      im ? el('img', { class: 'glogo rv', src: ASSETS[T.logo], alt: '' }) : null,
      el('div', { class: 'gt' }, [H('h1', T.full.replace('ـ', '')), el('div', { class: 'sw rv' }, ['pd', 'p', 'pl', 's', 'sd', 'a', 'a2'].map(function (k) { return el('i', { style: 'background:' + T.c[k], title: T.c[k] }); }))]),
    ]),
    quickCards(T.id),
    el('section', { class: 'hsec', id: 'gmodels', hidden: true }, [el('div', { class: 'shead' }, [H('h2', 'نماذج جاهزة لهذه الهوية')]), stripNav(el('div', { class: 'strip models-strip', id: 'gmstrip' }))]),
    el('div', { class: 'gbar' }, [chips, search]),
    grid, empty
  ]));
  fill();
  API6.me('item_list').then(function (all) {
    const ms = all.filter(function (x) { return x.model && x.track === T.id; }), box = $('#gmstrip');
    if (!ms.length || !box) return; $('#gmodels').hidden = false; ms.forEach(function (x) { box.appendChild(modelCard(x)); });
  }).catch(function () {});
}
