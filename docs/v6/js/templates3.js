/* ================= طقم «خارطة الثغور» (مشروع العمر) =================
   قوالب مبنية على لغة البرنامج البصرية: ورق كريمي بخطوط خريطة باهتة وزاوية ورق ممزّق ذهبية،
   أو كحلي داكن عليه شبح الشعار ونجوم رباعية، كبسولات ذهبية للعناوين الفرعية، معيّنات، صناديق كحلية، بطاقات زجاجية.
   تعمل بأي هوية (الألوان من الهوية)، وتظهر في البرامج التي فعّل المشرف فيها هذا الطقم. */

// لوحات ألوان جاهزة لهويات البرامج (تظهر في نموذج الهوية في الإدارة)
const ID_PRESETS = [['khartah', 'خارطة الثغور: كحلي وذهبي على ورق كريمي', { p: '#273e72', pd: '#1a2a52', pl: '#4d6398', s: '#bc914c', sd: '#946f37', sdd: '#5e4521', a: '#bc914c', a2: '#a27a3d', paper: '#f3efe6', warm: '#eae2d2', ink: '#1f2a44', muted: '#8a877f', teal: '#16234a', tealL: '#3b5288' }]];
const TPL_SETS = [['omr', 'طقم خارطة الثغور', 'لقاء، جدول دورة، تعريف بالبرنامج، شهادة اجتياز، تنبيه، حفل وفقرات، شارة المجموعات، غلاف يوتيوب']];

/* ---------- أدوات الطقم ---------- */
function omRnd(seed) { let s = seed || 7; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
function omArNum(n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[+d]; }); }
// ورق كريمي بخطوط خريطة باهتة: كنتورات، دوائر عرض متقطعة، شبكة خفيفة، وردة بوصلة
function omMapLines(ctx, W, H, ink, strength) {
  const u = W / 1080, r = omRnd(11), a = strength == null ? 1 : strength;
  ctx.save();
  ctx.strokeStyle = alpha(ink, 0.035 * a); ctx.lineWidth = 1.2 * u;
  for (let x = 54 * u; x < W; x += 108 * u) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 54 * u; y < H; y += 108 * u) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.strokeStyle = alpha(ink, 0.075 * a); ctx.lineWidth = 2 * u; ctx.lineJoin = 'round';
  for (let i = 0; i < 7; i++) {
    const y0 = H * (0.08 + i * 0.14), f1 = 1.5 + r() * 2, f2 = 3 + r() * 3, p1 = r() * 6, p2 = r() * 6, amp = (40 + r() * 70) * u;
    ctx.beginPath();
    for (let x = -20 * u; x <= W + 20 * u; x += 14 * u) { const t = x / W; const y = y0 + Math.sin(t * f1 * Math.PI + p1) * amp + Math.sin(t * f2 * Math.PI + p2) * amp * 0.35; if (x < 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
  }
  ctx.setLineDash([7 * u, 12 * u]); ctx.strokeStyle = alpha(ink, 0.09 * a); ctx.lineWidth = 1.6 * u;
  [[W * 1.15, H * 0.12], [-W * 0.2, H * 0.85], [W * 0.5, H * 1.3]].forEach(function (c, j) { for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.arc(c[0], c[1], W * (0.42 + q * 0.17 + j * 0.05), 0, Math.PI * 2); ctx.stroke(); } });
  ctx.setLineDash([]);
  // علامات تقاطع صغيرة
  ctx.strokeStyle = alpha(ink, 0.12 * a); ctx.lineWidth = 1.6 * u;
  for (let i = 0; i < 14; i++) { const x = r() * W, y = r() * H, s = 7 * u; ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.stroke(); }
  // وردة البوصلة
  const cx = W * 0.1, cy = H * 0.47, R = 70 * u;
  ctx.strokeStyle = alpha(ink, 0.1 * a); ctx.lineWidth = 1.6 * u;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = alpha(ink, 0.1 * a);
  for (let i = 0; i < 4; i++) { const an = i * Math.PI / 2; ctx.beginPath(); ctx.moveTo(cx + R * 1.25 * Math.cos(an), cy + R * 1.25 * Math.sin(an)); ctx.lineTo(cx + R * 0.16 * Math.cos(an + 0.9), cy + R * 0.16 * Math.sin(an + 0.9)); ctx.lineTo(cx + R * 0.16 * Math.cos(an - 0.9), cy + R * 0.16 * Math.sin(an - 0.9)); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
// زاوية ورق ممزّق ذهبية مع حافة بيضاء وخط ذهبي داخلي، في زاوية معيّنة: 'tr' أو 'bl' أو 'tl' أو 'br'
function omTorn(ctx, W, H, corner, gold, seed, size) {
  const u = W / 1080, r = omRnd(seed || 3), sz = size || 0.3;
  const right = /r/.test(corner), top = /t/.test(corner);
  const edge = function (k) {
    // نقاط الحافة الممزّقة من الحافة العلوية/السفلية إلى الجانبية
    const pts = [], n = 18, ax = right ? W : 0, ay = top ? 0 : H, dirx = right ? -1 : 1, diry = top ? 1 : -1;
    const lenX = W * sz * (0.9 + k * 0.1), lenY = H * sz * 0.5 * (0.9 + k * 0.1);
    for (let i = 0; i <= n; i++) {
      const t = i / n, jag = (r() - 0.5) * 26 * u * (0.4 + Math.sin(t * Math.PI));
      pts.push([ax + dirx * lenX * (1 - t) * (1 - t * 0.15) + diry * 0 + (right ? -1 : 1) * jag * (1 - t), ay + diry * (lenY * Math.pow(t, 1.6)) + jag * t]);
    }
    return pts;
  };
  const draw = function (pts, fill, lw, stroke) {
    ctx.beginPath(); ctx.moveTo(right ? W : 0, top ? 0 : H);
    pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); });
    ctx.lineTo(right ? W : 0, top ? 0 : H); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
  };
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.14)'; ctx.shadowBlur = 24 * u; ctx.shadowOffsetX = right ? -4 * u : 4 * u; ctx.shadowOffsetY = top ? 6 * u : -6 * u;
  // طبقة ورق بيضاء تحت الذهبي (حافة التمزق)
  draw(edge(1.06), '#f7f3ea');
  ctx.shadowColor = 'transparent';
  const g = ctx.createLinearGradient(right ? W : 0, top ? 0 : H, right ? W * (1 - sz) : W * sz, top ? H * sz : H * (1 - sz));
  g.addColorStop(0, lighten(gold, 0.08)); g.addColorStop(1, lighten(gold, -0.12));
  draw(edge(1), g);
  // خط ذهبي داكن رفيع قرب الحافة، كأنه ألياف الورق
  ctx.globalAlpha = 0.55; draw(edge(0.93), null, 1.4 * u, lighten(gold, -0.35)); ctx.globalAlpha = 1;
  ctx.restore();
}
// كحلي داكن: تدرّج، شبح الشعار بالأبيض الشفاف، شبكة خفيفة، نجوم رباعية ذهبية
function omNight(ctx, W, H, base, T, gold, o) {
  o = o || {};
  const u = W / 1080;
  if (!o.noFill) {
    const g = ctx.createRadialGradient(W * 0.85, H * 0.05, 0, W * 0.5, H * 0.5, Math.max(W, H) * 1.05);
    g.addColorStop(0, lighten(base, 0.22)); g.addColorStop(0.5, base); g.addColorStop(1, lighten(base, -0.42));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  ctx.save();
  if (o.grid !== false) {
    ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 1.2 * u;
    for (let x = 54 * u; x < W; x += 108 * u) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 54 * u; y < H; y += 108 * u) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }
  if (o.ghost !== false && !HIDE.deco) {
    const im = tinted(logoKey(T), '#ffffff');
    if (im) {
      const ar = srcH(im) / srcW(im), w = W * 0.95;
      ctx.globalAlpha = 0.055;
      ctx.save(); ctx.translate(W * 0.78, H * 0.1); ctx.rotate(-0.08); ctx.drawImage(im, -w / 2, -w * ar / 2, w, w * ar); ctx.restore();
      ctx.save(); ctx.translate(W * 0.2, H * 0.94); ctx.rotate(0.06); ctx.drawImage(im, -w / 2, -w * ar / 2, w, w * ar); ctx.restore();
      ctx.globalAlpha = 1;
    }
  }
  if (o.sparks !== false && !HIDE.deco) {
    const r = omRnd(o.seed || 5);
    [[0.06, 0.13, 54], [0.94, 0.24, 22], [0.05, 0.7, 18], [0.95, 0.88, 64], [0.6, 0.04, 14], [0.3, 0.965, 12]].forEach(function (q, i) {
      const x = W * q[0], y = H * q[1], s = q[2] * u;
      ctx.save(); ctx.shadowColor = alpha(gold, 0.6); ctx.shadowBlur = s * 0.9;
      sparkle(ctx, x, y, s, i === 3 ? lighten(gold, 0.08) : alpha(gold, 0.9)); ctx.restore();
      if (s > 40) { ctx.save(); ctx.globalAlpha = 0.9; sparkle(ctx, x, y, s * 0.42, o.noFill ? alpha('#000000', 0.25) : lighten(base, -0.3)); ctx.restore(); }
      void r;
    });
  }
  ctx.restore();
}
// بطاقة زجاجية شفافة بحافة فاتحة
function omGlass(ctx, x, y, w, h, r, dark) {
  const u = w / 900;
  ctx.save();
  if (dark) {
    rrect(ctx, x, y, w, h, r); ctx.fillStyle = 'rgba(255,255,255,0.09)'; ctx.fill();
    const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, 'rgba(255,255,255,0.45)'); g.addColorStop(0.5, 'rgba(255,255,255,0.1)'); g.addColorStop(1, 'rgba(255,255,255,0.35)');
    rrect(ctx, x, y, w, h, r); ctx.strokeStyle = g; ctx.lineWidth = 2 * u; ctx.stroke();
    rrect(ctx, x + 2 * u, y + 2 * u, w - 4 * u, h * 0.45, [r - 2 * u, r - 2 * u, 0, 0]);
    const g2 = ctx.createLinearGradient(x, y, x, y + h * 0.45); g2.addColorStop(0, 'rgba(255,255,255,0.08)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g2; ctx.fill();
  } else {
    ctx.shadowColor = 'rgba(40,40,60,0.12)'; ctx.shadowBlur = 30 * u; ctx.shadowOffsetY = 10 * u;
    rrect(ctx, x, y, w, h, r); ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.fill();
    ctx.shadowColor = 'transparent';
    rrect(ctx, x, y, w, h, r); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2 * u; ctx.stroke();
  }
  ctx.restore();
}
// كبسولة متمركزة على نقطة: تعيد عرضها
function omPillC(ctx, str, cx, yc, size, fill, color, o) {
  if (!has(str)) return 0;
  o = o || {};
  const tw = textW(ctx, str, size, o.bold == null ? 0.6 : o.bold), w = tw + size * 1.6;
  const p = pill(ctx, str, cx + w / 2, yc, size, fill, color, { bold: o.bold == null ? 0.6 : o.bold });
  return p.w;
}
function omDiamond(ctx, cx, cy, s, color) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4); ctx.fillStyle = color; ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore(); }
// إطار بأقواس وزوايا مربعة حول عنوان (كما في ملصق اللقاء الافتتاحي)
function omBracket(ctx, x, y, w, h, color, u) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2 * u; ctx.lineJoin = 'round';
  rrect(ctx, x, y, w, h, 10 * u); ctx.stroke();
  ctx.fillStyle = color; const s = 9 * u;
  [[x, y + h / 2], [x + w, y + h / 2], [x + w * 0.25, y], [x + w * 0.75, y], [x + w * 0.25, y + h], [x + w * 0.75, y + h]].forEach(function (p) { ctx.fillRect(p[0] - s / 2, p[1] - s / 2, s, s); });
  ctx.restore();
}
// خط ذهبي تحت نص مع معيّن صغير في طرفه
function omRule(ctx, x0, x1, y, color, u) { hline(ctx, x0, x1, y, color, 2.5 * u); omDiamond(ctx, x1, y, 9 * u, color); omDiamond(ctx, x0, y, 9 * u, color); }
// خط متقطع رفيع (قائد) بين نقطتين
function omLeader(ctx, x0, x1, y, color, u) { ctx.save(); ctx.setLineDash([3 * u, 9 * u]); ctx.lineCap = 'round'; hline(ctx, x0, x1, y, color, 3 * u); ctx.restore(); }
// عقارب ساعة كبيرة باهتة (ملصق التنبيه)
function omClockGhost(ctx, W, H, color) {
  const u = W / 1080, cx = W * 0.12, cy = H * 0.1, R = W * 0.72;
  ctx.save(); ctx.strokeStyle = color; ctx.lineCap = 'round';
  ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.lineWidth = 10 * u; ctx.beginPath(); ctx.moveTo(cx + (R - 70 * u) * Math.cos(a), cy + (R - 70 * u) * Math.sin(a)); ctx.lineTo(cx + (R - 24 * u) * Math.cos(a), cy + (R - 24 * u) * Math.sin(a)); ctx.stroke(); }
  ctx.lineWidth = 26 * u; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * 0.55 * Math.cos(0.55), cy + R * 0.55 * Math.sin(0.55)); ctx.stroke();
  ctx.lineWidth = 20 * u; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * 0.78 * Math.cos(1.25), cy + R * 0.78 * Math.sin(1.25)); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 36 * u, 0, Math.PI * 2); ctx.lineWidth = 10 * u; ctx.stroke();
  ctx.restore();
}
// موجات ذهبية في زاويتين (الشهادة)
function omWaves(ctx, W, H, gold) {
  const u = W / 1600;
  const wave = function (flip) {
    ctx.save(); if (flip) { ctx.translate(W, H); ctx.rotate(Math.PI); }
    const g = ctx.createLinearGradient(W, 0, W * 0.7, H * 0.4); g.addColorStop(0, lighten(gold, 0.18)); g.addColorStop(0.6, gold); g.addColorStop(1, lighten(gold, -0.2));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W, H * 0.46);
    ctx.bezierCurveTo(W * 0.93, H * 0.5, W * 0.88, H * 0.28, W * 0.86, H * 0.22); ctx.bezierCurveTo(W * 0.84, H * 0.14, W * 0.8, H * 0.02, W * 0.74, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W, H * 0.3);
    ctx.bezierCurveTo(W * 0.95, H * 0.3, W * 0.9, H * 0.16, W * 0.88, H * 0.1); ctx.bezierCurveTo(W * 0.86, H * 0.04, W * 0.84, H * 0.01, W * 0.82, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = lighten(gold, -0.3); ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(W, H * 0.5); ctx.bezierCurveTo(W * 0.92, H * 0.54, W * 0.87, H * 0.3, W * 0.85, H * 0.24); ctx.bezierCurveTo(W * 0.83, H * 0.16, W * 0.79, H * 0.03, W * 0.72, -2 * u); ctx.stroke();
    ctx.restore();
  };
  wave(false); wave(true);
}
// صورة بإطار ذهبي رفيع وظل ناعم
function omPhotoFrame(ctx, P, x, y, w, h, gold, u) {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 30 * u; ctx.shadowOffsetY = 12 * u;
  ctx.fillStyle = gold; ctx.fillRect(x - 6 * u, y - 6 * u, w + 12 * u, h + 12 * u); ctx.restore();
  ctx.fillStyle = '#e9e4da'; ctx.fillRect(x, y, w, h);
  if (P && P.im) drawPhoto(ctx, P.im, x, y, w, h, { z: P.z, ox: P.ox, oy: P.oy, fit: 'cover' });
  else { ctx.fillStyle = alpha(gold, 0.5); ctx.font = F(h * 0.12, 'sans-serif'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('صورة', x + w / 2, y + h / 2); }
}
// أرضية الطقم حسب المتغيّر: paper / night / glass(تدرّج أزرق)؛ تعيد لون الأرضية
function omBase(ctx, W, H, T, v, o) {
  o = o || {};
  const C = T.c, gold = C.a;
  if (OV.bg || BGFX) { paintBg(ctx, W, H, OV.bg || C.paper); return OV.bg || C.paper; }
  if (v === 'night') { omNight(ctx, W, H, o.night || C.teal, T, gold, o); return o.night || C.teal; }
  if (v === 'glass') {
    const g = ctx.createLinearGradient(W, 0, 0, H); g.addColorStop(0, lighten(C.p, 0.1)); g.addColorStop(0.55, C.p); g.addColorStop(1, lighten(C.pd, -0.1));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (!HIDE.deco) { const gl = ctx.createRadialGradient(W * 0.85, H * 1.05, 0, W * 0.85, H * 1.05, W * 0.55); gl.addColorStop(0, alpha(lighten(gold, 0.25), 0.95)); gl.addColorStop(0.45, alpha(gold, 0.35)); gl.addColorStop(1, alpha(gold, 0)); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H); }
    omNight(ctx, W, H, 'transparent', T, gold, { sparks: false, ghost: true, grid: false, noFill: true }); return C.p;
  }
  // ورق
  const base = C.paper;
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H); g.addColorStop(0, lighten(base, 0.3)); g.addColorStop(1, lighten(base, -0.04));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (!HIDE.deco) {
    omMapLines(ctx, W, H, C.p, 1);
    if (o.torn !== false) { const cs = o.corners || ['tr', 'bl']; cs.forEach(function (c, i) { omTorn(ctx, W, H, c, gold, [3, 9, 5, 7][i], (o.tornSize || 0.2) * (i ? 0.75 : 1)); }); }
  }
  return base;
}

