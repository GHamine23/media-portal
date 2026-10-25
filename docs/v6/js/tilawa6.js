/* ---------- التلاوة في العروض: زر يُسمِع الآيات بصوت قارئ مختار، آيةً آية ----------
   العنصر طبقة صوت: { t: 'audio', qr: { s: السورة, a: من, b: إلى, r: القارئ, rep: تكرار كل آية, pick: اختيار القارئ أثناء العرض } }
   الملفات من everyayah.com (ملف لكل آية، رواية حفص)، تُشغَّل مباشرة في المتصفح بلا رفع ولا خادم. */
const QARI = [
  { id: 'husary', n: 'محمود خليل الحصري', f: 'Husary_128kbps' },
  { id: 'husary_m', n: 'الحصري (المصحف المعلّم)', f: 'Husary_Muallim_128kbps', note: 'للتعليم والترديد' },
  { id: 'minshawi', n: 'محمد صدّيق المنشاوي', f: 'Minshawy_Murattal_128kbps' },
  { id: 'basit', n: 'عبد الباسط عبد الصمد', f: 'Abdul_Basit_Murattal_192kbps' },
  { id: 'afasy', n: 'مشاري راشد العفاسي', f: 'Alafasy_128kbps' },
  { id: 'muaiqly', n: 'ماهر المعيقلي', f: 'MaherAlMuaiqly128kbps' },
  { id: 'sudais', n: 'عبد الرحمن السديس', f: 'Abdurrahmaan_As-Sudais_192kbps' },
  { id: 'shuraym', n: 'سعود الشريم', f: 'Saood_ash-Shuraym_128kbps' },
  { id: 'dossary', n: 'ياسر الدوسري', f: 'Yasser_Ad-Dussary_128kbps' },
  { id: 'hudhaify', n: 'علي الحذيفي', f: 'Hudhaify_128kbps' },
  { id: 'ayyoub', n: 'محمد أيوب', f: 'Muhammad_Ayyoub_128kbps' },
  { id: 'basfar', n: 'عبد الله بصفر', f: 'Abdullah_Basfar_192kbps' },
  { id: 'qatami', n: 'ناصر القطامي', f: 'Nasser_Alqatami_128kbps' },
  { id: 'budair', n: 'صلاح البدير', f: 'Salah_Al_Budair_128kbps' },
  { id: 'shatri', n: 'أبو بكر الشاطري', f: 'Abu_Bakr_Ash-Shaatree_128kbps' }
];
const SURAH_N = 'الفاتحة البقرة آل_عمران النساء المائدة الأنعام الأعراف الأنفال التوبة يونس هود يوسف الرعد إبراهيم الحجر النحل الإسراء الكهف مريم طه الأنبياء الحج المؤمنون النور الفرقان الشعراء النمل القصص العنكبوت الروم لقمان السجدة الأحزاب سبأ فاطر يس الصافات ص الزمر غافر فصلت الشورى الزخرف الدخان الجاثية الأحقاف محمد الفتح الحجرات ق الذاريات الطور النجم القمر الرحمن الواقعة الحديد المجادلة الحشر الممتحنة الصف الجمعة المنافقون التغابن الطلاق التحريم الملك القلم الحاقة المعارج نوح الجن المزمل المدثر القيامة الإنسان المرسلات النبأ النازعات عبس التكوير الانفطار المطففين الانشقاق البروج الطارق الأعلى الغاشية الفجر البلد الشمس الليل الضحى الشرح التين العلق القدر البينة الزلزلة العاديات القارعة التكاثر العصر الهمزة الفيل قريش الماعون الكوثر الكافرون النصر المسد الإخلاص الفلق الناس'.split(' ').map(function (s) { return s.replace(/_/g, ' '); });
const SURAH_A = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];
const TL_MAX = 40;
// نص الآية الأولى من كل سورة يأتي من المصدر مسبوقاً بالبسملة؛ وليست منها (إلا في الفاتحة)
function noBasmala(t, s, n) {
  t = String(t == null ? '' : t).replace(/\uFEFF/g, '');   // المصدر يضع أحياناً علامة BOM غير مرئية في أول النص
  if (n !== 1 || s === 1) return t;
  const w = String(t).split(/\s+/), k = function (x) { return String(x || '').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').replace(/[ٱأإآ]/g, 'ا'); };
  return k(w[0]) === 'بسم' && k(w[1]) === 'الله' && k(w[2]) === 'الرحمن' && k(w[3]) === 'الرحيم' ? w.slice(4).join(' ') : t;
}
// رابط صفحة الاستماع (للرمز المطبوع): السورة.من-إلى.القارئ.التكرار
const SITE_ROOT = 'https://ghamine23.github.io/media-portal/';
function listenUrl(q) { q = cleanQr(q); return SITE_ROOT + 'q.html#' + q.s + '.' + q.a + (q.b > q.a ? '-' + q.b : '') + '.' + qariOf(q.r).id + (q.rep > 1 ? '.' + q.rep : ''); }
function parseListen(h) {
  const m = /^#?(\d{1,3})\.(\d{1,3})(?:-(\d{1,3}))?(?:\.([a-z_]+))?(?:\.(\d{1,2}))?/.exec(String(h || ''));
  return m ? cleanQr({ s: +m[1], a: +m[2], b: +(m[3] || m[2]), r: m[4] || '', rep: +(m[5] || 1) }) : null;
}   // أقصى عدد آيات في عنصر واحد
function arD(n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); }
function qariOf(id) { return QARI.find(function (q) { return q.id === id; }) || QARI.find(function (q) { return q.id === (ls('qari') || 'husary'); }) || QARI[0]; }
function ayaCount(n) { return n === 1 ? 'آية واحدة' : n === 2 ? 'آيتان' : arD(n) + (n % 100 >= 3 && n % 100 <= 10 ? ' آيات' : ' آية'); }
function pad3(n) { return ('00' + n).slice(-3); }
function tilawaUrl(r, s, a) { return 'https://everyayah.com/data/' + qariOf(r).f + '/' + pad3(s) + pad3(a) + '.mp3'; }
function tilawaLabel(q) { const b = q.b && q.b !== q.a ? q.b : 0; return SURAH_N[q.s - 1] + ' ' + arD(q.a) + (b ? '–' + arD(b) : ''); }
// قائمة الملفات بالترتيب: البسملة قبل أول السورة (إلا الفاتحة، فهي آيتها الأولى، والتوبة)
function tilawaList(q, r) {
  const out = []; if (q.a === 1 && q.s !== 1 && q.s !== 9) out.push({ u: tilawaUrl(r, 1, 1), n: 0 });
  for (let n = q.a; n <= (q.b || q.a); n++) out.push({ u: tilawaUrl(r, q.s, n), n: n });
  return out;
}
function cleanQr(q) {
  const s = Math.max(1, Math.min(114, Math.round(+q.s || 1))), max = SURAH_A[s - 1];
  const a = Math.max(1, Math.min(max, Math.round(+q.a || 1))), b = Math.max(a, Math.min(max, a + TL_MAX - 1, Math.round(+q.b || a)));
  const o = { s: s, a: a, b: b }; if (q.r) o.r = qariOf(q.r).id; if (+q.rep > 1) o.rep = Math.min(10, Math.round(+q.rep)); if (q.pick === false) o.pick = false;
  return o;
}

