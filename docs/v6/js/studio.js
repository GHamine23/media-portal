/* ================= الاستوديو: الطبقات والمكتبة والتحريك والمساعد وصناعة الإعلان وقوالبي ================= */

/* ---------- القالب الأبيض للمصمم المساعد ---------- */
TEMPLATES.push({
  id: 'blank', type: 'custom', name: 'صفحة بيضاء', tags: 'فارغ أبيض مصمم مساعد', hidden: true,
  sizes: ['post', 'square', 'story', 'yt', 'card'],
  variants: [{ id: 'paper', name: 'ورقي', sw: ['#f8f8f8', '#2b2b2b', '#467839'] }, { id: 'green', name: 'أخضر', sw: ['#2d4d24', '#ffffff', '#fbb03b'] }, { id: 'brown', name: 'بني', sw: ['#33251c', '#ffffff', '#fbb03b'] }],
  fields: [],
  draw: function (ctx, W, H, d, T, v) {
    paintBg(ctx, W, H, OV.bg || (v === 'green' ? T.c.pd : v === 'brown' ? T.c.sdd : '#f8f8f8'));
  }
});
function baseOf(tpl, st, T) {   // لون خلفية القالب التقريبي (لفحص التباين واقتراح الألوان)
  if (st.ov && st.ov.bg) return st.ov.bg;
  const v = (tpl.variants.find(function (x) { return x.id === st.variant; }) || tpl.variants[0]);
  return (v.sw && swOf(v.sw, T)[0]) || '#f8f8f8';
}

/* ---------- أسماء المجموعات ---------- */
const GROUP_NAMES = { logo: 'الشعار', title: 'العنوان', sub: 'السطر الفرعي', info: 'المعلومات', date: 'التاريخ', footer: 'التذييل',
  deco: 'الزخارف', photo: 'الصورة', top: 'السطر الأعلى', card: 'بطاقة المقرر', chip: 'الوسم', body: 'النص', ring: 'الدائرة', name: 'الاسم',
  kicker: 'السطر الأعلى', shape: 'الشكل', panel: 'اللوحة', who: 'المقدّم', intro: 'التمهيد', band: 'الشريط', quote: 'العبارة',
  list: 'القائمة', head: 'عنوان القائمة', rows: 'الصفوف', boxes: 'الصناديق', cta: 'زر الدعوة', count: 'رقم الصفحة', tag: 'الوسم', tag2: 'الوسم البارز', foot: 'نص المنصة' };
function gName(g) {
  if (g && S.names && S.names[g]) return S.names[g];
  if (g && g.slice(0, 2) === 'L:') { const L = layerById(g.slice(2)); return L ? (LIB_LABEL[L.t] || 'عنصر') + (L.t === 'text' ? ': ' + String(L.txt || '').slice(0, 16) : '') : 'عنصر'; }
  if (GROUP_NAMES[g]) return GROUP_NAMES[g];
  // عناصر مرقّمة (بند ١، صف ٢…): الاسم الأساسي ورقم بالأرقام المشرقية
  const m = /^([a-z]+?)(\d+)$/i.exec(g || '');
  if (m && GROUP_NUM[m[1]]) return GROUP_NUM[m[1]] + ' ' + String(+m[2] + 1).replace(/\d/g, function (x) { return '٠١٢٣٤٥٦٧٨٩'[+x]; });
  return GROUP_NAMES2[g] || g;
}
const GROUP_NUM = { item: 'البند', row: 'الصف', li: 'الفقرة', it: 'الفقرة', info: 'سطر المعلومات', br: 'الفرع', card: 'البطاقة', stat: 'الرقم', step: 'المرحلة', sec: 'القسم', q: 'السؤال', p: 'الفقرة', h: 'العنوان الفرعي', qt: 'الاقتباس' };
const GROUP_NAMES2 = { links: 'الوصلات', center: 'المفهوم المركزي', table: 'الجدول', terms: 'المصطلحات', sum: 'الخلاصة', items: 'البنود', stats: 'الأرقام', steps: 'خط المراحل', seal: 'الختم', sign: 'التوقيعات', frame: 'الإطار', label: 'التسمية', q: 'كبسولة السؤال', q2: 'كبسولة المحتويات', note: 'الملاحظة', run: 'العنوان الجاري', num: 'رقم الفصل', fields: 'خانات الطالب', cards: 'البطاقات', branches: 'الفروع', meta: 'سطر المعلومات', eyebrow: 'الكلمة العلوية', ribbon: 'شريط الزاوية', stepsHead: 'عنوان المراحل', author: 'الإعداد', edition: 'الطبعة', seal2: 'الختم', time: 'الموعد', who2: 'المقدّم', cta: 'زر الدعوة', text: 'النص', tz: 'التوقيت', day: 'اليوم', links2: 'الوصلات' };
const LIB_LABEL = { ticon: 'أيقونة', qr: 'رمز QR', sticker: 'زخرفة', icon: 'أيقونة', logo: 'شعار', img: 'صورة', text: 'نص', video: 'فيديو', yt: 'يوتيوب', audio: 'صوت' };

