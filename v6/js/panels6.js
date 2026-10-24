/* ================= ألواح المحرر: المحتوى، القوالب، النصوص، العناصر، الصور، الألوان، الخطوط، الطبقات، المساعد ================= */
function buildRail() {
  const rail = $('#e_rail'), mt = $('#e_mtabs'); if (!rail) return;
  rail.innerHTML = ''; mt.innerHTML = '';
  railItems().forEach(function (r) {
    const on = ED.tab === r[0];
    const mk = function () { return el('button', { type: 'button', class: on ? 'on' : '', 'data-tab': r[0], 'aria-pressed': on ? 'true' : 'false', onclick: function () { openTab(r[0]); } }, [ico(r[2]), el('span', { text: r[1] })]); };
    rail.appendChild(mk()); mt.appendChild(mk());
  });
}
function openTab(t) {
  const narrow = window.innerWidth <= 860;
  if (narrow && ED.tab === t && document.body.classList.contains('sheet-open')) { document.body.classList.remove('sheet-open'); return; }
  ED.tab = t; buildRail(); buildPanel();
  if (narrow) document.body.classList.add('sheet-open');
  track('tool', { tool: 'tab_' + t });
}
function panelHead(title, note) {
  return el('div', { class: 'phd' }, [el('h3', { text: title }), note ? el('p', { class: 'tiny', text: note }) : null,
    el('button', { type: 'button', class: 'ib sm sheet-x', 'aria-label': 'إغلاق', onclick: function () { document.body.classList.remove('sheet-open'); } }, [ico('close')])]);
}
function buildPanel() {
  const p = $('#e_panel'); if (!p) return;
  const st = p.scrollTop;
  p.innerHTML = '';
  p.appendChild(el('div', { class: 'grab', 'aria-hidden': 'true' }));
  const body = el('div', { class: 'pbody' }); p.appendChild(body);
  ({ content: pContent, tpls: pTpls, text: pText, els: pEls, imgs: pImgs, colors: pColors, fonts: pFonts, layers: pLayers, assist: pAssist, el: pEl, anim: pAnim, bg: pBg, pub: pPub }[ED.tab] || pContent)(body);
  // حركة هادئة عند تبديل اللوحة فقط (لا عند كل تعديل): ظهور خفيف، والأجزاء الأولى تتتابع قليلاً
  if (ED.lastTab !== ED.tab) { body.classList.add('fresh'); Array.prototype.forEach.call(body.children, function (c, i) { c.style.setProperty('--i', Math.min(i, 8)); }); ED.lastTab = ED.tab; p.scrollTop = 0; }
  else p.scrollTop = st;
}

/* ---------- المحتوى ---------- */
function pContent(b) {
  const tpl = S.tpl, pg = ED.doc.pages[ED.cur], ph = pg.ph || {};
  b.appendChild(panelHead('المحتوى', 'اكتب نصوصك؛ ما تتركه فارغاً لا يظهر، وما بين *نجمتين* يظهر بلون مميز.'));
  b.appendChild(el('div', { class: 'row wrapr ctools' }, [el('button', { type: 'button', class: 'btn sm line', title: 'آية بنصها من المصحف أو حديث بحكم المحدث', onclick: function () { verifiedTextDialog(insertVerified); } }, [ico('book'), 'آية أو حديث موثّق']), aiReady() ? el('button', { type: 'button', class: 'btn sm line', title: 'يصحح الإملاء ويشكّل النصوص بالذكاء', onclick: spellDialog }, [ico('ai'), 'تصحيح وتشكيل']) : null]));
  if (tpl.id === 'blank') { b.appendChild(el('p', { class: 'muted small', text: 'هذه صفحة بيضاء: أضف النصوص والعناصر من الأدوات، أو اختر قالباً.' })); b.appendChild(el('button', { type: 'button', class: 'btn dark', text: 'ابدأ بالمساعد', onclick: function () { ED.mode = 'full'; openTab('assist'); } })); return; }
  const form = el('div', { class: 'pform' });
  tpl.fields.forEach(function (f) {
    if (!f.k && f.kind !== 'date') return;
    if (f.kind === 'hidden') return;
    if (f.kind === 'date') { form.appendChild(dateField6(f)); return; }
    if (f.kind === 'image') { form.appendChild(imageField6(f)); return; }
    if (f.kind === 'toggle') { form.appendChild(el('label', { class: 'tog' }, [el('input', { type: 'checkbox', checked: !!S.d[f.k], onchange: function (e) { S.d[f.k] = e.target.checked; changed6(); } }), el('span', { text: f.label })])); return; }
    if (f.kind === 'choice') { form.appendChild(el('div', { class: 'fld' }, [el('label', { text: f.label }), segOf(f.options, S.d[f.k], function (v) { S.d[f.k] = v; changed6(); })])); return; }
    const id = 'f6_' + f.k, isPh = ph[f.k] && S.d[f.k] === ph[f.k], hid = !!S.hide['f_' + f.k];
    const inp = f.kind === 'area' ? el('textarea', { id: id, rows: String(Math.min(5, Math.max(2, String(f.def || '').split('\n').length))), dir: 'auto' }) : el('input', { id: id, type: 'text', autocomplete: 'off', dir: 'auto' });
    inp.value = isPh ? '' : (S.d[f.k] == null ? '' : S.d[f.k]);
    if (isPh) inp.placeholder = ph[f.k];
    const cnt = f.max ? el('span', { class: 'cnt tiny' }) : null;
    const upd = function () { if (cnt) { const n = inp.value.replace(/\*/g, '').length; cnt.textContent = n + '/' + f.max; cnt.classList.toggle('over', n > f.max); } };
    inp.addEventListener('input', function () { S.d[f.k] = inp.value === '' && ph[f.k] ? ph[f.k] : inp.value; upd(); changed6(true); });
    inp.addEventListener('focus', function () { const g = groupOfField(f.k); if (g && S.sel !== g) select(g); });
    upd();
    const eye = el('button', { type: 'button', class: 'ib sm eye' + (hid ? ' off' : ''), title: hid ? 'إظهار في التصميم' : 'إخفاء من التصميم', 'aria-label': hid ? 'إظهار' : 'إخفاء', onclick: function (e) {
      const h = !S.hide['f_' + f.k]; if (h) S.hide['f_' + f.k] = true; else delete S.hide['f_' + f.k];
      e.currentTarget.replaceChildren(ico(h ? 'eyeoff' : 'eye')); e.currentTarget.closest('.fld').classList.toggle('hid', h); changed6();
    } }, [ico(hid ? 'eyeoff' : 'eye')]);
    form.appendChild(el('div', { class: 'fld' + (hid ? ' hid' : '') }, [el('div', { class: 'lab' }, [el('label', { for: id, text: f.label }), el('span', { class: 'row' }, [cnt, emojiBtn(inp), eye])]), inp, f.hint ? el('small', { text: f.hint }) : null]));
  });
  b.appendChild(form);
  const hg = Object.keys(S.hide).filter(function (k) { return k.slice(0, 2) === 'g_' && S.hide[k]; });
  if (hg.length) b.appendChild(el('div', { class: 'psec' }, [el('h4', { text: 'عناصر أخفيتها' }), el('div', { class: 'row wrapr' }, hg.map(function (k) { return el('button', { type: 'button', class: 'btn sm line', text: 'إظهار ' + gName(k.slice(2)), onclick: function () { delete S.hide[k]; changed6(); buildPanel(); } }); }))]));
  b.appendChild(el('div', { class: 'psec' }, [el('button', { type: 'button', class: 'btn sm ghost', onclick: async function () {
    if (!(await ask('إرجاع القالب إلى أصله', 'تعود النصوص والألوان والمواضع والعناصر كما في القالب. ويمكنك التراجع بعدها.', 'إرجاع'))) return;
    const np = newPage(S.tpl, S.track, true); np.size = S.size; ED.doc.pages[ED.cur] = np; loadPage(ED.cur); select(null); buildPanel(); changed6();
  } }, [ico('reset'), 'إرجاع القالب إلى أصله'])]));
}
function groupOfField(k) {
  const v = plainOf(S.d[k]); if (!v) return null;
  let best = null;
  Object.keys(LASTT).forEach(function (g) { if ((LASTT[g] || []).some(function (l) { const p = plainOf(l); return p && (v.indexOf(p) >= 0 || p.indexOf(v) >= 0); })) best = best || g; });
  return best;
}
function dateField6(f) {
  const inp = el('input', { type: 'date', 'aria-label': 'اختر التاريخ' });
  const adj = el('select', { 'aria-label': 'تعديل اليوم الهجري' }, [['-1', 'الهجري −١'], ['0', 'الهجري كما هو'], ['1', 'الهجري +١']].map(function (o) { return el('option', { value: o[0], text: o[1], selected: String(S.hijriAdj || 0) === o[0] }); }));
  function fill() {
    if (!inp.value) return;
    const p = inp.value.split('-').map(Number), tk = dateTokens(new Date(p[0], p[1] - 1, p[2], 12), +adj.value);
    Object.keys(f.map).forEach(function (k) { S.d[k] = f.map[k].replace(/\{(\w+)\}/g, function (_, t) { return tk[t] || ''; }); });
    changed6(); buildPanel();
  }
  inp.addEventListener('change', fill); adj.addEventListener('change', function () { S.hijriAdj = +adj.value; fill(); });
  return el('div', { class: 'fld datebox6' }, [el('label', { text: 'املأ التاريخ تلقائياً' }), el('div', { class: 'row' }, [inp, adj]), el('small', { text: 'تُملأ خانات التاريخ بالهجري والميلادي؛ وعدّل الهجري بيوم إن خالف تقويمكم.' })]);
}
function imageField6(f) {
  const cur = S.d[f.k] && S.d[f.k].src;
  const grid = el('div', { class: 'imgrid' });
  if (f.optional) grid.appendChild(el('button', { type: 'button', class: 'imb none' + (!cur ? ' on' : ''), text: 'بلا', onclick: function () { S.d[f.k] = null; changed6(); buildPanel(); } }));
  DATE_LIB.forEach(function (n) { const b = el('button', { type: 'button', class: 'imb' + (cur === 'lib:' + n ? ' on' : ''), title: LIB_NAMES[n] || '', onclick: function () { S.d[f.k] = { src: 'lib:' + n, z: 1, ox: 0, oy: 0 }; changed6(); buildPanel(); } }); b.style.backgroundImage = 'url(' + ASSETS[n] + ')'; grid.appendChild(b); });
  V6.mine.filter(function (a) { return a.kind === 'image'; }).slice(0, 8).forEach(function (a) { const b = el('button', { type: 'button', class: 'imb' + (cur === 'asset:' + a.id ? ' on' : ''), title: a.name, onclick: function () { S.d[f.k] = { src: 'asset:' + a.id, z: 1, ox: 0, oy: 0 }; changed6(); buildPanel(); } }); if (a.thumb) b.style.backgroundImage = 'url(' + a.thumb + ')'; grid.appendChild(b); });
  grid.appendChild(uploadBtn('رفع', function (res) { S.d[f.k] = { src: 'asset:' + res.id, z: 1, ox: 0, oy: 0 }; changed6(); buildPanel(); }));
  const v = S.d[f.k];
  return el('div', { class: 'fld' }, [el('label', { text: f.label }), grid, v ? el('div', { class: 'range6' }, [el('span', { text: 'تكبير' }), el('input', { type: 'range', min: '0.6', max: '2.5', step: '0.01', value: String(v.z || 1), 'aria-label': 'تكبير الصورة', oninput: function (e) { v.z = +e.target.value; redraw(); }, onchange: function () { changed6(); } }),
    el('button', { type: 'button', class: 'btn sm ghost', text: 'توسيط', onclick: function () { v.ox = 0; v.oy = 0; v.z = 1; changed6(); buildPanel(); } })]) : null,
    v && v.src ? (function () { const d = el('details', { class: 'imgdet' }, [el('summary', {}, [ico('wand'), el('span', { text: 'تعديل الصورة: مرشحات وألوان وقلب' })])]); d.open = !!ED.imgdetOpen; d.addEventListener('toggle', function () { ED.imgdetOpen = d.open; }); imageTools(d, { o: v, field: f.k }); return d; })() : null]);
}
// رفع صورة: تُحفظ في مكتبتك على الخادم بجودتها الأصلية، مع مصغّر للعرض
function uploadBtn(label, done, accept) {
  const file = el('input', { type: 'file', accept: accept || 'image/png,image/jpeg,image/webp,image/svg+xml', hidden: true, onchange: async function (e) {
    const fl = e.target.files[0]; e.target.value = ''; if (!fl) return;
    if (fl.size > (V6.settings.maxUploadMb || 20) * 1048576) { toast('الملف أكبر من ' + (V6.settings.maxUploadMb || 20) + ' ميغابايت'); return; }
    b.disabled = true; b.replaceChildren(el('span', { class: 'spin' }));
    try {
      const thumb = await thumbFromFile(fl, 160);
      const res = await uploadAsset(fl, { kind: 'image', thumb: thumb });
      ASSET_IMG[res.id] = await loadImg(URL.createObjectURL(fl));
      toast('حُفظت الصورة في مكتبتك'); track('tool', { tool: 'upload' });
      done(res);
    } catch (err) { toast(err.message || 'تعذّر الرفع'); }
    b.disabled = false; b.replaceChildren(ico('upload'), el('span', { text: label }));
  } });
  const b = el('button', { type: 'button', class: 'imb up', onclick: function () { file.click(); } }, [ico('upload'), el('span', { text: label })]);
  return el('span', { class: 'upw' }, [b, file]);
}
function thumbFromFile(fl, max) {
  return new Promise(function (ok) {
    const u = URL.createObjectURL(fl), i = new Image();
    i.onload = function () { const sc = Math.min(1, max / Math.max(i.width, i.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(i.width * sc)); c.height = Math.max(1, Math.round(i.height * sc)); c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); ok(c.toDataURL('image/webp', 0.8)); };
    i.onerror = function () { ok(''); }; i.src = u;
  });
}

