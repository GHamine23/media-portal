/****  البوابة الإعلامية للبرامج الإلكترونية — أكاديمية الجيل الصاعد
       هذا الملف يعرض الموقع ويحفظ بياناته. الموقع نفسه ملفات في مجلد «٠- ملفات الموقع» على درايف:
       يجمعها هذا الملف عند كل فتح، فأي تحديث لملف هناك يظهر فوراً بلا إعادة نشر.
       ويضيف كل حزمة قوالب في مجلد «٢- حزم القوالب» (تضيفها المهمة الأسبوعية).  ****/

var IDS = {
  root:    '1d3XxxlziQMJ-qW-IT0sjEyikxfHaEtKN',   // البوابة الإعلامية للبرامج الإلكترونية
  site:    '1aK4gmRwej9AkyYW6whGCWo-6mBejhBw6',   // ٠- ملفات الموقع
  inbox:   '1iMjyU0tiAvl3574K4xGA7xjHLrn8a8o6',   // ١- صندوق التصاميم الجديدة
  packs:   '1WgxqfYIqxUJSed8YgIQzM8GydJEGueby',   // ٢- حزم القوالب
  done:    '1CkVo5eRBOdyQN4o-qW5LRdxSBgd81YHe',   // ٣- تمت معالجتها
  data:    '1B5HNjXqgzDIcAMemdnOoY1SIpACeI500',   // ٤- بيانات الموقع
  reports: '1i0qbb2TW-MQMdhy_q8klmgnDXkjaESGT'    // ٥- تقارير التطوير الأسبوعية
};
var TITLE = 'البوابة الإعلامية للبرامج الإلكترونية';

// رابط الواجهة على GitHub Pages. إن كان فارغاً عرض هذا الملف الموقع كاملاً من درايف كما كان
var SITE_URL = 'https://ghamine23.github.io/media-portal/';

