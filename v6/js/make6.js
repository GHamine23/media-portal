/* ================= المصمّم الذكي: فكرة بكلماتك، ثم أسئلة قصيرة فيما نقص، ثم نتائج كثيرة من القوالب ومن تصاميم حرة بهوية البرنامج =================
   بلا مساعد ذكي: الأسئلة نفسها، وقواعد محلية تملأ القوالب وتولّد تخطيطات حرة. */
const MAKE_TYPES = [['ann', 'إعلان فعالية'], ['comp', 'مسابقة'], ['thanks', 'تهنئة وشكر'], ['quote', 'عبارة وتذكير'], ['daily', 'المقرر اليومي'], ['cover', 'غلاف وجدول'], ['yt', 'غلاف يوتيوب'], ['social', 'مواقع التواصل']];
const MK_AUD = [['students', 'الطلاب'], ['parents', 'أولياء الأمور'], ['staff', 'المربون والفريق'], ['all', 'الجميع']];
const MK_TONE = [['calm', 'هادئة'], ['bold', 'حماسية'], ['formal', 'رسمية'], ['warm', 'دافئة وقريبة'], ['spirit', 'روحانية']];
const MK_SIZE = [['post', 'منشور'], ['square', 'مربع'], ['story', 'قصة'], ['yt', 'غلاف يوتيوب'], ['banner', 'غلاف استمارة']];
const DIRECTIONS = [['calm', 'هادئ', 'مساحات بيضاء واسعة، لون واحد غامق للعنوان، زخرفة قليلة'], ['bold', 'جريء', 'خلفية داكنة أو ملوّنة بالكامل، عنوان ضخم، تباين قوي'], ['classic', 'كلاسيكي', 'إطار وتوازن متماثل، عناصر مرتبة في الوسط، وقار']];
let MK = { text: '', tid: '', type: '', aud: '', tone: '', size: '', who: '', time: '', place: '', date: '', title: '', creative: false, results: null, dir: 0 };
function aiReady() { const a = V6.settings && V6.settings.ai; return !!(a && a.enabled && a.ready && can('ai')); }
function mkSave() { ls('make', { text: MK.text, tid: MK.tid, type: MK.type, aud: MK.aud, tone: MK.tone, size: MK.size, who: MK.who, time: MK.time, place: MK.place, date: MK.date, title: MK.title, creative: MK.creative }); }

function showMake6() {
  document.title = 'المصمّم الذكي';
  const saved = ls('make'); if (saved) MK = Object.assign(MK, saved, { results: null });
  const tracks = tracksOf();
  if (!tracks.length) { view(el('div', { class: 'wrap page' }, [H('h1', 'المصمّم الذكي'), el('p', { class: 'muted', text: 'أضف هوية البرنامج أولاً.' })])); return; }
  const qs = location.hash.split('?')[1] || '', qTid = /tid=([a-z0-9_\-]+)/.exec(qs); if (qTid && TRACKS[qTid[1]]) MK.tid = qTid[1];
  if (/creative=1/.test(qs)) MK.creative = true;
  if (!TRACKS[MK.tid]) MK.tid = ls('lastTrack') && TRACKS[ls('lastTrack')] ? ls('lastTrack') : tracks[0].id;
  if (!canSocial() && MK.type === 'social') MK.type = '';
  MK.step = 'idea'; MK.results = null;
  renderMake();
}
function renderMake() {
  const ai = aiReady();
  const head = el('div', { class: 'phead' }, [el('span', { class: 'eyebrow rv', text: ai ? 'بمساعدة الذكاء الاصطناعي' : 'المساعد الذكي غير مفعّل، فنعمل بالقواعد المحلية' }), H('h1', 'المصمّم الذكي')]);
  const body = el('div', { id: 'mkbody' });
  view(el('div', { class: 'wrap page mk' }, [head, body]));
  if (MK.step === 'idea') mkIdea(body); else if (MK.step === 'ask') mkAsk(body); else mkResults(body);
}

