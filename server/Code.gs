/****  منصة الأثر الإعلامي — الخادم (الإصدار السادس)
       يحفظ الحسابات والبرامج والأصول والقوالب والبلاغات والإحصاءات في مجلد «٤- بيانات الموقع» على درايف،
       ويخدم الواجهة المنشورة على GitHub Pages. ويبقى متوافقاً مع الإصدار الخامس حتى يكتمل الانتقال.

       بعد النشر لأول مرة: شغّل الدالة bootstrap مرة واحدة من المحرر، واقرأ كلمة مرور المدير في السجل.  ****/

var IDS = {
  root:    '1d3XxxlziQMJ-qW-IT0sjEyikxfHaEtKN',   // البوابة الإعلامية للبرامج الإلكترونية
  site:    '1aK4gmRwej9AkyYW6whGCWo-6mBejhBw6',   // ٠- ملفات الموقع
  inbox:   '1iMjyU0tiAvl3574K4xGA7xjHLrn8a8o6',   // ١- صندوق التصاميم الجديدة
  packs:   '1WgxqfYIqxUJSed8YgIQzM8GydJEGueby',   // ٢- حزم القوالب
  done:    '1CkVo5eRBOdyQN4o-qW5LRdxSBgd81YHe',   // ٣- تمت معالجتها
  data:    '1B5HNjXqgzDIcAMemdnOoY1SIpACeI500',   // ٤- بيانات الموقع
  reports: '1i0qbb2TW-MQMdhy_q8klmgnDXkjaESGT'    // ٥- تقارير التطوير الأسبوعية
};
var TITLE = 'منصة الأثر الإعلامي';
var VERSION = '6.0.0';
// رابط الواجهة على GitHub Pages. إن كان فارغاً عرض هذا الملف الموقع كاملاً من درايف كما كان
var SITE_URL = 'https://ghamine23.github.io/media-portal/';
// مصدر الأصول الأولى (الشعارات والصور والخطوط الحالية) عند تشغيل bootstrap
var SEED_BASE = 'https://raw.githubusercontent.com/GHamine23/media-portal/main/assets/';

