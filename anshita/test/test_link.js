/* اختبار الحساب الموحّد بين منصة الأنشطة وأثر: الخادمان معًا في Node، كلٌّ في محاكٍ مستقل، وطلبات كل منهما تُوجَّه إلى الآخر.
   node anshita/test/test_link.js */

const { A, N, GA, GN, ctl } = require('./link_env.js')();
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const callIn = (ctx, fn, ...args) => { const o = JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify({ fn, args }) } }).getContent()); if (o.error) throw new Error(o.error); try { return JSON.parse(o.result); } catch (e) { return o.result; } };
const a = (fn, ...x) => callIn(A, fn, ...x), n = (fn, ...x) => callIn(N, fn, ...x);
const throws = (f, re, m) => { try { f(); ok(false, m + ' (لم يرمِ)'); } catch (e) { ok(re.test(e.message), m + ' ← ' + e.message); } };

// تجهيز أثر: المدير العام، وحسابان قديمان في أكاديمية الجيل
const atarTemp = /كلمة المرور المؤقتة: (\w+)/.exec(A.bootstrap())[1];
let at = a('auth_login', 'admin', atarTemp).token; a('auth_password', at, atarTemp, 'AtarBoss#2026'); at = a('auth_login', 'admin', 'AtarBoss#2026').token;
const ali = a('acc_save', at, JSON.stringify({ username: 'ali.sharaf', name: 'علي شرف', role: 'user', programs: ['academy'], tracks: ['judhoor'], perms: { ai: true, social: true } }));
let t1 = a('auth_login', 'ali.sharaf', ali.temp).token; a('auth_password', t1, ali.temp, 'AliAtarPass1');
const hasan = a('acc_save', at, JSON.stringify({ username: 'hasan.t', name: 'حسن طبشو', role: 'user', programs: ['academy'], tracks: ['ithmar'], perms: { ai: true } }));
let t2 = a('auth_login', 'hasan.t', hasan.temp).token; a('auth_password', t2, hasan.temp, 'HasanAtar99');

// تجهيز المنصة
const log = N.setup(), cred = {};
log.split('\n').forEach(l => { const m = /المستخدم: (\S+) — كلمة المرور: (\S+)/.exec(l); if (m) cred[m[1]] = m[2]; });
const AD = n('login', 'admin', cred.admin).token;

// ١) حساب جديد في المنصة يُنشأ معه حسابه في أثر بالاسم وكلمة المرور وصلاحيات مساره
const s1 = n('acc_save', AD, JSON.stringify({ user: 'salem', name: 'سالم', role: 'team', track: 'judhoor' }));
ok(s1.pass && s1.atar && s1.atar.username === 'salem' && s1.atar.isNew, 'حساب أثر يُنشأ مع حساب المنصة');
let sa = a('auth_login', 'salem', s1.pass);
ok(sa.me.tracks.join() === 'judhoor' && sa.me.programs.join() === 'academy' && !sa.me.mustChange, 'في أثر بصلاحيات مساره وبلا تغيير إجباري');
ok(sa.me.perms.ai && sa.me.perms.social, 'صلاحياته في أثر مثل زملائه في المسار');
ok(n('acc_list', AD).find(x => x.user === 'salem').linked, 'يظهر في الحسابات أنه مربوط');
// ٢) تغيير كلمة المرور في المنصة يسري على أثر
let st = n('login', 'salem', s1.pass).token;
throws(() => n('pass', st, s1.pass, 'short7'), /ثمانية/, 'كلمة المرور ثمانية أحرف');
st = n('pass', st, s1.pass, 'SalemNew#1').token;
ok(a('auth_login', 'salem', 'SalemNew#1').token, 'الكلمة الجديدة تفتح أثر');
throws(() => a('auth_login', 'salem', s1.pass), /غير صحيحة/, 'القديمة لا تفتح أثر');
// ٣) وتغييرها في أثر يسري على المنصة
let sat = a('auth_login', 'salem', 'SalemNew#1').token;
a('auth_password', sat, 'SalemNew#1', 'SalemAtar#2');
ok(n('login', 'salem', 'SalemAtar#2').token, 'تغيير أثر يسري على المنصة');
throws(() => n('login', 'salem', 'SalemNew#1'), /غير صحيحة/, 'والقديمة لا تفتح المنصة');
st = n('login', 'salem', 'SalemAtar#2').token;
// ٤) الدخول مرة واحدة في الاتجاهين
const sso = n('atar_sso', st);
ok(sso.token && a('auth_me', sso.token).username === 'salem', 'من دخل المنصة تُفتح له جلسة في أثر');
const back = n('login_atar', sat = a('auth_login', 'salem', 'SalemAtar#2').token);
ok(back.me.user === 'salem' && back.me.linked && back.me.uid.indexOf('atar_') !== 0, 'من دخل أثر يدخل المنصة بحسابه نفسه');
ok(n('atar_sso', n('login', 'judhoor', cred.judhoor).token).none, 'الحساب غير المربوط لا جلسة له في أثر بعد');
// ٥) كلمة مؤقتة من الإدارة تسري على أثر
const rs = n('acc_reset', AD, s1.acc.uid);
ok(a('auth_login', 'salem', rs.pass).token, 'إعادة التعيين تسري على أثر');
// ٦) مشرف المسار في أثر، وإلغاؤه يعيد صلاحياته
n('acc_save', AD, JSON.stringify({ uid: s1.acc.uid, user: 'salem', name: 'سالم', role: 'team', track: 'judhoor', atarSup: true }));
let me = a('auth_login', 'salem', rs.pass).me;
ok(me.editLevel === 'full' && me.perms.send && me.perms.upload && me.perms.slides, 'مشرف المسار يأخذ كل صلاحيات التصميم والنشر');
n('acc_save', AD, JSON.stringify({ uid: s1.acc.uid, user: 'salem', name: 'سالم', role: 'team', track: 'judhoor', atarSup: false }));
me = a('auth_login', 'salem', rs.pass).me;
ok(!me.perms.send && me.editLevel === '' && me.perms.ai, 'إلغاء الإشراف يعيد صلاحياته');
// ٧) سنابل خارج الربط
const sn = n('acc_save', AD, JSON.stringify({ user: 'snb.member', name: 'عضو سنابل', role: 'team', track: 'sanabel' }));
ok(sn.atar === null, 'سنابل خارج الربط');
// ٨) طلب مزوّر بين الخادمين يُرفض، والرمز لا يُقبل مرتين
throws(() => a('link_op', 'fake-nonce', JSON.stringify({ op: 'session', atar: sa.me.uid })), /غير موثّق/, 'أثر يرفض طلبًا لم يصدره خادم المنصة');
throws(() => n('link_in', 'fake-nonce', JSON.stringify({ op: 'pass', ans: s1.acc.uid, pw: 'Hacked#123' })), /غير موثّق/, 'المنصة ترفض طلبًا لم يصدره خادم أثر');
const p0 = JSON.stringify({ op: 'x' }), nonce = N.linkIssue_(p0);
ok(n('link_check', nonce, N.linkHash_(p0)) === 'ok' && n('link_check', nonce, N.linkHash_(p0)) === 'no', 'الرمز يُقبل مرة واحدة');
ok(n('link_check', N.linkIssue_(p0), N.linkHash_('{"op":"y"}')) === 'no', 'والرمز لا يُقبل لمحتوى غير محتواه');

