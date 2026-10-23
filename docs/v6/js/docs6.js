/* ================= المستند: الفتح والحفظ التلقائي والتراجع والتنزيل وبناء شاشة المحرر ================= */
/* المستند صفحات، وكل صفحة حالة قالب كاملة. التصميم صفحة واحدة، والعرض عدة شرائح */
const GENERIC = { title: 'العنوان الرئيسي', sub: 'العنوان الفرعي', kicker: 'السطر التمهيدي', top: 'السطر التمهيدي', who: 'اسم المقدّم', name: 'الاسم', body: 'النص هنا',
  place: 'المكان', chip: 'الوسم', head: 'عنوان القائمة', intro: 'سطر التمهيد', quote: 'العبارة', foot: 'نص التذييل', src: 'المصدر', role: 'الصفة', desc: 'الوصف', cta: 'زر الدعوة', badge: 'الوسم', tag: 'الوسم' };
const MONTHS = /(محرم|صفر|ربيع|جمادى|رجب|شعبان|رمضان|شوال|ذو القعدة|ذو الحجة|يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر|الأحد|الاثنين|الإثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت|مساء|صباح|هـ\b)/;
// العنوان العام للحقل: الأرقام والأوقات والتواريخ تبقى أمثلة، وغيرها يصير اسم الخانة
function genericOf(f) {
  const def = String(f.def == null ? '' : f.def);
  if (!def.trim() || /[0-9٠-٩]/.test(def) || MONTHS.test(def) || f.kind === 'date' || f.kind === 'image' || f.kind === 'toggle' || f.kind === 'choice' || f.kind === 'hidden') return null;
  if (def.indexOf('|') >= 0 || def.split('\n').length > 3) return null;   // الجداول والقوائم تبقى مثالاً يوضّح الشكل
  return GENERIC[f.k] || String(f.label || '').replace(/\s*\(.*\)\s*/, '').trim() || null;
}
function newPage(tpl, T, generic) {
  const d = defaults(tpl, T), ph = {};
  if (generic) tpl.fields.forEach(function (f) { if (!f.k || typeof d[f.k] !== 'string') return; const g = genericOf(f); if (g) { d[f.k] = g; ph[f.k] = g; } });
  const szs = sizesFor(tpl);
  return { tpl: tpl.id, size: szs[0], d: d, variant: tpl.variants[0].id, k: 1, hide: {}, ov: {}, pos: {}, gs: {}, layers: [], bgfx: null, ph: ph };
}
function pageOfState() {
  const s = snap(); const old = ED.doc.pages[ED.cur] || {};
  // ما يخص الشريحة في العرض الحي (الخطوات والملاحظات والانتقال) ليس من حالة المحرر، فيبقى
  const keep = {}; ['steps', 'notes', 'trans'].forEach(function (k) { if (old[k] !== undefined) keep[k] = old[k]; });
  return Object.assign({ tpl: S.tpl.id, ph: old.ph || {} }, s, keep);
}
function commitPage() { if (ED.doc && S.tpl) ED.doc.pages[ED.cur] = pageOfState(); }
function loadPage(i) {
  const pg = ED.doc.pages[i]; if (!pg) return;
  ED.cur = i;
  const tpl = TEMPLATES.find(function (t) { return t.id === pg.tpl; }) || TEMPLATES.find(function (t) { return t.id === 'blank'; });
  S.tpl = tpl; S.size = tpl.sizes.indexOf(pg.size) >= 0 ? pg.size : sizesFor(tpl)[0];
  const d = defaults(tpl, S.track); Object.keys(pg.d || {}).forEach(function (k) { if (k in d || k === '__n') d[k] = pg.d[k]; });
  if (ED.doc.kind === 'deck') d.__n = i ? String(i + 1) : '';
  S.d = d; S.variant = tpl.variants.some(function (v) { return v.id === pg.variant; }) ? pg.variant : tpl.variants[0].id; S.k = pg.k || 1;
  S.hide = pg.hide || {}; S.ov = pg.ov || {}; S.pos = pg.pos || {}; S.gs = pg.gs || {}; S.layers = pg.layers || []; S.bgfx = pg.bgfx || null; S.sel = null;
  S.names = pg.names || {}; S.front = pg.front || [];
}
// تصاميم الإصدار الخامس وعروضه تُحوَّل إلى صفحات
function docFromItem(item) {
  if (item.pages) return item;
  if (item.kind === 'deck' || item.deck) {
    const dk = item.deck || item;
    return { id: item.id, kind: 'deck', name: item.name || dk.name, track: item.track || dk.track, program: item.program || 'academy', shared: !!item.shared,
      pages: (dk.slides || []).map(function (s) { return { tpl: s.tpl, size: 'slide', d: s.d || {}, variant: dk.style, k: s.k || 1, hide: s.hide || {}, ov: dk.ov || {}, pos: s.pos || {}, gs: {}, layers: s.layers || [], bgfx: dk.bgfx || null, ph: {} }; }) };
  }
  return { id: item.id, kind: 'design', name: item.name, track: item.track, program: item.program || 'academy', shared: !!item.shared,
    pages: [Object.assign({ tpl: item.tpl, ph: {} }, item.st || {})] };
}
function draftKey() { const d = ED.doc; return 'draft.' + (d.id ? 'i.' + d.id : d.track + '.' + d.pages[0].tpl + (d.kind === 'deck' ? '.deck' : '')); }

