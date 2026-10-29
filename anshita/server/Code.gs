/* =====================================================================
   منصة الأنشطة التربوية — الخادم (Google Apps Script)
   أكاديمية الجيل الصاعد الإلكترونية
   ---------------------------------------------------------------------
   - التخزين: ملفات JSON في مجلد درايف «منصة الأنشطة التربوية — البيانات».
   - الواجهة على GitHub Pages وتتصل بهذا الخادم: POST {fn, args} → {result} أو {error}.
   - حسابان فقط: الإدارة (كل المسارات) والفريق (مسار واحد).
     الفريق يرى خطة مساره كاملة، ولا يعدّلها إلا إذا فتح له المدير «تعديل الخطة».
     المتابعة (تم التنفيذ، ملاحظة، رابط) متاحة للفريق دائماً.
   - تقويم جوجل: المدير يختار ما يُرسل، ثم يبقى الحدث محدَّثاً مع تعديل النشاط.
   - بوت تليجرام: تذكير قبل اللقاء بثلاثة أيام (إعداد الإعلان) وقبله بيوم (نشره)،
     وملخص أسبوعي، وتنبيه عند نقل لقاء قريب أو إلغائه.
   أول تشغيل: شغّل setup() من المحرر مرة، ثم انشر «تطبيق ويب» (يُنفَّذ باسمك، متاح لأي شخص).
   ===================================================================== */
var VERSION = '1.0.0';
var SITE_URL = 'https://ghamine23.github.io/media-portal/anshita/';
var DATA_DIR_NAME = 'منصة الأنشطة التربوية — البيانات';
var SESSION_DAYS = 60;

var TRACKS_SEED = [
  { id: 'sanabel', name: 'سنابل', full: 'مسار سنابل', color: '#5a5881', age: '٧–٩ سنوات', cohort: '', sems: 6, cur: 2, calColor: '9' },
  { id: 'budhoor', name: 'بذور', full: 'مسار بذور', color: '#672e8f', age: '١٠–١٢ سنة', cohort: 'الدفعة ٣', sems: 6, cur: 2, calColor: '3' },
  { id: 'judhoor', name: 'جذور', full: 'مسار جذور', color: '#467839', age: '١٣–١٤ سنة', cohort: 'الدفعة ٤', sems: 6, cur: 2, calColor: '10' },
  { id: 'ishraq', name: 'إشراق', full: 'مسار إشراق', color: '#f4793d', age: '١٥–١٨ سنة', cohort: 'الدفعة ٤', sems: 6, cur: 2, calColor: '6' },
  { id: 'ithmar2', name: 'إثمار ٢', full: 'مسار إثمار · الدفعة ٢', color: '#8a1e50', age: 'خريجو جذور وإشراق', cohort: 'الدفعة ٢', sems: 8, cur: 8, calColor: '11' },
  { id: 'ithmar3', name: 'إثمار ٣', full: 'مسار إثمار · الدفعة ٣', color: '#a8326a', age: 'خريجو جذور وإشراق', cohort: 'الدفعة ٣', sems: 8, cur: 2, calColor: '4' }
];
var TYPES = ['لقاء', 'كتابي', 'المجموعة التفاعلية', 'مسابقة', 'كاهوت', 'تحدٍّ', 'استضافة', 'أخرى'];
var DAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
var MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
var ORD = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن'];

var DEFAULTS = {
  remindHour: 10,                      // ساعة إرسال التذكيرات (بتوقيت المشروع)
  remindTypes: ['لقاء', 'استضافة'],    // أنواع الأنشطة التي يُذكَّر بها
  digest: { on: true, dow: 0, hour: 9 },  // الملخص الأسبوعي للمجموعات: dow بترتيب المنصة (٠ = السبت)
  adminDigest: true,                   // ملخص الإدارة الأسبوعي (إن رُبطت محادثة للإدارة)
  notifyChanges: true,                 // تنبيه المجموعة إذا نُقل لقاء قريب أو أُلغي
  groupsPaused: false,                 // إيقاف مؤقت لكل ما يرسله البوت في المجموعات (يبقى الخاص مع الإدارة)
  durMin: 60,                          // مدة الحدث في التقويم إن لم تُحدَّد
  calId: '',                           // فارغ = التقويم الأساسي لصاحب السكربت
  tpl: {
    d3: 'تذكير: {العنوان}\nموعده {الموعد} ({متى}).\nحان وقت تصميم إعلان اللقاء وإعداد نصّه.\nالمسؤول: {المسؤول}',
    d1: 'تذكير: {العنوان}\nموعده {الموعد} ({متى}).\nاليوم موعد نشر إعلان اللقاء.\nالمسؤول: {المسؤول}'
  }
};

