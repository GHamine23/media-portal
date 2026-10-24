/* ================= المحرر على الجوال: التصميم ظاهر دائماً، والأدوات ورقة سفلية بثلاثة مستويات (طرف، نصف، كامل) =================
   نعيد استعمال محرك المحرر كاملاً (Konva، اللوحات، الحفظ)، ونغيّر البنية والترتيب: الأهم أولاً، والباقي خلف «المزيد». */
const MED = { detent: 'peek', h: { peek: 112, half: 0.5, full: 0.8 } };
const M_RAIL_ORDER = ['content', 'colors', 'imgs', 'bg', 'tpls', 'anim', 'pub', 'text', 'els', 'fonts', 'layers', 'assist'];
// الترتيب حسب الأولوية على الجوال، وكل الأدوات متاحة (التحكم الكامل) ضمن حدود درجة التعديل
const railItemsDesk = railItems;
railItems = function () {
  if (!document.body.classList.contains('mapp')) return railItemsDesk();
  const lv = LEVEL_TABS[editLevel()];
  const all = RAIL.slice(); if (ED.doc && ED.doc.kind === 'deck') all.push(['anim', 'الحركة', 'sparkles', 1]);
  return railAdjust(all.filter(function (r) { return !lv || lv.indexOf(r[0]) >= 0; })).sort(function (a, b) { return M_RAIL_ORDER.indexOf(a[0]) - M_RAIL_ORDER.indexOf(b[0]); });
};
function sheetPx(d) { const v = MED.h[d]; return v <= 1 ? Math.round(innerHeight * v) : v; }
function sheetTo(d, animate) {
  const p = $('#e_panel'); if (!p) return;
  MED.detent = d; const px = sheetPx(d);
  p.classList.toggle('peek', d === 'peek'); p.classList.toggle('dragging', animate === false);
  document.documentElement.style.setProperty('--sheet-h', px + 'px');
  document.documentElement.style.setProperty('--sheet-peek', sheetPx('peek') + 'px');
  if (animate !== false) setTimeout(function () { p.classList.remove('dragging'); }, 10);
  haptic();
  // التصميم يصغر ويصعد فوق اللوحة فتبقى التعديلات ظاهرة
  clearTimeout(MED.fitT); MED.fitT = setTimeout(function () { if (ED.open) { ED.autoFit = true; refit(); } }, animate === false ? 0 : 60);
}
function mRail() {
  const r = el('div', { class: 'mrail', role: 'tablist' });
  railItems().forEach(function (it) {
    r.appendChild(el('button', { type: 'button', class: ED.tab === it[0] ? 'on' : '', 'data-tab': it[0], role: 'tab', onclick: function () { if (ED.tab === it[0] && MED.detent !== 'peek') { sheetTo('peek'); return; } ED.tab = it[0]; buildPanel(); if (MED.detent === 'peek') sheetTo('half'); track('tool', { tool: 'tab_' + it[0] }); } }, [ico(it[2]), el('span', { text: it[1] })]));
  });
  if (ED.tab === 'el') r.appendChild(el('button', { type: 'button', class: 'on', 'data-tab': 'el' }, [ico('pencil'), el('span', { text: 'العنصر' })]));
  return r;
}
// بعد كل بناء للوحة: نضيف شريط الأدوات الأفقي والمقبض القابل للسحب
const buildPanelDesk = buildPanel;
buildPanel = function () {
  // موضع شريط الأدوات قبل إعادة البناء: يبقى كما هو فلا يقفز الشريط يساراً ثم يعود
  const old = document.querySelector('#e_panel .mrail'), prevX = old ? old.scrollLeft : null;
  buildPanelDesk();
  if (!document.body.classList.contains('mapp')) return;
  const p = $('#e_panel'); if (!p) return;
  const grab = p.querySelector('.grab'), rail = railHints(mRail()), mr = rail.querySelector('.mrail');
  if (grab) grab.after(rail); else p.insertBefore(rail, p.firstChild);
  if (mr) {
    mr.style.scrollBehavior = 'auto';
    if (prevX != null) mr.scrollLeft = prevX;
    // الأداة المختارة إن كانت خارج المرئي: يُمرَّر إليها بأقصر مسافة وبهدوء
    const on = mr.querySelector('.on');
    if (on) { const rr = mr.getBoundingClientRect(), ro = on.getBoundingClientRect(); if (ro.left < rr.left + 8 || ro.right > rr.right - 8) { mr.style.scrollBehavior = ''; on.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: prevX == null ? 'auto' : 'smooth' }); } }
    requestAnimationFrame(function () { mr.style.scrollBehavior = ''; });
  }
  const pb = p.querySelector('.pbody'); if (pb) pb.classList.add('pbody');
  attachSheetDrag(p);
  if (!MED.detent) sheetTo('peek', false);
};
const openTabDesk = openTab;
openTab = function (t) { if (!document.body.classList.contains('mapp')) return openTabDesk(t); ED.tab = t; buildPanel(); if (MED.detent === 'peek') sheetTo('half'); track('tool', { tool: 'tab_' + t }); };
function attachSheetDrag(p) {
  if (p._mdrag) return; p._mdrag = true;
  let sx = 0, sy = 0, sh = 0, drag = false, decided = false, inRail = false, inBody = null, lastY = 0, lastT = 0, vel = 0;
  // المقبض والشريط والعنوان تسحب الورقة عمودياً؛ الشريط يُمرَّر أفقياً بين الأدوات؛ جسم اللوحة يُمرَّر، وإن كان في أعلاه وسُحب للأسفل نزلت الورقة
  const start = function (e) {
    const t = e.touches ? e.touches[0] : e;
    if (e.target.closest('input,textarea,select,[contenteditable=true],.e-tb')) return;
    inBody = e.target.closest('.pbody'); inRail = !!e.target.closest('.mrail');
    sx = t.clientX; sy = t.clientY; sh = p.getBoundingClientRect().height; drag = true; decided = false; lastY = sy; lastT = Date.now(); vel = 0;
  };
  const move = function (e) {
    if (!drag) return; const t = e.touches ? e.touches[0] : e; const dx = t.clientX - sx, dyRaw = t.clientY - sy;
    if (!decided) {
      if (Math.abs(dx) < 6 && Math.abs(dyRaw) < 6) return;
      decided = true;
      if (Math.abs(dx) > Math.abs(dyRaw)) { drag = false; return; }                        // تمرير أفقي (بين الأدوات)
      if (inBody && !(dyRaw > 0 && inBody.scrollTop <= 0)) { drag = false; return; }        // تمرير المحتوى
      p.classList.add('dragging');
    }
    const h = Math.max(70, Math.min(innerHeight * 0.92, sh - dyRaw));
    document.documentElement.style.setProperty('--sheet-h', h + 'px'); const now = Date.now(); vel = (t.clientY - lastY) / Math.max(1, now - lastT); lastY = t.clientY; lastT = now;
    p.classList.toggle('peek', h < sheetPx('peek') + 40);
    if (e.cancelable) e.preventDefault();
  };
  const end = function () {
    if (!drag) return; drag = false; if (!decided) return; p.classList.remove('dragging');
    const h = p.getBoundingClientRect().height, ds = ['peek', 'half', 'full'];
    let best = ds.reduce(function (a, d) { return Math.abs(sheetPx(d) - h) < Math.abs(sheetPx(a) - h) ? d : a; }, 'peek');
    const idx = ds.indexOf(best);
    if (vel > 0.6) best = ds[Math.max(0, idx - (sheetPx(best) >= h ? 1 : 0))];          // سحب سريع للأسفل
    else if (vel < -0.6) best = ds[Math.min(2, idx + (sheetPx(best) <= h ? 1 : 0))];   // سحب سريع للأعلى
    sheetTo(best);
  };
  p.addEventListener('touchstart', start, { passive: true }); p.addEventListener('touchmove', move, { passive: false }); p.addEventListener('touchend', end);
  p.addEventListener('mousedown', function (e) { if (e.target.closest('.grab,.phd')) { start(e); const mv = function (ev) { move(ev); }, up = function () { end(); document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); }; document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up); } });
}
// شريط الأدوات: تظليل الحافة التي وراءها أدوات أخرى، وسهم صغير يمرّر إليها
function railHints(r) {
  const wrap = el('div', { class: 'mrailw' }, [r]);
  const nx = el('button', { type: 'button', class: 'mrnext', 'aria-label': 'أدوات أخرى', onclick: function () { r.scrollBy({ left: -r.clientWidth * 0.7, behavior: 'smooth' }); } }, [ico('chev')]);
  const pv = el('button', { type: 'button', class: 'mrprev', 'aria-label': 'الأدوات السابقة', onclick: function () { r.scrollBy({ left: r.clientWidth * 0.7, behavior: 'smooth' }); } }, [ico('chev')]);
  wrap.append(pv, nx);
  const upd = function () { const max = r.scrollWidth - r.clientWidth, x = Math.abs(r.scrollLeft); wrap.classList.toggle('more-l', max > 4 && x < max - 4); wrap.classList.toggle('more-r', x > 4); };
  r.addEventListener('scroll', upd, { passive: true }); setTimeout(upd, 60); setTimeout(upd, 400);
  return wrap;
}
// بعد فتح المحرر: الشريط العلوي المختصر وقائمة «المزيد»
const showEditor6Desk = showEditor6;
showEditor6 = function (doc, fromDraft) {
  showEditor6Desk(doc, fromDraft);
  if (!document.body.classList.contains('mapp')) return;
  MED.detent = null; ED.autoFit = true;
  ED.backStep = function () { if (MED.detent && MED.detent !== 'peek') { sheetTo('peek'); return true; } return false; };
  const top = $('.e-top'); if (top && !top.querySelector('.e-more')) {
    const more = el('button', { type: 'button', class: 'ib e-more', 'aria-label': 'خيارات التصميم', onclick: function () {
      mactions(null, [
        doc.kind !== 'deck' ? { t: 'النص المصاحب والنشر في القناة', ic: 'send', fn: function () { openPublish(false); } } : null,
        { t: 'شارك بالرابط مع فريقك', ic: 'share', fn: function () { shareDialog(); } },
        { t: 'مراجعة التصميم', ic: 'review', fn: function () { const b = $('#e_rv'); if (b) reviewMenu(b); } },
        { t: 'التعليقات', ic: 'comment', fn: function () { commentsDialog(); } },
        doc.kind === 'deck' ? { t: 'اعرض بملء الشاشة', ic: 'play', fn: function () { present6(false, ED.cur); } } : null,
        { t: 'تراجع', ic: 'undo', fn: undo6 }, { t: 'إعادة', ic: 'redo', fn: redo6 },
        { t: 'إعادة ضبط الصفحة إلى القالب', ic: 'reset', fn: resetPage6 },
        { t: 'المقاس: ' + ((SIZES[S.size] || {}).name || ''), ic: 'grid', fn: function () { mactions(null, (S.tpl.sizes || []).map(function (sz) { return { t: SIZES[sz].name, fn: function () { S.size = sz; S.sel = null; changed6(); buildSizeSel(); setTimeout(refit, 0); } }; }), 'المقاس'); } },
        typeof askAthar === 'function' ? { t: 'اسأل أثر', ic: 'help', fn: function () { askAthar(); } } : null,
        { t: 'ملاحظة للفريق', ic: 'chat', fn: function () { showFeedback6(); } }
      ], ED.doc.name);
    } }, [ico('more')]);
    const dl = top.querySelector('#e_dl'); if (dl) top.insertBefore(more, dl); else top.appendChild(more);
    // تراجع سريع ظاهر دائماً بجانب «المزيد»
    const und = el('button', { type: 'button', class: 'ib e-mundo', id: 'e_mundo', 'aria-label': 'تراجع', title: 'تراجع', disabled: !ED.undo.length, onclick: function () { undo6(); haptic(); } }, [ico('undo')]);
    top.insertBefore(und, more);
  }
  setTimeout(function () { sheetTo('peek', false); refit(); }, 50);
  window.addEventListener('resize', function onr() { if (!ED.open) { window.removeEventListener('resize', onr); return; } sheetTo(MED.detent || 'peek', false); });
};
// اختيار عنصر: يبقى التصميم ظاهراً، والشريط السياقي فوق الورقة؛ وإن كانت الورقة كاملة نخفضها إلى النصف
const selectDesk = select;
select = function (g) { selectDesk(g); if (document.body.classList.contains('mapp') && g && MED.detent === 'full') sheetTo('half'); };
const openElPanelDesk = openElPanel;
openElPanel = function (g) { openElPanelDesk(g); if (document.body.classList.contains('mapp') && MED.detent === 'peek') sheetTo('half'); };
// المحرر المدمج للنص: فوق الورقة
const openInline6Desk = openInline6;
openInline6 = function (g) { openInline6Desk(g); if (document.body.classList.contains('mapp')) { const b = $('.ied6'); if (b) b.classList.add('mob'); if (MED.detent === 'full') sheetTo('half'); } };
// ملاءمة التصميم: المساحة فوق الورقة
const fitZoomDesk = fitZoom;
fitZoom = function () {
  if (!document.body.classList.contains('mapp')) return fitZoomDesk();
  const box = $('.e-scroll'); if (!box || !S.size) return 1;
  const sz = SIZES[S.size], tb = 60;   // مكان الشريط السياقي محجوز دائماً فلا يقفز التصميم عند التحديد
  const avail = box.clientHeight - sheetPx(MED.detent || 'peek') - 28 - tb;
  return Math.max(0.05, Math.min((box.clientWidth - 28) / sz.w, Math.max(60, avail) / sz.h, 2));
};
