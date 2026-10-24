/* ================= التقويم والمهام: ما جُدول للقناة، وما كُلّفت به، في شهر وأسبوع ويوم وقائمة =================
   المنشورات من طابور تليجرام (tgq)، والمهام من tasks.json. المنشور يظهر بعنوان تصميمه، والنقر عليه يفتح التصميم
   (أو تفاصيل النشر إن لم يكن له تصميم محفوظ يصل إليه). سحب العنصر إلى يوم أو ساعة أخرى يغيّر موعده.
   كل تغيير يُظهر حاله: الزر يشتغل ثم يعلن «تم»، والبطاقة تومض. */
const CAL = { view: ls('calView') || 'month', mode: ls('calMode') || 'h', cursor: null, posts: [], tasks: [], status: 'all', showDone: false, loaded: false, lprog: null, q: '', range: 'up' };
const TG_STATUS = { queued: ['مجدول', 'bl', 'clock'], sent: ['أُرسل', 'gr', 'check'], failed: ['فشل', 'rd', 'close'], cancelled: ['أُلغي', '', 'close'] };
const REMIND_OPTS = [['', 'بلا تذكير'], ['0', 'عند الموعد'], ['10', 'قبل ١٠ دقائق'], ['60', 'قبل ساعة'], ['1440', 'قبل يوم']];
function dayKey6(t) { const d = new Date(t); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function sameDay6(a, b) { return dayKey6(a) === dayKey6(b); }
function hm6(t) { try { return new Intl.DateTimeFormat('ar', { hour: 'numeric', minute: '2-digit' }).format(new Date(t)); } catch (e) { return ''; } }
function dayTitle6(d) { return WD[d.getDay()] + ' ' + new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long' }).format(d) + (hijriParts(d) ? ' · ' + hijriParts(d).d + ' ' + hijriMonthName(d) : ''); }
function progName6(id) { const p = ((V6.bundle && V6.bundle.programs) || []).find(function (x) { return x.id === id; }); return p ? p.name : (id || ''); }
function remindLabel(m) { const o = REMIND_OPTS.find(function (x) { return x[0] === String(m); }); return o && o[0] !== '' ? 'تذكير ' + o[1] : ''; }
// البرنامج الذي تعرضه القائمة: البرنامج الحالي، أو غيره/كلها لمن له أكثر من برنامج
function calPid() { return CAL.view === 'list' && CAL.lprog != null ? CAL.lprog : (V6.prog ? V6.prog.id : ''); }

async function calLoad(force, pid) {
  if (pid == null) pid = V6.prog ? V6.prog.id : '';
  if (CAL.loaded && !force && CAL.pid === pid && POSTS !== null && Date.now() - (CAL.at || 0) < 120000) return;
  const [posts, tasks] = await Promise.all([
    V6.settings && V6.settings.tg ? API6.me('tg_queue', pid).catch(function () { return []; }) : Promise.resolve([]),
    API6.me('task_list', pid).catch(function () { return []; })
  ]);
  CAL.posts = posts; CAL.tasks = tasks.filter(function (t) { return t.status !== 'deleted'; }); CAL.loaded = true; CAL.at = Date.now(); CAL.pid = pid;
  if (!V6.prog || pid === V6.prog.id) { POSTS = posts; POSTS_BY_DAY = {}; posts.forEach(function (x) { if (x.status !== 'queued') return; (POSTS_BY_DAY[new Date(x.when).toDateString()] = POSTS_BY_DAY[new Date(x.when).toDateString()] || []).push(x); }); }
}
function postShown(x) { return CAL.status === 'all' ? x.status !== 'cancelled' : x.status === CAL.status; }
function calItems(day) {
  const posts = CAL.posts.filter(function (x) { return sameDay6(x.when, day) && postShown(x); }).map(function (x) { return { kind: 'post', t: x.when, x: x }; });
  const tasks = CAL.tasks.filter(function (t) { return t.due && sameDay6(t.due, day) && (CAL.showDone || t.status !== 'done'); }).map(function (t) { return { kind: 'task', t: t.due, x: t }; });
  return posts.concat(tasks).sort(function (a, b) { return a.t - b.t; });
}
// النقر على منشور: يفتح تصميمه إن كان محفوظاً ويصل إليه (صاحبه أو مشرف البرنامج)، وإلا تفاصيل النشر
function canOpenDesign(x) { return !!(x.item && (x.mine || x.canEdit)); }
function openPost(x) { if (canOpenDesign(x)) { closeModals(); go('#/d/' + x.item); } else postDialog(x); }
function canMovePost(x) { return x.status === 'queued' && x.canEdit !== false; }
// عنصر يُنقر بالفأرة واللوحة (بديل الزر حين يحتوي زراً آخر)
function pressable(node, fn) {
  node.setAttribute('role', 'button'); node.tabIndex = 0;
  node.addEventListener('click', function (e) { if (node._drag) return; fn(e); });
  node.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === node) { e.preventDefault(); fn(e); } });
  return node;
}
function postDetailsBtn(x) { return el('button', { type: 'button', class: 'ib sm cmore6', title: 'الموعد والنص', 'aria-label': 'الموعد والنص', onclick: function (e) { e.stopPropagation(); postDialog(x); } }, [ico('more')]); }
function taskIcons(t) { return [t.repeat ? ico('history', 'crep') : null, t.remind != null && t.due ? ico('bell', 'crep') : null]; }

