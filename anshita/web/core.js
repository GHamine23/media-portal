'use strict';
/* ============================================================
   منصة الأنشطة التربوية — الواجهة (نواة: الأدوات، الاتصال، الحالة، الإطار)
   ============================================================ */
document.documentElement.dir = 'rtl'; document.documentElement.lang = 'ar';
const CFG = window.CONFIG || {};
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LOGOS = window.LOGOS || {};

/* ---------- الأيقونات ---------- */
const IC = {
  home: 'M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z',
  table: 'M3.5 5.5h17v13h-17zM3.5 10h17M3.5 14.5h17M9 5.5v13',
  cal: 'M4 6.5h16v13.5H4zM4 10.5h16M8.5 3.5v4M15.5 3.5v4',
  gcal: 'M4 6.5h16v13.5H4zM4 10.5h16M8.5 3.5v4M15.5 3.5v4M9 15l2 2 4-4',
  tl: 'M4 7h9M4 12h14M4 17h6M17 4v6M20 14v6',
  bot: 'M12 4v3M7 8h10a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3zM9.5 13h.01M14.5 13h.01M2 13v2M22 13v2',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.5a6.5 6.5 0 0 1 3.5 5.5',
  key: 'M14.5 9.5a4.5 4.5 0 1 0-4 4.47V20h3v-2h2v-2h2l1.5-1.5-1.38-1.38A4.48 4.48 0 0 0 14.5 9.5zM14 8h.01',
  plus: 'M12 5v14M5 12h14', search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.8-4.8',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4',
  moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z',
  check: 'm5 12.5 4.5 4.5L19 7.5', x: 'M6 6l12 12M18 6 6 18', dots: 'M5 12h.01M12 12h.01M19 12h.01',
  back: 'm9 6 6 6-6 6', fwd: 'm15 6-6 6 6 6',
  out: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10', clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13', link: 'M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3', unlock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 6.8-1.2',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0', eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  edit: 'M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19zM14 7l3 3', send: 'M21 3 10 14M21 3l-7 18-4-7-7-4z', refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  alert: 'M12 4 2.5 20h19zM12 10v4.5M12 17.5h.01', copy: 'M8 8h12v12H8zM16 8V4H4v12h4', ext: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5', repeat: 'm17 2 4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3', video: 'M3.5 7h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM15.5 10.5l5-3v9l-5-3', live: 'M12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM8.6 15.4a4.8 4.8 0 0 1 0-6.8M15.4 8.6a4.8 4.8 0 0 1 0 6.8M5.8 18.2a8.8 8.8 0 0 1 0-12.4M18.2 5.8a8.8 8.8 0 0 1 0 12.4', down: 'm6 9 6 6 6-6', sheet: 'M5 3.5h10l4 4v13H5zM15 3.5v4h4M8.5 12h7M8.5 15.5h7',
  menu: 'M4 7h16M4 12h16M4 17h16', target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01'
};
const svg = (k, sw = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IC[k] || k}"/></svg>`;
const TYPES = {
  'لقاء': ['M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H10l-4 3v-3H5A1.5 1.5 0 0 1 3.5 15V8A1.5 1.5 0 0 1 5 6.5z', 'var(--ty-meet)'],
  'كتابي': ['M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19zM14 7l3 3', 'var(--ty-write)'],
  'المجموعة التفاعلية': ['M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.5a6.5 6.5 0 0 1 3.5 5.5', 'var(--ty-group)'],
  'مسابقة': ['M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6', 'var(--ty-comp)'],
  'كاهوت': ['M13 3 5 13.5h6L10 21l8-10.5h-6z', 'var(--ty-kahoot)'],
  'تحدٍّ': ['M5 21V4M5 4h11l-2 4 2 4H5', 'var(--ty-chal)'],
  'استضافة': ['M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4', 'var(--ty-host)'],
  'أخرى': ['M6 12h.01M12 12h.01M18 12h.01', 'var(--ty-other)']
};
const TYPE_NAMES = Object.keys(TYPES);
const typeOf = t => TYPES[t] || TYPES['أخرى'];
const tile = (type, cls = '') => { const t = typeOf(type); return `<span class="tile ${cls}" style="--tc:${t[1]}">${svg(t[0])}</span>`; };

/* ---------- التاريخ ---------- */
const DAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const ORD = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر'];
const pad = n => String(n).padStart(2, '0');
const isoOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
let TODAY = isoOf(new Date());
const U = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const fromU = t => new Date(t).toISOString().slice(0, 10);
const add = (s, n) => fromU(U(s) + n * 864e5);
const add0 = (t, m) => { const v = Math.max(0, (+t.slice(0, 2)) * 60 + (+t.slice(3, 5)) + m); return pad(Math.floor(v / 60)) + ':' + pad(v % 60); };   // إزاحة وقت بالدقائق
const wd = s => (new Date(U(s)).getUTCDay() + 1) % 7;       // ٠ = السبت
const dnum = s => +s.slice(8, 10);
const mon = s => MONTHS[+s.slice(5, 7) - 1];
const gShort = s => `${dnum(s)} ${mon(s)}`;
const gDay = s => `${DAYS[wd(s)]} ${dnum(s)} ${mon(s)}`;
const gLong = s => `${DAYS[wd(s)]} ${dnum(s)} ${mon(s)} ${s.slice(0, 4)}`;
const diffD = (a, b) => Math.round((U(a) - U(b)) / 864e5);
const wkStart = s => add(s, -wd(s));
const monStart = s => s.slice(0, 8) + '01';
const addMon = (s, n) => { const y = +s.slice(0, 4), m = +s.slice(5, 7) - 1 + n; const d = new Date(Date.UTC(y, m, 1)); return d.toISOString().slice(0, 10); };
let HJF = null; try { HJF = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) {}
const HIJ = {};   // التاريخ ← الهجري كما في جدول الفصل
const hijri = s => HIJ[s] || (HJF ? HJF.format(new Date(U(s))).replace(/\s*هـ$/, '') : '');
const hShort = s => { const h = hijri(s); return h.replace(/\s*\d{4}$/, ''); };
function rel(s) {
  const d = diffD(s, TODAY);
  if (d === 0) return 'اليوم'; if (d === 1) return 'غدًا'; if (d === -1) return 'أمس';
  if (d === 2) return 'بعد يومين'; if (d === -2) return 'قبل يومين';
  if (d > 2 && d < 11) return `بعد ${d} أيام`; if (d >= 11) return `بعد ${d} يومًا`;
  if (d < -2 && d > -11) return `قبل ${-d} أيام`; return `قبل ${-d} يومًا`;
}
function ago(ms) {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return 'الآن'; if (m < 60) return m === 1 ? 'قبل دقيقة' : m === 2 ? 'قبل دقيقتين' : m <= 10 ? `قبل ${m} دقائق` : `قبل ${m} دقيقة`;
  const h = Math.round(m / 60); if (h < 24) return h === 1 ? 'قبل ساعة' : h === 2 ? 'قبل ساعتين' : h <= 10 ? `قبل ${h} ساعات` : `قبل ${h} ساعة`;
  const d = Math.round(h / 24); return d === 1 ? 'أمس' : d === 2 ? 'قبل يومين' : d <= 10 ? `قبل ${d} أيام` : `قبل ${d} يومًا`;
}
const timeText = t => t ? t.slice(0, 5) : '';   // نظام ٢٤ ساعة (21:00)
const TIMES = (() => { const a = ['']; for (let h = 6; h <= 23; h++) { a.push(pad(h) + ':00'); a.push(pad(h) + ':30'); } return a; })();
function countAr(n, f) { // f = [مفرد، مثنى، جمع، تمييز]
  if (n === 0) return 'لا ' + f[2]; if (n === 1) return f[0] + ' واحد'; if (n === 2) return f[1];
  return n <= 10 ? `${n} ${f[2]}` : `${n} ${f[3]}`;
}
const nActs = n => countAr(n, ['نشاط', 'نشاطان', 'أنشطة', 'نشاطًا']);
const normAr = s => String(s || '').replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').toLowerCase();

