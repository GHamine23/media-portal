/* ================= المراجعة والتعليقات والإشعارات وأسبوعك في أثر ================= */
function rc(node) { node.replaceChildren.apply(node, Array.prototype.slice.call(arguments, 1).filter(function (x) { return x != null && x !== false; })); }

// صورة التصميم بجودة كاملة (PNG) لترسل للمراجعة
function designPNG(maxW) { const c = document.createElement('canvas'), sz = SIZES[S.size]; renderTo(c, S.tpl, S.size, snap(), S.track, Math.min(1, (maxW || sz.w) / sz.w)); return c.toDataURL('image/png'); }
function designTexts() { return (S.tpl.fields || []).filter(function (f) { return f.k && typeof S.d[f.k] === 'string' && S.d[f.k].trim() && !(S.hide || {})['f_' + f.k]; }).map(function (f) { return f.label + ': ' + S.d[f.k].replace(/\*/g, ''); }).concat((S.layers || []).filter(function (L) { return L.t === 'text'; }).map(function (L) { return 'نص حر: ' + L.txt; })).join('\n'); }

/* ---------- مراجعة التصميم بالمصمّم الذكي ---------- */
const REVIEW_SCHEMA = { type: 'OBJECT', properties: {
  score: { type: 'NUMBER' }, verdict: { type: 'STRING' },
  strengths: { type: 'ARRAY', items: { type: 'STRING' } },
  issues: { type: 'ARRAY', items: { type: 'OBJECT', properties: { cat: { type: 'STRING' }, title: { type: 'STRING' }, fix: { type: 'STRING' }, severity: { type: 'STRING' } }, required: ['cat', 'title', 'fix'] } },
  quick: { type: 'ARRAY', items: { type: 'STRING' } },
  edits: { type: 'ARRAY', items: { type: 'OBJECT', properties: { target: { type: 'STRING' }, op: { type: 'STRING' }, value: { type: 'STRING' }, why: { type: 'STRING' } }, required: ['target', 'op'] } } }, required: ['score', 'verdict', 'issues'] };
