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
// لماذا لا يُرسل هذا المستخدم (جملة واحدة واضحة)، أو فارغ إن كان يستطيع
function sendWhy() {
  if (canSend()) return '';
  if (!(V6.settings && V6.settings.tg)) return 'بوت تليجرام غير مضبوط بعد: يضيف المشرف رمز البوت من الإعدادات، ثم يصبح الإرسال المباشر متاحاً هنا.';
  if (!(V6.prog && V6.prog.tg && (V6.prog.tg.chat || (V6.prog.tg.chats && S.track && V6.prog.tg.chats[S.track.id])))) return 'لم يحدد المشرف قناة هذا البرنامج أو المسار بعد (من «البرامج والهويات»).';
  return 'الإرسال إلى القناة يحتاج صلاحية «الإرسال» من مشرف البرنامج.';
}
// أخطاء تليجرام الشائعة بجملة يفهمها المستخدم
function tgErrHint(m) {
  m = String(m || '');
  if (/chat not found/i.test(m)) return 'لم يجد البوت القناة: تأكد من معرّفها وأن البوت مضاف إليها.';
  if (/not enough rights|administrator|kicked|forbidden|not a member/i.test(m)) return 'البوت ليس مشرفاً في القناة أو لا يملك صلاحية النشر فيها.';
  if (/too big|too large|entity too large|file is too/i.test(m)) return 'الملف أكبر من حد تليجرام للصور (١٠ ميغابايت)؛ اختر «الملف الأصلي فقط» (حتى ٥٠ ميغابايت).';
  if (/too long/i.test(m)) return 'النص أطول من المسموح في تليجرام.';
  if (/fetch|network|timeout|timed out|اتصال/i.test(m)) return 'تعذّر الاتصال؛ تحقق من الإنترنت ثم حاول مرة أخرى.';
  if (/too many requests|retry after/i.test(m)) return 'تليجرام يطلب الانتظار قليلاً قبل الإرسال التالي.';
  return '';
}
function pubChatName() { const tg = (V6.prog && V6.prog.tg) || {}; const c = (tg.chats && S.track && tg.chats[S.track.id]) || tg.chat || ''; return (tg.titles && tg.titles[c]) || c; }

