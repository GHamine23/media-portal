/* عامل خدمة تطبيق أثر: ملفات التطبيق محفوظة (كاش أولاً مع تحديث في الخلفية)، والخادم وواجهات الخدمات شبكة فقط.
   القائمة والإصدار يملؤهما البناء، فكل بناء جديد ينشئ كاشاً جديداً ويحذف القديم. */
const VER = '287fd7a904';
const CACHE = 'athar-app-' + VER;
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "../v6/js/config.js?v=b79cfa4c64", "../v6/js/konva.min.js?v=65c5c4e432", "../v6/js/engine.js?v=88cb73ffde", "../v6/js/identities.js?v=867f3e03db", "../v6/js/templates.js?v=05b1cdc180", "../v6/js/templates2.js?v=f2b04685e9", "../v6/js/templates3.js?v=0f2ff161cf", "../v6/js/templates4.js?v=2e2e28da1d", "../v6/js/core5.js?v=07c30ccba2", "../v6/js/studio.js?v=2a0bc8231f", "../v6/js/slides.js?v=849b6bf589", "../v6/js/qr.js?v=4c79be1679", "../v6/js/ticons.js?v=d1041b1786", "../v6/js/brand6.js?v=b6adb48303", "../v6/js/core6.js?v=93c35b93f2", "../v6/js/freetpl6.js?v=f9b7e44ff1", "../v6/js/assets6.js?v=84ccbc8118", "../v6/js/auth6.js?v=9c26490fdc", "../v6/js/home6.js?v=849f5f73ee", "../v6/js/sections6.js?v=798f2452b2", "../v6/js/updates6.js?v=1210eaa02d", "../v6/js/motion6.js?v=a64d7bdcc9", "../v6/js/kb6.js?v=864b1b8b77", "../v6/js/guide6.js?v=0b68b573e6", "../v6/js/about6.js?v=4efa2fa03d", "../v6/js/editor6.js?v=002d51fc20", "../v6/js/panels6.js?v=40bf4adab7", "../v6/js/docs6.js?v=89670a1b20", "../v6/js/make6.js?v=a6b2855dcb", "../v6/js/caption6.js?v=ee66ba7087", "../v6/js/cal6.js?v=5d32d6c604", "../v6/js/slides6.js?v=5899b490d5", "../v6/js/presenter6.js?v=2442603204", "../v6/js/tilawa6.js?v=908a88e136", "../v6/js/lesson6.js?v=68a3226328", "../v6/js/extras6.js?v=1fd6891d43", "../v6/js/tips6.js?v=86b4f361a7", "../v6/js/social6.js?v=05c796e7ed", "../v6/js/mine6.js?v=bca6971598", "../v6/js/admin6.js?v=0b4e4c6d16", "../v6/js/pstats6.js?v=6e18786688", "js/ios6.js?v=ecfe87f0a7", "js/mscreens.js?v=468e1a0d70", "js/meditor.js?v=3523971460", "js/minstall.js?v=33b66e5b2a", "js/mapp.js?v=896f2435e4"];
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
