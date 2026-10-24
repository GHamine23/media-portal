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
    item_list: item_list, item_get: item_get, item_save: item_save, item_del: item_del, item_model: item_model,
    arc_put: arc_put, arc_list: arc_list, arc_get: arc_get, arc_thumbs: arc_thumbs, pack_list: pack_list, pack_put: pack_put, pack_toggle: pack_toggle,
    fb_send: fb_send, fb_list: fb_list, fb_update: fb_update, fb_mine: fb_mine, fb_shot: fb_shot,
    stat_track: stat_track, stat_summary: stat_summary,
    bc_list: bc_list, bc_all: bc_all, bc_save: bc_save, bc_del: bc_del,
    cl_list: cl_list, cl_save: cl_save, set_get: set_get, set_save: set_save, audit_list: audit_list,
    ai_make: ai_make, ai_test: ai_test, ai_status: ai_status, ai_log: ai_log,
    tg_test: tg_test, tg_send: tg_send, tg_queue: tg_queue, tg_cancel: tg_cancel, tg_update: tg_update, tg_requeue: tg_requeue, tg_thumbs: tg_thumbs, tg_discover: tg_discover, tg_chat_check: tg_chat_check, tg_known: tg_known,
    task_list: task_list, task_save: task_save, task_done: task_done, task_del: task_del, me_profile: me_profile, font_family: font_family,
    img_search: img_search, img_test: img_test, img_pick: img_pick,
    cm_list: cm_list, cm_add: cm_add, cm_del: cm_del, cm_counts: cm_counts, nt_list: nt_list, nt_seen: nt_seen,
    rv_request: rv_request, rv_list: rv_list, rv_mine: rv_mine, rv_img: rv_img, rv_reply: rv_reply,
    me_week: me_week, wk_admin: wk_admin, ai_skills: ai_skills, ai_skill_save: ai_skill_save, ai_skill_reset: ai_skill_reset, img_requests: img_requests, img_decide: img_decide, quran_find: quran_find, hadith_find: hadith_find
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
var PERMS = ['social', 'ai', 'upload', 'fonts', 'slides', 'send'];
// درجة التعديل في القوالب: content المحتوى فقط، style المحتوى والمظهر، full كامل. الفارغة = درجة البرنامج
var EDIT_LEVELS = { content: 1, style: 1, full: 1 };   // صلاحيات قابلة للمنح لكل حساب
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
    mustChange: !!a.mustChange, disabled: !!a.disabled, created: a.created, last: a.last || 0, legacy: !!a.legacyKey, note: a.note || '',
    tracks: a.tracks || [], editLevel: a.editLevel || '', hasAvatar: !!a.hasAvatar };
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
  var av = a.hasAvatar ? (readJson_('avatars.json', {})[a.uid] || '') : '';
  return Object.assign(publicAcc_(a), { prefs: a.prefs || {}, programsInfo: progs, roleName: ROLES[a.role] || '', avatar: av });
}
// المستخدم يغيّر اسمه الظاهر وصورته (صورة صغيرة تُحفظ في avatars.json)
function me_profile(token, json) {
  var a0 = auth_(token), o = JSON.parse(json);
  if (o.avatar && !/^data:image\/(jpeg|png|webp);base64,/.test(o.avatar)) throw new Error('صورة غير صحيحة');
  if (o.avatar && o.avatar.length > 120000) throw new Error('الصورة أكبر من المسموح');
  return withLock_(function () {
    var accs = readJson_('accounts.json', {}), a = accs[a0.uid];
    if (o.name != null) { var n = clip_(String(o.name).trim(), 60); if (n.length < 2) throw new Error('الاسم قصير'); a.name = n; }
    if (o.avatar != null) {
      var av = readJson_('avatars.json', {});
      if (o.avatar) { av[a.uid] = o.avatar; a.hasAvatar = true; } else { delete av[a.uid]; a.hasAvatar = false; }
      writeJson_('avatars.json', av);
    }
    writeJson_('accounts.json', accs);
    return JSON.stringify(meOf_(a));
  });
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
    if (o.tracks) a.tracks = o.tracks.filter(function (t) { return /^[a-z0-9_\-]{2,30}$/.test(t); }).slice(0, 60);   // فارغة = كل هويات برامجه
    if (o.editLevel != null) a.editLevel = EDIT_LEVELS[o.editLevel] ? o.editLevel : '';
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
    var fam = function (x) { return /^[\w\-. ]{1,60}$/.test(x); };
    if (p.fontsId) cur.fontsId = p.fontsId.filter(fam).slice(0, 40);   // خطوط هوية البرنامج
    if (p.block) cur.block = { fonts: (p.block.fonts || []).filter(fam).slice(0, 200), logos: (p.block.logos || []).map(function (k) { return clip_(k, 60); }).slice(0, 200) };   // ما لا يظهر لمستخدمي البرنامج
    if (p.editLevel != null) cur.editLevel = EDIT_LEVELS[p.editLevel] ? p.editLevel : 'full';
    if (p.fonts) cur.fonts = { title: clip_(p.fonts.title, 60), body: clip_(p.fonts.body, 60) };
    if (p.tg) { var chats = {}; Object.keys(p.tg.chats || {}).forEach(function (k) { var v = clip_(String(p.tg.chats[k] || '').trim(), 80); if (v) chats[clip_(k, 40)] = v; }); cur.tg = { chat: clip_(String(p.tg.chat || '').trim(), 80), chats: chats, link: clip_(p.tg.link, 300), hashtag: clip_(String(p.tg.hashtag || '').replace(/^#/, ''), 60), sign: clip_(p.tg.sign, 120), capPrompt: clip_(p.tg.capPrompt != null ? p.tg.capPrompt : ((cur.tg || {}).capPrompt || ''), 4000), titles: (function (t) { var o = {}; Object.keys(t || {}).forEach(function (k) { var v = clip_(String(t[k] || '').trim(), 80); if (v) o[clip_(k, 80)] = v; }); return o; })(p.tg.titles || (cur.tg || {}).titles) }; }
    if (p.captions) cur.captions = p.captions.slice(0, 40).map(function (c) { return { id: clip_(c.id || uid_(), 20), name: clip_(c.name, 60), kind: clip_(c.kind || 'ann', 20), text: clip_(c.text, 2000) }; });
    if (p.samples != null) cur.samples = clip_(p.samples, 30000);   // نماذج رسائل البرنامج التي يتعلم منها المساعد
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
  if (x.credit) o.credit = x.credit;
  if (x.tags) o.tags = x.tags;
  return o;
}
function regName_(scope, uid) { return scope === 'user' ? 'ua_' + uid + '.json' : 'assets.json'; }
// أصول المستخدم معرّفها «<معرّف صاحبها>_<عشوائي>»، فيُعرف سجلها من المعرّف نفسه
function findAsset_(id, a) {
  id = String(id || '');
  var own = id.indexOf('_') > 0 ? id.split('_')[0] : '';
  if (own && /^[a-f0-9]{8,32}$/.test(own)) {
    var r = 'ua_' + own + '.json', m0 = readJson_(r, []);
    for (var k = 0; k < m0.length; k++) if (m0[k].id === id) return { x: m0[k], reg: r };
    return null;
  }
  var g = readJson_('assets.json', []);
  for (var i = 0; i < g.length; i++) if (g[i].id === id) return { x: g[i], reg: 'assets.json' };
  if (a) { var m = readJson_('ua_' + a.uid + '.json', []); for (var j = 0; j < m.length; j++) if (m[j].id === id) return { x: m[j], reg: 'ua_' + a.uid + '.json' }; }
  return null;
}
// صور المستخدم تُقرأ لمن يعرف معرّفها (يصله من تصميم مشترك أو نموذج أو الأرشيف)، والمعرّف عشوائي لا يُخمَّن. وخطوطه الشخصية له وحده
function canReadAsset_(a, x) { return x.scope === 'global' || (x.scope === 'program' && inProg_(a, x.program)) || (x.scope === 'user' && (x.owner === a.uid || x.kind !== 'font')); }
function canWriteScope_(a, scope, program) {
  if (scope === 'global') return isSuper_(a);
  if (scope === 'program') return adminOf_(a, program);
  return true;
}
var KINDS = { image: 1, logo: 1, element: 1, font: 1, photo: 1, video: 1, audio: 1 };
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
    var x = old || { id: scope === 'user' ? a.uid + '_' + uid_() : uid_(), at: now_(), owner: a.uid, ownerName: a.name, ver: 0 };
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
// نطاق عائلة خط كاملة: لكل البرامج أو لبرنامج واحد (المدير العام)
function font_family(token, json) {
  var a = auth_(token), o = JSON.parse(json);
  if (!isSuper_(a)) throw new Error('للمدير العام');
  var scope = o.scope === 'program' ? 'program' : 'global', prog = scope === 'program' ? clip_(o.program, 30) : '';
  if (scope === 'program' && !progs_().some(function (p) { return p.id === prog; })) throw new Error('البرنامج غير موجود');
  return withLock_(function () {
    var list = readJson_('assets.json', []), n = 0;
    list.forEach(function (x) { if (x.kind === 'font' && x.family === o.family && !x.ui) { x.scope = scope; x.program = prog; x.ver = (x.ver || 1) + 1; n++; } });
    if (!n) throw new Error('الخط غير موجود');
    writeJson_('assets.json', list);
    audit_(a, 'غيّر نطاق خط', o.family + ' → ' + (prog || 'كل البرامج'));
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
    return (x.shared || x.model) && inProg_(a, itemProg_(x));
  }).map(function (x) { var o = Object.assign({}, x); o.mine = mine.indexOf(x.ownerKey) >= 0; o.program = itemProg_(x); delete o.ownerKey; return o; });
  return JSON.stringify(list);
}
function item_get(token, id) {
  var a = auth_(token); id = safeId_(id);
  var f = itemFile_(id); if (!f) return 'null';
  var item = JSON.parse(text_(f)), mine = keysOf_(a).indexOf(item.ownerKey) >= 0;
  if (!mine && !((item.shared || item.model) && inProg_(a, itemProg_(item))) && !adminOf_(a, itemProg_(item))) throw new Error('هذا التصميم ليس لك');
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
    var prev = old ? JSON.parse(text_(old)) : null, coedit = false;
    if (prev && prev.ownerKey && mine.indexOf(prev.ownerKey) < 0) {
      // زميل يعدّل تصميماً مشتركاً سمح صاحبه بتعديله: يبقى التصميم لصاحبه ويُسجَّل من عدّله
      if (!(prev.shared && prev.coedit && inProg_(a, itemProg_(prev)))) throw new Error('لا يمكنك تعديل تصميم زميلك؛ احفظه نسخة لك');
      coedit = true;
    }
    if (coedit) { item.owner = prev.owner; item.ownerKey = prev.ownerKey; item.shared = true; item.coedit = true; item.editedBy = a.name; }
    else { item.owner = a.name; item.ownerKey = 'a:' + a.uid; item.coedit = !!item.coedit && !!item.shared; }
    item.at = now_(); delete item.mine;
    item.model = !!(prev || {}).model;   // النموذج يغيّره المشرف من «اجعله نموذجاً» فقط
    var s = JSON.stringify(item);
    if (old) old.setContent(s); else dataFolder_().createFile('i_' + id + '.json', s, 'application/json');
    var list = readJson_('index.json', []).filter(function (x) { return x.id !== id; });
    list.unshift({ id: id, kind: item.kind || 'tpl', name: clip_(item.name, 80), owner: item.owner, ownerKey: item.ownerKey, shared: !!item.shared, model: item.model, coedit: !!item.coedit, editedBy: item.editedBy || '',
                   tpl: item.tpl, track: item.track, program: item.program, thumb: item.thumb, at: item.at });
    writeJson_('index.json', list);
    return JSON.stringify({ id: id });
  });
}
function prev0_(f) { if (!f) return null; try { return JSON.parse(text_(f)); } catch (e) { return null; } }
// نموذج البرنامج: تصميم يختاره المشرف فيظهر لكل مستخدمي البرنامج نقطةَ بداية (يفتحونه نسخة لهم)
function item_model(token, id, on) {
  var a = auth_(token); id = safeId_(id);
  return withLock_(function () {
    var f = itemFile_(id); if (!f) throw new Error('التصميم غير موجود');
    var item = JSON.parse(text_(f));
    if (!adminOf_(a, itemProg_(item))) throw new Error('النماذج لمشرف البرنامج والمدير');
    item.model = !!on; f.setContent(JSON.stringify(item));
    writeJson_('index.json', readJson_('index.json', []).map(function (x) { if (x.id === id) x.model = !!on; return x; }));
    audit_(a, on ? 'جعل تصميماً نموذجاً' : 'أزال نموذجاً', clip_(item.name, 80) + ' · ' + itemProg_(item));
    return 'ok';
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

/* ================= أرشيف التصاميم: كل تصميم يُنزَّل أو يُشارَك أو يُحفظ =================
   arc_YYYY-MM.json: [{id, name, kind, tpl, tplName, track, trackName, program, size, pages, uid, uname, at, upd, n, via, vias, item, sf, tf}]
   sf ملف حالة التصميم كاملة (يُفتح بها في المحرر بجودته الأصلية)، و tf معاينة للتصفح. الملفات في المجلد الفرعي archive */
var ARC_VIA = { png: 'PNG', jpg: 'JPG', pdf: 'PDF', share: 'مشاركة', save: 'حفظ' };
function arcName_(m) { return 'arc_' + m + '.json'; }
function arc_put(token, metaJson, stateJson, thumb) {
  var a = auth_(token), m = JSON.parse(metaJson), prog = m.program || 'academy';
  if (!inProg_(a, prog)) throw new Error('لست في هذا البرنامج');
  if (String(stateJson).length > 40 * 1024 * 1024) throw new Error('التصميم أكبر من المسموح');
  var mk = /^\d{4}-\d{2}$/.test(m.m || '') ? m.m : monthKey_(now_());
  var dir = sub_('archive'), sf = dir.createFile('ar_' + now_() + '.json', String(stateJson), 'application/json').getId(), tf = '';
  var tm = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(thumb || '');
  if (tm) tf = dir.createFile(Utilities.newBlob(Utilities.base64Decode(tm[2]), tm[1], 'pv_' + now_() + '.jpg')).getId();
  var trash = [];
  var res = withLock_(function () {
    var name = arcName_(mk), list = readJson_(name, []), x = null;
    if (m.id) list.forEach(function (y) { if (y.id === m.id && y.uid === a.uid) x = y; });
    if (!x) {
      x = { id: uid_(), uid: a.uid, at: now_(), n: 0, vias: {} }; list.unshift(x);
      var months = readJson_('arc_months.json', []); if (months.indexOf(mk) < 0) { months.unshift(mk); months.sort().reverse(); writeJson_('arc_months.json', months); }
    }
    if (x.sf) trash.push(x.sf); if (x.tf && tf) trash.push(x.tf);
    function set(k, n) { if (m[k] != null && m[k] !== '') x[k] = clip_(m[k], n); else if (x[k] == null) x[k] = ''; }
    x.uname = a.name; set('name', 80); set('tpl', 60); set('tplName', 80); set('track', 40); set('trackName', 60); set('size', 20); set('item', 40);
    if (m.kind) x.kind = m.kind === 'deck' ? 'deck' : 'design'; else x.kind = x.kind || 'design';
    x.program = prog; if (m.pages) x.pages = +m.pages || 1; else x.pages = x.pages || 1; x.sf = sf; if (tf) x.tf = tf; x.upd = now_(); x.n = (x.n || 0) + 1;
    var v = ARC_VIA[m.via] ? m.via : 'png'; x.via = v; x.vias = x.vias || {}; x.vias[v] = (x.vias[v] || 0) + 1;
    writeJson_(name, list);
    return { id: x.id, m: mk };
  });
  trash.forEach(function (fid) { try { DriveApp.getFileById(fid).setTrashed(true); } catch (e) {} });   // النسخة الأقدم من نفس التصميم (تُستعاد من سلة درايف)
  return JSON.stringify(res);
}
function arcVisible_(a, x) { return adminOf_(a, x.program); }
function arc_list(token, m, program) {
  var a = auth_(token); needAdmin_(a);
  var months = readJson_('arc_months.json', []);
  m = /^\d{4}-\d{2}$/.test(m || '') ? m : (months[0] || monthKey_(now_()));
  var list = readJson_(arcName_(m), []).filter(function (x) { return arcVisible_(a, x) && (!program || x.program === program); })
    .map(function (x) { var o = Object.assign({}, x); delete o.sf; delete o.tf; o.pv = !!x.tf; return o; });
  return JSON.stringify({ m: m, months: months, list: list });
}
function arcFind_(a, m, id) {
  if (!/^\d{4}-\d{2}$/.test(m || '')) throw new Error('شهر غير صحيح');
  var x = readJson_(arcName_(m), []).filter(function (y) { return y.id === id; })[0];
  if (!x || !(arcVisible_(a, x) || x.uid === a.uid)) throw new Error('غير موجود في الأرشيف');
  return x;
}
function arc_get(token, m, id) {
  var a = auth_(token), x = arcFind_(a, m, id);
  var o = Object.assign({}, x); delete o.sf; delete o.tf;
  return JSON.stringify({ meta: o, state: text_(DriveApp.getFileById(x.sf)) });
}
function arc_thumbs(token, m, ids) {
  var a = auth_(token); needAdmin_(a);
  var list = readJson_(arcName_(m), []), out = {};
  (ids || []).slice(0, 40).forEach(function (id) {
    var x = list.filter(function (y) { return y.id === id; })[0];
    if (!x || !x.tf || !arcVisible_(a, x)) return;
    try { out[id] = Utilities.base64Encode(DriveApp.getFileById(x.tf).getBlob().getBytes()); } catch (e) {}
  });
  return JSON.stringify(out);
}

/* ================= حزم القوالب: يرفعها المدير العام من اللوحة، أو المهمة الأسبوعية إلى درايف ================= */
function packsOff_() { return settings_().packsOff || []; }
function pack_list(token) {
  var a = auth_(token); if (!isSuper_(a)) throw new Error('للمدير العام');
  var pf = filesIn_(IDS.packs), off = packsOff_();
  return JSON.stringify(Object.keys(pf).filter(function (n) { return /\.js$/i.test(n); }).sort().map(function (n) {
    return { name: n, at: pf[n].getLastUpdated().getTime(), size: pf[n].getSize(), on: off.indexOf(n) < 0 };
  }));
}
function pack_put(token, name, code) {
  var a = auth_(token); if (!isSuper_(a)) throw new Error('رفع حزم القوالب للمدير العام');
  name = String(name || '').trim().replace(/[^\w\-. ]/g, '_');
  if (!/\.js$/i.test(name)) name += '.js';
  if (String(code).length > 15 * 1024 * 1024) throw new Error('الحزمة أكبر من المسموح');
  if (!/PACK\s*\(/.test(code)) throw new Error('هذا ليس ملف حزمة قوالب (لا يحوي PACK)');
  DriveApp.getFolderById(IDS.packs).createFile(name, String(code), 'text/javascript');   // اسم موجود ← نسخة أحدث، والقديمة تبقى في المجلد
  withLock_(function () { audit_(a, 'رفع حزمة قوالب', name); });
  return 'ok';
}
function pack_toggle(token, name, on) {
  var a = auth_(token); if (!isSuper_(a)) throw new Error('للمدير العام');
  return withLock_(function () {
    var st = readJson_('settings.json', {}), off = (st.packsOff || []).filter(function (n) { return n !== name; });
    if (!on) off.push(clip_(name, 120));
    st.packsOff = off; writeJson_('settings.json', st);
    audit_(a, on ? 'شغّل حزمة' : 'أوقف حزمة', name);
    return 'ok';
  });
}

/* ================= البلاغات والاقتراحات =================
   feedback.json: [{id, kind: bug|idea|q, text, page, tpl, track, program, ua, vw, errors, shot (معرّف ملف), uid, name, status: new|work|done|wont, reply, at, upd}] */
var FB_STATUS = { 'new': 'وصل', work: 'قيد العمل', done: 'تم', wont: 'لن يُنفّذ' };
function saveShot_(dataUrl) {
  if (!dataUrl || String(dataUrl).slice(0, 11) !== 'data:image/') return '';
  var m = String(dataUrl).match(/^data:(image\/\w+);base64,(.*)$/); if (!m || m[2].length > 14 * 1024 * 1024) return '';
  return sub_('shots').createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], 'shot_' + now_() + '.jpg')).getId();
}
function fb_store_(a, it) {
  var shot = saveShot_(it.shot), imgs = (it.imgs || []).slice(0, 4).map(saveShot_).filter(Boolean);
  return withLock_(function () {
    var list = readJson_('feedback.json', []);
    var today = list.filter(function (x) { return x.at > now_() - 864e5; }).length;
    if (today > 300) throw new Error('بلاغات كثيرة اليوم، حاول غداً');
    var x = { id: uid_(), kind: ({ bug: 1, idea: 1, q: 1 })[it.kind] ? it.kind : 'bug', text: clip_(it.text, 4000), page: clip_(it.page, 200), tpl: clip_(it.tpl, 60),
      track: clip_(it.track, 40), program: clip_(it.program || (a && a.programs && a.programs[0]) || '', 40), ua: clip_(it.ua, 300), vw: clip_(it.vw, 20),
      errors: (it.errors || []).slice(0, 10).map(function (e) { return clip_(e, 400); }), shot: shot, imgs: imgs, v: it.v || 6,
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
function fb_shot(token, id, i) {
  var a = auth_(token);
  var x = readJson_('feedback.json', []).filter(function (y) { return y.id === id; })[0];
  if (!x) return '';
  if (x.uid !== a.uid) { needAdmin_(a); if (!isSuper_(a) && !(x.program && adminOf_(a, x.program))) throw new Error('لا تملك صلاحية'); }
  var fid = i == null || i === '' ? x.shot : (x.imgs || [])[+i];
  return fid ? fileDataUrl_(fid) : '';
}
function fileDataUrl_(fid) { var b = DriveApp.getFileById(fid).getBlob(); return 'data:' + (b.getContentType() || 'image/jpeg') + ';base64,' + Utilities.base64Encode(b.getBytes()); }

/* ================= الإحصاءات =================
   stats_YYYY-MM.json: { days: { 'YYYY-MM-DD': { برنامج: {ev: {}, tpl: {}, tool: {}, users: {uid: n}} } } }
   أعداد فقط: لا نصوص ولا محتوى تصاميم */
function tz_() { try { return Session.getScriptTimeZone() || 'Asia/Riyadh'; } catch (e) { return 'Asia/Riyadh'; } }
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
      var ue = (d.uev = d.uev || {})[a.uid] = (d.uev || {})[a.uid] || {}; bump_(ue, e.e); if (e.tool) bump_(ue, 't:' + e.tool); if (e.tpl) bump_(ue, 'p:' + e.tpl);
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
// مفاتيح Gemini: مفتاح أساسي GEMINI_KEY وأي عدد من المفاتيح الإضافية في GEMINI_KEYS (من حسابات جوجل أخرى)، تتناوب وتتبادل عند نفاد حصة أحدها
function geminiKeys_() {
  var p = props_(), list = (String(p.getProperty('GEMINI_KEYS') || '') + '\n' + String(p.getProperty('GEMINI_KEY') || '')).split(/[\s,;]+/).map(function (k) { return k.trim(); }).filter(function (k) { return /^[\w\-]{20,}$/.test(k); });
  var seen = {}; return list.filter(function (k) { if (seen[k]) return false; seen[k] = true; return true; });
}
function hasGemini_() { return geminiKeys_().length > 0; }
function aiAny_(s) { var h = aiHave_(); return !!(h.gemini || h.groq || h.cf || (s.ai && s.ai.pollFallback !== false)); }
function publicSettings_() { var s = settings_(); return { ai: { enabled: !!(s.ai && s.ai.enabled), perDay: s.ai ? s.ai.perDay : 0, ready: aiAny_(s), vision: hasGemini_(), capPrompt: (s.ai && s.ai.capPrompt) || '' }, maxUploadMb: s.maxUploadMb, tg: !!props_().getProperty('TG_TOKEN'), pexels: true, imgKeys: { pixabay: !!props_().getProperty('PIXABAY_KEY'), pexels: !!props_().getProperty('PEXELS_KEY') }, tgKnown: (s.tgKnown || []).length }; }
function set_get(token) { var a = auth_(token); if (!isSuper_(a)) throw new Error('للمدير العام'); var s = settings_(); s.aiKey = hasGemini_(); s.aiKeys = geminiKeys_().length; s.tgOn = !!props_().getProperty('TG_TOKEN'); s.pexelsOn = !!props_().getProperty('PEXELS_KEY'); s.pixabayOn = !!props_().getProperty('PIXABAY_KEY'); s.groqOn = !!props_().getProperty('GROQ_KEY'); s.cfOn = !!(props_().getProperty('CF_ACCOUNT') && props_().getProperty('CF_TOKEN')); s.routeDefault = AI_ROUTE_DEFAULT; return JSON.stringify(s); }
function set_save(token, json) {
  var a = auth_(token); if (!isSuper_(a)) throw new Error('للمدير العام');
  var s = JSON.parse(json);
  return withLock_(function () {
    var cur = settings_();
    if (s.ai) cur.ai = { enabled: !!s.ai.enabled, model: clip_(s.ai.model || 'gemini-3.8-flash', 60), fallback: clip_(s.ai.fallback != null ? s.ai.fallback : 'gemini-3.6-flash,gemini-3.5-flash-lite', 120), light: clip_(s.ai.light != null ? s.ai.light : 'gemini-3.5-flash-lite', 60), groqModel: clip_(s.ai.groqModel || 'openai/gpt-oss-120b', 60), cfModel: clip_(s.ai.cfModel || '@cf/openai/gpt-oss-120b', 80), route: (function (r) { var o = {}; Object.keys(r || {}).forEach(function (k) { if (r[k] === 'groq' || r[k] === 'gemini') o[clip_(k, 20)] = r[k]; }); return o; })(s.ai.route), perDay: Math.max(0, Math.min(500, +s.ai.perDay || 0)), pollFallback: s.ai.pollFallback !== false, capPrompt: clip_(s.ai.capPrompt != null ? s.ai.capPrompt : (cur.ai.capPrompt || ''), 4000) };
    // مفاتيح Gemini الإضافية: يلصقها المدير (لا تُعرض بعد الحفظ). سطر أو فاصلة بين كل مفتاح وآخر. نص فارغ يحذفها، و«keep» يبقيها
    if (s.geminiKeys != null && s.geminiKeys !== 'keep') { var gks = String(s.geminiKeys).split(/[\s,;]+/).map(function (k) { return k.trim(); }).filter(function (k) { return /^[\w\-]{20,}$/.test(k); }); if (gks.length) props_().setProperty('GEMINI_KEYS', gks.join('\n')); else props_().deleteProperty('GEMINI_KEYS'); }
    if (s.uploadsNeedPerm != null) cur.uploadsNeedPerm = !!s.uploadsNeedPerm;
    if (s.maxUploadMb != null) cur.maxUploadMb = Math.max(1, Math.min(20, +s.maxUploadMb || 20));
    if (s.tgToken != null) { var tk = String(s.tgToken).trim(); if (tk) { if (!/^\d+:[\w-]{30,}$/.test(tk)) throw new Error('رمز البوت غير صحيح'); props_().setProperty('TG_TOKEN', tk); } else props_().deleteProperty('TG_TOKEN'); }
    if (s.sendNeedsApproval != null) cur.sendNeedsApproval = !!s.sendNeedsApproval;
    // Cloudflare Workers AI (اختياري): رقم الحساب ورمز API يلصقهما المدير. نص فارغ يحذفهما
    if (s.cfAccount != null) { var ca = String(s.cfAccount).trim(); if (ca) { if (!/^[a-f0-9]{32}$/i.test(ca)) throw new Error('رقم حساب Cloudflare غير صحيح (٣٢ حرفاً)'); props_().setProperty('CF_ACCOUNT', ca); } else props_().deleteProperty('CF_ACCOUNT'); }
    if (s.cfToken != null) { var ct = String(s.cfToken).trim(); if (ct) props_().setProperty('CF_TOKEN', ct); else props_().deleteProperty('CF_TOKEN'); }
    if (s.groqKey != null) { var gk = String(s.groqKey).trim(); if (gk) props_().setProperty('GROQ_KEY', gk); else props_().deleteProperty('GROQ_KEY'); }
    if (s.pixabayKey != null) { var pbk = String(s.pixabayKey).trim(); if (pbk) props_().setProperty('PIXABAY_KEY', pbk); else props_().deleteProperty('PIXABAY_KEY'); }
    if (s.imgProvider != null) cur.imgProvider = ['pixabay', 'pexels', 'openverse'].indexOf(s.imgProvider) >= 0 ? s.imgProvider : '';
    if (s.pexelsKey != null) { var pk = String(s.pexelsKey).trim(); if (pk) props_().setProperty('PEXELS_KEY', pk); else props_().deleteProperty('PEXELS_KEY'); }
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
  return JSON.stringify({ enabled: !!s.ai.enabled && aiAny_(s) && perm_(a, 'ai'), perDay: s.ai.perDay, used: used, allowed: perm_(a, 'ai') });
}

// نداء Gemini الأساسي (يستعمله ai_make والتقارير الأسبوعية). يسجّل كل طلب في ailog

/* ---------- توزيع المهام بين المساعدين ----------
   Gemini يرى الصور ويكتب العربية أجود، فهو للتصميم والمراجعة. Groq نصي سريع لا يحتفظ بالبيانات، فهو للمهام الخفيفة.
   Cloudflare Workers AI اختياري (حصة يومية مجانية، لا يُدرَّب على البيانات). Pollinations بلا مفتاح ملاذاً أخيراً للنصوص.
   كل طلب يمرّ على سلسلة: المساعد المختار للمهمة ← البقية المتاحة ← Pollinations. وما يُطلب بمخطط JSON يُتحقق منه ويُصلح، فإن فسد انتقلنا إلى التالي. */
var AI_ROUTE_DEFAULT = { intake: 'groq', caption: 'groq', outline: 'groq', imgq: 'groq', week: 'groq', weekly: 'groq', design: 'gemini', creative: 'gemini', spell: 'groq', review: 'gemini', refine: 'groq', brief: 'groq' };
// المهام الخفيفة: نموذج Gemini الخفيف (حصته أكبر) وتفكير قليل، وجهد استدلال منخفض في Groq
var AI_FAST = { intake: 1, caption: 1, spell: 1, imgq: 1, outline: 1, week: 1, weekly: 1, refine: 1, brief: 1 };
function aiRoute_(kind) { var s = settings_(), r = (s.ai && s.ai.route) || {}; return r[kind] || AI_ROUTE_DEFAULT[kind] || 'gemini'; }
function aiHave_() { var p = props_(); return { gemini: hasGemini_(), groq: !!p.getProperty('GROQ_KEY'), cf: !!(p.getProperty('CF_ACCOUNT') && p.getProperty('CF_TOKEN')) }; }
function aiChain_(req) {
  var have = aiHave_(), textOnly = !(req.files || []).length;
  if (!textOnly) return have.gemini ? ['gemini'] : [];
  var order = [aiRoute_(req.kind), 'gemini', 'groq', 'cf'].filter(function (p, i, a) { return have[p] && a.indexOf(p) === i; });
  if (settings_().ai.pollFallback !== false) order.push('poll');
  return order;
}
// الاسم باقٍ للتوافق: كل نداءات المساعد تمرّ من هنا
function geminiCall_(req, who) {
  var chain = aiChain_(req), first = '';
  if (!chain.length) throw new Error((req.files || []).length ? 'هذه المهمة تحتاج مفتاح Gemini (يرى الصور)؛ لم يُضبط بعد' : 'لم يُضبط مفتاح المساعد بعد');
  for (var i = 0; i < chain.length; i++) {
    try {
      if (chain[i] === 'gemini') return geminiOnly_(req, who);
      if (chain[i] === 'groq') return groqCall_(req, who);
      if (chain[i] === 'cf') return cfCall_(req, who);
      return pollCall_(req, who, first);
    } catch (e) { if (/صلاحية|متوقف|حد اليوم/.test(e.message)) throw e; if (!first) first = e.message; }
  }
  throw new Error(first || 'تعذّر الوصول إلى المساعد');
}
// قراءة JSON من نص النموذج وإصلاحه: أسوار الشيفرة، والفواصل الزائدة، والحقول المطلوبة الناقصة، والأنواع
function aiJson_(txt, schema) {
  var s = String(txt || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  var a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('أعاد المساعد نتيجة غير صالحة');
  s = s.slice(a, b + 1);
  var o;
  try { o = JSON.parse(s); }
  catch (e) { try { o = JSON.parse(s.replace(/,\s*([}\]])/g, '$1').replace(/[“”]/g, '"')); } catch (e2) { throw new Error('أعاد المساعد نتيجة غير صالحة (JSON)'); } }
  if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('أعاد المساعد نتيجة غير صالحة');
  return JSON.stringify(aiShape_(o, schema));
}
function aiEmpty_(sc) { var t = String(sc && sc.type || '').toUpperCase(); return t === 'ARRAY' ? [] : t === 'OBJECT' ? aiShape_({}, sc) : t === 'NUMBER' || t === 'INTEGER' ? 0 : t === 'BOOLEAN' ? false : ''; }
function aiShape_(v, sc) {
  if (!sc || typeof sc !== 'object') return v;
  var t = String(sc.type || '').toUpperCase();
  if (t === 'OBJECT') {
    if (!v || typeof v !== 'object' || Array.isArray(v)) v = {};
    var props = sc.properties || {}, req = sc.required || [];
    Object.keys(props).forEach(function (k) {
      if (v[k] === null || v[k] === undefined) { if (req.indexOf(k) >= 0) v[k] = aiEmpty_(props[k]); else delete v[k]; }
      else v[k] = aiShape_(v[k], props[k]);
    });
    return v;
  }
  if (t === 'ARRAY') { if (!Array.isArray(v)) v = v == null ? [] : [v]; return v.filter(function (x) { return x != null; }).map(function (x) { return aiShape_(x, sc.items); }); }
  if (t === 'STRING') { v = typeof v === 'string' ? v : typeof v === 'object' ? JSON.stringify(v) : String(v); return sc.enum && sc.enum.indexOf(v) < 0 ? '' : v; }
  if (t === 'NUMBER' || t === 'INTEGER') { var n = +v; return isFinite(n) ? n : 0; }
  if (t === 'BOOLEAN') return !!v;
  return v;
}
// تحويل مخطط Gemini (OBJECT/STRING…) إلى JSON Schema المعتاد
function toJsonSchema_(sc) {
  if (!sc || typeof sc !== 'object') return sc;
  var o = {}; Object.keys(sc).forEach(function (k) {
    var v = sc[k];
    if (k === 'type' && typeof v === 'string') o.type = v.toLowerCase();
    else if (k === 'properties') { o.properties = {}; Object.keys(v).forEach(function (p) { o.properties[p] = toJsonSchema_(v[p]); }); }
    else if (k === 'items') o.items = toJsonSchema_(v);
    else if (k !== 'propertyOrdering' && k !== 'nullable') o[k] = v;
  });
  return o;
}
// المخطط الصارم (Groq strict): كل الحقول مطلوبة، والاختياري يقبل null، ولا حقول زائدة
function strictSchema_(j) {
  if (!j || typeof j !== 'object') return j;
  if (j.type === 'object' && j.properties) {
    var req = j.required || [], o = { type: 'object', properties: {}, required: Object.keys(j.properties), additionalProperties: false };
    Object.keys(j.properties).forEach(function (k) { var p = strictSchema_(j.properties[k]); if (req.indexOf(k) < 0 && typeof p.type === 'string') { p = Object.assign({}, p, { type: [p.type, 'null'] }); if (p.enum) p.enum = p.enum.concat([null]); } o.properties[k] = p; });
    return o;
  }
  if (j.type === 'array' && j.items) return Object.assign({}, j, { items: strictSchema_(j.items) });
  return j;
}
function canStrict_(sc) { var walk = function (j) { if (!j || typeof j !== 'object') return true; if (j.type === 'object') return !!j.properties && Object.keys(j.properties).every(function (k) { return walk(j.properties[k]); }); if (j.type === 'array') return walk(j.items); return true; }; return !!(sc && sc.type === 'object' && walk(sc)); }
// نداء موحّد لكل خدمة تتبع صيغة OpenAI (Groq وCloudflare وPollinations)
function oaiCall_(cfg, req, who, why) {
  var sys = clip_(req.system, 30000), schemaIn = cfg.fmt === 'prompt' || cfg.fmt === 'object';
  if (req.schema && schemaIn) sys += '\n\nأعد JSON فقط يطابق هذا المخطط بدقة: ' + JSON.stringify(toJsonSchema_(req.schema));
  var body = { model: cfg.model, temperature: req.temperature != null ? +req.temperature : 0.8, messages: [{ role: 'system', content: sys }, { role: 'user', content: clip_(req.prompt, 60000) }] };
  var js = req.schema ? toJsonSchema_(req.schema) : null, strict = !!(js && cfg.fmt === 'schema' && cfg.strictOk && canStrict_(js));
  if (js && cfg.fmt === 'schema') body.response_format = { type: 'json_schema', json_schema: { name: 'athar', strict: strict, schema: strict ? strictSchema_(js) : js } };
  else if (js && cfg.fmt === 'object') body.response_format = { type: 'json_object' };
  // نماذج gpt-oss تفكّر قبل الجواب: جهد منخفض يكفي للكتابة ويوفّر الوقت والحصة (Pollinations المجاني يقطع الجواب عند ١٥٠٠ رمز)
  if (cfg.reasoning) { body.reasoning_effort = req.kind === 'outline' || req.kind === 'review' ? 'medium' : 'low'; if (cfg.hideReasoning) body.include_reasoning = false; }
  var t0 = now_(), log = { t: t0, uid: who.uid, name: who.name, program: clip_(req.program || '', 30), kind: clip_(req.kind || 'design', 20), inChars: String(req.prompt || '').length, files: 0, model: cfg.tag, ok: false, ms: 0, outChars: 0, err: '', q: clip_(String(req.prompt || '').replace(/\s+/g, ' '), 140) };
  if (why) log.fallbackFrom = clip_(why, 80);
  var out = '';
  try {
    for (var attempt = 0; attempt < 3; attempt++) {
      var res = UrlFetchApp.fetch(cfg.url, { method: 'post', contentType: 'application/json', payload: JSON.stringify(body), muteHttpExceptions: true, headers: cfg.key ? { Authorization: 'Bearer ' + cfg.key } : {} });
      var code = res.getResponseCode();
      // المخطط الصارم قد يُرفض لبعض الصيغ: نعيد بلا صرامة
      if (code === 400 && strict) { strict = false; body.response_format.json_schema = { name: 'athar', strict: false, schema: js }; continue; }
      if (code === 400 && body.reasoning_effort) { delete body.reasoning_effort; delete body.include_reasoning; continue; }
      if ((code === 429 || code >= 500) && attempt === 0 && cfg.retry) { Utilities.sleep(1500); continue; }
      if (code >= 300) throw new Error('تعذّر الوصول إلى ' + cfg.label + ' (' + code + ')');
      var j = JSON.parse(res.getContentText()), m = j.choices && j.choices[0] && j.choices[0].message;
      out = m && (typeof m.content === 'string' ? m.content : (m.content || []).map(function (p) { return p.text || ''; }).join('')) || '';
      break;
    }
    if (!out) throw new Error('لم يُعد ' + cfg.label + ' نتيجة');
    if (req.schema) out = aiJson_(out, req.schema);
    log.ok = true; log.outChars = out.length;
  } catch (e) { log.err = clip_(String(e && e.message || e), 160); }
  log.ms = now_() - t0; aiLog_(log);
  if (!log.ok) throw new Error(log.err);
  return out;
}
function pollCall_(req, who, why) {
  return oaiCall_({ url: 'https://text.pollinations.ai/openai', model: 'openai', tag: 'pollinations', label: 'المساعد الاحتياطي', fmt: 'object', reasoning: true }, req, who, why || '');
}
function groqCall_(req, who) {
  var key = props_().getProperty('GROQ_KEY'); if (!key) throw new Error('لم يُضبط مفتاح Groq');
  var s = settings_(), model = String((s.ai && s.ai.groqModel) || 'openai/gpt-oss-120b').replace(/[^\w.\-\/]/g, '');
  return oaiCall_({ url: 'https://api.groq.com/openai/v1/chat/completions', key: key, model: model, tag: 'groq:' + model, label: 'Groq', fmt: 'schema', strictOk: /gpt-oss|qwen/.test(model), reasoning: /gpt-oss/.test(model), hideReasoning: true, retry: true }, req, who);
}
function cfCall_(req, who) {
  var p = props_(), acc = String(p.getProperty('CF_ACCOUNT') || '').replace(/[^\w]/g, ''), key = p.getProperty('CF_TOKEN'); if (!acc || !key) throw new Error('لم يُضبط Cloudflare');
  var s = settings_(), model = String((s.ai && s.ai.cfModel) || '@cf/openai/gpt-oss-120b').replace(/[^\w.\-\/@]/g, '');
  return oaiCall_({ url: 'https://api.cloudflare.com/client/v4/accounts/' + acc + '/ai/v1/chat/completions', key: key, model: model, tag: 'cf:' + model.replace('@cf/', ''), label: 'Cloudflare', fmt: 'prompt', reasoning: /gpt-oss/.test(model), retry: true }, req, who);
}

// نداء Gemini وحده (مع إعادة المحاولة والنماذج الاحتياطية)
// أي المفاتيح نبدأ به؟ تناوب دائري بين المفاتيح لتوزيع الحمل، وتخطّي ما بلغ حدّه (مسجّل في الذاكرة المؤقتة)
function geminiKeyOrder_(keys, model) {
  var c = CacheService.getScriptCache(), i = (+(c.get('gk_rr') || 0)) % keys.length; try { c.put('gk_rr', String(i + 1), 21600); } catch (e) {}
  var order = []; for (var k = 0; k < keys.length; k++) order.push(keys[(i + k) % keys.length]);
  var fresh = order.filter(function (key) { return !c.get('gk_bad:' + model + ':' + keyTag_(key)); });
  return fresh.length ? fresh : order;   // إن بدت كلها محجوبة نجرّبها على كل حال (قد يكون الحجب انتهى)
}
function keyTag_(key) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, key)).slice(0, 10); }
function geminiMarkBad_(key, model, txt) {
  // حد الدقيقة: نحجبه ٦٥ ثانية. حد اليوم: حتى منتصف الليل بتوقيت المحيط الهادئ (حيث تُصفَّر حصة جوجل)، وأقصى الذاكرة ٦ ساعات
  var daily = /PerDay|per day|daily|quota exceeded for metric.*day/i.test(txt || ''), ttl = daily ? 21600 : 65;
  try { CacheService.getScriptCache().put('gk_bad:' + model + ':' + keyTag_(key), '1', ttl); } catch (e) {}
}
function geminiOnly_(req, who) {
  var s = settings_(), keys = geminiKeys_(); if (!keys.length) throw new Error('لم يُضبط مفتاح المساعد بعد');
  var parts = [{ text: clip_(req.prompt, 60000) }];
  (req.files || []).slice(0, 3).forEach(function (f) { if (f && f.b64 && /^(application\/pdf|image\/(png|jpeg|webp)|text\/plain)$/.test(f.mime || '') && f.b64.length < 28 * 1024 * 1024) parts.push({ inlineData: { mimeType: f.mime, data: f.b64 } }); });
  // المهام الخفيفة (فهم الفكرة، النص المصاحب، التصحيح، كلمات الصور، المخطط، تقرير الأسبوع، التعديل) على نموذج حصته اليومية أكبر،
  // والتصميم والمراجعة على النموذج الأقوى. الحصة المجانية لكل مشروع جوجل ولكل نموذج على حدة.
  var model = String((AI_FAST[req.kind] && (s.ai.light != null ? s.ai.light : 'gemini-3.5-flash-lite')) || s.ai.model || 'gemini-3.8-flash').replace(/[^\w.\-]/g, '');
  // جسم الطلب لكل نموذج: Gemini 3 فما بعد يفكّر افتراضياً (أبطأ)؛ نخفّض التفكير لكل شيء عدا مراجعة الصور والمخطط. Gemma بلا مخطط مقيّد فنصفه في التعليمات
  var noThink = {};
  var bodyFor = function (m) {
    var gc = { temperature: req.temperature != null ? +req.temperature : 0.9 }, sys = clip_(req.system, 30000);
    if (req.schema) { if (/^gemma/.test(m)) sys += '\n\nأعد JSON فقط يطابق هذا المخطط بدقة: ' + JSON.stringify(toJsonSchema_(req.schema)); else { gc.responseMimeType = 'application/json'; gc.responseSchema = req.schema; } }
    if (/^gemini-[3-9]/.test(m) && !/lite/.test(m) && req.kind !== 'review' && req.kind !== 'outline' && !noThink[m]) gc.thinkingConfig = { thinkingLevel: 'low' };
    return JSON.stringify({ contents: [{ role: 'user', parts: parts }], systemInstruction: { parts: [{ text: sys }] }, generationConfig: gc });
  };
  var t0 = now_(), log = { t: t0, uid: who.uid, name: who.name, program: clip_(req.program || '', 30), kind: clip_(req.kind || 'design', 20), inChars: parts[0].text.length, files: parts.length - 1, model: model, ok: false, ms: 0, outChars: 0, err: '', q: clip_(String(req.prompt || '').replace(/\s+/g, ' '), 90) };
  // ازدحام جوجل (503/500/429) مؤقت: نعيد المحاولة مرة بعد ثانيتين، ثم ننتقل إلى نموذج احتياطي
  var models = [model].concat(String(s.ai.fallback != null ? s.ai.fallback : 'gemini-3.6-flash,gemini-3.5-flash-lite').split(',').map(function (m) { return m.trim().replace(/[^\w.\-]/g, ''); }).filter(function (m) { return m && m !== model; }));
  var out = '', tries = 0, lastCode = 0, quotaHits = 0;
  // لكل نموذج: نجرّب المفاتيح بالتناوب؛ ٤٢٩ (حد الحصة) ينقلنا إلى المفتاح التالي فوراً، وازدحام جوجل (٥٠٠/٥٠٣) يُعاد مرة ثم ننتقل إلى النموذج الاحتياطي
  outer: for (var mi = 0; mi < models.length; mi++) {
    var order = geminiKeyOrder_(keys, models[mi]), busyRetried = false;
    for (var ki = 0; ki < order.length; ki++) {
      var key = order[ki];
      for (var attempt = 0; attempt < 2; attempt++) {
        tries++;
        if (now_() - t0 > 75000) break outer;
        try {
          var res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + models[mi] + ':generateContent', {
            method: 'post', contentType: 'application/json', payload: bodyFor(models[mi]), muteHttpExceptions: true, headers: { 'x-goog-api-key': key } });
          var code = res.getResponseCode(), txt = res.getContentText(); lastCode = code;
          if (code === 429) { quotaHits++; geminiMarkBad_(key, models[mi], txt); break; }   // المفتاح التالي
          if (code === 400 && /thinking/i.test(txt) && !noThink[models[mi]]) { noThink[models[mi]] = 1; continue; }   // نموذج لا يقبل ضبط التفكير: نعيد بدونه
          if (code === 503 || code === 500 || code === 504) { if (!busyRetried) { busyRetried = true; Utilities.sleep(2000); continue; } break; }
          if (code === 400 || code === 403) { if (/API key|API_KEY_INVALID|PERMISSION_DENIED/i.test(txt)) { geminiMarkBad_(key, models[mi], 'daily'); log.err = 'أحد مفاتيح Gemini غير صالح'; break; } log.err = 'تعذّر الوصول إلى المساعد (' + code + ')'; break outer; }
          if (code >= 300) { log.err = 'تعذّر الوصول إلى المساعد (' + code + ')'; if (code === 404) break; break outer; }
          var j = JSON.parse(txt), part = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts;
          out = (part || []).map(function (p) { return p.text || ''; }).join('');
          if (!out) { log.err = 'لم يُعد المساعد نتيجة. أعد صياغة طلبك.'; break outer; }
          if (req.schema) out = aiJson_(out, req.schema);
          log.ok = true; log.outChars = out.length; log.model = models[mi]; log.key = ki + 1; log.err = ''; break outer;
        } catch (e) { log.err = clip_(String(e && e.message || e), 160); if (/غير صالحة/.test(log.err)) break outer; break; }
      }
      if (lastCode === 404) break;   // النموذج غير موجود: لا فائدة من بقية المفاتيح
    }
  }
  if (!log.ok && (!log.err || lastCode === 429 || lastCode >= 500)) log.err = lastCode === 429 ? (keys.length > 1 ? 'كل مفاتيح Gemini (' + keys.length + ') بلغت حدّها الآن. حاول بعد دقيقة.' : 'المساعد مشغول الآن (حد الخطة المجانية). حاول بعد دقيقة.') : lastCode >= 500 ? 'خوادم جوجل مزدحمة الآن (' + lastCode + '). حاول بعد قليل.' : (log.err || 'تعذّر الوصول إلى المساعد');
  log.tries = tries; if (quotaHits) log.quota = quotaHits;
  log.ms = now_() - t0;
  aiLog_(log);
  if (!log.ok) throw new Error(log.err);
  return out;
}
function ai_make(token, json) {
  var a = auth_(token), s = settings_();
  if (!s.ai.enabled) throw new Error('المساعد متوقف الآن');
  if (!perm_(a, 'ai')) throw new Error('المساعد يحتاج صلاحية من مشرف البرنامج');
  var req = JSON.parse(json);   // {kind, system, prompt, schema, temperature, files: [{mime, b64}]}
  var textOnly = !(req.files || []).length;
  if (!aiChain_(req).length) throw new Error(textOnly ? 'لم يُضبط مفتاح المساعد بعد' : 'هذه المهمة تحتاج مفتاح Gemini (يرى الصور)؛ لم يُضبط بعد');
  // الذاكرة المؤقتة (٦ ساعات) لما يطلبه العميل صراحةً (cache: true): الطلب نفسه يعود فوراً ولا يُحسب من حد اليوم
  var c = CacheService.getScriptCache(), hk = req.cache && textOnly ? 'aic:' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, [req.kind, req.program, req.system, req.prompt, JSON.stringify(req.schema || ''), req.temperature].join('\u0001'))) : '';
  if (hk) { var hit = c.get(hk); if (hit) return hit; }
  var ck = 'ai:' + a.uid + ':' + dayKey_(now_()), used = +(c.get(ck) || 0);
  if (!isSuper_(a) && used >= s.ai.perDay) throw new Error('بلغت حد اليوم (' + s.ai.perDay + ' طلباً). جرّب غداً.');
  req.system = String(req.system || '') + skillsFor_(req.kind || 'design');
  var out = geminiCall_(req, { uid: a.uid, name: a.name });
  c.put(ck, String(used + 1), 90000);
  if (hk && out.length < 90000) { try { c.put(hk, out, 21600); } catch (e) {} }
  return out;
}
// فحص المساعدين من الإعدادات: طلب صغير لكل مساعد مضبوط، ويعيد هل نجح وكم استغرق ومن أي نموذج
function ai_test(token) {
  var a = auth_(token); if (!isSuper_(a)) throw new Error('للمدير العام');
  var have = aiHave_(), who = { uid: a.uid, name: a.name }, out = [];
  var req = { kind: 'intake', program: '', system: 'أجب بـ JSON فقط.', prompt: 'أعد {"ok":"تم"}', schema: { type: 'OBJECT', properties: { ok: { type: 'STRING' } }, required: ['ok'] }, temperature: 0 };
  [['gemini', geminiOnly_], ['groq', groqCall_], ['cf', cfCall_], ['poll', pollCall_]].forEach(function (p) {
    if (p[0] !== 'poll' && !have[p[0]]) { out.push({ p: p[0], on: false }); return; }
    var t0 = now_();
    try { var r = JSON.parse(p[1](JSON.parse(JSON.stringify(req)), who)); out.push({ p: p[0], on: true, ok: !!r.ok, ms: now_() - t0 }); }
    catch (e) { out.push({ p: p[0], on: true, ok: false, ms: now_() - t0, err: clip_(e.message, 160) }); }
  });
  return JSON.stringify(out);
}
// سجل المساعد: ما طُلب منه ومن ومتى وهل نجح (للمدير، ولمراقبة المهمة الأسبوعية). ملف شهري
function aiLog_(x) {
  try { withLock_(function () { var n = 'ailog_' + monthKey_(x.t) + '.json', l = readJson_(n, []); l.unshift(x); if (l.length > 3000) l.length = 3000; writeJson_(n, l); }); } catch (e) {}
}
function ai_log(token, m, program) {
  var a = auth_(token); needAdmin_(a);
  m = /^\d{4}-\d{2}$/.test(m || '') ? m : monthKey_(now_());
  var list = readJson_('ailog_' + m + '.json', []).filter(function (x) { return (isSuper_(a) || adminOf_(a, x.program)) && (!program || x.program === program); });
  var sum = { n: list.length, ok: 0, ms: 0, kinds: {}, users: {}, days: {}, errs: {} };
  list.forEach(function (x) { if (x.ok) { sum.ok++; sum.ms += x.ms; } sum.kinds[x.kind] = (sum.kinds[x.kind] || 0) + 1; sum.users[x.name] = (sum.users[x.name] || 0) + 1; var d = dayKey_(x.t); sum.days[d] = (sum.days[d] || 0) + 1; if (x.err) sum.errs[x.err] = (sum.errs[x.err] || 0) + 1; });
  sum.ms = sum.ok ? Math.round(sum.ms / sum.ok) : 0;
  return JSON.stringify({ m: m, sum: sum, list: list.slice(0, 200).map(function (x) { var o = Object.assign({}, x); delete o.uid; return o; }), settings: settings_().ai });
}

/* ================= تليجرام: إرسال التصميم إلى قناة البرنامج، فوراً أو في موعد =================
   بوت واحد للمنصة (رمزه في خصائص السكربت TG_TOKEN)، يُضاف مشرفاً في قناة كل برنامج، ولكل برنامج قناته في programs.json (tg.chat).
   المجدول يُحفظ في tgq.json وملفاته في المجلد الفرعي tg، ويرسله المؤقّت tgTick كل عشر دقائق. */
function tgToken_() { var t = props_().getProperty('TG_TOKEN'); if (!t) throw new Error('لم يُضبط بوت تليجرام بعد (الإعدادات)'); return t; }
function tgCall_(method, payload) {
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + tgToken_() + '/' + method, { method: 'post', payload: payload, muteHttpExceptions: true });
  var j; try { j = JSON.parse(res.getContentText()); } catch (e) { j = { ok: false, description: 'رد غير مفهوم (' + res.getResponseCode() + ')' }; }
  if (!j.ok) throw new Error('تليجرام: ' + (j.description || res.getResponseCode()));
  return j.result;
}
function tg_test(token) {
  var a = auth_(token); needAdmin_(a);
  var me = tgCall_('getMe', {});
  return JSON.stringify({ username: me.username, name: me.first_name });
}
function tgChatOf_(pid, track) { var p = progs_().filter(function (x) { return x.id === pid; })[0]; var ch = (p && p.tg && p.tg.chats && track && p.tg.chats[track]) || (p && p.tg && p.tg.chat); if (!ch) throw new Error('لم يحدد مشرف البرنامج قناة تليجرام بعد'); return ch; }
function canSend_(a, pid) { return adminOf_(a, pid) || (inProg_(a, pid) && perm_(a, 'send')); }
// payload: {program, caption, png (base64 بلا رأس), file (base64 الملف الأصلي، اختياري), fileName, fileMime, mode: photo|doc|both, when (ms، اختياري للجدولة), name}
// التكرار: {every: day|week|month, n: كل كم (١-١٢), until: آخر موعد (ms) أو ٠, count: عدد المرات الباقية (٠ = بلا حد)}
function cleanRepeat_(r) {
  if (!r || ['day', 'week', 'month'].indexOf(r.every) < 0) return null;
  return { every: r.every, n: Math.max(1, Math.min(12, Math.round(+r.n || 1))), until: Math.max(0, +r.until || 0), count: Math.max(0, Math.min(365, Math.round(+r.count || 0))) };
}
function nextRepeat_(when, r) {
  var d = new Date(when), n = r.n || 1;
  if (r.every === 'day') d.setDate(d.getDate() + n); else if (r.every === 'week') d.setDate(d.getDate() + 7 * n); else if (r.every === 'month') { var day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); var last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); } else return 0;
  var t = d.getTime(); if (r.until && t > r.until) return 0; return t;
}
function tgPub_(x, a) { var o = Object.assign({}, x); delete o.pngId; delete o.fileId; delete o.thumbId; delete o.uid; o.mine = x.uid === a.uid; o.hasThumb = !!x.thumbId; o.canEdit = x.uid === a.uid || adminOf_(a, x.program); return o; }
function tg_send(token, json) {
  var a = auth_(token), o = JSON.parse(json), pid = o.program;
  if (!canSend_(a, pid)) throw new Error('الإرسال إلى القناة يحتاج صلاحية «الإرسال» من المشرف');
  var chat = tgChatOf_(pid, clip_(o.track || '', 40)), cap = clip_(String(o.caption || ''), 4096), mode = ['photo', 'doc', 'both'].indexOf(o.mode) >= 0 ? o.mode : 'both';
  if (!o.png && !o.file) throw new Error('لا تصميم للإرسال');
  if ((o.png || '').length > 14 * 1024 * 1024 || (o.file || '').length > 68 * 1024 * 1024) throw new Error('الملف أكبر من حد تليجرام (١٠ ميغابايت للصورة، ٥٠ للملف)');
  var when = +o.when || 0, repeat = cleanRepeat_(o.repeat), dir = sub_('tg');
  var rec = { id: uid_(), program: pid, track: clip_(o.track || '', 40), chat: chat, uid: a.uid, name: a.name, title: clip_(o.name, 80), caption: cap, mode: mode, when: when > now_() + 60000 ? when : now_(), at: now_(), status: 'queued', item: clip_(o.item || '', 40) };
  if (repeat) rec.repeat = repeat;
  // مصغّر للتقويم (JPEG صغير) يُحفظ ملفاً حتى لا يثقل ملف الطابور
  if (o.thumb && /^[A-Za-z0-9+\/=]+$/.test(o.thumb) && o.thumb.length < 120000) { try { rec.thumbId = dir.createFile(Utilities.newBlob(Utilities.base64Decode(o.thumb), 'image/jpeg', 'tg_' + rec.id + '_thumb.jpg')).getId(); } catch (e) {} }
  if (when > now_() + 60000 || repeat) {
    if (o.png) rec.pngId = dir.createFile(Utilities.newBlob(Utilities.base64Decode(o.png), 'image/png', 'tg_' + rec.id + '.png')).getId();
    if (o.file) rec.fileId = dir.createFile(Utilities.newBlob(Utilities.base64Decode(o.file), clip_(o.fileMime || 'image/png', 60), clip_(o.fileName || ('design_' + rec.id + '.png'), 100))).getId();
  }
  if (when > now_() + 60000) {
    withLock_(function () { var q = readJson_('tgq.json', []); q.unshift(rec); if (q.length > 500) q.length = 500; writeJson_('tgq.json', q); });
    audit_(a, 'جدول منشوراً', rec.title + ' · ' + pid + (repeat ? ' · متكرر' : ''));
    return JSON.stringify({ id: rec.id, queued: true, when: when, repeat: repeat });
  }
  var sent = tgDeliver_(chat, cap, mode, o.png ? Utilities.newBlob(Utilities.base64Decode(o.png), 'image/png', 'design.png') : null, o.file ? Utilities.newBlob(Utilities.base64Decode(o.file), clip_(o.fileMime || 'image/png', 60), clip_(o.fileName || 'design.png', 100)) : null);
  rec.status = 'sent'; rec.msg = sent.msg; rec.link = sent.link; rec.sentAt = now_();
  var nextRec = repeat ? tgNextOf_(rec) : null;
  withLock_(function () { var q = readJson_('tgq.json', []); if (nextRec) q.unshift(nextRec); q.unshift(rec); if (q.length > 500) q.length = 500; writeJson_('tgq.json', q); });
  audit_(a, 'أرسل إلى القناة', clip_(o.name, 80) + ' · ' + pid);
  sent.id = rec.id; if (nextRec) sent.next = nextRec.when;
  return JSON.stringify(sent);
}
// النسخة التالية من منشور متكرر: السجل نفسه بموعد جديد، وتشترك في ملفات الصورة
function tgNextOf_(x) {
  var r = x.repeat; if (!r) return null;
  if (r.count === 1) return null;
  var t = nextRepeat_(x.when, r); if (!t) return null;
  var n = Object.assign({}, x, { id: uid_(), when: t, at: now_(), status: 'queued', seriesId: x.seriesId || x.id, repeat: Object.assign({}, r, { count: r.count ? r.count - 1 : 0 }) });
  delete n.msg; delete n.link; delete n.err; delete n.sentAt;
  return n;
}
// طول نص تليجرام يُحسب بلا الوسوم. حدّ الوصف تحت الصورة ١٠٢٤، وحدّ الرسالة ٤٠٩٦
function tgLen_(cap) { return String(cap || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').length; }
function tgDeliver_(chat, cap, mode, pngBlob, fileBlob) {
  var out = { msg: 0 }, longCap = tgLen_(cap) > 1000, capOnMedia = longCap ? '' : cap;
  if (mode !== 'doc' && pngBlob) { var r1 = tgCall_('sendPhoto', { chat_id: chat, photo: pngBlob, caption: capOnMedia, parse_mode: 'HTML' }); out.msg = r1.message_id; }
  if (mode !== 'photo') { var fb = fileBlob || pngBlob; var r2 = tgCall_('sendDocument', { chat_id: chat, document: fb, caption: mode === 'doc' ? capOnMedia : 'الملف بجودته الكاملة', parse_mode: 'HTML' }); if (!out.msg) out.msg = r2.message_id; }
  // النص الطويل يُرسل رسالةً تالية تردّ على الصورة فلا يُقصّ
  if (longCap && cap) { var p3 = { chat_id: chat, text: clip_(cap, 4096), parse_mode: 'HTML', link_preview_options: JSON.stringify({ is_disabled: true }) }; if (out.msg) p3.reply_to_message_id = out.msg; var r3 = tgCall_('sendMessage', p3); out.textMsg = r3.message_id; out.split = true; }
  if (/^@/.test(chat) && out.msg) out.link = 'https://t.me/' + chat.slice(1) + '/' + out.msg;
  return out;
}
function tg_queue(token, program) {
  var a = auth_(token);
  return JSON.stringify(readJson_('tgq.json', []).filter(function (x) { return (!program || x.program === program) && (adminOf_(a, x.program) || x.uid === a.uid || inProg_(a, x.program)); }).slice(0, 300)
    .map(function (x) { return tgPub_(x, a); }));
}
// مصغّرات المنشورات للتقويم: {id: dataUrl}
function tg_thumbs(token, idsJson) {
  var a = auth_(token), ids = JSON.parse(idsJson || '[]').slice(0, 40), q = readJson_('tgq.json', []), out = {};
  ids.forEach(function (id) { var x = q.filter(function (y) { return y.id === id; })[0]; if (!x || !x.thumbId || !(adminOf_(a, x.program) || x.uid === a.uid || inProg_(a, x.program))) return; try { out[id] = fileDataUrl_(x.thumbId); } catch (e) {} });
  return JSON.stringify(out);
}
function tg_cancel(token, id) {
  var a = auth_(token);
  return withLock_(function () {
    var q = readJson_('tgq.json', []), x = q.filter(function (y) { return y.id === id; })[0];
    if (!x) throw new Error('غير موجود'); if (!(x.uid === a.uid || adminOf_(a, x.program))) throw new Error('ليس لك');
    if (x.status !== 'queued') throw new Error('أُرسل من قبل');
    x.status = 'cancelled'; x.upd = now_(); writeJson_('tgq.json', q); return 'ok';
  });
}
// تعديل منشور مجدول: الموعد، النص، العنوان، التكرار. {id, when, caption, title, repeat (null يوقف التكرار)}
function tg_update(token, json) {
  var a = auth_(token), o = JSON.parse(json);
  return withLock_(function () {
    var q = readJson_('tgq.json', []), x = q.filter(function (y) { return y.id === o.id; })[0];
    if (!x) throw new Error('غير موجود'); if (!(x.uid === a.uid || adminOf_(a, x.program))) throw new Error('ليس لك');
    if (x.status !== 'queued') throw new Error('هذا المنشور أُرسل أو أُلغي؛ أعد جدولته منشوراً جديداً');
    if (o.when != null) { var w = +o.when; if (!(w > now_() + 60000)) throw new Error('اختر موعداً في المستقبل'); x.when = w; }
    if (o.caption != null) x.caption = clip_(String(o.caption), 4096);
    if (o.title != null) x.title = clip_(o.title, 80);
    if (o.mode && ['photo', 'doc', 'both'].indexOf(o.mode) >= 0) x.mode = o.mode;
    if ('repeat' in o) { var r = cleanRepeat_(o.repeat); if (r) x.repeat = r; else delete x.repeat; }
    x.upd = now_(); x.updBy = a.name;
    writeJson_('tgq.json', q); audit_(a, 'عدّل منشوراً مجدولاً', x.title + ' · ' + x.program);
    return JSON.stringify(tgPub_(x, a));
  });
}
// إعادة جدولة منشور أُرسل أو فشل أو أُلغي: نسخة جديدة بموعد جديد (الملفات نفسها إن كانت محفوظة)
function tg_requeue(token, id, when) {
  var a = auth_(token), w = +when; if (!(w > now_() + 60000)) throw new Error('اختر موعداً في المستقبل');
  return withLock_(function () {
    var q = readJson_('tgq.json', []), x = q.filter(function (y) { return y.id === id; })[0];
    if (!x) throw new Error('غير موجود'); if (!(x.uid === a.uid || adminOf_(a, x.program))) throw new Error('ليس لك');
    if (!x.pngId && !x.fileId) throw new Error('هذا المنشور أُرسل فوراً ولم تُحفظ صورته؛ افتح التصميم وجدوله من جديد');
    var n = Object.assign({}, x, { id: uid_(), when: w, at: now_(), status: 'queued', uid: a.uid, name: a.name, seriesId: x.seriesId || undefined }); delete n.msg; delete n.link; delete n.err; delete n.sentAt; delete n.repeat; delete n.upd;
    q.unshift(n); if (q.length > 500) q.length = 500; writeJson_('tgq.json', q);
    audit_(a, 'أعاد جدولة منشور', n.title + ' · ' + n.program);
    return JSON.stringify(tgPub_(n, a));
  });
}
// المؤقّت: يرسل ما حان موعده، ويولّد الموعد التالي للمتكرر، ويُشعر صاحبه
function tgTick() {
  JC = {};
  var due = readJson_('tgq.json', []).filter(function (x) { return x.status === 'queued' && x.when <= now_(); });
  due.forEach(function (x) {
    var res = null, err = '';
    try { res = tgDeliver_(x.chat, x.caption, x.mode, x.pngId ? DriveApp.getFileById(x.pngId).getBlob() : null, x.fileId ? DriveApp.getFileById(x.fileId).getBlob() : null); } catch (e) { err = String(e && e.message || e); }
    var nextRec = null;
    withLock_(function () {
      var q = readJson_('tgq.json', []), cur = null;
      q.forEach(function (y) { if (y.id === x.id) { cur = y; y.status = err ? 'failed' : 'sent'; y.err = err; y.sentAt = now_(); if (res) { y.msg = res.msg; y.link = res.link; } } });
      if (cur && cur.repeat) { nextRec = tgNextOf_(cur); if (nextRec) q.unshift(nextRec); }
      if (q.length > 500) q.length = 500;
      writeJson_('tgq.json', q);
    });
    ntPush_(x.uid, 'tg', err ? 'تعذّر نشر «' + (x.title || 'منشور') + '» في القناة: ' + clip_(err, 120) : 'نُشر «' + (x.title || 'منشور') + '» في القناة' + (nextRec ? '، والموعد التالي ' + Utilities.formatDate(new Date(nextRec.when), tz_(), 'd/M HH:mm') : ''), err ? '#/cal' : (res && res.link) || '#/cal');
  });
}
/* ---------- اكتشاف القنوات والمجموعات التي أُضيف إليها البوت ---------- */
// getUpdates يعيد آخر ما وصل البوت خلال ٢٤ ساعة: إضافته لقناة أو مجموعة، ومنشورات القنوات التي هو مشرف فيها. يُجمع ما نجده في settings.tgKnown
function tg_discover(token) {
  var a = auth_(token); needAdmin_(a);
  var ups = tgCall_('getUpdates', { limit: 100, timeout: 0, allowed_updates: JSON.stringify(['my_chat_member', 'channel_post', 'message', 'chat_member', 'edited_channel_post']) }) || [];
  var found = {};
  ups.forEach(function (u) {
    var m = u.my_chat_member || u.chat_member || u.channel_post || u.edited_channel_post || u.message, ch = m && m.chat; if (!ch || ch.type === 'private') return;
    var st = u.my_chat_member && u.my_chat_member.new_chat_member ? u.my_chat_member.new_chat_member.status : '';
    var k = String(ch.id), prev = found[k] || {};
    found[k] = { id: ch.id, title: clip_(ch.title || '', 80), type: ch.type, username: ch.username ? '@' + ch.username : '', status: st || prev.status || '', seen: Math.max(prev.seen || 0, (m.date || 0) * 1000) };
  });
  return withLock_(function () {
    var s = readJson_('settings.json', {}), known = s.tgKnown || [], map = {};
    known.forEach(function (c) { map[String(c.id)] = c; });
    Object.keys(found).forEach(function (k) { var c = found[k]; if (c.status === 'left' || c.status === 'kicked') { delete map[k]; return; } map[k] = Object.assign({}, map[k] || {}, c); });
    var list = Object.keys(map).map(function (k) { return map[k]; }).sort(function (x, y) { return (y.seen || 0) - (x.seen || 0); }).slice(0, 60);
    s.tgKnown = list; writeJson_('settings.json', s);
    return JSON.stringify({ found: Object.keys(found).length, list: list });
  });
}
// فحص قناة: هل يصل إليها البوت، وهل هو مشرف بصلاحية النشر؟
function tg_chat_check(token, chat) {
  var a = auth_(token); needAdmin_(a); chat = clip_(String(chat || '').trim(), 80); if (!chat) throw new Error('اكتب اسم القناة أو معرّفها');
  var info = tgCall_('getChat', { chat_id: chat }), me = tgCall_('getMe', {});
  var mem = null; try { mem = tgCall_('getChatMember', { chat_id: chat, user_id: me.id }); } catch (e) {}
  var st = mem ? mem.status : 'unknown', canPost = !!(mem && (st === 'creator' || (st === 'administrator' && (info.type !== 'channel' || mem.can_post_messages !== false))));
  // نسجّلها في المعروفة أيضاً
  try { withLock_(function () { var s = readJson_('settings.json', {}), known = s.tgKnown || []; if (!known.some(function (c) { return String(c.id) === String(info.id); })) { known.unshift({ id: info.id, title: clip_(info.title || '', 80), type: info.type, username: info.username ? '@' + info.username : '', status: st, seen: now_() }); s.tgKnown = known.slice(0, 60); writeJson_('settings.json', s); } }); } catch (e) {}
  return JSON.stringify({ id: info.id, title: info.title || '', type: info.type, username: info.username ? '@' + info.username : '', status: st, canPost: canPost, members: info.members_count || 0 });
}
function tg_known(token) { var a = auth_(token); needAdmin_(a); return JSON.stringify(settings_().tgKnown || []); }

/* ================= التقويم والمهام =================
   tasks.json: [{id, program, title, note, due, allDay, from, fromName, to, toName, status: open|done, prio, link, at, upd, doneAt}]
   المهمة لصاحبها (يكتبها لنفسه)، أو يسندها مشرف البرنامج إلى عضو فيصله إشعار. */
function taskVisible_(a, t) { return t.status !== 'deleted' && (t.from === a.uid || t.to === a.uid || (t.to === '' && inProg_(a, t.program)) || adminOf_(a, t.program)); }
function task_list(token, program) {
  var a = auth_(token);
  return JSON.stringify(readJson_('tasks.json', []).filter(function (t) { return (!program || t.program === program) && taskVisible_(a, t); }).slice(0, 400)
    .map(function (t) { var o = Object.assign({}, t); o.mine = t.to === a.uid || (t.to === '' && t.from === a.uid); o.canEdit = t.from === a.uid || adminOf_(a, t.program); o.canDone = t.to === a.uid || t.from === a.uid || adminOf_(a, t.program); return o; }));
}
function task_save(token, json) {
  var a = auth_(token), o = JSON.parse(json), pid = clip_(o.program || '', 30);
  if (!inProg_(a, pid)) throw new Error('ليس من برامجك');
  var title = clip_(String(o.title || '').trim(), 140); if (!title) throw new Error('اكتب عنوان المهمة');
  var saved = withLock_(function () {
    var list = readJson_('tasks.json', []), t = o.id ? list.filter(function (x) { return x.id === o.id; })[0] : null, isNew = !t;
    if (t && !(t.from === a.uid || adminOf_(a, t.program))) throw new Error('هذه المهمة ليست لك');
    if (!t) { t = { id: uid_(), program: pid, from: a.uid, fromName: a.name, at: now_(), status: 'open' }; list.unshift(t); }
    var to = clip_(o.to != null ? o.to : (t.to != null ? t.to : a.uid), 40), toName = a.name;
    if (to && to !== a.uid) { if (!adminOf_(a, pid)) throw new Error('إسناد المهام لغيرك لمشرف البرنامج'); var accs = readJson_('accounts.json', {}), acc = accs[to]; if (!acc || !inProg_(acc, pid)) throw new Error('العضو ليس في هذا البرنامج'); toName = acc.name; }
    if (!to) toName = '';   // مهمة لكل الفريق
    var notifyNew = (isNew || t.to !== to) && to && to !== a.uid;
    t.title = title; t.note = clip_(o.note, 1500); t.due = Math.max(0, +o.due || 0); t.allDay = !!o.allDay; t.to = to; t.toName = toName; t.prio = o.prio === 'high' ? 'high' : 'normal'; t.link = /^(#\/|https?:\/\/)/.test(o.link || '') ? clip_(o.link, 300) : ''; t.upd = now_();
    if (o.status === 'open' || o.status === 'done') { t.status = o.status; t.doneAt = o.status === 'done' ? now_() : 0; }
    if (t.repeat !== undefined) delete t.repeat;
    if (list.length > 2000) list.length = 2000;
    writeJson_('tasks.json', list);
    return { t: t, notify: notifyNew };
  });
  // الإشعار خارج القفل (الإشعارات تأخذ القفل بنفسها)
  var t = saved.t;
  if (saved.notify) ntPush_(t.to, 'task', 'مهمة جديدة من ' + a.name + ': ' + title + (t.due ? ' — ' + Utilities.formatDate(new Date(t.due), tz_(), 'd/M') : ''), '#/cal?task=' + t.id);
  return JSON.stringify(t);
}
function task_done(token, id, on) {
  var a = auth_(token);
  var done = on === true || on === 'true' || on === 1;
  var t = withLock_(function () {
    var list = readJson_('tasks.json', []), t = list.filter(function (x) { return x.id === id; })[0];
    if (!t) throw new Error('غير موجودة'); if (!(t.to === a.uid || t.from === a.uid || adminOf_(a, t.program) || (t.to === '' && inProg_(a, t.program)))) throw new Error('ليست لك');
    t.status = done ? 'done' : 'open'; t.doneAt = done ? now_() : 0; t.doneBy = done ? a.name : ''; t.upd = now_();
    writeJson_('tasks.json', list);
    return t;
  });
  if (done && t.from && t.from !== a.uid) ntPush_(t.from, 'task', a.name + ' أنجز المهمة: ' + t.title, '#/cal?task=' + t.id);
  return JSON.stringify(t);
}
function task_del(token, id) {
  var a = auth_(token);
  return withLock_(function () {
    var list = readJson_('tasks.json', []), t = list.filter(function (x) { return x.id === id; })[0];
    if (!t) throw new Error('غير موجودة'); if (!(t.from === a.uid || adminOf_(a, t.program))) throw new Error('ليست لك');
    t.status = 'deleted'; t.upd = now_(); writeJson_('tasks.json', list); return 'ok';
  });
}
function ensureTriggers_(log) {
  try {
    var has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'tgTick'; });
    if (!has) { ScriptApp.newTrigger('tgTick').timeBased().everyMinutes(10).create(); if (log) log.push('أُنشئ مؤقّت المنشورات المجدولة (كل ١٠ دقائق).'); }
    var hasW = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'weeklyUserStats'; });
    if (!hasW) { ScriptApp.newTrigger('weeklyUserStats').timeBased().onWeekDay(ScriptApp.WeekDay.SATURDAY).atHour(7).create(); if (log) log.push('أُنشئ مؤقّت تقارير الأسبوع للمستخدمين (كل سبت صباحاً).'); }
  } catch (e) { if (log) log.push('تعذّر إنشاء المؤقّت: ' + e); }
}