/* ---------- القوالب: بدّل القالب وتبقى نصوصك ---------- */
function pTpls(b) {
  b.appendChild(panelHead('القوالب', 'جرّب قالباً آخر، وتنتقل نصوصك إليه.'));
  const T = S.track, cur = S.tpl;
  const list = ED.doc.kind === 'deck' ? SLIDE_TPLS : visibleTpls().filter(function (t) { return t.type === cur.type; }).concat(visibleTpls().filter(function (t) { return t.type !== cur.type; }));
  const grid = el('div', { class: 'ptgrid' });
  list.forEach(function (tpl) {
    const szk = tpl.sizes.indexOf(S.size) >= 0 ? S.size : sizesFor(tpl)[0];
    const st = { d: Object.assign(defaults(tpl, T), carryD(tpl)), variant: tpl.variants[0].id, k: 1, ov: S.ov };
    grid.appendChild(el('button', { type: 'button', class: 'ptc' + (tpl.id === cur.id ? ' on' : ''), title: tpl.name, onclick: function () { switchTpl(tpl); } }, [tplThumb(tpl, T, szk, 140, st), el('small', { text: tpl.name })]));
  });
  b.appendChild(grid);
}
function carryD(tpl) { const o = {}; tpl.fields.forEach(function (f) { if (f.k && typeof S.d[f.k] === 'string' && S.d[f.k]) o[f.k] = S.d[f.k]; }); return o; }
function switchTpl(tpl) {
  commitPage();
  const old = ED.doc.pages[ED.cur], np = newPage(tpl, S.track, true);
  tpl.fields.forEach(function (f) { if (f.k && typeof old.d[f.k] === 'string' && old.d[f.k] && !(old.ph && old.ph[f.k] === old.d[f.k])) { np.d[f.k] = old.d[f.k]; delete np.ph[f.k]; } });
  np.size = tpl.sizes.indexOf(old.size) >= 0 ? old.size : np.size; np.layers = old.layers || [];
  ED.doc.pages[ED.cur] = np; loadPage(ED.cur);
  if (ED.doc.pages.length === 1 && (!ED.doc.name || ED.doc.name === old.tpl)) ED.doc.name = tpl.name;
  select(null); buildSizeSel(); buildPanel(); changed6(); refit();
  track('tool', { tool: 'switch_tpl', tpl: tpl.id });
}

/* ---------- النصوص ---------- */
function pText(b) {
  b.appendChild(panelHead('النصوص', 'أضف نصاً حراً، ثم حرّكه وغيّر خطه وحجمه ولونه.'));
  const C = S.track.c;
  [['عنوان كبير', { txt: 'عنوان كبير', sz: 0.1, b: 1, w: 0.82 }, 'display'], ['عنوان فرعي', { txt: 'عنوان فرعي', sz: 0.055, b: 0.6, w: 0.75 }, 'sub'], ['نص للفقرات', { txt: 'نص قصير يكتب هنا', sz: 0.036, b: 0, w: 0.7 }, 'body'], ['سطر صغير', { txt: 'سطر صغير', sz: 0.026, b: 0.4, w: 0.5, c: C.s }, 'small']].forEach(function (q) {
    b.appendChild(el('button', { type: 'button', class: 'addtxt ' + q[2], onclick: function () { addLayer6(Object.assign({ t: 'text', al: 'center', c: '' }, q[1])); } }, [q[0]]));
  });
  b.appendChild(el('h4', { class: 'psh', text: 'تنسيقات جاهزة' }));
  const combos = [
    [{ txt: 'لقاء *مفتوح*', sz: 0.09, b: 1, w: 0.8, c: C.pd, hc: C.a }, 'عنوان مع كلمة مميزة'],
    [{ txt: 'الخميس · ٨ مساءً', sz: 0.04, b: 0.6, w: 0.6, c: C.s }, 'سطر موعد'],
    [{ txt: '«عبارة قصيرة\nتلهم القارئ»', sz: 0.05, b: 0.4, w: 0.75, c: C.ink }, 'اقتباس']
  ];
  combos.forEach(function (q) { b.appendChild(el('button', { type: 'button', class: 'addtxt combo', onclick: function () { addLayer6(Object.assign({ t: 'text', al: 'center' }, q[0])); } }, [el('b', { text: q[0].txt.replace(/\*/g, '') }), el('small', { text: q[1] })])); });
}

/* ---------- العناصر: زخارف وأيقونات وأشكال وشعارات ---------- */
function libCanvas(fn, w, h) { const c = el('canvas', { width: (w || 80) * 2, height: (h || 80) * 2, style: 'width:' + (w || 80) + 'px;height:' + (h || 80) + 'px' }); const g = c.getContext('2d'); g.translate(c.width / 2, c.height / 2); fn(g, Math.min(c.width, c.height) * 0.72); return c; }
function pEls(b) {
  const T = S.track, C = T.c;
  b.appendChild(panelHead('العناصر', 'أضف ما تشاء، ثم غيّر لونه وحجمه من الشريط فوقه.'));
  const sec = function (t) { b.appendChild(el('h4', { class: 'psh', text: t })); const g = el('div', { class: 'libg' }); b.appendChild(g); return g; };
  const g1 = sec('زخارف من الهوية');
  Object.keys(STICKERS).forEach(function (k) { const col = /star|sparkle/.test(k) ? C.a : C.p; g1.appendChild(el('button', { type: 'button', class: 'libb', title: STICKERS[k].name, 'aria-label': STICKERS[k].name, onclick: function () { addLayer6({ t: 'sticker', ref: k, w: k === 'line' ? 0.4 : 0.18, c: col }); } }, [libCanvas(function (g, s) { STICKERS[k].draw(g, s, col); }, 56, 56)])); });
  ticonSection(b);   // الأيقونات كلها في قسم واحد: أيقونات الهوية ثم المجموعة الكاملة، ببحث وتمرير
  const g3 = sec('شعارات');
  const blockL = (V6.prog && V6.prog.block && V6.prog.block.logos) || [];
  Object.keys(TRACKS).forEach(function (id) { const t = TRACKS[id]; (t.logos || [[t.logo, t.name]]).forEach(function (l) { if (!ASSETS[l[0]] || blockL.indexOf(l[0]) >= 0) return; const bt = el('button', { type: 'button', class: 'libb wide', title: t.name, onclick: function () { addLayer6({ t: 'logo', ref: l[0], w: 0.22, c: 'color' }); } }); bt.style.backgroundImage = 'url(' + ASSETS[l[0]] + ')'; g3.appendChild(bt); }); });
  ['academy', 'social'].forEach(function (k) { if (!IMG[k]) return; g3.appendChild(el('button', { type: 'button', class: 'libb wide', title: k === 'social' ? 'حسابات التواصل' : 'شعار البرنامج', onclick: function () { addLayer6({ t: 'logo', ref: k, w: 0.16, c: '#4a4a4a' }); } }, [libCanvas(function (g, s) { const im = tinted(k, '#4a4a4a'); if (im) { const w = s * 1.5, h = w * srcH(im) / srcW(im); g.drawImage(im, -w / 2, -h / 2, w, h); } }, 110, 50)])); });
  // عناصرك المحفوظة: مجموعة طبقات تعيد استعمالها
  qrSection(b);
  const mine = V6.mine.filter(function (a) { return a.kind === 'element' && a.data && a.data.layers; });
  b.appendChild(el('h4', { class: 'psh', text: 'عناصري المحفوظة' }));
  if (!mine.length) b.appendChild(el('p', { class: 'tiny', text: 'احفظ ما أضفته من «الطبقات» ← «احفظه عنصراً»، فتجده هنا في كل تصاميمك.' }));
  const g4 = el('div', { class: 'libg' }); b.appendChild(g4);
  mine.forEach(function (a) { const bt = el('button', { type: 'button', class: 'libb', title: a.name, onclick: function () { a.data.layers.forEach(function (L) { const c = JSON.parse(JSON.stringify(L)); addLayer6(c); }); } }); if (a.thumb) bt.style.backgroundImage = 'url(' + a.thumb + ')'; else bt.textContent = a.name; g4.appendChild(bt); });
}
// شريط أفقي بصفوف ثابتة يُمرَّر بين صفحاته: تظليل عند الحافة التي وراءها المزيد، وسهمان للتنقل
function hPager(strip) {
  const wrap = el('div', { class: 'hpager' }, [strip]);
  const go = function (k) { strip.scrollBy({ left: -k * strip.clientWidth * 0.85, behavior: 'smooth' }); };   // RTL: التالي إلى اليسار
  const nx = el('button', { type: 'button', class: 'hpnx', 'aria-label': 'المزيد', title: 'المزيد', onclick: function () { go(1); } }, [ico('chev')]);
  const pv = el('button', { type: 'button', class: 'hppv', 'aria-label': 'السابق', title: 'السابق', onclick: function () { go(-1); } }, [ico('chev')]);
  wrap.append(pv, nx);
  const upd = function () { const max = strip.scrollWidth - strip.clientWidth, x = Math.abs(strip.scrollLeft); wrap.classList.toggle('more-l', max > 4 && x < max - 4); wrap.classList.toggle('more-r', x > 4); };
  strip.addEventListener('scroll', upd, { passive: true }); wrap._upd = upd; setTimeout(upd, 60); setTimeout(upd, 500);
  return wrap;
}

