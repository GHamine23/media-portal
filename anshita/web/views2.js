/* ============================================================
   النوافذ (النشاط، اليوم، الفصل، الفريق)، صفحات الربط (التقويم، البوت، الحسابات)،
   لوحة الأوامر، الأحداث، والتشغيل
   ============================================================ */

/* ---------- نافذة النشاط (لوحة جانبية، أو لوحة ثابتة يسار الجدول في الشاشات العريضة) ---------- */
let F = null;   // نموذج النشاط المفتوح
function openAct(tid, id, preset = {}) {
  const a = id ? planOf(tid).acts.find(x => x.id === id) : null;
  if (id && !a) return toast('النشاط غير موجود (ربما حُذف)', 'err');
  const ids = isAdmin() ? D.tracks.map(t => t.id) : [myTrack()];
  tid = tid || preset.track || (ids.length === 1 ? ids[0] : '');
  if (!a && tid && !canEdit(tid)) return toast('إضافة الأنشطة مغلقة لفريقكم. اطلبوا فتحها من الإدارة.', 'err');
  F = a ? Object.assign({ tid, isNew: false }, JSON.parse(JSON.stringify(a)), { calOn: !!(a.cal && a.cal.id) })
    : { tid, isNew: true, title: preset.title || '', type: preset.type || 'لقاء', d: preset.date || (tid ? defDate(tid) : TODAY), time: '', dur: 0, who: [], idea: '', rem: null, calOn: false, done: false, note: '', link: '' };
  F.newNames = []; F.lockTrack = !!tid;
  F.dock = dockOn(F.tid) && !!$('#dock');
  drawAct();
  if (F.dock) { const b = $('#dock .dk-b'); if (b) b.scrollTop = 0; }
}
function defDate(tid) { const r = semRange(tid, curN(tid)); return r && TODAY < r.from ? r.from : TODAY; }
// صلاحية النموذج: full تعديل كامل، adj تعديل نشاط قائم بلا حذف (يصل الإدارةَ تنبيه)، ro متابعة فقط
function fMode() {
  const tid = F.tid;
  if (!tid || canEdit(tid)) return 'full';
  if (!F.isNew && canAdjust(tid)) return 'adj';
  return 'ro';
}
function actParts() {
  const tid = F.tid, t = tid ? T(tid) : null, mode = fMode(), ro = mode === 'ro';
  const day = tid ? (dayOf(tid, semFor(tid, F.d) || curN(tid), F.d)) : null;
  const tracksSel = F.isNew && isAdmin() && !F.dock && !F.lockTrack ? `<div class="field"><label>المسار</label><div class="row" style="gap:6px;flex-wrap:wrap">${D.tracks.map(x => `<button class="chip" type="button" aria-pressed="${tid === x.id}" data-act="f-track" data-v="${x.id}"><i style="background:${x.color}"></i>${esc(x.name)}</button>`).join('')}</div></div>` : '';
  const head = `<div class="row" style="gap:10px">${t && !F.dock ? logoImg(tid) : ''}<div class="col" style="min-width:0"><span class="xs faint">${t ? esc(t.full || t.name) : 'نشاط جديد'}</span><b style="font-family:var(--fd);font-weight:500;font-size:19px;color:var(--ink)">${F.isNew ? 'نشاط جديد' : ro ? esc(F.title) : 'تعديل النشاط'}</b></div></div>`;
  const ctx = day ? `<div class="ctx"><span>${gLong(F.d)} · ${esc(day.h || hijri(F.d))} · الأسبوع ${day.w}</span>${day.c ? `<span>مقرر اليوم: <b>${esc(day.c)}</b>${day.q ? ' — ' + esc(day.q) : ''}</span>` : ''}${isLive(day) ? `<span class="live">${svg('live')}${esc(day.r || 'بث مباشر')}</span>` : ''}${day.ev ? `<span><b>${esc(day.ev)}</b></span>` : ''}${day.p && !day.c ? `<span>${esc(day.p)}</span>` : ''}</div>` : F.d ? `<div class="ctx"><span>${gLong(F.d)} · ${esc(hijri(F.d))}</span><span class="faint">خارج أيام الفصل في الجدول</span></div>` : '';
  // تنبيه اجتماع لقاءين في يوم واحد (بث مباشر أو لقاء آخر)
  let clash = '';
  if (tid && MEET_T.includes(F.type) && F.d) {
    const others = dayMeets(tid, F.d, F.id);
    if (others.length) {
      const alt = ro ? [] : freeDays(tid, F.d, F.id);
      clash = `<div class="callout warn" role="status">${svg('alert')}<div><b>${esc(clashText(others.concat(qt(F.title.trim() || 'هذا النشاط'))))}</b><span>${others[0] === 'البث المباشر' ? 'في هذا اليوم بث مباشر للبرنامج، فيجتمع على الطلاب لقاءان.' : 'في هذا اليوم لقاء آخر في الخطة.'}${alt.length ? ' أيام قريبة بلا لقاء:' : ''}</span>${alt.length ? `<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">${alt.map(x => `<button class="chip" type="button" data-act="f-day" data-v="${x}">${gDay(x)}</button>`).join('')}</div>` : ''}</div></div>`;
    }
  }
  const willRem = F.rem === true || (F.rem !== false && (D.remindTypes || []).includes(F.type));
  const remSub = !willRem ? 'لا تذكير لهذا النشاط' : !t || !t.linked ? 'سيُذكَّر به حين تُربط مجموعة المسار بالبوت' : diffD(F.d, TODAY) < 0 ? 'مضى موعده' : `تصميم الإعلان ${gDay(add(F.d, -3) < TODAY ? TODAY : add(F.d, -3))}، ونشره ${gDay(add(F.d, -1) < TODAY ? TODAY : add(F.d, -1))}`;
  const follow = !F.isNew ? `<div class="sep" style="margin:4px 0"></div><b style="font-family:var(--fd);font-weight:500;font-size:17px;color:var(--ink)">المتابعة</b>
    <div class="opt" style="border-top:0;padding-top:0"><button class="ck round ok" type="button" role="checkbox" aria-checked="${!!F.done}" data-act="f-done" aria-label="تم التنفيذ">${svg('check', 2.4)}</button><div class="tx"><b>تم التنفيذ</b><span>يُعلَّم بعد إقامة النشاط</span></div></div>
    <div class="field"><label for="f-note">ملاحظة بعد التنفيذ</label><textarea class="inp" id="f-note" rows="2" placeholder="كم حضر؟ ما الذي نجح وما الذي يُحسَّن؟">${esc(F.note || '')}</textarea></div>
    <div class="field"><label for="f-link">رابط (الإعلان، التصميم، ورقة الفعالية)</label><div class="row" style="gap:6px"><input class="inp ltr" style="text-align:left;display:block;flex:1" id="f-link" type="url" inputmode="url" value="${esc(F.link || '')}" placeholder="https://">${/^https?:\/\//i.test(F.link || '') ? `<a class="btn icon" href="${esc(F.link)}" target="_blank" rel="noopener" aria-label="افتح الرابط" data-tip="افتح الرابط">${svg('ext')}</a>` : ''}</div></div>` : '';
  let body;
  if (ro) {
    body = `${ctx}${clash}<div class="row" style="gap:8px">${tile(F.type)}<b>${esc(F.type)}</b>${F.time ? `<span class="pill">${svg('clock')}${timeText(F.time)}</span>` : ''}</div>
      ${F.who && F.who.length ? `<div class="field"><span class="flabel">المسؤول</span><div class="whos">${F.who.map(w => `<span class="chip">${esc(w)}</span>`).join('')}</div></div>` : ''}
      ${F.idea ? `<div class="field"><span class="flabel">الفكرة</span><div class="ro-v">${esc(F.idea)}</div></div>` : ''}
      <div class="opt"><span class="tile sm" style="--tc:var(--brand)">${svg('bell')}</span><div class="tx"><b>تذكير البوت</b><span>${esc(remSub)}</span></div></div>
      <p class="hint">${svg('lock')} تستطيعون تسجيل المتابعة.</p><!--MEET-->${follow}`;
  } else {
    body = `${tracksSel}${mode === 'adj' ? `<p class="hint">${svg('bell')} إضافة الأنشطة وحذفها مغلقان، وتستطيعون تعديل هذا النشاط. يصل الإدارةَ تنبيه بكل تغيير.</p>` : ''}
    <input class="inp big" id="f-title" value="${esc(F.title)}" placeholder="اسم النشاط" aria-label="اسم النشاط" ${F.isNew ? 'autofocus' : ''}>
    <div class="types" role="group" aria-label="نوع النشاط">${TYPE_NAMES.map(k => `<button type="button" aria-pressed="${F.type === k}" data-act="f-type" data-v="${esc(k)}" style="--tc:${typeOf(k)[1]}">${svg(typeOf(k)[0])}${esc(k)}</button>`).join('')}</div>
    <div class="grid2" style="gap:10px"><div class="field"><label for="f-d">اليوم</label><input class="inp" id="f-d" type="date" value="${F.d}"></div>
      <div class="row" style="gap:8px;align-items:flex-end"><div class="field" style="flex:1"><label for="f-time">الوقت</label><select class="inp" id="f-time">${(TIMES.includes(F.time || '') ? TIMES : TIMES.concat(F.time).sort()).map(x => `<option value="${x}" ${x === (F.time || '') ? 'selected' : ''}>${x ? timeText(x) : 'بلا وقت'}</option>`).join('')}</select></div>
      <div class="field" style="width:96px"><label for="f-dur">المدة</label><select class="inp" id="f-dur">${[[0, 'تلقائي'], [30, '٣٠ د'], [45, '٤٥ د'], [60, 'ساعة'], [90, 'ساعة ونصف'], [120, 'ساعتان']].map(([v, l]) => `<option value="${v}" ${+F.dur === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div></div>
    ${ctx}${clash}
    <div class="field"><span class="flabel">المسؤول من الفريق</span><div class="whos">${[...new Set(members(tid).concat(F.who || []))].map(w => `<button class="chip" type="button" aria-pressed="${(F.who || []).includes(w)}" data-act="f-who" data-v="${esc(w)}">${esc(w)}</button>`).join('')}<input id="f-whonew" placeholder="+ اسم جديد" aria-label="إضافة اسم"></div></div>
    <div class="field"><label for="f-idea">الفكرة</label><textarea class="inp" id="f-idea" rows="3" placeholder="الفكرة في سطرين: ماذا سيحدث؟ ولمن؟">${esc(F.idea || '')}</textarea></div>
    <div class="opt"><span class="tile sm" style="--tc:var(--brand)">${svg('bell')}</span><div class="tx"><b>تذكير البوت في مجموعة الفريق</b><span>${esc(remSub)}</span></div><button class="sw" type="button" role="switch" aria-checked="${willRem}" data-act="f-rem" aria-label="تذكير البوت"></button></div>
    ${isAdmin() ? `<div class="opt"><span class="tile sm" style="--tc:var(--plum)">${svg('gcal')}</span><div class="tx"><b>في تقويم جوجل</b><span>${F.calOn ? (F.cal && F.cal.id ? (F.cal.err ? 'تعذّر آخر تحديث: ' + esc(F.cal.err) : 'في التقويم، ويتحدّث مع كل تعديل') : 'سيُرسل عند الحفظ') : 'لا يظهر في التقويم'}</span></div><button class="sw" type="button" role="switch" aria-checked="${!!F.calOn}" data-act="f-cal" aria-label="في تقويم جوجل"></button></div>` : ''}
    <!--MEET-->${follow}`;
  }
  const cancel = F.dock ? 'f-cancel' : 'close';
  body = body.replace('<!--MEET-->', !F.isNew && tid ? meetBlock() : '');
  const foot = ro ? `<button class="btn pri" type="button" data-act="f-save">حفظ المتابعة</button><button class="btn" type="button" data-act="${cancel}">إغلاق</button>`
    : `<button class="btn pri" type="button" data-act="f-save" ${!tid ? 'disabled' : ''}>${F.isNew ? 'أضف النشاط' : 'احفظ'}</button><button class="btn" type="button" data-act="${cancel}">إلغاء</button><span class="sp"></span>${!F.isNew && mode === 'full' ? `<button class="btn danger" type="button" data-act="f-del">${F.confirmDel ? 'تأكيد الحذف' : 'حذف'}</button>` : ''}`;
  return { head, body, foot };
}
// رابط ميت للنشاط: يُنشأ من حساب الأنشطة، والمسؤولون عنه (ببريدهم في «الفريق») وبريد الإدارة مشرفون فيه
function meetBlock() {
  const m = F.meet, t = T(F.tid), em = (t && t.emails) || {};
  if (!m || !m.uri) return `<div class="opt meetopt"><span class="tile sm" style="--tc:var(--ty-meet)">${svg('video')}</span><div class="tx"><b>رابط ميت</b><span>يُنشأ من حساب الأنشطة، والمسؤولون عن النشاط مشرفون فيه بحساباتهم.</span></div><button class="btn sm" type="button" data-act="f-meet" ${F.meetBusy ? 'disabled' : ''}>${F.meetBusy ? '<span class="spin"></span>' : ''}أنشئ الرابط</button></div>`;
  const hostsN = (F.who || []).filter(w => em[w]), miss = (F.who || []).filter(w => !em[w]);
  return `<div class="opt meetopt on"><span class="tile sm" style="--tc:var(--ty-meet)">${svg('video')}</span><div class="tx"><b>رابط ميت</b>
    <span class="mlink"><bdi dir="ltr">${esc(m.uri.replace('https://', ''))}</bdi></span>
    <span>${hostsN.length ? 'المشرفون: ' + esc(hostsN.join('، ')) + ((D.settings && (D.settings.meetAdmins || []).length) || isAdmin() ? ' والإدارة' : '') : 'لا مشرف من الفريق بعد'}</span>
    ${miss.length ? `<span class="warnt">${svg('alert')}بلا بريد: ${esc(miss.join('، '))}. يُضاف في «الفريق» فيصيرون مشرفين.</span>` : ''}
    ${m.err ? `<span class="warnt">${svg('alert')}تعذّر جزء من الإشراف: ${esc(m.err)}</span>` : ''}</div>
    <div class="col" style="gap:6px;align-items:stretch"><a class="btn sm pri" href="${esc(m.uri)}" target="_blank" rel="noopener">${svg('ext')}افتح</a><button class="btn sm" type="button" data-act="f-copy" data-v="${esc(m.uri)}">${svg('copy')}انسخ</button></div></div>
    <div class="row" style="justify-content:flex-end;margin-top:-8px"><button class="lk xs" type="button" data-act="f-meet-del">إزالة الرابط من النشاط</button></div>`;
}
function drawAct(keepFocus) {
  if (F.dock && !$('#dock')) F.dock = false;
  const { head, body, foot } = actParts();
  if (F.dock) {
    const el = $('#dock'), st = $('#dock .dk-b') ? $('#dock .dk-b').scrollTop : 0, fk = focusKey('#dock');
    el.innerHTML = `<div class="dk-h form">${head}<button class="btn icon" type="button" data-act="f-cancel" aria-label="إغلاق">${svg('x')}</button></div><div class="dk-b">${body}</div><div class="dk-f">${foot}</div>`;
    el.classList.add('editing');
    if (st) $('#dock .dk-b').scrollTop = st;
    markSel(); refocus('#dock', fk);
    if (!keepFocus) { const f = $('#dock [autofocus]'); if (f) f.focus({ preventScroll: true }); }
    return;
  }
  const st = $('#layer .sh-b') ? $('#layer .sh-b').scrollTop : 0, keepPrev = LAYER && $('#layer .sheet') ? LAYER.prevFocus : null, fk = focusKey('#layer');
  openSheet(head, body, foot, { label: 'نشاط', noFocus: keepFocus });
  if (keepPrev) LAYER.prevFocus = keepPrev;
  if (st) $('#layer .sh-b').scrollTop = st;
  refocus('#layer', fk);
}
// إبراز النشاط المفتوح في الجدول ويومه
function markSel() {
  $$('.ev.sel').forEach(e => e.classList.remove('sel')); $$('tr.selrow,.mday.selrow').forEach(e => e.classList.remove('selrow'));
  if (!F || !F.dock) return;
  if (F.id) $$(`.ev[data-id="${F.id}"]`).forEach(e => e.classList.add('sel'));
  const r = document.getElementById('d-' + F.d); if (r) r.classList.add('selrow');
}
// إبقاء التركيز على الزر نفسه بعد إعادة رسم النموذج
function focusKey(sc) { const ae = document.activeElement; if (!ae || !ae.closest || !ae.closest(sc) || !ae.dataset || !ae.dataset.act) return ''; return `[data-act="${ae.dataset.act}"]` + (ae.dataset.v ? `[data-v="${CSS.escape(ae.dataset.v)}"]` : ''); }
function refocus(sc, k) { if (!k) return; const n = $(sc + ' ' + k); if (n) n.focus({ preventScroll: true }); }
function closeAct() { if (F && F.dock) { F = null; render(); } else closeLayer(); }
function readF() {
  if (!F) return;
  const g = id => $('#' + id);
  if (g('f-title')) F.title = g('f-title').value;
  if (g('f-idea')) F.idea = g('f-idea').value;
  if (g('f-d') && g('f-d').value) F.d = g('f-d').value;
  if (g('f-time')) F.time = g('f-time').value;
  if (g('f-dur')) F.dur = +g('f-dur').value;
  if (g('f-note')) F.note = g('f-note').value;
  if (g('f-link')) F.link = g('f-link').value.trim();
  const nw = g('f-whonew'); if (nw && nw.value.trim()) { F.who = [...new Set((F.who || []).concat(nw.value.trim()))]; nw.value = ''; }
}
async function saveF() {
  readF();
  const f = F, tid = f.tid;
  if (!tid) return toast('اختر المسار', 'err');
  const mode = fMode();
  let patch;
  if (mode === 'ro') patch = { id: f.id, done: !!f.done, note: f.note || '', link: f.link || '' };
  else {
    if (!f.title.trim()) { toast('اكتب اسم النشاط', 'err'); $('#f-title') && $('#f-title').focus(); return; }
    if (f.link && !/^https?:\/\//i.test(f.link)) { toast('الرابط يبدأ بـ https://', 'err'); $('#f-link') && $('#f-link').focus(); return; }
    patch = { title: f.title.trim(), type: f.type, d: f.d, time: f.time || '', dur: f.dur || 0, who: f.who || [], idea: f.idea || '', rem: f.rem };
    if (!f.isNew) Object.assign(patch, { id: f.id, done: !!f.done, note: f.note || '', link: f.link || '' });
    if (isAdmin()) { const was = !!(f.cal && f.cal.id); if (f.calOn !== was) patch.calOn = !!f.calOn; }
    const s = semFor(tid, f.d); if (s) patch.sem = s;
  }
  const newNames = (f.who || []).filter(w => !members(tid).includes(w));
  const cl = mode !== 'ro' && MEET_T.includes(f.type) ? dayMeets(tid, f.d, f.id) : [];
  if (f.dock) F = null; else closeLayer();
  try {
    await saveAct(tid, patch);
    toast((f.isNew ? `أُضيف ${qt(patch.title)}` : 'حُفظ') + (cl.length ? ` — تنبيه: ${clashText(cl.concat(qt(patch.title)))}` : '') + (!isAdmin() && !f.isNew && mode !== 'ro' ? '. وصل الإدارةَ تنبيه بالتغيير' : ''));
    if (newNames.length && canEdit(tid)) trackSave(tid, { members: members(tid).concat(newNames) }).catch(() => {});
  } catch (e) {}
}

/* ---------- المهام ---------- */
let TK = null;
function taskDialog(tid, id) {
  const x = id ? tasksOf(tid).find(y => y.id === id) : null;
  TK = x ? JSON.parse(JSON.stringify(x)) : { title: '', d: '', who: [], done: false };
  TK.tid = tid; TK.isNew = !x; drawTask();
}
function drawTask() {
  const t = T(TK.tid);
  openDialog(`<h3>${TK.isNew ? 'مهمة جديدة' : 'المهمة'} <span class="xs faint">· ${esc(t.name)}</span></h3>
    <div class="field"><label for="tk-t">المهمة</label><input class="inp" id="tk-t" value="${esc(TK.title)}" placeholder="مثل: تجهيز أسئلة الكاهوت" autofocus></div>
    <div class="field"><label for="tk-d">قبل يوم</label><input class="inp" id="tk-d" type="date" value="${TK.d || ''}"></div>
    <div class="field"><span class="flabel">من يقوم بها</span><div class="whos">${members(TK.tid).map(w => `<button class="chip" type="button" aria-pressed="${(TK.who || []).includes(w)}" data-act="tk-who" data-v="${esc(w)}">${esc(w)}</button>`).join('') || '<span class="muted sm">أضيفوا أسماء الفريق من «الفريق».</span>'}</div></div>
    ${TK.isNew ? '' : `<div class="opt" style="border-top:0"><button class="ck round ok" type="button" role="checkbox" aria-checked="${!!TK.done}" data-act="tk-tgl" aria-label="تمت">${svg('check', 2.4)}</button><div class="tx"><b>تمت</b></div></div>`}
    <div class="row"><button class="btn pri" type="button" data-act="tk-save">${TK.isNew ? 'أضف المهمة' : 'احفظ'}</button><button class="btn" type="button" data-act="close">إلغاء</button><span class="sp"></span>${TK.isNew ? '' : `<button class="btn danger" type="button" data-act="tk-del">حذف</button>`}</div>`);
}
function readTK() { if (!TK) return; const a = $('#tk-t'), b = $('#tk-d'); if (a) TK.title = a.value; if (b) TK.d = b.value; }
async function saveTask(tid, patch, quiet) {
  const p = planOf(tid); p.tasks = p.tasks || [];
  const i = patch.id ? p.tasks.findIndex(x => x.id === patch.id) : -1, prev = i >= 0 ? p.tasks[i] : null;
  if (prev) p.tasks[i] = Object.assign({}, prev, patch); render(); setSync('busy');
  try { const r = await API.me('task_save', tid, JSON.stringify(patch)); const j = p.tasks.findIndex(x => x.id === r.task.id); if (j >= 0) p.tasks[j] = r.task; else p.tasks.push(r.task); p.rev = r.rev; D.revs[tid] = r.rev; setSync('ok'); render(); return r.task; }
  catch (e) { if (prev) p.tasks[i] = prev; setSync('ok'); render(); toast(e.message, 'err'); throw e; }
}

/* ---------- تعديل يوم في الجدول، والتحرير داخل الخلية ---------- */
function dayEdit(id, n, d) {
  const x = dayOf(id, n, d); if (!x) return;
  const f = (k, l, ph = '') => `<div class="field"><label for="de-${k}">${l}</label><input class="inp" id="de-${k}" value="${esc(x[k] || '')}" placeholder="${ph}"></div>`;
  openSheet(`<div class="col"><span class="xs faint">${esc(T(id).name)} · الأسبوع ${x.w}</span><b style="font-family:var(--fd);font-weight:500;font-size:19px;color:var(--ink)">${gLong(d)}</b><span class="xs faint">${esc(x.h || hijri(d))}</span></div>`,
    `${f('ax', 'المحور')}${f('c', 'المقرر')}${f('q', 'المقدار')}${f('r', 'المطلوب')}
     <div class="sep" style="margin:2px 0"></div>
     ${f('ev', 'حدث اليوم', 'مثل: الاختبار النصفي، لقاء أولياء الأمور')}
     ${f('p', 'فترة بلا مقرر', 'مثل: إجازة، استدراك ومراجعة')}
     <p class="hint">«حدث اليوم» يظهر شارة في الجدول، والاختبارات تُكتب بكلمة «الاختبار».</p>`,
    `<button class="btn pri" type="button" data-act="de-save" data-id="${id}" data-n="${n}" data-d="${d}">احفظ</button><button class="btn" type="button" data-act="close">إلغاء</button>`, { label: 'تعديل اليوم' });
}
async function saveDay(id, n, d, patch) {
  const S = semOf(id, n), i = S.days.findIndex(x => x.d === d), prev = S.days[i];
  S.days[i] = Object.assign({}, prev, patch); Object.keys(patch).forEach(k => { if (!patch[k]) delete S.days[i][k]; });
  render(); setSync('busy');
  try { const r = await API.me('day_save', id, n, JSON.stringify(Object.assign({ d }, patch))); S.days[i] = r.day; planOf(id).rev = r.rev; D.revs[id] = r.rev; setSync('ok'); render(); }
  catch (e) { S.days[i] = prev; setSync('ok'); render(); toast(e.message, 'err'); }
}
function inlineEdit(btn) {
  const { id, n, d, k } = btn.dataset, x = dayOf(id, n, d), old = x[k] || '';
  const td = btn.parentElement, inp = document.createElement('input');
  inp.className = 'cell-in'; inp.value = old; inp.setAttribute('aria-label', { ax: 'المحور', c: 'المقرر', q: 'المقدار', r: 'المطلوب' }[k]);
  td.replaceChild(inp, btn); inp.focus(); inp.select();
  let done = false;
  const fin = save => { if (done) return; done = true; const v = inp.value.trim(); if (save && v !== old) saveDay(id, n, d, { [k]: v }); else render(); };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); fin(true); } else if (e.key === 'Escape') { e.preventDefault(); fin(false); } });
  inp.addEventListener('blur', () => fin(true));
}

/* ---------- جدول الفصل: استيراد وإنشاء ---------- */
function semMenu(id, n) {
  openDialog(`<h3>جدول ${semLabel(n)}</h3><p class="muted sm">${esc(T(id).full)}</p>
    <div class="list"><button class="li btnish" type="button" data-act="semimport" data-id="${id}" data-n="${n}">${svg('sheet')}<div class="tx"><div class="tt">استيراد من جوجل شيت</div><div class="mt">يستبدل أيام الفصل بما في الورقة، وتبقى الأنشطة</div></div></button>
    <button class="li btnish" type="button" data-act="semnew" data-id="${id}" data-n="${n}">${svg('cal')}<div class="tx"><div class="tt">إنشاء أيام الفصل من تاريخين</div><div class="mt">أيام فارغة تملؤها بعد ذلك</div></div></button>
    ${isAdmin() && semOf(id, n) ? `<button class="li btnish" type="button" data-act="semdel" data-id="${id}" data-n="${n}">${svg('trash')}<div class="tx"><div class="tt">حذف جدول هذا الفصل</div><div class="mt">لا يُحذف إن كانت فيه أنشطة</div></div></button>` : ''}</div>
    <div class="row"><span class="sp"></span><button class="btn" type="button" data-act="close">إغلاق</button></div>`);
}
function semImport(id, n) {
  const t = T(id);
  openDialog(`<h3>استيراد ${semLabel(n)} من جوجل شيت</h3>
    <p class="muted sm">الصق رابط الورقة التي فيها أعمدة: الأسبوع، التاريخ الهجري، التاريخ الميلادي، المحور، المقرر، المقدار، المطلوب. افتح الورقة المطلوبة قبل نسخ الرابط.</p>
    <div class="field"><label for="si-url">رابط الورقة</label><input class="inp ltr" style="display:block;text-align:left" id="si-url" type="url" value="${esc(t.sheet || '')}" placeholder="https://docs.google.com/spreadsheets/d/…"></div>
    <div id="si-out"></div>
    <div class="row"><button class="btn pri" type="button" data-act="si-check" data-id="${id}" data-n="${n}">اقرأ الورقة</button><button class="btn" type="button" data-act="close">إلغاء</button></div>`);
}
function semNew(id, n) {
  const r = semRange(id, curN(id));
  openDialog(`<h3>أيام ${semLabel(n)}</h3><p class="muted sm">تُنشأ الأيام من البداية إلى النهاية مقسومة على أسابيع تبدأ بالسبت، ثم تملأ المقررات من الجدول.</p>
    <div class="grid2" style="gap:10px"><div class="field"><label for="sn-a">أول يوم</label><input class="inp" id="sn-a" type="date" value="${r ? add(r.to, 7 - wd(add(r.to, 0))) : wkStart(TODAY)}"></div><div class="field"><label for="sn-b">آخر يوم</label><input class="inp" id="sn-b" type="date" value="${r ? add(r.to, 7 * 16) : add(wkStart(TODAY), 7 * 15 - 1)}"></div></div>
    <div class="row"><button class="btn pri" type="button" data-act="sn-save" data-id="${id}" data-n="${n}">أنشئ الأيام</button><button class="btn" type="button" data-act="close">إلغاء</button></div>`);
}
async function semPut(id, n, days, src) {
  setSync('busy');
  try { const r = await API.me('sem_put', id, n, JSON.stringify({ days, src })); planOf(id).sems[String(n)] = r.sem; planOf(id).rev = r.rev; D.revs[id] = r.rev; indexHijri(); setSync('ok'); closeLayer(); render(); toast(`حُفظ جدول ${semLabel(n)}: ${r.sem.days.length} يومًا`); }
  catch (e) { setSync('ok'); toast(e.message, 'err'); }
}

/* ---------- أعضاء الفريق ---------- */
let MB = [];
function membersSheet(id) {
  const em = T(id).emails || {};
  MB = members(id).map(n => ({ n, e: em[n] || '' })); if (!MB.length) MB.push({ n: '', e: '' });
  drawMembers(id);
}
const mbRows = () => MB.map((m, i) => `<div class="mbr"><input class="inp" data-mb="n" data-i="${i}" value="${esc(m.n)}" placeholder="الاسم" aria-label="الاسم"><input class="inp ltr" type="email" inputmode="email" data-mb="e" data-i="${i}" value="${esc(m.e)}" placeholder="name@gmail.com" aria-label="البريد"><button class="btn icon" type="button" data-act="mb-del" data-i="${i}" aria-label="احذف">${svg('x')}</button></div>`).join('');
function drawMembers(id, focusLast) {
  const t = T(id), box = $('#layer .mbl');
  if (box) { box.innerHTML = mbRows(); if (focusLast) { const ins = $$('[data-mb="n"]'); if (ins.length) ins[ins.length - 1].focus(); } return; }
  openDialog(`<h3>فريق ${esc(t.name)}</h3><p class="muted sm">الأسماء تظهر عند اختيار المسؤول عن النشاط. والبريد حساب جوجل لصاحبه: به يصير مشرفًا في لقاءات ميت التي هو مسؤول عنها.</p>
    <div class="mbl">${mbRows()}</div>
    <button class="btn sm ghost" type="button" data-act="mb-add" data-id="${id}" style="align-self:flex-start">${svg('plus')}عضو</button>
    <div class="row"><button class="btn pri" type="button" data-act="mb-save" data-id="${id}">احفظ</button><button class="btn" type="button" data-act="close">إلغاء</button></div>`);
  if (focusLast) { const ins = $$('[data-mb="n"]'); if (ins.length) ins[ins.length - 1].focus(); }
}
function readMB() { $$('[data-mb]').forEach(el => { const m = MB[+el.dataset.i]; if (m) m[el.dataset.mb] = el.value.trim(); }); }

/* ---------- قائمة الحساب ---------- */
function userMenu() {
  openDialog(`<div class="row">${isAdmin() ? adminAv() : avatar(T(D.me.track).name, tcol(D.me.track))}<div class="col"><b>${esc(D.me.name)}</b><span class="xs faint">اسم المستخدم: <bdi>${esc(D.me.user)}</bdi></span></div></div>
    <div class="list">
      <button class="li btnish" type="button" data-act="theme">${svg(P.theme === 'dark' ? 'sun' : 'moon')}<div class="tx"><div class="tt">${P.theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}</div></div></button>
      <button class="li btnish" type="button" data-act="mypass">${svg('key')}<div class="tx"><div class="tt">تغيير كلمة المرور</div></div></button>
      ${isMob() && isAdmin() ? `<a class="li btnish" href="#calendar">${svg('gcal')}<div class="tx"><div class="tt">تقويم جوجل</div></div></a><a class="li btnish" href="#bot">${svg('bot')}<div class="tx"><div class="tt">بوت التذكيرات</div></div></a><a class="li btnish" href="#accounts">${svg('key')}<div class="tx"><div class="tt">الحسابات</div></div></a>` : ''}
      <button class="li btnish" type="button" data-act="logout">${svg('out')}<div class="tx"><div class="tt">خروج</div></div></button>
    </div>`);
}
function passDialog() {
  openDialog(`<h3>تغيير كلمة المرور</h3>
    <div class="field"><label for="pw-o">الحالية</label><input class="inp" id="pw-o" type="password" autocomplete="current-password"></div>
    <div class="field"><label for="pw-n">الجديدة (٦ أحرف على الأقل)</label><input class="inp" id="pw-n" type="password" autocomplete="new-password"></div>
    <div class="row"><button class="btn pri" type="button" data-act="pw-save">احفظ</button><button class="btn" type="button" data-act="close">إلغاء</button></div>`);
}

/* ---------- تقويم جوجل (الإدارة) ---------- */
let CS = { sel: new Set(), cals: null, busy: false };
VIEWS.calendar = {
  admin: true,
  render() {
    const c = P.cal, ids = c.track ? [c.track] : D.tracks.map(t => t.id);
    const until = c.range === 'upcoming' ? add(TODAY, 60) : '9999';
    let acts = ids.flatMap(id => actsOf(id, curN(id)).map(a => Object.assign(a, { t: id }))).filter(a => a.d <= until && (c.range !== 'upcoming' || a.d >= TODAY));
    if (c.meet) acts = acts.filter(remindable);
    const stOf = a => !a.cal || !a.cal.id ? 'none' : a.cal.err ? 'err' : 'on';
    const cnt = { on: 0, none: 0, err: 0 }; acts.forEach(a => cnt[stOf(a)]++);
    if (c.status !== 'all') acts = acts.filter(a => stOf(a) === c.status);
    acts.sort(sortA);
    const groups = new Map(); acts.forEach(a => { const w = wkStart(a.d); if (!groups.has(w)) groups.set(w, []); groups.get(w).push(a); });
    const stBadge = a => { const s = stOf(a); return s === 'on' ? `<span class="pill ok" data-tip="أُرسل ${ago(a.cal.at)}">${svg('check')}في التقويم</span>` : s === 'err' ? `<span class="pill warn" data-tip="${esc(a.cal.err)}">${svg('alert')}تعذّر التحديث</span>` : `<span class="pill dash">غير مُرسل</span>`; };
    const key = a => a.t + '|' + a.id;
    const list = [...groups.entries()].map(([w, L]) => { const all = L.every(a => CS.sel.has(key(a))); return `<div class="card" style="padding:8px 14px;margin-bottom:12px">
      <div class="row" style="padding:8px 8px 6px"><button class="ck" type="button" role="checkbox" aria-checked="${all}" data-act="cal-selw" data-w="${w}" aria-label="تحديد الأسبوع">${svg('check', 2.4)}</button><b style="font-family:var(--fd);font-weight:500;color:var(--ink)">${gShort(w)} – ${gShort(add(w, 6))}</b><span class="xs faint">${nActs(L.length)}</span></div>
      ${L.map(a => `<div class="calrow"><button class="ck" type="button" role="checkbox" aria-checked="${CS.sel.has(key(a))}" data-act="cal-sel" data-k="${key(a)}" aria-label="تحديد ${esc(a.title)}">${svg('check', 2.4)}</button>
        <div class="d"><b>${DAYS[wd(a.d)]} ${dnum(a.d)}</b>${a.time ? timeText(a.time) : 'يوم كامل'}</div>
        <button class="row" type="button" style="gap:10px;min-width:0;text-align:start" data-act="openact" data-id="${a.id}" data-track="${a.t}">${tile(a.type, 'sm')}<span class="col" style="min-width:0"><span class="ellip" style="color:var(--ink1)">${esc(a.title)}</span><span class="xs faint"><span class="hl"><i style="background:${tcol(a.t)};border-radius:2px"></i>${esc(T(a.t).name)}</span> · ${esc(a.type)}</span></span></button>
        <span class="st">${stBadge(a)}</span></div>`).join('')}</div>`; }).join('');
    const seg = (k, v, l) => `<button type="button" aria-pressed="${c[k] === v}" data-act="cal-f" data-k="${k}" data-v="${v}">${l}</button>`;
    return pageHead('', 'تقويم جوجل', 'اختر ما يظهر في تقويمك من أنشطة المسارات. ما ترسله يبقى محدّثًا إذا عُدّل أو نُقل، ويُحذف من التقويم إذا حُذف.',
      `<div class="card flat" style="padding:12px 16px;min-width:260px"><div class="xs faint">التقويم المستعمل</div><div class="row" style="margin-top:4px"><b class="ellip" style="flex:1">${esc((D.cal && D.cal.name) || 'التقويم الأساسي لحساب المنصة')}</b><button class="btn sm ghost" type="button" data-act="cal-pick">تغيير</button></div></div>`) + `
    <div class="toolbar">
      <div class="row" style="gap:6px;flex-wrap:wrap"><button class="chip" type="button" aria-pressed="${!c.track}" data-act="cal-f" data-k="track" data-v="">كل المسارات</button>${D.tracks.map(t => `<button class="chip" type="button" aria-pressed="${c.track === t.id}" data-act="cal-f" data-k="track" data-v="${t.id}"><i style="background:${t.color}"></i>${esc(t.name)}</button>`).join('')}</div></div>
    <div class="toolbar"><div class="seg">${seg('status', 'all', 'الكل')}${seg('status', 'none', `غير مُرسل ${cnt.none}`)}${seg('status', 'on', `في التقويم ${cnt.on}`)}${cnt.err ? seg('status', 'err', `تعذّر ${cnt.err}`) : ''}</div>
      <div class="seg">${seg('range', 'upcoming', 'القادم')}${seg('range', 'sem', 'الفصل كله')}</div>
      <button class="chip" type="button" aria-pressed="${!!c.meet}" data-act="cal-meet">اللقاءات فقط</button><span class="sp"></span>
      <button class="btn sm" type="button" data-act="cal-selall">${acts.length && acts.every(a => CS.sel.has(key(a))) ? 'ألغِ التحديد' : 'حدّد الكل (' + acts.length + ')'}</button></div>
    ${list || `<div class="card empty">${svg('gcal')}<h3>لا أنشطة بهذه التصفية</h3><p>غيّر المسار أو الحالة أو المدى.</p></div>`}
    <div class="card sect"><div class="card-h"><h3>روابط ميت</h3></div><p class="muted sm">تُنشأ من نافذة النشاط بزر «أنشئ الرابط»، من حساب الأنشطة، ويكون المسؤولون عن النشاط مشرفين فيها ببريدهم المكتوب في «الفريق». وبريد الإدارة هنا يصير مشرفًا في كل لقاء.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px"><input class="inp ltr" style="flex:1;min-width:220px;text-align:left" id="mt-admins" inputmode="email" placeholder="admin@jeelacademy.app" value="${esc(((D.settings && D.settings.meetAdmins) || []).join(', '))}"><button class="btn" type="button" data-act="mt-admins">احفظ</button></div></div>
    ${CS.sel.size ? `<div class="bulk" role="region" aria-label="إجراءات المحدد"><b class="sm">حُدّد ${nActs(CS.sel.size)}</b><button class="btn pri sm" type="button" data-act="cal-push" ${CS.busy ? 'disabled' : ''}>${CS.busy ? '<span class="spin"></span>' : svg('gcal')}أرسل إلى التقويم</button><button class="btn sm" type="button" data-act="cal-pull" ${CS.busy ? 'disabled' : ''}>أزل من التقويم</button><button class="btn sm ghost" type="button" data-act="cal-clear">إلغاء</button></div>` : ''}`;
  }
};
async function calPush(on) {
  const items = [...CS.sel].map(k => { const [t, id] = k.split('|'); return { t, id }; });
  CS.busy = true; render(); setSync('busy');
  try {
    const r = await API.me('cal_push', JSON.stringify(items), on);
    r.ok.forEach(x => { const a = planOf(x.t).acts.find(y => y.id === x.id); if (a) { if (x.cal) a.cal = x.cal; else delete a.cal; } });
    Object.keys(r.rev || {}).forEach(t => { planOf(t).rev = r.rev[t]; D.revs[t] = r.rev[t]; });
    CS.sel.clear(); toast(on ? `أُرسل ${nActs(r.ok.length)} إلى التقويم` : `أُزيل ${nActs(r.ok.length)} من التقويم`);
    if (r.err.length) toast(`تعذّر ${nActs(r.err.length)}: ${r.err[0].msg}`, 'err');
  } catch (e) { toast(e.message, 'err'); }
  CS.busy = false; setSync('ok'); render();
}
async function calPick() {
  openDialog(`<h3>أي تقويم تُرسل إليه الأنشطة؟</h3><div id="cp-list"><span class="spin"></span></div>
    <div class="sep"></div><div class="field"><label for="cp-new">أو أنشئ تقويمًا خاصًا بالأنشطة</label><div class="row"><input class="inp" id="cp-new" value="أنشطة المسارات"><button class="btn" type="button" data-act="cp-new">أنشئ</button></div><p class="hint">التقويم الخاص يُشارك مع من تريد ويمكن إخفاؤه وإظهاره.</p></div>`);
  try {
    const L = await API.me('cal_list');
    const box = $('#cp-list'); if (!box) return;
    box.innerHTML = `<div class="list">${L.sort((a, b) => (b.own - a.own)).map(c => `<button class="li btnish" type="button" data-act="cp-set" data-id="${esc(c.id)}"><span class="ck round" role="presentation" aria-checked="${c.cur}">${svg('check', 2.4)}</span><div class="tx"><div class="tt">${esc(c.name)}${c.primary ? ' <span class="faint xs">الأساسي</span>' : ''}</div><div class="mt"><bdi>${esc(c.id)}</bdi>${c.own ? '' : ' · ليس ملكًا لحساب المنصة'}</div></div></button>`).join('')}</div>`;
  } catch (e) { const box = $('#cp-list'); if (box) box.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}
async function calSet(id) {
  setSync('busy');
  try { const r = await API.me('cal_set', id); D.cal = { id: r.id, name: r.name }; closeLayer(); toast(`صار التقويم «${r.name}»${r.moved ? ` ونُقل إليه ${nActs(r.moved)}` : ''}`); await boot(true); }
  catch (e) { toast(e.message, 'err'); }
  setSync('ok');
}

/* ---------- بوت التذكيرات (الإدارة) ---------- */
// أوامر البوت (تطابق BOT_COMMANDS في الخادم): [الأمر، المهمة، ما يسأل عنه البوت]
const BOT_CMDS = [
  ['help', 'ما يستطيع البوت فعله', 'يعرض هذه القائمة.'],
  ['week', 'خطة هذا الأسبوع ومهامه', 'يعرض أنشطة الأسبوع ومهامه لمسار المجموعة.'],
  ['add', 'إضافة نشاط', 'يسأل عن: الاسم، والنوع، واليوم، والوقت، والمسؤول، والفكرة باختصار.'],
  ['task', 'إضافة مهمة', 'يسأل عن: المهمة، ومن يقوم بها، وقبل أي يوم.'],
  ['edit', 'تعديل نشاط', 'يسأل: أي نشاط، وما الذي يتغيّر (الموعد، المسؤول، الاسم، الفكرة)، والقيمة الجديدة.'],
  ['done', 'تعليم «تم»', 'يسأل: أي نشاط أو مهمة، وملاحظة قصيرة بعد التنفيذ (اختيارية).'],
  ['meet', 'رابط ميت للقاء', 'يسأل: أي لقاء، ثم يرسل الرابط ويجعل المسؤولين مشرفين فيه.'],
  ['remove', 'حذف نشاط أو مهمة', 'يسأل: أيها، ويطلب التأكيد قبل الحذف.']
];
let BS = null, BS_LOAD = false, WATCH = null;
VIEWS.bot = {
  admin: true,
  render() {
    if (!BS) { if (!BS_LOAD) { BS_LOAD = true; API.me('tg_poll').then(s => { BS = s; render(); }).catch(e => { BS = { err: e.message }; render(); }); } return pageHead('', 'بوت التذكيرات', '') + `<div class="card empty"><span class="spin"></span></div>`; }
    if (BS.err && !BS.tracks) return pageHead('', 'بوت التذكيرات', '') + `<div class="card empty">${svg('alert')}<p>${esc(BS.err)}</p><button class="btn" type="button" data-act="bot-refresh">أعد المحاولة</button></div>`;
    const s = BS.settings || D.settings || {};
    if (!BS.hasToken) return pageHead('', 'بوت التذكيرات', 'يرسل البوت في مجموعة كل فريق تذكيرًا قبل اللقاء بثلاثة أيام لتصميم الإعلان وإعداده، وقبله بيوم لنشره، وملخصًا لأنشطة الأسبوع.') + `
      <div class="grid2"><div class="card"><div class="card-h"><h3>أنشئ البوت واربطه</h3></div>
        <ol class="steps3">
          <li><div>افتح <a class="lk" href="https://t.me/BotFather" target="_blank" rel="noopener">BotFather</a> في تليجرام وأرسل له <bdi class="ltr">/newbot</bdi></div></li>
          <li><div>اختر اسمًا للبوت (مثل: تذكيرات الأنشطة)، ثم معرّفًا ينتهي بـ <bdi class="ltr">bot</bdi></div></li>
          <li><div style="flex:1">انسخ الرمز الذي يعطيك إياه والصقه هنا:
            <div class="row" style="margin-top:10px"><input class="inp ltr" style="display:block;text-align:left" id="bt-tok" placeholder="123456789:AA…" autocomplete="off"><button class="btn pri" type="button" data-act="bot-token">اربط</button></div></div></li>
        </ol></div>
        <div class="card"><div class="card-h"><h3>هكذا تصل التذكيرات</h3></div><div class="tgwall">${tgPreview(s, 'd3')}${tgPreview(s, 'd1')}</div></div></div>`;
    const bot = BS.bot || {}, lt = BS.lastTick;
    const trRows = BS.tracks.map(t => { const tt = T(t.id); return `<div class="li botrow">${logoImg(t.id)}<div class="tx"><div class="tt">${esc(tt.full || tt.name)}</div><div class="mt">${t.chat ? `مربوط بـ «${esc(t.chat.title)}»${t.remind ? '' : ' · التذكيرات موقفة'}` : 'لم تُربط مجموعة بعد'}</div></div>
      ${t.chat ? `<button class="sw" type="button" role="switch" aria-checked="${t.remind}" data-act="bot-remind" data-id="${t.id}" aria-label="تذكيرات ${esc(tt.name)}" data-tip="${t.remind ? 'أوقف التذكيرات' : 'شغّل التذكيرات'}"></button><button class="btn sm ghost" type="button" data-act="bot-test" data-id="${t.id}">تجربة</button><button class="btn icon" type="button" data-act="bot-unlink" data-chat="${esc(t.chat.id)}" aria-label="إلغاء الربط" data-tip="إلغاء الربط">${svg('x')}</button>`
        : `<a class="btn sm pri" href="${esc(t.link)}" target="_blank" rel="noopener" data-act="tgwatch">${svg('send')}أضف البوت إلى مجموعة ${esc(tt.name)}</a>`}</div>`; }).join('');
    const unassigned = (BS.chats || []).filter(c => !c.to && !c.left && c.type !== 'private');
    const up = (BS.upcoming || []).map(u => `<div class="li"><div class="d" style="width:92px;line-height:1.35"><b style="display:block;font-weight:500">${DAYS[wd(u.on)]} ${dnum(u.on)}</b><span class="xs faint">${rel(u.on)}</span></div><span class="hl"><i style="background:${tcol(u.t)};border-radius:2px"></i></span><div class="tx"><div class="tt">${u.kind === 'd3' ? 'تصميم الإعلان' : 'نشر الإعلان'}: ${esc(u.title)}</div><div class="mt">${esc(T(u.t).name)} · اللقاء ${gDay(u.d)}</div></div>${u.sent ? `<span class="pill ok">${svg('check')}أُرسل</span>` : u.linked ? `<span class="pill">مجدول</span>` : `<span class="pill dash">المجموعة غير مربوطة</span>`}</div>`).join('');
    const hours = Array.from({ length: 17 }, (_, i) => i + 6);
    return pageHead('', 'بوت التذكيرات', '', `<div class="card flat" style="padding:12px 16px;min-width:270px"><div class="row"><span class="tile" style="--tc:var(--brand)">${svg('bot')}</span><div class="col" style="flex:1;min-width:0"><b>${esc(bot.name || '')}</b><a class="xs lk" href="https://t.me/${esc(bot.username)}" target="_blank" rel="noopener"><bdi>@${esc(bot.username || '')}</bdi></a></div><button class="btn icon" type="button" data-act="bot-refresh" aria-label="تحديث" data-tip="تحديث">${svg('refresh')}</button></div>
      <div class="xs faint" style="margin-top:8px">${lt ? `آخر تشغيل ${ago(lt.at)}${lt.sent ? ' · أُرسلت ' + lt.sent : ''}${lt.ok ? '' : ' · ' + esc(lt.msg)}` : 'يعمل كل ساعة'}</div></div>`) + `
    <div class="card ${BS.settings.groupsPaused ? 'paused' : ''}" style="margin-bottom:16px"><div class="opt" style="border:0;padding:0"><span class="tile sm" style="--tc:var(--warn)">${svg('alert')}</span><div class="tx"><b>${BS.settings.groupsPaused ? 'الإرسال في المجموعات موقوف' : 'الإرسال في المجموعات يعمل'}</b><span>${BS.settings.groupsPaused ? 'لا يرسل البوت شيئًا في المجموعات: لا تذكيرات ولا ملخصات ولا تنبيهات ولا رسائل ربط. ويبقى ما يصلك على الخاص. التذكيرات المستحقة تُرسل بعد إعادة التشغيل.' : 'التذكيرات والملخصات والتنبيهات تصل مجموعات الفرق.'}</span></div><button class="sw" type="button" role="switch" aria-checked="${!BS.settings.groupsPaused}" data-act="bs-pause" aria-label="الإرسال في المجموعات"></button></div></div>
    <div class="card" style="margin-bottom:16px"><div class="card-h"><h3>مهام البوت</h3><span class="xs faint">تظهر للفرق حين يكتبون / في المجموعة</span><span class="sp"></span><button class="btn sm ghost" type="button" data-act="bot-menu">${svg('refresh')}حدّث القائمة في تليجرام</button></div>
      <div class="cmds">${BOT_CMDS.map(c => `<div class="cmd-i"><code dir="ltr">/${c[0]}</code><div class="tx"><b>${c[1]}</b><span>${c[2]}</span></div></div>`).join('')}</div>
      <p class="hint" style="margin-top:10px">${svg('bot')} يسأل البوت عن كل تفصيل ينقصه قبل التنفيذ، ثم يقول «تم». وما يحتاج صلاحية أوسع من صلاحية الفريق يرجع فيه إليك على الخاص.</p>
      <div class="opt"><div class="tx"><b>مهام الأسبوع لك على الخاص</b><span>كل سبت مع الملخص: مهام كل مسار، وما يحتاج قرارك</span></div><button class="sw" type="button" role="switch" aria-checked="${BS.settings.adminTasks !== false}" data-act="bs-atasks" aria-label="مهام الأسبوع على الخاص"></button></div></div>
    <div class="cols">
      <section class="stack">
        <div class="card"><div class="card-h"><h3>مجموعات الفرق</h3><span class="xs faint">${BS.tracks.filter(t => t.chat).length} من ${BS.tracks.length} مربوطة</span></div>
          <p class="muted sm" style="margin-bottom:6px">زر «أضف البوت» يفتح تليجرام لتختار مجموعة الفريق، فيرتبط بها تلقائيًا. يستطيع الفريق فعل ذلك من صفحته أيضًا.</p>
          <div class="list">${trRows}
          <div class="li"><span class="tile" style="--tc:var(--brand)">${svg('users')}</span><div class="tx"><div class="tt">محادثتك مع البوت (الإدارة)</div><div class="mt">${BS.adminChat ? `مربوطة · يصلك ملخص الأسبوع وطلبات الفرق` : 'لتصلك ملخصات الأسبوع وطلبات فتح التعديل'}</div></div>${BS.adminChat ? `<button class="btn sm ghost" type="button" data-act="bot-test" data-id="admin">تجربة</button>` : `<a class="btn sm" href="${esc(BS.adminLink)}" target="_blank" rel="noopener" data-act="tgwatch">افتح البوت</a>`}</div></div>
          ${unassigned.length ? `<div class="sep"></div><p class="sm muted" style="margin-bottom:6px">مجموعات أضيف إليها البوت ولم تُربط:</p><div class="list">${unassigned.map(c => `<div class="li"><span class="tile sm">${svg('users')}</span><div class="tx"><div class="tt">${esc(c.title)}</div><div class="mt">${ago(c.at)}</div></div><select class="inp" style="width:auto" data-act="bot-assign" data-chat="${esc(c.id)}" aria-label="اربطها بمسار"><option value="">اربطها بـ…</option>${D.tracks.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></div>`).join('')}</div>` : ''}
        </div>
        <div class="card"><div class="card-h"><h3>ما سيُرسل قريبًا</h3><button class="btn sm ghost" type="button" data-act="bot-now">أرسل المستحق الآن</button></div>${up ? `<div class="list">${up}</div>` : `<p class="muted sm">لا لقاءات خلال الأيام العشرة القادمة.</p>`}</div>
        ${CFG.demo && window.DEMO ? `<div class="card"><div class="card-h"><h3>رسائل البوت في التجربة</h3><span class="xs faint">ما كان سيصل المجموعات</span></div><div class="tgwall">${window.DEMO.outbox().slice(-8).reverse().map(m => { const tr = BS.tracks.find(t => t.chat && String(t.chat.id) === m.chat); return `<div class="xs faint">${tr ? esc(T(tr.id).name) : String(m.chat) === String((BS.adminChat || {}).id) ? 'الإدارة' : 'مجموعة'} · ${ago(m.at)}</div><div class="tgmsg">${esc(m.text)}</div>`; }).join('') || '<p class="muted sm">لا رسائل بعد.</p>'}</div></div>` : ''}
      </section>
      <aside class="stack">
        <div class="card"><div class="card-h"><h3>الإعدادات</h3></div>
          <div class="field"><label for="bs-h">ساعة إرسال التذكيرات</label><select class="inp" id="bs-h">${hours.map(h => `<option value="${h}" ${+s.remindHour === h ? 'selected' : ''}>${timeText(pad(h) + ':00')}</option>`).join('')}</select></div>
          <div class="field" style="margin-top:12px"><span class="flabel">يُذكَّر بهذه الأنواع</span><div class="types">${TYPE_NAMES.map(k => `<button type="button" aria-pressed="${(s.remindTypes || []).includes(k)}" data-act="bs-type" data-v="${esc(k)}" style="--tc:${typeOf(k)[1]}">${svg(typeOf(k)[0])}${esc(k)}</button>`).join('')}</div><span class="hint">ويمكن تشغيل التذكير لأي نشاط من نافذته.</span></div>
          <div class="opt" style="margin-top:12px"><div class="tx"><b>ملخص الأسبوع للمجموعات</b><span>${DAYS[(s.digest || {}).dow || 0]} ${timeText(pad((s.digest || {}).hour || 9) + ':00')}</span></div><button class="sw" type="button" role="switch" aria-checked="${!!(s.digest || {}).on}" data-act="bs-digest" aria-label="ملخص الأسبوع"></button></div>
          <div class="opt"><div class="tx"><b>تنبيه عند نقل لقاء قريب أو إلغائه</b><span>خلال الأسبوعين القادمين</span></div><button class="sw" type="button" role="switch" aria-checked="${!!s.notifyChanges}" data-act="bs-chg" aria-label="تنبيه التعديل"></button></div>
          <div class="opt"><div class="tx"><b>ملخص الإدارة الأسبوعي</b><span>في محادثتك مع البوت</span></div><button class="sw" type="button" role="switch" aria-checked="${!!s.adminDigest}" data-act="bs-adig" aria-label="ملخص الإدارة"></button></div>
        </div>
        <div class="card"><div class="card-h"><h3>نص التذكيرين</h3></div>
          <div class="ph-chips" style="margin-bottom:8px">${['العنوان', 'الموعد', 'متى', 'المسؤول', 'المسار', 'النوع'].map(k => `<button type="button" data-act="bs-ph" data-v="{${k}}">{${k}}</button>`).join('')}</div>
          <div class="field"><label for="bs-d3">قبل اللقاء بثلاثة أيام</label><textarea class="inp" id="bs-d3" rows="4" data-act="bs-tpl">${esc((s.tpl || {}).d3 || '')}</textarea></div>
          <div class="field" style="margin-top:10px"><label for="bs-d1">قبله بيوم</label><textarea class="inp" id="bs-d1" rows="4" data-act="bs-tpl">${esc((s.tpl || {}).d1 || '')}</textarea></div>
          <div class="tgwall" style="margin-top:12px" id="bs-prev">${tgPreview(s, 'd3')}${tgPreview(s, 'd1')}</div>
          <div class="row" style="margin-top:12px"><button class="btn pri" type="button" data-act="bs-save">احفظ الإعدادات</button></div></div>
      </aside>
    </div>`;
  }
};
function tgFill(tpl, k) {
  const d = add(TODAY, k === 'd3' ? 3 : 1), x = { title: 'لقاء مفتوح: الغفلة.. من أين تبدأ اليقظة؟', d, time: '21:00', who: ['يوسف'], type: 'لقاء' };
  const map = { 'العنوان': x.title, 'الموعد': gDay(d) + ' الساعة ' + timeText(x.time), 'متى': k === 'd3' ? 'بعد 3 أيام' : 'غدًا', 'المتبقي': k === 'd3' ? '3 أيام' : 'يوم واحد', 'المسؤول': x.who.join('، '), 'المسار': 'جذور', 'النوع': 'لقاء', 'الفكرة': '' };
  return String(tpl || '').replace(/\{([^}]+)\}/g, (a, n) => map.hasOwnProperty(n) ? map[n] : a);
}
const tgPreview = (s, k) => `<div class="tgmsg">${esc(tgFill(($('#bs-' + k) && $('#bs-' + k).value) || (s.tpl || {})[k] || '', k))}</div>`;
async function botSaveSettings() {
  const s = Object.assign({}, BS.settings || {});
  const body = { remindHour: +$('#bs-h').value, remindTypes: s.remindTypes, digest: s.digest, notifyChanges: s.notifyChanges, adminDigest: s.adminDigest, tpl: { d3: $('#bs-d3').value, d1: $('#bs-d1').value } };
  setSync('busy');
  try { const r = await API.me('settings_save', JSON.stringify(body)); BS.settings = r.settings; D.settings = r.settings; D.remindTypes = r.settings.remindTypes; setSync('ok'); toast('حُفظت إعدادات البوت'); render(); }
  catch (e) { setSync('ok'); toast(e.message, 'err'); }
}
function watchLink() {   // بعد فتح رابط الربط: نتحقق كل بضع ثوانٍ حتى يرتبط
  if (WATCH) clearInterval(WATCH);
  let n = 0;
  WATCH = setInterval(async () => {
    if (++n > 40) { clearInterval(WATCH); WATCH = null; return; }
    try {
      const r = await API.me('tg_check');
      if (isAdmin()) { const before = (BS && BS.tracks || []).filter(t => t.chat).length + (BS && BS.adminChat ? 1 : 0); BS = r; const after = r.tracks.filter(t => t.chat).length + (r.adminChat ? 1 : 0); if (after > before) { clearInterval(WATCH); WATCH = null; toast('تم الربط ✓'); boot(true); } else if (route().name === 'bot') render(); }
      else if (r.linked) { clearInterval(WATCH); WATCH = null; toast(`تم ربط مجموعتكم ${qt(r.title)} ✓`); boot(true); }
    } catch (e) {}
  }, 4000);
}

/* ---------- الحسابات (الإدارة) ---------- */
let AC = null;
VIEWS.accounts = {
  admin: true,
  render() {
    if (!AC) { API.me('acc_list').then(l => { AC = l; render(); }).catch(e => toast(e.message, 'err')); return pageHead('', 'الحسابات', '') + `<div class="card empty"><span class="spin"></span></div>`; }
    const ord = t => t ? D.tracks.findIndex(x => x.id === t) : -1;
    const rows = AC.slice().sort((a, b) => ord(a.track) - ord(b.track) || (a.created || 0) - (b.created || 0)).map(a => `<div class="li">${a.role === 'admin' ? adminAv() : T(a.track) && LOGOS[a.track] ? logoImg(a.track) : avatar(a.name, tcol(a.track))}
      <div class="tx"><div class="tt">${esc(a.name)} ${a.disabled ? '<span class="pill warn">موقوف</span>' : ''}</div><div class="mt"><bdi>${esc(a.user)}</bdi> · ${a.role === 'admin' ? 'الإدارة: كل المسارات' : 'فريق ' + esc((T(a.track) || {}).name || a.track)} · ${a.last ? 'آخر دخول ' + ago(a.last) : 'لم يدخل بعد'}</div></div>
      <button class="btn sm ghost" type="button" data-act="acc-edit" data-id="${a.uid}">تعديل</button><button class="btn sm" type="button" data-act="acc-reset" data-id="${a.uid}">كلمة مرور جديدة</button></div>`).join('');
    return pageHead('', 'الحسابات', 'نوعان فقط: الإدارة ترى كل المسارات، والفريق يرى مساره. لكل مسار حساب، ويمكن إضافة حسابات أخرى للفريق نفسه.', `<button class="btn pri" type="button" data-act="acc-edit" data-id="">${svg('plus')}حساب</button>`) + `<div class="card"><div class="list">${rows}</div></div>`;
  }
};
function accEdit(uid) {
  const a = uid ? AC.find(x => x.uid === uid) : { user: '', name: '', role: 'team', track: D.tracks[0].id };
  openDialog(`<h3>${uid ? 'تعديل الحساب' : 'حساب جديد'}</h3>
    <div class="field"><label for="ac-n">الاسم</label><input class="inp" id="ac-n" value="${esc(a.name)}" placeholder="مثل: فريق جذور، أو اسم العضو"></div>
    <div class="field"><label for="ac-u">اسم المستخدم (للدخول)</label><input class="inp ltr" style="display:block;text-align:left" id="ac-u" value="${esc(a.user)}" autocomplete="off" placeholder="judhoor2"></div>
    <div class="field"><label for="ac-r">النوع</label><select class="inp" id="ac-r" data-act="ac-role"><option value="team" ${a.role !== 'admin' ? 'selected' : ''}>فريق مسار</option><option value="admin" ${a.role === 'admin' ? 'selected' : ''}>الإدارة</option></select></div>
    <div class="field" id="ac-tf" ${a.role === 'admin' ? 'hidden' : ''}><label for="ac-t">المسار</label><select class="inp" id="ac-t">${D.tracks.map(t => `<option value="${t.id}" ${a.track === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></div>
    ${uid && uid !== D.me.uid ? `<div class="opt"><div class="tx"><b>موقوف</b><span>لا يستطيع الدخول</span></div><button class="sw" type="button" role="switch" aria-checked="${!!a.disabled}" data-act="ac-dis"></button></div>` : ''}
    <div class="row"><button class="btn pri" type="button" data-act="ac-save" data-id="${uid || ''}">احفظ</button><button class="btn" type="button" data-act="close">إلغاء</button><span class="sp"></span>${uid && uid !== D.me.uid ? `<button class="btn danger" type="button" data-act="ac-del" data-id="${uid}">حذف</button>` : ''}</div>`);
}
function showPass(name, user, pw) {
  openDialog(`<h3>كلمة المرور الجديدة</h3><p class="muted sm">أرسلها إلى ${esc(name)}. لن تظهر مرة أخرى، ويستطيع تغييرها بعد الدخول.</p>
    <div class="card flat" style="padding:14px"><div class="xs faint">اسم المستخدم</div><div class="ltr" style="font-size:18px">${esc(user)}</div><div class="xs faint" style="margin-top:8px">كلمة المرور</div><div class="ltr" style="font-size:22px;letter-spacing:.04em">${esc(pw)}</div></div>
    <div class="row"><button class="btn pri" type="button" data-act="copy" data-v="${esc(`منصة الأنشطة التربوية\n${location.origin + location.pathname}\nاسم المستخدم: ${user}\nكلمة المرور: ${pw}`)}">${svg('copy')}انسخ بيانات الدخول</button><button class="btn" type="button" data-act="close">تم</button></div>`);
}

/* ---------- تغييرات الفرق (تنبيهات الإدارة) ---------- */
const AL_KIND = { add: 'أضاف', del: 'حذف', move: 'غيّر موعد', who: 'غيّر المسؤول عن', edit: 'عدّل' };
let AL_NEW = new Set();
VIEWS.alerts = {
  admin: true,
  render() {
    const L = D.alerts || [];
    const side = `<a class="btn sm ghost" href="#bot">${svg('bot')}${D.settings && D.settings.adminChat && D.settings.adminChat.id ? 'تصلك في تليجرام أيضًا' : 'اربط تليجرام الإدارة'}</a>`;
    const head = pageHead('', 'تغييرات الفرق', 'كل ما تغيّره الفرق في خططها: المواعيد، والمسؤولون، والإضافة والحذف. ويصلك تغيير المواعيد والمسؤولين في تليجرام أيضًا.', side);
    if (!L.length) return head + `<div class="card empty">${svg('bell')}<h3>لا تغييرات بعد</h3><p>حين يغيّر فريقٌ موعد نشاط أو المسؤول عنه يظهر هنا.</p></div>`;
    let day = '', h = '';
    for (const x of L) {
      const d = dateOf(x.at);
      if (d !== day) { day = d; h += `<div class="al-day">${d === TODAY ? 'اليوم' : d === add(TODAY, -1) ? 'أمس' : gDay(d)}</div>`; }
      const t = T(x.t), act = x.aid && t && planOf(x.t).acts.find(a => a.id === x.aid);
      const ch = (x.changes || []).filter(c => c[1] || c[2]).map(c => `<div class="al-ch"><span class="k">${esc(c[0])}</span><s>${esc(c[1] || '—')}</s>${svg('fwd')}<b>${esc(c[2] || '—')}</b></div>`).join('')
        + (x.kind === 'add' && x.to ? `<div class="al-ch"><span class="k">الموعد</span><b>${esc(x.to)}</b></div>` : '') + (x.kind === 'del' && x.from ? `<div class="al-ch"><span class="k">كان</span><s>${esc(x.from)}</s></div>` : '');
      h += `<div class="al ${AL_NEW.has(x.id) ? 'new' : ''} k-${x.kind}">${avatar(x.by, t ? t.color : 'var(--ink3)')}<div class="tx">
        <div><b>${esc(x.by)}</b>${t ? ` <span class="tbadge" style="--tcol:${t.color}">${esc(t.name)}</span>` : ''} ${AL_KIND[x.kind] || 'عدّل'} «${esc(x.title)}» <span class="xs faint">${ago(x.at)}</span></div>${ch}</div>
        ${act ? `<button class="btn sm ghost" type="button" data-act="openact" data-id="${act.id}" data-track="${x.t}">افتحه</button>` : ''}</div>`;
    }
    return head + `<div class="card alerts">${h}</div>`;
  },
  after() { if (D.unseen) alertsSeen(false); }
};
const dateOf = ms => { const d = new Date(ms + 3 * 3600e3); return d.toISOString().slice(0, 10); };
async function alertsSeen(manual) {
  AL_NEW = new Set((D.alerts || []).filter(x => !x.seen).map(x => x.id));
  (D.alerts || []).forEach(x => x.seen = true); D.unseen = 0;
  $$('.nl[href="#alerts"] .badge,.bellb .badge').forEach(e => e.remove());
  try { await API.me('alerts_seen', 'all'); } catch (e) {}
  if (manual) render();
}

/* ---------- التقارير الأسبوعية (الإدارة) ---------- */
let RP = null, RP_OPEN = '', RP_AT = 0, RP_LOAD = false;
function md(t) {   // تنسيق بسيط وآمن: عناوين، نقاط، ترقيم، عريض
  const inl = x => esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  let h = '', list = '';
  const close = () => { if (list) { h += `</${list}>`; list = ''; } };
  String(t || '').split('\n').forEach(l => {
    const m = /^(#{1,3})\s+(.*)$/.exec(l), b = /^\s*[-•*]\s+(.*)$/.exec(l), n = /^\s*\d+[.)]\s+(.*)$/.exec(l);
    if (m) { close(); h += `<h${m[1].length + 2}>${inl(m[2])}</h${m[1].length + 2}>`; }
    else if (b) { if (list !== 'ul') { close(); h += '<ul>'; list = 'ul'; } h += `<li>${inl(b[1])}</li>`; }
    else if (n) { if (list !== 'ol') { close(); h += '<ol>'; list = 'ol'; } h += `<li>${inl(n[1])}</li>`; }
    else if (!l.trim()) close();
    else { close(); h += `<p>${inl(l)}</p>`; }
  });
  close(); return h;
}
VIEWS.reports = {
  admin: true,
  render() {
    if (RP && Date.now() - RP_AT > 60000 && !RP_LOAD) { RP_LOAD = true; API.me('report_list').then(l => { RP = l; RP_AT = Date.now(); RP_LOAD = false; render(); }).catch(() => { RP_LOAD = false; }); }
    if (!RP) { if (!RP_LOAD) { RP_LOAD = true; API.me('report_list').then(l => { RP = l; RP_AT = Date.now(); RP_LOAD = false; render(); }).catch(e => { RP = []; RP_LOAD = false; toast(e.message, 'err'); render(); }); } return pageHead('', 'التقارير الأسبوعية', '') + `<div class="card empty"><span class="spin"></span></div>`; }
    const lead = 'تقرير شامل عن أنشطة المسارات يُكتب كل أسبوع تلقائيًا، ويصلك في تليجرام إن رُبطت محادثتك بالبوت.';
    if (!RP.length) return pageHead('', 'التقارير الأسبوعية', lead) + `<div class="card empty">${svg('sheet')}<h3>لا تقارير بعد</h3><p>يصل أول تقرير في موعده الأسبوعي.</p></div>`;
    const open = RP_OPEN || RP[0].id;
    return pageHead('', 'التقارير الأسبوعية', lead) + `<div class="stack">${RP.map(r => `<article class="card report">
      <button class="row" type="button" style="width:100%;text-align:start" data-act="rp-toggle" data-id="${r.id}" aria-expanded="${r.id === open}"><span class="tile" style="--tc:var(--brand)">${svg('sheet')}</span><span class="col" style="flex:1;min-width:0"><b style="font-family:var(--fd);font-weight:500;font-size:19px;color:var(--ink)">${esc(r.title)}</b><span class="xs faint">${gLong(isoOf(new Date(r.at)))} · ${ago(r.at)}</span></span>${svg(r.id === open ? 'down' : 'back')}</button>
      ${r.id === open ? `<div class="md">${md(r.text)}</div>` : ''}</article>`).join('')}</div>`;
  }
};

/* ---------- لوحة الأوامر ---------- */
let CMD = null;
function openCmd() {
  CMD = { q: '', i: 0, items: [] };
  const prevFocus = document.activeElement;
  $('#layer').innerHTML = `<div class="scrim" data-act="close"></div><div class="cmd" role="dialog" aria-modal="true" aria-label="بحث وانتقال"><div class="q">${svg('search')}<input id="cmd-q" placeholder="ابحث عن نشاط أو مقرر أو مسار، أو اكتب «جديد»" autocomplete="off" role="combobox" aria-controls="cmd-res" aria-expanded="true"><kbd>Esc</kbd></div><div class="res" id="cmd-res" role="listbox"></div></div>`;
  LAYER = { prevFocus };
  cmdUpdate(); setTimeout(() => $('#cmd-q').focus(), 20);
}
function cmdItems(q) {
  const n = normAr(q.trim()), out = [];
  const pages = [['home', 'الرئيسية', 'home'], ['timeline', 'المنظور الزمني', 'tl']].concat(isAdmin() ? [['calendar', 'تقويم جوجل', 'gcal'], ['bot', 'بوت التذكيرات', 'bot'], ['accounts', 'الحسابات', 'key']] : [['t/' + myTrack(), 'خطة الفصل', 'table']]);
  const acts = [...(isAdmin() || canEdit(myTrack()) ? [{ g: 'إجراءات', l: 'نشاط جديد', ic: 'plus', run: () => openAct(isAdmin() ? '' : myTrack()) }] : []), { g: 'إجراءات', l: P.theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن', ic: P.theme === 'dark' ? 'sun' : 'moon', run: toggleTheme }];
  const m = s => !n || normAr(s).includes(n);
  acts.filter(a => m(a.l) || (n && 'جديد'.includes(n))).forEach(a => out.push(a));
  pages.filter(p => m(p[1])).forEach(p => out.push({ g: 'الصفحات', l: p[1], ic: p[2], run: () => go(p[0]) }));
  D.tracks.filter(t => m(t.name) || m(t.full || '')).forEach(t => out.push({ g: 'المسارات', l: t.full || t.name, img: t.id, run: () => go('t/' + t.id) }));
  if (n.length >= 2) {
    allActs().filter(a => m(a.title) || m(a.idea || '') || m((a.who || []).join(' '))).sort(sortA).slice(0, 12).forEach(a => out.push({ g: 'الأنشطة', l: a.title, ic: typeOf(a.type)[0], mt: `${T(a.t).name} · ${gDay(a.d)}`, run: () => openAct(a.t, a.id) }));
    const seen = new Set();
    D.tracks.forEach(t => daysOf(t.id).forEach(d => { if (d.c && (m(d.c) || m(d.q || '') || m(d.ax || '')) && !seen.has(t.id + d.c) && seen.size < 10) { seen.add(t.id + d.c); out.push({ g: 'المقررات', l: d.c, ic: 'table', mt: `${T(t.id).name} · ${gDay(d.d)}`, run: () => { go('t/' + t.id); setTimeout(() => { const el = $('#d-' + d.d); if (el) el.scrollIntoView({ block: 'center' }); }, 120); } }); } }));
  }
  return out;
}
function cmdUpdate() {
  CMD.items = cmdItems(CMD.q); CMD.i = Math.min(CMD.i, Math.max(0, CMD.items.length - 1));
  let g = '', h = '';
  CMD.items.forEach((it, i) => { if (it.g !== g) { g = it.g; h += `<div class="grp">${g}</div>`; } h += `<button class="it" type="button" role="option" id="ci-${i}" aria-selected="${i === CMD.i}" data-act="cmd-run" data-i="${i}">${it.img ? logoImg(it.img) : svg(it.ic)}<span class="tx ellip">${esc(it.l)}</span>${it.mt ? `<span class="mt">${esc(it.mt)}</span>` : ''}</button>`; });
  $('#cmd-res').innerHTML = h || `<p class="muted sm" style="padding:16px">لا نتائج.</p>`;
  $('#cmd-q').setAttribute('aria-activedescendant', 'ci-' + CMD.i);
  const sel = $('#ci-' + CMD.i); if (sel) sel.scrollIntoView({ block: 'nearest' });
}
function cmdRun(i) { const it = CMD && CMD.items[i]; if (!it) return; closeLayer(); it.run(); }

/* ---------- الأحداث ---------- */
const H = {
  close: closeLayer, theme: () => { closeLayer(); toggleTheme(); }, cmd: openCmd, usermenu: userMenu, more: userMenu, logout: () => { closeLayer(); logout(); }, mypass: passDialog,
  retry: () => boot(), 'demo-reset': () => { if (window.DEMO) window.DEMO.reset(); },
  lgwho: el => { LG.who = el.dataset.id; LG.err = ''; render(); }, lgother: () => { LG.other = !LG.other; LG.err = ''; render(); },
  openact: el => { if (SUPPRESS) return; openAct(el.dataset.track, el.dataset.id); },
  newact: el => openAct(el.dataset.track || '', null, { date: el.dataset.date, type: el.dataset.type, track: el.dataset.track, title: el.dataset.title }),
  'f-meet': async () => {
    readF(); if (!F || !F.id) return; const f = F; f.meetBusy = true; drawAct(true);
    try { const r = await API.me('meet_create', f.tid, f.id); const p = planOf(f.tid), i = p.acts.findIndex(a => a.id === f.id); if (i >= 0) p.acts[i] = r.act; p.rev = r.rev; D.revs[f.tid] = r.rev; if (F === f) { F.meet = r.act.meet; F.meetBusy = false; drawAct(true); } render(); toast('أُنشئ رابط ميت'); }
    catch (e) { if (F === f) { F.meetBusy = false; drawAct(true); } toast(e.message, 'err'); }
  },
  'f-meet-del': async el => {
    if (!armed(el, 'تأكيد إزالة الرابط')) return; const f = F;
    try { const r = await API.me('meet_unlink', f.tid, f.id); const p = planOf(f.tid), i = p.acts.findIndex(a => a.id === f.id); if (i >= 0) p.acts[i] = r.act; p.rev = r.rev; D.revs[f.tid] = r.rev; if (F === f) { readF(); delete F.meet; drawAct(true); } render(); toast('أُزيل الرابط من النشاط'); } catch (e) { toast(e.message, 'err'); }
  },
  'f-copy': el => { const v = el.dataset.v; const ok = () => toast('نُسخ الرابط'); try { navigator.clipboard.writeText(v).then(ok, () => toast(v)); } catch (e) { toast(v); } },
  go: el => { location.hash = '#' + el.dataset.v; },
  'tk-new': el => taskDialog(el.dataset.track || (isAdmin() ? D.tracks[0].id : myTrack())),
  'tk-edit': el => taskDialog(el.dataset.track, el.dataset.id),
  'tk-who': el => { readTK(); const w = el.dataset.v; TK.who = (TK.who || []).includes(w) ? TK.who.filter(x => x !== w) : (TK.who || []).concat(w); drawTask(); },
  'tk-tgl': () => { readTK(); TK.done = !TK.done; drawTask(); },
  'tk-save': () => { readTK(); if (!TK.title.trim()) { toast('اكتب المهمة', 'err'); return; } const k = TK, patch = { title: k.title.trim(), d: k.d || '', who: k.who || [] }; if (!k.isNew) Object.assign(patch, { id: k.id, done: !!k.done }); closeLayer(); saveTask(k.tid, patch).then(r => toast(k.isNew ? 'أُضيفت المهمة' : 'حُفظت المهمة')).catch(() => {}); },
  'tk-del': async el => { if (!armed(el, 'تأكيد الحذف')) return; const k = TK; closeLayer(); const p = planOf(k.tid), i = p.tasks.findIndex(x => x.id === k.id), prev = p.tasks[i]; p.tasks.splice(i, 1); render(); try { const r = await API.me('task_del', k.tid, k.id); p.rev = r.rev; D.revs[k.tid] = r.rev; toast('حُذفت المهمة'); } catch (e) { p.tasks.splice(i, 0, prev); render(); toast(e.message, 'err'); } },
  'tk-done': el => { saveTask(el.dataset.track, { id: el.dataset.id, done: true }).then(() => toast('أُنجزت المهمة', '', () => saveTask(el.dataset.track, { id: el.dataset.id, done: false }))).catch(() => {}); },
  'bot-menu': async () => { try { const r = await API.me('tg_menu'); toast('حُدّثت قائمة أوامر البوت في تليجرام (' + r.n + ')'); } catch (e) { toast(e.message, 'err'); } },
  'bs-atasks': async () => { const v = !(BS.settings.adminTasks !== false); try { await API.me('settings_save', JSON.stringify({ adminTasks: v })); BS.settings.adminTasks = v; render(); } catch (e) { toast(e.message, 'err'); } },
  'f-cancel': closeAct, 'f-day': el => { readF(); F.d = el.dataset.v; drawAct(true); },
  'al-seen': () => alertsSeen(true),
  done: el => { const tid = el.dataset.track, a = planOf(tid).acts.find(x => x.id === el.dataset.id); if (!a) return; const v = !a.done; saveAct(tid, { id: a.id, done: v }).then(() => toast(v ? `تم تنفيذ ${qt(a.title)}` : 'أُعيد إلى الخطة', '', () => saveAct(tid, { id: a.id, done: !v }))).catch(() => {}); },
  'f-track': el => { readF(); F.tid = el.dataset.v; drawAct(true); }, 'f-type': el => { readF(); F.type = el.dataset.v; drawAct(true); },
  'f-who': el => { readF(); const w = el.dataset.v; F.who = (F.who || []).includes(w) ? F.who.filter(x => x !== w) : (F.who || []).concat(w); drawAct(true); },
  'f-rem': () => { readF(); const cur = F.rem === true || (F.rem !== false && (D.remindTypes || []).includes(F.type)); F.rem = !cur; drawAct(true); },
  'f-cal': () => { readF(); F.calOn = !F.calOn; drawAct(true); }, 'f-done': () => { readF(); F.done = !F.done; drawAct(true); },
  'f-save': saveF, 'f-del': () => { if (!F.confirmDel) { readF(); F.confirmDel = true; drawAct(true); return; } const { tid, id } = F; if (F.dock) F = null; else closeLayer(); delAct(tid, id); },
  ed: el => inlineEdit(el), dayedit: el => dayEdit(el.dataset.id, el.dataset.n, el.dataset.d),
  'de-save': el => { const p = {}; ['ax', 'c', 'q', 'r', 'ev', 'p'].forEach(k => p[k] = $('#de-' + k).value.trim()); closeLayer(); saveDay(el.dataset.id, el.dataset.n, el.dataset.d, p); },
  tblax: el => { P.tbl.ax = el.dataset.v; savePrefs(); render(); }, tblempty: () => { P.tbl.hideEmpty = !P.tbl.hideEmpty; savePrefs(); render(); }, tblclear: () => { TB.q = ''; P.tbl.ax = ''; P.tbl.hideEmpty = false; render(); },
  semmenu: el => semMenu(el.dataset.id, el.dataset.n), semimport: el => semImport(el.dataset.id, el.dataset.n), semnew: el => semNew(el.dataset.id, el.dataset.n),
  semdel: async el => { if (!armed(el, 'اضغط مرة ثانية لتأكيد الحذف')) return; closeLayer(); try { await API.me('sem_del', el.dataset.id, el.dataset.n); delete planOf(el.dataset.id).sems[el.dataset.n]; render(); toast('حُذف جدول الفصل'); } catch (e) { toast(e.message, 'err'); } },
  'si-check': async el => {
    const url = $('#si-url').value.trim(), out = $('#si-out'); out.innerHTML = '<span class="spin"></span>';
    try { const r = await API.me('sem_import', el.dataset.id, el.dataset.n, url, true); const ds = r.days, ex = ds.filter(d => d.ev).map(d => d.ev);
      SI = { id: el.dataset.id, n: el.dataset.n, days: ds, url };
      out.innerHTML = `<div class="ctx"><b>${ds.length} يومًا · ${weeksOf(ds).length} أسبوعًا</b><span>من ${gDay(ds[0].d)} إلى ${gDay(ds[ds.length - 1].d)}</span><span>${ds.filter(d => d.c).length} يوم فيه مقرر${ex.length ? ' · ' + esc(ex.join('، ')) : ''}</span></div><button class="btn pri" type="button" style="margin-top:10px" data-act="si-save">احفظ الجدول</button>`;
    } catch (e) { out.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
  },
  'si-save': () => semPut(SI.id, SI.n, SI.days, SI.url),
  'sn-save': el => { const a = $('#sn-a').value, b = $('#sn-b').value; if (!a || !b) return toast('حدّد البداية والنهاية', 'err'); if (b < a) return toast('تاريخ النهاية قبل البداية', 'err'); const s0 = wkStart(a), days = []; for (let d = a; d <= b; d = add(d, 1)) days.push({ d, h: hijri(d), w: Math.floor(diffD(d, s0) / 7) + 1 }); semPut(el.dataset.id, el.dataset.n, days, ''); },
  members: el => membersSheet(el.dataset.id),
  'mb-add': el => { readMB(); MB.push({ n: '', e: '' }); drawMembers(el.dataset.id, true); },
  'mb-del': el => { readMB(); MB.splice(+el.dataset.i, 1); if (!MB.length) MB.push({ n: '', e: '' }); drawMembers($('[data-act="mb-save"]').dataset.id); },
  'mb-save': el => {
    readMB(); const bad = MB.find(m => m.n && m.e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.e));
    if (bad) return toast('البريد غير صحيح: ' + bad.e, 'err');
    const L = [], E = {}; MB.forEach(m => { if (m.n && !L.includes(m.n)) { L.push(m.n); if (m.e) E[m.n] = m.e.toLowerCase(); } });
    closeLayer(); trackSave(el.dataset.id, { members: L, emails: E }).then(() => toast('حُفظ الفريق')).catch(() => {});
  },
  'mt-admins': async () => { const v = ($('#mt-admins').value || '').split(/[\s,،]+/).map(x => x.trim()).filter(Boolean); try { const r = await API.me('settings_save', JSON.stringify({ meetAdmins: v })); D.settings = r.settings; toast('حُفظ بريد الإدارة'); render(); } catch (e) { toast(e.message, 'err'); } },
  toggleedit: el => { const t = T(el.dataset.id); trackSave(t.id, { canEdit: !t.canEdit }).then(r => toast(r.canEdit ? `فُتح تعديل الخطة لفريق ${t.name}` : `أُغلق تعديل الخطة لفريق ${t.name}`)).catch(() => {}); },
  grant: el => { const t = T(el.dataset.id); trackSave(t.id, { canEdit: true }).then(() => toast(`فُتح تعديل الخطة لفريق ${t.name}`)).catch(() => {}); },
  askedit: () => openDialog(`<h3>طلب فتح تعديل الخطة</h3><p class="muted sm">يصل الطلب إلى الإدارة في المنصة${D.tg ? ' وفي تليجرام' : ''}.</p><div class="field"><label for="ae-n">ماذا تريدون تعديله؟ (اختياري)</label><textarea class="inp" id="ae-n" rows="3" placeholder="مثل: نضيف مسابقة في الأسبوع الثالث"></textarea></div><div class="row"><button class="btn pri" type="button" data-act="ae-send">أرسل الطلب</button><button class="btn" type="button" data-act="close">إلغاء</button></div>`),
  'ae-send': async () => { const note = $('#ae-n').value; closeLayer(); try { await API.me('edit_request', note); T(myTrack()).editReq = { at: Date.now(), by: D.me.name, note }; render(); toast('أُرسل الطلب إلى الإدارة'); } catch (e) { toast(e.message, 'err'); } },
  hbw: el => { const n = +el.dataset.n; HB.ws = n ? add(HB.ws, n) : focusWeek(); render(); },
  mweek: el => { const k = el.dataset.id + '|' + el.dataset.n; if (el.dataset.v === 'now') delete MW[k]; else MW[k] = +el.dataset.v; render(); const pg = $('.wpager'); if (pg) window.scrollTo(0, pg.getBoundingClientRect().top + scrollY - 70); },
  tlweek: el => { P.tl.range = 'week'; P.tl.anchor = el.dataset.date; if (isAdmin() && el.dataset.id) { P.tl.tracks = [el.dataset.id]; P.tl.tmp = true; } savePrefs(); go('timeline'); },
  tlrange: el => { P.tl.range = el.dataset.v; savePrefs(); VIEWS.timeline.sc = 0; render(); },
  tlnav: el => { const n = +el.dataset.n, rg = P.tl.range, a = rg !== 'week' && rg !== 'sem' ? tlSpan().from : tlAnchor(); P.tl.anchor = !n ? TODAY : rg === 'week' ? add(a, 7 * n) : addMon(monStart(a), (rg === 'q3' ? 3 : 1) * n); savePrefs(); VIEWS.timeline.sc = 0; render(); },
  tltrack: el => { const v = el.dataset.v; if (!v) P.tl.tracks = []; else { const s = new Set(P.tl.tracks || []); s.has(v) ? s.delete(v) : s.add(v); P.tl.tracks = [...s]; } savePrefs(); render(); },
  dayview: el => { const d = el.dataset.date, ids = tlTracks(); const L = ids.flatMap(id => actsOf(id).filter(a => a.d === d).map(a => [a, id])).sort((x, y) => sortA(x[0], y[0])); openSheet(`<b style="font-family:var(--fd);font-weight:500;font-size:19px">${gLong(d)}</b>`, `<div class="col" style="gap:8px">${L.map(([a, id]) => evChip(a, id, { track: ids.length > 1, noDrag: true })).join('')}</div>`); },
  'cal-f': el => { P.cal[el.dataset.k] = el.dataset.v; CS.sel.clear(); savePrefs(); render(); }, 'cal-meet': () => { P.cal.meet = !P.cal.meet; CS.sel.clear(); savePrefs(); render(); },
  'cal-sel': el => { const k = el.dataset.k; CS.sel.has(k) ? CS.sel.delete(k) : CS.sel.add(k); render(); },
  'cal-selw': el => { const w = el.dataset.w, ks = $$('.calrow [data-act="cal-sel"]').map(b => b.dataset.k).filter(k => { const [t, id] = k.split('|'); const a = planOf(t).acts.find(x => x.id === id); return a && wkStart(a.d) === w; }); const all = ks.every(k => CS.sel.has(k)); ks.forEach(k => all ? CS.sel.delete(k) : CS.sel.add(k)); render(); },
  'cal-selall': () => { const ks = $$('.calrow [data-act="cal-sel"]').map(b => b.dataset.k); const all = ks.length && ks.every(k => CS.sel.has(k)); ks.forEach(k => all ? CS.sel.delete(k) : CS.sel.add(k)); render(); },
  'cal-clear': () => { CS.sel.clear(); render(); }, 'cal-push': () => calPush(true), 'cal-pull': () => calPush(false), 'cal-pick': calPick,
  'cp-set': el => calSet(el.dataset.id), 'cp-new': () => calSet('new:' + ($('#cp-new').value.trim() || 'أنشطة المسارات')),
  'bot-refresh': () => { BS = null; BS_LOAD = false; render(); },
  'bot-token': async () => { const v = $('#bt-tok').value.trim(); if (!v) return; setSync('busy'); try { BS = await API.me('tg_token', v); setSync('ok'); toast('رُبط البوت ✓'); boot(true); render(); } catch (e) { setSync('ok'); toast(e.message, 'err'); } },
  'bot-remind': async el => { const t = BS.tracks.find(x => x.id === el.dataset.id); try { await trackSave(t.id, { remind: !t.remind }); t.remind = !t.remind; render(); } catch (e) {} },
  'bot-test': async el => { try { await API.me('tg_test', el.dataset.id); toast('أُرسلت رسالة التجربة'); } catch (e) { toast(e.message, 'err'); } },
  'bot-unlink': async el => { if (!armed(el, 'تأكيد إلغاء الربط')) return; try { BS = await API.me('tg_assign', el.dataset.chat, ''); toast('أُلغي الربط'); boot(true); } catch (e) { toast(e.message, 'err'); } },
  'bot-now': async () => { try { const r = await API.me('remind_now'); toast(r.sent ? (r.sent === 1 ? 'أُرسل تذكير واحد' : r.sent === 2 ? 'أُرسل تذكيران' : `أُرسلت ${r.sent} ${r.sent <= 10 ? 'تذكيرات' : 'تذكيرًا'}`) : 'لا شيء مستحق الآن'); if (r.errs && r.errs.length && r.errs[0] !== 'لا بوت') toast(r.errs[0], 'err'); BS = null; BS_LOAD = false; render(); } catch (e) { toast(e.message, 'err'); } },
  'bs-type': el => { const s = BS.settings, v = el.dataset.v; s.remindTypes = s.remindTypes.includes(v) ? s.remindTypes.filter(x => x !== v) : s.remindTypes.concat(v); keepTpl(); render(); },
  'bs-digest': () => { BS.settings.digest = Object.assign({}, BS.settings.digest, { on: !BS.settings.digest.on }); keepTpl(); render(); },
  'bs-pause': async () => { const v = !BS.settings.groupsPaused; try { await API.me('settings_save', JSON.stringify({ groupsPaused: v })); BS.settings.groupsPaused = v; if (D.settings) D.settings.groupsPaused = v; toast(v ? 'أُوقف الإرسال في المجموعات' : 'عاد الإرسال في المجموعات'); render(); } catch (e) { toast(e.message, 'err'); } },
  'bs-chg': () => { BS.settings.notifyChanges = !BS.settings.notifyChanges; keepTpl(); render(); }, 'bs-adig': () => { BS.settings.adminDigest = !BS.settings.adminDigest; keepTpl(); render(); },
  'bs-ph': el => { const ta = LAST_TA && document.contains(LAST_TA) ? LAST_TA : $('#bs-d3'); const s = ta.selectionStart || ta.value.length; ta.value = ta.value.slice(0, s) + el.dataset.v + ta.value.slice(ta.selectionEnd || s); ta.focus(); ta.selectionStart = ta.selectionEnd = s + el.dataset.v.length; updTgPrev(); },
  'bs-save': botSaveSettings, tgwatch: (el, e) => tgOpen(el, e), tglink: (el, e) => tgOpen(el, e),
  'acc-edit': el => accEdit(el.dataset.id), 'ac-dis': el => el.setAttribute('aria-checked', el.getAttribute('aria-checked') !== 'true'),
  'ac-save': async el => { const uid = el.dataset.id, dis = $('[data-act="ac-dis"]'); const body = { uid: uid || undefined, name: $('#ac-n').value, user: $('#ac-u').value, role: $('#ac-r').value, track: $('#ac-t').value, disabled: dis ? dis.getAttribute('aria-checked') === 'true' : false };
    try { const r = await API.me('acc_save', JSON.stringify(body)); AC = null; if (r.pass) showPass(r.acc.name, r.acc.user, r.pass); else { closeLayer(); toast('حُفظ الحساب'); } render(); } catch (e) { toast(e.message, 'err'); } },
  'ac-del': async el => { if (!armed(el, 'تأكيد الحذف')) return; try { await API.me('acc_del', el.dataset.id); AC = null; closeLayer(); toast('حُذف الحساب'); render(); } catch (e) { toast(e.message, 'err'); } },
  'acc-reset': async el => { if (!armed(el, 'تأكيد: يخرج الفريق من جلساته')) return; const a = AC.find(x => x.uid === el.dataset.id); try { const r = await API.me('acc_reset', a.uid); if (r.token) { TOKEN = r.token; LS.set(NS + 'tok', TOKEN); } showPass(a.name, a.user, r.pass); } catch (e) { toast(e.message, 'err'); } },
  'pw-save': async () => { try { const r = await API.me('pass', $('#pw-o').value, $('#pw-n').value); TOKEN = r.token; LS.set(NS + 'tok', TOKEN); closeLayer(); toast('غُيّرت كلمة المرور'); } catch (e) { toast(e.message, 'err'); } },
  copy: async el => { try { await navigator.clipboard.writeText(el.dataset.v); toast('نُسخ'); } catch (e) { toast('انسخها يدويًا', 'err'); } },
  'cmd-run': el => cmdRun(+el.dataset.i),
  'rp-toggle': el => { RP_OPEN = RP_OPEN === el.dataset.id || (!RP_OPEN && RP[0].id === el.dataset.id) ? '-' : el.dataset.id; render(); }
};
// تأكيد بضغطتين للإجراءات التي لا رجعة فيها
function armed(el, label) {
  if (el.dataset.armed) return true;
  el.dataset.armed = '1'; const old = el.innerHTML; el.innerHTML = esc(label); el.classList.add('danger');
  setTimeout(() => { if (document.contains(el)) { delete el.dataset.armed; el.innerHTML = old; } }, 4000);
  return false;
}
let SI = null, LAST_TA = null;
function tgOpen(el, e) { if (CFG.demo && window.DEMO) { e.preventDefault(); window.DEMO.simJoin(el.getAttribute('href')); toast('تجربة: كأنك اخترت المجموعة في تليجرام…'); } watchLink(); }
function keepTpl() { if (!BS || !BS.settings) return; const a = $('#bs-d3'), b = $('#bs-d1'), h = $('#bs-h'); if (a) BS.settings.tpl = { d3: a.value, d1: b.value }; if (h) BS.settings.remindHour = +h.value; }
function updTgPrev() { const p = $('#bs-prev'); if (p && BS) p.innerHTML = tgPreview(BS.settings, 'd3') + tgPreview(BS.settings, 'd1'); }
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const k = el.dataset.act, f = H[k]; if (!f) return;
  if (el.tagName === 'A' && (k === 'tgwatch' || k === 'tglink')) { f(el, e); return; }   // يفتح الرابط ويبدأ المتابعة
  if (el.tagName === 'A' && k === 'tlweek') e.preventDefault();
  if (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && k !== 'tblq')) return;
  if (k === 'tblq') return;
  f(el, e);
});
document.addEventListener('change', e => { const el = e.target; if (el.id === 'ac-r' && $('#ac-tf')) $('#ac-tf').hidden = el.value === 'admin'; if (el.dataset.act === 'bot-assign' && el.value) API.me('tg_assign', el.dataset.chat, el.value).then(s => { BS = s; toast('رُبطت المجموعة ✓'); boot(true); }).catch(x => toast(x.message, 'err')); if (el.id === 'f-d' && F) { readF(); drawAct(true); } });
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.act === 'tblq') { TB.q = el.value; clearTimeout(TB.t); TB.t = setTimeout(() => { const pos = el.selectionStart; render(); const n = $('[data-act="tblq"]'); if (n) { n.focus(); n.selectionStart = n.selectionEnd = pos; } }, 180); }
  if (el.id === 'cmd-q') { CMD.q = el.value; CMD.i = 0; cmdUpdate(); }
  if (el.dataset.act === 'bs-tpl') updTgPrev();
});
document.addEventListener('focusin', e => { if (e.target.dataset && e.target.dataset.act === 'bs-tpl') LAST_TA = e.target; });
document.addEventListener('submit', e => { if (e.target.id === 'lgf') { e.preventDefault(); doLogin(($('#lg-u').value || '').trim(), $('#lg-p').value); } });
document.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.key === 'ك')) { if (D) { e.preventDefault(); CMD ? closeLayer() : openCmd(); } return; }
  if (CMD) {
    if (e.key === 'ArrowDown') { e.preventDefault(); CMD.i = Math.min(CMD.items.length - 1, CMD.i + 1); cmdUpdate(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); CMD.i = Math.max(0, CMD.i - 1); cmdUpdate(); }
    else if (e.key === 'Enter') { e.preventDefault(); cmdRun(CMD.i); }
    else if (e.key === 'Escape') { e.preventDefault(); closeLayer(); }
    return;
  }
  if (e.key === 'Escape' && $('#layer').innerHTML) { e.preventDefault(); closeLayer(); return; }
  if (e.key === 'Escape' && F && F.dock) { e.preventDefault(); closeAct(); return; }
  if (e.key === 'Tab' && $('#layer').innerHTML) trapFocus(e);
  if (e.key === 'Enter' && (e.target.id === 'pw-n' || e.target.id === 'pw-o')) { e.preventDefault(); const b = $('[data-act="pw-save"]'); if (b) b.click(); return; }
  if (e.key === 'Enter' && F && e.target.id === 'f-whonew') { e.preventDefault(); const v = e.target.value.trim(); if (v) { readF(); F.who = [...new Set((F.who || []).concat(v))]; drawAct(true); setTimeout(() => $('#f-whonew') && $('#f-whonew').focus(), 50); } return; }
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && F) { e.preventDefault(); saveF(); return; }
  if ((e.key === 'Enter' || e.key === ' ') && !typing && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); return; }
  if (typing || !D || $('#layer').innerHTML || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === '/') { e.preventDefault(); openCmd(); }
  else if (e.key === 'n' || e.key === 'ى') { const r = route(); const tid = r.name === 't' ? r.a : isAdmin() ? '' : myTrack(); if (!tid || canEdit(tid)) { e.preventDefault(); openAct(tid); } }
  else if (e.key === 't' || e.key === 'ف') { if (route().name === 'timeline') { P.tl.anchor = ''; savePrefs(); render(); } }
});
let MQ = isMob(), WQ = innerWidth >= WIDE_Q; addEventListener('resize', () => { const m = isMob(), w = innerWidth >= WIDE_Q; if (m !== MQ || w !== WQ) { MQ = m; WQ = w; if (F && F.dock) { readF(); F.dock = false; render(); drawAct(); return; } if (D && !$('#layer').innerHTML) render(); } });

/* ---------- التشغيل ---------- */
(async function start() {
  applyTheme();
  loadFonts();
  if (CFG.demo && window.DEMO) await window.DEMO.ready();
  if (!TOKEN) { render(); return; }
  const c = LS.get(NS + 'boot', null);
  if (c) { setBoot(c); render(); }
  else render();
  boot(!!c);
})();
