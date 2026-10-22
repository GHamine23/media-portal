/* ================= الواجهة ================= */
const $ = function (s, r) { return (r || document).querySelector(s); };
const el = function (tag, attrs, kids) {
  const e = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach(function (k) {
    if (k === 'text') e.textContent = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
  });
  (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
  return e;
};

/* حالة التصميم المفتوح: d النصوص، hide المخفي، ov الألوان المخصصة */
const S = { track: null, type: 'all', tpl: null, size: null, variant: null, k: 1, d: {}, hide: {}, ov: {}, pos: {}, gs: {}, layers: [], bgfx: null, sel: null, hijriAdj: 0, tab: 'content', q: '', mine: null, mineName: '', mineKey: '', curKey: '' };
const UP = {};          // الصور المرفوعة: النص ← عنصر الصورة
function store(key, val) { try { if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null'); localStorage.setItem(key, JSON.stringify(val)); } catch (e) { return null; } }

/* الخطوط تفضيل عام لكل القوالب */
function saveFonts() { const f = { title: FS.title, body: FS.body, tw: FS.tw }; store('jz1.fonts', f); PREFS.fonts = f; savePrefs(); }

/* ---------- التنقّل ----------
   #/            المسارات
   #/جذور        كل القوالب
   #/جذور/k/نوع  قوالب نوع واحد
   #/جذور/e/قالب التحرير */
window.addEventListener('hashchange', route);
function route() {
  const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (p[1] !== 'd') S.deck = null;
  const tr = trackOf(p[0]);
  if (!tr) { applyTrackCss(null); return showHome(); }
  S.track = tr; applyTrackCss(tr);
  if (PREFS.lastTrack !== tr.id) { PREFS.lastTrack = tr.id; savePrefs(); }
  if (p[1] !== 'm') { S.mine = null; S.mineName = ''; S.mineKey = ''; }
  if (p[1] === 'e') {
    const tpl = TEMPLATES.find(function (t) { return t.id === p[2]; });
    if (tpl) return showEditor(tpl);
  }
  if (p[1] === 'studio') return showEditor(TEMPLATES.find(function (t) { return t.id === 'blank'; }));
  if (p[1] === 'make') return showMake();
  if (p[1] === 'mine') return showMine();
  if (p[1] === 'slides') return showSlides();
  if (p[1] === 'd' && p[2]) return openDeck(p[2]);
  if (p[1] === 'm' && p[2]) return openMine(p[2]);
  showGallery(p[1] === 'k' && (TYPES.some(function (t) { return t.id === p[2]; }) || p[2] === 'new') ? p[2] : 'all');
}
function applyTrackCss(tr) {
  const r = document.documentElement.style;
  const c = tr ? tr.c : { p: ACADEMY.teal, pd: '#0e5753', s: ACADEMY.purple, sd: '#3b1f48', a: ACADEMY.orange };
  r.setProperty('--p', c.p); r.setProperty('--pd', c.pd); r.setProperty('--s', c.s); r.setProperty('--sd', c.sd); r.setProperty('--a', c.a);
  r.setProperty('--pt', alpha(c.p, 0.14));
  document.body.classList.toggle('in-track', !!tr);
}
// شريط أعلى الصفحة: زر الرجوع ومسار التنقل
function navbar(items, upHref) {
  const n = el('nav', { class: 'crumbs' });
  items.forEach(function (it, i) {
    if (i) n.appendChild(el('span', { class: 'sep', text: '‹' }));
    n.appendChild(it.href ? el('a', { href: it.href, text: it.t }) : el('b', { text: it.t }));
  });
  return el('div', { class: 'navbar' }, [
    el('button', { type: 'button', class: 'back', 'aria-label': 'رجوع', onclick: function () { location.hash = upHref; } }, [el('span', { text: '→' }), 'رجوع']),
    n
  ]);
}
function main() { const m = $('#main'); m.innerHTML = ''; Array.from(arguments).forEach(function (k) { if (k) m.appendChild(k); }); }

/* ---------- الصفحة الأولى: الهويات ---------- */
function idCard(t) {
  const cv = el('canvas', { width: 520, height: 230 });
  const g = cv.getContext('2d');
  const im = IMG[t.logo]; if (im) { const ar = srcW(im) / srcH(im), h = Math.min(180, 360 / ar), w = h * ar; g.drawImage(im, 260 - w / 2, 115 - h / 2, w, h); }
  const n = TEMPLATES.filter(function (x) { return !x.hidden; }).length;
  return el('a', { class: 'track', href: '#/' + t.id, style: '--tc:' + t.c.p + ';--tcl:' + alpha(t.c.p, 0.1) }, [
    el('div', { class: 'tlogo' }, [cv]),
    el('div', { class: 'tn' }, [el('b', { text: t.full.replace('ـ', '') }), el('span', { text: n + ' قالباً' })]),
    el('div', { class: 'sw' }, ['pd', 'p', 'pl', 's', 'a'].map(function (c) { return el('i', { style: 'background:' + t.c[c] }); }))
  ]);
}
function showHome() {
  document.title = 'البوابة الإعلامية للبرامج الإلكترونية';
  const last = TRACKS[PREFS.lastTrack] ? PREFS.lastTrack : 'judhoor', LT = TRACKS[last];
  const quick = el('div', { class: 'quick', 'data-tour': 'quick' }, [
    ['make', 'اصنع إعلانك', 'اكتب المعلومات، ونقترح التصاميم', 'petal'],
    ['k/social', 'مواقع التواصل', 'قصص وحالات ومنشورات', 'stars2'],
    ['slides', 'الشرائح', 'عروض للقاءات والمحاضرات', 'rsq'],
    ['mine', 'قوالبي', 'ما حفظته لتبدأ منه', 'star']
  ].map(function (q, i) {
    return el('a', { class: 'qk q' + i, href: '#/' + last + '/' + q[0] }, [
      miniCanvas(function (g, s) { STICKERS[q[3]].draw(g, s * 0.9, '#ffffff'); }, 44, 44),
      el('div', {}, [el('b', { text: q[1] }), el('span', { text: q[2] })])
    ]);
  }));
  const newOnes = TEMPLATES.filter(function (t) { return !t.hidden && (t.isNew || t.pack); });
  const ids = Object.keys(TRACKS);
  const strip = el('div', { class: 'newstrip' });
  newOnes.slice(0, 14).forEach(function (tpl, i) {
    const T = TRACKS[ids[i % ids.length]], sz = tpl.sizes.indexOf('post') >= 0 ? 'post' : tpl.sizes[0], c = el('canvas');
    strip.appendChild(el('a', { class: 'nw', href: '#/' + T.id + '/e/' + tpl.id, title: tpl.name + ' — ' + T.name }, [c, el('small', { text: tpl.name })]));
    setTimeout(function () { renderTo(c, tpl, sz, { d: defaults(tpl, T), variant: tpl.variants[0].id, k: 1 }, T, 0.2); }, 40 + i * 30);
  });
  const grid = function (g) { return el('div', { class: 'tracks' }, Object.keys(TRACKS).filter(function (id) { return TRACKS[id].group === g; }).map(function (id) { return idCard(trackOf(id)); })); };
  main(
    el('section', { class: 'hero' }, [
      el('div', { class: 'htext' }, [
        el('span', { class: 'kick', text: 'أكاديمية الجيل الصاعد' }),
        el('h1', { text: 'البوابة الإعلامية للبرامج الإلكترونية' }),
        el('p', { text: 'اختر الهوية، ثم القالب، واكتب ما تريد. الألوان والخطوط والشعارات محفوظة كما صمّمها فريق الإعلام، والتحميل بجودة عالية.' })
      ]),
      quick,
      el('p', { class: 'qnote' }, ['الاختصارات تفتح بهوية ', el('b', { text: LT.full.replace('ـ', '') }), '، وتغيّرها باختيار أي هوية من الأسفل.'])
    ]),
    el('h2', { class: 'h', text: 'المسارات' }), el('div', { 'data-tour': 'tracks' }, [grid('track')]),
    el('h2', { class: 'h', text: 'الأنشطة التربوية' }), el('p', { class: 'hnote', text: 'هويات الأنشطة، ولكل نشاط القوالب كلها. ويمكنك في أي تصميم نقله إلى هوية أخرى بضغطة.' }),
    el('div', { 'data-tour': 'acts' }, [grid('act')]),
    newOnes.length ? el('h2', { class: 'h', text: 'جديد البوابة' }) : null, newOnes.length ? strip : null
  );
  window.scrollTo(0, 0);
  setTimeout(function () { startTour('home'); }, 400);
}

/* ---------- الصفحة الثانية: القوالب ---------- */
let thumbJob = 0;
function norm(s) { return String(s || '').replace(/[ًٌٍَُِّْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase(); }
function logoPicker(T, after) {
  if (!T.logos) return null;
  return el('div', { class: 'lgpick' }, [el('span', { text: 'نسخة الشعار:' }), seg(T.logos.map(function (l) { return [l[0], l[1]]; }), T.logo, function (v) {
    PREFS.logos[T.id] = v; savePrefs(); S.track = trackOf(T.id); TINT_CLEAR(); if (after) after();
  })]);
}
function showGallery(typeId) {
  S.type = typeId;
  const T = S.track;
  document.title = 'قوالب ' + T.name;
  const VIS = TEMPLATES.filter(function (t) { return !t.hidden; });
  const social = function (t) { return t.type === 'social' || t.sizes.indexOf('story') >= 0; };
  const chips = el('div', { class: 'chips', role: 'tablist' }, [['all', 'الكل', VIS.length], ['new', 'الجديد', VIS.filter(function (t) { return t.isNew || t.pack; }).length]].concat(TYPES.map(function (ty) {
    return [ty.id, ty.name, VIS.filter(function (t) { return ty.id === 'social' ? social(t) : t.type === ty.id; }).length];
  })).filter(function (c) { return c[2]; }).map(function (c) {
    return el('a', { href: '#/' + T.id + (c[0] === 'all' ? '' : '/k/' + c[0]), class: 'chip' + (c[0] === typeId ? ' on' : ''), role: 'tab' }, [c[1], el('small', { text: String(c[2]) })]);
  }));
  const search = el('input', { type: 'search', class: 'search', placeholder: 'ابحث: مسابقة، ورشة، شكر، قصة، جدول…', value: S.q, 'aria-label': 'بحث في القوالب' });
  const wrap = el('div', { class: 'gallery all' });
  const empty = el('p', { class: 'empty', text: 'لا قالب يطابق بحثك. جرّب كلمة أخرى، أو اختر «الكل».' });
  const job = ++thumbJob; let n = 0;
  const cards = [];
  let list = VIS;
  if (typeId === 'new') list = VIS.filter(function (t) { return t.isNew || t.pack; });
  else if (typeId === 'social') list = VIS.filter(function (t) { return t.type === 'social'; }).concat(VIS.filter(function (t) { return t.type !== 'social' && t.sizes.indexOf('story') >= 0; }));
  else if (typeId !== 'all') list = VIS.filter(function (t) { return t.type === typeId; });
  else list = TYPES.reduce(function (acc, ty) { return acc.concat(VIS.filter(function (t) { return t.type === ty.id; })); }, []);
  S.prefSize = typeId === 'social' ? 'story' : '';
  list.forEach(function (tpl) {
    const ty = TYPES.find(function (x) { return x.id === tpl.type; }) || { id: tpl.type, name: '' };
    const szk = S.prefSize && tpl.sizes.indexOf(S.prefSize) >= 0 ? S.prefSize : tpl.sizes[0];
    const sz = SIZES[szk], sc = Math.min(0.34, 360 / sz.h);
    const cv = el('canvas', { width: Math.round(sz.w * sc), height: Math.round(sz.h * sc) });
    const card = el('a', { class: 'tcard', href: '#/' + T.id + '/e/' + tpl.id }, [
      el('div', { class: 'thumb' }, [cv, el('span', { class: 'badge t-' + ty.id, text: ty.name }), (tpl.isNew || tpl.pack) ? el('span', { class: 'nbadge', text: 'جديد' }) : null]),
      el('div', { class: 'tmeta' }, [el('b', { text: tpl.name }), el('span', { text: tpl.sizes.map(function (s) { return SIZES[s].name; }).join('، ') })])
    ]);
    card.dataset.q = norm([tpl.name, tpl.tags, ty.name, ty.desc].join(' '));
    cards.push({ card: card });
    wrap.appendChild(card);
    setTimeout(function () {
      if (job !== thumbJob) return;
      const st = loadState(T, tpl);
      if (S.prefSize && tpl.sizes.indexOf(S.prefSize) >= 0) st.size = S.prefSize;
      renderTo(cv, tpl, st.size, st, T, sc);
    }, 25 * (n++));
  });
  function filter() {
    S.q = search.value;
    const qs = norm(search.value).split(/\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach(function (c) { const ok = qs.every(function (w) { return c.card.dataset.q.indexOf(w) >= 0; }); c.card.hidden = !ok; if (ok) shown++; });
    empty.hidden = shown > 0;
  }
  search.addEventListener('input', filter);
  const entries = el('div', { class: 'entries' }, [
    ['make', 'اصنع إعلانك', 'اكتب المعلومات، ونقترح عليك تصاميم جاهزة بها', 'petal'],
    ['studio', 'المصمم المساعد', 'صفحة بيضاء، ومساعد يقترح الهيكل والألوان والمواضع', 'sparkle'],
    ['slides', 'الشرائح', 'عروض للقاءات والمحاضرات، تُحمَّل PDF', 'rsq'],
    ['mine', 'قوالبي', 'ما حفظته أنت وما شاركه الفريق', 'stars2']
  ].map(function (e) {
    return el('a', { class: 'entry', href: '#/' + T.id + '/' + e[0] }, [miniCanvas(function (g, s) { STICKERS[e[3]].draw(g, s * 0.9, T.c.p); }, 50, 50),
      el('div', {}, [el('b', { text: e[1] }), el('span', { text: e[2] })])]);
  }));
  const im = IMG[T.logo];
  const head = el('div', { class: 'idhead' }, [
    im ? el('img', { src: ASSETS[T.logo], alt: T.name, class: 'idlogo' }) : null,
    el('div', { class: 'idt' }, [el('small', { text: T.group === 'track' ? 'المسار' : 'النشاط' }), el('h1', { text: T.full.replace('ـ', '') }),
      el('div', { class: 'sw' }, ['pd', 'p', 'pl', 's', 'sd', 'a', 'a2'].map(function (c) { return el('i', { style: 'background:' + T.c[c], title: T.c[c] }); }))]),
    logoPicker(T, function () { showGallery(typeId); })
  ]);
  main(
    navbar([{ t: 'الرئيسية', href: '#/' }, { t: T.full.replace('ـ', '') }], '#/'),
    head, entries,
    el('div', { class: 'ghead' }, [el('h2', { class: 'h', text: typeId === 'social' ? 'قوالب مواقع التواصل' : 'أو اختر قالباً' }), search]),
    typeId === 'social' ? el('p', { class: 'hnote', text: 'القصص أولاً، ثم كل قالب يصلح للقصص والحالات، ويفتح بمقاس القصة.' }) : null,
    chips, wrap, empty
  );
  filter();
  window.scrollTo(0, 0);
  setTimeout(function () { startTour('gallery'); }, 600);
}

/* ---------- البيانات ---------- */
function defaults(tpl, T) {
  const d = {};
  tpl.fields.forEach(function (f) {
    if (!f.k) return;
    if (f.kind === 'image') d[f.k] = f.def ? { src: 'lib:' + f.def, z: 1, ox: 0, oy: 0 } : null;
    else d[f.k] = f.def;
  });
  if ('arc' in d && T) d.arc = T.full;
  if (T) Object.keys(d).forEach(function (k) { if (typeof d[k] === 'string') d[k] = d[k].replace(/مسار جـ?ذور/g, T.full.replace('ـ', '')); });
  return d;
}
function skey(T, tpl) { return 'jz1.' + T.id + '.' + tpl.id; }
function loadState(T, tpl, key) {
  const saved = store(key || skey(T, tpl)) || {};
  const d = defaults(tpl, T);
  if (saved.d) Object.keys(saved.d).forEach(function (k) { if (k in d && saved.d[k] !== undefined) d[k] = saved.d[k]; });
  return {
    d: d, size: tpl.sizes.indexOf(saved.size) >= 0 ? saved.size : tpl.sizes[0],
    variant: tpl.variants.some(function (v) { return v.id === saved.variant; }) ? saved.variant : tpl.variants[0].id,
    k: saved.k || 1, hide: saved.hide || {}, ov: saved.ov || {}, pos: saved.pos || {}, gs: saved.gs || {}, layers: saved.layers || [], bgfx: saved.bgfx || null
  };
}
function snap() {
  const d = {}; Object.keys(S.d).forEach(function (k) { const x = S.d[k]; d[k] = x && typeof x === 'object' ? Object.assign({}, x) : x; });
  return { d: d, size: S.size, variant: S.variant, k: S.k, hide: Object.assign({}, S.hide), ov: Object.assign({}, S.ov),
    pos: JSON.parse(JSON.stringify(S.pos || {})), gs: JSON.parse(JSON.stringify(S.gs || {})), layers: (S.layers || []).map(function (L) { return Object.assign({}, L); }), bgfx: S.bgfx ? Object.assign({}, S.bgfx) : null };
}
let saveT = 0;
function saveState() {
  if (S.deck) return saveDeck();
  clearTimeout(saveT);
  saveT = setTimeout(function () {
    pushUndo();
    const key = S.curKey || skey(S.track, S.tpl), val = snap();
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch (e) {   // الصورة المرفوعة كبيرة على ذاكرة المتصفح: نحفظ النصوص وحدها
      Object.keys(val.d).forEach(function (k) { const x = val.d[k]; if (x && x.src && x.src.slice(0, 4) === 'data') val.d[k] = undefined; });
      val.layers = val.layers.filter(function (L) { return !(L.t === 'img' && String(L.ref).slice(0, 4) === 'data'); });
      if (val.bgfx && String(val.bgfx.src || '').slice(0, 4) === 'data') val.bgfx = null;
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e2) {}
    }
  }, 450);
}
function changed() { if (S.deck) { saveDeck(); schedule(); return; } saveState(); schedule(); clearTimeout(tipT); tipT = setTimeout(function () { if (S.tab === 'assist' && $('#side')) buildEditor(true); }, 700); }
let tipT = 0;

/* التراجع عن التعديلات */
let UNDO = [], REDO = [], lastSnap = null;
function pushUndo() {
  const cur = snap(), js = JSON.stringify(cur);
  if (lastSnap && lastSnap.js !== js) { UNDO.push(lastSnap.s); if (UNDO.length > 60) UNDO.shift(); REDO = []; }
  lastSnap = { s: cur, js: js }; updUndo();
}
function restore(s) {
  S.d = s.d; S.size = s.size; S.variant = s.variant; S.k = s.k; S.hide = s.hide; S.ov = s.ov; S.pos = s.pos || {}; S.gs = s.gs || {}; S.layers = s.layers || []; S.bgfx = s.bgfx || null; S.sel = null;
  lastSnap = { s: snap(), js: JSON.stringify(snap()) };
  try { localStorage.setItem(S.curKey || skey(S.track, S.tpl), JSON.stringify(snap())); } catch (e) {}
  buildEditor(); schedule();
}
function undo() { clearTimeout(saveT); pushUndo(); if (!UNDO.length) return; REDO.push(snap()); restore(UNDO.pop()); updUndo(); }
function redo() { if (!REDO.length) return; UNDO.push(snap()); restore(REDO.pop()); updUndo(); }
function updUndo() { const u = $('#bUndo'), r = $('#bRedo'); if (u) u.disabled = !UNDO.length; if (r) r.disabled = !REDO.length; }
document.addEventListener('keydown', function (e) {
  if (!S.tpl || !$('.editor') || S.deck) return;
  if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'z' || e.key === 'Z' || e.key === 'ز')) {
    if (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName) && document.activeElement.type !== 'range') return;
    e.preventDefault(); if (e.shiftKey) redo(); else undo();
  }
});

function photoOf(v) {
  if (!v || !v.src) return null;
  if (v.src.slice(0, 4) === 'lib:') { const im = IMG[v.src.slice(4)]; return im ? { im: im, z: v.z, ox: v.ox, oy: v.oy, lib: true } : null; }
  const im = UP[v.src];
  if (!im) { if (UP[v.src] === undefined) { const i = new Image(); UP[v.src] = null; i.onload = function () { UP[v.src] = i; schedule(); }; i.src = v.src; } return null; }
  return { im: im, z: v.z, ox: v.ox, oy: v.oy, lib: false };
}

/* الرسم: st = {d, variant, k, hide, ov} */
function renderTo(canvas, tpl, sizeKey, st, T, scale, collect) {
  const sz = SIZES[sizeKey];
  canvas.width = Math.round(sz.w * scale); canvas.height = Math.round(sz.h * scale);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingQuality = 'high';
  const hide = st.hide || {}, ov = st.ov || {};
  const d = {};
  Object.keys(st.d).forEach(function (k) { d[k] = hide['f_' + k] ? (typeof st.d[k] === 'boolean' ? false : (st.d[k] && typeof st.d[k] === 'object' ? null : '')) : st.d[k]; });
  HIDE = { logo: !!hide.logo, academy: !!hide.academy, social: !!hide.social, deco: !!hide.deco };
  OV = { bg: ov.bg || '', title: ov.title || '' };
  const T2 = ov.accent ? Object.assign({}, T, { c: Object.assign({}, T.c, { a: ov.accent, a2: ov.accent }) }) : T;
  CUR_T = T2;
  OFF = (st.pos && st.pos[sizeKey]) || {};
  GHIDE = {}; Object.keys(hide).forEach(function (k) { if (k.slice(0, 2) === 'g_' && hide[k]) GHIDE[k.slice(2)] = 1; });
  BGFX = st.bgfx ? { p: st.bgfx.p, im: st.bgfx.src ? (photoOf({ src: st.bgfx.src, z: 1 }) || {}).im : null } : null;
  const P = {};
  tpl.fields.forEach(function (f) { if (f.kind === 'image') P[f.k] = photoOf(d[f.k]); });
  // تنسيق كل عنصر وحده. والعنصر المكبَّر يُكبَّر حول مركزه، فنقيس المراكز أولاً برسم سريع بلا تكبير
  const gs = st.gs || {}; PIV = {};
  if (Object.keys(gs).some(function (g) { return gs[g] && gs[g].s && gs[g].s !== 1; })) {
    GST = {}; Object.keys(gs).forEach(function (g) { GST[g] = Object.assign({}, gs[g], { s: 1 }); });
    const mc = document.createElement('canvas'); mc.width = 8; mc.height = 8; const mx = mc.getContext('2d'); mx.scale(8 / sz.w, 8 / sz.h);
    GBOX = {};
    try { tpl.draw(mx, sz.w, sz.h, d, T2, st.variant, st.k || 1, P); } catch (e) {}
    G(mx, null);
    Object.keys(GBOX).forEach(function (g) { const b = GBOX[g], o = OFF[g] || {}; PIV[g] = { x: (b.x0 + b.x1) / 2 - (o.dx || 0), y: (b.y0 + b.y1) / 2 - (o.dy || 0) }; });
    GBOX = null;
  }
  GST = gs;
  if (collect) { GBOX = {}; GTXT = {}; }
  try { tpl.draw(ctx, sz.w, sz.h, d, T2, st.variant, st.k || 1, P); G(ctx, null); drawLayers(ctx, sz.w, sz.h, st.layers, T2); }
  catch (e) { console.error(e); G(ctx, null); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#b00'; ctx.font = '20px sans-serif'; ctx.fillText('خطأ في القالب: ' + e.message, 10, 30); }
  const gb = GBOX;
  if (collect) LASTT = GTXT || {};
  HIDE = {}; OV = {}; OFF = {}; GHIDE = {}; GST = {}; PIV = {}; GTXT = null; BGFX = null; GBOX = null; CUR_G = null; CUR_O = null; CUR_S = null;
  return gb;
}

/* ---------- الصفحة الثالثة: التحرير ---------- */
let pv = null, raf = 0, LASTT = {};
function schedule() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; if (pv && S.tpl) { LASTG = renderTo(pv, S.tpl, S.size, snap(), S.track, 1, true) || {}; drawOverlay(); } }); }
// لوحة رسم جديدة عند تغيير المقاس، فلا تبقى بقايا رسم قديم في بعض المتصفحات
function newPv() {
  const old = pv;
  pv = el('canvas', { class: 'pv', 'aria-label': 'معاينة التصميم' });
  bindStage(pv);
  if (old && old.parentNode) old.parentNode.replaceChild(pv, old);
  return pv;
}

