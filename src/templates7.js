/* ================= الدفعة الأولى من قوالب الأنشطة (نوفمبر 2026) =================
   خمسة قوالب لا نظير لها في المعرض، اعتمدها المدير العام: استضافة ضيف، لوحة الصدارة، تعديل موعد،
   بدأ اللقاء الآن، حصاد اللقاء. ألوانها من هوية المسار (p عنابي/أساسي، pd داكنه، a برتقالي، warm، paper)،
   فتتبدّل مع كل مسار. لكل قالب متغيّر فاتح وآخر داكن، ومقاسات المنشور والمربع والقصة. */

// علامة النسبة العربية «٪» ترسم بخطوط لا بحرف الخط، لأن بعض الخطوط ترسمها «%» اللاتينية
function tpPct(ctx, x, y, s, color) {   // x الحافة اليمنى، y منتصف السطر، s حجم الخط
  const w = s * 0.42, h = s * 0.62, r = s * 0.075;
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = s * 0.075; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - w * 0.12, y - h / 2); ctx.lineTo(x - w * 0.88, y + h / 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x - w * 0.82, y - h * 0.3, r, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x - w * 0.18, y + h * 0.3, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  return w;
}
function tpAr(n) { return String(n).replace(/[0-9]/g, function (c) { return '٠١٢٣٤٥٦٧٨٩'[+c]; }); }
// السطور «النص | القيمة» من خانة متعددة الأسطر
function tpRows(s, max) {
  return String(s || '').split('\n').map(function (l) { const p = l.split('|'); return { a: (p[0] || '').trim(), b: (p[1] || '').trim() }; })
    .filter(function (r) { return r.a || r.b; }).slice(0, max);
}
// الأرضية: فاتحة بدائرتين خفيفتين، أو داكنة بتدرج
function tpGround(ctx, W, H, T, v, u) {
  const C = T.c, dark = v === 'dark', base = OV.bg || (dark ? C.pd : C.paper);
  if (dark && !OV.bg && !BGFX) { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, C.pd); g.addColorStop(1, C.sdd || C.pd); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  else paintBg(ctx, W, H, base);
  if (D() && !BGFX) quiet(function () {
    const c = isDark(base) ? alpha('#ffffff', 0.05) : alpha(C.warm, 1);
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(-40 * u, -40 * u, 330 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(W + 30 * u, H + 30 * u, 300 * u, 0, Math.PI * 2); ctx.fill();
  });
  return { base: base, dark: isDark(base) };
}
// رأس القالب: الشعار يمينًا والوسم يسارًا. يعيد أسفل الرأس
function tpHead(ctx, W, T, d, u, m, dk) {
  const C = T.c;
  G(ctx, 'logo'); const r = drawLogo(ctx, T, W - m, m, 240 * u, dk ? '#ffffff' : 'color', 'tr');
  G(ctx, 'tag'); if (has(d.tag)) {
    const s = 30 * u, t = ntClean(d.tag), w = textW(ctx, t, s, 1, false) + s * 1.9, h = s * 2, fill = OV.accent || (dk ? C.a : C.p);
    fillRR(ctx, m, m + 14 * u, w, h, h / 2, fill); line(ctx, t, m + w / 2, m + 14 * u + h / 2, { size: s, color: onBg(fill), align: 'center', bold: 1 });
  }
  return Math.max(m + 120 * u, (r && r.h ? m + r.h : m + 150 * u)) + 40 * u;
}
// يصغّر الخطة حتى تتسع بين أعلى وأسفل، ويعيد أول y يوسّطها
function tpPlace(plan, top, bot, q) {
  let P = plan(q); for (let n = 0; n < 12 && P.h > bot - top; n++) P = plan(P.z * 0.92);
  P.y = top + Math.max(0, (bot - top - P.h) / 2); return P;
}
const TP_SIZES = ['post', 'square', 'story'];
const TP_VARS = function (a, b) { return [{ id: 'light', name: 'فاتح', sw: a }, { id: 'dark', name: 'داكن', sw: b }]; };

TEMPLATES.push(

/* ---------- ١. استضافة ضيف ---------- */
{
  id: 'tp_host', type: 'ann', name: 'استضافة ضيف', tags: 'استضافة ضيف شيخ محاضر لقاء صورة تعريف', isNew: 1,
  sizes: TP_SIZES,
  variants: TP_VARS(['#f9f5f6', '#8a1e50', '#fa9020'], ['#571435', '#ffffff', '#fa9020']),
  colorLabels: { bg: 'لون الخلفية', title: 'لون الاسم', accent: 'لون الوسم' },
  fields: [
    { k: 'photo', label: 'صورة الضيف (اختيارية)', kind: 'image', def: '', optional: true },
    { k: 'kicker', label: 'السطر فوق الاسم', def: 'يحلّ ضيفًا علينا', max: 30 },
    { k: 'name', label: 'اسم الضيف', def: 'اسم الضيف', max: 40 },
    { k: 'bio', label: 'تعريف قصير', kind: 'area', def: 'سطران تعريفيان بالضيف: تخصصه، وما عُرف به.', max: 110 },
    { k: 'lead', label: 'فوق عنوان اللقاء', def: 'في لقاء بعنوان', max: 30 },
    { k: 'title', label: 'عنوان اللقاء', kind: 'area', def: 'عنوان اللقاء يكتب هنا', max: 60 },
    { k: 'date', label: 'اليوم', def: 'الخميس ١٩ نوفمبر', max: 30, half: 1 },
    { k: 'time', label: 'الوقت', def: '٧:٠٠ مساءً', max: 24, half: 1 },
    { k: 'place', label: 'المكان', def: 'Google Meet', max: 30, half: 1 },
    { k: 'tag', label: 'الوسم', def: 'استضافة', max: 20, half: 1 }
  ],
  draw: function (ctx, W, H, d, T, v, k, P) {
    const C = T.c, u = W / 1080, m = 70 * u, tall = H > W * 1.5;
    const g0 = tpGround(ctx, W, H, T, v, u), dk = g0.dark;
    const fg = OV.title || (dk ? '#ffffff' : C.ink), soft = dk ? alpha('#ffffff', 0.78) : C.s, acc = dk ? C.a : C.a2 || C.a;
    const top = tpHead(ctx, W, T, d, u, m, dk), bot = H - m;
    const infos = [['date', 'اليوم'], ['time', 'الوقت'], ['place', 'المكان']].filter(function (x) { return has(d[x[0]]); });
    const plan = function (z) {
      const L = { z: z }; L.ph = (tall ? 380 : 300) * u * z; L.tw = W - 2 * m - L.ph - 46 * u;
      L.kf = fit(ctx, ntClean(d.kicker), { maxW: L.tw, size: 32 * u * z, maxLines: 1, bold: 0.8 });
      L.nf = fit(ctx, ntClean(d.name), { maxW: L.tw, size: 64 * u * z * k, maxLines: 2, lh: 1.15, bold: 1, title: true });
      L.bf = fit(ctx, ntClean(d.bio), { maxW: L.tw, size: 28 * u * z, maxLines: 4, lh: 1.5 });
      L.side = L.kf.h + 8 * u + L.nf.h + 14 * u + L.bf.h;
      L.top = Math.max(L.ph, L.side);
      L.lf = fit(ctx, ntClean(d.lead), { maxW: W - 2 * m - 90 * u, size: 27 * u * z, maxLines: 1, bold: 0.5 });
      L.tf = fit(ctx, ntClean(d.title), { maxW: W - 2 * m - 90 * u, size: 54 * u * z * k, maxLines: 2, lh: 1.25, bold: 1, title: true, balance: true });
      L.band = 34 * u * z * 2 + L.lf.h + 6 * u + L.tf.h;
      L.ih = infos.length ? 96 * u * z : 0;
      L.h = L.top + 50 * u * z + L.band + (L.ih ? 34 * u * z + L.ih : 0);
      return L;
    };
    const L = tpPlace(plan, top, bot, tall ? 1.32 : 1); let y = L.y; const z = L.z;
    // الصورة في دائرة يمينًا، أو ظل شخص إن لم تُرفع
    G(ctx, 'photo'); {
      const r = L.ph / 2, cx = W - m - r, cy = y + L.top / 2;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r + 14 * u, 0, Math.PI * 2); ctx.fillStyle = OV.accent || C.p; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, r + 6 * u, 0, Math.PI * 2); ctx.fillStyle = dk ? C.pd : '#ffffff'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
      if (P && P.photo) drawPhoto(ctx, P.photo.im, cx - r, cy - r, 2 * r, 2 * r, { z: P.photo.z, ox: P.photo.ox, oy: P.photo.oy });
      else { ctx.fillStyle = dk ? alpha('#ffffff', 0.12) : C.warm; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
        ctx.fillStyle = dk ? alpha('#ffffff', 0.28) : lighten(C.s, 0.55); ctx.beginPath(); ctx.arc(cx, cy - r * 0.2, r * 0.36, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.9, r * 0.72, r * 0.62, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    { const xr = W - m - L.ph - 46 * u; let yy = y + (L.top - L.side) / 2;
      G(ctx, 'kicker'); drawFit(ctx, L.kf, xr, yy, { align: 'right', color: acc }); yy += L.kf.h + 8 * u;
      G(ctx, 'name'); drawFit(ctx, L.nf, xr, yy, { align: 'right', color: fg }); yy += L.nf.h + 14 * u;
      G(ctx, 'bio'); drawFit(ctx, L.bf, xr, yy, { align: 'right', color: soft }); }
    y += L.top + 50 * u * z;
    // شريط العنوان
    G(ctx, 'title'); {
      const bh = L.band, x0 = m, w = W - 2 * m, bf = dk ? '#ffffff' : C.pd;
      if (dk) fillRR(ctx, x0, y, w, bh, 34 * u, alpha('#ffffff', 0.1));
      else { const g = ctx.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, C.pd); g.addColorStop(1, C.p); rrect(ctx, x0, y, w, bh, 34 * u); ctx.fillStyle = g; ctx.fill(); }
      let yy = y + 34 * u * z; const xr = W - m - 45 * u;
      drawFit(ctx, L.lf, xr, yy, { align: 'right', color: dk ? alpha('#ffffff', 0.75) : alpha('#ffffff', 0.8) }); yy += L.lf.h + 6 * u;
      drawFit(ctx, L.tf, xr, yy, { align: 'right', color: '#ffffff' });
      y += bh;
    }
    // صناديق المعلومات
    G(ctx, 'info'); if (L.ih) {
      y += 34 * u * z; const gap = 20 * u, n = infos.length, bw = (W - 2 * m - gap * (n - 1)) / n;
      infos.forEach(function (it, i) {
        const xr = W - m - i * (bw + gap); fillRR(ctx, xr - bw, y, bw, L.ih, 26 * u, dk ? alpha('#ffffff', 0.1) : C.warm);
        line(ctx, it[1], xr - bw / 2, y + L.ih * 0.3, { size: 21 * u * z, color: dk ? alpha('#ffffff', 0.7) : C.s, align: 'center', maxW: bw - 30 * u });
        line(ctx, ntClean(d[it[0]]), xr - bw / 2, y + L.ih * 0.66, { size: 30 * u * z, color: dk ? '#ffffff' : C.p, align: 'center', bold: 1, maxW: bw - 30 * u });
      });
    }
  }
},

/* ---------- ٢. لوحة الصدارة ---------- */
{
  id: 'tp_board', type: 'comp', name: 'لوحة الصدارة', tags: 'صدارة ترتيب نتائج مسابقة نسبة إنجاز أوائل مجموعات أسبوع', isNew: 1,
  sizes: TP_SIZES,
  variants: TP_VARS(['#f9f5f6', '#2b2b2b', '#fa9020'], ['#571435', '#ffffff', '#fa9020']),
  colorLabels: { bg: 'لون الخلفية', title: 'لون العنوان', accent: 'لون الأشرطة' },
  fields: [
    { k: 'title', label: 'العنوان', def: 'لوحة الصدارة', max: 30 },
    { k: 'sub', label: 'تحت العنوان', def: 'نسبة الإنجاز في المسابقة حتى مساء الخميس', max: 70 },
    { k: 'rows', label: 'الترتيب: سطر لكل اسم «الاسم | النسبة»', kind: 'area', def: 'المجموعة الأولى | 96\nالمجموعة الثالثة | 88\nالمجموعة الثانية | 81\nالمجموعة الخامسة | 74\nالمجموعة الرابعة | 66\nالمجموعة السادسة | 59', max: 400, hint: 'حتى ٨ أسطر، والنسبة رقم من ٠ إلى ١٠٠' },
    { k: 'top', label: 'عدد المميَّزين في الأعلى', def: '3', max: 1, half: 1 },
    { k: 'tag', label: 'الوسم', def: 'الأسبوع الأول', max: 20, half: 1 },
    { k: 'foot', label: 'السطر الأخير', def: 'تُحدَّث كل أسبوع — والمنافسة مفتوحة', max: 60 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, m = 70 * u, tall = H > W * 1.5;
    const g0 = tpGround(ctx, W, H, T, v, u), dk = g0.dark;
    const fg = OV.title || (dk ? '#ffffff' : C.ink), soft = dk ? alpha('#ffffff', 0.75) : C.s, bar = OV.accent || C.a;
    const top = tpHead(ctx, W, T, d, u, m, dk), bot = H - m;
    const rows = tpRows(d.rows, 8), nTop = Math.max(0, Math.min(rows.length, parseInt(String(d.top).replace(/[٠-٩]/g, function (c) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(c); }), 10) || 0));
    const plan = function (z) {
      const L = { z: z };
      L.tf = fit(ctx, ntClean(d.title), { maxW: W - 2 * m, size: 76 * u * z * k, maxLines: 1, bold: 1, title: true });
      L.sf = fit(ctx, ntClean(d.sub), { maxW: W - 2 * m, size: 29 * u * z, maxLines: 2, lh: 1.4 });
      L.rh = (tall ? 104 : 84) * u * z; L.gap = 14 * u * z;
      L.ff = fit(ctx, ntClean(d.foot), { maxW: W - 2 * m, size: 25 * u * z, maxLines: 1, bold: 0.6 });
      L.h = L.tf.h + 12 * u + (L.sf.h ? L.sf.h + 34 * u * z : 20 * u) + rows.length * (L.rh + L.gap) + (L.ff.h ? 24 * u + L.ff.h : 0);
      return L;
    };
    const L = tpPlace(plan, top, bot, tall ? 1.28 : 1); let y = L.y; const z = L.z;
    G(ctx, 'title'); {
      if (D() && !dk) { const w = L.tf.w + 36 * u; ctx.fillStyle = alpha(C.a, 0.38); ctx.fillRect(W / 2 - w / 2, y + L.tf.h * 0.56, w, L.tf.h * 0.3); }
      drawFit(ctx, L.tf, W / 2, y, { align: 'center', color: fg }); y += L.tf.h + 12 * u; }
    G(ctx, 'sub'); if (L.sf.h) { drawFit(ctx, L.sf, W / 2, y, { align: 'center', color: soft }); y += L.sf.h + 34 * u * z; } else y += 20 * u;
    G(ctx, 'rows'); rows.forEach(function (r, i) {
      const hot = i < nTop, x0 = m, w = W - 2 * m, h = L.rh, yc = y + h / 2;
      if (hot) { const g = ctx.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, C.pd); g.addColorStop(1, C.p); rrect(ctx, x0, y, w, h, h / 2); ctx.fillStyle = g; ctx.fill(); }
      else fillRR(ctx, x0, y, w, h, h / 2, dk ? alpha('#ffffff', 0.1) : C.warm);
      const txt = hot || dk ? '#ffffff' : C.ink, nr = h * 0.36, nx = W - m - 18 * u * z - nr;
      ctx.beginPath(); ctx.arc(nx, yc, nr, 0, Math.PI * 2); ctx.fillStyle = hot ? C.a : (dk ? alpha('#ffffff', 0.18) : '#ffffff'); ctx.fill();
      line(ctx, tpAr(i + 1), nx, yc, { size: h * 0.36, color: hot ? '#ffffff' : (dk ? '#ffffff' : C.p), align: 'center', bold: 1 });
      const s = h * 0.38, nameR = nx - nr - 22 * u, nameW = w * 0.36;
      line(ctx, r.a, nameR, yc, { size: s, color: txt, align: 'right', bold: 1, maxW: nameW });
      const val = Math.max(0, Math.min(100, parseFloat(String(r.b).replace(/[٠-٩]/g, function (c) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(c); })) || 0));
      // النسبة يسارًا: الأرقام ثم «٪» مرسومة
      const vs = h * 0.36, vx = x0 + 30 * u + vs * 0.42 + 4 * u;
      const vf = line(ctx, tpAr(Math.round(val)), vx + 8 * u, yc, { size: vs, color: txt, align: 'left', bold: 1 });
      tpPct(ctx, vx, yc, vs, txt);
      // الشريط بين الاسم والنسبة، يمتلئ من اليمين
      const br = nameR - nameW - 26 * u, bl = vx + 8 * u + vf.w + 30 * u, bw = Math.max(0, br - bl), bh = Math.max(8 * u, h * 0.17);
      if (bw > 20 * u) { fillRR(ctx, bl, yc - bh / 2, bw, bh, bh / 2, hot || dk ? alpha('#ffffff', 0.2) : alpha(C.p, 0.12));
        if (val > 0) fillRR(ctx, br - bw * val / 100, yc - bh / 2, Math.max(bh, bw * val / 100), bh, bh / 2, bar); }
      y += h + L.gap;
    });
    G(ctx, 'foot'); if (L.ff.h) { y += 24 * u - L.gap; drawFit(ctx, L.ff, W / 2, y, { align: 'center', color: dk ? C.a : C.a2 || C.a }); }
  }
},