/* ================= نقطة الاتصال ================= */
function apiFns_() {
  return {
    info: info, login: login,
    boot: boot, revs: revs, plan: plan, pass: pass,
    act_save: act_save, act_del: act_del,
    day_save: day_save, sem_put: sem_put, sem_import: sem_import, sem_del: sem_del,
    track_save: track_save, settings_save: settings_save, log_list: log_list,
    acc_list: acc_list, acc_save: acc_save, acc_reset: acc_reset, acc_del: acc_del,
    cal_list: cal_list, cal_set: cal_set, cal_push: cal_push,
    tg_token: tg_token, tg_status: tg_status, tg_poll: tg_poll, tg_assign: tg_assign, tg_test: tg_test, remind_now: remind_now,
    tg_check: tg_check, edit_request: edit_request,
    ui_fonts: ui_fonts, ui_font_get: ui_font_get, font_put: font_put,
    report_key: report_key, report_data: report_data, report_send: report_send, report_list: report_list,
    alerts: alerts, alerts_seen: alerts_seen, meet_create: meet_create, meet_unlink: meet_unlink,
    login_atar: login_atar, atar_links: atar_links, atar_link: atar_link, atar_unlink: atar_unlink
  };
}
function doPost(e) {
  var out; JC = {};
  try {
    var req = JSON.parse(e.postData.contents);
    var fn = apiFns_()[req.fn];
    if (!fn) throw new Error('طلب غير معروف');
    out = { result: fn.apply(null, req.args || []) };
  } catch (err) {
    out = { error: String(err && err.message || err) };
    if (err && err.code) out.code = err.code;
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
function doGet() {
  return HtmlService.createHtmlOutput('<meta charset="utf-8"><meta http-equiv="refresh" content="0;url=' + SITE_URL + '"><p style="font-family:sans-serif;direction:rtl">خادم منصة الأنشطة التربوية يعمل. <a href="' + SITE_URL + '">افتح المنصة</a></p>').setTitle('منصة الأنشطة التربوية');
}
function info() { return JSON.stringify({ v: VERSION, ready: !!props_().getProperty('DATA_DIR'), tz: tz_() }); }

/* ================= التخزين ================= */
function props_() { return PropertiesService.getScriptProperties(); }
function tz_() { try { return Session.getScriptTimeZone() || 'Asia/Riyadh'; } catch (e) { return 'Asia/Riyadh'; } }
function dataFolder_() {
  var id = props_().getProperty('DATA_DIR');
  if (!id) throw new Error('الخادم لم يُجهَّز بعد: شغّل setup() من المحرر');
  return DriveApp.getFolderById(id);
}
function jfile_(name) {
  var key = 'jf_' + name, id = props_().getProperty(key);
  if (id) { try { var f0 = DriveApp.getFileById(id); if (!f0.isTrashed()) return f0; } catch (e) {} }
  var it = dataFolder_().getFilesByName(name);
  while (it.hasNext()) { var f = it.next(); if (!f.isTrashed()) { props_().setProperty(key, f.getId()); return f; } }
  return null;
}
var JC = {};   // ذاكرة الطلب الواحد
function readJson_(name, def) {
  if (JC.hasOwnProperty(name)) return JSON.parse(JC[name]);
  var c = CacheService.getScriptCache(), k = 'j:' + name, hit = c.get(k);
  if (hit != null) { JC[name] = hit; try { return JSON.parse(hit); } catch (e) {} }
  var f = jfile_(name); if (!f) return def;
  var s = f.getBlob().getDataAsString(), v;
  try { v = JSON.parse(s); } catch (e) { return def; }
  JC[name] = s;
  if (s.length < 90000) { try { c.put(k, s, 21600); } catch (e) {} }
  return v;
}
function writeJson_(name, obj) {
  var s = JSON.stringify(obj), f = jfile_(name);
  if (f) f.setContent(s);
  else { f = dataFolder_().createFile(name, s, 'application/json'); props_().setProperty('jf_' + name, f.getId()); }
  JC[name] = s;
  var c = CacheService.getScriptCache();
  try { if (s.length < 90000) c.put('j:' + name, s, 21600); else c.remove('j:' + name); } catch (e) { c.remove('j:' + name); }
}
function withLock_(fn) {
  var lock = LockService.getScriptLock(); lock.waitLock(28000);
  try { JC = {}; return fn(); } finally { lock.releaseLock(); }
}
function uid_() { return Utilities.getUuid().replace(/-/g, '').slice(0, 12); }
function now_() { return Date.now(); }
function clip_(s, n) { return String(s == null ? '' : s).slice(0, n); }
function txt_(s, n) { return clip_(s, n).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim(); }
function err_(msg, code) { var e = new Error(msg); if (code) e.code = code; return e; }

/* ================= خطوط الواجهة (ثمانية) =================
   ملفات الخط لا تُرفع إلى المستودع العام (شرط الترخيص): تُحفظ في درايف المنصة كما هي، ويقدّمها الخادم للموقع. */
function fontDir_() {
  var id = props_().getProperty('FONT_DIR');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var it = dataFolder_().getFoldersByName('fonts'), f = it.hasNext() ? it.next() : dataFolder_().createFolder('fonts');
  props_().setProperty('FONT_DIR', f.getId());
  return f;
}
function fontMeta_(name) {
  var n = String(name).toLowerCase(), fam = /serifdisplay/.test(n) ? 'thm-display' : /seriftext/.test(n) ? 'thm-text' : /sans/.test(n) ? 'thm-sans' : '';
  var w = /black/.test(n) ? 900 : /bold/.test(n) ? 700 : /medium/.test(n) ? 500 : /light/.test(n) ? 300 : 400;
  return { family: fam, weight: String(w) };
}
function ui_fonts() { return JSON.stringify(readJson_('fonts.json', [])); }
function ui_font_get(id) {
  var x = readJson_('fonts.json', []).filter(function (f) { return f.id === id; })[0];
  if (!x) throw new Error('غير موجود');
  return Utilities.base64Encode(DriveApp.getFileById(x.fileId).getBlob().getBytes());
}
// رفع ملف خط من الإدارة: name اسم الملف الأصلي، b64 محتواه
function font_put(token, name, b64) {
  var a = auth_(token); needAdmin_(a);
  name = clip_(name, 80);
  var m = fontMeta_(name); if (!m.family || !/\.otf$|\.ttf$/i.test(name)) throw new Error('ملف خط ثمانية فقط (otf)');
  var blob = Utilities.newBlob(Utilities.base64Decode(b64), 'font/otf', name);
  return JSON.stringify(withLock_(function () {
    var list = readJson_('fonts.json', []), old = list.filter(function (f) { return f.name === name; })[0];
    var file = fontDir_().createFile(blob);
    if (old) { try { DriveApp.getFileById(old.fileId).setTrashed(true); } catch (e) {} list = list.filter(function (f) { return f !== old; }); }
    var x = { id: uid_(), name: name, fileId: file.getId(), family: m.family, weight: m.weight, ver: ((old && old.ver) || 0) + 1, size: blob.getBytes().length };
    list.push(x); writeJson_('fonts.json', list);
    return { id: x.id, family: x.family, weight: x.weight, ver: x.ver };
  }));
}

/* ================= الإعدادات والمسارات ================= */
function cfg_() {
  var s = readJson_('settings.json', {}), o = JSON.parse(JSON.stringify(DEFAULTS));
  Object.keys(s).forEach(function (k) { if (k === 'tpl' || k === 'digest') o[k] = Object.assign(o[k], s[k] || {}); else o[k] = s[k]; });
  return o;
}
function tracks_() { return readJson_('tracks.json', []); }
function trackOf_(tid) {
  var t = tracks_().filter(function (x) { return x.id === tid; })[0];
  if (!t) throw new Error('المسار غير موجود');
  return t;
}
function plan_(tid) { var p = readJson_('plan_' + tid + '.json', null) || {}; p.sems = p.sems || {}; p.acts = p.acts || []; p.rev = p.rev || 0; return p; }
function savePlan_(tid, p) { p.rev = (p.rev || 0) + 1; writeJson_('plan_' + tid + '.json', p); props_().setProperty('rev_' + tid, String(p.rev)); }
function log_(a, tid, what, detail) {
  try {
    var l = readJson_('log.json', []);
    l.unshift({ at: now_(), by: a ? a.name : 'النظام', role: a ? a.role : '', t: tid || '', what: what, d: clip_(detail, 160) });
    if (l.length > 500) l.length = 500;
    writeJson_('log.json', l);
    props_().setProperty('rev_log', String(now_()));
  } catch (e) {}
}

/* ================= الحسابات والجلسات =================
   accounts.json: { uid: {uid, user, name, role: admin|team, track, salt, hash, tv, fails, lockUntil, created, last, disabled} }
   الجلسة رمز موقَّع (uid|انتهاء|إصدار) فلا تُخزَّن؛ تغيير كلمة المرور يرفع الإصدار فتسقط الجلسات القديمة. */
function secret_() {
  var s = props_().getProperty('SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); props_().setProperty('SECRET', s); }
  return s;
}
function sign_(body) { return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(body, secret_())).replace(/=+$/, ''); }
function mkToken_(a) { var body = a.uid + '|' + (now_() + SESSION_DAYS * 864e5) + '|' + (a.tv || 0); return body + '|' + sign_(body); }
var PW_IT = 150;   // عدد جولات التجزئة لكلمات المرور (الحسابات القديمة 1200 وتُرقّى عند الدخول)
function pwHash_(salt, pw, it) {
  var key = Utilities.newBlob(String(pw)).getBytes(), v = Utilities.newBlob(String(salt)).getBytes();
  for (var i = 0; i < (it || 1200); i++) v = Utilities.computeHmacSha256Signature(v, key);
  return Utilities.base64Encode(v);
}
function setPass_(x, pw) { x.salt = uid_(); x.it = PW_IT; x.hash = pwHash_(x.salt, pw, PW_IT); }
function tempPass_() {
  var abc = 'abcdefghjkmnpqrstuvwxyz23456789', s = '';
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + now_());
  for (var i = 0; i < 9; i++) s += abc.charAt((b[i] + 256) % abc.length);
  return s.slice(0, 4) + '-' + s.slice(4, 9);
}
function norm_(s) { return String(s || '').trim().toLowerCase(); }
function accs_() { return readJson_('accounts.json', {}); }
function pubAcc_(a) { return { uid: a.uid, user: a.user, name: a.name, role: a.role, track: a.track || '', created: a.created || 0, last: a.last || 0, disabled: !!a.disabled, atar: a.atar || '' }; }
function meOf_(a) { return { uid: a.uid, user: a.user, name: a.name, role: a.role, track: a.track || '', atar: !!a.atar }; }
function auth_(token) {
  var p = String(token || '').split('|');
  if (p.length !== 4 || sign_(p.slice(0, 3).join('|')) !== p[3]) throw err_('ادخل أولاً', 'auth');
  if (+p[1] < now_()) throw err_('انتهت الجلسة، ادخل مرة أخرى', 'auth');
  var a = accs_()[p[0]];
  if (!a || a.disabled) throw err_('هذا الحساب موقوف', 'auth');
  if (String(a.tv || 0) !== p[2]) throw err_('تغيّرت كلمة المرور، ادخل مرة أخرى', 'auth');
  if (now_() - (a.last || 0) > 6 * 3600e3) {
    try { withLock_(function () { var all = accs_(); if (all[a.uid]) { all[a.uid].last = now_(); writeJson_('accounts.json', all); } }); } catch (e) {}
  }
  return a;
}
function needAdmin_(a) { if (a.role !== 'admin') throw new Error('هذا للإدارة'); }
function canView_(a, tid) { if (a.role !== 'admin' && a.track !== tid) throw new Error('هذا المسار ليس من صلاحيتك'); }
function canEdit_(a, tid) {
  canView_(a, tid);
  if (a.role === 'admin') return;
  if (!trackOf_(tid).canEdit) throw new Error('تعديل الخطة مغلق، ويفتحه المدير العام');
}

function login(user, pw) {
  user = norm_(clip_(user, 60)); pw = String(pw || '');
  if (!user || !pw) throw new Error('اكتب اسم المستخدم وكلمة المرور');
  return withLock_(function () {
    var all = accs_(), a = null;
    Object.keys(all).forEach(function (k) { if (norm_(all[k].user) === user) a = all[k]; });
    if (!a || a.atar) throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    if (a.disabled) throw new Error('هذا الحساب موقوف');
    if (a.lockUntil && a.lockUntil > now_()) throw new Error('محاولات كثيرة، حاول بعد دقائق');
    if (pwHash_(a.salt, pw, a.it) !== a.hash) {
      a.fails = (a.fails || 0) + 1;
      if (a.fails >= 8) { a.lockUntil = now_() + 10 * 60e3; a.fails = 0; }
      writeJson_('accounts.json', all);
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
    a.fails = 0; a.lockUntil = 0; a.last = now_();
    if ((a.it || 1200) !== PW_IT) setPass_(a, pw);   // ترقية التجزئة دون تغيير كلمة المرور
    writeJson_('accounts.json', all);
    return JSON.stringify({ token: mkToken_(a), me: meOf_(a) });
  });
}
/* ================= الدخول بحساب أثر =================
   الواجهة تدخل إلى أثر مباشرة (auth_login) ثم ترسل رمز أثر هنا، فنتحقق منه عند خادم أثر (auth_me) ونفتح حساب ظلٍّ:
   المدير العام في أثر = الإدارة، والحساب المربوط بمسار (atar_links.json: {atarUid: {track, name, username, at}}) = فريق ذلك المسار.
   سنابل خارج الربط بأثر، وحسابات المنصة القديمة تبقى تعمل حتى توقفها الإدارة. */
var ATAR_API = 'https://script.google.com/macros/s/AKfycbzBUiyrhbixemmecyGrcGfhWQhmUq-i7ZGKi9fgpg8OlMBJKLDkQLVbndTk5kZsakl4/exec';
var ATAR_TRACK = { judhoor: 'judhoor', budhoor: 'budhoor', ishraq: 'ishraq', ithmar2: 'ithmar', ithmar3: 'ithmar' };
function atarCall_(fn, args) {
  var r = UrlFetchApp.fetch(ATAR_API, { method: 'post', contentType: 'text/plain', payload: JSON.stringify({ fn: fn, args: args || [] }), followRedirects: true, muteHttpExceptions: true }), j = null;
  try { j = JSON.parse(r.getContentText()); } catch (e) { throw new Error('تعذّر الاتصال بأثر، حاول بعد قليل'); }
  if (j.error) throw new Error(j.error);
  var v = j.result; if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch (e) { return v; }
}
function atarTrackOf_(me, links) {
  var l = links[me.uid];
  if (l && ATAR_TRACK[l.track]) return l.track;
  // ربط تلقائي لحساب في برنامج الأكاديمية على هوية مسار واحد لا التباس فيها (إثمار له دفعتان فيحتاج ربطًا)
  if ((me.programs || []).indexOf('academy') < 0) return '';
  var c = Object.keys(ATAR_TRACK).filter(function (k) { return (me.tracks || []).indexOf(ATAR_TRACK[k]) >= 0; });
  return c.length === 1 ? c[0] : '';
}
function login_atar(atarToken) {
  var me = atarCall_('auth_me', [String(atarToken || '')]);
  if (!me || !me.uid) throw new Error('تعذّر التحقق من حساب أثر');
  if (me.disabled) throw new Error('حسابك في أثر موقوف');
  var role = '', track = '';
  if (me.role === 'super') role = 'admin';
  else { track = atarTrackOf_(me, readJson_('atar_links.json', {})); if (track) role = 'team'; }
  if (!role) throw new Error('حسابك في أثر غير مربوط بمسار في منصة الأنشطة. اطلب من الإدارة ربطه.');
  return withLock_(function () {
    var all = accs_(), uid = 'atar_' + me.uid, a = all[uid];
    if (a && a.disabled) throw new Error('هذا الحساب موقوف في منصة الأنشطة');
    if (!a) { a = all[uid] = { uid: uid, created: now_(), tv: 0 }; }
    a.atar = me.uid; a.user = 'أثر: ' + (me.username || me.email || ''); a.name = clip_(me.name || me.username, 80);
    a.role = role; a.track = role === 'team' ? track : ''; a.last = now_();
    writeJson_('accounts.json', all);
    return JSON.stringify({ token: mkToken_(a), me: meOf_(a), atar: { mustChange: !!me.mustChange, username: me.username || '' } });
  });
}
function atar_links(token) { var a = auth_(token); needAdmin_(a); return JSON.stringify(readJson_('atar_links.json', {})); }
// o = {uid: معرّف حساب أثر, track, name, username}
function atar_link(token, json) {
  var a = auth_(token); needAdmin_(a);
  var o = JSON.parse(json), uid = String(o.uid || '');
  if (!/^[a-z0-9]{6,40}$/.test(uid)) throw new Error('معرّف حساب أثر غير صحيح');
  if (!ATAR_TRACK[o.track]) throw new Error('هذا المسار خارج الربط بأثر');
  return JSON.stringify(withLock_(function () {
    var L = readJson_('atar_links.json', {});
    L[uid] = { track: o.track, name: clip_(o.name, 80), username: clip_(o.username, 80), at: now_(), by: a.name };
    writeJson_('atar_links.json', L);
    var all = accs_(), sh = all['atar_' + uid]; if (sh) { sh.role = 'team'; sh.track = o.track; sh.tv = (sh.tv || 0) + 1; writeJson_('accounts.json', all); }
    log_(a, o.track, 'ربط حساب أثر بالمسار', o.name || o.username);
    return L;
  }));
}
function atar_unlink(token, uid) {
  var a = auth_(token); needAdmin_(a);
  return JSON.stringify(withLock_(function () {
    var L = readJson_('atar_links.json', {}), x = L[uid]; delete L[uid]; writeJson_('atar_links.json', L);
    var all = accs_(), sh = all['atar_' + uid]; if (sh && sh.role !== 'admin') { sh.disabled = true; sh.tv = (sh.tv || 0) + 1; writeJson_('accounts.json', all); }
    if (x) log_(a, x.track, 'ألغى ربط حساب أثر', x.name || x.username);
    return L;
  }));
}
function pass(token, oldPw, newPw) {
  var a = auth_(token);
  newPw = String(newPw || '');
  if (newPw.length < 6) throw new Error('كلمة المرور ستة أحرف على الأقل');
  return withLock_(function () {
    var all = accs_(), x = all[a.uid];
    if (pwHash_(x.salt, oldPw, x.it) !== x.hash) throw new Error('كلمة المرور الحالية غير صحيحة');
    setPass_(x, newPw); x.tv = (x.tv || 0) + 1;
    writeJson_('accounts.json', all);
    return JSON.stringify({ token: mkToken_(x) });
  });
}
function acc_list(token) { var a = auth_(token); needAdmin_(a); var all = accs_(); return JSON.stringify(Object.keys(all).map(function (k) { return pubAcc_(all[k]); })); }
// {uid?, user, name, role, track, disabled} — عند الإنشاء تُعاد كلمة مرور مؤقتة
function acc_save(token, json) {
  var a = auth_(token); needAdmin_(a);
  var o = JSON.parse(json);
  return withLock_(function () {
    var all = accs_(), x = o.uid ? all[o.uid] : null, fresh = !x, pw = '';
    var user = norm_(txt_(o.user, 40));
    if (!/^[a-z0-9_.\-؀-ۿ]{2,40}$/.test(user)) throw new Error('اسم المستخدم حروف وأرقام بلا مسافات');
    Object.keys(all).forEach(function (k) { if (k !== (o.uid || '') && norm_(all[k].user) === user) throw new Error('اسم المستخدم مستعمل'); });
    var role = o.role === 'admin' ? 'admin' : 'team';
    var track = role === 'team' ? String(o.track || '') : '';
    if (role === 'team') trackOf_(track);
    if (fresh) { x = { uid: uid_(), created: now_(), tv: 0 }; pw = tempPass_(); setPass_(x, pw); all[x.uid] = x; }
    if (x.uid === a.uid && (role !== 'admin' || o.disabled)) throw new Error('لا يمكنك تقييد حسابك');
    x.user = user; x.name = txt_(o.name, 60) || user; x.role = role; x.track = track; x.disabled = !!o.disabled;
    writeJson_('accounts.json', all);
    log_(a, track, fresh ? 'أنشأ حساباً' : 'عدّل حساباً', x.name);
    return JSON.stringify({ acc: pubAcc_(x), pass: pw });
  });
}
function acc_reset(token, uid) {
  var a = auth_(token); needAdmin_(a);
  return withLock_(function () {
    var all = accs_(), x = all[uid]; if (!x) throw new Error('الحساب غير موجود');
    var pw = tempPass_(); setPass_(x, pw); x.tv = (x.tv || 0) + 1; x.fails = 0; x.lockUntil = 0;
    writeJson_('accounts.json', all);
    return JSON.stringify({ pass: pw, token: x.uid === a.uid ? mkToken_(x) : '' });
  });
}
function acc_del(token, uid) {
  var a = auth_(token); needAdmin_(a);
  if (uid === a.uid) throw new Error('لا يمكنك حذف حسابك');
  return withLock_(function () { var all = accs_(); if (!all[uid]) throw new Error('الحساب غير موجود'); var n = all[uid].name; delete all[uid]; writeJson_('accounts.json', all); log_(a, '', 'حذف حساباً', n); return 'ok'; });
}

/* ================= القراءة ================= */
function pubTrack_(t, admin) {
  var o = JSON.parse(JSON.stringify(t));
  o.linked = !!(t.chat && t.chat.id);
  if (!admin) { delete o.chat; delete o.sheet; }
  return o;
}
function boot(token) {
  var a = auth_(token), admin = a.role === 'admin', s = cfg_();
  var ts = tracks_().filter(function (t) { return admin || t.id === a.track; });
  var plans = {}, revsO = {};
  ts.forEach(function (t) { plans[t.id] = plan_(t.id); revsO[t.id] = plans[t.id].rev; });
  revsO._log = +(props_().getProperty('rev_log') || 0); revsO._meta = +(props_().getProperty('rev_meta') || 0);
  if (admin) revsO._alerts = +(props_().getProperty('rev_alerts') || 0);
  var out = {
    v: VERSION, me: meOf_(a), today: Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd'), tz: tz_(),
    types: TYPES, remindTypes: s.remindTypes, remindHour: s.remindHour,
    tracks: ts.map(function (t) { return pubTrack_(t, admin); }), plans: plans, revs: revsO,
    log: readJson_('log.json', []).filter(function (x) { return admin || x.t === a.track; }).slice(0, 60)
  };
  var tg0 = readJson_('tg.json', {});
  if (!admin && tg0.bot && tg0.bot.username) {
    var mt = trackOf_(a.track);
    out.tg = { bot: tg0.bot.username, linked: !!(mt.chat && mt.chat.id), title: mt.chat ? mt.chat.title : '', link: tgLink_(tg0.bot.username, a.track) };
  }
  if (admin) {
    var tgs = tg0, AL = readJson_('alerts.json', []);
    out.alerts = AL.slice(0, 40); out.unseen = AL.filter(function (x) { return !x.seen; }).length;
    out.settings = s;
    out.bot = tgs.bot || null;
    out.cal = { id: s.calId || '', name: s.calName || '' };
  }
  return JSON.stringify(out);
}
// أرقام الإصدارات فقط: تستعملها الواجهة لتعرف هل تغيّر شيء
function revs(token) {
  var a = auth_(token), p = props_(), o = {};
  tracks_().forEach(function (t) { if (a.role === 'admin' || t.id === a.track) o[t.id] = +(p.getProperty('rev_' + t.id) || 0); });
  o._log = +(p.getProperty('rev_log') || 0);
  o._meta = +(p.getProperty('rev_meta') || 0);
  if (a.role === 'admin') o._alerts = +(p.getProperty('rev_alerts') || 0);
  return JSON.stringify(o);
}
function plan(token, tid) { var a = auth_(token); canView_(a, tid); return JSON.stringify(plan_(tid)); }
function log_list(token) { var a = auth_(token); return JSON.stringify(readJson_('log.json', []).filter(function (x) { return a.role === 'admin' || x.t === a.track; }).slice(0, 200)); }

/* ================= الأنشطة ================= */
function padT_(t) { var m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '')); if (!m || +m[1] > 23 || +m[2] > 59) return ''; return ('0' + m[1]).slice(-2) + ':' + m[2]; }
function isIso_(d) { return /^\d{4}-\d{2}-\d{2}$/.test(String(d || '')); }
function cleanAct_(o, old) {
  var x = old ? JSON.parse(JSON.stringify(old)) : { id: uid_(), at: now_(), done: false };
  if ('title' in o) x.title = txt_(o.title, 160);
  if (!x.title) throw new Error('اكتب اسم النشاط');
  if ('d' in o) { if (!isIso_(o.d)) throw new Error('تاريخ غير صحيح'); x.d = o.d; }
  if (!isIso_(x.d)) throw new Error('حدّد يوم النشاط');
  if ('sem' in o) x.sem = String(o.sem || '');
  if ('time' in o) x.time = padT_(o.time);
  if ('dur' in o) x.dur = Math.max(0, Math.min(600, Math.round(+o.dur || 0)));
  if ('type' in o) x.type = TYPES.indexOf(o.type) >= 0 ? o.type : 'أخرى';
  if (!x.type) x.type = 'أخرى';
  if ('idea' in o) x.idea = txt_(o.idea, 3000);
  if ('who' in o) x.who = (Array.isArray(o.who) ? o.who : []).map(function (w) { return txt_(w, 40); }).filter(String).slice(0, 10);
  if ('done' in o) x.done = !!o.done;
  if ('rem' in o) { if (o.rem === null || o.rem === undefined || o.rem === '') delete x.rem; else x.rem = !!o.rem; }
  if ('note' in o) x.note = txt_(o.note, 1500);
  if ('link' in o) x.link = txt_(o.link, 500);
  x.upd = now_();
  return x;
}
var FOLLOW_FIELDS = ['id', 'done', 'note', 'link'];
// ما يعدّله الفريق في نشاط قائم ولو كان تعديل الخطة مغلقًا (ويصل الإدارةَ تنبيه به)
var ADJUST_FIELDS = ['id', 'title', 'type', 'd', 'time', 'dur', 'who', 'idea', 'rem', 'sem', 'done', 'note', 'link'];
/* تنبيهات الإدارة: alerts.json [{id, at, t, by, kind: move|who|edit|del|add, title, from, to, seen}] */
function alertOf_(a, tid, old, x) {
  if (a.role === 'admin') return null;
  var ch = [], kind = '';
  if (!old) return { kind: 'add', aid: x.id, title: x.title, from: '', to: whenText_(x) };
  if (!x) return { kind: 'del', aid: old.id, title: old.title, from: whenText_(old), to: '' };
  if (old.d !== x.d || (old.time || '') !== (x.time || '')) { kind = 'move'; ch.push(['الموعد', whenText_(old), whenText_(x)]); }
  if ((old.who || []).join('،') !== (x.who || []).join('،')) { kind = kind || 'who'; ch.push(['القائم', (old.who || []).join('، ') || 'لم يُحدَّد', (x.who || []).join('، ') || 'لم يُحدَّد']); }
  if (old.title !== x.title) { kind = kind || 'edit'; ch.push(['العنوان', old.title, x.title]); }
  if (old.type !== x.type) { kind = kind || 'edit'; ch.push(['النوع', old.type, x.type]); }
  if ((old.idea || '') !== (x.idea || '') || (old.dur || 0) !== (x.dur || 0)) { kind = kind || 'edit'; ch.push(['التفاصيل', '', '']); }
  if (!kind) return null;
  return { kind: kind, aid: x.id, title: x.title, changes: ch };
}
function alertText_(al, t, by) {
  var head = by + ' (' + (t.full || t.name) + ')';
  if (al.kind === 'add') return head + ' أضاف «' + al.title + '» ' + al.to + '.';
  if (al.kind === 'del') return head + ' حذف «' + al.title + '» الذي كان ' + al.from + '.';
  return head + ' عدّل «' + al.title + '»:\n' + al.changes.map(function (c) { return c[1] || c[2] ? '- ' + c[0] + ': من ' + (c[1] || '—') + ' إلى ' + (c[2] || '—') : '- ' + c[0]; }).join('\n');
}
function pushAlert_(a, t, al) {
  var L = readJson_('alerts.json', []), x = { id: uid_(), at: now_(), t: t.id, aid: al.aid || '', by: a.name, kind: al.kind, title: al.title, changes: al.changes || [], from: al.from || '', to: al.to || '', seen: false };
  L.unshift(x); if (L.length > 300) L.length = 300;
  writeJson_('alerts.json', L); props_().setProperty('rev_alerts', String(now_()));
  return x;
}
function alerts(token) { var a = auth_(token); needAdmin_(a); return JSON.stringify(readJson_('alerts.json', []).slice(0, 100)); }
function alerts_seen(token, ids) {
  var a = auth_(token); needAdmin_(a);
  return JSON.stringify(withLock_(function () {
    var L = readJson_('alerts.json', []), all = ids === 'all', set = all ? null : (ids || []);
    L.forEach(function (x) { if (all || set.indexOf(x.id) >= 0) x.seen = true; });
    writeJson_('alerts.json', L); props_().setProperty('rev_alerts', String(now_()));
    return { unseen: L.filter(function (x) { return !x.seen; }).length };
  }));
}
// json: النشاط (بلا id = جديد). calOn: true يرسله للتقويم، false يزيله (للإدارة)
function act_save(token, tid, json) {
  var a = auth_(token), o = JSON.parse(json), t = trackOf_(tid), s = cfg_();
  canView_(a, tid);
  var full = a.role === 'admin' || !!t.canEdit;
  var res = withLock_(function () {
    var p = plan_(tid), i = -1;
    if (o.id) p.acts.forEach(function (x, k) { if (x.id === o.id) i = k; });
    if (o.id && i < 0) throw new Error('النشاط غير موجود (ربما حُذف)');
    var old = i >= 0 ? p.acts[i] : null;
    var calOn = o.calOn; delete o.calOn;
    if (!full) {
      if (!old) throw new Error('إضافة الأنشطة مغلقة، ويفتحها المدير العام');
      var f = {}; ADJUST_FIELDS.forEach(function (k) { if (k in o) f[k] = o[k]; }); o = f;
    }
    var x = cleanAct_(o, old), calErr = '', notice = '', al = alertOf_(a, tid, old, x);
    if (!old) { x.by = a.name; if (!x.sem) x.sem = String(t.cur || ''); }
    // تقويم جوجل: الاختيار للإدارة، وما أُرسل يبقى محدَّثاً
    if (a.role === 'admin' && calOn === false && x.cal) { try { calRemove_(x); } catch (e) { calErr = e.message; } delete x.cal; }
    else if ((a.role === 'admin' && calOn === true) || (x.cal && x.cal.id && x.cal.sig !== calSig_(t, x))) {
      try { calUpsert_(t, x, s); } catch (e) { calErr = e.message; if (x.cal) x.cal.err = calErr; }
    }
    if (old && remindable_(x, s) && s.notifyChanges && (old.d !== x.d || old.time !== x.time)) {
      var left = dayDiff_(old.d, today_());
      if (left >= 0 && left <= 14) notice = 'تعديل في الخطة: لقاء «' + x.title + '» صار ' + whenText_(x) + ' (كان ' + whenText_(old) + ').';
    }
    if (old && x.meet && x.meet.space && (old.who || []).join() !== (x.who || []).join()) meetSync_(t, x, s);
    if (old) p.acts[i] = x; else p.acts.push(x);
    savePlan_(tid, p);
    var what = !old ? 'أضاف نشاطاً' : old.d !== x.d || (old.time || '') !== (x.time || '') ? 'غيّر موعد نشاط' : (old.who || []).join() !== (x.who || []).join() ? 'غيّر القائم على نشاط' : old.done !== x.done ? (x.done ? 'أتمّ نشاطاً' : 'أعاد نشاطاً إلى الخطة') : al ? 'عدّل نشاطاً' : 'تابع نشاطاً';
    log_(a, tid, what, x.title);
    if (al) pushAlert_(a, t, al);
    return { act: x, rev: p.rev, calErr: calErr, notice: notice, alert: al && al.kind !== 'add' ? alertText_(al, t, a.name) : '' };
  });
  if (res.notice && t.chat && t.chat.id) { try { tgSend_(t.chat.id, res.notice, tid); } catch (e) {} }
  if (res.alert) adminTg_(res.alert);
  delete res.notice; delete res.alert;
  return JSON.stringify(res);
}
function act_del(token, tid, id) {
  var a = auth_(token), t = trackOf_(tid), s = cfg_();
  canEdit_(a, tid);
  var res = withLock_(function () {
    var p = plan_(tid), x = null;
    p.acts = p.acts.filter(function (y) { if (y.id === id) { x = y; return false; } return true; });
    if (!x) throw new Error('النشاط غير موجود');
    if (x.cal && x.cal.id) { try { calRemove_(x); } catch (e) {} }
    savePlan_(tid, p);
    log_(a, tid, 'حذف نشاطاً', x.title);
    var al = alertOf_(a, tid, x, null); if (al) pushAlert_(a, t, al);
    var alertTxt = al ? alertText_(al, t, a.name) : '';
    var notice = '', left = dayDiff_(x.d, today_());
    if (remindable_(x, s) && s.notifyChanges && left >= 0 && left <= 14 && !x.done) notice = 'تعديل في الخطة: أُلغي لقاء «' + x.title + '» الذي كان ' + whenText_(x) + '.';
    return { rev: p.rev, act: x, notice: notice, alert: alertTxt };
  });
  if (res.notice && t.chat && t.chat.id) { try { tgSend_(t.chat.id, res.notice, tid); } catch (e) {} }
  if (res.alert) adminTg_(res.alert);
  delete res.notice; delete res.alert;
  return JSON.stringify(res);
}