/* ---------- الفتح ---------- */
async function openNew(tid, tplId) {
  const fromMake = /\?make/.test(tplId || ''); tplId = String(tplId || '').split('?')[0];
  const T = trackOf(tid); if (!T) return go('#/');
  const tpl = TEMPLATES.find(function (t) { return t.id === tplId; }); if (!tpl) return go('#/g/' + tid);
  S.track = T; ls('lastTrack', T.id);
  const key = 'draft.' + T.id + '.' + tpl.id, draft = ls(key), pick = fromMake ? ls('makePick') : null;
  let doc;
  if (pick && pick.page && pick.page.tpl === tpl.id) { ls('makePick', null); doc = { kind: 'design', name: (String(pick.page.d.title || tpl.name).replace(/[*\n]/g, ' ').trim().slice(0, 50)) || tpl.name, track: T.id, program: V6.prog.id, shared: false, pages: [pick.page] }; }
  else doc = draft && draft.pages ? draft : { kind: 'design', name: tpl.id === 'blank' ? 'تصميم جديد' : tpl.name, track: T.id, program: V6.prog.id, shared: false, pages: [newPage(tpl, T, tpl.id !== 'blank')] };
  showEditor6(doc, !!draft && !pick);
  track('open', { tpl: tpl.id });
}
async function openItem(id) {
  view(el('div', { class: 'boot' }, [loader6('نفتح تصميمك…')]));
  let item;
  try { item = await API6.me('item_get', id); } catch (e) { toast(e.message); return go('#/mine'); }
  if (!item) { toast('لم نجد هذا التصميم'); return go('#/mine'); }
  if (item.program && item.program !== V6.prog.id && V6.bundle.programs.some(function (p) { return p.id === item.program; })) await useProgram(item.program, true);
  const doc = docFromItem(item);
  const T = trackOf(doc.track) || tracksOf()[0]; if (!T) return go('#/');
  S.track = T;
  if (!item.mine && !(item.shared && item.coedit)) { doc.id = null; doc.name = item.name + ' — نسختي'; doc.shared = false; doc.model = false; doc.arc = null; doc.from = item.id; }
  else if (!item.mine) { doc.coedit = true; doc.shared = true; doc.teammate = true; doc.model = false; doc.arc = null; }
  const draft = doc.id && item.mine ? ls('draft.i.' + doc.id) : null;
  showEditor6(draft && draft.pages && (draft.at || 0) > (item.at || 0) ? draft : doc, false);
  if (doc.coedit) setTimeout(function () { toast('تصميم مشترك من ' + item.owner + ': ما تعدّله يُحفظ للفريق كله'); }, 800);
  track('open', { tpl: doc.pages[0].tpl });
}
// رابط العرض: #/p/<id> يفتح التصميم أو العرض للمشاهدة فقط (لصاحبه ولفريقه إن كان مشتركاً)
async function showPresent(id) {
  view(el('div', { class: 'boot' }, [loader6('نفتح العرض…')]));
  let item;
  try { item = await API6.me('item_get', id); } catch (e) { toast(e.message); return go('#/'); }
  if (!item) { toast('لم نجد هذا التصميم'); return go('#/'); }
  if (item.program && item.program !== V6.prog.id && V6.bundle.programs.some(function (p) { return p.id === item.program; })) await useProgram(item.program, true);
  const doc = docFromItem(item), T = trackOf(doc.track) || tracksOf()[0]; if (!T) return go('#/');
  S.track = T;
  await ensureFonts(doc.pages.reduce(function (a, p) { return a.concat(fontsOfState(p)); }, []));
  const canEdit = item.mine || (item.shared && item.coedit);
  const cvs = doc.pages.map(function (p, i) { const tpl = TEMPLATES.find(function (t) { return t.id === p.tpl; }), c = el('canvas', { class: 'pvcv' }); p.d.__n = i ? String(i + 1) : ''; renderTo(c, tpl, p.size, p, T, 1); return c; });
  view(el('div', { class: 'wrap page pview' }, [
    el('div', { class: 'phead row wrapr' }, [el('div', {}, [el('span', { class: 'eyebrow', text: (doc.kind === 'deck' ? 'عرض' : 'تصميم') + ' من ' + item.owner }), H('h1', doc.name)]), el('span', { class: 'sp' }),
      doc.kind === 'deck' ? el('button', { type: 'button', class: 'btn dark', onclick: function () { ED.doc = doc; ED.cur = 0; S.tpl = TEMPLATES.find(function (t) { return t.id === doc.pages[0].tpl; }); present6(true); } }, [ico('play'), 'اعرض بملء الشاشة']) : null,
      canEdit ? el('a', { class: 'btn line', href: '#/d/' + item.id }, [ico('pencil'), item.mine ? 'افتحه في المحرر' : 'عدّل مع الفريق']) : el('a', { class: 'btn line', href: '#/d/' + item.id }, [ico('copy'), 'افتح نسخة لي'])]),
    el('div', { class: doc.kind === 'deck' ? 'pvdeck' : 'pvone' }, cvs)
  ]));
}
// فتح تصميم من الأرشيف (للمشرف): نسخة جديدة بجودته الأصلية، لا تمسّ الأصل
async function openArc(m, id) {
  view(el('div', { class: 'boot' }, [loader6('نفتح التصميم من الأرشيف…')]));
  let r;
  try { r = await API6.me('arc_get', m, id); } catch (e) { toast(e.message); return go('#/admin/archive'); }
  const st = JSON.parse(r.state || '{}'), meta = r.meta;
  if (!st.pages || !st.pages.length) { toast('هذا التصميم بلا محتوى محفوظ'); return go('#/admin/archive'); }
  if (meta.program && meta.program !== V6.prog.id && V6.bundle.programs.some(function (p) { return p.id === meta.program; })) await useProgram(meta.program, true);
  const T = trackOf(meta.track) || tracksOf()[0]; if (!T) return go('#/');
  S.track = T;
  showEditor6({ kind: meta.kind === 'deck' ? 'deck' : 'design', name: (meta.name || 'تصميم') + ' — من الأرشيف', track: T.id, program: meta.program, shared: false, pages: st.pages, fromArc: id }, false);
}
function openDeckNew(tid, slides, name) {
  const T = trackOf(tid); S.track = T;
  const pages = slides.map(function (s) { const tpl = TEMPLATES.find(function (t) { return t.id === s.tpl; }) || slideTpl(s.tpl); const pg = newPage(tpl, T, false); Object.assign(pg.d, s.d || {}); return pg; });
  showEditor6({ kind: 'deck', name: name || 'عرض جديد', track: T.id, program: V6.prog.id, shared: false, pages: pages }, false);
}