async function aiReview() {
  if (!aiReady()) { toast('المراجعة الذكية تحتاج صلاحية المساعد'); return; }
  const body = el('div', { class: 'rvbody' }, [el('div', { class: 'rvwait' }, [loader6('يتأمل المصمّم الذكي تصميمك…', true), notifyBtn()])]);
  modal({ title: 'مراجعة المصمّم الذكي', wide: true, body: [body], acts: [{ t: 'إغلاق' }] });
  const png = designPNG(1080), sz = SIZES[S.size];
  const sys = ['أنت مصمّم جرافيك عربي خبير ومراجع لطيف صريح. تراجع تصميماً تربوياً لبرنامج «' + (V6.prog ? V6.prog.name : '') + '» بهوية «' + S.track.name + '».',
    'قيّم الصورة المرفقة كما يراها الجمهور على الهاتف. أعطِ score من ١٠٠ بعدل (٨٠+ ممتاز، ٦٠–٧٩ جيد، أقل يحتاج عملاً).',
    'verdict جملة واحدة. strengths من نقطتين إلى ثلاث محددة. issues من مشكلتين إلى خمس مرتبة بالأهمية، لكل واحدة cat من: ' + TIP_CATS.map(function (c) { return c.id; }).join(', ') + '، وtitle قصير، وfix خطوة عملية يفعلها في المحرر (كبّر، قرّب، احذف، غيّر اللون إلى…)، وseverity: high أو mid أو low.',
    'quick: ثلاثة تحسينات سريعة في دقيقة. لا تعلّق على الشعارات ولا تطلب تغيير هوية البرنامج. اكتب بعربية واضحة قصيرة.',
    'edits: تعديلات آلية محدودة يمكن للمنصة تطبيقها (حتى ٦)، كل واحد {target: اسم العنصر من القائمة أدناه، op: scale|move|hide|text|accent، value}. scale: نسبة مثل 1.25 أو 0.8؛ move: dx,dy بالبكسل من عرض 1080 مثل "0,-40"؛ hide: إخفاء عنصر زائد؛ text: نص جديد لحقل نصي (قصير)؛ accent: لون سداسي للتمييز. لا تقترح edits إلا إذا كانت آمنة وواضحة.'].join('\n');
  const groups = Object.keys(LASTG || {}).filter(function (g) { return g !== 'deco'; });
  const prompt = 'القالب: ' + S.tpl.name + ' · المقاس: ' + (sz.name || S.size) + ' (' + sz.w + '×' + sz.h + ')\nعناصر التصميم (للـedits): ' + groups.map(function (g) { return g + ' = ' + gName(g); }).join('، ') + '\nالحقول النصية: ' + (S.tpl.fields || []).filter(function (f) { return f.k && typeof S.d[f.k] === 'string'; }).map(function (f) { return f.k + ' = ' + f.label; }).join('، ') + '\nنصوص التصميم:\n' + (designTexts() || '—');
  try {
    const raw = await API6.call('ai_make', V6.token, JSON.stringify({ kind: 'review', program: V6.prog.id, system: sys, prompt: prompt, files: [{ mime: 'image/png', b64: png.split(',')[1] }], schema: REVIEW_SCHEMA, temperature: 0.3 }));
    const r = JSON.parse(raw); r.score = Math.max(0, Math.min(100, Math.round(+r.score || 0)));
    ED.lastReview = r; track('tool', { tool: 'ai_review' }); notifyDone('مراجعة التصميم جاهزة', r.verdict || '');
    paintReview(body, r);
  } catch (e) { rc(body, el('p', { class: 'err', text: e.message })); }
}
function scoreRing(score, size) {
  const R = 46, L = 2 * Math.PI * R, col = score >= 80 ? '#17a34a' : score >= 60 ? '#e8a317' : '#e4572e';
  const w = el('div', { class: 'ring6', style: '--sz:' + (size || 120) + 'px' });
  w.innerHTML = '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="' + R + '" class="rbg"/><circle cx="60" cy="60" r="' + R + '" class="rfg" stroke="' + col + '" stroke-dasharray="' + L + '" stroke-dashoffset="' + L + '" style="--to:' + (L * (1 - score / 100)) + '"/></svg>';
  const n = el('b', { text: '0' }); w.appendChild(n);
  countUp(n, score, 1100);
  return w;
}
function countUp(node, to, ms) {
  const t0 = performance.now(), from = 0;
  (function step(t) { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); node.textContent = String(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(step); })(t0);
}
function paintReview(body, r) {
  const sev = { high: ['مهم', 'no'], mid: ['متوسط', 'or'], low: ['تحسين', 'ok'] };
  rc(body, 
    el('div', { class: 'rvtop' }, [scoreRing(r.score), el('div', {}, [el('h3', { text: r.verdict || '' }), el('p', { class: 'tiny muted', text: 'تقييم آلي يرشدك، والقرار لك. التصميم الجميل يبلغ ٨٠ فما فوق.' })])]),
    r.strengths && r.strengths.length ? el('div', { class: 'rvsec' }, [el('h4', { text: 'أحسنت في' }), el('ul', { class: 'rvgood' }, r.strengths.map(function (s, i) { return el('li', { class: 'rv', style: '--d:' + i, text: s }); }))]) : null,
    el('div', { class: 'rvsec' }, [el('h4', { text: 'ما يرفع تصميمك' }), el('div', { class: 'rvissues' }, (r.issues || []).map(function (it, i) {
      const C = tipCat(it.cat), tip = TIPS.filter(function (t) { return t.c === C.id; })[i % Math.max(1, TIPS.filter(function (t) { return t.c === C.id; }).length)];
      const s = sev[it.severity] || sev.mid;
      return el('div', { class: 'rvissue rv', style: '--d:' + i + ';--tc:' + C.c }, [
        el('div', { class: 'row' }, [el('span', { class: 'tipcat', text: C.n }), el('span', { class: 'sev ' + s[1], text: s[0] })]),
        el('b', { text: it.title }), el('p', { text: it.fix }),
        tip ? el('a', { class: 'rvtip', href: '#/tips/' + C.id, onclick: function () { closeModals(); } }, [ico('book'), 'نصيحة: ' + tip.t]) : null
      ]);
    }))]),
    r.quick && r.quick.length ? el('div', { class: 'rvsec' }, [el('h4', { text: 'في دقيقة' }), el('ol', { class: 'rvquick' }, r.quick.map(function (q) { return el('li', { text: q }); }))]) : null,
    r.edits && r.edits.length ? el('div', { class: 'rvsec rvedits' }, [el('h4', { text: 'تعديلات يستطيع المساعد تطبيقها' }), el('ul', { class: 'rvquick' }, r.edits.map(function (e) { return el('li', { text: editLabel(e) }); })),
      el('div', { class: 'row wrapr' }, [el('button', { type: 'button', class: 'btn sm dark', onclick: function () { const n = applyReviewEdits(r.edits); closeModals(); toast(n ? 'طُبّق ' + n + ' تعديلاً. تراجع بـ Ctrl+Z إن لم يعجبك' : 'لم يُطبَّق شيء'); } }, [ico('wand'), 'طبّق التعديلات']), el('small', { class: 'tiny', text: 'الأدق أن تطبّقها بيدك في المحرر؛ هذا تطبيق تقريبي يمكن التراجع عنه.' })])]) : null,
    aiNotice('هذه المراجعة من المساعد: مفيدة للإرشاد، وقد تخطئ في تقدير التفاصيل. القرار النهائي لعينك.'),
    el('div', { class: 'row wrapr' }, [el('button', { type: 'button', class: 'btn line', onclick: function () { closeModals(); requestReview(r); } }, [ico('review'), 'اطلب رأي إدارة أثر أيضاً']), el('span', { class: 'sp' }), el('button', { type: 'button', class: 'btn sm line', onclick: function () { closeModals(); aiReview(); } }, [ico('reset'), 'راجع مرة أخرى بعد التعديل'])])
  );
  revealAll(body);
}
const EDIT_OP_N = { scale: 'تغيير حجم', move: 'تحريك', hide: 'إخفاء', text: 'تغيير نص', accent: 'لون التمييز' };
function editLabel(e) { return (EDIT_OP_N[e.op] || e.op) + ' «' + gName(e.target) + '»' + (e.value ? ' (' + e.value + ')' : '') + (e.why ? ' — ' + e.why : ''); }
function applyReviewEdits(edits) {
  let n = 0; pushUndo6 && pushUndo6(true);
  (edits || []).slice(0, 6).forEach(function (e) {
    const g = e.target; if (!g) return;
    if (e.op === 'scale' && LASTG[g]) { const v = Math.max(0.5, Math.min(2, parseFloat(e.value) || 1)); S.gs = S.gs || {}; S.gs[g] = Object.assign({}, S.gs[g], { s: Math.max(0.4, Math.min(2.5, ((S.gs[g] || {}).s || 1) * v)) }); n++; }
    else if (e.op === 'move' && LASTG[g]) { const p = String(e.value || '').split(',').map(Number); if (p.length === 2 && isFinite(p[0]) && isFinite(p[1])) { S.pos = S.pos || {}; const ps = S.pos[S.size] = S.pos[S.size] || {}; const o = ps[g] || {}; ps[g] = { dx: (o.dx || 0) + Math.max(-300, Math.min(300, p[0])), dy: (o.dy || 0) + Math.max(-300, Math.min(300, p[1])) }; n++; } }
    else if (e.op === 'hide' && LASTG[g] && g !== 'title' && g !== 'logo') { S.hide['g_' + g] = true; n++; }
    else if (e.op === 'text' && e.value && typeof S.d[g] === 'string') { S.d[g] = String(e.value).slice(0, 200); n++; }
    else if (e.op === 'accent' && /^#[0-9a-f]{6}$/i.test(e.value || '')) { S.ov.accent = e.value; n++; }
  });
  if (n) { changed6(); buildPanel(); }
  return n;
}
function closeModals() { $$('.modal').forEach(function (m) { m.remove(); }); }

/* ---------- طلب مراجعة وتقييم من إدارة المنصة ---------- */
function requestReview(ai) {
  ai = ai || ED.lastReview || null;
  const png = designPNG(1080);
  const note = el('textarea', { rows: '4', dir: 'auto', placeholder: 'ما الذي تريد رأيهم فيه؟ (الألوان، الخط، وضوح الرسالة…) ومتى تحتاج الرد؟' });
  const withAI = el('input', { type: 'checkbox', checked: !!ai });
  modal({ title: 'طلب مراجعة من إدارة أثر', wide: true, body: [
    el('div', { class: 'rqgrid' }, [el('img', { src: png, alt: 'تصميمك', class: 'rqimg' }), el('div', {}, [
      el('p', { class: 'muted small', text: 'يصل التصميم بجودته الكاملة إلى إدارة المنصة ومشرف برنامجك، فيقيّمونه ويكتبون ملاحظات إعلامية، ويصلك إشعار بالرد.' }),
      el('div', { class: 'fld' }, [el('label', { text: 'ملاحظتك' }), note]),
      ai ? el('label', { class: 'tog' }, [withAI, el('span', { text: 'أرفق تقييم المصمّم الذكي (' + ai.score + '/100)' })]) : null
    ])])
  ], acts: [{ t: 'أرسل للمراجعة', cls: 'dark', keep: true, fn: async function (close) {
    try {
      await API6.me('rv_request', JSON.stringify({ img: png, note: note.value.trim(), program: V6.prog.id, track: S.track.id, tpl: S.tpl.id, item: ED.doc && ED.doc.id || '', ai: ai && withAI.checked ? { score: ai.score, summary: ai.verdict + (ai.issues || []).map(function (x) { return ' · ' + x.title; }).join('') } : null }));
      close(); toast('وصل طلبك. ستجد الرد في «مراجعاتي»'); track('tool', { tool: 'review_request' });
    } catch (e) { toast(e.message); }
  } }, { t: 'إلغاء' }] });
}
// مراجعاتي
// الصفحات الشخصية تُفتح من «حسابي»، فعليها رابط يعيد إليه (في التطبيق زر الرجوع يكفي)
function acCrumb() { return document.body.classList.contains('mapp') ? null : el('a', { class: 'crumb rv', href: '#/account' }, [ico('chev'), 'حسابي']); }
async function showReviews6() {
  document.title = 'مراجعاتي';
  const box = el('div', { class: 'rvlist' });
  view(el('div', { class: 'wrap page' }, [el('div', { class: 'phead' }, [acCrumb(), H('h1', 'مراجعاتي'), el('p', { class: 'muted', text: 'التصاميم التي طلبت فيها رأي إدارة أثر، وردودهم.' })]), box]));
  const sk = loading(box);
  let list; try { list = await API6.me('rv_mine'); } catch (e) { sk.remove(); box.appendChild(el('p', { class: 'err', text: e.message })); return; }
  sk.remove();
  if (!list.length) { box.appendChild(el('div', { class: 'empty' }, [el('p', { text: 'لم تطلب مراجعة بعد. من المحرر: زر «مراجعة» ثم «اطلب مراجعة من إدارة أثر».' })])); return; }
  list.forEach(function (x) { box.appendChild(reviewCard(x, false)); });
}
function reviewCard(x, admin, onDone) {
  const img = el('div', { class: 'rvimg' }, [el('button', { type: 'button', class: 'btn sm line', text: 'اعرض التصميم', onclick: async function (e) { e.currentTarget.disabled = true; try { const u = await API6.me('rv_img', x.id); rc(img, el('img', { src: u, alt: 'التصميم', title: 'اعرضه بحجم كبير', style: 'cursor:zoom-in', onclick: function () { imgViewer(u, x.name ? 'تصميم ' + x.name : 'التصميم'); } }), el('button', { type: 'button', class: 'btn sm tint rvbig', onclick: function () { imgViewer(u, x.name ? 'تصميم ' + x.name : 'التصميم'); } }, [ico('expand'), 'عرض كبير'])); } catch (er) { toast(er.message); } } })]);
  const prog = V6.bundle.programs.find(function (p) { return p.id === x.program; });
  const card = el('div', { class: 'card rvcard' + (x.status === 'done' ? ' done' : '') }, [
    img,
    el('div', { class: 'rvmain' }, [
      el('div', { class: 'row wrapr' }, [el('span', { class: 'pill ' + (x.status === 'done' ? 'gr' : 'bl'), text: x.status === 'done' ? 'رُدّ عليه' : 'ينتظر المراجعة' }), admin ? el('b', { text: x.name }) : null, prog ? el('span', { class: 'tiny', text: prog.name }) : null, el('span', { class: 'tiny', text: fmtTime(x.at) })]),
      x.note ? el('p', { class: 'rvnote', text: '«' + x.note + '»' }) : null,
      x.ai ? el('p', { class: 'tiny muted', text: 'تقييم المصمّم الذكي: ' + x.ai.score + '/100 — ' + x.ai.summary }) : null,
      x.reply ? el('div', { class: 'rvreply' }, [el('div', { class: 'row' }, [el('span', { class: 'rvscore', text: x.reply.score + '/10' }), el('b', { text: 'رأي ' + x.reply.by })]),
        x.reply.points && x.reply.points.length ? el('ul', {}, x.reply.points.map(function (p) { return el('li', { text: p }); })) : null,
        x.reply.notes ? el('p', { text: x.reply.notes }) : null]) : null
    ])
  ]);
  if (admin && x.status !== 'done') {
    let score = 7;
    const sc = el('input', { type: 'range', min: '0', max: '10', step: '1', value: '7', 'aria-label': 'الدرجة', oninput: function (e) { score = +e.target.value; scv.textContent = score + '/10'; } }), scv = el('b', { text: '7/10' });
    const pts = el('textarea', { rows: '3', dir: 'auto', placeholder: 'ملاحظات محددة، كل ملاحظة في سطر (كبّر العنوان، وحّد المحاذاة…)' });
    const notes = el('textarea', { rows: '3', dir: 'auto', placeholder: 'رأي إعلامي عام: الرسالة، الجمهور، التوقيت، المنصة المناسبة…' });
    card.querySelector('.rvmain').appendChild(el('div', { class: 'rvform' }, [el('div', { class: 'row' }, [el('span', { text: 'التقييم' }), sc, scv]), pts, notes,
      el('button', { type: 'button', class: 'btn sm dark', text: 'أرسل المراجعة', onclick: async function () {
        try { await API6.me('rv_reply', x.id, JSON.stringify({ score: score, points: pts.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean), notes: notes.value.trim() })); toast('أُرسلت المراجعة'); if (onDone) onDone(); } catch (e) { toast(e.message); }
      } })]));
  }
  return card;
}
async function aReviews(body) {
  let st = 'new';
  aHead(body, 'مراجعة التصاميم', 'تصاميم طلب أصحابها رأي إدارة أثر. قيّمها واكتب ملاحظات إعلامية تصلهم مع إشعار.', [segOf([['new', 'تنتظر'], ['done', 'رُدّ عليها']], st, function (v) { st = v; fill(); })]);
  const box = el('div', { class: 'rvlist' }); body.appendChild(box);
  async function fill() {
    box.innerHTML = ''; const sk = loading(box);
    let list; try { list = await API6.me('rv_list', st); } catch (e) { sk.remove(); box.appendChild(el('p', { class: 'err', text: e.message })); return; }
    sk.remove();
    if (!list.length) { box.appendChild(el('p', { class: 'empty', text: st === 'new' ? 'لا طلبات تنتظر.' : 'لا شيء بعد.' })); return; }
    list.forEach(function (x) { box.appendChild(reviewCard(x, true, fill)); });
  }
  fill();
}