function showEditor(tpl) {
  const T = S.track;
  S.curKey = S.mine ? S.mineKey : skey(T, tpl);
  if (S.tpl !== tpl || S.curKeyOld !== S.curKey) { UNDO = []; REDO = []; lastSnap = null; S.tab = tpl.id === 'blank' ? 'assist' : 'content'; }
  S.curKeyOld = S.curKey;
  S.tpl = tpl; S.type = tpl.type; S.sel = null;
  const st = loadState(T, tpl, S.curKey);
  if (S.prefSize && tpl.sizes.indexOf(S.prefSize) >= 0 && !store(S.curKey)) st.size = S.prefSize;
  S.d = st.d; S.size = st.size; S.variant = st.variant; S.k = st.k; S.hide = st.hide; S.ov = st.ov; S.pos = st.pos; S.gs = st.gs || {}; S.layers = st.layers; S.bgfx = st.bgfx;
  lastSnap = { s: snap(), js: JSON.stringify(snap()) };
  document.title = tpl.name + ' — ' + T.name;
  const ty = TYPES.find(function (t) { return t.id === tpl.type; }) || { id: 'all', name: S.mine ? 'قوالبي' : 'المصمم المساعد' };
  const up = S.mine ? '#/' + T.id + '/mine' : (tpl.id === 'blank' ? '#/' + T.id : '#/' + T.id + '/k/' + ty.id);
  pv = null; newPv();
  OVL = el('canvas', { class: 'ovl', 'aria-hidden': 'true' });
  main(
    navbar([{ t: 'الرئيسية', href: '#/' }, { t: T.full.replace('ـ', ''), href: '#/' + T.id }, { t: ty.name, href: up }, { t: S.mine ? S.mineName : tpl.name }], up),
    el('div', { class: 'editor' }, [
      el('aside', { class: 'side', id: 'side' }),
      el('section', { class: 'view' }, [
        el('div', { class: 'stage' }, [pv, OVL]),
        el('div', { class: 'selbar', id: 'selbar', hidden: true }),
        el('div', { class: 'opts', id: 'opts' }),
        el('div', { class: 'actions' }, [
          el('button', { type: 'button', class: 'btn main', onclick: function () { exportImg('png'); } }, [dlIcon(), el('span', { class: 'lg', text: 'تحميل بجودة عالية' }), el('span', { class: 'sm', text: 'تحميل' })]),
          el('button', { type: 'button', class: 'btn', onclick: function () { exportImg('jpg'); } }, [el('span', { class: 'lg', text: 'بحجم أخف' }), el('span', { class: 'sm', text: 'أخف' })]),
          el('button', { type: 'button', class: 'btn', onclick: function () { saveAsTemplate(ownMine()); } }, [el('span', { class: 'lg', text: ownMine() ? 'تحديث قالبي' : 'حفظ كقالب' }), el('span', { class: 'sm', text: 'حفظ' })]),
          el('button', { type: 'button', class: 'btn', title: 'إرجاع القالب كله إلى أصله: النصوص والألوان والمواضع والعناصر', onclick: function () { if (!confirmInline(this)) return; resetAll(); } }, [el('span', { class: 'lg', text: 'إرجاع الأصل' }), el('span', { class: 'sm', text: 'أصل' })]),
          el('span', { class: 'sp' }),
          el('button', { type: 'button', class: 'btn icon', id: 'bUndo', title: 'تراجع (Ctrl+Z)', 'aria-label': 'تراجع', onclick: undo }, [arrowSvg(false)]),
          el('button', { type: 'button', class: 'btn icon', id: 'bRedo', title: 'إعادة (Ctrl+Shift+Z)', 'aria-label': 'إعادة', onclick: redo }, [arrowSvg(true)])
        ])
      ])
    ])
  );
  buildEditor(); updUndo(); schedule();
  window.scrollTo(0, 0);
  setTimeout(function () { startTour('editor'); }, 700);
}
window.addEventListener('resize', function () { drawOverlay(); });

