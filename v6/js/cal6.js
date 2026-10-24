/* ================= التقويم والمهام: ما جُدول للقناة، وما كُلّفت به، في شهر وأسبوع وقائمة =================
   المنشورات من طابور تليجرام (tgq)، والمهام من tasks.json. سحب العنصر إلى يوم آخر يغيّر موعده، والنقر يفتح تفاصيله.
   كل تغيير يُظهر حاله: الزر يشتغل ثم يعلن «تم»، والبطاقة تومض. */
const CAL = { view: ls('calView') || 'month', mode: ls('calMode') || 'h', cursor: null, posts: [], tasks: [], thumbs: {}, status: 'all', showDone: false, loaded: false };
const TG_STATUS = { queued: ['مجدول', 'bl', 'clock'], sent: ['أُرسل', 'gr', 'check'], failed: ['فشل', 'rd', 'close'], cancelled: ['أُلغي', '', 'close'] };
function dayKey6(t) { const d = new Date(t); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function sameDay6(a, b) { return dayKey6(a) === dayKey6(b); }
function hm6(t) { try { return new Intl.DateTimeFormat('ar', { hour: 'numeric', minute: '2-digit' }).format(new Date(t)); } catch (e) { return ''; } }
function dayTitle6(d) { return WD[d.getDay()] + ' ' + new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long' }).format(d) + (hijriParts(d) ? ' · ' + hijriParts(d).d + ' ' + hijriMonthName(d) : ''); }

async function calLoad(force) {
  if (CAL.loaded && !force && POSTS !== null && Date.now() - (CAL.at || 0) < 120000) return;
  const pid = V6.prog ? V6.prog.id : '';
  const [posts, tasks] = await Promise.all([
    V6.settings && V6.settings.tg ? API6.me('tg_queue', pid).catch(function () { return []; }) : Promise.resolve([]),
    API6.me('task_list', pid).catch(function () { return []; })
  ]);
  CAL.posts = posts; CAL.tasks = tasks.filter(function (t) { return t.status !== 'deleted'; }); CAL.loaded = true; CAL.at = Date.now();
  POSTS = posts; POSTS_BY_DAY = {}; posts.forEach(function (x) { if (x.status !== 'queued') return; (POSTS_BY_DAY[new Date(x.when).toDateString()] = POSTS_BY_DAY[new Date(x.when).toDateString()] || []).push(x); });
}
// المصغّرات تُجلب دفعة لما يظهر، وتبقى في IndexedDB
async function calThumbs(ids) {
  const need = [];
  for (const id of ids) { if (CAL.thumbs[id] !== undefined) continue; const c = await IDB.get('tgth:' + id); if (c) CAL.thumbs[id] = c; else need.push(id); }
  const paint = function () { $$('.cthumb[data-id]').forEach(function (im) { const u = CAL.thumbs[im.dataset.id]; if (u) { im.style.backgroundImage = 'url(' + u + ')'; im.classList.add('has'); } }); };
  if (!need.length) { paint(); return; }
  need.forEach(function (id) { CAL.thumbs[id] = ''; });
  try { const r = await API6.me('tg_thumbs', JSON.stringify(need.slice(0, 40))); Object.keys(r).forEach(function (id) { CAL.thumbs[id] = r[id]; IDB.put('tgth:' + id, r[id]); }); } catch (e) {}
  paint(); $$('.cthumb[data-id]').forEach(function (im) { const u = CAL.thumbs[im.dataset.id]; if (u) { im.style.backgroundImage = 'url(' + u + ')'; im.classList.add('has'); } });
}
function calItems(day) {
  const posts = CAL.posts.filter(function (x) { return sameDay6(x.when, day) && (CAL.status === 'all' || x.status === CAL.status) && (CAL.status !== 'all' || x.status !== 'cancelled'); }).map(function (x) { return { kind: 'post', t: x.when, x: x }; });
  const tasks = CAL.tasks.filter(function (t) { return t.due && sameDay6(t.due, day) && (CAL.showDone || t.status !== 'done'); }).map(function (t) { return { kind: 'task', t: t.due, x: t }; });
  return posts.concat(tasks).sort(function (a, b) { return a.t - b.t; });
}

/* ---------- الصفحة ---------- */
function showCal6() {
  const q = location.hash.split('?')[1] || '', qs = {}; q.split('&').forEach(function (p) { const kv = p.split('='); if (kv[0]) qs[kv[0]] = decodeURIComponent(kv[1] || ''); });
  document.title = 'التقويم والمهام';
  if (!CAL.cursor || qs.d) { const d = qs.d ? fromISO(qs.d, '12:00') : new Date(); CAL.cursor = d || new Date(); CAL.cursor.setHours(12, 0, 0, 0); }
  const body = el('div', { class: 'calbody' }), title = el('h2', { class: 'caltitle' });
  const viewSeg = segOf([['month', 'شهر'], ['week', 'أسبوع'], ['list', 'القادم']], CAL.view, function (v) { CAL.view = v; ls('calView', v); draw(); });
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
    if (CAL.view === 'week') c.setDate(c.getDate() + 7 * k);
    else if (CAL.mode === 'g') c.setMonth(c.getMonth() + k, 1);
    else { let x = hijriFirst(c); x = hijriFirst(new Date(x.getTime() + (k > 0 ? 31 : -1) * 864e5)); CAL.cursor = x; }
    draw();
  }
  const legend = el('div', { class: 'callegend tiny' }, [['bl', 'مجدول'], ['gr', 'أُرسل'], ['rd', 'فشل'], ['or', 'مهمة'], ['mu', 'منجز']].map(function (l) { return el('span', {}, [el('i', { class: 'ldot ' + l[0] }), l[1]]); }));
  view(el('div', { class: 'wrap page calpage' }, [
    el('div', { class: 'phead row wrapr' }, [
      el('div', {}, [el('span', { class: 'eyebrow rv', text: V6.prog ? V6.prog.name : '' }), H('h1', 'التقويم والمهام'), el('p', { class: 'muted rv', text: 'ما جُدول للقناة، وما عليك من مهام، في مكان واحد. اسحب عنصراً إلى يوم آخر لتغيير موعده، وانقره لتفاصيله.' })]),
      el('span', { class: 'sp' }),
      el('div', { class: 'row wrapr' }, [
        el('button', { type: 'button', class: 'btn dark', onclick: function () { taskDialog(null, CAL.cursor); } }, [ico('plus'), 'مهمة جديدة']),
        el('a', { class: 'btn line', href: '#/', title: 'صمّم إعلاناً ثم جدوله من «النص والقناة»' }, [ico('send'), 'منشور جديد'])
      ])
    ]),
    el('div', { class: 'calbar rv' }, [nav, title, el('span', { class: 'sp' }), viewSeg, modeSeg, statusSel, doneTog]),
    legend,
    body
  ]));
  async function draw() {
    body.innerHTML = ''; body.appendChild(loader6('نجهّز التقويم…', true));
    try { await calLoad(true); } catch (e) { body.innerHTML = ''; body.appendChild(el('p', { class: 'err', text: e.message })); return; }
    body.innerHTML = '';
    if (CAL.view === 'month') drawMonth(body, title); else if (CAL.view === 'week') drawWeek(body, title); else drawList(body, title);
    revealAll(body);
    if (qs.task) { const t = CAL.tasks.find(function (x) { return x.id === qs.task; }); if (t) { taskDialog(t); qs.task = ''; } }
    if (qs.post) { const p = CAL.posts.find(function (x) { return x.id === qs.post; }); if (p) { postDialog(p); qs.post = ''; } }
  }
  CAL.redraw = draw;
  draw();
}
function hijriFirst(d) { let x = new Date(d); x.setHours(12, 0, 0, 0); while (hijriParts(x) && hijriParts(x).d !== 1) x = new Date(x.getTime() - 864e5); return x; }
function monthDays6() {
  const c = CAL.cursor, days = [];
  if (CAL.mode === 'g') { const first = new Date(c.getFullYear(), c.getMonth(), 1, 12); for (let x = new Date(first); x.getMonth() === first.getMonth(); x.setDate(x.getDate() + 1)) days.push(new Date(x)); return { days: days, title: new Intl.DateTimeFormat('ar-u-nu-latn', { month: 'long', year: 'numeric' }).format(first) }; }
  const x = hijriFirst(c), hp = hijriParts(x); if (!hp) { CAL.mode = 'g'; return monthDays6(); }
  for (let y = new Date(x); hijriParts(y).m === hp.m; y = new Date(y.getTime() + 864e5)) days.push(new Date(y));
  return { days: days, title: hijriMonthName(x) + ' ' + hp.y + ' هـ' };
}

/* ---------- عرض الشهر ---------- */
function drawMonth(body, title) {
  const M = monthDays6(); title.textContent = M.title;
  const grid = el('div', { class: 'cgrid' });
  ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].forEach(function (w) { grid.appendChild(el('div', { class: 'cgh', text: w })); });
  const lead = (M.days[0].getDay() + 1) % 7;
  for (let k = 0; k < lead; k++) grid.appendChild(el('div', { class: 'cgd empty' }));
  const today = new Date(), ids = [];
  M.days.forEach(function (d, i) {
    const items = calItems(d), isT = sameDay6(d, today), past = d < today && !isT;
    const hp = hijriParts(d), big = CAL.mode === 'g' ? d.getDate() : (hp ? hp.d : d.getDate()), small = CAL.mode === 'g' ? (hp ? hp.d + ' ' + hijriMonthName(d) : '') : new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long' }).format(d);
    const cell = el('div', { class: 'cgd rv' + (isT ? ' today' : '') + (past ? ' past' : '') + (d.getDay() === 5 ? ' fri' : ''), style: '--d:' + Math.min(i % 7, 6), 'data-day': dayKey6(d) }, [
      el('div', { class: 'cgtop' }, [el('b', { class: 'cgn', text: String(big) }), el('small', { class: 'tiny', text: small }), el('span', { class: 'sp' }),
        el('button', { type: 'button', class: 'ib sm cgadd', title: 'مهمة في هذا اليوم', 'aria-label': 'مهمة في هذا اليوم', onclick: function (e) { e.stopPropagation(); taskDialog(null, d); } }, [ico('plus')])]),
      el('div', { class: 'cgitems' }, items.slice(0, 4).map(function (it) { if (it.kind === 'post') ids.push(it.x.id); return calChip(it); }).concat(items.length > 4 ? [el('button', { type: 'button', class: 'cgmore', text: '+' + (items.length - 4) + ' أخرى', onclick: function (e) { e.stopPropagation(); dayDialog(d); } })] : []))
    ]);
    cell.addEventListener('click', function (e) { if (e.target.closest('.cchip,.cgadd,.cgmore')) return; dayDialog(d); });
    dropTarget(cell, d);
    grid.appendChild(cell);
  });
  body.appendChild(grid);
  const n = CAL.posts.filter(function (x) { return x.status === 'queued' && M.days.some(function (d) { return sameDay6(d, x.when); }); }).length, nt = CAL.tasks.filter(function (t) { return t.status !== 'done' && t.due && M.days.some(function (d) { return sameDay6(d, t.due); }); }).length;
  body.appendChild(el('p', { class: 'tiny calsum', text: (n ? n + ' منشوراً مجدولاً' : 'لا منشورات مجدولة') + ' · ' + (nt ? nt + ' مهمة مفتوحة' : 'لا مهام مفتوحة') + ' في هذا الشهر.' + (!n && !nt ? ' صمّم إعلاناً ثم جدوله من «النص والقناة»، أو أضف مهمة.' : '') }));
  calThumbs(ids);
}
// بطاقة صغيرة داخل خلية اليوم
function calChip(it) {
  if (it.kind === 'post') {
    const x = it.x, st = TG_STATUS[x.status] || ['', '', 'info'];
    const th = el('span', { class: 'cthumb', 'data-id': x.id }); if (CAL.thumbs[x.id]) { th.style.backgroundImage = 'url(' + CAL.thumbs[x.id] + ')'; th.classList.add('has'); }
    const c = el('button', { type: 'button', class: 'cchip post ' + x.status, draggable: x.status === 'queued' ? 'true' : null, title: (x.title || 'منشور') + ' · ' + hm6(x.when) + ' · ' + st[0], onclick: function (e) { e.stopPropagation(); postDialog(x); } }, [th, el('span', { class: 'ctime', text: hm6(x.when) }), el('span', { class: 'ctitle', text: x.title || 'منشور' }), x.repeat ? ico('history', 'crep') : null]);
    if (x.status === 'queued') dragSource(c, 'post', x.id);
    return c;
  }
  const t = it.x, done = t.status === 'done';
  const c = el('button', { type: 'button', class: 'cchip task' + (done ? ' done' : '') + (t.prio === 'high' ? ' high' : ''), draggable: t.canEdit ? 'true' : null, title: t.title + (t.toName && t.to !== V6.me.uid ? ' — ' + t.toName : ''), onclick: function (e) { e.stopPropagation(); taskDialog(t); } }, [
    el('span', { class: 'tchk', role: 'checkbox', 'aria-checked': done ? 'true' : 'false', onclick: function (e) { e.stopPropagation(); toggleTask(t, c); } }, [ico('check')]),
    el('span', { class: 'ctitle', text: t.title }), !t.allDay && t.due ? el('span', { class: 'ctime', text: hm6(t.due) }) : null]);
  if (t.canEdit) dragSource(c, 'task', t.id);
  return c;
}
async function toggleTask(t, chip) {
  if (!t.canDone) { toast('هذه المهمة ليست لك'); return; }
  const on = t.status !== 'done';
  try { const r = await API6.me('task_done', t.id, on); Object.assign(t, r); if (chip) { chip.classList.toggle('done', on); chip.querySelector('.tchk').setAttribute('aria-checked', on ? 'true' : 'false'); flashOk(chip); } toast(on ? 'أُنجزت ✓' : 'أُعيدت مفتوحة'); if (on) chime6(); }
  catch (e) { toast(e.message); }
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
    withBusy(b, async function () { const r = await API6.me('tg_update', JSON.stringify({ id: x.id, when: when })); Object.assign(x, r); POSTS = null; }, { busy: 'ننقل…', done: 'نُقل' }).then(function () { setTimeout(function () { close(); CAL.redraw(); }, 500); }).catch(function () {});
    return false;
  } }, { t: 'إلغاء' }] });
}
async function moveTaskTo(t, day) {
  if (t.due && sameDay6(t.due, day)) return;
  const old = t.due ? new Date(t.due) : new Date(); const d = new Date(day); d.setHours(t.allDay ? 9 : old.getHours(), t.allDay ? 0 : old.getMinutes(), 0, 0);
  try { const r = await API6.me('task_save', JSON.stringify(Object.assign({}, t, { due: d.getTime() }))); Object.assign(t, r); toast('نُقلت المهمة إلى ' + dayTitle6(d)); CAL.redraw(); } catch (e) { toast(e.message); }
}

