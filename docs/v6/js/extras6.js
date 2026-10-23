/* ================= الإضافات: صور مجانية (Pexels)، ورمز QR، وأيقونات Tabler، وآيات وأحاديث موثقة، وتصحيح وتشكيل بالذكاء ================= */

/* ---------- صور مجانية من Pexels: البحث عبر الخادم، والصورة تُحفظ بأصلها كاملاً في مكتبتك ---------- */
function freeImagesSection(b) {
  b.appendChild(el('h4', { class: 'psh', text: 'صور مجانية' }));
  if (!V6.settings.pexels) { b.appendChild(el('p', { class: 'tiny', text: 'لم يُضبط مفتاح الصور المجانية بعد (المدير: الإعدادات).' })); return; }
  const q = el('input', { type: 'search', class: 'inp sm', placeholder: 'ابحث: مسجد، طبيعة، كتاب…', 'aria-label': 'بحث عن صورة' });
  let orient = sizeOrient();
  const res = el('div', { class: 'pxgrid' }), more = el('button', { type: 'button', class: 'btn sm line', text: 'المزيد', hidden: true });
  const suggest = el('label', { class: 'tog tiny' }, [el('input', { type: 'checkbox', id: 'px_sug' }), el('span', { text: 'اقترحها لمكتبة البرنامج' })]);
  let page = 1, lastQ = '';
  async function search(p) {
    const text = q.value.trim(); if (!text) { q.focus(); return; }
    if (text !== lastQ) { res.innerHTML = ''; page = 1; } else page = p || page;
    lastQ = text; more.hidden = true;
    const sk = el('p', { class: 'tiny', text: 'نبحث…' }); res.appendChild(sk);
    try {
      const r = await API6.me('img_search', text, page, orient);
      sk.remove();
      if (!r.photos.length && page === 1) { res.appendChild(el('p', { class: 'tiny', text: 'لا نتائج. جرّب كلمة إنجليزية (النتائج أكثر).' })); return; }
      r.photos.forEach(function (p) {
        const bt = el('button', { type: 'button', class: 'pxb', title: (p.alt || '') + ' — ' + p.by, style: 'background-color:' + (p.color || '#ddd'), onclick: function () { pickFree(p, bt); } });
        bt.style.backgroundImage = 'url(' + p.thumb + ')';
        bt.appendChild(el('small', { text: p.by }));
        res.appendChild(bt);
      });
      more.hidden = r.photos.length < 24;
    } catch (e) { sk.remove(); res.appendChild(el('p', { class: 'err tiny', text: e.message })); }
  }
  async function pickFree(p, bt) {
    bt.disabled = true; bt.classList.add('busy');
    try {
      const r = await API6.me('img_pick', JSON.stringify({ orig: p.orig, thumb: p.thumb, name: (p.alt || 'صورة') + ' — ' + p.by, alt: p.alt, by: p.by, byUrl: p.byUrl, url: p.url, program: V6.prog.id, suggest: $('#px_sug') && $('#px_sug').checked }));
      V6.assets[r.asset.id] = r.asset; if (r.asset.scope === 'user') V6.mine.unshift(r.asset);
      addLayer6({ t: 'img', ref: 'asset:' + r.asset.id, w: 0.6 });
      toast(r.request ? 'أُضيفت إلى تصميمك ومكتبتك، وأُرسل اقتراحها للمشرف' : (r.asset.scope === 'program' ? 'أُضيفت إلى مكتبة البرنامج' : 'أُضيفت إلى تصميمك ومكتبتك'));
      track('tool', { tool: 'pexels' });
    } catch (e) { toast(e.message); }
    bt.disabled = false; bt.classList.remove('busy');
  }
  more.onclick = function () { search(page + 1); };
  q.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); search(1); } });
  const ai = aiReady() ? el('button', { type: 'button', class: 'btn sm line', title: 'يقترح كلمات بحث من نصوص تصميمك', onclick: async function (e) {
    const btn = e.currentTarget; btn.disabled = true;
    try { const words = await imgQueryAI(); if (words.length) { q.value = words[0]; search(1); const alt = el('div', { class: 'row wrapr' }, words.slice(1, 4).map(function (w) { return el('button', { type: 'button', class: 'chip', onclick: function () { q.value = w; search(1); } }, [w]); })); res.parentNode.insertBefore(alt, res); } }
    catch (er) { toast(er.message); }
    btn.disabled = false;
  } }, [ico('ai'), 'اقترح']) : null;
  b.appendChild(el('div', { class: 'row' }, [q, el('button', { type: 'button', class: 'btn sm dark', onclick: function () { search(1); } }, [ico('search')]), ai]));
  b.appendChild(el('div', { class: 'row wrapr' }, [segOf([['', 'الكل'], ['portrait', 'طولي'], ['landscape', 'عرضي'], ['square', 'مربع']], orient, function (v) { orient = v; if (lastQ) { lastQ = ''; search(1); } }), suggest]));
  b.appendChild(res); b.appendChild(more);
  b.appendChild(el('p', { class: 'tiny pxcredit' }, ['الصور من ', el('a', { href: 'https://www.pexels.com', target: '_blank', rel: 'noopener', text: 'Pexels' }), ' برخصتها المجانية، ويُحفظ اسم المصوّر مع كل صورة.']));
}
function sizeOrient() { const sz = SIZES[S.size] || {}; return !sz.w ? '' : sz.w > sz.h * 1.2 ? 'landscape' : sz.h > sz.w * 1.1 ? 'portrait' : 'square'; }
async function imgQueryAI() {
  const texts = Object.keys(S.d || {}).map(function (k) { return typeof S.d[k] === 'string' ? S.d[k] : ''; }).filter(Boolean).join(' | ').slice(0, 600);
  const raw = await API6.call('ai_make', V6.token, JSON.stringify({ kind: 'imgq', program: V6.prog.id, system: 'تقترح كلمات بحث إنجليزية قصيرة لصور فوتوغرافية مجانية تناسب تصميماً تربوياً عربياً. أعد JSON: queries مصفوفة من ٤ عبارات إنجليزية (كلمتان إلى ثلاث)، محتشمة ومناسبة لبيئة إسلامية، بلا أشخاص إلا من الخلف أو بعيدين.', prompt: 'نصوص التصميم: ' + (texts || 'إعلان تربوي'), schema: { type: 'OBJECT', properties: { queries: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['queries'] }, temperature: 0.5 }));
  const o = JSON.parse(raw); return (o.queries || []).map(function (x) { return String(x).trim(); }).filter(Boolean);
}

/* ---------- رمز QR وأيقونات Tabler في لوحة العناصر ---------- */
function qrSection(b) {
  b.appendChild(el('h4', { class: 'psh', text: 'رمز QR' }));
  b.appendChild(el('p', { class: 'tiny', text: 'رابط التسجيل أو القناة يصير رمزاً يُمسح بالهاتف. يُولَّد هنا بلا خدمة خارجية.' }));
  const u = el('input', { type: 'url', class: 'inp sm', dir: 'ltr', placeholder: 'https://…', 'aria-label': 'رابط الرمز' });
  const add = function () { const v = u.value.trim(); if (!/^https?:\/\/\S+$/.test(v)) { toast('اكتب رابطاً يبدأ بـ https://'); u.focus(); return; } addLayer6({ t: 'qr', url: v, w: 0.22, c: '', bg: '#ffffff' }); u.value = ''; };
  u.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); add(); } });
  b.appendChild(el('div', { class: 'row' }, [u, el('button', { type: 'button', class: 'btn sm dark', onclick: add }, [ico('plus'), 'أضف'])]));
  const P = V6.prog && V6.prog.tg; if (P && P.link) b.appendChild(el('button', { type: 'button', class: 'chip', onclick: function () { u.value = P.link; add(); } }, ['رابط قناة البرنامج']));
}
function ticonSection(b) {
  if (typeof TICONS === 'undefined') return;
  b.appendChild(el('h4', { class: 'psh', text: 'أيقونات أكثر' }));
  const C = S.track.c, q = el('input', { type: 'search', class: 'inp sm', placeholder: 'ابحث باسم الأيقونة…', 'aria-label': 'بحث عن أيقونة' });
  const g = el('div', { class: 'libg' });
  function fill() {
    g.innerHTML = ''; const t = q.value.trim();
    Object.keys(TICONS).filter(function (k) { return !t || TICONS[k][0].indexOf(t) >= 0 || k.indexOf(t.toLowerCase()) >= 0; }).slice(0, t ? 94 : 40).forEach(function (k) {
      g.appendChild(el('button', { type: 'button', class: 'libb', title: TICONS[k][0], 'aria-label': TICONS[k][0], onclick: function () { addLayer6({ t: 'ticon', ref: k, w: 0.09, c: C.s, lw: 2 }); } }, [libCanvas(function (gx, s) { drawTIcon(gx, k, s * 0.8, C.s, 1.8); }, 56, 56)]));
    });
    if (!t) g.appendChild(el('p', { class: 'tiny', text: 'اكتب للبحث في ' + Object.keys(TICONS).length + ' أيقونة.' }));
  }
  q.addEventListener('input', fill); fill();
  b.appendChild(q); b.appendChild(g);
  b.appendChild(el('p', { class: 'tiny', text: 'الأيقونات من مجموعة Tabler المفتوحة (رخصة MIT).' }));
}

