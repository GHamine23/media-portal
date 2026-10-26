/* ================= دليل أثر: المقدمات المتحركة، ومقدمة أول دخول لكل قسم، و«اسأل أثر» =================
   يبني على وحدتين: motion6.js (MOTION_CLIPS, playMotion, motionPoster) وkb6.js (KB_SECTIONS, kbContext, kbPageName, KB_FAQ, KB_CLIPS).
   كل ما يأتي منهما يُقرأ عند الحاجة؛ فإن غابتا عمل الدليل بما عنده: بطاقات بلا تشغيل، وبحث في الأسئلة الشائعة، ولا مقدمات تلقائية.
   التقدّم في التفضيلات prefs.guide = { seen: {id: وقت المشاهدة}, asked: {id: 1}, nag: {id: n}, off: bool, last: id } فيتبع المستخدم على أجهزته. */
IC.guide = '<rect x="3" y="5" width="18" height="14" rx="3.5"/><path d="M10.2 9.4v5.2l4.4-2.6z"/>';
IC.help = '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.4a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.3-2.5 4"/><path d="M12 17.2v.3"/>';
const GUIDE = { visit: 0, shown: false, prompt: null, promptId: '', playing: false, chat: [], panel: null, quietUntil: 0 };
const G_ICON = { launch: 'sparkles', home: 'home', gallery: 'grid', editor: 'pencil', make: 'ai', publish: 'send', cal: 'cal', slides: 'slides', mine: 'heart', app: 'phone', admin: 'gear' };
// ما يُعرض إن لم تصل وحدة الحركة بعد: الأقسام نفسها بالترتيب، بلا تشغيل
const G_FALLBACK = [['launch', 'أثر في دقيقة', 'المنصة'], ['home', 'الرئيسية', 'الرئيسية'], ['gallery', 'القوالب والهويات', 'القوالب'], ['editor', 'المحرر', 'المحرر'], ['make', 'اصنع إعلانك', 'المصمّم الذكي'], ['publish', 'النشر إلى القناة', 'النشر'],
  ['cal', 'التقويم والمهام', 'التقويم'], ['slides', 'الشرائح', 'الشرائح'], ['mine', 'تصاميمي', 'تصاميمي'], ['app', 'تطبيق الجوال', 'التطبيق'], ['admin', 'لوحة الإدارة', 'الإدارة', 1]];
