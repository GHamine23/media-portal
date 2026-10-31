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
var VERSION = '1.3.0';
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
  tpl: { d3: '', d1: '' },             // فارغ = الرسائل الغنية المتنوعة؛ ويُكتب نص مخصّص عند الحاجة
  adminTasks: true,                    // مهام الأسبوع للإدارة على الخاص يوم الملخص
  checkins: true                       // سؤال «هل أُقيم؟» بعد النشاط بساعتين
};
var OLD_TPL = ['تذكير: {العنوان}\nموعده {الموعد} ({متى}).\nحان وقت تصميم إعلان اللقاء وإعداد نصّه.\nالمسؤول: {المسؤول}', 'تذكير: {العنوان}\nموعده {الموعد} ({متى}).\nاليوم موعد نشر إعلان اللقاء.\nالمسؤول: {المسؤول}'];   // نصوص قديمة تُعامل كأنها فارغة
function customTpl_(s, k) { var v = (s.tpl || {})[k]; return v && OLD_TPL.indexOf(v) < 0 ? v : ''; }

/* ================= نقطة الاتصال ================= */
function apiFns_() {
  return {
    info: info, login: login,
    boot: boot, revs: revs, plan: plan, pass: pass,
    act_save: act_save, act_del: act_del, act_series: act_series, share_set: share_set, pub_plan: pub_plan, tg_relay: tg_relay, cards_todo: cards_todo, card_put: card_put,
    day_save: day_save, sem_put: sem_put, sem_import: sem_import, sem_del: sem_del,
    track_save: track_save, settings_save: settings_save, log_list: log_list,
    acc_list: acc_list, acc_save: acc_save, acc_reset: acc_reset, acc_del: acc_del,
    cal_list: cal_list, cal_set: cal_set, cal_push: cal_push,
    tg_token: tg_token, tg_status: tg_status, tg_poll: tg_poll, tg_assign: tg_assign, tg_test: tg_test, remind_now: remind_now,
    tg_check: tg_check, edit_request: edit_request,
    ui_fonts: ui_fonts, ui_font_get: ui_font_get, font_put: font_put,
    report_key: report_key, report_data: report_data, report_send: report_send, report_file: report_file, report_list: report_list,
    alerts: alerts, alerts_seen: alerts_seen, meet_create: meet_create, meet_unlink: meet_unlink,
    login_atar: login_atar, atar_links: atar_links, atar_link: atar_link, atar_unlink: atar_unlink,
    task_save: task_save, task_del: task_del, tg_menu: tg_menu,
    link_in: link_in, link_check: link_check, atar_sso: atar_sso
  };
}
function doPost(e) {
  var out, t0 = Date.now(); JC = {};
  try {
    var req = JSON.parse(e.postData.contents);
    var fn = apiFns_()[req.fn];
    if (!fn) throw new Error('طلب غير معروف');
    out = { result: fn.apply(null, req.args || []) };
  } catch (err) {
    out = { error: String(err && err.message || err) };
    if (err && err.code) out.code = err.code;
  }
  out.ms = Date.now() - t0;   // زمن التنفيذ داخل الخادم (لقياس السرعة)
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
// ذاكرة الخادم السريعة: الملف الكبير يُقسَم أجزاءً (حدّ القيمة الواحدة ١٠٠ ك.ب بالبايت، والعربية حرفان أو ثلاثة لكل حرف)
var CACHE_PART = 30000;
function cacheGet_(c, k) {
  var h = c.get(k); if (h == null) return null;
  if (h.slice(0, 7) !== '#PARTS:') return h;
  var n = +h.slice(7), keys = []; for (var i = 0; i < n; i++) keys.push(k + ':' + i);
  var m = c.getAll(keys), out = '';
  for (var j = 0; j < n; j++) { if (m[keys[j]] == null) return null; out += m[keys[j]]; }
  return out;
}
function cachePut_(c, k, s) {
  try {
    if (s.length <= CACHE_PART) { c.put(k, s, 21600); return; }
    var n = Math.ceil(s.length / CACHE_PART), o = {};
    if (n > 40) { c.remove(k); return; }
    for (var i = 0; i < n; i++) o[k + ':' + i] = s.slice(i * CACHE_PART, (i + 1) * CACHE_PART);
    c.putAll(o, 21600); c.put(k, '#PARTS:' + n, 21600);
  } catch (e) { try { c.remove(k); } catch (e2) {} }
}
function readJson_(name, def) {
  if (JC.hasOwnProperty(name)) return JSON.parse(JC[name]);
  var c = CacheService.getScriptCache(), k = 'j:' + name, hit = cacheGet_(c, k);
  if (hit != null) { JC[name] = hit; try { return JSON.parse(hit); } catch (e) {} }
  var f = jfile_(name); if (!f) return def;
  var s = f.getBlob().getDataAsString(), v;
  try { v = JSON.parse(s); } catch (e) { return def; }
  JC[name] = s;
  cachePut_(c, k, s);
  return v;
}
function writeJson_(name, obj) {
  var s = JSON.stringify(obj), id = props_().getProperty('jf_' + name), f = null;
  if (id) { try { f = DriveApp.getFileById(id); f.setContent(s); } catch (e) { f = null; } }   // الطريق السريع: الملف معروف
  if (!f) { f = jfile_(name); if (f) f.setContent(s); else { f = dataFolder_().createFile(name, s, 'application/json'); props_().setProperty('jf_' + name, f.getId()); } }
  JC[name] = s;
  cachePut_(CacheService.getScriptCache(), 'j:' + name, s);
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
function plan_(tid) { var p = readJson_('plan_' + tid + '.json', null) || {}; p.sems = p.sems || {}; p.acts = p.acts || []; p.tasks = p.tasks || []; p.rev = p.rev || 0; return p; }
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

// التحكم التفصيلي في مجموعات الفرق (قرار أمين، ٣٠ أكتوبر): لكل مجموعة مفتاح رئيسي (t.remind) وما يُرسل فيها (t.send):
// rem التذكيرات، ck سؤال «هل تم؟»، wk خطة الأسبوع ومهامه، al التنبيهات (نقل لقاء قريب أو إلغاؤه، واقتراح الكاهوت). وفوقها كلها الإيقاف العام groupsPaused.
var SEND_KINDS = ['rem', 'ck', 'wk', 'al'];
function sendOf_(t) { var o = {}, s = (t && t.send) || {}; SEND_KINDS.forEach(function (k) { o[k] = s[k] !== false; }); return o; }
function gOn_(t, kind) { return !!(t && t.chat && t.chat.id) && t.remind !== false && (!kind || sendOf_(t)[kind]); }

/* ================= الحسابات والجلسات =================
   accounts.json: { uid: {uid, user, name, role: admin|sup|team, track, salt, hash, tv, fails, lockUntil, created, last, disabled} }
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
function pubAcc_(a) { return { uid: a.uid, user: a.user, name: a.name, role: a.role, track: a.track || '', created: a.created || 0, last: a.last || 0, disabled: !!a.disabled, atar: a.atar || '',
  linked: !!a.atarUid, atarSup: !!a.atarSup, lkPend: !!a.lkPend, lkErr: a.lkErr || '' }; }
function meOf_(a) { return { uid: a.uid, user: a.user, name: a.name, role: a.role, track: a.track || '', atar: !!a.atar, linked: !!a.atarUid }; }
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
// المشرف العام (sup): يرى المسارات كلها ويعدّل خططها كالإدارة، بلا الحسابات والبوت والتقويم والإعدادات
function allT_(a) { return a.role === 'admin' || a.role === 'sup'; }
function canView_(a, tid) { if (!allT_(a) && a.track !== tid) throw new Error('هذا المسار ليس من صلاحيتك'); }
function canEdit_(a, tid) {
  canView_(a, tid);
  if (allT_(a)) return;
  if (!trackOf_(tid).canEdit) throw new Error('تعديل الخطة مغلق، ويفتحه المدير العام');
}

function login(user, pw) {
  user = norm_(clip_(user, 60)); pw = String(pw || '');
  if (!user || !pw) throw new Error('اكتب اسم المستخدم وكلمة المرور');
  var st = withLock_(function () {
    var all = accs_(), a = null;
    Object.keys(all).forEach(function (k) { if (norm_(all[k].user) === user) a = all[k]; });
    if (!a || a.atar) throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    if (a.disabled) throw new Error('هذا الحساب موقوف');
    if (a.lockUntil && a.lockUntil > now_()) throw new Error('محاولات كثيرة، حاول بعد دقائق');
    if (pwHash_(a.salt, pw, a.it) === a.hash) return { uid: a.uid, ok: true, push: !!(a.atarUid && a.lkPend) };
    if (a.atarUid) return { uid: a.uid, ask: true };   // حساب مربوط بأثر: تُقبل كلمة أثر حتى تتوحّد الكلمتان
    failLogin_(all, a);
    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
  });
  var a0 = accs_()[st.uid];
  if (st.ask) {
    var good = false; try { good = !!linkSend_({ op: 'verify', atar: a0.atarUid, pw: pw }).ok; } catch (e) {}
    if (!good) { withLock_(function () { var all = accs_(); failLogin_(all, all[st.uid]); }); throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة'); }
  } else if (st.push && pw.length >= 8) {
    try { linkSend_({ op: 'pass', atar: a0.atarUid, pw: pw }); st.pushed = true; } catch (e) {}
  }
  return withLock_(function () {
    var all = accs_(), a = all[st.uid];
    if (st.ask) { setPass_(a, pw); a.lkPend = false; }
    if (st.pushed) a.lkPend = false;
    a.fails = 0; a.lockUntil = 0; a.last = now_();
    if ((a.it || 1200) !== PW_IT) setPass_(a, pw);   // ترقية التجزئة دون تغيير كلمة المرور
    writeJson_('accounts.json', all);
    return JSON.stringify({ token: mkToken_(a), me: meOf_(a) });
  });
}
function failLogin_(all, a) {
  a.fails = (a.fails || 0) + 1;
  if (a.fails >= 8) { a.lockUntil = now_() + 10 * 60e3; a.fails = 0; }
  writeJson_('accounts.json', all);
}
/* ================= الدخول بحساب أثر =================
   الواجهة تدخل إلى أثر مباشرة (auth_login) ثم ترسل رمز أثر هنا، فنتحقق منه عند خادم أثر (auth_me) ونفتح حساب ظلٍّ:
   المدير العام في أثر = الإدارة، والحساب المربوط بمسار (atar_links.json: {atarUid: {track, name, username, at}}) = فريق ذلك المسار.
   سنابل خارج الربط بأثر، وحسابات المنصة القديمة تبقى تعمل حتى توقفها الإدارة. */
var ATAR_API = 'https://script.google.com/macros/s/AKfycbzBUiyrhbixemmecyGrcGfhWQhmUq-i7ZGKi9fgpg8OlMBJKLDkQLVbndTk5kZsakl4/exec';
var ATAR_SITE = 'https://ghamine23.github.io/media-portal/';
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
  var lk = linkedOf_(me.uid);
  if (lk) {   // حساب أثر مربوط بحساب في المنصة: يدخل به نفسه
    if (lk.disabled) throw new Error('هذا الحساب موقوف في منصة الأنشطة');
    return withLock_(function () { var all = accs_(), a = all[lk.uid]; a.last = now_(); writeJson_('accounts.json', all); return JSON.stringify({ token: mkToken_(a), me: meOf_(a), atar: { mustChange: !!me.mustChange, username: me.username || '' } }); });
  }
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
/* ================= الحساب الموحّد مع أثر =================
   (طلب أمين، ٣١ أكتوبر) حساب الفريق هنا يُنشأ معه حسابه في أثر بالاسم نفسه وكلمة المرور نفسها وصلاحيات مساره،
   وتغيير كلمة المرور في أي منهما يسري على الأخرى، ومن دخل إحداهما يجد الأخرى مفتوحة (atar_sso وlogin_atar).
   لا مفتاح مشتركًا بين الخادمين: كل طلب يحمل رمزًا لمرة واحدة، فيسأل مستقبِله مرسِلَه (link_check) هل أصدره بهذا المحتوى.
   في الحساب: atarUid حسابه في أثر، lkPend كلمتاه لم تتوحّدا بعد، atarSup مشرف مساره في أثر، lkErr آخر خطأ ربط. سنابل خارج الربط. */
function linkHash_(s) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8)); }
function linkIssue_(payload) { var n = Utilities.getUuid() + Utilities.getUuid(); CacheService.getScriptCache().put('lk:' + n, linkHash_(payload), 120); return n; }
function link_check(nonce, hash) {
  var c = CacheService.getScriptCache(), k = 'lk:' + clip_(nonce, 100), v = c.get(k);
  if (!v || v !== String(hash || '')) return 'no';
  c.remove(k); return 'ok';
}
function linkSend_(o) { var p = JSON.stringify(o); return atarCall_('link_op', [linkIssue_(p), p]); }
// طلب من خادم أثر: يُنفَّذ بعد التحقق منه عنده
function link_in(nonce, json) {
  json = String(json || '');
  if (json.length > 20000) throw new Error('طلب ربط كبير');
  if (atarCall_('link_check', [String(nonce || ''), linkHash_(json)]) !== 'ok') throw new Error('طلب ربط غير موثّق');
  var o = JSON.parse(json);
  return JSON.stringify(withLock_(function () {
    var all = accs_(), a = all[o.ans];
    if (!a || !a.atarUid) throw new Error('حساب المنصة غير مربوط');
    if (o.op === 'verify') {
      if (a.disabled) return { ok: false };
      var ok = pwHash_(a.salt, String(o.pw || ''), a.it) === a.hash;
      if (!ok) failLogin_(all, a);
      return { ok: ok };
    }
    if (o.op === 'pass') {
      var pw = String(o.pw || ''); if (pw.length < 8) throw new Error('كلمة المرور ثمانية أحرف على الأقل');
      setPass_(a, pw); a.tv = (a.tv || 0) + 1; a.lkPend = false; a.fails = 0; a.lockUntil = 0;
      writeJson_('accounts.json', all);
      return { ok: true };
    }
    throw new Error('عملية ربط غير معروفة');
  }));
}
function linkedOf_(atarUid) { var all = accs_(); return Object.keys(all).map(function (k) { return all[k]; }).filter(function (x) { return x.atarUid === atarUid && !x.atar; })[0] || null; }
// حساب يُربط بأثر: حساب فريق في مسار داخل الربط، أو مشرف عام، أو حساب سبق ربطه
function linkable_(x) { return !!x && !x.atar && (!!x.atarUid || x.role === 'sup' || (x.role === 'team' && !!ATAR_TRACK[x.track])); }
// ينشئ حسابه في أثر أو يحدّثه. pw: كلمة المرور إن عُرفت الآن. merge: حساب أثر قائم يُدمج به
function linkSync_(uid, pw, merge) {
  var x = accs_()[uid];
  if (!linkable_(x) && !merge) return null;
  var r = null, err = '';
  try {
    r = linkSend_({ op: 'upsert', atar: merge || x.atarUid || '', pw: pw || '',
      ans: { uid: x.uid, user: x.user, name: x.name, role: x.role, track: x.role === 'team' ? ATAR_TRACK[x.track] || '' : '', sup: x.role === 'team' && !!x.atarSup, disabled: !!x.disabled } });
  } catch (e) { err = String(e.message || e); }
  withLock_(function () {
    var all = accs_(), y = all[uid]; if (!y) return;
    if (r) { y.atarUid = r.atar; y.lkPend = !!r.pend; delete y.lkErr; } else y.lkErr = clip_(err, 200);
    writeJson_('accounts.json', all);
  });
  return r ? { username: r.username, isNew: !!r.isNew } : { err: err };
}
// تغيّرت كلمة المرور هنا: تسري على أثر، وإن تعذّر الاتصال تتوحّد عند الدخول التالي
function linkPassOut_(uid, pw) {
  var x = accs_()[uid];
  if (!x || !x.atarUid) { if (linkable_(x)) linkSync_(uid, pw); return; }
  var ok = false; try { linkSend_({ op: 'pass', atar: x.atarUid, pw: pw }); ok = true; } catch (e) {}
  withLock_(function () { var all = accs_(); if (all[uid]) { all[uid].lkPend = !ok; writeJson_('accounts.json', all); } });
}
// الدخول مرة واحدة: جلسة في أثر لمن دخل المنصة بحساب مربوط
function atar_sso(token) {
  var a = auth_(token);
  if (!a.atarUid) return JSON.stringify({ none: true });
  var r = linkSend_({ op: 'session', atar: a.atarUid });
  return JSON.stringify({ token: r.token, username: r.username });
}
/* ربط الحسابات الموجودة دفعة واحدة (يُشغَّل من المحرر: linkAllAtar). pairs: {معرّف حساب المنصة: معرّف حساب أثر يُدمج به}.
   حساب الفريق بلا زوج يُنشأ له حساب في أثر، وتتوحّد كلمة مروره عند أول دخول. يصل الإدارة تقرير بما رُبط. */