/* ---------- التخزين المحلي ---------- */
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const NS = CFG.demo ? 'anshita-demo.' : 'anshita.';
const P = Object.assign({ theme: 'light', tl: { range: 'week', anchor: '', tracks: [] }, sem: {}, tbl: { hideEmpty: false, ax: '' }, cal: { track: '', status: 'all', range: 'upcoming', meet: false } }, LS.get(NS + 'prefs', {}));
const savePrefs = () => LS.set(NS + 'prefs', P);

/* ---------- الاتصال بالخادم ---------- */
let TOKEN = LS.get(NS + 'tok', '');
// ما يقرأ فقط لا يُظهر شريط التنفيذ (التحديث الدوري وأمثاله)
const READ_FNS = new Set(['revs', 'plan', 'boot', 'log_list', 'alerts', 'tg_status', 'report_list', 'acc_list', 'cal_list', 'me', 'cards_todo', 'card_put']);   // card_put في الخلفية بلا شريط
const NET = { n: 0 };
function netBar() { document.documentElement.classList.toggle('net-busy', NET.n > 0); }
const API = {
  async call(fn, ...args) {
    const w = !READ_FNS.has(fn); if (w) { NET.n++; netBar(); }
    try { return await API.raw(fn, ...args); } finally { if (w) { NET.n--; netBar(); } }
  },
  async raw(fn, ...args) {
    let j;
    if (CFG.demo) j = await window.DEMO.call(fn, args);
    else {
      if (!CFG.api) throw new Error('لم يُضبط عنوان الخادم');
      let r;
      try { r = await fetch(CFG.api, { method: 'POST', body: JSON.stringify({ fn, args }), redirect: 'follow', credentials: 'omit' }); }
      catch (e) { const er = new Error('تعذّر الاتصال بالخادم. تحقق من الإنترنت'); er.net = true; throw er; }
      if (!r.ok) throw new Error('تعذّر الاتصال بالخادم (' + r.status + ')');
      j = await r.json();
    }
    if (j.error) { const e = new Error(j.error); e.code = j.code; throw e; }
    let v = j.result; if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) {} }
    return v;
  },
  me(fn, ...a) { return API.call(fn, TOKEN, ...a); }
};

/* ---------- الحالة ---------- */
let D = null;          // ما يعيده boot: me، tracks، plans، revs، log، settings…
const isAdmin = () => D && D.me.role === 'admin';
const myTrack = () => D && D.me.role === 'team' ? D.me.track : null;
const T = id => D.tracks.find(t => t.id === id);
const planOf = id => D.plans[id] || (D.plans[id] = { sems: {}, acts: [], rev: 0 });
const semN = id => { const r = route(); return String((r.name === 't' && r.a === id && /^\d+$/.test(r.b) && r.b) || (T(id) && T(id).cur) || 1); };
// أقسام صفحة المسار: الخطة (الجدول والتخطيط)، المهام والمطلوبات، متابعة التنفيذ، التقرير
const T_SECS = [['plan', 'الخطة', 'table', 'الخطة'], ['tasks', 'المهام والمطلوبات', 'check', 'المهام'], ['follow', 'متابعة التنفيذ', 'target', 'المتابعة'], ['report', 'التقرير', 'sheet', 'التقرير']];
const secsOn = () => true;   // اعتمدها أمين للجميع (٢٩ أكتوبر)
const tSec = () => { const r = route(); if (r.name !== 't' || !secsOn()) return 'plan'; const s = /^\d+$/.test(r.b) ? r.c : r.b; return T_SECS.some(x => x[0] === s) ? s : 'plan'; };
const tHref = (id, n, sec) => `#t/${id}/${n}${sec && sec !== 'plan' ? '/' + sec : ''}`;
const curN = id => String((T(id) && T(id).cur) || 1);
const semOf = (id, n) => planOf(id).sems[String(n)];
const daysOf = (id, n) => (semOf(id, n || curN(id)) || {}).days || [];
const dayOf = (id, n, d) => daysOf(id, n).find(x => x.d === d);
const actsOf = (id, n) => planOf(id).acts.filter(a => n == null || a.sem === String(n));
const allActs = () => D.tracks.flatMap(t => planOf(t.id).acts.map(a => Object.assign(a, { t: t.id })));
const canEdit = id => isAdmin() || !!(T(id) && T(id).canEdit);
const canAdjust = id => isAdmin() || myTrack() === id;   // تعديل نشاط قائم (الموعد، القائم، التفاصيل) — يصل الإدارةَ تنبيه به