/* ---------- عرض الأسبوع ---------- */
function drawWeek(body, title) {
  const c = new Date(CAL.cursor), back = (c.getDay() + 1) % 7, start = new Date(c); start.setDate(c.getDate() - back); start.setHours(12, 0, 0, 0);
  const days = []; for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d); }
  title.textContent = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long' }).format(days[0]) + ' — ' + new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(days[6]);
  const wrap = el('div', { class: 'cweek' }), today = new Date(), ids = [];
  days.forEach(function (d, i) {
    const items = calItems(d), hp = hijriParts(d);
    const col = el('div', { class: 'cwcol rv' + (sameDay6(d, today) ? ' today' : '') + (d.getDay() === 5 ? ' fri' : ''), style: '--d:' + i }, [
      el('div', { class: 'cwh' }, [el('b', { text: WD[d.getDay()] }), el('span', { class: 'tiny', text: new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'short' }).format(d) + (hp ? ' · ' + hp.d + ' ' + hijriMonthName(d) : '') }), el('span', { class: 'sp' }), el('button', { type: 'button', class: 'ib sm', title: 'مهمة', 'aria-label': 'مهمة', onclick: function () { taskDialog(null, d); } }, [ico('plus')])]),
      el('div', { class: 'cwitems' }, items.length ? items.map(function (it) { if (it.kind === 'post') ids.push(it.x.id); return weekCard(it); }) : [el('p', { class: 'tiny empty', text: 'فارغ' })])
    ]);
    dropTarget(col, d); wrap.appendChild(col);
  });
  body.appendChild(wrap); calThumbs(ids);
}
function weekCard(it) {
  if (it.kind === 'post') {
    const x = it.x, st = TG_STATUS[x.status] || ['', '', 'info'];
    const th = el('div', { class: 'cthumb big', 'data-id': x.id }); if (CAL.thumbs[x.id]) { th.style.backgroundImage = 'url(' + CAL.thumbs[x.id] + ')'; th.classList.add('has'); }
    const c = el('button', { type: 'button', class: 'ccard post ' + x.status, draggable: x.status === 'queued' ? 'true' : null, onclick: function () { postDialog(x); } }, [th, el('div', { class: 'ccbody' }, [el('b', { text: x.title || 'منشور' }), el('span', { class: 'tiny', text: hm6(x.when) + ' · ' + st[0] + (x.repeat ? ' · ' + repeatLabel(x.repeat) : '') }), el('span', { class: 'tiny ccby', text: x.name || '' })])]);
    if (x.status === 'queued') dragSource(c, 'post', x.id);
    return c;
  }
  const t = it.x, done = t.status === 'done';
  const c = el('button', { type: 'button', class: 'ccard task' + (done ? ' done' : '') + (t.prio === 'high' ? ' high' : ''), draggable: t.canEdit ? 'true' : null, onclick: function () { taskDialog(t); } }, [
    el('span', { class: 'tchk', role: 'checkbox', 'aria-checked': done ? 'true' : 'false', onclick: function (e) { e.stopPropagation(); toggleTask(t, c); } }, [ico('check')]),
    el('div', { class: 'ccbody' }, [el('b', { text: t.title }), el('span', { class: 'tiny', text: (t.allDay ? 'طوال اليوم' : hm6(t.due)) + (t.toName && t.to !== V6.me.uid ? ' · ' + t.toName : '') + (t.from !== V6.me.uid ? ' · من ' + t.fromName : '') })])]);
  if (t.canEdit) dragSource(c, 'task', t.id);
  return c;
}

