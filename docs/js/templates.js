const SIZES = {
  post:   { w: 1080, h: 1350, name: 'منشور', hint: '4:5' },
  square: { w: 1080, h: 1080, name: 'مربع', hint: '1:1' },
  story:  { w: 1080, h: 1920, name: 'حالة وقصة', hint: '9:16' },
  yt:     { w: 1280, h: 720,  name: 'يوتيوب', hint: '16:9' },
  card:   { w: 1600, h: 1131, name: 'أفقي', hint: 'A4' },
  banner: { w: 1600, h: 400,  name: 'غلاف عريض', hint: '4:1' },
  slide:  { w: 1920, h: 1080, name: 'شريحة', hint: '16:9' }
};

const TYPES = [
  { id: 'ann',    name: 'إعلان فعالية',  desc: 'لقاء، ورشة، محاضرة، مراجعة' },
  { id: 'daily',  name: 'المقرر اليومي', desc: 'مقرر اليوم وموعده' },
  { id: 'comp',   name: 'مسابقة',        desc: 'إعلان مسابقة ومواعيدها' },
  { id: 'thanks', name: 'تهنئة وشكر',    desc: 'تكريم طالب أو جهة' },
  { id: 'quote',  name: 'عبارة وتذكير',  desc: 'بيت، حكمة، تنبيه' },
  { id: 'social', name: 'مواقع التواصل', desc: 'قصص وحالات ومنشورات إنستقرام' },
  { id: 'cover',  name: 'غلاف وجدول',    desc: 'أغلفة الاستمارات وجداول اللقاءات' },
  { id: 'yt',     name: 'غلاف يوتيوب',   desc: 'صورة مصغّرة للمقطع' }
];

/* عناصر يمكن إخفاؤها في كل القوالب */
const ELEMENTS = [['logo', 'شعار الهوية'], ['academy', 'شعار الأكاديمية'], ['social', 'حسابات التواصل'], ['deco', 'الزخارف والرسوم']];

const DATE_LIB = ['img_dome', 'img_mosque', 'img_quran', 'img_arch'];
const LIB_NAMES = { img_dome: 'القبة', img_mosque: 'المسجد النبوي', img_quran: 'المصحف', img_arch: 'الرواق' };

/* ---------- عناصر مشتركة بين القوالب ---------- */
function clockDeco(ctx, W, cx, cy, R, u, col) {
  col = col || '#ffffff';
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * Math.PI * 2, big = i % 5 === 0;
    const r1 = R - (big ? 58 : 26) * u, r2 = R;
    ctx.strokeStyle = alpha(col, big ? 0.32 : 0.16);
    ctx.lineWidth = (big ? 8 : 4) * u; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a)); ctx.lineTo(cx + r2 * Math.cos(a), cy + r2 * Math.sin(a)); ctx.stroke();
  }
  ctx.strokeStyle = alpha(col, 0.62); ctx.lineCap = 'round'; ctx.lineWidth = 11 * u;
  ctx.beginPath(); ctx.moveTo(cx - 20 * u, cy); ctx.lineTo(cx + R * 0.6, cy - R * 0.02); ctx.stroke();
  ctx.lineWidth = 12 * u;
  ctx.beginPath(); ctx.moveTo(cx - 10 * u, cy - 8 * u); ctx.lineTo(cx + R * 0.27, cy + R * 0.5); ctx.stroke();
  box('deco', cx, cy - R * 0.1, cx + R * 0.62, cy + R * 0.55, 'clock-hands');
}

function pill(ctx, str, xr, yc, size, fill, color, o) {
  o = o || {};
  const tw = textW(ctx, str, size, o.bold), padX = size * 0.75, dot = o.icon ? size * 1.15 : 0;
  const dl = o.dot ? size * 0.7 : 0;
  const w = tw + padX * 2 + dot + dl, h = size * 1.75;
  const x = o.align === 'left' ? xr : xr - w;
  fillRR(ctx, x, yc - h / 2, w, h, h / 2, fill);
  box('pill', x, yc - h / 2, x + w, yc + h / 2, str);
  if (o.icon) {
    ctx.beginPath(); ctx.arc(x + w - padX * 0.7 - dot * 0.3, yc, size * 0.5, 0, Math.PI * 2); ctx.fillStyle = o.iconBg || color; ctx.fill();
    icon(ctx, o.icon, x + w - padX * 0.7 - dot * 0.3, yc, size * 0.75, o.iconColor || fill);
  }
  if (o.dot) { ctx.beginPath(); ctx.arc(x + padX * 0.9, yc, size * 0.2, 0, Math.PI * 2); ctx.fillStyle = o.dot; ctx.fill(); }
  const save = BOXES; BOXES = null;
  line(ctx, str, x + w - padX - dot, yc, { size: size, color: color, align: 'right', bold: o.bold });
  BOXES = save;
  return { x: x, w: w, h: h };
}

function lightStreaks(ctx, W, H, a) {
  ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(W * 0.55, 0); ctx.lineTo(W * 0.78, 0); ctx.lineTo(0, H * 0.62); ctx.lineTo(0, H * 0.42); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(W, H * 0.05); ctx.lineTo(W, H * 0.22); ctx.lineTo(W * 0.3, H); ctx.lineTo(W * 0.12, H); ctx.closePath(); ctx.fill();
  ctx.restore();
}
const D = function () { return !HIDE.deco; };