/* ---------- لقاءات اليوم: البث المباشر في الجدول + أنشطة اللقاء ---------- */
const MEET_T = ['لقاء', 'استضافة'];
const isLive = d => !!d && /بث/.test((d.r || '') + ' ' + (d.ev || ''));
function dayMeets(tid, d, skipId) {
  const x = dayOf(tid, semFor(tid, d) || curN(tid), d), L = [];
  if (isLive(x)) L.push('البث المباشر');
  actsOf(tid).filter(a => a.d === d && MEET_T.includes(a.type) && a.id !== skipId).forEach(a => L.push(qt(a.title)));
  return L;
}
const clashText = L => (L.length === 2 ? 'لقاءان في يوم واحد: ' : L.length + ' لقاءات في يوم واحد: ') + L.join(' و');
function clashOf(tid, a) { if (!MEET_T.includes(a.type)) return ''; const L = dayMeets(tid, a.d); return L.length >= 2 ? clashText(L) : ''; }
// أقرب أيام دراسة بلا بث ولا لقاء
function freeDays(tid, d, skipId, n = 3) {
  const out = [];
  for (const k of [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6]) {
    const x = add(d, k); if (x < TODAY) continue;
    const day = dayOf(tid, semFor(tid, x) || curN(tid), x); if (!day || !day.c || dayMeets(tid, x, skipId).length) continue;
    out.push(x); if (out.length >= n) break;
  }
  return out.sort();
}
/* ---------- اقتراح كاهوت مراجعة قبل الاختبار بأسبوع ---------- */
function kahootSugs(tid) {
  const S = semOf(tid, curN(tid)); if (!S) return [];
  return S.days.filter(x => x.ev && /اختبار/.test(x.ev) && x.d > TODAY).map(x => {
    if (actsOf(tid).some(a => a.type === 'كاهوت' && a.d >= add(x.d, -12) && a.d <= x.d)) return null;
    let best = null;
    for (const k of [7, 6, 8, 5, 9, 4, 10, 3, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]) { const c = add(x.d, -k); if (c < TODAY) continue; const day = dayOf(tid, curN(tid), c); if (day && day.c && !dayMeets(tid, c).length) { best = c; break; } }
    if (!best && add(x.d, -7) >= TODAY) best = add(x.d, -7);
    return best ? { exam: x.ev, ed: x.d, d: best, left: diffD(x.d, TODAY), title: 'كاهوت مراجعة قبل ' + x.ev } : null;
  }).filter(Boolean);
}
/* ---------- لوحة النشاط الثابتة في صفحة المسار (الشاشات العريضة) ---------- */
const WIDE_Q = 1240;
const dockOn = tid => !!tid && route().name === 't' && route().a === tid && tSec() === 'plan' && innerWidth >= WIDE_Q;
const tcol = id => (T(id) && T(id).color) || '#888';
const sortA = (x, y) => x.d < y.d ? -1 : x.d > y.d ? 1 : (x.time || '99').localeCompare(y.time || '99');
const members = id => (T(id) && T(id).members) || [];
const remindable = a => a.rem === true || (a.rem !== false && (D.remindTypes || ['لقاء', 'استضافة']).includes(a.type));
// إعداد التذكير لكل نشاط (يطابق الخادم): des يحتاج تصميم إعلان، d2 قبله بيومين، d1 قبله بيوم، d0 يوم الموعد
const DESIGN_T = ['لقاء', 'استضافة', 'مسابقة', 'تحدٍّ'];
const remCfg = x => { const r = x.rp || {}; return { des: 'des' in r ? r.des : DESIGN_T.includes(x.type), d2: !!r.d2, d1: 'd1' in r ? r.d1 : true, d0: 'd0' in r ? r.d0 : true }; };
function remPlan(x) {
  const c = remCfg(x), L = [];
  if (c.des) L.push({ k: 'd3', l: 'تصميم الإعلان', d: add(x.d, -3) });
  if (c.d2) L.push({ k: 'd2', l: c.des ? 'إتمام التصميم' : 'تذكير', d: add(x.d, -2) });
  if (c.d1) L.push({ k: 'd1', l: c.des ? 'نشر الإعلان' : 'تذكير', d: add(x.d, -1) });
  if (c.d0) L.push({ k: 'd0', l: x.time ? 'قبل الموعد بساعة' : 'يوم الموعد', d: x.d });
  return L;
}
const isLate = a => !a.done && a.d < TODAY;
// الأحداث الممتدة في الجدول (اختبار، إجازة، استدراك…): نوعها ولونها، وبداية كل امتداد وطوله
function spanKind(d) { const s = d ? (d.ev || '') + ' ' + (d.p || '') : ''; if (/إجازة|عطلة/.test(s)) return 'hol'; if (/اختبار/.test(s)) return 'exam'; if (/استدراك|مراجعة/.test(s)) return 'rev'; return s.trim() ? 'oth' : ''; }
const spanLabel = d => (d.ev && !/إجازة/.test(d.p || '') ? d.ev : d.p || d.ev || '');
function spanInfo(days, i) {
  const d = days[i], k = spanKind(d); if (!k) return null;
  const lb = spanLabel(d), same = x => x && spanKind(x) === k && spanLabel(x) === lb;
  if (same(days[i - 1])) return { k, lb, start: false };
  let n = 1; while (same(days[i + n])) n++;
  return { k, lb, start: true, n, to: days[i + n - 1].d };
}
// أسابيع الاختبار (السبت إلى الجمعة) في فصل المسار
const examWeeks = (id, n) => new Set(daysOf(id, n).filter(x => /اختبار/.test(x.ev || '') && !/إجازة/.test((x.ev || '') + (x.p || ''))).map(x => wkStart(x.d)));
function semRange(id, n) { const ds = daysOf(id, n); return ds.length ? { from: ds[0].d, to: ds[ds.length - 1].d } : null; }
function semFor(id, d) { const sems = planOf(id).sems; for (const k in sems) { const s = sems[k]; if (s.start <= d && d <= s.end) return k; } return null; }
function weeksOf(days) {
  const m = new Map();
  for (const d of days) { if (!m.has(d.w)) m.set(d.w, []); m.get(d.w).push(d); }
  return [...m.entries()].map(([w, ds]) => ({ w, days: ds, from: ds[0].d, to: ds[ds.length - 1].d, study: ds.some(x => x.c), exam: ds.find(x => x.ev && /اختبار/.test(x.ev)), per: ds.find(x => x.p) }));
}
function nowWeek(id) { const ds = daysOf(id); const x = ds.find(d => d.d === TODAY); if (x) return x.w; if (!ds.length) return 0; if (TODAY < ds[0].d) return 0; return 99; }
function indexHijri() { for (const t of D.tracks) for (const k in planOf(t.id).sems) for (const d of planOf(t.id).sems[k].days) if (d.h) HIJ[d.d] = d.h; }
const semLabel = n => 'الفصل ' + (ORD[+n] || n);

/* ---------- السمة ---------- */
function applyTheme() { document.documentElement.dataset.theme = P.theme === 'dark' ? 'dark' : 'light'; }
function toggleTheme() { P.theme = P.theme === 'dark' ? 'light' : 'dark'; savePrefs(); applyTheme(); render(); }

/* ---------- الخطوط: ثمانية من خادم المنصة أو من خادم «أثر»، وتُحفظ في المتصفح ---------- */
const FONT_NEED = { 'thm-display': ['500', '700'], 'thm-text': ['400', '500', '700'], 'thm-sans': ['400', '500', '700'] };
const IDB = {
  db: null,
  open() { if (this.db) return this.db; this.db = new Promise((ok, no) => { try { const r = indexedDB.open('anshita', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); } catch (e) { no(e); } }); return this.db; },
  async get(k) { try { const db = await this.open(); return await new Promise(ok => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => ok(q.result); q.onerror = () => ok(null); }); } catch (e) { return null; } },
  async put(k, v) { try { const db = await this.open(); db.transaction('kv', 'readwrite').objectStore('kv').put(v, k); } catch (e) {} }
};
function b64ToBlob(b64, mime) { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: mime }); }
async function loadFonts() {
  const want = f => FONT_NEED[f.family] && FONT_NEED[f.family].includes(String(f.weight));
  if (CFG.fonts) {   // نسخة التجربة: الخطوط مضمّنة كما هي
    await Promise.all(CFG.fonts.map(f => new FontFace(f.family, `url(${f.url})`, { weight: f.weight, display: 'swap' }).load().then(ff => document.fonts.add(ff)).catch(() => {})));
    return;
  }
  const srcs = [CFG.api, CFG.fontApi].filter(Boolean);
  for (const src of srcs) {
    const call = async (fn, ...args) => { const r = await fetch(src, { method: 'POST', body: JSON.stringify({ fn, args }), redirect: 'follow', credentials: 'omit' }); const j = await r.json(); if (j.error) throw new Error(j.error); let v = j.result; try { v = JSON.parse(v); } catch (e) {} return v; };
    let list = LS.get(NS + 'fonts:' + src, null);
    if (!list) { try { list = (await call('ui_fonts')).filter(want); LS.set(NS + 'fonts:' + src, list); } catch (e) { list = []; } }
    if (!list.length) continue;
    await Promise.all(list.map(async f => {
      const key = 'font:' + src + ':' + f.id + ':' + (f.ver || 1);
      let blob = await IDB.get(key);
      if (!blob) { try { blob = b64ToBlob(await call('ui_font_get', f.id), 'font/otf'); IDB.put(key, blob); } catch (e) { return; } }
      try { const ff = new FontFace(f.family, `url(${URL.createObjectURL(blob)})`, { weight: String(f.weight), display: 'swap' }); await ff.load(); document.fonts.add(ff); } catch (e) {}
    }));
    return;
  }
}