/* ---------- شاشة المحرر ---------- */
const RAIL = [
  ['content', 'المحتوى', 'content', 1], ['tpls', 'القوالب', 'grid', 1], ['text', 'النصوص', 'text', 0], ['els', 'العناصر', 'shapes', 0],
  ['imgs', 'الصور', 'image', 1], ['colors', 'الألوان', 'palette', 1], ['fonts', 'الخطوط', 'font', 0], ['layers', 'الطبقات', 'layers', 0], ['assist', 'المساعد', 'sparkles', 0]
];
const LEVEL_TABS = { content: ['content', 'tpls', 'imgs'], style: ['content', 'tpls', 'imgs', 'colors', 'fonts', 'layers'] };
function railItems() { const lv = LEVEL_TABS[editLevel()]; return RAIL.filter(function (r) { return (ED.mode === 'full' || r[3] || lv) && (!lv || lv.indexOf(r[0]) >= 0); }); }
function showEditor6(doc, fromDraft) {
  ED.open = true; ED.doc = doc; ED.cur = 0; ED.undo = []; ED.redo = []; ED.autoFit = true; ED.proxies = {}; ED.editing = null;
  ED.mode = ls('emode') || 'simple';
  ED.tab = doc.pages[0].tpl === 'blank' ? 'assist' : 'content';
  if (ED.tab === 'assist') ED.mode = 'full';
  $('#top').hidden = true; document.body.classList.add('in-editor');
  loadPage(0);
  document.title = doc.name + ' — المحرر';
  EPV = el('canvas', { class: 'e-cv', 'aria-label': 'التصميم' });
  const nameI = el('input', { type: 'text', class: 'e-name', value: doc.name, 'aria-label': 'اسم التصميم', dir: 'auto', oninput: function (e) { ED.doc.name = e.target.value; markDirty(); } });
  const back = (TRACKS[doc.track] ? '#/g/' + doc.track : '#/');
  const sizeSel = el('select', { class: 'e-size', 'aria-label': 'المقاس', id: 'e_size', onchange: function (e) { S.size = e.target.value; S.sel = null; changed6(); setTimeout(refit, 0); } });
  const topbar = el('header', { class: 'e-top' }, [
    el('a', { href: back, class: 'ib', 'aria-label': 'رجوع', title: 'رجوع', onclick: function () { leaveEditor(); } }, [ico('chev')]),
    el('a', { href: '#/', class: 'e-logo', 'aria-label': 'الرئيسية', onclick: function () { leaveEditor(); } }, [brandImg('mark')]),
    nameI, el('span', { class: 'e-saved tiny', id: 'e_saved', text: fromDraft ? 'استعدنا مسودتك' : '' }),
    el('span', { class: 'sp' }),
    el('div', { class: 'e-tools' }, [
      el('button', { type: 'button', class: 'ib', id: 'e_undo', title: 'تراجع (Ctrl+Z)', 'aria-label': 'تراجع', onclick: undo6, disabled: true }, [ico('undo')]),
      el('button', { type: 'button', class: 'ib', id: 'e_redo', title: 'إعادة (Ctrl+Shift+Z)', 'aria-label': 'إعادة', onclick: redo6, disabled: true }, [ico('redo')]),
      el('button', { type: 'button', class: 'btn sm line e-reset', id: 'e_reset', title: 'إرجاع الصفحة إلى أصل القالب: النصوص والمواضع والألوان والخطوط', onclick: resetPage6 }, [ico('reset'), el('span', { class: 'hide-s', text: 'إعادة الضبط' })]),
      sizeSel,
      el('div', { class: 'e-mode', title: 'البسيط يعرض الأساسيات، والكامل يفتح كل الأدوات' }, [segOf([['simple', 'بسيط'], ['full', 'تحكم كامل']], ED.mode, function (v) { ED.mode = v; ls('emode', v); buildRail(); if (!railItems().some(function (r) { return r[0] === ED.tab; })) { ED.tab = 'content'; } buildPanel(); })])
    ]),
    el('button', { type: 'button', class: 'ib', id: 'e_share', title: 'شارك بالرابط مع فريقك', 'aria-label': 'مشاركة بالرابط', onclick: function () { shareDialog(); } }, [ico('share')]),
    doc.kind !== 'deck' ? el('button', { type: 'button', class: 'btn line e-cap', id: 'e_cap', title: 'النص المصاحب للإعلان، والإرسال إلى قناة تليجرام', onclick: function () { captionDialog(); } }, [ico('send'), el('span', { class: 'hide-s', text: 'النص والقناة' })]) : null,
    el('button', { type: 'button', class: 'ib', title: 'ملاحظة للفريق', 'aria-label': 'ملاحظة', onclick: function () { showFeedback6(); } }, [ico('chat')]),
    el('button', { type: 'button', class: 'btn line', id: 'e_save', onclick: function () { saveDialog(); } }, [ico('heart'), el('span', { class: 'hide-s', text: doc.id ? 'محفوظ' : 'حفظ' })]),
    el('button', { type: 'button', class: 'btn dark', id: 'e_dl', onclick: function (e) { dlMenu(e.currentTarget); } }, [ico('download'), el('span', { class: 'hide-s', text: 'تنزيل' })])
  ]);
  const rail = el('nav', { class: 'e-rail', 'aria-label': 'الأدوات', id: 'e_rail' });
  const panel = el('aside', { class: 'e-panel', id: 'e_panel' });
  const stage = el('section', { class: 'e-stage' }, [
    el('div', { class: 'e-scroll' }, [el('div', { class: 'e-canvas' }, [EPV, el('div', { id: 'e_konva', class: 'e-konva' })]), el('div', { class: 'e-tb', id: 'e_tb', role: 'toolbar', 'aria-label': 'خصائص العنصر' })]),
    el('span', { class: 'e-axis', id: 'e_axis', hidden: true }),
    el('div', { class: 'e-bottom' }, [
      doc.kind === 'deck' ? el('div', { class: 'e-pages', id: 'e_pages' }) : el('span', { class: 'tiny e-hint', text: 'انقر عنصراً لتعديله · نقر مزدوج على النص للكتابة · Shift أثناء السحب لتقييد الاتجاه' }),
      el('span', { class: 'sp' }),
      el('div', { class: 'e-zoom' }, [
        el('button', { type: 'button', class: 'ib sm', 'aria-label': 'تصغير', onclick: function () { setZoom(ED.zoom / 1.15); } }, [ico('zoomout')]),
        el('button', { type: 'button', class: 'zl', id: 'e_zl', title: 'ملاءمة الشاشة', onclick: function () { ED.autoFit = true; refit(); } }, ['100٪']),
        el('button', { type: 'button', class: 'ib sm', 'aria-label': 'تكبير', onclick: function () { setZoom(ED.zoom * 1.15); } }, [ico('zoomin')])
      ])
    ])
  ]);
  const mtabs = el('nav', { class: 'e-mtabs', id: 'e_mtabs', 'aria-label': 'الأدوات' });
  ED.locked = editLevel() === 'content';   // المحتوى فقط: لا سحب ولا تكبير
  if (editLevel() !== 'full') { const md = $('.e-mode', topbar); if (md) md.remove(); }
  const main = el('div', { class: 'e-main' }, [rail, panel, panelResizer(), stage]);
  const pw = +ls('pw'); if (pw >= 260 && pw <= 680) main.style.setProperty('--pw', pw + 'px');
  const v = view(el('div', { class: 'ed6' }, [topbar, main, mtabs]));
  v.classList.add('ed-view');
  setupKonva();
  buildSizeSel(); buildRail(); buildPanel(); buildPages();
  ensureFonts(fontsOfState(snap())).then(function () { refit(); drawNow(); pushUndo6(true); });
  requestAnimationFrame(function () { refit(); });
  LEAVE.push(leaveEditor);
  setTimeout(function () { maybeTour('editor'); }, 1200);
}
// مقبض بين اللوحة والتصميم: يُسحب لتوسيع اللوحة أو تضييقها، ونقر مزدوج يعيدها لعرضها الأصلي
function panelResizer() {
  const h = el('div', { class: 'e-resize', role: 'separator', 'aria-orientation': 'vertical', 'aria-label': 'عرض اللوحة', title: 'اسحب لتوسيع اللوحة أو تضييقها' });
  h.addEventListener('pointerdown', function (e) {
    e.preventDefault(); h.setPointerCapture(e.pointerId); h.classList.add('on'); document.body.classList.add('resizing');
    const main = h.parentNode, mr = main.getBoundingClientRect(), rail = $('.e-rail').getBoundingClientRect().width;
    function mv(ev) { const w = Math.max(260, Math.min(680, Math.round(mr.right - ev.clientX - rail))); main.style.setProperty('--pw', w + 'px'); ls('pw', w); refit(); }
    function up() { h.classList.remove('on'); document.body.classList.remove('resizing'); h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); refit(); }
    h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up);
  });
  h.addEventListener('dblclick', function () { h.parentNode.style.removeProperty('--pw'); ls('pw', null); refit(); });
  return h;
}
function leaveEditor() {
  if (!ED.open) return;
  commitPage(); saveDraft(true); if (ED.doc.id && ED.dirty) saveRemote(true);
  ED.open = false; $('#top').hidden = false; document.body.classList.remove('in-editor');
  if (ED.stage) { ED.stage.destroy(); ED.stage = null; }
  $$('.cpop,.menu,.ied6').forEach(function (x) { x.remove(); });
  EPV = null;
}
window.addEventListener('resize', function () { if (ED.open) { refit(); placeToolbar(); } });
function buildSizeSel() {
  const s = $('#e_size'); if (!s) return; s.innerHTML = '';
  const szs = sizesFor(S.tpl);
  szs.forEach(function (k) { s.appendChild(el('option', { value: k, text: SIZES[k].name, selected: k === S.size })); });
  s.hidden = szs.length < 2;
}

