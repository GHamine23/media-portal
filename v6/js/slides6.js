/* ================= العرض الحي: انتقالات، وظهور تدريجي، ووسائط، وسؤال وجواب، ومؤقّت، وملاحظات المقدّم =================
   الشرائح تُرسم بمحرك القوالب نفسه (فهي مطابقة لما يُنزَّل PDF)، والوسائط عناصر HTML تُوضع فوق مكانها في اللوحة أثناء العرض فقط. */
const TRANS = [['fade', 'تلاشٍ'], ['slide', 'انزلاق'], ['zoom', 'تكبير'], ['flip', 'قلب'], ['none', 'بلا']];
const EASE6 = 'cubic-bezier(.22,1,.36,1)';
function transKeyframes(kind, out) {
  const k = {
    fade: [[{ opacity: 1 }, { opacity: 0 }], [{ opacity: 0 }, { opacity: 1 }]],
    slide: [[{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(45%)', opacity: 0 }], [{ transform: 'translateX(-45%)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }]],
    zoom: [[{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.7)', opacity: 0 }], [{ transform: 'scale(1.25)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }]],
    flip: [[{ transform: 'perspective(1600px) rotateY(0)', opacity: 1 }, { transform: 'perspective(1600px) rotateY(80deg)', opacity: 0 }], [{ transform: 'perspective(1600px) rotateY(-80deg)', opacity: 0 }, { transform: 'perspective(1600px) rotateY(0)', opacity: 1 }]]
  }[kind] || [[{ opacity: 1 }, { opacity: 1 }], [{ opacity: 1 }, { opacity: 1 }]];
  return out ? k[0] : k[1];
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
function renderSlide(c, p, T, scale, collect) { const tpl = TEMPLATES.find(function (t) { return t.id === p.tpl; }); return renderTo(c, tpl, p.size || 'slide', p, T, scale, collect); }

