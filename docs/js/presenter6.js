/* ================= عرض المقدّم: نافذة تُشارَك فيها الشرائح وحدها، ونافذة المقدّم أمامك =================
   نافذة العرض (#/stage) تفتح المنصة نفسها وتعرض الشرائح بكل حركتها ووسائطها وأدوات الدرس، بلا أي زر، فتشاركها في زوم أو ميت.
   ونافذة المقدّم هنا: الشرائح المصغّرة، والحالية والتالية، والملاحظات، والوقت، والقلم والقرعة والنقاط وإجابات الطلاب.
   النافذتان على قناة واحدة (BroadcastChannel): المقدّم يأمر، والعرض ينفّذ ويخبر بحاله.
   تنبيه للمستخدم: كروم يوقف رسم النافذة المغطّاة كلياً، فنافذة العرض يجب أن يبقى جزء منها ظاهراً (أو على شاشة ثانية). */
IC.sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>';
const PCON = { open: false };
function stageKey() { return Math.random().toString(36).slice(2, 10); }
function stageBase() { return location.origin + location.pathname + location.search; }

/* ---------- البدء: من المحرر أو من صفحة رابط العرض أو من شريط العرض ---------- */
function presenterMode(startAt, fromView) {
  if (PCON.open) return;
  if (!fromView && typeof commitPage === 'function') commitPage();
  const doc = ED.doc, T = S.track;
  if (!doc || !doc.pages || !doc.pages.length || !T) { toast('افتح عرضاً أولاً'); return; }
  const k = stageKey();
  window.ATHAR_STAGE = window.ATHAR_STAGE || {};
  window.ATHAR_STAGE[k] = { doc: JSON.parse(JSON.stringify(doc)), track: T.id, program: V6.prog && V6.prog.id, i: Math.max(0, Math.min(doc.pages.length - 1, startAt || 0)), fromView: !!fromView };
  const url = stageBase() + '#/stage?k=' + k;
  const openWin = function () { return window.open(url, 'athar_stage_' + k, 'popup=yes,width=1280,height=760'); };
  const pipOK = !!window.documentPictureInPicture && !window.PCON_NO_PIP;
  const start = function () {
    if (pipOK) { presenterPip(doc, T, k, window.ATHAR_STAGE[k].i, !!fromView); return; }
    const w = openWin(); presenterConsole(doc, T, k, window.ATHAR_STAGE[k].i, !!fromView, w, openWin); track('present', { tool: 'presenter' });
  };
  if (ls(pipOK ? 'pconIntroOff2' : 'pconIntroOff')) { start(); return; }
  presenterIntro(doc.name || 'عرض', start, pipOK);
}
// قناة داخل الصفحة نفسها بين العرض ولوحة المقدّم العائمة (بالشكل نفسه الذي تُستعمل به قناة النافذتين)
function localBus() {
  const a = { onmessage: null, close: function () {} }, b = { onmessage: null, close: function () {} };
  const deliver = function (to, m) { const d = JSON.parse(JSON.stringify(m)); setTimeout(function () { if (to.onmessage) to.onmessage({ data: d }); }, 0); };
  a.postMessage = function (m) { deliver(b, m); }; b.postMessage = function (m) { deliver(a, m); };
  return [a, b];
}
// لوحة المقدّم نافذةً عائمة فوق كل شيء (Document Picture-in-Picture): لا تدخل في مشاركة علامة التبويب، والعرض في علامة التبويبن نفسه
async function presenterPip(doc, T, k, startAt, fromView) {
  let pip;
  try { pip = await documentPictureInPicture.requestWindow({ width: Math.round(Math.min(1180, screen.availWidth * 0.62)), height: Math.round(Math.min(720, screen.availHeight * 0.66)) }); }
  catch (e) { toast('تعذّر فتح لوحة المقدّم العائمة، فنفتح نافذة العرض بدلها.'); window.PCON_NO_PIP = true; presenterMode(startAt, fromView); return; }
  const d = pip.document;
  d.documentElement.lang = 'ar'; d.documentElement.dir = 'rtl'; d.title = 'لوحة المقدّم';
  $$('style,link[rel=stylesheet]').forEach(function (x) { d.head.appendChild(x.cloneNode(true)); });
  (window.UI_FONT_SRC || []).forEach(function (f) { try { const ff = new pip.FontFace(f.family, 'url(' + f.url + ')', f.desc); d.fonts.add(ff); ff.load().catch(function () {}); } catch (e) {} });
  d.body.className = 'pip-con';
  const bus = localBus();
  present6(fromView, startAt, { bus: bus[0] });
  presenterConsole(doc, T, k, startAt, fromView, null, null, { bus: bus[1], pip: pip });
  track('present', { tool: 'presenter_pip' });
}
// نافذة تمهيدية: ما الذي سيحدث، وكيف يُشارَك العرض صحيحاً
function presenterIntro(name, start, pipOK) {
  const off = el('input', { type: 'checkbox', id: 'pcon_intro_off' });
  const step = function (n, b, t) { return el('li', { class: 'pci-s' }, [el('span', { class: 'pci-n', text: arDig(n) }), el('div', {}, [el('b', { text: b }), el('p', { class: 'muted small', text: t })])]); };
  const steps = pipOK ? [
    step(1, 'ابدأ المشاركة أولاً، وشارك علامة التبويب هذه', 'في ميت: «عرض الآن» ثم «علامة تبويب»، واختر علامة تبويب المنصة، وأبقِ «مشاركة صوت علامة التبويب» مفعّلاً. وفي زوم: «مشاركة الشاشة» ثم نافذة كروم. ثم ارجع إلى هنا واضغط «ابدأ العرض».'),
    step(2, 'لوحة المقدّم عائمة ولا يراها الطلاب', 'تظهر نافذة صغيرة فوق كل شيء: ما يراه الطلاب الآن، والتالي، وملاحظاتك، والمؤقت، وأدوات الدرس. حرّكها وكبّرها كما تشاء، فهي خارج المشاركة.'),
    step(3, 'تحكّم كما تعوّدت', 'زر «ملء الشاشة» في اللوحة يملأ بالعرض شاشتك. والأسهم أو نقّارة العرض للتنقل، وB للشاشة السوداء. وما تفعله بالقلم والقرعة والنقاط يظهر عند الطلاب فوراً.'),
    step(4, 'للإنهاء', '«إنهاء العرض» في اللوحة. وإن أغلقت اللوحة يبقى العرض بأزراره المعتادة.')
  ] : null;
  modal({ title: 'عرض المقدّم', body: [
    el('p', { class: 'pci-lead', text: pipOK ? 'يُعرض الدرس في علامة التبويب هذه (الصفحة المفتوحة الآن في أعلى المتصفح)، وهو ما يراه الطلاب. وتظهر لك لوحة المقدّم نافذةً عائمة فوق كل شيء، ولا تدخل في المشاركة.' : 'ستُفتح نافذتان: نافذة العرض فيها الشرائح وحدها، وهي التي يراها الطلاب. ونافذة المقدّم أمامك، تتحكم منها وترى ما يراه الطلاب.' }),
    el('ol', { class: 'pci' }, steps || [
      step(1, 'شارك نافذة العرض وحدها', 'في زوم: «مشاركة الشاشة» ثم اختر النافذة «عرض: ' + name + '». وفي ميت: «عرض الآن» ثم «نافذة». لا تشارك الشاشة كلها، فيرى الطلاب ملاحظاتك.'),
      step(2, 'فعّل مشاركة الصوت', 'إن كان في العرض تلاوة أو فيديو، فاختر «مشاركة الصوت» عند المشاركة ليسمعه الطلاب.'),
      step(3, 'أبقِ نافذة العرض ظاهرة', 'على شاشة واحدة: لا تغطِّها كلها بنافذة أخرى، فالمتصفح يوقف تحديث النافذة المغطّاة. أبقِ جزءاً منها ظاهراً. ومع شاشتين: اسحبها إلى الثانية واضغط F فيها لملء الشاشة.'),
      step(4, 'تحكّم من نافذتك', 'الأسهم أو نقّارة العرض للتنقل، والقلم والقرعة والنقاط وإجابات الطلاب تظهر عندهم. ووسط نافذتك يريك ما يرونه الآن.')
    ]),
    // الفرق بين المتصفحات: يُعلَّم ما يعمل عندك الآن
    el('div', { class: 'pci-br' }, [
      el('div', { class: 'pci-b' + (pipOK ? ' cur' : '') }, [pipOK ? el('em', { text: 'متصفحك الآن' }) : null, el('b', { text: 'كروم وإيدج: لوحة عائمة' }), el('p', { text: 'العرض في علامة تبويب واحدة تشاركها، ولوحتك تطفو فوقه ولا تدخل في المشاركة. وهي الطريقة الأسهل والأنسب.' })]),
      el('div', { class: 'pci-b' + (pipOK ? '' : ' cur') }, [pipOK ? null : el('em', { text: 'متصفحك الآن' }), el('b', { text: 'سفاري والمتصفحات الأخرى: نافذتان' }), el('p', { text: 'نافذة للعرض تشاركها وحدها، ونافذة لك. وتحتاج أن تبقى نافذة العرض ظاهرة. ' + (pipOK ? '' : 'افتح المنصة في كروم أو إيدج لتعمل بالطريقة الأولى.') })])
    ]),
    el('label', { class: 'tog pci-off', for: 'pcon_intro_off' }, [off, el('span', { text: 'فهمت، لا تعرض هذا مرة أخرى' })])
  ], acts: [{ t: 'ابدأ العرض', cls: 'dark', fn: function () { if (off.checked) ls(pipOK ? 'pconIntroOff2' : 'pconIntroOff', 1); start(); } }, { t: 'إلغاء' }] });
}