/* ================= الإشعارات ================= */
// notifs.json: { uid: [{id, kind, text, link, at, seen}] } — آخر ٤٠ لكل مستخدم
function ntPush_(uid, kind, text, link) {
  if (!uid) return;
  try { withLock_(function () { var all = readJson_('notifs.json', {}), l = all[uid] = all[uid] || []; l.unshift({ id: uid_(), kind: kind, text: clip_(text, 300), link: clip_(link || '', 200), at: now_(), seen: false }); if (l.length > 40) l.length = 40; writeJson_('notifs.json', all); }); } catch (e) {}
}
function nt_list(token) { var a = auth_(token); return JSON.stringify(readJson_('notifs.json', {})[a.uid] || []); }
function nt_seen(token) { var a = auth_(token); return withLock_(function () { var all = readJson_('notifs.json', {}); (all[a.uid] || []).forEach(function (x) { x.seen = true; }); writeJson_('notifs.json', all); return 'ok'; }); }

/* ================= التعليقات على القوالب والتصاميم والنماذج ================= */
// comments.json: [{id, target: 'tpl:<id>' | 'item:<id>', program, uid, name, text, at}]
function cmTarget_(a, target, program) {
  var m = /^(tpl|item):([\w-]{1,80})$/.exec(String(target || '')); if (!m) throw new Error('هدف غير صالح');
  if (m[1] === 'item') {
    var f = itemFile_(safeId_(m[2])); if (!f) throw new Error('التصميم غير موجود');
    var it = JSON.parse(text_(f)), pid = itemProg_(it), mine = keysOf_(a).indexOf(it.ownerKey) >= 0;
    if (!mine && !((it.shared || it.model) && inProg_(a, pid)) && !adminOf_(a, pid)) throw new Error('هذا التصميم ليس مشتركاً');
    return { program: pid, owner: it.ownerKey, name: it.name };
  }
  program = clip_(program, 40); if (!program || !inProg_(a, program)) throw new Error('لست في هذا البرنامج');
  return { program: program, owner: '', name: m[2] };
}
function cm_list(token, target, program) {
  var a = auth_(token), t = cmTarget_(a, target, program);
  return JSON.stringify(readJson_('comments.json', []).filter(function (x) { return x.target === target && x.program === t.program; }).slice(0, 300).map(function (x) {
    return { id: x.id, name: x.name, text: x.text, at: x.at, mine: x.uid === a.uid, canDel: x.uid === a.uid || adminOf_(a, x.program) };
  }).reverse());
}
function cm_add(token, json) {
  var a = auth_(token), m = JSON.parse(json), t = cmTarget_(a, m.target, m.program), text = clip_(String(m.text || '').trim(), 1500);
  if (text.length < 2) throw new Error('اكتب تعليقك');
  var x = withLock_(function () {
    var l = readJson_('comments.json', []);
    if (l.filter(function (y) { return y.uid === a.uid && y.at > now_() - 864e5; }).length > 200) throw new Error('تعليقات كثيرة اليوم');
    var c = { id: uid_(), target: m.target, program: t.program, uid: a.uid, name: a.name, text: text, at: now_() };
    l.push(c); if (l.length > 20000) l.splice(0, l.length - 20000); writeJson_('comments.json', l); return c;
  });
  if (t.owner && t.owner !== 'a:' + a.uid) ntPush_(String(t.owner).replace(/^a:/, ''), 'comment', a.name + ' علّق على «' + t.name + '»: ' + text.slice(0, 80), '#/d/' + m.target.slice(5));
  return JSON.stringify({ id: x.id, name: x.name, text: x.text, at: x.at, mine: true, canDel: true });
}
function cm_del(token, id) {
  var a = auth_(token);
  return withLock_(function () {
    var l = readJson_('comments.json', []), i = -1; l.forEach(function (x, k) { if (x.id === id) i = k; });
    if (i < 0) throw new Error('غير موجود'); if (l[i].uid !== a.uid && !adminOf_(a, l[i].program)) throw new Error('لا تملك صلاحية');
    l.splice(i, 1); writeJson_('comments.json', l); return 'ok';
  });
}
function cm_counts(token, targets) {
  var a = auth_(token), want = {}; (targets || []).slice(0, 200).forEach(function (t) { want[t] = 0; });
  readJson_('comments.json', []).forEach(function (x) { if (x.target in want && inProg_(a, x.program)) want[x.target]++; });
  return JSON.stringify(want);
}