function present6(fromView, startAt) {
  if (!fromView) commitPage();
  const doc = ED.doc, pages = doc.pages, T = S.track;
  let i = startAt != null ? startAt : (fromView ? 0 : ED.cur), step = 0, timer = null, timerLeft = 0, notesOn = false;
  const stage = el('div', { class: 'pstage' }), media = el('div', { class: 'pmedia' });
  const bar = el('div', { class: 'pbar' }), counter = el('span', { class: 'pcount' }), timerEl = el('div', { class: 'ptimer', hidden: true }), notesEl = el('aside', { class: 'pnotes', hidden: true });
  stage.appendChild(media);
  const ov = el('div', { class: 'present6', tabindex: '0' }, [stage, timerEl, notesEl, bar, el('div', { class: 'phint', text: 'الأسهم للتنقل · N الملاحظات · T المؤقّت · Esc للخروج' })]);
  let cur = null, chan = null;
  try { chan = new BroadcastChannel('athar-present'); } catch (e) {}
  function fitStage() {
    const sz = SIZES[pages[i].size || 'slide'], aw = innerWidth - (notesOn ? 320 : 0), r = Math.min(aw / sz.w, innerHeight / sz.h);
    stage.style.width = Math.round(sz.w * r) + 'px'; stage.style.height = Math.round(sz.h * r) + 'px';
    return r;
  }
  function placeMedia(p, boxes) {
    media.innerHTML = '';
    const sz = SIZES[p.size || 'slide'], r = media.clientWidth / sz.w;
    (p.layers || []).forEach(function (L) {
      if (L.t !== 'video' && L.t !== 'yt' && L.t !== 'audio') return;
      const b = boxes['L:' + L.id]; if (!b || (p.hide || {})['g_L:' + L.id]) return;
      const box = el('div', { class: 'pmbox', style: 'left:' + (b.x0 * r) + 'px;top:' + (b.y0 * r) + 'px;width:' + ((b.x1 - b.x0) * r) + 'px;height:' + ((b.y1 - b.y0) * r) + 'px' });
      if (L.t === 'yt') { box.appendChild(el('a', { class: 'pmyt', href: L.url, target: '_blank', rel: 'noopener', title: 'يفتح في يوتيوب' })); }
      else if (L.t === 'video') {
        const v = el('video', { class: 'pmvideo', playsinline: '', controls: '', preload: 'metadata' });
        assetURL(V6.assets[L.ref.slice(6)] || { id: L.ref.slice(6), ver: 1, mime: 'video/mp4' }).then(function (u) { v.src = u; }).catch(function () {});
        box.appendChild(v);
      } else {
        const a = el('audio', { preload: 'metadata' });
        assetURL(V6.assets[L.ref.slice(6)] || { id: L.ref.slice(6), ver: 1, mime: 'audio/mpeg' }).then(function (u) { a.src = u; }).catch(function () {});
        box.appendChild(a); box.appendChild(el('button', { type: 'button', class: 'pmaudio', 'aria-label': 'تشغيل الصوت', onclick: function () { if (a.paused) { a.play(); box.classList.add('playing'); } else { a.pause(); box.classList.remove('playing'); } } }));
      }
      media.appendChild(box);
    });
  }
  let animTimers = [];
  function clearAnims() { animTimers.forEach(clearTimeout); animTimers = []; $$('.pan', stage).forEach(function (x) { x.remove(); }); }
  // قناع الفرق بين حالتين: ما ظهر جديداً فقط (العنصر وحده على شفافية)
  function diffCanvas(a, b) {
    const w = a.width, h = a.height, c = document.createElement('canvas'); c.width = w; c.height = h;
    const da = a.getContext('2d').getImageData(0, 0, w, h).data, ib = b.getContext('2d').getImageData(0, 0, w, h), db = ib.data;
    let any = false;
    for (let i = 0; i < db.length; i += 4) { if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) < 18 && Math.abs(da[i + 3] - db[i + 3]) < 18) db[i + 3] = 0; else any = true; }
    if (!any) return null;
    c.getContext('2d').putImageData(ib, 0, 0); return c;
  }
  function renderState(q, scale) { const c = document.createElement('canvas'); q.d.__n = i ? String(i + 1) : ''; renderSlide(c, q, T, scale); return c; }
  function elementsOf(q, boxes) {
    const keys = Object.keys(boxes).filter(function (g) { return g !== 'deco' && g !== 'footer' && g !== 'academy' && g !== 'social'; });
    const hidden = q.hide || {}; return keys.filter(function (g) { return !hidden['g_' + g]; }).sort(function (x, y) { return (boxes[x].y0 - boxes[y].y0) || (boxes[y].x0 - boxes[x].x0); });
  }
  function animOf(p, g) { const A = p.anim || {}; if (A.mode === 'none') return 'none'; if (A.mode === 'custom' && A.items && A.items[g]) return A.items[g]; return A.style || doc.animStyle || 'up'; }
  function animDur(p) { const sp = (p.anim || {}).speed || doc.animSpeed || 'normal'; return sp === 'fast' ? 420 : sp === 'slow' ? 1100 : 700; }
  function playEntrance(p, q, boxes, scale, groups, stagger) {
    // q: الحالة النهائية. نرسم الحالة بلا هذه العناصر ثم نضيفها واحداً واحداً بأقنعة متحركة
    const dur = animDur(p), gap = stagger == null ? Math.min(220, Math.max(90, 900 / Math.max(1, groups.length))) : stagger;
    const base = JSON.parse(JSON.stringify(q)); base.hide = Object.assign({}, base.hide); groups.forEach(function (g) { base.hide['g_' + g] = true; });
    let prev = renderState(base, scale);
    const layers = [];
    groups.forEach(function (g, k) {
      const st = JSON.parse(JSON.stringify(base)); groups.slice(0, k + 1).forEach(function (x) { delete st.hide['g_' + x]; });
      const cur2 = renderState(st, scale), mask = diffCanvas(prev, cur2); prev = cur2;
      if (!mask) return;
      const style = animOf(p, g); if (style === 'none') { mask.className = 'pcv pan'; stage.appendChild(mask); return; }
      mask.className = 'pcv pan an-' + style; mask.style.setProperty('--dur', dur + 'ms'); mask.style.animationDelay = (k * gap) + 'ms';
      const b = boxes[g]; if (b) mask.style.transformOrigin = ((b.x0 + b.x1) / 2 / (SIZES[p.size || 'slide'].w)) * 100 + '% ' + ((b.y0 + b.y1) / 2 / (SIZES[p.size || 'slide'].h)) * 100 + '%';
      stage.appendChild(mask); layers.push(mask);
    });
    return { base: null, total: groups.length * gap + dur };
  }
  function draw(dir) {
    clearAnims();
    const p = pages[i], r = fitStage(), scale = r * Math.min(2, devicePixelRatio || 1);
    const c = el('canvas', { class: 'pcv' });
    const q = pageAtStep(p, step); q.d.__n = i ? String(i + 1) : '';
    const boxes = renderSlide(c, q, T, scale, true) || {};
    const kind = p.trans || doc.trans || 'fade';
    const A = p.anim || {}, mode = A.mode || doc.animMode || 'auto', animate = mode !== 'none' && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (dir === 'step' && animate && step > 0 && stepsOf(p)[step - 1] !== '__answer') {
      // خطوة بنقرة: العنصر الجديد وحده يدخل بحركته، وما قبله ثابت
      const g = stepsOf(p)[step - 1], before = pageAtStep(p, step - 1); before.d.__n = q.d.__n;
      const prevC = renderState(before, scale), mask = diffCanvas(prevC, c);
      if (cur) cur.remove(); stage.appendChild(prevC); prevC.className = 'pcv'; cur = prevC;
      if (mask) { const style = animOf(p, g) === 'none' ? 'fade' : animOf(p, g); mask.className = 'pcv pan an-' + style; mask.style.setProperty('--dur', animDur(p) + 'ms'); const b = boxes[g]; if (b) mask.style.transformOrigin = ((b.x0 + b.x1) / 2 / SIZES[p.size || 'slide'].w) * 100 + '% ' + ((b.y0 + b.y1) / 2 / SIZES[p.size || 'slide'].h) * 100 + '%'; stage.appendChild(mask); }
      animTimers.push(setTimeout(function () { if (cur !== prevC) return; stage.appendChild(c); c.className = 'pcv'; prevC.remove(); cur = c; $$('.pan', stage).forEach(function (x) { x.remove(); }); }, animDur(p) + 60));
    } else if (dir === 'step' && animate && step > 0) {
      // كشف الجواب: تلاشٍ ناعم
      if (cur) { const old = cur; old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).onfinish = function () { old.remove(); }; }
      stage.appendChild(c); cur = c; c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: EASE6 });
    } else if (dir !== 'step' && animate) {
      // دخول شريحة: الخلفية تنتقل، ثم تدخل العناصر بترتيبها
      const groups = elementsOf(q, boxes).filter(function (g) { return stepsOf(p).indexOf(g) < 0 || stepsOf(p).indexOf(g) < step; });
      const base = JSON.parse(JSON.stringify(q)); base.hide = Object.assign({}, base.hide); groups.forEach(function (g) { base.hide['g_' + g] = true; });
      const bg = renderState(base, scale); bg.className = 'pcv';
      if (cur) { const old = cur; old.animate(transKeyframes(kind, true), { duration: 420, easing: EASE6, fill: 'forwards' }).onfinish = function () { old.remove(); }; }
      stage.appendChild(bg); cur = bg; bg.animate(transKeyframes(kind, false), { duration: 480, easing: EASE6, fill: 'forwards' });
      const res = playEntrance(p, q, boxes, scale, groups);
      animTimers.push(setTimeout(function () { if (cur !== bg) return; stage.appendChild(c); c.className = 'pcv'; bg.remove(); cur = c; $$('.pan', stage).forEach(function (x) { x.remove(); }); }, 480 + (res ? res.total : 0) + 80));
    } else {
      if (cur && dir !== 'step') { const old = cur; old.animate(transKeyframes(kind, true), { duration: 420, easing: EASE6, fill: 'forwards' }).onfinish = function () { old.remove(); }; }
      else if (cur) cur.remove();
      stage.appendChild(c); cur = c;
      if (dir === 'step') c.animate([{ opacity: 0.6 }, { opacity: 1 }], { duration: 260, easing: EASE6 });
      else c.animate(transKeyframes(kind, false), { duration: 480, easing: EASE6, fill: 'forwards' });
    }
    placeMedia(q, boxes);
    counter.textContent = (i + 1) + ' / ' + pages.length + (stepsOf(p).length ? ' · ' + step + '/' + stepsOf(p).length : '');
    notesEl.textContent = p.notes || 'لا ملاحظات لهذه الشريحة.';
    if (chan) { try { const nx = pages[i + 1]; const c2 = document.createElement('canvas'); if (nx) renderSlide(c2, nx, T, 0.2); chan.postMessage({ i: i, n: pages.length, step: step, notes: p.notes || '', cur: c.toDataURL('image/jpeg', 0.6), next: nx ? c2.toDataURL('image/jpeg', 0.6) : '' }); } catch (e) {} }
  }
  function next() { const st = stepsOf(pages[i]); if (step < st.length) { step++; draw('step'); return; } if (i < pages.length - 1) { i++; step = 0; draw('next'); } }
  function prev() { if (step > 0) { step--; draw('step'); return; } if (i > 0) { i--; step = 0; draw('prev'); } }
  function goTo(n) { i = Math.max(0, Math.min(pages.length - 1, n)); step = 0; draw('next'); }
  function key(e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft' || e.key === ' ' || e.key === 'PageDown' || e.key === 'Enter') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowRight' || e.key === 'PageUp' || e.key === 'Backspace') { e.preventDefault(); prev(); }
    else if (e.key === 'Home') goTo(0); else if (e.key === 'End') goTo(pages.length - 1);
    else if (e.key === 't' || e.key === 'T') toggleTimer(); else if (e.key === 'n' || e.key === 'N') toggleNotes();
    else if (e.key === 'f' || e.key === 'F') { if (document.fullscreenElement) document.exitFullscreen().catch(function () {}); else if (ov.requestFullscreen) ov.requestFullscreen().catch(function () {}); }
  }
  function toggleNotes() { notesOn = !notesOn; notesEl.hidden = !notesOn; ov.classList.toggle('with-notes', notesOn); fitStage(); draw('step'); }
  function fmtT(s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function toggleTimer() {
    if (timer) { clearInterval(timer); timer = null; timerEl.hidden = true; return; }
    const m = el('input', { type: 'number', min: '1', max: '120', value: '5', class: 'inp sm', style: 'width:90px' });
    modal({ title: 'مؤقّت', body: [el('div', { class: 'row' }, [m, el('span', { text: 'دقيقة' })]), el('p', { class: 'tiny', text: 'يظهر في زاوية الشاشة، ويتنبه عند الانتهاء. T لإيقافه.' })], acts: [{ t: 'ابدأ', cls: 'dark', fn: function () {
      timerLeft = Math.max(1, +m.value || 5) * 60; timerEl.hidden = false; timerEl.classList.remove('done'); timerEl.textContent = fmtT(timerLeft);
      timer = setInterval(function () { timerLeft--; timerEl.textContent = fmtT(Math.max(0, timerLeft)); if (timerLeft <= 0) { clearInterval(timer); timer = null; timerEl.classList.add('done'); timerEl.textContent = 'انتهى الوقت'; } }, 1000);
    } }, { t: 'إلغاء' }] });
  }
  function speakerWindow() {
    const w = window.open('', 'athar_speaker', 'width=900,height=600');
    if (!w) { toast('المتصفح منع النافذة. استعمل N لإظهار الملاحظات هنا.'); return; }
    w.document.write('<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>شاشة المقدّم</title><style>body{margin:0;background:#111;color:#eee;font-family:Tahoma,Arial,sans-serif;display:grid;grid-template-columns:2fr 1fr;grid-template-rows:auto 1fr;gap:14px;padding:14px;height:100vh;box-sizing:border-box}img{width:100%;border-radius:8px;background:#000}.n{grid-column:1/-1;background:#1d1d1d;border-radius:10px;padding:16px;font-size:22px;line-height:1.8;white-space:pre-wrap;overflow:auto}.c{font-size:14px;color:#aaa}h4{margin:0 0 6px;font-weight:500;color:#aaa}</style></head><body><div><h4 id="c" class="c">الحالية</h4><img id="cur"></div><div><h4 class="c">التالية</h4><img id="next"></div><div class="n" id="n">ملاحظات الشريحة تظهر هنا.</div><script>var ch=new BroadcastChannel("athar-present");ch.onmessage=function(e){var m=e.data;document.getElementById("cur").src=m.cur;document.getElementById("next").src=m.next||"";document.getElementById("n").textContent=m.notes||"لا ملاحظات.";document.getElementById("c").textContent="الشريحة "+(m.i+1)+" من "+m.n;};<\/script></body></html>');
    w.document.close(); setTimeout(function () { draw('step'); }, 500);
  }
  const transSel = el('select', { class: 'psel', 'aria-label': 'الانتقال', onchange: function (e) { doc.trans = e.target.value; markDirtySafe(); } }, TRANS.map(function (t) { return el('option', { value: t[0], text: t[1], selected: (doc.trans || 'fade') === t[0] }); }));
  bar.append(
    el('button', { type: 'button', class: 'pb', 'aria-label': 'السابق', onclick: prev }, [ico('chev')]),
    counter,
    el('button', { type: 'button', class: 'pb nx', 'aria-label': 'التالي', onclick: next }, [ico('chev')]),
    el('span', { class: 'psep' }),
    transSel,
    el('button', { type: 'button', class: 'pb', title: 'مؤقّت (T)', onclick: toggleTimer }, [ico('clock')]),
    el('button', { type: 'button', class: 'pb', title: 'الملاحظات (N)', onclick: toggleNotes }, [ico('content')]),
    el('button', { type: 'button', class: 'pb', title: 'شاشة المقدّم في نافذة أخرى', onclick: speakerWindow }, [ico('slides')]),
    el('button', { type: 'button', class: 'pb', title: 'الشريحة الأولى', onclick: function () { goTo(0); } }, [ico('reset')]),
    el('span', { class: 'psep' }),
    el('button', { type: 'button', class: 'pb', title: 'خروج (Esc)', onclick: function () { close(); } }, [ico('close')])
  );
  let hideT = 0; const wake = function () { ov.classList.add('awake'); clearTimeout(hideT); hideT = setTimeout(function () { ov.classList.remove('awake'); }, 2600); };
  ov.addEventListener('mousemove', wake); ov.addEventListener('touchstart', wake, { passive: true });
  stage.addEventListener('click', function (e) { if (e.clientX < innerWidth / 2) next(); else prev(); });
  function close() { clearAnims(); document.removeEventListener('keydown', key); window.removeEventListener('resize', onResize); if (timer) clearInterval(timer); if (chan) chan.close(); ov.remove(); if (document.fullscreenElement) document.exitFullscreen().catch(function () {}); }
  function onResize() { draw('step'); }
  document.addEventListener('keydown', key); window.addEventListener('resize', onResize);
  document.body.appendChild(ov); draw('next'); ov.focus(); wake();
  if (ov.requestFullscreen) ov.requestFullscreen().catch(function () {});
  track('present', { tool: 'present' });
}
function markDirtySafe() { try { if (ED.open) markDirty(); } catch (e) {} }