// ٩) ربط الحسابات الموجودة دفعة واحدة: أعضاء أُنشئوا قبل الربط، والأزواج من سجل ربط أثر
ctl.offline = true;
const aliN = n('acc_save', AD, JSON.stringify({ user: 'ali.sh', name: 'علي شرف الدين', role: 'team', track: 'judhoor' }));
const hasN = n('acc_save', AD, JSON.stringify({ user: 'hasan', name: 'حسن طبشو', role: 'team', track: 'ithmar3' }));
ctl.offline = false;
ok(aliN.atar.err && !n('acc_list', AD).find(x => x.user === 'ali.sh').linked && n('acc_list', AD).find(x => x.user === 'ali.sh').lkErr, 'تعذّر الاتصال يُسجَّل ولا يمنع إنشاء الحساب');
n('atar_link', AD, JSON.stringify({ uid: ali.acc.uid, track: 'judhoor', name: 'علي شرف', username: 'ali.sharaf' }));
n('atar_link', AD, JSON.stringify({ uid: hasan.acc.uid, track: 'ithmar3', name: 'حسن طبشو', username: 'hasan.t' }));
n('login_atar', at);   // المدير العام في أثر دخل المنصة مرة من قبل (حساب ظل بدور الإدارة)
const P = N.linkPairs_();
ok(P.pairs[aliN.acc.uid] === ali.acc.uid && P.pairs[hasN.acc.uid] === hasan.acc.uid, 'الأزواج من سجل الربط بالاسم أو أوله');
const admUid = n('acc_list', AD).find(x => x.user === 'admin').uid;
ok(P.pairs[admUid] === a('auth_me', at).uid, 'حساب الإدارة ↔ المدير العام في أثر');
const res = JSON.parse(N.linkAll_(P.pairs));
ok(res.find(r => r.name === 'علي شرف الدين').res.isNew === false && res.some(r => r.track === 'judhoor' && r.res.isNew), 'دمج القديم وإنشاء الجديد');
ok(a('auth_me', at).username === 'admin' && a('auth_me', at).role === 'super', 'اسم دخول المدير العام في أثر لا يتغير');
// علي يدخل المنصة أولًا بكلمتها: تصير كلمة أثر أيضًا، وتبقى تصاميمه لأن حسابه في أثر هو نفسه
const aliT = n('login', 'ali.sh', aliN.pass);
ok(aliT.token && n('acc_list', AD).find(x => x.user === 'ali.sh').lkPend === false, 'أول دخول للمنصة يوحّد الكلمة');
const aliA = a('auth_login', 'ali.sh', aliN.pass);
ok(aliA.me.uid === ali.acc.uid && aliA.me.username === 'ali.sh', 'يدخل أثر بحسابه القديم نفسه وباسم المنصة');
throws(() => a('auth_login', 'ali.sh', 'AliAtarPass1'), /غير صحيحة/, 'وكلمة أثر القديمة لم تعد تعمل');
// حسن يدخل أثر أولًا بكلمة أثر القديمة: تصير كلمة المنصة أيضًا
ok(a('auth_login', 'hasan', 'HasanAtar99').token, 'يدخل أثر بكلمته القديمة');
ok(n('login', 'hasan', 'HasanAtar99').token, 'وتصير كلمة المنصة أيضًا');
// حساب المسار الجديد في أثر بلا كلمة: أول دخول لأثر بكلمة المنصة يعمل
const jud = res.find(r => r.track === 'judhoor' && r.res.isNew && r.name !== 'سالم');
ok(jud && a('auth_login', jud.res.username, cred.judhoor).token, 'حساب المسار يدخل أثر بكلمة المنصة من أول مرة');
throws(() => a('auth_login', jud.res.username, 'wrong-password'), /غير صحيحة/, 'والكلمة الخاطئة تُرفض');
// ١٠) حذف الحساب من المنصة يوقف حسابه في أثر وتبقى تصاميمه
n('acc_del', AD, s1.acc.uid);
throws(() => a('auth_login', 'salem', rs.pass), /موقوف/, 'حذف حساب المنصة يوقف حسابه في أثر');

