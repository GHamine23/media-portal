/* ================= المصمّم الذكي: فكرة بكلماتك، ثم أسئلة قصيرة فيما نقص، ثم نتائج كثيرة من القوالب ومن تصاميم حرة بهوية البرنامج =================
   بلا مساعد ذكي: الأسئلة نفسها، وقواعد محلية تملأ القوالب وتولّد تخطيطات حرة. */
const MAKE_TYPES = [['ann', 'إعلان فعالية'], ['comp', 'مسابقة'], ['thanks', 'تهنئة وشكر'], ['quote', 'عبارة وتذكير'], ['daily', 'المقرر اليومي'], ['cover', 'غلاف وجدول'], ['yt', 'غلاف يوتيوب'], ['social', 'مواقع التواصل']];
const MK_AUD = [['students', 'الطلاب'], ['parents', 'أولياء الأمور'], ['staff', 'المربون والفريق'], ['all', 'الجميع']];
const MK_TONE = [['calm', 'هادئة'], ['bold', 'حماسية'], ['formal', 'رسمية'], ['warm', 'دافئة وقريبة'], ['spirit', 'روحانية']];
const MK_SIZE = [['post', 'منشور'], ['square', 'مربع'], ['story', 'قصة'], ['yt', 'غلاف يوتيوب'], ['banner', 'غلاف استمارة']];
const DIRECTIONS = [['calm', 'هادئ', 'مساحات بيضاء واسعة، لون واحد غامق للعنوان، زخرفة قليلة'], ['bold', 'جريء', 'خلفية داكنة أو ملوّنة بالكامل، عنوان ضخم، تباين قوي'], ['classic', 'كلاسيكي', 'إطار وتوازن متماثل، عناصر مرتبة في الوسط، وقار']];
let MK_LAST = null;
try { MK_LAST = JSON.parse(sessionStorage.getItem('mk_last') || 'null'); } catch (e) {}
function mkKeep() { MK_LAST = JSON.parse(JSON.stringify(MK)); MK_LAST.keptAt = Date.now(); try { sessionStorage.setItem('mk_last', JSON.stringify(MK_LAST)); } catch (e) {} }
let MK = { text: '', tid: '', type: '', aud: '', tone: '', size: '', who: '', time: '', place: '', date: '', title: '', creative: false, results: null, dir: 0 };
function aiReady() { const a = V6.settings && V6.settings.ai; return !!(a && a.enabled && a.ready && can('ai')); }
// مهام ترى الصور (مراجعة التصميم) تحتاج Gemini
function aiVision() { const a = V6.settings && V6.settings.ai; return aiReady() && !!(a && a.vision); }
function mkSave() { ls('make', { text: MK.text, tid: MK.tid, type: MK.type, aud: MK.aud, tone: MK.tone, size: MK.size, who: MK.who, time: MK.time, place: MK.place, date: MK.date, title: MK.title, creative: MK.creative }); }