/* ---------- ٣. تعديل موعد ---------- */
{
  id: 'tp_change', type: 'quote', name: 'تعديل موعد', tags: 'تنبيه تعديل موعد تأجيل تغيير وقت نقل لقاء', isNew: 1,
  sizes: TP_SIZES,
  variants: TP_VARS(['#f9f5f6', '#2b2b2b', '#fa9020'], ['#571435', '#ffffff', '#fa9020']),
  colorLabels: { bg: 'لون الخلفية', title: 'لون العنوان', accent: 'لون الأيقونة والسهم' },
  fields: [
    { k: 'title', label: 'العنوان', def: 'تعديل موعد', max: 24 },
    { k: 'ev', label: 'اسم النشاط', def: '«اسم النشاط»', max: 50 },
    { k: 'oldL', label: 'عنوان القديم', def: 'الموعد السابق', max: 20, half: 1 },
    { k: 'newL', label: 'عنوان الجديد', def: 'الموعد الجديد', max: 20, half: 1 },
    { k: 'old', label: 'الموعد السابق', kind: 'area', def: 'الأحد ٢٢ نوفمبر\n٥:٠٠ مساءً', max: 50, half: 1 },
    { k: 'new', label: 'الموعد الجديد', kind: 'area', def: 'الاثنين ٢٣ نوفمبر\n٦:٠٠ مساءً', max: 50, half: 1 },
    { k: 'note', label: 'ملاحظة', kind: 'area', def: 'الرابط كما هو. نعتذر عن التعديل، ونلقاكم على خير.', max: 100 },
    { k: 'tag', label: 'الوسم', def: 'تنبيه', max: 20 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, m = 70 * u, tall = H > W * 1.5;
    const g0 = tpGround(ctx, W, H, T, v, u), dk = g0.dark;
    const fg = OV.title || (dk ? '#ffffff' : C.ink), soft = dk ? alpha('#ffffff', 0.75) : C.s, acc = OV.accent || C.a;
    const top = tpHead(ctx, W, T, d, u, m, dk), bot = H - m;
    const plan = function (z) {
      const L = { z: z }; L.ic = 150 * u * z;
      L.tf = fit(ctx, ntClean(d.title), { maxW: W - 2 * m, size: 80 * u * z * k, maxLines: 1, bold: 1, title: true });
      L.ef = fit(ctx, ntClean(d.ev), { maxW: W - 2 * m, size: 38 * u * z, maxLines: 2, lh: 1.3, bold: 1 });
      L.bw = (W - 2 * m - 90 * u * z) / 2;
      L.of = fit(ctx, ntClean(d.old), { maxW: L.bw - 50 * u, size: 38 * u * z, maxLines: 3, lh: 1.35, bold: 1 });
      L.wf = fit(ctx, ntClean(d.new), { maxW: L.bw - 50 * u, size: 38 * u * z, maxLines: 3, lh: 1.35, bold: 1 });
      L.bh = 30 * u * z * 2 + 34 * u * z + Math.max(L.of.h, L.wf.h);
      L.nf = fit(ctx, ntClean(d.note), { maxW: W - 2 * m - 60 * u, size: 28 * u * z, maxLines: 3, lh: 1.5 });
      L.h = L.ic + 36 * u * z + L.tf.h + 8 * u + L.ef.h + 46 * u * z + L.bh + (L.nf.h ? 40 * u * z + L.nf.h : 0);
      return L;
    };
    const L = tpPlace(plan, top, bot, tall ? 1.38 : 1); let y = L.y; const z = L.z;
    G(ctx, 'icon'); { const r = L.ic / 2, cx = W / 2, cy = y + r;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = acc; ctx.fill();
      ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = r * 0.12; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(cx, cy + r * 0.06, r * 0.5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.2); ctx.lineTo(cx, cy + r * 0.08); ctx.lineTo(cx + r * 0.2, cy + r * 0.24); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - r * 0.18, cy - r * 0.62); ctx.lineTo(cx + r * 0.18, cy - r * 0.62); ctx.stroke(); ctx.restore();
      y += L.ic + 36 * u * z; }
    G(ctx, 'title'); drawFit(ctx, L.tf, W / 2, y, { align: 'center', color: fg }); y += L.tf.h + 8 * u;
    G(ctx, 'ev'); drawFit(ctx, L.ef, W / 2, y, { align: 'center', color: dk ? C.a : C.p }); y += L.ef.h + 46 * u * z;
    G(ctx, 'boxes'); {
      const bw = L.bw, bh = L.bh, xr = W - m;
      // السابق يمينًا (يُقرأ أولًا) مشطوبًا، والجديد يسارًا بلون المسار
      fillRR(ctx, xr - bw, y, bw, bh, 30 * u, dk ? alpha('#ffffff', 0.1) : C.warm);
      line(ctx, ntClean(d.oldL), xr - bw / 2, y + 30 * u * z + 12 * u * z, { size: 24 * u * z, color: soft, align: 'center', maxW: bw - 40 * u });
      const oy = y + 30 * u * z + 34 * u * z; drawFit(ctx, L.of, xr - bw / 2, oy + (Math.max(L.of.h, L.wf.h) - L.of.h) / 2, { align: 'center', color: soft });
      L.of.lines.forEach(function (l, i) { const yy = oy + (Math.max(L.of.h, L.wf.h) - L.of.h) / 2 + L.of.pt + L.of.size * L.of.lh * (i + 0.55);
        hline(ctx, xr - bw / 2 - l.w / 2 - 6 * u, xr - bw / 2 + l.w / 2 + 6 * u, yy, acc, 4 * u * z); });
      const xl = m; { const g = ctx.createLinearGradient(xl, 0, xl + bw, 0); g.addColorStop(0, C.pd); g.addColorStop(1, C.p); rrect(ctx, xl, y, bw, bh, 30 * u); ctx.fillStyle = dk ? alpha('#ffffff', 0.18) : g; ctx.fill(); }
      line(ctx, ntClean(d.newL), xl + bw / 2, y + 30 * u * z + 12 * u * z, { size: 24 * u * z, color: alpha('#ffffff', 0.8), align: 'center', maxW: bw - 40 * u });
      drawFit(ctx, L.wf, xl + bw / 2, oy + (Math.max(L.of.h, L.wf.h) - L.wf.h) / 2, { align: 'center', color: '#ffffff' });
      // السهم من القديم إلى الجديد
      const ay = y + bh / 2, ax1 = xr - bw - 22 * u, ax0 = xl + bw + 22 * u, s = 16 * u * z;
      ctx.save(); ctx.strokeStyle = acc; ctx.lineWidth = 6 * u * z; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(ax1, ay); ctx.lineTo(ax0, ay); ctx.moveTo(ax0 + s, ay - s); ctx.lineTo(ax0, ay); ctx.lineTo(ax0 + s, ay + s); ctx.stroke(); ctx.restore();
      y += bh;
    }
    G(ctx, 'note'); if (L.nf.h) { y += 40 * u * z; drawFit(ctx, L.nf, W / 2, y, { align: 'center', color: soft }); }
  }
},