/* ================= القوالب ================= */
const TEMPLATES = [

/* ---------- 1. الدائرة ---------- */
{
  id: 'ann_circle', type: 'ann', name: 'الدائرة', tags: 'لقاء افتتاحي فصل برنامج تسجيل زوم دائرة',
  sizes: ['post', 'square', 'story'],
  variants: [{ id: 'light', name: 'فاتح', sw: ['#fafafa', '#2b2b2b', '#467839'] }, { id: 'dark', name: 'بني داكن', sw: ['#33251c', '#ffffff', '#68b251'] }, { id: 'green', name: 'أخضر داكن', sw: ['#2d4d24', '#ffffff', '#68b251'] }],
  fields: [
    { k: 'top', label: 'السطر أعلى الدائرة', def: 'الفصـــل الأول', max: 22 },
    { k: 'title', label: 'العنوان', kind: 'area', def: 'اللقـــاء\nالافتتاحي', max: 30, hint: 'اضغط Enter لتقسيم العنوان على سطرين' },
    { k: 'badge', label: 'شارة صغيرة بجانب العنوان', def: 'zoom', max: 14, hint: 'مثل: فتح التسجيل' },
    { k: 'sub', label: 'سطر تحت العنوان', def: 'لفصلٍ مليء بالإنجـاز', max: 30 },
    { kind: 'date', label: 'التاريخ', map: { h1: '{hd} {hm}', h2: '{hy} هـ', g1: '{gd} {gm}', g2: '{gy} مـ', day: '{wd}' } },
    { k: 'h1', label: 'اليوم والشهر الهجري', def: '16 صفر', half: 1 },
    { k: 'h2', label: 'السنة الهجرية', def: '1448 هـ', half: 1 },
    { k: 'g1', label: 'اليوم والشهر الميلادي', def: '30 يوليو', half: 1 },
    { k: 'g2', label: 'السنة الميلادية', def: '2026 مـ', half: 1 },
    { k: 'link', label: 'سهم الرابط بجانب التاريخ', kind: 'toggle', def: true },
    { k: 'who', label: 'المقدّم', def: 'أ. حمــزة', max: 24 },
    { k: 'day', label: 'اليوم', def: 'الخميس', half: 1 },
    { k: 'time', label: 'الوقت', def: '8:20 م', half: 1 },
    { k: 'arc', label: 'السطر أسفل الدائرة', def: 'مسار جـذور', max: 22 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080;
    const base = OV.bg || (v === 'light' ? '#fafafa' : (v === 'green' ? C.pd : C.sdd));
    const light = !isDark(base);
    const ink = OV.title || (light ? C.ink : '#ffffff'), txt = light ? C.ink : '#ffffff';
    const soft = light ? '#8a8a8a' : 'rgba(255,255,255,0.78)';
    paintBg(ctx, W, H, base);
    G(ctx, 'logo'); drawLogo(ctx, T, W - 70 * u, 56 * u, 150 * u, light ? 'color' : '#ffffff', 'tr'); G(ctx, null);
    const hasInfo = has(d.who) || has(d.day) || has(d.time);
    const top = 190 * u, bot = H - 140 * u - (hasInfo ? 185 * u : 0);
    const Dm = Math.min(W * 0.84, bot - top - 50 * u), R = Dm / 2, cx = W / 2, cy = (top + bot) / 2, q = Math.min(1.08, Dm / (W * 0.84)), qu = q * u;
    const ringCol = light ? '#dcdcdc' : 'rgba(255,255,255,0.5)';
    const a1 = -Math.PI / 2 + 0.42, a2 = Math.PI / 2 + 0.62, ts = 34 * qu;
    const g1 = has(d.top) ? arcSpan(ctx, d.top, ts, R) / 2 + 0.07 : 0, g2 = has(d.arc) ? arcSpan(ctx, d.arc, ts, R) / 2 + 0.07 : 0;
    G(ctx, 'ring'); area(cx - R, cy - R, cx + R, cy + R);
    ctx.strokeStyle = ringCol; ctx.lineWidth = 3 * u;
    ctx.beginPath(); ctx.arc(cx, cy, R, a1 + g1, a2 - g2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R, a2 + g2, a1 - g1 + Math.PI * 2); ctx.stroke();
    arcText(ctx, d.top, cx, cy, R, a1, ts, txt, false);
    arcText(ctx, d.arc, cx, cy, R, a2, ts, soft, true);
    if (D()) {
      petal(ctx, cx + R * 1.02 * Math.cos(1.02), cy + R * 1.02 * Math.sin(1.02), R * 0.25, 0.35, light ? alpha(C.p, 0.85) : lighten(C.s, 0.25));
      petal(ctx, cx + R * Math.cos(Math.PI * 0.94), cy + R * Math.sin(Math.PI * 0.94), R * 0.17, 0.15, light ? '#c3c3c3' : '#ffffff');
      const ca = -0.62, chx = cx + R * 0.98 * Math.cos(ca), chy = cy + R * 0.98 * Math.sin(ca);
      ctx.save(); ctx.translate(chx, chy); ctx.rotate(-Math.PI / 4); chevrons(ctx, -12 * u, 0, 30 * u, light ? C.s : C.pl, 1, light ? lighten(C.s, 0.35) : lighten(C.pl, 0.3)); ctx.restore();
    }
    G(ctx, null);
    const tf = fit(ctx, d.title, { maxW: Dm * 0.66, maxH: Dm * 0.36, size: 150 * qu * k, lh: 1.12, balance: true, bold: 1, title: true });
    const hasDate = has(d.h1) || has(d.h2) || has(d.g1) || has(d.g2);
    const subH = has(d.sub) ? 76 * qu : 0, dateH = hasDate ? 126 * qu : 0;
    let y = cy - (tf.h + subH + dateH) / 2 - 6 * qu;
    G(ctx, 'title'); drawFit(ctx, tf, cx, y, { align: 'center', color: ink });
    if (has(d.badge) && tf.lines.length) {
      const last = tf.lines[tf.lines.length - 1], ly = y + tf.pt + tf.size * tf.lh * (tf.lines.length - 0.5);
      const bw = textW(ctx, d.badge, 24 * qu) + 70 * qu;
      const xl = cx - last.w / 2 - 22 * qu;
      if (xl - bw > cx - R * 0.94) pill(ctx, d.badge, xl, ly + tf.size * 0.05, 24 * qu, light ? alpha(C.p, 0.8) : C.pl, '#ffffff', { dot: '#ffffff' });
    }
    y += tf.h;
    const BW = Math.max(tf.w, Dm * 0.56), xr = cx + BW / 2, xl = cx - BW / 2;
    if (subH) {
      G(ctx, 'sub');
      const f = line(ctx, d.sub, xr, y + 40 * qu, { size: 32 * qu, color: soft, align: 'right', maxW: BW });
      if (xr - f.w - 22 * qu > xl + 20 * qu) hline(ctx, xl, xr - f.w - 22 * qu, y + 42 * qu, light ? '#cfcfcf' : 'rgba(255,255,255,0.4)', 2 * u);
      y += subH;
    }
    if (hasDate) {
      G(ctx, 'date');
      let s1 = 52 * qu, s2 = 30 * qu, gap = 30 * qu; const yc = y + 62 * qu;
      let wH = Math.max(textW(ctx, d.h1, s1, 0.7), textW(ctx, d.h2, s2)), wG = Math.max(textW(ctx, d.g1, s1, 0.7), textW(ctx, d.g2, s2));
      let ar = d.link ? 76 * qu : 0;
      let total = wH + (wG ? gap * 2 + wG : 0) + (ar ? gap * 1.6 + ar : 0);
      // تاريخ طويل: يُصغَّر كله ليبقى داخل الدائرة
      const room = Dm * 0.86; if (total > room) { const f = room / total; s1 *= f; s2 *= f; gap *= f; ar *= f; wH *= f; wG *= f; total = room; }
      let x = cx + total / 2;
      line(ctx, d.h1, x, yc - 22 * qu, { size: s1, color: txt, align: 'right', bold: 0.7 });
      line(ctx, d.h2, x, yc + 34 * qu, { size: s2, color: soft, align: 'right' });
      x -= wH;
      if (wG) {
        x -= gap;
        if (wH) vline(ctx, x, yc - 48 * qu, yc + 48 * qu, light ? '#cfcfcf' : 'rgba(255,255,255,0.45)', 2.5 * u);
        x -= gap;
        line(ctx, d.g1, x, yc - 22 * qu, { size: s1, color: txt, align: 'right', bold: 0.7 });
        line(ctx, d.g2, x, yc + 34 * qu, { size: s2, color: soft, align: 'right' });
        x -= wG;
      }
      if (ar) {
        x -= gap * 1.6;
        fillRR(ctx, x - ar, yc - ar / 2, ar, ar, 12 * qu, light ? '#c9c9c9' : 'rgba(255,255,255,0.22)');
        icon(ctx, 'link', x - ar / 2, yc, ar * 0.7, '#ffffff');
      }
    }
    if (hasInfo) {
      G(ctx, 'info');
      const iy = cy + R + 80 * u, s = 34 * u, icol = light ? C.s : C.pl;
      const items = [];
      if (has(d.who)) items.push({ ic: 'mic', a: d.who });
      if (has(d.day) || has(d.time)) items.push({ ic: 'moon', a: d.day, b: d.time });
      const sp = items.length > 1 ? 160 * u : 0;
      items.forEach(function (it, i) {
        const x = cx + (i === 0 ? sp : -sp);
        icon(ctx, it.ic, x, iy, 44 * u, icol);
        line(ctx, it.a, x, iy + 64 * u, { size: s, color: txt, align: 'center', maxW: 290 * u });
        if (has(it.b)) line(ctx, it.b, x, iy + 112 * u, { size: s, color: txt, align: 'center', maxW: 290 * u });
      });
    }
    G(ctx, 'footer'); footer(ctx, W, H, T, { y: H - 92 * u, color: light ? '#8f8f8f' : 'rgba(255,255,255,0.72)' });
  }
},

/* ---------- 2. الساعة (ورشة) ---------- */
{
  id: 'ann_clock', type: 'ann', name: 'الساعة', tags: 'ورشة عمل وقت محاضرة لقاء مقدم منصة',
  sizes: ['post', 'square', 'story'],
  variants: [{ id: 'brown', name: 'بني', sw: ['#433125', '#ffffff', '#f99229'] }, { id: 'green', name: 'أخضر', sw: ['#2d4d24', '#ffffff', '#f99229'] }, { id: 'deep', name: 'داكن', sw: ['#33251c', '#ffffff', '#f99229'] }],
  fields: [
    { k: 'chip', label: 'الوسم الصغير', def: 'ورشة عمل', max: 18, hint: 'مثل: محاضرة، لقاء مفتوح' },
    { k: 'title', label: 'العنوان', kind: 'area', def: 'إدارة الوقـت:', max: 34 },
    { k: 'sub', label: 'العنوان الفرعي', def: 'لماذا وكيف؟', max: 30 },
    { k: 'who', label: 'المقدّم', def: 'أ. عبداللطيـف', half: 1 },
    { k: 'time', label: 'الوقت', def: '9:00 مـ', half: 1 },
    { kind: 'date', label: 'التاريخ', map: { date: '{wd} {gy}/{gn}/{gd}' } },
    { k: 'date', label: 'اليوم والتاريخ', def: 'الخميس 2026/9/17', half: 1 },
    { k: 'place', label: 'المكان أو المنصة', def: 'برنامج زووم', half: 1 },
    { k: 'deco', label: 'الزخرفة', kind: 'choice', def: 'clock', options: [['clock', 'ساعة'], ['petal', 'زهرة'], ['none', 'بلا']] }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080;
    const base = OV.bg || (v === 'green' ? C.pd : (v === 'deep' ? C.sdd : C.sd));
    const fg = onBg(base), ink = OV.title || fg;
    paintBg(ctx, W, H, base);
    const mx = 72 * u, xr = W - mx;
    const fy = H - 78 * u;
    const r2 = fy - 165 * u, r1 = r2 - 96 * u, s = 36 * u, lc = alpha(fg, 0.28);
    const xm = W * 0.47;
    const subY = r1 - 126 * u;
    const tf = fit(ctx, d.title, { maxW: W - mx * 2, maxH: Math.min(300 * u, H * 0.26), size: 122 * u * k, lh: 1.18, balance: true, bold: 0.9, title: true });
    const tY = (has(d.sub) ? subY - 74 * u : subY) - tf.h + 6 * u;
    const topY = tY - (has(d.chip) ? 80 * u : 0);
    G(ctx, 'deco');
    if (D() && d.deco === 'clock') {
      let cr = W * 0.47 * Math.min(1.25, H / 1350), ccy = Math.min(270 * u, H * 0.2) * Math.min(1.4, H / 1350);
      const lim = topY - 30 * u;                       // العقارب تبقى فوق العنوان
      if (ccy + cr * 0.56 > lim) { const f = Math.max(0.45, lim / (ccy + cr * 0.56)); cr *= f; ccy *= f; }
      clockDeco(ctx, W, 0, ccy, cr, u, fg);
    }
    if (D() && d.deco === 'petal') { quiet(function () { petal(ctx, W * 0.08, H * 0.12, W * 0.42, 0.3, alpha(fg, 0.07)); }); petal(ctx, W * 0.5, Math.min(H * 0.17, topY - W * 0.1), W * 0.08, 0.1, alpha(C.a, 0.9)); }
    G(ctx, 'logo'); drawLogo(ctx, T, xr, fy + 26 * u, 118 * u, fg, 'br');
    G(ctx, 'footer'); social(ctx, alpha(fg, 0.55), mx, fy - 22 * u, 120 * u, 'tl');
    function row(y, a, ia, b, ib, tail) {
      const wa = infoItem(ctx, ia, a, xr, y, { size: s, color: fg, iconColor: fg, maxW: xr - xm - 60 * u });
      const xb = wa ? xm : xr;
      const wb = infoItem(ctx, ib, b, xb, y, { size: s, color: fg, iconColor: fg, maxW: xb - mx });
      if (wa && wb && xr - wa - 28 * u > xm + 28 * u) hline(ctx, xm + 28 * u, xr - wa - 28 * u, y, lc, 2 * u);
      if (tail && wb && xb - wb - 28 * u > mx + 40 * u) hline(ctx, mx, xb - wb - 28 * u, y, lc, 2 * u);
    }
    G(ctx, 'info'); row(r1, d.who, 'mic', d.time, 'moon', true);
    row(r2, d.date, 'moon', d.place, 'layers', false);
    if (has(d.sub)) {
      G(ctx, 'sub');
      const f = line(ctx, d.sub, xr, subY, { size: 40 * u, color: fg, align: 'right', maxW: W * 0.6 });
      if (xr - f.w - 26 * u > W * 0.4) hline(ctx, W * 0.38, xr - f.w - 26 * u, subY + 2 * u, alpha(fg, 0.4), 2 * u);
    }
    const y = tY;
    G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: ink });
    G(ctx, 'chip'); if (has(d.chip)) pill(ctx, d.chip, xr, y - 46 * u, 28 * u, alpha(fg, 0.94), base, { icon: 'star', iconBg: C.a2, iconColor: base });
  }
},