function linkAll_(pairs) {
  pairs = pairs || {};
  var all = accs_(), out = [];
  Object.keys(all).map(function (k) { return all[k]; }).filter(function (x) { return !x.atar && !x.disabled && (linkable_(x) || pairs[x.uid]); })
    .forEach(function (x) { var r = linkSync_(x.uid, null, pairs[x.uid] || ''); out.push({ name: x.name, user: x.user, track: x.track, res: r }); });
  var T = function (id) { var t = tracks_().filter(function (y) { return y.id === id; })[0]; return t ? (t.full || t.name) : 'الإدارة'; };
  var ok = out.filter(function (o) { return o.res && !o.res.err; }), bad = out.filter(function (o) { return !o.res || o.res.err; });
  adminTgHtml_('<b>رُبطت حسابات منصة الأنشطة بأثر</b>\n' + (ok.length ? ok.map(function (o) { return '• ' + h_(o.name) + ' (' + h_(T(o.track)) + '): ' + (o.res.isNew ? 'حساب جديد في أثر' : 'دُمج بحسابه في أثر') + '، اسم الدخول <code>' + h_(o.res.username) + '</code>'; }).join('\n') : 'لم يُربط حساب.') +
    (bad.length ? '\n\n<b>تعذّر ربط:</b>\n' + bad.map(function (o) { return '• ' + h_(o.name) + ': ' + h_((o.res && o.res.err) || 'خارج الربط'); }).join('\n') : '') +
    '\n\nكلمة المرور تتوحّد في المنصتين عند أول دخول لكل حساب، ومن دخل المنصة يجد أثر مفتوحًا بحسابه.');
  return JSON.stringify(out.map(function (o) { return { name: o.name, track: o.track, res: o.res }; }));
}
// أزواج الدمج من سجل ربط أثر (atar_links): عضو المسار نفسه بالاسم نفسه أو بأوله، وحساب الإدارة ↔ المدير العام في أثر
function linkPairs_() {
  var all = accs_(), L = readJson_('atar_links.json', {}), pairs = {}, notes = [];
  var nm = function (v) { return String(v || '').replace(/^أ\.\s*/, '').replace(/[ً-ْـ]/g, '').replace(/\s+/g, ' ').trim(); };
  var real = Object.keys(all).map(function (k) { return all[k]; }).filter(function (x) { return !x.atar && !x.disabled; });
  Object.keys(L).forEach(function (au) {
    var l = L[au], n = nm(l.name);
    var c = real.filter(function (x) { var m = nm(x.name); return x.role === 'team' && x.track === l.track && n && m && (m === n || m.indexOf(n + ' ') === 0 || n.indexOf(m + ' ') === 0); });
    if (c.length === 1 && !c[0].atarUid && !Object.keys(pairs).some(function (k) { return pairs[k] === au; })) pairs[c[0].uid] = au;
    else notes.push((l.name || au) + ': ' + (c.length ? 'أكثر من حساب محتمل' : 'لا حساب له في المنصة') );
  });
  var admins = real.filter(function (x) { return x.role === 'admin' && !x.atarUid; });
  var sh = Object.keys(all).map(function (k) { return all[k]; }).filter(function (x) { return x.atar && x.role === 'admin'; });
  if (admins.length === 1 && sh.length === 1) pairs[admins[0].uid] = sh[0].atar; else notes.push('حساب الإدارة: يُربط يدويًا (' + admins.length + ' حساب إدارة، ' + sh.length + ' مدير في أثر دخل المنصة)');
  return { pairs: pairs, notes: notes };
}
// تُشغَّل من المحرر. الأولى تعرض الخطة بلا تنفيذ، والثانية تربط
function linkPlanAtar() {
  var P = linkPairs_(), all = accs_(), ids = Object.keys(P.pairs).map(function (k) { return P.pairs[k]; }), peek = {};
  try { atarPeek_(ids).forEach(function (r) { peek[r.uid] = r; }); } catch (e) { P.notes.push('تعذّر سؤال أثر: ' + e.message); }
  var lines = Object.keys(all).map(function (k) { return all[k]; }).filter(function (x) { return !x.atar && !x.disabled && (linkable_(x) || P.pairs[x.uid]); }).map(function (x) {
    var au = P.pairs[x.uid], pk = au && peek[au];
    return x.name + ' [' + (x.track || 'الإدارة') + '] ← ' + (x.atarUid ? 'مربوط من قبل' : au ? 'دمج بحساب أثر «' + (pk ? pk.username + ' / ' + pk.name : au) + '»' + (pk && pk.linked ? ' (مربوط بغيره!)' : '') : 'حساب جديد في أثر باسم ' + x.user);
  });
  Logger.log(lines.concat(P.notes.map(function (n) { return 'ملاحظة: ' + n; })).join('\n'));
}
function atarPeek_(ids) { return ids.length ? linkSend_({ op: 'peek', ids: ids }) : []; }
function linkAllAtar() { Logger.log(linkAll_(linkPairs_().pairs)); }
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
  if (newPw.length < 8) throw new Error('كلمة المرور ثمانية أحرف على الأقل');
  // الحساب المربوط تُقبل فيه كلمة أثر الحالية أيضًا (قبل توحيد الكلمتين)
  var viaAtar = false;
  if (a.atarUid && pwHash_(a.salt, String(oldPw || ''), a.it) !== a.hash) { try { viaAtar = !!linkSend_({ op: 'verify', atar: a.atarUid, pw: String(oldPw || '') }).ok; } catch (e) {} }
  var r = withLock_(function () {
    var all = accs_(), x = all[a.uid];
    if (!viaAtar && pwHash_(x.salt, oldPw, x.it) !== x.hash) throw new Error('كلمة المرور الحالية غير صحيحة');
    setPass_(x, newPw); x.tv = (x.tv || 0) + 1;
    writeJson_('accounts.json', all);
    return { token: mkToken_(x) };
  });
  linkPassOut_(a.uid, newPw);
  return JSON.stringify(r);
}
function acc_list(token) { var a = auth_(token); needAdmin_(a); var all = accs_(); return JSON.stringify(Object.keys(all).map(function (k) { return pubAcc_(all[k]); })); }
// {uid?, user, name, role, track, disabled} — عند الإنشاء تُعاد كلمة مرور مؤقتة
function acc_save(token, json) {
  var a = auth_(token); needAdmin_(a);
  var o = JSON.parse(json);
  var res = withLock_(function () {
    var all = accs_(), x = o.uid ? all[o.uid] : null, fresh = !x, pw = '';
    var user = norm_(txt_(o.user, 40));
    if (!/^[a-z0-9_.\-؀-ۿ]{2,40}$/.test(user)) throw new Error('اسم المستخدم حروف وأرقام بلا مسافات');
    Object.keys(all).forEach(function (k) { if (k !== (o.uid || '') && norm_(all[k].user) === user) throw new Error('اسم المستخدم مستعمل'); });
    var role = o.role === 'admin' ? 'admin' : o.role === 'sup' ? 'sup' : 'team';
    var track = role === 'team' ? String(o.track || '') : '';
    if (role === 'team') trackOf_(track);
    if (fresh) { x = { uid: uid_(), created: now_(), tv: 0 }; pw = tempPass_(); setPass_(x, pw); all[x.uid] = x; }
    if (x.uid === a.uid && (role !== 'admin' || o.disabled)) throw new Error('لا يمكنك تقييد حسابك');
    x.user = user; x.name = txt_(o.name, 60) || user; x.role = role; x.track = track; x.disabled = !!o.disabled;
    if ('atarSup' in o) x.atarSup = role === 'team' && !!o.atarSup;
    writeJson_('accounts.json', all);
    log_(a, track, fresh ? 'أنشأ حساباً' : 'عدّل حساباً', x.name);
    return { acc: x, pass: pw };
  });
  var lk = linkSync_(res.acc.uid, res.pass || null);
  return JSON.stringify({ acc: pubAcc_(accs_()[res.acc.uid]), pass: res.pass, atar: lk });
}
function acc_reset(token, uid) {
  var a = auth_(token); needAdmin_(a);
  var r = withLock_(function () {
    var all = accs_(), x = all[uid]; if (!x) throw new Error('الحساب غير موجود');
    var pw = tempPass_(); setPass_(x, pw); x.tv = (x.tv || 0) + 1; x.fails = 0; x.lockUntil = 0;
    writeJson_('accounts.json', all);
    return { pass: pw, token: x.uid === a.uid ? mkToken_(x) : '', uid: x.uid };
  });
  linkPassOut_(r.uid, r.pass);
  delete r.uid;
  return JSON.stringify(r);
}
function acc_del(token, uid) {
  var a = auth_(token); needAdmin_(a);
  if (uid === a.uid) throw new Error('لا يمكنك حذف حسابك');
  var gone = withLock_(function () { var all = accs_(); if (!all[uid]) throw new Error('الحساب غير موجود'); var x = all[uid]; delete all[uid]; writeJson_('accounts.json', all); log_(a, '', 'حذف حساباً', x.name); return x; });
  if (gone.atarUid) { try { linkSend_({ op: 'unlink', atar: gone.atarUid, disable: true }); } catch (e) {} }   // يوقف حسابه في أثر وتبقى تصاميمه
  return 'ok';
}

/* ================= حسابات أعضاء الفريق =================
   حساب لكل عضو في «الفريق» ليس له حساب باسمه في مساره. بيانات كل عضو تصل محادثة الإدارة مباشرة في رسالة جاهزة للتحويل إليه،
   فلا تظهر كلمة المرور المؤقتة في الرد ولا في السجل. users: {اسم العضو: اسم المستخدم}، وإلا فاسم المسار ورقم. */
