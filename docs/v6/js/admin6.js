/* ================= لوحة الإدارة: للمدير العام كل شيء، ولمشرف البرنامج ما يخص برنامجه ================= */
const ADMIN_TABS = [
  ['overview', 'نظرة عامة', 'chart', 0], ['archive', 'أرشيف التصاميم', 'archive', 0], ['accounts', 'الحسابات', 'users', 0], ['programs', 'البرامج والهويات', 'prog', 0],
  ['assets', 'الشعارات والصور', 'image', 0], ['fonts', 'الخطوط', 'font', 0], ['models', 'النماذج والقوالب', 'model', 0], ['reviews', 'مراجعة التصاميم', 'review', 0], ['week', 'أسبوع الفريق', 'chart', 0], ['ai', 'الذكاء الاصطناعي', 'sparkles', 0], ['tg', 'منشورات القناة', 'send', 0], ['feedback', 'البلاغات', 'flag', 0], ['broadcasts', 'رسائل للمستخدمين', 'megaphone', 0],
  ['changelog', 'سجل التحديثات', 'history', 1], ['settings', 'الإعدادات', 'gear', 1], ['audit', 'سجل النشاط', 'shield', 1]
];
function myAdminProgs() { return V6.bundle.programs.filter(function (p) { return isSuper() || (V6.me.role === 'sup' && V6.me.programs.indexOf(p.id) >= 0); }); }
function showAdmin(tab) {
  if (!isAdmin()) return go('#/');
  tab = tab || 'overview';
  const tabs = ADMIN_TABS.filter(function (t) { return !t[3] || isSuper(); });
  if (!tabs.some(function (t) { return t[0] === tab; })) tab = 'overview';
  document.title = 'الإدارة';
  const body = el('div', { class: 'abody', id: 'abody' });
  view(el('div', { class: 'wrap page admin' }, [
    el('div', { class: 'phead' }, [el('span', { class: 'eyebrow', text: isSuper() ? 'المدير العام' : 'مشرف ' + myAdminProgs().map(function (p) { return p.name; }).join('، ') }), H('h1', 'لوحة الإدارة')]),
    el('div', { class: 'alay' }, [
      el('nav', { class: 'anav', 'aria-label': 'أقسام الإدارة' }, tabs.map(function (t) { return el('a', { href: '#/admin/' + t[0], class: t[0] === tab ? 'on' : '' }, [ico(t[2]), el('span', { text: t[1] })]); })),
      body
    ])
  ]));
  ({ reviews: aReviews, week: aWeek, overview: aOverview, archive: aArchive, models: aModels, ai: aAI, tg: aTg, accounts: aAccounts, programs: aPrograms, assets: aAssets, fonts: aFonts, feedback: aFeedback, broadcasts: aBroadcasts, changelog: aChangelog, settings: aSettings, audit: aAudit }[tab])(body);
}
function aHead(body, title, note, acts) { body.appendChild(el('div', { class: 'ahead' }, [el('div', {}, [el('h2', { text: title }), note ? el('p', { class: 'muted small', text: note }) : null]), el('div', { class: 'row wrapr' }, acts || [])])); }
function loading(body) { const s = el('div', { class: 'skel ldbox', style: 'height:180px' }, [loader6('', true)]); body.appendChild(s); return s; }
function progSelect(cur, all, on) {
  const ps = myAdminProgs();
  return el('select', { class: 'inp sm', 'aria-label': 'البرنامج', onchange: function (e) { on(e.target.value); } }, (all ? [el('option', { value: '', text: isSuper() ? 'كل البرامج' : 'برامجي' })] : []).concat(ps.map(function (p) { return el('option', { value: p.id, text: p.name, selected: p.id === cur }); })));
}