/* ---------- آية أو حديث موثّق: نص من مصدر معتمد مع الموضع أو حكم المحدث ---------- */
function verifiedTextDialog(done) {
  let kind = 'ayah', showWeak = false;
  const q = el('input', { type: 'search', class: 'inp', placeholder: 'كلمات من الآية، أو: الإسراء ٢٣', 'aria-label': 'بحث' });
  const list = el('div', { class: 'vlist' });
  const hint = el('p', { class: 'tiny', text: 'المصدر: مصحف المدينة (رواية حفص) عبر alquran.cloud.' });
  const weak = el('label', { class: 'tog tiny', hidden: true }, [el('input', { type: 'checkbox', onchange: function (e) { showWeak = e.target.checked; render(); } }), el('span', { text: 'أظهر ما حكمه الضعف أيضاً' })]);
  let items = [];
  function arabicDigits(s) { return String(s).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); }
  function render() {
    list.innerHTML = '';
    const show = kind === 'ayah' ? items : items.filter(function (h) { return showWeak || h.sahih; });
    if (!show.length) { list.appendChild(el('p', { class: 'tiny', text: items.length ? 'كل النتائج ضعيفة الحكم؛ فعّل إظهارها إن أردت.' : 'لا نتائج.' })); return; }
    show.forEach(function (it) {
      const ref = kind === 'ayah' ? '[' + it.surah + ': ' + arabicDigits(it.n) + ']' : (it.source ? it.source + (it.page ? ' ' + arabicDigits(it.page) : '') : '');
      const row = el('div', { class: 'vrow' + (kind === 'hadith' && !it.sahih ? ' weak' : '') }, [
        el('p', { class: 'vtext', text: kind === 'ayah' ? '﴿' + it.text + '﴾' : '«' + it.text + '»' }),
        el('div', { class: 'row wrapr tiny' }, [el('span', { class: 'pill', text: kind === 'ayah' ? it.surah + ' ' + arabicDigits(it.n) : (it.grade || 'بلا حكم') }), kind === 'hadith' ? el('span', { text: [it.rawi && 'الراوي: ' + it.rawi, it.muhaddith && 'المحدث: ' + it.muhaddith, ref].filter(Boolean).join(' · ') }) : null,
          el('span', { class: 'sp' }), el('button', { type: 'button', class: 'btn sm dark', text: 'أدرج', onclick: function () { done({ kind: kind, text: it.text, ref: ref, grade: it.grade || '', line: kind === 'ayah' ? '﴿' + it.text + '﴾ ' + ref : '«' + it.text + '» ' + (it.source ? '— ' + ref : '') }); closeTop(); } })])
      ]);
      list.appendChild(row);
    });
  }
  async function search() {
    const t = q.value.trim(); if (!t) { q.focus(); return; }
    list.innerHTML = ''; list.appendChild(el('p', { class: 'tiny', text: 'نبحث…' }));
    try { items = await API6.me(kind === 'ayah' ? 'quran_find' : 'hadith_find', t.replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); })); render(); } catch (e) { list.innerHTML = ''; list.appendChild(el('p', { class: 'err tiny', text: e.message })); }
  }
  q.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); search(); } });
  const seg = segOf([['ayah', 'آية'], ['hadith', 'حديث']], kind, function (v) { kind = v; items = []; list.innerHTML = ''; q.placeholder = v === 'ayah' ? 'كلمات من الآية، أو: الإسراء ٢٣' : 'كلمات من الحديث'; hint.textContent = v === 'ayah' ? 'المصدر: مصحف المدينة (رواية حفص) عبر alquran.cloud.' : 'المصدر: الموسوعة الحديثية في الدرر السنية، مع خلاصة حكم المحدث. يُعرض الصحيح والحسن أولاً.'; weak.hidden = v !== 'hadith'; });
  let closeTop = function () {};
  seg.style.flex = 'none';
  modal({ title: 'آية أو حديث موثّق', wide: true, body: [el('div', { class: 'row' }, [seg, q, el('button', { type: 'button', class: 'btn sm dark', onclick: search }, [ico('search')])]), hint, weak, list], acts: [{ t: 'إغلاق' }] });
  closeTop = function () { const m = $$('.modal').pop(); if (m) { const x = m.querySelector('.acts .btn'); if (x) x.click(); } };
  setTimeout(function () { q.focus(); }, 50);
}
// إدراج النص الموثّق: في الحقل النصي المحدد، أو طبقة نص جديدة
function insertVerified(r) {
  const g = S.sel && !isLayer(S.sel) ? S.sel : null;
  const f = g ? (S.tpl.fields || []).find(function (x) { return x.k && (x.kind === 'area' || !x.kind) && groupOfField(x.k) === g; }) : null;
  if (f) { S.d[f.k] = r.kind === 'ayah' ? '﴿' + r.text + '﴾' : '«' + r.text + '»'; const src = (S.tpl.fields || []).find(function (x) { return /^(src|by|who|sub)$/.test(x.k) && groupOfField(x.k) !== g; }); if (src && !S.d[src.k]) S.d[src.k] = r.ref; changed6(); buildPanel(); toast('أُدرج في «' + f.label + '»'); }
  else { addLayer6({ t: 'text', txt: r.line, al: 'center', c: '', sz: 0.045, b: 0.6, w: 0.8 }); }
  track('tool', { tool: r.kind });
}