/* ================= طلب مراجعة تصميم من إدارة المنصة ================= */
// reviews.json: [{id, uid, name, program, track, tpl, item, note, img, ai: {score, summary}, status: new|done, reply: {score, notes, points[], by, at}, at}]
function rv_request(token, json) {
  var a = auth_(token), m = JSON.parse(json), pid = clip_(m.program, 40);
  if (!pid || !inProg_(a, pid)) throw new Error('لست في هذا البرنامج');
  var img = saveShot_(m.img); if (!img) throw new Error('صورة التصميم مطلوبة');
  var r = withLock_(function () {
    var l = readJson_('reviews.json', []);
    if (l.filter(function (y) { return y.uid === a.uid && y.status === 'new'; }).length >= 10) throw new Error('لديك عشرة طلبات تنتظر المراجعة');
    var x = { id: uid_(), uid: a.uid, name: a.name, program: pid, track: clip_(m.track, 40), tpl: clip_(m.tpl, 60), item: clip_(m.item, 60), note: clip_(m.note, 1500), img: img,
      ai: m.ai ? { score: Math.max(0, Math.min(100, +m.ai.score || 0)), summary: clip_(m.ai.summary, 600) } : null, status: 'new', reply: null, at: now_() };
    l.unshift(x); if (l.length > 3000) l.length = 3000; writeJson_('reviews.json', l); return x;
  });
  return JSON.stringify({ id: r.id });
}
function rvPub_(x) { var o = Object.assign({}, x); delete o.img; return o; }
function rv_list(token, status) {
  var a = auth_(token); needAdmin_(a);
  return JSON.stringify(readJson_('reviews.json', []).filter(function (x) { return (!status || x.status === status) && adminOf_(a, x.program); }).slice(0, 300).map(rvPub_));
}
function rv_mine(token) { var a = auth_(token); return JSON.stringify(readJson_('reviews.json', []).filter(function (x) { return x.uid === a.uid; }).slice(0, 50).map(rvPub_)); }
function rv_img(token, id) {
  var a = auth_(token), x = readJson_('reviews.json', []).filter(function (y) { return y.id === id; })[0];
  if (!x) throw new Error('غير موجود'); if (x.uid !== a.uid && !adminOf_(a, x.program)) throw new Error('لا تملك صلاحية');
  return fileDataUrl_(x.img);
}
function rv_reply(token, id, json) {
  var a = auth_(token), m = JSON.parse(json);
  var x = withLock_(function () {
    var l = readJson_('reviews.json', []), hit = null; l.forEach(function (y) { if (y.id === id) hit = y; });
    if (!hit) throw new Error('غير موجود'); if (!adminOf_(a, hit.program)) throw new Error('لا تملك صلاحية');
    hit.reply = { score: Math.max(0, Math.min(10, +m.score || 0)), notes: clip_(m.notes, 3000), points: (m.points || []).slice(0, 12).map(function (p) { return clip_(p, 200); }), by: a.name, at: now_() };
    hit.status = 'done'; writeJson_('reviews.json', l); return hit;
  });
  ntPush_(x.uid, 'review', 'وصلت مراجعة تصميمك من ' + a.name + ' (' + x.reply.score + '/10)', '#/reviews');
  audit_(a, 'راجع تصميماً', x.name);
  return JSON.stringify(rvPub_(x));
}