/* ---------- الصفحة ---------- */
function showCal6() {
  const q = location.hash.split('?')[1] || '', qs = {}; q.split('&').forEach(function (p) { const kv = p.split('='); if (kv[0]) qs[kv[0]] = decodeURIComponent(kv[1] || ''); });
  document.title = 'التقويم والمهام';
  if (qs.view && ['month', 'week', 'day', 'list'].indexOf(qs.view) >= 0) { CAL.view = qs.view; ls('calView', qs.view); }
  // روابط «منشورات القناة» في الإدارة: كل البرامج، كل السجل، حال معيّنة
  if (qs.prog) CAL.lprog = qs.prog === 'all' ? '' : qs.prog;
  if (qs.range === 'all' || qs.range === 'up') CAL.range = qs.range;
  if (qs.status && TG_STATUS[qs.status]) CAL.status = qs.status;
  if (!CAL.cursor || qs.d) { const d = qs.d ? fromISO(qs.d, '12:00') : new Date(); CAL.cursor = d || new Date(); CAL.cursor.setHours(12, 0, 0, 0); }
  const body = el('div', { class: 'calbody' }), title = el('h2', { class: 'caltitle' });
  const viewSeg = el('div', { class: 'calviews' });
  function drawViewSeg() { viewSeg.replaceChildren(segOf([['month', 'شهر'], ['week', 'أسبوع'], ['day', 'يوم'], ['list', 'قائمة']], CAL.view, function (v) { setView(v); })); }
  function setView(v) { CAL.view = v; ls('calView', v); drawViewSeg(); draw(); }
  CAL.setView = setView;
  drawViewSeg();
  const modeSeg = segOf([['h', 'هجري'], ['g', 'ميلادي']], CAL.mode, function (v) { CAL.mode = v; ls('calMode', v); draw(); });
  const statusSel = el('select', { class: 'inp sm', 'aria-label': 'الحالة', onchange: function (e) { CAL.status = e.target.value; draw(); } }, [['all', 'كل المنشورات'], ['queued', 'المجدولة'], ['sent', 'المرسلة'], ['failed', 'ما فشل'], ['cancelled', 'الملغاة']].map(function (o) { return el('option', { value: o[0], text: o[1], selected: CAL.status === o[0] }); }));
  const doneTog = el('label', { class: 'tog tiny' }, [el('input', { type: 'checkbox', checked: CAL.showDone, onchange: function (e) { CAL.showDone = e.target.checked; draw(); } }), el('span', { text: 'أظهر المهام المنجزة' })]);
  const nav = el('div', { class: 'calnav' }, [
    el('button', { type: 'button', class: 'ib', 'aria-label': 'السابق', onclick: function () { step(-1); } }, [ico('chev')]),
    el('button', { type: 'button', class: 'btn sm line', text: 'اليوم', onclick: function () { CAL.cursor = new Date(); CAL.cursor.setHours(12, 0, 0, 0); draw(); } }),
    el('button', { type: 'button', class: 'ib nx', 'aria-label': 'التالي', onclick: function () { step(1); } }, [ico('chev')])
  ]);
  function step(k) {
    const c = CAL.cursor;
    if (CAL.view === 'list') return;
    if (CAL.view === 'day') c.setDate(c.getDate() + k);
    else if (CAL.view === 'week') c.setDate(c.getDate() + 7 * k);
    else if (CAL.mode === 'g') c.setMonth(c.getMonth() + k, 1);
    else { let x = hijriFirst(c); x = hijriFirst(new Date(x.getTime() + (k > 0 ? 31 : -1) * 864e5)); CAL.cursor = x; }
    draw();
  }
  CAL.step = step;
  // على الهاتف: خيارات العرض (هجري/ميلادي، الحال، المنجزة) خلف زر واحد، ونقطة عليه إن كان فيها تصفية
  const opts = el('div', { class: 'calopts' }, [modeSeg, statusSel, doneTog]);
  const filt = el('button', { type: 'button', class: 'ib calfilt', title: 'خيارات العرض', 'aria-label': 'خيارات العرض', 'aria-expanded': 'false', onclick: function () { const on = bar.classList.toggle('optsopen'); filt.setAttribute('aria-expanded', on ? 'true' : 'false'); } }, [ico('gear')]);
  const bar = el('div', { class: 'calbar rv' }, [nav, title, el('span', { class: 'sp' }), viewSeg, opts, filt]);
  const legend = el('div', { class: 'callegend tiny' }, [['bl', 'مجدول'], ['gr', 'أُرسل'], ['rd', 'فشل'], ['or', 'مهمة'], ['mu', 'منجز']].map(function (l) { return el('span', {}, [el('i', { class: 'ldot ' + l[0] }), l[1]]); }));
  view(el('div', { class: 'wrap page calpage' }, [
    el('div', { class: 'phead row wrapr' }, [
      el('div', {}, [el('span', { class: 'eyebrow rv', text: V6.prog ? V6.prog.name : '' }), H('h1', 'التقويم والمهام'), el('p', { class: 'muted rv', text: 'منشورات القناة ومهامك في مكان واحد. انقر المنشور لتفتح تصميمه، واسحب أي عنصر لتغيير موعده.' })]),
      el('span', { class: 'sp' }),
      el('div', { class: 'row wrapr' }, [
        el('button', { type: 'button', class: 'btn dark', onclick: function () { taskDialog(null, CAL.cursor); } }, [ico('plus'), 'مهمة جديدة']),
        el('a', { class: 'btn line', href: '#/', title: 'صمّم إعلاناً ثم جدوله من «النص والقناة»' }, [ico('send'), 'منشور جديد'])
      ])
    ]),
    bar,
    legend,
    body
  ]));
  swipeNav(body, step);
  let drawing = 0;
  async function draw() {
    const my = ++drawing;
    nav.classList.toggle('off', CAL.view === 'list'); bar.classList.toggle('listv', CAL.view === 'list');
    filt.classList.toggle('dot-badge', CAL.status !== 'all' || CAL.showDone);
    body.innerHTML = ''; body.appendChild(loader6('نجهّز التقويم…', true));
    try { await calLoad(true, calPid()); } catch (e) { body.innerHTML = ''; body.appendChild(el('p', { class: 'err', text: e.message })); return; }
    if (my !== drawing) return;
    body.innerHTML = ''; body.dataset.view = CAL.view;
    if (CAL.view === 'month') drawMonth(body, title); else if (CAL.view === 'week') drawWeek(body, title); else if (CAL.view === 'day') drawDay(body, title); else drawList(body, title);
    revealAll(body);
    if (qs.task) { const t = CAL.tasks.find(function (x) { return x.id === qs.task; }); if (t) { taskDialog(t); qs.task = ''; } }
    if (qs.post) { const p = CAL.posts.find(function (x) { return x.id === qs.post; }); if (p) { postDialog(p); qs.post = ''; } }
  }
  CAL.redraw = draw;
  draw();
}
// السحب الأفقي باللمس يتنقّل بين الأيام والأسابيع والأشهر (لا يبدأ من الحافة حتى لا يزاحم سحب الرجوع)
function swipeNav(node, step) {
  let x0 = 0, y0 = 0, t0 = 0, on = false;
  node.addEventListener('touchstart', function (e) { const t = e.touches[0]; on = e.touches.length === 1 && t.clientX > 28 && t.clientX < innerWidth - 28 && !e.target.closest('input,select,textarea,.dvscroll.dragging'); x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); }, { passive: true });
  node.addEventListener('touchend', function (e) {
    if (!on || CAL.view === 'list') return; on = false;
    const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.abs(dx) > 70 && Math.abs(dy) < Math.abs(dx) * 0.5 && Date.now() - t0 < 700) { if (typeof haptic === 'function') haptic(); step(dx > 0 ? 1 : -1); }
  }, { passive: true });
}
function hijriFirst(d) { let x = new Date(d); x.setHours(12, 0, 0, 0); while (hijriParts(x) && hijriParts(x).d !== 1) x = new Date(x.getTime() - 864e5); return x; }
function monthDays6() {
  const c = CAL.cursor, days = [];
  if (CAL.mode === 'g') { const first = new Date(c.getFullYear(), c.getMonth(), 1, 12); for (let x = new Date(first); x.getMonth() === first.getMonth(); x.setDate(x.getDate() + 1)) days.push(new Date(x)); return { days: days, title: new Intl.DateTimeFormat('ar-u-nu-latn', { month: 'long', year: 'numeric' }).format(first) }; }
  const x = hijriFirst(c), hp = hijriParts(x); if (!hp) { CAL.mode = 'g'; return monthDays6(); }
  for (let y = new Date(x); hijriParts(y).m === hp.m; y = new Date(y.getTime() + 864e5)) days.push(new Date(y));
  return { days: days, title: hijriMonthName(x) + ' ' + hp.y + ' هـ' };
}
function narrow6() { return innerWidth <= 700 || document.body.classList.contains('mapp'); }
function openDay(d) { CAL.cursor = new Date(d); CAL.cursor.setHours(12, 0, 0, 0); if (CAL.setView) CAL.setView('day'); }

