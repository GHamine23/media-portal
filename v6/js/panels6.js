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
  ({ content: pContent, tpls: pTpls, text: pText, els: pEls, imgs: pImgs, colors: pColors, fonts: pFonts, layers: pLayers, assist: pAssist }[ED.tab] || pContent)(body);
  p.scrollTop = st;
}

/* ---------- المحتوى ---------- */
function pContent(b) {
  const tpl = S.tpl, pg = ED.doc.pages[ED.cur], ph = pg.ph || {};
  b.appendChild(panelHead('المحتوى', 'اكتب نصوصك، وما تتركه فارغاً لا يظهر.'));
  if (tpl.id === 'blank') { b.appendChild(el('p', { class: 'muted small', text: 'هذه صفحة بيضاء: أضف النصوص والعناصر من الأدوات، أو اختر قالباً.' })); b.appendChild(el('button', { type: 'button', class: 'btn dark', text: 'ابدأ بالمساعد', onclick: function () { ED.mode = 'full'; openTab('assist'); } })); return; }
  const form = el('div', { class: 'pform' });
  tpl.fields.forEach(function (f) {
    if (!f.k && f.kind !== 'date') return;
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
    form.appendChild(el('div', { class: 'fld' + (hid ? ' hid' : '') }, [el('div', { class: 'lab' }, [el('label', { for: id, text: f.label }), el('span', { class: 'row' }, [cnt, eye])]), inp, f.hint ? el('small', { text: f.hint }) : null]));
  });
  b.appendChild(form);
  b.appendChild(el('p', { class: 'tip6', html: 'ما تكتبه بين <b>*نجمتين*</b> يظهر بلون مميز. والنص الطويل يصغر وحده ليبقى في مكانه.' }));
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
  return el('div', { class: 'fld datebox6' }, [el('label', { text: 'املأ التاريخ تلقائياً' }), el('div', { class: 'row' }, [inp, adj]), el('small', { text: 'تُملأ خانات التاريخ بالهجري والميلادي. وإن خالف الهجري تقويمكم فعدّله بيوم.' })]);
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
    el('button', { type: 'button', class: 'btn sm ghost', text: 'توسيط', onclick: function () { v.ox = 0; v.oy = 0; v.z = 1; changed6(); buildPanel(); } })]) : null]);
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
  b.appendChild(panelHead('العناصر', 'أضف ما تشاء، وغيّر لونه وحجمه من الشريط فوقه.'));
  const sec = function (t) { b.appendChild(el('h4', { class: 'psh', text: t })); const g = el('div', { class: 'libg' }); b.appendChild(g); return g; };
  const g1 = sec('زخارف من الهوية');
  Object.keys(STICKERS).forEach(function (k) { const col = /star|sparkle/.test(k) ? C.a : C.p; g1.appendChild(el('button', { type: 'button', class: 'libb', title: STICKERS[k].name, 'aria-label': STICKERS[k].name, onclick: function () { addLayer6({ t: 'sticker', ref: k, w: k === 'line' ? 0.4 : 0.18, c: col }); } }, [libCanvas(function (g, s) { STICKERS[k].draw(g, s, col); }, 56, 56)])); });
  const g2 = sec('أيقونات');
  ICON_LIST.forEach(function (k) { g2.appendChild(el('button', { type: 'button', class: 'libb', title: k, onclick: function () { addLayer6({ t: 'icon', ref: k, w: 0.07, c: C.s }); } }, [libCanvas(function (g, s) { ICONS[k](g, s * 0.8, C.s); }, 56, 56)])); });
  const g3 = sec('شعارات');
  Object.keys(TRACKS).forEach(function (id) { const t = TRACKS[id]; (t.logos || [[t.logo, t.name]]).forEach(function (l) { if (!ASSETS[l[0]]) return; const bt = el('button', { type: 'button', class: 'libb wide', title: t.name, onclick: function () { addLayer6({ t: 'logo', ref: l[0], w: 0.22, c: 'color' }); } }); bt.style.backgroundImage = 'url(' + ASSETS[l[0]] + ')'; g3.appendChild(bt); }); });
  ['academy', 'social'].forEach(function (k) { if (!IMG[k]) return; g3.appendChild(el('button', { type: 'button', class: 'libb wide', title: k === 'social' ? 'حسابات التواصل' : 'شعار البرنامج', onclick: function () { addLayer6({ t: 'logo', ref: k, w: 0.16, c: '#4a4a4a' }); } }, [libCanvas(function (g, s) { const im = tinted(k, '#4a4a4a'); if (im) { const w = s * 1.5, h = w * srcH(im) / srcW(im); g.drawImage(im, -w / 2, -h / 2, w, h); } }, 110, 50)])); });
  // عناصرك المحفوظة: مجموعة طبقات تعيد استعمالها
  const mine = V6.mine.filter(function (a) { return a.kind === 'element' && a.data && a.data.layers; });
  const g4 = sec('عناصري المحفوظة');
  if (!mine.length) g4.appendChild(el('p', { class: 'tiny', text: 'اختر طبقة أضفتها، ثم «احفظها عنصراً» من لوحة الطبقات لتجدها هنا في كل تصاميمك.' }));
  mine.forEach(function (a) { const bt = el('button', { type: 'button', class: 'libb', title: a.name, onclick: function () { a.data.layers.forEach(function (L) { const c = JSON.parse(JSON.stringify(L)); addLayer6(c); }); } }); if (a.thumb) bt.style.backgroundImage = 'url(' + a.thumb + ')'; else bt.textContent = a.name; g4.appendChild(bt); });
}

