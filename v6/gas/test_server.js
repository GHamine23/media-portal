/* اختبار الخادم كاملاً في Node عبر المحاكي: node v6/gas/test_server.js */
const fs = require('fs'), vm = require('vm'), path = require('path');
const GAS = require('./shim.js');
const ROOT = path.resolve(__dirname, '../..');
const ctx = Object.assign({ console: { log: function () {}, warn: function () {} }, JSON, Date, Math, Object, Array, String, Number, Error, RegExp, encodeURIComponent }, GAS);
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'server/Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });
GAS._fetch.handler = function (url, opt) {
  if (url.indexOf('raw.githubusercontent.com/GHamine23/media-portal/main/assets/') >= 0) {
    const f = path.join(ROOT, 'assets', url.split('/main/assets/')[1]);
    return fs.existsSync(f) ? { code: 200, body: Array.from(fs.readFileSync(f)) } : { code: 404, body: '' };
  }
  if (url.indexOf('raw.githubusercontent.com/google/fonts') >= 0) return { code: 200, body: [0, 1, 0, 0, 0, 9] };
  if (url.indexOf('generativelanguage.googleapis.com') >= 0) {
    GAS._lastAi = { url: url, opt: opt };
    return { code: 200, body: JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"designs":[{"tpl":"ann_panel"}]}' }] } }] }) };
  }
  return { code: 404, body: '' };
};
function call(fn) { const args = Array.prototype.slice.call(arguments, 1); const out = JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify({ fn: fn, args: args }) } }).getContent()); if (out.error) throw new Error(out.error); return out.result; }
function J(fn) { return JSON.parse(call.apply(null, arguments)); }
function fails(fn, re) { try { call.apply(null, [fn].concat(Array.prototype.slice.call(arguments, 2))); } catch (e) { if (re && !re.test(e.message)) throw new Error('wrong error for ' + fn + ': ' + e.message); return e.message; } throw new Error('expected failure: ' + fn); }
let n = 0; function ok(c, m) { n++; if (!c) throw new Error('FAIL: ' + m); }

ok(!J('info').ready, 'not ready before bootstrap');
// v5 legacy user before migration
const l5 = J('api_login', 'أ. خالد العمر', '1234');
call('api_tpl_save', l5.token, JSON.stringify({ id: 'legacyitem1', kind: 'tpl', name: 'قالب قديم', shared: false, tpl: 'ann_panel', track: 'ishraq', st: {}, thumb: '', at: 1 }));
ok(JSON.parse(call('api_tpl_list', l5.token)).length === 1, 'legacy list');
call('api_feedback', l5.token, JSON.stringify({ kind: 'bug', text: 'بلاغ من الإصدار الخامس', page: '#/', shot: 'data:image/jpeg;base64,' + Buffer.from([1, 2, 3]).toString('base64') }));