function ownMine() { return !!S.mine && S.mine.slice(0, 5) !== 'team:'; }
/* نقل التصميم نفسه إلى هوية أخرى بنصوصه وإعداداته */
function idSwitch() {
  const T = S.track;
  const sel = el('select', { 'aria-label': 'هوية التصميم', onchange: function (e) {
    const to = TRACKS[e.target.value]; if (!to) return;
    const st = snap(), old = T.full.replace('ـ', ''), neu = to.full.replace('ـ', '');
    Object.keys(st.d).forEach(function (k) { if (typeof st.d[k] === 'string') st.d[k] = st.d[k].split(old).join(neu).split(T.full).join(to.full); });
    st.ov = {};
    try { localStorage.setItem(S.mine ? 'jz1.' + to.id + '.m.' + S.mine.replace('team:', '') : skey(to, S.tpl), JSON.stringify(st)); } catch (er) {}
    location.hash = '#/' + to.id + (S.mine ? '/m/' + S.mine.replace('team:', '') : '/e/' + S.tpl.id);
  } }, GROUPS.map(function (g) {
    return el('optgroup', { label: g[1] }, Object.keys(TRACKS).filter(function (id) { return TRACKS[id].group === g[0]; }).map(function (id) { return el('option', { value: id, text: TRACKS[id].full.replace('ـ', ''), selected: id === T.id }); }));
  }));
  return el('div', { class: 'opt idsw', 'data-tour': 'idsw' }, [el('label', { text: 'الهوية' }), sel]);
}
function seg(items, cur, on, cls) {
  return el('div', { class: 'seg' + (cls ? ' ' + cls : '') }, items.map(function (it) {
    return el('button', { type: 'button', class: it[0] === cur ? 'on' : '', 'aria-pressed': it[0] === cur ? 'true' : 'false', onclick: function (e) {
      const b = e.currentTarget;
      Array.from(b.parentNode.children).forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); on(it[0]);
    } }, [it[1]]);
  }));
}

