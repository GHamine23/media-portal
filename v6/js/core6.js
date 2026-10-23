/* ================= نواة الإصدار السادس: الاتصال، الجلسة، التخزين، التنقل، الحركة، الرسائل ================= */
const V6 = { version: '6.0.0', me: null, token: '', bundle: null, prog: null, assets: {}, mine: [], settings: {} };
const ASSETS = {};   // المفتاح ← رابط الملف (تملؤه أصول البرنامج بعد الدخول)
const $$ = function (s, r) { return Array.from((r || document).querySelectorAll(s)); };
function ls(key, val) { try { if (val === undefined) return JSON.parse(localStorage.getItem('mp6.' + key) || 'null'); if (val === null) localStorage.removeItem('mp6.' + key); else localStorage.setItem('mp6.' + key, JSON.stringify(val)); } catch (e) { return null; } }

/* ---------- الاتصال بالخادم ---------- */
const API6 = {
  mode: function () { return (typeof API_URL !== 'undefined' && /^(https:|http:\/\/localhost)/.test(API_URL)) ? 'http' : (window.DEMO ? 'demo' : ''); },
  call: function (fn) {
    const args = Array.prototype.slice.call(arguments, 1);
    if (API6.mode() === 'demo') return DEMO.call(fn, args);
    if (!API6.mode()) return Promise.reject(new Error('لا يوجد خادم مضبوط'));
    return fetch(API_URL, { method: 'POST', body: JSON.stringify({ fn: fn, args: args }), redirect: 'follow', credentials: 'omit' })
      .then(function (r) { if (!r.ok) throw new Error('تعذّر الاتصال بالخادم (' + r.status + ')'); return r.json(); })
      .then(function (j) { if (j.error) { if (/انتهت الجلسة|موقوف/.test(j.error) && fn !== 'auth_login') sessionLost(j.error); throw new Error(j.error); } return j.result; });
  },
  json: function () { return API6.call.apply(null, arguments).then(function (t) { if (typeof t !== 'string') return t; try { return JSON.parse(t); } catch (e) { return t; } }); },   // بعض الطلبات تعيد «ok» نصاً
  // بالجلسة الحالية
  me: function (fn) { const a = Array.prototype.slice.call(arguments, 1); return API6.json.apply(null, [fn, V6.token].concat(a)); }
};
function sessionLost(msg) { if (!V6.token) return; V6.token = ''; ls('token', null); toast(msg || 'انتهت الجلسة'); setTimeout(function () { go('#/login'); }, 400); }

/* ---------- ذاكرة دائمة للملفات (IndexedDB): الخطوط والشعارات لا تُنزَّل إلا مرة ---------- */
const IDB = {
  db: null,
  open: function () {
    if (IDB.db) return Promise.resolve(IDB.db);
    return new Promise(function (ok) {
      try {
        const r = indexedDB.open('mp6', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('blobs'); };
        r.onsuccess = function () { IDB.db = r.result; ok(IDB.db); };
        r.onerror = function () { ok(null); };
      } catch (e) { ok(null); }
    });
  },
  get: function (k) { return IDB.open().then(function (db) { if (!db) return null; return new Promise(function (ok) { const q = db.transaction('blobs').objectStore('blobs').get(k); q.onsuccess = function () { ok(q.result || null); }; q.onerror = function () { ok(null); }; }); }); },
  put: function (k, v) { return IDB.open().then(function (db) { if (!db) return; return new Promise(function (ok) { const t = db.transaction('blobs', 'readwrite'); t.objectStore('blobs').put(v, k); t.oncomplete = ok; t.onerror = ok; }); }); }
};
function b64ToBlob(b64, mime) { const s = atob(b64), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return new Blob([a], { type: mime || 'application/octet-stream' }); }
function blobToB64(blob) { return new Promise(function (ok, bad) { const r = new FileReader(); r.onload = function () { ok(String(r.result).split(',')[1] || ''); }; r.onerror = bad; r.readAsDataURL(blob); }); }