function memberAccounts_(tid, users) {
  var t = trackOf_(tid), s = cfg_();
  if (!s.adminChat || !s.adminChat.id || !props_().getProperty('TG_TOKEN')) throw new Error('محادثة الإدارة غير مربوطة بالبوت');
  users = users || {};
  var res = withLock_(function () {
    var all = accs_(), taken = {}, made = [], had = [];
    Object.keys(all).forEach(function (k) { taken[norm_(all[k].user)] = 1; });
    (t.members || []).forEach(function (m, i) {
      var old = Object.keys(all).map(function (k) { return all[k]; }).filter(function (x) { return (x.role === 'sup' || (x.track === tid && x.role === 'team')) && norm_(x.name) === norm_(m); })[0];
      if (old) { had.push({ name: m, user: old.user }); return; }
      var base = norm_(users[m] || (tid + '.' + (i + 1))).replace(/[^a-z0-9_.\-]/g, '') || (tid + '.' + (i + 1)), u = base, n = 2;
      while (taken[u]) u = base + (n++);
      var x = { uid: uid_(), created: now_(), tv: 0 }, pw = tempPass_(); setPass_(x, pw);
      x.user = u; x.name = m; x.role = 'team'; x.track = tid; x.disabled = false;
      all[x.uid] = x; taken[u] = 1; made.push({ uid: x.uid, name: m, user: u, pw: pw });
    });
    if (made.length) writeJson_('accounts.json', all);
    return { made: made, had: had };
  });
  res.made.forEach(function (o) { log_(null, tid, 'أنشأ حساباً', o.name); o.atar = linkSync_(o.uid, o.pw); });
  var nm = t.full || t.name, chat = s.adminChat.id;
  var head = '<b>حسابات أعضاء ' + h_(nm) + ' في منصة الأنشطة</b>\n' +
    (res.made.length ? 'أُنشئ ' + accText_(res.made.length) + '. كل رسالة تحت هذه لعضو، فحوّلها له كما هي.' : 'لم يُنشأ حساب جديد.') +
    (res.had.length ? '\nلهم حسابات من قبل: ' + res.had.map(function (o) { return h_(o.name) + ' (<code>' + h_(o.user) + '</code>)'; }).join('، ') + '.' : '');
  tgSend_(chat, head, '', true);
  res.made.forEach(function (o) {
    tgSend_(chat, 'السلام عليكم أ. ' + h_(o.name) + ' 🌿\n' +
      'هذا حسابك في <b>منصة الأنشطة التربوية</b> لمسار ' + h_(nm) + ':\n\n' +
      'الرابط: ' + SITE_URL + '\n' +
      'اسم المستخدم: <code>' + h_(o.user) + '</code>\n' +
      'كلمة المرور: <code>' + h_(o.pw) + '</code>\n\n' +
      'اضغط على اسم المستخدم أو كلمة المرور لنسخها. وبعد أول دخول غيّر كلمة المرور من «تغيير كلمة المرور» في قائمة حسابك.' +
      (o.atar && o.atar.username ? '\n\nوالحساب نفسه يفتح لك «أثر» لتصميم إعلانات مسارك: ' + ATAR_SITE + (o.atar.username !== o.user ? '\nاسم الدخول في أثر: <code>' + h_(o.atar.username) + '</code>' : '') : ''), '', true);
  });
  return JSON.stringify({ made: res.made.map(function (o) { return { name: o.name, user: o.user }; }), had: res.had });
}
// الإرسال في مجموعات بعينها فقط: يعيد الإرسال العام ويفتح مفتاح هذه المجموعات ويطفئ غيرها (ومنها ما لم يُربط بعد)
function groupsOnly_(ids) {
  var names = withLock_(function () {
    var ts = tracks_(), on = [];
    ts.forEach(function (t) { t.remind = ids.indexOf(t.id) >= 0; if (t.remind) on.push(t.full || t.name); });
    writeJson_('tracks.json', ts);
    var st = readJson_('settings.json', {}); st.groupsPaused = false; writeJson_('settings.json', st);
    props_().setProperty('rev_meta', String(now_()));
    return on;
  });
  JC = {};
  log_(null, '', 'فتح الإرسال في مجموعة', names.join('، '));
  adminTgHtml_('<b>عاد البوت يرسل في مجموعة ' + h_(names.join(' و')) + ' وحدها</b>\nوبقية المجموعات موقوفة. تتحكم في كل مجموعة وما يُرسل فيها من صفحة «بوت التذكيرات»:\n' + SITE_URL + '#bot');
  return JSON.stringify({ on: names });
}
// تُشغَّل من المحرر (اختر الدالة ثم «تشغيل»)، ولا تصل إليها الواجهة لأنها ليست في apiFns_
function makeIthmar2Accounts() { Logger.log(memberAccounts_('ithmar2', { 'صهيب وليد': 'suhaib', 'محمد حسين': 'm.hussein', 'يوسف عبدالبديع': 'yousef', 'محمد عبدالفتاح': 'm.abdelfattah' })); }
function onlyIthmar2Group() { Logger.log(groupsOnly_(['ithmar2'])); }

/* ================= القراءة ================= */
function pubTrack_(t, admin) {
  var o = JSON.parse(JSON.stringify(t));
  o.linked = !!(t.chat && t.chat.id);
  if (!admin) { delete o.chat; delete o.sheet; }
  return o;
}
function boot(token) {
  var a = auth_(token), admin = a.role === 'admin', all = allT_(a), s = cfg_();
  var ts = tracks_().filter(function (t) { return all || t.id === a.track; });
  var plans = {}, revsO = {};
  ts.forEach(function (t) { plans[t.id] = plan_(t.id); revsO[t.id] = plans[t.id].rev; });
  revsO._log = +(props_().getProperty('rev_log') || 0); revsO._meta = +(props_().getProperty('rev_meta') || 0);
  if (admin) revsO._alerts = +(props_().getProperty('rev_alerts') || 0);
  var out = {
    v: VERSION, me: meOf_(a), today: Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd'), tz: tz_(),
    types: TYPES, remindTypes: s.remindTypes, remindHour: s.remindHour,
    tracks: ts.map(function (t) { return pubTrack_(t, admin); }), plans: plans, revs: revsO,
    log: readJson_('log.json', []).filter(function (x) { return all || x.t === a.track; }).slice(0, 60)
  };
  var tg0 = readJson_('tg.json', {});
  if (a.role === 'team' && tg0.bot && tg0.bot.username) {
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
  var a = auth_(token), all = props_().getProperties(), o = {};   // قراءة واحدة لكل الخصائص بدل قراءة لكل مسار
  tracks_().forEach(function (t) { if (allT_(a) || t.id === a.track) o[t.id] = +(all['rev_' + t.id] || 0); });
  o._log = +(all.rev_log || 0);
  o._meta = +(all.rev_meta || 0);
  if (a.role === 'admin') o._alerts = +(all.rev_alerts || 0);
  return JSON.stringify(o);
}
function plan(token, tid) { var a = auth_(token); canView_(a, tid); return JSON.stringify(plan_(tid)); }
function log_list(token) { var a = auth_(token); return JSON.stringify(readJson_('log.json', []).filter(function (x) { return allT_(a) || x.t === a.track; }).slice(0, 200)); }

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
  if ('rp' in o) { var rp = cleanRp_(o.rp); if (rp) x.rp = rp; else delete x.rp; }
  if ('note' in o) x.note = txt_(o.note, 1500);
  if ('link' in o) x.link = txt_(o.link, 500);
  x.upd = now_();
  return x;
}
// إعداد التذكير لكل نشاط: des يحتاج تصميم إعلان (تذكير التصميم قبله بثلاثة أيام، والنشر قبله بيوم)،
// d2 قبله بيومين، d1 قبله بيوم، d0 يوم الموعد (قبله بساعة إن كان له وقت). ما لم يُحدَّد يأخذ الافتراضي.
function cleanRp_(o) {
  if (!o || typeof o !== 'object') return null;
  var r = {}; ['des', 'd2', 'd1', 'd0'].forEach(function (k) { if (k in o && o[k] !== null && o[k] !== undefined) r[k] = !!o[k]; });
  return Object.keys(r).length ? r : null;
}
var DESIGN_TYPES = ['لقاء', 'استضافة', 'مسابقة', 'تحدٍّ'];
function remCfg_(x) {
  var r = x.rp || {};
  return { des: 'des' in r ? r.des : DESIGN_TYPES.indexOf(x.type) >= 0, d2: !!r.d2, d1: 'd1' in r ? r.d1 : true, d0: 'd0' in r ? r.d0 : true };
}
var FOLLOW_FIELDS = ['id', 'done', 'note', 'link'];
// ما يعدّله الفريق في نشاط قائم ولو كان تعديل الخطة مغلقًا (ويصل الإدارةَ تنبيه به)
var ADJUST_FIELDS = ['id', 'title', 'type', 'd', 'time', 'dur', 'who', 'idea', 'rem', 'rp', 'sem', 'done', 'note', 'link'];
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
  var full = allT_(a) || !!t.canEdit;
  var res = withLock_(function () {
    var p = plan_(tid), i = -1;
    if (o.id) p.acts.forEach(function (x, k) { if (x.id === o.id) i = k; });
    if (o.id && i < 0) throw new Error('النشاط غير موجود (ربما حُذف)');
    var old = i >= 0 ? p.acts[i] : null;
    var calOn = o.calOn, scope = o.scope, rpDef = !!o.rpDef; delete o.calOn; delete o.scope; delete o.rpDef;
    if (!full) {
      if (!old) throw new Error('إضافة الأنشطة مغلقة، ويفتحها المدير العام');
      var f = {}; ADJUST_FIELDS.forEach(function (k) { if (k in o) f[k] = o[k]; }); o = f;
    }
    var x = cleanAct_(o, old), calErr = '', notice = '', al = alertOf_(a, tid, old, x);
    // آخر إعداد تذكير اختاره الفريق لهذا النوع يصير الافتراضي لما بعده
    if (!old && !x.rp) { var dr = ((t.defs || {}).rp || {})[x.type]; if (dr) x.rp = cleanRp_(dr); }
    var defUp = rpDef && x.rp ? remCfg_(x) : null;
    if (!old) { x.by = a.name; if (!x.sem) x.sem = String(t.cur || ''); }
    // تقويم جوجل: الاختيار للإدارة، وما أُرسل يبقى محدَّثاً
    if (a.role === 'admin' && calOn === false && x.cal) { try { calRemove_(x); } catch (e) { calErr = e.message; } delete x.cal; }
    else if ((a.role === 'admin' && calOn === true) || (x.cal && x.cal.id && x.cal.sig !== calSig_(t, x))) {
      try { calUpsert_(t, x, s); } catch (e) { calErr = e.message; if (x.cal) x.cal.err = calErr; }
    }
    if (old && remindable_(x, s) && s.notifyChanges && (old.d !== x.d || old.time !== x.time)) {
      var left = dayDiff_(old.d, today_());
      if (left >= 0 && left <= 14) notice = noticeHtml_(x, old, t);
    }
    if (old && x.meet && x.meet.space && (old.who || []).join() !== (x.who || []).join()) meetSync_(t, x, s);
    if (old) p.acts[i] = x; else p.acts.push(x);
    // نشاط متكرر: «هذا وما بعده» ينقل التغيير نفسه إلى المواعيد اللاحقة من السلسلة
    var others = [];
    if (old && old.ser && scope === 'next') others = seriesApply_(p, t, s, old, x);
    savePlan_(tid, p);
    if (defUp) saveDefs_(tid, function (d) { d.rp = d.rp || {}; d.rp[x.type] = defUp; });
    var what = !old ? 'أضاف نشاطاً' : old.d !== x.d || (old.time || '') !== (x.time || '') ? 'غيّر موعد نشاط' : (old.who || []).join() !== (x.who || []).join() ? 'غيّر القائم على نشاط' : old.done !== x.done ? (x.done ? 'أتمّ نشاطاً' : 'أعاد نشاطاً إلى الخطة') : al ? 'عدّل نشاطاً' : 'تابع نشاطاً';
    log_(a, tid, what, x.title + (others.length ? ' (وما بعده: ' + apptText_(others.length) + ')' : ''));
    if (al && others.length) al.title += ' — ومعه ' + apptText_(others.length) + ' بعده من السلسلة';
    if (al) pushAlert_(a, t, al);
    return { act: x, others: others, rev: p.rev, calErr: calErr, notice: notice, alert: al && al.kind !== 'add' ? alertHtml_(al, t, a.name) : '' };
  });
  if (res.notice && gOn_(t, 'al')) { try { tgSend_(t.chat.id, res.notice, tid, true); } catch (e) {} }
  if (res.alert) adminTgHtml_(res.alert);
  delete res.notice; delete res.alert;
  return JSON.stringify(res);
}
// scope = 'next': يحذف هذا الموعد وما بعده من النشاط المتكرر
function act_del(token, tid, id, scope) {
  var a = auth_(token), t = trackOf_(tid), s = cfg_();
  canEdit_(a, tid);
  var res = withLock_(function () {
    var p = plan_(tid), x = p.acts.filter(function (y) { return y.id === id; })[0];
    if (!x) throw new Error('النشاط غير موجود');
    var gone = p.acts.filter(function (y) { return y.id === id || (scope === 'next' && x.ser && y.ser === x.ser && y.d > x.d); });
    p.acts = p.acts.filter(function (y) { return gone.indexOf(y) < 0; });
    gone.forEach(function (y) { if (y.cal && y.cal.id) { try { calRemove_(y); } catch (e) {} } });
    if (x.ser && p.series && p.series[x.ser] && !p.acts.some(function (y) { return y.ser === x.ser; })) delete p.series[x.ser];
    savePlan_(tid, p);
    log_(a, tid, gone.length > 1 ? 'حذف مواعيد من نشاط متكرر' : 'حذف نشاطاً', x.title + (gone.length > 1 ? ' (' + apptText_(gone.length) + ')' : ''));
    var al = alertOf_(a, tid, x, null); if (al && gone.length > 1) al.title += ' — و' + apptText_(gone.length - 1) + ' بعده من السلسلة';
    if (al) pushAlert_(a, t, al);
    var alertTxt = al ? alertHtml_(al, t, a.name) : '';
    var notice = '', left = dayDiff_(x.d, today_());
    if (remindable_(x, s) && s.notifyChanges && left >= 0 && left <= 14 && !x.done) notice = noticeHtml_(x, null, t);
    return { rev: p.rev, act: x, ids: gone.map(function (y) { return y.id; }), notice: notice, alert: alertTxt };
  });
  if (res.notice && gOn_(t, 'al')) { try { tgSend_(t.chat.id, res.notice, tid, true); } catch (e) {} }
  if (res.alert) adminTgHtml_(res.alert);
  delete res.notice; delete res.alert;
  return JSON.stringify(res);
}

/* النشاط المتكرر: مواعيد مستقلة (لكل منها تذكيراته ورابط ميت وحدث تقويم) تجمعها سلسلة واحدة ser.
   json = {base: حقول النشاط, dates: [YYYY-MM-DD...], from: معرّف نشاط قائم يصير أول السلسلة (اختياري),
           rule: {every: 1|2|4, wd: [٠=السبت..], until}, calOn} */