/* ---------- الإشعارات والتلميحات ---------- */
function toast(msg, kind, undo) {
  const box = $('#toasts'), el = document.createElement('div');
  el.className = 'toast' + (kind === 'err' ? ' err' : ''); el.setAttribute('role', 'status');
  el.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button type="button">تراجع</button>' : ''}`;
  if (undo) el.querySelector('button').onclick = () => { el.remove(); undo(); };
  box.appendChild(el);
  setTimeout(() => el.remove(), undo ? 6500 : kind === 'err' ? 6000 : 3200);
  while (box.children.length > 3) box.firstChild.remove();
}
function announce(m) { const l = $('#live'); if (l) { l.textContent = ''; setTimeout(() => l.textContent = m, 30); } }
let tipEl = null;
document.addEventListener('pointerover', e => {
  const t = e.target.closest('[data-tip]');
  if (!t) { if (tipEl) { tipEl.remove(); tipEl = null; } return; }
  if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'tip'; document.body.appendChild(tipEl); }
  tipEl.textContent = t.dataset.tip;
  const r = t.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  tipEl.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
  tipEl.style.top = (r.top - h - 8 < 8 ? r.bottom + 8 : r.top - h - 8) + 'px';
});
document.addEventListener('scroll', () => { if (tipEl) { tipEl.remove(); tipEl = null; } }, true);

/* ---------- حالة المزامنة ---------- */
let SYNC = { st: 'ok', at: Date.now() };
function setSync(st, label) { SYNC.st = st; SYNC.label = st === 'busy' ? (label || '') : ''; if (st === 'ok') SYNC.at = Date.now(); const el = $$('.sync'); el.forEach(x => { x.className = 'sync ' + (st === 'busy' ? 'busy' : st === 'off' ? 'off' : ''); x.querySelector('span').textContent = syncText(); }); }
const syncText = () => SYNC.st === 'busy' ? (SYNC.label ? 'يحفظ: ' + (SYNC.label.length > 28 ? SYNC.label.slice(0, 27) + '…' : SYNC.label) : 'يحفظ…') : SYNC.st === 'off' ? 'غير متصل — سيُعاد المحاولة' : 'محدّث ' + ago(SYNC.at);

/* ---------- التنقل ---------- */
function route() {
  const h = (location.hash || '').slice(1);
  const p = h.split('/').filter(Boolean).map(decodeURIComponent);
  return { name: p[0] || 'home', a: p[1] || '', b: p[2] || '', c: p[3] || '' };
}
function go(h) { if (location.hash === '#' + h) render(); else location.hash = h; }
addEventListener('hashchange', () => { closeLayer(); if (F && F.dock) F = null; if (route().name !== 'bot') { BS = null; BS_LOAD = false; } if (P.tl && P.tl.tmp && route().name !== 'timeline') { P.tl.tracks = []; P.tl.tmp = false; savePrefs(); } render(); window.scrollTo(0, 0); });

/* ---------- الإطار ---------- */
const logoImg = (id, cls = '') => LOGOS[id] ? `<img class="${cls}" src="${LOGOS[id]}" alt="" loading="lazy">` : `<span class="av" style="background:${tcol(id)}">${esc((T(id) || {}).name ? T(id).name[0] : '؟')}</span>`;
function initials(name) {   // الحرف الأول، وحرفان إن بدأ الاسم بألف (تشتبه الألف المفردة بعلامة تعجب)
  const w = String(name || '؟').replace(/^(فريق|أبو|أ\.)\s+/, '').replace(/^ال(?=\S{2})/, '').trim();
  return /^[اأإآ]/.test(w) ? w.slice(0, 2) : w.charAt(0);
}
const avatar = (name, color, cls = '') => `<span class="av ${cls}" style="background:${color || 'var(--ink2)'}">${esc(initials(name))}</span>`;
const adminAv = () => `<span class="adm" aria-hidden="true"><i style="background:#e1642b"></i><i style="background:#b6293e"></i><i style="background:#4c2e5f"></i><i style="background:#3c7e79"></i></span>`;
function weekStat(id, from, to) { return actsOf(id).filter(a => a.d >= from && a.d <= to); }
function navItems() {
  const r = route(), cur = (n, a) => r.name === n && (a == null || r.a === a) ? ' aria-current="page"' : '';
  const ws = typeof focusWeek === 'function' ? focusWeek() : wkStart(TODAY), we = add(ws, 6);
  if (isAdmin()) {
    const changed = allActs().filter(a => a.cal && a.cal.err).length;
    const unl = D.bot ? D.tracks.filter(t => !t.linked).length : 0;
    const reqs = D.tracks.filter(t => t.editReq).length;
    return `<a class="nl" href="#home"${cur('home')}>${svg('home')}الرئيسية${reqs ? `<span class="badge">${reqs}</span>` : ''}</a>
      <a class="nl" href="#alerts"${cur('alerts')}>${svg('bell')}تغييرات الفرق${D.unseen ? `<span class="badge">${D.unseen}</span>` : ''}</a>
      <a class="nl" href="#timeline"${cur('timeline')}>${svg('tl')}المنظور الزمني</a>
      <a class="nl" href="#reports"${cur('reports')}>${svg('sheet')}التقارير الأسبوعية</a>
      <div class="nav-h">المسارات</div>
      ${D.tracks.map(t => { const n = weekStat(t.id, ws, we).length; return `<a class="nl" href="#t/${t.id}"${r.name === 't' && r.a === t.id || r.name === 'team' && r.a === t.id ? ' aria-current="page"' : ''}><i class="dot" style="background:${t.color}"></i>${esc(t.name)}<span class="cnt" data-tip="أنشطة هذا الأسبوع">${n || ''}</span></a>`; }).join('')}
      <div class="nav-h">الربط</div>
      <a class="nl" href="#calendar"${cur('calendar')}>${svg('gcal')}تقويم جوجل${changed ? `<span class="badge">${changed}</span>` : ''}</a>
      <a class="nl" href="#bot"${cur('bot')}>${svg('bot')}بوت التذكيرات${!D.bot ? '<span class="badge soft">!</span>' : unl ? `<span class="badge soft">${unl}</span>` : ''}</a>
      <a class="nl" href="#accounts"${cur('accounts')}>${svg('key')}الحسابات</a>`;
  }
  const id = myTrack();
  return `<a class="nl" href="#home"${cur('home')}>${svg('home')}الرئيسية</a>
    <a class="nl" href="#t/${id}"${cur('t')}>${svg('table')}خطة الفصل</a>
    <a class="nl" href="#timeline"${cur('timeline')}>${svg('tl')}المنظور الزمني</a>`;
}
// العدد مع المعدود
const nWeeks = n => n === 1 ? 'أسبوع واحد' : n === 2 ? 'أسبوعان' : n >= 3 && n <= 10 ? n + ' أسابيع' : n + ' أسبوعًا';
const nStudy = n => !n ? 'لا أيام دراسة' : n === 1 ? 'يوم دراسة واحد' : n === 2 ? 'يوما دراسة' : n <= 10 ? n + ' أيام دراسة' : n + ' يوم دراسة';
const qt = t => /[«»]/.test(t) ? t : '«' + t + '»';
// زر الإضافة العائم في الجوال
function fabHtml(r) {
  if (!['home', 't', 'timeline'].includes(r.name)) return '';
  const tid = r.name === 't' ? r.a : isAdmin() ? '' : myTrack();
  if (tid ? !canEdit(tid) : !isAdmin()) return '';
  return `<button class="fab" type="button" data-act="newact" ${tid ? `data-track="${tid}"` : ''} aria-label="نشاط جديد">${svg('plus', 2.2)}</button>`;
}
const MORE_R = ['calendar', 'bot', 'accounts', 'reports', 'alerts'];
function shell(body) {
  const me = D.me, r = route();
  const tab = (h, ic, label, on) => `<a href="#${h}"${on ? ' aria-current="page"' : ''}>${svg(ic)}<span>${label}</span></a>`;
  const tabs = isAdmin()
    ? tab('home', 'home', 'الرئيسية', r.name === 'home') + tab('tracks', 'table', 'المسارات', r.name === 't' || r.name === 'tracks' || r.name === 'team') + tab('timeline', 'tl', 'الزمني', r.name === 'timeline') + `<button type="button" data-act="more"${MORE_R.includes(r.name) ? ' aria-current="page"' : ''}>${svg('menu')}<span>المزيد</span></button>`
    : tab('home', 'home', 'الرئيسية', r.name === 'home') + tab('t/' + myTrack(), 'table', 'الخطة', r.name === 't') + tab('timeline', 'tl', 'الزمني', r.name === 'timeline') + `<button type="button" data-act="more">${svg('menu')}<span>المزيد</span></button>`;
  return `<div class="app">
  <aside class="side" aria-label="التنقل">
    <a class="brand" href="#home" aria-label="الرئيسية">${LOGOS.anshita ? `<img class="brand-img" src="${LOGOS.anshita}" alt="الأنشطة التربوية">` : '<b>الأنشطة التربوية</b>'}</a>
    <button class="find" type="button" data-act="cmd">${svg('search')}بحث وانتقال<kbd>Ctrl K</kbd></button>
    <nav class="col" style="gap:2px">${navItems()}</nav>
    <div class="foot">
      <div class="sync ${SYNC.st === 'busy' ? 'busy' : SYNC.st === 'off' ? 'off' : ''}"><i></i><span>${syncText()}</span></div>
      <div class="row" style="gap:4px">
        <button class="who" type="button" data-act="usermenu">${isAdmin() ? adminAv() : avatar(T(me.track).name, tcol(me.track))}<span class="col" style="min-width:0;line-height:1.35"><b style="font-weight:500;color:var(--ink1)" class="ellip">${esc(me.name)}</b><span class="xs faint">${isAdmin() ? 'كل المسارات' : esc(T(me.track).full || T(me.track).name)}</span></span></button>
        <button class="btn icon" type="button" data-act="theme" aria-label="${P.theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}" data-tip="${P.theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}">${svg(P.theme === 'dark' ? 'sun' : 'moon')}</button>
      </div>
    </div>
  </aside>
  <header class="topbar">
    <a href="#home" aria-label="الرئيسية">${LOGOS.anshita ? `<img class="brand-img" src="${LOGOS.anshita}" alt="الأنشطة التربوية">` : ''}</a>
    <span class="sp"></span>
    ${isAdmin() ? `<a class="btn icon bellb" href="#alerts" aria-label="تغييرات الفرق">${svg('bell')}${D.unseen ? `<span class="badge">${D.unseen}</span>` : ''}</a>` : ''}
    <button class="btn icon" type="button" data-act="cmd" aria-label="بحث">${svg('search')}</button>
    <button class="btn icon" type="button" data-act="theme" aria-label="تبديل الوضع">${svg(P.theme === 'dark' ? 'sun' : 'moon')}</button>
    <button class="btn icon" type="button" data-act="usermenu" aria-label="الحساب">${isAdmin() ? adminAv() : avatar(T(me.track).name, tcol(me.track))}</button>
  </header>
  <main class="main" id="main"><div class="wrap">${CFG.demo ? `<div class="demo-bar">${svg('eye')}<span>نسخة تجربة: البيانات في متصفحك فقط، والبوت والتقويم محاكاة.</span><span class="sp"></span><button type="button" data-act="demo-reset">ابدأ من جديد</button></div>` : ''}${body}</div></main>
  ${fabHtml(r)}<nav class="tabbar" aria-label="التنقل">${tabs}</nav>
</div>`;
}

