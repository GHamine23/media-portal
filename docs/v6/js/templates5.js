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
  const ls = str.split('\n').slice(0, 2), fs = Math.min(h * (ls.length > 1 ? 0.27 : 0.4), (w - h * 0.3) / Math.max(3, Math.max.apply(null, ls.map(function (s) { return s.length; }))) * 2.3);
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

/* ================= المرحلة الثانية: الشارة الدائرية، وعنوان على ورق الخريطة، وشهادة التخرج ================= */

// نص على قوس، ويُسجَّل مستطيله ليُختار في المحرر. top: أعلى الدائرة، وإلا أسفلها
function ntArc(ctx, str, cx, cy, r, size, color, top, role, bold) {
  str = ntClean(str); if (!has(str)) return;
  const span = arcSpan(ctx, str, size, r, role, bold), h = Math.min(Math.PI * 0.95, span / 2);
  arcText(ctx, str, cx, cy, r, top ? -Math.PI / 2 : Math.PI / 2, size, color, !top, role, bold);
  const sx = r * Math.sin(h) + size, y0 = top ? cy - r - size * 0.8 : cy + r * Math.cos(h) - size * 0.8, y1 = top ? cy - r * Math.cos(h) + size * 0.8 : cy + r + size * 0.8;
  area(cx - sx, y0, cx + sx, y1);
}
// نثرات صغيرة حول المركز (روح الرسوم المطبوعة في التصاميم)، بنمط ثابت
function ntSpecks(ctx, cx, cy, r0, r1, color, n, seed, skipBottom) {
  const R = rng(seed || 5);
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    let a = R() * Math.PI * 2; if (skipBottom && Math.sin(a) > 0.35) a = -a;
    const rr = r0 + (r1 - r0) * Math.pow(R(), 0.8), x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a), s = (2 + R() * 7) * (r1 / 230);
    ctx.beginPath(); const k = 3 + Math.floor(R() * 3);
    for (let j = 0; j < k; j++) { const t = j / k * Math.PI * 2 + R(), q = s * (0.5 + R() * 0.7); ctx[j ? 'lineTo' : 'moveTo'](x + q * Math.cos(t), y + q * Math.sin(t) * (0.5 + R() * 0.5)); }
    ctx.closePath(); ctx.fill();
  }
}
// نجمة رباعية صغيرة بأطراف مقعّرة (زخرفة التصاميم)
function ntStar4(ctx, cx, cy, r, color) {
  ctx.save(); ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 - Math.PI / 2, b = a + Math.PI / 4; ctx[i ? 'lineTo' : 'moveTo'](cx + r * Math.cos(a), cy + r * Math.sin(a)); ctx.quadraticCurveTo(cx + r * 0.22 * Math.cos(b), cy + r * 0.22 * Math.sin(b), cx + r * Math.cos(a + Math.PI / 2), cy + r * Math.sin(a + Math.PI / 2)); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
// بوصلة باهتة: حلقات وتدريج ووردة ثمانية
function ntCompass(ctx, cx, cy, R, color, u) {
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color;
  [1, 0.9, 0.62].forEach(function (k, i) { ctx.lineWidth = (i ? 2 : 4) * u; ctx.beginPath(); ctx.arc(cx, cy, R * k, 0, Math.PI * 2); ctx.stroke(); });
  for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2, l = i % 9 === 0 ? 0.08 : 0.04; ctx.lineWidth = (i % 9 === 0 ? 3 : 1.5) * u; ctx.beginPath(); ctx.moveTo(cx + R * 0.9 * Math.cos(a), cy + R * 0.9 * Math.sin(a)); ctx.lineTo(cx + R * (0.9 - l) * Math.cos(a), cy + R * (0.9 - l) * Math.sin(a)); ctx.stroke(); }
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 - Math.PI / 2, L = i % 2 ? 0.5 : 0.82, w = i % 2 ? 0.07 : 0.1;
    [[1, 0.9], [-1, 0.45]].forEach(function (sd) {
      ctx.globalAlpha = sd[1]; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * L * Math.cos(a), cy + R * L * Math.sin(a)); ctx.lineTo(cx + R * w * Math.cos(a + sd[0] * Math.PI / 2), cy + R * w * Math.sin(a + sd[0] * Math.PI / 2)); ctx.closePath(); ctx.fill();
    });
  }
  ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(cx, cy, R * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// كرة بخطوط الطول والعرض
function ntGlobe(ctx, cx, cy, R, color, u) {
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
  ctx.strokeStyle = color; ctx.lineWidth = 2.2 * u;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  for (let i = 1; i < 6; i++) { const rx = R * Math.abs(Math.cos(i * Math.PI / 6)); ctx.beginPath(); ctx.ellipse(cx, cy, rx, R, 0, 0, Math.PI * 2); ctx.stroke(); }
  for (let i = -4; i <= 4; i++) { const y = cy + R * Math.sin(i * Math.PI / 10); ctx.beginPath(); ctx.moveTo(cx - R, y); ctx.lineTo(cx + R, y); ctx.stroke(); }
  ctx.restore();
}
const NT_ICONS = [['microphone-2', 'ميكروفون'], ['notebook', 'دفتر'], ['presentation', 'عرض'], ['book-2', 'مصحف'], ['bulb', 'فكرة'], ['pencil', 'قلم'], ['compass', 'بوصلة'], ['target', 'هدف'], ['users', 'فريق'], ['mountain', 'جبل'], ['trophy', 'كأس'], ['flag', 'راية']];

TEMPLATES.push(

/* ---------- ت٣. الشارة الدائرية ---------- */
{
  id: 'nt_emblem', type: 'cover', name: 'الشارة الدائرية', tags: 'شارة دائرة مرحلة مادة لقاء غلاف مقوس هالة شبكة أيقونة', isNew: 1, fonts: NT_FONTS,
  sizes: ['square', 'post', 'story'],
  variants: [{ id: 'night', name: 'ليل وهالة', sw: ['#2d4d24', '#f8f8f8', '#fbb03b'] }, { id: 'paper', name: 'ورق وشبكة', sw: ['#f8f8f8', '#2d4d24', '#fbb03b'] }],
  colorLabels: { bg: 'لون الخلفية', title: 'لون النص المقوّس', accent: 'لون الرملي' },
  fields: [
    { k: 'arcTop', label: 'السطر المقوّس العلوي', def: 'المرحلة المهارية', max: 30 },
    { k: 'arcBot', label: 'السطر المقوّس السفلي', def: 'لسان فصيح', max: 30 },
    { k: 'img', label: 'صورة الوسط (مفرّغة الخلفية أفضل)', kind: 'image', def: '', optional: true },
    { k: 'ic', label: 'أيقونة الوسط إن لم تضع صورة', kind: 'choice', def: 'microphone-2', options: NT_ICONS }
  ],
  draw: function (ctx, W, H, d, T, v, k, P) {
    const p = ntPal(T), C = p.C, S = Math.min(W, H), u = S / 1080, paper = v === 'paper';
    const base = OV.bg || (paper ? C.paper : p.night), dark = isDark(base);
    const cx = W / 2, cy = H / 2 - (H > W * 1.2 ? 30 * u : 0);
    ntGround(ctx, W, H, base, { ink: C.ink, gx: cx, gy: cy, gr: 0.32 * S / Math.max(W, H) });
    // الهالة: قرص فاتح بحافة ناعمة
    if (D() && !BGFX) quiet(function () {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 300 * u);
      g.addColorStop(0, dark ? 'rgba(255,255,255,0.13)' : alpha(C.pd, 0.07)); g.addColorStop(0.82, dark ? 'rgba(255,255,255,0.1)' : alpha(C.pd, 0.05)); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 300 * u, 0, Math.PI * 2); ctx.fill();
    });
    const txt = OV.title || (dark ? mixC(p.cream, OV.accent || p.sand, 0.25) : C.pd), sand = OV.accent || p.sand;
    G(ctx, 'arcTop'); ntArc(ctx, d.arcTop, cx, cy, 300 * u, 50 * u * k, txt, true, 'name', 0.9);
    G(ctx, 'arcBot'); ntArc(ctx, d.arcBot, cx, cy, 262 * u, 50 * u * k, txt, false, 'name', 0.9);
    G(ctx, 'deco'); if (D()) { ntStar4(ctx, cx - 278 * u, cy - 145 * u, 18 * u, alpha(sand, 0.85)); ntStar4(ctx, cx + 212 * u, cy + 68 * u, 16 * u, alpha(sand, 0.85)); }
    // الوسط: صورة المربي، وإلا قرص رملي فيه أيقونة
    G(ctx, 'emblem');
    const my = cy - 30 * u;
    if (D()) ntSpecks(ctx, cx, my, 120 * u, 200 * u, alpha(dark ? p.cream : C.pd, dark ? 0.8 : 0.55), 90, 7, true);
    if (P.img && P.img.im) {
      const s = 250 * u; drawPhoto(ctx, P.img.im, cx - s / 2, my - s / 2, s, s, { z: P.img.z, ox: P.img.ox, oy: P.img.oy, fit: 'contain' });
    } else {
      ctx.beginPath(); ctx.arc(cx, my, 118 * u, 0, Math.PI * 2); ctx.fillStyle = sand; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, my, 104 * u, 0, Math.PI * 2); ctx.strokeStyle = alpha(dark ? p.night : '#ffffff', 0.35); ctx.lineWidth = 3 * u; ctx.stroke();
      ctx.save(); ctx.translate(cx, my); drawTIcon(ctx, d.ic || 'microphone-2', 130 * u, dark ? p.night : C.pd, 1.6); ctx.restore();
    }
    area(cx - 125 * u, my - 125 * u, cx + 125 * u, my + 125 * u);
    G(ctx, 'deco'); if (D()) ntWheat(ctx, cx - 150 * u, my + 10 * u, 46 * u, dark ? p.cream : C.pd);
    G(ctx, 'logo'); drawLogo(ctx, T, cx + 6 * u, cy + 150 * u, 300 * u, dark ? '#ffffff' : 'color', 'c');
  }
},

