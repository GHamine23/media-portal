/* ================= المواد التعليمية والطباعة =================
   نوع جديد «مواد تعليمية» (study): خريطة مفاهيم، ملخص دراسي، ورقة عمل، بطاقات مراجعة، إنفوجرافيك،
   ومع الأغلفة والجداول: جدول أسبوعي، ومع التهنئة: شهادة إنجاز، وكتيّب متعدد الصفحات (غلاف + صفحة مادة).
   مقاس A4 الطولي (a4) للطباعة؛ وA4 الأفقي هو «card». كل الألوان من الهوية، فتعمل بأي برنامج. */

SIZES.a4 = { w: 1240, h: 1754, name: 'A4 طولي', hint: 'طباعة' };
TYPES.push({ id: 'study', name: 'مواد تعليمية', desc: 'خرائط مفاهيم، ملخصات، أوراق عمل، بطاقات مراجعة، كتيّبات' });

/* ---------- أدوات مشتركة ---------- */
// وحدة القياس: صفحة A4 الطولية = 1، وما سواها بالنسبة لها
function stU(W, H) { return W > H ? Math.min(W / 1754, H / 1240) : Math.min(W / 1240, H / 1754); }
function stPal(C) { return [C.p, C.s, C.a, C.pl, C.sd, C.a2, C.pd, C.teal]; }
// لون نص مقروء على لون مُعيّن
function stOn(c, C) { return isDark(c) ? '#ffffff' : (C.ink || '#2b2b2b'); }
// أرضية الورقة: ورق فاتح، وحافة خفيفة، ونقاط شبكة اختيارية
function stPaper(ctx, W, H, C, o) {
  o = o || {};
  const base = OV.bg || o.base || '#ffffff';
  paintBg(ctx, W, H, base);
  if (!BGFX && !OV.bg && D() && o.dots) {
    const s = stU(W, H), g = 34 * s; ctx.save(); ctx.fillStyle = alpha(C.p, 0.09);
    for (let y = g; y < H; y += g) for (let x = g; x < W; x += g) { ctx.beginPath(); ctx.arc(x, y, 1.6 * s, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  return base;
}
// رأس الصفحة: الشعار يميناً، وتسمية الوثيقة يساراً، وخط بلون التمييز تحتهما
function stHead(ctx, W, H, T, label, o) {
  o = o || {};
  const C = T.c, s = stU(W, H), m = (o.m || 70) * s, y = (o.y || 56) * s, base = o.base || '#ffffff', dark = isDark(base);
  G(ctx, 'logo'); const lg = drawLogo(ctx, T, W - m, y, (o.lw || 170) * s, dark ? '#ffffff' : 'color', 'tr');
  const hh = Math.max(lg.h || 0, 60 * s);
  G(ctx, 'label'); if (has(label)) line(ctx, label, m, y + hh / 2, { size: 24 * s, color: dark ? alpha('#ffffff', 0.7) : C.muted, align: 'left', maxW: W * 0.4 });
  G(ctx, 'deco'); if (D() && o.rule !== false) { const ry = y + hh + 22 * s; hline(ctx, m, W - m, ry, alpha(dark ? '#ffffff' : C.p, 0.14), 2 * s); fillRR(ctx, W - m - 120 * s, ry - 2.5 * s, 120 * s, 5 * s, 3 * s, C.a); }
  return y + hh + 46 * s;
}
// تذييل: رقم الصفحة في الوسط، وحسابات التواصل يساراً، وسطر يميناً
function stFoot(ctx, W, H, T, d, o) {
  o = o || {};
  const C = T.c, s = stU(W, H), m = (o.m || 70) * s, y = H - (o.h || 54) * s, dark = isDark(o.base || '#ffffff'), mut = dark ? alpha('#ffffff', 0.6) : C.muted;
  G(ctx, 'footer');
  if (D() && o.rule !== false) hline(ctx, m, W - m, y - 30 * s, alpha(dark ? '#ffffff' : C.p, 0.1), 1.5 * s);
  if (has(o.text)) line(ctx, o.text, W - m, y, { size: 20 * s, color: mut, align: 'right', maxW: W * 0.4 });
  if (has(d.__n)) { const n = String(d.__n); const w = Math.max(44 * s, textW(ctx, n, 22 * s, 0.8) + 30 * s); fillRR(ctx, W / 2 - w / 2, y - 20 * s, w, 40 * s, 20 * s, alpha(C.p, dark ? 0.5 : 0.1)); line(ctx, n, W / 2, y, { size: 22 * s, color: dark ? '#ffffff' : C.p, align: 'center', bold: 0.8 }); }
  if (o.social !== false) social(ctx, mut, m, y - 14 * s, 110 * s, 'tl');
}
// يجد أكبر معامل تكبير (بين lo و1) تتسع به كتلة المحتوى في الارتفاع المتاح
function stScale(measure, avail, lo, hi) {
  hi = hi || 1;
  if (measure(hi) <= avail) return hi;
  let a = lo || 0.45, b = hi;
  for (let i = 0; i < 12; i++) { const m = (a + b) / 2; if (measure(m) <= avail) a = m; else b = m; }
  return a;
}
// رقم داخل دائرة
function stNum(ctx, n, cx, cy, r, fill, color) {
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
  line(ctx, String(n), cx, cy + r * 0.04, { size: r * 1.05, color: color || '#ffffff', align: 'center', bold: 1 });
}
// خط منقّط أفقي للكتابة باليد
function stDots(ctx, x0, x1, y, color, s) { ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2 * s; ctx.setLineDash([2 * s, 7 * s]); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.restore(); }
// مقص صغير لخطوط القص
function stScissors(ctx, x, y, s, color) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.lineWidth = 2 * s; ctx.lineCap = 'round';
  [[-1, 1], [-1, -1]].forEach(function (q) { ctx.beginPath(); ctx.arc(-8 * s, q[1] * 6 * s, 5 * s, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-4 * s, q[1] * 4 * s); ctx.lineTo(12 * s, -q[1] * 5 * s); ctx.stroke(); });
  ctx.restore();
}
// نجمة ثمانية للزخرفة
function stStar8(ctx, cx, cy, r, color, stroke) {
  ctx.save(); ctx.beginPath();
  for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 - Math.PI / 2, rr = i % 2 ? r * 0.7 : r; const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
  ctx.closePath(); if (stroke) { ctx.strokeStyle = color; ctx.lineWidth = stroke; ctx.stroke(); } else { ctx.fillStyle = color; ctx.fill(); }
  ctx.restore();
}
// تحويل سطر «أ | ب | ج» إلى أجزاء
function stParts(r) { return String(r || '').split('|').map(function (x) { return x.trim(); }); }

TEMPLATES.push(

/* ---------- م١. خريطة مفاهيم ---------- */
{
  id: 'st_map', type: 'study', name: 'خريطة مفاهيم', tags: 'خريطة مفاهيم ذهنية فروع مفهوم مركزي تلخيص درس مراجعة', isNew: 1,
  sizes: ['card', 'a4', 'post', 'square'],
  variants: [{ id: 'light', name: 'بطاقات بيضاء', sw: ['#f7f6f2', '#2b2b2b', '#467839'] }, { id: 'color', name: 'بطاقات ملوّنة', sw: ['#ffffff', '#ffffff', '#467839'] }, { id: 'dark', name: 'لوح داكن', sw: ['#1f2a44', '#ffffff', '#fbb03b'] }],
  colorLabels: { bg: 'لون اللوح', title: 'لون العنوان', accent: 'لون المفهوم المركزي' },
  fields: [
    { k: 'title', label: 'عنوان الخريطة', def: 'أركان الإيمان', max: 50 },
    { k: 'sub', label: 'تحت العنوان', def: 'خريطة مفاهيم للمراجعة · الدرس الثالث', max: 70 },
    { k: 'center', label: 'المفهوم المركزي', kind: 'area', def: 'الإيمان', max: 30 },
    { k: 'branches', label: 'الفروع: الفرع | نقطة؛ نقطة؛ نقطة', kind: 'area', def: 'الإيمان بالله | ربوبيته؛ ألوهيته؛ أسماؤه وصفاته\nالإيمان بالملائكة | خلقهم من نور؛ أعمالهم\nالإيمان بالكتب | القرآن مهيمن عليها؛ التوراة والإنجيل\nالإيمان بالرسل | أولو العزم؛ خاتمهم محمد ﷺ\nاليوم الآخر | البعث؛ الحساب؛ الجنة والنار\nالقدر خيره وشره | العلم؛ الكتابة؛ المشيئة؛ الخلق', max: 900, hint: 'حتى ثمانية فروع. افصل النقاط بالفاصلة المنقوطة ؛' },
    { k: 'note', label: 'سطر في الأسفل', def: '', max: 70 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, s = stU(W, H), land = W > H * 1.15, dark = v === 'dark';
    const base = stPaper(ctx, W, H, C, { base: dark ? lighten(C.teal, -0.15) : '#f8f7f3', dots: true });
    const isD = isDark(base), fg = isD ? '#ffffff' : C.ink, pal = stPal(C);
    let y = stHead(ctx, W, H, T, '', { base: base, lw: land ? 150 : 170, rule: false });
    y -= 40 * s;
    const tf = fit(ctx, d.title, { maxW: W * 0.62, size: 64 * s * k, maxLines: 1, bold: 1, title: true, lh: 1.25 });
    G(ctx, 'title'); drawFit(ctx, tf, W - 70 * s, y - tf.h * 0.1, { align: 'right', color: OV.title || (isD ? '#ffffff' : C.pd) }); y += tf.h;
    G(ctx, 'sub'); if (has(d.sub)) { line(ctx, d.sub, W - 70 * s, y + 18 * s, { size: 28 * s, color: isD ? alpha('#ffffff', 0.7) : C.muted, align: 'right', maxW: W * 0.7 }); y += 46 * s; }
    const top = y + 30 * s, bot = H - (has(d.note) ? 110 : 70) * s;
    const br = lines(d.branches).slice(0, 8).map(function (r) { const p = r.split('|'); return { t: p[0].trim(), pts: (p[1] || '').split(/[؛;]/).map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 5) }; });
    const n = Math.max(1, br.length), cardW = land ? Math.min(W * 0.22, 380 * s) : (W - 160 * s - 100 * s) / 2;
    const ac = OV.accent || C.p;
    // قياس بطاقة فرع: عنوان ونقاط
    const cardH = function (b, sc) { const tf2 = fit(ctx, b.t, { maxW: cardW - 50 * s, size: 32 * s * sc, maxLines: 2, bold: 1, title: true, lh: 1.2 }); let h = 26 * s + tf2.h + 14 * s; b.pts.forEach(function (p) { const pf = fit(ctx, p, { maxW: cardW - 70 * s, size: 25 * s * sc, maxLines: 2, lh: 1.3 }); h += pf.h + 6 * s; }); return h + 20 * s; };
    const drawCard = function (b, i, x, yy, sc, h) {
      G(ctx, 'br' + i);   // كل فرع عنصر مستقل
      const col = pal[i % pal.length], filled = v === 'color';
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.10)'; ctx.shadowBlur = 24 * s; ctx.shadowOffsetY = 8 * s;
      fillRR(ctx, x, yy, cardW, h, 22 * s, filled ? col : (isD ? 'rgba(255,255,255,0.08)' : '#ffffff')); ctx.restore();
      if (!filled) { fillRR(ctx, x + cardW - 10 * s, yy + 18 * s, 6 * s, h - 36 * s, 3 * s, col); if (isD) { rrect(ctx, x, yy, cardW, h, 22 * s); ctx.strokeStyle = alpha(col, 0.6); ctx.lineWidth = 2 * s; ctx.stroke(); } }
      area(x, yy, x + cardW, yy + h);
      const tc = filled ? stOn(col, C) : (isD ? '#ffffff' : lighten(col, lum(col) > 0.3 ? -0.5 : -0.25)), pc = filled ? alpha(stOn(col, C), 0.9) : fg;
      const tf2 = fit(ctx, b.t, { maxW: cardW - 50 * s, size: 32 * s * sc, maxLines: 2, bold: 1, title: true, lh: 1.2 });
      let ty = yy + 26 * s; drawFit(ctx, tf2, x + cardW - 30 * s, ty, { align: 'right', color: tc }); ty += tf2.h + 14 * s;
      b.pts.forEach(function (p) { const pf = fit(ctx, p, { maxW: cardW - 70 * s, size: 25 * s * sc, maxLines: 2, lh: 1.3 }); ctx.beginPath(); ctx.arc(x + cardW - 36 * s, ty + pf.pt + pf.size * pf.lh / 2, 5 * s, 0, Math.PI * 2); ctx.fillStyle = filled ? alpha(stOn(col, C), 0.7) : col; ctx.fill(); drawFit(ctx, pf, x + cardW - 52 * s, ty, { align: 'right', color: pc }); ty += pf.h + 6 * s; });
    };
    const conn = function (x0, y0, x1, y1, col, vert) {
      G(ctx, 'links'); ctx.save(); ctx.strokeStyle = alpha(col, 0.75); ctx.lineWidth = 4 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0);
      if (vert) ctx.bezierCurveTo(x0, (y0 + y1) / 2, x1, (y0 + y1) / 2, x1, y1); else ctx.bezierCurveTo((x0 + x1) / 2, y0, (x0 + x1) / 2, y1, x1, y1);
      ctx.stroke(); ctx.beginPath(); ctx.arc(x1, y1, 7 * s, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.restore();
    };
    const cf = fit(ctx, d.center, { maxW: (land ? 300 : 420) * s, size: 54 * s * k, maxLines: 2, bold: 1, title: true, lh: 1.2, balance: true });
    const cw = Math.max(cf.w + 90 * s, 240 * s), ch = cf.h + 60 * s;
    G(ctx, 'branches');
    if (land) {
      // شعاعي: المفهوم في الوسط، والفروع موزّعة على عمودين يميناً ويساراً
      const cx = W / 2, cy = (top + bot) / 2;
      const right = br.filter(function (_, i) { return i % 2 === 0; }), left = br.filter(function (_, i) { return i % 2 === 1; });
      const colH = function (arr, sc) { return arr.reduce(function (a, b) { return a + cardH(b, sc) + 24 * s; }, -24 * s); };
      const sc = stScale(function (q) { return Math.max(colH(right, q), colH(left, q)); }, bot - top, 0.5, 1.25);
      [[right, W - 70 * s - cardW, 0], [left, 70 * s, 1]].forEach(function (side) {
        const arr = side[0], x = side[1], tot = colH(arr, sc); let yy = cy - tot / 2;
        arr.forEach(function (b) { const i = br.indexOf(b), h = cardH(b, sc), col = pal[i % pal.length];
          const ex = side[2] ? x + cardW : x, sx = side[2] ? cx - cw / 2 : cx + cw / 2;
          conn(sx, cy, ex, yy + h / 2, col, false); drawCard(b, i, x, yy, sc, h); yy += h + 24 * s; });
      });
      G(ctx, 'center'); ctx.save(); ctx.shadowColor = alpha(ac, 0.45); ctx.shadowBlur = 40 * s; ctx.shadowOffsetY = 10 * s; fillRR(ctx, cx - cw / 2, cy - ch / 2, cw, ch, ch / 2, ac); ctx.restore();
      if (D()) { rrect(ctx, cx - cw / 2 - 10 * s, cy - ch / 2 - 10 * s, cw + 20 * s, ch + 20 * s, ch / 2 + 10 * s); ctx.strokeStyle = alpha(ac, 0.35); ctx.lineWidth = 3 * s; ctx.stroke(); }
      area(cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2); drawFit(ctx, cf, cx, cy - cf.h / 2, { align: 'center', color: stOn(ac, C) });
    } else {
      // شجري: المفهوم في الأعلى، والفروع في عمودين تحته
      const cx = W / 2, cy = top + ch / 2;
      G(ctx, 'center'); ctx.save(); ctx.shadowColor = alpha(ac, 0.45); ctx.shadowBlur = 40 * s; ctx.shadowOffsetY = 10 * s; fillRR(ctx, cx - cw / 2, top, cw, ch, ch / 2, ac); ctx.restore();
      area(cx - cw / 2, top, cx + cw / 2, top + ch); drawFit(ctx, cf, cx, cy - cf.h / 2, { align: 'center', color: stOn(ac, C) });
      const gtop = top + ch + 60 * s, colsX = [W - 80 * s - cardW, 80 * s];
      const rowsN = Math.ceil(br.length / 2), rowH = function (r, q) { return Math.max(cardH(br[r * 2], q), br[r * 2 + 1] ? cardH(br[r * 2 + 1], q) : 0); };
      const measure = function (q) { let h = 0; for (let r = 0; r < rowsN; r++) h += rowH(r, q) + 30 * s; return h - 30 * s; };
      const sc = stScale(measure, bot - gtop, 0.45, 1.3), extra = Math.min(110 * s, Math.max(0, (bot - gtop - measure(sc)) / Math.max(1, rowsN)));
      G(ctx, 'branches');
      // جذع رأسي في الوسط، ومنه وصلة إلى الحافة الداخلية لكل بطاقة
      let yy = gtop + extra / 2; const mids = [];
      for (let r = 0; r < rowsN; r++) {
        const pair = [br[r * 2], br[r * 2 + 1]].filter(Boolean), rh = rowH(r, sc);
        pair.forEach(function (b, j) { const i = br.indexOf(b), h = cardH(b, sc), x = colsX[j], ey = yy + Math.min(h / 2, 60 * s); conn(cx, ey, j ? x + cardW : x, ey, pal[i % pal.length], false); drawCard(b, i, x, yy, sc, h); });
        mids.push(yy + Math.min(rh / 2, 60 * s)); yy += rh + 30 * s + extra;
      }
      G(ctx, 'links'); ctx.save(); ctx.strokeStyle = alpha(ac, 0.45); ctx.lineWidth = 5 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, top + ch); ctx.lineTo(cx, mids[mids.length - 1] || top + ch); ctx.stroke(); ctx.restore();
      mids.forEach(function (my) { ctx.beginPath(); ctx.arc(cx, my, 9 * s, 0, Math.PI * 2); ctx.fillStyle = ac; ctx.fill(); });
    }
    G(ctx, 'note'); if (has(d.note)) line(ctx, d.note, W / 2, H - 60 * s, { size: 24 * s, color: isD ? alpha('#ffffff', 0.7) : C.muted, align: 'center', maxW: W * 0.8 });
  }
},

/* ---------- م٢. ملخص دراسي ---------- */
{
  id: 'st_sheet', type: 'study', name: 'ملخص دراسي', tags: 'ملخص مذاكرة درس فقرات مصطلحات خلاصة ورقة طباعة', isNew: 1,
  sizes: ['a4', 'story', 'post'],
  variants: [{ id: 'clean', name: 'أبيض نظيف', sw: ['#ffffff', '#2b2b2b', '#467839'] }, { id: 'band', name: 'ترويسة ملوّنة', sw: ['#ffffff', '#2b2b2b', '#2d4d24'] }],
  colorLabels: { bg: 'لون الورقة', title: 'لون العنوان', accent: 'اللون المميز' },
  fields: [
    { k: 'kicker', label: 'المادة أو السلسلة', def: 'مادة العقيدة · المستوى الأول', max: 50 },
    { k: 'title', label: 'عنوان الملخص', kind: 'area', def: 'ملخص درس: معنى لا إله إلا الله', max: 70 },
    { k: 'meta', label: 'سطر المعلومات', def: 'الدرس الثالث · إعداد: فريق الإشراف', max: 70 },
    { k: 'intro', label: 'المقدمة', kind: 'area', def: 'كلمة التوحيد أعظم كلمة، وهي مفتاح الإسلام، ومعناها *لا معبود بحق إلا الله*؛ فهي نفي وإثبات.', max: 300, hint: 'ما بين *نجمتين* يُبرَز' },
    { k: 'sections', label: 'الأقسام: العنوان | النص', kind: 'area', def: 'ركناها | النفي: «لا إله» ينفي العبادة عن كل ما سوى الله. والإثبات: «إلا الله» يثبتها لله وحده.\nشروطها | العلم، واليقين، والقبول، والانقياد، والصدق، والإخلاص، والمحبة.\nفضلها | من كانت آخر كلامه من الدنيا دخل الجنة، وهي أفضل الذكر.\nنواقضها | الشرك بالله في العبادة، واتخاذ وسائط يدعوهم ويتوكل عليهم.', max: 2000, hint: 'حتى ستة أقسام، كل قسم في سطر' },
    { k: 'terms', label: 'مصطلحات: المصطلح | معناه', kind: 'area', def: 'الإله | المعبود\nالنفي | سلب الحكم عما سوى المثبت\nالإخلاص | تصفية العمل من كل شائبة', max: 600, hint: 'اختياري، حتى خمسة مصطلحات' },
    { k: 'sum', label: 'الخلاصة', kind: 'area', def: 'لا تنفع الكلمة قائلها إلا بالعلم بمعناها والعمل بمقتضاها.', max: 240 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, s = stU(W, H), ac = OV.accent || C.p;
    const base = stPaper(ctx, W, H, C, { base: '#ffffff' }), isD = isDark(base), fg = isD ? '#ffffff' : C.ink, mut = isD ? alpha('#ffffff', 0.7) : C.muted;
    const m = 80 * s, xr = W - m, cw = W - m * 2;
    let y;
    if (v === 'band' && !OV.bg) {
      const bh = 330 * s; G(ctx, 'band'); area(0, 0, W, bh);
      const g = ctx.createLinearGradient(W, 0, 0, bh); g.addColorStop(0, C.p); g.addColorStop(1, C.pd); ctx.fillStyle = g; ctx.fillRect(0, 0, W, bh);
      if (D()) { ctx.save(); ctx.globalAlpha = 0.12; for (let i = 0; i < 5; i++) stStar8(ctx, 120 * s + i * 150 * s, bh - 40 * s, 60 * s, '#ffffff', 2 * s); ctx.restore(); }
      G(ctx, 'logo'); drawLogo(ctx, T, xr, 50 * s, 160 * s, '#ffffff', 'tr');
      y = 150 * s;
      G(ctx, 'kicker'); if (has(d.kicker)) { line(ctx, d.kicker, xr, y, { size: 26 * s, color: alpha('#ffffff', 0.8), align: 'right', maxW: cw }); y += 30 * s; }
      const tf = fit(ctx, d.title, { maxW: cw, maxH: bh - y - 20 * s, size: 58 * s * k, lh: 1.25, bold: 1, title: true, balance: true });
      G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: OV.title || '#ffffff' });
      y = bh + 30 * s;
      G(ctx, 'meta'); if (has(d.meta)) { line(ctx, d.meta, xr, y + 10 * s, { size: 24 * s, color: mut, align: 'right', maxW: cw }); y += 46 * s; }
    } else {
      y = stHead(ctx, W, H, T, d.kicker, { base: base });
      const tf = fit(ctx, d.title, { maxW: cw, maxH: 170 * s, size: 62 * s * k, lh: 1.25, bold: 1, title: true, balance: true });
      G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: OV.title || (isD ? '#ffffff' : C.pd) }); y += tf.h + 8 * s;
      G(ctx, 'meta'); if (has(d.meta)) { line(ctx, d.meta, xr, y + 16 * s, { size: 24 * s, color: mut, align: 'right', maxW: cw }); y += 50 * s; }
    }
    const secs = lines(d.sections).slice(0, 6).map(stParts), terms = lines(d.terms).slice(0, 5).map(stParts);
    const bot = H - 110 * s;
    // كل المحتوى يُقاس بمعامل واحد حتى يتسع للصفحة
    const blocks = function (q, draw) {
      let yy = y;
      if (has(d.intro)) { const f = fit(ctx, d.intro, { maxW: cw - 70 * s, size: 30 * s * q, lh: 1.7, bold: 0.35 }); const h = f.h + 44 * s * q;
        if (draw) { G(ctx, 'intro'); fillRR(ctx, m, yy, cw, h, 18 * s, alpha(ac, 0.07)); fillRR(ctx, xr - 8 * s, yy, 8 * s, h, [0, 18 * s, 18 * s, 0], ac); area(m, yy, xr, yy + h); drawFit(ctx, f, xr - 36 * s, yy + 22 * s * q, { align: 'right', color: fg, hl: ac }); }
        yy += h + 34 * s * q; }
      secs.forEach(function (sc, i) {
        const hf = fit(ctx, sc[0], { maxW: cw - 80 * s, size: 36 * s * q, maxLines: 1, bold: 1, title: true, lh: 1.25 });
        const bf = fit(ctx, sc[1] || '', { maxW: cw - 80 * s, size: 28 * s * q, lh: 1.7, bold: 0.25 });
        if (draw) { G(ctx, 'sec' + i); const r = 22 * s * Math.max(q, 0.7); stNum(ctx, omArNum0(i + 1), xr - r, yy + hf.pt + hf.size * hf.lh / 2, r, ac); drawFit(ctx, hf, xr - 2 * r - 18 * s, yy, { align: 'right', color: isD ? '#ffffff' : C.pd }); drawFit(ctx, bf, xr - 2 * r - 18 * s, yy + hf.h + 6 * s, { align: 'right', color: fg, hl: ac }); area(m, yy, xr, yy + hf.h + bf.h); }
        yy += hf.h + 6 * s + bf.h + 30 * s * q;
      });
      if (terms.length) {
        const rows = terms.map(function (t) { return [fit(ctx, t[0], { maxW: cw * 0.28, size: 27 * s * q, maxLines: 2, bold: 0.9, lh: 1.3 }), fit(ctx, t[1] || '', { maxW: cw * 0.62 - 40 * s, size: 26 * s * q, maxLines: 3, lh: 1.45 })]; });
        const hh = 54 * s * q, rh = rows.map(function (r) { return Math.max(r[0].h, r[1].h) + 22 * s * q; }), h = hh + rh.reduce(function (a, b) { return a + b; }, 0) + 10 * s;
        if (draw) { G(ctx, 'terms'); area(m, yy, xr, yy + h);
          rrect(ctx, m, yy, cw, h, 18 * s); ctx.strokeStyle = alpha(isD ? '#ffffff' : C.p, 0.18); ctx.lineWidth = 2 * s; ctx.stroke();
          fillRR(ctx, m, yy, cw, hh, [18 * s, 18 * s, 0, 0], alpha(ac, 0.12)); line(ctx, 'مصطلحات مهمة', xr - 30 * s, yy + hh / 2, { size: 27 * s * q, color: isD ? '#ffffff' : C.pd, align: 'right', bold: 1, title: true });
          let ty = yy + hh; rows.forEach(function (r, i) { if (i) hline(ctx, m + 24 * s, xr - 24 * s, ty, alpha(isD ? '#ffffff' : C.p, 0.1), 1.5 * s); drawFit(ctx, r[0], xr - 30 * s, ty + 11 * s * q, { align: 'right', color: ac }); drawFit(ctx, r[1], xr - 30 * s - cw * 0.3, ty + 11 * s * q, { align: 'right', color: fg }); ty += rh[i]; }); }
        yy += h + 30 * s * q;
      }
      if (has(d.sum)) { const f = fit(ctx, d.sum, { maxW: cw - 150 * s, size: 30 * s * q, lh: 1.6, bold: 0.7 }); const h = f.h + 48 * s * q;
        if (draw) { G(ctx, 'sum'); fillRR(ctx, m, yy, cw, h, 22 * s, isD ? alpha('#ffffff', 0.08) : C.pd); area(m, yy, xr, yy + h); line(ctx, '❝', xr - 40 * s, yy + 40 * s * q, { size: 54 * s, color: C.a, align: 'center' }); line(ctx, 'الخلاصة', m + 30 * s, yy + 30 * s * q, { size: 20 * s, color: C.a, align: 'left', bold: 0.8 }); drawFit(ctx, f, xr - 80 * s, yy + 24 * s * q, { align: 'right', color: '#ffffff' }); }
        yy += h; }
      return yy - y;
    };
    const q = stScale(function (q) { return blocks(q, false); }, bot - y, 0.5, 1.2);
    blocks(q, true);
    stFoot(ctx, W, H, T, d, { base: base });
  }
},