/* ---------- التغيير والحفظ ---------- */
function markDirty() {
  ED.dirty = true;
  const sv = $('#e_saved'); if (sv) sv.textContent = 'تعديلات غير محفوظة…';
  clearTimeout(ED.saveT); ED.saveT = setTimeout(function () { commitPage(); saveDraft(); }, 900);
  if (ED.doc.id) { clearTimeout(ED.srvT); ED.srvT = setTimeout(function () { saveRemote(true); }, 4000); }
}
function changed6(noUndo) {
  if (!noUndo) pushUndo6(); else { clearTimeout(ED.uT); ED.uT = setTimeout(pushUndo6, 800); }
  redraw(); markDirty();
  if (ED.tab === 'layers') buildPanel();
  if (ED.doc.kind === 'deck') { clearTimeout(ED.thT); ED.thT = setTimeout(function () { refreshPageThumb(ED.cur); }, 500); }
}
function saveDraft(silent) {
  const d = Object.assign({}, ED.doc, { at: Date.now() });
  try { localStorage.setItem('mp6.' + draftKey(), JSON.stringify(d)); if (!silent && !ED.doc.id) { const sv = $('#e_saved'); if (sv) sv.textContent = 'محفوظ مسودةً في هذا الجهاز'; } }
  catch (e) { const sv = $('#e_saved'); if (sv) sv.textContent = 'المسودة أكبر من ذاكرة المتصفح — احفظها في حسابك'; }
}
function thumbOfDoc(w) {
  const p = ED.doc.pages[0], tpl = TEMPLATES.find(function (t) { return t.id === p.tpl; }), c = document.createElement('canvas');
  const sz = SIZES[p.size], sc = (w || 320) / sz.w;
  renderTo(c, tpl, p.size, p, S.track, sc);
  return c.toDataURL('image/jpeg', 0.8);
}
async function saveRemote(quiet) {
  commitPage();
  const d = ED.doc;
  if (!d.id) d.id = newId() + newId();
  const item = { id: d.id, kind: d.kind, name: d.name || 'تصميمي', shared: !!d.shared, coedit: !!d.coedit, tpl: d.pages[0].tpl, track: d.track, program: d.program || V6.prog.id, pages: d.pages, trans: d.trans || '', arc: d.arc || null, thumb: thumbOfDoc() };
  const sv = $('#e_saved'); if (sv) sv.textContent = 'جارٍ الحفظ…';
  try {
    await API6.me('item_save', JSON.stringify(item));
    ED.dirty = false; if (sv) sv.textContent = 'محفوظ في حسابك';
    const sb = $('#e_save span'); if (sb) sb.textContent = 'محفوظ';
    try { localStorage.removeItem('mp6.draft.' + d.track + '.' + d.pages[0].tpl); } catch (e) {}
    if (!quiet) { toast('حُفظ في «تصاميمي»'); track('save', { tpl: item.tpl }); archive6('save'); }
    return true;
  } catch (e) { if (sv) sv.textContent = 'تعذّر الحفظ: ' + e.message; if (!quiet) toast(e.message); return false; }
}
// أرشيف التصاميم: نسخة من كل تصميم يُنزَّل أو يُشارَك أو يُحفظ تصل إلى مدير المنصة ومشرف البرنامج (تعمل في الخلفية ولا تؤخر المستخدم)
async function archive6(via) {
  try {
    if (ED.doc.fromArc) return;   // المشرف يعيد تنزيل تصميم من الأرشيف: لا يُكرَّر
    commitPage();
    const d = ED.doc, p0 = d.pages[0], tpl = TEMPLATES.find(function (t) { return t.id === p0.tpl; }) || {};
    const meta = { id: (d.arc && d.arc.id) || '', m: (d.arc && d.arc.m) || '', name: d.name || tpl.name || 'تصميم', kind: d.kind, tpl: p0.tpl, tplName: tpl.name || '', track: d.track,
      trackName: S.track ? S.track.full.replace('ـ', '') : '', program: d.program || V6.prog.id, size: p0.size, pages: d.pages.length, via: via, item: d.id || '' };
    const r = await API6.me('arc_put', JSON.stringify(meta), JSON.stringify({ pages: d.pages }), thumbOfDoc(480));
    if (ED.doc === d) { d.arc = { id: r.id, m: r.m }; saveDraft(true); }
  } catch (e) { console.warn('archive', e); }
}
function shareUrl(kind, id) { return location.origin + location.pathname + '#/' + kind + '/' + id; }
function linkRow(label, url) {
  const i = el('input', { type: 'text', readonly: true, value: url, dir: 'ltr', class: 'inp sm', onclick: function (e) { e.target.select(); } });
  return el('div', { class: 'linkrow' }, [el('span', { class: 'tiny', text: label }), i, el('button', { type: 'button', class: 'btn sm line', onclick: function () { copyText(url); } }, [ico('copy'), 'نسخ'])]);
}
function canAdminProg(pid) { return V6.me && (V6.me.role === 'super' || (V6.me.role === 'sup' && (V6.me.programs || []).indexOf(pid) >= 0)); }
// إعادة ضبط الصفحة الحالية إلى أصل القالب مع إبقاء ما كتبه المستخدم من نصوص (يُسأل أولاً)
async function resetPage6() {
  const keep = await new Promise(function (ok) {
    modal({ title: 'إعادة الضبط', body: [el('p', { class: 'muted', text: 'تعود هذه الصفحة إلى أصل القالب: المواضع والأحجام والألوان والخطوط والعناصر المضافة والترتيب.' })],
      acts: [{ t: 'أعد الضبط واحتفظ بنصوصي', cls: 'dark', fn: function () { ok('keep'); } }, { t: 'أعد كل شيء حتى النصوص', fn: function () { ok('all'); } }, { t: 'إلغاء', fn: function () { ok(null); } }], onClose: function () { ok(null); } });
  });
  if (!keep) return;
  pushUndo6();
  const T = S.track, tpl = S.tpl, pg = ED.doc.pages[ED.cur], fresh = newPage(tpl, T, keep === 'all');
  fresh.size = S.size;
  if (keep === 'keep') { Object.keys(pg.d || {}).forEach(function (k) { if (typeof pg.d[k] === 'string' && k in fresh.d) fresh.d[k] = pg.d[k]; }); fresh.ph = pg.ph || {}; }
  ED.doc.pages[ED.cur] = fresh; loadPage(ED.cur); select(null); buildPanel(); buildSizeSel(); drawNow(); markDirty(); buildPages();
  toast('عادت الصفحة إلى أصل القالب');
}
// مشاركة بالرابط: تُحفظ أولاً إن لم تكن محفوظة، ثم تُعرض الروابط
async function shareDialog() {
  const d = ED.doc;
  if (d.teammate && d.id) { modal({ title: 'روابط المشاركة', body: [linkRow('رابط العرض', shareUrl('p', d.id)), linkRow('رابط التعديل', shareUrl('d', d.id))], acts: [{ t: 'إغلاق', cls: 'dark' }] }); return; }
  if (!d.id) { toast('احفظ التصميم أولاً، ثم شاركه'); saveDialog(); return; }
  if (!d.shared) { d.shared = true; if (!(await saveRemote(true))) return; toast('صار مشاركاً مع فريقك'); }
  const coI = el('input', { type: 'checkbox', checked: !!d.coedit, onchange: async function (e) { d.coedit = e.target.checked; await saveRemote(true); toast(d.coedit ? 'يستطيع الفريق تعديله' : 'للمشاهدة والنسخ فقط'); } });
  modal({ title: 'شارك مع فريقك', body: [
    el('p', { class: 'tiny', text: 'الروابط تعمل لمن في فريق ' + (V6.prog ? V6.prog.name : 'برنامجك') + ' وله حساب في المنصة.' }),
    linkRow('رابط العرض (مشاهدة وتنزيل)', shareUrl('p', d.id)), linkRow('رابط التعديل', shareUrl('d', d.id)),
    el('label', { class: 'tog' }, [coI, el('span', { text: 'يُسمح للفريق بتعديل التصميم نفسه (وإلا يفتح لهم نسخة)' })])
  ], acts: [{ t: 'إغلاق', cls: 'dark' }] });
}
function saveDialog() {
  const d = ED.doc;
  if (d.teammate) { saveRemote(); return; }
  const nameI = el('input', { type: 'text', id: 'sv_name', value: d.name || '' });
  const shareI = el('input', { type: 'checkbox', checked: !!d.shared });
  const pid = d.program || V6.prog.id, isAdm = canAdminProg(pid);
  const modelI = isAdm ? el('input', { type: 'checkbox', checked: !!d.model }) : null;
  const coI = el('input', { type: 'checkbox', checked: !!d.coedit, disabled: !shareI.checked });
  shareI.addEventListener('change', function () { coI.disabled = !shareI.checked; if (!shareI.checked) coI.checked = false; });
  modal({ title: d.id ? 'حفظ التصميم' : 'احفظه في حسابك', body: [
    el('div', { class: 'fld' }, [el('label', { for: 'sv_name', text: 'الاسم' }), nameI]),
    el('label', { class: 'tog' }, [shareI, el('span', { text: 'شاركه مع فريق ' + (V6.prog ? V6.prog.name : 'برنامجك') + ' (يظهر لهم في «تصاميم الفريق»)' })]),
    el('label', { class: 'tog sub' }, [coI, el('span', { text: 'ويُسمح للفريق بتعديله معي (لا نسخة لهم، بل التصميم نفسه)' })]),
    modelI ? el('label', { class: 'tog' }, [modelI, el('span', { text: 'اجعله نموذجاً للبرنامج (يظهر لكل المستخدمين في الرئيسية والمعرض، ويبدؤون منه بنسخة لهم)' })]) : null,
    d.id ? el('div', { class: 'sharebox' }, [el('b', { text: 'روابط المشاركة' }), el('p', { class: 'tiny', text: 'تعمل لمن في فريق البرنامج وله حساب في المنصة. رابط العرض للمشاهدة، ورابط التعديل يفتح المحرر.' }),
      linkRow('رابط العرض', shareUrl('p', d.id)), linkRow('رابط التعديل', shareUrl('d', d.id))]) : el('p', { class: 'tiny', text: 'بعد الحفظ تظهر هنا روابط المشاركة مع الفريق.' }),
    el('p', { class: 'tiny', text: 'بعد الحفظ يُحفظ كل تعديل تلقائياً، وتجده من أي جهاز.' })
  ], acts: [{ t: 'حفظ', cls: 'dark', fn: async function () { d.name = nameI.value.trim() || 'تصميمي'; d.shared = shareI.checked; d.coedit = shareI.checked && coI.checked; const n = $('.e-name'); if (n) n.value = d.name; const okSave = await saveRemote();
    if (okSave && modelI && modelI.checked !== !!d.model) { try { await API6.me('item_model', d.id, modelI.checked); d.model = modelI.checked; toast(d.model ? 'صار نموذجاً لكل مستخدمي البرنامج' : 'أُزيل من النماذج'); } catch (e) { toast(e.message); } } } }, { t: 'إلغاء' }] });
}