/* ---------- القادم: قائمة زمنية ---------- */
function drawList(body, title) {
  title.textContent = 'القادم والأخير';
  const now = Date.now(), from = now - 7 * 864e5, to = now + 60 * 864e5;
  const items = CAL.posts.filter(function (x) { return x.when >= from && x.when <= to && (CAL.status === 'all' ? x.status !== 'cancelled' : x.status === CAL.status); }).map(function (x) { return { kind: 'post', t: x.when, x: x }; })
    .concat(CAL.tasks.filter(function (t) { return (CAL.showDone || t.status !== 'done') && (!t.due || t.due <= to); }).map(function (t) { return { kind: 'task', t: t.due || now, x: t }; }))
    .sort(function (a, b) { return a.t - b.t; });
  if (!items.length) { body.appendChild(el('div', { class: 'section empty-prog rv' }, [el('span', { class: 'icon-tile t-bl' }, [ico('cal')]), el('h3', { text: 'لا شيء قادم بعد' }), el('p', { class: 'muted', text: 'صمّم إعلاناً ثم جدوله من «النص والقناة»، أو أضف مهمة لك أو لفريقك.' }), el('button', { type: 'button', class: 'btn dark', onclick: function () { taskDialog(null, new Date()); } }, [ico('plus'), 'مهمة جديدة'])])); return; }
  const groups = {}; items.forEach(function (it) { const k = dayKey6(it.t); (groups[k] = groups[k] || { d: new Date(it.t), items: [] }).items.push(it); });
  const ids = [];
  Object.keys(groups).sort().forEach(function (k, gi) {
    const g = groups[k], isT = sameDay6(g.d, now), past = g.d < now && !isT;
    body.appendChild(el('section', { class: 'clgroup rv' + (past ? ' past' : '') + (isT ? ' today' : ''), style: '--d:' + Math.min(gi, 8) }, [
      el('div', { class: 'clhead' }, [el('b', { text: isT ? 'اليوم' : dayTitle6(g.d) }), isT ? el('span', { class: 'tiny', text: dayTitle6(g.d) }) : null, past ? el('span', { class: 'pill', text: 'مضى' }) : null]),
      el('div', { class: 'clitems' }, g.items.map(function (it) { if (it.kind === 'post') ids.push(it.x.id); return weekCard(it); }))
    ]));
  });
  calThumbs(ids);
}