/* ---------- م٣. ورقة عمل ---------- */
{
  id: 'st_work', type: 'study', name: 'ورقة عمل', tags: 'ورقة عمل أسئلة اختبار تمارين اختيار من متعدد صح وخطأ طباعة طالب', isNew: 1,
  sizes: ['a4', 'post'],
  variants: [{ id: 'clean', name: 'أبيض نظيف', sw: ['#ffffff', '#2b2b2b', '#467839'] }, { id: 'soft', name: 'بطاقات ناعمة', sw: ['#f6f5f1', '#2b2b2b', '#2d4d24'] }],
  colorLabels: { bg: 'لون الورقة', title: 'لون العنوان', accent: 'اللون المميز' },
  fields: [
    { k: 'kicker', label: 'المادة', def: 'ورقة عمل · السيرة النبوية', max: 50 },
    { k: 'title', label: 'العنوان', def: 'غزوة بدر الكبرى', max: 50 },
    { k: 'fieldsLine', label: 'خانات الطالب (افصل بـ ؛)', def: 'الاسم؛ المجموعة؛ التاريخ', max: 60, hint: 'اتركه فارغاً لإخفاء الخانات' },
    { k: 'intro', label: 'التعليمات', def: 'اقرأ الأسئلة جيداً، ثم أجب في المكان المخصص.', max: 140 },
    { k: 'qs', label: 'الأسئلة: السؤال | نوعه', kind: 'area', def: 'متى وقعت غزوة بدر؟ | اختيار: السنة الأولى؛ السنة الثانية؛ السنة الثالثة\nكان عدد المسلمين في بدر نحو ثلاثمائة وبضعة عشر رجلاً. | صح وخطأ\nاذكر سببين لانتصار المسلمين في بدر. | 3\nما الدرس الذي تستفيده لنفسك من هذه الغزوة؟ | 2', max: 2000, hint: 'بعد | اكتب: «اختيار: أ؛ ب؛ ج» أو «صح وخطأ» أو عدد أسطر الإجابة' }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, s = stU(W, H), ac = OV.accent || C.p;
    const base = stPaper(ctx, W, H, C, { base: v === 'soft' ? '#f6f5f1' : '#ffffff' }), isD = isDark(base), fg = isD ? '#ffffff' : C.ink, mut = isD ? alpha('#ffffff', 0.65) : C.muted;
    const m = 80 * s, xr = W - m, cw = W - m * 2;
    let y = stHead(ctx, W, H, T, d.kicker, { base: base });
    const tf = fit(ctx, d.title, { maxW: cw, size: 60 * s * k, maxLines: 2, bold: 1, title: true, lh: 1.25 });
    G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: OV.title || (isD ? '#ffffff' : C.pd) }); y += tf.h + 18 * s;
    // خانات الطالب
    const fl = String(d.fieldsLine || '').split(/[؛;]/).map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 4);
    G(ctx, 'fields');
    if (fl.length) {
      const fw = cw / fl.length;
      fl.forEach(function (f, i) { const x1 = xr - i * fw, lw = textW(ctx, f + ':', 24 * s, 0.7); line(ctx, f + ':', x1, y + 22 * s, { size: 24 * s, color: fg, align: 'right', bold: 0.7 }); stDots(ctx, x1 - fw + 24 * s, x1 - lw - 12 * s, y + 34 * s, alpha(fg, 0.45), s); });
      area(m, y, xr, y + 44 * s); y += 70 * s;
    }
    G(ctx, 'intro'); if (has(d.intro)) { const w = Math.min(cw, textW(ctx, d.intro, 24 * s) + 80 * s); fillRR(ctx, xr - w, y, w, 52 * s, 26 * s, alpha(ac, 0.1)); icon(ctx, 'star', xr - 30 * s, y + 26 * s, 22 * s, ac); line(ctx, d.intro, xr - 54 * s, y + 26 * s, { size: 24 * s, color: fg, align: 'right', maxW: w - 74 * s }); y += 80 * s; }
    const qs = lines(d.qs).slice(0, 12).map(function (r) { const p = r.split('|'); const t = (p[1] || '').trim(); let kind = 'lines', n = 2, ch = [];
      if (/^اختيار/.test(t)) { kind = 'mc'; ch = t.replace(/^اختيار\s*:?/, '').split(/[؛;]/).map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 5); }
      else if (/صح/.test(t)) kind = 'tf'; else if (/^\d+$/.test(t.replace(/[٠-٩]/g, function (c) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(c); }))) n = Math.min(8, +t.replace(/[٠-٩]/g, function (c) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(c); }));
      return { q: p[0].trim(), kind: kind, n: n, ch: ch }; });
    const bot = H - 110 * s, letters = ['أ', 'ب', 'ج', 'د', 'هـ'];
    const run = function (q, draw) {
      let yy = y;
      qs.forEach(function (it, i) {
        const r = 22 * s * Math.max(q, 0.75), qf = fit(ctx, it.q, { maxW: cw - 2 * r - 40 * s, size: 30 * s * q, lh: 1.55, bold: 0.6 });
        const y0 = yy;
        if (draw === true) { G(ctx, 'q' + i); stNum(ctx, omArNum0(i + 1), xr - r, yy + qf.pt + qf.size * qf.lh / 2, r, ac); drawFit(ctx, qf, xr - 2 * r - 18 * s, yy, { align: 'right', color: fg }); }
        yy += qf.h + 14 * s * q;
        const ix = xr - 2 * r - 18 * s;
        if (it.kind === 'mc') {
          const cols = it.ch.length <= 3 ? it.ch.length : 2, colW = (ix - m) / cols, rows = Math.ceil(it.ch.length / cols), rh = 52 * s * q;
          if (draw === true) it.ch.forEach(function (c, j) { const cx1 = ix - (j % cols) * colW, cy = yy + Math.floor(j / cols) * rh + rh / 2; ctx.beginPath(); ctx.arc(cx1 - 16 * s, cy, 15 * s, 0, Math.PI * 2); ctx.strokeStyle = alpha(fg, 0.5); ctx.lineWidth = 2 * s; ctx.stroke(); line(ctx, letters[j], cx1 - 16 * s, cy + 1 * s, { size: 18 * s, color: mut, align: 'center', bold: 0.8 }); line(ctx, c, cx1 - 44 * s, cy, { size: 27 * s * q, color: fg, align: 'right', maxW: colW - 70 * s }); });
          yy += rows * rh;
        } else if (it.kind === 'tf') {
          if (draw === true) [['صح', '✓'], ['خطأ', '✗']].forEach(function (o, j) { const bx = ix - j * 190 * s; rrect(ctx, bx - 34 * s, yy + 4 * s, 34 * s, 34 * s, 8 * s); ctx.strokeStyle = alpha(fg, 0.5); ctx.lineWidth = 2 * s; ctx.stroke(); line(ctx, o[0], bx - 50 * s, yy + 21 * s, { size: 27 * s * q, color: fg, align: 'right' }); });
          yy += 52 * s * q;
        } else {
          const lh = 56 * s * q;
          if (draw === true) for (let j = 0; j < it.n; j++) stDots(ctx, m, ix, yy + lh * (j + 0.85), alpha(fg, 0.35), s);
          yy += it.n * lh;
        }
        if (draw === 'bg') { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.06)'; ctx.shadowBlur = 20 * s; ctx.shadowOffsetY = 6 * s; fillRR(ctx, m - 20 * s, y0 - 18 * s, cw + 40 * s, yy - y0 + 26 * s, 20 * s, isD ? alpha('#ffffff', 0.06) : '#ffffff'); ctx.restore(); }
        if (draw === true) area(m, y0, xr, yy);
        yy += 40 * s * q;
      });
      return yy - y;
    };
    const q = stScale(function (q) { return run(q, false); }, bot - y, 0.5, 1.3);
    if (v === 'soft') { G(ctx, 'cards'); run(q, 'bg'); }
    run(q, true);
    stFoot(ctx, W, H, T, d, { base: base });
  }
},