/* ---------- ١) الفكرة ---------- */
function mkIdea(body) {
  const tracks = tracksOf(), ai = aiReady();
  const ta = el('textarea', { id: 'mk_text', rows: '4', dir: 'auto', placeholder: 'مثال: لقاء أسري بعنوان «بيوت مطمئنة» يقدّمه الشيخ فلان، مساء الخميس القادم بعد العشاء في مسجد الحي' });
  ta.value = MK.text || '';
  ta.addEventListener('input', function () { MK.text = ta.value; mkSave(); });
  const idSel = el('select', { id: 'mk_tid', onchange: function (e) { MK.tid = e.target.value; mkSave(); } }, tracks.map(function (t) { return el('option', { value: t.id, text: t.full.replace('ـ', ''), selected: t.id === MK.tid }); }));
  const go1 = async function (creative) {
    if (!creative && ta.value.trim().length < 4) { toast('اكتب فكرتك بكلمتين على الأقل، أو اضغط «دعه يبدع»'); ta.focus(); return; }
    MK.creative = creative; MK.text = ta.value.trim(); mkSave();
    body.innerHTML = ''; body.appendChild(el('div', { class: 'boot' }, [loader6(ai ? 'يقرأ المساعد فكرتك…' : 'نقرأ فكرتك…')]));
    try { await mkIntake(); } catch (e) { toast(e.message); }
    MK.step = 'ask'; renderMake();
  };
  body.appendChild(el('div', { class: 'card mkform rv' }, [
    el('div', { class: 'fld' }, [el('label', { for: 'mk_text', text: 'ما الذي تريد تصميمه؟ اكتبه بكلماتك' }), ta, el('small', { text: 'اكتب ما تعرفه: الموضوع، والمقدّم، والموعد، والمكان. وما لا تذكره نسألك عنه أو نتركه خانة تكملها. لا تكتب بيانات شخصية للطلاب.' })]),
    el('div', { class: 'row wrapr mkopts' }, [el('div', { class: 'fld' }, [el('label', { for: 'mk_tid', text: 'الهوية' }), idSel])]),
    el('div', { class: 'row wrapr' }, [el('button', { type: 'button', class: 'btn dark lg', onclick: function () { go1(false); } }, [ico('ai'), 'التالي']), el('button', { type: 'button', class: 'btn line lg', onclick: function () { go1(true); } }, [ico('wand'), 'دعه يبدع']), ai ? el('span', { class: 'tiny', id: 'mk_quota' }) : null])
  ]));
  if (ai) API6.me('ai_status').then(function (s) { const q = $('#mk_quota'); if (q && s.perDay) q.textContent = 'استعملت ' + s.used + ' من ' + s.perDay + ' اليوم'; }).catch(function () {});
  setTimeout(function () { ta.focus(); }, 200);
}
// استخراج ما في الفكرة: بالمساعد إن وُجد، وإلا بالقواعد
async function mkIntake() {
  const t = MK.text || '';
  ['type', 'aud', 'tone', 'size', 'who', 'time', 'place', 'date', 'title'].forEach(function (k) { MK[k] = ''; });
  if (!t) return;
  // قواعد محلية أولاً (تعمل دائماً)
  const g = mkGuess(t); Object.keys(g).forEach(function (k) { if (g[k]) MK[k] = g[k]; });
  if (!aiReady()) return;
  const schema = { type: 'OBJECT', properties: { type: { type: 'STRING' }, audience: { type: 'STRING' }, tone: { type: 'STRING' }, size: { type: 'STRING' }, title: { type: 'STRING' }, who: { type: 'STRING' }, time: { type: 'STRING' }, place: { type: 'STRING' }, date: { type: 'STRING' } }, required: ['type'] };
  const system = ['أنت تستخرج معلومات من وصف إعلان لبرنامج تربوي عربي. أعد JSON فقط.',
    'type واحد من: ' + MAKE_TYPES.map(function (x) { return x[0] + ' (' + x[1] + ')'; }).join('، ') + '.',
    'audience واحد من: students, parents, staff, all، أو فارغ إن لم يُذكر. tone واحد من: calm, bold, formal, warm, spirit أو فارغ إن لم يتضح. size واحد من: post, square, story, yt, banner أو فارغ.',
    'title عنوان قصير جذاب من ٢ إلى ٥ كلمات مستخلص من الوصف (يمكن تمييز كلمة بين *نجمتين*). who المقدّم كما ذُكر. time اليوم والوقت كما ذُكر. place المكان أو المنصة. date بصيغة YYYY-MM-DD إن أمكن حسابه (اليوم ' + new Date().toISOString().slice(0, 10) + ').',
    'لا تخترع شيئاً لم يُذكر: اتركه فارغاً.'].join('\n');
  const raw = await API6.call('ai_make', V6.token, JSON.stringify({ kind: 'intake', program: V6.prog.id, system: system, prompt: t, schema: schema, temperature: 0.2 }));
  let r; try { r = JSON.parse(raw); } catch (e) { return; }
  const ok = function (list, v) { return list.some(function (x) { return x[0] === v; }) ? v : ''; };
  MK.type = ok(MAKE_TYPES, r.type) || MK.type; MK.aud = ok(MK_AUD, r.audience) || MK.aud; MK.tone = ok(MK_TONE, r.tone) || MK.tone; MK.size = ok(MK_SIZE, r.size) || MK.size;
  ['title', 'who', 'time', 'place'].forEach(function (k) { if (r[k] && String(r[k]).trim()) MK[k] = String(r[k]).trim().slice(0, 80); });
  if (/^\d{4}-\d{2}-\d{2}$/.test(r.date || '')) MK.date = r.date;
}
function mkGuess(t) {
  const o = {};
  if (/مسابق/.test(t)) o.type = 'comp'; else if (/تهنئ|شكر|مبارك|تخرج|فوز|فاز/.test(t)) o.type = 'thanks'; else if (/عبارة|تذكير|اقتباس|حديث|آية/.test(t)) o.type = 'quote'; else if (/مقرر|قراءة ص|صفحة/.test(t)) o.type = 'daily'; else if (/جدول|غلاف/.test(t)) o.type = 'cover'; else if (/يوتيوب|فيديو/.test(t)) o.type = 'yt'; else if (/قصة|ستوري|انستا|تويتر|منشور/.test(t)) o.type = 'social'; else if (/لقاء|ورشة|محاضرة|دورة|مجلس|درس|ملتقى|اختبار|حفل/.test(t)) o.type = 'ann';
  if (/أولياء|الآباء|الأمهات/.test(t)) o.aud = 'parents'; else if (/المرب|الفريق|المشرف/.test(t)) o.aud = 'staff'; else if (/الطلاب|الطالبات|الأبناء/.test(t)) o.aud = 'students';
  if (/قصة|ستوري/.test(t)) o.size = 'story'; else if (/يوتيوب/.test(t)) o.size = 'yt'; else if (/استمارة|نموذج/.test(t)) o.size = 'banner';
  const m1 = /(?:يقدمه|يقدّمه|تقدمه|تقدّمه|تقدمها|تقدّمها|يقدمها|يقدم|يقدّم|تقدم|تقدّم|يلقيه|يلقيها|بإشراف|مع)\s+((?:الشيخ|الشيخة|الأستاذ|الأستاذة|الدكتور|الدكتورة|المربي|المربية|أ\.|د\.)\s*[^،.\n]{2,30}?)(?=\s+(?:مساء|صباح|يوم|في|عبر|بعد|الساعة|القادم|السبت|الأحد|الاثنين|الإثنين|الثلاثاء|الأربعاء|الخميس|الجمعة)|[،.\n]|$)/.exec(t); if (m1) o.who = m1[1].trim();
  const m2 = /((?:يوم\s+)?(?:السبت|الأحد|الاثنين|الإثنين|الثلاثاء|الأربعاء|الخميس|الجمعة)(?:\s+(?:القادم|المقبل))?(?:\s+(?:الساعة\s+)?[0-9٠-٩]{1,2}[:٫.][0-9٠-٩]{2}\s*(?:م|ص|مساءً|صباحاً)?|\s+(?:مساءً|مساء|صباحاً|صباحا|بعد\s+(?:العشاء|المغرب|العصر|الظهر|الفجر)))?)/.exec(t); if (m2) o.time = m2[1].trim();
  const m2b = /((?:مساء|صباح)\s+(?:السبت|الأحد|الاثنين|الإثنين|الثلاثاء|الأربعاء|الخميس|الجمعة)(?:\s+(?:القادم|المقبل))?(?:\s+(?:بعد\s+(?:العشاء|المغرب|العصر|الظهر|الفجر)|[0-9٠-٩]{1,2}[:٫.][0-9٠-٩]{2}))?)/.exec(t); if (!o.time && m2b) o.time = m2b[1].trim();
  const m3 = /(?:في|عبر|على)\s+((?:مسجد|قاعة|مركز|زوم|غوغل ميت|ميت|القناة|المنصة|مقر)[^،.\n]{0,25})/.exec(t); if (m3) o.place = m3[1].trim();
  const q = /[«"]([^»"]{3,40})[»"]/.exec(t); if (q) o.title = q[1];
  return o;
}

