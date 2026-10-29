/* ============================================================
   الصفحات: الرئيسية (الإدارة والفريق)، المسار وجدول الفصل، المنظور الزمني
   ============================================================ */

/* ---------- بطاقة النشاط ---------- */
function evChip(a, tid, o = {}) {
  const t = T(tid), drag = canAdjust(tid) && !o.noDrag && !String(a.id).startsWith('tmp'), cl = clashOf(tid, a);
  const flags = (cl ? `<span class="cl" data-tip="${esc(cl)}">${svg('alert')}</span>` : '') + (a.meet && a.meet.uri ? `<span data-tip="له رابط ميت">${svg('video')}</span>` : '') + (a.cal && a.cal.id ? `<span data-tip="في تقويم جوجل">${svg('gcal')}</span>` : '') + (a.done ? `<span data-tip="تم التنفيذ">${svg('check')}</span>` : '');
  const meta = [o.track ? `<span class="tbadge">${esc(t.name)}</span>` : '', o.big ? `<span class="ty">${esc(a.type)}</span>` : '', a.time ? `<span>${timeText(a.time)}</span>` : '', a.who && a.who.length ? `<span>${esc(a.who.join('، '))}</span>` : '', o.date ? `<span>${gDay(a.d)}</span>` : '', flags ? `<span class="flag">${flags}</span>` : ''].filter(Boolean).join('');
  return `<div class="ev ${o.track || o.tint ? 'tinted' : ''} ${o.big ? 'big' : ''} ${cl ? 'clash' : ''} ${a.done ? 'done' : ''} ${isLate(a) ? 'late' : ''} ${typeof F !== 'undefined' && F && F.dock && F.id === a.id ? 'sel' : ''}" role="button" tabindex="0" data-act="openact" data-id="${a.id}" data-track="${tid}" ${drag ? 'data-drag="1"' : ''} style="--tcol:${t.color};--tyc:${typeOf(a.type)[1]}">
    ${tile(a.type, 'sm')}<span class="tx"><span class="tt clamp2">${esc(a.title)}</span>${meta ? `<span class="mt">${meta}</span>` : ''}</span></div>`;
}
const pageHead = (eyebrow, title, lead, side = '', reveal = false) => `<div class="ph"><div class="t">${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}<h1 class="${reveal ? 'reveal' : ''}">${reveal ? title.split(' ').map((w, i) => `<span class="w" style="animation-delay:${i * 70}ms">${esc(w)}</span>`).join(' ') : esc(title)}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</div>${side}</div>`;
const todayLine = () => `${gLong(TODAY)} · ${esc(hijri(TODAY))}`;

/* ---------- الصحة الأسبوعية للمسار ---------- */
function semStartMin() { return D.tracks.map(t => semRange(t.id, curN(t.id))).filter(Boolean).map(r => r.from).sort()[0]; }
function focusWeek() { const s0 = semStartMin(); return s0 && TODAY < s0 && diffD(s0, TODAY) <= 10 ? wkStart(s0) : wkStart(TODAY); }
function health(id, ws) {
  const we = add(ws, 6), ds = daysOf(id).filter(d => d.d >= ws && d.d <= we);
  const acts = actsOf(id).filter(a => a.d >= ws && a.d <= we).sort(sortA);
  if (!daysOf(id).length) return { k: 'grey', label: 'لا جدول للفصل بعد', acts };
  if (!ds.length) return { k: 'grey', label: TODAY < daysOf(id)[0].d ? 'يبدأ ' + gDay(daysOf(id)[0].d) : 'خارج الفصل', acts };
  if (!acts.length) return ds.some(d => d.c) ? { k: 'none', label: 'لا أنشطة في الخطة', acts } : { k: 'grey', label: 'إجازة أو اختبارات', acts };
  const meet = acts.find(a => remindable(a) && a.d >= TODAY);
  const warn = acts.some(a => remindable(a) && !a.done && diffD(a.d, TODAY) >= 0 && diffD(a.d, TODAY) <= 3 && !(a.who && a.who.length)) || acts.some(isLate);
  return { k: warn ? 'warn' : 'ok', label: nActs(acts.length) + (meet ? `، لقاء ${DAYS[wd(meet.d)]}` : ''), acts };
}
const hlDot = h => `<span class="hl ${h.k}"><i></i><span class="lab ellip">${esc(h.label)}</span></span>`;

/* ---------- نبض المسارات: شريط لكل مسار مقسوم على أسابيع الفصل ---------- */
function pulse(ws, animate) {
  const ranges = D.tracks.map(t => semRange(t.id, curN(t.id))).filter(Boolean);
  if (!ranges.length) return `<div class="card empty">${svg('table')}<h3>لا جداول فصول بعد</h3><p>ابدأ بجدول الفصل لأي مسار من صفحته.</p></div>`;
  const g0 = wkStart(ranges.map(r => r.from).sort()[0]), g1 = ranges.map(r => r.to).sort().pop();
  const n = Math.ceil((diffD(g1, g0) + 1) / 7), cur = Math.floor(diffD(ws, g0) / 7);
  const head = Array.from({ length: n }, (_, i) => `<span class="${i === cur ? 'now' : ''}" data-tip="${gShort(add(g0, i * 7))} – ${gShort(add(g0, i * 7 + 6))}">${i + 1}</span>`).join('');
  const rows = D.tracks.map((t, ri) => {
    const ds = daysOf(t.id), acts = actsOf(t.id, curN(t.id)), h = health(t.id, ws);
    const cells = Array.from({ length: n }, (_, i) => {
      const a0 = add(g0, i * 7), a1 = add(a0, 6), wd_ = ds.filter(d => d.d >= a0 && d.d <= a1);
      if (!wd_.length) return `<span class="wk" style="visibility:hidden"></span>`;
      const ac = acts.filter(a => a.d >= a0 && a.d <= a1), study = wd_.some(d => d.c), past = a1 < TODAY || (a0 <= TODAY && TODAY <= a1);
      let cls = 'wk', st = `--i:${i};--r:${ri};`;
      if (ac.length) { cls += ' f'; st += `--tc:${t.color};--o:${ac.length >= 3 ? 1 : ac.length === 2 ? .78 : .55};`; }
      else if (!study) cls += ' off'; else if (past) cls += ' past0';
      if (i === cur) cls += ' now';
      const tip = `الأسبوع ${wd_[0].w} (${gShort(a0)} – ${gShort(a1)}): ` + (ac.length ? nActs(ac.length) + ' — ' + [...new Set(ac.map(a => a.type))].join('، ') : study ? 'لا أنشطة' : (wd_.find(d => d.p) || {}).p || 'بلا مقررات');
      return `<a class="${cls}" style="${st}" href="#timeline" data-act="tlweek" data-date="${a0}" data-id="${t.id}" data-tip="${esc(tip)}" aria-label="${esc(t.name + ': ' + tip)}"></a>`;
    }).join('');
    return `<a class="tn" href="#t/${t.id}">${logoImg(t.id)}<span class="col" style="min-width:0;line-height:1.3"><b>${esc(t.name)}</b><span class="xs faint">${esc(t.cohort || t.age || '')}</span></span></a>
      <div class="weeks" style="--n:${n}">${cells}</div>
      <div class="st">${hlDot(h)}</div>`;
  }).join('');
  return `<div class="card pulse ${animate ? 'draw' : ''}">
    <div class="pulse-grid">
      <span class="hdr t">المسار</span><div class="weeks h hdr w" style="--n:${n}">${head}</div><span class="hdr s">${ws === wkStart(TODAY) ? 'هذا الأسبوع' : 'الأسبوع ' + (cur + 1)}</span>
      ${rows}
    </div>
    <div class="legend"><span><i style="background:var(--ink2)"></i>أسبوع فيه أنشطة (يشتد اللون بعددها)</span><span><i style="border:1.5px dashed var(--line2)"></i>مضى بلا أنشطة</span><span><i style="background:repeating-linear-gradient(-45deg,var(--sunken) 0 3px,transparent 3px 6px);border:1px solid var(--line)"></i>إجازة أو اختبارات</span><span><i style="background:var(--sunken)"></i>قادم</span></div>
  </div>`;
}

/* ---------- لوحة الأسبوع (كل المسارات) ---------- */
let HB = { ws: '' };
function weekBoard(ws, tids) {
  const cols = Array.from({ length: 7 }, (_, i) => {
    const d = add(ws, i), acts = tids.flatMap(id => actsOf(id).filter(a => a.d === d).map(a => [a, id])).sort((x, y) => sortA(x[0], y[0]));
    const study = tids.some(id => (dayOf(id, curN(id), d) || {}).c), inSem = tids.some(id => dayOf(id, curN(id), d));
    return `<div class="bcol ${d === TODAY ? 'today' : ''} ${inSem && !study ? 'off' : ''}" data-drop="1" data-date="${d}">
      <div class="bh"><b>${DAYS[i]}</b><span class="xs faint" data-tip="${esc(hijri(d))}">${gShort(d)}</span></div>
      ${acts.map(([a, id]) => evChip(a, id, { track: tids.length > 1 })).join('')}
      ${tids.some(canEdit) ? `<button class="add" type="button" data-act="newact" data-date="${d}" ${tids.length === 1 ? `data-track="${tids[0]}"` : ''}>+ نشاط</button>` : ''}
    </div>`;
  }).join('');
  return `<div class="board">${cols}</div>`;
}