/* ---------- الطبقات: عناصر مضافة من المكتبة ---------- */
// x, y نسبة من العرض والارتفاع (المركز). w نسبة من العرض. rot بالدرجات
const STICKERS = {
  petal:   { name: 'زهرة', draw: function (g, s, c) { petal(g, 0, 0, s * 0.5, 0.3, c); } },
  star:    { name: 'نجمة', draw: function (g, s, c) { star(g, 0, 0, s * 0.42, c, 0); } },
  stars2:  { name: 'نجمتان', draw: function (g, s, c) { star(g, -s * 0.1, s * 0.1, s * 0.32, c, -0.1); star(g, s * 0.32, -s * 0.3, s * 0.13, c, 0.1); } },
  sparkle: { name: 'لمعة', draw: function (g, s, c) { sparkle(g, 0, 0, s * 0.48, c); } },
  chev:    { name: 'سهمان', draw: function (g, s, c) { chevrons(g, -s * 0.45, 0, s * 0.5, c, 1); } },
  chevd:   { name: 'سهمان لأسفل', draw: function (g, s, c) { g.rotate(-Math.PI / 2); chevrons(g, -s * 0.45, 0, s * 0.5, c, 1); } },
  ring:    { name: 'حلقة', draw: function (g, s, c) { g.strokeStyle = c; g.lineWidth = s * 0.012 + 2; g.beginPath(); g.arc(0, 0, s * 0.48, 0, Math.PI * 2); g.stroke(); } },
  disc:    { name: 'دائرة', draw: function (g, s, c) { g.fillStyle = c; g.beginPath(); g.arc(0, 0, s * 0.48, 0, Math.PI * 2); g.fill(); } },
  rsq:     { name: 'مربع', draw: function (g, s, c) { fillRR(g, -s * 0.48, -s * 0.48, s * 0.96, s * 0.96, s * 0.14, c); } },
  pillb:   { name: 'شريط', ar: 0.28, draw: function (g, s, c) { fillRR(g, -s * 0.5, -s * 0.14, s, s * 0.28, s * 0.14, c); } },
  line:    { name: 'خط', ar: 0.04, draw: function (g, s, c) { g.fillStyle = c; g.fillRect(-s / 2, -s * 0.01, s, Math.max(2, s * 0.012)); } },
  dots:    { name: 'نقاط', draw: function (g, s, c) { g.fillStyle = c; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(-s * 0.36 + i * s * 0.24, -s * 0.36 + j * s * 0.24, s * 0.06, 0, Math.PI * 2); g.fill(); } } },
  quote:   { name: 'علامة اقتباس', draw: function (g, s, c) { g.fillStyle = c; [-1, 1].forEach(function (k) { g.beginPath(); g.arc(k * s * 0.2, -s * 0.05, s * 0.16, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(k * s * 0.2 - s * 0.16, -s * 0.02); g.quadraticCurveTo(k * s * 0.2 - s * 0.14, s * 0.3, k * s * 0.2 + s * 0.08, s * 0.4); g.lineTo(k * s * 0.2 + s * 0.12, s * 0.33); g.quadraticCurveTo(k * s * 0.2 - s * 0.02, s * 0.2, k * s * 0.2 + s * 0.02, s * 0.08); g.fill(); }); } },
  book:    { name: 'كتاب', draw: function (g, s, c) { ICONS.book(g, s, c); } },
  wave:    { name: 'قوس', ar: 0.6, draw: function (g, s, c) { g.strokeStyle = c; g.lineWidth = s * 0.16; g.beginPath(); g.moveTo(-s * 0.42, s * 0.3); g.lineTo(-s * 0.42, 0); g.arcTo(-s * 0.42, -s * 0.22, -s * 0.2, -s * 0.22, s * 0.22); g.lineTo(s * 0.2, -s * 0.22); g.arcTo(s * 0.42, -s * 0.22, s * 0.42, 0, s * 0.22); g.lineTo(s * 0.42, s * 0.3); g.stroke(); } },
  rays:    { name: 'أشعة', draw: function (g, s, c) { g.strokeStyle = c; g.lineWidth = s * 0.05; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 10; g.beginPath(); g.moveTo(-s * 0.4 + s * 0.15 * Math.cos(a), s * 0.4 + s * 0.15 * Math.sin(a)); g.lineTo(-s * 0.4 + s * 0.85 * Math.cos(a), s * 0.4 + s * 0.85 * Math.sin(a)); g.stroke(); } } },
  xmark:   { name: 'فراشة', draw: function (g, s, c) { xmark(g, 0, 0, s * 0.95, c, 0); } },
  ribbon:  { name: 'شريط ملتوٍ', draw: function (g, s, c) { ribbonS(g, 0, 0, s * 0.78, lighten(c, 0.35), c); } },
  pine:    { name: 'شجرة', ar: 1.2, draw: function (g, s, c) { pine(g, 0, s * 0.6, s * 1.15, c); } },
  moon:    { name: 'قمر', draw: function (g, s, c) { g.fillStyle = c; g.beginPath(); g.arc(0, 0, s * 0.46, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(0,0,0,0.07)'; g.beginPath(); g.arc(-s * 0.12, -s * 0.1, s * 0.1, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(s * 0.14, s * 0.12, s * 0.07, 0, Math.PI * 2); g.fill(); } },
  tent:    { name: 'خيمة', ar: 0.7, draw: function (g, s, c) { tent(g, 0, s * 0.33, s * 0.48, c, lighten(c, -0.45)); } },
  fire:    { name: 'نار', draw: function (g, s, c) { campfire(g, 0, s * 0.1, s * 0.28); } },
  cards:   { name: 'بطاقتان', ar: 1.2, draw: function (g, s, c) { pixelCards(g, s * 0.1, 0, s * 0.52, { p: lighten(c, 0.3), pd: c }); } },
  clock:   { name: 'ساعة', draw: function (g, s, c) { for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, big = i % 5 === 0; g.strokeStyle = c; g.globalAlpha *= big ? 1 : 0.6; g.lineWidth = s * (big ? 0.016 : 0.008); g.beginPath(); g.moveTo(s * (big ? 0.38 : 0.44) * Math.cos(a), s * (big ? 0.38 : 0.44) * Math.sin(a)); g.lineTo(s * 0.48 * Math.cos(a), s * 0.48 * Math.sin(a)); g.stroke(); g.globalAlpha /= big ? 1 : 0.6; } g.lineCap = 'round'; g.lineWidth = s * 0.02; g.beginPath(); g.moveTo(0, 0); g.lineTo(s * 0.3, -s * 0.02); g.moveTo(0, 0); g.lineTo(s * 0.12, s * 0.24); g.stroke(); } }
};
const ICON_LIST = ['moon', 'layers', 'mic', 'clock', 'cal', 'pin', 'link', 'star', 'book', 'ring', 'down', 'up'];
const LOGO_LIST = [['track', 'شعار الهوية'], ['academy', 'شعار الأكاديمية'], ['social', 'الحسابات']];

function allLogos() {
  const out = [];
  Object.keys(TRACKS).forEach(function (id) { const t = TRACKS[id]; (t.logos || [[t.logo, t.name]]).forEach(function (l) { if (ASSETS[l[0]] && !out.some(function (o) { return o[0] === l[0]; })) out.push([l[0], t.name + (t.logos ? ' — ' + l[1] : '')]); }); });
  return out;
}
function newId() { return Math.random().toString(36).slice(2, 9); }
function layerById(id) { return (S.layers || []).find(function (L) { return L.id === id; }); }
function layerImg(L) {
  if (L.t === 'img') { const p = photoOf({ src: L.ref, z: 1, ox: 0, oy: 0, fx: L.fx, fh: L.fh, fv: L.fv }); return p && p.im; }
  return null;
}
function drawLayer(ctx, W, H, L, T) {
  const cx = L.x * W, cy = L.y * H, w = L.w * W;
  ctx.save();
  ctx.globalAlpha = L.o == null ? 1 : L.o;
  if (L.t === 'text') {
    const f = fit(ctx, L.txt || '', { maxW: w, size: (L.sz || 0.06) * W, lh: 1.32, bold: L.b || 0, title: (L.b || 0) >= 0.7 });
    const al = L.al || 'center', x0 = al === 'right' ? cx + w / 2 : al === 'left' ? cx - w / 2 : cx;
    const y0 = cy - f.h / 2;
    if (L.rot) { ctx.translate(cx, cy); ctx.rotate(L.rot * Math.PI / 180); ctx.translate(-cx, -cy); }
    area(cx - w / 2, y0, cx + w / 2, y0 + Math.max(f.h, 20));
    drawFit(ctx, f, x0, y0, { align: al, color: L.c || T.c.ink, hl: L.hc || '' });
  } else {
    let ar = 1, src = null;
    if (L.t === 'sticker') ar = (STICKERS[L.ref] && STICKERS[L.ref].ar) || 1;
    if (L.t === 'logo') { const k = L.ref === 'track' ? logoKey(T) : L.ref; const mask = k === 'academy' || k === 'social'; src = (!mask && (!L.c || L.c === 'color')) ? IMG[k] : tinted(k, L.c && L.c !== 'color' ? L.c : '#2b2b2b'); if (src) ar = srcH(src) / srcW(src); }
    if (L.t === 'img') { src = layerImg(L); if (src) ar = L.cr || srcH(src) / srcW(src); }   // cr: نسبة قصّ الإطار (الارتفاع إلى العرض)
    if (L.t === 'video') { src = L.poster ? layerImg({ t: 'img', ref: L.poster }) : null; ar = src ? srcH(src) / srcW(src) : 9 / 16; }
    if (L.t === 'yt') ar = ({ '9:16': 16 / 9, '4:3': 3 / 4, '1:1': 1 })[L.ar] || 9 / 16;
    if (L.t === 'audio') ar = 0.22;
    const h = w * ar;
    area(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
    ctx.translate(cx, cy); if (L.rot) ctx.rotate(L.rot * Math.PI / 180);
    const save = BOXES; BOXES = null; const gb = GBOX; GBOX = null;
    if (L.t === 'sticker' && STICKERS[L.ref]) STICKERS[L.ref].draw(ctx, w, L.c || T.c.p);
    else if (L.t === 'icon') icon(ctx, L.ref, 0, 0, w, L.c || T.c.p);
    else if (L.t === 'ticon') drawTIcon(ctx, L.ref, w, L.c || T.c.p, L.lw);
    else if (L.t === 'qr') drawQR(ctx, L.url || '', w, L.c || T.c.ink, L.bg === 'none' ? '' : (L.bg || '#ffffff'));
    else if (L.t === 'yt' || L.t === 'video') {   // بطاقة وسائط: ملصق الفيديو أو بطاقة يوتيوب، وزر تشغيل يعمل في العرض الحي
      const rr = Math.min(w, h) * (L.r != null ? L.r : 0.06);   // استدارة الحواف والظل والإطار من إعدادات العنصر
      if (L.sh) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.32)'; ctx.shadowBlur = Math.max(w, h) * 0.05; ctx.shadowOffsetY = Math.max(w, h) * 0.014; ctx.fillStyle = '#000'; rrect(ctx, -w / 2, -h / 2, w, h, rr); ctx.fill(); ctx.restore(); }
      ctx.save(); rrect(ctx, -w / 2, -h / 2, w, h, rr); ctx.clip();
      if (src) ctx.drawImage(src, -w / 2, -h / 2, w, h); else { ctx.fillStyle = L.t === 'yt' ? '#1a1a1a' : '#2a2a2a'; ctx.fillRect(-w / 2, -h / 2, w, h); }
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.restore();
      const r = Math.min(w, h) * 0.17; ctx.fillStyle = L.t === 'yt' ? '#ff0000' : 'rgba(255,255,255,.92)'; rrect(ctx, -r * 1.4, -r, r * 2.8, r * 2, r * 0.45); ctx.fill();
      ctx.fillStyle = L.t === 'yt' ? '#ffffff' : '#111111'; ctx.beginPath(); ctx.moveTo(-r * 0.35, -r * 0.5); ctx.lineTo(r * 0.55, 0); ctx.lineTo(-r * 0.35, r * 0.5); ctx.closePath(); ctx.fill();
      if (L.title) line(ctx, L.title, 0, h / 2 - w * 0.045, { size: w * 0.036, color: '#ffffff', align: 'center', maxW: w * 0.9 });
      if (L.fr) { const lw = Math.min(w, h) * 0.022; ctx.lineWidth = lw; ctx.strokeStyle = L.fr === 'p' ? T.c.p : L.fr; rrect(ctx, -w / 2 + lw / 2, -h / 2 + lw / 2, w - lw, h - lw, Math.max(0, rr - lw / 2)); ctx.stroke(); }
    }
    else if (L.t === 'audio') {
      ctx.fillStyle = L.c || T.c.p; rrect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill();
      const r = h * 0.3; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(w / 2 - h * 0.62 - r * 0.4, -r * 0.6); ctx.lineTo(w / 2 - h * 0.62 + r * 0.6, 0); ctx.lineTo(w / 2 - h * 0.62 - r * 0.4, r * 0.6); ctx.closePath(); ctx.fill();
      line(ctx, L.title || 'صوت', w / 2 - h * 1.1, 0, { size: h * 0.42, color: '#ffffff', align: 'right', maxW: w - h * 1.4 });
    }
    else if (src && L.t === 'img') drawImgLayer(ctx, src, w, h, L, T);
    else if (src) ctx.drawImage(src, -w / 2, -h / 2, w, h);
    BOXES = save; GBOX = gb;
  }
  ctx.restore();
}
// صورة مضافة: إطار بقصّ وشكل، وتكبير وإزاحة داخله، وظل وإطار ولون فوقها وتلاشي الأطراف
function drawImgLayer(ctx, src, w, h, L, T) {
  const x = -w / 2, y = -h / 2, mk = L.mk || 'rect', r = L.r || 0;
  const iw = srcW(src), ih = srcH(src), sc = Math.max(w / iw, h / ih) * (L.z || 1), dw = iw * sc, dh = ih * sc;
  const dx = x + (w - dw) / 2 + (L.ox || 0) * (dw - w) / 2, dy = y + (h - dh) / 2 + (L.oy || 0) * (dh - h) / 2;
  if (L.sh) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,' + (0.18 + 0.3 * (+L.sh || 0.5)) + ')'; ctx.shadowBlur = Math.max(w, h) * 0.06 * (+L.sh || 0.5) * 2; ctx.shadowOffsetY = Math.max(w, h) * 0.02 * (+L.sh || 0.5) * 2; ctx.fillStyle = '#000'; maskPath(ctx, mk, x, y, w, h, r); ctx.fill(); ctx.restore(); }
  const fe = +L.fe || 0;
  if (fe > 0.01) {
    // تلاشي الأطراف: نرسم في لوحة جانبية بدقة الرسم الحالية ثم نمسح الأطراف بتدرّج
    let k = 1; try { const t = ctx.getTransform(); k = Math.hypot(t.a, t.b) || 1; } catch (e) {}
    const cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k)), c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const g = c.getContext('2d'); g.scale(k, k); g.translate(w / 2, h / 2); g.imageSmoothingQuality = 'high';
    maskPath(g, mk, x, y, w, h, r); g.clip(); g.drawImage(src, dx, dy, dw, dh);
    if (L.tc) { g.globalAlpha = L.ta == null ? 0.35 : +L.ta; g.fillStyle = L.tc === 'p' ? T.c.p : L.tc; g.fillRect(x, y, w, h); g.globalAlpha = 1; }
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-in';
    const gr = g.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * (0.5 - fe * 0.5), cw / 2, ch / 2, Math.hypot(cw, ch) / 2 * (1 - fe * 0.25));
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, cw, ch);
    ctx.drawImage(c, x, y, w, h);
  } else {
    ctx.save(); maskPath(ctx, mk, x, y, w, h, r); ctx.clip(); ctx.drawImage(src, dx, dy, dw, dh);
    if (L.tc) { ctx.globalAlpha *= L.ta == null ? 0.35 : +L.ta; ctx.fillStyle = L.tc === 'p' ? T.c.p : L.tc; ctx.fillRect(x, y, w, h); }
    ctx.restore();
  }
  if (L.bw) { const lw = Math.min(w, h) * L.bw; ctx.save(); ctx.lineWidth = lw; ctx.strokeStyle = !L.bc || L.bc === 'p' ? T.c.p : L.bc; maskPath(ctx, mk, x + lw / 2, y + lw / 2, w - lw, h - lw, Math.max(0, r - L.bw / 2)); ctx.stroke(); ctx.restore(); }
}
// أيقونة من مجموعة Tabler: مسارات 24×24 تُرسم بالخط
function drawTIcon(ctx, name, w, color, lw) {
  const it = typeof TICONS !== 'undefined' && TICONS[name]; if (!it) return;
  ctx.save(); ctx.translate(-w / 2, -w / 2); ctx.scale(w / 24, w / 24);
  ctx.strokeStyle = color; ctx.lineWidth = lw || 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.stroke(new Path2D(it[1])); ctx.restore();
}
// رمز QR: يُولَّد محلياً (مكتبة qrcode-generator) ويُرسم مربعات حادة بلا تنعيم
const QR_CACHE = {};
function qrModules(text) {
  if (typeof qrcode === 'undefined') return null;
  if (QR_CACHE[text]) return QR_CACHE[text];
  try { const q = qrcode(0, 'M'); q.addData(text); q.make(); QR_CACHE[text] = q; return q; } catch (e) { return null; }
}
function drawQR(ctx, text, w, color, bg) {
  const q = qrModules(text || 'https:\u002f\u002f'); if (!q) return;
  const n = q.getModuleCount(), quiet = 2, cell = w / (n + quiet * 2);
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(-w / 2, -w / 2, w, w); }
  ctx.fillStyle = color;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) ctx.fillRect(-w / 2 + (c + quiet) * cell, -w / 2 + (r + quiet) * cell, cell + 0.2, cell + 0.2);
}
function drawLayers(ctx, W, H, layers, T) {
  (layers || []).forEach(function (L) { G(ctx, 'L:' + L.id); drawLayer(ctx, W, H, L, T); });
  G(ctx, null);
}
function addLayer(L) {
  L.id = newId();
  if (L.x == null) { L.x = 0.5; L.y = 0.5; }
  S.layers = (S.layers || []).concat([L]);
  S.sel = 'L:' + L.id;
  changed(); buildEditor();
}