/* ---------- ت٤. عنوان على ورق الخريطة ---------- */
{
  id: 'nt_mapcover', type: 'cover', name: 'عنوان على ورق الخريطة', tags: 'غلاف سلسلة عنوان خريطة بوصلة ورق أسئلة', isNew: 1, fonts: NT_FONTS,
  sizes: ['square', 'post', 'story', 'yt'],
  variants: [{ id: 'paper', name: 'ورق', sw: ['#f8f8f8', '#2d4d24', '#fbb03b'] }, { id: 'night', name: 'ليل', sw: ['#2d4d24', '#f8f8f8', '#fbb03b'] }],
  colorLabels: { bg: 'لون الورق', title: 'لون السطر الأول', accent: 'لون السطر الثاني' },
  fields: [
    { k: 'title', label: 'السطر الأول', def: 'الأسئلة التثويرية', max: 34 },
    { k: 'sub', label: 'السطر الثاني (بلون آخر)', def: 'لخارطة الثـغور', max: 34 },
    { k: 'note', label: 'سطر صغير تحتهما (اختياري)', def: '', max: 60 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const p = ntPal(T), C = p.C, wide = W > H * 1.3, S = Math.min(W, H), u = S / 1080, night = v === 'night';
    const base = OV.bg || (night ? p.night : mixC(C.paper, C.warm, 0.6)), dark = isDark(base);
    paintBg(ctx, W, H, base);
    const deco = dark ? alpha(p.cream, 0.16) : alpha(mixC(C.a, C.ink, 0.2), 0.28);
    if (D() && !BGFX) quiet(function () {
      // ورق: حبيبات خفيفة
      const R = rng(19); ctx.fillStyle = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.035)';
      for (let i = 0; i < 1400; i++) ctx.fillRect(R() * W, R() * H, 2.2 * u, 2.2 * u);
      ntGlobe(ctx, W - 40 * u, 60 * u, 300 * u, deco, u);
      ntCompass(ctx, 90 * u, H - 120 * u, 230 * u, deco, u);
    });
    const ttl = OV.title || (dark ? '#ffffff' : C.pd), sub = OV.accent || (dark ? p.sand : p.sandInk);
    const cw = wide ? W * 0.62 : W - 160 * u;
    const tf = fit(ctx, ntClean(d.title), { maxW: cw, maxLines: 2, size: 104 * u * k, lh: 1.3, balance: true, bold: 0.9, title: true });
    const sf = fit(ctx, ntClean(d.sub), { maxW: cw, maxLines: 2, size: 104 * u * k, lh: 1.3, balance: true, bold: 0.9, title: true });
    const lgW = 340 * u, lgH = lgW * 0.5, gap1 = 90 * u, nf = has(d.note) ? 70 * u : 0;
    const tot = lgH + gap1 + tf.h + sf.h + nf;
    let y = Math.max(70 * u, (H - tot) / 2 - 20 * u);
    G(ctx, 'logo'); const lg = drawLogo(ctx, T, W / 2, y, lgW, dark ? '#ffffff' : 'color', 'tc');
    y += Math.max(lgH, lg.h || 0) + gap1;
    G(ctx, 'title'); drawFit(ctx, tf, W / 2, y, { align: 'center', color: ttl }); y += tf.h;
    G(ctx, 'sub'); drawFit(ctx, sf, W / 2, y, { align: 'center', color: sub }); y += sf.h;
    G(ctx, 'note'); if (has(d.note)) line(ctx, ntClean(d.note), W / 2, y + 44 * u, { size: 36 * u, color: dark ? alpha('#ffffff', 0.8) : alpha(C.ink, 0.75), align: 'center', maxW: cw });
  }
},