/* ---------- التراجع ---------- */
function pushUndo6(init) {
  if (!init && (ED.dragging || ED.transforming)) { clearTimeout(ED.uT); ED.uT = setTimeout(pushUndo6, 300); return; }   // لا نقطة تراجع في منتصف السحب
  const s = JSON.stringify({ cur: ED.cur, p: pageOfState() });
  if (init) { ED.last = s; ED.undo = []; ED.redo = []; updUndo6(); return; }
  if (ED.last && ED.last !== s) { ED.undo.push(ED.last); if (ED.undo.length > 80) ED.undo.shift(); ED.redo = []; }
  ED.last = s; updUndo6();
}
function applySnap(s) { const o = JSON.parse(s); ED.doc.pages[o.cur] = o.p; loadPage(o.cur); ED.last = s; buildPanel(); buildSizeSel(); select(null); drawNow(); markDirty(); updUndo6(); buildPages(); }
function undo6() { pushUndo6(); if (!ED.undo.length) return; ED.redo.push(ED.last); applySnap(ED.undo.pop()); }
function redo6() { if (!ED.redo.length) return; ED.undo.push(ED.last); applySnap(ED.redo.pop()); }
function updUndo6() { const u = $('#e_undo'), r = $('#e_redo'); if (u) u.disabled = !ED.undo.length; if (r) r.disabled = !ED.redo.length; }

