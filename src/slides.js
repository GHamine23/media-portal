/* ================= الشرائح: قوالب العروض ومحررها وتحميلها PDF ================= */
/* كل شريحة قالب عادي بمقاس slide، ونمط العرض (فاتح، ملوّن، داكن) مشترك بين الشرائح كلها */
const SL_VARS = [{ id: 'light', name: 'فاتح', sw: ['#f8f8f8', '#2b2b2b', '#467839'] }, { id: 'brand', name: 'ملوّن', sw: ['#2d4d24', '#ffffff', '#fbb03b'] }, { id: 'dark', name: 'داكن', sw: ['#33251c', '#ffffff', '#fbb03b'] }];
function slideBase(ctx, W, H, T, v, deco) {
  const C = T.c, u = W / 1920;
  const base = OV.bg || (v === 'brand' ? C.pd : v === 'dark' ? C.sdd : C.paper);
  const dark = isDark(base), fg = OV.title || (dark ? '#ffffff' : C.ink), body = dark ? alpha('#ffffff', 0.88) : '#3d3d3d';
  const ac = OV.accent || (dark ? C.a : C.p);
  paintBg(ctx, W, H, base);
  if (D() && deco !== false && !BGFX) quiet(function () {
    if (deco === 'x') xmark(ctx, W * 0.06, H * 0.92, H * 0.5, alpha(dark ? '#ffffff' : C.p, 0.06), 0.2);
    else petal(ctx, W * 0.97, H * 0.06, H * 0.32, 0.3, alpha(dark ? '#ffffff' : C.p, 0.06));
  });
  return { C: C, u: u, base: base, dark: dark, fg: fg, body: body, ac: ac, mut: dark ? alpha('#ffffff', 0.6) : '#8a8a8a' };
}
function slideFoot(ctx, W, H, T, b, d) {
  const u = b.u;
  G(ctx, 'logo'); const lg = drawLogo(ctx, T, W - 80 * u, H - 54 * u, 120 * u, b.dark ? '#ffffff' : 'color', 'br');
  G(ctx, 'footer'); academy(ctx, b.mut, 80 * u, H - 58 * u, 120 * u, 'bl');
  if (d.__n) line(ctx, String(d.__n), W / 2, H - 70 * u, { size: 26 * u, color: b.mut, align: 'center' });
  return lg;
}
const SLIDE_TPLS = [
{
  id: 'sl_cover', type: 'slide', hidden: true, name: 'الغلاف', sizes: ['slide'], variants: SL_VARS,
  fields: [{ k: 'kicker', label: 'السطر الصغير', def: 'لقاء تعريفي', max: 40 }, { k: 'title', label: 'العنوان', kind: 'area', def: 'عنوان العرض\nفي سطرين', max: 60 }, { k: 'sub', label: 'تحت العنوان', def: 'اسم المقدّم · التاريخ', max: 60 }],
  draw: function (ctx, W, H, d, T, v, k) {
    const b = slideBase(ctx, W, H, T, v, false), C = b.C, u = b.u;
    G(ctx, 'deco'); if (D()) { quiet(function () { const cols = [ACADEMY.orange, ACADEMY.red, ACADEMY.purple, ACADEMY.teal].map(function (c, i) { return [C.a2, C.a, C.p, C.pd][i] || c; }); cols.forEach(function (c, i) { fillRR(ctx, -60 * u, H * 0.18 + i * 120 * u, W * 0.36 - i * 40 * u, 92 * u, 46 * u, b.dark ? alpha(c, 0.85) : c); }); xmark(ctx, W * 0.2, H * 0.78, 150 * u, b.dark ? '#ffffff' : C.pd, 0.1); }); area(0, H * 0.18, W * 0.36, H * 0.86); }
    const xr = W - 150 * u;
    const tf = fit(ctx, d.title, { maxW: W * 0.52, maxH: H * 0.44, size: 140 * u * k, lh: 1.18, balance: true, bold: 1, title: true });
    const tot = (has(d.kicker) ? 80 * u : 0) + tf.h + (has(d.sub) ? 90 * u : 0);
    let y = (H - tot) / 2 - 20 * u;
    G(ctx, 'kicker'); if (has(d.kicker)) { pill(ctx, d.kicker, xr, y + 26 * u, 34 * u, b.ac, onBg(b.ac)); y += 80 * u; }
    G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: b.fg, hl: b.ac }); y += tf.h;
    G(ctx, 'sub'); if (has(d.sub)) line(ctx, d.sub, xr, y + 56 * u, { size: 44 * u, color: b.body, align: 'right', maxW: W * 0.52 });
    G(ctx, 'logo'); drawLogo(ctx, T, xr, 80 * u, 170 * u, b.dark ? '#ffffff' : 'color', 'tr');
    G(ctx, 'footer'); academy(ctx, b.mut, xr, H - 70 * u, 130 * u, 'br');
  }
},
{
  id: 'sl_section', type: 'slide', hidden: true, name: 'فاصل قسم', sizes: ['slide'], variants: SL_VARS,
  fields: [{ k: 'num', label: 'الرقم', def: '01', max: 4 }, { k: 'title', label: 'عنوان القسم', kind: 'area', def: 'المحور الأول', max: 50 }, { k: 'sub', label: 'سطر تحته', def: 'وصف قصير للمحور', max: 70 }],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1920;
    const base = OV.bg || (v === 'light' ? C.p : v === 'dark' ? C.sdd : C.pd), fg = OV.title || onBg(base), ac = OV.accent || C.a;
    paintBg(ctx, W, H, base);
    G(ctx, 'deco'); if (D()) { quiet(function () { xmark(ctx, W * 0.16, H * 0.5, H * 0.9, alpha(fg, 0.07), 0.15); }); }
    const xr = W - 170 * u;
    G(ctx, 'num'); let y = H * 0.3;
    if (has(d.num)) { line(ctx, d.num, xr, y, { size: 150 * u, color: ac, align: 'right', bold: 1, title: true }); y += 130 * u; }
    const tf = fit(ctx, d.title, { maxW: W * 0.62, maxH: H * 0.32, size: 120 * u * k, lh: 1.2, balance: true, bold: 1, title: true });
    G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: fg }); y += tf.h;
    G(ctx, 'sub'); if (has(d.sub)) line(ctx, d.sub, xr, y + 60 * u, { size: 44 * u, color: alpha(fg, 0.8), align: 'right', maxW: W * 0.62 });
    G(ctx, 'logo'); drawLogo(ctx, T, 90 * u, H - 60 * u, 120 * u, fg === '#ffffff' ? '#ffffff' : 'color', 'bl');
  }
},
{
  id: 'sl_points', type: 'slide', hidden: true, name: 'نقاط', sizes: ['slide'], variants: SL_VARS,
  fields: [{ k: 'title', label: 'العنوان', def: 'أهداف اللقاء', max: 50 }, { k: 'body', label: 'النقاط: كل نقطة في سطر', kind: 'area', def: 'نتعرف على المسار وأهدافه\nنضع خطة الأسابيع الأولى\nنتفق على قواعد المجموعة\nنجيب عن أسئلتكم', max: 600, hint: 'حتى ثماني نقاط. ما بين *نجمتين* يظهر بلون مميز' }],
  draw: function (ctx, W, H, d, T, v, k) {
    const b = slideBase(ctx, W, H, T, v), C = b.C, u = b.u, xr = W - 150 * u;
    const tf = fit(ctx, d.title, { maxW: W * 0.8, size: 92 * u * k, maxLines: 1, bold: 1, title: true, lh: 1.3 });
    G(ctx, 'title'); drawFit(ctx, tf, xr, 110 * u, { align: 'right', color: b.fg });
    if (D()) fillRR(ctx, xr - 120 * u, 110 * u + tf.h + 18 * u, 120 * u, 10 * u, 5 * u, b.ac);
    const it = lines(d.body).slice(0, 8), two = it.length > 4, per = two ? Math.ceil(it.length / 2) : it.length;
    const top = 110 * u + tf.h + 90 * u, avail = H - top - 160 * u, rh = Math.min(175 * u, avail / per);
    const colW = two ? (W - 300 * u - 80 * u) / 2 : W - 300 * u;
    G(ctx, 'body');
    it.forEach(function (t, i) {
      const col = Math.floor(i / per), row = i % per, x = xr - col * (colW + 80 * u), y = top + row * rh + rh / 2;
      ctx.beginPath(); ctx.arc(x - 30 * u, y, 30 * u, 0, Math.PI * 2); ctx.fillStyle = b.dark ? alpha(b.ac, 0.9) : alpha(b.ac, 0.14); ctx.fill();
      line(ctx, String(i + 1), x - 30 * u, y, { size: 30 * u, color: b.dark ? onBg(b.ac) : b.ac, align: 'center', bold: 0.8 });
      const f = fit(ctx, t, { maxW: colW - 110 * u, maxH: rh * 0.92, size: (two ? 50 : 58) * u, lh: 1.35, bold: 0.2 });
      drawFit(ctx, f, x - 90 * u, y - f.h / 2, { align: 'right', color: b.body, hl: b.ac });
    });
    slideFoot(ctx, W, H, T, b, d);
  }
},
{
  id: 'sl_two', type: 'slide', hidden: true, name: 'عمودان', sizes: ['slide'], variants: SL_VARS,
  fields: [{ k: 'title', label: 'العنوان', def: 'بين الأمس واليوم', max: 50 }, { k: 'h1', label: 'العمود الأول: العنوان', def: 'ما أنجزناه', half: 1 }, { k: 'b1', label: 'نصه', kind: 'area', def: 'ختمنا المتن الأول\nوأقمنا ثلاث ديوانيات', half: 1 }, { k: 'h2', label: 'العمود الثاني: العنوان', def: 'ما ينتظرنا', half: 1 }, { k: 'b2', label: 'نصه', kind: 'area', def: 'مسابقة الحفظ الكبرى\nورحلة نهاية الفصل', half: 1 }],
  draw: function (ctx, W, H, d, T, v, k) {
    const b = slideBase(ctx, W, H, T, v), C = b.C, u = b.u, xr = W - 150 * u;
    const tf = fit(ctx, d.title, { maxW: W * 0.8, size: 92 * u * k, maxLines: 1, bold: 1, title: true, lh: 1.3 });
    G(ctx, 'title'); drawFit(ctx, tf, xr, 110 * u, { align: 'right', color: b.fg });
    const top = 110 * u + tf.h + 80 * u, bw = (W - 300 * u - 70 * u) / 2, bh = H - top - 170 * u;
    G(ctx, 'boxes');
    [[d.h1, d.b1, b.ac], [d.h2, d.b2, b.dark ? C.pl : C.s]].forEach(function (c, i) {
      const x = xr - bw - i * (bw + 70 * u);
      fillRR(ctx, x, top, bw, bh, 36 * u, b.dark ? alpha('#ffffff', 0.07) : '#ffffff');
      if (!b.dark) { rrect(ctx, x, top, bw, bh, 36 * u); ctx.strokeStyle = '#ececec'; ctx.lineWidth = 2 * u; ctx.stroke(); }
      fillRR(ctx, x + bw - 16 * u, top + 50 * u, 16 * u, 90 * u, 8 * u, c[2]);
      area(x, top, x + bw, top + bh);
      line(ctx, c[0], x + bw - 60 * u, top + 95 * u, { size: 58 * u, color: b.fg, align: 'right', bold: 0.9, title: true, maxW: bw - 100 * u });
      const f = fit(ctx, c[1], { maxW: bw - 120 * u, maxH: bh - 220 * u, size: 44 * u, lh: 1.6 });
      drawFit(ctx, f, x + bw - 60 * u, top + 180 * u, { align: 'right', color: b.body, hl: b.ac });
    });
    slideFoot(ctx, W, H, T, b, d);
  }
},
{
  id: 'sl_quote', type: 'slide', hidden: true, name: 'عبارة', sizes: ['slide'], variants: SL_VARS,
  fields: [{ k: 'body', label: 'العبارة', kind: 'area', def: 'ومن سلك طريقاً يلتمس فيه علماً\nسهّل الله له به *طريقاً إلى الجنة*', max: 220 }, { k: 'src', label: 'المصدر', def: 'رواه مسلم', max: 40 }],
  draw: function (ctx, W, H, d, T, v, k) {
    const b = slideBase(ctx, W, H, T, v, 'x'), u = b.u;
    G(ctx, 'deco'); if (D()) { ctx.save(); ctx.translate(W / 2, H * 0.2); STICKERS.quote.draw(ctx, 130 * u, b.ac); ctx.restore(); box('deco', W / 2 - 70 * u, H * 0.2 - 70 * u, W / 2 + 70 * u, H * 0.2 + 70 * u, 'q'); }
    const f = fit(ctx, d.body, { maxW: W * 0.72, maxH: H * 0.46, size: 84 * u * k, lh: 1.55, balance: true, bold: 0.6, title: true });
    G(ctx, 'body'); drawFit(ctx, f, W / 2, H * 0.53 - f.h / 2, { align: 'center', color: b.fg, hl: b.ac });
    G(ctx, 'sub'); if (has(d.src)) line(ctx, '— ' + d.src, W / 2, H * 0.53 + f.h / 2 + 70 * u, { size: 40 * u, color: b.mut, align: 'center' });
    slideFoot(ctx, W, H, T, b, d);
  }
},
{
  id: 'sl_image', type: 'slide', hidden: true, name: 'صورة ونص', sizes: ['slide'], variants: SL_VARS,
  fields: [{ k: 'photo', label: 'الصورة', kind: 'image', def: 'img_mosque' }, { k: 'title', label: 'العنوان', kind: 'area', def: 'المسجد النبوي', max: 50 }, { k: 'body', label: 'النص', kind: 'area', def: 'نص قصير يشرح الصورة أو يربطها بموضوع اللقاء، في سطرين أو ثلاثة.', max: 300 }],
  draw: function (ctx, W, H, d, T, v, k, P) {
    const b = slideBase(ctx, W, H, T, v, false), u = b.u;
    const iw = W * 0.46;
    G(ctx, 'photo'); if (P.photo) { ctx.save(); rrect(ctx, 70 * u, 70 * u, iw - 70 * u, H - 140 * u, 40 * u); ctx.clip(); ctx.fillStyle = b.dark ? alpha('#ffffff', 0.06) : '#ebe7e1'; ctx.fillRect(0, 0, W, H); drawPhoto(ctx, P.photo.im, 70 * u, 70 * u, iw - 70 * u, H - 140 * u, { fit: P.photo.lib ? 'contain' : 'cover', z: P.photo.z, ox: P.photo.ox, oy: P.photo.oy }); ctx.restore(); }
    const xr = W - 150 * u, cw = W - iw - 250 * u;
    const tf = fit(ctx, d.title, { maxW: cw, maxH: H * 0.3, size: 100 * u * k, lh: 1.2, balance: true, bold: 1, title: true });
    const bf = fit(ctx, d.body, { maxW: cw, maxH: H * 0.4, size: 46 * u, lh: 1.65 });
    let y = (H - tf.h - bf.h - 60 * u) / 2;
    G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: b.fg }); y += tf.h + 20 * u;
    if (D()) { fillRR(ctx, xr - 110 * u, y, 110 * u, 10 * u, 5 * u, b.ac); }
    y += 40 * u;
    G(ctx, 'body'); drawFit(ctx, bf, xr, y, { align: 'right', color: b.body, hl: b.ac });
    G(ctx, 'logo'); drawLogo(ctx, T, xr, H - 54 * u, 120 * u, b.dark ? '#ffffff' : 'color', 'br');
  }
},
{
  id: 'sl_numbers', type: 'slide', hidden: true, name: 'أرقام', sizes: ['slide'], variants: SL_VARS,
  fields: [{ k: 'title', label: 'العنوان', def: 'حصاد الفصل', max: 50 }, { k: 'n1', label: 'الرقم الأول', def: '120', half: 1 }, { k: 'l1', label: 'وصفه', def: 'طالباً مشاركاً', half: 1 }, { k: 'n2', label: 'الرقم الثاني', def: '36', half: 1 }, { k: 'l2', label: 'وصفه', def: 'لقاءً مباشراً', half: 1 }, { k: 'n3', label: 'الرقم الثالث', def: '9', half: 1 }, { k: 'l3', label: 'وصفه', def: 'متون محفوظة', half: 1 }],
  draw: function (ctx, W, H, d, T, v, k) {
    const b = slideBase(ctx, W, H, T, v), C = b.C, u = b.u, xr = W - 150 * u;
    const tf = fit(ctx, d.title, { maxW: W * 0.8, size: 92 * u * k, maxLines: 1, bold: 1, title: true, lh: 1.3 });
    G(ctx, 'title'); drawFit(ctx, tf, xr, 110 * u, { align: 'right', color: b.fg });
    const items = [[d.n1, d.l1], [d.n2, d.l2], [d.n3, d.l3]].filter(function (x) { return has(x[0]) || has(x[1]); });
    const n = Math.max(1, items.length), cw = (W - 300 * u - (n - 1) * 60 * u) / n, cy = H * 0.56;
    const cols = [b.ac, b.dark ? C.pl : C.s, C.a2];
    G(ctx, 'boxes');
    items.forEach(function (x, i) {
      const cx = xr - cw / 2 - i * (cw + 60 * u);
      area(cx - cw / 2, cy - 200 * u, cx + cw / 2, cy + 160 * u);
      line(ctx, x[0], cx, cy - 60 * u, { size: 190 * u, color: cols[i % 3], align: 'center', bold: 1, title: true, maxW: cw });
      line(ctx, x[1], cx, cy + 110 * u, { size: 48 * u, color: b.body, align: 'center', maxW: cw });
      if (i < n - 1) vline(ctx, cx - cw / 2 - 30 * u, cy - 160 * u, cy + 140 * u, b.dark ? alpha('#ffffff', 0.15) : '#e6e6e6', 3 * u);
    });
    slideFoot(ctx, W, H, T, b, d);
  }
},
{
  id: 'sl_end', type: 'slide', hidden: true, name: 'الختام', sizes: ['slide'], variants: SL_VARS,
  fields: [{ k: 'title', label: 'العنوان', kind: 'area', def: 'شكراً لحضوركم', max: 40 }, { k: 'sub', label: 'تحته', def: 'نلتقي في اللقاء القادم بإذن الله', max: 70 }],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1920;
    const base = OV.bg || (v === 'light' ? C.paper : v === 'dark' ? C.sdd : C.pd), dark = isDark(base), fg = OV.title || (dark ? '#ffffff' : C.pd);
    paintBg(ctx, W, H, base);
    G(ctx, 'deco'); if (D()) { quiet(function () { petal(ctx, W * 0.1, H * 0.85, H * 0.4, 0.3, alpha(dark ? '#ffffff' : C.p, 0.08)); petal(ctx, W * 0.9, H * 0.15, H * 0.25, 0.1, alpha(dark ? '#ffffff' : C.p, 0.08)); }); }
    G(ctx, 'logo'); const lg = drawLogo(ctx, T, W / 2, H * 0.16, 260 * u, dark ? '#ffffff' : 'color', 'tc');
    const tf = fit(ctx, d.title, { maxW: W * 0.7, maxH: H * 0.3, size: 140 * u * k, lh: 1.2, balance: true, bold: 1, title: true });
    const y = Math.max(H * 0.16 + (lg.h || 0) + 70 * u, H * 0.48 - tf.h / 2);
    G(ctx, 'title'); drawFit(ctx, tf, W / 2, y, { align: 'center', color: fg });
    G(ctx, 'sub'); if (has(d.sub)) line(ctx, d.sub, W / 2, y + tf.h + 60 * u, { size: 46 * u, color: dark ? alpha('#ffffff', 0.8) : '#555555', align: 'center', maxW: W * 0.7 });
    G(ctx, 'footer'); academy(ctx, dark ? alpha('#ffffff', 0.7) : '#8a8a8a', W / 2 + 65 * u, H - 70 * u, 130 * u, 'br'); social(ctx, dark ? alpha('#ffffff', 0.7) : '#8a8a8a', W / 2 - 65 * u, H - 70 * u, 130 * u, 'bl');
  }
}
];
SLIDE_TPLS.forEach(function (t) { TEMPLATES.push(t); });
function slideTpl(id) { return TEMPLATES.find(function (t) { return t.id === id; }) || TEMPLATES.find(function (t) { return t.id === 'sl_points'; }); }