/* ---------- المشغّل: يستعمله العرض الحي ومعاينة المحرر ---------- */
function tilawaPlayer(q, r, ui) {
  ui = ui || {};
  const au = new Audio(); au.preload = 'auto';
  let list = tilawaList(q, r), k = 0, rep = 0, on = false, pre = null, alive = true;
  const reps = Math.max(1, +q.rep || 1);
  function load() { au.src = list[k].u; if (list[k + 1]) { pre = new Audio(); pre.preload = 'auto'; pre.src = list[k + 1].u; } if (ui.ayah) ui.ayah(list[k].n); }
  function state(v) { on = v; if (ui.state) ui.state(v); }
  au.addEventListener('ended', function () {
    if (!alive) return;
    if (list[k].n && ++rep < reps) { au.currentTime = 0; au.play().catch(function () {}); return; }
    rep = 0;
    if (k < list.length - 1) { k++; load(); au.play().catch(function () {}); return; }
    k = 0; load(); state(false); if (ui.prog) ui.prog(0);
    if (ui.loop && ui.loop()) au.play().then(function () { state(true); }).catch(function () {});
  });
  au.addEventListener('timeupdate', function () { if (ui.prog && au.duration) ui.prog((k + au.currentTime / au.duration) / list.length); });
  au.addEventListener('error', function () { if (!alive || !on) return; state(false); toast('تعذّر تشغيل التلاوة. تأكد من الاتصال بالإنترنت.'); });
  load();
  return {
    play: function () { au.play().then(function () { state(true); }).catch(function (e) { if (e && e.name !== 'AbortError') toast('تعذّر تشغيل التلاوة. تأكد من الاتصال بالإنترنت.'); }); },
    pause: function () { au.pause(); state(false); },
    toggle: function () { if (on) this.pause(); else this.play(); },
    playing: function () { return on; },
    // تغيير القارئ: يكمل من الآية نفسها
    qari: function (nr) { r = nr; const n = list[k].n, was = on; list = tilawaList(q, r); k = Math.max(0, list.findIndex(function (x) { return x.n === n; })); rep = 0; load(); if (was) au.play().catch(function () {}); },
    stop: function () { alive = false; au.pause(); au.removeAttribute('src'); try { au.load(); } catch (e) {} state(false); },
    el: au
  };
}