/* ---------- العرض ---------- */
let VIEWS = {};      // تملؤها views.js
let FIRST = true;
function render() {
  applyTheme();
  const app = $('#app');
  if (route().name === 'pub') { app.innerHTML = pubView(route().a); return; }
  if (route().name === 'render') { app.innerHTML = renderView(route().a); return; }
  if (!D) { app.innerHTML = TOKEN ? `<div class="login"><div class="col" style="align-items:center;gap:14px">${LOGOS.anshita ? `<img class="brand-img" src="${LOGOS.anshita}" alt="" style="height:56px">` : ''}<span class="spin"></span></div></div>` : vLogin(); afterLogin(); return; }
  const r = route();
  let v = VIEWS[r.name];
  if (!v || (v.admin && !isAdmin())) { if (r.name !== 'home') { location.replace('#home'); return; } v = VIEWS.home; }
  const y = scrollY;
  PENDING_RENDER = false;
  let foc = null;
  if (F && F.dock) { readF(); const ae = document.activeElement; if (ae && ae.id && ae.closest && ae.closest('#dock')) foc = { id: ae.id, s: ae.selectionStart, e: ae.selectionEnd }; }
  if (F && F.dock && !dockOn(F.tid)) F = null;
  app.innerHTML = shell(v.render(r));
  if (v.after) v.after(r);
  if (F && F.dock) { markSel(); if (foc) { const el = document.getElementById(foc.id); if (el) { el.focus({ preventScroll: true }); try { if (foc.s != null) el.setSelectionRange(foc.s, foc.e); } catch (e) {} } } }
  if (!FIRST) window.scrollTo(0, y);
  FIRST = false;
}

/* ---------- الدخول ---------- */
const LOGIN_TILES = [['admin', 'الإدارة', 'anshita'], ['sanabel', 'سنابل'], ['budhoor', 'بذور'], ['judhoor', 'جذور'], ['ishraq', 'إشراق'], ['ithmar2', 'إثمار ٢'], ['ithmar3', 'إثمار ٣']];
const LG = { who: LS.get(NS + 'lastWho', ''), other: false, err: '', busy: false };
function vLogin() {
  const demo = CFG.demo;
  return `<div class="login"><div class="box">
    <div class="head">${LOGOS.anshita ? `<img class="brand-img" src="${LOGOS.anshita}" alt="الأنشطة التربوية">` : ''}
      <h1>منصة الأنشطة التربوية</h1><p class="muted">أكاديمية الجيل الصاعد الإلكترونية</p></div>
    ${LG.other ? '' : `<div class="who-grid" role="group" aria-label="من أنت؟">${LOGIN_TILES.map(([id, n, lg]) => `<button class="wt" type="button" data-act="lgwho" data-id="${id}" aria-pressed="${LG.who === id}"><span class="lg">${LOGOS[lg || id] ? `<img src="${LOGOS[lg || id]}" alt="">` : ''}</span><span>${id === 'admin' ? 'الإدارة' : 'فريق ' + n}</span></button>`).join('')}</div>`}
    <form id="lgf" autocomplete="on" ${!LG.who && !LG.other ? 'hidden' : ''}>
      ${LG.other ? `<div class="field"><label for="lg-u">اسم المستخدم</label><input class="inp" id="lg-u" name="username" autocomplete="username" required></div>` : `<input type="hidden" id="lg-u" name="username" value="${esc(LG.who)}" autocomplete="username">`}
      <div class="field"><label for="lg-p">كلمة المرور ${LG.other ? '' : `<span class="faint">— ${esc(LG.who === 'admin' ? 'الإدارة' : 'فريق ' + ((LOGIN_TILES.find(x => x[0] === LG.who) || [])[1] || ''))}</span>`}</label>
        <input class="inp" id="lg-p" name="password" type="password" autocomplete="current-password" ${demo ? 'placeholder="في التجربة اتركها فارغة"' : 'required'}></div>
      ${LG.err ? `<p class="err" role="alert">${esc(LG.err)}</p>` : ''}
      <button class="btn pri" type="submit" ${LG.busy ? 'disabled' : ''}>${LG.busy ? '<span class="spin"></span>' : ''}دخول</button>
    </form>
    <p class="alt"><button type="button" class="lk" data-act="lgother">${LG.other ? 'اختر من القائمة' : 'حساب آخر؟ ادخل باسم المستخدم'}</button></p>
  </div></div>`;
}
function afterLogin() { if (LG.who || LG.other) setTimeout(() => { const el = LG.other ? $('#lg-u') : $('#lg-p'); if (el) el.focus(); }, 30); }
async function doLogin(user, pass) {
  if (LG.busy) return;
  LG.busy = true; LG.err = ''; render();
  try {
    if (CFG.demo && !pass) pass = window.DEMO.pass(user);
    const r = await API.call('login', user, pass);
    TOKEN = r.token; LS.set(NS + 'tok', TOKEN); LS.set(NS + 'lastWho', LG.other ? '' : LG.who);
    LG.busy = false; location.hash = '#home'; await boot();
  } catch (e) { LG.busy = false; LG.err = e.message; render(); }
}
function logout() { TOKEN = ''; D = null; LG.other = false; LS.del(NS + 'tok'); LS.del(NS + 'boot'); stopPoll(); closeLayer(); location.hash = ''; render(); }

