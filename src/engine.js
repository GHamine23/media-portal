/* ================= المحرّك: أدوات الرسم المشتركة لكل القوالب ================= */
const FALLBACK = '"Segoe UI", Tahoma, Arial, sans-serif';
const IMG = {};            // الصور المحمّلة
const TINT = {};           // نسخ ملوّنة من الأقنعة

/* الخطوط: لكل خط أوزانه. l خفيف، r عادي، m متوسط، b عريض، k أعرض.
   الخط الذي له وزن واحد يُعرَّض برسم حدّ حول الحروف (fake) */
const FONTS = {
  tajarib: { name: 'تجارب', w: { l: 'tj_l', r: 'tj_r', m: 'tj_m', b: 'tj_b', k: 'tj_k' } },
  handi:   { name: 'الحرف اليدوية', fake: true, w: { l: 'hc_m', r: 'hc_m', m: 'hc_m', b: 'hc_m', k: 'hc_m' } }
};
const WEIGHTS = [['l', 'خفيف'], ['r', 'عادي'], ['m', 'متوسط'], ['b', 'عريض'], ['k', 'أعرض']];
/* الإعدادات الحالية للرسم، تضبطها الواجهة قبل كل رسم */
const FS = { title: 'tajarib', body: 'tajarib', tw: '' };   // tw: وزن العنوان إن اختاره المستخدم
let HIDE = {};             // العناصر المخفية: logo, academy, social, deco
let OV = {};               // ألوان يختارها المستخدم: bg, title, accent
let BOXES = null;          // للفحص الآلي فقط: مواضع النصوص المرسومة
let HLC = '';              // لون التمييز الافتراضي لما بين *نجمتين*
let BGFX = null;           // خلفية من المكتبة: {p: نقش, img: صورة}
/* المجموعات: كل قسم من التصميم مجموعة يمكن تحريكها. OFF إزاحاتها، GBOX حدودها بعد الرسم */
let OFF = {}, GBOX = null, CUR_G = null, CUR_O = null, GHIDE = {};
const FAR = { dx: -100000, dy: -100000 };
function G(ctx, name) {
  if (CUR_G) ctx.restore();
  CUR_G = name || null; CUR_O = null;
  if (CUR_G) {
    ctx.save();
    if (GHIDE[CUR_G]) { ctx.translate(FAR.dx, FAR.dy); CUR_O = FAR; return; }   // عنصر أُخفي أو استُبدل
    const o = OFF[CUR_G]; if (o && (o.dx || o.dy)) { ctx.translate(o.dx || 0, o.dy || 0); CUR_O = o; }
  }
}

function wkOf(bold) { return !bold ? 'r' : bold <= 0.45 ? 'm' : bold <= 0.92 ? 'b' : 'k'; }
// الخط والوزن والحدّ لنص معيّن
function fontOf(role, bold) {
  const set = FONTS[FS[role === 'title' ? 'title' : 'body']] || FONTS.tajarib;
  let wk = wkOf(bold);
  if (role === 'title' && FS.tw) wk = FS.tw;
  const fake = set.fake ? ({ l: 0, r: 0, m: 0.25, b: 0.6, k: 1 }[wk]) : 0;
  return { fam: set.w[wk] || set.w.r, stroke: fake };
}
function F(size, fam) { return Math.round(size * 10) / 10 + 'px "' + (fam || 'tj_r') + '", ' + FALLBACK; }

function loadImg(src) {
  return new Promise(function (ok) {
    const i = new Image();
    i.onload = function () { ok(i); };
    i.onerror = function () { ok(null); };
    i.src = src;
  });
}

async function loadAssets() {
  const fk = Object.keys(ASSETS).filter(function (k) { return /^(tj|hc)_/.test(k); });
  await Promise.all(fk.map(async function (k) {
    try { const ff = new FontFace(k, 'url(' + ASSETS[k] + ')'); await ff.load(); document.fonts.add(ff); }
    catch (e) { console.warn('font', k, e); }
  }));
  const keys = Object.keys(ASSETS).filter(function (k) { return fk.indexOf(k) < 0; });
  await Promise.all(keys.map(async function (k) { IMG[k] = await loadImg(ASSETS[k]); }));
}

