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
  if (url.indexOf('api.telegram.org') >= 0) {
    GAS._tg = GAS._tg || []; GAS._tg.push({ url: url, opt: opt });
    if (/getMe$/.test(url)) return { code: 200, body: JSON.stringify({ ok: true, result: { id: 777, username: 'athar_bot', first_name: 'أثر' } }) };
    if (/getUpdates$/.test(url)) return { code: 200, body: JSON.stringify({ ok: true, result: [{ update_id: 1, my_chat_member: { chat: { id: -1001, title: 'قناة الجيل', type: 'channel', username: 'jeel_new' }, date: 1700000000, new_chat_member: { status: 'administrator' } } }, { update_id: 2, message: { chat: { id: -2002, title: 'مجموعة المشرفين', type: 'supergroup' }, date: 1700000100, text: 'hi' } }, { update_id: 3, message: { chat: { id: 5, type: 'private' }, date: 1, text: 'x' } }] }) };
    if (/getChat$/.test(url)) return { code: 200, body: JSON.stringify({ ok: true, result: { id: -1001, title: 'قناة الجيل', type: 'channel', username: 'jeel_new', members_count: 120 } }) };
    if (/getChatMember$/.test(url)) return { code: 200, body: JSON.stringify({ ok: true, result: { status: 'administrator', can_post_messages: true } }) };
    if (!opt.payload.chat_id) return { code: 400, body: JSON.stringify({ ok: false, description: 'chat not found' }) };
    return { code: 200, body: JSON.stringify({ ok: true, result: { message_id: 40 + GAS._tg.length } }) };
  }
  if (url.indexOf('generativelanguage.googleapis.com') >= 0) {
    GAS._lastAi = { url: url, opt: opt }; const gk = opt.headers && opt.headers['x-goog-api-key']; if (GAS._aiKeys) GAS._aiKeys.push(gk);
    if (GAS._quota429 && (gk === GAS._quota429 || GAS._quota429 === 'ALL')) return { code: 429, body: JSON.stringify({ error: { message: 'Quota exceeded for metric generate_content_free_tier_requests, limit: 20 per day PerDay' } }) };
    if (GAS._busy && url.indexOf(GAS._busy) >= 0) return { code: 503, body: '{}' };
    return { code: 200, body: JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"designs":[{"tpl":"ann_panel"}]}' }] } }] }) };
  }
  if (url.indexOf('api.pexels.com') >= 0) {
    if (!opt.headers || opt.headers.Authorization !== 'PXKEY') return { code: 401, body: '' };
    return { code: 200, body: JSON.stringify({ total_results: 2, page: 1, photos: [{ id: 1, width: 4000, height: 6000, src: { medium: 'https://images.pexels.com/m1.jpg', large2x: 'https://images.pexels.com/l1.jpg', original: 'https://images.pexels.com/o1.jpg' }, photographer: 'سمير', photographer_url: 'https://www.pexels.com/@samir', url: 'https://www.pexels.com/photo/1/', alt: 'مسجد', avg_color: '#777' }] }) };
  }
  if (url.indexOf('pixabay.com/api/') >= 0) return { code: 200, body: JSON.stringify({ totalHits: 1, hits: [{ id: 9, imageWidth: 3000, imageHeight: 2000, webformatURL: 'https://pixabay.com/get/x_640.jpg', largeImageURL: 'https://pixabay.com/get/x_1280.jpg', user: 'Nadia', user_id: 5, pageURL: 'https://pixabay.com/photos/x-9/', tags: 'mosque, dome' }] }) };
  if (url.indexOf('pixabay.com/get/x_1280.jpg') >= 0) return { code: 200, body: [255, 216, 255, 9], mime: 'image/jpeg' };
  if (url.indexOf('images.pexels.com/o1.jpg') >= 0) return { code: 200, body: [255, 216, 255, 1, 2, 3], mime: 'image/jpeg' };
  if (url.indexOf('api.openverse.org/v1/images/') >= 0) { GAS._lastOv = url; return { code: 200, body: JSON.stringify({ result_count: 1, page_count: 1, page: 1, results: [{ id: 'ov1', title: 'Mosque', url: 'https://live.staticflickr.com/1/ov1_b.jpg', thumbnail: 'https://api.openverse.org/v1/images/ov1/thumb/', creator: 'Peer', creator_url: 'https://flickr.com/peer', license: 'by-sa', license_version: '2.0', license_url: 'https://creativecommons.org/licenses/by-sa/2.0/', foreign_landing_url: 'https://flickr.com/p/1', width: 1024, height: 683, source: 'flickr', provider: 'flickr' }] }) }; }
  if (url.indexOf('live.staticflickr.com/1/ov1_b.jpg') >= 0) return { code: 200, body: [255, 216, 255, 7], mime: 'image/jpeg' };
  if (url.indexOf('evil.example') >= 0) return { code: 200, body: 'not an image', mime: 'text/html' };
  if (url.indexOf('api.alquran.cloud/v1/surah') >= 0) return { code: 200, body: JSON.stringify({ data: [{ number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ' }, { number: 17, name: 'سُورَةُ الإِسۡرَاءِ' }] }) };
  if (url.indexOf('api.alquran.cloud/v1/ayah/17:23') >= 0) return { code: 200, body: JSON.stringify({ data: { text: 'وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا', surah: { number: 17, name: 'سُورَةُ الإِسۡرَاءِ' }, numberInSurah: 23 } }) };
  if (url.indexOf('api.alquran.cloud/v1/search/') >= 0) return { code: 200, body: JSON.stringify({ data: { count: 1, matches: [{ text: 'وَوَصَّيْنَا الْإِنسَانَ بِوَالِدَيْهِ حُسْنًا', surah: { number: 29, name: 'سُورَةُ العَنكَبُوتِ' }, numberInSurah: 8 }] } }) };
  if (url.indexOf('dorar.net/dorar_api.json') >= 0 && GAS._dorarDown) return { code: 403, body: 'blocked' };
  if (url.indexOf('api.islamic.app/v1/hadith/search') >= 0) return { code: 200, body: JSON.stringify({ code: 200, data: { total: 1, results: [{ collection: 'bukhari', hadithNumber: '1', ar: { text: 'حَدَّثَنَا الْحُمَيْدِيُّ، قَالَ : سَمِعْتُ عُمَرَ بْنَ الْخَطَّابِ رضى الله عنه عَلَى الْمِنْبَرِ قَالَ سَمِعْتُ رَسُولَ اللَّهِ صلى الله عليه وسلم يَقُولُ " إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى "', grades: [{ grade: 'صحيح' }] } }] } }) };
  if (url.indexOf('dorar.net/dorar_api.json') >= 0) return { code: 200, body: JSON.stringify({ ahadith: { result: '<div class="hadith" style="text-align:justify;">إنَّ اللهَ يُحِبُّ إذا <span class="search-keys">عَمِلَ</span> أحدُكُم عملًا أن يُتقِنَه</div><div class="hadith-info"><span class="info-subtitle">الراوي:</span> عائشة أم المؤمنين <span class="info-subtitle">المحدث:</span> الألباني <span class="info-subtitle">المصدر:</span> صحيح الجامع <span class="info-subtitle">الصفحة أو الرقم:</span> 1880 <span class="info-subtitle">خلاصة حكم المحدث:</span> <span >حسن</span></div>--------------<br/><div class="hadith" style="text-align:justify;">نص ضعيف</div><div class="hadith-info"><span class="info-subtitle">الراوي:</span> فلان <span class="info-subtitle">المحدث:</span> الألباني <span class="info-subtitle">المصدر:</span> ضعيف الجامع <span class="info-subtitle">الصفحة أو الرقم:</span> 12 <span class="info-subtitle">خلاصة حكم المحدث:</span> <span >ضعيف</span></div><a href="x">المزيد</a>' } }) };
  if (url.indexOf('text.pollinations.ai') >= 0) { GAS._poll = (GAS._poll || 0) + 1; if (GAS._pollDown) return { code: 500, body: '' }; return { code: 200, body: JSON.stringify({ choices: [{ message: { content: 'نص\n{"text":"من الاحتياطي"}' } }] }) }; }
  if (url.indexOf('api.groq.com') >= 0) {
    GAS._lastGroq = { url: url, opt: opt };
    if (GAS._groqDown) return { code: 500, body: '{}' };
    const b = JSON.parse(opt.payload);
    return { code: 200, body: JSON.stringify({ choices: [{ message: { content: b.response_format ? '{"text":"من Groq"}' : 'نص من Groq' } }] }) };
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
ok(mine.id.indexOf(usr.acc.uid + '_') === 0, 'user asset id carries owner');
ok(J('asset_get', at, mine.id).b64 === Buffer.from([5, 6]).toString('base64'), 'user image readable by id (shared designs)');
fails('asset_get', /غير موجود/, at, usr.acc.uid + '_0000000000000000');
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
// models
fails('item_model', /لمشرف البرنامج/, ut, 'item000001', true);
fails('item_model', /لمشرف البرنامج/, sp, 'item000001', true);
call('item_save', ut, JSON.stringify({ id: 'item000003', kind: 'tpl', name: 'خاص', shared: false, tpl: 'ann_panel', track: 'ishraq', program: 'academy', st: {} }));
call('item_model', adm, 'item000003', true);
call('item_save', ut, JSON.stringify({ id: 'item000003', kind: 'tpl', name: 'خاص معدّل', shared: false, tpl: 'ann_panel', track: 'ishraq', program: 'academy', st: {} }));
ok(J('item_list', ut).filter(function (x) { return x.id === 'item000003'; })[0].model === true, 'model flag survives owner save');
ok(!J('item_list', ut)[0].ownerKey, 'owner keys not exposed');
// archive
const a1 = J('arc_put', ut, JSON.stringify({ name: 'ورشة', kind: 'design', tpl: 'ann_panel', tplName: 'لوحة', track: 'ishraq', trackName: 'إشراق', program: 'academy', size: 'post', via: 'png' }), JSON.stringify({ pages: [{ tpl: 'ann_panel' }] }), 'data:image/jpeg;base64,' + Buffer.from([7, 7]).toString('base64'));
const a2 = J('arc_put', ut, JSON.stringify({ id: a1.id, m: a1.m, name: 'ورشة ٢', program: 'academy', via: 'share' }), JSON.stringify({ pages: [{ tpl: 'ann_panel', v: 2 }] }), 'data:image/jpeg;base64,' + Buffer.from([8, 8]).toString('base64'));
ok(a2.id === a1.id, 'archive entry updated, not duplicated');
J('arc_put', at, JSON.stringify({ name: 'عالم', program: 'alim', via: 'pdf', kind: 'deck' }), '{}', '');
fails('arc_put', /لست في هذا البرنامج/, at, JSON.stringify({ name: 'x', program: 'academy' }), '{}', '');
fails('arc_list', /لمدير المنصة أو مشرف/, ut);
const al = J('arc_list', adm); ok(al.list.length === 2 && al.months[0] === a1.m, 'admin sees whole archive');
const e1 = al.list.filter(function (x) { return x.id === a1.id; })[0];
ok(e1.n === 2 && e1.vias.png === 1 && e1.vias.share === 1 && e1.uname === 'أحمد' && e1.trackName === 'إشراق' && !e1.sf, 'archive entry details');
const sl = J('arc_list', sp); ok(sl.list.length === 1 && sl.list[0].program === 'alim', 'supervisor sees only his programs');
ok(JSON.parse(J('arc_get', adm, a1.m, a1.id).state).pages[0].v === 2, 'archive state is latest');
fails('arc_get', /غير موجود/, sp, a1.m, a1.id);
ok(J('arc_thumbs', adm, a1.m, [a1.id])[a1.id] === Buffer.from([8, 8]).toString('base64'), 'archive preview');
ok(Object.keys(J('arc_thumbs', sp, a1.m, [a1.id])).length === 0, 'supervisor cannot fetch other program previews');
// packs
fails('pack_put', /للمدير العام/, sp, 'p.js', 'PACK({})');
fails('pack_put', /ليس ملف حزمة/, adm, 'p.js', 'alert(1)');
call('pack_put', adm, 'pack-2026-10-23', 'PACK({ id: "t" });');
ok(J('pack_list', adm).some(function (x) { return x.name === 'pack-2026-10-23.js' && x.on; }), 'pack uploaded');
ok(J('api_packs').some(function (x) { return x.name === 'pack-2026-10-23.js'; }), 'pack served');
call('pack_toggle', adm, 'pack-2026-10-23.js', false);
ok(!J('api_packs').some(function (x) { return x.name === 'pack-2026-10-23.js'; }) && !J('pack_list', adm)[0].on, 'disabled pack not served');
call('pack_toggle', adm, 'pack-2026-10-23.js', true);
ok(J('api_packs').some(function (x) { return x.name === 'pack-2026-10-23.js'; }), 'pack re-enabled');
// profile, restrictions, program controls
const prof = J('me_profile', at, JSON.stringify({ name: 'اسمي الجديد', avatar: 'data:image/jpeg;base64,' + Buffer.from([1, 2, 3]).toString('base64') }));
ok(prof.name === 'اسمي الجديد' && /^data:image\/jpeg/.test(prof.avatar) && J('auth_me', at).avatar === prof.avatar, 'profile name and avatar');
fails('me_profile', /صورة غير صحيحة/, at, JSON.stringify({ avatar: 'javascript:x' }));
J('me_profile', at, JSON.stringify({ avatar: '' })); ok(!J('auth_me', at).avatar, 'avatar removed');
const ra = J('acc_save', sp, JSON.stringify({ uid: alimUser.acc.uid, tracks: ['alim_kids', 'BAD ID'], editLevel: 'content' }));
ok(ra.acc.tracks.length === 1 && ra.acc.editLevel === 'content', 'account identities + edit level');
J('prog_save', sp, JSON.stringify({ id: 'alim', fontsId: ['tajawal'], block: { fonts: ['lalezar'], logos: ['lg_x'] }, editLevel: 'style' }));
const pa = J('prog_list', sp)[0]; ok(pa.fontsId[0] === 'tajawal' && pa.block.fonts[0] === 'lalezar' && pa.editLevel === 'style', 'program font/logo controls');
fails('font_family', /للمدير العام/, sp, JSON.stringify({ family: 'tajawal', scope: 'program', program: 'alim' }));
call('font_family', adm, JSON.stringify({ family: 'zain', scope: 'program', program: 'alim' }));
ok(J('bundle', at).assets.some(function (x) { return x.family === 'zain'; }) && !J('bundle', ut).assets.some(function (x) { return x.family === 'zain'; }), 'font family moved to one program');
// telegram
fails('set_save', /رمز البوت/, adm, JSON.stringify({ tgToken: 'bad' }));
J('set_save', adm, JSON.stringify({ tgToken: '123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij' }));
ok(J('set_get', adm).tgOn && J('bundle', ut).settings.tg, 'bot token stored (never returned)');
ok(J('tg_test', adm).username === 'athar_bot', 'tg_test getMe');
fails('tg_send', /قناة/, adm, JSON.stringify({ program: 'academy', caption: 'x', png: 'AAAA' }));
J('prog_save', adm, JSON.stringify({ id: 'academy', tg: { chat: '@jeel_test', link: 'https://example.org/reg', hashtag: 'الأنشطة_التربوية' }, captions: [{ id: 'c1', name: 'إعلان', kind: 'ann', text: '📌 <b>{title}</b>' }], samples: 'نموذج ١\n---\nنموذج ٢' }));
const pa2 = J('prog_list', adm).filter(function (p) { return p.id === 'academy'; })[0]; ok(pa2.tg.chat === '@jeel_test' && pa2.captions.length === 1 && pa2.samples.indexOf('نموذج') === 0, 'program telegram settings saved');
fails('tg_send', /صلاحية/, ut, JSON.stringify({ program: 'academy', caption: 'x', png: 'AAAA' }));
J('acc_save', adm, JSON.stringify({ uid: usr.acc.uid, perms: { ai: true, social: true, send: true } })); ut = J('auth_login', 'ahmad', 'AhmadPass99').token;
const snt = J('tg_send', ut, JSON.stringify({ program: 'academy', name: 'إعلان', caption: '<b>مرحباً</b>', png: Buffer.from([1, 2, 3]).toString('base64'), file: Buffer.from([4, 5, 6]).toString('base64'), fileName: 'x.png', fileMime: 'image/png', mode: 'both' }));
ok(snt.link === 'https://t.me/jeel_test/' + snt.msg && GAS._tg.filter(function (c) { return /sendPhoto|sendDocument/.test(c.url); }).length === 2, 'sent photo + document, link built');
const sch = J('tg_send', ut, JSON.stringify({ program: 'academy', name: 'مجدول', caption: 'بعدين', png: Buffer.from([1]).toString('base64'), mode: 'photo', when: Date.now() + 3600000 }));
ok(sch.queued && J('tg_queue', ut, 'academy').some(function (x) { return x.id === sch.id && x.status === 'queued' && x.mine; }), 'scheduled post queued');
const nTg = GAS._tg.length; ctx.tgTick(); ok(GAS._tg.length === nTg, 'tick does not send future posts');
fails('tg_cancel', /ليس لك/, at, sch.id);
call('tg_cancel', ut, sch.id); ok(J('tg_queue', adm, 'academy').filter(function (x) { return x.id === sch.id; })[0].status === 'cancelled', 'cancelled by owner');
const sch2 = J('tg_send', ut, JSON.stringify({ program: 'academy', name: 'حان', caption: 'الآن', png: Buffer.from([1]).toString('base64'), mode: 'photo', when: Date.now() + 120000 }));
const raw = function (id) { return ctx.readJson_('tgq.json', []).filter(function (x) { return x.id === id; })[0]; }, trashed = function (fid) { return ctx.DriveApp.getFileById(fid).isTrashed(); };
const sch2png = raw(sch2.id).pngId; ok(sch2png && !trashed(sch2png), 'scheduled post keeps its image until sent');
const realNow = ctx.Date.now; ctx.Date.now = function () { return realNow() + 600000; };
ctx.tgTick(); ctx.Date.now = realNow;
ok(J('tg_queue', adm, 'academy').filter(function (x) { return x.id === sch2.id; })[0].status === 'sent', 'tick sends due post');
ok(trashed(sch2png) && !raw(sch2.id).pngId && raw(sch2.id).filesGone, 'sent one-off post: image moved to Drive trash, reference cleared');
ok(J('tg_queue', ut, 'academy').filter(function (x) { return x.id === sch2.id; })[0].hasFile === false, 'hasFile false after trash');
fails('tg_requeue', /سلة درايف.*افتح التصميم وانشره من جديد/, ut, sch2.id, Date.now() + 3600000);
ok(ctx.ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'tgTick'; }), 'tgTick trigger installed by bootstrap');
// النص الطويل يُرسل رسالة منفصلة تردّ على الصورة
GAS._tg.length = 0;
const longCap = J('tg_send', ut, JSON.stringify({ program: 'academy', name: 'طويل', caption: '<b>' + 'نص '.repeat(400) + '</b>', png: Buffer.from([1]).toString('base64'), mode: 'photo' }));
ok(longCap.split && GAS._tg.length === 2 && GAS._tg[0].opt.payload.caption === '' && /sendMessage/.test(GAS._tg[1].url) && GAS._tg[1].opt.payload.reply_to_message_id === longCap.msg, 'long caption sent as reply message, photo without clipped caption');
// التكرار والتعديل وإعادة الجدولة والمصغّر
const base = Date.now();
const rep = J('tg_send', ut, JSON.stringify({ program: 'academy', track: 'ishraq', name: 'متكرر', caption: 'كل أسبوع', png: Buffer.from([1]).toString('base64'), thumb: Buffer.from([255, 216, 255]).toString('base64'), mode: 'photo', when: base + 7200000, repeat: { every: 'week', n: 1, count: 3 } }));
ok(rep.queued && rep.repeat.every === 'week' && J('tg_queue', ut, 'academy').filter(function (x) { return x.id === rep.id; })[0].hasFile, 'recurring post queued with its image');
ok(!raw(rep.id).thumbId, 'calendar thumbnails no longer stored (sent thumb ignored)');
const th = J('tg_thumbs', ut, JSON.stringify([rep.id])); ok(th && !th[rep.id], 'tg_thumbs still answers (backward compatible)');
fails('tg_update', /ليس لك/, at, JSON.stringify({ id: rep.id, when: base + 9000000 }));
fails('tg_update', /المستقبل/, ut, JSON.stringify({ id: rep.id, when: base - 1000 }));
const upd = J('tg_update', ut, JSON.stringify({ id: rep.id, when: base + 9000000, caption: 'نص معدّل', title: 'عنوان معدّل' }));
ok(upd.when === base + 9000000 && upd.caption === 'نص معدّل' && upd.title === 'عنوان معدّل' && upd.repeat.count === 3, 'queued post updated');
ctx.Date.now = function () { return base + 9000000 + 60000; }; ctx.tgTick(); ctx.Date.now = realNow;
let q2 = J('tg_queue', adm, 'academy'); const sentRep = q2.filter(function (x) { return x.id === rep.id; })[0], nextRep = q2.filter(function (x) { return x.seriesId === rep.id && x.status === 'queued'; })[0];
ok(sentRep.status === 'sent' && nextRep && nextRep.when === base + 9000000 + 7 * 864e5 && nextRep.repeat.count === 2 && nextRep.caption === 'نص معدّل', 'tick creates next weekly occurrence with decremented count');
ok((JSON.parse(call('nt_list', ut)) || []).some(function (n) { return n.kind === 'tg' && /نُشر/.test(n.text); }), 'owner notified after send');
J('tg_update', ut, JSON.stringify({ id: nextRep.id, repeat: null })); ok(!J('tg_queue', ut, 'academy').filter(function (x) { return x.id === nextRep.id; })[0].repeat, 'repeat stopped');
const rq2 = J('tg_requeue', ut, sentRep.id, base + 99999999); ok(rq2.status === 'queued' && rq2.when === base + 99999999 && rq2.title === 'عنوان معدّل', 'requeue sent post');
fails('tg_requeue', /المستقبل/, ut, sentRep.id, base - 5);
const repPng = raw(rep.id).pngId; ok(repPng && raw(nextRep.id).pngId === repPng && !trashed(repPng), 'series occurrence sent: image kept for the next occurrence');
ctx.Date.now = function () { return base + 99999999 + 60000; }; ctx.tgTick(); ctx.Date.now = realNow;
ok(raw(rq2.id).status === 'sent' && raw(nextRep.id).status === 'queued' && !trashed(repPng), 'requeued copy sent: image kept while the series still needs it');
ctx.Date.now = function () { return nextRep.when + 60000; }; ctx.tgTick(); ctx.Date.now = realNow;
ok(raw(nextRep.id).status === 'sent' && trashed(repPng) && [rep.id, nextRep.id, rq2.id].every(function (id) { return !raw(id).pngId && raw(id).filesGone; }), 'last user of the image sent: trashed, every reference cleared');
fails('tg_requeue', /افتح التصميم وانشره من جديد/, ut, rq2.id, Date.now() + 3600000);
// إرسال فوري لمنشور متكرر مرة واحدة: لا يبقى ملف معلّق
const once = J('tg_send', ut, JSON.stringify({ program: 'academy', name: 'مرة', caption: 'x', png: Buffer.from([1]).toString('base64'), mode: 'photo', repeat: { every: 'day', n: 1, count: 1 } }));
ok(!once.next && !raw(once.id).pngId && raw(once.id).filesGone, 'immediate send with no next occurrence keeps no file');
// المهام
fails('task_save', /عنوان/, ut, JSON.stringify({ program: 'academy', title: '  ' }));
const t1 = J('task_save', ut, JSON.stringify({ program: 'academy', title: 'تصميم إعلان اللقاء', due: base + 86400000, note: 'بهوية إشراق' }));
ok(t1.to === usr.acc.uid && t1.status === 'open' && t1.from === usr.acc.uid, 'personal task');
fails('task_save', /مشرف/, ut, JSON.stringify({ program: 'academy', title: 'لغيري', to: 'someone' }));
const t2 = J('task_save', adm, JSON.stringify({ program: 'academy', title: 'راجع التصميم', to: usr.acc.uid, due: base + 3 * 86400000, prio: 'high', link: '#/mine' }));
ok(t2.to === usr.acc.uid && t2.toName === usr.acc.name && t2.prio === 'high', 'supervisor assigns a task');
ok((JSON.parse(call('nt_list', ut)) || []).some(function (n) { return n.kind === 'task' && /راجع التصميم/.test(n.text); }), 'assignee notified');
const tl = J('task_list', ut, 'academy'); ok(tl.length === 2 && tl.filter(function (t) { return t.id === t2.id; })[0].canDone && !tl.filter(function (t) { return t.id === t2.id; })[0].canEdit, 'task list with permissions');
fails('task_done', /ليست لك/, at, t2.id);
ok(J('task_done', ut, t2.id, true).status === 'done', 'assignee completes task');
ok((JSON.parse(call('nt_list', adm)) || []).some(function (n) { return n.kind === 'task' && /أنجز/.test(n.text); }), 'assigner notified of completion');
fails('task_del', /ليست لك/, ut, t2.id);
call('task_del', adm, t2.id); ok(J('task_list', ut, 'academy').length === 1, 'task deleted by assigner');
// المهام المتكررة والتذكيرات (يرسلها مؤقّت tgTick نفسه)
const T0 = Date.now(), rawT = function (id) { return ctx.readJson_('tasks.json', []).filter(function (x) { return x.id === id; })[0]; };
const remindsOf = function (tok, re) { return (JSON.parse(call('nt_list', tok)) || []).filter(function (n) { return n.kind === 'remind' && re.test(n.text); }); };
const tr = J('task_save', ut, JSON.stringify({ program: 'academy', title: 'ورد يومي', due: T0 + 3 * 3600000, repeat: { every: 'day', n: 1, count: 3 }, remind: 60 }));
ok(tr.repeat.every === 'day' && tr.repeat.count === 3 && tr.remind === 60 && tr.canDone && tr.canEdit, 'task saved with repeat + reminder');
ok(J('task_save', ut, JSON.stringify({ program: 'academy', title: 'بلا موعد', repeat: { every: 'day' } })).repeat === undefined, 'repeat needs a due date');
ok(J('task_save', ut, JSON.stringify({ program: 'academy', title: 'تذكير غريب', due: T0 + 1e6, remind: 7 })).remind === undefined, 'unknown reminder value ignored');
ctx.tgTick(); ok(remindsOf(ut, /ورد يومي/).length === 0, 'no reminder before its time');
ctx.Date.now = function () { return T0 + 2 * 3600000 + 60000; }; ctx.tgTick(); ctx.tgTick(); ctx.Date.now = realNow;
const r1 = remindsOf(ut, /ورد يومي/); ok(r1.length === 1 && /تذكير/.test(r1[0].text) && r1[0].link === '#/cal?task=' + tr.id, 'reminder delivered to the bell once: ' + (r1[0] || {}).text);
ok(rawT(tr.id).remindedFor === tr.due - 3600000, 'task marked reminded for that time');
const tr2 = J('task_save', ut, JSON.stringify(Object.assign({}, tr, { due: T0 + 5 * 3600000 })));
ctx.Date.now = function () { return T0 + 4 * 3600000 + 60000; }; ctx.tgTick(); ctx.Date.now = realNow;
ok(remindsOf(ut, /ورد يومي/).length === 2, 'moving the due date re-arms the reminder');
ctx.Date.now = function () { return T0 + 9 * 3600000; }; ctx.tgTick(); ctx.Date.now = realNow;
ok(remindsOf(ut, /ورد يومي/).length === 2, 'no reminder for a time long past');
const dn = J('task_done', ut, tr.id, true);
ok(dn.status === 'done' && dn.next && dn.next.due === tr2.due + 864e5 && dn.next.repeat.count === 2 && dn.next.remind === 60 && dn.next.seriesId === tr.id && dn.next.status === 'open' && dn.next.canDone, 'completing creates the next occurrence');
J('task_done', ut, tr.id, false); const dn2 = J('task_done', ut, tr.id, true);
ok(!dn2.next && ctx.readJson_('tasks.json', []).filter(function (x) { return x.seriesId === tr.id; }).length === 1, 'reopen + redo does not duplicate the next occurrence');
const dn3 = J('task_done', ut, dn.next.id, true); ok(dn3.next && dn3.next.repeat.count === 1 && dn3.next.seriesId === tr.id, 'third occurrence (last)');
ok(!J('task_done', ut, dn3.next.id, true).next, 'series ends after count');
const late = J('task_save', ut, JSON.stringify({ program: 'academy', title: 'أسبوعي فات', due: T0 - 20 * 864e5, repeat: { every: 'week', n: 1 } }));
const ln = J('task_done', ut, late.id, true).next; ok(ln && ln.due === T0 + 864e5, 'late completion skips missed occurrences');
const un = J('task_save', ut, JSON.stringify({ program: 'academy', title: 'حتى تاريخ', due: T0 + 864e5, repeat: { every: 'day', n: 1, until: T0 + 864e5 + 3600000 } }));
ok(!J('task_done', ut, un.id, true).next, 'until date respected');
const tt = J('task_save', adm, JSON.stringify({ program: 'academy', title: 'اجتماع الفريق', to: '', due: T0 + 30 * 60000, remind: 10 }));
ctx.Date.now = function () { return T0 + 21 * 60000; }; ctx.tgTick(); ctx.Date.now = realNow;
ok(remindsOf(ut, /اجتماع الفريق/).length === 1, 'team task reminder reaches program members');
ok(ctx.ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === 'tgTick'; }).length === 1, 'reminders reuse the single tgTick trigger');
// اكتشاف القنوات
const disc = J('tg_discover', adm);
ok(disc.found === 2 && disc.list.length === 2 && disc.list.some(function (c) { return c.username === '@jeel_new' && c.type === 'channel' && c.status === 'administrator'; }), 'discovered chats from getUpdates');
const chk = J('tg_chat_check', adm, '@jeel_new'); ok(chk.canPost && chk.title === 'قناة الجيل', 'chat check reports admin with posting rights');
ok(J('tg_known', adm).length === 2 && J('bundle', adm).settings.tgKnown === 2, 'known chats persisted');
// الأحاديث: الدرر ثم الاحتياط
GAS._dorarDown = true;
const hdf = JSON.parse(call('hadith_find', ut, 'الأعمال بالنيات'));
ok(hdf.length === 1 && hdf[0].fallback && hdf[0].source === 'صحيح البخاري' && hdf[0].sahih && hdf[0].text.indexOf('إِنَّمَا الْأَعْمَالُ') === 0, 'dorar down → sunnah fallback with matn only: ' + hdf[0].text.slice(0, 30));
GAS._dorarDown = false;
ok(JSON.parse(call('hadith_find', ut, 'النيات', 'sunnah'))[0].src === 'sunnah', 'explicit sunnah source');
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
GAS._poll = 0; ok(/من الاحتياطي/.test(call('ai_make', ut, JSON.stringify({ prompt: 'p', system: 's' }))) && GAS._poll === 1, 'no keys at all: text request served by free fallback');
fails('ai_make', /Gemini/, ut, JSON.stringify({ prompt: 'p', system: 's', files: [{ mime: 'image/png', b64: 'AA' }] }));
GAS._props.GEMINI_KEY = 'k-test-AIzaSy0123456789abcdefghijklmnop';
fails('ai_make', /صلاحية/, at, JSON.stringify({ prompt: 'p', system: 's', schema: {} }));
const out = call('ai_make', ut, JSON.stringify({ prompt: 'إعلان لقاء', system: 'أنت مصمم', schema: { type: 'object' } }));
ok(JSON.parse(out).designs[0].tpl === 'ann_panel', 'ai roundtrip');
ok(GAS._lastAi.opt.headers['x-goog-api-key'] === 'k-test-AIzaSy0123456789abcdefghijklmnop' && /gemini-3\.8-flash:generateContent/.test(GAS._lastAi.url), 'ai request shape');
// مفاتيح Gemini: تناوب ونفاد الحصة
J('set_save', adm, JSON.stringify({ geminiKeys: 'k-two-AIzaSy0123456789abcdefghijklmnopq\nshort' }));
ok(J('set_get', adm).aiKeys === 2, 'second gemini key stored, short one ignored');
GAS._quota429 = 'k-test-AIzaSy0123456789abcdefghijklmnop'; GAS._aiKeys = [];
J('acc_save', adm, JSON.stringify({ uid: usr.acc.uid, perms: { ai: true, social: true, send: true } }));
GAS._props.GROQ_KEY = ''; delete GAS._props.GROQ_KEY;
const rot = call('ai_make', adm, JSON.stringify({ kind: 'review', prompt: 'p', system: 's', schema: { type: 'object' }, files: [{ mime: 'image/png', b64: 'AAAA' }] }));
ok(JSON.parse(rot).designs && GAS._aiKeys.indexOf('k-two-AIzaSy0123456789abcdefghijklmnopq') >= 0 && GAS._aiKeys.length <= 2, 'quota-exhausted key skipped, second key answered: ' + GAS._aiKeys.join(','));
GAS._aiKeys = []; call('ai_make', adm, JSON.stringify({ kind: 'review', prompt: 'p', system: 's', files: [{ mime: 'image/png', b64: 'AAAA' }] }));
ok(GAS._aiKeys.length === 1 && GAS._aiKeys[0] !== GAS._quota429, 'exhausted key remembered and not retried');
GAS._quota429 = '';
// الملاذ الأخير: كل مفاتيح Gemini نفدت وبلا Groq → Pollinations للنصوص فقط
GAS._quota429 = 'ALL'; GAS._aiKeys = [];
const pf = call('ai_make', adm, JSON.stringify({ kind: 'caption', prompt: 'p', system: 's', schema: { type: 'object' } }));
ok(JSON.parse(pf).text === 'من الاحتياطي', 'pollinations text fallback when all gemini keys exhausted'); GAS._poll = 1;
fails('ai_make', /حدّها|مشغول/, adm, JSON.stringify({ kind: 'review', prompt: 'p', system: 's', files: [{ mime: 'image/png', b64: 'AAAA' }] }));
ok(GAS._poll === 1, 'no pollinations fallback for requests with images');
GAS._quota429 = '';
ok(J('ai_status', ut).used === 2, 'ai usage counted');
J('set_save', adm, JSON.stringify({ ai: { enabled: true, model: 'gemini-3.8-flash', perDay: 1 } }));
fails('ai_make', /حد اليوم/, ut, JSON.stringify({ prompt: 'p', system: 's', schema: {} }));
// صور مجانية وآيات وأحاديث
// بلا مفتاح: Openverse
const ov = J('img_search', ut, 'mosque', 1, 'landscape');
ok(ov.provider === 'openverse' && ov.photos.length === 1 && ov.photos[0].license === 'CC BY-SA 2.0' && /aspect_ratio=wide/.test(GAS._lastOv), 'openverse search without key');
call('set_save', adm, JSON.stringify({ pexelsKey: 'PXKEY' }));
ok(J('set_get', adm).pexelsOn === true, 'pexels key saved');
const px = J('img_search', ut, 'mosque', 1, 'portrait');
ok(px.photos.length === 1 && px.photos[0].orig.indexOf('images.pexels.com') > 0 && px.photos[0].by === 'سمير', 'pexels search mapped');
fails('img_pick', /رابط غير مقبول/, ut, JSON.stringify({ orig: 'http://evil.example/x.jpg' }));
fails('img_pick', /ليس صورة|تعذّر تنزيل/, ut, JSON.stringify({ orig: 'https://evil.example/x.jpg' }));
const pick = J('img_pick', ut, JSON.stringify({ orig: px.photos[0].orig, name: 'مسجد', by: 'سمير', byUrl: px.photos[0].byUrl, url: px.photos[0].url, thumb: px.photos[0].thumb, program: 'academy', suggest: true }));
ok(pick.asset.scope === 'user' && pick.asset.kind === 'image' && pick.asset.credit.by === 'سمير' && pick.request && pick.request.status === 'new', 'picked into user library + request');
ok(JSON.parse(call('asset_list', ut, 'user')).some(function (x) { return x.id === pick.asset.id; }), 'asset listed for user');
fails('img_requests', /لمدير/, ut);
const reqs = J('img_requests', adm, 'academy'); ok(reqs.length === 1 && reqs[0].asset === pick.asset.id, 'admin sees request');
const dec = J('img_decide', adm, reqs[0].id, true); ok(dec.status === 'ok', 'request approved');
ok(JSON.parse(call('asset_list', ut, 'program', 'academy')).some(function (x) { return x.name === 'مسجد' && x.scope === 'program' && x.credit; }), 'approved image copied into program library');
call('set_save', adm, JSON.stringify({ pixabayKey: 'PBKEY', imgProvider: 'pixabay' }));
const pb = J('img_search', ut, 'mosque', 1, ''); ok(pb.provider === 'pixabay' && pb.photos[0].by === 'Nadia' && /_340/.test(pb.photos[0].thumb), 'pixabay search mapped');
const pbPick = J('img_pick', ut, JSON.stringify({ orig: pb.photos[0].orig, name: 'قبة', by: 'Nadia', url: pb.photos[0].url, program: 'academy' }));
ok(pbPick.asset.credit.src === 'Pixabay' && pbPick.asset.mime === 'image/jpeg', 'pixabay pick stored with credit');
call('set_save', adm, JSON.stringify({ imgProvider: 'pexels' }));
const adminPick = J('img_pick', adm, JSON.stringify({ orig: px.photos[0].orig, name: 'مباشر', by: 'سمير', program: 'academy' }));
ok(adminPick.asset.scope === 'program' && !adminPick.request, 'admin picks straight into program library');
const ay = J('quran_find', ut, 'الإسراء 23'); ok(ay.length === 1 && ay[0].sn === 17 && ay[0].n === 23 && /وَبِالْوَالِدَيْنِ/.test(ay[0].text), 'ayah by reference');
const ay2 = J('quran_find', ut, 'بوالديه'); ok(ay2.length === 1 && ay2[0].sn === 29, 'ayah by words');
const hd = J('hadith_find', ut, 'يحب إذا عمل'); ok(hd.length === 2 && hd[0].sahih && hd[0].grade === 'حسن' && hd[0].source === 'صحيح الجامع' && hd[0].page === '1880' && !hd[1].sahih, 'hadith parsed with grade: ' + JSON.stringify(hd[0]));
// التعليقات والإشعارات
let AT2 = null; function at2() { if (AT2) return AT2; const u2 = J('acc_save', adm, JSON.stringify({ username: 'sara', name: 'سارة', role: 'user', programs: ['academy'] })); AT2 = J('auth_login', 'sara', u2.temp).token; J('auth_password', AT2, u2.temp, 'SaraPass999'); return AT2; }
const c1 = J('cm_add', at2(), JSON.stringify({ target: 'item:item000001', text: 'تصميم جميل، لو كبّرت العنوان قليلاً' }));
ok(c1.mine && c1.name, 'comment added on shared item');
ok(J('cm_list', ut, 'item:item000001').length === 1, 'owner sees comment');
ok(J('nt_list', ut).some(function (x) { return x.kind === 'comment'; }), 'owner notified of comment');
call('item_save', ut, JSON.stringify({ id: 'item000009', kind: 'tpl', name: 'سري', shared: false, tpl: 'ann_panel', track: 'ishraq', program: 'academy', st: {} }));
fails('cm_add', /ليس مشتركاً/, at2(), JSON.stringify({ target: 'item:item000009', text: 'خاص' }));
fails('cm_list', /لست في هذا البرنامج/, at, 'tpl:ann_panel', 'academy');
J('cm_add', ut, JSON.stringify({ target: 'tpl:ann_panel', program: 'academy', text: 'قالب ممتاز للدورات' }));
ok(J('cm_counts', ut, ['tpl:ann_panel', 'item:item000001'])['tpl:ann_panel'] === 1, 'comment counts');
fails('cm_del', /صلاحية/, ut, c1.id);
call('cm_del', adm, c1.id); ok(J('cm_list', ut, 'item:item000001').length === 0, 'admin deletes comment');
call('nt_seen', ut); ok(J('nt_list', ut).every(function (x) { return x.seen; }), 'notifications seen');
// صور في الملاحظات
const png = 'data:image/png;base64,' + Buffer.from([137, 80, 78, 71, 1, 2]).toString('base64');
const fbi = J('fb_send', ut, JSON.stringify({ kind: 'idea', text: 'فكرة مع صور', imgs: [png, png] }));
ok(/^data:image\/png;base64,/.test(call('fb_shot', adm, fbi.id, 1)), 'feedback image retrievable by admin');
ok(/^data:image\/png/.test(call('fb_shot', ut, fbi.id, 0)), 'sender can see own feedback image');
// طلب مراجعة
fails('rv_request', /صورة/, ut, JSON.stringify({ program: 'academy', note: 'x' }));
const rq = J('rv_request', ut, JSON.stringify({ program: 'academy', track: 'ishraq', tpl: 'ann_panel', note: 'هل الألوان مناسبة؟', img: png, ai: { score: 72, summary: 'جيد' } }));
ok(J('rv_mine', ut)[0].status === 'new', 'review requested');
fails('rv_list', /لمدير/, ut);
ok(J('rv_list', adm, 'new').some(function (x) { return x.id === rq.id && x.ai.score === 72; }), 'admin sees review request');
ok(/^data:image\/png/.test(call('rv_img', adm, rq.id)), 'admin loads review image');
J('rv_reply', adm, rq.id, JSON.stringify({ score: 8, notes: 'التسلسل واضح، خفّف عدد الألوان', points: ['كبّر العنوان', 'وحّد المحاذاة'] }));
const mineRv = J('rv_mine', ut)[0]; ok(mineRv.status === 'done' && mineRv.reply.score === 8 && mineRv.reply.points.length === 2, 'reply delivered');
ok(J('nt_list', ut).some(function (x) { return x.kind === 'review' && !x.seen; }), 'review notification');
// أسبوعك في أثر
call('stat_track', ut, JSON.stringify([{ e: 'export', p: 'academy', tpl: 'ann_panel' }, { e: 'export', p: 'academy' }, { e: 'tool', p: 'academy', tool: 'qr' }]));
const wk = J('me_week', ut); ok(wk.live.exports >= 2 && wk.live.topTools.indexOf('qr') >= 0 && wk.hist.length >= 5, 'live week numbers: ' + JSON.stringify(wk.live));
ok(wk.me && typeof wk.me.msg === 'string' && wk.me.msg.length > 10, 'weekly message (local)');
ok(ctx.weeklyUserStats() >= 0, 'weekly trigger runs');
ok(J('wk_admin', adm).week !== undefined, 'admin weekly view');
// مهارات المساعد
const sk = J('ai_skills', adm); ok(sk.length >= 6 && sk.some(function (x) { return x.id === 'design-eye' && x.builtin; }), 'default skills');
fails('ai_skill_save', /للمدير العام/, sp, JSON.stringify({ name: 'x', text: 'y' }));
const nsk = J('ai_skill_save', adm, JSON.stringify({ name: 'هوية عالم', kinds: ['design'], text: 'برنامج عالم يفضّل الأزرق الهادئ.' }));
call('ai_skill_save', adm, JSON.stringify({ id: 'coach', name: 'المدرّب', kinds: ['week'], text: 'نص معدّل', on: false }));
ok(J('ai_skills', adm).some(function (x) { return x.id === nsk.id && !x.builtin; }) && J('ai_skills', adm).some(function (x) { return x.id === 'coach' && x.edited && x.on === false; }), 'skills edited and added');
call('ai_skill_reset', adm, 'coach'); ok(J('ai_skills', adm).some(function (x) { return x.id === 'coach' && !x.edited; }), 'skill reset');
call('ai_make', adm, JSON.stringify({ kind: 'design', prompt: 'p', system: 'أنت مصمم', schema: { type: 'object' } }));
const sys = JSON.parse(GAS._lastAi.opt.payload).systemInstruction.parts[0].text;
ok(/مهارة: عين المصمّم/.test(sys) && /هوية عالم/.test(sys) && /الضوابط/.test(sys) && !/المدرّب/.test(sys), 'skills injected by kind');
// ازدحام جوجل: إعادة المحاولة ثم النموذج الاحتياطي
GAS._busy = 'gemini-3.8-flash';
const fb = call('ai_make', adm, JSON.stringify({ kind: 'design', prompt: 'p', system: 's', schema: { type: 'object' } }));
ok(JSON.parse(fb).designs && GAS._lastAi.url.indexOf('gemini-3.6-flash') >= 0, 'falls back to second model on 503');
GAS._busy = 'gemini-3';
const pfBusy = call('ai_make', adm, JSON.stringify({ kind: 'design', prompt: 'p', system: 's' }));
ok(/من الاحتياطي/.test(pfBusy), 'all google models busy → pollinations text fallback');
const prevAi = J('set_get', adm).ai; call('set_save', adm, JSON.stringify({ ai: Object.assign({}, prevAi, { pollFallback: false }) }));
fails('ai_make', /مزدحمة/, adm, JSON.stringify({ kind: 'design', prompt: 'p', system: 's' }));
call('set_save', adm, JSON.stringify({ ai: Object.assign({}, prevAi, { pollFallback: true }) }));
GAS._busy = null;
// Groq للمهام النصية
call('set_save', adm, JSON.stringify({ groqKey: 'gsk_test' }));
ok(J('set_get', adm).groqOn === true, 'groq key saved');
GAS._lastGroq = null; const gq = call('ai_make', adm, JSON.stringify({ kind: 'caption', prompt: 'p', system: 's', schema: { type: 'OBJECT', properties: { text: { type: 'STRING' } } } }));
ok(JSON.parse(gq).text === 'من Groq' && JSON.parse(GAS._lastGroq.opt.payload).response_format.json_schema.schema.properties.text.type === 'string', 'caption routed to groq with converted schema');
GAS._lastGroq = null; call('ai_make', adm, JSON.stringify({ kind: 'review', prompt: 'p', system: 's', files: [{ mime: 'image/png', b64: 'AAAA' }] }));
ok(!GAS._lastGroq, 'vision task stays on gemini');
GAS._groqDown = true; GAS._lastAi = null; call('ai_make', adm, JSON.stringify({ kind: 'intake', prompt: 'p', system: 's' })); ok(!!GAS._lastAi, 'groq failure falls back to gemini'); GAS._groqDown = false;
GAS._busy = 'gemini-3'; ok(call('ai_make', adm, JSON.stringify({ kind: 'design', prompt: 'p', system: 's' })) === 'نص من Groq', 'gemini quota exhausted → groq for text'); GAS._busy = null;
call('set_save', adm, JSON.stringify({ ai: { enabled: true, perDay: 30, route: { caption: 'gemini' } } }));
GAS._lastGroq = null; call('ai_make', adm, JSON.stringify({ kind: 'caption', prompt: 'p', system: 's' })); ok(!GAS._lastGroq, 'route override to gemini');
call('set_save', adm, JSON.stringify({ groqKey: '' }));
call('ai_make', adm, JSON.stringify({ kind: 'caption', prompt: 'p', system: 's' }));
ok(GAS._lastAi.url.indexOf('gemini-3.5-flash-lite') >= 0, 'light tasks use the high-quota model');
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