/* ---------- م٤. بطاقات مراجعة ---------- */
{
  id: 'st_cards', type: 'study', name: 'بطاقات مراجعة', tags: 'بطاقات مراجعة فلاش كارد سؤال جواب حفظ طباعة قص', isNew: 1,
  sizes: ['a4', 'post'],
  variants: [{ id: 'fold', name: 'سؤال وجواب متقابلان', sw: ['#ffffff', '#2b2b2b', '#467839'] }, { id: 'grid', name: 'شبكة بطاقات', sw: ['#ffffff', '#2b2b2b', '#2d4d24'] }],
  colorLabels: { bg: 'لون الورقة', title: 'لون العنوان', accent: 'لون البطاقات' },
  fields: [
    { k: 'title', label: 'العنوان', def: 'بطاقات مراجعة: أسماء الله الحسنى', max: 60 },
    { k: 'cards', label: 'البطاقات: السؤال | الجواب', kind: 'area', def: 'ما معنى «الرحمن»؟ | ذو الرحمة الواسعة التي وسعت كل شيء\nما معنى «القدوس»؟ | المنزّه عن كل نقص وعيب\nما معنى «السلام»؟ | السالم من كل آفة، المسلِّم لعباده\nما معنى «المؤمن»؟ | المصدِّق رسله، والذي يؤمّن خلقه من الظلم\nما معنى «المهيمن»؟ | الرقيب الشاهد على خلقه\nما معنى «العزيز»؟ | الغالب الذي لا يُغلب', max: 1600, hint: 'حتى ثماني بطاقات' }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, s = stU(W, H), ac = OV.accent || C.p;
    const base = stPaper(ctx, W, H, C, { base: '#ffffff' }), isD = isDark(base), fg = isD ? '#ffffff' : C.ink;
    const m = 70 * s, xr = W - m, cw = W - m * 2, pal = stPal(C);
    let y = stHead(ctx, W, H, T, 'قُصّ على الخطوط المتقطعة', { base: base });
    const tf = fit(ctx, d.title, { maxW: cw, size: 52 * s * k, maxLines: 2, bold: 1, title: true, lh: 1.25 });
    G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: OV.title || (isD ? '#ffffff' : C.pd) }); y += tf.h + 30 * s;
    const cards = lines(d.cards).slice(0, 8).map(stParts), bot = H - 100 * s, n = Math.max(1, cards.length);
    const cut = alpha(fg, 0.35);
    const dash = function (x0, y0, x1, y1) { ctx.save(); ctx.strokeStyle = cut; ctx.lineWidth = 2 * s; ctx.setLineDash([10 * s, 8 * s]); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore(); };
    G(ctx, 'cards');
    if (v === 'fold') {
      const gap = 22 * s, ch = (bot - y - gap * (n - 1)) / n, half = cw / 2;
      cards.forEach(function (c, i) {
        G(ctx, 'card' + i);
        const yy = y + i * (ch + gap), col = pal[i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : 3];
        area(m, yy, xr, yy + ch);
        rrect(ctx, m, yy, cw, ch, 20 * s); ctx.fillStyle = isD ? alpha('#ffffff', 0.06) : '#ffffff'; ctx.fill(); ctx.save(); ctx.strokeStyle = cut; ctx.lineWidth = 2 * s; ctx.setLineDash([10 * s, 8 * s]); ctx.stroke(); ctx.restore();
        fillRR(ctx, xr - half, yy, half, ch, [0, 20 * s, 20 * s, 0], alpha(OV.accent || col, 0.1));
        dash(xr - half, yy + 14 * s, xr - half, yy + ch - 14 * s);
        if (D()) stScissors(ctx, m - 30 * s, yy + ch / 2, s, cut);
        const tagS = 19 * s;
        line(ctx, 'س' + omArNum0(i + 1), xr - 26 * s, yy + 28 * s, { size: tagS, color: OV.accent || col, align: 'right', bold: 1 });
        line(ctx, 'الجواب', xr - half - 26 * s, yy + 28 * s, { size: tagS, color: alpha(fg, 0.5), align: 'right', bold: 0.8 });
        const qf = fit(ctx, c[0], { maxW: half - 60 * s, maxH: ch - 70 * s, size: 34 * s * k, lh: 1.35, bold: 0.9, title: true, balance: true });
        drawFit(ctx, qf, xr - half / 2, yy + 20 * s + (ch - qf.h) / 2, { align: 'center', color: isD ? '#ffffff' : lighten(OV.accent || col, -0.3) });
        const af = fit(ctx, c[1] || '', { maxW: half - 60 * s, maxH: ch - 70 * s, size: 30 * s, lh: 1.45, balance: true });
        drawFit(ctx, af, m + half / 2, yy + 20 * s + (ch - af.h) / 2, { align: 'center', color: fg });
      });
    } else {
      const cols = 2, rows = Math.ceil(n / cols), gap = 24 * s, cw2 = (cw - gap) / cols, ch = (bot - y - gap * (rows - 1)) / rows;
      cards.forEach(function (c, i) {
        G(ctx, 'card' + i);
        const x = xr - (i % cols) * (cw2 + gap) - cw2, yy = y + Math.floor(i / cols) * (ch + gap), col = OV.accent || pal[i % 4];
        area(x, yy, x + cw2, yy + ch);
        rrect(ctx, x, yy, cw2, ch, 22 * s); ctx.fillStyle = isD ? alpha('#ffffff', 0.06) : '#ffffff'; ctx.fill(); ctx.save(); ctx.strokeStyle = cut; ctx.lineWidth = 2 * s; ctx.setLineDash([10 * s, 8 * s]); ctx.stroke(); ctx.restore();
        ctx.save(); rrect(ctx, x, yy, cw2, ch, 22 * s); ctx.clip(); ctx.fillStyle = col; ctx.fillRect(x, yy, cw2, 12 * s); ctx.restore();
        line(ctx, omArNum0(i + 1), x + cw2 - 34 * s, yy + 50 * s, { size: 28 * s, color: col, align: 'center', bold: 1 });
        const ah = ch * 0.3;
        const qf = fit(ctx, c[0], { maxW: cw2 - 70 * s, maxH: ch - ah - 90 * s, size: 36 * s * k, lh: 1.35, bold: 0.9, title: true, balance: true });
        drawFit(ctx, qf, x + cw2 / 2, yy + 40 * s + (ch - ah - 40 * s - qf.h) / 2, { align: 'center', color: isD ? '#ffffff' : C.pd });
        dash(x + 24 * s, yy + ch - ah, x + cw2 - 24 * s, yy + ch - ah);
        line(ctx, 'الجواب', x + cw2 - 30 * s, yy + ch - ah + 26 * s, { size: 18 * s, color: alpha(fg, 0.5), align: 'right', bold: 0.8 });
        const af = fit(ctx, c[1] || '', { maxW: cw2 - 60 * s, maxH: ah - 50 * s, size: 26 * s, lh: 1.4, balance: true });
        drawFit(ctx, af, x + cw2 / 2, yy + ch - ah + 40 * s + (ah - 50 * s - af.h) / 2, { align: 'center', color: fg });
      });
    }
    stFoot(ctx, W, H, T, d, { base: base, social: false });
  }
},