// قناع أبيض يُلوَّن بأي لون
function tinted(key, color) {
  const id = key + '|' + color;
  if (TINT[id]) return TINT[id];
  const im = IMG[key]; if (!im) return null;
  const c = document.createElement('canvas');
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  const g = c.getContext('2d');
  g.drawImage(im, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  TINT[id] = c; return c;
}
function srcW(s) { return s.naturalWidth || s.width; }
function srcH(s) { return s.naturalHeight || s.height; }

function area(x0, y0, x1, y1) { box('area', x0, y0, x1, y1, 'area'); }
function quiet(fn) { const s = BOXES, g = GBOX; BOXES = null; GBOX = null; try { fn(); } finally { BOXES = s; GBOX = g; } }
function box(kind, x0, y0, x1, y1, t) {
  const dx = CUR_O ? CUR_O.dx || 0 : 0, dy = CUR_O ? CUR_O.dy || 0 : 0;
  const b = { k: kind, x0: Math.min(x0, x1) + dx, y0: Math.min(y0, y1) + dy, x1: Math.max(x0, x1) + dx, y1: Math.max(y0, y1) + dy, t: t || '', g: CUR_G };
  if (BOXES) BOXES.push(b);
  if (GBOX && CUR_G) { const r = GBOX[CUR_G]; if (!r) GBOX[CUR_G] = { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 }; else { r.x0 = Math.min(r.x0, b.x0); r.y0 = Math.min(r.y0, b.y0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); } }
}

// رسم صورة بعرض معيّن من نقطة إرساء: anchor = 'tr' | 'tl' | 'br' | 'bl' | 'c' | 'tc' | 'bc'
function placeImg(ctx, src, x, y, w, anchor, kind) {
  if (!src) return { x: x, y: y, w: 0, h: 0 };
  const h = w * srcH(src) / srcW(src);
  let dx = x, dy = y;
  if (/r/.test(anchor)) dx = x - w;
  if (/c/.test(anchor) && !/[rl]/.test(anchor)) dx = x - w / 2;
  if (anchor === 'c') dy = y - h / 2;
  if (/b/.test(anchor)) dy = y - h;
  ctx.drawImage(src, dx, dy, w, h);
  if (kind) box(kind, dx, dy, dx + w, dy + h, kind);
  return { x: dx, y: dy, w: w, h: h };
}

// شعار المسار: color = الأصل، أو أي لون للنسخة أحادية اللون
function drawLogo(ctx, T, x, y, w, mode, anchor) {
  if (HIDE.logo) return { x: x, y: y, w: 0, h: 0 };
  const src = mode === 'color' ? IMG[T.logo] : tinted(T.logo, mode);
  if (src) { const ar = srcW(src) / srcH(src); w = Math.min(w, w * 0.62 * ar); }   // الشعار الطويل يأخذ ارتفاعاً معقولاً
  return placeImg(ctx, src, x, y, w, anchor || 'tr', 'logo');
}
function academy(ctx, color, x, y, w, anchor) { if (HIDE.academy) return { w: 0, h: 0 }; return placeImg(ctx, tinted('academy', color), x, y, w, anchor, 'academy'); }
function social(ctx, color, x, y, w, anchor) { if (HIDE.social) return { w: 0, h: 0 }; return placeImg(ctx, tinted('social', color), x, y, w, anchor, 'social'); }

/* ---------- النصوص ---------- */
function setF(ctx, size, fam) { ctx.font = F(size, fam); ctx.direction = 'rtl'; ctx.textBaseline = 'middle'; }

// يقسم النص إلى كلمات، وما بين *نجمتين* يُلوَّن بلون التمييز. الكلمة قد تكون قطعاً ملتصقة مختلفة اللون
function tokens(str) {
  return String(str == null ? '' : str).split('\n').map(function (line) {
    const words = []; let hl = false, glue = false;
    line.split('*').forEach(function (part, i) {
      if (i > 0) hl = !hl;
      const pieces = part.split(/(\s+)/);
      pieces.forEach(function (w) {
        if (!w) return;
        if (/^\s+$/.test(w)) { glue = false; return; }
        if (glue && words.length) words[words.length - 1].push({ t: w, hl: hl });
        else words.push([{ t: w, hl: hl }]);
        glue = true;
      });
    });
    return words;
  });
}

function runsOf(words) {
  const runs = [];
  words.forEach(function (w) {
    w.forEach(function (seg, j) {
      const last = runs[runs.length - 1];
      if (last && last.hl === seg.hl) last.t += (j ? '' : ' ') + seg.t;
      else runs.push({ t: seg.t, hl: seg.hl, sp: runs.length > 0 && j === 0 });
    });
  });
  return runs;
}
function lineWidth(ctx, words) {
  const sp = ctx.measureText(' ').width;
  let w = 0;
  runsOf(words).forEach(function (r) { w += ctx.measureText(r.t).width + (r.sp ? sp : 0); });
  return w;
}

function wrapWords(ctx, words, maxW) {
  const lines = []; let cur = [];
  words.forEach(function (w) {
    const test = cur.concat([w]);
    if (cur.length && lineWidth(ctx, test) > maxW) { lines.push(cur); cur = [w]; }
    else cur = test;
  });
  if (cur.length || !lines.length) lines.push(cur);
  return lines;
}

function layoutAt(ctx, paras, size, maxW, balance, fam) {
  setF(ctx, size, fam);
  let lines = [];
  paras.forEach(function (p) { lines = lines.concat(wrapWords(ctx, p, maxW)); });
  if (balance && lines.length > 1) {
    const n = lines.length; let lo = maxW * 0.45, hi = maxW;
    for (let k = 0; k < 12; k++) {
      const mid = (lo + hi) / 2; let c = 0;
      paras.forEach(function (p) { c += wrapWords(ctx, p, mid).length; });
      if (c > n) lo = mid; else hi = mid;
    }
    lines = []; paras.forEach(function (p) { lines = lines.concat(wrapWords(ctx, p, hi)); });
  }
  return lines.map(function (l) { return { words: l, w: lineWidth(ctx, l) }; });
}

// تباعد الأسطر: يُوسَّع إن كانت ذيول سطر تلامس رؤوس السطر الذي تحته
function needLh(ctx, lines, size, lh) {
  if (lines.length < 2) return lh;
  const txt = function (l) { return runsOf(l.words).map(function (r) { return r.t; }).join(' '); };
  let need = lh;
  for (let i = 0; i < lines.length - 1; i++) {
    const a = ctx.measureText(txt(lines[i])), b = ctx.measureText(txt(lines[i + 1]));
    const gap = (a.actualBoundingBoxDescent || 0) + (b.actualBoundingBoxAscent || 0) + size * 0.08;
    need = Math.max(need, gap / size);
  }
  return Math.min(need, lh * 1.45);
}

/* يقيس نصاً ويصغّره حتى يتسع: o = {maxW, maxH, size, min, lh, maxLines, balance, bold, title} */
function fit(ctx, str, o) {
  const paras = tokens(str);
  const fo = fontOf(o.title ? 'title' : 'body', o.bold || 0);
  const lh0 = o.lh || 1.3, min = o.min || o.size * 0.4, maxLines = o.maxLines || 99;
  let size = o.size, lines, lh = lh0;
  for (let guard = 0; guard < 60; guard++) {
    lines = layoutAt(ctx, paras, size, o.maxW, o.balance, fo.fam);
    lh = needLh(ctx, lines, size, lh0);
    const widest = Math.max.apply(null, lines.map(function (l) { return l.w; }).concat([0]));
    const h = lines.length * size * lh;
    if ((widest <= o.maxW + 0.5 && lines.length <= maxLines && (!o.maxH || h <= o.maxH)) || size <= min) break;
    size *= 0.95;
  }
  const empty = !String(str || '').trim();
  const widest = Math.max.apply(null, lines.map(function (l) { return l.w; }).concat([0]));
  // ما يتجاوز صندوق السطر من رؤوس الحروف وذيولها، فيُحسب في الارتفاع ولا يلامس ما حوله
  let pt = 0, pb = 0;
  if (!empty) {
    setF(ctx, size, fo.fam);
    const txt = function (l) { return runsOf(l.words).map(function (r) { return r.t; }).join(' '); };
    const half = size * lh / 2, m1 = ctx.measureText(txt(lines[0])), m2 = ctx.measureText(txt(lines[lines.length - 1]));
    pt = Math.max(0, (m1.actualBoundingBoxAscent || 0) - half) + size * 0.04;
    pb = Math.max(0, (m2.actualBoundingBoxDescent || 0) - half) + size * 0.04;
  }
  return { size: size, lines: lines, lh: lh, h: empty ? 0 : lines.length * size * lh + pt + pb, pt: pt, pb: pb, w: widest, empty: empty, fam: fo.fam, stroke: fo.stroke };
}

/* يرسم نتيجة fit. x: الحافة اليمنى (align=right) أو الوسط (center) أو اليسرى (left). y: أعلى الكتلة */
function drawFit(ctx, f, x, y, o) {
  if (f.empty) return y;
  o = o || {};
  setF(ctx, f.size, f.fam);
  const sp = ctx.measureText(' ').width;
  f.lines.forEach(function (l, i) {
    const yc = y + f.pt + f.size * f.lh * (i + 0.5) + (o.dy || 0) * f.size;
    let xr = x;
    if (o.align === 'center') xr = x + l.w / 2;
    else if (o.align === 'left') xr = x + l.w;
    if (BOXES || GBOX) { const tx = runsOf(l.words).map(function (r) { return r.t; }).join(' '), m = ctx.measureText(tx);
      box('text', xr - l.w, yc - (m.actualBoundingBoxAscent || f.size * 0.5), xr, yc + (m.actualBoundingBoxDescent || f.size * 0.5), tx); }
    ctx.textAlign = 'right';
    runsOf(l.words).forEach(function (r) {
      if (r.sp) xr -= sp;
      const col = r.hl ? (o.hl || hlFor(o.color)) : o.color;
      ctx.fillStyle = col;
      if (f.stroke) { ctx.strokeStyle = col; ctx.lineWidth = f.size * 0.045 * f.stroke; ctx.lineJoin = 'round'; ctx.strokeText(r.t, xr, yc); }
      ctx.fillText(r.t, xr, yc);
      xr -= ctx.measureText(r.t).width;
    });
  });
  return y + f.h;
}

// نص في سطر واحد يُصغَّر إن طال
function line(ctx, str, x, y, o) {
  const f = fit(ctx, str, { maxW: o.maxW || 4000, size: o.size, min: o.min || o.size * 0.5, lh: o.lh || 1.25, maxLines: 1, bold: o.bold, title: o.title });
  drawFit(ctx, f, x, y - f.pt - f.size * f.lh / 2, o);
  return f;
}
function textW(ctx, str, size, bold, title) {
  if (!has(str)) return 0;
  const fo = fontOf(title ? 'title' : 'body', bold || 0);
  setF(ctx, size, fo.fam);
  return lineWidth(ctx, tokens(str)[0] || []);
}

/* نص على قوس دائرة، مع حفظ اتصال الحروف العربية: يُرسم النص كاملاً ثم يُوزَّع شرائح على القوس */
function arcText(ctx, str, cx, cy, r, ang, size, color, flip) {
  str = String(str || '').replace(/\*/g, '').trim(); if (!str) return;
  const fam = fontOf('body', 0).fam;
  const c = document.createElement('canvas'), g = c.getContext('2d');
  const sc = 2; setF(g, size * sc, fam);
  const w = Math.ceil(g.measureText(str).width) + 8, h = Math.ceil(size * sc * 1.8);
  c.width = w; c.height = h; setF(g, size * sc, fam);
  g.textAlign = 'center'; g.fillStyle = color; g.fillText(str, w / 2, h / 2);
  const step = 3;
  for (let x = 0; x < w; x += step) {
    const s = (x + step / 2 - w / 2) / sc;
    const th = flip ? ang - s / r : ang + s / r;
    ctx.save();
    ctx.translate(cx + r * Math.cos(th), cy + r * Math.sin(th));
    ctx.rotate(flip ? th - Math.PI / 2 : th + Math.PI / 2);
    ctx.drawImage(c, x, 0, step, h, -step / sc / 2 - 0.25, -h / sc / 2, step / sc + 0.5, h / sc);
    ctx.restore();
  }
}
function arcSpan(ctx, str, size, r) { return has(str) ? textW(ctx, str, size) / r : 0; }

/* ---------- أشكال ---------- */
function rrect(ctx, x, y, w, h, r) {
  const rr = typeof r === 'number' ? [r, r, r, r] : r; // [tl,tr,br,bl]
  ctx.beginPath();
  ctx.moveTo(x + rr[0], y);
  ctx.lineTo(x + w - rr[1], y); ctx.quadraticCurveTo(x + w, y, x + w, y + rr[1]);
  ctx.lineTo(x + w, y + h - rr[2]); ctx.quadraticCurveTo(x + w, y + h, x + w - rr[2], y + h);
  ctx.lineTo(x + rr[3], y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - rr[3]);
  ctx.lineTo(x, y + rr[0]); ctx.quadraticCurveTo(x, y, x + rr[0], y);
  ctx.closePath();
}
function fillRR(ctx, x, y, w, h, r, color) { rrect(ctx, x, y, w, h, r); ctx.fillStyle = color; ctx.fill(); }

// الزهرة رباعية البتلات (من هوية جذور)
function petal(ctx, cx, cy, r, rot, color) {
  box('deco', cx - r * 0.85, cy - r * 0.85, cx + r * 0.85, cy + r * 0.85, 'petal');
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot || 0); ctx.fillStyle = color;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(r * 0.06, 0);
    ctx.bezierCurveTo(r * 0.28, -r * 0.5, r * 0.78, -r * 0.42, r, 0);
    ctx.bezierCurveTo(r * 0.72, r * 0.22, r * 0.36, r * 0.24, r * 0.06, 0);
    ctx.fill();
    ctx.rotate(Math.PI / 2);
  }
  ctx.restore();
}