/* ---------- تصحيح إملائي وتشكيل بالذكاء ---------- */
function spellDialog() {
  if (!aiReady()) { toast('يحتاج المساعد الذكي'); return; }
  const fields = (S.tpl.fields || []).filter(function (f) { return f.k && (f.kind === 'area' || !f.kind) && typeof S.d[f.k] === 'string' && S.d[f.k].trim(); });
  const layers = (S.layers || []).filter(function (L) { return L.t === 'text' && String(L.txt || '').trim(); });
  if (!fields.length && !layers.length) { toast('لا نصوص في التصميم'); return; }
  let mode = 'fix';
  const picks = {}; fields.forEach(function (f) { picks['f:' + f.k] = true; }); layers.forEach(function (L) { picks['L:' + L.id] = true; });
  const items = fields.map(function (f) { return { id: 'f:' + f.k, label: f.label, text: S.d[f.k] }; }).concat(layers.map(function (L) { return { id: 'L:' + L.id, label: 'نص حر', text: L.txt }; }));
  const list = el('div', { class: 'splist' }, items.map(function (it) { return el('label', { class: 'tog' }, [el('input', { type: 'checkbox', checked: true, onchange: function (e) { picks[it.id] = e.target.checked; } }), el('span', { text: it.label + ': ' + it.text.replace(/\s+/g, ' ').slice(0, 50) })]); }));
  const out = el('div', { class: 'spout' });
  let result = null;
  async function run() {
    const chosen = items.filter(function (it) { return picks[it.id]; }); if (!chosen.length) { toast('اختر نصاً'); return; }
    out.innerHTML = ''; out.appendChild(el('p', { class: 'tiny', text: 'يراجع المساعد…' }));
    const sys = ['أنت مدقق لغوي عربي لنصوص تصميم تربوي قصيرة.', mode === 'fix' ? 'صحّح الإملاء والهمزات والتاء المربوطة وعلامات الترقيم فقط، ولا تغيّر الأسلوب ولا الكلمات ولا الأسطر.' : mode === 'full' ? 'صحّح الإملاء ثم شكّل النص تشكيلاً كاملاً صحيحاً (كل الحروف)، مع إبقاء الكلمات والأسطر كما هي.' : 'صحّح الإملاء وضع التشكيل حيث يُزيل اللبس فقط (أواخر الكلمات والحروف المشتبهة)، مع إبقاء الكلمات والأسطر كما هي.',
      'احتفظ بعلامات * كما هي في مواضعها (تلوين)، وبالأسطر الجديدة. أعد JSON: items مصفوفة بنفس الترتيب: {id, text, note} وnote سطر قصير بما غيّرت أو فارغ.'].join('\n');
    try {
      const raw = await API6.call('ai_make', V6.token, JSON.stringify({ kind: 'spell', program: V6.prog.id, system: sys, prompt: JSON.stringify(chosen.map(function (c) { return { id: c.id, text: c.text }; })), schema: { type: 'OBJECT', properties: { items: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, text: { type: 'STRING' }, note: { type: 'STRING' } }, required: ['id', 'text'] } } }, required: ['items'] }, temperature: 0.1 }));
      result = JSON.parse(raw).items || [];
      out.innerHTML = '';
      if (!result.length) { out.appendChild(el('p', { class: 'tiny', text: 'لم يعد المساعد شيئاً.' })); return; }
      result.forEach(function (r) { const src = chosen.find(function (c) { return c.id === r.id; }); if (!src) return; const same = src.text === r.text; out.appendChild(el('div', { class: 'sprow' + (same ? ' same' : '') }, [el('small', { class: 'tiny', text: src.label + (same ? ' — لا تغيير' : (r.note ? ' — ' + r.note : '')) }), same ? null : el('del', { text: src.text }), same ? null : el('ins', { text: r.text })])); });
    } catch (e) { out.innerHTML = ''; out.appendChild(el('p', { class: 'err tiny', text: e.message })); }
  }
  modal({ title: 'تصحيح وتشكيل', wide: true, body: [segOf([['fix', 'تصحيح فقط'], ['part', 'تشكيل حيث يلزم'], ['full', 'تشكيل كامل']], mode, function (v) { mode = v; result = null; out.innerHTML = ''; }), list, el('button', { type: 'button', class: 'btn sm line', onclick: run }, [ico('ai'), 'راجع']), out],
    acts: [{ t: 'طبّق التغييرات', cls: 'dark', fn: function () { if (!result) { toast('اضغط «راجع» أولاً'); return false; } let n = 0; result.forEach(function (r) { const it = items.find(function (x) { return x.id === r.id; }); if (!it || it.text === r.text) return; n++; if (r.id.slice(0, 2) === 'f:') S.d[r.id.slice(2)] = r.text; else { const L = layerById(r.id.slice(2)); if (L) L.txt = r.text; } }); changed6(); buildPanel(); toast(n ? 'طُبّق على ' + n + ' نصاً' : 'لا تغييرات'); track('tool', { tool: 'spell' }); } }, { t: 'إلغاء' }] });
}

