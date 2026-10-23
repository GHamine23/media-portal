/* ================= النص المصاحب بتنسيق تليجرام، والإرسال إلى قناة البرنامج فوراً أو في موعد =================
   القوالب الكتابية: أساسية مبنية على رسائل الأكاديمية الحقيقية، وقوالب يضيفها المشرف لبرنامجه، والمساعد يصوغ على نماذج رسائل البرنامج.
   التنسيق: وسوم تليجرام فقط (b, i, u, s, a, code, blockquote). */
const CAP_KINDS = [['ann', 'إعلان لقاء'], ['reminder', 'تذكير قبل الموعد'], ['daily', 'المقرر اليومي'], ['exam', 'اختبار'], ['comp', 'مسابقة وتحدٍّ'], ['thanks', 'تهنئة وشكر'], ['quote', 'عبارة وموعد'], ['free', 'حر']];
const CAP_BASE = [
  { id: 'b_ann', kind: 'ann', name: 'إعلان لقاء', text: '📌 <b>{title}</b>\n{sub}\n\n🗓 {wd} | {hijri} - {greg}.\n⏰ {time} · 📍 {place}\n🎙 {who}\n\n🔗 <u>رابط الحضور:</u>\n{link}\n\n<blockquote>«{quote}»</blockquote>\n\n#{hashtag}' },
  { id: 'b_ann2', kind: 'ann', name: 'إعلان لقاء (قصير)', text: '<b>{title}</b> ✨\n\n{sub}\n\n🗓 {wd} {time}\n📍 {place}\n\n{sign}' },
  { id: 'b_rem', kind: 'reminder', name: 'تذكير: يوم الهمة', text: '⚡️ <b>{title}</b>\n\n{sub}\n\n🗓 <b>{wd}</b> | {time}\n📍 {place}\n\n🔖 <b>لمن هذا اليوم؟</b>\n<u>لكل طالب</u>: {body}\n\n🌱 جهّز كتبك ودفترك من الآن، وتعال <b>بنيّة صادقة لطلب العلم والانتفاع بالخير</b>.' },
  { id: 'b_daily', kind: 'daily', name: 'المقرر اليومي', text: '<blockquote>📅 مقرر {wd} | {hijri} - {greg}.</blockquote>\n\n📚 «{title}» | {sub}\n\n👆 <u>المطلوب:</u>\n\n• قراءة المقرر. 📖\n• تدوين الفوائد. 📝\n\n🔗 <u>رابط المقرر:</u>\n{link}\n\n<blockquote>«{quote}»</blockquote>' },
  { id: 'b_exam', kind: 'exam', name: 'اختبار', text: '<blockquote>📅 من {wd} | {hijri} - {greg}.</blockquote>\n\n📝 <u>{title}</u>\n\n{sub}\n\n🔗 <u>رابط الاختبار:</u>\n{link}\n\n<blockquote>«{quote}»</blockquote>' },
  { id: 'b_comp', kind: 'comp', name: 'مسابقة وتحدٍّ', text: '<blockquote>«{quote}»</blockquote>\n\n🏆 <b>{title}</b>\n{sub}\n\n📜 {body}\n📆 {time}\n\n#{hashtag}' },
  { id: 'b_thanks', kind: 'thanks', name: 'تهنئة وشكر', text: '🎉 <b>{title}</b>\n\n{sub}\n\n{body} 🌸\n\n#{hashtag}' },
  { id: 'b_quote', kind: 'quote', name: 'عبارة وموعد', text: '{title} 🤍\n\n<blockquote>{quote}</blockquote>\n\n🗓 موعدنا {wd} {time} · 📍 {place}\n\n{sign}' },
  { id: 'b_free', kind: 'free', name: 'حر', text: '<b>{title}</b>\n\n{sub}\n\n{body}' }
];
const CAP_VARS = [['title', 'العنوان'], ['sub', 'السطر الفرعي'], ['body', 'النص'], ['who', 'المقدّم'], ['time', 'الوقت'], ['place', 'المكان'], ['wd', 'اليوم'], ['hijri', 'التاريخ الهجري'], ['greg', 'التاريخ الميلادي'], ['quote', 'اقتباس'], ['link', 'الرابط'], ['hashtag', 'الوسم'], ['sign', 'التوقيع']];
// قيم المتغيرات من التصميم المفتوح وإعدادات البرنامج
function capVars(date) {
  const d = (typeof S !== 'undefined' && S.d) || {}, P = V6.prog || {}, tg = P.tg || {}, tk = dateTokens(date || new Date(), 0);
  const pick = function () { for (let i = 0; i < arguments.length; i++) { const v = d[arguments[i]]; if (typeof v === 'string' && v.trim() && !(ED.doc && ED.doc.pages[ED.cur] && ED.doc.pages[ED.cur].ph && ED.doc.pages[ED.cur].ph[arguments[i]] === v)) return v.replace(/\*/g, '').trim(); } return ''; };
  return { title: pick('title', 'name', 'word', 'q'), sub: pick('sub', 'kicker', 'intro', 'desc'), body: pick('body', 'text', 'msg', 'lines', 'items'), who: pick('who', 'name2', 'by'), time: pick('time', 'when', 'day'), place: pick('place', 'where'),
    wd: tk.wd, hijri: tk.hd + ' ' + tk.hm, greg: tk.gd + ' ' + tk.gm, quote: pick('quote', 'ayah', 'hadith'), link: tg.link || '', hashtag: tg.hashtag || '', sign: tg.sign || '' };
}
function capFill(text, vars) {
  // المتغير الفارغ يترك علامة، ثم تُحذف الأجزاء والأسطر التي لم يبقَ فيها إلا رموز وفواصل
  const E = '\u0001';
  const t = String(text || '').replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null && String(vars[k]).trim() ? vars[k] : E; });
  const bare = function (x) { return x.replace(/<\/?[a-z]+>/g, '').replace(/\u0001/g, '').replace(/[\s·|:\-–—«»()\[\]#.,]/g, '').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2B50}\u{2705}\u{231A}-\u{23FF}]/gu, ''); };
  const lines = t.split('\n').map(function (ln) {
    if (ln.indexOf(E) < 0) return ln;
    const parts = ln.split(' · ').filter(function (pt) { return bare(pt).length > 0; });
    return parts.length ? parts.join(' · ') : E;
  });
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (!bare(ln).length && ln.trim() !== '') { continue; }   // سطر لم يبقَ فيه إلا رموز
    // عنوان ينتهي بنقطتين يتبعه سطر فارغ القيمة: يُحذف العنوان أيضاً
    if (/:\s*(<\/[a-z]+>)?\s*$/.test(ln.replace(/\u0001/g, '')) && i + 1 < lines.length && lines[i + 1].indexOf(E) >= 0 && !bare(lines[i + 1]).length) { i++; continue; }
    out.push(ln.replace(/\u0001/g, ''));
  }
  return out.join('\n').replace(/<blockquote>\s*«?\s*»?\s*<\/blockquote>/g, '').replace(/\n{3,}/g, '\n\n').trim();
}
// تنسيق تليجرام → عرض: وسوم مسموحة فقط
function capToHtml(t) {
  const esc = String(t || '').replace(/&(?!amp;|lt;|gt;)/g, '&amp;');
  const allow = /<(\/?)(b|i|u|s|code|blockquote|a)(\s+href="[^"]*")?>/g;
  let out = esc.replace(/</g, '\u0001').replace(/>/g, '\u0002');
  out = out.replace(/\u0001(\/?)(b|i|u|s|code|blockquote|a)(\s+href="[^"]*")?\u0002/g, function (_, c, tag, href) { return '<' + c + tag + (href && !c ? href.replace(/href="(?!https?:)[^"]*"/, 'href="#"') + ' target="_blank" rel="noopener"' : '') + '>'; });
  out = out.replace(/\u0001/g, '&lt;').replace(/\u0002/g, '&gt;');
  void allow;
  return out.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, function (_, p, u) { return p + '<a href="' + u + '" target="_blank" rel="noopener">' + u + '</a>'; }).replace(/\n/g, '<br>');
}
function capPlain(t) { return String(t || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&'); }
function capTemplates() { const P = V6.prog || {}; return (P.captions || []).map(function (c) { return Object.assign({ own: true }, c); }).concat(CAP_BASE); }
function canSend() { return V6.me && (V6.me.role !== 'user' || !!(V6.me.perms && V6.me.perms.send)) && V6.settings && V6.settings.tg && V6.prog && V6.prog.tg && V6.prog.tg.chat; }

/* ---------- نافذة النص المصاحب ---------- */
function captionDialog() {
  if (!ED.doc) return;
  commitPage();
  const kindGuess = { ann: 'ann', comp: 'comp', thanks: 'thanks', quote: 'quote', daily: 'daily', cover: 'ann', yt: 'ann', social: 'ann' }[S.tpl.type] || 'ann';
  let date = new Date(), tplId = (ls('capTpl') || {})[S.tpl.type] || (capTemplates().find(function (c) { return c.kind === kindGuess; }) || CAP_BASE[0]).id;
  const ta = el('textarea', { rows: '9', dir: 'auto', class: 'capta', 'aria-label': 'النص المصاحب' });
  const prev = el('div', { class: 'tgprev' }), cnt = el('span', { class: 'tiny' });
  const img = el('img', { class: 'tgimg', alt: '' }); try { img.src = ED.snapshot(700); } catch (e) {}
  const sel = el('select', { class: 'inp sm', 'aria-label': 'القالب الكتابي' }, capTemplates().map(function (c) { return el('option', { value: c.id, text: (c.own ? '★ ' : '') + c.name + ' · ' + ((CAP_KINDS.find(function (k) { return k[0] === c.kind; }) || [])[1] || ''), selected: c.id === tplId }); }));
  const dateI = el('input', { type: 'date', class: 'inp sm', value: date.toISOString().slice(0, 10), 'aria-label': 'تاريخ الفعالية', onchange: function (e) { const p = e.target.value.split('-').map(Number); if (p[0]) { date = new Date(p[0], p[1] - 1, p[2], 12); apply(); } } });
  function apply() { const c = capTemplates().find(function (x) { return x.id === sel.value; }) || CAP_BASE[0]; ta.value = capFill(c.text, capVars(date)); render(); }
  function render() { prev.innerHTML = capToHtml(ta.value); const n = capPlain(ta.value).length; cnt.textContent = n + ' / 1024' + (n > 1024 ? ' — طويل، يقصّه تليجرام' : ''); cnt.classList.toggle('over', n > 1024); }
  sel.onchange = function () { tplId = sel.value; const m = ls('capTpl') || {}; m[S.tpl.type] = tplId; ls('capTpl', m); apply(); };
  ta.addEventListener('input', render);
  const wrap = function (tag) { const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value; ta.value = v.slice(0, s) + '<' + tag + '>' + v.slice(s, e) + '</' + tag + '>' + v.slice(e); ta.focus(); ta.setSelectionRange(s + tag.length + 2, e + tag.length + 2); render(); };
  const fmt = el('div', { class: 'row capfmt' }, [
    el('button', { type: 'button', class: 'ib sm', title: 'غامق', onclick: function () { wrap('b'); } }, [el('b', { text: 'ب' })]),
    el('button', { type: 'button', class: 'ib sm', title: 'مائل', onclick: function () { wrap('i'); } }, [el('i', { text: 'م' })]),
    el('button', { type: 'button', class: 'ib sm', title: 'تحته خط', onclick: function () { wrap('u'); } }, [el('u', { text: 'خ' })]),
    el('button', { type: 'button', class: 'ib sm', title: 'اقتباس', onclick: function () { wrap('blockquote'); } }, ['❝']),
    el('span', { class: 'sp' }),
    aiReady() ? el('button', { type: 'button', class: 'btn sm line', onclick: async function (e) { const b = e.currentTarget; b.disabled = true; try { ta.value = await captionAI(ta.value, sel.value, date); render(); toast('صاغه المساعد، عدّل ما شئت'); } catch (er) { toast(er.message); } b.disabled = false; } }, [ico('ai'), 'صِغه بالذكاء']) : null,
    el('button', { type: 'button', class: 'btn sm ghost', text: 'أعد من القالب', onclick: apply })
  ]);
  apply();
  let mode = ls('tgMode') || 'both';
  const modeSeg = segOf([['both', 'صورة + الملف الأصلي'], ['photo', 'صورة فقط'], ['doc', 'الملف الأصلي فقط']], mode, function (v) { mode = v; ls('tgMode', v); });
  const whenI = el('input', { type: 'datetime-local', class: 'inp sm', 'aria-label': 'موعد النشر' });
  const sendBtn = el('button', { type: 'button', class: 'btn dark' }, [ico('share'), 'أرسل الآن']);
  const schedBtn = el('button', { type: 'button', class: 'btn line' }, [ico('cal'), 'جدوله']);
  async function send(when) {
    const btn = when ? schedBtn : sendBtn; btn.disabled = true; sendBtn.disabled = schedBtn.disabled = true;
    try {
      await ensureFonts(fontsOfState(snap()));
      const c = document.createElement('canvas'); renderTo(c, S.tpl, S.size, snap(), S.track, 2);
      const png = c.toDataURL('image/png').split(',')[1];
      const r = await API6.me('tg_send', JSON.stringify({ program: V6.prog.id, name: ED.doc.name, caption: ta.value, png: mode === 'doc' ? '' : png, file: mode === 'photo' ? '' : png, fileName: fileName6('png'), fileMime: 'image/png', mode: mode, when: when || 0 }));
      track('tg', { tool: when ? 'schedule' : 'send' }); archive6('share');
      if (r.queued) toast('جُدول النشر في ' + fmtTime(r.when)); else toast('أُرسل إلى القناة' + (r.link ? '' : ''));
      if (r.link) modal({ title: 'أُرسل إلى القناة', body: [el('p', { class: 'muted', text: 'المنشور في قناة ' + V6.prog.name + ':' }), linkRow('رابط المنشور', r.link)], acts: [{ t: 'حسناً', cls: 'dark' }] });
    } catch (e) { toast(e.message); }
    sendBtn.disabled = schedBtn.disabled = false;
  }
  sendBtn.onclick = function () { ask('إرسال إلى القناة', 'يُنشر التصميم مع هذا النص في قناة ' + V6.prog.name + ' الآن.', 'أرسل').then(function (y) { if (y) send(0); }); };
  schedBtn.onclick = function () { const w = whenI.value ? new Date(whenI.value).getTime() : 0; if (!w || w < Date.now() + 60000) { toast('اختر موعداً في المستقبل'); whenI.focus(); return; } send(w); };
  const sendBox = canSend() ? el('div', { class: 'capsend' }, [el('h4', { class: 'psh', text: 'الإرسال إلى قناة ' + V6.prog.name }), modeSeg, el('div', { class: 'row wrapr' }, [sendBtn, whenI, schedBtn])])
    : el('p', { class: 'tiny', text: V6.settings && V6.settings.tg ? (V6.prog && V6.prog.tg && V6.prog.tg.chat ? 'الإرسال إلى القناة يحتاج صلاحية «الإرسال» من مشرف البرنامج. انسخ النص وأرسله بنفسك.' : 'لم يحدد المشرف قناة البرنامج بعد. انسخ النص وأرسله بنفسك.') : 'بوت تليجرام غير مضبوط بعد. انسخ النص وأرسله بنفسك.' });
  modal({ title: 'النص المصاحب للإعلان', wide: true, body: [
    el('div', { class: 'capgrid' }, [
      el('div', { class: 'capl' }, [el('div', { class: 'row wrapr' }, [sel, dateI]), fmt, ta, el('div', { class: 'row' }, [cnt, el('span', { class: 'sp' }), el('button', { type: 'button', class: 'btn sm line', onclick: function () { copyText(capToTgMarkdownless(ta.value)); } }, [ico('copy'), 'نسخ النص']), el('button', { type: 'button', class: 'btn sm ghost', title: 'بوسوم التنسيق كما يقبلها بوت تليجرام', onclick: function () { copyText(ta.value); } }, ['نسخ بالوسوم'])]), sendBox]),
      el('div', { class: 'capr' }, [el('div', { class: 'tgbubble' }, [img, prev, el('span', { class: 'tgtime', text: new Intl.DateTimeFormat('ar', { hour: 'numeric', minute: '2-digit' }).format(new Date()) })]), el('p', { class: 'tiny', text: 'هكذا تظهر الرسالة في تليجرام تقريباً.' })])
    ])
  ], acts: [{ t: 'إغلاق' }] });
}
// للنسخ واللصق اليدوي في تليجرام: نزيل الوسوم ونبقي النص (تليجرام الهاتف يطبّق التنسيق من قائمته)
function capToTgMarkdownless(t) { return capPlain(t); }
async function captionAI(current, tplId, date) {
  const P = V6.prog || {}, vars = capVars(date), c = capTemplates().find(function (x) { return x.id === tplId; });
  const system = ['أنت محرر رسائل قناة تليجرام لبرنامج تربوي عربي. اكتب نصاً مصاحباً لتصميم إعلان، بالعربية الفصيحة السهلة، بأسلوب رسائل البرنامج التالية.',
    'التنسيق: وسوم تليجرام فقط: <b> <i> <u> <blockquote>، وأسطر فارغة بين الفقرات، ورموز تعبيرية قليلة في أول السطر كما في النماذج. لا تتجاوز ٩٠٠ حرف.',
    'لا تخترع معلومة لم تُعطَ: لا وقتاً ولا مكاناً ولا رابطاً ولا اسماً. اترك ما لم يُعطَ. يمكنك إضافة اقتباس قصير موثوق (آية أو حديث صحيح أو حكمة) مناسب للموضوع إن لم يُعطَ اقتباس، مع نسبته باختصار.',
    P.samples ? 'نماذج من رسائل البرنامج (تعلّم منها الأسلوب والبنية):\n' + P.samples.slice(0, 12000) : 'نموذج للأسلوب:\n' + CAP_BASE[0].text + '\n' + CAP_BASE[3].text,
    c ? 'القالب الكتابي المختار (التزم ببنيته): ' + c.text : ''].filter(Boolean).join('\n\n');
  const prompt = 'معلومات التصميم:\n' + Object.keys(vars).filter(function (k) { return vars[k]; }).map(function (k) { return k + ': ' + vars[k]; }).join('\n') + (current ? '\n\nالمسودة الحالية (حسّنها وأكملها):\n' + current : '');
  const raw = await API6.call('ai_make', V6.token, JSON.stringify({ kind: 'caption', program: P.id, system: system, prompt: prompt, schema: { type: 'OBJECT', properties: { caption: { type: 'STRING' } }, required: ['caption'] }, temperature: 0.7 }));
  const r = JSON.parse(raw); if (!r.caption) throw new Error('لم يُعد المساعد نصاً');
  return String(r.caption).replace(/<(?!\/?(b|i|u|s|code|blockquote|a)\b)[^>]*>/g, '').trim();
}