var SERIES_MAX = 60;
function act_series(token, tid, json) {
  var a = auth_(token), o = JSON.parse(json), t = trackOf_(tid), s = cfg_();
  canView_(a, tid);
  if (!allT_(a) && !t.canEdit) throw new Error('إضافة الأنشطة مغلقة، ويفتحها المدير العام');
  var dates = (o.dates || []).filter(isIso_).filter(function (d, i, arr) { return arr.indexOf(d) === i; }).sort();
  if (!dates.length) throw new Error('لا مواعيد للتكرار');
  if (dates.length > SERIES_MAX) throw new Error('أقصى التكرار ' + SERIES_MAX + ' موعدًا');
  var rule = o.rule || {}, every = [1, 2, 4].indexOf(+rule.every) >= 0 ? +rule.every : 1;
  var res = withLock_(function () {
    var p = plan_(tid), sid = 's' + uid_(), base = o.base || {}, made = [], calErr = '', first = null;
    if (o.from) {
      first = p.acts.filter(function (y) { return y.id === o.from; })[0];
      if (!first) throw new Error('النشاط غير موجود (ربما حُذف)');
      if (!first.ser) first.ser = sid;
      dates = dates.filter(function (d) { return d !== first.d; });
      base = { title: first.title, type: first.type, time: first.time || '', dur: first.dur || 0, who: first.who || [], idea: first.idea || '', rem: first.rem, rp: first.rp || null };
    }
    dates.forEach(function (d) {
      var f = {}; ['title', 'type', 'time', 'dur', 'who', 'idea', 'rem', 'rp'].forEach(function (k) { if (k in base) f[k] = base[k]; });
      f.d = d; var x = cleanAct_(f, null);
      x.by = a.name; x.ser = sid; x.sem = semOf_(p, d) || String(t.cur || '');
      if (a.role === 'admin' && (o.calOn === true || (first && first.cal && first.cal.id))) { try { calUpsert_(t, x, s); } catch (e) { calErr = e.message; if (x.cal) x.cal.err = calErr; } }
      p.acts.push(x); made.push(x);
    });
    if (o.rule && rule.every && ((trackOf_(tid).defs || {}).every || 1) !== every) saveDefs_(tid, function (d) { d.every = every; });
    p.series = p.series || {};
    p.series[sid] = { every: every, wd: (rule.wd || []).map(Number).filter(function (n) { return n >= 0 && n < 7; }), until: isIso_(rule.until) ? rule.until : '', at: now_(), by: a.name };
    savePlan_(tid, p);
    var n = made.length + (first ? 1 : 0), title = (first || made[0]).title;
    log_(a, tid, 'أضاف نشاطًا متكررًا', title + ' (' + apptText_(n) + ')');
    var al = a.role === 'admin' ? null : { kind: 'add', aid: (first || made[0]).id, title: title, from: '', to: seriesText_(p.series[sid], n) };
    if (al) pushAlert_(a, t, al);
    return { acts: made, first: first, series: p.series[sid], sid: sid, rev: p.rev, calErr: calErr, alert: al ? alertHtml_(al, t, a.name) : '' };
  });
  if (res.alert) adminTgHtml_(res.alert);
  delete res.alert;
  return JSON.stringify(res);
}
// تفضيلات المسار الافتراضية (آخر ما اختاره الفريق): {rp: {النوع: إعداد التذكير}, every: تكرار}
function saveDefs_(tid, fn) {
  var ts = tracks_(), t = ts.filter(function (y) { return y.id === tid; })[0]; if (!t) return;
  t.defs = t.defs || {}; fn(t.defs);
  writeJson_('tracks.json', ts); props_().setProperty('rev_meta', String(now_()));
}
/* رابط الخطة العام: يُرسل لأي أحد فيرى الخطة فقط (بلا ملاحظات ولا روابط ولا بريد ولا مهام)، ويُوقف متى شاء الفريق أو الإدارة */
function share_set(token, tid, on) {
  var a = auth_(token); canView_(a, tid);
  return JSON.stringify(withLock_(function () {
    var ts = tracks_(), t = ts.filter(function (y) { return y.id === tid; })[0]; if (!t) throw new Error('المسار غير موجود');
    if (on) { if (!t.share) t.share = Utilities.getUuid().replace(/-/g, '').slice(0, 20); } else delete t.share;
    writeJson_('tracks.json', ts); props_().setProperty('rev_meta', String(now_()));
    log_(a, tid, on ? 'أنشأ رابط الخطة العام' : 'أوقف رابط الخطة العام', '');
    return { share: t.share || '' };
  }));
}
var PUB_DAY = ['d', 'h', 'w', 'ax', 'c', 'q', 'ev', 'p'];
function pub_plan(key, sem) {
  key = String(key || ''); if (key.length < 12) throw new Error('الرابط غير صحيح');
  var t = tracks_().filter(function (y) { return y.share === key; })[0];
  if (!t) throw new Error('هذا الرابط لم يعد متاحًا');
  var p = plan_(t.id), ns = Object.keys(p.sems).filter(function (k) { return p.sems[k] && (p.sems[k].days || []).length; }).sort(function (x, y) { return x - y; });
  var n = ns.indexOf(String(sem)) >= 0 ? String(sem) : (ns.indexOf(String(t.cur)) >= 0 ? String(t.cur) : ns[ns.length - 1]), S = n ? p.sems[n] : null;
  return JSON.stringify({
    track: { id: t.id, name: t.name, full: t.full || t.name, cohort: t.cohort || '', age: t.age || '', color: t.color || '' },
    sems: ns, n: n || '', title: S ? (S.title || '') : '',
    days: S ? S.days.map(function (d) { var o = {}; PUB_DAY.forEach(function (k) { if (d[k] !== undefined && d[k] !== '') o[k] = d[k]; }); return o; }) : [],
    acts: p.acts.filter(function (x) { return x.sem === n; }).map(function (x) { return { d: x.d, time: x.time || '', type: x.type, title: x.title, who: x.who || [], done: !!x.done }; }),
    at: now_()
  });
}
function semOf_(p, d) { for (var k in p.sems) { var S = p.sems[k]; if (S && S.start <= d && d <= S.end) return k; } return ''; }
function seriesText_(r, n) {
  var ev = r.every === 2 ? 'كل أسبوعين' : r.every === 4 ? 'كل أربعة أسابيع' : 'كل أسبوع';
  var days = (r.wd || []).map(function (i) { return DAYS[i]; }).join(' و');
  return ev + (days ? ' يوم ' + days : '') + '، ' + apptText_(n) + (r.until ? ' حتى ' + dayText_(r.until) : '');
}
// ينقل تغيير موعد من السلسلة إلى ما بعده: الحقول المتغيّرة تُنسخ، وتغيّر اليوم يُزاح بالفرق نفسه
function seriesApply_(p, t, s, old, x) {
  var f = {}, shift = dayDiff_(x.d, old.d), out = [];
  ['title', 'type', 'time', 'dur', 'idea', 'rem', 'rp'].forEach(function (k) { if (JSON.stringify(old[k]) !== JSON.stringify(x[k])) f[k] = x[k] === undefined ? null : x[k]; });
  if ((old.who || []).join() !== (x.who || []).join()) f.who = x.who;
  if (!Object.keys(f).length && !shift) return out;
  p.acts.forEach(function (y, k) {
    if (y.id === x.id || y.ser !== old.ser || y.d <= old.d) return;
    var g = JSON.parse(JSON.stringify(f)); if (shift) g.d = addDays_(y.d, shift);
    var z = cleanAct_(g, y);
    if (z.cal && z.cal.id && z.cal.sig !== calSig_(t, z)) { try { calUpsert_(t, z, s); } catch (e) { if (z.cal) z.cal.err = e.message; } }
    if (z.meet && z.meet.space && f.who) { try { meetSync_(t, z, s); } catch (e) {} }
    p.acts[k] = z; out.push(z);
  });
  return out;
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
      if ('send' in o && o.send) { var sd = {}; SEND_KINDS.forEach(function (k) { sd[k] = o.send[k] !== false; }); t.send = sd; }
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
    if ('tpl' in o) { s.tpl = s.tpl || {}; ['d3', 'd1'].forEach(function (k) { if (o.tpl[k] != null) s.tpl[k] = txt_(o.tpl[k], 1200); }); }
    if ('adminTasks' in o) s.adminTasks = !!o.adminTasks;
    if ('checkins' in o) s.checkins = !!o.checkins;
    writeJson_('settings.json', s);
    props_().setProperty('rev_meta', String(now_()));
    log_(a, '', 'عدّل الإعدادات', '');
    return { settings: cfg_() };
  });
  if ('meetAdmins' in o) tracks_().forEach(function (t) { try { meetResyncTrack_(t); } catch (e) {} });
  return JSON.stringify(out);
}