/* ---------- الخلفية: لون، ونقش، وصورة بتحكم كامل ---------- */
function pBg(b) {
  const T = S.track, tpl = S.tpl, mine = V6.mine.filter(function (a) { return a.kind === 'image'; });
  b.appendChild(panelHead('الخلفية', 'لون، أو نقش فوقه، أو صورة تتحكم في تكبيرها وموضعها وتعتيمها.'));
  b.appendChild(el('h4', { class: 'psh', text: 'اللون' }));
  const sw = el('div', { class: 'bgsw' });
  const roles = [['', 'تلقائي'], ['paper', 'الورق'], ['warm', 'دافئ'], ['white', 'أبيض'], ['p', 'الأساسي'], ['pd', 'الأساسي الداكن'], ['pl', 'الأساسي الفاتح'], ['s', 'الثانوي'], ['sd', 'الثانوي الداكن'], ['teal', 'الأخضر المزرق'], ['a', 'التمييز'], ['ink', 'الحبر']];
  roles.forEach(function (r) { const c = r[0] === '' ? '' : r[0] === 'white' ? '#ffffff' : T.c[r[0]]; if (r[0] && !c) return; sw.appendChild(el('button', { type: 'button', class: 'bgsw-b' + ((S.ov.bg || '') === c ? ' on' : ''), title: r[1], 'aria-label': r[1], style: c ? 'background:' + c : '', onclick: function () { if (c) S.ov.bg = c; else delete S.ov.bg; changed6(); buildPanel(); } }, [c ? null : ico('reset')])); });
  sw.appendChild(colorBtn(S.ov.bg || '', 'لون آخر', function (c) { if (c) S.ov.bg = c; else delete S.ov.bg; redraw(); }, { orig: true, origLabel: 'تلقائي' }));
  b.appendChild(sw);
  b.appendChild(el('h4', { class: 'psh', text: 'النقش' }));
  const cur = (S.bgfx && S.bgfx.p) || 'plain';
  const g3 = el('div', { class: 'libg patg' }); b.appendChild(g3);
  BG_PATTERNS.forEach(function (q) {
    if (q[0] === 'photo') return;
    const c = el('canvas', { width: 90, height: 112, style: 'width:56px;height:70px' }); const gx = c.getContext('2d'); const sv = BGFX; BGFX = { p: q[0] }; gx.scale(90 / 1080, 112 / 1350); paintBg(gx, 1080, 1350, S.ov.bg || T.c.pd); BGFX = sv;
    g3.appendChild(el('button', { type: 'button', class: 'libb' + (cur === q[0] ? ' on' : ''), title: q[1], onclick: function () { S.bgfx = q[0] === 'plain' ? null : { p: q[0] }; changed6(); buildPanel(); } }, [c, el('small', { class: 'tiny', text: q[1] })]));
  });
  b.appendChild(el('h4', { class: 'psh', text: 'صورة خلفية' }));
  b.appendChild(el('p', { class: 'tiny', text: 'من المكتبة أو صورك، وما تضيفه من الصور المجانية يظهر هنا أيضاً.' }));
  const isPhoto = S.bgfx && S.bgfx.p === 'photo';
  const g4 = el('div', { class: 'imgrid' }); b.appendChild(g4);
  const pick = function (src) { S.bgfx = Object.assign({ p: 'photo', dim: 0.45, tint: 0.25, z: 1, ox: 0, oy: 0, blur: 0 }, isPhoto ? S.bgfx : {}, { p: 'photo', src: src }); changed6(); buildPanel(); };
  DATE_LIB.concat(mine.map(function (a) { return 'asset:' + a.id; })).forEach(function (n) {
    const src = n.slice(0, 6) === 'asset:' ? n : 'lib:' + n, a = n.slice(0, 6) === 'asset:' ? V6.assets[n.slice(6)] : null;
    const bt = el('button', { type: 'button', class: 'imb' + (isPhoto && S.bgfx.src === src ? ' on' : ''), title: a ? a.name : (LIB_NAMES[n] || ''), onclick: function () { pick(src); } });
    bt.style.backgroundImage = 'url(' + (a ? a.thumb : ASSETS[n]) + ')'; g4.appendChild(bt);
  });
  g4.appendChild(uploadBtn('ارفع صورة', function (res) { pick('asset:' + res.id); }));
  b.appendChild(el('div', { class: 'row wrapr' }, [el('button', { type: 'button', class: 'chip', onclick: function () { openTab('imgs'); setTimeout(function () { const h = $('#free_imgs'); if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 150); } }, [ico('search'), ' ابحث في الصور المجانية'])]));
  if (isPhoto) {
    const F = S.bgfx;
    b.appendChild(el('h4', { class: 'psh', text: 'ضبط الصورة' }));
    b.appendChild(slider('التعتيم بلون الخلفية', F.dim == null ? 0.45 : F.dim, 0, 0.9, 0.05, function (v) { return Math.round(v * 100) + '٪'; }, function (v) { F.dim = v; }));
    b.appendChild(slider('صبغة الهوية', F.tint == null ? 0.25 : F.tint, 0, 0.6, 0.05, function (v) { return Math.round(v * 100) + '٪'; }, function (v) { F.tint = v; }));
    b.appendChild(slider('التكبير', F.z || 1, 1, 2.5, 0.05, function (v) { return Math.round(v * 100) + '٪'; }, function (v) { F.z = v; }));
    b.appendChild(slider('الموضع أفقياً', F.ox || 0, -1, 1, 0.05, function (v) { return v > 0 ? 'يسار' : v < 0 ? 'يمين' : 'وسط'; }, function (v) { F.ox = v; }));
    b.appendChild(slider('الموضع رأسياً', F.oy || 0, -1, 1, 0.05, function (v) { return v > 0 ? 'أسفل' : v < 0 ? 'أعلى' : 'وسط'; }, function (v) { F.oy = v; }));
    b.appendChild(slider('التمويه', F.blur || 0, 0, 24, 1, function (v) { return v ? v + 'px' : 'بلا'; }, function (v) { F.blur = v; }));
    b.appendChild(el('div', { class: 'row wrapr' }, [el('button', { type: 'button', class: 'btn sm line', onclick: function () { S.bgfx = null; changed6(); buildPanel(); } }, [ico('trash'), 'أزل الصورة']), el('button', { type: 'button', class: 'btn sm ghost', onclick: function () { Object.assign(F, { dim: 0.45, tint: 0.25, z: 1, ox: 0, oy: 0, blur: 0 }); changed6(); buildPanel(); } }, ['أعد الضبط'])]));
  }
  if (ED.doc.kind === 'deck') b.appendChild(el('button', { type: 'button', class: 'btn sm line', style: 'margin-top:8px', text: 'طبّق هذه الخلفية على كل الشرائح', onclick: function () { commitPage(); const src = ED.doc.pages[ED.cur]; ED.doc.pages.forEach(function (p) { p.ov = Object.assign({}, p.ov, { bg: src.ov.bg }); if (!src.ov.bg) delete p.ov.bg; p.bgfx = src.bgfx ? JSON.parse(JSON.stringify(src.bgfx)) : null; }); loadPage(ED.cur); buildPages(); markDirty(); toast('طُبّقت'); } }));
}

/* ---------- الصور ---------- */
function pImgs(b) {
  const deck = ED.doc.kind === 'deck';
  b.appendChild(panelHead(deck ? 'الوسائط' : 'الصور', deck ? 'صور وفيديو وصوت ويوتيوب لشرائحك، بجودتها الأصلية.' : 'صورك وصور المكتبة والصور المجانية، بجودتها الأصلية.'));
  b.appendChild(el('div', { class: 'imgrid big' }, [uploadBtn('ارفع صورة', function (res) { addLayer6({ t: 'img', ref: 'asset:' + res.id, w: 0.55 }); buildPanel(); })]));
  if (deck && typeof mediaPanelSection === 'function') mediaPanelSection(b);   // الفيديو والصوت ويوتيوب هنا وحدها
  b.appendChild(el('h4', { class: 'psh', text: 'صوري' }));
  const g = el('div', { class: 'imgrid' }); b.appendChild(g);
  const mine = V6.mine.filter(function (a) { return a.kind === 'image'; });
  if (!mine.length) g.appendChild(el('p', { class: 'tiny', text: 'لم ترفع صوراً بعد.' }));
  mine.forEach(function (a) {
    const bt = el('button', { type: 'button', class: 'imb', title: a.name, onclick: function () { addLayer6({ t: 'img', ref: 'asset:' + a.id, w: 0.55 }); }, oncontextmenu: function (e) { e.preventDefault(); popMenu(bt, [{ t: 'حذف من مكتبتي', ic: 'trash', fn: async function () { try { await API6.me('asset_del', a.id); V6.mine = V6.mine.filter(function (x) { return x.id !== a.id; }); buildPanel(); } catch (er) { toast(er.message); } } }]); } });
    if (a.thumb) bt.style.backgroundImage = 'url(' + a.thumb + ')';
    g.appendChild(bt);
  });
  freeImagesSection(b);
  b.appendChild(el('h4', { class: 'psh', text: 'مكتبة البرنامج' }));
  const g2 = el('div', { class: 'imgrid' }); b.appendChild(g2);
  DATE_LIB.forEach(function (n) { const bt = el('button', { type: 'button', class: 'imb', title: LIB_NAMES[n] || '', onclick: function () { addLayer6({ t: 'img', ref: 'lib:' + n, w: 0.55 }); } }); bt.style.backgroundImage = 'url(' + ASSETS[n] + ')'; g2.appendChild(bt); });
}

/* ---------- الألوان ---------- */
function pColors(b) {
  const tpl = S.tpl, T = S.track;
  b.appendChild(panelHead('الألوان', 'مجموعات من ألوان الهوية، أو اختر لوناً بنفسك.'));
  b.appendChild(el('h4', { class: 'psh', text: 'كما صمّمها المصمم' }));
  b.appendChild(el('div', { class: 'pals6' }, tpl.variants.map(function (v) {
    const on = v.id === S.variant && !Object.keys(S.ov).some(function (k) { return S.ov[k]; });
    return el('button', { type: 'button', class: 'pal6' + (on ? ' on' : ''), onclick: function () { S.variant = v.id; S.ov = {}; changed6(); buildPanel(); } }, [el('span', { class: 'dots' }, swOf(v.sw, T).map(function (c) { return el('i', { style: 'background:' + c }); })), el('span', { text: v.name })]);
  })));
  b.appendChild(el('h4', { class: 'psh', text: 'تراكيب أخرى من الهوية' }));
  const gen = el('div', { class: 'gens6' }), cur = snap();
  genPalettes(tpl, T).slice(0, 12).forEach(function (pl) {
    const on = S.ov.bg === pl.bg && S.ov.title === pl.title && S.ov.accent === pl.accent;
    const sz = SIZES[S.size], sc = 76 / sz.w, cv = el('canvas', { width: Math.round(sz.w * sc * 2), height: Math.round(sz.h * sc * 2), style: 'width:76px' });
    gen.appendChild(el('button', { type: 'button', class: 'gen6' + (on ? ' on' : ''), onclick: function () { S.ov = { bg: pl.bg, title: pl.title, accent: pl.accent }; changed6(); buildPanel(); } }, [cv]));
    lazyThumb(cv, function () { renderTo(cv, tpl, S.size, Object.assign({}, cur, { ov: pl, layers: [] }), T, sc * 2); });
  });
  b.appendChild(gen);
  b.appendChild(el('h4', { class: 'psh', text: 'لون بلون' }));
  const labels = Object.assign({ bg: 'الخلفية', title: 'العنوان', accent: 'لون التمييز' }, tpl.colorLabels || {});
  ['bg', 'title', 'accent'].forEach(function (key) {
    b.appendChild(el('div', { class: 'crow6' }, [el('span', { text: labels[key] }), colorBtn(S.ov[key] || '', labels[key], function (c) { if (c) S.ov[key] = c; else delete S.ov[key]; redraw(); }, { orig: true, origLabel: 'تلقائي' })]));
  });
  if (hasLogoOpts()) logoOptions(b);
  if (ED.doc.kind === 'deck') b.appendChild(el('button', { type: 'button', class: 'btn sm line', text: 'طبّق هذه الألوان على كل الشرائح', onclick: function () { commitPage(); const src = ED.doc.pages[ED.cur]; ED.doc.pages.forEach(function (p) { p.variant = src.variant; p.ov = Object.assign({}, src.ov); }); buildPages(); markDirty(); toast('طُبّقت'); } }));
}

/* ---------- الخطوط ---------- */
/* ---------- الخطوط: لكل نوع نص في التصميم قائمة تُفتح، والمرور على الخط يعاينه في التصميم مباشرة ---------- */
// الخطوط المتاحة للاختيار: خطوط هوية البرنامج أولاً، ثم العامة، ثم خطوط المستخدم. والمحجوبة في البرنامج لا تظهر
function fontChoices() {
  const P = V6.prog || {}, block = (P.block && P.block.fonts) || [], idf = (P.fontsId || []).slice();
  if (P.fonts) [P.fonts.title, P.fonts.body].forEach(function (f) { if (f && idf.indexOf(f) < 0) idf.push(f); });
  const out = { ident: [], general: [], mine: [] };
  Object.keys(FONTS).forEach(function (id) {
    if (block.indexOf(id) >= 0 || id === 'tajarib' && !FONT_REG.tajarib) return;
    const r = FONT_REG[id] || {};
    if (r.scope === 'user') out.mine.push(id);
    else if (idf.indexOf(id) >= 0) out.ident.push(id);
    else out.general.push(id);
  });
  const by = function (a, b) { return String(FONTS[a].name).localeCompare(FONTS[b].name, 'ar'); };
  out.ident.sort(function (a, b) { return idf.indexOf(a) - idf.indexOf(b); }); out.general.sort(by); out.mine.sort(by);
  return out;
}
// أهداف الخط في التصميم الحالي: العناوين كلها، والنصوص كلها، ثم كل عنصر نصي
function fontTargets() {
  const t = [
    { id: 'all_title', label: 'كل العناوين', sample: 'لقاء مفتوح', get: function () { return FS.title; }, set: function (v) { FS.title = v; FS.tw = ''; S.fs = { title: FS.title, body: FS.body, tw: '' }; }, base: true },
    { id: 'all_body', label: 'كل النصوص', sample: 'الخميس ٨ مساءً', get: function () { return FS.body; }, set: function (v) { FS.body = v; S.fs = { title: FS.title, body: FS.body, tw: FS.tw || '' }; }, base: true }
  ];
  Object.keys(LASTG).filter(function (g) { return !isLayer(g) && LASTT[g] && LASTT[g].length; }).forEach(function (g) {
    const smp = String(LASTT[g][0] || '').replace(/\*/g, '').split('\n')[0].trim() || gName(g);
    t.push({ id: g, label: gName(g), sample: smp, get: function () { return ((S.gs || {})[g] || {}).f || ''; }, set: function (v) { setGs(g, 'f', v); }, g: g });
  });
  (S.layers || []).filter(function (L) { return L.t === 'text'; }).forEach(function (L) {
    t.push({ id: 'L:' + L.id, label: gName('L:' + L.id), sample: String(L.txt || 'نص').split('\n')[0], get: function () { return L.f || ''; }, set: function (v) { L.f = v || undefined; }, g: 'L:' + L.id });
  });
  return t;
}
let FONT_IO = null;
function fontSample(node, id, weightKey) {
  if (!FONT_IO) FONT_IO = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) return; FONT_IO.unobserve(e.target); const f = e.target._f; if (f) f(); }); }, { rootMargin: '120px' });
  node._f = function () { ensureFonts([id]).then(function () { const F = FONTS[id]; if (!F) return; const w = (F.w[weightKey] || F.w.r).split('|'); node.style.fontFamily = '"' + w[0] + '", sans-serif'; node.style.fontWeight = w[1] || 400; node.classList.add('ready'); }); };
  FONT_IO.observe(node);
}
function pFonts(b) {
  b.appendChild(panelHead('الخطوط', 'اختر النص ثم خطه، ومرّر الفأرة على الخط لتراه في التصميم قبل اختياره.'));
  const C = fontChoices(), list = el('div', { class: 'ftargets' }); b.appendChild(list);
  fontTargets().forEach(function (t) {
    const open = ED.fontOpen === t.id;
    const cur = t.get(), curName = cur && FONTS[cur] ? FONTS[cur].name : (t.base ? 'تجارب' : 'خط القالب');
    const head = el('button', { type: 'button', class: 'fth', 'aria-expanded': open ? 'true' : 'false', onclick: function () { ED.fontOpen = open ? null : t.id; if (t.g && !open) select(t.g); buildPanel(); } }, [
      el('span', { class: 'ftl' }, [el('b', { text: t.label }), el('small', { text: curName })]), ico(open ? 'up' : 'down')]);
    const row = el('div', { class: 'ftrow' + (open ? ' open' : '') + (t.base ? ' base' : '') }, [head]);
    if (open) {
      const committed = cur;
      let previewing = false;
      const apply = function (v, commit) {
        t.set(v); previewing = !commit;
        if (commit) { changed6(); if (t.base) savePrefs6({ fonts: { title: FS.title, body: FS.body } }); ED.fontOpen = null; buildPanel(); }
        else redraw();
      };
      const box = el('div', { class: 'flist6', onmouseleave: function () { if (previewing) { t.set(committed); previewing = false; redraw(); } } });
      const item = function (id) {
        const F = FONTS[id], on = (cur || '') === id;
        const smp = el('span', { class: 'fsmp6', text: t.sample.slice(0, 26) });
        const bt = el('button', { type: 'button', class: 'fitem' + (on ? ' on' : ''), onmouseenter: function () { ensureFonts([id]).then(function () { if (ED.fontOpen === t.id) apply(id, false); }); }, onclick: async function () { bt.classList.add('loading'); await ensureFonts([id]); apply(id, true); } }, [smp, el('small', { text: F.name })]);
        fontSample(smp, id, t.id === 'all_body' ? 'r' : 'b');
        return bt;
      };
      if (!t.base) box.appendChild(el('button', { type: 'button', class: 'fitem tplf' + (!cur ? ' on' : ''), onmouseenter: function () { apply('', false); }, onclick: function () { apply('', true); } }, [el('span', { class: 'fsmp6', text: 'خط القالب' }), el('small', { text: 'كما صمّمه القالب' })]));
      [['ident', 'خطوط هوية ' + (V6.prog ? V6.prog.name : 'البرنامج')], ['general', 'خطوط أخرى'], ['mine', 'خطوطي']].forEach(function (sec) {
        if (!C[sec[0]].length) return;
        box.appendChild(el('div', { class: 'fsec' }, [sec[1]]));
        C[sec[0]].forEach(function (id) { box.appendChild(item(id)); });
      });
      row.appendChild(box);
    }
    list.appendChild(row);
  });
  if (can('fonts')) {
    b.appendChild(el('h4', { class: 'psh', text: 'خطك الخاص' }));
    b.appendChild(el('p', { class: 'tiny', text: 'ارفع ملف الخط فيظهر لك في كل تصاميمك، وكل وزن في ملف.' }));
    b.appendChild(fontUploader('user', ''));
  }
}
function fontUploader(scope, program, onDone, ui) {
  const file = el('input', { type: 'file', accept: '.otf,.ttf,.woff,.woff2', multiple: true, hidden: true, onchange: async function (e) {
    const files = Array.from(e.target.files); e.target.value = ''; if (!files.length) return;
    st.textContent = 'جارٍ الرفع (' + files.length + ')…';
    const sc = typeof scope === 'function' ? scope() : scope, pr = typeof program === 'function' ? program() : program;
    let ok = 0;
    for (const fl of files) {
      const fam = familyOf(fl.name), w = weightOf(fl.name);
      try {
        const res = await uploadAsset(fl, { kind: 'font', family: fam.family, label: fam.label, weight: w, scope: sc, program: pr, ui: !!ui, mime: fl.type || (/\.otf$/i.test(fl.name) ? 'font/otf' : /\.woff2$/i.test(fl.name) ? 'font/woff2' : 'font/ttf') });
        const r = FONT_REG[res.family] = FONT_REG[res.family] || { family: res.family, label: res.label, scope: res.scope, program: res.program, files: [] };
        r.files.push(res); ok++;
      } catch (err) { toast(fl.name + ': ' + err.message); }
    }
    registerFonts(); st.textContent = 'رُفع ' + ok + ' من ' + files.length;
    if (onDone) onDone(); else buildPanel();
  } });
  const st = el('span', { class: 'tiny' });
  return el('div', { class: 'row' }, [el('button', { type: 'button', class: 'btn sm line', onclick: function () { file.click(); } }, [ico('upload'), 'ارفع خطاً']), st, file]);
}

