/* ================= التصميم الحر: قالب يُرسم من وصف تخطيط (JSON) يكتبه المساعد أو مولّد محلي =================
   كل عنصر في التخطيط مجموعة قابلة للتحريك والتلوين كبقية القوالب. الإحداثيات نِسَب من العرض والارتفاع. */
const FREE_ROLES = ['paper', 'warm', 'p', 'pd', 'pl', 's', 'sd', 'sdd', 'a', 'a2', 'teal', 'tealL', 'ink', 'muted', 'white'];
function roleColor(T, r, fallback) { if (r === 'white') return '#ffffff'; if (r === 'black') return '#111111'; if (/^#[0-9a-f]{6}$/i.test(r || '')) return r; return (T.c && T.c[r]) || fallback || T.c.p; }
function clamp01(v, d) { v = +v; return isFinite(v) ? Math.max(0, Math.min(1, v)) : d; }
// تنظيف التخطيط الوارد من المساعد: أعداد محدودة، وأدوار ألوان معروفة، وعناصر معروفة
function cleanLayout(L) {
  L = L && typeof L === 'object' ? L : {};
  const bg = L.bg && typeof L.bg === 'object' ? L.bg : {};
  const out = { bg: { kind: ['solid', 'split', 'band', 'frame', 'diagonal'].indexOf(bg.kind) >= 0 ? bg.kind : 'solid', role: FREE_ROLES.indexOf(bg.role) >= 0 ? bg.role : 'paper', role2: FREE_ROLES.indexOf(bg.role2) >= 0 ? bg.role2 : 'pd', ratio: clamp01(bg.ratio, 0.42), pos: ['top', 'bottom', 'right', 'left'].indexOf(bg.pos) >= 0 ? bg.pos : 'bottom' }, deco: [], blocks: [] };
  (Array.isArray(L.deco) ? L.deco : []).slice(0, 10).forEach(function (q) {
    if (!q || typeof q !== 'object') return;
    out.deco.push({ shape: ['circle', 'ring', 'petal', 'star', 'dots', 'lines', 'arc', 'blob'].indexOf(q.shape) >= 0 ? q.shape : 'circle', x: clamp01(q.x, 0.5), y: clamp01(q.y, 0.5), r: Math.max(0.01, Math.min(0.9, +q.r || 0.1)), role: FREE_ROLES.indexOf(q.role) >= 0 ? q.role : 'a', alpha: Math.max(0.04, Math.min(1, +q.alpha || 1)), rot: +q.rot || 0 });
  });
  const KINDS = ['title', 'sub', 'who', 'time', 'place', 'note', 'photo', 'logo', 'academy', 'social', 'badge', 'rule'];
  (Array.isArray(L.blocks) ? L.blocks : []).slice(0, 14).forEach(function (b) {
    if (!b || typeof b !== 'object' || KINDS.indexOf(b.k) < 0) return;
    out.blocks.push({ k: b.k, x: clamp01(b.x, 0.08), y: clamp01(b.y, 0.1), w: Math.max(0.05, Math.min(1, +b.w || 0.84)), h: Math.max(0.02, Math.min(1, +b.h || 0.2)), align: ['right', 'center', 'left'].indexOf(b.align) >= 0 ? b.align : 'right',
      size: Math.max(0.018, Math.min(0.2, +b.size || 0.05)), role: b.role === 'auto' || !b.role ? 'auto' : (FREE_ROLES.indexOf(b.role) >= 0 ? b.role : 'auto'), bold: Math.max(0, Math.min(1, +b.bold || 0)), icon: typeof b.icon === 'string' ? b.icon.replace(/[^a-z]/g, '').slice(0, 10) : '', text: typeof b.text === 'string' ? b.text.slice(0, 40) : '', fill: FREE_ROLES.indexOf(b.fill) >= 0 ? b.fill : '', round: Math.max(0, Math.min(1, +b.round || 0)), hl: FREE_ROLES.indexOf(b.hl) >= 0 ? b.hl : 'a' });
  });
  return out;
}
function parseLayout(s) { if (s && typeof s === 'object') return cleanLayout(s); try { return cleanLayout(JSON.parse(s || '{}')); } catch (e) { return cleanLayout({}); } }
// لون الخلفية تحت نقطة معيّنة (ليُختار لون النص تلقائياً)
function bgAt(L, T, x, y) {
  const b = L.bg, c1 = roleColor(T, b.role, T.c.paper), c2 = roleColor(T, b.role2, T.c.pd);
  if (b.kind === 'solid') return c1;
  if (b.kind === 'frame') return c1;
  const inSecond = b.pos === 'bottom' ? y > 1 - b.ratio : b.pos === 'top' ? y < b.ratio : b.pos === 'right' ? x > 1 - b.ratio : x < b.ratio;
  if (b.kind === 'diagonal') return (b.pos === 'bottom' ? y > 1 - b.ratio * (1.3 - x * 0.6) : y < b.ratio * (0.7 + x * 0.6)) ? c2 : c1;
  return inSecond ? c2 : c1;
}
function drawFreeBg(ctx, W, H, L, T) {
  const b = L.bg, c1 = roleColor(T, b.role, T.c.paper), c2 = roleColor(T, b.role2, T.c.pd), u = W / 1080;
  paintBg(ctx, W, H, c1);
  if (b.kind === 'solid') return;
  ctx.fillStyle = c2;
  if (b.kind === 'frame') { ctx.lineWidth = 22 * u; ctx.strokeStyle = c2; rrect(ctx, 40 * u, 40 * u, W - 80 * u, H - 80 * u, 36 * u); ctx.stroke(); return; }
  const r = b.ratio;
  if (b.kind === 'diagonal') {
    ctx.beginPath();
    if (b.pos === 'bottom') { ctx.moveTo(0, H * (1 - r * 1.3)); ctx.lineTo(W, H * (1 - r * 0.7)); ctx.lineTo(W, H); ctx.lineTo(0, H); }
    else { ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H * r * 1.3); ctx.lineTo(0, H * r * 0.7); }
    ctx.closePath(); ctx.fill(); return;
  }
  const rad = b.kind === 'band' ? 0 : 64 * u;
  if (b.pos === 'bottom') fillRR(ctx, 0, H * (1 - r), W, H * r + rad, [rad, rad, 0, 0], c2);
  else if (b.pos === 'top') fillRR(ctx, 0, -rad, W, H * r + rad, [0, 0, rad, rad], c2);
  else if (b.pos === 'right') fillRR(ctx, W * (1 - r), 0, W * r + rad, H, [0, 0, 0, 0], c2);
  else fillRR(ctx, -rad, 0, W * r + rad, H, [0, 0, 0, 0], c2);
}
function drawFreeDeco(ctx, W, H, L, T) {
  const u = W / 1080;
  L.deco.forEach(function (q) {
    const c = alpha(roleColor(T, q.role, T.c.a), q.alpha), cx = q.x * W, cy = q.y * H, r = q.r * W;
    ctx.save(); ctx.fillStyle = c; ctx.strokeStyle = c;
    if (q.shape === 'circle') { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); area(cx - r, cy - r, cx + r, cy + r); }
    else if (q.shape === 'ring') { ctx.lineWidth = Math.max(6 * u, r * 0.12); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); area(cx - r, cy - r, cx + r, cy + r); }
    else if (q.shape === 'petal') petal(ctx, cx, cy, r, q.rot, c);
    else if (q.shape === 'star') star(ctx, cx, cy, r, c, q.rot);
    else if (q.shape === 'dots') { const st = Math.max(30 * u, r * 0.5); for (let yy = cy - r; yy <= cy + r; yy += st) for (let xx = cx - r; xx <= cx + r; xx += st) { ctx.beginPath(); ctx.arc(xx, yy, Math.max(3 * u, st * 0.12), 0, Math.PI * 2); ctx.fill(); } area(cx - r, cy - r, cx + r, cy + r); }
    else if (q.shape === 'lines') { ctx.lineWidth = 4 * u; const st = Math.max(24 * u, r * 0.25); ctx.save(); ctx.translate(cx, cy); ctx.rotate(q.rot || -0.6); for (let i = -r; i <= r; i += st) { ctx.beginPath(); ctx.moveTo(i, -r); ctx.lineTo(i, r); ctx.stroke(); } ctx.restore(); area(cx - r, cy - r, cx + r, cy + r); }
    else if (q.shape === 'arc') { ctx.lineWidth = Math.max(10 * u, r * 0.08); ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * (1 + (q.rot || 0)), Math.PI * (1.85 + (q.rot || 0))); ctx.stroke(); }
    else if (q.shape === 'blob') { ctx.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, rr = r * (0.82 + 0.18 * Math.sin(a * 3 + (q.rot || 0))); ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)); } ctx.closePath(); ctx.fill(); area(cx - r, cy - r, cx + r, cy + r); }
    ctx.restore();
  });
}
const FREE_GROUP = { title: 'title', sub: 'sub', who: 'who', time: 'info', place: 'info', note: 'footer', photo: 'photo', logo: 'logo', academy: 'footer', social: 'footer', badge: 'tag', rule: 'deco' };
const FREE_ICON = { who: 'mic', time: 'moon', place: 'pin' };
function drawFreeBlocks(ctx, W, H, L, T, d, k, P) {
  const u = W / 1080;
  let lastG = null;
  L.blocks.forEach(function (b, i) {
    const g = FREE_GROUP[b.k] || 'body';
    if (g !== lastG) { G(ctx, g); lastG = g; }
    const x = b.x * W, y = b.y * H, w = b.w * W, h = b.h * H, under = bgAt(L, T, b.x + b.w / 2, b.y + b.h / 2);
    const col = b.role === 'auto' ? onBg(under, T.c.ink) : roleColor(T, b.role, T.c.ink);
    const anchorX = b.align === 'right' ? x + w : b.align === 'center' ? x + w / 2 : x;
    if (b.k === 'photo') { if (P.photo && P.photo.im) { if (b.round) { ctx.save(); rrect(ctx, x, y, w, h, Math.min(w, h) * b.round * 0.5); ctx.clip(); drawPhoto(ctx, P.photo.im, x, y, w, h, { z: P.photo.z, ox: P.photo.ox, oy: P.photo.oy, fit: 'cover' }); ctx.restore(); } else drawPhoto(ctx, P.photo.im, x, y, w, h, { z: P.photo.z, ox: P.photo.ox, oy: P.photo.oy, fit: 'cover' }); } return; }
    if (b.k === 'logo') { drawLogo(ctx, T, anchorX, y, w, isDark(under) ? '#ffffff' : 'color', b.align === 'right' ? 'tr' : b.align === 'center' ? 'tc' : 'tl'); return; }
    if (b.k === 'academy') { academy(ctx, alpha(onBg(under, T.c.ink), 0.85), anchorX, y, w, b.align === 'right' ? 'tr' : b.align === 'center' ? 'tc' : 'tl'); return; }
    if (b.k === 'social') { social(ctx, alpha(onBg(under, T.c.ink), 0.75), anchorX, y, w, b.align === 'right' ? 'tr' : b.align === 'center' ? 'tc' : 'tl'); return; }
    if (b.k === 'rule') { if (D()) { ctx.fillStyle = roleColor(T, b.fill || b.hl, T.c.a); fillRR(ctx, x, y, w, Math.max(3 * u, h), h / 2, roleColor(T, b.fill || b.hl, T.c.a)); area(x, y, x + w, y + h); } return; }
    if (b.k === 'badge') { const t = b.text || d.badge || ''; if (!t.trim()) return; const fillC = roleColor(T, b.fill || 'a', T.c.a); pill(ctx, t, anchorX, y + h / 2, b.size * W * 0.8, fillC, onBg(fillC, T.c.ink), { bold: 0.6 }); return; }
    // نص
    const txt = d[b.k]; if (!String(txt || '').trim()) return;
    if (b.k === 'who' || b.k === 'time' || b.k === 'place') {
      const ic = b.icon || FREE_ICON[b.k];
      if (b.align === 'right') { infoItem(ctx, ic, txt, anchorX, y + h / 2, { size: b.size * W, color: col, iconColor: roleColor(T, b.hl, T.c.a), maxW: w }); return; }
      line(ctx, txt, anchorX, y + h / 2, { size: b.size * W, color: col, align: b.align, maxW: w, bold: b.bold }); return;
    }
    const isT = b.k === 'title';
    const f = fit(ctx, txt, { maxW: w, maxH: h, size: b.size * W * (isT ? k : 1), lh: isT ? 1.25 : 1.45, balance: true, bold: isT ? Math.max(0.6, b.bold) : b.bold, title: isT, maxLines: isT ? 4 : 6 });
    drawFit(ctx, f, anchorX, y, { align: b.align, color: isT && OV.title ? OV.title : col, hl: roleColor(T, b.hl, T.c.a) });
  });
}
// مولّد محلي: تخطيطات مدروسة تتبدّل ألوانها وأشكالها بالهوية، تعمل بلا مساعد
function localLayouts(seed, size) {
  const story = size === 'story', wide = size === 'yt' || size === 'banner';
  const r = function (n) { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 * n; };
  const pick = function (a) { return a[Math.floor(r(a.length))]; };
  const dark = pick(['pd', 'sd', 'teal', 'sdd']), light = pick(['paper', 'warm', 'white']);
  const L = [];
  // ١) لوحة سفلية داكنة وعنوان عليها
  L.push({ bg: { kind: pick(['split', 'band', 'diagonal']), role: light, role2: dark, ratio: story ? 0.5 : 0.46, pos: 'bottom' },
    deco: [{ shape: pick(['petal', 'star', 'ring']), x: 0.14, y: 0.14, r: 0.06, role: 'a', alpha: 1 }, { shape: 'dots', x: 0.75, y: 0.3, r: 0.18, role: 'pl', alpha: 0.35 }],
    blocks: [{ k: 'logo', x: 0.72, y: 0.05, w: 0.22, h: 0.12, align: 'right' }, { k: 'badge', x: 0.08, y: story ? 0.42 : 0.4, w: 0.5, h: 0.05, align: 'left', size: 0.03, fill: 'a' },
      { k: 'title', x: 0.07, y: story ? 0.55 : 0.58, w: 0.86, h: 0.2, align: 'right', size: 0.1, bold: 0.8 }, { k: 'sub', x: 0.07, y: story ? 0.76 : 0.79, w: 0.86, h: 0.06, align: 'right', size: 0.036 },
      { k: 'who', x: 0.07, y: 0.85, w: 0.6, h: 0.04, align: 'right', size: 0.032 }, { k: 'time', x: 0.07, y: 0.9, w: 0.42, h: 0.04, align: 'right', size: 0.03 }, { k: 'place', x: 0.5, y: 0.9, w: 0.42, h: 0.04, align: 'right', size: 0.03 }, { k: 'social', x: 0.07, y: 0.945, w: 0.12, h: 0.03, align: 'left' }] });
  // ٢) خلفية داكنة كاملة وعنوان كبير في الوسط
  L.push({ bg: { kind: 'solid', role: dark }, deco: [{ shape: 'ring', x: 0.5, y: 0.42, r: 0.36, role: 'a', alpha: 0.5 }, { shape: 'circle', x: 0.86, y: 0.1, r: 0.14, role: 'pl', alpha: 0.2 }, { shape: 'star', x: 0.18, y: 0.76, r: 0.035, role: 'a', alpha: 1 }],
    blocks: [{ k: 'logo', x: 0.38, y: 0.05, w: 0.24, h: 0.12, align: 'center' }, { k: 'title', x: 0.1, y: 0.3, w: 0.8, h: 0.26, align: 'center', size: 0.11, bold: 0.9 }, { k: 'sub', x: 0.15, y: 0.58, w: 0.7, h: 0.07, align: 'center', size: 0.036 },
      { k: 'rule', x: 0.42, y: 0.67, w: 0.16, h: 0.006, fill: 'a' }, { k: 'who', x: 0.2, y: 0.72, w: 0.6, h: 0.04, align: 'center', size: 0.034 }, { k: 'time', x: 0.1, y: 0.8, w: 0.8, h: 0.04, align: 'center', size: 0.03 }, { k: 'place', x: 0.1, y: 0.85, w: 0.8, h: 0.04, align: 'center', size: 0.03 }, { k: 'academy', x: 0.4, y: 0.93, w: 0.2, h: 0.04, align: 'center' }] });
  // ٣) عمود جانبي ملوّن مع صورة
  L.push({ bg: { kind: 'split', role: light, role2: dark, ratio: wide ? 0.4 : 0.34, pos: 'left' }, deco: [{ shape: 'lines', x: 0.17, y: 0.5, r: 0.3, role: 'pl', alpha: 0.25, rot: -0.6 }, { shape: 'petal', x: 0.17, y: 0.88, r: 0.05, role: 'a', alpha: 1 }],
    blocks: [{ k: 'logo', x: 0.74, y: 0.05, w: 0.2, h: 0.12, align: 'right' }, { k: 'photo', x: 0.4, y: 0.2, w: 0.54, h: wide ? 0.42 : 0.3, align: 'right', round: 0.3 }, { k: 'title', x: 0.4, y: wide ? 0.66 : 0.53, w: 0.54, h: 0.2, align: 'right', size: 0.08, bold: 0.8 },
      { k: 'sub', x: 0.4, y: wide ? 0.86 : 0.74, w: 0.54, h: 0.06, align: 'right', size: 0.032 }, { k: 'who', x: 0.4, y: 0.82, w: 0.54, h: 0.04, align: 'right', size: 0.03 }, { k: 'time', x: 0.03, y: 0.3, w: 0.3, h: 0.04, align: 'center', size: 0.028 }, { k: 'place', x: 0.03, y: 0.36, w: 0.3, h: 0.04, align: 'center', size: 0.028 }, { k: 'social', x: 0.4, y: 0.94, w: 0.12, h: 0.03, align: 'left' }] });
  // ٤) إطار فاتح وزاوية ملوّنة
  L.push({ bg: { kind: 'frame', role: light, role2: pick(['p', 's', 'teal']) }, deco: [{ shape: 'blob', x: 0.88, y: 0.12, r: 0.2, role: 'pl', alpha: 0.35 }, { shape: 'circle', x: 0.12, y: 0.9, r: 0.09, role: 'a', alpha: 0.9 }],
    blocks: [{ k: 'logo', x: 0.1, y: 0.09, w: 0.2, h: 0.1, align: 'left' }, { k: 'badge', x: 0.5, y: 0.26, w: 0.4, h: 0.05, align: 'right', size: 0.028, fill: 'p' }, { k: 'title', x: 0.1, y: 0.34, w: 0.8, h: 0.24, align: 'right', size: 0.1, bold: 0.9, role: 'pd' },
      { k: 'sub', x: 0.1, y: 0.6, w: 0.8, h: 0.08, align: 'right', size: 0.036, role: 'ink' }, { k: 'who', x: 0.1, y: 0.72, w: 0.8, h: 0.04, align: 'right', size: 0.032, role: 'ink' }, { k: 'time', x: 0.1, y: 0.78, w: 0.4, h: 0.04, align: 'right', size: 0.03, role: 'ink' }, { k: 'place', x: 0.5, y: 0.78, w: 0.4, h: 0.04, align: 'right', size: 0.03, role: 'ink' }, { k: 'note', x: 0.25, y: 0.86, w: 0.6, h: 0.04, align: 'center', size: 0.026, role: 'muted' }] });
  return L;
}
TEMPLATES.push({
  id: 'ai_free', type: 'ann', name: 'تصميم حر', tags: 'المساعد الذكي تصميم من الهوية', hidden: true,
  sizes: ['post', 'square', 'story', 'yt', 'banner'],
  variants: [{ id: 'a', name: 'الأصل', sw: ['#f8f8f8', '#2d4d24', '#fbb03b'] }],
  colorLabels: { bg: 'لون الخلفية' },
  fields: [
    { k: 'badge', label: 'وسم صغير', def: '', max: 20 },
    { k: 'title', label: 'العنوان', kind: 'area', def: 'العنوان الرئيسي', max: 40 },
    { k: 'sub', label: 'السطر الفرعي', def: 'العنوان الفرعي', max: 70 },
    { k: 'who', label: 'المقدّم', def: 'اسم المقدّم', max: 30 },
    { k: 'time', label: 'اليوم والوقت', def: 'اليوم والوقت', max: 30, half: 1 },
    { k: 'place', label: 'المكان أو المنصة', def: 'المكان', max: 30, half: 1 },
    { k: 'note', label: 'سطر ختامي', def: '', max: 70 },
    { k: 'photo', label: 'الصورة', kind: 'image', def: '' },
    { k: 'layout', label: 'التخطيط', kind: 'hidden', def: '' }
  ],
  draw: function (ctx, W, H, d, T, v, k, P) {
    const L = parseLayout(d.layout);
    if (!L.blocks.length) { Object.assign(L, localLayouts(7, W > H * 1.3 ? 'yt' : W < H * 0.7 ? 'story' : 'post')[0]); }
    if (OV.bg) L.bg.role = OV.bg;
    G(ctx, 'deco'); quiet(function () { drawFreeBg(ctx, W, H, L, T); });
    if (D()) drawFreeDeco(ctx, W, H, L, T);
    drawFreeBlocks(ctx, W, H, L, T, d, k, P);
  }
});
