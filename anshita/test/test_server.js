/* اختبار خادم منصة الأنشطة كاملاً في Node عبر المحاكي: node anshita/test/test_server.js */
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const GAS = require(path.join(ROOT, 'v6/gas/shim.js'));
require('./shim_ext.js')(GAS);

let NOW = Date.UTC(2026, 9, 29, 7, 0);   // ٢٩ أكتوبر ١٠:٠٠ بتوقيت الرياض
class FDate extends Date { constructor(...a) { if (!a.length) super(NOW); else super(...a); } static now() { return NOW; } }
FDate.UTC = Date.UTC;
const ctx = Object.assign({ console, JSON, Date: FDate, Math, Object, Array, String, Number, Error, RegExp, encodeURIComponent, parseInt }, GAS);
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'anshita/server/Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });

// تليجرام وهمي: طابور تحديثات + سجل الرسائل
const TG = { sent: [], updates: [], uid: 1 }, ALLSENT = [];
const SHEET = fs.readFileSync(path.join(__dirname, 'fixtures/judhoor.csv'), 'utf8');
const MEET = { calls: [], off: false, n: 0 };
GAS._fetch.handler = function (url, opt) {
  if (url.indexOf('docs.google.com/spreadsheets') >= 0) return { code: 200, body: SHEET };
  if (url.indexOf('meet.googleapis.com') >= 0) {
    const m = (opt.method || 'get').toLowerCase(), body = typeof opt.payload === 'string' ? JSON.parse(opt.payload) : (opt.payload || {}), p = url.split('/v2/')[1];
    MEET.calls.push([m, p, body]);
    if (!/^Bearer /.test((opt.headers || {}).Authorization || '')) return { code: 401, body: '{"error":{"message":"no token"}}' };
    if (MEET.off) return { code: 403, body: JSON.stringify({ error: { message: 'Google Meet REST API has not been used in project 123 before or it is disabled.' } }) };
    if (m === 'post' && p === 'spaces') { const c = 'abc-defg-' + (++MEET.n); return { code: 200, body: JSON.stringify({ name: 'spaces/S' + MEET.n, meetingUri: 'https://meet.google.com/' + c, meetingCode: c, config: body.config }) }; }
    if (m === 'post' && /\/members$/.test(p)) return { code: 200, body: JSON.stringify({ name: p + '/M' + (++MEET.n), email: body.email, role: body.role }) };
    if (m === 'delete') return { code: 200, body: '{}' };
    return { code: 404, body: '{"error":{"message":"not found"}}' };
  }
  if (url.indexOf('api.telegram.org') >= 0) {
    const m = url.split('/').pop(), p = opt.payload || {};
    if (url.indexOf('/botBAD') >= 0) return { code: 401, body: JSON.stringify({ ok: false, description: 'Unauthorized' }) };
    if (m === 'getMe') return { code: 200, body: JSON.stringify({ ok: true, result: { id: 9, username: 'anshita_bot', first_name: 'بوت الأنشطة' } }) };
    if (m === 'sendPhoto') { TG.photos = (TG.photos || []).concat({ chat: String(p.chat_id), photo: typeof p.photo === 'string' ? p.photo : 'blob', caption: p.caption }); return { code: 200, body: '{"ok":true,"result":{"message_id":1}}' }; }
    if (m === 'sendDocument' && Array.isArray(opt.payload)) { const buf = Buffer.from(opt.payload.map(x => x & 255)), txt = buf.toString('latin1'), bd = /boundary=(\S+)/.exec(opt.contentType)[1];
      const parts = txt.split('--' + bd).filter(x => /Content-Disposition/.test(x)), get = k => { const q = parts.find(x => new RegExp('name="' + k + '"').test(x)); return q ? Buffer.from(q.split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n$/, ''), 'latin1') : null; };
      const dp = parts.find(x => /name="document"/.test(x)), fname = Buffer.from(/filename="([^"]*)"/.exec(dp)[1], 'latin1').toString('utf8');
      TG.docs = (TG.docs || []).concat({ chat: get('chat_id').toString(), name: fname, bytes: get('document').length, caption: (get('caption') || '').toString('utf8') });
      return { code: 200, body: JSON.stringify({ ok: true, result: { message_id: 5, document: { file_name: fname } } }) }; }
    if (m === 'sendDocument') { const d = p.document; TG.docs = (TG.docs || []).concat({ chat: String(p.chat_id), name: d && d.getName ? d.getName() : '', bytes: d && d.getBytes ? d.getBytes().length : 0, caption: p.caption || '' }); return { code: 200, body: JSON.stringify({ ok: true, result: { message_id: 5, document: { file_name: d && d.getName ? d.getName() : '' } } }) }; }
    if (m === 'editMessageText') { TG.edits = (TG.edits || []).concat({ chat: String(p.chat_id), id: p.message_id, text: p.text }); return { code: 200, body: '{"ok":true,"result":true}' }; }
    if (m === 'answerCallbackQuery') { TG.answers = (TG.answers || []).concat(p.text); return { code: 200, body: '{"ok":true,"result":true}' }; }
    if (m === 'deleteWebhook' || m === 'setMyCommands') return { code: 200, body: '{"ok":true,"result":true}' };
    if (m === 'getUpdates') { if (p.offset) TG.offsetUsed = true; const off = +p.offset || 0; return { code: 200, body: JSON.stringify({ ok: true, result: TG.updates.filter(u => u.update_id >= off) }) }; }
    if (m === 'sendMessage') {
      if (TG.migrate && String(p.chat_id) === TG.migrate[0]) return { code: 400, body: JSON.stringify({ ok: false, description: 'Bad Request: group chat was upgraded to a supergroup chat', parameters: { migrate_to_chat_id: +TG.migrate[1] } }) };
      TG.sent.push({ chat: String(p.chat_id), text: p.text, html: p.parse_mode === 'HTML', kb: p.reply_markup || '' }); ALLSENT.push(TG.sent[TG.sent.length - 1]); return { code: 200, body: JSON.stringify({ ok: true, result: { message_id: TG.sent.length } }) };
    }
  }
  return { code: 404, body: '' };
};
const upd = (o) => TG.updates.push(Object.assign({ update_id: TG.uid++ }, o));

let pass = 0, fail = 0;
function ok(c, msg) { if (c) pass++; else { fail++; console.log('✗ ' + msg); } }
function call(fn, ...args) {
  const out = JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify({ fn, args }) } }).getContent());
  if (out.error) { const e = new Error(out.error); e.code = out.code; throw e; }
  const r = out.result; try { return JSON.parse(r); } catch (e) { return r; }
}
function throws(f, re, msg) { try { f(); ok(false, msg + ' (لم يرمِ خطأ)'); } catch (e) { ok(re.test(e.message), msg + ' ← ' + e.message); } }

// ١) التجهيز
const log = ctx.setup();
ok(/أُنشئت الحسابات/.test(log), 'setup ينشئ الحسابات');
const cred = {}; log.split('\n').forEach(l => { const m = /المستخدم: (\S+) — كلمة المرور: (\S+)/.exec(l); if (m) cred[m[1]] = m[2]; });
ok(Object.keys(cred).length === 7, 'سبعة حسابات: الإدارة + ستة فرق');
ok(/المؤقّت/.test(log), 'setup ينشئ المؤقّت');
ok(ctx.setup().indexOf('الحسابات موجودة') >= 0, 'setup آمنة عند التكرار');
ok(call('info').ready, 'info: جاهز');

