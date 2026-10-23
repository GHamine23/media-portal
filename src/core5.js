/* ================= النواة المشتركة بين الإصدارين: الحالة والرسم والبيانات (بلا واجهة) ================= */
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

function norm(s) { return String(s || '').replace(/[ًٌٍَُِّْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase(); }

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
    pos: JSON.parse(JSON.stringify(S.pos || {})), gs: JSON.parse(JSON.stringify(S.gs || {})), layers: (S.layers || []).map(function (L) { return Object.assign({}, L); }), bgfx: S.bgfx ? Object.assign({}, S.bgfx) : null,
    names: Object.assign({}, S.names || {}), front: (S.front || []).slice() };
}

let LASTT = {};   // النصوص المرسومة في كل عنصر في آخر رسم للمعاينة
function photoOf(v) {
  if (!v || !v.src) return null;
  if (v.src.slice(0, 4) === 'lib:') { const im = IMG[v.src.slice(4)]; return im ? { im: im, z: v.z, ox: v.ox, oy: v.oy, lib: true } : null; }
  // الإصدار السادس: صورة مرفوعة محفوظة في مكتبة المستخدم على الخادم
  if (v.src.slice(0, 6) === 'asset:' && typeof assetImage === 'function') { const im = assetImage(v.src.slice(6)); return im ? { im: im, z: v.z, ox: v.ox, oy: v.oy, lib: false } : null; }
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
  // عناصر من القالب نُقلت إلى الأمام: تُخفى في الرسم الأول، ثم يُرسم كل منها وحده فوق الباقي بترتيبه
  const front = (st.front || []).filter(function (g) { return !GHIDE[g]; });
  front.forEach(function (g) { GHIDE[g] = 1; });
  try {
    tpl.draw(ctx, sz.w, sz.h, d, T2, st.variant, st.k || 1, P); G(ctx, null);
    if (front.length) {
      const keepT = GTXT ? Object.assign({}, GTXT) : null;
      if (GBOX) front.forEach(function (g) { delete GBOX[g]; });
      front.forEach(function (g) {
        delete GHIDE[g]; SOLO = {}; SOLO[g] = 1; if (GTXT) GTXT = {};
        G(ctx, null);
        try { tpl.draw(ctx, sz.w, sz.h, d, T2, st.variant, st.k || 1, P); } finally { G(ctx, null); SOLO = null; if (SOLO_OUT) { ctx.restore(); SOLO_OUT = false; } }
        if (keepT) { keepT[g] = GTXT[g] || keepT[g]; GTXT = keepT; }
      });
    }
    drawLayers(ctx, sz.w, sz.h, st.layers, T2);
  }
  catch (e) { console.error(e); SOLO = null; G(ctx, null); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#b00'; ctx.font = '20px sans-serif'; ctx.fillText('خطأ في القالب: ' + e.message, 10, 30); }
  const gb = GBOX;
  if (collect) LASTT = GTXT || {};
  HIDE = {}; OV = {}; OFF = {}; GHIDE = {}; GST = {}; PIV = {}; GTXT = null; BGFX = null; GBOX = null; CUR_G = null; CUR_O = null; CUR_S = null;
  return gb;
}

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

function TINT_CLEAR() { Object.keys(TINT).forEach(function (k) { delete TINT[k]; }); }