/* ================= جدول الفصل ================= */
var DAY_FIELDS = ['ax', 'c', 'q', 'r', 'ev', 'p'];
function cleanDay_(o) {
  if (!isIso_(o.d)) throw new Error('تاريخ غير صحيح في الجدول');
  var x = { d: o.d, h: txt_(o.h, 40), w: Math.max(0, Math.min(60, Math.round(+o.w || 0))) };
  DAY_FIELDS.forEach(function (k) { var v = txt_(o[k], 300); if (v) x[k] = v; });
  return x;
}
// تعديل يوم واحد: json = {d, ax, c, q, r, ev, p}
function day_save(token, tid, sem, json) {
  var a = auth_(token), o = JSON.parse(json); canEdit_(a, tid);
  return JSON.stringify(withLock_(function () {
    var p = plan_(tid), S = p.sems[String(sem)];
    if (!S) throw new Error('الفصل غير موجود');
    var i = -1; S.days.forEach(function (d, k) { if (d.d === o.d) i = k; });
    if (i < 0) throw new Error('اليوم ليس ضمن الفصل');
    var old = S.days[i], x = { d: old.d, h: old.h, w: old.w };
    DAY_FIELDS.forEach(function (k) { var v = (k in o) ? txt_(o[k], 300) : old[k]; if (v) x[k] = v; });
    S.days[i] = x;
    savePlan_(tid, p);
    log_(a, tid, 'عدّل جدول الفصل', dayText_(x.d));
    return { day: x, rev: p.rev };
  }));
}
// فصل كامل: json = {title, src, days:[...]} — للإنشاء والاستيراد
function sem_put(token, tid, sem, json) {
  var a = auth_(token), o = JSON.parse(json); canEdit_(a, tid);
  var n = String(sem); if (!/^\d{1,2}$/.test(n)) throw new Error('رقم الفصل غير صحيح');
  var days = (o.days || []).map(cleanDay_);
  if (!days.length) throw new Error('الفصل بلا أيام');
  if (days.length > 400) throw new Error('الفصل أطول من اللازم');
  days.sort(function (x, y) { return x.d < y.d ? -1 : 1; });
  return JSON.stringify(withLock_(function () {
    var p = plan_(tid);
    p.sems[n] = { n: +n, title: txt_(o.title, 60) || ('الفصل ' + (ORD[+n] || n)), src: txt_(o.src, 300), start: days[0].d, end: days[days.length - 1].d, days: days, at: now_() };
    savePlan_(tid, p);
    log_(a, tid, 'حدّث جدول الفصل', p.sems[n].title + ' (' + days.length + ' يوماً)');
    return { sem: p.sems[n], rev: p.rev };
  }));
}
function sem_del(token, tid, sem) {
  var a = auth_(token); needAdmin_(a);
  return JSON.stringify(withLock_(function () {
    var p = plan_(tid), n = String(sem);
    if (!p.sems[n]) throw new Error('الفصل غير موجود');
    if (p.acts.some(function (x) { return x.sem === n; })) throw new Error('في هذا الفصل أنشطة، احذفها أو انقلها أولاً');
    delete p.sems[n]; savePlan_(tid, p); log_(a, tid, 'حذف فصلاً', n);
    return { rev: p.rev };
  }));
}
// استيراد جدول المقررات من جوجل شيت (رابط الورقة كما هو). يقرأ أعمدة: الأسبوع، التاريخ الهجري، التاريخ الميلادي، المحور، المقرر، المقدار، المطلوب
function sem_import(token, tid, sem, url, dry) {
  var a = auth_(token); canEdit_(a, tid);
  var days = sheetDays_(url);
  if (dry) return JSON.stringify({ days: days });
  var r = JSON.parse(sem_put(token, tid, sem, JSON.stringify({ days: days, src: url })));
  withLock_(function () { var ts = tracks_(); ts.forEach(function (t) { if (t.id === tid) t.sheet = clip_(url, 300); }); writeJson_('tracks.json', ts); });
  return JSON.stringify(r);
}
function sheetDays_(url) {
  var m = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/.exec(String(url || ''));
  if (!m) throw new Error('رابط جوجل شيت غير صحيح');
  var g = /[#&?]gid=(\d+)/.exec(url);
  var res = UrlFetchApp.fetch('https://docs.google.com/spreadsheets/d/' + m[1] + '/export?format=csv' + (g ? '&gid=' + g[1] : ''), { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true, followRedirects: true });
  if (res.getResponseCode() !== 200) throw new Error('تعذّر قراءة الورقة (' + res.getResponseCode() + '). تأكد أن الرابط صحيح ومتاح لحساب المنصة');
  return parseSemCsv_(Utilities.parseCsv(res.getContentText()));
}
var GM = { 'يناير': 1, 'فبراير': 2, 'مارس': 3, 'أبريل': 4, 'ابريل': 4, 'إبريل': 4, 'مايو': 5, 'يونيو': 6, 'يوليو': 7, 'أغسطس': 8, 'اغسطس': 8, 'سبتمبر': 9, 'أكتوبر': 10, 'اكتوبر': 10, 'نوفمبر': 11, 'ديسمبر': 12 };
function gIso_(s) {
  s = String(s || '').trim();
  var m = /^(\d{1,2})\s+(\S+)\s+(\d{4})/.exec(s);
  if (m && GM[m[2]]) return m[3] + '-' + ('0' + GM[m[2]]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s); if (m) return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s); if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return '';
}
function parseSemCsv_(rows) {
  var hi = -1;
  rows.forEach(function (r, i) { if (hi < 0 && r.some(function (c) { return String(c).trim() === 'الأسبوع'; })) hi = i; });
  if (hi < 0) throw new Error('لم أجد صف العناوين (عمود «الأسبوع») في الورقة');
  var H = rows[hi].map(function (c) { return String(c).trim(); });
  function ix(n) { var i = H.indexOf(n); if (i < 0) throw new Error('عمود «' + n + '» غير موجود في الورقة'); return i; }
  var cW = ix('الأسبوع'), cH = ix('التاريخ الهجري'), cG = ix('التاريخ الميلادي'), cA = ix('المحور'), cC = ix('المقرر'), cQ = ix('المقدار'), cR = ix('المطلوب');
  var days = [], axis = '', week = 0, period = '';
  rows.slice(hi + 1).forEach(function (r) {
    function v(i) { return String(r[i] == null ? '' : r[i]).trim(); }
    var d = gIso_(v(cG)); if (!d) return;
    if (v(cW)) { var nw = parseInt(v(cW), 10); if (nw && nw !== week) period = ''; if (nw) week = nw; }
    var ax = v(cA), c = v(cC), q = v(cQ), rq = v(cR), ev = '';
    if (ax && !c && /استدراك|اختبار|إجازة|اجازة/.test(ax)) { if (ax.indexOf('الاختبار') === 0) ev = ax; else period = ax; ax = ''; }
    else if (ax) axis = ax;
    if (q === '--' || q === '-') q = '';
    var day = { d: d, h: v(cH), w: week };
    if (c) { day.ax = ax || axis; day.c = c; if (q) day.q = q; if (rq) day.r = rq; }
    if (ev) day.ev = ev;
    if (period && !c) day.p = period;
    days.push(day);
  });
  if (!days.length) throw new Error('لم أجد أياماً بتواريخ ميلادية في الورقة');
  return days;
}

