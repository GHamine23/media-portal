/* ================= عرض المقدّم: نافذة تُشارَك فيها الشرائح وحدها، ونافذة المقدّم أمامك =================
   نافذة العرض (#/stage) تفتح المنصة نفسها وتعرض الشرائح بكل حركتها ووسائطها وأدوات الدرس، بلا أي زر، فتشاركها في زوم أو ميت.
   ونافذة المقدّم هنا: الشرائح المصغّرة، والحالية والتالية، والملاحظات، والوقت، والقلم والقرعة والنقاط وإجابات الطلاب.
   النافذتان على قناة واحدة (BroadcastChannel): المقدّم يأمر، والعرض ينفّذ ويخبر بحاله.
   تنبيه للمستخدم: كروم يوقف رسم النافذة المغطّاة كلياً، فنافذة العرض يجب أن يبقى جزء منها ظاهراً (أو على شاشة ثانية). */
IC.sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>';
const PCON = { open: false };
function stageKey() { return Math.random().toString(36).slice(2, 10); }
function stageBase() { return location.origin + location.pathname + location.search; }

/* ---------- البدء: من المحرر أو من صفحة رابط العرض أو من شريط العرض ---------- */
function presenterMode(startAt, fromView) {
  if (PCON.open) return;
  if (!fromView && typeof commitPage === 'function') commitPage();
  const doc = ED.doc, T = S.track;
  if (!doc || !doc.pages || !doc.pages.length || !T) { toast('افتح عرضاً أولاً'); return; }
  const k = stageKey();
  window.ATHAR_STAGE = window.ATHAR_STAGE || {};
  window.ATHAR_STAGE[k] = { doc: JSON.parse(JSON.stringify(doc)), track: T.id, program: V6.prog && V6.prog.id, i: Math.max(0, Math.min(doc.pages.length - 1, startAt || 0)), fromView: !!fromView };
  const url = stageBase() + '#/stage?k=' + k;
  const openWin = function () { return window.open(url, 'athar_stage_' + k, 'popup=yes,width=1280,height=760'); };
  const w = openWin();
  presenterConsole(doc, T, k, window.ATHAR_STAGE[k].i, !!fromView, w, openWin);
  track('present', { tool: 'presenter' });
}

