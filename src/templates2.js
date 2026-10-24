/* ================= قوالب مستوحاة من تصاميم المسارات والأنشطة (الإصدار الخامس) ================= */

/* ---------- رسومات مشتركة ---------- */
// مولّد أرقام ثابت: الزخارف العشوائية تبقى كما هي في كل رسم
function rng(seed) {
  return function () {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
// علامة الفراشة: أربع ورقات متقاطعة (من هوية الأكاديمية)
function xmark(ctx, cx, cy, s, color, rot) {
  box('deco', cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2, 'xmark');
  ctx.save(); ctx.translate(cx, cy); ctx.rotate((rot || 0) + Math.PI / 4); ctx.fillStyle = color;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(0, -s * 0.03);
    ctx.bezierCurveTo(s * 0.06, -s * 0.2, s * 0.28, -s * 0.38, s * 0.12, -s * 0.5);
    ctx.bezierCurveTo(s * 0.02, -s * 0.47, -s * 0.12, -s * 0.36, -s * 0.03, -s * 0.03);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
// شجرة صنوبر من ثلاث طبقات
function pine(ctx, x, by, h, color) {
  const w = h * 0.42;
  ctx.fillStyle = color;
  [[0, 1], [0.28, 0.82], [0.52, 0.62]].forEach(function (t) {
    const y0 = by - h * t[0] - h * 0.08, ww = w * t[1];
    ctx.beginPath(); ctx.moveTo(x - ww, y0); ctx.lineTo(x, y0 - h * 0.52); ctx.lineTo(x + ww, y0); ctx.closePath(); ctx.fill();
  });
  ctx.fillRect(x - h * 0.025, by - h * 0.1, h * 0.05, h * 0.1);
}
// شريط منحنٍ بعرض ثابت على قطع ناقص
function band(ctx, cx, cy, rx, ry, h, a0, a1, fill) {
  const n = 48; ctx.beginPath();
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
  for (let i = n; i >= 0; i--) { const a = a0 + (a1 - a0) * i / n; ctx.lineTo(cx + rx * Math.cos(a), cy + ry * Math.sin(a) + h); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
// الشريط الملتوي على شكل S (من تصاميم إثمار وإشراق)
function ribbonS(ctx, cx, cy, s, c1, c2) {
  box('deco', cx - s * 0.62, cy - s * 0.62, cx + s * 0.62, cy + s * 0.62, 'ribbon');
  const rx = s * 0.5, ry = s * 0.2, h = s * 0.26, y1 = cy - s * 0.3, y2 = cy + s * 0.08;
  band(ctx, cx, y1, rx, ry, h, -Math.PI / 2, 0, lighten(c1, -0.18));
  band(ctx, cx, y1, rx, ry, h, 0, Math.PI / 2, c1);
  band(ctx, cx, y2, rx, ry, h, Math.PI / 2, Math.PI, c2);
  band(ctx, cx, y2, rx, ry, h, Math.PI, Math.PI * 1.5, lighten(c2, -0.2));
  // وصلة بين القطعتين
  ctx.fillStyle = c2; ctx.fillRect(cx - s * 0.004, y1 + ry, s * 0.012, h);
}
// بطاقتان متراكبتان بنقش مربعات (من «حملة الرسالة»)
function pixelCards(ctx, cx, cy, w, C) {
  const h = w * 1.18;
  box('deco', cx - w * 0.85, cy - h * 0.62, cx + w * 0.62, cy + h * 0.62, 'cards');
  const save = BOXES; BOXES = null;
  ctx.save(); ctx.translate(cx - w * 0.22, cy + h * 0.04); ctx.rotate(-0.16);
  ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = w * 0.08; ctx.shadowOffsetY = w * 0.03;
  fillRR(ctx, -w / 2, -h / 2, w, h, w * 0.08, C.p); ctx.restore();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(0.07);
  ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = w * 0.1; ctx.shadowOffsetY = w * 0.04;
  fillRR(ctx, -w / 2, -h / 2, w, h, w * 0.08, '#ffffff');
  ctx.shadowColor = 'transparent';
  const q = w * 0.13, gx = -w * 0.3, gy = -h * 0.22;
  const cells = [[1, 0, C.p], [2, 1, lighten(C.p, 0.45)], [1, 1, lighten(C.pd, 0.25)], [0, 2, lighten(C.p, 0.6)], [2, 2, C.pd], [3, 1, lighten(C.p, 0.3)], [0, 1, lighten(C.pd, 0.5)]];
  cells.forEach(function (c) { ctx.fillStyle = c[2]; ctx.fillRect(gx + c[0] * q, gy + c[1] * q, q, q); });
  fillRR(ctx, gx + 1 * q, gy - 1.2 * q, q * 1.1, q * 1.1, q * 0.15, C.pd); xmark(ctx, gx + 1.55 * q, gy - 0.65 * q, q * 0.8, '#ffffff');
  fillRR(ctx, gx + 3.2 * q, gy + 2.2 * q, q * 1.1, q * 1.1, q * 0.15, C.pd); star(ctx, gx + 3.75 * q, gy + 2.75 * q, q * 0.4, '#ffffff', 0);
  ctx.restore();
  BOXES = save;
}
// قصاصات الاحتفال
function confetti(ctx, W, H, cols, seed, avoid) {
  const r = rng(seed || 3), u = W / 1080;
  for (let i = 0; i < 46; i++) {
    const x = r() * W, y = r() * H * 0.92;
    if (avoid && x > avoid.x0 && x < avoid.x1 && y > avoid.y0 && y < avoid.y1) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(r() * Math.PI * 2); ctx.fillStyle = cols[i % cols.length];
    if (i % 3 === 0) { ctx.strokeStyle = cols[i % cols.length]; ctx.lineWidth = 6 * u; ctx.beginPath(); ctx.arc(0, 0, 16 * u, 0, Math.PI * 0.7); ctx.stroke(); }
    else ctx.fillRect(-4 * u, -12 * u, 8 * u, 24 * u);
    ctx.restore();
  }
}
// صف معلومات بأعمدة: أيقونة فوق سطرين، تفصلها خطوط رأسية
function infoCols(ctx, items, cx, y, s, color, iconColor, sep) {
  items = items.filter(function (it) { return has(it.a) || has(it.b); });
  if (!items.length) return 0;
  let ws = items.map(function (it) { return Math.max(textW(ctx, it.a, s), textW(ctx, it.b, s), s * 1.4); });
  let gap = s * 1.6, tot = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (items.length - 1);
  // نصوص طويلة: تُصغَّر الأعمدة لتبقى في عرض التصميم
  const room = cx * 2 * 0.9;
  if (tot > room) { const f = Math.max(0.6, room / tot); s *= f; ws = ws.map(function (w) { return Math.min(w * f, room / items.length); }); gap *= f; tot = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (items.length - 1); }
  let x = cx + tot / 2;
  items.forEach(function (it, i) {
    infoNext(ctx);
    const xc = x - ws[i] / 2;
    icon(ctx, it.ic, xc, y, s * 1.05, iconColor);
    line(ctx, it.a, xc, y + s * 1.25, { size: s, color: color, align: 'center', maxW: ws[i] });
    line(ctx, it.b, xc, y + s * 2.4, { size: s, color: color, align: 'center', maxW: ws[i] });
    x -= ws[i];
    if (i < items.length - 1) { vline(ctx, x - gap / 2, y - s * 0.4, y + s * 2.8, sep, Math.max(1, s * 0.05)); x -= gap; }
  });
  return s * 3.1;
}
// سماء ليلية بنجوم وقمر
function nightSky(ctx, W, H, base, moon) {
  const u = W / 1080;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, lighten(base, -0.35)); g.addColorStop(0.6, base); g.addColorStop(1, lighten(base, 0.12));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const r = rng(11);
  for (let i = 0; i < 70; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.25 + r() * 0.6) + ')'; ctx.beginPath(); ctx.arc(r() * W, r() * H * 0.62, (0.8 + r() * 2.2) * u, 0, Math.PI * 2); ctx.fill(); }
  if (moon) {
    const gl = ctx.createRadialGradient(moon.x, moon.y, 0, moon.x, moon.y, moon.r * 3.2);
    gl.addColorStop(0, 'rgba(255,255,255,0.28)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gl; ctx.fillRect(moon.x - moon.r * 3.2, moon.y - moon.r * 3.2, moon.r * 6.4, moon.r * 6.4);
    ctx.fillStyle = '#f4f1e8'; ctx.beginPath(); ctx.arc(moon.x, moon.y, moon.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.16], [-0.05, 0.38, 0.12]].forEach(function (c) { ctx.beginPath(); ctx.arc(moon.x + c[0] * moon.r, moon.y + c[1] * moon.r, c[2] * moon.r, 0, Math.PI * 2); ctx.fill(); });
  }
}
function mountains(ctx, W, H, top, cols, seed) {
  const r = rng(seed || 5);
  cols.forEach(function (col, li) {
    const y0 = top + (H - top) * li * 0.22, amp = (H - top) * (0.32 - li * 0.06);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
    let x = 0; ctx.lineTo(0, y0 + amp * r());
    while (x < W) { x += W * (0.12 + r() * 0.16); ctx.lineTo(x, y0 + amp * (0.1 + r() * 0.9)); }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  });
}
function forestRow(ctx, W, by, h, col, seed, gapK) {
  const r = rng(seed || 9);
  let x = -h * 0.2;
  while (x < W + h * 0.3) { const hh = h * (0.65 + r() * 0.5); pine(ctx, x, by + h * 0.05, hh, col); x += h * (gapK || 0.34) * (0.7 + r() * 0.6); }
}
function campfire(ctx, x, y, s) {
  const gl = ctx.createRadialGradient(x, y, 0, x, y, s * 3);
  gl.addColorStop(0, 'rgba(255,170,60,0.55)'); gl.addColorStop(1, 'rgba(255,170,60,0)');
  ctx.fillStyle = gl; ctx.fillRect(x - s * 3, y - s * 3, s * 6, s * 6);
  ctx.fillStyle = '#5a3a22'; ctx.save(); ctx.translate(x, y + s * 0.2); ctx.rotate(0.3); ctx.fillRect(-s * 0.7, -s * 0.08, s * 1.4, s * 0.16); ctx.rotate(-0.6); ctx.fillRect(-s * 0.7, -s * 0.08, s * 1.4, s * 0.16); ctx.restore();
  [['#f7a531', 1], ['#ffd35c', 0.6]].forEach(function (f) {
    ctx.fillStyle = f[0]; ctx.beginPath(); ctx.moveTo(x - s * 0.4 * f[1], y + s * 0.1);
    ctx.quadraticCurveTo(x - s * 0.45 * f[1], y - s * 0.5 * f[1], x, y - s * 1.1 * f[1]);
    ctx.quadraticCurveTo(x + s * 0.45 * f[1], y - s * 0.5 * f[1], x + s * 0.4 * f[1], y + s * 0.1); ctx.closePath(); ctx.fill();
  });
}
function tent(ctx, x, by, s, col, dark) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - s, by); ctx.lineTo(x, by - s * 0.95); ctx.lineTo(x + s, by); ctx.closePath(); ctx.fill();
  ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(x - s * 0.28, by); ctx.lineTo(x, by - s * 0.62); ctx.lineTo(x + s * 0.28, by); ctx.closePath(); ctx.fill();
}
function svOf(W, H) { const u = W / 1080; return H > W * 1.5 ? u * 1.12 : Math.min(1, H / 1350) * u; }
function lines(str) { return String(str || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean); }

TEMPLATES.push(

/* ---------- 15. البطاقتان المصورتان (حملة الرسالة) ---------- */
{
  id: 'ann_cards', type: 'ann', name: 'البطاقات والشريط', tags: 'لقاء ديوانية حملة الرسالة سير صحابة زوم بطاقات', isNew: 1,
  sizes: ['post', 'square', 'story'],
  variants: [{ id: 'deep', name: 'شريط داكن', sw: ['#f8f8f8', '#2b2b2b', '#2d4d24'] }, { id: 'accent', name: 'شريط مميز', sw: ['#f8f8f8', '#2b2b2b', '#f99229'] }, { id: 'soft', name: 'شريط أساسي', sw: ['#f8f8f8', '#2b2b2b', '#467839'] }],
  colorLabels: { accent: 'لون الشريط' },
  fields: [
    { k: 'title', label: 'العنوان', kind: 'area', def: 'حَمَلة الرسالة', max: 34 },
    { k: 'sub', label: 'سطر تحت العنوان', def: '- سير وعبر من حياة الصحابة', max: 44 },
    { k: 'when', label: 'اليوم والوقت', def: 'الأربعاء 9:00م', half: 1 },
    { k: 'place', label: 'المكان أو المنصة', def: 'عبر زوم', half: 1 },
    { k: 'who', label: 'المقدّم (في الشريط)', def: 'أ. أنس المحسن', max: 30 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, sv = svOf(W, H);
    const base = OV.bg || C.paper, fg = onBg(base, C.ink);
    const bc = OV.accent || (v === 'accent' ? C.a2 : v === 'soft' ? C.p : C.pd);
    paintBg(ctx, W, H, base);
    const story = H > W * 1.5, bandTop = H * (story ? 0.66 : H <= W ? 0.62 : 0.64);
    G(ctx, 'footer'); academy(ctx, alpha(fg, 0.7), 72 * u, 62 * u, 112 * u, 'tl');
    G(ctx, 'logo'); drawLogo(ctx, T, W - 72 * u, 56 * u, 124 * u, isDark(base) ? '#ffffff' : 'color', 'tr');
    const xr = W - 84 * u, cw = W * 0.3, ch = cw * 1.18, ccx = W * 0.27, ccy = bandTop + ch * 0.08;
    const cardTop = ccy - ch * 0.62;
    const tf = fit(ctx, d.title, { maxW: W * 0.8, maxH: H * (story ? 0.2 : 0.17), size: 128 * sv * k, lh: 1.2, balance: true, bold: 1, title: true });
    let y = Math.max(210 * u, H * (story ? 0.2 : 0.15));
    G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: OV.title || fg }); y += tf.h + 10 * sv;
    G(ctx, 'sub'); if (has(d.sub)) { line(ctx, d.sub, xr, y + 26 * sv, { size: 42 * sv, color: alpha(fg, 0.85), align: 'right', maxW: W * 0.8 }); y += 70 * sv; }
    G(ctx, 'info');
    const iy = Math.max(y + 90 * sv, story ? H * 0.43 : 0);
    const room = iy + 30 * sv > cardTop ? xr - (ccx + cw * 0.62) - 30 * u : W * 0.8;
    const fa = line(ctx, d.when, xr, iy, { size: 40 * sv, color: fg, align: 'right', bold: 0.5, maxW: room * 0.5 });
    if (has(d.place)) {
      const L = Math.max(40 * u, Math.min(170 * u, room - fa.w - textW(ctx, d.place, 40 * sv) - 60 * u));
      const x1 = xr - (fa.w ? fa.w + 26 * u : 0);
      if (fa.w) hline(ctx, x1, x1 - L, iy + 2 * u, alpha(fg, 0.55), 2 * u);
      line(ctx, d.place, x1 - (fa.w ? L + 26 * u : 0), iy, { size: 40 * sv, color: fg, align: 'right', maxW: room * 0.45 });
    }
    G(ctx, 'band'); area(0, bandTop, W, H); ctx.fillStyle = bc; ctx.fillRect(0, bandTop, W, H - bandTop);
    G(ctx, 'deco'); if (D()) pixelCards(ctx, ccx, ccy, cw, Object.assign({}, C, { p: lighten(bc, isDark(bc) ? 0.25 : -0.15), pd: isDark(bc) ? bc : C.pd }));
    G(ctx, 'who');
    if (has(d.who)) {
      const fc = onBg(bc), wy = H - Math.min(110 * sv, (H - bandTop) * 0.3);
      const f = line(ctx, d.who, xr, wy, { size: 40 * sv, color: fc, align: 'right', maxW: W * 0.4 });
      star(ctx, xr - f.w - 30 * u, wy, 15 * sv, C.a, 0);
    }
  }
},

/* ---------- 16. الشريط الملتوي ---------- */
{
  id: 'ann_ribbon', type: 'ann', name: 'الشريط الملتوي', tags: 'مجلس قراءة سيرة لجنة علمية شريط لقاء', isNew: 1,
  sizes: ['post', 'square', 'story'],
  variants: [{ id: 'side', name: 'العنوان جانباً', sw: ['#f8f8f8', '#2b2b2b', '#467839'] }, { id: 'center', name: 'العنوان تحته', sw: ['#f8f8f8', '#2b2b2b', '#68b251'] }],
  fields: [
    { k: 'title', label: 'العنوان', kind: 'area', def: 'فـي ظِـلال\nالسـيـرة', max: 34 },
    { k: 'sub', label: 'سطر تحت العنوان', def: 'مجلس قراءة', max: 30 },
    { k: 'when', label: 'اليوم والوقت', def: 'الجمعة | 6:00 ص', max: 30 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, sv = svOf(W, H);
    const base = OV.bg || C.paper, fg = onBg(base, C.ink), dark = isDark(base);
    const c1 = OV.accent || (dark ? C.pl : C.pl), c2 = dark ? lighten(C.p, 0.15) : C.p;
    paintBg(ctx, W, H, base);
    G(ctx, 'footer'); academy(ctx, alpha(fg, 0.75), 72 * u, 60 * u, 110 * u, 'tl'); social(ctx, alpha(fg, 0.6), 72 * u, H - 64 * u, 112 * u, 'bl');
    G(ctx, 'logo'); const lg = drawLogo(ctx, T, W - 72 * u, 56 * u, 100 * u, dark ? '#ffffff' : 'color', 'tr');
    if (lg.w) hline(ctx, 72 * u + 130 * u, W - 72 * u - lg.w - 30 * u, 56 * u + lg.h / 2, alpha(fg, 0.18), 2 * u);
    const xr = W - 84 * u;
    if (v === 'center') {
      const s = Math.min(W * 0.5, H * (H <= W ? 0.25 : 0.32)), cy = H * (H <= W ? 0.3 : 0.36);
      G(ctx, 'deco'); if (D()) { ribbonS(ctx, W / 2, cy, s, c1, c2); star(ctx, W / 2 - s * 0.5, cy - s * 0.5, s * 0.07, C.a, 0); sparkle(ctx, W / 2 - s * 0.38, cy - s * 0.62, s * 0.03, C.a); }
      const tf = fit(ctx, d.title, { maxW: W * 0.82, maxH: H * (H <= W ? 0.17 : 0.2), size: 120 * sv * k, lh: 1.2, balance: true, bold: 1, title: true });
      let y = cy + s * 0.62 + 40 * sv;
      G(ctx, 'title'); drawFit(ctx, tf, W / 2, y, { align: 'center', color: OV.title || fg }); y += tf.h;
      G(ctx, 'sub'); if (has(d.sub)) { line(ctx, d.sub, W / 2, y + 40 * sv, { size: 40 * sv, color: alpha(fg, 0.8), align: 'center', maxW: W * 0.8 }); y += 70 * sv; }
      G(ctx, 'info'); infoItem(ctx, 'moon', d.when, W / 2 + infoW(ctx, 'moon', d.when, { size: 36 * sv }) / 2, y + 60 * sv, { size: 36 * sv, color: fg, iconColor: C.a2 });
      G(ctx, 'band'); area(0, H - 22 * u, W, H); ctx.fillStyle = C.p; ctx.fillRect(0, H - 22 * u, W, 22 * u);
      return;
    }
    const tf = fit(ctx, d.title, { maxW: W * 0.62, maxH: H * 0.24, size: 116 * sv * k, lh: 1.18, balance: true, bold: 0.7, title: true });
    let y = Math.max(210 * u, H * 0.16);
    G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: OV.title || fg }); y += tf.h + 20 * sv;
    G(ctx, 'sub'); if (has(d.sub)) { infoItem(ctx, 'mic', d.sub, xr, y + 24 * sv, { size: 38 * sv, color: fg, iconColor: C.a2 }); y += 60 * sv; }
    const bot = H - 160 * u, s = Math.min(W * 0.52, (bot - y) * 0.76), cy = y + (bot - y) / 2;
    G(ctx, 'deco'); if (D()) { ribbonS(ctx, W * 0.36, cy, s, c1, c2); star(ctx, W * 0.36 - s * 0.62, cy - s * 0.4, s * 0.06, C.a, 0); }
    G(ctx, 'info'); infoItem(ctx, 'moon', d.when, xr, H - 120 * u, { size: 36 * sv, color: fg, iconColor: C.a2 });
  }
},