// علامتا « أو » ، dir = 1 تشير لليسار، -1 لليمين
function chevrons(ctx, x, y, s, color, dir, color2) {
  box('deco', x - (dir === -1 ? s * 0.97 : 0), y - s * 0.42, x + (dir === -1 ? 0 : s * 0.97), y + s * 0.42, 'chev');
  ctx.save(); ctx.translate(x, y); ctx.scale(dir || 1, 1);
  ctx.lineWidth = s * 0.26; ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
  [0, 1].forEach(function (i) {
    ctx.strokeStyle = i && color2 ? color2 : color;
    const ox = i * s * 0.55;
    ctx.beginPath(); ctx.moveTo(ox + s * 0.42, -s * 0.42); ctx.lineTo(ox, 0); ctx.lineTo(ox + s * 0.42, s * 0.42); ctx.stroke();
  });
  ctx.restore();
}

function star(ctx, cx, cy, r, color, rot) {
  box('deco', cx - r, cy - r, cx + r, cy + r, 'star');
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot || 0);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r, a = -Math.PI / 2 + i * Math.PI / 5;
    ctx[i ? 'lineTo' : 'moveTo'](rr * Math.cos(a), rr * Math.sin(a));
  }
  ctx.closePath(); ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineJoin = 'round'; ctx.lineWidth = r * 0.22;
  ctx.fill(); ctx.stroke(); ctx.restore();
}
function sparkle(ctx, cx, cy, r, color) {
  ctx.beginPath(); ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy); ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy); ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fillStyle = color; ctx.fill();
}