/* ---------- ٤. بدأ اللقاء الآن ---------- */
{
  id: 'tp_live', type: 'ann', name: 'بدأ اللقاء الآن', tags: 'مباشر الآن بدأ اللقاء رابط دخول بث', isNew: 1,
  sizes: TP_SIZES,
  variants: TP_VARS(['#f9f5f6', '#8a1e50', '#fa9020'], ['#571435', '#ffffff', '#fa9020']).reverse(),
  colorLabels: { bg: 'لون الخلفية', title: 'لون العنوان', accent: 'لون الدائرة' },
  fields: [
    { k: 'now', label: 'كلمة الدائرة', def: 'الآن', max: 8 },
    { k: 'title', label: 'العنوان', def: 'بدأ اللقاء', max: 24 },
    { k: 'ev', label: 'اسم اللقاء', kind: 'area', def: '«عنوان اللقاء»', max: 60 },
    { k: 'btn', label: 'الزر', def: 'ادخل من الرابط في الرسالة ←', max: 40 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, m = 70 * u, tall = H > W * 1.5;
    const g0 = tpGround(ctx, W, H, T, v, u), dk = g0.dark, acc = OV.accent || C.a;
    const fg = OV.title || (dk ? '#ffffff' : C.ink);
    G(ctx, 'logo'); const lr = drawLogo(ctx, T, W - m, m, 220 * u, dk ? '#ffffff' : 'color', 'tr');
    const top = m + (lr && lr.h ? lr.h : 140 * u) + 30 * u, bot = H - m;
    const plan = function (z) {
      const L = { z: z }; L.rr = (tall ? 330 : 280) * u * z;
      L.tf = fit(ctx, ntClean(d.title), { maxW: W - 2 * m, size: 86 * u * z * k, maxLines: 1, bold: 1, title: true });
      L.ef = fit(ctx, ntClean(d.ev), { maxW: W - 2 * m, size: 40 * u * z, maxLines: 2, lh: 1.3, bold: 1, balance: true });
      L.bh = has(d.btn) ? 74 * u * z : 0;
      L.h = 2 * L.rr + 40 * u * z + L.tf.h + 10 * u + L.ef.h + (L.bh ? 46 * u * z + L.bh : 0);
      return L;
    };
    const L = tpPlace(plan, top, bot, tall ? 1.25 : 1); let y = L.y; const z = L.z;
    G(ctx, 'ring'); { const cx = W / 2, cy = y + L.rr, R = L.rr;
      [1, 0.78, 0.56].forEach(function (f, i) { ctx.beginPath(); ctx.arc(cx, cy, R * f, 0, Math.PI * 2); ctx.strokeStyle = alpha(acc, [0.25, 0.45, 0.7][i]); ctx.lineWidth = 3 * u; ctx.stroke(); });
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.36, 0, Math.PI * 2); ctx.fillStyle = acc; ctx.fill();
      line(ctx, ntClean(d.now), cx, cy, { size: R * 0.17, color: onBg(acc), align: 'center', bold: 1, maxW: R * 0.6 });
      y += 2 * L.rr + 40 * u * z; }
    G(ctx, 'title'); drawFit(ctx, L.tf, W / 2, y, { align: 'center', color: fg }); y += L.tf.h + 10 * u;
    G(ctx, 'ev'); drawFit(ctx, L.ef, W / 2, y, { align: 'center', color: dk ? lighten(C.pl || C.a, 0.5) : C.p }); y += L.ef.h;
    G(ctx, 'btn'); if (L.bh) { y += 46 * u * z; const s = 30 * u * z, t = ntClean(d.btn), w = Math.min(W - 2 * m, textW(ctx, t, s, 1, false) + s * 3);
      fillRR(ctx, W / 2 - w / 2, y, w, L.bh, L.bh / 2, dk ? '#ffffff' : C.p);
      line(ctx, t, W / 2, y + L.bh / 2, { size: s, color: dk ? C.p : '#ffffff', align: 'center', bold: 1, maxW: w - s * 2 }); }
  }
},