// ١١) المشرف العام في المنصة = مشرف برنامج الأكاديمية في أثر، وإلغاؤه يعيد حسابه كما كان
const mm = n('acc_save', AD, JSON.stringify({ user: 'm.almahmoud', name: 'محمد محمود', role: 'team', track: 'judhoor' }));
let mmA = a('auth_login', 'm.almahmoud', mm.pass).me;
ok(mmA.role === 'user' && mmA.tracks.join() === 'judhoor', 'قبل الإشراف: حساب مسار في أثر');
n('acc_save', AD, JSON.stringify({ uid: mm.acc.uid, user: 'm.almahmoud', name: 'محمد محمود', role: 'sup' }));
mmA = a('auth_login', 'm.almahmoud', mm.pass).me;
ok(mmA.role === 'sup' && mmA.programs.indexOf('academy') >= 0 && !mmA.tracks.length, 'المشرف العام: مشرف برنامج الأكاديمية بكل مساراتها');
const mmN = n('login', 'm.almahmoud', mm.pass);
ok(mmN.me.role === 'sup' && mmN.me.linked && Object.keys(n('boot', mmN.token).plans).length > 1, 'وفي المنصة يرى المسارات كلها');
const mmT = a('auth_login', 'm.almahmoud', mm.pass).token;
ok(a('acc_list', mmT).some(x => x.username === 'ali.sh'), 'يرى حسابات الأكاديمية في أثر');
throws(() => a('acc_reset', mmT, aliA.me.uid), /مشتركة مع منصة الأنشطة/, 'ولا يعيد كلمة مرور حساب مربوط من أثر');
const rsA = a('acc_reset', at, aliA.me.uid);
ok(n('login', 'ali.sh', rsA.temp).token, 'والمدير العام يعيدها فتسري على المنصة');
throws(() => a('acc_save', at, JSON.stringify({ uid: aliA.me.uid, username: 'ali.other', name: 'علي', role: 'user' })), /من منصة الأنشطة/, 'اسم دخول الحساب المربوط لا يُغيَّر من أثر');
n('acc_save', AD, JSON.stringify({ uid: mm.acc.uid, user: 'm.almahmoud', name: 'محمد محمود', role: 'team', track: 'judhoor' }));
mmA = a('auth_login', 'm.almahmoud', mm.pass).me;
ok(mmA.role === 'user' && mmA.tracks.join() === 'judhoor', 'إلغاء الإشراف العام يعيد حسابه في أثر كما كان');
const gs = n('acc_save', AD, JSON.stringify({ user: 'gen2', name: 'مشرف ثان', role: 'sup' }));
ok(gs.atar && gs.atar.isNew && a('auth_login', 'gen2', gs.pass).me.role === 'sup', 'مشرف عام جديد يُنشأ له حساب مشرف برنامج في أثر');
n('acc_save', AD, JSON.stringify({ uid: gs.acc.uid, user: 'gen2', name: 'مشرف ثان', role: 'team', track: 'ishraq' }));
ok(a('auth_login', 'gen2', gs.pass).me.tracks.join() === 'ishraq', 'وإن صار فريقًا فله مساره وحده');

console.log((fail ? '✗' : '✓') + ' ' + pass + ' فحصًا ناجحًا في الربط' + (fail ? '، و' + fail + ' فاشلة' : '') + ' (' + ctl.calls + ' طلبًا بين الخادمين)');
process.exit(fail ? 1 : 0);