/* ---------- يوم: كل ما فيه ---------- */
function dayDialog(d) {
  const items = calItems(d), list = el('div', { class: 'clitems' }, items.length ? items.map(weekCard) : [el('p', { class: 'empty', text: 'لا شيء في هذا اليوم.' })]);
  modal({ title: dayTitle6(d), wide: true, body: [list], acts: [{ t: 'مهمة في هذا اليوم', cls: 'dark', fn: function () { taskDialog(null, d); } }, { t: 'إغلاق' }] });
  calThumbs(items.filter(function (i) { return i.kind === 'post'; }).map(function (i) { return i.x.id; }));
}

/* ---------- تفاصيل منشور: المعاينة والنص والموعد والتكرار ---------- */
function postDialog(x) {
  const st = TG_STATUS[x.status] || ['', '', 'info'], queued = x.status === 'queued', canEdit = x.canEdit !== false && (x.mine || isAdmin());
  const th = el('div', { class: 'cthumb xl', 'data-id': x.id }); if (CAL.thumbs[x.id]) { th.style.backgroundImage = 'url(' + CAL.thumbs[x.id] + ')'; th.classList.add('has'); }
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
    return withBusy(save, async function () { const r = await API6.me('tg_update', JSON.stringify({ id: x.id, when: when.getTime(), caption: E.get(), repeat: rep.get() })); Object.assign(x, r); POSTS = null; CAL.redraw && CAL.redraw(); }, { done: 'حُفظت', keep: true });
  };
  const acts = [];
  if (queued && canEdit) acts.push({ t: 'إلغاء الجدولة', cls: 'danger', keep: true, fn: async function (close) { if (!(await ask('إلغاء الجدولة', 'لن يُنشر «' + (x.title || 'المنشور') + '»' + (x.repeat ? '، ويتوقف تكراره' : '') + '.', 'ألغِ', true))) return false; try { await API6.me('tg_cancel', x.id); x.status = 'cancelled'; POSTS = null; toast('أُلغيت'); close(); CAL.redraw && CAL.redraw(); } catch (e) { toast(e.message); } return false; } });
  if (!queued && canEdit && x.hasThumb !== undefined) acts.push({ t: 'أعد جدولته', cls: 'dark', keep: true, fn: function (close) { requeueDialog(x, close); return false; } });
  acts.push({ t: 'إغلاق' });
  modal({ title: x.title || 'منشور', wide: true, body: [
    el('div', { class: 'pdgrid' }, [
      el('div', { class: 'pdl' }, [th, el('div', { class: 'row wrapr tiny' }, [el('span', { class: 'pill ' + st[1] }, [ico(st[2]), st[0]]), el('span', { text: fmtTime(x.when) }), el('span', { text: '· ' + (x.name || '') }), x.repeat ? el('span', { class: 'pill' }, [ico('history'), repeatLabel(x.repeat)]) : null]),
        x.err ? el('p', { class: 'err small', text: 'سبب الفشل: ' + x.err }) : null,
        el('div', { class: 'row wrapr' }, [x.link ? el('a', { class: 'btn sm line', href: x.link, target: '_blank', rel: 'noopener' }, [ico('link'), 'المنشور في القناة']) : null, x.item ? el('a', { class: 'btn sm line', href: '#/d/' + x.item, onclick: function () { closeModals(); } }, [ico('pencil'), 'افتح التصميم']) : null, el('button', { type: 'button', class: 'btn sm ghost', onclick: function (e) { copyText(capPlain(E.get())); btnDone(e.currentTarget, 'نُسخ'); } }, [ico('copy'), 'انسخ النص'])])]),
      el('div', { class: 'pdr' }, [
        queued && canEdit ? el('div', { class: 'capwhen' }, [el('b', { class: 'small', text: 'الموعد' }), el('div', { class: 'row wrapr' }, [dI, tI]), rep.node]) : null,
        el('b', { class: 'small', text: 'النص المصاحب' }),
        queued && canEdit ? el('div', { class: 'capedwrap' }, [E.bar, E.ed]) : el('div', { class: 'tgwrap light' }, [el('div', { class: 'tgbubble' }, [prev])]),
        queued && canEdit ? el('div', { class: 'row' }, [save]) : null
      ])
    ])
  ], acts: acts });
  calThumbs([x.id]);
}
function requeueDialog(x, closeParent) {
  const d = new Date(Date.now() + 3600000), dI = el('input', { type: 'date', class: 'inp sm', value: localISO(d), min: localISO() }), tI = el('input', { type: 'time', class: 'inp sm', value: localHM(d) });
  modal({ title: 'إعادة جدولة «' + (x.title || 'المنشور') + '»', body: [el('p', { class: 'muted small', text: 'يُنشر مرة أخرى بالصورة والنص نفسيهما في الموعد الذي تختاره.' }), el('div', { class: 'row wrapr' }, [dI, tI])], acts: [{ t: 'جدوله', cls: 'dark', keep: true, fn: function (close) {
    const b = $$('.modal .acts .btn.dark, .msheet .sacts .btn.dark').pop(), when = fromISO(dI.value, tI.value); if (!when || when.getTime() < Date.now() + 60000) { toast('اختر موعداً في المستقبل'); return false; }
    withBusy(b, async function () { await API6.me('tg_requeue', x.id, when.getTime()); POSTS = null; }, { busy: 'نجدول…', done: 'جُدول' }).then(function () { setTimeout(function () { close(); if (closeParent) closeParent(); CAL.loaded = false; CAL.redraw && CAL.redraw(); }, 500); }).catch(function () {});
    return false;
  } }, { t: 'إلغاء' }] });
}