/* ---------- التعليقات ---------- */
function commentTarget() {
  if (ED.doc && ED.doc.id) return { target: 'item:' + ED.doc.id, title: ED.doc.name || 'التصميم' };
  return { target: 'tpl:' + S.tpl.id, title: 'القالب: ' + S.tpl.name };
}
async function commentsDialog(t) {
  t = t || commentTarget();
  const list = el('div', { class: 'cmlist' }, [loader6('', true)]);
  const ta = el('textarea', { rows: '2', dir: 'auto', placeholder: 'اكتب تعليقك: رأي، فكرة تحسين، سؤال…' });
  const send = async function () {
    const v = ta.value.trim(); if (v.length < 2) { ta.focus(); return; }
    try { const c = await API6.me('cm_add', JSON.stringify({ target: t.target, program: V6.prog.id, text: v })); ta.value = ''; list.querySelector('.empty') && list.querySelector('.empty').remove(); list.appendChild(cmRow(c)); list.scrollTop = list.scrollHeight; setCmCount(1); track('tool', { tool: 'comment' }); } catch (e) { toast(e.message); }
  };
  ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); });
  modal({ title: 'التعليقات', wide: true, body: [el('p', { class: 'tiny muted', text: t.title + ' · يراها أعضاء برنامجك' }), list, el('div', { class: 'cmform' }, [withEmoji(ta), el('button', { type: 'button', class: 'btn dark', onclick: send }, [ico('send'), 'علّق'])])], acts: [{ t: 'إغلاق' }] });
  function cmRow(c) {
    const row = el('div', { class: 'cmrow' + (c.mine ? ' mine' : '') }, [el('div', { class: 'cmav', text: String(c.name || '؟').trim().replace(/^(أ\.|د\.|م\.)\s*/, '').slice(0, 1) }), el('div', { class: 'cmbody' }, [el('div', { class: 'row' }, [el('b', { text: c.name }), el('span', { class: 'tiny', text: fmtTime(c.at) }), el('span', { class: 'sp' }),
      c.canDel ? el('button', { type: 'button', class: 'ib sm', 'aria-label': 'حذف', onclick: async function () { try { await API6.me('cm_del', c.id); row.remove(); setCmCount(-1); } catch (e) { toast(e.message); } } }, [ico('trash')]) : null]), el('p', { text: c.text })])]);
    return row;
  }
  try { const l = await API6.me('cm_list', t.target, V6.prog.id); rc(list, ); if (!l.length) list.appendChild(el('p', { class: 'empty', text: 'لا تعليقات بعد. كن أول من يعلّق.' })); l.forEach(function (c) { list.appendChild(cmRow(c)); }); }
  catch (e) { rc(list, el('p', { class: 'err', text: e.message })); }
}
function setCmCount(d) { const b = $('#e_cm b'); if (!b) return; const n = Math.max(0, (+b.textContent || 0) + d); b.textContent = n ? String(n) : ''; }
async function loadCmCount() {
  const b = $('#e_cm b'); if (!b) return;
  try { const t = commentTarget(), r = await API6.me('cm_counts', [t.target]); b.textContent = r[t.target] ? String(r[t.target]) : ''; } catch (e) {}
}
function reviewMenu(anchor) {
  popMenu(anchor, [{ hd: 'المراجعة والتعليقات' },
    aiReady() ? { t: 'راجعه بالمصمّم الذكي', ic: 'ai', fn: aiReview } : null,
    { t: 'اطلب مراجعة من إدارة أثر', ic: 'review', fn: function () { requestReview(); } },
    { t: 'التعليقات', ic: 'comment', fn: function () { commentsDialog(); } },
    '-', { t: 'مراجعاتي', ic: 'history', href: '#/reviews' }]);
}