/* ---------- أيقونات صغيرة (تُرسم بأي لون) ---------- */
const ICONS = {
  moon: function (ctx, s, c) {
    ctx.save(); ctx.beginPath(); ctx.rect(-s, -s, 2 * s, 2 * s);
    ctx.arc(s * 0.2, -s * 0.18, s * 0.36, 0, Math.PI * 2, true); ctx.clip('evenodd');
    ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); ctx.restore();
  },
  layers: function (ctx, s, c) {
    ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = s * 0.1; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0, -s * 0.46); ctx.lineTo(s * 0.48, -s * 0.2); ctx.lineTo(0, s * 0.06); ctx.lineTo(-s * 0.48, -s * 0.2); ctx.closePath(); ctx.fill();
    [0.12, 0.32].forEach(function (dy) {
      ctx.beginPath(); ctx.moveTo(-s * 0.48, dy * s - s * 0.06); ctx.lineTo(0, dy * s + s * 0.2); ctx.lineTo(s * 0.48, dy * s - s * 0.06); ctx.stroke();
    });
  },
  mic: function (ctx, s, c) {
    ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = s * 0.09; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2); ctx.fill();
    [0.27, 0.43].forEach(function (r) {
      ctx.beginPath(); ctx.arc(0, 0, s * r, Math.PI * 0.72, Math.PI * 2.28); ctx.stroke();
    });
    ctx.beginPath(); ctx.moveTo(0, s * 0.12); ctx.lineTo(0, s * 0.48); ctx.stroke();
  },
  clock: function (ctx, s, c) {
    ctx.strokeStyle = c; ctx.lineWidth = s * 0.1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, s * 0.44, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -s * 0.24); ctx.lineTo(0, 0); ctx.lineTo(s * 0.17, s * 0.1); ctx.stroke();
  },
  cal: function (ctx, s, c) {
    ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = s * 0.09;
    rrect(ctx, -s * 0.44, -s * 0.36, s * 0.88, s * 0.8, s * 0.1); ctx.stroke();
    ctx.fillRect(-s * 0.44, -s * 0.36, s * 0.88, s * 0.18);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) ctx.fillRect(-s * 0.27 + k * s * 0.2, -s * 0.02 + r * s * 0.2, s * 0.12, s * 0.1);
  },
  pin: function (ctx, s, c) {
    ctx.fillStyle = c; ctx.beginPath();
    ctx.arc(0, -s * 0.12, s * 0.32, Math.PI * 0.82, Math.PI * 2.18); ctx.lineTo(0, s * 0.48); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(0, -s * 0.12, s * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  },
  star: function (ctx, s, c) { star(ctx, 0, 0, s * 0.42, c); },
  link: function (ctx, s, c) {
    ctx.strokeStyle = c; ctx.lineWidth = s * 0.12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-s * 0.28, s * 0.28); ctx.lineTo(s * 0.28, -s * 0.28); ctx.moveTo(-s * 0.05, -s * 0.28); ctx.lineTo(s * 0.28, -s * 0.28); ctx.lineTo(s * 0.28, s * 0.05); ctx.stroke();
  },
  down: function (ctx, s, c) {
    ctx.save(); ctx.rotate(-Math.PI / 2); chevrons(ctx, -s * 0.36, 0, s * 0.42, c, 1); ctx.restore();
  },
  up: function (ctx, s, c) {
    ctx.save(); ctx.rotate(Math.PI / 2); chevrons(ctx, -s * 0.36, 0, s * 0.42, c, 1); ctx.restore();
  },
  ring: function (ctx, s, c) {
    ctx.strokeStyle = c; ctx.lineWidth = s * 0.16;
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.42, s * 0.2, -0.2, 0, Math.PI * 2); ctx.stroke();
  },
  book: function (ctx, s, c) {
    ctx.fillStyle = c; ctx.beginPath();
    ctx.moveTo(0, -s * 0.2); ctx.quadraticCurveTo(-s * 0.25, -s * 0.38, -s * 0.48, -s * 0.3); ctx.lineTo(-s * 0.48, s * 0.32);
    ctx.quadraticCurveTo(-s * 0.25, s * 0.24, 0, s * 0.4); ctx.quadraticCurveTo(s * 0.25, s * 0.24, s * 0.48, s * 0.32);
    ctx.lineTo(s * 0.48, -s * 0.3); ctx.quadraticCurveTo(s * 0.25, -s * 0.38, 0, -s * 0.2); ctx.fill();
  },
  none: function () {}
};
function icon(ctx, name, cx, cy, s, color) {
  if (name && name !== 'none') box('icon', cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2, name);
  ctx.save(); ctx.translate(cx, cy); (ICONS[name] || ICONS.none)(ctx, s, color); ctx.restore();
}