function adminTg_(text) { var s = cfg_(); if (s.adminChat && s.adminChat.id && props_().getProperty('TG_TOKEN')) { try { tgSend_(s.adminChat.id, text + '\n' + SITE_URL); } catch (e) {} } }
function adminTgHtml_(html) { var s = cfg_(); if (s.adminChat && s.adminChat.id && props_().getProperty('TG_TOKEN')) { try { tgSend_(s.adminChat.id, html, '', true); } catch (e) {} } }
// طلب الفريق فتح تعديل الخطة: يظهر للإدارة في المنصة، ويصلها في تليجرام إن رُبطت محادثتها
function edit_request(token, note) {
  var a = auth_(token);
  if (a.role !== 'team') throw new Error('هذا للفرق');
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
function timeText_(t) { return t ? String(t).slice(0, 5) : ''; }   // نظام ٢٤ ساعة (21:00)
function whenText_(x) { return dayText_(x.d) + (x.time ? ' الساعة ' + timeText_(x.time) : ''); }
function leftText_(n) { return n === 0 ? 'اليوم' : n === 1 ? 'غدًا' : n === 2 ? 'بعد يومين' : 'بعد ' + n + ' أيام'; }
function apptText_(n) { return n === 1 ? 'موعد واحد' : n === 2 ? 'موعدان' : n <= 10 ? n + ' مواعيد' : n + ' موعدًا'; }
function accText_(n) { return n === 1 ? 'حساب واحد' : n === 2 ? 'حسابان' : n <= 10 ? n + ' حسابات' : n + ' حسابًا'; }
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

function q_(t) { t = String(t || ''); return /[«»]/.test(t) ? t : '«' + t + '»'; }
/* ================= المهام ومهام الأسبوع =================
   p.tasks: [{id, title, d (الموعد), who:[], done, note, by, at, upd}] — مهمة يكتبها الفريق أو الإدارة (ليست من الخطة).
   مهام الأسبوع تُحسب من الخطة (تصميم الإعلان ونشره، المسؤول، اللقاءان، الكاهوت، تعليم المنفّذ، الأسبوع القادم) ومن المهام نفسها. */
function cleanTask_(o, old) {
  var x = old ? JSON.parse(JSON.stringify(old)) : { id: uid_(), at: now_(), done: false };
  if ('title' in o) x.title = txt_(o.title, 160);
  if (!x.title) throw new Error('اكتب المهمة');
  if ('d' in o) { if (o.d && !isIso_(o.d)) throw new Error('تاريخ غير صحيح'); x.d = o.d || ''; }
  if ('who' in o) x.who = (Array.isArray(o.who) ? o.who : []).map(function (w) { return txt_(w, 40); }).filter(String).slice(0, 10);
  if ('done' in o) x.done = !!o.done;
  if ('note' in o) x.note = txt_(o.note, 600);
  x.upd = now_();
  return x;
}
function task_save(token, tid, json) {
  var a = auth_(token), o = JSON.parse(json); canView_(a, tid);   // المهام للفريق دائمًا، ولو أُغلقت إضافة الأنشطة
  return JSON.stringify(withLock_(function () {
    var p = plan_(tid), L = p.tasks = p.tasks || [], i = -1;
    if (o.id) L.forEach(function (y, k) { if (y.id === o.id) i = k; });
    if (o.id && i < 0) throw new Error('المهمة غير موجودة');
    var x = cleanTask_(o, i >= 0 ? L[i] : null);
    if (i < 0) { x.by = a.name; L.push(x); } else L[i] = x;
    savePlan_(tid, p);
    log_(a, tid, i < 0 ? 'أضاف مهمة' : x.done && !(L[i] && L[i].done === false) ? 'حدّث مهمة' : 'حدّث مهمة', x.title);
    return { task: x, rev: p.rev };
  }));
}
function task_del(token, tid, id) {
  var a = auth_(token); canView_(a, tid);
  return JSON.stringify(withLock_(function () {
    var p = plan_(tid), x = null; p.tasks = (p.tasks || []).filter(function (y) { if (y.id === id) { x = y; return false; } return true; });
    if (!x) throw new Error('المهمة غير موجودة');
    savePlan_(tid, p); log_(a, tid, 'حذف مهمة', x.title);
    return { rev: p.rev };
  }));
}
function isLiveDay_(d) { return !!d && /بث/.test((d.r || '') + ' ' + (d.ev || '')); }
// مهام أسبوع المسار ابتداءً من ws (السبت): [{k, text, d, ref}]
function weekTasks_(t, p, ws, s) {
  s = s || cfg_();
  var we = addDays_(ws, 6), today = today_(), out = [], S = p.sems[String(t.cur)] || { days: [] };
  var dayOf = {}; (S.days || []).forEach(function (x) { dayOf[x.d] = x; });
  var acts = p.acts.slice().sort(function (a, b) { return (a.d + (a.time || '')) < (b.d + (b.time || '')) ? -1 : 1; });
  acts.forEach(function (x) {
    if (x.done || !remindable_(x, s)) return;
    var d3 = addDays_(x.d, -3), d1 = addDays_(x.d, -1), sent = x.sent || {};
    if (!remCfg_(x).des) return;
    if (d3 >= ws && d3 <= we && sent.d3 !== x.d) out.push({ k: 'design', d: d3, ref: x.id, text: 'تصميم إعلان ' + q_(x.title) + ' وإعداده' });
    if (d1 >= ws && d1 <= we && sent.d1 !== x.d) out.push({ k: 'publish', d: d1, ref: x.id, text: 'نشر إعلان ' + q_(x.title) + '' });
  });
  acts.forEach(function (x) { if (x.d >= ws && x.d <= we && !x.done && !(x.who && x.who.length)) out.push({ k: 'who', d: x.d, ref: x.id, text: 'تحديد المسؤول عن ' + q_(x.title) + '' }); });
  var seen = {};
  acts.forEach(function (x) {
    if (x.d < ws || x.d > we || seen[x.d] || ['لقاء', 'استضافة'].indexOf(x.type) < 0) return;
    var n = (isLiveDay_(dayOf[x.d]) ? 1 : 0) + acts.filter(function (y) { return y.d === x.d && ['لقاء', 'استضافة'].indexOf(y.type) >= 0; }).length;
    if (n >= 2) { seen[x.d] = 1; out.push({ k: 'clash', d: x.d, ref: x.id, text: 'مراجعة يوم ' + dayText_(x.d) + ': فيه لقاءان' + (isLiveDay_(dayOf[x.d]) ? ' مع البث المباشر' : '') }); }
  });
  (S.days || []).forEach(function (x) {
    if (!x.ev || !/اختبار/.test(x.ev)) return;
    var left = dayDiff_(x.d, ws); if (left < 0 || left > 14) return;
    var has = acts.some(function (y) { return y.type === 'كاهوت' && y.d >= addDays_(x.d, -12) && y.d <= x.d; });
    if (!has) out.push({ k: 'kahoot', d: addDays_(x.d, -7) < ws ? ws : addDays_(x.d, -7), text: 'إضافة كاهوت مراجعة قبل ' + x.ev + ' (' + dayText_(x.d) + ')' });
  });
  var prev = acts.filter(function (x) { return x.d >= addDays_(ws, -7) && x.d < ws && !x.done; });
  if (prev.length) out.push({ k: 'mark', d: ws, text: 'تعليم ما نُفّذ من أنشطة الأسبوع الماضي (' + countText_(prev.length) + ')' });
  var nws = addDays_(ws, 7), nwe = addDays_(ws, 13);
  var study = (S.days || []).some(function (x) { return x.d >= nws && x.d <= nwe && x.c; });
  if (study && !acts.some(function (x) { return x.d >= nws && x.d <= nwe; })) out.push({ k: 'next', d: we, text: 'وضع أنشطة الأسبوع القادم' });
  (p.tasks || []).forEach(function (x) { if (!x.done && (!x.d || x.d <= we)) out.push({ k: 'task', d: x.d || '', ref: x.id, text: x.title + ((x.who && x.who.length) ? ' (' + x.who.join('، ') + ')' : ''), late: x.d && x.d < today }); });
  return out.sort(function (a, b) { return (a.d || '9') < (b.d || '9') ? -1 : (a.d || '9') > (b.d || '9') ? 1 : 0; });
}
function weekTasksText_(L) { return L.map(function (x) { return '• ' + (x.d ? dayText_(x.d) + ': ' : '') + x.text; }).join('\n'); }
/* قائمة أوامر البوت في تليجرام (تظهر عند كتابة / في المجموعة والخاص). ينفّذها كلود في محادثة الربط. */
var BOT_COMMANDS = [
  ['help', 'ما يستطيع البوت فعله'],
  ['week', 'خطة هذا الأسبوع ومهامه'],
  ['add', 'إضافة نشاط إلى الخطة'],
  ['task', 'إضافة مهمة للفريق'],
  ['edit', 'تعديل نشاط: الموعد أو المسؤول أو التفاصيل'],
  ['done', 'تعليم نشاط أو مهمة «تم»'],
  ['meet', 'إنشاء رابط ميت للقاء'],
  ['remove', 'حذف نشاط أو مهمة']
];
function tgMenu_() {
  tgCall_('setMyCommands', { commands: JSON.stringify(BOT_COMMANDS.map(function (c) { return { command: c[0], description: c[1] }; })) });
  return BOT_COMMANDS.length;
}
function tg_menu(token) { var a = auth_(token); needAdmin_(a); var n = tgMenu_(); log_(a, '', 'حدّث قائمة أوامر البوت', n + ' أوامر'); return JSON.stringify({ ok: true, n: n }); }

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

/* ================= رسائل البوت (تليجرام HTML) =================
   رسائل حيّة متنوعة الصياغة، تتكيّف مع الإنجاز والتقصير، وتحمل التفاصيل: الموعد، والمسؤول، ومقرر الطلاب يومها، ورابط اللقاء، والفكرة.
   التنويع ثابت لكل نشاط (يُختار بحسب معرّفه) فلا يتغيّر النص إن أعيد الإرسال. */
function h_(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function nTasks_(n) { return n === 1 ? 'مهمة واحدة' : n === 2 ? 'مهمتان' : n <= 10 ? n + ' مهام' : n + ' مهمة'; }
function nChanges_(n) { return n === 1 ? 'تغيير واحد' : n === 2 ? 'تغييران' : n <= 10 ? n + ' تغييرات' : n + ' تغييرًا'; }
function remainText_(n) { return n === 1 ? 'يوم واحد' : n === 2 ? 'يومان' : n + ' أيام'; }
function pick_(arr, seed) { var n = 7; String(seed || '').split('').forEach(function (c) { n = (n * 31 + c.charCodeAt(0)) % 100003; }); return arr[n % arr.length]; }
var LINE = '┈┈┈┈┈┈┈┈┈┈┈┈';
function weekNo_(t, p, d) { var S = p && p.sems[String(t.cur)]; if (!S) return ''; var x = (S.days || []).filter(function (y) { return y.d === d; })[0]; return x ? x.w : ''; }
function dayOfPlan_(t, p, d) { var S = p && p.sems[String(t.cur)]; if (!S) return null; return (S.days || []).filter(function (y) { return y.d === d; })[0] || null; }
function siteLink_(hash, label) { return '<a href="' + SITE_URL + hash + '">' + h_(label) + '</a>'; }
function whoLine_(x) { return (x.who && x.who.length) ? '• المسؤول: ' + h_(x.who.join('، ')) : '• المسؤول: <b>لم يُحدَّد بعد</b>، فحدّدوه في المنصة اليوم'; }
// تذكيرا اللقاء: d3 تصميم الإعلان وإعداده، d1 نشره
function remindHtml_(kind, x, t, left, p) {
  var T = h_(q_(x.title)), when = h_(whenText_(x)), lt = leftText_(left), day = dayOfPlan_(t, p, x.d), L = [], R = remCfg_(x);
  var isMeet = ['لقاء', 'استضافة'].indexOf(x.type) >= 0, tm = x.time ? h_(timeText_(x.time)) : '';
  if (kind === 'd3') {
    L.push('<b>' + pick_(['حان وقت إعلان ', 'لنبدأ إعلان ', 'إعلان '], x.id) + T + '</b>');
    L.push(pick_([
      T + ' ' + lt + '. الإعلان الذي يصل مبكرًا يجمع الحضور، فلنبدأ تصميمه اليوم.',
      'بقي ' + remainText_(left) + ' على ' + T + '، وهذا أنسب وقت لتصميم إعلانه وكتابة نصّه.',
      'اقترب ' + T + ' (' + lt + '). اجعلوا إعلانه يليق به: صورة واضحة، ونص قصير يشوّق الطلاب.'
    ], x.id + 'o'));
  } else if (kind === 'd2') {
    L.push('<b>' + pick_(['بعد غدٍ موعدنا مع ', 'يومان ويحين ', 'استعدادًا لـ'], x.id) + T + '</b>');
    L.push(R.des ? (x.link ? 'الإعلان جاهز، فراجعوه مرة أخيرة وجهّزوا نصّ نشره.' : 'الإعلان لم يُرفع بعد. هذا وقت إتمامه، حتى يُنشر غدًا في موعده.')
      : pick_(['بقي يومان. راجعوا ما يحتاجه النشاط من مواد وأسئلة، وتأكدوا من المسؤول عنه.', 'خطوة استعداد هادئة الآن تغني عن عجلة يوم الموعد.'], x.id + 'o'));
  } else if (kind === 'd1') {
    L.push('<b>' + pick_(['غدًا ', 'موعدنا غدًا مع '], x.id) + T + '</b>');
    if (left === 0) L.push('النشاط اليوم. ذكّروا الطلاب به الآن، وتأكدوا أن كل شيء جاهز.');
    else if (R.des) L.push(pick_(['اليوم يومُ نشر الإعلان، حتى يصل الطلاب قبل الموعد بيوم كامل.', 'وقت النشر الآن: الإعلان اليوم يعني حضورًا أوسع غدًا.', 'انشروا الإعلان اليوم في القناة ومجموعات الطلاب، فالتذكير قبل يوم يصنع الفرق.'], x.id + 'o'));
    else L.push(pick_(['ذكّروا الطلاب به اليوم، وجهّزوا ما يحتاجه.', 'تذكير اليوم للطلاب يصنع حضور الغد.', 'غدًا الموعد: رسالة قصيرة للطلاب الآن تكفي.'], x.id + 'o'));
  } else {
    L.push('<b>' + (x.time ? pick_(['بعد قليل: ', 'اليوم الساعة ' + tm + ': '], x.id) : 'اليوم: ') + T + '</b>');
    L.push(isMeet ? pick_(['تأكدوا أن الرابط يعمل وأن المسؤول جاهز، وذكّروا الطلاب برسالة أخيرة.', 'دقائق ونبدأ. رسالة أخيرة للطلاب، وادخلوا قبل الموعد بقليل.', 'وفقكم الله في لقاء اليوم. ذكّروا الطلاب الآن، وابدؤوا في الوقت.'], x.id + 'o')
      : pick_(['موعده اليوم. ذكّروا الطلاب، وتابعوا مشاركتهم.', 'اليوم يومه، فلتكن البداية في وقتها.'], x.id + 'o'));
  }
  L.push('');
  L.push('• الموعد: ' + when + ' (' + lt + ')');
  L.push(whoLine_(x));
  if (day && day.c && kind !== 'd0') L.push('• مقرر الطلاب يومها: ' + h_(day.c) + (day.q ? ' — ' + h_(day.q) : ''));
  if (day && isLiveDay_(day)) L.push('• <b>تنبيه:</b> في هذا اليوم بث مباشر للبرنامج، فانتبهوا لتوقيت النشاط');
  if (x.meet && x.meet.uri) L.push('• رابط اللقاء: ' + h_(x.meet.uri));
  if (R.des && kind !== 'd3') L.push(x.link ? '• التصميم: مرفوع في المنصة ✓ أحسنتم' : '• التصميم: لم يُرفع رابطه في النشاط بعد');
  if (x.idea && kind !== 'd0') L.push('<blockquote expandable><b>الفكرة:</b> ' + h_(x.idea) + '</blockquote>');
  L.push('');
  L.push(kind === 'd3' ? 'المطلوب اليوم: تصميم الإعلان وكتابة نصّه، ثم وضع رابطه في النشاط.'
    : kind === 'd2' ? (R.des && !x.link ? 'المطلوب اليوم: إتمام التصميم ورفع رابطه.' : 'المطلوب اليوم: الاستعداد وتأكيد المسؤول.')
    : kind === 'd1' ? (left === 0 ? 'المطلوب الآن: تذكير الطلاب.' : R.des ? 'المطلوب اليوم: نشر الإعلان، وتذكير المسؤول بالموعد.' : 'المطلوب اليوم: تذكير الطلاب والمسؤول.')
    : 'وبعد النشاط علّموه «تم» في المنصة، واكتبوا ملاحظة قصيرة عن الحضور.');
  L.push(siteLink_('#t/' + t.id, 'افتح خطة ' + t.name));
  return L.join('\n');
}
function noticeHtml_(x, old, t) {
  if (!old) return '<b>أُلغي ' + h_(q_(x.title)) + '</b>\nكان موعده ' + h_(whenText_(x)) + '. نعتذر للطلاب إن كان قد أُعلن، وسنخبركم بالبديل.';
  return '<b>تعديل في الخطة</b>\n' + h_(q_(x.title)) + ' صار ' + h_(whenText_(x)) + '\nبدل ' + h_(whenText_(old)) + '\n\n' + whoLine_(x) + (x.meet && x.meet.uri ? '\n• رابط اللقاء: ' + h_(x.meet.uri) : '') + '\nإن كان الإعلان قد نُشر فحدّثوه بالموعد الجديد.';
}
// ملخص الأسبوع ومهامه لمجموعة الفريق
function digestHtml_(t, p, wk, s) {
  var end = addDays_(wk, 6), acts = p.acts.filter(function (x) { return x.d >= wk && x.d <= end; }).sort(function (a, b) { return (a.d + (a.time || '99')) < (b.d + (b.time || '99')) ? -1 : 1; });
  var prev = p.acts.filter(function (x) { return x.d >= addDays_(wk, -7) && x.d < wk; }), pd = prev.filter(function (x) { return x.done; });
  var wt = weekTasks_(t, p, wk, s).filter(function (x) { return x.k !== 'mark'; }), wn = weekNo_(t, p, wk) || weekNo_(t, p, addDays_(wk, 1)), L = [];
  L.push('<b>خطة الأسبوع' + (wn ? ' ' + wn : '') + ' · ' + h_(t.full || t.name) + '</b>');
  L.push('<i>' + h_(dayText_(wk)) + ' – ' + h_(dayText_(end)) + '</i>');
  L.push(LINE);
  if (prev.length) {
    if (pd.length === prev.length) L.push(pick_(['أتممتم كل ما خططتم له الأسبوع الماضي (' + pd.length + ' من ' + prev.length + '). بارك الله في جهدكم.', 'الأسبوع الماضي كان كاملًا: ' + pd.length + ' من ' + prev.length + ' نُفّذت. هكذا تكون البداية.'], wk + t.id));
    else if (pd.length) L.push('الأسبوع الماضي: نُفّذ ' + pd.length + ' من ' + prev.length + '. وبقي بلا تعليم: ' + prev.filter(function (x) { return !x.done; }).map(function (x) { return h_(q_(x.title)); }).join('، ') + '. إن أُقيمت فعلّموها «تم».');
    else L.push('الأسبوع الماضي: لم يُعلَّم شيء «تم» من ' + countText_(prev.length) + '. علّموا ما أُقيم ليظهر جهدكم في التقرير.');
    L.push('');
  }
  if (acts.length) {
    L.push('<b>الأنشطة</b>');
    acts.forEach(function (x) { L.push('• <b>' + h_(dayText_(x.d)) + '</b>' + (x.time ? ' ' + h_(timeText_(x.time)) : '') + ' — ' + h_(x.type) + ': ' + h_(x.title) + ((x.who && x.who.length) ? ' (' + h_(x.who.join('، ')) + ')' : '')); });
  } else L.push(pick_(['لا أنشطة في خطة هذا الأسبوع بعد. لقاء واحد أو تحدٍّ صغير يكفي ليبقى الطلاب قريبين.', 'خطة هذا الأسبوع فارغة إلى الآن. ضعوا فيها نشاطًا ولو صغيرًا.'], wk + t.id));
  if (wt.length) { L.push(''); L.push('<b>المهام</b>'); wt.forEach(function (x) { L.push('○ ' + (x.d ? h_(dayText_(x.d)) + ': ' : '') + h_(x.text)); }); }
  L.push('');
  L.push(pick_(['أسبوعًا مباركًا، ووفقكم الله.', 'نسأل الله أن يبارك في الأسبوع وفي الجهد.', 'بالتوفيق في أسبوعكم.'], wk + t.id + 'c'));
  L.push(siteLink_('#t/' + t.id, 'الخطة كاملة'));
  return L.join('\n');
}
// مهام الأسبوع للإدارة على الخاص
function adminTasksHtml_(wk, s) {
  var end = addDays_(wk, 6), L = [], total = 0, rows = [];
  tracks_().forEach(function (t) {
    var p = plan_(t.id), acts = p.acts.filter(function (x) { return x.d >= wk && x.d <= end; }), wt = weekTasks_(t, p, wk, s);
    total += wt.length;
    rows.push('<b>' + h_(t.full || t.name) + '</b> · ' + (acts.length ? countText_(acts.length) : 'لا أنشطة') + ' · ' + (wt.length ? nTasks_(wt.length) : 'لا مهام') +
      (wt.length ? '\n<blockquote expandable>' + wt.map(function (x) { return '○ ' + (x.d ? h_(dayText_(x.d)) + ': ' : '') + h_(x.text); }).join('\n') + '</blockquote>' : ''));
  });
  L.push('<b>مهام الأسبوع للمسارات</b>');
  L.push('<i>' + h_(dayText_(wk)) + ' – ' + h_(dayText_(end)) + '</i>');
  L.push(LINE);
  L.push(total ? 'على الفرق هذا الأسبوع ' + nTasks_(total) + '. اضغط على مهام أي مسار لتنفتح.' : 'لا مهام على الفرق هذا الأسبوع.');
  L.push('');
  L.push(rows.join('\n\n'));
  var AL = readJson_('alerts.json', []).filter(function (x) { return !x.seen; }).length, req = tracks_().filter(function (t) { return t.editReq; });
  if (AL || req.length || s.groupsPaused) {
    L.push(''); L.push('<b>يحتاج قرارك</b>');
    if (AL) L.push('• ' + nChanges_(AL) + ' من الفرق لم تراجعها بعد');
    req.forEach(function (t) { L.push('• ' + h_(t.name) + ' طلب فتح إضافة الأنشطة'); });
    if (s.groupsPaused) L.push('• إرسال البوت في المجموعات موقوف. أعده حين تستقر المنصة');
  }
  L.push(''); L.push(siteLink_('#home', 'افتح المنصة'));
  return L.join('\n');
}
function alertHtml_(al, t, by) {
  var head = '<b>' + (al.kind === 'del' ? 'حذف' : al.kind === 'add' ? 'إضافة' : al.kind === 'move' ? 'تغيير موعد' : al.kind === 'who' ? 'تغيير المسؤول' : 'تعديل') + ' · ' + h_(t.full || t.name) + '</b>';
  var L = [head, h_(by) + (al.kind === 'del' ? ' حذف ' : al.kind === 'add' ? ' أضاف ' : ' عدّل ') + h_(q_(al.title))];
  if (al.kind === 'del' && al.from) L.push('• كان موعده: ' + h_(al.from));
  if (al.kind === 'add' && al.to) L.push('• موعده: ' + h_(al.to));
  (al.changes || []).forEach(function (c) { if (c[1] || c[2]) L.push('• ' + h_(c[0]) + ': <s>' + h_(c[1] || '—') + '</s> ← <b>' + h_(c[2] || '—') + '</b>'); else L.push('• ' + h_(c[0])); });
  L.push(siteLink_('#alerts', 'تغييرات الفرق'));
  return L.join('\n');
}
function kahootHtml_(t, x, left, d) {
  return '<b>اقتراح قبل ' + h_(x.ev) + '</b>\nبعد ' + countDays_(left) + ' ' + h_(x.ev) + ' (' + h_(dayText_(x.d)) + ').\n' +
    pick_(['كاهوت مراجعة قبله يثبّت ما درسه الطلاب، ويحوّل رهبة الاختبار إلى منافسة ممتعة.', 'ما رأيكم بكاهوت مراجعة؟ أسئلة سريعة على ما مضى، تجمع الطلاب وتطمئنهم قبل الاختبار.'], t.id + x.d) +
    (d ? '\n• أنسب يوم: ' + h_(dayText_(d)) : '') + '\n' + siteLink_('#t/' + t.id, 'أضيفوه في الخطة');
}
// التقرير الأسبوعي (ماركداون) ← رسائل تليجرام مميزة: رأس، وخط، وأقسام، والمسارات في اقتباسات تنطوي
function mdToTgParts_(title, md) {
  var secs = [], cur = null;
  String(md || '').split('\n').forEach(function (line) {
    var m = /^#{1,3}\s+(.*)$/.exec(line);
    if (m) { cur = { h: m[1].trim(), lines: [] }; secs.push(cur); return; }
    if (!cur) { cur = { h: '', lines: [] }; secs.push(cur); }
    cur.lines.push(line);
  });
  var inl = function (s) { return h_(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/^\s*[-*]\s+/, '• '); };
  var parts = ['<b>' + h_(title) + '</b>\n<i>منصة الأنشطة التربوية</i>\n' + LINE];
  secs.forEach(function (sc, i) {
    var body = sc.lines.map(inl).join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (!sc.h && !body) return;
    var fold = sc.h && body.length > 500 && i > 0;
    var block = (sc.h ? '<b>◆ ' + h_(sc.h) + '</b>\n' : '') + (fold ? '<blockquote expandable>' + body + '</blockquote>' : body);
    parts.push(block);
  });
  parts.push(siteLink_('#reports', 'التقرير كاملًا في المنصة'));
  // تجميع الأقسام في رسائل لا تتجاوز ٣٨٠٠ حرف دون قطع وسم
  var out = [], buf = '';
  parts.forEach(function (b) {
    if (b.length > 3800) { chunks_((buf ? buf + '\n\n' : '') + b.replace(/<\/?blockquote[^>]*>/g, ''), 3800).forEach(function (c) { out.push(c); }); buf = ''; return; }
    if ((buf + '\n\n' + b).length > 3800) { out.push(buf); buf = b; } else buf = buf ? buf + '\n\n' + b : b;
  });
  if (buf) out.push(buf);
  return out;
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
function groupMuted_(chatId) {   // الإيقاف العام، أو مفتاح مجموعة المسار مطفأ (محادثة الإدارة لا تُوقف)
  var s0 = cfg_();
  if (s0.adminChat && String(s0.adminChat.id) === String(chatId)) return false;
  if (s0.groupsPaused) return true;
  return tracks_().some(function (t) { return t.chat && String(t.chat.id) === String(chatId) && t.remind === false; });
}
function tgSend_(chatId, text, tid, html) {
  if (groupMuted_(chatId)) return { skipped: true };
  var pay = function (id) { var o = { chat_id: String(id), text: text, disable_web_page_preview: 'true' }; if (html) o.parse_mode = 'HTML'; return o; };
  try { return tgCall_('sendMessage', pay(chatId)); }
  catch (e) {
    var mig = e.tg && e.tg.parameters && e.tg.parameters.migrate_to_chat_id;
    if (mig) { migrateChat_(chatId, mig); return tgCall_('sendMessage', pay(mig)); }
    if (html && /parse entities/i.test(e.message)) return tgCall_('sendMessage', { chat_id: String(chatId), text: String(text).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'), disable_web_page_preview: 'true' });
    throw e;
  }
}
// صورة التصميم المرفوع في النشاط: رابط صورة مباشر، أو ملف درايف يصل إليه حساب الأنشطة
function photoOf_(x) {
  var L = String(x.link || '').trim(); if (!/^https?:\/\//i.test(L)) return null;
  if (/\.(png|jpe?g|webp)(\?.*)?$/i.test(L)) return { url: L };
  var m = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:.*&)?id=)([\w-]{20,})/.exec(L) || /docs\.google\.com\/uc\?(?:.*&)?id=([\w-]{20,})/.exec(L);
  if (m) { try { var b = DriveApp.getFileById(m[1]).getBlob(); if (/^image\//.test(b.getContentType())) return { blob: b }; } catch (e) {} }
  return null;
}
// يرسل صورة مع نص التذكير: النص تعليقًا إن قصر (حدّ تليجرام ١٠٢٤ حرفًا)، وإلا فالصورة ثم النص
function tgPhoto_(chatId, ph, html, tid) {
  if (groupMuted_(chatId)) return { skipped: true };
  var plain = String(html).replace(/<[^>]+>/g, ''), fits = plain.length <= 1000;
  var cap = fits ? html : String(html).split('\n')[0];
  var o = { chat_id: String(chatId), caption: cap, parse_mode: 'HTML' }; o.photo = ph.blob || ph.url;
  try { tgCall_('sendPhoto', o); } catch (e) { return tgSend_(chatId, html, tid, true); }
  if (!fits) return tgSend_(chatId, html, tid, true);
  return { ok: true };
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
  try { tgMenu_(); } catch (e) {}
  return tg_status(token);
}
function tgPoll_() {
  if (!props_().getProperty('TG_TOKEN')) return { n: 0 };
  // نقرأ بلا offset فلا تُحذف التحديثات من طابور تليجرام (تبقى 24 ساعة) ويراها كل من يقرأ البوت نفسه (أثر، والربط الشخصي)،
  // ونتجاوز ما عالجناه برقمه
  var g0 = readJson_('tg.json', {}), last0 = g0.last != null ? g0.last : (g0.offset || 1) - 1;
  var ups = tgCall_('getUpdates', { timeout: '0', limit: '100', allowed_updates: JSON.stringify(['message', 'my_chat_member', 'callback_query']) })
    .filter(function (u) { return u.update_id > last0; });
  if (!ups.length) return { n: 0 };
  var migs = [], linked = [], cbs = [];
  withLock_(function () {
    var g = readJson_('tg.json', {}); g.known = g.known || {};
    var assigned = {}; tracks_().forEach(function (t) { if (t.chat && t.chat.id) assigned[String(t.chat.id)] = t.name; });
    var s = readJson_('settings.json', {}); if (s.adminChat && s.adminChat.id) assigned[String(s.adminChat.id)] = 'الإدارة';
    ups.forEach(function (u) {
      if (u.update_id <= (g.last != null ? g.last : (g.offset || 1) - 1)) return;
      g.last = u.update_id; delete g.offset;
      if (u.callback_query) { cbs.push(u.callback_query); return; }
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
        // دخول البوت أي مجموعة أو قناة بصمت تام (طلب أمين، ٣١ أكتوبر): لا ترحيب
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
  // ربط المجموعة بصمت كذلك (قرار أمين): يظهر في صفحة البوت بالمنصة، ويُؤكَّد ربط محادثة الإدارة الخاصة وحده
  linked.forEach(function (w) { if (w[2] === 'admin') { try { tgSend_(w[0], w[1]); } catch (e) {} } });
  cbs.forEach(function (cq) { try { tgCallback_(cq); } catch (e) {} });
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
  if (a.role !== 'team') return JSON.stringify({ linked: false, title: '' });
  var t = trackOf_(a.track);
  return JSON.stringify({ linked: !!(t.chat && t.chat.id), title: t.chat ? t.chat.title : '' });
}
function tg_status(token) {
  var a = auth_(token); needAdmin_(a);
  var g = readJson_('tg.json', {}), s = cfg_(), known = g.known || {};
  var ts = tracks_().map(function (t) { return { id: t.id, name: t.name, chat: t.chat || null, remind: t.remind !== false, send: sendOf_(t) }; });
  var map = {}; ts.forEach(function (t) { if (t.chat && t.chat.id) map[String(t.chat.id)] = t.id; });
  if (s.adminChat && s.adminChat.id) map[String(s.adminChat.id)] = 'admin';
  var chats = Object.keys(known).map(function (k) { var c = known[k]; return { id: c.id, title: c.title, type: c.type, at: c.at, left: !!c.left, to: map[String(c.id)] || '' }; })
    .sort(function (x, y) { return (y.at || 0) - (x.at || 0); });
  if (g.bot && g.bot.username) { ts.forEach(function (t) { t.link = tgLink_(g.bot.username, t.id); }); }
  return JSON.stringify({ bot: g.bot || null, hasToken: !!props_().getProperty('TG_TOKEN'), chats: chats, tracks: ts, adminChat: s.adminChat || null, adminLink: g.bot && g.bot.username ? tgLink_(g.bot.username, 'admin') : '', lastTick: g.lastTick || null, upcoming: upcoming_(s), settings: { remindHour: s.remindHour, remindTypes: s.remindTypes, digest: s.digest, adminDigest: s.adminDigest, notifyChanges: s.notifyChanges, tpl: s.tpl, groupsPaused: !!s.groupsPaused, adminTasks: s.adminTasks !== false, checkins: s.checkins !== false } });
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
  if (label === 'الإدارة') { try { tgSend_(chatId, linkedMsg_(label)); } catch (e) {} }   // المجموعات تُربط بصمت
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
// التذكير المستحق الآن لنشاط (واحد في اليوم على الأكثر):
// d3 التصميم قبله بثلاثة أيام (أو بيومين إن أُضيف متأخرًا)، d2 قبله بيومين، d1 قبله بيوم،
// d0 يوم الموعد: قبله بساعة إن كان له وقت، وإلا في ساعة التذكيرات. nowMin دقائق اليوم الآن.
function dueOf_(x, today, nowMin, s) {
  var left = dayDiff_(x.d, today), sent = x.sent || {}, R = remCfg_(x), hourOk = nowMin >= s.remindHour * 60;
  if (x.done || left < 0 || left > 3 || sent.last === today) return [];
  if (left === 0) {
    if (R.d0 && sent.d0 !== x.d) {
      var tm = x.time ? (+x.time.slice(0, 2)) * 60 + (+x.time.slice(3, 5)) : -1;
      if (tm >= 0 ? (nowMin >= tm - 75 && nowMin < tm + 15) : hourOk) return [['d0', 0]];
      return [];
    }
    if (!R.d0 && R.d1 && sent.d1 !== x.d && hourOk) return [['d1', 0]];
    return [];
  }
  if (!hourOk) return [];
  if (left === 1) return R.d1 && sent.d1 !== x.d ? [['d1', 1]] : [];
  if (R.des && sent.d3 !== x.d) return [['d3', left]];
  if (left === 2 && R.d2 && sent.d2 !== x.d) return [['d2', 2]];
  return [];
}
function runReminders_(force) {
  var s = cfg_(), tz = tz_(), now = new Date(), today = Utilities.formatDate(now, tz, 'yyyy-MM-dd'), hour = +Utilities.formatDate(now, tz, 'H');
  var sent = 0, errs = [];
  if (!props_().getProperty('TG_TOKEN')) return { sent: 0, errs: ['لا بوت'] };
  var hm = Utilities.formatDate(now, tz, 'HH:mm'), nowMin = force ? 24 * 60 : (+hm.slice(0, 2)) * 60 + (+hm.slice(3, 5));
  if (s.groupsPaused) return { sent: 0, errs: [], paused: true };   // لا تُعلَّم التذكيرات مُرسلة، فتصل بعد إعادة الإرسال
  tracks_().forEach(function (t) {
    if (!gOn_(t, 'rem')) return;
    var p = plan_(t.id), queue = [];
    p.acts.forEach(function (x) { if (remindable_(x, s)) dueOf_(x, today, nowMin, s).forEach(function (k) { queue.push([x.id, k[0], k[1]]); }); });
    if (!queue.length) return;
    var done = [];
    queue.forEach(function (q) {
      var x = p.acts.filter(function (y) { return y.id === q[0]; })[0];
      var ct = q[1] === 'd3' || (q[1] === 'd1' && remCfg_(x).des) ? customTpl_(s, q[1]) : '';
      var ph = q[1] !== 'd3' ? photoOf_(x) : null;
      if (!ph && (q[1] === 'd0' || (q[1] === 'd1' && remCfg_(x).des))) { var cb = cardBlob_('r:' + x.id + ':' + q[1], cardSig_(remCardData_(t, x, q[1]))); if (cb) ph = { blob: cb }; }
      try { if (ct) tgSend_(t.chat.id, remindText_(ct, x, t, q[2]), t.id); else if (ph) tgPhoto_(t.chat.id, ph, remindHtml_(q[1], x, t, q[2], p), t.id); else tgSend_(t.chat.id, remindHtml_(q[1], x, t, q[2], p), t.id, true); done.push(q); sent++; }
      catch (e) { errs.push(t.name + ': ' + e.message); }
    });
    if (done.length) withLock_(function () {
      var p2 = plan_(t.id);
      done.forEach(function (q) { p2.acts.forEach(function (y) { if (y.id === q[0]) { y.sent = y.sent || {}; y.sent[q[1]] = y.d; y.sent.last = today; } }); });
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
      var R = remCfg_(x), ks = [];
      if (R.des) ks.push(['d3', 3]); if (R.d2 && !(R.des && left === 2)) ks.push(['d2', 2]); if (R.d1) ks.push(['d1', 1]); if (R.d0) ks.push(['d0', 0]);
      ks.forEach(function (k) {
        var on = addDays_(x.d, -k[1]); if (k[0] === 'd3' && left < 2) return; if (k[0] === 'd2' && left < 2) return;
        if (dayDiff_(on, today) < 0) { if (k[0] === 'd1' && R.d0) return; on = today; }
        out.push({ t: t.id, id: x.id, title: x.title, d: x.d, kind: k[0], on: on, sent: sent[k[0]] === x.d, linked: !!(t.chat && t.chat.id), off: !!s.groupsPaused || !gOn_(t, 'rem') });
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
    var wt = weekTasks_(t, p, wk, s);
    if (!gOn_(t, 'wk') || (!acts.length && !wt.length)) return;
    try { var wc = cardBlob_('w:' + t.id, cardSig_(weekCardData_(t, p, wk, s))); if (wc) tgPhoto_(t.chat.id, { blob: wc }, digestHtml_(t, p, wk, s), t.id); else tgSend_(t.chat.id, digestHtml_(t, p, wk, s), t.id, true); n++; } catch (e) {}
  });
  if (s.adminTasks !== false && s.adminChat && s.adminChat.id && g.adminTasksWeek !== wk) {
    try { tgSend_(s.adminChat.id, adminTasksHtml_(wk, s), '', true); n++; } catch (e) {}
    withLock_(function () { var g2 = readJson_('tg.json', {}); g2.adminTasksWeek = wk; writeJson_('tg.json', g2); });
  }
  if (s.adminDigest && s.adminChat && s.adminChat.id) {
    try { tgSend_(s.adminChat.id, 'ملخص الأسبوع (' + dayText_(wk) + ' – ' + dayText_(end) + '):\n' + lines.join('\n') + '\n\n' + SITE_URL); n++; } catch (e) {}
  }
  withLock_(function () { var g2 = readJson_('tg.json', {}); g2.digestWeek = wk; writeJson_('tg.json', g2); });
  return n;
}
/* ================= البطاقات المصوّرة =================
   تُرسم في المتصفح (خط ثمانية وهوية المسار) ثم تُرفع هنا وتُرسل صورًا: بطاقة «خطة الأسبوع» مع رسالة الأسبوع،
   وبطاقة النشاط مع تذكير النشر وتذكير يوم الموعد إن لم يُرفع للنشاط تصميم. يرسمها أي متصفح مفتوح على المنصة،
   وصفحة الرسم (‎#render/<مفتاح التقرير>‎) التي تفتحها مهمة التقرير الأسبوعي صباح السبت قبل رسالة الأسبوع. */
function cardSig_(o) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, JSON.stringify(o), Utilities.Charset.UTF_8)).slice(0, 16); }
function trackCard_(t) { return { id: t.id, name: t.name, full: t.full || t.name, color: t.color || '' }; }
function weekCardData_(t, p, wk, s) {
  var end = addDays_(wk, 6), acts = p.acts.filter(function (x) { return x.d >= wk && x.d <= end; }).sort(function (a, b) { return (a.d + (a.time || '99')) < (b.d + (b.time || '99')) ? -1 : 1; });
  var wt = weekTasks_(t, p, wk, s).filter(function (x) { return x.k !== 'mark'; });
  return { kind: 'week', track: trackCard_(t), wk: wk, wn: weekNo_(t, p, wk) || weekNo_(t, p, addDays_(wk, 1)) || '', acts: acts.map(function (x) { return { d: x.d, time: x.time || '', type: x.type, title: x.title, who: x.who || [] }; }), tasks: wt.map(function (x) { return { d: x.d || '', text: x.text }; }) };
}
function remCardData_(t, x, kind) { return { kind: kind, track: trackCard_(t), act: { d: x.d, time: x.time || '', type: x.type, title: x.title, who: x.who || [] } }; }
function cardAuth_(auth) {
  if (auth && String(auth) === reportKey_() && reportKey_()) return { all: true };
  var a = auth_(auth); return allT_(a) ? { all: true } : { track: a.track };
}
// ما يحتاج رسمًا الآن (ناقص أو تغيّر نشاطه منذ رُسم)
function cards_todo(auth) {
  var A = cardAuth_(auth), s = cfg_(), today = today_(), idx = readJson_('cards.json', {}), out = [];
  // أسبوع رسالة «خطة الأسبوع» القادمة: هذا الأسبوع إن لم يأتِ يومها وساعتها بعد، وإلا الأسبوع التالي
  var h = +Utilities.formatDate(new Date(), tz_(), 'HH'), dw = wd_(today), dd = s.digest.dow || 0;
  var wk = (dw < dd || (dw === dd && h < s.digest.hour)) ? weekOf_(today) : addDays_(weekOf_(today), 7);
  tracks_().forEach(function (t) {
    if (!A.all && t.id !== A.track) return;
    if (!gOn_(t)) return;
    var p = plan_(t.id), w = weekCardData_(t, p, wk, s), ws = cardSig_(w);
    if (s.digest.on && gOn_(t, 'wk') && (w.acts.length || w.tasks.length) && (!idx['w:' + t.id] || idx['w:' + t.id].sig !== ws)) out.push({ id: 'w:' + t.id, sig: ws, data: w });
    p.acts.forEach(function (x) {
      var left = dayDiff_(x.d, today); if (!gOn_(t, 'rem') || left < 0 || left > 8 || x.done || !remindable_(x, s) || x.link) return;
      var R = remCfg_(x);
      [['d1', R.d1 && R.des], ['d0', R.d0]].forEach(function (k) {
        if (!k[1]) return; var id = 'r:' + x.id + ':' + k[0], d = remCardData_(t, x, k[0]), sg = cardSig_(d);
        if (!idx[id] || idx[id].sig !== sg) out.push({ id: id, sig: sg, data: d });
      });
    });
  });
  return JSON.stringify({ items: out.slice(0, 40), total: out.length });
}
function cardsDir_() {
  var id = props_().getProperty('CARDS_DIR'), f = null;
  if (id) { try { f = DriveApp.getFolderById(id); } catch (e) { f = null; } }
  if (!f) { f = dataFolder_().createFolder('cards'); props_().setProperty('CARDS_DIR', f.getId()); }
  return f;
}
function card_put(auth, id, sig, b64) {
  var A = cardAuth_(auth);
  id = String(id || ''); var m = /^(w|r):([\w-]+)(?::(d0|d1))?$/.exec(id); if (!m) throw new Error('بطاقة غير معروفة');
  if (!A.all) { var tid = m[1] === 'w' ? m[2] : ''; if (m[1] === 'w' && tid !== A.track) throw new Error('ليست من صلاحيتك'); if (m[1] === 'r' && !plan_(A.track).acts.some(function (x) { return x.id === m[2]; })) throw new Error('ليست من صلاحيتك'); }
  b64 = String(b64 || '').replace(/^data:image\/png;base64,/, ''); if (b64.length < 1000 || b64.length > 4000000) throw new Error('صورة غير صالحة');
  return JSON.stringify(withLock_(function () {
    var idx = readJson_('cards.json', {}), e = idx[id], f = null;
    if (e && e.f) { try { f = DriveApp.getFileById(e.f); f.setContent(b64); } catch (x) { f = null; } }
    if (!f) f = cardsDir_().createFile(id.replace(/:/g, '_') + '.b64', b64, 'text/plain');
    idx[id] = { sig: String(sig || ''), f: f.getId(), at: now_() };
    // تنظيف: بطاقات أنشطة مضت تُنقل إلى سلة درايف (تُفرغ تلقائيًا بعد ٣٠ يومًا)
    var keep = {}; tracks_().forEach(function (t) { plan_(t.id).acts.forEach(function (x) { if (dayDiff_(x.d, today_()) >= -2) keep[x.id] = 1; }); });
    Object.keys(idx).forEach(function (k) { var mm = /^r:([\w-]+):/.exec(k); if (mm && !keep[mm[1]]) { try { DriveApp.getFileById(idx[k].f).setTrashed(true); } catch (x) {} delete idx[k]; } });
    writeJson_('cards.json', idx);
    return { ok: true };
  }));
}
function cardBlob_(id, sig) {
  var e = readJson_('cards.json', {})[id]; if (!e || !e.f || (sig && e.sig !== sig)) return null;
  try { return Utilities.newBlob(Utilities.base64Decode(DriveApp.getFileById(e.f).getBlob().getDataAsString()), 'image/png', id.replace(/:/g, '_') + '.png'); } catch (x) { return null; }
}

/* ================= سؤال المتابعة بعد النشاط =================
   بعد النشاط بساعتين (وما لا وقت له: الساعة التاسعة مساءً) يسأل البوت مجموعة الفريق: هل أُقيم؟ بأزرار.
   «تم» يعلّم النشاط في المنصة ويذكّر بالخطوة التالية؛ «لم يُقم» يرشد إلى نقله أو كتابة السبب. */
function ckDue_(x, today, nowMin) {
  if (x.done || (x.sent || {}).ck === x.d) return false;
  var left = dayDiff_(x.d, today);
  if (left === -1) return true;   // فات أمس (لم يصادف المؤقّت أو كان الإرسال موقوفًا): يُسأل اليوم
  if (left !== 0) return false;
  var st = x.time ? (+x.time.slice(0, 2)) * 60 + (+x.time.slice(3, 5)) : 19 * 60, dur = +x.dur || 60;
  return nowMin >= st + Math.max(120, dur + 60);
}
function ckHtml_(x, t) {
  return '<b>' + pick_(['كيف كان ', 'نسأل عن ', 'أخبرونا عن '], x.id + 'ck') + h_(q_(x.title)) + '؟</b>\n' +
    'كان موعده ' + h_(whenText_(x)) + ((x.who && x.who.length) ? '، بإشراف ' + h_(x.who.join('، ')) : '') + '.\n\n' +
    'هل أُقيم؟ اختاروا من الأزرار، فيُسجَّل في المنصة مباشرة.\nوإن أحببتم فاكتبوا عدد الحضور أو ملاحظة قصيرة ردًّا على هذه الرسالة.';
}
function ckKb_(t, x) {
  var cb = function (v) { return 'an:ck:' + t.id + ':' + x.id + ':' + v; };
  return JSON.stringify({ inline_keyboard: [[{ text: 'تم ✅', callback_data: cb('done') }, { text: 'لم يُقم', callback_data: cb('no') }]] });
}
function runCheckins_() {
  var s = cfg_(), tz = tz_(), now = new Date(), today = Utilities.formatDate(now, tz, 'yyyy-MM-dd'), hm = Utilities.formatDate(now, tz, 'HH:mm');
  var nowMin = (+hm.slice(0, 2)) * 60 + (+hm.slice(3, 5)), n = 0;
  if (!props_().getProperty('TG_TOKEN') || s.groupsPaused || s.checkins === false) return 0;
  tracks_().forEach(function (t) {
    if (!gOn_(t, 'ck')) return;
    var p = plan_(t.id), due = p.acts.filter(function (x) { return remindable_(x, s) && ckDue_(x, today, nowMin); });
    if (!due.length) return;
    var done = [];
    due.forEach(function (x) { try { tgCall_('sendMessage', { chat_id: String(t.chat.id), text: ckHtml_(x, t), parse_mode: 'HTML', reply_markup: ckKb_(t, x), disable_web_page_preview: 'true' }); done.push(x.id); n++; } catch (e) {} });
    if (done.length) withLock_(function () { var p2 = plan_(t.id); p2.acts.forEach(function (y) { if (done.indexOf(y.id) >= 0) { y.sent = y.sent || {}; y.sent.ck = y.d; } }); writeJson_('plan_' + t.id + '.json', p2); });
  });
  return n;
}
// الخطوة التالية للفريق بعد نشاط
function nextStep_(t, p, x) {
  var today = today_(), up = p.acts.filter(function (y) { return y.id !== x.id && !y.done && y.d >= today; }).sort(function (a, b) { return (a.d + (a.time || '')) < (b.d + (b.time || '')) ? -1 : 1; })[0];
  var L = [];
  if (!x.note) L.push('• سجّلوا عدد الحضور أو ملاحظة قصيرة في النشاط، فالتقرير يُبنى عليها.');
  if (up) {
    var R = remCfg_(up), d3 = addDays_(up.d, -3), steps = [];
    if (!(up.who && up.who.length)) steps.push('تحديد المسؤول عنه');
    if (R.des && !up.link) steps.push(d3 <= today ? 'تصميم إعلانه الآن' : 'تصميم إعلانه ' + dayText_(d3));
    if (['لقاء', 'استضافة'].indexOf(up.type) >= 0 && !(up.meet && up.meet.uri)) steps.push('إنشاء رابط ميت له');
    L.push('• التالي: ' + h_(q_(up.title)) + ' ' + h_(whenText_(up)) + (steps.length ? '، والمطلوب: ' + h_(steps.join('، ')) : '') + '.');
  } else L.push('• لا نشاط بعده في الخطة بعد، فأضيفوا نشاط الأسبوع القادم.');
  return L.join('\n');
}
// يعالج ضغطة زر من أزرار البوت (من القراءة الدورية أو مما ينقله الربط)
function tgCallback_(cq) {
  var m = /^an:ck:([\w-]+):([\w-]+):(done|no)$/.exec(String(cq && cq.data || '')); if (!m) return false;
  var g = readJson_('tg.json', {}), seen = g.cbDone || [];
  if (seen.indexOf(cq.id) >= 0) return true;
  var ans = function (txt) { try { tgCall_('answerCallbackQuery', { callback_query_id: cq.id, text: txt || '' }); } catch (e) {} };
  var t = null; try { t = trackOf_(m[1]); } catch (e) {}
  var msg = cq.message || {}, chat = msg.chat ? String(msg.chat.id) : '';
  if (!t || !t.chat || String(t.chat.id) !== chat) { ans('هذه الرسالة ليست لهذه المجموعة'); return false; }
  var who = [cq.from && cq.from.first_name, cq.from && cq.from.last_name].filter(function (x) { return x; }).join(' ') || 'عضو من الفريق';
  var res = withLock_(function () {
    var g2 = readJson_('tg.json', {}); g2.cbDone = (g2.cbDone || []).concat(cq.id).slice(-300); writeJson_('tg.json', g2);
    var p = plan_(t.id), x = p.acts.filter(function (y) { return y.id === m[2]; })[0];
    if (!x) return { gone: true };
    if (m[3] === 'done') {
      var was = x.done; x.done = true; x.upd = now_(); x.doneBy = who; savePlan_(t.id, p);
      if (!was) log_({ name: who + ' (من تليجرام)', role: 'team' }, t.id, 'أتمّ نشاطاً', x.title);
      return { x: x, p: p, was: was };
    }
    log_({ name: who + ' (من تليجرام)', role: 'team' }, t.id, 'أفاد أن النشاط لم يُقم', x.title);
    return { x: x, p: p, no: true };
  });
  var txt;
  if (res.gone) { ans('النشاط لم يعد في الخطة'); txt = '<b>' + h_(q_('النشاط')) + '</b> لم يعد في الخطة.'; }
  else if (res.no) { ans('سُجّل، شكرًا'); txt = '<b>لم يُقم ' + h_(q_(res.x.title)) + '</b> (أفاد ' + h_(who) + ')\nإن تأجّل فانقلوه إلى موعده الجديد في المنصة، وإن أُلغي فاكتبوا السبب في ملاحظته.\n' + siteLink_('#t/' + t.id, 'افتح خطة ' + t.name); }
  else { ans(res.was ? 'معلَّم من قبل' : 'تم، بارك الله فيكم'); txt = '<b>تم ✅ ' + h_(q_(res.x.title)) + '</b>\nعلّمه ' + h_(who) + ' في المنصة. ' + pick_(['بارك الله في جهدكم.', 'جزاكم الله خيرًا.', 'أحسنتم، وتقبّل الله منكم.'], res.x.id + 'dn') + '\n\n' + nextStep_(t, res.p, res.x) + '\n' + siteLink_('#t/' + t.id, 'افتح خطة ' + t.name); }
  try { tgCall_('editMessageText', { chat_id: chat, message_id: String(msg.message_id), text: txt, parse_mode: 'HTML', disable_web_page_preview: 'true' }); }
  catch (e) { try { tgSend_(chat, txt, t.id, true); } catch (e2) {} }
  return true;
}
// ينقل إلينا ضغطات الأزرار من يقرأ البوت غيرنا (محادثة الربط)، والتحقق برمز البوت نفسه
function tg_relay(botToken, json) {
  var tok = props_().getProperty('TG_TOKEN');
  if (!tok || String(botToken || '') !== tok) throw err_('غير مصرّح', 'auth');
  var u = typeof json === 'string' ? JSON.parse(json) : json, cq = u && (u.callback_query || (u.data && u.id ? u : null));
  if (!cq) return JSON.stringify({ ok: false, why: 'ليس ضغطة زر' });
  return JSON.stringify({ ok: !!tgCallback_(cq) });
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
      bot: { linked: !!(t.chat && t.chat.id), group: t.chat ? t.chat.title : '', remind: t.remind !== false, send: sendOf_(t) }, editReq: t.editReq || null,
      sem: S ? { title: S.title, start: S.start, end: S.end, days: S.days } : null,
      acts: p.acts.map(function (x) { return { title: x.title, type: x.type, d: x.d, time: x.time || '', who: x.who || [], idea: x.idea || '', done: !!x.done, note: x.note || '', link: x.link || '', meet: (x.meet && x.meet.uri) || '', ser: x.ser || '', sem: x.sem, by: x.by || '', calendar: !!(x.cal && x.cal.id), calErr: x.cal && x.cal.err || '', reminders: remindable_(x, s) ? remCfg_(x) : false, sent: x.sent || {} }; }),
      tasks: (p.tasks || []).map(function (x) { return { title: x.title, d: x.d || '', who: x.who || [], done: !!x.done, by: x.by || '' }; }),
      weekTasks: weekTasks_(t, p, weekOf_(today), s)
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
    try {
      if (!tg) mdToTgParts_(title, text).forEach(function (c) { tgSend_(s.adminChat.id, c, '', true); sent++; });
      else chunks_(title + '\n\n' + String(tg) + '\n\nالتقرير كاملًا في المنصة: ' + SITE_URL + '#reports', 3800).forEach(function (c) { tgSend_(s.adminChat.id, c); sent++; });
    } catch (e) { err = e.message; }
  } else err = 'لم تُربط محادثة الإدارة بالبوت بعد';
  return JSON.stringify({ id: rep.id, saved: true, sent: sent, err: err });
}
// يرسل ملفًا إلى محادثة الإدارة وحدها (مثل الملف التعريفي للمنصة). b64: محتوى الملف
function report_file(key, name, caption, b64) {
  needKey_(key);
  var s = cfg_();
  if (!s.adminChat || !s.adminChat.id || !props_().getProperty('TG_TOKEN')) throw new Error('لم تُربط محادثة الإدارة بالبوت بعد');
  name = txt_(name, 120).replace(/[\\/:*?"<>|\n]/g, '') || 'ملف';
  var bytes = Utilities.base64Decode(String(b64 || ''));
  if (!bytes.length) throw new Error('الملف فارغ');
  if (bytes.length > 45e6) throw new Error('الملف أكبر من حد تليجرام');
  var mime = /\.pdf$/i.test(name) ? 'application/pdf' : /\.png$/i.test(name) ? 'image/png' : /\.jpe?g$/i.test(name) ? 'image/jpeg' : 'application/octet-stream';
  var r = tgDoc_(s.adminChat.id, bytes, mime, name, caption ? txt_(caption, 1000) : '');
  log_(null, '', 'أرسل ملفًا للإدارة', name);
  return JSON.stringify({ sent: 1, id: r && r.message_id, name: (r && r.document && r.document.file_name) || name, size: bytes.length });
}
// يبني طلب multipart بنفسه ليبقى اسم الملف العربي سليمًا (UrlFetchApp يفسد الأسماء غير اللاتينية في الملفات)
function tgDoc_(chatId, bytes, mime, name, caption) {
  var bd = 'anshita' + uid_() + uid_(), CR = '\r\n';
  var field = function (k, v) { return '--' + bd + CR + 'Content-Disposition: form-data; name="' + k + '"' + CR + CR + v + CR; };
  var head = field('chat_id', String(chatId)) + (caption ? field('caption', caption) + field('parse_mode', 'HTML') : '') +
    '--' + bd + CR + 'Content-Disposition: form-data; name="document"; filename="' + String(name).replace(/["\r\n]/g, '') + '"' + CR + 'Content-Type: ' + mime + CR + CR;
  var body = Utilities.newBlob(head).getBytes().concat(bytes, Utilities.newBlob(CR + '--' + bd + '--' + CR).getBytes());
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + tgToken_() + '/sendDocument', { method: 'post', contentType: 'multipart/form-data; boundary=' + bd, payload: body, muteHttpExceptions: true });
  var j; try { j = JSON.parse(res.getContentText()); } catch (e) { j = { ok: false, description: 'رد غير مفهوم (' + res.getResponseCode() + ')' }; }
  if (!j.ok) throw new Error('تليجرام: ' + (j.description || res.getResponseCode()));
  return j.result;
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
    if (!gOn_(t, 'al')) return;
    var p = plan_(t.id), S = p.sems[String(t.cur)]; if (!S) return;
    (S.days || []).forEach(function (x) {
      if (!x.ev || !/اختبار/.test(x.ev)) return;
      var left = dayDiff_(x.d, today), key = t.id + '|' + x.d;
      if (left < 4 || left > 8 || done[key]) return;
      var has = p.acts.some(function (y) { return y.type === 'كاهوت' && y.d >= addDays_(x.d, -12) && y.d <= x.d; });
      if (has) { sentKeys.push(key); return; }
      try { tgSend_(t.chat.id, kahootHtml_(t, x, left, ''), t.id, true); n++; sentKeys.push(key); } catch (e) {}
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
  try { r.sent += runCheckins_(); } catch (e) { r.msg += ' سؤال المتابعة: ' + e.message; }
  try { ensureQuick_(); } catch (e) {}
  try { r.sent += runDigests_(); } catch (e) { r.ok = false; r.msg += ' ملخص: ' + e.message; }
  try { r.sent += runSuggest_(); } catch (e) { r.msg += ' اقتراح: ' + e.message; }
  try { withLock_(function () { var g = readJson_('tg.json', {}); g.lastTick = r; writeJson_('tg.json', g); }); } catch (e) {}
  return r;
}
// مؤقّت سريع (كل ٥ دقائق) يقرأ أزرار البوت فقط، حتى يصل جواب «تم» سريعًا
function quick() { try { tgPoll_(); } catch (e) {} }
function ensureQuick_() {
  if (ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'quick'; })) return;
  ScriptApp.newTrigger('quick').timeBased().everyMinutes(5).create();
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