/* ---------- الطبقات: كل العناصر بترتيبها من الأعلى، تُسمّى وتُرتَّب وتُخفى، والقلم يفتح إعداداتها ---------- */
// الترتيب من الأسفل للأعلى: عناصر القالب بترتيب رسمها، ثم ما نُقل منها إلى الأمام، ثم ما أضافه المستخدم
// الترتيب من الأسفل إلى الأعلى: عناصر القالب بترتيبها الأصلي، ثم ما نُقل منها أو من الطبقات (S.front بترتيبه)، ثم بقية الطبقات المضافة
function stackOrder() {
  const lids = (S.layers || []).map(function (L) { return 'L:' + L.id; });
  const front = (S.front || []).filter(function (g) { return isLayer(g) ? lids.indexOf(g) >= 0 : (LASTG[g] || S.hide['g_' + g]); });
  const base = Object.keys(LASTG).filter(function (g) { return !isLayer(g) && front.indexOf(g) < 0; });
  Object.keys(S.hide).forEach(function (k) { if (k.slice(0, 2) === 'g_' && S.hide[k] && base.indexOf(k.slice(2)) < 0 && front.indexOf(k.slice(2)) < 0) base.push(k.slice(2)); });
  const tail = lids.filter(function (g) { return front.indexOf(g) < 0; });
  return { base: base, front: front, layers: lids, tail: tail, all: base.concat(front, tail) };
}
// تحريك عنصر خطوة في الترتيب: كل العناصر (من القالب أو مضافة) تتبادل أماكنها بحرية
function moveInStack(g, dir) {   // dir: +1 للأعلى، -1 للأسفل
  const o = stackOrder(), arr = o.all.slice(), i = arr.indexOf(g), j = i + dir;
  if (i < 0) return;
  if (j < 0) { toast('هذا أسفل العناصر'); return; }
  if (j >= arr.length) { toast('هذا أعلى العناصر'); return; }
  arr[i] = arr[j]; arr[j] = g;
  // ما بقي على ترتيب القالب الأصلي في الأسفل لا يُسجَّل؛ وما بعده يصير «الترتيب المخصّص»
  const natural = Object.keys(LASTG).filter(function (x) { return !isLayer(x); });
  let k = 0; while (k < arr.length && !isLayer(arr[k]) && arr[k] === natural[k]) k++;
  const rest = arr.slice(k);
  let last = -1; rest.forEach(function (x, n) { if (!isLayer(x)) last = n; });
  S.front = rest.slice(0, last + 1);
  const order = arr.filter(isLayer);
  S.layers = (S.layers || []).slice().sort(function (a, b) { return order.indexOf('L:' + a.id) - order.indexOf('L:' + b.id); });
  changed6(); buildPanel();
}
function renameEl(g, name) { S.names = Object.assign({}, S.names || {}); const v = String(name || '').trim(); if (v) S.names[g] = v.slice(0, 40); else delete S.names[g]; changed6(true); }
function nameEditor(g, onDone) {
  const i = el('input', { type: 'text', class: 'lren', value: gName(g), 'aria-label': 'اسم العنصر', onkeydown: function (e) { if (e.key === 'Enter') i.blur(); if (e.key === 'Escape') { i.value = gName(g); i.blur(); } }, onblur: function () { renameEl(g, i.value === gName(g) ? (S.names || {})[g] || '' : i.value); if (onDone) onDone(); } });
  setTimeout(function () { i.focus(); i.select(); }, 0);
  return i;
}
function icoOf(g) { if (!isLayer(g)) return LASTT[g] && LASTT[g].length ? 'text' : 'layers'; const L = layerById(g.slice(2)); return !L ? 'layers' : L.t === 'text' ? 'text' : L.t === 'img' ? 'image' : L.t === 'logo' ? 'star' : 'shapes'; }
function pLayers(b) {
  b.appendChild(panelHead('الطبقات', 'العناصر من الأعلى إلى الأسفل. انقر الاسم مرتين لتغييره، والقلم لإعداداته.'));
  const o = stackOrder(), list = el('div', { class: 'llist6' });
  o.all.slice().reverse().forEach(function (g) {
    const hidden = !isLayer(g) && S.hide['g_' + g];
    const nm = el('span', { class: 'lnm', text: gName(g) });
    // نقرة تحدد العنصر، ونقرتان متتاليتان تفتحان تغيير الاسم (اللوحة تُبنى من جديد بعد التحديد، فنعدّ النقرات بأنفسنا)
    const nameBtn = ED.renaming === g ? el('div', { class: 'lname' }, [ico(icoOf(g)), nameEditor(g, function () { ED.renaming = null; buildPanel(); })]) :
      el('button', { type: 'button', class: 'lname', title: 'انقر للتحديد، ومرتين لتغيير الاسم', onclick: function () {
        const now = Date.now();
        if (ED.lnc && ED.lnc.g === g && now - ED.lnc.t < 500) { ED.lnc = null; ED.renaming = g; buildPanel(); return; }
        ED.lnc = { g: g, t: now }; if (!hidden && S.sel !== g) select(g);
      } }, [ico(icoOf(g)), nm, o.front.indexOf(g) >= 0 ? el('span', { class: 'pill sm', text: 'للأمام' }) : null]);
    list.appendChild(el('div', { class: 'lrow6' + (S.sel === g ? ' on' : '') + (hidden ? ' hid' : '') }, [
      nameBtn,
      el('button', { type: 'button', class: 'ib sm', title: 'للأعلى', 'aria-label': 'للأعلى', onclick: function () { moveInStack(g, 1); } }, [ico('up')]),
      el('button', { type: 'button', class: 'ib sm', title: 'للأسفل', 'aria-label': 'للأسفل', onclick: function () { moveInStack(g, -1); } }, [ico('down')]),
      isLayer(g) ? null : el('button', { type: 'button', class: 'ib sm', title: hidden ? 'إظهار' : 'إخفاء', 'aria-label': hidden ? 'إظهار' : 'إخفاء', onclick: function () { if (hidden) delete S.hide['g_' + g]; else { S.hide['g_' + g] = true; if (S.sel === g) select(null); } changed6(); buildPanel(); } }, [ico(hidden ? 'eye' : 'eyeoff')]),
      el('button', { type: 'button', class: 'ib sm', title: 'إعدادات العنصر', 'aria-label': 'إعدادات العنصر', disabled: hidden, onclick: function () { openElPanel(g); } }, [ico('pencil')])
    ]));
  });
  b.appendChild(list);
  if (S.layers && S.layers.length > 1) b.appendChild(el('button', { type: 'button', class: 'btn sm line', text: 'احفظ كل ما أضفته عنصراً واحداً', onclick: function () { saveElement(S.layers); } }));
  b.appendChild(el('div', { class: 'psec' }, [el('button', { type: 'button', class: 'btn sm ghost', onclick: function () { if (S.pos) delete S.pos[S.size]; S.gs = {}; S.front = []; select(null); changed6(); buildPanel(); } }, [ico('reset'), 'أرجع المواضع والأحجام والترتيب'])]));
}