// يبني لوحة التحرير من الحالة الحالية (يُستدعى أيضاً بعد التراجع)
function buildEditor(keepScroll) {
  if (S.deck) return buildDeckSide(keepScroll);
  const tpl = S.tpl, side = $('#side'), opts = $('#opts');
  if (!side) return;
  const sy = side.querySelector('.tabbody') ? window.scrollY : 0;
  opts.innerHTML = '';
  opts.appendChild(idSwitch());
  if (tpl.sizes.length > 1) opts.appendChild(el('div', { class: 'opt' }, [el('label', { text: 'المقاس' }),
    seg(tpl.sizes.map(function (s) { return [s, SIZES[s].name]; }), S.size, function (v) { S.size = v; S.sel = null; newPv(); changed(); buildSelBar(); })]));
  opts.appendChild(el('div', { class: 'opt' }, [el('label', { text: 'حجم العنوان' }), el('div', { class: 'range' }, [
    el('span', { text: 'أصغر' }),
    el('input', { type: 'range', min: '0.7', max: '1.3', step: '0.01', value: String(S.k), 'aria-label': 'حجم العنوان', oninput: function (e) { S.k = +e.target.value; changed(); } }),
    el('span', { text: 'أكبر' })
  ])]));

  const tabs = (tpl.id === 'blank' ? [['assist', 'المساعد']] : [['content', 'المحتوى']]).concat([['lib', 'المكتبة'], ['colors', 'الألوان'], ['fonts', 'الخط'], ['els', 'العناصر']]);
  const body = el('div', { class: 'tabbody' });
  const bar = el('div', { class: 'tabs', role: 'tablist' }, tabs.map(function (t) {
    return el('button', { type: 'button', role: 'tab', class: S.tab === t[0] ? 'on' : '', 'aria-selected': S.tab === t[0] ? 'true' : 'false', onclick: function () { S.tab = t[0]; buildEditor(); } }, [t[1]]);
  }));
  side.innerHTML = ''; side.appendChild(bar); side.appendChild(body);
  if (S.tab === 'content') buildContent(body);
  else if (S.tab === 'assist') buildAssistant(body);
  else if (S.tab === 'lib') buildLibrary(body);
  else if (S.tab === 'colors') buildColors(body);
  else if (S.tab === 'fonts') buildFonts(body);
  else buildEls(body);
  buildSelBar();
  if (keepScroll) window.scrollTo(0, sy);
}