/* ---------- نافذة المقدّم ---------- */
function presenterConsole(doc, T, key, startAt, fromView, win, openWin, opt) {
  opt = opt || {}; PCON.open = true;
  const PIP = opt.pip || null, D = PIP ? PIP.document : document, W = PIP || window;
  const pages = doc.pages, ch = opt.bus || new BroadcastChannel('athar-stage-' + key);
  let i = startAt, step = 0, blank = '', live = false, lastSeen = 0, pen = { on: false, tool: 'pen', color: '#e5132b', cur: null, down: false }, inks = {}, laser = [];
  let t0 = Date.now(), cd = 0, cdEnd = 0, tick = 0, notesPx = Math.max(16, Math.min(40, +ls('pnotesz') || 22));
  const send = function (m) { try { ch.postMessage(m); } catch (e) {} };
  const steps = function (k) { return stepsOf(pages[k == null ? i : k]); };
  const arN = function (n) { return arDig(n); };

  /* -- الأجزاء -- */
  const status = el('span', { class: 'pc-status' });
  const reopen = el('button', { type: 'button', class: 'btn sm line pc-reopen', hidden: true, onclick: function () { win = openWin(); if (!win) toast('المتصفح منع النافذة: اسمح بالنوافذ المنبثقة لهذا الموقع.'); } }, [ico('slides'), 'افتح نافذة العرض']);
  const clock = el('b', { class: 'pc-clock', dir: 'ltr' }), elapsed = el('b', { class: 'pc-el', dir: 'ltr' }), cdEl = el('b', { class: 'pc-cd', dir: 'ltr', hidden: true });
  const thumbs = el('div', { class: 'pc-thumbs', role: 'list', 'aria-label': 'الشرائح' });
  const curBox = el('div', { class: 'pc-cur' }), curCv = el('canvas', { class: 'pc-cv' }), inkCv = el('canvas', { class: 'pc-ink', 'aria-hidden': 'true' });
  // ما يراه الطلاب: الشريحة نفسها، وفوقها ما تعرضه نافذة العرض الآن (الشاشة السوداء، القرعة، النقاط، الإجابات، الوسائط)
  const mBlank = el('div', { class: 'pcm-blank', hidden: true }), mScore = el('div', { class: 'pcm-score', hidden: true }), mPick = el('div', { class: 'pcm-pick', hidden: true });
  const mRes = el('span', { class: 'pcm-badge res', hidden: true }), mMedia = el('span', { class: 'pcm-badge med', hidden: true });
  const mZoom = el('div', { class: 'pcm-zoom', hidden: true }, [el('small')]);
  const frame = el('div', { class: 'pc-frame' }, [curCv, inkCv, mZoom, mScore, mPick, mRes, mMedia, mBlank]);
  const zoom = { tool: false, s: 0, x: 0.5, y: 0.5 };   // التكبير: المنطقة المكبّرة عند الطلاب
  curBox.append(el('span', { class: 'pc-live' }, [el('i'), 'ما يراه الطلاب الآن']), frame);
  const mirror = { pick: null, score: null, res: null, media: false };
  const nextCv = el('canvas', { class: 'pc-cv' }), nextLbl = el('small', { class: 'pc-nl' });
  // ملاحظاتك: تُكتب هنا أثناء العرض، وتُحفظ في الشريحة (إلا إن كان العرض من رابط مشاركة)
  const notes = el('textarea', { class: 'pc-notes-t', dir: 'auto', style: 'font-size:' + notesPx + 'px', 'aria-label': 'ملاحظاتك لهذه الشريحة', placeholder: fromView ? 'اكتب ملاحظاتك لهذه الشريحة. (العرض من رابط مشاركة، فلا تُحفظ فيه)' : 'اكتب ملاحظاتك لهذه الشريحة، وتُحفظ معها.' });
  notes.addEventListener('input', function () { pages[i].notes = notes.value; if (!fromView) lessonDirty(); });
  notes.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); notes.blur(); ov.focus(); } });
  const counter = el('b', { class: 'pc-count', dir: 'ltr' });
  // زر الأدوات: أيقونة وتحتها اسم قصير، والاختصار في التلميح
  const B = function (icon, label, keyHint, fn, cls) { return el('button', { type: 'button', class: 'pcb' + (cls ? ' ' + cls : ''), title: label + (keyHint ? ' (' + keyHint + ')' : ''), 'aria-label': label, onclick: function (e) { e.stopPropagation(); fn(e); } }, [ico(icon), el('span', { text: label })]); };
  const bPrev = el('button', { type: 'button', class: 'pcn prevb', title: 'السابق (→)', 'aria-label': 'السابق', onclick: function (e) { e.stopPropagation(); prev(); } }, [ico('chev')]);
  const bNext = el('button', { type: 'button', class: 'pcn nextb', title: 'التالي (←)', 'aria-label': 'التالي', onclick: function (e) { e.stopPropagation(); next(); } }, [el('span', { text: 'التالي' }), ico('chev')]);
  const bPen = B('pen', 'القلم', 'P', function () { penToggle(); });
  const bZoom = B('zoomin', 'التكبير', 'Z', function () { zoomToggle(); });
  const bPick = B('dice', 'القرعة', 'R', function () { pickPanel(); });
  const bScore = B('trophy', 'النقاط', 'S', function () { scorePanel(); });
  const bRes = B('chart', 'الإجابات', 'Q', function () { send({ t: 'tool', k: 'res' }); });
  const bMedia = B('play', 'الوسائط', 'M', function () { send({ t: 'media' }); });
  const bBlack = B('eyeoff', 'سوداء', 'B', function () { setBlank(blank === '#000' ? '' : '#000'); });
  const bWhite = B('sun', 'بيضاء', 'W', function () { setBlank(blank === '#fff' ? '' : '#fff'); });
  const bTimer = B('clock', 'المؤقّت', 'T', timerDlg);
  const bGrid = B('grid', 'الشرائح', 'G', function () { gridToggle(); });
  // في وضع اللوحة العائمة: العرض في علامة تبويب المنصة، وهذا الزر يملأ به الشاشة (نقرة في اللوحة تكفي لإذن المتصفح)
  const bFull = PIP ? B('expand', 'ملء الشاشة', 'F', function () { send({ t: 'fs' }); }, 'fullb') : null;
  const bEnd = el('button', { type: 'button', class: 'pc-end', onclick: function () { end(); } }, [ico('close'), 'إنهاء العرض']);
  const side = el('div', { class: 'pc-side' }); // لوحات القرعة والنقاط والمؤقّت

  const penBar = el('div', { class: 'pc-penbar', hidden: true });
  [['pen', 'pen', 'قلم'], ['marker', 'marker', 'تحديد'], ['laser', 'laser', 'ليزر'], ['eraser', 'eraser', 'ممحاة']].forEach(function (x) { penBar.appendChild(el('button', { type: 'button', class: 'pp', 'data-tool': x[0], title: x[2], 'aria-label': x[2], onclick: function () { pen.tool = x[0]; syncPen(); } }, [ico(x[1])])); });
  [['#e5132b', 'أحمر'], ['#1a71fd', 'أزرق'], ['#2f9e5c', 'أخضر'], ['#111111', 'أسود'], ['#ffffff', 'أبيض']].forEach(function (c) { penBar.appendChild(el('button', { type: 'button', class: 'pcc', 'data-c': c[0], title: c[1], 'aria-label': c[1], style: 'background:' + c[0], onclick: function () { pen.color = c[0]; if (pen.tool === 'eraser' || pen.tool === 'laser') pen.tool = 'pen'; syncPen(); } })); });
  penBar.appendChild(el('button', { type: 'button', class: 'pp', title: 'امسح الشريحة (C)', 'aria-label': 'امسح ما كُتب على الشريحة', onclick: function () { delete inks[i]; drawInk(); sendInk(); } }, [ico('trash')]));

  const TW = [170, 240, 330, 460]; let tw = Math.max(0, Math.min(3, +ls('pcongrid') || 1));
  const twSet = function (d) { tw = Math.max(0, Math.min(3, tw + d)); ls('pcongrid', tw); thumbs.style.setProperty('--tw', TW[tw] + 'px'); twDn.disabled = tw === 0; twUp.disabled = tw === 3; buildThumbs(); };
  const twDn = el('button', { type: 'button', class: 'pcz', title: 'تصغير الشرائح', 'aria-label': 'تصغير الشرائح', onclick: function () { twSet(-1); } }, [ico('zoomout')]);
  const twUp = el('button', { type: 'button', class: 'pcz', title: 'تكبير الشرائح', 'aria-label': 'تكبير الشرائح', onclick: function () { twSet(1); } }, [ico('zoomin')]);
  thumbs.style.setProperty('--tw', TW[tw] + 'px');
  const gridBox = el('div', { class: 'pc-grid', hidden: true }, [el('div', { class: 'pc-gh' }, [el('b', { text: 'كل الشرائح' }), el('small', { class: 'pc-ghint', text: 'انقر شريحة للانتقال إليها، والعين لإخفائها من العرض.' }), el('span', { class: 'sp' }), twDn, twUp,
    el('button', { type: 'button', class: 'pcz', 'aria-label': 'إغلاق', onclick: function () { gridToggle(false); } }, [ico('close')])]), thumbs]);
  const ov = el('div', { class: 'pcon' + (PIP ? ' pip' : ''), role: 'dialog', 'aria-label': 'عرض المقدّم', tabindex: '0' }, [
    el('header', { class: 'pc-top' }, [
      el('div', { class: 'pc-title' }, [el('span', { class: 'pc-dot' }), el('b', { text: doc.name || 'عرض' }), status, reopen]),
      el('span', { class: 'sp' }),
      el('div', { class: 'pc-times' }, [
        el('span', { class: 'pc-tm', title: 'الساعة' }, [clock]),
        el('span', { class: 'pc-tm', title: 'منذ البداية' }, [el('small', { text: 'مضى' }), elapsed]),
        el('span', { class: 'pc-tm cd', title: 'المتبقي من المؤقّت' }, [el('small', { text: 'بقي' }), cdEl])]),
      bEnd
    ]),
    el('div', { class: 'pc-body' }, [
      el('main', { class: 'pc-main' }, [curBox, penBar, gridBox]),
      el('aside', { class: 'pc-aside' }, [
        el('div', { class: 'pc-next' }, [el('div', { class: 'pc-nh' }, [el('small', { class: 'pc-h', text: 'التالي' }), el('span', { class: 'sp' }), nextLbl]), nextCv]),
        el('div', { class: 'pc-notes' }, [el('div', { class: 'pc-nh' }, [el('small', { class: 'pc-h', text: 'ملاحظاتك' }), el('span', { class: 'sp' }),
          el('button', { type: 'button', class: 'pcz', 'aria-label': 'تصغير الخط', onclick: function () { zoomNotes(-2); } }, ['أ−']), el('button', { type: 'button', class: 'pcz', 'aria-label': 'تكبير الخط', onclick: function () { zoomNotes(2); } }, ['أ+'])]), notes]),
        side
      ])
    ]),
    el('footer', { class: 'pc-bar' }, [
      el('div', { class: 'pc-g nav' }, [bPrev, counter, bNext]),
      el('div', { class: 'pc-g tools', role: 'toolbar', 'aria-label': 'أدوات الدرس' }, [bPen, bZoom, bPick, bScore, bRes, bMedia]),
      el('div', { class: 'pc-g screen', role: 'toolbar', 'aria-label': 'الشاشة والوقت' }, [bBlack, bWhite, bTimer, bGrid, bFull])
    ])
  ]);

  /* -- الرسم -- */
  function render(cv, p, k, st, maxW, maxH) {
    const sz = SIZES[p.size || 'slide'], r = Math.max(0.02, Math.min(maxW / sz.w, maxH / sz.h)), dpr = Math.min(2, W.devicePixelRatio || 1);
    const q = pageAtStep(p, st); q.d.__n = k ? String(k + 1) : '';
    // الرسم في لوحة من الصفحة الأصلية (فيها خطوط الهوية)، ثم نسخ الصورة إلى اللوحة الظاهرة
    const off = document.createElement('canvas'); renderSlide(off, q, T, r * dpr);
    cv.width = off.width; cv.height = off.height; cv.getContext('2d').drawImage(off, 0, 0);
    cv.style.width = Math.round(sz.w * r) + 'px'; cv.style.height = Math.round(sz.h * r) + 'px';
  }
  function drawCur() {
    const p = pages[i], bw = curBox.clientWidth || 800, bh = curBox.clientHeight || 450;
    render(curCv, p, i, step, bw, bh - 30);
    inkCv.style.width = curCv.style.width; inkCv.style.height = curCv.style.height;
    frame.style.width = curCv.style.width; frame.style.height = curCv.style.height;
    const dpr = Math.min(2, W.devicePixelRatio || 1); inkCv.width = Math.round(parseFloat(curCv.style.width) * dpr); inkCv.height = Math.round(parseFloat(curCv.style.height) * dpr);
    drawInk();
  }
  function drawNext() {
    const st = steps(), w = nextCv.parentNode.clientWidth || 300;
    if (step < st.length) { render(nextCv, pages[i], i, step + 1, w, w * 0.6); nextLbl.textContent = st[step] === '__answer' ? 'نقرة تكشف الجواب' : 'نقرة تُظهر العنصر التالي'; nextCv.hidden = false; }
    else if (shownAfter(pages, i, 1) >= 0) { const n = shownAfter(pages, i, 1); render(nextCv, pages[n], n, 0, w, w * 0.6); nextLbl.textContent = 'الشريحة ' + arN(n + 1); nextCv.hidden = false; }
    else { nextCv.hidden = true; nextLbl.textContent = 'نهاية العرض'; }
  }
  function buildThumbs() {
    thumbs.innerHTML = '';
    pages.forEach(function (p, k) {
      const c = el('canvas', { class: 'pc-tcv' });
      const eye = el('button', { type: 'button', class: 'pc-teye', title: p.skip ? 'إظهارها في العرض' : 'إخفاؤها من العرض', 'aria-label': (p.skip ? 'إظهار' : 'إخفاء') + ' الشريحة ' + (k + 1), 'aria-pressed': p.skip ? 'true' : 'false', onclick: function (e) { e.stopPropagation(); skipToggle(k); } }, [ico(p.skip ? 'eyeoff' : 'eye')]);
      const b = el('div', { class: 'pc-t' + (p.skip ? ' skip' : ''), role: 'listitem' }, [
        el('button', { type: 'button', class: 'pc-tgo', 'aria-label': 'انتقل إلى الشريحة ' + (k + 1) + (p.skip ? ' (مخفية)' : ''), onclick: function () { goTo(k); } }, [c]),
        el('small', { text: arN(k + 1) }), p.skip ? el('span', { class: 'pc-tskip', text: 'مخفية' }) : null, eye]);
      thumbs.appendChild(b);
      const w = TW[tw] * 1.5;
      setTimeout(function () { if (ov.isConnected) render(c, p, k, steps(k).length, w, w * 0.6); }, 30 + k * 25);
    });
  }
  function markThumbs() { $$('.pc-t', thumbs).forEach(function (b, k) { b.classList.toggle('on', k === i); b.setAttribute('aria-current', k === i ? 'true' : 'false'); }); const on = thumbs.children[i]; if (on) on.scrollIntoView({ block: 'nearest' }); }
  function update(push) {
    drawCur(); drawNext(); markThumbs();
    const p = pages[i], st = steps();
    counter.textContent = (i + 1) + ' / ' + pages.length + (st.length ? ' · ' + step + '/' + st.length : '');
    if (D.activeElement !== notes || notes._i !== i) { notes.value = p.notes || ''; notes._i = i; }
    bPrev.disabled = step === 0 && shownAfter(pages, i, -1) < 0; bNext.disabled = step >= st.length && shownAfter(pages, i, 1) < 0;
    if (zoom.s) { zoom.s = 0; drawZoom(); if (push !== false) send({ t: 'zoom', s: 1 }); }
    if (push !== false) send({ t: 'go', i: i, step: step });
    if (scoreOpen) fillScore();
  }
  function next() { const st = steps(); if (step < st.length) step++; else { const n = shownAfter(pages, i, 1); if (n < 0) return; i = n; step = 0; } if (blank) setBlank(''); update(); }
  function prev() { if (step > 0) step--; else { const n = shownAfter(pages, i, -1); if (n < 0) return; i = n; step = 0; } if (blank) setBlank(''); update(); }
  function goTo(k) { k = Math.max(0, Math.min(pages.length - 1, k)); gridToggle(false); if (k === i && !step) return; i = k; step = 0; if (blank) setBlank(''); update(); ov.focus(); }
  function skipToggle(k) {
    const p = pages[k]; if (p.skip) delete p.skip; else p.skip = true;
    if (!fromView) lessonDirty(); send({ t: 'skip', i: k, on: !!p.skip });
    buildThumbs(); markThumbs(); drawNext(); update(false);
  }
  function gridToggle(on) { on = on == null ? gridBox.hidden : on; gridBox.hidden = !on; bGrid.classList.toggle('on', on); if (on) { markThumbs(); } else ov.focus(); }
  /* -- التكبير: نقرة على الشريحة تكبّر تلك المنطقة عند الطلاب، والعجلة تغيّر الدرجة -- */
  const clampZ = function (v, s) { const h = 0.5 / s; return Math.max(h, Math.min(1 - h, v)); };
  function drawZoom() {
    mZoom.hidden = !zoom.s; inkCv.classList.toggle('on', pen.on || zoom.tool); inkCv.dataset.tool = zoom.tool && !pen.on ? 'zoom' : pen.tool;
    bZoom.classList.toggle('on', zoom.tool || !!zoom.s);
    if (!zoom.s) return;
    const w = 100 / zoom.s, x = clampZ(zoom.x, zoom.s), y = clampZ(zoom.y, zoom.s);
    mZoom.style.cssText = 'width:' + w + '%;height:' + w + '%;left:' + (x * 100 - w / 2) + '%;top:' + (y * 100 - w / 2) + '%';
    mZoom.firstChild.textContent = 'يراها الطلاب ×' + arN(String(Math.round(zoom.s * 10) / 10));
  }
  function zoomSend() { send({ t: 'zoom', s: zoom.s || 1, x: zoom.x, y: zoom.y }); }
  function zoomToggle(on) {
    if (on == null) on = !(zoom.tool || zoom.s);
    zoom.tool = on; if (on && pen.on) penToggle(false);
    if (!on && zoom.s) { zoom.s = 0; zoomSend(); }
    drawZoom();
  }
  function zoomAt(p) { zoom.x = p[0]; zoom.y = p[1]; if (!zoom.s) zoom.s = 2; drawZoom(); zoomSend(); }
  inkCv.addEventListener('wheel', function (e) { if (!zoom.tool || pen.on) return; e.preventDefault(); if (!zoom.s) { zoomAt(ptOf(e)); return; } zoom.s = Math.max(1.5, Math.min(4, zoom.s + (e.deltaY < 0 ? 0.5 : -0.5))); drawZoom(); zoomSend(); }, { passive: false });
  function setBlank(c, local) { blank = c; if (!local) send({ t: 'blank', c: c }); mBlank.hidden = !c; mBlank.dataset.c = c || ''; mBlank.textContent = c === '#000' ? 'الطلاب يرون شاشة سوداء' : c === '#fff' ? 'الطلاب يرون شاشة بيضاء' : ''; bBlack.classList.toggle('on', c === '#000'); bWhite.classList.toggle('on', c === '#fff'); }
  function drawMirror() {
    const pk = mirror.pick; mPick.hidden = !(pk && pk.on);
    if (pk && pk.on) mPick.replaceChildren(el('div', { class: 'pcm-pkc' }, [el('b', { class: 'pcm-pkt', text: 'القرعة' }),
      pk.mode === 'nums' && pk.from ? el('div', { class: 'pcm-pkr' }, [el('span', { text: 'من' }), el('i', { text: String(pk.from) }), el('span', { text: 'إلى' }), el('i', { text: String(pk.to) })]) : null,
      el('div', { class: 'pcm-pkn' + (pk.won ? ' won' : '') + (pk.won === false && pk.name !== '؟' ? ' spin' : ''), text: pk.name || '؟' }),
      pk.info ? el('small', { class: 'pcm-info', text: pk.info }) : null]));
    const sc = mirror.score; mScore.hidden = !(sc && sc.on && sc.teams && sc.teams.length);
    if (!mScore.hidden) { const top = Math.max.apply(null, sc.teams.map(function (t) { return t.p || 0; })); mScore.replaceChildren.apply(mScore, sc.teams.map(function (t) { return el('span', { class: 'pcm-team' + (top > 0 && (t.p || 0) === top ? ' lead' : ''), style: '--tc:' + t.c }, [el('i'), t.n, el('b', { text: arN(t.p || 0) })]); })); }
    const rs = mirror.res; mRes.hidden = !(rs && rs.on); if (rs && rs.on) mRes.textContent = 'إجابات الطلاب ظاهرة' + (rs.total ? ' · ' + arN(rs.total) + ' أجابوا' : rs.qr ? ' · رمز الدخول' : '');
    mMedia.hidden = !mirror.media; mMedia.textContent = '▶ الوسائط تعمل الآن';
    bRes.classList.toggle('on', !!(rs && rs.on));
  }
  function zoomNotes(d) { notesPx = Math.max(14, Math.min(44, notesPx + d)); notes.style.fontSize = notesPx + 'px'; ls('pnotesz', notesPx); }

  /* -- الوقت -- */
  const fmt = function (s) { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + ('0' + m).slice(-2) : m) + ':' + ('0' + x).slice(-2); };
  function clockTick() {
    if (!ov.isConnected) { clearInterval(tick); return; }
    const d = new Date(); clock.textContent = d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2);
    elapsed.textContent = fmt((Date.now() - t0) / 1000);
    if (cd) { const left = (cdEnd - Date.now()) / 1000; cdEl.textContent = left > 0 ? fmt(left) : 'انتهى'; cdEl.parentNode.classList.toggle('warn', left <= 60 && left > 0); cdEl.parentNode.classList.toggle('over', left <= 0); }
    // حال نافذة العرض
    if (PIP) { status.className = 'pc-status ok'; status.textContent = 'لا يراها الطلاب'; status.title = 'هذه اللوحة خارج المشاركة، والعرض يعمل في علامة تبويب المنصة'; reopen.hidden = true; return; }
    const closed = !win || win.closed;
    const ok = !closed && live && Date.now() - lastSeen < 8000;
    status.className = 'pc-status ' + (ok ? 'ok' : closed ? 'off' : 'wait');
    status.textContent = ok ? 'نافذة العرض متصلة' : closed ? 'نافذة العرض مغلقة' : 'نفتح نافذة العرض…';
    reopen.hidden = !closed;
    if (!closed && Date.now() - lastSeen > 3000) send({ t: 'ping' });
  }
  function timerDlg() {
    if (cd) { cd = 0; cdEl.hidden = true; cdEl.parentNode.classList.remove('on', 'warn', 'over'); bTimer.classList.remove('on'); return; }
    closeSide();
    const m = el('input', { type: 'number', min: '1', max: '240', value: String(ls('pconMin') || 45), class: 'inp sm pc-min', 'aria-label': 'عدد الدقائق' });
    const go = function () { const n = Math.max(1, +m.value || 45); ls('pconMin', n); cd = n * 60; cdEnd = Date.now() + cd * 1000; cdEl.hidden = false; cdEl.parentNode.classList.add('on'); bTimer.classList.add('on'); closeSide(); clockTick(); ov.focus(); };
    m.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    side.append(el('div', { class: 'pc-panel' }, [el('div', { class: 'pc-nh' }, [el('b', { text: 'مؤقّت للدرس' }), el('span', { class: 'sp' }), el('button', { type: 'button', class: 'ib sm', 'aria-label': 'إغلاق', onclick: closeSide }, [ico('close')])]),
      el('div', { class: 'row' }, [m, el('span', { text: 'دقيقة' }), el('span', { class: 'sp' }), el('button', { type: 'button', class: 'btn dark sm', onclick: go }, ['ابدأ'])]),
      el('p', { class: 'tiny', text: 'يظهر لك وحدك، ويتلوّن في الدقيقة الأخيرة.' })]));
    setTimeout(function () { m.focus(); m.select(); }, 30);
  }

  /* -- القلم على الشريحة الحالية، ينعكس عند الطلاب -- */
  function syncPen() { $$('.pp[data-tool]', penBar).forEach(function (b) { b.classList.toggle('on', b.dataset.tool === pen.tool); }); $$('.pcc', penBar).forEach(function (b) { b.classList.toggle('on', b.dataset.c === pen.color && (pen.tool === 'pen' || pen.tool === 'marker')); }); inkCv.dataset.tool = pen.tool; }
  function penToggle(on) { pen.on = on == null ? !pen.on : on; if (pen.on) zoom.tool = false; penBar.hidden = !pen.on; drawZoom(); bPen.classList.toggle('on', pen.on); syncPen(); if (!pen.on) { laser = []; send({ t: 'laser', pts: [] }); drawInk(); } }
  function pathOf(g, pts, W, H) { g.beginPath(); g.moveTo(pts[0][0] * W, pts[0][1] * H); if (pts.length < 3) { pts.forEach(function (p) { g.lineTo(p[0] * W + 0.01, p[1] * H); }); return; } for (let n = 1; n < pts.length - 1; n++) { const mx = (pts[n][0] + pts[n + 1][0]) / 2, my = (pts[n][1] + pts[n + 1][1]) / 2; g.quadraticCurveTo(pts[n][0] * W, pts[n][1] * H, mx * W, my * H); } const l = pts[pts.length - 1]; g.lineTo(l[0] * W, l[1] * H); }
  function drawInk() {
    const g = inkCv.getContext('2d'), W = inkCv.width, H = inkCv.height; g.clearRect(0, 0, W, H);
    (inks[i] || []).concat(pen.cur ? [pen.cur] : []).forEach(function (s) { g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = s.c; if (s.t === 'marker') { g.globalAlpha = 0.38; g.lineWidth = W * 0.024; g.lineCap = 'butt'; } else g.lineWidth = W * 0.0042; pathOf(g, s.pts, W, H); g.stroke(); g.restore(); });
    const now = performance.now(); laser = laser.filter(function (p) { return now - p[2] < 650; });
    if (laser.length) { const h = laser[laser.length - 1]; g.save(); g.fillStyle = '#ff2a2a'; g.shadowColor = 'rgba(255,0,0,.9)'; g.shadowBlur = W * 0.02; g.beginPath(); g.arc(h[0] * W, h[1] * H, W * 0.008, 0, Math.PI * 2); g.fill(); g.restore(); requestAnimationFrame(drawInk); }
  }
  let inkRaf = 0;
  function sendInk() { if (inkRaf) return; inkRaf = requestAnimationFrame(function () { inkRaf = 0; send({ t: 'ink', i: i, strokes: (inks[i] || []).concat(pen.cur ? [pen.cur] : []) }); }); }
  const ptOf = function (e) { const r = inkCv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  inkCv.addEventListener('pointerdown', function (e) {
    if (!pen.on) { if (zoom.tool) { e.preventDefault(); zoomAt(ptOf(e)); } return; } e.preventDefault(); try { inkCv.setPointerCapture(e.pointerId); } catch (er) {}
    const p = ptOf(e); pen.down = true;
    if (pen.tool === 'eraser') { erase(p); return; }
    if (pen.tool === 'laser') { laserAt(p); return; }
    pen.cur = { t: pen.tool, c: pen.tool === 'marker' ? (pen.color === '#111111' || pen.color === '#ffffff' ? '#ffd400' : pen.color) : pen.color, pts: [p] }; drawInk(); sendInk();
  });
  inkCv.addEventListener('pointermove', function (e) {
    if (!pen.on) return; const p = ptOf(e);
    if (pen.tool === 'laser') { if (pen.down || e.pointerType === 'mouse') laserAt(p); return; }
    if (!pen.down) return;
    if (pen.tool === 'eraser') { erase(p); return; }
    if (pen.cur) { const l = pen.cur.pts[pen.cur.pts.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) > 0.0015) { pen.cur.pts.push(p); drawInk(); sendInk(); } }
  });
  const penUp = function () { pen.down = false; if (pen.cur) { (inks[i] = inks[i] || []).push(pen.cur); pen.cur = null; drawInk(); sendInk(); } };
  inkCv.addEventListener('pointerup', penUp); inkCv.addEventListener('pointercancel', penUp);
  function erase(p) { const rr = 0.02, before = (inks[i] || []).length; inks[i] = (inks[i] || []).filter(function (s) { return !s.pts.some(function (q) { return Math.abs(q[0] - p[0]) < rr && Math.abs(q[1] - p[1]) < rr * 1.6; }); }); if (inks[i].length !== before) { drawInk(); sendInk(); } }
  let laserT = 0;
  function laserAt(p) { laser.push([p[0], p[1], performance.now()]); if (laser.length === 1) drawInk(); const now = performance.now(); if (now - laserT > 30) { laserT = now; send({ t: 'laser', pts: laser.map(function (q) { return [q[0], q[1], now - q[2]]; }) }); } }

  /* -- القرعة والنقاط: تُدار من هنا وتظهر عند الطلاب -- */
  let pickOpen = false, scoreOpen = false, scoreShown = false;
  function closeSide() { side.innerHTML = ''; pickOpen = false; scoreOpen = false; bPick.classList.remove('on'); bScore.classList.toggle('on', scoreShown); }
  // إعداد القرعة من هنا، ويظهر عند الطلاب كما هو
  const pk = { mode: '', from: 1, to: 30, noRep: true };
  function pickSend() { send({ t: 'pickset', mode: pk.mode, from: pk.from, to: pk.to, noRep: pk.noRep, names: lessonOf(doc).names || [] }); }
  function pickPanel() {
    if (pickOpen) { send({ t: 'pickclose' }); closeSide(); return; }
    closeSide(); pickOpen = true; bPick.classList.add('on');
    const names = function () { return lessonOf(doc).names || []; };
    if (!pk.mode) pk.mode = names().length ? 'names' : 'nums';
    send({ t: 'pickopen' }); pickSend();
    const fIn = el('input', { type: 'number', min: '1', value: String(pk.from), class: 'inp sm pc-num', 'aria-label': 'من' }), tIn = el('input', { type: 'number', min: '2', value: String(pk.to), class: 'inp sm pc-num', 'aria-label': 'إلى' });
    const numsRow = el('div', { class: 'row pc-pkr' }, [el('span', { text: 'من' }), fIn, el('span', { text: 'إلى' }), tIn]);
    const onNums = function () { pk.from = Math.max(1, +fIn.value || 1); pk.to = Math.max(pk.from + 1, Math.min(999, +tIn.value || 30)); pickSend(); };
    fIn.addEventListener('change', onNums); tIn.addEventListener('change', onNums);
    const ta = el('textarea', { class: 'pc-names', rows: '5', dir: 'auto', placeholder: 'اسم في كل سطر' }); ta.value = names().join('\n');
    const saveNames = function () { const l = ta.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); lessonOf(doc).names = l; if (!fromView) lessonDirty(); if (l.length && pk.mode === 'nums') { pk.mode = 'names'; drawMode(); } if (!l.length) { pk.mode = 'nums'; drawMode(); } pickSend(); };
    let nT = 0; ta.addEventListener('input', function () { clearTimeout(nT); nT = setTimeout(saveNames, 500); });
    ta.addEventListener('keydown', function (e) { e.stopPropagation(); });
    const namesBox = el('div', { class: 'pc-pkn' }, [ta, el('small', { class: 'tiny', text: fromView ? 'لهذه الجلسة فقط.' : 'تُحفظ مع العرض.' })]);
    const seg = el('div', { class: 'pc-seg', role: 'radiogroup', 'aria-label': 'نوع القرعة' });
    function drawMode() {
      seg.replaceChildren.apply(seg, [['nums', 'أرقام'], ['names', 'أسماء']].map(function (x) { return el('button', { type: 'button', role: 'radio', 'aria-checked': pk.mode === x[0] ? 'true' : 'false', class: pk.mode === x[0] ? 'on' : '', onclick: function () { pk.mode = x[0]; drawMode(); pickSend(); } }, [x[1]]); }));
      numsRow.hidden = pk.mode !== 'nums'; namesBox.hidden = pk.mode !== 'names';
    }
    drawMode();
    const rep = el('input', { type: 'checkbox', checked: pk.noRep, onchange: function (e) { pk.noRep = e.target.checked; pickSend(); } });
    side.append(el('div', { class: 'pc-panel' }, [el('div', { class: 'pc-nh' }, [el('b', { text: 'القرعة' }), el('span', { class: 'sp' }), el('button', { type: 'button', class: 'ib sm', 'aria-label': 'إغلاق القرعة', onclick: function () { send({ t: 'pickclose' }); closeSide(); } }, [ico('close')])]),
      seg, numsRow, namesBox,
      el('div', { class: 'row' }, [el('label', { class: 'tog' }, [rep, el('span', { text: 'بلا تكرار' })]), el('span', { class: 'sp' }),
        el('button', { type: 'button', class: 'btn dark pc-go', onclick: function () { send({ t: 'pickgo' }); } }, [ico('dice'), 'اختر'])]),
      el('p', { class: 'tiny', text: 'المسافة أو Enter تختار أيضاً.' })]));
  }
  function teams() { const l = lessonOf(doc); if (!l.teams || !l.teams.length) l.teams = [{ n: TEAM_NAMES[0], c: TEAM_COL[0], p: 0 }, { n: TEAM_NAMES[1], c: TEAM_COL[1], p: 0 }]; return l.teams; }
  function sendTeams() { send({ t: 'teams', teams: teams(), show: scoreShown }); }
  let tnT = 0;
  function fillScore() {
    const box = side.querySelector('.pc-teams'); if (!box) return; box.innerHTML = '';
    const ts = teams();
    ts.forEach(function (t, k) {
      // الفريق بموضعه لا بنسخته: في اللوحة العائمة يتشارك العرض والمقدّم الدرس نفسه، والعرض يستبدل القائمة عند كل تحديث
      const cur = function () { return teams()[k] || t; };
      const bump = function (d) { const tt = cur(); tt.p = Math.max(0, (tt.p || 0) + d); if (!fromView) lessonDirty(); fillScore(); sendTeams(); };
      const nm = el('input', { class: 'pc-tname', value: t.n, maxlength: '24', 'aria-label': 'اسم الفريق' });
      nm.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter' || e.key === 'Escape') { nm.blur(); ov.focus(); } });
      nm.addEventListener('input', function () { cur().n = nm.value.trim() || TEAM_NAMES[k] || 'فريق'; if (!fromView) lessonDirty(); clearTimeout(tnT); tnT = setTimeout(sendTeams, 300); });
      box.appendChild(el('div', { class: 'pc-team', style: '--tc:' + t.c }, [el('i'), nm, el('b', { text: arN(t.p || 0) }),
        el('button', { type: 'button', class: 'pcs', 'aria-label': 'أنقص نقطة من ' + t.n, onclick: function () { bump(-1); } }, ['−']), el('button', { type: 'button', class: 'pcs add', 'aria-label': 'أضف نقطة إلى ' + t.n, onclick: function () { bump(1); } }, ['+']),
        ts.length > 2 ? el('button', { type: 'button', class: 'pcs del', title: 'احذف الفريق', 'aria-label': 'احذف ' + t.n, onclick: function () { teams().splice(k, 1); if (!fromView) lessonDirty(); fillScore(); sendTeams(); } }, [ico('close')]) : el('span')]));
    });
    const foot = side.querySelector('.pc-tfoot'); if (foot) {
      foot.replaceChildren(
        ts.length < TEAM_COL.length ? el('button', { type: 'button', class: 'btn sm line pc-tadd', onclick: function () { const l = teams(), n = l.length; l.push({ n: TEAM_NAMES[n] || ('الفريق ' + arN(n + 1)), c: TEAM_COL.filter(function (c) { return !l.some(function (x) { return x.c === c; }); })[0] || TEAM_COL[n % TEAM_COL.length], p: 0 }); if (!fromView) lessonDirty(); fillScore(); sendTeams(); } }, [ico('plus'), 'فريق']) : null,
        el('span', { class: 'sp' }),
        el('button', { type: 'button', class: 'btn sm line', onclick: function () { teams().forEach(function (x) { x.p = 0; }); if (!fromView) lessonDirty(); fillScore(); sendTeams(); } }, [ico('reset'), 'صفّر النقاط']));
    }
  }
  function scorePanel() {
    if (scoreOpen) { closeSide(); return; }
    closeSide(); scoreOpen = true; scoreShown = true; bScore.classList.add('on'); sendTeams();
    const showT = el('input', { type: 'checkbox', checked: true, onchange: function (e) { scoreShown = e.target.checked; sendTeams(); } });
    side.append(el('div', { class: 'pc-panel' }, [el('div', { class: 'pc-nh' }, [el('b', { text: 'نقاط الفرق' }), el('span', { class: 'sp' }), el('button', { type: 'button', class: 'ib sm', 'aria-label': 'إغلاق النقاط', onclick: closeSide }, [ico('close')])]),
      el('div', { class: 'pc-teams' }), el('div', { class: 'row pc-tfoot' }), el('label', { class: 'tog' }, [showT, el('span', { text: 'تظهر للطلاب' })])]));
    fillScore();
  }

  /* -- لوحة المفاتيح ونقّارات العرض -- */
  function onKey(e) {
    if (!ov.isConnected) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (document.querySelector('.modal')) return;
    const k = e.key;
    if (k === 'Escape') { if (!gridBox.hidden) { gridToggle(false); return; } if (pen.on) { e.preventDefault(); penToggle(false); return; } if (zoom.tool || zoom.s) { zoomToggle(false); return; } }
    if (k === 'ArrowLeft' || k === ' ' || k === 'PageDown' || k === 'Enter' || k === 'ArrowDown') { e.preventDefault(); if (pickOpen && (k === ' ' || k === 'Enter')) { send({ t: 'pickgo' }); return; } next(); return; }
    if (k === 'ArrowRight' || k === 'PageUp' || k === 'Backspace' || k === 'ArrowUp') { e.preventDefault(); prev(); return; }
    if (k === 'Home') { goTo(0); return; } if (k === 'End') { goTo(pages.length - 1); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const m = { b: bBlack, '.': bBlack, 'لا': bBlack, w: bWhite, ',': bWhite, 'ص': bWhite, p: bPen, 'ح': bPen, r: bPick, 'ق': bPick, s: bScore, 'س': bScore, q: bRes, 'ض': bRes, m: bMedia, 'ة': bMedia, t: bTimer, 'ف': bTimer, f: bFull, 'ب': bFull, z: bZoom, 'ئ': bZoom, g: bGrid, 'ل': bGrid }[k.toLowerCase ? k.toLowerCase() : k];
    if (m) { e.preventDefault(); m.click(); return; }
    if (pen.on && (k === 'c' || k === 'C' || k === 'ؤ')) { delete inks[i]; drawInk(); sendInk(); }
  }

  /* -- القناة -- */
  ch.onmessage = function (e) {
    const m = e.data || {}; lastSeen = Date.now();
    if (m.t === 'ready') { live = true; update(); setBlank(blank); Object.keys(inks).forEach(function (k) { send({ t: 'ink', i: +k, strokes: inks[k] }); }); if (scoreShown) sendTeams(); if (zoom.s) zoomSend(); }
    else if (m.t === 'state') { live = true; if (m.i !== i || m.step !== step) { i = m.i; step = m.step; update(false); } }
    else if (m.t === 'pong') live = true;
    else if (m.t === 'm-pick') { mirror.pick = m; if (m.mode) { pk.mode = m.mode; } drawMirror(); }
    else if (m.t === 'm-fs') { if (bFull) { bFull.classList.toggle('on', !!m.on); bFull.classList.toggle('nudge', !m.on); } }
    else if (m.t === 'm-score') { mirror.score = m; drawMirror(); }
    else if (m.t === 'm-res') { mirror.res = m; drawMirror(); }
    else if (m.t === 'm-media') { mirror.media = !!m.on; drawMirror(); }
    else if (m.t === 'm-blank') { if ((m.c || '') !== blank) setBlank(m.c || '', true); }
    else if (m.t === 'closed') { live = false; if (PIP && !ended) { ended = true; clearInterval(tick); PCON.open = false; try { delete window.ATHAR_STAGE[key]; } catch (er) {} try { PIP.close(); } catch (er) {} } }
  };
  function end() {
    if (ended) return; ended = true;
    send({ t: 'end' }); try { if (win && !win.closed) win.close(); } catch (e) {}
    clearInterval(tick); D.removeEventListener('keydown', onKey); W.removeEventListener('resize', onRz);
    if (PIP) { try { PIP.close(); } catch (e) {} }
    setTimeout(function () { try { ch.close(); } catch (e) {} }, 300);
    ov.remove(); PCON.open = false; document.body.classList.remove('pcon-open');
    try { delete window.ATHAR_STAGE[key]; } catch (e) {}
    if (!fromView && typeof ED !== 'undefined' && ED.open) { ED.cur = i; try { loadPage(i); buildPanel(); drawNow(); buildPages(); } catch (e) {} }
  }
  let ended = false;
  let rzT = 0; function onRz() { clearTimeout(rzT); rzT = setTimeout(function () { drawCur(); drawNext(); }, 120); }
  D.addEventListener('keydown', onKey); W.addEventListener('resize', onRz);
  if (PIP) {
    // إغلاق اللوحة العائمة: يبقى العرض بأزراره المعتادة
    PIP.addEventListener('pagehide', function () { if (ended) return; ended = true; clearInterval(tick); send({ t: 'unfollow' }); PCON.open = false; try { delete window.ATHAR_STAGE[key]; } catch (e) {} });
    D.body.appendChild(ov);
  } else { document.body.appendChild(ov); document.body.classList.add('pcon-open'); }
  buildThumbs(); update(false); clockTick(); tick = setInterval(clockTick, 1000); ov.focus();
  if (!win && !PIP) toast('المتصفح منع نافذة العرض: اسمح بالنوافذ المنبثقة لهذا الموقع، ثم «افتح نافذة العرض».');
  return { end: end };
}