/* ---------- الصور ---------- */
function pImgs(b) {
  b.appendChild(panelHead('الصور', 'صور المكتبة وصورك المرفوعة. تُحفظ بجودتها الأصلية.'));
  b.appendChild(el('div', { class: 'imgrid big' }, [uploadBtn('ارفع صورة', function (res) { addLayer6({ t: 'img', ref: 'asset:' + res.id, w: 0.55 }); buildPanel(); })]));
  b.appendChild(el('h4', { class: 'psh', text: 'صوري' }));
  const g = el('div', { class: 'imgrid' }); b.appendChild(g);
  const mine = V6.mine.filter(function (a) { return a.kind === 'image'; });
  if (!mine.length) g.appendChild(el('p', { class: 'tiny', text: 'لم ترفع صوراً بعد.' }));
  mine.forEach(function (a) {
    const bt = el('button', { type: 'button', class: 'imb', title: a.name, onclick: function () { addLayer6({ t: 'img', ref: 'asset:' + a.id, w: 0.55 }); }, oncontextmenu: function (e) { e.preventDefault(); popMenu(bt, [{ t: 'حذف من مكتبتي', ic: 'trash', fn: async function () { try { await API6.me('asset_del', a.id); V6.mine = V6.mine.filter(function (x) { return x.id !== a.id; }); buildPanel(); } catch (er) { toast(er.message); } } }]); } });
    if (a.thumb) bt.style.backgroundImage = 'url(' + a.thumb + ')';
    g.appendChild(bt);
  });
  b.appendChild(el('h4', { class: 'psh', text: 'مكتبة البرنامج' }));
  const g2 = el('div', { class: 'imgrid' }); b.appendChild(g2);
  DATE_LIB.forEach(function (n) { const bt = el('button', { type: 'button', class: 'imb', title: LIB_NAMES[n] || '', onclick: function () { addLayer6({ t: 'img', ref: 'lib:' + n, w: 0.55 }); } }); bt.style.backgroundImage = 'url(' + ASSETS[n] + ')'; g2.appendChild(bt); });
  b.appendChild(el('h4', { class: 'psh', text: 'خلفية التصميم' }));
  const cur = (S.bgfx && S.bgfx.p) || 'plain';
  const g3 = el('div', { class: 'libg' }); b.appendChild(g3);
  BG_PATTERNS.forEach(function (q) {
    if (q[0] === 'photo') return;
    const c = el('canvas', { width: 90, height: 112, style: 'width:56px;height:70px' }); const gx = c.getContext('2d'); const sv = BGFX; BGFX = { p: q[0] }; gx.scale(90 / 1080, 112 / 1350); paintBg(gx, 1080, 1350, S.track.c.pd); BGFX = sv;
    g3.appendChild(el('button', { type: 'button', class: 'libb' + (cur === q[0] ? ' on' : ''), title: q[1], onclick: function () { S.bgfx = q[0] === 'plain' ? null : { p: q[0] }; changed6(); buildPanel(); } }, [c]));
  });
  if (S.bgfx && S.bgfx.p === 'photo' || true) {
    b.appendChild(el('p', { class: 'tiny', text: 'أو اجعل صورة خلفيةً للتصميم:' }));
    const g4 = el('div', { class: 'imgrid' }); b.appendChild(g4);
    DATE_LIB.concat(mine.map(function (a) { return 'asset:' + a.id; })).forEach(function (n) {
      const src = n.slice(0, 6) === 'asset:' ? n : 'lib:' + n, a = n.slice(0, 6) === 'asset:' ? V6.assets[n.slice(6)] : null;
      const bt = el('button', { type: 'button', class: 'imb' + (S.bgfx && S.bgfx.src === src ? ' on' : ''), onclick: function () { S.bgfx = { p: 'photo', src: src }; changed6(); buildPanel(); } });
      bt.style.backgroundImage = 'url(' + (a ? a.thumb : ASSETS[n]) + ')'; g4.appendChild(bt);
    });
  }
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
  if (ED.doc.kind === 'deck') b.appendChild(el('button', { type: 'button', class: 'btn sm line', text: 'طبّق هذه الألوان على كل الشرائح', onclick: function () { commitPage(); const src = ED.doc.pages[ED.cur]; ED.doc.pages.forEach(function (p) { p.variant = src.variant; p.ov = Object.assign({}, src.ov); }); buildPages(); markDirty(); toast('طُبّقت'); } }));
}