/* ---------- ٢) الأسئلة المتكيّفة: فقط ما لم يُعرف ---------- */
function mkQuestions() {
  const qs = [];
  if (!MK.type) qs.push({ k: 'type', q: 'ما نوع التصميم؟', opts: MAKE_TYPES.filter(function (t) { return t[0] !== 'social' || canSocial(); }) });
  if (MK.creative) return qs;   // «دعه يبدع»: يكتفي بالنوع
  if (!MK.aud) qs.push({ k: 'aud', q: 'لمن هذا الإعلان؟', opts: MK_AUD });
  if (!MK.tone) qs.push({ k: 'tone', q: 'أي نبرة تناسبه؟', opts: MK_TONE });
  if (!MK.size) qs.push({ k: 'size', q: 'أين سيُنشر؟ (المقاس)', opts: MK_SIZE.filter(function (s) { return s[0] !== 'story' || canSocial(); }) });
  const miss = ['who', 'time', 'place'].filter(function (k) { return !MK[k]; });
  if (miss.length && MK.type !== 'quote' && MK.type !== 'thanks') qs.push({ k: 'details', q: 'معلومات تكمل الإعلان (اتركها فارغة إن لم تكن)', fields: miss });
  return qs.slice(0, 6);
}
function mkAsk(body) {
  const qs = mkQuestions();
  if (!qs.length) { mkGenerate(body); return; }
  let i = 0;
  const box = el('div', { class: 'card mkwiz rv' }); body.appendChild(box);
  const known = el('div', { class: 'row wrapr mkknown' }); body.appendChild(known);
  function knownChips() {
    known.innerHTML = '';
    const lab = { type: 'النوع', aud: 'الجمهور', tone: 'النبرة', size: 'المقاس', who: 'المقدّم', time: 'الوقت', place: 'المكان', title: 'العنوان' };
    const name = function (k) { const L = { type: MAKE_TYPES, aud: MK_AUD, tone: MK_TONE, size: MK_SIZE }[k]; return L ? ((L.find(function (x) { return x[0] === MK[k]; }) || [])[1] || MK[k]) : MK[k]; };
    Object.keys(lab).forEach(function (k) { if (MK[k]) known.appendChild(el('span', { class: 'pill' }, [lab[k] + ': ' + name(k), el('button', { type: 'button', class: 'x', 'aria-label': 'تغيير', onclick: function () { MK[k] = ''; mkSave(); MK.step = 'ask'; renderMake(); } }, [ico('close')])])); });
    if (known.children.length) known.insertBefore(el('span', { class: 'tiny', text: 'فهمنا من فكرتك:' }), known.firstChild);
  }
  function draw() {
    const q = qs[i]; box.innerHTML = '';
    box.appendChild(el('div', { class: 'mkprog' }, qs.map(function (_, j) { return el('i', { class: j <= i ? 'on' : '' }); })));
    box.appendChild(el('h2', { text: q.q }));
    let free = null;
    if (q.opts) {
      const chips = el('div', { class: 'chips' }, q.opts.map(function (o) { return el('button', { type: 'button', class: 'chip' + (MK[q.k] === o[0] ? ' on' : ''), onclick: function () { MK[q.k] = o[0]; mkSave(); next(); } }, [o[1]]); }));
      box.appendChild(chips);
      free = el('input', { type: 'text', class: 'inp', dir: 'auto', placeholder: 'أو اكتب تفصيلاً بكلماتك…', onkeydown: function (e) { if (e.key === 'Enter') { e.preventDefault(); if (free.value.trim()) { MK[q.k + 'Free'] = free.value.trim(); if (!MK[q.k]) MK[q.k] = q.opts[0][0]; mkSave(); } next(); } } });
      box.appendChild(el('div', { class: 'fld' }, [free]));
    } else {
      const lab = { who: 'المقدّم', time: 'اليوم والوقت', place: 'المكان أو المنصة' };
      q.fields.forEach(function (k) { box.appendChild(el('div', { class: 'fld' }, [el('label', { text: lab[k] }), el('input', { type: 'text', dir: 'auto', value: MK[k] || '', oninput: function (e) { MK[k] = e.target.value; } })])); });
      box.appendChild(el('div', { class: 'fld' }, [el('label', { text: 'التاريخ (اختياري)' }), el('input', { type: 'date', value: MK.date || '', onchange: function (e) { MK.date = e.target.value; } })]));
    }
    box.appendChild(el('div', { class: 'row wrapr mkctl' }, [
      i > 0 ? el('button', { type: 'button', class: 'btn line', onclick: function () { i--; draw(); } }, ['السابق']) : el('button', { type: 'button', class: 'btn ghost', onclick: function () { MK.step = 'idea'; renderMake(); } }, ['تعديل الفكرة']),
      el('span', { class: 'sp' }),
      el('button', { type: 'button', class: 'btn ghost', onclick: function () { if (q.opts && !MK[q.k]) MK[q.k] = ''; next(); } }, ['تخطَّ']),
      el('button', { type: 'button', class: 'btn dark', onclick: function () { if (free && free.value.trim()) { MK[q.k + 'Free'] = free.value.trim(); if (!MK[q.k]) MK[q.k] = q.opts[0][0]; } mkSave(); next(); } }, [i === qs.length - 1 ? 'اصنع التصاميم' : 'التالي'])
    ]));
    knownChips();
  }
  function next() { if (i < qs.length - 1) { i++; draw(); } else { body.innerHTML = ''; mkGenerate(body); } }
  draw();
}