/* ---------- 3. اللوحة ---------- */
{
  id: 'ann_panel', type: 'ann', name: 'اللوحة', tags: 'مراجعة درس محاضرة مقدم زوم',
  sizes: ['post', 'square', 'story'],
  variants: [{ id: 'green', name: 'أخضر', sw: ['#2d4d24', '#ffffff', '#fbb03b'] }, { id: 'brown', name: 'بني', sw: ['#433125', '#ffffff', '#fbb03b'] }],
  colorLabels: { bg: 'لون اللوحة' },
  fields: [
    { k: 'title', label: 'العنوان', kind: 'area', def: 'مراجعة\nلبنات العقيدة', max: 34 },
    { k: 'who', label: 'المقدّم', def: 'أ. علي حنان', max: 26 },
    { k: 'time', label: 'اليوم والوقت', def: 'الأحــد 6:00م', half: 1 },
    { k: 'place', label: 'المنصة', def: 'عبـر زوم', half: 1 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, pc = OV.bg || (v === 'brown' ? C.sd : C.pd), ac = C.a, fg = onBg(pc);
    paintBg(ctx, W, H, '#fbfbfb');
    const pt = H - Math.max(700 * u, H * 0.44);
    const step = 157 * u, r = 56 * u, x0 = 147 * u, y0 = 140 * u;
    G(ctx, 'deco');
    if (D()) {
      for (let row = 0; y0 + row * step - r < pt; row++) for (let col = 0; col < 6; col++) {
        if ((row === 1 && col === 1) || (row === 0 && col === 5)) continue;
        ctx.beginPath(); ctx.arc(x0 + col * step, y0 + row * step, r, 0, Math.PI * 2); ctx.fillStyle = '#f1f1f1'; ctx.fill();
      }
      petal(ctx, x0 + step, y0 + step, 62 * u, 0.25, ac);
    }
    G(ctx, 'logo'); drawLogo(ctx, T, W - 130 * u, y0, 150 * u, 'color', 'c');
    G(ctx, 'panel'); area(0, pt, W, H); fillRR(ctx, 0, pt, W, H - pt + 80 * u, [70 * u, 70 * u, 0, 0], pc);
    const mx = 72 * u, xr = W - mx;
    if (D()) chevrons(ctx, mx, pt + 92 * u, 38 * u, ac, 1, lighten(ac, -0.35));
    const by = H - 82 * u;
    const tf = fit(ctx, d.title, { maxW: W - mx * 2 - 120 * u, maxH: Math.min(300 * u, by - pt - 260 * u), size: 112 * u * k, lh: 1.28, balance: true, bold: 0.7, title: true });
    G(ctx, 'title'); drawFit(ctx, tf, xr, pt + 60 * u, { align: 'right', color: OV.title || fg });
    const wy = pt + 60 * u + tf.h + 64 * u;
    G(ctx, 'who'); infoItem(ctx, 'mic', d.who, xr, wy, { size: 42 * u, color: fg, iconColor: ac });
    G(ctx, 'footer'); social(ctx, alpha(fg, 0.75), mx, by - 26 * u, 118 * u, 'tl');
    G(ctx, 'info');
    const wt = infoItem(ctx, 'moon', d.time, xr, by, { size: 34 * u, color: fg, iconColor: fg, maxW: W * 0.38 });
    infoItem(ctx, 'layers', d.place, Math.min(W * 0.56, xr - wt - 70 * u), by, { size: 34 * u, color: fg, iconColor: fg, maxW: W * 0.3 });
  }
},

/* ---------- 4. الصورة ---------- */
{
  id: 'ann_photo', type: 'ann', name: 'الصورة', tags: 'يوم مناسبة صورة المسجد النبوي القبة',
  sizes: ['post', 'square', 'story'],
  variants: [{ id: 'warm', name: 'دافئ', sw: ['#e8e4de', '#654b37', '#467839'] }, { id: 'light', name: 'فاتح', sw: ['#f3f3f2', '#654b37', '#467839'] }],
  fields: [
    { k: 'photo', label: 'الصورة', kind: 'image', def: 'img_mosque', fitMode: 'contain' },
    { k: 'title', label: 'العنوان', kind: 'area', def: 'يَـوم الاقتِـدَاء', max: 28 },
    { k: 'sub', label: 'سطر تحت العنوان', def: '', max: 40, hint: 'اختياري' },
    { kind: 'date', label: 'التاريخ', map: { aLabel: '{wd}', aText: '{gd} {gm} {gy} مـ' } },
    { k: 'aLabel', label: 'العنوان الصغير (أخضر)', def: 'الجمعـة', half: 1 },
    { k: 'aText', label: 'النص تحته', def: '25 سبتمبـر 2026 مـ', half: 1 },
    { k: 'bLabel', label: 'عمود ثانٍ: العنوان الصغير', def: '', half: 1, hint: 'اختياري، مثل: حتى الجمعة' },
    { k: 'bText', label: 'عمود ثانٍ: النص', def: '', half: 1 }
  ],
  draw: function (ctx, W, H, d, T, v, k, P) {
    const C = T.c, u = W / 1080;
    if (OV.bg || BGFX) paintBg(ctx, W, H, OV.bg || '#ebe7e1');
    else {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, v === 'light' ? '#f7f7f6' : '#efece8'); g.addColorStop(1, v === 'light' ? '#ecebea' : '#e2ddd6');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    const base = OV.bg || '#ebe7e1', fg = onBg(base, C.ink);
    if (D()) lightStreaks(ctx, W, H, isDark(base) ? 0.08 : 0.55);
    G(ctx, 'footer'); social(ctx, isDark(base) ? 'rgba(255,255,255,0.7)' : '#6f6f6f', 62 * u, 58 * u, 120 * u, 'tl');
    G(ctx, 'logo'); drawLogo(ctx, T, W - 64 * u, H - 58 * u, 132 * u, isDark(base) ? '#ffffff' : 'color', 'br'); G(ctx, null);
    const twoCols = has(d.bLabel) || has(d.bText);
    const infoH = (has(d.aLabel) || has(d.aText) || twoCols) ? 160 * u : 0;
    const tf = fit(ctx, d.title, { maxW: W * 0.7, maxH: Math.min(260 * u, H * 0.3), size: 116 * u * k, lh: 1.22, balance: true, bold: 1, title: true });
    const subF = fit(ctx, d.sub, { maxW: W * 0.76, size: 38 * u, lh: 1.4, maxLines: 2 });
    const textH = tf.h + (subF.h ? subF.h + 20 * u : 0) + infoH + 60 * u;
    const imgTop = 120 * u + Math.max(0, H - 1350 * u) * 0.3, imgBot = H - 150 * u - textH - Math.max(0, H - 1350 * u) * 0.15;
    G(ctx, 'photo'); if (P.photo) drawPhoto(ctx, P.photo.im, W * 0.1, imgTop, W * 0.8, Math.max(100 * u, imgBot - imgTop + 60 * u), { fit: 'contain', z: P.photo.z, ox: P.photo.ox, oy: P.photo.oy, feather: { top: 0.12, bottom: 0.3, side: 0.1 } });
    let y = imgBot + 40 * u;
    G(ctx, 'title'); drawFit(ctx, tf, W / 2, y, { align: 'center', color: OV.title || (isDark(base) ? '#ffffff' : C.s) });
    const midY = y + tf.pt + tf.size * tf.lh * 0.55;
    if (D()) { petal(ctx, W / 2 + tf.w / 2 + 55 * u, midY, 17 * u, 0.4, C.p); petal(ctx, W / 2 - tf.w / 2 - 55 * u, midY, 17 * u, 0.4, C.p); }
    y += tf.h + 10 * u;
    G(ctx, 'sub'); if (subF.h) { drawFit(ctx, subF, W / 2, y, { align: 'center', color: isDark(base) ? '#ffffff' : C.s }); y += subF.h + 20 * u; }
    G(ctx, 'date');
    if (infoH) {
      const yc = y + 72 * u, lab = isDark(base) ? C.pl : C.p;
      let s1 = 34 * u, s2 = 40 * u;
      const bw = function (l, t) { return 52 * u + Math.max(textW(ctx, l, s1, 0.4) + (has(t) ? 70 * u : 0), textW(ctx, t, s2, 0.5)); };
      // التاريخ الطويل يُصغَّر ليبقى في عرض التصميم
      const need = twoCols ? bw(d.aLabel, d.aText) + bw(d.bLabel, d.bText) + 80 * u : bw(d.aLabel, d.aText);
      if (need > W * 0.9) { const f = Math.max(0.5, W * 0.9 / need); s1 *= f; s2 *= f; }
      function block(xr, l, t) {
        icon(ctx, 'moon', xr - 20 * u, yc - 26 * u, 40 * u, lab);
        const x0 = xr - 52 * u;
        const f = line(ctx, l, x0, yc - 28 * u, { size: s1, color: lab, align: 'right', bold: 0.4 });
        const lw = Math.max(textW(ctx, t, s2, 0.5) - f.w - 18 * u, 50 * u);
        if (has(l) && has(t)) hline(ctx, x0 - f.w - 18 * u, x0 - f.w - 18 * u - lw, yc - 24 * u, lab, 2 * u);
        line(ctx, t, x0, yc + 32 * u, { size: s2, color: fg, align: 'right', bold: 0.5 });
      }
      if (!twoCols) { const w = bw(d.aLabel, d.aText); block(W / 2 + w / 2, d.aLabel, d.aText); }
      else {
        const wa = bw(d.aLabel, d.aText), wb = bw(d.bLabel, d.bText);
        const tot = wa + wb + 80 * u, x0 = W / 2 + tot / 2;
        block(x0, d.aLabel, d.aText);
        vline(ctx, x0 - wa - 40 * u, yc - 52 * u, yc + 52 * u, alpha(fg, 0.3), 2 * u);
        block(x0 - wa - 80 * u, d.bLabel, d.bText);
      }
    }
  }
},

/* ---------- 5. العنوان والرمز ---------- */
{
  id: 'ann_title', type: 'ann', name: 'العنوان والرمز', tags: 'اختبار تنبيه عنوان كتاب نجمة',
  sizes: ['post', 'square', 'story'],
  variants: [{ id: 'green', name: 'أخضر', sw: ['#2d4d24', '#ffffff', '#fbb03b'] }, { id: 'brown', name: 'بني', sw: ['#433125', '#ffffff', '#fbb03b'] }],
  fields: [
    { k: 'title', label: 'العنوان', kind: 'area', def: 'الاختبَــار النصفِي', max: 30 },
    { k: 'sub', label: 'سطر تحت العنوان', def: '', max: 44, hint: 'اختياري، مثل: يوم الخميس 8 مساءً' },
    { k: 'deco', label: 'الرسمة', kind: 'choice', def: 'book', options: [['book', 'كتاب ونجمة'], ['stars', 'نجمتان'], ['petal', 'زهرة'], ['none', 'بلا']] }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, base = OV.bg || (v === 'brown' ? C.sd : C.pd), band = v === 'brown' ? C.s : C.p, fg = onBg(base);
    paintBg(ctx, W, H, base);
    const fh = 140 * u;
    ctx.fillStyle = '#f6f6f6'; ctx.fillRect(0, H - fh, W, fh);
    const fc = isDark(base) ? base : C.pd;
    G(ctx, 'footer'); area(0, H - fh, W, H); academy(ctx, fc, W - 64 * u, H - fh / 2 - 22 * u, 132 * u, 'tr');
    social(ctx, fc, 60 * u, H - fh / 2 - 22 * u, 128 * u, 'tl');
    G(ctx, 'logo'); drawLogo(ctx, T, W - 64 * u, 56 * u, 120 * u, fg, 'tr'); G(ctx, null);
    const tf = fit(ctx, d.title, { maxW: W * 0.82, maxH: Math.min(300 * u, H * 0.38), size: 116 * u * k, lh: 1.22, balance: true, bold: 0.9, title: true });
    const ty = Math.max(160 * u, H * 0.11);
    G(ctx, 'title'); drawFit(ctx, tf, W / 2, ty, { align: 'center', color: OV.title || fg });
    let y = ty + tf.h;
    G(ctx, 'sub'); if (has(d.sub)) { line(ctx, d.sub, W / 2, y + 44 * u, { size: 40 * u, color: alpha(fg, 0.85), align: 'center', maxW: W * 0.82 }); y += 80 * u; }
    G(ctx, 'deco');
    if (!D()) return;
    const cy = (y + 40 * u + H - fh) / 2 + 30 * u, cx = W / 2, sz = Math.min(W * 0.62, (H - fh - y) * 0.95);
    if (sz < 60 * u) return;   // لا مكان للرسمة تحت عنوان طويل
    if (d.deco === 'book') {
      const bw = sz, baseY = cy + sz * 0.22;
      fillRR(ctx, cx - bw * 0.56, baseY, bw * 1.12, sz * 0.07, 8 * u, isDark(base) ? band : C.p);
      [1, -1].forEach(function (sd) {
        ctx.beginPath(); ctx.moveTo(cx, baseY);
        ctx.lineTo(cx, baseY - sz * 0.05);
        ctx.quadraticCurveTo(cx + sd * bw * 0.22, baseY - sz * 0.2, cx + sd * bw * 0.5, baseY - sz * 0.12);
        ctx.lineTo(cx + sd * bw * 0.5, baseY - sz * 0.03);
        ctx.quadraticCurveTo(cx + sd * bw * 0.56, baseY - sz * 0.01, cx + sd * bw * 0.58, baseY);
        ctx.closePath(); ctx.fillStyle = isDark(base) ? '#ffffff' : C.pd; ctx.fill();
      });
      box('deco', cx - bw * 0.6, baseY - sz * 0.66, cx + bw * 0.6, baseY + sz * 0.07, 'book');
      star(ctx, cx - sz * 0.02, baseY - sz * 0.38, sz * 0.13, C.a, -0.18);
      star(ctx, cx + sz * 0.3, baseY - sz * 0.53, sz * 0.035, fg, 0.1);
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(cx - sz * 0.29, baseY - sz * 0.6, sz * 0.026, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + sz * 0.2, baseY - sz * 0.23, sz * 0.015, 0, Math.PI * 2); ctx.fill();
    } else if (d.deco === 'stars') {
      star(ctx, cx - sz * 0.12, cy + sz * 0.05, sz * 0.24, C.a2, -0.1);
      star(ctx, cx + sz * 0.25, cy - sz * 0.25, sz * 0.12, C.a2, 0.12);
    } else if (d.deco === 'petal') {
      petal(ctx, cx, cy, sz * 0.4, 0.3, C.a);
      petal(ctx, cx + sz * 0.38, cy - sz * 0.3, sz * 0.1, 0.1, alpha(fg, 0.8));
    }
  }
},

/* ---------- 6. المقرر اليومي: البطاقتان ---------- */
{
  id: 'daily_cards', type: 'daily', name: 'البطاقتان', tags: 'مقرر يومي محاضرة درس مشاهدة تاريخ',
  sizes: ['post', 'story', 'square'],
  variants: [{ id: 'brown', name: 'تذييل بني', sw: ['#efefef', '#2b2b2b', '#433125'] }, { id: 'green', name: 'تذييل أخضر', sw: ['#efefef', '#2b2b2b', '#2d4d24'] }],
  fields: [
    { k: 'top', label: 'السطر الأعلى', def: 'الفصل (1)', max: 24 },
    { k: 'title', label: 'العنوان', kind: 'area', def: 'المقــرر\nاليـومي', max: 26 },
    { k: 'sub', label: 'تحت العنوان', def: 'المنهج الإصلاحي', max: 30 },
    { k: 'cLabel', label: 'نوع المقرر', def: 'محاضـرة:', max: 20 },
    { k: 'cBody', label: 'المقرر', kind: 'area', def: 'أبجديات الثقافة\nالعهد المدني', max: 60 },
    { k: 'cNote', label: 'ملاحظة صغيرة', def: '*مشاهدة* درس وفاة الرسول ﷺ', max: 44, hint: 'ما بين *نجمتين* يظهر بلون مميز' },
    { kind: 'date', label: 'التاريخ', map: { day: 'يوم {wd}', hn: '{hd}', hm: '{hm}', gn: '{gd2}', gm: '{gm}' } },
    { k: 'day', label: 'اليوم', def: 'يوم الخميس', max: 16 },
    { k: 'hn', label: 'اليوم الهجري', def: '26', half: 1 },
    { k: 'hm', label: 'الشهر الهجري', def: 'ربيع الثاني', half: 1 },
    { k: 'gn', label: 'اليوم الميلادي', def: '08', half: 1 },
    { k: 'gm', label: 'الشهر الميلادي', def: 'أكتوبـر', half: 1 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, sv = Math.min(1, H / 1350) * u, fb = v === 'green' ? C.pd : C.sd;
    const base = OV.bg || '#efefef', fg = onBg(base);
    paintBg(ctx, W, H, base);
    const fh = 140 * u;
    G(ctx, 'footer'); area(0, H - fh, W, H); ctx.fillStyle = fb; ctx.fillRect(0, H - fh, W, fh);
    academy(ctx, '#ffffff', W - 64 * u, H - fh / 2 - 22 * u, 140 * u, 'tr');
    social(ctx, '#ffffff', 60 * u, H - fh / 2 - 22 * u, 128 * u, 'tl');
    G(ctx, 'logo'); drawLogo(ctx, T, W - 64 * u, 56 * u, 112 * u, isDark(base) ? '#ffffff' : 'color', 'tr');
    G(ctx, 'top');
    const avail = H - fh;
    let y = Math.max(avail * 0.085, 70 * u);
    if (has(d.top)) { line(ctx, d.top, W / 2, y, { size: 32 * sv, color: fg, align: 'center' }); y += 44 * sv; }
    const tf = fit(ctx, d.title, { maxW: W * 0.7, maxH: 330 * sv, size: 158 * sv * k, lh: 1.06, balance: true, bold: 1, title: true });
    G(ctx, 'title'); drawFit(ctx, tf, W / 2, y, { align: 'center', color: OV.title || fg });
    y += tf.h + 22 * sv;
    G(ctx, 'sub'); if (has(d.sub)) { line(ctx, d.sub, W / 2, y + 18 * sv, { size: 34 * sv, color: fg, align: 'center' }); y += 56 * sv; }
    const cw = W * 0.42, cx0 = W * 0.2, pad = 44 * u;
    const lab = fit(ctx, d.cLabel, { maxW: cw - pad * 2, size: 46 * sv, maxLines: 1, bold: 0.8 });
    const body = fit(ctx, d.cBody, { maxW: cw - pad * 2, maxH: 190 * sv, size: 46 * sv, lh: 1.24, bold: 0.3 });
    const note = fit(ctx, d.cNote, { maxW: cw - pad * 2, size: 28 * sv, maxLines: 1 });
    const dw = W * 0.26, dh = 196 * sv;
    const ch = Math.max(330 * sv, 50 * sv + lab.h + body.h + (note.h ? note.h + 24 * sv : 0) + dh * 0.55 + 36 * sv);
    const space = avail - y - 40 * sv;
    const cy0 = y + Math.max(26 * sv, (space - ch - dh * 0.45) / 2);
    G(ctx, 'card'); area(cx0, cy0 - 18 * u, cx0 + cw + 22 * u, cy0 + ch);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.10)'; ctx.shadowBlur = 40 * u; ctx.shadowOffsetY = 12 * u;
    fillRR(ctx, cx0 + 22 * u, cy0 - 18 * u, cw, ch, 34 * u, '#f7f7f7');
    fillRR(ctx, cx0, cy0, cw, ch, 34 * u, '#ffffff');
    ctx.restore();
    const cxr = cx0 + cw - pad;
    let yy = cy0 + 46 * sv;
    drawFit(ctx, lab, cxr, yy, { align: 'right', color: C.p }); yy += lab.h;
    drawFit(ctx, body, cxr, yy, { align: 'right', color: C.p }); yy += body.h + 24 * sv;
    drawFit(ctx, note, cxr, yy, { align: 'right', color: C.ink, hl: C.s });
    if (D()) chevrons(ctx, cx0 + 46 * u, cy0 + ch - 50 * sv, 34 * sv, '#d6d6d6', 1);
    const dx = cx0 + cw - dw * 0.15, dy = cy0 + ch - dh * 0.55;
    G(ctx, 'date'); area(dx, dy, dx + dw + 14 * u, dy + dh + 16 * u);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 36 * u; ctx.shadowOffsetY = 10 * u;
    fillRR(ctx, dx + 14 * u, dy + 16 * u, dw, dh, 30 * u, '#f4f4f4');
    fillRR(ctx, dx, dy, dw, dh, 30 * u, '#ffffff');
    ctx.restore();
    const dxr = dx + dw - 30 * u;
    line(ctx, d.day, dxr, dy + 54 * sv, { size: 36 * sv, color: C.p, align: 'right', bold: 0.8, maxW: dw - 50 * u });
    [[d.hn, d.hm], [d.gn, d.gm]].forEach(function (r, i) {
      const ry = dy + 114 * sv + i * 46 * sv;
      if (!has(r[0]) && !has(r[1])) return;
      const f = line(ctx, r[0], dxr, ry, { size: 26 * sv, color: C.ink, align: 'right', bold: 0.8 });
      if (f.w) vline(ctx, dxr - f.w - 10 * u, ry - 14 * sv, ry + 14 * sv, C.ink, 2 * u);
      line(ctx, r[1], dxr - f.w - (f.w ? 22 * u : 0), ry, { size: 25 * sv, color: C.ink, align: 'right', maxW: dw - f.w - 70 * u });
    });
  }
},

/* ---------- 7. المقرر اليومي: الشكل ---------- */
{
  id: 'daily_shape', type: 'daily', name: 'العبارة والشكل', tags: 'مقرر اليوم راحة استدراك مراجعة عبارة',
  sizes: ['post', 'square', 'story'],
  variants: [{ id: 'wave', name: 'موجة ونجمة', sw: ['#fafafa', '#467839', '#fbb03b'] }, { id: 'slope', name: 'منحدر ومعيّن', sw: ['#fafafa', '#467839', '#f99229'] }],
  fields: [
    { k: 'kicker', label: 'العنوان الصغير', def: 'مقـرر اليــوم', max: 26 },
    { k: 'title', label: 'العبارة', kind: 'area', def: 'راحـة واستــدراك..', max: 60 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, base = OV.bg || '#fafafa', fg = onBg(base);
    paintBg(ctx, W, H, base);
    G(ctx, 'footer'); academy(ctx, isDark(base) ? 'rgba(255,255,255,0.8)' : '#3a3a3a', 64 * u, 56 * u, 118 * u, 'tl');
    const xr = W - 74 * u, ky = Math.max(170 * u, H * 0.15);
    G(ctx, 'kicker');
    if (has(d.kicker)) {
      vline(ctx, xr, ky - 26 * u, ky + 26 * u, alpha(fg, 0.45), 3 * u);
      line(ctx, d.kicker, xr - 22 * u, ky, { size: 40 * u, color: fg, align: 'right', maxW: W - 200 * u });
    }
    const tf = fit(ctx, d.title, { maxW: W - 148 * u, maxH: H * 0.22, size: 74 * u * k, lh: 1.42, bold: 0.3, title: true });
    G(ctx, 'title'); drawFit(ctx, tf, xr, ky + 64 * u, { align: 'right', color: OV.title || fg });
    G(ctx, 'shape');
    const top = Math.max(ky + 64 * u + tf.h + 130 * u, H * 0.4);
    const Y = function (f) { return top + (H - top) * f; };
    if (v === 'slope') {
      const y0 = Y(0.89), y1 = Y(0.5), sl = function (x) { return y0 + (y1 - y0) * x / W; };
      ctx.fillStyle = C.p; ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(W, y1); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      ctx.fillStyle = C.pd; ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(W * 0.335, sl(W * 0.335)); ctx.lineTo(W * 0.17, H); ctx.lineTo(0, H); ctx.fill();
      if (D()) {
        const ang = Math.atan2(y1 - y0, W), cx = W * 0.335, s = W * 0.14;
        ctx.save(); ctx.translate(cx, sl(cx) + s * 0.04); ctx.rotate(ang + Math.PI / 4);
        rrect(ctx, -s, -s, s, s, s * 0.2); ctx.save(); ctx.clip();
        ctx.fillStyle = C.a2; ctx.fillRect(-s, -s, s, s);
        ctx.beginPath(); ctx.arc(-s * 1.15, -s * 1.15, s * 0.95, 0, Math.PI * 2); ctx.fillStyle = C.a; ctx.fill();
        ctx.restore(); ctx.restore();
        box('deco', cx - s * 0.75, sl(cx) - s * 1.45, cx + s * 0.75, sl(cx), 'diamond');
      }
    } else {
      // شريطان بعرض ثابت يخرجان من أسفل التصميم: قوس خلفي على اليسار، وقوس أمامي تستقر عليه النجمة
      const bw = Math.min(W * 0.16, (H - top) * 0.2), bot = H + bw;
      const arch = function (a, b, ty, rr) {
        ctx.beginPath(); ctx.moveTo(a, bot); ctx.lineTo(a, ty + rr); ctx.arcTo(a, ty, a + rr, ty, rr);
        ctx.lineTo(b - rr, ty); ctx.arcTo(b, ty, b, ty + rr, rr); ctx.lineTo(b, bot);
      };
      ctx.lineCap = 'butt'; ctx.lineJoin = 'round'; ctx.lineWidth = bw;
      const t1 = Y(0.06), t2 = Y(0.5);
      ctx.strokeStyle = C.p; arch(-W * 0.3, W * 0.13, t1, W * 0.2); ctx.stroke();
      const a2 = W * 0.33, b2 = W * 0.88, r2 = Math.min(W * 0.2, (H - t2) * 0.45);
      ctx.strokeStyle = C.p; arch(a2, b2, t2, r2); ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.rect(0, t2 - bw, a2 + r2 * 0.55, H + bw); ctx.clip();
      ctx.strokeStyle = C.pd; arch(a2, b2, t2, r2); ctx.stroke(); ctx.restore();
      area(0, t1 - bw / 2, W, H);
      if (D()) {
        const sr = Math.min(W * 0.1, (t2 - bw / 2 - top) * 0.42);
        star(ctx, W * 0.62, t2 - bw / 2 - sr * 0.92, sr, C.a, 0.08);
        star(ctx, W * 0.5, t2 - bw / 2 - sr * 2.3, sr * 0.28, C.a, -0.1);
      }
    }
    G(ctx, 'logo');
    if (v === 'slope') drawLogo(ctx, T, W - 66 * u, H - 62 * u, 150 * u, '#ffffff', 'br');
    else { const lw = Math.min(150 * u, Math.min(W * 0.16, (H - top) * 0.2) * 0.85); drawLogo(ctx, T, W * 0.88 + lw / 2, H - 50 * u, lw, '#ffffff', 'br'); }
  }
},

/* ---------- 8. مسابقة: الرموز ---------- */
{
  id: 'comp_icons', type: 'comp', name: 'الرموز', tags: 'مسابقة حفظ منظومة متن تسميع مدة',
  sizes: ['post', 'story', 'square'],
  variants: [{ id: 'icons', name: 'بشبكة الرموز', sw: ['#f8f8f8', '#654b37', '#68b251'] }, { id: 'petal', name: 'بالزهرة', sw: ['#f8f8f8', '#654b37', '#467839'] }],
  fields: COMP_FIELDS(),
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, sv = Math.min(1, H / 1350) * u, base = OV.bg || '#f8f8f8';
    paintBg(ctx, W, H, base);
    if (D()) quiet(function () { petal(ctx, W * 0.83, H * 0.9, W * 0.42, 0.45, isDark(base) ? 'rgba(255,255,255,0.05)' : '#ededed'); });
    G(ctx, 'logo'); compHeader(ctx, W, u, T, base);
    let y = 160 * sv;
    G(ctx, 'deco');
    if (D() && v === 'icons') {
      const sq = 124 * sv, gap = 34 * sv, x0 = W / 2 - (sq * 3 + gap * 2) / 2;
      const dk = C.sdd;
      const cells = [['moon', C.pl, dk], ['petal', C.s, C.pl], ['up', C.pl, dk], ['left', C.s, C.pl], ['layers', C.pl, dk], ['ring', C.s, C.pl]];
      const save = BOXES; BOXES = null;
      cells.forEach(function (c, i) {
        const col = i % 3, row = Math.floor(i / 3);
        const x = x0 + col * (sq + gap), yy = y + row * (sq + gap);
        fillRR(ctx, x, yy, sq, sq, 10 * u, c[1]);
        const cx = x + sq / 2, cy = yy + sq / 2;
        if (c[0] === 'petal') petal(ctx, cx, cy, sq * 0.36, 0.78, c[2]);
        else if (c[0] === 'left') chevrons(ctx, cx - sq * 0.24, cy, sq * 0.34, c[2], 1);
        else icon(ctx, c[0], cx, cy, sq * 0.78, c[2]);
      });
      BOXES = save;
      box('deco', x0, y, x0 + sq * 3 + gap * 2, y + sq * 2 + gap, 'grid');
      y += sq * 2 + gap + 90 * sv;
    } else if (D()) {
      petal(ctx, W / 2, y + 170 * sv, 150 * sv, 0.3, C.p);
      petal(ctx, W / 2 + 190 * sv, y + 40 * sv, 34 * sv, 0.1, C.s);
      y += 400 * sv;
    } else y += 120 * sv;
    compText(ctx, W, H, d, T, k, Math.max(y, H * 0.45), u, sv, base);
    compFooter(ctx, W, H, u, base);
  }
},

/* ---------- 9. مسابقة: الصورة ---------- */
{
  id: 'comp_photo', type: 'comp', name: 'الصورة', tags: 'مسابقة حفظ صورة مصحف',
  sizes: ['post', 'story', 'square'],
  variants: [{ id: 'base', name: 'أساسي', sw: ['#f8f8f8', '#654b37', '#467839'] }],
  fields: [{ k: 'photo', label: 'الصورة', kind: 'image', def: 'img_quran' }].concat(COMP_FIELDS()),
  draw: function (ctx, W, H, d, T, v, k, P) {
    const C = T.c, u = W / 1080, sv = Math.min(1, H / 1350) * u, base = OV.bg || '#f8f8f8';
    paintBg(ctx, W, H, base);
    if (D()) quiet(function () { petal(ctx, W * 0.83, H * 0.9, W * 0.42, 0.45, isDark(base) ? 'rgba(255,255,255,0.05)' : '#ededed'); });
    const ih = H * 0.56;
    G(ctx, 'photo'); if (P.photo) drawPhoto(ctx, P.photo.im, 0, 0, W, ih, { z: P.photo.z, ox: P.photo.ox, oy: P.photo.oy, feather: { bottom: 0.32 } });
    G(ctx, 'logo'); compHeader(ctx, W, u, T, '#f8f8f8');
    compText(ctx, W, H, d, T, k, ih - 20 * sv, u, sv, base);
    compFooter(ctx, W, H, u, base);
  }
},

/* ---------- 10. شكر وتقدير ---------- */
{
  id: 'thanks_cert', type: 'thanks', name: 'شكر وتقدير', tags: 'تهنئة شكر تقدير تكريم طالب مركز أول شهادة',
  sizes: ['card', 'post', 'square'],
  variants: [{ id: 'green', name: 'شريط أخضر', sw: ['#ece8e3', '#2d4d24', '#f99229'] }, { id: 'brown', name: 'شريط بني', sw: ['#ece8e3', '#2d4d24', '#f99229'] }, { id: 'none', name: 'بلا شريط', sw: ['#ece8e3', '#2d4d24', '#f99229'] }],
  fields: [
    { k: 'title', label: 'العنوان', def: 'شكــر وتقديــر', max: 22 },
    { k: 'intro', label: 'التمهيد', def: 'تتقدم إدارة مسار جذور بخالص التهنئة للطالب:', max: 70 },
    { k: 'name', label: 'الاسم', def: 'عبدالله محمد الأحمد', max: 32 },
    { k: 'body', label: 'نص التهنئة', kind: 'area', def: 'وذلك تقديراً لتميّزه وإنجازه الرائع في *مسابقة حفظ المتن*،\nوتتويجه *بالمركز الأول* على المسار.', max: 200, hint: 'ما بين *نجمتين* يظهر بلون التمييز' },
    { k: 'partner', label: 'شعار جهة مشاركة (اختياري)', kind: 'image', def: '', optional: true, fitMode: 'contain' }
  ],
  draw: function (ctx, W, H, d, T, v, k, P) {
    const C = T.c, land = W > H, s = land ? Math.min(W / 1600, H / 1131) : W / 1150;
    if (OV.bg || BGFX) paintBg(ctx, W, H, OV.bg || '#ece8e3');
    else {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#f2f0ee'); g.addColorStop(0.6, '#ece8e3'); g.addColorStop(1, '#e2dacf');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    const base = OV.bg || '#ece8e3', dark = isDark(base), txt = dark ? '#ffffff' : '#30483f';
    if (D()) lightStreaks(ctx, W, H, dark ? 0.08 : 0.5);
    let cL = W * 0.06;
    G(ctx, 'band');
    if (v !== 'none') {
      const bx = W * (land ? 0.105 : 0.07), bw = W * (land ? 0.085 : 0.1);
      const col = v === 'brown' ? C.s : C.p;
      const bgr = ctx.createLinearGradient(0, 0, 0, H);
      bgr.addColorStop(0, alpha(col, 0.95)); bgr.addColorStop(0.55, alpha(col, 0.7)); bgr.addColorStop(1, alpha(col, 0.08));
      area(bx, 0, bx + bw, H); ctx.fillStyle = bgr; ctx.fillRect(bx, 0, bw, H);
      if (!HIDE.logo) { ctx.save(); ctx.translate(bx + bw / 2, H * 0.97); ctx.rotate(-Math.PI / 2); ctx.globalAlpha = 0.35;
        const save = BOXES; BOXES = null; drawLogo(ctx, T, 0, 0, Math.min(H * 0.32, 420 * s * 1.5), '#ffffff', 'bl'); BOXES = save; ctx.restore(); }
      cL = bx + bw + W * 0.04;
    }
    const cR = W - W * 0.05, cx = (cL + cR) / 2, cw = cR - cL;
    const tf = fit(ctx, d.title, { maxW: cw * 0.8, size: 150 * s * k, maxLines: 1, bold: 1, title: true, lh: 1.25 });
    const intro = fit(ctx, d.intro, { maxW: cw * 0.9, size: 44 * s, lh: 1.45, maxLines: 2, bold: 0.3 });
    const nm = fit(ctx, d.name, { maxW: cw * 0.85, size: 92 * s * k, maxLines: 1, bold: 0.7, title: true, lh: 1.3 });
    const body = fit(ctx, d.body, { maxW: cw * 0.92, size: 44 * s, lh: 1.65, maxH: H * (land ? 0.24 : 0.34), bold: 0.3 });
    const logoH = HIDE.logo && !(P.partner && P.partner.im) ? 0 : 120 * s;
    const gaps = [46, 22, 36, 64].map(function (x) { return x * s; });
    const total = tf.h + intro.h + nm.h + body.h + logoH + gaps.reduce(function (a, b) { return a + b; }, 0);
    let y = Math.max(H * 0.06, (H - total) / 2);
    G(ctx, 'title'); drawFit(ctx, tf, cx, y, { align: 'center', color: OV.title || (dark ? '#ffffff' : C.pd) }); y += tf.h + gaps[0];
    G(ctx, 'intro'); drawFit(ctx, intro, cx, y, { align: 'center', color: txt }); y += intro.h + gaps[1];
    G(ctx, 'name'); drawFit(ctx, nm, cx, y, { align: 'center', color: C.a2 }); y += nm.h + gaps[2];
    G(ctx, 'body'); drawFit(ctx, body, cx, y, { align: 'center', color: txt, hl: C.a2 }); y += body.h + gaps[3];
    G(ctx, 'logo');
    const pl = P.partner && P.partner.im;
    const lw = HIDE.logo ? 0 : logoH * srcW(IMG[T.logo]) / srcH(IMG[T.logo]) * 0.8;
    const pw = pl ? logoH * srcW(pl) / srcH(pl) : 0;
    const tot = lw + (pl && lw ? 50 * s : 0) + pw;
    if (lw) drawLogo(ctx, T, cx + tot / 2, y + logoH * 0.1, lw, dark ? '#ffffff' : 'color', 'tr');
    if (pl) { ctx.drawImage(pl, cx + tot / 2 - lw - (lw ? 50 * s : 0) - pw, y, pw, logoH); area(cx + tot / 2 - lw - (lw ? 50 * s : 0) - pw, y, cx + tot / 2 - lw, y + logoH); }
  }
},

/* ---------- 11. عبارة: الأشعة ---------- */
{
  id: 'quote_rays', type: 'quote', name: 'الأشعة', tags: 'عبارة بيت شعر تذكير تنبيه اختبار',
  sizes: ['post', 'square', 'story'],
  variants: [{ id: 'teal', name: 'زيتي', sw: ['#0e423e', '#ffffff', '#fbb03b'] }, { id: 'green', name: 'أخضر', sw: ['#2d4d24', '#ffffff', '#fbb03b'] }, { id: 'brown', name: 'بني', sw: ['#33251c', '#ffffff', '#fbb03b'] }],
  fields: [
    { k: 'title', label: 'العنوان', kind: 'area', def: 'اليوم يغلـق الاختبار', max: 34 },
    { k: 'body', label: 'العبارة', kind: 'area', def: 'أسرع وحُثّ السيرَ جَهدكَ إنّما\nمَســراكَ هذا ساعةٌ لزمـــانِ..', max: 160 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080;
    const base = OV.bg || (v === 'green' ? C.pd : (v === 'brown' ? C.sdd : C.teal)), fg = onBg(base);
    const lc = OV.bg ? (isDark(base) ? lighten(base, 0.35) : lighten(base, -0.25)) : (v === 'green' ? lighten(C.p, 0.12) : (v === 'brown' ? lighten(C.s, 0.12) : C.tealL));
    paintBg(ctx, W, H, base);
    const oy = Math.min(H * 0.545, H - 560 * u);
    const vg = ctx.createRadialGradient(W * 0.3, oy, 0, W * 0.3, oy, W * 0.9);
    vg.addColorStop(0, 'rgba(255,255,255,0.05)'); vg.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    G(ctx, 'deco');
    if (D()) {
      area(0, 0, W, oy);
      ctx.lineCap = 'butt';
      [0.035, 0.07, 0.105].forEach(function (x) { ctx.strokeStyle = alpha(lc, 0.2); ctx.lineWidth = 14 * u; ctx.beginPath(); ctx.moveTo(W * x, 0); ctx.lineTo(W * x, oy); ctx.stroke(); });
      [[0.16, 82], [0.215, 64], [0.27, 48], [0.33, 33], [0.39, 19]].forEach(function (r, i) {
        const a = -r[1] * Math.PI / 180, L = W * 1.6;
        ctx.strokeStyle = alpha(lc, 0.22 + i * 0.06); ctx.lineWidth = 15 * u;
        ctx.beginPath(); ctx.moveTo(W * r[0], oy); ctx.lineTo(W * r[0] + L * Math.cos(a), oy + L * Math.sin(a)); ctx.stroke();
      });
      ctx.strokeStyle = alpha(lc, 0.85); ctx.lineWidth = 15 * u;
      ctx.beginPath(); ctx.moveTo(W * 0.41, oy); ctx.lineTo(W * 0.98, oy); ctx.stroke();
    }
    const xr = W - 74 * u;
    const tf = fit(ctx, d.title, { maxW: W * 0.72, maxH: 220 * u, size: 76 * u * k, lh: 1.28, balance: true, bold: 0.9, title: true });
    const ty = oy + 100 * u;
    G(ctx, 'title'); drawFit(ctx, tf, xr, ty, { align: 'right', color: OV.title || fg });
    if (D() && tf.lines.length) {
      const lastW = tf.lines[tf.lines.length - 1].w;
      const sx = xr - lastW - 50 * u, sy = ty + tf.h - tf.pb - tf.size * tf.lh * 0.5;
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 90 * u);
      glow.addColorStop(0, alpha(C.a, 0.45)); glow.addColorStop(1, alpha(C.a, 0));
      ctx.fillStyle = glow; ctx.fillRect(sx - 100 * u, sy - 100 * u, 200 * u, 200 * u);
      star(ctx, sx, sy + 4 * u, 22 * u, C.a, 0); star(ctx, sx + 22 * u, sy - 22 * u, 7 * u, C.a, 0);
    }
    const bf = fit(ctx, d.body, { maxW: W * 0.78, maxH: H - ty - tf.h - 170 * u, size: 46 * u, lh: 1.6 });
    G(ctx, 'body'); drawFit(ctx, bf, xr, ty + tf.h + 34 * u, { align: 'right', color: alpha(fg, 0.92), hl: C.a });
    G(ctx, 'logo'); drawLogo(ctx, T, W - 66 * u, H - 60 * u, 118 * u, alpha(fg, 0.85), 'br');
  }
},

/* ---------- 12. عبارة: الصورة ---------- */
{
  id: 'quote_photo', type: 'quote', name: 'الصورة والإطار', tags: 'عبارة صورة مجلس أسبوعي اقتباس',
  sizes: ['post', 'square', 'story'],
  variants: [{ id: 'green', name: 'صبغة خضراء', sw: ['#2d4d24', '#ffffff', '#fbb03b'] }, { id: 'brown', name: 'صبغة بنية', sw: ['#33251c', '#ffffff', '#fbb03b'] }, { id: 'none', name: 'ألوان الصورة', sw: ['#222222', '#ffffff', '#fbb03b'] }],
  colorLabels: { bg: 'لون الصبغة' },
  fields: [
    { k: 'photo', label: 'الصورة', kind: 'image', def: 'img_arch' },
    { k: 'quote', label: 'العبارة أعلى الصورة', kind: 'area', def: '"ما من شيء أقرب لنجاة العبد من تدبّر القرآن وإعمال الفكر في معانيه"', max: 120 },
    { k: 'title', label: 'العنوان', kind: 'area', def: 'مجلس الاستهداء\nبالقـــرآن', max: 40 },
    { k: 'sub', label: 'تحت العنوان', def: '- الأربعاء من كل أسبوع -', max: 36 },
    { k: 'frame', label: 'الإطار الفاتح', kind: 'toggle', def: true }
  ],
  draw: function (ctx, W, H, d, T, v, k, P) {
    const C = T.c, u = W / 1080, m = d.frame ? 36 * u : 0;
    paintBg(ctx, W, H, '#f4f2ee');
    const x = m, y = m, w = W - 2 * m, h = H - 2 * m;
    const tint = OV.bg || (v === 'brown' ? C.sdd : (v === 'none' ? '' : C.pd));
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    bg(ctx, W, H, '#222');
    if (P.photo) drawPhoto(ctx, P.photo.im, x, y, w, h, { z: P.photo.z, ox: P.photo.ox, oy: P.photo.oy });
    if (tint) {
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = lighten(tint, 0.35); ctx.fillRect(x, y, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }
    const sh = tint || '#000000';
    const g1 = ctx.createLinearGradient(0, y, 0, y + h);
    g1.addColorStop(0, alpha(sh, 0.7)); g1.addColorStop(0.22, alpha(sh, 0.1)); g1.addColorStop(0.55, alpha(sh, 0.05)); g1.addColorStop(1, alpha(sh, 0.88));
    ctx.fillStyle = g1; ctx.fillRect(x, y, w, h);
    ctx.restore();
    const qf = fit(ctx, d.quote, { maxW: w * 0.84, maxH: 150 * u, size: 32 * u, lh: 1.5, balance: true, bold: 0.2 });
    G(ctx, 'quote'); drawFit(ctx, qf, W / 2, y + 66 * u, { align: 'center', color: '#ffffff' });
    const xr = x + w - 64 * u;
    let by = y + h - 70 * u;
    G(ctx, 'sub'); if (has(d.sub)) { line(ctx, d.sub, xr, by, { size: 30 * u, color: '#ffffff', align: 'right', maxW: w * 0.6 }); by -= 64 * u; }
    const tf = fit(ctx, d.title, { maxW: w * 0.66, maxH: Math.min(260 * u, by - y - qf.h - 200 * u), size: 80 * u * k, lh: 1.18, bold: 0.6, title: true });
    G(ctx, 'title'); drawFit(ctx, tf, xr, by - tf.h + 8 * u, { align: 'right', color: OV.title || '#ffffff' });
    G(ctx, 'logo'); drawLogo(ctx, T, x + 56 * u, y + h - 52 * u, 112 * u, '#ffffff', 'bl');
  }
},

/* ---------- 13. يوتيوب: الحلقة ---------- */
{
  id: 'yt_ring', type: 'yt', name: 'الحلقة', tags: 'يوتيوب غلاف محاضرة حلقة رقم درس',
  sizes: ['yt'],
  variants: [{ id: 'brown', name: 'بني', sw: ['#33251c', '#ffffff', '#fbb03b'] }, { id: 'green', name: 'أخضر', sw: ['#2d4d24', '#ffffff', '#fbb03b'] }, { id: 'light', name: 'فاتح', sw: ['#f7f6f4', '#2b2b2b', '#fbb03b'] }],
  fields: [
    { k: 'kicker', label: 'الوسم', def: 'محاضرة', max: 20 },
    { k: 'title', label: 'العنوان', kind: 'area', def: 'أبجديات الثقافة:\nالعهد المكي', max: 44 },
    { k: 'who', label: 'المقدّم', def: 'أ. علي حنان', max: 28 },
    { k: 'num', label: 'رقم داخل الدائرة', def: '3', max: 4, hint: 'رقم الحلقة أو الدرس، أو اتركه فارغاً' },
    { k: 'arc', label: 'سطر على الدائرة', def: 'مسار جـذور', max: 20 },
    { k: 'photo', label: 'صورة داخل الدائرة (اختياري)', kind: 'image', def: '', optional: true }
  ],
  draw: function (ctx, W, H, d, T, v, k, P) {
    const C = T.c, u = W / 1280;
    const base = OV.bg || (v === 'light' ? '#f7f6f4' : (v === 'green' ? C.pd : C.sdd)), light = !isDark(base);
    const fg = light ? C.ink : '#ffffff', ink = OV.title || fg;
    paintBg(ctx, W, H, base);
    const cx = W * 0.25, cy = H * 0.5, R = H * 0.36;
    G(ctx, 'ring'); area(cx - R, cy - R, cx + R, cy + R);
    if (P.photo && P.photo.im) {
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R * 0.9, 0, Math.PI * 2); ctx.clip();
      drawPhoto(ctx, P.photo.im, cx - R, cy - R, R * 2, R * 2, { z: P.photo.z, ox: P.photo.ox, oy: P.photo.oy }); ctx.restore();
    } else if (has(d.num)) {
      line(ctx, d.num, cx, cy + 8 * u, { size: 210 * u, color: light ? C.s : '#ffffff', align: 'center', bold: 1, title: true, maxW: R * 0.95 });
    }
    const ts = 26 * u, a2 = Math.PI / 2 + 0.7, g2 = has(d.arc) ? arcSpan(ctx, d.arc, ts, R) / 2 + 0.08 : 0;
    ctx.strokeStyle = light ? '#d8d8d8' : 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3 * u;
    ctx.beginPath(); ctx.arc(cx, cy, R, a2 + g2, a2 - g2 + Math.PI * 2); ctx.stroke();
    arcText(ctx, d.arc, cx, cy, R, a2, ts, light ? '#8a8a8a' : 'rgba(255,255,255,0.8)', true);
    if (D()) {
      petal(ctx, cx + R * 0.95 * Math.cos(0.55), cy + R * 0.95 * Math.sin(0.55), R * 0.32, 0.35, light ? alpha(C.p, 0.85) : lighten(C.s, 0.25));
      petal(ctx, cx + R * Math.cos(Math.PI * 1.05), cy + R * Math.sin(Math.PI * 1.05), R * 0.16, 0.2, light ? '#c3c3c3' : '#ffffff');
    }
    G(ctx, null);
    const xr = W - 80 * u, colW = W * 0.5;
    const tf = fit(ctx, d.title, { maxW: colW, maxH: 290 * u, size: 104 * u * k, lh: 1.2, balance: true, bold: 0.9, title: true });
    const total = (has(d.kicker) ? 118 * u : 0) + tf.h + (has(d.who) ? 100 * u : 0);
    let y = (H - total) / 2 - 20 * u;
    G(ctx, 'kicker'); if (has(d.kicker)) { pill(ctx, d.kicker, xr, y + 26 * u, 30 * u, C.a, C.sdd, { bold: 0.5 }); y += 118 * u; }
    G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: ink }); y += tf.h;
    G(ctx, 'who'); if (has(d.who)) infoItem(ctx, 'mic', d.who, xr, y + 60 * u, { size: 40 * u, color: fg, iconColor: C.a });
    G(ctx, 'logo'); const lg = drawLogo(ctx, T, xr, H - 44 * u, 130 * u, light ? 'color' : '#ffffff', 'br');
    G(ctx, 'footer'); academy(ctx, light ? '#8a8a8a' : 'rgba(255,255,255,0.65)', xr - (lg.w ? lg.w + 45 * u : 0), H - 92 * u, 112 * u, 'tr');
  }
},