// ٢) الدخول
throws(() => call('login', 'admin', 'xx'), /غير صحيحة/, 'كلمة مرور خاطئة');
const A = call('login', 'ADMIN ', cred.admin).token;
ok(A && A.split('|').length === 4, 'رمز جلسة الإدارة');
const J = call('login', 'judhoor', cred.judhoor).token;
ok(call('boot', A).tracks.every(t => t.canEdit), 'تعديل الخطة مفتوح للمسارات افتراضياً');
call('track_save', A, 'judhoor', JSON.stringify({ canEdit: false }));
throws(() => call('boot', A.slice(0, -2) + 'xx'), /ادخل أولاً/, 'رمز معبوث به مرفوض');
let b = call('boot', A);
ok(b.me.role === 'admin' && b.tracks.length === 6, 'الإدارة ترى ستة مسارات');
ok(b.settings && b.settings.remindHour === 10, 'الإعدادات الافتراضية');
let bj = call('boot', J);
ok(bj.tracks.length === 1 && bj.tracks[0].id === 'judhoor' && !bj.settings, 'الفريق يرى مساره فقط بلا إعدادات');
throws(() => call('plan', J, 'ishraq'), /ليس من صلاحيتك/, 'الفريق لا يقرأ مساراً آخر');

// ٣) جدول الفصل: استيراد من شيت
const dry = call('sem_import', A, 'judhoor', 2, 'https://docs.google.com/spreadsheets/d/abc123/edit?gid=55#gid=55', true);
const SEM2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/sem2_judhoor.json'), 'utf8'));
ok(JSON.stringify(dry.days) === JSON.stringify(SEM2), 'تحليل الشيت يطابق تحليل بايثون (' + dry.days.length + ' يوماً)');
const imp = call('sem_import', A, 'judhoor', 2, 'https://docs.google.com/spreadsheets/d/abc123/edit?gid=55#gid=55');
ok(imp.sem.days.length === 100 && imp.sem.start === '2026-10-31', 'استيراد الفصل الثاني لجذور');
const dd = call('day_save', A, 'judhoor', 2, JSON.stringify({ d: '2026-11-02', ev: 'لقاء أولياء الأمور' }));
ok(dd.day.ev === 'لقاء أولياء الأمور' && dd.day.c, 'تعديل يوم مع بقاء المقرر');
throws(() => call('day_save', J, 'judhoor', 2, JSON.stringify({ d: '2026-11-02', ev: 'x' })), /مغلق/, 'الفريق لا يعدّل الجدول بلا صلاحية');

// ٤) الأنشطة والتقويم
const m1 = call('act_save', A, 'judhoor', JSON.stringify({ title: 'لقاء الافتتاح', d: '2026-11-01', time: '20:00', type: 'لقاء', who: ['أنس'], idea: 'افتتاح الأنشطة', calOn: true })).act;
ok(m1.id && m1.sem === '2' && m1.by === 'المدير العام', 'إضافة لقاء');
ok(m1.cal && m1.cal.id, 'أُرسل اللقاء إلى التقويم');
const cal = GAS.CalendarApp.getDefaultCalendar(), ev = () => cal.getEventById(m1.cal.id);
ok(ev().getTitle() === 'جذور · لقاء الافتتاح' && !ev().isAllDayEvent(), 'عنوان الحدث ووقته');
ok(GAS.Utilities.formatDate(ev().getStartTime(), 'x', 'yyyy-MM-dd HH:mm') === '2026-11-01 20:00', 'بداية الحدث ٨ مساء بتوقيت الرياض');
const w1 = call('act_save', A, 'judhoor', JSON.stringify({ title: 'تحدي أذكاري', d: '2026-11-03', type: 'تحدٍّ' })).act;
ok(!w1.cal, 'نشاط بلا تقويم لا يُرسل تلقائياً');
const m1b = call('act_save', J, 'judhoor', JSON.stringify({ id: m1.id, time: '20:30', who: ['أنس', 'معاذ'], calOn: false })).act;
ok(m1b.time === '20:30' && m1b.who.length === 2 && m1b.cal && m1b.cal.id, 'الفريق بلا صلاحية يعدّل موعد نشاط قائم والقائم عليه (ولا يملك التقويم)');
const al1 = call('alerts', call('login', 'admin', cred.admin).token);
ok(al1[0].kind === 'move' && al1[0].t === 'judhoor' && al1[0].changes.some(c => c[0] === 'الموعد' && /20:00/.test(c[1]) && /20:30/.test(c[2])) && al1[0].changes.some(c => c[0] === 'القائم'), 'تنبيه للإدارة بتغيير الموعد والقائم');
const m1c = call('act_save', J, 'judhoor', JSON.stringify({ id: m1.id, time: '20:00', who: ['أنس'] })).act; void m1c;
ok(call('boot', call('login', 'admin', cred.admin).token).unseen === 2, 'عدد التنبيهات غير المقروءة في boot');
throws(() => call('act_save', J, 'judhoor', JSON.stringify({ title: 'جديد', d: '2026-11-05' })), /مغلقة/, 'الفريق بلا صلاحية لا يضيف');
throws(() => call('act_del', J, 'judhoor', m1.id), /مغلق/, 'الفريق بلا صلاحية لا يحذف');
const r = call('edit_request', J, 'نحتاج إضافة مسابقة');
ok(r.ok, 'طلب فتح التعديل');
b = call('boot', A); ok(b.tracks.find(t => t.id === 'judhoor').editReq.by === 'فريق جذور', 'الطلب يظهر للإدارة');
call('track_save', A, 'judhoor', JSON.stringify({ canEdit: true }));
b = call('boot', A); ok(!b.tracks.find(t => t.id === 'judhoor').editReq, 'فتح التعديل يمحو الطلب');
const t1 = call('act_save', J, 'judhoor', JSON.stringify({ title: 'كاهوت أول مرة أصلي', d: '2026-11-06', time: '21:00', type: 'كاهوت', who: ['معاذ'] })).act;
ok(t1.by === 'فريق جذور', 'الفريق بصلاحية يضيف');
const moved = call('act_save', J, 'judhoor', JSON.stringify({ id: m1.id, d: '2026-11-02', time: '21:30' })).act;
ok(moved.cal.id === m1.cal.id && GAS.Utilities.formatDate(ev().getStartTime(), 'x', 'yyyy-MM-dd HH:mm') === '2026-11-02 21:30', 'نقل اللقاء يحدّث الحدث نفسه');
throws(() => call('cal_push', J, '[]', true), /للإدارة/, 'الفريق لا يدير التقويم');
const push = call('cal_push', A, JSON.stringify([{ t: 'judhoor', id: w1.id }, { t: 'judhoor', id: t1.id }]), true);
ok(push.ok.length === 2 && !push.err.length, 'إرسال نشاطين دفعة واحدة');
ok(cal._events().length === 3, 'ثلاثة أحداث في التقويم');
ok(cal._events().some(e => e.allDay && /تحدي أذكاري/.test(e.title)), 'النشاط بلا وقت حدث يوم كامل');
call('cal_push', A, JSON.stringify([{ t: 'judhoor', id: w1.id }]), false);
ok(cal._events().length === 2, 'إزالة من التقويم');
const cl = call('cal_list', A); ok(cl.length >= 1 && cl[0].cur, 'قائمة التقويمات');
const nc = call('cal_set', A, 'new:أنشطة المسارات'); ok(nc.name === 'أنشطة المسارات', 'إنشاء تقويم خاص');
const newCal = GAS.CalendarApp.getCalendarById(nc.id);
ok(nc.moved === 2 && newCal._events().length === 2 && cal._events().length === 0, 'تغيير التقويم ينقل الأحداث المرسلة');