/* ---------- الألوان المقترحة تلقائياً ---------- */
function contrast(a, b) { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
function genPalettes(tpl, T) {
  const C = T.c, out = [], seen = {};
  const bgs = T.swatches.filter(function (c) { return c !== '#2b2b2b'; });
  const titles = ['#ffffff', C.ink, C.a, C.pl, C.p, C.pd, C.s, C.a2];
  const accents = [C.a, C.a2, C.pl, C.p, C.s, '#ffffff'];
  bgs.forEach(function (bgc) {
    const ts = titles.filter(function (t) { return t !== bgc && contrast(t, bgc) >= 4; }).sort(function (x, y) { return contrast(y, bgc) - contrast(x, bgc); });
    const neutral = ts.find(function (t) { return t === '#ffffff' || t === C.ink; });
    const brand = ts.find(function (t) { return t !== '#ffffff' && t !== C.ink; });
    [neutral, brand].forEach(function (tc) {
      if (!tc) return;
      const ac = accents.filter(function (a) { return a !== tc && a !== bgc && contrast(a, bgc) >= 2.2; }).sort(function (x, y) { return contrast(y, bgc) - contrast(x, bgc); })[0];
      if (!ac) return;
      const key = bgc + tc + ac; if (seen[key]) return; seen[key] = 1;
      out.push({ bg: bgc, title: tc, accent: ac });
    });
  });
  return out;
}

/* ---------- التحريك: اختيار عنصر وسحبه مع المحاذاة الذكية ---------- */
let LASTG = {};   // حدود المجموعات في آخر رسم للمعاينة
function hitTest(x, y) {
  let best = null, ba = Infinity;
  const keys = Object.keys(LASTG);
  // الطبقات المضافة أولاً (الأحدث فوق)
  for (let i = (S.layers || []).length - 1; i >= 0; i--) {
    const b = LASTG['L:' + S.layers[i].id];
    if (b && x >= b.x0 - 6 && x <= b.x1 + 6 && y >= b.y0 - 6 && y <= b.y1 + 6) return 'L:' + S.layers[i].id;
  }
  keys.forEach(function (k) {
    if (k.slice(0, 2) === 'L:') return;
    const b = LASTG[k], a = (b.x1 - b.x0) * (b.y1 - b.y0);
    if (x >= b.x0 - 4 && x <= b.x1 + 4 && y >= b.y0 - 4 && y <= b.y1 + 4 && a < ba) { best = k; ba = a; }
  });
  return best;
}
function posOf(g) { S.pos = S.pos || {}; S.pos[S.size] = S.pos[S.size] || {}; return S.pos[S.size][g] || (S.pos[S.size][g] = { dx: 0, dy: 0 }); }
function moveSel(dx, dy) {
  const g = S.sel; if (!g) return;
  if (g.slice(0, 2) === 'L:') { const L = layerById(g.slice(2)); if (!L) return; const sz = SIZES[S.size]; L.x += dx / sz.w; L.y += dy / sz.h; }
  else { const p = posOf(g); p.dx += dx; p.dy += dy; }
}
function margin() { return 60 * SIZES[S.size].w / 1080; }
// يقترح إزاحة تلتصق بها حواف العنصر أو وسطه بالهوامش والمنتصف والعناصر الأخرى
function snapDelta(b, dx, dy) {
  const sz = SIZES[S.size], m = margin(), thr = 10 * sz.w / 1080;
  const xs = [m, sz.w / 2, sz.w - m], ys = [m, sz.h / 2, sz.h - m];
  Object.keys(LASTG).forEach(function (k) { if (k === S.sel) return; const o = LASTG[k]; xs.push(o.x0, (o.x0 + o.x1) / 2, o.x1); ys.push(o.y0, (o.y0 + o.y1) / 2, o.y1); });
  const guides = [];
  function best(vals, targets) {
    let r = null;
    vals.forEach(function (v) { targets.forEach(function (t) { const d = t - v; if (Math.abs(d) <= thr && (!r || Math.abs(d) < Math.abs(r.d))) r = { d: d, t: t }; }); });
    return r;
  }
  const bx = best([b.x0 + dx, (b.x0 + b.x1) / 2 + dx, b.x1 + dx], xs);
  const by = best([b.y0 + dy, (b.y0 + b.y1) / 2 + dy, b.y1 + dy], ys);
  if (bx) { dx += bx.d; guides.push({ x: bx.t }); }
  if (by) { dy += by.d; guides.push({ y: by.t }); }
  return { dx: dx, dy: dy, guides: guides };
}
function overlapsOf(g) {
  const b = LASTG[g]; if (!b) return [];
  return Object.keys(LASTG).filter(function (k) {
    if (k === g) return false; const o = LASTG[k];
    if (/^(deco|shape|panel|ring|band|photo|footer)$/.test(k) || /^(deco|shape|panel|ring|band|photo)$/.test(g)) return false;
    return Math.min(b.x1, o.x1) - Math.max(b.x0, o.x0) > 4 && Math.min(b.y1, o.y1) - Math.max(b.y0, o.y0) > 4;
  });
}

let OVL = null, GUIDES = [];
function drawOverlay() {
  if (!OVL || !pv) return;
  const r = pv.getBoundingClientRect(), st = OVL.parentNode.getBoundingClientRect();
  OVL.style.left = (r.left - st.left) + 'px'; OVL.style.top = (r.top - st.top) + 'px';
  OVL.style.width = r.width + 'px'; OVL.style.height = r.height + 'px';
  const dpr = window.devicePixelRatio || 1;
  OVL.width = Math.round(r.width * dpr); OVL.height = Math.round(r.height * dpr);
  const g = OVL.getContext('2d'), sz = SIZES[S.size], k = r.width / sz.w * dpr;
  g.clearRect(0, 0, OVL.width, OVL.height);
  g.save(); g.scale(k, k);
  GUIDES.forEach(function (q) {
    g.strokeStyle = '#e8336d'; g.lineWidth = 1.5 / k * dpr; g.setLineDash([]);
    g.beginPath(); if (q.x != null) { g.moveTo(q.x, 0); g.lineTo(q.x, sz.h); } else { g.moveTo(0, q.y); g.lineTo(sz.w, q.y); } g.stroke();
  });
  const b = S.sel && LASTG[S.sel];
  if (b) {
    const bad = overlapsOf(S.sel).length > 0;
    g.strokeStyle = bad ? '#e0662f' : '#2f7de0'; g.lineWidth = 2 / k * dpr; g.setLineDash([6 / k * dpr, 4 / k * dpr]);
    g.strokeRect(b.x0 - 6, b.y0 - 6, b.x1 - b.x0 + 12, b.y1 - b.y0 + 12);
  }
  g.restore();
}
function bindStage(cv) {
  let st = null, lastTap = { g: null, t: 0 };
  function pt(e) { const r = cv.getBoundingClientRect(), sz = SIZES[S.size]; return { x: (e.clientX - r.left) / r.width * sz.w, y: (e.clientY - r.top) / r.height * sz.h }; }
  cv.addEventListener('pointerdown', function (e) {
    const p = pt(e), g = hitTest(p.x, p.y);
    if (g !== S.sel) { S.sel = g; closeInline(); buildSelBar(); drawOverlay(); }
    if (!g) return;
    // اللمس المزدوج في الجوال يفتح تعديل النص (النقر المزدوج بالفأرة له حدثه)
    const now = Date.now();
    if (e.pointerType !== 'mouse' && lastTap.g === g && now - lastTap.t < 380) { lastTap = { g: null, t: 0 }; e.preventDefault(); openInline(g); return; }
    lastTap = { g: g, t: now };
    // سحب صورة القالب داخل إطارها يبقى كما كان
    if (g === 'photo') {
      const f = S.tpl.fields.find(function (x) { return x.kind === 'image' && S.d[x.k]; });
      if (f && !e.altKey) { st = { photo: f.k, x: e.clientX, y: e.clientY, ox: S.d[f.k].ox || 0, oy: S.d[f.k].oy || 0 }; cv.setPointerCapture(e.pointerId); return; }
    }
    st = { g: g, p0: p, moved: false, box: Object.assign({}, LASTG[g]) };
    if (g.slice(0, 2) === 'L:') { const L = layerById(g.slice(2)); st.lx = L.x; st.ly = L.y; } else { const q = posOf(g); st.dx0 = q.dx; st.dy0 = q.dy; }
    cv.setPointerCapture(e.pointerId); cv.classList.add('drag');
  });
  cv.addEventListener('pointermove', function (e) {
    if (!st) { const p = pt(e); cv.style.cursor = hitTest(p.x, p.y) ? 'move' : 'default'; return; }
    if (st.photo) { const r = cv.getBoundingClientRect(), v = S.d[st.photo]; v.ox = Math.max(-2, Math.min(2, st.ox + (e.clientX - st.x) / r.width * 2)); v.oy = Math.max(-2, Math.min(2, st.oy + (e.clientY - st.y) / r.height * 2)); schedule(); return; }
    const p = pt(e); let dx = p.x - st.p0.x, dy = p.y - st.p0.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) st.moved = true;
    // Shift يقيّد الحركة بمحور واحد (أفقي أو رأسي حسب الاتجاه الأكبر)، وAlt يوقف الالتصاق
    if (e.shiftKey) { if (!st.axis && Math.abs(dx) + Math.abs(dy) > 6) st.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'; if (st.axis === 'x') dy = 0; else if (st.axis === 'y') dx = 0; } else st.axis = null;
    let sn = e.altKey ? { dx: dx, dy: dy, guides: [] } : snapDelta(st.box, dx, dy);
    if (st.axis === 'x') { sn.dy = 0; sn.guides = sn.guides.filter(function (q) { return q.x != null; }); }
    if (st.axis === 'y') { sn.dx = 0; sn.guides = sn.guides.filter(function (q) { return q.y != null; }); }
    GUIDES = sn.guides;
    if (st.g.slice(0, 2) === 'L:') { const L = layerById(st.g.slice(2)), sz = SIZES[S.size]; L.x = st.lx + sn.dx / sz.w; L.y = st.ly + sn.dy / sz.h; }
    else { const q = posOf(st.g); q.dx = st.dx0 + sn.dx; q.dy = st.dy0 + sn.dy; }
    schedule();
  });
  function end() { if (st) { const m = st.moved || st.photo; st = null; GUIDES = []; cv.classList.remove('drag'); if (m) { saveState(); setTimeout(buildSelBar, 30); } schedule(); } }
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('dblclick', function (e) { const p = pt(e), g = hitTest(p.x, p.y); if (g) { e.preventDefault(); openInline(g); } });
}

/* ---------- تعديل النص مباشرة على التصميم (نقر مزدوج) ----------
   نعرف خانة النص التي يرسمها العنصر بمطابقة ما رُسم فيه مع قيم الخانات */
function plainOf(v) { return norm(String(v == null ? '' : v).replace(/\*/g, '')).replace(/\s+/g, ' ').trim(); }
function fieldsOfGroup(g) {
  if (g.slice(0, 2) === 'L:') { const L = layerById(g.slice(2)); return L && L.t === 'text' ? [{ layer: L }] : []; }
  const lines = (LASTT[g] || []).map(plainOf).filter(Boolean);
  if (!lines.length) return [];
  const out = [];
  S.tpl.fields.forEach(function (f) {
    if (!f.k || (f.kind && f.kind !== 'area' && f.kind !== 'text')) return;   // hidden وغيرها لا تُعدّل نصاً
    if (S.hide['f_' + f.k] || typeof S.d[f.k] !== 'string') return;
    const v = plainOf(S.d[f.k]); if (!v) return;
    const hit = lines.filter(function (l) { return v.indexOf(l) >= 0 || l.indexOf(v) >= 0; }).length;
    if (hit) out.push({ f: f, hit: hit });
  });
  return out.sort(function (a, b) { return b.hit - a.hit; });
}
function closeInline() { const o = $('.ied'); if (o) { o.remove(); saveState(); } }
function openInline(g) {
  closeInline();
  const list = fieldsOfGroup(g), b = LASTG[g];
  if (!b) return;
  if (!list.length) { toast('هذا العنصر ليس نصاً. اختره لتحريكه أو تغيير حجمه ولونه.'); return; }
  S.sel = g; buildSelBar(); drawOverlay();
  const stg = pv.parentNode, r = pv.getBoundingClientRect(), sr = stg.getBoundingClientRect(), sz = SIZES[S.size], k = r.width / sz.w;
  const box = el('div', { class: 'ied', role: 'dialog', 'aria-label': 'تعديل النص' });
  list.forEach(function (it, i) {
    const ta = el('textarea', { rows: '1', 'aria-label': it.layer ? 'النص' : it.f.label });
    ta.value = it.layer ? (it.layer.txt || '') : S.d[it.f.k];
    const fit2 = function () { ta.style.height = 'auto'; ta.style.height = Math.min(220, ta.scrollHeight + 2) + 'px'; };
    ta.addEventListener('input', function () {
      if (it.layer) { it.layer.txt = ta.value; const lt = $('#selbar textarea'); if (lt) lt.value = ta.value; } else { S.d[it.f.k] = ta.value; const side = document.getElementById('f_' + it.f.k); if (side) side.value = ta.value; }
      fit2(); schedule(); clearTimeout(saveT); saveT = setTimeout(saveState, 600);
    });
    ta.addEventListener('keydown', function (e) { if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); closeInline(); } });
    if (list.length > 1) box.appendChild(el('small', { text: it.f.label }));
    box.appendChild(ta); setTimeout(fit2, 0);
    if (i === 0) setTimeout(function () { ta.focus(); ta.select(); }, 30);
  });
  box.appendChild(el('div', { class: 'iedf' }, [el('span', { text: 'ما بين *نجمتين* يظهر بلون مميز' }), el('button', { type: 'button', class: 'mini accent', text: 'تم', onclick: closeInline })]));
  const narrow = window.matchMedia('(max-width: 900px)').matches;
  (narrow ? document.body : stg).appendChild(box);
  if (narrow) { box.style.top = Math.round(Math.max(56, stg.getBoundingClientRect().bottom + 8)) + 'px'; return; }   // في الجوال تحت المعاينة مباشرة
  const w = Math.max(260, Math.min(sr.width - 16, (b.x1 - b.x0) * k + 24));
  let x = r.left - sr.left + ((b.x0 + b.x1) / 2) * k - w / 2; x = Math.max(8, Math.min(sr.width - w - 8, x));
  let y = r.top - sr.top + b.y1 * k + 10;
  box.style.width = w + 'px'; box.style.left = x + 'px';
  if (y + box.offsetHeight > sr.height - 8) y = Math.max(8, r.top - sr.top + b.y0 * k - box.offsetHeight - 10);
  box.style.top = y + 'px';
}
document.addEventListener('pointerdown', function (e) { const o = $('.ied'); if (o && !o.contains(e.target) && e.target !== pv) closeInline(); }, true);