/* ---------- ٣) التوليد: قوالب + تصاميم حرة، وبثلاثة اتجاهات عند «دعه يبدع» ---------- */
function mkInfo() {
  return { kind: MK.type || 'ann', title: MK.title || '', sub: MK.subFree || '', who: MK.who || '', place: MK.place || '', time: MK.time || '', date: MK.date || '', body: MK.text || '', name: MK.title || '' };
}
async function mkGenerate(body) {
  const T = trackOf(MK.tid); if (!MK.type) MK.type = 'ann'; mkSave();
  body.innerHTML = ''; body.appendChild(el('div', { class: 'boot' }, [loader6(aiReady() ? 'يصمّم المساعد عدة اقتراحات…' : 'نجهّز الاقتراحات…')]));
  const dirs = MK.creative ? DIRECTIONS : [[MK.tone || 'calm', '', '']];
  let results = [];
  try {
    if (aiReady()) results = await Promise.all(dirs.map(function (d) { return makeAI(T, d).catch(function (e) { return { error: e.message, designs: [] }; }); }));
    else results = dirs.map(function (d) { return makeLocal(T, d); });
  } catch (e) { toast(e.message); results = dirs.map(function (d) { return makeLocal(T, d); }); }
  if (results.every(function (r) { return !r.designs.length; })) results = dirs.map(function (d) { return makeLocal(T, d); });
  MK.results = results; MK.step = 'results'; MK.dir = 0;
  track('make', { tool: aiReady() ? 'ai' : 'local' });
  renderMake();
}
function mkResults(body) {
  const T = trackOf(MK.tid), res = MK.results || [];
  const tabs = MK.creative ? segOf(DIRECTIONS.map(function (d) { return [d[0], d[1]]; }), DIRECTIONS[MK.dir][0], function (v) { MK.dir = DIRECTIONS.findIndex(function (d) { return d[0] === v; }); fill(); }) : null;
  const top = el('div', { class: 'row wrapr mkres-h' }, [H('h2', MK.creative ? 'ثلاثة اتجاهات، اختر ما يعجبك' : 'اقتراحاتنا، كلها قابلة للتعديل'), el('span', { class: 'sp' }), tabs,
    el('button', { type: 'button', class: 'btn line', onclick: function () { MK.step = 'ask'; MK.results = null; renderMake(); } }, ['غيّر الإجابات']),
    el('button', { type: 'button', class: 'btn dark', onclick: function () { mkGenerate(body); } }, [ico('ai'), 'اقتراحات أخرى'])]);
  body.appendChild(top);
  const grid = el('div', { class: 'tgrid' }); body.appendChild(grid);
  function fill() {
    grid.innerHTML = '';
    const r = res[MK.dir] || res[0] || { designs: [] };
    if (r.error) grid.appendChild(el('p', { class: 'err', text: r.error }));
    if (r.missing && r.missing.length) grid.appendChild(el('div', { class: 'card flat mkask', style: 'grid-column:1/-1' }, [el('b', { text: 'لإكمال الإعلان:' }), el('span', { text: ' ' + r.missing.join('، ') + '. اكتبها في التصميم مباشرة.' })]));
    r.designs.forEach(function (dz, i) {
      const tpl = TEMPLATES.find(function (t) { return t.id === dz.tpl; }); if (!tpl) return;
      grid.appendChild(el('button', { type: 'button', class: 'tcard6 hover-lift rv', style: '--d:' + (i % 8), onclick: function () { ls('makePick', { tid: T.id, page: dz.page }); go('#/e/' + T.id + '/' + tpl.id + '?make'); } },
        [el('div', { class: 'tthumb' }, [tplThumb(tpl, T, dz.page.size, 300, dz.page), dz.free ? el('span', { class: 'pill pu tnew', text: 'تصميم جديد' }) : null]), el('div', { class: 'tmeta6' }, [el('b', { text: dz.free ? 'تصميم من هوية ' + T.name : tpl.name }), el('span', { class: 'tiny', text: dz.note || '' })])]));
    });
    if (!r.designs.length) grid.appendChild(el('p', { class: 'empty', text: 'لم نجد اقتراحاً. جرّب نوعاً آخر.' }));
    revealAll(grid);
  }
  fill();
}