/* ---------- المهمة: لي، أو أسندها مشرف إلى عضو ---------- */
let ACC_CACHE = null;
async function programMembers() {
  if (!isAdmin()) return [];
  if (!ACC_CACHE) { try { ACC_CACHE = await API6.me('acc_list'); } catch (e) { ACC_CACHE = []; } }
  return ACC_CACHE.filter(function (a) { return !a.disabled && (a.programs || []).indexOf(V6.prog.id) >= 0; });
}
async function taskDialog(t, day) {
  const isNew = !t; t = t || { title: '', note: '', due: 0, allDay: false, to: V6.me.uid, prio: 'normal', link: '' };
  const canEdit = isNew || t.canEdit, canDone = isNew ? false : t.canDone;
  const titleI = el('input', { type: 'text', class: 'inp', value: t.title, placeholder: 'ما المطلوب؟', 'aria-label': 'العنوان', maxlength: '140', disabled: !canEdit });
  const noteI = el('textarea', { class: 'inp', rows: '3', dir: 'auto', placeholder: 'تفاصيل، روابط، ملاحظات…', 'aria-label': 'ملاحظات', disabled: !canEdit }); noteI.value = t.note || '';
  const due0 = t.due ? new Date(t.due) : (day ? new Date(day) : null); if (due0 && !t.due) due0.setHours(9, 0, 0, 0);
  const dI = el('input', { type: 'date', class: 'inp sm', value: due0 ? localISO(due0) : '', 'aria-label': 'التاريخ', disabled: !canEdit }), tI = el('input', { type: 'time', class: 'inp sm', value: due0 ? localHM(due0) : '09:00', 'aria-label': 'الوقت', disabled: !canEdit || t.allDay });
  const allDay = el('input', { type: 'checkbox', checked: !!t.allDay, disabled: !canEdit, onchange: function (e) { tI.disabled = e.target.checked; } });
  let prio = t.prio || 'normal';
  const prioSeg = segOf([['normal', 'عادية'], ['high', 'مهمة']], prio, function (v) { prio = v; });
  const linkI = el('input', { type: 'text', class: 'inp sm', dir: 'ltr', value: t.link || '', placeholder: '#/d/… أو https://…', 'aria-label': 'رابط', disabled: !canEdit });
  const toSel = el('select', { class: 'inp sm', 'aria-label': 'لمن', disabled: !canEdit }, [el('option', { value: V6.me.uid, text: 'لي (' + V6.me.name + ')' }), el('option', { value: '', text: 'لكل فريق البرنامج' })]);
  if (isAdmin()) programMembers().then(function (ms) { ms.forEach(function (a) { if (a.uid !== V6.me.uid) toSel.appendChild(el('option', { value: a.uid, text: a.name + (a.role === 'sup' ? ' · مشرف' : '') })); }); toSel.value = t.to != null ? t.to : V6.me.uid; });
  toSel.value = t.to != null ? t.to : V6.me.uid;
  const save = el('button', { type: 'button', class: 'btn dark', onclick: function () {
    const title = titleI.value.trim(); if (!title) { toast('اكتب عنوان المهمة'); titleI.focus(); return; }
    let due = 0; if (dI.value) { const d = fromISO(dI.value, allDay.checked ? '09:00' : (tI.value || '09:00')); if (d) due = d.getTime(); }
    return withBusy(save, async function () {
      const r = await API6.me('task_save', JSON.stringify({ id: t.id, program: V6.prog.id, title: title, note: noteI.value, due: due, allDay: allDay.checked, to: toSel.value, prio: prio, link: linkI.value.trim(), status: t.status }));
      if (isNew) CAL.tasks.unshift(Object.assign({ canEdit: true, canDone: true, mine: true }, r)); else Object.assign(t, r);
      notifyDone(isNew ? 'أُضيفت المهمة' : 'حُفظت المهمة', title);
    }, { busy: 'نحفظ…', done: isNew ? 'أُضيفت' : 'حُفظت' }).then(function () { setTimeout(function () { closeModals(); CAL.redraw && CAL.redraw(); }, 600); }).catch(function () {});
  } }, [ico('check'), isNew ? 'أضف المهمة' : 'احفظ']);
  const acts = [];
  if (!isNew && canDone) acts.push({ t: t.status === 'done' ? 'أعدها مفتوحة' : 'أُنجزت ✓', cls: t.status === 'done' ? '' : 'dark', fn: function () { toggleTask(t, null).then(function () { CAL.redraw && CAL.redraw(); }); } });
  if (!isNew && canEdit) acts.push({ t: 'حذف', cls: 'danger', keep: true, fn: async function (close) { if (!(await ask('حذف المهمة', t.title, 'احذف', true))) return false; try { await API6.me('task_del', t.id); CAL.tasks = CAL.tasks.filter(function (x) { return x.id !== t.id; }); toast('حُذفت'); close(); CAL.redraw && CAL.redraw(); } catch (e) { toast(e.message); } return false; } });
  acts.push({ t: 'إغلاق' });
  modal({ title: isNew ? 'مهمة جديدة' : 'المهمة', wide: true, body: [
    !isNew ? el('div', { class: 'row wrapr tiny' }, [el('span', { class: 'pill ' + (t.status === 'done' ? 'gr' : 'or'), text: t.status === 'done' ? 'منجزة' + (t.doneBy ? ' · ' + t.doneBy : '') : 'مفتوحة' }), el('span', { text: 'من ' + (t.fromName || '') + (t.to ? ' إلى ' + (t.toName || '') : ' إلى كل الفريق') }), el('span', { text: '· ' + ago(t.at) })]) : null,
    el('div', { class: 'fld' }, [el('label', { text: 'العنوان' }), withEmoji(titleI)]),
    el('div', { class: 'fld' }, [el('label', { text: 'ملاحظات' }), withEmoji(noteI)]),
    el('div', { class: 'grid two' }, [
      el('div', { class: 'fld' }, [el('label', { text: 'الموعد' }), el('div', { class: 'row wrapr' }, [dI, tI]), el('label', { class: 'tog tiny' }, [allDay, el('span', { text: 'طوال اليوم' })])]),
      el('div', { class: 'fld' }, [el('label', { text: 'لمن' }), toSel, isAdmin() ? el('small', { text: 'يصل العضو إشعار في الجرس وتظهر في تقويمه.' }) : null])
    ]),
    el('div', { class: 'grid two' }, [el('div', { class: 'fld' }, [el('label', { text: 'الأهمية' }), prioSeg]), el('div', { class: 'fld' }, [el('label', { text: 'رابط (اختياري)' }), linkI])]),
    t.link ? el('a', { class: 'btn sm line', href: t.link, target: /^https?:/.test(t.link) ? '_blank' : null, rel: 'noopener', onclick: function () { closeModals(); } }, [ico('link'), 'افتح الرابط']) : null,
    canEdit ? el('div', { class: 'row' }, [save]) : null
  ], acts: acts });
}