/* سطر معلومات: أيقونة على اليمين ثم النص. يعيد عرضه الكلي */
function infoItem(ctx, ic, str, x, y, o) {
  if (!String(str || '').trim()) return 0;
  const s = o.size, gap = s * 0.45, isz = s * (o.iconScale || 1.15);
  let xr = x;
  if (ic && ic !== 'none') { icon(ctx, ic, xr - isz / 2, y, isz, o.iconColor || o.color); xr -= isz + gap; }
  const f = line(ctx, str, xr, y, { size: s, color: o.color, hl: o.hl, align: 'right', bold: o.bold, maxW: o.maxW ? o.maxW - (x - xr) : 4000 });
  return x - xr + f.w;
}
function infoW(ctx, ic, str, o) {
  if (!String(str || '').trim()) return 0;
  const s = o.size, isz = s * (o.iconScale || 1.15);
  return (ic && ic !== 'none' ? isz + s * 0.45 : 0) + textW(ctx, str, s, o.bold);
}

/* ---------- الصور التي يرفعها المستخدم ---------- */
// fit: cover يملأ الإطار، contain يحتويه. z تكبير، ox/oy إزاحة بين -1 و1
function drawPhoto(ctx, im, x, y, w, h, o) {
  if (!im) return;
  box('photo', x, y, x + w, y + h, 'photo');
  o = o || {};
  const iw = srcW(im), ih = srcH(im);
  let sc = o.fit === 'contain' ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih);
  sc *= (o.z || 1);
  const dw = iw * sc, dh = ih * sc;
  const dx = x + (w - dw) / 2 + (o.ox || 0) * w * 0.5;
  const dy = y + (h - dh) / 2 + (o.oy || 0) * h * 0.5;
  if (o.feather) {
    const c = document.createElement('canvas');
    const k = Math.min(1, 1600 / Math.max(w, h));
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    const g = c.getContext('2d'); g.scale(k, k);
    g.drawImage(im, dx - x, dy - y, dw, dh);
    g.globalCompositeOperation = 'destination-in';
    const fe = o.feather;
    const lg = g.createLinearGradient(0, 0, 0, h);
    lg.addColorStop(0, fe.top ? 'rgba(0,0,0,0)' : '#000'); lg.addColorStop(fe.top || 0.001, '#000');
    lg.addColorStop(1 - (fe.bottom || 0.001), '#000'); lg.addColorStop(1, fe.bottom ? 'rgba(0,0,0,0)' : '#000');
    g.fillStyle = lg; g.fillRect(0, 0, w, h);
    if (fe.side) {
      const sg = g.createLinearGradient(0, 0, w, 0);
      sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(fe.side, '#000'); sg.addColorStop(1 - fe.side, '#000'); sg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = sg; g.fillRect(0, 0, w, h);
    }
    ctx.drawImage(c, x, y, w, h);
    return;
  }
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.drawImage(im, dx, dy, dw, dh); ctx.restore();
}