/* ---------- نافذة العرض (#/stage): الشرائح وحدها ---------- */
async function showStage6() {
  document.body.classList.add('stage6');
  const top = $('#top'); if (top) top.hidden = true;
  const k = (location.hash.split('?k=')[1] || '').replace(/[^a-z0-9]/g, '');
  let data = null;
  try { data = window.opener && window.opener.ATHAR_STAGE && window.opener.ATHAR_STAGE[k]; } catch (e) { data = null; }
  if (!data) { view(el('div', { class: 'boot stage-empty' }, [el('p', { text: 'هذه نافذة العرض. افتحها من «عرض المقدّم» في المحرر.' })])); return; }
  data = JSON.parse(JSON.stringify(data));
  view(el('div', { class: 'boot' }, [loader6('نجهّز العرض…')]));
  if (data.program && V6.prog && data.program !== V6.prog.id && V6.bundle.programs.some(function (p) { return p.id === data.program; })) await useProgram(data.program, true);
  const T = trackOf(data.track) || tracksOf()[0]; if (!T) return;
  S.track = T; ED.doc = data.doc; ED.cur = data.i; S.tpl = TEMPLATES.find(function (t) { return t.id === data.doc.pages[0].tpl; });
  try { await ensureFonts(data.doc.pages.reduce(function (a, p) { return a.concat(fontsOfState(p)); }, [])); } catch (e) {}
  document.title = 'عرض: ' + (data.doc.name || 'عرض');
  view(el('div', { class: 'stage-bg' }));
  present6(true, data.i, { follower: k });
}