/* ---------- في الرئيسية: القادم من التقويم بدل القائمة القديمة ---------- */
function calHomeWidget() {
  const box = el('div', { class: 'plist6 calmini' });
  calLoad().then(function () {
    const now = Date.now();
    const items = CAL.posts.filter(function (x) { return x.status === 'queued' && x.when >= now - 600000; }).map(function (x) { return { kind: 'post', t: x.when, x: x }; })
      .concat(CAL.tasks.filter(function (t) { return t.status !== 'done' && (t.mine || t.to === '') ; }).map(function (t) { return { kind: 'task', t: t.due || now + 1e12, x: t }; }))
      .sort(function (a, b) { return a.t - b.t; }).slice(0, 4);
    box.appendChild(el('div', { class: 'row' }, [el('h2', { class: 'psh', text: 'القادم في التقويم' }), el('span', { class: 'sp' }), el('a', { class: 'btn sm ghost', href: '#/cal', text: 'التقويم والمهام' })]));
    if (!items.length) { box.appendChild(el('p', { class: 'tiny', text: 'لا منشورات مجدولة ولا مهام مفتوحة.' })); return; }
    items.forEach(function (it, i) {
      if (it.kind === 'post') { const x = it.x; const th = el('span', { class: 'cthumb', 'data-id': x.id }); box.appendChild(el('button', { type: 'button', class: 'prow6 rv', style: '--d:' + i, onclick: function () { go('#/cal?post=' + x.id); } }, [th, el('div', { class: 'grow' }, [el('b', { text: x.title || 'منشور' }), el('span', { class: 'tiny', text: fmtTime(x.when) + (x.repeat ? ' · ' + repeatLabel(x.repeat) : '') })]), ico('send')])); }
      else { const t = it.x; box.appendChild(el('button', { type: 'button', class: 'prow6 rv task' + (t.prio === 'high' ? ' high' : ''), style: '--d:' + i, onclick: function () { go('#/cal?task=' + t.id); } }, [el('span', { class: 'tchk' }, [ico('check')]), el('div', { class: 'grow' }, [el('b', { text: t.title }), el('span', { class: 'tiny', text: (t.due ? fmtTime(t.due) : 'بلا موعد') + (t.from !== V6.me.uid ? ' · من ' + t.fromName : '') })]), ico('chev')])); }
    });
    revealAll(box);
    calThumbs(items.filter(function (i) { return i.kind === 'post'; }).map(function (i) { return i.x.id; }));
  }).catch(function () {});
  return box;
}
