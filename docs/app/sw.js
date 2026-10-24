/* عامل خدمة تطبيق أثر: ملفات التطبيق محفوظة (كاش أولاً مع تحديث في الخلفية)، والخادم وواجهات الخدمات شبكة فقط.
   القائمة والإصدار يملؤهما البناء، فكل بناء جديد ينشئ كاشاً جديداً ويحذف القديم. */
const VER = '33e72193a4';
const CACHE = 'athar-app-' + VER;
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "../v6/js/config.js?v=b79cfa4c64", "../v6/js/konva.min.js?v=65c5c4e432", "../v6/js/engine.js?v=5088b85303", "../v6/js/identities.js?v=867f3e03db", "../v6/js/templates.js?v=786a7dfb20", "../v6/js/templates2.js?v=421638ff17", "../v6/js/core5.js?v=75a4f3ddad", "../v6/js/studio.js?v=c5a1dcdb47", "../v6/js/slides.js?v=849b6bf589", "../v6/js/qr.js?v=4c79be1679", "../v6/js/ticons.js?v=d1041b1786", "../v6/js/brand6.js?v=b6adb48303", "../v6/js/core6.js?v=aa271eeb77", "../v6/js/freetpl6.js?v=ec4f7b8631", "../v6/js/assets6.js?v=26625a59aa", "../v6/js/auth6.js?v=f0fb5d99e5", "../v6/js/home6.js?v=b087a644ed", "../v6/js/updates6.js?v=a1a9d26866", "../v6/js/editor6.js?v=0f2a69f94e", "../v6/js/panels6.js?v=4c34b12c1a", "../v6/js/docs6.js?v=395b5d65f8", "../v6/js/make6.js?v=c2a6a26cb0", "../v6/js/caption6.js?v=7b01b0b036", "../v6/js/cal6.js?v=4b52474fdf", "../v6/js/slides6.js?v=2e78ef139f", "../v6/js/extras6.js?v=bef922cc0b", "../v6/js/tips6.js?v=86b4f361a7", "../v6/js/social6.js?v=0eb674c8b4", "../v6/js/mine6.js?v=34484d7391", "../v6/js/admin6.js?v=41f08128c5", "js/ios6.js?v=5abeaa346b", "js/mscreens.js?v=aede6bea37", "js/meditor.js?v=6ecbc80fa2", "js/minstall.js?v=33b66e5b2a", "js/mapp.js?v=e493b0ca98"];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(ASSETS.map(function (u) { return c.add(u).catch(function () {}); })); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k.indexOf('athar-app-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('message', function (e) { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', function (e) {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   // الخادم والخدمات الخارجية: شبكة مباشرة
  if (req.mode === 'navigate') {
    // الصفحة: الشبكة أولاً، وإن انقطعت فالنسخة المحفوظة
    e.respondWith(fetch(req).then(function (r) { const cp = r.clone(); caches.open(CACHE).then(function (c) { c.put('./index.html', cp); }); return r; }).catch(function () { return caches.match('./index.html'); }));
    return;
  }
  // الملفات الثابتة: الكاش أولاً، ثم الشبكة وتحديث الكاش
  e.respondWith(caches.match(req).then(function (hit) {
    const net = fetch(req).then(function (r) { if (r && r.ok && /\.(js|css|png|webmanifest|woff2?|otf|ttf|svg|webp|jpg)(\?|$)/.test(url.pathname + url.search)) { const cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); } return r; }).catch(function () { return hit; });
    return hit || net;
  }));
});