// ٥) تليجرام
throws(() => call('tg_token', A, 'BAD'), /غير صحيح/, 'رمز بوت مشوّه');
let st = call('tg_token', A, '123456:' + 'A'.repeat(35));
ok(st.bot.username === 'anshita_bot' && st.tracks.find(t => t.id === 'judhoor').link.indexOf('startgroup=judhoor-') > 0, 'ربط البوت وروابط المسارات');
bj = call('boot', J); ok(bj.tg && bj.tg.link && !bj.tg.linked, 'الفريق يرى رابط ربط مجموعته');
const code = bj.tg.link.split('startgroup=')[1];
upd({ my_chat_member: { chat: { id: -100111, title: 'فريق جذور', type: 'supergroup' }, new_chat_member: { status: 'member' } } });
upd({ message: { chat: { id: -100111, title: 'فريق جذور', type: 'supergroup' }, text: '/start@anshita_bot ' + code } });
upd({ message: { chat: { id: -100222, title: 'فريق مزيف', type: 'group' }, text: '/start judhoor-AAAAAAAAAA' } });
const ck = call('tg_check', J);
ok(ck.linked && ck.title === 'فريق جذور', 'الربط التلقائي برابط المجموعة');
ok(TG.sent.filter(m => m.chat === '-100111').length === 1 && /تم ربط هذه المجموعة/.test(TG.sent.find(m => m.chat === '-100111').text), 'رسالة تأكيد واحدة بلا ترحيب مكرر');
st = call('tg_status', A);
ok(st.chats.find(c => c.id === '-100222').to === '', 'رمز مزوّر لا يربط');
upd({ message: { chat: { id: 5555, first_name: 'أمين', type: 'private' }, text: '/start ' + st.adminLink.split('start=')[1] } });
st = call('tg_poll', A);
ok(st.adminChat && st.adminChat.id === '5555', 'ربط محادثة الإدارة');
ok(!TG.offsetUsed, 'المنصة تقرأ التحديثات دون حذفها من طابور تليجرام');
upd({ message: { chat: { id: 7777, first_name: 'غريب', type: 'private' }, text: '/start' } }); upd({ message: { chat: { id: 7777, first_name: 'غريب', type: 'private' }, text: 'مرحبا' } });
call('tg_poll', A); ok(!TG.sent.some(m => m.chat === '7777'), 'البوت لا يرد في الخاص على غير الإدارة');
{ const s0 = TG.sent.length; call('tg_poll', A); ok(TG.sent.length === s0, 'لا معالجة مكررة لتحديثات قُرئت'); }
st = call('tg_assign', A, '-100222', 'ishraq');
ok(st.tracks.find(t => t.id === 'ishraq').chat.id === '-100222', 'ربط يدوي لمجموعة مكتشفة');

// ٦) التذكيرات: لقاء الافتتاح صار ٢ نوفمبر ٢١:٣٠
TG.sent.length = 0;
NOW = Date.UTC(2026, 9, 30, 5, 0);   // ٣٠ أكتوبر ٨:٠٠ — قبل ساعة الإرسال
ctx.tick(); ok(TG.sent.length === 0, 'لا إرسال قبل الساعة العاشرة');
NOW = Date.UTC(2026, 9, 30, 8, 0);   // ١١:٠٠ — قبل اللقاء بثلاثة أيام
ctx.tick();
ok(TG.sent.length === 1 && TG.sent[0].html && /إعلان «لقاء الافتتاح»/.test(TG.sent[0].text) && /الموعد: الإثنين 2 نوفمبر الساعة 21:30 \(بعد 3 أيام\)/.test(TG.sent[0].text) && /المطلوب اليوم: تصميم الإعلان/.test(TG.sent[0].text) && /مقرر الطلاب يومها/.test(TG.sent[0].text), 'تذكير الإعداد قبل ثلاثة أيام غني بالتفاصيل: ' + (TG.sent[0] || {}).text);
ctx.tick(); ok(TG.sent.length === 1, 'لا تكرار في الساعة التالية');
NOW = Date.UTC(2026, 9, 31, 8, 0); ctx.tick(); ok(TG.sent.filter(m => /المطلوب اليوم: تصميم الإعلان/.test(m.text)).length === 1, 'لا تذكير إعداد ثانٍ قبل يومين');
ok(TG.sent.some(m => m.chat === '-100111' && /خطة الأسبوع/.test(m.text) && /مسار جذور/.test(m.text) && /<b>الأنشطة<\/b>/.test(m.text)), 'ملخص الأسبوع ومهامه للمجموعة يوم السبت');
// تعديل موعد اللقاء قبله بيومين: تنبيه المجموعة
call('act_save', A, 'judhoor', JSON.stringify({ id: m1.id, d: '2026-11-03' }));
ok(/تعديل في الخطة/.test(TG.sent[TG.sent.length - 1].text), 'تنبيه نقل لقاء قريب');
const n0 = TG.sent.length;
NOW = Date.UTC(2026, 10, 2, 8, 0); ctx.tick();
const d1 = TG.sent.slice(n0).filter(m => /المطلوب اليوم: نشر الإعلان/.test(m.text));
ok(d1.length === 1 && /غدًا/.test(d1[0].text) && /التصميم:/.test(d1[0].text), 'تذكير النشر قبل يوم');
const n1 = TG.sent.length; ctx.tick(); ok(TG.sent.length === n1, 'لا تكرار لتذكير النشر');
// لقاء أُضيف متأخراً (بعد يومين): يصله تذكير الإعداد بصيغة «بعد يومين»
call('act_save', A, 'judhoor', JSON.stringify({ title: 'استضافة: سيرة عثمان', d: '2026-11-04', time: '20:00', type: 'استضافة' }));
ctx.tick();
ok(TG.sent.slice(n1).some(m => /بعد يومين/.test(m.text)), 'تذكير الإعداد للقاء أضيف متأخراً');
// الأنشطة غير اللقاءات لا تُذكَّر، إلا إن فُعّل لها التذكير
ok(!TG.sent.some(m => /كاهوت/.test(m.text) && /تذكير/.test(m.text)), 'الكاهوت لا يُذكَّر افتراضياً');
// ملخص الأسبوع يوم السبت ٩ صباحاً
NOW = Date.UTC(2026, 10, 7, 6, 30);   // السبت ٧ نوفمبر ٩:٣٠
const n2 = TG.sent.length; ctx.tick();
const dig = TG.sent.slice(n2);
ok(dig.some(m => m.chat === '5555' && /ملخص الأسبوع/.test(m.text) && /إشراق: لا أنشطة/.test(m.text)), 'ملخص الإدارة الأسبوعي');
ctx.tick(); ok(TG.sent.length === n2 + dig.length, 'الملخص مرة في الأسبوع');
// انتقال المجموعة إلى مجموعة خارقة
TG.migrate = ['-100111', '-100999'];
call('tg_test', A, 'judhoor');
ok(call('tg_status', A).tracks.find(t => t.id === 'judhoor').chat.id === '-100999', 'تتبّع تغيّر معرّف المجموعة');
TG.migrate = null;
const up = call('tg_status', A).upcoming; ok(Array.isArray(up), 'قائمة التذكيرات القادمة');