/* ---------- عرض الشهر ---------- */
function drawMonth(body, title) {
  const M = monthDays6(); title.textContent = M.title;
  const grid = el('div', { class: 'cgrid' });
  ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].forEach(function (w) { grid.appendChild(el('div', { class: 'cgh', text: w })); });
  const lead = (M.days[0].getDay() + 1) % 7;
  for (let k = 0; k < lead; k++) grid.appendChild(el('div', { class: 'cgd empty' }));
  const today = new Date();
  M.days.forEach(function (d, i) {
    const items = calItems(d), isT = sameDay6(d, today), past = d < today && !isT;
    const hp = hijriParts(d), big = CAL.mode === 'g' ? d.getDate() : (hp ? hp.d : d.getDate()), small = CAL.mode === 'g' ? (hp ? hp.d + ' ' + hijriMonthName(d) : '') : new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long' }).format(d);
    const cell = el('div', { class: 'cgd rv' + (isT ? ' today' : '') + (past ? ' past' : '') + (d.getDay() === 5 ? ' fri' : ''), style: '--d:' + Math.min(i % 7, 6), 'data-day': dayKey6(d) }, [
      el('div', { class: 'cgtop' }, [el('b', { class: 'cgn', text: String(big) }), el('small', { class: 'tiny', text: small }), el('span', { class: 'sp' }),
        el('button', { type: 'button', class: 'ib sm cgadd', title: 'مهمة في هذا اليوم', 'aria-label': 'مهمة في هذا اليوم', onclick: function (e) { e.stopPropagation(); taskDialog(null, d); } }, [ico('plus')])]),
      el('div', { class: 'cgitems' }, items.slice(0, 4).map(calChip).concat(items.length > 4 ? [el('button', { type: 'button', class: 'cgmore', text: '+' + (items.length - 4) + ' أخرى', onclick: function (e) { e.stopPropagation(); narrow6() ? openDay(d) : dayDialog(d); } })] : []))
    ]);
    // على الهاتف النقاط صغيرة: النقر يفتح اليوم كاملاً
    cell.addEventListener('click', function (e) { if (!narrow6() && e.target.closest('.cchip,.cgadd,.cgmore')) return; if (narrow6()) openDay(d); else dayDialog(d); });
    dropTarget(cell, d);
    grid.appendChild(cell);
  });
  body.appendChild(grid);
  const n = CAL.posts.filter(function (x) { return x.status === 'queued' && M.days.some(function (d) { return sameDay6(d, x.when); }); }).length, nt = CAL.tasks.filter(function (t) { return t.status !== 'done' && t.due && M.days.some(function (d) { return sameDay6(d, t.due); }); }).length;
  body.appendChild(el('p', { class: 'tiny calsum', text: (n ? n + ' منشوراً مجدولاً' : 'لا منشورات مجدولة') + ' · ' + (nt ? nt + ' مهمة مفتوحة' : 'لا مهام مفتوحة') + ' في هذا الشهر.' + (!n && !nt ? ' صمّم إعلاناً ثم جدوله من «النص والقناة»، أو أضف مهمة.' : '') }));
}
// بطاقة صغيرة داخل خلية اليوم: المنشور بعنوان تصميمه وأيقونة حاله
function calChip(it) {
  if (it.kind === 'post') {
    const x = it.x, st = TG_STATUS[x.status] || ['', '', 'info'];
    const c = el('button', { type: 'button', class: 'cchip post ' + x.status, draggable: canMovePost(x) ? 'true' : null, title: (x.title || 'منشور') + ' · ' + hm6(x.when) + ' · ' + st[0] + (canOpenDesign(x) ? ' · انقر لفتح التصميم' : ''), onclick: function (e) { if (narrow6()) return; e.stopPropagation(); openPost(x); } }, [ico(st[2], 'cst'), el('span', { class: 'ctime', text: hm6(x.when) }), el('span', { class: 'ctitle', text: x.title || 'منشور' }), x.repeat ? ico('history', 'crep') : null]);
    if (canMovePost(x)) dragSource(c, 'post', x.id);
    return c;
  }
  const t = it.x, done = t.status === 'done';
  const c = el('button', { type: 'button', class: 'cchip task' + (done ? ' done' : '') + (t.prio === 'high' ? ' high' : ''), draggable: t.canEdit ? 'true' : null, title: t.title + (t.toName && t.to !== V6.me.uid ? ' — ' + t.toName : ''), onclick: function (e) { if (narrow6()) return; e.stopPropagation(); taskDialog(t); } }, [
    el('span', { class: 'tchk', role: 'checkbox', 'aria-checked': done ? 'true' : 'false', onclick: function (e) { e.stopPropagation(); toggleTask(t, c); } }, [ico('check')]),
    el('span', { class: 'ctitle', text: t.title }), !t.allDay && t.due ? el('span', { class: 'ctime', text: hm6(t.due) }) : null].concat(taskIcons(t)));
  if (t.canEdit) dragSource(c, 'task', t.id);
  return c;
}
async function toggleTask(t, chip) {
  if (!t.canDone) { toast('هذه المهمة ليست لك'); return; }
  const on = t.status !== 'done';
  try {
    const r = await API6.me('task_done', t.id, on), next = r.next; delete r.next; Object.assign(t, r);
    if (chip) { chip.classList.toggle('done', on); const k = chip.querySelector('.tchk'); if (k) k.setAttribute('aria-checked', on ? 'true' : 'false'); flashOk(chip); }
    if (on) chime6();
    if (next) { CAL.tasks.unshift(next); toast('أُنجزت ✓ والتالية ' + fmtTime(next.due)); CAL.flash = next.id; if (CAL.redraw && $('.calpage')) setTimeout(CAL.redraw, 650); }
    else toast(on ? 'أُنجزت ✓' : 'أُعيدت مفتوحة');
  } catch (e) { toast(e.message); }
}

/* ---------- السحب والإفلات: نقل منشور أو مهمة إلى يوم آخر ---------- */
function dragSource(node, kind, id) {
  node.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', kind + ':' + id); e.dataTransfer.effectAllowed = 'move'; node.classList.add('dragging'); document.body.classList.add('cal-dragging'); });
  node.addEventListener('dragend', function () { node.classList.remove('dragging'); document.body.classList.remove('cal-dragging'); $$('.cgd.over,.cwcol.over').forEach(function (x) { x.classList.remove('over'); }); });
}
function dropTarget(cell, day) {
  cell.addEventListener('dragover', function (e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; cell.classList.add('over'); });
  cell.addEventListener('dragleave', function () { cell.classList.remove('over'); });
  cell.addEventListener('drop', async function (e) {
    e.preventDefault(); cell.classList.remove('over');
    const d = (e.dataTransfer.getData('text/plain') || '').split(':'), kind = d[0], id = d.slice(1).join(':');
    if (kind === 'post') { const x = CAL.posts.find(function (p) { return p.id === id; }); if (x) moveDialog(x, day); }
    else if (kind === 'task') { const t = CAL.tasks.find(function (p) { return p.id === id; }); if (t) moveTaskTo(t, day); }
  });
}
// نقل منشور: نؤكد اليوم الجديد ونتيح تغيير الساعة
function moveDialog(x, day) {
  if (sameDay6(x.when, day)) return;
  const old = new Date(x.when), tI = el('input', { type: 'time', class: 'inp sm', value: localHM(old), 'aria-label': 'الوقت' });
  const target = new Date(day); target.setHours(old.getHours(), old.getMinutes(), 0, 0);
  const note = el('p', { class: 'muted small', text: 'ينتقل «' + (x.title || 'المنشور') + '» من ' + fmtTime(x.when) + ' إلى ' + dayTitle6(target) + '.' });
  modal({ title: 'نقل المنشور', body: [note, el('div', { class: 'row' }, [el('span', { class: 'tiny', text: 'الساعة' }), tI])], acts: [{ t: 'انقله', cls: 'dark', keep: true, fn: function (close) {
    const b = $$('.modal .acts .btn.dark, .msheet .sacts .btn.dark').pop(); const when = fromISO(dayKey6(day), tI.value || localHM(old)).getTime();
    if (when < Date.now() + 60000) { toast('اختر موعداً في المستقبل'); return false; }
    withBusy(b, async function () { const r = await API6.me('tg_update', JSON.stringify({ id: x.id, when: when })); Object.assign(x, r); POSTS = null; CAL.flash = x.id; }, { busy: 'ننقل…', done: 'نُقل' }).then(function () { setTimeout(function () { close(); CAL.redraw(); }, 500); }).catch(function () {});
    return false;
  } }, { t: 'إلغاء' }] });
}
async function moveTaskTo(t, day) {
  if (t.due && sameDay6(t.due, day)) return;
  const old = t.due ? new Date(t.due) : new Date(); const d = new Date(day); d.setHours(t.allDay ? 9 : old.getHours(), t.allDay ? 0 : old.getMinutes(), 0, 0);
  try { const r = await API6.me('task_save', JSON.stringify(Object.assign({}, t, { due: d.getTime() }))); Object.assign(t, r); toast('نُقلت المهمة إلى ' + dayTitle6(d)); CAL.flash = t.id; CAL.redraw(); } catch (e) { toast(e.message); }
}

