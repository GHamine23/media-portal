/* ================= أدوات الدرس: تعين المربي في تصميم الدرس وتقديمه =================
   في المحرر (تبويب المحتوى في العروض): إجابات الطلاب بنموذج قوقل، الأسماء والفرق، كاهوت، ورقة عمل.
   في العرض الحي: القلم والتحديد والليزر والممحاة، القرعة، نقاط الفرق، نتائج الأسئلة ورمز الدخول.
   ما يخص العرض يُحفظ معه: ED.doc.lesson = { form, names: [], teams: [{n, c, p}] } — ولا يُرسل شيء منه إلى أي جهة. */
IC.pen = '<path d="M4 20l1.2-4.6L15.6 5a2.1 2.1 0 0 1 3 3L8.2 18.4z"/><path d="M13.5 7l3 3"/>';
IC.marker = '<path d="M9 14l-4 4v2h4l4-4"/><path d="M9 14l6-9 4 4-9 6z"/><path d="M3 21h18" opacity=".5"/>';
IC.laser = '<circle cx="12" cy="12" r="3.2" fill="currentColor"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>';
IC.eraser = '<path d="M8 20h12"/><path d="M5.5 15.5l9-9a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L13 18h-4.5z"/><path d="M9.5 11.5l5 5"/>';
IC.dice = '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/>';
IC.trophy = '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>';
IC.qr = '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>';
IC.sheet = '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 12h6M10 15.5h6M10 19h3"/>';

