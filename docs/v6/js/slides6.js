/* ================= العرض الحي: الانتقال بين الشرائح، وحركة العناصر، والوسائط، والسؤال والجواب، والمؤقّت، وملاحظات المقدّم =================
   الشرائح تُرسم بمحرك القوالب نفسه (فهي مطابقة لما يُنزَّل PDF)، والوسائط عناصر HTML تُوضع فوق مكانها في اللوحة أثناء العرض فقط.
   الحركة نوعان منفصلان تماماً:
   ١) الانتقال بين الشرائح: p.trans (للشريحة) أو doc.trans (للعرض كله) نصٌّ «النوع» أو «النوع:السرعة»، مثل 'push' أو 'cube:slow'.
   ٢) حركة العناصر: p.anim = { mode: auto|custom|none, style, speed, seq, items: { عنصر: حركة } }، والظهور بنقرة ترتيبه في p.steps.
   القيم القديمة تبقى صالحة: 'slide' تُقرأ 'push'، وكل أسماء الحركات القديمة باقية. */
const EASE6 = 'cubic-bezier(.22,1,.36,1)', INOUT6 = 'cubic-bezier(.65,0,.35,1)';
const SPEEDS6 = [['fast', 'سريعة'], ['normal', 'عادية'], ['slow', 'هادئة']];
const TRANS6 = [['none', 'بلا', 'calm'], ['fade', 'تلاشٍ', 'calm'], ['dip', 'عبر العتمة', 'calm'], ['blur', 'ذوبان', 'calm'],
  ['push', 'دفع', 'move'], ['cover', 'تغطية', 'move'], ['uncover', 'إزاحة', 'move'], ['zoom', 'تكبير', 'move'],
  ['wipe', 'مسح', 'reveal'], ['circle', 'دائرة', 'reveal'], ['flip', 'قلب', 'reveal'], ['cube', 'مكعّب', 'reveal']];