/* ---------- ت٥. شهادة تخرج ---------- */
{
  id: 'nt_cert', type: 'thanks', name: 'شهادة تخرج', tags: 'شهادة تخرج مسار تدريبي دورة إنجاز طالب درجة تقدير ختم طباعة', isNew: 1, fonts: NT_FONTS,
  sizes: ['card'],
  variants: [{ id: 'band', name: 'الشعار في الشريط', sw: ['#2d4d24', '#f8f8f8', '#fbb03b'] }, { id: 'seal', name: 'الختم المسنّن', sw: ['#2d4d24', '#fbb03b', '#f8f8f8'] }],
  colorLabels: { bg: 'لون الشريط', title: 'لون العنوان', accent: 'لون الرملي' },
  fields: [
    { k: 'title', label: 'العنوان', kind: 'area', def: 'شهادة تخرّج\nمن مسار تدريبيّ', max: 40 },
    { k: 'issuer', label: 'السطر الأول', def: 'تشهد إدارة البرنامج بأنّ الطالب', max: 60 },
    { k: 'name', label: 'اسم الطالب', def: 'اسم الطالب', max: 40 },
    { k: 'body', label: 'نص الشهادة', kind: 'area', def: 'قد حضر دورة إعداد المواد وتحضير الدروس، وأنجز متطلباتها من حضور اللقاءات وعمل التكليفات وتقديم مشروع التخرج.', max: 220 },
    { k: 'grade', label: 'الدرجة والتقدير (ما بين *نجمتين* ملوّن)', def: 'وحصل في مجموع ذلك على درجة: *100* بتقدير: *ممتاز*', max: 90 },
    { k: 'closing', label: 'نص الختام', kind: 'area', def: 'وإننا في ختام هذه الدورة نذكّره بأن يستثمر ما تعلّمه في إحسان التحضير للدروس، وإيصال رسالة الحق للناس، وإحياء منهاج النبي ﷺ.', max: 240 },
    { k: 'signs', label: 'التاريخ والتوقيع', kind: 'toggle', def: true },
    { k: 'date', label: 'التاريخ', def: 'حُرّرت في: 1448/4/18هـ', max: 40, half: 1 },
    { k: 'signer', label: 'صاحب التوقيع', def: 'مدير البرنامج', max: 40, half: 1 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const p = ntPal(T), C = p.C, U = W / 1600, u = U * 1.48;
    const band = OV.bg || p.night, sand = OV.accent || p.sand, sandInk = OV.accent ? mixC(OV.accent, C.ink, 0.35) : p.sandInk;
    const by = H * 0.405, light = mixC('#ffffff', C.paper, 0.5);
    paintBg(ctx, W, H, band);
    if (D() && !BGFX) quiet(function () {
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.arc(-W * 0.05, -H * 0.55, W * 0.62, 0, Math.PI * 2); ctx.fill();
    });
    // الورقة الفاتحة بزاوية علوية مقوّسة
    G(ctx, 'panel');
    const r = 150 * U;
    ctx.fillStyle = light; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, by + r); ctx.quadraticCurveTo(0, by, r, by); ctx.lineTo(W, by); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    if (D() && !BGFX) quiet(function () {
      const g = ctx.createLinearGradient(W * 0.25, by, W * 0.55, H); g.addColorStop(0, 'rgba(0,0,0,0.05)'); g.addColorStop(0.5, 'rgba(255,255,255,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0.04)');
      ctx.save(); ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, by + r); ctx.quadraticCurveTo(0, by, r, by); ctx.lineTo(W, by); ctx.lineTo(W, H); ctx.closePath(); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(0, by, W, H - by); ctx.restore();
    });
    // العنوان
    const xr = W - 110 * U;
    const tf = fit(ctx, ntClean(d.title), { maxW: W * 0.5, maxH: by - 120 * U, size: 112 * U * k, lh: 1.15, bold: 0.85, title: true });
    G(ctx, 'title'); drawFit(ctx, tf, xr, (by - tf.h) / 2 - 8 * U, { align: 'right', color: OV.title || '#ffffff' });
    G(ctx, 'deco'); if (D()) xmark(ctx, xr - tf.w - 70 * U, (by - tf.h) / 2 + tf.h * 0.24, 80 * U, sand, 0.2);
    // الشعار: في الشريط، أو داخل ختم مسنّن على حدّ الورقة
    G(ctx, 'logo');
    if (v === 'seal') {
      const sx = W * 0.2, sy = by - 10 * U, R = 205 * U;
      if (D()) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 20 * U; ctx.fillStyle = sand; ctx.beginPath(); for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2, rr = i % 2 ? R * 0.93 : R; ctx[i ? 'lineTo' : 'moveTo'](sx + rr * Math.cos(a), sy + rr * Math.sin(a) * 0.62); } ctx.closePath(); ctx.fill(); ctx.restore(); }
      drawLogo(ctx, T, sx, sy, 300 * U, '#ffffff', 'c');
    } else drawLogo(ctx, T, W * 0.2, by / 2, 330 * U, '#ffffff', 'c');
    // النصوص
    const x0 = 120 * U, tw = xr - x0;
    let y = by + 100 * U;
    G(ctx, 'issuer'); if (has(d.issuer)) { line(ctx, ntClean(d.issuer), xr, y, { size: 37 * U, color: C.ink, align: 'right', bold: 0.85, role: 'name', maxW: tw }); y += 74 * U; }
    G(ctx, 'name'); if (has(d.name)) { line(ctx, ntClean(d.name), xr - tw * 0.18, y, { size: 58 * U, color: sandInk, align: 'right', bold: 1, title: true, role: 'head', maxW: tw * 0.8 }); y += 84 * U; }
    // حجم واحد للنصوص الثلاثة، يصغر معاً حتى تتسع فوق سطر التوقيع
    const foot = d.signs ? 175 * U : 50 * U, room = H - foot - y - 34 * U;
    let bs = 34 * U, bf, gf, cf;
    for (let i = 0; i < 14; i++) {
      bf = fit(ctx, ntClean(d.body), { maxW: tw, size: bs, min: bs, lh: 1.65, role: 'body' });
      gf = fit(ctx, ntClean(d.grade), { maxW: tw, size: bs, lh: 1.65, role: 'body', maxLines: 1 });
      cf = fit(ctx, ntClean(d.closing), { maxW: tw, size: bs, min: bs, lh: 1.65, role: 'body' });
      if (bf.h + gf.h + cf.h <= room || bs < 20 * U) break;
      bs *= 0.93;
    }
    G(ctx, 'body'); drawFit(ctx, bf, xr, y, { align: 'right', color: C.ink }); y += bf.h;
    G(ctx, 'grade'); if (has(d.grade)) { drawFit(ctx, gf, xr, y, { align: 'right', color: C.ink, hl: sandInk }); y += gf.h; }
    y += 34 * U;
    G(ctx, 'closing'); if (has(d.closing)) drawFit(ctx, cf, xr, y, { align: 'right', color: C.ink });
    if (d.signs) {
      G(ctx, 'signs');
      const fy = H - 78 * U;
      if (has(d.date)) line(ctx, ntClean(d.date), xr, fy, { size: 26 * U, color: alpha(C.ink, 0.75), align: 'right', role: 'body' });
      if (has(d.signer)) { line(ctx, ntClean(d.signer), x0 + 170 * U, fy - 44 * U, { size: 26 * U, color: alpha(C.ink, 0.75), align: 'center', role: 'body' }); hline(ctx, x0, x0 + 340 * U, fy + 10 * U, alpha(C.ink, 0.35), 2 * U); }
    }
  }
}
);

/* ================= المرحلة الثالثة: جدول الأسبوع، وبطاقات اللقاءات، وخط السير، وتوضيحات المادة ================= */