/* ---------- نماذج عروض جاهزة ---------- */
function sampleDecks(T) {
  const S1 = function (tpl, d) { return { id: newId(), tpl: tpl, d: Object.assign(defaults(slideTpl(tpl), T), d || {}), pos: {}, layers: [], hide: {} }; };
  return [
    { name: 'لقاء تعريفي بالمسار', style: 'light', slides: [
      S1('sl_cover', { kicker: 'اللقاء الأول', title: 'أهلاً بكم في\n' + T.full.replace('ـ', ''), sub: 'لقاء تعريفي · المرحلة الأولى' }),
      S1('sl_points', { title: 'ماذا سنفعل اليوم؟', body: 'نتعارف ونكسر الحواجز\nنعرض أهداف المسار\nنشرح نظام المتابعة اليومي\nنجيب عن أسئلتكم' }),
      S1('sl_section', { num: '01', title: 'أهداف المسار', sub: 'لماذا نحن هنا؟' }),
      S1('sl_two', { title: 'كيف نسير؟', h1: 'اليومي', b1: 'مقرر قصير كل يوم\nومتابعة في المجموعة', h2: 'الأسبوعي', b2: 'لقاء مباشر\nومسابقة ومراجعة' }),
      S1('sl_quote', {}),
      S1('sl_end', {})
    ] },
    { name: 'درس أو محاضرة', style: 'brand', slides: [
      S1('sl_cover', { kicker: 'محاضرة', title: 'عنوان المحاضرة', sub: 'أ. اسم المحاضر' }),
      S1('sl_points', { title: 'محاور المحاضرة', body: 'المحور الأول\nالمحور الثاني\nالمحور الثالث' }),
      S1('sl_section', { num: '01', title: 'المحور الأول', sub: '' }),
      S1('sl_image', {}),
      S1('sl_quote', {}),
      S1('sl_end', { title: 'جزاكم الله خيراً', sub: 'الأسئلة والنقاش' })
    ] },
    { name: 'تقرير إنجاز', style: 'dark', slides: [
      S1('sl_cover', { kicker: 'تقرير', title: 'حصاد الفصل الأول', sub: T.full.replace('ـ', '') }),
      S1('sl_numbers', {}),
      S1('sl_two', { title: 'أبرز ما تم', h1: 'البرامج', b1: 'ثلاث ديوانيات\nومسابقتا حفظ', h2: 'المشاركة', b2: 'حضور فاق ٨٠٪\nوتفاعل مستمر' }),
      S1('sl_points', { title: 'خطة الفصل القادم', body: 'إطلاق مسابقة كبرى\nزيادة اللقاءات المباشرة\nتكريم المتميزين' }),
      S1('sl_end', {})
    ] }
  ];
}
/* المساعد: من مخطط نصي إلى عرض كامل
   # عنوان العرض     ## قسم     - نقطة     > عبارة     رقم: وصف */