/* ================= أسبوعك في أثر: إحصاءات كل مستخدم وتقييم تحفيزي من المساعد ================= */
function weekStart_(t) { var d = new Date(dayKey_(t) + 'T12:00:00Z'), back = (d.getUTCDay() + 1) % 7; return dayKey_(d.getTime() - back * 864e5); }
function userWeekRaw_(from, to) {   // {uid: {days: {}, ev: {}, tools: {}, tpls: {}}}
  var out = {}, months = {}; for (var x = from; x <= to + 864e5; x += 864e5 * 20) months[monthKey_(x)] = 1; months[monthKey_(to)] = 1;
  Object.keys(months).forEach(function (mk) {
    var st = readJson_('stats_' + mk + '.json', { days: {} });
    Object.keys(st.days).forEach(function (dk) {
      var t = new Date(dk + 'T12:00:00Z').getTime(); if (t < from || t >= to) return;
      Object.keys(st.days[dk]).forEach(function (p) {
        var ue = st.days[dk][p].uev || {};
        Object.keys(ue).forEach(function (uid) {
          var o = out[uid] = out[uid] || { days: {}, ev: {}, tools: {}, tpls: {} }; o.days[dk] = 1;
          Object.keys(ue[uid]).forEach(function (k) { var n = ue[uid][k]; if (k.slice(0, 2) === 't:') bump_(o.tools, k.slice(2), n); else if (k.slice(0, 2) === 'p:') bump_(o.tpls, k.slice(2), n); else bump_(o.ev, k, n); });
        });
      });
    });
  });
  return out;
}
function weekNums_(o) {
  o = o || { days: {}, ev: {}, tools: {}, tpls: {} };
  var top = function (m, n) { return Object.keys(m).sort(function (x, y) { return m[y] - m[x]; }).slice(0, n); };
  return { active: Object.keys(o.days).length, exports: o.ev['export'] || 0, saves: o.ev.save || 0, made: o.ev.make || 0, opens: o.ev.open || 0, sent: o.ev.tg || 0, shows: o.ev.present || 0,
    tools: Object.keys(o.tools).length, topTools: top(o.tools, 3), topTpls: top(o.tpls, 3) };
}
function weekBadges_(c, p) {
  var b = [];
  if (c.active >= 5) b.push('حاضر كل الأسبوع'); else if (c.active >= 3) b.push('حضور منتظم');
  if (c.exports >= 10) b.push('غزير الإنتاج'); else if (c.exports >= 3) b.push('منتج');
  if (c.tools >= 4) b.push('مستكشف الأدوات');
  if (c.sent) b.push('ناشر');
  if (c.shows) b.push('عارض');
  if (p && c.exports > p.exports && p.exports > 0) b.push('في صعود');
  return b;
}
var TIP_CAT_IDS = ['contrast', 'align', 'proximity', 'repeat', 'hierarchy', 'space', 'color', 'type', 'image', 'balance', 'message', 'slides', 'brand'];
function weekMsgLocal_(name, c, p) {
  var first = String(name || '').split(' ')[0];
  if (!c.active) return 'اشتقنا لتصاميمك يا ' + first + '. خصّص هذا الأسبوع نصف ساعة لتصميم واحد تعتني بتفاصيله.';
  var up = p && c.exports > p.exports, s = 'أحسنت يا ' + first + '! ' + c.active + ' أيام نشطة و' + c.exports + ' تنزيلاً هذا الأسبوع';
  return s + (up ? '، وأكثر من الأسبوع الماضي. ' : '. ') + 'جرّب هذا الأسبوع أداة لم تستعملها، واطلب مراجعة لتصميم تعتزّ به.';
}
function wkBuild_(uids, withAI) {
  var ws = weekStart_(now_()), end = new Date(ws + 'T00:00:00Z').getTime() - 3 * 3600000, from = end - 7 * 864e5, pfrom = from - 7 * 864e5;
  var cur = userWeekRaw_(from, end), prev = userWeekRaw_(pfrom, from), accs = readJson_('accounts.json', {});
  var ai = {}; readJson_('ailog_' + monthKey_(end - 864e5) + '.json', []).forEach(function (x) { if (x.t >= from && x.t < end && x.ok) bump_(ai, x.uid); });
  var key = weekStart_(end - 864e5), file = 'wk_' + key + '.json', store = readJson_(file, { week: key, from: dayKey_(from), to: dayKey_(end - 864e5), users: {} });
  var list = (uids || Object.keys(accs)).filter(function (u) { return accs[u] && accs[u].active !== false && (uids || accs[u].role !== 'super'); });
  var rows = list.map(function (u) { var c = weekNums_(cur[u]), p = weekNums_(prev[u]); c.ai = ai[u] || 0; return { uid: u, name: accs[u].name, c: c, p: p, badges: weekBadges_(c, p) }; })
    .filter(function (r) { return r.c.active || r.p.active || uids; });
  // ترتيب المستخدم في برنامجه بعدد التنزيلات
  rows.forEach(function (r) { r.msg = weekMsgLocal_(r.name, r.c, r.p); r.focus = TIP_CAT_IDS[(r.c.exports + r.c.active) % TIP_CAT_IDS.length]; r.challenge = ''; });
  if (withAI && (hasGemini_() || props_().getProperty('GROQ_KEY')) && settings_().ai.enabled) {
    for (var i = 0; i < rows.length; i += 20) {
      var batch = rows.slice(i, i + 20);
      try {
        var out = geminiCall_({ kind: 'week', system: 'تكتب تقييماً أسبوعياً قصيراً محفّزاً لكل عضو في فريق إعلامي تربوي يصمم على منصة «أثر». لكل عضو: msg فقرة من جملتين أو ثلاث، تخاطبه باسمه الأول، تذكر رقماً حقيقياً من أرقامه وتقارنه بأسبوعه الماضي بصدق، وتختم بخطوة عملية واحدة؛ وfocus واحد من: ' + TIP_CAT_IDS.join(', ') + ' (المبدأ التصميمي الذي يفيده التركيز عليه)؛ وchallenge تحدٍّ صغير للأسبوع القادم في جملة. لا مبالغة ولا مقارنة بغيره. إن لم ينشط فشجّعه بلطف بلا لوم.' + skillsFor_('week'),
          prompt: JSON.stringify(batch.map(function (r) { return { id: r.uid, name: String(r.name).split(' ')[0], thisWeek: r.c, lastWeek: r.p }; })),
          schema: { type: 'OBJECT', properties: { items: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, msg: { type: 'STRING' }, focus: { type: 'STRING' }, challenge: { type: 'STRING' } }, required: ['id', 'msg'] } } }, required: ['items'] }, temperature: 0.7 }, { uid: 'system', name: 'تقارير الأسبوع' });
        JSON.parse(out).items.forEach(function (it) { batch.forEach(function (r) { if (r.uid === it.id) { r.msg = clip_(it.msg, 600); if (TIP_CAT_IDS.indexOf(it.focus) >= 0) r.focus = it.focus; r.challenge = clip_(it.challenge, 200); r.byAI = true; } }); });
      } catch (e) {}
    }
  }
  withLock_(function () { var st = readJson_(file, store); rows.forEach(function (r) { st.users[r.uid] = { c: r.c, p: r.p, badges: r.badges, msg: r.msg, focus: r.focus, challenge: r.challenge, byAI: !!r.byAI, at: now_() }; }); writeJson_(file, st); writeJson_('wk_last.json', { week: key }); });
  return { file: file, week: key, rows: rows };
}
// مؤقّت أسبوعي (السبت صباحاً): تقرير لكل مستخدم نشط، وإشعار له
function weeklyUserStats() {
  var r = wkBuild_(null, true);
  r.rows.forEach(function (x) { ntPush_(x.uid, 'week', 'تقرير أسبوعك في أثر جاهز: ' + x.c.exports + ' تنزيلاً و' + x.c.active + ' أيام نشطة', '#/week'); });
  return r.rows.length;
}
function me_week(token, fresh) {
  var a = auth_(token), wsT = new Date(weekStart_(now_()) + 'T00:00:00Z').getTime() - 3 * 3600000, key = weekStart_(wsT - 864e5);
  var st = readJson_('wk_' + key + '.json', null), mine = st && st.users[a.uid];
  if (!mine || fresh) { var r = wkBuild_([a.uid], !!fresh && perm_(a, 'ai') && settings_().ai.enabled); st = readJson_(r.file, null); mine = st && st.users[a.uid]; }
  var live = weekNums_(userWeekRaw_(wsT, now_() + 864e5)[a.uid]);
  var hist = []; for (var k = 4; k >= 1; k--) { var wk = weekStart_(new Date(key + 'T12:00:00Z').getTime() - k * 7 * 864e5), f = readJson_('wk_' + wk + '.json', null); hist.push({ week: wk, exports: f && f.users[a.uid] ? f.users[a.uid].c.exports : 0, active: f && f.users[a.uid] ? f.users[a.uid].c.active : 0 }); }
  if (mine) hist.push({ week: key, exports: mine.c.exports, active: mine.c.active });
  hist.push({ week: weekStart_(now_()), exports: live.exports, active: live.active, live: true });
  return JSON.stringify({ week: key, from: st ? st.from : '', to: st ? st.to : '', me: mine || null, live: live, hist: hist });
}
function wk_admin(token, program) {
  var a = auth_(token); needAdmin_(a);
  var last = readJson_('wk_last.json', {}), st = last.week ? readJson_('wk_' + last.week + '.json', null) : null, accs = readJson_('accounts.json', {});
  if (!st) return JSON.stringify({ week: '', rows: [] });
  var rows = Object.keys(st.users).filter(function (u) { var ac = accs[u]; return ac && (ac.programs || []).some(function (p) { return (!program || p === program) && adminOf_(a, p); }); })
    .map(function (u) { var x = st.users[u]; return { name: accs[u].name, c: x.c, p: x.p, badges: x.badges, msg: x.msg }; })
    .sort(function (x, y) { return y.c.exports - x.c.exports; });
  return JSON.stringify({ week: st.week, from: st.from, to: st.to, rows: rows });
}