const log = ctx.bootstrap();
const temp = /كلمة المرور المؤقتة: (\w+)/.exec(log)[1];
ok(J('info').ready, 'ready after bootstrap');
ok(/المدير العام موجود/.test(ctx.bootstrap()), 'bootstrap idempotent');
let s = J('auth_login', 'ADMIN', temp); const adm = s.token;
ok(s.me.mustChange && s.me.role === 'super', 'admin must change');
fails('acc_list', /غيّر كلمة المرور/, adm);
fails('auth_password', /ثمانية/, adm, temp, 'short');
J('auth_password', adm, temp, 'StrongPass#1');
fails('auth_login', /غير صحيحة/, 'admin', temp);
const progs = J('prog_list', adm);
ok(progs.length === 3 && progs[0].identities.length === 10, 'programs seeded');
const assets = JSON.parse(call('asset_list', adm, 'program', 'academy'));
ok(assets.filter(function (a) { return a.kind === 'logo'; }).length === 17, 'logos seeded: ' + assets.length);
ok(assets.some(function (a) { return a.family === 'tajarib' && a.weight === '900'; }), 'tajarib font seeded');
const g = JSON.parse(call('asset_list', adm, 'global'));
ok(g.filter(function (a) { return a.kind === 'font' && a.scope === 'global'; }).length === 40, 'open fonts seeded');
// accounts
const sup = J('acc_save', adm, JSON.stringify({ username: 'mushrif.alim', email: 'sup@example.org', name: 'مشرف عالم', role: 'sup', programs: ['alim'] }));
const usr = J('acc_save', adm, JSON.stringify({ username: 'ahmad', name: 'أحمد', role: 'user', programs: ['academy'], perms: { ai: true, social: true } }));
fails('acc_save', /مستعمل/, adm, JSON.stringify({ username: 'Ahmad', name: 'x', role: 'user', programs: ['academy'] }));
let sp = J('auth_login', 'sup@example.org', sup.temp).token; J('auth_password', sp, sup.temp, 'SupPass1234');
fails('acc_save', /المستخدمين فقط/, sp, JSON.stringify({ username: 'boss', role: 'super', programs: ['alim'] }));
fails('acc_save', /صلاحية على برنامج/, sp, JSON.stringify({ username: 'x.user', role: 'user', programs: ['academy'] }));
const alimUser = J('acc_save', sp, JSON.stringify({ username: 'alim.user', name: 'مستخدم عالم', role: 'user', programs: ['alim'] }));
ok(J('acc_list', sp).every(function (a) { return a.programs.indexOf('alim') >= 0; }), 'sup sees only his program accounts');
fails('acc_reset', /لا تملك/, sp, usr.acc.uid);
let ut = J('auth_login', 'ahmad', usr.temp).token; J('auth_password', ut, usr.temp, 'AhmadPass99');
let at = J('auth_login', 'alim.user', alimUser.temp).token; J('auth_password', at, alimUser.temp, 'AlimPass999');
// assets & bundle
const lg = J('asset_put', sp, JSON.stringify({ kind: 'logo', name: 'شعار عالم', mime: 'image/png', scope: 'program', program: 'alim', key: 'lg_alim' }), Buffer.from([9, 9, 9]).toString('base64'));
fails('asset_put', /صلاحية/, ut, JSON.stringify({ kind: 'logo', name: 'x', scope: 'program', program: 'alim' }), 'AAAA');
const bu = J('bundle', ut);
ok(bu.programs.length === 1 && bu.programs[0].id === 'academy', 'user bundle programs');
ok(!bu.assets.some(function (a) { return a.program === 'alim'; }), 'no alim assets for academy user');
ok(J('bundle', at).assets.some(function (a) { return a.id === lg.id; }), 'alim user sees alim logo');
fails('asset_get', /غير موجود/, ut, lg.id);
ok(J('asset_get', at, lg.id).b64 === Buffer.from([9, 9, 9]).toString('base64'), 'asset roundtrip');
const mine = J('asset_put', ut, JSON.stringify({ kind: 'image', name: 'صورتي', mime: 'image/png' }), Buffer.from([5, 6]).toString('base64'));
ok(J('bundle', ut).mine.length === 1, 'user assets in bundle');
fails('asset_get', /غير موجود/, at, mine.id);
const el = J('asset_put', ut, JSON.stringify({ kind: 'element', name: 'عنصري', data: { layers: [{ t: 'text', txt: 'x' }] }, thumb: 'data:image/png;base64,AA' }), '');
ok(J('asset_list', ut, 'user').length === 2, 'element saved');
call('asset_del', ut, el.id); ok(J('asset_list', ut, 'user').length === 1, 'element deleted');
// UI fonts
const thm = J('asset_put', adm, JSON.stringify({ kind: 'font', name: 'Thmanyah Serif Display Medium', family: 'thmanyah-display', label: 'ثمانية عناوين', weight: '500', mime: 'font/otf', scope: 'global', ui: true }), Buffer.from([1, 2, 3, 4]).toString('base64'));
ok(J('ui_fonts').some(function (f) { return f.id === thm.id; }), 'ui font listed');
ok(call('ui_font_get', thm.id) === Buffer.from([1, 2, 3, 4]).toString('base64'), 'ui font served');
fails('asset_put', /صلاحية/, ut, JSON.stringify({ kind: 'font', name: 'f', family: 'f', mime: 'font/otf' }), 'AAAA');
// items & sharing
call('item_save', ut, JSON.stringify({ id: 'item000001', kind: 'tpl', name: 'إعلاني', shared: true, tpl: 'ann_panel', track: 'ishraq', program: 'academy', st: { d: {} } }));
fails('item_save', /لست في هذا البرنامج/, at, JSON.stringify({ id: 'item000002', name: 'x', program: 'academy' }));
call('item_save', at, JSON.stringify({ id: 'item000002', name: 'تصميم عالم', shared: true, program: 'alim', st: {} }));
const ul = J('item_list', ut);
ok(ul.some(function (x) { return x.id === 'item000001' && x.mine; }) && !ul.some(function (x) { return x.id === 'item000002'; }), 'program isolation of shared items');
fails('item_get', /ليس لك/, ut, 'item000002');
fails('item_save', /زميلك/, adm, JSON.stringify({ id: 'item000001', name: 'سرقة', program: 'academy' }));
// legacy import
const imp = J('acc_import', adm, 'academy');
ok(imp.length === 1 && imp[0].name === 'أ. خالد العمر', 'legacy import');
let lt = J('auth_login', imp[0].username, imp[0].temp).token; J('auth_password', lt, imp[0].temp, 'LegacyPass1');
ok(J('item_list', lt).some(function (x) { return x.id === 'legacyitem1' && x.mine; }), 'legacy items stay with migrated account');
ok(J('acc_import', adm, 'academy').length === 0, 'import idempotent');
// feedback
call('fb_send', at, JSON.stringify({ kind: 'idea', text: 'اقتراح من عالم', program: 'alim' }));
call('fb_send', ut, JSON.stringify({ kind: 'bug', text: 'خلل في الأكاديمية', program: 'academy', shot: 'data:image/jpeg;base64,' + Buffer.from([1, 2]).toString('base64') }));
const fsup = J('fb_list', sp); ok(fsup.length === 1 && fsup[0].program === 'alim', 'sup sees own program feedback');
const fall = J('fb_list', adm); ok(fall.length === 3, 'admin sees all feedback ' + fall.length);
const bugId = fall.filter(function (x) { return x.uid === usr.acc.uid; })[0].id;
J('fb_update', adm, bugId, 'done', 'أُصلح في الإصدار ٦');
ok(J('fb_mine', ut)[0].status === 'done', 'user sees status');
ok(/^data:image\/jpeg;base64,/.test(call('fb_shot', adm, bugId)), 'shot served');
fails('fb_update', /لا تملك/, sp, bugId, 'work');
// stats
call('stat_track', ut, JSON.stringify([{ e: 'export', tpl: 'ann_panel', p: 'academy' }, { e: 'open', tpl: 'ann_panel', p: 'academy' }, { e: 'tool', tool: 'dblclick', p: 'academy' }]));
call('stat_track', at, JSON.stringify([{ e: 'export', tpl: 'yt_ring', p: 'alim' }]));
const sa = J('stat_summary', adm, 30); ok(sa.ev.export === 2 && sa.tpl.ann_panel === 2 && sa.nUsers === 2, 'stats admin');
const ss2 = J('stat_summary', sp, 30); ok(ss2.ev.export === 1 && ss2.nUsers === 1, 'stats sup scoped ' + JSON.stringify(ss2.ev));
fails('stat_summary', /لا تملك/, sp, 30, 'academy');
// broadcasts
J('bc_save', sp, JSON.stringify({ title: 'تنبيه عالم', body: 'لقاء المشرفين', programs: ['alim'] }));
J('bc_save', adm, JSON.stringify({ title: 'للجميع', body: 'تحديث المنصة', programs: [] }));
ok(J('bc_list', ut).length === 1 && J('bc_list', at).length === 2, 'broadcast targeting');
fails('bc_save', /حدّد برنامجك/, sp, JSON.stringify({ title: 'x', programs: [] }));
// settings & AI
fails('ai_make', /مفتاح/, ut, JSON.stringify({ prompt: 'p', system: 's', schema: {} }));
GAS._props.GEMINI_KEY = 'k-test';
fails('ai_make', /صلاحية/, at, JSON.stringify({ prompt: 'p', system: 's', schema: {} }));
const out = call('ai_make', ut, JSON.stringify({ prompt: 'إعلان لقاء', system: 'أنت مصمم', schema: { type: 'object' } }));
ok(JSON.parse(out).designs[0].tpl === 'ann_panel', 'ai roundtrip');
ok(GAS._lastAi.opt.headers['x-goog-api-key'] === 'k-test' && /gemini-3\.8-flash:generateContent/.test(GAS._lastAi.url), 'ai request shape');
ok(J('ai_status', ut).used === 1, 'ai usage counted');
J('set_save', adm, JSON.stringify({ ai: { enabled: true, model: 'gemini-3.8-flash', perDay: 1 } }));
fails('ai_make', /حد اليوم/, ut, JSON.stringify({ prompt: 'p', system: 's', schema: {} }));
// lockout and disable
for (let i = 0; i < 8; i++) { try { call('auth_login', 'ahmad', 'wrong' + i); } catch (e) {} }
fails('auth_login', /محاولات كثيرة/, 'ahmad', 'AhmadPass99');
J('acc_save', adm, JSON.stringify({ uid: usr.acc.uid, disabled: true }));
fails('bundle', /موقوف|انتهت/, ut);
// changelog, audit, logout
ok(J('cl_list').length === 1, 'changelog seeded');
ok(J('audit_list', adm).length > 5, 'audit log');
call('auth_logout', at); fails('bundle', /انتهت/, at);
// v5 api still works after v6 data exists
ok(JSON.parse(call('api_tpl_list', l5.token)).length >= 1, 'v5 still works');
console.log('server tests passed:', n);