/* ---------- نافذة المقدّم ---------- */
function presenterConsole(doc, T, key, startAt, fromView, win, openWin) {
  PCON.open = true;
  const pages = doc.pages, ch = new BroadcastChannel('athar-stage-' + key);
  let i = startAt, step = 0, blank = '', live = false, lastSeen = 0, pen = { on: false, tool: 'pen', color: '#e5132b', cur: null, down: false }, inks = {}, laser = [];
  let t0 = Date.now(), cd = 0, cdEnd = 0, tick = 0, notesPx = Math.max(16, Math.min(40, +ls('pnotesz') || 22));
  const send = function (m) { try { ch.postMessage(m); } catch (e) {} };
  const steps = function (k) { return stepsOf(pages[k == null ? i : k]); };
  const arN = function (n) { return arDig(n); };

  /* -- الأجزاء -- */
  const status = el('span', { class: 'pc-status' });
  const reopen = el('button', { type: 'button', class: 'btn sm line pc-reopen', hidden: true, onclick: function () { win = openWin(); if (!win) toast('المتصفح منع النافذة: اسمح بالنوافذ المنبثقة لهذا الموقع.'); } }, [ico('slides'), 'افتح نافذة العرض']);
  const clock = el('b', { class: 'pc-clock', dir: 'ltr' }), elapsed = el('b', { class: 'pc-el', dir: 'ltr' }), cdEl = el('b', { class: 'pc-cd', dir: 'ltr', hidden: true });
  const thumbs = el('div', { class: 'pc-thumbs', role: 'list', 'aria-label': 'الشرائح' });
  const curBox = el('div', { class: 'pc-cur' }), curCv = el('canvas', { class: 'pc-cv' }), inkCv = el('canvas', { class: 'pc-ink', 'aria-hidden': 'true' });
  curBox.append(curCv, inkCv);
  const blankTag = el('span', { class: 'pc-blank', hidden: true });
  curBox.appendChild(blankTag);
  const nextCv = el('canvas', { class: 'pc-cv' }), nextLbl = el('small', { class: 'pc-nl' });
  const notes = el('div', { class: 'pc-notes-t', style: 'font-size:' + notesPx + 'px' });
  const counter = el('b', { class: 'pc-count', dir: 'ltr' });
  const B = function (icon, label, fn, cls) { return el('button', { type: 'button', class: 'pcb' + (cls ? ' ' + cls : ''), title: label, 'aria-label': label, onclick: function (e) { e.stopPropagation(); fn(e); } }, [ico(icon), el('span', { text: label.replace(/ \(.+\)$/, '') })]); };
  const bPrev = B('chev', 'السابق (←)', prev, 'nav prevb'), bNext = B('chev', 'التالي (→)', next, 'nav nextb');
  const bBlack = B('eyeoff', 'شاشة سوداء (B)', function () { setBlank(blank === '#000' ? '' : '#000'); });
  const bWhite = B('sun', 'شاشة بيضاء (W)', function () { setBlank(blank === '#fff' ? '' : '#fff'); });
  const bPen = B('pen', 'القلم (P)', function () { penToggle(); });
  const bPick = B('dice', 'القرعة (R)', function () { pickPanel(); });
  const bScore = B('trophy', 'النقاط (S)', function () { scorePanel(); });
  const bRes = B('chart', 'إجابات الطلاب (Q)', function () { send({ t: 'tool', k: 'res' }); bRes.classList.toggle('on'); });
  const bMedia = B('play', 'شغّل الوسائط (M)', function () { send({ t: 'media' }); });
  const bTimer = B('clock', 'مؤقّت (T)', timerDlg);
  const bEnd = el('button', { type: 'button', class: 'btn sm pc-end', onclick: function () { end(); } }, [ico('close'), 'إنهاء العرض']);
  const side = el('div', { class: 'pc-side' }); // لوحات القلم والقرعة والنقاط

  const penBar = el('div', { class: 'pc-penbar', hidden: true });
  [['pen', 'pen', 'قلم'], ['marker', 'marker', 'تحديد'], ['laser', 'laser', 'ليزر'], ['eraser', 'eraser', 'ممحاة']].forEach(function (x) { penBar.appendChild(el('button', { type: 'button', class: 'pp', 'data-tool': x[0], title: x[2], 'aria-label': x[2], onclick: function () { pen.tool = x[0]; syncPen(); } }, [ico(x[1])])); });
  [['#e5132b', 'أحمر'], ['#1a71fd', 'أزرق'], ['#2f9e5c', 'أخضر'], ['#111111', 'أسود'], ['#ffffff', 'أبيض']].forEach(function (c) { penBar.appendChild(el('button', { type: 'button', class: 'pcc', 'data-c': c[0], title: c[1], 'aria-label': c[1], style: 'background:' + c[0], onclick: function () { pen.color = c[0]; if (pen.tool === 'eraser' || pen.tool === 'laser') pen.tool = 'pen'; syncPen(); } })); });
  penBar.appendChild(el('button', { type: 'button', class: 'pp', title: 'امسح الشريحة (C)', 'aria-label': 'امسح ما كُتب على الشريحة', onclick: function () { delete inks[i]; drawInk(); sendInk(); } }, [ico('trash')]));

  const ov = el('div', { class: 'pcon', role: 'dialog', 'aria-label': 'عرض المقدّم', tabindex: '0' }, [
    el('header', { class: 'pc-top' }, [
      el('div', { class: 'pc-title' }, [el('span', { class: 'pc-dot' }), el('b', { text: doc.name || 'عرض' })]),
      status, reopen, el('span', { class: 'sp' }),
      el('span', { class: 'pc-tm' }, [el('small', { text: 'الساعة' }), clock]),
      el('span', { class: 'pc-tm' }, [el('small', { text: 'منذ البداية' }), elapsed]),
      el('span', { class: 'pc-tm cd' }, [el('small', { text: 'المتبقي' }), cdEl]),
      bEnd
    ]),
    el('div', { class: 'pc-body' }, [
      thumbs,
      el('main', { class: 'pc-main' }, [curBox, penBar]),
      el('aside', { class: 'pc-aside' }, [
        el('div', { class: 'pc-next' }, [el('small', { class: 'pc-h', text: 'التالي' }), nextCv, nextLbl]),
        el('div', { class: 'pc-notes' }, [el('div', { class: 'pc-nh' }, [el('small', { class: 'pc-h', text: 'ملاحظات المقدّم' }), el('span', { class: 'sp' }),
          el('button', { type: 'button', class: 'pcz', 'aria-label': 'تصغير الخط', onclick: function () { zoomNotes(-2); } }, ['أ−']), el('button', { type: 'button', class: 'pcz', 'aria-label': 'تكبير الخط', onclick: function () { zoomNotes(2); } }, ['أ+'])]), notes]),
        side
      ])
    ]),
    el('footer', { class: 'pc-bar' }, [bPrev, counter, bNext, el('span', { class: 'pc-sep' }), bBlack, bWhite, el('span', { class: 'pc-sep' }), bPen, bPick, bScore, bRes, bMedia, el('span', { class: 'pc-sep' }), bTimer,
      el('span', { class: 'sp' }), el('small', { class: 'pc-tip', text: 'شارك في لقائك نافذة «عرض: ' + (doc.name || '') + '» وحدها، وأبقِ جزءاً منها ظاهراً على شاشتك حتى يستمر تحديثها.' })])
  ]);

  /* -- الرسم -- */
  function render(cv, p, k, st, maxW, maxH) {
    const sz = SIZES[p.size || 'slide'], r = Math.min(maxW / sz.w, maxH / sz.h), dpr = Math.min(2, devicePixelRatio || 1);
    const q = pageAtStep(p, st); q.d.__n = k ? String(k + 1) : '';
    renderSlide(cv, q, T, r * dpr);
    cv.style.width = Math.round(sz.w * r) + 'px'; cv.style.height = Math.round(sz.h * r) + 'px';
  }
  function drawCur() {
    const p = pages[i], bw = curBox.clientWidth || 800, bh = curBox.clientHeight || 450;
    render(curCv, p, i, step, bw, bh);
    inkCv.style.width = curCv.style.width; inkCv.style.height = curCv.style.height;
    const dpr = Math.min(2, devicePixelRatio || 1); inkCv.width = Math.round(parseFloat(curCv.style.width) * dpr); inkCv.height = Math.round(parseFloat(curCv.style.height) * dpr);
    drawInk();
  }
  function drawNext() {
    const st = steps(), w = nextCv.parentNode.clientWidth || 300;
    if (step < st.length) { render(nextCv, pages[i], i, step + 1, w, w * 0.6); nextLbl.textContent = st[step] === '__answer' ? 'نقرة تكشف الجواب' : 'نقرة تُظهر العنصر التالي'; nextCv.hidden = false; }
    else if (i < pages.length - 1) { render(nextCv, pages[i + 1], i + 1, 0, w, w * 0.6); nextLbl.textContent = 'الشريحة ' + arN(i + 2); nextCv.hidden = false; }
    else { nextCv.hidden = true; nextLbl.textContent = 'نهاية العرض'; }
  }
  function buildThumbs() {
    thumbs.innerHTML = '';
    pages.forEach(function (p, k) {
      const c = el('canvas', { class: 'pc-tcv' });
      const b = el('button', { type: 'button', class: 'pc-t', role: 'listitem', 'aria-label': 'الشريحة ' + (k + 1), onclick: function () { goTo(k); } }, [c, el('small', { text: arN(k + 1) })]);
      thumbs.appendChild(b);
      setTimeout(function () { if (ov.isConnected) render(c, p, k, steps(k).length, 150, 90); }, 30 + k * 25);
    });
  }
  function markThumbs() { $$('.pc-t', thumbs).forEach(function (b, k) { b.classList.toggle('on', k === i); b.setAttribute('aria-current', k === i ? 'true' : 'false'); }); const on = thumbs.children[i]; if (on) on.scrollIntoView({ block: 'nearest' }); }
  function update(push) {
    drawCur(); drawNext(); markThumbs();
    const p = pages[i], st = steps();
    counter.textContent = (i + 1) + ' / ' + pages.length + (st.length ? ' · ' + step + '/' + st.length : '');
    notes.textContent = p.notes || 'لا ملاحظات لهذه الشريحة.'; notes.classList.toggle('empty', !p.notes);
    bPrev.disabled = i === 0 && step === 0; bNext.disabled = i === pages.length - 1 && step >= st.length;
    if (push !== false) send({ t: 'go', i: i, step: step });
    if (scoreOpen) fillScore();
  }
  function next() { const st = steps(); if (step < st.length) step++; else if (i < pages.length - 1) { i++; step = 0; } else return; if (blank) setBlank(''); update(); }
  function prev() { if (step > 0) step--; else if (i > 0) { i--; step = 0; } else return; if (blank) setBlank(''); update(); }
  function goTo(k) { k = Math.max(0, Math.min(pages.length - 1, k)); if (k === i && !step) return; i = k; step = 0; if (blank) setBlank(''); update(); ov.focus(); }
  function setBlank(c) { blank = c; send({ t: 'blank', c: c }); blankTag.hidden = !c; blankTag.textContent = c === '#000' ? 'شاشة سوداء عند الطلاب' : c === '#fff' ? 'شاشة بيضاء عند الطلاب' : ''; bBlack.classList.toggle('on', c === '#000'); bWhite.classList.toggle('on', c === '#fff'); }
  function zoomNotes(d) { notesPx = Math.max(14, Math.min(44, notesPx + d)); notes.style.fontSize = notesPx + 'px'; ls('pnotesz', notesPx); }

  /* -- الوقت -- */
  const fmt = function (s) { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + ('0' + m).slice(-2) : m) + ':' + ('0' + x).slice(-2); };
  function clockTick() {
    if (!ov.isConnected) { clearInterval(tick); return; }
    const d = new Date(); clock.textContent = d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2);
    elapsed.textContent = fmt((Date.now() - t0) / 1000);
    if (cd) { const left = (cdEnd - Date.now()) / 1000; cdEl.textContent = left > 0 ? fmt(left) : 'انتهى'; cdEl.parentNode.classList.toggle('warn', left <= 60 && left > 0); cdEl.parentNode.classList.toggle('over', left <= 0); }
    // حال نافذة العرض
    const closed = !win || win.closed;
    const ok = !closed && live && Date.now() - lastSeen < 8000;
    status.className = 'pc-status ' + (ok ? 'ok' : closed ? 'off' : 'wait');
    status.textContent = ok ? 'نافذة العرض متصلة' : closed ? 'نافذة العرض مغلقة' : 'نافتح نافذة العرض…';
    reopen.hidden = !closed;
    if (!closed && Date.now() - lastSeen > 3000) send({ t: 'ping' });
  }
  function timerDlg() {
    if (cd) { cd = 0; cdEl.hidden = true; cdEl.parentNode.classList.remove('on', 'warn', 'over'); bTimer.classList.remove('on'); return; }
    const m = el('input', { type: 'number', min: '1', max: '240', value: '45', class: 'inp sm', style: 'width:90px' });
    modal({ title: 'مؤقّت للدرس', body: [el('div', { class: 'row' }, [m, el('span', { text: 'دقيقة' })]), el('p', { class: 'tiny', text: 'يظهر لك وحدك، ويتلوّن في الدقيقة الأخيرة. اضغط T لإيقافه.' })], acts: [{ t: 'ابدأ', cls: 'dark', fn: function () { cd = Math.max(1, +m.value || 45) * 60; cdEnd = Date.now() + cd * 1000; cdEl.hidden = false; cdEl.parentNode.classList.add('on'); bTimer.classList.add('on'); clockTick(); } }, { t: 'إلغاء' }], onClose: function () { ov.focus(); } });
  }

  /* -- القلم على الشريحة الحالية، ينعكس عند الطلاب -- */
  function syncPen() { $$('.pp[data-tool]', penBar).forEach(function (b) { b.classList.toggle('on', b.dataset.tool === pen.tool); }); $$('.pcc', penBar).forEach(function (b) { b.classList.toggle('on', b.dataset.c === pen.color && (pen.tool === 'pen' || pen.tool === 'marker')); }); inkCv.dataset.tool = pen.tool; }
  function penToggle(on) { pen.on = on == null ? !pen.on : on; penBar.hidden = !pen.on; inkCv.classList.toggle('on', pen.on); bPen.classList.toggle('on', pen.on); syncPen(); if (!pen.on) { laser = []; send({ t: 'laser', pts: [] }); drawInk(); } }
  function pathOf(g, pts, W, H) { g.beginPath(); g.moveTo(pts[0][0] * W, pts[0][1] * H); if (pts.length < 3) { pts.forEach(function (p) { g.lineTo(p[0] * W + 0.01, p[1] * H); }); return; } for (let n = 1; n < pts.length - 1; n++) { const mx = (pts[n][0] + pts[n + 1][0]) / 2, my = (pts[n][1] + pts[n + 1][1]) / 2; g.quadraticCurveTo(pts[n][0] * W, pts[n][1] * H, mx * W, my * H); } const l = pts[pts.length - 1]; g.lineTo(l[0] * W, l[1] * H); }
  function drawInk() {
    const g = inkCv.getContext('2d'), W = inkCv.width, H = inkCv.height; g.clearRect(0, 0, W, H);
    (inks[i] || []).concat(pen.cur ? [pen.cur] : []).forEach(function (s) { g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = s.c; if (s.t === 'marker') { g.globalAlpha = 0.38; g.lineWidth = W * 0.024; g.lineCap = 'butt'; } else g.lineWidth = W * 0.0042; pathOf(g, s.pts, W, H); g.stroke(); g.restore(); });
    const now = performance.now(); laser = laser.filter(function (p) { return now - p[2] < 650; });
    if (laser.length) { const h = laser[laser.length - 1]; g.save(); g.fillStyle = '#ff2a2a'; g.shadowColor = 'rgba(255,0,0,.9)'; g.shadowBlur = W * 0.02; g.beginPath(); g.arc(h[0] * W, h[1] * H, W * 0.008, 0, Math.PI * 2); g.fill(); g.restore(); requestAnimationFrame(drawInk); }
  }
  let inkRaf = 0;
  function sendInk() { if (inkRaf) return; inkRaf = requestAnimationFrame(function () { inkRaf = 0; send({ t: 'ink', i: i, strokes: (inks[i] || []).concat(pen.cur ? [pen.cur] : []) }); }); }
  const ptOf = function (e) { const r = inkCv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  inkCv.addEventListener('pointerdown', function (e) {
    if (!pen.on) return; e.preventDefault(); try { inkCv.setPointerCapture(e.pointerId); } catch (er) {}
    const p = ptOf(e); pen.down = true;
    if (pen.tool === 'eraser') { erase(p); return; }
    if (pen.tool === 'laser') { laserAt(p); return; }
    pen.cur = { t: pen.tool, c: pen.tool === 'marker' ? (pen.color === '#111111' || pen.color === '#ffffff' ? '#ffd400' : pen.color) : pen.color, pts: [p] }; drawInk(); sendInk();
  });
  inkCv.addEventListener('pointermove', function (e) {
    if (!pen.on) return; const p = ptOf(e);
    if (pen.tool === 'laser') { if (pen.down || e.pointerType === 'mouse') laserAt(p); return; }
    if (!pen.down) return;
    if (pen.tool === 'eraser') { erase(p); return; }
    if (pen.cur) { const l = pen.cur.pts[pen.cur.pts.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) > 0.0015) { pen.cur.pts.push(p); drawInk(); sendInk(); } }
  });
  const penUp = function () { pen.down = false; if (pen.cur) { (inks[i] = inks[i] || []).push(pen.cur); pen.cur = null; drawInk(); sendInk(); } };
  inkCv.addEventListener('pointerup', penUp); inkCv.addEventListener('pointercancel', penUp);
  function erase(p) { const rr = 0.02, before = (inks[i] || []).length; inks[i] = (inks[i] || []).filter(function (s) { return !s.pts.some(function (q) { return Math.abs(q[0] - p[0]) < rr && Math.abs(q[1] - p[1]) < rr * 1.6; }); }); if (inks[i].length !== before) { drawInk(); sendInk(); } }
  let laserT = 0;
  function laserAt(p) { laser.push([p[0], p[1], performance.now()]); if (laser.length === 1) drawInk(); const now = performance.now(); if (now - laserT > 30) { laserT = now; send({ t: 'laser', pts: laser.map(function (q) { return [q[0], q[1], now - q[2]]; }) }); } }

  /* -- القرعة والنقاط: تُدار من هنا وتظهر عند الطلاب -- */
  let pickOpen = false, scoreOpen = false, scoreShown = false;
  function closeSide() { side.innerHTML = ''; pickOpen = false; scoreOpen = false; bPick.classList.remove('on'); bScore.classList.toggle('on', scoreShown); }
  function pickPanel() {
    if (pickOpen) { send({ t: 'pickclose' }); closeSide(); return; }
    closeSide(); pickOpen = true; bPick.classList.add('on'); send({ t: 'pickopen' });
    side.append(el('div', { class: 'pc-panel' }, [el('div', { class: 'pc-nh' }, [el('b', { text: 'القرعة' }), el('span', { class: 'sp' }), el('button', { type: 'button', class: 'ib sm', 'aria-label': 'إغلاق القرعة', onclick: function () { send({ t: 'pickclose' }); closeSide(); } }, [ico('close')])]),
      el('p', { class: 'tiny', text: 'تظهر القرعة عند الطلاب. اضغط «اختر» أو المسافة.' }),
      el('button', { type: 'button', class: 'btn dark pc-go', onclick: function () { send({ t: 'pickgo' }); } }, [ico('dice'), 'اختر'])]));
  }
  function teams() { const l = lessonOf(doc); if (!l.teams || !l.teams.length) l.teams = [{ n: TEAM_NAMES[0], c: TEAM_COL[0], p: 0 }, { n: TEAM_NAMES[1], c: TEAM_COL[1], p: 0 }]; return l.teams; }
  function sendTeams() { send({ t: 'teams', teams: teams(), show: scoreShown }); }
  function fillScore() {
    const box = side.querySelector('.pc-teams'); if (!box) return; box.innerHTML = '';
    teams().forEach(function (t) {
      const bump = function (d) { t.p = Math.max(0, (t.p || 0) + d); if (!fromView) lessonDirty(); fillScore(); sendTeams(); };
      box.appendChild(el('div', { class: 'pc-team', style: '--tc:' + t.c }, [el('i'), el('span', { text: t.n }), el('b', { text: arN(t.p || 0) }),
        el('button', { type: 'button', class: 'pcs', 'aria-label': 'أنقص نقطة من ' + t.n, onclick: function () { bump(-1); } }, ['−']), el('button', { type: 'button', class: 'pcs add', 'aria-label': 'أضف نقطة إلى ' + t.n, onclick: function () { bump(1); } }, ['+'])]));
    });
  }
  function scorePanel() {
    if (scoreOpen) { closeSide(); return; }
    closeSide(); scoreOpen = true; scoreShown = true; bScore.classList.add('on'); sendTeams();
    const showT = el('input', { type: 'checkbox', checked: true, onchange: function (e) { scoreShown = e.target.checked; sendTeams(); } });
    side.append(el('div', { class: 'pc-panel' }, [el('div', { class: 'pc-nh' }, [el('b', { text: 'نقاط الفرق' }), el('span', { class: 'sp' }), el('button', { type: 'button', class: 'ib sm', 'aria-label': 'إغلاق النقاط', onclick: closeSide }, [ico('close')])]),
      el('div', { class: 'pc-teams' }), el('label', { class: 'tog' }, [showT, el('span', { text: 'تظهر للطلاب' })])]));
    fillScore();
  }

  /* -- لوحة المفاتيح ونقّارات العرض -- */
  function onKey(e) {
    if (!ov.isConnected) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (document.querySelector('.modal')) return;
    const k = e.key;
    if (pen.on && k === 'Escape') { e.preventDefault(); penToggle(false); return; }
    if (k === 'ArrowLeft' || k === ' ' || k === 'PageDown' || k === 'Enter' || k === 'ArrowDown') { e.preventDefault(); if (pickOpen && (k === ' ' || k === 'Enter')) { send({ t: 'pickgo' }); return; } next(); return; }
    if (k === 'ArrowRight' || k === 'PageUp' || k === 'Backspace' || k === 'ArrowUp') { e.preventDefault(); prev(); return; }
    if (k === 'Home') { goTo(0); return; } if (k === 'End') { goTo(pages.length - 1); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const m = { b: bBlack, '.': bBlack, 'لا': bBlack, w: bWhite, ',': bWhite, 'ص': bWhite, p: bPen, 'ح': bPen, r: bPick, 'ق': bPick, s: bScore, 'س': bScore, q: bRes, 'ض': bRes, m: bMedia, 'ة': bMedia, t: bTimer, 'ف': bTimer }[k.toLowerCase ? k.toLowerCase() : k];
    if (m) { e.preventDefault(); m.click(); return; }
    if (pen.on && (k === 'c' || k === 'C' || k === 'ؤ')) { delete inks[i]; drawInk(); sendInk(); }
  }

  /* -- القناة -- */
  ch.onmessage = function (e) {
    const m = e.data || {}; lastSeen = Date.now();
    if (m.t === 'ready') { live = true; update(); setBlank(blank); Object.keys(inks).forEach(function (k) { send({ t: 'ink', i: +k, strokes: inks[k] }); }); if (scoreShown) sendTeams(); }
    else if (m.t === 'state') { live = true; if (m.i !== i || m.step !== step) { i = m.i; step = m.step; update(false); } }
    else if (m.t === 'pong') live = true;
    else if (m.t === 'closed') { live = false; }
  };
  function end() {
    send({ t: 'end' }); try { if (win && !win.closed) win.close(); } catch (e) {}
    clearInterval(tick); document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onRz);
    setTimeout(function () { try { ch.close(); } catch (e) {} }, 300);
    ov.remove(); PCON.open = false; document.body.classList.remove('pcon-open');
    try { delete window.ATHAR_STAGE[key]; } catch (e) {}
    if (!fromView && typeof ED !== 'undefined' && ED.open) { ED.cur = i; try { loadPage(i); buildPanel(); drawNow(); buildPages(); } catch (e) {} }
  }
  let rzT = 0; function onRz() { clearTimeout(rzT); rzT = setTimeout(function () { drawCur(); drawNext(); }, 120); }
  document.addEventListener('keydown', onKey); window.addEventListener('resize', onRz);
  document.body.appendChild(ov); document.body.classList.add('pcon-open');
  buildThumbs(); update(false); clockTick(); tick = setInterval(clockTick, 1000); ov.focus();
  if (!win) toast('المتصفح منع نافذة العرض: اسمح بالنوافذ المنبثقة لهذا الموقع، ثم «افتح نافذة العرض».');
  return { end: end };
}