/* ================= المسار والإعدادات ================= */
function track_save(token, tid, json) {
  var a = auth_(token), o = JSON.parse(json);
  var teamOnly = Object.keys(o).every(function (k) { return k === 'members' || k === 'emails'; });
  if (teamOnly) canView_(a, tid); else canEdit_(a, tid);   // أعضاء الفريق وبريدهم يكتبها الفريق نفسه دائمًا
  var res = withLock_(function () {
    var ts = tracks_(), t = ts.filter(function (x) { return x.id === tid; })[0];
    if (!t) throw new Error('المسار غير موجود');
    if ('members' in o) t.members = (o.members || []).map(function (m) { return txt_(m, 40); }).filter(String).slice(0, 40);
    if ('emails' in o) {
      var em = {}, src = o.emails || {};
      (t.members || []).forEach(function (m) { var e = String(src[m] || '').trim().toLowerCase(); if (isEmail_(e)) em[m] = e; });
      t.emails = em;
    } else if ('members' in o && t.emails) { var keep = {}; t.members.forEach(function (m) { if (t.emails[m]) keep[m] = t.emails[m]; }); t.emails = keep; }
    if (a.role === 'admin') {
      ['name', 'full', 'age', 'cohort'].forEach(function (k) { if (k in o) t[k] = txt_(o[k], 60); });
      if ('color' in o && /^#[0-9a-f]{6}$/i.test(o.color)) t.color = o.color;
      if ('cur' in o) t.cur = Math.max(1, Math.min(12, Math.round(+o.cur || 1)));
      if ('sems' in o) t.sems = Math.max(1, Math.min(12, Math.round(+o.sems || 1)));
      if ('canEdit' in o) { t.canEdit = !!o.canEdit; delete t.editReq; }
      if ('remind' in o) t.remind = !!o.remind;
      if ('calColor' in o) t.calColor = String(o.calColor || '').slice(0, 2);
    }
    writeJson_('tracks.json', ts);
    props_().setProperty('rev_meta', String(now_()));
    var what = ('canEdit' in o && a.role === 'admin') ? (o.canEdit ? 'فتح تعديل الخطة للفريق' : 'أغلق تعديل الخطة للفريق') : teamOnly ? 'حدّث أعضاء الفريق' : 'عدّل بيانات المسار';
    log_(a, tid, what, t.name);
    return { track: pubTrack_(t, a.role === 'admin'), t: t };
  });
  if ('emails' in o || 'members' in o) { try { meetResyncTrack_(res.t); } catch (e) {} }
  delete res.t;
  return JSON.stringify(res);
}
function settings_save(token, json) {
  var a = auth_(token), o = JSON.parse(json); needAdmin_(a);
  var out = withLock_(function () {
    var s = readJson_('settings.json', {});
    if ('remindHour' in o) s.remindHour = Math.max(0, Math.min(23, Math.round(+o.remindHour || 0)));
    if ('remindTypes' in o) s.remindTypes = (o.remindTypes || []).filter(function (x) { return TYPES.indexOf(x) >= 0; });
    if ('digest' in o) s.digest = { on: !!o.digest.on, dow: Math.max(0, Math.min(6, Math.round(+o.digest.dow || 0))), hour: Math.max(0, Math.min(23, Math.round(+o.digest.hour || 0))) };
    if ('adminDigest' in o) s.adminDigest = !!o.adminDigest;
    if ('notifyChanges' in o) s.notifyChanges = !!o.notifyChanges;
    if ('durMin' in o) s.durMin = Math.max(15, Math.min(600, Math.round(+o.durMin || 60)));
    if ('groupsPaused' in o) s.groupsPaused = !!o.groupsPaused;
    if ('meetAdmins' in o) s.meetAdmins = (o.meetAdmins || []).map(function (e) { return String(e || '').trim().toLowerCase(); }).filter(isEmail_).slice(0, 5);
    if ('tpl' in o) { s.tpl = s.tpl || {}; ['d3', 'd1'].forEach(function (k) { if (o.tpl[k] != null) s.tpl[k] = txt_(o.tpl[k], 1200) || DEFAULTS.tpl[k]; }); }
    writeJson_('settings.json', s);
    props_().setProperty('rev_meta', String(now_()));
    log_(a, '', 'عدّل الإعدادات', '');
    return { settings: cfg_() };
  });
  if ('meetAdmins' in o) tracks_().forEach(function (t) { try { meetResyncTrack_(t); } catch (e) {} });
  return JSON.stringify(out);
}

function adminTg_(text) { var s = cfg_(); if (s.adminChat && s.adminChat.id && props_().getProperty('TG_TOKEN')) { try { tgSend_(s.adminChat.id, text + '\n' + SITE_URL); } catch (e) {} } }
// طلب الفريق فتح تعديل الخطة: يظهر للإدارة في المنصة، ويصلها في تليجرام إن رُبطت محادثتها
function edit_request(token, note) {
  var a = auth_(token);
  if (a.role === 'admin') throw new Error('هذا للفرق');
  var t = trackOf_(a.track);
  if (t.canEdit) return JSON.stringify({ ok: true, open: true });
  withLock_(function () {
    var ts = tracks_(); ts.forEach(function (x) { if (x.id === t.id) x.editReq = { at: now_(), by: a.name, note: txt_(note, 300) }; });
    writeJson_('tracks.json', ts); props_().setProperty('rev_meta', String(now_()));
    log_(a, t.id, 'طلب فتح تعديل الخطة', txt_(note, 160));
  });
  var s = cfg_();
  if (s.adminChat && s.adminChat.id) { try { tgSend_(s.adminChat.id, 'طلب من ' + (t.full || t.name) + ': فتح تعديل الخطة' + (note ? '\n«' + txt_(note, 300) + '»' : '') + '\n' + SITE_URL); } catch (e) {} }
  return JSON.stringify({ ok: true });
}

/* ================= التاريخ والنصوص ================= */
function today_() { return Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd'); }
function U_(s) { return Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)); }
function dayDiff_(a, b) { return Math.round((U_(a) - U_(b)) / 864e5); }
function addDays_(s, n) { return new Date(U_(s) + n * 864e5).toISOString().slice(0, 10); }
function wd_(s) { return (new Date(U_(s)).getUTCDay() + 1) % 7; }   // ٠ = السبت
function dayText_(s) { return DAYS[wd_(s)] + ' ' + (+s.slice(8, 10)) + ' ' + MONTHS[+s.slice(5, 7) - 1]; }
function timeText_(t) {
  if (!t) return '';
  var h = +t.slice(0, 2), m = t.slice(3, 5), pm = h >= 12, h12 = h % 12 || 12;
  return h12 + ':' + m + (pm ? ' م' : ' ص');
}
function whenText_(x) { return dayText_(x.d) + (x.time ? ' الساعة ' + timeText_(x.time) : ''); }
function leftText_(n) { return n === 0 ? 'اليوم' : n === 1 ? 'غدًا' : n === 2 ? 'بعد يومين' : 'بعد ' + n + ' أيام'; }
function countText_(n) { return n === 1 ? 'نشاط واحد' : n === 2 ? 'نشاطان' : n <= 10 ? n + ' أنشطة' : n + ' نشاطاً'; }
function remindable_(x, s) { if (x.rem === true) return true; if (x.rem === false) return false; return (s.remindTypes || []).indexOf(x.type) >= 0; }
function remindText_(tpl, x, t, left) {
  var txt = fill_(tpl, x, t, left), uri = x.meet && x.meet.uri;
  if (uri && String(tpl).indexOf('{الرابط}') < 0) txt += '\nرابط اللقاء: ' + uri;
  return txt;
}
function fill_(tpl, x, t, left) {
  var map = { 'الرابط': (x.meet && x.meet.uri) || '', 'العنوان': x.title, 'الموعد': whenText_(x), 'متى': leftText_(left), 'المتبقي': left === 1 ? 'يوم واحد' : left === 2 ? 'يومان' : left + ' أيام', 'المسؤول': (x.who || []).join('، ') || 'لم يُحدَّد', 'المسار': t.name, 'النوع': x.type, 'الفكرة': x.idea || '' };
  return String(tpl).replace(/\{([^}]+)\}/g, function (all, k) { return map.hasOwnProperty(k) ? map[k] : all; });
}