/* ---------- عرض الموقع ---------- */
function doGet() {
  if (SITE_URL) {
    return HtmlService.createHtmlOutput('<!doctype html><html dir="rtl"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>'
      + '<body style="font-family:Tahoma,Arial,sans-serif;text-align:center;padding:60px 20px;background:#f7f7f7">'
      + '<h2 style="color:#171717">' + TITLE + '</h2><p>انتقلت المنصة إلى رابط جديد أسرع.</p>'
      + '<p><a href="' + SITE_URL + '" target="_top" style="display:inline-block;background:#000;color:#fff;padding:12px 26px;border-radius:99px;text-decoration:none">افتح المنصة</a></p>'
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

/* ---------- الطريقة القديمة: تجميع الصفحة من درايف (للإصدار الخامس داخل Apps Script) ---------- */
var CHUNK = 30000;
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
function warmCache() { if (SITE_URL) return; CacheService.getScriptCache().remove('pg_fresh'); page_(); }
function clearCache() { var c = CacheService.getScriptCache(); c.remove('pg_meta'); c.remove('pg_fresh'); }
function assemble_() {
  var files = filesIn_(IDS.site);
  var shellFile = files['shell.page'] || files['shell.html'];
  if (!shellFile) return '<p dir="rtl">لم أجد ملف shell.page في مجلد «٠- ملفات الموقع».</p>';
  var html = text_(shellFile).replace(/<!--FILE:([\w.\-]+)-->/g, function (m, name) {
    var f = files[name];
    return f ? '<script>\n' + text_(f) + '\n</script>' : '<!-- ملف ناقص: ' + name + ' -->';
  });
  var packs = '', pf = filesIn_(IDS.packs), names = Object.keys(pf).filter(function (n) { return /\.js$/i.test(n); }).sort();
  names.forEach(function (n) { packs += '<script>\ntry {\n' + text_(pf[n]) + '\n} catch (e) { console.error("pack ' + n.replace(/[^\w.\-]/g, '') + '", e); }\n</script>\n'; });
  return html.replace('<!--PACKS-->', function () { return packs; });
}

/* ================= واجهة الطلبات ================= */
function apiFns_() {
  return {
    // الإصدار الخامس (يبقى حتى يكتمل الانتقال)
    api_ping: api_ping, api_login: api_login, api_me: api_me, api_prefs: api_prefs, api_tpl_list: api_tpl_list, api_tpl_get: api_tpl_get,
    api_tpl_save: api_tpl_save, api_tpl_del: api_tpl_del, api_packs: api_packs, api_feedback: api_feedback,
    // الإصدار السادس
    info: info, auth_login: auth_login, auth_me: auth_me, auth_logout: auth_logout, auth_password: auth_password, prefs_save: prefs_save,
    acc_list: acc_list, acc_save: acc_save, acc_reset: acc_reset, acc_import: acc_import,
    prog_list: prog_list, prog_save: prog_save, prog_del: prog_del, bundle: bundle,
    asset_put: asset_put, asset_get: asset_get, asset_batch: asset_batch, asset_list: asset_list, asset_meta: asset_meta, asset_del: asset_del,
    ui_fonts: ui_fonts, ui_font_get: ui_font_get,
    item_list: item_list, item_get: item_get, item_save: item_save, item_del: item_del,
    fb_send: fb_send, fb_list: fb_list, fb_update: fb_update, fb_mine: fb_mine, fb_shot: fb_shot,
    stat_track: stat_track, stat_summary: stat_summary,
    bc_list: bc_list, bc_all: bc_all, bc_save: bc_save, bc_del: bc_del,
    cl_list: cl_list, cl_save: cl_save, set_get: set_get, set_save: set_save, audit_list: audit_list,
    ai_make: ai_make, ai_status: ai_status
  };
}
function doPost(e) {
  var out; JC = {};
  try {
    var req = JSON.parse(e.postData.contents);
    var fn = apiFns_()[req.fn];
    if (!fn) throw new Error('طلب غير معروف');
    out = { result: fn.apply(null, req.args || []) };
  } catch (err) { out = { error: String(err && err.message || err) }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
function info() { return JSON.stringify({ v: VERSION, title: TITLE, ready: !!Object.keys(readJson_('accounts.json', {})).length }); }

/* ================= التخزين ================= */
function dataFolder_() { return DriveApp.getFolderById(IDS.data); }
function props_() { return PropertiesService.getScriptProperties(); }
// مجلد فرعي داخل «بيانات الموقع» (assets، fonts، shots) يُنشأ عند الحاجة
function sub_(name) {
  var key = 'dir_' + name, id = props_().getProperty(key);
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var it = dataFolder_().getFoldersByName(name), f = it.hasNext() ? it.next() : dataFolder_().createFolder(name);
  props_().setProperty(key, f.getId());
  return f;
}
function jfile_(name) {
  var key = 'jf_' + name, id = props_().getProperty(key);
  if (id) { try { var f0 = DriveApp.getFileById(id); if (!f0.isTrashed()) return f0; } catch (e) {} }
  var it = dataFolder_().getFilesByName(name);
  while (it.hasNext()) { var f = it.next(); if (!f.isTrashed()) { props_().setProperty(key, f.getId()); return f; } }
  return null;
}
var JC = {};   // ذاكرة هذا الطلب
function readJson_(name, def) {
  if (JC.hasOwnProperty(name)) return JSON.parse(JC[name]);
  var c = CacheService.getScriptCache(), k = 'j:' + name, hit = c.get(k);
  if (hit != null) { JC[name] = hit; try { return JSON.parse(hit); } catch (e) {} }
  var f = jfile_(name); if (!f) return def;
  var s = text_(f), v;
  try { v = JSON.parse(s); } catch (e) { return def; }
  JC[name] = s;
  if (s.length < 40000) { try { c.put(k, s, 21600); } catch (e) {} }
  return v;
}
function writeJson_(name, obj) {
  var s = JSON.stringify(obj), f = jfile_(name);
  if (f) f.setContent(s);
  else { f = dataFolder_().createFile(name, s, 'application/json'); props_().setProperty('jf_' + name, f.getId()); }
  JC[name] = s;
  var c = CacheService.getScriptCache();
  try { if (s.length < 40000) c.put('j:' + name, s, 21600); else c.remove('j:' + name); } catch (e) { c.remove('j:' + name); }
}
function withLock_(fn) {
  var lock = LockService.getScriptLock(); lock.waitLock(25000);
  try { JC = {}; return fn(); } finally { lock.releaseLock(); }
}
function uid_() { return Utilities.getUuid().replace(/-/g, '').slice(0, 16); }
function now_() { return Date.now(); }
function clip_(s, n) { return String(s == null ? '' : s).slice(0, n); }

/* ================= الحسابات والأدوار =================
   accounts.json: { uid: {uid, username, email, name, role: super|sup|user, programs: [], perms: {}, salt, hash,
                          mustChange, disabled, fails, lockUntil, created, last, legacyKey, prefs} }
   sessions.json: { token: {u, e: انتهاء, l: آخر استخدام} } */
var ROLES = { super: 'المدير العام', sup: 'مشرف برنامج', user: 'مستخدم' };
var PERMS = ['social', 'ai', 'upload', 'fonts', 'slides'];   // صلاحيات قابلة للمنح لكل حساب
var SESSION_DAYS = 30;

function pwHash_(salt, pw) {
  var key = Utilities.newBlob(String(pw)).getBytes(), v = Utilities.newBlob(String(salt)).getBytes();
  for (var i = 0; i < 1500; i++) v = Utilities.computeHmacSha256Signature(v, key);
  return Utilities.base64Encode(v);
}
function normUser_(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
function tempPass_() {
  var a = 'abcdefghjkmnpqrstuvwxyz23456789', s = '';
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid());
  for (var i = 0; i < 10; i++) s += a.charAt((b[i] + 256) % a.length);
  return s;
}
function publicAcc_(a) {
  return { uid: a.uid, username: a.username, email: a.email || '', name: a.name, role: a.role, programs: a.programs || [], perms: a.perms || {},
    mustChange: !!a.mustChange, disabled: !!a.disabled, created: a.created, last: a.last || 0, legacy: !!a.legacyKey, note: a.note || '' };
}
function findAcc_(accs, id) {
  var n = normUser_(id);
  for (var k in accs) { var a = accs[k]; if (normUser_(a.username) === n || (a.email && normUser_(a.email) === n)) return a; }
  return null;
}
// الجلسة → الحساب. يرمي خطأ إن انتهت
function auth_(token, opt) {
  token = String(token || '');
  if (!token) throw new Error('ادخل أولاً');
  var ss = readJson_('sessions.json', {}), s = ss[token];
  if (!s || s.e < now_()) throw new Error('انتهت الجلسة، ادخل مرة أخرى');
  var accs = readJson_('accounts.json', {}), a = accs[s.u];
  if (!a || a.disabled) throw new Error('هذا الحساب موقوف');
  if (a.mustChange && !(opt && opt.allowMust)) throw new Error('غيّر كلمة المرور المؤقتة أولاً');
  if (now_() - (s.l || 0) > 864e5) {   // تمديد الجلسة مرة في اليوم
    withLock_(function () { var s2 = readJson_('sessions.json', {}); if (s2[token]) { s2[token].l = now_(); s2[token].e = now_() + SESSION_DAYS * 864e5; writeJson_('sessions.json', s2); }
      var a2 = readJson_('accounts.json', {}); if (a2[a.uid]) { a2[a.uid].last = now_(); writeJson_('accounts.json', a2); } });
  }
  return a;
}
function isSuper_(a) { return a.role === 'super'; }
function inProg_(a, pid) { return isSuper_(a) || (a.programs || []).indexOf(pid) >= 0; }
function adminOf_(a, pid) { return isSuper_(a) || (a.role === 'sup' && (a.programs || []).indexOf(pid) >= 0); }
function needAdmin_(a) { if (a.role !== 'super' && a.role !== 'sup') throw new Error('هذا لمدير المنصة أو مشرف البرنامج'); }
function perm_(a, p) { return isSuper_(a) || a.role === 'sup' || !!(a.perms && a.perms[p]); }
function audit_(a, what, detail) {
  try {
    var log = readJson_('audit.json', []);
    log.unshift({ at: now_(), by: a ? a.uid : '', name: a ? a.name : 'النظام', what: what, d: clip_(detail, 300) });
    if (log.length > 1500) log.length = 1500;
    writeJson_('audit.json', log);
  } catch (e) {}
}

function auth_login(id, pw) {
  id = clip_(id, 120); pw = String(pw || '');
  if (!id || !pw) throw new Error('اكتب اسم المستخدم وكلمة المرور');
  return withLock_(function () {
    var accs = readJson_('accounts.json', {}), a = findAcc_(accs, id), t = now_();
    if (!a) throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    if (a.disabled) throw new Error('هذا الحساب موقوف. راجع مشرف برنامجك.');
    if (a.lockUntil && a.lockUntil > t) throw new Error('محاولات كثيرة. انتظر عشر دقائق ثم حاول مرة أخرى.');
    if (pwHash_(a.salt, pw) !== a.hash) {
      a.fails = (a.fails || 0) + 1;
      if (a.fails >= 8) { a.lockUntil = t + 10 * 60 * 1000; a.fails = 0; }
      writeJson_('accounts.json', accs);
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
    a.fails = 0; a.lockUntil = 0; a.last = t;
    writeJson_('accounts.json', accs);
    var ss = readJson_('sessions.json', {}), tok = Utilities.getUuid() + Utilities.getUuid().slice(0, 8);
    Object.keys(ss).forEach(function (k) { if (ss[k].e < t) delete ss[k]; });   // تنظيف المنتهي
    ss[tok] = { u: a.uid, e: t + SESSION_DAYS * 864e5, l: t };
    writeJson_('sessions.json', ss);
    return JSON.stringify({ token: tok, me: meOf_(a) });
  });
}
function meOf_(a) {
  var progs = progsFor_(a).map(function (p) { return { id: p.id, name: p.name, color: p.color || '', features: p.features || {} }; });
  return Object.assign(publicAcc_(a), { prefs: a.prefs || {}, programsInfo: progs, roleName: ROLES[a.role] || '' });
}
function auth_me(token) { var a = auth_(token, { allowMust: true }); return JSON.stringify(meOf_(a)); }
function auth_logout(token) {
  return withLock_(function () { var ss = readJson_('sessions.json', {}); delete ss[String(token || '')]; writeJson_('sessions.json', ss); return 'ok'; });
}
function auth_password(token, oldPw, newPw) {
  var a0 = auth_(token, { allowMust: true });
  newPw = String(newPw || '');
  if (newPw.length < 8) throw new Error('كلمة المرور ثمانية أحرف على الأقل');
  if (newPw === oldPw) throw new Error('اختر كلمة مرور جديدة غير المؤقتة');
  return withLock_(function () {
    var accs = readJson_('accounts.json', {}), a = accs[a0.uid];
    if (pwHash_(a.salt, oldPw) !== a.hash) throw new Error('كلمة المرور الحالية غير صحيحة');
    a.salt = Utilities.getUuid(); a.hash = pwHash_(a.salt, newPw); a.mustChange = false;
    writeJson_('accounts.json', accs);
    audit_(a, 'غيّر كلمة مروره', a.username);
    return JSON.stringify(meOf_(a));
  });
}
function prefs_save(token, json) {
  if (String(json).length > 200000) throw new Error('التفضيلات أكبر من المسموح');
  var a0 = auth_(token);
  return withLock_(function () { var accs = readJson_('accounts.json', {}); accs[a0.uid].prefs = JSON.parse(json); writeJson_('accounts.json', accs); return 'ok'; });
}

/* ---------- إدارة الحسابات ---------- */
// المدير العام يرى الجميع، ومشرف البرنامج يرى حسابات برامجه فقط
function visibleAccs_(a, accs) {
  return Object.keys(accs).map(function (k) { return accs[k]; }).filter(function (x) {
    if (isSuper_(a)) return true;
    if (x.role === 'super') return false;
    return (x.programs || []).some(function (p) { return adminOf_(a, p); });
  });
}
function acc_list(token) {
  var a = auth_(token); needAdmin_(a);
  return JSON.stringify(visibleAccs_(a, readJson_('accounts.json', {})).map(publicAcc_).sort(function (x, y) { return (y.last || 0) - (x.last || 0); }));
}
// إنشاء حساب أو تعديله. o = {uid?, username, email, name, role, programs, perms, disabled, note}
function acc_save(token, json) {
  var me = auth_(token); needAdmin_(me);
  var o = JSON.parse(json);
  return withLock_(function () {
    var accs = readJson_('accounts.json', {}), isNew = !o.uid, a = isNew ? null : accs[o.uid];
    if (!isNew && !a) throw new Error('الحساب غير موجود');
    var role = o.role || (a ? a.role : 'user');
    if (!ROLES[role]) throw new Error('دور غير معروف');
    if (!isSuper_(me)) {   // حدود مشرف البرنامج
      if (role !== 'user' && !(a && a.uid === me.uid)) throw new Error('مشرف البرنامج ينشئ حسابات المستخدمين فقط');
      if (a && a.role === 'super') throw new Error('لا يمكنك تعديل المدير العام');
      (o.programs || []).forEach(function (p) { if (!adminOf_(me, p)) throw new Error('لا تملك صلاحية على برنامج ' + p); });
      if (a && !(a.programs || []).some(function (p) { return adminOf_(me, p); })) throw new Error('هذا الحساب ليس في برامجك');
    }
    var username = normUser_(o.username != null ? o.username : (a ? a.username : ''));
    if (!/^[؀-ۿa-z0-9._\- ]{3,40}$/.test(username)) throw new Error('اسم المستخدم من ٣ إلى ٤٠ حرفاً: حروف وأرقام ونقطة وشرطة');
    var email = normUser_(o.email != null ? o.email : (a ? a.email : ''));
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('البريد غير صحيح');
    Object.keys(accs).forEach(function (k) {
      var x = accs[k]; if (a && x.uid === a.uid) return;
      if (normUser_(x.username) === username || (x.email && normUser_(x.email) === username)) throw new Error('اسم المستخدم مستعمل');
      if (email && (normUser_(x.email) === email || normUser_(x.username) === email)) throw new Error('البريد مستعمل في حساب آخر');
    });
    var temp = null;
    if (isNew) {
      temp = o.password && String(o.password).length >= 8 ? String(o.password) : tempPass_();
      var salt = Utilities.getUuid();
      a = { uid: uid_(), salt: salt, hash: pwHash_(salt, temp), mustChange: true, created: now_(), last: 0, fails: 0, prefs: {} };
      accs[a.uid] = a;
    }
    if (a.uid === me.uid && role !== a.role && !isSuper_(me)) throw new Error('لا يمكنك تغيير دورك');
    if (a.uid === me.uid && isSuper_(me) && role !== 'super' && countSupers_(accs) <= 1) throw new Error('لا بد من مدير عام واحد على الأقل');
    a.username = username; a.email = email; a.name = clip_(o.name || (a.name || username), 80); a.role = role;
    if (o.programs) a.programs = o.programs.filter(function (p) { return typeof p === 'string'; }).slice(0, 30);
    if (o.perms) { var pp = {}; PERMS.forEach(function (k) { if (o.perms[k]) pp[k] = true; }); a.perms = pp; }
    if (o.disabled != null && a.uid !== me.uid) a.disabled = !!o.disabled;
    if (o.note != null) a.note = clip_(o.note, 300);
    writeJson_('accounts.json', accs);
    if (a.disabled) dropSessions_(a.uid);
    audit_(me, isNew ? 'أنشأ حساباً' : 'عدّل حساباً', a.username + ' (' + (ROLES[a.role] || a.role) + ')');
    return JSON.stringify({ acc: publicAcc_(a), temp: temp });
  });
}
function countSupers_(accs) { return Object.keys(accs).filter(function (k) { return accs[k].role === 'super' && !accs[k].disabled; }).length; }
function dropSessions_(uid) { var ss = readJson_('sessions.json', {}); Object.keys(ss).forEach(function (k) { if (ss[k].u === uid) delete ss[k]; }); writeJson_('sessions.json', ss); }
// كلمة مرور مؤقتة جديدة لمن نسي كلمته
function acc_reset(token, uid) {
  var me = auth_(token); needAdmin_(me);
  return withLock_(function () {
    var accs = readJson_('accounts.json', {}), a = accs[uid];
    if (!a) throw new Error('الحساب غير موجود');
    if (!isSuper_(me) && (a.role === 'super' || !(a.programs || []).some(function (p) { return adminOf_(me, p); }))) throw new Error('لا تملك صلاحية على هذا الحساب');
    var temp = tempPass_(); a.salt = Utilities.getUuid(); a.hash = pwHash_(a.salt, temp); a.mustChange = true; a.fails = 0; a.lockUntil = 0;
    writeJson_('accounts.json', accs); dropSessions_(uid);
    audit_(me, 'أنشأ كلمة مرور مؤقتة', a.username);
    return JSON.stringify({ temp: temp, username: a.username });
  });
}
// نقل حسابات الإصدار الخامس (الاسم والرمز) إلى حسابات جديدة، وتبقى قوالبهم معهم
function acc_import(token, program) {
  var me = auth_(token); if (!isSuper_(me)) throw new Error('هذا للمدير العام');
  program = program || 'academy';
  return withLock_(function () {
    var old = readJson_('users.json', {}), accs = readJson_('accounts.json', {}), out = [];
    var linked = {}; Object.keys(accs).forEach(function (k) { if (accs[k].legacyKey) linked[accs[k].legacyKey] = 1; });
    Object.keys(old).forEach(function (key) {
      if (linked[key]) return;
      var u = old[key], base = normUser_(u.name).replace(/[^؀-ۿa-z0-9._\- ]/g, '').slice(0, 36) || 'user', name = base, n = 2;
      while (findAcc_(accs, name)) name = base + ' ' + (n++);
      var temp = tempPass_(), salt = Utilities.getUuid();
      var a = { uid: uid_(), username: name, email: '', name: clip_(u.name, 80), role: 'user', programs: [program], perms: {}, salt: salt, hash: pwHash_(salt, temp),
        mustChange: true, created: now_(), last: u.last || 0, fails: 0, prefs: u.prefs || {}, legacyKey: key };
      accs[a.uid] = a; out.push({ username: name, name: a.name, temp: temp });
    });
    writeJson_('accounts.json', accs);
    audit_(me, 'نقل الحسابات القديمة', out.length + ' حساباً');
    return JSON.stringify(out);
  });
}

/* ================= البرامج =================
   programs.json: [{id, name, desc, color, order, active, features: {social, slides, ai}, identities: [ {id, group, name, full, desc, logo, logos, c} ]}]
   الشعارات والصور والخطوط أصول مسجلة في assets.json بمفتاح key (مثل lg_ishraq) ونطاق program */
function progs_() { return readJson_('programs.json', []); }
function progsFor_(a) { return progs_().filter(function (p) { return p.active !== false && inProg_(a, p.id); }).sort(function (x, y) { return (x.order || 0) - (y.order || 0); }); }
function prog_list(token) {
  var a = auth_(token);
  var list = isSuper_(a) ? progs_() : progsFor_(a);
  return JSON.stringify(list);
}
function prog_save(token, json) {
  var me = auth_(token); needAdmin_(me);
  var p = JSON.parse(json);
  if (!/^[a-z0-9_\-]{2,30}$/.test(p.id || '')) throw new Error('معرّف البرنامج حروف إنجليزية صغيرة وأرقام فقط');
  return withLock_(function () {
    var list = progs_(), i = -1;
    list.forEach(function (x, j) { if (x.id === p.id) i = j; });
    if (i < 0 && !isSuper_(me)) throw new Error('إنشاء البرامج للمدير العام');
    if (i >= 0 && !adminOf_(me, p.id)) throw new Error('لا تملك صلاحية على هذا البرنامج');
    var cur = i >= 0 ? list[i] : { id: p.id, created: now_() };
    cur.name = clip_(p.name || cur.name || p.id, 80); cur.desc = clip_(p.desc != null ? p.desc : cur.desc, 300);
    cur.color = /^#[0-9a-f]{6}$/i.test(p.color || '') ? p.color : (cur.color || '#171717');
    if (p.features) cur.features = { social: !!p.features.social, slides: p.features.slides !== false, ai: p.features.ai !== false };
    if (p.identities) cur.identities = p.identities.slice(0, 40).map(cleanIdentity_);
    if (isSuper_(me)) { if (p.order != null) cur.order = +p.order || 0; if (p.active != null) cur.active = !!p.active; }
    if (i >= 0) list[i] = cur; else list.push(cur);
    writeJson_('programs.json', list);
    audit_(me, i >= 0 ? 'عدّل برنامجاً' : 'أنشأ برنامجاً', cur.name);
    return JSON.stringify(cur);
  });
}
function cleanIdentity_(t) {
  var c = {}, keys = ['p', 'pd', 'pl', 's', 'sd', 'sdd', 'a', 'a2', 'paper', 'warm', 'ink', 'muted', 'teal', 'tealL'];
  keys.forEach(function (k) { var v = t.c && t.c[k]; c[k] = /^#[0-9a-f]{6}$/i.test(v || '') ? v.toLowerCase() : '#888888'; });
  if (!/^[a-z0-9_\-]{2,30}$/.test(t.id || '')) throw new Error('معرّف الهوية حروف إنجليزية صغيرة وأرقام');
  return { id: t.id, group: t.group === 'track' ? 'track' : 'act', name: clip_(t.name, 60), full: clip_(t.full || t.name, 80), desc: clip_(t.desc, 200),
    logo: clip_(t.logo, 60), logos: Array.isArray(t.logos) ? t.logos.slice(0, 8).map(function (l) { return [clip_(l[0], 60), clip_(l[1], 40)]; }) : null, c: c };
}
function prog_del(token, id) {
  var me = auth_(token); if (!isSuper_(me)) throw new Error('حذف البرامج للمدير العام');
  return withLock_(function () {
    var list = progs_().map(function (p) { if (p.id === id) p.active = false; return p; });
    writeJson_('programs.json', list); audit_(me, 'أوقف برنامجاً', id); return 'ok';
  });
}
// كل ما يحتاجه المستخدم بعد الدخول: برامجه وهوياتها وفهرس أصولها (بلا محتوى الملفات)
function bundle(token) {
  var a = auth_(token), progs = progsFor_(a), ids = {};
  progs.forEach(function (p) { ids[p.id] = 1; });
  var assets = readJson_('assets.json', []).filter(function (x) { return x.scope === 'global' || (x.scope === 'program' && ids[x.program]); })
    .map(assetPub_);
  var mine = readJson_('ua_' + a.uid + '.json', []).map(assetPub_);
  return JSON.stringify({ v: VERSION, programs: progs, assets: assets, mine: mine, settings: publicSettings_() });
}

/* ================= الأصول: صور وشعارات وعناصر وخطوط =================
   assets.json للنطاق العام والبرامج، و ua_<uid>.json لأصول كل مستخدم. الملفات نفسها في مجلد assets */
function assetPub_(x) {
  var o = { id: x.id, key: x.key || '', kind: x.kind, name: x.name, mime: x.mime, size: x.size, scope: x.scope, program: x.program || '', owner: x.owner || '', ownerName: x.ownerName || '', at: x.at, ver: x.ver || 1 };
  if (x.family) { o.family = x.family; o.weight = x.weight || '400'; o.style = x.style || 'normal'; o.ui = !!x.ui; o.label = x.label || x.family; o.wrange = x.wrange || ''; }
  if (x.thumb) o.thumb = x.thumb;
  if (x.data) o.data = x.data;
  if (x.tags) o.tags = x.tags;
  return o;
}
function regName_(scope, uid) { return scope === 'user' ? 'ua_' + uid + '.json' : 'assets.json'; }
function findAsset_(id, a) {
  var g = readJson_('assets.json', []);
  for (var i = 0; i < g.length; i++) if (g[i].id === id) return { x: g[i], reg: 'assets.json' };
  if (a) { var m = readJson_('ua_' + a.uid + '.json', []); for (var j = 0; j < m.length; j++) if (m[j].id === id) return { x: m[j], reg: 'ua_' + a.uid + '.json' }; }
  return null;
}
function canReadAsset_(a, x) { return x.scope === 'global' || (x.scope === 'program' && inProg_(a, x.program)) || (x.scope === 'user' && x.owner === a.uid); }
function canWriteScope_(a, scope, program) {
  if (scope === 'global') return isSuper_(a);
  if (scope === 'program') return adminOf_(a, program);
  return true;
}
var KINDS = { image: 1, logo: 1, element: 1, font: 1, photo: 1 };
// meta = {id?, kind, name, mime, scope, program, key, family, weight, style, ui, thumb, data, tags}، b64 محتوى الملف (اختياري للعناصر)
function asset_put(token, metaJson, b64) {
  var a = auth_(token), m = JSON.parse(metaJson);
  if (!KINDS[m.kind]) throw new Error('نوع غير معروف');
  var scope = m.scope === 'global' || m.scope === 'program' ? m.scope : 'user';
  if (!canWriteScope_(a, scope, m.program)) throw new Error('لا تملك صلاحية الرفع هنا');
  if (m.kind === 'font' && scope === 'user' && !perm_(a, 'fonts')) throw new Error('رفع الخطوط يحتاج صلاحية من المشرف');
  if (scope === 'user' && !perm_(a, 'upload') && m.kind !== 'element') {
    var st = readJson_('settings.json', {}); if (st.uploadsNeedPerm) throw new Error('رفع الصور يحتاج صلاحية من المشرف');
  }
  if (b64 && b64.length > 27 * 1024 * 1024) throw new Error('الملف أكبر من ٢٠ ميغابايت');
  if (m.thumb && String(m.thumb).length > 40000) m.thumb = '';
  if (m.data && JSON.stringify(m.data).length > 200000) throw new Error('العنصر أكبر من المسموح');
  var fileId = null, size = 0;
  if (b64) {
    var bytes = Utilities.base64Decode(b64); size = bytes.length;
    var blob = Utilities.newBlob(bytes, clip_(m.mime || 'application/octet-stream', 80), clip_(m.name || 'file', 120));
    fileId = sub_(m.kind === 'font' ? 'fonts' : 'assets').createFile(blob).getId();
  }
  return withLock_(function () {
    var reg = regName_(scope, a.uid), list = readJson_(reg, []), old = null;
    if (m.id) list.forEach(function (x) { if (x.id === m.id) old = x; });
    if (old && old.owner !== a.uid && !(scope !== 'user' && canWriteScope_(a, old.scope, old.program))) throw new Error('هذا الأصل ليس لك');
    var x = old || { id: uid_(), at: now_(), owner: a.uid, ownerName: a.name, ver: 0 };
    if (old && fileId && old.fileId) { try { DriveApp.getFileById(old.fileId).setTrashed(true); } catch (e) {} }
    x.kind = m.kind; x.name = clip_(m.name, 120); x.mime = clip_(m.mime, 80); x.scope = scope; x.program = scope === 'program' ? m.program : '';
    if (fileId) { x.fileId = fileId; x.size = size; }
    x.key = clip_(m.key, 60); x.ver = (x.ver || 0) + 1; x.upd = now_();
    if (m.kind === 'font') { x.family = clip_(m.family || m.name, 60); x.label = clip_(m.label || x.family, 60); x.weight = clip_(m.weight || '400', 12); x.style = m.style === 'italic' ? 'italic' : 'normal'; x.ui = !!m.ui && isSuper_(a); x.wrange = clip_(m.wrange, 12); }
    x.thumb = m.thumb || ''; x.data = m.data || null; x.tags = clip_(m.tags, 120);
    if (!old) list.unshift(x);
    writeJson_(reg, list);
    if (scope !== 'user') audit_(a, old ? 'حدّث أصلاً' : 'رفع أصلاً', (m.kind === 'font' ? 'خط ' : '') + x.name + (x.program ? ' · ' + x.program : ''));
    return JSON.stringify(assetPub_(x));
  });
}
function asset_get(token, id) {
  var a = auth_(token), f = findAsset_(id, a);
  if (!f || !canReadAsset_(a, f.x)) throw new Error('الأصل غير موجود');
  if (!f.x.fileId) return JSON.stringify({ meta: assetPub_(f.x), b64: '' });
  var blob = DriveApp.getFileById(f.x.fileId).getBlob();
  return JSON.stringify({ meta: assetPub_(f.x), b64: Utilities.base64Encode(blob.getBytes()) });
}
// عدة ملفات صغيرة في طلب واحد (أسرع في أول تحميل): {معرّف: محتوى}
function asset_batch(token, ids) {
  var a = auth_(token), out = {}, total = 0;
  (ids || []).slice(0, 30).forEach(function (id) {
    var f = findAsset_(id, a); if (!f || !canReadAsset_(a, f.x) || !f.x.fileId) return;
    if (total > 20 * 1024 * 1024) return;
    var b = Utilities.base64Encode(DriveApp.getFileById(f.x.fileId).getBlob().getBytes()); total += b.length; out[id] = b;
  });
  return JSON.stringify(out);
}
function asset_list(token, scope, program) {
  var a = auth_(token);
  if (scope === 'user') return JSON.stringify(readJson_('ua_' + a.uid + '.json', []).map(assetPub_));
  return JSON.stringify(readJson_('assets.json', []).filter(function (x) { return canReadAsset_(a, x) && (!program || x.program === program || x.scope === 'global'); }).map(assetPub_));
}
function asset_meta(token, json) {   // تعديل الاسم أو المفتاح أو الوسوم أو خط الواجهة دون رفع ملف
  var a = auth_(token), m = JSON.parse(json);
  return withLock_(function () {
    var f = findAsset_(m.id, a); if (!f) throw new Error('الأصل غير موجود');
    var x = f.x;
    if (!(x.owner === a.uid || canWriteScope_(a, x.scope, x.program))) throw new Error('لا تملك صلاحية التعديل');
    if (m.name != null) x.name = clip_(m.name, 120);
    if (m.key != null) x.key = clip_(m.key, 60);
    if (m.tags != null) x.tags = clip_(m.tags, 120);
    if (m.label != null && x.kind === 'font') x.label = clip_(m.label, 60);
    if (m.ui != null && x.kind === 'font' && isSuper_(a)) x.ui = !!m.ui;
    if (m.data != null) x.data = m.data;
    x.upd = now_(); x.ver = (x.ver || 1) + 1;
    var list = readJson_(f.reg, []).map(function (y) { return y.id === x.id ? x : y; });
    writeJson_(f.reg, list);
    return JSON.stringify(assetPub_(x));
  });
}
function asset_del(token, id) {
  var a = auth_(token);
  return withLock_(function () {
    var f = findAsset_(id, a); if (!f) return 'ok';
    var x = f.x;
    if (!(x.owner === a.uid && x.scope === 'user') && !canWriteScope_(a, x.scope, x.program)) throw new Error('لا تملك صلاحية الحذف');
    if (x.fileId) { try { DriveApp.getFileById(x.fileId).setTrashed(true); } catch (e) {} }
    writeJson_(f.reg, readJson_(f.reg, []).filter(function (y) { return y.id !== id; }));
    if (x.scope !== 'user') audit_(a, 'حذف أصلاً', x.name);
    return 'ok';
  });
}
// خطوط الواجهة: تُطلب قبل الدخول لتظهر صفحة الدخول بخط المنصة
function ui_fonts() { return JSON.stringify(readJson_('assets.json', []).filter(function (x) { return x.kind === 'font' && x.ui; }).map(assetPub_)); }
function ui_font_get(id) {
  var x = readJson_('assets.json', []).filter(function (y) { return y.id === id && y.kind === 'font' && y.ui; })[0];
  if (!x) throw new Error('غير موجود');
  return Utilities.base64Encode(DriveApp.getFileById(x.fileId).getBlob().getBytes());
}

/* ================= التصاميم والقوالب المحفوظة (index.json و i_<id>.json) ================= */
function keysOf_(a) { var k = ['a:' + a.uid]; if (a.legacyKey) k.push('u:' + a.legacyKey); return k; }
function itemProg_(x) { return x.program || 'academy'; }
function item_list(token, kind) {
  var a = auth_(token), mine = keysOf_(a);
  var list = readJson_('index.json', []).filter(function (x) {
    if (kind && (x.kind || 'tpl') !== kind) return false;
    if (mine.indexOf(x.ownerKey) >= 0) return true;
    return x.shared && inProg_(a, itemProg_(x));
  }).map(function (x) { var o = Object.assign({}, x); o.mine = mine.indexOf(x.ownerKey) >= 0; o.program = itemProg_(x); return o; });
  return JSON.stringify(list);
}
function item_get(token, id) {
  var a = auth_(token); id = safeId_(id);
  var f = itemFile_(id); if (!f) return 'null';
  var item = JSON.parse(text_(f)), mine = keysOf_(a).indexOf(item.ownerKey) >= 0;
  if (!mine && !(item.shared && inProg_(a, itemProg_(item))) && !adminOf_(a, itemProg_(item))) throw new Error('هذا التصميم ليس لك');
  item.mine = mine;
  return JSON.stringify(item);
}
function item_save(token, json) {
  if (String(json).length > 40 * 1024 * 1024) throw new Error('الملف أكبر من المسموح');
  var a = auth_(token), item = JSON.parse(json), id = safeId_(item.id);
  item.program = item.program || 'academy';
  if (!inProg_(a, item.program)) throw new Error('لست في هذا البرنامج');
  return withLock_(function () {
    var old = itemFile_(id), mine = keysOf_(a);
    if (old) { var prev = JSON.parse(text_(old)); if (prev.ownerKey && mine.indexOf(prev.ownerKey) < 0) throw new Error('لا يمكنك تعديل تصميم زميلك؛ احفظه نسخة لك'); }
    item.owner = a.name; item.ownerKey = 'a:' + a.uid; item.at = now_(); delete item.mine;
    var s = JSON.stringify(item);
    if (old) old.setContent(s); else dataFolder_().createFile('i_' + id + '.json', s, 'application/json');
    var list = readJson_('index.json', []).filter(function (x) { return x.id !== id; });
    list.unshift({ id: id, kind: item.kind || 'tpl', name: clip_(item.name, 80), owner: item.owner, ownerKey: item.ownerKey, shared: !!item.shared,
                   tpl: item.tpl, track: item.track, program: item.program, thumb: item.thumb, at: item.at });
    writeJson_('index.json', list);
    return JSON.stringify({ id: id });
  });
}
function item_del(token, id) {
  var a = auth_(token); id = safeId_(id);
  return withLock_(function () {
    var f = itemFile_(id), mine = keysOf_(a);
    if (f) { var item = JSON.parse(text_(f)); if (mine.indexOf(item.ownerKey) < 0 && !adminOf_(a, itemProg_(item))) throw new Error('هذا التصميم ليس لك'); f.setTrashed(true); }
    writeJson_('index.json', readJson_('index.json', []).filter(function (x) { return x.id !== id; }));
    return 'ok';
  });
}

/* ================= البلاغات والاقتراحات =================
   feedback.json: [{id, kind: bug|idea|q, text, page, tpl, track, program, ua, vw, errors, shot (معرّف ملف), uid, name, status: new|work|done|wont, reply, at, upd}] */
var FB_STATUS = { 'new': 'وصل', work: 'قيد العمل', done: 'تم', wont: 'لن يُنفّذ' };
function saveShot_(dataUrl) {
  if (!dataUrl || String(dataUrl).slice(0, 11) !== 'data:image/') return '';
  var m = String(dataUrl).match(/^data:(image\/\w+);base64,(.*)$/); if (!m || m[2].length > 4 * 1024 * 1024) return '';
  return sub_('shots').createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], 'shot_' + now_() + '.jpg')).getId();
}
function fb_store_(a, it) {
  var shot = saveShot_(it.shot);
  return withLock_(function () {
    var list = readJson_('feedback.json', []);
    var today = list.filter(function (x) { return x.at > now_() - 864e5; }).length;
    if (today > 300) throw new Error('بلاغات كثيرة اليوم، حاول غداً');
    var x = { id: uid_(), kind: ({ bug: 1, idea: 1, q: 1 })[it.kind] ? it.kind : 'bug', text: clip_(it.text, 4000), page: clip_(it.page, 200), tpl: clip_(it.tpl, 60),
      track: clip_(it.track, 40), program: clip_(it.program || (a && a.programs && a.programs[0]) || '', 40), ua: clip_(it.ua, 300), vw: clip_(it.vw, 20),
      errors: (it.errors || []).slice(0, 10).map(function (e) { return clip_(e, 400); }), shot: shot, v: it.v || 6,
      uid: a ? a.uid : '', name: a ? a.name : clip_(it.name || 'زائر', 60), status: 'new', reply: '', at: now_(), upd: now_() };
    list.unshift(x); if (list.length > 3000) list.length = 3000;
    writeJson_('feedback.json', list);
    return JSON.stringify({ id: x.id });
  });
}
// الإصدار الخامس: يُقبل البلاغ حتى بلا دخول (باسم المرسل إن وُجد)
function api_feedback(token, json) {
  var it = JSON.parse(json), a = null, legacy = null;
  if (token) { legacy = userByToken_(readJson_('users.json', {}), token); }
  if (legacy) it.name = legacy.u.name;
  return fb_store_(a, it);
}
function fb_send(token, json) { var a = auth_(token); return fb_store_(a, JSON.parse(json)); }
function fb_mine(token) {
  var a = auth_(token);
  return JSON.stringify(readJson_('feedback.json', []).filter(function (x) { return x.uid === a.uid; }).slice(0, 50).map(function (x) { var o = Object.assign({}, x); delete o.ua; delete o.errors; return o; }));
}
function fb_list(token, status) {
  var a = auth_(token); needAdmin_(a);
  return JSON.stringify(readJson_('feedback.json', []).filter(function (x) {
    if (status && x.status !== status) return false;
    return isSuper_(a) || (x.program && adminOf_(a, x.program));
  }).slice(0, 500));
}
function fb_update(token, id, status, reply) {
  var a = auth_(token); needAdmin_(a);
  if (status && !FB_STATUS[status]) throw new Error('حالة غير معروفة');
  return withLock_(function () {
    var list = readJson_('feedback.json', []), hit = null;
    list.forEach(function (x) { if (x.id === id) hit = x; });
    if (!hit) throw new Error('غير موجود');
    if (!isSuper_(a) && !(hit.program && adminOf_(a, hit.program))) throw new Error('لا تملك صلاحية');
    if (status) hit.status = status; if (reply != null) hit.reply = clip_(reply, 1000); hit.upd = now_(); hit.by = a.name;
    writeJson_('feedback.json', list);
    return JSON.stringify(hit);
  });
}
function fb_shot(token, id) {
  var a = auth_(token); needAdmin_(a);
  var x = readJson_('feedback.json', []).filter(function (y) { return y.id === id; })[0];
  if (!x || !x.shot) return '';
  return 'data:image/jpeg;base64,' + Utilities.base64Encode(DriveApp.getFileById(x.shot).getBlob().getBytes());
}

/* ================= الإحصاءات =================
   stats_YYYY-MM.json: { days: { 'YYYY-MM-DD': { برنامج: {ev: {}, tpl: {}, tool: {}, users: {uid: n}} } } }
   أعداد فقط: لا نصوص ولا محتوى تصاميم */
function monthKey_(t) { return Utilities.formatDate(new Date(t), 'Asia/Riyadh', 'yyyy-MM'); }
function dayKey_(t) { return Utilities.formatDate(new Date(t), 'Asia/Riyadh', 'yyyy-MM-dd'); }
function bump_(o, k, n) { if (!k) return; k = clip_(k, 60); o[k] = (o[k] || 0) + (n || 1); }
function stat_track(token, json) {
  var a = auth_(token), evs = JSON.parse(json || '[]').slice(0, 200);
  if (!evs.length) return 'ok';
  return withLock_(function () {
    var t = now_(), name = 'stats_' + monthKey_(t) + '.json', st = readJson_(name, { days: {} }), dk = dayKey_(t);
    var day = st.days[dk] = st.days[dk] || {};
    evs.forEach(function (e) {
      var p = clip_(e.p || (a.programs || [])[0] || 'none', 30);
      if (p !== 'none' && !inProg_(a, p)) return;
      var d = day[p] = day[p] || { ev: {}, tpl: {}, tool: {}, users: {} };
      bump_(d.ev, e.e); if (e.tpl) bump_(d.tpl, e.tpl); if (e.tool) bump_(d.tool, e.tool); bump_(d.users, a.uid);
    });
    writeJson_(name, st);
    return 'ok';
  });
}
function stat_summary(token, days, program) {
  var a = auth_(token); needAdmin_(a);
  if (program && !adminOf_(a, program)) throw new Error('لا تملك صلاحية');
  var allowed = isSuper_(a) ? null : (a.programs || []).filter(function (p) { return adminOf_(a, p); });
  days = Math.max(1, Math.min(365, +days || 30));
  var t = now_(), from = t - days * 864e5, months = {}, out = { days: {}, ev: {}, tpl: {}, tool: {}, prog: {} }, users = {};
  for (var x = from; x <= t + 864e5; x += 864e5 * 25) months[monthKey_(x)] = 1;
  months[monthKey_(t)] = 1;
  function want(p) { return program ? p === program : (!allowed || allowed.indexOf(p) >= 0); }
  Object.keys(months).forEach(function (m) {
    var st = readJson_('stats_' + m + '.json', { days: {} });
    Object.keys(st.days).forEach(function (dk) {
      if (new Date(dk + 'T12:00:00Z').getTime() < from) return;
      var day = st.days[dk], row = { exports: 0, active: 0, saves: 0 }, act = {};
      Object.keys(day).forEach(function (p) {
        if (!want(p)) return;
        var d = day[p];
        Object.keys(d.ev).forEach(function (k) { bump_(out.ev, k, d.ev[k]); bump_(out.prog, p, d.ev[k]); });
        Object.keys(d.tpl).forEach(function (k) { bump_(out.tpl, k, d.tpl[k]); });
        Object.keys(d.tool).forEach(function (k) { bump_(out.tool, k, d.tool[k]); });
        Object.keys(d.users).forEach(function (u) { bump_(users, u, d.users[u]); act[u] = 1; });
        row.exports += d.ev['export'] || 0; row.saves += d.ev.save || 0;
      });
      row.active = Object.keys(act).length;
      if (row.active || row.exports) out.days[dk] = row;
    });
  });
  var accs = readJson_('accounts.json', {});
  out.top = Object.keys(users).sort(function (x, y) { return users[y] - users[x]; }).slice(0, 15).map(function (u) { return { name: accs[u] ? accs[u].name : '—', n: users[u] }; });
  out.nUsers = Object.keys(users).length;
  function inScope(progList) { return (progList || []).some(want); }
  out.totalAccounts = Object.keys(accs).filter(function (k) { return accs[k].role !== 'super' && inScope(accs[k].programs); }).length;
  var fb = readJson_('feedback.json', []); out.fbOpen = fb.filter(function (y) { return (y.status === 'new' || y.status === 'work') && want(y.program || 'none'); }).length;
  var idx = readJson_('index.json', []); out.saved = idx.filter(function (y) { return want(itemProg_(y)); }).length;
  out.shared = idx.filter(function (y) { return y.shared && want(itemProg_(y)); }).length;
  return JSON.stringify(out);
}

/* ================= رسائل الإدارة، وسجل التحديثات، والإعدادات ================= */
// broadcasts.json: [{id, title, body, kind: banner|modal|tip, programs: [] (فارغ = الجميع), from, until, by, at, active}]
function bc_list(token) {
  var a = auth_(token), t = now_();
  return JSON.stringify(readJson_('broadcasts.json', []).filter(function (b) {
    if (b.active === false || (b.until && b.until < t) || (b.from && b.from > t)) return false;
    return !b.programs || !b.programs.length || b.programs.some(function (p) { return inProg_(a, p); });
  }));
}
function bc_all(token) {
  var a = auth_(token); needAdmin_(a);
  return JSON.stringify(readJson_('broadcasts.json', []).filter(function (b) { return isSuper_(a) || (b.programs || []).some(function (p) { return adminOf_(a, p); }); }));
}
function bc_save(token, json) {
  var a = auth_(token); needAdmin_(a); var b = JSON.parse(json);
  if (!isSuper_(a)) { if (!b.programs || !b.programs.length) throw new Error('حدّد برنامجك'); b.programs.forEach(function (p) { if (!adminOf_(a, p)) throw new Error('لا تملك صلاحية على ' + p); }); }
  return withLock_(function () {
    var list = readJson_('broadcasts.json', []), cur = null;
    list.forEach(function (x) { if (x.id === b.id) cur = x; });
    if (!cur) { cur = { id: uid_(), at: now_() }; list.unshift(cur); }
    cur.title = clip_(b.title, 120); cur.body = clip_(b.body, 2000); cur.kind = ({ banner: 1, modal: 1, tip: 1 })[b.kind] ? b.kind : 'banner';
    cur.programs = (b.programs || []).slice(0, 20); cur.from = +b.from || 0; cur.until = +b.until || 0; cur.active = b.active !== false; cur.by = a.name; cur.upd = now_();
    cur.link = clip_(b.link, 300); cur.target = clip_(b.target, 120);
    writeJson_('broadcasts.json', list.slice(0, 300));
    audit_(a, 'نشر رسالة', cur.title);
    return JSON.stringify(cur);
  });
}
function bc_del(token, id) {
  var a = auth_(token); needAdmin_(a);
  return withLock_(function () {
    var list = readJson_('broadcasts.json', []).filter(function (x) { return !(x.id === id && (isSuper_(a) || (x.programs || []).every(function (p) { return adminOf_(a, p); }))); });
    writeJson_('broadcasts.json', list); return 'ok';
  });
}
// changelog.json: [{v, date, title, items: [{t, d}], major}]
function cl_list() { return JSON.stringify(readJson_('changelog.json', [])); }
function cl_save(token, json) {
  var a = auth_(token); if (!isSuper_(a)) throw new Error('للمدير العام');
  var list = JSON.parse(json);
  return withLock_(function () { writeJson_('changelog.json', list.slice(0, 200)); audit_(a, 'حدّث سجل التحديثات', (list[0] || {}).v || ''); return 'ok'; });
}
var DEFAULT_SETTINGS = { ai: { enabled: true, model: 'gemini-3.8-flash', perDay: 20 }, uploadsNeedPerm: false, maxUploadMb: 20 };
function settings_() { var s = readJson_('settings.json', {}); var o = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); Object.keys(s).forEach(function (k) { o[k] = s[k]; }); return o; }
function publicSettings_() { var s = settings_(); return { ai: { enabled: !!(s.ai && s.ai.enabled), perDay: s.ai ? s.ai.perDay : 0, ready: !!props_().getProperty('GEMINI_KEY') }, maxUploadMb: s.maxUploadMb }; }
function set_get(token) { var a = auth_(token); if (!isSuper_(a)) throw new Error('للمدير العام'); var s = settings_(); s.aiKey = !!props_().getProperty('GEMINI_KEY'); return JSON.stringify(s); }
function set_save(token, json) {
  var a = auth_(token); if (!isSuper_(a)) throw new Error('للمدير العام');
  var s = JSON.parse(json);
  return withLock_(function () {
    var cur = settings_();
    if (s.ai) cur.ai = { enabled: !!s.ai.enabled, model: clip_(s.ai.model || 'gemini-3.8-flash', 60), perDay: Math.max(0, Math.min(500, +s.ai.perDay || 0)) };
    if (s.uploadsNeedPerm != null) cur.uploadsNeedPerm = !!s.uploadsNeedPerm;
    if (s.maxUploadMb != null) cur.maxUploadMb = Math.max(1, Math.min(20, +s.maxUploadMb || 20));
    writeJson_('settings.json', cur); audit_(a, 'غيّر الإعدادات', ''); return JSON.stringify(cur);
  });
}
function audit_list(token) { var a = auth_(token); if (!isSuper_(a)) throw new Error('للمدير العام'); return JSON.stringify(readJson_('audit.json', []).slice(0, 500)); }

/* ================= «اصنع إعلانك» بالذكاء الاصطناعي (Gemini المجاني) =================
   المفتاح في خصائص المشروع باسم GEMINI_KEY، لا يصل إلى المتصفح أبداً.
   الطلب يصف الإعلان، والنموذج يعيد وصفاً منضبطاً بمخطط JSON تبنيه الواجهة تصميماً قابلاً للتعديل. */
function ai_status(token) {
  var a = auth_(token), s = settings_();
  var used = +(CacheService.getScriptCache().get('ai:' + a.uid + ':' + dayKey_(now_())) || 0);
  return JSON.stringify({ enabled: !!s.ai.enabled && !!props_().getProperty('GEMINI_KEY') && perm_(a, 'ai'), perDay: s.ai.perDay, used: used, allowed: perm_(a, 'ai') });
}
function ai_make(token, json) {
  var a = auth_(token), s = settings_();
  if (!s.ai.enabled) throw new Error('المساعد متوقف الآن');
  if (!perm_(a, 'ai')) throw new Error('المساعد يحتاج صلاحية من مشرف البرنامج');
  var key = props_().getProperty('GEMINI_KEY'); if (!key) throw new Error('لم يُضبط مفتاح المساعد بعد');
  var c = CacheService.getScriptCache(), ck = 'ai:' + a.uid + ':' + dayKey_(now_()), used = +(c.get(ck) || 0);
  if (!isSuper_(a) && used >= s.ai.perDay) throw new Error('بلغت حد اليوم (' + s.ai.perDay + ' طلباً). جرّب غداً.');
  var req = JSON.parse(json);   // {system, prompt, schema}
  var body = { contents: [{ role: 'user', parts: [{ text: clip_(req.prompt, 12000) }] }],
    systemInstruction: { parts: [{ text: clip_(req.system, 20000) }] },
    generationConfig: { responseMimeType: 'application/json', responseSchema: req.schema, temperature: req.temperature != null ? +req.temperature : 0.9 } };
  var model = String(s.ai.model || 'gemini-3.8-flash').replace(/[^\w.\-]/g, '');
  var res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(body), muteHttpExceptions: true, headers: { 'x-goog-api-key': key } });
  var code = res.getResponseCode(), txt = res.getContentText();
  if (code === 429) throw new Error('المساعد مشغول الآن (حد الخطة المجانية). حاول بعد دقيقة.');
  if (code >= 300) throw new Error('تعذّر الوصول إلى المساعد (' + code + ')');
  var j = JSON.parse(txt), part = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts;
  var out = (part || []).map(function (p) { return p.text || ''; }).join('');
  if (!out) throw new Error('لم يُعد المساعد نتيجة. أعد صياغة طلبك.');
  c.put(ck, String(used + 1), 90000);
  return out;
}

/* ================= الإصدار الخامس (يبقى حتى يكتمل الانتقال) ================= */
function api_ping() { return 'ok'; }
function api_packs() {
  var pf = filesIn_(IDS.packs);
  return JSON.stringify(Object.keys(pf).filter(function (n) { return /\.js$/i.test(n); }).sort().map(function (n) {
    return { name: n, at: pf[n].getLastUpdated().getTime(), code: text_(pf[n]) };
  }));
}
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
function safeId_(id) { id = String(id || ''); if (!/^[a-z0-9]{6,40}$/.test(id)) throw new Error('معرّف غير صحيح'); return id; }
function itemFile_(id) {
  var it = dataFolder_().getFilesByName('i_' + id + '.json');
  while (it.hasNext()) { var f = it.next(); if (!f.isTrashed()) return f; }
  return null;
}
function api_tpl_list(token) {
  var users = readJson_('users.json', {}), r = userByToken_(users, token);
  if (!r) return '[]';
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
    item.owner = r.u.name; item.ownerKey = me; item.program = item.program || 'academy';
    var s = JSON.stringify(item);
    if (old) old.setContent(s); else dataFolder_().createFile('i_' + id + '.json', s, 'application/json');
    var list = readJson_('index.json', []).filter(function (x) { return x.id !== id; });
    list.unshift({ id: id, kind: item.kind || 'tpl', name: String(item.name || '').slice(0, 80), owner: item.owner, ownerKey: me, shared: !!item.shared,
                   tpl: item.tpl, track: item.track, program: item.program, thumb: item.thumb, at: item.at });
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

/* ================= التهيئة الأولى =================
   شغّل bootstrap مرة واحدة من المحرر (اختر الدالة ثم «تشغيل»):
   ١) ينشئ حساب المدير العام (اسم المستخدم admin) ويطبع كلمة مروره المؤقتة في السجل
   ٢) ينشئ برنامج الأكاديمية بهوياته، وبرنامجي «عالم» و«مشروع العمر» فارغين
   ٣) ينقل الشعارات والصور وخطوط القوالب الحالية إلى درايف، ويضيف مكتبة الخطوط العربية المفتوحة
   ويمكن تشغيله مرة أخرى دون ضرر: لا يكرر ما أُنشئ. */
var SEED_IDENTITIES = [{"id": "judhoor", "group": "track", "name": "جذور", "full": "مسار جـذور", "desc": "المرحلة التأسيسية", "logo": "logo", "logos": null, "c": {"p": "#467839", "pd": "#2d4d24", "pl": "#68b251", "s": "#654b37", "sd": "#433125", "sdd": "#33251c", "a": "#fbb03b", "a2": "#f99229", "paper": "#f8f8f8", "warm": "#ebe7e1", "ink": "#2b2b2b", "muted": "#8d8d8d", "teal": "#0e423e", "tealL": "#4b9d97"}}, {"id": "ishraq", "group": "track", "name": "إشراق", "full": "مسار إشـراق", "desc": "البرتقالي الدافئ والورق الوردي", "logo": "lg_ishraq", "logos": null, "c": {"p": "#f4793d", "pd": "#bc450b", "pl": "#f8a57a", "s": "#8a3a12", "sd": "#5e2509", "sdd": "#3b1a0b", "a": "#fbb03b", "a2": "#e8642a", "paper": "#fff8f4", "warm": "#fdebe1", "ink": "#2b2b2b", "muted": "#8d8d8d", "teal": "#1f4f4b", "tealL": "#5fa9a3"}}, {"id": "budhoor", "group": "track", "name": "بذور", "full": "مسار بـذور", "desc": "البنفسجي والبرتقالي", "logo": "lg_budhoor", "logos": null, "c": {"p": "#672e8f", "pd": "#451e5f", "pl": "#9a62c2", "s": "#d9661e", "sd": "#9a4210", "sdd": "#2a1340", "a": "#faa854", "a2": "#f68b1f", "paper": "#faf8fc", "warm": "#efe9f3", "ink": "#2b2b2b", "muted": "#8d8d8d", "teal": "#1c2a45", "tealL": "#6f7fa8"}}, {"id": "ithmar", "group": "track", "name": "إثمار", "full": "مسار إثـمار", "desc": "العنابي والبرتقالي", "logo": "lg_ithmar", "logos": [["lg_ithmar", "بلا رقم"], ["lg_ithmar2", "الدفعة ٢"], ["lg_ithmar3", "الدفعة ٣"]], "c": {"p": "#8a1e50", "pd": "#571435", "pl": "#c0557f", "s": "#8f5a74", "sd": "#5a3046", "sdd": "#3a1626", "a": "#fa9020", "a2": "#f26b21", "paper": "#f9f5f6", "warm": "#efe6ea", "ink": "#2b2b2b", "muted": "#8d8d8d", "teal": "#2f3a52", "tealL": "#7d8fb0"}}, {"id": "sanabel", "group": "track", "name": "سنابل", "full": "مسار سنـابل", "desc": "البنفسجي الرمادي والأخضر الفاتح", "logo": "lg_sanabel", "logos": null, "c": {"p": "#5a5881", "pd": "#3b3a5c", "pl": "#8a88b5", "s": "#7d8f3e", "sd": "#55632a", "sdd": "#262540", "a": "#c5d36f", "a2": "#93a642", "paper": "#f8f8fa", "warm": "#ecebf2", "ink": "#2b2b2b", "muted": "#8d8d8d", "teal": "#2f3d3a", "tealL": "#7a9a8e"}}, {"id": "anshita", "group": "act", "name": "الأنشطة التربوية", "full": "الأنشطة التربوية", "desc": "هوية الأنشطة العامة", "logo": "lg_anshita", "logos": null, "c": {"p": "#16817a", "pd": "#0e5753", "pl": "#4bb0a8", "s": "#512c62", "sd": "#3b1f48", "sdd": "#2a1534", "a": "#f7931e", "a2": "#f45905", "paper": "#f8f8f8", "warm": "#eceae6", "ink": "#2b2b2b", "muted": "#8d8d8d", "teal": "#0d4f4b", "tealL": "#4b9d97"}}, {"id": "tiryaq", "group": "act", "name": "ترياق", "full": "ترياق ٧", "desc": "الأخضر المزرق والليل", "logo": "lg_tiryaq", "logos": [["lg_tiryaq", "ترياق"], ["lg_risala", "مع حملة الرسالة"]], "c": {"p": "#2f7a70", "pd": "#1e4f49", "pl": "#7fb3a9", "s": "#3a4152", "sd": "#2c3242", "sdd": "#1d2230", "a": "#f2a33a", "a2": "#e0782f", "paper": "#f1f2ef", "warm": "#e4e8e4", "ink": "#2b2b2b", "muted": "#8d8d8d", "teal": "#1d2e40", "tealL": "#5d7f8c"}}, {"id": "multaqa", "group": "act", "name": "الملتقى الجامعي", "full": "الملتقى الجامعي", "desc": "الموفي والكريمي", "logo": "lg_multaqa", "logos": null, "c": {"p": "#855970", "pd": "#5c3a4d", "pl": "#b58da2", "s": "#6b5560", "sd": "#4a3540", "sdd": "#2e2028", "a": "#e8a25b", "a2": "#c96f3b", "paper": "#f6efea", "warm": "#efe1d8", "ink": "#2b2b2b", "muted": "#8d8d8d", "teal": "#3b2d40", "tealL": "#8a7090"}}, {"id": "rifaq", "group": "act", "name": "رفاق الأنشطة", "full": "رفاق الأنشطة", "desc": "الكحلي والعنابي والذهبي", "logo": "lg_rifaq", "logos": null, "c": {"p": "#2a8a84", "pd": "#1c424b", "pl": "#7cc0bb", "s": "#981b47", "sd": "#6e1233", "sdd": "#14323a", "a": "#fbb03b", "a2": "#e9883b", "paper": "#fafafa", "warm": "#f1ece4", "ink": "#2b2b2b", "muted": "#8d8d8d", "teal": "#1c424b", "tealL": "#5f9aa2"}}, {"id": "academy", "group": "act", "name": "الأكاديمية", "full": "أكاديمية الجيل الصاعد", "desc": "للإعلانات العامة", "logo": "lg_academy", "logos": null, "c": {"p": "#16817a", "pd": "#0e5753", "pl": "#4bb0a8", "s": "#512c62", "sd": "#3b1f48", "sdd": "#24122e", "a": "#f7931e", "a2": "#c70d3a", "paper": "#f8f8f8", "warm": "#eceae6", "ink": "#2b2b2b", "muted": "#8d8d8d", "teal": "#0d4f4b", "tealL": "#4b9d97"}}];
var SEED_ASSETS = [   // [المفتاح، المسار في المستودع، النوع، الاسم]
  ['logo', 'img/logo.png', 'logo', 'شعار جذور'], ['academy', 'img/academy.png', 'logo', 'شعار البرنامج في التذييل'], ['social', 'img/social.png', 'logo', 'حسابات التواصل'],
  ['img_dome', 'img/img_dome.webp', 'photo', 'قبة'], ['img_mosque', 'img/img_mosque.webp', 'photo', 'مسجد'], ['img_quran', 'img/img_quran.webp', 'photo', 'مصحف'], ['img_arch', 'img/img_arch.webp', 'photo', 'قوس'],
  ['lg_ishraq', 'logos/ishraq.webp', 'logo', 'إشراق'], ['lg_budhoor', 'logos/budhoor.webp', 'logo', 'بذور'], ['lg_ithmar', 'logos/ithmar.webp', 'logo', 'إثمار'],
  ['lg_ithmar2', 'logos/ithmar2.webp', 'logo', 'إثمار الدفعة ٢'], ['lg_ithmar3', 'logos/ithmar3.webp', 'logo', 'إثمار الدفعة ٣'], ['lg_sanabel', 'logos/sanabel.webp', 'logo', 'سنابل'],
  ['lg_tiryaq', 'logos/tiryaq.webp', 'logo', 'ترياق'], ['lg_risala', 'logos/risala.webp', 'logo', 'مع حملة الرسالة'], ['lg_multaqa', 'logos/multaqa.webp', 'logo', 'الملتقى'],
  ['lg_rifaq', 'logos/rifaq.webp', 'logo', 'رفاق'], ['lg_anshita', 'logos/anshita.webp', 'logo', 'الأنشطة التربوية'], ['lg_arwah', 'logos/arwah.webp', 'logo', 'أرواح'],
  ['lg_mark', 'logos/mark.webp', 'logo', 'علامة الأكاديمية'], ['lg_academy', 'logos/academy_full.webp', 'logo', 'الأكاديمية']
];
// خطوط القوالب الحالية (ضمن برنامج الأكاديمية)، وخطوط عربية مفتوحة الترخيص للجميع
var SEED_FONTS = [
  ['academy', 'tajarib', 'تجارب', 'fonts/tj_Light.woff2', '300'], ['academy', 'tajarib', 'تجارب', 'fonts/tj_Regular.woff2', '400'], ['academy', 'tajarib', 'تجارب', 'fonts/tj_Medium.woff2', '500'],
  ['academy', 'tajarib', 'تجارب', 'fonts/tj_Bold.woff2', '700'], ['academy', 'tajarib', 'تجارب', 'fonts/tj_Black.woff2', '900'], ['academy', 'handi', 'الحرف اليدوية', 'fonts/hc.woff2', '400']
];
var GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl/';
var OPEN_FONTS = [["tajawal", "تجوال", "tajawal/Tajawal-Light.ttf", "300", "s"], ["tajawal", "تجوال", "tajawal/Tajawal-Regular.ttf", "400", "s"], ["tajawal", "تجوال", "tajawal/Tajawal-Medium.ttf", "500", "s"], ["tajawal", "تجوال", "tajawal/Tajawal-Bold.ttf", "700", "s"], ["tajawal", "تجوال", "tajawal/Tajawal-ExtraBold.ttf", "800", "s"], ["tajawal", "تجوال", "tajawal/Tajawal-Black.ttf", "900", "s"], ["zain", "زين", "zain/Zain-Light.ttf", "300", "s"], ["zain", "زين", "zain/Zain-Regular.ttf", "400", "s"], ["zain", "زين", "zain/Zain-Bold.ttf", "700", "s"], ["zain", "زين", "zain/Zain-ExtraBold.ttf", "800", "s"], ["zain", "زين", "zain/Zain-Black.ttf", "900", "s"], ["plexar", "بلكس العربي", "ibmplexsansarabic/IBMPlexSansArabic-Light.ttf", "300", "s"], ["plexar", "بلكس العربي", "ibmplexsansarabic/IBMPlexSansArabic-Regular.ttf", "400", "s"], ["plexar", "بلكس العربي", "ibmplexsansarabic/IBMPlexSansArabic-Medium.ttf", "500", "s"], ["plexar", "بلكس العربي", "ibmplexsansarabic/IBMPlexSansArabic-SemiBold.ttf", "600", "s"], ["plexar", "بلكس العربي", "ibmplexsansarabic/IBMPlexSansArabic-Bold.ttf", "700", "s"], ["almarai", "المراعي", "almarai/Almarai-Light.ttf", "300", "s"], ["almarai", "المراعي", "almarai/Almarai-Regular.ttf", "400", "s"], ["almarai", "المراعي", "almarai/Almarai-Bold.ttf", "700", "s"], ["almarai", "المراعي", "almarai/Almarai-ExtraBold.ttf", "800", "s"], ["amiri", "أميري", "amiri/Amiri-Regular.ttf", "400", "s"], ["amiri", "أميري", "amiri/Amiri-Bold.ttf", "700", "s"], ["ruqaa", "عارف رقعة", "arefruqaa/ArefRuqaa-Regular.ttf", "400", "s"], ["ruqaa", "عارف رقعة", "arefruqaa/ArefRuqaa-Bold.ttf", "700", "s"], ["lalezar", "لاله‌زار", "lalezar/Lalezar-Regular.ttf", "400", "s"], ["beiruti", "بيروتي", "beiruti/Beiruti%5Bwght%5D.ttf", "200 900", "v"], ["alexandria", "الإسكندرية", "alexandria/Alexandria%5Bwght%5D.ttf", "100 900", "v"], ["readex", "ريدكس", "readexpro/ReadexPro%5BHEXP%2Cwght%5D.ttf", "160 700", "v"], ["kufi", "نوتو كوفي", "notokufiarabic/NotoKufiArabic%5Bwght%5D.ttf", "100 900", "v"], ["cairo", "القاهرة", "cairo/Cairo%5Bslnt%2Cwght%5D.ttf", "200 1000", "v"], ["changa", "تشانجا", "changa/Changa%5Bwght%5D.ttf", "200 800", "v"], ["messiri", "المسيري", "elmessiri/ElMessiri%5Bwght%5D.ttf", "400 700", "v"], ["reemkufi", "ريم كوفي", "reemkufi/ReemKufi%5Bwght%5D.ttf", "400 700", "v"], ["marhey", "مرحى", "marhey/Marhey%5Bwght%5D.ttf", "300 700", "v"], ["lemonada", "ليمونادة", "lemonada/Lemonada%5Bwght%5D.ttf", "300 700", "v"], ["naskh", "نوتو نسخ", "notonaskharabic/NotoNaskhArabic%5Bwght%5D.ttf", "400 700", "v"], ["baloo", "بالو بهايجان", "baloobhaijaan2/BalooBhaijaan2%5Bwght%5D.ttf", "400 800", "v"], ["vazir", "وزير متن", "vazirmatn/Vazirmatn%5Bwght%5D.ttf", "100 900", "v"], ["rubik", "روبيك", "rubik/Rubik%5Bwght%5D.ttf", "300 900", "v"], ["handjet", "هاندجت", "handjet/Handjet%5BELGR%2CELSH%2Cwght%5D.ttf", "100 900", "v"]];
function bootstrap() {
  JC = {};
  var log = [];
  // ١) المدير العام
  var accs = readJson_('accounts.json', {});
  if (!Object.keys(accs).some(function (k) { return accs[k].role === 'super'; })) {
    var temp = tempPass_(), salt = Utilities.getUuid(), a = { uid: uid_(), username: 'admin', email: '', name: 'مدير المنصة', role: 'super', programs: [], perms: {},
      salt: salt, hash: pwHash_(salt, temp), mustChange: true, created: now_(), last: 0, fails: 0, prefs: {} };
    accs[a.uid] = a; writeJson_('accounts.json', accs);
    log.push('حساب المدير العام: اسم المستخدم admin — كلمة المرور المؤقتة: ' + temp + '  (ستُطلب كلمة جديدة عند أول دخول)');
  } else log.push('المدير العام موجود.');
  // ٢) البرامج
  var progs = progs_();
  function addProg(p) { if (!progs.some(function (x) { return x.id === p.id; })) { progs.push(p); log.push('أُنشئ برنامج: ' + p.name); } }
  addProg({ id: 'academy', name: 'أكاديمية الجيل الصاعد', desc: 'المسارات والأنشطة التربوية', color: '#16817a', order: 1, active: true, features: { social: true, slides: true, ai: true }, identities: SEED_IDENTITIES, created: now_() });
  addProg({ id: 'alim', name: 'برنامج عالم', desc: 'هويته تُضاف من لوحة الإدارة', color: '#24405e', order: 2, active: true, features: { social: true, slides: true, ai: true }, identities: [], created: now_() });
  addProg({ id: 'omr', name: 'مشروع العمر', desc: 'هويته تُضاف من لوحة الإدارة', color: '#7a3b3b', order: 3, active: true, features: { social: true, slides: true, ai: true }, identities: [], created: now_() });
  writeJson_('programs.json', progs);
  // ٣) الأصول
  var reg = readJson_('assets.json', []), have = {};
  reg.forEach(function (x) { have[(x.program || '') + '|' + (x.key || x.name) + '|' + (x.weight || '')] = 1; });
  function fetchTo(url, mime, name, folder) {
    var r = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) { log.push('تعذّر جلب ' + url + ' (' + r.getResponseCode() + ')'); return null; }
    var bytes = r.getBlob().getBytes();
    return { id: sub_(folder).createFile(Utilities.newBlob(bytes, mime, name)).getId(), size: bytes.length };
  }
  SEED_ASSETS.forEach(function (s) {
    if (have['academy|' + s[0] + '|']) return;
    var mime = /\.png$/.test(s[1]) ? 'image/png' : 'image/webp', f = fetchTo(SEED_BASE + s[1], mime, s[1].split('/').pop(), 'assets');
    if (!f) return;
    reg.push({ id: uid_(), key: s[0], kind: s[2], name: s[3], mime: mime, size: f.size, scope: 'program', program: 'academy', owner: '', ownerName: 'النظام', fileId: f.id, at: now_(), ver: 1 });
  });
  SEED_FONTS.forEach(function (s) {
    if (have[s[0] + '|' + s[1] + '|' + s[4]]) return;
    var f = fetchTo(SEED_BASE + s[3], 'font/woff2', s[3].split('/').pop(), 'fonts'); if (!f) return;
    reg.push({ id: uid_(), key: s[1], kind: 'font', family: s[1], label: s[2], weight: s[4], style: 'normal', name: s[2] + ' ' + s[4], mime: 'font/woff2', size: f.size, scope: 'program', program: s[0], owner: '', ownerName: 'النظام', fileId: f.id, at: now_(), ver: 1 });
  });
  OPEN_FONTS.forEach(function (s) {   // [المعرّف، الاسم، المسار في google/fonts، الوزن أو المدى، نوع: v متغير]
    if (have['|' + s[0] + '|' + s[3]]) return;
    var mime = 'font/ttf', f = fetchTo(GF + s[2], mime, s[2].split('/').pop(), 'fonts'); if (!f) return;
    reg.push({ id: uid_(), key: s[0], kind: 'font', family: s[0], label: s[1], weight: s[3], wrange: s[4] === 'v' ? s[3] : '', style: 'normal', name: s[1] + ' ' + s[3], mime: mime, size: f.size, scope: 'global', program: '', owner: '', ownerName: 'النظام', fileId: f.id, at: now_(), ver: 1 });
  });
  writeJson_('assets.json', reg);
  log.push('الأصول المسجلة: ' + reg.length);
  // ٤) سجل التحديثات الأول
  if (!readJson_('changelog.json', []).length) writeJson_('changelog.json', [{ v: VERSION, date: dayKey_(now_()), title: 'منصة الأثر الإعلامي', major: true, items: [
    { t: 'منصة واحدة لكل البرامج', d: 'لكل برنامج هويته وقوالبه، وكل مستخدم يرى برنامجه.' },
    { t: 'محرر جديد', d: 'حجم ولون وخط مستقل لكل عنصر، وتعديل النص بالنقر المزدوج، وتحريك مقيّد بزر Shift.' },
    { t: 'اصنع إعلانك بالذكاء', d: 'اكتب فكرتك، فيقترح المساعد تصاميم قابلة للتعديل.' },
    { t: 'البلاغات والاقتراحات', d: 'أرسل ملاحظتك من أي صفحة، وتابع حالتها.' }] }]);
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'makePreviews') ScriptApp.deleteTrigger(t); if (t.getHandlerFunction() === 'warmCache') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('makePreviews').timeBased().everyHours(1).create();
  console.log(log.join('\n'));
  return log.join('\n');
}
// إن نسي المدير العام كلمة مروره: شغّل هذه الدالة فتُطبع كلمة مؤقتة جديدة لحساب admin
function resetAdmin() {
  JC = {};
  var accs = readJson_('accounts.json', {}), a = findAcc_(accs, 'admin');
  if (!a) { console.log('لا يوجد حساب admin. شغّل bootstrap.'); return; }
  var temp = tempPass_(); a.salt = Utilities.getUuid(); a.hash = pwHash_(a.salt, temp); a.mustChange = true; a.disabled = false; a.fails = 0; a.lockUntil = 0;
  writeJson_('accounts.json', accs);
  console.log('كلمة المرور المؤقتة الجديدة لحساب admin: ' + temp);
}

/* ---------- مساعدة المهمة الأسبوعية: معاينات خفيفة للتصاميم الجديدة ---------- */
function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'makePreviews') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('makePreviews').timeBased().everyHours(1).create();
  makePreviews();
}
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
// مسح رمز مربٍ نسيه (الإصدار الخامس)
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