const TRANS_GROUPS = [['calm', 'هادئة'], ['move', 'حركة'], ['reveal', 'كشف وعمق']];
const TRANS = TRANS6.map(function (t) { return [t[0], t[1]]; });
const TRANS_MS = { fast: 400, normal: 650, slow: 1050 };
const TRANS_OLD = { slide: 'push' };
function parseTrans(s) {
  const a = String(s || '').split(':'), k = TRANS_OLD[a[0]] || a[0];
  return { k: TRANS6.some(function (t) { return t[0] === k; }) ? k : '', sp: TRANS_MS[a[1]] ? a[1] : '' };
}
function transStr(k, sp) { return k + (sp && sp !== 'normal' ? ':' + sp : ''); }
// انتقال الشريحة الفعلي: ما خُصّت به، وإلا انتقال العرض كله
function transOf(doc, p) { const a = parseTrans(p && p.trans), d = parseTrans(doc && doc.trans); return { k: a.k || d.k || 'fade', sp: (a.k ? a.sp : d.sp) || 'normal' }; }
function transMs(t) { return Math.round(TRANS_MS[t.sp] * (t.k === 'cube' || t.k === 'flip' ? 1.2 : t.k === 'dip' ? 1.3 : 1)); }
// إطارات الانتقال: o للشريحة الخارجة، n للداخلة. dir = 1 للتالية (تدخل من اليسار في العربية)، و-1 للسابقة
function transFrames(kind, dir) {
  const s = dir < 0 ? -1 : 1, X = function (v) { return 'translateX(' + (v * s) + '%)'; }, sh = function (a) { return '0 0 70px rgba(0,0,0,' + a + ')'; };
  switch (kind) {
    case 'fade': return { n: [{ opacity: 0 }, { opacity: 1 }] };
    case 'dip': return { o: [{ opacity: 1 }, { opacity: 0, offset: 0.45 }, { opacity: 0 }], n: [{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }], ease: 'ease-in-out' };
    case 'blur': return { o: [{ opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(22px)' }], n: [{ opacity: 0, filter: 'blur(22px)', transform: 'scale(1.04)' }, { opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' }] };
    case 'push': return { o: [{ transform: X(0) }, { transform: X(100) }], n: [{ transform: X(-100) }, { transform: X(0) }], ease: 'cubic-bezier(.7,0,.2,1)' };
    case 'cover': return { o: [{ filter: 'brightness(1)', transform: 'scale(1)' }, { filter: 'brightness(.5)', transform: 'scale(.95)' }], n: [{ transform: X(-100), boxShadow: sh(0.5) }, { transform: X(0), boxShadow: sh(0) }], top: 'n' };
    case 'uncover': return { o: [{ transform: X(0), boxShadow: sh(0.5) }, { transform: X(100), boxShadow: sh(0.2) }], n: [{ filter: 'brightness(.5)', transform: 'scale(.95)' }, { filter: 'brightness(1)', transform: 'scale(1)' }], top: 'o' };
    case 'zoom': return s > 0 ? { o: [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.35)' }], n: [{ opacity: 0, transform: 'scale(.78)' }, { opacity: 1, transform: 'scale(1)' }], top: 'o' }
      : { o: [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.78)' }], n: [{ opacity: 0, transform: 'scale(1.35)' }, { opacity: 1, transform: 'scale(1)' }], top: 'n' };
    case 'wipe': return { o: [{ filter: 'brightness(1)' }, { filter: 'brightness(.75)' }], n: [{ clipPath: s > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], ease: INOUT6 };
    case 'circle': return { n: [{ clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)' }], ease: INOUT6 };
    case 'flip': return { o: [{ transform: 'rotateY(0deg) scale(1)' }, { transform: 'rotateY(' + (90 * s) + 'deg) scale(.84)' }, { transform: 'rotateY(' + (180 * s) + 'deg) scale(1)' }],
      n: [{ transform: 'rotateY(' + (-180 * s) + 'deg) scale(1)' }, { transform: 'rotateY(' + (-90 * s) + 'deg) scale(.84)' }, { transform: 'rotateY(0deg) scale(1)' }], back: true, ease: INOUT6 };
    case 'cube': return { o: [{ transform: 'translateX(0%) rotateY(0deg)', filter: 'brightness(1)' }, { transform: X(100) + ' rotateY(' + (90 * s) + 'deg)', filter: 'brightness(.45)' }], oo: s > 0 ? '0% 50%' : '100% 50%',
      n: [{ transform: X(-100) + ' rotateY(' + (-90 * s) + 'deg)', filter: 'brightness(.45)' }, { transform: 'translateX(0%) rotateY(0deg)', filter: 'brightness(1)' }], no: s > 0 ? '100% 50%' : '0% 50%', ease: INOUT6 };
  }
  return {};
}
// تشغيل انتقال بين عنصرين (في العرض وفي معاينة اللوحة)
function runTransition(o, n, kind, ms, dir, done) {
  const f = transFrames(kind, dir), opt = { duration: ms, easing: f.ease || EASE6, fill: 'forwards' };
  o.style.zIndex = f.top === 'o' ? '2' : '1'; n.style.zIndex = f.top === 'o' ? '1' : '2';
  if (f.back) { o.style.backfaceVisibility = 'hidden'; n.style.backfaceVisibility = 'hidden'; }
  if (f.oo) o.style.transformOrigin = f.oo; if (f.no) n.style.transformOrigin = f.no;
  let left = 0; const fin = function () { if (--left <= 0 && done) done(); };
  if (f.o) { left++; o.animate(f.o, opt).onfinish = fin; }
  if (f.n) { left++; n.animate(f.n, opt).onfinish = fin; }
  if (!left && done) setTimeout(done, 0);
}

/* ---------- حركات دخول العناصر ---------- */
const ANIM6 = [['fade', 'تلاشٍ', 'calm'], ['up', 'صعود', 'calm'], ['down', 'هبوط', 'calm'], ['right', 'من اليمين', 'calm'], ['left', 'من اليسار', 'calm'], ['blur', 'من الضباب', 'calm'],
  ['zoom', 'تكبير', 'lively'], ['near', 'من قريب', 'lively'], ['pop', 'قفزة', 'lively'], ['bounce', 'ارتداد', 'lively'], ['drop', 'سقوط', 'lively'], ['spin', 'دوران', 'lively'], ['flip', 'قلب', 'lively'], ['glow', 'توهّج', 'lively'],
  ['wipe', 'مسح', 'reveal'], ['rise', 'انبثاق', 'reveal'], ['iris', 'دائرة', 'reveal'], ['type', 'كتابة', 'reveal'], ['swipe', 'ستارة لونية', 'reveal']];
const AN_GROUPS = [['calm', 'هادئة'], ['lively', 'حيوية'], ['reveal', 'كشف']];
const AN_STYLES = ANIM6.map(function (x) { return [x[0], x[1]]; });
const AN_NAME = { none: 'بلا' }; ANIM6.forEach(function (x) { AN_NAME[x[0]] = x[1]; });
const AN_MS = { fast: 450, normal: 750, slow: 1150 };
const AN_K = { type: 1.7, swipe: 1.5, bounce: 1.35, glow: 1.2, iris: 1.15, pop: 1.1 };
const SEQ6 = [['together', 'معاً'], ['seq', 'تباعاً'], ['calm', 'متمهّل']];
function validAn(s) { return s === 'none' || AN_NAME[s] ? s : 'up'; }
function animModeOf(doc, p) { const A = p.anim || {}; return A.mode || doc.animMode || 'auto'; }
function animOf(doc, p, g) {
  const A = p.anim || {}, mode = animModeOf(doc, p);
  if (mode === 'none') return 'none';
  if (mode === 'custom' && A.items && A.items[g]) return validAn(A.items[g]);
  return validAn(A.style || doc.animStyle || 'up');
}
function animDur(doc, p, style) { return Math.round(AN_MS[(p.anim || {}).speed || doc.animSpeed || 'normal'] * (AN_K[style] || 1) || 750); }
function animGap(p, n) { const q = (p.anim || {}).seq; return q === 'together' ? 0 : q === 'calm' ? 450 : Math.min(220, Math.max(90, 900 / Math.max(1, n))); }
// تُطبَّق الحركة على طبقة بحجم الشريحة كلها فيها العنصر وحده؛ box حدوده (لقصّ المسح والكشف ومركز التكبير)
function addAnim(node, style, box, sz, dur, delay, host, color) {
  node.classList.add('pan', 'an-' + style);
  node.style.setProperty('--dur', dur + 'ms'); node.style.animationDelay = delay + 'ms';
  if (box) {
    const P = function (v) { return Math.max(0, Math.min(100, v * 100)).toFixed(2) + '%'; }, pad = 0.012;
    const l = box.x0 / sz.w - pad, r = 1 - box.x1 / sz.w - pad, t = box.y0 / sz.h - pad, b = 1 - box.y1 / sz.h - pad;
    node.style.setProperty('--cl', P(l)); node.style.setProperty('--cr', P(r)); node.style.setProperty('--ct', P(t)); node.style.setProperty('--cb', P(b));
    node.style.setProperty('--cl0', P(1 - Math.max(0, r))); node.style.setProperty('--bh', P(1 - Math.max(0, t) - Math.max(0, b)));
    const cx = (box.x0 + box.x1) / 2 / sz.w, cy = (box.y0 + box.y1) / 2 / sz.h;
    node.style.setProperty('--cx', P(cx)); node.style.setProperty('--cy', P(cy));
    const hd = Math.hypot((box.x1 - box.x0) / 2, (box.y1 - box.y0) / 2) / (Math.hypot(sz.w, sz.h) / Math.SQRT2);
    node.style.setProperty('--rad', P(hd * 1.15 + 0.01));
    node.style.transformOrigin = P(cx) + ' ' + P(cy);
    if (style === 'swipe' && host) {
      const bar = el('i', { class: 'pswipe', style: 'left:' + P(box.x0 / sz.w) + ';top:' + P(box.y0 / sz.h) + ';width:' + P((box.x1 - box.x0) / sz.w) + ';height:' + P((box.y1 - box.y0) / sz.h) + ';--dur:' + dur + 'ms;animation-delay:' + delay + 'ms' + (color ? ';--swc:' + color : '') });
      host.appendChild(bar);
    }
  }
}
// الخطوات: أسماء العناصر التي تظهر واحداً واحداً، وشريحة السؤال لها خطوة «الجواب»
function stepsOf(p) { const s = (p.steps || []).slice(); if (p.tpl === 'sl_quiz' && s.indexOf('__answer') < 0) s.push('__answer'); return s; }
// حالة الشريحة عند خطوة معيّنة: ما لم يظهر بعد يُخفى
function pageAtStep(p, step) {
  const q = JSON.parse(JSON.stringify(p)), st = stepsOf(p);
  q.hide = q.hide || {};
  st.forEach(function (g, i) { if (i >= step) { if (g === '__answer') q.d.reveal = false; else q.hide['g_' + g] = true; } else if (g === '__answer') q.d.reveal = true; });
  if (p.tpl === 'sl_quiz' && st.indexOf('__answer') >= step) q.d.reveal = false;
  return q;
}
// الشريحة التالية/السابقة الظاهرة (المخفية لا تُعرض، ويُقفز إلى ما بعدها). -1 إن لم توجد
function shownAfter(pages, i, d) { for (let k = i + d; k >= 0 && k < pages.length; k += d) if (!pages[k].skip) return k; return -1; }
function renderSlide(c, p, T, scale, collect) { const tpl = TEMPLATES.find(function (t) { return t.id === p.tpl; }); return renderTo(c, tpl, p.size || 'slide', p, T, scale, collect); }
function reducedMotion() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
function isMedia(L) { return L && (L.t === 'video' || L.t === 'yt' || L.t === 'audio'); }

function present6(fromView, startAt, opts) {
  opts = opts || {};
  if (!fromView) commitPage();
  const doc = ED.doc, pages = doc.pages, T = S.track, touch = matchMedia('(pointer: coarse)').matches;
  let i = startAt != null ? startAt : (fromView ? 0 : ED.cur), step = 0, timer = null, timerLeft = 0, notesOn = false, numBuf = '', wakeLock = null;
  const stage = el('div', { class: 'pstage' }), media = el('div', { class: 'pmedia' });
  const bar = el('div', { class: 'pbar' }), counter = el('span', { class: 'pcount', dir: 'ltr' }), timerEl = el('div', { class: 'ptimer', hidden: true }), notesEl = el('aside', { class: 'pnotes', hidden: true });
  const prog = el('div', { class: 'pprog' }, [el('i')]), blank = el('div', { class: 'pblank', hidden: true }), grid = el('div', { class: 'pgrid', hidden: true });
  stage.appendChild(media);
  const hint = touch ? 'اسحب للتنقل · المس الوسط للأزرار' : 'الأسهم أو النقر للتنقل · G الشرائح · N الملاحظات · T المؤقّت · P القلم · R القرعة · S النقاط · Esc للخروج';
  let FOL = opts.follower || (opts.bus ? 'local' : '');   // نافذة العرض في «عرض المقدّم»: الشرائح وحدها، والأوامر من نافذة المقدّم
  const ov = el('div', { class: 'present6' + (touch ? ' touch' : '') + (FOL ? ' follower' : ''), tabindex: '0' }, [stage, prog, blank, timerEl, notesEl, grid, bar, el('div', { class: 'phint', text: hint })]);
  let cur = null, chan = null, mediaSlide = -1, animTimers = [];
  try { chan = new BroadcastChannel('athar-present'); } catch (e) {}
  let fch = opts.bus || null; try { if (!fch && opts.follower) fch = new BroadcastChannel('athar-stage-' + opts.follower); } catch (e) {}
  const later = function (fn, ms) { animTimers.push(setTimeout(fn, ms)); };
  function fitStage() {
    const sz = SIZES[pages[i].size || 'slide'], W = ov.clientWidth || innerWidth, H = ov.clientHeight || innerHeight, aw = W - (notesOn ? 320 : 0), r = Math.min(aw / sz.w, H / sz.h);
    stage.style.width = Math.round(sz.w * r) + 'px'; stage.style.height = Math.round(sz.h * r) + 'px';
    return r;
  }
  function plain(d) { d.getAnimations().forEach(function (a) { a.cancel(); }); d.removeAttribute('style'); }
  // إنهاء كل حركة جارية فوراً: الشريحة الحالية تستقر على حالتها النهائية
  function settle() {
    animTimers.forEach(clearTimeout); animTimers = [];
    $$('.pslide', stage).forEach(function (d) { if (d !== cur) d.remove(); });
    if (cur) { plain(cur); if (cur._final) { cur.replaceChildren(cur._final); cur._final = null; } }
  }
  function finalize(d) { if (cur === d && d._final) { d.replaceChildren(d._final); d._final = null; } }
  // قناع الفرق بين حالتين: ما ظهر جديداً فقط (العنصر وحده على شفافية)
  function diffCanvas(a, b) {
    const w = a.width, h = a.height, c = document.createElement('canvas'); c.width = w; c.height = h;
    const da = a.getContext('2d').getImageData(0, 0, w, h).data, ib = b.getContext('2d').getImageData(0, 0, w, h), db = ib.data;
    let any = false;
    for (let k = 0; k < db.length; k += 4) { if (Math.abs(da[k] - db[k]) + Math.abs(da[k + 1] - db[k + 1]) + Math.abs(da[k + 2] - db[k + 2]) < 18 && Math.abs(da[k + 3] - db[k + 3]) < 18) db[k + 3] = 0; else any = true; }
    if (!any) return null;
    c.getContext('2d').putImageData(ib, 0, 0); c.className = 'pcv'; return c;
  }
  function renderState(q, scale) { const c = document.createElement('canvas'); c.className = 'pcv'; q.d.__n = i ? String(i + 1) : ''; renderSlide(c, q, T, scale); return c; }
  function elementsOf(q, boxes) {
    const keys = Object.keys(boxes).filter(function (g) { return g !== 'deco' && g !== 'footer' && g !== 'academy' && g !== 'social'; });
    const hidden = q.hide || {}; return keys.filter(function (g) { return !hidden['g_' + g]; }).sort(function (x, y) { return (boxes[x].y0 - boxes[y].y0) || (boxes[y].x0 - boxes[x].x0); });
  }
  // دخول العناصر: الشريحة بلا هذه العناصر، ثم يدخل كل عنصر بحركته وترتيبه
  function playEntrance(d, p, q, boxes, scale, groups, delay) {
    const sz = SIZES[p.size || 'slide'], gap = animGap(p, groups.length), col = (T && T.c && T.c.p) || '';
    const base = JSON.parse(JSON.stringify(q)); base.hide = Object.assign({}, base.hide); groups.forEach(function (g) { base.hide['g_' + g] = true; });
    let prev = renderState(base, scale), end = 0;
    d.appendChild(prev);
    groups.forEach(function (g, k) {
      const st = JSON.parse(JSON.stringify(base)); groups.slice(0, k + 1).forEach(function (x) { delete st.hide['g_' + x]; });
      const c2 = renderState(st, scale), mask = diffCanvas(prev, c2); prev = c2;
      if (!mask) return;
      const style = animOf(doc, p, g);
      if (style === 'none') { d.appendChild(mask); return; }
      const dur = animDur(doc, p, style), at = delay + k * gap;
      addAnim(mask, style, boxes[g], sz, dur, at, d, col); d.appendChild(mask);
      end = Math.max(end, at + dur);
    });
    return end;
  }
  function draw(mode) {   // next | prev | stepf | stepb | still
    settle();
    const p = pages[i], r = fitStage(), scale = r * Math.min(2, devicePixelRatio || 1), sz = SIZES[p.size || 'slide'], motion = !reducedMotion();
    const c = el('canvas', { class: 'pcv' });
    const q = pageAtStep(p, step); q.d.__n = i ? String(i + 1) : '';
    const boxes = renderSlide(c, q, T, scale, true) || {};
    let mediaDelay = 0;
    if (!cur || mode === 'next' || mode === 'prev') {
      const d = el('div', { class: 'pslide' }); stage.insertBefore(d, media); d._final = c;
      const leaving = cur, back = mode === 'prev';
      // الانتقال: للتالية انتقال الشريحة الداخلة، وللسابقة انتقال الشريحة التي نغادرها معكوساً
      const t = transOf(doc, back ? pages[Math.min(pages.length - 1, i + 1)] : p), tms = leaving && motion && t.k !== 'none' ? transMs(t) : 0;
      let groups = motion && !back && animModeOf(doc, p) !== 'none' ? elementsOf(q, boxes).filter(function (g) { return stepsOf(p).indexOf(g) < 0; }) : [];
      if (!groups.some(function (g) { return animOf(doc, p, g) !== 'none'; })) groups = [];
      let end = 0;
      if (groups.length) end = playEntrance(d, p, q, boxes, scale, groups, leaving ? Math.round(tms * 0.55) : 150); else d.appendChild(c);
      if (leaving && tms) runTransition(leaving, d, t.k, tms, back ? -1 : 1, function () { leaving.remove(); if (cur === d) plain(d); });
      else if (leaving) leaving.remove();
      cur = d; mediaDelay = tms;
      if (end) later(function () { finalize(d); }, end + 80);
    } else if (mode === 'stepf' && motion && stepsOf(p)[step - 1] !== '__answer') {
      // خطوة بنقرة: العنصر الجديد وحده يدخل بحركته، وما قبله ثابت
      const g = stepsOf(p)[step - 1], before = pageAtStep(p, step - 1); before.d.__n = q.d.__n;
      const prevC = renderState(before, scale), mask = diffCanvas(prevC, c);
      cur.replaceChildren(prevC); cur._final = c;
      let style = animOf(doc, p, g); if (style === 'none') style = 'fade';
      const dur = animDur(doc, p, style);
      if (mask) { addAnim(mask, style, boxes[g], sz, dur, 0, cur, (T && T.c && T.c.p) || ''); cur.appendChild(mask); }
      const d = cur; later(function () { finalize(d); }, dur + 80);
    } else if (mode === 'still' || !motion) {
      cur.replaceChildren(c);
    } else {
      // كشف الجواب أو الرجوع خطوة: تلاشٍ ناعم إلى الحالة الجديدة
      cur._final = c; cur.appendChild(c);
      const d = cur; c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: mode === 'stepb' ? 260 : 380, easing: EASE6 }).onfinish = function () { finalize(d); };
    }
    placeMedia(q, boxes, mediaDelay);
    counter.textContent = (i + 1) + ' / ' + pages.length + (stepsOf(p).length ? ' · ' + step + '/' + stepsOf(p).length : '');
    prog.firstChild.style.width = ((i + 1) / pages.length * 100) + '%';
    notesEl.textContent = p.notes || 'لا ملاحظات لهذه الشريحة.';
    if (ov._lesson) ov._lesson.slide(i, p, step, q);
    if (stage.classList.contains('pzoom')) { clearTimeout(zoomT); stage.classList.remove('pzoom'); stage.style.removeProperty('--pz'); }
    if (fch) { try { fch.postMessage({ t: 'state', i: i, step: step }); } catch (e) {} }
    if (chan) { try { const nx = pages[i + 1]; const c2 = document.createElement('canvas'); if (nx) renderSlide(c2, nx, T, 0.2); chan.postMessage({ i: i, n: pages.length, step: step, notes: p.notes || '', cur: c.toDataURL('image/jpeg', 0.6), next: nx ? c2.toDataURL('image/jpeg', 0.6) : '' }); } catch (e) {} }
  }
  /* ---------- الوسائط فوق مكانها: تبقى ما دامت الشريحة نفسها، وتُضاف عند ظهورها بنقرة ---------- */
  function placeMedia(q, boxes, delay) {
    const sz = SIZES[q.size || 'slide'], r = stage.clientWidth / sz.w, fresh = mediaSlide !== i;
    if (fresh) { $$('.pmbox', media).forEach(function (x) { if (x._stop) x._stop(); }); media.innerHTML = ''; mediaSlide = i; if (delay) media.animate([{ opacity: 0 }, { opacity: 0, offset: 0.7 }, { opacity: 1 }], { duration: delay + 250 }); }
    const keep = {};
    (q.layers || []).forEach(function (L) {
      if (!isMedia(L)) return;
      const b = boxes['L:' + L.id]; if (!b || (q.hide || {})['g_L:' + L.id]) return;
      keep[L.id] = true;
      let box = media.querySelector('.pmbox[data-id="' + L.id + '"]');
      const w = (b.x1 - b.x0) * r, h = (b.y1 - b.y0) * r;
      if (!box) { box = mediaBox(L, w, h, delay); box.dataset.id = L.id; media.appendChild(box); }
      box.style.left = (b.x0 * r) + 'px'; box.style.top = (b.y0 * r) + 'px'; box.style.width = w + 'px'; box.style.height = h + 'px';
      if (L.t !== 'audio') {
        box.style.borderRadius = (Math.min(w, h) * (L.r != null ? L.r : 0.06)) + 'px';
        if (L.fr) { box.classList.add('fr'); box.style.setProperty('--frw', Math.max(1, Math.min(w, h) * 0.022) + 'px'); box.style.setProperty('--frc', L.fr === 'p' ? ((T && T.c && T.c.p) || '#fff') : L.fr); }
      }
    });
    $$('.pmbox', media).forEach(function (x) { if (!keep[x.dataset.id]) { if (x._stop) x._stop(); x.remove(); } });
  }
  function mediaBox(L, w, h, delay) {
    const box = el('div', { class: 'pmbox pm-' + L.t + (L.sh ? ' pmsh' : '') });
    box.addEventListener('click', function (e) { e.stopPropagation(); });
    box.addEventListener('touchend', function (e) { e.stopPropagation(); });
    const start = +L.start || 0, end = +L.end || 0;
    const full = function (on) { if (L.full) box.classList.toggle('full', on); };
    if (L.t === 'yt') {
      // يوتيوب يعمل داخل العرض نفسه: صورة المقطع وزر تشغيل، أو يبدأ وحده مع الشريحة
      const id = ytId(L.url);
      const play = function () {
        const f = el('iframe', { class: 'pmframe', src: ytEmbed(L, id), allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: '', referrerpolicy: 'strict-origin-when-cross-origin', title: L.title || 'يوتيوب' });
        box.replaceChildren(f, el('a', { class: 'pmext', href: L.url, target: '_blank', rel: 'noopener', title: 'افتح في يوتيوب', text: '↗' }));
        box.classList.add('playing'); full(true);
      };
      const th = el('img', { class: 'pmthumb', alt: '', src: 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg', onerror: function () { th.remove(); } });
      box.append(th, el('button', { type: 'button', class: 'pmyt', title: 'شغّل المقطع هنا', 'aria-label': 'تشغيل المقطع', onclick: function (e) { e.stopPropagation(); play(); } }, [svgOf('<rect x="14" y="26" width="72" height="48" rx="15" fill="#ff0000"/><path d="M43 38v24l21-12z" fill="#fff"/>')]),
        el('span', { class: 'pmtitle', text: L.title || '', hidden: !L.title }));
      if (L.auto) later(play, delay + 120);
      return box;
    }
    if (L.t === 'audio' && L.qr && typeof tilawaBox === 'function') return tilawaBox(L, box, later, delay);
    const el2 = el(L.t === 'video' ? 'video' : 'audio', { class: L.t === 'video' ? 'pmvideo' : '', playsinline: '', preload: 'metadata' });
    const v = el2; v.muted = !!L.mute;
    if (L.t === 'video') { if (L.ctl !== false) v.controls = true; if (L.fit === 'cover') v.style.objectFit = 'cover'; }
    const ref = L.ref.slice(6);
    assetURL(V6.assets[ref] || { id: ref, ver: 1, mime: L.t === 'video' ? 'video/mp4' : 'audio/mpeg' }).then(function (u) { v.src = u; }).catch(function () {});
    if (L.t === 'video' && L.poster) { const pr = L.poster.slice(6); assetURL(V6.assets[pr] || { id: pr, ver: 1, mime: 'image/png' }).then(function (u) { v.poster = u; }).catch(function () {}); }
    v.addEventListener('loadedmetadata', function () { if (start) v.currentTime = start; });
    v.addEventListener('timeupdate', function () { if (end && v.currentTime >= end) { if (L.loop) v.currentTime = start; else { v.pause(); } } });
    v.addEventListener('ended', function () { if (L.loop) { v.currentTime = start; v.play().catch(function () {}); } });
    v.addEventListener('play', function () { box.classList.add('playing'); full(true); });
    v.addEventListener('pause', function () { box.classList.remove('playing'); full(false); });
    box.appendChild(v);
    const toggle = function () { if (v.paused) v.play().catch(function () {}); else v.pause(); };
    if (L.t === 'audio' || L.ctl === false) box.appendChild(el('button', { type: 'button', class: L.t === 'audio' ? 'pmaudio' : 'pmtap', 'aria-label': 'تشغيل أو إيقاف', onclick: function (e) { e.stopPropagation(); toggle(); } }));
    if (L.auto) later(function () { v.play().catch(function () {}); }, delay + 120);
    return box;
  }
  function next() { hideBlank(); const st = stepsOf(pages[i]); if (step < st.length) { step++; draw('stepf'); return; } const n = shownAfter(pages, i, 1); if (n >= 0) { i = n; step = 0; draw('next'); } }
  function prev() { hideBlank(); if (step > 0) { step--; draw('stepb'); return; } const n = shownAfter(pages, i, -1); if (n >= 0) { i = n; step = 0; draw('prev'); } }
  function goTo(n) { hideBlank(); n = Math.max(0, Math.min(pages.length - 1, n)); if (n === i && !step) return; const back = n < i; i = n; step = 0; draw(back ? 'prev' : 'next'); }
  // التكبير من لوحة المقدّم: تُكبَّر الشريحة والوسائط والكتابة معاً حول النقطة المختارة
  let zoomT = 0;
  function setZoom(z, x, y) {
    clearTimeout(zoomT);
    if (!z || z <= 1) { if (!stage.classList.contains('pzoom')) return; stage.style.setProperty('--pz', 'none'); zoomT = setTimeout(function () { stage.classList.remove('pzoom'); stage.style.removeProperty('--pz'); }, 460); return; }
    const h = 0.5 / z, cx = Math.max(h, Math.min(1 - h, x)), cy = Math.max(h, Math.min(1 - h, y));
    stage.classList.add('pzoom'); stage.style.setProperty('--pz', 'scale(' + z + ') translate(' + ((0.5 - cx) * 100) + '%,' + ((0.5 - cy) * 100) + '%)');
  }
  function hideBlank() { if (fch && !blank.hidden) { try { fch.postMessage({ t: 'm-blank', c: '' }); } catch (e) {} } blank.hidden = true; }
  function toggleBlank(color) { if (!blank.hidden && blank.dataset.c === color) { hideBlank(); return; } blank.dataset.c = color; blank.hidden = false; if (fch) { try { fch.postMessage({ t: 'm-blank', c: color }); } catch (e) {} } }
  // نظرة على كل الشرائح: انقر شريحة للذهاب إليها
  function toggleGrid() {
    if (!grid.hidden) { grid.hidden = true; ov.focus(); return; }
    grid.replaceChildren(el('div', { class: 'pgrid-in' }, pages.map(function (pg, k) {
      const c = document.createElement('canvas');
      setTimeout(function () { const q = JSON.parse(JSON.stringify(pg)); q.d.__n = k ? String(k + 1) : ''; renderSlide(c, q, T, 0.16); }, 20 + k * 15);
      return el('button', { type: 'button', class: 'pgt' + (k === i ? ' on' : ''), 'aria-label': 'الشريحة ' + (k + 1), onclick: function (e) { e.stopPropagation(); grid.hidden = true; goTo(k); ov.focus(); } }, [c, el('small', { text: String(k + 1) })]);
    })));
    grid.hidden = false;
    const on = grid.querySelector('.pgt.on'); if (on) on.scrollIntoView({ block: 'center' });
  }
  function key(e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (document.querySelector('.modal')) return;
    if (ov._lesson && ov._lesson.key(e)) { e.preventDefault(); return; }
    const k = e.key;
    if (k === 'Escape') { if (!grid.hidden) { grid.hidden = true; return; } if (!blank.hidden) { hideBlank(); return; } if (FOL) { if (document.fullscreenElement) document.exitFullscreen().catch(function () {}); return; } close(); return; }
    if (/^[0-9٠-٩]$/.test(k)) { numBuf += String('٠١٢٣٤٥٦٧٨٩'.indexOf(k) >= 0 ? '٠١٢٣٤٥٦٧٨٩'.indexOf(k) : k); clearTimeout(key.t); key.t = setTimeout(function () { numBuf = ''; }, 1500); return; }
    if (k === 'Enter' && numBuf) { e.preventDefault(); goTo(+numBuf - 1); numBuf = ''; return; }
    if (k === 'ArrowLeft' || k === ' ' || k === 'PageDown' || k === 'Enter' || k === 'ArrowDown') { e.preventDefault(); next(); }
    else if (k === 'ArrowRight' || k === 'PageUp' || k === 'Backspace' || k === 'ArrowUp') { e.preventDefault(); prev(); }
    else if (k === 'Home') goTo(0); else if (k === 'End') goTo(pages.length - 1);
    else if (k === 't' || k === 'T' || k === 'ف') toggleTimer(); else if (k === 'n' || k === 'N' || k === 'ى') toggleNotes();
    else if (k === 'g' || k === 'G' || k === 'ل') toggleGrid();
    else if (k === 'b' || k === 'B' || k === '.' || k === 'لا') toggleBlank('#000'); else if (k === 'w' || k === 'W' || k === ',' || k === 'ص') toggleBlank('#fff');
    else if (k === 'f' || k === 'F' || k === 'ب') { if (document.fullscreenElement) document.exitFullscreen().catch(function () {}); else if (ov.requestFullscreen) ov.requestFullscreen().catch(function () {}); }
  }
  function toggleNotes() { notesOn = !notesOn; notesEl.hidden = !notesOn; ov.classList.toggle('with-notes', notesOn); draw('still'); }
  function fmtT(s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function toggleTimer() {
    if (timer) { clearInterval(timer); timer = null; timerEl.hidden = true; return; }
    const m = el('input', { type: 'number', min: '1', max: '120', value: '5', class: 'inp sm', style: 'width:90px' });
    modal({ title: 'مؤقّت', body: [el('div', { class: 'row' }, [m, el('span', { text: 'دقيقة' })]), el('p', { class: 'tiny', text: 'يظهر في زاوية الشاشة، ويتنبه عند الانتهاء. T لإيقافه.' })], acts: [{ t: 'ابدأ', cls: 'dark', fn: function () {
      timerLeft = Math.max(1, +m.value || 5) * 60; timerEl.hidden = false; timerEl.classList.remove('done'); timerEl.textContent = fmtT(timerLeft);
      timer = setInterval(function () { timerLeft--; timerEl.textContent = fmtT(Math.max(0, timerLeft)); if (timerLeft <= 0) { clearInterval(timer); timer = null; timerEl.classList.add('done'); timerEl.textContent = 'انتهى الوقت'; } }, 1000);
    } }, { t: 'إلغاء' }], onClose: function () { ov.focus(); } });
  }
  function speakerWindow() {
    const w = window.open('', 'athar_speaker', 'width=900,height=600');
    if (!w) { toast('المتصفح منع النافذة. استعمل N لإظهار الملاحظات هنا.'); return; }
    w.document.write('<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>شاشة المقدّم</title><style>body{margin:0;background:#111;color:#eee;font-family:Tahoma,Arial,sans-serif;display:grid;grid-template-columns:2fr 1fr;grid-template-rows:auto 1fr;gap:14px;padding:14px;height:100vh;box-sizing:border-box}img{width:100%;border-radius:8px;background:#000}.n{grid-column:1/-1;background:#1d1d1d;border-radius:10px;padding:16px;font-size:22px;line-height:1.8;white-space:pre-wrap;overflow:auto}.c{font-size:14px;color:#aaa}h4{margin:0 0 6px;font-weight:500;color:#aaa}</style></head><body><div><h4 id="c" class="c">الحالية</h4><img id="cur"></div><div><h4 class="c">التالية</h4><img id="next"></div><div class="n" id="n">ملاحظات الشريحة تظهر هنا.</div><script>var ch=new BroadcastChannel("athar-present");ch.onmessage=function(e){var m=e.data;document.getElementById("cur").src=m.cur;document.getElementById("next").src=m.next||"";document.getElementById("n").textContent=m.notes||"لا ملاحظات.";document.getElementById("c").textContent="الشريحة "+(m.i+1)+" من "+m.n;};<\/script></body></html>');
    w.document.close(); setTimeout(function () { draw('still'); }, 500);
  }
  bar.append.apply(bar, [
    el('button', { type: 'button', class: 'pb', 'aria-label': 'السابق', title: 'السابق', onclick: prev }, [ico('chev')]),
    counter,
    el('button', { type: 'button', class: 'pb nx', 'aria-label': 'التالي', title: 'التالي', onclick: next }, [ico('chev')]),
    el('span', { class: 'psep' }),
    el('button', { type: 'button', class: 'pb', title: 'كل الشرائح (G)', 'aria-label': 'كل الشرائح', onclick: toggleGrid }, [ico('grid')]),
    el('button', { type: 'button', class: 'pb', title: 'مؤقّت (T)', 'aria-label': 'مؤقّت', onclick: toggleTimer }, [ico('clock')]),
    el('button', { type: 'button', class: 'pb', title: 'الملاحظات (N)', 'aria-label': 'الملاحظات', onclick: toggleNotes }, [ico('content')]),
    touch || FOL || typeof presenterMode !== 'function' ? null : el('button', { type: 'button', class: 'pb', title: 'عرض المقدّم: شارك الشرائح وحدها في لقاء عن بُعد، وأمامك الملاحظات والمؤقّت', 'aria-label': 'عرض المقدّم', onclick: function () { const at = i; close(); presenterMode(at, !!fromView); } }, [ico('slides')]),
    el('button', { type: 'button', class: 'pb', title: 'شاشة سوداء (B)', 'aria-label': 'شاشة سوداء', onclick: function () { toggleBlank('#000'); } }, [ico('eyeoff')]),
    el('span', { class: 'psep' }),
    el('button', { type: 'button', class: 'pb', title: 'خروج (Esc)', 'aria-label': 'خروج', onclick: function () { close(); } }, [ico('close')])
  ].filter(Boolean));
  // أدوات الدرس: القلم، والقرعة، ونقاط الفرق، ونتائج الأسئلة
  if (typeof lessonPresent === 'function') ov._lesson = lessonPresent({ ov: ov, stage: stage, bar: bar, doc: doc, fromView: !!fromView, emit: fch ? function (m) { fch.postMessage(m); } : null });
  let hideT = 0; const wake = function () { ov.classList.add('awake'); clearTimeout(hideT); hideT = setTimeout(function () { ov.classList.remove('awake'); }, 2600); };
  ov.addEventListener('mousemove', wake); ov.addEventListener('touchstart', wake, { passive: true });
  // النقر: النصف الأيسر للتالية والأيمن للسابقة. السحب في الجوال: إلى اليمين للتالية (اتجاه العربية)
  let tx = null, ty = 0, swiped = false;
  stage.addEventListener('touchstart', function (e) { const t = e.touches[0]; tx = t.clientX; ty = t.clientY; swiped = false; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (tx == null) return; const t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty; tx = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) { swiped = true; if (dx > 0) next(); else prev(); }
  }, { passive: true });
  stage.addEventListener('click', function (e) { if (FOL) return; if (swiped) { swiped = false; return; } if (touch && Math.abs(e.clientX - innerWidth / 2) < innerWidth * 0.16) { wake(); return; } if (e.clientX < innerWidth / 2) next(); else prev(); });
  blank.addEventListener('click', hideBlank);
  grid.addEventListener('click', function (e) { if (e.target === grid) { grid.hidden = true; ov.focus(); } });
  function close() {
    settle(); $$('.pmbox', media).forEach(function (x) { if (x._stop) x._stop(); }); if (ov._lesson) ov._lesson.close(); document.removeEventListener('keydown', key); window.removeEventListener('resize', onResize);
    if (timer) clearInterval(timer); if (chan) chan.close(); if (fch) { try { fch.postMessage({ t: 'closed' }); fch.close(); } catch (e) {} } ov.remove();
    try { if (wakeLock) wakeLock.release(); } catch (e) {}
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
  }
  let rzT = 0; function onResize() { clearTimeout(rzT); rzT = setTimeout(function () { draw('still'); }, 120); }
  document.addEventListener('keydown', key); window.addEventListener('resize', onResize);
  document.body.appendChild(ov); draw('next'); ov.focus(); wake();
  if (fch) {
    fch.onmessage = function (e) {
      const m = e.data || {};
      if (m.t === 'ping') { fch.postMessage({ t: 'pong' }); return; }
      if (m.t === 'go') {
        const ni = Math.max(0, Math.min(pages.length - 1, m.i | 0)), ns = Math.max(0, m.step | 0);
        if (ni === i && ns === step) return;
        const mode = ni === i ? (ns === step + 1 ? 'stepf' : ns < step ? 'stepb' : 'still') : (ni === i + 1 && !ns ? 'next' : ni < i ? 'prev' : 'next');
        i = ni; step = ns; hideBlank(); if (!grid.hidden) grid.hidden = true; draw(mode); return;
      }
      if (m.t === 'blank') { if (!m.c) hideBlank(); else { blank.dataset.c = m.c; blank.hidden = false; } return; }
      if (m.t === 'media') { const b = media.querySelector('.pmbox'); if (!b) return; const v = b.querySelector('video,audio'); const btn = b.querySelector('.pmyt,.pmaudio,.pmtap,.tlplay,button'); if (v && !btn) { if (v.paused) v.play().catch(function () {}); else v.pause(); } else if (btn) btn.click(); return; }
      if (m.t === 'end') { close(); if (opts.follower) setTimeout(function () { try { window.close(); } catch (er) {} }, 150); return; }
      if (m.t === 'skip') { if (pages[m.i]) { if (m.on) pages[m.i].skip = true; else delete pages[m.i].skip; } return; }
      if (m.t === 'zoom') { setZoom(m.s, m.x, m.y); return; }
      if (m.t === 'fs') { if (document.fullscreenElement) document.exitFullscreen().catch(function () {}); else if (ov.requestFullscreen) ov.requestFullscreen().catch(function () {}); return; }
      if (m.t === 'unfollow') { FOL = ''; ov.classList.remove('follower'); wake(); return; }
      if (ov._lesson && ov._lesson.cmd) ov._lesson.cmd(m);
    };
    fch.postMessage({ t: 'ready' });
    const fsTell = function () { if (!ov.isConnected) { document.removeEventListener('fullscreenchange', fsTell); return; } try { fch.postMessage({ t: 'm-fs', on: !!document.fullscreenElement }); } catch (e) {} }; document.addEventListener('fullscreenchange', fsTell); setTimeout(fsTell, 400);
    let medOn = null; const medTell = function () { const on = !!media.querySelector('.pmbox.playing'); if (on !== medOn) { medOn = on; try { fch.postMessage({ t: 'm-media', on: on }); } catch (e) {} } };
    new MutationObserver(function () { setTimeout(medTell, 50); }).observe(media, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    // أول ثوانٍ: تنبيه صغير يختفي، يذكّر بأن هذه هي النافذة التي تُشارَك
    if (opts.follower) { const tip = el('div', { class: 'pstage-tip', text: 'هذه نافذة العرض: شاركها في لقائك. للتنقل استعمل نافذة المقدّم.' }); ov.appendChild(tip); setTimeout(function () { tip.remove(); }, 5000); }
  }
  if (!opts.follower && ov.requestFullscreen) ov.requestFullscreen().then(function () { if (touch && screen.orientation && screen.orientation.lock) return screen.orientation.lock('landscape'); }).catch(function () {});
  try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (w) { wakeLock = w; }).catch(function () {}); } catch (e) {}
  // الجوال عمودياً: تلميح بإدارة الهاتف لعرض أكبر
  if (touch && innerHeight > innerWidth) { const rot = el('div', { class: 'prot', text: 'أدِر الهاتف أفقياً لعرض أكبر' }); ov.appendChild(rot); setTimeout(function () { rot.remove(); }, 3800); }
  track('present', { tool: 'present' });
}
function markDirtySafe() { try { if (ED.open) markDirty(); } catch (e) {} }
function ytId(u) { const m = /(?:youtu\.be\/|v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/.exec(String(u || '')); return m ? m[1] : ''; }
// رابط المشغّل بحسب إعدادات العنصر
function ytEmbed(L, id) {
  const q = ['autoplay=1', 'rel=0', 'modestbranding=1', 'playsinline=1', 'iv_load_policy=3', 'hl=ar', 'cc_lang_pref=ar'];
  if (L.mute) q.push('mute=1');
  if (L.ctl === false) q.push('controls=0');
  if (+L.start) q.push('start=' + Math.floor(+L.start));
  if (+L.end) q.push('end=' + Math.floor(+L.end));
  if (L.loop) q.push('loop=1', 'playlist=' + id);
  return 'https://www.youtube-nocookie.com/embed/' + id + '?' + q.join('&');
}

/* ================= لوحة الحركة في المحرر: تبويبان منفصلان للانتقال ولحركة العناصر، وثالث للملاحظات ================= */
function slideSettings(i) { if (i !== ED.cur) { commitPage(); loadPage(i); afterPages(); } openTab('anim'); }
function curPage() { return ED.doc.pages[ED.cur]; }
// معاينة حية لحركة عنصر: شريحة صغيرة فيها عنوان وسطران يدخلون بالحركة نفسها التي في العرض
function anPreview(style) {
  const pv = el('span', { class: 'anpv', 'aria-hidden': 'true' }), sz = { w: 100, h: 60 };
  [[18, 10, 82, 25, 'a'], [30, 32, 82, 39, 'b'], [44, 45, 82, 52, 'b']].forEach(function (q) {
    const L = el('span', { class: 'pvl' }, [el('i', { class: 'pvb ' + q[4], style: 'left:' + q[0] + '%;top:' + (q[1] / 0.6) + '%;width:' + (q[2] - q[0]) + '%;height:' + ((q[3] - q[1]) / 0.6) + '%' })]);
    L._box = { x0: q[0], y0: q[1], x1: q[2], y1: q[3] }; pv.appendChild(L);
  });
  pv._play = function () {
    $$('.pswipe', pv).forEach(function (x) { x.remove(); });
    $$('.pvl', pv).forEach(function (L, k) { L.className = 'pvl'; L.removeAttribute('style'); void L.offsetWidth; if (style !== 'none') addAnim(L, style, L._box, sz, Math.round(700 * (AN_K[style] || 1)), k * 150, pv); });
  };
  return pv;
}
// معاينة حية لانتقال: شريحتان صغيرتان تتبادلان بالانتقال نفسه
function trPreview(kind) {
  const A = el('span', { class: 'pvs a' }, [el('i'), el('b'), el('b')]), B = el('span', { class: 'pvs b' }, [el('i'), el('b'), el('b')]);
  const pv = el('span', { class: 'trpv', 'aria-hidden': 'true' }, [B, A]); let cur = A, oth = B; B.style.visibility = 'hidden';
  pv._play = function () {
    [A, B].forEach(function (x) { x.getAnimations().forEach(function (a) { a.cancel(); }); x.removeAttribute('style'); });
    const o = cur, n = oth; cur = n; oth = o;
    if (kind === 'none') { o.style.visibility = 'hidden'; return; }
    runTransition(o, n, kind, transMs({ k: kind, sp: 'normal' }) + 100, 1, function () { o.style.visibility = 'hidden'; });
  };
  return pv;
}
// شبكة أشكال مقسّمة بمجموعات؛ المرور أو اللمس يشغّل المعاينة
function styleGrid(list, groups, cur, mkPv, onPick, cls, loopMs) {
  const box = el('div', { class: 'angrid' });
  groups.forEach(function (gr) {
    box.appendChild(el('small', { class: 'angl', text: gr[1] }));
    list.filter(function (x) { return x[2] === gr[0]; }).forEach(function (x) {
      const pv = mkPv(x[0]); let t = 0;
      const loop = function () { if (!bt.isConnected) { clearInterval(t); return; } pv._play(); };
      const bt = el('button', { type: 'button', class: cls + (x[0] === cur ? ' on' : ''), 'data-v': x[0], 'aria-pressed': String(x[0] === cur), title: x[1], onclick: function () {
        $$('.' + cls, box).forEach(function (q) { q.classList.remove('on'); q.setAttribute('aria-pressed', 'false'); });
        bt.classList.add('on'); bt.setAttribute('aria-pressed', 'true'); pv._play(); onPick(x[0]);
      } }, [pv, el('small', { text: x[1] })]);
      bt.addEventListener('mouseenter', function () { loop(); clearInterval(t); t = setInterval(loop, loopMs); });
      bt.addEventListener('mouseleave', function () { clearInterval(t); });
      box.appendChild(bt);
    });
  });
  setTimeout(function () { const on = box.querySelector('.' + cls + '.on .anpv, .' + cls + '.on .trpv'); if (on && on._play && box.isConnected) on._play(); }, 380);
  return box;
}
function anSection(title, note) { return [el('h4', { class: 'psh', text: title })].concat(note ? [el('p', { class: 'tiny ansub', text: note })] : []); }
function pAnim(b) {
  const doc = ED.doc, p0 = curPage(); p0.anim = p0.anim || {};
  // الصفحة تُستبدل عند كل حفظ للمسودة (commitPage)، فنقرأها من جديد عند كل تعديل ولا نحتفظ بنسخة قديمة
  const cp = curPage;
  const tab = ED.animTab || 'trans';
  b.appendChild(panelHead('الحركة'));
  b.appendChild(el('div', { class: 'antabs', role: 'tablist' }, [['trans', 'الانتقال'], ['els', 'العناصر'], ['notes', 'الملاحظات']].map(function (t) {
    return el('button', { type: 'button', role: 'tab', 'aria-selected': String(t[0] === tab), class: t[0] === tab ? 'on' : '', 'data-t': t[0], onclick: function () { ED.animTab = t[0]; buildPanel(); } }, [t[1]]);
  })));
  const prevBtn = el('button', { type: 'button', class: 'btn sm line anprev', onclick: function () { present6(false, ED.cur); } }, [ico('play'), 'عاين هذه الشريحة في العرض']);
  if (tab === 'trans') {
    // ١) الانتقال بين الشرائح
    const tr = transOf(doc, cp());
    const own = el('p', { class: 'tiny anown' });
    const showOwn = function () { const d = transOf(doc, null), mine = parseTrans(cp().trans).k; own.textContent = mine && (mine !== d.k || transOf(doc, cp()).sp !== d.sp) ? 'هذه الشريحة تختلف عن باقي العرض (' + TRANS6.find(function (x) { return x[0] === d.k; })[1] + ').' : ''; };
    b.append.apply(b, anSection('الانتقال بين الشرائح', 'كيف تدخل هذه الشريحة حين تصل إليها. مرّر على الشكل لترى حركته.'));
    b.appendChild(styleGrid(TRANS6, TRANS_GROUPS, tr.k, trPreview, function (v) { tr.k = v; cp().trans = transStr(v, tr.sp); markDirty(); showOwn(); }, 'trt', 1700));
    b.appendChild(el('div', { class: 'fld' }, [el('label', { text: 'سرعة الانتقال' }), segOf(SPEEDS6, tr.sp, function (v) { tr.sp = v; cp().trans = transStr(tr.k, v); markDirty(); showOwn(); })]));
    b.appendChild(el('div', { class: 'row wrapr anapply' }, [el('button', { type: 'button', class: 'btn sm line', onclick: function (e) {
      doc.trans = transStr(tr.k, tr.sp); doc.pages.forEach(function (q) { delete q.trans; }); markDirty(); showOwn(); doneBtn(e.currentTarget, 'طُبّق على كل الشرائح');
    } }, ['طبّق على كل الشرائح'])]));
    showOwn(); b.appendChild(own); b.appendChild(prevBtn);
  } else if (tab === 'els') {
    // ٢) حركة العناصر
    const A = p0.anim, hasItems = function () { return Object.keys(A.items || {}).some(function (k) { return A.items[k]; }); };
    // «بلا حركة» القديمة (mode: none) تصير حركةً افتراضية «بلا» بالمعنى نفسه، فتبقى لكل عنصر حركته إن شاء
    if (A.mode === 'none') { A.style = 'none'; A.items = {}; A.mode = 'auto'; }
    const effDef = function () { return animModeOf(doc, cp()) === 'none' ? 'none' : validAn(A.style || doc.animStyle || 'up'); };
    b.append.apply(b, anSection('حركة العناصر', 'كيف تظهر عناصر الشريحة: معها بالترتيب، أو بنقرة منك أثناء العرض.'));
    b.appendChild(styleGrid([['none', 'بلا', 'calm']].concat(ANIM6), AN_GROUPS, effDef(), anPreview, function (v) {
      A.style = v; A.mode = hasItems() ? 'custom' : 'auto'; markDirty(); drawRows();
    }, 'anst', 1900));
    b.appendChild(el('div', { class: 'fld' }, [el('label', { text: 'السرعة' }), segOf(SPEEDS6, A.speed || doc.animSpeed || 'normal', function (v) { A.speed = v; markDirty(); })]));
    b.appendChild(el('div', { class: 'fld' }, [el('label', { text: 'التتابع' }), segOf(SEQ6, A.seq || 'seq', function (v) { A.seq = v; markDirty(); })]));
    b.appendChild(el('div', { class: 'row wrapr anapply' }, [el('button', { type: 'button', class: 'btn sm line', onclick: function (e) {
      doc.animMode = 'auto'; doc.animStyle = effDef(); doc.animSpeed = A.speed || doc.animSpeed || 'normal';
      doc.pages.forEach(function (q) { q.anim = q.anim || {}; const a = q.anim, it = a.items || {}; Object.assign(a, { style: doc.animStyle, speed: doc.animSpeed, seq: A.seq || 'seq' }); a.mode = a.mode === 'custom' && Object.keys(it).some(function (k) { return it[k]; }) ? 'custom' : 'auto'; });
      markDirty(); doneBtn(e.currentTarget, 'طُبّق على كل الشرائح');
    } }, ['طبّق على كل الشرائح'])]));
    // لكل عنصر: حركته، وهل يظهر بنقرة (وترتيب النقرات)
    b.append.apply(b, anSection('لكل عنصر', 'غيّر حركة عنصر بعينه، أو اجعله يظهر بنقرة منك. ما يظهر بنقرة مرقّم بترتيب ظهوره.'));
    const rows = el('div', { class: 'anlist' }); b.appendChild(rows);
    function drawRows() {
      rows.innerHTML = '';
      A.items = A.items || {};
      const groups = stackOrder().all.filter(function (g) { return !S.hide['g_' + g] && ['deco', 'footer', 'academy', 'social'].indexOf(g) < 0; });
      // ما في الخطوات لعناصر غير ظاهرة الآن يبقى كما هو (لا نحذف شيئاً بصمت)، ونعرض الظاهر منها بترتيبه
      const all = (cp().steps || []).slice(), steps = all.filter(function (g) { return groups.indexOf(g) >= 0; });
      const setSteps = function (vis) { let k = 0; const out = all.map(function (g) { return groups.indexOf(g) >= 0 ? null : g; }); vis.forEach(function (g) { const j = out.indexOf(null); if (j >= 0) out[j] = g; else out.push(g); k++; }); cp().steps = out.filter(function (g) { return g; }); markDirty(); drawRows(); };
      steps.concat(groups.filter(function (g) { return steps.indexOf(g) < 0; })).forEach(function (g) {
        const k = steps.indexOf(g);
        const sel = el('select', { 'aria-label': 'حركة ' + gName(g), onchange: function (e) {
          if (e.target.value) A.items[g] = e.target.value; else delete A.items[g];
          A.mode = hasItems() ? 'custom' : 'auto'; markDirty();
        } }, [el('option', { value: '', text: 'كالشريحة (' + AN_NAME[effDef()] + ')' }), el('option', { value: 'none', text: 'بلا حركة' })].concat(AN_GROUPS.map(function (gr) {
          return el('optgroup', { label: gr[1] }, ANIM6.filter(function (x) { return x[2] === gr[0]; }).map(function (x) { return el('option', { value: x[0], text: x[1] }); }));
        })));
        sel.value = (A.mode === 'custom' && A.items[g]) || '';
        const tg = el('label', { class: 'tog', title: 'يظهر بنقرة أثناء العرض' }, [el('input', { type: 'checkbox', checked: k >= 0, 'aria-label': gName(g) + ' بنقرة', onchange: function (e) { setSteps(e.target.checked ? steps.concat([g]) : steps.filter(function (x) { return x !== g; })); } }), el('span', { text: 'بنقرة' })]);
        const mv = function (d) { const j = k + d; if (j < 0 || j >= steps.length) return; const v = steps.slice(); v.splice(j, 0, v.splice(k, 1)[0]); setSteps(v); };
        rows.appendChild(el('div', { class: 'anrow' + (k >= 0 ? ' step' : '') }, [
          el('span', { class: 'annum', text: k >= 0 ? String(k + 1) : '' }), el('b', { text: gName(g) }), tg,
          el('div', { class: 'anrow2' }, [sel, k >= 0 ? el('button', { type: 'button', class: 'ib sm', 'aria-label': 'أبكر', title: 'أبكر', disabled: k === 0, onclick: function () { mv(-1); } }, [ico('up')]) : null,
            k >= 0 ? el('button', { type: 'button', class: 'ib sm', 'aria-label': 'أخّر', title: 'أخّر', disabled: k === steps.length - 1, onclick: function () { mv(1); } }, [ico('down')]) : null])
        ]));
      });
      if (!groups.length) rows.appendChild(el('p', { class: 'tiny', text: 'لا عناصر ظاهرة في هذه الشريحة.' }));
      if (cp().tpl === 'sl_quiz') rows.appendChild(el('p', { class: 'tiny', text: 'شريحة السؤال: الجواب الصحيح يظهر بنقرة أخيرة تلقائياً.' }));
    }
    // بعد تبديل الشريحة تُبنى اللوحة قبل رسم الشريحة الجديدة، فنعيد رسم القائمة بعد الرسم
    drawRows(); setTimeout(function () { if (rows.isConnected) drawRows(); }, 0); b.appendChild(prevBtn);
  } else {
    // ٣) ملاحظات المقدّم
    b.append.apply(b, anSection('ملاحظات المقدّم', 'تراها وحدك أثناء العرض (N) أو في نافذة المقدّم.'));
    const notes = el('textarea', { rows: '7', dir: 'auto', placeholder: 'ما تريد تذكّره وأنت تعرض هذه الشريحة.', oninput: function (e) { cp().notes = e.target.value; markDirty(); } }); notes.value = cp().notes || '';
    b.appendChild(withEmoji(notes));
  }
}
// زر يُظهر أنه انتهى: ✓ ثم يعود
function doneBtn(btn, text) { btnDone(btn, text); }

/* ---------- وسائط الشريحة: فيديو وصوت من الجهاز، ورابط يوتيوب (تستدعيها لوحة الوسائط) ---------- */
function mediaPanelSection(b) {
  if (!ED.doc || ED.doc.kind !== 'deck') return;
  const mb = V6.settings.maxUploadMb || 20;
  const sec = el('div', { class: 'mediasec' });
  sec.append(el('h4', { class: 'psh', text: 'تلاوة وفيديو وصوت' }), el('p', { class: 'tiny', text: 'تعمل أثناء العرض الحي، وتبقى بطاقة في PDF. الملفات حتى ' + mb + ' ميغابايت.' }));
  // زر يعرض أنه يعمل ثم ✓ (withBusy يعرض الخطأ إن أخفق)
  function busy(btn, label, fn) { withBusy(btn, fn, { busy: label, done: 'أُضيف' }).catch(function () {}); }
  let vBtn, aBtn;
  const vf = el('input', { type: 'file', accept: 'video/mp4,video/webm,video/quicktime', hidden: true, onchange: function (e) {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    if (f.size > mb * 1048576) { toast('الفيديو أكبر من ' + mb + ' ميغابايت'); return; }
    busy(vBtn, 'نرفع الفيديو…', async function () { const poster = await videoPoster(f); const pa = poster ? await uploadAsset(poster, { kind: 'image', name: f.name + ' (ملصق)' }) : null; const r = await uploadAsset(f, { kind: 'video', name: f.name }); addLayer6({ t: 'video', ref: 'asset:' + r.id, poster: pa ? 'asset:' + pa.id : '', w: 0.5, title: f.name.replace(/\.[^.]+$/, '') }); });
  } });
  const af = el('input', { type: 'file', accept: 'audio/*', hidden: true, onchange: function (e) {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    if (f.size > mb * 1048576) { toast('الملف أكبر من ' + mb + ' ميغابايت'); return; }
    busy(aBtn, 'نرفع الصوت…', async function () { const r = await uploadAsset(f, { kind: 'audio', name: f.name }); addLayer6({ t: 'audio', ref: 'asset:' + r.id, w: 0.26, title: f.name.replace(/\.[^.]+$/, '').slice(0, 30) }); });
  } });
  vBtn = el('button', { type: 'button', class: 'mdtile', onclick: function () { vf.click(); } }, [ico('play'), el('span', { text: 'فيديو من الجهاز' })]);
  aBtn = el('button', { type: 'button', class: 'mdtile', onclick: function () { af.click(); } }, [ico('bell'), el('span', { text: 'ملف صوت' })]);
  const yBtn = el('button', { type: 'button', class: 'mdtile yt', onclick: ytDialog }, [svgOf('<rect x="8" y="22" width="84" height="56" rx="16" fill="currentColor"/><path d="M42 37v26l22-13z" fill="#fff"/>'), el('span', { text: 'رابط يوتيوب' })]);
  const tBtn = typeof tilawaDialog === 'function' ? el('button', { type: 'button', class: 'mdtile tl', onclick: function () { tilawaDialog(); } }, [ico('book'), el('span', { text: 'تلاوة آيات بصوت قارئ' })]) : null;
  sec.append(vf, af, el('div', { class: 'mdtiles' }, [tBtn, yBtn, vBtn, aBtn]));
  b.appendChild(sec);
}
// إضافة يوتيوب: الرابط والعنوان في نافذة واحدة، مع صورة المقطع للتأكد
function ytDialog() {
  const u = el('input', { type: 'url', class: 'inp', dir: 'ltr', placeholder: 'https://youtu.be/…', 'aria-label': 'رابط يوتيوب' });
  const t = el('input', { type: 'text', class: 'inp', placeholder: 'اختياري', 'aria-label': 'العنوان على البطاقة' });
  const th = el('img', { class: 'ytthumb', alt: '', hidden: true, onerror: function () { th.hidden = true; } });
  const msg = el('p', { class: 'tiny' });
  u.addEventListener('input', function () { const id = ytId(u.value); th.hidden = !id; if (id) th.src = 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg'; msg.textContent = u.value && !id ? 'الرابط ليس رابط يوتيوب.' : ''; });
  modal({ title: 'مقطع يوتيوب', body: [el('div', { class: 'fld' }, [el('label', { text: 'الرابط' }), u]), th, msg, el('div', { class: 'fld' }, [el('label', { text: 'العنوان على البطاقة' }), t])],
    acts: [{ t: 'أضف', cls: 'dark', fn: function () { const id = ytId(u.value); if (!id) { msg.textContent = 'الصق رابط مقطع من يوتيوب.'; u.focus(); return false; } addLayer6({ t: 'yt', url: 'https://www.youtube.com/watch?v=' + id, w: 0.5, title: t.value.trim() }); toast('✓ أُضيف المقطع. إعداداته من الشريط فوقه.'); } }, { t: 'إلغاء' }] });
}
// أول إطار من الفيديو ملصقاً (PNG بجودته)
function videoPoster(file) {
  return new Promise(function (ok) {
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto';
    const u = URL.createObjectURL(file); v.src = u;
    const done = function (blob) { URL.revokeObjectURL(u); ok(blob ? new File([blob], 'poster.png', { type: 'image/png' }) : null); };
    v.onloadeddata = function () { v.currentTime = Math.min(1, (v.duration || 2) / 4); };
    v.onseeked = function () { try { const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0); c.toBlob(done, 'image/png'); } catch (e) { done(null); } };
    v.onerror = function () { done(null); };
    setTimeout(function () { if (v.readyState < 2) done(null); }, 8000);
  });
}

/* ---------- إعدادات عنصر الوسائط (تُستدعى من لوحة العنصر): التشغيل، والمقطع، والشكل، والموضع ---------- */
function parseClock(s) { s = String(s || '').trim().replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }); if (!s) return 0; const a = s.split(/[:.،,]/).map(Number); if (a.some(isNaN)) return NaN; return a.reduce(function (t, x) { return t * 60 + x; }, 0); }
function fmtClock(n) { n = Math.floor(+n || 0); if (!n) return ''; const h = Math.floor(n / 3600), m = Math.floor(n % 3600 / 60), s = n % 60; return (h ? h + ':' + ('0' + m).slice(-2) : m) + ':' + ('0' + s).slice(-2); }
const YT_AR = { '16:9': 9 / 16, '9:16': 16 / 9, '4:3': 3 / 4, '1:1': 1 };
function mediaElSettings(L, b) {
  if (!isMedia(L)) return;
  if (L.qr && typeof tilawaSettings === 'function') { tilawaSettings(L, b); return; }
  const vis = L.t !== 'audio', set = function (k, v) { if (v === undefined || v === '' || (v === false && k !== 'ctl')) delete L[k]; else L[k] = v; changed6(); };
  const box = el('div', { class: 'mset' });
  box.append.apply(box, anSection('في العرض الحي', L.t === 'yt' ? 'يعمل المقطع داخل العرض نفسه حين تصل إلى شريحته.' : 'يعمل الملف حين تصل إلى شريحته.'));
  box.appendChild(el('div', { class: 'fld' }, [el('label', { text: 'التشغيل' }), segMini([['btn', 'بزر تشغيل'], ['auto', 'تلقائياً مع الشريحة']], L.auto ? 'auto' : 'btn', function (v) { set('auto', v === 'auto'); })]));
  // جزء من المقطع
  const tIn = function (k, ph) { const i = el('input', { type: 'text', class: 'inp sm', dir: 'ltr', inputmode: 'numeric', placeholder: ph, value: fmtClock(L[k]), onchange: function (e) { const n = parseClock(e.target.value); if (isNaN(n)) { toast('اكتب الوقت هكذا: 1:30'); e.target.value = fmtClock(L[k]); return; } set(k, n || undefined); e.target.value = fmtClock(n); } }); return i; };
  box.appendChild(el('div', { class: 'mtime' }, [el('label', {}, [el('span', { text: 'يبدأ من' }), tIn('start', '0:00')]), el('label', {}, [el('span', { text: 'وينتهي عند' }), tIn('end', 'آخره')])]));
  const tog = function (k, text, on) { return el('label', { class: 'tog' }, [el('input', { type: 'checkbox', checked: on, onchange: function (e) { set(k, k === 'ctl' ? (e.target.checked ? undefined : false) : e.target.checked); } }), el('span', { text: text })]); };
  box.appendChild(el('div', { class: 'mtogs' }, [tog('mute', 'بلا صوت', !!L.mute), tog('loop', 'يتكرر', !!L.loop), L.t === 'audio' ? null : tog('ctl', 'أزرار التحكم', L.ctl !== false)]));
  if (vis) {
    box.append.apply(box, anSection('الشكل', ''));
    if (L.t === 'yt') box.appendChild(el('div', { class: 'fld' }, [el('label', { text: 'المقاس' }), segMini([['16:9', 'عريض'], ['9:16', 'عمودي'], ['4:3', '٤:٣'], ['1:1', 'مربع']], L.ar || '16:9', function (v) { set('ar', v === '16:9' ? undefined : v); })]));
    if (L.t === 'video') box.appendChild(el('div', { class: 'fld' }, [el('label', { text: 'الصورة في الإطار' }), segMini([['contain', 'كاملة'], ['cover', 'تملأ الإطار']], L.fit === 'cover' ? 'cover' : 'contain', function (v) { set('fit', v === 'cover' ? 'cover' : undefined); })]));
    box.appendChild(el('div', { class: 'fld' }, [el('label', { text: 'حين يعمل' }), segMini([['', 'في مكانه'], ['full', 'يملأ الشريحة']], L.full ? 'full' : '', function (v) { set('full', v === 'full'); })]));
    box.appendChild(slider('استدارة الحواف', L.r != null ? L.r : 0.06, 0, 0.5, 0.01, function (v) { return Math.round(v * 200) + '٪'; }, function (v) { L.r = v; }));
    box.appendChild(el('div', { class: 'fld' }, [el('label', { text: 'الإطار' }), segMini([['', 'بلا'], ['#ffffff', 'أبيض'], ['p', 'بلون الهوية']], L.fr || '', function (v) { set('fr', v); })]));
    box.appendChild(el('div', { class: 'mtogs' }, [tog('sh', 'ظل', !!L.sh)]));
    // مواضع جاهزة: تحسب الحجم من نسبة البطاقة حتى لا تخرج عن الشريحة
    const sz = SIZES[S.size] || SIZES.slide, gb = LASTG['L:' + L.id];
    const ar = L.t === 'yt' ? (YT_AR[L.ar] || 9 / 16) : (gb ? (gb.y1 - gb.y0) / Math.max(1, gb.x1 - gb.x0) : 9 / 16), fitW = function (hf) { return hf * sz.h / (ar * sz.w); };
    const pos = function (w, x, yf) { L.w = +w.toFixed(4); L.x = +x.toFixed(4); const hf = L.w * sz.w * ar / sz.h; L.y = +(yf == null ? 0.5 : yf(hf)).toFixed(4); changed6(); };
    box.append.apply(box, anSection('الموضع', ''));
    box.appendChild(el('div', { class: 'mpos' }, [
      ['ملء الشريحة', 'full', function () { const w = Math.min(1, fitW(1)); pos(w, 0.5); }],
      ['كبير في الوسط', 'mid', function () { const w = Math.min(0.78, fitW(0.8)); pos(w, 0.5); }],
      ['النصف الأيمن', 'right', function () { const w = Math.min(0.46, fitW(0.8)); pos(w, 1 - 0.04 - w / 2); }],
      ['النصف الأيسر', 'left', function () { const w = Math.min(0.46, fitW(0.8)); pos(w, 0.04 + w / 2); }],
      ['صغير في الزاوية', 'corner', function () { const w = Math.min(0.3, fitW(0.4)); pos(w, 0.04 + w / 2, function (hf) { return 1 - 0.06 - hf / 2; }); }]
    ].map(function (x) { return el('button', { type: 'button', class: 'mposb', title: x[0], onclick: x[2] }, [el('i', { class: 'mp-' + x[1] }), el('small', { text: x[0] })]); })));
  }
  b.appendChild(box);
}

/* ---------- افتح في كانفا: ملف PDF للعرض ثم كانفا في علامة تبويب جديدة ---------- */
async function openInCanva() {
  if (!ED.doc || ED.doc.kind !== 'deck') return;
  const st = el('div', { class: 'cvst' }, [el('span', { class: 'spin' }), el('span', { text: 'نجهّز ملف PDF للعرض…' })]);
  const go = el('a', { class: 'btn dark cvgo', href: 'https://www.canva.com/', target: '_blank', rel: 'noopener' }, [el('span', { text: 'افتح كانفا' }), el('span', { text: '↗' })]);
  modal({ title: 'افتح العرض في كانفا', body: [
    el('p', { class: 'muted', text: 'ارفع الملف في كانفا (إنشاء تصميم ← استيراد ملف) فيصير عرضاً تعدّله هناك.' }),
    el('ol', { class: 'cvsteps' }, [el('li', { text: 'ينزل ملف PDF للعرض الآن.' }), el('li', { text: 'افتح كانفا واختر «إنشاء تصميم» ثم «استيراد ملف».' }), el('li', { text: 'تصل كل شريحة صورة، فتضيف فوقها وتعدّل ما شئت.' })]),
    st, go], acts: [{ t: 'إغلاق' }] });
  let ok = false;
  try { ok = await exportPdf6(); } catch (e) { toast(e.message); }
  st.replaceChildren.apply(st, ok ? [el('span', { class: 'ok', text: '✓ نزل ملف العرض' }), el('bdi', { class: 'tiny', text: fileName6('pdf') })]
    : [el('span', { class: 'err', text: 'لم ينزل الملف.' }), el('button', { type: 'button', class: 'btn sm line', onclick: function () { closeModals(); openInCanva(); } }, ['أعد المحاولة'])]);
  st.classList.add('done');
}

/* ---------- من درس إلى عرض بالذكاء: نص أو ملف → مخطط تراجعه → شرائح ---------- */
async function fileToText(f) {
  if (/\.docx$/i.test(f.name)) return await docxText(f);
  if (/^text\//.test(f.type) || /\.(txt|md)$/i.test(f.name)) return await f.text();
  return '';
}
// استخراج نص Word بلا مكتبات: الملف أرشيف zip فيه word/document.xml
async function docxText(f) {
  const buf = new Uint8Array(await f.arrayBuffer()), dv = new DataView(buf.buffer);
  let eocd = -1; for (let i = buf.length - 22; i >= Math.max(0, buf.length - 70000); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
  if (eocd < 0) throw new Error('ملف Word غير صالح');
  const n = dv.getUint16(eocd + 10, true), cd = dv.getUint32(eocd + 16, true);
  let p = cd, entry = null;
  for (let k = 0; k < n; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(buf.subarray(p + 46, p + 46 + nlen));
    if (name === 'word/document.xml') { entry = { method: method, csize: csize, off: off }; break; }
    p += 46 + nlen + elen + clen;
  }
  if (!entry) throw new Error('لم نجد نص المستند');
  const lh = entry.off, lnlen = dv.getUint16(lh + 26, true), lelen = dv.getUint16(lh + 28, true), start = lh + 30 + lnlen + lelen;
  const data = buf.subarray(start, start + entry.csize);
  let xml;
  if (entry.method === 0) xml = new TextDecoder().decode(data);
  else { const ds = new DecompressionStream('deflate-raw'); const w = ds.writable.getWriter(); w.write(data); w.close(); xml = await new Response(ds.readable).text(); }
  return xml.replace(/<\/w:p>/g, '\n').replace(/<w:tab\/>/g, '\t').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\n{3,}/g, '\n\n').trim();
}
function lessonCard(T) {
  const ta = el('textarea', { rows: '6', dir: 'auto', placeholder: 'الصق نص الدرس أو المحاضرة أو ملخصها هنا…' });
  const fi = el('input', { type: 'file', accept: '.pdf,.docx,.txt,.md,application/pdf', hidden: true });
  const fname = el('span', { class: 'tiny' });
  let pdf = null;
  fi.onchange = async function (e) { const f = e.target.files[0]; e.target.value = ''; if (!f) return; pdf = null;
    if (/pdf$/i.test(f.name) || f.type === 'application/pdf') { if (f.size > 20 * 1048576) { toast('الملف أكبر من ٢٠ ميغابايت'); return; } pdf = { mime: 'application/pdf', b64: await blobToB64(f), name: f.name }; fname.textContent = 'ملف: ' + f.name; return; }
    try { const t = await fileToText(f); if (!t) { toast('لم نستطع قراءة الملف'); return; } ta.value = t.slice(0, 60000); fname.textContent = 'قُرئ: ' + f.name; } catch (er) { toast(er.message); }
  };
  const ai = aiReady();
  const btn = el('button', { type: 'button', class: 'btn dark', onclick: async function () {
    if (!ta.value.trim() && !pdf) { toast('الصق نصاً أو اختر ملفاً'); return; }
    btn.disabled = true; btn.replaceChildren(el('span', { class: 'spin' }), ' يقرأ المساعد ويرتّب…'); if (!btn.parentNode.querySelector('.notifyrow')) btn.parentNode.appendChild(notifyBtn());
    try { const o = await outlineAI(ta.value, pdf, T); notifyDone('مخطط العرض جاهز', 'راجعه ثم ابنِ الشرائح'); outlineDialog(o, T); } catch (er) { toast(er.message); }
    btn.disabled = false; btn.replaceChildren(ico('ai'), 'رتّبه عرضاً');
  } }, [ico('ai'), 'رتّبه عرضاً']);
  return el('div', { class: 'card rv', style: '--d:2' }, [el('span', { class: 'icon-tile t-pu' }, [ico('ai')]), el('h3', { text: 'من درس إلى عرض بالذكاء' }),
    el('p', { class: 'muted small', text: ai ? 'الصق الدرس أو ارفع ملف PDF أو Word، فيخرج المساعد مخططاً تراجعه وتعدّله، ثم يبني الشرائح بهوية البرنامج.' : 'يحتاج المساعد الذكي. بلا مساعد: اكتب نقاطك في «من نقاطك».' }),
    el('div', { class: 'fld' }, [ta]), el('div', { class: 'row wrapr' }, [fi, el('button', { type: 'button', class: 'btn sm line', onclick: function () { fi.click(); } }, [ico('upload'), 'ملف PDF أو Word']), fname]),
    ai ? btn : null]);
}
async function outlineAI(text, pdf, T) {
  const system = ['أنت تحوّل درساً أو محاضرة إلى مخطط عرض شرائح لبرنامج تربوي عربي. اقرأ المادة كلها ثم رتّبها.',
    'أعد JSON: title عنوان العرض (قصير)، sub سطر تحته، sections من ٣ إلى ٩ أقسام، كل قسم: title، وpoints من ٢ إلى ٦ نقاط قصيرة (كل نقطة جملة واحدة ≤ ١٢ كلمة)، وquote اقتباس حرفي من المادة إن وُجد (آية أو حديث أو عبارة مؤثرة) مع نسبته في quoteBy.',
    'questions: سؤالان على الأكثر للمراجعة من المادة نفسها: q نص السؤال، options أربعة خيارات، answer رقم الصحيح (١-٤).',
    'closing: جملة ختامية قصيرة. لا تضف معلومات من خارج المادة. العناوين بلا ترقيم.'].join('\n');
  const schema = { type: 'OBJECT', properties: { title: { type: 'STRING' }, sub: { type: 'STRING' }, sections: { type: 'ARRAY', items: { type: 'OBJECT', properties: { title: { type: 'STRING' }, points: { type: 'ARRAY', items: { type: 'STRING' } }, quote: { type: 'STRING' }, quoteBy: { type: 'STRING' } }, required: ['title', 'points'] } },
    questions: { type: 'ARRAY', items: { type: 'OBJECT', properties: { q: { type: 'STRING' }, options: { type: 'ARRAY', items: { type: 'STRING' } }, answer: { type: 'NUMBER' } }, required: ['q', 'options', 'answer'] } }, closing: { type: 'STRING' } }, required: ['title', 'sections'] };
  const raw = await API6.call('ai_make', V6.token, JSON.stringify({ kind: 'outline', program: V6.prog.id, system: system, prompt: text ? 'المادة:\n' + text.slice(0, 60000) : 'المادة في الملف المرفق.', files: pdf ? [{ mime: pdf.mime, b64: pdf.b64 }] : [], schema: schema, temperature: 0.4 }));
  const o = JSON.parse(raw); if (!o.sections || !o.sections.length) throw new Error('لم يخرج المساعد مخططاً. جرّب نصاً أوضح.');
  return o;
}
function outlineDialog(o, T) {
  const titleI = el('input', { type: 'text', class: 'inp', value: o.title || '' }), subI = el('input', { type: 'text', class: 'inp', value: o.sub || '' });
  const secs = (o.sections || []).map(function (s) { return { title: s.title || '', points: (s.points || []).join('\n'), quote: s.quote || '', quoteBy: s.quoteBy || '', on: true }; });
  const qs = (o.questions || []).slice(0, 2).map(function (q) { return { q: q.q, options: (q.options || []).join('\n'), answer: q.answer || 1, on: true }; });
  const list = el('div', { class: 'olist' });
  function draw() {
    list.innerHTML = '';
    secs.forEach(function (s, i) {
      list.appendChild(el('div', { class: 'osec' + (s.on ? '' : ' off') }, [
        el('div', { class: 'row' }, [el('input', { type: 'checkbox', checked: s.on, onchange: function (e) { s.on = e.target.checked; draw(); } }), el('input', { type: 'text', class: 'inp sm', value: s.title, placeholder: 'عنوان القسم', oninput: function (e) { s.title = e.target.value; } }),
          el('button', { type: 'button', class: 'ib sm', 'aria-label': 'للأعلى', disabled: i === 0, onclick: function () { secs.splice(i - 1, 0, secs.splice(i, 1)[0]); draw(); } }, [ico('up')]),
          el('button', { type: 'button', class: 'ib sm', 'aria-label': 'للأسفل', disabled: i === secs.length - 1, onclick: function () { secs.splice(i + 1, 0, secs.splice(i, 1)[0]); draw(); } }, [ico('down')])]),
        el('textarea', { rows: '3', dir: 'auto', placeholder: 'النقاط، كل نقطة في سطر', oninput: function (e) { s.points = e.target.value; } }, [s.points]),
        s.quote ? el('input', { type: 'text', class: 'inp sm', value: s.quote, placeholder: 'اقتباس', oninput: function (e) { s.quote = e.target.value; } }) : null
      ]));
    });
    qs.forEach(function (q) { list.appendChild(el('div', { class: 'osec' + (q.on ? '' : ' off') }, [el('div', { class: 'row' }, [el('input', { type: 'checkbox', checked: q.on, onchange: function (e) { q.on = e.target.checked; draw(); } }), el('span', { class: 'pill', text: 'سؤال' }), el('input', { type: 'text', class: 'inp sm', value: q.q, oninput: function (e) { q.q = e.target.value; } })]), el('textarea', { rows: '3', dir: 'auto', oninput: function (e) { q.options = e.target.value; } }, [q.options])])); });
    list.appendChild(el('button', { type: 'button', class: 'btn sm line', onclick: function () { secs.push({ title: 'قسم جديد', points: '', on: true }); draw(); } }, [ico('plus'), 'قسم']));
  }
  draw();
  modal({ title: 'مخطط العرض: راجعه وعدّله', wide: true, body: [aiNotice('المخطط من المساعد وقد يسقط نقطة أو يسيء فهم أخرى؛ راجعه وعدّله قبل البناء.'), el('div', { class: 'grid two' }, [el('div', { class: 'fld' }, [el('label', { text: 'عنوان العرض' }), titleI]), el('div', { class: 'fld' }, [el('label', { text: 'سطر تحته' }), subI])]), list],
    acts: [{ t: 'ابنِ الشرائح', cls: 'dark', fn: function () {
      const slides = [{ tpl: 'sl_cover', d: { title: titleI.value, sub: subI.value } }];
      secs.filter(function (s) { return s.on; }).forEach(function (s, i) {
        slides.push({ tpl: 'sl_section', d: { title: s.title, num: String(i + 1) } });
        const pts = lines(s.points); if (pts.length) slides.push({ tpl: 'sl_points', d: { title: s.title, body: pts.join('\n') } });
        if (s.quote) slides.push({ tpl: 'sl_quote', d: { body: s.quote, src: s.quoteBy || '' } });
      });
      qs.filter(function (q) { return q.on; }).forEach(function (q) { slides.push({ tpl: 'sl_quiz', d: { q: q.q, opts: q.options, ans: String(q.answer || 1), reveal: false } }); });
      slides.push({ tpl: 'sl_end', d: { title: 'شكراً لحضوركم', sub: o.closing || '' } });
      openDeckNew(T.id, slides, titleI.value || 'عرض جديد');
      track('make', { tool: 'outline' });
    } }, { t: 'إلغاء' }] });
}