/* ================= لقاءات ميت =================
   الغرفة تُنشأ من حساب المنصة بواجهة ميت البرمجية، والمسؤولون عن اللقاء (ببريدهم في «الفريق») وبريد الإدارة مشرفون مشاركون فيها.
   يحتاج مشروع المنصة: واجهة ميت مفعّلة في مشروع Google Cloud المرتبط، والنطاق meetings.space.created في appsscript.json.
   x.meet: {space, uri, code, at, by, hosts:{email: memberName}, miss:[أسماء بلا بريد], err} */
var MEET_API = 'https://meet.googleapis.com/v2/';
function isEmail_(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '')); }
function meetCall_(method, path, body) {
  var opt = { method: method, headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true };
  if (body) { opt.contentType = 'application/json'; opt.payload = JSON.stringify(body); }
  var r = UrlFetchApp.fetch(MEET_API + path, opt), code = r.getResponseCode(), txt = r.getContentText(), j = {};
  try { j = txt ? JSON.parse(txt) : {}; } catch (e) {}
  if (code >= 300) {
    var m = (j.error && j.error.message) || ('HTTP ' + code);
    if (/has not been used|is disabled|SERVICE_DISABLED/i.test(m)) m = 'واجهة ميت غير مفعّلة لمشروع المنصة بعد';
    else if (code === 401 || (code === 403 && /scope|insufficient/i.test(m))) m = 'حساب المنصة لم يأذن بإنشاء لقاءات ميت بعد';
    var er = new Error(m); er.code = code; throw er;
  }
  return j;
}
function meetHosts_(t, x, s) {
  var em = t.emails || {}, out = [], miss = [];
  (x.who || []).forEach(function (w) { if (em[w]) out.push(em[w]); else miss.push(w); });
  (s.meetAdmins || []).forEach(function (e) { out.push(e); });
  var seen = {}; out = out.filter(function (e) { e = e.toLowerCase(); if (seen[e]) return false; seen[e] = 1; return true; });
  return { emails: out, miss: miss };
}
// يجعل المشرفين المشاركين في الغرفة كما في خانة المسؤول وبريد الإدارة: يضيف الجديد ويزيل من خرج
function meetSync_(t, x, s) {
  if (!x.meet || !x.meet.space) return;
  var want = meetHosts_(t, x, s || cfg_()), cur = x.meet.hosts || {}, errs = [];
  want.emails.forEach(function (e) {
    if (cur[e]) return;
    try { var m = meetCall_('post', x.meet.space + '/members', { email: e, role: 'COHOST' }); cur[e] = m.name || '1'; }
    catch (er) { errs.push(e + ': ' + er.message); }
  });
  Object.keys(cur).forEach(function (e) {
    if (want.emails.indexOf(e) >= 0) return;
    try { if (cur[e] && cur[e] !== '1') meetCall_('delete', cur[e]); delete cur[e]; } catch (er) { errs.push(e + ': ' + er.message); }
  });
  x.meet.hosts = cur; x.meet.miss = want.miss; x.meet.syncAt = now_();
  if (errs.length) x.meet.err = errs[0]; else delete x.meet.err;
}
// لما يتغيّر بريد الأعضاء أو بريد الإدارة: تُحدَّث اللقاءات القادمة التي لها غرفة
function meetResyncTrack_(t) {
  var s = cfg_(), today = today_(), changed = false, p = plan_(t.id);
  p.acts.forEach(function (x) { if (x.meet && x.meet.space && x.d >= today) { meetSync_(t, x, s); changed = true; } });
  if (changed) withLock_(function () {
    var p2 = plan_(t.id);
    p.acts.forEach(function (x) { if (!x.meet) return; p2.acts.forEach(function (y, k) { if (y.id === x.id && y.meet && y.meet.space === x.meet.space) p2.acts[k].meet = x.meet; }); });
    savePlan_(t.id, p2);
  });
}
// زر «أنشئ رابط ميت» في النشاط (للإدارة ولفريق المسار)
function meet_create(token, tid, id) {
  var a = auth_(token), t = trackOf_(tid), s = cfg_();
  canView_(a, tid);
  var x0 = plan_(tid).acts.filter(function (y) { return y.id === id; })[0];
  if (!x0) throw new Error('النشاط غير موجود (ربما حُذف)');
  if (x0.meet && x0.meet.uri) return JSON.stringify({ act: x0, rev: plan_(tid).rev });
  var sp = meetCall_('post', 'spaces', { config: { accessType: 'OPEN', entryPointAccess: 'ALL' } });
  var meet = { space: sp.name, uri: sp.meetingUri, code: sp.meetingCode, at: now_(), by: a.name, hosts: {} };
  var tmp = JSON.parse(JSON.stringify(x0)); tmp.meet = meet; meetSync_(t, tmp, s);
  return JSON.stringify(withLock_(function () {
    var p = plan_(tid), i = -1;
    p.acts.forEach(function (y, k) { if (y.id === id) i = k; });
    if (i < 0) throw new Error('النشاط غير موجود (ربما حُذف)');
    var x = p.acts[i]; x.meet = tmp.meet;
    if (x.cal && x.cal.id) { try { calUpsert_(t, x, s); } catch (e) { if (x.cal) x.cal.err = e.message; } }
    savePlan_(tid, p);
    log_(a, tid, 'أنشأ رابط ميت', x.title);
    return { act: x, rev: p.rev };
  }));
}
function meet_unlink(token, tid, id) {
  var a = auth_(token), t = trackOf_(tid), s = cfg_();
  canView_(a, tid);
  return JSON.stringify(withLock_(function () {
    var p = plan_(tid), x = p.acts.filter(function (y) { return y.id === id; })[0];
    if (!x) throw new Error('النشاط غير موجود');
    delete x.meet;
    if (x.cal && x.cal.id) { try { calUpsert_(t, x, s); } catch (e) {} }
    savePlan_(tid, p); log_(a, tid, 'أزال رابط ميت', x.title);
    return { act: x, rev: p.rev };
  }));
}