/* ---------- إعدادات عنصر واحد (يفتحها القلم) ---------- */
/* ---------- شعار الهوية ودفعتها في هذا التصميم: نسخة الشعار ولونه ورقم الدفعة ---------- */
function hasLogoOpts(T) { T = T || S.track; return !!(T && T.logo && ((T.logos && T.logos.length > 1) || T.lgo)); }
function setLg(k, v) { S.lg = Object.assign({}, S.lg || {}); if (v === undefined) delete S.lg[k]; else S.lg[k] = v; if (!Object.keys(S.lg).length) S.lg = null; }
function logoOptions(b) {
  const T = S.track; if (!T || !T.logo) return;
  const o = lgoOf(T, S.lg), box = el('div', { class: 'lgopts' });
  box.appendChild(el('h4', { class: 'psh', text: 'شعار ' + (T.name || 'الهوية') + ' في هذا التصميم' }));
  // نسخ الشعار (الأشكال)
  const vers = (T.logos && T.logos.length ? T.logos : [[T.logo, 'الأساسي']]).filter(function (l) { return IMG[l[0]]; });
  if (vers.length > 1) {
    const cur = o.v || T.logo;
    box.appendChild(el('span', { class: 'tiny', text: 'شكل الشعار' }));
    box.appendChild(el('div', { class: 'lgvers' }, vers.map(function (l) {
      const bt = el('button', { type: 'button', class: 'lgver' + (l[0] === cur ? ' on' : ''), title: l[1], 'aria-label': l[1], 'aria-pressed': l[0] === cur ? 'true' : 'false', onclick: function () { setLg('v', l[0] === T.logo ? undefined : l[0]); changed6(); buildPanel(); } }, [el('img', { src: ASSETS[l[0]], alt: '' }), el('span', { text: l[1] })]);
      return bt;
    })));
  }
  box.appendChild(el('div', { class: 'crow6' }, [el('span', { text: 'لون الشعار' }), colorBtn(o.col || '', 'لون الشعار', function (c) { setLg('col', c || ''); redraw(); changed6(); }, { orig: true, origLabel: 'الأصلي' })]));
  // الدفعة
  const num = el('input', { type: 'text', class: 'inp sm lgnum', value: o.n || '', placeholder: 'مثل: ٤', 'aria-label': 'رقم الدفعة', maxlength: '12', oninput: function (e) { setLg('n', e.target.value.trim()); if (e.target.value.trim()) { setLg('show', true); showT.checked = true; } redraw(); clearTimeout(ED.lgT); ED.lgT = setTimeout(function () { changed6(true); }, 500); } });
  const showT = el('input', { type: 'checkbox', checked: !!(o.show && o.n), onchange: function (e) { setLg('show', e.target.checked); changed6(); } });
  box.appendChild(el('label', { class: 'tog' }, [showT, el('span', { text: 'رقم الدفعة على الشعار' })]));
  box.appendChild(el('div', { class: 'row wrapr lgbatch' }, [num, el('span', { class: 'tiny', text: 'لونه' }), colorBtn(o.ncol || '', 'لون رقم الدفعة', function (c) { setLg('ncol', c || ''); redraw(); changed6(); }, { orig: true, origLabel: 'تلقائي' })]));
  box.appendChild(slider('حجم الرقم', o.s, 0.1, 0.8, 0.01, function (v) { return Math.round(v * 100) + '٪'; }, function (v) { setLg('s', v); }));
  box.appendChild(el('div', { class: 'row wrapr' }, [
    slider('موضعه أفقياً', o.x, -0.2, 1.2, 0.01, function (v) { return Math.round(v * 100) + '٪'; }, function (v) { setLg('x', v); }),
    slider('موضعه رأسياً', o.y, -0.2, 1.2, 0.01, function (v) { return Math.round(v * 100) + '٪'; }, function (v) { setLg('y', v); })]));
  if (S.lg) box.appendChild(el('button', { type: 'button', class: 'btn sm ghost', onclick: function () { S.lg = null; changed6(); buildPanel(); } }, [ico('reset'), 'كما ضبطها المشرف']));
  if (ED.doc.kind === 'deck') box.appendChild(el('button', { type: 'button', class: 'btn sm line', text: 'طبّق على كل الشرائح', onclick: function () { commitPage(); const lg = ED.doc.pages[ED.cur].lg; ED.doc.pages.forEach(function (p) { p.lg = lg ? Object.assign({}, lg) : null; }); markDirty(); toast('طُبّق'); } }));
  b.appendChild(box);
}