/* ---------- نافذة العرض (#/stage): الشرائح وحدها ---------- */
async function showStage6() {
  document.body.classList.add('stage6');
  const top = $('#top'); if (top) top.hidden = true;
  const k = (location.hash.split('?k=')[1] || '').replace(/[^a-z0-9]/g, '');
  let data = null;
  try { data = window.opener && window.opener.ATHAR_STAGE && window.opener.ATHAR_STAGE[k]; } catch (e) { data = null; }
  if (!data) { view(el('div', { class: 'boot stage-empty' }, [el('p', { text: 'هذه نافذة العرض. افتحها من «عرض المقدّم» في المحرر.' })])); return; }
  data = JSON.parse(JSON.stringify(data));
  view(el('div', { class: 'boot' }, [loader6('نجهّز العرض…')]));
  if (data.program && V6.prog && data.program !== V6.prog.id && V6.bundle.programs.some(function (p) { return p.id === data.program; })) await useProgram(data.program, true);
  const T = trackOf(data.track) || tracksOf()[0]; if (!T) return;
  S.track = T; ED.doc = data.doc; ED.cur = data.i; S.tpl = TEMPLATES.find(function (t) { return t.id === data.doc.pages[0].tpl; });
  try { await ensureFonts(data.doc.pages.reduce(function (a, p) { return a.concat(fontsOfState(p)); }, [])); } catch (e) {}
  document.title = 'عرض: ' + (data.doc.name || 'عرض');
  view(el('div', { class: 'stage-bg' }));
  present6(true, data.i, { follower: k });
}