function showMake6() {
  if (!progFeat('ai')) return featOff('اصنع إعلانك');
  document.title = 'المصمّم الذكي';
  const saved = ls('make'); if (saved) MK = Object.assign(MK, saved, { results: null });
  const qs0 = location.hash.split('?')[1] || '';
  const tracks = tracksOf();
  if (!tracks.length) { view(el('div', { class: 'wrap page' }, [H('h1', 'المصمّم الذكي'), el('p', { class: 'muted', text: 'أضف هوية البرنامج أولاً.' })])); return; }
  const qs = qs0, qTid = /tid=([a-z0-9_\-]+)/.exec(qs); if (qTid && TRACKS[qTid[1]]) MK.tid = qTid[1];
  if (/creative=1/.test(qs)) MK.creative = true;
  if (!TRACKS[MK.tid]) MK.tid = ls('lastTrack') && TRACKS[ls('lastTrack')] ? ls('lastTrack') : tracks[0].id;
  if (!canSocial() && MK.type === 'social') MK.type = '';
  // الاقتراحات الأخيرة تبقى ٤٠ دقيقة: الرجوع بزر المتصفح أو من المحرر يعيدها كاملة
  if (MK_LAST && MK_LAST.results && Date.now() - (MK_LAST.keptAt || 0) < 40 * 60000 && !/new=1|creative=1/.test(qs) && (!qTid || qTid[1] === MK_LAST.tid)) { Object.assign(MK, MK_LAST); MK.step = 'results'; }
  else { MK.step = 'idea'; MK.results = null; }
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
    el('div', { class: 'row wrapr mkopts' }, [el('div', { class: 'fld' }, [el('label', { for: 'mk_tid', text: 'الهوية' }), idSel]), ai ? el('button', { type: 'button', class: 'btn sm line mkbrief', title: 'يعيد المساعد صياغة وصفك وصفاً أوضح وأغنى للتصميم', onclick: async function (e) {
      const b = e.currentTarget; if (ta.value.trim().length < 4) { toast('اكتب فكرتك أولاً'); ta.focus(); return; } b.disabled = true; const old = b.textContent; b.replaceChildren(el('span', { class: 'spin' }), ' يحسّن الوصف…');
      try {
        const raw = await API6.call('ai_make', V6.token, JSON.stringify({ kind: 'brief', program: V6.prog.id, system: 'أنت مدير إبداعي عربي. يكتب المستخدم فكرة إعلان بكلمات قليلة، فتعيد صياغتها وصفاً تصميمياً واضحاً في ٣ إلى ٥ أسطر: ما الحدث ولمن، والشعور المطلوب، والعنوان المقترح (قصير بكلمة مميزة)، والعناصر البصرية المناسبة (لون غالب من الهوية، زخرفة، صورة أو بلا)، وما يجب إبرازه أولاً. لا تخترع معلومات غير مذكورة (مواعيد وأسماء)، واترك مكانها سؤالاً قصيراً بين قوسين. أعد JSON: brief.', prompt: 'الفكرة: ' + ta.value.trim() + '\nالهوية: ' + (TRACKS[MK.tid] ? TRACKS[MK.tid].full : ''), schema: { type: 'OBJECT', properties: { brief: { type: 'STRING' } }, required: ['brief'] }, temperature: 0.7 }));
        const br = JSON.parse(raw).brief; if (!br) throw new Error('لم يُعد المساعد وصفاً');
        const box = el('div', { class: 'card flat mkbriefbox rv in-view' }, [el('div', { class: 'row' }, [ico('ai'), el('b', { text: 'وصف محسّن' })]), el('p', { text: br }), el('div', { class: 'row wrapr' }, [el('button', { type: 'button', class: 'btn sm dark', onclick: function () { ta.value = br; MK.text = br; mkSave(); box.remove(); toast('استُعمل الوصف المحسّن'); } }, ['استعمله']), el('button', { type: 'button', class: 'btn sm ghost', onclick: function () { box.remove(); } }, ['تجاهل'])])]);
        ta.parentNode.appendChild(box); track('tool', { tool: 'brief' });
      } catch (er) { toast(er.message); }
      b.disabled = false; b.replaceChildren(ico('wand'), old);
    } }, [ico('wand'), 'حسّن وصفي بالذكاء']) : null]),
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
  const raw = await API6.call('ai_make', V6.token, JSON.stringify({ kind: 'intake', program: V6.prog.id, system: system, prompt: t, schema: schema, temperature: 0.2, cache: true }));
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

/* ---------- ٣) التوليد ----------
   بالمساعد: طلب واحد يفهم الفكرة ثم يختار القوالب الأنسب مرتبة بأسبابها، ويكتب نص كل خانة في حدّها، ويختار من أنماط حرة مدروسة
   (لا يكتب إحداثيات بنفسه، فلا تتداخل العناصر). ثم ننظّف النصوص ونقصّر ما تجاوز حدّه، ونلوّن بحسب الهوية والمزاج، ونرتّب.
   «دعه يبدع»: الطلب نفسه بثلاثة اتجاهات. وكل اقتراح يُعدَّل وحده (أقصر، أكثر رسمية، عنوان آخر…) دون إعادة الكل. */
const MK_DARK = ['pd', 'sd', 'sdd', 'teal', 'p', 's'], MK_LIGHT = ['paper', 'warm', 'white'], MK_DECO = ['petal', 'star', 'star8', 'ring', 'crescent', 'circle'];
const MK_PAT = ['none', 'star8', 'girih', 'zellij', 'dots'], MK_PHOTOS = ['img_mosque', 'img_dome', 'img_quran', 'img_arch'];
const MK_MOODS = ['light', 'dark', 'brand'];
// الأنماط الحرة: كل نمط تخطيط مجرَّب، يأخذ من المساعد أدوار الألوان والزخرفة والنقش والصورة فقط
const MK_ARCH = {
  panel: ['لوحة سفلية داكنة تحمل العنوان والتفاصيل، وأعلاها فاتح هادئ بزخرفة صغيرة', function (p) {
    const y = p.story ? 0.5 : 0.53;
    return { bg: { kind: p.pick(['split', 'band']), role: p.light, role2: p.dark, ratio: p.story ? 0.5 : 0.47, pos: 'bottom' },
      deco: [{ shape: p.deco, x: 0.14, y: 0.15, r: 0.06, role: 'a', alpha: 1 }, { shape: 'dots', x: 0.72, y: 0.3, r: 0.17, role: 'pl', alpha: 0.3 }],
      blocks: [{ k: 'logo', x: 0.72, y: 0.05, w: 0.22, h: 0.12, align: 'right' }, { k: 'badge', x: 0.07, y: y - 0.09, w: 0.86, h: 0.05, align: 'right', size: 0.036, fill: 'a' },
        { k: 'title', x: 0.07, y: y + 0.03, w: 0.86, h: p.story ? 0.14 : 0.19, align: 'right', size: 0.1, bold: 0.8, hl: 'a' }, { k: 'sub', x: 0.07, y: y + (p.story ? 0.18 : 0.23), w: 0.86, h: 0.06, align: 'right', size: 0.036 },
        { k: 'who', x: 0.07, y: p.story ? 0.8 : 0.84, w: 0.86, h: 0.04, align: 'right', size: 0.032 }, { k: 'time', x: 0.5, y: 0.895, w: 0.43, h: 0.04, align: 'right', size: 0.03 }, { k: 'place', x: 0.07, y: 0.895, w: 0.41, h: 0.04, align: 'right', size: 0.03 },
        { k: 'social', x: 0.07, y: 0.95, w: 0.12, h: 0.025, align: 'left' }] };
  }],
  hero: ['خلفية داكنة كاملة بنقش هندسي خافت، وعنوان ضخم في الوسط تحيط به حلقة', function (p) {
    return { bg: { kind: 'solid', role: p.dark, pattern: p.pattern || 'star8' },
      deco: [{ shape: 'ring', x: 0.5, y: p.story ? 0.4 : 0.45, r: 0.33, role: 'a', alpha: 0.35 }, { shape: 'circle', x: 0.88, y: 0.08, r: 0.13, role: 'pl', alpha: 0.18 }, { shape: p.deco, x: 0.15, y: 0.78, r: 0.035, role: 'a', alpha: 1 }],
      blocks: [{ k: 'logo', x: 0.38, y: 0.05, w: 0.24, h: 0.11, align: 'center' }, { k: 'badge', x: 0.2, y: p.story ? 0.27 : 0.23, w: 0.6, h: 0.05, align: 'center', size: 0.036, fill: 'a' },
        { k: 'title', x: 0.1, y: p.story ? 0.33 : 0.3, w: 0.8, h: p.story ? 0.15 : 0.25, align: 'center', size: 0.12, bold: 0.9, hl: 'a' }, { k: 'sub', x: 0.14, y: p.story ? 0.5 : 0.57, w: 0.72, h: 0.07, align: 'center', size: 0.036 },
        { k: 'rule', x: 0.43, y: p.story ? 0.59 : 0.665, w: 0.14, h: 0.006, fill: 'a' }, { k: 'who', x: 0.15, y: p.story ? 0.62 : 0.7, w: 0.7, h: 0.04, align: 'center', size: 0.034, bold: 0.5 },
        { k: 'time', x: 0.1, y: p.story ? 0.68 : 0.77, w: 0.8, h: 0.04, align: 'center', size: 0.03 }, { k: 'place', x: 0.1, y: p.story ? 0.72 : 0.82, w: 0.8, h: 0.04, align: 'center', size: 0.03 },
        { k: 'academy', x: 0.4, y: 0.92, w: 0.2, h: 0.04, align: 'center' }] };
  }],
  side: ['عمود جانبي ملوّن يحمل الموعد، وصورة بحواف مستديرة والعنوان بجوارها', function (p) {
    const ph = p.wide ? 0.42 : 0.3;
    return { bg: { kind: 'split', role: p.light, role2: p.dark, ratio: p.wide ? 0.4 : 0.34, pos: 'left' },
      deco: [{ shape: 'lines', x: 0.17, y: 0.5, r: 0.3, role: 'pl', alpha: 0.22, rot: -0.6 }, { shape: p.deco, x: 0.17, y: 0.88, r: 0.05, role: 'a', alpha: 1 }],
      blocks: [{ k: 'logo', x: 0.74, y: 0.05, w: 0.2, h: 0.11, align: 'right' }, { k: 'photo', x: 0.4, y: 0.19, w: 0.54, h: ph, align: 'right', round: 0.3 },
        { k: 'badge', x: 0.4, y: 0.21 + ph, w: 0.54, h: 0.045, align: 'right', size: 0.034, fill: 'a' },
        { k: 'title', x: 0.4, y: 0.27 + ph, w: 0.54, h: p.story ? 0.12 : 0.19, align: 'right', size: 0.088, bold: 0.85, hl: p.dark }, { k: 'sub', x: 0.4, y: (p.story ? 0.4 : 0.47) + ph, w: 0.54, h: 0.07, align: 'right', size: 0.03 },
        { k: 'who', x: 0.4, y: 0.88, w: 0.54, h: 0.04, align: 'right', size: 0.03 },
        { k: 'time', x: 0.03, y: 0.3, w: 0.28, h: 0.08, align: 'center', size: 0.03, bold: 0.6 }, { k: 'place', x: 0.03, y: 0.4, w: 0.28, h: 0.08, align: 'center', size: 0.028 },
        { k: 'social', x: 0.4, y: 0.95, w: 0.12, h: 0.025, align: 'left' }] };
  }],
  frame: ['إطار فاتح وقور بزاوية ملوّنة، والعنوان بلون الهوية الداكن', function (p) {
    return { bg: { kind: 'frame', role: p.light, role2: p.dark },
      deco: [{ shape: 'blob', x: 0.88, y: 0.12, r: 0.2, role: 'pl', alpha: 0.3 }, { shape: 'circle', x: 0.12, y: 0.9, r: 0.09, role: 'a', alpha: 0.9 }, { shape: p.deco, x: 0.86, y: 0.86, r: 0.03, role: 'a', alpha: 1 }],
      blocks: [{ k: 'logo', x: 0.1, y: 0.09, w: 0.2, h: 0.1, align: 'left' }, { k: 'badge', x: 0.1, y: 0.27, w: 0.8, h: 0.05, align: 'right', size: 0.034, fill: p.dark },
        { k: 'title', x: 0.1, y: 0.34, w: 0.8, h: p.story ? 0.13 : 0.2, align: 'right', size: 0.105, bold: 0.9, role: p.dark, hl: 'a' }, { k: 'sub', x: 0.1, y: p.story ? 0.48 : 0.55, w: 0.8, h: 0.08, align: 'right', size: 0.036, role: 'ink' },
        { k: 'rule', x: 0.78, y: p.story ? 0.58 : 0.65, w: 0.12, h: 0.006, fill: 'a' },
        { k: 'who', x: 0.1, y: p.story ? 0.61 : 0.68, w: 0.8, h: 0.04, align: 'right', size: 0.033, role: 'ink' }, { k: 'time', x: 0.5, y: p.story ? 0.66 : 0.74, w: 0.4, h: 0.04, align: 'right', size: 0.031, role: 'ink' }, { k: 'place', x: 0.1, y: p.story ? 0.66 : 0.74, w: 0.38, h: 0.04, align: 'right', size: 0.031, role: 'ink' },
        { k: 'note', x: 0.2, y: p.story ? 0.74 : 0.83, w: 0.6, h: 0.04, align: 'center', size: 0.027, role: 'muted' }] };
  }],
  photo: ['صورة كاملة بطبقة تعتيم من لون الهوية، وعنوان فاتح كبير فوقها', function (p) {
    return { bg: { kind: 'photo', role: p.dark, role2: p.dark, overlay: 0.66, photo: 'lib:' + p.photo },
      deco: [{ shape: 'ring', x: 0.86, y: 0.36, r: 0.09, role: 'a', alpha: 0.55 }, { shape: p.deco, x: 0.12, y: 0.42, r: 0.035, role: 'a', alpha: 1 }],
      blocks: [{ k: 'logo', x: 0.72, y: 0.05, w: 0.22, h: 0.12, align: 'right', role: 'white' }, { k: 'badge', x: 0.07, y: 0.47, w: 0.86, h: 0.05, align: 'right', size: 0.036, fill: 'a' },
        { k: 'title', x: 0.07, y: 0.53, w: 0.86, h: 0.2, align: 'right', size: 0.11, bold: 0.9, role: 'white', hl: 'a' }, { k: 'sub', x: 0.07, y: 0.735, w: 0.86, h: 0.06, align: 'right', size: 0.036, role: 'white' },
        { k: 'rule', x: 0.79, y: 0.805, w: 0.14, h: 0.006, fill: 'a' },
        { k: 'who', x: 0.07, y: 0.83, w: 0.86, h: 0.04, align: 'right', size: 0.032, role: 'white' }, { k: 'time', x: 0.5, y: 0.885, w: 0.43, h: 0.04, align: 'right', size: 0.03, role: 'white' }, { k: 'place', x: 0.07, y: 0.885, w: 0.41, h: 0.04, align: 'right', size: 0.03, role: 'white' },
        { k: 'social', x: 0.07, y: 0.95, w: 0.12, h: 0.025, align: 'left' }] };
  }],
  wave: ['موجة لونية كبيرة في الأسفل تحمل التفاصيل، والعنوان كبير على خلفية فاتحة', function (p) {
    return { bg: { kind: 'wave', role: p.light, role2: p.dark, ratio: 0.36 },
      deco: [{ shape: p.deco, x: 0.12, y: 0.1, r: 0.05, role: 'a', alpha: 1 }, { shape: 'blob', x: 0.9, y: 0.24, r: 0.2, role: 'pl', alpha: 0.18 }, { shape: 'dots', x: 0.2, y: 0.52, r: 0.1, role: 'pl', alpha: 0.35 }],
      blocks: [{ k: 'logo', x: 0.72, y: 0.05, w: 0.22, h: 0.11, align: 'right' }, { k: 'badge', x: 0.07, y: 0.21, w: 0.86, h: 0.05, align: 'right', size: 0.036, fill: p.dark },
        { k: 'title', x: 0.07, y: 0.27, w: 0.86, h: p.story ? 0.15 : 0.22, align: 'right', size: 0.11, bold: 0.9, role: p.dark, hl: 'a' }, { k: 'sub', x: 0.07, y: p.story ? 0.44 : 0.5, w: 0.86, h: 0.07, align: 'right', size: 0.036, role: 'ink' },
        { k: 'who', x: 0.07, y: 0.73, w: 0.86, h: 0.045, align: 'right', size: 0.034 }, { k: 'time', x: 0.07, y: 0.795, w: 0.86, h: 0.04, align: 'right', size: 0.031 }, { k: 'place', x: 0.07, y: 0.85, w: 0.86, h: 0.04, align: 'right', size: 0.031 },
        { k: 'social', x: 0.07, y: 0.94, w: 0.12, h: 0.025, align: 'left' }] };
  }]
};
const mkIn = function (list, v, d) { return list.indexOf(v) >= 0 ? v : d; };
// تخطيط من نمط واختيارات المساعد (أو اختيارات عشوائية مدروسة بلا مساعد)
function mkArch(name, o, size, seed) {
  let s = (seed || 7) % 233280; const rnd = function (a) { s = (s * 9301 + 49297) % 233280; return a[Math.floor(s / 233280 * a.length)]; };
  o = o || {};
  const p = { dark: mkIn(MK_DARK, o.dark, rnd(['pd', 'sd', 'teal', 'sdd'])), light: mkIn(MK_LIGHT, o.light, rnd(MK_LIGHT)), deco: mkIn(MK_DECO, o.deco, rnd(MK_DECO.slice(0, 4))),
    pattern: o.pattern === 'none' ? '' : mkIn(MK_PAT, o.pattern, ''), photo: mkIn(MK_PHOTOS, o.photo, rnd(MK_PHOTOS)), story: size === 'story', wide: size === 'yt' || size === 'banner', pick: rnd };
  return { layout: (MK_ARCH[name] || MK_ARCH.panel)[1](p), photo: p.photo };
}
function mkInfo() {
  return { kind: MK.type || 'ann', title: MK.title || '', sub: MK.subFree || '', who: MK.who || '', place: MK.place || '', time: MK.time || '', date: MK.date || '', body: MK.text || '', name: MK.title || '' };
}
async function mkGenerate(body) {
  const T = trackOf(MK.tid); if (!MK.type) MK.type = 'ann'; mkSave();
  body.innerHTML = '';
  const dirs = MK.creative ? DIRECTIONS : [[MK.tone || 'calm', '', '']];
  let results, skip = null;
  if (aiReady()) {
    // مراحل ظاهرة: فهم الفكرة (تمّ قبل الأسئلة) ← اختيار القوالب وكتابة النصوص ← رسم المعاينات. عدّاد، وزر لعرض اقتراحات سريعة، وحدّ أقصى ٩٠ ثانية
    const t0 = Date.now(), secs = el('b', { text: '0' });
    const skipBtn = el('button', { type: 'button', class: 'btn sm line', hidden: true, onclick: function () { if (skip) skip(); } }, ['لا تنتظر: اعرض اقتراحات سريعة الآن']);
    const steps = mkSteps(['فهمنا فكرتك', 'يختار المساعد القوالب الأنسب ويكتب نصوصها', 'نرسم المعاينات بألوان هويتك'], 1);
    body.appendChild(el('div', { class: 'card mkwait2 rv in-view' }, [steps.node, el('p', { class: 'small muted' }, ['مرّ ', secs, ' ثانية. عادةً من ٥ إلى ٢٥ ثانية.']), el('div', { class: 'row wrapr' }, [notifyBtn(), skipBtn])]));
    const tick = setInterval(function () { const n = Math.round((Date.now() - t0) / 1000); secs.textContent = String(n); if (n >= 10) skipBtn.hidden = false; if (!document.body.contains(secs)) clearInterval(tick); }, 1000);
    const skipP = new Promise(function (ok) { skip = function () { ok({ skipped: true }); }; });
    const limit = new Promise(function (ok) { setTimeout(function () { ok({ timeout: true }); }, 90000); });
    const r = await Promise.race([makeAI(T, dirs).catch(function (e) { return { error: e.message }; }), skipP, limit]);
    clearInterval(tick); steps.go(2); await new Promise(function (ok) { setTimeout(ok, 60); });
    results = dirs.map(function (d, k) {
      const x = r && r.byDir && r.byDir[k];
      if (x && x.designs.length) return x;
      const loc = makeLocal(T, d); loc.why = r && r.error ? r.error : r && r.timeout ? 'تأخر المساعد' : ''; return loc;
    });
    if (r && r.titles) MK.titles = r.titles;
    MK.understood = r && r.understanding || '';
    const why = results.map(function (x) { return x && x.why; }).filter(Boolean)[0];
    if (why) toast((/تأخر/.test(why) ? 'تأخر المساعد، فعرضنا اقتراحات سريعة' : 'تعذّر المساعد: ' + why) + '. جرّب «اقتراحات أخرى» بعد قليل.');
  } else {
    body.appendChild(el('div', { class: 'boot' }, [loader6('نجهّز الاقتراحات…')]));
    results = dirs.map(function (d) { return makeLocal(T, d); });
    MK.understood = '';
  }
  MK.results = results; MK.step = 'results'; MK.dir = 0; mkKeep();
  notifyDone('اقتراحات المصمّم الذكي جاهزة', (results[0] && results[0].designs.length) + ' تصميماً بانتظارك');
  track('make', { tool: aiReady() ? 'ai' : 'local' });
  renderMake();
}
// قائمة مراحل: ✓ لما تمّ، ودوّار للجارية، ونقطة لما بعدها
function mkSteps(labels, cur) {
  const node = el('ol', { class: 'mksteps', 'aria-live': 'polite' });
  const draw = function () { node.innerHTML = ''; labels.forEach(function (t, i) { node.appendChild(el('li', { class: i < cur ? 'done' : i === cur ? 'now' : '' }, [el('i', {}, [i < cur ? ico('check') : i === cur ? el('span', { class: 'spin' }) : null]), el('span', { text: t })])); }); };
  draw();
  return { node: node, go: function (i) { cur = i; draw(); } };
}
function mkResults(body) {
  const T = trackOf(MK.tid), res = MK.results || [];
  const tabs = MK.creative ? segOf(DIRECTIONS.map(function (d) { return [d[0], d[1]]; }), DIRECTIONS[MK.dir][0], function (v) { MK.dir = DIRECTIONS.findIndex(function (d) { return d[0] === v; }); fill(); }) : null;
  const top = el('div', { class: 'row wrapr mkres-h' }, [H('h2', MK.creative ? 'ثلاثة اتجاهات، اختر ما يعجبك' : 'اقتراحاتنا، كلها قابلة للتعديل'), el('span', { class: 'sp' }), tabs,
    el('button', { type: 'button', class: 'btn ghost', onclick: function () { MK.results = null; MK_LAST = null; try { sessionStorage.removeItem('mk_last'); } catch (e) {} MK.step = 'idea'; renderMake(); } }, ['فكرة جديدة']),
    el('button', { type: 'button', class: 'btn line', onclick: function () { MK.step = 'ask'; MK.results = null; renderMake(); } }, ['غيّر الإجابات']),
    el('button', { type: 'button', class: 'btn dark', onclick: function () { MK.again = true; mkGenerate(body); } }, [ico('ai'), 'اقتراحات أخرى'])]);
  body.appendChild(top);
  if (MK.understood) body.appendChild(el('p', { class: 'mkgot' }, [ico('ai'), el('span', { text: 'فهم المساعد: ' + MK.understood })]));
  body.appendChild(aiNotice('الاقتراحات أولية من المساعد وقد تخطئ في التفاصيل: راجع النصوص والمواعيد، وعدّل ما شئت في المحرر' + (aiReady() ? '، أو اطلب تعديل اقتراح بعينه من زر «عدّل».' : '.')));
  const note = el('div', { class: 'mknote' }), grid = el('div', { class: 'tgrid' }); body.appendChild(note); body.appendChild(grid);
  function fill() {
    grid.innerHTML = ''; note.innerHTML = '';
    const r = res[MK.dir] || res[0] || { designs: [] };
    if (r.error) note.appendChild(el('p', { class: 'err', text: r.error }));
    if (r.missing && r.missing.length) note.appendChild(el('div', { class: 'card flat mkask' }, [el('b', { text: 'لإكمال الإعلان:' }), el('span', { text: ' ' + r.missing.join('، ') + '. اكتبها في التصميم مباشرة.' })]));
    r.designs.forEach(function (dz, i) { const c = mkCard(T, dz, i, r); if (c) grid.appendChild(c); });
    if (!r.designs.length) grid.appendChild(el('p', { class: 'empty', text: 'لم نجد اقتراحاً. جرّب نوعاً آخر.' }));
    revealAll(grid);
  }
  fill();
}
// بطاقة اقتراح: المعاينة، والاسم والسبب، و«الأنسب» للأول، وزر «عدّل» لتعديل هذا الاقتراح وحده
function mkCard(T, dz, i, r) {
  const tpl = TEMPLATES.find(function (t) { return t.id === dz.tpl; }); if (!tpl) return null;
  const open = function () { mkKeep(); ls('makePick', { tid: T.id, page: dz.page, back: true }); go('#/e/' + T.id + '/' + tpl.id + '?make'); };
  const thumb = el('div', { class: 'tthumb' }, [tplThumb(tpl, T, dz.page.size, 300, dz.page), dz.free ? el('span', { class: 'pill pu tnew', text: 'تصميم جديد' }) : null, i === 0 && dz.score ? el('span', { class: 'pill mkbest', text: 'الأنسب' }) : null]);
  const fix = aiReady() ? el('button', { type: 'button', class: 'btn sm line mkfix', 'aria-label': 'عدّل هذا الاقتراح', onclick: function (e) { e.stopPropagation(); mkFixMenu(e.currentTarget, T, dz, card); } }, [ico('wand'), 'عدّل']) : null;
  const card = el('div', { class: 'tcard6 mkcard hover-lift rv', role: 'button', tabindex: '0', style: '--d:' + (i % 8), onclick: open, onkeydown: function (e) { if (e.key === 'Enter' && e.target === card) open(); } },
    [thumb, el('div', { class: 'tmeta6 row' }, [el('div', { class: 'mkm' }, [el('b', { text: dz.free ? 'تصميم من هوية ' + T.name : tpl.name }), el('span', { class: 'tiny', text: dz.note || '' })]), fix])]);
  return card;
}
const MK_FIX = [['أقصر', 'اختصر كل النصوص قدر الإمكان مع بقاء المعنى'], ['أكثر رسمية', 'اجعل الصياغة رسمية وقورة'], ['أدفأ وأقرب', 'اجعل الصياغة دافئة قريبة من القلب'], ['أكثر حماسة', 'اجعل الصياغة حماسية محفّزة'], ['عنوان آخر', '']];
function mkFixMenu(anchor, T, dz, card) {
  const run = function (instr, titleOnly) { return withBusy(anchor, function () { return mkRefine(T, dz, card, instr, titleOnly); }, { busy: 'يعدّل…', done: 'عُدّل' }).catch(function () {}); };
  popMenu(anchor, MK_FIX.map(function (f) { return { t: f[0], ic: f[1] ? 'wand' : 'reset', fn: function () { run(f[1], !f[1]); } }; }).concat(['-', { t: 'اطلب تعديلاً بكلماتك…', ic: 'pencil', fn: function () {
    const inp = el('input', { type: 'text', class: 'inp', dir: 'auto', placeholder: 'مثال: اذكر أن اللقاء للآباء فقط، واجعل العنوان سؤالاً' });
    modal({ title: 'عدّل هذا الاقتراح', body: [el('p', { class: 'small muted', text: 'يعدّل المساعد نصوص هذا التصميم وحده، ويبقى شكله وألوانه.' }), inp], acts: [{ t: 'عدّل', cls: 'dark', fn: function () { if (inp.value.trim().length < 2) { toast('اكتب ما تريد تعديله'); return false; } run(inp.value.trim()); } }, { t: 'إلغاء' }] });
  } }]));
}
// الخانات النصية الظاهرة في الاقتراح (ما يراه المستخدم ويمكن صياغته)
function mkTextFields(tpl, page) {
  return tpl.fields.filter(function (f) { const v = page.d[f.k]; return f.k && typeof v === 'string' && v.trim() && (!f.kind || f.kind === 'area' || f.kind === 'text') && !(page.hide || {})['f_' + f.k] && !(page.ph && page.ph[f.k] === v); });
}
async function mkRefine(T, dz, card, instr, titleOnly) {
  const tpl = TEMPLATES.find(function (t) { return t.id === dz.tpl; }), page = dz.page;
  const fl = mkTextFields(tpl, page);
  // «عنوان آخر»: من العناوين البديلة التي كتبها المساعد أولاً (فوري بلا طلب)، ثم بالمساعد
  if (titleOnly && 'title' in page.d) {
    const cur = String(page.d.title).replace(/\*/g, ''), alts = (MK.titles || []).filter(function (t) { return t && t.replace(/\*/g, '') !== cur && !(dz.usedTitles || []).includes(t); });
    if (alts.length) { dz.usedTitles = (dz.usedTitles || []).concat([alts[0]]); page.d.title = mkClean(alts[0], (tpl.fields.find(function (f) { return f.k === 'title'; }) || {}).max, true); delete page.ph.title; delete (page.hide || {}).f_title; mkRedraw(T, dz, card); return; }
    instr = 'اكتب عنواناً مختلفاً تماماً بزاوية جديدة، وأبقِ بقية الخانات كما هي حرفياً';
  }
  if (!fl.length) throw new Error('لا نصوص في هذا الاقتراح لتعديلها');
  const system = 'أنت محرر إعلانات عربي لبرنامج تربوي. تأخذ نصوص تصميم (k مفتاح الخانة، label اسمها، max أقصى عدد أحرف، v النص) وطلب تعديل، فتعيد صياغتها بحسب الطلب فقط. التزم بحد كل خانة. أبقِ الأسماء والمواعيد والأماكن والأرقام كما هي حرفياً، ولا تخترع معلومات. في العنوان كلمة واحدة مميزة بين *نجمتين*. لا رموز تعبيرية. أعد كل الخانات بالمفاتيح نفسها.';
  const prompt = 'النصوص: ' + JSON.stringify(fl.map(function (f) { return { k: f.k, label: f.label, max: f.max || 60, v: page.d[f.k] }; })) + '\nالطلب: ' + instr;
  const raw = await API6.call('ai_make', V6.token, JSON.stringify({ kind: 'refine', program: V6.prog.id, system: system, prompt: prompt, schema: { type: 'OBJECT', properties: { fields: { type: 'ARRAY', items: { type: 'OBJECT', properties: { k: { type: 'STRING' }, v: { type: 'STRING' } }, required: ['k', 'v'] } } }, required: ['fields'] }, temperature: 0.6 }));
  const out = (JSON.parse(raw).fields || []).filter(function (q) { return q && fl.some(function (f) { return f.k === q.k; }) && String(q.v || '').trim(); });
  if (!out.length) throw new Error('لم يُعد المساعد نصوصاً. جرّب طلباً أوضح.');
  out.forEach(function (q) { const f = fl.find(function (x) { return x.k === q.k; }); page.d[q.k] = mkClean(q.v, f.max, q.k === 'title'); });
  track('tool', { tool: 'make_refine' });
  mkRedraw(T, dz, card);
}
function mkRedraw(T, dz, card) {
  const tpl = TEMPLATES.find(function (t) { return t.id === dz.tpl; }), th = card.querySelector('.tthumb canvas');
  if (th) th.replaceWith(tplThumb(tpl, T, dz.page.size, 300, dz.page));
  mkKeep(); flashOk(card); toast('عُدّل الاقتراح، وبقي شكله وألوانه');
}

/* ---------- تنظيف النصوص: بلا رموز تعبيرية، ونجمتا تمييز متوازنتان، والطول ضمن حد الخانة ---------- */
function mkClean(v, max, isTitle) {
  let s = String(v == null ? '' : v).replace(/\p{Extended_Pictographic}|️|‍/gu, '').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/!{2,}/g, '!').trim();
  if (isTitle) s = s.replace(/^[«"“]+|[»"”]+$/g, '').replace(/[.。]$/, '').trim();
  // تمييز واحد فقط: أول زوج من النجمتين، وتُحذف أي نجمة زائدة
  const m = /\*([^*\n]+)\*/.exec(s); s = s.replace(/\*/g, ''); if (m) s = s.replace(m[1], '*' + m[1] + '*');
  if (max && s.replace(/\*/g, '').length > max * 1.1) s = mkShort(s, max);
  if (!/[\p{L}\p{N}]/u.test(s)) s = '';   // رمز وحده (★ أو •) ليس نصاً
  return s;
}
// تقصير عند حد الكلمة، وحذف حروف الربط المعلّقة في الآخر، مع إبقاء التمييز سليماً
function mkShort(s, max) {
  const words = s.split(/(\s+)/); let out = '';
  for (let i = 0; i < words.length; i++) { const nx = out + words[i]; if (nx.replace(/\*/g, '').length > max) break; out = nx; }
  out = out.trim().replace(/(?:\s(?:و|في|من|على|عن|إلى|مع|ثم|أو|بين|حتى|لـ|ب|ل))+$/, '').replace(/[،,:؛\-–]+$/, '').trim();
  if ((out.match(/\*/g) || []).length % 2) out = out.replace(/\*/g, '');
  return out || s.replace(/\*/g, '').slice(0, max);
}
// بعد ملء القالب: تنظيف النصوص وتقصير ما تجاوز حدّه، وإخفاء الخانات الاختيارية التي بقيت عناوين عامة
const MK_OPTIONAL = ['sub', 'kicker', 'top', 'chip', 'badge', 'tag', 'note', 'foot', 'desc', 'cta', 'src', 'role', 'head', 'intro', 'label'];
function mkPolish(tpl, page) {
  page.hide = page.hide || {};
  // بلا تاريخ من المستخدم: لا نعرض تواريخ القالب المثالية في الاقتراح (تبقى في المحرر لمن أظهرها)
  if (!MK.date) { const dk = mkDateKeys(tpl), def = defaults(tpl, trackOf(MK.tid)); dk.forEach(function (k) { if (typeof page.d[k] === 'string' && page.d[k] === def[k] && page.d[k].trim()) page.hide['f_' + k] = true; }); }
  tpl.fields.forEach(function (f) {
    const v = page.d[f.k]; if (!f.k || typeof v !== 'string' || f.kind === 'image' || f.kind === 'hidden' || f.kind === 'date') return;
    if (page.ph && page.ph[f.k] === v) { if (MK_OPTIONAL.indexOf(f.k) >= 0) page.hide['f_' + f.k] = true; return; }
    if (v.indexOf('|') >= 0) return;   // الجداول تبقى كما هي
    page.d[f.k] = mkClean(v, f.max, f.k === 'title');
  });
  return page;
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
function freePage(T, layout, info, fields, photo) {
  const tpl = TEMPLATES.find(function (t) { return t.id === 'ai_free'; });
  const pg = newPage(tpl, T, true); pg.size = MK.size && tpl.sizes.indexOf(MK.size) >= 0 ? MK.size : 'post';
  const L = cleanLayout(layout);
  // كلمة التمييز في العنوان تصير زخرفة نصية كبيرة خافتة إن طلبها النمط
  L.deco.forEach(function (q) { if (q.shape === 'bigtext' && !q.text) q.text = ((/\*([^*]+)\*/.exec(info.title || '') || [])[1] || '').slice(0, 24); });
  pg.d.layout = JSON.stringify(L);
  const map = { title: info.title, sub: info.sub, who: info.who, time: info.time, place: info.place, note: info.note || '', badge: info.badge || info.kind || '' };
  Object.keys(map).forEach(function (k) { if (has(map[k])) { pg.d[k] = String(map[k]).slice(0, 120); delete pg.ph[k]; } });
  (fields || []).forEach(function (q) { if (q && q.k in pg.d && typeof pg.d[q.k] === 'string' && has(q.v)) { pg.d[q.k] = String(q.v).slice(0, 200); delete pg.ph[q.k]; } });
  if (photo && L.blocks.some(function (b) { return b.k === 'photo'; })) pg.d.photo = { src: 'lib:' + photo, z: 1, ox: 0, oy: 0 };
  if (!has(pg.d.note)) { pg.d.note = ''; delete pg.ph.note; } if (!has(pg.d.badge)) { pg.d.badge = ''; delete pg.ph.badge; }
  return mkPolish(tpl, pg);
}
// لوحة ألوان بحسب المزاج الذي اختاره المساعد: داكن، أو بلون الهوية، أو فاتح غير الأصل
function mkPalette(tpl, T, mood, nth) {
  const pals = genPalettes(tpl, T).filter(function (p) { return p.bg !== T.c.paper; });
  const want = mood === 'dark' ? pals.filter(function (p) { return isDark(p.bg) && p.bg !== T.c.p && p.bg !== T.c.s; }) : mood === 'brand' ? pals.filter(function (p) { return p.bg === T.c.p || p.bg === T.c.s || p.bg === T.c.pl; }) : pals.filter(function (p) { return !isDark(p.bg); });
  const l = want.length ? want : pals; return l.length ? l[(nth || 0) % l.length] : null;
}
// بلا ذكاء: أنماط حرة مدروسة بألوان عشوائية من الهوية، وقوالب النوع كلها بلوحتين
function makeLocal(T, dir) {
  const info = mkInfo(); if (!info.title) info.title = (MK.text || '').split(/[،.\n]/)[0].trim().slice(0, 40) || 'العنوان الرئيسي';
  const designs = [], seed = Date.now() % 1000 + (dir ? dir[0].length * 37 : 0), size = MK.size || 'post';
  const archs = dir && dir[0] === 'bold' ? ['hero', 'photo', 'panel', 'wave'] : dir && dir[0] === 'classic' ? ['frame', 'side', 'hero', 'panel'] : ['panel', 'wave', 'frame', 'side'];
  archs.forEach(function (a, i) { const A = mkArch(a, {}, size, seed + i * 101); designs.push({ tpl: 'ai_free', page: freePage(T, A.layout, info, null, A.photo), note: MK_ARCH[a][0].split('،')[0], free: true }); });
  tplsForType(MK.type).slice(0, 10).forEach(function (tpl) {
    const page = mkPolish(tpl, pageFromInfo(tpl, T, info, null, null)); page.size = sizeFor(tpl);
    designs.push({ tpl: tpl.id, page: page, note: tpl.variants[0].name });
    const pal = mkPalette(tpl, T, 'dark', 0);
    if (pal && (!dir || dir[0] === 'bold')) { const p2 = mkPolish(tpl, pageFromInfo(tpl, T, info, null, pal)); p2.size = page.size; designs.push({ tpl: tpl.id, page: p2, note: 'ألوان أخرى' }); }
  });
  return { designs: designs, missing: [] };
}

/* ---------- بالمساعد: طلب واحد بمخطط صارم ---------- */
// خانات التاريخ تُملأ تلقائياً من التاريخ الذي يحدده المستخدم (هجري وميلادي محسوبان)، فلا تُعرض على المساعد ولا يُقبل منه ما يكتبه فيها
const MK_DATEK = ['h1', 'h2', 'g1', 'g2', 'd1', 'd2', 'hn', 'hm', 'gn', 'gm', 'day', 'date', 'aLabel', 'aText', 'bLabel', 'v1'];
function mkDateKeys(t) { const k = MK_DATEK.slice(); t.fields.forEach(function (f) { if (f.kind === 'date' && f.map) k.push.apply(k, Object.keys(f.map)); }); return k; }
function mkCatalog(list) {
  return list.map(function (t) {
    const dk = mkDateKeys(t), fs = t.fields.filter(function (f) { return f.k && (!f.kind || f.kind === 'area' || f.kind === 'text') && dk.indexOf(f.k) < 0; }).map(function (f) { return f.k + ':' + f.label.replace(/\s*\(.*\)/, '') + (f.max ? '≤' + f.max : ''); });
    const vs = t.variants.length > 1 ? ' | نسخ: ' + t.variants.map(function (v) { return v.id; }).join('،') : '';
    return t.id + ' | ' + t.name + ' | ' + (t.tags || '') + vs + ' | ' + fs.join('، ');
  }).join('\n');
}
function mkSchema(ids, creative) {
  const S = { type: 'STRING' }, N = { type: 'NUMBER' }, E = function (l) { return { type: 'STRING', enum: l }; };
  const kv = { type: 'ARRAY', items: { type: 'OBJECT', properties: { k: S, v: S }, required: ['k', 'v'] } };
  const dz = { tpl: E(ids), score: N, why: S, mood: E(MK_MOODS), variant: S, photo: E(MK_PHOTOS), fields: kv }, fr = { arch: E(Object.keys(MK_ARCH)), dark: E(MK_DARK), light: E(MK_LIGHT), deco: E(MK_DECO), pattern: E(MK_PAT), photo: E(MK_PHOTOS), score: N, why: S };
  if (creative) { dz.dir = E(DIRECTIONS.map(function (d) { return d[0]; })); fr.dir = dz.dir; }
  return { type: 'OBJECT', properties: {
    understanding: S,
    info: { type: 'OBJECT', properties: { title: S, sub: S, kind: S, who: S, time: S, place: S, badge: S, note: S, body: S }, required: ['title'] },
    titles: { type: 'ARRAY', items: S },
    designs: { type: 'ARRAY', items: { type: 'OBJECT', properties: dz, required: ['tpl', 'fields'] } },
    free: { type: 'ARRAY', items: { type: 'OBJECT', properties: fr, required: ['arch'] } },
    missing: { type: 'ARRAY', items: S }
  }, required: ['understanding', 'info', 'titles', 'designs', 'free', 'missing'] };
}
async function makeAI(T, dirs) {
  const list = tplsForType(MK.type).slice(0, 24), info = mkInfo(), creative = dirs.length > 1;
  const today = new Date(), iso = today.toISOString().slice(0, 10), wd = new Intl.DateTimeFormat('ar', { weekday: 'long' }).format(today);
  const aud = (MK_AUD.find(function (x) { return x[0] === MK.aud; }) || [])[1], tone = (MK_TONE.find(function (x) { return x[0] === MK.tone; }) || [])[1];
  const C = T.c, prev = MK.again && MK.results ? MK.results.reduce(function (a, r) { return a.concat((r.designs || []).map(function (d) { return String(d.page && d.page.d && d.page.d.title || '').replace(/\*/g, ''); })); }, []).filter(Boolean) : [];
  MK.again = false;
  const system = [
    'أنت مدير إبداعي وكاتب إعلانات عربي لبرنامج تربوي إسلامي (' + T.full.replace('ـ', '') + '). تفهم الطلب، ثم تختار أنسب القوالب، ثم تكتب نص كل خانة بعربية فصيحة قصيرة أنيقة.',
    'فكّر بهذا الترتيب: ما الحدث ولمن وما الشعور المطلوب؟ أي القوالب يخدمه شكله وخاناته؟ ثم اكتب النصوص.',
    'لا تخترع تاريخاً ولا اسماً ولا مكاناً ولا وقتاً لم يُذكر: اترك خانته فارغة واذكره في missing. والتزم بحد كل خانة (الرقم بعد ≤ أقصى عدد أحرف، وما بلا رقم فقصير).',
    'اليوم ' + wd + ' ' + iso + (info.date ? '، والتاريخ الذي حدده المستخدم ' + info.date : '') + '.',
    aud ? 'الجمهور: ' + aud + '.' : '', tone && !creative ? 'النبرة: ' + tone + '.' : '',
    MK.typeFree || MK.audFree || MK.toneFree || MK.sizeFree ? 'تفاصيل من المستخدم: ' + [MK.typeFree, MK.audFree, MK.toneFree, MK.sizeFree].filter(Boolean).join(' · ') : '',
    'أعد:',
    '- understanding: سطراً واحداً بما فهمته (الحدث، الجمهور، الشعور).',
    '- info: النصوص المشتركة: title (٢–٥ كلمات)، sub (سطر يوضح الحدث وفائدته)، kind (نوع الفعالية بكلمتين)، who، time، place، badge (كلمة أو كلمتان)، note (سطر ختامي اختياري)، body (لنص العبارة أو التهنئة فقط).',
    '- titles: ثلاثة عناوين بديلة بزوايا مختلفة، في كل منها كلمة بين *نجمتين*.',
    '- designs: ' + (creative ? 'ستة قوالب (اثنان لكل اتجاه)' : 'من ثلاثة إلى أربعة قوالب مختلفة') + ' من القائمة مرتبة من الأنسب، لكلٍّ: tpl، score من ١ إلى ١٠، why (سبب في ست كلمات)، mood (light فاتح، dark داكن، brand بلون الهوية)، variant (إن كان للقالب نسخ)، photo (للقوالب التي فيها صورة: img_mosque مسجد، img_dome قبة، img_quran مصحف، img_arch أقواس)، fields: نص كل خانة نصية في القالب {k, v} ضمن حدّها.',
    '- free: ' + (creative ? 'ثلاثة (واحد لكل اتجاه)' : 'اثنين مختلفين') + ' من الأنماط الحرة، لكلٍّ: arch، dark (لون الكتلة الداكنة)، light (لون الخلفية الفاتحة)، deco (الزخرفة)، pattern (نقش أو none)، photo (للنمطين side وphoto)، score، why.',
    '- missing: ما ينقص الإعلان من معلومات.',
    'الأنماط الحرة: ' + Object.keys(MK_ARCH).map(function (k) { return k + ' = ' + MK_ARCH[k][0]; }).join('؛ ') + '.',
    creative ? 'هذه دفعة «دعه يبدع» بثلاثة اتجاهات، أعط كل عنصر في designs وfree حقل dir: ' + DIRECTIONS.map(function (d) { return d[0] + ' (' + d[1] + ': ' + d[2] + ')'; }).join('؛ ') + '.' : '',
    'أدوار ألوان الهوية: p أساسي ' + C.p + '، pd أساسي داكن ' + C.pd + '، pl أساسي فاتح ' + C.pl + '، s ثانوي ' + C.s + '، sd ثانوي داكن ' + C.sd + '، sdd أدكن ' + C.sdd + '، teal ليلي ' + C.teal + '، a تمييز ' + C.a + '، paper ورق ' + C.paper + '، warm ورق دافئ ' + C.warm + '، white أبيض. اختر ما يناسب الشعور: الداكن للوقار والحماسة، والفاتح للهدوء.',
    prev.length ? 'هذه دفعة جديدة: لا تكرر هذه العناوين ولا زواياها: ' + prev.slice(0, 8).join('، ') + '. واختر قوالب وأنماطاً أخرى إن أمكن.' : '',
    'القوالب (المعرّف | الاسم | وصف | النسخ | الخانات مفتاح:اسم≤حد). خانات التاريخ الهجري والميلادي تُملأ تلقائياً فلا تكتبها:', mkCatalog(list)
  ].filter(Boolean).join('\n');
  const prompt = ['الوصف: ' + (MK.text || '(لم يكتب وصفاً، فابتكر إعلاناً نموذجياً لهذا النوع)'), 'النوع: ' + ((MAKE_TYPES.find(function (x) { return x[0] === MK.type; }) || [])[1] || MK.type),
    MK.title ? 'العنوان المقترح: ' + MK.title : '', MK.who ? 'المقدّم: ' + MK.who : '', MK.time ? 'الوقت: ' + MK.time : '', MK.place ? 'المكان: ' + MK.place : '', MK.date ? 'التاريخ: ' + MK.date : ''].filter(Boolean).join('\n');
  const raw = await API6.call('ai_make', V6.token, JSON.stringify({ kind: creative ? 'creative' : 'design', program: V6.prog.id, system: system, prompt: prompt, schema: mkSchema(list.map(function (t) { return t.id; }), creative), temperature: prev.length ? 1 : 0.8 }));
  let r; try { r = JSON.parse(raw); } catch (e) { throw new Error('لم يفهم المساعد الطلب. أعد صياغته.'); }
  return mkFromAI(T, r, dirs, list);
}
// صورة المكتبة التي اختارها المساعد في خانة الصورة الأساسية للقالب (إن كانت لها صورة افتراضية)
function mkPhoto(tpl, page, ph) { if (MK_PHOTOS.indexOf(ph) < 0) return; tpl.fields.forEach(function (f) { if (f.kind === 'image' && f.def && /^img_/.test(f.def)) page.d[f.k] = { src: 'lib:' + ph, z: 1, ox: 0, oy: 0 }; }); }
// خانة اسم الشخص (التهنئة) لا تأخذ العنوان: تبقى خانة يكتبها المستخدم (لا أسماء طلاب إلى المساعد)
function mkNoName(tpl, page, fields) {
  const f = tpl.fields.find(function (x) { return x.k === 'name'; });
  if (f && MK.type === 'thanks' && !(fields || []).some(function (q) { return q && q.k === 'name' && has(q.v); }) && !MK.title) { const g = genericOf(f) || 'الاسم'; page.d.name = g; page.ph.name = g; }
  return page;
}
// من ردّ المساعد إلى اقتراحات مرتبة لكل اتجاه
function mkFromAI(T, r, dirs, list) {
  const info = mkInfo(), ri = r.info || {};
  const I = Object.assign({}, info, ri); I.body = ri.body || (MK.type === 'quote' || MK.type === 'thanks' ? info.body : ''); if (MK.date) I.date = MK.date;
  ['who', 'time', 'place'].forEach(function (k) { if (MK[k]) I[k] = MK[k]; });
  I.title = mkClean(I.title || info.title || '', 40, true); I.name = MK.type === 'thanks' ? '' : I.title;
  ['sub', 'kind', 'badge', 'note', 'who', 'time', 'place'].forEach(function (k) { I[k] = mkClean(I[k] || '', 80); }); if (!I.badge) I.badge = I.kind;
  const dirIds = dirs.map(function (d) { return d[0]; }), size = MK.size || 'post', seed = Date.now() % 997;
  const all = [];
  (r.designs || []).forEach(function (dz, j) {
    const tpl = list.find(function (t) { return t.id === dz.tpl; }); if (!tpl) return;
    const dk = mkDateKeys(tpl); dz.fields = (dz.fields || []).filter(function (q) { return q && dk.indexOf(q.k) < 0; });
    const sc = +dz.score || (10 - j * 0.1), page = mkNoName(tpl, mkPolish(tpl, pageFromInfo(tpl, T, I, dz.fields, null)), dz.fields); page.size = sizeFor(tpl);
    if (dz.variant && tpl.variants.some(function (v) { return v.id === dz.variant; })) page.variant = dz.variant;
    mkPhoto(tpl, page, dz.photo);
    all.push({ tpl: tpl.id, page: page, note: dz.why || '', score: sc, dir: dz.dir });
    const pal = mkPalette(tpl, T, dz.mood === 'light' || !dz.mood ? 'dark' : dz.mood, j);
    if (pal) { const p2 = mkNoName(tpl, mkPolish(tpl, pageFromInfo(tpl, T, I, dz.fields, pal)), dz.fields); p2.size = page.size; p2.variant = page.variant; mkPhoto(tpl, p2, dz.photo); all.push({ tpl: tpl.id, page: p2, note: dz.mood === 'brand' ? 'بلون الهوية' : 'ألوان أخرى', score: sc - 2.5, dir: dz.dir }); }
  });
  (r.free || []).slice(0, 4).forEach(function (f, j) {
    // التخطيط الخام القديم (إحداثيات من المساعد) ما زال مقبولاً، والجديد نمط مدروس
    const A = f.layout ? { layout: f.layout, photo: '' } : mkArch(f.arch, f, size, seed + j * 53);
    all.push({ tpl: 'ai_free', page: freePage(T, A.layout, I, null, A.photo), note: f.why || (MK_ARCH[f.arch] || MK_ARCH.panel)[0].split('،')[0], free: true, score: +f.score || 8.5 - j * 0.2, dir: f.dir });
  });
  // إن لم يقترح المساعد تصاميم حرة نضيف نمطين بنصوصه
  if (!all.some(function (d) { return d.free; })) ['panel', 'hero'].forEach(function (a, j) { const A = mkArch(a, {}, size, seed + j * 71); all.push({ tpl: 'ai_free', page: freePage(T, A.layout, I, null, A.photo), note: MK_ARCH[a][0].split('،')[0], free: true, score: 0, dir: '' }); });
  const missing = (r.missing || []).map(function (x) { return String(x).trim(); }).filter(Boolean);
  if (!MK.date && all.some(function (d) { const t = TEMPLATES.find(function (x) { return x.id === d.tpl; }); return t && t.fields.some(function (f) { return f.kind === 'date'; }); }) && !missing.some(function (x) { return /تاريخ/.test(x); })) missing.push('التاريخ (في بعض القوالب مثال تغيّره)');
  const byDir = dirIds.map(function (id) {
    const mine = all.filter(function (d) { return dirIds.length === 1 || !d.dir || dirIds.indexOf(d.dir) < 0 || d.dir === id; });
    return { designs: mine.slice().sort(function (a, b) { return b.score - a.score; }), missing: missing };
  });
  if (!all.some(function (d) { return !d.free; }) && !(r.free || []).length) throw new Error('لم يختر المساعد قالباً مناسباً. جرّب نوعاً آخر أو وصفاً أوضح.');
  return { byDir: byDir, titles: (r.titles || []).filter(Boolean).slice(0, 5), understanding: String(r.understanding || '').slice(0, 200) };
}