/* ---------- محرر شبيه بتليجرام: تنسيق بالأزرار بلا وسوم ظاهرة ---------- */
// وسوم تليجرام → HTML للمحرر (contenteditable)
function tgToEd(t) { return capToHtml(t).replace(/<a href="([^"]*)"[^>]*>/g, '<a href="$1">'); }
// HTML المحرر → وسوم تليجرام
function edToTg(root) {
  function walk(n) {
    if (n.nodeType === 3) return n.nodeValue.replace(/ /g, ' ');
    if (n.nodeType !== 1) return '';
    const tag = n.tagName.toLowerCase(), inner = Array.prototype.map.call(n.childNodes, walk).join('');
    if (tag === 'br') return '\n';
    if (tag === 'b' || tag === 'strong') return inner.trim() ? '<b>' + inner + '</b>' : inner;
    if (tag === 'i' || tag === 'em') return inner.trim() ? '<i>' + inner + '</i>' : inner;
    if (tag === 'u') return inner.trim() ? '<u>' + inner + '</u>' : inner;
    if (tag === 's' || tag === 'strike' || tag === 'del') return inner.trim() ? '<s>' + inner + '</s>' : inner;
    if (tag === 'code') return '<code>' + inner + '</code>';
    if (tag === 'a') { const h = n.getAttribute('href') || ''; return /^https?:/.test(h) && inner.trim() ? '<a href="' + h.replace(/"/g, '') + '">' + inner + '</a>' : inner; }
    if (tag === 'blockquote') return '\n<blockquote>' + inner.replace(/^\n+|\n+$/g, '') + '</blockquote>\n';
    if (tag === 'div' || tag === 'p') { const isFirst = n === n.parentNode.firstChild && n.parentNode === root; return (isFirst ? '' : '\n') + inner; }
    if (tag === 'li') return '• ' + inner + '\n';
    return inner;
  }
  return Array.prototype.map.call(root.childNodes, walk).join('').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
}
function capEditor(initialTg, onChange) {
  const ed = el('div', { class: 'caped', contenteditable: 'true', dir: 'auto', role: 'textbox', 'aria-multiline': 'true', 'aria-label': 'نص الرسالة', spellcheck: 'true' });
  ed.innerHTML = tgToEd(initialTg || '');
  try { document.execCommand('defaultParagraphSeparator', false, 'div'); } catch (e) {}
  ed.addEventListener('input', function () { onChange(); });
  ed.addEventListener('paste', function (e) { e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, t); });
  function cmd(c, v) { ed.focus(); document.execCommand(c, false, v || null); onChange(); }
  function quote() {
    ed.focus(); const sel = window.getSelection(); if (!sel.rangeCount) return;
    let n = sel.anchorNode; while (n && n !== ed && !(n.nodeType === 1 && n.tagName === 'BLOCKQUOTE')) n = n.parentNode;
    if (n && n !== ed) { // إزالة الاقتباس
      const frag = document.createDocumentFragment(); while (n.firstChild) frag.appendChild(n.firstChild); n.parentNode.replaceChild(el('div', {}, [frag]), n);
    } else document.execCommand('formatBlock', false, 'blockquote');
    onChange();
  }
  function link() {
    ed.focus(); const sel = window.getSelection(); const txt = sel.toString();
    const u = el('input', { type: 'url', class: 'inp', dir: 'ltr', placeholder: 'https://…', value: /^https?:/.test(txt) ? txt : '' }), t = el('input', { type: 'text', class: 'inp', dir: 'auto', placeholder: 'النص الظاهر (اختياري)', value: /^https?:/.test(txt) ? '' : txt });
    const range = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    modal({ title: 'إدراج رابط', body: [el('div', { class: 'fld' }, [el('label', { text: 'الرابط' }), u]), el('div', { class: 'fld' }, [el('label', { text: 'النص' }), t])], acts: [{ t: 'أدرج', cls: 'dark', fn: function () {
      const href = u.value.trim(); if (!/^https?:\/\//.test(href)) { toast('اكتب رابطاً يبدأ بـ https://'); return; }
      ed.focus(); if (range) { const s2 = window.getSelection(); s2.removeAllRanges(); s2.addRange(range); }
      const a = el('a', { href: href, text: t.value.trim() || href });
      if (range && !range.collapsed) range.deleteContents(); (range || document.createRange()).insertNode(a); onChange();
    } }, { t: 'إلغاء' }] });
  }
  const bar = el('div', { class: 'row capfmt', role: 'toolbar', 'aria-label': 'تنسيق' }, [
    el('button', { type: 'button', class: 'ib sm', title: 'غامق (Ctrl+B)', onmousedown: function (e) { e.preventDefault(); }, onclick: function () { cmd('bold'); } }, [el('b', { text: 'B' })]),
    el('button', { type: 'button', class: 'ib sm', title: 'مائل (Ctrl+I)', onmousedown: function (e) { e.preventDefault(); }, onclick: function () { cmd('italic'); } }, [el('i', { text: 'I' })]),
    el('button', { type: 'button', class: 'ib sm', title: 'تحته خط (Ctrl+U)', onmousedown: function (e) { e.preventDefault(); }, onclick: function () { cmd('underline'); } }, [el('u', { text: 'U' })]),
    el('button', { type: 'button', class: 'ib sm', title: 'مشطوب', onmousedown: function (e) { e.preventDefault(); }, onclick: function () { cmd('strikeThrough'); } }, [el('s', { text: 'S' })]),
    el('button', { type: 'button', class: 'ib sm', title: 'اقتباس', onmousedown: function (e) { e.preventDefault(); }, onclick: quote }, ['❝']),
    el('button', { type: 'button', class: 'ib sm', title: 'رابط', onmousedown: function (e) { e.preventDefault(); }, onclick: link }, [ico('link')]),
    el('button', { type: 'button', class: 'ib sm', title: 'إزالة التنسيق', onmousedown: function (e) { e.preventDefault(); }, onclick: function () { cmd('removeFormat'); } }, ['✕']),
    el('span', { class: 'sp' }),
    emojiBtn(ed)
  ]);
  return { ed: ed, bar: bar, get: function () { return edToTg(ed); }, set: function (tg) { ed.innerHTML = tgToEd(tg || ''); onChange(); } };
}

/* ---------- نافذة النص المصاحب والنشر ----------
   العمود الأيمن: القالب الكتابي والحقول والمحرر. العمود الأيسر: المعاينة ثم صندوق النشر (ظاهر دائماً بلا تمرير).
   زر الإرسال يحكي حاله: «أرسل الآن» ← مشغول ← «✓ أُرسل»، و«جدول النشر» ← «✓ جُدول في…» ويبقى كذلك، فإن غيّرت الموعد أو النص عاد زراً «حدّث الجدولة». */
const REPEAT_N = { day: 'كل يوم', week: 'كل أسبوع', month: 'كل شهر' };
function repeatLabel(r) { if (!r) return ''; const base = REPEAT_N[r.every] || ''; const n = r.n > 1 ? (r.every === 'day' ? 'كل ' + r.n + ' أيام' : r.every === 'week' ? 'كل ' + r.n + ' أسابيع' : 'كل ' + r.n + ' أشهر') : base; return n + (r.count ? ' · ' + r.count + ' مرات' : '') + (r.until ? ' · حتى ' + fmtDate(r.until) : ''); }
// محرر التكرار (يُستعمل هنا وفي التقويم): يعيد {node, get()}
function repeatEditor(initial, onChange) {
  const r = Object.assign({ every: '', n: 1, until: 0, count: 0 }, initial || {});
  const every = el('select', { class: 'inp sm', 'aria-label': 'التكرار' }, [['', 'بلا تكرار'], ['day', 'كل يوم'], ['week', 'كل أسبوع'], ['month', 'كل شهر']].map(function (o) { return el('option', { value: o[0], text: o[1], selected: o[0] === r.every }); }));
  const n = el('input', { type: 'number', class: 'inp sm', min: '1', max: '12', value: String(r.n || 1), 'aria-label': 'كل كم' });
  const endMode = el('select', { class: 'inp sm', 'aria-label': 'ينتهي' }, [['never', 'بلا نهاية'], ['count', 'بعد عدد مرات'], ['until', 'حتى تاريخ']].map(function (o) { return el('option', { value: o[0], text: o[1], selected: (r.count ? 'count' : r.until ? 'until' : 'never') === o[0] }); }));
  const cnt = el('input', { type: 'number', class: 'inp sm', min: '2', max: '365', value: String(r.count || 4), 'aria-label': 'عدد المرات' });
  const until = el('input', { type: 'date', class: 'inp sm', value: r.until ? localISO(new Date(r.until)) : '', 'aria-label': 'حتى تاريخ' });
  const detail = el('div', { class: 'row wrapr repdetail' });
  const summary = el('small', { class: 'tiny repsum' });
  function get() {
    if (!every.value) return null;
    const o = { every: every.value, n: Math.max(1, Math.min(12, +n.value || 1)), until: 0, count: 0 };
    if (endMode.value === 'count') o.count = Math.max(2, Math.min(365, +cnt.value || 2));
    if (endMode.value === 'until' && until.value) { const d = fromISO(until.value, '23:59'); if (d) o.until = d.getTime(); }
    return o;
  }
  function draw() {
    const on = !!every.value; detail.hidden = !on; detail.innerHTML = '';
    if (on) { [el('span', { class: 'tiny', text: 'كل' }), n, el('span', { class: 'tiny', text: every.value === 'day' ? 'يوم' : every.value === 'week' ? 'أسبوع' : 'شهر' }), el('span', { class: 'tiny', text: '·' }), endMode, endMode.value === 'count' ? cnt : null, endMode.value === 'until' ? until : null].forEach(function (x) { if (x) detail.appendChild(x); }); }
    const g = get(); summary.textContent = g ? 'يُنشر ' + repeatLabel(g) + '، ويظهر كل موعد في التقويم' : '';
    if (onChange) onChange(g);
  }
  [every, n, endMode, cnt, until].forEach(function (x) { x.addEventListener('change', draw); x.addEventListener('input', function () { const g = get(); summary.textContent = g ? 'يُنشر ' + repeatLabel(g) : ''; if (onChange) onChange(g); }); });
  draw();
  return { node: el('div', { class: 'repbox' }, [el('div', { class: 'row wrapr' }, [ico('history'), every]), detail, summary]), get: get };
}
// opts: { later: يفتح على «في موعد»، caption: نص يبدأ به (لإعادة نشر منشور سابق) }
function captionDialog(opts) {
  if (!ED.doc) return;
  opts = opts || {};
  commitPage();
  const kindGuess = { ann: 'ann', comp: 'comp', thanks: 'thanks', quote: 'quote', daily: 'daily', cover: 'ann', yt: 'ann', social: 'ann' }[S.tpl.type] || 'ann';
  let date = new Date(), tplId = (ls('capTpl') || {})[S.tpl.type] || (capTemplates().find(function (c) { return c.kind === kindGuess; }) || CAP_BASE[0]).id;
  let vars = capVars(date), manual = false;
  const prev = el('div', { class: 'tgprev' }), cnt = el('span', { class: 'tiny capcnt' });
  const img = el('img', { class: 'tgimg', alt: '' }); try { img.src = ED.snapshot(700); } catch (e) {}
  const sel = el('select', { class: 'inp sm', 'aria-label': 'القالب الكتابي' }, capTemplates().map(function (c) { return el('option', { value: c.id, text: (c.own ? '★ ' : '') + c.name + ' · ' + ((CAP_KINDS.find(function (k) { return k[0] === c.kind; }) || [])[1] || ''), selected: c.id === tplId }); }));
  const dateI = el('input', { type: 'date', class: 'inp sm', value: localISO(date), 'aria-label': 'تاريخ الفعالية', onchange: function (e) { const d = fromISO(e.target.value, '12:00'); if (d) { date = d; const t = dateTokens(date, 0); vars.wd = t.wd; vars.hijri = t.hd + ' ' + t.hm; vars.greg = t.gd + ' ' + t.gm; drawFields(); fromFields(); } } });
  let bubbleWrap = null, ready = false;   // تُعرَّف لاحقاً؛ render يُستدعى مبكراً
  const E = capEditor('', render);
  const fieldsBox = el('div', { class: 'capfields' });
  function curTpl() { return capTemplates().find(function (x) { return x.id === sel.value; }) || CAP_BASE[0]; }
  function drawFields() {
    const used = []; String(curTpl().text).replace(/\{(\w+)\}/g, function (_, k) { if (used.indexOf(k) < 0) used.push(k); });
    fieldsBox.replaceChildren(el('div', { class: 'row' }, [el('b', { text: 'املأ الحقول' }), el('small', { class: 'tiny', text: 'ما يُترك فارغاً يُحذف سطره من الرسالة' })]),
      el('div', { class: 'capfgrid' }, used.filter(function (k) { return ['wd', 'hijri', 'greg'].indexOf(k) < 0; }).map(function (k) {
        const lab = (CAP_VARS.find(function (v) { return v[0] === k; }) || [k, k])[1], long = ['body', 'quote', 'sub'].indexOf(k) >= 0;
        const inp = el(long ? 'textarea' : 'input', Object.assign({ class: 'inp sm', dir: k === 'link' ? 'ltr' : 'auto', 'aria-label': lab, oninput: function (e) { vars[k] = e.target.value; fromFields(); } }, long ? { rows: '2' } : { type: 'text' }));
        inp.value = vars[k] || '';
        return el('div', { class: 'fld' }, [el('label', { text: lab }), k === 'link' ? inp : withEmoji(inp, { sm: true })]);
      })));
  }
  function fromFields() { manual = false; E.set(capFill(curTpl().text, vars)); }
  const LIMIT = 1000;   // مثل الخادم: ما زاد يُرسل رسالةً ترد على الصورة
  function render() {
    const tg = E.get(); prev.innerHTML = capToHtml(tg); const n = capPlain(tg).length;
    cnt.textContent = n + ' / ' + LIMIT + (n > LIMIT ? ' — طويل: يُرسل نصاً مستقلاً تحت الصورة تلقائياً (حتى ٤٠٩٦)' : '');
    cnt.classList.toggle('over', n > LIMIT); cnt.classList.toggle('err', n > 4096);
    if (bubbleWrap) bubbleWrap.classList.toggle('split', n > LIMIT);
    if (ready) dirty();
  }
  E.ed.addEventListener('input', function () { manual = true; });
  sel.onchange = function () { tplId = sel.value; const m = ls('capTpl') || {}; m[S.tpl.type] = tplId; ls('capTpl', m); manual = false; drawFields(); fromFields(); };
  drawFields(); fromFields();
  if (opts.caption) { E.set(opts.caption); manual = true; }
  // توجيه المساعد: تعليمات لهذه المرة، فوق تعليمات البرنامج/المنصة الثابتة (من الإدارة)
  const P = V6.prog || {}, fixedPrompt = (P.tg && P.tg.capPrompt) || (V6.settings && V6.settings.ai && V6.settings.ai.capPrompt) || '';
  const guide = el('textarea', { rows: '2', class: 'inp sm', dir: 'auto', placeholder: 'توجيه للمساعد هذه المرة (اختياري): مثلاً «اجعلها قصيرة وحماسية، وابدأ بسؤال»' });
  const guideBox = el('details', { class: 'capguide' }, [el('summary', {}, [ico('ai'), 'كيف يصوغ المساعد؟']), withEmoji(guide, { sm: true }),
    el('small', { class: 'tiny', text: fixedPrompt ? 'تعليمات البرنامج الثابتة: ' + fixedPrompt.slice(0, 160) + (fixedPrompt.length > 160 ? '…' : '') : (isAdmin() ? 'يمكنك كتابة تعليمات ثابتة لأسلوب الرسائل من «البرامج والهويات ← القناة».' : 'تعليمات الأسلوب الثابتة يكتبها مشرف البرنامج.') })]);
  const tools = el('div', { class: 'row wrapr' }, [
    aiReady() ? el('button', { type: 'button', class: 'btn sm line', onclick: function (e) { return withBusy(e.currentTarget, async function () { E.set(await captionAI(E.get(), sel.value, date, vars, guide.value.trim())); manual = true; toast('صاغه المساعد، راجعه وعدّل ما شئت'); }, { busy: 'يصوغ…', done: 'صيغ' }); } }, [ico('ai'), 'صِغه بالذكاء']) : null,
    el('button', { type: 'button', class: 'btn sm ghost', text: 'أعد من القالب', onclick: function () { manual = false; fromFields(); } }),
    el('span', { class: 'sp' }), cnt]);
  // المعاينة: فاتحة افتراضياً، وداكنة اختياراً
  let theme = ls('tgTheme') || 'light';
  bubbleWrap = el('div', { class: 'tgwrap ' + theme }, [el('div', { class: 'tgbubble' }, [img, prev, el('span', { class: 'tgtime', text: new Intl.DateTimeFormat('ar', { hour: 'numeric', minute: '2-digit' }).format(new Date()) })]), el('p', { class: 'tiny splitnote', text: 'النص أطول من حد الوصف؛ يُرسل رسالةً ثانية تحت الصورة.' })]);
  const themeSeg = segOf([['light', 'فاتح'], ['dark', 'داكن']], theme, function (v) { theme = v; ls('tgTheme', v); bubbleWrap.className = 'tgwrap ' + v + (bubbleWrap.classList.contains('split') ? ' split' : ''); });
  // الإرسال والجدولة
  let mode = ls('tgMode') || 'both', whenMode = 'now', scheduled = null;   // scheduled: {id, when} بعد الجدولة
  const modeSeg = segOf([['both', 'صورة + الملف الأصلي'], ['photo', 'صورة فقط'], ['doc', 'الملف الأصلي فقط']], mode, function (v) { mode = v; ls('tgMode', v); dirty(); });
  const dI = el('input', { type: 'date', class: 'inp sm', 'aria-label': 'تاريخ النشر', min: localISO() }), tI = el('input', { type: 'time', class: 'inp sm', value: '08:00', 'aria-label': 'وقت النشر' });
  [dI, tI].forEach(function (x) { x.addEventListener('change', dirty); x.addEventListener('input', dirty); });
  function whenMs() { if (whenMode === 'now') return 0; if (!dI.value) return -1; const d = fromISO(dI.value, tI.value || '08:00'); return d ? d.getTime() : -1; }
  function preset(days, hm) { const d = new Date(); d.setDate(d.getDate() + days); dI.value = localISO(d); tI.value = hm; dirty(); }
  const rep = repeatEditor(null, function () { dirty(); });
  const schedBox = el('div', { class: 'capwhen', hidden: true }, [el('div', { class: 'row wrapr' }, [dI, tI]), el('div', { class: 'row wrapr' }, [
    el('button', { type: 'button', class: 'btn sm ghost', text: 'غداً ٨ ص', onclick: function () { preset(1, '08:00'); } }),
    el('button', { type: 'button', class: 'btn sm ghost', text: 'غداً ٨ م', onclick: function () { preset(1, '20:00'); } }),
    el('button', { type: 'button', class: 'btn sm ghost', text: 'بعد ساعة', onclick: function () { const d = new Date(Date.now() + 3600000); dI.value = localISO(d); tI.value = localHM(d); dirty(); } })]), rep.node]);
  const whenSeg = segOf([['now', 'الآن'], ['later', 'في موعد']], whenMode, function (v) { whenMode = v; schedBox.hidden = v !== 'later'; if (v === 'later' && !dI.value) preset(1, '08:00'); scheduled = null; sent = false; refreshBtn(); });
  const sendBtn = el('button', { type: 'button', class: 'btn dark' }, [ico('send'), 'أرسل الآن']);
  const after = el('div', { class: 'row wrapr capafter', hidden: true });
  let sent = false, lastSig = '', armed = false, armT = 0;
  function sig() { return [whenMs(), E.get(), mode, JSON.stringify(rep.get())].join('|'); }
  function refreshBtn() {
    if (armed) disarm();
    btnReset(sendBtn); sendBtn.classList.remove('done', 'arm'); sendBtn.title = ok ? '' : why;
    if (scheduled && sig() === lastSig) { btnDone(sendBtn, 'جُدول في ' + fmtTime(scheduled.when), 0, true); return; }
    if (sent && sig() === lastSig) { btnDone(sendBtn, 'أُرسل إلى القناة', 0, true); return; }
    if (scheduled) { sendBtn.replaceChildren(ico('cal'), 'حدّث الجدولة'); return; }
    sendBtn.replaceChildren(ico(whenMode === 'later' ? 'cal' : 'send'), whenMode === 'later' ? 'جدول النشر' : (sent ? 'أرسل مرة أخرى' : 'أرسل الآن'));
  }
  function dirty() { if (!ready || sendBtn._busyRun) return; refreshBtn(); }
  const ok = canSend(), why = sendWhy();
  if (!ok) { sendBtn.disabled = true; sendBtn.title = why; }
  const chatOf = pubChatName;
  function thumbB64() { try { const c = document.createElement('canvas'); renderTo(c, S.tpl, S.size, snap(), S.track, 320 / SIZES[S.size].w); return c.toDataURL('image/jpeg', 0.72).split(',')[1]; } catch (e) { return ''; } }
  // الإرسال الفوري بضغطتين على الزر نفسه (بلا نافذة تأكيد فوق النافذة): الأولى تسلّحه «اضغط مرة أخرى للتأكيد»، والثانية ترسل
  function disarm() { armed = false; clearTimeout(armT); sendBtn.classList.remove('arm'); }
  function showErr(msg) {
    after.hidden = false; after.innerHTML = ''; after.classList.add('bad');
    const hint = tgErrHint(msg);
    [ico('close', 'errc'), el('div', { class: 'small errtx' }, [el('b', { text: 'لم يُنشر. ' }), hint || '', el('small', { class: 'tiny', dir: 'auto', text: (hint ? ' (' : '') + (msg || 'تعذّر الاتصال') + (hint ? ')' : '') })]), el('button', { type: 'button', class: 'btn sm line', onclick: function () { after.hidden = true; return send(true); } }, [ico('reset'), 'حاول مرة أخرى'])].forEach(function (x) { after.appendChild(x); });
  }
  async function send(confirmed) {
    const when = whenMs(); if (when < 0 || (when && when < Date.now() + 60000)) { disarm(); toast('اختر موعداً في المستقبل'); dI.focus(); return; }
    if (capPlain(E.get()).length > 4096) { disarm(); toast('النص أطول من حد تليجرام (٤٠٩٦ حرفاً)'); return; }
    const repeat = whenMode === 'later' ? rep.get() : null;
    after.classList.remove('bad');
    // تعديل جدولة قائمة: نحدّث الموعد والنص والتكرار بلا إعادة رفع
    if (scheduled && when) {
      try { await withBusy(sendBtn, async function () { await API6.me('tg_update', JSON.stringify({ id: scheduled.id, when: when, caption: E.get(), mode: mode, repeat: repeat })); scheduled.when = when; lastSig = sig(); POSTS = null; }, { busy: 'نحدّث…', done: 'حُدّثت: ' + fmtTime(when), keep: true }); }
      catch (e) { showErr(e.message); return; }
      showAfter(when); pubRefresh(); return;
    }
    if (!when && !armed && !confirmed) {
      armed = true; btnReset(sendBtn); sendBtn.classList.add('arm');
      sendBtn.replaceChildren(ico('send'), 'اضغط مرة أخرى للإرسال الآن');
      sendBtn.title = 'يُنشر التصميم مع هذا النص في ' + (chatOf() || 'القناة') + ' فوراً';
      armT = setTimeout(function () { disarm(); refreshBtn(); }, 6000);
      return;
    }
    disarm(); btnReset(sendBtn); sendBtn.replaceChildren(ico(when ? 'cal' : 'send'), when ? 'جدول النشر' : 'أرسل الآن');   // ما يعود إليه الزر إن أخفق
    try { await withBusy(sendBtn, async function () {
      await ensureFonts(fontsOfState(snap()));
      const c = document.createElement('canvas'); renderTo(c, S.tpl, S.size, snap(), S.track, 2);
      const png = c.toDataURL('image/png').split(',')[1];
      const r = await API6.me('tg_send', JSON.stringify({ program: V6.prog.id, track: S.track && S.track.id, name: ED.doc.name, item: ED.doc.id || '', caption: E.get(), png: mode === 'doc' ? '' : png, file: mode === 'photo' ? '' : png, fileName: fileName6('png'), fileMime: 'image/png', mode: mode, when: when || 0, repeat: repeat }));
      track('tg', { tool: when ? 'schedule' : 'send' }); archive6('share'); POSTS = null;
      if (ED.pubIds) ED.pubIds.push(r.id);   // منشورات هذه الجلسة تظهر في «النشر» ولو لم يُحفظ التصميم
      if (r.queued) { scheduled = { id: r.id, when: r.when }; sent = false; } else { sent = true; scheduled = null; if (r.link) lastLink = r.link; }
      lastSig = sig();
      notifyDone(r.queued ? 'جُدول النشر' : 'أُرسل إلى القناة', r.queued ? fmtTime(r.when) : '');
      showAfter(r.queued ? r.when : 0, r.link, r.next);
      pubRefresh();
    }, { busy: when ? 'نجدول…' : 'نرسل…', done: when ? 'جُدول في ' + fmtTime(when) : 'أُرسل إلى القناة', keep: true }); }
    catch (e) { showErr(e.message); }
  }
  let lastLink = '';
  function showAfter(when, link, next) {
    after.hidden = false; after.innerHTML = ''; after.classList.remove('bad');
    [ico('check', 'okc'), el('span', { class: 'small', text: when ? 'في التقويم: ' + fmtTime(when) + (next ? ' · التالي ' + fmtTime(next) : '') : 'نُشر في قناة ' + V6.prog.name + (next ? ' · التالي ' + fmtTime(next) : '') }),
      el('a', { class: 'btn sm line', href: '#/cal' + (when ? '?d=' + localISO(new Date(when)) : ''), onclick: function () { closeAll(); } }, [ico('cal'), 'افتح التقويم']),
      link ? el('a', { class: 'btn sm ghost', href: link, target: '_blank', rel: 'noopener' }, [ico('link'), 'رابط المنشور']) : null,
      when && scheduled ? el('button', { type: 'button', class: 'btn sm ghost', onclick: async function () { if (!(await ask('إلغاء الجدولة', 'لن يُنشر هذا المنشور.', 'ألغِ', true))) return; try { await API6.me('tg_cancel', scheduled.id); scheduled = null; POSTS = null; after.hidden = true; refreshBtn(); toast('أُلغيت الجدولة'); pubRefresh(); } catch (e) { toast(e.message); } } }, ['إلغاء الجدولة']) : null].forEach(function (x) { if (x) after.appendChild(x); });
    flashOk(after);
  }
  let closeAll = function () {};
  sendBtn.onclick = function () { return send(); };
  if (opts.later && ok) { const lb = $$('button', whenSeg).find(function (x) { return /موعد/.test(x.textContent); }); if (lb) lb.click(); }
  const sendBox = el('div', { class: 'capsend' }, [el('div', { class: 'row' }, [el('h4', { class: 'psh', text: 'النشر في ' + (chatOf() || 'القناة') }), el('span', { class: 'sp' }), whenSeg]),
    ok ? el('small', { class: 'tiny', text: 'الآن أو في موعد تحدده، ويظهر كل منشور في «النشر» والتقويم.' }) : el('small', { class: 'tiny warnline', text: why + ' حتى ذلك الحين: انسخ النص وأرسله بنفسك.' }),
    schedBox, modeSeg,
    el('div', { class: 'row wrapr' }, [sendBtn, el('button', { type: 'button', class: 'btn line', onclick: function (e) { copyText(capPlain(E.get())); btnDone(e.currentTarget, 'نُسخ'); } }, [ico('copy'), 'انسخ النص']), el('button', { type: 'button', class: 'btn sm ghost', title: 'للصق في بوت أو أداة تقبل وسوم HTML', onclick: function (e) { copyText(E.get()); btnDone(e.currentTarget, 'نُسخ'); } }, ['نسخ بالتنسيق'])]),
    after]);
  const m = modal({ title: 'النص المصاحب والنشر', wide: true, body: [
    el('div', { class: 'capgrid' }, [
      el('div', { class: 'capl' }, [el('div', { class: 'row wrapr' }, [el('div', { class: 'fld grow' }, [el('label', { text: 'القالب الكتابي' }), sel]), el('div', { class: 'fld' }, [el('label', { text: 'تاريخ الفعالية' }), dateI])]), fieldsBox,
        el('div', { class: 'capedwrap' }, [E.bar, E.ed]), tools, guideBox]),
      el('div', { class: 'capr' }, [el('div', { class: 'row' }, [el('b', { text: 'المعاينة' }), el('span', { class: 'sp' }), themeSeg]), bubbleWrap, sendBox])
    ])
  ], acts: [{ t: 'إغلاق' }] });
  closeAll = m.close; ready = true; refreshBtn();
  setTimeout(render, 0);
}
// للنسخ واللصق اليدوي في تليجرام: نزيل الوسوم ونبقي النص (تليجرام الهاتف يطبّق التنسيق من قائمته)
function capToTgMarkdownless(t) { return capPlain(t); }
async function captionAI(current, tplId, date, vars0, guide) {
  const P = V6.prog || {}, vars = vars0 || capVars(date), c = capTemplates().find(function (x) { return x.id === tplId; });
  const fixed = (P.tg && P.tg.capPrompt) || (V6.settings && V6.settings.ai && V6.settings.ai.capPrompt) || '';
  const system = ['أنت محرر رسائل قناة تليجرام لبرنامج تربوي عربي. اكتب نصاً مصاحباً لتصميم إعلان، بالعربية الفصيحة السهلة، بأسلوب رسائل البرنامج التالية.',
    'التنسيق: وسوم تليجرام فقط: <b> <i> <u> <blockquote>، وأسطر فارغة بين الفقرات، ورموز تعبيرية قليلة في أول السطر كما في النماذج. لا تتجاوز ٩٠٠ حرف.',
    'لا تخترع معلومة لم تُعطَ: لا وقتاً ولا مكاناً ولا رابطاً ولا اسماً. اترك ما لم يُعطَ. يمكنك إضافة اقتباس قصير موثوق (آية أو حديث صحيح أو حكمة) مناسب للموضوع إن لم يُعطَ اقتباس، مع نسبته باختصار.',
    fixed ? 'تعليمات البرنامج الثابتة لأسلوب الرسائل (التزم بها): ' + fixed.slice(0, 4000) : '',
    P.samples ? 'نماذج من رسائل البرنامج (تعلّم منها الأسلوب والبنية):\n' + P.samples.slice(0, 12000) : 'نموذج للأسلوب:\n' + CAP_BASE[0].text + '\n' + CAP_BASE[3].text,
    c ? 'القالب الكتابي المختار (التزم ببنيته): ' + c.text : ''].filter(Boolean).join('\n\n');
  const prompt = 'معلومات التصميم:\n' + Object.keys(vars).filter(function (k) { return vars[k]; }).map(function (k) { return k + ': ' + vars[k]; }).join('\n') + (guide ? '\n\nتوجيه خاص بهذه الرسالة من المستخدم (له الأولوية): ' + guide.slice(0, 600) : '') + (current ? '\n\nالمسودة الحالية (حسّنها وأكملها):\n' + current : '');
  const raw = await API6.call('ai_make', V6.token, JSON.stringify({ kind: 'caption', program: P.id, system: system, prompt: prompt, schema: { type: 'OBJECT', properties: { caption: { type: 'STRING' } }, required: ['caption'] }, temperature: 0.7 }));
  const r = JSON.parse(raw); if (!r.caption) throw new Error('لم يُعد المساعد نصاً');
  return String(r.caption).replace(/<(?!\/?(b|i|u|s|code|blockquote|a)\b)[^>]*>/g, '').trim();
}

/* ---------- لوحة «النشر» في المحرر: كل ما يخص نشر هذا التصميم في مكان واحد ----------
   النص المصاحب والإرسال الآن أو الجدولة (النافذة نفسها)، ثم منشورات هذا التصميم بحالتها وموعدها: تعديل، إلغاء، إعادة جدولة، إعادة نشر.
   المنشورات تُعرف بمعرّف التصميم (item)؛ وغير المحفوظ تظهر له منشورات هذه الجلسة. */
const PUB = { list: null, at: 0, busy: false };
function pubMine(x) { const d = ED.doc || {}, ids = ED.pubIds || []; return (d.id && x.item === d.id) || ids.indexOf(x.id) >= 0 || (x.seriesId && ids.indexOf(x.seriesId) >= 0); }
async function pubLoad(force) {
  if (!force && PUB.list && PUB.doc === (ED.doc && ED.doc.id) && Date.now() - PUB.at < 60000) return PUB.list;
  const all = await API6.me('tg_queue', V6.prog ? V6.prog.id : '');
  PUB.list = all; PUB.at = Date.now(); PUB.doc = ED.doc && ED.doc.id;
  return all;
}
// بعد أي إرسال أو تعديل: نعيد رسم اللوحة إن كانت مفتوحة
function pubRefresh() { PUB.at = 0; if (ED.open && ED.tab === 'pub') buildPanel(); }
function pubRow(x) {
  const st = (typeof TG_STATUS !== 'undefined' && TG_STATUS[x.status]) || ['', '', 'info'], queued = x.status === 'queued', canEdit = x.canEdit !== false;
  const th = el('div', { class: 'pubth st-' + x.status, 'data-id': x.id }, [ico(st[2] || 'send')]);   // لا مصغّرات: أيقونة الحالة بلونها
  const acts = el('div', { class: 'row wrapr pubacts' });
  if (queued && canEdit) {
    acts.appendChild(el('button', { type: 'button', class: 'btn sm line', onclick: function () { postDialog(x); } }, [ico('pencil'), 'عدّل']));
    acts.appendChild(el('button', { type: 'button', class: 'btn sm ghost', onclick: async function (e) {
      const b = e.currentTarget;
      if (!(await ask('إلغاء الجدولة', 'لن يُنشر هذا المنشور' + (x.repeat ? '، ويتوقف تكراره' : '') + '.', 'ألغِ', true))) return;
      await withBusy(b, async function () { await API6.me('tg_cancel', x.id); x.status = 'cancelled'; POSTS = null; }, { busy: 'نلغي…', done: 'أُلغي' }).then(function () { setTimeout(pubRefresh, 600); }).catch(function () {});
    } }, ['ألغِ']));
  } else if (canEdit) {
    acts.appendChild(el('button', { type: 'button', class: 'btn sm line', title: 'بالصورة والنص نفسيهما في موعد جديد', onclick: function () { PUB.rq = { x: x, known: (PUB.list || []).map(function (y) { return y.id; }) }; requeueDialog(x); } }, [ico('cal'), 'أعد جدولته']));
    acts.appendChild(el('button', { type: 'button', class: 'btn sm ghost', title: 'افتح نافذة النشر بهذا النص مع التصميم الحالي', onclick: function () { captionDialog({ caption: x.caption || '' }); } }, [ico('send'), 'انشره من جديد']));
  }
  if (x.link) acts.appendChild(el('a', { class: 'btn sm ghost', href: x.link, target: '_blank', rel: 'noopener' }, [ico('link'), 'في القناة']));
  return el('div', { class: 'pubrow ' + (x.status || '') }, [
    el('button', { type: 'button', class: 'pubmain', title: 'التفاصيل والنص', onclick: function () { postDialog(x); } }, [th,
      el('div', { class: 'pubinfo' }, [
        el('div', { class: 'row wrapr' }, [el('span', { class: 'pill ' + st[1] }, [ico(st[2]), st[0]]), x.repeat ? el('span', { class: 'pill' }, [ico('history'), repeatLabel(x.repeat)]) : null]),
        el('b', { class: 'pubtime', text: fmtTime(x.status === 'sent' && x.sentAt ? x.sentAt : x.when) }),
        el('small', { class: 'tiny pubcap', text: capPlain(x.caption || '').replace(/\s+/g, ' ').slice(0, 90) || 'بلا نص' }),
        x.err ? el('small', { class: 'tiny err', text: 'سبب الفشل: ' + x.err }) : null,
        !x.mine && x.name ? el('small', { class: 'tiny', text: 'نشره ' + x.name }) : null
      ])]),
    acts.children.length ? acts : null
  ]);
}
function pPub(b) {
  const ok = canSend();
  b.appendChild(panelHead('النشر', 'النص المصاحب، والإرسال إلى قناة البرنامج الآن أو في موعد، ومتابعة ما نشرته من هذا التصميم.'));
  b.appendChild(el('div', { class: 'pubto' + (ok ? '' : ' warn') }, [ico(ok ? 'send' : 'info'), el('span', { text: ok ? 'إلى ' + (pubChatName() || 'القناة') : sendWhy() + ' ويمكنك نسخ النص وإرساله بنفسك.' })]));
  b.appendChild(el('div', { class: 'pubgo' }, [
    el('button', { type: 'button', class: 'btn dark', id: 'pub_cap', onclick: function () { captionDialog(); } }, [ico('send'), ok ? 'اكتب النص وأرسل' : 'اكتب النص']),
    ok ? el('button', { type: 'button', class: 'btn line', id: 'pub_later', onclick: function () { captionDialog({ later: true }); } }, [ico('cal'), 'جدوله في موعد']) : null
  ]));
  b.appendChild(el('h4', { class: 'psh', text: 'منشورات هذا التصميم' }));
  b.appendChild(el('p', { class: 'tiny', text: 'ما أُرسل أو جُدول منه، بحالته وموعده. انقر منشوراً لتفاصيله وتعديل نصه.' }));
  if (!ED.doc.id) b.appendChild(el('div', { class: 'pubsave' }, [el('span', { class: 'small', text: 'لم يُحفظ هذا التصميم بعد، فتظهر هنا منشورات هذه الجلسة فقط. احفظه ليُربط به كل ما تنشره منه.' }), el('button', { type: 'button', class: 'btn sm line', onclick: function () { saveDialog(function () { pubRefresh(); }); } }, [ico('heart'), 'احفظه'])]));
  const box = el('div', { class: 'publist', 'aria-live': 'polite' }, [el('p', { class: 'tiny' }, [el('span', { class: 'spin' }), ' نجلب المنشورات…'])]);
  b.appendChild(box);
  b.appendChild(el('a', { class: 'btn sm ghost pubcal', href: '#/cal' }, [ico('cal'), 'كل منشورات البرنامج في التقويم']));
  // إن عدّل منشوراً من نوافذ التقويم (التفاصيل، إعادة الجدولة) نعيد رسم القائمة هنا
  if (typeof CAL !== 'undefined') CAL.redraw = function () { pubRefresh(); };
  const doc = ED.doc;
  pubLoad().then(function (all) {
    if (ED.doc !== doc || !box.isConnected) return;
    // ما أُعيدت جدولته من هنا نسخة جديدة بمعرّف جديد؛ نضمّها إلى منشورات الجلسة (للتصميم غير المحفوظ)
    if (PUB.rq) all.forEach(function (y) { if (PUB.rq.known.indexOf(y.id) < 0 && y.caption === PUB.rq.x.caption && y.title === PUB.rq.x.title && ED.pubIds.indexOf(y.id) < 0) ED.pubIds.push(y.id); });
    const mine = all.filter(pubMine), up = mine.filter(function (x) { return x.status === 'queued'; }).sort(function (a, c) { return a.when - c.when; }), past = mine.filter(function (x) { return x.status !== 'queued'; }).sort(function (a, c) { return (c.sentAt || c.when) - (a.sentAt || a.when); });
    box.innerHTML = '';
    if (!mine.length) { box.appendChild(el('div', { class: 'pubempty' }, [ico('send'), el('span', { text: 'لم يُنشر من هذا التصميم شيء بعد.' })])); return; }
    if (up.length) { box.appendChild(el('div', { class: 'pubgrp', text: 'القادمة (' + up.length + ')' })); up.forEach(function (x) { box.appendChild(pubRow(x)); }); }
    if (past.length) { box.appendChild(el('div', { class: 'pubgrp', text: 'السابقة (' + past.length + ')' })); past.slice(0, 20).forEach(function (x) { box.appendChild(pubRow(x)); }); }
  }).catch(function (e) { if (!box.isConnected) return; box.innerHTML = ''; box.appendChild(el('p', { class: 'err small', text: 'تعذّر جلب المنشورات: ' + e.message })); box.appendChild(el('button', { type: 'button', class: 'btn sm line', onclick: function () { pubRefresh(); } }, [ico('reset'), 'أعد المحاولة'])); });
}
