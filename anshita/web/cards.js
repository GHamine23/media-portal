/* ============================================================
   البطاقات المصوّرة (الشكل «الفاتح الهادئ» الذي اختاره أمين)
   تُرسم بخط ثمانية وهوية المسار على لوحة رسم بدقة كاملة، ثم تُرفع إلى الخادم ليرسلها البوت صورًا:
   - بطاقة «خطة الأسبوع» مع رسالة الأسبوع في مجموعة الفريق (١٠٨٠×١٣٥٠)
   - بطاقة النشاط مع تذكير النشر وتذكير يوم الموعد إن لم يُرفع له تصميم (١٠٨٠×١٠٨٠)
   ============================================================ */
const CARD = { bg: '#fbf7f3', ink: '#1d1416', muted: '#8a7a7d', line: '#e8dcd4', foot: 'أكاديمية الجيل الصاعد الإلكترونية · منصة الأنشطة التربوية' };
const cardFont = (w, px, fam) => `${w} ${px}px ${fam === 'd' ? "'thm-display'" : fam === 't' ? "'thm-text'" : "'thm-sans'"}, 'Noto Naskh Arabic', Tahoma, sans-serif`;
async function cardFontsReady() {
  try { await (window.FONTS_READY || Promise.resolve()); } catch (e) {}
  try { await Promise.all(['700 80px thm-display', '500 40px thm-display', '700 40px thm-sans', '500 40px thm-sans', '400 40px thm-sans'].map(f => document.fonts.load(f, 'أبجد'))); } catch (e) {}
}
function cardImg(src) { return new Promise(ok => { if (!src) return ok(null); const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; }); }
// تقسيم النص أسطرًا على العرض المتاح
function cardWrap(ctx, text, maxW) {
  const words = String(text || '').split(/\s+/).filter(Boolean), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } }
  if (cur) lines.push(cur);
  return lines;
}
function cardEllipsis(ctx, text, maxW) { let t = String(text || ''); if (ctx.measureText(t).width <= maxW) return t; while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1); return t + '…'; }
function cardRound(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
const cardDay = d => `${DAYS[wd(d)]} ${dnum(d)} ${mon(d)}`;
const cardHijri = d => String(hijri(d) || '').replace(/\s*\d{4}\s*هـ?$/, '').replace(/\s*هـ$/, '');
const cardWho = who => (who || []).map(w => 'أ. ' + String(w).replace(/^أ\.\s*/, '')).join(' و');

async function drawCard(data) {
  await cardFontsReady();
  const week = data.kind === 'week', W = 1080, H = week ? 1350 : 1080;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'), c = data.track.color || '#3c7e79', R = W - 110, L = 90, maxW = R - L;
  ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = CARD.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = c; ctx.fillRect(W - 26, 0, 26, H);   // الشريط بلون المسار في جهة البداية
  // الرأس: الشعار واسم المسار
  const logo = await cardImg(LOGOS[data.track.id]);
  let y = 90;
  if (logo) { const h = 130, w = Math.min(220, logo.width / logo.height * h); ctx.drawImage(logo, R - w, y, w, h); ctx.font = cardFont(700, 36); ctx.fillStyle = c; ctx.fillText(data.track.full || data.track.name, R - w - 26, y + h / 2 + 13); }
  else { ctx.font = cardFont(700, 40); ctx.fillStyle = c; ctx.fillText(data.track.full || data.track.name, R, y + 60); }
  y += 130 + 70;
  // الشارة
  const pill = (txt, yy) => { ctx.font = cardFont(700, 40); const w = ctx.measureText(txt).width + 56; ctx.fillStyle = c; cardRound(ctx, R - w, yy - 50, w, 70, 16); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(txt, R - 28, yy - 2); return w; };
  if (!week) {
    const a = data.act;
    const nR = 1 + (a.time ? 1 : 0) + ((a.who || []).length ? 1 : 0), top = y, room = (H - 170) - top, GAP = 150;
    // يصغر خط العنوان حتى يتسع كله (ثلاثة أسطر على الأكثر) مع الصفوف بين الرأس والتذييل
    let px = 118, lines, lh, nL, block;
    for (;;) { ctx.font = cardFont(700, px, 'd'); lines = cardWrap(ctx, a.title, maxW); lh = Math.round(px * 1.22); nL = Math.min(3, lines.length); block = 70 + 40 + lh * nL + GAP + (nR - 1) * 74; if ((lines.length <= 3 && block <= room) || px <= 56) break; px -= 6; }
    y = top + Math.max(0, Math.round((room - block) / 2)) + 50;   // المحتوى في وسط المساحة
    pill(data.kind === 'd0' ? (a.time ? 'اليوم الساعة ' + timeText(a.time) : 'اليوم') : 'تذكير: غدًا', y);
    y += 40;
    ctx.font = cardFont(700, px, 'd'); ctx.fillStyle = c;
    lines.slice(0, 3).forEach((ln, i) => ctx.fillText(ln, R, y + lh * (i + 1) - Math.round(px * 0.12)));
    y += lh * nL + GAP;
    const row = (lb, val) => { ctx.font = cardFont(700, 44); ctx.fillStyle = c; ctx.fillText(lb, R, y); const lw = ctx.measureText(lb).width + 18; ctx.font = cardFont(500, 44); ctx.fillStyle = CARD.ink; ctx.fillText(cardEllipsis(ctx, val, maxW - lw), R - lw, y); y += 74; };
    row('اليوم', `${cardDay(a.d)} · ${cardHijri(a.d)}`);
    if (a.time) row('الساعة', timeText(a.time));
    if ((a.who || []).length) row('يقدّمه', cardWho(a.who));
  } else {
    const end = add(data.wk, 6), pw = pill('خطة الأسبوع' + (data.wn ? ' ' + data.wn : ''), y);
    ctx.font = cardFont(500, 36); ctx.fillStyle = CARD.muted; ctx.fillText(`${gShort(data.wk)} – ${gShort(end)}`, R - pw - 22, y - 4);
    y += 80;
    const sec = t => { ctx.font = cardFont(700, 46, 'd'); ctx.fillStyle = c; ctx.fillText(t, R, y); y += 26; ctx.fillStyle = CARD.line; ctx.fillRect(L, y - 4, maxW, 2); y += 52; };
    sec('الأنشطة');
    const acts = data.acts || [], showA = acts.slice(0, 6);
    if (!showA.length) { ctx.font = cardFont(500, 40); ctx.fillStyle = CARD.muted; ctx.fillText('لا أنشطة في الخطة هذا الأسبوع بعد', R, y); y += 70; }
    showA.forEach(a => {
      ctx.font = cardFont(700, 38); ctx.fillStyle = c; const day = `${DAYS[wd(a.d)]} ${dnum(a.d)}`; ctx.fillText(day, R, y);
      const dw = Math.max(ctx.measureText('الأربعاء 30').width, ctx.measureText(day).width) + 28;
      ctx.font = cardFont(500, 40); ctx.fillStyle = CARD.ink; ctx.fillText(cardEllipsis(ctx, a.title, maxW - dw), R - dw, y);
      const meta = [a.time ? timeText(a.time) : '', a.type, cardWho(a.who)].filter(Boolean).join(' · ');
      ctx.font = cardFont(400, 30); ctx.fillStyle = CARD.muted; ctx.fillText(cardEllipsis(ctx, meta, maxW - dw), R - dw, y + 42);
      y += 96;
    });
    if (acts.length > showA.length) { ctx.font = cardFont(500, 32); ctx.fillStyle = CARD.muted; ctx.fillText(`و${acts.length - showA.length} غيرها في المنصة`, R, y - 20); y += 30; }
    const tasks = data.tasks || [];
    if (tasks.length && y < H - 330) {
      y += 20; sec('المهام');
      const room = Math.max(1, Math.floor((H - 190 - y) / 62)), showT = tasks.slice(0, Math.min(room, 6));
      showT.forEach(t => { ctx.font = cardFont(500, 36); ctx.fillStyle = c; ctx.fillText('○', R, y); ctx.fillStyle = CARD.ink; ctx.fillText(cardEllipsis(ctx, (t.d ? DAYS[wd(t.d)] + ': ' : '') + t.text, maxW - 50), R - 50, y); y += 62; });
      if (tasks.length > showT.length) { ctx.font = cardFont(500, 32); ctx.fillStyle = CARD.muted; ctx.fillText(`و${tasks.length - showT.length} مهام أخرى في المنصة`, R, y - 10); }
    }
  }
  // التذييل
  ctx.fillStyle = CARD.line; ctx.fillRect(L, H - 128, maxW, 2);
  ctx.font = cardFont(500, 30); ctx.fillStyle = CARD.muted; ctx.fillText(CARD.foot, R, H - 70);
  return cv;
}
const cardB64 = cv => new Promise(ok => cv.toBlob(b => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.readAsDataURL(b); }, 'image/png'));

