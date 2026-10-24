/* ================= عدّة واجهة الجوال بروح iOS: شاشات بعنوان كبير، أوراق سفلية بمستويات، ورقة إجراءات، شريط تبويب، سحب للرجوع، اهتزاز =================
   تحل محل النوافذ والقوائم المنبثقة لسطح المكتب: modal() تصير ورقة سفلية، وpopMenu() ورقة إجراءات، فتعمل كل شاشات المنصة بلا تعديل. */
const M = { stack: [], dir: 'fwd', tint: '#000', installEvt: null };
function haptic(kind) { try { if (!navigator.vibrate) return; navigator.vibrate(kind === 'heavy' ? 18 : kind === 'ok' ? [8, 40, 8] : kind === 'err' ? [20, 30, 20] : 6); } catch (e) {} }
function isStandalone() { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }
function isIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }

/* ---------- الشاشة: رأس بعنوان كبير ينكمش + جسم ---------- */
// opt: {title, sub, back (hash أو true), right: [nodes], noTitle}
function mscreen(opt, kids) {
  const nav = el('header', { class: 'mnav' });
  const bar = el('div', { class: 'bar' });
  if (opt.back) bar.appendChild(el('button', { type: 'button', class: 'mback', onclick: function () { haptic(); mback(opt.back); } }, [ico('chev'), el('span', { text: typeof opt.back === 'string' && opt.backLabel ? opt.backLabel : 'رجوع' })]));
  bar.appendChild(el('span', { class: 'ttl', text: opt.title || '' }));
  bar.appendChild(el('span', { class: 'sp' }));
  (opt.right || []).forEach(function (n) { if (n) bar.appendChild(n); });
  nav.appendChild(bar);
  if (opt.title && !opt.noTitle) nav.appendChild(el('h1', { class: 'big', text: opt.title }));
  if (opt.sub) nav.appendChild(el('p', { class: 'sub', text: opt.sub }));
  const body = el('div', { class: 'mbody' }, kids || []);
  const sc = el('section', { class: 'mscreen' + (M.dir === 'back' ? ' back' : '') }, [nav, body]);
  // لا ينكمش العنوان إلا إن بقي بعده مجال للتمرير، وإلا تذبذب: الانكماش يقصّر الصفحة فيرجع التمرير فيعود العنوان
  const onScroll = function () { const on = nav.classList.contains('scrolled'), room = document.documentElement.scrollHeight - innerHeight; nav.classList.toggle('scrolled', on ? window.scrollY > 4 : window.scrollY > 24 && room > 130); };
  window.addEventListener('scroll', onScroll, { passive: true }); LEAVE.push(function () { window.removeEventListener('scroll', onScroll); });
  setTimeout(onScroll, 0);
  return { node: sc, body: body, nav: nav };
}
function mback(to) { if (typeof to === 'string') { M.dir = 'back'; go(to); } else history.back(); }
// سحب من حافة الشاشة (اليمنى في العربية) للرجوع
(function () {
  let sx = 0, sy = 0, on = false, t0 = 0;
  document.addEventListener('touchstart', function (e) { const t = e.touches[0]; on = t.clientX > innerWidth - 24 && !document.body.classList.contains('in-editor') && !document.querySelector('.msheet-wrap'); sx = t.clientX; sy = t.clientY; t0 = Date.now(); }, { passive: true });
  document.addEventListener('touchend', function (e) { if (!on) return; on = false; const t = e.changedTouches[0]; if (sx - t.clientX > 70 && Math.abs(t.clientY - sy) < 60 && Date.now() - t0 < 600) { const b = document.querySelector('.mback'); if (b) { haptic(); b.click(); } } }, { passive: true });
})();

/* ---------- شريط التبويب ---------- */
const MTABS = [['#/', 'home', 'الرئيسية', 'home'], ['#/tpl', 'tpl', 'القوالب', 'grid'], ['+', 'plus', 'إنشاء', 'plus'], ['#/cal', 'cal', 'التقويم', 'cal'], ['#/more', 'more', 'المزيد', 'more']];
function buildTab() {
  const tb = $('#mtab'); if (!tb) return; tb.hidden = false; tb.innerHTML = '';
  MTABS.forEach(function (t) {
    if (t[0] === '+') { tb.appendChild(el('a', { href: '#', class: 'plus', 'aria-label': 'إنشاء', onclick: function (e) { e.preventDefault(); haptic(); createSheet(); } }, [el('span', { class: 'pl' }, [ico('plus')]), el('span', { text: t[2] })])); return; }
    tb.appendChild(el('a', { href: t[0], 'data-r': t[1], onclick: function () { haptic(); M.dir = 'fwd'; }, 'aria-label': t[2] }, [ico(t[3]), el('span', { text: t[2] })]));
  });
  markTab();
}
function markTab() { const pg = document.body.dataset.page || ''; $$('#mtab a').forEach(function (a) { a.classList.toggle('on', a.dataset.r === pg); }); }
window.addEventListener('hashchange', function () { setTimeout(markTab, 0); });