/* ---------- الجوال: قائمة حالة المسارات، وأجندة الأسبوع ---------- */
function trackStrip(ws) {
  return `<div class="card strip">${D.tracks.map(t => { const h = health(t.id, ws); return `<a class="srow" href="#t/${t.id}" style="--tc:${t.color}"><span class="slogo">${logoImg(t.id)}</span><span class="col" style="min-width:0;flex:1"><b>${esc(t.name)}</b>${hlDot(h)}</span>${svg('fwd')}</a>`; }).join('')}</div>`;
}
function agenda(ws, tids, o = {}) {
  const days = Array.from({ length: 7 }, (_, i) => add(ws, i)), empty = [];
  let h = '';
  for (const d of days) {
    const acts = tids.flatMap(id => actsOf(id).filter(a => a.d === d).map(a => [a, id])).sort((x, y) => sortA(x[0], y[0]));
    if (!acts.length) { empty.push(d); continue; }
    h += `<div class="ag-d ${d === TODAY ? 'today' : ''}" data-drop="1" data-date="${d}" ${tids.length === 1 ? `data-track="${tids[0]}"` : ''}><div class="ag-h"><b>${d === TODAY ? 'اليوم' : d === add(TODAY, 1) ? 'غدًا' : DAYS[wd(d)]}</b><span class="xs faint">${gShort(d)}</span></div>${acts.map(([a, id]) => evChip(a, id, { track: tids.length > 1 })).join('')}</div>`;
  }
  if (!h) h = `<p class="muted sm" style="padding:6px 2px">لا أنشطة في هذا الأسبوع.</p>`;
  if (empty.length && h.indexOf('ag-d') >= 0) h += `<p class="xs faint ag-empty">بلا أنشطة: ${empty.map(d => DAYS[wd(d)]).join('، ')}</p>`;
  return `<div class="agenda">${h}</div>`;
}
// أسبوع الجوال في صفحة المسار
const MW = {};
function mobWeek(id, sem) {
  const W = weeksOf(sem.days); if (!W.length) return null;
  let i = MW[id + '|' + sem.n];
  if (i == null) { i = W.findIndex(x => x.from <= TODAY && TODAY <= x.to); if (i < 0) i = TODAY < W[0].from ? 0 : W.length - 1; }
  i = Math.max(0, Math.min(W.length - 1, i)); MW[id + '|' + sem.n] = i;
  return { W, i };
}

/* ---------- ما يحتاج انتباه الإدارة ---------- */
function attention(ws) {
  const L = [];
  D.tracks.filter(t => t.editReq).forEach(t => L.push({ ic: 'unlock', k: 'brand', html: `<b>${esc(t.name)}</b> طلب فتح تعديل الخطة${t.editReq.note ? `: «${esc(t.editReq.note)}»` : ''} <span class="faint">${ago(t.editReq.at)}</span>`, act: `<button class="btn sm pri" type="button" data-act="grant" data-id="${t.id}">افتح التعديل</button>` }));
  if (D.unseen) L.push({ ic: 'bell', k: 'brand', html: `${D.unseen === 1 ? 'تغيير جديد' : D.unseen === 2 ? 'تغييران جديدان' : D.unseen + ' تغييرات جديدة'} من الفرق على خططها`, act: `<a class="btn sm pri" href="#alerts">اعرضها</a>` });
  const acts = allActs(), seenC = {};
  acts.filter(a => a.d >= TODAY && diffD(a.d, TODAY) <= 14 && clashOf(a.t, a)).forEach(a => { const k = a.t + a.d; if (seenC[k]) return; seenC[k] = 1; L.push({ ic: 'alert', k: 'warn', html: `<b>${esc(T(a.t).name)}</b> ${gDay(a.d)}: ${esc(clashOf(a.t, a))}`, act: `<button class="btn sm" type="button" data-act="openact" data-id="${a.id}" data-track="${a.t}">راجعه</button>` }); });
  D.tracks.forEach(t => kahootSugs(t.id).filter(s => s.left <= 14).forEach(s => L.push({ ic: 'target', k: 'brand', html: `<b>${esc(t.name)}</b>: ${esc(s.exam)} ${rel(s.ed)}. اقتراح: كاهوت مراجعة ${gDay(s.d)}`, act: `<button class="btn sm" type="button" data-act="newact" data-track="${t.id}" data-date="${s.d}" data-type="كاهوت" data-title="${esc(s.title)}">أضفه</button>` })));
  acts.filter(a => remindable(a) && !a.done && diffD(a.d, TODAY) >= 0 && diffD(a.d, TODAY) <= 3 && !(a.who && a.who.length)).forEach(a => L.push({ ic: 'users', k: 'warn', html: `لقاء «${esc(a.title)}» في ${esc(T(a.t).name)} ${rel(a.d)} بلا مسؤول`, act: `<button class="btn sm" type="button" data-act="openact" data-id="${a.id}" data-track="${a.t}">حدّد المسؤول</button>` }));
  D.tracks.forEach(t => { const h = health(t.id, ws); if (h.k === 'none') L.push({ ic: 'flag', k: 'none', html: `<b>${esc(t.name)}</b>: لا أنشطة في خطة ${ws === wkStart(TODAY) ? 'هذا الأسبوع' : 'الأسبوع الأول'}`, act: `<a class="btn sm" href="#t/${t.id}">افتح الخطة</a>` }); });
  const late = acts.filter(a => isLate(a) && diffD(TODAY, a.d) <= 14);
  if (late.length) L.push({ ic: 'clock', k: 'warn', html: `${nActs(late.length)} مضى موعدها ولم تُعلَّم «تم» (${[...new Set(late.map(a => T(a.t).name))].join('، ')})`, act: `<a class="btn sm" href="#timeline">راجعها</a>` });
  const calErr = acts.filter(a => a.cal && a.cal.err);
  if (calErr.length) L.push({ ic: 'gcal', k: 'warn', html: `${nActs(calErr.length)} تعذّر تحديثها في تقويم جوجل`, act: `<a class="btn sm" href="#calendar">أعد المحاولة</a>` });
  if (!D.bot) L.push({ ic: 'bot', k: 'brand', html: 'بوت التذكيرات لم يُربط بعد', act: `<a class="btn sm" href="#bot">اربط البوت</a>` });
  else { const un = D.tracks.filter(t => !t.linked); if (un.length) L.push({ ic: 'bot', k: 'none', html: `مسارات لم تُربط مجموعتها بالبوت: ${un.map(t => esc(t.name)).join('، ')}`, act: `<a class="btn sm" href="#bot">اربطها</a>` }); }
  return L;
}
function feed(list, n = 8) {
  if (!list || !list.length) return `<p class="muted sm">لا تحديثات بعد. ستظهر هنا تعديلات الفرق على خططها.</p>`;
  return `<div class="list feed">${list.slice(0, n).map(x => { const t = x.t && T(x.t); return `<div class="li">${x.role === 'admin' ? adminAv() : !x.role ? `<span class="tile sm" style="--tc:var(--ink3);border-radius:50%;width:28px;height:28px">${svg('bot')}</span>` : avatar(x.by, t ? t.color : 'var(--ink3)')}<div class="tx"><div class="tt sm"><b style="font-weight:500">${esc(x.by)}</b> ${esc(x.what)}${x.d ? ` «<bdi>${esc(x.d)}</bdi>»` : ''}</div><div class="mt">${t && isAdmin() ? esc(t.name) + ' · ' : ''}${ago(x.at)}</div></div></div>`; }).join('')}</div>`;
}