/* ---------- م٥. إنفوجرافيك ---------- */
{
  id: 'st_info', type: 'study', name: 'إنفوجرافيك', tags: 'إنفوجرافيك أرقام إحصاءات خطوات مراحل معلومات بصرية', isNew: 1,
  sizes: ['story', 'post', 'a4'],
  variants: [{ id: 'light', name: 'فاتح', sw: ['#f7f6f2', '#2b2b2b', '#467839'] }, { id: 'dark', name: 'داكن', sw: ['#1f2a44', '#ffffff', '#fbb03b'] }],
  colorLabels: { bg: 'لون الخلفية', title: 'لون العنوان', accent: 'لون الأرقام' },
  fields: [
    { k: 'title', label: 'العنوان', kind: 'area', def: 'رحلة الحفظ\nفي أرقام', max: 50 },
    { k: 'sub', label: 'تحت العنوان', def: 'حصاد الفصل الأول في مسار الحفظ', max: 70 },
    { k: 'stats', label: 'الأرقام: الرقم | الوصف', kind: 'area', def: '120 | طالباً وطالبة\n4,800 | صفحة محفوظة\n92% | نسبة الالتزام', max: 300, hint: 'حتى أربعة أرقام' },
    { k: 'stepsHead', label: 'عنوان المراحل', def: 'كيف وصلنا؟', max: 30 },
    { k: 'steps', label: 'المراحل: العنوان | الوصف', kind: 'area', def: 'التسجيل | اختبار تحديد المستوى وتوزيع المجموعات\nالحفظ اليومي | نصف وجه يومياً مع التسميع للمعلم\nالمراجعة الأسبوعية | ربط المحفوظ الجديد بالقديم\nالاختبار الختامي | تسميع شامل وتكريم المتميزين', max: 900, hint: 'حتى ست مراحل' },
    { k: 'note', label: 'سطر الختام', def: 'والحمد لله الذي بنعمته تتم الصالحات', max: 70 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, sv = H > W * 1.5 ? u * 1.08 : Math.min(1, H / 1350) * u;
    const base = OV.bg || (v === 'dark' ? lighten(C.teal, -0.2) : '#f7f6f2'), isD = isDark(base), fg = isD ? '#ffffff' : C.ink, ac = OV.accent || (isD ? C.a : C.p), mut = isD ? alpha('#ffffff', 0.65) : C.muted;
    paintBg(ctx, W, H, base);
    if (D() && !BGFX && !OV.bg) { ctx.save(); ctx.globalAlpha = isD ? 0.08 : 0.05; ctx.fillStyle = isD ? '#ffffff' : C.p; ctx.beginPath(); ctx.arc(W * 0.95, H * 0.04, W * 0.45, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(W * 0.02, H * 0.98, W * 0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    const m = 80 * u, xr = W - m, cw = W - m * 2;
    G(ctx, 'logo'); drawLogo(ctx, T, xr, 60 * u, 150 * u, isD ? '#ffffff' : 'color', 'tr');
    let y = 200 * sv + Math.max(0, H - 1350 * u) * 0.05;
    const tf = fit(ctx, d.title, { maxW: cw, maxH: 280 * sv, size: 96 * sv * k, lh: 1.15, bold: 1, title: true, balance: true });
    G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: OV.title || (isD ? '#ffffff' : C.pd) }); y += tf.h + 10 * sv;
    G(ctx, 'sub'); if (has(d.sub)) { line(ctx, d.sub, xr, y + 20 * sv, { size: 32 * sv, color: mut, align: 'right', maxW: cw }); y += 60 * sv; }
    y += 30 * sv;
    const stats = lines(d.stats).slice(0, 4).map(stParts), steps = lines(d.steps).slice(0, 6).map(stParts);
    // الأرقام: بطاقات متجاورة برقم كبير وحلقة
    G(ctx, 'stats');
    if (stats.length) {
      const n = stats.length, gap = 22 * u, sw = (cw - gap * (n - 1)) / n, sh = 230 * sv;
      stats.forEach(function (st, i) {
        G(ctx, 'stat' + i);
        const x = xr - i * (sw + gap) - sw;
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.08)'; ctx.shadowBlur = 26 * u; ctx.shadowOffsetY = 8 * u; fillRR(ctx, x, y, sw, sh, 26 * u, isD ? alpha('#ffffff', 0.07) : '#ffffff'); ctx.restore();
        area(x, y, x + sw, y + sh);
        const nf = fit(ctx, st[0], { maxW: sw - 40 * u, size: 76 * sv, maxLines: 1, bold: 1, title: true, lh: 1.2 });
        drawFit(ctx, nf, x + sw / 2, y + 40 * sv, { align: 'center', color: i === 1 ? (isD ? '#ffffff' : C.s) : ac });
        fillRR(ctx, x + sw / 2 - 24 * u, y + 40 * sv + nf.h + 8 * sv, 48 * u, 5 * u, 3 * u, C.a);
        const lf = fit(ctx, st[1] || '', { maxW: sw - 40 * u, size: 28 * sv, maxLines: 2, lh: 1.3, balance: true });
        drawFit(ctx, lf, x + sw / 2, y + 40 * sv + nf.h + 30 * sv, { align: 'center', color: fg });
      });
      y += sh + 60 * sv;
    }
    G(ctx, 'stepsHead'); if (has(d.stepsHead) && steps.length) { const f = line(ctx, d.stepsHead, xr, y + 24 * sv, { size: 40 * sv, color: isD ? '#ffffff' : C.pd, align: 'right', bold: 1, title: true }); if (D()) hline(ctx, m, xr - f.w - 30 * u, y + 26 * sv, alpha(fg, 0.15), 2 * u); y += 80 * sv; }
    const bot = H - (has(d.note) ? 150 : 90) * u;
    G(ctx, 'steps');
    if (steps.length) {
      const measure = function (q) { return steps.reduce(function (a, st) { const tf2 = fit(ctx, st[0], { maxW: cw - 130 * u, size: 34 * sv * q, maxLines: 1, bold: 0.9, title: true }); const bf = fit(ctx, st[1] || '', { maxW: cw - 130 * u, size: 26 * sv * q, maxLines: 3, lh: 1.45 }); return a + tf2.h + bf.h + 36 * sv * q; }, 0); };
      const q = stScale(measure, bot - y, 0.5), nx = xr - 34 * u;
      let yy = y; const ys = [];
      steps.forEach(function (st, i) {
        G(ctx, 'step' + i);
        const tf2 = fit(ctx, st[0], { maxW: cw - 130 * u, size: 34 * sv * q, maxLines: 1, bold: 0.9, title: true }), bf = fit(ctx, st[1] || '', { maxW: cw - 130 * u, size: 26 * sv * q, maxLines: 3, lh: 1.45 });
        ys.push(yy + tf2.pt + tf2.size * tf2.lh / 2);
        drawFit(ctx, tf2, nx - 60 * u, yy, { align: 'right', color: isD ? '#ffffff' : C.pd });
        drawFit(ctx, bf, nx - 60 * u, yy + tf2.h, { align: 'right', color: mut });
        area(m, yy, xr, yy + tf2.h + bf.h);
        yy += tf2.h + bf.h + 36 * sv * q;
      });
      G(ctx, 'steps'); if (ys.length > 1) { ctx.save(); ctx.strokeStyle = alpha(ac, 0.35); ctx.lineWidth = 4 * u; ctx.setLineDash([2 * u, 10 * u]); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(nx, ys[0]); ctx.lineTo(nx, ys[ys.length - 1]); ctx.stroke(); ctx.restore(); }
      ys.forEach(function (cy, i) { G(ctx, 'step' + i); ctx.beginPath(); ctx.arc(nx, cy, 30 * u, 0, Math.PI * 2); ctx.fillStyle = base; ctx.fill(); stNum(ctx, omArNum0(i + 1), nx, cy, 26 * u, i % 2 ? (isD ? C.a : C.s) : ac, isD && i % 2 ? C.teal : '#ffffff'); });
    }
    G(ctx, 'footer');
    if (has(d.note)) { const f = line(ctx, d.note, W / 2, H - 100 * u, { size: 28 * sv, color: mut, align: 'center', maxW: cw }); if (D()) { star(ctx, W / 2 + f.w / 2 + 28 * u, H - 100 * u, 9 * u, C.a, 0); star(ctx, W / 2 - f.w / 2 - 28 * u, H - 100 * u, 9 * u, C.a, 0); } }
    academy(ctx, mut, xr, H - 40 * u, 110 * u, 'br'); social(ctx, mut, m, H - 44 * u, 110 * u, 'bl');
  }
},

/* ---------- م٦. جدول أسبوعي (ضمن الأغلفة والجداول) ---------- */
{
  id: 'st_week', type: 'cover', name: 'جدول أسبوعي', tags: 'جدول أسبوعي حصص مواعيد أيام فترات دراسي طباعة', isNew: 1,
  sizes: ['card', 'a4', 'post'],
  variants: [{ id: 'soft', name: 'خلايا ملوّنة', sw: ['#ffffff', '#2b2b2b', '#467839'] }, { id: 'lines', name: 'خطوط هادئة', sw: ['#ffffff', '#2b2b2b', '#2d4d24'] }],
  colorLabels: { bg: 'لون الورقة', title: 'لون العنوان', accent: 'لون الرأس' },
  fields: [
    { k: 'title', label: 'العنوان', def: 'الجدول الأسبوعي', max: 40 },
    { k: 'sub', label: 'تحت العنوان', def: 'الفصل الأول · المجموعة (أ)', max: 60 },
    { k: 'cols', label: 'الفترات (افصل بـ |)', def: 'الفجر | الضحى | العصر | المغرب', max: 120, hint: 'حتى ستة أعمدة' },
    { k: 'rows', label: 'الأيام: اليوم | خانة | خانة …', kind: 'area', def: 'السبت | حفظ | عقيدة | — | مراجعة\nالأحد | حفظ | سيرة | لقاء | مراجعة\nالاثنين | حفظ | فقه | — | مراجعة\nالثلاثاء | حفظ | عقيدة | لقاء | مراجعة\nالأربعاء | حفظ | سيرة | — | مراجعة\nالخميس | تسميع | مسابقة | — | راحة', max: 1200, hint: 'حتى سبعة أيام. الخانات المتشابهة تأخذ اللون نفسه' },
    { k: 'note', label: 'ملاحظة', def: 'المواعيد بتوقيت مكة المكرمة', max: 70 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, s = stU(W, H), land = W > H, ac = OV.accent || C.p;
    const base = stPaper(ctx, W, H, C, { base: '#ffffff' }), isD = isDark(base), fg = isD ? '#ffffff' : C.ink, mut = isD ? alpha('#ffffff', 0.65) : C.muted;
    const m = (land ? 80 : 70) * s, xr = W - m, cw = W - m * 2;
    let y = stHead(ctx, W, H, T, d.sub, { base: base, rule: false });
    y -= 20 * s;
    const tf = fit(ctx, d.title, { maxW: cw * 0.7, size: 64 * s * k, maxLines: 1, bold: 1, title: true });
    G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: OV.title || (isD ? '#ffffff' : C.pd) }); y += tf.h + 30 * s;
    const cols = stParts(d.cols).filter(Boolean).slice(0, 6), rows = lines(d.rows).slice(0, 7).map(stParts);
    const nC = Math.max(1, cols.length), bot = H - (has(d.note) ? 120 : 80) * s;
    const dayW = (land ? 220 : 190) * s, hh = 74 * s, gap = 8 * s, cellW = (cw - dayW - gap * nC) / nC, rh = Math.min(150 * s, (bot - y - hh - gap * rows.length) / Math.max(1, rows.length));
    const pal = stPal(C), tints = {}; let ti = 0;
    const tintOf = function (t) { const kx = String(t).trim(); if (!kx || kx === '—' || kx === '-') return null; if (!tints[kx]) tints[kx] = pal[ti++ % pal.length]; return tints[kx]; };
    G(ctx, 'table'); area(m, y, xr, y + hh + rows.length * (rh + gap));
    fillRR(ctx, xr - dayW, y, dayW, hh, 16 * s, alpha(ac, 0.12));
    cols.forEach(function (c, j) { const x = xr - dayW - gap - (j + 1) * (cellW + gap) + gap; fillRR(ctx, x, y, cellW, hh, 16 * s, ac); line(ctx, c, x + cellW / 2, y + hh / 2, { size: 28 * s, color: stOn(ac, C), align: 'center', bold: 1, title: true, maxW: cellW - 20 * s }); });
    line(ctx, 'اليوم', xr - dayW / 2, y + hh / 2, { size: 28 * s, color: isD ? '#ffffff' : ac, align: 'center', bold: 1, title: true });
    let yy = y + hh + gap;
    rows.forEach(function (r, i) {
      G(ctx, 'row' + i);
      fillRR(ctx, xr - dayW, yy, dayW, rh, 16 * s, isD ? alpha('#ffffff', 0.08) : (i % 2 ? '#f4f3ef' : '#efede7'));
      line(ctx, r[0], xr - dayW / 2, yy + rh / 2, { size: Math.min(30 * s, rh * 0.32), color: isD ? '#ffffff' : C.pd, align: 'center', bold: 1, title: true, maxW: dayW - 20 * s });
      for (let j = 0; j < nC; j++) {
        const t = r[j + 1] || '', x = xr - dayW - gap - (j + 1) * (cellW + gap) + gap, col = tintOf(t);
        if (v === 'lines') { if (j < nC) hline(ctx, x + 10 * s, x + cellW - 10 * s, yy + rh + gap / 2, alpha(fg, 0.1), 1.5 * s); if (col) { ctx.beginPath(); ctx.arc(x + cellW - 22 * s, yy + rh / 2, 7 * s, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); } }
        else fillRR(ctx, x, yy, cellW, rh, 16 * s, col ? alpha(col, isD ? 0.35 : 0.13) : (isD ? alpha('#ffffff', 0.04) : '#fafaf8'));
        const tf2 = fit(ctx, t, { maxW: cellW - (v === 'lines' ? 54 : 24) * s, maxH: rh - 16 * s, size: Math.min(28 * s, rh * 0.3), lh: 1.25, bold: 0.6, balance: true });
        drawFit(ctx, tf2, x + cellW / 2 - (v === 'lines' && col ? 10 * s : 0), yy + (rh - tf2.h) / 2, { align: 'center', color: col ? (isD ? '#ffffff' : lighten(col, -0.35)) : mut });
      }
      yy += rh + gap;
    });
    G(ctx, 'note'); if (has(d.note)) { const nw = infoW(ctx, 'clock', d.note, { size: 24 * s }); infoItem(ctx, 'clock', d.note, W / 2 + nw / 2, H - 80 * s, { size: 24 * s, color: mut, iconColor: ac }); }
    G(ctx, 'footer'); social(ctx, mut, m, H - 50 * s, 110 * s, 'bl');
  }
},