/* ---------- عرض الأسبوع ---------- */
function weekDays6(c) { const back = (c.getDay() + 1) % 7, start = new Date(c); start.setDate(c.getDate() - back); start.setHours(12, 0, 0, 0); const days = []; for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d); } return days; }
function drawWeek(body, title) {
  const days = weekDays6(new Date(CAL.cursor));
  title.textContent = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long' }).format(days[0]) + ' — ' + new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(days[6]);
  const wrap = el('div', { class: 'cweek' }), today = new Date();
  days.forEach(function (d, i) {
    const items = calItems(d), hp = hijriParts(d);
    const col = el('div', { class: 'cwcol rv' + (sameDay6(d, today) ? ' today' : '') + (d.getDay() === 5 ? ' fri' : ''), style: '--d:' + i }, [
      el('div', { class: 'cwh' }, [el('button', { type: 'button', class: 'cwday', title: 'اعرض اليوم بساعاته', onclick: function () { openDay(d); } }, [el('b', { text: WD[d.getDay()] }), el('span', { class: 'tiny', text: new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'short' }).format(d) + (hp ? ' · ' + hp.d + ' ' + hijriMonthName(d) : '') })]), el('span', { class: 'sp' }), el('button', { type: 'button', class: 'ib sm', title: 'مهمة', 'aria-label': 'مهمة', onclick: function () { taskDialog(null, d); } }, [ico('plus')])]),
      el('div', { class: 'cwitems' }, items.length ? items.map(weekCard) : [el('p', { class: 'tiny empty', text: 'فارغ' })])
    ]);
    dropTarget(col, d); wrap.appendChild(col);
  });
  body.appendChild(wrap);
  flashPending(body);
}
function weekCard(it) {
  if (it.kind === 'post') {
    const x = it.x, st = TG_STATUS[x.status] || ['', '', 'info'], other = V6.prog && x.program && x.program !== V6.prog.id;
    const c = pressable(el('div', { class: 'ccard post ' + x.status + (canOpenDesign(x) ? ' opens' : ''), 'data-id': x.id, draggable: canMovePost(x) ? 'true' : null, title: canOpenDesign(x) ? 'انقر لفتح التصميم' : 'تفاصيل النشر' }, [
      el('span', { class: 'cst ' + st[1] }, [ico(st[2])]),
      el('div', { class: 'ccbody' }, [el('b', { text: x.title || 'منشور' }), el('span', { class: 'tiny', text: hm6(x.when) + ' · ' + st[0] + (x.repeat ? ' · ' + repeatLabel(x.repeat) : '') }), el('span', { class: 'tiny ccby', text: (x.name || '') + (other ? ' · ' + progName6(x.program) : '') })]),
      postDetailsBtn(x)
    ]), function () { openPost(x); });
    if (canMovePost(x)) dragSource(c, 'post', x.id);
    return c;
  }
  const t = it.x, done = t.status === 'done', other = V6.prog && t.program && t.program !== V6.prog.id;
  const c = el('button', { type: 'button', class: 'ccard task' + (done ? ' done' : '') + (t.prio === 'high' ? ' high' : ''), 'data-id': t.id, draggable: t.canEdit ? 'true' : null, onclick: function () { taskDialog(t); } }, [
    el('span', { class: 'tchk', role: 'checkbox', 'aria-checked': done ? 'true' : 'false', onclick: function (e) { e.stopPropagation(); toggleTask(t, c); } }, [ico('check')]),
    el('div', { class: 'ccbody' }, [el('b', { text: t.title }), el('span', { class: 'tiny' }, [(t.due ? (t.allDay ? 'طوال اليوم' : hm6(t.due)) : 'بلا موعد') + (t.toName && t.to !== V6.me.uid ? ' · ' + t.toName : '') + (t.from !== V6.me.uid ? ' · من ' + t.fromName : '') + (other ? ' · ' + progName6(t.program) : '')].concat(taskIcons(t)))])]);
  if (t.canEdit) dragSource(c, 'task', t.id);
  return c;
}
// ومضة على العنصر الذي تغيّر للتو (نُقل أو وُلدت نسخته التالية)
function flashPending(root) { if (!CAL.flash) return; const n = root.querySelector('[data-id="' + CAL.flash + '"]'); CAL.flash = null; if (n) { setTimeout(function () { flashOk(n); }, 120); } }