TEMPLATES.push(

/* ---------- خ1. لقاء خارطة ---------- */
{
  id: 'om_meet', type: 'ann', name: 'لقاء خارطة', tags: 'خارطة الثغور لقاء محاضرة مقدم أستاذ موعد كبسولة ذهبية', isNew: 1, set: 'omr',
  sizes: ['post', 'square', 'story'],
  variants: [{ id: 'paper', name: 'ورق الخريطة', sw: ['#f3efe6', '#273e72', '#bc914c'] }, { id: 'night', name: 'ليل كحلي', sw: ['#16234a', '#ffffff', '#bc914c'] }, { id: 'glass', name: 'زجاج أزرق', sw: ['#273e72', '#ffffff', '#e0c27d'] }],
  colorLabels: { bg: 'لون الأرضية', title: 'لون العنوان', accent: 'اللون الذهبي' },
  fields: [
    { k: 'tag', label: 'الكبسولة فوق العنوان', def: 'لقــاء جديد بعنوان', max: 30 },
    { k: 'title', label: 'العنوان', kind: 'area', def: 'كيف أختار ثغري؟', max: 40 },
    { k: 'sub', label: 'سطر تحت العنوان', def: 'سؤال تحديد المشروع الإصلاحي الفردي', max: 70 },
    { k: 'whoLabel', label: 'قبل اسم المقدّم', def: 'مع الأستاذ', max: 20, half: 1 },
    { k: 'who', label: 'المقدّم', def: 'محمد عبدالوهاب', max: 30, half: 1 },
    { k: 'photo', label: 'صورة المقدّم (اختياري)', kind: 'image', def: '', optional: true },
    { k: 'time', label: 'الساعة', def: 'الساعة السابعة والنصف ليلاً', max: 40 },
    { k: 'tz', label: 'التوقيت', def: 'بتوقيت مكة المكرمة', max: 30, half: 1 },
    { k: 'day', label: 'اليوم', def: 'اليوم؛ الخميس', max: 24, half: 1 },
    { k: 'note', label: 'سطر الختام', def: 'فكونوا على الموعد', max: 36 }
  ],
  draw: function (ctx, W, H, d, T, v, k, P) {
    const C = T.c, u = W / 1080, sv = svOf(W, H), gold = OV.accent || C.a, tall = H > W * 1.5;
    const base = omBase(ctx, W, H, T, v, { tornSize: tall ? 0.18 : 0.21 });
    const dark = isDark(base), fg = dark ? '#ffffff' : C.p, ink = dark ? 'rgba(255,255,255,0.85)' : C.ink;
    const mx = 90 * u, cw = W - mx * 2;
    let y = (tall ? 150 : 72) * u;
    G(ctx, 'logo'); const lg = drawLogo(ctx, T, W / 2, y, 330 * u, dark ? '#ffffff' : 'color', 'tc'); y += (lg.h || 150 * u) + 46 * sv;
    G(ctx, 'tag'); if (has(d.tag)) { omPillC(ctx, d.tag, W / 2, y + 26 * sv, 30 * sv, gold, '#ffffff'); y += 84 * sv; }
    // يُحجز لبطاقة التفاصيل (أو الصورة) والتذييل مكانهما أولاً، ثم يأخذ العنوان ما بقي
    const reserve = 300 * sv + ((P.photo && P.photo.im) ? 380 : 400) * sv + (has(d.sub) ? 70 * sv : 0) + 50 * sv;
    const tf = fit(ctx, d.title, { maxW: cw, maxH: Math.max(110 * sv, Math.min(300 * sv, H - y - reserve)), size: 104 * sv * k, lh: 1.22, balance: true, bold: 1, title: true });
    G(ctx, 'title'); drawFit(ctx, tf, W / 2, y, { align: 'center', color: OV.title || fg }); y += tf.h + 14 * sv;
    G(ctx, 'sub'); if (has(d.sub)) { const sf = fit(ctx, d.sub, { maxW: cw, size: 36 * sv, lh: 1.4, maxLines: (H - y - reserve) > 40 * sv ? 2 : 1 }); drawFit(ctx, sf, W / 2, y, { align: 'center', color: dark ? alpha('#ffffff', 0.8) : alpha(C.ink, 0.75) }); y += sf.h; }
    y += 50 * sv;
    const footH = 300 * sv, by = H - footH;
    const midH = by - y;
    if (P.photo && P.photo.im) {
      // تخطيط المتحدث: صورة بإطار ذهبي يميناً، والاسم في كبسولة يساراً
      const ph = Math.min(midH, 560 * sv), pw = Math.min(W * 0.5, ph * 0.86), px = W - mx - pw, py = y + (midH - ph) / 2;
      G(ctx, 'photo'); omPhotoFrame(ctx, P.photo, px, py, pw, ph, gold, u);
      const xr = px - 56 * u, wL = xr - mx;
      G(ctx, 'who');
      const ly = py + ph * 0.5;
      line(ctx, d.whoLabel, xr, ly - 46 * sv, { size: 34 * sv, color: dark ? alpha('#ffffff', 0.8) : alpha(C.ink, 0.7), align: 'right', maxW: wL });
      const nw = Math.min(wL, textW(ctx, d.who, 42 * sv, 0.9, true) + 60 * u);
      if (has(d.who)) { fillRR(ctx, xr - nw, ly + 2 * sv, nw, 76 * sv, 14 * u, dark ? 'rgba(255,255,255,0.14)' : alpha(gold, 0.22)); line(ctx, d.who, xr - 30 * u, ly + 40 * sv, { size: 42 * sv, color: fg, align: 'right', bold: 0.9, title: true, maxW: nw - 50 * u }); }
    } else {
      // تخطيط التفاصيل: بطاقة زجاجية فيها المقدّم واليوم والساعة
      const ch = Math.min(midH, 440 * sv), cy0 = y + (midH - ch) / 2, cx0 = mx, cwid = cw;
      G(ctx, 'card'); omGlass(ctx, cx0, cy0, cwid, ch, 36 * u, dark); area(cx0, cy0, cx0 + cwid, cy0 + ch);
      omPillC(ctx, 'تفاصيـــل اللقـاء', W / 2, cy0 + 4 * sv, 26 * sv, gold, '#ffffff');
      const rows = [['user', d.whoLabel, d.who], ['cal', 'اليــوم:', d.day]];
      const colW = cwid / 2, ry = cy0 + ch * 0.4;
      G(ctx, 'who');
      rows.forEach(function (r, i) {
        const xr = cx0 + cwid - i * colW - 60 * u;
        ctx.beginPath(); ctx.arc(xr - 22 * sv, ry - 40 * sv, 24 * sv, 0, Math.PI * 2); ctx.fillStyle = gold; ctx.fill();
        icon(ctx, r[0] === 'user' ? 'mic' : 'cal', xr - 22 * sv, ry - 40 * sv, 28 * sv, dark ? C.teal : '#ffffff');
        line(ctx, r[1], xr - 60 * sv, ry - 40 * sv, { size: 30 * sv, color: dark ? alpha('#ffffff', 0.8) : alpha(C.ink, 0.7), align: 'right', maxW: colW - 90 * u });
        line(ctx, r[2], xr, ry + 36 * sv, { size: 40 * sv, color: fg, align: 'right', bold: 0.9, title: true, maxW: colW - 80 * u, min: 12 * sv });
      });
      G(ctx, 'time');
      const ty = cy0 + ch * 0.8;
      ctx.beginPath(); ctx.arc(W / 2 + 120 * sv, ty - 44 * sv, 24 * sv, 0, Math.PI * 2); ctx.fillStyle = gold; ctx.fill(); icon(ctx, 'clock', W / 2 + 120 * sv, ty - 44 * sv, 28 * sv, dark ? C.teal : '#ffffff');
      line(ctx, 'الســاعــة:', W / 2 + 84 * sv, ty - 44 * sv, { size: 30 * sv, color: dark ? alpha('#ffffff', 0.8) : alpha(C.ink, 0.7), align: 'right' });
      line(ctx, [d.time, d.tz].filter(has).join(' · '), W / 2, ty + 28 * sv, { size: 38 * sv, color: fg, align: 'center', bold: 0.9, title: true, maxW: cwid - 100 * u });
    }
    // التذييل: الساعة الكبيرة والتوقيت وكبسولة اليوم، أو سطر الختام عند وجود بطاقة التفاصيل
    G(ctx, 'footer');
    const fy = by + 40 * sv;
    if (P.photo && P.photo.im) {
      const tf2 = fit(ctx, d.time, { maxW: cw, size: 56 * sv, maxLines: 1, bold: 1, title: true, lh: 1.25 });
      drawFit(ctx, tf2, W / 2, fy, { align: 'center', color: fg });
      let yy = fy + tf2.h + 6 * sv;
      if (has(d.tz)) { line(ctx, d.tz, W / 2, yy + 16 * sv, { size: 28 * sv, color: dark ? alpha('#ffffff', 0.75) : alpha(C.ink, 0.7), align: 'center' }); yy += 48 * sv; }
      if (has(d.day)) omPillC(ctx, d.day, W / 2, yy + 36 * sv, 34 * sv, dark ? 'rgba(255,255,255,0.14)' : alpha(gold, 0.22), fg, { bold: 0.9 });
    } else {
      if (has(d.note)) { const f = line(ctx, d.note, W / 2, fy + 60 * sv, { size: 34 * sv, color: fg, align: 'center', bold: 0.7, title: true, maxW: cw }); if (D()) { omDiamond(ctx, W / 2 + f.w / 2 + 34 * u, fy + 60 * sv, 10 * u, gold); omDiamond(ctx, W / 2 - f.w / 2 - 34 * u, fy + 60 * sv, 10 * u, gold); } }
    }
    social(ctx, dark ? 'rgba(255,255,255,0.6)' : alpha(C.ink, 0.5), mx, H - 70 * u, 118 * u, 'tl');
  }
},

/* ---------- خ2. جدول الدورة ---------- */
{
  id: 'om_table', type: 'cover', name: 'جدول الدورة', tags: 'خارطة الثغور جدول دورة تأهيلية أسبوعي يوم موضوع مقرر', isNew: 1, set: 'omr',
  sizes: ['post', 'story', 'square'],
  variants: [{ id: 'paper', name: 'ورق الخريطة', sw: ['#f3efe6', '#273e72', '#bc914c'] }, { id: 'night', name: 'ليل كحلي', sw: ['#16234a', '#ffffff', '#bc914c'] }],
  colorLabels: { bg: 'لون الأرضية', title: 'لون العنوان', accent: 'اللون الذهبي' },
  fields: [
    { k: 'title', label: 'العنوان (يظهر إن أخفيت الشعار أو في الليلي)', def: 'الجدول الأسبوعي', max: 30 },
    { k: 'sub', label: 'تحت العنوان', def: 'جدول الدورة التأهيلية لمشرفي البرنامج', max: 60 },
    { k: 'h1', label: 'رأس العمود الأول', def: 'اليــوم', max: 14, half: 1 },
    { k: 'h2', label: 'رأس العمود الثاني', def: 'الموضــوع', max: 14, half: 1 },
    { k: 'rows', label: 'الأسطر: اليوم | الموضوع', kind: 'area', def: 'الخميس | لقاء تعريفي – عبدالوهاب\nالجمعة | كيف تأسس جيل الصحابة\nالسبت | صناعة الرقم الصعب – محمد حسين\nالأحد | الإشراف في البرامج الإلكترونية وإدارة المجموعات التفاعلية\nالاثنين | لقاء مشروع إحياء منهاج النبوة – محمد شريف\nالثلاثاء | تمرين على تصحيح التمارين', max: 700, hint: 'كل سطر: اليوم | الموضوع. حتى ثمانية أسطر' },
    { k: 'note', label: 'سطر الختام', def: '', max: 50 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, sv = svOf(W, H), gold = OV.accent || C.a, tall = H > W * 1.5;
    const base = omBase(ctx, W, H, T, v, { tornSize: 0.18 });
    const dark = isDark(base), fg = dark ? '#ffffff' : C.p;
    const mx = 90 * u, cw = W - mx * 2, xr = W - mx;
    let y = (tall ? 140 : 64) * u;
    if (dark) {
      // الليلي: شعار صغير يميناً وخط بمعيّنين، ثم عنوان كبير مع نجمة
      G(ctx, 'logo'); const lg = drawLogo(ctx, T, xr, y, 190 * u, '#ffffff', 'tr');
      if (D()) { omLeader(ctx, mx + 30 * u, xr - 230 * u, y + (lg.h || 80 * u) / 2, alpha('#ffffff', 0.35), u); omDiamond(ctx, mx + 14 * u, y + (lg.h || 80 * u) / 2, 12 * u, gold); omDiamond(ctx, mx + 38 * u, y + (lg.h || 80 * u) / 2, 12 * u, gold); }
      y += (lg.h || 80 * u) + 60 * sv;
      const tf = fit(ctx, d.title, { maxW: cw * 0.86, size: 90 * sv * k, maxLines: 2, bold: 1, title: true, lh: 1.2, balance: true });
      G(ctx, 'title'); drawFit(ctx, tf, W / 2, y, { align: 'center', color: OV.title || '#ffffff' }); y += tf.h + 10 * sv;
      G(ctx, 'sub'); if (has(d.sub)) { const f = line(ctx, d.sub, W / 2, y + 26 * sv, { size: 40 * sv, color: gold, align: 'center', bold: 0.9, title: true, maxW: cw }); if (D()) sparkle(ctx, W / 2 + f.w / 2 + 40 * u, y + 26 * sv, 16 * u, gold); y += 70 * sv; }
    } else {
      G(ctx, 'logo'); const lg = drawLogo(ctx, T, W / 2, y, 360 * u, 'color', 'tc'); y += (lg.h || 150 * u) + 30 * sv;
      if (HIDE.logo) { const tf = fit(ctx, d.title, { maxW: cw, size: 86 * sv * k, maxLines: 2, bold: 1, title: true, lh: 1.2 }); G(ctx, 'title'); drawFit(ctx, tf, W / 2, y, { align: 'center', color: OV.title || fg }); y += tf.h + 10 * sv; }
      G(ctx, 'sub'); if (has(d.sub)) { line(ctx, d.sub, W / 2, y + 22 * sv, { size: 34 * sv, color: C.p, align: 'center', bold: 0.7, maxW: cw }); y += 70 * sv; }
    }
    const rows = lines(d.rows).slice(0, 8).map(function (r) { return r.split('|').map(function (x) { return x.trim(); }); });
    const n = Math.max(1, rows.length), footH = (has(d.note) ? 130 : 90) * sv;
    const top = y + 10 * sv, hh = 76 * sv, avail = H - footH - top - hh - 16 * sv;
    const rh = Math.min(170 * sv, avail / n), tableH = hh + 16 * sv + rh * n;
    const dayW = Math.min(230 * u, cw * 0.26), gap = 14 * u, subjX0 = mx, subjX1 = xr - dayW - gap;
    G(ctx, 'table'); area(mx, top, xr, top + tableH);
    if (dark) {
      // رأسان بكبسولتين محددتين بالذهبي بطرفين مزخرفين
      const hp = function (cx, w, str) { ctx.save(); ctx.strokeStyle = gold; ctx.lineWidth = 2.5 * u; ctx.beginPath(); ctx.moveTo(cx - w / 2 + 20 * u, top); ctx.lineTo(cx + w / 2 - 20 * u, top); ctx.quadraticCurveTo(cx + w / 2 + 6 * u, top, cx + w / 2 + 8 * u, top + hh / 2); ctx.quadraticCurveTo(cx + w / 2 + 6 * u, top + hh, cx + w / 2 - 20 * u, top + hh); ctx.lineTo(cx - w / 2 + 20 * u, top + hh); ctx.quadraticCurveTo(cx - w / 2 - 6 * u, top + hh, cx - w / 2 - 8 * u, top + hh / 2); ctx.quadraticCurveTo(cx - w / 2 - 6 * u, top, cx - w / 2 + 20 * u, top); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill(); ctx.stroke(); omDiamond(ctx, cx - w / 2 - 8 * u, top + hh / 2, 10 * u, gold); omDiamond(ctx, cx + w / 2 + 8 * u, top + hh / 2, 10 * u, gold); ctx.restore(); line(ctx, str, cx, top + hh / 2, { size: 34 * sv, color: '#ffffff', align: 'center', bold: 0.9, title: true, maxW: w - 60 * u }); };
      hp(xr - dayW / 2, dayW, d.h1); hp((subjX0 + subjX1) / 2, Math.min(subjX1 - subjX0, 420 * u), d.h2);
      const ty = top + hh + 16 * sv;
      omGlass(ctx, mx - 16 * u, ty - 14 * sv, cw + 32 * u, rh * n + 28 * sv, 30 * u, true);
      rows.forEach(function (r, i) {
        const ry = ty + i * rh, pad = 10 * sv;
        fillRR(ctx, mx, ry + pad, cw, rh - pad * 2, 18 * u, 'rgba(10,16,40,0.35)');
        line(ctx, r[0], xr - 30 * u, ry + rh / 2, { size: Math.min(36 * sv, rh * 0.34), color: gold, align: 'right', bold: 0.9, title: true, maxW: dayW - 30 * u });
        const sf = fit(ctx, r[1] || '', { maxW: subjX1 - subjX0 - 30 * u, size: Math.min(34 * sv, rh * 0.32), maxLines: 2, lh: 1.25, bold: 0.6 }); drawFit(ctx, sf, subjX1 - 10 * u, ry + rh / 2 - sf.h / 2, { align: 'right', color: '#ffffff' });
      });
    } else {
      // الورقي: رأس الموضوع كبسولة ذهبية، عمود الأيام كحلي بأيقونة تقويم، معيّنات في الأسطر
      ctx.save(); ctx.shadowColor = 'rgba(30,40,80,0.12)'; ctx.shadowBlur = 28 * u; ctx.shadowOffsetY = 10 * u;
      fillRR(ctx, mx, top, subjX1 - mx, tableH, [22 * u, 0, 0, 22 * u], 'rgba(255,255,255,0.75)'); ctx.restore();
      fillRR(ctx, mx, top, subjX1 - mx, hh, [22 * u, 0, 0, 0], gold);
      line(ctx, d.h2, (subjX0 + subjX1) / 2, top + hh / 2, { size: 34 * sv, color: '#ffffff', align: 'center', bold: 0.9, title: true });
      fillRR(ctx, xr - dayW, top, dayW, tableH, [0, 22 * u, 22 * u, 0], C.p);
      line(ctx, d.h1, xr - dayW / 2, top + hh / 2, { size: 34 * sv, color: '#ffffff', align: 'center', bold: 0.9, title: true });
      const ty = top + hh + 16 * sv;
      rows.forEach(function (r, i) {
        const ry = ty + i * rh;
        if (i) { hline(ctx, mx + 20 * u, subjX1 - 10 * u, ry, alpha(C.p, 0.14), 1.5 * u); hline(ctx, xr - dayW + 14 * u, xr - 14 * u, ry, 'rgba(255,255,255,0.18)', 1.5 * u); }
        const dsz = Math.min(38 * sv, rh * 0.32);
        icon(ctx, 'cal', xr - 40 * u, ry + rh / 2, dsz * 0.95, gold);
        line(ctx, r[0], xr - 74 * u, ry + rh / 2, { size: dsz, color: '#ffffff', align: 'right', bold: 0.9, title: true, maxW: dayW - 90 * u });
        const sf = fit(ctx, r[1] || '', { maxW: subjX1 - subjX0 - 110 * u, size: Math.min(34 * sv, rh * 0.3), maxLines: 2, lh: 1.3, bold: 0.7 });
        drawFit(ctx, sf, subjX1 - 30 * u, ry + rh / 2 - sf.h / 2, { align: 'right', color: C.ink });
        if (D()) omDiamond(ctx, mx + 36 * u, ry + rh / 2, 12 * u, gold);
      });
    }
    G(ctx, 'footer');
    if (has(d.note)) line(ctx, d.note, W / 2, H - footH / 2 - 10 * sv, { size: 28 * sv, color: dark ? alpha('#ffffff', 0.75) : alpha(C.ink, 0.7), align: 'center', maxW: cw });
    social(ctx, dark ? 'rgba(255,255,255,0.55)' : alpha(C.ink, 0.45), mx, H - 62 * u, 110 * u, 'tl');
  }
},

/* ---------- خ3. تعريف بالبرنامج ---------- */
{
  id: 'om_info', type: 'cover', name: 'تعريف بالبرنامج', tags: 'خارطة الثغور تعريف ما هو البرنامج محتويات مواد دورات مشاريع مدة', isNew: 1, set: 'omr',
  sizes: ['post', 'story'],
  variants: [{ id: 'paper', name: 'ورق الخريطة', sw: ['#f3efe6', '#273e72', '#bc914c'] }, { id: 'night', name: 'ليل كحلي', sw: ['#16234a', '#ffffff', '#bc914c'] }],
  colorLabels: { bg: 'لون الأرضية', title: 'لون العنوان', accent: 'اللون الذهبي' },
  fields: [
    { k: 'eyebrow', label: 'كلمة فوق الشعار', def: 'برنــامج', max: 16 },
    { k: 'q', label: 'كبسولة السؤال', def: 'ما هو خارطة الثغور؟', max: 30 },
    { k: 'intro', label: 'الفقرة التعريفية', kind: 'area', def: 'يهدف البرنامج *لتمكين المصلحين* تأصيلاً وتطبيقاً، في جانب المفاهيم والأفكار وجانب الأدوات والمهارات، ليكونوا قادرين على *العمل الإصلاحي في واقع الأمة*، وسدّ ثغورها بمشاريع راشدة وفاعلة مما يمثل جسراً بين البناء والعطاء', max: 400, hint: 'ما بين *نجمتين* يُبرَز' },
    { k: 'q2', label: 'كبسولة المحتويات', def: 'محتويات البرنامــج', max: 30 },
    { k: 'items', label: 'المحتويات: العنوان | النص', kind: 'area', def: 'المواد المعرفية والمفاهيمية | جملة من المواد المخصصة التي تعمق فهم المصلح للمنهج الإصلاحي، وتكوّن عنده الوعي بواقعه، وتبني المعرفة بخارطة ثغور أمته وسبل علاج مشكلاتها\nالدورات التطويرية | دورات مهارية من شأنها تطوير كفاءة المصلح من جهة المهارات والقدرات التي تؤهله للفاعلية في الواقع العملي\nمشاريع التخرج | يختتم البرنامج بمشروع بحثي إصلاحي يقدمه الطالب، ثم يصحح المشروع من قبل فريق إشرافي لتعميق الفائدة والنفع', max: 900, hint: 'حتى أربعة بنود، كل بند في سطر' },
    { k: 'foot', label: 'سطر الختام', def: 'مـدة البرنامج: أربعــة أشهر', max: 40, half: 1 },
    { k: 'ribbon', label: 'شريط الزاوية', def: 'العدد محدود!', max: 16, half: 1 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, sv = svOf(W, H), gold = OV.accent || C.a, tall = H > W * 1.5;
    const base = omBase(ctx, W, H, T, v, { tornSize: 0.17, corners: ['tl', 'br'] });
    const dark = isDark(base), fg = dark ? '#ffffff' : C.p, ink = dark ? 'rgba(255,255,255,0.88)' : C.ink;
    const mx = 84 * u, cw = W - mx * 2, xr = W - mx;
    let y = (tall ? 120 : 56) * u;
    G(ctx, 'logo');
    if (has(d.eyebrow) && !HIDE.logo) { line(ctx, d.eyebrow, xr - 20 * u, y + 18 * sv, { size: 30 * sv, color: gold, align: 'right', bold: 0.7 }); y += 44 * sv; }
    const lg = drawLogo(ctx, T, xr, y, 380 * u, dark ? '#ffffff' : 'color', 'tr'); y += (lg.h || 150 * u) + 36 * sv;
    G(ctx, 'q'); if (has(d.q)) { pill(ctx, d.q, xr, y + 24 * sv, 30 * sv, gold, '#ffffff', { bold: 0.8 }); y += 78 * sv; }
    const inf = fit(ctx, d.intro, { maxW: cw - 50 * u, size: 34 * sv, lh: 1.55, maxH: H * 0.22, bold: 0.35 });
    G(ctx, 'intro'); if (!inf.empty) { if (D()) omDiamond(ctx, xr - 10 * u, y + inf.pt + inf.size * inf.lh / 2, 12 * u, gold); drawFit(ctx, inf, xr - 44 * u, y, { align: 'right', color: ink, hl: dark ? gold : C.p }); y += inf.h + 36 * sv; }
    G(ctx, 'q2'); if (has(d.q2)) { omPillC(ctx, d.q2, W / 2, y + 24 * sv, 30 * sv, gold, '#ffffff', { bold: 0.8 }); y += 82 * sv; }
    const items = lines(d.items).slice(0, 4).map(function (r) { const p = r.split('|'); return [p[0].trim(), (p[1] || '').trim()]; });
    const footH = (has(d.foot) || has(d.ribbon)) ? 150 * sv : 80 * sv;
    const avail = H - footH - y, cols = items.length > 1 ? 2 : 1, gap = 28 * u, colW = (cw - gap * (cols - 1)) / cols;
    const rowsN = Math.ceil(items.length / cols), rowH = (avail - 20 * sv * (rowsN - 1)) / Math.max(1, rowsN);
    const icons = ['book', 'star', 'clock', 'layers'];
    G(ctx, 'items');
    items.forEach(function (it, i) {
      const col = i % cols, row = Math.floor(i / cols);
      const x1 = xr - col * (colW + gap), x0 = x1 - colW, y0 = y + row * (rowH + 20 * sv);
      // العنوان المرقّم مع أيقونة في مربع كحلي
      const bs = 44 * sv;
      fillRR(ctx, x1 - bs, y0, bs, bs, 8 * u, dark ? gold : C.p);
      icon(ctx, icons[i % 4], x1 - bs / 2, y0 + bs / 2, bs * 0.6, dark ? C.teal : '#ffffff');
      line(ctx, omArNum(i + 1), x1 - bs - 22 * u, y0 + bs / 2, { size: 30 * sv, color: gold, align: 'right', bold: 1, title: true });
      const hf = fit(ctx, it[0], { maxW: colW - bs - 70 * u, size: 32 * sv, maxLines: 2, lh: 1.2, bold: 0.9, title: true });
      drawFit(ctx, hf, x1 - bs - 58 * u, y0 + bs / 2 - hf.h / 2, { align: 'right', color: fg });
      const by0 = y0 + bs + 18 * sv, bh = rowH - bs - 18 * sv;
      if (bh > 40 * sv) {
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.16)'; ctx.shadowBlur = 24 * u; ctx.shadowOffsetY = 8 * u;
        fillRR(ctx, x0, by0, colW, bh, 6 * u, dark ? 'rgba(255,255,255,0.1)' : C.p); ctx.restore();
        if (dark) { rrect(ctx, x0, by0, colW, bh, 6 * u); ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5 * u; ctx.stroke(); }
        const bf = fit(ctx, it[1], { maxW: colW - 60 * u, maxH: bh - 60 * sv, size: 29 * sv, lh: 1.5, bold: 0.3 });
        drawFit(ctx, bf, x1 - 30 * u, by0 + 26 * sv, { align: 'right', color: '#ffffff' });
        if (D()) { omDiamond(ctx, x0 + 30 * u, by0 + bh - 24 * sv, 8 * u, gold); omDiamond(ctx, x0 + 46 * u, by0 + bh - 24 * sv, 8 * u, gold); }
      }
    });
    G(ctx, 'footer');
    const fy = H - footH / 2 - 10 * sv;
    if (has(d.foot)) { const w = infoW(ctx, 'cal', d.foot, { size: 30 * sv }); infoItem(ctx, 'cal', d.foot, W / 2 + w / 2, fy, { size: 30 * sv, color: fg, iconColor: gold, bold: 0.6, hl: gold }); }
    if (has(d.ribbon)) { const rw = textW(ctx, d.ribbon, 30 * sv, 0.9, true) + 70 * u, ry = H - 150 * sv * 0.72; ctx.fillStyle = dark ? gold : C.p; ctx.fillRect(W - rw, ry, rw, 62 * sv); ctx.fillStyle = gold; ctx.fillRect(W - rw - 10 * u, ry, 10 * u, 62 * sv); line(ctx, d.ribbon, W - 34 * u, ry + 31 * sv, { size: 30 * sv, color: dark ? C.teal : '#ffffff', align: 'right', bold: 0.9, title: true }); }
  }
},

/* ---------- خ4. شهادة اجتياز ---------- */
{
  id: 'om_cert', type: 'thanks', name: 'شهادة اجتياز', tags: 'خارطة الثغور شهادة اجتياز تخرج طالب معدل درجة مشرف توقيع', isNew: 1, set: 'omr',
  sizes: ['card', 'post', 'square'],
  variants: [{ id: 'slate', name: 'رمادي مزرقّ', sw: ['#5b6a86', '#ffffff', '#d4b57a'] }, { id: 'night', name: 'ليل كحلي', sw: ['#16234a', '#ffffff', '#bc914c'] }, { id: 'paper', name: 'ورق الخريطة', sw: ['#f3efe6', '#273e72', '#bc914c'] }],
  colorLabels: { bg: 'لون الأرضية', title: 'لون الاسم', accent: 'اللون الذهبي' },
  fields: [
    { k: 'tag', label: 'عنوان الشهادة', def: 'شهـادة اجتيـاز وتخرج', max: 30 },
    { k: 'intro', label: 'السطر التمهيدي', def: 'تشهد إدارة برنامج خارطة الثغور بأن الطالب', max: 60 },
    { k: 'name', label: 'اسم الطالب', def: 'محمد مهند محمد', max: 40 },
    { k: 'body', label: 'نص الشهادة', kind: 'area', def: 'قد أنجز متطلبات البرنامج من مواد وتكاليف عملية، وأتم مشروع التخرج، وتحصل في مجموع ذلك على *100* درجة، وتخرج بمعدل *جيد جداً*\nوإننا في ختام البرنامج نوصي أخانا بتقوى الله والعمل الصالح، ونذكره أن أمة محمد ﷺ في أن تعمل لها وتسير على درب الأنبياء في الإصلاح، وأن تحول المشروع الذي كتبته إلى واقع عملي وأن يكون العمل للدين هو دأبها ومسعاها حتى نلتقي على الحوض وفي جنات النعيم.', max: 700, hint: 'ما بين *نجمتين* يُبرَز بالذهبي' },
    { k: 'signLabel', label: 'صفة الموقّع', def: 'المشـرف العـام:', max: 24, half: 1 },
    { k: 'signer', label: 'اسم الموقّع', def: 'الشيخ أحمد يوسف السيد', max: 36, half: 1 },
    { k: 'sig', label: 'صورة التوقيع (اختياري)', kind: 'image', def: '', optional: true, fitMode: 'contain' },
    { kind: 'date', label: 'التاريخ', map: { d1: '{hd} / {hm} / {hy} هـ', d2: '{gd} / {gm} / {gy} م' } },
    { k: 'd1', label: 'التاريخ الهجري', def: '10 / رمضان / 1446 هـ', max: 30, half: 1 },
    { k: 'd2', label: 'التاريخ الميلادي', def: '10 / مارس / 2025 م', max: 30, half: 1 }
  ],
  draw: function (ctx, W, H, d, T, v, k, P) {
    const C = T.c, land = W > H, s = land ? Math.min(W / 1600, H / 1131) : W / 1100, gold = OV.accent || (v === 'slate' ? '#d4b57a' : C.a);
    let base;
    if (OV.bg || BGFX) { base = OV.bg || '#5b6a86'; paintBg(ctx, W, H, base); }
    else if (v === 'slate') { base = '#5b6a86'; const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#6d7b96'); g.addColorStop(0.5, '#56657f'); g.addColorStop(1, '#47556d'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); if (D()) lightStreaks(ctx, W, H, 0.07); }
    else base = omBase(ctx, W, H, T, v, { torn: false, sparks: false });
    const dark = isDark(base), fg = dark ? '#ffffff' : C.p, ink = dark ? 'rgba(255,255,255,0.9)' : C.ink;
    if (D() && v !== 'paper') { G(ctx, 'deco'); omWaves(ctx, W, H, gold); }
    else if (D()) { G(ctx, 'deco'); omTorn(ctx, W, H, 'tr', gold, 3, 0.2); omTorn(ctx, W, H, 'bl', gold, 9, 0.16); }
    const mx = W * (land ? 0.14 : 0.1), cw = W - mx * 2, cx = W / 2;
    const lgW = land ? 300 * s : 320 * s;
    const tf = fit(ctx, d.intro, { maxW: cw, size: 34 * s, maxLines: 1, lh: 1.3 });
    const nm = fit(ctx, d.name, { maxW: cw, size: 74 * s * k, maxLines: 1, bold: 1, title: true, lh: 1.3 });
    const body = fit(ctx, d.body, { maxW: cw, size: (land ? 31 : 30) * s, lh: 1.72, maxH: H * (land ? 0.36 : 0.4), bold: 0.3 });
    const logoH = HIDE.logo ? 0 : lgW * (IMG[logoKey(T)] ? srcH(IMG[logoKey(T)]) / srcW(IMG[logoKey(T)]) : 0.45) * 0.62;
    const pillH = has(d.tag) ? 60 * s : 0, signH = 130 * s;
    const gaps = [30, 26, 16, 30, 40].map(function (x) { return x * s; });
    const total = logoH + pillH + tf.h + nm.h + body.h + signH + gaps.reduce(function (a, b) { return a + b; }, 0);
    let y = Math.max(H * 0.05, (H - total) / 2);
    G(ctx, 'logo'); const lg = drawLogo(ctx, T, cx, y, lgW, dark ? '#ffffff' : 'color', 'tc'); y += (lg.h || logoH) + gaps[0];
    G(ctx, 'tag'); if (pillH) { const w = textW(ctx, d.tag, 30 * s, 0.9, true) + 100 * s; rrect(ctx, cx - w / 2, y, w, pillH, pillH / 2); ctx.fillStyle = dark ? 'rgba(255,255,255,0.1)' : alpha(gold, 0.16); ctx.fill(); ctx.strokeStyle = gold; ctx.lineWidth = 2 * s; ctx.stroke(); line(ctx, d.tag, cx, y + pillH / 2, { size: 30 * s, color: dark ? '#ffffff' : C.p, align: 'center', bold: 0.9, title: true }); y += pillH + gaps[1]; }
    G(ctx, 'intro'); drawFit(ctx, tf, cx, y, { align: 'center', color: ink }); y += tf.h + gaps[2];
    G(ctx, 'name'); drawFit(ctx, nm, cx, y, { align: 'center', color: OV.title || gold }); y += nm.h + gaps[3];
    G(ctx, 'body'); drawFit(ctx, body, cx, y, { align: 'center', color: ink, hl: gold }); y += body.h + gaps[4];
    // التوقيع: الصفة والاسم يميناً، التوقيع وسطاً، التاريخان يساراً
    G(ctx, 'sign');
    const xr = W - mx, xl = mx, sy = y + 20 * s;
    line(ctx, d.signLabel, xr, sy, { size: 28 * s, color: gold, align: 'right', bold: 0.6, maxW: cw * 0.34 });
    line(ctx, d.signer, xr, sy + 46 * s, { size: 30 * s, color: fg, align: 'right', bold: 0.9, title: true, maxW: cw * 0.34 });
    if (P.sig && P.sig.im) { const sw = cw * 0.22, sh = 110 * s; ctx.save(); if (dark) { ctx.filter = 'invert(1) brightness(1.4)'; } drawPhoto(ctx, P.sig.im, cx - sw / 2, sy - 30 * s, sw, sh, { fit: 'contain', z: P.sig.z, ox: P.sig.ox, oy: P.sig.oy }); ctx.restore(); }
    else if (D()) { ctx.save(); ctx.strokeStyle = alpha(fg, 0.6); ctx.lineWidth = 3 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - 70 * s, sy + 40 * s); ctx.bezierCurveTo(cx - 20 * s, sy - 30 * s, cx + 10 * s, sy + 70 * s, cx + 40 * s, sy + 5 * s); ctx.bezierCurveTo(cx + 55 * s, sy - 25 * s, cx + 70 * s, sy + 30 * s, cx + 90 * s, sy + 10 * s); ctx.stroke(); ctx.restore(); }
    G(ctx, 'date');
    line(ctx, d.d1, xl + cw * 0.3, sy, { size: 28 * s, color: ink, align: 'right', maxW: cw * 0.3 });
    line(ctx, d.d2, xl + cw * 0.3, sy + 46 * s, { size: 28 * s, color: ink, align: 'right', maxW: cw * 0.3 });
  }
},

/* ---------- خ5. تنبيه وعدّ ---------- */
{
  id: 'om_notice', type: 'quote', name: 'تنبيه وعدّ', tags: 'خارطة الثغور تنبيه إعلان نتائج قبول أيام استعدوا ساعة عدّ تنازلي', isNew: 1, set: 'omr',
  sizes: ['square', 'post', 'story'],
  variants: [{ id: 'clock', name: 'ساعة الليل', sw: ['#1b2142', '#ffffff', '#bc914c'] }, { id: 'night', name: 'ليل كحلي', sw: ['#16234a', '#ffffff', '#bc914c'] }, { id: 'paper', name: 'ورق الخريطة', sw: ['#f3efe6', '#273e72', '#bc914c'] }],
  colorLabels: { bg: 'لون الأرضية', title: 'لون النص', accent: 'اللون الذهبي' },
  fields: [
    { k: 'text', label: 'النص', kind: 'area', def: 'الأخوة المسجلون في *خارطة الثغور*\nستصلكم نتائج القبول بعد *سبعة* أيام إن شاء الله للمقبولين', max: 180, hint: 'ما بين *نجمتين* يُبرَز بالذهبي' },
    { k: 'cta', label: 'الكبسولة الختامية', def: 'استعــدوا', max: 20 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, sv = svOf(W, H), gold = OV.accent || C.a;
    const base = v === 'clock' ? omBase(ctx, W, H, T, 'night', { night: lighten(C.teal, -0.1), sparks: false, ghost: false }) : omBase(ctx, W, H, T, v, { tornSize: 0.24 });
    const dark = isDark(base), fg = dark ? '#ffffff' : C.p;
    if (v === 'clock' && D()) { G(ctx, 'deco'); omClockGhost(ctx, W, H, 'rgba(255,255,255,0.13)'); const g = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.35)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    const mx = 100 * u, cw = W - mx * 2;
    const tf = fit(ctx, d.text, { maxW: cw, maxH: H * 0.42, size: 64 * sv * k, lh: 1.5, balance: true, bold: 0.6 });
    const lgW = 300 * u, lgH = HIDE.logo ? 0 : lgW * (IMG[logoKey(T)] ? srcH(IMG[logoKey(T)]) / srcW(IMG[logoKey(T)]) : 0.45) * 0.62;
    const ctaH = has(d.cta) ? 70 * sv : 0;
    const total = lgH + 60 * sv + tf.h + (ctaH ? 70 * sv + ctaH : 0);
    let y = (H - total) / 2;
    G(ctx, 'logo'); const lg = drawLogo(ctx, T, W / 2, y, lgW, dark ? '#ffffff' : 'color', 'tc'); y += (lg.h || lgH) + 60 * sv;
    G(ctx, 'text'); drawFit(ctx, tf, W / 2, y, { align: 'center', color: OV.title || fg, hl: gold }); y += tf.h + 70 * sv;
    G(ctx, 'cta'); if (ctaH) { const w = textW(ctx, d.cta, 32 * sv, 0.8) + 110 * u; rrect(ctx, W / 2 - w / 2, y, w, ctaH, ctaH / 2); ctx.fillStyle = dark ? 'rgba(255,255,255,0.06)' : alpha(gold, 0.14); ctx.fill(); ctx.strokeStyle = gold; ctx.lineWidth = 2.5 * u; ctx.stroke(); line(ctx, d.cta, W / 2, y + ctaH / 2, { size: 32 * sv, color: dark ? '#ffffff' : C.p, align: 'center', bold: 0.8 }); }
    G(ctx, 'footer'); social(ctx, dark ? 'rgba(255,255,255,0.5)' : alpha(C.ink, 0.45), mx, H - 66 * u, 110 * u, 'tl');
  }
},

/* ---------- خ6. حفل وفقرات ---------- */
{
  id: 'om_event', type: 'ann', name: 'حفل وفقرات', tags: 'خارطة الثغور حفل تخريج ختام فقرات برنامج يوم ساعة موقع', isNew: 1, set: 'omr',
  sizes: ['post', 'story', 'square'],
  variants: [{ id: 'blue', name: 'أزرق متدرّج', sw: ['#2a5d9e', '#ffffff', '#e0c27d'] }, { id: 'night', name: 'ليل كحلي', sw: ['#16234a', '#ffffff', '#bc914c'] }, { id: 'paper', name: 'ورق الخريطة', sw: ['#f3efe6', '#273e72', '#bc914c'] }],
  colorLabels: { bg: 'لون الأرضية', title: 'لون العنوان', accent: 'اللون الذهبي' },
  fields: [
    { k: 'title', label: 'العنوان', def: 'حفـــل تخريـــج', max: 30 },
    { k: 'sub', label: 'تحت العنوان', def: 'خارطة الثغور الدفعة الثالثة', max: 50 },
    { k: 'l1', label: 'اليوم', def: 'يوم الجمعة', max: 26 },
    { k: 'l2', label: 'الساعة', def: 'الساعة السابعة', max: 26 },
    { k: 'l3', label: 'المكان', def: 'الموقع أونلاين', max: 26 },
    { k: 'head', label: 'كبسولة الفقرات', def: 'من فقرات الحفـل:', max: 24 },
    { k: 'items', label: 'الفقرات: كل فقرة في سطر', kind: 'area', def: 'كلمة للشيخ أحمد السيد حفظه الله\nأفضل المشاريع\nشهادات التخرج\nكلمة الإشراف', max: 400, hint: 'حتى ست فقرات' },
    { kind: 'date', label: 'التاريخ', map: { date: '{hd}/{hm}/{hy}هـ - {gd}/{gm}/{gy}م' } },
    { k: 'date', label: 'سطر التاريخ', def: '1447/12/5هـ - 2026/5/22م', max: 40 }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, sv = svOf(W, H), gold = OV.accent || (v === 'blue' ? '#e0c27d' : C.a), tall = H > W * 1.5;
    let base;
    if (v === 'blue' && !OV.bg && !BGFX) {
      base = '#2a5d9e'; const g = ctx.createLinearGradient(0, 0, W * 0.3, H); g.addColorStop(0, '#3a76bd'); g.addColorStop(0.5, '#2a5d9e'); g.addColorStop(1, '#17386a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1.2 * u; for (let x = 54 * u; x < W; x += 108 * u) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let yy = 54 * u; yy < H; yy += 108 * u) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); } ctx.restore();
      if (D()) { const r = omRnd(21); for (let i = 0; i < 9; i++) { const x = r() * W, y0 = r() * H, s2 = (8 + r() * 30) * u; ctx.save(); ctx.globalAlpha = 0.5 + r() * 0.5; ctx.shadowColor = alpha(gold, 0.8); ctx.shadowBlur = s2; sparkle(ctx, x, y0, s2, gold); ctx.restore(); } }
    } else base = omBase(ctx, W, H, T, v, { tornSize: 0.17 });
    const dark = isDark(base), fg = dark ? '#ffffff' : C.p;
    const mx = 90 * u, cw = W - mx * 2, xr = W - mx;
    let y = (tall ? 150 : 70) * u;
    const tf = fit(ctx, d.title, { maxW: cw, size: 112 * sv * k, maxLines: 1, bold: 1, title: true, lh: 1.2 });
    G(ctx, 'title'); drawFit(ctx, tf, W / 2, y, { align: 'center', color: OV.title || fg }); y += tf.h + 6 * sv;
    G(ctx, 'sub'); if (has(d.sub)) { const f = line(ctx, d.sub, W / 2 + 20 * u, y + 20 * sv, { size: 30 * sv, color: dark ? alpha('#ffffff', 0.85) : alpha(C.ink, 0.75), align: 'center', maxW: cw * 0.7 }); if (D()) { hline(ctx, W / 2 + 20 * u - f.w / 2 - 20 * u, W / 2 - tf.w / 2, y + 20 * sv, alpha(gold, 0.8), 2 * u); sparkle(ctx, W / 2 - tf.w / 2 - 14 * u, y + 20 * sv, 13 * u, gold); } y += 60 * sv; }
    G(ctx, 'logo'); const lg = drawLogo(ctx, T, W / 2, y + 10 * sv, 280 * u, dark ? '#ffffff' : 'color', 'tc'); y += (lg.h || 120 * u) + 50 * sv;
    // ثلاثة أسطر بقائد منقّط ومعيّن
    G(ctx, 'info');
    const ls = [d.l1, d.l2, d.l3].filter(has);
    ls.forEach(function (t, i) {
      const ly = y + i * 74 * sv + 20 * sv;
      const f = line(ctx, t, xr - 30 * u, ly, { size: 44 * sv, color: fg, align: 'right', bold: 0.9, title: true, maxW: cw * 0.6 });
      if (D()) { omLeader(ctx, mx + 50 * u, xr - 30 * u - f.w - 30 * u, ly, alpha(gold, 0.8), u); omDiamond(ctx, mx + 30 * u, ly, 12 * u, gold); }
    });
    y += ls.length * 74 * sv + 30 * sv;
    // بطاقة الفقرات الزجاجية بأرقام ذهبية
    const items = lines(d.items).slice(0, 6);
    const footH = has(d.date) ? 120 * sv : 70 * sv;
    const ch = Math.min(H - footH - y - 10 * sv, 120 * sv + items.length * 86 * sv);
    G(ctx, 'items');
    if (items.length && ch > 120 * sv) {
      omGlass(ctx, mx, y, cw, ch, 36 * u, dark); area(mx, y, xr, y + ch);
      if (has(d.head)) pill(ctx, d.head, xr - 24 * u, y + 2 * sv, 30 * sv, gold, dark ? C.teal : '#ffffff', { bold: 0.9 });
      const rh = Math.min(86 * sv, (ch - 100 * sv) / items.length);
      items.forEach(function (t, i) {
        const iy = y + 90 * sv + i * rh + rh / 2;
        line(ctx, omArNum(i + 1), xr - 50 * u, iy, { size: 48 * sv, color: gold, align: 'center', bold: 1, title: true });
        line(ctx, t, xr - 100 * u, iy, { size: Math.min(36 * sv, rh * 0.46), color: dark ? '#ffffff' : C.ink, align: 'right', bold: 0.7, maxW: cw - 150 * u });
      });
    }
    G(ctx, 'footer');
    if (has(d.date)) line(ctx, d.date, W / 2, H - footH / 2, { size: 28 * sv, color: dark ? alpha('#ffffff', 0.8) : alpha(C.ink, 0.7), align: 'center', maxW: cw });
    social(ctx, dark ? 'rgba(255,255,255,0.5)' : alpha(C.ink, 0.45), mx, H - 60 * u, 110 * u, 'tl');
  }
},

/* ---------- خ7. شارة المجموعة ---------- */
{
  id: 'om_badge', type: 'cover', name: 'شارة المجموعة', tags: 'خارطة الثغور شارة صورة مجموعة قناة بوت التواصل التفاعلية الإشراف غلاف تليجرام', isNew: 1, set: 'omr',
  sizes: ['square', 'banner', 'story'],
  variants: [{ id: 'paper', name: 'ورق فاتح', sw: ['#f3efe6', '#273e72', '#bc914c'] }, { id: 'gold', name: 'ذهبي', sw: ['#bc914c', '#ffffff', '#ffffff'] }, { id: 'night', name: 'كحلي', sw: ['#273e72', '#ffffff', '#bc914c'] }],
  colorLabels: { bg: 'لون الأرضية', title: 'لون الكبسولة', accent: 'اللون الذهبي' },
  fields: [
    { k: 'label', label: 'الكبسولة تحت الشعار', def: 'بوت التواصل', max: 24 },
    { k: 'deco', label: 'الزخرفة', kind: 'choice', def: 'arrow', options: [['arrow', 'سهم ولمعة'], ['stars', 'نجوم'], ['none', 'بلا']] }
  ],
  draw: function (ctx, W, H, d, T, v, k) {
    const C = T.c, u = W / 1080, wide = W > H * 1.6, gold = OV.accent || C.a;
    let base;
    if (OV.bg || BGFX) { base = OV.bg || C.paper; paintBg(ctx, W, H, base); }
    else if (v === 'gold') { base = C.a; const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, lighten(C.a, 0.08)); g.addColorStop(1, lighten(C.a, -0.14)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    else if (v === 'night') { base = C.p; omNight(ctx, W, H, C.p, T, gold, { sparks: d.deco === 'stars' }); }
    else { base = C.paper; const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#f6f3ec'); g.addColorStop(1, '#e6e0d3'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); if (D()) { omMapLines(ctx, W, H, C.p, 0.7); lightStreaks(ctx, W, H, 0.35); } }
    const dark = isDark(base), mode = v === 'gold' ? '#ffffff' : (dark ? '#ffffff' : 'color');
    const lgW = wide ? Math.min(W * 0.26, H * 1.1) : W * 0.62;
    const lab = has(d.label), ps = wide ? H * 0.17 : 46 * u, pillH = ps * 1.75;
    const lgH = lgW * (IMG[logoKey(T)] ? srcH(IMG[logoKey(T)]) / srcW(IMG[logoKey(T)]) : 0.45) * 0.62;
    if (wide) {
      const cx = W * 0.62, cy = H / 2;
      G(ctx, 'logo'); drawLogo(ctx, T, cx + lgW / 2, cy - lgH / 2, lgW, mode, 'tr');
      G(ctx, 'label'); if (lab) { const px = W * 0.3; const w = textW(ctx, d.label, ps, 0.9, true) + ps * 1.8; fillRR(ctx, px - w / 2, cy - pillH / 2, w, pillH, pillH / 2, OV.title || (v === 'gold' ? '#ffffff' : (dark ? 'rgba(255,255,255,0.14)' : C.p))); line(ctx, d.label, px, cy, { size: ps, color: v === 'gold' ? C.a : (dark ? '#ffffff' : gold), align: 'center', bold: 0.9, title: true }); if (D() && d.deco === 'arrow') { omLeader(ctx, px + w / 2 + 20 * u, cx - lgW / 2 - 30 * u, cy, alpha(dark || v === 'gold' ? '#ffffff' : C.p, 0.5), u); } }
    } else {
      const total = lgH + (lab ? 70 * u + pillH : 0);
      let y = (H - total) / 2;
      G(ctx, 'logo'); const lg = drawLogo(ctx, T, W / 2, y, lgW, mode, 'tc'); y += (lg.h || lgH) + 70 * u;
      G(ctx, 'label');
      if (lab) {
        const w = textW(ctx, d.label, ps, 0.9, true) + ps * 1.8, fill = OV.title || (v === 'gold' ? '#ffffff' : (dark ? 'rgba(255,255,255,0.14)' : C.p));
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 24 * u; ctx.shadowOffsetY = 8 * u; fillRR(ctx, W / 2 - w / 2, y, w, pillH, 22 * u, fill); ctx.restore();
        if (dark && v !== 'gold') { rrect(ctx, W / 2 - w / 2, y, w, pillH, 22 * u); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2 * u; ctx.stroke(); }
        line(ctx, d.label, W / 2, y + pillH / 2, { size: ps, color: v === 'gold' ? C.a : (dark ? '#ffffff' : gold), align: 'center', bold: 0.9, title: true });
        if (D() && d.deco === 'arrow') {
          const ac = alpha(dark || v === 'gold' ? '#ffffff' : C.p, 0.55);
          ctx.save(); ctx.strokeStyle = ac; ctx.lineWidth = 3 * u; ctx.setLineDash([4 * u, 10 * u]); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(W / 2 + w / 2 + 60 * u, y - 40 * u); ctx.quadraticCurveTo(W / 2 + w / 2 + 60 * u, y + pillH / 2, W / 2 + w / 2 + 22 * u, y + pillH / 2); ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(W / 2 + w / 2 + 40 * u, y + pillH / 2 - 14 * u); ctx.lineTo(W / 2 + w / 2 + 22 * u, y + pillH / 2); ctx.lineTo(W / 2 + w / 2 + 40 * u, y + pillH / 2 + 14 * u); ctx.stroke();
          ctx.lineWidth = 3 * u; const lx = W / 2 - w / 2 - 30 * u, lyy = y + pillH + 10 * u; [[-0.9, 1.4], [-0.4, 1.9], [0.2, 2.1]].forEach(function (a) { ctx.beginPath(); ctx.moveTo(lx + Math.cos(a[0] + 2.4) * 14 * u, lyy + Math.sin(a[0] + 2.4) * 14 * u); ctx.lineTo(lx + Math.cos(a[0] + 2.4) * 44 * u, lyy + Math.sin(a[0] + 2.4) * 44 * u); ctx.stroke(); void a; }); ctx.restore();
        }
        if (D() && d.deco === 'stars') { sparkle(ctx, W / 2 + w / 2 + 70 * u, y - 20 * u, 26 * u, gold); sparkle(ctx, W / 2 - w / 2 - 60 * u, y + pillH + 20 * u, 18 * u, gold); }
      }
    }
  }
},

/* ---------- خ8. غلاف يوتيوب ---------- */
{
  id: 'om_yt', type: 'yt', name: 'غلاف خارطة', tags: 'خارطة الثغور يوتيوب غلاف مصغّرة محاضرة لقاء مقدم بث مباشر', isNew: 1, set: 'omr',
  sizes: ['yt', 'banner'],
  variants: [{ id: 'paper', name: 'ورق الخريطة', sw: ['#f3efe6', '#273e72', '#bc914c'] }, { id: 'night', name: 'ليل كحلي', sw: ['#16234a', '#ffffff', '#bc914c'] }],
  colorLabels: { bg: 'لون الأرضية', title: 'لون العنوان', accent: 'اللون الذهبي' },
  fields: [
    { k: 'photo', label: 'صورة المقدّم', kind: 'image', def: '', optional: true },
    { k: 'tag', label: 'الكبسولة الصغيرة', def: 'بث مباشر', max: 20 },
    { k: 'title', label: 'العنوان', kind: 'area', def: 'سؤالات في الواقع\nوالإصلاح', max: 40 },
    { k: 'who', label: 'المقدّم', def: 'الشيخ أحمد السيد', max: 30 },
    { k: 'num', label: 'رقم الحلقة (اختياري)', def: '', max: 4 }
  ],
  draw: function (ctx, W, H, d, T, v, k, P) {
    const C = T.c, u = W / 1280, gold = OV.accent || C.a, thin = H < W * 0.4;
    const base = omBase(ctx, W, H, T, v, { tornSize: 0.16, corners: thin ? ['bl'] : ['tl', 'br'] });
    const dark = isDark(base), fg = dark ? '#ffffff' : C.p;
    const mx = 60 * u, xr = W - mx;
    const hasP = P.photo && P.photo.im;
    const pw = hasP ? (thin ? H * 0.72 : Math.min(W * 0.36, H * 0.8)) : 0, ph = thin ? pw : Math.min(H - 2 * mx, pw * 1.1);
    G(ctx, 'photo'); if (hasP) omPhotoFrame(ctx, P.photo, mx + 20 * u, (H - ph) / 2, pw, ph, gold, u);
    if (thin) {
      // الغلاف العريض: الشعار يميناً في الوسط رأسياً، ثم فاصل ذهبي، ثم العنوان والمقدّم
      G(ctx, 'logo'); const lgw = Math.min(W * 0.2, H * 0.9); const lg2 = drawLogo(ctx, T, xr, H / 2 - lgw * 0.24, lgw, dark ? '#ffffff' : 'color', 'tr');
      const sepX = xr - (lg2.w || lgw) - 50 * u; if (D()) { vline(ctx, sepX, H * 0.22, H * 0.78, alpha(gold, 0.8), 2.5 * u); omDiamond(ctx, sepX, H * 0.22, 9 * u, gold); omDiamond(ctx, sepX, H * 0.78, 9 * u, gold); }
      const tx = sepX - 50 * u, tx0 = hasP ? mx + pw + 70 * u : mx + 40 * u, tw = tx - tx0;
      const tf0 = fit(ctx, d.title, { maxW: tw, maxH: H * 0.5, size: 66 * u * k, lh: 1.2, balance: true, bold: 1, title: true });
      const whoH0 = has(d.who) ? 58 * u : 0, tagH0 = has(d.tag) ? 56 * u : 0, tot0 = tagH0 + tf0.h + whoH0;
      let yy = (H - tot0) / 2;
      G(ctx, 'tag'); if (tagH0) { const p = pill(ctx, d.tag, tx, yy + 18 * u, 22 * u, gold, '#ffffff', { bold: 0.8 }); if (D()) { ctx.beginPath(); ctx.arc(tx - p.w - 22 * u, yy + 18 * u, 7 * u, 0, Math.PI * 2); ctx.fillStyle = '#e0493b'; ctx.fill(); } yy += tagH0; }
      G(ctx, 'title'); drawFit(ctx, tf0, tx, yy, { align: 'right', color: OV.title || fg }); yy += tf0.h + 8 * u;
      G(ctx, 'who'); if (whoH0) { const w = Math.min(tw, textW(ctx, d.who, 28 * u, 0.9, true) + 50 * u); fillRR(ctx, tx - w, yy, w, 50 * u, 12 * u, dark ? 'rgba(255,255,255,0.14)' : alpha(gold, 0.22)); line(ctx, d.who, tx - 25 * u, yy + 25 * u, { size: 28 * u, color: fg, align: 'right', bold: 0.9, title: true, maxW: w - 40 * u }); }
      return;
    }
    const x0 = hasP ? mx + pw + 90 * u : mx, cw = xr - x0;
    G(ctx, 'logo'); const lg = drawLogo(ctx, T, xr, mx, thin ? 200 * u : 240 * u, dark ? '#ffffff' : 'color', 'tr');
    const lh = lg.h || 90 * u;
    let y = mx + lh + (thin ? 12 : 26) * u;
    G(ctx, 'tag'); if (has(d.tag)) { const p = pill(ctx, d.tag, xr, y + 18 * u, 24 * u, gold, '#ffffff', { bold: 0.8 }); if (D()) { ctx.beginPath(); ctx.arc(xr - p.w - 26 * u, y + 18 * u, 8 * u, 0, Math.PI * 2); ctx.fillStyle = '#e0493b'; ctx.fill(); } y += 70 * u; }
    const whoH = has(d.who) ? 60 * u : 0;
    const tf = fit(ctx, d.title, { maxW: cw, maxH: H - y - whoH - mx - 10 * u, size: (thin ? 66 : 84) * u * k, lh: 1.2, balance: true, bold: 1, title: true });
    G(ctx, 'title'); drawFit(ctx, tf, xr, y, { align: 'right', color: OV.title || fg }); y += tf.h + 12 * u;
    G(ctx, 'who'); if (whoH) { const w = textW(ctx, d.who, 30 * u, 0.9, true) + 50 * u; fillRR(ctx, xr - w, y, w, 54 * u, 12 * u, dark ? 'rgba(255,255,255,0.14)' : alpha(gold, 0.22)); line(ctx, d.who, xr - 25 * u, y + 27 * u, { size: 30 * u, color: fg, align: 'right', bold: 0.9, title: true, maxW: cw }); }
    G(ctx, 'num'); if (has(d.num)) { const nx = hasP ? mx + pw + 50 * u : mx + 60 * u; ctx.beginPath(); ctx.arc(nx, H - mx - 40 * u, 42 * u, 0, Math.PI * 2); ctx.fillStyle = dark ? gold : C.p; ctx.fill(); line(ctx, omArNum(d.num), nx, H - mx - 40 * u, { size: 44 * u, color: dark ? C.teal : '#ffffff', align: 'center', bold: 1, title: true }); }
  }
}

);