/* ---------- التحميل والتحديث الدوري ---------- */
function setBoot(b) {
  D = b; if (b.today) TODAY = b.today;
  D.tracks.forEach(t => planOf(t.id));
  indexHijri();
  try { LS.set(NS + 'boot', b); } catch (e) {}
}
async function boot(silent) {
  try {
    const b = await API.me('boot'); setBoot(b); setSync('ok'); render(); startPoll(); cardSoon(5000);
  } catch (e) {
    if (e.code === 'auth') { logout(); LG.err = e.message; render(); return; }
    setSync('off');
    if (!D) { const c = LS.get(NS + 'boot', null); if (c) { setBoot(c); render(); startPoll(); toast('تعرض آخر نسخة محفوظة: ' + e.message, 'err'); return; } }
    if (!silent) toast(e.message, 'err');
    if (!D) { $('#app').innerHTML = `<div class="login"><div class="box"><div class="card empty">${svg('alert')}<h3>تعذّر فتح المنصة</h3><p>${esc(e.message)}</p><button class="btn pri" type="button" data-act="retry">إعادة المحاولة</button></div></div></div>`; }
  }
}
let POLL = null;
function startPoll() { stopPoll(); POLL = setInterval(poll, 30000); }
function stopPoll() { if (POLL) clearInterval(POLL); POLL = null; }
let polling = false;
async function poll(force) {
  if (!D || polling || (document.hidden && !force)) return;
  polling = true;
  try {
    const r = await API.me('revs'), changed = [];
    if (r._meta !== D.revs._meta) { await boot(true); polling = false; return; }
    for (const id of Object.keys(r)) {
      if (id[0] === '_' || r[id] === D.revs[id] || INFLIGHT[id]) continue;   // لا تُستبدل خطة فيها حفظ جارٍ
      D.plans[id] = await API.me('plan', id); D.revs[id] = r[id]; changed.push(id);
    }
    if (r._log !== D.revs._log) { D.log = (await API.me('log_list')).slice(0, 60); D.revs._log = r._log; }
    if (r._alerts !== undefined && r._alerts !== D.revs._alerts) {
      const prevTop = (D.alerts || [])[0] && D.alerts[0].id;
      D.alerts = (await API.me('alerts')).slice(0, 40); D.unseen = D.alerts.filter(x => !x.seen).length; D.revs._alerts = r._alerts;
      const top = D.alerts[0]; if (top && top.id !== prevTop && !top.seen) { toast('تغيير من ' + top.by + ': ' + qt(top.title)); changed.push('_alerts'); }
    }
    setSync('ok');
    if (changed.length) {
      indexHijri();
      if (!$('#layer').innerHTML && !(F && F.dock)) render(); else PENDING_RENDER = true;
      const by = (D.log || []).find(x => changed.includes(x.t));
      if (by && by.by !== D.me.name) toast(`${by.by}: ${by.what} ${qt(by.d)}`);
    } else if (!$('#layer').innerHTML) { $$('.sync span').forEach(s => s.textContent = syncText()); }
  } catch (e) { if (e.code === 'auth') logout(); else setSync('off'); }
  polling = false;
}
let PENDING_RENDER = false;
document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(true); });

