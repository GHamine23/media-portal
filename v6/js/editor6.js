/* ================= المحرر: اللوحة وطبقة التفاعل (Konva) وشريط العنصر والتعديل المباشر =================
   الرسم كله بمحرك القوالب نفسه (فالنتيجة مطابقة تماماً لما يُنزَّل)، وKonva فوقه طبقة شفافة للتحديد والسحب والتكبير والتدوير. */
const ED = {
  open: false, doc: null, cur: 0, zoom: 1, fitZoom: 1, autoFit: true, mode: 'simple', tab: 'content', dragging: false, transforming: false,
  stage: null, layer: null, guides: null, tr: null, proxies: {}, raf: 0, dirty: false, saveT: 0, srvT: 0, undo: [], redo: [], last: null,
  snapshot: function (maxW) { const c = document.createElement('canvas'), sz = SIZES[S.size]; renderTo(c, S.tpl, S.size, snap(), S.track, Math.min(1, maxW / sz.w)); return c.toDataURL('image/jpeg', 0.82); },
  tplId: function () { return S.tpl ? S.tpl.id : ''; }
};
let EPV = null;   // لوحة المعاينة

/* ---------- الرسم ---------- */
function redraw() { if (ED.raf) return; ED.raf = requestAnimationFrame(function () { ED.raf = 0; drawNow(); }); }
function phList() {   // العناوين العامة التي لم تتغير بعد
  const ph = (ED.doc && ED.doc.pages[ED.cur] && ED.doc.pages[ED.cur].ph) || {};
  return Object.keys(ph).filter(function (k) { return S.d[k] === ph[k] && !S.hide['f_' + k]; }).map(function (k) { return norm(String(ph[k]).replace(/\*/g, '')).replace(/\s+/g, ' ').trim(); });
}
function drawNow() {
  if (!EPV || !S.tpl) return;
  const sz = SIZES[S.size], z = ED.zoom, dpr = Math.min(2.5, window.devicePixelRatio || 1);
  PHTXT = phList();
  LASTG = renderTo(EPV, S.tpl, S.size, snap(), S.track, z * dpr, true) || {};
  PHTXT = null;
  EPV.style.width = Math.round(sz.w * z) + 'px'; EPV.style.height = Math.round(sz.h * z) + 'px';
  if (!ED.dragging && !ED.transforming) syncProxies();
  placeToolbar();
}
function fitZoom() {
  const box = $('.e-scroll'); if (!box || !S.size) return 1;
  const sz = SIZES[S.size], pad = window.innerWidth <= 860 ? 24 : 64;
  return Math.max(0.08, Math.min((box.clientWidth - pad) / sz.w, (box.clientHeight - pad) / sz.h, 2));
}
function setZoom(z, keepFit) {
  ED.zoom = Math.max(0.08, Math.min(4, z)); if (!keepFit) ED.autoFit = false;
  const sz = SIZES[S.size], w = Math.round(sz.w * ED.zoom), h = Math.round(sz.h * ED.zoom);
  const holder = $('.e-canvas'); if (holder) { holder.style.width = w + 'px'; holder.style.height = h + 'px'; }
  if (ED.stage) { ED.stage.width(w); ED.stage.height(h); }
  const zl = $('#e_zl'); if (zl) zl.textContent = Math.round(ED.zoom * 100) + '٪';
  drawNow();
}
function refit() { ED.fitZoom = fitZoom(); if (ED.autoFit) setZoom(ED.fitZoom, true); }