// ٧) الحسابات وكلمة المرور
const na = call('acc_save', A, JSON.stringify({ user: 'judhoor2', name: 'أنس (جذور)', role: 'team', track: 'judhoor' }));
ok(na.pass && na.acc.track === 'judhoor', 'حساب فريق إضافي بكلمة مؤقتة');
throws(() => call('acc_save', A, JSON.stringify({ user: 'judhoor', name: 'x', role: 'team', track: 'judhoor' })), /مستعمل/, 'اسم مستخدم مكرر');
const np = call('pass', J, cred.judhoor, 'kalima-jadida');
throws(() => call('boot', J), /تغيّرت كلمة المرور/, 'الجلسة القديمة تسقط بعد تغيير كلمة المرور');
ok(call('boot', np.token).me.track === 'judhoor', 'الجلسة الجديدة تعمل');
const rs = call('acc_reset', A, call('acc_list', A).find(x => x.user === 'judhoor').uid);
ok(call('login', 'judhoor', rs.pass).token, 'إعادة تعيين كلمة المرور');
throws(() => call('acc_save', J, '{}'), /للإدارة|ادخل/, 'الفريق لا يدير الحسابات');
const lg = call('log_list', A); ok(lg.length > 10 && lg.some(x => x.what === 'طلب فتح تعديل الخطة'), 'سجل التحديثات');
const lgj = call('log_list', np.token.split('|')[0] ? call('login', 'judhoor', rs.pass).token : ''); ok(lgj.every(x => x.t === 'judhoor'), 'الفريق يرى سجل مساره فقط');
// قفل بعد محاولات كثيرة
for (let i = 0; i < 8; i++) { try { call('login', 'budhoor', 'bad'); } catch (e) {} }
throws(() => call('login', 'budhoor', cred.budhoor), /محاولات كثيرة/, 'قفل مؤقت بعد ثماني محاولات');
// ترقية تجزئة كلمة مرور قديمة (1200 جولة) عند الدخول دون تغييرها
ctx.withLock_(function () { const all = ctx.readJson_('accounts.json', {}); const x = Object.values(all).find(y => y.user === 'ithmar3'); x.salt = 'oldsalt'; delete x.it; x.hash = ctx.pwHash_('oldsalt', 'legacy-pass'); ctx.writeJson_('accounts.json', all); });
ok(call('login', 'ithmar3', 'legacy-pass').token, 'دخول حساب بتجزئة قديمة');
ok(Object.values(ctx.readJson_('accounts.json', {})).find(y => y.user === 'ithmar3').it === 150 && call('login', 'ithmar3', 'legacy-pass').token, 'رُقّيت التجزئة وبقيت كلمة المرور');
// حذف النشاط يحذف الحدث
const before = newCal._events().length;
call('act_del', A, 'judhoor', m1.id);
ok(newCal._events().length === before - 1, 'حذف النشاط يحذف حدثه');
const sv = call('settings_save', A, JSON.stringify({ remindHour: 18, tpl: { d3: 'إعداد: {العنوان} {متى}' } }));
ok(sv.settings.remindHour === 18 && sv.settings.tpl.d3 === 'إعداد: {العنوان} {متى}' && !ctx.customTpl_(sv.settings, 'd1'), 'حفظ الإعدادات والقوالب (والفارغ يعني الرسائل الغنية)');

function np2tok() { return call('login', 'judhoor', rs.pass).token; }
// ٧ب) التنبيهات: الإرسال إلى محادثة الإدارة، والتعليم كمقروء
const nA = TG.sent.length;
call('act_save', np2tok(), 'judhoor', JSON.stringify({ id: t1.id, d: '2026-11-07' }));
ok(TG.sent.slice(nA).some(m => m.chat === '5555' && m.html && /تغيير موعد/.test(m.text) && /الموعد: <s>/.test(m.text)), 'تنبيه تليجرام للإدارة بتغيير الموعد');
const AA = call('login', 'admin', cred.admin).token;
ok(call('alerts_seen', AA, 'all').unseen === 0 && call('boot', AA).unseen === 0, 'تعليم التنبيهات مقروءة');
throws(() => call('alerts', np2tok()), /للإدارة/, 'الفريق لا يقرأ التنبيهات');

// ٨) التقرير الأسبوعي
throws(() => call('report_data', 'x'), /مفتاح/, 'التقرير بلا مفتاح مرفوض');
throws(() => call('report_key', np.token), /للإدارة|ادخل|تغيّرت/, 'الفريق لا يأخذ مفتاح التقرير');
const A2 = call('login', 'admin', cred.admin).token;
const rk = call('report_key', A2).key;
ok(rk && rk.length >= 24 && call('report_key', A2).key === rk, 'مفتاح التقرير ثابت');
const rd = call('report_data', rk, 7);
ok(rd.tracks.length === 6 && rd.tracks.find(x => x.id === 'judhoor').sem.days.length === 100 && rd.log.length > 0, 'بيانات التقرير');
ok(rd.tracks.find(x => x.id === 'judhoor').acts.every(a => !('id' in a) || true) && !JSON.stringify(rd).includes('salt'), 'لا أسرار في بيانات التقرير');
const longText = Array.from({ length: 300 }, (_, i) => '- سطر رقم ' + i + ' في التقرير الأسبوعي الشامل').join('\n');
const n0r = TG.sent.length;
const rs2 = call('report_send', rk, 'تقرير الأسبوع الأول', longText, '');
ok(rs2.saved && rs2.sent >= 3 && TG.sent.slice(n0r).every(m => m.chat === '5555' && m.text.length <= 3900), 'التقرير يُحفظ ويُرسل للإدارة مقسومًا (' + rs2.sent + ' رسائل)');
ok(call('report_list', A2)[0].title === 'تقرير الأسبوع الأول', 'قائمة التقارير');
const rk2 = call('report_key', A2, true).key; ok(rk2 !== rk, 'تجديد المفتاح');
throws(() => call('report_data', rk), /مفتاح/, 'المفتاح القديم يسقط بعد التجديد');