/* ---------- التنزيل والمشاركة ---------- */
function dlMenu(btn) {
  const items = [{ hd: 'تنزيل بجودة عالية' }, { t: 'صورة PNG (أعلى جودة)', ic: 'download', fn: function () { exportImg6('png'); } }, { t: 'صورة JPG (حجم أخف)', ic: 'download', fn: function () { exportImg6('jpg'); } }];
  if (ED.doc.kind === 'deck') items.push({ t: 'العرض كاملاً PDF', ic: 'slides', fn: exportPdf6 }, { t: 'عرض بملء الشاشة', ic: 'play', fn: present6 });
  if (navigator.canShare) items.push('-', { t: 'مشاركة مباشرة', ic: 'share', fn: function () { exportImg6('png', true); } });
  if (ED.doc.kind !== 'deck') items.push('-', { t: 'النص المصاحب وإرسال إلى القناة', ic: 'send', fn: captionDialog });
  popMenu(btn, items);
}
async function checkPlaceholders() {
  commitPage();
  const left = [];
  ED.doc.pages.forEach(function (p) { Object.keys(p.ph || {}).forEach(function (k) { if (p.d[k] === p.ph[k] && !(p.hide || {})['f_' + k]) left.push(p.ph[k]); }); });
  if (!left.length) return true;
  return new Promise(function (ok) {
    modal({ title: 'بقيت عناوين عامة', body: [el('p', { class: 'muted', text: 'هذه الخانات ما زالت بالنص العام ولم تكتب فيها شيئاً:' }), el('div', { class: 'row wrapr' }, left.filter(function (x, i, a) { return a.indexOf(x) === i; }).map(function (t) { return el('span', { class: 'pill or', text: t }); })), el('p', { class: 'tiny', text: 'اكتب فيها، أو أخفها من لوحة المحتوى إن لم تحتجها.' })],
      acts: [{ t: 'أعدّلها', cls: 'dark', fn: function () { ok(false); ED.tab = 'content'; buildRail(); buildPanel(); } }, { t: 'نزّل كما هي', fn: function () { ok(true); } }], onClose: function () { ok(false); } });
  });
}
function fileName6(ext) { return ((S.track ? S.track.name + ' - ' : '') + (ED.doc.name || S.tpl.name)).replace(/[\\\/:?"<>|*\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) + '.' + ext; }
async function exportImg6(fmt, share) {
  if (!(await checkPlaceholders())) return;
  await ensureFonts(fontsOfState(snap()));
  const c = document.createElement('canvas'); renderTo(c, S.tpl, S.size, snap(), S.track, 2);
  if (fmt === 'jpg') { const g = c.getContext('2d'); g.globalCompositeOperation = 'destination-over'; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); }
  const name = fileName6(fmt === 'png' ? 'png' : 'jpg');
  c.toBlob(function (blob) {
    track('export', { tpl: S.tpl.id }); archive6(share ? 'share' : fmt);
    if (share && navigator.canShare) { const f = new File([blob], name, { type: blob.type }); if (navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: ED.doc.name }).catch(function () {}); return; } }
    const url = URL.createObjectURL(blob), a = el('a', { href: url, download: name }); document.body.appendChild(a); a.click(); a.remove();
    const sz = SIZES[S.size];
    const fileForShare = navigator.canShare ? new File([blob], name, { type: blob.type }) : null;
    modal({ title: 'بدأ التنزيل', body: [el('p', { class: 'muted small', text: 'المقاس ' + sz.w * 2 + ' × ' + sz.h * 2 + ' بكسل، والحجم ' + (blob.size / 1048576).toFixed(1) + ' ميغابايت. في الجوال: إن لم يظهر الملف، اضغط على الصورة مطولاً واختر الحفظ.' }), el('img', { src: url, alt: 'التصميم', class: 'dlprev' })],
      acts: [fileForShare && navigator.canShare({ files: [fileForShare] }) ? { t: 'مشاركة', cls: 'dark', fn: function () { navigator.share({ files: [fileForShare], title: ED.doc.name }).catch(function () {}); } } : null, { t: 'إغلاق' }] });
  }, fmt === 'png' ? 'image/png' : 'image/jpeg', 0.94);
}
async function exportPdf6() {
  if (!(await checkPlaceholders())) return;
  commitPage(); toast('نجهّز ملف PDF…');
  const pages = [];
  for (let i = 0; i < ED.doc.pages.length; i++) {
    const p = ED.doc.pages[i], tpl = TEMPLATES.find(function (t) { return t.id === p.tpl; }), c = document.createElement('canvas');
    p.d.__n = i ? String(i + 1) : '';
    await ensureFonts(fontsOfState(p));
    renderTo(c, tpl, p.size, p, S.track, 1);
    pages.push({ bytes: b64bytes(c.toDataURL('image/jpeg', 0.92)), w: c.width, h: c.height });
    await new Promise(function (r) { setTimeout(r, 0); });
  }
  const blob = buildPdf(pages, 960, 540), url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: fileName6('pdf') }); document.body.appendChild(a); a.click(); a.remove();
  track('export', { tpl: 'deck' }); archive6('pdf'); toast('بدأ تنزيل العرض (' + pages.length + ' شرائح)');
}
/* العرض الحي انتقل إلى slides6.js */