/* ---------- الخطوط ---------- */
function pFonts(b) {
  b.appendChild(panelHead('الخطوط', 'خط العناوين وخط النصوص لكل التصميم. ولخط عنصر واحد اختره ثم غيّر خطه من الشريط فوقه.'));
  const pick = function (role, label, sample) {
    b.appendChild(el('h4', { class: 'psh', text: label }));
    const g = el('div', { class: 'fgrid6' }); b.appendChild(g);
    Object.keys(FONTS).forEach(function (id) {
      const F = FONTS[id], on = FS[role] === id;
      const bt = el('button', { type: 'button', class: 'fnt6' + (on ? ' on' : ''), onclick: async function () { bt.classList.add('loading'); await ensureFonts([id]); FS[role] = id; if (role === 'title') FS.tw = ''; changed6(); buildPanel(); savePrefs6({ fonts: { title: FS.title, body: FS.body } }); } },
        [el('span', { class: 'smp', text: sample }), el('small', { text: F.name })]);
      g.appendChild(bt);
      // معاينة بخطها الحقيقي متى تحمّل
      ensureFonts([id]).then(function () { const w = F.w[role === 'title' ? 'b' : 'r'].split('|'); bt.querySelector('.smp').style.font = (w[1] || 400) + ' 22px "' + w[0] + '", sans-serif'; });
    });
  };
  pick('title', 'خط العناوين', 'لقاء مفتوح');
  pick('body', 'خط النصوص', 'الخميس ٨ مساءً');
  if (can('fonts')) {
    b.appendChild(el('h4', { class: 'psh', text: 'خطك الخاص' }));
    b.appendChild(el('p', { class: 'tiny', text: 'ارفع ملف خط (OTF أو TTF أو WOFF2) ليظهر لك في كل تصاميمك. ارفع كل وزن في ملف.' }));
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

/* ---------- الطبقات ---------- */
function pLayers(b) {
  b.appendChild(panelHead('الطبقات', 'كل عناصر التصميم. اختر عنصراً، أو أخفه، أو رتّب ما أضفته.'));
  const list = el('div', { class: 'llist6' });
  (S.layers || []).slice().reverse().forEach(function (L) {
    const g = 'L:' + L.id;
    list.appendChild(el('div', { class: 'lrow6' + (S.sel === g ? ' on' : '') }, [
      el('button', { type: 'button', class: 'lname', onclick: function () { select(g); } }, [ico(L.t === 'text' ? 'text' : L.t === 'img' ? 'image' : 'shapes'), el('span', { text: gName(g) })]),
      el('button', { type: 'button', class: 'ib sm', title: 'احفظه عنصراً', 'aria-label': 'احفظه عنصراً', onclick: function () { saveElement([L]); } }, [ico('star')]),
      el('button', { type: 'button', class: 'ib sm', title: 'حذف', 'aria-label': 'حذف', onclick: function () { delLayer6(L.id); } }, [ico('trash')])
    ]));
  });
  if (S.layers && S.layers.length) { b.appendChild(el('h4', { class: 'psh', text: 'ما أضفته' })); b.appendChild(list); if (S.layers.length > 1) b.appendChild(el('button', { type: 'button', class: 'btn sm line', text: 'احفظ كل ما أضفته عنصراً واحداً', onclick: function () { saveElement(S.layers); } })); }
  b.appendChild(el('h4', { class: 'psh', text: 'عناصر القالب' }));
  const l2 = el('div', { class: 'llist6' });
  Object.keys(LASTG).filter(function (k) { return !isLayer(k); }).forEach(function (g) {
    l2.appendChild(el('div', { class: 'lrow6' + (S.sel === g ? ' on' : '') }, [el('button', { type: 'button', class: 'lname', onclick: function () { select(g); } }, [ico('layers'), el('span', { text: gName(g) })]),
      el('button', { type: 'button', class: 'ib sm', title: 'إخفاء', 'aria-label': 'إخفاء', onclick: function () { S.hide['g_' + g] = true; select(null); changed6(); } }, [ico('eyeoff')])]));
  });
  Object.keys(S.hide).filter(function (k) { return k.slice(0, 2) === 'g_' && S.hide[k]; }).forEach(function (k) {
    l2.appendChild(el('div', { class: 'lrow6 hid' }, [el('span', { class: 'lname' }, [ico('eyeoff'), el('span', { text: gName(k.slice(2)) })]), el('button', { type: 'button', class: 'ib sm', title: 'إظهار', 'aria-label': 'إظهار', onclick: function () { delete S.hide[k]; changed6(); } }, [ico('eye')])]));
  });
  b.appendChild(l2);
  b.appendChild(el('div', { class: 'psec' }, [el('button', { type: 'button', class: 'btn sm ghost', onclick: function () { if (S.pos) delete S.pos[S.size]; S.gs = {}; select(null); changed6(); } }, [ico('reset'), 'إرجاع كل العناصر إلى مواضعها وأحجامها'])]));
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