/* ---------- التنقل: كل صفحة دالة، والانتقال بينها ناعم ---------- */
const ROUTES = [];
function route6(re, fn, opt) { ROUTES.push({ re: re, fn: fn, opt: opt || {} }); }
function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
let RENDER_N = 0;
function render() {
  const h = location.hash.replace(/^#/, '') || '/';
  const r = ROUTES.find(function (x) { return x.re.test(h); }) || ROUTES[ROUTES.length - 1];
  if (!r.opt.public && !V6.token) { if (h !== '/login') ls('after', h); return go('#/login'); }
  const m = h.match(r.re) || [];
  const n = ++RENDER_N;
  const run = function () { if (n !== RENDER_N) return; LEAVE.forEach(function (f) { try { f(); } catch (e) {} }); LEAVE.length = 0; r.fn.apply(null, m.slice(1).map(function (x) { return x == null ? undefined : decodeURIComponent(x); })); /* الجزء الاختياري الغائب يبقى غائباً لا «undefined» */ };
  document.body.dataset.page = r.opt.page || '';
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches && !r.opt.noVT && RENDER_N > 1) document.startViewTransition(run);
  else run();
}
const LEAVE = [];   // تنظيف عند مغادرة الصفحة
window.addEventListener('hashchange', render);
function view() { const v = $('#view'); v.innerHTML = ''; Array.from(arguments).forEach(function (k) { if (k) v.appendChild(k); }); window.scrollTo(0, 0); revealAll(v); return v; }

/* ---------- الحركة ---------- */
// يقسم العنوان كلمات تظهر واحدة بعد أخرى من ضبابية
function blurWords(node, text) {
  node.textContent = '';
  String(text).split(/(\s+)/).forEach(function (w, i) {
    if (/^\s+$/.test(w)) { node.appendChild(document.createTextNode(w)); return; }
    if (!w) return;
    node.appendChild(el('span', { class: 'bw', style: '--i:' + Math.floor(i / 2), text: w }));
  });
  return node;
}
let IO = null;
function revealAll(root) {
  if (!('IntersectionObserver' in window)) { $$('.rv,.bwrap', root).forEach(function (x) { x.classList.add('in-view'); }); return; }
  if (!IO) IO = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in-view'); IO.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px' });
  requestAnimationFrame(function () { $$('.rv,.bwrap', root).forEach(function (x) { IO.observe(x); }); });
}
function H(tag, text, cls) { const n = el(tag, { class: 'bwrap ' + (cls || '') }); blurWords(n, text); return n; }
function setMotion(level) { document.documentElement.style.setProperty('--k', level === 'lively' ? '0.8' : level === 'normal' ? '1' : '1.25'); }

/* ---------- الرسائل والنوافذ ---------- */
function toast(t, ms) {
  $$('.toast').forEach(function (x) { x.remove(); });
  const e = el('div', { class: 'toast', role: 'status', text: t }); document.body.appendChild(e);
  requestAnimationFrame(function () { e.classList.add('show'); });
  setTimeout(function () { e.classList.remove('show'); setTimeout(function () { e.remove(); }, 400); }, ms || 3600);
}
function modal(opt) {
  const close = function () { box.style.animation = 'popIn .2s reverse both'; wrap.style.animation = 'fadeIn .2s reverse both'; setTimeout(function () { wrap.remove(); if (opt.onClose) opt.onClose(); }, 180); document.removeEventListener('keydown', esc); };
  const esc = function (e) { if (e.key === 'Escape') close(); };
  const box = el('div', { class: 'box' + (opt.wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': opt.title || '' }, [
    opt.title ? el('h3', { text: opt.title }) : null
  ].concat(opt.body || []).concat(opt.acts ? [el('div', { class: 'acts' }, opt.acts.map(function (a) {
    return a && el('button', { type: 'button', class: 'btn ' + (a.cls || ''), text: a.t, onclick: function () { if (a.fn && a.fn(close) === false) return; if (!a.keep) close(); } });
  }))] : []));
  const wrap = el('div', { class: 'modal' }, [box]);
  wrap.addEventListener('mousedown', function (e) { if (e.target === wrap && !opt.sticky) close(); });
  document.addEventListener('keydown', esc);
  document.body.appendChild(wrap);
  setTimeout(function () { const f = box.querySelector('input,textarea,select'); if (f && !opt.noFocus) f.focus(); }, 60);
  return { close: close, box: box };
}
function ask(title, text, okText, danger) {
  return new Promise(function (ok) { modal({ title: title, body: [el('p', { class: 'muted', text: text })], acts: [{ t: okText || 'تأكيد', cls: danger ? 'danger' : 'dark', fn: function () { ok(true); } }, { t: 'إلغاء', fn: function () { ok(false); } }], onClose: function () { ok(false); } }); });
}
function popMenu(anchor, items) {
  $$('.menu').forEach(function (m) { m.remove(); });
  items = items.filter(Boolean);
  const m = el('div', { class: 'menu', role: 'menu' }, items.map(function (it) {
    if (it === '-') return el('hr');
    if (it.hd) return el('div', { class: 'hd', text: it.hd });
    return el(it.href ? 'a' : 'button', { type: it.href ? null : 'button', href: it.href || null, role: 'menuitem', onclick: function () { m.remove(); if (it.fn) it.fn(); } }, [it.sw ? el('i', { class: 'sw', style: 'background:' + it.sw }) : (it.ic ? ico(it.ic) : null), el('span', { text: it.t })]);
  }));
  document.body.appendChild(m);
  const r = anchor.getBoundingClientRect(), mw = m.offsetWidth, mh = m.offsetHeight;
  let x = r.right - mw; if (x < 8) x = Math.min(r.left, innerWidth - mw - 8);
  let y = r.bottom + 8; if (y + mh > innerHeight - 8) y = Math.max(8, r.top - mh - 8);
  m.style.left = x + 'px'; m.style.top = y + 'px';
  setTimeout(function () { document.addEventListener('mousedown', function off(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('mousedown', off); } }); }, 0);
  return m;
}
function segOf(items, cur, on) {
  return el('div', { class: 'seg', role: 'radiogroup' }, items.map(function (it) {
    return el('button', { type: 'button', class: it[0] === cur ? 'on' : '', role: 'radio', 'aria-checked': it[0] === cur ? 'true' : 'false', onclick: function (e) {
      $$('button', e.currentTarget.parentNode).forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); });
      e.currentTarget.classList.add('on'); e.currentTarget.setAttribute('aria-checked', 'true'); on(it[0]);
    } }, [it[1]]);
  }));
}
function fmtDate(t) { try { return new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(t)); } catch (e) { return ''; } }
function fmtTime(t) { try { return new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(t)); } catch (e) { return ''; } }
function ago(t) { const s = (Date.now() - t) / 1000; if (s < 60) return 'الآن'; if (s < 3600) return 'قبل ' + Math.round(s / 60) + ' دقيقة'; if (s < 86400) return 'قبل ' + Math.round(s / 3600) + ' ساعة'; if (s < 86400 * 30) return 'قبل ' + Math.round(s / 86400) + ' يوم'; return fmtDate(t); }
function uid6() { return Math.random().toString(36).slice(2, 9) + Math.random().toString(36).slice(2, 9); }