function deckFromOutline(txt, T) {
  const S1 = function (tpl, d) { return { id: newId(), tpl: tpl, d: Object.assign(defaults(slideTpl(tpl), T), d), pos: {}, layers: [], hide: {} }; };
  const out = []; let cur = null, nums = [], sec = 0;
  function flush() {
    if (cur && cur.pts.length) out.push(S1('sl_points', { title: cur.title || 'نقاط', body: cur.pts.join('\n') }));
    if (nums.length) { const d = { title: (cur && cur.title) || 'بالأرقام' }; nums.slice(0, 3).forEach(function (n, i) { d['n' + (i + 1)] = n[0]; d['l' + (i + 1)] = n[1]; }); for (let i = nums.length; i < 3; i++) { d['n' + (i + 1)] = ''; d['l' + (i + 1)] = ''; } out.push(S1('sl_numbers', d)); }
    cur = null; nums = [];
  }
  String(txt || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean).forEach(function (l, i) {
    let m;
    if ((m = l.match(/^#\s*([^#].*)$/)) && !out.length && !cur) { out.push(S1('sl_cover', { kicker: '', title: m[1], sub: '' })); return; }
    if ((m = l.match(/^##\s*(.+)$/))) { flush(); sec++; out.push(S1('sl_section', { num: ('0' + sec).slice(-2), title: m[1], sub: '' })); cur = { title: m[1], pts: [] }; return; }
    if ((m = l.match(/^[>«"]\s*(.+?)["»]?$/))) { flush(); out.push(S1('sl_quote', { body: m[1], src: '' })); return; }
    if ((m = l.match(/^[-–•*]\s*(.+)$/))) { if (!cur) cur = { title: out.length ? 'نقاط' : '', pts: [] }; cur.pts.push(m[1]); if (cur.pts.length === 6) { const t = cur.title; flush(); cur = { title: t, pts: [] }; } return; }
    if ((m = l.match(/^([0-9٠-٩٪%.,+]+)\s*[:：-]\s*(.+)$/))) { nums.push([m[1], m[2]]); return; }
    if (!out.length) { out.push(S1('sl_cover', { kicker: '', title: l, sub: '' })); return; }
    if (out.length && out[out.length - 1].tpl === 'sl_cover' && !has(out[out.length - 1].d.sub)) { out[out.length - 1].d.sub = l; return; }
    if (!cur) cur = { title: l, pts: [] }; else if (!cur.title) cur.title = l; else cur.pts.push(l);
  });
  flush();
  if (!out.length) return null;
  if (out[0].tpl !== 'sl_cover') out.unshift(S1('sl_cover', { kicker: '', title: 'عنوان العرض', sub: '' }));
  out.push(S1('sl_end', {}));
  return out;
}

/* ---------- صفحة العروض ---------- */
async function showSlides() {
  const T = S.track;
  document.title = 'الشرائح — ' + T.name;
  const list = el('div', { class: 'gallery decks' }, [el('p', { class: 'note', text: 'جارٍ التحميل…' })]);
  const outline = el('textarea', { rows: '9', class: 'outline', placeholder: '# عنوان العرض\nاسم المقدّم\n## المحور الأول\n- نقطة\n- نقطة\n> عبارة مؤثرة\n120: طالباً مشاركاً\n## المحور الثاني\n- نقطة' });
  const samples = sampleDecks(T);
  main(
    navbar([{ t: 'الرئيسية', href: '#/' }, { t: T.full.replace('ـ', ''), href: '#/' + T.id }, { t: 'الشرائح' }], '#/' + T.id),
    el('section', { class: 'shead' }, [el('h1', { text: 'عروض الشرائح' }), el('p', { text: 'جهّز عرض لقائك أو محاضرتك بهوية ' + T.name + '، ثم حمّله ملف PDF يُعرض على أي جهاز.' })]),
    el('div', { class: 'deckstart' }, [
      el('div', { class: 'dcol' }, [
        el('h2', { class: 'h', text: 'ابدأ من نموذج' }),
        el('div', { class: 'gallery samples' }, samples.map(function (sm, i) {
          const cv = el('canvas');
          setTimeout(function () { renderTo(cv, slideTpl(sm.slides[0].tpl), 'slide', { d: sm.slides[0].d, variant: sm.style, k: 1 }, T, 0.2); }, 30 * i);
          return el('button', { type: 'button', class: 'tcard', onclick: function () { newDeck(sm.name, sm.style, sm.slides); } }, [el('div', { class: 'thumb wide' }, [cv]), el('div', { class: 'tmeta' }, [el('b', { text: sm.name }), el('span', { text: sm.slides.length + ' شرائح' })])]);
        }).concat([el('button', { type: 'button', class: 'tcard blankd', onclick: function () { const s = sampleDecks(T)[0].slides; newDeck('عرض جديد', 'light', [s[0], s[s.length - 1]]); } }, [el('div', { class: 'thumb wide' }, [el('span', { class: 'plus', text: '+' })]), el('div', { class: 'tmeta' }, [el('b', { text: 'عرض فارغ' }), el('span', { text: 'غلاف وختام' })])])]))
      ]),
      el('div', { class: 'dcol side' }, [
        el('h2', { class: 'h', text: 'أو دع المساعد يبنيه' }),
        el('p', { class: 'note', text: 'اكتب مخطط عرضك كما في المثال: # للعنوان، ## للأقسام، - للنقاط، > للعبارة، و«رقم: وصف» للأرقام. فيبني المساعد الشرائح وتعدّلها بعد ذلك.' }),
        outline,
        el('button', { type: 'button', class: 'btn main', text: 'ابنِ العرض', onclick: function () { const sl = deckFromOutline(outline.value, T); if (!sl) { toast('اكتب المخطط أولاً'); return; } newDeck((sl[0].d.title || 'عرضي').split('\n')[0], 'light', sl); } })
      ])
    ]),
    el('h2', { class: 'h', text: 'عروضي' }), list
  );
  window.scrollTo(0, 0);
  let items = [];
  try { items = (await STORE.list()).filter(function (x) { return x.kind === 'deck' && (!x.track || x.track === T.id); }); } catch (e) {}
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.indexOf('jz1.deck.') !== 0) continue; const dk = JSON.parse(localStorage.getItem(k)); if (dk && dk.track === T.id && !items.some(function (x) { return x.id === dk.id; })) items.push({ id: dk.id, name: dk.name, at: dk.at, local: dk }); } } catch (e) {}
  items.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
  list.innerHTML = '';
  if (!items.length) { list.appendChild(el('p', { class: 'empty', text: 'لا عروض بعد. ابدأ من نموذج أو من المساعد.' })); return; }
  items.forEach(function (x) {
    let th = el('img', { src: x.thumb || '', alt: x.name });
    if (x.local) { th = el('canvas'); const s0 = x.local.slides[0]; setTimeout(function () { renderTo(th, slideTpl(s0.tpl), 'slide', { d: s0.d, variant: x.local.style, ov: x.local.ov, k: s0.k || 1, hide: s0.hide, pos: s0.pos, layers: s0.layers }, T, 0.16); }, 20); }
    list.appendChild(el('div', { class: 'tcard' }, [
      el('a', { href: '#/' + T.id + '/d/' + x.id, class: 'thumb wide' }, [th]),
      el('div', { class: 'tmeta' }, [el('b', { text: x.name }), el('span', { text: new Date(x.at || Date.now()).toLocaleDateString('ar-EG') + (x.local ? ' · في هذا المتصفح' : '') }),
        el('button', { type: 'button', class: 'link small', text: 'حذف', onclick: async function () { if (!confirmInline(this)) return; try { localStorage.removeItem('jz1.deck.' + x.id); } catch (e) {} if (!x.local) await STORE.del(x.id); showSlides(); } })])
    ]));
  });
}
async function newDeck(name, style, slides) {
  const T = S.track;
  const deck = { id: newId() + newId(), kind: 'deck', name: name, track: T.id, style: style, ov: {}, slides: JSON.parse(JSON.stringify(slides)), at: Date.now() };
  deck.slides.forEach(function (s) { s.id = newId(); });
  store('jz1.deck.' + deck.id, deck);
  location.hash = '#/' + T.id + '/d/' + deck.id;
}
async function openDeck(id) {
  const T = S.track;
  let deck = store('jz1.deck.' + id);
  if (!deck) { try { const it = await STORE.get(id); if (it) deck = it.deck || it; } catch (e) {} }
  if (!deck || !deck.slides) { location.hash = '#/' + T.id + '/slides'; return; }
  S.deck = deck; S.slideI = Math.min(S.slideI || 0, deck.slides.length - 1); if (S.deckId !== id) S.slideI = 0; S.deckId = id;
  S.mine = null; S.tab = 'content';
  document.title = deck.name + ' — الشرائح';
  pv = null; newPv();
  OVL = el('canvas', { class: 'ovl', 'aria-hidden': 'true' });
  const nameI = el('input', { type: 'text', class: 'dname', value: deck.name, 'aria-label': 'اسم العرض', oninput: function (e) { deck.name = e.target.value; saveDeck(); } });
  main(
    navbar([{ t: 'الرئيسية', href: '#/' }, { t: T.full.replace('ـ', ''), href: '#/' + T.id }, { t: 'الشرائح', href: '#/' + T.id + '/slides' }, { t: deck.name }], '#/' + T.id + '/slides'),
    el('div', { class: 'deck' }, [
      el('div', { class: 'dtop' }, [nameI, el('span', { class: 'dsaved', id: 'dsaved', text: 'محفوظ' })]),
      el('div', { class: 'strip', id: 'strip' }),
      el('div', { class: 'editor' }, [
        el('aside', { class: 'side', id: 'side' }),
        el('section', { class: 'view' }, [
          el('div', { class: 'stage wide' }, [pv, OVL]),
          el('div', { class: 'selbar', id: 'selbar', hidden: true }),
          el('div', { class: 'opts', id: 'opts' }),
          el('div', { class: 'actions' }, [
            el('button', { type: 'button', class: 'btn main', onclick: exportPdf }, [dlIcon(), el('span', { class: 'lg', text: 'تحميل العرض PDF' }), el('span', { class: 'sm', text: 'PDF' })]),
            el('button', { type: 'button', class: 'btn', onclick: function () { exportImg('png'); } }, [el('span', { class: 'lg', text: 'هذه الشريحة صورة' }), el('span', { class: 'sm', text: 'صورة' })]),
            el('button', { type: 'button', class: 'btn', onclick: saveDeckRemote }, [el('span', { class: 'lg', text: 'حفظ في عروضي' }), el('span', { class: 'sm', text: 'حفظ' })]),
            el('span', { class: 'sp' }),
            el('button', { type: 'button', class: 'btn', onclick: presentDeck }, [el('span', { class: 'lg', text: 'عرض بملء الشاشة' }), el('span', { class: 'sm', text: 'عرض' })])
          ])
        ])
      ])
    ])
  );
  loadSlide(S.slideI); buildStrip();
  window.scrollTo(0, 0);
  setTimeout(function () { startTour('deck'); }, 700);
}
function loadSlide(i) {
  const deck = S.deck, sl = deck.slides[i]; if (!sl) return;
  S.slideI = i; S.tpl = slideTpl(sl.tpl); S.type = 'slide'; S.size = 'slide'; S.k = sl.k || 1;
  S.d = sl.d; S.d.__n = i ? String(i + 1) : ''; S.variant = deck.style; S.ov = deck.ov || {}; S.hide = sl.hide || {}; S.pos = sl.pos || {}; S.layers = sl.layers || []; S.bgfx = deck.bgfx || null; S.sel = null;
  S.curKey = 'jz1.deck.' + deck.id;
  buildEditor(); schedule();
  Array.from(document.querySelectorAll('.strip .sl')).forEach(function (b, j) { b.classList.toggle('on', j === i); });
}
let deckT = 0;
function saveDeck() {
  const deck = S.deck; if (!deck) return;
  const sl = deck.slides[S.slideI];
  if (sl) { sl.d = S.d; sl.pos = S.pos; sl.layers = S.layers; sl.hide = S.hide; sl.k = S.k; sl.tpl = S.tpl.id; }
  deck.ov = S.ov; deck.style = S.variant; deck.bgfx = S.bgfx; deck.at = Date.now();
  const sv = $('#dsaved'); if (sv) sv.textContent = 'جارٍ الحفظ…';
  clearTimeout(deckT);
  deckT = setTimeout(function () {
    try { localStorage.setItem('jz1.deck.' + deck.id, JSON.stringify(deck)); if (sv) sv.textContent = 'محفوظ في هذا المتصفح'; }
    catch (e) { if (sv) sv.textContent = 'تعذّر الحفظ المحلي (صورة كبيرة؟) — احفظه في «عروضي»'; }
    refreshThumb(S.slideI);
  }, 400);
}
async function saveDeckRemote() {
  saveDeck();
  const deck = S.deck, c = document.createElement('canvas');
  const s0 = deck.slides[0];
  renderTo(c, slideTpl(s0.tpl), 'slide', { d: s0.d, variant: deck.style, ov: deck.ov, k: s0.k || 1, hide: s0.hide, pos: s0.pos, layers: s0.layers }, S.track, 0.16);
  const item = { id: deck.id, kind: 'deck', name: deck.name, track: deck.track, tpl: 'deck', thumb: c.toDataURL('image/jpeg', 0.75), deck: deck, at: Date.now(), owner: USER ? USER.name : '' };
  try { await STORE.save(item); toast('حُفظ العرض في «عروضي».'); } catch (e) { toast(e.message || String(e)); }
}
function stripThumb(i) {
  const deck = S.deck, sl = deck.slides[i], c = el('canvas');
  setTimeout(function () { sl.d.__n = i ? String(i + 1) : ''; renderTo(c, slideTpl(sl.tpl), 'slide', { d: sl.d, variant: deck.style, ov: deck.ov, k: sl.k || 1, hide: sl.hide, pos: sl.pos, layers: sl.layers, bgfx: deck.bgfx }, S.track, 0.1); }, 10 + i * 12);
  return c;
}
function refreshThumb(i) {
  const b = document.querySelectorAll('.strip .sl')[i]; if (!b) return;
  const c = b.querySelector('canvas'), deck = S.deck, sl = deck.slides[i];
  renderTo(c, slideTpl(sl.tpl), 'slide', { d: sl.d, variant: deck.style, ov: deck.ov, k: sl.k || 1, hide: sl.hide, pos: sl.pos, layers: sl.layers, bgfx: deck.bgfx }, S.track, 0.1);
}
function buildStrip() {
  const strip = $('#strip'), deck = S.deck; if (!strip) return;
  strip.innerHTML = '';
  deck.slides.forEach(function (sl, i) {
    strip.appendChild(el('div', { class: 'slw' }, [
      el('button', { type: 'button', class: 'sl' + (i === S.slideI ? ' on' : ''), title: 'الشريحة ' + (i + 1), onclick: function () { saveDeck(); loadSlide(i); } }, [stripThumb(i), el('small', { text: String(i + 1) })]),
      i === S.slideI ? el('div', { class: 'slops' }, [
        el('button', { type: 'button', title: 'تقديمها', 'aria-label': 'تقديم الشريحة', text: '→', disabled: i === 0, onclick: function () { moveSlide(i, -1); } }),
        el('button', { type: 'button', title: 'تكرارها', 'aria-label': 'تكرار الشريحة', text: '⧉', onclick: function () { saveDeck(); const c = JSON.parse(JSON.stringify(deck.slides[i])); c.id = newId(); deck.slides.splice(i + 1, 0, c); saveDeck(); loadSlide(i + 1); buildStrip(); } }),
        el('button', { type: 'button', title: 'حذفها', 'aria-label': 'حذف الشريحة', text: '×', disabled: deck.slides.length < 2, onclick: function () { deck.slides.splice(i, 1); loadSlide(Math.max(0, i - 1)); saveDeck(); buildStrip(); } }),
        el('button', { type: 'button', title: 'تأخيرها', 'aria-label': 'تأخير الشريحة', text: '←', disabled: i === deck.slides.length - 1, onclick: function () { moveSlide(i, 1); } })
      ]) : null
    ]));
  });
  strip.appendChild(el('button', { type: 'button', class: 'sladd', title: 'شريحة جديدة', onclick: addSlideMenu }, ['+', el('small', { text: 'شريحة' })]));
}
function moveSlide(i, dir) {
  saveDeck(); const deck = S.deck, j = i + dir; if (j < 0 || j >= deck.slides.length) return;
  const t = deck.slides[i]; deck.slides[i] = deck.slides[j]; deck.slides[j] = t;
  loadSlide(j); saveDeck(); buildStrip();
}
function addSlideMenu() {
  saveDeck();
  const old = $('.saved'); if (old) old.remove();
  const T = S.track, deck = S.deck;
  const dlg = el('div', { class: 'saved', role: 'dialog', 'aria-label': 'شريحة جديدة' }, [el('div', { class: 'sv wide' }, [
    el('div', { class: 'sbh' }, [el('b', { text: 'اختر تخطيط الشريحة' }), el('button', { type: 'button', class: 'x', text: '×', 'aria-label': 'إغلاق', onclick: function () { dlg.remove(); } })]),
    el('div', { class: 'layouts' }, SLIDE_TPLS.map(function (t) {
      const c = el('canvas');
      setTimeout(function () { renderTo(c, t, 'slide', { d: defaults(t, T), variant: deck.style, ov: deck.ov, k: 1 }, T, 0.1); }, 10);
      return el('button', { type: 'button', class: 'lay', onclick: function () {
        deck.slides.splice(S.slideI + 1, 0, { id: newId(), tpl: t.id, d: defaults(t, T), pos: {}, layers: [], hide: {} });
        dlg.remove(); loadSlide(S.slideI + 1); saveDeck(); buildStrip();
      } }, [c, el('small', { text: t.name })]);
    }))
  ])]);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.remove(); });
  document.body.appendChild(dlg);
}
/* لوحة التعديل في وضع الشرائح */
function buildDeckSide(keepScroll) {
  const side = $('#side'), opts = $('#opts'); if (!side) return;
  const sy = window.scrollY;
  opts.innerHTML = '';
  opts.appendChild(el('div', { class: 'opt' }, [el('label', { text: 'حجم العناوين' }), el('div', { class: 'range' }, [el('span', { text: 'أصغر' }),
    el('input', { type: 'range', min: '0.7', max: '1.3', step: '0.01', value: String(S.k), 'aria-label': 'حجم العنوان', oninput: function (e) { S.k = +e.target.value; changed(); } }), el('span', { text: 'أكبر' })])]));
  opts.appendChild(el('div', { class: 'opt' }, [el('label', { text: 'نمط العرض كله' }), seg(SL_VARS.map(function (v) { return [v.id, v.name]; }), S.variant, function (v) { S.variant = v; S.deck.style = v; changed(); buildStrip(); })]));
  const tabs = [['content', 'المحتوى'], ['layout', 'التخطيط'], ['lib', 'المكتبة'], ['colors', 'الألوان'], ['fonts', 'الخط']];
  const body = el('div', { class: 'tabbody' });
  side.innerHTML = '';
  side.appendChild(el('div', { class: 'tabs', role: 'tablist' }, tabs.map(function (t) {
    return el('button', { type: 'button', role: 'tab', class: S.tab === t[0] ? 'on' : '', 'aria-selected': S.tab === t[0] ? 'true' : 'false', onclick: function () { S.tab = t[0]; buildEditor(); } }, [t[1]]);
  })));
  side.appendChild(body);
  if (S.tab === 'layout') {
    body.appendChild(el('p', { class: 'note', text: 'غيّر تخطيط هذه الشريحة. ما كتبته في العنوان والنص ينتقل معك.' }));
    body.appendChild(el('div', { class: 'layouts' }, SLIDE_TPLS.map(function (t) {
      const c = el('canvas');
      setTimeout(function () { const d = Object.assign(defaults(t, S.track), pick(S.d, t)); renderTo(c, t, 'slide', { d: d, variant: S.variant, ov: S.ov, k: 1 }, S.track, 0.09); }, 10);
      return el('button', { type: 'button', class: 'lay' + (t.id === S.tpl.id ? ' on' : ''), onclick: function () {
        const sl = S.deck.slides[S.slideI]; sl.tpl = t.id; sl.d = Object.assign(defaults(t, S.track), pick(S.d, t)); sl.pos = {};
        loadSlide(S.slideI); saveDeck(); buildStrip();
      } }, [c, el('small', { text: t.name })]);
    })));
  } else if (S.tab === 'lib') buildLibrary(body);
  else if (S.tab === 'colors') {
    themesBlock(body, function (o) { S.ov = o; changed(); buildStrip(); buildEditor(true); });
    body.appendChild(el('h3', { class: 'sh', text: 'ألوان مخصصة للعرض كله' }));
    ['bg', 'title', 'accent'].forEach(function (key) {
      const cur = S.ov[key] || '';
      body.appendChild(el('div', { class: 'crow' }, [
        el('div', { class: 'clab' }, [el('b', { text: { bg: 'الخلفية', title: 'العناوين', accent: 'التمييز' }[key] }), el('button', { type: 'button', class: 'auto' + (cur ? '' : ' on'), text: 'تلقائي', onclick: function () { delete S.ov[key]; changed(); buildStrip(); buildEditor(true); } })]),
        el('div', { class: 'sws' }, S.track.swatches.map(function (c) { return el('button', { type: 'button', class: 'swt' + (cur.toLowerCase() === c ? ' on' : ''), style: 'background:' + c, 'aria-label': c, onclick: function () { S.ov[key] = c; changed(); buildStrip(); buildEditor(true); } }); }))
      ]));
    });
  } else if (S.tab === 'fonts') buildFonts(body);
  else buildContent(body);
  buildSelBar();
  if (keepScroll) window.scrollTo(0, sy);
}
function pick(d, t) { const o = {}; t.fields.forEach(function (f) { if (f.k && d[f.k] !== undefined && f.kind !== 'image') o[f.k] = d[f.k]; }); if (t.fields.some(function (f) { return f.k === 'body'; }) && !('body' in d) && d.sub) o.body = d.sub; return o; }

/* ---------- العرض بملء الشاشة ---------- */
function presentDeck() {
  saveDeck();
  const deck = S.deck; let i = S.slideI;
  const c = el('canvas', { class: 'pcv' });
  const ov = el('div', { class: 'present', tabindex: '0' }, [c, el('div', { class: 'phint', text: 'الأسهم للتنقل · Esc للخروج' })]);
  function draw() { const sl = deck.slides[i]; sl.d.__n = i ? String(i + 1) : ''; renderTo(c, slideTpl(sl.tpl), 'slide', { d: sl.d, variant: deck.style, ov: deck.ov, k: sl.k || 1, hide: sl.hide, pos: sl.pos, layers: sl.layers, bgfx: deck.bgfx }, S.track, 1); }
  function key(e) { if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft' || e.key === ' ' || e.key === 'PageDown') { if (i < deck.slides.length - 1) { i++; draw(); } } else if (e.key === 'ArrowRight' || e.key === 'PageUp') { if (i > 0) { i--; draw(); } } }
  function close() { document.removeEventListener('keydown', key); ov.remove(); if (document.fullscreenElement) document.exitFullscreen().catch(function () {}); }
  ov.addEventListener('click', function (e) { const r = ov.getBoundingClientRect(); if (e.clientX < r.width / 2) { if (i < deck.slides.length - 1) { i++; draw(); } } else if (i > 0) { i--; draw(); } });
  document.addEventListener('keydown', key);
  document.body.appendChild(ov); draw(); ov.focus();
  if (ov.requestFullscreen) ov.requestFullscreen().catch(function () {});
}

/* ---------- PDF: كل شريحة صورة JPEG في صفحة ---------- */
function b64bytes(u) { const s = atob(u.split(',')[1]); const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
function buildPdf(pages, pw, ph) {
  const enc = new TextEncoder(), parts = [], offs = [];
  let len = 0;
  function push(x) { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; }
  function obj(n, body, stream) { offs[n] = len; push(n + ' 0 obj\n' + body); if (stream) { push('\nstream\n'); push(stream); push('\nendstream'); } push('\nendobj\n'); }
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const n = pages.length, kids = [];
  for (let i = 0; i < n; i++) kids.push((3 + i * 3) + ' 0 R');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>');
  pages.forEach(function (p, i) {
    const po = 3 + i * 3, co = po + 1, io = po + 2;
    const cs = 'q ' + pw + ' 0 0 ' + ph + ' 0 0 cm /Im0 Do Q';
    obj(po, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pw + ' ' + ph + '] /Resources << /XObject << /Im0 ' + io + ' 0 R >> >> /Contents ' + co + ' 0 R >>');
    obj(co, '<< /Length ' + cs.length + ' >>', enc.encode(cs));
    obj(io, '<< /Type /XObject /Subtype /Image /Width ' + p.w + ' /Height ' + p.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.bytes.length + ' >>', p.bytes);
  });
  const total = 3 + n * 3;
  const xref = len;
  let x = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
  for (let i = 1; i < total; i++) x += ('000000000' + offs[i]).slice(-10) + ' 00000 n \n';
  push(x + 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF');
  return new Blob(parts, { type: 'application/pdf' });
}
async function exportPdf() {
  saveDeck();
  const deck = S.deck, pages = [];
  toast('جارٍ تجهيز ملف PDF…');
  for (let i = 0; i < deck.slides.length; i++) {
    const sl = deck.slides[i], c = document.createElement('canvas');
    sl.d.__n = i ? String(i + 1) : '';
    renderTo(c, slideTpl(sl.tpl), 'slide', { d: sl.d, variant: deck.style, ov: deck.ov, k: sl.k || 1, hide: sl.hide, pos: sl.pos, layers: sl.layers, bgfx: deck.bgfx }, S.track, 1);
    pages.push({ bytes: b64bytes(c.toDataURL('image/jpeg', 0.9)), w: c.width, h: c.height });
    await new Promise(function (r) { setTimeout(r, 0); });
  }
  const blob = buildPdf(pages, 960, 540), url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: (deck.name || 'عرض').replace(/[\\\/:?"<>|*]/g, '') + '.pdf' }); document.body.appendChild(a); a.click(); a.remove();
  toast('بدأ تحميل العرض (' + deck.slides.length + ' شرائح، ' + (blob.size / 1048576).toFixed(1) + ' ميغابايت).');
}