/* ---------- الورقة السفلية (تحل محل modal) ---------- */
// opt كما في modal: {title, body, acts, wide, sticky, onClose, noFocus}؛ ويضاف: detent: 'auto'|'full'
function msheet(opt) {
  const wrap = el('div', { class: 'msheet-wrap' }), sheet = el('div', { class: 'msheet' });
  let closed = false;
  const close = function () { if (closed) return; closed = true; wrap.classList.remove('on'); document.removeEventListener('keydown', esc); setTimeout(function () { wrap.remove(); if (!document.querySelector('.msheet-wrap')) document.body.classList.remove('sheet-up'); if (opt.onClose) opt.onClose(); }, 420); };
  const esc = function (e) { if (e.key === 'Escape') close(); };
  const hd = el('div', { class: 'shd' }, [el('span', { style: 'width:30px' }), el('h3', { text: opt.title || '' }), el('button', { type: 'button', class: 'sx', 'aria-label': 'إغلاق', onclick: close }, [ico('close')])]);
  const body = el('div', { class: 'sbody' }, (opt.body || []).filter(Boolean));
  sheet.append(el('div', { class: 'grab' }), hd, body);
  // زر «إغلاق/إلغاء» بلا فعل مكرر لزر الإغلاق في الرأس، فنحذفه حين يوجد زر رئيسي
  let acts = (opt.acts || []).filter(Boolean);
  const isClose = function (a) { return !a.fn && /^(إغلاق|إلغاء)$/.test(a.t); };
  if (acts.some(function (a) { return /dark/.test(a.cls || ''); }) || acts.every(isClose)) acts = acts.filter(function (a) { return !isClose(a); });
  if (acts.length) sheet.appendChild(el('div', { class: 'sacts' }, acts.map(function (a) { return el('button', { type: 'button', class: 'btn ' + (a.cls || ''), text: a.t, onclick: function () { haptic(); if (a.fn && a.fn(close) === false) return; if (!a.keep) close(); } }); })));
  // سحب المقبض للإغلاق
  let sy = 0, dy = 0, drag = false;
  const down = function (e) { if (body.contains(e.target) && body.scrollTop > 0) return; sy = (e.touches ? e.touches[0] : e).clientY; drag = true; sheet.classList.add('dragging'); };
  const move = function (e) { if (!drag) return; dy = Math.max(0, (e.touches ? e.touches[0] : e).clientY - sy); if (dy > 4 && body.contains(e.target) && body.scrollTop > 0) { drag = false; sheet.classList.remove('dragging'); sheet.style.transform = ''; return; } sheet.style.transform = 'translateY(' + dy + 'px)'; if (dy > 4 && e.cancelable) e.preventDefault(); };
  const up = function () { if (!drag) return; drag = false; sheet.classList.remove('dragging'); if (dy > 110) { haptic(); close(); } else sheet.style.transform = ''; dy = 0; };
  sheet.addEventListener('touchstart', down, { passive: true }); sheet.addEventListener('touchmove', move, { passive: false }); sheet.addEventListener('touchend', up);
  wrap.addEventListener('mousedown', function (e) { if (e.target === wrap && !opt.sticky) close(); });
  wrap.addEventListener('touchend', function (e) { if (e.target === wrap && !opt.sticky) close(); });
  document.addEventListener('keydown', esc);
  wrap.appendChild(sheet); (document.fullscreenElement || document.body).appendChild(wrap); document.body.classList.add('sheet-up');
  requestAnimationFrame(function () { requestAnimationFrame(function () { wrap.classList.add('on'); }); });
  haptic();
  if (!opt.noFocus) setTimeout(function () { const f = body.querySelector('input:not([type=checkbox]):not([type=date]):not([type=time]),textarea'); if (f && f.type !== 'search') f.focus({ preventScroll: true }); }, 450);
  return { close: close, box: sheet };
}
/* ---------- ورقة الإجراءات (تحل محل popMenu) ---------- */
function mactions(anchor, items, title) {
  $$('.mact').forEach(function (x) { x.remove(); });
  items = items.filter(Boolean);
  const wrap = el('div', { class: 'mact' });
  const close = function () { wrap.classList.remove('on'); setTimeout(function () { wrap.remove(); }, 260); };
  const grp = el('div', { class: 'grp' });
  if (title) grp.appendChild(el('div', { class: 'hd', text: title }));
  items.forEach(function (it) {
    if (it === '-') return;
    if (it.hd) { grp.appendChild(el('div', { class: 'hd', text: it.hd })); return; }
    grp.appendChild(el(it.href ? 'a' : 'button', { type: it.href ? null : 'button', href: it.href || null, class: it.danger ? 'danger' : '', onclick: function () { haptic(); close(); if (it.fn) it.fn(); } }, [it.sw ? el('i', { class: 'sw', style: 'display:inline-block;width:12px;height:12px;border-radius:50%;background:' + it.sw }) : (it.ic ? ico(it.ic) : null), el('span', { text: it.t })]));
  });
  wrap.append(grp, el('div', { class: 'grp' }, [el('button', { type: 'button', class: 'cancel', text: 'إلغاء', onclick: close })]));
  wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
  document.body.appendChild(wrap); requestAnimationFrame(function () { requestAnimationFrame(function () { wrap.classList.add('on'); }); });
  haptic();
  return wrap;
}
// الاستبدال: كل ما في المنصة من نوافذ وقوائم يصير بأسلوب الجوال
modal = msheet;
popMenu = mactions;
closeModals = function () { $$('.msheet-wrap,.mact,.modal,.menu').forEach(function (m) { m.remove(); }); document.body.classList.remove('sheet-up'); };
/* ---------- ورقة الإنشاء (زر +) ---------- */
function createSheet() {
  const tid = ls('lastTrack') && TRACKS[ls('lastTrack')] ? ls('lastTrack') : (tracksOf()[0] || {}).id;
  mactions(null, [
    { t: 'اصنع إعلانك بالمساعد الذكي', ic: 'ai', fn: function () { go('#/make' + (tid ? '?tid=' + tid : '')); } },
    { t: 'من قالب جاهز', ic: 'grid', fn: function () { go('#/tpl'); } },
    tid ? { t: 'صفحة بيضاء', ic: 'wand', fn: function () { go('#/e/' + tid + '/blank'); } } : null,
    tid && can('slides') ? { t: 'عرض شرائح', ic: 'slides', fn: function () { go('#/s/' + tid); } } : null,
    { t: 'مهمة جديدة في التقويم', ic: 'check', fn: function () { go('#/cal'); setTimeout(function () { if (typeof taskDialog === 'function') taskDialog(null, new Date()); }, 700); } }
  ], 'ماذا تريد أن تصنع؟');
}
/* ---------- عناصر جاهزة ---------- */
function mgroup(rows, head, foot) {
  const g = el('div', { class: 'mgroup' }, rows.filter(Boolean).map(function (r) {
    const inner = [r.ic ? el('span', { class: 'mi', style: 'background:' + (r.color || '#8e8e93') }, [ico(r.ic)]) : null, el('span', { class: 'mt' }, [el('b', { text: r.t }), r.sub ? el('small', { text: r.sub }) : null]), r.value != null ? el('span', { class: 'mv', text: r.value }) : null, r.node || null, r.toggle != null ? el('input', { type: 'checkbox', class: 'msw', checked: !!r.toggle, onchange: function (e) { haptic(); if (r.onToggle) r.onToggle(e.target.checked, e.target); } }) : (r.href || r.fn ? ico('chev', 'chev') : null)];
    const a = el(r.href ? 'a' : (r.fn ? 'button' : 'div'), { class: 'mrow' + (r.ic ? '' : ' noicon'), href: r.href || null, type: r.fn ? 'button' : null, onclick: r.fn ? function () { haptic(); r.fn(); } : (r.href ? function () { haptic(); M.dir = 'fwd'; } : null) }, inner);
    return a;
  }));
  return el('div', {}, [head ? el('div', { class: 'mhead', text: head }) : null, g, foot ? el('div', { class: 'mfoot', text: foot }) : null]);
}
function msection(title, moreHref, kids) { return el('section', { class: 'msec' }, [el('div', { class: 'mh' }, [el('h3', { text: title }), moreHref ? el('a', { href: moreHref, text: 'الكل', onclick: function () { M.dir = 'fwd'; } }) : null])].concat(kids || [])); }
function mempty(icon, text, act) { return el('div', { class: 'mempty' }, [ico(icon || 'info'), el('p', { text: text }), act || null]); }
// سحب للتحديث على الشاشة الحالية
function pullToRefresh(sc, fn) {
  const ind = el('div', { class: 'mptr' }, [el('span', { class: 'spin' })]); sc.node.insertBefore(ind, sc.body);
  let sy = 0, pulling = false, armed = false;
  sc.node.addEventListener('touchstart', function (e) { if (window.scrollY <= 0 && !document.body.classList.contains('sheet-up')) { sy = e.touches[0].clientY; pulling = true; armed = false; } }, { passive: true });
  sc.node.addEventListener('touchmove', function (e) { if (!pulling) return; const d = e.touches[0].clientY - sy; if (d > 0) { ind.style.height = Math.min(70, d / 2) + 'px'; if (d > 120 && !armed) { armed = true; haptic(); } } }, { passive: true });
  sc.node.addEventListener('touchend', async function () { if (!pulling) return; pulling = false; if (armed) { ind.style.height = '60px'; try { await fn(); } catch (e) {} } ind.style.height = '0px'; });
}