const G_ROUTE = { home: '#/', gallery: '#/tpl', make: '#/make', cal: '#/cal', mine: '#/mine', admin: '#/admin' };
// وجهة «اذهب إلى …» لكل مقدمة: route في بيانات المقاطع نمطٌ لمطابقة الصفحات (مثل ^/(s|p)/) وليس رابطاً، فلا يُستعمل رابطاً أبداً
function gDest(c) {
  const lt = (TRACKS[ls('lastTrack')] ? ls('lastTrack') : ((tracksOf()[0] || {}).id)) || '';
  const m = { home: '#/', gallery: '#/sections', editor: lt ? '#/g/' + lt : '#/tpl', make: '#/make', publish: '#/mine', cal: '#/cal', slides: lt ? '#/s/' + lt : '#/sections', mine: '#/mine', admin: isAdmin() ? '#/admin' : '', app: '#/account' };
  if (m[c.id] !== undefined) return m[c.id];
  const r = String(c.route || G_ROUTE[c.id] || '');
  return /^#\/[\w\/?=&-]*$/.test(r) ? r : '';
}
const G_PAGES = [[/^#\/?$/, 'الرئيسية'], [/^#\/(g\/|tpl)/, 'القوالب'], [/^#\/(e|d|arc)\//, 'المحرر'], [/^#\/make/, 'اصنع إعلانك'], [/^#\/cal/, 'التقويم والمهام'], [/^#\/s\//, 'الشرائح'], [/^#\/mine/, 'تصاميمي'], [/^#\/p\//, 'العرض'],
  [/^#\/account/, 'حسابي'], [/^#\/week/, 'أسبوعي في أثر'], [/^#\/reviews/, 'مراجعاتي'], [/^#\/tips/, 'نصائح التصميم'], [/^#\/admin/, 'لوحة الإدارة'], [/^#\/guide/, 'دليل أثر'], [/^#\/more/, 'المزيد']];
const G_TABS = { content: 'المحتوى', tpls: 'القوالب', text: 'النصوص', els: 'العناصر', imgs: 'الصور', colors: 'الألوان', fonts: 'الخطوط', layers: 'الطبقات', assist: 'المساعد', el: 'العنصر', anim: 'الحركة', bg: 'الخلفية', pub: 'النشر' };

/* ---------- الوصول إلى وحدتي الحركة والمعرفة (قد لا تكونان موجودتين) ---------- */
function gInApp() { return document.body.classList.contains('mapp'); }
function gCanPlay() { return typeof playMotion === 'function'; }
function gRawClips() { try { return typeof MOTION_CLIPS !== 'undefined' && Array.isArray(MOTION_CLIPS) && MOTION_CLIPS.length ? MOTION_CLIPS : null; } catch (e) { return null; } }
function gClips() {
  const raw = gRawClips() || G_FALLBACK.map(function (f) { return { id: f[0], title: f[1], section: f[2], admin: !!f[3], dur: 0, desc: gKbClip(f[0]) }; });
  return raw.filter(function (c) { return c && c.id && (!c.admin || isAdmin()); });
}
function gClip(id) { return gClips().find(function (c) { return c.id === id; }) || null; }
function gKbClip(id) { try { return typeof KB_CLIPS !== 'undefined' && KB_CLIPS ? KB_CLIPS[id] || '' : ''; } catch (e) { return ''; } }
function gFaq() { try { return typeof KB_FAQ !== 'undefined' && Array.isArray(KB_FAQ) ? KB_FAQ.filter(function (f) { return f && f.q; }) : []; } catch (e) { return []; } }
function gSections() {
  try {
    if (typeof KB_SECTIONS === 'undefined' || !KB_SECTIONS) return [];
    return Array.isArray(KB_SECTIONS) ? KB_SECTIONS : Object.keys(KB_SECTIONS).map(function (k) { return Object.assign({ id: k }, KB_SECTIONS[k]); });
  } catch (e) { return []; }
}
function gPageName(hash) {
  hash = hash || location.hash || '#/';
  if (typeof kbPageName === 'function') { try { const n = kbPageName(hash); if (n) return n; } catch (e) {} }
  const m = G_PAGES.find(function (p) { return p[0].test(hash); }); return m ? m[1] : 'المنصة';
}
function gWhere() {
  const n = gPageName(location.hash), t = typeof ED !== 'undefined' && ED.open && document.body.dataset.page === 'editor' ? G_TABS[ED.tab] : '';
  return n + (t ? ' · تبويب ' + t : '');
}
function gDur(d) {
  d = +d || 0; if (d > 600) d = d / 1000;   // بالمللي ثانية إن كان كبيراً
  if (!d) return '';
  const n = function (x) { try { return x.toLocaleString('ar-EG'); } catch (e) { return String(x); } };
  d = Math.round(d); return d < 60 ? n(d) + 'ث' : n(Math.floor(d / 60)) + ':' + n(100 + d % 60).slice(-2) + ' د';
}
function gNum(x) { try { return (+x).toLocaleString('ar-EG'); } catch (e) { return String(x); } }

/* ---------- التقدّم (في تفضيلات المستخدم) ---------- */
function gPrefs() { const g = (V6.me && V6.me.prefs && V6.me.prefs.guide) || {}; return { seen: Object.assign({}, g.seen), asked: Object.assign({}, g.asked), nag: Object.assign({}, g.nag), off: !!g.off, last: g.last || '' }; }
function gSave(patch) { if (!V6.me) return Promise.resolve(); return savePrefs6({ guide: Object.assign(gPrefs(), patch) }); }
function gProgress() { const p = gPrefs(), cs = gClips(); const seen = cs.filter(function (c) { return p.seen[c.id]; }).length; return { seen: seen, total: cs.length, next: cs.find(function (c) { return !p.seen[c.id]; }) || null }; }
function gIntrosActive() { return !!(V6.me && gCanPlay() && gRawClips() && !gPrefs().off); }

/* ---------- التشغيل ---------- */
async function gPlay(id, opt) {
  const c = gClip(id); if (!c) return null;
  if (!gCanPlay() || !gRawClips()) { toast('هذه المقدمة تصل قريباً'); return null; }
  GUIDE.playing = true; gHidePrompt();
  let r = null;
  try { r = await playMotion(id, opt || {}); } catch (e) { r = null; }
  GUIDE.playing = false;
  const p = gPrefs(); p.asked[id] = 1;
  if (r && r.watched) { p.seen[id] = r.at || Date.now(); p.last = id; }
  await gSave({ seen: p.seen, asked: p.asked, last: p.last });
  if (document.body.dataset.page === 'guide' || /^#\/guide/.test(location.hash)) gRefreshGuide();
  return r;
}
function gPoster(c, w) {
  const box = el('div', { class: 'gposter' });
  let p = null;
  if (typeof motionPoster === 'function') { try { p = motionPoster(c.id, w); } catch (e) { p = null; } }
  if (p) box.appendChild(p);
  else { box.classList.add('fb'); box.append(el('span', { class: 'gpi' }, [ico(G_ICON[c.id] || 'play')]), el('b', { text: c.section || c.title })); }
  return box;
}

/* ================= صفحة «دليل أثر» ================= */
function showGuide6(clipId) {
  document.title = 'دليل أثر';
  clipId = String(clipId || '').split('?')[0];
  view(el('div', { class: 'wrap page gpage', id: 'gpage' }, gGuideKids()));
  if (clipId && gClip(clipId)) setTimeout(function () { gPlay(clipId, {}); }, 450);
}
function gRefreshGuide() { const g = $('#gpage'); if (!g) return; const y = scrollY; g.replaceChildren.apply(g, gGuideKids()); $$('.rv,.bwrap', g).forEach(function (x) { x.classList.add('in-view'); }); window.scrollTo(0, y); }
function gGuideKids() {
  const cs = gClips(), p = gPrefs(), pr = gProgress(), can = gCanPlay() && !!gRawClips();
  const launch = cs.find(function (c) { return c.id === 'launch'; }) || cs[0];
  const path = cs.filter(function (c) { return c !== launch; });
  const ring = function (n, t) {
    const r = 26, L = 2 * Math.PI * r, f = t ? n / t : 0;
    return el('div', { class: 'gring', 'aria-hidden': 'true' }, [svgRing(r, L, f), el('b', { text: gNum(n) + '/' + gNum(t) })]);
  };
  function svgRing(r, L, f) { const s = document.createElementNS('http:\/\/www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 64 64'); s.innerHTML = '<circle cx="32" cy="32" r="' + r + '" class="tr"/><circle cx="32" cy="32" r="' + r + '" class="fg" stroke-dasharray="' + L + '" stroke-dashoffset="' + (L * (1 - f)) + '"/>'; return s; }
  const nextBtn = pr.seen && pr.next ? el('button', { type: 'button', class: 'btn line gcont', onclick: function () { return gPlay(pr.next.id, {}); } }, [ico('play'), el('span', { text: 'تابع من حيث توقفت: ' + pr.next.title })]) : null;
  const hero = launch ? el('section', { class: 'ghero rv' }, [
    el('button', { type: 'button', class: 'gfilm', 'aria-label': 'شاهد ' + launch.title, onclick: function () { return gPlay(launch.id, {}); } }, [
      gPoster(launch, 960), el('span', { class: 'gplay' }, [ico('play')]), launch.dur ? el('span', { class: 'gdur', text: gDur(launch.dur) }) : null, p.seen[launch.id] ? el('span', { class: 'gseen', text: 'شوهد ✓' }) : null]),
    el('div', { class: 'gside' }, [
      el('span', { class: 'eyebrow', text: 'ابدأ من هنا' }),
      el('h2', { text: launch.title }),
      el('p', { class: 'muted', text: launch.desc || gKbClip(launch.id) || 'جولة سريعة على المنصة كلها قبل أن تبدأ.' }),
      el('div', { class: 'row wrapr' }, [can ? el('button', { type: 'button', class: 'btn dark', onclick: function () { return gPlay(launch.id, {}); } }, [ico('play'), p.seen[launch.id] ? 'شاهده مرة أخرى' : 'شاهد الفيلم']) : el('span', { class: 'pill', text: 'تصل المقدمات قريباً' })]),
      el('div', { class: 'gprog' }, [ring(pr.seen, pr.total), el('div', {}, [el('b', { text: pr.seen === pr.total && pr.total ? 'شاهدت الدليل كله ✓' : 'شاهدت ' + gNum(pr.seen) + ' من ' + gNum(pr.total) }), el('small', { class: 'muted', text: pr.seen === pr.total ? 'ارجع إلى أي مقدمة متى شئت.' : 'كل مقدمة نحو عشرين ثانية.' })])]),
      nextBtn
    ])
  ]) : null;
  const grid = el('ol', { class: 'gpath' }, path.map(function (c, i) {
    const seen = !!p.seen[c.id], isNext = pr.next && pr.next.id === c.id && pr.seen > 0, route = gDest(c);
    return el('li', { class: 'gstep rv' + (seen ? ' seen' : '') + (isNext ? ' next' : ''), style: '--d:' + Math.min(i, 8), 'data-clip': c.id }, [
      el('button', { type: 'button', class: 'gthumb', 'aria-label': 'شاهد ' + c.title, onclick: function () { return gPlay(c.id, {}); } }, [gPoster(c, 420), el('span', { class: 'gplay sm' }, [ico('play')]), c.dur ? el('span', { class: 'gdur', text: gDur(c.dur) }) : null]),
      el('div', { class: 'gmeta' }, [
        el('div', { class: 'row sb' }, [el('span', { class: 'gnum', text: ('0' + (i + 1)).slice(-2).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }) }),
          seen ? el('span', { class: 'pill gr', text: 'شوهد ✓' }) : isNext ? el('span', { class: 'pill pu', text: 'التالي' }) : el('span', { class: 'pill', text: c.section || '' })]),
        el('h3', { text: c.title }),
        el('p', { class: 'muted small', text: c.desc || gKbClip(c.id) || '' }),
        route && !/^#\/guide/.test(route) ? el('a', { class: 'glink', href: route, onclick: function () { if (gInApp()) M.dir = 'fwd'; } }, ['اذهب إلى ' + (c.section || 'القسم'), ico('chev')]) : null
      ])
    ]);
  }));
  const pathSec = el('section', { class: 'hsec gsec' }, [el('div', { class: 'shead' }, [el('div', {}, [H('h2', 'المسار خطوة خطوة'), el('p', { class: 'muted small rv', text: 'قسم بعد قسم، بترتيب استعمالك له. اضغط أي بطاقة لتشاهدها.' })])]), grid]);
  // الجولات التفاعلية على الصفحة نفسها (في الموقع؛ التطبيق بلا جولات)
  const tours = gInApp() ? null : el('section', { class: 'hsec gsec' }, [el('div', { class: 'shead' }, [el('div', {}, [H('h2', 'جولات على الصفحة'), el('p', { class: 'muted small rv', text: 'تضيء الأدوات في مكانها، وتشرح كل أداة بسطر.' })])]),
    el('div', { class: 'gtours' }, [
      el('button', { type: 'button', class: 'card gtour rv hover-lift', onclick: function () { gTour('home'); } }, [el('span', { class: 'icon-tile t-pu' }, [ico('home')]), el('b', { text: 'جولة في الرئيسية' }), el('small', { class: 'muted', text: 'المصمّم الذكي، والهويات، والإشعارات' })]),
      el('button', { type: 'button', class: 'card gtour rv hover-lift', style: '--d:1', onclick: function () { gTour('editor'); } }, [el('span', { class: 'icon-tile t-or' }, [ico('pencil')]), el('b', { text: 'جولة في المحرر' }), el('small', { class: 'muted', text: 'الأدوات، والتحديد، والتنزيل' })])
    ])]);
  // الأسئلة الشائعة و«اسأل أثر»
  const faq = gFaq();
  const faqList = el('div', { class: 'gfaq' }, faq.slice(0, 6).map(gFaqItem));
  const more = faq.length > 6 ? el('button', { type: 'button', class: 'btn sm ghost', text: 'اعرض كل الأسئلة (' + gNum(faq.length) + ')', onclick: function (e) { faq.slice(6).forEach(function (f) { faqList.appendChild(gFaqItem(f)); }); e.currentTarget.remove(); } }) : null;
  const askI = el('textarea', { rows: '3', id: 'g_ask', placeholder: 'مثال: كيف أنشر التصميم في قناة البرنامج؟', 'aria-label': 'سؤالك' });
  const askBox = el('div', { class: 'card gask rv' }, [
    el('div', { class: 'row' }, [el('span', { class: 'gx-av' }, [ico('help')]), el('div', {}, [el('h3', { text: 'اسأل أثر' }), el('p', { class: 'muted small', text: 'اسأل عن أي شيء في المنصة، ويجيبك بخطوات.' })])]),
    askI,
    el('div', { class: 'row sb' }, [el('span', { class: 'tiny', text: 'لا يُرسل إلا سؤالك والصفحة التي أنت فيها.' }), el('button', { type: 'button', class: 'btn dark', onclick: function () { const q = askI.value.trim(); if (!q) { askI.focus(); return; } askI.value = ''; askAthar(q); } }, [ico('send'), 'اسأل'])])
  ]);
  askI.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askBox.querySelector('.btn.dark').click(); } });
  const faqSec = el('section', { class: 'hsec gsec' }, [el('div', { class: 'shead' }, [el('div', {}, [H('h2', 'أسئلة شائعة'), el('p', { class: 'muted small rv', text: 'أكثر ما يُسأل عنه، وجوابه في سطور.' })])]),
    el('div', { class: 'gqa' }, [el('div', { class: 'gfaqcol' }, [faq.length ? faqList : el('p', { class: 'empty', text: 'تصل الأسئلة الشائعة قريباً. اسأل أثر مباشرة.' }), more]), askBox])]);
  // الإعداد: المقدمات التلقائية
  const tog = el('input', { type: 'checkbox', checked: !p.off, onchange: function (e) { gSave({ off: !e.target.checked }); toast(e.target.checked ? 'ستظهر المقدمة عند دخولك قسماً لأول مرة' : 'لن تظهر المقدمات تلقائياً'); } });
  const setSec = el('section', { class: 'card flat gset rv' }, [
    el('label', { class: 'tog' }, [tog, el('span', {}, [el('b', { text: 'اعرض مقدمة قصيرة عند دخولي قسماً لأول مرة' }), el('br'), el('small', { class: 'muted', text: 'تختار حينها أن تشاهد أو تتخطى.' })])]),
    el('button', { type: 'button', class: 'btn sm line', onclick: async function (e) { const b = e.currentTarget; btnBusy(b); await gSave({ seen: {}, asked: {}, nag: {}, last: '' }); btnDone(b, 'بدأ من جديد'); setTimeout(gRefreshGuide, 900); } }, [ico('reset'), 'ابدأ المسار من جديد'])
  ]);
  return [
    el('div', { class: 'phead' }, [H('h1', 'دليل أثر'), el('p', { class: 'muted rv', text: 'مقدمات قصيرة لكل قسم بالترتيب، وأجوبة لما يُشكل عليك.' })]),
    hero, pathSec, faqSec, tours, setSec
  ];
}
function gFaqItem(f) {
  const link = gSafeHash(f.link);
  return el('details', { class: 'gfq' }, [el('summary', {}, [el('span', { text: f.q }), ico('chevd')]), el('div', { class: 'gfa' }, [el('p', { text: f.a || '' }), link ? el('a', { class: 'btn sm line', href: link, onclick: gNavHook }, [gLinkLabel(link), ico('chev')]) : null])]);
}
function gLinkLabel(h) { return 'افتح ' + gPageName(h); }
function gTour(kind) {
  GUIDE.quietUntil = Date.now() + 3500;   // لا مقدمة في زيارة الجولة
  if (kind === 'home') { go('#/'); setTimeout(function () { maybeTour('home', true); }, 1100); return; }
  const tid = ls('lastTrack') && TRACKS[ls('lastTrack')] ? ls('lastTrack') : (tracksOf()[0] || {}).id, tpl = (visibleTpls()[0] || {}).id;
  if (!tid || !tpl) { toast('لا قالب متاح لبرنامجك بعد'); return; }
  go('#/e/' + tid + '/' + tpl); setTimeout(function () { maybeTour('editor', true); }, 2600);
}