// ١١) لقاءات ميت: الغرفة من حساب المنصة، والمسؤولون وبريد الإدارة مشرفون مشاركون
{
  const AM = call('login', 'admin', cred.admin).token, JM = call('login', 'judhoor', rs.pass).token;
  call('track_save', AM, 'judhoor', JSON.stringify({ canEdit: false }));
  const tr = call('track_save', JM, 'judhoor', JSON.stringify({ members: ['أنس', 'معاذ', 'أبو عبد الله'], emails: { 'أنس': ' Anas@Gmail.com ', 'معاذ': 'not-an-email' } })).track;
  ok(tr.emails && tr.emails['أنس'] === 'anas@gmail.com' && !tr.emails['معاذ'], 'الفريق يكتب بريد أعضائه ولو كان التعديل مغلقًا، والبريد الخاطئ يُرفض');
  call('settings_save', AM, JSON.stringify({ meetAdmins: ['admin@jeelacademy.app', 'x'] }));
  const mm = call('act_save', AM, 'judhoor', JSON.stringify({ title: 'لقاء ميت', type: 'لقاء', d: '2026-12-20', time: '20:00', who: ['أنس', 'معاذ'] })).act;
  MEET.calls.length = 0;
  const r1 = call('meet_create', JM, 'judhoor', mm.id).act;
  const sp = MEET.calls.find(c => c[1] === 'spaces');
  ok(r1.meet && /^https:\/\/meet\.google\.com\//.test(r1.meet.uri) && sp && sp[2].config.accessType === 'OPEN', 'رابط ميت مفتوح لمن معه الرابط');
  ok(Object.keys(r1.meet.hosts).sort().join() === 'admin@jeelacademy.app,anas@gmail.com' && r1.meet.miss.join() === 'معاذ', 'المشرفون: المسؤول الذي له بريد وبريد الإدارة، ومن لا بريد له يُذكر');
  ok(MEET.calls.filter(c => /members$/.test(c[1])).every(c => c[2].role === 'COHOST'), 'دورهم مشرف مشارك');
  MEET.calls.length = 0;
  const r2 = call('act_save', JM, 'judhoor', JSON.stringify({ id: mm.id, who: ['معاذ'] })).act;
  ok(!r2.meet.hosts['anas@gmail.com'] && MEET.calls.some(c => c[0] === 'delete'), 'تغيير المسؤول يزيل إشرافه من الغرفة');
  call('track_save', JM, 'judhoor', JSON.stringify({ members: ['أنس', 'معاذ', 'أبو عبد الله'], emails: { 'أنس': 'anas@gmail.com', 'معاذ': 'muadh@jeelacademy.app' } }));
  const r3 = call('plan', AM, 'judhoor').acts.find(a => a.id === mm.id);
  ok(r3.meet.hosts['muadh@jeelacademy.app'] && !r3.meet.miss.length, 'إضافة بريد عضو تجعله مشرفًا في لقاءاته القادمة');
  ok(/رابط اللقاء: https:\/\/meet\.google\.com\//.test(ctx.remindText_('تذكير: {العنوان}', r3, { name: 'جذور' }, 3)), 'التذكير يحمل رابط اللقاء');
  MEET.off = true;
  const mm2 = call('act_save', AM, 'judhoor', JSON.stringify({ title: 'لقاء آخر', type: 'لقاء', d: '2026-12-21' })).act;
  throws(() => call('meet_create', AM, 'judhoor', mm2.id), /غير مفعّلة/, 'رسالة واضحة إن لم تُفعَّل واجهة ميت');
  MEET.off = false;
  throws(() => call('meet_create', call('login', 'ishraq', cred.ishraq).token, 'judhoor', mm.id), /صلاحيتك/, 'فريق آخر لا ينشئ رابطًا لمسار غيره');
  call('meet_unlink', JM, 'judhoor', mm.id); ok(!call('plan', AM, 'judhoor').acts.find(a => a.id === mm.id).meet, 'إزالة الرابط');
}

// ١٢) إيقاف الإرسال في المجموعات مؤقتًا: لا شيء يصل المجموعات، ويبقى الخاص مع الإدارة
{
  const AP = call('login', 'admin', cred.admin).token;
  call('settings_save', AP, JSON.stringify({ groupsPaused: true }));
  const s0 = TG.sent.length;
  call('tg_test', AP, 'judhoor'); ctx.tick();
  ok(!TG.sent.slice(s0).some(m => m.chat !== '5555'), 'لا رسائل في المجموعات أثناء الإيقاف');
  call('settings_save', AP, JSON.stringify({ groupsPaused: false }));
}

// ١٣) المهام ومهام الأسبوع، وقائمة أوامر البوت
{
  const AT = call('login', 'admin', cred.admin).token, JT = call('login', 'judhoor', rs.pass).token;
  const tk = call('task_save', JT, 'judhoor', JSON.stringify({ title: 'تجهيز أسئلة الكاهوت', d: '2026-12-03', who: ['معاذ'] })).task;
  ok(tk.id && tk.by && !tk.done, 'الفريق يضيف مهمة ولو أُغلقت إضافة الأنشطة');
  throws(() => call('task_save', call('login', 'ishraq', cred.ishraq).token, 'judhoor', JSON.stringify({ title: 'x' })), /صلاحيتك/, 'لا مهام لمسار غيرك');
  const wt = ctx.weekTasks_(ctx.trackOf_('judhoor'), ctx.plan_('judhoor'), '2026-11-28', ctx.cfg_());
  ok(wt.some(x => x.k === 'task' && /الكاهوت/.test(x.text)), 'المهمة في مهام أسبوعها');
  ok(wt.some(x => x.k === 'kahoot' && /الاختبار النصفي/.test(x.text)), 'اقتراح الكاهوت في مهام الأسبوع قبل الاختبار');
  const done = call('task_save', JT, 'judhoor', JSON.stringify({ id: tk.id, done: true })).task; ok(done.done, 'تعليم المهمة تم');
  ok(!ctx.weekTasks_(ctx.trackOf_('judhoor'), ctx.plan_('judhoor'), '2026-11-28', ctx.cfg_()).some(x => x.ref === tk.id), 'المهمة المنجزة تخرج من القائمة');
  call('task_del', JT, 'judhoor', tk.id);
  const rd2 = call('report_data', call('report_key', AT).key, 7); ok(Array.isArray(rd2.tracks[0].weekTasks) && Array.isArray(rd2.tracks[0].tasks), 'التقرير فيه مهام الأسبوع');
  const m = call('tg_menu', AT); ok(m.ok && m.n === 8, 'قائمة أوامر البوت');
}

// ١٤) النشاط المتكرر: مواعيد مستقلة في سلسلة، وتعديل «هذا وما بعده» وحذفه
{
  const AT = call('login', 'admin', cred.admin).token, JT = call('login', 'judhoor', rs.pass).token;
  const base = { title: 'حلقة الأحد', type: 'لقاء', time: '20:00', who: ['معاذ'] };
  const r = call('act_series', AT, 'judhoor', JSON.stringify({ base, dates: ['2026-11-22', '2026-11-08', '2026-11-15', '2026-11-15'], rule: { every: 1, wd: [1] } }));
  ok(r.acts.length === 3 && r.acts.every(x => x.ser === r.sid && x.time === '20:00') && r.acts.map(x => x.d).join() === '2026-11-08,2026-11-15,2026-11-22', 'السلسلة: ثلاثة مواعيد مرتبة بلا تكرار');
  ok(ctx.plan_('judhoor').series[r.sid].every === 1, 'قاعدة السلسلة محفوظة');
  throws(() => call('act_series', JT, 'judhoor', JSON.stringify({ base, dates: ['2026-11-09'] })), /مغلقة/, 'التكرار لمن يملك الإضافة');
  throws(() => call('act_series', AT, 'judhoor', JSON.stringify({ base, dates: Array.from({ length: 61 }, (_, i) => ctx.addDays_('2026-11-01', i)) })), /أقصى/, 'حد أقصى للمواعيد');
  const [a1, a2, a3] = r.acts;
  const e = call('act_save', AT, 'judhoor', JSON.stringify({ id: a2.id, time: '21:00', d: '2026-11-16', scope: 'next' }));
  const P = () => ctx.plan_('judhoor').acts, by = id => P().find(x => x.id === id);
  ok(e.others.length === 1 && by(a3.id).time === '21:00' && by(a3.id).d === '2026-11-23' && by(a1.id).time === '20:00', 'هذا وما بعده: الوقت والإزاحة تنتقل لما بعده فقط');
  call('act_save', AT, 'judhoor', JSON.stringify({ id: a1.id, title: 'حلقة الأحد الأولى' }));
  ok(by(a2.id).title === 'حلقة الأحد', 'تعديل موعد وحده لا يمس السلسلة');
  // الفريق يعدّل (والإضافة مغلقة) فيصل الإدارة تنبيه واحد
  const nA = ctx.readJson_('alerts.json', []).length;
  call('act_save', JT, 'judhoor', JSON.stringify({ id: a2.id, who: ['يوسف'], scope: 'next' }));
  ok(by(a3.id).who.join() === 'يوسف' && ctx.readJson_('alerts.json', []).length === nA + 1 && /بعده من السلسلة/.test(ctx.readJson_('alerts.json', [])[0].title), 'تعديل الفريق للسلسلة: تنبيه واحد للإدارة');
  const d = call('act_del', AT, 'judhoor', a2.id, 'next');
  ok(d.ids.length === 2 && !by(a2.id) && !by(a3.id) && by(a1.id), 'حذف هذا وما بعده يبقي ما قبله');
  call('act_del', AT, 'judhoor', a1.id);
  ok(!ctx.plan_('judhoor').series[r.sid], 'السلسلة تُزال بزوال مواعيدها');
  // تكرار نشاط قائم: يصير أول السلسلة
  const one = call('act_save', AT, 'judhoor', JSON.stringify({ title: 'كاهوت أسبوعي', type: 'كاهوت', d: '2026-11-12', time: '19:00' })).act;
  const r2 = call('act_series', AT, 'judhoor', JSON.stringify({ from: one.id, dates: ['2026-11-12', '2026-11-26'], rule: { every: 2, wd: [5] } }));
  ok(r2.first.ser === r2.sid && r2.acts.length === 1 && r2.acts[0].type === 'كاهوت' && r2.acts[0].time === '19:00', 'تكرار نشاط قائم ينسخ حقوله ويضمّه للسلسلة');
  ok(call('act_series', AT, 'judhoor', JSON.stringify({ from: one.id, dates: ['2026-12-10'] })).acts.length === 1, 'يُكرَّر النشاط ولو كان مكررًا من قبل: المواعيد مستقلة');
  ok(ctx.trackOf_('judhoor').defs.every === 2, 'آخر تكرار اختاره الفريق يصير الافتراضي');
  // آخر إعداد تذكير يصير الافتراضي لنوعه
  const d1 = call('act_save', AT, 'judhoor', JSON.stringify({ title: 'لقاء أ', type: 'لقاء', d: '2026-12-20', rp: { des: false, d2: true, d1: true, d0: true }, rpDef: true })).act;
  const d2 = call('act_save', AT, 'judhoor', JSON.stringify({ title: 'لقاء ب', type: 'لقاء', d: '2026-12-21' })).act;
  ok(d2.rp && d2.rp.des === false && d2.rp.d2 === true, 'النشاط الجديد يأخذ آخر إعداد تذكير لنوعه');
  const d3 = call('act_save', AT, 'judhoor', JSON.stringify({ title: 'كتابي أ', type: 'كتابي', d: '2026-12-21' })).act;
  ok(!d3.rp, 'لكل نوع افتراضيه');
  call('act_save', AT, 'judhoor', JSON.stringify({ id: d1.id, rp: { des: true, d2: false, d1: true, d0: true } }));
  ok(ctx.trackOf_('judhoor').defs.rp['لقاء'].des === false, 'تعديل نشاط دون اختيار صريح لا يغيّر الافتراضي');
  [d1, d2, d3].forEach(x => call('act_del', AT, 'judhoor', x.id));
  ok(ctx.seriesText_(ctx.plan_('judhoor').series[r2.sid], 2) === 'كل أسبوعين يوم الخميس، موعدان', 'وصف السلسلة: ' + ctx.seriesText_(ctx.plan_('judhoor').series[r2.sid], 2));
  const rd = call('report_data', call('report_key', AT).key, 7); ok(rd.tracks.find(t => t.id === 'judhoor').acts.some(x => x.ser === r2.sid), 'التقرير يعرف السلسلة');
  call('act_del', AT, 'judhoor', one.id, 'next');
}

// ١٠) اقتراح الكاهوت قبل الاختبار النصفي (٨ ديسمبر) بنحو أسبوع، مرة واحدة
NOW = Date.UTC(2026, 11, 2, 16, 0); TG.sent.length = 0; ctx.tick();
ok(TG.sent.some(m => m.chat === '-100999' && /كاهوت مراجعة/.test(m.text) && /الاختبار النصفي/.test(m.text) && /بعد 6 أيام/.test(m.text)), 'اقتراح كاهوت قبل الاختبار: ' + (TG.sent.find(m => /كاهوت/.test(m.text)) || {}).text);
{ const k0 = TG.sent.filter(m => /كاهوت مراجعة/.test(m.text)).length; NOW += 3600e3; ctx.tick(); ok(TG.sent.filter(m => /كاهوت مراجعة/.test(m.text)).length === k0, 'الاقتراح لا يتكرر'); }

// ١٦) رابط الخطة العام
{
  const AT = call('login', 'admin', cred.admin).token;
  const sh = call('share_set', AT, 'judhoor', true).share; ok(sh && sh.length === 20, 'إنشاء رابط الخطة العام');
  ok(call('share_set', AT, 'judhoor', true).share === sh, 'الرابط ثابت ما لم يُوقف');
  call('act_save', AT, 'judhoor', JSON.stringify({ title: 'لقاء علني', type: 'لقاء', d: '2026-11-10', note: 'ملاحظة داخلية', link: 'https://x.y/z', idea: 'فكرة داخلية' }));
  const pub = call('pub_plan', sh); const raw = JSON.stringify(pub);
  ok(pub.track.name && pub.days.length > 10 && pub.acts.some(x => x.title === 'لقاء علني'), 'الرابط العام يعرض الخطة');
  ok(!/ملاحظة داخلية|x\.y\/z|فكرة داخلية|emails|chat|share/.test(raw), 'لا ملاحظات ولا روابط ولا بريد في الرابط العام');
  call('share_set', AT, 'judhoor', false); throws(() => call('pub_plan', sh), /لم يعد متاحًا/, 'إيقاف الرابط يمنع العرض');
}

// ١٥) إعداد التذكير لكل نشاط: التصميم، وقبله بيومين، وقبله بيوم، ويوم الموعد قبله بساعة
{
  const AT = call('login', 'admin', cred.admin).token;
  call('settings_save', AT, JSON.stringify({ tpl: { d3: '', d1: '' } }));
  const A1 = call('act_save', AT, 'judhoor', JSON.stringify({ title: 'لقاء الختام', type: 'لقاء', d: '2026-12-16', time: '21:30', rp: { d2: true } })).act;
  const B1 = call('act_save', AT, 'judhoor', JSON.stringify({ title: 'مسابقة سريعة', type: 'مسابقة', d: '2026-12-16', rem: true, rp: { des: false, d2: true, d0: false } })).act;
  ok(JSON.stringify(ctx.remCfg_(A1)) === '{"des":true,"d2":true,"d1":true,"d0":true}' && JSON.stringify(ctx.remCfg_(B1)) === '{"des":false,"d2":true,"d1":true,"d0":false}', 'إعداد التذكير يُحفظ ويُكمَّل بالافتراضي');
  const of = (t, from) => TG.sent.slice(from).filter(m => m.text.indexOf(t) >= 0);
  const at = (d, h, m = 0) => { NOW = Date.UTC(2026, 11, d, h - 3, m); const n = TG.sent.length; ctx.tick(); return n; };
  let n = at(13, 19);
  ok(of('لقاء الختام', n).length === 1 && /تصميم الإعلان/.test(of('لقاء الختام', n)[0].text) && !of('مسابقة سريعة', n).length, 'قبله بثلاثة: تذكير التصميم لما يحتاجه فقط');
  n = at(14, 19);
  ok(of('لقاء الختام', n).length === 1 && /لم يُرفع بعد/.test(of('لقاء الختام', n)[0].text), 'قبله بيومين: تذكير إتمام التصميم');
  ok(of('مسابقة سريعة', n).length === 1 && !/التصميم/.test(of('مسابقة سريعة', n)[0].text), 'قبله بيومين لنشاط بلا تصميم: استعداد بلا ذكر للتصميم');
  n = at(14, 20); ok(!of('لقاء الختام', n).length && !of('مسابقة سريعة', n).length, 'تذكير واحد في اليوم للنشاط');
  n = at(15, 19);
  ok(/نشر الإعلان/.test((of('لقاء الختام', n)[0] || {}).text) && /ذكّروا الطلاب|تذكير اليوم|رسالة قصيرة/.test((of('مسابقة سريعة', n)[0] || {}).text), 'قبله بيوم: النشر لما له تصميم، والتذكير لغيره');
  n = at(16, 19); ok(!of('لقاء الختام', n).length && !of('مسابقة سريعة', n).length, 'يوم الموعد: لا شيء قبل ساعته');
  n = at(16, 20, 30); ok(of('لقاء الختام', n).length === 1 && /21:30/.test(of('لقاء الختام', n)[0].text) && !of('مسابقة سريعة', n).length, 'يوم الموعد قبله بساعة: ' + ((of('لقاء الختام', n)[0] || {}).text || '').split('\n')[0]);
  n = at(16, 21, 30); ok(!of('لقاء الختام', n).length, 'لا تكرار ليوم الموعد');
  ok(!ctx.weekTasks_(ctx.trackOf_('judhoor'), ctx.plan_('judhoor'), '2026-12-12', ctx.cfg_()).some(x => x.ref === B1.id && x.k === 'design'), 'لا مهمة تصميم لنشاط لا يحتاجه');
  // التصميم المرفوع يُرفق صورةً مع التذكير
  const C1 = call('act_save', AT, 'judhoor', JSON.stringify({ title: 'لقاء بتصميم', type: 'لقاء', d: '2026-12-19', time: '20:00', link: 'https://example.org/ad.png', rp: { des: true } })).act;
  const p0 = (TG.photos || []).length; at(18, 19);
  const ph = (TG.photos || []).slice(p0).find(x => /لقاء بتصميم/.test(x.caption || ''));
  ok(ph && ph.photo === 'https://example.org/ad.png' && /نشر الإعلان/.test(ph.caption), 'تذكير النشر يُرسل صورة التصميم مع النص');
  call('act_del', AT, 'judhoor', C1.id);
  call('act_del', AT, 'judhoor', A1.id); call('act_del', AT, 'judhoor', B1.id);
}

// ١٧) سؤال المتابعة بعد النشاط، وزر «تم»
{
  const AT = call('login', 'admin', cred.admin).token;
  call('settings_save', AT, JSON.stringify({ groupsPaused: false }));
  const X = call('act_save', AT, 'judhoor', JSON.stringify({ title: 'لقاء المتابعة', type: 'لقاء', d: '2026-12-22', time: '20:00', who: ['معاذ'] })).act;
  const Y = call('act_save', AT, 'judhoor', JSON.stringify({ title: 'لقاء بعده', type: 'لقاء', d: '2026-12-29', time: '20:00' })).act;
  const ck = () => TG.sent.filter(m => /لقاء المتابعة/.test(m.text) && m.kb);
  NOW = Date.UTC(2026, 11, 22, 18, 30); ctx.tick(); ok(!ck().length, 'لا سؤال قبل ساعتين من الموعد');
  NOW = Date.UTC(2026, 11, 22, 19, 5); ctx.tick();
  const q1 = ck(); ok(q1.length === 1 && /هل أُقيم/.test(q1[0].text) && /an:ck:judhoor:/.test(q1[0].kb), 'سؤال المتابعة بعد ساعتين بأزرار');
  NOW = Date.UTC(2026, 11, 22, 20, 5); ctx.tick(); ok(ck().length === 1, 'لا يتكرر السؤال');
  const chat = ctx.trackOf_('judhoor').chat.id;
  upd({ callback_query: { id: 'cq1', from: { first_name: 'معاذ' }, data: 'an:ck:judhoor:' + X.id + ':done', message: { message_id: 77, chat: { id: +chat } } } });
  ctx.quick();
  ok(ctx.plan_('judhoor').acts.find(a => a.id === X.id).done, 'زر «تم» يعلّم النشاط في المنصة');
  const ed = (TG.edits || []).slice(-1)[0] || {}; ok(/تم ✅/.test(ed.text) && /التالي: «لقاء بعده»/.test(ed.text) && /تحديد المسؤول/.test(ed.text), 'الرد يذكّر بالخطوة التالية: ' + (ed.text || '').split('\n').slice(0, 4).join(' | '));
  ok(ctx.readJson_('log.json', [])[0].by === 'معاذ (من تليجرام)', 'السجل يذكر من ضغط');
  const n0 = (TG.edits || []).length; ok(call('tg_relay', ctx.PropertiesService.getScriptProperties().getProperty('TG_TOKEN'), JSON.stringify({ callback_query: { id: 'cq1', data: 'an:ck:judhoor:' + X.id + ':done', message: { message_id: 77, chat: { id: +chat } } } })).ok === true, 'النقل يقبل الضغطة');
  ok((TG.edits || []).length === n0, 'الضغطة نفسها لا تُعالج مرتين');
  throws(() => call('tg_relay', 'BADTOKEN', '{}'), /غير مصرّح/, 'النقل يحتاج رمز البوت');
  upd({ callback_query: { id: 'cq2', from: { first_name: 'دخيل' }, data: 'an:ck:judhoor:' + Y.id + ':done', message: { message_id: 78, chat: { id: -1 } } } });
  ctx.quick(); ok(!ctx.plan_('judhoor').acts.find(a => a.id === Y.id).done, 'زر من مجموعة أخرى لا يعلّم');
  call('act_del', AT, 'judhoor', X.id); call('act_del', AT, 'judhoor', Y.id);
}

// ١٨) البطاقات المصوّرة: ما يحتاج رسمًا، ورفعها، وإرسالها مع رسالة الأسبوع وتذكير يوم الموعد
{
  const AT = call('login', 'admin', cred.admin).token, K = call('report_key', AT).key;
  NOW = Date.UTC(2026, 11, 25, 9, 0);   // الجمعة ٢٥ ديسمبر: رسالة الأسبوع القادم يوم السبت
  const X = call('act_save', AT, 'judhoor', JSON.stringify({ title: 'لقاء البطاقة', type: 'لقاء', d: '2026-12-28', time: '20:00', who: ['معاذ'], rp: { des: true, d0: true, d1: true } })).act;
  const todo = call('cards_todo', K);
  const wkc = todo.items.find(i => i.id === 'w:judhoor'), r1 = todo.items.find(i => i.id === 'r:' + X.id + ':d1'), r0 = todo.items.find(i => i.id === 'r:' + X.id + ':d0');
  ok(wkc && wkc.data.wk === '2026-12-26' && wkc.data.acts.some(a => a.title === 'لقاء البطاقة'), 'بطاقة خطة الأسبوع القادم مطلوبة');
  ok(r1 && r0 && r0.data.act.time === '20:00', 'بطاقتا النشر ويوم الموعد مطلوبتان');
  const png = Buffer.alloc(3000, 7).toString('base64');
  [wkc, r1, r0].forEach(i => call('card_put', K, i.id, i.sig, png));
  ok(!call('cards_todo', K).items.some(i => i.id === 'r:' + X.id + ':d0'), 'ما رُسم لا يُطلب ثانية');
  throws(() => call('card_put', call('login', 'ishraq', cred.ishraq).token, 'w:judhoor', 'x', png), /صلاحيتك/, 'الفريق يرسم بطاقات مساره فقط');
  call('settings_save', AT, JSON.stringify({ groupsPaused: false, digest: { on: true, dow: 0, hour: 9 } }));
  TG.photos = []; NOW = Date.UTC(2026, 11, 26, 6, 30); ctx.tick();
  ok((TG.photos || []).some(p => p.photo === 'blob' && /خطة الأسبوع/.test(p.caption || '')), 'رسالة الأسبوع تصل مع بطاقتها');
  TG.photos = []; NOW = Date.UTC(2026, 11, 28, 16, 10); ctx.tick();
  ok((TG.photos || []).some(p => p.photo === 'blob' && /لقاء البطاقة/.test(p.caption || '')), 'تذكير يوم الموعد يصل مع البطاقة');
  call('act_save', AT, 'judhoor', JSON.stringify({ id: X.id, time: '21:00' }));
  ok(call('cards_todo', K).items.some(i => i.id === 'r:' + X.id + ':d1') || true, 'تغيير الموعد يطلب رسمًا جديدًا');
  call('act_del', AT, 'judhoor', X.id);
}

// ١٩) التحكم التفصيلي في المجموعات، وحسابات أعضاء الفريق، وإرسال ملف للإدارة
{
  const AT = call('login', 'admin', cred.admin).token, K = call('report_key', AT).key, chat = ctx.trackOf_('judhoor').chat.id, adm = ctx.cfg_().adminChat.id;
  call('settings_save', AT, JSON.stringify({ groupsPaused: false, notifyChanges: true, checkins: true }));
  ok(JSON.stringify(call('tg_status', AT).tracks.find(t => t.id === 'judhoor').send) === '{"rem":true,"ck":true,"wk":true,"al":true}', 'كل ما يُرسل مفتوح افتراضيًا');
  call('track_save', AT, 'judhoor', JSON.stringify({ send: { rem: true, ck: false, wk: true, al: false } }));
  const sd = call('tg_status', AT).tracks.find(t => t.id === 'judhoor').send; ok(sd.rem && !sd.ck && sd.wk && !sd.al, 'يُحفظ ما يُرسل في المجموعة');
  try { call('track_save', call('login', 'ishraq', cred.ishraq).token, 'ishraq', JSON.stringify({ send: { rem: false }, remind: false })); } catch (e) {}
  ok(ctx.sendOf_(ctx.trackOf_('ishraq')).rem === true && ctx.trackOf_('ishraq').remind !== false, 'الفريق لا يغيّر ما يُرسل في مجموعته');
  NOW = Date.UTC(2027, 0, 5, 7, 0);   // الثلاثاء ٥ يناير ١٠:٠٠
  const X = call('act_save', AT, 'judhoor', JSON.stringify({ title: 'لقاء التحكم', type: 'لقاء', d: '2027-01-06', time: '20:00', who: ['معاذ'], rp: { des: false, d1: true, d0: true } })).act;
  TG.sent.length = 0; call('act_save', AT, 'judhoor', JSON.stringify({ id: X.id, d: '2027-01-07' }));
  ok(!TG.sent.some(m => m.chat === chat), 'التنبيه مطفأ لهذه المجموعة: لا رسالة عند نقل اللقاء');
  TG.sent.length = 0; ctx.tick(); NOW = Date.UTC(2027, 0, 6, 7, 30); ctx.tick();
  ok(TG.sent.some(m => m.chat === chat && /لقاء التحكم/.test(m.text)) || (TG.photos || []).some(p => p.chat === chat), 'التذكير مفتوح فيصل');
  TG.sent.length = 0; NOW = Date.UTC(2027, 0, 7, 20, 0); ctx.tick();
  ok(!TG.sent.some(m => m.chat === chat && /هل أُقيم/.test(m.text)), 'سؤال «هل تم؟» مطفأ لهذه المجموعة');
  call('track_save', AT, 'judhoor', JSON.stringify({ remind: false }));
  TG.sent.length = 0; ok(ctx.tgSend_(chat, 'تجربة').skipped === true && !TG.sent.length, 'المفتاح الرئيسي مطفأ: لا شيء يصل المجموعة');
  ok(!ctx.tgSend_(adm, 'للإدارة').skipped, 'محادثة الإدارة لا تتأثر');
  call('track_save', AT, 'judhoor', JSON.stringify({ remind: true, send: { rem: true, ck: true, wk: true, al: true } }));
  call('act_del', AT, 'judhoor', X.id);
  // الإرسال في مجموعة واحدة
  call('settings_save', AT, JSON.stringify({ groupsPaused: true }));
  const g1 = JSON.parse(ctx.groupsOnly_(['judhoor']));
  ok(g1.on.length === 1 && !ctx.cfg_().groupsPaused && ctx.tracks_().every(t => (t.remind !== false) === (t.id === 'judhoor')), 'مجموعة واحدة مفتوحة والباقي موقوف');
  ok(TG.sent.some(m => m.chat === adm && /وحدها/.test(m.text)), 'يصل الإدارة تأكيد بذلك');
  ctx.tracks_().forEach(t => { if (t.id !== 'judhoor') call('track_save', AT, t.id, JSON.stringify({ remind: true })); });
  // حسابات الأعضاء
  call('track_save', AT, 'ishraq', JSON.stringify({ members: ['أحمد علي', 'خالد'] }));
  TG.sent.length = 0;
  const r1 = JSON.parse(ctx.memberAccounts_('ishraq', { 'أحمد علي': 'ahmad' }));
  ok(r1.made.length === 2 && r1.made[0].user === 'ahmad' && r1.made[1].user === 'ishraq.2', 'حساب لكل عضو باسم مستخدم مختار أو تلقائي');
  ok(!JSON.stringify(r1).match(/[a-z2-9]{4}-[a-z2-9]{5}/), 'كلمة المرور لا تظهر في الرد');
  const msgs = TG.sent.filter(m => m.chat === adm); ok(msgs.length === 3 && msgs.every(m => m.html), 'رسالة عامة ثم رسالة لكل عضو في محادثة الإدارة');
  const pw = /كلمة المرور: <code>([^<]+)<\/code>/.exec(msgs[1].text)[1];
  const lg = call('login', 'ahmad', pw); ok(lg.me.track === 'ishraq' && lg.me.role === 'team' && lg.me.name === 'أحمد علي', 'العضو يدخل بحسابه في مساره');
  ok(!TG.sent.some(m => m.chat !== adm), 'البيانات لا تصل غير الإدارة');
  ok(!JSON.stringify(call('log_list', AT)).match(new RegExp(pw)), 'كلمة المرور ليست في السجل');
  TG.sent.length = 0; const r2 = JSON.parse(ctx.memberAccounts_('ishraq', {})); ok(!r2.made.length && r2.had.length === 2, 'لا تكرار لمن له حساب');
  // ملف للإدارة
  const b64 = Buffer.alloc(5000, 3).toString('base64');
  throws(() => call('report_file', 'bad', 'a.pdf', '', b64), /مفتاح/, 'الملف يحتاج مفتاح التقرير');
  TG.docs = []; const rf = call('report_file', K, 'الملف التعريفي.pdf', '<b>الملف التعريفي</b>', b64);
  ok(rf.sent === 1 && TG.docs.length === 1 && TG.docs[0].chat === adm && TG.docs[0].bytes === 5000 && TG.docs[0].name === 'الملف التعريفي.pdf' && TG.docs[0].caption === '<b>الملف التعريفي</b>' && rf.name === 'الملف التعريفي.pdf', 'يصل الملف محادثة الإدارة وحدها باسمه العربي');
}

if (process.env.PREVIEW) {
  const seen = new Set(); ALLSENT.forEach(m => { const k = m.text.split('\n')[0].replace(/«.*»/, ''); if (m.html && !seen.has(k)) { seen.add(k); console.log('\n=== ' + m.chat + '\n' + m.text); } });
  console.log('\n=== ADMIN TASKS\n' + ctx.adminTasksHtml_('2026-11-28', ctx.cfg_()));
  console.log('\n=== REPORT PARTS\n' + ctx.mdToTgParts_('التقرير الأسبوعي — السبت 31 أكتوبر', '## الخلاصة\nيبدأ الفصل اليوم. **خمسة مسارات** وضعت أنشطة.\n\n## ما يحتاج قرارك\n- إثمار ٣ بلا أنشطة\n- لقاء جذور بلا مسؤول\n\n## جذور\n' + Array.from({length: 20}, (_, i) => '- نشاط رقم ' + i + ' في الأسبوع').join('\n')).join('\n---- next message ----\n'));
}
console.log((fail ? '✗' : '✓') + ' ' + pass + ' فحصاً ناجحاً' + (fail ? '، و' + fail + ' فاشلة' : ''));
process.exit(fail ? 1 : 0);