/* ---------- في العرض الحي: الزر فوق مكانه، واختيار القارئ فوقه ---------- */
function tilawaBox(L, box, later, delay) {
  const q = cleanQr(L.qr || {});
  box.classList.add('pm-tl');
  const prog = el('i', { class: 'tlprog' }), num = el('b', { class: 'tlnum', hidden: true });
  let r = q.r || ls('qari') || 'husary';
  const pl = tilawaPlayer(q, r, {
    state: function (v) { box.classList.toggle('playing', v); },
    prog: function (f) { prog.style.width = (f * 100).toFixed(1) + '%'; },
    ayah: function (n) { num.hidden = !n || q.a === (q.b || q.a); num.textContent = n ? arD(n) : ''; },
    loop: function () { return !!L.loop; }
  });
  box._stop = pl.stop;
  const btn = el('button', { type: 'button', class: 'pmaudio', 'aria-label': 'تشغيل التلاوة أو إيقافها', title: 'تلاوة ' + tilawaLabel(q), onclick: function (e) { e.stopPropagation(); pl.toggle(); } });
  box.append(pl.el, el('span', { class: 'tlbar' }, [prog]), num, btn);
  if (q.pick !== false) {
    const menu = el('div', { class: 'tlmenu', hidden: true });
    const chip = el('button', { type: 'button', class: 'tlqari', 'aria-haspopup': 'true', onclick: function (e) { e.stopPropagation(); fill(); menu.hidden = !menu.hidden; } }, [qariOf(r).n]);
    const fill = function () {
      menu.replaceChildren.apply(menu, QARI.map(function (x) { return el('button', { type: 'button', class: x.id === qariOf(r).id ? 'on' : '', onclick: function (e) { e.stopPropagation(); r = x.id; chip.textContent = x.n; menu.hidden = true; pl.qari(r); } }, [x.n, x.note ? el('small', { text: x.note }) : null]); }));
    };
    box.append(chip, menu);
  }
  // قرب أعلى الشريحة: اختيار القارئ تحت الزر
  setTimeout(function () { const pr = box.parentNode; if (pr && box.offsetTop < pr.clientHeight * 0.4) box.classList.add('tl-down'); }, 0);
  if (L.auto) later(function () { pl.play(); }, delay + 120);
  return box;
}