/* ---------- 17. الليل ---------- */
{
  id: 'ann_night', type: 'ann', name: 'ليلة المخيم', tags: 'ليل مخيم ديوانية غابة قمر جبال سمر لقاء ملتقى', isNew: 1,
  sizes: ['post', 'square', 'story'],
  variants: [{ id: 'forest', name: 'غابة وقمر', sw: ['#0e423e', '#ffffff', '#fbb03b'] }, { id: 'camp', name: 'جبال ونار', sw: ['#0e423e', '#ffffff', '#f99229'] }],
  colorLabels: { bg: 'لون السماء' },
  fields: [
    { k: 'kicker', label: 'سطر صغير فوق العنوان', def: 'توجهوا إلى مجموعاتكم!', max: 34 },
    { k: 'title', label: 'العنوان', kind: 'area', def: 'الديوانيـة', max: 26 },
    { k: 'sub', label: 'سطر تحت العنوان', def: 'الخميس 10:00 مساءً', max: 34 },
    { k: 'who', label: 'وسم صغير (المقدّم)', def: 'أ. محمد حسين', max: 26 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, sv = svOf(W, H);
    const base = OV.bg || C.teal;
    const moon = { x: W * 0.2, y: Math.min(H * 0.13, 190 * u), r: 62 * u };
    nightSky(ctx, W, H, base, v === 'forest' && D() ? moon : null);
    const ground = H * (H > W * 1.5 ? 0.66 : 0.62);
    G(ctx, 'deco');
    if (D()) {
      quiet(function () {
        if (v === 'camp') {
          mountains(ctx, W, H, ground - (H - ground) * 0.35, [alpha(lighten(base, 0.35), 0.9), lighten(base, 0.12), lighten(base, -0.25)], 21);
          tent(ctx, W * 0.72, H - (H - ground) * 0.22, (H - ground) * 0.28, lighten(C.a2, -0.1), lighten(base, -0.5));
          campfire(ctx, W * 0.46, H - (H - ground) * 0.2, (H - ground) * 0.09);
          ctx.fillStyle = lighten(base, -0.45); ctx.fillRect(0, H - (H - ground) * 0.12, W, H);
        } else {
          const fh2 = Math.min(H - ground, W * 0.5); forestRow(ctx, W, H - fh2 * 0.4, fh2 * 0.75, alpha(lighten(C.tealL, -0.1), 0.55), 4, 0.3);
          forestRow(ctx, W, H + 10 * u, fh2 * 0.85, lighten(base, -0.45), 8, 0.26);
          const th = Math.min(H - ground, W * 0.5); [[0.1, 0.95], [0.86, 1.05], [0.6, 0.7]].forEach(function (t) { pine(ctx, W * t[0], H + 20 * u, th * t[1], mixC(C.pl, '#9aa98a', 0.6)); });
        }
      });
      area(0, ground, W, H);
    }
    G(ctx, 'logo'); drawLogo(ctx, T, W - 70 * u, 60 * u, 110 * u, '#ffffff', 'tr');
    G(ctx, 'footer'); academy(ctx, 'rgba(255,255,255,0.8)', 70 * u, H - 60 * u, 110 * u, 'bl');
    const tf = fit(ctx, d.title, { maxW: W * 0.84, maxH: H * 0.2, size: 180 * sv * k, lh: 1.15, balance: true, bold: 1, title: true });
    const hk = has(d.kicker) ? 70 * sv : 0, hs = has(d.sub) ? 70 * sv : 0, hw = has(d.who) ? 70 * sv : 0;
    let y = Math.max(moon.y + moon.r + 40 * u, (ground - (hk + tf.h + hs + hw)) / 2 + 20 * u);
    G(ctx, 'kicker'); if (hk) { line(ctx, d.kicker, W / 2, y + 22 * sv, { size: 36 * sv, color: '#ffffff', align: 'center', maxW: W * 0.8 }); y += hk; }
    G(ctx, 'title'); drawFit(ctx, tf, W / 2, y, { align: 'center', color: OV.title || '#ffffff' }); y += tf.h;
    G(ctx, 'sub'); if (hs) { line(ctx, d.sub, W / 2, y + 34 * sv, { size: 40 * sv, color: '#ffffff', align: 'center', maxW: W * 0.8 }); y += hs; }
    G(ctx, 'who'); if (hw) { const pw = textW(ctx, d.who, 28 * sv) + 42 * sv; pill(ctx, d.who, W / 2 + pw / 2, y + 30 * sv, 28 * sv, OV.accent || C.a2, '#ffffff'); }
  }
},

/* ---------- 18. الفقرات ---------- */
{
  id: 'ann_program', type: 'ann', name: 'فقرات البرنامج', tags: 'سمرة حفل ختام فقرات برنامج مسامرة', isNew: 1,
  sizes: ['post', 'square', 'story'],
  variants: [{ id: 'band', name: 'بتذييل ملوّن', sw: ['#f8f8f8', '#2b2b2b', '#467839'] }, { id: 'plain', name: 'بلا تذييل', sw: ['#f8f8f8', '#2b2b2b', '#fbb03b'] }],
  fields: [
    { k: 'title', label: 'العنوان', kind: 'area', def: 'مُسامـرة\nإشراقيـة', max: 34 },
    { k: 'head', label: 'عنوان القائمة', def: 'فقرات السمرة', max: 26 },
    { k: 'items', label: 'الفقرات (كل فقرة في سطر)', kind: 'area', def: 'مقدمة تحفيزية\nتلاوة\nمسابقة كاهوت\nإنشاد', max: 160, hint: 'حتى ثماني فقرات، تتوزع على عمودين' },
    { kind: 'date', label: 'التاريخ', map: { day: '{wd}', d1: '{hd} {hm} {hy}', d2: '{gd} {gm} {gy}' } },
    { k: 'day', label: 'اليوم', def: 'الخميس', half: 1 },
    { k: 'time', label: 'الوقت', def: '10:00 م', half: 1 },
    { k: 'd1', label: 'التاريخ الهجري', def: '16 صفر 1448', half: 1 },
    { k: 'd2', label: 'التاريخ الميلادي', def: '30 يوليو 2026', half: 1 },
    { k: 'p1', label: 'المنصة: السطر الأول', def: 'على برنامج', half: 1 },
    { k: 'p2', label: 'المنصة: السطر الثاني', def: 'zoom', half: 1 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, sv = svOf(W, H);
    const base = OV.bg || C.paper, fg = onBg(base, C.ink), mut = alpha(fg, 0.55);
    paintBg(ctx, W, H, base);
    if (D() && !BGFX) quiet(function () { const g = ctx.createRadialGradient(W * 0.1, H * 0.1, 0, W * 0.1, H * 0.1, W * 0.9); g.addColorStop(0, alpha(C.pl, 0.16)); g.addColorStop(1, alpha(C.pl, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); });
    const fh = v === 'band' ? 120 * u : 0;
    G(ctx, 'footer');
    if (fh) { area(0, H - fh, W, H); const bc = OV.accent || C.p; ctx.fillStyle = bc; ctx.fillRect(0, H - fh, W, fh); academy(ctx, '#ffffff', 72 * u, H - fh / 2 - 20 * u, 112 * u, 'tl'); }
    else academy(ctx, alpha(fg, 0.7), 72 * u, H - 64 * u, 112 * u, 'bl');
    G(ctx, 'logo');
    if (fh) drawLogo(ctx, T, W - 72 * u, H - fh / 2 + 34 * u, 110 * u, onBg(OV.accent || C.p) === '#ffffff' ? '#ffffff' : 'color', 'br');
    else drawLogo(ctx, T, W - 72 * u, 60 * u, 110 * u, isDark(base) ? '#ffffff' : 'color', 'tr');
    const tf = fit(ctx, d.title, { maxW: W * 0.76, maxH: H * 0.22, size: 140 * sv * k, lh: 1.18, balance: true, bold: 0.8, title: true });
    const it = lines(d.items).slice(0, 8), half = Math.max(1, Math.ceil(it.length / 2)), iS = Math.max(32 * sv, W > H ? 26 * u : 0), hInfo = iS * 3.1, hHead = has(d.head) ? 70 * sv : 0;
    const top = Math.max(fh ? 110 * u : 190 * u, H * 0.08), bottom = H - fh - (fh ? 60 * u : 150 * u);
    const rowH = Math.max(52 * sv, Math.min(78 * sv, (bottom - top - tf.h - hHead - hInfo - 40 * sv) / half)), fs = Math.min(46 * sv, rowH * 0.6), hList = rowH * half;
    const free = Math.max(0, bottom - top - tf.h - hHead - hList - hInfo), gap = Math.min(110 * sv, free / 3);
    let y = top + Math.max(0, (free - gap * 3) / 2);
    G(ctx, 'title'); drawFit(ctx, tf, W / 2, y, { align: 'center', color: OV.title || fg }); y += tf.h + gap;
    G(ctx, 'head'); if (hHead) { const f = line(ctx, d.head, W / 2, y + 20 * sv, { size: 34 * sv, color: mut, align: 'center' }); hline(ctx, W / 2 - f.w / 2 - 30 * u, W / 2 - f.w / 2 - 150 * u, y + 22 * sv, alpha(fg, 0.15), 2 * u); hline(ctx, W / 2 + f.w / 2 + 30 * u, W / 2 + f.w / 2 + 150 * u, y + 22 * sv, alpha(fg, 0.15), 2 * u); y += hHead; }
    G(ctx, 'list');
    const colW = W * 0.34;
    it.forEach(function (t, i) {
      G(ctx, 'li' + i);   // كل فقرة عنصر مستقل
      const col = i < half ? 0 : 1, row = col ? i - half : i;
      const xr = W / 2 + (col ? -30 * u : colW + 30 * u), yy = y + rowH * row + rowH / 2;
      sparkle(ctx, xr - 8 * u, yy - 10 * u, 15 * sv, C.a);
      const f = fit(ctx, t, { maxW: colW - 50 * u, maxH: rowH * 0.95, size: fs, lh: 1.15 }); drawFit(ctx, f, xr - 40 * u, yy - f.h / 2, { align: 'right', color: fg });
    });
    y += hList + gap;
    G(ctx, 'info');
    infoCols(ctx, [{ ic: 'moon', a: d.day, b: d.time }, { ic: 'cal', a: d.d1, b: d.d2 }, { ic: 'pin', a: d.p1, b: d.p2 }], W / 2, y + iS * 0.5, iS, fg, OV.accent || C.a2, alpha(fg, 0.2));
  }
},

/* ---------- 19. جدول اللقاءات ---------- */
{
  id: 'cover_schedule', type: 'cover', name: 'جدول اللقاءات', tags: 'جدول لقاءات مباشرة أسبوع مواعيد قائمة', isNew: 1,
  sizes: ['post', 'story', 'square'],
  variants: [{ id: 'cards', name: 'بطاقات', sw: ['#f8f8f8', '#2b2b2b', '#467839'] }, { id: 'tint', name: 'خلفية ملوّنة', sw: ['#ebe7e1', '#2b2b2b', '#467839'] }],
  fields: [
    { k: 'title', label: 'العنوان', def: 'لقاءاتٌ مباشرة', max: 28 },
    { k: 'sub', label: 'تحت العنوان', def: 'جدول اللقاءات في المجموعة التفاعلية · الأسبوع الأول', max: 60 },
    { k: 'rows', label: 'اللقاءات: كل لقاء في سطر', kind: 'area', def: 'الأربعاء | ديوانيّة الأربعاء | مجلس وُدّيّ لكسر الحواجز والتعارف | 6:00 م\nالجمعة | مجلس الاستهداء | وقفات وتلاوة مع سورة الكهف | 5:00 م\nالجمعة | مسابقة نار وشرار | مسابقة تفاعلية عبر المحادثة | 8:30 م', max: 600, hint: 'افصل بين الأجزاء بالشرطة |  :  اليوم | العنوان | الوصف | الوقت. حتى ستة لقاءات' },
    { k: 'note', label: 'سطر الختام', def: 'جهّزوا أنفسكم… ننتظر حضوركم وتفاعلكم', max: 50 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, sv = svOf(W, H);
    const base = OV.bg || (v === 'tint' ? C.warm : C.paper), fg = onBg(base, C.ink), dark = isDark(base);
    paintBg(ctx, W, H, base);
    G(ctx, 'logo'); drawLogo(ctx, T, 72 * u, 60 * u, 110 * u, dark ? '#ffffff' : 'color', 'tl');
    const xr = W - 80 * u;
    const tf = fit(ctx, d.title, { maxW: W * 0.62, size: 96 * sv * k, maxLines: 1, bold: 1, title: true, lh: 1.25 });
    let y = 70 * u;
    G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: OV.title || fg });
    if (D()) xmark(ctx, xr - tf.w - 46 * u, y + tf.h / 2, 46 * u, C.a2);
    y += tf.h + 6 * sv;
    G(ctx, 'sub'); if (has(d.sub)) { line(ctx, d.sub, xr, y + 18 * sv, { size: 30 * sv, color: OV.accent || C.a2, align: 'right', maxW: W - 160 * u }); y += 50 * sv; }
    const rows = lines(d.rows).slice(0, 6).map(function (r) { return r.split('|').map(function (x) { return x.trim(); }); });
    const foot = 120 * u, top = y + 50 * sv, n = Math.max(1, rows.length);
    const gap = 26 * sv, rh = Math.min(190 * sv, (H - foot - top - gap * (n - 1)) / n), oy = Math.max(0, (H - foot - top - n * rh - gap * (n - 1)) / 2.4);
    const tints = [C.a2, C.p, C.s, C.pl, C.a, C.pd];
    G(ctx, 'rows');
    rows.forEach(function (r, i) {
      G(ctx, 'row' + i);   // كل لقاء عنصر مستقل
      const ry = top + oy + i * (rh + gap), col = tints[i % tints.length];
      const chipW = Math.min(170 * u, rh * 1.05), x0 = 80 * u, x1 = xr;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.08)'; ctx.shadowBlur = 26 * u; ctx.shadowOffsetY = 8 * u;
      fillRR(ctx, x0, ry, x1 - chipW - 18 * u - x0, rh, 26 * u, dark ? alpha('#ffffff', 0.08) : '#ffffff');
      fillRR(ctx, x1 - chipW, ry, chipW, rh, 26 * u, alpha(col, dark ? 0.35 : 0.14));
      ctx.restore();
      area(x0, ry, x1, ry + rh);
      line(ctx, r[0], x1 - chipW / 2, ry + rh / 2, { size: Math.min(38 * sv, rh * 0.28), color: dark ? '#ffffff' : lighten(col, -0.15), align: 'center', bold: 0.8, maxW: chipW - 20 * u });
      const ix = x1 - chipW - 18 * u - 30 * u - rh * 0.22, isz = rh * 0.44;
      fillRR(ctx, ix - isz / 2, ry + rh / 2 - isz / 2, isz, isz, isz * 0.22, col);
      icon(ctx, ['mic', 'book', 'star', 'moon', 'layers', 'ring'][i % 6], ix, ry + rh / 2, isz * 0.7, '#ffffff');
      const tx = ix - isz / 2 - 24 * u, timeW = Math.max(150 * u, textW(ctx, r[3], Math.min(46 * sv, rh * 0.32), 0.6) + 20 * u);
      const tw = tx - (x0 + timeW + 30 * u);
      const hasD = has(r[2]);
      line(ctx, r[1], tx, ry + rh * (hasD ? 0.36 : 0.5), { size: Math.min(40 * sv, rh * 0.28), color: dark ? '#ffffff' : C.ink, align: 'right', bold: 0.7, maxW: tw });
      if (hasD) line(ctx, r[2], tx, ry + rh * 0.7, { size: Math.min(26 * sv, rh * 0.19), color: alpha(fg, 0.6), align: 'right', maxW: tw });
      line(ctx, r[3], x0 + 30 * u + timeW / 2, ry + rh / 2, { size: Math.min(46 * sv, rh * 0.32), color: dark ? '#ffffff' : C.ink, align: 'center', bold: 0.6, maxW: timeW });
    });
    G(ctx, 'footer');
    if (has(d.note)) { const f = line(ctx, d.note, W / 2, H - foot / 2, { size: 28 * sv, color: alpha(fg, 0.7), align: 'center', maxW: W * 0.6 }); if (D()) { star(ctx, W / 2 + f.w / 2 + 26 * u, H - foot / 2, 9 * u, C.a2, 0); star(ctx, W / 2 - f.w / 2 - 26 * u, H - foot / 2, 9 * u, C.a2, 0); } }
  }
},

/* ---------- 20. مسابقة: الصناديق الثلاثة ---------- */
{
  id: 'comp_boxes', type: 'comp', name: 'الصناديق الثلاثة', tags: 'مسابقة حفظ نظم منظومة البداية المدة الهدف رفاق', isNew: 1,
  sizes: ['post', 'square', 'story'],
  variants: [{ id: 'tiles', name: 'مربعات الرموز', sw: ['#ffffff', '#2b2b2b', '#0e423e'] }, { id: 'arcs', name: 'أقواس الزوايا', sw: ['#f8f8f8', '#2b2b2b', '#654b37'] }],
  fields: [
    { k: 'title', label: 'العنوان', kind: 'area', def: 'نظم البيقونية', max: 30 },
    { k: 'desc', label: 'الوصف', kind: 'area', def: 'يسر فريق الأنشطة أن يكشف لكم عن مسابقة حفظ جديدة وهي: حفظ نظم البيقونية', max: 120 },
    { k: 'l1', label: 'الصندوق الأول: العنوان', def: 'البداية', half: 1 }, { k: 'v1', label: 'نصه', kind: 'area', def: 'السبت الموافق\n11/29', half: 1 },
    { k: 'l2', label: 'الصندوق الثاني: العنوان', def: 'المدة', half: 1 }, { k: 'v2', label: 'نصه', kind: 'area', def: 'تسعة أيام', half: 1 },
    { k: 'l3', label: 'الصندوق الثالث: العنوان', def: 'الهدف', half: 1 }, { k: 'v3', label: 'نصه', kind: 'area', def: 'حفظ النظم\nكاملاً وتسميعه', half: 1 },
    { k: 'tag', label: 'شريط جانبي صغير', def: 'للذكور فقط', max: 16, hint: 'اختياري' }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, sv = svOf(W, H);
    const base = OV.bg || (v === 'arcs' ? C.paper : '#ffffff'), fg = onBg(base, C.ink), dark = isDark(base);
    const cols = [C.a, C.s, C.p];
    paintBg(ctx, W, H, base);
    G(ctx, 'deco');
    if (D() && v === 'arcs') {
      quiet(function () {
        [[0, C.s], [1, C.a], [2, C.p]].forEach(function (a) { ctx.strokeStyle = a[1]; ctx.lineWidth = 26 * u; const r = W * 0.34 - a[0] * 30 * u; ctx.beginPath(); ctx.arc(W + 40 * u, -40 * u, r, Math.PI * 0.5, Math.PI); ctx.stroke(); ctx.beginPath(); ctx.arc(-40 * u, H + 40 * u, r, -Math.PI * 0.5, 0); ctx.stroke(); });
      });
      area(W - W * 0.36, 0, W, W * 0.36); area(0, H - W * 0.36, W * 0.36, H);
    }
    G(ctx, 'logo'); drawLogo(ctx, T, W - 70 * u, 60 * u, 110 * u, dark ? '#ffffff' : 'color', 'tr');
    G(ctx, 'footer'); academy(ctx, alpha(fg, 0.6), W - 70 * u, H - 60 * u, 100 * u, 'br');
    G(ctx, 'tag'); if (has(d.tag)) { ctx.save(); ctx.translate(70 * u, 64 * u); const tw = textW(ctx, d.tag, 26 * u) + 40 * u; fillRR(ctx, -20 * u, 0, 50 * u, tw, 6 * u, C.s); area(50 * u, 64 * u, 100 * u, 64 * u + tw); ctx.translate(5 * u, tw / 2); ctx.rotate(-Math.PI / 2); quiet(function () { line(ctx, d.tag, 0, 0, { size: 26 * u, color: '#ffffff', align: 'center' }); }); ctx.restore(); }
    let y = Math.max(150 * u, H * 0.1) + (H > W * 1.5 ? H * 0.08 : 0);
    G(ctx, 'deco');
    if (D() && v === 'tiles') {
      const sq = 118 * sv, gap = 34 * sv, x0 = W / 2 - (sq * 3 + gap * 2) / 2;
      const cells = [['moon', C.teal], ['star', C.a], ['ring', C.s], ['ring', C.s], ['star', C.p], ['moon', C.teal]];
      quiet(function () { cells.forEach(function (c, i) { const x = x0 + (i % 3) * (sq + gap), yy = y + Math.floor(i / 3) * (sq + gap); fillRR(ctx, x, yy, sq, sq, 8 * u, c[1]); icon(ctx, c[0], x + sq / 2, yy + sq / 2, sq * 0.6, '#ffffff'); }); });
      box('deco', x0, y, x0 + sq * 3 + gap * 2, y + sq * 2 + gap, 'tiles');
      y += sq * 2 + gap + 70 * sv;
    } else y += 120 * sv;
    const tf = fit(ctx, d.title, { maxW: W * 0.78, maxH: 200 * sv, size: 110 * sv * k, lh: 1.25, balance: true, bold: 1, title: true });
    G(ctx, 'title'); drawFit(ctx, tf, W / 2, y, { align: 'center', color: OV.title || fg }); y += tf.h + 30 * sv;
    const df = fit(ctx, d.desc, { maxW: W * 0.74, maxH: 140 * sv, size: 38 * sv, lh: 1.5, balance: true, bold: 0.3 });
    G(ctx, 'sub'); drawFit(ctx, df, W / 2, y, { align: 'center', color: fg, hl: OV.accent || C.a2 }); y += df.h + 60 * sv;
    G(ctx, 'boxes');
    const bw = Math.min(250 * u, (W - 200 * u) / 3), bh = Math.min(230 * sv, H - y - 140 * u), g2 = 26 * u;
    const bx0 = W / 2 + (bw * 3 + g2 * 2) / 2;
    [[d.l1, d.v1], [d.l2, d.v2], [d.l3, d.v3]].forEach(function (b, i) {
      const x = bx0 - (i + 1) * bw - i * g2, c = i === 0 ? C.a : i === 1 ? C.s : C.p;
      rrect(ctx, x, y, bw, bh, 30 * u); ctx.fillStyle = dark ? alpha('#ffffff', 0.06) : alpha(c, 0.06); ctx.fill(); ctx.strokeStyle = c; ctx.lineWidth = 5 * u; ctx.stroke();
      area(x, y, x + bw, y + bh);
      line(ctx, b[0], x + bw / 2, y + 44 * sv, { size: 32 * sv, color: fg, align: 'center', bold: 0.8, maxW: bw - 30 * u });
      hline(ctx, x + 40 * u, x + bw - 40 * u, y + 80 * sv, alpha(c, 0.6), 2 * u);
      const vf = fit(ctx, b[1], { maxW: bw - 34 * u, maxH: bh - 110 * sv, size: 30 * sv, lh: 1.4, balance: true });
      drawFit(ctx, vf, x + bw / 2, y + 96 * sv + (bh - 110 * sv - vf.h) / 2, { align: 'center', color: fg });
    });
  }
},

/* ---------- 21. الفقرة الطويلة ---------- */
{
  id: 'quote_text', type: 'quote', name: 'الفقرة والحلقة', tags: 'اقتباس فقرة نص طويل رسالة رحمة حامل الرسالة ترياق', isNew: 1,
  sizes: ['square', 'post', 'story'],
  variants: [{ id: 'loop', name: 'خط وحلقة', sw: ['#f1f1ef', '#3a4152', '#3a4152'] }, { id: 'panel', name: 'لوحة داكنة', sw: ['#3a4152', '#ffffff', '#c6b9a6'] }],
  fields: [
    { k: 'body', label: 'النص', kind: 'area', def: 'من أهم صفات حامل الرسالة *خفض الجناح للمؤمنين ولين الجانب لهم* تودداً وإكراماً؛ فالتراحم والتواصل بين الثلة المؤمنة هو ما يقوي شوكتهم ويثبت أقدامهم في مواجهة الشدائد والأذى', max: 420, hint: 'ما بين *نجمتين* يظهر بارزاً' },
    { k: 'src', label: 'المصدر أو القائل', def: '', max: 40, hint: 'اختياري' }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080;
    if (v === 'panel') {
      const base = OV.bg || C.paper, pc = OV.accent || C.sd, fg = onBg(pc);
      paintBg(ctx, W, H, base);
      const px = W * 0.12;
      G(ctx, 'panel'); area(px, 0, W, H); ctx.fillStyle = pc; ctx.fillRect(px, 0, W - px, H);
      if (D()) { quiet(function () { const g = ctx.createRadialGradient(W * 0.75, H * 0.2, 0, W * 0.75, H * 0.2, W * 0.7); g.addColorStop(0, 'rgba(255,255,255,0.07)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(px, 0, W, H); }); }
      G(ctx, 'deco'); if (D()) { ctx.save(); ctx.translate(W - 120 * u, 130 * u); ctx.scale(-1, 1); STICKERS.quote.draw(ctx, 130 * u, fg); ctx.restore(); box('deco', W - 190 * u, 60 * u, W - 50 * u, 200 * u, 'q'); ctx.save(); ctx.globalAlpha = 0.9; sparkle(ctx, px, H * 0.62, 150 * u, lighten(C.warm, -0.15)); ctx.restore(); box('deco', px - 150 * u, H * 0.62 - 150 * u, px + 150 * u, H * 0.62 + 150 * u, 'sp'); }
      const bf = fit(ctx, d.body, { maxW: W - px - 300 * u, maxH: H * 0.58, size: 54 * u * k, lh: 1.65, bold: 0.3 });
      const y = Math.max(250 * u, (H - bf.h) / 2 - 60 * u);
      G(ctx, 'body'); drawFit(ctx, bf, W - 110 * u, y, { align: 'right', color: fg, hl: C.a });
      G(ctx, 'sub'); if (has(d.src)) line(ctx, '— ' + d.src, W - 110 * u, y + bf.h + 50 * u, { size: 34 * u, color: alpha(fg, 0.75), align: 'right' });
      G(ctx, 'logo'); const lg = drawLogo(ctx, T, W - 110 * u, H - 70 * u, 120 * u, fg, 'br');
      G(ctx, 'footer'); academy(ctx, alpha(fg, 0.8), W - 110 * u - (lg.w ? lg.w + 40 * u : 0), H - 82 * u, 110 * u, 'br');
      return;
    }
    const base = OV.bg || '#f1f1ef', fg = onBg(base, C.s), dark = isDark(base);
    paintBg(ctx, W, H, base);
    if (!BGFX && !OV.bg) quiet(function () { ctx.strokeStyle = 'rgba(0,0,0,0.05)'; ctx.lineWidth = 18 * u; ctx.strokeRect(9 * u, 9 * u, W - 18 * u, H - 18 * u); });
    G(ctx, 'logo'); const lg = drawLogo(ctx, T, W / 2 + 10 * u, 90 * u, 120 * u, dark ? '#ffffff' : 'color', 'tl');
    G(ctx, 'footer'); academy(ctx, alpha(fg, 0.8), W / 2 - 10 * u, 100 * u, 112 * u, 'tr');
    const lc = OV.accent || C.s, hc = C.a2;
    const bot = H - (D() ? H * 0.34 : 140 * u);
    const bf = fit(ctx, d.body, { maxW: W - 200 * u, maxH: bot - 260 * u - (has(d.src) ? 60 * u : 0), size: 50 * u * k, lh: 1.7, bold: 0.25 });
    const y = 250 * u + Math.max(0, (bot - 250 * u - bf.h) / 2 - 40 * u);
    G(ctx, 'body'); drawFit(ctx, bf, W - 100 * u, y, { align: 'right', color: OV.title || fg, hl: hc });
    G(ctx, 'sub'); if (has(d.src)) line(ctx, '— ' + d.src, W - 100 * u, y + bf.h + 40 * u, { size: 34 * u, color: alpha(fg, 0.7), align: 'right' });
    G(ctx, 'deco');
    if (D()) {
      const yb = H - H * 0.13, r = Math.min(H * 0.12, 150 * u), cx = W * 0.3;
      ctx.strokeStyle = lc; ctx.lineWidth = 30 * u; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-20 * u, yb + r * 0.4);
      ctx.bezierCurveTo(cx - r * 1.2, yb + r * 0.4, cx + r * 0.2, yb + r * 0.2, cx + r * 0.6, yb - r * 0.4);
      ctx.bezierCurveTo(cx + r * 1.0, yb - r * 1.3, cx - r * 0.4, yb - r * 1.6, cx - r * 0.55, yb - r * 0.6);
      ctx.bezierCurveTo(cx - r * 0.7, yb + r * 0.4, cx + r * 0.6, yb + r * 0.65, cx + r * 1.6, yb + r * 0.2);
      ctx.bezierCurveTo(W * 0.7, yb - r * 0.3, W * 0.85, yb - r * 0.1, W + 20 * u, yb - r * 0.25);
      ctx.stroke(); ctx.lineCap = 'butt';
      box('deco', 0, yb - r * 1.5, W, yb + r * 0.6, 'loop');
    }
  }
},

/* ---------- 22. التكريم على المنصة ---------- */
{
  id: 'thanks_podium', type: 'thanks', name: 'المنصة والقصاصات', tags: 'تهنئة مركز فائز مبادرة تكريم احتفال', isNew: 1,
  sizes: ['square', 'post', 'story'],
  variants: [{ id: 'light', name: 'فاتح', sw: ['#f8f8f8', '#2b2b2b', '#f99229'] }, { id: 'dark', name: 'داكن', sw: ['#33251c', '#ffffff', '#fbb03b'] }],
  colorLabels: { accent: 'لون المنصة' },
  fields: [
    { k: 'kicker', label: 'السطر الأعلى', def: 'المركز الثالث في مبادرة خيرهم لصاحبه', max: 50 },
    { k: 'name', label: 'الاسم', kind: 'area', def: 'إيـاد\nكريم فايد', max: 34, hint: 'سطران: الاسم الأول ثم بقيته' },
    { k: 'foot', label: 'نص على المنصة', def: 'الصاحب المثالي', max: 30 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080;
    const base = OV.bg || (v === 'dark' ? C.sdd : '#fafafa'), fg = onBg(base, C.ink), dark = isDark(base);
    const pc = OV.accent || C.p;
    paintBg(ctx, W, H, base);
    if (D()) quiet(function () {
      const g = ctx.createLinearGradient(W / 2, 0, W / 2, H * 0.8); g.addColorStop(0, alpha('#ffffff', dark ? 0.12 : 0.9)); g.addColorStop(1, alpha('#ffffff', 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(W * 0.42, 0); ctx.lineTo(W * 0.62, 0); ctx.lineTo(W * 0.95, H * 0.8); ctx.lineTo(W * 0.1, H * 0.8); ctx.closePath(); ctx.fill();
      confetti(ctx, W, H, [C.p, C.a, C.s, C.pd, C.a2], 5, { x0: W * 0.15, x1: W * 0.9, y0: H * 0.22, y1: H * 0.62 });
    });
    G(ctx, 'logo'); drawLogo(ctx, T, 64 * u, 64 * u, 150 * u, dark ? '#ffffff' : 'color', 'tl');
    const py = H * (H > W * 1.5 ? 0.66 : 0.7), pw = W * 0.84, ry = pw * 0.1;
    const nf = fit(ctx, d.name, { maxW: W * 0.8, maxH: py - H * 0.3, size: 170 * u * k, lh: 1.08, balance: false, bold: 1, title: true });
    let y = py - nf.h - 10 * u;
    G(ctx, 'kicker'); if (has(d.kicker)) line(ctx, d.kicker, W / 2 + 60 * u, y - 46 * u, { size: 32 * u, color: alpha(fg, 0.8), align: 'center', maxW: W * 0.8 });
    G(ctx, 'band');
    const px = W / 2 - pw / 2 + 60 * u;
    area(px, py - ry, px + pw, H);
    const g2 = ctx.createLinearGradient(0, py, 0, H); g2.addColorStop(0, lighten(pc, 0.15)); g2.addColorStop(1, pc);
    ctx.fillStyle = g2; ctx.fillRect(px, py, pw, H - py);
    ctx.fillStyle = lighten(pc, 0.55); ctx.beginPath(); ctx.ellipse(px + pw / 2, py, pw / 2, ry, 0, 0, Math.PI * 2); ctx.fill();
    G(ctx, 'name'); drawFit(ctx, nf, W / 2 + 60 * u, y, { align: 'center', color: OV.title || fg });
    G(ctx, 'foot'); if (has(d.foot)) line(ctx, d.foot, px + pw / 2, py + (H - py) * 0.55, { size: 40 * u, color: alpha(onBg(pc), 0.55), align: 'center', maxW: pw * 0.8 });
  }
},

/* ---------- 23. غلاف الاستمارة ---------- */
{
  id: 'cover_banner', type: 'cover', name: 'غلاف الاستمارة', tags: 'غلاف استمارة نموذج قوقل متابعة مهام يوم', isNew: 1,
  sizes: ['banner'],
  variants: [{ id: 'forest', name: 'غابة ليلية', sw: ['#0e423e', '#ffffff', '#fbb03b'] }, { id: 'brand', name: 'ألوان الهوية', sw: ['#2d4d24', '#ffffff', '#fbb03b'] }],
  colorLabels: { bg: 'لون السماء أو الخلفية' },
  fields: [
    { k: 'title', label: 'العنوان', def: 'استمارة متابعة', max: 30 },
    { k: 'sub', label: 'تحت العنوان', def: 'اليوم الثالث', max: 30 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1600;
    const base = OV.bg || (v === 'brand' ? C.pd : lighten(C.teal, -0.1));
    if (v === 'forest') {
      nightSky(ctx, W, H, base, null);
      if (D()) {
        quiet(function () { forestRow(ctx, W, H - 40 * u, 170 * u, alpha(lighten(base, 0.25), 0.7), 3, 0.3); forestRow(ctx, W, H + 10 * u, 220 * u, lighten(base, -0.5), 6, 0.22); tent(ctx, W * 0.5, H - 18 * u, 46 * u, lighten(base, 0.4), lighten(base, -0.6)); campfire(ctx, W * 0.56, H - 22 * u, 16 * u); });
        area(0, H * 0.45, W, H);
      }
    } else {
      paintBg(ctx, W, H, base);
      if (D()) { quiet(function () { petal(ctx, W * 0.08, H * 0.5, H * 0.7, 0.3, alpha('#ffffff', 0.07)); petal(ctx, W * 0.93, H * 0.2, H * 0.4, 0.1, alpha(C.a, 0.5)); }); area(0, 0, W * 0.2, H); area(W * 0.86, 0, W, H * 0.5); }
    }
    const tf = fit(ctx, d.title, { maxW: W * 0.62, maxH: H * 0.42, size: 120 * u * k, lh: 1.15, maxLines: 1, bold: 1, title: true });
    const cy = v === 'forest' ? H * 0.38 : H * 0.42;
    G(ctx, 'title'); drawFit(ctx, tf, W / 2, cy - tf.h / 2, { align: 'center', color: OV.title || '#ffffff' });
    G(ctx, 'sub'); if (has(d.sub)) line(ctx, d.sub, W / 2, cy + tf.h / 2 + 34 * u, { size: 40 * u, color: alpha('#ffffff', 0.85), align: 'center', maxW: W * 0.6 });
    G(ctx, 'logo'); if (v === 'brand') drawLogo(ctx, T, W - 60 * u, H - 50 * u, 150 * u, '#ffffff', 'br');
  }
},

/* ---------- 24. الباب المضيء ---------- */
{
  id: 'ann_door', type: 'ann', name: 'الباب المضيء', tags: 'افتتاح تسجيل باب بداية مسار جديد نخبة', isNew: 1,
  sizes: ['post', 'square', 'story'],
  variants: [{ id: 'warm', name: 'دافئ', sw: ['#fdebe1', '#2d4d24', '#467839'] }, { id: 'deep', name: 'داكن', sw: ['#33251c', '#ffffff', '#fbb03b'] }],
  fields: [
    { k: 'kicker', label: 'السطر الصغير', def: 'افتتاح التسجيل', max: 26 },
    { k: 'title', label: 'العنوان', kind: 'area', def: 'مسار النخبة', max: 26 },
    { k: 'sub', label: 'سطر أسفل التصميم', def: 'يبدأ التسجيل الأحد ٢٤ ربيع الأول', max: 44 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080;
    const base = OV.bg || (v === 'deep' ? C.sdd : C.warm), dark = isDark(base), fg = dark ? '#ffffff' : C.pd;
    if (OV.bg || BGFX) paintBg(ctx, W, H, base);
    else { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, lighten(base, dark ? 0.08 : 0.5)); g.addColorStop(1, dark ? lighten(base, -0.2) : lighten(C.pl, 0.45)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    G(ctx, 'footer'); academy(ctx, alpha(fg, 0.7), 70 * u, 60 * u, 112 * u, 'tl');
    G(ctx, 'logo'); drawLogo(ctx, T, W - 70 * u, 56 * u, 110 * u, dark ? '#ffffff' : 'color', 'tr');
    const xr = W - 90 * u;
    let y = Math.max(200 * u, H * 0.13);
    G(ctx, 'kicker'); if (has(d.kicker)) { line(ctx, d.kicker, xr, y, { size: 40 * u, color: OV.accent || C.a2, align: 'right', bold: 0.4 }); y += 60 * u; }
    const tf = fit(ctx, d.title, { maxW: W * 0.8, maxH: H * 0.18, size: 140 * u * k, lh: 1.15, balance: true, bold: 1, title: true });
    G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: OV.title || fg }); y += tf.h;
    const dw = W * 0.22, dh = Math.min(dw * 1.75, (H - y - 260 * u) * 0.62), dx = W / 2 - dw / 2, dy = Math.max(y + 80 * u, H * 0.62 - dh);
    G(ctx, 'deco');
    if (D()) {
      quiet(function () {
        const fl = ctx.createLinearGradient(0, dy + dh, 0, H); fl.addColorStop(0, alpha(dark ? '#ffffff' : C.p, dark ? 0.25 : 0.45)); fl.addColorStop(1, alpha(dark ? '#ffffff' : C.p, dark ? 0.05 : 0.15));
        ctx.fillStyle = fl; ctx.beginPath(); ctx.moveTo(dx, dy + dh); ctx.lineTo(dx + dw, dy + dh); ctx.lineTo(W * 0.92, H); ctx.lineTo(W * 0.08, H); ctx.closePath(); ctx.fill();
        const gl = ctx.createRadialGradient(W / 2, dy + dh / 2, 0, W / 2, dy + dh / 2, dw * 1.6); gl.addColorStop(0, 'rgba(255,255,255,0.75)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gl; ctx.fillRect(W / 2 - dw * 1.6, dy + dh / 2 - dw * 1.6, dw * 3.2, dw * 3.2);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(dx, dy, dw, dh);
      });
      box('deco', dx, dy, dx + dw, dy + dh, 'door');
    }
    G(ctx, 'sub'); if (has(d.sub)) line(ctx, d.sub, W / 2, H - 80 * u, { size: 36 * u, color: dark ? '#ffffff' : C.pd, align: 'center', maxW: W * 0.8, bold: 0.3 });
  }
},

/* ---------- 25. الكلمة الكبيرة ---------- */
{
  id: 'ann_bigword', type: 'ann', name: 'الكلمة الكبيرة', tags: 'بودكاست حلقة برنامج اسم كبير ديمة', isNew: 1,
  sizes: ['post', 'square', 'story', 'yt'],
  variants: [{ id: 'split', name: 'نصفان', sw: ['#ffffff', '#2b2b2b', '#4b9d97'] }, { id: 'full', name: 'لون واحد', sw: ['#4b9d97', '#2b2b2b', '#ffffff'] }],
  colorLabels: { accent: 'لون النصف السفلي' },
  fields: [
    { k: 'kicker', label: 'كلمة صغيرة فوق العنوان', def: 'بودكاست', max: 16 },
    { k: 'title', label: 'العنوان (كلمة أو كلمتان)', def: 'ديمة', max: 14 },
    { k: 'i1', label: 'المعلومة الأولى', def: 'الخميس . الساعة 9:00م', max: 30, half: 1 },
    { k: 'i2', label: 'المعلومة الثانية', def: 'لماذا ننقطع؟ وكيف نستمر؟', max: 34, half: 1 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, land = W > H, u = W / (land ? 1280 : 1080), sv = Math.min(1, H / 1350) * u;
    const top = OV.bg || '#ffffff', low = OV.accent || C.tealL, split = land ? H * 0.5 : H * 0.42;
    if (v === 'full') paintBg(ctx, W, H, low);
    else { paintBg(ctx, W, H, top); ctx.fillStyle = low; ctx.fillRect(0, split, W, H - split); }
    if (D()) quiet(function () { const r = rng(2); ctx.strokeStyle = alpha('#000000', 0.06); ctx.lineWidth = 3 * u; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(W * (0.2 + r() * 0.6), split + (H - split) * (0.3 + r() * 0.6), (40 + r() * 140) * u, 0, Math.PI * 2); ctx.stroke(); } });
    const fgT = onBg(v === 'full' ? low : top, C.ink), fgL = onBg(low, '#1f1f1f');
    G(ctx, 'logo'); drawLogo(ctx, T, W / 2, 50 * u, 90 * u, isDark(v === 'full' ? low : top) ? '#ffffff' : 'color', 'tc');
    const tf = fit(ctx, d.title, { maxW: W * 0.82, maxH: split * 0.55, size: (land ? 220 : 260) * sv * k, lh: 1.05, maxLines: 1, bold: 1, title: true });
    const ty = split - tf.h + tf.pb * 0.6;
    G(ctx, 'title'); drawFit(ctx, tf, W / 2, ty, { align: 'center', color: OV.title || fgT });
    G(ctx, 'kicker'); if (has(d.kicker)) line(ctx, d.kicker, W / 2 + tf.w * 0.12, ty - 30 * sv, { size: 40 * sv, color: fgT, align: 'center' });
    G(ctx, 'info');
    const s = 30 * sv, w1 = infoW(ctx, 'moon', d.i1, { size: s }), w2 = infoW(ctx, 'star', d.i2, { size: s }), gap = 60 * u, tot = w1 + w2 + (w1 && w2 ? gap : 0);
    const iy = split + Math.min(120 * sv, (H - split) * 0.3);
    infoItem(ctx, 'moon', d.i1, W / 2 + tot / 2, iy, { size: s, color: fgL, iconColor: C.a });
    infoItem(ctx, 'star', d.i2, W / 2 + tot / 2 - (w1 ? w1 + gap : 0), iy, { size: s, color: fgL, iconColor: C.a });
    G(ctx, 'footer'); academy(ctx, alpha(fgL, 0.75), W - 60 * u, H - 50 * u, 110 * u, 'br'); social(ctx, alpha(fgL, 0.7), 60 * u, H - 50 * u, 110 * u, 'bl');
  }
},

/* ================= مواقع التواصل: القصص ================= */
/* ---------- 26. قصة: الغلاف ---------- */
{
  id: 'story_cover', type: 'social', name: 'قصة: الغلاف', tags: 'قصة ستوري انستقرام سلسلة حكاية غلاف اسحب', isNew: 1,
  sizes: ['story'],
  variants: [{ id: 'paper', name: 'ورقي', sw: ['#f6f3ee', '#2d4d24', '#f99229'] }, { id: 'deep', name: 'داكن', sw: ['#2d4d24', '#ffffff', '#fbb03b'] }],
  fields: [
    { k: 'tag', label: 'الوسم أعلى القصة', def: '#جيل_الأمل', max: 24 },
    { k: 'title', label: 'العنوان', kind: 'area', def: 'كانت هذه الصُّحبة\n*أملي*\nالأخير..', max: 60, hint: 'ما بين *نجمتين* يظهر كبيراً بلون مميز' },
    { k: 'cta', label: 'زر الدعوة', def: 'اسحب لتكمل الحكاية', max: 26 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080;
    const base = OV.bg || (v === 'deep' ? C.pd : '#f6f3ee'), fg = onBg(base, C.pd), dark = isDark(base), ac = OV.accent || (dark ? C.a : C.a2);
    paintBg(ctx, W, H, base);
    storyFrame(ctx, W, H, d, T, base, ac);
    const tf = fit(ctx, d.title, { maxW: W * 0.72, maxH: H * 0.36, size: 110 * u * k, lh: 1.3, balance: false, bold: 0.9, title: true });
    const y = H * 0.5 - tf.h / 2 - 40 * u;
    G(ctx, 'title'); drawFit(ctx, tf, W - 150 * u, y, { align: 'right', color: OV.title || fg, hl: ac });
    G(ctx, 'cta'); if (has(d.cta)) pill(ctx, d.cta + '  ‹', W - 150 * u, y + tf.h + 70 * u, 30 * u, ac, '#ffffff', { bold: 0.4 });
  }
},
/* ---------- 27. قصة: الصفحة ---------- */
{
  id: 'story_text', type: 'social', name: 'قصة: صفحة نص', tags: 'قصة ستوري نص فقرة حكاية سلسلة صفحة', isNew: 1,
  sizes: ['story'],
  variants: [{ id: 'paper', name: 'ورقي', sw: ['#f6f3ee', '#2b2b2b', '#f99229'] }, { id: 'deep', name: 'داكن', sw: ['#2d4d24', '#ffffff', '#fbb03b'] }],
  fields: [
    { k: 'tag', label: 'الوسم أعلى القصة', def: '#جيل_الأمل', max: 24 },
    { k: 'count', label: 'رقم الصفحة', def: '٢ / ٨', max: 10, hint: 'مثل: ٢ / ٨، أو اتركه فارغاً' },
    { k: 'body', label: 'النص', kind: 'area', def: 'بسم الله وبعد: مرّت ستُّ سنوات منذ اليوم الذي سجّلت فيه في مسار «غراس» بدفعته الأولى، وأنا في الثانية عشرة من عمري. لعلّي حينها لم يكن ليخطر على بالي أنه سيأتي اليوم الذي أمسك فيه بقلمي وأكتب عن الأكاديمية في لحظة التخرّج..', max: 600 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080;
    const base = OV.bg || (v === 'deep' ? C.pd : '#f6f3ee'), fg = onBg(base, '#3a3a3a'), dark = isDark(base), ac = OV.accent || (dark ? C.a : C.a2);
    paintBg(ctx, W, H, base);
    storyFrame(ctx, W, H, d, T, base, ac);
    G(ctx, 'count'); if (has(d.count)) { const f = line(ctx, d.count, W - 150 * u, 290 * u, { size: 34 * u, color: ac, align: 'right' }); star(ctx, W - 150 * u - f.w - 26 * u, 290 * u, 12 * u, ac, 0); }
    const bf = fit(ctx, d.body, { maxW: W * 0.72, maxH: H * 0.56, size: 46 * u * k, lh: 1.85, bold: 0.2 });
    G(ctx, 'body'); drawFit(ctx, bf, W - 150 * u, H * 0.45 - bf.h / 2, { align: 'right', color: OV.title || fg, hl: ac });
  }
},
/* ---------- 28. قصة: العبارة ---------- */
{
  id: 'story_quote', type: 'social', name: 'قصة: عبارة بارزة', tags: 'قصة ستوري عبارة اقتباس كبيرة', isNew: 1,
  sizes: ['story', 'square', 'post'],
  variants: [{ id: 'deep', name: 'بنفسجي داكن', sw: ['#2d4d24', '#ffffff', '#f99229'] }, { id: 'brown', name: 'بني', sw: ['#33251c', '#ffffff', '#fbb03b'] }],
  fields: [
    { k: 'tag', label: 'الوسم', def: '#جيل_الأمل', max: 24 },
    { k: 'title', label: 'العبارة', kind: 'area', def: 'ثُمّ إنّ الرحلة لا تنتهي،\nوأجنحتنا لا تختفي، بل\n*تواصل الطيران.*', max: 120, hint: 'ما بين *نجمتين* يظهر بلون مميز' }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080;
    const base = OV.bg || (v === 'brown' ? C.sdd : C.pd), ac = OV.accent || C.a2, fg = onBg(base);
    if (OV.bg || BGFX) paintBg(ctx, W, H, base);
    else { const g = ctx.createRadialGradient(W * 0.5, H * 0.25, 0, W * 0.5, H * 0.4, H * 0.8); g.addColorStop(0, lighten(base, 0.18)); g.addColorStop(1, lighten(base, -0.15)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    storyFrame(ctx, W, H, d, T, base, ac);
    const wide = W > H * 2.5;   // الغلاف العريض: العبارة في الوسط بعيداً عن الوسم والشعار
    const tf = fit(ctx, d.title, { maxW: wide ? W * 0.52 : W * 0.78, maxH: wide ? H * 0.6 : H * 0.4, size: 84 * u * k, lh: 1.45, balance: true, bold: 1, title: true });
    const y = H * 0.48 - tf.h / 2;
    G(ctx, 'deco'); if (D()) star(ctx, W / 2, y - 60 * u, 18 * u, ac, 0);
    G(ctx, 'title'); drawFit(ctx, tf, W / 2, y, { align: 'center', color: OV.title || fg, hl: ac });
  }
},
/* ---------- 29. قصة: الختام ---------- */
{
  id: 'story_end', type: 'social', name: 'قصة: الختام والدعوة', tags: 'قصة ستوري ختام اسم خريج دعوة مشاركة وسم', isNew: 1,
  sizes: ['story', 'square', 'post'],
  variants: [{ id: 'paper', name: 'ورقي', sw: ['#f6f3ee', '#2d4d24', '#f99229'] }],
  fields: [
    { k: 'tag', label: 'الوسم أعلى القصة', def: '#جيل_الأمل', max: 24 },
    { k: 'name', label: 'الاسم', def: 'جنى سامح', max: 28 },
    { k: 'role', label: 'الصفة', def: 'خريجة إثمار', max: 28 },
    { k: 'body', label: 'الدعوة', kind: 'area', def: 'وأنت.. ما حكايتك مع الأكاديمية؟\nشاركها معنا بوسم', max: 90 },
    { k: 'hash', label: 'الوسم البارز', def: '#جيل_الأمل', max: 26 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080;
    const base = OV.bg || '#f6f3ee', fg = onBg(base, C.pd), dark = isDark(base), ac = OV.accent || (dark ? C.a : C.a2);
    paintBg(ctx, W, H, base);
    if (D() && !BGFX) quiet(function () { for (let i = 1; i < 9; i++) { ctx.strokeStyle = alpha(dark ? '#ffffff' : '#ffffff', 0.5); ctx.lineWidth = 18 * u; ctx.beginPath(); ctx.arc(W * 0.75, H * 0.25, i * 70 * u, 0, Math.PI * 2); ctx.stroke(); } });
    storyFrame(ctx, W, H, d, T, base, ac);
    const nf = fit(ctx, d.name, { maxW: W * 0.7, size: 96 * u * k, maxLines: 1, bold: 1, title: true, lh: 1.3 });
    let y = H * 0.4;
    G(ctx, 'deco'); if (D()) star(ctx, W / 2, y - 50 * u, 16 * u, ac, 0);
    G(ctx, 'name'); drawFit(ctx, nf, W / 2, y, { align: 'center', color: OV.title || fg }); y += nf.h;
    G(ctx, 'sub'); if (has(d.role)) { line(ctx, d.role, W / 2, y + 16 * u, { size: 40 * u, color: dark ? C.a : C.p, align: 'center', bold: 0.4 }); y += 60 * u; }
    hline(ctx, W / 2 - 60 * u, W / 2 + 60 * u, y + 40 * u, alpha(fg, 0.25), 2 * u); y += 100 * u;
    const bf = fit(ctx, d.body, { maxW: W * 0.7, size: 34 * u, lh: 1.6, maxLines: 3, balance: true });
    G(ctx, 'body'); drawFit(ctx, bf, W / 2, y, { align: 'center', color: alpha(fg, 0.75) }); y += bf.h + 20 * u;
    G(ctx, 'tag2'); if (has(d.hash)) line(ctx, d.hash, W / 2, y + 30 * u, { size: 54 * u, color: ac, align: 'center', bold: 0.9, title: true });
  }
}
);

// إطار القصص: الوسم أعلى اليمين، والحسابات وشعار الأكاديمية أسفل
function storyFrame(ctx, W, H, d, T, base, ac) {
  const u = W / 1080, dark = isDark(base), fg = onBg(base, '#3a3a3a');
  G(ctx, 'tag'); if (has(d.tag)) { const f = line(ctx, d.tag, W - 90 * u, 110 * u, { size: 30 * u, color: fg, align: 'right', bold: 0.4, maxW: W > H * 2.5 ? W * 0.17 : W * 0.6 }); ctx.fillStyle = ac; ctx.beginPath(); ctx.arc(W - 90 * u - f.w - 22 * u, 110 * u, 7 * u, 0, Math.PI * 2); ctx.fill(); }
  G(ctx, 'logo'); drawLogo(ctx, T, 90 * u, 80 * u, 110 * u, dark ? '#ffffff' : 'color', 'tl');
  G(ctx, 'footer'); academy(ctx, alpha(fg, 0.8), W - 90 * u, H - 80 * u, 120 * u, 'br'); social(ctx, alpha(fg, 0.65), 90 * u, H - 84 * u, 120 * u, 'bl');
}
function mixC(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) * (1 - t)) + ((pb >> 16) * t)), g = Math.round((((pa >> 8) & 255) * (1 - t)) + (((pb >> 8) & 255) * t)), bl = Math.round(((pa & 255) * (1 - t)) + ((pb & 255) * t));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
}