/* ================= مهارات المساعد (Gemini Skills) =================
   مهارة = معرفة مكتوبة تُضاف إلى تعليمات المساعد في المهام التي تخصّها. الافتراضية هنا، ويعدّلها المدير العام أو يضيف غيرها من اللوحة. */
var AI_SKILLS = [
  { id: 'design-eye', name: 'عين المصمّم', kinds: ['review'], text: [
    'احكم على التصميم بالمبادئ الأربعة (التباين، والتكرار، والمحاذاة، والتقارب)، ثم التسلسل البصري، والمساحة البيضاء، والألوان، والخط، والصور، والتوازن، ووضوح الرسالة، والاتساق مع الهوية.',
    'التصميم الجيد يُقرأ في ثلاث ثوانٍ: عنصر أول واحد واضح، ثم ثانٍ، ثم تفاصيل. إن تساوى كل شيء فلا شيء مهم.',
    'التباين يجب أن يكون صريحاً لا خجولاً: إن اختلف عنصران فليختلفا كثيراً (حجماً أو وزناً أو لوناً).',
    'كل عنصر يُحاذى إلى شيء آخر؛ في العربية الأصل المحاذاة إلى اليمين، والتوسيط لسطور قليلة متوازنة.',
    'ما يرتبط معنىً يُقرَّب مكاناً؛ وما يختلف يُفصل بمسافة واضحة.',
    'المساحة البيضاء أداة لا فراغ: هوامش سخية حول النص تُعلي قيمته.',
    'لونان أو ثلاثة من الهوية تكفي؛ الأكثر إشباعاً لِما يجب أن يُرى أولاً.',
    'النص فوق الصورة يحتاج طبقة تعتيم أو تدرجاً أو مساحة هادئة.',
    'لا تقترح صوراً لطلاب ولا ما يخالف الحشمة والبيئة الإسلامية.'].join('\n') },
  { id: 'arabic-type', name: 'الخط العربي', kinds: ['review', 'design', 'creative', 'spell', 'caption', 'outline', 'refine'], text: [
    'العنوان العربي القصير أقوى: من ثلاث إلى ست كلمات. والسطر المثالي للنص من ٨ إلى ١٢ كلمة.',
    'تباعد الأسطر في العربية أوسع منه في اللاتينية (نحو ١٫٥ للنص و١٫١–١٫٢ للعناوين الكبيرة).',
    'لا تمدّ الحروف (الكشيدة) إلا لحاجة تصميمية مقصودة، ولا تُميل الخط العربي، ولا تُباعد بين حروفه.',
    'خطّان كحد أقصى في التصميم: واحد للعناوين وواحد للنص، ويُصنع التدرج بالوزن والحجم.',
    'الأرقام نوع واحد في التصميم كله (عربية مشرقية أو غربية).',
    'الهمزات والتاء المربوطة والألف المقصورة تُكتب صحيحة؛ والتشكيل حيث يرفع اللبس، وكاملاً في الآيات.'].join('\n') },
  { id: 'ad-copy', name: 'كاتب الإعلانات', kinds: ['design', 'creative', 'refine', 'brief'], text: [
    'العنوان يحمل الفكرة أو الفائدة لا الاسم الإداري للفعالية: «وقتك *رأس مالك*» أقوى من «ورشة إدارة الوقت». فإن ذكر المستخدم عنواناً بين «» فهو العنوان كما هو.',
    'كلمة واحدة فقط بين *نجمتين*: جوهر الرسالة (اسم أو صفة)، لا حرف جر ولا اسم المقدّم.',
    'السطر الفرعي يقول ما الحدث وماذا يكسب الحاضر، من ٥ إلى ١٠ كلمات، بلا تكرار للعنوان.',
    'نوع الفعالية بكلمة أو كلمتين: «ورشة عمل»، «لقاء أسري»، «مسابقة حفظ». والمقدّم بلقبه كما ذُكر: «أ. سامر»، «الشيخ خالد».',
    'الوقت والمكان مختصران: «الخميس ٨:٠٠ م»، «بعد العشاء»، «عبر زوم»، «مسجد الحي». لا «يوم» ولا «الساعة» زائدة.',
    'لا رموز تعبيرية في التصميم، ولا علامات تعجب متتالية، ولا «ندعوكم للحضور» في العنوان، ولا تشكيل إلا لرفع اللبس.',
    'التزم بحد كل خانة بالأحرف؛ والقصير الواضح أفضل من الطويل المحشو. لا تكرر المعلومة في خانتين.',
    'أمثلة جيدة:',
    '- ورشة لإدارة الوقت للطلاب، أ. سامر، الأحد بعد العصر، زوم ← العنوان «وقتك *رأس مالك*»، الفرعي «ورشة عملية في ترتيب الأولويات وصناعة يوم منجز»، النوع «ورشة عمل».',
    '- لقاء لأولياء الأمور عن الحوار مع الأبناء ← «بيوتٌ *تُصغي*»، «لقاء أسري في فن الحوار مع الأبناء».',
    '- مسابقة حفظ سورة الملك في أسبوع ← «*الملك* في صدري»، «سبعة أيام للحفظ ثم التسميع»، النوع «مسابقة حفظ».',
    '- تهنئة لفائز بالمركز الأول ← «نهنّئ *بطلنا*»، «تميّز في مسابقة الحفظ، جعله الله قرة عين لوالديه». والاسم يكتبه المستخدم.',
    '- تذكير بقيام الليل ← «*ركعتان* في جوف الليل»، والآية أو الحديث يُترك موضعهما للمستخدم.'].join('\n') },
  { id: 'caption-voice', name: 'صوت قناة البرنامج', kinds: ['caption'], text: [
    'الرسالة تبدأ بسطر جاذب قصير، ثم التفاصيل في أسطر مرتبة برموز بسيطة، ثم دعوة واضحة للعمل والرابط.',
    'لغة عربية فصيحة قريبة دافئة، بلا مبالغة ولا كثرة رموز تعبيرية (اثنان أو ثلاثة كحد أقصى).',
    'الوسم والتوقيع في آخر الرسالة كما في قوالب البرنامج.'].join('\n') },
  { id: 'lesson-deck', name: 'من الدرس إلى العرض', kinds: ['outline'], text: [
    'شريحة واحدة = فكرة واحدة. العنوان جملة تحمل الفكرة لا كلمة عامة.',
    'النقاط ثلاث إلى خمس، كل نقطة سطر واحد. الاقتباس الحرفي يُنقل كما هو مع نسبته.',
    'ابدأ بسؤال أو مشكلة تشدّ الحاضرين، واختم بخلاصة عملية.'].join('\n') },
  { id: 'coach', name: 'المدرّب', kinds: ['week'], text: 'أسلوبك أسلوب مدرّب صادق مشجّع: تمدح المحدد لا العام، وتقترح خطوة صغيرة قابلة للتنفيذ، وتربط التحسن بمبدأ تصميمي.' },
  { id: 'safety', name: 'الضوابط', kinds: ['*'], text: 'لا تطلب بيانات شخصية ولا تُخرجها. لا محتوى يخالف الشريعة أو الحشمة. الآيات والأحاديث لا تُكتب من الذاكرة؛ اترك موضعها للمستخدم ليدرجها من «آية أو حديث موثّق».' }
];
function aiSkills_() {
  var saved = readJson_('aiskills.json', {}), out = [];
  AI_SKILLS.forEach(function (d) { var o = saved[d.id]; out.push(Object.assign({}, d, o || {}, { builtin: true, edited: !!o })); });
  Object.keys(saved).forEach(function (k) { if (!AI_SKILLS.some(function (d) { return d.id === k; }) && !saved[k].deleted) out.push(Object.assign({ id: k, builtin: false }, saved[k])); });
  return out;
}
function skillsFor_(kind) {
  var l = aiSkills_().filter(function (x) { return x.on !== false && !x.deleted && ((x.kinds || []).indexOf(kind) >= 0 || (x.kinds || []).indexOf('*') >= 0); });
  return l.length ? '\n\n' + l.map(function (x) { return '## مهارة: ' + x.name + '\n' + x.text; }).join('\n\n') : '';
}
function ai_skills(token) { var a = auth_(token); needAdmin_(a); return JSON.stringify(aiSkills_()); }
function ai_skill_save(token, json) {
  var a = auth_(token); if (!isSuper_(a)) throw new Error('للمدير العام');
  var m = JSON.parse(json), id = m.id ? String(m.id).replace(/[^\w-]/g, '').slice(0, 40) : 'sk_' + uid_().slice(0, 8);
  return withLock_(function () {
    var saved = readJson_('aiskills.json', {});
    saved[id] = { name: clip_(m.name || 'مهارة', 60), kinds: (m.kinds || []).slice(0, 12).map(function (k) { return clip_(k, 20); }), text: clip_(m.text, 6000), on: m.on !== false, deleted: !!m.deleted, by: a.name, at: now_() };
    writeJson_('aiskills.json', saved); audit_(a, 'عدّل مهارة للمساعد', saved[id].name); return JSON.stringify(Object.assign({ id: id }, saved[id]));
  });
}
function ai_skill_reset(token, id) {
  var a = auth_(token); if (!isSuper_(a)) throw new Error('للمدير العام');
  return withLock_(function () { var saved = readJson_('aiskills.json', {}); delete saved[id]; writeJson_('aiskills.json', saved); return 'ok'; });
}