/* ================= تقويم جوجل ================= */
function calOf_(s, cid) {
  var c = null, id = cid || (s && s.calId) || '';
  if (id) { try { c = CalendarApp.getCalendarById(id); } catch (e) {} }
  if (!c && !cid) c = CalendarApp.getDefaultCalendar();
  if (!c) throw new Error('التقويم المختار غير متاح لحساب المنصة');
  return c;
}
function calSig_(t, x) { return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, [t.name, x.title, x.d, x.time || '', x.dur || '', x.type, (x.who || []).join(','), x.idea || '', x.done ? 1 : 0, (x.meet && x.meet.uri) || ''].join('|'))).slice(0, 16); }
function calTimes_(x, s) {
  var y = +x.d.slice(0, 4), mo = +x.d.slice(5, 7) - 1, d = +x.d.slice(8, 10);
  if (!x.time) return { allDay: true, start: new Date(y, mo, d) };
  var st = new Date(y, mo, d, +x.time.slice(0, 2), +x.time.slice(3, 5));
  return { allDay: false, start: st, end: new Date(st.getTime() + (x.dur || s.durMin || 60) * 60000) };
}
function calUpsert_(t, x, s) {
  s = s || cfg_();
  var cal = calOf_(s), ev = null;
  if (x.cal && x.cal.id) {
    try { ev = calOf_(s, x.cal.cid || '').getEventById(x.cal.id); } catch (e) { ev = null; }
    if (ev && x.cal.cid && x.cal.cid !== cal.getId()) { try { ev.deleteEvent(); } catch (e) {} ev = null; }
  }
  var title = t.name + ' · ' + x.title + (x.done ? ' ✓' : '');
  var uri = (x.meet && x.meet.uri) || '';
  var desc = [uri ? 'رابط اللقاء: ' + uri : '', 'النوع: ' + x.type, (x.who && x.who.length) ? 'المسؤول: ' + x.who.join('، ') : '', x.idea ? '\n' + x.idea : '', '\n— منصة الأنشطة التربوية: ' + SITE_URL].filter(String).join('\n');
  var tm = calTimes_(x, s);
  if (ev) {
    if (tm.allDay) ev.setAllDayDate(tm.start); else ev.setTime(tm.start, tm.end);
    ev.setTitle(title); ev.setDescription(desc); try { ev.setLocation(uri); } catch (e) {}
  } else {
    ev = tm.allDay ? cal.createAllDayEvent(title, tm.start, { description: desc, location: uri }) : cal.createEvent(title, tm.start, tm.end, { description: desc, location: uri });
  }
  try { if (t.calColor) ev.setColor(String(t.calColor)); } catch (e) {}
  x.cal = { id: ev.getId(), cid: cal.getId(), sig: calSig_(t, x), at: now_() };
}
function calRemove_(x) {
  if (!x.cal || !x.cal.id) return;
  var ev = null;
  try { ev = calOf_(cfg_(), x.cal.cid || '').getEventById(x.cal.id); } catch (e) {}
  if (ev) ev.deleteEvent();
}
function cal_list(token) {
  var a = auth_(token); needAdmin_(a);
  var s = cfg_(), def = CalendarApp.getDefaultCalendar(), cur = s.calId || def.getId();
  var list = CalendarApp.getAllCalendars().map(function (c) {
    var own = false; try { own = c.isOwnedByMe(); } catch (e) {}
    return { id: c.getId(), name: c.getName(), own: own, cur: c.getId() === cur, primary: c.getId() === def.getId() };
  });
  return JSON.stringify(list);
}
// id: معرّف تقويم، أو 'new:الاسم' لإنشاء تقويم جديد
function cal_set(token, id) {
  var a = auth_(token); needAdmin_(a);
  var c;
  if (/^new:/.test(id)) c = CalendarApp.createCalendar(txt_(id.slice(4), 60) || 'أنشطة المسارات', { timeZone: tz_() });
  else { c = CalendarApp.getCalendarById(id); if (!c) throw new Error('التقويم غير متاح'); }
  return JSON.stringify(withLock_(function () {
    var s = readJson_('settings.json', {}); s.calId = c.getId(); s.calName = c.getName(); writeJson_('settings.json', s);
    props_().setProperty('rev_meta', String(now_()));
    log_(a, '', 'اختار تقويم جوجل', c.getName());
    // ما أُرسل سابقاً يُنقل إلى التقويم الجديد
    var s2 = cfg_(), moved = 0, errs = 0;
    tracks_().forEach(function (t) {
      var p = plan_(t.id), n = 0;
      p.acts.forEach(function (x) { if (x.cal && x.cal.id && x.cal.cid !== s2.calId) { try { calUpsert_(t, x, s2); n++; } catch (e) { errs++; } } });
      if (n) { savePlan_(t.id, p); moved += n; }
    });
    return { id: s.calId, name: s.calName, moved: moved, errs: errs };
  }));
}
// items: [{t, id}] — on: true إرسال/تحديث، false إزالة
function cal_push(token, json, on) {
  var a = auth_(token); needAdmin_(a);
  var items = JSON.parse(json), s = cfg_(), by = {}, out = { ok: [], err: [] };
  items.forEach(function (it) { (by[it.t] = by[it.t] || []).push(it.id); });
  Object.keys(by).forEach(function (tid) {
    var t = trackOf_(tid);
    withLock_(function () {
      var p = plan_(tid), n = 0;
      p.acts.forEach(function (x) {
        if (by[tid].indexOf(x.id) < 0) return;
        try {
          if (on) calUpsert_(t, x, s); else { calRemove_(x); delete x.cal; }
          out.ok.push({ t: tid, id: x.id, cal: x.cal || null }); n++;
        } catch (e) { out.err.push({ t: tid, id: x.id, msg: e.message }); }
      });
      if (n) { savePlan_(tid, p); log_(a, tid, on ? 'أرسل أنشطة إلى التقويم' : 'أزال أنشطة من التقويم', n + ' نشاطاً'); }
      out.rev = out.rev || {}; out.rev[tid] = p.rev;
    });
  });
  return JSON.stringify(out);
}

/* ================= بوت تليجرام =================
   tg.json: {offset, bot:{username,name}, known:{chatId:{id,title,type,at,left}}, lastTick:{at,ok,msg,sent}, digestWeek, adminDigestWeek}
   ربط المجموعة: أضف البوت إلى مجموعة الفريق، ثم اختر لها المسار من المنصة (الإعدادات ← البوت). */
