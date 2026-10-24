/* ================= المحرر على الجوال: التصميم ظاهر دائماً، والأدوات ورقة سفلية بثلاثة مستويات (طرف، نصف، كامل) =================
   نعيد استعمال محرك المحرر كاملاً (Konva، اللوحات، الحفظ)، ونغيّر البنية والترتيب: الأهم أولاً، والباقي خلف «المزيد». */
const MED = { detent: 'peek', h: { peek: 112, half: 0.46, full: 0.86 } };
const M_RAIL_ORDER = ['content', 'colors', 'imgs', 'bg', 'tpls', 'anim', 'text', 'els', 'fonts', 'layers', 'assist'];
// الترتيب حسب الأولوية على الجوال، وكل الأدوات متاحة (التحكم الكامل) ضمن حدود درجة التعديل
const railItemsDesk = railItems;
railItems = function () {
  if (!document.body.classList.contains('mapp')) return railItemsDesk();
  const lv = LEVEL_TABS[editLevel()];
  const all = RAIL.slice(); if (ED.doc && ED.doc.kind === 'deck') all.push(['anim', 'الحركة', 'sparkles', 1]);
  return all.filter(function (r) { return !lv || lv.indexOf(r[0]) >= 0; }).sort(function (a, b) { return M_RAIL_ORDER.indexOf(a[0]) - M_RAIL_ORDER.indexOf(b[0]); });
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
}
function mRail() {
  const r = el('div', { class: 'mrail', role: 'tablist' });
  railItems().forEach(function (it) {
    r.appendChild(el('button', { type: 'button', class: ED.tab === it[0] ? 'on' : '', 'data-tab': it[0], role: 'tab', onclick: function () { if (ED.tab === it[0] && MED.detent !== 'peek') { sheetTo('peek'); return; } ED.tab = it[0]; buildPanel(); if (MED.detent === 'peek') sheetTo('half'); track('tool', { tool: 'tab_' + it[0] }); } }, [ico(it[2]), el('span', { text: it[1] })]));
  });
  if (ED.tab === 'el') r.appendChild(el('button', { type: 'button', class: 'on', 'data-tab': 'el' }, [ico('pencil'), el('span', { text: 'العنصر' })]));
  setTimeout(function () { const on = r.querySelector('.on'); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' }); }, 30);
  return r;
}
// بعد كل بناء للوحة: نضيف شريط الأدوات الأفقي والمقبض القابل للسحب
const buildPanelDesk = buildPanel;
buildPanel = function () {
  buildPanelDesk();
  if (!document.body.classList.contains('mapp')) return;
  const p = $('#e_panel'); if (!p) return;
  const grab = p.querySelector('.grab'), rail = mRail();
  if (grab) grab.after(rail); else p.insertBefore(rail, p.firstChild);
  const pb = p.querySelector('.pbody'); if (pb) pb.classList.add('pbody');
  attachSheetDrag(p);
  if (!MED.detent) sheetTo('peek', false);
};
const openTabDesk = openTab;
openTab = function (t) { if (!document.body.classList.contains('mapp')) return openTabDesk(t); ED.tab = t; buildPanel(); if (MED.detent === 'peek') sheetTo('half'); track('tool', { tool: 'tab_' + t }); };
function attachSheetDrag(p) {
  if (p._mdrag) return; p._mdrag = true;
  let sy = 0, sh = 0, drag = false, lastY = 0, lastT = 0, vel = 0;
  const start = function (e) {
    const t = e.touches ? e.touches[0] : e; const inBody = e.target.closest('.pbody');
    if (inBody && (MED.detent !== 'full' || inBody.scrollTop > 0)) return;   // في النصف يسحب الجسم الورقة؛ في الكامل يمرّر الجسم
    sy = t.clientY; sh = p.getBoundingClientRect().height; drag = true; lastY = sy; lastT = Date.now(); vel = 0; p.classList.add('dragging');
  };
  const move = function (e) {
    if (!drag) return; const t = e.touches ? e.touches[0] : e; const dy = sy - t.clientY, h = Math.max(70, Math.min(innerHeight * 0.92, sh + dy));
    document.documentElement.style.setProperty('--sheet-h', h + 'px'); const now = Date.now(); vel = (t.clientY - lastY) / Math.max(1, now - lastT); lastY = t.clientY; lastT = now;
    p.classList.toggle('peek', h < sheetPx('peek') + 40);
    if (e.cancelable) e.preventDefault();
  };
  const end = function () {
    if (!drag) return; drag = false; p.classList.remove('dragging');
    const h = p.getBoundingClientRect().height, ds = ['peek', 'half', 'full'];
    let best = ds.reduce(function (a, d) { return Math.abs(sheetPx(d) - h) < Math.abs(sheetPx(a) - h) ? d : a; }, 'peek');
    const idx = ds.indexOf(best);
    if (vel > 0.6) best = ds[Math.max(0, idx - (sheetPx(best) >= h ? 1 : 0))];          // سحب سريع للأسفل
    else if (vel < -0.6) best = ds[Math.min(2, idx + (sheetPx(best) <= h ? 1 : 0))];   // سحب سريع للأعلى
    sheetTo(best);
  };
  p.addEventListener('touchstart', start, { passive: true }); p.addEventListener('touchmove', move, { passive: false }); p.addEventListener('touchend', end);
  p.addEventListener('mousedown', function (e) { if (e.target.closest('.grab,.mrail')) { start(e); const mv = function (ev) { move(ev); }, up = function () { end(); document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); }; document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up); } });
}
// بعد فتح المحرر: الشريط العلوي المختصر وقائمة «المزيد»
const showEditor6Desk = showEditor6;
showEditor6 = function (doc, fromDraft) {
  showEditor6Desk(doc, fromDraft);
  if (!document.body.classList.contains('mapp')) return;
  MED.detent = null; ED.autoFit = true;
  const top = $('.e-top'); if (top && !top.querySelector('.mmore')) {
    const more = el('button', { type: 'button', class: 'ib mmore', 'aria-label': 'المزيد', onclick: function () {
      mactions(null, [
        doc.kind !== 'deck' ? { t: 'النص المصاحب والنشر في القناة', ic: 'send', fn: function () { captionDialog(); } } : null,
        { t: 'شارك بالرابط مع فريقك', ic: 'share', fn: function () { shareDialog(); } },
        { t: 'مراجعة التصميم', ic: 'review', fn: function () { const b = $('#e_rv'); if (b) reviewMenu(b); } },
        { t: 'التعليقات', ic: 'comment', fn: function () { commentsDialog(); } },
        doc.kind === 'deck' ? { t: 'اعرض بملء الشاشة', ic: 'play', fn: function () { present6(false, ED.cur); } } : null,
        { t: 'تراجع', ic: 'undo', fn: undo6 }, { t: 'إعادة', ic: 'redo', fn: redo6 },
        { t: 'إعادة ضبط الصفحة إلى القالب', ic: 'reset', fn: resetPage6 },
        { t: 'المقاس: ' + ((SIZES[S.size] || {}).name || ''), ic: 'grid', fn: function () { mactions(null, (S.tpl.sizes || []).map(function (sz) { return { t: SIZES[sz].name, fn: function () { S.size = sz; S.sel = null; changed6(); buildSizeSel(); setTimeout(refit, 0); } }; }), 'المقاس'); } },
        { t: 'ملاحظة للفريق', ic: 'chat', fn: function () { showFeedback6(); } }
      ], ED.doc.name);
    } }, [ico('more')]);
    const nameI = top.querySelector(".e-name"); top.insertBefore(more, nameI);
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
  const sz = SIZES[S.size], avail = box.clientHeight - sheetPx('peek') - 36;
  return Math.max(0.08, Math.min((box.clientWidth - 28) / sz.w, avail / sz.h, 2));
};