const TEAM_COL = ['#e5484d', '#1a71fd', '#2f9e5c', '#f08c00', '#8e4ec6', '#0f9fb5'];
const TEAM_NAMES = ['الفريق الأول', 'الفريق الثاني', 'الفريق الثالث', 'الفريق الرابع', 'الفريق الخامس', 'الفريق السادس'];
const LETTERS_AR = 'أبجدهو';
function lessonOf(doc) { doc = doc || ED.doc; return (doc.lesson = doc.lesson || {}); }
function plainQ(s) { return String(s == null ? '' : s).replace(/\*/g, '').replace(/\s+/g, ' ').trim(); }
function linesQ(s) { return String(s || '').split('\n').map(plainQ).filter(Boolean); }
function ansNum(s) { return parseInt(String(s || '').replace(/[٠-٩]/g, function (c) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(c); }), 10) || 0; }
function arDig(n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); }
// أسئلة العرض من شرائح «سؤال وجواب» بترتيبها
function deckQuiz(doc) {
  doc = doc || ED.doc; if (doc === ED.doc && ED.open && S.tpl) commitPage();
  return doc.pages.map(function (p, i) { return { p: p, i: i }; }).filter(function (x) { return x.p.tpl === 'sl_quiz'; })
    .map(function (x) { return { i: x.i, q: plainQ(x.p.d.q), opts: linesQ(x.p.d.opts).slice(0, 6), ans: ansNum(x.p.d.ans) }; })
    .filter(function (x) { return x.q && x.opts.length >= 2; });
}
function lessonDirty() { try { if (ED.open) markDirty(); } catch (e) {} }
function srvErr(e) { const m = String(e && e.message || e); return /طلب غير معروف/.test(m) ? 'يحتاج الخادم إلى التحديث: الصق كود الخادم الجديد في Apps Script ثم انشر نسخة جديدة.' : m; }
function dlBlob(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
function safeName(s) { return String(s || 'عرض').replace(/[\\/:*?"<>|\n]+/g, ' ').trim().slice(0, 60) || 'عرض'; }

/* ---------- في المحرر: بطاقة «أدوات الدرس» ---------- */
function lessonPanel(b) {
  if (!ED.doc || ED.doc.kind !== 'deck') return;
  const L = lessonOf(), qs = deckQuiz(), names = (L.names || []).length, teams = (L.teams || []).length;
  const tile = function (icon, title, sub, fn, cls) { return el('button', { type: 'button', class: 'ltile ' + (cls || ''), onclick: fn }, [ico(icon), el('span', {}, [el('b', { text: title }), el('small', { text: sub })])]); };
  b.appendChild(el('div', { class: 'lessonsec' }, [
    el('h4', { class: 'psh', text: 'أدوات الدرس' }),
    el('p', { class: 'tiny', text: 'للتفاعل والمسابقات أثناء العرض، وللطباعة والمنصات الأخرى.' }),
    el('div', { class: 'ltiles' }, [
      tile('chart', 'إجابات الطلاب', L.form ? 'نموذج قوقل جاهز' : qs.length ? arDig(qs.length) + ' سؤال في العرض' : 'أضف شريحة «سؤال وجواب»', formDialog, L.form ? 'on' : ''),
      tile('users', 'الأسماء والفرق', (names ? arDig(names) + ' اسماً' : 'للقرعة') + ' · ' + (teams ? arDig(teams) + ' فرق' : 'للمسابقة'), rosterDialog),
      tile('upload', 'كاهوت', 'تصدير الأسئلة أو استيرادها', kahootDialog),
      tile('sheet', 'ورقة عمل للطلاب', 'A4 للطباعة من أسئلة العرض', worksheetFromDeck)
    ]),
    el('p', { class: 'tiny lkeys' }, ['أثناء العرض: القلم ', kb('P'), ' · القرعة ', kb('R'), ' · النقاط ', kb('S'), ' · النتائج ', kb('Q')])
  ]));
}

function kb(k) { return el('kbd', { dir: 'ltr', text: k }); }
/* ---------- إجابات الطلاب بنموذج قوقل ---------- */
function formDialog() {
  const L = lessonOf(), qs = deckQuiz();
  const body = el('div', { class: 'fdlg' });
  const name = el('input', { type: 'checkbox' });
  function fill() {
    body.innerHTML = '';
    body.appendChild(el('p', { class: 'tiny', text: 'ينشئ الموقع نموذج اختبار في قوقل من شرائح «سؤال وجواب»؛ يمسح الطلاب الرمز ويجيبون من هواتفهم، وتعرض النتائج على الشريحة أثناء العرض. لا يُطلب بريد، والاسم اختياري.' }));
    if (!qs.length) { body.appendChild(el('p', { class: 'err', text: 'لا أسئلة في العرض بعد: أضف شريحة «سؤال وجواب» (من + شريحة جديدة) واكتب السؤال وخياراته ورقم الجواب.' })); return; }
    body.appendChild(el('ol', { class: 'fqs' }, qs.map(function (x) { return el('li', {}, [el('b', { text: x.q }), el('small', { text: arDig(x.opts.length) + ' خيارات' + (x.ans ? ' · الصحيح: ' + (x.opts[x.ans - 1] || '—') : ' · بلا جواب صحيح') })]); })));
    if (!L.form) {
      body.appendChild(el('label', { class: 'tog' }, [name, el('span', { text: 'أضف سؤالاً اختيارياً عن اسم الطالب' })]));
      body.appendChild(el('button', { type: 'button', class: 'btn dark', onclick: function (e) { make(e.currentTarget); } }, [ico('sparkles'), 'أنشئ النموذج']));
      return;
    }
    const f = L.form, changed = JSON.stringify(f.qs || []) !== JSON.stringify(qs.map(function (x) { return x.q; }));
    body.appendChild(el('div', { class: 'flink' }, [el('span', { class: 'tiny', text: 'رابط الطلاب' }), el('code', { dir: 'ltr', text: f.url }),
      el('button', { type: 'button', class: 'btn sm line', onclick: function () { try { navigator.clipboard.writeText(f.url); toast('نُسخ الرابط'); } catch (e) {} } }, [ico('copy'), 'انسخ'])]));
    if (changed) body.appendChild(el('p', { class: 'warn tiny', text: 'تغيّرت أسئلة العرض بعد إنشاء النموذج. حدّثه ليطابقها (يبقى الرابط نفسه).' }));
    body.appendChild(el('div', { class: 'row wrapr' }, [
      el('button', { type: 'button', class: 'btn sm dark', onclick: function () { addJoinQr(f.url); closeModals(); } }, [ico('qr'), 'رمز الدخول في هذه الشريحة']),
      el('button', { type: 'button', class: 'btn sm line', onclick: function (e) { make(e.currentTarget, f.id); } }, [ico('reset'), 'حدّث الأسئلة']),
      el('a', { class: 'btn sm line', href: f.edit, target: '_blank', rel: 'noopener' }, [ico('pencil'), 'افتحه في قوقل'])
    ]));
    const res = el('div', { class: 'fres' }, [el('p', { class: 'tiny', text: 'نجلب النتائج…' })]); body.appendChild(res);
    API6.me('quiz_results', f.id).then(function (r) {
      res.innerHTML = '';
      res.appendChild(el('div', { class: 'row wrapr' }, [el('b', { text: r.n ? arDig(r.n) + ' طالباً أجابوا' : 'لم يُجب أحد بعد' }), el('span', { class: 'sp' }),
        el('button', { type: 'button', class: 'btn sm ghost', onclick: async function () { try { await API6.me('quiz_accept', f.id, !r.accepting); toast(r.accepting ? 'أُوقف استقبال الإجابات' : 'عاد استقبال الإجابات'); fill(); } catch (er) { toast(srvErr(er)); } } }, [r.accepting ? 'أوقف استقبال الإجابات' : 'افتح استقبال الإجابات'])]));
      qs.forEach(function (x, k) { const it = r.items[(f.qs || []).indexOf(x.q)] || r.items[k]; if (it) res.appendChild(resultBars(x, it, true, true)); });
    }).catch(function (e) { res.innerHTML = ''; res.appendChild(el('p', { class: 'err tiny', text: srvErr(e) })); });
  }
  async function make(btn, id) {
    btn.disabled = true; btn.lastChild.textContent = 'ننشئ النموذج…';
    try {
      const rec = await API6.me('quiz_form', JSON.stringify({ id: id || '', program: V6.prog.id, doc: ED.doc.id || '', title: plainQ(ED.doc.name) || 'أسئلة العرض', name: id ? !!(L.form && L.form.name) : name.checked, items: qs.map(function (x) { return { q: x.q, opts: x.opts, ans: x.ans }; }) }));
      L.form = { id: rec.id, url: rec.url, edit: rec.edit, qs: rec.qs, name: !!rec.name }; lessonDirty(); buildPanel();
      toast(id ? '✓ حُدّث النموذج' : '✓ أُنشئ النموذج. أضف رمز الدخول إلى شريحة ليمسحه الطلاب.'); fill();
    } catch (e) { btn.disabled = false; btn.lastChild.textContent = id ? 'حدّث الأسئلة' : 'أنشئ النموذج'; toast(srvErr(e)); }
  }
  fill();
  modal({ title: 'إجابات الطلاب بنموذج قوقل', wide: true, body: [body], acts: [{ t: 'إغلاق' }] });
}
// أعمدة النتائج: لكل خيار عدد من اختاره ونسبته، والصحيح بلونه إن كُشف
function resultBars(x, it, reveal, compact) {
  const tot = Math.max(1, it.total || 0);
  return el('div', { class: 'rbars' + (compact ? ' sm' : '') }, [compact ? el('b', { class: 'rq', text: x.q }) : null].concat(x.opts.map(function (o, i) {
    const c = (it.counts || {})[o] || 0, pc = Math.round(c / tot * 100), ok = reveal && x.ans === i + 1;
    return el('div', { class: 'rb' + (ok ? ' ok' : '') }, [el('span', { class: 'rl', text: LETTERS_AR[i] || String(i + 1) }), el('span', { class: 'rt' }, [el('i', { style: 'width:' + (it.total ? Math.max(2, pc) : 0) + '%' }), el('em', { text: o })]), el('b', { text: arDig(c) + (it.total ? ' · ' + arDig(pc) + '٪' : '') })]);
  })));
}
function addJoinQr(url) {
  const sz = SIZES[S.size] || SIZES.slide, qw = 0.13, qh = qw * sz.w / sz.h;
  const x = +(0.04 + qw / 2).toFixed(4), y = +(1 - 0.09 - qh / 2).toFixed(4);
  addLayer6({ t: 'qr', url: url, w: qw, c: '', bg: '#ffffff', x: x, y: y });
  addLayer6({ t: 'text', txt: 'امسح وأجب', al: 'center', c: '#222222', bgc: '#ffffff', bgp: 0.5, bgr: 1, sz: 0.018, b: 0.6, w: qw * 1.6, x: x, y: +(y + qh / 2 + 0.045).toFixed(4) });
  toast('✓ أُضيف رمز الدخول. يمكنك تكبيره وتحريكه.');
}

/* ---------- الأسماء والفرق ---------- */
function rosterDialog(after) {
  const L = lessonOf();
  const ta = el('textarea', { rows: '7', dir: 'auto', class: 'inp', placeholder: 'اسم في كل سطر', 'aria-label': 'أسماء الطلاب' }); ta.value = (L.names || []).join('\n');
  const cnt = el('small', { class: 'tiny' }); const upd = function () { const n = ta.value.split('\n').filter(function (x) { return x.trim(); }).length; cnt.textContent = n ? arDig(n) + ' اسماً' : 'بلا أسماء: تعمل القرعة بالأرقام'; }; ta.addEventListener('input', upd); upd();
  let teams = JSON.parse(JSON.stringify(L.teams || []));
  const tbox = el('div', { class: 'tteams' });
  function fillTeams() {
    tbox.innerHTML = '';
    teams.forEach(function (t, i) { tbox.appendChild(el('div', { class: 'tt' }, [el('i', { style: 'background:' + t.c }), el('input', { type: 'text', class: 'inp sm', value: t.n, 'aria-label': 'اسم الفريق', oninput: function (e) { t.n = e.target.value.slice(0, 24); } }), el('small', { class: 'tiny', text: arDig(t.p || 0) + ' نقطة' }), el('button', { type: 'button', class: 'ib sm', 'aria-label': 'احذف الفريق', onclick: function () { teams.splice(i, 1); fillTeams(); } }, [ico('close')])])); });
    tbox.appendChild(el('div', { class: 'row wrapr' }, [
      teams.length < 6 ? el('button', { type: 'button', class: 'btn sm line', onclick: function () { const k = teams.length; teams.push({ n: TEAM_NAMES[k], c: TEAM_COL[k], p: 0 }); fillTeams(); } }, [ico('plus'), 'فريق']) : null,
      teams.length ? el('button', { type: 'button', class: 'btn sm ghost', onclick: function () { teams.forEach(function (t) { t.p = 0; }); fillTeams(); } }, [ico('reset'), 'صفّر النقاط']) : null]));
  }
  if (!teams.length) teams = [{ n: TEAM_NAMES[0], c: TEAM_COL[0], p: 0 }, { n: TEAM_NAMES[1], c: TEAM_COL[1], p: 0 }];
  fillTeams();
  modal({ title: 'الأسماء والفرق', wide: true, body: [
    el('h4', { class: 'psh', text: 'أسماء الطلاب (للقرعة)' }), ta, cnt,
    el('p', { class: 'tiny', text: 'تبقى الأسماء في هذا العرض وحده، ولا تُرسل إلى أي مكان.' }),
    el('h4', { class: 'psh', text: 'فرق المسابقة' }), tbox],
    acts: [{ t: 'حفظ', cls: 'dark', fn: function () {
      L.names = ta.value.split('\n').map(function (x) { return x.trim().slice(0, 40); }).filter(Boolean).slice(0, 200);
      L.teams = teams.filter(function (t) { return String(t.n || '').trim(); }).map(function (t, i) { return { n: String(t.n).trim(), c: t.c || TEAM_COL[i % 6], p: +t.p || 0 }; });
      lessonDirty(); if (ED.open) buildPanel(); if (typeof after === 'function') after(); toast('حُفظت');
    } }, { t: 'إلغاء' }] });
}

/* ---------- كاهوت: ملف Excel بقالب كاهوت الرسمي (العناوين في السطر ٨ والأسئلة من السطر ٩) ---------- */
const KH_TIMES = [5, 10, 20, 30, 60, 90, 120, 240];
function kahootDialog() {
  const qs = deckQuiz(); let time = 20;
  const long = qs.filter(function (x) { return x.q.length > 120 || x.opts.some(function (o) { return o.length > 75; }) || x.opts.length > 4; });
  const imp = el('input', { type: 'file', accept: '.xlsx,.csv', hidden: true, onchange: function (e) { const f = e.target.files[0]; e.target.value = ''; if (f) importQuiz(f); } });
  modal({ title: 'كاهوت', wide: true, body: [
    el('h4', { class: 'psh', text: 'صدّر أسئلة العرض' }),
    el('p', { class: 'tiny', text: qs.length ? arDig(qs.length) + ' سؤالاً من شرائح «سؤال وجواب»، في ملف Excel بقالب كاهوت؛ في كاهوت: إنشاء ← إضافة سؤال ← استيراد من جدول، ثم اختر الملف.' : 'لا أسئلة في العرض بعد: أضف شريحة «سؤال وجواب».' }),
    long.length ? el('p', { class: 'warn tiny', text: 'كاهوت يقبل حتى ١٢٠ حرفاً للسؤال، و٧٥ للخيار، وأربعة خيارات؛ ما زاد يُقصّ في ' + arDig(long.length) + ' سؤال.' }) : null,
    el('div', { class: 'fld' }, [el('label', { text: 'وقت كل سؤال' }), segMini([['10', '١٠ ث'], ['20', '٢٠ ث'], ['30', '٣٠ ث'], ['60', 'دقيقة']], '20', function (v) { time = +v; })]),
    el('button', { type: 'button', class: 'btn dark', disabled: !qs.length, onclick: function () { dlBlob(kahootXlsx(qs, time), 'كاهوت - ' + safeName(ED.doc.name) + '.xlsx'); track('tool', { tool: 'kahoot_export' }); toast('✓ نزل الملف'); } }, [ico('download'), 'نزّل ملف كاهوت']),
    el('h4', { class: 'psh', text: 'استورد أسئلة إلى العرض' }),
    el('p', { class: 'tiny', text: 'ملف Excel بقالب كاهوت (أو جدول: السؤال، ثم الخيارات، ثم رقم الجواب الصحيح). يُضاف كل سؤال شريحةَ «سؤال وجواب» بعد الشريحة الحالية.' }),
    imp, el('button', { type: 'button', class: 'btn line', onclick: function () { imp.click(); } }, [ico('upload'), 'اختر ملفاً'])
  ], acts: [{ t: 'إغلاق' }] });
}
function kahootRows(qs, time) {
  const tl = KH_TIMES.indexOf(time) >= 0 ? time : 20;
  const rows = [];
  rows[1] = [null, 'Quiz template'];
  rows[2] = [null, 'أسئلة من منصة الأثر الإعلامي — ' + plainQ(ED.doc && ED.doc.name || '')];
  rows[3] = [null, 'Questions: 120 characters max · answers: 75 characters max · separate several correct answers with a comma.'];
  rows[7] = [null, 'Question - 120 max length', 'Answer 1 - 75 max length', 'Answer 2 - 75 max length', 'Answer 3 - 75 max length', 'Answer 4 - 75 max length', 'Time limit', 'Correct answer(s)'];
  qs.forEach(function (x, k) {
    const o = x.opts.slice(0, 4).map(function (t) { return t.slice(0, 75); }), ans = x.ans >= 1 && x.ans <= o.length ? String(x.ans) : '1';
    rows[8 + k] = [k + 1, x.q.slice(0, 120), o[0] || '', o[1] || '', o[2] || '', o[3] || '', tl, ans];
  });
  return rows;
}
function kahootXlsx(qs, time) { return xlsxOf(kahootRows(qs, time), { widths: [5, 60, 28, 28, 28, 28, 11, 16], bold: 7 }); }

/* ملف xlsx صغير بلا مكتبات: ZIP بلا ضغط، والنصوص في الخلايا مباشرة */
function crc32(u8) { let c, t = crc32.t; if (!t) { t = crc32.t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } } let x = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) x = t[(x ^ u8[i]) & 255] ^ (x >>> 8); return (x ^ 0xFFFFFFFF) >>> 0; }
function zipStore(files) {
  const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
  files.forEach(function (f) {
    const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
    parts.push(new Uint8Array(h.buffer), name, data);
    const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
    cen.push(new Uint8Array(c.buffer), name); off += 30 + name.length + data.length;
  });
  const cl = cen.reduce(function (a, x) { return a + x.length; }, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cl, true); e.setUint32(16, off, true);
  return new Blob(parts.concat(cen, [new Uint8Array(e.buffer)]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
function xmlEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ''); }
function colName(i) { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
function xlsxOf(rows, o) {
  o = o || {};
  const sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"/></sheetViews>' +
    (o.widths ? '<cols>' + o.widths.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>' : '') + '<sheetData>' +
    rows.map(function (r, ri) { if (!r) return ''; return '<row r="' + (ri + 1) + '">' + r.map(function (v, ci) { if (v == null || v === '') return ''; const ref = colName(ci) + (ri + 1), st = o.bold === ri ? ' s="1"' : ''; return typeof v === 'number' ? '<c r="' + ref + '"' + st + '><v>' + v + '</v></c>' : '<c r="' + ref + '" t="inlineStr"' + st + '><is><t xml:space="preserve">' + xmlEsc(v) + '</t></is></c>'; }).join('') + '</row>'; }).join('') +
    '</sheetData></worksheet>';
  return zipStore([
    { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>' },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
    { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>' },
    { name: 'xl/worksheets/sheet1.xml', data: sheet }
  ]);
}
// قراءة xlsx في المتصفح: ZIP بالفهرس المركزي، وفك الضغط بـ DecompressionStream
async function readXlsx(buf) {
  const u = new Uint8Array(buf), dv = new DataView(u.buffer, u.byteOffset, u.byteLength); let e = u.length - 22;
  while (e > 0 && dv.getUint32(e, true) !== 0x06054b50) e--; if (e <= 0) throw new Error('ليس ملف Excel صالحاً');
  const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const files = {};
  for (let k = 0; k < n; k++) {
    const m = dv.getUint16(p + 10, true), cs = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(u.subarray(p + 46, p + 46 + nl)), st = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true);
    files[name] = { m: m, data: u.slice(st, st + cs) }; p += 46 + nl + xl + cl;
  }
  const txt = async function (nm) { const f = files[nm]; if (!f) return ''; if (f.m === 0) return new TextDecoder().decode(f.data); const s = new Blob([f.data]).stream().pipeThrough(new DecompressionStream('deflate-raw')); return await new Response(s).text(); };
  const dec = function (s) { return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&'); };
  const strs = ((await txt('xl/sharedStrings.xml')).match(/<si>[\s\S]*?<\/si>/g) || []).map(function (x) { return dec((x.match(/<t[^>]*>[\s\S]*?<\/t>/g) || []).map(function (t) { return t.replace(/<[^>]+>/g, ''); }).join('')); });
  const sheetName = Object.keys(files).filter(function (k) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(k); }).sort()[0];
  const sheet = await txt(sheetName || 'xl/worksheets/sheet1.xml'), rows = [];
  (sheet.match(/<c\s[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) || []).forEach(function (c) {
    const ref = (c.match(/r="([A-Z]+)(\d+)"/) || []); if (!ref[1]) return;
    let col = 0; for (let i = 0; i < ref[1].length; i++) col = col * 26 + ref[1].charCodeAt(i) - 64; col--;
    const t = (c.match(/\st="([^"]+)"/) || [])[1], v = (c.match(/<v>([\s\S]*?)<\/v>/) || [])[1], is = (c.match(/<is>([\s\S]*?)<\/is>/) || [])[1];
    let val = t === 's' ? strs[+v] : t === 'inlineStr' ? dec((is || '').replace(/<[^>]+>/g, '')) : v != null ? dec(v) : '';
    const r = +ref[2] - 1; (rows[r] = rows[r] || [])[col] = val == null ? '' : String(val);
  });
  return rows;
}
function csvRows(s) { return s.split(/\r?\n/).map(function (l) { const out = []; let cur = '', q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; } else if (ch === '"') q = true; else if (ch === ',' || ch === '\t' || ch === ';') { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; }); }
// من صفوف الجدول إلى أسئلة: قالب كاهوت (السؤال في B بعد سطر العناوين) أو جدول بسيط (السؤال في أول عمود فيه نص)
function quizFromRows(rows) {
  let hdr = rows.findIndex(function (r) { return r && r.some(function (c) { return /^(question(\s*[-–(]|\s*$)|السؤال)/i.test(String(c || '').trim()); }); });
  const start = hdr >= 0 ? hdr + 1 : 0;
  let qc = hdr >= 0 ? rows[hdr].findIndex(function (c) { return /^(question(\s*[-–(]|\s*$)|السؤال)/i.test(String(c || '').trim()); }) : -1;
  const out = [];
  rows.slice(start).forEach(function (r) {
    if (!r) return;
    let c0 = qc >= 0 ? qc : r.findIndex(function (c) { return String(c || '').trim() && isNaN(+c); });
    if (c0 < 0) return;
    const q = plainQ(r[c0]); if (!q) return;
    const rest = r.slice(c0 + 1).map(function (c) { return String(c == null ? '' : c).trim(); });
    // آخر خانتين: الوقت (رقم) ثم الجواب الصحيح (رقم أو أرقام)، إن وُجدتا
    let ans = '', opts = rest;
    const last = rest.map(function (x, i) { return [x, i]; }).filter(function (x) { return x[0]; });
    if (last.length >= 3 && /^[\d,،\s]+$/.test(last[last.length - 1][0])) { ans = last[last.length - 1][0]; opts = rest.slice(0, last[last.length - 1][1]); if (/^\d+(\.\d+)?$/.test(String(opts.filter(Boolean).slice(-1)[0] || '')) && hdr >= 0) opts = opts.slice(0, opts.length - 1); }
    opts = opts.filter(Boolean).slice(0, 6);
    if (opts.length < 2) return;
    out.push({ q: q, opts: opts, ans: parseInt(String(ans).split(/[,،]/)[0], 10) || 0 });
  });
  return out;
}
async function importQuiz(file) {
  let rows;
  try { rows = /\.csv$/i.test(file.name) ? csvRows(await file.text()) : await readXlsx(await file.arrayBuffer()); } catch (e) { toast('تعذّرت قراءة الملف: ' + e.message); return; }
  const qs = quizFromRows(rows);
  if (!qs.length) { toast('لم نجد أسئلة في الملف: السؤال ثم خياران على الأقل في كل سطر'); return; }
  const tpl = TEMPLATES.find(function (t) { return t.id === 'sl_quiz'; });
  commitPage(); const cur = ED.doc.pages[ED.cur];
  qs.forEach(function (x, k) {
    const pg = newPage(tpl, S.track, false); pg.variant = cur.variant; pg.ov = Object.assign({}, cur.ov); pg.bgfx = cur.bgfx;
    pg.d.q = x.q.slice(0, 120); pg.d.opts = x.opts.join('\n'); pg.d.ans = x.ans ? String(x.ans) : ''; pg.d.reveal = false; pg.ph = {};
    ED.doc.pages.splice(ED.cur + 1 + k, 0, pg);
  });
  closeModals(); loadPage(ED.cur + 1); afterPages();
  track('tool', { tool: 'kahoot_import' });
  toast('✓ أُضيف ' + arDig(qs.length) + ' سؤالاً شرائحَ «سؤال وجواب»');
}

/* ---------- ورقة عمل للطلاب من العرض: تُفتح في علامة تبويب جديدة بقالب «ورقة عمل» A4 ---------- */
function worksheetFromDeck() {
  const tpl = TEMPLATES.find(function (t) { return t.id === 'st_work'; }); if (!tpl) { toast('قالب ورقة العمل غير متاح'); return; }
  const qs = deckQuiz(), lines = [];
  qs.forEach(function (x) { lines.push(x.q.replace(/\|/g, '/') + ' | اختيار: ' + x.opts.map(function (o) { return o.replace(/[|؛;]/g, ' '); }).join('؛ ')); });
  // من عناوين الشرائح الأخرى: سؤال مفتوح بسطرين (بلا الغلاف ولا الختام ولا الأسئلة)
  ED.doc.pages.forEach(function (p, i) {
    if (!i || p.tpl === 'sl_quiz' || /end|thanks|cover|close/.test(p.tpl) || lines.length >= 10) return;
    const t = plainQ(p.d && (p.d.title || p.d.h || p.d.head)); if (!t || t.length > 60) return;
    lines.push('اكتب بأسلوبك أهم ما فهمته عن: ' + t.replace(/\|/g, '/') + ' | 2');
  });
  if (!lines.length) { toast('لا أسئلة ولا عناوين في العرض لنبني منها ورقة العمل'); return; }
  const pg = newPage(tpl, S.track, false); pg.size = 'a4';
  pg.d.title = plainQ(ED.doc.name).slice(0, 50) || 'ورقة عمل';
  pg.d.kicker = ('ورقة عمل' + (V6.prog && V6.prog.name ? ' · ' + V6.prog.name : '')).slice(0, 50);
  pg.d.qs = lines.join('\n').slice(0, 2000);
  ls('makePick', { tid: S.track.id, page: pg, back: false });
  const w = window.open(location.href.split('#')[0] + '#/e/' + S.track.id + '/st_work?make', '_blank');
  track('tool', { tool: 'worksheet' });
  toast(w ? '✓ فُتحت ورقة العمل في علامة تبويب جديدة: راجعها ثم نزّلها PDF أو اطبعها.' : 'المتصفح منع علامة التبويب الجديدة: اسمح بالنوافذ المنبثقة لهذا الموقع.');
}

/* ================= في العرض الحي ================= */
function lessonPresent(o) {
  const ov = o.ov, stage = o.stage, bar = o.bar, doc = o.doc, L = doc.lesson || {};
  const api = {}; let idx = 0, page = null, qstate = null;
  const emit = function (m) { if (o.emit) try { o.emit(m); } catch (e) {} };   // نافذة العرض تخبر نافذة المقدّم بما يظهر عند الطلاب
  const isQuiz = function () { return page && page.tpl === 'sl_quiz'; };

  /* ---- القلم والتحديد والليزر والممحاة ---- */
  const cv = el('canvas', { class: 'pdraw', 'aria-hidden': 'true' }); stage.appendChild(cv);
  const pen = { on: false, tool: 'pen', color: '#e5132b', strokes: {}, cur: null, laser: [] };
  const PEN_COLS = [['#e5132b', 'أحمر'], ['#1a71fd', 'أزرق'], ['#2f9e5c', 'أخضر'], ['#111111', 'أسود'], ['#ffffff', 'أبيض']];
  const pal = el('div', { class: 'ppen', hidden: true, role: 'toolbar', 'aria-label': 'أدوات الشرح' });
  function palBtn(tool, icon, label, key) { return el('button', { type: 'button', class: 'pp', 'data-tool': tool, title: label + (key ? ' (' + key + ')' : ''), 'aria-label': label, onclick: function (e) { e.stopPropagation(); setTool(tool); } }, [ico(icon)]); }
  pal.append(palBtn('pen', 'pen', 'قلم', 'P'), palBtn('marker', 'marker', 'قلم تحديد', 'H'), palBtn('laser', 'laser', 'مؤشر ليزر', 'L'), palBtn('eraser', 'eraser', 'ممحاة', 'E'), el('span', { class: 'psep2' }));
  PEN_COLS.forEach(function (c) { pal.appendChild(el('button', { type: 'button', class: 'pc', 'data-c': c[0], title: c[1], 'aria-label': c[1], style: 'background:' + c[0], onclick: function (e) { e.stopPropagation(); pen.color = c[0]; if (pen.tool === 'eraser' || pen.tool === 'laser') setTool('pen'); syncPal(); } })); });
  pal.append(el('span', { class: 'psep2' }), el('button', { type: 'button', class: 'pp', title: 'امسح الشريحة (C)', 'aria-label': 'امسح كل ما كُتب على الشريحة', onclick: function (e) { e.stopPropagation(); clearInk(); } }, [ico('trash')]),
    el('button', { type: 'button', class: 'pp', title: 'إنهاء القلم (Esc)', 'aria-label': 'إنهاء القلم', onclick: function (e) { e.stopPropagation(); penOff(); } }, [ico('close')]));
  ov.appendChild(pal);
  function syncPal() { $$('.pp[data-tool]', pal).forEach(function (b) { b.classList.toggle('on', b.dataset.tool === pen.tool); }); $$('.pc', pal).forEach(function (b) { b.classList.toggle('on', b.dataset.c === pen.color && (pen.tool === 'pen' || pen.tool === 'marker')); }); cv.dataset.tool = pen.tool; }
  function setTool(t) { if (!pen.on) penOn(); pen.tool = t; syncPal(); }
  function penOn() { pen.on = true; pal.hidden = false; cv.classList.add('on'); ov.classList.add('inking'); syncPal(); btnPen.classList.add('on'); }
  function penOff() { pen.on = false; pal.hidden = true; cv.classList.remove('on'); ov.classList.remove('inking'); btnPen.classList.remove('on'); pen.laser = []; render(); }
  function clearInk() { delete pen.strokes[idx]; render(); }
  function sizeCv() { const r = stage.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr)); cv._dpr = dpr; }
  function pathOf(g, pts, W, H) { g.beginPath(); g.moveTo(pts[0][0] * W, pts[0][1] * H); if (pts.length < 3) { pts.forEach(function (p) { g.lineTo(p[0] * W + 0.01, p[1] * H); }); return; } for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; g.quadraticCurveTo(pts[i][0] * W, pts[i][1] * H, mx * W, my * H); } const l = pts[pts.length - 1]; g.lineTo(l[0] * W, l[1] * H); }
  function render() {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height; g.clearRect(0, 0, W, H);
    (pen.strokes[idx] || []).concat(pen.cur ? [pen.cur] : []).forEach(function (s) {
      g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = s.c;
      if (s.t === 'marker') { g.globalAlpha = 0.38; g.lineWidth = W * 0.024; g.lineCap = 'butt'; } else g.lineWidth = W * 0.0042;
      pathOf(g, s.pts, W, H); g.stroke(); g.restore();
    });
    const now = performance.now(); pen.laser = pen.laser.filter(function (p) { return now - p[2] < 650; });
    if (pen.laser.length) {
      g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
      for (let i = 1; i < pen.laser.length; i++) { const a = pen.laser[i - 1], b = pen.laser[i], f = 1 - (now - b[2]) / 650; g.strokeStyle = 'rgba(255,40,40,' + (0.85 * f).toFixed(3) + ')'; g.lineWidth = W * 0.006 * (0.4 + f); g.shadowColor = 'rgba(255,0,0,.8)'; g.shadowBlur = W * 0.012; g.beginPath(); g.moveTo(a[0] * W, a[1] * H); g.lineTo(b[0] * W, b[1] * H); g.stroke(); }
      const h = pen.laser[pen.laser.length - 1]; g.fillStyle = '#ff2a2a'; g.shadowColor = 'rgba(255,0,0,.9)'; g.shadowBlur = W * 0.02; g.beginPath(); g.arc(h[0] * W, h[1] * H, W * 0.008, 0, Math.PI * 2); g.fill(); g.restore();
      requestAnimationFrame(render);
    }
  }
  function ptOf(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; }
  function eraseAt(p) { const list = pen.strokes[idx] || [], rr = 0.02; pen.strokes[idx] = list.filter(function (s) { return !s.pts.some(function (q) { return Math.abs(q[0] - p[0]) < rr && Math.abs(q[1] - p[1]) < rr * 1.6; }); }); }
  cv.addEventListener('pointerdown', function (e) {
    if (!pen.on) return; e.preventDefault(); e.stopPropagation(); try { cv.setPointerCapture(e.pointerId); } catch (er) {}
    const p = ptOf(e);
    if (pen.tool === 'eraser') { eraseAt(p); render(); cv._down = true; return; }
    if (pen.tool === 'laser') { pen.laser.push([p[0], p[1], performance.now()]); cv._down = true; render(); return; }
    pen.cur = { t: pen.tool, c: pen.tool === 'marker' ? (pen.color === '#111111' || pen.color === '#ffffff' ? '#ffd400' : pen.color) : pen.color, pts: [p] }; cv._down = true; render();
  });
  cv.addEventListener('pointermove', function (e) {
    if (!pen.on) return; const p = ptOf(e);
    if (pen.tool === 'laser') { if (cv._down || e.pointerType === 'mouse') { pen.laser.push([p[0], p[1], performance.now()]); if (pen.laser.length === 1 || pen.laser.length > 1) render(); } return; }
    if (!cv._down) return;
    if (pen.tool === 'eraser') { eraseAt(p); render(); return; }
    if (pen.cur) { const l = pen.cur.pts[pen.cur.pts.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) > 0.0015) { pen.cur.pts.push(p); render(); } }
  });
  const up = function () { cv._down = false; if (pen.cur) { (pen.strokes[idx] = pen.strokes[idx] || []).push(pen.cur); pen.cur = null; render(); } };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  ['click', 'touchstart', 'touchend', 'mousedown'].forEach(function (k) { cv.addEventListener(k, function (e) { if (pen.on) e.stopPropagation(); }, { passive: true }); });

  /* ---- القرعة ---- */
  let pool = null;
  function picker(cfg) {
    cfg = cfg || {};
    const names = (doc.lesson && doc.lesson.names) || [];
    let mode = cfg.mode === 'nums' || !names.length ? 'nums' : 'names', from = cfg.from || 1, to = cfg.to || 30, noRep = cfg.noRep !== false, busy = false;
    const box = el('div', { class: 'ppick', role: 'dialog', 'aria-label': 'القرعة' });
    const show = el('div', { class: 'pkname', 'aria-live': 'polite', text: '؟' }), info = el('small', { class: 'pkinfo' });
    const fIn = el('input', { type: 'number', min: '1', value: String(from), class: 'inp sm', 'aria-label': 'من' }), tIn = el('input', { type: 'number', min: '2', value: String(to), class: 'inp sm', 'aria-label': 'إلى' });
    const nums = el('div', { class: 'pknums', hidden: mode !== 'nums' }, [el('span', { text: 'من' }), fIn, el('span', { text: 'إلى' }), tIn]);
    const all = function () { if (mode === 'names') return names.slice(); const a = []; from = Math.max(1, +fIn.value || 1); to = Math.max(from + 1, Math.min(999, +tIn.value || 30)); for (let k = from; k <= to; k++) a.push(arDig(k)); return a; };
    const reset = function () { pool = null; info.textContent = ''; };
    const st = function (m) { m.t = 'm-pick'; m.mode = mode; m.from = Math.max(1, +fIn.value || 1); m.to = Math.max(m.from + 1, +tIn.value || 30); m.info = m.info || ''; return m; };
    fIn.addEventListener('change', reset); tIn.addEventListener('change', reset);
    function go() {
      if (busy) return; const list = all(); if (!list.length) return;
      if (!pool || !pool.length || pool.mode !== mode) { pool = list.slice(); pool.mode = mode; }
      const k = Math.floor(Math.random() * pool.length), win = pool[k];
      if (noRep) pool.splice(k, 1);
      busy = true; show.classList.remove('won'); box.classList.add('spin');
      let t = 0, delay = 45; const total = reducedMotion() ? 0 : 1900;
      (function tick() {
        if (t >= total) { show.textContent = win; show.classList.add('won'); box.classList.remove('spin'); busy = false; info.textContent = noRep ? (pool.length ? 'بقي ' + arDig(pool.length) + ' في القرعة' : 'انتهت القائمة؛ تبدأ القرعة من جديد في المرة القادمة') : ''; if (noRep && !pool.length) pool = null; emit(st({ on: true, name: win, won: true, info: info.textContent })); return; }
        show.textContent = list[Math.floor(Math.random() * list.length)]; emit(st({ on: true, name: show.textContent, won: false })); t += delay; delay = Math.min(260, delay * 1.13); setTimeout(tick, delay);
      })();
    }
    const close = function () { box.remove(); document.removeEventListener('keydown', kd, true); ov.focus(); emit({ t: 'm-pick', on: false }); };
    box._close = close;
    const kd = function (e) { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); } else if (e.key === 'Enter' || e.key === ' ') { if (e.target && /INPUT/.test(e.target.tagName)) return; e.preventDefault(); e.stopImmediatePropagation(); go(); } };
    document.addEventListener('keydown', kd, true);
    box.append(el('div', { class: 'pkcard' }, [
      el('div', { class: 'pkhead' }, [el('b', { text: 'القرعة' }), names.length ? segMini([['names', 'الأسماء'], ['nums', 'الأرقام']], mode, function (v) { mode = v; nums.hidden = v !== 'nums'; reset(); }) : null, el('span', { class: 'sp' }), el('button', { type: 'button', class: 'ib', 'aria-label': 'إغلاق', onclick: close }, [ico('close')])]),
      nums, show, info,
      el('div', { class: 'pkacts' }, [el('label', { class: 'tog' }, [el('input', { type: 'checkbox', checked: true, onchange: function (e) { noRep = e.target.checked; reset(); } }), el('span', { text: 'بلا تكرار' })]), el('span', { class: 'sp' }),
        names.length || o.fromView ? null : el('button', { type: 'button', class: 'btn sm line', onclick: function () { close(); rosterDialog(function () { picker(); }); } }, ['أضف الأسماء']),
        el('button', { type: 'button', class: 'btn dark pkgo', onclick: go }, [ico('dice'), 'اختر'])])
    ]));
    box.addEventListener('click', function (e) { e.stopPropagation(); if (e.target === box) close(); });
    // تغيير الإعداد من لوحة المقدّم دون إعادة فتح القرعة
    box._set = function (c) {
      if (c.from) fIn.value = c.from; if (c.to) tIn.value = c.to; if (c.noRep != null) { noRep = c.noRep !== false; const cb = box.querySelector('.pkacts input[type=checkbox]'); if (cb) cb.checked = noRep; }
      const m = c.mode === 'names' && names.length ? 'names' : 'nums'; if (m !== mode) { mode = m; nums.hidden = m !== 'nums'; $$('.tseg button', box).forEach(function (b, k) { b.classList.toggle('on', (k === 0 ? 'names' : 'nums') === m); }); }
      reset(); show.textContent = '؟'; show.classList.remove('won'); emit(st({ on: true, name: '؟', won: false }));
    };
    box._names = names.join('\n');
    ov.appendChild(box); emit(st({ on: true, name: '؟', won: false }));
  }

  /* ---- نقاط الفرق ---- */
  const score = el('div', { class: 'pscore', hidden: true, role: 'region', 'aria-label': 'نقاط الفرق' });
  ov.appendChild(score);
  function teams() { const l = lessonOf(doc); if (!l.teams || !l.teams.length) l.teams = [{ n: TEAM_NAMES[0], c: TEAM_COL[0], p: 0 }, { n: TEAM_NAMES[1], c: TEAM_COL[1], p: 0 }]; return l.teams; }
  function fillScore() {
    score.innerHTML = ''; const ts = teams(), top = Math.max.apply(null, ts.map(function (t) { return t.p || 0; }));
    ts.forEach(function (t) {
      const pts = el('b', { class: 'scp', text: arDig(t.p || 0) });
      const bump = function (d) { t.p = Math.max(0, (t.p || 0) + d); if (!o.fromView) lessonDirty(); fillScore(); emitScore(); const nb = score.querySelector('[data-n="' + CSS.escape(t.n) + '"] .scp'); if (nb) { nb.classList.remove('bump'); void nb.offsetWidth; nb.classList.add(d > 0 ? 'bump' : 'drop'); } };
      score.appendChild(el('div', { class: 'sct' + (top > 0 && (t.p || 0) === top ? ' lead' : ''), 'data-n': t.n, style: '--tc:' + t.c }, [
        el('button', { type: 'button', class: 'scm', 'aria-label': 'أنقص نقطة من ' + t.n, onclick: function (e) { e.stopPropagation(); bump(-1); } }, ['−']),
        el('button', { type: 'button', class: 'scb', 'aria-label': 'أضف نقطة إلى ' + t.n, onclick: function (e) { e.stopPropagation(); bump(1); } }, [el('span', { class: 'scn', text: t.n }), pts])
      ]));
    });
    score.appendChild(el('button', { type: 'button', class: 'scx', title: 'إخفاء النقاط (S)', 'aria-label': 'إخفاء النقاط', onclick: function (e) { e.stopPropagation(); toggleScore(); } }, [ico('close')]));
  }
  function toggleScore() { score.hidden = !score.hidden; if (!score.hidden) fillScore(); btnScore.classList.toggle('on', !score.hidden); emitScore(); }
  function emitScore() { emit({ t: 'm-score', on: !score.hidden, teams: teams().map(function (t) { return { n: t.n, c: t.c, p: t.p || 0 }; }) }); }
  score.addEventListener('click', function (e) { e.stopPropagation(); });

  /* ---- نتائج الأسئلة ورمز الدخول (نموذج قوقل) ---- */
  const resBox = el('div', { class: 'pres', hidden: true, role: 'region', 'aria-label': 'نتائج السؤال' }); ov.appendChild(resBox);
  let resT = 0, resOn = false;
  resBox.addEventListener('click', function (e) { e.stopPropagation(); });
  function qOfPage() { if (!isQuiz()) return null; const qs = deckQuiz(doc), x = qs.find(function (y) { return y.i === idx; }); return x || null; }
  async function loadRes() {
    clearTimeout(resT); if (!resOn) return;
    const f = (doc.lesson || {}).form, x = qOfPage();
    if (!f) { resBox.replaceChildren(el('p', { class: 'tiny', text: 'لا نموذج لأسئلة هذا العرض بعد: أنشئه من المحرر (أدوات الدرس ← إجابات الطلاب).' })); return; }
    if (!x) { resBox.replaceChildren(el('div', { class: 'preshead' }, [el('b', { text: 'رمز الدخول للطلاب' }), closeRes()]), joinQr(f.url, 220)); emit({ t: 'm-res', on: true, qr: true }); return; }
    let r; try { r = await API6.me('quiz_results', f.id); } catch (e) { resBox.replaceChildren(el('p', { class: 'tiny', text: srvErr(e) })); return; }
    if (!resOn) return;
    const k = (f.qs || []).indexOf(x.q), it = r.items[k >= 0 ? k : deckQuiz(doc).indexOf(x)] || { counts: {}, total: 0 };
    const reveal = !!(qstate && (qstate.d.reveal === true || qstate.d.reveal === 'true'));
    resBox.replaceChildren(el('div', { class: 'preshead' }, [el('b', { text: it.total ? arDig(it.total) + ' أجابوا' : 'بانتظار الإجابات…' }), el('span', { class: 'live' }), el('span', { class: 'sp' }),
      el('button', { type: 'button', class: 'btn sm ghost', onclick: function () { resBox.classList.toggle('withqr'); } }, [ico('qr')]), closeRes()]),
      resultBars(x, it, reveal), el('div', { class: 'presqr' }, [joinQr(f.url, 150)]));
    emit({ t: 'm-res', on: true, total: it.total || 0 });
    resT = setTimeout(loadRes, 4000);
  }
  function closeRes() { return el('button', { type: 'button', class: 'ib', 'aria-label': 'إغلاق', onclick: function () { toggleRes(); } }, [ico('close')]); }
  function joinQr(url, px) {
    const c = el('canvas', { class: 'pjqr', width: String(px * 2), height: String(px * 2) }); c.style.width = px + 'px'; c.style.height = px + 'px';
    const g = c.getContext('2d'); g.translate(px, px); try { drawQR(g, url, px * 2, '#111111', '#ffffff'); } catch (e) {}
    return el('div', { class: 'pjoin' }, [c, el('small', { dir: 'ltr', text: url.replace(/^https?:\/\//, '') })]);
  }
  function toggleRes() { resOn = !resOn; resBox.hidden = !resOn; btnRes.classList.toggle('on', resOn); emit({ t: 'm-res', on: resOn }); if (resOn) { resBox.replaceChildren(el('p', { class: 'tiny', text: 'نجلب الإجابات…' })); loadRes(); } else clearTimeout(resT); }

  /* ---- أزرار الشريط ---- */
  const B = function (icon, label, fn) { return el('button', { type: 'button', class: 'pb', title: label, 'aria-label': label, onclick: function (e) { e.stopPropagation(); fn(); } }, [ico(icon)]); };
  const btnPen = B('pen', 'القلم والتحديد والليزر (P)', function () { if (pen.on) penOff(); else penOn(); });
  const btnPick = B('dice', 'القرعة (R)', picker);
  const btnScore = B('trophy', 'نقاط الفرق (S)', toggleScore);
  const btnRes = B('chart', 'إجابات الطلاب (Q)', toggleRes);
  const ref = bar.querySelector('.pb[aria-label="شاشة سوداء"]');
  const grp = [el('span', { class: 'psep' }), btnPen, btnPick, btnScore, btnRes];
  // بعد «شاشة سوداء» مباشرة، وقبل «خروج»
  if (ref) { let at = ref; grp.forEach(function (x) { at.after(x); at = x; }); } else grp.forEach(function (x) { bar.appendChild(x); });

  /* ---- ربط بالعرض ---- */
  api.slide = function (i, p, step, q) {
    idx = i; page = p; qstate = q; pen.cur = null;
    sizeCv(); render();
    btnRes.hidden = !((doc.lesson || {}).form) && !isQuiz();
    if (resOn) loadRes();
  };
  api.key = function (e) {
    const k = e.key;
    if (k === 'Escape' && pen.on) { penOff(); return true; }
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    if (k === 'p' || k === 'P' || k === 'ح') { if (pen.on) penOff(); else penOn(); return true; }
    if (k === 'r' || k === 'R' || k === 'ق') { picker(); return true; }
    if (k === 's' || k === 'S' || k === 'س') { toggleScore(); return true; }
    if (k === 'q' || k === 'Q' || k === 'ض') { toggleRes(); return true; }
    if (pen.on) {
      if (k === 'h' || k === 'H' || k === 'ا') { setTool('marker'); return true; }
      if (k === 'l' || k === 'L' || k === 'م') { setTool('laser'); return true; }
      if (k === 'e' || k === 'E' || k === 'ث') { setTool('eraser'); return true; }
      if (k === 'c' || k === 'C' || k === 'ؤ') { clearInk(); return true; }
    }
    return false;
  };
  api.close = function () { clearTimeout(resT); resOn = false; };
  // أوامر نافذة المقدّم (عرض المقدّم): الكتابة والليزر والقرعة والنقاط وإجابات الطلاب
  api.cmd = function (m) {
    if (m.t === 'ink') { pen.strokes[m.i] = m.strokes || []; if (m.i === idx) render(); return; }
    if (m.t === 'laser') { const now = performance.now(); pen.laser = (m.pts || []).map(function (q) { return [q[0], q[1], now - (q[2] || 0)]; }); render(); return; }
    if (m.t === 'tool') { if (m.k === 'res') toggleRes(); else if (m.k === 'score') toggleScore(); return; }
    if (m.t === 'pickopen') { if (!ov.querySelector('.ppick')) picker(); return; }
    if (m.t === 'pickset') {
      const l = lessonOf(doc), nn = (m.names || []).join('\n'), x = ov.querySelector('.ppick');
      if (m.names) l.names = m.names;
      if (x && x._names === nn && x._set) { x._set(m); return; }
      if (x) { if (x._close) x._close(); else x.remove(); } picker(m); return;
    }
    if (m.t === 'pickgo') { if (!ov.querySelector('.ppick')) picker(); const b = ov.querySelector('.ppick .pkgo'); if (b) b.click(); return; }
    if (m.t === 'pickclose') { const x = ov.querySelector('.ppick'); if (x) { if (x._close) x._close(); else x.remove(); } return; }
    if (m.t === 'teams') { lessonOf(doc).teams = m.teams || []; score.hidden = !m.show; if (m.show) fillScore(); btnScore.classList.toggle('on', !!m.show); emitScore(); return; }
  };
  api.pen = pen;
  return api;
}