/* ---------- نافذة الإضافة والتعديل ---------- */
function tilawaDialog(L, preset, opt) {
  opt = opt || {}; const qrMode = !!opt.qr;   // qrMode: رمز QR للاستماع (للمطبوعات) بدل زر العرض
  const q = cleanQr((L && L.qr) || preset || { s: 1, a: 1, b: 7 });
  let rep = q.rep || 1, prev = null;
  const sSel = el('select', { class: 'inp', 'aria-label': 'السورة' }, SURAH_N.map(function (n, i) { return el('option', { value: String(i + 1), selected: i + 1 === q.s }, [arD(i + 1) + ' · ' + n]); }));
  const num = function (v, lab) { return el('input', { type: 'number', class: 'inp', min: '1', value: String(v), inputmode: 'numeric', dir: 'ltr', 'aria-label': lab }); };
  const aIn = num(q.a, 'من الآية'), bIn = num(q.b, 'إلى الآية');
  const qSel = el('select', { class: 'inp', 'aria-label': 'القارئ' }, QARI.map(function (x) { return el('option', { value: x.id, selected: x.id === qariOf(q.r).id }, [x.n + (x.note ? ' — ' + x.note : '')]); }));
  const info = el('p', { class: 'tiny tlinfo' });
  const withText = el('input', { type: 'checkbox', checked: !L && !qrMode });
  const withQr = el('input', { type: 'checkbox', checked: qrMode }), withCap = el('input', { type: 'checkbox', checked: true });
  const pick = el('input', { type: 'checkbox', checked: q.pick !== false });
  function cur() { return cleanQr({ s: +sSel.value, a: +aIn.value, b: +bIn.value, r: qSel.value, rep: rep, pick: pick.checked }); }
  function upd() { const max = SURAH_A[+sSel.value - 1]; aIn.max = bIn.max = String(max); const c = cur(); info.textContent = 'سورة ' + SURAH_N[c.s - 1] + ' (' + ayaCount(max) + ') · المختار: ' + ayaCount(c.b - c.a + 1) + (c.b - c.a + 1 >= TL_MAX ? ' · الحد ' + ayaCount(TL_MAX) : ''); }
  sSel.addEventListener('change', function () { aIn.value = '1'; bIn.value = String(Math.min(SURAH_A[+sSel.value - 1], 10)); stopPrev(); upd(); });
  aIn.addEventListener('change', function () { if (+bIn.value < +aIn.value) bIn.value = aIn.value; stopPrev(); upd(); });
  bIn.addEventListener('change', function () { stopPrev(); upd(); });
  qSel.addEventListener('change', function () { stopPrev(); });
  const pvBtn = el('button', { type: 'button', class: 'btn sm line', onclick: function () { if (prev && prev.playing()) { stopPrev(); return; } stopPrev(); prev = tilawaPlayer(cur(), qSel.value, { state: function (v) { pvBtn.lastChild.textContent = v ? 'إيقاف' : 'استمع'; } }); prev.play(); } }, [ico('play'), el('span', { text: 'استمع' })]);
  function stopPrev() { if (prev) { prev.stop(); prev = null; } pvBtn.lastChild.textContent = 'استمع'; }
  upd();
  modal({ title: L ? 'التلاوة' : qrMode ? 'رمز استماع لآيات' : 'تلاوة آيات', wide: true,
    body: [
      el('p', { class: 'tiny', text: qrMode ? 'رمز QR يُطبع على التصميم؛ يمسحه الطالب بهاتفه فتُفتح صفحة فيها نص الآيات بالرسم العثماني وتلاوتها بصوت القارئ الذي تختاره، مع التكرار.' : 'زر في الشريحة يُسمِع الآيات بصوت القارئ الذي تختاره، آيةً آية. يعمل في العرض الحي وفي رابط المشاهدة.' }),
      el('div', { class: 'fld' }, [el('label', { text: 'السورة' }), sSel]),
      el('div', { class: 'tlrange' }, [el('label', {}, [el('span', { text: 'من الآية' }), aIn]), el('label', {}, [el('span', { text: 'إلى الآية' }), bIn])]),
      info,
      el('div', { class: 'fld' }, [el('label', { text: 'القارئ' }), el('div', { class: 'row' }, [qSel, pvBtn])]),
      el('div', { class: 'fld' }, [el('label', { text: 'تكرار كل آية' }), segMini([['1', 'مرة'], ['2', 'مرتان'], ['3', '٣ مرات'], ['5', '٥ مرات']], String(rep), function (v) { rep = +v; stopPrev(); })]),
      el('p', { class: 'tiny', text: 'التكرار والمصحف المعلّم يناسبان الحفظ والترديد مع الطلاب.' }),
      qrMode ? el('div', { class: 'mtogs' }, [el('label', { class: 'tog' }, [withCap, el('span', { text: 'اكتب تحته: «امسح لتستمع»' })]), el('label', { class: 'tog' }, [withText, el('span', { text: 'أضف نص الآيات إلى التصميم' })])])
        : el('div', { class: 'mtogs' }, [el('label', { class: 'tog' }, [pick, el('span', { text: 'اختيار القارئ أثناء العرض' })]), L ? null : el('label', { class: 'tog' }, [withText, el('span', { text: 'أضف نص الآيات إلى الشريحة' })]), L ? null : el('label', { class: 'tog' }, [withQr, el('span', { text: 'ورمز QR للاستماع (للطباعة والمشاركة)' })])])
    ],
    acts: [{ t: L ? 'حفظ' : 'أضف', cls: 'dark', fn: function () {
      stopPrev(); const c = cur(); ls('qari', qSel.value);
      if (L) { const old = L.title, oldDef = !old || old === 'استمع: ' + tilawaLabel(L.qr || c); L.qr = c; if (oldDef) L.title = 'استمع: ' + tilawaLabel(c); changed6(); buildPanel(); return; }
      const keep = S.sel;
      if (withText.checked) tilawaText(c, keep).catch(function () { toast('تعذّر جلب نص الآيات. أضفه من «آية أو حديث موثّق».'); });
      if (!qrMode) addTilawaLayer(c);
      if (withQr.checked) addListenQr(c, qrMode ? withCap.checked : true);
    } }, { t: 'إلغاء', fn: stopPrev }],
    onClose: stopPrev });
}
function addTilawaLayer(q, at) {
  const sz = SIZES[S.size] || SIZES.slide, w = 0.3, h = w * 0.22 * sz.w / sz.h;
  addLayer6(Object.assign({ t: 'audio', qr: cleanQr(q), w: w, title: 'استمع: ' + tilawaLabel(q), x: 0.5, y: +(1 - 0.05 - h / 2).toFixed(4) }, at || {}));
  toast('✓ أُضيف زر التلاوة. يعمل في العرض الحي.');
}
// رمز QR يفتح صفحة الاستماع، في الزاوية السفلى، وتحته «امسح لتستمع»
function addListenQr(q, cap) {
  const sz = SIZES[S.size] || SIZES.post || { w: 1080, h: 1350 }, qw = 0.16, qh = qw * sz.w / sz.h, capH = cap ? 0.03 * sz.w / sz.h : 0;
  const x = +(0.05 + qw / 2).toFixed(4), y = +(1 - 0.05 - capH - qh / 2).toFixed(4);
  addLayer6({ t: 'qr', url: listenUrl(q), w: qw, c: '', bg: '#ffffff', x: x, y: y });
  if (cap) addLayer6({ t: 'text', txt: 'امسح لتستمع', al: 'center', c: '#222222', bgc: '#ffffff', bgp: 0.5, bgr: 1, sz: 0.02, b: 0.6, w: qw * 1.5, x: x, y: +(y + qh / 2 + capH * 0.6).toFixed(4) });
  toast('✓ أُضيف رمز الاستماع. جرّبه بهاتفك.');
}
// نص الآيات المحددة من المصحف (برواية حفص) في الحقل المحدد أو طبقة نص
async function tilawaText(q, keep) {
  const refs = []; for (let n = q.a; n <= q.b; n++) refs.push(q.s + ':' + n);
  const ed = rasmEd(), out = await Promise.all(refs.map(function (r) { return qget('ayah/' + r + '/' + ed); }));
  const multi = out.length > 1, text = out.map(function (d) { return noBasmala(d.text, q.s, d.numberInSurah) + (multi ? (ed === 'quran-uthmani' ? ' ۝' + arD(d.numberInSurah) : ' (' + arD(d.numberInSurah) + ')') : ''); }).join(' ');
  const ref = '[' + SURAH_N[q.s - 1] + ': ' + arD(q.a) + (q.b > q.a ? '–' + arD(q.b) : '') + ']';
  if (keep !== undefined) S.sel = keep;
  insertVerified({ kind: 'ayah', rasm: ed === 'quran-uthmani' ? 'uthmani' : '', text: text, ref: ref, line: '﴿' + text + '﴾ ' + ref });
}