/* ---------- 14. يوتيوب: الصورة ---------- */
{
  id: 'yt_photo', type: 'yt', name: 'الصورة', tags: 'يوتيوب غلاف صورة مسابقة',
  sizes: ['yt'],
  variants: [{ id: 'green', name: 'أخضر', sw: ['#2d4d24', '#ffffff', '#fbb03b'] }, { id: 'brown', name: 'بني', sw: ['#33251c', '#ffffff', '#fbb03b'] }],
  fields: [
    { k: 'photo', label: 'الصورة', kind: 'image', def: 'img_quran' },
    { k: 'kicker', label: 'الوسم', def: 'مسابقة', max: 20 },
    { k: 'title', label: 'العنوان', kind: 'area', def: 'لله من أسمائه\nتسعونا', max: 44 },
    { k: 'sub', label: 'سطر تحت العنوان', def: 'حفظ المنظومة وتسميعها', max: 40 }
  ],
  draw: function (ctx, W, H, d, T, v, k, P) {
    const C = T.c, u = W / 1280, tc = OV.bg || (v === 'brown' ? C.sdd : C.pd), fg = onBg(tc);
    paintBg(ctx, W, H, tc);
    if (P.photo) drawPhoto(ctx, P.photo.im, 0, 0, W * 0.62, H, { z: P.photo.z, ox: P.photo.ox, oy: P.photo.oy });
    const g = ctx.createLinearGradient(W * 0.62, 0, W * 0.3, 0);
    g.addColorStop(0, alpha(tc, 1)); g.addColorStop(1, alpha(tc, 0));
    ctx.fillStyle = g; ctx.fillRect(W * 0.3, 0, W * 0.33, H);
    if (D()) quiet(function () { petal(ctx, W * 0.98, H * 0.95, H * 0.42, 0.4, alpha(fg, 0.05)); });
    const xr = W - 70 * u, colW = W * 0.46;
    G(ctx, 'logo'); drawLogo(ctx, T, xr, 46 * u, 120 * u, fg, 'tr'); G(ctx, null);
    const tf = fit(ctx, d.title, { maxW: colW, maxH: 330 * u, size: 116 * u * k, lh: 1.18, balance: true, bold: 0.9, title: true });
    const total = (has(d.kicker) ? 118 * u : 0) + tf.h + (has(d.sub) ? 86 * u : 0);
    let y = (H - total) / 2 + 30 * u;
    G(ctx, 'kicker'); if (has(d.kicker)) { pill(ctx, d.kicker, xr, y + 26 * u, 30 * u, C.a, C.sdd, { bold: 0.5 }); y += 118 * u; }
    G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: OV.title || fg }); y += tf.h;
    G(ctx, 'sub'); if (has(d.sub)) line(ctx, d.sub, xr, y + 50 * u, { size: 38 * u, color: alpha(fg, 0.85), align: 'right', maxW: colW });
  }
}
];