/* ---------- لوحة الإدارة: طلبات الصور المقترحة لمكتبة البرنامج ---------- */
async function imgRequestsCard(body, prog) {
  let list; try { list = await API6.me('img_requests', prog); } catch (e) { return; }
  const open = list.filter(function (r) { return r.status === 'new'; });
  if (!open.length) return;
  const card = el('div', { class: 'card hl' }, [el('h3', { text: 'صور اقترحها الفريق للمكتبة' }), el('p', { class: 'tiny', text: 'من الصور المجانية (Pexels). بالموافقة تُنسخ الصورة بأصلها إلى مكتبة البرنامج فيراها الجميع.' })]); body.appendChild(card);
  open.forEach(function (r) {
    const row = el('div', { class: 'imgreq' }, [el('div', { class: 'imgreq-th', style: r.thumb ? 'background-image:url(' + r.thumb + ')' : '' }), el('div', { class: 'grow' }, [el('b', { text: r.title }), el('small', { class: 'tiny', text: 'اقترحها ' + r.name + ' · ' + fmtTime(r.at) + (r.by ? ' · تصوير ' + r.by : '') })]),
      el('button', { type: 'button', class: 'btn sm dark', text: 'أضفها للمكتبة', onclick: async function () { try { await API6.me('img_decide', r.id, true); row.remove(); toast('أُضيفت'); await refreshBundle(); } catch (e) { toast(e.message); } } }),
      el('button', { type: 'button', class: 'btn sm line', text: 'لا', onclick: async function () { try { await API6.me('img_decide', r.id, false); row.remove(); } catch (e) { toast(e.message); } } })]);
    card.appendChild(row);
  });
}