/* ---------- أدوات الصورة: مرشحات جاهزة، وضبط دقيق، وقلب، وقصّ بأشكال، وإطار وظل ولون وتلاشي ----------
   tgt.o هو الكائن الذي يحمل الإعدادات: الطبقة المضافة (L) أو قيمة خانة الصورة في القالب ({src, z, ox, oy}) */
const FX_PRESETS = [['orig', 'الأصل', {}], ['warm', 'دافئ', { br: 1.04, ct: 1.05, sa: 1.1, wm: 0.4 }], ['cool', 'بارد', { br: 1.02, ct: 1.05, sa: 0.95, wm: -0.4 }], ['vivid', 'حيوي', { ct: 1.15, sa: 1.4 }],
  ['soft', 'ناعم', { br: 1.08, ct: 0.86, sa: 0.8 }], ['bw', 'أبيض وأسود', { gs: 1, ct: 1.15 }], ['old', 'عتيق', { sp: 0.6, ct: 0.95, vg: 0.45 }], ['drama', 'درامي', { ct: 1.3, sa: 0.85, br: 0.94, vg: 0.6 }], ['fade', 'باهت', { br: 1.12, ct: 0.78, sa: 0.65 }]];
function imgSrcOf(o) { const p = photoOf({ src: o.src || o.ref, z: 1, ox: 0, oy: 0 }); return p && p.im; }
function imageTools(b, tgt) {
  const o = tgt.o, isL = !!tgt.layer, box = el('div', { class: 'imgtools' });
  const set = function (k, v, live) { if (v === undefined || v === null || v === '') delete o[k]; else o[k] = v; if (live) redraw(); else changed6(); };
  const setFx = function (k, v) { o.fx = Object.assign({}, o.fx || {}); if (v == null) delete o.fx[k]; else o.fx[k] = v; if (!Object.keys(o.fx).length) delete o.fx; };
  box.appendChild(el('h4', { class: 'psh', text: 'تعديل الصورة' }));
  // المرشحات الجاهزة بمعاينة مصغّرة من الصورة نفسها
  const src = imgSrcOf(o);
  if (src) {
    const small = document.createElement('canvas'), k = 120 / Math.max(srcW(src), srcH(src)); small.width = Math.max(1, Math.round(srcW(src) * k)); small.height = Math.max(1, Math.round(srcH(src) * k)); small.getContext('2d').drawImage(src, 0, 0, small.width, small.height);
    const cur = JSON.stringify(o.fx || {});
    box.appendChild(el('div', { class: 'fxrow' }, FX_PRESETS.map(function (pr) {
      const cv = el('canvas', { width: 64, height: 64 }), g = cv.getContext('2d'), im = imgFx(small, pr[2]), q = Math.max(64 / srcW(im), 64 / srcH(im));
      g.drawImage(im, (64 - srcW(im) * q) / 2, (64 - srcH(im) * q) / 2, srcW(im) * q, srcH(im) * q);
      return el('button', { type: 'button', class: 'fxb' + (JSON.stringify(pr[2]) === cur ? ' on' : ''), onclick: function () { if (Object.keys(pr[2]).length) o.fx = Object.assign({}, pr[2]); else delete o.fx; changed6(); buildPanel(); } }, [cv, el('span', { text: pr[1] })]);
    })));
  }
  const fx = o.fx || {}, pct = function (v) { return Math.round(v * 100) + '٪'; }, sgn = function (v) { return (v > 0 ? '+' : '') + Math.round(v * 100); };
  const fs = function (label, key, def, min, max, step, fmt) { return slider(label, fx[key] == null ? def : fx[key], min, max, step, fmt, function (v) { setFx(key, Math.abs(v - def) < step / 2 ? null : v); }); };
  box.appendChild(fs('السطوع', 'br', 1, 0.5, 1.5, 0.01, pct));
  box.appendChild(fs('التباين', 'ct', 1, 0.5, 1.6, 0.01, pct));
  box.appendChild(fs('التشبّع', 'sa', 1, 0, 2, 0.01, pct));
  box.appendChild(fs('الدفء', 'wm', 0, -1, 1, 0.02, sgn));
  box.appendChild(fs('الضبابية', 'bl', 0, 0, 20, 0.5, function (v) { return String(Math.round(v)); }));
  box.appendChild(fs('تعتيم الأطراف', 'vg', 0, 0, 1, 0.02, pct));
  box.appendChild(el('div', { class: 'row wrapr' }, [
    el('button', { type: 'button', class: 'btn sm line' + (o.fh ? ' on' : ''), onclick: function () { set('fh', o.fh ? null : true); buildPanel(); } }, [ico('copy'), 'قلب أفقي']),
    el('button', { type: 'button', class: 'btn sm line' + (o.fv ? ' on' : ''), onclick: function () { set('fv', o.fv ? null : true); buildPanel(); } }, [ico('copy'), 'قلب رأسي']),
    el('button', { type: 'button', class: 'btn sm ghost', onclick: function () { ['fx', 'fh', 'fv'].forEach(function (k) { delete o[k]; }); if (isL) ['cr', 'mk', 'z', 'ox', 'oy', 'bw', 'bc', 'sh', 'tc', 'ta', 'fe'].forEach(function (k) { delete o[k]; }); changed6(); buildPanel(); } }, [ico('reset'), 'إلغاء التعديلات'])]));
  if (isL) {
    box.appendChild(el('h4', { class: 'psh', text: 'القصّ والشكل' }));
    const ar0 = src ? srcH(src) / srcW(src) : 1;
    box.appendChild(segMini([['', 'الأصل'], ['1', '١:١'], ['1.25', '٤:٥'], ['0.5625', '١٦:٩'], ['1.3333', '٣:٤'], ['1.7778', '٩:١٦']], o.cr ? String(+o.cr.toFixed(4)).replace(/0+$/, '') : '', function (v) { set('cr', v ? +v : null); buildPanel(); }));
    box.appendChild(el('div', { class: 'mkrow' }, [['rect', 'مستطيل'], ['circle', 'دائرة'], ['arch', 'قوس'], ['hex', 'سداسي'], ['diamond', 'معيّن']].map(function (q) {
      const cv = el('canvas', { width: 40, height: 40 }), g = cv.getContext('2d'); g.fillStyle = (o.mk || 'rect') === q[0] ? '#fff' : '#555'; maskPath(g, q[0], 6, 6, 28, 28, 0.15); g.fill();
      return el('button', { type: 'button', class: 'mkb' + ((o.mk || 'rect') === q[0] ? ' on' : ''), title: q[1], 'aria-label': q[1], onclick: function () { set('mk', q[0] === 'rect' ? null : q[0]); if ((q[0] === 'circle' || q[0] === 'hex') && !o.cr) o.cr = 1; changed6(); buildPanel(); } }, [cv, el('span', { text: q[1] })]);
    })));
    if ((o.mk || 'rect') === 'rect') box.appendChild(slider('استدارة الحواف', o.r || 0, 0, 0.5, 0.02, function (v) { return Math.round(v * 200) + '٪'; }, function (v) { o.r = v || 0; }));
    const cropped = (o.cr && Math.abs(o.cr - ar0) > 0.01) || (o.z || 1) > 1.001;
    box.appendChild(slider('تكبير داخل الإطار', o.z || 1, 1, 3, 0.01, pct, function (v) { o.z = v; }));
    if (cropped || o.ox || o.oy) {
      box.appendChild(slider('تحريك أفقي', o.ox || 0, -1, 1, 0.01, sgn, function (v) { o.ox = v; }));
      box.appendChild(slider('تحريك رأسي', o.oy || 0, -1, 1, 0.01, sgn, function (v) { o.oy = v; }));
    }
    box.appendChild(el('h4', { class: 'psh', text: 'الإطار والظل واللون' }));
    box.appendChild(slider('سُمك الإطار', o.bw || 0, 0, 0.08, 0.002, function (v) { return Math.round(v * 1000) / 10 + '٪'; }, function (v) { o.bw = v || 0; }));
    if (o.bw) box.appendChild(el('div', { class: 'crow6' }, [el('span', { text: 'لون الإطار' }), colorBtn(o.bc && o.bc !== 'p' ? o.bc : '', 'لون الإطار', function (c) { set('bc', c || null); }, { orig: true, origLabel: 'لون الهوية' })]));
    box.appendChild(slider('الظل', o.sh || 0, 0, 1, 0.02, pct, function (v) { o.sh = v || 0; }));
    box.appendChild(el('div', { class: 'crow6' }, [el('span', { text: 'طبقة لونية فوق الصورة' }), colorBtn(o.tc && o.tc !== 'p' ? o.tc : '', 'طبقة لونية', function (c) { set('tc', c || null); buildPanel(); }, { orig: true, origLabel: 'بلا' })]));
    if (o.tc) box.appendChild(slider('قوة اللون', o.ta == null ? 0.35 : o.ta, 0.05, 0.95, 0.01, pct, function (v) { o.ta = v; }));
    box.appendChild(slider('تلاشي الأطراف', o.fe || 0, 0, 1, 0.02, pct, function (v) { o.fe = v || 0; }));
    box.appendChild(el('div', { class: 'row wrapr' }, [uploadBtn('استبدال الصورة', function (res) { o.ref = 'asset:' + res.id; changed6(); buildPanel(); })]));
  } else {
    box.appendChild(slider('تكبير', o.z || 1, 0.6, 2.5, 0.01, pct, function (v) { o.z = v; }));
    box.appendChild(slider('تحريك أفقي', o.ox || 0, -1, 1, 0.01, sgn, function (v) { o.ox = v; }));
    box.appendChild(slider('تحريك رأسي', o.oy || 0, -1, 1, 0.01, sgn, function (v) { o.oy = v; }));
  }
  b.appendChild(box);
}
/* ---------- المحاذاة: العنصر إلى حواف التصميم أو وسطه (بهامش التصميم) ---------- */
const AL_IC = {
  r: '<path d="M20 4v16M6 8h10v3H6zM9 13h7v3H9z"/>', ch: '<path d="M12 4v16M6 8h12v3H6zM8 13h8v3H8z"/>', l: '<path d="M4 4v16M8 8h10v3H8zM8 13h7v3H8z"/>',
  t: '<path d="M4 4h16M8 6v10h3V6zM13 6v7h3V6z"/>', cv: '<path d="M4 12h16M8 6v12h3V6zM13 8v8h3V8z"/>', b: '<path d="M4 20h16M8 18V8h3v10zM13 18v-7h3v7z"/>'
};
function alignBar(g) {
  const go = function (k) {
    const bx = LASTG[g]; if (!bx) return; const sz = SIZES[S.size], m = margin(); S.sel = g;
    const dx = k === 'r' ? (sz.w - m) - bx.x1 : k === 'l' ? m - bx.x0 : k === 'ch' ? sz.w / 2 - (bx.x0 + bx.x1) / 2 : 0;
    const dy = k === 't' ? m - bx.y0 : k === 'b' ? (sz.h - m) - bx.y1 : k === 'cv' ? sz.h / 2 - (bx.y0 + bx.y1) / 2 : 0;
    moveSel(dx, dy); changed6();
  };
  const bt = function (k, t) { const x = el('button', { type: 'button', class: 'alb', title: t, 'aria-label': t, onclick: function () { go(k); } }); x.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px">' + AL_IC[k] + '</svg>'; return x; };
  return el('div', { class: 'albar' }, [el('span', { class: 'tiny', text: 'محاذاة' }), bt('r', 'إلى اليمين'), bt('ch', 'وسط أفقي'), bt('l', 'إلى اليسار'), el('i', { class: 'alsep' }), bt('t', 'إلى الأعلى'), bt('cv', 'وسط رأسي'), bt('b', 'إلى الأسفل')]);
}
/* ---------- تأثيرات النص المضاف: تباعد الأسطر، الظل، الحدّ، الخلفية ---------- */
function textEffects(b, L) {
  const box = el('div', { class: 'imgtools' }, [el('h4', { class: 'psh', text: 'تأثيرات النص' })]);
  box.appendChild(slider('تباعد الأسطر', L.lh || 1.32, 0.9, 2.2, 0.02, function (v) { return v.toFixed(2); }, function (v) { L.lh = v; }));
  box.appendChild(slider('الظل', L.ts || 0, 0, 1, 0.02, function (v) { return Math.round(v * 100) + '٪'; }, function (v) { L.ts = v || 0; }));
  box.appendChild(el('div', { class: 'crow6' }, [el('span', { text: 'حدّ حول الحروف' }), colorBtn(L.olc || '', 'لون الحدّ', function (c) { if (c) { L.olc = c; if (!L.olw) L.olw = 0.08; } else { delete L.olc; delete L.olw; } changed6(); buildPanel(); }, { orig: true, origLabel: 'بلا' })]));
  if (L.olc) box.appendChild(slider('سُمك الحدّ', L.olw || 0.08, 0.02, 0.3, 0.01, function (v) { return Math.round(v * 100) + '٪'; }, function (v) { L.olw = v; }));
  box.appendChild(el('div', { class: 'crow6' }, [el('span', { text: 'خلفية خلف النص' }), colorBtn(L.bgc || '', 'لون الخلفية', function (c) { if (c) L.bgc = c; else delete L.bgc; changed6(); buildPanel(); }, { orig: true, origLabel: 'بلا' })]));
  if (L.bgc) {
    box.appendChild(slider('حشوة الخلفية', L.bgp == null ? 0.45 : L.bgp, 0.1, 1.2, 0.02, function (v) { return Math.round(v * 100) + '٪'; }, function (v) { L.bgp = v; }));
    box.appendChild(slider('استدارة الخلفية', L.bgr == null ? 0.35 : L.bgr, 0, 1, 0.02, function (v) { return Math.round(v * 100) + '٪'; }, function (v) { L.bgr = v; }));
  }
  b.appendChild(box);
}
function openElPanel(g) {
  ED.elG = g; ED.prevTab = ED.tab === 'el' ? ED.prevTab : ED.tab; ED.tab = 'el';
  if (S.sel !== g) select(g);
  buildRail(); buildPanel();
  if (window.innerWidth <= 860) document.body.classList.add('sheet-open');
}
function slider(label, val, min, max, step, fmt, on) {
  const out = el('b', { text: fmt(val) });
  return el('label', { class: 'sld6' }, [el('span', { class: 'sl' }, [label, out]), el('input', { type: 'range', min: String(min), max: String(max), step: String(step), value: String(val),
    oninput: function (e) { out.textContent = fmt(+e.target.value); on(+e.target.value); redraw(); }, onchange: function () { changed6(); } })]);
}
function pEl(b) {
  const g = ED.elG;
  if (!g || !(LASTG[g] || (isLayer(g) && layerById(g.slice(2))))) { ED.tab = ED.prevTab || 'layers'; buildRail(); return buildPanel(); }
  const L = isLayer(g) ? layerById(g.slice(2)) : null, st = (S.gs || {})[g] || {}, texts = fieldsOfGroup(g);
  const order = stackOrder().all.filter(function (x) { return LASTG[x] || isLayer(x); }), idx = order.indexOf(g);
  const jump = function (k) { const t = order[idx + k]; if (t) openElPanel(t); };
  b.appendChild(el('div', { class: 'phd elhd' }, [
    el('button', { type: 'button', class: 'btn sm ghost elback', onclick: function () { ED.tab = ED.prevTab || 'layers'; buildRail(); buildPanel(); } }, [ico('chev'), 'رجوع']),
    el('div', { class: 'row elnav' }, [
      el('button', { type: 'button', class: 'ib sm', title: 'العنصر السابق', 'aria-label': 'العنصر السابق', disabled: idx <= 0, onclick: function () { jump(-1); } }, [ico('chev')]),
      el('h3', { text: 'إعدادات العنصر' }),
      el('button', { type: 'button', class: 'ib sm nx', title: 'العنصر التالي', 'aria-label': 'العنصر التالي', disabled: idx >= order.length - 1, onclick: function () { jump(1); } }, [ico('chev')])
    ])]));
  b.appendChild(el('div', { class: 'row' }, [el('div', { class: 'fld grow' }, [el('label', { text: 'اسمه' }), el('input', { type: 'text', value: gName(g), oninput: function (e) { renameEl(g, e.target.value); const t = $('.tname'); if (t) t.textContent = gName(g); } })]),
    el('button', { type: 'button', class: 'btn sm line danger eldel', title: L ? 'حذف العنصر' : 'إزالة العنصر من التصميم (يعود من لوحة الطبقات)', onclick: function () { if (L) { delLayer6(L.id); } else { S.hide['g_' + g] = true; select(null); changed6(); } ED.tab = ED.prevTab || 'layers'; buildRail(); buildPanel(); toast(L ? 'حُذف العنصر' : 'أُزيل العنصر، ويعود من «الطبقات»'); } }, [ico('trash'), L ? 'حذف' : 'إزالة'])]));
  // النصوص
  texts.forEach(function (it) {
    const ph = !it.layer && ED.doc.pages[ED.cur].ph && ED.doc.pages[ED.cur].ph[it.f.k];
    const ta = el('textarea', { rows: '2', dir: 'auto', placeholder: ph || '' });
    ta.value = it.layer ? (it.layer.txt || '') : (ph && S.d[it.f.k] === ph ? '' : S.d[it.f.k]);
    ta.addEventListener('input', function () { if (it.layer) it.layer.txt = ta.value; else S.d[it.f.k] = ta.value === '' && ph ? ph : ta.value; redraw(); clearTimeout(ED.inT); ED.inT = setTimeout(function () { changed6(true); }, 600); });
    b.appendChild(el('div', { class: 'fld' }, [el('div', { class: 'lab' }, [el('label', { text: it.layer ? 'النص' : it.f.label }), emojiBtn(ta)]), ta]));
  });
  // الخط
  if (texts.length) {
    const cur = L ? (L.f || '') : (st.f || '');
    b.appendChild(el('button', { type: 'button', class: 'btn line elfont' }, [ico('font'), el('span', { text: 'الخط: ' + (cur && FONTS[cur] ? FONTS[cur].name : 'خط القالب') })]));
    $$('.elfont', b).forEach(function (x) { x.onclick = function () { ED.fontOpen = g; ED.tab = 'fonts'; buildRail(); buildPanel(); }; });
  }
  // الحجم
  if (L) {
    if (L.t === 'text') b.appendChild(slider('حجم الخط', L.sz || 0.06, 0.01, 0.3, 0.002, function (v) { return Math.round(v * 1000); }, function (v) { L.sz = v; }));
    else b.appendChild(slider('الحجم', L.w, 0.02, 1.6, 0.01, function (v) { return Math.round(v * 100) + '٪'; }, function (v) { L.w = v; }));
    b.appendChild(slider('الشفافية', L.o == null ? 1 : L.o, 0.1, 1, 0.01, function (v) { return Math.round(v * 100) + '٪'; }, function (v) { L.o = v; }));

    if (L.t === 'qr') {
      b.appendChild(el('div', { class: 'fld' }, [el('label', { text: 'الرابط' }), el('input', { type: 'url', class: 'inp sm', dir: 'ltr', value: L.url || '', onchange: function (e) { const v = e.target.value.trim(); if (!/^https?:\/\/\S+$/.test(v)) { toast('رابط غير صالح'); return; } L.url = v; changed6(); } })]));
      b.appendChild(segMini([['#ffffff', 'خلفية بيضاء'], ['none', 'بلا خلفية']], L.bg === 'none' ? 'none' : '#ffffff', function (v) { L.bg = v; changed6(); }));
      b.appendChild(el('p', { class: 'tiny', text: 'اختبر الرمز بهاتفك قبل النشر. الخلفية البيضاء أضمن للمسح.' }));
    }
    if (L.t === 'ticon') b.appendChild(slider('سُمك الخط', L.lw || 2, 1, 3.5, 0.25, function (v) { return v.toFixed(2); }, function (v) { L.lw = v; }));
    if (L.t === 'yt' || L.t === 'video' || L.t === 'audio') {
      b.appendChild(el('div', { class: 'fld' }, [el('label', { text: 'العنوان على البطاقة' }), el('input', { type: 'text', class: 'inp sm', value: L.title || '', oninput: function (e) { L.title = e.target.value; changed6(); } })]));
      if (L.t === 'yt') b.appendChild(el('div', { class: 'fld' }, [el('label', { text: 'رابط يوتيوب' }), el('input', { type: 'url', class: 'inp sm', dir: 'ltr', value: L.url || '', onchange: function (e) { const id = ytId(e.target.value); if (!id) { toast('الرابط ليس رابط يوتيوب'); return; } L.url = 'https://www.youtube.com/watch?v=' + id; changed6(); } })]));
      b.appendChild(el('p', { class: 'tiny', text: 'تعمل الوسائط في العرض بملء الشاشة؛ وفي PDF تبقى بطاقة.' }));
      if (typeof mediaElSettings === 'function') mediaElSettings(L, b);
    }
    if (L.t === 'text') b.appendChild(el('div', { class: 'row wrapr' }, [segMini([['0', 'عادي'], ['0.6', 'عريض'], ['1', 'أعرض']], String(L.b >= 0.9 ? 1 : L.b >= 0.5 ? 0.6 : 0), function (v) { L.b = +v; changed6(); }),
      segMini([['right', 'يمين'], ['center', 'وسط'], ['left', 'يسار']], L.al || 'center', function (v) { L.al = v; changed6(); })]));
    if (L.t === 'text') textEffects(b, L);
  } else b.appendChild(slider('الحجم', st.s || 1, 0.3, 4, 0.01, function (v) { return Math.round(v * 100) + '٪'; }, function (v) { setGs(g, 's', v); }));
  // الألوان
  const cols = el('div', { class: 'row wrapr elcols' });
  if (L && L.t === 'text') { cols.appendChild(el('span', { class: 'tiny', text: 'لون النص' })); cols.appendChild(colorBtn(L.c || '', 'لون النص', function (c) { L.c = c; redraw(); }, { orig: true, origLabel: 'تلقائي' })); cols.appendChild(el('span', { class: 'tiny', text: 'التمييز' })); cols.appendChild(colorBtn(L.hc || '', 'لون التمييز', function (c) { L.hc = c; redraw(); }, { orig: true, origLabel: 'تلقائي' })); }
  else if (L && L.t !== 'img') { cols.appendChild(el('span', { class: 'tiny', text: 'اللون' })); cols.appendChild(colorBtn(L.c === 'color' ? '' : (L.c || ''), 'اللون', function (c) { L.c = c || (L.t === 'logo' ? 'color' : ''); redraw(); }, { orig: L.t === 'logo', origLabel: 'الأصلي' })); }
  else if (!L && texts.length) { cols.appendChild(el('span', { class: 'tiny', text: 'لون النص' })); cols.appendChild(colorBtn(st.c || '', 'لون النص', function (c) { setGs(g, 'c', c); redraw(); }, { orig: true })); cols.appendChild(el('span', { class: 'tiny', text: 'التمييز والأيقونات' })); cols.appendChild(colorBtn(st.h || '', 'لون التمييز والأيقونات', function (c) { setGs(g, 'h', c); redraw(); }, { orig: true })); }
  if (cols.children.length) b.appendChild(cols);
  if ((g === 'logo' || (L && L.t === 'logo' && L.ref === 'track')) && S.track && S.track.logo) logoOptions(b);
  if (L && L.t === 'img') imageTools(b, { o: L, layer: true });
  else if (!L) { const imf = (S.tpl.fields || []).filter(function (f) { return f.kind === 'image' && S.d[f.k] && S.d[f.k].src; }).find(function (f) { return f.k === g || (g === 'photo' && /photo|img|pic/.test(f.k)); }); if (imf) imageTools(b, { o: S.d[imf.k], field: imf.k }); }
  // الترتيب والموضع
  b.appendChild(el('h4', { class: 'psh', text: 'الترتيب والموضع' }));
  b.appendChild(el('div', { class: 'row wrapr' }, [
    el('button', { type: 'button', class: 'btn sm line', onclick: function () { moveInStack(g, 1); } }, [ico('up'), 'للأعلى']),
    el('button', { type: 'button', class: 'btn sm line', onclick: function () { moveInStack(g, -1); } }, [ico('down'), 'للأسفل']),
    el('button', { type: 'button', class: 'btn sm line', title: 'فوق كل العناصر', onclick: function () { for (let i = 0; i < 80; i++) { const a = stackOrder().all; if (a.indexOf(g) >= a.length - 1) break; moveInStack(g, 1); } } }, [ico('front'), 'إلى الأعلى تماماً']),
    el('button', { type: 'button', class: 'btn sm line', title: 'تحت كل العناصر', onclick: function () { for (let i = 0; i < 80; i++) { if (stackOrder().all.indexOf(g) <= 0) break; moveInStack(g, -1); } } }, [ico('back'), 'إلى الأسفل تماماً']),
    L ? null : el('button', { type: 'button', class: 'btn sm line', onclick: function () { const q = posOf(g); q.dx = 0; q.dy = 0; delete S.gs[g]; S.front = (S.front || []).filter(function (x) { return x !== g; }); changed6(); buildPanel(); } }, [ico('reset'), 'كما في القالب'])
  ]));
  b.appendChild(alignBar(g));
  b.appendChild(el('div', { class: 'row wrapr', style: 'margin-top:8px' }, L ? [
    el('button', { type: 'button', class: 'btn sm line', onclick: function () { dupLayer(L); } }, [ico('copy'), 'تكرار']),
    el('button', { type: 'button', class: 'btn sm line', onclick: function () { saveElement([L]); } }, [ico('star'), 'احفظه عنصراً']),
    el('button', { type: 'button', class: 'btn sm danger', onclick: function () { delLayer6(L.id); ED.tab = 'layers'; buildRail(); buildPanel(); } }, [ico('trash'), 'حذف'])
  ] : [el('button', { type: 'button', class: 'btn sm line', onclick: function () { S.hide['g_' + g] = true; select(null); changed6(); ED.tab = 'layers'; buildRail(); buildPanel(); } }, [ico('eyeoff'), 'إخفاء'])]));
}

async function saveElement(layers) {
  const name = await new Promise(function (ok) { const i = el('input', { type: 'text', id: 'el_name', value: layers.length === 1 ? gName('L:' + layers[0].id) : 'عنصري' }); modal({ title: 'احفظه عنصراً', body: [el('div', { class: 'fld' }, [el('label', { for: 'el_name', text: 'الاسم' }), i]), el('p', { class: 'tiny', text: 'تجده في «العناصر» في كل تصاميمك.' })], acts: [{ t: 'حفظ', cls: 'dark', fn: function () { ok(i.value || 'عنصري'); } }, { t: 'إلغاء', fn: function () { ok(null); } }] }); });
  if (!name) return;
  // مصغّر للعنصر وحده
  const c = document.createElement('canvas'), sz = SIZES[S.size], sc = 160 / sz.w;
  c.width = 160; c.height = Math.round(sz.h * sc); const g = c.getContext('2d'); g.scale(sc, sc);
  drawLayers(g, sz.w, sz.h, layers, S.track);
  const data = { layers: layers.map(function (L) { const o = JSON.parse(JSON.stringify(L)); delete o.id; return o; }) };
  try { const res = await API6.me('asset_put', JSON.stringify({ kind: 'element', name: name, data: data, thumb: c.toDataURL('image/png') }), ''); V6.mine.unshift(res); V6.assets[res.id] = res; toast('حُفظ في «عناصري»'); }
  catch (e) { toast(e.message); }
}

/* ---------- المساعد: هياكل جاهزة واقتراحات للتصميم الحالي ---------- */
function pAssist(b) {
  b.appendChild(panelHead('المساعد', 'اقتراحات لتحسين تصميمك الآن.'));
  if (S.tpl.id === 'blank') {
    b.appendChild(el('h4', { class: 'psh', text: 'ابدأ بهيكل' }));
    b.appendChild(el('div', { class: 'skels6' }, SKELETONS.map(function (sk) {
      const c = el('canvas', { width: 216, height: 270, style: 'width:100%' }); const g = c.getContext('2d'); g.scale(216 / 1080, 270 / 1350);
      const T = S.track; paintBg(g, 1080, 1350, sk.bg === 'teal' ? T.c.teal : '#f8f8f8'); sk.make(T).forEach(function (L) { L.id = 'x'; drawLayer(g, 1080, 1350, L, T); });
      return el('button', { type: 'button', class: 'skel6', onclick: async function () { if ((S.layers || []).length && !(await ask('تبديل الهيكل', 'تُستبدل العناصر الحالية بالهيكل الجديد.', 'استبدال'))) return; S.layers = sk.make(S.track).map(function (L) { L.id = newId(); return L; }); S.ov = sk.bg === 'teal' ? { bg: S.track.c.teal, title: '#ffffff', accent: S.track.c.a } : {}; select(null); changed6(); buildPanel(); } }, [c, el('small', { text: sk.name })]);
    })));
  }
  b.appendChild(el('h4', { class: 'psh', text: 'اقتراحات الآن' }));
  const tips = S.tpl.id === 'blank' ? assistantTips() : tplTips();
  tips.forEach(function (tp) { b.appendChild(el('div', { class: 'tip1 card flat' }, [el('p', { class: 'small', text: tp.t }), el('div', { class: 'row wrapr' }, tp.a.map(function (a) { return el('button', { type: 'button', class: 'btn sm line', text: a[0], onclick: function () { a[1](); changed6(); buildPanel(); } }); }))])); });
  b.appendChild(el('div', { class: 'psec' }, [el('a', { class: 'btn dark', href: '#/make' }, [ico('ai'), 'اصنع إعلانك بالمساعد الذكي'])]));
}
// اقتراحات لعناصر القالب: التداخل والقرب من الحافة والعناوين العامة
function tplTips() {
  const tips = [], sz = SIZES[S.size], m = margin();
  const left = phList(); if (left.length) tips.push({ t: 'بقيت ' + left.length + ' خانات بالعنوان العام. اكتب فيها نصك.', a: [['اذهب للمحتوى', function () { ED.tab = 'content'; buildRail(); }]] });
  Object.keys(LASTG).forEach(function (k) {
    if (isLayer(k)) return; const b = LASTG[k];
    if (b.x0 < m * 0.5 || b.x1 > sz.w - m * 0.5 || b.y0 < m * 0.5 || b.y1 > sz.h - m * 0.5) { if (/^(deco|shape|panel|ring|band|photo|footer)$/.test(k)) return; tips.push({ t: '«' + gName(k) + '» قريب من حافة التصميم، وقد يُقصّ عند النشر.', a: [['أرجعه لمكانه', function () { const q = posOf(k); q.dx = 0; q.dy = 0; }]] }); }
    const ov = overlapsOf(k); if (ov.length) tips.push({ t: '«' + gName(k) + '» يتداخل مع «' + gName(ov[0]) + '».', a: [['أرجعه لمكانه', function () { const q = posOf(k); q.dx = 0; q.dy = 0; if (S.gs) delete S.gs[k]; }]] });
  });
  if (!tips.length) tips.push({ t: 'التصميم متوازن. جرّب تراكيب الألوان، أو احفظه في حسابك.', a: [['الألوان', function () { ED.tab = 'colors'; buildRail(); }]] });
  return tips.slice(0, 6);
}
