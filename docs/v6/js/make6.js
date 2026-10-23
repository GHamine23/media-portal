/* ================= اصنع إعلانك: اكتب فكرتك، فيقترح المساعد تصاميم من قوالب هويتك ================= */
const MAKE_TYPES = [['ann', 'إعلان فعالية'], ['comp', 'مسابقة'], ['thanks', 'تهنئة وشكر'], ['quote', 'عبارة وتذكير'], ['daily', 'المقرر اليومي'], ['cover', 'غلاف وجدول'], ['yt', 'غلاف يوتيوب'], ['social', 'مواقع التواصل']];
let MK = { type: 'ann', tid: '', text: '', date: '', results: [] };
function aiReady() { const a = V6.settings && V6.settings.ai; return !!(a && a.enabled && a.ready && can('ai')); }

function showMake6() {
  document.title = 'اصنع إعلانك';
  const saved = ls('make'); if (saved) MK = Object.assign(MK, saved, { results: [] });
  const tracks = tracksOf();
  if (!tracks.length) { view(el('div', { class: 'wrap page' }, [H('h1', 'اصنع إعلانك'), el('p', { class: 'muted', text: 'أضف هوية البرنامج أولاً.' })])); return; }
  if (!TRACKS[MK.tid]) MK.tid = ls('lastTrack') && TRACKS[ls('lastTrack')] ? ls('lastTrack') : tracks[0].id;
  const types = MAKE_TYPES.filter(function (t) { return t[0] !== 'social' || canSocial(); });
  if (!types.some(function (t) { return t[0] === MK.type; })) MK.type = 'ann';
  const ai = aiReady();
  const ta = el('textarea', { id: 'mk_text', rows: '4', dir: 'auto', placeholder: 'مثال: لقاء أسري بعنوان «بيوت مطمئنة» يقدّمه الشيخ فلان، مساء الخميس القادم بعد العشاء في مسجد الحي' });
  ta.value = MK.text || '';
  ta.addEventListener('input', function () { MK.text = ta.value; ls('make', { type: MK.type, tid: MK.tid, text: MK.text, date: MK.date }); });
  const dateI = el('input', { type: 'date', id: 'mk_date', value: MK.date || '', onchange: function (e) { MK.date = e.target.value; ls('make', { type: MK.type, tid: MK.tid, text: MK.text, date: MK.date }); } });
  const idSel = el('select', { id: 'mk_tid', onchange: function (e) { MK.tid = e.target.value; } }, tracks.map(function (t) { return el('option', { value: t.id, text: t.full.replace('ـ', ''), selected: t.id === MK.tid }); }));
  const out = el('div', { class: 'mkout', id: 'mkout' });
  const btn = el('button', { type: 'submit', class: 'btn dark lg' }, [ico('ai'), ai ? 'اصنع التصاميم' : 'اقترح التصاميم']);
  const form = el('form', { class: 'mkform card rv', onsubmit: function (e) { e.preventDefault(); run(); } }, [
    el('div', { class: 'fld' }, [el('label', { for: 'mk_text', text: 'صف إعلانك بكلماتك' }), ta, el('small', { text: ai ? 'اكتب ما تعرفه: العنوان، والمقدّم، والموعد، والمكان. وما لا تذكره يبقى خانة تكملها أنت. لا تكتب بيانات شخصية للطلاب.' : 'المساعد الذكي غير مفعّل لحسابك بعد، فنوزّع ما تكتبه على القوالب بقواعد بسيطة: اكتب كل معلومة في سطر.' })]),
    el('div', { class: 'row wrapr mkopts' }, [
      el('div', { class: 'fld' }, [el('label', { text: 'النوع' }), segOf(types, MK.type, function (v) { MK.type = v; ls('make', { type: MK.type, tid: MK.tid, text: MK.text, date: MK.date }); })]),
      el('div', { class: 'fld' }, [el('label', { for: 'mk_tid', text: 'الهوية' }), idSel]),
      el('div', { class: 'fld' }, [el('label', { for: 'mk_date', text: 'التاريخ (اختياري)' }), dateI])
    ]),
    el('div', { class: 'row' }, [btn, ai ? el('span', { class: 'tiny', id: 'mk_quota' }) : null])
  ]);
  view(el('div', { class: 'wrap page' }, [
    el('div', { class: 'phead' }, [el('span', { class: 'eyebrow rv', text: ai ? 'بمساعدة الذكاء الاصطناعي' : 'من معلوماتك' }), H('h1', 'اصنع إعلانك'), el('p', { class: 'muted rv', style: '--d:2', text: 'اكتب فكرتك، ونقترح تصاميم جاهزة بهوية برنامجك، كلها قابلة للتعديل.' })]),
    form, out
  ]));
  if (ai) API6.me('ai_status').then(function (s) { const q = $('#mk_quota'); if (q && s.perDay) q.textContent = 'استعملت ' + s.used + ' من ' + s.perDay + ' اليوم'; }).catch(function () {});
  async function run() {
    if (ta.value.trim().length < 6) { toast('اكتب وصف الإعلان أولاً'); ta.focus(); return; }
    btn.disabled = true; out.innerHTML = '';
    out.appendChild(el('div', { class: 'mkwait' }, [el('span', { class: 'spin' }), el('p', { class: 'muted', text: ai ? 'يقرأ المساعد فكرتك ويختار القوالب…' : 'نجهّز التصاميم…' })]));
    let res;
    try { res = ai ? await makeAI(ta.value, MK.type, MK.tid, MK.date) : makeLocal(ta.value, MK.type, MK.tid, MK.date); }
    catch (e) { out.innerHTML = ''; out.appendChild(el('p', { class: 'err', text: e.message })); if (ai) { out.appendChild(el('button', { type: 'button', class: 'btn line', text: 'اقترح دون المساعد', onclick: function () { showResults(makeLocal(ta.value, MK.type, MK.tid, MK.date)); } })); } btn.disabled = false; return; }
    btn.disabled = false; showResults(res);
    track('make', { tool: ai ? 'ai' : 'local' });
  }
  function showResults(res) {
    out.innerHTML = '';
    const T = trackOf(MK.tid);
    if (res.missing && res.missing.length) out.appendChild(el('div', { class: 'card flat mkask rv' }, [el('b', { text: 'لإكمال الإعلان:' }), el('ul', {}, res.missing.map(function (m) { return el('li', { text: m }); })), el('p', { class: 'tiny', text: 'أضفها إلى وصفك ثم أعد المحاولة، أو اكتبها في التصميم مباشرة.' })]));
    out.appendChild(H('h2', 'اختر الأقرب إليك'));
    const grid = el('div', { class: 'tgrid' }); out.appendChild(grid);
    res.designs.forEach(function (dz, i) {
      const tpl = TEMPLATES.find(function (t) { return t.id === dz.tpl; }); if (!tpl) return;
      grid.appendChild(el('button', { type: 'button', class: 'tcard6 hover-lift rv', style: '--d:' + (i % 8), onclick: function () {
        ls('makePick', { tid: T.id, page: dz.page }); go('#/e/' + T.id + '/' + tpl.id + '?make');
      } }, [el('div', { class: 'tthumb' }, [tplThumb(tpl, T, dz.page.size, 300, dz.page)]), el('div', { class: 'tmeta6' }, [el('b', { text: tpl.name }), el('span', { class: 'tiny', text: dz.note || '' })])]));
    });
    revealAll(out);
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ---------- صفحة قالب من معلومات موحّدة ---------- */
// info: {kind, title, sub, who, place, time, date, body, name, num}
function pageFromInfo(tpl, T, info, fields, palette) {
  const pg = newPage(tpl, T, true);
  const tk = info.date ? (function () { const p = info.date.split('-').map(Number); return p.length === 3 && p[0] ? dateTokens(new Date(p[0], p[1] - 1, p[2], 12), 0) : null; })() : null;
  const I = Object.assign({}, info, { date: info.date || '' });
  // خريطة الإصدار الخامس من المعلومات إلى خانات القالب
  if (WIZ[tpl.id]) { const m = WIZ[tpl.id](I, tk); Object.keys(m).forEach(function (k) { if (k in pg.d && has(m[k])) { pg.d[k] = m[k]; delete pg.ph[k]; } }); }
  else tpl.fields.forEach(function (f) { if (f.k && has(info[f.k]) && typeof pg.d[f.k] === 'string') { pg.d[f.k] = info[f.k]; delete pg.ph[f.k]; } });
  // خانات التاريخ تُملأ من التاريخ إن وُجد
  if (tk) tpl.fields.forEach(function (f) { if (f.kind === 'date' && f.map) Object.keys(f.map).forEach(function (k) { pg.d[k] = f.map[k].replace(/\{(\w+)\}/g, function (_, t) { return tk[t] || ''; }); delete pg.ph[k]; }); });
  (fields || []).forEach(function (q) { if (q && q.k in pg.d && typeof pg.d[q.k] === 'string' && has(q.v)) { pg.d[q.k] = String(q.v).slice(0, 400); delete pg.ph[q.k]; } });
  if (palette) pg.ov = palette;
  return pg;
}
function tplsForType(type) { return visibleTpls().filter(function (t) { return type === 'social' ? (t.type === 'social' || t.sizes.indexOf('story') >= 0) : t.type === type; }); }
// بلا ذكاء اصطناعي: كل سطر معلومة، ونخمّن نوعها
function makeLocal(text, type, tid, date) {
  const T = trackOf(tid), lines = text.split(/\n|،|؛/).map(function (s) { return s.trim(); }).filter(Boolean);
  const info = { title: lines[0] || '', date: date || '' };
  lines.slice(1).forEach(function (l) {
    if (/^(أ\.|د\.|الشيخ|الأستاذ|الأستاذة|م\.|يقدم|تقدم|المقدم)/.test(l)) info.who = l.replace(/^(يقدمه|يقدّمه|تقدمه|المقدم:?)\s*/, '');
    else if (/[0-9٠-٩]{1,2}[:٫.][0-9٠-٩]{2}|مساء|صباح|بعد (العشاء|المغرب|العصر|الفجر|الظهر)/.test(l)) info.time = l;
    else if (/زوم|مسجد|قاعة|مركز|عبر|في /.test(l)) info.place = l;
    else if (!info.sub) info.sub = l; else info.body = (info.body ? info.body + '\n' : '') + l;
  });
  info.name = info.title; info.body = info.body || info.sub;
  const designs = [];
  tplsForType(type).slice(0, 12).forEach(function (tpl) {
    const page = pageFromInfo(tpl, T, info, null, null); page.size = sizesFor(tpl)[0];
    designs.push({ tpl: tpl.id, page: page, note: tpl.variants[0].name });
    const pals = genPalettes(tpl, T).filter(function (p) { return p.bg !== T.c.paper; });
    if (pals[0]) { const p2 = pageFromInfo(tpl, T, info, null, pals[0]); p2.size = page.size; designs.push({ tpl: tpl.id, page: p2, note: 'ألوان أخرى' }); }
  });
  return { designs: designs, missing: [] };
}
// بالمساعد: نرسل وصف القوالب، ويعيد المعلومات منظّمة واختياره من القوالب
async function makeAI(text, type, tid, date) {
  const T = trackOf(tid), list = tplsForType(type).slice(0, 24);
  const today = new Date(), iso = today.toISOString().slice(0, 10);
  const wd = new Intl.DateTimeFormat('ar', { weekday: 'long' }).format(today);
  const catalog = list.map(function (t) { return { id: t.id, name: t.name, tags: t.tags || '', fields: t.fields.filter(function (f) { return f.k && (!f.kind || f.kind === 'area' || f.kind === 'text'); }).map(function (f) { return f.k + ': ' + f.label + (f.max ? ' (حتى ' + f.max + ' حرفاً)' : ''); }) }; });
  const system = [
    'أنت مصمم إعلانات لبرنامج تربوي عربي. تختار من قوالب جاهزة فقط، وتكتب نصوصاً عربية فصيحة قصيرة وأنيقة تناسب الإعلانات.',
    'القواعد: لا تخترع تاريخاً ولا اسماً ولا مكاناً ولا وقتاً لم يُذكر؛ اترك ما لم يُذكر فارغاً واذكره في missing.',
    'اكتب العنوان قصيراً جذاباً (٢-٥ كلمات)، ويمكنك تمييز كلمة مهمة بوضعها بين *نجمتين*.',
    'التاريخ بصيغة YYYY-MM-DD إن أمكن حسابه من الوصف. اليوم ' + wd + ' ' + iso + (date ? '، والمستخدم حدّد التاريخ ' + date : '') + '.',
    'اختر من ٤ إلى ٦ قوالب مختلفة الأشكال تناسب الإعلان، ولكل قالب املأ خاناته بما يناسب حدودها.',
    'القوالب المتاحة (المعرّف، الاسم، الخانات):', JSON.stringify(catalog)
  ].join('\n');
  const schema = { type: 'OBJECT', properties: {
    info: { type: 'OBJECT', properties: { kind: { type: 'STRING' }, title: { type: 'STRING' }, sub: { type: 'STRING' }, who: { type: 'STRING' }, place: { type: 'STRING' }, time: { type: 'STRING' }, date: { type: 'STRING' }, body: { type: 'STRING' }, name: { type: 'STRING' } }, required: ['title'] },
    designs: { type: 'ARRAY', items: { type: 'OBJECT', properties: { tpl: { type: 'STRING' }, why: { type: 'STRING' }, fields: { type: 'ARRAY', items: { type: 'OBJECT', properties: { k: { type: 'STRING' }, v: { type: 'STRING' } }, required: ['k', 'v'] } } }, required: ['tpl', 'fields'] } },
    missing: { type: 'ARRAY', items: { type: 'STRING' } }
  }, required: ['info', 'designs', 'missing'] };
  const raw = await API6.call('ai_make', V6.token, JSON.stringify({ system: system, prompt: text, schema: schema, temperature: 0.8 }));
  let r; try { r = JSON.parse(raw); } catch (e) { throw new Error('لم يفهم المساعد الطلب. أعد صياغته.'); }
  const info = r.info || {}; if (date) info.date = date;
  const designs = [];
  (r.designs || []).forEach(function (dz) {
    const tpl = list.find(function (t) { return t.id === dz.tpl; }); if (!tpl) return;
    const page = pageFromInfo(tpl, T, info, dz.fields, null); page.size = sizesFor(tpl)[0];
    designs.push({ tpl: tpl.id, page: page, note: dz.why || '' });
    const pals = genPalettes(tpl, T).filter(function (p) { return p.bg !== T.c.paper; });
    if (pals.length) { const p2 = pageFromInfo(tpl, T, info, dz.fields, pals[designs.length % pals.length]); p2.size = page.size; designs.push({ tpl: tpl.id, page: p2, note: 'ألوان أخرى' }); }
  });
  if (!designs.length) throw new Error('لم يختر المساعد قالباً مناسباً. جرّب نوعاً آخر أو وصفاً أوضح.');
  return { designs: designs, missing: r.missing || [] };
}
