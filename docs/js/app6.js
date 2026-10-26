/* ================= التشغيل: المسارات، وتوافق أدوات الاستوديو القديمة مع المحرر الجديد ================= */
// دوال الاستوديو المشتركة (الاقتراحات والهياكل) تنادي أسماء الإصدار الخامس، فنوجّهها إلى المحرر الجديد
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

// مقاسا غلاف يوتيوب (16:9) وغلاف الاستمارة (1600×400، مقاس رأس نماذج Google): أُضيفا للقوالب التي اختُبرت بهما فلم يتداخل فيها نص ولم يُقصّ
SIZES.yt.name = 'غلاف يوتيوب'; SIZES.banner.name = 'غلاف استمارة';
const EXTRA_SIZES = { yt: ['ann_photo', 'ann_title', 'comp_icons', 'comp_photo', 'thanks_cert', 'quote_rays', 'quote_photo', 'ann_cards', 'ann_night', 'ann_program', 'cover_schedule', 'thanks_podium', 'cover_banner', 'ann_door', 'story_cover', 'story_quote'], banner: ['story_quote'] };
Object.keys(EXTRA_SIZES).forEach(function (sz) { EXTRA_SIZES[sz].forEach(function (id) { const t = TEMPLATES.find(function (x) { return x.id === id; }); if (t && t.sizes.indexOf(sz) < 0) t.sizes.push(sz); }); });
route6(/^\/login$/, function () { if (V6.token && V6.me && !V6.me.mustChange) return go('#/'); showLogin(); }, { public: true, page: 'login', noVT: true });
route6(/^\/stage(?:\?.*)?$/, showStage6, { page: 'stage', noVT: true });
route6(/^\/about$/, function () { showAbout6(); }, { public: true, page: 'about' });
route6(/^\/password$/, function () { showChangePw(false); }, { page: 'account' });
route6(/^\/$/, showHome, { page: 'home' });
route6(/^\/g\/([^/]+)(?:\/([^/]+))?$/, showGallery6, { page: 'sections' });
route6(/^\/sections(?:\?.*)?$/, showSections6, { page: 'sections' });
route6(/^\/e\/([^/]+)\/([^/]+)$/, openNew, { page: 'editor', noVT: true });
route6(/^\/d\/([^/?]+)$/, openItem, { page: 'editor', noVT: true });
route6(/^\/p\/([^/?]+)$/, showPresent, { page: 'mine' });
route6(/^\/s\/([^/]+)$/, showSlides6, { page: 'sections' });
route6(/^\/arc\/(\d{4}-\d{2})\/([a-z0-9]+)$/, openArc, { page: 'editor', noVT: true });
route6(/^\/make(?:\?.*)?$/, showMake6, { page: 'make' });
route6(/^\/mine$/, showMine6, { page: 'mine' });
route6(/^\/cal(?:\?.*)?$/, showCal6, { page: 'cal' });
route6(/^\/account(?:\?.*)?$/, showAccount, { page: 'account' });
// روابط التطبيق تعمل في الموقع أيضاً: القوالب ← معرض آخر هوية، والمزيد ← حسابي، والإشعارات ← نافذة ما الجديد
route6(/^\/tpl$/, function () { const t = TRACKS[ls('lastTrack')] ? ls('lastTrack') : (tracksOf()[0] || {}).id; if (t) return redirect6('#/g/' + t); redirect6('#/'); }, { page: 'home' });
route6(/^\/more$/, function () { redirect6('#/account'); }, { page: 'account' });
route6(/^\/(feedback|fb)$/, function () { redirect6('#/account?fb'); }, { page: 'account' });
route6(/^\/news$/, function () { redirect6('#/'); setTimeout(function () { showNews(); }, 500); }, { page: 'home' });
route6(/^\/tips(?:\/([a-z]+))?$/, showTips6, { page: 'tips' });
route6(/^\/week$/, showWeek6, { page: 'account' });
route6(/^\/reviews$/, showReviews6, { page: 'account' });
route6(/^\/admin(?:\/([a-z]+))?$/, showAdmin, { page: 'admin' });
route6(/^\/guide(?:\/([a-z]+))?$/, showGuide6, { page: 'guide' });
route6(/.*/, showHome, { page: 'home' });
window.addEventListener('hashchange', function () { setTimeout(markNav, 0); });

// الهاتف يفتح التطبيق مباشرة، إلا من اختار نسخة الويب من التطبيق نفسه
function isPhone() { try { return matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) < 600; } catch (e) { return false; } }
(async function boot() {
  if (!window.DEMO && !ls('preferWeb') && isPhone() && !/[?&]web=1/.test(location.search)) { location.replace(appHref() + location.hash); return; }
  setMotion('calm');
  const nm = ls('lastName'); splash(nm ? 'أهلاً بك يا ' + nm + '…' : 'نرحّب بك…');
  const fonts = loadUiFonts().catch(function () {});
  setTimeout(function () { splash('نوقظ الخطوط من نومها…'); }, 700);
  await Promise.race([fonts, new Promise(function (ok) { setTimeout(ok, 1500); })]);
  let r = false;
  try { r = await restore(); } catch (e) { console.warn(e); }
  if (r === 'must') { splashHide(); return; }
  render();
})();