/* ---------- صفحة قالب من معلومات موحّدة ---------- */
// info: {kind, title, sub, who, place, time, date, body, name, num}
function pageFromInfo(tpl, T, info, fields, palette) {
  const pg = newPage(tpl, T, true);
  const tk = info.date ? (function () { const p = info.date.split('-').map(Number); return p.length === 3 && p[0] ? dateTokens(new Date(p[0], p[1] - 1, p[2], 12), 0) : null; })() : null;
  const I = Object.assign({}, info, { date: info.date || '' });
  if (WIZ[tpl.id]) { const m = WIZ[tpl.id](I, tk); Object.keys(m).forEach(function (k) { if (k in pg.d && has(m[k])) { pg.d[k] = m[k]; delete pg.ph[k]; } }); }
  else tpl.fields.forEach(function (f) { if (f.k && has(info[f.k]) && typeof pg.d[f.k] === 'string') { pg.d[f.k] = info[f.k]; delete pg.ph[f.k]; } });
  if (tk) tpl.fields.forEach(function (f) { if (f.kind === 'date' && f.map) Object.keys(f.map).forEach(function (k) { pg.d[k] = f.map[k].replace(/\{(\w+)\}/g, function (_, t) { return tk[t] || ''; }); delete pg.ph[k]; }); });
  (fields || []).forEach(function (q) { if (q && q.k in pg.d && typeof pg.d[q.k] === 'string' && has(q.v)) { pg.d[q.k] = String(q.v).slice(0, 400); delete pg.ph[q.k]; } });
  if (palette) pg.ov = palette;
  return pg;
}
function tplsForType(type) { return visibleTpls().filter(function (t) { return type === 'social' ? (t.type === 'social' || t.sizes.indexOf('story') >= 0) : t.type === type; }); }
function sizeFor(tpl) { const s = sizesFor(tpl); return MK.size && s.indexOf(MK.size) >= 0 ? MK.size : s[0]; }
// صفحة تصميم حر من تخطيط ومعلومات
function freePage(T, layout, info, fields) {
  const tpl = TEMPLATES.find(function (t) { return t.id === 'ai_free'; });
  const pg = newPage(tpl, T, true); pg.size = MK.size && tpl.sizes.indexOf(MK.size) >= 0 ? MK.size : 'post';
  pg.d.layout = JSON.stringify(cleanLayout(layout));
  const map = { title: info.title, sub: info.sub, who: info.who, time: info.time, place: info.place, note: info.note || '', badge: info.badge || '' };
  Object.keys(map).forEach(function (k) { if (has(map[k])) { pg.d[k] = String(map[k]).slice(0, 120); delete pg.ph[k]; } });
  (fields || []).forEach(function (q) { if (q && q.k in pg.d && typeof pg.d[q.k] === 'string' && has(q.v)) { pg.d[q.k] = String(q.v).slice(0, 200); delete pg.ph[q.k]; } });
  if (!has(pg.d.note)) { pg.d.note = ''; delete pg.ph.note; } if (!has(pg.d.badge)) { pg.d.badge = ''; delete pg.ph.badge; }
  return pg;
}
// بلا ذكاء: قوالب النوع كلها بلوحتين، وتصاميم حرة محلية
function makeLocal(T, dir) {
  const info = mkInfo(); if (!info.title) info.title = (MK.text || '').split(/[،.\n]/)[0].trim().slice(0, 40) || 'العنوان الرئيسي';
  const designs = [], seed = Date.now() % 1000 + (dir ? dir[0].length : 0);
  localLayouts(seed, MK.size || 'post').forEach(function (L, i) { designs.push({ tpl: 'ai_free', page: freePage(T, L, info), note: 'تخطيط ' + (i + 1), free: true }); });
  tplsForType(MK.type).slice(0, 10).forEach(function (tpl) {
    const page = pageFromInfo(tpl, T, info, null, null); page.size = sizeFor(tpl);
    designs.push({ tpl: tpl.id, page: page, note: tpl.variants[0].name });
    const pals = genPalettes(tpl, T).filter(function (p) { return p.bg !== T.c.paper; });
    if (pals[0] && (!dir || dir[0] === 'bold')) { const p2 = pageFromInfo(tpl, T, info, null, pals[0]); p2.size = page.size; designs.push({ tpl: tpl.id, page: p2, note: 'ألوان أخرى' }); }
  });
  return { designs: designs, missing: [] };
}
// بالمساعد: قوالب النوع + تصاميم حرة من تخطيط يكتبه المساعد
async function makeAI(T, dir) {
  const list = tplsForType(MK.type).slice(0, 24), info = mkInfo();
  const today = new Date(), iso = today.toISOString().slice(0, 10), wd = new Intl.DateTimeFormat('ar', { weekday: 'long' }).format(today);
  const catalog = list.map(function (t) { return { id: t.id, name: t.name, tags: t.tags || '', fields: t.fields.filter(function (f) { return f.k && (!f.kind || f.kind === 'area' || f.kind === 'text'); }).map(function (f) { return f.k + ': ' + f.label + (f.max ? ' (حتى ' + f.max + ' حرفاً)' : ''); }) }; });
  const aud = (MK_AUD.find(function (x) { return x[0] === MK.aud; }) || [])[1], tone = (MK_TONE.find(function (x) { return x[0] === (dir && dir[2] ? dir[0] : MK.tone); }) || [])[1];
  const system = [
    'أنت مصمم إعلانات لبرنامج تربوي عربي. تكتب نصوصاً عربية فصيحة قصيرة وأنيقة، وتختار من قوالب جاهزة، وتصمم أيضاً تخطيطات حرة جديدة من ألوان الهوية.',
    'القواعد: لا تخترع تاريخاً ولا اسماً ولا مكاناً ولا وقتاً لم يُذكر؛ اترك ما لم يُذكر فارغاً واذكره في missing. العنوان قصير جذاب (٢-٥ كلمات)، وكلمة مهمة بين *نجمتين*.',
    'اليوم ' + wd + ' ' + iso + (info.date ? '، والمستخدم حدّد التاريخ ' + info.date : '') + '.',
    aud ? 'الجمهور: ' + aud + '.' : '', tone ? 'النبرة: ' + tone + '.' : '',
    dir && dir[2] ? 'الاتجاه البصري المطلوب لهذه الدفعة: «' + dir[1] + '»: ' + dir[2] + '.' : '',
    MK.typeFree || MK.audFree || MK.toneFree || MK.sizeFree ? 'تفاصيل من المستخدم: ' + [MK.typeFree, MK.audFree, MK.toneFree, MK.sizeFree].filter(Boolean).join(' · ') : '',
    'أولاً designs: اختر من ٤ إلى ٦ قوالب مختلفة الأشكال، ولكل قالب املأ خاناته بما يناسب حدودها.',
    'ثانياً free: صمّم تخطيطين حرّين جديدين (٢) بوصف JSON: bg {kind: solid|split|band|frame|diagonal, role, role2, ratio 0.3-0.6, pos: top|bottom|left|right}؛ deco حتى ٥ أشكال {shape: circle|ring|petal|star|dots|lines|arc|blob, x, y, r (نسب من العرض), role, alpha, rot}؛ blocks من ٦ إلى ١٠ عناصر {k: title|sub|who|time|place|note|badge|logo|academy|social|photo|rule, x, y, w, h (نسب 0-1 من العرض والارتفاع، لا تتداخل العناصر النصية)، align: right|center|left، size (نسبة من العرض: العنوان 0.07-0.12، الفرعي 0.03-0.04، المعلومات 0.028-0.034)، role: auto أو اسم لون، bold 0-1، fill للوسم}. أدوار الألوان: paper (ورق فاتح), warm, p (الأساسي), pd (داكن), pl (فاتح), s, sd, sdd, a (تمييز), a2, teal, tealL, ink, muted, white. الشعار في الأعلى دائماً، والعنوان أكبر عنصر، واترك هوامش ٧٪.',
    'القوالب المتاحة (المعرّف، الاسم، الخانات):', JSON.stringify(catalog)
  ].filter(Boolean).join('\n');
  const block = { type: 'OBJECT', properties: { k: { type: 'STRING' }, x: { type: 'NUMBER' }, y: { type: 'NUMBER' }, w: { type: 'NUMBER' }, h: { type: 'NUMBER' }, align: { type: 'STRING' }, size: { type: 'NUMBER' }, role: { type: 'STRING' }, bold: { type: 'NUMBER' }, fill: { type: 'STRING' }, text: { type: 'STRING' }, round: { type: 'NUMBER' } }, required: ['k', 'x', 'y', 'w', 'h'] };
  const deco = { type: 'OBJECT', properties: { shape: { type: 'STRING' }, x: { type: 'NUMBER' }, y: { type: 'NUMBER' }, r: { type: 'NUMBER' }, role: { type: 'STRING' }, alpha: { type: 'NUMBER' }, rot: { type: 'NUMBER' } }, required: ['shape', 'x', 'y', 'r'] };
  const layout = { type: 'OBJECT', properties: { bg: { type: 'OBJECT', properties: { kind: { type: 'STRING' }, role: { type: 'STRING' }, role2: { type: 'STRING' }, ratio: { type: 'NUMBER' }, pos: { type: 'STRING' } }, required: ['kind', 'role'] }, deco: { type: 'ARRAY', items: deco }, blocks: { type: 'ARRAY', items: block } }, required: ['bg', 'blocks'] };
  const schema = { type: 'OBJECT', properties: {
    info: { type: 'OBJECT', properties: { title: { type: 'STRING' }, sub: { type: 'STRING' }, who: { type: 'STRING' }, place: { type: 'STRING' }, time: { type: 'STRING' }, date: { type: 'STRING' }, body: { type: 'STRING' }, note: { type: 'STRING' }, badge: { type: 'STRING' } }, required: ['title'] },
    designs: { type: 'ARRAY', items: { type: 'OBJECT', properties: { tpl: { type: 'STRING' }, why: { type: 'STRING' }, fields: { type: 'ARRAY', items: { type: 'OBJECT', properties: { k: { type: 'STRING' }, v: { type: 'STRING' } }, required: ['k', 'v'] } } }, required: ['tpl', 'fields'] } },
    free: { type: 'ARRAY', items: { type: 'OBJECT', properties: { why: { type: 'STRING' }, layout: layout }, required: ['layout'] } },
    missing: { type: 'ARRAY', items: { type: 'STRING' } }
  }, required: ['info', 'designs', 'free', 'missing'] };
  const prompt = ['الوصف: ' + (MK.text || '(لم يكتب وصفاً، فابتكر إعلاناً نموذجياً لهذا النوع بهوية ' + T.full.replace('ـ', '') + ')'), MK.title ? 'العنوان المقترح: ' + MK.title : '', MK.who ? 'المقدّم: ' + MK.who : '', MK.time ? 'الوقت: ' + MK.time : '', MK.place ? 'المكان: ' + MK.place : ''].filter(Boolean).join('\n');
  const raw = await API6.call('ai_make', V6.token, JSON.stringify({ kind: MK.creative ? 'creative' : 'design', program: V6.prog.id, system: system, prompt: prompt, schema: schema, temperature: dir && dir[0] === 'bold' ? 1 : 0.85 }));
  let r; try { r = JSON.parse(raw); } catch (e) { throw new Error('لم يفهم المساعد الطلب. أعد صياغته.'); }
  const I = Object.assign({}, info, r.info || {}); if (MK.date) I.date = MK.date; I.name = I.title; ['who', 'time', 'place'].forEach(function (k) { if (MK[k]) I[k] = MK[k]; });
  const designs = [];
  (r.free || []).slice(0, 3).forEach(function (f, i) { designs.push({ tpl: 'ai_free', page: freePage(T, f.layout, I), note: f.why || 'تصميم جديد', free: true }); });
  (r.designs || []).forEach(function (dz) {
    const tpl = list.find(function (t) { return t.id === dz.tpl; }); if (!tpl) return;
    const page = pageFromInfo(tpl, T, I, dz.fields, null); page.size = sizeFor(tpl);
    designs.push({ tpl: tpl.id, page: page, note: dz.why || '' });
    const pals = genPalettes(tpl, T).filter(function (p) { return p.bg !== T.c.paper; });
    if (pals.length && (!dir || dir[0] !== 'calm')) { const p2 = pageFromInfo(tpl, T, I, dz.fields, pals[designs.length % pals.length]); p2.size = page.size; designs.push({ tpl: tpl.id, page: p2, note: 'ألوان أخرى' }); }
  });
  if (!designs.length) throw new Error('لم يختر المساعد قالباً مناسباً. جرّب نوعاً آخر أو وصفاً أوضح.');
  return { designs: designs, missing: r.missing || [] };
}