/* ---------- الحفظ (تفاؤلي مع التراجع عند الخطأ) ---------- */
async function saveAct(tid, patch, opt = {}) {
  const body = Object.assign({}, patch);
  let p = planOf(tid), idx = -1, prev = null, tmp = null;
  if (patch.id) { idx = p.acts.findIndex(a => a.id === patch.id); prev = p.acts[idx]; p.acts[idx] = Object.assign({}, prev, patch); delete p.acts[idx].scope; }
  else { tmp = Object.assign({ id: 'tmp' + Date.now(), done: false, who: [], by: D.me.name, sem: semFor(tid, patch.d) || curN(tid) }, patch); p.acts.push(tmp); }
  if (patch.d && !patch.sem) { const s = semFor(tid, patch.d); if (s) body.sem = s; }
  const key = patch.id || tmp.id; pendOn(tid, key);
  if (!opt.quiet) render();
  setSync('busy', patch.title || (prev && prev.title) || '');
  try {
    const r = await API.me('act_save', tid, JSON.stringify(body));
    p = planOf(tid);
    const i = p.acts.findIndex(a => a.id === key || a.id === r.act.id);
    if (i >= 0) p.acts[i] = r.act; else p.acts.push(r.act);
    (r.others || []).forEach(o => { const k = p.acts.findIndex(a => a.id === o.id); if (k >= 0) p.acts[k] = o; });
    p.rev = r.rev; D.revs[tid] = r.rev;
    pendOff(tid, key); setSync('ok'); cardSoon();
    if (r.calErr) toast('حُفظ النشاط، وتعذّر تحديث تقويم جوجل: ' + r.calErr, 'err');
    if (!opt.noRender) render();
    setTimeout(() => poll(true), 600);
    return r.act;
  } catch (e) {
    p = planOf(tid); const i = p.acts.findIndex(a => a.id === key);
    if (prev && i >= 0) p.acts[i] = prev; else if (tmp && i >= 0) p.acts.splice(i, 1);
    pendOff(tid, key); setSync(e.net ? 'off' : 'ok'); render(); toast(e.message, 'err'); throw e;
  }
}
// أنشطة يُحفظ تغييرها الآن: تظهر بعلامة انتظار، ولا يستبدل التحديث الدوري خطة مسارها حتى تنتهي
const PEND = new Set(), INFLIGHT = {};
function pendOn(tid, id) { if (id) PEND.add(id); INFLIGHT[tid] = (INFLIGHT[tid] || 0) + 1; }
function pendOff(tid, id) { if (id) PEND.delete(id); INFLIGHT[tid] = Math.max(0, (INFLIGHT[tid] || 1) - 1); if (!INFLIGHT[tid]) delete INFLIGHT[tid]; }
// scope = 'next': هذا الموعد وما بعده من النشاط المتكرر
async function delAct(tid, id, scope) {
  const p = planOf(tid), x = p.acts.find(a => a.id === id), before = p.acts.slice();
  if (!x) return;
  const gone = p.acts.filter(a => a.id === id || (scope === 'next' && x.ser && a.ser === x.ser && a.d > x.d));
  p.acts = p.acts.filter(a => !gone.includes(a)); pendOn(tid, ''); render(); setSync('busy', 'حذف ' + x.title);
  try { const r = await API.me('act_del', tid, id, scope || ''); const q = planOf(tid); q.acts = q.acts.filter(a => !(r.ids || [id]).includes(a.id)); q.rev = r.rev; D.revs[tid] = r.rev; pendOff(tid, ''); setSync('ok'); render(); toast(gone.length > 1 ? `حُذف ${qt(x.title)} و${apptText(gone.length - 1)} بعده` : `حُذف ${qt(x.title)}`); setTimeout(() => poll(true), 600); }
  catch (e) { planOf(tid).acts = before; pendOff(tid, ''); setSync('ok'); render(); toast(e.message, 'err'); }
}
// النشاط المتكرر: مواعيد مستقلة تجمعها سلسلة واحدة
async function saveSeries(tid, body) {
  setSync('busy', 'المواعيد المتكررة'); pendOn(tid, body.from || '');
  try {
    const r = await API.me('act_series', tid, JSON.stringify(body)), p = planOf(tid); pendOff(tid, body.from || '');
    if (r.first) { const i = p.acts.findIndex(a => a.id === r.first.id); if (i >= 0) p.acts[i] = r.first; }
    p.acts.push(...r.acts); p.series = Object.assign({}, p.series, { [r.sid]: r.series });
    p.rev = r.rev; D.revs[tid] = r.rev; setSync('ok');
    if (r.calErr) toast('أُضيفت المواعيد، وتعذّر بعضها في تقويم جوجل: ' + r.calErr, 'err');
    render(); setTimeout(() => poll(true), 600);
    return r;
  } catch (e) { pendOff(tid, body.from || ''); setSync(e.net ? 'off' : 'ok'); render(); toast(e.message, 'err'); throw e; }
}
const apptText = n => n === 1 ? 'موعد واحد' : n === 2 ? 'موعدان' : n <= 10 ? n + ' مواعيد' : n + ' موعدًا';
const EVERY = { 1: 'كل أسبوع', 2: 'كل أسبوعين', 4: 'كل أربعة أسابيع' };
const seriesOf = (tid, ser) => ser ? planOf(tid).acts.filter(a => a.ser === ser).sort(sortA) : [];
function seriesText(tid, ser) {
  const r = (planOf(tid).series || {})[ser], L = seriesOf(tid, ser);
  if (!r) return apptText(L.length);
  return EVERY[r.every || 1] + ((r.wd || []).length ? ' يوم ' + r.wd.map(i => DAYS[i]).join(' و') : '') + ' · ' + apptText(L.length);
}
// مواعيد التكرار: من يوم النشاط حتى «حتى»، في الأيام المختارة، كل N أسابيع.
// أيام الإجازة والاختبار في جدول الفصل تُستبعد افتراضيًا، ويستطيع المستخدم إعادة أي موعد أو استبعاده
function repDates(tid, F) {
  const R = F.rep, start = F.d, end = R.until, out = [];
  if (!start || !end || end < start) return out;
  const w0 = wkStart(start);
  for (let k = 0; add(w0, 7 * k) <= end && out.length < 80; k += R.every) {
    R.wd.slice().sort((a, b) => a - b).forEach(i => {
      const d = add(w0, 7 * k + i); if (d < start || d > end) return;
      const sn = semFor(tid, d) || curN(tid), day = dayOf(tid, sn, d), k = spanKind(day);
      const reason = k === 'hol' ? 'إجازة' : k === 'exam' ? (day.ev || 'اختبار') : examWeeks(tid, sn).has(wkStart(d)) ? 'أسبوع الاختبار' : '';
      const clash = MEET_T.includes(F.type) && d !== start ? dayMeets(tid, d, F.id).length > 0 : false;
      const first = !F.isNew && d === start;
      out.push({ d, reason, clash, first, on: first || (R.tog[d] ? !!reason : !reason) });
    });
  }
  return out;
}
function moveAct(tid, id, d) {
  const a = planOf(tid).acts.find(x => x.id === id); if (!a || a.d === d) return;
  const old = a.d;
  saveAct(tid, { id, d }).then(() => {
    toast(`نُقل ${qt(a.title)} إلى ${gDay(d)}`, '', () => saveAct(tid, { id, d: old }));
    announce(`نُقل النشاط إلى ${gDay(d)}`);
  }).catch(() => {});
}
async function trackSave(tid, patch) {
  setSync('busy');
  try { const r = await API.me('track_save', tid, JSON.stringify(patch)); const i = D.tracks.findIndex(t => t.id === tid), nt = Object.assign({}, D.tracks[i], r.track); if (!r.track.editReq) delete nt.editReq; D.tracks[i] = nt; setSync('ok'); render(); return r.track; }
  catch (e) { setSync('ok'); toast(e.message, 'err'); throw e; }
}

/* ---------- الطبقات: لوحة جانبية، حوار، لوحة أوامر ---------- */
let LAYER = null;     // {kind, onClose}
function openSheet(head, body, foot, opts = {}) {
  const prevFocus = document.activeElement;
  $('#layer').innerHTML = `<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(opts.label || '')}"><div class="sh-h"><div class="t">${head}</div><button class="btn icon" type="button" data-act="close" aria-label="إغلاق">${svg('x')}</button></div><div class="sh-b">${body}</div>${foot ? `<div class="sh-f">${foot}</div>` : ''}</div>`;
  LAYER = { prevFocus, onClose: opts.onClose };
  const f = $('#layer [autofocus]') || $('#layer .sheet input, #layer .sheet button:not([data-act="close"])'); if (f && !opts.noFocus) setTimeout(() => f.focus(), 40);
}
function openDialog(html, opts = {}) {
  const prevFocus = document.activeElement;
  $('#layer').innerHTML = `<div class="scrim" data-act="close"></div><div class="dlg" role="dialog" aria-modal="true">${html}</div>`;
  LAYER = { prevFocus, onClose: opts.onClose };
  const f = $('#layer [autofocus]') || $('#layer .dlg input, #layer .dlg textarea, #layer .dlg button'); if (f) setTimeout(() => f.focus(), 40);
}
function closeLayer() {
  if (!$('#layer') || !$('#layer').innerHTML) return;
  const l = LAYER; $('#layer').innerHTML = ''; LAYER = null; if (!(F && F.dock)) F = null; CMD = null;
  if (l && l.onClose) l.onClose();
  if (PENDING_RENDER) { PENDING_RENDER = false; render(); }
  if (l && l.prevFocus && document.contains(l.prevFocus)) l.prevFocus.focus();
}
function trapFocus(e) {
  const box = $('#layer .sheet, #layer .dlg, #layer .cmd'); if (!box) return;
  const f = $$('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])', box).filter(x => !x.disabled && x.offsetParent);
  if (!f.length) return;
  if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
  else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
}

/* ---------- السحب والإفلات (فأرة ولمس) ----------
   [data-drag] عنصر قابل للسحب (data-id، data-track). [data-drop] يوم (data-date، وdata-track إن قُيّد بمسار).
   .ltrack[data-lane] مسار ممتد: يُحسب اليوم من موضع المؤشر. اللمس: ضغطة مطوّلة ثم سحب. */