/* ---------- الإشعارات ---------- */
let NOTIFS = [];
async function loadNotifs() {
  try { NOTIFS = await API6.me('nt_list'); } catch (e) { NOTIFS = []; }
  const bell = $('#bell'); if (bell && NOTIFS.some(function (x) { return !x.seen; })) bell.classList.add('dot-badge');
}
const NT_IC = { comment: 'comment', review: 'review', week: 'chart', fb: 'flag', tgfail: 'send', tg: 'send', task: 'check', remind: 'bell' };
function notifsBlock() {
  if (!NOTIFS.length) return null;
  const unseen = NOTIFS.some(function (x) { return !x.seen; });
  if (unseen) API6.me('nt_seen').catch(function () {});
  const b = el('article', { class: 'nitem first ntbox' }, [el('h4', { text: 'إشعاراتك' }), el('div', { class: 'ntlist' }, NOTIFS.slice(0, 8).map(function (x) {
    return el('a', { class: 'ntrow' + (x.seen ? '' : ' new'), href: x.link || '#/', onclick: function () { closeModals(); } }, [ico(NT_IC[x.kind] || 'bell'), el('span', { class: 'ntt' }, [el('span', { text: x.text }), x.sum ? el('span', { class: 'ntsum' }, [ico('ai'), x.sum]) : null]), el('small', { class: 'tiny', text: fmtTime(x.at) })]);
  }))]);
  NOTIFS.forEach(function (x) { x.seen = true; });
  return b;
}