/* ================= مقدمة أول دخول: بطاقة صغيرة لا تحجب شيئاً ================= */
const G_INTRO_ROUTES = [[/^#\/?$/, 'home'], [/^#\/(g\/|tpl)/, 'gallery'], [/^#\/(e|d)\//, 'editor'], [/^#\/make/, 'make'], [/^#\/cal/, 'cal'], [/^#\/s\//, 'slides'], [/^#\/mine/, 'mine'], [/^#\/admin/, 'admin']];
function gClipForHash(h) {
  h = h || '#/';
  if (gInApp() && !gPrefs().asked.app && gClip('app') && !/^#\/(e|d|login)\b/.test(h)) return 'app';   // أول تشغيل للتطبيق
  const m = G_INTRO_ROUTES.find(function (r) { return r[0].test(h); }); return m ? m[1] : '';
}
function gIntroOk(id) {
  if (!V6.me || !V6.token || !gIntrosActive() || Date.now() < GUIDE.quietUntil) return false;
  const c = gClip(id); if (!c) return false;
  return !gPrefs().asked[id];
}
function gBlocked() {
  if (GUIDE.playing || GUIDE.prompt) return true;
  if ($('.modal,.msheet-wrap,.mact,.coach,.menu,.present6,.imgview,.ied6,.progld,.mopen,.motion6-open,.mo-pl,.gx-panel.on')) return true;
  const sp = $('#splash'); if (sp && !sp.classList.contains('off')) return true;
  if (document.body.dataset.page === 'login' || document.visibilityState === 'hidden') return true;
  return false;
}
function gOnRoute() {
  // من تجاهل البطاقة وانتقل: تُعدّ، وبعد مرتين لا تعود
  if (GUIDE.prompt && GUIDE.promptId) { const p = gPrefs(), id = GUIDE.promptId; p.nag[id] = (p.nag[id] || 0) + 1; if (p.nag[id] >= 2) p.asked[id] = 1; gSave({ nag: p.nag, asked: p.asked }); }
  gHidePrompt();
  GUIDE.visit++; GUIDE.shown = false;
  if (Date.now() < GUIDE.quietUntil) return;
  const id = gClipForHash(location.hash); if (!id) return;
  gIntroLater(id, /^#\/(e|d)\//.test(location.hash) ? 4500 : 1600, 6);
}
function gIntroLater(id, delay, tries) {
  const v = GUIDE.visit;
  setTimeout(function () {
    if (v !== GUIDE.visit || GUIDE.shown || !gIntroOk(id)) return;
    if (id === 'editor' || id === 'publish') { if (typeof ED === 'undefined' || !ED.open || !$('.e-cv')) return; }
    if (gBlocked()) { if (tries > 0) gIntroLater(id, 1500, tries - 1); return; }
    gShowPrompt(id);
  }, delay);
}
function gShowPrompt(id) {
  const c = gClip(id); if (!c) return;
  GUIDE.shown = true; GUIDE.promptId = id;
  const decide = function (patch) { const p = gPrefs(); p.asked[id] = 1; gHidePrompt(); return gSave(Object.assign({ asked: p.asked }, patch || {})); };
  const card = el('div', { class: 'gx-intro', role: 'dialog', 'aria-label': 'مقدمة قصيرة' }, [
    el('button', { type: 'button', class: 'gxi-th', 'aria-label': 'شاهد', onclick: function () { decide(); gPlay(id, { intro: true }); } }, [gPoster(c, 200), el('span', { class: 'gplay xs' }, [ico('play')])]),
    el('div', { class: 'gxi-tx' }, [
      el('b', { text: 'مقدمة قصيرة عن ' + (c.section || c.title) + (c.dur ? ' (' + gDur(c.dur) + ')' : '') }),
      el('div', { class: 'gxi-acts' }, [
        el('button', { type: 'button', class: 'btn sm dark', onclick: function () { decide(); gPlay(id, { intro: true }); } }, [ico('play'), 'شاهد']),
        el('button', { type: 'button', class: 'btn sm ghost', text: 'تخطَّ', onclick: function () { decide(); if (!ls('gSkipHint')) { ls('gSkipHint', 1); toast('تجدها متى شئت في «دليل أثر»'); } } }),
        el('button', { type: 'button', class: 'linkbtn gxi-off', text: 'لا تعرض المقدمات', onclick: function () { decide({ off: true }); toast('لن تظهر المقدمات تلقائياً. تجدها كلها في «دليل أثر».'); } })
      ])
    ])
  ]);
  GUIDE.prompt = card; document.body.appendChild(card);
  requestAnimationFrame(function () { requestAnimationFrame(function () { card.classList.add('on'); }); });
  track('guide', { tool: 'intro_' + id });
}
function gHidePrompt() { const c = GUIDE.prompt; GUIDE.prompt = null; GUIDE.promptId = ''; if (!c) return; c.classList.remove('on'); setTimeout(function () { c.remove(); }, 400); }

/* ================= «اسأل أثر» ================= */
const G_RULES = 'أنت «أثر»، مساعد منصة الأثر الإعلامي (منصة عربية يصمّم فيها فريق الأكاديمية إعلانات برامجهم بهوياتها وينشرونها). تجيب عن استعمال المنصة فقط.\n' +
  '- اعتمد على «دليل المنصة» أدناه وحده، ولا تخترع زراً أو ميزة أو صفحة غير مذكورة فيه.\n' +
  '- راعِ الصفحة التي يسأل منها المستخدم ودوره: ابدأ مما يراه أمامه الآن.\n' +
  '- answer: جملة أو جملتان واضحتان. steps: خطوات عملية قصيرة مرتبة تبدأ كل منها بفعل أمر، بلا أرقام في النص، حتى ست خطوات (أو فارغة إن لم تلزم).\n' +
  '- links: حتى ثلاثة روابط لصفحات المنصة تحل المشكلة؛ hash يبدأ بـ #/ كما في الدليل، وlabel قصير (اسم الصفحة أو الفعل).\n' +
  '- clip: معرّف مقدمة متحركة من قائمة المقدمات إن كانت تفيده، وإلا فارغ.\n' +
  '- escalate: true إن لم يكن الجواب في الدليل، أو احتاج صلاحية أو قراراً من الإشراف (برنامج، هوية، حساب، صلاحية، حد المساعد)، أو كان عطلاً تقنياً؛ وقل في answer إن الإشراف سيساعده.\n' +
  '- لا تطلب بيانات شخصية ولا تذكرها. إن كان السؤال خارج المنصة فاعتذر بلطف، وescalate: false.';
const G_SCHEMA = { type: 'OBJECT', properties: {
  answer: { type: 'STRING' }, steps: { type: 'ARRAY', items: { type: 'STRING' } },
  links: { type: 'ARRAY', items: { type: 'OBJECT', properties: { label: { type: 'STRING' }, hash: { type: 'STRING' } }, required: ['label', 'hash'] } },
  clip: { type: 'STRING' }, escalate: { type: 'BOOLEAN' } }, required: ['answer', 'steps', 'links', 'escalate'] };
// روابط الجواب: صفحات المنصة المعروفة فقط
function gSafeHash(h) {
  h = String(h || '').trim(); if (!h) return '';
  if (h[0] === '/') h = '#' + h;
  if (!/^#\/[\w\-\/?=&.%]*$/.test(h)) return '';
  const p = h.slice(1); return ROUTES.some(function (r) { return r.re.source !== '.*' && r.re.test(p); }) ? h : '';
}
function gLocalContext(route, role, extra) {
  const secs = gSections(), faq = gFaq();
  const lines = ['دليل المنصة (مختصر):'];
  if (secs.length) secs.forEach(function (s) { lines.push('- ' + (s.title || s.name || s.id) + (s.route || s.hash ? ' (' + (s.route || s.hash) + ')' : '') + ': ' + clip6(gText(s), 500)); });
  else G_PAGES.forEach(function (p) { lines.push('- ' + p[1] + ' (' + p[0].source.replace(/^\^#\\\//, '#/').replace(/[\\()?|^$]/g, '').replace(/\/\/$/, '/') + ')'); });
  if (faq.length) { lines.push('أسئلة شائعة:'); faq.slice(0, 30).forEach(function (f) { lines.push('س: ' + f.q + ' ج: ' + clip6(f.a, 300)); }); }
  lines.push('الصفحة الحالية: ' + gPageName(route) + ' (' + route + ')' + (extra.tab ? '، تبويب ' + (G_TABS[extra.tab] || extra.tab) : '') + (extra.app ? '، في تطبيق الجوال' : '، في الموقع'));
  lines.push('دور المستخدم: ' + ({ super: 'المدير العام', sup: 'مشرف برنامج', user: 'مستخدم' }[role] || role));
  return lines.join('\n');
}
function clip6(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function gText(o, depth) {
  depth = depth || 0; if (depth > 3 || o == null) return '';
  if (typeof o === 'string') return o;
  if (Array.isArray(o)) return o.map(function (x) { return gText(x, depth + 1); }).join(' ');
  if (typeof o === 'object') return Object.keys(o).filter(function (k) { return !/^(id|route|hash|icon|ic|link)$/.test(k); }).map(function (k) { return gText(o[k], depth + 1); }).join(' ');
  return '';
}
function gClipList() {
  const cs = gRawClips() ? gClips() : []; if (!cs.length) return '';
  return '\n\nالمقدمات المتحركة (clip):\n' + cs.map(function (c) { return '- ' + c.id + ': ' + c.title + (c.desc || gKbClip(c.id) ? ' — ' + clip6(c.desc || gKbClip(c.id), 90) : ''); }).join('\n');
}
// الأسئلة المقترحة: ما يخص الصفحة الحالية أولاً
function gSuggest() {
  const h = location.hash || '#/', name = gPageName(h), sec = gClipForHash(h);
  const faq = gFaq().map(function (f, i) {
    const tag = [f.page, f.pages, f.sec, f.section, f.route].filter(Boolean).map(String).join(' '), link = String(f.link || '');
    let s = 0;
    if (tag && (tag.indexOf(sec) >= 0 || tag.indexOf(name) >= 0)) s += 3;
    if (link && link.length > 2 && h.indexOf(link.split('?')[0]) === 0) s += 2;
    if (name && (f.q.indexOf(name) >= 0)) s += 1;
    return { f: f, s: s, i: i };
  }).sort(function (a, b) { return b.s - a.s || a.i - b.i; });
  return faq.slice(0, 4).map(function (x) { return x.f.q; });
}
function gFabEnsure() {
  if (gInApp()) return;
  if (!$('#gxfab')) document.body.appendChild(el('button', { type: 'button', id: 'gxfab', class: 'gxfab', 'aria-label': 'اسأل أثر', title: 'اسأل أثر عن أي شيء في المنصة', onclick: function () { askAthar(); } }, [ico('help'), el('span', { text: 'اسأل أثر' })]));
}
function askAthar(q) {
  let P = GUIDE.panel;
  if (!P) P = GUIDE.panel = gBuildPanel();
  gHidePrompt();
  if (!P.node.isConnected) document.body.appendChild(P.wrap || P.node);
  P.where.textContent = 'أنت في: ' + gWhere();
  if (!P.body.children.length) gWelcome(P);
  requestAnimationFrame(function () { requestAnimationFrame(function () { (P.wrap || P.node).classList.add('on'); P.node.classList.add('on'); document.body.classList.add('gx-open'); }); });
  if (q) gSend(q); else setTimeout(function () { try { P.input.focus({ preventScroll: true }); } catch (e) {} }, 350);
  track('guide', { tool: 'ask_open' });
  return P;
}
function gClosePanel() {
  const P = GUIDE.panel; if (!P) return;
  P.node.classList.remove('on'); if (P.wrap) P.wrap.classList.remove('on'); document.body.classList.remove('gx-open');
  setTimeout(function () { if (!P.node.classList.contains('on')) (P.wrap || P.node).remove(); }, 380);
}
function gBuildPanel() {
  const where = el('small', { class: 'gx-where' });
  const body = el('div', { class: 'gx-body', 'aria-live': 'polite' });
  const input = el('textarea', { rows: '1', class: 'gx-in', placeholder: 'اكتب سؤالك…', 'aria-label': 'سؤالك', maxlength: '600' });
  const send = el('button', { type: 'submit', class: 'ib gx-send', 'aria-label': 'أرسل' }, [ico('send')]);
  const grow = function () { input.style.height = 'auto'; input.style.height = Math.min(120, input.scrollHeight) + 'px'; };
  input.addEventListener('input', grow);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit')); } if (e.key === 'Escape') gClosePanel(); });
  const form = el('form', { class: 'gx-foot', onsubmit: function (e) { e.preventDefault(); const q = input.value.trim(); if (!q) { input.focus(); return; } input.value = ''; grow(); gSend(q); } }, [input, send]);
  const node = el('div', { class: 'gx-panel', role: 'dialog', 'aria-label': 'اسأل أثر' }, [
    el('header', { class: 'gx-hd' }, [el('span', { class: 'gx-av' }, [ico('help')]), el('div', { class: 'gx-ttl' }, [el('b', { text: 'اسأل أثر' }), where]),
      el('a', { class: 'btn sm ghost gx-guide', href: '#/guide', onclick: gNavHook }, [ico('guide'), el('span', { text: 'الدليل' })]),
      el('button', { type: 'button', class: 'ib gx-x', 'aria-label': 'إغلاق', onclick: gClosePanel }, [ico('close')])]),
    body, form
  ]);
  node.addEventListener('keydown', function (e) { if (e.key === 'Escape') gClosePanel(); });
  // في التطبيق: ورقة سفلية فوق خلفية معتمة
  const wrap = gInApp() ? el('div', { class: 'gx-scrim' }, [node]) : null;
  if (wrap) wrap.addEventListener('click', function (e) { if (e.target === wrap) gClosePanel(); });
  return { node: node, wrap: wrap, body: body, input: input, where: where };
}
function gNavHook() { if (gInApp()) { gClosePanel(); if (typeof M !== 'undefined') M.dir = 'fwd'; } else if ($('.modal')) closeModals(); }
function gWelcome(P) {
  const sug = gSuggest();
  P.body.appendChild(el('div', { class: 'gx-welcome' }, [
    el('p', { text: 'اسألني عن أي شيء في المنصة؛ أعرف الصفحة التي أنت فيها.' }),
    sug.length ? el('div', { class: 'gx-sugg' }, sug.map(function (q) { return el('button', { type: 'button', class: 'chip', text: q, onclick: function () { gSend(q); } }); })) : null
  ]));
}
function gScroll(P) { requestAnimationFrame(function () { P.body.scrollTop = P.body.scrollHeight; }); }
async function gSend(q) {
  const P = GUIDE.panel || askAthar(); q = String(q || '').trim().slice(0, 600); if (!q) return;
  const w = $('.gx-welcome', P.body); if (w) w.remove();
  P.body.appendChild(el('div', { class: 'gx-msg me', dir: 'auto', text: q }));
  const typing = el('div', { class: 'gx-msg bot typing', 'aria-label': 'يكتب' }, [el('i'), el('i'), el('i')]);
  P.body.appendChild(typing); gScroll(P);
  const route = location.hash || '#/', role = (V6.me && V6.me.role) || 'user';
  const extra = { question: q, tab: typeof ED !== 'undefined' && ED.open && document.body.dataset.page === 'editor' ? ED.tab : '', app: gInApp(), page: gPageName(route) };
  let ctx = '';
  if (typeof kbContext === 'function') { try { ctx = kbContext(route, role, extra) || ''; } catch (e) { ctx = ''; } }
  if (!ctx) ctx = gLocalContext(route, role, extra);
  const hist = GUIDE.chat.slice(-3).map(function (t) { return 'س: ' + clip6(t.q, 200) + '\nج: ' + clip6(t.a, 300); }).join('\n\n');
  const prompt = 'السؤال الآن: ' + q + '\nالصفحة: ' + gWhere() + (hist ? '\n\nالمحادثة السابقة:\n' + hist : '');   // السؤال أولاً (يظهر في سجل الطلبات)
  let r = null, err = null;
  try {
    r = await API6.me('ai_make', JSON.stringify({ kind: 'help', system: G_RULES + '\n\n' + ctx + gClipList(), prompt: prompt, schema: G_SCHEMA, temperature: 0.2 }));
    if (typeof r === 'string') { try { r = JSON.parse(r); } catch (e) { r = { answer: r }; } }
    if (!r || !String(r.answer || '').trim()) throw new Error('جواب فارغ');
  } catch (e) { err = e; r = null; }
  typing.remove();
  if (r) { GUIDE.chat.push({ q: q, a: String(r.answer) + ' ' + (r.steps || []).join('، ') }); if (GUIDE.chat.length > 8) GUIDE.chat.shift(); P.body.appendChild(gAnswer(q, r)); track('guide', { tool: 'ask' }); }
  else P.body.appendChild(gFallback(q, err));
  gScroll(P);
}
function gAnswer(q, r) {
  const links = (r.links || []).map(function (l) { return { label: String(l && l.label || '').slice(0, 40), hash: gSafeHash(l && l.hash) }; }).filter(function (l) { return l.hash; }).slice(0, 3);
  const c = r.clip && gRawClips() ? gClip(String(r.clip)) : null;
  const steps = (r.steps || []).map(function (s) { return String(s || '').replace(/^\s*[\d٠-٩]+[.)\-–]\s*/, '').trim(); }).filter(Boolean).slice(0, 8);
  const box = el('div', { class: 'gx-msg bot' }, [
    el('p', { class: 'gx-a', dir: 'auto', text: String(r.answer) }),
    steps.length ? el('ol', { class: 'gx-steps' }, steps.map(function (s) { return el('li', { text: s }); })) : null,
    links.length || c ? el('div', { class: 'gx-links' }, links.map(function (l) { return el('a', { class: 'btn sm line', href: l.hash, onclick: gNavHook }, [el('span', { text: l.label || gLinkLabel(l.hash) }), ico('chev')]); })
      .concat(c ? [el('button', { type: 'button', class: 'btn sm gx-clip', onclick: function () { return gPlay(c.id, {}); } }, [ico('play'), 'شاهد مقدمة ' + (c.section || c.title)])] : [])) : null
  ]);
  box.appendChild(r.escalate ? gEscalate(q, String(r.answer), true) : gSolved(q, String(r.answer)));
  return box;
}
function gSolved(q, ans) {
  const row = el('div', { class: 'gx-solved' }, [el('span', { class: 'tiny', text: 'هل حُلّت مشكلتك؟' }),
    el('button', { type: 'button', class: 'btn sm ghost', onclick: function () { row.replaceChildren(el('span', { class: 'tiny ok', text: 'سرّنا ذلك ✓' })); track('guide', { tool: 'solved' }); } }, ['نعم']),
    el('button', { type: 'button', class: 'btn sm ghost', onclick: function () { row.replaceWith(gEscalate(q, ans, false)); gScroll(GUIDE.panel); } }, ['لم تُحلّ'])]);
  return row;
}
// «اسأل الإشراف»: يرسل السؤال سؤالاً للفريق، فيصل المدير إشعار به تلقائياً
function gEscalate(q, ans, fromAi) {
  const box = el('div', { class: 'gx-esc' }, [
    el('p', { class: 'small', text: fromAi ? 'هذا يحتاج فريق الإشراف. أرسل سؤالك إليهم، أو شاهد المقدمات.' : 'أرسل سؤالك إلى الإشراف، ويصلك الرد في «حسابي».' }),
    el('div', { class: 'row wrapr' }, [
      el('button', { type: 'button', class: 'btn sm dark gx-ask-sup', onclick: function (e) { return gSendSup(e.currentTarget, q, ans, box); } }, [ico('send'), 'اسأل الإشراف']),
      el('a', { class: 'btn sm line', href: '#/guide', onclick: gNavHook }, [ico('play'), 'المقدمات'])
    ])
  ]);
  return box;
}
async function gSendSup(b, q, ans, box) {
  btnBusy(b, 'نرسل…');
  const it = { kind: 'q', text: 'سؤال من «اسأل أثر»: ' + q + '\n\nالصفحة: ' + gWhere() + (ans ? '\nجواب المساعد: ' + clip6(ans, 1200) : ''), page: location.hash || '#/',
    track: typeof S !== 'undefined' && S.track ? S.track.id : '', program: V6.prog ? V6.prog.id : '', v: 6, ua: navigator.userAgent, vw: innerWidth + '×' + innerHeight };
  try {
    await API6.call('fb_send', V6.token, JSON.stringify(it));
    btnDone(b, 'وصل سؤالك ✓', 0, true);
    box.appendChild(el('p', { class: 'tiny gx-sent' }, ['وصل سؤالك إلى الإشراف. تجد الرد في ', el('a', { href: '#/account?fb', onclick: gNavHook, text: 'حسابي ← ملاحظاتي' }), '.']));
    track('guide', { tool: 'escalate' });
  } catch (e) { btnReset(b); box.appendChild(el('p', { class: 'err small', text: 'تعذّر الإرسال: ' + e.message })); }
  gScroll(GUIDE.panel);
}
// بلا مساعد: أقرب ما في الدليل بالكلمات
function gTokens(s) { return norm(s).replace(/[^؀-ۿa-z0-9\s]/g, ' ').split(/\s+/).map(function (w) { return w.replace(/^(وال|بال|فال|كال|لل|ال|و)(?=..)/, ''); }).filter(function (w) { return w.length > 1 && G_STOP.indexOf(w) < 0; }); }
const G_STOP = ['كم', 'يوم', 'اليوم', 'الان', 'الآن', 'سعر', 'كيف', 'ماذا', 'لماذا', 'متي', 'هل', 'من', 'في', 'علي', 'الي', 'عن', 'ما', 'ان', 'او', 'هذا', 'هذه', 'ذلك', 'التي', 'الذي', 'اريد', 'اي', 'لا', 'مع', 'كل', 'شيء', 'ممكن', 'عند', 'اين', 'لي', 'به', 'بها', 'يمكن', 'يمكنني'];
function gSearch(q) {
  const qt = gTokens(q); if (!qt.length) return [];
  const score = function (title, text) {
    const tt = gTokens(title), xt = gTokens(text); let s = 0;
    qt.forEach(function (w) { if (tt.some(function (t) { return t === w || (w.length > 3 && (t.indexOf(w) === 0 || w.indexOf(t) === 0)); })) s += 2; else if (xt.some(function (t) { return t === w || (w.length > 3 && t.indexOf(w) === 0); })) s += 1; });
    return s;
  };
  const out = gFaq().map(function (f) { return { t: f.q, a: f.a || '', link: gSafeHash(f.link), s: score(f.q, f.a) + 0.5 }; })
    .concat(gSections().map(function (s) { return { t: s.title || s.name || s.id, a: clip6(s.desc || s.summary || gText(s), 260), link: gSafeHash(s.route || s.hash || s.link), s: score(String(s.title || s.name || ''), gText(s)) }; }));
  return out.filter(function (x) { return x.s >= 2; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 3);
}
function gAiErr(e) {
  const m = String(e && e.message || '');
  if (/حد اليوم/.test(m)) return 'بلغت حد المساعد لليوم.';
  if (/صلاحية/.test(m)) return 'المساعد غير مفعّل لحسابك بعد.';
  if (/متوقف|مفتاح|لم يُضبط/.test(m)) return 'المساعد غير متاح الآن.';
  if (/الاتصال|fetch|network|Failed/i.test(m)) return 'تعذّر الاتصال بالمساعد.';
  return 'لم يُجب المساعد هذه المرة.';
}
function gFallback(q, e) {
  const hits = gSearch(q);
  const box = el('div', { class: 'gx-msg bot fb' }, [el('p', { class: 'gx-note' }, [ico('info'), el('span', { text: gAiErr(e) + (hits.length ? ' هذا أقرب ما في دليل المنصة:' : ' ولم أجد في الدليل جواباً قريباً.') })])]);
  hits.forEach(function (h) {
    box.appendChild(el('div', { class: 'gx-hit' }, [el('b', { text: h.t }), h.a ? el('p', { class: 'small muted', text: clip6(h.a, 320) }) : null, h.link ? el('a', { class: 'btn sm line', href: h.link, onclick: gNavHook }, [gLinkLabel(h.link), ico('chev')]) : null]));
  });
  box.appendChild(hits.length ? gSolved(q, '') : gEscalate(q, '', false));
  return box;
}

/* ================= نقاط الدخول: الزر العائم، و«؟» في رؤوس الشاشات والمحرر، والبطاقة في «المزيد» ================= */
function gDecorate() {
  if (!V6.me) return;
  gFabEnsure();
  // محرر الموقع: زر صغير في الشريط العلوي
  const top = $('.e-top');
  if (top && !gInApp() && !$('#e_help', top)) { const sv = $('#e_save', top); const b = el('button', { type: 'button', class: 'ib', id: 'e_help', title: 'اسأل أثر', 'aria-label': 'اسأل أثر', onclick: function () { askAthar(); } }, [ico('help')]); if (sv) top.insertBefore(b, sv); else top.appendChild(b); }
  // التطبيق: «؟» في رأس كل شاشة
  if (gInApp()) $$('.mscreen .mnav .bar').forEach(function (bar) { if (!$('.gx-q', bar)) bar.appendChild(el('button', { type: 'button', class: 'nb gx-q', 'aria-label': 'اسأل أثر', onclick: function () { if (typeof haptic === 'function') haptic(); askAthar(); } }, [ico('help')])); });
  if (GUIDE.panel) GUIDE.panel.where.textContent = 'أنت في: ' + gWhere();
  // الحالة الفارغة في قسم له مقدمة: رابط صغير إليها (مرة في الصفحة)
  const m = G_INTRO_ROUTES.find(function (r) { return r[0].test(location.hash || '#/'); }), c = m && gCanPlay() && gRawClips() ? gClip(m[1]) : null;
  const e = c && !$('#view .gx-elink') ? $('#view .empty, #view .mempty') : null;
  if (e) e.appendChild(el('button', { type: 'button', class: 'linkbtn gx-elink', onclick: function () { gPlay(c.id, {}); } }, [ico('play'), 'شاهد مقدمة ' + (c.section || c.title) + (c.dur ? ' (' + gDur(c.dur) + ')' : '')]));
}
// في «المزيد» بالتطبيق: الدليل والمساعد في بطاقة واحدة
function guideMoreCard() {
  const pr = gProgress();
  return mCard('المساعدة', 'help', [
    mLine('دليل أثر', pr.seen ? 'شاهدت ' + gNum(pr.seen) + ' من ' + gNum(pr.total) + ' مقدمات' : 'مقدمات قصيرة لكل قسم', 'guide', null, { href: '#/guide' }),
    mLine('اسأل أثر', 'سؤال عن أي شيء في التطبيق', 'help', function () { askAthar(); }),
    typeof showAbout6 === 'function' ? mLine('تعرّف على أثر', 'الفيلم ولمحات من كل قسم', 'film', null, { href: '#/about' }) : null
  ]);
}
// في نافذة «ما الجديد»: بطاقة الدليل في أعلاها
function guideNewsCard() {
  const pr = gProgress();
  return el('a', { class: 'gnews', href: '#/guide', onclick: function () { closeModals(); } }, [el('span', { class: 'gx-av' }, [ico('guide')]),
    el('span', { class: 'mt' }, [el('b', { text: 'دليل أثر' }), el('small', { text: pr.seen ? 'شاهدت ' + gNum(pr.seen) + ' من ' + gNum(pr.total) + ' مقدمات. تابع.' : 'مقدمات قصيرة لكل قسم، وأجوبة لما يُشكل عليك.' })]), ico('chev')]);
}

/* ---------- التهيئة: بعد تحميل كل الوحدات (فتُلفّ الدوال النهائية، ومنها بدائل التطبيق) ---------- */
document.addEventListener('DOMContentLoaded', function () {
  // الجولة القديمة: المقدمة تحل محلها تلقائياً، وتبقى الجولة من الدليل (force)
  if (typeof maybeTour === 'function') { const mt0 = maybeTour; maybeTour = function (kind, force) { if (!force && gIntrosActive()) return; return mt0(kind, force); }; }
  // تبويب النشر أو نافذة النص المصاحب ← مقدمة النشر (مرة، وبعد إغلاق النافذة)
  const pubLater = function () { if (gIntroOk('publish')) gIntroLater('publish', 1400, 40); };
  if (typeof buildPanel === 'function') { const bp0 = buildPanel; buildPanel = function () { const r = bp0.apply(this, arguments); try { if (typeof ED !== 'undefined' && ED.open && ED.tab === 'pub' && !GUIDE.shown) pubLater(); } catch (e) {} return r; }; }
  if (typeof captionDialog === 'function') { const cd0 = captionDialog; captionDialog = function () { const r = cd0.apply(this, arguments); if (!GUIDE.shown) pubLater(); return r; }; }
  const v = $('#view');
  if (v) new MutationObserver(function () { clearTimeout(gDecorate._t); gDecorate._t = setTimeout(gDecorate, 60); }).observe(v, { childList: true });
});
window.addEventListener('hashchange', function () { setTimeout(gOnRoute, 0); setTimeout(gDecorate, 120); setTimeout(gDecorate, 1600); });
// أول صفحة بعد الدخول أو الاستعادة لا تمرّ بحدث hashchange أحياناً
(function () { let tries = 0; const t = setInterval(function () { tries++; if (V6.me && V6.bundle && document.body.dataset.page && document.body.dataset.page !== 'login') { clearInterval(t); if (!GUIDE.visit) gOnRoute(); gDecorate(); } if (tries > 120) clearInterval(t); }, 500); })();