/* ---------- إعدادات الشريحة في المحرر: الظهور التدريجي، والملاحظات، والانتقال ---------- */
const AN_STYLES = [['up', 'صعود'], ['fade', 'تلاشٍ'], ['right', 'من اليمين'], ['left', 'من اليسار'], ['down', 'هبوط'], ['zoom', 'تكبير'], ['pop', 'قفزة'], ['blur', 'من الضباب'], ['flip', 'قلب'], ['wipe', 'مسح'], ['drop', 'سقوط'], ['spin', 'دوران'], ['glow', 'توهّج']];
const AN_NAME = {}; AN_STYLES.forEach(function (x) { AN_NAME[x[0]] = x[1]; });
function slideSettings(i) { if (i !== ED.cur) { commitPage(); loadPage(i); afterPages(); } openTab('anim'); }
function curPage() { return ED.doc.pages[ED.cur]; }
function animStylesGrid(cur, on, withNone) {
  const list = (withNone ? [['none', 'بلا']] : []).concat(AN_STYLES);
  return el('div', { class: 'anstyles' }, list.map(function (x) { return el('button', { type: 'button', class: 'anst an-' + x[0] + (cur === x[0] ? ' on' : ''), title: x[1], onclick: function (e) { $$('.anst', e.currentTarget.parentNode).forEach(function (b) { b.classList.remove('on'); }); e.currentTarget.classList.add('on'); on(x[0]); } }, [el('i'), el('small', { text: x[1] })]); }));
}
/* ---------- لوحة الحركة: انتقال الشرائح، ودخول العناصر، والظهور بنقرة، والملاحظات ---------- */
function pAnim(b) {
  const doc = ED.doc, p = curPage(); p.anim = p.anim || {};
  b.appendChild(panelHead('الحركة', 'كيف تدخل الشرائح وعناصرها في العرض الحي. جرّب ثم «عاين».'));
  b.appendChild(el('button', { type: 'button', class: 'btn dark', style: 'width:100%', onclick: function () { present6(false, ED.cur); } }, [ico('play'), 'عاين هذه الشريحة في العرض']));
  // ١) انتقال الشرائح
  b.appendChild(el('h4', { class: 'psh', text: 'الانتقال بين الشرائح' }));
  b.appendChild(el('p', { class: 'tiny', text: 'للعرض كله، ولك أن تخص هذه الشريحة بانتقال مختلف.' }));
  b.appendChild(el('div', { class: 'fld' }, [el('label', { text: 'العرض كله' }), segOf(TRANS, doc.trans || 'fade', function (v) { doc.trans = v; markDirty(); })]));
  b.appendChild(el('div', { class: 'fld' }, [el('label', { text: 'هذه الشريحة' }), segOf([['', 'كالعرض']].concat(TRANS), p.trans || '', function (v) { if (v) p.trans = v; else delete p.trans; markDirty(); })]));
  // ٢) دخول العناصر
  b.appendChild(el('h4', { class: 'psh', text: 'دخول العناصر' }));
  b.appendChild(el('p', { class: 'tiny', text: 'تلقائي: تدخل العناصر واحداً تلو الآخر من الأعلى إلى الأسفل بالحركة المختارة. مخصص: تختار لكل عنصر حركته.' }));
  const modeBox = el('div');
  function drawMode() {
    modeBox.innerHTML = '';
    const mode = p.anim.mode || doc.animMode || 'auto';
    modeBox.appendChild(segOf([['auto', 'تلقائي'], ['custom', 'مخصص'], ['none', 'بلا حركة']], mode, function (v) { p.anim.mode = v; markDirty(); drawMode(); }));
    if (mode === 'none') return;
    modeBox.appendChild(el('p', { class: 'tiny', style: 'margin-top:8px', text: mode === 'auto' ? 'الحركة لكل العناصر:' : 'الحركة الافتراضية (ويمكن تغييرها لكل عنصر):' }));
    modeBox.appendChild(animStylesGrid(p.anim.style || doc.animStyle || 'up', function (v) { p.anim.style = v; markDirty(); if (mode === 'custom') drawItems(); }, false));
    modeBox.appendChild(el('div', { class: 'fld', style: 'margin-top:8px' }, [el('label', { text: 'السرعة' }), segOf([['fast', 'سريعة'], ['normal', 'عادية'], ['slow', 'هادئة']], p.anim.speed || doc.animSpeed || 'normal', function (v) { p.anim.speed = v; markDirty(); })]));
    modeBox.appendChild(el('div', { class: 'row wrapr', style: 'margin-top:6px' }, [el('button', { type: 'button', class: 'btn sm line', onclick: function () { doc.animMode = p.anim.mode || 'auto'; doc.animStyle = p.anim.style || doc.animStyle || 'up'; doc.animSpeed = p.anim.speed || doc.animSpeed || 'normal'; doc.pages.forEach(function (q) { q.anim = Object.assign({}, q.anim || {}, { mode: doc.animMode, style: doc.animStyle, speed: doc.animSpeed }); }); markDirty(); toast('طُبّق على كل الشرائح'); } }, ['طبّق على كل الشرائح'])]));
    if (mode === 'custom') { const itemsBox = el('div', { class: 'anlist', style: 'margin-top:10px' }); modeBox.appendChild(itemsBox); drawItems(itemsBox); }
  }
  let itemsHost = null;
  function drawItems(host) {
    itemsHost = host || itemsHost; if (!itemsHost) return; itemsHost.innerHTML = '';
    p.anim.items = p.anim.items || {};
    const o = stackOrder(), groups = o.all.filter(function (g) { return !S.hide['g_' + g] && g !== 'deco' && g !== 'footer'; });
    let steps = (p.steps || []).slice();
    groups.forEach(function (g) {
      const sel = el('select', { 'aria-label': 'حركة ' + gName(g), onchange: function (e) { p.anim.items[g] = e.target.value; markDirty(); } }, [el('option', { value: '', text: 'الافتراضية (' + AN_NAME[p.anim.style || doc.animStyle || 'up'] + ')' }), el('option', { value: 'none', text: 'بلا' })].concat(AN_STYLES.map(function (x) { return el('option', { value: x[0], text: x[1] }); })));
      sel.value = p.anim.items[g] || '';
      const inSteps = steps.indexOf(g) >= 0;
      const tg = el('label', { class: 'tog', title: 'يظهر بنقرة أثناء العرض' }, [el('input', { type: 'checkbox', checked: inSteps, onchange: function (e) { if (e.target.checked) { if (steps.indexOf(g) < 0) steps.push(g); } else steps = steps.filter(function (x) { return x !== g; }); p.steps = steps; markDirty(); } }), el('span', { text: 'بنقرة' })]);
      itemsHost.appendChild(el('div', { class: 'anrow' }, [el('b', { text: gName(g) }), sel, tg]));
    });
    if (p.tpl === 'sl_quiz') itemsHost.appendChild(el('p', { class: 'tiny', text: 'شريحة السؤال: الجواب الصحيح يظهر بنقرة أخيرة تلقائياً.' }));
  }
  b.appendChild(modeBox); drawMode();
  // ٣) الظهور بنقرة (في الوضع التلقائي)
  b.appendChild(el('h4', { class: 'psh', text: 'الظهور بنقرة' }));
  b.appendChild(el('p', { class: 'tiny', text: 'ما تختاره هنا لا يظهر مع الشريحة، بل بنقرة أثناء العرض، بالترتيب.' }));
  const stepBox = el('div', { class: 'anlist' }); b.appendChild(stepBox);
  function drawSteps() {
    stepBox.innerHTML = '';
    const o = stackOrder(), groups = o.all.filter(function (g) { return !S.hide['g_' + g] && g !== 'deco' && g !== 'footer' && g !== 'logo'; });
    const steps = (p.steps || []).filter(function (g) { return groups.indexOf(g) >= 0; }); p.steps = steps;
    steps.forEach(function (g, k) { stepBox.appendChild(el('div', { class: 'steprow on' }, [el('b', { text: (k + 1) + '. ' + gName(g) }), el('span', { class: 'sp' }),
      el('button', { type: 'button', class: 'ib sm', 'aria-label': 'للأعلى', disabled: k === 0, onclick: function () { steps.splice(k - 1, 0, steps.splice(k, 1)[0]); markDirty(); drawSteps(); } }, [ico('up')]),
      el('button', { type: 'button', class: 'ib sm', 'aria-label': 'إزالة', onclick: function () { steps.splice(k, 1); markDirty(); drawSteps(); } }, [ico('close')])])); });
    const rest = groups.filter(function (g) { return steps.indexOf(g) < 0; });
    if (rest.length) stepBox.appendChild(el('div', { class: 'row wrapr' }, rest.map(function (g) { return el('button', { type: 'button', class: 'chip', onclick: function () { steps.push(g); markDirty(); drawSteps(); } }, ['+ ' + gName(g)]); })));
  }
  drawSteps();
  // ٤) ملاحظات المقدّم
  b.appendChild(el('h4', { class: 'psh', text: 'ملاحظات المقدّم' }));
  const notes = el('textarea', { rows: '4', dir: 'auto', placeholder: 'ما تريد تذكّره وأنت تعرض هذه الشريحة. يراه المقدّم فقط (N في العرض).', oninput: function (e) { p.notes = e.target.value; markDirty(); } }); notes.value = p.notes || '';
  b.appendChild(notes);
}
/* ---------- وسائط الشريحة: فيديو وصوت من الجهاز، ورابط يوتيوب ---------- */
function mediaPanelSection(b) {
  if (!ED.doc || ED.doc.kind !== 'deck') return;
  b.appendChild(el('h4', { class: 'psh', text: 'وسائط للعرض الحي' }));
  b.appendChild(el('p', { class: 'tiny', text: 'تظهر بطاقتها في الشريحة، وتعمل عند العرض بملء الشاشة. الفيديو والصوت حتى ' + (V6.settings.maxUploadMb || 20) + ' ميغابايت.' }));
  const vf = el('input', { type: 'file', accept: 'video/mp4,video/webm', hidden: true, onchange: async function (e) {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    if (f.size > (V6.settings.maxUploadMb || 20) * 1048576) { toast('الفيديو أكبر من المسموح'); return; }
    toast('نرفع الفيديو…');
    try { const poster = await videoPoster(f); const pa = poster ? await uploadAsset(poster, { kind: 'image', name: f.name + ' (ملصق)' }) : null; const r = await uploadAsset(f, { kind: 'video', name: f.name }); addLayer6({ t: 'video', ref: 'asset:' + r.id, poster: pa ? 'asset:' + pa.id : '', w: 0.5, title: f.name.replace(/\.[^.]+$/, '') }); }
    catch (er) { toast(er.message); }
  } });
  const af = el('input', { type: 'file', accept: 'audio/*', hidden: true, onchange: async function (e) {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    toast('نرفع الصوت…');
    try { const r = await uploadAsset(f, { kind: 'audio', name: f.name }); addLayer6({ t: 'audio', ref: 'asset:' + r.id, w: 0.26, title: f.name.replace(/\.[^.]+$/, '').slice(0, 30) }); } catch (er) { toast(er.message); }
  } });
  b.appendChild(el('div', { class: 'row wrapr' }, [vf, af,
    el('button', { type: 'button', class: 'btn sm line', onclick: function () { vf.click(); } }, [ico('play'), 'فيديو من الجهاز']),
    el('button', { type: 'button', class: 'btn sm line', onclick: function () { af.click(); } }, [ico('bell'), 'صوت أو تلاوة']),
    el('button', { type: 'button', class: 'btn sm line', onclick: async function () { const u = await promptText('رابط يوتيوب', ''); if (!u) return; const id = ytId(u); if (!id) { toast('الرابط ليس رابط يوتيوب'); return; } const t = await promptText('عنوان يظهر على البطاقة (اختياري)', ''); addLayer6({ t: 'yt', url: 'https://www.youtube.com/watch?v=' + id, w: 0.5, title: t || '' }); } }, [ico('globe'), 'رابط يوتيوب'])]));
}
function ytId(u) { const m = /(?:youtu\.be\/|v=|\/shorts\/|\/embed\/)([\w-]{11})/.exec(String(u || '')); return m ? m[1] : ''; }
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
    btn.disabled = true; btn.replaceChildren(el('span', { class: 'spin' }), ' يقرأ المساعد ويرتّب…');
    try { const o = await outlineAI(ta.value, pdf, T); outlineDialog(o, T); } catch (er) { toast(er.message); }
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
  modal({ title: 'مخطط العرض: راجعه وعدّله', wide: true, body: [el('div', { class: 'grid two' }, [el('div', { class: 'fld' }, [el('label', { text: 'عنوان العرض' }), titleI]), el('div', { class: 'fld' }, [el('label', { text: 'سطر تحته' }), subI])]), list],
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
