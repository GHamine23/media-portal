/* عامل خدمة تطبيق أثر: ملفات التطبيق محفوظة (كاش أولاً مع تحديث في الخلفية)، والخادم وواجهات الخدمات شبكة فقط.
   القائمة والإصدار يملؤهما البناء، فكل بناء جديد ينشئ كاشاً جديداً ويحذف القديم. */
const VER = '/*VER*/';
const CACHE = 'athar-app-' + VER;
const ASSETS = /*ASSETS*/;
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