/* ---------- ٥. حصاد اللقاء ---------- */
{
  id: 'tp_recap', type: 'cover', name: 'حصاد اللقاء', tags: 'حصاد ملخص لقاء فوائد حضور أرقام بعد اللقاء تقرير', isNew: 1,
  sizes: TP_SIZES,
  variants: TP_VARS(['#f9f5f6', '#2b2b2b', '#fa9020'], ['#571435', '#ffffff', '#fa9020']),
  colorLabels: { bg: 'لون الخلفية', title: 'لون العنوان', accent: 'لون الأرقام' },
  fields: [
    { k: 'title', label: 'العنوان', def: 'حصاد اللقاء', max: 24 },
    { k: 'ev', label: 'اسم اللقاء وتاريخه', def: '«عنوان اللقاء» — الخميس ١٩ نوفمبر', max: 70 },
    { k: 'stats', label: 'الأرقام: سطر لكل رقم «الرقم | الوصف»', kind: 'area', def: '٤٢ | حاضرًا\n٧٥ | دقيقة\n١٨ | مداخلة', max: 80, hint: 'حتى ثلاثة أسطر' },
    { k: 'head', label: 'عنوان الفوائد', def: 'أبرز ما خرجنا به', max: 30 },
    { k: 'points', label: 'الفوائد: سطر لكل فائدة', kind: 'area', def: 'الفائدة الأولى في سطر أو سطرين.\nالفائدة الثانية في سطر أو سطرين.\nالفائدة الثالثة في سطر أو سطرين.', max: 320, hint: 'حتى أربع فوائد' },
    { k: 'foot', label: 'السطر الأخير', def: 'موعدنا القادم: الأحد ٥:٠٠ مساءً', max: 60 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, m = 70 * u, tall = H > W * 1.5;
    const g0 = tpGround(ctx, W, H, T, v, u), dk = g0.dark;
    const fg = OV.title || (dk ? '#ffffff' : C.ink), soft = dk ? alpha('#ffffff', 0.75) : C.s, num = OV.accent || (dk ? C.a : '#ffd3a3');
    G(ctx, 'logo'); const lr = drawLogo(ctx, T, m, m, 200 * u, dk ? '#ffffff' : 'color', 'tl');
    const top = m + (lr && lr.h ? lr.h : 130 * u) + 30 * u, bot = H - m;
    const stats = tpRows(d.stats, 3), pts = String(d.points || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 4);
    const plan = function (z) {
      const L = { z: z };
      L.tf = fit(ctx, ntClean(d.title), { maxW: W - 2 * m, size: 70 * u * z * k, maxLines: 1, bold: 1, title: true });
      L.ef = fit(ctx, ntClean(d.ev), { maxW: W - 2 * m, size: 29 * u * z, maxLines: 2, lh: 1.4 });
      L.sh = stats.length ? 170 * u * z : 0;
      L.hf = fit(ctx, ntClean(d.head), { maxW: W - 2 * m, size: 34 * u * z, maxLines: 1, bold: 1 });
      L.pf = pts.map(function (p) { return fit(ctx, ntClean(p), { maxW: W - 2 * m - 70 * u, size: 29 * u * z, maxLines: 3, lh: 1.45 }); });
      L.ph = L.pf.reduce(function (s, f) { return s + Math.max(f.h, 46 * u * z) + 18 * u * z; }, 0);
      L.ff = fit(ctx, ntClean(d.foot), { maxW: W - 2 * m, size: 26 * u * z, maxLines: 1, bold: 0.6 });
      L.h = L.tf.h + 8 * u + L.ef.h + (L.sh ? 36 * u * z + L.sh : 0) + (pts.length ? 46 * u * z + L.hf.h + 16 * u + L.ph : 0) + (L.ff.h ? 30 * u * z + L.ff.h : 0);
      return L;
    };
    const L = tpPlace(plan, top, bot, tall ? 1.34 : 1); let y = L.y; const z = L.z, xr = W - m;
    G(ctx, 'title'); {
      if (D() && !dk) { const w = L.tf.w + 30 * u; ctx.fillStyle = alpha(C.a, 0.38); ctx.fillRect(xr - w + 14 * u, y + L.tf.h * 0.56, w, L.tf.h * 0.3); }
      drawFit(ctx, L.tf, xr, y, { align: 'right', color: fg }); y += L.tf.h + 8 * u; }
    G(ctx, 'ev'); drawFit(ctx, L.ef, xr, y, { align: 'right', color: soft }); y += L.ef.h;
    G(ctx, 'stats'); if (L.sh) { y += 36 * u * z; const gap = 22 * u, n = stats.length, bw = (W - 2 * m - gap * (n - 1)) / n;
      stats.forEach(function (s, i) { const x = xr - i * (bw + gap);
        if (dk) fillRR(ctx, x - bw, y, bw, L.sh, 30 * u, alpha('#ffffff', 0.1));
        else { const g = ctx.createLinearGradient(0, y, 0, y + L.sh); g.addColorStop(0, C.pd); g.addColorStop(1, C.p); rrect(ctx, x - bw, y, bw, L.sh, 30 * u); ctx.fillStyle = g; ctx.fill(); }
        line(ctx, s.a, x - bw / 2, y + L.sh * 0.42, { size: 66 * u * z, color: num, align: 'center', bold: 1, maxW: bw - 30 * u, title: true });
        line(ctx, s.b, x - bw / 2, y + L.sh * 0.78, { size: 25 * u * z, color: '#ffffff', align: 'center', maxW: bw - 30 * u }); });
      y += L.sh; }
    G(ctx, 'points'); if (pts.length) { y += 46 * u * z; drawFit(ctx, L.hf, xr, y, { align: 'right', color: dk ? C.a : C.p }); y += L.hf.h + 16 * u;
      L.pf.forEach(function (f, i) { const r = 22 * u * z, h = Math.max(f.h, 46 * u * z);
        ctx.beginPath(); ctx.arc(xr - r, y + r + 2 * u, r, 0, Math.PI * 2); ctx.fillStyle = C.a; ctx.fill();
        line(ctx, tpAr(i + 1), xr - r, y + r + 2 * u, { size: r * 1.05, color: '#ffffff', align: 'center', bold: 1 });
        drawFit(ctx, f, xr - 2 * r - 22 * u, y + (f.h < h ? (h - f.h) / 2 : 0), { align: 'right', color: fg }); y += h + 18 * u * z; }); y -= 18 * u * z; }
    G(ctx, 'foot'); if (L.ff.h) { y += 30 * u * z; drawFit(ctx, L.ff, W / 2, y, { align: 'center', color: dk ? C.a : C.a2 || C.a }); }
  }
}
);