/* ---------- أسبوعك في أثر ---------- */
const WK_N = [['exports', 'تنزيلاً', 'download'], ['active', 'أيام نشطة', 'cal'], ['saves', 'حفظاً', 'heart'], ['tools', 'أداة جرّبتها', 'wand'], ['sent', 'منشوراً للقناة', 'send'], ['made', 'بالمصمّم الذكي', 'ai']];
async function weekMiniCard() {
  const box = el('a', { class: 'wkmini rv', href: '#/week', style: '--d:1' }, [el('span', { class: 'eyebrow', text: 'أسبوعك في أثر' }), loader6('', true)]);
  API6.me('me_week').then(function (w) {
    const L = w.live || {};
    rc(box, el('span', { class: 'eyebrow', text: 'أسبوعك في أثر' }),
      el('div', { class: 'wknums' }, WK_N.slice(0, 3).map(function (k) { const n = el('b', { text: '0' }); countUp(n, L[k[0]] || 0, 900); return el('div', {}, [n, el('small', { text: k[1] })]); })),
      w.me && w.me.badges && w.me.badges.length ? el('div', { class: 'wkbadges' }, w.me.badges.slice(0, 3).map(function (b, i) { return el('span', { class: 'wkbadge', style: '--d:' + i, text: b }); })) : null,
      el('p', { class: 'small', text: w.me ? w.me.msg : 'صمّم هذا الأسبوع، وتجد هنا تقييمك يوم السبت.' }),
      el('span', { class: 'tiny wkmore', text: 'تقريرك كاملاً ←' }));
    box.classList.add('in-view');
  }).catch(function () { rc(box, el('span', { class: 'eyebrow', text: 'أسبوعك في أثر' }), el('p', { class: 'small', text: 'تقريرك الأسبوعي يظهر هنا.' })); });
  return box;
}
async function showWeek6() {
  document.title = 'أسبوعك في أثر';
  const box = el('div', { class: 'wkpage' }, [loader6('نجمع أرقام أسبوعك…', true)]);
  view(el('div', { class: 'wrap page' }, [box]));
  let w; try { w = await API6.me('me_week'); } catch (e) { rc(box, el('p', { class: 'err', text: e.message })); return; }
  paintWeek(box, w);
}
function paintWeek(box, w) {
  const me = w.me, L = w.live || {}, nm = firstName(V6.me.name);
  const maxH = Math.max(1, Math.max.apply(null, w.hist.map(function (h) { return h.exports; })));
  const C = me ? tipCat(me.focus) : null, ftip = C ? TIPS.filter(function (t) { return t.c === C.id; })[(new Date().getDate()) % Math.max(1, TIPS.filter(function (t) { return t.c === C.id; }).length)] : null;
  rc(box, 
    el('div', { class: 'wkhero' }, [acCrumb(), el('span', { class: 'eyebrow', text: 'أسبوعك في أثر' }), H('h1', 'أحسنت يا ' + nm),
      el('p', { class: 'muted', text: 'هذا الأسبوع حتى الآن، وتقرير الأسبوع الماضي (' + (w.from || '') + ' — ' + (w.to || '') + ')، يتجدد كل سبت تلقائياً.' })]),
    el('div', { class: 'wkgrid' }, WK_N.map(function (k, i) { const n = el('b', { text: '0' }); countUp(n, L[k[0]] || 0, 1000 + i * 120); const prev = me ? me.c[k[0]] : null; return el('div', { class: 'wkstat rv', style: '--d:' + i }, [ico(k[2]), n, el('small', { text: k[1] }), prev != null ? el('span', { class: 'tiny', text: 'الأسبوع الماضي: ' + prev }) : null]); })),
    me ? el('div', { class: 'wkmsg rv' }, [el('div', { class: 'row' }, [ico('ai'), el('b', { text: (me.byAI ? 'من المصمّم الذكي: ' : '') + 'تقييم الأسبوع الماضي' })]), typeText(el('p', {}), me.msg),
      !me.c.active && L.active ? el('p', { class: 'small', text: 'وهذا الأسبوع بدأت بقوة: ' + L.exports + ' تنزيلاً حتى الآن. واصل!' }) : null,
      me.challenge ? el('div', { class: 'wkch' }, [el('span', { class: 'pill pu', text: 'تحدّي الأسبوع' }), el('span', { text: me.challenge })]) : null]) : el('div', { class: 'wkmsg' }, [el('p', { text: 'أول تقرير لك يصل يوم السبت. صمّم وجرّب الأدوات، وستجد هنا أرقامك وتقييماً يحفّزك.' })]),
    me && me.badges && me.badges.length ? el('div', { class: 'wkbadges big' }, me.badges.map(function (b, i) { return el('span', { class: 'wkbadge', style: '--d:' + i }, [ico('star'), b]); })) : null,
    el('div', { class: 'card wkhist' }, [el('h3', { text: 'تنزيلاتك في آخر الأسابيع' }), el('div', { class: 'wkbars' }, w.hist.map(function (h, i) {
      return el('div', { class: 'wkbar' + (h.live ? ' live' : '') }, [el('i', { style: '--h:' + Math.round(100 * h.exports / maxH) + '%;--d:' + i }), el('b', { text: String(h.exports) }), el('small', { text: h.live ? 'الآن' : h.week.slice(5).replace('-', '/') })]);
    }))]),
    C && ftip ? el('div', { class: 'card wkfocus', style: '--tc:' + C.c }, [tipDemo(C.id), el('div', {}, [el('span', { class: 'tipcat', text: 'ركّز هذا الأسبوع على: ' + C.n }), el('h3', { text: ftip.t }), el('p', { text: ftip.b }), el('a', { class: 'btn sm line', href: '#/tips/' + C.id, text: 'كل نصائح ' + C.n })])]) : null,
    aiReady() ? el('button', { type: 'button', class: 'btn line', onclick: async function (e) { e.currentTarget.disabled = true; try { paintWeek(box, await API6.me('me_week', true)); toast('حُدّث تقريرك'); } catch (er) { toast(er.message); } } }, [ico('reset'), 'حدّث تقريري بالمصمّم الذكي']) : null
  );
  revealAll(box);
}
function typeText(node, text) {
  let i = 0; const s = String(text || ''), step = Math.max(1, Math.round(s.length / 90));
  (function tick() { i = Math.min(s.length, i + step); node.textContent = s.slice(0, i); if (i < s.length) setTimeout(tick, 18); })();
  return node;
}
async function aWeek(body) {
  let prog = '';
  aHead(body, 'أسبوع الفريق', 'تقارير الأسبوع الماضي لأعضاء برامجك، تُبنى تلقائياً كل سبت، ومعها رسالة تحفيزية لكل عضو.', [progSelect(prog, true, function (v) { prog = v; fill(); })]);
  const box = el('div'); body.appendChild(box);
  async function fill() {
    box.innerHTML = ''; const sk = loading(box);
    let r; try { r = await API6.me('wk_admin', prog); } catch (e) { sk.remove(); box.appendChild(el('p', { class: 'err', text: e.message })); return; }
    sk.remove();
    if (!r.rows.length) { box.appendChild(el('p', { class: 'empty', text: 'لا تقرير بعد؛ يُبنى أول تقرير يوم السبت.' })); return; }
    box.appendChild(el('p', { class: 'tiny muted', text: 'الأسبوع: ' + r.from + ' — ' + r.to }));
    box.appendChild(el('div', { class: 'wktable' }, r.rows.map(function (x) {
      return el('div', { class: 'card flat wkrow' }, [el('div', { class: 'row wrapr' }, [el('b', { text: x.name }), el('span', { class: 'pill', text: x.c.exports + ' تنزيل' }), el('span', { class: 'pill', text: x.c.active + ' أيام' }), x.p ? el('span', { class: 'tiny', text: 'قبلها: ' + x.p.exports }) : null].concat((x.badges || []).map(function (b) { return el('span', { class: 'wkbadge sm', text: b }); }))), el('p', { class: 'small muted', text: x.msg })]);
    })));
  }
  fill();
}