/* ---------- الأيقونات (خطوط نظيفة تتلون بلون النص) ---------- */
const IC = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  grid: '<rect x="3" y="3" width="7" height="9" rx="1.6"/><rect x="14" y="3" width="7" height="5" rx="1.6"/><rect x="14" y="12" width="7" height="9" rx="1.6"/><rect x="3" y="16" width="7" height="5" rx="1.6"/>',
  text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
  shapes: '<circle cx="8" cy="8" r="4.5"/><path d="M13 20l4-7 4 7z"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.8-1.8 0-1.3-1-1.4-1-2.6 0-1 .8-1.6 1.8-1.6H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="10.5" cy="7" r="1.2" fill="currentColor"/><circle cx="15" cy="7.5" r="1.2" fill="currentColor"/>',
  font: '<path d="M4 20 10 4h1l6 16M6.5 14h8M17 20h4"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  ai: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M18 15l.8 2.2 2.2.8-2.2.8L18 21l-.8-2.2-2.2-.8 2.2-.8z"/>',
  content: '<path d="M4 6h16M4 12h10M4 18h13"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
  download: '<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 4 6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', close: '<path d="M6 6l12 12M18 6 6 18"/>', check: '<path d="M5 12.5 9.5 17 19 7.5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', chev: '<path d="m15 6-6 6 6 6"/>', chevd: '<path d="m6 9 6 6 6-6"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', eyeoff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6C3.7 8.3 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', star: '<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z"/>',
  slides: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>', heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>', chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', flag: '<path d="M5 21V4h11l-2 4 2 4H5"/>', megaphone: '<path d="M4 10v4h3l7 5V5L7 10zM18 9a3 3 0 0 1 0 6"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>', key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>',
  prog: '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><path d="M17 13v8M13 17h8"/>',
  zoomin: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6M11 8v6"/>', zoomout: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6"/>',
  align: '<path d="M4 6h16M7 12h10M5 18h14"/>', front: '<rect x="8" y="8" width="12" height="12" rx="2" fill="currentColor" fill-opacity=".15"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>', back: '<rect x="4" y="4" width="12" height="12" rx="2"/><path d="M20 8v11a1 1 0 0 1-1 1H8"/>',
  more: '<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>',
  wand: '<path d="m4 20 11-11 2 2L6 22zM14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 9l.6 1.4L21 11l-1.4.6L19 13l-.6-1.4L17 11l1.4-.6z"/>', reset: '<path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6"/><path d="M4 4v4.6h4.6"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z"/>', sparkles: '<path d="M9 4l1.5 4L15 9.5l-4.5 1.5L9 15l-1.5-4L3 9.5 7.5 8zM18 13l.8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8z"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  send: '<path d="M21 3 3 10l7 3 3 7z"/><path d="m10 13 11-10"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4"/>',
  model: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  pack: '<path d="M12 3 3 7.5v9L12 21l9-4.5v-9z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>', play: '<path d="M7 4v16l13-8z"/>'
};
function ico(name, cls) {
  const s = document.createElementNS('http:\/\/www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.8');
  s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true');
  if (cls) s.setAttribute('class', cls);
  s.innerHTML = IC[name] || IC.info; return s;
}