/* ---------- إعدادات العنصر في لوحة المحرر ---------- */
function tilawaSettings(L, b) {
  const q = cleanQr(L.qr || {}), set = function (k, v) { const c = Object.assign({}, L.qr); if (v === undefined) delete c[k]; else c[k] = v; L.qr = cleanQr(c); changed6(); };
  const box = el('div', { class: 'mset' });
  box.append.apply(box, anSection('التلاوة', 'سورة ' + tilawaLabel(q) + ' · ' + qariOf(q.r).n));
  let pv = null;
  const pvBtn = el('button', { type: 'button', class: 'btn sm line', onclick: function () { if (pv && pv.playing()) { pv.stop(); pv = null; return; } if (pv) pv.stop(); pv = tilawaPlayer(cleanQr(L.qr), (L.qr || {}).r, { state: function (v) { pvBtn.lastChild.textContent = v ? 'إيقاف' : 'استمع'; } }); pv.play(); } }, [ico('play'), el('span', { text: 'استمع' })]);
  box.appendChild(el('div', { class: 'row wrapr' }, [el('button', { type: 'button', class: 'btn sm dark', onclick: function () { if (pv) pv.stop(); tilawaDialog(L); } }, [ico('book'), el('span', { text: 'الآيات والقارئ' })]), pvBtn]));
  box.appendChild(el('div', { class: 'fld' }, [el('label', { text: 'القارئ' }), el('select', { class: 'inp sm', onchange: function (e) { if (pv) { pv.stop(); pv = null; } ls('qari', e.target.value); set('r', e.target.value); } }, QARI.map(function (x) { return el('option', { value: x.id, selected: x.id === qariOf(q.r).id }, [x.n]); }))]));
  box.appendChild(el('div', { class: 'fld' }, [el('label', { text: 'تكرار كل آية' }), segMini([['1', 'مرة'], ['2', 'مرتان'], ['3', '٣'], ['5', '٥']], String(q.rep || 1), function (v) { set('rep', +v > 1 ? +v : undefined); })]));
  box.appendChild(el('div', { class: 'fld' }, [el('label', { text: 'التشغيل' }), segMini([['btn', 'بزر تشغيل'], ['auto', 'تلقائياً مع الشريحة']], L.auto ? 'auto' : 'btn', function (v) { if (v === 'auto') L.auto = true; else delete L.auto; changed6(); })]));
  const tog = function (text, on, fn) { return el('label', { class: 'tog' }, [el('input', { type: 'checkbox', checked: on, onchange: function (e) { fn(e.target.checked); } }), el('span', { text: text })]); };
  box.appendChild(el('div', { class: 'mtogs' }, [tog('اختيار القارئ أثناء العرض', q.pick !== false, function (v) { set('pick', v ? undefined : false); }), tog('يتكرر', !!L.loop, function (v) { if (v) L.loop = true; else delete L.loop; changed6(); })]));
  b.appendChild(box);
}