let DG = null, SUPPRESS = false;
document.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const el = e.target.closest('[data-drag]'); if (!el || !canAdjust(el.dataset.track)) return;
  DG = { el, x: e.clientX, y: e.clientY, id: el.dataset.id, track: el.dataset.track, on: false, touch: e.pointerType === 'touch', pid: e.pointerId };
  if (DG.touch) DG.timer = setTimeout(() => { if (DG && !DG.on) { startDrag(DG.x, DG.y); if (navigator.vibrate) navigator.vibrate(12); } }, 320);
});
document.addEventListener('pointermove', e => {
  if (!DG) return;
  if (!DG.on) {
    const dist = Math.hypot(e.clientX - DG.x, e.clientY - DG.y);
    if (DG.touch) { if (dist > 10) { clearTimeout(DG.timer); DG = null; } return; }
    if (dist > 6) startDrag(e.clientX, e.clientY); else return;
  }
  e.preventDefault(); moveGhost(e.clientX, e.clientY);
}, { passive: false });
document.addEventListener('touchmove', e => { if (DG && DG.on) e.preventDefault(); }, { passive: false });
document.addEventListener('pointerup', e => endDrag(e, false));
document.addEventListener('pointercancel', e => endDrag(e, true));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && DG && DG.on) endDrag(e, true); });
function startDrag(x, y) {
  DG.on = true;
  const r = DG.el.getBoundingClientRect(), g = DG.el.cloneNode(true);
  g.classList.add('dragghost'); g.removeAttribute('data-drag'); g.style.width = Math.max(120, Math.min(240, r.width)) + 'px';
  document.body.appendChild(g); DG.g = g; DG.el.classList.add('drag-src');
  document.body.style.userSelect = 'none'; moveGhost(x, y);
}
function dropAt(x, y) {
  const el = document.elementFromPoint(x, y); if (!el) return null;
  const lane = el.closest('.ltrack[data-lane]');
  if (lane) {
    const r = lane.getBoundingClientRect(), dw = +lane.dataset.dw, i = Math.floor((r.right - x) / dw);
    const n = +lane.dataset.n; if (i < 0 || i >= n) return null;
    return { el: lane, date: add(lane.dataset.start, i), track: lane.dataset.lane };
  }
  const d = el.closest('[data-drop]'); if (!d) return null;
  return { el: d, date: d.dataset.date, track: d.dataset.track || '' };
}
function moveGhost(x, y) {
  DG.g.style.left = (x - DG.g.offsetWidth / 2) + 'px'; DG.g.style.top = (y - 20) + 'px';
  const t = dropAt(x, y), ok = t && (!t.track || t.track === DG.track);
  if (DG.over && DG.over !== (ok && t.el)) DG.over.classList.remove('drop-on');
  if (ok && !t.el.matches('.ltrack')) { t.el.classList.add('drop-on'); DG.over = t.el; } else DG.over = null;
  DG.target = ok ? t : null;
  if (DG.g) { if (ok) DG.g.dataset.when = 'إلى ' + gDay(t.date); else delete DG.g.dataset.when; }
  const m = 60; if (y < m) scrollBy(0, -12); else if (y > innerHeight - m) scrollBy(0, 12);
}
function endDrag(e, cancel) {
  if (!DG) return;
  clearTimeout(DG.timer);
  if (DG.on) {
    SUPPRESS = true; setTimeout(() => SUPPRESS = false, 60);
    DG.g.remove(); DG.el.classList.remove('drag-src'); if (DG.over) DG.over.classList.remove('drop-on');
    document.body.style.userSelect = '';
    if (!cancel && DG.target) moveAct(DG.track, DG.id, DG.target.date);
  }
  DG = null;
}

/* ---------- الأزرار أثناء التنفيذ ----------
   كل زر يبدأ أمرًا على الخادم يتحول إلى حالة «قيد التنفيذ» (دوّارة ونص يصف ما يجري)، ولا يُقبل الضغط عليه
   مرة ثانية حتى ينتهي، ولو أُعيد رسم الصفحة في أثنائه. */
const BUSY = new Map();
const BUSY_LABEL = {
  'ann-save': 'يحفظ…',   'share-on': 'يُنشئ…', 'share-off': 'يُوقف…', 'f-save': 'يحفظ…', 'f-save-next': 'يحفظ…', 'f-meet': 'يُنشئ الرابط…', 'f-meet-del': 'يُزيل…', 'tk-save': 'يحفظ…', 'tk-del': 'يحذف…', 'mb-save': 'يحفظ الفريق…',
  'de-save': 'يحفظ…', 'ae-send': 'يُرسل…', 'bs-save': 'يحفظ…', 'bot-menu': 'يحدّث…', 'bot-test': 'يُرسل…', 'bot-now': 'يُرسل…', 'bot-token': 'يربط…',
  'mt-admins': 'يحفظ…', 'ac-save': 'يحفظ…', 'ac-del': 'يحذف…', 'acc-reset': 'يعيد التعيين…', 'pw-save': 'يغيّر…', 'si-check': 'يفحص…', 'si-save': 'يستورد…',
  'sn-save': 'يُنشئ…', semdel: 'يحذف…', grant: 'يفتح…', toggleedit: 'يحفظ…', 'bs-pause': 'يحفظ…', 'bs-atasks': 'يحفظ…', 'bot-unlink': 'يُلغي…'
};
const busyKey = el => [el.dataset.act, el.dataset.id || '', el.dataset.v || '', el.dataset.track || '', el.dataset.n || '', el.dataset.d || ''].join('|');
function busyEl(el, label) {
  el.classList.add('busy'); el.setAttribute('aria-busy', 'true'); if ('disabled' in el) el.disabled = true;
  if (label && el.tagName === 'BUTTON' && !el.classList.contains('icon') && el.textContent.trim()) { if (el.dataset.orig == null) el.dataset.orig = el.innerHTML; el.innerHTML = '<span class="spin" aria-hidden="true"></span>' + esc(label); }
  else if (!el.querySelector('.spin')) el.insertAdjacentHTML('afterbegin', '<span class="spin" aria-hidden="true"></span>');
}
function unbusyEl(el) {
  el.classList.remove('busy'); el.removeAttribute('aria-busy'); if ('disabled' in el) el.disabled = false;
  if (el.dataset.orig != null) { el.innerHTML = el.dataset.orig; delete el.dataset.orig; } else { const sp = el.querySelector(':scope > .spin'); if (sp) sp.remove(); }
}
let BUSY_RAF = 0;
function paintBusy() {
  BUSY_RAF = 0;
  $$('[data-act].busy').forEach(el => { if (!BUSY.has(busyKey(el))) unbusyEl(el); });
  if (BUSY.size) $$('[data-act]').forEach(el => { const k = busyKey(el); if (BUSY.has(k) && !el.classList.contains('busy')) busyEl(el, BUSY.get(k)); });
}
new MutationObserver(() => { if ((BUSY.size || document.querySelector('[data-act].busy')) && !BUSY_RAF) BUSY_RAF = requestAnimationFrame(paintBusy); }).observe(document.documentElement, { childList: true, subtree: true });
// يشغّل أمر الزر، ويحرسه من التكرار ما دام قيد التنفيذ
function runAct(f, el, e) {
  const k = busyKey(el);
  if (BUSY.has(k)) { el.classList.remove('nudge'); void el.offsetWidth; el.classList.add('nudge'); return; }
  const r = f(el, e);
  if (r && typeof r.then === 'function') {
    BUSY.set(k, el.dataset.busy || BUSY_LABEL[el.dataset.act] || '');
    const t = setTimeout(paintBusy, 120);   // الأوامر السريعة لا تومض
    r.catch(() => {}).finally(() => { clearTimeout(t); BUSY.delete(k); paintBusy(); });
  }
  return r;
}