/* ---------- مهارات المساعد في لوحة الإدارة ---------- */
const SKILL_KINDS = [['review', 'مراجعة التصميم'], ['design', 'اقتراح تصاميم'], ['creative', 'دعه يبدع'], ['intake', 'فهم الفكرة'], ['caption', 'النص المصاحب'], ['outline', 'مخطط العرض'], ['spell', 'التصحيح'], ['imgq', 'كلمات الصور'], ['week', 'تقرير الأسبوع'], ['*', 'كل المهام']];
async function aiSkillsCard(body) {
  const card = el('div', { class: 'card skills' }, [el('span', { class: 'icon-tile t-pu' }, [ico('book')]), el('h3', { text: 'مهارات المساعد' }),
    el('p', { class: 'small muted', text: 'المهارة معرفة مكتوبة تُضاف تلقائياً إلى تعليمات المساعد في المهام التي تختارها: مبادئ التصميم، وقواعد الخط العربي، وأسلوب القناة، وغيرها. عدّلها أو أضف مهارات خاصة ببرامجك، فيتحسن أداؤه دون أي برمجة.' })]);
  body.appendChild(card);
  let list; try { list = await API6.me('ai_skills'); } catch (e) { card.appendChild(el('p', { class: 'err', text: e.message })); return; }
  const box = el('div', { class: 'sklist' }); card.appendChild(box);
  list.forEach(function (s) {
    box.appendChild(el('details', { class: 'skrow' + (s.on === false ? ' off' : '') }, [el('summary', {}, [el('b', { text: s.name }), el('span', { class: 'tiny', text: (s.kinds || []).map(function (k) { return (SKILL_KINDS.find(function (x) { return x[0] === k; }) || [k, k])[1]; }).join('، ') }), s.builtin ? el('span', { class: 'pill', text: s.edited ? 'أساسية معدّلة' : 'أساسية' }) : el('span', { class: 'pill pu', text: 'مضافة' }), s.on === false ? el('span', { class: 'pill', text: 'متوقفة' }) : null]),
      isSuper() ? skillForm(s) : el('pre', { class: 'sktext', text: s.text })]));
  });
  if (isSuper()) card.appendChild(el('button', { type: 'button', class: 'btn sm line', onclick: function () { box.appendChild(el('div', { class: 'skrow' }, [skillForm({ name: '', kinds: ['design'], text: '', on: true })])); } }, [ico('plus'), 'أضف مهارة']));
}
function skillForm(s) {
  const name = el('input', { type: 'text', class: 'inp sm', value: s.name || '', placeholder: 'اسم المهارة' });
  const kinds = (s.kinds || []).slice();
  const chips = el('div', { class: 'row wrapr' }, SKILL_KINDS.map(function (k) { return el('button', { type: 'button', class: 'chip' + (kinds.indexOf(k[0]) >= 0 ? ' on' : ''), onclick: function (e) { const i = kinds.indexOf(k[0]); if (i >= 0) kinds.splice(i, 1); else kinds.push(k[0]); e.currentTarget.classList.toggle('on'); } }, [k[1]]); }));
  const text = el('textarea', { rows: '7', dir: 'auto', placeholder: 'اكتب المعرفة كما تكتب لمصمم جديد: قواعد، أمثلة، ما يُفعل وما يُتجنب. سطر لكل قاعدة.' }); text.value = s.text || '';
  const on = el('input', { type: 'checkbox', checked: s.on !== false });
  return el('div', { class: 'skform' }, [name, chips, text, el('div', { class: 'row wrapr' }, [el('label', { class: 'tog' }, [on, el('span', { text: 'مفعّلة' })]), el('span', { class: 'sp' }),
    s.builtin && s.edited ? el('button', { type: 'button', class: 'btn sm line', text: 'أعدها إلى الأصل', onclick: async function () { try { await API6.me('ai_skill_reset', s.id); toast('أُعيدت'); showAdmin('ai'); } catch (e) { toast(e.message); } } }) : null,
    !s.builtin && s.id ? el('button', { type: 'button', class: 'btn sm line', text: 'احذف', onclick: async function () { try { await API6.me('ai_skill_save', JSON.stringify({ id: s.id, name: s.name, deleted: true })); showAdmin('ai'); } catch (e) { toast(e.message); } } }) : null,
    el('button', { type: 'button', class: 'btn sm dark', text: 'احفظ', onclick: async function () { if (!name.value.trim() || text.value.trim().length < 10) { toast('اكتب الاسم ونص المهارة'); return; } try { await API6.me('ai_skill_save', JSON.stringify({ id: s.id, name: name.value.trim(), kinds: kinds, text: text.value.trim(), on: on.checked })); toast('حُفظت المهارة'); showAdmin('ai'); } catch (e) { toast(e.message); } } })])]);
}