// سطور «أ | ب | ج» إلى مصفوفات، مع إبقاء عناوين المجموعات (# …)
function ntRows(str, max) {
  const out = []; String(str || '').split('\n').forEach(function (l) { l = l.trim(); if (!l) return; if (l[0] === '#') out.push({ head: ntClean(l.replace(/^#+\s*/, '')) }); else out.push({ c: l.split('|').map(function (x) { return ntClean(x.trim()); }) }); });
  return max ? out.slice(0, max) : out;
}
// رأس الجداول: عنوان كبير ممدود بخط العناوين، ثم سطر رملي بخط ونجمة
function ntSchedHead(ctx, W, d, y, u, k, o) {
  const tf = fit(ctx, ntClean(d.title), { maxW: W - 200 * u, maxH: 170 * u, size: 92 * u * k, lh: 1.2, balance: true, bold: 1, title: true, role: 'head' });
  G(ctx, 'title'); drawFit(ctx, tf, W / 2, y, { align: 'center', color: OV.title || o.fg }); y += tf.h + 6 * u;
  G(ctx, 'sub');
  if (has(d.sub)) {
    const f = line(ctx, ntClean(d.sub), W / 2 + 60 * u, y + 30 * u, { size: 44 * u, color: o.sub, align: 'center', bold: 1, role: 'head', maxW: W - 360 * u });
    if (D()) { hline(ctx, W / 2 + 60 * u - f.w / 2 - 30 * u, W / 2 + 60 * u - f.w / 2 - 210 * u, y + 32 * u, alpha(o.fg, 0.6), 3 * u); ntStar4(ctx, W / 2 + 60 * u - f.w / 2 - 250 * u, y + 32 * u, 26 * u, o.sub); }
    y += 76 * u;
  }
  return y;
}

TEMPLATES.push(

/* ---------- ت٦. جدول الأسبوع ---------- */
{
  id: 'nt_week', type: 'cover', name: 'جدول الأسبوع', tags: 'جدول أسبوع أيام لقاءات محاضرة ديوانية راحة مواد إثرائية اقتباس', isNew: 1, fonts: NT_FONTS,
  sizes: ['post', 'story'],
  variants: [{ id: 'night', name: 'كحلي', sw: ['#2d4d24', '#f8f8f8', '#fbb03b'] }, { id: 'paper', name: 'ورقي', sw: ['#f8f8f8', '#2d4d24', '#fbb03b'] }],
  colorLabels: { bg: 'لون الخلفية', title: 'لون العنوان', accent: 'لون الرملي' },
  fields: [
    { k: 'title', label: 'العنوان', def: 'جدول البرنامج', max: 30 },
    { k: 'rows', label: 'الأيام: اليوم | العنوان | الهجري | الميلادي | ختم (اختياري)؛ و# قبل اسم الأسبوع', kind: 'area', def: '# الأسبوع العاشر\nالسبت | محاضرة: مركزة المركزيات | 16 ربيع الأول | 29 أغسطس\nالأحد | سؤالات الإصلاح | 17 ربيع الأول | 30 أغسطس\nالاثنين | راحة واستدراك | 18 ربيع الأول | 31 أغسطس | مواد إثرائية\nالثلاثاء | راحة واستدراك | 19 ربيع الأول | 1 سبتمبر | مواد إثرائية\nالأربعاء | راحة واستدراك | 20 ربيع الأول | 2 سبتمبر | مواد إثرائية\nالخميس | راحة واستدراك | 21 ربيع الأول | 3 سبتمبر\nالجمعة | ديوانية | 22 ربيع الأول | 4 سبتمبر', max: 900, hint: 'حتى أربعة عشر يوماً؛ وتُقسَّم على عمودين' },
    { k: 'quote', label: 'اقتباس في آخر الجدول (اختياري)', kind: 'area', def: 'قال ابن القيم رحمه الله: «من أعظم الأشياء ضررًا على العبد بطالته وفراغه».', max: 140 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const p = ntPal(T), C = p.C, u = W / 1080, paper = v === 'paper';
    const base = OV.bg || (paper ? C.paper : p.night), dark = isDark(base), fg = dark ? '#ffffff' : C.pd;
    ntGround(ctx, W, H, base, { ink: C.ink, gy: H * 0.3 });
    let y = ntSchedHead(ctx, W, d, 80 * u, u, k, { fg: fg, sub: dark ? p.sand : p.sandInk });
    G(ctx, 'logo'); const lg = drawLogo(ctx, T, W / 2, y + 6 * u, 240 * u, dark ? '#ffffff' : 'color', 'tc'); y += Math.max(110 * u, lg.h || 0) + 40 * u;
    const rows = ntRows(d.rows, 18), foot = 70 * u;
    // الكتل: عنوان أسبوع ثم أيامه على عمودين (الأيمن أولاً)
    const blocks = []; rows.forEach(function (r) { if (r.head != null || !blocks.length) blocks.push({ head: r.head || '', items: [] }); if (r.c) blocks[blocks.length - 1].items.push(r.c); });
    const hasQ = has(d.quote);
    let nRowLines = 0; blocks.forEach(function (b, i) { const n = b.items.length + (hasQ && i === blocks.length - 1 ? 1 : 0); nRowLines += Math.ceil(n / 2); });
    const gap = 22 * u, headH = 84 * u, padB = 34 * u;
    const rh = Math.max(70 * u, Math.min((H > W * 1.5 ? 210 : 165) * u, (H - y - foot - blocks.length * (headH + padB) - nRowLines * gap) / Math.max(1, nRowLines)));
    const m = 70 * u, colW = (W - m * 2 - 30 * u) / 2, sand = OV.accent || p.sand, fz = Math.min(1.25, rh / (118 * u));
    // ما بقي من الارتفاع يوزَّع فوق الكتل وتحتها
    const used = blocks.reduce(function (a, b, i) { const n = b.items.length + (hasQ && i === blocks.length - 1 ? 1 : 0); return a + headH + Math.ceil(n / 2) * (rh + gap) + padB - gap + padB; }, 0);
    y += Math.max(0, (H - y - foot - used) / 2);
    let ri = 0;
    blocks.forEach(function (b, bi) {
      const items = b.items.slice(); if (hasQ && bi === blocks.length - 1) items.push(null);
      const nr = Math.ceil(items.length / 2), bh = headH + nr * (rh + gap) + padB - gap;
      // إطار الأسبوع
      G(ctx, 'head' + bi);
      const hw = has(b.head) ? textW(ctx, b.head, 46 * u, 1, true, 'head') : 0;
      if (D()) {
        ctx.save(); rrect(ctx, m - 20 * u, y + 30 * u, W - (m - 20 * u) * 2, bh - 30 * u, 36 * u); ctx.fillStyle = dark ? 'rgba(255,255,255,0.035)' : alpha(C.pd, 0.03); ctx.fill();
        // فتحة في الإطار خلف عنوان الأسبوع
        if (hw) { ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(W - m - 40 * u - hw - 22 * u, y, hw + 44 * u, 60 * u); ctx.clip('evenodd'); }
        rrect(ctx, m - 20 * u, y + 30 * u, W - (m - 20 * u) * 2, bh - 30 * u, 36 * u); ctx.strokeStyle = dark ? 'rgba(255,255,255,0.22)' : alpha(C.pd, 0.2); ctx.lineWidth = 2 * u; ctx.stroke(); ctx.restore();
      }
      if (hw) line(ctx, b.head, W - m - 40 * u, y + 30 * u, { size: 46 * u, color: dark ? p.sand : p.sandInk, align: 'right', bold: 1, title: true, role: 'head', maxW: W * 0.6 });
      const y0 = y + headH;
      items.forEach(function (it, i) {
        const col = i < nr ? 0 : 1, row = col ? i - nr : i, x1 = W - m - col * (colW + 30 * u), x0 = x1 - colW, yy = y0 + row * (rh + gap);
        G(ctx, 'row' + (ri++));
        if (it === null) {   // الاقتباس
          G(ctx, 'quote');
          ctx.save(); rrect(ctx, x0, yy, colW, rh, 18 * u); ctx.fillStyle = dark ? 'rgba(255,255,255,0.08)' : alpha(C.pd, 0.06); ctx.fill(); ctx.restore();
          const qf = fit(ctx, ntClean(d.quote), { maxW: colW - 50 * u, maxH: rh - 20 * u, size: 30 * u * fz, lh: 1.45, role: 'body', balance: true });
          drawFit(ctx, qf, x0 + colW / 2, yy + (rh - qf.h) / 2, { align: 'center', color: dark ? mixC(p.sand, '#ffffff', 0.35) : p.sandInk });
          return;
        }
        // اليوم (أفقي) ← العنوان على لون داكن ← التاريخان مع سهم
        const dayW = colW * 0.24, dateW = colW * 0.27, midW = colW - dayW - dateW;
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 14 * u; ctx.shadowOffsetY = 4 * u;
        fillRR(ctx, x0, yy, colW, rh, 16 * u, p.cream); ctx.restore();
        const g = ctx.createLinearGradient(x1 - dayW, 0, x0 + dateW, 0); g.addColorStop(0, C.pd); g.addColorStop(1, mixC(C.pd, C.p, 0.55));
        ctx.save(); rrect(ctx, x0 + dateW, yy, midW, rh, 16 * u); ctx.fillStyle = g; ctx.fill(); ctx.restore();
        ctx.fillStyle = mixC(C.pd, C.p, 0.55); ctx.beginPath(); ctx.moveTo(x0 + dateW + 1, yy + rh / 2 - 14 * u); ctx.lineTo(x0 + dateW - 16 * u, yy + rh / 2); ctx.lineTo(x0 + dateW + 1, yy + rh / 2 + 14 * u); ctx.closePath(); ctx.fill();
        line(ctx, it[0], x1 - dayW / 2, yy + rh / 2, { size: 30 * u * fz, color: C.pd, align: 'center', bold: 1, role: 'head', maxW: dayW - 16 * u });
        const tt = String(it[1] || '').replace(/^(محاضرة|درس|لقاء|سلسلة)\s*:\s*/, '*$1* '), tf = fit(ctx, tt, { maxW: midW - 34 * u, maxH: rh - 18 * u, size: 30 * u * fz, lh: 1.3, bold: 0.9, role: 'name', balance: true });
        drawFit(ctx, tf, x0 + dateW + midW / 2, yy + (rh - tf.h) / 2, { align: 'center', color: '#ffffff', hl: sand });
        const ds = [it[2], it[3]].filter(has);
        ds.forEach(function (t, j) { line(ctx, t, x0 + dateW / 2 + 4 * u, yy + rh / 2 + (j - (ds.length - 1) / 2) * 34 * u * fz, { size: 25 * u * fz, color: C.pd, align: 'center', bold: j ? 0.5 : 0.9, role: 'name', maxW: dateW - 26 * u }); });
        if (has(it[4])) { G(ctx, 'stamp'); ntStamp(ctx, it[4], x0 + dateW + midW * 0.26, yy + rh - 4 * u, Math.min(midW * 0.55, 190 * u * fz), 50 * u * fz, -0.08, sand, C.pd, u); }
      });
      y += bh + padB;
    });
    G(ctx, 'footer');
    if (D()) { quiet(function () { ctx.fillStyle = paper ? C.pd : p.cream; ctx.fillRect(0, H - 54 * u, W, 54 * u); }); ntStar4(ctx, 46 * u, H - 27 * u, 16 * u, paper ? p.cream : C.pd); }
  }
},

/* ---------- ت٧. بطاقات اللقاءات ---------- */
{
  id: 'nt_cards', type: 'cover', name: 'بطاقات اللقاءات', tags: 'جدول لقاءات بطاقات مقدم مرحلة مهارية عدد شبكة', isNew: 1, fonts: NT_FONTS,
  sizes: ['post', 'story'],
  variants: [{ id: 'night', name: 'كحلي بشبكة', sw: ['#2d4d24', '#f8f8f8', '#fbb03b'] }, { id: 'paper', name: 'ورقي', sw: ['#f8f8f8', '#2d4d24', '#fbb03b'] }],
  colorLabels: { bg: 'لون الخلفية', title: 'لون العنوان', accent: 'لون الرملي' },
  fields: [
    { k: 'title', label: 'العنوان', def: 'جدول البرنامج', max: 30 },
    { k: 'sub', label: 'تحت العنوان', def: 'لقاءات المرحلة المهارية', max: 40 },
    { k: 'lbl', label: 'قبل الاسم', def: 'المقدّم:', max: 18, half: 1 },
    { k: 'total', label: 'العدد الكلي (اختياري)', def: 'عدد اللقاءات: *21*', max: 30, half: 1 },
    { k: 'rows', label: 'اللقاءات: العنوان | المقدّم | ختم (اختياري)', kind: 'area', def: 'كيف تدرّب قلمك على الكتابة | أ. إسماعيل عرفة | مسار تدريبي\nأدوات قوقل | أ. محمد بخاري | لقاءان\nمفاتيح في إعداد الدروس والمواد | أ. محمد بادنجكي\nمهارات البيان للمصلحين المؤثرين | أ. سالم عقاد\nبناء ثقافة التعاون وتعزيز روح الفريق | أ. عبدالله أشرف\nكيف أختار ثغري؟ | أ. محمد عبدالوهاب', max: 600, hint: 'حتى ست بطاقات في الصفحة؛ أضف صفحة للباقي' }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const p = ntPal(T), C = p.C, u = W / 1080, paper = v === 'paper', tall = H > W * 1.5;
    const base = OV.bg || (paper ? C.paper : p.night), dark = isDark(base), fg = dark ? '#ffffff' : C.pd, sand = OV.accent || p.sand;
    ntGround(ctx, W, H, base, { ink: C.ink, gy: H * 0.4 });
    let y = ntSchedHead(ctx, W, d, (tall ? 140 : 80) * u, u, k, { fg: fg, sub: dark ? mixC(C.pl, '#ffffff', 0.45) : C.p });
    const rows = ntRows(d.rows, 6).filter(function (r) { return r.c; }), n = rows.length;
    const hasT = has(d.total), footH = 150 * u + (hasT ? 110 * u : 0);
    const m = 90 * u, gx = 70 * u, cw = (W - m * 2 - gx) / 2, nr = Math.ceil(n / 2), gy = 46 * u;
    const ch = Math.min(260 * u * (tall ? 1.25 : 1), (H - y - 40 * u - footH - (nr - 1) * gy) / Math.max(1, nr));
    y += 40 * u + Math.max(0, (H - y - 40 * u - footH - nr * ch - (nr - 1) * gy) / 2);
    rows.forEach(function (r, i) {
      const col = i % 2, row = Math.floor(i / 2), x1 = W - m - col * (cw + gx), x0 = x1 - cw, yy = y + row * (ch + gy), it = r.c;
      G(ctx, 'card' + i);
      const nr0 = ch * 0.17;
      ntCut(ctx, x0, yy, cw, ch, function (g, w, h) { g.fillStyle = p.cream; g.fillRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(0,0,0,0.05)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.04)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); },
        [[0, 0, nr0], [cw, 0, nr0], [0, ch, nr0], [cw, ch, nr0]], dark ? 'rgba(0,0,0,0.25)' : alpha(C.ink, 0.14));
      area(x0, yy, x1, yy + ch);
      const tw = cw * 0.78, cx = x0 + cw / 2;
      const tf = fit(ctx, it[0], { maxW: tw, maxH: ch * 0.42, size: 46 * u * (tall ? 1.15 : 1), lh: 1.25, balance: true, bold: 0.95, title: true });
      const ls = 30 * u * (tall ? 1.15 : 1), ns = 34 * u * (tall ? 1.15 : 1);
      const blk = tf.h + 20 * u + (has(d.lbl) ? ls * 1.3 : 0) + (has(it[1]) ? ns * 1.3 : 0);
      let ty = yy + (ch - blk) / 2;
      drawFit(ctx, tf, cx, ty, { align: 'center', color: C.pd }); ty += tf.h + 20 * u;
      if (has(d.lbl)) { line(ctx, ntClean(d.lbl), cx, ty + ls * 0.5, { size: ls, color: p.sandInk, align: 'center', bold: 0.9, role: 'name' }); ty += ls * 1.3; }
      if (has(it[1])) line(ctx, it[1], cx, ty + ns * 0.55, { size: ns, color: C.pd, align: 'center', bold: 0.9, role: 'name', maxW: tw });
      if (D()) ntWheat(ctx, x0 - 2 * u, yy + ch * 0.6, 40 * u, sand);
      if (has(it[2])) ntStamp(ctx, it[2], x0 + cw * 0.06, yy + ch * 0.56, cw * 0.27, ch * 0.21, -0.35, i % 2 ? sand : p.stamp, C.pd, u);
    });
    G(ctx, 'total');
    if (hasT) {
      const ty = H - footH + 30 * u, tw = Math.min(W * 0.5, textW(ctx, d.total.replace(/\*/g, ''), 46 * u, 1, true) + 140 * u);
      ntCut(ctx, (W - tw) / 2, ty, tw, 84 * u, function (g, w, h) { g.fillStyle = p.cream; g.fillRect(0, 0, w, h); }, [[0, 0, 14 * u], [tw, 0, 14 * u], [0, 84 * u, 14 * u], [tw, 84 * u, 14 * u]], 'rgba(0,0,0,0.2)');
      line(ctx, ntClean(d.total), W / 2, ty + 42 * u, { size: 42 * u, color: C.pd, align: 'center', bold: 0.95, title: true, hl: p.sandInk });
      if (D()) ntWheat(ctx, (W - tw) / 2 - 2 * u, ty + 42 * u, 30 * u, sand);
    }
    G(ctx, 'logo'); drawLogo(ctx, T, W / 2, H - 80 * u, 210 * u, dark ? '#ffffff' : 'color', 'c');
  }
},

/* ---------- ت٨. خط السير ---------- */
{
  id: 'nt_route', type: 'cover', name: 'خط السير', tags: 'خط سير رحلة طريق محطات مراحل سلاسل محاضرات خريطة', isNew: 1, fonts: NT_FONTS,
  sizes: ['post', 'story'],
  variants: [{ id: 'paper', name: 'ورقي', sw: ['#f8f8f8', '#2d4d24', '#fbb03b'] }, { id: 'night', name: 'كحلي', sw: ['#2d4d24', '#f8f8f8', '#fbb03b'] }],
  colorLabels: { bg: 'لون الخلفية', title: 'لون العنوان', accent: 'لون النوع' },
  fields: [
    { k: 'title', label: 'العنوان', kind: 'area', def: 'الرحلة إلى\nسدّ الثغور', max: 40 },
    { k: 'items', label: 'المحطات: النوع | العنوان (من أول الطريق)', kind: 'area', def: 'محاضرة | من أين يبدأ التغيير للأمة\nمحاضرة | من جيل الأمناء إلى جيل التجديد\nسلسلة | إحياء منهاج النبوة\nسلسلة | خارطة الثغور\nسلسلة | التجارب الإصلاحية\nمحاضرة | كيف أحافظ على حضور القلب وخشوعه\nمحاضرة | هل يمكن توحيد الصف الإسلامي\nسلسلة | زاد المصلحين\nسلسلة | تجربة تربية المصلحين', max: 600, hint: 'حتى عشر محطات' },
    { k: 'end', label: 'المحطة الأخيرة', def: 'المرحلة الثانية', max: 30 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const p = ntPal(T), C = p.C, u = W / 1080, night = v === 'night', tall = H > W * 1.5;
    const base = OV.bg || (night ? p.night : C.paper), dark = isDark(base), fg = dark ? '#ffffff' : C.pd, kind = OV.accent || (dark ? p.sand : p.sandInk), ink = dark ? alpha('#ffffff', 0.92) : mixC(C.pd, C.ink, 0.3);
    ntGround(ctx, W, H, base, { ink: C.ink, grid: false, gx: W * 0.2, gy: H * 0.1 });
    if (D() && !BGFX) quiet(function () { const R = rng(23); ctx.fillStyle = dark ? 'rgba(255,255,255,0.05)' : alpha(C.pd, 0.05); for (let i = 0; i < 900; i++) { const x = R() * W, y = R() * H * 0.5; ctx.beginPath(); ctx.arc(x, y, 2.2 * u, 0, Math.PI * 2); ctx.fill(); } });
    G(ctx, 'deco'); if (D()) ntStar4(ctx, W * 0.56, 150 * u, 100 * u, alpha(OV.accent || p.sand, 0.55));
    const tf = fit(ctx, ntClean(d.title), { maxW: W * 0.52, maxH: 260 * u, size: 116 * u * k, lh: 1.2, bold: 1, title: true, role: 'head' });
    G(ctx, 'title'); drawFit(ctx, tf, W * 0.46, 80 * u, { align: 'center', color: OV.title || fg });
    G(ctx, 'logo'); drawLogo(ctx, T, W - 80 * u, 90 * u, 170 * u, dark ? '#ffffff' : 'color', 'tr');
    // الطريق: صفوف متعرجة، محطتان في كل صف، ينعطف عند الحافتين بنصف دائرة
    const items = ntRows(d.items, 10).filter(function (r) { return r.c; }), n = items.length;
    const top = 80 * u + tf.h + 150 * u, endH = has(d.end) ? 200 * u : 60 * u, bot = H - endH;
    const R = Math.max(1, Math.ceil(n / 2)), rh = Math.min(220 * u * (tall ? 1.25 : 1), (bot - top) / R), rad = Math.min(rh / 2, 100 * u);
    const xl = 160 * u, xr = W - 160 * u, lineC = dark ? 'rgba(255,255,255,0.55)' : alpha(C.pd, 0.5), node = dark ? p.cream : mixC(C.pd, C.p, 0.3);
    const dash = function () { ctx.strokeStyle = lineC; ctx.lineWidth = 4 * u; ctx.setLineDash([2 * u, 11 * u]); ctx.lineCap = 'round'; };
    G(ctx, 'route');
    ctx.save(); dash(); ctx.beginPath(); ctx.moveTo(xr, top);
    for (let r = 0; r < R; r++) {
      const y = top + r * rh, toLeft = r % 2 === 0;
      ctx.lineTo(toLeft ? xl : xr, y);
      if (r < R - 1) ctx.arc(toLeft ? xl : xr, y + rh / 2, rh / 2, -Math.PI / 2, Math.PI / 2, toLeft);
    }
    const lastY = top + (R - 1) * rh, lastSide = (R - 1) % 2 === 0 ? xl : xr, ey = H - 110 * u;
    if (has(d.end)) { ctx.lineTo(lastSide, lastY); ctx.arc(lastSide, (lastY + ey) / 2, (ey - lastY) / 2, -Math.PI / 2, Math.PI / 2, lastSide === xl); ctx.lineTo(W / 2, ey); }
    ctx.stroke(); ctx.restore();
    area(xl - rh / 2, top - 10 * u, xr + rh / 2, lastY + 20 * u);
    // الدبوس في أول الطريق
    G(ctx, 'deco'); if (D()) { const py = top - 56 * u; ctx.save(); dash(); ctx.beginPath(); ctx.moveTo(xr, top); ctx.lineTo(xr, py + 30 * u); ctx.stroke(); ctx.restore(); ctx.beginPath(); ctx.arc(xr, py, 32 * u, 0, Math.PI * 2); ctx.fillStyle = OV.accent || p.sand; ctx.fill(); icon(ctx, 'pin', xr, py, 36 * u, dark ? p.night : '#ffffff'); }
    // المحطات وعناوينها فوقها
    const lw = (xr - xl) * 0.42, ts = 30 * u * (tall ? 1.12 : 1), ks = 27 * u * (tall ? 1.12 : 1);
    items.forEach(function (it, i) {
      const r = Math.floor(i / 2), j = i % 2, toLeft = r % 2 === 0, t = j ? 0.76 : 0.27, x = toLeft ? xr - t * (xr - xl) : xl + t * (xr - xl), y = top + r * rh;
      G(ctx, 'item' + i);
      ctx.beginPath(); ctx.arc(x, y, 18 * u, 0, Math.PI * 2); ctx.fillStyle = node; ctx.fill();
      const tt = fit(ctx, it.c[1] || '', { maxW: lw, maxLines: 2, size: ts, lh: 1.32, bold: 0.9, role: 'name', balance: true });
      const by = y - 34 * u - tt.h;
      drawFit(ctx, tt, x, by, { align: 'center', color: ink });
      if (has(it.c[0])) line(ctx, it.c[0], x, by - ks * 0.75, { size: ks, color: kind, align: 'center', bold: 0.9, role: 'name' });
    });
    // المحطة الأخيرة
    G(ctx, 'end');
    if (has(d.end)) {
      ctx.beginPath(); ctx.arc(W / 2, ey, 26 * u, 0, Math.PI * 2); ctx.fillStyle = node; ctx.fill();
      line(ctx, ntClean(d.end), W / 2, ey - 72 * u, { size: 40 * u, color: fg, align: 'center', bold: 1, title: true, role: 'head' });
      if (D()) { ctx.save(); dash(); ctx.beginPath(); ctx.moveTo(W / 2 - 40 * u, ey); ctx.lineTo(150 * u, ey); ctx.stroke(); ctx.restore(); ntStar4(ctx, 110 * u, ey, 34 * u, node); }
    }
  }
}
);

/* ---------- ت٩. توضيحات المادة (ورقة، وشريحة في العروض: sl_brief في slides.js) ---------- */
// قسم: السطر الأول عنوانه، و«## » عنوان فرعي، و«> » تمهيد، و«- » بند
function ntSecParse(str) {
  const L = String(str || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); if (!L.length) return null;
  // سطر أول طويل ليس عنواناً: يصير فقرة، ويبقى القسم بلا كبسولة
  const head = L[0].length <= 60 ? ntClean(L[0].replace(/^#+\s*/, '')) : '';
  return { head: head, lines: (head ? L.slice(1) : L).map(function (l) {
    if (/^##/.test(l)) return { t: 'h', s: ntClean(l.replace(/^#+\s*/, '')) };
    if (/^>/.test(l)) return { t: 'p', s: ntClean(l.replace(/^>\s*/, '')) };
    return { t: 'b', s: ntClean(l.replace(/^[-•·]\s*/, '')) };
  }) };
}
// يقيس قسماً أو يرسمه داخل صندوق عرضه w، ويعيد ارتفاعه
function ntSecBox(ctx, sec, x0, y, w, s, o, draw) {
  const pad = 30 * s, ph = 58 * s, inner = w - pad * 2, xr = x0 + w - pad;
  const items = [];
  let h = ph * 0.6 + 18 * s;
  sec.lines.forEach(function (l) {
    if (l.t === 'h') { if (items.length) h += 14 * s; items.push({ l: l, y: h }); h += 62 * s; return; }
    const f = fit(ctx, l.s, { maxW: l.t === 'b' ? inner - 34 * s : inner, size: (l.t === 'p' ? 27 : 26) * s, lh: 1.6, bold: l.t === 'p' ? 0.9 : 0, role: 'body' });
    items.push({ l: l, y: h, f: f }); h += f.h + 6 * s;
  });
  h += 24 * s;
  if (!draw) return h;
  // الصندوق وحده ثم كبسولة العنوان على حافته العليا
  ctx.save(); rrect(ctx, x0, y, w, h, 34 * s); ctx.fillStyle = o.box; ctx.fill(); ctx.strokeStyle = o.line; ctx.lineWidth = 2.5 * s; ctx.stroke(); ctx.restore();
  if (!has(sec.head)) { drawItems(); return h; }
  const hw = Math.min(w * 0.86, textW(ctx, sec.head, 32 * s, 1, true, 'head') + 140 * s);
  ntCut(ctx, xr + pad - hw - 10 * s, y - ph / 2, hw, ph, function (g, ww, hh) { g.fillStyle = o.pill; rrect(g, 0, 0, ww, hh, hh * 0.3); g.fill(); }, [], 'rgba(0,0,0,0.15)');
  ctx.beginPath(); ctx.arc(xr + pad - hw - 10 * s - 34 * s, y, 22 * s, 0, Math.PI * 2); ctx.strokeStyle = o.pill; ctx.lineWidth = 3 * s; ctx.stroke();
  icon(ctx, o.ic || 'star', xr + pad - hw - 10 * s - 34 * s, y, 22 * s, o.pill);
  line(ctx, sec.head, xr + pad - 10 * s - 34 * s, y, { size: 32 * s, color: o.pillInk, align: 'right', bold: 1, title: true, role: 'head', maxW: hw - 60 * s });
  drawItems();
  return h;
  function drawItems() { items.forEach(function (it) {
    const yy = y + it.y;
    if (it.l.t === 'h') { const ww = textW(ctx, it.l.s, 28 * s, 1, true, 'head') + 70 * s; fillRR(ctx, xr - ww, yy, ww, 46 * s, 23 * s, o.sub); line(ctx, it.l.s, xr - 35 * s, yy + 23 * s, { size: 28 * s, color: o.subInk, align: 'right', bold: 1, title: true, role: 'head' }); return; }
    const isB = it.l.t === 'b';
    if (isB) { const ty = yy + it.f.pt + it.f.size * it.f.lh / 2; ctx.fillStyle = o.bullet; ctx.beginPath(); ctx.moveTo(xr, ty - 8 * s); ctx.lineTo(xr - 14 * s, ty); ctx.lineTo(xr, ty + 8 * s); ctx.closePath(); ctx.fill(); }
    drawFit(ctx, it.f, isB ? xr - 30 * s : xr, yy, { align: 'right', color: o.ink, hl: o.hl });
  }); }
}
function ntBriefDraw(ctx, W, H, d, T, v, k, slide) {
  const p = ntPal(T), C = p.C, land = W > H, s = slide ? W / 1920 : land ? W / 1754 : W / 1240;
  const dark = v !== 'paper' && !OV.bg ? true : isDark(OV.bg || C.paper);
  if (v === 'paper' || (OV.bg && !isDark(OV.bg))) paintBg(ctx, W, H, OV.bg || '#ffffff');
  else {
    const g = ctx.createLinearGradient(W, 0, 0, H); g.addColorStop(0, OV.bg || mixC(C.p, C.pd, 0.25)); g.addColorStop(1, OV.bg || mixC(C.pd, '#000000', 0.2)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (D() && !BGFX) quiet(function () { xmark(ctx, W * 0.3, H * 0.6, Math.min(W, H) * 0.8, 'rgba(255,255,255,0.04)', 0.3); });
  }
  const fg = dark ? '#ffffff' : C.pd, sand = OV.accent || p.sand;
  const o = { box: dark ? 'rgba(255,255,255,0.93)' : mixC(C.paper, '#ffffff', 0.5), line: dark ? alpha(sand, 0.9) : alpha(C.pd, 0.25), pill: sand, pillInk: C.pd, sub: dark ? mixC(C.pl, '#ffffff', 0.6) : alpha(C.p, 0.14), subInk: C.pd, bullet: p.sandInk, ink: C.ink, hl: mixC(C.p, C.ink, 0.15) };
  const m = 80 * s, xr = W - m;
  let y = 70 * s;
  G(ctx, 'kicker'); if (has(d.kicker)) { line(ctx, ntClean(d.kicker), xr, y + 24 * s, { size: 34 * s, color: dark ? alpha('#ffffff', 0.9) : C.ink, align: 'right', role: 'body' }); y += 60 * s; }
  const tt = has(d.title) ? '«' + ntClean(d.title).replace(/^[«"'']+|[»"'']+$/g, '') + '»' : '';
  const tf = fit(ctx, tt, { maxW: W - m * 2 - 260 * s, maxH: 180 * s, size: 96 * s * k, lh: 1.2, bold: 1, title: true, role: 'head', maxLines: 1 });
  G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: OV.title || (dark ? sand : C.pd) }); y += tf.h + 70 * s;
  G(ctx, 'logo'); drawLogo(ctx, T, m, 60 * s, 200 * s, dark ? '#ffffff' : 'color', 'tl');
  const secs = [d.s1, d.s2, d.s3, d.s4].map(ntSecParse).filter(Boolean), ics = ['star', 'book', 'ring', 'link'];
  const cols = land ? 2 : 1, gapX = 50 * s, cw = (W - m * 2 - gapX * (cols - 1)) / cols;
  // حجم النص: أكبر ما يتسع (الشرائح تُقرأ من بعيد فتبدأ أكبر)
  const plan = function (f) { const cy = [0, 0], at = []; secs.forEach(function (sec) { const h = ntSecBox(ctx, sec, 0, 0, cw, s * f, o, false); const c = cols === 1 ? 0 : (cy[0] <= cy[1] ? 0 : 1); at.push([c, cy[c]]); cy[c] += h + 80 * s * f; }); return { at: at, h: Math.max(cy[0], cy[1]) }; };
  let f = slide ? 2 : 1.45, P = plan(f);
  for (let i = 0; i < 12 && P.h > H - y - 30 * s; i++) { f *= 0.93; P = plan(f); }
  secs.forEach(function (sec, i) {
    const c = P.at[i][0], x0 = W - m - cw - c * (cw + gapX);
    G(ctx, 'sec' + i); ntSecBox(ctx, sec, x0, y + P.at[i][1] + 30 * s * f, cw, s * f, Object.assign({ ic: ics[i] }, o), true);
  });
}

TEMPLATES.push({
  id: 'nt_brief', type: 'study', name: 'توضيحات المادة', tags: 'توضيحات مادة مقاصد مطلوب واجب مستحب خلاصة توجيهات طالب', isNew: 1, fonts: NT_FONTS,
  sizes: ['a4', 'card', 'post'],
  variants: [{ id: 'tint', name: 'ملوّن', sw: ['#467839', '#ffffff', '#fbb03b'] }, { id: 'paper', name: 'أبيض', sw: ['#ffffff', '#2d4d24', '#fbb03b'] }],
  colorLabels: { bg: 'لون الخلفية', title: 'لون اسم المادة', accent: 'لون الكبسولات' },
  fields: [
    { k: 'kicker', label: 'السطر الأول', def: 'توضيحات متعلقة بمادة:', max: 50 },
    { k: 'title', label: 'اسم المادة', def: 'مركزيات الإصلاح', max: 40 },
    { k: 's1', label: 'القسم الأول (السطر الأول عنوانه، و- قبل كل بند)', kind: 'area', def: 'مقاصد تقرير هذه المادة\n- ضبط بوصلة الإصلاح، وبيان أهم مركزياته.\n- معرفة أهم الأدلة والشواهد على مركزيات الإصلاح.\n- تعزيز اليقين بكفاية الوحي في الجانب الإصلاحي.\n- تكوين الثقافة المعيارية التي تجمع المصلحين على اختلاف مجالاتهم.', max: 700 },
    { k: 's2', label: 'القسم الثاني (## عنوان فرعي، و> تمهيد)', kind: 'area', def: 'المطلوب من الطالب تجاه المادة\n## قسم واجب\n> لا يُسمح بالتنازل عنه، ويدخل تحته:\n- *متابعة* المادة بتركيز.\n- *تدوين* أهم الفوائد والشواهد والأدلة.\n- *استخراج* تطبيقات عملية.\n## قسم مستحب\n> يزيد به الطالب على المطلوب منه، ويدخل تحته:\n- *تشجير* المادة.\n- *استخراج* أهم الاقتباسات والفوائد ونشرها.', max: 900 },
    { k: 's3', label: 'القسم الثالث', kind: 'area', def: 'نخرج مما سبق بأمور\n- أن المقصود الأكبر هو الاطلاع على المادة بتركيز والتفاعل معها.\n- أن تدوين أهم الفوائد أمر أساسي لا يُستغنى عنه.\n- أن الوحي هو المرجع ومصدر الاستمداد الأول.', max: 700 },
    { k: 's4', label: 'القسم الرابع (اختياري)', kind: 'area', def: '', max: 700 }
  ],
  draw: function (ctx, W, H, d, T, v, k) { ntBriefDraw(ctx, W, H, d, T, v, k, false); }
});
