/* ================= قوالب نظام تصميم الأكاديمية (نوفمبر 2026) =================
   من نظام التصميم «أكاديمية الجيل الصاعد»: أرضية النعناع، الأشكال المحيطية الثلاثة، الكلمة المائية الممدودة،
   والأشرطة الأربعة من الشعار، ويمتد رابعها شريطاً بعرض التصميم في التذييل.
   الألوان من الهوية: الأشرطة بترتيب الشعار (a برتقالي، a2 أحمر، s بنفسجي، p أخضر مزرق). */

// شريط بنهاية مدوّرة يميناً وشق مفتوح يساراً، كأشرطة الشعار (نسب الشعار: حشوة الشق 0.17 من الارتفاع، ونصف قطره 0.33)
function acBar(ctx, x, y, w, h, notchW, fill, ground) {
  const R = h / 2;
  ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w - R, y); ctx.arc(x + w - R, y + R, R, -Math.PI / 2, Math.PI / 2); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
  if (notchW > 0) { const t = h * 0.17, r = h * 0.33; ctx.fillStyle = ground; ctx.beginPath(); ctx.moveTo(x - 1, y + t); ctx.lineTo(x + notchW - r, y + t); ctx.arc(x + notchW - r, y + R, r, -Math.PI / 2, Math.PI / 2); ctx.lineTo(x - 1, y + h - t); ctx.closePath(); ctx.fill(); }
}
function acCols(T) { const C = T.c; return [C.a, C.a2, C.s, C.p]; }
// مسطرة التذييل: ثلاثة أشرطة قصيرة، والرابع يمتد إلى الحافة
function acRule(ctx, W, y, h, T, ground, light) {
  const cols = acCols(T), g = h * 0.3, short = h * 8;
  cols.forEach(function (c, i) {
    const yy = y + i * (h + g), col = light ? '#ffffff' : c;
    if (i < 3) acBar(ctx, 0, yy, short, h, short * [0.8, 0.725, 0.64][i], col, ground);
    else acBar(ctx, 0, yy, W + h, h, h * 4.4, col, ground);
  });
  return 4 * h + 3 * g;
}
// الأشكال المحيطية الثلاثة: مثلث برتقالي، دائرة حمراء، مربع أخضر
function acShapes(ctx, x, y, s, T, white) {
  const C = T.c;
  ctx.save(); ctx.lineWidth = s * 0.0125; ctx.lineJoin = 'round'; ctx.fillStyle = 'transparent';
  ctx.strokeStyle = white ? alpha('#ffffff', 0.75) : C.a; ctx.beginPath(); ctx.moveTo(x + s * 0.1, y + s * 0.175); ctx.lineTo(x + s * 0.575, y + s * 0.1); ctx.lineTo(x + s * 0.4, y + s * 0.5); ctx.closePath(); ctx.stroke();
  ctx.strokeStyle = white ? alpha('#ffffff', 0.75) : C.a2; ctx.beginPath(); ctx.arc(x + s * 0.75, y + s * 0.26, s * 0.175, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = white ? alpha('#ffffff', 0.75) : C.p; ctx.save(); ctx.translate(x + s * 0.49, y + s * 0.74); ctx.rotate(28 * Math.PI / 180); ctx.strokeRect(-s * 0.1625, -s * 0.1625, s * 0.325, s * 0.325); ctx.restore();
  ctx.restore();
}

TEMPLATES.push(
{
  id: 'ac_poster', type: 'ann', name: 'إعلان الأكاديمية', tags: 'أكاديمية إعلان نعناع أشرطة تذييل رسمي هوية', isNew: 1,
  sizes: ['post', 'square', 'story', 'yt'],
  variants: [{ id: 'mint', name: 'نعناعي', sw: ['#ffffff', '#00837b', '#f45907'] }, { id: 'teal', name: 'أخضر', sw: ['#00837b', '#ffffff', '#f45907'] }, { id: 'night', name: 'بنفسجي', sw: ['#522b60', '#ffffff', '#c70e3a'] }],
  colorLabels: { bg: 'لون الخلفية', title: 'لون العنوان', accent: 'لون الوسم' },
  fields: [
    { k: 'kicker', label: 'السطر الصغير', def: 'الأنشطة التربوية', max: 40 },
    { k: 'title', label: 'العنوان', kind: 'area', def: 'الملتقى الجامعي', max: 60 },
    { k: 'sub', label: 'تحت العنوان', def: 'لقاء مفتوح لطلاب الجامعة', max: 70 },
    { k: 'date', label: 'التاريخ', def: 'الخميس 12 جمادى الأولى', max: 40, half: 1 },
    { k: 'time', label: 'الوقت', def: '8:30 مساءً', max: 30, half: 1 },
    { k: 'place', label: 'المكان', def: '', max: 40, half: 1 },
    { k: 'tag', label: 'الوسم', def: 'آخر موعد للتسجيل: الأربعاء', max: 40, half: 1 },
    { k: 'water', label: 'الكلمة المائية (بالكشيدة)', def: 'الملتـقى', max: 16 },
    { k: 'mail', label: 'البريد في التذييل', def: 'JeelAcademySA@gmail.com', max: 50 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, wide = W > H * 1.2, tall = H > W * 1.5, u = (wide ? H : W) / 1080, q = tall ? 1.12 : wide ? 0.9 : 1, m = 72 * u;
    const mint = v === 'mint', base = OV.bg || (mint ? '#ffffff' : v === 'teal' ? C.p : C.s), dark = isDark(base);
    const fg = OV.title || (dark ? '#ffffff' : C.ink), soft = dark ? alpha('#ffffff', 0.86) : alpha(C.ink, 0.82), brandT = dark ? '#ffffff' : C.pd;
    paintBg(ctx, W, H, base);
    // أرضية النعناع: هالة خفيفة في الزاويتين
    if (D() && !BGFX) quiet(function () {
      const halo = dark ? alpha('#ffffff', 0.07) : alpha(C.warm, 0.95);
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, halo); g.addColorStop(0.38, alpha(base, 0)); g.addColorStop(0.7, alpha(base, 0)); g.addColorStop(1, halo);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    });
    G(ctx, 'logo'); drawLogo(ctx, T, W - m, m, (wide ? 280 : 300) * u, dark ? '#ffffff' : 'color', 'tr');
    G(ctx, 'deco'); if (D()) acShapes(ctx, wide ? m * 0.6 : 40 * u, 40 * u, 260 * u, T, dark);
    // الكلمة المائية الممدودة تخرج من الحافة اليسرى
    G(ctx, 'deco'); if (D() && has(d.water)) quiet(function () {
      const s = (wide ? 200 : 220) * u * q;
      ctx.save(); ctx.font = F(s, fontOf('title', 1, true).fam); ctx.direction = 'rtl'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = dark ? alpha('#ffffff', 0.09) : alpha(C.warm, 1);
      ctx.fillText(ntClean(d.water), -30 * u, (wide ? H * 0.42 : tall ? H * 0.3 : 360 * u)); ctx.restore();
    });
    // المحتوى في العمود الأيمن: يُقاس أولاً ثم يُصغَّر حتى يتسع بين الشعار والتذييل
    const colW = wide ? W * 0.62 : W - 2 * m, xr = W - m;
    const ruleH = 20 * u, footH = 4 * ruleH + 3 * ruleH * 0.3 + 70 * u, footY = H - footH - (tall ? 60 : 30) * u;
    const top = m + (wide ? 150 : 200) * u, bot = footY - 40 * u;
    const infos = [['date', 'calendar-event'], ['time', 'clock-hour-8'], ['place', 'map-pin']].filter(function (x) { return has(d[x[0]]); });
    const plan = function (z) {
      const L = { z: z, h: 0 };
      L.kh = has(d.kicker) ? 70 * u * z : 0;
      L.tf = fit(ctx, ntClean(d.title), { maxW: colW, maxLines: 2, size: 150 * u * z * k, lh: 1.12, bold: 1, title: true, balance: true });
      L.sf = has(d.sub) ? fit(ctx, ntClean(d.sub), { maxW: colW, maxLines: 2, size: 42 * u * z, lh: 1.35, bold: 0.6 }) : null;
      L.is = 34 * u * z; let rows = infos.length ? 1 : 0, x = 0;
      infos.forEach(function (it) { const w = textW(ctx, ntClean(d[it[0]]), L.is, 0.6, false) + L.is * 1.35 + 48 * u; if (x && x + w > colW) { rows++; x = 0; } x += w; });
      L.ih = rows ? rows * L.is * 1.7 - L.is * 0.6 + 34 * u * z : 0;
      L.th = has(d.tag) ? 28 * u * z * 1.9 : 0;
      L.h = L.kh + L.tf.h + 22 * u * z + (L.sf ? L.sf.h + 34 * u * z : 0) + L.ih + L.th;
      return L;
    };
    let P = plan(q); for (let n = 0; n < 10 && P.h > bot - top; n++) P = plan(P.z * 0.92);
    const z = P.z;
    let y = Math.max(top, Math.min((wide ? H * 0.3 : tall ? H * 0.36 : H * 0.35), bot - P.h));
    G(ctx, 'kicker'); if (P.kh) {
      line(ctx, ntClean(d.kicker), xr - 34 * u, y + 20 * u * z, { size: 38 * u * z, color: brandT, align: 'right', bold: 0.8, maxW: colW - 40 * u });
      ctx.beginPath(); ctx.arc(xr - 11 * u, y + 20 * u * z, 11 * u, 0, Math.PI * 2); ctx.fillStyle = C.a; ctx.fill(); y += P.kh;
    }
    G(ctx, 'title'); drawFit(ctx, P.tf, xr, y, { align: 'right', color: fg }); y += P.tf.h + 22 * u * z;
    G(ctx, 'sub'); if (P.sf) { drawFit(ctx, P.sf, xr, y, { align: 'right', color: soft }); y += P.sf.h + 34 * u * z; }
    // أسطر المعلومات بأيقونات الهوية: التاريخ ثم الوقت ثم المكان
    G(ctx, 'info'); if (infos.length) {
      let x = xr; const s = P.is, ic = dark ? '#ffffff' : C.p;
      infos.forEach(function (it) {
        const t = ntClean(d[it[0]]), w = textW(ctx, t, s, 0.6, false);
        if (x < xr && x - w - s * 1.35 < xr - colW) { x = xr; y += s * 1.7; }
        ctx.save(); ctx.translate(x - s * 0.55, y + s * 0.55); drawTIcon(ctx, it[1], s * 1.05, ic, 2); ctx.restore();
        line(ctx, t, x - s * 1.35, y + s * 0.55, { size: s, color: fg, align: 'right', bold: 0.6 });
        x -= w + s * 1.35 + 48 * u;
      });
      y += s * 1.1 + 34 * u * z;
    }
    G(ctx, 'tag'); if (P.th) {
      const s = 28 * u * z, t = ntClean(d.tag), w = textW(ctx, t, s, 1, false) + s * 1.8, h = s * 1.9, fill = OV.accent || (dark ? '#ffffff' : C.a2);
      fillRR(ctx, xr - w, y, w, h, h / 2, fill); line(ctx, t, xr - s * 0.9, y + h / 2, { size: s, color: onBg(fill), align: 'right', bold: 1 });
    }
    // التذييل: المسطرة بعرض التصميم، وتحتها البريد والحسابات
    G(ctx, 'footer'); {
      const ry = footY;
      acRule(ctx, W, ry, ruleH, T, base, false);
      const fy = ry + 4 * ruleH + 3 * ruleH * 0.3 + 40 * u;
      if (has(d.mail)) line(ctx, d.mail, m, fy, { size: 26 * u, color: brandT, align: 'left' });
      social(ctx, dark ? '#ffffff' : C.pd, W - m, fy - 16 * u, 230 * u, 'tr');
    }
  }
}
);