function tgToken_() { var t = props_().getProperty('TG_TOKEN'); if (!t) throw new Error('لم يُربط بوت تليجرام بعد'); return t; }
function tgCall_(method, payload, tok) {
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + (tok || tgToken_()) + '/' + method, { method: 'post', payload: payload || {}, muteHttpExceptions: true });
  var j; try { j = JSON.parse(res.getContentText()); } catch (e) { j = { ok: false, description: 'رد غير مفهوم (' + res.getResponseCode() + ')' }; }
  if (!j.ok) { var er = new Error('تليجرام: ' + (j.description || res.getResponseCode())); er.tg = j; throw er; }
  return j.result;
}
// يرسل نصاً، ويتابع انتقال المجموعة إلى «مجموعة خارقة» (يتغير معرّفها) فيحدّث الربط
function tgSend_(chatId, text, tid) {
  var s0 = cfg_();
  if (s0.groupsPaused && !(s0.adminChat && String(s0.adminChat.id) === String(chatId))) return { skipped: true };   // الإرسال في المجموعات موقوف مؤقتًا
  try { return tgCall_('sendMessage', { chat_id: String(chatId), text: text, disable_web_page_preview: 'true' }); }
  catch (e) {
    var mig = e.tg && e.tg.parameters && e.tg.parameters.migrate_to_chat_id;
    if (!mig) throw e;
    migrateChat_(chatId, mig);
    return tgCall_('sendMessage', { chat_id: String(mig), text: text, disable_web_page_preview: 'true' });
  }
}
function migrateChat_(from, to) {
  withLock_(function () {
    var ts = tracks_(), ch = false;
    ts.forEach(function (t) { if (t.chat && String(t.chat.id) === String(from)) { t.chat.id = String(to); ch = true; } });
    if (ch) writeJson_('tracks.json', ts);
    var s = readJson_('settings.json', {});
    if (s.adminChat && String(s.adminChat.id) === String(from)) { s.adminChat.id = String(to); writeJson_('settings.json', s); }
    var g = readJson_('tg.json', {}); g.known = g.known || {};
    if (g.known[from]) { g.known[to] = g.known[from]; g.known[to].id = String(to); delete g.known[from]; writeJson_('tg.json', g); }
  });
}
function tg_token(token, botToken) {
  var a = auth_(token); needAdmin_(a);
  botToken = String(botToken || '').trim();
  if (!/^\d+:[\w-]{30,}$/.test(botToken)) throw new Error('رمز البوت غير صحيح (انسخه كما أعطاك BotFather)');
  var me = tgCall_('getMe', {}, botToken);
  try { tgCall_('deleteWebhook', { drop_pending_updates: 'false' }, botToken); } catch (e) {}
  props_().setProperty('TG_TOKEN', botToken);
  withLock_(function () { var g = readJson_('tg.json', {}); g.bot = { username: me.username, name: me.first_name, id: me.id }; g.offset = 0; writeJson_('tg.json', g); });
  log_(a, '', 'ربط بوت تليجرام', '@' + me.username);
  return tg_status(token);
}
function tgPoll_() {
  if (!props_().getProperty('TG_TOKEN')) return { n: 0 };
  // نقرأ بلا offset فلا تُحذف التحديثات من طابور تليجرام (تبقى 24 ساعة) ويراها كل من يقرأ البوت نفسه (أثر، والربط الشخصي)،
  // ونتجاوز ما عالجناه برقمه
  var g0 = readJson_('tg.json', {}), last0 = g0.last != null ? g0.last : (g0.offset || 1) - 1;
  var ups = tgCall_('getUpdates', { timeout: '0', limit: '100', allowed_updates: JSON.stringify(['message', 'my_chat_member']) })
    .filter(function (u) { return u.update_id > last0; });
  if (!ups.length) return { n: 0 };
  var welcome = [], migs = [], linked = [];
  withLock_(function () {
    var g = readJson_('tg.json', {}); g.known = g.known || {};
    var assigned = {}; tracks_().forEach(function (t) { if (t.chat && t.chat.id) assigned[String(t.chat.id)] = t.name; });
    var s = readJson_('settings.json', {}); if (s.adminChat && s.adminChat.id) assigned[String(s.adminChat.id)] = 'الإدارة';
    ups.forEach(function (u) {
      if (u.update_id <= (g.last != null ? g.last : (g.offset || 1) - 1)) return;
      g.last = u.update_id; delete g.offset;
      var m = u.message || u.my_chat_member; if (!m || !m.chat) return;
      var c = m.chat, id = String(c.id);
      if (u.message && u.message.migrate_to_chat_id) { migs.push([id, String(u.message.migrate_to_chat_id)]); return; }
      var title = c.title || [c.first_name, c.last_name].filter(function (x) { return x; }).join(' ').trim() || c.username || id;
      var k = g.known[id] || { id: id, first: now_() };
      var wasLeft = !!k.left;
      k.title = title; k.type = c.type; k.at = now_();
      if (u.my_chat_member) {
        var st = u.my_chat_member.new_chat_member && u.my_chat_member.new_chat_member.status;
        k.left = (st === 'left' || st === 'kicked');
        if (!k.left && (wasLeft || !g.known[id]) && c.type !== 'private' && !assigned[id]) welcome.push([id, 'أهلاً بكم، هذا بوت منصة الأنشطة التربوية. سأرسل هنا تذكيرات اللقاءات بعد أن تربط الإدارة هذه المجموعة بمسارها من المنصة.']);
      }
      g.known[id] = k;
      var sm = u.message && /^\/start(?:@\w+)?(?:\s+(\S+))?/.exec(u.message.text || '');
      if (sm) {
        var target = tgTarget_(sm[1]);
        if (target && (target === 'admin') === (c.type === 'private')) {
          var label = assign_(id, title, target); assigned[id] = label;
          linked.push([id, linkedMsg_(label), target, title]);
          return;
        }
        // الخاص: لا يرد البوت على أحد غير محادثة الإدارة (إلا ربطها برابطها الموقّع)
      }
    });
    writeJson_('tg.json', g);
  });
  migs.forEach(function (p) { migrateChat_(p[0], p[1]); });
  if (linked.length) withLock_(function () { linked.forEach(function (l) { log_(null, l[2] === 'admin' ? '' : l[2], l[2] === 'admin' ? 'ربط محادثة الإدارة في تليجرام' : 'ربط مجموعة تليجرام', l[3]); }); });
  welcome = welcome.filter(function (w) { return !linked.some(function (l) { return l[0] === w[0]; }); });
  welcome.concat(linked).forEach(function (w) { try { tgSend_(w[0], w[1]); } catch (e) {} });
  return { n: ups.length };
}
// رابط إضافة البوت إلى مجموعة المسار: يفتح تليجرام لاختيار المجموعة، فيصل البوتَ «/start رمز» فيربطها تلقائياً
function tgCode_(target) { return target + '-' + sign_('tg|' + target).replace(/[^A-Za-z0-9]/g, '').slice(0, 10); }
function tgLink_(bot, target) { return target === 'admin' ? 'https://t.me/' + bot + '?start=' + tgCode_('admin') : 'https://t.me/' + bot + '?startgroup=' + tgCode_(target); }
function tgTarget_(payload) {
  var m = /^([a-z0-9]+)-([A-Za-z0-9]{10})$/.exec(String(payload || ''));
  if (!m || tgCode_(m[1]) !== payload) return '';
  if (m[1] === 'admin') return 'admin';
  return tracks_().some(function (t) { return t.id === m[1]; }) ? m[1] : '';
}
// يربط محادثة بمسار أو بالإدارة (داخل القفل)، ويعيد اسم الجهة
function assign_(chatId, title, target) {
  var ts = tracks_(), label = '';
  ts.forEach(function (t) { if (t.chat && String(t.chat.id) === chatId) t.chat = null; });
  var s = readJson_('settings.json', {});
  if (s.adminChat && String(s.adminChat.id) === chatId) s.adminChat = null;
  if (target === 'admin') { s.adminChat = { id: chatId, title: title }; label = 'الإدارة'; }
  else if (target) { var t = ts.filter(function (x) { return x.id === target; })[0]; if (!t) throw new Error('المسار غير موجود'); t.chat = { id: chatId, title: title }; label = t.full || t.name; }
  writeJson_('tracks.json', ts); writeJson_('settings.json', s);
  props_().setProperty('rev_meta', String(now_()));
  return label;
}
function linkedMsg_(label) { return label === 'الإدارة' ? 'تم ربط هذه المحادثة بالإدارة. سيصلك هنا ملخص الأسبوع لكل المسارات وطلبات الفرق.' : 'تم ربط هذه المجموعة بـ' + label + '.\nسأرسل هنا تذكيراً قبل كل لقاء بثلاثة أيام لإعداد إعلانه، وقبله بيوم لنشره، وملخصاً لأنشطة الأسبوع.'; }
// للفريق والإدارة: يستقبل ما وصل البوت (ومنه الربط) ثم يعيد حالة ربط المسار
function tg_check(token) {
  var a = auth_(token);
  try { tgPoll_(); } catch (e) {}
  JC = {};
  if (a.role === 'admin') return tg_status(token);
  var t = trackOf_(a.track);
  return JSON.stringify({ linked: !!(t.chat && t.chat.id), title: t.chat ? t.chat.title : '' });
}
function tg_status(token) {
  var a = auth_(token); needAdmin_(a);
  var g = readJson_('tg.json', {}), s = cfg_(), known = g.known || {};
  var ts = tracks_().map(function (t) { return { id: t.id, name: t.name, chat: t.chat || null, remind: t.remind !== false }; });
  var map = {}; ts.forEach(function (t) { if (t.chat && t.chat.id) map[String(t.chat.id)] = t.id; });
  if (s.adminChat && s.adminChat.id) map[String(s.adminChat.id)] = 'admin';
  var chats = Object.keys(known).map(function (k) { var c = known[k]; return { id: c.id, title: c.title, type: c.type, at: c.at, left: !!c.left, to: map[String(c.id)] || '' }; })
    .sort(function (x, y) { return (y.at || 0) - (x.at || 0); });
  if (g.bot && g.bot.username) { ts.forEach(function (t) { t.link = tgLink_(g.bot.username, t.id); }); }
  return JSON.stringify({ bot: g.bot || null, hasToken: !!props_().getProperty('TG_TOKEN'), chats: chats, tracks: ts, adminChat: s.adminChat || null, adminLink: g.bot && g.bot.username ? tgLink_(g.bot.username, 'admin') : '', lastTick: g.lastTick || null, upcoming: upcoming_(s), settings: { remindHour: s.remindHour, remindTypes: s.remindTypes, digest: s.digest, adminDigest: s.adminDigest, notifyChanges: s.notifyChanges, tpl: s.tpl, groupsPaused: !!s.groupsPaused } });
}
function tg_poll(token) {
  var a = auth_(token); needAdmin_(a);
  var err = '';
  try { tgPoll_(); } catch (e) { err = e.message; }
  var st = JSON.parse(tg_status(token)); st.pollErr = err;
  return JSON.stringify(st);
}
// target: معرّف مسار، أو 'admin' لمحادثة الإدارة، أو '' لإلغاء الربط
function tg_assign(token, chatId, target) {
  var a = auth_(token); needAdmin_(a);
  chatId = String(chatId || '');
  var g = readJson_('tg.json', {}), c = (g.known || {})[chatId];
  if (!c) throw new Error('هذه المحادثة لم يرها البوت بعد');
  var label = withLock_(function () {
    var l = assign_(chatId, c.title, target);
    log_(a, target && target !== 'admin' ? target : '', l ? 'ربط مجموعة تليجرام' : 'ألغى ربط مجموعة تليجرام', c.title);
    return l;
  });
  if (label) { try { tgSend_(chatId, linkedMsg_(label)); } catch (e) {} }
  return tg_status(token);
}
function tg_test(token, target) {
  var a = auth_(token); needAdmin_(a);
  var id = '';
  if (target === 'admin') { var s = cfg_(); id = s.adminChat && s.adminChat.id; }
  else { var t = trackOf_(target); id = t.chat && t.chat.id; }
  if (!id) throw new Error('لم تُربط محادثة بعد');
  tgSend_(id, 'رسالة تجربة من منصة الأنشطة التربوية ✓');
  return 'ok';
}
function remind_now(token) { var a = auth_(token); needAdmin_(a); var r = runReminders_(true); return JSON.stringify(r); }

/* ---------- التذكيرات ---------- */
// تذكير الإعداد قبل اللقاء بـ٢–٣ أيام، وتذكير النشر قبله بيوم (أو يومه إن أُضيف متأخراً)
function dueOf_(x, today) {
  var left = dayDiff_(x.d, today), sent = x.sent || {}, out = [];
  if (x.done) return out;
  if (left >= 2 && left <= 3 && sent.d3 !== x.d) out.push(['d3', left]);
  if (left >= 0 && left <= 1 && sent.d1 !== x.d) out.push(['d1', left]);
  return out;
}
function runReminders_(force) {
  var s = cfg_(), tz = tz_(), now = new Date(), today = Utilities.formatDate(now, tz, 'yyyy-MM-dd'), hour = +Utilities.formatDate(now, tz, 'H');
  var sent = 0, errs = [];
  if (!props_().getProperty('TG_TOKEN')) return { sent: 0, errs: ['لا بوت'] };
  if (!force && hour < s.remindHour) return { sent: 0, errs: [], wait: true };
  if (s.groupsPaused) return { sent: 0, errs: [], paused: true };   // لا تُعلَّم التذكيرات مُرسلة، فتصل بعد إعادة الإرسال
  tracks_().forEach(function (t) {
    if (!t.chat || !t.chat.id || t.remind === false) return;
    var p = plan_(t.id), queue = [];
    p.acts.forEach(function (x) { if (remindable_(x, s)) dueOf_(x, today).forEach(function (k) { queue.push([x.id, k[0], k[1]]); }); });
    if (!queue.length) return;
    var done = [];
    queue.forEach(function (q) {
      var x = p.acts.filter(function (y) { return y.id === q[0]; })[0];
      try { tgSend_(t.chat.id, remindText_(s.tpl[q[1]] || DEFAULTS.tpl[q[1]], x, t, q[2]), t.id); done.push(q); sent++; }
      catch (e) { errs.push(t.name + ': ' + e.message); }
    });
    if (done.length) withLock_(function () {
      var p2 = plan_(t.id);
      done.forEach(function (q) { p2.acts.forEach(function (y) { if (y.id === q[0]) { y.sent = y.sent || {}; y.sent[q[1]] = y.d; } }); });
      writeJson_('plan_' + t.id + '.json', p2);   // بلا رفع الإصدار: لا تغيير في الخطة نفسها
    });
  });
  return { sent: sent, errs: errs };
}
// ما سيُرسل خلال الأيام السبعة القادمة (للعرض في الإعدادات)
function upcoming_(s) {
  var today = today_(), out = [];
  tracks_().forEach(function (t) {
    var p = plan_(t.id);
    p.acts.forEach(function (x) {
      if (!remindable_(x, s) || x.done) return;
      var left = dayDiff_(x.d, today); if (left < 0 || left > 10) return;
      var sent = x.sent || {};
      [['d3', 3], ['d1', 1]].forEach(function (k) {
        var on = addDays_(x.d, -k[1]); if (k[0] === 'd3' && left < 2) return;
        if (dayDiff_(on, today) < 0) on = today;
        out.push({ t: t.id, id: x.id, title: x.title, d: x.d, kind: k[0], on: on, sent: sent[k[0]] === x.d, linked: !!(t.chat && t.chat.id) && t.remind !== false });
      });
    });
  });
  return out.sort(function (a, b) { return a.on < b.on ? -1 : a.on > b.on ? 1 : 0; }).slice(0, 40);
}
function weekOf_(today) { return addDays_(today, -wd_(today)); }
function runDigests_() {
  var s = cfg_(), tz = tz_(), now = new Date(), today = Utilities.formatDate(now, tz, 'yyyy-MM-dd'), hour = +Utilities.formatDate(now, tz, 'H');
  if (!props_().getProperty('TG_TOKEN')) return 0;
  var g = readJson_('tg.json', {}), wk = weekOf_(today), n = 0;
  if (!s.digest.on || wd_(today) !== s.digest.dow || hour < s.digest.hour || g.digestWeek === wk) return 0;
  var end = addDays_(wk, 6), lines = [];
  tracks_().forEach(function (t) {
    var p = plan_(t.id), acts = p.acts.filter(function (x) { return x.d >= wk && x.d <= end; }).sort(function (a, b) { return (a.d + (a.time || '99')) < (b.d + (b.time || '99')) ? -1 : 1; });
    var meet = acts.filter(function (x) { return remindable_(x, s); });
    lines.push((acts.length ? '• ' : '⚠ ') + t.name + ': ' + (acts.length ? countText_(acts.length) + (meet.length ? '، أقرب لقاء ' + dayText_(meet[0].d) : '') : 'لا أنشطة في الخطة هذا الأسبوع'));
    if (!t.chat || !t.chat.id || t.remind === false || !acts.length) return;
    var msg = 'أنشطة هذا الأسبوع في ' + (t.full || t.name) + ':\n' + acts.map(function (x) { return '• ' + dayText_(x.d) + (x.time ? ' ' + timeText_(x.time) : '') + ' — ' + x.type + ': ' + x.title + ((x.who && x.who.length) ? ' (' + x.who.join('، ') + ')' : ''); }).join('\n');
    try { tgSend_(t.chat.id, msg, t.id); n++; } catch (e) {}
  });
  if (s.adminDigest && s.adminChat && s.adminChat.id) {
    try { tgSend_(s.adminChat.id, 'ملخص الأسبوع (' + dayText_(wk) + ' – ' + dayText_(end) + '):\n' + lines.join('\n') + '\n\n' + SITE_URL); n++; } catch (e) {}
  }
  withLock_(function () { var g2 = readJson_('tg.json', {}); g2.digestWeek = wk; writeJson_('tg.json', g2); });
  return n;
}
/* ================= التقرير الأسبوعي =================
   مهمة مجدولة (Claude) تقرأ بيانات المنصة بمفتاح خاص للقراءة فقط، وتكتب تقريرًا شاملًا،
   ثم تحفظه هنا (صفحة «التقارير») وترسل خلاصته إلى محادثة الإدارة مع البوت. */