/* ---------- شرائح العرض في الشريط السفلي ---------- */
function pageThumb(i) {
  const p = ED.doc.pages[i], tpl = TEMPLATES.find(function (t) { return t.id === p.tpl; }), c = el('canvas');
  setTimeout(function () { p.d.__n = i ? String(i + 1) : ''; renderTo(c, tpl, p.size, p, S.track, 0.1); }, 10 + i * 10);
  return c;
}
function refreshPageThumb(i) { commitPage(); const b = $$('#e_pages .pg')[i]; if (b) { const c = b.querySelector('canvas'); const p = ED.doc.pages[i], tpl = TEMPLATES.find(function (t) { return t.id === p.tpl; }); renderTo(c, tpl, p.size, p, S.track, 0.1); } }
function buildPages() {
  const box = $('#e_pages'); if (!box) return; box.innerHTML = '';
  ED.doc.pages.forEach(function (p, i) {
    box.appendChild(el('button', { type: 'button', class: 'pg' + (i === ED.cur ? ' on' : ''), title: 'الشريحة ' + (i + 1), onclick: function () { if (i === ED.cur) return; commitPage(); loadPage(i); select(null); buildPanel(); drawNow(); buildPages(); pushUndo6(true); },
      oncontextmenu: function (e) { e.preventDefault(); pageMenu(e.currentTarget, i); } }, [pageThumb(i), el('small', { text: String(i + 1) })]));
  });
  box.appendChild(el('button', { type: 'button', class: 'pg add', title: 'شريحة جديدة', onclick: function (e) { addPageMenu(e.currentTarget); } }, [ico('plus')]));
  box.appendChild(el('button', { type: 'button', class: 'ib sm', title: 'خيارات الشريحة', 'aria-label': 'خيارات الشريحة', onclick: function (e) { pageMenu(e.currentTarget, ED.cur); } }, [ico('more')]));
}
function pageMenu(anchor, i) {
  const n = ED.doc.pages.length;
  popMenu(anchor, [
    { t: 'تكرار الشريحة', ic: 'copy', fn: function () { commitPage(); ED.doc.pages.splice(i + 1, 0, JSON.parse(JSON.stringify(ED.doc.pages[i]))); loadPage(i + 1); afterPages(); } },
    i > 0 ? { t: 'تحريكها للأمام', ic: 'chev', fn: function () { commitPage(); const p = ED.doc.pages.splice(i, 1)[0]; ED.doc.pages.splice(i - 1, 0, p); loadPage(i - 1); afterPages(); } } : null,
    i < n - 1 ? { t: 'تحريكها للخلف', ic: 'chev', fn: function () { commitPage(); const p = ED.doc.pages.splice(i, 1)[0]; ED.doc.pages.splice(i + 1, 0, p); loadPage(i + 1); afterPages(); } } : null,
    { t: 'الظهور التدريجي والملاحظات والانتقال', ic: 'wand', fn: function () { slideSettings(i); } },
    { t: 'تطبيق ألوانها وخلفيتها على كل الشرائح', ic: 'palette', fn: function () { commitPage(); const src = ED.doc.pages[i]; ED.doc.pages.forEach(function (p) { p.variant = src.variant; p.ov = Object.assign({}, src.ov); p.bgfx = src.bgfx ? Object.assign({}, src.bgfx) : null; }); loadPage(ED.cur); afterPages(); toast('طُبّقت على ' + n + ' شرائح'); } },
    n > 1 ? '-' : null,
    n > 1 ? { t: 'حذف الشريحة', ic: 'trash', fn: function () { commitPage(); ED.doc.pages.splice(i, 1); loadPage(Math.max(0, Math.min(i, ED.doc.pages.length - 1))); afterPages(); } } : null
  ].filter(Boolean));
}
function afterPages() { select(null); buildPanel(); drawNow(); buildPages(); markDirty(); pushUndo6(true); }
function addPageMenu(anchor) {
  const list = SLIDE_TPLS.map(function (t) { return { t: t.name, ic: 'slides', fn: function () { commitPage(); const cur = ED.doc.pages[ED.cur]; const pg = newPage(t, S.track, false); pg.variant = cur.variant; pg.ov = Object.assign({}, cur.ov); pg.bgfx = cur.bgfx; ED.doc.pages.splice(ED.cur + 1, 0, pg); loadPage(ED.cur + 1); afterPages(); } }; });
  popMenu(anchor, [{ hd: 'شريحة جديدة' }].concat(list));
}