/* ---------- م٧. شهادة إنجاز (ضمن التهنئة والشكر) ---------- */
{
  id: 'st_cert', type: 'thanks', name: 'شهادة إنجاز', tags: 'شهادة إنجاز تقدير تكريم تخرج إتمام دورة إطار زخرفة ختم توقيع طباعة', isNew: 1,
  sizes: ['card', 'a4'],
  variants: [{ id: 'ivory', name: 'عاجي بإطار مزخرف', sw: ['#fbf8f1', '#2b2b2b', '#b8913f'] }, { id: 'deep', name: 'داكن فاخر', sw: ['#1f2a44', '#ffffff', '#c9a55a'] }],
  colorLabels: { bg: 'لون الورقة', title: 'لون الاسم', accent: 'لون الذهب' },
  fields: [
    { k: 'kicker', label: 'كلمة فوق العنوان', def: 'تمنح إدارة البرنامج', max: 50 },
    { k: 'title', label: 'العنوان', def: 'شهادة إتمام', max: 30 },
    { k: 'intro', label: 'قبل الاسم', def: 'هذه الشهادة بكل فخر واعتزاز إلى', max: 60 },
    { k: 'name', label: 'اسم المكرَّم', def: 'عبدالله بن محمد العتيبي', max: 40 },
    { k: 'body', label: 'نص الشهادة', kind: 'area', def: 'وذلك لإتمامه *دورة التأسيس العلمي* بتقدير ممتاز، سائلين الله له التوفيق والسداد، وأن يجعل ما تعلّمه حجة له لا عليه.', max: 400, hint: 'ما بين *نجمتين* يُبرَز' },
    { kind: 'date', label: 'التاريخ', map: { date: '{hd} {hm} {hy} هـ' } },
    { k: 'date', label: 'التاريخ', def: '1 جمادى الأولى 1448 هـ', max: 40, half: 1 },
    { k: 'place', label: 'المكان أو المنصة', def: '', max: 40, half: 1 },
    { k: 's1l', label: 'التوقيع الأول: الصفة', def: 'المشرف العام', max: 30, half: 1 },
    { k: 's1', label: 'التوقيع الأول: الاسم', def: 'أ. خالد السالم', max: 30, half: 1 },
    { k: 's2l', label: 'التوقيع الثاني: الصفة', def: 'مدير البرنامج', max: 30, half: 1 },
    { k: 's2', label: 'التوقيع الثاني: الاسم', def: 'أ. فهد العمر', max: 30, half: 1 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, s = stU(W, H), land = W > H, deep = v === 'deep';
    const gold = OV.accent || (deep ? '#c9a55a' : '#b8913f');
    const base = OV.bg || (deep ? lighten(C.teal, -0.25) : '#fbf8f1'), isD = isDark(base), fg = isD ? '#ffffff' : C.ink;
    paintBg(ctx, W, H, base);
    if (!OV.bg && !BGFX) { const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7); g.addColorStop(0, alpha(isD ? '#ffffff' : gold, isD ? 0.06 : 0.05)); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    // الإطار: خطان ذهبيان وزوايا نجمية ونقش هادئ في الهامش
    G(ctx, 'frame');
    const o1 = 44 * s, o2 = 64 * s;
    if (D()) {
      ctx.save(); ctx.strokeStyle = gold; ctx.lineWidth = 5 * s; ctx.strokeRect(o1, o1, W - o1 * 2, H - o1 * 2); ctx.lineWidth = 1.6 * s; ctx.strokeRect(o2, o2, W - o2 * 2, H - o2 * 2); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.18; for (let x = o1 + 40 * s; x < W - o1 - 20 * s; x += 40 * s) { stStar8(ctx, x, (o1 + o2) / 2, 6 * s, gold); stStar8(ctx, x, H - (o1 + o2) / 2, 6 * s, gold); } for (let yy = o1 + 40 * s; yy < H - o1 - 20 * s; yy += 40 * s) { stStar8(ctx, (o1 + o2) / 2, yy, 6 * s, gold); stStar8(ctx, W - (o1 + o2) / 2, yy, 6 * s, gold); } ctx.restore();
      [[o1, o1], [W - o1, o1], [o1, H - o1], [W - o1, H - o1]].forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], 34 * s, 0, Math.PI * 2); ctx.fillStyle = base; ctx.fill(); stStar8(ctx, p[0], p[1], 30 * s, gold); stStar8(ctx, p[0], p[1], 16 * s, base); stStar8(ctx, p[0], p[1], 8 * s, gold); });
    }
    const cx = W / 2, cw = W - (land ? 360 : 240) * s;
    const parts = function (q) {
      return {
        kick: fit(ctx, d.kicker, { maxW: cw, size: 28 * s * q, maxLines: 1, lh: 1.3 }),
        title: fit(ctx, d.title, { maxW: cw, size: 96 * s * q * k, maxLines: 1, bold: 1, title: true, lh: 1.25 }),
        intro: fit(ctx, d.intro, { maxW: cw, size: 30 * s * q, maxLines: 1, lh: 1.3 }),
        name: fit(ctx, d.name, { maxW: cw, size: 70 * s * q * k, maxLines: 1, bold: 1, title: true, lh: 1.3 }),
        body: fit(ctx, d.body, { maxW: cw * 0.9, size: 30 * s * q, lh: 1.75, maxLines: land ? 4 : 6, balance: true, bold: 0.3 })
      };
    };
    const lgH = HIDE.logo ? 0 : 120 * s, signH = 170 * s;
    const meas = function (q) { const p = parts(q); return lgH + 26 * s + p.kick.h + p.title.h + 30 * s + p.intro.h + 12 * s + p.name.h + 40 * s + p.body.h + 50 * s + signH; };
    const avail = H - 2 * (o2 + (land ? 40 : 70) * s), q = stScale(meas, avail, 0.6), P = parts(q);
    let y = (H - meas(q)) / 2;
    G(ctx, 'logo'); if (lgH) { const lg = drawLogo(ctx, T, cx, y, 260 * s, isD ? '#ffffff' : 'color', 'tc'); y += (lg.h || lgH) + 26 * s; }
    G(ctx, 'kicker'); drawFit(ctx, P.kick, cx, y, { align: 'center', color: isD ? alpha('#ffffff', 0.75) : C.muted }); y += P.kick.h;
    G(ctx, 'title'); drawFit(ctx, P.title, cx, y, { align: 'center', color: isD ? '#ffffff' : C.pd });
    if (D()) { const ty = y + P.title.pt + P.title.size * P.title.lh / 2; [-1, 1].forEach(function (sd) { const x0 = cx + sd * (P.title.w / 2 + 40 * s); hline(ctx, x0, x0 + sd * 120 * s, ty, gold, 2 * s); stStar8(ctx, x0 + sd * 130 * s, ty, 9 * s, gold); }); }
    y += P.title.h + 30 * s;
    G(ctx, 'intro'); drawFit(ctx, P.intro, cx, y, { align: 'center', color: fg }); y += P.intro.h + 12 * s;
    G(ctx, 'name'); drawFit(ctx, P.name, cx, y, { align: 'center', color: OV.title || gold }); y += P.name.h;
    if (D()) { hline(ctx, cx - Math.max(P.name.w, 300 * s) / 2, cx + Math.max(P.name.w, 300 * s) / 2, y + 4 * s, alpha(gold, 0.5), 1.5 * s); }
    y += 40 * s;
    G(ctx, 'body'); drawFit(ctx, P.body, cx, y, { align: 'center', color: fg, hl: gold }); y += P.body.h + 50 * s;
    // التوقيعان والختم والتاريخ
    G(ctx, 'sign');
    const sx = [W - (land ? 300 : 220) * s, (land ? 300 : 220) * s], sy = y + 40 * s;
    [[d.s1l, d.s1], [d.s2l, d.s2]].forEach(function (sg, i) { if (!has(sg[0]) && !has(sg[1])) return; line(ctx, sg[0], sx[i], sy, { size: 24 * s, color: isD ? alpha('#ffffff', 0.7) : C.muted, align: 'center', maxW: 320 * s }); stDots(ctx, sx[i] - 130 * s, sx[i] + 130 * s, sy + 70 * s, alpha(fg, 0.4), s); line(ctx, sg[1], sx[i], sy + 104 * s, { size: 26 * s, color: fg, align: 'center', bold: 0.8, maxW: 320 * s }); });
    G(ctx, 'seal');
    if (D()) {
      const r = 66 * s, sxc = cx, syc = sy + 60 * s;
      ctx.save(); ctx.beginPath(); for (let i = 0; i < 48; i++) { const a = i * Math.PI / 24, rr = i % 2 ? r : r * 0.9; const x = sxc + rr * Math.cos(a), yy = syc + rr * Math.sin(a); if (i) ctx.lineTo(x, yy); else ctx.moveTo(x, yy); } ctx.closePath(); ctx.fillStyle = gold; ctx.fill();
      ctx.beginPath(); ctx.arc(sxc, syc, r * 0.72, 0, Math.PI * 2); ctx.strokeStyle = alpha('#ffffff', 0.7); ctx.lineWidth = 2 * s; ctx.stroke(); ctx.restore();
      stStar8(ctx, sxc, syc, r * 0.45, alpha('#ffffff', 0.9)); stStar8(ctx, sxc, syc, r * 0.22, gold);
    }
    G(ctx, 'date'); const dl = [d.date, d.place].filter(has).join(' · '); if (dl) line(ctx, dl, cx, sy + 160 * s, { size: 22 * s, color: isD ? alpha('#ffffff', 0.7) : C.muted, align: 'center', maxW: cw });
  }
},

