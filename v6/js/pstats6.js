/* ================= البرنامج بالأرقام: صفحة إحصاءات لكل برنامج (للمشرف) =================
   من بيانات موجودة: سجل الاستخدام (stat_summary) ومنشورات القناة (tg_queue). أعداد فقط، بلا محتوى التصاميم.
   كل رقم يقارَن بالمدة التي قبله، والقوالب الأكثر استعمالاً بصورها، وما لم يُستعمل منها، وأيام النشاط. */
const PS_TYPES = { slide: 'عروض وشرائح', study: 'مواد تعليمية' };
function psTypeName(id) { const t = TYPES.find(function (x) { return x.id === id; }); return t ? t.name : PS_TYPES[id] || 'أخرى'; }
function psDelta(cur, prev) {
  if (!prev && !cur) return el('small', { class: 'psd', text: '—' });
  if (!prev) return el('small', { class: 'psd up', text: 'جديد' });
  const d = Math.round((cur - prev) / prev * 100);
  return el('small', { class: 'psd ' + (d > 0 ? 'up' : d < 0 ? 'down' : ''), title: 'مقارنة بالمدة السابقة (' + prev + ')', text: (d > 0 ? '▲ ' : d < 0 ? '▼ ' : '') + Math.abs(d).toLocaleString('ar') + '٪' });
}
async function aProgStats(body) {
  const ps = myAdminProgs(); let prog = (V6.prog && ps.some(function (p) { return p.id === V6.prog.id; })) ? V6.prog.id : (ps[0] || {}).id, days = 30;
  aHead(body, 'البرنامج بالأرقام', 'ما صُمّم ونُشر في برنامجك، وأي القوالب يحتاجها الفريق أكثر. أعداد فقط، بلا محتوى التصاميم.', [
    segOf([['30', '٣٠ يوماً'], ['90', '٩٠ يوماً'], ['365', 'سنة']], '30', function (v) { days = +v; load(); }),
    ps.length > 1 ? progSelect(prog, false, function (v) { prog = v; load(); }) : null]);
  const box = el('div', { class: 'pstats' }); body.appendChild(box);
  async function load() {
    box.innerHTML = ''; const sk = loading(box);
    let s, s2, posts;
    try { [s, s2, posts] = await Promise.all([API6.me('stat_summary', days, prog), API6.me('stat_summary', Math.min(365, days * 2), prog), API6.me('tg_queue', prog).catch(function () { return []; })]); }
    catch (e) { sk.remove(); box.appendChild(el('p', { class: 'err', text: e.message })); return; }
    sk.remove();
    const P = V6.bundle.programs.find(function (p) { return p.id === prog; }) || {};
    const prevOf = function (k) { return Math.max(0, ((s2.ev || {})[k] || 0) - ((s.ev || {})[k] || 0)); };
    const t0 = Date.now() - days * 864e5, tPrev = Date.now() - 2 * days * 864e5;
    const sent = (posts || []).filter(function (x) { return x.status === 'sent'; });
    const sentNow = sent.filter(function (x) { return (x.sentAt || x.when || x.at) >= t0; }), sentPrev = sent.filter(function (x) { const t = x.sentAt || x.when || x.at; return t >= tPrev && t < t0; });
    const queued = (posts || []).filter(function (x) { return x.status === 'queued'; }).length;
    const K = function (label, n, prev, sub) { return el('div', { class: 'kpi card' }, [el('span', { class: 'tiny', text: label }), el('div', { class: 'psrow' }, [el('b', { text: Number(n || 0).toLocaleString('ar') }), prev === null ? null : psDelta(n || 0, prev)]), el('small', { class: 'muted', text: sub })]); };
    box.appendChild(el('div', { class: 'pshead' }, [P.color ? el('i', { class: 'psdot', style: 'background:' + P.color }) : null, el('b', { text: P.name || prog }), el('span', { class: 'muted small', text: ' · آخر ' + (days === 365 ? 'سنة' : days.toLocaleString('ar') + ' يوماً') })]));
    box.appendChild(el('div', { class: 'kpis' }, [
      K('نُشر في القناة', sentNow.length, sentPrev.length, queued ? queued.toLocaleString('ar') + ' منشوراً مجدولاً' : 'منشوراً'),
      K('التنزيلات', s.ev['export'] || 0, prevOf('export'), 'تصميماً نُزّل'),
      K('العروض المقدَّمة', s.ev.present || 0, prevOf('present'), 'مرة عُرضت شرائح'),
      K('فتح القوالب', s.ev.open || 0, prevOf('open'), 'مرة'),
      K('المستخدمون النشطون', s.nUsers, null, 'من ' + Number(s.totalAccounts || 0).toLocaleString('ar') + ' حساباً'),
      K('التصاميم المحفوظة', s.saved, null, Number(s.shared || 0).toLocaleString('ar') + ' منها مشاركة مع الفريق')
    ]));
    // القوالب الأكثر استعمالاً بصورها (لبرنامجك الحالي)، وحسب النوع
    const top = topOf(s.tpl, 8).filter(function (r) { return TEMPLATES.some(function (t) { return t.id === r[0]; }); });
    const sameProg = V6.prog && V6.prog.id === prog, T = sameProg ? (tracksOf()[0] || null) : null;
    const topCard = el('div', { class: 'card' }, [el('h3', { text: 'القوالب الأكثر استعمالاً' })]);
    if (!top.length) topCard.appendChild(el('p', { class: 'empty', text: 'لا استعمال بعد في هذه المدة' }));
    else if (T) topCard.appendChild(el('div', { class: 'pstpls' }, top.map(function (r, i) { const tpl = TEMPLATES.find(function (t) { return t.id === r[0]; }); const szk = sizesFor(tpl)[0]; return el('a', { class: 'pstpl', href: '#/e/' + T.id + '/' + tpl.id, title: 'افتح القالب' }, [el('span', { class: 'psrank', text: (i + 1).toLocaleString('ar') }), el('div', { class: 'psth' }, [tplThumb(tpl, T, szk, 150, null, i < 4)]), el('b', { text: tpl.name }), el('small', { class: 'muted', text: r[1].toLocaleString('ar') + ' مرة' })]); })));
    else topCard.appendChild(hbars(top, function (k) { const t = TEMPLATES.find(function (x) { return x.id === k; }); return t ? t.name : k; }));
    box.appendChild(topCard);
    const byType = {}; Object.keys(s.tpl || {}).forEach(function (k) { const t = TEMPLATES.find(function (x) { return x.id === k; }); if (!t) return; byType[t.type] = (byType[t.type] || 0) + s.tpl[k]; });
    // ما لم يُستعمل من قوالب البرنامج في هذه المدة
    const unused = sameProg ? visibleTpls().filter(function (t) { return !(s.tpl || {})[t.id]; }) : [];
    // أيام الأسبوع: التنزيلات والنشاط
    const WD = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'], wd = WD.map(function () { return 0; });
    Object.keys(s.days || {}).forEach(function (k) { const d = new Date(k + 'T12:00:00Z'); wd[d.getUTCDay()] += (s.days[k].exports || 0) + (s.days[k].saves || 0); });
    box.appendChild(el('div', { class: 'grid two' }, [
      el('div', { class: 'card' }, [el('h3', { text: 'حسب نوع التصميم' }), hbars(topOf(byType, 8), psTypeName)]),
      el('div', { class: 'card' }, [el('h3', { text: 'أيام العمل في الأسبوع' }), hbars(WD.map(function (n, i) { return [n, wd[i]]; }).filter(function (r) { return r[1]; }).sort(function (a, b) { return b[1] - a[1]; }), function (k) { return k; })]),
      el('div', { class: 'card' }, [el('h3', { text: 'آخر ما نُشر في القناة' }), sentNow.length ? el('ol', { class: 'pspost' }, sentNow.slice().sort(function (a, b) { return (b.sentAt || b.at) - (a.sentAt || a.at); }).slice(0, 10).map(function (x) {
        return el('li', {}, [el('div', {}, [el('b', { text: x.title || 'منشور' }), el('small', { class: 'muted', text: [x.name, fmtTime(x.sentAt || x.at)].filter(Boolean).join(' · ') })]), x.link ? el('a', { class: 'btn sm ghost', href: x.link, target: '_blank', rel: 'noopener' }, ['افتح']) : null]);
      })) : el('p', { class: 'empty', text: 'لم يُنشر شيء في هذه المدة' })]),
      sameProg ? el('div', { class: 'card' }, [el('h3', { text: 'قوالب لم تُستعمل في هذه المدة' }), unused.length ? el('div', { class: 'row wrapr' }, unused.slice(0, 24).map(function (t) { return el('a', { class: 'chip', href: '#/e/' + (T ? T.id : '') + '/' + t.id, title: psTypeName(t.type), text: t.name }); }).concat(unused.length > 24 ? [el('span', { class: 'muted small', text: '… و' + (unused.length - 24).toLocaleString('ar') + ' غيرها' })] : [])) : el('p', { class: 'empty', text: 'كل القوالب استُعملت. ممتاز.' }),
        el('p', { class: 'tiny', text: 'تساعدك في اختيار ما تبرزه للفريق أو تخفيه من «البرامج والهويات ← القوالب».' })]) : null
    ]));
    box.appendChild(el('div', { class: 'card achart' }, [el('h3', { text: 'التنزيلات يومياً' }), barChart(dayRows(s.days, Math.min(days, 90)), 'exports', 'تنزيل')]));
  }
  load();
}