// شعار الأكاديمية وحسابات التواصل في أسفل التصميم
function footer(ctx, W, H, T, o) {
  o = o || {};
  const y = o.y != null ? o.y : H - 70 * (W / 1080);
  const k = (o.scale || 1) * W / 1080;
  const col = o.color || T.c.muted;
  if (o.academy !== false) academy(ctx, o.acColor || col, W - (o.mx || 60) * k, y, 132 * k, 'tr');
  if (o.social !== false) social(ctx, col, (o.mx || 60) * k, y + 3 * k, 128 * k, 'tl');
}

function lighten(hex, a) { // a بين -1 و1
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = a < 0 ? 0 : 255, p = Math.abs(a);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function alpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}
function bg(ctx, W, H, color) { ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); }
function vline(ctx, x, y1, y2, color, w) { ctx.strokeStyle = color; ctx.lineWidth = w || 2; ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke(); }
function hline(ctx, x1, x2, y, color, w) { ctx.strokeStyle = color; ctx.lineWidth = w || 2; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); }
function has(v) { return !!String(v == null ? '' : v).trim(); }

// لون نص مقروء فوق خلفية
function lum(hex) { const n = parseInt(String(hex).slice(1, 7), 16); const f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255); }
function isDark(hex) { return /^#[0-9a-f]{6}/i.test(hex) ? lum(hex) < 0.36 : true; }
function onBg(hex, dark, light) { return isDark(hex) ? (light || '#ffffff') : (dark || '#2b2b2b'); }

// لون التمييز الافتراضي: أصفر على النص الفاتح، وبرتقالي على النص الداكن
function hlFor(color) {
  if (HLC) return HLC;
  const c = String(color || '');
  const light = /^#/.test(c) ? !isDark(c.slice(0, 7)) : /255,\s*255,\s*255/.test(c);
  return light ? (CUR_T ? CUR_T.c.a : '#fbb03b') : (CUR_T ? CUR_T.c.a2 : '#f99229');
}
let CUR_T = null;

/* ---------- الخلفيات ---------- */
const BG_PATTERNS = [
  ['plain', 'سادة'], ['grad', 'تدرّج'], ['dots', 'دوائر'], ['grid', 'شبكة'], ['rays', 'أشعة'],
  ['streaks', 'إضاءة'], ['petals', 'زهور'], ['waves', 'أمواج'], ['ring', 'حلقات'], ['photo', 'صورة']
];
// يرسم الخلفية الأساسية للقالب، ومعها النقش الذي اختاره المستخدم من المكتبة
function paintBg(ctx, W, H, base) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
  if (!BGFX || !BGFX.p || BGFX.p === 'plain') return;
  const dark = isDark(base), ink = dark ? '#ffffff' : '#000000', u = W / 1080, p = BGFX.p;
  const save = BOXES, g = GBOX; BOXES = null; GBOX = null;
  ctx.save();
  if (p === 'grad') {
    const gr = ctx.createLinearGradient(0, 0, W * 0.3, H);
    gr.addColorStop(0, lighten(base, dark ? 0.12 : 0.5)); gr.addColorStop(1, lighten(base, dark ? -0.35 : -0.08));
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  } else if (p === 'dots') {
    ctx.fillStyle = alpha(ink, 0.05);
    for (let y = 60 * u; y < H; y += 110 * u) for (let x = 60 * u; x < W; x += 110 * u) { ctx.beginPath(); ctx.arc(x, y, 34 * u, 0, Math.PI * 2); ctx.fill(); }
  } else if (p === 'grid') {
    ctx.strokeStyle = alpha(ink, 0.06); ctx.lineWidth = 2 * u;
    for (let x = 0; x < W; x += 90 * u) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 90 * u) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  } else if (p === 'rays') {
    const ox = W * 0.05, oy = H * 0.98;
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + i * Math.PI / 16; ctx.strokeStyle = alpha(ink, 0.04 + i * 0.008); ctx.lineWidth = 16 * u; ctx.beginPath(); ctx.moveTo(ox + 120 * u * Math.cos(a), oy + 120 * u * Math.sin(a)); ctx.lineTo(ox + W * 2 * Math.cos(a), oy + W * 2 * Math.sin(a)); ctx.stroke(); }
  } else if (p === 'streaks') {
    lightStreaks(ctx, W, H, dark ? 0.1 : 0.55);
  } else if (p === 'petals') {
    [[0.12, 0.1, 0.16, 0.3], [0.9, 0.3, 0.1, 1.1], [0.2, 0.72, 0.11, 0.7], [0.85, 0.88, 0.2, 0.2], [0.55, 0.05, 0.07, 0.9]].forEach(function (q) { petal(ctx, W * q[0], H * q[1], W * q[2], q[3], alpha(ink, 0.05)); });
  } else if (p === 'waves') {
    ctx.strokeStyle = alpha(ink, 0.06); ctx.lineWidth = 3 * u;
    for (let k = 0; k < 14; k++) { const y0 = H * 0.55 + k * 34 * u; ctx.beginPath(); for (let x = 0; x <= W; x += 20 * u) { const y = y0 + Math.sin(x / W * Math.PI * 2 + k * 0.35) * 40 * u; if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); }
  } else if (p === 'ring') {
    ctx.strokeStyle = alpha(ink, 0.07); ctx.lineWidth = 3 * u;
    for (let r = 120; r < 1400; r += 90) { ctx.beginPath(); ctx.arc(W * 0.92, H * 0.08, r * u, 0, Math.PI * 2); ctx.stroke(); }
  } else if (p === 'photo' && BGFX.im) {
    drawPhoto(ctx, BGFX.im, 0, 0, W, H, {});
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = lighten(base, 0.25); ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = alpha(base, 0.45); ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
  BOXES = save; GBOX = g;
}