function reportKey_() { return props_().getProperty('REPORT_KEY') || ''; }
function needKey_(key) { var k = reportKey_(); if (!k || String(key || '') !== k) throw err_('مفتاح التقرير غير صحيح', 'auth'); }
function report_key(token, renew) {
  var a = auth_(token); needAdmin_(a);
  var k = reportKey_();
  if (!k || renew) { k = uid_() + uid_() + uid_(); props_().setProperty('REPORT_KEY', k); }
  return JSON.stringify({ key: k });
}
// كل ما يحتاجه التقرير: المسارات وجداول الفصل الحالي وأنشطته، وسجل التحديثات، وحال البوت والتقويم
function report_data(key, days) {
  needKey_(key);
  var s = cfg_(), g = readJson_('tg.json', {}), today = today_(), since = now_() - Math.max(1, Math.min(60, +days || 14)) * 864e5;
  var tracks = tracks_().map(function (t) {
    var p = plan_(t.id), S = p.sems[String(t.cur)] || null;
    return {
      id: t.id, name: t.name, full: t.full, cohort: t.cohort, age: t.age, cur: t.cur, canEdit: !!t.canEdit, members: t.members || [],
      bot: { linked: !!(t.chat && t.chat.id), group: t.chat ? t.chat.title : '', remind: t.remind !== false }, editReq: t.editReq || null,
      sem: S ? { title: S.title, start: S.start, end: S.end, days: S.days } : null,
      acts: p.acts.map(function (x) { return { title: x.title, type: x.type, d: x.d, time: x.time || '', who: x.who || [], idea: x.idea || '', done: !!x.done, note: x.note || '', link: x.link || '', sem: x.sem, by: x.by || '', calendar: !!(x.cal && x.cal.id), calErr: x.cal && x.cal.err || '', reminders: remindable_(x, s), sent: x.sent || {} }; })
    };
  });
  return JSON.stringify({
    today: today, weekStart: weekOf_(today), tz: tz_(), site: SITE_URL, days: DAYS,
    settings: { remindHour: s.remindHour, remindTypes: s.remindTypes, digest: s.digest, notifyChanges: s.notifyChanges, calendar: s.calName || 'التقويم الأساسي' },
    bot: { username: g.bot ? g.bot.username : '', adminLinked: !!(s.adminChat && s.adminChat.id), lastTick: g.lastTick || null },
    tracks: tracks,
    log: readJson_('log.json', []).filter(function (x) { return x.at >= since; }),
    lastReports: readJson_('reports.json', []).slice(0, 2).map(function (r) { return { at: r.at, title: r.title }; })
  });
}
// يحفظ التقرير ويرسل خلاصته (tg) أو نصّه كاملًا إلى محادثة الإدارة، مقسومًا على رسائل
function report_send(key, title, text, tg) {
  needKey_(key);
  title = txt_(title, 120) || 'التقرير الأسبوعي'; text = clip_(text, 60000);
  var rep = withLock_(function () {
    var L = readJson_('reports.json', []), r = { id: uid_(), at: now_(), title: title, text: text };
    L.unshift(r); if (L.length > 60) L.length = 60;
    writeJson_('reports.json', L); props_().setProperty('rev_meta', String(now_()));
    log_(null, '', 'أضاف التقرير الأسبوعي', title);
    return r;
  });
  var s = cfg_(), sent = 0, err = '';
  if (s.adminChat && s.adminChat.id && props_().getProperty('TG_TOKEN')) {
    var body = String(tg || text) + '\n\nالتقرير كاملًا في المنصة: ' + SITE_URL + '#reports';
    try { chunks_(title + '\n\n' + body, 3800).forEach(function (c) { tgSend_(s.adminChat.id, c); sent++; }); } catch (e) { err = e.message; }
  } else err = 'لم تُربط محادثة الإدارة بالبوت بعد';
  return JSON.stringify({ id: rep.id, saved: true, sent: sent, err: err });
}
function chunks_(t, n) {
  var out = [], cur = '';
  String(t).split('\n').forEach(function (line) {
    while (line.length > n) { if (cur) { out.push(cur); cur = ''; } out.push(line.slice(0, n)); line = line.slice(n); }
    if ((cur + '\n' + line).length > n) { out.push(cur); cur = line; } else cur = cur ? cur + '\n' + line : line;
  });
  if (cur) out.push(cur);
  return out;
}
function report_list(token) { var a = auth_(token); needAdmin_(a); return JSON.stringify(readJson_('reports.json', [])); }

// المؤقّت: كل ساعة
// قبل الاختبار بأسبوع تقريباً: اقتراح كاهوت مراجعة في مجموعة الفريق، مرة واحدة لكل اختبار، إن لم يكن في الخطة كاهوت قبله
function runSuggest_() {
  var s = cfg_(), tz = tz_(), now = new Date(), today = Utilities.formatDate(now, tz, 'yyyy-MM-dd'), hour = +Utilities.formatDate(now, tz, 'H');
  if (!props_().getProperty('TG_TOKEN') || hour < s.remindHour || s.groupsPaused) return 0;
  var g = readJson_('tg.json', {}), done = g.kahoot || {}, n = 0, sentKeys = [];
  tracks_().forEach(function (t) {
    if (!t.chat || !t.chat.id || t.remind === false) return;
    var p = plan_(t.id), S = p.sems[String(t.cur)]; if (!S) return;
    (S.days || []).forEach(function (x) {
      if (!x.ev || !/اختبار/.test(x.ev)) return;
      var left = dayDiff_(x.d, today), key = t.id + '|' + x.d;
      if (left < 4 || left > 8 || done[key]) return;
      var has = p.acts.some(function (y) { return y.type === 'كاهوت' && y.d >= addDays_(x.d, -12) && y.d <= x.d; });
      if (has) { sentKeys.push(key); return; }
      var msg = 'بعد ' + countDays_(left) + ' ' + x.ev + ' (' + dayText_(x.d) + ').\nاقتراح: كاهوت مراجعة قبله، يثبّت ما درسه الطلاب ويخفّف رهبة الاختبار.\nأضيفوه في خطة المسار: ' + SITE_URL + '#t/' + t.id;
      try { tgSend_(t.chat.id, msg, t.id); n++; sentKeys.push(key); } catch (e) {}
    });
  });
  if (sentKeys.length) withLock_(function () { var g2 = readJson_('tg.json', {}); g2.kahoot = g2.kahoot || {}; sentKeys.forEach(function (k) { g2.kahoot[k] = today; }); writeJson_('tg.json', g2); });
  return n;
}
function countDays_(n) { return n === 1 ? 'يوم' : n === 2 ? 'يومين' : n <= 10 ? n + ' أيام' : n + ' يوماً'; }
function tick() {
  var r = { at: now_(), ok: true, msg: '', sent: 0 };
  try { tgPoll_(); } catch (e) { r.msg += 'استقبال: ' + e.message + ' '; }
  try { var x = runReminders_(false); r.sent += x.sent; if (x.errs.length) { r.ok = false; r.msg += x.errs.join('؛ '); } } catch (e) { r.ok = false; r.msg += e.message; }
  try { r.sent += runDigests_(); } catch (e) { r.ok = false; r.msg += ' ملخص: ' + e.message; }
  try { r.sent += runSuggest_(); } catch (e) { r.msg += ' اقتراح: ' + e.message; }
  try { withLock_(function () { var g = readJson_('tg.json', {}); g.lastTick = r; writeJson_('tg.json', g); }); } catch (e) {}
  return r;
}
function ensureTriggers_(log) {
  var has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'tick'; });
  if (!has) { ScriptApp.newTrigger('tick').timeBased().everyHours(1).create(); log.push('أُنشئ المؤقّت (كل ساعة): التذكيرات والملخص الأسبوعي.'); }
  else log.push('المؤقّت موجود.');
}

/* ================= التجهيز ================= */
// شغّلها مرة من المحرر: تنشئ مجلد البيانات والمسارات والحسابات والمؤقّت، وتطبع كلمات المرور في السجل
function setup() {
  var log = [], p = props_();
  if (!p.getProperty('DATA_DIR')) {
    var it = DriveApp.getRootFolder().getFoldersByName(DATA_DIR_NAME);
    var f = it.hasNext() ? it.next() : DriveApp.createFolder(DATA_DIR_NAME);
    p.setProperty('DATA_DIR', f.getId());
    log.push('مجلد البيانات: ' + DATA_DIR_NAME);
  } else log.push('مجلد البيانات موجود.');
  secret_();
  var creds = [];
  withLock_(function () {
    if (!jfile_('tracks.json')) { writeJson_('tracks.json', TRACKS_SEED.map(function (t) { var o = JSON.parse(JSON.stringify(t)); o.members = []; o.canEdit = true; o.remind = true; o.chat = null; return o; })); log.push('أُنشئت المسارات الستة.'); }
    if (!jfile_('settings.json')) writeJson_('settings.json', {});
    if (!jfile_('log.json')) writeJson_('log.json', []);
    if (!jfile_('tg.json')) writeJson_('tg.json', { offset: 0, known: {} });
    var all = readJson_('accounts.json', null);
    if (!all || !Object.keys(all).length) {
      all = {};
      var mk = function (user, name, role, track) { var x = { uid: uid_(), user: user, name: name, role: role, track: track || '', created: now_(), tv: 0 }, pw = tempPass_(); setPass_(x, pw); all[x.uid] = x; creds.push([name, user, pw]); };
      mk('admin', 'المدير العام', 'admin', '');
      TRACKS_SEED.forEach(function (t) { mk(t.id, 'فريق ' + t.name, 'team', t.id); });
      writeJson_('accounts.json', all);
      log.push('أُنشئت الحسابات:');
      creds.forEach(function (c) { log.push('  ' + c[0] + ' — المستخدم: ' + c[1] + ' — كلمة المرور: ' + c[2]); });
    } else log.push('الحسابات موجودة (' + Object.keys(all).length + ').');
  });
  ensureTriggers_(log);
  try { log.push('التقويم: ' + CalendarApp.getDefaultCalendar().getName()); } catch (e) { log.push('تعذّر الوصول إلى التقويم: ' + e.message); }
  log.push('المنطقة الزمنية: ' + tz_());
  log.push('الخطوة التالية: نشر ← نشر جديد ← تطبيق ويب، «تنفيذ باسم: أنا»، «من يمكنه الوصول: أي شخص».');
  Logger.log(log.join('\n'));
  return log.join('\n');
}