/* ---------- لوحة المحتوى ---------- */
function buildContent(body) {
  const tpl = S.tpl;
  const form = el('form', { class: 'fields', onsubmit: function (e) { e.preventDefault(); } });
  let row = null;
  tpl.fields.forEach(function (f) {
    let node;
    if (f.kind === 'date') node = dateField(f);
    else if (f.kind === 'image') node = imageField(f);
    else if (f.kind === 'toggle') node = el('label', { class: 'fld tog' }, [
      el('input', { type: 'checkbox', checked: !!S.d[f.k], onchange: function (e) { S.d[f.k] = e.target.checked; changed(); } }),
      el('i'), el('span', { text: f.label })]);
    else if (f.kind === 'choice') node = el('div', { class: 'fld' }, [el('label', { text: f.label }), seg(f.options, S.d[f.k], function (v) { S.d[f.k] = v; changed(); })]);
    else node = textField(f);
    if (f.half) {
      if (!row) { row = el('div', { class: 'row2' }); form.appendChild(row); }
      row.appendChild(node); if (row.children.length === 2) row = null;
    } else { row = null; form.appendChild(node); }
  });
  form.appendChild(el('p', { class: 'tip', html: 'ما تكتبه بين <b>*نجمتين*</b> يظهر بلون مميز حيث يدعمه القالب. والنص الطويل يصغر وحده ليبقى في مكانه. ولإخفاء أي سطر اضغط العين بجانبه.' }));
  if (!S.deck) form.appendChild(el('div', { class: 'reset' }, [el('button', { type: 'button', class: 'link', text: 'إرجاع القالب كله إلى أصله', onclick: function () {
    if (!confirmInline(this)) return;
    pushUndo();
    try { localStorage.removeItem(S.curKey); } catch (e) {}
    const st = loadState(S.track, tpl, S.curKey);
    UNDO.push(snap()); REDO = [];
    S.d = st.d; S.size = st.size; S.variant = st.variant; S.k = st.k; S.hide = {}; S.ov = {}; S.pos = {}; S.gs = {}; S.layers = []; S.bgfx = null; S.sel = null;
    lastSnap = { s: snap(), js: JSON.stringify(snap()) };
    buildEditor(); schedule(); updUndo();
  } })]));
  body.appendChild(form);
}