/* عارض صورة بملء الشاشة: يملأ الشاشة بلا قصّ، ونقرة (أو زر) تكبّره إلى حجمه الحقيقي مع التحريك، وEsc أو ✕ للإغلاق */
function imgViewer(src, title) {
  $$('.imgview').forEach(function (x) { x.remove(); });
  const im = el('img', { src: src, alt: title || '' });
  const stage = el('div', { class: 'ivstage' }, [im]);
  let full = false;
  const zoomBtn = el('button', { type: 'button', class: 'ib', 'aria-label': 'تكبير', title: 'الحجم الحقيقي', onclick: function () { toggle(); } }, [ico('zoomin')]);
  function toggle(e) { full = !full; wrap.classList.toggle('full', full); rc(zoomBtn, ico(full ? 'zoomout' : 'zoomin')); if (full && e) { const r = im.getBoundingClientRect(); requestAnimationFrame(function () { stage.scrollLeft = (e.clientX - r.left) / r.width * stage.scrollWidth - stage.clientWidth / 2; stage.scrollTop = (e.clientY - r.top) / r.height * stage.scrollHeight - stage.clientHeight / 2; }); } }
  im.addEventListener('click', function (e) { e.stopPropagation(); toggle(e); });
  const close = function () { wrap.classList.remove('on'); document.removeEventListener('keydown', key); setTimeout(function () { wrap.remove(); }, 250); };
  const key = function (e) { if (e.key === 'Escape') close(); };
  const wrap = el('div', { class: 'imgview', role: 'dialog', 'aria-label': title || 'عرض الصورة' }, [
    el('div', { class: 'ivbar' }, [el('b', { text: title || '' }), el('span', { class: 'sp' }), zoomBtn, el('a', { class: 'ib', href: src, download: (title || 'design') + '.png', 'aria-label': 'تنزيل', title: 'تنزيل' }, [ico('download')]), el('button', { type: 'button', class: 'ib', 'aria-label': 'إغلاق', onclick: close }, [ico('close')])]),
    stage]);
  stage.addEventListener('click', function (e) { if (e.target === stage) close(); });
  document.addEventListener('keydown', key);
  document.body.appendChild(wrap); requestAnimationFrame(function () { wrap.classList.add('on'); });
}
