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

route6(/^\/login$/, function () { if (V6.token && V6.me && !V6.me.mustChange) return go('#/'); showLogin(); }, { public: true, page: 'login', noVT: true });
route6(/^\/password$/, function () { showChangePw(false); }, { page: 'account' });
route6(/^\/$/, showHome, { page: 'home' });
route6(/^\/g\/([^/]+)(?:\/([^/]+))?$/, showGallery6, { page: 'home' });
route6(/^\/e\/([^/]+)\/([^/]+)$/, openNew, { page: 'editor', noVT: true });
route6(/^\/d\/([^/?]+)$/, openItem, { page: 'editor', noVT: true });
route6(/^\/s\/([^/]+)$/, showSlides6, { page: 'home' });
route6(/^\/arc\/(\d{4}-\d{2})\/([a-z0-9]+)$/, openArc, { page: 'editor', noVT: true });
route6(/^\/make$/, showMake6, { page: 'make' });
route6(/^\/mine$/, showMine6, { page: 'mine' });
route6(/^\/account$/, showAccount, { page: 'account' });
route6(/^\/admin(?:\/([a-z]+))?$/, showAdmin, { page: 'admin' });
route6(/.*/, showHome, { page: 'home' });
window.addEventListener('hashchange', function () { setTimeout(markNav, 0); });

(async function boot() {
  setMotion('calm');
  const fonts = loadUiFonts().catch(function () {});
  await Promise.race([fonts, new Promise(function (ok) { setTimeout(ok, 1500); })]);
  let r = false;
  try { r = await restore(); } catch (e) { console.warn(e); }
  if (r === 'must') return;
  render();
})();