/* ---------- عرض الموقع ---------- */
function doGet() {
  if (SITE_URL) {
    // الرابط القديم يحوّل إلى الواجهة الجديدة
    return HtmlService.createHtmlOutput('<!doctype html><html dir="rtl"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>'
      + '<body style="font-family:Tahoma,Arial,sans-serif;text-align:center;padding:60px 20px;background:#f4f3f1">'
      + '<h2 style="color:#2a1534">البوابة الإعلامية للبرامج الإلكترونية</h2><p>انتقلت البوابة إلى رابط جديد أسرع.</p>'
      + '<p><a href="' + SITE_URL + '" target="_top" style="display:inline-block;background:#16817a;color:#fff;padding:12px 26px;border-radius:12px;text-decoration:none">افتح البوابة</a></p>'
      + '<p style="color:#777;font-size:14px;direction:ltr">' + SITE_URL + '</p></body></html>')
      .setTitle(TITLE).addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  return HtmlService.createHtmlOutput(page_())
    .setTitle(TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function filesIn_(folderId) {   // أحدث نسخة من كل اسم، بلا المحذوف
  var out = {}, it = DriveApp.getFolderById(folderId).searchFiles('trashed = false');
  while (it.hasNext()) {
    var f = it.next(), n = f.getName();
    if (!out[n] || out[n].getLastUpdated() < f.getLastUpdated()) out[n] = f;
  }
  return out;
}
function text_(f) { return f.getBlob().getDataAsString('UTF-8'); }

/* ---------- ذاكرة مؤقتة للصفحة: تُجمع مرة، وتُعاد من الذاكرة حتى يتغير ملف ---------- */
// كل دقيقتين على الأكثر نتأكد هل تغيّر ملف في «٠- ملفات الموقع» أو «٢- حزم القوالب»
var CHUNK = 30000;   // حروف في كل قطعة (حد الذاكرة 100 كيلوبايت للقطعة، والحرف العربي أكثر من بايت)
function signature_() {
  var parts = [];
  [IDS.site, IDS.packs].forEach(function (id) {
    var it = DriveApp.getFolderById(id).searchFiles('trashed = false');
    while (it.hasNext()) { var f = it.next(); parts.push(f.getName() + ':' + f.getLastUpdated().getTime()); }
  });
  return parts.sort().join('|');
}
function readCached_(cache, meta) {
  var keys = []; for (var i = 0; i < meta.n; i++) keys.push('pg_' + meta.v + '_' + i);
  var got = cache.getAll(keys), out = [];
  for (var j = 0; j < keys.length; j++) { if (got[keys[j]] == null) return null; out.push(got[keys[j]]); }
  return out.join('');
}
function page_() {
  var cache = CacheService.getScriptCache(), meta = null, html;
  try { meta = JSON.parse(cache.get('pg_meta') || 'null'); } catch (e) { meta = null; }
  if (meta && cache.get('pg_fresh')) { html = readCached_(cache, meta); if (html) return html; }
  var sig = signature_();
  if (meta && meta.sig === sig) {
    html = readCached_(cache, meta);
    if (html) { cache.put('pg_fresh', '1', 120); return html; }
  }
  html = assemble_();
  try {
    var v = String(Date.now()), n = Math.ceil(html.length / CHUNK), vals = {};
    for (var i = 0; i < n; i++) vals['pg_' + v + '_' + i] = html.substr(i * CHUNK, CHUNK);
    cache.putAll(vals, 21600);
    cache.put('pg_meta', JSON.stringify({ v: v, n: n, sig: sig }), 21600);
    cache.put('pg_fresh', '1', 120);
  } catch (e) { console.warn('cache', e); }
  return html;
}
// يبقي الصفحة جاهزة في الذاكرة (يشغّلها مؤقت setup كل خمس ساعات)
function warmCache() { CacheService.getScriptCache().remove('pg_fresh'); page_(); }
// إن أردت أن يظهر تعديل فوراً دون انتظار دقيقتين
function clearCache() { var c = CacheService.getScriptCache(); c.remove('pg_meta'); c.remove('pg_fresh'); }
function assemble_() {
  var files = filesIn_(IDS.site);
  var shellFile = files['shell.page'] || files['shell.html'];
  if (!shellFile) return '<p dir="rtl">لم أجد ملف shell.page في مجلد «٠- ملفات الموقع». راجع دليل الرفع.</p>';
  var html = text_(shellFile).replace(/<!--FILE:([\w.\-]+)-->/g, function (m, name) {
    var f = files[name];
    return f ? '<script>\n' + text_(f) + '\n</script>' : '<!-- ملف ناقص: ' + name + ' -->';
  });
  var packs = '', pf = filesIn_(IDS.packs), names = Object.keys(pf).filter(function (n) { return /\.js$/i.test(n); }).sort();
  names.forEach(function (n) { packs += '<script>\ntry {\n' + text_(pf[n]) + '\n} catch (e) { console.error("pack ' + n.replace(/[^\w.\-]/g, '') + '", e); }\n</script>\n'; });
  return html.replace('<!--PACKS-->', function () { return packs; });
}

/* ---------- الواجهة الخارجية (GitHub Pages) تطلب من هنا ---------- */
function apiFns_() { return { api_ping: api_ping, api_login: api_login, api_me: api_me, api_prefs: api_prefs, api_tpl_list: api_tpl_list, api_tpl_get: api_tpl_get, api_tpl_save: api_tpl_save, api_tpl_del: api_tpl_del, api_packs: api_packs }; }
function doPost(e) {
  var out;
  try {
    var req = JSON.parse(e.postData.contents);
    var fn = apiFns_()[req.fn];
    if (!fn) throw new Error('طلب غير معروف');
    out = { result: fn.apply(null, req.args || []) };
  } catch (err) { out = { error: String(err && err.message || err) }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
// حزم القوالب الأسبوعية: نص كل ملف .js في «٢- حزم القوالب»، بالترتيب الأبجدي
function api_packs() {
  var pf = filesIn_(IDS.packs);
  return JSON.stringify(Object.keys(pf).filter(function (n) { return /\.js$/i.test(n); }).sort().map(function (n) {
    return { name: n, at: pf[n].getLastUpdated().getTime(), code: text_(pf[n]) };
  }));
}

/* ---------- ملفات البيانات ---------- */
function dataFolder_() { return DriveApp.getFolderById(IDS.data); }
function readJson_(name, def) {
  var it = dataFolder_().getFilesByName(name);
  while (it.hasNext()) { var f = it.next(); if (!f.isTrashed()) { try { return JSON.parse(text_(f)); } catch (e) { return def; } } }
  return def;
}
function writeJson_(name, obj) {
  var s = JSON.stringify(obj), it = dataFolder_().getFilesByName(name);
  while (it.hasNext()) { var f = it.next(); if (!f.isTrashed()) { f.setContent(s); return; } }
  dataFolder_().createFile(name, s, 'application/json');
}
function withLock_(fn) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ---------- الحسابات: اسم ورمز من أربعة أرقام ---------- */
function api_ping() { return 'ok'; }
function key_(name) {
  return String(name || '').trim().replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').toLowerCase();
}
function hash_(salt, pin) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + '|' + pin, Utilities.Charset.UTF_8);
  return b.map(function (x) { return ('0' + (x & 255).toString(16)).slice(-2); }).join('');
}
function userByToken_(users, token) {
  if (!token) return null;
  for (var k in users) if (users[k].token === token) return { key: k, u: users[k] };
  return null;
}
function api_login(name, pin) {
  name = String(name || '').trim().slice(0, 60); pin = String(pin || '');
  if (name.length < 2 || !/^\d{4}$/.test(pin)) throw new Error('الاسم أو الرمز غير صحيح');
  return withLock_(function () {
    var users = readJson_('users.json', {}), k = key_(name), u = users[k], now = Date.now(), isNew = false;
    if (!u) {
      var salt = Utilities.getUuid();
      u = users[k] = { name: name, salt: salt, hash: hash_(salt, pin), token: Utilities.getUuid(), prefs: {}, at: now, fails: 0 };
      isNew = true;
    } else {
      if (u.lockUntil && u.lockUntil > now) throw new Error('محاولات كثيرة. انتظر عشر دقائق ثم حاول مرة أخرى.');
      if (u.reset) { u.hash = hash_(u.salt, pin); u.reset = false; }
      if (hash_(u.salt, pin) !== u.hash) {
        u.fails = (u.fails || 0) + 1;
        if (u.fails >= 8) { u.lockUntil = now + 10 * 60 * 1000; u.fails = 0; }
        writeJson_('users.json', users);
        throw new Error('الرمز لا يطابق هذا الاسم. إن نسيته فاطلب من مشرف البوابة مسحه.');
      }
      u.fails = 0; u.last = now;
    }
    writeJson_('users.json', users);
    return JSON.stringify({ name: u.name, token: u.token, prefs: u.prefs || {}, isNew: isNew });
  });
}
function api_me(token) {
  var r = userByToken_(readJson_('users.json', {}), token);
  if (!r) throw new Error('انتهت الجلسة');
  return JSON.stringify({ name: r.u.name, prefs: r.u.prefs || {} });
}
function api_prefs(token, json) {
  if (String(json).length > 200000) throw new Error('التفضيلات أكبر من المسموح');
  return withLock_(function () {
    var users = readJson_('users.json', {}), r = userByToken_(users, token);
    if (!r) throw new Error('انتهت الجلسة');
    r.u.prefs = JSON.parse(json); writeJson_('users.json', users); return 'ok';
  });
}

/* ---------- قوالبي وعروضي ---------- */
function safeId_(id) { id = String(id || ''); if (!/^[a-z0-9]{6,40}$/.test(id)) throw new Error('معرّف غير صحيح'); return id; }
function itemFile_(id) {
  var it = dataFolder_().getFilesByName('i_' + id + '.json');
  while (it.hasNext()) { var f = it.next(); if (!f.isTrashed()) return f; }
  return null;
}
function api_tpl_list(token) {
  var users = readJson_('users.json', {}), r = userByToken_(users, token);
  if (!r) return '[]';   // القوالب لا تظهر إلا لمن دخل باسمه ورمزه
  var me = 'u:' + r.key;
  var list = readJson_('index.json', []).filter(function (x) { return x.shared || x.ownerKey === me; });
  return JSON.stringify(list);
}
function api_tpl_get(token, id) {
  id = safeId_(id);
  var f = itemFile_(id); if (!f) return 'null';
  var item = JSON.parse(text_(f)), r = userByToken_(readJson_('users.json', {}), token);
  if (!r) throw new Error('ادخل باسمك ورمزك أولاً');
  if (!item.shared && item.ownerKey !== 'u:' + r.key) throw new Error('هذا القالب ليس لك');
  return JSON.stringify(item);
}
function api_tpl_save(token, json) {
  if (String(json).length > 40 * 1024 * 1024) throw new Error('الملف أكبر من المسموح');
  var item = JSON.parse(json), id = safeId_(item.id);
  return withLock_(function () {
    var users = readJson_('users.json', {}), r = userByToken_(users, token);
    if (!r) throw new Error('ادخل باسمك أولاً');
    var me = 'u:' + r.key, old = itemFile_(id);
    if (old) { var prev = JSON.parse(text_(old)); if (prev.ownerKey && prev.ownerKey !== me) throw new Error('لا يمكنك تعديل قالب زميلك؛ احفظه نسخة لك'); }
    item.owner = r.u.name; item.ownerKey = me;
    var s = JSON.stringify(item);
    if (old) old.setContent(s); else dataFolder_().createFile('i_' + id + '.json', s, 'application/json');
    var list = readJson_('index.json', []).filter(function (x) { return x.id !== id; });
    list.unshift({ id: id, kind: item.kind || 'tpl', name: String(item.name || '').slice(0, 80), owner: item.owner, ownerKey: me, shared: !!item.shared,
                   tpl: item.tpl, track: item.track, thumb: item.thumb, at: item.at });
    writeJson_('index.json', list);
    return JSON.stringify({ id: id });
  });
}
function api_tpl_del(token, id) {
  id = safeId_(id);
  return withLock_(function () {
    var r = userByToken_(readJson_('users.json', {}), token); if (!r) throw new Error('ادخل باسمك أولاً');
    var f = itemFile_(id);
    if (f) { var item = JSON.parse(text_(f)); if (item.ownerKey !== 'u:' + r.key) throw new Error('هذا القالب ليس لك'); f.setTrashed(true); }
    writeJson_('index.json', readJson_('index.json', []).filter(function (x) { return x.id !== id; }));
    return 'ok';
  });
}

/* ---------- مساعدة المهمة الأسبوعية: معاينات خفيفة للتصاميم الجديدة ---------- */
// شغّلها مرة واحدة من المحرر بعد النشر: تُنشئ مؤقتاً يعمل كل ساعة
function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'makePreviews') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('makePreviews').timeBased().everyHours(1).create();
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'warmCache') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('warmCache').timeBased().everyHours(4).create();
  makePreviews();
  warmCache();
}
// لكل صورة في «صندوق التصاميم الجديدة» نسخة مصغّرة (عرضها 1000) في مجلد «معاينات» داخله،
// فتقرؤها المهمة الأسبوعية بسرعة دون تنزيل الملفات الكبيرة
function makePreviews() {
  var inbox = DriveApp.getFolderById(IDS.inbox), pv;
  var pit = inbox.getFoldersByName('معاينات');
  pv = pit.hasNext() ? pit.next() : inbox.createFolder('معاينات');
  var have = {}, it = pv.getFiles();
  while (it.hasNext()) have[it.next().getName()] = 1;
  var files = inbox.searchFiles("trashed = false and mimeType contains 'image/'");
  while (files.hasNext()) {
    var f = files.next(), name = 'معاينة__' + f.getId() + '.jpg';
    if (have[name]) continue;
    try {
      var url = 'https://drive.google.com/thumbnail?sz=w1000&id=' + f.getId();
      var res = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
      var blob = res.getResponseCode() === 200 ? res.getBlob() : f.getThumbnail();
      pv.createFile(blob.setName(name)).setDescription(f.getName());
    } catch (e) { console.warn(f.getName(), e); }
  }
}

/* ---------- مسح رمز مربٍ نسيه ----------
   اكتب اسمه بين علامتي التنصيص كما يدخل به، ثم اختر الدالة resetPin واضغط «تشغيل».
   يدخل بعدها باسمه وأي رمز جديد، وتبقى قوالبه كما هي. */
function resetPin() {
  var NAME = 'اكتب الاسم هنا';
  withLock_(function () {
    var users = readJson_('users.json', {}), k = key_(NAME), u = users[k];
    if (!u) { console.log('لا يوجد حساب بهذا الاسم: ' + NAME); return; }
    var salt = Utilities.getUuid(); u.salt = salt; u.hash = '';
    u.reset = true; writeJson_('users.json', users);
    console.log('مُسح رمز ' + u.name + '. أول رمز يدخل به سيُعتمد.');
  });
}