/* ---------- مشترك بين قالبي المسابقة ---------- */
function COMP_FIELDS() {
  return [
    { k: 'kicker', label: 'السطر الأعلى', def: 'مسابقة حفظ منظومة:', max: 34 },
    { k: 'title', label: 'اسم المسابقة', kind: 'area', def: 'لله من أسمائـه تسعونـا', max: 40 },
    { k: 'i1', label: 'المعلومة الأولى', def: 'المدة: 5 أيام', max: 24, half: 1 },
    { k: 'i2', label: 'المعلومة الثانية', def: 'موعد التسميع: الخميس', max: 28, half: 1 },
    { kind: 'date', label: 'التاريخ', map: { d1: '{hd} {hm} {hy} هـ', d2: '{gd} {gm} {gy} م', i2: 'موعد التسميع: {wd}' } },
    { k: 'd1', label: 'التاريخ الهجري', def: '30 صفر 1448 هـ', half: 1 },
    { k: 'd2', label: 'التاريخ الميلادي', def: '13 أغسطس 2026 م', half: 1 }
  ];
}
function compHeader(ctx, W, u, T, base) {
  const dark = isDark(base);
  const lg = drawLogo(ctx, T, W - 60 * u, 46 * u, 96 * u, dark ? '#ffffff' : 'color', 'tr');
  hline(ctx, 60 * u, W - 60 * u - (lg.w ? lg.w + 24 * u : 0), 46 * u + (lg.h || 38 * u) * 0.6, dark ? 'rgba(255,255,255,0.4)' : '#9a9a9a', 1.6 * u);
}
function compFooter(ctx, W, H, u, base) {
  G(ctx, 'footer');
  const y = H - 78 * u, c = isDark(base) ? 'rgba(255,255,255,0.75)' : '#4a4a4a';
  const a = academy(ctx, c, W - 60 * u, y - 18 * u, 118 * u, 'tr');
  const s = social(ctx, c, 60 * u, y - 16 * u, 112 * u, 'tl');
  hline(ctx, 60 * u + (s.w ? s.w + 28 * u : 0), W - 60 * u - (a.w ? a.w + 28 * u : 0), y + 6 * u, isDark(base) ? 'rgba(255,255,255,0.3)' : '#b9b9b9', 1.6 * u);
}
function compText(ctx, W, H, d, T, k, y, u, sv, base) {
  const C = T.c, dark = isDark(base), ink = dark ? '#ffffff' : C.ink;
  G(ctx, 'kicker'); if (has(d.kicker)) { line(ctx, d.kicker, W / 2, y + 26 * sv, { size: 46 * sv, color: ink, align: 'center', bold: 0.3, maxW: W * 0.8 }); y += 82 * sv; }
  const roomT = H - y - 66 * sv - ((has(d.d1) || has(d.d2)) ? 185 : 70) * sv;   // يبقى للمعلومات والتاريخ مكانها في الأحجام القصيرة
  const tf = fit(ctx, d.title, { maxW: W * 0.7, maxH: Math.max(70 * sv, Math.min(230 * sv, roomT)), size: 88 * sv * k, lh: 1.3, balance: true, bold: 1, title: true });
  G(ctx, 'title'); drawFit(ctx, tf, W / 2, y, { align: 'center', color: OV.title || (dark ? '#ffffff' : C.s) });
  if (D() && tf.lines.length) {
    const my = y + tf.h / 2;
    chevrons(ctx, W / 2 + tf.w / 2 + 32 * u, my, 30 * sv, C.p, 1, C.pl);
    chevrons(ctx, W / 2 - tf.w / 2 - 32 * u, my, 30 * sv, C.p, -1, C.pl);
  }
  y += tf.h + 66 * sv;
  G(ctx, 'info');
  let s = 40 * sv;
  let w1 = infoW(ctx, 'moon', d.i1, { size: s }), w2 = infoW(ctx, 'layers', d.i2, { size: s });
  const gap = 110 * u; let tot = w1 + w2 + (w1 && w2 ? gap : 0);
  if (tot > W * 0.9) { const f = Math.max(0.55, (W * 0.9 - gap) / (w1 + w2)); s *= f; w1 *= f; w2 *= f; tot = w1 + w2 + (w1 && w2 ? gap : 0); }
  const x1 = W / 2 + tot / 2, x2 = x1 - (w1 ? w1 + gap : 0);
  infoItem(ctx, 'moon', d.i1, x1, y, { size: s, color: ink, iconColor: dark ? C.pl : C.s });
  infoItem(ctx, 'layers', d.i2, x2, y, { size: s, color: ink, iconColor: dark ? C.pl : C.s });
  G(ctx, 'date');
  if (has(d.d1) || has(d.d2)) {
    const sx = w2 ? Math.max(W * 0.3, x2 - s * 1.6) : W / 2 + 120 * u;
    icon(ctx, 'down', sx - 24 * u, y + 56 * sv, 36 * sv, C.p);
    line(ctx, d.d1, sx, y + 112 * sv, { size: 30 * sv, color: ink, align: 'right', bold: 0.4, maxW: sx - 40 * u });
    line(ctx, d.d2, sx, y + 158 * sv, { size: 30 * sv, color: ink, align: 'right', bold: 0.4, maxW: sx - 40 * u });
  }
}