// يرسم ما يحتاجه الخادم من بطاقات ويرفعه (بصمت في الخلفية). auth: رمز الدخول أو مفتاح التقرير
let CARD_BUSY = false;
async function cardSync(auth, max = 8) {
  if (CARD_BUSY || !auth) return { n: 0 };
  CARD_BUSY = true; let n = 0, total = 0, errs = [];
  try {
    const todo = await API.call('cards_todo', auth); total = todo.total || 0;
    for (const it of (todo.items || []).slice(0, max)) {
      try { const cv = await drawCard(it.data); await API.call('card_put', auth, it.id, it.sig, await cardB64(cv)); n++; } catch (e) { errs.push(it.id + ': ' + e.message); }
    }
  } catch (e) { errs.push(e.message); }
  CARD_BUSY = false;
  return { n, total, errs };
}
let CARD_T = 0;
function cardSoon(delay = 8000) { if (!TOKEN || CFG.demo && !window.CARD_DEMO) return; clearTimeout(CARD_T); CARD_T = setTimeout(() => { if ('requestIdleCallback' in window) requestIdleCallback(() => cardSync(TOKEN, 6)); else cardSync(TOKEN, 6); }, delay); }

// صفحة الرسم: تفتحها مهمة التقرير الأسبوعي صباح السبت (‎#render/<مفتاح التقرير>‎)
let RENDER = null;
function renderView(key) {
  if (!RENDER || RENDER.key !== key) {
    RENDER = { key, st: 'run' }; window.__renderDone = null;
    cardSync(key, 60).then(r => { RENDER = Object.assign({ key, st: 'done' }, r); window.__renderDone = r; render(); });
  }
  const R = RENDER;
  return `<div class="pub"><div class="card empty">${R.st === 'run' ? `<span class="spin"></span><h3>يرسم البطاقات…</h3>` : `<h3>رُسمت ${R.n} من ${R.total}</h3>${(R.errs || []).length ? `<p class="err">${esc(R.errs.join(' | '))}</p>` : ''}`}</div></div>`;
}