function eye(key) {
  const on = !S.hide['f_' + key];
  return el('button', { type: 'button', class: 'eye' + (on ? '' : ' off'), title: on ? 'إخفاء من التصميم' : 'إظهار في التصميم', 'aria-label': on ? 'إخفاء' : 'إظهار', onclick: function (e) {
    const b = e.currentTarget, hid = !S.hide['f_' + key];
    if (hid) S.hide['f_' + key] = true; else delete S.hide['f_' + key];
    b.classList.toggle('off', hid); b.title = hid ? 'إظهار في التصميم' : 'إخفاء من التصميم';
    const fld = b.closest('.fld'); if (fld) fld.classList.toggle('hid', hid);
    changed();
  } }, [eyeSvg()]);
}
function eyeSvg() {
  const s = document.createElementNS('http:\/\/www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path class="slash" d="M4 4l16 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
  return s;
}

function textField(f) {
  const id = 'f_' + f.k;
  const input = f.kind === 'area'
    ? el('textarea', { id: id, rows: String(Math.min(4, Math.max(2, (String(f.def).match(/\n/g) || []).length + 1))) })
    : el('input', { id: id, type: 'text', autocomplete: 'off' });
  input.value = S.d[f.k] == null ? '' : S.d[f.k];
  const cnt = f.max ? el('span', { class: 'cnt' }) : null;
  function upd() {
    if (cnt) { const n = input.value.replace(/\*/g, '').length; cnt.textContent = n + ' / ' + f.max; cnt.classList.toggle('over', n > f.max); }
  }
  input.addEventListener('input', function () { S.d[f.k] = input.value; upd(); changed(); });
  upd();
  return el('div', { class: 'fld' + (S.hide['f_' + f.k] ? ' hid' : '') }, [
    el('div', { class: 'lab' }, [el('label', { for: id, text: f.label }), el('span', { class: 'labr' }, [cnt, eye(f.k)])]),
    input, f.hint ? el('small', { text: f.hint }) : null
  ]);
}

/* التاريخ: يختار يوماً فيملأ الخانات المرتبطة به */
const HM_FIX = { 'ربيع الآخر': 'ربيع الثاني', 'جمادى الآخرة': 'جمادى الثانية' };
function dateTokens(dt, adj) {
  const h = new Date(dt.getTime() + (adj || 0) * 864e5);
  const hp = {}, gp = {};
  new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).formatToParts(h).forEach(function (p) { hp[p.type] = p.value; });
  new Intl.DateTimeFormat('ar-EG-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).formatToParts(dt).forEach(function (p) { gp[p.type] = p.value; });
  return {
    wd: gp.weekday, hd: hp.day, hm: HM_FIX[hp.month] || hp.month, hy: hp.year,
    gd: gp.day, gd2: ('0' + gp.day).slice(-2), gm: gp.month, gy: gp.year, gn: String(dt.getMonth() + 1)
  };
}
function dateField(f) {
  const inp = el('input', { type: 'date', 'aria-label': 'اختر التاريخ' });
  const adj = el('select', { 'aria-label': 'تعديل اليوم الهجري' }, [['-1', 'الهجري −1'], ['0', 'الهجري كما هو'], ['1', 'الهجري +1']].map(function (o) {
    return el('option', { value: o[0], text: o[1], selected: String(S.hijriAdj) === o[0] });
  }));
  function fill() {
    if (!inp.value) return;
    const p = inp.value.split('-').map(Number), dt = new Date(p[0], p[1] - 1, p[2], 12);
    const tk = dateTokens(dt, +adj.value);
    Object.keys(f.map).forEach(function (k) {
      const val = f.map[k].replace(/\{(\w+)\}/g, function (_, t) { return tk[t] || ''; });
      S.d[k] = val; const i = document.getElementById('f_' + k); if (i) { i.value = val; i.dispatchEvent(new Event('input')); }
    });
    changed();
  }
  inp.addEventListener('change', fill);
  adj.addEventListener('change', function () { S.hijriAdj = +adj.value; fill(); });
  return el('div', { class: 'fld datebox' }, [
    el('label', { text: 'املأ التاريخ تلقائياً' }),
    el('div', { class: 'daterow' }, [inp, adj]),
    el('small', { text: 'اختر اليوم فتُملأ خانات التاريخ بالهجري والميلادي. وإن خالف الهجري تقويمكم فعدّله بيوم.' })
  ]);
}

function imageField(f) {
  const wrapper = el('div', { class: 'fld imgf' + (S.hide['f_' + f.k] ? ' hid' : '') }, [el('div', { class: 'lab' }, [el('label', { text: f.label }), eye(f.k)])]);
  const lib = el('div', { class: 'lib' });
  function mark() {
    Array.from(lib.children).forEach(function (b) { b.classList.toggle('on', b.dataset.src === ((S.d[f.k] && S.d[f.k].src) || '')); });
    ctr.style.display = S.d[f.k] ? '' : 'none';
  }
  function setSrc(src) {
    S.d[f.k] = src ? { src: src, z: 1, ox: 0, oy: 0 } : null;
    zoom.value = '1'; mark(); changed();
  }
  if (f.optional) lib.appendChild(el('button', { type: 'button', class: 'none', 'data-src': '', text: 'بلا', onclick: function () { setSrc(''); } }));
  (f.optional ? [] : DATE_LIB).forEach(function (n) {
    const b = el('button', { type: 'button', 'data-src': 'lib:' + n, title: LIB_NAMES[n], 'aria-label': LIB_NAMES[n], onclick: function () { setSrc('lib:' + n); } });
    b.style.backgroundImage = 'url(' + ASSETS[n] + ')';
    lib.appendChild(b);
  });
  const file = el('input', { type: 'file', accept: '.jpg,.jpeg,.png,.webp', hidden: true, onchange: function (e) {
    const fl = e.target.files[0]; if (!fl) return;
    readImage(fl, function (src) {
      const b = lib.querySelector('.up'); if (b) { b.dataset.src = src; b.style.backgroundImage = 'url(' + src + ')'; b.textContent = ''; }
      setSrc(src);
    });
    e.target.value = '';
  } });
  const cur = S.d[f.k] && S.d[f.k].src, isUp = cur && cur.slice(0, 4) === 'data';
  const upb = el('button', { type: 'button', class: 'up', 'data-src': isUp ? cur : '-', onclick: function () { file.click(); } }, [isUp ? '' : 'رفع صورة']);
  if (isUp) upb.style.backgroundImage = 'url(' + cur + ')';
  lib.appendChild(upb);
  const zoom = el('input', { type: 'range', min: '0.6', max: '2.5', step: '0.01', 'aria-label': 'تكبير الصورة', value: String((S.d[f.k] && S.d[f.k].z) || 1), oninput: function (e) { if (S.d[f.k]) { S.d[f.k].z = +e.target.value; changed(); } } });
  const ctr = el('div', { class: 'imgctl' }, [
    el('div', { class: 'range' }, [el('span', { text: 'تصغير' }), zoom, el('span', { text: 'تكبير' })]),
    el('small', {}, ['اسحب الصورة في المعاينة لتحريكها. ', el('button', { type: 'button', class: 'link', text: 'إرجاعها لمكانها', onclick: function () { if (S.d[f.k]) { S.d[f.k].ox = 0; S.d[f.k].oy = 0; S.d[f.k].z = 1; zoom.value = '1'; changed(); } } })])
  ]);
  wrapper.appendChild(lib); wrapper.appendChild(file); wrapper.appendChild(ctr);
  mark();
  return wrapper;
}
function readImage(fl, cb) {
  const r = new FileReader();
  r.onload = function () {
    const i = new Image();
    i.onload = function () {
      const mx = 2400, sc = Math.min(1, mx / Math.max(i.width, i.height));
      const c = document.createElement('canvas'); c.width = Math.round(i.width * sc); c.height = Math.round(i.height * sc);
      c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
      const png = /png|webp/.test(fl.type);
      const src = c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.92);
      const j = new Image(); j.onload = function () { UP[src] = j; cb(src); }; j.src = src;
    };
    i.src = r.result;
  };
  r.readAsDataURL(fl);
}