/* ---------- طبقة التفاعل ---------- */
function setupKonva() {
  const host = $('#e_konva');
  ED.stage = new Konva.Stage({ container: host, width: 10, height: 10 });
  ED.layer = new Konva.Layer(); ED.guides = new Konva.Layer({ listening: false });
  ED.stage.add(ED.layer); ED.stage.add(ED.guides);
  ED.hover = new Konva.Rect({ stroke: '#1a71fd', strokeWidth: 1, dash: [4, 3], listening: false, visible: false });
  ED.guides.add(ED.hover);
  ED.tr = new Konva.Transformer({
    rotateEnabled: false, keepRatio: true, flipEnabled: false, ignoreStroke: true,
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    anchorSize: 11, anchorCornerRadius: 6, anchorStroke: '#1a71fd', anchorFill: '#fff', anchorStrokeWidth: 1.5,
    borderStroke: '#1a71fd', borderStrokeWidth: 1.5, padding: 5, rotateAnchorOffset: 28, rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315], rotationSnapTolerance: 6,
    boundBoxFunc: function (oldB, newB) { return (Math.abs(newB.width) < 8 || Math.abs(newB.height) < 8) ? oldB : newB; }
  });
  ED.layer.add(ED.tr);
  ED.stage.on('mousedown touchstart', function (e) {
    // لمس التصميم ينقل التركيز إليه، فتعمل اختصارات التراجع والأسهم على التصميم لا على حقل النص
    const ae = document.activeElement; if (ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName) && !(ae.closest && ae.closest('.ied6'))) ae.blur();
    if (e.target === ED.stage) select(null);
  });
  ED.stage.on('mouseleave', function () { ED.hover.visible(false); ED.guides.batchDraw(); });
}
function isLayer(g) { return g && g.slice(0, 2) === 'L:'; }
function syncProxies() {
  if (!ED.layer) return;
  const z = ED.zoom, keep = {};
  // عناصر القالب: الأكبر أولاً فيبقى الأصغر فوقه وأسهل في الاختيار، ثم الطبقات المضافة بترتيبها
  const keys = Object.keys(LASTG).filter(function (k) { return !isLayer(k); }).sort(function (a, b) { return area(LASTG[b]) - area(LASTG[a]); })
    .concat((S.layers || []).map(function (L) { return 'L:' + L.id; }).filter(function (k) { return LASTG[k]; }));
  function area(b) { return (b.x1 - b.x0) * (b.y1 - b.y0); }
  keys.forEach(function (g, i) {
    const b = LASTG[g]; if (!b) return; keep[g] = 1;
    const L = isLayer(g) ? layerById(g.slice(2)) : null;
    let p = ED.proxies[g];
    let x = b.x0 * z, y = b.y0 * z, w = Math.max(6, (b.x1 - b.x0) * z), h = Math.max(6, (b.y1 - b.y0) * z), rot = 0;
    if (L && L.rot) {   // الطبقة المدوّرة: إطارها بحجمها الحقيقي حول مركزها
      const sz = SIZES[S.size], cx = L.x * sz.w * z, cy = L.y * sz.h * z, lw = L.w * sz.w * z, lh = layerH(L) * z;
      w = lw; h = lh; rot = L.rot; x = cx; y = cy;
    }
    if (!p) {
      p = new Konva.Rect({ name: 'px', fill: 'rgba(255,255,255,0.01)', draggable: true, id: g });
      p.on('mouseenter', function () { if (ED.dragging) return; const bb = p.getClientRect({ relativeTo: ED.stage }); ED.hover.setAttrs({ x: bb.x - 3, y: bb.y - 3, width: bb.width + 6, height: bb.height + 6, visible: S.sel !== g }); ED.guides.batchDraw(); document.body.style.cursor = 'move'; });
      p.on('mouseleave', function () { ED.hover.visible(false); ED.guides.batchDraw(); document.body.style.cursor = ''; });
      p.on('mousedown touchstart', function (e) { e.cancelBubble = true; if (S.sel !== g) select(g); });
      p.on('dblclick dbltap', function (e) { e.cancelBubble = true; openInline6(g); });
      p.on('dragstart', function (e) { dragStart(g, p, e); });
      p.on('dragmove', function (e) { dragMove(g, p, e); });
      p.on('dragend', function () { dragEnd(g, p); });
      p.on('transformstart', function () { trStart(g, p); });
      p.on('transform', function () { trMove(g, p); });
      p.on('transformend', function () { trEnd(g, p); });
      ED.layer.add(p); ED.proxies[g] = p;
    }
    if (rot) p.setAttrs({ x: x, y: y, width: w, height: h, offsetX: w / 2, offsetY: h / 2, rotation: rot, scaleX: 1, scaleY: 1 });
    else p.setAttrs({ x: x, y: y, width: w, height: h, offsetX: 0, offsetY: 0, rotation: 0, scaleX: 1, scaleY: 1 });
    p.zIndex(Math.min(i, ED.layer.children.length - 1));
    p.draggable(!ED.locked);
  });
  Object.keys(ED.proxies).forEach(function (g) { if (!keep[g]) { ED.proxies[g].destroy(); delete ED.proxies[g]; } });
  if (S.sel && !ED.proxies[S.sel]) S.sel = null;
  attachTr();
  ED.tr.moveToTop();
  ED.layer.batchDraw();
}
function layerH(L) {
  const sz = SIZES[S.size], b = LASTG['L:' + L.id];
  if (L.t === 'text') return b ? (b.y1 - b.y0) : 40;
  let ar = 1;
  if (L.t === 'sticker') ar = (STICKERS[L.ref] && STICKERS[L.ref].ar) || 1;
  else if (L.t === 'logo') { const k = L.ref === 'track' ? S.track.logo : L.ref; const im = IMG[k]; if (im) ar = srcH(im) / srcW(im); }
  else if (L.t === 'img') { const im = layerImg(L); if (im) ar = srcH(im) / srcW(im); }
  return L.w * sz.w * ar;
}
function attachTr() {
  const p = S.sel && ED.proxies[S.sel];
  if (!p) { ED.tr.nodes([]); ED.layer.batchDraw(); return; }
  const L = isLayer(S.sel) ? layerById(S.sel.slice(2)) : null;
  ED.tr.nodes([p]);
  if (ED.locked) { ED.tr.rotateEnabled(false); ED.tr.enabledAnchors([]); ED.hover.visible(false); return; }
  ED.tr.rotateEnabled(!!L);
  ED.tr.keepRatio(!(L && L.t === 'text'));
  ED.tr.enabledAnchors(L && L.t === 'text' ? ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right'] : ['top-left', 'top-right', 'bottom-left', 'bottom-right']);
  ED.hover.visible(false);
}
function select(g) {
  if (ED.editing && ED.editing !== g) closeInline6();
  S.sel = g || null;
  attachTr(); ED.layer.batchDraw();
  buildToolbar();
  if (ED.tab === 'layers') buildPanel();
}

/* ---------- السحب: التصاق بالمنتصف والهوامش والعناصر، وShift يقيّد المحور ---------- */
function dragStart(g, p, e) {
  ED.dragging = true; closeInline6();
  if (S.sel !== g) select(g);
  const L = isLayer(g) ? layerById(g.slice(2)) : null;
  ED.d0 = { x: p.x(), y: p.y(), box: Object.assign({}, LASTG[g]), lx: L ? L.x : 0, ly: L ? L.y : 0, pos: L ? null : Object.assign({}, posOf(g)), axis: null };
  hideToolbar();
}
function dragMove(g, p, e) {
  const d0 = ED.d0, z = ED.zoom, sz = SIZES[S.size], ev = e.evt || {};
  let dx = (p.x() - d0.x) / z, dy = (p.y() - d0.y) / z;
  if (ev.shiftKey) {
    if (!d0.axis && Math.abs(dx) + Math.abs(dy) > 4 / z) d0.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
    if (d0.axis === 'x') dy = 0; else if (d0.axis === 'y') dx = 0;
  } else d0.axis = null;
  let sn = ev.altKey ? { dx: dx, dy: dy, guides: [] } : snapDelta(d0.box, dx, dy);
  if (d0.axis === 'x') { sn.dy = 0; sn.guides = sn.guides.filter(function (q) { return q.x != null; }); }
  if (d0.axis === 'y') { sn.dx = 0; sn.guides = sn.guides.filter(function (q) { return q.y != null; }); }
  p.position({ x: d0.x + sn.dx * z, y: d0.y + sn.dy * z });
  if (isLayer(g)) { const L = layerById(g.slice(2)); L.x = d0.lx + sn.dx / sz.w; L.y = d0.ly + sn.dy / sz.h; }
  else { const q = posOf(g); q.dx = d0.pos.dx + sn.dx; q.dy = d0.pos.dy + sn.dy; }
  drawGuides(sn.guides, d0.axis);
  redraw();
}
function dragEnd(g, p) {
  ED.dragging = false; ED.d0 = null; drawGuides([]);
  changed6(); track('tool', { tool: 'drag' });
  setTimeout(function () { drawNow(); buildToolbar(); }, 0);
}
function drawGuides(gs, axis) {
  ED.guides.find('.gl').forEach(function (n) { n.destroy(); });
  const z = ED.zoom, sz = SIZES[S.size];
  gs.forEach(function (q) {
    const pts = q.x != null ? [q.x * z, 0, q.x * z, sz.h * z] : [0, q.y * z, sz.w * z, q.y * z];
    ED.guides.add(new Konva.Line({ name: 'gl', points: pts, stroke: '#ff3d8b', strokeWidth: 1, listening: false }));
  });
  const tag = $('#e_axis'); if (tag) { tag.hidden = !axis; tag.textContent = axis === 'x' ? 'أفقي فقط' : 'رأسي فقط'; }
  ED.guides.batchDraw();
}

/* ---------- التكبير والتدوير بالمقابض ---------- */
function trStart(g, p) {
  ED.transforming = true; closeInline6(); hideToolbar();
  const L = isLayer(g) ? layerById(g.slice(2)) : null;
  ED.t0 = { s: ((S.gs && S.gs[g]) || {}).s || 1, w: L ? L.w : 0, sz: L ? (L.sz || 0.06) : 0, rot: L ? (L.rot || 0) : 0, pw: p.width(), x: L ? L.x : 0, y: L ? L.y : 0 };
}
function trMove(g, p) {
  const t0 = ED.t0, sx = Math.abs(p.scaleX()), sy = Math.abs(p.scaleY());
  if (isLayer(g)) {
    const L = layerById(g.slice(2)), sz = SIZES[S.size], z = ED.zoom;
    if (L.t === 'text') {
      const anchor = ED.tr.getActiveAnchor() || '';
      if (/middle/.test(anchor)) { L.w = Math.max(0.05, t0.w * sx); }
      else { L.w = Math.max(0.05, t0.w * sx); L.sz = Math.max(0.01, t0.sz * sy); }
    } else L.w = Math.max(0.02, t0.w * sx);
    L.rot = Math.round(p.rotation());
    // المركز بعد التحويل
    const c = p.getClientRect({ relativeTo: ED.stage });
    L.x = (c.x + c.width / 2) / z / sz.w; L.y = (c.y + c.height / 2) / z / sz.h;
  } else {
    setGs(g, 's', Math.max(0.3, Math.min(4, Math.round(t0.s * sx * 100) / 100)));
  }
  redraw();
}
function trEnd(g, p) {
  ED.transforming = false; ED.t0 = null;
  changed6(); track('tool', { tool: 'resize' });
  drawNow(); buildToolbar();
}

/* ---------- شريط العنصر العائم ---------- */
function hideToolbar() { const t = $('#e_tb'); if (t) t.classList.remove('show'); }
function placeToolbar() {
  const tb = $('#e_tb'); if (!tb || !S.sel || ED.dragging || ED.transforming || !tb.firstChild) return;
  const p = ED.proxies[S.sel]; if (!p) { tb.classList.remove('show'); return; }
  if (window.innerWidth <= 860) { tb.classList.add('show'); return; }   // في الجوال مثبّت فوق شريط الأدوات
  const host = $('.e-scroll'), hr = host.getBoundingClientRect(), cr = $('.e-canvas').getBoundingClientRect();
  const r = p.getClientRect({ relativeTo: ED.stage });
  const tw = tb.offsetWidth, th = tb.offsetHeight;
  let x = cr.left - hr.left + host.scrollLeft + r.x + r.width / 2 - tw / 2;
  let y = cr.top - hr.top + host.scrollTop + r.y - th - 16;
  if (y < host.scrollTop + 8) y = cr.top - hr.top + host.scrollTop + r.y + r.height + 16;
  x = Math.max(host.scrollLeft + 8, Math.min(host.scrollLeft + host.clientWidth - tw - 8, x));
  tb.style.left = x + 'px'; tb.style.top = y + 'px';
  tb.classList.add('show');
}
function tbBtn(ic, title, fn, cls) { return el('button', { type: 'button', class: 'ib ' + (cls || ''), title: title, 'aria-label': title, onclick: fn }, [ico(ic)]); }
function tbSep() { return el('span', { class: 'tsep' }); }
function colorBtn(cur, title, on, opts) {
  const b = el('button', { type: 'button', class: 'cbtn', title: title, 'aria-label': title }, [el('i', { style: 'background:' + (cur && cur !== 'color' ? cur : 'conic-gradient(#f88833,#6d60fc,#1a71fd,#36a660,#f88833)') })]);
  b.addEventListener('click', function () { colorPop(b, cur, on, opts); });
  return b;
}
function colorPop(anchor, cur, on, opts) {
  opts = opts || {};
  $$('.cpop').forEach(function (x) { x.remove(); });
  const T = S.track;
  const list = (opts.orig ? ['__orig'] : []).concat(T.swatches.concat(['#ffffff', '#000000']).filter(function (c, i, a) { return a.indexOf(c) === i; }));
  const pop = el('div', { class: 'cpop', role: 'dialog', 'aria-label': 'الألوان' }, [
    el('small', { text: 'ألوان الهوية' }),
    el('div', { class: 'cgrid' }, list.map(function (c) {
      if (c === '__orig') return el('button', { type: 'button', class: 'csw orig' + (!cur ? ' on' : ''), title: 'كما في القالب', onclick: function () { on(''); done(); } }, [opts.origLabel || 'أصل']);
      return el('button', { type: 'button', class: 'csw' + (cur === c ? ' on' : ''), style: 'background:' + c, title: c, 'aria-label': c, onclick: function () { on(c); done(); } });
    })),
    el('label', { class: 'cmore' }, [el('span', { text: 'لون آخر' }), el('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(cur || '') ? cur : '#1a71fd', oninput: function (e) { on(e.target.value, true); }, onchange: function () { done(); } })])
  ]);
  function done() { pop.remove(); changed6(); buildToolbar(); }
  document.body.appendChild(pop);
  const r = anchor.getBoundingClientRect(); let x = r.left + r.width / 2 - pop.offsetWidth / 2; x = Math.max(8, Math.min(innerWidth - pop.offsetWidth - 8, x));
  let y = r.bottom + 10; if (y + pop.offsetHeight > innerHeight - 8) y = r.top - pop.offsetHeight - 10;
  pop.style.left = x + 'px'; pop.style.top = Math.max(8, y) + 'px';
  setTimeout(function () { document.addEventListener('mousedown', function off(e) { if (!pop.contains(e.target) && e.target !== anchor) { pop.remove(); document.removeEventListener('mousedown', off); } }); }, 0);
}
function fontSelect(cur, on, includeTpl) {
  const s = el('select', { class: 'fsel', 'aria-label': 'الخط', onchange: async function (e) { await ensureFonts([e.target.value]); on(e.target.value); changed6(); } },
    (includeTpl ? [el('option', { value: '', text: 'خط القالب' })] : []).concat(Object.keys(FONTS).map(function (id) { return el('option', { value: id, text: FONTS[id].name, selected: id === cur }); })));
  if (!cur && includeTpl) s.value = '';
  return s;
}
function sizeStepper(val, min, max, step, fmt, on) {
  const lbl = el('b', { class: 'tval', text: fmt(val) });
  return el('div', { class: 'tstep' }, [
    el('button', { type: 'button', class: 'ib sm', 'aria-label': 'تصغير', onclick: function () { val = Math.max(min, Math.round((val - step) * 1000) / 1000); lbl.textContent = fmt(val); on(val); redraw(); clearTimeout(ED.stepT); ED.stepT = setTimeout(changed6, 400); } }, ['−']),
    lbl,
    el('button', { type: 'button', class: 'ib sm', 'aria-label': 'تكبير', onclick: function () { val = Math.min(max, Math.round((val + step) * 1000) / 1000); lbl.textContent = fmt(val); on(val); redraw(); clearTimeout(ED.stepT); ED.stepT = setTimeout(changed6, 400); } }, ['+'])
  ]);
}
function buildToolbar() {
  const tb = $('#e_tb'); if (!tb) return;
  tb.innerHTML = '';
  const g = S.sel;
  if (!g || !LASTG[g]) { tb.classList.remove('show'); return; }
  const L = isLayer(g) ? layerById(g.slice(2)) : null;
  const items = [el('span', { class: 'tname', text: gName(g) })];
  if (ED.locked) {   // درجة «المحتوى فقط»: تعديل النص وحده
    if (fieldsOfGroup(g).length) items.push(tbBtn('text', 'تعديل النص', function () { openInline6(g); }));
    else items.push(el('span', { class: 'tiny', text: 'التعديل هنا للنصوص والصور فقط' }));
    items.forEach(function (n) { tb.appendChild(n); }); requestAnimationFrame(placeToolbar); return;
  }
  if (L) {
    if (L.t === 'text') {
      items.push(fontSelect(L.f || '', function (v) { L.f = v || undefined; }, true));
      items.push(sizeStepper(L.sz || 0.06, 0.01, 0.3, 0.004, function (v) { return Math.round(v * 1000); }, function (v) { L.sz = v; }));
      items.push(segMini([['0', 'عادي'], ['0.6', 'عريض'], ['1', 'أعرض']], String(L.b >= 0.9 ? 1 : L.b >= 0.5 ? 0.6 : 0), function (v) { L.b = +v; changed6(); }));
      items.push(segMini([['right', ico('align')], ['center', 'وسط'], ['left', 'يسار']].map(function (q, i) { return [q[0], i === 0 ? 'يمين' : q[1]]; }), L.al || 'center', function (v) { L.al = v; changed6(); }));
      items.push(colorBtn(L.c || '', 'لون النص', function (c) { L.c = c; redraw(); }, { orig: true, origLabel: 'تلقائي' }));
      items.push(colorBtn(L.hc || '', 'لون التمييز (*نجمتين*)', function (c) { L.hc = c; redraw(); }, { orig: true, origLabel: 'تلقائي' }));
      items.push(tbBtn('text', 'تعديل النص', function () { openInline6(g); }));
    } else {
      items.push(sizeStepper(L.w, 0.02, 1.6, 0.01, function (v) { return Math.round(v * 100) + '٪'; }, function (v) { L.w = v; }));
      if (L.t !== 'img') items.push(colorBtn(L.c === 'color' ? '' : (L.c || ''), 'اللون', function (c) { L.c = c || (L.t === 'logo' ? 'color' : ''); redraw(); }, { orig: L.t === 'logo', origLabel: 'الأصلي' }));
      if (L.t === 'img') items.push(sizeStepper(L.r || 0, 0, 0.5, 0.02, function (v) { return 'حواف ' + Math.round(v * 200) + '٪'; }, function (v) { L.r = v; }));
    }
    items.push(tbSep());
    items.push(el('label', { class: 'topac', title: 'الشفافية' }, [ico('eye'), el('input', { type: 'range', min: '0.1', max: '1', step: '0.01', value: String(L.o == null ? 1 : L.o), 'aria-label': 'الشفافية', oninput: function (e) { L.o = +e.target.value; redraw(); }, onchange: changed6 })]));
    items.push(tbBtn('front', 'للأمام', function () { const i = S.layers.indexOf(L); if (i < S.layers.length - 1) { S.layers.splice(i, 1); S.layers.splice(i + 1, 0, L); changed6(); } }));
    items.push(tbBtn('back', 'للخلف', function () { const i = S.layers.indexOf(L); if (i > 0) { S.layers.splice(i, 1); S.layers.splice(i - 1, 0, L); changed6(); } }));
    items.push(tbBtn('copy', 'تكرار (Ctrl+D)', function () { dupLayer(L); }));
    items.push(tbBtn('pencil', 'إعدادات العنصر', function () { openElPanel(g); }));
    items.push(tbBtn('trash', 'حذف', function () { delLayer6(L.id); }, 'danger'));
  } else {
    const st = (S.gs && S.gs[g]) || {}, hasText = !!(LASTT[g] && LASTT[g].length);
    if (hasText) items.push(fontSelect(st.f || '', function (v) { setGs(g, 'f', v); }, true));
    items.push(sizeStepper(st.s || 1, 0.3, 4, 0.05, function (v) { return Math.round(v * 100) + '٪'; }, function (v) { setGs(g, 's', v); }));
    if (hasText) {
      items.push(colorBtn(st.c || '', 'لون النص', function (c) { setGs(g, 'c', c); redraw(); }, { orig: true }));
      items.push(colorBtn(st.h || '', 'لون التمييز والأيقونات', function (c) { setGs(g, 'h', c); redraw(); }, { orig: true }));
      if (fieldsOfGroup(g).length) items.push(tbBtn('text', 'تعديل النص (نقر مزدوج)', function () { openInline6(g); }));
    }
    items.push(tbSep());
    items.push(tbBtn('pencil', 'إعدادات العنصر', function () { openElPanel(g); }));
    items.push(tbBtn('more', 'المزيد', function (e) {
      popMenu(e.currentTarget, [
        { t: 'توسيط أفقي', ic: 'align', fn: function () { const b = LASTG[g]; moveSel(SIZES[S.size].w / 2 - (b.x0 + b.x1) / 2, 0); changed6(); } },
        { t: 'توسيط رأسي', ic: 'align', fn: function () { const b = LASTG[g]; moveSel(0, SIZES[S.size].h / 2 - (b.y0 + b.y1) / 2); changed6(); } },
        { t: 'إرجاعه لمكانه', ic: 'reset', fn: function () { const q = posOf(g); q.dx = 0; q.dy = 0; changed6(); } },
        Object.keys(st).length ? { t: 'إرجاع حجمه ولونه وخطه', ic: 'reset', fn: function () { delete S.gs[g]; changed6(); } } : null,
        '-',
        { t: 'إخفاء', ic: 'eyeoff', fn: function () { S.hide['g_' + g] = true; select(null); changed6(); } }
      ].filter(Boolean));
    }));
  }
  items.forEach(function (n) { if (n) tb.appendChild(n); });
  requestAnimationFrame(placeToolbar);
}
function segMini(items, cur, on) { return el('div', { class: 'tseg' }, items.map(function (it) { return el('button', { type: 'button', class: it[0] === cur ? 'on' : '', onclick: function (e) { $$('button', e.currentTarget.parentNode).forEach(function (x) { x.classList.remove('on'); }); e.currentTarget.classList.add('on'); on(it[0]); } }, [it[1]]); })); }
function dupLayer(L) { const c = JSON.parse(JSON.stringify(L)); c.id = newId(); c.x += 0.03; c.y += 0.03; S.layers.push(c); S.sel = 'L:' + c.id; changed6(); setTimeout(function () { select(S.sel); }, 30); }
function delLayer6(id) { S.layers = S.layers.filter(function (L) { return L.id !== id; }); select(null); changed6(); }
function addLayer6(L) {
  L.id = newId(); if (L.x == null) { L.x = 0.5; L.y = 0.5; }
  S.layers = (S.layers || []).concat([L]);
  changed6(); drawNow(); select('L:' + L.id);
  track('tool', { tool: 'add_' + L.t });
}

/* ---------- تعديل النص مباشرة (نقر مزدوج أو لمس مزدوج) ---------- */
function closeInline6() {
  const o = $('.ied6'); if (!o) return;
  o.remove(); const g = ED.editing; ED.editing = null; drawNow(); changed6();
  if (ED.tab === 'content') buildPanel();
  void g;
}
function openInline6(g) {
  closeInline6();
  const list = fieldsOfGroup(g);
  if (!list.length) { toast('هذا العنصر ليس نصاً. غيّر حجمه ولونه من الشريط فوقه.'); return; }
  if (S.sel !== g) select(g);
  const p = ED.proxies[g]; if (!p) return;
  hideToolbar(); ED.editing = g;
  const host = $('.e-scroll'), hr = host.getBoundingClientRect(), cr = $('.e-canvas').getBoundingClientRect(), r = p.getClientRect({ relativeTo: ED.stage });
  const box = el('div', { class: 'ied6', role: 'dialog', 'aria-label': 'تعديل النص' });
  list.forEach(function (it, i) {
    const ta = el('textarea', { rows: '1', 'aria-label': it.layer ? 'النص' : it.f.label, dir: 'auto' });
    const ph = !it.layer && ED.doc.pages[ED.cur].ph && ED.doc.pages[ED.cur].ph[it.f.k];
    ta.value = it.layer ? (it.layer.txt || '') : S.d[it.f.k];
    if (ph && ta.value === ph) { ta.placeholder = ph; ta.value = ''; }
    const fit2 = function () { ta.style.height = 'auto'; ta.style.height = Math.min(240, ta.scrollHeight + 2) + 'px'; };
    ta.addEventListener('input', function () {
      const v = ta.value === '' && ph ? ph : ta.value;
      if (it.layer) it.layer.txt = ta.value; else S.d[it.f.k] = v;
      fit2(); redraw(); clearTimeout(ED.inT); ED.inT = setTimeout(function () { changed6(true); }, 700);
    });
    ta.addEventListener('keydown', function (e) { if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); closeInline6(); } });
    if (list.length > 1) box.appendChild(el('small', { text: it.f.label }));
    box.appendChild(ta); setTimeout(fit2, 0);
    if (i === 0) setTimeout(function () { ta.focus(); if (ta.value) ta.select(); }, 40);
  });
  box.appendChild(el('div', { class: 'iedf' }, [el('span', { class: 'tiny', text: 'ما بين *نجمتين* يظهر بلون مميز · Ctrl+Enter للإنهاء' }), el('button', { type: 'button', class: 'btn dark sm', text: 'تم', onclick: closeInline6 })]));
  if (window.innerWidth <= 860) { document.body.appendChild(box); box.classList.add('mob'); }
  else {
    host.appendChild(box);
    const w = Math.max(280, Math.min(host.clientWidth - 24, r.width + 40));
    let x = cr.left - hr.left + host.scrollLeft + r.x + r.width / 2 - w / 2; x = Math.max(host.scrollLeft + 12, Math.min(host.scrollLeft + host.clientWidth - w - 12, x));
    let y = cr.top - hr.top + host.scrollTop + r.y + r.height + 14;
    box.style.width = w + 'px'; box.style.left = x + 'px';
    if (y + box.offsetHeight > host.scrollTop + host.clientHeight - 8) y = Math.max(host.scrollTop + 8, cr.top - hr.top + host.scrollTop + r.y - box.offsetHeight - 14);
    box.style.top = y + 'px';
  }
  track('tool', { tool: 'inline_edit' });
}
document.addEventListener('mousedown', function (e) { const o = $('.ied6'); if (o && !o.contains(e.target) && !(e.target.closest && e.target.closest('#e_konva'))) closeInline6(); }, true);