/* ---------- عرض اليوم: الساعات، والمنشورات والمهام في مواضع أوقاتها ---------- */
function drawDay(body, title) {
  const day = new Date(CAL.cursor), today = new Date(), isT = sameDay6(day, today), H = narrow6() ? 48 : 52;
  title.textContent = (isT ? 'اليوم · ' : '') + dayTitle6(day);
  const items = calItems(day), allDay = items.filter(function (it) { return it.kind === 'task' && it.x.allDay; }), timed = items.filter(function (it) { return !(it.kind === 'task' && it.x.allDay); });
  // شريط الأسبوع: تنقّل سريع بين أيامه، ونقطة لما فيه شيء
  const strip = el('div', { class: 'dvstrip rv' }, weekDays6(day).map(function (d) {
    const has = calItems(d).length, hp = hijriParts(d), num = CAL.mode === 'g' || !hp ? d.getDate() : hp.d;
    return el('button', { type: 'button', class: 'dvsd' + (sameDay6(d, day) ? ' on' : '') + (sameDay6(d, today) ? ' today' : '') + (d.getDay() === 5 ? ' fri' : ''), 'aria-label': dayTitle6(d), onclick: function () { CAL.cursor = new Date(d); CAL.redraw(); } }, [el('small', { text: WD[d.getDay()].replace('ال', '') }), el('b', { text: String(num) }), el('i', { class: has ? 'on' : '' })]);
  }));
  const allRow = el('div', { class: 'dvall rv' }, [el('span', { class: 'dvlab tiny', text: 'طوال اليوم' }), el('div', { class: 'dvalli' }, allDay.length ? allDay.map(function (it) { return dayEvent(it, H, true); }) : [el('button', { type: 'button', class: 'dvadd tiny', onclick: function () { const d = new Date(day); d.setHours(9, 0, 0, 0); taskDialog(null, d, false, true); } }, [ico('plus'), 'مهمة لليوم كله'])])]);
  const grid = el('div', { class: 'dvgrid', style: '--hh:' + H + 'px;height:' + (24 * H) + 'px' });
  for (let h = 0; h < 24; h++) {
    const lab = new Date(day); lab.setHours(h, 0, 0, 0);
    const row = el('div', { class: 'dvh', style: 'top:' + (h * H) + 'px', 'data-h': h }, [el('span', { class: 'dvlab tiny', text: h ? new Intl.DateTimeFormat('ar', { hour: 'numeric' }).format(lab) : '' })]);
    grid.appendChild(row);
  }
  // النقر على ساعة فارغة يضيف مهمة في ذلك الوقت
  grid.addEventListener('click', function (e) {
    if (e.target.closest('.dvev')) return;
    const r = grid.getBoundingClientRect(), mins = Math.max(0, Math.min(23 * 60 + 30, Math.floor((e.clientY - r.top) / H * 2) * 30)), d = new Date(day); d.setHours(0, mins, 0, 0);
    taskDialog(null, d, true);
  });
  // المتداخلة في الوقت تُقسم أعمدةً متجاورة
  const MIN = Math.max(30, Math.ceil(30 * 60 / H)), evs = timed.map(function (it) { const d = new Date(it.t), s = d.getHours() * 60 + d.getMinutes(); return { it: it, s: s, e: s + MIN }; }).sort(function (a, b) { return a.s - b.s; });
  let cluster = [], ends = [], cend = -1;
  function flush() { cluster.forEach(function (v) { v.n = ends.length; }); cluster = []; ends = []; }
  evs.forEach(function (v) { if (v.s >= cend) { flush(); cend = -1; } let lane = ends.findIndex(function (e) { return e <= v.s; }); if (lane < 0) { lane = ends.length; ends.push(v.e); } else ends[lane] = v.e; v.lane = lane; cluster.push(v); cend = Math.max(cend, v.e); });
  flush();
  evs.forEach(function (v) { const n = dayEvent(v.it, H, false); n.style.top = (v.s * H / 60) + 'px'; n.style.height = (MIN * H / 60 - 3) + 'px'; n.style.setProperty('--lane', v.lane); n.style.setProperty('--lanes', v.n); grid.appendChild(n); });
  let now = null;
  if (isT) {
    now = el('div', { class: 'dvnow' }, [el('i')]);
    const place = function () { const d = new Date(); now.style.top = ((d.getHours() * 60 + d.getMinutes()) * H / 60) + 'px'; };
    place(); grid.appendChild(now);
    const tm = setInterval(function () { if (!now.isConnected) { clearInterval(tm); return; } place(); }, 60000);
  }
  const scroll = el('div', { class: 'dvscroll' }, [grid]);
  const empty = !items.length ? el('p', { class: 'tiny dvempty', text: 'لا شيء في هذا اليوم. انقر أي ساعة لتضيف مهمة فيها.' }) : null;
  body.appendChild(el('div', { class: 'dvwrap' }, [strip, allRow, empty, el('div', { class: 'dvbox rv' }, [scroll])]));
  // نبدأ قبل أول عنصر بساعة، أو قبل الساعة الحالية، أو الثامنة صباحاً
  const first = evs.length ? Math.floor(evs[0].s / 60) - 1 : (isT ? today.getHours() - 1 : 8);
  requestAnimationFrame(function () { scroll.scrollTop = Math.max(0, first * H - 12); edges(); });
  function edges() { scroll.classList.toggle('mtop', scroll.scrollTop > 4); scroll.classList.toggle('mbot', scroll.scrollTop + scroll.clientHeight < scroll.scrollHeight - 4); }
  scroll.addEventListener('scroll', edges, { passive: true });
  flashPending(body);
}
function dayEvent(it, H, allDay) {
  const x = it.x;
  if (it.kind === 'post') {
    const st = TG_STATUS[x.status] || ['', '', 'info'];
    const n = pressable(el('div', { class: 'dvev post ' + x.status + (canOpenDesign(x) ? ' opens' : ''), 'data-id': x.id, title: (x.title || 'منشور') + ' · ' + st[0] + (canOpenDesign(x) ? ' · انقر لفتح التصميم' : '') }, [
      ico(st[2], 'cst'), el('span', { class: 'dvt', text: hm6(x.when) }), el('b', { text: x.title || 'منشور' }), x.repeat ? ico('history', 'crep') : null, el('span', { class: 'sp' }), postDetailsBtn(x)
    ]), function () { openPost(x); });
    if (canMovePost(x)) dayDrag(n, it, H);
    return n;
  }
  const done = x.status === 'done';
  const n = pressable(el('div', { class: 'dvev task' + (done ? ' done' : '') + (x.prio === 'high' ? ' high' : '') + (allDay ? ' allday' : ''), 'data-id': x.id, title: x.title }, [
    el('span', { class: 'tchk', role: 'checkbox', 'aria-checked': done ? 'true' : 'false', onclick: function (e) { e.stopPropagation(); toggleTask(x, n); } }, [ico('check')]),
    allDay ? null : el('span', { class: 'dvt', text: hm6(x.due) }), el('b', { text: x.title }), x.toName && x.to !== V6.me.uid ? el('span', { class: 'tiny', text: x.toName }) : null].concat(taskIcons(x))), function () { taskDialog(x); });
  if (!allDay && x.canEdit) dayDrag(n, it, H);
  return n;
}
// السحب العمودي بالفأرة يغيّر الساعة (كل ربع ساعة). على اللمس النقر يفتح التعديل والتمرير يبقى للتمرير
function dayDrag(node, it, H) {
  node.classList.add('movable');
  node.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('.tchk,.cmore6')) return;
    const y0 = e.clientY, top0 = parseFloat(node.style.top) || 0, tip = el('span', { class: 'dvtip' }), scroll = node.closest('.dvscroll');
    let moved = false, mins = null;
    function mv(ev) {
      const dy = ev.clientY - y0; if (!moved && Math.abs(dy) < 5) return;
      if (!moved) { moved = true; node.classList.add('dragging'); if (scroll) scroll.classList.add('dragging'); node.appendChild(tip); }
      mins = Math.max(0, Math.min(24 * 60 - 15, Math.round((top0 + dy) / H * 4) * 15));
      node.style.top = (mins * H / 60) + 'px';
      const d = new Date(CAL.cursor); d.setHours(0, mins, 0, 0); tip.textContent = hm6(d);
    }
    function up() {
      document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up);
      if (!moved) return;
      node._drag = true; setTimeout(function () { node._drag = false; }, 60);
      node.classList.remove('dragging'); if (scroll) scroll.classList.remove('dragging'); tip.remove();
      const d = new Date(CAL.cursor); d.setHours(0, mins, 0, 0); moveToTime(it, d.getTime(), node);
    }
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
  });
}
async function moveToTime(it, when, node) {
  const x = it.x;
  if (Math.abs(when - it.t) < 60000) { CAL.redraw(); return; }
  if (it.kind === 'post' && when < Date.now() + 60000) { toast('اختر موعداً في المستقبل'); CAL.redraw(); return; }
  node.classList.add('saving');
  try {
    if (it.kind === 'post') { const r = await API6.me('tg_update', JSON.stringify({ id: x.id, when: when })); Object.assign(x, r); POSTS = null; }
    else { const r = await API6.me('task_save', JSON.stringify(Object.assign({}, x, { due: when, allDay: false }))); Object.assign(x, r); }
    toast((it.kind === 'post' ? 'نُقل المنشور إلى ' : 'نُقلت المهمة إلى ') + hm6(when)); CAL.flash = x.id;
  } catch (e) { toast(e.message); }
  CAL.redraw();
}

