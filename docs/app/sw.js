/* عامل خدمة تطبيق أثر: ملفات التطبيق محفوظة (كاش أولاً مع تحديث في الخلفية)، والخادم وواجهات الخدمات شبكة فقط.
   القائمة والإصدار يملؤهما البناء، فكل بناء جديد ينشئ كاشاً جديداً ويحذف القديم. */
const VER = 'e4367cd691';
const CACHE = 'athar-app-' + VER;
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "../v6/js/config.js?v=b79cfa4c64", "../v6/js/konva.min.js?v=65c5c4e432", "../v6/js/engine.js?v=8259422517", "../v6/js/identities.js?v=867f3e03db", "../v6/js/templates.js?v=5e193e0810", "../v6/js/templates2.js?v=da35b150db", "../v6/js/templates3.js?v=0f2ff161cf", "../v6/js/templates4.js?v=2e2e28da1d", "../v6/js/core5.js?v=419c7c89f5", "../v6/js/studio.js?v=2f491d4b33", "../v6/js/slides.js?v=849b6bf589", "../v6/js/qr.js?v=4c79be1679", "../v6/js/ticons.js?v=d1041b1786", "../v6/js/brand6.js?v=b6adb48303", "../v6/js/core6.js?v=93c35b93f2", "../v6/js/freetpl6.js?v=f9b7e44ff1", "../v6/js/assets6.js?v=f312f9f69f", "../v6/js/auth6.js?v=9fd9b378fe", "../v6/js/home6.js?v=d347688218", "../v6/js/updates6.js?v=1210eaa02d", "../v6/js/motion6.js?v=c3c5dbc6be", "../v6/js/kb6.js?v=8f7305f987", "../v6/js/guide6.js?v=c4636f695a", "../v6/js/editor6.js?v=69f9abcd78", "../v6/js/panels6.js?v=ae269b9832", "../v6/js/docs6.js?v=476f6ee7f8", "../v6/js/make6.js?v=a6b2855dcb", "../v6/js/caption6.js?v=ee66ba7087", "../v6/js/cal6.js?v=5d32d6c604", "../v6/js/slides6.js?v=2e78ef139f", "../v6/js/extras6.js?v=2a5cdd3f4d", "../v6/js/tips6.js?v=86b4f361a7", "../v6/js/social6.js?v=05c796e7ed", "../v6/js/mine6.js?v=564318db7d", "../v6/js/admin6.js?v=5c0488c7e7", "js/ios6.js?v=ecfe87f0a7", "js/mscreens.js?v=49d2dea31a", "js/meditor.js?v=3523971460", "js/minstall.js?v=33b66e5b2a", "js/mapp.js?v=330e8a0c99"];
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