/* ---------- م٨. غلاف كتيّب (يبدأ مادة متعددة الصفحات) ---------- */
{
  id: 'st_cover', type: 'study', name: 'كتيّب: الغلاف', tags: 'كتيب مادة ملف دراسي غلاف كتاب صفحات طباعة PDF', isNew: 1, book: true,
  sizes: ['a4'],
  variants: [{ id: 'block', name: 'كتلة لونية ونقش', sw: ['#ffffff', '#2b2b2b', '#2d4d24'] }, { id: 'full', name: 'غلاف كامل', sw: ['#2d4d24', '#ffffff', '#fbb03b'] }],
  colorLabels: { bg: 'لون الغلاف', title: 'لون العنوان', accent: 'لون التمييز' },
  fields: [
    { k: 'kicker', label: 'السلسلة', def: 'سلسلة البناء العلمي · ٣', max: 50 },
    { k: 'title', label: 'العنوان', kind: 'area', def: 'مختصر\nالسيرة النبوية', max: 60 },
    { k: 'sub', label: 'تحت العنوان', def: 'مادة مقررة على طلاب المستوى الأول', max: 80 },
    { k: 'author', label: 'الإعداد', def: 'إعداد: اللجنة العلمية', max: 50 },
    { k: 'edition', label: 'الطبعة أو السنة', def: 'الإصدار الأول · 1448 هـ', max: 40 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, s = stU(W, H), full = v === 'full';
    const base = OV.bg || (full ? C.pd : '#ffffff'), isD = isDark(base), ac = OV.accent || C.a;
    paintBg(ctx, W, H, base);
    const m = 90 * s, xr = W - m, cw = W - m * 2;
    G(ctx, 'deco');
    if (!full && !OV.bg) {
      // كتلة لونية في النصف العلوي بنقش نجمي
      const bh = H * 0.56; area(0, 0, W, bh);
      const g = ctx.createLinearGradient(W, 0, 0, bh); g.addColorStop(0, C.p); g.addColorStop(1, C.pd); ctx.fillStyle = g; ctx.fillRect(0, 0, W, bh);
      if (D()) { ctx.save(); ctx.globalAlpha = 0.13; ctx.beginPath(); ctx.rect(0, 0, W, bh); ctx.clip(); geoStar8(ctx, W, bh, '#ffffff', s * 1.4); ctx.restore(); fillRR(ctx, xr - 160 * s, bh - 6 * s, 160 * s, 12 * s, 6 * s, ac); }
    } else if (D()) { ctx.save(); ctx.globalAlpha = 0.09; geoStar8(ctx, W, H, '#ffffff', s * 1.4); ctx.restore(); ctx.save(); const g2 = ctx.createLinearGradient(0, H * 0.4, 0, H); g2.addColorStop(0, alpha(base, 0)); g2.addColorStop(1, alpha(base, 0.95)); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    G(ctx, 'logo'); drawLogo(ctx, T, xr, 80 * s, 200 * s, '#ffffff', 'tr');
    const topBand = !full && !OV.bg, y0 = topBand ? H * 0.56 + 90 * s : H * 0.42;
    const tColor = OV.title || (topBand ? C.pd : '#ffffff'), sub = topBand ? C.muted : alpha('#ffffff', 0.8);
    let y = y0;
    G(ctx, 'kicker'); if (has(d.kicker)) { const p = pill(ctx, d.kicker, xr, y + 20 * s, 24 * s, ac, stOn(ac, C), { bold: 0.8 }); void p; y += 72 * s; }
    const tf = fit(ctx, d.title, { maxW: cw, maxH: 360 * s, size: 112 * s * k, lh: 1.15, bold: 1, title: true });
    G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: tColor }); y += tf.h + 20 * s;
    G(ctx, 'sub'); if (has(d.sub)) { const f = fit(ctx, d.sub, { maxW: cw, size: 34 * s, lh: 1.45, maxLines: 2 }); drawFit(ctx, f, xr, y, { align: 'right', color: sub }); y += f.h; }
    G(ctx, 'footer');
    const fy = H - 120 * s;
    if (D()) hline(ctx, m, xr, fy - 40 * s, alpha(topBand ? C.p : '#ffffff', 0.18), 2 * s);
    line(ctx, d.author, xr, fy, { size: 28 * s, color: topBand ? C.ink : '#ffffff', align: 'right', bold: 0.8, maxW: cw * 0.55 });
    line(ctx, d.edition, m, fy, { size: 24 * s, color: sub, align: 'left', maxW: cw * 0.4 });
    academy(ctx, topBand ? C.muted : alpha('#ffffff', 0.7), W / 2 + 60 * s, H - 50 * s, 120 * s, 'br');
  }
},

