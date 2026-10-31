/* ================= قوالب «الشبكة والتذاكر» (من تصاميم ٣١ أكتوبر ٢٠٢٦) =================
   لغة بصرية مأخوذة من تصاميم خارطة الثغور الجديدة: خلفية كحلية بشبكة خفيفة وهالة، تذاكر بحواف مسنّنة،
   بطاقة الملف، ختم مائل، أسهم سنبلة. تعمل بكل الهويات: الخلفية من اللون الأساسي الداكن،
   و«الرملي» من لون التمييز ممزوجاً بالورق (قرار المستخدم: «الداكن والتمييز الهادئ»).
   كل قالب هنا يحمل خطوطه (fonts): زين للعناوين الكبيرة، وريدكس لعناوين البطاقات، واليمامة للأسماء والنصوص. */

const NT_FONTS = { title: 'readex', head: 'zain', name: 'alyamama', body: 'alyamama' };

// ألوان الطقم من الهوية
function ntPal(T) {
  const C = T.c;
  return {
    C: C, night: C.pd, cream: C.paper,
    sand: mixC(C.a, C.paper, 0.42),            // الرملي الهادئ: تعبئة
    sandInk: mixC(C.a, C.ink, 0.38),           // رملي داكن يُقرأ على الورق
    stamp: mixC(C.pl, '#ffffff', 0.5),         // الختم
    live: mixC(C.a2, C.ink, 0.42)              // كبسولة «لقاء مباشر»
  };
}
// تنظيف النصوص: لا مسافة قبل علامات الترقيم العربية، ولا تطويل بعد آخر حرف في الكلمة
function ntClean(s) {
  return String(s == null ? '' : s).replace(/\s+([؟?!:،؛.])/g, '$1').replace(/ـ+(?=\s|$|[؟?!:،؛.»])/g, '');
}
// الخلفية: لون، شبكة خفيفة، وهالة فاتحة في الوسط
function ntGround(ctx, W, H, base, o) {
  o = o || {};
  paintBg(ctx, W, H, base);
  if (BGFX || !D()) return;
  const u = W / 1080, dark = isDark(base);
  quiet(function () {
    if (o.glow !== false) {
      const gx = o.gx == null ? W * 0.5 : o.gx, gy = o.gy == null ? H * 0.45 : o.gy, gr = Math.max(W, H) * (o.gr || 0.62);
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      g.addColorStop(0, dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (o.grid !== false) {
      const st = (o.step || 72) * u;
      ctx.strokeStyle = dark ? 'rgba(255,255,255,0.075)' : alpha(o.ink || '#1f2a44', 0.075); ctx.lineWidth = 1.6 * u;
      ctx.beginPath();
      for (let x = (W % st) / 2; x <= W; x += st) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let y = (H % st) / 2; y <= H; y += st) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();
    }
  });
}
// شكل بثقوب: يُرسم في لوحة جانبية بدقة الرسم الحالية، ثم تُقصّ الدوائر، ثم يوضع في التصميم (مع ظل اختياري)
function ntCut(ctx, x, y, w, h, paint, holes, shadow) {
  const m = ctx.getTransform(), sc = Math.max(0.02, Math.hypot(m.a, m.b));
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w * sc)); c.height = Math.max(1, Math.ceil(h * sc));
  const g = c.getContext('2d'); g.scale(sc, sc); paint(g, w, h);
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
  (holes || []).forEach(function (o) { g.beginPath(); g.arc(o[0], o[1], o[2], 0, Math.PI * 2); g.fill(); });
  ctx.save();
  if (shadow) { ctx.shadowColor = shadow; ctx.shadowBlur = Math.min(w, h) * 0.06; ctx.shadowOffsetY = Math.min(w, h) * 0.02; }
  ctx.drawImage(c, x, y, w, h); ctx.restore();
}
// ثقوب حافة مسنّنة: صف دوائر صغيرة على حافة أفقية، وثقب أكبر في وسطها
function ntBites(w, y, r, big) {
  const out = [], n = Math.max(3, Math.round(w / (r * 4.4))), stp = w / n;
  for (let i = 0; i < n; i++) { const x = stp * (i + 0.5); if (big && Math.abs(x - w / 2) < r * 2.6) continue; out.push([x, y, r]); }
  if (big) out.push([w / 2, y, r * (big || 2)]);
  return out;
}
// معيّن صغير
function ntDiamond(ctx, cx, cy, s, color) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4); ctx.fillStyle = color;
  rrect(ctx, -s / 2, -s / 2, s, s, s * 0.18); ctx.fill(); ctx.restore();
}
// سهم السنبلة: ثلاث علامات مثل «v» متراكبة، تشير إلى الأسفل
function ntWheat(ctx, cx, cy, s, color) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = s * 0.16; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 0; i < 3; i++) { const y = cy - s * 0.62 + i * s * 0.48; ctx.beginPath(); ctx.moveTo(cx - s * 0.32, y); ctx.lineTo(cx, y + s * 0.3); ctx.lineTo(cx + s * 0.32, y); ctx.stroke(); }
  ctx.restore();
}
// الختم المائل: طابع بحواف مسنّنة وإطار متقطع، ونص في سطر أو سطرين، ونجمة صغيرة في زاويته
function ntStamp(ctx, str, cx, cy, w, h, rot, fill, ink, u) {
  str = ntClean(str); if (!has(str)) return;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  const r = h * 0.07, holes = [].concat(ntBites(w, 0, r), ntBites(w, h, r));
  for (let i = 0; i < Math.max(3, Math.round(h / (r * 4.4))); i++) { const n = Math.max(3, Math.round(h / (r * 4.4))), y = h / n * (i + 0.5); holes.push([0, y, r], [w, y, r]); }
  ntCut(ctx, -w / 2, -h / 2, w, h, function (g, ww, hh) { g.fillStyle = fill; g.fillRect(0, 0, ww, hh); }, holes, 'rgba(0,0,0,0.18)');
  ctx.setLineDash([6 * u, 5 * u]); ctx.strokeStyle = alpha(ink, 0.55); ctx.lineWidth = 2 * u;
  ctx.strokeRect(-w / 2 + h * 0.13, -h / 2 + h * 0.13, w - h * 0.26, h - h * 0.26); ctx.setLineDash([]);
  const ls = str.split('\n').slice(0, 2), fs = Math.min(h * (ls.length > 1 ? 0.25 : 0.32), (w - h * 0.4) / Math.max(3, Math.max.apply(null, ls.map(function (s) { return s.length; }))) * 1.7);
  // النص مائل مع الختم، فلا تُسجَّل صناديقه المائلة؛ يُسجَّل بدلها مستطيل الختم كاملاً
  quiet(function () { ls.forEach(function (s, i) { line(ctx, s, 0, (i - (ls.length - 1) / 2) * fs * 1.15, { size: fs, color: ink, align: 'center', bold: 0.9, role: 'name', maxW: w - h * 0.36 }); }); });
  if (D()) sparkle(ctx, w / 2 - h * 0.06, -h / 2 + h * 0.04, h * 0.22, '#ffffff');
  ctx.restore();
  const e = (w * Math.abs(Math.cos(rot)) + h * Math.abs(Math.sin(rot))) / 2, f = (w * Math.abs(Math.sin(rot)) + h * Math.abs(Math.cos(rot))) / 2;
  area(cx - e, cy - f, cx + e, cy + f);
}
// كبسولة «● لقاء مباشر»
function ntLive(ctx, str, xr, yc, size, fill, color) {
  str = ntClean(str); if (!has(str)) return 0;
  const tw = textW(ctx, str, size, 0.6, false, 'name'), padX = size * 0.6, dot = size * 0.42, w = tw + padX * 2 + dot + size * 0.4, h = size * 1.7;
  fillRR(ctx, xr - w, yc - h / 2, w, h, size * 0.28, fill);
  ctx.beginPath(); ctx.arc(xr - padX - dot / 2, yc, dot / 2, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  line(ctx, str, xr - padX - dot - size * 0.4, yc, { size: size, color: color, align: 'right', bold: 0.6, role: 'name' });
  return w;
}
// الزاوية العليا: معيّن والسنة يساراً، وكبسولة يميناً
function ntCorners(ctx, W, d, fg, pill, pillInk, u, yy) {
  const y = yy || 80 * u;
  G(ctx, 'deco'); if (D()) ntDiamond(ctx, 88 * u, y, 22 * u, fg);
  G(ctx, 'tag'); if (has(d.tag)) ntLive(ctx, d.tag, W - 72 * u, y, 30 * u, pill, pillInk);
  else if (has(d.year)) line(ctx, ntClean(d.year), W - 72 * u, y, { size: 32 * u, color: fg, align: 'right', bold: 0.9, role: 'name' });
  G(ctx, 'year'); if (has(d.tag) && has(d.year)) line(ctx, ntClean(d.year), 124 * u, y, { size: 30 * u, color: fg, align: 'left', bold: 0.9, role: 'name' });
}
// عمود معلومة: دائرة فيها أيقونة، ثم سطر عريض، ثم سطر أو سطران عاديان
function ntInfoCol(ctx, ic, a, b, c, cx, y, s, o) {
  if (!has(a) && !has(b)) return;
  ctx.beginPath(); ctx.arc(cx, y, s * 0.78, 0, Math.PI * 2); ctx.fillStyle = o.disc; ctx.fill();
  icon(ctx, ic, cx, y, s * 0.92, o.icon);
  let yy = y + s * 1.85;
  if (has(a)) { line(ctx, ntClean(a), cx, yy, { size: s * 0.98, color: o.ink, align: 'center', bold: 0.9, role: 'name', maxW: o.w }); yy += s * 1.3; }
  [b, c].forEach(function (t) { if (has(t)) { line(ctx, ntClean(t), cx, yy, { size: s * 0.86, color: o.ink, align: 'center', role: 'body', maxW: o.w }); yy += s * 1.18; } });
}
// صف المعلومات الثلاث بترتيب ثابت: التاريخ ثم الوقت ثم المكان (من اليمين)
function ntInfoRow(ctx, d, x0, x1, y, s, o) {
  const cols = [['cal', d.day, d.d1, d.d2], ['clock', d.time, d.ampm, ''], ['pin', d.pl1, d.pl2, '']].filter(function (c) { return has(c[1]) || has(c[2]); });
  const n = cols.length; if (!n) return;
  const cw = (x1 - x0) / n;
  cols.forEach(function (c, i) { G(ctx, 'info' + i); ntInfoCol(ctx, c[0], c[1], c[2], c[3], x1 - cw * (i + 0.5), y, s, Object.assign({ w: cw * 0.94 }, o)); });
}
// حقول التاريخ والوقت والمكان المشتركة
const NT_WHEN = [
  { kind: 'date', label: 'التاريخ', map: { day: '{wd}', d1: '{hd} {hm}', d2: '{gd} {gm}' } },
  { k: 'day', label: 'اليوم', def: 'الثلاثاء', max: 24, half: 1 },
  { k: 'd1', label: 'التاريخ الهجري', def: '18 ربيع الثاني', max: 26, half: 1 },
  { k: 'd2', label: 'التاريخ الميلادي', def: '29 سبتمبر', max: 26, half: 1 },
  { k: 'time', label: 'الساعة', def: '9:00', max: 16, half: 1 },
  { k: 'ampm', label: 'تحت الساعة', def: 'مساءً', max: 24, half: 1 },
  { k: 'pl1', label: 'المكان', def: 'Google Meet', max: 22, half: 1 },
  { k: 'pl2', label: 'تحت المكان', def: 'الرابط في المجموعة', max: 26, half: 1 }
];

TEMPLATES.push(

/* ---------- ت١. تذكرة اللقاء ---------- */
{
  id: 'nt_ticket', type: 'ann', name: 'تذكرة اللقاء', tags: 'تذكرة لقاء مباشر محاضرة مقدم مرحلة ختم شبكة كحلي', isNew: 1, fonts: NT_FONTS,
  sizes: ['post', 'square', 'story', 'yt'],
  variants: [{ id: 'night', name: 'ليل وشبكة', sw: ['#2d4d24', '#f8f8f8', '#fbb03b'] }, { id: 'paper', name: 'ورق وشبكة', sw: ['#f8f8f8', '#2d4d24', '#fbb03b'] }],
  colorLabels: { bg: 'لون الخلفية', title: 'لون العنوان', accent: 'لون الرملي' },
  fields: [
    { k: 'tag', label: 'الكبسولة في الزاوية', def: 'لقاء مباشر', max: 22, half: 1 },
    { k: 'year', label: 'السنة', def: '1448هـ', max: 10, half: 1 },
    { k: 'title', label: 'العنوان', kind: 'area', def: 'كيف أنفّذ مشروعي الإصلاحي؟', max: 48 },
    { k: 'lbl', label: 'قبل الاسم', def: 'المقدّم:', max: 18, half: 1 },
    { k: 'who', label: 'المقدّم', def: 'أ. محمد شريف', max: 30, half: 1 },
    { k: 'stamp', label: 'الختم المائل', kind: 'area', def: 'المرحلة\nالمهارية', max: 24 }
  ].concat(NT_WHEN),
  draw: function (ctx, W, H, d, T, v, k) {
    const p = ntPal(T), C = p.C, u = W / 1080, wide = W > H * 1.3, tall = H > W * 1.5;
    const paper = v === 'paper';
    const base = OV.bg || (paper ? C.paper : p.night), dark = isDark(base);
    ntGround(ctx, W, H, base, { ink: C.ink, gy: H * 0.42 });
    const fg = dark ? '#ffffff' : C.pd;
    ntCorners(ctx, W, d, fg, p.live, '#ffffff', u, wide ? 64 * u : 80 * u);
    const topC = paper ? C.pd : p.cream, ttl = OV.title || (paper ? '#ffffff' : C.pd), lab = paper ? p.sand : p.sandInk, nameC = paper ? '#ffffff' : C.pd;
    // المقاسات: عرض مرغوب لكل مقاس، ثم يُصغَّر كل شيء معاً إن لم يتسع الارتفاع
    const avail = H - (wide ? 150 : 175) * u - (wide ? 150 : 200) * u;
    const lay = function (cw) {
      const q = cw / (600 * u), pad = cw * 0.1, tw = cw - pad * 2;
      const tf = fit(ctx, ntClean(d.title), { maxW: tw * 0.9, maxH: 200 * u * q, size: 62 * u * q * k, lh: 1.32, balance: true, bold: 0.4, title: true });
      const lblS = 42 * u * q, whoS = 50 * u * q;
      const topH = pad * 0.9 + 60 * u * q + tf.h + 36 * u * q + (has(d.lbl) ? lblS * 1.3 : 0) + (has(d.who) ? whoS * 1.35 : 0) + 30 * u * q + pad * 0.7;
      const botH = wide ? 0 : cw * 0.5;
      return { cw: cw, q: q, pad: pad, tw: tw, tf: tf, lblS: lblS, whoS: whoS, topH: topH, botH: botH, ch: topH + botH };
    };
    let L = lay(W * (wide ? 0.48 : tall ? 0.8 : H < W * 1.1 ? 0.6 : 0.64));
    if (L.ch > avail) L = lay(L.cw * avail / L.ch);
    if (L.ch > avail) L = lay(L.cw * avail / L.ch);
    const cw = L.cw, pad = L.pad, tw = L.tw, tf = L.tf, lblS = L.lblS, whoS = L.whoS, topH = L.topH, botH = L.botH, ch = L.ch, sz = L.q;
    const cx0 = (W - cw) / 2, top = (wide ? 150 : 175) * u + Math.max(0, (avail - ch) / 2);
    // التذكرة: الجزء العلوي والسفلي، بحواف مسنّنة وثقبين جانبيين عند خط القطع
    G(ctx, 'card');
    const br = cw * 0.016, nr = cw * 0.06;
    let holes = [].concat(ntBites(cw, 0, br * 1.6, 2.3), ntBites(cw, ch, br * 1.6, 2.3));
    if (botH) holes.push([0, topH, nr], [cw, topH, nr]);
    else holes.push([0, 0, nr * 1.5], [cw, 0, nr * 1.5], [0, ch, nr * 1.5], [cw, ch, nr * 1.5]);
    ntCut(ctx, cx0, top, cw, ch, function (g, w, h) {
      g.fillStyle = topC; g.fillRect(0, 0, w, topH);
      if (botH) { g.fillStyle = OV.accent || p.sand; g.fillRect(0, topH, w, h - topH); }
      if (!BGFX && D()) { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.45, paper ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.035)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
    }, holes, dark ? 'rgba(0,0,0,0.28)' : alpha(C.ink, 0.16));
    area(cx0, top, cx0 + cw, top + ch);
    // خطّا الزخرفة في الجزء العلوي، وخط القطع المتقطع
    if (D()) {
      hline(ctx, cx0 + pad, cx0 + cw - pad, top + pad * 0.9, lab, 3 * u);
      hline(ctx, cx0 + pad, cx0 + cw - pad, top + topH - pad * 0.7, lab, 3 * u);
      if (botH) { ctx.save(); ctx.setLineDash([22 * u, 12 * u]); hline(ctx, cx0 + nr * 1.25, cx0 + cw - nr * 1.25, top + topH + 4 * u, base, 7 * u); ctx.restore(); }
    }
    let y = top + pad * 0.9 + 60 * u * sz;
    G(ctx, 'title'); drawFit(ctx, tf, W / 2, y, { align: 'center', color: ttl }); y += tf.h + 36 * u * sz;
    G(ctx, 'who');
    if (has(d.lbl)) { line(ctx, ntClean(d.lbl), W / 2, y + lblS * 0.5, { size: lblS, color: lab, align: 'center', bold: 0.9, role: 'name' }); y += lblS * 1.3; }
    if (has(d.who)) line(ctx, ntClean(d.who), W / 2, y + whoS * 0.55, { size: whoS, color: nameC, align: 'center', bold: 0.9, role: 'name', maxW: tw * 0.86 });
    // الختم على حافة التذكرة اليمنى
    G(ctx, 'stamp'); if (has(d.stamp)) ntStamp(ctx, d.stamp, cx0 + cw - cw * 0.02, top + topH * (wide ? 0.62 : 0.58), cw * 0.26, cw * 0.17, -0.27, p.stamp, C.pd, u);
    // سهم السنبلة على الحافة اليسرى
    G(ctx, 'deco'); if (D()) ntWheat(ctx, cx0 - cw * 0.012, top + (botH ? topH + botH * 0.3 : ch * 0.6), cw * 0.07, botH ? (dark ? '#ffffff' : C.pd) : p.sand);
    // المعلومات في الجزء السفلي
    if (botH) ntInfoRow(ctx, d, cx0 + cw * 0.05, cx0 + cw * 0.95, top + topH + botH * 0.3, 30 * u * sz, { disc: p.cream, icon: p.sandInk, ink: C.pd });
    // الشعار أسفل الوسط
    G(ctx, 'logo'); const ly = top + ch + (H - top - ch) / 2;
    drawLogo(ctx, T, W / 2, ly, Math.min((wide ? 170 : 210) * u, (H - top - ch) * 1.1), dark ? '#ffffff' : 'color', 'c');
  }
},

/* ---------- ت٢. بطاقة الملف ---------- */
{
  id: 'nt_folder', type: 'ann', name: 'بطاقة الملف', tags: 'ملف مجلد لقاء محاضرة مقدم دورة صور إدارة', isNew: 1, fonts: NT_FONTS,
  sizes: ['post', 'square', 'story'],
  variants: [{ id: 'navy', name: 'كحلي', sw: ['#2d4d24', '#f8f8f8', '#fbb03b'] }, { id: 'paper', name: 'ورقي', sw: ['#f8f8f8', '#2d4d24', '#fbb03b'] }, { id: 'photos', name: 'ملف وصور', sw: ['#ebe7e1', '#467839', '#2d4d24'] }],
  colorLabels: { bg: 'لون الخلفية', title: 'لون العنوان', accent: 'لون الرملي' },
  fields: [
    { k: 'year', label: 'السنة', def: '1448هـ', max: 10, half: 1 },
    { k: 'tag', label: 'كبسولة في الزاوية (اختياري)', def: '', max: 22, half: 1 },
    { k: 'title', label: 'العنوان', kind: 'area', def: 'إدارة المشاريع', max: 40 },
    { k: 'sub', label: 'تحت العنوان', def: '', max: 60 },
    { k: 'lbl', label: 'قبل الاسم', def: 'المقدّم:', max: 18, half: 1 },
    { k: 'who', label: 'المقدّم', def: 'أ. عبدالله أشرف', max: 30, half: 1 },
    { k: 'p1', label: 'الصورة الأولى', kind: 'image', def: 'img_quran', only: ['photos'] },
    { k: 'p2', label: 'الصورة الثانية', kind: 'image', def: 'img_arch', only: ['photos'], optional: true },
    { k: 'p3', label: 'الصورة الثالثة', kind: 'image', def: 'img_mosque', only: ['photos'], optional: true }
  ].concat(NT_WHEN.map(function (f) { return f.k === 'time' ? Object.assign({}, f, { def: '8:30' }) : f.k === 'd1' ? Object.assign({}, f, { def: '26 ربيع الأول' }) : f.k === 'd2' ? Object.assign({}, f, { def: '' }) : f; })),
  draw: function (ctx, W, H, d, T, v, k, P) {
    const p = ntPal(T), C = p.C, u = W / 1080, sv = svOf(W, H), tall = H > W * 1.5;
    if (v === 'photos') return ntFolderPhotos(ctx, W, H, d, T, k, P, p);
    const paper = v === 'paper', base = OV.bg || (paper ? C.paper : p.night), dark = isDark(base);
    ntGround(ctx, W, H, base, { ink: C.ink, grid: paper, glow: paper });
    // دائرتان كبيرتان باهتتان خلف الملف
    if (D() && !BGFX) quiet(function () {
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.05)' : alpha(C.pd, 0.05);
      ctx.beginPath(); ctx.arc(-W * 0.42, H * 0.62, W * 0.95, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(W * 1.02, H * 1.02, W * 0.36, 0, Math.PI * 2); ctx.fill();
    });
    const fg = dark ? '#ffffff' : C.pd;
    ntCorners(ctx, W, d, fg, p.live, '#ffffff', u);
    const cardC = paper ? C.pd : '#f7f6f3', ttl = OV.title || (paper ? p.sand : p.sandInk), ink = paper ? '#ffffff' : C.pd, lab = paper ? p.sand : p.sandInk;
    // الملف: جزء خلفي رملي يميناً، وبطاقة أمامية بلسان مرتفع يساراً وتنزف من الحافة اليمنى
    const x0 = W * 0.27, x1 = W + 40 * u, cwid = W - x0, tabH = 64 * u * (tall ? 1.1 : 1), rad = 64 * u;
    const tf = fit(ctx, ntClean(d.title), { maxW: cwid * 0.8, maxH: 260 * sv, size: 118 * sv * k * (tall ? 1.12 : 1), lh: 1.15, balance: true, bold: 1, title: true, role: 'head' });
    const q = tall ? 1.18 : 1, lblS = 50 * sv * q, whoS = 60 * sv * q, infoS = 32 * sv * q;
    const inner = 70 * sv + tf.h + (has(d.sub) ? 60 * sv : 0) + 50 * sv + (has(d.lbl) ? lblS * 1.3 : 0) + (has(d.who) ? whoS * 1.4 : 0) + 70 * sv + infoS * 5.2 + 60 * sv;
    const ch = Math.max(inner, H * 0.46), y0 = Math.max(150 * u + tabH, (H - ch) / 2 + tabH * 0.2), yb = y0 + ch;
    G(ctx, 'card');
    // الجزء الخلفي (لسان رملي)
    ctx.fillStyle = OV.accent || p.sand; ctx.beginPath();
    const bx = x0 + cwid * 0.42;
    ctx.moveTo(bx - 70 * u, y0); ctx.bezierCurveTo(bx - 20 * u, y0, bx - 10 * u, y0 - tabH, bx + 50 * u, y0 - tabH); ctx.lineTo(x1, y0 - tabH); ctx.lineTo(x1, y0 + rad); ctx.lineTo(bx - 70 * u, y0 + rad); ctx.closePath(); ctx.fill();
    // البطاقة الأمامية
    ctx.save(); ctx.shadowColor = dark ? 'rgba(0,0,0,0.3)' : alpha(C.ink, 0.15); ctx.shadowBlur = 40 * u; ctx.shadowOffsetY = 14 * u;
    ctx.fillStyle = cardC; ctx.beginPath();
    const tx = x0 + cwid * 0.34;
    ctx.moveTo(x0, yb - rad); ctx.lineTo(x0, y0 - tabH + rad); ctx.quadraticCurveTo(x0, y0 - tabH, x0 + rad, y0 - tabH);
    ctx.lineTo(tx - 90 * u, y0 - tabH); ctx.bezierCurveTo(tx - 30 * u, y0 - tabH, tx - 20 * u, y0, tx + 50 * u, y0);
    ctx.lineTo(x1, y0); ctx.lineTo(x1, yb); ctx.lineTo(x0 + rad, yb); ctx.quadraticCurveTo(x0, yb, x0, yb - rad); ctx.closePath(); ctx.fill(); ctx.restore();
    area(x0, y0 - tabH, W, yb);
    G(ctx, 'deco'); if (D()) { const sx = x0 + 52 * u, sy = y0 - tabH + 54 * u; xmark(ctx, sx, sy, 50 * u, paper ? p.sand : C.pd, 0); }
    const cx = x0 + cwid / 2 - 10 * u;
    let y = y0 + 40 * sv;
    G(ctx, 'title'); drawFit(ctx, tf, cx, y, { align: 'center', color: ttl }); y += tf.h + 16 * sv;
    G(ctx, 'sub'); if (has(d.sub)) { line(ctx, ntClean(d.sub), cx, y + 22 * sv, { size: 34 * sv, color: ink, align: 'center', maxW: cwid * 0.8 }); y += 60 * sv; }
    y += 34 * sv;
    G(ctx, 'who');
    if (has(d.lbl)) { line(ctx, ntClean(d.lbl), cx, y + lblS * 0.5, { size: lblS, color: lab, align: 'center', bold: 0.9, role: 'name' }); y += lblS * 1.3; }
    if (has(d.who)) { line(ctx, ntClean(d.who), cx, y + whoS * 0.55, { size: whoS, color: ink, align: 'center', bold: 0.9, role: 'name', maxW: cwid * 0.8 }); y += whoS * 1.4; }
    const iy = Math.max(y + 70 * sv, yb - infoS * 5.2);
    ntInfoRow(ctx, d, x0 + cwid * 0.08, x0 + cwid * 0.92, iy, infoS, { disc: OV.accent || p.sand, icon: '#ffffff', ink: ink });
    G(ctx, 'logo'); drawLogo(ctx, T, 80 * u, H - 64 * u, 190 * u, dark ? '#ffffff' : 'color', 'bl');
  }
}
);

// نسخة «ملف وصور»: ملف ملوّن تخرج منه صور يضعها المربي، والمعلومات تحته على الورق
function ntFolderPhotos(ctx, W, H, d, T, k, P, p) {
  const C = p.C, u = W / 1080, sv = svOf(W, H), base = OV.bg || C.warm, dark = isDark(base);
  ntGround(ctx, W, H, base, { ink: C.ink, grid: false });
  const fg = dark ? '#ffffff' : C.pd;
  ntCorners(ctx, W, d, fg, p.live, '#ffffff', u);
  const tall = H > W * 1.5, fw = W * (tall ? 0.84 : 0.72), fx = (W - fw) / 2, infoH = 210 * sv, fh = Math.min(H * 0.4, fw * 0.62), tabH = 56 * u;
  const tot = fh * 1.62 + infoH + 70 * sv, fy = Math.max(fh * 0.62 + 130 * u, (H - tot) / 2 + fh * 0.62 + 30 * u);
  // الظهر الداكن ولسانه
  G(ctx, 'card');
  ctx.fillStyle = mixC(C.pd, '#000000', 0.25);
  rrect(ctx, fx, fy - fh * 0.5, fw, fh * 1.5, 34 * u); ctx.fill();
  fillRR(ctx, fx + fw * 0.06, fy - fh * 0.5 - tabH + 10 * u, fw * 0.34, tabH + 20 * u, 22 * u, mixC(C.pd, '#000000', 0.25));
  // الصور تخرج من الملف بزوايا مختلفة وإطار أبيض
  G(ctx, 'photo');
  const pics = [P.p1, P.p2, P.p3].filter(function (x) { return x && x.im; });
  const spots = [[0.3, -0.62, -0.12], [0.62, -0.7, 0.1], [0.47, -0.42, 0.03]];
  pics.forEach(function (ph, i) {
    const s = spots[i], pw = fw * 0.36, phh = pw * 0.78, cx = fx + fw * s[0], cy = fy + fh * s[1] + fh * 0.5;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(s[2]);
    ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 24 * u; ctx.shadowOffsetY = 8 * u;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-pw / 2, -phh / 2, pw, phh); ctx.shadowColor = 'transparent';
    const bw = 12 * u; drawPhoto(ctx, ph.im, -pw / 2 + bw, -phh / 2 + bw, pw - bw * 2, phh - bw * 2, { z: ph.z, ox: ph.ox, oy: ph.oy, fit: 'cover' });
    ctx.restore();
  });
  // الوجه الأمامي للملف بلسانه
  G(ctx, 'card');
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.22)'; ctx.shadowBlur = 30 * u; ctx.shadowOffsetY = -6 * u;
  ctx.fillStyle = C.p; ctx.beginPath();
  const r = 30 * u, tx = fx + fw * 0.62;
  ctx.moveTo(fx, fy + fh - r); ctx.lineTo(fx, fy + r); ctx.quadraticCurveTo(fx, fy, fx + r, fy);
  ctx.lineTo(tx - 60 * u, fy); ctx.bezierCurveTo(tx - 20 * u, fy, tx - 10 * u, fy - tabH * 0.9, tx + 40 * u, fy - tabH * 0.9);
  ctx.lineTo(fx + fw - r, fy - tabH * 0.9); ctx.quadraticCurveTo(fx + fw, fy - tabH * 0.9, fx + fw, fy - tabH * 0.9 + r);
  ctx.lineTo(fx + fw, fy + fh - r); ctx.quadraticCurveTo(fx + fw, fy + fh, fx + fw - r, fy + fh); ctx.lineTo(fx + r, fy + fh); ctx.quadraticCurveTo(fx, fy + fh, fx, fy + fh - r); ctx.closePath(); ctx.fill(); ctx.restore();
  area(fx, fy - fh * 0.5 - tabH, fx + fw, fy + fh);
  const cx = W / 2, tw = fw * 0.82, onF = onBg(C.p);
  const tf = fit(ctx, ntClean(d.title), { maxW: tw, maxH: fh * 0.42, size: 96 * sv * k, lh: 1.18, balance: true, bold: 1, title: true, role: 'head' });
  const blk = tf.h + (has(d.sub) ? 56 * sv : 0) + (has(d.who) ? 70 * sv : 0);
  let y = fy + (fh - blk) / 2;
  G(ctx, 'title'); drawFit(ctx, tf, cx, y, { align: 'center', color: OV.title || onF }); y += tf.h;
  G(ctx, 'sub'); if (has(d.sub)) { line(ctx, ntClean(d.sub), cx, y + 30 * sv, { size: 32 * sv, color: alpha(onF === '#ffffff' ? '#ffffff' : '#2b2b2b', 0.85), align: 'center', maxW: tw }); y += 56 * sv; }
  G(ctx, 'who'); if (has(d.who)) line(ctx, [ntClean(d.lbl), ntClean(d.who)].filter(has).join(' '), cx, y + 40 * sv, { size: 38 * sv, color: OV.accent || p.sand, align: 'center', bold: 0.9, role: 'name', maxW: tw });
  G(ctx, 'logo'); drawLogo(ctx, T, fx + fw - 40 * u, fy + fh - 34 * u, 150 * u, onF === '#ffffff' ? '#ffffff' : 'color', 'br');
  ntInfoRow(ctx, d, fx, fx + fw, fy + fh + 90 * sv, 30 * sv, { disc: C.p, icon: '#ffffff', ink: dark ? '#ffffff' : C.ink });
}