/* ---------- القائمة: زمنية، بالبحث والتصفية والتصدير (كانت «منشورات القناة» في الإدارة) ---------- */
function listItems6() {
  const now = Date.now(), from = now - 7 * 864e5, to = now + 60 * 864e5, all = CAL.range === 'all', q = norm6(CAL.q);
  const hit = function (s) { return !q || norm6(s).indexOf(q) >= 0; };
  return CAL.posts.filter(function (x) { return (all || (x.when >= from && x.when <= to)) && postShown(x) && hit([x.title, capPlain(x.caption || ''), x.name, x.err].join(' ')); }).map(function (x) { return { kind: 'post', t: x.when, x: x }; })
    .concat(CAL.tasks.filter(function (t) { return (CAL.showDone || t.status !== 'done') && (all || !t.due || t.due <= to) && hit([t.title, t.note, t.toName, t.fromName].join(' ')); }).map(function (t) { return { kind: 'task', t: t.due || now, x: t }; }))
    .sort(function (a, b) { return all ? b.t - a.t : a.t - b.t; });
}
function norm6(s) { return typeof norm === 'function' ? norm(String(s || '')) : String(s || '').toLowerCase(); }
function drawList(body, title) {
  title.textContent = CAL.range === 'all' ? 'كل السجل' : 'القادم والأخير';
  const progs = (V6.bundle && V6.bundle.programs) || [];
  const search = el('input', { type: 'search', class: 'inp sm', placeholder: 'ابحث في العناوين والنصوص…', 'aria-label': 'بحث', value: CAL.q });
  let st = null; search.addEventListener('input', function () { clearTimeout(st); st = setTimeout(function () { CAL.q = search.value; fill(); }, 200); });
  const rangeSeg = segOf([['up', 'القادم'], ['all', 'كل السجل']], CAL.range, function (v) { CAL.range = v; title.textContent = v === 'all' ? 'كل السجل' : 'القادم والأخير'; fill(); });
  const progSel = progs.length > 1 ? el('select', { class: 'inp sm', 'aria-label': 'البرنامج', onchange: function (e) { CAL.lprog = e.target.value === 'cur' ? null : e.target.value; CAL.redraw(); } }, [el('option', { value: 'cur', text: V6.prog ? V6.prog.name : 'برنامجي', selected: CAL.lprog == null }), el('option', { value: '', text: 'كل البرامج', selected: CAL.lprog === '' })].concat(progs.filter(function (p) { return !V6.prog || p.id !== V6.prog.id; }).map(function (p) { return el('option', { value: p.id, text: p.name, selected: CAL.lprog === p.id }); }))) : null;
  const exp = el('button', { type: 'button', class: 'btn sm line', onclick: function (e) { const n = exportCsv6(listItems6()); btnDone(e.currentTarget, n ? 'نُزّل (' + n + ')' : 'لا شيء'); } }, [ico('download'), 'صدّر CSV']);
  const out = el('div', { class: 'cllist' });
  body.appendChild(el('div', { class: 'cltools rv' }, [el('div', { class: 'clsearch' }, [ico('search'), search]), rangeSeg, progSel, el('span', { class: 'sp' }), exp]));
  body.appendChild(out);
  function fill() {
    out.innerHTML = '';
    const items = listItems6(), now = Date.now();
    exp.disabled = !items.length;
    if (!items.length) {
      out.appendChild(CAL.q || CAL.range === 'all' ? el('p', { class: 'empty', text: 'لا نتائج.' }) : el('div', { class: 'section empty-prog rv' }, [el('span', { class: 'icon-tile t-bl' }, [ico('cal')]), el('h3', { text: 'لا شيء قادم بعد' }), el('p', { class: 'muted', text: 'صمّم إعلاناً ثم جدوله من «النص والقناة»، أو أضف مهمة لك أو لفريقك.' }), el('button', { type: 'button', class: 'btn dark', onclick: function () { taskDialog(null, new Date()); } }, [ico('plus'), 'مهمة جديدة'])]));
      revealAll(out); return;
    }
    const groups = {}, order = []; items.forEach(function (it) { const k = it.kind === 'task' && !it.x.due ? 'nodue' : dayKey6(it.t); if (!groups[k]) { groups[k] = { d: new Date(it.t), items: [] }; order.push(k); } groups[k].items.push(it); });
    order.forEach(function (k, gi) {
      const g = groups[k], isT = k !== 'nodue' && sameDay6(g.d, now), past = k !== 'nodue' && g.d < now && !isT;
      out.appendChild(el('section', { class: 'clgroup rv' + (past ? ' past' : '') + (isT ? ' today' : ''), style: '--d:' + Math.min(gi, 8) }, [
        el('div', { class: 'clhead' }, [el('b', { text: k === 'nodue' ? 'بلا موعد' : isT ? 'اليوم' : dayTitle6(g.d) }), isT ? el('span', { class: 'tiny', text: dayTitle6(g.d) }) : null, past ? el('span', { class: 'pill', text: 'مضى' }) : null]),
        el('div', { class: 'clitems' }, g.items.map(weekCard))
      ]));
    });
    revealAll(out); flashPending(out);
  }
  fill();
}
// تصدير ما تعرضه القائمة (بعد البحث والتصفية) جدولاً يفتحه Excel بالعربية
function exportCsv6(items) {
  if (!items.length) return 0;
  const esc = function (v) { v = String(v == null ? '' : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const dt = function (t) { return t ? localISO(new Date(t)) + ' ' + localHM(new Date(t)) : ''; };
  const rows = [['النوع', 'الموعد', 'العنوان', 'الحالة', 'البرنامج', 'المسار', 'الناشر/المسؤول', 'التكرار', 'الرابط', 'النص', 'سبب الفشل']];
  items.forEach(function (it) {
    const x = it.x;
    if (it.kind === 'post') rows.push(['منشور', dt(x.when), x.title || '', (TG_STATUS[x.status] || [x.status])[0], progName6(x.program), x.track ? ((typeof TRACKS !== 'undefined' && TRACKS[x.track] && TRACKS[x.track].name) || x.track) : '', x.name || '', x.repeat ? repeatLabel(x.repeat) : '', x.link || '', capPlain(x.caption || ''), x.err || '']);
    else rows.push(['مهمة', dt(x.due), x.title, x.status === 'done' ? 'منجزة' : 'مفتوحة', progName6(x.program), '', x.to ? (x.toName || '') : 'كل الفريق', x.repeat ? repeatLabel(x.repeat) : '', x.link || '', x.note || '', '']);
  });
  const csv = '﻿' + rows.map(function (r) { return r.map(esc).join(','); }).join('\r\n');
  const a = el('a', { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), download: 'التقويم-' + localISO() + '.csv' });
  document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  return items.length;
}

/* ---------- يوم: كل ما فيه ---------- */
function dayDialog(d) {
  const items = calItems(d), list = el('div', { class: 'clitems' }, items.length ? items.map(weekCard) : [el('p', { class: 'empty', text: 'لا شيء في هذا اليوم.' })]);
  modal({ title: dayTitle6(d), wide: true, body: [list], acts: [{ t: 'مهمة في هذا اليوم', cls: 'dark', fn: function () { taskDialog(null, d); } }, { t: 'اعرض اليوم بساعاته', fn: function () { openDay(d); } }, { t: 'إغلاق' }] });
}

/* ---------- تفاصيل منشور: الموعد والنص والتكرار (يستدعيها المحرر أيضاً: postDialog(x) و requeueDialog(x, closeParent)) ---------- */
function postDialog(x) {
  const st = TG_STATUS[x.status] || ['', '', 'info'], queued = x.status === 'queued', canEdit = x.canEdit !== false && (x.mine || isAdmin());
  let save = null;
  const prev = el('div', { class: 'tgprev' });
  const E = capEditor(x.caption || '', function () { prev.innerHTML = capToHtml(E.get()); dirty(); }); prev.innerHTML = capToHtml(x.caption || '');
  const w = new Date(x.when), dI = el('input', { type: 'date', class: 'inp sm', value: localISO(w), 'aria-label': 'التاريخ' }), tI = el('input', { type: 'time', class: 'inp sm', value: localHM(w), 'aria-label': 'الوقت' });
  const rep = repeatEditor(x.repeat || null, function () { dirty(); });
  save = el('button', { type: 'button', class: 'btn dark', disabled: true }, [ico('check'), 'احفظ التعديلات']);
  function dirty() { if (!save || !queued || !canEdit) return; save.disabled = false; btnReset(save); save.replaceChildren(ico('check'), 'احفظ التعديلات'); }
  [dI, tI].forEach(function (i) { i.addEventListener('change', dirty); });
  save.onclick = function () {
    const when = fromISO(dI.value, tI.value); if (!when || when.getTime() < Date.now() + 60000) { toast('اختر موعداً في المستقبل'); return; }
    return withBusy(save, async function () { const r = await API6.me('tg_update', JSON.stringify({ id: x.id, when: when.getTime(), caption: E.get(), repeat: rep.get() })); Object.assign(x, r); POSTS = null; CAL.flash = x.id; CAL.redraw && $('.calpage') && CAL.redraw(); }, { done: 'حُفظت', keep: true });
  };
  // بعد النشر تُنقل صورة المنشور إلى سلة درايف، فإعادة نشره تكون من التصميم نفسه
  const gone = !queued && x.hasFile === false;
  const acts = [];
  if (queued && canEdit) acts.push({ t: 'إلغاء الجدولة', cls: 'danger', keep: true, fn: async function (close) { if (!(await ask('إلغاء الجدولة', 'لن يُنشر «' + (x.title || 'المنشور') + '»' + (x.repeat ? '، ويتوقف تكراره' : '') + '.', 'ألغِ', true))) return false; try { await API6.me('tg_cancel', x.id); x.status = 'cancelled'; POSTS = null; toast('أُلغيت'); close(); CAL.redraw && $('.calpage') && CAL.redraw(); } catch (e) { toast(e.message); } return false; } });
  if (!queued && canEdit && !gone) acts.push({ t: 'أعد جدولته', cls: 'dark', keep: true, fn: function (close) { requeueDialog(x, close); return false; } });
  acts.push({ t: 'إغلاق' });
  modal({ title: x.title || 'منشور', wide: true, body: [
    el('div', { class: 'pdgrid' }, [
      el('div', { class: 'pdl' }, [el('div', { class: 'row wrapr tiny' }, [el('span', { class: 'pill ' + st[1] }, [ico(st[2]), st[0]]), el('span', { text: fmtTime(x.when) }), el('span', { text: '· ' + (x.name || '') }), x.repeat ? el('span', { class: 'pill' }, [ico('history'), repeatLabel(x.repeat)]) : null]),
        x.err ? el('p', { class: 'err small', text: 'سبب الفشل: ' + x.err }) : null,
        gone && canEdit ? el('p', { class: 'tiny pdgone' }, [ico('info'), 'نُقلت صورته إلى سلة درايف بعد نشره. لتنشره مرة أخرى افتح التصميم وانشره من جديد.']) : null,
        el('div', { class: 'row wrapr' }, [x.item ? el('a', { class: 'btn sm ' + (gone ? 'dark' : 'line'), href: '#/d/' + x.item, onclick: function () { closeModals(); } }, [ico('pencil'), gone ? 'افتح التصميم وانشره' : 'افتح التصميم']) : null, x.link ? el('a', { class: 'btn sm line', href: x.link, target: '_blank', rel: 'noopener' }, [ico('link'), 'المنشور في القناة']) : null, el('button', { type: 'button', class: 'btn sm ghost', onclick: function (e) { copyText(capPlain(E.get())); btnDone(e.currentTarget, 'نُسخ'); } }, [ico('copy'), 'انسخ النص'])])]),
      el('div', { class: 'pdr' }, [
        queued && canEdit ? el('div', { class: 'capwhen' }, [el('b', { class: 'small', text: 'الموعد' }), el('div', { class: 'row wrapr' }, [dI, tI]), rep.node]) : null,
        el('b', { class: 'small', text: 'النص المصاحب' }),
        queued && canEdit ? el('div', { class: 'capedwrap' }, [E.bar, E.ed]) : el('div', { class: 'tgwrap light' }, [el('div', { class: 'tgbubble' }, [prev])]),
        queued && canEdit ? el('div', { class: 'row' }, [save]) : null
      ])
    ])
  ], acts: acts });
}
function requeueDialog(x, closeParent) {
  if (x.hasFile === false) {
    modal({ title: 'إعادة نشر «' + (x.title || 'المنشور') + '»', body: [el('p', { class: 'muted small', text: 'نُقلت صورة هذا المنشور إلى سلة درايف بعد نشره. افتح التصميم وانشره من جديد.' })], acts: [x.item ? { t: 'افتح التصميم', cls: 'dark', fn: function () { closeModals(); go('#/d/' + x.item); } } : null, { t: 'إغلاق' }].filter(Boolean) });
    return;
  }
  const d = new Date(Date.now() + 3600000), dI = el('input', { type: 'date', class: 'inp sm', value: localISO(d), min: localISO() }), tI = el('input', { type: 'time', class: 'inp sm', value: localHM(d) });
  modal({ title: 'إعادة جدولة «' + (x.title || 'المنشور') + '»', body: [el('p', { class: 'muted small', text: 'يُنشر مرة أخرى بالصورة والنص نفسيهما في الموعد الذي تختاره.' }), el('div', { class: 'row wrapr' }, [dI, tI])], acts: [{ t: 'جدوله', cls: 'dark', keep: true, fn: function (close) {
    const b = $$('.modal .acts .btn.dark, .msheet .sacts .btn.dark').pop(), when = fromISO(dI.value, tI.value); if (!when || when.getTime() < Date.now() + 60000) { toast('اختر موعداً في المستقبل'); return false; }
    withBusy(b, async function () { const r = await API6.me('tg_requeue', x.id, when.getTime()); POSTS = null; if (r && r.id) CAL.flash = r.id; }, { busy: 'نجدول…', done: 'جُدول' }).then(function () { setTimeout(function () { close(); if (closeParent) closeParent(); CAL.loaded = false; CAL.redraw && $('.calpage') && CAL.redraw(); }, 500); }).catch(function () {});
    return false;
  } }, { t: 'إلغاء' }] });
}

/* ---------- المهمة: لي، أو أسندها مشرف إلى عضو. تتكرر كالمنشورات، ويصل تذكيرها إلى الجرس ---------- */
let ACC_CACHE = null;
async function programMembers() {
  if (!isAdmin()) return [];
  if (!ACC_CACHE) { try { ACC_CACHE = await API6.me('acc_list'); } catch (e) { ACC_CACHE = []; } }
  return ACC_CACHE.filter(function (a) { return !a.disabled && (a.programs || []).indexOf(V6.prog.id) >= 0; });
}
// taskDialog(t) يعدّل، و taskDialog(null, day, timed, allDay) ينشئ: timed يحفظ ساعة day (من عرض اليوم)
async function taskDialog(t, day, timed, allDay0) {
  const isNew = !t; t = t || { title: '', note: '', due: 0, allDay: !!allDay0, to: V6.me.uid, prio: 'normal', link: '' };
  const canEdit = isNew || t.canEdit, canDone = isNew ? false : t.canDone;
  const titleI = el('input', { type: 'text', class: 'inp', value: t.title, placeholder: 'ما المطلوب؟', 'aria-label': 'العنوان', maxlength: '140', disabled: !canEdit });
  const noteI = el('textarea', { class: 'inp', rows: '3', dir: 'auto', placeholder: 'تفاصيل، روابط، ملاحظات…', 'aria-label': 'ملاحظات', disabled: !canEdit }); noteI.value = t.note || '';
  const due0 = t.due ? new Date(t.due) : (day ? new Date(day) : null); if (due0 && !t.due && !timed) due0.setHours(9, 0, 0, 0);
  const dI = el('input', { type: 'date', class: 'inp sm', value: due0 ? localISO(due0) : '', 'aria-label': 'التاريخ', disabled: !canEdit }), tI = el('input', { type: 'time', class: 'inp sm', value: due0 ? localHM(due0) : '09:00', 'aria-label': 'الوقت', disabled: !canEdit || t.allDay });
  const allDay = el('input', { type: 'checkbox', checked: !!t.allDay, disabled: !canEdit, onchange: function (e) { tI.disabled = e.target.checked; } });
  let prio = t.prio || 'normal';
  const prioSeg = segOf([['normal', 'عادية'], ['high', 'مهمة']], prio, function (v) { prio = v; });
  const linkI = el('input', { type: 'text', class: 'inp sm', dir: 'ltr', value: t.link || '', placeholder: '#/d/… أو https://…', 'aria-label': 'رابط', disabled: !canEdit });
  const toSel = el('select', { class: 'inp sm', 'aria-label': 'لمن', disabled: !canEdit }, [el('option', { value: V6.me.uid, text: 'لي (' + V6.me.name + ')' }), el('option', { value: '', text: 'لكل فريق البرنامج' })]);
  if (isAdmin()) programMembers().then(function (ms) { ms.forEach(function (a) { if (a.uid !== V6.me.uid) toSel.appendChild(el('option', { value: a.uid, text: a.name + (a.role === 'sup' ? ' · مشرف' : '') })); }); toSel.value = t.to != null ? t.to : V6.me.uid; });
  toSel.value = t.to != null ? t.to : V6.me.uid;
  // التكرار بمحرر المنشورات نفسه، بملخص يناسب المهام
  const repSum = el('small', { class: 'tiny' });
  const rep = repeatEditor(t.repeat || null, function (g) { repSum.textContent = g ? 'تتكرر ' + repeatLabel(g) + '، وإنجاز كل واحدة يضيف التالية' : ''; });
  rep.node.classList.add('taskrep'); $$('select,input', rep.node).forEach(function (i) { i.disabled = !canEdit; });
  const remSel = el('select', { class: 'inp sm', 'aria-label': 'التذكير', disabled: !canEdit }, REMIND_OPTS.map(function (o) { return el('option', { value: o[0], text: o[1], selected: String(t.remind == null ? '' : t.remind) === o[0] }); }));
  const save = el('button', { type: 'button', class: 'btn dark', onclick: function () {
    const title = titleI.value.trim(); if (!title) { toast('اكتب عنوان المهمة'); titleI.focus(); return; }
    let due = 0; if (dI.value) { const d = fromISO(dI.value, allDay.checked ? '09:00' : (tI.value || '09:00')); if (d) due = d.getTime(); }
    const repeat = rep.get();
    if ((repeat || remSel.value !== '') && !due) { toast(repeat ? 'التكرار يحتاج تاريخاً' : 'التذكير يحتاج تاريخاً'); dI.focus(); return; }
    return withBusy(save, async function () {
      const r = await API6.me('task_save', JSON.stringify({ id: t.id, program: V6.prog.id, title: title, note: noteI.value, due: due, allDay: allDay.checked, to: toSel.value, prio: prio, link: linkI.value.trim(), status: t.status, repeat: repeat, remind: remSel.value }));
      if (isNew) CAL.tasks.unshift(Object.assign({ canEdit: true, canDone: true, mine: true }, r)); else Object.assign(t, r);
      CAL.flash = r.id;
      notifyDone(isNew ? 'أُضيفت المهمة' : 'حُفظت المهمة', title);
    }, { busy: 'نحفظ…', done: isNew ? 'أُضيفت' : 'حُفظت' }).then(function () { setTimeout(function () { closeModals(); CAL.redraw && $('.calpage') && CAL.redraw(); }, 600); }).catch(function () {});
  } }, [ico('check'), isNew ? 'أضف المهمة' : 'احفظ']);
  const acts = [];
  if (!isNew && canDone) acts.push({ t: t.status === 'done' ? 'أعدها مفتوحة' : 'أُنجزت ✓', cls: t.status === 'done' ? '' : 'dark', fn: function () { toggleTask(t, null).then(function () { CAL.redraw && $('.calpage') && CAL.redraw(); }); } });
  if (!isNew && canEdit) acts.push({ t: 'حذف', cls: 'danger', keep: true, fn: async function (close) { if (!(await ask('حذف المهمة', t.title + (t.repeat ? ' (هذه المرة فقط؛ لن تُضاف التالية)' : ''), 'احذف', true))) return false; try { await API6.me('task_del', t.id); CAL.tasks = CAL.tasks.filter(function (x) { return x.id !== t.id; }); toast('حُذفت'); close(); CAL.redraw && $('.calpage') && CAL.redraw(); } catch (e) { toast(e.message); } return false; } });
  acts.push({ t: 'إغلاق' });
  modal({ title: isNew ? 'مهمة جديدة' : 'المهمة', wide: true, body: [
    !isNew ? el('div', { class: 'row wrapr tiny' }, [el('span', { class: 'pill ' + (t.status === 'done' ? 'gr' : 'or'), text: t.status === 'done' ? 'منجزة' + (t.doneBy ? ' · ' + t.doneBy : '') : 'مفتوحة' }), el('span', { text: 'من ' + (t.fromName || '') + (t.to ? ' إلى ' + (t.toName || '') : ' إلى كل الفريق') }), el('span', { text: '· ' + ago(t.at) }), t.seriesId ? el('span', { class: 'pill' }, [ico('history'), 'من سلسلة متكررة']) : null]) : null,
    el('div', { class: 'fld' }, [el('label', { text: 'العنوان' }), withEmoji(titleI)]),
    el('div', { class: 'fld' }, [el('label', { text: 'ملاحظات' }), withEmoji(noteI)]),
    el('div', { class: 'grid two' }, [
      el('div', { class: 'fld' }, [el('label', { text: 'الموعد' }), el('div', { class: 'row wrapr' }, [dI, tI]), el('label', { class: 'tog tiny' }, [allDay, el('span', { text: 'طوال اليوم' })])]),
      el('div', { class: 'fld' }, [el('label', { text: 'لمن' }), toSel, isAdmin() ? el('small', { text: 'يصل العضو إشعار في الجرس وتظهر في تقويمه.' }) : null])
    ]),
    el('div', { class: 'grid two' }, [
      el('div', { class: 'fld' }, [el('label', { text: 'التكرار' }), rep.node, repSum]),
      el('div', { class: 'fld' }, [el('label', { text: 'التذكير' }), remSel, el('small', { text: 'يصل إلى الجرس' + (toSel.value === '' ? ' لكل الفريق' : '') + ' قبل الموعد بالمدة التي تختارها.' })])
    ]),
    el('div', { class: 'grid two' }, [el('div', { class: 'fld' }, [el('label', { text: 'الأهمية' }), prioSeg]), el('div', { class: 'fld' }, [el('label', { text: 'رابط (اختياري)' }), linkI])]),
    t.link ? el('a', { class: 'btn sm line', href: t.link, target: /^https?:/.test(t.link) ? '_blank' : null, rel: 'noopener', onclick: function () { closeModals(); } }, [ico('link'), 'افتح الرابط']) : null,
    canEdit ? el('div', { class: 'row' }, [save]) : null
  ], acts: acts });
}

/* ---------- في الرئيسية: القادم من التقويم ---------- */
function calHomeWidget() {
  const box = el('div', { class: 'plist6 calmini' });
  calLoad().then(function () {
    const now = Date.now();
    const items = CAL.posts.filter(function (x) { return x.status === 'queued' && x.when >= now - 600000; }).map(function (x) { return { kind: 'post', t: x.when, x: x }; })
      .concat(CAL.tasks.filter(function (t) { return t.status !== 'done' && (t.mine || t.to === '') ; }).map(function (t) { return { kind: 'task', t: t.due || now + 1e12, x: t }; }))
      .sort(function (a, b) { return a.t - b.t; }).slice(0, 4);
    box.appendChild(el('div', { class: 'row' }, [el('h3', { class: 'psh', text: 'القادم في التقويم' }), el('span', { class: 'sp' }), el('a', { class: 'btn sm ghost', href: '#/cal', text: 'التقويم والمهام' })]));
    if (!items.length) { box.appendChild(el('p', { class: 'tiny', text: 'لا منشورات مجدولة ولا مهام مفتوحة.' })); return; }
    items.forEach(function (it, i) {
      if (it.kind === 'post') { const x = it.x; box.appendChild(el('button', { type: 'button', class: 'prow6 rv post', style: '--d:' + i, title: canOpenDesign(x) ? 'افتح التصميم' : 'تفاصيل النشر', onclick: function () { canOpenDesign(x) ? go('#/d/' + x.item) : go('#/cal?post=' + x.id); } }, [el('span', { class: 'cst bl' }, [ico('clock')]), el('div', { class: 'grow' }, [el('b', { text: x.title || 'منشور' }), el('span', { class: 'tiny', text: fmtTime(x.when) + (x.repeat ? ' · ' + repeatLabel(x.repeat) : '') })]), ico('send')])); }
      else { const t = it.x; box.appendChild(el('button', { type: 'button', class: 'prow6 rv task' + (t.prio === 'high' ? ' high' : ''), style: '--d:' + i, onclick: function () { go('#/cal?task=' + t.id); } }, [el('span', { class: 'tchk' }, [ico('check')]), el('div', { class: 'grow' }, [el('b', { text: t.title }), el('span', { class: 'tiny', text: (t.due ? fmtTime(t.due) : 'بلا موعد') + (t.from !== V6.me.uid ? ' · من ' + t.fromName : '') + (t.remind != null && t.due ? ' · ' + remindLabel(t.remind) : '') })]), ico('chev')])); }
    });
    revealAll(box);
  }).catch(function () {});
  return box;
}

/* ---------- التذكيرات تصل الجرس دون إعادة تحميل: فحص كل خمس دقائق، وإشعار بصوت (ونافذة إن كانت الصفحة في الخلفية) ---------- */
(function () {
  let seen = null;
  async function poll() {
    if (!V6.token || typeof loadNotifs !== 'function') return;
    try { await loadNotifs(); } catch (e) { return; }
    const rem = (typeof NOTIFS !== 'undefined' ? NOTIFS : []).filter(function (n) { return n.kind === 'remind' && !n.seen; });
    if (seen === null) { seen = {}; rem.forEach(function (n) { seen[n.id] = 1; }); return; }
    rem.forEach(function (n) { if (seen[n.id]) return; seen[n.id] = 1; notifyDone(n.text, ''); });
  }
  setInterval(poll, 5 * 60000);
  setTimeout(poll, 20000);
})();
