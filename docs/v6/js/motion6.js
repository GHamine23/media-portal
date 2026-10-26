/* motion6.js — أفلام الحركة للمنصة: فيلم الإطلاق ومقاطع تعريف الأقسام.
   محرك زمني حتمي: كل إطار يُحسب من الزمن t وحده (يُوقف ويُقدَّم ويُرجَع ويُرسم إطاراً إطاراً للتصدير)،
   ومؤثرات صوتية تُولَّد بـ WebAudio (بلا موسيقى ولا ملفات صوت)، ومشغّل بملء الشاشة.
   الواجهة العامة: MOTION_CLIPS · playMotion(id, opts) · motionPoster(id, w) · renderMotionFrame(id, t, host) */
const MO = (function () {
  'use strict';
  /* ---------- أدوات الزمن والتليين ---------- */
  const cl = function (x, a, b) { a = a == null ? 0 : a; b = b == null ? 1 : b; return x < a ? a : x > b ? b : x; };
  const P = function (t, a, d) { return d <= 0 ? (t >= a ? 1 : 0) : cl((t - a) / d); };
  const lerp = function (a, b, p) { return a + (b - a) * p; };
  const E = {
    lin: function (p) { return p; },
    o2: function (p) { return 1 - (1 - p) * (1 - p); },
    o3: function (p) { return 1 - Math.pow(1 - p, 3); },
    o5: function (p) { return 1 - Math.pow(1 - p, 5); },
    ox: function (p) { return p >= 1 ? 1 : 1 - Math.pow(2, -10 * p); },
    i3: function (p) { return p * p * p; },
    i2: function (p) { return p * p; },
    io3: function (p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; },
    io5: function (p) { return p < 0.5 ? 16 * Math.pow(p, 5) : 1 - Math.pow(-2 * p + 2, 5) / 2; },
    back: function (p) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
    spr: function (p) { return p >= 1 ? 1 : 1 - Math.exp(-6.5 * p) * Math.cos(11 * p); },
    spr2: function (p) { return p >= 1 ? 1 : 1 - Math.exp(-8 * p) * Math.cos(16 * p); }
  };
  // ظهور ثم اختفاء: 0..1..0
  function io(t, a, b, din, dout, ein, eout) { const i = (ein || E.o5)(P(t, a, din || 0.6)); const o = b == null ? 0 : (eout || E.i3)(P(t, b, dout || 0.4)); return i * (1 - o); }
  function rng(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const AR = '٠١٢٣٤٥٦٧٨٩';
  function ar(n) { return String(n).replace(/[0-9]/g, function (d) { return AR[+d]; }); }
  function hex2(c) { c = c.replace('#', ''); if (c.length === 3) c = c.split('').map(function (x) { return x + x; }).join(''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
  function mix(a, b, p) { const x = hex2(a), y = hex2(b); return '#' + [0, 1, 2].map(function (i) { return Math.round(lerp(x[i], y[i], cl(p))).toString(16).padStart(2, '0'); }).join(''); }
  function rgba(c, a) { const x = hex2(c); return 'rgba(' + x[0] + ',' + x[1] + ',' + x[2] + ',' + a + ')'; }

  /* ---------- شدة الحركة: 1 كاملة، وأقل للحركة الهادئة ---------- */
  let K = 1;
  /* ---------- عناصر DOM ---------- */
  function h(tag, cls, parent, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; }
  // عنصر مطلق الموضع
  function A(parent, x, y, w, hh, cls, html) {
    const e = h('div', 'mo-a' + (cls ? ' ' + cls : ''), parent, html);
    e.style.left = x + 'px'; e.style.top = y + 'px'; if (w != null) e.style.width = w + 'px'; if (hh != null) e.style.height = hh + 'px'; return e;
  }
  function css(e, o) { for (const k in o) e.style[k] = o[k]; return e; }
  // تحويل حتمي: x y s r o b(ضبابية) — يُكتب فقط عند التغيّر
  // الجوال: لا ضبابية ولا منظور ثلاثي الأبعاد للعناصر — كلاهما يُنشئ طبقات رسومية ثقيلة تومض وتهتز في متصفحات الهواتف
  const LITE = typeof matchMedia === 'function' && (matchMedia('(pointer: coarse)').matches || matchMedia('(max-width: 760px)').matches);
  // تصغير المسرح: بالتكبير/التصغير الحقيقي (zoom) حيث يُدعم، فيُرسم بحجمه الفعلي لا كطبقة ضخمة مصغّرة
  const ZOOM = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('zoom', '0.5');
  // على الجوال تُقرَّب الإزاحات إلى بكسلات الشاشة الفعلية، فلا يتأرجح العنصر بين بكسلين أثناء الحركة
  let SNAP = 0;
  function scaleStage(st, s) { if (LITE) SNAP = 1 / Math.max(0.01, s * (window.devicePixelRatio || 1)); if (ZOOM) { st.style.transform = 'none'; st.style.zoom = String(s); } else st.style.transform = s === 1 ? 'none' : 'scale(' + s + ')'; }
  function T(e, o) {
    if (!e) return;
    const k = K, r = (o.r || 0) * k;
    let x = (o.x || 0) * k, y = (o.y || 0) * k; if (SNAP) { x = Math.round(x / SNAP) * SNAP; y = Math.round(y / SNAP) * SNAP; }
    let s = o.s == null ? 1 : o.s; s = 1 + (s - 1) * (k < 1 ? 0.15 : 1);
    const sx = o.sx == null ? 1 : 1 + (o.sx - 1) * (k < 1 ? 0.15 : 1), sy = o.sy == null ? 1 : 1 + (o.sy - 1) * (k < 1 ? 0.15 : 1);
    // تحويل ثنائي الأبعاد: لا طبقة مستقلة لكل عنصر، فلا تقفز العناصر بكسلاً هنا وهناك (كان يبدو اهتزازاً)
    let tr = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px)';
    if (r) tr += ' rotate(' + r.toFixed(3) + 'deg)';
    if (s !== 1) tr += ' scale(' + s.toFixed(4) + ')';
    if (sx !== 1 || sy !== 1) tr += ' scale(' + sx.toFixed(4) + ',' + sy.toFixed(4) + ')';
    if (o.ry && !LITE) tr = 'perspective(1600px) ' + tr + ' rotateY(' + (o.ry * k).toFixed(2) + 'deg)';
    if (o.rx && !LITE) tr = (o.ry ? '' : 'perspective(1600px) ') + tr + ' rotateX(' + (o.rx * k).toFixed(2) + 'deg)';
    if (e._tr !== tr) { e.style.transform = tr; e._tr = tr; }
    const op = o.o == null ? 1 : cl(o.o), ops = op.toFixed(3);
    if (e._op !== ops) { e.style.opacity = ops; e.style.visibility = op <= 0.002 ? 'hidden' : ''; e._op = ops; }
    const b = LITE ? 0 : (o.b || 0) * (k < 1 ? 0 : 1), bs = b > 0.15 ? 'blur(' + b.toFixed(1) + 'px)' : '';
    if (e._bl !== bs) { e.style.filter = bs; e._bl = bs; }
  }
  function show(e, on) { const v = on ? '' : 'none'; if (e._dp !== v) { e.style.display = v; e._dp = v; } }
  function txt(e, s) { if (e._tx !== s) { e.textContent = s; e._tx = s; } }
  function sty(e, k, v) { const key = '_s_' + k; if (e[key] !== v) { e.style[k] = v; e[key] = v; } }

  /* ---------- الأيقونات (خطوط) ---------- */
  const IC = {
    // أيقونات أدوات الدرس وعرض المقدّم (كما في الموقع)
    pen: '<path d="M4 20l1.2-4.6L15.6 5a2.1 2.1 0 0 1 3 3L8.2 18.4z"/><path d="M13.5 7l3 3"/>',
    marker: '<path d="M9 14l-4 4v2h4l4-4"/><path d="M9 14l6-9 4 4-9 6z"/><path d="M3 21h18" opacity=".5"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    zoomin: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6M11 8v6"/>',
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    grid: '<rect x="3" y="3" width="7" height="9" rx="1.6"/><rect x="14" y="3" width="7" height="5" rx="1.6"/><rect x="14" y="12" width="7" height="9" rx="1.6"/><rect x="3" y="16" width="7" height="5" rx="1.6"/>',
    text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.8-1.8 0-1.3-1-1.4-1-2.6 0-1 .8-1.6 1.8-1.6H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="10.5" cy="7" r="1.2" fill="currentColor"/><circle cx="15.5" cy="8" r="1.2" fill="currentColor"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    content: '<path d="M4 6h16M4 12h10M4 18h13"/>',
    download: '<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 4 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', close: '<path d="M6 6l12 12M18 6 6 18"/>', check: '<path d="M5 12.5 9.5 17 19 7.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    star: '<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z"/>',
    slides: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    sparkles: '<path d="M9 4l1.5 4L15 9.5l-4.5 1.5L9 15l-1.5-4L3 9.5 7.5 8zM18 13l.8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8z"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    send: '<path d="M21 3 3 10l7 3 3 7z"/><path d="m10 13 11-10"/>',
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z"/>',
    link: '<path d="M9 15l6-6M11 6l.5-.5a5 5 0 0 1 7 7l-.5.5M13 18l-.5.5a5 5 0 0 1-7-7l.5-.5"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    quote: '<path d="M10 11H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6c0 2.7-1.3 4.3-4 5M19 11h-4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6c0 2.7-1.3 4.3-4 5"/>',
    qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
    shapes: '<circle cx="8" cy="8" r="4.5"/><path d="M13 20l4-7 4 7z"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M8.5 13h7M8.5 17h5"/>',
    play: '<path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none"/>',
    vol: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
    replay: '<path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6"/><path d="M4 4v4.6h4.6"/>',
    next: '<path d="M17.5 6.2v11.6a.6.6 0 0 1-.9.5L8 12.5a.6.6 0 0 1 0-1l8.6-5.8a.6.6 0 0 1 .9.5z" fill="currentColor" stroke="none"/><path d="M6 6v12" stroke-width="2.4"/>',
    prev: '<path d="M6.5 6.2v11.6a.6.6 0 0 0 .9.5l8.6-5.8a.6.6 0 0 0 0-1L7.4 5.7a.6.6 0 0 0-.9.5z" fill="currentColor" stroke="none"/><path d="M18 6v12" stroke-width="2.4"/>',
    skip: '<path d="m12 7-5 5 5 5M18 7l-5 5 5 5"/>',
    leaf: '<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19 14 10"/>',
    wave: '<path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    pin: '<path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
    motion: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z" fill="currentColor"/>',
    calm: '<path d="M3 12c3-4 6-4 9 0s6 4 9 0"/>',
    up: '<path d="m6 15 6-6 6 6"/>'
  };
  function ico(name, size, color, sw) {
    // المقاس في style أيضاً: قاعدة عامة في الموقع تفرض ١٨ بكسلاً على أيقونات العناصر فتصغّر أيقونات المقاطع
    return '<svg viewBox="0 0 24 24" width="' + (size || 24) + '" height="' + (size || 24) + '" style="width:' + (size || 24) + 'px;height:' + (size || 24) + 'px" fill="none" stroke="' + (color || 'currentColor') + '" stroke-width="' + (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[name] || '') + '</svg>';
  }

  /* ---------- الألوان: تُقرأ من نظام الألوان في المنصة (--ac) ---------- */
  let MO_POP = '#4f46e5';
  function accent() {
    let ac = '';
    try { ac = getComputedStyle(document.documentElement).getPropertyValue('--ac').trim(); } catch (e) {}
    if (!/^#[0-9a-f]{3,6}$/i.test(ac)) ac = '#4f46e5';
    if (ac.length === 4) ac = '#' + ac[1] + ac[1] + ac[2] + ac[2] + ac[3] + ac[3];
    // لون اللمعة: إن كان لون الواجهة داكناً (أسود) نلمع بالبرتقالي فيكسر رتابة الأسود والأبيض
    const lum = parseInt(ac.slice(1, 3), 16) * 0.299 + parseInt(ac.slice(3, 5), 16) * 0.587 + parseInt(ac.slice(5, 7), 16) * 0.114;
    MO_POP = lum < 45 ? '#f0731f' : ac;
    return { pop: MO_POP, ac: ac, ac2: mix(ac, '#000000', 0.22), ac3: mix(ac, '#ffffff', 0.25), ink: mix(ac, '#0b0b14', 0.82), soft: mix(ac, '#ffffff', 0.93), bg: mix(ac, '#f6f6f8', 0.965), t1: rgba(ac, 0.10), t2: rgba(ac, 0.18) };
  }
  const PAL = { or: '#f88833', te: '#0d8478', pl: '#9d2b5e', bl: '#1a71fd', gr: '#36a660', ol: '#467a2f', rd: '#d64545' };
  // هويات تجريبية (أسماء عامة، لا بيانات حقيقية)
  const IDS = [
    { n: 'مسار الضياء', c: ['#b9440b', '#f6a54a', '#fff6ee', '#4d1a04'], g: 'ض' },
    { n: 'نادي البيان', c: ['#0d8478', '#83d6c8', '#eefaf7', '#053a35'], g: 'ب' },
    { n: 'برنامج النخبة', c: ['#4f46e5', '#aaa5ff', '#f1f0fd', '#1d1773'], g: 'ن' },
    { n: 'ملتقى الأسرة', c: ['#9d2b5e', '#f2a7c7', '#fdf1f6', '#420d27'], g: 'أ' },
    { n: 'مخيم الربيع', c: ['#467a2f', '#b9dc8e', '#f3f8ec', '#1d3a14'], g: 'ر' },
    { n: 'دورة الإلقاء', c: ['#1668e3', '#94bdff', '#eef4ff', '#082c66'], g: 'د' }
  ];

  /* ---------- المؤثرات الصوتية (WebAudio): نفس الدوال للتشغيل الحي وللتصدير دون اتصال ---------- */
  const SFX = (function () {
    const nb = new WeakMap();
    function noise(ctx) {
      if (nb.has(ctx)) return nb.get(ctx);
      const len = ctx.sampleRate * 2, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0), r = rng(7);
      for (let i = 0; i < len; i++) d[i] = r() * 2 - 1;
      nb.set(ctx, b); return b;
    }
    function nsrc(ctx, t, dur, off) { const s = ctx.createBufferSource(); s.buffer = noise(ctx); s.loop = true; s.start(t, off || 0); s.stop(t + dur + 0.05); return s; }
    function g(ctx, v) { const x = ctx.createGain(); x.gain.value = v == null ? 1 : v; return x; }
    function pan(ctx, out, a, b, t, d) { if (!ctx.createStereoPanner) return out; const p = ctx.createStereoPanner(); p.pan.setValueAtTime(a, t); p.pan.linearRampToValueAtTime(b, t + d); p.connect(out); return p; }
    function env(gn, t, a, d, peak) { gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(peak, t + a); gn.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
    function osc(ctx, type, f0, f1, t, d) { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + d); o.start(t); o.stop(t + d + 0.05); return o; }
    function filt(ctx, type, f, q) { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; return b; }
    const K = {
      whoosh: function (ctx, out, t, o) {
        const d = o.d || 0.55, v = o.v || 0.5, f = o.f || 2400, s = nsrc(ctx, t, d, (t * 7.3) % 1.5), bp = filt(ctx, 'bandpass', 300, 1.1), gn = g(ctx, 0);
        bp.frequency.setValueAtTime(260, t); bp.frequency.exponentialRampToValueAtTime(f, t + d * 0.6); bp.frequency.exponentialRampToValueAtTime(420, t + d);
        gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(v, t + d * 0.55); gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
        s.connect(bp); bp.connect(gn); gn.connect(pan(ctx, out, o.pa == null ? 0.7 : o.pa, o.pb == null ? -0.7 : o.pb, t, d));
        const lo = osc(ctx, 'sine', 180, 70, t, d), lg = g(ctx, 0); env(lg, t + d * 0.3, d * 0.25, d * 0.5, v * 0.25); lo.connect(lg); lg.connect(out);
      },
      pop: function (ctx, out, t, o) {
        const p = o.p || 1, v = o.v || 0.5, a = osc(ctx, 'sine', 1150 * p, 330 * p, t, 0.09), ga = g(ctx, 0); env(ga, t, 0.004, 0.13, v); a.connect(ga); ga.connect(out);
        const s = nsrc(ctx, t, 0.03, (t * 3.1) % 1.5), hp = filt(ctx, 'highpass', 3000), gs = g(ctx, 0); env(gs, t, 0.002, 0.02, v * 0.35); s.connect(hp); hp.connect(gs); gs.connect(out);
      },
      click: function (ctx, out, t, o) {
        const v = o.v || 0.4, s = nsrc(ctx, t, 0.04, (t * 5.7) % 1.5), hp = filt(ctx, 'bandpass', 3200, 1.4), gs = g(ctx, 0); env(gs, t, 0.001, 0.03, v); s.connect(hp); hp.connect(gs); gs.connect(out);
        const a = osc(ctx, 'triangle', 2100, 1500, t, 0.02), ga = g(ctx, 0); env(ga, t, 0.001, 0.025, v * 0.25); a.connect(ga); ga.connect(out);
      },
      tick: function (ctx, out, t, o) { const a = osc(ctx, 'sine', 2300 * (o.p || 1), 2100 * (o.p || 1), t, 0.04), ga = g(ctx, 0); env(ga, t, 0.002, 0.045, o.v || 0.16); a.connect(ga); ga.connect(out); },
      type: function (ctx, out, t, o) {
        const d = o.d || 1, r = o.r || 14, n = Math.max(1, Math.floor(d * r)), R = rng(Math.round(t * 1000) + 3);
        for (let i = 0; i < n; i++) {
          const ti = t + i / r + (R() - 0.5) * 0.25 / r, v = (o.v || 0.22) * (0.65 + R() * 0.5);
          const s = nsrc(ctx, ti, 0.03, R() * 1.4), bp = filt(ctx, 'bandpass', 1700 + R() * 2200, 2.2), gs = g(ctx, 0); env(gs, ti, 0.001, 0.028, v); s.connect(bp); bp.connect(gs); gs.connect(out);
          const a = osc(ctx, 'sine', 420 + R() * 160, 300, ti, 0.03), ga = g(ctx, 0); env(ga, ti, 0.001, 0.03, v * 0.3); a.connect(ga); ga.connect(out);
        }
      },
      riser: function (ctx, out, t, o) {
        const d = o.d || 1.2, v = o.v || 0.3, s = nsrc(ctx, t, d, (t * 2.3) % 1.5), bp = filt(ctx, 'bandpass', 200, 2), gn = g(ctx, 0);
        bp.frequency.setValueAtTime(200, t); bp.frequency.exponentialRampToValueAtTime(5200, t + d);
        gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(v, t + d * 0.96); gn.gain.linearRampToValueAtTime(0.0001, t + d + 0.04);
        s.connect(bp); bp.connect(gn); gn.connect(out);
        const a = osc(ctx, 'sawtooth', 90, 720, t, d), lp = filt(ctx, 'lowpass', 600, 4), ga = g(ctx, 0);
        lp.frequency.setValueAtTime(400, t); lp.frequency.exponentialRampToValueAtTime(3600, t + d);
        ga.gain.setValueAtTime(0.0001, t); ga.gain.exponentialRampToValueAtTime(v * 0.28, t + d * 0.96); ga.gain.linearRampToValueAtTime(0.0001, t + d + 0.04);
        a.connect(lp); lp.connect(ga); ga.connect(out);
      },
      impact: function (ctx, out, t, o) {
        const v = o.v || 0.8, a = osc(ctx, 'sine', 120, 36, t, 0.7), ga = g(ctx, 0); env(ga, t, 0.006, 0.9, v); a.connect(ga); ga.connect(out);
        const b = osc(ctx, 'triangle', 70, 45, t, 0.3), gb = g(ctx, 0); env(gb, t, 0.004, 0.35, v * 0.4); b.connect(gb); gb.connect(out);
        const s = nsrc(ctx, t, 0.6, (t * 1.9) % 1.5), lp = filt(ctx, 'lowpass', 1400, 0.7), gs = g(ctx, 0); env(gs, t, 0.003, 0.45, v * 0.55); s.connect(lp); lp.connect(gs); gs.connect(out);
      },
      shimmer: function (ctx, out, t, o) {
        const f = o.f || 1320, v = o.v || 0.07, ps = [1, 1.25, 1.5, 2, 2.5, 3];
        ps.forEach(function (m, i) {
          const ti = t + i * 0.045, a = osc(ctx, 'sine', f * m, f * m * 1.004, ti, 1.6), ga = g(ctx, 0); env(ga, ti, 0.02, 1.3 - i * 0.1, v * (1 - i * 0.1));
          a.connect(ga); ga.connect(pan(ctx, out, i % 2 ? 0.45 : -0.45, i % 2 ? -0.3 : 0.3, ti, 1.4));
        });
      },
      chime: function (ctx, out, t, o) {
        const v = o.v || 0.2;[[1046.5, 0], [1568, 0.09]].forEach(function (n) {
          [1, 2.76].forEach(function (m, j) { const a = osc(ctx, 'sine', n[0] * m, n[0] * m, t + n[1], 1.1), ga = g(ctx, 0); env(ga, t + n[1], 0.004, j ? 0.35 : 1.0, v * (j ? 0.25 : 1)); a.connect(ga); ga.connect(out); });
        });
      },
      swish: function (ctx, out, t, o) { K.whoosh(ctx, out, t, { d: o.d || 0.3, v: o.v || 0.3, f: o.f || 4200, pa: o.pa, pb: o.pb }); },
      thud: function (ctx, out, t, o) { const a = osc(ctx, 'sine', 160, 60, t, 0.18), ga = g(ctx, 0); env(ga, t, 0.003, 0.22, o.v || 0.45); a.connect(ga); ga.connect(out); }
    };
    function bus(ctx, dest) {
      const m = ctx.createGain(); m.gain.value = 0.85;
      const c = ctx.createDynamicsCompressor(); c.threshold.value = -14; c.knee.value = 8; c.ratio.value = 4; c.attack.value = 0.003; c.release.value = 0.2;
      m.connect(c); c.connect(dest || ctx.destination); return m;
    }
    function play(ctx, out, t, kind, o) { try { (K[kind] || K.click)(ctx, out, t, o || {}); } catch (e) {} }
    return { play: play, bus: bus, kinds: Object.keys(K) };
  })();

  /* ---------- الأنماط (تُحقن مرة واحدة) ---------- */
  let cssDone = false;
  function injectCSS() {
    if (cssDone || typeof document === 'undefined') return; cssDone = true;
    const s = document.createElement('style'); s.id = 'mo-css'; s.textContent = CSS_TEXT; document.head.appendChild(s);
  }
  const CSS_TEXT = [
    '.mo-stage{--mo-fd:var(--fd,"thm-display","Noto Kufi Arabic","Segoe UI",Tahoma,sans-serif);--mo-ft:var(--ft,"thm-text","Noto Naskh Arabic","Segoe UI",Tahoma,sans-serif);position:relative;overflow:hidden;direction:rtl;font-family:var(--mo-ft);color:#14141c;background:#f7f7f9;transform-origin:0 0;contain:strict;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;user-select:none;-webkit-user-select:none;line-height:1.5}',
    '.mo-stage *{box-sizing:border-box;transition:none!important;animation:none!important}',
    '.mo-stage svg{display:block}',
    '.mo-a{position:absolute}',
    '@media (pointer:coarse),(max-width:760px){.mo-pl{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:rgba(9,9,16,.97)!important}.mo-end{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:rgba(10,10,20,.78)!important}}',
    '.mo-sc{position:absolute;left:0;top:0;width:100%;height:100%;overflow:hidden;transform-origin:50% 50%}',
    '.mo-kt{font-family:var(--mo-fd);line-height:1.32;text-wrap:balance}',
    '.mo-kt.t{font-family:var(--mo-ft)}',
    '.mo-w{display:inline-block;white-space:nowrap;position:relative;isolation:isolate}',
    '.mo-mk{position:absolute;left:-.08em;right:-.08em;bottom:.1em;height:.34em;border-radius:.12em;z-index:-1;transform-origin:100% 50%}',
    '.mo-card{background:#fff;border-radius:28px;box-shadow:0 1px 2px rgba(16,16,40,.06),0 28px 70px -24px rgba(24,24,70,.28)}',
    '.mo-eb{display:inline-flex;align-items:center;gap:12px;border-radius:99px;padding:10px 22px 10px 24px;font-family:var(--mo-ft);font-weight:600;white-space:nowrap}',
    '.mo-head{display:flex;flex-direction:column;justify-content:center;gap:22px}',
    '.mo-pill{display:inline-flex;align-items:center;justify-content:center;gap:10px;border-radius:99px;white-space:nowrap;font-weight:600}',
    '.mo-fld{border:2px solid #e3e3ea;border-radius:16px;background:#fff;display:flex;align-items:center;padding:0 18px;white-space:nowrap;overflow:hidden;color:#1b1b24}',
    '.mo-lbl{color:#6b6b76;font-size:19px}',
    '.mo-caret{display:inline-block;width:3px;height:1.05em;vertical-align:-.15em;margin-inline-start:2px;border-radius:2px}',
    '.mo-cur{pointer-events:none;z-index:50;transform-origin:6px 4px}',
    '.mo-ring{border-radius:50%;pointer-events:none;z-index:49}',
    '.mo-poster{position:absolute;overflow:hidden;border-radius:14px}',
    '.mo-poster .pt{font-family:var(--mo-fd);font-weight:700;line-height:1.18;text-wrap:balance}',
    '.mo-dots{display:flex;gap:10px}',
    '.mo-ic{display:grid;place-items:center;border-radius:22%}',
    /* المشغّل */
    '.mo-pl{position:fixed;inset:0;z-index:2147483000;background:rgba(9,9,16,.9);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);direction:rtl;font-family:var(--ft,system-ui);color:#fff;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .35s ease;touch-action:manipulation;overscroll-behavior:contain}',
    '.mo-pl.on{opacity:1}',
    '.mo-pl *{box-sizing:border-box}',
    '.mo-frame{position:relative;border-radius:18px;overflow:hidden;box-shadow:0 40px 120px -30px rgba(0,0,0,.7);background:#f7f7f9;flex:none}',
    '.mo-frame .mo-stage{position:absolute;left:0;top:0}',
    '.mo-hit{position:absolute;inset:0;z-index:2;cursor:pointer}',
    '.mo-ui{position:absolute;inset:0;z-index:3;pointer-events:none;transition:opacity .35s ease}',
    '.mo-pl.idle .mo-ui{opacity:0}',
    '.mo-pl.idle{cursor:none}',
    '.mo-ui>*{pointer-events:auto}',
    '.mo-topbar{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;gap:12px;padding:14px 16px 34px;background:linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,0))}',
    '.mo-ttl{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.3}',
    '.mo-ttl b{font-family:var(--fd,system-ui);font-weight:500;font-size:19px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.mo-ttl span{font-size:13px;opacity:.75}',
    '.mo-b{appearance:none;border:0;background:rgba(255,255,255,.14);color:#fff;width:42px;height:42px;border-radius:50%;display:inline-grid;place-items:center;cursor:pointer;flex:none;transition:background .2s,transform .2s}',
    '.mo-b:hover{background:rgba(255,255,255,.26)}.mo-b:active{transform:scale(.92)}',
    '.mo-b:focus-visible,.mo-skip:focus-visible,.mo-bar:focus-visible{outline:2px solid #fff;outline-offset:2px}',
    '.mo-b.on{background:#fff;color:#111}',
    '.mo-skip{appearance:none;border:0;background:#fff;color:#111;border-radius:99px;padding:9px 18px;font:inherit;font-size:15px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 6px 20px rgba(0,0,0,.3)}',
    '.mo-bot{position:absolute;left:0;right:0;bottom:0;padding:40px 14px 12px;background:linear-gradient(rgba(0,0,0,0),rgba(0,0,0,.62));display:flex;flex-direction:column;gap:8px}',
    '.mo-row{display:flex;align-items:center;gap:8px}',
    '.mo-time{font-size:13.5px;font-variant-numeric:tabular-nums;opacity:.9;white-space:nowrap;direction:ltr;unicode-bidi:isolate;min-width:84px;text-align:center}',
    '.mo-chl{flex:1;min-width:0;font-size:14px;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center}',
    '.mo-bar{position:relative;height:22px;cursor:pointer;touch-action:none;display:flex;align-items:center}',
    '.mo-trk{position:absolute;left:0;right:0;height:5px;border-radius:5px;background:rgba(255,255,255,.28);overflow:hidden}',
    '.mo-fill{position:absolute;top:0;bottom:0;right:0;background:#fff;border-radius:5px}',
    '.mo-knob{position:absolute;width:15px;height:15px;border-radius:50%;background:#fff;top:50%;margin-top:-7.5px;margin-right:-7.5px;box-shadow:0 1px 6px rgba(0,0,0,.4)}',
    '.mo-tk{position:absolute;top:50%;width:3px;height:9px;margin-top:-4.5px;border-radius:2px;background:rgba(0,0,0,.55);margin-right:-1.5px}',
    '.mo-tip{position:absolute;bottom:28px;transform:translateX(50%);background:#fff;color:#111;font-size:13px;padding:5px 10px;border-radius:9px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .15s}',
    '.mo-bar:hover .mo-tip{opacity:1}',
    '.mo-big{position:absolute;left:50%;top:50%;width:84px;height:84px;margin:-42px 0 0 -42px;border-radius:50%;background:rgba(255,255,255,.95);color:#111;display:grid;place-items:center;border:0;cursor:pointer;box-shadow:0 10px 40px rgba(0,0,0,.35);z-index:4}',
    '.mo-big svg{width:36px;height:36px;margin-left:-4px}',
    '.mo-end{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(10,10,20,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}',
    '.mo-end .row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.mo-eb2{appearance:none;border:0;border-radius:99px;padding:12px 22px;font:inherit;font-size:16px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px;background:#fff;color:#111}',
    '.mo-eb2.ghost{background:rgba(255,255,255,.16);color:#fff}',
    '.mo-snd{position:absolute;top:64px;left:50%;transform:translateX(-50%);background:#fff;color:#111;border-radius:99px;padding:8px 16px;font-size:14px;box-shadow:0 6px 20px rgba(0,0,0,.3);display:flex;align-items:center;gap:6px;cursor:pointer;border:0;font:inherit}',
    '.mo-skipw{position:absolute;bottom:92px;left:16px;z-index:4}',
    '@media (max-width:520px){.mo-hide-s{display:none!important}.mo-b{width:38px;height:38px}.mo-bot{padding:36px 8px 8px}.mo-time{min-width:0;font-size:12.5px}.mo-skipw{bottom:96px;left:10px}}',
    '.mo-pv{position:relative;overflow:hidden;border-radius:14px;background:#f7f7f9}',
    '.mo-pv .mo-stage{position:absolute;left:0;top:0;pointer-events:none}'
  ].join('\n');

  /* ---------- الخلفية والتخطيط ---------- */
  function lay(S) {
    if (S.v) return { txt: { x: 70, y: 150, w: 940, h: 510 }, box: { x: 40, y: 690, w: 1000, h: 1150 } };
    return { txt: { x: 1210, y: 120, w: 640, h: 840 }, box: { x: 50, y: 90, w: 1110, h: 900 } };
  }

  /* ---------- نص حركي: كلمة كلمة (لا تُقسَّم الحروف العربية) ---------- */
  // *كلمات* بلون بارز، _كلمات_ بخط تمييز، | سطر جديد
  function KT(parent, text, o) {
    o = o || {};
    const e = o.flow ? h('div', 'mo-kt' + (o.font === 't' ? ' t' : ''), parent) : A(parent, o.x || 0, o.y || 0, o.w, null, 'mo-kt' + (o.font === 't' ? ' t' : ''));
    css(e, { fontSize: o.size + 'px', fontWeight: String(o.weight || (o.font === 't' ? 400 : 700)), color: o.color || '#111118', lineHeight: String(o.lh || (o.font === 't' ? 1.5 : 1.28)), textAlign: o.align || 'right' });
    if (o.w && o.flow) e.style.maxWidth = o.w + 'px';
    if (o.ls) e.style.letterSpacing = o.ls;
    const words = [];
    const segs = String(text).split(/(\*[^*]+\*|_[^_]+_|\|)/).filter(function (s) { return s !== ''; });
    let first = true;
    segs.forEach(function (seg) {
      if (seg === '|') { h('br', null, e); first = true; return; }
      let hl = 0, s = seg;
      if (/^\*[^*]+\*$/.test(seg)) { hl = 1; s = seg.slice(1, -1); } else if (/^_[^_]+_$/.test(seg)) { hl = 2; s = seg.slice(1, -1); }
      const ws = s.split(' ');
      ws.forEach(function (w, i) {
        if (w === '') return;
        if (!first) e.appendChild(document.createTextNode(' '));
        const sp = h('span', 'mo-w', e); sp.textContent = w;
        if (hl === 1) sp.style.color = o.hl || MO_POP;
        let mk = null;
        if (hl === 2) { mk = h('i', 'mo-mk', sp); mk.style.background = o.mk || 'rgba(79,70,229,.22)'; }
        words.push({ e: sp, hl: hl, mk: mk }); first = false;
      });
    });
    const sz = o.size || 40;
    return {
      e: e, words: words,
      up: function (lt, a, b, q) {
        q = q || {}; const st = q.st == null ? (o.st == null ? 0.06 : o.st) : q.st, du = q.du || o.du || 0.75, mode = q.mode || o.mode || 'rise';
        words.forEach(function (w, i) {
          const p = (mode === 'slam' ? E.spr : E.o5)(P(lt, a + i * st, du));
          const x = b == null ? 0 : E.i3(P(lt, b + i * 0.025, 0.38));
          let st2;
          if (mode === 'slam') st2 = { s: 1 + (1 - p) * 0.9, o: P(lt, a + i * st, 0.12) * (1 - x), b: (1 - P(lt, a + i * st, du * 0.5)) * 18 + x * 10, y: -x * sz * 0.3 };
          else if (mode === 'blur') st2 = { s: 1 + (1 - p) * 0.12, o: p * (1 - x), b: (1 - p) * 16 + x * 10, y: -x * sz * 0.3 };
          else if (mode === 'drop') st2 = { y: -(1 - p) * sz * 0.7 - x * sz * 0.3, o: p * (1 - x), b: (1 - p) * 10 + x * 10, r: (1 - p) * -6 };
          else st2 = { y: (1 - p) * sz * 0.55 - x * sz * 0.35, o: p * (1 - x), b: (1 - p) * 13 + x * 10 };
          T(w.e, st2);
          if (w.mk) { const m = E.io3(P(lt, a + i * st + du * 0.6, 0.55)); sty(w.mk, 'transform', 'scaleX(' + m.toFixed(3) + ')'); }
        });
      }
    };
  }

  /* ---------- مؤشر الفأرة أو اللمس ---------- */
  const PTR = '<svg viewBox="0 0 28 34" width="44" height="54"><path d="M3 2.5v25.2l6.6-6.2 4.3 9.6 4.6-2-4.2-9.4 9.2-.4z" fill="#fff" stroke="#111" stroke-width="2.2" stroke-linejoin="round"/></svg>';
  function Cursor(parent, keys, sfx, o) {
    o = o || {};
    const touch = !!o.touch, el = A(parent, 0, 0, touch ? 64 : 44, touch ? 64 : 54, 'mo-cur', touch ? '' : PTR);
    if (touch) css(el, { borderRadius: '50%', background: 'rgba(255,255,255,.55)', border: '3px solid rgba(20,20,30,.35)', boxShadow: '0 6px 18px rgba(0,0,0,.25)', marginLeft: '-32px', marginTop: '-32px' });
    const ring = A(parent, 0, 0, 90, 90, 'mo-ring'); css(ring, { border: '4px solid ' + (o.color || MO_POP), marginLeft: '-45px', marginTop: '-45px' });
    keys = keys.slice().sort(function (a, b) { return a[0] - b[0]; });
    if (sfx) keys.forEach(function (k) { if (k[3]) sfx(k[0], touch ? 'tick' : 'click', { v: touch ? 0.2 : 0.4, p: 0.8 }); });
    const end = o.end == null ? keys[keys.length - 1][0] + 0.7 : o.end;
    return {
      el: el, keys: keys,
      pos: function (lt) {
        if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
        for (let i = 1; i < keys.length; i++) {
          const a = keys[i - 1], b = keys[i];
          if (lt <= b[0]) { const mv = b[4] || Math.min(0.75, b[0] - a[0]); const p = E.io3(P(lt, b[0] - mv, mv)); return [lerp(a[1], b[1], p), lerp(a[2], b[2], p)]; }
        }
        const z = keys[keys.length - 1]; return [z[1], z[2]];
      },
      up: function (lt) {
        const vis = P(lt, keys[0][0] - 0.35, 0.3) * (1 - P(lt, end, 0.3));
        const xy = this.pos(lt);
        let press = 0, rp = -1;
        keys.forEach(function (k) { if (k[3]) { const d = lt - k[0]; if (d >= -0.08 && d < 0.2) press = Math.max(press, 1 - Math.abs(d - 0.04) / 0.16); if (d >= 0 && d < 0.55) rp = d / 0.55; } });
        T(el, { x: xy[0], y: xy[1], s: 1 - 0.18 * cl(press), o: vis });
        if (rp >= 0) T(ring, { x: xy[0], y: xy[1], s: 0.2 + E.o3(rp) * 1.1, o: (1 - rp) * 0.9 * vis }); else T(ring, { o: 0 });
      }
    };
  }

  /* ---------- الملصق: تصميم إعلان مصغّر بهوية برنامج ---------- */
  function poster(parent, x, y, w, hh, sp) {
    sp = sp || {}; hh = hh || Math.round(w * 1.25);
    const e = A(parent, x, y, w, hh, 'mo-poster'), u = w / 100, R = {};
    e.style.boxShadow = sp.flat ? '' : '0 2px 4px rgba(0,0,0,.06),0 18px 44px -18px rgba(0,0,0,.35)';
    const L = sp.lay || 'panel';
    const set = function (c) { R.c = c; e.style.setProperty('--p1', c[0]); e.style.setProperty('--p2', c[1]); e.style.setProperty('--p3', c[2]); e.style.setProperty('--p4', c[3]); };
    set(sp.c || IDS[0].c);
    const logo = function (col, bg) { const g = A(e, w - 15 * u, 4.5 * u, 10 * u, 10 * u, null, '<div style="width:100%;height:100%;border-radius:50%;background:' + bg + ';display:grid;place-items:center;color:' + col + ';font-family:var(--mo-fd);font-weight:700;font-size:' + (5.4 * u) + 'px;line-height:1">' + (sp.g || 'ض') + '</div>'); return g; };
    const meta = function (top, col) {
      const m = A(e, 6 * u, top, 88 * u, 8 * u); css(m, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: col, fontSize: (3.6 * u) + 'px', fontWeight: '600', whiteSpace: 'nowrap' });
      (sp.meta || ['الخميس ٨:٠٠ م', 'عبر زوم']).forEach(function (s, i) { h('span', null, m, (i ? ico('pin', 3.6 * u, col, 2.2) : ico('clock', 3.6 * u, col, 2.2)).replace('<svg', '<svg style="display:inline-block;vertical-align:-.15em;margin-inline-end:.3em"') + s); });
      return m;
    };
    const mkTitle = function (x0, y0, ww, size, col, align) { const t = A(e, x0, y0, ww, null, 'pt'); css(t, { fontSize: size + 'px', color: col, textAlign: align || 'right' }); t.textContent = sp.title == null ? 'اللقاء الافتتاحي' : sp.title; return t; };
    const mkSub = function (x0, y0, ww, col, align) { const t = A(e, x0, y0, ww, null); css(t, { fontSize: (4.6 * u) + 'px', color: col, textAlign: align || 'right', fontWeight: '500', whiteSpace: 'nowrap' }); t.textContent = sp.sub == null ? 'أ. خالد العمر' : sp.sub; return t; };
    if (L === 'panel') {
      e.style.background = 'var(--p3)';
      for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { const d = A(e, (7 + c * 18) * u, (8 + r * 13) * u, 11 * u, 11 * u); css(d, { borderRadius: '50%', background: 'rgba(0,0,0,.045)' }); }
      const fl = A(e, 18 * u, 17 * u, 16 * u, 16 * u, null, '<svg viewBox="0 0 40 40" width="100%" height="100%"><g fill="var(--p2)"><ellipse cx="20" cy="10" rx="5.5" ry="10"/><ellipse cx="20" cy="30" rx="5.5" ry="10"/><ellipse cx="10" cy="20" rx="10" ry="5.5"/><ellipse cx="30" cy="20" rx="10" ry="5.5"/></g></svg>');
      R.fl = fl; logo('#fff', 'var(--p1)');
      const pn = A(e, 0, hh * 0.47, w, hh * 0.53); css(pn, { background: 'var(--p1)', borderRadius: (7 * u) + 'px ' + (7 * u) + 'px 0 0' }); R.panel = pn;
      R.title = mkTitle(6 * u, hh * 0.47 + 7 * u, 88 * u, 10.5 * u, '#fff'); R.sub = mkSub(6 * u, hh * 0.47 + 32 * u, 88 * u, 'rgba(255,255,255,.82)');
      R.meta = meta(hh - 11 * u, '#fff');
      if (hh * 0.47 + 32 * u + 7 * u > hh - 11 * u) R.sub.style.visibility = 'hidden';   // بطاقة قصيرة: لا يتداخل اسم المقدّم مع الموعد
    } else if (L === 'circle') {
      e.style.background = '#fff';
      const ring = A(e, 12 * u, hh * 0.5 - 38 * u, 76 * u, 76 * u); css(ring, { borderRadius: '50%', border: (0.8 * u) + 'px solid var(--p2)' });
      const ring2 = A(e, 16 * u, hh * 0.5 - 34 * u, 68 * u, 68 * u); css(ring2, { borderRadius: '50%', border: (0.4 * u) + 'px dashed var(--p1)', opacity: '.5' });
      R.title = mkTitle(16 * u, hh * 0.5 - 16 * u, 68 * u, 10.5 * u, 'var(--p4)', 'center'); R.sub = mkSub(16 * u, hh * 0.5 + 12 * u, 68 * u, 'var(--p1)', 'center');
      const pt = A(e, 10 * u, hh - 22 * u, 14 * u, 14 * u, null, '<svg viewBox="0 0 40 40" width="100%" height="100%"><g fill="var(--p1)"><ellipse cx="20" cy="10" rx="5.5" ry="10"/><ellipse cx="20" cy="30" rx="5.5" ry="10"/><ellipse cx="10" cy="20" rx="10" ry="5.5"/><ellipse cx="30" cy="20" rx="10" ry="5.5"/></g></svg>'); R.fl = pt;
      logo('#fff', 'var(--p1)'); R.meta = meta(hh - 10 * u, 'var(--p4)');
    } else if (L === 'clock') {
      e.style.background = 'var(--p4)';
      const cw = 120 * u, cx = -30 * u, cy = -18 * u, cg = A(e, cx, cy, cw, cw); let ts = '';
      for (let i = 0; i < 60; i++) { const a = i * 6, big = i % 5 === 0; ts += '<line x1="60" y1="' + (big ? 4 : 6) + '" x2="60" y2="' + (big ? 11 : 8.5) + '" stroke="var(--p2)" stroke-width="' + (big ? 0.9 : 0.45) + '" transform="rotate(' + a + ' 60 60)" opacity="' + (big ? 0.9 : 0.5) + '"/>'; }
      cg.innerHTML = '<svg viewBox="0 0 120 120" width="100%" height="100%">' + ts + '<line x1="60" y1="60" x2="60" y2="22" stroke="#fff" stroke-width="1.1" stroke-linecap="round" class="hand"/><line x1="60" y1="60" x2="88" y2="70" stroke="var(--p2)" stroke-width="1.6" stroke-linecap="round"/></svg>';
      R.hand = cg.querySelector('.hand');
      R.title = mkTitle(6 * u, hh * 0.5, 88 * u, 11 * u, '#fff'); R.sub = mkSub(6 * u, hh * 0.5 + 27 * u, 88 * u, 'var(--p2)');
      logo('var(--p4)', 'var(--p2)'); R.meta = meta(hh - 11 * u, 'rgba(255,255,255,.85)');
    } else if (L === 'arch') {
      e.style.background = 'linear-gradient(180deg,var(--p3),#fff)';
      const ar1 = A(e, 22 * u, 12 * u, 56 * u, hh * 0.56); css(ar1, { borderRadius: (28 * u) + 'px ' + (28 * u) + 'px 0 0', background: 'linear-gradient(180deg,var(--p2),var(--p1))', opacity: '.9' });
      const ar2 = A(e, 30 * u, 20 * u, 40 * u, hh * 0.56 - 8 * u); css(ar2, { borderRadius: (20 * u) + 'px ' + (20 * u) + 'px 0 0', background: 'var(--p3)', opacity: '.55' });
      const st = A(e, 46 * u, 28 * u, 8 * u, 8 * u, null, '<svg viewBox="0 0 24 24" width="100%" height="100%" style="width:100%;height:100%"><path d="M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.3L12 16.5 5.8 21l2.4-7.3L2 9.2h7.6z" fill="#fff"/></svg>'); R.fl = st;
      R.title = mkTitle(6 * u, hh * 0.6, 88 * u, 11 * u, 'var(--p4)', 'center'); R.sub = mkSub(6 * u, hh * 0.6 + 16 * u, 88 * u, 'var(--p1)', 'center');
      logo('#fff', 'var(--p1)'); R.meta = meta(hh - 10 * u, 'var(--p4)');
    } else if (L === 'bold') {
      e.style.background = 'var(--p1)';
      const c1 = A(e, -24 * u, hh - 52 * u, 70 * u, 70 * u); css(c1, { borderRadius: '50%', background: 'var(--p2)', opacity: '.55' });
      const b1 = A(e, 6 * u, 18 * u, 30 * u, 2.4 * u); css(b1, { background: 'var(--p2)', borderRadius: '9px' }); R.fl = b1;
      R.title = mkTitle(6 * u, 24 * u, 88 * u, 15 * u, '#fff'); R.sub = mkSub(6 * u, 24 * u + 40 * u, 88 * u, 'rgba(255,255,255,.85)');
      logo('var(--p1)', '#fff'); R.meta = meta(hh - 11 * u, '#fff');
    } else {
      e.style.background = 'var(--p3)';
      const sl = A(e, 0, 0, w, hh); css(sl, { background: 'var(--p1)', clipPath: 'polygon(0 58%,100% 38%,100% 100%,0 100%)' });
      const dt = A(e, 8 * u, 10 * u, 22 * u, 22 * u); css(dt, { borderRadius: '50%', border: (1.2 * u) + 'px solid var(--p2)' }); R.fl = dt;
      R.title = mkTitle(6 * u, 16 * u, 88 * u, 11 * u, 'var(--p4)'); R.sub = mkSub(6 * u, 16 * u + 27 * u, 88 * u, 'var(--p1)');
      logo('#fff', 'var(--p1)'); R.meta = meta(hh - 11 * u, '#fff');
    }
    R.e = e; R.set = set; R.w = w; R.h = hh;
    R.mixTo = function (a, b, p) { set([0, 1, 2, 3].map(function (i) { return mix(a[i], b[i], p); })); };
    return R;
  }

  /* ---------- رأس المشهد: شارة + عنوان + سطر ---------- */
  function head(S, root, o) {
    const r = o.rect || lay(S).txt, box = A(root, r.x, r.y, r.w, r.h, 'mo-head');
    const center = o.center != null ? o.center : S.v;
    css(box, { alignItems: center ? 'center' : 'flex-start', textAlign: center ? 'center' : 'right' });
    let eb = null;
    if (o.eb) {
      eb = h('div', 'mo-eb', box, (o.ic ? ico(o.ic, S.v ? 30 : 28, o.ebc || S.C.ac, 2) : '') + '<span>' + o.eb + '</span>');
      css(eb, { fontSize: (S.v ? 30 : 28) + 'px', color: o.ebc || S.C.ac, background: o.ebb || S.C.t1 });
    }
    const hk = KT(box, o.h, { flow: 1, size: o.hs || (S.v ? 104 : 92), hl: S.C.ac, mk: S.C.t2, align: center ? 'center' : 'right', color: o.hc || '#101018', w: r.w });
    const sk = o.sub ? KT(box, o.sub, { flow: 1, size: o.ss || (S.v ? 42 : 38), font: 't', color: o.sc || '#5d5d68', align: center ? 'center' : 'right', st: 0.025, du: 0.6, w: r.w }) : null;
    return {
      box: box, hk: hk, sk: sk,
      up: function (lt, a, b) {
        if (eb) { const p = E.spr(P(lt, a, 0.7)), x = b == null ? 0 : E.i3(P(lt, b, 0.3)); T(eb, { s: 0.6 + 0.4 * p, o: P(lt, a, 0.2) * (1 - x), y: -x * 20, b: x * 8 }); }
        hk.up(lt, a + 0.12, b == null ? null : b + 0.05);
        if (sk) sk.up(lt, a + 0.55, b == null ? null : b + 0.1, { mode: 'blur' });
      }
    };
  }

  /* ---------- وضع مكوّن داخل مستطيل بمقياس يناسبه ---------- */
  function place(root, comp, r, al) {
    const s = Math.min(r.w / comp.w, r.h / comp.h), ww = comp.w * s, hh = comp.h * s;
    const ox = r.x + (r.w - ww) / 2, oy = al === 'top' ? r.y : r.y + (r.h - hh) / 2;
    const wrap = A(root, ox, oy, ww, hh); wrap.style.transformOrigin = '50% 60%';
    wrap.appendChild(comp.el); css(comp.el, { position: 'absolute', left: '0', top: '0', width: comp.w + 'px', height: comp.h + 'px', transformOrigin: '0 0', transform: 'scale(' + s + ')' });
    return { wrap: wrap, s: s, x: ox, y: oy, w: ww, h: hh,
      enter: function (lt, a, b) { const p = E.o5(P(lt, a, 1.0)), x = b == null ? 0 : E.i3(P(lt, b, 0.4)); T(wrap, { y: (1 - p) * 140 - x * 40, s: 0.9 + 0.1 * p - x * 0.03, o: P(lt, a, 0.35) * (1 - x), b: (1 - p) * 10 + x * 8, rx: (1 - p) * 16, ry: (1 - p) * -10 + Math.sin(lt * 0.6) * 1.2 }); } };
  }
  // مكوّن جديد بإطار أبيض
  function comp(w, hh, cls) { const el = h('div', cls || 'mo-card'); el.style.overflow = 'hidden'; return { el: el, w: w, h: hh }; }
  function pill(parent, x, y, w, hh, label, o) {
    o = o || {}; const e = A(parent, x, y, w, hh, 'mo-pill', (o.ic ? ico(o.ic, o.is || hh * 0.42, o.fg || '#fff', 2) : '') + '<span>' + label + '</span>');
    css(e, { background: o.bg || '#111', color: o.fg || '#fff', fontSize: (o.fs || hh * 0.38) + 'px', border: o.bd || '0' }); return e;
  }
  function icTile(parent, x, y, s, name, col, o) { const e = A(parent, x, y, s, s, 'mo-ic', ico(name, s * 0.5, col, (o && o.sw) || 2)); css(e, { background: (o && o.bg) || rgba(col, 0.12), borderRadius: (s * 0.28) + 'px' }); return e; }
  function caret(col) { return '<i class="mo-caret" style="background:' + col + '"></i>'; }
  function typed(s, lt, a, b) { const n = Math.floor(s.length * P(lt, a, b - a)); return s.slice(0, n); }
  function brandSVG(kind, col) {
    let s = (typeof BRAND !== 'undefined' && BRAND[kind]) || '';
    if (!s) s = kind === 'mark' ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 94 94"><circle cx="47" cy="47" r="46" fill="#000"/><text x="47" y="60" font-size="36" text-anchor="middle" fill="#fff" font-family="sans-serif">أثر</text></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120"><text x="150" y="80" font-size="64" text-anchor="middle" fill="#000" font-family="sans-serif">أثر</text></svg>';
    return s.replace(/fill="#000"/g, 'fill="' + (col || '#000') + '"').replace('<svg ', '<svg width="100%" height="100%" ');
  }

  /* ================= المكوّنات: واجهات مصغّرة تتحرك مع الزمن ================= */
  function noop() {}
  function qrSVG(seed, col) {
    const n = 21, r = rng(seed || 5); let s = '';
    const fin = function (x, y) { return '<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="' + col + '"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" fill="' + col + '"/>'; };
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue; if (r() > 0.52) s += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02" fill="' + col + '"/>'; }
    return '<svg viewBox="-1 -1 23 23" width="100%" height="100%"><rect x="-1" y="-1" width="23" height="23" fill="#fff"/>' + fin(0, 0) + fin(14, 0) + fin(0, 14) + s + '</svg>';
  }
  function starPattern(col) {
    return '<svg viewBox="0 0 120 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><defs><pattern id="mosp" width="40" height="40" patternUnits="userSpaceOnUse"><g fill="none" stroke="' + col + '" stroke-width="1.6"><rect x="10" y="10" width="20" height="20"/><rect x="10" y="10" width="20" height="20" transform="rotate(45 20 20)"/><circle cx="20" cy="20" r="4"/><path d="M0 0l10 10M40 0 30 10M0 40l10-10M40 40 30 30"/></g></pattern></defs><rect width="120" height="120" fill="url(#mosp)"/></svg>';
  }
  function setHTML(e, s) { if (e._hh !== s) { e.innerHTML = s; e._hh = s; } }
  function btnState(e, st, lab, C, w) {
    // st 0 عادي، 1 مشغول، 2 تم
    const s = st === 2 ? ico('check', 22, '#fff', 2.6) + '<span>' + (lab[2] || 'تم') + '</span>' : st === 1 ? '<i style="width:20px;height:20px;border-radius:50%;border:3px solid rgba(255,255,255,.35);border-top-color:#fff;display:inline-block"></i><span>' + (lab[1] || 'لحظة…') + '</span>' : (lab[3] ? ico(lab[3], 22, '#fff', 2) : '') + '<span>' + lab[0] + '</span>';
    setHTML(e, s); sty(e, 'background', st === 2 ? '#2f9e5b' : C.ac);
  }
  function spin(e, lt) { const i = e.querySelector('i'); if (i) i.style.transform = 'rotate(' + (lt * 540 % 360) + 'deg)'; }

  /* ---------- المحرر ---------- */
  function cEditor(S, o) {
    const v = !!o.v, W = v ? 920 : 1240, H = v ? 1180 : 780, c = comp(W, H), e = c.el, C = S.C, b = o.b || {}, sfx = o.sfx || noop;
    e.style.background = '#fff';
    const tb = A(e, 0, 0, W, 76); css(tb, { borderBottom: '1.5px solid #ececf1', background: '#fff' });
    A(tb, W - 62, 18, 40, 40, null, brandSVG('mark', '#111'));
    const nm = A(tb, W - 270, 20, 190, 40); css(nm, { fontFamily: 'var(--mo-fd)', fontSize: '25px', textAlign: 'right', whiteSpace: 'nowrap' }); nm.textContent = 'إعلان اللقاء';
    const dl = pill(tb, 18, 16, 150, 46, 'تنزيل', { ic: 'download', bg: C.ac, fs: 19 });
    pill(tb, 180, 16, 96, 46, 'حفظ', { bg: '#fff', fg: '#222', bd: '1.5px solid #dcdce4', fs: 19 });
    if (!v) { pill(tb, 288, 16, 118, 46, 'النشر', { ic: 'send', bg: '#fff', fg: '#222', bd: '1.5px solid #dcdce4', fs: 19, is: 20 }); A(tb, 430, 22, 34, 34, null, ico('share', 26, '#555')); }
    const cvR = v ? { x: 0, y: 76, w: W, h: 610 } : { x: 0, y: 76, w: W - 88 - 350, h: H - 76 };
    const cv = A(e, cvR.x, cvR.y, cvR.w, cvR.h); css(cv, { background: '#f1f1f5' });
    const ph = v ? 540 : 600, pw = ph * 0.8, px = cvR.x + (cvR.w - pw) / 2, py = cvR.y + (cvR.h - ph) / 2;
    const ps = poster(e, px, py, pw, ph, { lay: 'panel', c: IDS[0].c, title: '', sub: 'أ. خالد العمر' });
    const u = pw / 100;
    // لوحة الأدوات
    const rail = [['content', 'المحتوى'], ['grid', 'القوالب'], ['image', 'الصور'], ['shapes', 'العناصر'], ['palette', 'الألوان']];
    let pnl, railEls = [], F = {};
    if (!v) {
      const rl = A(e, W - 88, 76, 88, H - 76); css(rl, { borderRight: '0', background: '#fff' });
      rail.forEach(function (r, i) { const it = A(rl, 8, 14 + i * 86, 72, 76, null, '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;padding-top:10px">' + ico(r[0], 28, 'currentColor') + '<span style="font-size:14px">' + r[1] + '</span></div>'); css(it, { borderRadius: '16px', color: '#444' }); railEls.push(it); });
      pnl = A(e, W - 88 - 350, 76, 350, H - 76); css(pnl, { borderLeft: '1.5px solid #ececf1', borderRight: '1.5px solid #ececf1', background: '#fff' });
      F = { x: 24, w: 302, t: 24, desc: 70, l1: 130, f1: 162, l2: 250, f2: 282, l3: 372, sw: 408 };
    } else {
      pnl = A(e, 0, 676, W, H - 676); css(pnl, { background: '#fff', borderRadius: '34px 34px 0 0', boxShadow: '0 -12px 40px rgba(0,0,0,.12)' });
      A(pnl, W / 2 - 30, 10, 60, 6).style.cssText += ';background:#d6d6de;border-radius:6px';
      rail.forEach(function (r, i) { const it = A(pnl, W - 30 - (i + 1) * 172 + 12, 28, 160, 70, null, '<div style="display:flex;align-items:center;justify-content:center;gap:8px;height:100%">' + ico(r[0], 26, 'currentColor') + '<span style="font-size:20px">' + r[1] + '</span></div>'); css(it, { borderRadius: '18px', color: '#444' }); railEls.push(it); });
      F = { x: 30, w: W - 60, t: -999, desc: -999, l1: 122, f1: 154, l2: 236, f2: 268, l3: 356, sw: 392 };
    }
    const pg1 = A(pnl, 0, 0, v ? W : 350, v ? H - 676 : H - 76), pg2 = A(pnl, 0, 0, v ? W : 350, v ? H - 676 : H - 76);
    if (!v) { const t = A(pg1, F.x, F.t, F.w, 44); css(t, { fontFamily: 'var(--mo-fd)', fontSize: '30px', textAlign: 'right' }); t.textContent = 'المحتوى'; const d = A(pg1, F.x, F.desc, F.w, 50, 'mo-lbl'); d.textContent = 'ما تتركه فارغًا لا يظهر في التصميم'; }
    A(pg1, F.x, F.l1, F.w, 30, 'mo-lbl').textContent = 'العنوان';
    const f1 = A(pg1, F.x, F.f1, F.w, 64, 'mo-fld'); css(f1, { fontSize: '24px' });
    A(pg1, F.x, F.l2, F.w, 30, 'mo-lbl').textContent = 'المقدّم';
    const f2 = A(pg1, F.x, F.f2, F.w, 64, 'mo-fld'); css(f2, { fontSize: '24px' }); f2.textContent = 'أ. خالد العمر';
    A(pg1, F.x, F.l3, F.w, 30, 'mo-lbl').textContent = 'ألوان الهوية';
    const sws = IDS.map(function (d, i) { const s = A(pg1, F.x + F.w - 46 - i * 54, F.sw, 44, 44); css(s, { borderRadius: '50%', background: d.c[0], boxShadow: 'inset 0 0 0 3px rgba(255,255,255,.6)' }); return s; });
    const swr = A(pg1, 0, F.sw - 6, 56, 56); css(swr, { borderRadius: '50%', border: '3px solid ' + C.ac });
    // صفحة العناصر
    { const t = A(pg2, F.x, v ? 118 : 24, F.w, 44); css(t, { fontFamily: 'var(--mo-fd)', fontSize: '30px', textAlign: 'right' }); t.textContent = 'العناصر'; }
    const tiles = [['quote', 'آية أو حديث', PAL.te], ['qr', 'رمز QR', C.ac], ['star', 'أيقونة', PAL.or], ['image', 'صورة', PAL.pl]].map(function (q, i) {
      const tw = (F.w - 16) / 2, tx = F.x + F.w - tw - (i % 2) * (tw + 16), ty = (v ? 180 : 90) + Math.floor(i / 2) * 150;
      const tl = A(pg2, tx, ty, tw, 134, null); css(tl, { borderRadius: '20px', background: rgba(q[2], 0.08), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#222', fontSize: '20px' });
      tl.innerHTML = ico(q[0], 40, q[2], 2) + '<span>' + q[1] + '</span>'; return tl;
    });
    // التحديد والسحب والإرشاد
    const subR = { x: px + 6 * u, y: py + ph * 0.47 + 31 * u, w: 88 * u, h: 8 * u };
    const sel = A(e, subR.x - 8, subR.y - 6, subR.w + 16, subR.h + 12); css(sel, { border: '2.5px solid ' + C.ac, borderRadius: '6px' });
    [[-7, -7], [subR.w + 9, -7], [-7, subR.h + 5], [subR.w + 9, subR.h + 5]].forEach(function (q) { const hd = A(sel, q[0] - 2, q[1] - 2, 14, 14); css(hd, { background: '#fff', border: '2.5px solid ' + C.ac, borderRadius: '4px' }); });
    const gH = A(e, px - 30, 0, pw + 60, 0); css(gH, { borderTop: '2px dashed ' + PAL.rd });
    const gV = A(e, px + pw / 2, py - 20, 0, ph + 40); css(gV, { borderLeft: '2px dashed ' + PAL.rd });
    const qr = A(e, px + 6 * u, py + ph - 33 * u, 20 * u, 20 * u, null, qrSVG(9, '#111')); css(qr, { borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,.2)' });
    const shine = A(e, px, py, pw * 0.4, ph); css(shine, { background: 'linear-gradient(100deg,rgba(255,255,255,0),rgba(255,255,255,.75),rgba(255,255,255,0))' });
    const toast = A(e, (cvR.w - 340) / 2, cvR.y + cvR.h - 86, 340, 58, 'mo-pill', ico('check', 24, '#fff', 2.6) + '<span>نُزِّل بجودته الكاملة</span>'); css(toast, { background: '#111', color: '#fff', fontSize: '20px' });
    // المؤشر
    const text = o.text || 'لقاء الأسرة التربوي';
    const ctr = function (el2, dx, dy) { return [parseFloat(el2.style.left) + (dx || 0), parseFloat(el2.style.top) + (dy || 0)]; };
    const off = function (q) { return [q[0] + parseFloat(pnl.style.left), q[1] + parseFloat(pnl.style.top)]; };
    const keys = [], start = [W * 0.55, H * 0.8];
    const fk = off(ctr(f1, F.w * 0.4, 32)), sk = off(ctr(sws[1], 22, 22)), dk = [subR.x + subR.w * 0.5, subR.y + subR.h * 0.5];
    const rk = v ? off(ctr(railEls[3], 80, 35)) : [W - 44, 76 + 14 + 3 * 86 + 38], tk = off(ctr(tiles[1], (F.w - 16) / 4, 67)), dlk = ctr(dl, 75, 23);
    const t0 = Math.min.apply(null, [b.type && b.type[0], b.col, b.sel, b.add, b.dl].filter(function (x) { return x != null; })) - 0.9;
    keys.push([t0, start[0], start[1]]);
    if (b.type) keys.push([b.type[0] - 0.1, fk[0], fk[1], 1]);
    if (b.col != null) keys.push([b.col, sk[0], sk[1], 1]);
    if (b.sel != null) { keys.push([b.sel, dk[0], dk[1], 1]); keys.push([b.sel + 1.1, dk[0], dk[1] - 46, 0, 0.7]); }
    if (b.add != null) { keys.push([b.add, rk[0], rk[1], 1]); keys.push([b.add + 0.9, tk[0], tk[1], 1]); }
    if (b.dl != null) keys.push([b.dl, dlk[0], dlk[1], 1]);
    const cur = Cursor(e, keys, sfx, { color: C.ac });
    if (b.type) sfx(b.type[0], 'type', { d: b.type[1] - b.type[0], r: text.length / (b.type[1] - b.type[0]) });
    if (b.col != null) sfx(b.col + 0.05, 'shimmer', { f: 1568, v: 0.05 });
    if (b.sel != null) { sfx(b.sel + 0.4, 'swish', { d: 0.5, v: 0.18 }); sfx(b.sel + 1.12, 'pop', { p: 0.8, v: 0.3 }); }
    if (b.add != null) sfx(b.add + 1.0, 'pop', { p: 1.2 });
    if (b.dl != null) { sfx(b.dl + 0.85, 'chime', {}); sfx(b.dl + 0.85, 'swish', { d: 0.45, v: 0.16, pa: -0.6, pb: 0.6 }); }
    c.up = function (lt) {
      const ty = b.type ? typed(text, lt, b.type[0], b.type[1]) : '';
      const typing = b.type && lt >= b.type[0] - 0.1 && lt < (b.col != null ? b.col - 0.3 : b.type[1] + 1.2);
      const blink = Math.floor(lt * 2.2) % 2 === 0;
      setHTML(f1, (ty || (b.type && lt < b.type[0] ? '' : text)) + (typing && (blink || lt < b.type[1]) ? caret(C.ac) : ''));
      sty(f1, 'borderColor', typing ? C.ac : '#e3e3ea');
      const pt = b.type ? (lt < b.type[0] ? '' : ty || text) : text;
      setHTML(ps.title, pt ? pt + (typing && lt < b.type[1] ? caret('#fff') : '') : '<span style="opacity:.45">العنوان الرئيسي</span>');
      // الألوان
      const cp = b.col != null ? E.io3(P(lt, b.col + 0.05, 0.6)) : 0;
      ps.mixTo(IDS[0].c, IDS[1].c, cp);
      T(swr, { x: parseFloat(sws[0].style.left) - 6 + (parseFloat(sws[1].style.left) - parseFloat(sws[0].style.left)) * E.o5(P(lt, b.col == null ? 1e9 : b.col, 0.45)) });
      // التحديد والسحب
      const sOn = b.sel != null ? P(lt, b.sel, 0.15) * (1 - P(lt, b.sel + 2.0, 0.3)) : 0, dy = b.sel != null ? -46 * E.io3(P(lt, b.sel + 0.4, 0.7)) : 0;
      T(sel, { y: dy, o: sOn, s: 0.96 + 0.04 * E.o3(P(lt, b.sel || 0, 0.25)) }); T(ps.sub, { y: dy });
      const gOn = b.sel != null ? P(lt, b.sel + 0.35, 0.1) * (1 - P(lt, b.sel + 1.25, 0.2)) : 0;
      gH.style.top = (subR.y + subR.h / 2 + dy) + 'px'; T(gH, { o: gOn }); T(gV, { o: gOn * 0.8 });
      // العناصر
      const ap = b.add != null ? P(lt, b.add + 0.05, 0.3) * (1 - P(lt, b.add + 1.9, 0.3)) : 0;
      T(pg1, { o: 1 - ap, x: ap * 30 }); T(pg2, { o: ap, x: (1 - ap) * -30 });
      const act = ap > 0.5 ? 3 : 0;
      railEls.forEach(function (r, i) { sty(r, 'background', i === act ? C.ac : 'transparent'); sty(r, 'color', i === act ? '#fff' : '#444'); });
      tiles.forEach(function (tl, i) { const q = E.spr(P(lt, (b.add || 0) + 0.15 + i * 0.06, 0.6)); T(tl, { s: 0.7 + 0.3 * q, o: P(lt, (b.add || 0) + 0.15 + i * 0.06, 0.15) }); });
      if (b.add != null) { const q = E.spr(P(lt, b.add + 1.0, 0.7)); T(qr, { s: q, o: P(lt, b.add + 1.0, 0.1), r: (1 - q) * -20 }); } else T(qr, { o: 0 });
      // التنزيل
      if (b.dl != null) {
        const st = lt < b.dl + 0.05 ? 0 : lt < b.dl + 0.8 ? 1 : 2; btnState(dl, st, ['تنزيل', 'يُجهَّز…', 'تم', 'download'], C); spin(dl, lt);
        const sp = P(lt, b.dl + 0.8, 0.7); T(shine, { x: lerp(pw * 1.1, -pw * 0.6, E.io3(sp)), o: sp > 0 && sp < 1 ? 1 : 0 });
        const tp = E.spr(P(lt, b.dl + 0.85, 0.6)) * (1 - P(lt, b.dl + 2.6, 0.3)); T(toast, { y: (1 - tp) * 40, o: P(lt, b.dl + 0.85, 0.15) * (1 - P(lt, b.dl + 2.6, 0.3)) });
      } else { T(shine, { o: 0 }); T(toast, { o: 0 }); }
      cur.up(lt);
    };
    return c;
  }

  /* ---------- اصنع إعلانك ---------- */
  function cMake(S, o) {
    const v = !!o.v, W = v ? 920 : 1200, H = v ? 1180 : 820, c = { el: h('div'), w: W, h: H }, e = c.el, C = S.C, b = o.b || {}, sfx = o.sfx || noop;
    const pc = A(e, 0, 0, W, v ? 420 : 340, 'mo-card');
    const bd = pill(pc, W - 32 - 240, 30, 240, 50, 'المصمّم الذكي', { ic: 'sparkles', bg: C.t1, fg: C.ac, fs: 21, is: 24 });
    const ttl = A(pc, 32, 96, W - 64, 56); css(ttl, { fontFamily: 'var(--mo-fd)', fontSize: '42px', textAlign: 'right', fontWeight: '700' }); ttl.textContent = 'اصنع إعلانك';
    const ta = A(pc, 32, 168, W - 64, v ? 150 : 100, 'mo-fld'); css(ta, { fontSize: '27px', alignItems: 'flex-start', paddingTop: '18px', whiteSpace: 'normal', lineHeight: '1.6' });
    const go = A(pc, 32, v ? 336 : 282, 210, 54, 'mo-pill'); css(go, { fontSize: '21px', color: '#fff', overflow: 'hidden' });
    const shm = A(go, -120, 0, 100, 54); css(shm, { background: 'linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.45),rgba(255,255,255,0))' });
    const qc = A(e, 0, v ? 444 : 362, W, v ? 150 : 96, 'mo-card');
    const ql = A(qc, 32, v ? 22 : 26, v ? W - 64 : 460, 44); css(ql, { fontFamily: 'var(--mo-fd)', fontSize: '29px', textAlign: 'right', whiteSpace: 'nowrap' }); ql.textContent = 'ما الطابع الذي تريده؟';
    const chips = ['هادئ', 'جريء', 'احتفالي'].map(function (s, i) { const x = v ? W - 32 - (i + 1) * 180 + 10 : 32 + (2 - i) * 170; return pill(qc, x, v ? 80 : 22, 160, 52, s, { bg: '#f1f1f5', fg: '#222', fs: 22 }); });
    const ry = v ? 620 : 482, pw = v ? 268 : 236, phh = pw * 1.25, col = W / 3;
    const lays = ['circle', 'bold', 'arch'], labs = ['هادئ', 'جريء', 'احتفالي'];
    const res = lays.map(function (l, i) {
      const x = W - (i + 1) * col + (col - pw) / 2, p = poster(e, x, ry, pw, phh, { lay: l, c: IDS[2].c, title: 'لقاء الأسرة التربوي', sub: 'الخميس ٨:٠٠ مساءً', g: 'ن' });
      const lb = A(e, x, ry + phh + 14, pw, 34); css(lb, { textAlign: 'center', fontSize: '22px', color: '#444' }); lb.textContent = 'اتجاه ' + ar(i + 1) + ' · ' + labs[i];
      return { p: p, lb: lb, x: x };
    });
    const ring = A(e, 0, ry - 10, pw + 20, phh + 20); css(ring, { border: '5px solid ' + C.ac, borderRadius: '22px' });
    const chk = A(e, 0, ry - 26, 52, 52, null, '<div style="width:100%;height:100%;border-radius:50%;display:grid;place-items:center;background:' + C.ac + '">' + ico('check', 30, '#fff', 3) + '</div>');
    const text = o.text || 'لقاء الأسرة التربوي يوم الخميس الساعة الثامنة مساءً عبر زوم';
    const pick = o.pick == null ? 1 : o.pick;
    const keys = [[(b.type ? b.type[0] : 0) - 0.8, W * 0.3, H * 0.6]];
    if (b.type) keys.push([b.type[0] - 0.1, W * 0.55, 168 + 40, 1]);
    if (b.go != null) keys.push([b.go, 32 + 105, (v ? 336 : 282) + 27, 1]);
    if (b.q != null) keys.push([b.q + 0.7, parseFloat(chips[1].style.left) + 80, (v ? 444 + 80 : 362 + 22) + 26, 1]);
    if (b.pick != null) keys.push([b.pick, res[pick].x + pw / 2, ry + phh * 0.5, 1]);
    const cur = Cursor(e, keys, sfx, { color: C.ac });
    if (b.type) sfx(b.type[0], 'type', { d: b.type[1] - b.type[0], r: text.length / (b.type[1] - b.type[0]) * 0.6 });
    if (b.go != null) sfx(b.go + 0.1, 'riser', { d: (b.res || b.go + 1) - b.go - 0.1, v: 0.18 });
    if (b.q != null) sfx(b.q, 'pop', { p: 0.9, v: 0.3 });
    if (b.res != null) { res.forEach(function (r, i) { sfx(b.res + i * 0.14, 'pop', { p: 1 + i * 0.18 }); }); sfx(b.res, 'whoosh', { d: 0.5, v: 0.35 }); }
    if (b.pick != null) sfx(b.pick + 0.05, 'shimmer', { f: 1320, v: 0.06 });
    c.up = function (lt) {
      const tp = b.type ? typed(text, lt, b.type[0], b.type[1]) : text;
      const typing = b.type && lt >= b.type[0] - 0.1 && lt < (b.go || 99) - 0.1;
      setHTML(ta, (tp || (b.type && lt < b.type[0] - 0.1 ? '<span style="color:#9a9aa6">اكتب فكرة إعلانك بكلماتك…</span>' : '')) + (typing ? caret(C.ac) : ''));
      sty(ta, 'borderColor', typing ? C.ac : '#e3e3ea');
      const busy = b.go != null && lt > b.go && lt < (b.res || 99);
      setHTML(go, (busy ? '<span style="position:relative">يصمّم لك…</span>' : ico('sparkles', 24, '#fff', 2) + '<span>صمّم لي</span>'));
      if (busy) { if (!go.contains(shm)) go.appendChild(shm); T(shm, { x: ((lt - b.go) * 260) % 330 }); }
      sty(go, 'background', C.ac);
      const qp = b.q != null ? E.o5(P(lt, b.q, 0.6)) : (b.res != null ? 1 : 0);
      T(qc, { y: (1 - qp) * 30, o: qp, b: (1 - qp) * 8 });
      chips.forEach(function (ch, i) { const on = b.q != null && i === 1 && lt > b.q + 0.75; sty(ch, 'background', on ? C.ac : '#f1f1f5'); sty(ch, 'color', on ? '#fff' : '#222'); T(ch, { s: on && lt < b.q + 0.95 ? 0.94 : 1 }); });
      res.forEach(function (r, i) {
        const a = (b.res == null ? -1 : b.res) + i * 0.14, p = E.spr(P(lt, a, 0.9)), q = P(lt, a, 0.2);
        const pk = b.pick != null ? E.o5(P(lt, b.pick, 0.5)) : 0, me = i === pick;
        T(r.p.e, { y: (1 - p) * -260, x: (1 - p) * (i - 1) * -120, r: (1 - p) * (i - 1) * 14, s: (0.6 + 0.4 * p) * (me ? 1 + 0.05 * pk : 1 - 0.05 * pk), o: q * (me ? 1 : 1 - 0.55 * pk) });
        T(r.lb, { o: P(lt, a + 0.3, 0.3) * (me ? 1 : 1 - 0.5 * pk) });
      });
      const pk = b.pick != null ? P(lt, b.pick, 0.3) : 0, rx = res[pick].x - 10;
      ring.style.left = rx + 'px'; T(ring, { o: pk, s: 1.05 + 0.05 * (1 - E.o5(P(lt, b.pick || 0, 0.5))) });
      chk.style.left = (res[pick].x + pw - 30) + 'px'; T(chk, { s: E.spr(P(lt, (b.pick || 0) + 0.1, 0.6)), o: pk });
      cur.up(lt);
    };
    return c;
  }

  /* ---------- النص المصاحب ---------- */
  function cCaption(S, o) {
    const W = 720, H = 680, c = comp(W, H), e = c.el, C = S.C, b = o.b || {}, sfx = o.sfx || noop;
    icTile(e, W - 32 - 64, 28, 64, 'sparkles', C.ac);
    const t = A(e, 120, 30, W - 32 - 64 - 16 - 120, 60); css(t, { fontFamily: 'var(--mo-fd)', fontSize: '34px', textAlign: 'right', fontWeight: '700', lineHeight: '60px' }); t.textContent = 'النص المصاحب';
    pill(e, 32, 38, 200, 44, 'يكتبه المساعد', { bg: C.t1, fg: C.ac, fs: 18 });
    const box = A(e, 32, 116, W - 64, 330, 'mo-fld'); css(box, { alignItems: 'flex-start', padding: '22px 24px', whiteSpace: 'pre-wrap', fontSize: '25px', lineHeight: '1.75', display: 'block' });
    const cap = o.text || '📌 لقاء الأسرة التربوي\n🗓 الخميس — الثامنة مساءً\n📍 عبر زوم\nشاركونا… فالأثر يبدأ من البيت 🌿';
    const tol = A(e, 32, 470, W - 64, 64); css(tol, { display: 'flex', alignItems: 'center', gap: '14px', fontSize: '22px', color: '#555' });
    tol.innerHTML = '<span>إلى:</span>';
    const sel = h('div', 'mo-fld', tol); css(sel, { height: '60px', flex: '1', fontSize: '22px', justifyContent: 'space-between' });
    sel.innerHTML = '<span style="display:flex;align-items:center;gap:10px"><i style="width:34px;height:34px;border-radius:50%;background:' + C.ac + ';display:inline-block"></i>قناة البرنامج</span>' + ico('up', 22, '#777').replace('<svg', '<svg style="transform:rotate(180deg)"');
    const dd = A(e, 32 + 60, 540, W - 64 - 60, 132, 'mo-card'); css(dd, { borderRadius: '18px', zIndex: '5' });
    ['قناة البرنامج', 'قناة أولياء الأمور'].forEach(function (s, i) { const r = A(dd, 0, i * 66, W - 124, 66); css(r, { display: 'flex', alignItems: 'center', gap: '12px', padding: '0 20px', fontSize: '21px', borderTop: i ? '1px solid #eee' : '' }); r.innerHTML = '<i style="width:30px;height:30px;border-radius:50%;background:' + (i ? PAL.te : C.ac) + ';display:inline-block"></i><span style="flex:1">' + s + '</span>' + (i ? '' : ico('check', 24, C.ac, 2.6)); });
    const send = A(e, 32, H - 92, 220, 60, 'mo-pill'); css(send, { fontSize: '22px', color: '#fff' });
    const schB = pill(e, 268, H - 92, 160, 60, 'جدوِل', { ic: 'clock', bg: '#fff', fg: '#222', bd: '1.5px solid #dcdce4', fs: 22, is: 24 });
    const schC = pill(e, 444, H - 88, 244, 52, 'الخميس ٧:٠٠ م', { ic: 'cal', bg: rgba(PAL.or, 0.12), fg: '#b75a12', fs: 20, is: 22 });
    const sendAt = b.send, keys = [[(b.type ? b.type[0] : 0) - 0.6, W * 0.5, H * 0.3]];
    if (b.pick != null) { keys.push([b.pick, W * 0.5, 502, 1]); keys.push([b.pick + 0.7, W * 0.5, 572, 1]); }
    if (b.sch != null) keys.push([b.sch, 268 + 80, H - 62, 1]);
    if (sendAt != null) keys.push([sendAt, 32 + 110, H - 62, 1]);
    const cur = keys.length > 1 ? Cursor(e, keys, sfx, { color: C.ac }) : null;
    if (b.type) sfx(b.type[0], 'type', { d: b.type[1] - b.type[0], r: 16, v: 0.16 });
    if (b.sch != null) sfx(b.sch + 0.1, 'pop', { p: 0.9 });
    if (sendAt != null) { sfx(sendAt + 0.7, 'chime', { v: 0.16 }); }
    c.up = function (lt) {
      const tp = b.type ? typed(cap, lt, b.type[0], b.type[1]) : cap, typing = b.type && lt >= b.type[0] && lt < b.type[1] + 0.4;
      setHTML(box, tp.replace(/&/g, '&amp;').replace(/</g, '&lt;') + (typing ? caret(C.ac) : ''));
      sty(box, 'borderColor', typing ? C.ac : '#e3e3ea');
      const dp = b.pick != null ? P(lt, b.pick + 0.05, 0.2) * (1 - P(lt, b.pick + 0.75, 0.2)) : 0; T(dd, { o: dp, y: (1 - dp) * -12 });
      const st = sendAt == null || lt < sendAt + 0.05 ? 0 : lt < sendAt + 0.7 ? 1 : 2; btnState(send, st, ['أرسل الآن', 'يُرسل…', 'أُرسل', 'send'], C); spin(send, lt);
      const sp = b.sch != null ? E.spr(P(lt, b.sch + 0.1, 0.6)) : 0; T(schC, { s: 0.6 + 0.4 * sp, o: b.sch != null ? P(lt, b.sch + 0.1, 0.12) : 0 });
      sty(schB, 'borderColor', b.sch != null && lt > b.sch ? PAL.or : '#dcdce4');
      if (cur) cur.up(lt);
    };
    return c;
  }

  /* ---------- قناة تليجرام (محاكاة) ---------- */
  function cTG(S, o) {
    const W = 560, H = 1000, c = comp(W, H), e = c.el, C = S.C, b = o.b || {}, sfx = o.sfx || noop;
    css(e, { borderRadius: '52px', background: '#dfe7ee' });
    const bg = A(e, 0, 0, W, H); css(bg, { background: 'radial-gradient(circle at 20% 30%,' + rgba(C.ac, 0.12) + ',transparent 50%),radial-gradient(circle at 80% 70%,' + rgba(PAL.te, 0.12) + ',transparent 50%),#e6ebf1' });
    const hd = A(e, 0, 0, W, 112); css(hd, { background: 'rgba(255,255,255,.96)', borderBottom: '1px solid #dde' });
    const av = A(hd, W - 96, 30, 64, 64, null, brandSVG('mark', C.ac));
    const nm = A(hd, 120, 34, W - 236, 34); css(nm, { fontFamily: 'var(--mo-fd)', fontSize: '26px', textAlign: 'right', fontWeight: '700', whiteSpace: 'nowrap' }); nm.textContent = 'قناة البرنامج';
    const sub = A(hd, 120, 70, W - 236, 26); css(sub, { fontSize: '18px', color: '#7a7a86', textAlign: 'right' }); sub.textContent = '١٬٢٤٠ مشتركًا';
    const old = A(e, 120, 140, W - 150, 74); css(old, { background: '#fff', borderRadius: '22px 22px 6px 22px', padding: '14px 20px', fontSize: '21px', boxShadow: '0 1px 2px rgba(0,0,0,.08)' }); old.textContent = 'تذكير: المسابقة غدًا بعد العصر 🌙';
    const chip = A(e, W / 2 - 150, 236, 300, 44, 'mo-pill', ico('clock', 20, '#fff', 2) + '<span>' + (o.when || 'الخميس ٧:٠٠ م') + '</span>'); css(chip, { background: 'rgba(40,50,70,.45)', color: '#fff', fontSize: '18px' });
    const bub = A(e, 40, 300, W - 70, 620); css(bub, { background: '#fff', borderRadius: '24px 24px 6px 24px', boxShadow: '0 2px 6px rgba(0,0,0,.1)', overflow: 'hidden', transformOrigin: '100% 100%' });
    const pp = poster(bub, 8, 8, W - 86, (W - 86) * 0.8, { lay: o.lay || 'panel', c: o.c || IDS[1].c, title: 'لقاء الأسرة التربوي', flat: 1, g: 'ب' }); pp.e.style.borderRadius = '18px';
    const ct = A(bub, 22, (W - 86) * 0.8 + 22, W - 114, 150); css(ct, { fontSize: '20px', lineHeight: '1.6', whiteSpace: 'pre-wrap', textAlign: 'right' }); ct.textContent = '📌 لقاء الأسرة التربوي\n🗓 الخميس — الثامنة مساءً · 📍 عبر زوم';
    const mt = A(bub, 18, 576, W - 106, 30); css(mt, { display: 'flex', gap: '14px', justifyContent: 'flex-start', fontSize: '17px', color: '#8a8a96', direction: 'ltr' });
    const ft = A(e, 0, H - 84, W, 84); css(ft, { background: 'rgba(255,255,255,.96)', display: 'grid', placeItems: 'center', fontSize: '22px', color: C.ac, fontWeight: '600' }); ft.textContent = 'كتم الإشعارات';
    if (b.msg != null) { sfx(b.msg, 'swish', { d: 0.4, v: 0.25, pa: 0, pb: 0 }); sfx(b.msg + 0.12, 'pop', { p: 0.85, v: 0.45 }); }
    if (b.sch != null) sfx(b.sch, 'tick', { v: 0.18 });
    c.up = function (lt) {
      const cp = b.sch != null ? E.o5(P(lt, b.sch, 0.5)) : (b.msg != null ? P(lt, b.msg - 0.3, 0.3) : 1); T(chip, { o: cp, y: (1 - cp) * -16 });
      const mp = b.msg != null ? E.spr(P(lt, b.msg, 0.8)) : 1; T(bub, { y: (1 - mp) * 220, s: 0.8 + 0.2 * mp, o: b.msg != null ? P(lt, b.msg, 0.12) : 1 });
      const vw = Math.round(320 * E.o3(P(lt, (b.msg || 0) + 0.8, 2.2)));
      setHTML(mt, '<span>٨:٠١ م</span><span>👁 ' + ar(vw) + '</span>');
    };
    return c;
  }

  /* ---------- التقويم والمهام ---------- */
  function cCal(S, o) {
    const v = !!o.v, W = v ? 920 : 1200, H = v ? 1180 : 820, c = comp(W, H), e = c.el, C = S.C, b = o.b || {}, sfx = o.sfx || noop;
    const tt = A(e, 32, 26, 420, 52); css(tt, { fontFamily: 'var(--mo-fd)', fontSize: '40px', fontWeight: '700', textAlign: 'right', right: '32px', left: 'auto' }); tt.textContent = 'أكتوبر ٢٠٢٦';
    const hj = A(e, 32, 80, 520, 30, 'mo-lbl'); css(hj, { right: '32px', left: 'auto', textAlign: 'right' }); hj.textContent = 'ربيع الآخر – جمادى الأولى ١٤٤٨ هـ';
    const tabs = ['شهر', 'أسبوع', 'يوم', 'القادم'], tw = v ? 96 : 104, seg = A(e, 32, 32, tw * 4 + 8, 58); css(seg, { background: '#f0f0f5', borderRadius: '99px' });
    const ind = A(seg, 4, 4, tw, 50); css(ind, { background: '#fff', borderRadius: '99px', boxShadow: '0 2px 8px rgba(0,0,0,.1)' });
    const tabEls = tabs.map(function (s, i) { const t = A(seg, 4 + (3 - i) * tw, 4, tw, 50); css(t, { display: 'grid', placeItems: 'center', fontSize: '20px', fontWeight: '600' }); t.textContent = s; return t; });
    const gy = 130, gh = v ? 640 : H - gy - 10, cw = W / 7, rh = (gh - 44) / 6, off = 5;
    const days = ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'];
    const grid = A(e, 0, gy, W, gh);
    days.forEach(function (d, i) { const x = W - (i + 1) * cw; const t = A(grid, x, 0, cw, 40); css(t, { textAlign: 'center', color: '#8a8a96', fontSize: '19px' }); t.textContent = d; });
    const cell = function (d) { const idx = d - 1 + off, r = Math.floor(idx / 7), col = idx % 7; return { x: W - (col + 1) * cw, y: 44 + r * rh }; };
    for (let d = 1; d <= 31; d++) {
      const p = cell(d), ce = A(grid, p.x + 3, p.y + 3, cw - 6, rh - 6); css(ce, { borderRadius: '14px', background: '#fafafc', border: '1px solid #f0f0f4' });
      const n = A(ce, 0, 6, cw - 18, 30); css(n, { textAlign: 'right', fontSize: '19px', color: (d - 1 + off) % 7 === 6 ? PAL.or : '#333', right: '10px', left: 'auto', width: 'auto' });
      if (d === 24) { n.innerHTML = '<b style="display:inline-grid;place-items:center;width:34px;height:34px;border-radius:50%;background:' + C.ac + ';color:#fff;font-weight:600">' + ar(d) + '</b>'; } else n.textContent = ar(d);
    }
    const evs = [[8, 'لقاء الأسرة', C.ac], [12, 'مسابقة الحفظ', PAL.or], [15, 'تصميم الملتقى', PAL.te], [19, 'ملتقى الشباب', PAL.pl], [22, 'منشور مجدول', C.ac], [27, 'حفل التكريم', PAL.bl], [29, 'ورشة الإلقاء', PAL.gr]];
    const evEls = evs.map(function (q) { const p = cell(q[0]), ch = A(grid, p.x + 8, p.y + 42, cw - 16, v ? 30 : 32); css(ch, { borderRadius: '9px', background: rgba(q[2], 0.14), color: q[2], fontSize: v ? '14px' : '16px', fontWeight: '600', padding: '0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: (v ? 30 : 32) + 'px', borderRight: '4px solid ' + q[2] }); ch.textContent = q[1]; return ch; });
    const tgt = cell(14), src = cell(12), hi = A(grid, tgt.x + 3, tgt.y + 3, cw - 6, rh - 6); css(hi, { borderRadius: '14px', border: '3px dashed ' + PAL.or, background: rgba(PAL.or, 0.06) });
    // عرض الأسبوع
    const wk = A(e, 0, gy, W, gh); css(wk, { background: '#fff' });
    days.forEach(function (d, i) { const x = W - (i + 1) * cw; const t = A(wk, x, 0, cw, 40); css(t, { textAlign: 'center', color: '#8a8a96', fontSize: '19px' }); t.textContent = d + ' ' + ar(24 + i <= 31 ? 24 + i : i - 7); });
    for (let r = 0; r < 7; r++) { const l = A(wk, 0, 50 + r * ((gh - 60) / 7), W, 1); css(l, { background: '#eee' }); }
    [[0, 1, 2.2, 'لقاء الأسرة', C.ac], [2, 3, 1.4, 'ورشة', PAL.te], [4, 0.5, 2, 'منشور', PAL.or], [5, 4, 2, 'مسابقة', PAL.pl]].forEach(function (q) { const x = W - (q[0] + 1) * cw, y = 50 + q[1] * ((gh - 60) / 7), bl = A(wk, x + 6, y + 4, cw - 12, q[2] * ((gh - 60) / 7) - 8); css(bl, { background: rgba(q[4], 0.15), borderRight: '5px solid ' + q[4], borderRadius: '10px', color: q[4], fontSize: '17px', fontWeight: '600', padding: '8px' }); bl.textContent = q[3]; });
    // المهام
    const tk = v ? A(e, 0, 800, W, 380, 'mo-card') : A(e, 24, 360, 430, 400, 'mo-card');
    const tkw = v ? W : 430;
    const tkt = A(tk, 28, 22, tkw - 56, 44); css(tkt, { fontFamily: 'var(--mo-fd)', fontSize: '30px', fontWeight: '700', textAlign: 'right' }); tkt.textContent = 'المهام';
    const tasks = [['تصميم إعلان المسابقة', 'من المشرف'], ['كتابة النص المصاحب', ''], ['جدولة النشر في القناة', '']];
    const trs = tasks.map(function (q, i) {
      const r = A(tk, 28, 86 + i * (v ? 92 : 98), tkw - 56, v ? 80 : 84); css(r, { display: 'flex', alignItems: 'center', gap: '16px', borderTop: i ? '1px solid #f0f0f4' : '' });
      const bx = h('div', null, r); css(bx, { width: '34px', height: '34px', borderRadius: '10px', border: '2.5px solid #c9c9d3', flex: 'none', display: 'grid', placeItems: 'center' });
      const tx = h('div', null, r); css(tx, { flex: '1', fontSize: '22px', lineHeight: '1.3' }); tx.innerHTML = q[0] + (q[1] ? '<div style="font-size:16px;color:' + C.ac + '">' + q[1] + '</div>' : '');
      return { bx: bx, tx: tx };
    });
    const rem = A(e, W / 2 - 300, 0, 600, 90, 'mo-card'); css(rem, { borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '16px', padding: '0 22px', zIndex: '8' });
    rem.innerHTML = '<div style="width:52px;height:52px;border-radius:16px;background:' + C.t1 + ';display:grid;place-items:center;flex:none">' + ico('bell', 28, C.ac, 2) + '</div><div style="flex:1;font-size:21px;line-height:1.4"><b style="font-family:var(--mo-fd)">تذكير · بعد ساعة</b><div style="color:#666;font-size:18px">نشر «مسابقة الحفظ» في القناة</div></div>';
    const keys = [];
    if (b.view != null) { keys.push([b.view - 0.8, W * 0.5, H * 0.6]); keys.push([b.view, 4 + (3 - 1) * tw + tw / 2 + 32, 32 + 29, 1]); keys.push([b.view + 1.6, 4 + 3 * tw + tw / 2 + 32, 32 + 29, 1]); }
    if (b.drag != null) { keys.push([b.drag, src.x + cw / 2, gy + src.y + 58, 1]); keys.push([b.drag + 1.0, tgt.x + cw / 2, gy + tgt.y + 58, 0, 0.8]); }
    if (b.tasks != null) [0, 1, 2].forEach(function (i) { const r = trs[i]; keys.push([b.tasks + 0.6 + i * 0.55, parseFloat(tk.style.left) + tkw - 28 - 17, parseFloat(tk.style.top) + 86 + i * (v ? 92 : 98) + 40, 1]); });
    const cur = keys.length ? Cursor(e, keys, sfx, { color: C.ac }) : null;
    if (b.ev != null) evs.forEach(function (q, i) { sfx(b.ev + i * 0.09, 'pop', { p: 0.9 + i * 0.07, v: 0.28 }); });
    if (b.drag != null) { sfx(b.drag + 0.15, 'swish', { d: 0.7, v: 0.2 }); sfx(b.drag + 1.05, 'thud', {}); }
    if (b.tasks != null) [0, 1, 2].forEach(function (i) { sfx(b.tasks + 0.62 + i * 0.55, 'tick', { p: 1 + i * 0.12, v: 0.22 }); });
    if (b.rem != null) { sfx(b.rem, 'chime', { v: 0.18 }); }
    if (b.view != null) { sfx(b.view + 0.05, 'swish', { d: 0.35, v: 0.15 }); sfx(b.view + 1.65, 'swish', { d: 0.35, v: 0.15 }); }
    c.up = function (lt) {
      evEls.forEach(function (ch, i) { const a = (b.ev == null ? -9 : b.ev) + i * 0.09, p = E.spr(P(lt, a, 0.6)); T(ch, { s: 0.5 + 0.5 * p, o: P(lt, a, 0.12) }); });
      // السحب
      if (b.drag != null) {
        const dp = E.io3(P(lt, b.drag + 0.2, 0.8)), lift = P(lt, b.drag, 0.15) * (1 - P(lt, b.drag + 1.0, 0.15));
        T(evEls[1], { x: (tgt.x - src.x) * dp, y: (tgt.y - src.y) * dp - lift * 6, s: (0.5 + 0.5 * E.spr(P(lt, (b.ev == null ? -9 : b.ev) + 0.09, 0.6))) * (1 + 0.08 * lift), r: lift * 3, o: 1 });
        sty(evEls[1], 'boxShadow', lift > 0.05 ? '0 12px 26px rgba(0,0,0,.22)' : 'none');
        T(hi, { o: P(lt, b.drag + 0.3, 0.2) * (1 - P(lt, b.drag + 1.05, 0.25)) });
      } else T(hi, { o: 0 });
      const vw = b.view != null ? P(lt, b.view + 0.05, 0.3) * (1 - P(lt, b.view + 1.65, 0.3)) : 0;
      T(wk, { o: vw, s: 0.97 + 0.03 * vw }); T(grid, { o: 1 - vw });
      sty(ind, 'left', (4 + (3 - (vw > 0.5 ? 1 : 0)) * tw) + 'px');
      tabEls.forEach(function (t, i) { sty(t, 'color', (vw > 0.5 ? i === 1 : i === 0) ? C.ac : '#555'); });
      const tp = b.tasks != null ? E.o5(P(lt, b.tasks, 0.7)) : 0; T(tk, { y: (1 - tp) * 80, o: P(lt, b.tasks == null ? 1e9 : b.tasks, 0.25), b: (1 - tp) * 8 });
      trs.forEach(function (r, i) { const on = b.tasks != null && lt > b.tasks + 0.62 + i * 0.55; sty(r.bx, 'background', on ? '#2f9e5b' : '#fff'); sty(r.bx, 'borderColor', on ? '#2f9e5b' : '#c9c9d3'); setHTML(r.bx, on ? ico('check', 22, '#fff', 3) : ''); sty(r.tx, 'color', on ? '#9a9aa4' : '#1b1b24'); sty(r.tx, 'textDecoration', on ? 'line-through' : 'none'); });
      const rp = b.rem != null ? E.spr(P(lt, b.rem, 0.8)) * (1 - P(lt, b.rem + 2.6, 0.4)) : 0; T(rem, { y: -120 + rp * 140, o: b.rem != null ? P(lt, b.rem, 0.15) * (1 - P(lt, b.rem + 2.6, 0.4)) : 0 });
      if (cur) cur.up(lt);
    };
    return c;
  }

  /* ---------- الشرائح والعروض ---------- */
  function cSlides(S, o) {
    const v = !!o.v, W = v ? 920 : 1240, H = v ? 1180 : 780, c = comp(W, H), e = c.el, C = S.C, b = o.b || {}, sfx = o.sfx || noop;
    e.style.background = '#16161f';
    const sw = v ? 880 : 980, sh = sw * 9 / 16, sx = v ? 20 : W - 20 - sw - 240 + 220, sy = v ? 20 : 26;
    const fx = v ? 20 : 20, mainX = v ? 20 : 20 + 240 + 0;
    const mx = v ? 20 : W - 20 - sw, my = 24;
    const frame = A(e, mx, my, sw, sh); css(frame, { borderRadius: '16px', overflow: 'hidden', background: '#24243a' });
    const mkSlide = function (i) {
      const s = A(frame, 0, 0, sw, sh); css(s, { overflow: 'hidden' });
      if (i === 0) {
        css(s, { background: 'linear-gradient(135deg,' + C.ac + ',' + C.ac2 + ')' });
        const ci = A(s, -sw * 0.15, sh * 0.35, sw * 0.5, sw * 0.5); css(ci, { borderRadius: '50%', background: 'rgba(255,255,255,.08)' });
        const t = A(s, 60, sh * 0.3, sw - 120, null, 'mo-kt'); css(t, { fontSize: (sw * 0.085) + 'px', color: '#fff', textAlign: 'right' }); t.textContent = 'أثرُ القدوة';
        const st = A(s, 60, sh * 0.3 + sw * 0.12, sw - 120, 40); css(st, { fontSize: (sw * 0.03) + 'px', color: 'rgba(255,255,255,.8)', textAlign: 'right' }); st.textContent = 'اللقاء الثالث · برنامج النخبة';
      } else if (i === 1) {
        css(s, { background: '#fff' });
        const t = A(s, 50, 40, sw - 100, null, 'mo-kt'); css(t, { fontSize: (sw * 0.055) + 'px', textAlign: 'right' }); t.textContent = 'ثلاث صفات للقدوة';
        s._b = ['يعمل بما يقول', 'قريبٌ من الناس', 'ثابتٌ على المبدأ'].map(function (q, k) { const r = A(s, 50, 40 + sw * 0.1 + k * sw * 0.075, sw - 100, sw * 0.06); css(r, { display: 'flex', alignItems: 'center', gap: '18px', fontSize: (sw * 0.034) + 'px' }); r.innerHTML = '<b style="width:' + (sw * 0.045) + 'px;height:' + (sw * 0.045) + 'px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:' + (sw * 0.026) + 'px;background:' + [C.ac, PAL.or, PAL.te][k] + '">' + ar(k + 1) + '</b><span>' + q + '</span>'; return r; });
      } else if (i === 2) {
        css(s, { background: '#121220' });
        const eb = A(s, 50, sh * 0.22, sw - 100, 40); css(eb, { color: PAL.or, fontSize: (sw * 0.03) + 'px', textAlign: 'right', fontWeight: '600' }); eb.textContent = 'سؤال للنقاش';
        const t = A(s, 50, sh * 0.34, sw - 100, null, 'mo-kt'); css(t, { fontSize: (sw * 0.062) + 'px', color: '#fff', textAlign: 'right' }); t.textContent = 'ما الذي يجعل القدوة مؤثّرة؟';
        const tm = A(s, 50, sh - 90, 200, 50, 'mo-pill', ico('clock', 24, '#fff', 2) + '<span>٠٢:٠٠</span>'); css(tm, { background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: '22px' });
      } else {
        css(s, { background: C.soft });
        const m = A(s, sw / 2 - 60, sh * 0.2, 120, 120, null, brandSVG('mark', C.ac));
        const t = A(s, 40, sh * 0.2 + 140, sw - 80, null, 'mo-kt'); css(t, { fontSize: (sw * 0.06) + 'px', textAlign: 'center', color: C.ink }); t.textContent = 'شكرًا لحضوركم';
      }
      return s;
    };
    const sl = [0, 1, 2, 3].map(mkSlide);
    // المصغّرات
    const th = [];
    for (let i = 0; i < 4; i++) {
      const tw = 200, thh = tw * 9 / 16, x = v ? W - 20 - (i + 1) * (tw + 20) + 20 : 20, y = v ? my + sh + 30 : my + i * (thh + 22);
      const t = A(e, x, y, tw, thh); css(t, { borderRadius: '10px', overflow: 'hidden', border: '3px solid transparent', background: ['linear-gradient(135deg,' + C.ac + ',' + C.ac2 + ')', '#fff', '#121220', C.soft][i] });
      const n = A(t, 10, 6, 40, 24); css(n, { fontSize: '16px', color: i === 1 || i === 3 ? '#555' : '#fff' }); n.textContent = ar(i + 1);
      th.push(t);
    }
    // أدوات المقدّم
    const ty = v ? my + sh + 30 + 113 + 30 : my + sh + 26, tlW = v ? W - 40 : sw;
    const tools = A(e, v ? 20 : mx, ty, tlW, v ? H - ty - 20 : H - ty - 20); css(tools, { display: 'flex', gap: '18px' });
    const tm = h('div', null, tools); css(tm, { background: 'rgba(255,255,255,.07)', borderRadius: '18px', padding: '16px 22px', color: '#fff', minWidth: '200px' });
    tm.innerHTML = '<div style="font-size:17px;opacity:.7">الوقت</div><div class="tmv" style="font-family:var(--mo-fd);font-size:46px;font-weight:700;direction:ltr;text-align:right">03:12</div>';
    const nt = h('div', null, tools); css(nt, { flex: '1', background: 'rgba(255,255,255,.07)', borderRadius: '18px', padding: '16px 22px', color: '#e8e8f0', fontSize: '21px', lineHeight: '1.6' });
    nt.innerHTML = '<div style="font-size:17px;opacity:.7">ملاحظات المقدّم</div>اسأل الحضور قبل الشريحة التالية، وامنحهم دقيقتين.';
    const qa = h('div', null, tools); css(qa, { background: PAL.or, borderRadius: '18px', padding: '16px 20px', color: '#fff', fontSize: '20px', display: v ? 'none' : 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '6px' });
    qa.innerHTML = ico('chat', 30, '#fff', 2) + '<span>٣ أسئلة</span>';
    const tmv = tm.querySelector('.tmv');
    // من الدرس إلى المخطط
    const doc = A(e, 0, 0, W, H); css(doc, { background: '#f4f4f8' });
    const fileC = A(doc, W / 2 - (v ? 380 : 520), v ? 140 : 180, 300, 380, 'mo-card'); css(fileC, { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '18px' });
    fileC.innerHTML = '<div style="width:110px;height:110px;border-radius:28px;background:' + rgba(PAL.rd, 0.1) + ';display:grid;place-items:center">' + ico('file', 60, PAL.rd, 1.8) + '</div><div style="font-family:var(--mo-fd);font-size:30px;font-weight:700">ملف الدرس</div><div style="color:#777;font-size:20px">أثر القدوة · ١٢ صفحة</div>';
    if (v) css(fileC, { left: (W / 2 - 150) + 'px', top: '60px', height: '320px' });
    const arw = A(doc, v ? W / 2 - 30 : W / 2 - 190, v ? 410 : 330, 60, 60, null, ico('up', 60, C.ac, 2.6)); arw.style.transform = v ? 'rotate(180deg)' : 'rotate(-90deg)';
    const ol = A(doc, v ? 60 : W / 2 - 120, v ? 500 : 140, v ? W - 120 : 560, v ? 520 : 480, 'mo-card'); css(ol, { padding: '28px' });
    const olt = h('div', null, ol); css(olt, { fontFamily: 'var(--mo-fd)', fontSize: '32px', fontWeight: '700', marginBottom: '14px' }); olt.textContent = 'المخطط';
    const olr = ['مقدمة: من هو القدوة؟', 'ثلاث صفات للقدوة', 'سؤال للنقاش', 'خاتمة وتكليف'].map(function (q, k) { const r = h('div', null, ol); css(r, { display: 'flex', alignItems: 'center', gap: '14px', fontSize: '25px', padding: '14px 0', borderTop: k ? '1px solid #eee' : '' }); r.innerHTML = '<b style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:' + C.t1 + ';color:' + C.ac + ';font-size:20px;flex:none">' + ar(k + 1) + '</b><span>' + q + '</span>'; return r; });
    const tr = [b.s1 || 0, b.s2, b.s3, b.s4];
    if (b.doc != null) { sfx(b.doc + 0.5, 'whoosh', { d: 0.5, v: 0.25 }); olr.forEach(function (r, k) { sfx(b.doc + 1.1 + k * 0.2, 'tick', { p: 1 + k * 0.1 }); }); sfx(b.s1 - 0.1, 'whoosh', { d: 0.6, v: 0.35 }); }
    [1, 2, 3].forEach(function (k) { if (tr[k] != null) sfx(tr[k], k === 2 ? 'whoosh' : 'swish', { d: 0.5, v: 0.3 }); });
    if (b.s2 != null) [0, 1, 2].forEach(function (k) { sfx(b.s2 + 0.6 + k * 0.45, 'pop', { p: 0.9 + k * 0.12, v: 0.3 }); });
    c.up = function (lt) {
      // الدرس ← المخطط ← الشرائح
      const dOn = b.doc != null ? 1 - E.io3(P(lt, (b.s1 || 0) - 0.5, 0.5)) : 0; T(doc, { o: dOn, s: 1 + (1 - dOn) * 0.04 });
      if (b.doc != null) {
        const fp = E.spr(P(lt, b.doc, 0.7)); T(fileC, { s: 0.7 + 0.3 * fp, o: P(lt, b.doc, 0.2), r: (1 - fp) * -8 });
        T(arw, { o: P(lt, b.doc + 0.5, 0.3) }); T(ol, { o: P(lt, b.doc + 0.7, 0.3), y: (1 - E.o5(P(lt, b.doc + 0.7, 0.6))) * 40 });
        olr.forEach(function (r, k) { const p = E.o5(P(lt, b.doc + 1.1 + k * 0.2, 0.5)); T(r, { x: (1 - p) * -40, o: p }); });
      }
      // الشرائح والانتقالات
      let cur = 0; for (let k = 1; k < 4; k++) if (tr[k] != null && lt >= tr[k]) cur = k;
      sl.forEach(function (s, k) {
        let st = { o: k === cur ? 1 : 0 };
        const pIn = tr[k] != null ? P(lt, tr[k], 0.65) : 1, pe = E.io3(pIn);
        if (k === cur && pIn < 1) {
          if (k === 1) st = { x: (1 - pe) * -sw, o: 1 };
          else if (k === 2) st = { s: 0.6 + 0.4 * pe, o: pe, b: (1 - pe) * 14 };
          else if (k === 0) st = { s: 0.9 + 0.1 * pe, o: pe, b: (1 - pe) * 12 };
          else st = { o: pe, y: (1 - pe) * 40 };
        }
        if (k === cur - 1 && tr[cur] != null && P(lt, tr[cur], 0.65) < 1) {
          const q = E.io3(P(lt, tr[cur], 0.65));
          st = cur === 1 ? { x: q * sw * 0.35, o: 1 - q * 0.6 } : cur === 2 ? { s: 1 + q * 0.3, o: 1 - q, b: q * 10 } : { o: 1 - q };
        }
        T(s, st); s.style.zIndex = k === cur ? 2 : 1;
      });
      if (sl[1]._b) sl[1]._b.forEach(function (r, k) { const p = E.o5(P(lt, (b.s2 == null ? -9 : b.s2) + 0.6 + k * 0.45, 0.6)); T(r, { x: (1 - p) * 60, o: p, b: (1 - p) * 8 }); });
      th.forEach(function (t, k) { sty(t, 'borderColor', k === cur ? C.ac3 : 'transparent'); });
      const sec = 192 + Math.floor(Math.max(0, lt)); txt(tmv, ('0' + Math.floor(sec / 60)).slice(-2) + ':' + ('0' + sec % 60).slice(-2));
    };
    return c;
  }

  /* ---------- التطبيق على الهاتف ---------- */
  function cPhone(S, o) {
    const W = 460, H = 940, c = { el: h('div'), w: W, h: H }, e = c.el, C = S.C, b = o.b || {}, sfx = o.sfx || noop;
    const dev = A(e, 0, 0, W, H); css(dev, { borderRadius: '64px', background: '#0d0d12', boxShadow: '0 40px 90px -30px rgba(0,0,0,.55), inset 0 0 0 3px #2a2a33' });
    const scr = A(dev, 14, 14, W - 28, H - 28); css(scr, { borderRadius: '52px', overflow: 'hidden', background: '#f2f2f7' });
    const SW = W - 28, SH = H - 28;
    const island = A(dev, W / 2 - 60, 26, 120, 34); css(island, { background: '#000', borderRadius: '20px', zIndex: '9' });
    const sb = A(scr, 0, 0, SW, 54); css(sb, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 34px 0', fontSize: '18px', fontWeight: '600', direction: 'ltr', zIndex: '6' });
    sb.innerHTML = '<span>9:41</span><span style="display:flex;gap:6px;align-items:center"><i style="width:26px;height:13px;border:2px solid #111;border-radius:4px;display:inline-block;position:relative"><i style="position:absolute;inset:1.5px 4px 1.5px 1.5px;background:#111;border-radius:1.5px"></i></i></span>';
    // الرئيسية
    const home = A(scr, 0, 0, SW, SH);
    const lt1 = A(home, 24, 66, SW - 48, 56); css(lt1, { fontFamily: 'var(--mo-fd)', fontSize: '42px', fontWeight: '700', textAlign: 'right' }); lt1.textContent = 'الرئيسية';
    const gr = A(home, 24, 122, SW - 48, 28); css(gr, { fontSize: '19px', color: '#6b6b76', textAlign: 'right' }); gr.textContent = 'ماذا ستصمّم اليوم؟';
    const qs = [['sparkles', 'اصنع إعلانك', C.ac], ['grid', 'القوالب', PAL.or], ['cal', 'التقويم', PAL.te], ['image', 'تصاميمي', PAL.pl]].map(function (q, i) {
      const tw = (SW - 48 - 14) / 2, x = SW - 24 - tw - (i % 2) * (tw + 14), y = 168 + Math.floor(i / 2) * 136;
      const t = A(home, x, y, tw, 122, 'mo-card'); css(t, { borderRadius: '24px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' });
      icTile(t, tw - 64, 16, 48, q[0], q[2]); const l = A(t, 16, 74, tw - 32, 30); css(l, { fontSize: '20px', textAlign: 'right', fontWeight: '600' }); l.textContent = q[1]; return t;
    });
    const up = A(home, 24, 452, SW - 48, 176, 'mo-card'); css(up, { borderRadius: '24px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' });
    up.innerHTML = '<div style="font-family:var(--mo-fd);font-size:22px;font-weight:700;color:' + C.ac + '">القادم</div>' + [['منشور: مسابقة الحفظ', 'الخميس ٧:٠٠ م', PAL.or], ['مهمة: إعلان الملتقى', 'غدًا', PAL.te]].map(function (q) { return '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid #f0f0f4;font-size:18px"><i style="width:10px;height:10px;border-radius:50%;background:' + q[2] + ';display:inline-block"></i><span style="flex:1">' + q[0] + '</span><span style="color:#888;font-size:16px">' + q[1] + '</span></div>'; }).join('');
    const ban = A(home, 24, 646, SW - 48, 108, 'mo-card'); css(ban, { borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '14px', padding: '0 18px', background: C.soft, boxShadow: 'none' });
    ban.innerHTML = '<div style="width:62px;height:62px;flex:none">' + brandSVG('mark', C.ac) + '</div><div style="flex:1;font-size:19px;line-height:1.4"><b style="font-family:var(--mo-fd);font-size:21px">ثبّت أثر على شاشتك</b><div style="color:#666;font-size:16px">يفتح كتطبيق، بلا متجر</div></div><div style="background:' + C.ac + ';color:#fff;border-radius:99px;padding:8px 18px;font-size:18px">ثبّت</div>';
    const tab = A(scr, 0, SH - 96, SW, 96); css(tab, { background: 'rgba(255,255,255,.94)', borderTop: '1px solid #e4e4ea', zIndex: '5' });
    [['home', 'الرئيسية'], ['grid', 'القوالب'], ['plus', ''], ['cal', 'التقويم'], ['user', 'المزيد']].forEach(function (q, i) {
      const x = SW - (i + 1) * (SW / 5);
      if (i === 2) { const p = A(tab, x + SW / 10 - 31, 10, 62, 62, null, '<div style="width:100%;height:100%;border-radius:50%;background:' + C.ac + ';display:grid;place-items:center">' + ico('plus', 32, '#fff', 2.6) + '</div>'); return; }
      const t = A(tab, x, 12, SW / 5, 70, null, '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;color:' + (i ? '#8a8a96' : C.ac) + '">' + ico(q[0], 28, 'currentColor') + '<span style="font-size:13px">' + q[1] + '</span></div>');
    });
    // ورقة الإنشاء
    const dim = A(scr, 0, 0, SW, SH); css(dim, { background: 'rgba(0,0,0,.35)', zIndex: '7' });
    const sh = A(scr, 8, SH - 470, SW - 16, 462); css(sh, { background: '#fff', borderRadius: '34px', zIndex: '8', padding: '14px 18px' });
    sh.innerHTML = '<div style="width:46px;height:6px;border-radius:6px;background:#d6d6de;margin:0 auto 14px"></div><div style="font-family:var(--mo-fd);font-size:26px;font-weight:700;text-align:center;margin-bottom:8px">إنشاء</div>' + [['sparkles', 'اصنع إعلانك', C.ac], ['grid', 'من قالب', PAL.or], ['pencil', 'صفحة بيضاء', PAL.te], ['slides', 'الشرائح', PAL.pl]].map(function (q) { return '<div style="display:flex;align-items:center;gap:16px;padding:14px 6px;font-size:22px;border-top:1px solid #f0f0f4"><div style="width:52px;height:52px;border-radius:15px;background:' + rgba(q[2], 0.12) + ';display:grid;place-items:center">' + ico(q[0], 28, q[2], 2) + '</div>' + q[1] + '</div>'; }).join('');
    // المحرر
    const ed = A(scr, 0, 0, SW, SH); css(ed, { background: '#ececf1', zIndex: '4' });
    const et = A(ed, 0, 50, SW, 64); css(et, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', fontSize: '21px', fontWeight: '600' });
    et.innerHTML = '<span style="display:flex;align-items:center;gap:6px">' + ico('up', 26, C.ac, 2.4).replace('<svg', '<svg style="transform:rotate(90deg)"') + '</span><span style="font-family:var(--mo-fd)">إعلان المسابقة</span><span class="snd" style="width:44px;height:44px;border-radius:50%;background:' + C.ac + ';display:grid;place-items:center">' + ico('send', 24, '#fff', 2) + '</span>';
    const pp = poster(ed, (SW - 330) / 2, 130, 330, 412, { lay: 'bold', c: IDS[0].c, title: 'مسابقة الحفظ', sub: 'للفتيان من ١٢ إلى ١٥', g: 'ض' });
    const ms = A(ed, 0, SH - 220, SW, 520); css(ms, { background: '#fff', borderRadius: '30px 30px 0 0', boxShadow: '0 -10px 30px rgba(0,0,0,.12)', padding: '12px 16px' });
    ms.innerHTML = '<div style="width:46px;height:6px;border-radius:6px;background:#d6d6de;margin:0 auto 14px"></div><div style="display:flex;justify-content:space-around;margin-bottom:22px">' + [['content', 'المحتوى'], ['palette', 'الألوان'], ['image', 'الصور'], ['layers', 'الخلفية']].map(function (q, i) { return '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;font-size:15px;color:' + (i === 1 ? C.ac : '#555') + '">' + ico(q[0], 28, 'currentColor') + q[1] + '</div>'; }).join('') + '</div><div style="font-family:var(--mo-fd);font-size:22px;font-weight:700;margin-bottom:12px">ألوان الهوية</div><div class="sws" style="display:flex;gap:12px">' + IDS.map(function (d) { return '<i style="width:48px;height:48px;border-radius:50%;background:' + d.c[0] + ';display:inline-block"></i>'; }).join('') + '</div>';
    const toast = A(scr, 30, 64, SW - 60, 64, 'mo-pill', ico('check', 24, '#fff', 2.6) + '<span>أُرسل إلى القناة</span>'); css(toast, { background: '#111', color: '#fff', fontSize: '20px', zIndex: '10' });
    const inst = A(scr, 8, SH - 330, SW - 16, 322); css(inst, { background: '#fff', borderRadius: '34px', zIndex: '8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' });
    inst.innerHTML = '<div style="width:96px;height:96px">' + brandSVG('mark', C.ac) + '</div><div style="font-family:var(--mo-fd);font-size:26px;font-weight:700">أُضيف إلى الشاشة الرئيسية</div><div style="display:flex;align-items:center;gap:8px;color:#2f9e5b;font-size:20px">' + ico('check', 24, '#2f9e5b', 2.6) + 'يفتح كتطبيق مستقل</div>';
    // اللمسات
    const keys = [[0, SW * 0.6 + 14, SH * 0.55 + 14]];
    if (b.inst != null) { keys.push([b.inst, 14 + 24 + 50, 14 + 646 + 54, 1]); }
    if (b.plus != null) { keys.push([b.plus, 14 + SW / 2, 14 + SH - 96 + 41, 1]); keys.push([b.plus + 1.1, 14 + SW / 2, 14 + SH - 470 + 14 + 6 + 40 + 8 + 80 + 40, 1]); }
    if (b.sheet != null) { keys.push([b.sheet, 14 + SW / 2, 14 + SH - 210, 1]); keys.push([b.sheet + 0.8, 14 + SW / 2, 14 + SH - 470, 0, 0.7]); keys.push([b.sheet + 1.5, 14 + SW - 16 - 24 - 60 * 1, 14 + SH - 470 + 160, 1]); }
    if (b.pub != null) { keys.push([b.pub, 14 + 18 + 22, 14 + 50 + 32, 1]); }
    const cur = Cursor(e, keys, sfx, { touch: true, color: C.ac });
    if (b.plus != null) { sfx(b.plus + 0.05, 'swish', { d: 0.4, v: 0.25, pa: 0, pb: 0 }); sfx(b.plus + 1.15, 'whoosh', { d: 0.45, v: 0.3 }); }
    if (b.sheet != null) { sfx(b.sheet + 0.1, 'swish', { d: 0.6, v: 0.2, pa: 0, pb: 0 }); sfx(b.sheet + 1.55, 'shimmer', { f: 1568, v: 0.05 }); }
    if (b.pub != null) { sfx(b.pub + 0.2, 'whoosh', { d: 0.4, v: 0.3 }); sfx(b.pub + 0.6, 'chime', { v: 0.16 }); }
    if (b.inst != null) { sfx(b.inst + 0.1, 'swish', { d: 0.4, v: 0.2, pa: 0, pb: 0 }); sfx(b.inst + 0.7, 'pop', { p: 1.1 }); }
    c.up = function (lt) {
      qs.forEach(function (q, i) { const p = E.spr(P(lt, 0.15 + i * 0.07, 0.6)); T(q, { s: 0.8 + 0.2 * p, o: P(lt, 0.15 + i * 0.07, 0.2) }); });
      T(ban, { o: b.inst != null ? 1 : 0.0 });
      const ip = b.inst != null ? E.o5(P(lt, b.inst + 0.1, 0.5)) * (1 - E.i3(P(lt, b.inst + 1.8, 0.4))) : 0; T(inst, { y: (1 - ip) * 360, o: ip > 0.001 ? 1 : 0 });
      const pl = b.plus != null ? E.o5(P(lt, b.plus + 0.05, 0.45)) * (1 - E.i3(P(lt, b.plus + 1.15, 0.35))) : 0;
      T(dim, { o: Math.max(pl, ip) }); T(sh, { y: (1 - pl) * 500, o: pl > 0.001 ? 1 : 0 });
      const eo = b.plus != null ? E.o5(P(lt, b.plus + 1.2, 0.6)) : (b.sheet != null || b.pub != null ? 1 : 0);
      T(ed, { x: (1 - eo) * -SW, o: eo > 0.001 ? 1 : 0 });
      const sp = b.sheet != null ? E.o5(P(lt, b.sheet + 0.2, 0.7)) : 0; T(ms, { y: -sp * 250 });
      T(pp.e, { s: 1 - 0.18 * sp, y: -sp * 50 });
      pp.mixTo(IDS[0].c, IDS[4].c, b.sheet != null ? E.io3(P(lt, b.sheet + 1.55, 0.6)) : 0);
      const tp = b.pub != null ? E.spr(P(lt, b.pub + 0.6, 0.6)) * (1 - P(lt, b.pub + 2.6, 0.3)) : 0; T(toast, { y: (1 - tp) * -30, o: b.pub != null ? P(lt, b.pub + 0.6, 0.1) * (1 - P(lt, b.pub + 2.6, 0.3)) : 0 });
      cur.up(lt);
    };
    return c;
  }

  /* ---------- المراجعة ---------- */
  function cReview(S, o) {
    const v = !!o.v, W = v ? 920 : 1200, H = v ? 1180 : 800, c = { el: h('div'), w: W, h: H }, e = c.el, C = S.C, b = o.b || {}, sfx = o.sfx || noop;
    const pw = v ? 380 : 420, phh = pw * 1.25, px = v ? (W - pw) / 2 : 30, py = v ? 0 : 40;
    const ps = poster(e, px, py, pw, phh, { lay: 'clock', c: IDS[0].c, title: 'إدارة الوقت', sub: 'لماذا وكيف؟', g: 'ض' });
    const mks = [[0.5, 0.56, 1], [0.5, 0.9, 2]].map(function (q) { const m = A(e, px + pw * q[0] - 22, py + phh * q[1] - 22, 44, 44); css(m, { borderRadius: '50%', background: q[2] === 2 ? PAL.or : '#2f9e5b', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '22px', fontWeight: '700', border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,.3)' }); m.textContent = ar(q[2]); return m; });
    const rc = v ? A(e, 0, phh + 24, W, 400, 'mo-card') : A(e, 490, 0, W - 490, 520, 'mo-card');
    const rw = v ? W : W - 490;
    const rt = A(rc, 28, 24, rw - 56, 44); css(rt, { display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--mo-fd)', fontSize: '29px', fontWeight: '700' });
    rt.innerHTML = ico('sparkles', 30, C.ac, 2) + '<span>مراجعة المصمّم الذكي</span>';
    const R = 84, rg = A(rc, 28, v ? 96 : 100, 2 * R + 24, 2 * R + 24);
    rg.innerHTML = '<svg viewBox="0 0 200 200" width="100%" height="100%"><circle cx="100" cy="100" r="86" fill="none" stroke="#eee" stroke-width="16"/><circle class="arc" cx="100" cy="100" r="86" fill="none" stroke="' + C.ac + '" stroke-width="16" stroke-linecap="round" stroke-dasharray="540.4" stroke-dashoffset="540.4" transform="rotate(-90 100 100)"/></svg>';
    const arc = rg.querySelector('.arc');
    const sc = A(rg, 0, 0, 2 * R + 24, 2 * R + 24); css(sc, { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' });
    const scn = h('div', null, sc); css(scn, { fontFamily: 'var(--mo-fd)', fontSize: '60px', fontWeight: '700', lineHeight: '1' });
    h('div', null, sc, 'من ١٠٠').style.cssText = 'font-size:18px;color:#888';
    const items = [['check', 'التباين واضح والنص مقروء', '#2f9e5b'], ['up', 'المسافة بين العنوان والتاريخ ضيقة', PAL.or], ['check', 'خطّان فقط: انسجام', '#2f9e5b']];
    const its = items.map(function (q, i) { const r = A(rc, 28, (v ? 96 : 100) + i * 62, rw - 2 * R - 24 - 80, 54); css(r, { left: 'auto', right: '28px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '21px' }); r.innerHTML = '<i style="width:36px;height:36px;border-radius:50%;flex:none;display:grid;place-items:center;background:' + rgba(q[2], 0.13) + '">' + ico(q[0], 20, q[2], 2.6) + '</i><span>' + q[1] + '</span>'; return r; });
    const tip = A(rc, 28, (v ? 96 : 100) + 3 * 62 + 10, rw - 56, 50); css(tip, { display: 'flex', alignItems: 'center', gap: '10px', color: C.ac, fontSize: '19px', fontWeight: '600' }); tip.innerHTML = ico('book', 22, C.ac, 2) + '<span>نصيحة مرتبطة: التقارب والتجميع</span>';
    // الفريق
    const ty = v ? phh + 24 + 420 : 548;
    const cm = A(e, v ? 0 : 490, ty, v ? W : W - 490, 130, 'mo-card'); css(cm, { display: 'flex', alignItems: 'center', gap: '16px', padding: '0 24px', borderRadius: '24px' });
    cm.innerHTML = '<div style="width:60px;height:60px;border-radius:50%;flex:none;background:' + PAL.te + ';color:#fff;display:grid;place-items:center;font-family:var(--mo-fd);font-size:26px">م</div><div style="flex:1;font-size:21px;line-height:1.45"><b style="font-family:var(--mo-fd)">المشرف</b><div style="color:#444">أحسنت! كبّر التاريخ قليلًا ثم انشر.</div></div>';
    const rep = A(e, v ? 0 : 490, ty + 146, 260, 54, 'mo-pill', ico('check', 22, '#2f9e5b', 2.6) + '<span>تمّ التعديل</span>'); css(rep, { background: 'rgba(47,158,91,.12)', color: '#2f9e5b', fontSize: '20px' });
    const req = A(e, v ? W - 330 : W - 330, ty + 146, 330, 54, 'mo-pill'); css(req, { fontSize: '20px' });
    if (b.rv != null) { sfx(b.rv, 'riser', { d: 1.1, v: 0.12 }); sfx(b.rv + 1.15, 'pop', { p: 1.1 }); items.forEach(function (q, i) { sfx(b.rv + 1.3 + i * 0.25, 'tick', { p: 1 + i * 0.1 }); }); }
    if (b.cm != null) { sfx(b.cm, 'pop', { p: 0.8, v: 0.4 }); sfx(b.cm + 1.0, 'tick', {}); }
    if (b.req != null) { sfx(b.req, 'click', {}); sfx(b.req + 1.2, 'chime', { v: 0.15 }); }
    c.up = function (lt) {
      const rv = b.rv == null ? 1 : P(lt, b.rv, 1.15), score = Math.round(92 * E.o3(rv));
      sty(arc, 'strokeDashoffset', (540.4 * (1 - 0.92 * E.o3(rv))).toFixed(1)); txt(scn, ar(score));
      T(rc, { o: b.rv == null ? 1 : P(lt, b.rv - 0.4, 0.3), y: b.rv == null ? 0 : (1 - E.o5(P(lt, b.rv - 0.4, 0.6))) * 40 });
      its.forEach(function (r, i) { const p = E.o5(P(lt, (b.rv == null ? -9 : b.rv + 1.3) + i * 0.25, 0.5)); T(r, { x: (1 - p) * 40, o: p }); });
      T(tip, { o: P(lt, (b.rv == null ? -9 : b.rv + 2.1), 0.3) });
      mks.forEach(function (m, i) { const p = E.spr(P(lt, (b.rv == null ? -9 : b.rv + 1.3) + i * 0.25, 0.6)); T(m, { s: p, o: P(lt, (b.rv == null ? -9 : b.rv + 1.3) + i * 0.25, 0.1) }); });
      const cp = b.cm != null ? E.spr(P(lt, b.cm, 0.7)) : 0; T(cm, { s: 0.85 + 0.15 * cp, o: b.cm != null ? P(lt, b.cm, 0.15) : 0, y: (1 - cp) * 30 });
      const rp = b.cm != null ? E.spr(P(lt, b.cm + 1.0, 0.6)) : 0; T(rep, { s: rp, o: b.cm != null ? P(lt, b.cm + 1.0, 0.1) : 0 });
      const st = b.req == null ? -1 : lt < b.req ? 0 : lt < b.req + 1.2 ? 1 : 2;
      setHTML(req, st === 2 ? ico('check', 22, '#fff', 2.6) + '<span>تمت المراجعة</span>' : st === 1 ? ico('clock', 22, '#b75a12', 2) + '<span>بانتظار المراجعة</span>' : ico('review' in IC ? 'review' : 'star', 22, '#fff', 2) + '<span>اطلب مراجعة الإدارة</span>');
      sty(req, 'background', st === 2 ? '#2f9e5b' : st === 1 ? rgba(PAL.or, 0.14) : C.ac); sty(req, 'color', st === 1 ? '#b75a12' : '#fff');
      T(req, { o: b.req == null ? 0 : P(lt, b.req - 0.6, 0.3), s: st === 0 && lt > b.req - 0.1 ? 0.95 : 1 });
    };
    return c;
  }

  /* ---------- الإشعارات ---------- */
  function cBell(S, o) {
    const W = 600, H = 470, c = comp(W, H), e = c.el, C = S.C, b = o.b || {}, sfx = o.sfx || noop;
    const hd = A(e, 26, 22, W - 52, 52); css(hd, { display: 'flex', alignItems: 'center', gap: '14px' });
    const bl = h('div', null, hd); css(bl, { position: 'relative', width: '52px', height: '52px', borderRadius: '16px', background: C.t1, display: 'grid', placeItems: 'center' }); bl.innerHTML = ico('bell', 30, C.ac, 2);
    const bd = h('b', null, bl); css(bd, { position: 'absolute', top: '-8px', left: '-8px', minWidth: '30px', height: '30px', borderRadius: '99px', background: PAL.rd, color: '#fff', fontSize: '17px', display: 'grid', placeItems: 'center', padding: '0 6px', border: '3px solid #fff' });
    const tt = h('div', null, hd); css(tt, { fontFamily: 'var(--mo-fd)', fontSize: '29px', fontWeight: '700' }); tt.textContent = 'الإشعارات';
    const items = o.items || [['chat', 'علّق المشرف على تصميمك', 'الآن', PAL.te], ['cal', 'مهمة جديدة: إعلان الملتقى', 'قبل ٥ دقائق', PAL.or], ['send', 'نُشر منشورك في القناة', 'قبل ساعة', C.ac]];
    const its = items.map(function (q, i) { const r = A(e, 20, 96 + i * 120, W - 40, 108); css(r, { borderRadius: '20px', background: i === 0 ? C.soft : '#fafafc', display: 'flex', alignItems: 'center', gap: '16px', padding: '0 18px' }); r.innerHTML = '<div style="width:56px;height:56px;border-radius:17px;flex:none;display:grid;place-items:center;background:' + rgba(q[3], 0.13) + '">' + ico(q[0], 28, q[3], 2) + '</div><div style="flex:1;font-size:21px;line-height:1.4">' + q[1] + '<div style="font-size:16px;color:#888">' + q[2] + '</div></div>'; return r; });
    const at = (b.n || [0.2, 0.6, 1.0]);
    at.forEach(function (t, i) { sfx(t, i ? 'pop' : 'chime', { p: 1 + i * 0.15, v: i ? 0.3 : 0.14 }); });
    c.up = function (lt) {
      let n = 0; at.forEach(function (t) { if (lt >= t) n++; });
      txt(bd, ar(n)); T(bd, { s: n ? 1 + 0.3 * (1 - E.spr(P(lt, at[Math.max(0, n - 1)], 0.5))) : 0, o: n ? 1 : 0 });
      its.forEach(function (r, i) { const k = items.length - 1 - i, p = E.spr(P(lt, at[k], 0.7)); T(r, { y: (1 - p) * -30, o: P(lt, at[k], 0.15) }); });
      // الأحدث في الأعلى
      its.forEach(function (r, i) { r.style.top = (96 + i * 120) + 'px'; });
    };
    return c;
  }

  /* ---------- تصاميمي والفريق ---------- */
  function cMine(S, o) {
    const v = !!o.v, W = v ? 920 : 1200, H = v ? 1180 : 820, c = { el: h('div'), w: W, h: H }, e = c.el, C = S.C, b = o.b || {}, sfx = o.sfx || noop;
    const t = A(e, 0, 0, W, 60); css(t, { fontFamily: 'var(--mo-fd)', fontSize: '46px', fontWeight: '700', textAlign: 'right' }); t.textContent = 'تصاميمي';
    const ch = ['الكل', 'المسودات', 'المشتركة', 'مراجعاتي']; let cx = W;
    ch.forEach(function (s, i) { const w = 40 + s.length * 17; cx -= w + 12; pill(e, cx + 12, 84, w, 50, s, { bg: i ? '#fff' : C.ac, fg: i ? '#333' : '#fff', fs: 20, bd: i ? '1.5px solid #e2e2ea' : '0' }); });
    const cols = v ? 3 : 5, pw = v ? 268 : 206, phh = pw * 1.25, gx = (W - cols * pw) / (cols - 1), rows = 2;
    const names = ['مسابقة الحفظ', 'اللقاء الافتتاحي', 'إدارة الوقت', 'حفل التكريم', 'ليلة السيرة', 'ورشة الإلقاء', 'يوم الاقتداء', 'رحلة الأخوة', 'سؤال اليوم', 'ملتقى الأسرة'];
    const lays = ['bold', 'circle', 'clock', 'arch', 'panel', 'split'];
    const cards = [];
    for (let i = 0; i < cols * rows; i++) {
      const x = W - (i % cols + 1) * pw - (i % cols) * gx, y = 160 + Math.floor(i / cols) * (phh + 70);
      const p = poster(e, x, y, pw, phh, { lay: lays[i % 6], c: IDS[(i * 2 + 1) % 6].c, title: names[i], sub: '', g: IDS[(i * 2 + 1) % 6].g, meta: ['', ''] });
      const l = A(e, x, y + phh + 12, pw, 34); css(l, { textAlign: 'right', fontSize: '21px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden' }); l.textContent = names[i];
      cards.push({ p: p, l: l, x: x, y: y });
    }
    const k0 = cards[1];
    const menu = A(e, k0.x - 40, k0.y + 70, 300, 200, 'mo-card'); css(menu, { borderRadius: '20px', zIndex: '6' });
    [['users', 'شارك للتعديل'], ['star', 'اطلب مراجعة'], ['download', 'نزّل']].forEach(function (q, i) { const r = A(menu, 0, i * 66, 300, 66); css(r, { display: 'flex', alignItems: 'center', gap: '12px', padding: '0 20px', fontSize: '21px', borderTop: i ? '1px solid #f0f0f4' : '' }); r.innerHTML = ico(q[0], 24, C.ac, 2) + '<span>' + q[1] + '</span>'; });
    const dots = A(e, k0.x + 12, k0.y + 12, 46, 46); css(dots, { borderRadius: '50%', background: 'rgba(255,255,255,.95)', display: 'grid', placeItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.2)' }); dots.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><circle cx="5" cy="12" r="2" fill="#333"/><circle cx="12" cy="12" r="2" fill="#333"/><circle cx="19" cy="12" r="2" fill="#333"/></svg>';
    const av = A(e, k0.x + pw - 96, k0.y + phh - 60, 90, 48); av.innerHTML = '<div style="display:flex;direction:ltr">' + [PAL.te, PAL.or].map(function (cc, i) { return '<i style="width:46px;height:46px;border-radius:50%;background:' + cc + ';border:3px solid #fff;display:grid;place-items:center;color:#fff;font-style:normal;font-size:20px;margin-left:' + (i ? -14 : 0) + 'px">' + ['م', 'أ'][i] + '</i>'; }).join('') + '</div>';
    const toast = A(e, W / 2 - 230, H - 90, 460, 62, 'mo-pill', ico('link', 24, '#fff', 2.2) + '<span>نُسخ رابط التعديل المشترك</span>'); css(toast, { background: '#111', color: '#fff', fontSize: '20px', zIndex: '7' });
    const badge = A(e, k0.x + 10, k0.y + phh - 58, 200, 46, 'mo-pill'); css(badge, { fontSize: '18px', zIndex: '5' });
    let bell = null;
    if (b.bell != null) { bell = cBell(S, { b: { n: [b.bell, b.bell + 0.45, b.bell + 0.9] }, sfx: function (t2, k, x) { sfx(t2, k, x); } }); }
    let bw = null;
    if (bell) { bw = A(e, 0, v ? 560 : 260, bell.w, bell.h); bw.appendChild(bell.el); css(bell.el, { position: 'absolute', left: '0', top: '0', width: bell.w + 'px', height: bell.h + 'px' }); bw.style.transformOrigin = '0 0'; }
    const keys = [[0, W * 0.5, H * 0.7]];
    const mk = function (i) { return [k0.x + 40, k0.y + 70 + 33 + i * 66]; };
    if (b.share != null) { keys.push([b.share, k0.x + 35, k0.y + 35, 1]); keys.push([b.share + 0.8, mk(0)[0] + 60, mk(0)[1], 1]); }
    if (b.rev != null) { keys.push([b.rev, k0.x + 35, k0.y + 35, 1]); keys.push([b.rev + 0.8, mk(1)[0] + 60, mk(1)[1], 1]); }
    const cur = keys.length > 1 ? Cursor(e, keys, sfx, { color: C.ac }) : null;
    if (b.share != null) { sfx(b.share + 0.85, 'pop', { p: 1 }); sfx(b.share + 1.0, 'chime', { v: 0.12 }); }
    if (b.rev != null) { sfx(b.rev + 0.85, 'pop', { p: 0.9 }); sfx(b.rev + 2.2, 'chime', { v: 0.14 }); }
    c.up = function (lt) {
      cards.forEach(function (k, i) { const p = E.o5(P(lt, 0.1 + i * 0.06, 0.7)); T(k.p.e, { y: (1 - p) * 60, o: P(lt, 0.1 + i * 0.06, 0.3), s: 0.94 + 0.06 * p }); T(k.l, { o: P(lt, 0.25 + i * 0.06, 0.3) }); });
      const m1 = b.share != null ? P(lt, b.share + 0.05, 0.2) * (1 - P(lt, b.share + 0.85, 0.15)) : 0, m2 = b.rev != null ? P(lt, b.rev + 0.05, 0.2) * (1 - P(lt, b.rev + 0.85, 0.15)) : 0, m = Math.max(m1, m2);
      T(menu, { o: m, s: 0.9 + 0.1 * m, y: (1 - m) * -10 });
      const hv = (b.share != null && lt > b.share - 0.5) || (b.rev != null && lt > b.rev - 0.5); T(dots, { o: hv ? 1 : 0 });
      const ap = b.share != null ? E.spr(P(lt, b.share + 0.95, 0.6)) : 0; T(av, { s: ap, o: b.share != null ? P(lt, b.share + 0.95, 0.1) : 0 });
      const tp = b.share != null ? P(lt, b.share + 0.95, 0.15) * (1 - P(lt, b.share + 2.6, 0.3)) : 0; T(toast, { o: tp, y: (1 - tp) * 30 });
      const st = b.rev == null || lt < b.rev + 0.9 ? -1 : lt < b.rev + 2.2 ? 1 : 2;
      setHTML(badge, st === 2 ? ico('check', 20, '#fff', 2.6) + '<span>٩٢ من ١٠٠</span>' : ico('clock', 20, '#b75a12', 2) + '<span>قيد المراجعة</span>');
      sty(badge, 'background', st === 2 ? '#2f9e5b' : '#fff3e8'); sty(badge, 'color', st === 2 ? '#fff' : '#b75a12');
      T(badge, { o: st < 0 ? 0 : 1, s: st === 2 ? 1 + 0.15 * (1 - E.spr(P(lt, b.rev + 2.2, 0.5))) : E.spr(P(lt, (b.rev || 0) + 0.9, 0.5)) });
      if (bw) { const bp = E.o5(P(lt, b.bell - 0.4, 0.6)); T(bw, { o: P(lt, b.bell - 0.4, 0.25), y: (1 - bp) * 40 }); bell.up(lt); }
      if (cur) cur.up(lt);
    };
    return c;
  }

  /* ---------- الرئيسية ---------- */
  function cHome(S, o) {
    const v = !!o.v, W = v ? 920 : 1240, H = v ? 1180 : 800, c = comp(W, H), e = c.el, C = S.C, b = o.b || {}, sfx = o.sfx || noop;
    e.style.background = '#fff';
    const nav = A(e, 0, 0, W, 78); css(nav, { borderBottom: '1px solid #f0f0f3' });
    A(nav, W - 70, 18, 44, 44, null, brandSVG('mark', '#111'));
    if (!v) ['الرئيسية', 'اصنع إعلانك', 'تصاميمي', 'التقويم', 'نصائح'].forEach(function (s, i) { const p = pill(nav, W - 100 - (i + 1) * 140, 18, 128, 44, s, { bg: i ? 'transparent' : C.t1, fg: i ? '#555' : C.ac, fs: 18 }); });
    const avt = A(nav, 26, 17, 44, 44); css(avt, { borderRadius: '50%', background: C.ac, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--mo-fd)', fontSize: '20px' }); avt.textContent = 'م';
    A(nav, 86, 22, 34, 34, null, ico('bell', 30, '#333'));
    const cont = A(e, 0, 78, W, H - 78);
    const cw = v ? W - 60 : 760, rx = W - 30 - cw;
    const eb = A(cont, rx, 30, cw, 30); css(eb, { color: C.ac, fontSize: '20px', textAlign: 'right' }); eb.textContent = 'طاب يومك · برنامج النخبة';
    const gt = A(cont, rx, 64, cw, null, 'mo-kt'); css(gt, { fontSize: v ? '60px' : '64px', textAlign: 'right' }); gt.textContent = 'ماذا ستصمّم اليوم؟';
    // البحث
    const sy = v ? 170 : 175;
    const sr = A(cont, rx, sy, cw, 70, 'mo-fld'); css(sr, { borderRadius: '99px', fontSize: '22px', gap: '12px', boxShadow: '0 2px 10px rgba(0,0,0,.04)' });
    const res = A(cont, rx, sy + 80, cw, 250, 'mo-card'); css(res, { borderRadius: '22px', zIndex: '4' });
    [['مسابقة الحفظ', 'bold', 0], ['مسابقة السيرة', 'circle', 1], ['تحدّي الأسبوع', 'split', 2]].forEach(function (q, i) { const r = A(res, 0, 14 + i * 76, cw, 76); css(r, { display: 'flex', alignItems: 'center', gap: '16px', padding: '0 20px', fontSize: '21px' }); const th = h('div', null, r); css(th, { width: '52px', height: '64px', position: 'relative', flex: 'none' }); poster(th, 0, 0, 52, 64, { lay: q[1], c: IDS[q[2]].c, title: '', sub: '', meta: ['', ''], flat: 1 }); h('span', null, r, q[0] + '<small style="color:#888;font-size:16px;margin-inline-start:10px">' + IDS[q[2]].n + '</small>'); });
    // الساعة (للشاشة الأفقية)
    let clock = null;
    if (!v) { clock = A(e, 30, 108, 380, 300, 'mo-card'); css(clock, { padding: '26px' }); clock.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div style="font-family:var(--mo-fd);font-size:24px">السبت</div><div style="font-size:18px;color:#444">١٣ جمادى الأولى ١٤٤٨ هـ</div><div style="font-size:16px;color:#888">٢٤ أكتوبر ٢٠٢٦ م</div></div><div style="font-family:var(--mo-fd);font-size:64px;font-weight:700;line-height:1;direction:ltr">9:41</div></div><div style="margin-top:26px;display:grid;grid-template-columns:repeat(7,1fr);gap:8px;text-align:center;font-size:16px;color:#555">' + Array.from({ length: 21 }, function (_, i) { const d = i + 8; return '<span style="' + (d === 13 ? 'background:' + C.ac + ';color:#fff;border-radius:10px;' : '') + 'padding:4px 0">' + ar(d) + '</span>'; }).join('') + '</div>'; }
    // البطاقات
    const cy = v ? 280 : 280;
    const upc = A(cont, rx, cy, cw, v ? 190 : 150, 'mo-card'); css(upc, { padding: '20px 24px', background: C.bg, boxShadow: 'none', borderRadius: '24px' });
    upc.innerHTML = '<div style="display:flex;justify-content:space-between;font-size:20px"><b style="color:' + C.ac + ';font-family:var(--mo-fd)">القادم في التقويم</b><span style="color:#555">التقويم والمهام</span></div>' + [['منشور: مسابقة الحفظ', 'الخميس ٧:٠٠ م', PAL.or], ['مهمة: إعلان الملتقى', 'غدًا', PAL.te]].slice(0, v ? 2 : 2).map(function (q) { return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0 0;font-size:19px"><i style="width:10px;height:10px;border-radius:50%;background:' + q[2] + ';display:inline-block"></i><span style="flex:1">' + q[0] + '</span><span style="color:#888;font-size:17px">' + q[1] + '</span></div>'; }).join('');
    const my = cy + (v ? 210 : 170), mkc = A(cont, v ? 30 : 30, my, v ? cw : W - 60, v ? 300 : 230, 'mo-card'); css(mkc, { padding: '26px 30px', background: 'linear-gradient(120deg,#fff 55%,' + C.soft + ')' });
    const mw = v ? cw : W - 60;
    mkc.innerHTML = '<div style="display:flex;justify-content:flex-start"><span style="display:inline-flex;align-items:center;gap:8px;background:' + C.ac + ';color:#fff;border-radius:99px;padding:6px 16px;font-size:17px">' + ico('sparkles', 20, '#fff', 2) + 'المصمّم الذكي</span></div><div style="font-family:var(--mo-fd);font-size:36px;font-weight:700;margin:12px 0">قل ما تريد، ونصمّمه لك</div>';
    const mi = h('div', 'mo-fld', mkc); css(mi, { height: '64px', fontSize: '22px', maxWidth: (v ? mw - 60 : 720) + 'px' });
    const tipc = A(cont, rx, my + (v ? 320 : 250), cw, 220, 'mo-card'); css(tipc, { padding: '22px 26px' });
    tipc.innerHTML = '<div style="color:' + PAL.or + ';font-size:18px;font-weight:600">نصيحة اليوم</div><div style="font-family:var(--mo-fd);font-size:28px;font-weight:700;margin-top:4px">المحاذاة: ضع العناصر على خطّ واحد</div>';
    const ta = A(tipc, 26, 120, 300, 80); const bars = [0, 1, 2].map(function (i) { const bb = A(ta, 0, i * 26, [220, 160, 190][i], 16); css(bb, { borderRadius: '8px', background: [C.ac, PAL.or, PAL.te][i], right: '0', left: 'auto' }); return bb; });
    const gl = A(ta, 298, -6, 0, 92); css(gl, { borderLeft: '2px dashed ' + PAL.rd });
    // التمرير في الشاشة الطولية
    const keys = [[0, W * 0.55, H * 0.75]];
    if (b.search) keys.push([b.search[0] - 0.1, rx + cw * 0.5, 78 + sy + 35, 1]);
    if (b.make) keys.push([b.make[0] - 0.1, (v ? 30 + 30 : 60) + Math.min(mw - 60, 720) * 0.5 + 30, 0, 1]);
    const scrollY = function (lt) { if (!v) return 0; let y = 0; if (b.up != null) y = lerp(y, 0, 1); if (b.make) y = lerp(y, 180, E.io3(P(lt, b.make[0] - 0.9, 0.7))); if (b.tip != null) y = lerp(y, 520, E.io3(P(lt, b.tip - 0.7, 0.7))); return y; };
    if (b.make) keys[keys.length - 1][2] = 78 + my + 140 + 32 - (v ? 180 : 0);
    const cur = Cursor(e, keys, sfx, { color: C.ac, end: (b.make ? b.make[1] + 0.8 : (b.search ? b.search[1] + 1.2 : 1)) });
    const sq = o.q || 'مسابقة', mq = 'لقاء الأسرة يوم الخميس…';
    if (b.search) { sfx(b.search[0], 'type', { d: b.search[1] - b.search[0], r: sq.length / (b.search[1] - b.search[0]) }); sfx(b.search[1] + 0.1, 'pop', { p: 0.9 }); }
    if (b.make) sfx(b.make[0], 'type', { d: b.make[1] - b.make[0], r: 12 });
    if (b.up != null) sfx(b.up, 'swish', { d: 0.4, v: 0.18 });
    if (b.tip != null) { sfx(b.tip + 0.7, 'swish', { d: 0.4, v: 0.18 }); sfx(b.tip + 1.3, 'pop', { p: 1.2, v: 0.3 }); }
    const focusOf = function (lt) { const f = []; if (b.search) f.push([b.search[0] - 0.2, sr]); if (b.up != null) f.push([b.up, upc]); if (b.make) f.push([b.make[0] - 0.3, mkc]); if (b.tip != null) f.push([b.tip, tipc]); let cur2 = null; f.forEach(function (q) { if (lt >= q[0]) cur2 = q[1]; }); return cur2; };
    c.up = function (lt) {
      const sy2 = scrollY(lt); T(cont, { y: -sy2 });
      const st = b.search ? typed(sq, lt, b.search[0], b.search[1]) : '', sOn = b.search && lt >= b.search[0] - 0.1 && lt < (b.up != null ? b.up : 99);
      setHTML(sr, ico('search', 26, '#888') + (st ? '<span>' + st + '</span>' + (sOn ? caret(C.ac) : '') : '<span style="color:#999">ابحث في القوالب: مسابقة، تهنئة، لقاء…</span>'));
      sty(sr, 'borderColor', sOn ? C.ac : '#e3e3ea');
      const rp = b.search ? P(lt, b.search[1] + 0.1, 0.25) * (1 - P(lt, b.up != null ? b.up - 0.2 : 99, 0.25)) : 0; T(res, { o: rp, y: (1 - rp) * -12 });
      const mt = b.make ? typed(mq, lt, b.make[0], b.make[1]) : '', mOn = b.make && lt >= b.make[0] - 0.1;
      setHTML(mi, mt ? mt + (mOn ? caret(C.ac) : '') : '<span style="color:#999">اكتب فكرة إعلانك بكلماتك…</span>'); sty(mi, 'borderColor', mOn ? C.ac : '#e3e3ea');
      const fc = focusOf(lt);
      const dimv = function (k) { return !fc || k === fc ? 1 : 0.38; };
      T(sr, { o: dimv(sr) }); T(mkc, { o: dimv(mkc) }); T(tipc, { o: dimv(tipc) });
      T(upc, { o: dimv(upc), s: b.up != null ? 1 + 0.025 * Math.sin(Math.PI * P(lt, b.up, 0.5)) : 1 });
      if (b.tip != null) { const p = E.spr(P(lt, b.tip + 0.7, 0.8)); bars.forEach(function (bb, i) { T(bb, { x: (1 - p) * [-40, 30, -20][i] * (1 + i) }); }); T(gl, { o: P(lt, b.tip + 0.5, 0.2) * (1 - P(lt, b.tip + 2.2, 0.3)) }); }
      if (clock) T(clock, { o: fc && fc !== sr ? 0.38 : 1 });
      cur.up(lt);
    };
    return c;
  }

  /* ---------- القوالب والهويات ---------- */
  function cGallery(S, o) {
    const v = !!o.v, W = v ? 920 : 1240, H = v ? 1180 : 820, c = comp(W, H), e = c.el, C = S.C, b = o.b || {}, sfx = o.sfx || noop;
    e.style.background = '#fff';
    const idr = A(e, 0, 24, W, 60); const idc = [];
    let x0 = W - 30;
    IDS.slice(0, v ? 3 : 4).forEach(function (d, i) { const w = 90 + d.n.length * 16; x0 -= w; const ch = A(idr, x0, 0, w, 56, 'mo-pill', '<i style="width:30px;height:30px;border-radius:50%;background:' + d.c[0] + ';display:grid;place-items:center;color:#fff;font-style:normal;font-size:16px;font-family:var(--mo-fd)">' + d.g + '</i><span>' + d.n + '</span>'); css(ch, { fontSize: '20px', border: '1.5px solid #e3e3ea', color: '#333', background: '#fff' }); idc.push(ch); x0 -= 12; });
    const hd = A(e, 0, 108, W, 110);
    const lg = A(hd, W - 30 - 96, 0, 96, 96); css(lg, { borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#fff', fontFamily: 'var(--mo-fd)', fontSize: '50px', fontWeight: '700' });
    const nm = A(hd, 30, 4, W - 30 - 96 - 24 - 30, 64); css(nm, { fontFamily: 'var(--mo-fd)', fontSize: '50px', fontWeight: '700', textAlign: 'right', whiteSpace: 'nowrap' });
    const dts = A(hd, 30, 74, W - 30 - 96 - 24 - 30, 24); css(dts, { display: 'flex', gap: '8px', justifyContent: 'flex-start' });
    const dEls = [0, 1, 2, 3].map(function () { const d = h('i', null, dts); css(d, { width: '22px', height: '22px', borderRadius: '50%', display: 'inline-block' }); return d; });
    const cats = ['الكل', 'إعلان فعالية', 'مسابقة', 'تهنئة وشكر', 'عبارة وتذكير', 'غلاف يوتيوب'];
    let cx = W - 30; const cEls = [];
    cats.slice(0, v ? 4 : 6).forEach(function (s) { const w = 44 + s.length * 15.5; cx -= w; const p = pill(e, cx, 236, w, 52, s, { bg: '#fff', fg: '#333', fs: 19, bd: '1.5px solid #e3e3ea' }); cEls.push(p); cx -= 10; });
    const sr = A(e, 30, v ? 304 : 236, v ? W - 60 : 300, 56, 'mo-fld'); css(sr, { borderRadius: '99px', fontSize: '20px', gap: '10px', height: '56px' });
    const gy = v ? 386 : 320, cols = v ? 3 : 4, pw = v ? 268 : 268, phh = pw * 1.25, gx = (W - 60 - cols * pw) / (cols - 1);
    const sets = [['اللقاء الافتتاحي', 'إدارة الوقت', 'ليلة السيرة', 'حفل التكريم', 'ورشة الإلقاء', 'رحلة الأخوة'], ['مسابقة الحفظ', 'مسابقة السيرة', 'تحدّي الأسبوع', 'سؤال اليوم', 'مسابقة الإلقاء', 'فائزو الأسبوع']];
    const lays = ['circle', 'clock', 'arch', 'panel', 'split', 'bold'];
    const ps = [], ps2 = [];
    for (let i = 0; i < cols * 2; i++) {
      const x = W - 30 - (i % cols + 1) * pw - (i % cols) * gx, y = gy + Math.floor(i / cols) * (phh + 30);
      ps.push(poster(e, x, y, pw, phh, { lay: lays[i % 6], c: IDS[0].c, title: sets[0][i % 6], sub: '', g: IDS[0].g }));
      ps2.push(poster(e, x, y, pw, phh, { lay: lays[(i + 3) % 6], c: IDS[0].c, title: sets[1][i % 6], sub: '', g: IDS[0].g }));
    }
    const zoom = A(e, 0, 0, W, H); css(zoom, { background: '#f1f1f5' });
    const zt = A(zoom, 0, 0, W, 76); css(zt, { background: '#fff', borderBottom: '1.5px solid #ececf1' }); pill(zt, 18, 16, 150, 46, 'تنزيل', { ic: 'download', bg: C.ac, fs: 19 });
    const target = 1, idTo = o.idTo == null ? 3 : o.idTo;
    const keys = [[0, W * 0.6, H * 0.7]];
    if (b.id != null) keys.push([b.id, parseFloat(idc[1].style.left) + 70, 24 + 28, 1]);
    if (b.cat != null) keys.push([b.cat, parseFloat(cEls[2].style.left) + 40, 236 + 26, 1]);
    if (b.search) keys.push([b.search[0] - 0.1, 30 + 120, (v ? 304 : 236) + 28, 1]);
    if (b.open != null) keys.push([b.open, ps2[0].e.offsetLeft || (W - 30 - pw / 2), gy + phh / 2, 1]);
    if (b.open != null) keys[keys.length - 1][1] = W - 30 - pw / 2;
    const cur = Cursor(e, keys, sfx, { color: C.ac });
    if (b.id != null) { sfx(b.id + 0.1, 'shimmer', { f: 1320, v: 0.06 }); sfx(b.id + 0.1, 'whoosh', { d: 0.7, v: 0.22 }); }
    if (b.cat != null) { ps.forEach(function (p, i) { if (i < 4) sfx(b.cat + 0.25 + i * 0.08, 'pop', { p: 0.9 + i * 0.1, v: 0.22 }); }); }
    if (b.search) sfx(b.search[0], 'type', { d: b.search[1] - b.search[0], r: 8 });
    if (b.open != null) sfx(b.open + 0.1, 'whoosh', { d: 0.6, v: 0.35 });
    c.up = function (lt) {
      const ip = b.id != null ? 1 : 0, mk = function (i) { return b.id != null ? E.io3(P(lt, b.id + 0.1 + i * 0.07, 0.55)) : 0; };
      const hc = [0, 1, 2, 3].map(function (k) { return mix(IDS[0].c[k], IDS[idTo].c[k], mk(0)); });
      sty(lg, 'background', hc[0]); txt(lg, mk(0) > 0.5 ? IDS[idTo].g : IDS[0].g); txt(nm, mk(0) > 0.5 ? IDS[idTo].n : IDS[0].n);
      T(nm, { o: 1 - Math.sin(Math.PI * mk(0)) * 0.7, b: Math.sin(Math.PI * mk(0)) * 6 });
      dEls.forEach(function (d, k) { sty(d, 'background', hc[k]); });
      idc.forEach(function (ch, i) { const on = (mk(0) > 0.5 ? 1 : 0) === i; sty(ch, 'borderColor', on ? C.ac : '#e3e3ea'); sty(ch, 'background', on ? C.t1 : '#fff'); });
      const sw = b.cat != null ? 1 : 0;
      [ps, ps2].forEach(function (set, si) {
        set.forEach(function (p, i) {
          p.mixTo(IDS[0].c, IDS[idTo].c, mk(i + 1));
          const a = b.cat == null ? 99 : b.cat + 0.15 + i * 0.08, q = E.o5(P(lt, a, 0.5));
          let vis = si === 0 ? 1 - P(lt, a - 0.1, 0.2) : P(lt, a, 0.2);
          let st = si === 0 ? { o: vis, s: 1 - 0.06 * (1 - vis) } : { o: vis, y: (1 - q) * 50, s: 0.94 + 0.06 * q };
          if (b.search && si === 1 && i >= 2) { const f = P(lt, b.search[1], 0.3); st.o *= 1 - f; st.s = (st.s || 1) * (1 - 0.1 * f); }
          if (b.search && si === 0 && b.cat == null && i >= 2) { const f = P(lt, b.search[1], 0.3); st.o *= 1 - f; }
          T(p.e, st);
        });
      });
      cEls.forEach(function (p, i) { const on = (b.cat != null && lt > b.cat) ? i === 2 : i === 0; sty(p, 'background', on ? C.ac : '#fff'); sty(p, 'color', on ? '#fff' : '#333'); sty(p, 'borderColor', on ? C.ac : '#e3e3ea'); });
      const st2 = b.search ? typed('مسابقة', lt, b.search[0], b.search[1]) : '';
      setHTML(sr, ico('search', 24, '#888') + (st2 ? '<span>' + st2 + '</span>' + caret(C.ac) : '<span style="color:#999">ابحث في القوالب…</span>'));
      if (b.open != null) { const zp = E.io3(P(lt, b.open + 0.1, 0.7)); T(zoom, { o: P(lt, b.open + 0.35, 0.3) }); T(ps2[0].e, { s: 1 + zp * (v ? 1.6 : 1.15), x: zp * (W / 2 - (W - 30 - pw / 2)), y: zp * (H / 2 + 30 - (gy + phh / 2)) }); ps2[0].e.style.zIndex = 5; zoom.style.zIndex = 4; } else T(zoom, { o: 0 });
      cur.up(lt);
    };
    return c;
  }

  /* ---------- لوحة الإدارة ---------- */
  function cAdmin(S, o) {
    const v = !!o.v, W = v ? 920 : 1240, H = v ? 1180 : 800, c = comp(W, H), e = c.el, C = S.C, b = o.b || {}, sfx = o.sfx || noop;
    e.style.background = '#fafafc';
    const groups = [['chart', 'نظرة عامة'], ['users', 'الحسابات'], ['grid', 'البرامج والأصول'], ['bell', 'الإشعارات'], ['gear', 'الإعدادات']];
    const gEls = [];
    if (!v) {
      const sb = A(e, W - 260, 0, 260, H); css(sb, { background: '#fff', borderLeft: '1.5px solid #ececf1', padding: '24px 16px' });
      const tt = A(sb, 20, 22, 220, 40); css(tt, { fontFamily: 'var(--mo-fd)', fontSize: '28px', fontWeight: '700', textAlign: 'right' }); tt.textContent = 'لوحة الإدارة';
      groups.forEach(function (g, i) { const it = A(sb, 14, 84 + i * 66, 232, 56, null, '<div style="display:flex;align-items:center;gap:12px;height:100%;padding:0 14px">' + ico(g[0], 24, 'currentColor') + '<span style="font-size:20px">' + g[1] + '</span></div>'); css(it, { borderRadius: '14px', color: '#444' }); gEls.push(it); });
    } else {
      groups.slice(0, 4).forEach(function (g, i) { const w = 210; const it = A(e, W - (i + 1) * (w + 12) + 12, 20, w, 60, null, '<div style="display:flex;align-items:center;justify-content:center;gap:8px;height:100%">' + ico(g[0], 22, 'currentColor') + '<span style="font-size:19px;white-space:nowrap">' + g[1] + '</span></div>'); css(it, { borderRadius: '99px', color: '#444', background: '#fff', border: '1.5px solid #e6e6ee' }); gEls.push(it); });
    }
    const mw = v ? W : W - 260, mx = 0, my = v ? 100 : 0, mh = H - my;
    const pages = [0, 1, 2, 3].map(function () { const p = A(e, mx, my, mw, mh); return p; });
    // ١ نظرة عامة
    const k = [['تصاميم هذا الشهر', 482, C.ac], ['أعضاء نشطون', 64, PAL.te], ['منشورات مجدولة', 23, PAL.or], ['طلبات مراجعة', 7, PAL.pl]];
    const kw = v ? (mw - 60 - 20) / 2 : (mw - 60 - 60) / 4;
    const kEls = k.map(function (q, i) { const x = v ? mw - 30 - (i % 2 + 1) * kw - (i % 2) * 20 : mw - 30 - (i + 1) * kw - i * 20, y = v ? 20 + Math.floor(i / 2) * 170 : 30; const t = A(pages[0], x, y, kw, 150, 'mo-card'); css(t, { padding: '20px 22px', borderRadius: '22px' }); t.innerHTML = '<div style="font-size:18px;color:#666">' + q[0] + '</div><div class="n" style="font-family:var(--mo-fd);font-size:54px;font-weight:700;color:' + q[2] + '">٠</div>'; return { e: t, n: t.querySelector('.n'), v: q[1] }; });
    const chY = v ? 380 : 210, ch = A(pages[0], 30, chY, mw - 60, v ? 460 : 400, 'mo-card'); css(ch, { padding: '22px 26px', borderRadius: '24px' });
    h('div', null, ch, 'التصاميم أسبوعيًا').style.cssText = 'font-family:var(--mo-fd);font-size:24px;font-weight:700';
    const vals = [32, 41, 38, 55, 49, 63, 58, 72, 69, 81, 77, 92], bw = (mw - 60 - 52) / 12;
    const barH = v ? 340 : 290;
    const bars = vals.map(function (val, i) { const bb = A(ch, 26 + (11 - i) * bw + 8, 0, bw - 16, val / 100 * barH); css(bb, { top: 'auto', bottom: '24px', borderRadius: '10px 10px 4px 4px', background: i === 0 ? C.ac : C.ac3, transformOrigin: '50% 100%' }); return bb; });
    // ٢ الحسابات
    const rows = [['م', 'المدير العام', 'مدير', C.ac], ['ض', 'مشرف مسار الضياء', 'مشرف برنامج', PAL.or], ['ب', 'مشرف نادي البيان', 'مشرف برنامج', PAL.te], ['ع', 'عضو · مسار الضياء', 'عضو', '#777'], ['ع', 'عضو · نادي البيان', 'عضو', '#777'], ['ع', 'عضو · برنامج النخبة', 'عضو', '#777']];
    const tb = A(pages[1], 30, 20, mw - 60, mh - 40, 'mo-card'); css(tb, { borderRadius: '24px' });
    const rEls = rows.map(function (q, i) { const r = A(tb, 0, 16 + i * (v ? 120 : 112), mw - 60, v ? 110 : 100); css(r, { display: 'flex', alignItems: 'center', gap: '18px', padding: '0 26px', borderTop: i ? '1px solid #f0f0f4' : '', fontSize: '22px' }); r.innerHTML = '<i style="width:54px;height:54px;border-radius:50%;flex:none;background:' + rgba(q[3] === '#777' ? '#888888' : q[3], 0.15) + ';color:' + q[3] + ';display:grid;place-items:center;font-style:normal;font-family:var(--mo-fd);font-size:24px">' + q[0] + '</i><span style="flex:1">' + q[1] + '</span><span style="background:' + rgba(q[3] === '#777' ? '#888888' : q[3], 0.12) + ';color:' + q[3] + ';border-radius:99px;padding:6px 16px;font-size:18px">' + q[2] + '</span><i style="width:12px;height:12px;border-radius:50%;background:#2f9e5b;display:inline-block"></i>'; return r; });
    // ٣ البرامج
    const pcs = IDS.slice(0, v ? 4 : 3).map(function (d, i) { const pw2 = v ? (mw - 60 - 20) / 2 : (mw - 60 - 40) / 3, x = v ? mw - 30 - (i % 2 + 1) * pw2 - (i % 2) * 20 : mw - 30 - (i + 1) * pw2 - i * 20, y = v ? 20 + Math.floor(i / 2) * 330 : 30; const t = A(pages[2], x, y, pw2, 310, 'mo-card'); css(t, { padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }); t.innerHTML = '<div style="display:flex;align-items:center;gap:14px"><i style="width:66px;height:66px;border-radius:50%;background:' + d.c[0] + ';color:#fff;display:grid;place-items:center;font-style:normal;font-family:var(--mo-fd);font-size:32px">' + d.g + '</i><b style="font-family:var(--mo-fd);font-size:26px">' + d.n + '</b></div><div style="display:flex;gap:8px">' + d.c.map(function (cc) { return '<i style="width:34px;height:34px;border-radius:10px;background:' + cc + ';display:inline-block;border:1px solid #eee"></i>'; }).join('') + '</div><div style="font-size:18px;color:#666">خطّان · شعاران · ' + ar(6 + i * 3) + ' قوالب</div><div style="display:flex;gap:8px"><span style="background:' + C.t1 + ';color:' + C.ac + ';border-radius:99px;padding:5px 14px;font-size:16px">الأصول</span><span style="background:#f1f1f5;border-radius:99px;padding:5px 14px;font-size:16px">النماذج</span></div>'; return t; });
    // ٤ الإشعارات
    const sm = A(pages[3], 30, 20, mw - 60, v ? 260 : 200, 'mo-card'); css(sm, { padding: '24px 28px', borderRadius: '24px', background: 'linear-gradient(120deg,' + C.soft + ',#fff)' });
    sm.innerHTML = '<div style="display:flex;align-items:center;gap:10px;color:' + C.ac + ';font-weight:600;font-size:20px">' + ico('sparkles', 24, C.ac, 2) + 'ملخّص المساعد</div><div class="smt" style="font-size:24px;line-height:1.6;margin-top:10px"></div>';
    const smt = sm.querySelector('.smt'), smText = 'طلبا مراجعة جديدان، وبلاغ عن خط لا يظهر في قالب، ومنشور مجدول لم يُرسل وأُعيدت محاولته.';
    const nts = [['star', 'طلب مراجعة: إعلان الملتقى', 'مسار الضياء', PAL.pl], ['chat', 'بلاغ: الخط لا يظهر في قالب الساعة', 'نادي البيان', PAL.or], ['send', 'تعذّر إرسال منشور مجدول، وأُعيد', 'برنامج النخبة', PAL.rd]].map(function (q, i) { const r = A(pages[3], 30, (v ? 300 : 240) + i * 116, mw - 60, 104, 'mo-card'); css(r, { borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px', padding: '0 22px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }); r.innerHTML = '<div style="width:54px;height:54px;border-radius:16px;flex:none;display:grid;place-items:center;background:' + rgba(q[3], 0.12) + '">' + ico(q[0], 26, q[3], 2) + '</div><div style="flex:1;font-size:21px;line-height:1.4">' + q[1] + '<div style="font-size:16px;color:#888">' + q[2] + '</div></div>'; return r; });
    const B = [b.ov == null ? 0 : b.ov, b.acc, b.prog, b.nt];
    if (b.ov != null) { k.forEach(function (q, i) { sfx(b.ov + 0.2 + i * 0.1, 'tick', { p: 1 + i * 0.1 }); }); sfx(b.ov + 0.6, 'riser', { d: 0.9, v: 0.1 }); }
    [1, 2, 3].forEach(function (i) { if (B[i] != null) sfx(B[i], 'swish', { d: 0.4, v: 0.2 }); });
    if (b.acc != null) rows.forEach(function (q, i) { sfx(b.acc + 0.2 + i * 0.08, 'tick', { p: 0.9 + i * 0.05, v: 0.12 }); });
    if (b.nt != null) { sfx(b.nt + 0.3, 'shimmer', { f: 1175, v: 0.05 }); sfx(b.nt + 0.3, 'type', { d: 1.6, r: 18, v: 0.12 }); }
    c.up = function (lt) {
      let pg = 0; [1, 2, 3].forEach(function (i) { if (B[i] != null && lt >= B[i]) pg = i; });
      pages.forEach(function (p, i) { const a = i === 0 ? B[0] : B[i]; const on = i === pg; const pin = a == null ? 0 : E.o5(P(lt, a, 0.5)); T(p, { o: on ? (i === 0 ? 1 : P(lt, a, 0.25)) : 0, x: on && i ? (1 - pin) * -40 : 0 }); });
      gEls.forEach(function (g, i) { const on = i === pg; sty(g, 'background', on ? C.ac : (v ? '#fff' : 'transparent')); sty(g, 'color', on ? '#fff' : '#444'); if (v) sty(g, 'borderColor', on ? C.ac : '#e6e6ee'); });
      kEls.forEach(function (q, i) { const p = E.o3(P(lt, B[0] + 0.2 + i * 0.1, 1.2)); txt(q.n, ar(Math.round(q.v * p))); T(q.e, { y: (1 - E.o5(P(lt, B[0] + i * 0.08, 0.6))) * 30, o: P(lt, B[0] + i * 0.08, 0.3) }); });
      bars.forEach(function (bb, i) { const p = E.spr(P(lt, B[0] + 0.6 + (11 - i) * 0.05, 0.8)); T(bb, { sy: Math.max(0.001, p) }); });
      if (b.acc != null) rEls.forEach(function (r, i) { const p = E.o5(P(lt, b.acc + 0.2 + i * 0.08, 0.5)); T(r, { x: (1 - p) * 50, o: p }); });
      if (b.prog != null) pcs.forEach(function (t, i) { const p = E.spr(P(lt, b.prog + 0.2 + i * 0.12, 0.7)); T(t, { s: 0.85 + 0.15 * p, o: P(lt, b.prog + 0.2 + i * 0.12, 0.2) }); });
      if (b.nt != null) { txt(smt, typed(smText, lt, b.nt + 0.3, b.nt + 1.9)); nts.forEach(function (r, i) { const p = E.o5(P(lt, b.nt + 0.4 + i * 0.15, 0.5)); T(r, { y: (1 - p) * 30, o: p }); }); }
    };
    return c;
  }

  /* ---------- مكوّن النشر: النص المصاحب ثم القناة ---------- */
  function cPublish(S, o) {
    const side = !!o.side, b = o.b || {}, sfx = o.sfx || noop;
    const cap = cCaption(S, { b: { type: b.type, pick: b.pick, sch: b.sch, send: b.send }, sfx: sfx });
    const tg = cTG(S, { b: { msg: b.msg, sch: b.sch2 }, when: o.when, sfx: sfx });
    const W = side ? 1300 : 760, H = side ? 1000 : 1040, c = { el: h('div'), w: W, h: H }, e = c.el;
    const wc = A(e, 0, 0, cap.w, cap.h), wt = A(e, 0, 0, tg.w, tg.h);
    [[wc, cap], [wt, tg]].forEach(function (q) { q[0].appendChild(q[1].el); css(q[1].el, { position: 'absolute', left: '0', top: '0', width: q[1].w + 'px', height: q[1].h + 'px' }); q[0].style.transformOrigin = '50% 50%'; });
    if (side) { css(wc, { left: (W - cap.w) + 'px', top: '160px', zIndex: '2' }); css(wt, { left: '0', top: '0' }); }
    else { css(wc, { left: ((W - cap.w) / 2) + 'px', top: ((H - cap.h) / 2) + 'px' }); css(wt, { left: ((W - tg.w) / 2) + 'px', top: ((H - tg.h) / 2) + 'px' }); }
    const sw = b.msg == null ? 1e9 : b.msg - 0.7;
    if (!side && b.msg != null) sfx(sw, 'whoosh', { d: 0.6, v: 0.3 });
    c.up = function (lt) {
      cap.up(lt); tg.up(lt);
      if (side) { const p = E.o5(P(lt, 0.2, 0.8)); T(wt, { x: (1 - p) * -80, o: P(lt, 0.2, 0.3) }); return; }
      const p = E.io3(P(lt, sw, 0.7));
      T(wc, { y: -p * 260, s: 1 - 0.25 * p, o: 1 - P(lt, sw + 0.1, 0.45), b: p * 8 });
      T(wt, { y: (1 - p) * 420, s: 0.85 + 0.15 * p, o: P(lt, sw + 0.15, 0.3) });
    };
    return c;
  }

  /* ================= المشاهد ================= */
  function camera(root, d) { const cam = A(root, 0, 0, null, null); css(cam, { left: '0', top: '0', right: '0', bottom: '0', transformOrigin: '50% 50%' }); return { e: cam, up: function (lt) { T(cam, { s: 1 + 0.035 * (1 - E.o3(P(lt, 0, 0.9))) }); } }; }   // دخول بتقريب يستقر سريعاً ثم ثبات: التكبير البطيء المستمر كان يُرى اهتزازاً في النصوص
  // مشهد قياسي: رأس + مكوّن
  /* ---------- شريحة الدرس المشتركة بين مشهدَي «أدوات الدرس» و«عرض المقدّم» ---------- */
  function lessonSlide(parent, x, y, sw, sh, C) {
    const el = A(parent, x, y, sw, sh); css(el, { overflow: 'hidden', borderRadius: Math.max(6, sw * 0.012) + 'px', background: '#fff' });
    const inner = A(el, 0, 0, sw, sh); css(inner, { transformOrigin: '50% 50%' });
    const bar = A(inner, sw - sw * 0.012, 0, sw * 0.012, sh); css(bar, { background: C.ac });
    const t = A(inner, sw * 0.05, sh * 0.09, sw * 0.9, null, 'mo-kt'); css(t, { fontSize: (sw * 0.056) + 'px', textAlign: 'right', color: '#14141c' }); t.textContent = 'ثلاث صفات للقدوة';
    const rowY = function (k) { return sh * 0.3 + k * sh * 0.17; };
    const rows = ['يعمل بما يقول', 'قريبٌ من الناس', 'ثابتٌ على المبدأ'].map(function (q, k) {
      const r = A(inner, sw * 0.05, rowY(k), sw * 0.9, sh * 0.12); css(r, { display: 'flex', alignItems: 'center', gap: (sw * 0.02) + 'px', fontSize: (sw * 0.036) + 'px', color: '#24242e' });
      r.innerHTML = '<b style="flex:none;width:' + (sw * 0.05) + 'px;height:' + (sw * 0.05) + 'px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:' + (sw * 0.026) + 'px;background:' + [C.ac, PAL.or, PAL.te][k] + '">' + ar(k + 1) + '</b><span>' + q + '</span>';
      return r;
    });
    return { el: el, inner: inner, rows: rows, rowY: rowY };
  }

  /* ---------- أدوات الدرس: القلم والتحديد، والقرعة، ونقاط الفرق ---------- */
  function cLesson(S, o) {
    const v = !!o.v, W = v ? 920 : 1240, H = v ? 1180 : 780, c = comp(W, H), e = c.el, C = S.C, b = o.b || {}, sfx = o.sfx || noop;
    e.style.background = '#16161f';
    const sw = v ? 860 : 1000, sh = sw * 9 / 16, sx = (W - sw) / 2, sy = v ? 150 : 34;
    const ls = lessonSlide(e, sx, sy, sw, sh, C), sl = ls.inner;
    // القلم: خط تحت السطر الثاني، يُرسم كما يُكتب
    const uy = ls.rowY(1) + sh * 0.105, x1 = sw * 0.9, x2 = sw * 0.5;
    const ink = A(sl, 0, 0, sw, sh, null, '<svg viewBox="0 0 ' + sw + ' ' + sh + '" width="' + sw + '" height="' + sh + '" style="width:' + sw + 'px;height:' + sh + 'px;overflow:visible"><path pathLength="1" d="M' + x1 + ' ' + uy + ' Q ' + ((x1 + x2) / 2) + ' ' + (uy + 9) + ' ' + x2 + ' ' + (uy - 3) + '" fill="none" stroke="#e5132b" stroke-width="' + (sw * 0.0065) + '" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="1"/></svg>');
    const pen = ink.querySelector('path');
    // التحديد: لون شفاف يمتد على السطر الثالث
    const mk = A(sl, sw * 0.5, ls.rowY(2) + sh * 0.015, sw * 0.4, sh * 0.09); css(mk, { background: 'rgba(255,212,0,.42)', borderRadius: '4px', transformOrigin: '100% 50%' });
    // نقاط الفرق أعلى الشريحة
    const scb = A(sl, 0, sh * 0.025, sw, sh * 0.08); css(scb, { display: 'flex', justifyContent: 'center', gap: (sw * 0.012) + 'px' });
    const teams = [['الفريق الأول', '#e5484d', 2], ['الفريق الثاني', '#1a71fd', 1], ['الصقور', '#2f9e5c', 0]].map(function (t) {
      const p = h('span', null, scb); css(p, { display: 'inline-flex', alignItems: 'center', gap: (sw * 0.008) + 'px', padding: '0 ' + (sw * 0.016) + 'px', height: (sh * 0.075) + 'px', borderRadius: '99px', background: 'rgba(16,17,24,.86)', color: '#fff', fontSize: (sw * 0.02) + 'px' });
      p.innerHTML = '<i style="width:' + (sw * 0.011) + 'px;height:' + (sw * 0.011) + 'px;border-radius:50%;background:' + t[1] + ';display:block"></i><span>' + t[0] + '</span><b style="font-family:var(--mo-fd);min-width:1.2em;text-align:center">' + ar(t[2]) + '</b>';
      return { e: p, b: p.querySelector('b'), n: t[2] };
    });
    // القرعة كما تظهر للطلاب
    const dim = A(sl, 0, 0, sw, sh); css(dim, { background: 'rgba(0,0,0,.45)' });
    const cw = sw * 0.44, card = A(dim, (sw - cw) / 2, sh * 0.13, cw, null); css(card, { background: '#fff', borderRadius: (sw * 0.024) + 'px', padding: (sw * 0.02) + 'px', display: 'flex', flexDirection: 'column', gap: (sw * 0.012) + 'px', boxShadow: '0 30px 80px rgba(0,0,0,.45)' });
    card.innerHTML = '<b style="font-size:' + (sw * 0.022) + 'px">القرعة</b><div style="display:flex;align-items:center;justify-content:center;gap:' + (sw * 0.008) + 'px;font-size:' + (sw * 0.018) + 'px"><span>من</span><i style="font-style:normal;min-width:' + (sw * 0.07) + 'px;text-align:center;padding:' + (sw * 0.005) + 'px 0;border-radius:99px;box-shadow:inset 0 0 0 1px #d9d9de">1</i><span>إلى</span><i style="font-style:normal;min-width:' + (sw * 0.07) + 'px;text-align:center;padding:' + (sw * 0.005) + 'px 0;border-radius:99px;box-shadow:inset 0 0 0 1px #d9d9de">30</i></div><div class="pkn" style="text-align:center;font-family:var(--mo-fd);font-weight:700;font-size:' + (sw * 0.07) + 'px;line-height:1.3;padding:' + (sw * 0.016) + 'px 0;border-radius:' + (sw * 0.018) + 'px;background:#f4f4f6;color:#6b6b72">؟</div><small class="pki" style="text-align:center;color:#6b6b72;font-size:' + (sw * 0.017) + 'px;min-height:1.3em"></small>';
    const pkn = card.querySelector('.pkn'), pki = card.querySelector('.pki');
    // شريط الأدوات تحت الشريحة
    const tools = [['pen', 'القلم', 'pen'], ['marker', 'التحديد', 'mark'], ['dice', 'القرعة', 'pick'], ['trophy', 'النقاط', 'sc']];
    const dy = sy + sh + (v ? 50 : 24), dock = A(e, 0, dy, W, 96); css(dock, { display: 'flex', justifyContent: 'center', gap: '12px' });
    const tEls = tools.map(function (t) { const d = h('div', null, dock); css(d, { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', width: (v ? 150 : 132) + 'px', height: '92px', borderRadius: '20px', background: 'rgba(255,255,255,.07)', color: '#cfcfdb', fontSize: '19px' }); d.innerHTML = ico(t[0], 30, 'currentColor', 2) + '<span>' + t[1] + '</span>'; return { e: d, k: t[2], on: null }; });
    const won = b.pick != null ? b.pick + 1.9 : null;
    if (b.pen != null) sfx(b.pen, 'swish', { d: 0.6, v: 0.25 });
    if (b.mark != null) sfx(b.mark, 'swish', { d: 0.5, v: 0.2 });
    if (b.pick != null) { sfx(b.pick, 'pop', { p: 0.9, v: 0.35 }); for (let k = 0; k < 9; k++) sfx(b.pick + 0.35 + k * 0.17, 'tick', { p: 1 + k * 0.04 }); sfx(won, 'impact', { v: 0.5 }); sfx(won + 0.05, 'shimmer', { f: 1320, v: 0.06 }); }
    if (b.sc != null) { sfx(b.sc, 'pop', { p: 1, v: 0.3 }); sfx(b.sc + 0.7, 'pop', { p: 1.2, v: 0.3 }); }
    if (b.bump != null) sfx(b.bump, 'pop', { p: 1.4, v: 0.4 });
    c.up = function (lt) {
      const has = function (k) { return b[k] != null && lt >= b[k]; };
      pen.style.strokeDashoffset = b.pen != null ? String(1 - E.io3(P(lt, b.pen, 0.8))) : '1';
      T(mk, { sx: b.mark != null ? Math.max(0.001, E.o3(P(lt, b.mark, 0.6))) : 0.001, o: b.mark != null && lt >= b.mark ? 1 : 0 });
      // القرعة
      const pkOn = b.pick != null ? io(lt, b.pick, b.pickOut, 0.35, 0.35) : 0; T(dim, { o: pkOn }); T(card, { s: 0.9 + 0.1 * E.spr(P(lt, b.pick || 0, 0.6)), o: pkOn });
      if (b.pick != null && lt >= b.pick) {
        const w = lt >= won, n = w ? 17 : 1 + (Math.floor((lt - b.pick) * 6) * 11) % 30, txt = w ? ar(17) : ar(n);
        if (pkn._t !== txt) { pkn.textContent = txt; pkn._t = txt; }
        const st = w ? 'w' : 's'; if (pkn._s !== st) { css(pkn, w ? { background: '#1a71fd', color: '#fff' } : { background: '#f4f4f6', color: '#6b6b72' }); pkn._s = st; pki.textContent = w ? 'بقي ٢٩ في القرعة' : ''; }
        T(pkn, { s: w ? 0.85 + 0.15 * E.spr(P(lt, won, 0.55)) : 1 });
      }
      // النقاط
      T(scb, { o: b.sc != null ? E.o3(P(lt, b.sc, 0.4)) : 0, y: b.sc != null ? (1 - E.o5(P(lt, b.sc, 0.6))) * -20 : 0 });
      T(teams[2].e, { s: b.sc != null ? 0.4 + 0.6 * E.spr(P(lt, b.sc + 0.7, 0.6)) : 0, o: b.sc != null ? P(lt, b.sc + 0.7, 0.15) : 0 });
      const bumped = b.bump != null && lt >= b.bump, bt = bumped ? ar(1) : ar(0);
      if (teams[2].b.textContent !== bt) teams[2].b.textContent = bt;
      T(teams[2].b, { s: bumped ? 1 + 0.6 * (1 - E.o3(P(lt, b.bump, 0.5))) : 1 });
      // الأداة الفاعلة
      let act = ''; ['pen', 'mark', 'pick', 'sc'].forEach(function (k) { if (has(k)) act = k; }); if (act === 'pick' && b.pickOut != null && lt >= b.pickOut && !has('sc')) act = '';
      tEls.forEach(function (t) { const on = t.k === act; if (t.on !== on) { css(t.e, on ? { background: PAL.or, color: '#fff' } : { background: 'rgba(255,255,255,.07)', color: '#cfcfdb' }); t.on = on; } });
    };
    return c;
  }

  /* ---------- عرض المقدّم: الطلاب يرون الشريحة، ولوحة المقدّم عائمة لا تدخل في المشاركة ---------- */
  function cPresenter(S, o) {
    const v = !!o.v, W = v ? 920 : 1240, H = v ? 1180 : 780, c = comp(W, H), e = c.el, C = S.C, b = o.b || {}, sfx = o.sfx || noop;
    e.style.background = 'linear-gradient(160deg,#eeedf3,#e2e1ea)';
    // نافذة اللقاء: ما يراه الطلاب
    const mw = v ? 880 : 880, mh = v ? 560 : 560, mx = v ? 20 : W - 20 - mw, my = v ? 24 : 24;
    const win = A(e, mx, my, mw, mh, 'mo-card'); css(win, { borderRadius: '20px', overflow: 'hidden', background: '#202124' });
    const bar = A(win, 0, 0, mw, 52); css(bar, { background: '#2b2c30', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 18px', color: '#e8eaed', fontSize: '19px', boxSizing: 'border-box' });
    bar.innerHTML = '<i style="width:12px;height:12px;border-radius:50%;background:#ea4335;display:block"></i><span style="flex:1">لقاء الدرس · مشاركة علامة التبويب</span><span style="display:inline-flex;align-items:center;gap:8px;padding:5px 12px;border-radius:99px;background:rgba(234,67,53,.18);color:#ff8a80;font-size:16px">' + ico('eye', 18, 'currentColor', 2) + 'يراها الطلاب</span>';
    const sw = mw - 40, sh = sw * 9 / 16, slide = lessonSlide(win, 20, 52 + (mh - 52 - sh) / 2, sw, sh, C);
    // اللوحة العائمة
    const pw = v ? 620 : 500, ph = v ? 560 : 560, px = v ? (W - pw) / 2 : 22, py = v ? my + mh - 40 : H - ph - 22;
    const pnl = A(e, px, py, pw, ph); css(pnl, { background: '#101118', borderRadius: '22px', boxShadow: '0 40px 90px -20px rgba(10,10,30,.55), 0 0 0 1px rgba(255,255,255,.06)', color: '#ececf3', overflow: 'hidden' });
    const hd = A(pnl, 20, 16, pw - 40, 40); css(hd, { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', fontWeight: '600' });
    hd.innerHTML = '<i style="width:9px;height:9px;border-radius:50%;background:#ff5a4f;display:block"></i><span style="flex:1">لوحة المقدّم</span><span style="display:inline-flex;align-items:center;gap:7px;padding:4px 12px;border-radius:99px;background:rgba(71,196,134,.14);color:#7fdcab;font-size:15px;font-weight:500">' + ico('lock', 16, 'currentColor', 2) + 'لا يراها الطلاب</span>';
    const lab = A(pnl, 20, 64, pw - 40, 24); css(lab, { fontSize: '14px', color: '#8e8fa3', textAlign: 'center' }); lab.textContent = '● ما يراه الطلاب الآن';
    const nw = pw - 40, nh = nw * 9 / 16, mini = lessonSlide(pnl, 20, 92, nw, nh, C);
    const zr = A(mini.el, 0, 0, nw / 2, nh / 2); css(zr, { border: '3px solid #ffb54a', borderRadius: '4px', boxShadow: '0 0 0 999px rgba(0,0,0,.45)', boxSizing: 'border-box' });
    const zl = A(zr, -3, -3, null, null); css(zl, { background: '#ffb54a', color: '#1a1206', fontSize: '13px', fontWeight: '700', padding: '1px 8px', borderRadius: '3px 0 6px 0', whiteSpace: 'nowrap' }); zl.textContent = 'يراها الطلاب ×٢';
    const ny = 92 + nh + 14, nb = A(pnl, 20, ny, pw - 40, ph - ny - 84); css(nb, { background: '#171821', borderRadius: '16px', padding: '12px 16px', boxSizing: 'border-box', fontSize: '19px', lineHeight: '1.7' });
    nb.innerHTML = '<div style="font-size:14px;color:#8e8fa3;font-weight:600">ملاحظاتك</div><div class="nt"></div>';
    const nt = nb.querySelector('.nt'), NOTE = 'اسألهم: أيّ الصفات أصعب؟ ثم القرعة.';
    const ft = A(pnl, 20, ph - 70, pw - 40, 52); css(ft, { display: 'flex', alignItems: 'center', gap: '8px' });
    const tm = h('span', null, ft); css(tm, { display: 'inline-flex', alignItems: 'baseline', gap: '8px', padding: '8px 14px', borderRadius: '12px', background: '#171821', fontSize: '14px', color: '#8e8fa3' }); tm.innerHTML = 'بقي <b style="font-family:var(--mo-fd);font-size:22px;color:#ececf3;direction:ltr">٤:١٢</b>';
    const tmb = tm.querySelector('b');
    h('span', null, ft).style.flex = '1';
    const tb = ['pen', 'zoomin', 'dice', 'trophy'].map(function (k) { const d = h('span', null, ft); css(d, { width: '46px', height: '46px', borderRadius: '12px', display: 'grid', placeItems: 'center', background: '#1d1e29', color: '#cfcfdb' }); d.innerHTML = ico(k, 22, 'currentColor', 2); return { e: d, k: k, on: null }; });
    const nxt = h('span', null, ft); css(nxt, { display: 'inline-flex', alignItems: 'center', gap: '6px', height: '46px', padding: '0 16px', borderRadius: '12px', background: PAL.or, color: '#fff', fontSize: '17px', fontWeight: '600' }); nxt.textContent = 'التالي';
    // التكبير حول السطر الثالث
    const fx = 0.68, fy = (slide.rowY(2) + sh * 0.06) / sh, Z = 2;
    if (b.win != null) sfx(b.win, 'whoosh', { d: 0.5, v: 0.25 });
    if (b.pnl != null) { sfx(b.pnl, 'whoosh', { d: 0.6, v: 0.3 }); sfx(b.pnl + 0.3, 'pop', { p: 0.9, v: 0.3 }); }
    if (b.note) for (let k = 0; k < 8; k++) sfx(b.note[0] + k * (b.note[1] - b.note[0]) / 8, 'tick', { p: 1.2 + (k % 3) * 0.08, v: 0.14 });
    if (b.zoom != null) { sfx(b.zoom, 'pop', { p: 1.1, v: 0.3 }); sfx(b.zoom + 0.3, 'riser', { d: 0.5, v: 0.18 }); }
    c.up = function (lt) {
      const wIn = b.win != null ? E.o5(P(lt, b.win, 0.6)) : 1; T(win, { o: wIn, s: 0.96 + 0.04 * wIn });
      const pIn = b.pnl != null ? E.spr(P(lt, b.pnl, 0.8)) : 0; T(pnl, { o: b.pnl != null ? P(lt, b.pnl, 0.2) : 0, y: (1 - pIn) * 70, s: 0.94 + 0.06 * pIn });
      if (b.note) { const n = Math.round(NOTE.length * cl(P(lt, b.note[0], b.note[1] - b.note[0]))), s = NOTE.slice(0, n); if (nt._t !== s) { nt.textContent = s; nt._t = s; } }
      const left = Math.max(0, 252 - Math.floor(Math.max(0, lt - (b.pnl || 0)))), ts = ar(Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2)); if (tmb._t !== ts) { tmb.textContent = ts; tmb._t = ts; }
      // التكبير: في اللوحة إطار حول ما يراه الطلاب، وعندهم الشريحة مكبّرة
      const zp = b.zoom != null ? E.io3(P(lt, b.zoom + 0.35, 0.7)) * (b.zout != null ? 1 - E.io3(P(lt, b.zout, 0.6)) : 1) : 0, z = 1 + (Z - 1) * zp;
      const cx = Math.max(0.5 / Z, Math.min(1 - 0.5 / Z, fx)), cy = Math.max(0.5 / Z, Math.min(1 - 0.5 / Z, fy));
      T(slide.inner, { s: z, x: (0.5 - cx) * sw * z * zp, y: (0.5 - cy) * sh * z * zp });
      css(zr, { left: ((cx - 0.25) * nw) + 'px', top: ((cy - 0.25) * nh) + 'px' }); T(zr, { o: b.zoom != null ? io(lt, b.zoom, b.zout, 0.3, 0.3) : 0, s: 1.3 - 0.3 * E.o5(P(lt, b.zoom || 0, 0.5)) });
      const zon = b.zoom != null && lt >= b.zoom && (b.zout == null || lt < b.zout);
      tb.forEach(function (t) { const on = t.k === 'zoomin' && zon; if (t.on !== on) { css(t.e, on ? { background: 'rgba(240,140,58,.18)', color: '#ffb27a' } : { background: '#1d1e29', color: '#cfcfdb' }); t.on = on; } });
    };
    return c;
  }

  function stdScene(d, opt, mkComp, beats, compAt) {
    return {
      d: d, tr: opt.tr, td: opt.td, ch: opt.ch,
      build: function (S, root) {
        const cam = camera(root, d), hd = head(S, cam.e, opt), L = lay(S);
        const at = compAt == null ? 0.35 : compAt;
        const cp = mkComp(S, { v: S.v, b: beats, sfx: function (t, k, x) { S.sfx(t + at, k, x); } });
        const pl = place(cam.e, cp, opt.box ? opt.box(S, L) : L.box);
        if (opt.extra) opt.extra(S, cam.e, pl);
        S.sfx(at, 'whoosh', { d: 0.6, v: 0.22 });
        return function (lt) { cam.up(lt); hd.up(lt, 0.05, d - 0.55); pl.enter(lt, at, d - 0.5); cp.up(lt - at); if (opt.extraUp) opt.extraUp(lt); };
      }
    };
  }

  const L_SCENES = [
    { d: 3.9, ch: 'أثر', build: function (S, root) {
      root.style.background = '#fff';
      const cam = camera(root, 3.9), C = S.C, m = S.v ? 380 : 320, cx = S.W / 2, cy = S.H / 2 - (S.v ? 170 : 120);
      const rings = [0, 1, 2].map(function (i) { const r = A(cam.e, cx - m / 2, cy - m / 2, m, m); css(r, { borderRadius: '50%', border: (6 - i * 1.5) + 'px solid ' + (i === 1 ? PAL.or : C.ac) }); return r; });
      const parts = []; const R = rng(11);
      for (let i = 0; i < 14; i++) { const s = 10 + R() * 18, p = A(cam.e, cx - s / 2, cy - s / 2, s, s); css(p, { borderRadius: '50%', background: [C.ac, PAL.or, PAL.te, C.ac3][i % 4] }); parts.push({ e: p, a: i / 14 * Math.PI * 2 + R() * 0.3, r: m * (0.75 + R() * 0.55) }); }
      const dot = A(cam.e, cx - m / 2, cy - m / 2, m, m); css(dot, { borderRadius: '50%', background: C.ac });
      const mk = A(cam.e, cx - m / 2, cy - m / 2, m, m, null, brandSVG('mark', C.ac));
      const t1 = KT(cam.e, 'منصة الأثر الإعلامي', { x: 40, y: cy + m / 2 + 50, w: S.W - 80, size: S.v ? 96 : 88, align: 'center', st: 0.09 });
      const t2 = KT(cam.e, 'تصاميم برامجكم في مكان واحد', { x: 40, y: cy + m / 2 + (S.v ? 190 : 175), w: S.W - 80, size: S.v ? 46 : 42, font: 't', color: '#5d5d68', align: 'center', st: 0.04 });
      S.sfx(0.15, 'pop', { p: 0.8, v: 0.5 }); S.sfx(0.3, 'riser', { d: 0.85, v: 0.28 }); S.sfx(1.15, 'impact', { v: 0.9 }); S.sfx(1.2, 'shimmer', { f: 1320, v: 0.07 }); S.sfx(1.6, 'swish', { d: 0.5, v: 0.2 });
      return function (lt) {
        cam.up(lt);
        const pd = E.spr(P(lt, 0.15, 0.35)), grow = E.spr2(P(lt, 0.75, 0.55));
        T(dot, { s: lt < 0.75 ? 0.09 * pd : 0.09 + 0.91 * grow, o: P(lt, 0.15, 0.05) });
        const rv = E.io3(P(lt, 1.1, 0.5)); sty(mk, 'clipPath', 'inset(0 0 0 ' + ((1 - rv) * 100).toFixed(1) + '%)'); T(mk, { o: lt > 1.1 ? 1 : 0, s: 1 + 0.06 * (1 - E.o5(P(lt, 1.15, 0.6))) });
        rings.forEach(function (r, i) { const p = P(lt, 1.15 + i * 0.08, 1.1); T(r, { s: 1 + E.o3(p) * (1.6 + i * 0.5), o: (1 - p) * 0.55 * (p > 0 ? 1 : 0) }); });
        parts.forEach(function (q) { const p = E.o5(P(lt, 1.15, 1.2)); T(q.e, { x: Math.cos(q.a) * q.r * p, y: Math.sin(q.a) * q.r * p, o: (p > 0 ? 1 : 0) * (1 - P(lt, 1.6, 0.8)), s: 1 - 0.5 * p }); });
        t1.up(lt, 1.5, 3.55, { mode: 'blur' }); t2.up(lt, 2.05, 3.6);
      };
    } },
    { d: 5.6, tr: 'zoom', td: 0.6, ch: 'من الفكرة إلى القناة', build: function (S, root) {
      root.style.background = '#fff';
      const C = S.C, sz = S.v ? 132 : 140, w = S.W - (S.v ? 120 : 260);
      const cbox = function () { const b = A(root, (S.W - w) / 2, 0, w, S.H); css(b, { display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '2' }); return b; };
      const l1 = KT(cbox(), 'من *فكرةٍ* في بالك', { flow: 1, w: w, size: sz, align: 'center', hl: C.pop });
      const l2 = KT(cbox(), 'إلى *إعلانٍ* بهوية برنامجك', { flow: 1, w: w, size: sz, align: 'center', hl: PAL.or });
      const iris = A(root, 0, 0, S.W, S.H); css(iris, { background: 'linear-gradient(140deg,' + C.ac + ',' + C.ac2 + ')' });
      const glow = A(iris, S.W * 0.1, S.H * 0.1, S.W * 0.8, S.W * 0.8); css(glow, { borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,255,255,.18),transparent 65%)' });
      const l3 = KT(cbox(), 'إلى قناتك… _في دقائق_', { flow: 1, w: w, size: sz * 1.05, align: 'center', color: '#fff', mk: 'rgba(255,255,255,.28)' });
      const fake = [0, 1, 2].map(function (i) { const e = A(root, 0, 0, 10, 10); return e; });
      S.sfx(0.05, 'whoosh', { d: 0.5, v: 0.3 }); S.sfx(1.85, 'whoosh', { d: 0.5, v: 0.3, pa: -0.6, pb: 0.6 }); S.sfx(3.25, 'riser', { d: 0.45, v: 0.18 }); S.sfx(3.7, 'impact', { v: 0.7 }); S.sfx(3.85, 'shimmer', { f: 1568, v: 0.06 });
      return function (lt) {
        l1.up(lt, 0.1, 1.6, { mode: 'slam', st: 0.1, du: 0.7 }); l2.up(lt, 1.9, 3.35, { mode: 'slam', st: 0.1, du: 0.7 });
        const ip = E.io3(P(lt, 3.3, 0.55)); sty(iris, 'clipPath', 'circle(' + (ip * 75).toFixed(2) + '% at 50% 50%)'); T(iris, { o: lt >= 3.3 ? 1 : 0 });
        T(glow, { x: Math.sin(lt * 1.3) * 60, y: Math.cos(lt) * 40 });
        l3.up(lt, 3.75, null, { mode: 'blur', st: 0.12, du: 0.8 });
      };
    } },
    { d: 6.4, tr: 'wipe', td: 0.8, ch: 'القوالب والهويات', build: function (S, root) {
      const cam = camera(root, 6.4), C = S.C, L = lay(S);
      const hd = head(S, cam.e, { eb: 'القوالب والهويات', ic: 'grid', h: 'قوالب بهوية _كل برنامج_', sub: 'اختر البرنامج… فتتلوّن القوالب كلها بهويته' });
      const bx = L.box, cols = 3, pw = S.v ? 300 : 296, ph = pw * 1.25, gap = S.v ? 36 : 40;
      const gw = cols * pw + (cols - 1) * gap, gx = bx.x + (bx.w - gw) / 2, gy = bx.y + (S.v ? 120 : 110);
      const chips = []; let cx = bx.x + bx.w - (bx.w - gw) / 2;
      [0, 1, 3].forEach(function (k) { const d = IDS[k], w = 100 + d.n.length * 17; cx -= w; const ch = A(cam.e, cx, bx.y + 10, w, 64, 'mo-pill', '<i style="width:34px;height:34px;border-radius:50%;background:' + d.c[0] + ';display:grid;place-items:center;color:#fff;font-style:normal;font-size:18px;font-family:var(--mo-fd)">' + d.g + '</i><span>' + d.n + '</span>'); css(ch, { fontSize: '23px', background: '#fff', color: '#222', boxShadow: '0 2px 10px rgba(0,0,0,.08)', border: '2px solid transparent' }); chips.push({ e: ch, k: k }); cx -= 14; });
      const lays = ['circle', 'clock', 'panel', 'arch', 'bold', 'split'], tts = ['اللقاء الافتتاحي', 'إدارة الوقت', 'فن الإلقاء', 'يوم الاقتداء', 'مسابقة الحفظ', 'حفل التكريم'];
      const ps = lays.map(function (l, i) { const x = gx + gw - (i % 3 + 1) * pw - (i % 3) * gap, y = gy + Math.floor(i / 3) * (ph + gap); return poster(cam.e, x, y, pw, ph, { lay: l, c: IDS[0].c, title: tts[i], sub: i % 2 ? 'أ. خالد العمر' : 'للشباب من ١٥ إلى ١٨', g: IDS[0].g }); });
      const t1 = 2.5, t2 = 4.0;
      const cur = Cursor(cam.e, [[1.6, S.W * 0.5, S.H * 0.92], [t1, parseFloat(chips[1].e.style.left) + 80, bx.y + 42, 1], [t2, parseFloat(chips[2].e.style.left) + 80, bx.y + 42, 1]], S.sfx, { color: C.ac, end: 5.0 });
      S.sfx(0.5, 'whoosh', { d: 0.6, v: 0.3 }); ps.forEach(function (p, i) { S.sfx(0.75 + i * 0.08, 'pop', { p: 0.8 + i * 0.08, v: 0.25 }); });
      S.sfx(t1 + 0.05, 'shimmer', { f: 1320, v: 0.06 }); S.sfx(t1 + 0.05, 'whoosh', { d: 0.8, v: 0.2 }); S.sfx(t2 + 0.05, 'shimmer', { f: 1568, v: 0.06 }); S.sfx(t2 + 0.05, 'whoosh', { d: 0.8, v: 0.2 });
      return function (lt) {
        cam.up(lt); hd.up(lt, 0.05, 5.9);
        chips.forEach(function (c2, i) { const p = E.spr(P(lt, 0.9 + i * 0.1, 0.6)), on = (lt >= t2 ? 2 : lt >= t1 ? 1 : 0) === i; T(c2.e, { s: (0.7 + 0.3 * p) * (on ? 1.04 : 1), o: P(lt, 0.9 + i * 0.1, 0.2) * (1 - P(lt, 5.9, 0.3)) }); sty(c2.e, 'borderColor', on ? IDS[c2.k].c[0] : 'transparent'); });
        ps.forEach(function (p, i) {
          const a = 0.6 + i * 0.08, q = E.spr(P(lt, a, 0.95)), side = (i % 3) - 1;
          const w1 = E.io3(P(lt, t1 + 0.1 + i * 0.07, 0.5)), w2 = E.io3(P(lt, t2 + 0.1 + i * 0.07, 0.5));
          const c1 = [0, 1, 2, 3].map(function (k) { return mix(IDS[0].c[k], IDS[1].c[k], w1); });
          p.set([0, 1, 2, 3].map(function (k) { return mix(c1[k], IDS[3].c[k], w2); }));
          const bump = Math.sin(Math.PI * w1) * 0.05 + Math.sin(Math.PI * w2) * 0.05, x = 1 - P(lt, 5.85 + i * 0.02, 0.4);
          T(p.e, { y: (1 - q) * 520, r: (1 - q) * side * 16, s: (0.7 + 0.3 * q) * (1 + bump), o: P(lt, a, 0.2) * x, b: (1 - x) * 8 });
        });
        cur.up(lt);
      };
    } },
    stdScene(6.8, { tr: 'push', td: 0.6, ch: 'المحرر', eb: 'المحرر', ic: 'pencil', h: 'محرر سهل… _وكل شيء بيدك_', sub: 'اكتب، ولوّن، وحرّك، ثم نزّل بجودة كاملة' }, cEditor, { type: [1.0, 2.4], col: 2.9, sel: 3.75, dl: 5.15 }),
    stdScene(7.4, { tr: 'iris', td: 0.75, ch: 'اصنع إعلانك', eb: 'اصنع إعلانك', ic: 'sparkles', h: 'قل ما تريد… _ونصمّمه لك_', sub: 'يسألك سؤالًا قصيرًا، ويقترح ثلاثة اتجاهات جاهزة' }, cMake, { type: [0.7, 2.3], go: 2.55, q: 3.0, res: 4.25, pick: 5.55 }),
    { d: 4.8, tr: 'zoom', td: 0.6, ch: 'العناصر', build: function (S, root) {
      const cam = camera(root, 4.8), C = S.C, L = lay(S);
      const hd = head(S, cam.e, { eb: 'في المحرر', ic: 'shapes', h: 'كل ما يحتاجه _تصميمك_', sub: 'آيات وأحاديث موثّقة، ورموز وأيقونات، وزخارف وصور' });
      const bx = L.box, cols = S.v ? 2 : 3, tw = S.v ? 455 : 296, th = S.v ? 330 : 400, gap = S.v ? 34 : 36;
      const gw = cols * tw + (cols - 1) * gap, gx = bx.x + (bx.w - gw) / 2, rows = 6 / cols, gy = bx.y + (bx.h - (rows * th + (rows - 1) * gap)) / 2;
      const defs = [['آية أو حديث', PAL.te], ['رمز QR', C.ac], ['أيقونات', PAL.or], ['زخارف هندسية', PAL.pl], ['مكتبة صور', PAL.bl], ['تصحيح وتشكيل', PAL.gr]];
      const tiles = defs.map(function (q, i) {
        const x = gx + gw - (i % cols + 1) * tw - (i % cols) * gap, y = gy + Math.floor(i / cols) * (th + gap), t = A(cam.e, x, y, tw, th, 'mo-card'); t.style.overflow = 'hidden';
        const vh = th - 92, vis = A(t, 0, 0, tw, vh); css(vis, { background: rgba(q[1], 0.08), display: 'grid', placeItems: 'center', overflow: 'hidden' });
        const lb = A(t, 20, vh + 20, tw - 40, 50); css(lb, { fontFamily: 'var(--mo-fd)', fontSize: '31px', fontWeight: '700', textAlign: 'center', whiteSpace: 'nowrap' }); lb.textContent = q[0];
        if (i === 0) { vis.innerHTML = '<div style="text-align:center;padding:0 20px"><div style="font-family:var(--mo-fd);font-size:' + (S.v ? 36 : 32) + 'px;color:' + q[1] + ';line-height:1.6">﴿وَقُل رَّبِّ زِدْنِي عِلْمًا﴾</div><div style="font-size:20px;color:#777">طه: ١١٤</div></div>'; }
        else if (i === 1) { vis.innerHTML = '<div style="width:' + (vh * 0.62) + 'px;height:' + (vh * 0.62) + 'px;border-radius:14px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,.12)">' + qrSVG(21, '#111') + '</div>'; }
        else if (i === 2) { const isz = Math.round(Math.min(tw, vh) * 0.2); vis.innerHTML = '<div style="display:grid;grid-template-columns:repeat(3,' + isz + 'px);gap:' + Math.round(isz * 0.45) + 'px">' + ['star', 'book', 'mic', 'cal', 'leaf', 'moon'].map(function (n) { return ico(n, isz, q[1], 1.8); }).join('') + '</div>'; }
        else if (i === 3) { vis.innerHTML = '<div style="width:100%;height:100%">' + starPattern(q[1]) + '</div>'; }
        else if (i === 4) { vis.innerHTML = '<svg viewBox="0 0 300 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="mosky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd9a8"/><stop offset="1" stop-color="#ffefe0"/></linearGradient></defs><rect width="300" height="200" fill="url(#mosky)"/><circle cx="200" cy="90" r="34" fill="#ffb25b"/><path d="M0 150 70 95l60 45 50-35 120 70v25H0z" fill="#5a8f6a"/><path d="M0 170 90 125l70 40 60-25 80 40v20H0z" fill="#3c6e50"/></svg>'; }
        else { vis.innerHTML = '<div style="text-align:center;font-size:' + (S.v ? 34 : 30) + 'px;line-height:1.7"><div style="color:#b0b0ba;text-decoration:line-through">الاسبوع القادم</div><div style="color:' + q[1] + ';font-family:var(--mo-fd);font-weight:700">الأسبوعَ القادمَ</div></div>'; }
        return t;
      });
      tiles.forEach(function (t, i) { S.sfx(0.55 + i * 0.16, 'pop', { p: 0.85 + i * 0.09, v: 0.32 }); });
      return function (lt) { cam.up(lt); hd.up(lt, 0.05, 4.3); tiles.forEach(function (t, i) { const a = 0.5 + i * 0.16, p = E.spr(P(lt, a, 0.7)), x = P(lt, 4.25 + i * 0.03, 0.35); T(t, { s: (0.55 + 0.45 * p) * (1 - 0.1 * x), r: (1 - p) * (i % 2 ? 8 : -8), o: P(lt, a, 0.15) * (1 - x), b: x * 8 }); }); };
    } },
    stdScene(7.6, { tr: 'wipe', td: 0.8, ch: 'النشر', eb: 'النشر', ic: 'send', h: 'انشر _بضغطة_', sub: 'نصٌّ مصاحب يُكتب لك، ثم إلى قناتك… الآن أو في موعده', box: function (S, L) { return L.box; } }, function (S, o) { return cPublish(S, Object.assign(o, { side: !S.v, when: 'اليوم' })); }, { type: [0.9, 2.7], send: 3.35, msg: 4.25 }),
    stdScene(6.4, { tr: 'push', td: 0.6, ch: 'التقويم والمهام', eb: 'التقويم والمهام', ic: 'cal', h: 'كل موعد _في مكانه_', sub: 'منشوراتك ومهامك في تقويم واحد، بتذكير في وقته' }, cCal, { ev: 0.6, drag: 1.9, tasks: 3.3, rem: 4.7 }),
    stdScene(6.8, { tr: 'iris', td: 0.75, ch: 'الشرائح والعروض', eb: 'الشرائح والعروض', ic: 'slides', h: 'من درسٍ إلى _عرضٍ حيّ_', sub: 'انتقالات وحركة، وأسئلة ومؤقّت، وملاحظات للمقدّم' }, cSlides, { doc: 0.4, s1: 2.1, s2: 3.0, s3: 4.6, s4: 5.6 }),
    stdScene(7.0, { tr: 'push', td: 0.6, ch: 'أدوات الدرس', eb: 'أدوات الدرس', ic: 'pen', h: 'الدرس _بين يديك_', sub: 'قلمٌ على الشريحة، وقرعةٌ بلا تكرار، ونقاطٌ للفرق' }, cLesson, { pen: 0.5, mark: 1.3, pick: 2.1, pickOut: 4.5, sc: 4.6, bump: 5.6 }),
    stdScene(7.4, { tr: 'wipe', td: 0.8, ch: 'عرض المقدّم', eb: 'عرض المقدّم', ic: 'slides', h: 'يرون الشريحة… _ولوحتك لك_', sub: 'ملاحظاتك والمؤقّت والتكبير في لوحة عائمة لا تدخل في المشاركة' }, cPresenter, { win: 0.1, pnl: 0.9, note: [1.7, 3.2], zoom: 3.7 }),
    stdScene(6.4, { tr: 'wipe', td: 0.8, ch: 'المراجعة والفريق', eb: 'المراجعة والفريق', ic: 'users', h: 'رأيٌ _قبل النشر_', sub: 'تقييم فوري من المصمّم الذكي، وملاحظات مشرفك على التصميم نفسه' }, cReview, { rv: 0.6, cm: 3.0, req: 4.0 }),
    stdScene(6.6, { tr: 'push', td: 0.6, ch: 'التطبيق', eb: 'التطبيق', ic: 'phone', h: 'وفي _جيبك_ أيضًا', sub: 'ثبّته على هاتفك، وصمّم وانشر من أي مكان' }, cPhone, { plus: 1.0, sheet: 2.6, pub: 4.6 }),
    { d: 6.2, tr: 'iris', td: 0.7, ch: 'بالأرقام', build: function (S, root) {
      const C = S.C, items = [['٤٠', 'قالبًا بهويات برامجكم', C.ac, 40], ['١٠٣', 'نصيحة تصميم مصوّرة', '#c4561a', 103], ['٩٤', 'أيقونة جاهزة', PAL.te, 94], ['١٢', 'انتقالًا للشرائح', '#1d1d2b', 12]];
      const step = 1.45;
      const pans = items.map(function (q, i) {
        const p = A(root, 0, 0, S.W, S.H); css(p, { background: q[2], overflow: 'hidden' });
        const ci = A(p, S.W * (S.v ? -0.2 : 0.55), S.H * (S.v ? 0.55 : -0.3), S.v ? 900 : 1100, S.v ? 900 : 1100); css(ci, { borderRadius: '50%', background: 'rgba(255,255,255,.07)' });
        const n = A(p, 0, S.H / 2 - (S.v ? 300 : 260), S.W, null); css(n, { fontFamily: 'var(--mo-fd)', fontWeight: '700', fontSize: (S.v ? 330 : 300) + 'px', color: '#fff', textAlign: 'center', lineHeight: '1.1' });
        const l = A(p, 60, S.H / 2 + (S.v ? 110 : 90), S.W - 120, null); css(l, { fontFamily: 'var(--mo-fd)', fontWeight: '700', fontSize: (S.v ? 76 : 72) + 'px', color: 'rgba(255,255,255,.92)', textAlign: 'center' }); l.textContent = q[1];
        return { p: p, n: n, l: l, ci: ci, v: q[3] };
      });
      items.forEach(function (q, i) { S.sfx(i * step + (i ? -0.05 : 0.1), i ? 'whoosh' : 'impact', { d: 0.45, v: i ? 0.35 : 0.6 }); for (let k = 0; k < 6; k++) S.sfx(i * step + 0.15 + k * 0.07, 'tick', { p: 0.9 + k * 0.08, v: 0.12 }); });
      return function (lt) {
        pans.forEach(function (q, i) {
          const a = i * step, inP = i ? E.o5(P(lt, a - 0.05, 0.5)) : 1;
          T(q.p, { x: i ? (1 - inP) * -S.W : 0, o: lt >= a - 0.06 || i === 0 ? 1 : 0 }); q.p.style.zIndex = i + 1;
          const cp = E.o3(P(lt, a + 0.15, 0.55)); txt(q.n, ar(Math.round(q.v * cp)));
          T(q.n, { s: 0.7 + 0.3 * E.spr(P(lt, a + 0.1, 0.7)), b: (1 - P(lt, a + 0.1, 0.35)) * 14 });
          T(q.l, { y: (1 - E.o5(P(lt, a + 0.3, 0.6))) * 40, o: P(lt, a + 0.3, 0.3) });
          T(q.ci, { x: (lt - a) * -40, y: (lt - a) * 30 });
        });
      };
    } },
    { d: 7.2, tr: 'iris', td: 0.75, ch: 'ابدأ الآن', build: function (S, root) {
      root.style.background = '#fff';
      const C = S.C, cam = camera(root, 7.2), m = S.v ? 230 : 190, cy = S.v ? 560 : 250;
      const glow = A(cam.e, S.W / 2 - 600, cy - 600 + m / 2, 1200, 1200); css(glow, { borderRadius: '50%', background: 'radial-gradient(circle,' + rgba(C.ac, 0.13) + ',transparent 60%)' });
      const mk = A(cam.e, S.W / 2 - m / 2, cy, m, m, null, brandSVG('mark', C.ac));
      const t = KT(cam.e, 'أثرُك يبدأ _من هنا_', { x: 40, y: cy + m + (S.v ? 60 : 40), w: S.W - 80, size: S.v ? 130 : 120, align: 'center', mk: C.t2 });
      const bw = S.v ? 520 : 440, bh = S.v ? 128 : 108, by = cy + m + (S.v ? 310 : 250);
      const btn = A(cam.e, S.W / 2 - bw / 2, by, bw, bh, 'mo-pill', '<span>ابدأ الآن</span>' + ico('up', S.v ? 48 : 40, '#fff', 2.6).replace('<svg', '<svg style="transform:rotate(-90deg)"'));
      css(btn, { background: C.ac, color: '#fff', fontSize: (S.v ? 56 : 48) + 'px', fontFamily: 'var(--mo-fd)', boxShadow: '0 24px 60px -18px ' + rgba(C.ac, 0.7) });
      const ln = A(cam.e, 40, by + bh + (S.v ? 56 : 40), S.W - 80, 60); css(ln, { textAlign: 'center', fontSize: (S.v ? 40 : 36) + 'px', color: C.ink, direction: 'ltr', unicodeBidi: 'isolate', fontFamily: 'ui-sans-serif,system-ui,"Segoe UI",sans-serif', fontWeight: '600', letterSpacing: '.01em' }); ln.textContent = 'ghamine23.github.io/media-portal';
      const nm = A(cam.e, 40, S.H - (S.v ? 190 : 120), S.W - 80, 60); css(nm, { textAlign: 'center', fontSize: (S.v ? 36 : 32) + 'px', color: '#6b6b76' }); nm.textContent = 'منصة الأثر الإعلامي';
      const conf = []; const R = rng(23); for (let i = 0; i < 22; i++) { const s = 10 + R() * 16, c2 = A(cam.e, S.W / 2 - s / 2, by + bh / 2 - s / 2, s, s); css(c2, { borderRadius: R() > 0.5 ? '50%' : '4px', background: [C.ac, PAL.or, PAL.te, C.ac3, PAL.pl][i % 5] }); conf.push({ e: c2, a: -Math.PI / 2 + (R() - 0.5) * 2.6, r: 260 + R() * 380, sp: R() * 360 }); }
      const ck = 3.1, cur = Cursor(cam.e, [[2.2, S.W * 0.78, S.H * 0.95], [ck, S.W / 2 + bw * 0.18, by + bh * 0.6, 1]], S.sfx, { color: C.ac, end: 4.2 });
      S.sfx(0.25, 'impact', { v: 0.6 }); S.sfx(0.3, 'shimmer', { f: 1175, v: 0.06 }); S.sfx(1.6, 'pop', { p: 0.7, v: 0.45 }); S.sfx(ck + 0.02, 'pop', { p: 1.2, v: 0.5 }); S.sfx(ck + 0.05, 'shimmer', { f: 1568, v: 0.08 }); S.sfx(ck + 0.05, 'chime', { v: 0.16 });
      return function (lt) {
        cam.up(lt);
        const mp = E.spr(P(lt, 0.2, 0.8)); T(mk, { s: 0.3 + 0.7 * mp, o: P(lt, 0.2, 0.15), r: (1 - mp) * -30 });
        T(glow, { s: 0.8 + 0.2 * E.o3(P(lt, 0.2, 1.5)), o: P(lt, 0.2, 0.6) });
        t.up(lt, 0.7, null, { mode: 'slam', st: 0.12, du: 0.75 });
        const bp = E.spr(P(lt, 1.6, 0.8)), press = lt > ck - 0.05 && lt < ck + 0.18 ? 0.94 : 1;
        T(btn, { s: (0.5 + 0.5 * bp) * press, o: P(lt, 1.6, 0.15) });
        T(ln, { o: P(lt, 2.1, 0.4), y: (1 - E.o5(P(lt, 2.1, 0.6))) * 20 }); T(nm, { o: P(lt, 2.4, 0.5) });
        conf.forEach(function (q) { const p = E.o3(P(lt, ck, 1.4)), g = P(lt, ck, 1.6); T(q.e, { x: Math.cos(q.a) * q.r * p, y: Math.sin(q.a) * q.r * p + g * g * 260, r: q.sp * p, o: (lt >= ck ? 1 : 0) * (1 - P(lt, ck + 1.0, 0.6)) }); });
        cur.up(lt);
      };
    } }
  ];

  /* ---------- مقاطع الأقسام: مقدمة ملوّنة، ثم خطوات، ثم دعوة ---------- */
  function section(def) {
    const n = def.moves.length, mv = def.mv || 4.6, lead = 0.8, demoD = lead + n * mv + 0.6;
    const ms = def.moves.map(function (_, i) { return lead + i * mv; });
    const intro = { d: 3.5, ch: 'مقدمة', build: function (S, root) {
      const col = typeof def.col === 'function' ? def.col(S.C) : def.col;
      root.style.background = 'linear-gradient(150deg,' + col + ',' + mix(col, '#000000', 0.25) + ')';
      const cam = camera(root, 3.5), C = S.C;
      const ci = A(cam.e, S.W * 0.55, -S.H * 0.15, S.v ? 900 : 1000, S.v ? 900 : 1000); css(ci, { borderRadius: '50%', background: 'rgba(255,255,255,.07)' });
      const ci2 = A(cam.e, -S.W * 0.2, S.H * 0.6, 700, 700); css(ci2, { borderRadius: '50%', background: 'rgba(255,255,255,.05)' });
      const box = A(cam.e, S.v ? 70 : 160, 0, S.W - (S.v ? 140 : 320), S.H); css(box, { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: S.v ? 'center' : 'flex-start', gap: '30px', textAlign: S.v ? 'center' : 'right' });
      const tile = h('div', null, box); css(tile, { width: (S.v ? 150 : 140) + 'px', height: (S.v ? 150 : 140) + 'px', borderRadius: '40px', background: '#fff', display: 'grid', placeItems: 'center', boxShadow: '0 20px 50px -20px rgba(0,0,0,.4)' }); tile.innerHTML = ico(def.ic, S.v ? 76 : 70, col, 2);
      const eb = h('div', null, box); css(eb, { fontSize: (S.v ? 34 : 32) + 'px', color: 'rgba(255,255,255,.8)', fontWeight: '600' }); eb.textContent = 'جولة سريعة';
      const t = KT(box, def.title, { flow: 1, size: S.v ? 150 : 150, color: '#fff', align: S.v ? 'center' : 'right', w: S.W - 160 });
      const ds = KT(box, def.desc, { flow: 1, size: S.v ? 44 : 42, font: 't', color: 'rgba(255,255,255,.88)', align: S.v ? 'center' : 'right', st: 0.025, w: S.v ? S.W - 140 : 1300 });
      S.sfx(0.1, 'pop', { p: 0.8, v: 0.45 }); S.sfx(0.45, 'whoosh', { d: 0.5, v: 0.3 }); S.sfx(0.5, 'impact', { v: 0.45 }); S.sfx(0.6, 'shimmer', { f: 1320, v: 0.05 });
      return function (lt) {
        cam.up(lt); const p = E.spr(P(lt, 0.1, 0.7)); T(tile, { s: 0.3 + 0.7 * p, r: (1 - p) * -25, o: P(lt, 0.1, 0.12) * (1 - P(lt, 3.0, 0.3)) });
        T(eb, { o: P(lt, 0.35, 0.3) * (1 - P(lt, 3.0, 0.3)), y: (1 - E.o5(P(lt, 0.35, 0.5))) * 20 });
        t.up(lt, 0.45, 3.0, { mode: 'slam', st: 0.1 }); ds.up(lt, 1.0, 3.05, { mode: 'blur' });
        T(ci, { x: lt * -30, y: lt * 20 }); T(ci2, { x: lt * 25 });
      };
    } };
    const demo = { d: demoD, tr: 'wipe', td: 0.8, ch: def.moves[0][0], chs: def.moves.map(function (m, i) { return [ms[i], m[0]]; }), build: function (S, root) {
      const C = S.C, L = lay(S), cam = camera(root, demoD);
      const r = L.txt, cap = A(cam.e, r.x, r.y, r.w, r.h); css(cap, { display: 'flex', flexDirection: 'column', justifyContent: 'center' });
      // مؤشر الخطوات
      const dots = A(cam.e, S.v ? S.W / 2 - n * 26 : r.x + r.w - n * 52, S.v ? r.y + 6 : r.y + r.h / 2 - 260, n * 52, 20); css(dots, { display: 'flex', gap: '12px', justifyContent: S.v ? 'center' : 'flex-start' });
      const dEls = def.moves.map(function () { const d = h('i', null, dots); css(d, { height: '12px', width: '12px', borderRadius: '12px', background: rgba(C.ac, 0.22), display: 'block' }); return d; });
      const caps = def.moves.map(function (m, i) {
        const g = A(cam.e, r.x, r.y, r.w, r.h); css(g, { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: S.v ? 'center' : 'flex-start', gap: '18px', textAlign: S.v ? 'center' : 'right' });
        const num = h('div', null, g); css(num, { width: (S.v ? 84 : 80) + 'px', height: (S.v ? 84 : 80) + 'px', borderRadius: '26px', background: C.ac, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--mo-fd)', fontSize: (S.v ? 46 : 44) + 'px', fontWeight: '700' }); num.textContent = ar(i + 1);
        const tt = KT(g, m[0], { flow: 1, size: S.v ? 96 : 88, align: S.v ? 'center' : 'right', hl: C.pop, w: r.w });
        const sb = KT(g, m[1], { flow: 1, size: S.v ? 42 : 38, font: 't', color: '#5d5d68', align: S.v ? 'center' : 'right', st: 0.025, w: r.w });
        return { g: g, num: num, tt: tt, sb: sb };
      });
      const at = 0.3, cp = def.comp(S, { v: S.v, b: def.beats(ms.map(function (x) { return x - at; }), mv), sfx: function (t, k, x) { S.sfx(t + at, k, x); }, side: false });
      const pl = place(cam.e, cp, L.box);
      S.sfx(at, 'whoosh', { d: 0.6, v: 0.22 });
      ms.forEach(function (t, i) { S.sfx(t, i ? 'swish' : 'pop', { d: 0.35, v: 0.22, p: 0.9 }); });
      return function (lt) {
        cam.up(lt); pl.enter(lt, at, demoD - 0.5); cp.up(lt - at);
        caps.forEach(function (c2, i) {
          const a = ms[i], b2 = i < n - 1 ? ms[i + 1] - 0.45 : demoD - 0.6;
          const np = E.spr(P(lt, a, 0.6)), nx = E.i3(P(lt, b2, 0.35));
          T(c2.num, { s: (0.4 + 0.6 * np) * (1 - 0.3 * nx), o: P(lt, a, 0.12) * (1 - nx), r: (1 - np) * -20 });
          c2.tt.up(lt, a + 0.12, b2); c2.sb.up(lt, a + 0.45, b2 + 0.04, { mode: 'blur' });
          sty(c2.g, 'visibility', lt > a - 0.1 && lt < b2 + 0.6 ? 'visible' : 'hidden');
        });
        dEls.forEach(function (d, i) { const on = lt >= ms[i] && (i === n - 1 || lt < ms[i + 1]); sty(d, 'width', on ? '40px' : '12px'); sty(d, 'background', lt >= ms[i] ? C.ac : rgba(C.ac, 0.22)); });
        T(dots, { o: P(lt, 0.4, 0.3) * (1 - P(lt, demoD - 0.6, 0.3)) });
      };
    } };
    const outro = { d: 3.4, tr: 'iris', td: 0.7, ch: 'جرّبها الآن', build: function (S, root) {
      root.style.background = '#fff';
      const C = S.C, cam = camera(root, 3.4), m = S.v ? 170 : 140;
      const box = A(cam.e, 60, 0, S.W - 120, S.H); css(box, { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '34px', textAlign: 'center' });
      const mk = h('div', null, box); css(mk, { width: m + 'px', height: m + 'px' }); mk.innerHTML = brandSVG('mark', C.ac);
      const t = KT(box, def.cta || 'جرّبها _الآن_', { flow: 1, size: S.v ? 130 : 120, align: 'center', mk: C.t2 });
      const hint = h('div', 'mo-pill', box); css(hint, { background: C.t1, color: C.ac, fontSize: (S.v ? 38 : 34) + 'px', padding: '16px 34px' }); hint.innerHTML = ico(def.ic, S.v ? 40 : 36, C.ac, 2) + '<span>' + def.where + '</span>';
      S.sfx(0.2, 'pop', { p: 0.8, v: 0.45 }); S.sfx(0.25, 'shimmer', { f: 1175, v: 0.05 }); S.sfx(1.1, 'pop', { p: 1.1, v: 0.3 });
      return function (lt) { cam.up(lt); const p = E.spr(P(lt, 0.2, 0.7)); T(mk, { s: 0.4 + 0.6 * p, o: P(lt, 0.2, 0.12) }); t.up(lt, 0.45, null, { mode: 'slam', st: 0.1 }); const hp = E.spr(P(lt, 1.1, 0.6)); T(hint, { s: 0.6 + 0.4 * hp, o: P(lt, 1.1, 0.15) }); };
    } };
    return [intro, demo, outro];
  }

  const SECTIONS = {
    home: { title: 'الرئيسية', ic: 'home', col: function (C) { return C.ac; }, desc: 'نقطة البداية: بحث، وتقويم، ومصمّم ذكي، ونصيحة اليوم', where: 'شعار أثر في أعلى الصفحة',
      moves: [['ابحث في *كل القوالب*', 'اكتب كلمة: مسابقة، لقاء، تهنئة…'], ['القادم *في تقويمك*', 'منشوراتك المجدولة ومهامك المفتوحة أمامك'], ['فكرة؟ *اكتبها هنا*', 'المصمّم الذكي يبدأ من الرئيسية مباشرة'], ['نصيحة *اليوم*', 'مبدأ تصميم واحد كل يوم، برسم متحرك']],
      comp: cHome, beats: function (m) { return { search: [m[0] + 1.0, m[0] + 2.0], up: m[1] + 0.7, make: [m[2] + 1.0, m[2] + 2.8], tip: m[3] + 0.6 }; } },
    gallery: { title: 'القوالب والهويات', ic: 'grid', col: '#c4561a', desc: 'كل برنامج بهويته: شعاره وألوانه وخطوطه، وقوالب جاهزة تتلوّن بها', where: 'الرئيسية ← اختر برنامجك',
      moves: [['اختر *البرنامج*', 'تتلوّن القوالب كلها بهويته مباشرة'], ['صنّف *وابحث*', 'إعلان فعالية، مسابقة، تهنئة، غلاف يوتيوب…'], ['افتح القالب *وعدّله*', 'ضغطة واحدة إلى المحرر']],
      comp: cGallery, beats: function (m) { return { id: m[0] + 1.1, cat: m[1] + 0.9, search: [m[1] + 2.4, m[1] + 3.2], open: m[2] + 1.0 }; } },
    editor: { title: 'المحرر', ic: 'pencil', col: '#1668e3', desc: 'صمّم على القالب أو من صفحة بيضاء، ثم نزّل أو انشر', where: 'افتح أي قالب', mv: 4.4,
      moves: [['اكتب *نصوصك*', 'يتغيّر التصميم وأنت تكتب'], ['لوّن *بهويتك*', 'ألوان البرنامج جاهزة في مكان واحد'], ['حرّك *وحاذِ*', 'خطوط إرشاد تضبط المحاذاة لك'], ['أضف *ما تحتاج*', 'آية، حديث، رمز QR، أيقونة، صورة'], ['نزّل *بجودة كاملة*', 'أو انشره مباشرة إلى القناة']],
      comp: cEditor, beats: function (m) { return { type: [m[0] + 1.0, m[0] + 2.6], col: m[1] + 1.1, sel: m[2] + 0.9, add: m[3] + 0.9, dl: m[4] + 1.0 }; } },
    make: { title: 'اصنع إعلانك', ic: 'sparkles', col: '#9d2b5e', desc: 'اكتب فكرتك بكلماتك، ويقترح المصمّم الذكي تصاميم بهوية برنامجك', where: 'القائمة ← اصنع إعلانك',
      moves: [['اكتب *فكرتك*', 'بكلماتك: ماذا، ومتى، وأين'], ['أجب عن *سؤال قصير*', 'ليصيب ما تريد بالضبط'], ['ثلاثة *اتجاهات*', 'هادئ، وجريء، واحتفالي… اختر ما يناسبك'], ['عدّل *ما شئت*', 'كل اقتراح يُفتح في المحرر']],
      comp: cMake, beats: function (m) { return { type: [m[0] + 1.0, m[0] + 3.4], go: m[1] + 0.6, q: m[1] + 1.4, res: m[2] + 0.7, pick: m[3] + 0.9 }; } },
    publish: { title: 'النص المصاحب والنشر', ic: 'send', col: '#0d8478', desc: 'نصٌّ مصاحب يكتبه المساعد، وإرسال إلى قناة تليجرام الآن أو في موعده', where: 'المحرر ← النشر',
      moves: [['النص *المصاحب*', 'يكتبه المساعد من تصميمك، وتعدّله كما تشاء'], ['اختر *القناة*', 'قنوات برنامجك جاهزة'], ['الآن *أو لاحقًا*', 'جدوِل المنشور ليُرسل في وقته'], ['في *القناة*', 'الصورة والنص معًا، كما أردت']],
      comp: function (S, o) { return cPublish(S, Object.assign(o, { side: false })); }, beats: function (m) { return { type: [m[0] + 1.0, m[0] + 3.4], pick: m[1] + 0.9, sch: m[2] + 1.0, msg: m[3] + 0.9, sch2: m[3] + 0.5 }; } },
    cal: { title: 'التقويم والمهام', ic: 'cal', col: '#467a2f', desc: 'منشوراتك ومهامك في تقويم واحد: شهر وأسبوع ويوم، وتذكير في وقته', where: 'القائمة ← التقويم',
      moves: [['شهر، أسبوع، *يوم*', 'انظر إلى وقتك كما يناسبك'], ['اسحب *لتغيّر الموعد*', 'ينتقل المنشور ويُعاد جدولته'], ['مهامك *ومهام فريقك*', 'من المشرف إليك، أو منك لنفسك'], ['تذكير *في وقته*', 'إشعار قبل الموعد، فلا يفوتك شيء']],
      comp: cCal, beats: function (m) { return { ev: 0.4, view: m[0] + 1.0, drag: m[1] + 0.9, tasks: m[2] + 0.5, rem: m[3] + 0.8 }; } },
    slides: { title: 'الشرائح والعروض', ic: 'slides', col: '#2a2a3a', desc: 'من نص الدرس إلى شرائح بهويتك، بانتقالات وحركة وأدوات للعرض', where: 'صفحة البرنامج ← الشرائح',
      moves: [['من الدرس *إلى المخطط*', 'ألصق النص أو ارفع ملف الدرس'], ['شرائح *بهويتك*', 'يتحوّل المخطط إلى شرائح جاهزة'], ['انتقالات *وحركة*', '١٢ انتقالًا، وظهور تدريجي للعناصر'], ['اعرض *بثقة*', 'مؤقّت، وأسئلة، وملاحظات للمقدّم']],
      comp: cSlides, beats: function (m) { return { doc: m[0] + 0.6, s1: m[1] + 0.6, s2: m[2] + 0.5, s3: m[3] + 0.6, s4: m[3] + 3.0 }; } },
    lesson: { title: 'أدوات الدرس', ic: 'pen', col: '#7a3e9d', desc: 'قلمٌ على الشريحة، وقرعة بلا تكرار، ونقاط للفرق تظهر لطلابك أثناء العرض', where: 'اعرض ← شريط الأدوات',
      moves: [['اكتب *على الشريحة*', 'قلم، وتحديد، ومؤشّر أحمر تشير به'], ['قرعة *بلا تكرار*', 'بالأرقام أو بأسماء طلابك'], ['نقاط *الفرق*', 'أضف فريقاً، وسمّه، وزِد نقاطه بنقرة']],
      comp: cLesson, beats: function (m) { return { pen: m[0] + 0.8, mark: m[0] + 2.2, pick: m[1] + 0.6, pickOut: m[2] + 0.2, sc: m[2] + 0.6, bump: m[2] + 2.2 }; } },
    presenter: { title: 'عرض المقدّم', ic: 'slides', col: '#1f2a44', desc: 'درسك عن بُعد: يرى الطلاب الشريحة، وتبقى لك لوحة عائمة بملاحظاتك والمؤقّت والأدوات', where: 'المحرر ← عرض المقدّم',
      moves: [['شارك *علامة التبويب*', 'يرى الطلاب الشريحة وحدها'], ['لوحتك *عائمة*', 'ملاحظاتك والمؤقّت والتالي، ولا يراها الطلاب'], ['كبّر *ما تشرحه*', 'انقر جزءاً من الشريحة فيكبر عندهم']],
      comp: cPresenter, beats: function (m) { return { win: m[0] + 0.3, pnl: m[1] + 0.5, note: [m[1] + 1.4, m[1] + 3.2], zoom: m[2] + 0.8 }; } },
    mine: { title: 'تصاميمي والفريق', ic: 'users', col: '#b4451c', desc: 'كل ما صمّمته محفوظ، تشاركه للتعديل المشترك، وتطلب عليه مراجعة', where: 'القائمة ← تصاميمي',
      moves: [['تصاميمك *محفوظة*', 'كل تنزيل وحفظ في مكان واحد'], ['شارك *للتعديل*', 'رابط واحد، ويعدّل معك فريقك'], ['اطلب *مراجعة*', 'تقييم من المصمّم الذكي وملاحظات الإدارة'], ['تابع *الإشعارات*', 'تعليق، مهمة، نشر… كله في الجرس']],
      comp: cMine, beats: function (m) { return { share: m[1] + 0.9, rev: m[2] + 0.8, bell: m[3] + 0.9 }; } },
    app: { title: 'التطبيق', ic: 'phone', col: function (C) { return C.ink; }, desc: 'تطبيق للجوال يُثبَّت على الشاشة الرئيسية: صمّم وانشر وتابع من هاتفك', where: 'حسابي ← التطبيق',
      moves: [['ثبّته *على شاشتك*', 'من المتصفح مباشرة، بلا متجر'], ['أنشئ *بزرّ واحد*', 'اصنع إعلانك، أو من قالب، أو صفحة بيضاء'], ['المحرر *في يدك*', 'التصميم ظاهر، والأدوات في ورقة تُسحب'], ['انشر *من هاتفك*', 'إلى القناة مباشرة']],
      comp: cPhone, beats: function (m) { return { inst: m[0] + 1.0, plus: m[1] + 0.9, sheet: m[2] + 0.8, pub: m[3] + 0.9 }; } },
    admin: { title: 'لوحة الإدارة', ic: 'shield', col: '#2b2b36', desc: 'الحسابات والبرامج والأصول والإحصاءات والإشعارات في مكان واحد', where: 'القائمة ← الإدارة',
      moves: [['نظرة *عامة*', 'أرقام المنصة هذا الشهر'], ['الحسابات *والأدوار*', 'مدير، ومشرف برنامج، وعضو'], ['البرامج *وأصولها*', 'الشعارات والألوان والخطوط لكل برنامج'], ['إشعارات *ملخّصة*', 'كل جديد يصلك بتلخيص المساعد']],
      comp: cAdmin, beats: function (m) { return { ov: m[0] + 0.5, acc: m[1] + 0.6, prog: m[2] + 0.6, nt: m[3] + 0.6 }; } }
  };

  /* ================= السجل والمحرك ================= */
  const CLIPS = {
    launch: { id: 'launch', title: 'أثر في دقيقة', section: 'المنصة', desc: 'جولة سريعة في المنصة وكل ما تقدّمه، من الفكرة إلى القناة.', scenes: L_SCENES, poster: 15.6, corner: [1, L_SCENES.length - 1] }
  };
  const SEC_ROUTES = { home: '^/$', gallery: '^/g/', editor: '^/(e|d)/', make: '^/make', cal: '^/cal', slides: '^/(s|p)/', mine: '^/(mine|reviews)', admin: '^/admin' };
  Object.keys(SECTIONS).forEach(function (id) {
    const d = SECTIONS[id], sc = section(d);
    CLIPS[id] = { id: id, title: d.title, section: d.title, desc: d.desc, scenes: sc, poster: 3.5 + 0.8 + 2.2, admin: id === 'admin', route: SEC_ROUTES[id] };
  });
  function plan(spec) {
    if (spec._plan) return spec._plan;
    let t = 0; const list = [];
    spec.scenes.forEach(function (sc, i) { const td = i ? (sc.td == null ? 0.7 : sc.td) : 0, s = i ? t - td : 0; list.push({ sc: sc, s: s, d: sc.d, td: td, tr: sc.tr || 'fade' }); t = s + sc.d; });
    const ch = [];
    list.forEach(function (q) { if (q.sc.chs) q.sc.chs.forEach(function (c) { ch.push({ t: +(q.s + c[0]).toFixed(2), title: c[1].replace(/[*_]/g, '') }); }); else if (q.sc.ch && (!ch.length || ch[ch.length - 1].title !== q.sc.ch)) ch.push({ t: +q.s.toFixed(2), title: q.sc.ch }); });
    if (ch.length) ch[0].t = 0;
    spec._plan = { list: list, dur: +t.toFixed(2), chapters: ch };
    return spec._plan;
  }

  function TL(id, o) {
    injectCSS();
    o = o || {};
    const spec = CLIPS[id], pl = plan(spec), self = this;
    this.id = id; this.spec = spec; this.v = !!o.portrait; this.W = this.v ? 1080 : 1920; this.H = this.v ? 1920 : 1080;
    this.calm = !!o.calm; this.dur = pl.dur; this.list = pl.list; this.chapters = pl.chapters; this.t = -1;
    const st = this.stage = h('div', 'mo-stage'); css(st, { width: this.W + 'px', height: this.H + 'px' });
    st.setAttribute('aria-hidden', 'true');
    const C = accent();
    this.S = { W: this.W, H: this.H, v: this.v, C: C };
    // خلفية هادئة بتوهّج لوني يتحرك
    const bg = A(st, 0, 0, this.W, this.H); css(bg, { background: '#f7f7f9' });
    this.g1 = A(bg, -this.W * 0.2, -this.H * 0.15, this.W * 0.9, this.W * 0.9); css(this.g1, { borderRadius: '50%', background: 'radial-gradient(circle,' + rgba(C.ac, 0.10) + ',transparent 62%)' });
    this.g2 = A(bg, this.W * 0.45, this.H * 0.55, this.W * 0.8, this.W * 0.8); css(this.g2, { borderRadius: '50%', background: 'radial-gradient(circle,' + rgba(PAL.or, 0.08) + ',transparent 62%)' });
    this.layer = A(st, 0, 0, this.W, this.H);
    this.over = A(st, 0, 0, this.W, this.H); this.over.style.pointerEvents = 'none';
    this.bars = [C.ac3, C.ac, C.ink].map(function (c) { const b = A(self.over, 0, 0, self.W * 1.15, self.H); css(b, { background: c }); T(b, { o: 0 }); return b; });
    this.flash = A(this.over, 0, 0, this.W, this.H); css(this.flash, { background: '#fff' }); T(this.flash, { o: 0 });
    this.sc = this.list.map(function () { return null; });
    this.sfx = [];
    this.sfxDone = false;
    if (spec.corner && !o.noCorner) {
      const cn = this.corner = A(this.over, 0, 0, null, null, 'mo-pill'); const v = this.v;
      cn.innerHTML = '<span style="width:' + (v ? 52 : 46) + 'px;height:' + (v ? 52 : 46) + 'px;display:block">' + brandSVG('mark', C.ac) + '</span><span>منصة الأثر الإعلامي</span>';
      css(cn, { right: (v ? 48 : 56) + 'px', left: 'auto', top: (v ? 54 : 44) + 'px', background: 'rgba(255,255,255,.9)', color: '#16161e', fontSize: (v ? 28 : 24) + 'px', padding: '8px 22px 8px 10px', boxShadow: '0 4px 18px rgba(0,0,0,.08)', gap: '12px', fontWeight: '600' });
      this.cornerT = [this.list[spec.corner[0]].s + 0.6, this.list[spec.corner[1]].s];
    }
    if (o.all) this.buildAll();
  }
  TL.prototype.build = function (i) {
    if (this.sc[i]) return this.sc[i];
    const q = this.list[i], root = A(this.layer, 0, 0, this.W, this.H, 'mo-sc'), self = this, S = Object.create(this.S);
    S.sfx = function (t, k, x) { if (!self.sfxDone) self.sfx.push({ t: +(q.s + t).toFixed(3), k: k, o: x || {} }); };
    root.style.zIndex = String(i + 1);
    const up = q.sc.build(S, root);
    this.sc[i] = { root: root, up: up };
    show(root, false);
    return this.sc[i];
  };
  TL.prototype.buildAll = function () { for (let i = 0; i < this.list.length; i++) this.build(i); };
  TL.prototype.allSfx = function () {
    if (!this.sfxDone) {
      const self = this;
      this.list.forEach(function (q, i) {
        if (!self.sc[i]) self.build(i);
        if (i) { const tr = q.tr, t0 = q.s; if (tr === 'wipe') self.sfx.push({ t: t0, k: 'whoosh', o: { d: q.td + 0.1, v: 0.55, f: 2000 } }); else if (tr === 'iris') { self.sfx.push({ t: t0, k: 'swish', o: { d: q.td, v: 0.3, pa: 0, pb: 0 } }); self.sfx.push({ t: t0 + q.td * 0.45, k: 'thud', o: { v: 0.3 } }); } else if (tr === 'push') self.sfx.push({ t: t0, k: 'whoosh', o: { d: q.td + 0.05, v: 0.42, pa: 0.8, pb: -0.8 } }); else if (tr === 'zoom') self.sfx.push({ t: t0, k: 'whoosh', o: { d: q.td + 0.1, v: 0.45, f: 3000, pa: 0, pb: 0 } }); }
      });
      this.sfx.sort(function (a, b) { return a.t - b.t; }); this.sfxDone = true;
    }
    return this.sfx;
  };
  // انتقال بين مشهدين
  function trans(tl, kind, p, outR, inR) {
    const W = tl.W, H = tl.H, calm = tl.calm;
    if (calm && kind !== 'fade') kind = 'fade';
    if (kind === 'fade') { const q = E.io3(p); T(outR, { o: 1 - q }); T(inR, { o: q, b: (1 - q) * 10 }); return; }
    if (kind === 'zoom') { T(outR, { s: 1 + 0.22 * E.i3(p), o: 1 - E.i2(P(p, 0.15, 0.6)), b: 14 * p }); const q = P(p, 0.25, 0.75); T(inR, { s: 0.86 + 0.14 * E.o5(q), o: E.o3(q), b: (1 - q) * 16 }); return; }
    if (kind === 'push') { const q = E.io5(p); T(outR, { x: q * W * 0.4, o: 1 - E.i2(p), b: q * 12 }); T(inR, { x: (1 - q) * -W * 0.55, o: E.o3(P(p, 0.1, 0.6)), b: (1 - q) * 12 }); return; }
    if (kind === 'iris') { const q = E.io3(p); T(outR, { s: 1 - 0.06 * q, o: 1 - 0.4 * q }); T(inR, {}); sty(inR, 'clipPath', 'circle(' + (q * 75).toFixed(2) + '% at 50% 55%)'); return; }
    if (kind === 'wipe') {
      tl.bars.forEach(function (b, k) { const u = E.io3(cl((p - k * 0.1) / 0.8)); T(b, { x: W * (1.02 - 2.2 * u), o: u > 0 && u < 1 ? 1 : 0 }); });
      T(outR, { o: p < 0.5 ? 1 : 0, x: E.i3(P(p, 0, 0.5)) * -60 }); T(inR, { o: p >= 0.5 ? 1 : 0, s: 1 + 0.05 * (1 - E.o3(P(p, 0.5, 0.5))), x: (1 - E.o5(P(p, 0.5, 0.5))) * 80 });
      return;
    }
    T(outR, { o: 1 - p }); T(inR, { o: p });
  }
  TL.prototype.seek = function (t) {
    t = cl(t, 0, this.dur);
    const prevK = K; K = this.calm ? 0.12 : 1;
    this.t = t;
    let wipeOn = false;
    for (let i = 0; i < this.list.length; i++) {
      const q = this.list[i], on = t >= q.s - 0.0001 && t <= q.s + q.d + 0.0001 && !(i < this.list.length - 1 && t > q.s + q.d - 0.0001 && false);
      const nxt = this.list[i + 1], vis = t >= q.s && (t < q.s + q.d || i === this.list.length - 1);
      if (!vis) { if (this.sc[i]) show(this.sc[i].root, false); continue; }
      const sc = this.build(i); show(sc.root, true);
      T(sc.root, {}); sty(sc.root, 'clipPath', 'none');
      sc.up(t - q.s);
    }
    // الانتقالات
    for (let i = 1; i < this.list.length; i++) {
      const q = this.list[i];
      if (t >= q.s && t < q.s + q.td) { const p = (t - q.s) / q.td; trans(this, q.tr, p, this.sc[i - 1].root, this.sc[i].root); if (q.tr === 'wipe' && !this.calm) wipeOn = true; }
    }
    if (!wipeOn) this.bars.forEach(function (b) { T(b, { o: 0 }); });
    if (this.corner) { const c = this.cornerT, p = E.o5(P(t, c[0], 0.6)) * (1 - P(t, c[1] - 0.2, 0.35)); T(this.corner, { o: p, y: (1 - p) * -20 }); }
    T(this.g1, { x: Math.sin(t * 0.21) * 120, y: Math.cos(t * 0.17) * 90 }); T(this.g2, { x: Math.cos(t * 0.19) * 110, y: Math.sin(t * 0.23) * 80 });
    K = prevK;
  };
  TL.prototype.chapterAt = function (t) { let c = 0; this.chapters.forEach(function (q, i) { if (t >= q.t - 0.001) c = i; }); return c; };

  /* ---------- الصوت الحي ---------- */
  let ACtx = null;
  function actx() { if (!ACtx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; try { ACtx = new AC(); } catch (e) { return null; } } return ACtx; }
  function soundPref() { try { return localStorage.getItem('mo.snd') !== '0'; } catch (e) { return true; } }
  function setSoundPref(on) { try { localStorage.setItem('mo.snd', on ? '1' : '0'); } catch (e) {} }

  /* ================= المشغّل ================= */
  function reduced() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  // وقت المشغّل بأرقام لاتينية كمشغّلات الفيديو: الصفر المشرقي نقطة تلتبس بالنقطتين
  function fmt(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function btn(cls, icn, label) { const b = h('button', cls); b.type = 'button'; b.innerHTML = ico(icn, 22, 'currentColor', 2); b.setAttribute('aria-label', label); b.title = label; return b; }
  let PLAYING = null;
  function play(id, opts) {
    opts = opts || {};
    if (PLAYING) PLAYING.close(true);
    return new Promise(function (resolve) {
      if (!CLIPS[id]) { resolve({ watched: false, at: 0 }); return; }
      injectCSS();
      const spec = CLIPS[id], pl = plan(spec), last = document.activeElement;
      const ov = h('div', 'mo-pl'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', spec.title); ov.dir = 'rtl';
      const frame = h('div', 'mo-frame', ov), hit = h('div', 'mo-hit', frame), ui = h('div', 'mo-ui', frame);
      const top = h('div', 'mo-topbar', ui), ttl = h('div', 'mo-ttl', top);
      ttl.innerHTML = '<b></b><span></span>'; ttl.querySelector('b').textContent = spec.title; ttl.querySelector('span').textContent = id === 'launch' ? 'منصة الأثر الإعلامي' : 'جولة سريعة · ' + spec.section;
      const bClose = btn('mo-b', 'close', 'إغلاق'); top.appendChild(bClose);
      const bot = h('div', 'mo-bot', ui), bar = h('div', 'mo-bar', bot), trk = h('div', 'mo-trk', bar), fill = h('div', 'mo-fill', trk), knob = h('div', 'mo-knob', bar), tip = h('div', 'mo-tip', bar);
      bar.setAttribute('role', 'slider'); bar.tabIndex = 0; bar.setAttribute('aria-label', 'موضع التشغيل'); bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', String(Math.round(pl.dur)));
      pl.chapters.forEach(function (c, i) { if (!i) return; const tk = h('i', 'mo-tk', bar); tk.style.right = (c.t / pl.dur * 100) + '%'; });
      const row = h('div', 'mo-row', bot);
      const bPlay = btn('mo-b', 'pause', 'إيقاف مؤقت'), bPrev = btn('mo-b', 'prev', 'الفصل السابق'), bNext = btn('mo-b', 'next', 'الفصل التالي');
      const tm = h('span', 'mo-time'), chl = h('span', 'mo-chl'), bCalm = btn('mo-b', 'calm', 'حركة أهدأ'), bSnd = btn('mo-b', 'vol', 'الصوت'), bRe = btn('mo-b mo-hide-s', 'replay', 'من البداية');
      [bPlay, bPrev, bNext, tm, chl, bCalm, bSnd, bRe].forEach(function (x) { row.appendChild(x); });
      let skipB = null;
      if (opts.intro) { const w = h('div', 'mo-skipw', ui); skipB = h('button', 'mo-skip', w); skipB.type = 'button'; skipB.innerHTML = '<span>تخطَّ</span>' + ico('skip', 18, 'currentColor', 2.4); }
      document.body.appendChild(ov);
      requestAnimationFrame(function () { ov.classList.add('on'); });
      let tl = null, portrait = null, t = Math.max(0, +opts.start || 0), playing = opts.autoplay !== false, maxT = 0, ended = false, closed = false, raf = 0;
      let calm = opts.calm != null ? !!opts.calm : reduced();
      let snd = opts.sound != null ? !!opts.sound : soundPref();
      // الصوت
      const ctx = actx(); let bus = null, master = null, sess = null, nextEv = 0, a0 = 0, p0 = 0, t0 = 0;
      if (ctx) { master = ctx.createGain(); master.gain.value = snd ? 1 : 0; bus = SFX.bus(ctx, master); master.connect(ctx.destination); }
      function stopAudio() { if (sess && ctx) { const s = sess; try { s.gain.setTargetAtTime(0, ctx.currentTime, 0.02); } catch (e) {} setTimeout(function () { try { s.disconnect(); } catch (e) {} }, 200); } sess = null; }
      function startAudio() {
        stopAudio(); if (!ctx || !tl) return;
        if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
        sess = ctx.createGain(); sess.connect(bus);
        const ev = tl.allSfx(); nextEv = 0; while (nextEv < ev.length && ev[nextEv].t < t - 0.02) nextEv++;
        a0 = ctx.currentTime + 0.06; t0 = t;
      }
      function pumpAudio() {
        if (!sess || !ctx || ctx.state !== 'running') return;
        const ev = tl.allSfx();
        while (nextEv < ev.length && ev[nextEv].t <= t + 0.35) { const e2 = ev[nextEv++]; const at = a0 + (e2.t - t0); if (at >= ctx.currentTime - 0.01) SFX.play(ctx, sess, Math.max(at, ctx.currentTime), e2.k, e2.o); }
      }
      // البناء والقياس
      function build() {
        const r = ov.getBoundingClientRect(), pr = r.height > r.width * 1.05;
        if (tl && pr === portrait) { fit(); return; }
        portrait = pr; if (tl) tl.stage.remove();
        tl = new TL(id, { portrait: portrait, calm: calm, all: true, noCorner: true }); tl.allSfx();
        frame.insertBefore(tl.stage, hit); fit(); tl.seek(t);
        if (playing) startAudio();
      }
      function fit() {
        const r = ov.getBoundingClientRect(), pad = (r.width < 560 || r.height < 560) ? 0 : 24, aw = r.width - pad * 2, ah = r.height - pad * 2;
        const s = Math.min(aw / tl.W, ah / tl.H), w = Math.floor(tl.W * s), hh = Math.floor(tl.H * s);
        css(frame, { width: w + 'px', height: hh + 'px', borderRadius: (pad ? 18 : 0) + 'px' });
        scaleStage(tl.stage, s);
      }
      function setPlayIcon() { bPlay.innerHTML = ico(playing ? 'pause' : 'play', 22, 'currentColor', 2); bPlay.setAttribute('aria-label', playing ? 'إيقاف مؤقت' : 'تشغيل'); bPlay.title = bPlay.getAttribute('aria-label'); }
      function setSndIcon() { bSnd.innerHTML = ico(snd ? 'vol' : 'mute', 22, 'currentColor', 2); bSnd.setAttribute('aria-label', snd ? 'كتم الصوت' : 'تشغيل الصوت'); bSnd.title = bSnd.getAttribute('aria-label'); bSnd.setAttribute('aria-pressed', snd ? 'true' : 'false'); }
      function setCalmIcon() { bCalm.classList.toggle('on', calm); bCalm.setAttribute('aria-pressed', calm ? 'true' : 'false'); bCalm.title = calm ? 'حركة هادئة (مفعّلة)' : 'حركة أهدأ'; }
      let endEl = null, bigEl = null;
      function render() {
        tl.seek(t); maxT = Math.max(maxT, t);
        const p = t / pl.dur * 100; fill.style.width = p + '%'; knob.style.right = p + '%';
        bar.setAttribute('aria-valuenow', String(Math.round(t))); bar.setAttribute('aria-valuetext', fmt(t) + ' من ' + fmt(pl.dur));
        tm.textContent = fmt(t) + ' / ' + fmt(pl.dur);
        const ci = tl.chapterAt(t); if (chl._c !== ci) { chl._c = ci; chl.textContent = pl.chapters[ci] ? pl.chapters[ci].title : ''; }
      }
      function showEnd(on) {
        if (on && !endEl) {
          endEl = h('div', 'mo-end', frame);
          const r1 = h('div', 'row', endEl);
          const rp = h('button', 'mo-eb2', r1); rp.type = 'button'; rp.innerHTML = ico('replay', 20, 'currentColor', 2) + '<span>أعد المشاهدة</span>'; rp.onclick = function () { seek(0); setPlaying(true); };
          const cb = h('button', 'mo-eb2 ghost', r1); cb.type = 'button'; cb.innerHTML = '<span>' + (opts.intro ? 'ابدأ' : 'إغلاق') + '</span>'; cb.onclick = function () { close(); };
          setTimeout(function () { try { rp.focus(); } catch (e) {} }, 50);
        } else if (!on && endEl) { endEl.remove(); endEl = null; }
      }
      function showBig(on) { if (on && !bigEl) { bigEl = h('button', 'mo-big', frame); bigEl.type = 'button'; bigEl.setAttribute('aria-label', 'تشغيل'); bigEl.innerHTML = ico('play', 36, 'currentColor'); bigEl.onclick = function (e) { e.stopPropagation(); setPlaying(true); }; } else if (!on && bigEl) { bigEl.remove(); bigEl = null; } }
      function setPlaying(on) {
        if (on && t >= pl.dur - 0.01) { t = 0; }
        playing = on; ended = false; showEnd(false); showBig(!on && !endEl);
        if (on) { p0 = performance.now(); t0 = t; startAudio(); loop(); } else { stopAudio(); cancelAnimationFrame(raf); }
        setPlayIcon(); wake();
      }
      function seek(nt) { t = cl(nt, 0, pl.dur); ended = false; showEnd(false); render(); if (playing) { p0 = performance.now(); t0 = t; startAudio(); } }
      function loop() {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function step(now) {
          if (closed || !playing) return;
          t = t0 + Math.max(0, now - p0) / 1000;
          if (t >= pl.dur) { t = pl.dur; render(); playing = false; ended = true; stopAudio(); setPlayIcon(); showEnd(true); wake(true); return; }
          render(); pumpAudio();
          raf = requestAnimationFrame(step);
        });
      }
      // إخفاء الأدوات أثناء التشغيل
      let idleT = 0;
      function wake(stay) { ov.classList.remove('idle'); clearTimeout(idleT); if (playing && !stay) idleT = setTimeout(function () { if (playing && !scrubbing) ov.classList.add('idle'); }, 2600); }
      ov.addEventListener('pointermove', function () { wake(); });
      // التحكم
      bPlay.onclick = function () { setPlaying(!playing); };
      hit.onclick = function () { if (ended) return; setPlaying(!playing); };
      bClose.onclick = function () { close(); };
      if (skipB) skipB.onclick = function () { close(false, true); };
      bRe.onclick = function () { seek(0); setPlaying(true); };
      bPrev.onclick = function () { const ci = tl.chapterAt(t), c = pl.chapters; const target = (t - c[ci].t > 1.2 || ci === 0) ? c[ci].t : c[ci - 1].t; seek(target); };
      bNext.onclick = function () { const ci = tl.chapterAt(t), c = pl.chapters; seek(ci < c.length - 1 ? c[ci + 1].t : pl.dur); };
      bSnd.onclick = function () { snd = !snd; setSoundPref(snd); if (master && ctx) { master.gain.setTargetAtTime(snd ? 1 : 0, ctx.currentTime, 0.02); if (snd && ctx.state === 'suspended') try { ctx.resume(); } catch (e) {} } setSndIcon(); };
      bCalm.onclick = function () { calm = !calm; if (tl) tl.calm = calm; setCalmIcon(); render(); };
      // الشريط
      let scrubbing = false, wasPlaying = false;
      function tAt(x) { const r = bar.getBoundingClientRect(); return cl((r.right - x) / r.width) * pl.dur; }
      bar.addEventListener('pointerdown', function (e) { scrubbing = true; wasPlaying = playing; if (playing) { playing = false; stopAudio(); cancelAnimationFrame(raf); } try { bar.setPointerCapture(e.pointerId); } catch (x) {} seek(tAt(e.clientX)); e.preventDefault(); });
      bar.addEventListener('pointermove', function (e) { const tt = tAt(e.clientX), r = bar.getBoundingClientRect(); tip.style.right = ((r.right - e.clientX) / r.width * 100) + '%'; const ci = tl ? tl.chapterAt(tt) : 0; tip.textContent = fmt(tt) + (pl.chapters[ci] ? ' · ' + pl.chapters[ci].title : ''); if (scrubbing) seek(tt); });
      const endScrub = function () { if (!scrubbing) return; scrubbing = false; if (wasPlaying && t < pl.dur) setPlaying(true); };
      bar.addEventListener('pointerup', endScrub); bar.addEventListener('pointercancel', endScrub);
      function key(e) {
        if (closed) return;
        const k = e.key;
        if (k === 'Escape') { e.preventDefault(); close(); }
        else if (k === ' ' || k === 'k' || k === 'K') { if (e.target && e.target.tagName === 'BUTTON' && k === ' ') return; e.preventDefault(); setPlaying(!playing); }
        else if (k === 'ArrowLeft') { e.preventDefault(); seek(t + 5); }
        else if (k === 'ArrowRight') { e.preventDefault(); seek(t - 5); }
        else if (k === 'm' || k === 'M') { bSnd.onclick(); }
        else if (k === 'Home') { seek(0); }
        else if (k === 'Tab') { const f = Array.from(ov.querySelectorAll('button,[tabindex="0"]')).filter(function (x) { return x.offsetParent !== null; }); if (!f.length) return; const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
      }
      document.addEventListener('keydown', key, true);
      const onRes = function () { if (!closed) build(); };
      window.addEventListener('resize', onRes);
      const unlock = function () { if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} } };
      ov.addEventListener('pointerdown', unlock, true);
      function close(silent, skipped) {
        if (closed) return; closed = true; PLAYING = null;
        cancelAnimationFrame(raf); stopAudio(); clearTimeout(idleT);
        document.removeEventListener('keydown', key, true); window.removeEventListener('resize', onRes);
        ov.classList.remove('on'); setTimeout(function () { ov.remove(); }, silent ? 0 : 300);
        try { if (last && last.focus) last.focus(); } catch (e) {}
        const watched = !skipped && (maxT >= pl.dur * 0.9 || ended);
        resolve({ watched: watched, at: Math.round(t * 10) / 10 });
      }
      const api = { close: close, seek: seek, play: function () { setPlaying(true); }, pause: function () { setPlaying(false); }, get t() { return t; }, get dur() { return pl.dur; }, get playing() { return playing; }, get tl() { return tl; }, get sound() { return snd; }, get calm() { return calm; } };
      PLAYING = api;
      build(); setPlayIcon(); setSndIcon(); setCalmIcon(); render();
      if (playing) setPlaying(true); else showBig(true);
      setTimeout(function () { try { (skipB || bPlay).focus({ preventScroll: true }); } catch (e) {} }, 60);
      wake();
    });
  }

  /* ================= الصور الممثلة والرسم إطاراً إطاراً ================= */
  function poster_(id, w, o) {
    o = o || {}; injectCSS();
    const spec = CLIPS[id]; const wrap = h('div', 'mo-pv'); if (!spec) return wrap;
    const portrait = !!o.portrait, W = portrait ? 1080 : 1920, H = portrait ? 1920 : 1080, ww = w || 320, s = ww / W;
    css(wrap, { width: ww + 'px', height: Math.round(H * s) + 'px' });
    const tl = new TL(id, { portrait: portrait }); scaleStage(tl.stage, s);
    wrap.appendChild(tl.stage); tl.seek(o.t != null ? o.t : spec.poster || 1);
    wrap.setAttribute('role', 'img'); wrap.setAttribute('aria-label', spec.title);
    return wrap;
  }
  function frame_(id, t, host, o) {
    o = o || {}; if (!host || !CLIPS[id]) return null; injectCSS();
    const rw = host.clientWidth || 0, rh = host.clientHeight || 0;
    const portrait = o.portrait != null ? !!o.portrait : (rh > rw);
    let tl = host._moTL;
    if (!tl || tl.id !== id || tl.v !== portrait) {
      if (tl) tl.stage.remove();
      tl = host._moTL = new TL(id, { portrait: portrait, calm: !!o.calm });
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      host.style.overflow = 'hidden'; host.appendChild(tl.stage); tl.stage.style.position = 'absolute'; tl.stage.style.left = '0'; tl.stage.style.top = '0';
    }
    const s = rw ? rw / tl.W : 1; tl.stage.style.transform = s === 1 ? 'none' : 'scale(' + s + ')';
    tl.seek(t);
    return tl;
  }
  // للتصدير دون اتصال: كل المؤثرات مولَّدة في سياق صوتي غير متصل (نفس الدوال)
  async function audio_(id, sr) {
    sr = sr || 48000; const tl = new TL(id, { portrait: false, all: true }), ev = tl.allSfx(), dur = tl.dur + 0.6;
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext, ctx = new OAC(2, Math.ceil(dur * sr), sr);
    const bus = SFX.bus(ctx, ctx.destination);
    ev.forEach(function (e) { SFX.play(ctx, bus, e.t, e.k, e.o); });
    const buf = await ctx.startRendering();
    const enc = function (a) { const u = new Uint8Array(a.buffer, a.byteOffset, a.byteLength); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
    return { sr: sr, dur: dur, n: ev.length, L: enc(buf.getChannelData(0)), R: enc(buf.getChannelData(1)) };
  }
  function info_(id, portrait) { const tl = new TL(id, { portrait: !!portrait, all: true }); return { id: id, dur: tl.dur, chapters: tl.chapters, sfx: tl.allSfx().map(function (e) { return [e.t, e.k]; }) }; }

  const list = Object.keys(CLIPS).map(function (id) { const c = CLIPS[id], p = plan(c), o = { id: id, title: c.title, section: c.section, dur: Math.round(p.dur * 10) / 10, desc: c.desc }; if (c.admin) o.admin = true; if (c.route) o.route = c.route; return o; });
  return { list: list, play: play, poster: poster_, frame: frame_, audio: audio_, info: info_, clips: CLIPS, TL: TL, get current() { return PLAYING; } };
})();

/* ================= الواجهة العامة ================= */
const MOTION_CLIPS = MO.list;
function playMotion(id, opts) { return MO.play(id, opts); }
function motionPoster(id, w, opts) { return MO.poster(id, w, opts); }
function renderMotionFrame(id, t, host, opts) { return MO.frame(id, t, host, opts); }