document.addEventListener('keydown', function (e) {
  if (!S.sel || !$('.editor')) return;
  const tag = document.activeElement && document.activeElement.tagName;
  if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
  const k = e.shiftKey ? 10 : 2;
  const m = { ArrowLeft: [-k, 0], ArrowRight: [k, 0], ArrowUp: [0, -k], ArrowDown: [0, k] }[e.key];
  if (m) { e.preventDefault(); moveSel(m[0], m[1]); changed(); setTimeout(buildSelBar, 50); }
  if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel.slice(0, 2) === 'L:') { e.preventDefault(); delLayer(S.sel.slice(2)); }
  if (e.key === 'Escape') { S.sel = null; buildSelBar(); drawOverlay(); }
});
function delLayer(id) { S.layers = S.layers.filter(function (L) { return L.id !== id; }); S.sel = null; changed(); buildEditor(); }

/* شريط العنصر المختار: المواضع المقترحة والخصائص */
function buildSelBar() {
  const bar = $('#selbar'); if (!bar) return;
  bar.innerHTML = '';
  const g = S.sel, b = g && LASTG[g];
  if (!g || !b) { bar.hidden = true; return; }
  bar.hidden = false;
  const sz = SIZES[S.size], m = margin(), isL = g.slice(0, 2) === 'L:', L = isL ? layerById(g.slice(2)) : null;
  const head = el('div', { class: 'sbh' }, [el('b', { text: gName(g) }),
    el('button', { type: 'button', class: 'x', 'aria-label': 'إلغاء الاختيار', text: '×', onclick: function () { S.sel = null; buildSelBar(); drawOverlay(); } })]);
  bar.appendChild(head);
  // المواضع المقترحة: شبكة تسعة مواضع داخل الهوامش، ويُعلَّم ما يتداخل مع غيره
  const w = b.x1 - b.x0, h = b.y1 - b.y0;
  const tx = [sz.w - m - w, (sz.w - w) / 2, m], ty = [m, (sz.h - h) / 2, sz.h - m - h];
  const arrows = ['↗', '↑', '↖', '→', '•', '←', '↘', '↓', '↙'];
  const grid = el('div', { class: 'pos9' });
  ty.forEach(function (yv, ri) { tx.forEach(function (xv, ci) {
    const ddx = xv - b.x0, ddy = yv - b.y0;
    const nb = { x0: b.x0 + ddx, y0: b.y0 + ddy, x1: b.x1 + ddx, y1: b.y1 + ddy };
    const clash = Object.keys(LASTG).some(function (k) { if (k === g || /^(deco|shape|panel|ring|band|photo)$/.test(k)) return false; const o = LASTG[k]; return Math.min(nb.x1, o.x1) - Math.max(nb.x0, o.x0) > 4 && Math.min(nb.y1, o.y1) - Math.max(nb.y0, o.y0) > 4; });
    grid.appendChild(el('button', { type: 'button', class: clash ? 'clash' : 'ok', title: clash ? 'يتداخل مع عنصر آخر' : 'موضع مناسب', text: arrows[ri * 3 + ci], onclick: function () { moveSel(ddx, ddy); changed(); setTimeout(buildSelBar, 60); } }));
  }); });
  const tools = el('div', { class: 'sbt' }, [
    el('div', { class: 'sbcol' }, [el('small', { text: 'مواضع مقترحة' }), grid]),
    el('div', { class: 'sbcol grow', id: 'sbprops' })
  ]);
  bar.appendChild(tools);
  const props = tools.querySelector('#sbprops');
  props.appendChild(el('div', { class: 'sbrow' }, [
    el('button', { type: 'button', class: 'mini', text: 'توسيط أفقي', onclick: function () { moveSel(sz.w / 2 - (b.x0 + b.x1) / 2, 0); changed(); setTimeout(buildSelBar, 60); } }),
    el('button', { type: 'button', class: 'mini', text: 'توسيط عمودي', onclick: function () { moveSel(0, sz.h / 2 - (b.y0 + b.y1) / 2); changed(); setTimeout(buildSelBar, 60); } }),
    isL ? null : el('button', { type: 'button', class: 'mini', text: 'إرجاعه لمكانه', onclick: function () { const q = posOf(g); q.dx = 0; q.dy = 0; changed(); setTimeout(buildSelBar, 60); } }),
    el('button', { type: 'button', class: 'mini accent', text: 'استبدال', onclick: function () { openReplace(g); } }),
    isL ? null : el('button', { type: 'button', class: 'mini', text: 'إخفاء', onclick: function () { S.hide['g_' + g] = true; S.sel = null; changed(); buildEditor(true); } })
  ]));
  const ov = overlapsOf(g);
  if (ov.length) props.appendChild(el('p', { class: 'warn', text: 'يتداخل مع: ' + ov.map(gName).join('، ') + '. اختر موضعاً أخضر من الشبكة.' }));
  else props.appendChild(el('p', { class: 'note', text: 'اسحب العنصر في المعاينة فيلتصق بالهوامش والعناصر الأخرى. Shift أثناء السحب يقيّده أفقياً أو رأسياً، وAlt يوقف الالتصاق. وانقر نقراً مزدوجاً على النص لتعديله.' }));
  if (L) layerProps(props, L); else groupProps(props, g);
}
/* تنسيق عنصر القالب وحده: حجمه ولونه وخطه، دون أن يتأثر غيره */
function setGs(g, key, val) {
  S.gs = S.gs || {};
  const o = Object.assign({}, S.gs[g] || {});
  if (val === '' || val == null || (key === 's' && Math.abs(val - 1) < 0.005)) delete o[key]; else o[key] = val;
  if (Object.keys(o).length) S.gs[g] = o; else delete S.gs[g];
}
function colorPick(label, cur, on) {
  const T = S.track;
  return el('div', { class: 'gsrow' }, [el('small', { text: label }), el('div', { class: 'sws' }, [
    el('button', { type: 'button', class: 'swt orig' + (cur ? '' : ' on'), title: 'كما في القالب', onclick: function () { on(''); changed(); buildSelBar(); } }, ['أصل'])
  ].concat(T.swatches.concat(['#ffffff']).filter(function (c, i, a) { return a.indexOf(c) === i; }).map(function (c) {
    return el('button', { type: 'button', class: 'swt' + (cur === c ? ' on' : ''), style: 'background:' + c, title: c, 'aria-label': c, onclick: function () { on(c); changed(); buildSelBar(); } });
  })).concat([el('label', { class: 'swt more', title: 'لون آخر' }, ['+', el('input', { type: 'color', value: /^#/.test(cur || '') ? cur : '#467839', 'aria-label': 'لون آخر', oninput: function (e) { on(e.target.value); schedule(); }, onchange: function () { saveState(); buildSelBar(); } })])]))]);
}
function groupProps(box, g) {
  const st = (S.gs && S.gs[g]) || {}, hasText = !!(LASTT[g] && LASTT[g].length);
  const sc = st.s || 1;
  const lbl = el('b', { class: 'pct', text: Math.round(sc * 100) + '٪' });
  box.appendChild(el('div', { class: 'range' }, [el('span', { text: 'الحجم' }),
    el('input', { type: 'range', min: '0.5', max: '2', step: '0.01', value: String(sc), 'aria-label': 'حجم العنصر', oninput: function (e) { setGs(g, 's', +e.target.value); lbl.textContent = Math.round(+e.target.value * 100) + '٪'; schedule(); }, onchange: function () { saveState(); setTimeout(buildSelBar, 30); } }),
    lbl]));
  if (hasText) {
    box.appendChild(colorPick('لون النص', st.c || '', function (c) { setGs(g, 'c', c); }));
    box.appendChild(colorPick('لون التمييز والأيقونات', st.h || '', function (c) { setGs(g, 'h', c); }));
    box.appendChild(el('div', { class: 'gsrow' }, [el('small', { text: 'الخط' }), seg([['', 'خط القالب']].concat(Object.keys(FONTS).map(function (id) { return [id, FONTS[id].name]; })), st.f || '', function (v) { setGs(g, 'f', v); changed(); })]));
  }
  const fl = fieldsOfGroup(g);
  box.appendChild(el('div', { class: 'sbrow' }, [
    fl.length ? el('button', { type: 'button', class: 'mini accent', text: 'تعديل النص', onclick: function () { openInline(g); } }) : null,
    Object.keys(st).length ? el('button', { type: 'button', class: 'mini', text: 'إرجاع تنسيقه', onclick: function () { delete S.gs[g]; changed(); buildSelBar(); } }) : null
  ]));
}
function rangeRow(label, min, max, step, val, on) {
  return el('div', { class: 'range' }, [el('span', { text: label }), el('input', { type: 'range', min: String(min), max: String(max), step: String(step), value: String(val), 'aria-label': label, oninput: function (e) { on(+e.target.value); schedule(); }, onchange: function () { saveState(); } })]);
}
function swatchRow(cur, on, withColorOpt) {
  const T = S.track;
  const list = (withColorOpt ? ['color'] : []).concat(T.swatches);
  return el('div', { class: 'sws' }, list.map(function (c) {
    return el('button', { type: 'button', class: 'swt' + (cur === c ? ' on' : '') + (c === 'color' ? ' orig' : ''), style: c === 'color' ? '' : 'background:' + c, title: c === 'color' ? 'الألوان الأصلية' : c, onclick: function () { on(c); changed(); buildSelBar(); } }, [c === 'color' ? 'أصل' : '']);
  }).concat([el('label', { class: 'swt more', title: 'لون آخر' }, ['+', el('input', { type: 'color', value: /^#/.test(cur || '') ? cur : '#467839', oninput: function (e) { on(e.target.value); schedule(); }, onchange: function () { saveState(); } })])]));
}
function layerProps(box, L) {
  if (L.t === 'text') {
    const ta = el('textarea', { rows: '2', 'aria-label': 'النص' }); ta.value = L.txt || '';
    ta.addEventListener('input', function () { L.txt = ta.value; changed(); });
    box.appendChild(ta);
    box.appendChild(seg([['right', 'يمين'], ['center', 'وسط'], ['left', 'يسار']], L.al || 'center', function (v) { L.al = v; changed(); }));
    box.appendChild(seg([['0', 'عادي'], ['0.4', 'متوسط'], ['0.8', 'عريض'], ['1', 'أعرض']], String(L.b || 0), function (v) { L.b = +v; changed(); }));
    box.appendChild(rangeRow('حجم الخط', 0.02, 0.16, 0.002, L.sz || 0.06, function (v) { L.sz = v; }));
    box.appendChild(rangeRow('عرض السطر', 0.15, 0.95, 0.01, L.w, function (v) { L.w = v; }));
  } else {
    box.appendChild(rangeRow('الحجم', 0.03, 1.2, 0.005, L.w, function (v) { L.w = v; }));
    box.appendChild(rangeRow('الدوران', -180, 180, 1, L.rot || 0, function (v) { L.rot = v; }));
    if (L.t === 'img') box.appendChild(rangeRow('استدارة الحواف', 0, 0.5, 0.01, L.r || 0, function (v) { L.r = v; }));
  }
  box.appendChild(rangeRow('الشفافية', 0.1, 1, 0.01, L.o == null ? 1 : L.o, function (v) { L.o = v; }));
  if (L.t !== 'img' && !(L.t === 'logo' && L.ref === 'social' && false)) box.appendChild(el('div', {}, [el('small', { text: 'اللون' }), swatchRow(L.c || '', function (c) { L.c = c; }, L.t === 'logo' && L.ref === 'track')]));
  box.appendChild(el('div', { class: 'sbrow' }, [
    el('button', { type: 'button', class: 'mini', text: 'تكرار', onclick: function () { const c = JSON.parse(JSON.stringify(L)); c.x += 0.04; c.y += 0.04; addLayer(c); } }),
    el('button', { type: 'button', class: 'mini', text: 'للأمام', onclick: function () { const i = S.layers.indexOf(L); if (i < S.layers.length - 1) { S.layers.splice(i, 1); S.layers.splice(i + 1, 0, L); changed(); } } }),
    el('button', { type: 'button', class: 'mini', text: 'للخلف', onclick: function () { const i = S.layers.indexOf(L); if (i > 0) { S.layers.splice(i, 1); S.layers.splice(i - 1, 0, L); changed(); } } }),
    el('button', { type: 'button', class: 'mini danger', text: 'حذف', onclick: function () { delLayer(L.id); } })
  ]));
}

/* ---------- لوحة المكتبة ---------- */
function miniCanvas(drawFn, w, h) {
  const c = el('canvas', { width: w || 88, height: h || 88 });
  const g = c.getContext('2d'); g.translate(c.width / 2, c.height / 2); drawFn(g, Math.min(c.width, c.height) * 0.78);
  return c;
}
function buildLibrary(body) {
  const T = S.track, C = T.c;
  const sect = function (title, note) { body.appendChild(el('h3', { class: 'sh', text: title })); if (note) body.appendChild(el('p', { class: 'note', text: note })); };
  sect('نص', 'أضف سطراً حراً، ثم حرّكه وغيّر حجمه ولونه من شريط العنصر تحت المعاينة.');
  body.appendChild(el('div', { class: 'libgrid' }, [
    el('button', { type: 'button', class: 'libtxt big', onclick: function () { addLayer({ t: 'text', txt: 'عنوان جديد', sz: 0.09, b: 1, al: 'center', w: 0.8, c: '' }); } }, ['عنوان']),
    el('button', { type: 'button', class: 'libtxt', onclick: function () { addLayer({ t: 'text', txt: 'نص قصير يكتب هنا', sz: 0.04, b: 0, al: 'center', w: 0.7, c: '' }); } }, ['نص'])
  ]));
  sect('رسومات وزخارف');
  body.appendChild(el('div', { class: 'libgrid' }, Object.keys(STICKERS).map(function (k) {
    return el('button', { type: 'button', class: 'libit', title: STICKERS[k].name, 'aria-label': STICKERS[k].name, onclick: function () { addLayer({ t: 'sticker', ref: k, w: k === 'line' ? 0.4 : 0.18, c: k === 'star' || k === 'stars2' || k === 'sparkle' ? C.a : C.p }); } },
      [miniCanvas(function (g, s) { STICKERS[k].draw(g, s, k === 'star' || k === 'stars2' ? C.a : C.p); })]);
  })));
  sect('أيقونات');
  body.appendChild(el('div', { class: 'libgrid' }, ICON_LIST.map(function (k) {
    return el('button', { type: 'button', class: 'libit', title: k, onclick: function () { addLayer({ t: 'icon', ref: k, w: 0.06, c: C.s }); } }, [miniCanvas(function (g, s) { ICONS[k](g, s * 0.8, C.s); })]);
  })));
  sect('شعارات');
  body.appendChild(el('div', { class: 'libgrid wide' }, LOGO_LIST.map(function (q) {
    const src = q[0] === 'track' ? ASSETS[T.logo] : null;
    const b = el('button', { type: 'button', class: 'libit wide', title: q[1], onclick: function () { addLayer({ t: 'logo', ref: q[0], w: q[0] === 'track' ? 0.2 : 0.16, c: q[0] === 'track' ? 'color' : '#4a4a4a' }); } });
    if (src) b.style.backgroundImage = 'url(' + src + ')';
    else b.appendChild(miniCanvas(function (g, s) { const t = tinted(q[0], '#4a4a4a'); if (t) { const w = s * 1.6, h = w * srcH(t) / srcW(t); g.drawImage(t, -w / 2, -h / 2, w, h); } }, 160, 70));
    return b;
  })));
  sect('شعارات الهويات', 'شعار أي مسار أو نشاط، بألوانه الأصلية.');
  body.appendChild(el('div', { class: 'libgrid wide' }, allLogos().map(function (q) {
    const b = el('button', { type: 'button', class: 'libit wide', title: q[1], 'aria-label': q[1], onclick: function () { addLayer({ t: 'logo', ref: q[0], w: 0.2, c: 'color' }); } });
    b.style.backgroundImage = 'url(' + ASSETS[q[0]] + ')'; return b;
  })));
  sect('صور', 'صور المكتبة، أو ارفع صورتك.');
  const file = el('input', { type: 'file', accept: '.jpg,.jpeg,.png,.webp', hidden: true, onchange: function (e) {
    const fl = e.target.files[0]; if (!fl) return;
    readImage(fl, function (src) { addLayer({ t: 'img', ref: src, w: 0.5 }); }); e.target.value = '';
  } });
  body.appendChild(el('div', { class: 'libgrid' }, DATE_LIB.map(function (n) {
    const b = el('button', { type: 'button', class: 'libit photo', title: LIB_NAMES[n], onclick: function () { addLayer({ t: 'img', ref: 'lib:' + n, w: 0.55 }); } });
    b.style.backgroundImage = 'url(' + ASSETS[n] + ')'; return b;
  }).concat([el('button', { type: 'button', class: 'libit up', onclick: function () { file.click(); } }, ['رفع']), file])));
  sect('خلفيات', 'نقش يُضاف إلى لون الخلفية في أي قالب.');
  const cur = (S.bgfx && S.bgfx.p) || 'plain';
  body.appendChild(el('div', { class: 'libgrid' }, BG_PATTERNS.map(function (q) {
    const on = cur === q[0];
    const c = el('canvas', { width: 90, height: 112 });
    const g = c.getContext('2d'); const saveB = BGFX; BGFX = { p: q[0], im: q[0] === 'photo' ? IMG.img_arch : null };
    g.scale(90 / 1080, 112 / 1350); paintBg(g, 1080, 1350, C.pd); BGFX = saveB;
    return el('button', { type: 'button', class: 'libit bgp' + (on ? ' on' : ''), title: q[1], onclick: function () {
      if (q[0] === 'photo') { S.bgfx = { p: 'photo', src: (S.bgfx && S.bgfx.src) || 'lib:img_arch' }; } else S.bgfx = q[0] === 'plain' ? null : { p: q[0] };
      changed(); buildEditor();
    } }, [c, el('small', { text: q[1] })]);
  })));
  if (cur === 'photo') {
    body.appendChild(el('p', { class: 'note', text: 'صورة الخلفية:' }));
    const bfile = el('input', { type: 'file', accept: '.jpg,.jpeg,.png,.webp', hidden: true, onchange: function (e) { const fl = e.target.files[0]; if (!fl) return; readImage(fl, function (src) { S.bgfx = { p: 'photo', src: src }; changed(); buildEditor(); }); } });
    body.appendChild(el('div', { class: 'libgrid' }, DATE_LIB.map(function (n) {
      const b = el('button', { type: 'button', class: 'libit photo' + (S.bgfx.src === 'lib:' + n ? ' on' : ''), onclick: function () { S.bgfx = { p: 'photo', src: 'lib:' + n }; changed(); buildEditor(); } });
      b.style.backgroundImage = 'url(' + ASSETS[n] + ')'; return b;
    }).concat([el('button', { type: 'button', class: 'libit up', onclick: function () { bfile.click(); } }, ['رفع']), bfile])));
  }
  if ((S.layers || []).length) {
    sect('العناصر المضافة', 'اضغط عنصراً لاختياره.');
    body.appendChild(el('div', { class: 'llist' }, S.layers.slice().reverse().map(function (L) {
      return el('div', { class: 'lrow' + (S.sel === 'L:' + L.id ? ' on' : '') }, [
        el('button', { type: 'button', class: 'lname', text: gName('L:' + L.id), onclick: function () { S.sel = 'L:' + L.id; buildSelBar(); drawOverlay(); } }),
        el('button', { type: 'button', class: 'mini accent', text: 'استبدال', onclick: function () { openReplace('L:' + L.id); } }),
        el('button', { type: 'button', class: 'mini danger', text: 'حذف', onclick: function () { delLayer(L.id); } })
      ]);
    })));
  }
}

/* ---------- المصمم المساعد ---------- */
const SKELETONS = [
  { id: 'center', name: 'عنوان في الوسط', make: function (T, ar) { const C = T.c; return [
    { t: 'logo', ref: 'track', x: 0.84, y: 0.07, w: 0.2, c: 'color' },
    { t: 'text', txt: 'السطر الأعلى', x: 0.5, y: 0.3, w: 0.7, sz: 0.035, b: 0.4, al: 'center', c: C.s },
    { t: 'text', txt: 'العنوان هنا', x: 0.5, y: 0.42, w: 0.82, sz: 0.11, b: 1, al: 'center', c: '' },
    { t: 'sticker', ref: 'line', x: 0.5, y: 0.53, w: 0.3, c: C.a },
    { t: 'text', txt: 'اليوم والتاريخ والوقت', x: 0.5, y: 0.6, w: 0.75, sz: 0.04, b: 0.4, al: 'center', c: '' },
    { t: 'sticker', ref: 'petal', x: 0.14, y: 0.76, w: 0.2, c: C.p, o: 0.9 },
    { t: 'logo', ref: 'academy', x: 0.84, y: 0.94, w: 0.16, c: '#6f6f6f' },
    { t: 'logo', ref: 'social', x: 0.16, y: 0.94, w: 0.15, c: '#6f6f6f' }]; } },
  { id: 'panel', name: 'لوحة سفلية', make: function (T) { const C = T.c; return [
    { t: 'logo', ref: 'track', x: 0.84, y: 0.08, w: 0.2, c: 'color' },
    { t: 'sticker', ref: 'dots', x: 0.25, y: 0.2, w: 0.3, c: '#e6e6e6' },
    { t: 'sticker', ref: 'petal', x: 0.62, y: 0.28, w: 0.14, c: C.a },
    { t: 'sticker', ref: 'rsq', x: 0.5, y: 0.82, w: 1.25, c: C.pd },
    { t: 'text', txt: 'العنوان هنا', x: 0.5, y: 0.58, w: 0.8, sz: 0.095, b: 0.8, al: 'right', c: '#ffffff' },
    { t: 'text', txt: 'أ. اسم المقدّم', x: 0.5, y: 0.7, w: 0.8, sz: 0.04, b: 0.3, al: 'right', c: '#ffffff' },
    { t: 'text', txt: 'الأحد 6:00 م · عبر زوم', x: 0.5, y: 0.9, w: 0.8, sz: 0.032, b: 0, al: 'right', c: '#ffffff' }]; } },
  { id: 'photo', name: 'صورة ونص', make: function (T) { const C = T.c; return [
    { t: 'img', ref: 'lib:img_mosque', x: 0.5, y: 0.33, w: 0.75 },
    { t: 'text', txt: 'العنوان هنا', x: 0.5, y: 0.68, w: 0.8, sz: 0.1, b: 1, al: 'center', c: C.s },
    { t: 'text', txt: 'الجمعة · 25 سبتمبر 2026 م', x: 0.5, y: 0.78, w: 0.75, sz: 0.038, b: 0.4, al: 'center', c: C.p },
    { t: 'logo', ref: 'track', x: 0.84, y: 0.94, w: 0.16, c: 'color' }]; } },
  { id: 'quote', name: 'عبارة', make: function (T) { const C = T.c; return [
    { t: 'sticker', ref: 'rays', x: 0.3, y: 0.32, w: 0.8, c: C.tealL, o: 0.35 },
    { t: 'sticker', ref: 'quote', x: 0.85, y: 0.52, w: 0.1, c: C.a },
    { t: 'text', txt: 'عنوان العبارة', x: 0.5, y: 0.62, w: 0.84, sz: 0.07, b: 1, al: 'right', c: '#ffffff' },
    { t: 'text', txt: 'نص العبارة أو البيت يكتب هنا\nفي سطرين', x: 0.5, y: 0.75, w: 0.84, sz: 0.042, b: 0, al: 'right', c: '#ffffff' },
    { t: 'logo', ref: 'track', x: 0.86, y: 0.94, w: 0.14, c: '#ffffff' }]; }, bg: 'teal' },
  { id: 'side', name: 'شريط جانبي', make: function (T) { const C = T.c; return [
    { t: 'sticker', ref: 'rsq', x: 0.08, y: 0.5, w: 0.12, c: C.p },
    { t: 'text', txt: 'العنوان هنا', x: 0.55, y: 0.36, w: 0.72, sz: 0.1, b: 1, al: 'right', c: C.pd },
    { t: 'text', txt: 'سطر توضيحي قصير', x: 0.55, y: 0.47, w: 0.72, sz: 0.04, b: 0.3, al: 'right', c: '' },
    { t: 'icon', ref: 'moon', x: 0.86, y: 0.6, w: 0.05, c: C.p },
    { t: 'text', txt: 'الخميس 8:00 م', x: 0.53, y: 0.6, w: 0.6, sz: 0.04, b: 0.4, al: 'right', c: '' },
    { t: 'logo', ref: 'track', x: 0.84, y: 0.9, w: 0.18, c: 'color' }]; } }
];
function applySkeleton(sk) {
  const T = S.track;
  S.layers = sk.make(T).map(function (L) { L.id = newId(); return L; });
  if (sk.bg === 'teal') S.ov = { bg: T.c.teal, title: '#ffffff', accent: T.c.a }; else S.ov = {};
  S.sel = null; changed(); buildEditor();
}
// اقتراحات المساعد بحسب حال التصميم الآن
function assistantTips() {
  const T = S.track, tips = [], Ls = S.layers || [], sz = SIZES[S.size], m = margin();
  const base = baseOf(S.tpl, snap(), T);
  const texts = Ls.filter(function (L) { return L.t === 'text' && has(L.txt); });
  if (!Ls.length) { tips.push({ t: 'ابدأ بهيكل جاهز من الأعلى، أو أضف عنواناً من المكتبة.', a: [['أضف عنواناً', function () { addLayer({ t: 'text', txt: 'العنوان هنا', sz: 0.1, b: 1, al: 'center', w: 0.82, y: 0.4, x: 0.5 }); }]] }); return tips; }
  if (!texts.some(function (L) { return (L.sz || 0) >= 0.07; })) tips.push({ t: 'لا يوجد عنوان بارز. التصميم الجيد له عنصر واحد يلفت النظر أولاً.', a: [['أضف عنواناً', function () { addLayer({ t: 'text', txt: 'العنوان هنا', sz: 0.1, b: 1, al: 'center', w: 0.82, x: 0.5, y: 0.35 }); }]] });
  if (!Ls.some(function (L) { return L.t === 'logo' && L.ref === 'track'; }) && !S.hide.logo) tips.push({ t: 'أضف شعار المسار ليعرف المتابع مصدر الإعلان.', a: [['أضف الشعار', function () { addLayer({ t: 'logo', ref: 'track', x: 0.84, y: 0.07, w: 0.2, c: isDark(base) ? '#ffffff' : 'color' }); }]] });
  // لون ما تحت النص: آخر شكل مصمت قبله يغطي مركزه، وإلا فالخلفية
  function bgUnder(L) {
    let c = base; const i = Ls.indexOf(L);
    Ls.slice(0, i).forEach(function (q) {
      if (q.t !== 'sticker' || !/^(rsq|disc|pillb)$/.test(q.ref) || !/^#/.test(q.c || '')) return;
      const b = LASTG['L:' + q.id]; if (!b) return;
      const x = L.x * sz.w, y = L.y * sz.h;
      if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) c = q.c;
    });
    return c;
  }
  texts.forEach(function (L) {
    const col = L.c || T.c.ink, under = bgUnder(L);
    if (/^#/.test(col) && contrast(col, under) < 3) tips.push({ t: 'النص «' + L.txt.slice(0, 18) + '» ضعيف الوضوح على هذه الخلفية.', a: [['صحّح اللون', function () { L.c = isDark(under) ? '#ffffff' : T.c.ink; changed(); buildEditor(); }]] });
  });
  Object.keys(LASTG).forEach(function (k) {
    if (k.slice(0, 2) !== 'L:') return; const b = LASTG[k], L = layerById(k.slice(2)); if (!L || L.t === 'sticker' || L.t === 'img') return;
    if (b.x0 < m * 0.6 || b.x1 > sz.w - m * 0.6 || b.y0 < m * 0.6 || b.y1 > sz.h - m * 0.6) tips.push({ t: '«' + gName(k) + '» قريب جداً من حافة التصميم، وقد يُقصّ عند النشر.', a: [['أدخله في الهامش', function () {
      let dx = 0, dy = 0; if (b.x0 < m) dx = m - b.x0; if (b.x1 > sz.w - m) dx = sz.w - m - b.x1; if (b.y0 < m) dy = m - b.y0; if (b.y1 > sz.h - m) dy = sz.h - m - b.y1;
      L.x += dx / sz.w; L.y += dy / sz.h; changed(); buildEditor(); }]] });
    const ov = overlapsOf(k).filter(function (o) { const q = o.slice(0, 2) === 'L:' ? layerById(o.slice(2)) : null; return !q || (q.t === 'text' || q.t === 'logo'); });
    if (ov.length) tips.push({ t: '«' + gName(k) + '» يتداخل مع «' + gName(ov[0]) + '».', a: [['باعد بينهما', function () { autoStack(); }]] });
  });
  const aligns = {}; texts.forEach(function (L) { aligns[L.al || 'center'] = 1; });
  if (Object.keys(aligns).length > 1) tips.push({ t: 'النصوص بمحاذاة مختلفة. توحيد المحاذاة يجعل التصميم أهدأ وأوضح.', a: [['كلها يمين', function () { alignAll('right'); }], ['كلها وسط', function () { alignAll('center'); }]] });
  const sizes = {}; texts.forEach(function (L) { sizes[Math.round((L.sz || 0.05) * 200)] = 1; });
  if (Object.keys(sizes).length > 3) tips.push({ t: 'في التصميم أحجام خط كثيرة. يكفي حجمان أو ثلاثة: عنوان، ونص، وتفاصيل.', a: [['وحّد الأحجام', function () { unifySizes(); }]] });
  const ys = texts.map(function (L) { return L.y; });
  if (ys.length && Math.max.apply(null, ys) < 0.5) tips.push({ t: 'المحتوى متجمّع في النصف الأعلى، والنصف الأسفل فارغ.', a: [['رتّب تلقائياً', function () { autoStack(); }]] });
  if (!Ls.some(function (L) { return L.t === 'sticker'; }) && !S.bgfx) tips.push({ t: 'التصميم يخلو من لمسة زخرفية من هوية المسار.', a: [['أضف زهرة', function () { addLayer({ t: 'sticker', ref: 'petal', x: 0.15, y: 0.84, w: 0.2, c: S.track.c.p, o: 0.9 }); }], ['أضف نقشاً للخلفية', function () { S.bgfx = { p: 'petals' }; changed(); buildEditor(); }]] });
  if (!tips.length) tips.push({ t: 'التصميم متوازن. يمكنك تجربة ألوان أخرى، أو حفظه قالباً لتستعمله لاحقاً.', a: [] });
  return tips;
}
function alignAll(al) { (S.layers || []).forEach(function (L) { if (L.t === 'text') { L.al = al; if (al === 'center') L.x = 0.5; } }); changed(); buildEditor(); }
function unifySizes() {
  const tx = (S.layers || []).filter(function (L) { return L.t === 'text'; }).sort(function (a, b) { return (b.sz || 0) - (a.sz || 0); });
  tx.forEach(function (L, i) { L.sz = i === 0 ? Math.max(0.08, L.sz || 0.08) : (L.sz || 0.04) >= 0.05 ? 0.05 : 0.035; });
  changed(); buildEditor();
}
// يرتّب النصوص عمودياً بإيقاع ثابت ويوسّطها في المساحة الحرة
function autoStack() {
  const tx = (S.layers || []).filter(function (L) { return L.t === 'text' && LASTG['L:' + L.id]; }).sort(function (a, b) { return a.y - b.y; });
  if (!tx.length) return;
  const sz = SIZES[S.size], gap = 34 * sz.w / 1080;
  const hs = tx.map(function (L) { const b = LASTG['L:' + L.id]; return b.y1 - b.y0; });
  const total = hs.reduce(function (a, b) { return a + b; }, 0) + gap * (tx.length - 1);
  let y = (sz.h - total) / 2;
  tx.forEach(function (L, i) { L.y = (y + hs[i] / 2) / sz.h; y += hs[i] + gap; });
  changed(); buildEditor();
}
let PAL_I = 0;
function buildAssistant(body) {
  body.appendChild(el('h3', { class: 'sh', text: '١. ابدأ بهيكل' }));
  body.appendChild(el('p', { class: 'note', text: 'اختر ترتيباً مبدئياً، ثم غيّر نصوصه وألوانه وعناصره كما تشاء.' }));
  body.appendChild(el('div', { class: 'skels' }, SKELETONS.map(function (sk) {
    const c = el('canvas', { width: 108, height: 135 });
    const g = c.getContext('2d'); g.scale(108 / 1080, 135 / 1350);
    const T = S.track;
    const saveO = OV; OV = {}; paintBg(g, 1080, 1350, sk.bg === 'teal' ? T.c.teal : '#f8f8f8'); OV = saveO;
    sk.make(T).forEach(function (L) { L.id = 'x'; drawLayer(g, 1080, 1350, L, T); });
    return el('button', { type: 'button', class: 'skel', onclick: function () { if ((S.layers || []).length && !confirmInline(this)) return; applySkeleton(sk); } }, [c, el('small', { text: sk.name })]);
  })));
  body.appendChild(el('h3', { class: 'sh', text: '٢. اقتراحات الآن' }));
  const list = el('div', { class: 'tips' });
  assistantTips().forEach(function (tp) {
    list.appendChild(el('div', { class: 'tip1' }, [el('p', { text: tp.t }), el('div', { class: 'sbrow' }, tp.a.map(function (a) { return el('button', { type: 'button', class: 'mini', text: a[0], onclick: a[1] }); }))]));
  });
  body.appendChild(list);
  body.appendChild(el('h3', { class: 'sh', text: '٣. أفكار سريعة' }));
  body.appendChild(el('div', { class: 'sbrow' }, [
    el('button', { type: 'button', class: 'mini', text: 'اقترح ألواناً', onclick: function () { const ps = genPalettes(S.tpl, S.track); const p = ps[PAL_I++ % ps.length]; S.ov = { bg: p.bg, title: p.title, accent: p.accent }; (S.layers || []).forEach(function (L) { if (L.t === 'text') L.c = (L.sz || 0) >= 0.07 ? p.title : (isDark(p.bg) ? '#ffffff' : S.track.c.ink); if (L.t === 'sticker') L.c = p.accent; if (L.t === 'logo') L.c = L.ref === 'track' ? (isDark(p.bg) ? '#ffffff' : 'color') : (isDark(p.bg) ? 'rgba(255,255,255,0.75)' : '#6f6f6f'); }); changed(); buildEditor(); } }),
    el('button', { type: 'button', class: 'mini', text: 'رتّب النصوص', onclick: autoStack }),
    el('button', { type: 'button', class: 'mini', text: 'وحّد المحاذاة', onclick: function () { alignAll('center'); } }),
    el('button', { type: 'button', class: 'mini', text: 'أضف زخرفة', onclick: function () { const ks = ['petal', 'stars2', 'chev', 'sparkle']; addLayer({ t: 'sticker', ref: ks[Math.floor(Math.random() * ks.length)], x: Math.random() < 0.5 ? 0.15 : 0.85, y: 0.82, w: 0.16, c: S.track.c.a }); } })
  ]));
  body.appendChild(el('h3', { class: 'sh', text: '٤. احفظه' }));
  body.appendChild(el('button', { type: 'button', class: 'btn main', onclick: function () { saveAsTemplate(); } }, ['حفظ كقالب لي']));
}

/* ---------- صناعة الإعلان من المعلومات ---------- */
const WIZ_FIELDS = {
  all:    [['kind', 'نوع الفعالية', 'محاضرة'], ['title', 'العنوان', 'إدارة الوقت'], ['sub', 'سطر إضافي', 'لماذا وكيف؟'], ['who', 'المقدّم', 'أ. عبداللطيف'], ['date', 'التاريخ'], ['time', 'الوقت', '9:00 م'], ['place', 'المكان أو المنصة', 'عبر زوم']],
  ann:    [['kind', 'نوع الفعالية', 'ورشة عمل'], ['title', 'العنوان', 'إدارة الوقت'], ['sub', 'سطر إضافي', 'لماذا وكيف؟'], ['who', 'المقدّم', 'أ. عبداللطيف'], ['date', 'التاريخ'], ['time', 'الوقت', '9:00 م'], ['place', 'المكان أو المنصة', 'عبر زوم']],
  daily:  [['kind', 'نوع المقرر', 'محاضرة:'], ['title', 'المقرر', 'أبجديات الثقافة\nالعهد المدني'], ['sub', 'ملاحظة', 'مشاهدة درس وفاة الرسول ﷺ'], ['date', 'التاريخ']],
  comp:   [['kind', 'نوع المسابقة', 'مسابقة حفظ منظومة:'], ['title', 'اسم المسابقة', 'لله من أسمائه تسعونا'], ['sub', 'المدة', 'المدة: 5 أيام'], ['date', 'موعد التسميع']],
  thanks: [['name', 'الاسم', 'عبدالله محمد'], ['sub', 'سطر التمهيد', 'تتقدم إدارة مسار جذور بخالص التهنئة للطالب:'], ['body', 'نص التهنئة', 'وذلك تقديراً لتميّزه في *مسابقة الحفظ*.']],
  quote:  [['title', 'العنوان', 'اليوم يغلق الاختبار'], ['body', 'العبارة', 'أسرع وحُثّ السيرَ جَهدكَ إنّما\nمسراكَ هذا ساعةٌ لزمانِ..'], ['sub', 'سطر إضافي', '']],
  social: [['title', 'العبارة أو العنوان', 'كانت هذه الصحبة *أملي* الأخير..'], ['body', 'نص طويل (للقصة)', 'بسم الله وبعد...'], ['name', 'اسم (للختام)', 'جنى سامح'], ['sub', 'سطر إضافي', 'خريجة إثمار']],
  cover:  [['title', 'العنوان', 'لقاءات مباشرة'], ['sub', 'تحت العنوان', 'جدول الأسبوع الأول'], ['body', 'اللقاءات: كل لقاء في سطر', 'الأربعاء | ديوانية الأربعاء | مجلس ودي | 6:00 م']],
  yt:     [['kind', 'الوسم', 'محاضرة'], ['title', 'العنوان', 'أبجديات الثقافة: العهد المكي'], ['who', 'المقدّم', 'أ. علي حنان'], ['sub', 'سطر إضافي', ''], ['num', 'رقم الحلقة', '3']]
};
function tkOf(I) { if (!I.date) return null; const p = I.date.split('-').map(Number); return dateTokens(new Date(p[0], p[1] - 1, p[2], 12), S.hijriAdj || 0); }
function J() { return Array.from(arguments).filter(has).join(' '); }
const WIZ = {
  ann_circle: function (I, t) { return { top: I.kind, title: I.title, badge: (I.place || '').length <= 12 ? I.place : '', sub: I.sub, h1: t ? t.hd + ' ' + t.hm : '', h2: t ? t.hy + ' هـ' : '', g1: t ? t.gd + ' ' + t.gm : '', g2: t ? t.gy + ' مـ' : '', who: I.who, day: t ? t.wd : '', time: I.time }; },
  ann_clock: function (I, t) { return { chip: I.kind, title: I.title, sub: I.sub, who: I.who, time: I.time, date: t ? t.wd + ' ' + t.gy + '/' + t.gn + '/' + t.gd : '', place: I.place }; },
  ann_panel: function (I, t) { return { title: I.title, who: I.who, time: J(t && t.wd, I.time), place: I.place }; },
  ann_photo: function (I, t) { return { title: I.title, sub: J(I.kind, I.sub), aLabel: t ? t.wd : '', aText: t ? t.gd + ' ' + t.gm + ' ' + t.gy + ' مـ' : '', bLabel: has(I.time) ? 'الساعة' : '', bText: I.time }; },
  ann_title: function (I, t) { return { title: I.title, sub: J(t && t.wd, I.time, I.place) }; },
  daily_cards: function (I, t) { return { cLabel: I.kind, cBody: I.title, cNote: I.sub, day: t ? 'يوم ' + t.wd : '', hn: t ? t.hd : '', hm: t ? t.hm : '', gn: t ? t.gd2 : '', gm: t ? t.gm : '' }; },
  daily_shape: function (I) { return { kicker: I.kind || 'مقرر اليوم', title: I.title }; },
  comp_icons: function (I, t) { return { kicker: I.kind, title: I.title, i1: I.sub, i2: t ? 'موعد التسميع: ' + t.wd : '', d1: t ? t.hd + ' ' + t.hm + ' ' + t.hy + ' هـ' : '', d2: t ? t.gd + ' ' + t.gm + ' ' + t.gy + ' م' : '' }; },
  thanks_cert: function (I) { return { name: I.name || I.title, intro: I.sub, body: I.body }; },
  quote_rays: function (I) { return { title: I.title, body: I.body || I.sub }; },
  quote_photo: function (I) { return { title: I.title, quote: I.body, sub: I.sub }; },
  yt_ring: function (I) { return { kicker: I.kind, title: I.title, who: I.who, num: I.num }; },
  yt_photo: function (I) { return { kicker: I.kind, title: I.title, sub: J(I.sub, I.who) }; }
};
WIZ.comp_photo = WIZ.comp_icons;
Object.assign(WIZ, {
  ann_cards: function (I, t) { return { title: I.title, sub: I.sub, when: J(t && t.wd, I.time), place: I.place, who: I.who }; },
  ann_ribbon: function (I, t) { return { title: I.title, sub: I.sub || I.kind, when: J(t && t.wd, I.time) }; },
  ann_night: function (I, t) { return { kicker: I.kind, title: I.title, sub: J(t && t.wd, I.time, I.place), who: I.who }; },
  ann_door: function (I, t) { return { kicker: I.kind, title: I.title, sub: J(I.sub, t && t.wd, I.time) }; },
  ann_bigword: function (I, t) { return { kicker: I.kind, title: I.title, i1: J(t && t.wd, I.time), i2: I.sub || I.place }; },
  ann_program: function (I, t) { return { title: I.title, head: I.kind, items: I.sub, day: t ? t.wd : '', time: I.time, d1: t ? t.hd + ' ' + t.hm + ' ' + t.hy : '', d2: t ? t.gd + ' ' + t.gm + ' ' + t.gy : '', p1: I.place, p2: '' }; },
  comp_boxes: function (I, t) { return { title: I.title, desc: J(I.kind, I.sub), v1: t ? t.wd + '\n' + t.gd + ' ' + t.gm : '' }; },
  thanks_podium: function (I) { return { name: I.name || I.title, kicker: I.sub, foot: '' }; },
  quote_text: function (I) { return { body: I.body || I.title, src: I.sub }; },
  story_quote: function (I) { return { title: I.title || I.body }; },
  story_cover: function (I) { return { title: I.title }; },
  story_text: function (I) { return { body: I.body || I.title }; },
  story_end: function (I) { return { name: I.name, role: I.sub }; },
  cover_schedule: function (I) { return { title: I.title, sub: I.sub, rows: I.body }; },
  cover_banner: function (I) { return { title: I.title, sub: I.sub }; }
});
let WIZ_STATE = { type: 'ann', I: {} };
function showMake() {
  const T = S.track;
  document.title = 'اصنع إعلانك — ' + T.name;
  const saved = store('jz1.wiz'); if (saved) WIZ_STATE = saved;
  const I = WIZ_STATE.I;
  const chips = el('div', { class: 'chips' }, [['ann', 'إعلان فعالية'], ['daily', 'المقرر اليومي'], ['comp', 'مسابقة'], ['thanks', 'تهنئة وشكر'], ['quote', 'عبارة وتذكير'], ['social', 'مواقع التواصل'], ['cover', 'غلاف وجدول'], ['yt', 'غلاف يوتيوب'], ['all', 'كل الأنواع']].map(function (c) {
    return el('button', { type: 'button', class: 'chip' + (WIZ_STATE.type === c[0] ? ' on' : ''), onclick: function () { WIZ_STATE.type = c[0]; store('jz1.wiz', WIZ_STATE); showMake(); } }, [c[1]]);
  }));
  const form = el('form', { class: 'fields wizf', onsubmit: function (e) { e.preventDefault(); results(); } });
  WIZ_FIELDS[WIZ_STATE.type].forEach(function (f) {
    let inp;
    if (f[0] === 'date') inp = el('input', { type: 'date', id: 'w_date' });
    else if (f[0] === 'title' || f[0] === 'body') inp = el('textarea', { id: 'w_' + f[0], rows: '2', placeholder: f[2] || '' });
    else inp = el('input', { type: 'text', id: 'w_' + f[0], placeholder: f[2] || '', autocomplete: 'off' });
    inp.value = I[f[0]] || '';
    inp.addEventListener('input', function () { I[f[0]] = inp.value; store('jz1.wiz', WIZ_STATE); });
    form.appendChild(el('div', { class: 'fld' }, [el('label', { for: inp.id, text: f[1] }), inp]));
  });
  form.appendChild(el('p', { class: 'note', text: 'اكتب ما تريد أن يظهر فقط، وما تتركه فارغاً لا يظهر في التصاميم. وما تكتبه بين *نجمتين* يظهر بلون مميز.' }));
  form.appendChild(el('button', { type: 'submit', class: 'btn main' }, ['اصنع التصاميم']));
  const out = el('div', { class: 'wizout', id: 'wizout' });
  main(
    navbar([{ t: 'الرئيسية', href: '#/' }, { t: T.full.replace('ـ', ''), href: '#/' + T.id }, { t: 'اصنع إعلانك' }], '#/' + T.id),
    el('div', { class: 'ghead' }, [el('h2', { class: 'h', text: 'اكتب معلوماتك، ونصمّم لك' })]),
    chips,
    el('div', { class: 'wiz' }, [el('div', { class: 'side' }, [form]), out])
  );
  window.scrollTo(0, 0);
  function results() {
    out.innerHTML = '';
    const tk = tkOf(I);
    const tpls = TEMPLATES.filter(function (t) { return !t.hidden && (WIZ_STATE.type === 'all' || t.type === WIZ_STATE.type) && WIZ[t.id]; });
    out.appendChild(el('p', { class: 'note', text: 'اختر التصميم الأقرب إليك، فيُفتح للتعديل بمعلوماتك.' }));
    const grid = el('div', { class: 'gallery' }); out.appendChild(grid);
    let n = 0;
    tpls.forEach(function (tpl) {
      const mapped = WIZ[tpl.id](I, tk);
      const pals = tpl.variants.map(function (v) { return { variant: v.id, ov: {}, name: v.name }; });
      const gp = genPalettes(tpl, T).filter(function (p) { return p.bg !== T.c.paper; }).slice(0, 2);
      gp.forEach(function (p, i) { pals.push({ variant: tpl.variants[0].id, ov: p, name: 'ألوان ' + (i + 1) }); });
      pals.forEach(function (pl) {
        const st0 = loadState(T, tpl);
        const d = Object.assign({}, defaults(tpl, T));
        Object.keys(mapped).forEach(function (k) { if (k in d) d[k] = mapped[k] || ''; });
        const st = { d: d, size: tpl.sizes[0], variant: pl.variant, k: 1, hide: {}, ov: pl.ov, pos: {}, layers: [], bgfx: null };
        const sz = SIZES[tpl.sizes[0]];
        const cv = el('canvas', { width: Math.round(sz.w * 0.3), height: Math.round(sz.h * 0.3) });
        grid.appendChild(el('button', { type: 'button', class: 'tcard', onclick: function () {
          try { localStorage.setItem(skey(T, tpl), JSON.stringify(st)); } catch (e) {}
          location.hash = '#/' + T.id + '/e/' + tpl.id;
        } }, [el('div', { class: 'thumb' }, [cv]), el('div', { class: 'tmeta' }, [el('b', { text: tpl.name }), el('span', { text: pl.name })])]));
        setTimeout(function () { renderTo(cv, tpl, tpl.sizes[0], st, T, 0.3); }, 20 * (n++));
        void st0;
      });
    });
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (Object.keys(I).some(function (k) { return has(I[k]); })) results();
}

/* ---------- قوالبي وعروضي: في حساب المربي على جوجل، أو في هذا المتصفح ---------- */
function meKey() { return USER ? (USER.token.slice(0, 6) === 'local:' ? USER.token.slice(6) : 'u:' + userKey(USER.name)) : 'guest'; }
const STORE = {
  remote: function () { return API.ok === true; },
  probe: function () { return API.probe(); },
  local: function () { return store('jz1.mine') || []; },
  meta: function (x) { return { id: x.id, name: x.name, owner: x.owner, ownerKey: x.ownerKey, shared: !!x.shared, kind: x.kind || 'tpl', tpl: x.tpl, track: x.track, thumb: x.thumb, at: x.at }; },
  list: async function () {
    await API.probe();
    if (STORE.remote()) return JSON.parse(await API.call('api_tpl_list', USER ? USER.token : ''));
    const me = meKey();
    return STORE.local().filter(function (x) { return !x.ownerKey || x.ownerKey === me || x.shared; }).map(STORE.meta);
  },
  get: async function (id) { await API.probe(); if (STORE.remote()) return JSON.parse(await API.call('api_tpl_get', USER ? USER.token : '', id)); return STORE.local().find(function (x) { return x.id === id; }); },
  save: async function (item) {
    await API.probe();
    item.owner = USER ? USER.name : (item.owner || 'زائر'); item.ownerKey = meKey();
    if (STORE.remote()) { if (!USER) throw new Error('ادخل باسمك أولاً ليُحفظ في حسابك.'); return JSON.parse(await API.call('api_tpl_save', USER.token, JSON.stringify(item))); }
    const all = STORE.local().filter(function (x) { return x.id !== item.id; }); all.unshift(item);
    try { localStorage.setItem('jz1.mine', JSON.stringify(all)); }
    catch (e) { throw new Error('ذاكرة المتصفح لا تتسع لهذا (غالباً بسبب صورة مرفوعة كبيرة). سيُحفظ بلا حدود حين يُنشر الموقع على جوجل.'); }
    return item;
  },
  del: async function (id) { await API.probe(); if (STORE.remote()) return API.call('api_tpl_del', USER ? USER.token : '', id); store('jz1.mine', STORE.local().filter(function (x) { return x.id !== id; })); }
};
function thumbOf(tpl, st) {
  const c = document.createElement('canvas'); renderTo(c, tpl, st.size, st, S.track, 0.22); return c.toDataURL('image/jpeg', 0.75);
}
function saveAsTemplate(update) {
  const old = $('.saved'); if (old) old.remove();
  const nameI = el('input', { type: 'text', value: update && S.mineName ? S.mineName : (S.tpl.id === 'blank' ? 'تصميمي' : S.tpl.name + ' — نسختي'), 'aria-label': 'اسم القالب' });
  const shareI = el('input', { type: 'checkbox', checked: !!(update && S.mineShared) });
  const msg = el('p', { class: 'note' });
  const dlg = el('div', { class: 'saved', role: 'dialog', 'aria-label': 'حفظ كقالب' }, [el('div', { class: 'sv' }, [
    el('b', { text: update ? 'تحديث قالبي' : 'حفظ كقالب لي' }),
    el('p', { text: 'يحفظ التصميم كما هو بنصوصه وألوانه وعناصره ومواضعها، فتجده في «قوالبي» وتبدأ منه كل مرة.' }),
    USER ? null : el('p', { class: 'warn', text: 'لم تدخل باسمك، فسيُحفظ في هذا المتصفح فقط. ادخل من أعلى الصفحة ليُحفظ في حسابك.' }),
    el('div', { class: 'fld' }, [el('label', { text: 'اسم القالب' }), nameI]),
    el('label', { class: 'fld tog' }, [shareI, el('i'), el('span', { text: 'شاركه مع الفريق (يظهر لزملائك في «قوالب الفريق»)' })]),
    msg,
    el('div', { class: 'sbrow' }, [
      el('button', { type: 'button', class: 'btn main', text: 'حفظ', onclick: async function () {
        const st = snap();
        const own = S.mine && S.mine.slice(0, 5) !== 'team:';
        const item = { id: update && own ? S.mine : newId() + newId(), kind: 'tpl', name: nameI.value || 'قالبي', shared: shareI.checked, tpl: S.tpl.id, track: S.track.id, st: st, thumb: thumbOf(S.tpl, st), at: Date.now() };
        msg.textContent = 'جارٍ الحفظ…';
        try { await STORE.save(item); S.mine = item.id; S.mineName = item.name; S.mineShared = item.shared; msg.textContent = 'حُفظ. تجده في «قوالبي».'; setTimeout(function () { dlg.remove(); }, 900); }
        catch (e) { msg.textContent = e.message || String(e); }
      } }),
      el('button', { type: 'button', class: 'btn', text: 'إلغاء', onclick: function () { dlg.remove(); } })
    ])
  ])]);
  document.body.appendChild(dlg); nameI.focus(); nameI.select();
}
async function showMine() {
  const T = S.track;
  document.title = 'قوالبي — ' + T.name;
  const mineG = el('div', { class: 'gallery' }, [el('p', { class: 'note', text: 'جارٍ التحميل…' })]), teamG = el('div', { class: 'gallery' });
  await API.probe();
  main(navbar([{ t: 'الرئيسية', href: '#/' }, { t: T.full.replace('ـ', ''), href: '#/' + T.id }, { t: 'قوالبي' }], '#/' + T.id),
    el('div', { class: 'ghead' }, [el('h2', { class: 'h', text: USER ? 'قوالبي يا ' + USER.name : 'قوالبي' })]),
    el('p', { class: 'note', text: STORE.remote() ? (USER ? 'محفوظة في حسابك، تجدها من أي جهاز.' : 'ادخل باسمك من أعلى الصفحة لترى قوالبك.') : 'محفوظة في هذا المتصفح. وحين يُنشر الموقع على جوجل تُحفظ في حسابك فتظهر على كل الأجهزة.' }),
    mineG, el('h2', { class: 'h', text: 'قوالب الفريق' }), el('p', { class: 'note', text: 'قوالب شاركها الزملاء. افتح أياً منها لتبدأ منه، وتعديلك لا يغيّر الأصل.' }), teamG);
  let list = [];
  // كل الهويات تظهر، وقوالب الهوية المفتوحة أولاً
  try { list = (await STORE.list()).filter(function (x) { return x.kind !== 'deck'; }).sort(function (a, b) { return ((b.track === T.id) - (a.track === T.id)) || ((b.at || 0) - (a.at || 0)); }); } catch (e) { mineG.innerHTML = ''; mineG.appendChild(el('p', { class: 'warn', text: 'تعذّر جلب القوالب: ' + (e.message || e) })); return; }
  const me = meKey();
  [[mineG, list.filter(function (x) { return !x.ownerKey || x.ownerKey === me; }), 'لا قوالب محفوظة بعد. افتح أي قالب، ثم اضغط «حفظ كقالب».', true],
   [teamG, list.filter(function (x) { return x.ownerKey && x.ownerKey !== me && x.shared; }), (STORE.remote() && !USER) ? 'ادخل باسمك ورمزك من أعلى الصفحة لترى قوالب الفريق.' : 'لم يشارك أحد قالباً بعد.', false]].forEach(function (g) {
    g[0].innerHTML = '';
    if (!g[1].length) { g[0].appendChild(el('p', { class: 'empty', text: g[2] })); return; }
    g[1].forEach(function (x) {
      const tpl = TEMPLATES.find(function (t) { return t.id === x.tpl; });
      const XT = (x.track && TRACKS[x.track]) ? trackOf(x.track) : T;
      g[0].appendChild(el('div', { class: 'tcard' }, [
        el('a', { href: '#/' + XT.id + '/m/' + x.id, class: 'thumb' }, [el('img', { src: x.thumb || '', alt: x.name }), x.shared ? el('span', { class: 'nbadge shb', text: 'مشارك' }) : null]),
        el('div', { class: 'tmeta' }, [el('b', { text: x.name }), el('span', { text: [XT.id !== T.id ? XT.full.replace('ـ', '') : '', tpl ? tpl.name : '', g[3] ? '' : 'من ' + x.owner].filter(Boolean).join(' · ') }),
          g[3] ? el('button', { type: 'button', class: 'link small', text: 'حذف', onclick: async function () { if (!confirmInline(this)) return; await STORE.del(x.id); showMine(); } }) : null])
      ]));
    });
  });
}
async function openMine(id) {
  const T = S.track;
  const wkey = 'jz1.' + T.id + '.m.' + id;
  let item = null;
  try { item = await STORE.get(id); } catch (e) {}
  if (!item) { location.hash = '#/' + T.id + '/mine'; return; }
  const tpl = TEMPLATES.find(function (t) { return t.id === item.tpl; });
  if (!tpl) { location.hash = '#/' + T.id + '/mine'; return; }
  if (!store(wkey)) { try { localStorage.setItem(wkey, JSON.stringify(item.st)); } catch (e) {} }
  S.mine = (!item.ownerKey || item.ownerKey === meKey()) ? id : 'team:' + id; S.mineName = item.name; S.mineKey = wkey; S.mineShared = !!item.shared;
  showEditor(tpl);
}

/* ---------- استبدال عنصر بما في المكتبة ---------- */
function openReplace(g) {
  const T = S.track, C = T.c, b = LASTG[g]; if (!b) return;
  const old = $('.saved'); if (old) old.remove();
  const isL = g.slice(0, 2) === 'L:', L0 = isL ? layerById(g.slice(2)) : null;
  const sz = SIZES[S.size];
  function apply(nl) {
    if (L0) { L0.t = nl.t; L0.ref = nl.ref; L0.c = nl.c; if (nl.t === 'text') { L0.txt = nl.txt; L0.sz = nl.sz; L0.b = nl.b; L0.al = 'center'; } S.sel = g; }
    else {
      // يُخفى عنصر القالب، ويوضع البديل في مكانه وبحجمه
      S.hide['g_' + g] = true;
      nl.x = (b.x0 + b.x1) / 2 / sz.w; nl.y = (b.y0 + b.y1) / 2 / sz.h;
      nl.w = Math.max(0.05, Math.min(0.9, (b.x1 - b.x0) / sz.w));
      if (nl.t === 'sticker' || nl.t === 'icon') nl.w = Math.max(0.05, Math.min(nl.w, (b.y1 - b.y0) / sz.w * 1.1, 0.5));
      nl.id = newId(); S.layers = (S.layers || []).concat([nl]); S.sel = 'L:' + nl.id;
    }
    dlg.remove(); changed(); buildEditor(true);
  }
  const body = el('div', { class: 'repl' });
  const grp = function (title, items) { body.appendChild(el('h3', { class: 'sh', text: title })); body.appendChild(el('div', { class: 'libgrid' }, items)); };
  grp('رسومات وزخارف', Object.keys(STICKERS).map(function (k) {
    return el('button', { type: 'button', class: 'libit', title: STICKERS[k].name, onclick: function () { apply({ t: 'sticker', ref: k, c: (L0 && L0.c && L0.c !== 'color') ? L0.c : C.p }); } }, [miniCanvas(function (gx, s) { STICKERS[k].draw(gx, s, C.p); })]);
  }));
  grp('أيقونات', ICON_LIST.map(function (k) {
    return el('button', { type: 'button', class: 'libit', onclick: function () { apply({ t: 'icon', ref: k, c: (L0 && L0.c && L0.c !== 'color') ? L0.c : C.s }); } }, [miniCanvas(function (gx, s) { ICONS[k](gx, s * 0.8, C.s); })]);
  }));
  grp('شعارات', LOGO_LIST.map(function (q) {
    const bt = el('button', { type: 'button', class: 'libit wide', title: q[1], onclick: function () { apply({ t: 'logo', ref: q[0], c: q[0] === 'track' ? 'color' : '#4a4a4a' }); } });
    if (q[0] === 'track') bt.style.backgroundImage = 'url(' + ASSETS[T.logo] + ')'; else bt.appendChild(document.createTextNode(q[1]));
    return bt;
  }));
  const file = el('input', { type: 'file', accept: '.jpg,.jpeg,.png,.webp', hidden: true, onchange: function (e) { const fl = e.target.files[0]; if (fl) readImage(fl, function (src) { apply({ t: 'img', ref: src }); }); } });
  grp('صور', DATE_LIB.map(function (n) {
    const bt = el('button', { type: 'button', class: 'libit photo', title: LIB_NAMES[n], onclick: function () { apply({ t: 'img', ref: 'lib:' + n }); } });
    bt.style.backgroundImage = 'url(' + ASSETS[n] + ')'; return bt;
  }).concat([el('button', { type: 'button', class: 'libit up', onclick: function () { file.click(); } }, ['رفع']), file]));
  grp('نص', [el('button', { type: 'button', class: 'libtxt', onclick: function () { apply({ t: 'text', txt: 'نص جديد', sz: 0.05, b: 0.6, c: '' }); } }, ['نص حر'])]);
  const dlg = el('div', { class: 'saved', role: 'dialog', 'aria-label': 'استبدال' }, [el('div', { class: 'sv wide' }, [
    el('div', { class: 'sbh' }, [el('b', { text: 'استبدال «' + gName(g) + '»' }), el('button', { type: 'button', class: 'x', text: '×', 'aria-label': 'إغلاق', onclick: function () { dlg.remove(); } })]),
    el('p', { text: isL ? 'اختر البديل، فيحلّ في المكان نفسه وبالحجم نفسه.' : 'يُخفى عنصر القالب، ويوضع البديل في مكانه. وتعيد الأصل من تبويب «العناصر».' }),
    body
  ])]);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.remove(); });
  document.body.appendChild(dlg);
}