/* ---------- الرئيسية ---------- */
VIEWS.home = {
  render() { return isAdmin() ? adminHome() : teamHome(myTrack(), false); },
  after() { $$('.draw').forEach(el => setTimeout(() => el.classList.remove('draw'), 1600)); }
};
VIEWS.tracks = { render() { return tracksIndex(); } };
let HOME_ANIM = true;
function adminHome() {
  const ws = focusWeek(), pre = ws !== wkStart(TODAY), s0 = semStartMin();
  if (!HB.ws) HB.ws = ws;
  const hs = D.tracks.map(t => [t, health(t.id, ws)]);
  const ok = hs.filter(x => x[1].k === 'ok' || x[1].k === 'warn'), none = hs.filter(x => x[1].k === 'none');
  const title = pre ? 'هل المسارات جاهزة للأسبوع الأول؟' : 'هل تعمل المسارات هذا الأسبوع؟';
  let lead = pre ? `يبدأ الفصل ${rel(s0)}، ${gDay(s0)}. ` : '';
  lead += ok.length === D.tracks.length ? 'كل المسارات وضعت أنشطة ' + (pre ? 'للأسبوع الأول.' : 'لهذا الأسبوع.') :
    (ok.length ? `${ok.length === 1 ? 'مسار واحد' : ok.length === 2 ? 'مساران' : ok.length + ' مسارات'} ${ok.length === 2 ? 'وضعا' : ok.length > 2 ? 'وضعت' : 'وضع'} أنشطة ${pre ? 'للأسبوع الأول' : 'لهذا الأسبوع'}` : 'لم يضع أي مسار أنشطة بعد') +
    (none.length ? `، ولم يضع ${none.map(x => '<b>' + esc(x[0].name) + '</b>').join(' و')} شيئًا بعد.` : '.');
  const anim = HOME_ANIM; HOME_ANIM = false;
  const att = attention(ws), we = add(HB.ws, 6);
  const mob = isMob();
  return pageHead(todayLine(), title, lead, '', anim) + (mob ? trackStrip(ws) : pulse(ws, anim)) + `
  <div class="grid2 sect">
    <div class="card"><div class="card-h"><h3>يحتاج انتباهك</h3>${att.length ? `<span class="badge soft">${att.length}</span>` : ''}</div>
      ${att.length ? `<div class="list">${att.map(x => `<div class="li"><span class="tile sm" style="--tc:${x.k === 'warn' ? 'var(--warn)' : x.k === 'brand' ? 'var(--brand)' : 'var(--ink3)'}">${svg(x.ic)}</span><div class="tx sm">${x.html}</div>${x.act}</div>`).join('')}</div>` : `<p class="muted sm">لا شيء يحتاجك الآن.</p>`}</div>
    <div class="card"><div class="card-h"><h3>آخر التحديثات</h3><span class="xs faint">تعديلات الفرق والإدارة</span></div>${feed(D.log, mob ? 3 : 6)}</div>
  </div>
  <div class="sect"><div class="sh"><h2>${HB.ws === wkStart(TODAY) ? 'هذا الأسبوع' : HB.ws === ws && pre ? 'الأسبوع الأول' : 'أسبوع ' + gShort(HB.ws)}</h2>
      <span class="xs faint">${gShort(HB.ws)} – ${gShort(we)}</span>
      <div class="row" style="gap:2px"><button class="btn icon" type="button" data-act="hbw" data-n="-7" aria-label="الأسبوع السابق">${svg('back')}</button><button class="btn sm ghost" type="button" data-act="hbw" data-n="0">${pre ? 'الأول' : 'الآن'}</button><button class="btn icon" type="button" data-act="hbw" data-n="7" aria-label="الأسبوع التالي">${svg('fwd')}</button></div></div>
    ${mob ? agenda(HB.ws, D.tracks.map(t => t.id)) : weekBoard(HB.ws, D.tracks.map(t => t.id))}</div>`;
}
function tracksIndex() {
  const ws = focusWeek();
  return pageHead(todayLine(), 'المسارات', '') + `<div class="grid3 tix">${D.tracks.map(t => {
    const h = health(t.id, ws), r = semRange(t.id, curN(t.id)), n = actsOf(t.id, curN(t.id)).length;
    return `<a class="card tcard" href="#t/${t.id}" style="--tc:${t.color}"><span class="tlogo">${logoImg(t.id)}</span>
      <span class="col" style="gap:4px;min-width:0"><b class="tname">${esc(t.full || t.name)}</b><span class="xs faint">${esc([t.cohort, t.age].filter(Boolean).join(' · '))}</span></span>
      <span class="sm">${hlDot(h)}</span>
      <span class="xs faint">${semLabel(curN(t.id))}${r ? ' · ' + gShort(r.from) + ' – ' + gShort(r.to) : ''} · ${nActs(n)}</span></a>`;
  }).join('')}</div>`;
}