/* ---------- لوحة الألوان ---------- */
function buildColors(body) {
  const tpl = S.tpl, T = S.track;
  themesBlock(body, function (o) { S.ov = o; changed(); buildEditor(true); });
  body.appendChild(el('h3', { class: 'sh', text: 'ألوان مقترحة' }));
  body.appendChild(el('p', { class: 'note', text: 'مجموعات جاهزة من ألوان الهوية، تحفظها كما صمّمها المصمم.' }));
  const pal = el('div', { class: 'pals' }, tpl.variants.map(function (v) {
    const on = v.id === S.variant && !Object.keys(S.ov).some(function (k) { return S.ov[k]; });
    return el('button', { type: 'button', class: 'pal' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', onclick: function () { S.variant = v.id; S.ov = {}; changed(); buildEditor(); } }, [
      el('span', { class: 'dots' }, swOf(v.sw, T).map(function (c) { return el('i', { style: 'background:' + c }); })), v.name
    ]);
  }));
  body.appendChild(pal);
  body.appendChild(el('h3', { class: 'sh', text: 'ألوان أخرى من الهوية' }));
  body.appendChild(el('p', { class: 'note', text: 'تراكيب مولّدة من ألوان الهوية، مختارة بحيث يبقى النص واضحاً. اضغط أياً منها لتجربته.' }));
  const gen = el('div', { class: 'gens' });
  const cur = snap();
  genPalettes(tpl, T).forEach(function (pl, i) {
    const on = S.ov.bg === pl.bg && S.ov.title === pl.title && S.ov.accent === pl.accent;
    const sz = SIZES[S.size], sc = 92 / sz.w;
    const cv = el('canvas', { width: Math.round(sz.w * sc), height: Math.round(sz.h * sc) });
    gen.appendChild(el('button', { type: 'button', class: 'gen' + (on ? ' on' : ''), title: 'تجربة هذه الألوان', onclick: function () { S.ov = { bg: pl.bg, title: pl.title, accent: pl.accent }; changed(); buildEditor(true); } }, [cv]));
    setTimeout(function () { const st = Object.assign({}, cur, { ov: pl }); renderTo(cv, tpl, S.size, st, T, sc); }, 15 * i);
  });
  body.appendChild(gen);
  body.appendChild(el('h3', { class: 'sh', text: 'ألوان مخصصة' }));
  body.appendChild(el('p', { class: 'note', text: 'غيّر لوناً واحداً فوق المجموعة المختارة. والنص يتحوّل للأبيض أو الأسود وحده ليبقى مقروءاً.' }));
  const labels = Object.assign({ bg: 'الخلفية', title: 'العنوان', accent: 'لون التمييز' }, tpl.colorLabels || {});
  ['bg', 'title', 'accent'].forEach(function (key) {
    const cur = S.ov[key] || '';
    const row = el('div', { class: 'crow' }, [
      el('div', { class: 'clab' }, [el('b', { text: labels[key] }), el('button', { type: 'button', class: 'auto' + (cur ? '' : ' on'), text: 'تلقائي', onclick: function () { delete S.ov[key]; changed(); buildEditor(); } })]),
      el('div', { class: 'sws' }, T.swatches.map(function (c) {
        return el('button', { type: 'button', class: 'swt' + (cur.toLowerCase() === c ? ' on' : ''), style: 'background:' + c, title: c, 'aria-label': c, onclick: function () { S.ov[key] = c; changed(); buildEditor(); } });
      }).concat([el('label', { class: 'swt more', title: 'لون آخر' }, ['+', el('input', { type: 'color', value: cur || '#467839', 'aria-label': 'اختر أي لون', oninput: function (e) { S.ov[key] = e.target.value; changed(); }, onchange: function () { buildEditor(); } })])]))
    ]);
    body.appendChild(row);
  });
  if (Object.keys(S.ov).length) body.appendChild(el('div', { class: 'reset' }, [el('button', { type: 'button', class: 'link', text: 'إلغاء الألوان المخصصة', onclick: function () { S.ov = {}; changed(); buildEditor(); } })]));
}

/* ---------- لوحة الخط ---------- */
function buildFonts(body) {
  function fontPick(role, label, sample) {
    body.appendChild(el('h3', { class: 'sh', text: label }));
    body.appendChild(el('div', { class: 'fonts' }, Object.keys(FONTS).map(function (id) {
      const on = FS[role] === id, f = FONTS[id];
      return el('button', { type: 'button', class: 'fnt' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', onclick: function () { FS[role] = id; if (role === 'title' && FONTS[id].fake) FS.tw = ''; saveFonts(); TINT_CLEAR(); schedule(); buildEditor(); } }, [
        el('span', { class: 'smp', style: 'font-family:"' + f.w[role === 'title' ? 'b' : 'r'] + '"', text: sample }), el('small', { text: f.name })
      ]);
    })));
  }
  fontPick('title', 'خط العناوين', 'اللقاء الافتتاحي');
  fontPick('body', 'خط النصوص', 'الخميس 8:20 مساءً');
  body.appendChild(el('h3', { class: 'sh', text: 'سماكة العنوان' }));
  const f = FONTS[FS.title];
  const ws = [['', 'كما في القالب']].concat(WEIGHTS.filter(function (w) { return !f.fake || w[0] !== 'l'; }));
  body.appendChild(seg(ws, FS.tw, function (v) { FS.tw = v; saveFonts(); schedule(); }, 'wrap'));
  body.appendChild(el('p', { class: 'note', text: 'الخط والسماكة تفضيل عام: يُطبَّق على كل القوالب في هذا المتصفح.' }));
}
function TINT_CLEAR() { Object.keys(TINT).forEach(function (k) { delete TINT[k]; }); }