/* ---------- لوحة المفاتيح ---------- */
document.addEventListener('keydown', function (e) {
  if (!ED.open) return;
  const tag = document.activeElement && document.activeElement.tagName;
  const typing = /INPUT|TEXTAREA|SELECT/.test(tag) && document.activeElement.type !== 'range';
  const mod = e.ctrlKey || e.metaKey;
  if (mod && (e.key === 'z' || e.key === 'Z' || e.key === 'ز') && !typing) { e.preventDefault(); if (e.shiftKey) redo6(); else undo6(); return; }
  if (mod && (e.key === 'y' || e.key === 'غ') && !typing) { e.preventDefault(); redo6(); return; }
  if (mod && (e.key === 's' || e.key === 'س')) { e.preventDefault(); if (ED.doc.id) saveRemote(); else saveDialog(); return; }
  if (typing) return;
  if (!S.sel) return;
  const L = isLayer(S.sel) ? layerById(S.sel.slice(2)) : null;
  const k = e.shiftKey ? 10 : 1;
  const m = { ArrowLeft: [-k, 0], ArrowRight: [k, 0], ArrowUp: [0, -k], ArrowDown: [0, k] }[e.key];
  if (m) { e.preventDefault(); moveSel(m[0], m[1]); changed6(true); return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && L) { e.preventDefault(); delLayer6(L.id); return; }
  if (mod && (e.key === 'd' || e.key === 'ي') && L) { e.preventDefault(); dupLayer(L); return; }
  if (e.key === 'Escape') { select(null); return; }
  if (e.key === 'Enter' && fieldsOfGroup(S.sel).length) { e.preventDefault(); openInline6(S.sel); }
});