/* ================= الإصدار الخامس (يبقى حتى يكتمل الانتقال) ================= */
function api_ping() { return 'ok'; }
function api_packs() {
  var pf = filesIn_(IDS.packs);
  var off = packsOff_();
  return JSON.stringify(Object.keys(pf).filter(function (n) { return /\.js$/i.test(n) && off.indexOf(n) < 0; }).sort().map(function (n) {
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
var SEED_IDENTITIES = /*SEED_IDENTITIES*/[];
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
var OPEN_FONTS = /*OPEN_FONTS*/[];
function bootstrap() {
  JC = {};
  var log = [];
  ensureTriggers_(log);
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

/* ================= صور مجانية (Pexels) وآيات وأحاديث موثقة ================= */
// مفتاح Pexels في خصائص السكربت PEXELS_KEY. البحث للمستخدمين، والصورة تُحفظ بأصلها كاملاً في مكتبة المستخدم،
// ومن أراد إضافتها لمكتبة البرنامج يطلب، فيوافق مشرف البرنامج.
function imgProvider_() {
  var px = props_().getProperty('PEXELS_KEY'), pb = props_().getProperty('PIXABAY_KEY'), pref = settings_().imgProvider || '';
  if (pref === 'openverse') return 'openverse';
  if (pref === 'pixabay' && pb) return 'pixabay'; if (pref === 'pexels' && px) return 'pexels';
  if (px) return 'pexels'; if (pb) return 'pixabay';
  return 'openverse';   // بلا مفتاح: Openverse (صور بتراخيص المشاع الإبداعي من فليكر وويكيميديا وغيرهما)
}
// Openverse: بلا مفتاح، ويعمل من المتصفح مباشرة أيضاً (المتصفح يستعمله أولاً، وهذا احتياط)
function openverseSearch_(q, page, orient) {
  var ar = orient === 'portrait' ? 'tall' : orient === 'landscape' ? 'wide' : orient === 'square' ? 'square' : '';
  var url = 'https://api.openverse.org/v1/images/?q=' + encodeURIComponent(q) + '&page_size=20&page=' + Math.max(1, +page || 1) + '&mature=false' + (ar ? '&aspect_ratio=' + ar : '') + '&license_type=commercial';
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: { 'User-Agent': 'AtharPlatform/6.0 (educational design platform)' } });
  if (res.getResponseCode() === 429) throw new Error('بلغنا حد البحث في Openverse الآن؛ جرّب بعد قليل');
  if (res.getResponseCode() !== 200) throw new Error('تعذّر البحث في Openverse (' + res.getResponseCode() + ')');
  var j = JSON.parse(res.getContentText());
  return { provider: 'openverse', total: j.result_count || 0, page: j.page || 1, photos: (j.results || []).map(function (p) {
    return { id: p.id, w: p.width || 0, h: p.height || 0, thumb: p.thumbnail || p.url, big: p.url, orig: p.url, by: p.creator || '', byUrl: p.creator_url || '', url: p.foreign_landing_url || '', alt: clip_(p.title || '', 160), color: '', license: (p.license ? 'CC ' + String(p.license).toUpperCase() + ' ' + (p.license_version || '') : '').trim(), licenseUrl: p.license_url || '', src: p.source || p.provider || '' };
  }) };
}
function img_search(token, q, page, orient) {
  var a = auth_(token); q = clip_(q, 100).trim(); if (!q) throw new Error('اكتب ما تبحث عنه');
  var prov = imgProvider_(), c = CacheService.getScriptCache(), ck = 'im:' + prov + ':' + Utilities.base64EncodeWebSafe(q + '|' + (page || 1) + '|' + (orient || '')).slice(0, 190), hit = c.get(ck);
  if (hit) return hit;
  var out, res;
  if (prov === 'openverse') out = openverseSearch_(q, page, orient);
  else if (prov === 'pexels') {
    var url = 'https://api.pexels.com/v1/search?query=' + encodeURIComponent(q) + '&per_page=24&page=' + (Math.max(1, +page || 1)) + (orient ? '&orientation=' + encodeURIComponent(orient) : '') + (/[؀-ۿ]/.test(q) ? '&locale=ar-SA' : '');
    res = UrlFetchApp.fetch(url, { headers: { Authorization: props_().getProperty('PEXELS_KEY') }, muteHttpExceptions: true });
    if (res.getResponseCode() === 429) throw new Error('بلغنا حد البحث هذه الساعة؛ جرّب بعد قليل');
    if (res.getResponseCode() !== 200) throw new Error('تعذّر البحث في Pexels (' + res.getResponseCode() + '): ' + clip_(res.getContentText().replace(/<[^>]+>/g, ' ').trim(), 120));
    var j = JSON.parse(res.getContentText());
    out = { provider: 'pexels', total: j.total_results || 0, page: j.page || 1, photos: (j.photos || []).map(function (p) {
      return { id: p.id, w: p.width, h: p.height, thumb: p.src.medium, big: p.src.large2x, orig: p.src.original, by: p.photographer, byUrl: p.photographer_url, url: p.url, alt: clip_(p.alt, 160), color: p.avg_color };
    }) };
  } else {
    var o2 = orient === 'portrait' ? 'vertical' : orient === 'landscape' ? 'horizontal' : 'all';
    var url2 = 'https://pixabay.com/api/?key=' + encodeURIComponent(props_().getProperty('PIXABAY_KEY')) + '&q=' + encodeURIComponent(q) + '&image_type=photo&safesearch=true&per_page=24&page=' + (Math.max(1, +page || 1)) + '&orientation=' + o2 + (/[؀-ۿ]/.test(q) ? '&lang=ar' : '');
    res = UrlFetchApp.fetch(url2, { muteHttpExceptions: true });
    if (res.getResponseCode() === 429) throw new Error('بلغنا حد البحث هذه الدقيقة؛ جرّب بعد قليل');
    if (res.getResponseCode() !== 200) throw new Error('تعذّر البحث في Pixabay (' + res.getResponseCode() + '): ' + clip_(res.getContentText().replace(/<[^>]+>/g, ' ').trim(), 120));
    var j2 = JSON.parse(res.getContentText());
    out = { provider: 'pixabay', total: j2.totalHits || 0, page: Math.max(1, +page || 1), photos: (j2.hits || []).map(function (p) {
      return { id: p.id, w: p.imageWidth, h: p.imageHeight, thumb: String(p.webformatURL || '').replace('_640', '_340'), big: p.largeImageURL, orig: p.fullHDURL || p.imageURL || p.largeImageURL, by: p.user, byUrl: 'https://pixabay.com/users/' + encodeURIComponent(p.user) + '-' + p.user_id + '/', url: p.pageURL, alt: clip_(p.tags, 160), color: '' };
    }) };
  }
  var txt = JSON.stringify(out); if (txt.length < 90000) c.put(ck, txt, 3600);
  return txt;
}
function img_test(token) { var a = auth_(token); needAdmin_(a); var prov = imgProvider_(); var r = JSON.parse(img_search(token, 'nature', 1, '')); return JSON.stringify({ provider: prov, total: r.total, n: r.photos.length }); }
// حفظ صورة بأصلها الكامل في مكتبة المستخدم (أو البرنامج إن كان مشرفه)، واختيارياً طلب إضافتها لمكتبة البرنامج
function img_pick(token, json) {
  var a = auth_(token), m = JSON.parse(json);
  // أي رابط https لصورة: Openverse يعيد صوراً من مصادر كثيرة (فليكر، ويكيميديا…)، وPixabay وPexels، والصور المولَّدة
  if (!/^https:\/\/[\w.\-]+\/\S+$/.test(m.orig || '') || /^https:\/\/(script\.google\.com|drive\.google\.com|localhost)/.test(m.orig)) throw new Error('رابط غير مقبول');
  if (!perm_(a, 'upload') && readJson_('settings.json', {}).uploadsNeedPerm) throw new Error('إضافة الصور تحتاج صلاحية من المشرف');
  var res = UrlFetchApp.fetch(m.orig, { muteHttpExceptions: true, followRedirects: true, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AtharPlatform/6.0)' } });
  if (res.getResponseCode() !== 200) throw new Error('تعذّر تنزيل الصورة (' + res.getResponseCode() + ')');
  var blob = res.getBlob(); var bytes = blob.getBytes(); if (bytes.length > 27 * 1024 * 1024) throw new Error('الصورة أكبر من المسموح');
  var srcName = clip_(m.src || (/pixabay/.test(m.orig) ? 'Pixabay' : /pexels/.test(m.orig) ? 'Pexels' : /pollinations/.test(m.orig) ? 'توليد بالذكاء' : /wikimedia/.test(m.orig) ? 'Wikimedia Commons' : 'Openverse'), 40);
  var mime = blob.getContentType() || '', name = clip_(m.name || m.alt || ('صورة من ' + srcName), 120);
  // نوع الصورة من بايتاتها الأولى (أوثق من ترويسة الخادم أو امتداد الرابط)
  var b0 = bytes[0] & 255, b1 = bytes[1] & 255, head = String.fromCharCode.apply(null, bytes.slice(0, 64).map(function (b) { return b & 255; }));
  var sniff = (b0 === 0x89 && b1 === 0x50) ? 'image/png' : (b0 === 0xff && b1 === 0xd8) ? 'image/jpeg' : (b0 === 0x52 && b1 === 0x49) ? 'image/webp' : (b0 === 0x47 && b1 === 0x49) ? 'image/gif' : /^\s*<(\?xml|svg)/i.test(head) ? 'image/svg+xml' : '';
  mime = sniff || (/^image\//.test(mime) ? mime : '');
  if (!/^image\//.test(mime)) throw new Error('الرابط ليس صورة');
  var toProg = !!m.program && adminOf_(a, m.program), scope = toProg ? 'program' : 'user';
  var fileId = sub_('assets').createFile(Utilities.newBlob(bytes, mime, name + (mime === 'image/png' ? '.png' : mime === 'image/webp' ? '.webp' : mime === 'image/svg+xml' ? '.svg' : '.jpg'))).getId();
  var x = withLock_(function () {
    var reg = regName_(scope, a.uid), list = readJson_(reg, []);
    var it = { id: scope === 'user' ? a.uid + '_' + uid_() : uid_(), at: now_(), owner: a.uid, ownerName: a.name, ver: 1, upd: now_(), kind: 'image', name: name, mime: mime, scope: scope, program: toProg ? m.program : '', fileId: fileId, size: bytes.length, key: '', thumb: /^https:\/\/[\w.\-]+\/\S+$/.test(m.thumb || '') ? clip_(m.thumb, 400) : '', data: null,
      tags: clip_(srcName + ' ' + (m.by || ''), 120), credit: { by: clip_(m.by, 80), byUrl: clip_(m.byUrl, 200), url: clip_(m.url, 200), src: srcName, license: clip_(m.license || '', 60), licenseUrl: clip_(m.licenseUrl || '', 200), prompt: clip_(m.prompt || '', 300) } };
    list.unshift(it); writeJson_(reg, list); return it;
  });
  var req = null;
  if (!toProg && m.program && m.suggest && inProg_(a, m.program)) {
    req = withLock_(function () {
      var l = readJson_('imgreq.json', []);
      var r = { id: uid_(), at: now_(), uid: a.uid, name: a.name, program: m.program, asset: x.id, title: name, thumb: clip_(m.thumb, 300), by: clip_(m.by, 80), url: clip_(m.url, 200), status: 'new' };
      l.unshift(r); if (l.length > 500) l.length = 500; writeJson_('imgreq.json', l); return r;
    });
  }
  return JSON.stringify({ asset: assetPub_(x), request: req });
}
function img_requests(token, program) {
  var a = auth_(token); needAdmin_(a);
  return JSON.stringify(readJson_('imgreq.json', []).filter(function (r) { return adminOf_(a, r.program) && (!program || r.program === program); }));
}
// موافقة المشرف: تُنسخ الصورة من مكتبة المستخدم إلى مكتبة البرنامج (الملف نفسه، بلا تنزيل جديد)
function img_decide(token, id, ok) {
  var a = auth_(token);
  return withLock_(function () {
    var l = readJson_('imgreq.json', []), r = null; l.forEach(function (x) { if (x.id === id) r = x; });
    if (!r) throw new Error('الطلب غير موجود'); if (!adminOf_(a, r.program)) throw new Error('ليس من برامجك');
    if (ok) {
      var ua = readJson_('ua_' + r.uid + '.json', []), src = null; ua.forEach(function (x) { if (x.id === r.asset) src = x; });
      if (!src || !src.fileId) throw new Error('صورة الطلب لم تعد موجودة');
      var copy = DriveApp.getFileById(src.fileId).makeCopy(sub_('assets'));
      var reg = readJson_('assets.json', []);
      reg.unshift({ id: uid_(), at: now_(), owner: a.uid, ownerName: a.name, ver: 1, upd: now_(), kind: 'image', name: src.name, mime: src.mime, scope: 'program', program: r.program, fileId: copy.getId(), size: src.size, key: '', thumb: '', data: null, tags: src.tags || '', credit: src.credit || null, from: r.name });
      writeJson_('assets.json', reg);
      audit_(a, 'أضاف صورة مقترحة للبرنامج', src.name + ' · ' + r.program);
    }
    r.status = ok ? 'ok' : 'no'; r.by2 = a.name; r.at2 = now_();
    writeJson_('imgreq.json', l); return JSON.stringify(r);
  });
}
// آيات بنص موثّق من alquran.cloud (رواية حفص، رسم إملائي مشكول يناسب خطوط التصميم)، وأحاديث من الدرر السنية بحكم المحدث
function quran_find(token, q) {
  auth_(token); q = clip_(q, 120).trim(); if (!q) throw new Error('اكتب كلمة من الآية أو اسم السورة ورقم الآية');
  var c = CacheService.getScriptCache(), ck = 'qr:' + Utilities.base64EncodeWebSafe(q).slice(0, 200), hit = c.get(ck); if (hit) return hit;
  var out = [], m = q.match(/^(.+?)\s+(\d{1,3})(?:\s*[-–:]\s*(\d{1,3}))?$/);
  if (m) {
    var norm = function (t) { return String(t).replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '').replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627').replace(/^\u0633\u0648\u0631\u0629\s*/, '').replace(/^\u0627\u0644/, '').replace(/\s+/g, ''); };
    var surahs = quranSurahs_(), name = norm(m[1]), sn = 0;
    surahs.forEach(function (s) { if (!sn && norm(s.name) === name) sn = s.number; });
    if (sn) {
      var a1 = +m[2], a2 = m[3] ? +m[3] : a1; if (a2 < a1) a2 = a1; if (a2 - a1 > 9) a2 = a1 + 9;
      for (var n = a1; n <= a2; n++) {
        var r = UrlFetchApp.fetch('https://api.alquran.cloud/v1/ayah/' + sn + ':' + n + '/quran-simple', { muteHttpExceptions: true });
        if (r.getResponseCode() === 200) { var d = JSON.parse(r.getContentText()).data; out.push({ text: d.text, surah: surahLabel_(d.surah.name), sn: d.surah.number, n: d.numberInSurah }); }
      }
    }
  }
  if (!out.length) {
    var r2 = UrlFetchApp.fetch('https://api.alquran.cloud/v1/search/' + encodeURIComponent(q) + '/all/quran-simple', { muteHttpExceptions: true });
    if (r2.getResponseCode() === 200) { var dd = JSON.parse(r2.getContentText()).data; (dd.matches || []).slice(0, 30).forEach(function (x) { out.push({ text: x.text, surah: surahLabel_(x.surah.name), sn: x.surah.number, n: x.numberInSurah }); }); }
  }
  var txt = JSON.stringify(out); c.put(ck, txt, 21600); return txt;
}
function surahLabel_(n) { return String(n || '').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').replace(/^سورة\s*/, '').trim(); }
function quranSurahs_() {
  var c = CacheService.getScriptCache(), hit = c.get('qsurahs'); if (hit) return JSON.parse(hit);
  var r = UrlFetchApp.fetch('https://api.alquran.cloud/v1/surah', { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('تعذّر الوصول إلى مصدر القرآن');
  var l = JSON.parse(r.getContentText()).data.map(function (s) { return { number: s.number, name: s.name }; });
  c.put('qsurahs', JSON.stringify(l), 21600); return l;
}
// مصدران: الدرر السنية (حكم المحدث على كل حديث)، وقاعدة sunnah.com عبر api.islamic.app (الصحيحان والسنن ورياض الصالحين…).
// src: 'dorar' أو 'sunnah'. الافتراضي: الدرر، وإن تعذّر الوصول إليها (كثيراً ما تحجب خوادم جوجل) انتقلنا إلى الثاني تلقائياً
function hadith_find(token, q, src) {
  auth_(token); q = clip_(q, 120).trim(); if (!q) throw new Error('اكتب كلمات من الحديث');
  src = src === 'sunnah' ? 'sunnah' : 'dorar';
  var c = CacheService.getScriptCache(), ck = 'hd:' + src + ':' + Utilities.base64EncodeWebSafe(q).slice(0, 190), hit = c.get(ck); if (hit) return hit;
  var txt;
  if (src === 'sunnah') txt = JSON.stringify(sunnahSearch_(q));
  else { try { txt = JSON.stringify(dorarSearch_(q)); } catch (e) { var alt = sunnahSearch_(q); alt.forEach(function (h) { h.fallback = true; }); if (!alt.length) throw e; txt = JSON.stringify(alt); } }
  if (txt.length < 90000) c.put(ck, txt, 21600); return txt;
}
var SUNNAH_BOOKS = { bukhari: 'صحيح البخاري', muslim: 'صحيح مسلم', nasai: 'سنن النسائي', abudawud: 'سنن أبي داود', tirmidhi: 'جامع الترمذي', ibnmajah: 'سنن ابن ماجه', malik: 'موطأ مالك', ahmad: 'مسند أحمد', darimi: 'سنن الدارمي', adab: 'الأدب المفرد', shamail: 'الشمائل المحمدية', riyadussalihin: 'رياض الصالحين', mishkat: 'مشكاة المصابيح', bulugh: 'بلوغ المرام', forty: 'الأربعون النووية', hisn: 'حصن المسلم', virtues: 'فضائل الآيات والسور' };
function sunnahSearch_(q) {
  var r = UrlFetchApp.fetch('https://api.islamic.app/v1/hadith/search?q=' + encodeURIComponent(q) + '&lang=ar&limit=25', { muteHttpExceptions: true, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AtharPlatform/6.0)' } });
  if (r.getResponseCode() !== 200) throw new Error('تعذّر الوصول إلى مصدر الأحاديث (' + r.getResponseCode() + ')');
  var j = JSON.parse(r.getContentText()), list = (j.data && j.data.results) || [], out = [];
  list.forEach(function (x) {
    var ar = x.ar || {}; if (!ar.text) return;
    var grade = (ar.grades && ar.grades[0] && ar.grades[0].grade) || ((x.collection === 'bukhari' || x.collection === 'muslim') ? 'صحيح' : '');
    out.push({ text: matnOf_(ar.text), full: clip_(ar.text, 4000), rawi: '', muhaddith: x.collection === 'bukhari' ? 'البخاري' : x.collection === 'muslim' ? 'مسلم' : '', source: SUNNAH_BOOKS[x.collection] || x.collection, page: String(x.hadithNumber || ''), grade: grade, sahih: /صحيح|حسن/.test(grade) && !/ضعيف|موضوع|منكر/.test(grade), src: 'sunnah' });
  });
  return out;
}
// المتن بلا السند: ما بين علامتي التنصيص إن وُجدتا، وإلا ما بعد «صلى الله عليه وسلم قال/يقول»، وإلا ما بعد أول «قال» للراوي؛ وبلا تعليق الترمذي وأبي داود بعده
function matnOf_(t) {
  var s = String(t || '').replace(/\s+/g, ' ').replace(/\u200f/g, '').trim();
  s = s.replace(/\s*قَالَ أَبُو عِيسَى[\s\S]*$/, '').replace(/\s*قَالَ أَبُو دَاوُدَ[\s\S]*$/, '').trim();
  var qs = s.match(/"\s*([^"]{20,})\s*"/g);
  if (qs) return qs.map(function (x) { return x.replace(/^"\s*|\s*"$/g, ''); }).join(' ').replace(/\s*\.\s*$/, '').trim();
  var m = s.match(/صلى الله عليه وسلم\s*[:،]?\s*(?:قَالَ|يَقُولُ|فَقَالَ|قَالَتْ|فَقَالَتْ)\s*[:«]?\s*([\s\S]{20,})$/);
  if (!m) m = s.match(/(?:^|[،,.]\s*|\s)(?:قَالَ|قَالَتْ)\s+([\s\S]{25,})$/);
  var body = m ? m[1] : s;
  return body.replace(/^[«"\s]+|[»"\s.]+$/g, '').trim();
}
function dorarSearch_(q) {
  var r; try { r = UrlFetchApp.fetch('https://dorar.net/dorar_api.json?skey=' + encodeURIComponent(q), { muteHttpExceptions: true, followRedirects: true, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AtharPlatform/6.0)' } }); } catch (e) { throw new Error('تعذّر الوصول إلى الدرر السنية: ' + clip_(String(e && e.message || e), 120)); }
  if (r.getResponseCode() !== 200) throw new Error('تعذّر الوصول إلى الدرر السنية (' + r.getResponseCode() + ')');
  var html = ''; try { html = JSON.parse(r.getContentText()).ahadith.result || ''; } catch (e) { throw new Error('رد غير مفهوم من الدرر السنية: ' + clip_(r.getContentText().replace(/\s+/g, ' '), 100)); }
  var strip = function (h) { return String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'").replace(/\s+/g, ' ').trim(); };
  var fields = function (info) { var o = {}, re2 = /(خلاصة حكم المحدث|الصفحة أو الرقم|الراوي|المحدث|المصدر|التخريج)\s*:/g, hits = [], h; while ((h = re2.exec(info))) hits.push({ k: h[1], s: h.index, e: h.index + h[0].length }); hits.forEach(function (x, idx) { o[x.k] = info.slice(x.e, idx + 1 < hits.length ? hits[idx + 1].s : info.length).replace(/[|•]/g, ' ').trim(); }); return o; };
  // كل نتيجة: كتلة نص الحديث ثم كتلة معلوماته. نقسم على كتل المعلومات ونأخذ آخر كتلة حديث قبل كل واحدة
  var out = [], parts = html.split(/<div[^>]*class="[^"]*hadith-info[^"]*"[^>]*>/);
  for (var pi = 0; pi + 1 < parts.length && out.length < 20; pi++) {
    var before = parts[pi], infoRaw = parts[pi + 1];
    var hi = before.lastIndexOf('class="hadith"'); if (hi < 0) hi = before.lastIndexOf("class='hadith'"); if (hi < 0) continue;
    var textHtml = before.slice(before.indexOf('>', hi) + 1), infoHtml = infoRaw.split(/<\/div>/)[0];
    var text = strip(textHtml.replace(/<\/div>[\s\S]*$/, '')), f = fields(strip(infoHtml)), grade = f['خلاصة حكم المحدث'] || '';
    if (!text) continue;
    out.push({ text: text, rawi: f['الراوي'] || '', muhaddith: f['المحدث'] || '', source: f['المصدر'] || '', page: f['الصفحة أو الرقم'] || '', grade: grade, sahih: /صحيح|حسن|ثابت|إسناده جيد/.test(grade) && !/ضعيف|موضوع|منكر|لا يصح|باطل|لا أصل/.test(grade) });
  }
  if (!out.length && html.length > 200) throw new Error('تغيّر شكل صفحة الدرر السنية؛ أبلغ المطوّر');
  out.forEach(function (h) { h.src = 'dorar'; });
  return out;
}