/* ---------- رئيسية الفريق ---------- */
function nextMeeting(id) { return actsOf(id).filter(a => remindable(a) && !a.done && a.d >= TODAY).sort(sortA)[0]; }
function teamHome(id, preview) {
  const t = T(id), n = curN(id), ds = daysOf(id, n), r = semRange(id, n), ws = weeksOf(ds), nw = nowWeek(id);
  const acts = actsOf(id, n).sort(sortA);
  let lead;
  if (!r) lead = 'لا جدول لهذا الفصل بعد.';
  else if (TODAY < r.from) lead = `يبدأ ${semLabel(n)} ${rel(r.from)}، ${gDay(r.from)}.`;
  else if (TODAY > r.to) lead = `انتهى ${semLabel(n)}.`;
  else lead = `الأسبوع ${nw} من ${ws.length} في ${semLabel(n)}.`;
  const permPill = t.canEdit ? `<span class="pill ok">${svg('unlock')}التعديل مفتوح لكم</span>` : `<span class="pill">${svg('lock')}إضافة الأنشطة مغلقة</span>`;
  const botPill = t.linked ? `<span class="pill brand">${svg('bot')}البوت يذكّر مجموعتكم</span>` : '';
  const m = nextMeeting(id);
  let hero;
  if (m) {
    const dd = diffD(m.d, TODAY), d3 = add(m.d, -3), d1 = add(m.d, -1), sent = m.sent || {};
    const st = (d, k) => sent[k] === m.d ? 'done' : d <= TODAY ? (m.d >= TODAY ? 'now' : 'done') : '';
    hero = `<div class="hero"><div style="min-width:0">
      <div class="faint sm">${remindable(m) ? 'اللقاء القادم' : 'القادم'}</div>
      <div class="count">${dd === 0 ? 'اليوم' : dd === 1 ? 'غدًا' : dd === 2 ? 'بعد يومين' : `بعد ${dd} ${dd <= 10 ? 'أيام' : 'يومًا'}`}</div>
      <div class="ttl">${esc(m.title)}</div>
      <div class="muted sm" style="margin-top:4px">${gDay(m.d)}${m.time ? '، الساعة ' + timeText(m.time) : ''}${m.who && m.who.length ? ' · ' + esc(m.who.join('، ')) : ''}</div>
      <div class="rtl-steps">
        ${dd >= 2 ? `<div class="stp ${st(d3, 'd3')}"><i></i><b>تصميم الإعلان</b><span>${d3 < TODAY ? gDay(TODAY) : gDay(d3)}</span></div>` : ''}
        <div class="stp ${st(d1, 'd1')}"><i></i><b>نشر الإعلان</b><span>${gDay(d1 < TODAY ? TODAY : d1)}</span></div>
        <div class="stp big ${m.d === TODAY ? 'now' : ''}"><i></i><b>اللقاء</b><span>${gDay(m.d)}</span></div>
      </div></div>
      <div class="side-l">${m.meet && m.meet.uri ? `<a class="btn pri" href="${esc(m.meet.uri)}" target="_blank" rel="noopener">${svg('video')}ادخل اللقاء</a><button class="btn" type="button" data-act="openact" data-id="${m.id}" data-track="${id}">تفاصيل اللقاء</button>` : `<button class="btn pri" type="button" data-act="openact" data-id="${m.id}" data-track="${id}">تفاصيل اللقاء</button>`}${t.linked ? `<span class="xs faint">يصل التذكير مجموعتكم في موعده</span>` : ''}</div></div>`;
  } else hero = `<div class="hero"><div><div class="faint sm">اللقاء القادم</div><div class="ttl">لا لقاء في الخطة بعد</div><p class="muted sm" style="margin-top:6px">${canEdit(id) ? 'أضيفوا لقاءات الفصل لتظهر هنا ويذكّر بها البوت.' : 'ستظهر هنا اللقاءات حين تُضاف إلى الخطة.'}</p></div>${canEdit(id) ? `<div class="side-l"><button class="btn pri" type="button" data-act="newact" data-track="${id}" data-type="لقاء">+ لقاء</button></div>` : ''}</div>`;
  const up = acts.filter(a => a.d >= TODAY && diffD(a.d, TODAY) <= 14);
  const late = acts.filter(isLate);
  const today = dayOf(id, n, TODAY);
  const upList = up.length ? `<div class="list">${up.map(a => actRow(a, id)).join('')}</div>` : `<p class="muted sm">لا أنشطة خلال الأسبوعين القادمين.</p>`;
  return (preview ? `<div class="demo-bar">${svg('eye')}<span>هكذا يرى فريق ${esc(t.name)} صفحته الرئيسية.</span><span class="sp"></span><a class="lk" href="#t/${id}">عودة إلى المسار</a></div>` : '') +
    pageHead(todayLine(), 'أهلًا بفريق ' + t.name, esc(lead), `<div class="row" style="flex-wrap:wrap">${permPill}${botPill}</div>`) + hero + `
  <div class="cols sect">
    <section class="stack">
      ${teamNotes(id)}
      <div class="card"><div class="card-h"><h3>القادم خلال أسبوعين</h3><a class="lk sm" href="#t/${id}">خطة الفصل كاملة</a></div>${upList}</div>
      ${late.length ? `<div class="card"><div class="card-h"><h3>مضى موعدها</h3><span class="xs faint">علّموا ما نُفّذ</span></div><div class="list">${late.slice(-8).reverse().map(a => actRow(a, id)).join('')}</div></div>` : ''}
    </section>
    <aside class="stack">
      <div class="card"><div class="card-h"><h3>مقرر الطلاب اليوم</h3></div>${today && today.c ? `<div class="ctx" style="background:none;padding:0"><b>${esc(today.c)}</b>${today.q ? `<span>${esc(today.q)}</span>` : ''}${today.r ? `<span class="faint">${esc(today.r)}</span>` : ''}</div>` : `<p class="muted sm">${today && today.p ? esc(today.p) : today && today.ev ? esc(today.ev) : 'لا مقرر اليوم.'}</p>`}</div>
      ${botCardTeam(id, preview)}
      ${!t.canEdit && !preview && !isAdmin() ? `<div class="card"><div class="card-h"><h3>تحتاجون إضافة أنشطة؟</h3></div><p class="muted sm" style="margin-bottom:12px">تستطيعون تغيير مواعيد الأنشطة والمسؤولين عنها وتفاصيلها، ويصل الإدارةَ تنبيه بذلك. لإضافة أنشطة جديدة أو حذفها اطلبوا فتح الإضافة.</p>${t.editReq ? `<span class="pill brand">${svg('check')}أُرسل الطلب ${ago(t.editReq.at)}</span>` : `<button class="btn" type="button" data-act="askedit">اطلب فتح الإضافة</button>`}</div>` : ''}
      <div class="card"><div class="card-h"><h3>الفريق</h3>${canAdjust(id) ? `<button class="btn sm ghost" type="button" data-act="members" data-id="${id}">تعديل</button>` : ''}</div>${members(id).length ? `<div class="whos">${members(id).map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div>` : `<p class="muted sm">لم تُكتب أسماء الفريق بعد.</p>`}</div>
    </aside>
  </div>
  ${isMob() ? `<details class="sect mfold"><summary><h2>خلاصة الفصل</h2><span class="xs faint">${semLabel(n)}</span>${svg('down')}</summary>${semStats(id, n)}</details>` : `<div class="sect"><div class="sh"><h2>خلاصة الفصل</h2><span class="xs faint">${semLabel(n)}</span></div>${semStats(id, n)}</div>`}`;
}
function teamNotes(id) {
  const ed = canEdit(id), seen = {};
  const cls = actsOf(id).filter(a => a.d >= TODAY && diffD(a.d, TODAY) <= 21 && clashOf(id, a)).filter(a => !seen[a.d] && (seen[a.d] = 1));
  const sugs = kahootSugs(id).filter(s => s.left <= 21);
  if (!cls.length && !sugs.length) return '';
  return `<div class="card notes"><div class="card-h"><h3>تنبيهات واقتراحات</h3></div><div class="col" style="gap:8px">
    ${cls.map(a => `<button class="dk-note warn" type="button" data-act="openact" data-id="${a.id}" data-track="${id}">${svg('alert')}<span><b>${gDay(a.d)}:</b> ${esc(clashOf(id, a))}. الأنسب نقل اللقاء إلى يوم آخر.</span></button>`).join('')}
    ${sugs.map(s => `<div class="dk-note sug">${tile('كاهوت', 'sm')}<span>${esc(s.exam)} ${rel(s.ed)}. <b>اقتراح:</b> كاهوت مراجعة ${gDay(s.d)} يثبّت ما درسه الطلاب قبل الاختبار.</span>${ed ? `<button class="btn sm" type="button" data-act="newact" data-track="${id}" data-date="${s.d}" data-type="كاهوت" data-title="${esc(s.title)}">أضفه</button>` : ''}</div>`).join('')}
  </div></div>`;
}
function actRow(a, id) {
  const t = T(id);
  return `<div class="li"><button class="ck round ok" type="button" role="checkbox" aria-checked="${!!a.done}" data-act="done" data-id="${a.id}" data-track="${id}" aria-label="تم تنفيذ ${esc(a.title)}">${svg('check', 2.4)}</button>
    ${tile(a.type, 'sm')}<button class="tx" type="button" style="text-align:start" data-act="openact" data-id="${a.id}" data-track="${id}"><div class="tt ${a.done ? 'faint' : ''}">${esc(a.title)}</div><div class="mt">${gDay(a.d)} · ${rel(a.d)}${a.time ? ' · ' + timeText(a.time) : ''}${a.who && a.who.length ? ' · ' + esc(a.who.join('، ')) : ''}</div></button>
    ${remindable(a) && t.linked ? `<span class="faint" data-tip="يُذكَّر به في المجموعة">${svg('bell')}</span>` : ''}</div>`;
}
function botCardTeam(id, preview) {
  const t = T(id);
  if (t.linked) return '';
  const tg = D.tg;
  if (isAdmin()) return D.bot ? `<div class="card"><div class="card-h"><h3>مجموعة الفريق</h3></div><p class="muted sm" style="margin-bottom:12px">لم تُربط مجموعة ${esc(t.name)} بالبوت بعد.</p><a class="btn" href="#bot">اربطها من صفحة البوت</a></div>` : '';
  if (!tg) return '';
  return `<div class="card"><div class="card-h"><h3>تذكيرات اللقاءات في مجموعتكم</h3></div><p class="muted sm" style="margin-bottom:12px">أضيفوا البوت إلى مجموعة الفريق في تليجرام، فيذكّركم قبل كل لقاء بثلاثة أيام لتصميم الإعلان، وقبله بيوم لنشره.</p>
    <a class="btn pri" href="${esc(tg.link)}" target="_blank" rel="noopener" data-act="tglink">${svg('send')}أضف البوت إلى المجموعة</a><p class="hint" style="margin-top:8px">يفتح تليجرام فتختارون المجموعة، ثم يتم الربط تلقائيًا.</p></div>`;
}

/* ---------- خلاصة الفصل: التقدم، الأنواع، الأعضاء، الأسابيع الفارغة ---------- */
function semStats(id, n) {
  const t = T(id), ds = daysOf(id, n), weeks = weeksOf(ds), acts = actsOf(id, n);
  if (!weeks.length) return `<div class="card empty">${svg('table')}<p>تظهر الخلاصة حين يُضاف جدول الفصل.</p></div>`;
  const N = weeks.length, wIdx = a => { const w = weeks.findIndex(W => a.d >= W.from && a.d <= W.to); return w < 0 ? (a.d < weeks[0].from ? 0 : N - 1) : w; };
  const plan = Array(N).fill(0), done = Array(N).fill(0); acts.forEach(a => { plan[wIdx(a)]++; if (a.done) done[wIdx(a)]++; });
  let cp = 0, cd = 0; const P_ = plan.map(x => cp += x), D_ = done.map(x => cd += x);
  const nowI = weeks.findIndex(W => TODAY >= W.from && TODAY <= W.to), upto = nowI < 0 ? (TODAY > weeks[N - 1].to ? N - 1 : -1) : nowI;
  const W = 560, H = 190, padX = 26, padY = 18, max = Math.max(4, cp), x = i => W - padX - (i + .5) * (W - 2 * padX) / N, y = v => H - padY - v * (H - 2 * padY) / max;
  const pl = P_.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const dl = upto >= 0 ? D_.slice(0, upto + 1).map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ') : '';
  const area = upto >= 0 ? `${x(0).toFixed(1)},${y(0)} ${dl} ${x(upto).toFixed(1)},${y(0)}` : '';
  const burn = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="الأنشطة المخططة والمنفذة عبر أسابيع الفصل">
    <line class="ax" x1="${padX}" x2="${W - padX}" y1="${y(0)}" y2="${y(0)}"/>
    ${[...Array(N)].map((_, i) => i % 2 === 0 ? `<text x="${x(i)}" y="${H - 2}" text-anchor="middle">${weeks[i].w}</text>` : '').join('')}
    <text x="${W - padX}" y="${y(max) - 4}" text-anchor="end">${max}</text>
    ${area ? `<polygon class="area" points="${area}"/>` : ''}
    <polyline class="plan" points="${pl}"/>${dl ? `<polyline class="done" points="${dl}"/>` : ''}
    ${nowI >= 0 ? `<line class="nowl" x1="${x(nowI)}" x2="${x(nowI)}" y1="${padY - 6}" y2="${y(0)}"/>` : ''}
  </svg>`;
  const tc = {}; acts.forEach(a => tc[a.type] = (tc[a.type] || 0) + 1);
  const tmax = Math.max(1, ...Object.values(tc));
  const types = Object.keys(tc).sort((a, b) => tc[b] - tc[a]).map(k => `<div class="bar"><span class="row" style="gap:6px">${tile(k, 'sm')}<span class="ellip">${esc(k)}</span></span><span class="tr"><i style="width:${tc[k] / tmax * 100}%;--bc:${typeOf(k)[1]}"></i></span><b>${tc[k]}</b></div>`).join('');
  const mc = {}; members(id).forEach(m => mc[m] = 0); acts.forEach(a => (a.who || []).forEach(w => mc[w] = (mc[w] || 0) + 1));
  const mmax = Math.max(1, ...Object.values(mc));
  const mem = Object.keys(mc).sort((a, b) => mc[b] - mc[a]).map(k => `<div class="bar"><span class="row" style="gap:8px">${avatar(k, t.color)}<span class="ellip">${esc(k)}</span></span><span class="tr"><i style="width:${mc[k] / mmax * 100}%;--bc:${t.color}"></i></span><b>${mc[k]}</b></div>`).join('');
  const empty = weeks.filter((W_, i) => W_.study && plan[i] === 0);
  const emptyPast = empty.filter(W_ => W_.from <= TODAY), emptyNext = empty.filter(W_ => W_.from > TODAY);
  return `<div class="grid2" style="--tc:${t.color}">
    <div class="card burn"><div class="card-h"><h3>التقدم</h3><span class="sm muted">نُفّذ ${cd} من ${cp}</span></div>${burn}<div class="legend row xs faint" style="margin-top:8px;gap:16px"><span class="row" style="gap:6px"><i style="width:18px;border-top:2px dashed var(--ink4);display:block"></i>المخطط تراكميًا</span><span class="row" style="gap:6px"><i style="width:18px;border-top:2.5px solid ${t.color};display:block"></i>المنفَّذ</span></div></div>
    <div class="card"><div class="card-h"><h3>أنواع الأنشطة</h3><span class="sm muted">${nActs(acts.length)}</span></div>${types ? `<div class="bars">${types}</div>` : '<p class="muted sm">لا أنشطة بعد.</p>'}</div>
    <div class="card"><div class="card-h"><h3>توزيع المهام على الفريق</h3></div>${mem ? `<div class="bars">${mem}</div>` : '<p class="muted sm">لم يُسند شيء بعد.</p>'}</div>
    <div class="card"><div class="card-h"><h3>أسابيع بلا أنشطة</h3></div>
      ${!empty.length ? '<p class="muted sm">كل أسابيع الدراسة فيها أنشطة.</p>' : ''}
      ${emptyNext.length ? `<p class="sm muted" style="margin-bottom:8px">قادمة:</p><div class="wkchips">${emptyNext.map(W_ => `<button class="pill dash" type="button" data-act="tlweek" data-date="${W_.from}" data-id="${id}">الأسبوع ${W_.w} · ${gShort(W_.from)}</button>`).join('')}</div>` : ''}
      ${emptyPast.length ? `<p class="sm muted" style="margin:12px 0 8px">مضت:</p><div class="wkchips">${emptyPast.map(W_ => `<span class="pill">الأسبوع ${W_.w}</span>`).join('')}</div>` : ''}
    </div>
  </div>`;
}
VIEWS.team = { admin: true, render(r) { return T(r.a) ? teamHome(r.a, true) : ''; } };

/* ---------- صفحة المسار: الرأس، الفصول، جدول الفصل ---------- */
const AXC = [['تزكو', 'var(--ty-chal)'], ['سلوك', 'var(--ty-chal)'], ['شرع', 'var(--ty-meet)'], ['فكر', 'var(--ty-write)'], ['إصلاح', 'var(--ty-group)'], ['اصلاح', 'var(--ty-group)'], ['مهار', 'var(--ty-host)'], ['شخص', 'var(--ty-host)']];
const axCol = a => { const s = normAr(a); for (const [k, c] of AXC) if (s.includes(normAr(k))) return c; return 'var(--ink3)'; };
const isMob = () => matchMedia('(max-width:760px)').matches;
VIEWS.t = {
  render(r) {
    const id = r.a, t = T(id);
    if (!t) return `<div class="card empty"><h3>المسار غير موجود</h3></div>`;
    const n = semN(id), sem = semOf(id, n), body = sem && sem.days.length ? semBody(id, n, sem) : semEmpty(id, n);
    if (!dockOn(id)) return trackHead(id) + semTabs(id, n) + body;
    return trackHead(id) + semTabs(id, n) + `<div class="tlay"><div class="tmain">${body}</div><aside class="dock" id="dock" aria-label="لوحة النشاط">${F && F.dock && F.tid === id ? '' : dockIdle(id)}</aside></div>`;
  },
  after(r) { const w = $('.wrap'); if (w) w.classList.toggle('wide', dockOn(r.a)); if (F && F.dock) { if (F.tid === r.a && $('#dock')) drawAct(true); else F = null; }
    const el = $('#d-' + TODAY); if (el && !VIEWS.t.scrolled) { VIEWS.t.scrolled = true; setTimeout(() => el.scrollIntoView({ block: 'center' }), 60); } }
};
function trackHead(id) {
  const t = T(id), n = semN(id), acts = actsOf(id, n);
  let ctl;
  if (isAdmin()) ctl = `<div class="perm"><span class="row" style="gap:7px">${svg(t.canEdit ? 'unlock' : 'lock')}${t.canEdit ? 'الفريق يعدّل الخطة' : 'الفريق يعدّل المواعيد والمسؤولين فقط'}</span><button class="sw" type="button" role="switch" aria-checked="${!!t.canEdit}" data-act="toggleedit" data-id="${id}" aria-label="السماح للفريق بتعديل الخطة"></button></div>
    ${t.editReq ? `<span class="pill brand">${svg('unlock')}طلب الفريق فتح التعديل ${ago(t.editReq.at)}</span>` : ''}
    <div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-end"><a class="btn sm ghost" href="#team/${id}">${svg('eye')}كما يراها الفريق</a><button class="btn sm ghost" type="button" data-act="members" data-id="${id}">${svg('users')}الفريق</button></div>`;
  else ctl = t.canEdit ? `<span class="pill ok">${svg('unlock')}التعديل مفتوح لكم</span>` : `<span class="pill">${svg('lock')}إضافة الأنشطة مغلقة</span><span class="xs faint">وتعدّلون المواعيد والمسؤولين</span>${t.editReq ? `<span class="xs faint">أُرسل طلب الفتح ${ago(t.editReq.at)}</span>` : `<button class="btn sm" type="button" data-act="askedit">اطلب فتح الإضافة</button>`}`;
  return `<div class="thead" style="--tc:${t.color}"><div class="logo">${logoImg(id)}</div>
    <div class="t"><div class="eyebrow sm faint">${isAdmin() ? '<a class="lk" href="#tracks">المسارات</a> · ' : ''}${esc(t.cohort || '')}</div><h1>${esc(t.full || t.name)}</h1>
      <div class="meta">${t.age ? `<span class="pill">${esc(t.age)}</span>` : ''}<span class="pill">${svg('users')}${members(id).length ? members(id).length + ' في الفريق' : 'الفريق لم يُكتب'}</span><span class="pill">${nActs(acts.length)} في ${semLabel(n)}</span>${t.linked ? `<span class="pill brand">${svg('bot')}مجموعة مربوطة بالبوت</span>` : ''}</div></div>
    <div class="ctl">${ctl}</div></div>`;
}
function semTabs(id, n) {
  const t = T(id), cur = +curN(id);
  return `<div class="semtabs" role="tablist" aria-label="فصول المسار">${Array.from({ length: t.sems || 6 }, (_, i) => i + 1).map(k => `<a class="semtab ${semOf(id, k) ? '' : 'nodata'}" role="tab" href="#t/${id}/${k}" aria-current="${String(k) === String(n)}" ${semOf(id, k) ? '' : 'data-tip="لا جدول لهذا الفصل بعد"'}>${semLabel(k)}<small>${k < cur ? 'انتهى' : k === cur ? 'الحالي' : 'لم يبدأ'}</small></a>`).join('')}</div>`;
}
function semEmpty(id, n) {
  const t = T(id), ed = canEdit(id);
  return `<div class="card empty" style="margin-top:12px">${svg('table')}<h3>لا جدول ${semLabel(n)} بعد</h3><p>${+n < +curN(id) ? 'هذا فصل منتهٍ.' : 'الجدول أيام الفصل بمقرراتها، وعليه توضع الأنشطة.'}</p>
    ${ed ? `<div class="row" style="flex-wrap:wrap;justify-content:center"><button class="btn pri" type="button" data-act="semimport" data-id="${id}" data-n="${n}">${svg('sheet')}استيراد من جوجل شيت</button><button class="btn" type="button" data-act="semnew" data-id="${id}" data-n="${n}">أنشئ أيام الفصل</button></div>` : `<p class="hint">يضيفه المدير أو الفريق إذا فُتح له التعديل.</p>`}</div>`;
}
function semFacts(id, n, sem) {
  const t = T(id), r = { from: sem.days[0].d, to: sem.days[sem.days.length - 1].d }, weeks = weeksOf(sem.days);
  const exams = sem.days.filter(d => d.ev && /اختبار/.test(d.ev));
  const el = Math.max(0, Math.min(weeks.length, weeks.filter(W => W.from <= TODAY).length));
  const acts = actsOf(id, n), done = acts.filter(a => a.done).length;
  const fact = (ic, b, s, extra = '') => `<div class="fact"><span class="tile" style="--tc:${t.color}">${svg(ic)}</span><div class="kv" style="min-width:0;flex:1"><b>${b}</b><span>${s}</span>${extra}</div></div>`;
  return `<div class="facts" style="--tc:${t.color}">
    ${fact('cal', `${gShort(r.from)} – ${gShort(r.to)}`, `${nWeeks(weeks.length)}${TODAY >= r.from && TODAY <= r.to ? ` · نحن في الأسبوع ${nowWeek(id)}` : TODAY < r.from ? ' · ' + rel(r.from) : ''}`, `<div class="prog"><i style="width:${el / weeks.length * 100}%"></i></div>`)}
    ${exams.slice(0, 2).map(x => fact('flag', esc(x.ev.replace(/^الاختبار\s*/, 'الاختبار ')), `${gDay(x.d)} · ${rel(x.d)}`)).join('') || fact('flag', 'لا اختبارات', 'في الجدول')}
    ${exams.length < 2 ? fact('target', nStudy(sem.days.filter(d => d.c).length), [...new Set(sem.days.filter(d => d.p).map(d => d.p))].join('، ') || 'بلا إجازات') : ''}
    ${fact('check', `${done} من ${acts.length}`, 'أنشطة نُفّذت')}
  </div>`;
}
function semFactsMini(id, n, sem) {
  const weeks = weeksOf(sem.days), exam = sem.days.find(d => d.ev && /اختبار/.test(d.ev) && d.d >= TODAY), r0 = sem.days[0].d;
  const acts = actsOf(id, n), done = acts.filter(a => a.done).length;
  const parts = [TODAY < r0 ? 'يبدأ ' + rel(r0) : TODAY > sem.days[sem.days.length - 1].d ? 'انتهى الفصل' : `الأسبوع ${nowWeek(id)} من ${weeks.length}`, exam ? `${esc(exam.ev)} ${rel(exam.d)}` : '', `${done} من ${acts.length} نُفّذ`].filter(Boolean);
  return `<div class="mfacts" style="--tc:${T(id).color}">${parts.map(x => `<span>${x}</span>`).join('')}</div>`;
}
let TB = { q: '' };
function semBody(id, n, sem) {
  const t = T(id), ed = canEdit(id), axes = [...new Set(sem.days.map(d => d.ax).filter(Boolean))];
  const tools = `<div class="toolbar">
    <label class="search">${svg('search')}<input type="search" placeholder="ابحث في المقررات والأنشطة" value="${esc(TB.q)}" data-act="tblq" aria-label="بحث في الجدول"></label>
    <div class="row" style="gap:6px;flex-wrap:wrap"><button class="chip" type="button" aria-pressed="${!P.tbl.ax}" data-act="tblax" data-v="">كل المحاور</button>${axes.map(a => `<button class="chip" type="button" aria-pressed="${P.tbl.ax === a}" data-act="tblax" data-v="${esc(a)}"><i style="background:${axCol(a)};border-radius:50%"></i>${esc(a)}</button>`).join('')}</div>
    <span class="sp"></span>
    <button class="chip" type="button" aria-pressed="${!!P.tbl.hideEmpty}" data-act="tblempty">الأيام التي فيها أنشطة</button>
    ${ed ? `<button class="btn pri sm" type="button" data-act="newact" data-track="${id}">${svg('plus')}نشاط</button>` : ''}
    ${ed ? `<button class="btn icon" type="button" data-act="semmenu" data-id="${id}" data-n="${n}" aria-label="خيارات الجدول" data-tip="خيارات الجدول">${svg('dots')}</button>` : ''}
  </div>`;
  return (isMob() ? semFactsMini(id, n, sem) : semFacts(id, n, sem)) + tools + (isMob() ? semCards(id, n, sem) : semTable(id, n, sem));
}
function dayVisible(d, acts) {
  const q = normAr(TB.q.trim());
  if (P.tbl.ax && d.ax !== P.tbl.ax) return false;
  if (P.tbl.hideEmpty && !acts.length) return false;
  if (q) { const hay = normAr([d.ax, d.c, d.q, d.r, d.ev, d.p, ...acts.map(a => a.title + ' ' + (a.who || []).join(' '))].join(' ')); if (!hay.includes(q)) return false; }
  return true;
}
const edCell = (id, n, d, k, cls = '') => canEdit(id) ? `<button class="ed ${d[k] ? '' : 'empty'} ${cls}" type="button" data-act="ed" data-id="${id}" data-n="${n}" data-d="${d.d}" data-k="${k}">${esc(d[k] || '')}</button>` : esc(d[k] || '');
const evBadge = d => d.ev ? (/اختبار/.test(d.ev) ? `<span class="exam">${svg('flag')}${esc(d.ev)}</span>` : `<span class="pill brand">${esc(d.ev)}</span>`) : '';
const liveBadge = d => isLive(d) ? `<span class="live" data-tip="${esc(d.r || 'بث مباشر')}">${svg('live')}بث مباشر</span>` : '';
// خلية المقرر المختصرة: المحور، ثم المقرر والمقدار والمطلوب
function curCell(id, n, d, ed) {
  const ev = evBadge(d);
  if (d.p && !d.c) return `${ev}<span class="per">${esc(d.p)}</span>`;
  if (!d.c && !ed) return ev || '<span class="faint sm">لا مقرر</span>';
  const ax = d.ax ? `<span class="axp" style="--ac:${axCol(d.ax)}"><i></i>${esc(d.ax)}</span>` : '';
  return `${ev}${ed ? `<button class="ed axb" type="button" data-act="ed" data-id="${id}" data-n="${n}" data-d="${d.d}" data-k="ax">${ax || '<span class="faint xs">+ المحور</span>'}</button>` : ax}
    <div class="c1">${edCell(id, n, d, 'c')}</div>${d.q || ed ? `<div class="c2">${edCell(id, n, d, 'q')}</div>` : ''}${d.r || ed || isLive(d) ? `<div class="c3">${liveBadge(d)}${edCell(id, n, d, 'r')}</div>` : ''}`;
}
const clashNote = (id, d) => { const L = dayMeets(id, d); return L.length >= 2 ? `<div class="clashn" role="note">${svg('alert')}<span>${esc(clashText(L))}</span></div>` : ''; };
const sugCard = (id, s, ed) => `<div class="sug">${tile('كاهوت', 'sm')}<span><b>اقتراح:</b> كاهوت مراجعة قبل ${esc(s.exam)} (${gDay(s.ed)})</span>${ed ? `<button class="btn sm" type="button" data-act="newact" data-track="${id}" data-date="${s.d}" data-type="كاهوت" data-title="${esc(s.title)}">أضفه</button>` : ''}</div>`;
function semTable(id, n, sem) {
  const acts = actsOf(id, n), ed = canEdit(id), sugs = String(n) === String(curN(id)) ? kahootSugs(id) : [];
  let rows = '', shown = 0;
  for (const W of weeksOf(sem.days)) {
    let wr = '', wc = 0;
    for (const d of W.days) {
      const da = acts.filter(a => a.d === d.d).sort(sortA);
      if (!dayVisible(d, da)) continue;
      wc += da.length; shown++;
      const sg = sugs.filter(s => s.d === d.d);
      wr += `<tr class="d ${d.d === TODAY ? 'today' : ''} ${d.d < TODAY ? 'past' : ''} ${d.c ? '' : 'off'} ${da.length ? 'has' : ''}" id="d-${d.d}" data-drop="1" data-date="${d.d}" data-track="${id}">
        <td class="dy"><div class="dyw"><b>${DAYS[wd(d.d)]}</b>${d.d === TODAY ? '<span class="today-tag">اليوم</span>' : ''}</div><span class="g num">${gShort(d.d)}</span><span class="h">${esc(d.h || hijri(d.d))}</span>${ed ? `<button class="btn icon dye" type="button" data-act="dayedit" data-id="${id}" data-n="${n}" data-d="${d.d}" aria-label="تعديل اليوم" data-tip="تعديل اليوم">${svg('edit', 1.6)}</button>` : ''}</td>
        <td class="acts"><div class="acts-in">${clashNote(id, d.d)}${da.map(a => evChip(a, id, { big: true })).join('')}${sg.map(s => sugCard(id, s, ed)).join('')}${ed ? `<button class="plus" type="button" data-act="newact" data-date="${d.d}" data-track="${id}">+ نشاط</button>` : ''}</div></td>
        <td class="cur">${curCell(id, n, d, ed)}</td></tr>`;
    }
    if (!wr) continue;
    rows += `<tr class="wkh"><td colspan="3"><div class="wt"><b>الأسبوع ${W.w}</b><span class="xs faint">${gShort(W.from)} – ${gShort(W.to)}</span>${!W.study && W.per ? `<span class="per">${esc(W.per.p)}</span>` : ''}${W.from <= TODAY && TODAY <= W.to ? '<span class="pill brand">هذا الأسبوع</span>' : ''}<span class="sp"></span><span class="xs faint">${wc ? nActs(wc) : ''}</span></div></td></tr>` + wr;
  }
  const out = outsideActs(id, n, sem);
  if (out.length && !TB.q && !P.tbl.ax) rows += `<tr class="wkh"><td colspan="3"><div class="wt"><b>خارج أيام الجدول</b><span class="xs faint">أنشطة تاريخها ليس في أيام هذا الفصل</span></div></td></tr><tr class="d"><td class="dy"><b>—</b></td><td class="acts"><div class="acts-in">${out.map(a => evChip(a, id, { big: true, date: true })).join('')}</div></td><td class="cur"><span class="faint sm">انقلها إلى يوم من أيام الفصل، أو صحّح تاريخها.</span></td></tr>`;
  if (!shown) return `<div class="card empty">${svg('search')}<p>لا أيام تطابق البحث.</p><button class="btn" type="button" data-act="tblclear">امسح البحث</button></div>`;
  return `<div class="stbl"><table><thead><tr><th>اليوم</th><th>الأنشطة</th><th>المقرر</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
const outsideActs = (id, n, sem) => actsOf(id, n).filter(a => !sem.days.some(d => d.d === a.d)).sort(sortA);
function semCards(id, n, sem) {
  const acts = actsOf(id, n), ed = canEdit(id), sugs = String(n) === String(curN(id)) ? kahootSugs(id) : [];
  let h = '', shown = 0;
  const paged = !TB.q.trim() && !P.tbl.hideEmpty && !P.tbl.ax, mw = paged ? mobWeek(id, sem) : null;
  if (mw) { const W = mw.W[mw.i]; h += `<div class="wpager"><button class="btn icon" type="button" data-act="mweek" data-id="${id}" data-n="${sem.n}" data-v="${mw.i - 1}" ${mw.i ? '' : 'disabled'} aria-label="الأسبوع السابق">${svg('back')}</button><div class="col"><b>الأسبوع ${W.w}</b><span class="xs faint">${gShort(W.from)} – ${gShort(W.to)}</span></div>${W.from <= TODAY && TODAY <= W.to ? '<span class="pill brand">هذا الأسبوع</span>' : `<button class="btn sm ghost" type="button" data-act="mweek" data-id="${id}" data-n="${sem.n}" data-v="now">الحالي</button>`}<button class="btn icon" type="button" data-act="mweek" data-id="${id}" data-n="${sem.n}" data-v="${mw.i + 1}" ${mw.i < mw.W.length - 1 ? '' : 'disabled'} aria-label="الأسبوع التالي">${svg('fwd')}</button></div>`; }
  for (const W of (mw ? [mw.W[mw.i]] : weeksOf(sem.days))) {
    let wr = '';
    for (const d of W.days) {
      const da = acts.filter(a => a.d === d.d).sort(sortA);
      if (!dayVisible(d, da)) continue; shown++;
      const sg = sugs.filter(s => s.d === d.d);
      wr += `<div class="mday ${d.d === TODAY ? 'today' : ''} ${da.length ? 'has' : ''}" id="d-${d.d}" data-drop="1" data-date="${d.d}" data-track="${id}">
        <div class="top"><b>${gDay(d.d)}</b><span class="xs faint">${esc(d.h || hijri(d.d))}</span>${d.d === TODAY ? '<span class="today-tag">اليوم</span>' : ''}<span class="sp"></span>${ed ? `<button class="btn icon" type="button" style="padding:4px" data-act="dayedit" data-id="${id}" data-n="${n}" data-d="${d.d}" aria-label="تعديل اليوم">${svg('edit', 1.6)}</button>` : ''}</div>
        ${clashNote(id, d.d)}${da.map(a => evChip(a, id, { big: true })).join('')}${sg.map(s => sugCard(id, s, ed)).join('')}
        ${d.ev ? `<div>${evBadge(d)}</div>` : ''}
        ${d.c ? `<div class="cur">${d.ax ? `<span class="axp" style="--ac:${axCol(d.ax)}"><i></i>${esc(d.ax)}</span> ` : ''}<span>${esc(d.c)}${d.q ? ' — ' + esc(d.q) : ''}</span>${d.r ? `<div class="xs faint">${liveBadge(d)}${esc(d.r)}</div>` : ''}</div>` : d.p ? `<span class="per">${esc(d.p)}</span>` : ''}
        ${ed ? `<button class="plus" type="button" data-act="newact" data-date="${d.d}" data-track="${id}">+ نشاط</button>` : ''}</div>`;
    }
    if (wr) h += (mw ? '' : `<div class="mwk">الأسبوع ${W.w}<span class="xs faint">${gShort(W.from)} – ${gShort(W.to)}</span></div>`) + wr;
  }
  const out = outsideActs(id, n, sem);
  if (out.length && !TB.q && !P.tbl.ax && (!mw || mw.i === mw.W.length - 1)) h += `<div class="mwk">خارج أيام الجدول</div><div class="mday">${out.map(a => evChip(a, id, { big: true, date: true })).join('')}</div>`;
  return shown ? `<div class="mdays">${h}</div>` : `<div class="card empty"><p>لا أيام تطابق البحث.</p></div>`;
}
/* ---------- لوحة النشاط الثابتة (يسار الجدول) ---------- */
function dockIdle(id) {
  const t = T(id), ed = canEdit(id), up = actsOf(id).filter(a => a.d >= TODAY).sort(sortA);
  const seen = {}, cls = up.filter(a => { const c = clashOf(id, a); if (!c || seen[a.d]) return false; seen[a.d] = 1; return true; });
  const notes = cls.map(a => `<button class="dk-note warn" type="button" data-act="openact" data-id="${a.id}" data-track="${id}">${svg('alert')}<span><b>${gDay(a.d)}:</b> ${esc(clashOf(id, a))}</span></button>`).join('') +
    kahootSugs(id).filter(s => s.left <= 30).map(s => `<div class="dk-note sug">${tile('كاهوت', 'sm')}<span>${esc(s.exam)} ${rel(s.ed)}. <b>اقتراح:</b> كاهوت مراجعة ${gDay(s.d)}.</span>${ed ? `<button class="btn sm" type="button" data-act="newact" data-track="${id}" data-date="${s.d}" data-type="كاهوت" data-title="${esc(s.title)}">أضفه</button>` : ''}</div>`).join('');
  return `<div class="dk-h"><div class="col"><span class="xs faint">لوحة النشاط</span><b>أنشطة ${esc(t.name)}</b></div>${ed ? `<button class="btn pri sm" type="button" data-act="newact" data-track="${id}">${svg('plus')}نشاط</button>` : ''}</div>
  <div class="dk-b">${notes ? `<div class="dk-sec"><h4>تنبيهات واقتراحات</h4>${notes}</div>` : ''}
    <div class="dk-sec"><h4>القادمة</h4>${up.length ? `<div class="col" style="gap:6px">${up.slice(0, 10).map(a => evChip(a, id, { date: true })).join('')}</div>${up.length > 10 ? `<p class="xs faint" style="margin-top:6px">و${nActs(up.length - 10)} بعدها في الجدول</p>` : ''}` : `<p class="muted sm">لا أنشطة قادمة في الخطة.</p>`}</div>
    <p class="hint">${svg('edit', 1.6)} اضغط أي نشاط في الجدول ليُفتح هنا، أو اسحبه إلى يوم آخر.</p></div>`;
}

/* ---------- المنظور الزمني ---------- */
function tlTracks() {
  if (!isAdmin()) return [myTrack()];
  const sel = (P.tl.tracks || []).filter(id => T(id));
  return sel.length ? sel : D.tracks.map(t => t.id);
}
function tlAnchor() { if (P.tl.anchor) return P.tl.anchor; const s0 = semStartMin(); return s0 && TODAY < s0 && diffD(s0, TODAY) <= 10 ? s0 : TODAY; }
function tlSpan() {
  const a = tlAnchor(), rg = P.tl.range;
  if (rg === 'week') { const s = wkStart(a); return { from: s, to: add(s, 6), title: `${gShort(s)} – ${gShort(add(s, 6))} ${add(s, 6).slice(0, 4)}` }; }
  const a2 = !P.tl.anchor && dnum(a) >= 25 ? add(a, 8) : a;
  if (rg === 'month') { const m = monStart(a2), e = add(addMon(m, 1), -1); return { from: m, to: e, title: `${mon(m)} ${m.slice(0, 4)}` }; }
  if (rg === 'q3') { const m = monStart(a2), e = add(addMon(m, 3), -1); return { from: m, to: e, title: `${mon(m)} – ${mon(e)} ${e.slice(0, 4)}` }; }
  const rs = tlTracks().map(id => semRange(id, curN(id))).filter(Boolean);
  if (!rs.length) { const m = monStart(a); return { from: m, to: add(addMon(m, 3), -1), title: 'الفصل' }; }
  return { from: rs.map(r => r.from).sort()[0], to: rs.map(r => r.to).sort().pop(), title: semLabel(curN(tlTracks()[0])) + ' كاملًا' };
}
VIEWS.timeline = {
  render() {
    const rg = P.tl.range, sp = tlSpan(), ids = tlTracks();
    const rgBtn = (k, l) => `<button type="button" aria-pressed="${rg === k}" data-act="tlrange" data-v="${k}">${l}</button>`;
    const bar = `<div class="tlbar"><div class="seg" role="group" aria-label="المدى">${rgBtn('week', 'أسبوع')}${rgBtn('month', 'شهر')}${rgBtn('q3', '٣ أشهر')}${rgBtn('sem', 'الفصل')}</div>
      ${rg !== 'sem' ? `<div class="row" style="gap:2px"><button class="btn icon" type="button" data-act="tlnav" data-n="-1" aria-label="السابق">${svg('back')}</button><button class="btn sm ghost" type="button" data-act="tlnav" data-n="0">اليوم</button><button class="btn icon" type="button" data-act="tlnav" data-n="1" aria-label="التالي">${svg('fwd')}</button></div>` : ''}
      <span class="title">${esc(sp.title)}</span><span class="sp"></span>
      ${canEdit(ids[0]) || isAdmin() ? `<span class="hint">اسحب النشاط لتغيير يومه</span>` : ''}</div>`;
    const sel = isAdmin() ? `<div class="tracksel"><button class="chip" type="button" aria-pressed="${!(P.tl.tracks || []).length}" data-act="tltrack" data-v="">كل المسارات</button>${D.tracks.map(t => `<button class="chip" type="button" aria-pressed="${(P.tl.tracks || []).includes(t.id)}" data-act="tltrack" data-v="${t.id}"><i style="background:${t.color}"></i>${esc(t.name)}</button>`).join('')}</div>` : '';
    let body;
    if (rg === 'week') body = isMob() ? agenda(sp.from, ids) : ids.length === 1 ? weekBoard(sp.from, ids) : weekLanes(sp.from, ids);
    else if (rg === 'month') body = monthGrid(sp.from, ids);
    else body = lanes(sp.from, sp.to, ids);
    return pageHead('', 'المنظور الزمني', '') + bar + sel + body;
  },
  after() { const l = $('.lanes'); const tl = $('.lanes .today-line'); if (l && tl && !VIEWS.timeline.sc) { VIEWS.timeline.sc = 1; l.scrollLeft = 0; const r = tl.getBoundingClientRect(), lr = l.getBoundingClientRect(); l.scrollLeft += (r.left - lr.left) - lr.width / 2; } }
};
function weekLanes(ws, ids) {
  const days = Array.from({ length: 7 }, (_, i) => add(ws, i));
  let h = `<div class="lh"></div>` + days.map(d => `<div class="lh ${d === TODAY ? 'today' : ''}"><b>${DAYS[wd(d)]}</b><span>${gShort(d)}</span></div>`).join('');
  for (const id of ids) {
    const t = T(id);
    h += `<div class="ln"><a href="#t/${id}" class="row" style="gap:8px;text-decoration:none">${logoImg(id)}<b>${esc(t.name)}</b></a></div>`;
    h += days.map(d => { const x = dayOf(id, curN(id), d), da = actsOf(id).filter(a => a.d === d).sort(sortA); return `<div class="c ${d === TODAY ? 'today' : ''} ${x && !x.c ? 'off' : ''}" data-drop="1" data-date="${d}" data-track="${id}">${da.map(a => evChip(a, id, { tint: true })).join('')}${canEdit(id) ? `<button class="add" type="button" data-act="newact" data-date="${d}" data-track="${id}">+</button>` : ''}</div>`; }).join('');
  }
  return `<div class="lanesw"><div class="lw">${h}</div></div>`;
}
function monthGrid(m, ids) {
  const first = m, last = add(addMon(m, 1), -1), s = wkStart(first), e = add(wkStart(last), 6);
  const n = diffD(e, s) + 1;
  let h = DAYS.map(x => `<div class="wd">${x}</div>`).join('');
  for (let i = 0; i < n; i++) {
    const d = add(s, i), out = d < first || d > last;
    const da = ids.flatMap(id => actsOf(id).filter(a => a.d === d).map(a => [a, id])).sort((x, y) => sortA(x[0], y[0]));
    const one = ids.length === 1 ? dayOf(ids[0], curN(ids[0]), d) : null;
    const max = 4;
    h += `<div class="md ${out ? 'out' : ''} ${d === TODAY ? 'today' : ''} ${one && !one.c ? 'off' : ''}" data-drop="1" data-date="${d}" ${ids.length === 1 ? `data-track="${ids[0]}"` : ''}>
      <div class="dn"><b>${dnum(d)}</b><span class="hj">${esc(hShort(d))}</span></div>
      ${one && (one.ev || (one.p && !one.c)) ? `<div class="tag ellip">${esc(one.ev || one.p)}</div>` : ''}
      <div class="acts col" style="gap:3px">${da.slice(0, max).map(([a, id]) => `<div class="mini ${a.done ? 'done' : ''}" role="button" tabindex="0" data-act="openact" data-id="${a.id}" data-track="${id}" ${canAdjust(id) ? 'data-drag="1"' : ''} style="--tcol:${tcol(id)}" data-tip="${esc(T(id).name + ': ' + a.title + (a.time ? ' · ' + timeText(a.time) : ''))}"><i></i><span>${esc(a.title)}</span></div>`).join('')}
      ${da.length > max ? `<button class="more" type="button" data-act="dayview" data-date="${d}">+${da.length - max} أخرى</button>` : ''}</div></div>`;
  }
  return `<div class="mgrid">${h}</div>`;
}
function lanes(from, to, ids) {
  const s = from, n = diffD(to, from) + 1;
  const avail = Math.min(1180, innerWidth - (innerWidth > 1000 ? 256 : 0) - 70) - 150;
  const dw = Math.max(isMob() ? 14 : 11, Math.floor(avail / n));
  const days = Array.from({ length: n }, (_, i) => add(s, i));
  const ti = diffD(TODAY, s);
  let head = `<div class="lrow lhead"><div class="lab">المسار</div><div class="ltrack" style="--days:${n};--dw:${dw}px">${days.map((d, i) => `<div class="dc ${wd(d) === 0 ? 'ws' : ''} ${d === TODAY ? 'today' : ''}">${wd(d) === 0 && dw * 7 > 40 ? dnum(d) : ''}</div>`).join('')}${days.map((d, i) => dnum(d) === 1 || (i === 0 && diffD(addMon(monStart(d), 1), d) >= 6) ? `<span class="mon" style="inset-inline-start:${i * dw}px">${mon(d)}</span>` : '').join('')}</div></div>`;
  let rows = '';
  for (const id of ids) {
    const t = T(id), acts = actsOf(id).filter(a => a.d >= from && a.d <= to).sort(sortA), slot = {};
    const pins = acts.map(a => { const i = diffD(a.d, s), k = slot[i] = (slot[i] || 0) + 1; return `<div class="pin ${a.done ? 'done' : ''} ${remindable(a) ? 'meet' : ''}" role="button" tabindex="0" data-act="openact" data-id="${a.id}" data-track="${id}" ${canAdjust(id) ? 'data-drag="1"' : ''} style="--tcol:${t.color};inset-inline-start:${i * dw + 1}px;top:${6 + (k - 1) * 25}px;width:${Math.max(dw - 2, 8)}px" data-tip="${esc(gDay(a.d) + ' — ' + a.type + ': ' + a.title + (a.who && a.who.length ? ' (' + a.who.join('، ') + ')' : ''))}">${dw >= 70 ? esc(a.title) : ''}</div>`; }).join('');
    const rowsN = Math.max(1, ...Object.values(slot));
    const ds = daysOf(id);
    const dayCls = d => { const x = ds.find(y => y.d === d); return (wd(d) === 0 ? ' ws' : '') + (d === TODAY ? ' today' : '') + (x && !x.c ? ' off' : '') + (!x ? ' out' : ''); };
    rows += `<div class="lrow"><a class="lab" href="#t/${id}" style="text-decoration:none">${logoImg(id)}<span><b>${esc(t.name)}</b><small>${nActs(acts.length)}</small></span></a>
      <div class="ltrack" data-lane="${id}" data-start="${s}" data-dw="${dw}" data-n="${n}" style="--days:${n};--dw:${dw}px;min-height:${12 + rowsN * 25}px">${days.map(d => `<div class="dc${dayCls(d)}"></div>`).join('')}${pins}</div></div>`;
  }
  const tl = ti >= 0 && ti < n ? `<div class="today-line" style="inset-inline-start:${150 + ti * dw + dw / 2}px"></div>` : '';
  return `<div class="lanes"><div class="lanes-in" style="--days:${n};--dw:${dw}px">${head}${rows}${tl}</div></div>`;
}