/* ---------- الإحصاءات: أحداث مجمّعة تُرسل كل نصف دقيقة ---------- */
const EVQ = [];
function track(e, extra) { if (!V6.token) return; EVQ.push(Object.assign({ e: e, p: V6.prog ? V6.prog.id : '' }, extra || {})); if (EVQ.length >= 40) flushEv(); }
function flushEv() { if (!EVQ.length || !V6.token) return; const batch = EVQ.splice(0, EVQ.length); API6.call('stat_track', V6.token, JSON.stringify(batch)).catch(function () {}); }
setInterval(flushEv, 30000);
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushEv(); });

/* ---------- الأخطاء التقنية تُحفظ لتُرفق بالبلاغ ---------- */
const ERRS6 = [];
window.addEventListener('error', function (e) { ERRS6.push(String(e.message || 'error').slice(0, 300) + ' @' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || '')); if (ERRS6.length > 12) ERRS6.shift(); });
window.addEventListener('unhandledrejection', function (e) { ERRS6.push('promise: ' + String((e.reason && e.reason.message) || e.reason).slice(0, 300)); if (ERRS6.length > 12) ERRS6.shift(); });

/* ---------- حركة الانتظار: علامة «أثـر» يدور حولها أثر يُرسم، وجمل لطيفة تتبدّل إن طال الانتظار ---------- */
const LOAD_LINES = ['نرتّب الألوان على مقاس هويتك…', 'نوقظ الخطوط من نومها…', 'نلمّع الشعارات…', 'نصفّ القوالب صفّاً منتظماً…', 'لحظات، والجميل يستحق الانتظار…', 'نضبط المسافات بالمسطرة…'];
function loader6(text, small) {
  const t = el('p', { class: 'ldt', text: text || '' });
  const node = el('div', { class: 'ld6' + (small ? ' sm' : ''), role: 'status', 'aria-live': 'polite' }, [
    el('div', { class: 'ldm' }, [svgOf('<circle class="ldtrack" cx="50" cy="50" r="44"/><circle class="ldarc" cx="50" cy="50" r="44"/><circle class="lddot" cx="50" cy="6" r="3.2"/>'), typeof brandImg === 'function' ? brandImg('mark', 'ldmark') : null]),
    small ? null : t
  ]);
  if (!small) {
    let i = Math.floor(Math.random() * LOAD_LINES.length);
    const tm = setInterval(function () {
      if (!node.isConnected) { clearInterval(tm); return; }
      t.classList.add('out'); setTimeout(function () { t.textContent = LOAD_LINES[i++ % LOAD_LINES.length]; t.classList.remove('out'); }, 260);
    }, 2600);
  }
  return node;
}
function svgOf(inner) { const s = document.createElementNS('http:\/\/www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 100 100'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = inner; return s; }
// شريط أفقي بسهمين للتنقل (يظهران عند وجود ما يُمرَّر)
function stripNav(strip) {
  const prev = el('button', { type: 'button', class: 'snav prev', 'aria-label': 'السابق', onclick: function () { strip.scrollBy({ left: strip.clientWidth * 0.8, behavior: 'smooth' }); } }, [ico('chev')]);
  const next = el('button', { type: 'button', class: 'snav next', 'aria-label': 'التالي', onclick: function () { strip.scrollBy({ left: -strip.clientWidth * 0.8, behavior: 'smooth' }); } }, [ico('chev')]);
  const w = el('div', { class: 'stripw' }, [strip, prev, next]);
  const upd = function () {
    const max = strip.scrollWidth - strip.clientWidth, x = Math.abs(strip.scrollLeft);   // في الاتجاه من اليمين يكون التمرير سالباً
    w.classList.toggle('scrollable', max > 4); prev.disabled = x < 4; next.disabled = x > max - 4;
  };
  strip.addEventListener('scroll', upd, { passive: true }); new ResizeObserver(upd).observe(strip);
  new MutationObserver(upd).observe(strip, { childList: true }); setTimeout(upd, 50);
  return w;
}