/* ---------- نظرة عامة ---------- */
async function aOverview(body) {
  let days = 30, prog = '';
  aHead(body, 'نظرة عامة', 'أعداد الاستخدام فقط، بلا محتوى التصاميم.', [segOf([['7', '٧ أيام'], ['30', '٣٠ يوماً'], ['90', '٩٠ يوماً']], '30', function (v) { days = +v; load(); }), progSelect('', true, function (v) { prog = v; load(); })]);
  const box = el('div'); body.appendChild(box);
  async function load() {
    box.innerHTML = ''; const sk = loading(box);
    let s; try { s = await API6.me('stat_summary', days, prog); } catch (e) { sk.remove(); box.appendChild(el('p', { class: 'err', text: e.message })); return; }
    sk.remove();
    const exp = s.ev['export'] || 0, opens = s.ev.open || 0, saves = s.ev.save || 0, makes = s.ev.make || 0;
    box.appendChild(el('div', { class: 'kpis' }, [
      kpi('التنزيلات', exp, 'تصميماً نُزّل'), kpi('المستخدمون النشطون', s.nUsers, 'من ' + s.totalAccounts + ' حساباً'), kpi('التصاميم المحفوظة', s.saved, s.shared + ' منها مشاركة'),
      kpi('اصنع إعلانك', makes, 'مرة استُعمل'), kpi('فتح القوالب', opens, 'مرة'), kpi('بلاغات مفتوحة', s.fbOpen, s.fbOpen ? 'تحتاج متابعة' : 'لا شيء معلّق', s.fbOpen ? 'warn' : '')
    ]));
    box.appendChild(el('div', { class: 'card achart' }, [el('h3', { text: 'التنزيلات يومياً' }), barChart(dayRows(s.days, days), 'exports', 'تنزيل')]));
    const tplName = function (id) { const t = TEMPLATES.find(function (x) { return x.id === id; }); return t ? t.name : id; };
    const TOOLN = { drag: 'السحب', resize: 'التكبير بالمقابض', inline_edit: 'التعديل بالنقر المزدوج', upload: 'رفع صورة', switch_tpl: 'تبديل القالب', add_text: 'إضافة نص', add_sticker: 'إضافة زخرفة', add_icon: 'إضافة أيقونة', add_img: 'إضافة صورة', add_logo: 'إضافة شعار', ai: 'المساعد الذكي', local: 'اصنع إعلانك (بلا ذكاء)' };
    box.appendChild(el('div', { class: 'grid two' }, [
      el('div', { class: 'card' }, [el('h3', { text: 'أكثر القوالب استعمالاً' }), hbars(topOf(s.tpl, 10), tplName)]),
      el('div', { class: 'card' }, [el('h3', { text: 'أكثر الأدوات استعمالاً' }), hbars(topOf(s.tool, 10).filter(function (x) { return !/^tab_/.test(x[0]); }), function (k) { return TOOLN[k] || k; })]),
      isSuper() && !prog ? el('div', { class: 'card' }, [el('h3', { text: 'النشاط حسب البرنامج' }), hbars(topOf(s.prog, 10), function (k) { const p = V6.bundle.programs.find(function (x) { return x.id === k; }); return p ? p.name : k; })]) : null,
      el('div', { class: 'card' }, [el('h3', { text: 'الأكثر نشاطاً' }), s.top.length ? el('ol', { class: 'toplist' }, s.top.map(function (u) { return el('li', {}, [el('span', { text: u.name }), el('b', { text: String(u.n) })]); })) : el('p', { class: 'empty', text: 'لا نشاط بعد' })])
    ]));
  }
  load();
}
function kpi(label, n, sub, cls) { return el('div', { class: 'kpi card ' + (cls || '') }, [el('span', { class: 'tiny', text: label }), el('b', { text: Number(n || 0).toLocaleString('ar') }), el('small', { class: 'muted', text: sub })]); }
function topOf(o, n) { return Object.keys(o || {}).map(function (k) { return [k, o[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, n); }
function dayRows(days, n) { const out = []; for (let i = n - 1; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5), k = d.toISOString().slice(0, 10); out.push({ k: k, label: d.getDate() + '/' + (d.getMonth() + 1), exports: (days[k] || {}).exports || 0, active: (days[k] || {}).active || 0 }); } return out; }
// أعمدة رفيعة بلون واحد، وشبكة خافتة، وتلميح عند المرور
function barChart(rows, key, unit) {
  const W = 720, Hh = 200, pad = { l: 8, r: 34, t: 10, b: 24 }, max = Math.max(1, Math.max.apply(null, rows.map(function (r) { return r[key]; })));
  const nice = Math.pow(10, Math.floor(Math.log10(max))), top = Math.max(4, Math.ceil(max / nice) * nice), iw = W - pad.l - pad.r, ih = Hh - pad.t - pad.b, bw = iw / rows.length;
  let svg = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" class="bars" role="img" aria-label="رسم بياني">';
  [0, 0.5, 1].forEach(function (f) { const y = pad.t + ih * (1 - f); svg += '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y + '" y2="' + y + '" class="gl"/><text x="' + (W - pad.r + 6) + '" y="' + (y + 4) + '" class="ax">' + Math.round(top * f) + '</text>'; });
  rows.forEach(function (r, i) {
    const h = r[key] / top * ih, x = pad.l + (rows.length - 1 - i) * bw + bw * 0.22, w = Math.max(2, bw * 0.56), y = pad.t + ih - h;
    svg += '<g class="bar"><rect x="' + (x - bw * 0.22) + '" y="' + pad.t + '" width="' + bw + '" height="' + ih + '" fill="transparent"/>' + (h > 0 ? '<path d="M' + x + ',' + (pad.t + ih) + 'V' + (y + Math.min(4, h)) + 'q0,-' + Math.min(4, h) + ' ' + Math.min(4, w / 2) + ',-' + Math.min(4, h) + 'H' + (x + w - Math.min(4, w / 2)) + 'q' + Math.min(4, w / 2) + ',0 ' + Math.min(4, w / 2) + ',' + Math.min(4, h) + 'V' + (pad.t + ih) + 'Z" class="bm"/>' : '') +
      '<title>' + r.label + ': ' + r[key] + ' ' + unit + '</title></g>';
    if (rows.length <= 31 && i % Math.ceil(rows.length / 8) === 0) svg += '<text x="' + (x + w / 2) + '" y="' + (Hh - 6) + '" class="ax" text-anchor="middle">' + r.label + '</text>';
  });
  return el('div', { class: 'chartbox', html: svg + '</svg>' });
}
function hbars(rows, nameFn) {
  if (!rows.length) return el('p', { class: 'empty', text: 'لا بيانات بعد' });
  const max = rows[0][1] || 1;
  return el('div', { class: 'hbars' }, rows.map(function (r) { return el('div', { class: 'hb', title: nameFn(r[0]) + ': ' + r[1] }, [el('span', { class: 'hl', text: nameFn(r[0]) }), el('span', { class: 'ht' }, [el('i', { style: 'width:' + Math.max(2, r[1] / max * 100) + '%' })]), el('b', { text: String(r[1]) })]); }));
}

/* ---------- الحسابات ---------- */
const PERM_N = { social: 'مواقع التواصل', ai: 'المساعد الذكي', upload: 'رفع الصور', fonts: 'رفع الخطوط', slides: 'الشرائح', send: 'الإرسال إلى قناة تليجرام' };
async function aAccounts(body) {
  let list = [], q = '', fprog = '', frole = '';
  aHead(body, 'الحسابات', 'لا تسجيل ذاتي: أنشئ الحساب، وأعطِ صاحبه كلمة المرور المؤقتة، فيختار كلمته عند أول دخول.', [
    el('button', { type: 'button', class: 'btn dark', onclick: function () { accForm(null, reload); } }, [ico('plus'), 'حساب جديد']),
    isSuper() ? el('button', { type: 'button', class: 'btn line', onclick: importLegacy }, [ico('history'), 'نقل حسابات الإصدار الخامس']) : null
  ]);
  const bar = el('div', { class: 'gbar' }, [el('input', { type: 'search', class: 'inp', placeholder: 'ابحث بالاسم أو اسم المستخدم أو البريد…', oninput: function (e) { q = norm(e.target.value); fill(); } }),
    progSelect('', true, function (v) { fprog = v; fill(); }),
    el('select', { class: 'inp sm', 'aria-label': 'الدور', onchange: function (e) { frole = e.target.value; fill(); } }, [['', 'كل الأدوار'], ['super', 'المدير العام'], ['sup', 'مشرف برنامج'], ['user', 'مستخدم'], ['off', 'موقوف']].map(function (o) { return el('option', { value: o[0], text: o[1] }); }))]);
  body.appendChild(bar);
  const tbl = el('div', { class: 'atable' }); body.appendChild(tbl);
  const sk = loading(tbl);
  async function reload() { try { list = await API6.me('acc_list'); fill(); } catch (e) { tbl.innerHTML = ''; tbl.appendChild(el('p', { class: 'err', text: e.message })); } }
  function fill() {
    tbl.innerHTML = '';
    const rows = list.filter(function (a) { return (!q || norm(a.name + ' ' + a.username + ' ' + a.email).indexOf(q) >= 0) && (!fprog || a.programs.indexOf(fprog) >= 0) && (!frole || (frole === 'off' ? a.disabled : a.role === frole && !a.disabled)); });
    tbl.appendChild(el('p', { class: 'tiny', text: rows.length + ' حساباً' }));
    rows.forEach(function (a) {
      const pn = a.programs.map(function (id) { const p = V6.bundle.programs.find(function (x) { return x.id === id; }); return p ? p.name : id; }).join('، ');
      tbl.appendChild(el('div', { class: 'arow' + (a.disabled ? ' off' : '') }, [
        el('span', { class: 'avatar sm', text: String(a.name).replace(/^(أ\.|د\.)\s*/, '').slice(0, 1) }),
        el('div', { class: 'acol' }, [el('b', { text: a.name }), el('span', { class: 'tiny', dir: 'auto', text: a.username + (a.email ? ' · ' + a.email : '') })]),
        el('div', { class: 'acol' }, [el('span', { class: 'pill ' + (a.role === 'super' ? 'pu' : a.role === 'sup' ? 'bl' : ''), text: ({ super: 'المدير العام', sup: 'مشرف برنامج', user: 'مستخدم' })[a.role] }), el('span', { class: 'tiny', text: pn || '—' })]),
        el('div', { class: 'acol hide-s' }, [el('span', { class: 'tiny', text: a.disabled ? 'موقوف' : a.mustChange ? 'لم يدخل بعد' : (a.last ? 'آخر دخول ' + ago(a.last) : '—') }), el('span', { class: 'tiny', text: a.role === 'user' ? Object.keys(a.perms).filter(function (k) { return a.perms[k]; }).map(function (k) { return PERM_N[k]; }).join('، ') : '' })]),
        el('div', { class: 'row' }, [
          el('button', { type: 'button', class: 'btn sm line', text: 'تعديل', onclick: function () { accForm(a, reload); } }),
          el('button', { type: 'button', class: 'ib sm', title: 'المزيد', 'aria-label': 'المزيد', onclick: function (e) {
            popMenu(e.currentTarget, [
              { t: 'كلمة مرور مؤقتة جديدة', ic: 'key', fn: async function () { if (!(await ask('كلمة مرور مؤقتة', 'تُلغى كلمة مرور ' + a.name + ' الحالية، ويخرج من كل أجهزته.', 'أنشئها'))) return; try { const r = await API6.me('acc_reset', a.uid); showTemp(a.name, r.username, r.temp); reload(); } catch (er) { toast(er.message); } } },
              a.uid !== V6.me.uid ? { t: a.disabled ? 'تفعيل الحساب' : 'إيقاف الحساب', ic: a.disabled ? 'check' : 'lock', fn: async function () { try { await API6.me('acc_save', JSON.stringify({ uid: a.uid, disabled: !a.disabled })); reload(); toast(a.disabled ? 'فُعّل' : 'أُوقف'); } catch (er) { toast(er.message); } } } : null
            ].filter(Boolean));
          } }, [ico('more')])
        ])
      ]));
    });
  }
  reload(); void sk;
  async function importLegacy() {
    if (!(await ask('نقل الحسابات القديمة', 'يُنشأ لكل من دخل بالاسم والرمز في الإصدار الخامس حساب جديد في برنامج الأكاديمية بكلمة مرور مؤقتة، وتبقى قوالبه معه.', 'انقلها'))) return;
    try {
      const out = await API6.me('acc_import', 'academy');
      if (!out.length) { toast('لا حسابات قديمة جديدة للنقل'); return; }
      const txt = out.map(function (x) { return x.name + ' — اسم المستخدم: ' + x.username + ' — كلمة المرور المؤقتة: ' + x.temp; }).join('\n');
      modal({ title: 'نُقل ' + out.length + ' حساباً', wide: true, body: [el('p', { class: 'muted small', text: 'أرسل لكل شخص بياناته. لن تظهر كلمات المرور هذه مرة أخرى.' }), el('textarea', { class: 'inp mono', rows: '10', readonly: true, text: txt })],
        acts: [{ t: 'نسخ الكل', cls: 'dark', keep: true, fn: function () { copyText(txt); } }, { t: 'إغلاق' }] });
      reload();
    } catch (e) { toast(e.message); }
  }
}
function copyText(t) { try { navigator.clipboard.writeText(t).then(function () { toast('نُسخ'); }, function () { toast('حدد النص وانسخه'); }); } catch (e) { toast('حدد النص وانسخه'); } }
function showTemp(name, username, temp) {
  const txt = 'منصة الأثر الإعلامي\n' + location.origin + location.pathname + '\nاسم المستخدم: ' + username + '\nكلمة المرور المؤقتة: ' + temp + '\n(تختار كلمتك عند أول دخول)';
  modal({ title: 'بيانات دخول ' + name, body: [el('p', { class: 'muted small', text: 'أرسلها له. لن تظهر كلمة المرور المؤقتة مرة أخرى.' }), el('div', { class: 'tempbox' }, [el('div', { class: 'kv' }, [el('span', { text: 'اسم المستخدم' }), el('b', { dir: 'auto', text: username }), el('span', { text: 'كلمة المرور' }), el('b', { class: 'mono', dir: 'ltr', text: temp })])])],
    acts: [{ t: 'نسخ الرسالة', cls: 'dark', keep: true, fn: function () { copyText(txt); } }, { t: 'تم' }] });
}
function accForm(a, done) {
  const isNew = !a; a = a || { name: '', username: '', email: '', role: 'user', programs: V6.me.role === 'sup' ? V6.me.programs.slice(0, 1) : [V6.prog.id], perms: { slides: true } };
  const nameI = el('input', { type: 'text', id: 'ac_name', value: a.name }), userI = el('input', { type: 'text', id: 'ac_user', dir: 'auto', value: a.username, placeholder: 'مثل: ahmad أو أحمد.الشهري' }), mailI = el('input', { type: 'email', id: 'ac_mail', dir: 'ltr', value: a.email });
  let role = a.role;
  const progs = el('div', { class: 'checks' }, myAdminProgs().map(function (p) { return el('label', { class: 'tog' }, [el('input', { type: 'checkbox', value: p.id, checked: a.programs.indexOf(p.id) >= 0 }), el('span', { text: p.name })]); }));
  const perms = el('div', { class: 'checks' }, Object.keys(PERM_N).map(function (k) { return el('label', { class: 'tog' }, [el('input', { type: 'checkbox', value: k, checked: !!(a.perms && a.perms[k]) }), el('span', { text: PERM_N[k] })]); }));
  const permBox = el('div', { class: 'fld' }, [el('label', { text: 'الصلاحيات (المشرفون يملكونها كلها)' }), perms]);
  // الهويات المسموحة: لا اختيار = كل هويات برامجه
  const trks = el('div', { class: 'checks' }, myAdminProgs().map(function (p) {
    return el('div', { class: 'trkgrp' }, [el('small', { class: 'tiny', text: p.name }), el('div', { class: 'row wrapr' }, (p.identities || []).map(function (t) { return el('label', { class: 'tog' }, [el('input', { type: 'checkbox', value: t.id, checked: (a.tracks || []).indexOf(t.id) >= 0 }), el('span', { text: t.name })]); }))]);
  }));
  let lvl = a.editLevel || '';
  const lvlBox = el('div', { class: 'fld' }, [el('label', { text: 'درجة التعديل في القوالب' }), segOf([['', 'كما في البرنامج'], ['content', EDIT_N.content], ['style', EDIT_N.style], ['full', EDIT_N.full]], lvl, function (v) { lvl = v; }),
    el('p', { class: 'tiny', text: 'المحتوى فقط: يكتب النصوص ويغيّر الصور. المحتوى والمظهر: ويغيّر الألوان والخطوط ويحرّك العناصر ويكبّرها. كامل: ويضيف عناصر ونصوصاً جديدة.' })]);
  const trkBox = el('div', { class: 'fld' }, [el('label', { text: 'الهويات التي يدخلها (اترك الكل فارغاً ليدخل كل الهويات)' }), trks]);
  const userOnly = el('div', {}, [trkBox, lvlBox]);
  const msg = el('p', { class: 'err' });
  const roles = isSuper() ? [['user', 'مستخدم'], ['sup', 'مشرف برنامج'], ['super', 'المدير العام']] : [['user', 'مستخدم']];
  permBox.hidden = role !== 'user'; userOnly.hidden = role !== 'user';
  modal({ title: isNew ? 'حساب جديد' : 'تعديل ' + a.name, wide: true, body: [
    el('div', { class: 'grid two' }, [el('div', { class: 'fld' }, [el('label', { for: 'ac_name', text: 'الاسم الظاهر' }), nameI]), el('div', { class: 'fld' }, [el('label', { for: 'ac_user', text: 'اسم المستخدم للدخول' }), userI])]),
    el('div', { class: 'fld' }, [el('label', { for: 'ac_mail', text: 'البريد (اختياري، ويصلح للدخول أيضاً)' }), mailI]),
    el('div', { class: 'fld' }, [el('label', { text: 'الدور' }), segOf(roles, role, function (v) { role = v; permBox.hidden = v !== 'user'; userOnly.hidden = v !== 'user'; })]),
    el('div', { class: 'fld' }, [el('label', { text: 'البرامج' }), progs]),
    permBox, userOnly, msg
  ], acts: [{ t: isNew ? 'أنشئ الحساب' : 'حفظ', cls: 'dark', keep: true, fn: async function (close) {
    const o = { uid: a.uid, name: nameI.value.trim(), username: userI.value.trim(), email: mailI.value.trim(), role: role,
      programs: $$('input:checked', progs).map(function (i) { return i.value; }), perms: {},
      tracks: role === 'user' ? $$('input:checked', trks).map(function (i) { return i.value; }) : [], editLevel: role === 'user' ? lvl : '' };
    $$('input:checked', perms).forEach(function (i) { o.perms[i.value] = true; });
    if (!o.name || !o.username) { msg.textContent = 'اكتب الاسم واسم المستخدم'; return; }
    if (role !== 'super' && !o.programs.length) { msg.textContent = 'اختر برنامجاً واحداً على الأقل'; return; }
    try { const r = await API6.me('acc_save', JSON.stringify(o)); close(); if (r.temp) showTemp(r.acc.name, r.acc.username, r.temp); else toast('حُفظ'); done(); }
    catch (e) { msg.textContent = e.message; }
  } }, { t: 'إلغاء' }] });
}

/* ---------- البرامج والهويات ---------- */
const COLOR_KEYS = [['p', 'الأساسي'], ['pd', 'الأساسي الداكن'], ['pl', 'الأساسي الفاتح'], ['s', 'الثانوي'], ['sd', 'الثانوي الداكن'], ['sdd', 'الأدكن'], ['a', 'التمييز'], ['a2', 'التمييز الثاني'], ['paper', 'الورق'], ['warm', 'الورق الدافئ'], ['ink', 'الحبر'], ['muted', 'الرمادي'], ['teal', 'الليلي'], ['tealL', 'الليلي الفاتح']];
function deriveColors(p, s, a) {
  return { p: p, pd: lighten(p, -0.35), pl: lighten(p, 0.3), s: s, sd: lighten(s, -0.3), sdd: lighten(s, -0.6), a: a, a2: lighten(a, -0.14), paper: '#f8f8f8', warm: lighten(p, 0.88), ink: '#2b2b2b', muted: '#8d8d8d', teal: lighten(p, -0.6), tealL: lighten(p, 0.15) };
}
async function aPrograms(body) {
  aHead(body, 'البرامج والهويات', 'لكل برنامج هوياته: ألوانها وشعارها. وكل القوالب تعمل بأي هوية.', [isSuper() ? el('button', { type: 'button', class: 'btn dark', onclick: function () { progForm(null); } }, [ico('plus'), 'برنامج جديد']) : null]);
  let list; try { list = await API6.me('prog_list'); } catch (e) { body.appendChild(el('p', { class: 'err', text: e.message })); return; }
  const mine = list.filter(function (p) { return isSuper() || V6.me.programs.indexOf(p.id) >= 0; });
  body.appendChild(el('div', { class: 'plist' }, mine.map(function (p) {
    return el('div', { class: 'card pcard' + (p.active === false ? ' off' : '') }, [
      el('div', { class: 'row sb' }, [el('div', { class: 'row' }, [el('i', { class: 'pdot', style: 'background:' + p.color }), el('h3', { text: p.name }), p.active === false ? el('span', { class: 'pill', text: 'موقوف' }) : null]),
        el('div', { class: 'row' }, [el('button', { type: 'button', class: 'btn sm line', text: 'الإعدادات', onclick: function () { progForm(p); } }), el('button', { type: 'button', class: 'btn sm dark', onclick: function () { identityForm(p, null); } }, [ico('plus'), 'هوية'])])]),
      el('p', { class: 'muted small', text: p.desc || '' }),
      el('div', { class: 'row wrapr' }, [p.features && p.features.social === false ? el('span', { class: 'pill', text: 'مواقع التواصل متوقفة' }) : el('span', { class: 'pill gr', text: 'مواقع التواصل لمن له صلاحيتها' }), el('span', { class: 'pill', text: (p.identities || []).length + ' هوية' })]),
      el('div', { class: 'row wrapr' }, [el('button', { type: 'button', class: 'btn sm line', onclick: function () { tgForm(p); } }, [ico('send'), p.tg && p.tg.chat ? 'القناة: ' + p.tg.chat : 'قناة تليجرام والنصوص المصاحبة'])]),
      el('div', { class: 'idrow' }, (p.identities || []).map(function (t) {
        return el('button', { type: 'button', class: 'idchip', onclick: function () { identityForm(p, t); } }, [el('span', { class: 'sw' }, ['pd', 'p', 's', 'a'].map(function (k) { return el('i', { style: 'background:' + t.c[k] }); })), el('span', { text: t.name })]);
      }).concat((p.identities || []).length ? [] : [el('p', { class: 'tiny', text: 'لا هويات بعد. أضف هوية البرنامج لتظهر القوالب بها.' })]))
    ]);
  })));
}
function progForm(p) {
  const isNew = !p; p = p || { id: '', name: '', desc: '', color: '#171717', features: { social: true, slides: true, ai: true }, active: true };
  const idI = el('input', { type: 'text', id: 'pg_id', dir: 'ltr', value: p.id, disabled: !isNew, placeholder: 'مثل: alim' }), nameI = el('input', { type: 'text', id: 'pg_name', value: p.name }), descI = el('input', { type: 'text', id: 'pg_desc', value: p.desc || '' });
  const colI = el('input', { type: 'color', id: 'pg_col', value: p.color || '#171717' });
  const f = Object.assign({ social: true, slides: true, ai: true }, p.features || {});
  const tg = function (k, t) { return el('label', { class: 'tog' }, [el('input', { type: 'checkbox', checked: f[k] !== false, onchange: function (e) { f[k] = e.target.checked; } }), el('span', { text: t })]); };
  let active = p.active !== false, lvl = p.editLevel || 'full';
  const msg = el('p', { class: 'err' });
  modal({ title: isNew ? 'برنامج جديد' : p.name, body: [
    el('div', { class: 'grid two' }, [el('div', { class: 'fld' }, [el('label', { for: 'pg_name', text: 'الاسم' }), nameI]), el('div', { class: 'fld' }, [el('label', { for: 'pg_id', text: 'المعرّف (حروف إنجليزية)' }), idI])]),
    el('div', { class: 'fld' }, [el('label', { for: 'pg_desc', text: 'وصف قصير' }), descI]),
    el('div', { class: 'fld' }, [el('label', { for: 'pg_col', text: 'لون البرنامج في المنصة' }), colI]),
    el('div', { class: 'checks' }, [tg('social', 'قوالب مواقع التواصل (لمن له صلاحيتها)'), tg('slides', 'الشرائح'), tg('ai', 'اصنع إعلانك بالذكاء')]),
    el('div', { class: 'fld' }, [el('label', { text: 'درجة تعديل المستخدمين في القوالب' }), segOf([['content', EDIT_N.content], ['style', EDIT_N.style], ['full', EDIT_N.full]], lvl, function (v) { lvl = v; }),
      el('p', { class: 'tiny', text: 'تنطبق على كل مستخدمي البرنامج، إلا من حدّدت له درجة أخرى في حسابه. المشرفون يعدّلون كل شيء.' })]),
    isSuper() && !isNew ? el('label', { class: 'tog' }, [el('input', { type: 'checkbox', checked: active, onchange: function (e) { active = e.target.checked; } }), el('span', { text: 'البرنامج مفعّل' })]) : null,
    msg
  ], acts: [{ t: 'حفظ', cls: 'dark', keep: true, fn: async function (close) {
    try { await API6.me('prog_save', JSON.stringify({ id: idI.value.trim().toLowerCase(), name: nameI.value.trim(), desc: descI.value, color: colI.value, features: f, active: active, identities: p.identities || [], editLevel: lvl })); close(); await refreshBundle(); toast('حُفظ'); showAdmin('programs'); }
    catch (e) { msg.textContent = e.message; }
  } }, { t: 'إلغاء' }] });
}
async function refreshBundle() { const cur = V6.prog && V6.prog.id; await loadBundle(); if (cur) await useProgram(cur, true); buildTop(); }
function identityForm(p, t) {
  const isNew = !t;
  t = t ? JSON.parse(JSON.stringify(t)) : { id: '', group: 'act', name: '', full: '', desc: '', logo: '', logos: null, c: deriveColors('#16817a', '#512c62', '#f7931e') };
  const idI = el('input', { type: 'text', dir: 'ltr', value: t.id, disabled: !isNew, placeholder: 'مثل: alim_boys', 'aria-label': 'المعرّف' }), nameI = el('input', { type: 'text', value: t.name, 'aria-label': 'الاسم المختصر' }), fullI = el('input', { type: 'text', value: t.full, 'aria-label': 'الاسم الكامل' });
  let group = t.group;
  const prev = el('div', { class: 'idprev' });
  const colorRows = el('div', { class: 'cgrid14' });
  function paint() {
    colorRows.innerHTML = '';
    COLOR_KEYS.forEach(function (q) { colorRows.appendChild(el('label', { class: 'cfield' }, [el('input', { type: 'color', value: t.c[q[0]], oninput: function (e) { t.c[q[0]] = e.target.value; drawPrev(); } }), el('span', { text: q[1] })])); });
    drawPrev();
  }
  function drawPrev() {
    prev.innerHTML = ''; const T = finishTrack(Object.assign({}, t, { c: Object.assign({}, t.c), swatches: null, logo: t.logo || 'logo' }));
    ['ann_panel', 'quote_rays', 'ann_cards'].forEach(function (id) { const tpl = TEMPLATES.find(function (x) { return x.id === id; }); if (!tpl) return; const c = el('canvas'); renderTo(c, tpl, tpl.sizes[0], { d: defaults(tpl, T), variant: tpl.variants[0].id, k: 1 }, T, 0.16); prev.appendChild(c); });
  }
  const base = [el('input', { type: 'color', value: t.c.p, 'aria-label': 'أساسي' }), el('input', { type: 'color', value: t.c.s, 'aria-label': 'ثانوي' }), el('input', { type: 'color', value: t.c.a, 'aria-label': 'تمييز' })];
  const logos = Object.keys(V6.assets).map(function (k) { return V6.assets[k]; }).filter(function (a) { return a.kind === 'logo' && (a.program === p.id || a.scope === 'global') && a.key; });
  const logoSel = el('select', { class: 'inp', 'aria-label': 'الشعار' }, [el('option', { value: '', text: 'بلا شعار (يُرفع من «الشعارات والصور»)' })].concat(logos.map(function (a) { return el('option', { value: a.key, text: a.name + ' (' + a.key + ')', selected: a.key === t.logo }); })));
  const msg = el('p', { class: 'err' });
  modal({ title: isNew ? 'هوية جديدة في ' + p.name : t.name, wide: true, body: [
    el('div', { class: 'grid three' }, [el('div', { class: 'fld' }, [el('label', { text: 'الاسم المختصر' }), nameI]), el('div', { class: 'fld' }, [el('label', { text: 'الاسم الكامل (يظهر في القوالب)' }), fullI]), el('div', { class: 'fld' }, [el('label', { text: 'المعرّف' }), idI])]),
    el('div', { class: 'row wrapr' }, [el('div', { class: 'fld' }, [el('label', { text: 'النوع' }), segOf([['track', 'مسار'], ['act', 'نشاط أو هوية']], group, function (v) { group = v; })]), el('div', { class: 'fld', style: 'flex:1' }, [el('label', { text: 'الشعار' }), logoSel])]),
    el('div', { class: 'card flat' }, [el('b', { text: 'ألوان سريعة' }), el('p', { class: 'tiny', text: 'اختر ثلاثة ألوان، ونشتق منها الدرجات كلها. ثم عدّل أي درجة بيدك.' }), el('div', { class: 'row' }, base.concat([el('button', { type: 'button', class: 'btn sm dark', text: 'اشتق الدرجات', onclick: function () { t.c = deriveColors(base[0].value, base[1].value, base[2].value); paint(); } })]))]),
    colorRows, el('b', { text: 'معاينة' }), prev, msg
  ], acts: [{ t: 'حفظ الهوية', cls: 'dark', keep: true, fn: async function (close) {
    t.id = idI.value.trim().toLowerCase(); t.name = nameI.value.trim(); t.full = fullI.value.trim() || t.name; t.group = group; t.logo = logoSel.value;
    if (!t.id || !t.name) { msg.textContent = 'اكتب الاسم والمعرّف'; return; }
    const ids = (p.identities || []).filter(function (x) { return x.id !== t.id; });
    if (isNew && (p.identities || []).some(function (x) { return x.id === t.id; })) { msg.textContent = 'المعرّف مستعمل'; return; }
    const idx = (p.identities || []).findIndex(function (x) { return x.id === t.id; });
    const list = idx >= 0 ? p.identities.map(function (x) { return x.id === t.id ? t : x; }) : ids.concat([t]);
    try { await API6.me('prog_save', JSON.stringify(Object.assign({}, p, { identities: list }))); close(); await refreshBundle(); toast('حُفظت الهوية'); showAdmin('programs'); }
    catch (e) { msg.textContent = e.message; }
  } }, isNew ? null : { t: 'حذف الهوية', cls: 'danger', keep: true, fn: async function (close) { if (!(await ask('حذف الهوية', 'تختفي من قائمة الهويات، وتبقى التصاميم المحفوظة بها.', 'حذف', true))) return; try { await API6.me('prog_save', JSON.stringify(Object.assign({}, p, { identities: p.identities.filter(function (x) { return x.id !== t.id; }) }))); close(); await refreshBundle(); showAdmin('programs'); } catch (e) { msg.textContent = e.message; } } }, { t: 'إلغاء' }] });
  paint();
}

/* ---------- الشعارات والصور ---------- */
const ASSET_KEYS = [['academy', 'شعار البرنامج في تذييل القوالب'], ['social', 'حسابات التواصل في التذييل']];
async function aAssets(body) {
  let prog = (myAdminProgs()[0] || {}).id;
  aHead(body, 'الشعارات والصور', 'أصول كل برنامج لا يراها إلا أعضاؤه. الملفات تُحفظ بجودتها الأصلية.', [progSelect(prog, false, function (v) { prog = v; fill(); })]);
  const box = el('div'); body.appendChild(box);
  async function fill() {
    box.innerHTML = ''; const sk = loading(box);
    let list; try { list = await API6.me('asset_list', 'program', prog); } catch (e) { sk.remove(); box.appendChild(el('p', { class: 'err', text: e.message })); return; }
    sk.remove();
    const own = list.filter(function (a) { return a.program === prog && a.kind !== 'font'; });
    await imgRequestsCard(box, prog);
    const up = function (kind, label, key) {
      const f = el('input', { type: 'file', accept: 'image/png,image/webp,image/jpeg,image/svg+xml', hidden: true, multiple: !key, onchange: async function (e) {
        const files = Array.from(e.target.files); e.target.value = '';
        for (const fl of files) {
          let k = key || ((kind === 'logo' ? 'lg_' : 'img_') + fl.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30));
          try { const thumb = await thumbFromFile(fl, 200); await uploadAsset(fl, { kind: kind, scope: 'program', program: prog, key: k, thumb: thumb }); } catch (er) { toast(er.message); }
        }
        await refreshBundle(); fill(); toast('رُفع');
      } });
      return el('span', {}, [el('button', { type: 'button', class: 'btn sm dark', onclick: function () { f.click(); } }, [ico('upload'), label]), f]);
    };
    box.appendChild(el('div', { class: 'card' }, [el('h3', { text: 'الشعارات' }), el('p', { class: 'tiny', text: 'ارفع شعار كل هوية (يفضّل PNG أو WEBP بخلفية شفافة)، ثم اختره في إعدادات الهوية.' }), el('div', { class: 'row wrapr' }, [up('logo', 'ارفع شعارات')].concat(ASSET_KEYS.map(function (q) { return up('logo', q[1], q[0]); }))), assetGrid(own.filter(function (a) { return a.kind === 'logo'; }), fill, function (a) {
      const P = V6.bundle.programs.find(function (p) { return p.id === prog; }) || {}, blk = ((P.block && P.block.logos) || []).slice();
      return el('label', { class: 'tog sm' }, [el('input', { type: 'checkbox', checked: blk.indexOf(a.key) < 0, onchange: async function (e) {
        const i = blk.indexOf(a.key); if (!e.target.checked && i < 0) blk.push(a.key); if (e.target.checked && i >= 0) blk.splice(i, 1);
        try { await API6.me('prog_save', JSON.stringify({ id: P.id, block: { fonts: (P.block && P.block.fonts) || [], logos: blk } })); P.block = { fonts: (P.block && P.block.fonts) || [], logos: blk }; toast(e.target.checked ? 'يظهر للمستخدمين' : 'لا يظهر للمستخدمين في العناصر'); } catch (er) { toast(er.message); e.target.checked = !e.target.checked; }
      } }), el('span', { text: 'متاح للمستخدمين' })]);
    })]));
    box.appendChild(el('div', { class: 'card' }, [el('h3', { text: 'صور مكتبة القوالب' }), el('p', { class: 'tiny', text: 'تظهر في خانات الصور وخلفيات القوالب لكل أعضاء البرنامج. لا صور للطلاب.' }), up('photo', 'ارفع صوراً'), assetGrid(own.filter(function (a) { return a.kind === 'photo' || a.kind === 'image'; }), fill)]));
  }
  fill();
}
function assetGrid(list, refresh, extra) {
  if (!list.length) return el('p', { class: 'empty', text: 'لا شيء بعد' });
  return el('div', { class: 'agrid' }, list.map(function (a) {
    const im = el('div', { class: 'athumb' });
    if (ASSETS[a.key]) im.style.backgroundImage = 'url(' + ASSETS[a.key] + ')'; else if (a.thumb) im.style.backgroundImage = 'url(' + a.thumb + ')';
    else assetURL(a).then(function (u) { im.style.backgroundImage = 'url(' + u + ')'; }).catch(function () {});
    return el('div', { class: 'acard' }, [im, el('b', { text: a.name }), el('span', { class: 'tiny', dir: 'ltr', text: a.key }), extra ? extra(a) : null,
      el('div', { class: 'row' }, [
        el('button', { type: 'button', class: 'btn sm ghost', text: 'تسمية', onclick: async function () { const n = await promptText('اسم الأصل', a.name); if (n == null) return; const k = await promptText('المفتاح (لربطه بالهوية أو القوالب)', a.key); if (k == null) return; try { await API6.me('asset_meta', JSON.stringify({ id: a.id, name: n, key: k })); await refreshBundle(); refresh(); } catch (e) { toast(e.message); } } }),
        el('button', { type: 'button', class: 'ib sm', 'aria-label': 'حذف', title: 'حذف', onclick: async function () { if (!(await ask('حذف', 'حذف «' + a.name + '»؟ القوالب التي تستعمله ستظهر بلا شعار.', 'حذف', true))) return; try { await API6.me('asset_del', a.id); await refreshBundle(); refresh(); } catch (e) { toast(e.message); } } }, [ico('trash')])
      ])]);
  }));
}
function promptText(title, val) { return new Promise(function (ok) { const i = el('input', { type: 'text', class: 'inp', value: val || '' }); modal({ title: title, body: [i], acts: [{ t: 'حفظ', cls: 'dark', fn: function () { ok(i.value.trim()); } }, { t: 'إلغاء', fn: function () { ok(null); } }], onClose: function () { ok(null); } }); }); }

/* ---------- الخطوط ---------- */
async function aFonts(body) {
  let scope = isSuper() ? 'global' : 'program', prog = (myAdminProgs()[0] || {}).id;
  aHead(body, 'الخطوط', 'ارفع ملفات الخطوط كما هي، كل وزن في ملف. ثم حدّد لكل برنامج خطوط هويته، وما لا يظهر لمستخدميه.', []);
  const box = el('div'); body.appendChild(box);
  if (isSuper()) {
    const uis = []; Object.keys(V6.assets).forEach(function (k) { const a = V6.assets[k]; if (a.kind === 'font' && a.ui) uis.push(a); });
    box.appendChild(el('div', { class: 'card hl' }, [el('span', { class: 'icon-tile t-pu' }, [ico('font')]), el('h3', { text: 'خطوط واجهة المنصة' }),
      el('p', { class: 'muted small', text: 'ملفات خط ثمانية (Serif Display وSerif Text) لتظهر بها المنصة كلها. تُخدم من درايفك فقط، ولا تُنشر للعموم، ولا تظهر في التصاميم.' }),
      uis.length ? el('div', { class: 'row wrapr' }, uis.map(function (a) { return el('span', { class: 'pill' }, [a.name, el('button', { type: 'button', class: 'x', 'aria-label': 'حذف', onclick: async function () { if (!(await ask('حذف خط الواجهة', 'حذف «' + a.name + '»؟', 'حذف', true))) return; try { await API6.me('asset_del', a.id); await refreshBundle(); showAdmin('fonts'); } catch (e) { toast(e.message); } } }, [ico('close')])]); })) : el('p', { class: 'tiny', text: 'لم تُرفع بعد، فالمنصة تظهر بخط بديل.' }),
      fontUploader('global', '', function () { refreshBundle().then(function () { loadUiFonts(); showAdmin('fonts'); }); }, true)]));
  }
  box.appendChild(el('div', { class: 'card' }, [el('h3', { text: 'رفع خطوط للتصاميم' }), el('div', { class: 'row wrapr' }, [
    isSuper() ? segOf([['global', 'لكل البرامج'], ['program', 'لبرنامج واحد']], scope, function (v) { scope = v; }) : null,
    progSelect(prog, false, function (v) { prog = v; }),
    fontUploaderDyn(function () { return scope; }, function () { return prog; })
  ])]));
  // إعدادات الخطوط لبرنامج: خطوط الهوية، والمحجوبة
  let cur = prog;
  const lib = el('div'); box.appendChild(el('div', { class: 'card' }, [
    el('div', { class: 'ahead', style: 'margin:0' }, [el('div', {}, [el('h3', { text: 'مكتبة الخطوط' }), el('p', { class: 'tiny', text: 'خطوط الهوية تظهر أولاً للمستخدم باسم «خطوط هوية البرنامج». والخط غير المتاح لا يظهر لمستخدمي البرنامج (يبقى في التصاميم القديمة).' })]),
      el('div', { class: 'row' }, [el('span', { class: 'tiny', text: 'إعدادات برنامج:' }), progSelect(cur, false, function (v) { cur = v; fillLib(); })])]),
    lib]));
  function fillLib() {
    lib.innerHTML = '';
    const P = V6.bundle.programs.find(function (p) { return p.id === cur; }) || {};
    const idf = (P.fontsId || []).slice(), blk = ((P.block && P.block.fonts) || []).slice();
    const save = async function (msg) { try { await API6.me('prog_save', JSON.stringify({ id: P.id, fontsId: idf, block: { fonts: blk, logos: (P.block && P.block.logos) || [] } })); P.fontsId = idf.slice(); P.block = { fonts: blk.slice(), logos: (P.block && P.block.logos) || [] }; toast(msg); fillLib(); } catch (e) { toast(e.message); } };
    const fams = Object.keys(FONT_REG).map(function (k) { return FONT_REG[k]; }).filter(function (r) { return r.scope !== 'user' && (r.scope === 'global' || r.program === cur); });
    const rank = function (r) { return idf.indexOf(r.family) >= 0 ? 0 : blk.indexOf(r.family) >= 0 ? 2 : 1; };
    fams.sort(function (a, b) { return rank(a) - rank(b) || (rank(a) === 0 ? idf.indexOf(a.family) - idf.indexOf(b.family) : a.label.localeCompare(b.label, 'ar')); });
    let lastRank = -1;
    fams.forEach(function (r) {
      const rk = rank(r);
      if (rk !== lastRank) { lib.appendChild(el('h4', { class: 'psh', text: ['خطوط هوية ' + (P.name || ''), 'خطوط أخرى متاحة', 'غير متاحة لمستخدمي البرنامج'][rk] })); lastRank = rk; }
      const smp = el('span', { class: 'fsmp', text: 'لقاء مفتوح · ١٢٣' });
      ensureFonts([r.family]).then(function () { const F = FONTS[r.family]; if (F) { const w = F.w.b.split('|'); smp.style.font = (w[1] || 700) + ' 24px "' + w[0] + '", sans-serif'; } }).catch(function () {});
      const isId = idf.indexOf(r.family) >= 0, isBlk = blk.indexOf(r.family) >= 0;
      const ctrls = el('div', { class: 'row wrapr fctl' }, [
        el('label', { class: 'tog' }, [el('input', { type: 'checkbox', checked: isId, onchange: function (e) { const i = idf.indexOf(r.family); if (e.target.checked && i < 0) idf.push(r.family); if (!e.target.checked && i >= 0) idf.splice(i, 1); save(e.target.checked ? 'صار من خطوط الهوية' : 'لم يعد من خطوط الهوية'); } }), el('span', { text: 'من هوية البرنامج' })]),
        el('label', { class: 'tog' }, [el('input', { type: 'checkbox', checked: !isBlk, onchange: function (e) { const i = blk.indexOf(r.family); if (!e.target.checked && i < 0) blk.push(r.family); if (e.target.checked && i >= 0) blk.splice(i, 1); save(e.target.checked ? 'صار متاحاً' : 'لم يعد يظهر للمستخدمين'); } }), el('span', { text: 'متاح للمستخدمين' })]),
        isSuper() ? el('select', { class: 'inp sm', 'aria-label': 'نطاق الخط', onchange: async function (e) { const v = e.target.value; try { await API6.me('font_family', JSON.stringify({ family: r.family, scope: v ? 'program' : 'global', program: v })); await refreshBundle(); toast('تغيّر نطاق الخط'); showAdmin('fonts'); } catch (er) { toast(er.message); } } },
          [el('option', { value: '', text: 'لكل البرامج', selected: r.scope === 'global' })].concat(V6.bundle.programs.map(function (p) { return el('option', { value: p.id, text: 'خاص ببرنامج ' + p.name, selected: r.scope === 'program' && r.program === p.id }); }))) : el('span', { class: 'tiny', text: r.scope === 'global' ? 'لكل البرامج' : 'خاص بالبرنامج' }),
        (isSuper() || r.scope === 'program') ? el('button', { type: 'button', class: 'ib sm', title: 'حذف العائلة', 'aria-label': 'حذف', onclick: async function () { if (!(await ask('حذف الخط', 'حذف «' + r.label + '» بكل أوزانه؟ التصاميم التي تستعمله ستظهر بخط بديل.', 'حذف', true))) return; try { for (const f of r.files) await API6.me('asset_del', f.id); await refreshBundle(); showAdmin('fonts'); } catch (e) { toast(e.message); } } }, [ico('trash')]) : null
      ]);
      lib.appendChild(el('div', { class: 'frow' + (isBlk ? ' off' : '') }, [el('div', { class: 'fmeta' }, [smp, el('div', { class: 'tiny', text: r.label + ' · ' + r.files.length + ' ملف' })]), ctrls]));
    });
    if (!fams.length) lib.appendChild(el('p', { class: 'empty', text: 'لا خطوط بعد.' }));
  }
  fillLib();
}
function fontUploaderDyn(scopeFn, progFn) { return fontUploader(scopeFn, progFn, function () { refreshBundle().then(function () { showAdmin('fonts'); }); }); }

/* ---------- البلاغات ---------- */
async function aFeedback(body) {
  let status = 'new', kind = '', list = [];
  aHead(body, 'البلاغات والاقتراحات', 'كل بلاغ معه صفحته وجهازه وآخر الأخطاء التقنية. وحالته يراها صاحبه.', [
    segOf([['new', 'جديدة'], ['work', 'قيد العمل'], ['done', 'تمت'], ['wont', 'لن تُنفّذ'], ['', 'الكل']], status, function (v) { status = v; load(); }),
    el('select', { class: 'inp sm', 'aria-label': 'النوع', onchange: function (e) { kind = e.target.value; fill(); } }, [['', 'كل الأنواع'], ['bug', 'مشكلة'], ['idea', 'اقتراح'], ['q', 'سؤال']].map(function (o) { return el('option', { value: o[0], text: o[1] }); }))
  ]);
  const box = el('div', { class: 'fbadmin' }); body.appendChild(box);
  async function load() { box.innerHTML = ''; const sk = loading(box); try { list = await API6.me('fb_list', status); sk.remove(); fill(); } catch (e) { sk.remove(); box.appendChild(el('p', { class: 'err', text: e.message })); } }
  function fill() {
    box.innerHTML = '';
    const rows = list.filter(function (x) { return !kind || x.kind === kind; });
    if (!rows.length) { box.appendChild(el('p', { class: 'empty', text: 'لا بلاغات هنا' })); return; }
    rows.forEach(function (x) {
      const reply = el('textarea', { class: 'inp', rows: '2', placeholder: 'ردك (يراه صاحب البلاغ)…', text: x.reply || '' });
      const stSel = el('select', { class: 'inp sm', 'aria-label': 'الحالة' }, Object.keys(FB_ST).map(function (k) { return el('option', { value: k, text: FB_ST[k][0], selected: k === x.status }); }));
      const shot = el('div', { class: 'fbshot' });
      const prog = V6.bundle.programs.find(function (p) { return p.id === x.program; });
      box.appendChild(el('div', { class: 'card fbx' }, [
        el('div', { class: 'row sb' }, [el('div', { class: 'row wrapr' }, [el('span', { class: 'pill ' + (FB_ST[x.status] || [])[1], text: (FB_ST[x.status] || ['?'])[0] }), el('span', { class: 'pill', text: FB_K[x.kind] }), el('b', { text: x.name || 'زائر' }), prog ? el('span', { class: 'tiny', text: prog.name }) : null]), el('span', { class: 'tiny', text: ago(x.at) })]),
        el('p', { class: 'fbtext', text: x.text }),
        el('details', {}, [el('summary', { class: 'tiny', text: 'التفاصيل التقنية' }), el('dl', { class: 'kv tiny' }, [
          el('dt', { text: 'الصفحة' }), el('dd', { dir: 'ltr', text: x.page || '—' }), el('dt', { text: 'القالب' }), el('dd', { text: x.tpl || '—' }), el('dt', { text: 'الجهاز' }), el('dd', { dir: 'ltr', text: (x.vw || '') + ' · ' + (x.ua || '') }),
          el('dt', { text: 'الأخطاء' }), el('dd', { dir: 'ltr', class: 'mono', text: (x.errors || []).join('\n') || 'لا شيء' }), el('dt', { text: 'الإصدار' }), el('dd', { text: String(x.v || '') })])]),
        (x.imgs || []).length ? el('div', { class: 'row wrapr' }, x.imgs.map(function (_, k) { return el('button', { type: 'button', class: 'btn sm line', text: 'الصورة ' + (k + 1), onclick: async function (e) { e.currentTarget.disabled = true; try { const u = await API6.call('fb_shot', V6.token, x.id, k); shot.appendChild(el('img', { src: u, alt: 'صورة مرفقة' })); } catch (er) { toast(er.message); } } }); })) : null,
        x.shot ? el('button', { type: 'button', class: 'btn sm line', text: 'صورة التصميم', onclick: async function (e) { e.currentTarget.disabled = true; try { const u = await API6.call('fb_shot', V6.token, x.id); shot.appendChild(el('img', { src: u, alt: 'صورة من البلاغ' })); } catch (er) { toast(er.message); } } }) : null, shot,
        el('div', { class: 'row wrapr' }, [stSel, el('div', { style: 'flex:1;min-width:200px' }, [reply]), el('button', { type: 'button', class: 'btn sm dark', text: 'حفظ', onclick: async function () { try { await API6.me('fb_update', x.id, stSel.value, reply.value); x.status = stSel.value; x.reply = reply.value; toast('حُفظ'); } catch (e) { toast(e.message); } } })])
      ]));
    });
  }
  load();
}

/* ---------- رسائل للمستخدمين ---------- */
async function aBroadcasts(body) {
  aHead(body, 'رسائل للمستخدمين', 'شريط أعلى الصفحة، أو نافذة تظهر مرة، أو نصيحة في «ما الجديد». لبرنامج بعينه أو للجميع.', [el('button', { type: 'button', class: 'btn dark', onclick: function () { bcForm(null); } }, [ico('plus'), 'رسالة جديدة'])]);
  const box = el('div'); body.appendChild(box); const sk = loading(box);
  let list; try { list = await API6.me('bc_all'); } catch (e) { sk.remove(); box.appendChild(el('p', { class: 'err', text: e.message })); return; }
  sk.remove();
  if (!list.length) box.appendChild(el('p', { class: 'empty', text: 'لا رسائل بعد' }));
  list.forEach(function (b) {
    const live = b.active !== false && (!b.until || b.until > Date.now());
    box.appendChild(el('div', { class: 'card flat arow2' }, [el('div', {}, [el('div', { class: 'row' }, [el('span', { class: 'pill ' + (live ? 'gr' : ''), text: live ? 'ظاهرة' : 'متوقفة' }), el('span', { class: 'pill', text: ({ banner: 'شريط', modal: 'نافذة', tip: 'نصيحة' })[b.kind] }), el('b', { text: b.title })]), el('p', { class: 'small muted', text: b.body }),
      el('span', { class: 'tiny', text: (b.programs && b.programs.length ? b.programs.join('، ') : 'الجميع') + ' · ' + b.by + ' · ' + ago(b.at) })]),
      el('div', { class: 'row' }, [el('button', { type: 'button', class: 'btn sm line', text: 'تعديل', onclick: function () { bcForm(b); } }), el('button', { type: 'button', class: 'ib sm', 'aria-label': 'حذف', onclick: async function () { if (!(await ask('حذف الرسالة', b.title, 'حذف', true))) return; await API6.me('bc_del', b.id); showAdmin('broadcasts'); } }, [ico('trash')])])]));
  });
}
function bcForm(b) {
  b = b || { title: '', body: '', kind: 'banner', programs: isSuper() ? [] : V6.me.programs.slice(0, 1), active: true };
  const tI = el('input', { type: 'text', class: 'inp', value: b.title, 'aria-label': 'العنوان', placeholder: 'العنوان' }), bI = el('textarea', { class: 'inp', rows: '3', 'aria-label': 'النص', placeholder: 'النص', text: b.body }), lI = el('input', { type: 'url', class: 'inp', dir: 'ltr', value: b.link || '', placeholder: 'رابط اختياري', 'aria-label': 'رابط' });
  const untilI = el('input', { type: 'date', class: 'inp', value: b.until ? new Date(b.until).toISOString().slice(0, 10) : '', 'aria-label': 'تنتهي في' });
  let kind = b.kind, active = b.active !== false;
  const progs = el('div', { class: 'checks' }, myAdminProgs().map(function (p) { return el('label', { class: 'tog' }, [el('input', { type: 'checkbox', value: p.id, checked: (b.programs || []).indexOf(p.id) >= 0 }), el('span', { text: p.name })]); }));
  modal({ title: b.id ? 'تعديل الرسالة' : 'رسالة جديدة', body: [tI, bI, el('div', { class: 'fld' }, [el('label', { text: 'الشكل' }), segOf([['banner', 'شريط أعلى الصفحة'], ['modal', 'نافذة مرة واحدة'], ['tip', 'نصيحة في «ما الجديد»']], kind, function (v) { kind = v; })]),
    el('div', { class: 'fld' }, [el('label', { text: isSuper() ? 'البرامج (لا شيء = الجميع)' : 'البرامج' }), progs]), lI, el('div', { class: 'fld' }, [el('label', { text: 'تختفي بعد (اختياري)' }), untilI]),
    el('label', { class: 'tog' }, [el('input', { type: 'checkbox', checked: active, onchange: function (e) { active = e.target.checked; } }), el('span', { text: 'ظاهرة' })])],
  acts: [{ t: 'نشر', cls: 'dark', fn: async function () { try { await API6.me('bc_save', JSON.stringify({ id: b.id, title: tI.value, body: bI.value, kind: kind, link: lI.value, programs: $$('input:checked', progs).map(function (i) { return i.value; }), until: untilI.value ? new Date(untilI.value + 'T23:59:59').getTime() : 0, active: active })); toast('نُشرت'); loadNews(); showAdmin('broadcasts'); } catch (e) { toast(e.message); } } }, { t: 'إلغاء' }] });
}

/* ---------- سجل التحديثات ---------- */
async function aChangelog(body) {
  aHead(body, 'سجل التحديثات', 'ما يكتب هنا يظهر للمستخدمين في «ما الجديد». والإصدار الكبير يظهر في نافذة مرة.', [el('button', { type: 'button', class: 'btn dark', onclick: function () { clForm(null); } }, [ico('plus'), 'إصدار جديد'])]);
  const list = await API6.json('cl_list');
  body.appendChild(el('div', {}, list.map(function (v, i) { return el('div', { class: 'card flat arow2' }, [el('div', {}, [el('div', { class: 'row' }, [el('span', { class: 'pill ' + (v.major ? 'pu' : ''), text: v.v }), el('b', { text: v.title }), el('span', { class: 'tiny', text: v.date })]), el('ul', { class: 'nlist small' }, (v.items || []).map(function (it) { return el('li', { text: it.t + (it.d ? ' — ' + it.d : '') }); }))]),
    el('button', { type: 'button', class: 'btn sm line', text: 'تعديل', onclick: function () { clForm(i); } })]); })));
  function clForm(i) {
    const v = i == null ? { v: '', date: new Date().toISOString().slice(0, 10), title: '', items: [], major: false } : JSON.parse(JSON.stringify(list[i]));
    const vI = el('input', { type: 'text', class: 'inp', dir: 'ltr', value: v.v, placeholder: '6.1.0', 'aria-label': 'الإصدار' }), tI = el('input', { type: 'text', class: 'inp', value: v.title, placeholder: 'العنوان', 'aria-label': 'العنوان' });
    const itI = el('textarea', { class: 'inp', rows: '6', 'aria-label': 'العناصر', placeholder: 'كل سطر ميزة: العنوان — الشرح', text: (v.items || []).map(function (it) { return it.t + (it.d ? ' — ' + it.d : ''); }).join('\n') });
    let major = !!v.major;
    modal({ title: 'إصدار', wide: true, body: [el('div', { class: 'grid two' }, [vI, tI]), itI, el('label', { class: 'tog' }, [el('input', { type: 'checkbox', checked: major, onchange: function (e) { major = e.target.checked; } }), el('span', { text: 'إصدار كبير (يظهر في نافذة مرة)' })])],
      acts: [{ t: 'حفظ', cls: 'dark', fn: async function () {
        v.v = vI.value.trim(); v.title = tI.value.trim(); v.major = major; v.items = itI.value.split('\n').map(function (l) { const p = l.split(/\s+[—-]\s+/); return { t: (p[0] || '').trim(), d: (p.slice(1).join(' — ') || '').trim() }; }).filter(function (it) { return it.t; });
        const nl = list.slice(); if (i == null) nl.unshift(v); else nl[i] = v;
        try { await API6.me('cl_save', JSON.stringify(nl)); toast('حُفظ'); loadNews(); showAdmin('changelog'); } catch (e) { toast(e.message); }
      } }, { t: 'إلغاء' }] });
  }
}

/* ---------- الإعدادات ---------- */
async function aSettings(body) {
  aHead(body, 'الإعدادات', '', []);
  let s; try { s = await API6.me('set_get'); } catch (e) { body.appendChild(el('p', { class: 'err', text: e.message })); return; }
  const aiOn = el('input', { type: 'checkbox', checked: !!s.ai.enabled }), model = el('input', { type: 'text', class: 'inp', dir: 'ltr', value: s.ai.model, 'aria-label': 'النموذج' }), perDay = el('input', { type: 'number', class: 'inp', min: '0', max: '500', value: String(s.ai.perDay), 'aria-label': 'الحد اليومي' });
  const groqTok = el('input', { type: 'password', class: 'inp', dir: 'ltr', autocomplete: 'off', placeholder: s.groqOn ? '•••••••• (اترك فارغاً لإبقائه)' : 'gsk_…', 'aria-label': 'مفتاح Groq' });
  const groqM = el('input', { type: 'text', class: 'inp', dir: 'ltr', value: s.ai.groqModel || 'openai/gpt-oss-120b', 'aria-label': 'نموذج Groq' });
  const route = Object.assign({}, s.routeDefault || {}, s.ai.route || {});
  const ROUTE_N = [['intake', 'فهم الفكرة'], ['caption', 'النص المصاحب'], ['outline', 'مخطط العرض'], ['imgq', 'كلمات الصور'], ['week', 'تقرير الأسبوع'], ['spell', 'التصحيح والتشكيل'], ['design', 'اقتراح التصاميم'], ['creative', 'دعه يبدع'], ['review', 'مراجعة التصميم']];
  const routeBox = el('div', { class: 'routes' }, ROUTE_N.map(function (r) { return el('div', { class: 'routerow' }, [el('span', { text: r[1] }), segOf([['gemini', 'Gemini'], ['groq', 'Groq']], route[r[0]] || 'gemini', function (v) { route[r[0]] = v; })]); }));
  const lightM = el('input', { type: 'text', class: 'inp', dir: 'ltr', value: s.ai.light != null ? s.ai.light : 'gemini-3.5-flash-lite', 'aria-label': 'نموذج المهام الخفيفة' });
  const fbm = el('input', { type: 'text', class: 'inp', dir: 'ltr', value: s.ai.fallback != null ? s.ai.fallback : 'gemini-3.6-flash,gemini-3.5-flash-lite', 'aria-label': 'النماذج الاحتياطية' });
  const tgTok = el('input', { type: 'password', class: 'inp', dir: 'ltr', autocomplete: 'off', placeholder: s.tgOn ? '•••••••• (اترك فارغاً لإبقائه)' : '123456789:AAF…', 'aria-label': 'رمز البوت' });
  const pxKey = el('input', { type: 'password', class: 'inp', dir: 'ltr', autocomplete: 'off', placeholder: s.pexelsOn ? '•••••••• (اترك فارغاً لإبقائه)' : 'مفتاح Pexels', 'aria-label': 'مفتاح Pexels' });
  const upPerm = el('input', { type: 'checkbox', checked: !!s.uploadsNeedPerm }), maxMb = el('input', { type: 'number', class: 'inp', min: '1', max: '20', value: String(s.maxUploadMb || 20), 'aria-label': 'أقصى حجم' });
  body.appendChild(el('div', { class: 'grid two' }, [
    el('div', { class: 'card' }, [el('span', { class: 'icon-tile t-pu' }, [ico('ai')]), el('h3', { text: 'اصنع إعلانك بالذكاء' }),
      el('p', { class: 'small ' + (s.aiKey ? 'ok' : 'err'), text: s.aiKey ? 'مفتاح Gemini مضبوط في الخادم.' : 'لم يُضبط مفتاح Gemini بعد (خطوة في محرر Apps Script).' }),
      el('label', { class: 'tog' }, [aiOn, el('span', { text: 'مفعّل' })]),
      el('div', { class: 'fld' }, [el('label', { text: 'النموذج' }), model, el('small', { text: 'أقوى نموذج مجاني الآن: gemini-3.8-flash' })]),
      el('div', { class: 'fld' }, [el('label', { text: 'نموذج المهام الخفيفة' }), lightM, el('small', { text: 'فهم الفكرة والنص المصاحب والتصحيح والمخطط وتقرير الأسبوع. حصته المجانية ٥٠٠ طلب يومياً، بينما النموذج الأقوى ٢٠ فقط.' })]),
      el('div', { class: 'fld' }, [el('label', { text: 'نماذج احتياطية عند ازدحام جوجل' }), fbm, el('small', { text: 'يُعيد المحاولة ثم ينتقل إليها بالترتيب. افصل بينها بفاصلة.' })]),
      el('div', { class: 'fld' }, [el('label', { text: 'حد الطلبات لكل مستخدم يومياً' }), perDay]),
      el('p', { class: 'tiny', text: 'في الخطة المجانية تستعمل جوجل الطلبات لتحسين منتجاتها، فلا تُرسل بيانات شخصية للطلاب. والمساعد لمن منحته صلاحيته.' })]),
    el('div', { class: 'card' }, [el('span', { class: 'icon-tile t-bl' }, [ico('ai')]), el('h3', { text: 'توزيع المهام بين المساعدين' }),
      el('p', { class: 'small ' + (s.groqOn ? 'ok' : 'err'), text: s.groqOn ? 'مفتاح Groq مضبوط: المهام النصية تذهب إليه، وما يحتاج رؤية الصور يبقى مع Gemini.' : 'بلا مفتاح Groq: كل المهام على Gemini. المفتاح مجاني من console.groq.com/keys (ألف طلب يومياً، ولا يُدرَّب على بياناتكم).' }),
      el('div', { class: 'fld' }, [el('label', { text: 'مفتاح Groq (يُحفظ في الخادم ولا يُعرض)' }), groqTok]),
      el('div', { class: 'fld' }, [el('label', { text: 'نموذج Groq' }), groqM]),
      el('p', { class: 'tiny', text: 'من يتولى كل مهمة؟ (ما فيه صور أو ملف PDF يذهب إلى Gemini دائماً، وإن تعطل أحدهما أكمل الآخر)' }), routeBox]),
    el('div', { class: 'card' }, [el('span', { class: 'icon-tile t-gr' }, [ico('send')]), el('h3', { text: 'بوت تليجرام' }),
      el('p', { class: 'small ' + (s.tgOn ? 'ok' : 'err'), text: s.tgOn ? 'رمز البوت مضبوط. أضف البوت مشرفاً في قناة كل برنامج، وحدد القناة من إعدادات البرنامج.' : 'لم يُضبط رمز البوت بعد. أنشئ بوتاً من BotFather والصق رمزه هنا.' }),
      el('div', { class: 'fld' }, [el('label', { text: 'رمز البوت (يُحفظ في الخادم ولا يُعرض)' }), tgTok]),
      el('div', { class: 'row' }, [el('button', { type: 'button', class: 'btn sm line', text: 'اختبر البوت', onclick: async function () { try { const r = await API6.me('tg_test'); toast('البوت يعمل: @' + r.username); } catch (e) { toast(e.message); } } })])]),
    el('div', { class: 'card' }, [el('span', { class: 'icon-tile t-bl' }, [ico('upload')]), el('h3', { text: 'الرفع' }),
      el('label', { class: 'tog' }, [upPerm, el('span', { text: 'رفع الصور يحتاج صلاحية' })]),
      el('div', { class: 'fld' }, [el('label', { text: 'أقصى حجم للملف (ميغابايت)' }), maxMb])]),
    el('div', { class: 'card' }, [el('span', { class: 'icon-tile t-or' }, [ico('image')]), el('h3', { text: 'صور مجانية (Pexels)' }),
      el('p', { class: 'small ' + (s.pexelsOn ? 'ok' : 'err'), text: s.pexelsOn ? 'مفتاح Pexels مضبوط: الفريق يبحث عن صور مجانية من المحرر.' : 'بلا مفتاح: أنشئ مفتاحاً مجانياً من pexels.com/api ثم ألصقه هنا.' }),
      el('div', { class: 'fld' }, [el('label', { text: 'مفتاح Pexels (يُحفظ في الخادم ولا يُعرض)' }), pxKey]),
      el('p', { class: 'tiny', text: 'الحد المجاني ٢٠٠ بحث في الساعة. الصورة التي يختارها المستخدم تُحفظ بأصلها كاملاً في مكتبته، ويقترحها للبرنامج فتوافق أنت من «الشعارات والصور».' })])
  ]));
  body.appendChild(el('button', { type: 'button', class: 'btn dark', text: 'حفظ الإعدادات', onclick: async function () {
    const o = { ai: { enabled: aiOn.checked, model: model.value.trim(), fallback: fbm.value.trim(), light: lightM.value.trim(), groqModel: groqM.value.trim(), route: route, perDay: +perDay.value }, uploadsNeedPerm: upPerm.checked, maxUploadMb: +maxMb.value }; if (tgTok.value.trim()) o.tgToken = tgTok.value.trim(); if (pxKey.value.trim()) o.pexelsKey = pxKey.value.trim(); if (groqTok.value.trim()) o.groqKey = groqTok.value.trim();
    try { await API6.me('set_save', JSON.stringify(o)); toast('حُفظت'); await refreshBundle(); showAdmin('settings'); } catch (e) { toast(e.message); }
  } }));
}

/* ---------- سجل النشاط ---------- */
async function aAudit(body) {
  aHead(body, 'سجل النشاط', 'كل تعديل إداري: من فعله ومتى.', []);
  const sk = loading(body);
  let list; try { list = await API6.me('audit_list'); } catch (e) { sk.remove(); body.appendChild(el('p', { class: 'err', text: e.message })); return; }
  sk.remove();
  body.appendChild(el('div', { class: 'atable' }, list.map(function (x) { return el('div', { class: 'arow slim' }, [el('span', { class: 'tiny', text: fmtDate(x.at) + ' ' + new Date(x.at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) }), el('b', { text: x.name }), el('span', { text: x.what }), el('span', { class: 'tiny', text: x.d })]); })));
}

/* ---------- أرشيف التصاميم: كل ما نُزّل أو شورك أو حُفظ، مع صاحبه ووقته ومساره ---------- */
const ARC_PV = {};
const VIA_NAME = { png: 'PNG', jpg: 'JPG', pdf: 'PDF', share: 'مشاركة', save: 'حفظ' };
async function aArchive(body) {
  let m = '', prog = '', q = '', trk = '', data = null;
  const monthSel = el('select', { class: 'inp sm', 'aria-label': 'الشهر', onchange: function (e) { m = e.target.value; load(); } });
  const trkSel = el('select', { class: 'inp sm', 'aria-label': 'الهوية', onchange: function (e) { trk = e.target.value; fill(); } });
  const search = el('input', { type: 'search', class: 'inp sm', placeholder: 'اسم التصميم أو صاحبه…', 'aria-label': 'بحث', oninput: function (e) { q = norm(e.target.value); fill(); } });
  aHead(body, 'أرشيف التصاميم', 'كل تصميم نُزّل أو شورك أو حُفظ في ' + (isSuper() ? 'المنصة' : 'برامجك') + '، مع صاحبه ووقته ومساره. يُفتح نسخةً بجودته الأصلية في المحرر، ولا يتغير الأصل.', [monthSel, progSelect('', true, function (v) { prog = v; load(); }), trkSel, search]);
  const sum = el('p', { class: 'muted small arcsum' }); body.appendChild(sum);
  const grid = el('div', { class: 'mgrid arcgrid' }); body.appendChild(grid);
  async function load() {
    grid.innerHTML = ''; sum.textContent = ''; const sk = loading(grid);
    try { data = await API6.me('arc_list', m, prog); } catch (e) { sk.remove(); grid.appendChild(el('p', { class: 'err', text: e.message })); return; }
    sk.remove(); m = data.m;
    monthSel.innerHTML = '';
    (data.months.length ? data.months : [data.m]).forEach(function (k) { monthSel.appendChild(el('option', { value: k, text: monthName(k), selected: k === m })); });
    const tr = {}; data.list.forEach(function (x) { if (x.track) tr[x.track] = x.trackName || x.track; });
    trkSel.innerHTML = ''; trkSel.appendChild(el('option', { value: '', text: 'كل الهويات' }));
    Object.keys(tr).forEach(function (k) { trkSel.appendChild(el('option', { value: k, text: tr[k], selected: k === trk })); });
    if (!tr[trk]) trk = '';
    fill();
  }
  function fill() {
    grid.innerHTML = '';
    const list = data.list.filter(function (x) { return (!trk || x.track === trk) && (!q || norm([x.name, x.uname, x.tplName].join(' ')).indexOf(q) >= 0); });
    const users = {}; list.forEach(function (x) { users[x.uid] = 1; });
    sum.textContent = list.length ? list.length + ' تصميماً من ' + Object.keys(users).length + ' مستخدماً في ' + monthName(m) + '.' : '';
    if (!list.length) { grid.appendChild(el('p', { class: 'empty', text: data.list.length ? 'لا تصميم يطابق البحث.' : 'لم يُنزَّل تصميم في هذا الشهر بعد.' })); return; }
    const need = [];
    list.forEach(function (x, i) {
      const img = el('img', { alt: '', loading: 'lazy' });
      const key = m + x.id; if (ARC_PV[key]) img.src = ARC_PV[key]; else if (x.pv) need.push([x.id, img]);
      grid.appendChild(el('button', { type: 'button', class: 'mcard hover-lift arccard', style: '--d:' + (i % 8), onclick: function () { arcDetail(m, x, img.src); } }, [
        el('span', { class: 'mthumb' }, [img, x.kind === 'deck' ? el('span', { class: 'pill mdeck', text: (x.pages || 1) + ' شرائح' }) : null, el('span', { class: 'pill mshare', text: VIA_NAME[x.via] || x.via })]),
        el('span', { class: 'mmeta' }, [el('b', { text: x.name }), el('span', { class: 'tiny', text: [x.uname, x.trackName].filter(Boolean).join(' · ') }), el('span', { class: 'tiny', text: fmtTime(x.upd || x.at) + (x.n > 1 ? ' · ' + x.n + ' مرات' : '') })])
      ]));
    });
    loadPv(need);
  }
  async function loadPv(need) {
    for (let i = 0; i < need.length; i += 24) {
      const part = need.slice(i, i + 24);
      let r = {}; try { r = await API6.me('arc_thumbs', m, part.map(function (p) { return p[0]; })); } catch (e) { return; }
      part.forEach(function (p) { if (!r[p[0]]) return; const url = URL.createObjectURL(b64ToBlob(r[p[0]], 'image/jpeg')); ARC_PV[m + p[0]] = url; p[1].src = url; });
    }
  }
  load();
}
function monthName(k) { try { const p = k.split('-'); return new Intl.DateTimeFormat('ar', { month: 'long', year: 'numeric' }).format(new Date(+p[0], +p[1] - 1, 1)); } catch (e) { return k; } }
function arcDetail(m, x, src) {
  const prog = V6.bundle.programs.find(function (p) { return p.id === x.program; });
  const rows = [['صمّمه', x.uname], ['البرنامج', prog ? prog.name : x.program], ['الهوية', x.trackName || x.track], ['القالب', x.tplName || x.tpl], ['المقاس', (SIZES[x.size] || {}).name || x.size],
    ['أول مرة', fmtTime(x.at)], ['آخر مرة', fmtTime(x.upd || x.at)], ['ما جرى عليه', Object.keys(x.vias || {}).map(function (k) { return (VIA_NAME[k] || k) + ' ×' + x.vias[k]; }).join('، ')]];
  if (x.kind === 'deck') rows.push(['الشرائح', String(x.pages || 1)]);
  modal({ title: x.name, wide: true, body: [
    el('div', { class: 'arcdet' }, [
      src ? el('img', { src: src, alt: x.name, class: 'arcbig' }) : el('div', { class: 'arcbig empty', text: 'بلا معاينة' }),
      el('dl', { class: 'arcdl' }, rows.reduce(function (o, r) { o.push(el('dt', { text: r[0] }), el('dd', { text: r[1] || '—' })); return o; }, []))
    ])
  ], acts: [{ t: 'افتحه في المحرر', cls: 'dark', fn: function () { go('#/arc/' + m + '/' + x.id); } }, { t: 'إغلاق' }] });
}

/* ---------- النماذج والقوالب ---------- */
async function aModels(body) {
  aHead(body, 'النماذج والقوالب', 'النموذج تصميم جاهز يختاره المشرف، فيظهر لكل مستخدمي البرنامج في الرئيسية والمعرض ويبدؤون منه بنسخة لهم.');
  body.appendChild(el('div', { class: 'card note' }, [el('p', { class: 'small', text: 'لتجعل تصميماً نموذجاً: افتحه من «تصاميمي» أو «تصاميم الفريق» واختر «اجعله نموذجاً» من قائمته، أو فعّل الخيار عند حفظه. ويمكنك فتح أي تصميم من الأرشيف، وحفظه، ثم جعله نموذجاً.' })]));
  const grid = el('div', { class: 'mgrid' }); body.appendChild(grid);
  async function loadModels() {
    grid.innerHTML = ''; const sk = loading(grid);
    let list = [];
    try { list = (await API6.me('item_list')).filter(function (x) { return x.model && canAdminProg(x.program); }); } catch (e) { sk.remove(); grid.appendChild(el('p', { class: 'err', text: e.message })); return; }
    sk.remove();
    if (!list.length) { grid.appendChild(el('p', { class: 'empty', text: 'لا نماذج بعد.' })); return; }
    list.forEach(function (x) {
      const T = TRACKS[x.track], prog = V6.bundle.programs.find(function (p) { return p.id === x.program; });
      grid.appendChild(el('div', { class: 'mcard' }, [
        el('a', { href: '#/d/' + x.id, class: 'mthumb' }, [el('img', { src: x.thumb || '', alt: '', loading: 'lazy' })]),
        el('div', { class: 'mmeta' }, [el('b', { text: x.name }), el('span', { class: 'tiny', text: [prog ? prog.name : '', T ? T.name : '', x.owner].filter(Boolean).join(' · ') })]),
        el('button', { type: 'button', class: 'btn sm line', style: 'margin:0 14px 14px', text: 'أزله من النماذج', onclick: async function () { try { await API6.me('item_model', x.id, false); toast('أُزيل'); loadModels(); } catch (e) { toast(e.message); } } })
      ]));
    });
  }
  loadModels();
  if (!isSuper()) return;
  // حزم القوالب: ملفات برمجية تضيف قوالب وهويات للجميع (المدير العام وحده، لأنها تعمل في متصفح كل مستخدم)
  body.appendChild(el('div', { class: 'ahead', style: 'margin-top:36px' }, [el('div', {}, [el('h2', { text: 'حزم القوالب' }), el('p', { class: 'muted small', text: 'كل حزمة ملف يضيف قوالب (وقد يضيف هويات). تُحمَّل لكل المستخدمين عند فتحهم المنصة. المهمة الأسبوعية تضيف حزمها هنا، ولك أن ترفع حزمة أو توقف أخرى دون حذفها.' })])]));
  const file = el('input', { type: 'file', accept: '.js,text/javascript', hidden: true, onchange: async function (e) {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    const code = await f.text();
    if (!/PACK\s*\(/.test(code)) { toast('هذا ليس ملف حزمة قوالب'); return; }
    try { new Function(code); } catch (er) { modal({ title: 'في الحزمة خطأ', body: [el('p', { class: 'muted', text: 'لم تُرفع، لأن فيها خطأ برمجياً يمنع عملها:' }), el('pre', { class: 'code', text: String(er.message) })], acts: [{ t: 'حسناً', cls: 'dark' }] }); return; }
    if (!(await ask('رفع الحزمة', '«' + f.name + '» ستظهر قوالبها لكل المستخدمين عند فتحهم المنصة القادم.', 'ارفعها'))) return;
    try { await API6.me('pack_put', f.name, code); toast('رُفعت الحزمة'); loadPacks(); } catch (er) { toast(er.message); }
  } });
  const table = el('div', { class: 'plist' });
  body.appendChild(el('div', { class: 'row wrapr', style: 'margin-bottom:14px' }, [file, el('button', { type: 'button', class: 'btn dark', onclick: function () { file.click(); } }, [ico('upload'), 'ارفع حزمة'])]));
  body.appendChild(table);
  async function loadPacks() {
    table.innerHTML = ''; const sk = loading(table);
    let list = [];
    try { list = await API6.me('pack_list'); } catch (e) { sk.remove(); table.appendChild(el('p', { class: 'err', text: e.message })); return; }
    sk.remove();
    if (!list.length) { table.appendChild(el('p', { class: 'empty', text: 'لا حزم بعد.' })); return; }
    list.slice().reverse().forEach(function (p) {
      const tg = el('input', { type: 'checkbox', checked: p.on, onchange: async function (e) { try { await API6.me('pack_toggle', p.name, e.target.checked); toast(e.target.checked ? 'تعمل الحزمة' : 'أُوقفت الحزمة (لم تُحذف)'); } catch (er) { toast(er.message); e.target.checked = !e.target.checked; } } });
      table.appendChild(el('div', { class: 'prow card' }, [el('span', { class: 'icon-tile t-or' }, [ico('pack')]), el('div', { class: 'pm' }, [el('b', { text: p.name, dir: 'ltr' }), el('span', { class: 'tiny', text: fmtDate(p.at) + ' · ' + Math.max(1, Math.round(p.size / 1024)) + ' ك.ب' })]), el('label', { class: 'tog' }, [tg, el('span', { text: 'تعمل' })])]));
    });
  }
  loadPacks();
}

/* ---------- الذكاء الاصطناعي: ماذا يفعل، وكم استُعمل، ومن، وهل نجح ---------- */
const AI_KIND_N = { intake: 'فهم الفكرة', design: 'اقتراح تصاميم', creative: 'دعه يبدع', caption: 'نص مصاحب', outline: 'مخطط عرض', slides: 'بناء شرائح', spell: 'تصحيح وتشكيل', imgq: 'كلمات بحث صور', review: 'مراجعة تصميم', week: 'تقرير الأسبوع', weekly: 'المهمة الأسبوعية', test: 'تجربة' };
async function aAI(body) {
  let m = '', prog = '', data = null;
  const monthSel = el('select', { class: 'inp sm', 'aria-label': 'الشهر', onchange: function (e) { m = e.target.value; load(); } });
  aHead(body, 'الذكاء الاصطناعي', 'كل ما يطلبه المستخدمون من المساعد يُسجَّل هنا: من، ومتى، وماذا، وهل نجح. المفتاح والنموذج في الإعدادات.', [monthSel, progSelect('', true, function (v) { prog = v; load(); })]);
  body.appendChild(el('div', { class: 'card note' }, [el('b', { text: 'ماذا يفعل المساعد في المنصة؟' }), el('ul', { class: 'nlist small' }, [
    el('li', { text: 'فهم الفكرة: يستخرج من كلمات المستخدم النوع والجمهور والمقدّم والوقت والمكان، ليسأل فقط عمّا نقص.' }),
    el('li', { text: 'اقتراح التصاميم: يختار قوالب من المكتبة ويكتب نصوصها، ويصمم تخطيطات حرة جديدة من ألوان الهوية. لا يولّد صوراً.' }),
    el('li', { text: 'النص المصاحب: يصوغ رسالة تليجرام من معلومات التصميم على نماذج رسائل البرنامج.' }),
    el('li', { text: 'الشرائح: يحوّل نصاً أو ملفاً إلى مخطط عرض يراجعه المستخدم ثم إلى شرائح.' }),
    el('li', { text: 'مراجعة التصميم: يرى صورة التصميم ويقيّمه من ١٠٠ بمبادئ التصميم، ويقترح إصلاحات مرتبطة بنصائح المنصة.' }),
    el('li', { text: 'أسبوعك في أثر: كل سبت يكتب لكل عضو تقييماً تحفيزياً من أرقامه، وتحدياً للأسبوع القادم.' }),
    el('li', { text: 'الحدود: نموذج Gemini المجاني، بحد يومي لكل مستخدم، ويعمل عبر الخادم فلا يرى أحد المفتاح. لا تُرسل بيانات الطلاب الشخصية.' })])]));
  await aiSkillsCard(body);
  const box = el('div'); body.appendChild(box);
  async function load() {
    box.innerHTML = ''; const sk = loading(box);
    try { data = await API6.me('ai_log', m, prog); } catch (e) { sk.remove(); box.appendChild(el('p', { class: 'err', text: e.message })); return; }
    sk.remove(); m = data.m;
    if (!monthSel.children.length) { for (let i = 0; i < 6; i++) { const d = new Date(); d.setMonth(d.getMonth() - i); const k = d.toISOString().slice(0, 7); monthSel.appendChild(el('option', { value: k, text: monthName(k), selected: k === m })); } }
    const S = data.sum;
    box.appendChild(el('div', { class: 'kpis' }, [kpi('الطلبات هذا الشهر', S.n, 'طلباً'), kpi('نجح منها', S.ok, S.n ? Math.round(S.ok / S.n * 100) + '٪' : '—'), kpi('متوسط الزمن', S.ms ? (S.ms / 1000).toFixed(1) : 0, 'ثانية'), kpi('الحد اليومي لكل مستخدم', (data.settings || {}).perDay || 0, (data.settings || {}).model || '')]));
    const days = {}; Object.keys(S.days).forEach(function (k) { days[k] = { exports: S.days[k] }; });
    box.appendChild(el('div', { class: 'card' }, [el('h3', { text: 'الطلبات يومياً' }), barChart(dayRows(days, 30), 'exports', 'طلباً')]));
    box.appendChild(el('div', { class: 'grid two' }, [
      el('div', { class: 'card' }, [el('h3', { text: 'بحسب المهمة' }), hbars(topOf(S.kinds, 8), function (k) { return AI_KIND_N[k] || k; })]),
      el('div', { class: 'card' }, [el('h3', { text: 'أكثر المستخدمين' }), hbars(topOf(S.users, 8), function (k) { return k; })])
    ]));
    const errs = topOf(S.errs, 6);
    if (errs.length) box.appendChild(el('div', { class: 'card' }, [el('h3', { text: 'الأخطاء المتكررة' }), hbars(errs, function (k) { return k; })]));
    const tbl = el('div', { class: 'ailog' });
    (data.list || []).slice(0, 60).forEach(function (x) {
      tbl.appendChild(el('div', { class: 'airow' + (x.ok ? '' : ' bad') }, [el('span', { class: 'tiny', text: fmtTime(x.t) }), el('b', { text: x.name }), el('span', { class: 'pill sm', text: AI_KIND_N[x.kind] || x.kind }), el('span', { class: 'aiq', text: x.q || '' }), el('span', { class: 'tiny', text: x.ok ? (x.ms / 1000).toFixed(1) + ' ث' : x.err })]));
    });
    box.appendChild(el('div', { class: 'card' }, [el('h3', { text: 'آخر الطلبات' }), data.list && data.list.length ? tbl : el('p', { class: 'empty', text: 'لا طلبات بعد.' })]));
  }
  load();
}

/* ---------- قناة تليجرام والنصوص المصاحبة لبرنامج ---------- */
function tgForm(p) {
  const tg = Object.assign({ chat: '', link: '', hashtag: '', sign: '' }, p.tg || {});
  const chatI = el('input', { type: 'text', class: 'inp', dir: 'ltr', value: tg.chat, placeholder: '@channel_username أو -1001234567890' });
  const linkI = el('input', { type: 'url', class: 'inp', dir: 'ltr', value: tg.link, placeholder: 'https://…' });
  const hashI = el('input', { type: 'text', class: 'inp', dir: 'auto', value: tg.hashtag, placeholder: 'الأنشطة_التربوية' });
  const signI = el('input', { type: 'text', class: 'inp', dir: 'auto', value: tg.sign, placeholder: 'ننتظركم على خير 🌿' });
  const samples = el('textarea', { rows: '8', dir: 'auto', placeholder: 'الصق هنا رسائل حقيقية من قناتكم، كل رسالة ثم سطر فيه --- بينها. يتعلم المساعد منها الأسلوب والبنية.' }); samples.value = p.samples || '';
  let caps = (p.captions || []).map(function (c) { return Object.assign({}, c); });
  const capBox = el('div', { class: 'caplist' });
  function drawCaps() {
    capBox.innerHTML = '';
    caps.forEach(function (c, i) {
      capBox.appendChild(el('div', { class: 'caprow' }, [
        el('input', { type: 'text', class: 'inp sm', value: c.name, placeholder: 'اسم القالب', oninput: function (e) { c.name = e.target.value; } }),
        el('select', { class: 'inp sm', onchange: function (e) { c.kind = e.target.value; } }, CAP_KINDS.map(function (k) { return el('option', { value: k[0], text: k[1], selected: k[0] === c.kind }); })),
        el('button', { type: 'button', class: 'ib sm', 'aria-label': 'حذف', onclick: function () { caps.splice(i, 1); drawCaps(); } }, [ico('trash')]),
        el('textarea', { rows: '5', dir: 'auto', class: 'captext', oninput: function (e) { c.text = e.target.value; } }, [c.text || ''])
      ]));
    });
    capBox.appendChild(el('div', { class: 'row wrapr' }, [
      el('button', { type: 'button', class: 'btn sm line', onclick: function () { caps.push({ id: newId(), name: 'قالب جديد', kind: 'ann', text: CAP_BASE[0].text }); drawCaps(); } }, [ico('plus'), 'قالب من الأساسي']),
      el('button', { type: 'button', class: 'btn sm ghost', onclick: function () { caps.push({ id: newId(), name: 'قالب فارغ', kind: 'free', text: '<b>{title}</b>\n\n{sub}' }); drawCaps(); } }, ['قالب فارغ'])]));
  }
  drawCaps();
  modal({ title: 'قناة ' + p.name + ' والنصوص المصاحبة', wide: true, body: [
    el('p', { class: 'tiny', text: 'أضف بوت المنصة مشرفاً في القناة (بصلاحية النشر)، ثم اكتب اسم القناة هنا. كل من له صلاحية «الإرسال» في هذا البرنامج يرسل إليها من المحرر.' }),
    el('div', { class: 'grid two' }, [el('div', { class: 'fld' }, [el('label', { text: 'القناة أو المجموعة' }), chatI]), el('div', { class: 'fld' }, [el('label', { text: 'رابط الحضور أو التسجيل المعتاد {link}' }), linkI]), el('div', { class: 'fld' }, [el('label', { text: 'الوسم المعتاد {hashtag}' }), hashI]), el('div', { class: 'fld' }, [el('label', { text: 'توقيع ختامي {sign}' }), signI])]),
    el('h4', { class: 'psh', text: 'القوالب الكتابية الخاصة بالبرنامج' }), el('p', { class: 'tiny', text: 'المتغيرات: ' + CAP_VARS.map(function (v) { return '{' + v[0] + '} ' + v[1]; }).join(' · ') + '. والتنسيق بوسوم تليجرام: <b> <i> <u> <blockquote>.' }), capBox,
    el('h4', { class: 'psh', text: 'نماذج رسائلكم (يتعلم منها المساعد)' }), samples
  ], acts: [{ t: 'حفظ', cls: 'dark', keep: true, fn: async function (close) {
    try { await API6.me('prog_save', JSON.stringify({ id: p.id, tg: { chat: chatI.value.trim(), link: linkI.value.trim(), hashtag: hashI.value.trim(), sign: signI.value.trim() }, captions: caps.filter(function (c) { return c.text && c.text.trim(); }), samples: samples.value })); close(); await refreshBundle(); toast('حُفظ'); showAdmin('programs'); }
    catch (e) { toast(e.message); }
  } }, { t: 'إلغاء' }] });
}
/* ---------- منشورات القناة: المرسل والمجدول ---------- */
const TG_ST = { queued: ['مجدول', 'bl'], sent: ['أُرسل', 'gr'], failed: ['فشل', 'rd'], cancelled: ['أُلغي', ''] };
async function aTg(body) {
  let prog = '';
  aHead(body, 'منشورات القناة', 'ما أُرسل إلى قنوات تليجرام من المنصة وما جُدول. القناة والقوالب الكتابية تُضبط من «البرامج والهويات»، ورمز البوت من الإعدادات.', [progSelect('', true, function (v) { prog = v; load(); })]);
  const box = el('div'); body.appendChild(box);
  async function load() {
    box.innerHTML = ''; const sk = loading(box);
    let list; try { list = await API6.me('tg_queue', prog); } catch (e) { sk.remove(); box.appendChild(el('p', { class: 'err', text: e.message })); return; }
    sk.remove();
    if (!list.length) { box.appendChild(el('p', { class: 'empty', text: 'لا منشورات بعد.' })); return; }
    const tbl = el('div', { class: 'ailog' });
    list.forEach(function (x) {
      const st = TG_ST[x.status] || [x.status, ''];
      tbl.appendChild(el('div', { class: 'airow' + (x.status === 'failed' ? ' bad' : '') }, [el('span', { class: 'tiny', text: fmtTime(x.when) }), el('b', { text: x.title || '—' }), el('span', { class: 'pill sm ' + st[1], text: st[0] }), el('span', { class: 'aiq', text: x.name + ' · ' + capPlain(x.caption || '').slice(0, 80) + (x.err ? ' · ' + x.err : '') }),
        x.status === 'queued' ? el('button', { type: 'button', class: 'btn sm ghost', text: 'إلغاء', onclick: async function () { try { await API6.me('tg_cancel', x.id); load(); } catch (e) { toast(e.message); } } }) : (x.link ? el('a', { class: 'btn sm ghost', href: x.link, target: '_blank', rel: 'noopener', text: 'افتح' }) : el('span'))]));
    });
    box.appendChild(tbl);
  }
  load();
}
