/* ================= تشغيل تطبيق الجوال: المسارات، شريط التبويب، والتوافق مع محرك المنصة ================= */
var pv = null;
function changed() { changed6(); }
function buildEditor() { buildPanel(); buildToolbar(); }
function schedule() { redraw(); }
function saveState() { markDirty(); }
function buildSelBar() { buildToolbar(); }
function drawOverlay() {}
function addLayer(L) { addLayer6(L); }
function delLayer(id) { delLayer6(id); }
function confirmInline() { return true; }
SIZES.yt.name = 'غلاف يوتيوب'; SIZES.banner.name = 'غلاف استمارة';
const EXTRA_SIZES = { yt: ['ann_photo', 'ann_title', 'comp_icons', 'comp_photo', 'thanks_cert', 'quote_rays', 'quote_photo', 'ann_cards', 'ann_night', 'ann_program', 'cover_schedule', 'thanks_podium', 'cover_banner', 'ann_door', 'story_cover', 'story_quote'], banner: ['story_quote'] };
Object.keys(EXTRA_SIZES).forEach(function (sz) { EXTRA_SIZES[sz].forEach(function (id) { const t = TEMPLATES.find(function (x) { return x.id === id; }); if (t && t.sizes.indexOf(sz) < 0) t.sizes.push(sz); }); });

// الرأس العلوي لسطح المكتب يحل محله شريط التبويب
buildTop = function () { const t = $('#top'); if (t) t.hidden = true; buildTab(); };
markNav = markTab;
// الشاشات المعاد استعمالها من المنصة (التقويم، المصمّم الذكي، تصاميمي…) تُلفّ برأس الجوال كلما رُسمت
const viewDesk = view;
view = function () {
  const v = viewDesk.apply(null, arguments);
  if (!M.wrap || !v || v.querySelector('.mscreen,.ed6,.login,.boot')) return v;
  const inner = Array.from(v.children);
  const sc = mscreen(M.wrap, inner);
  v.appendChild(sc.node); window.scrollTo(0, 0);
  return v;
};
function mwrap(title, fn, opt) { return function () { M.wrap = Object.assign({ title: title, back: '#/' }, opt || {}); return fn.apply(null, arguments); }; }
function plain(fn) { return function () { M.wrap = null; return fn.apply(null, arguments); }; }
maybeTour = function () {};
ROUTES.length = 0;
route6(/^\/login$/, plain(function () { if (V6.token && V6.me && !V6.me.mustChange) return go('#/'); showLogin(); }), { public: true, page: 'login', noVT: true });
route6(/^\/password$/, mwrap('كلمة المرور', function () { showChangePw(false); }, { back: '#/more' }), { page: 'more', noVT: true });
route6(/^\/$/, plain(mHome), { page: 'home', noVT: true });
route6(/^\/tpl$/, plain(function () { mTemplates(); }), { page: 'tpl', noVT: true });
route6(/^\/g\/([^/]+)(?:\/([^/]+))?$/, plain(mTemplates), { page: 'tpl', noVT: true });
route6(/^\/e\/([^/]+)\/([^/]+)$/, plain(openNew), { page: 'editor', noVT: true });
route6(/^\/d\/([^/?]+)$/, plain(openItem), { page: 'editor', noVT: true });
route6(/^\/p\/([^/?]+)$/, mwrap('عرض', showPresent, { back: '#/mine', noTitle: true }), { page: 'mine', noVT: true });
route6(/^\/s\/([^/]+)$/, mwrap('الشرائح', showSlides6, { back: '#/tpl', noTitle: true }), { page: 'tpl', noVT: true });
route6(/^\/arc\/(\d{4}-\d{2})\/([a-z0-9]+)$/, plain(openArc), { page: 'editor', noVT: true });
route6(/^\/make(?:\?.*)?$/, mwrap('المصمّم الذكي', showMake6, { back: '#/', noTitle: true }), { page: 'home', noVT: true });
route6(/^\/mine$/, mwrap('تصاميمي', showMine6, { back: '#/', noTitle: true }), { page: 'home', noVT: true });
route6(/^\/cal(?:\?.*)?$/, mwrap('التقويم والمهام', showCal6, { back: '#/', right: [el('button', { type: 'button', class: 'nb', 'aria-label': 'مهمة جديدة', onclick: function () { haptic(); taskDialog(null, CAL.cursor || new Date()); } }, [ico('plus')])] }), { page: 'cal', noVT: true });
route6(/^\/account(?:\?.*)?$/, mwrap('حسابي', showAccount, { back: '#/more', noTitle: true }), { page: 'more', noVT: true });
route6(/^\/tips(?:\/([a-z]+))?$/, mwrap('نصائح التصميم', showTips6, { back: '#/', noTitle: true }), { page: 'home', noVT: true });
route6(/^\/week$/, mwrap('أسبوعي في أثر', showWeek6, { back: '#/more', noTitle: true }), { page: 'more', noVT: true });
route6(/^\/reviews$/, mwrap('مراجعاتي', showReviews6, { back: '#/more', noTitle: true }), { page: 'more', noVT: true });
route6(/^\/more$/, plain(mMore), { page: 'more', noVT: true });
route6(/^\/guide(?:\/([a-z]+))?$/, mwrap('دليل أثر', showGuide6, { back: '#/more', noTitle: true }), { page: 'more', noVT: true });
route6(/^\/(feedback|fb)$/, function () { redirect6('#/account?fb'); }, { page: 'more', noVT: true });
route6(/^\/news$/, function () { redirect6('#/more'); setTimeout(function () { showNews(); }, 500); }, { page: 'more', noVT: true });
route6(/^\/admin(?:\/([a-z]+))?$/, function () { location.href = '../#/admin'; }, { page: 'more', noVT: true });
route6(/.*/, plain(mHome), { page: 'home', noVT: true });
// اتجاه حركة الشاشة: الرجوع بزر المتصفح يُحرّك العكس
window.addEventListener('popstate', function () { M.dir = 'back'; });
window.addEventListener('hashchange', function () { setTimeout(function () { M.dir = 'fwd'; }, 600); });

(async function boot() {
  document.body.classList.add('mapp');
  setMotion('normal');
  const nm = ls('lastName'); splash(nm ? 'أهلاً بك يا ' + nm + '…' : 'نرحّب بك…');
  const fonts = loadUiFonts().catch(function () {});
  await Promise.race([fonts, new Promise(function (ok) { setTimeout(ok, 1500); })]);
  let r = false;
  try { r = await restore(); } catch (e) { console.warn(e); }
  if (r === 'must') { splashHide(); return; }
  render();
  registerSW();
  if (isStandalone()) track('app', { tool: 'standalone' });
})();