/* ---------- لوحة الإظهار والإخفاء ---------- */
function buildEls(body) {
  const tpl = S.tpl;
  function tog(key, label) {
    const on = !S.hide[key];
    return el('label', { class: 'fld tog' }, [
      el('input', { type: 'checkbox', checked: on, onchange: function (e) { if (e.target.checked) delete S.hide[key]; else S.hide[key] = true; changed(); } }),
      el('i'), el('span', { text: label })]);
  }
  if (S.track.logos) { body.appendChild(el('h3', { class: 'sh', text: 'نسخة الشعار' })); body.appendChild(logoPicker(S.track, function () { schedule(); })); }
  body.appendChild(el('h3', { class: 'sh', text: 'عناصر الهوية والزخرفة' }));
  const box1 = el('div', { class: 'togs' }); ELEMENTS.forEach(function (e) { box1.appendChild(tog(e[0], e[1])); }); body.appendChild(box1);
  body.appendChild(el('h3', { class: 'sh', text: 'النصوص والصور' }));
  const box2 = el('div', { class: 'togs' });
  tpl.fields.forEach(function (f) { if (f.k && f.kind !== 'toggle' && f.kind !== 'choice') box2.appendChild(tog('f_' + f.k, f.label)); });
  body.appendChild(box2);
  body.appendChild(el('p', { class: 'note', text: 'ما تخفيه يختفي من التصميم وتبقى كتابته محفوظة، فتعيده متى شئت.' }));
  const hg = Object.keys(S.hide).filter(function (k) { return k.slice(0, 2) === 'g_' && S.hide[k]; });
  if (hg.length) {
    body.appendChild(el('h3', { class: 'sh', text: 'عناصر أخفيتها أو استبدلتها' }));
    body.appendChild(el('div', { class: 'sbrow' }, hg.map(function (k) { return el('button', { type: 'button', class: 'mini', text: 'إظهار ' + gName(k.slice(2)), onclick: function () { delete S.hide[k]; changed(); buildEditor(true); } }); })));
  }
  body.appendChild(el('h3', { class: 'sh', text: 'المواضع' }));
  body.appendChild(el('p', { class: 'note', text: 'اضغط أي عنصر في المعاينة لتحريكه، فتظهر تحت المعاينة مواضع مقترحة له. المواضع تُحفظ لكل مقاس على حدة.' }));
  body.appendChild(el('button', { type: 'button', class: 'mini', text: 'إرجاع كل العناصر إلى مواضعها في هذا المقاس', onclick: function () { if (S.pos) delete S.pos[S.size]; S.sel = null; changed(); buildEditor(true); } }));
}

function confirmInline(btn) {
  if (btn.dataset.sure) return true;
  btn.dataset.sure = '1'; const old = btn.textContent; btn.textContent = 'متأكد؟ اضغط مرة أخرى';
  setTimeout(function () { delete btn.dataset.sure; btn.textContent = old; }, 3000);
  return false;
}
function arrowSvg(flip) {
  const s = document.createElementNS('http:\/\/www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
  if (flip) s.style.transform = 'scaleX(-1)';
  s.innerHTML = '<path d="M15 7H9.5a5 5 0 0 0 0 10H17M15 7l-3-3m3 3-3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  return s;
}
function dlIcon() {
  const s = document.createElementNS('http:\/\/www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = '<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';
  return s;
}

/* سحب الصورة داخل المعاينة */
function bindDrag(cv) {
  let st = null;
  cv.addEventListener('pointerdown', function (e) {
    const f = S.tpl.fields.find(function (x) { return x.kind === 'image' && S.d[x.k] && !S.hide['f_' + x.k]; });
    if (!f) return;
    st = { k: f.k, x: e.clientX, y: e.clientY, ox: S.d[f.k].ox || 0, oy: S.d[f.k].oy || 0 };
    cv.setPointerCapture(e.pointerId); cv.classList.add('drag');
  });
  cv.addEventListener('pointermove', function (e) {
    if (!st) return;
    const r = cv.getBoundingClientRect(), v = S.d[st.k];
    v.ox = Math.max(-2, Math.min(2, st.ox + (e.clientX - st.x) / r.width * 2));
    v.oy = Math.max(-2, Math.min(2, st.oy + (e.clientY - st.y) / r.height * 2));
    schedule();
  });
  function end() { if (st) { st = null; cv.classList.remove('drag'); saveState(); } }
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
}

/* ---------- التحميل ---------- */
function exportImg(fmt) {
  const sz = SIZES[S.size], sc = 2;
  const c = document.createElement('canvas');
  renderTo(c, S.tpl, S.size, snap(), S.track, sc);
  const name = S.track.name + ' - ' + (String(S.d.title || S.tpl.name).replace(/[\n*]/g, ' ').replace(/[\\\/:?"<>|]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40) || S.tpl.name) + (fmt === 'png' ? '.png' : '.jpg');
  if (fmt === 'jpg') { const g = c.getContext('2d'); g.globalCompositeOperation = 'destination-over'; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); }
  c.toBlob(function (blob) {
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: name }); document.body.appendChild(a); a.click(); a.remove();
    showSaved(url, sz, sc, blob.size, blob, name);
  }, fmt === 'png' ? 'image/png' : 'image/jpeg', 0.93);
}
// المشاركة المباشرة من الجوال (واتساب، تليجرام…) إن كان المتصفح يدعمها
function shareBtn(blob, name) {
  if (!blob || !navigator.canShare) return null;
  let file; try { file = new File([blob], name, { type: blob.type }); } catch (e) { return null; }
  if (!navigator.canShare({ files: [file] })) return null;
  return el('button', { type: 'button', class: 'btn main', text: 'مشاركة', onclick: function () { navigator.share({ files: [file], title: name }).catch(function () {}); } });
}
function showSaved(url, sz, sc, bytes, blob, name) {
  const old = $('.saved'); if (old) old.remove();
  const dlg = el('div', { class: 'saved', role: 'dialog', 'aria-label': 'تم التحميل' }, [
    el('div', { class: 'sv' }, [
      el('b', { text: 'بدأ التحميل' }),
      el('p', { text: 'المقاس ' + sz.w * sc + ' × ' + sz.h * sc + '، والحجم ' + (bytes / 1048576).toFixed(1) + ' ميغابايت. على الجوال: إن لم يظهر الملف، اضغط على الصورة مطولاً واختر حفظ.' }),
      el('img', { src: url, alt: 'التصميم' }),
      el('div', { class: 'sbrow' }, [shareBtn(blob, name), el('button', { type: 'button', class: 'btn', text: 'إغلاق', onclick: function () { dlg.remove(); } })])
    ])
  ]);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.remove(); });
  document.body.appendChild(dlg);
}

// يعيد القالب كله إلى أصله، ويبقى قابلاً للتراجع
function resetAll() {
  clearTimeout(saveT); pushUndo();
  UNDO.push(snap()); REDO = [];
  try { localStorage.removeItem(S.curKey); } catch (e) {}
  S.d = defaults(S.tpl, S.track); S.size = S.tpl.sizes[0]; S.variant = S.tpl.variants[0].id; S.k = 1;
  S.hide = {}; S.ov = {}; S.pos = {}; S.gs = {}; S.layers = []; S.bgfx = null; S.sel = null;
  lastSnap = { s: snap(), js: JSON.stringify(snap()) };
  newPv(); buildEditor(); schedule(); updUndo(); saveState();
}