/* ---------- م٩. صفحة مادة (صفحات الكتيّب) ---------- */
{
  id: 'st_page', type: 'study', name: 'كتيّب: صفحة', tags: 'كتيب مادة صفحة نص فصل درس عنوان فقرات طباعة', isNew: 1, book: true,
  sizes: ['a4'],
  variants: [{ id: 'plain', name: 'صفحة نص', sw: ['#ffffff', '#2b2b2b', '#467839'] }, { id: 'chapter', name: 'بداية فصل', sw: ['#ffffff', '#2b2b2b', '#2d4d24'] }],
  colorLabels: { bg: 'لون الورقة', title: 'لون العنوان', accent: 'اللون المميز' },
  fields: [
    { k: 'run', label: 'العنوان الجاري في أعلى الصفحة', def: 'مختصر السيرة النبوية', max: 50 },
    { k: 'num', label: 'رقم الفصل (لصفحة بداية الفصل)', def: 'الفصل الأول', max: 30 },
    { k: 'title', label: 'العنوان', kind: 'area', def: 'نسبه ﷺ ومولده', max: 80 },
    { k: 'body', label: 'النص (كل فقرة في سطر)', kind: 'area', def: 'هو محمد بن عبدالله بن عبدالمطلب بن هاشم، من قريش، أشرف العرب نسباً وأعلاهم مكانة.\nوُلد ﷺ بمكة عام الفيل، يوم الاثنين من شهر ربيع الأول، ومات أبوه قبل ولادته، فكفله جده عبدالمطلب ثم عمه أبو طالب.\n## من دروس المولد\nأن الله يهيئ لرسله أسباب النشأة الكريمة، وأن *اليتم لا يمنع العظمة* لمن أراد الله له الرفعة.\n> «أنا دعوة أبي إبراهيم، وبشرى عيسى» — رواه أحمد', max: 4000, hint: 'سطر يبدأ بـ ## عنوان فرعي، وسطر يبدأ بـ > اقتباس، وما بين *نجمتين* يُبرَز' }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, s = stU(W, H), ac = OV.accent || C.p;
    const base = stPaper(ctx, W, H, C, { base: '#ffffff' }), isD = isDark(base), fg = isD ? '#ffffff' : C.ink, mut = isD ? alpha('#ffffff', 0.65) : C.muted;
    const m = 100 * s, xr = W - m, cw = W - m * 2;
    // العنوان الجاري
    G(ctx, 'run');
    if (has(d.run)) line(ctx, d.run, xr, 70 * s, { size: 22 * s, color: mut, align: 'right', maxW: cw * 0.6 });
    G(ctx, 'logo'); drawLogo(ctx, T, m, 46 * s, 110 * s, isD ? '#ffffff' : 'color', 'tl');
    if (D()) hline(ctx, m, xr, 110 * s, alpha(fg, 0.1), 1.5 * s);
    let y = 160 * s;
    if (v === 'chapter') {
      y = 260 * s;
      G(ctx, 'num'); if (has(d.num)) { const f = line(ctx, d.num, xr, y, { size: 30 * s, color: ac, align: 'right', bold: 0.9 }); if (D()) hline(ctx, xr - f.w - 30 * s, xr - f.w - 160 * s, y, ac, 3 * s); y += 50 * s; }
      const tf = fit(ctx, d.title, { maxW: cw, maxH: 300 * s, size: 92 * s * k, lh: 1.2, bold: 1, title: true, balance: true });
      G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: OV.title || (isD ? '#ffffff' : C.pd) }); y += tf.h + 70 * s;
    } else if (has(d.title)) {
      const tf = fit(ctx, d.title, { maxW: cw, maxH: 200 * s, size: 56 * s * k, lh: 1.25, bold: 1, title: true });
      G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: OV.title || (isD ? '#ffffff' : C.pd) }); y += tf.h + 20 * s;
      if (D()) { fillRR(ctx, xr - 90 * s, y, 90 * s, 6 * s, 3 * s, ac); } y += 40 * s;
    }
    const paras = String(d.body || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    const bot = H - 130 * s;
    const run = function (q, draw) {
      let yy = y;
      paras.forEach(function (p, i) {
        if (/^##\s*/.test(p)) { const f = fit(ctx, p.replace(/^##\s*/, ''), { maxW: cw - 40 * s, size: 38 * s * q, maxLines: 2, bold: 1, title: true, lh: 1.3 }); yy += 16 * s * q; if (draw) { G(ctx, 'h' + i); fillRR(ctx, xr - 10 * s, yy + f.pt + 4 * s, 10 * s, f.size * 0.9, 4 * s, ac); drawFit(ctx, f, xr - 30 * s, yy, { align: 'right', color: isD ? '#ffffff' : C.pd }); } yy += f.h + 16 * s * q; return; }
        if (/^>\s*/.test(p)) { const f = fit(ctx, p.replace(/^>\s*/, ''), { maxW: cw - 120 * s, size: 32 * s * q, lh: 1.7, bold: 0.6, balance: true }); const h = f.h + 50 * s * q; if (draw) { G(ctx, 'qt' + i); fillRR(ctx, m, yy, cw, h, 20 * s, alpha(ac, 0.08)); line(ctx, '❞', m + 40 * s, yy + 40 * s * q, { size: 60 * s, color: alpha(ac, 0.5), align: 'center' }); drawFit(ctx, f, W / 2, yy + 25 * s * q, { align: 'center', color: isD ? '#ffffff' : C.pd, hl: ac }); area(m, yy, xr, yy + h); } yy += h + 26 * s * q; return; }
        const f = fit(ctx, p, { maxW: cw, size: 31 * s * q, lh: 1.85, bold: 0.25 });
        if (draw) { G(ctx, 'p' + i); drawFit(ctx, f, xr, yy, { align: 'right', color: fg, hl: ac }); }
        yy += f.h + 22 * s * q;
      });
      return yy - y;
    };
    const q = stScale(function (q) { return run(q, false); }, bot - y, 0.55);
    run(q, true);
    stFoot(ctx, W, H, T, d, { base: base, social: false });
  }
}

);
// أرقام عربية مشرقية (لا تعتمد على طقم خارطة الثغور)
function omArNum0(n) { return String(n).replace(/\d/g, function (x) { return '٠١٢٣٤٥٦٧٨٩'[+x]; }); }
