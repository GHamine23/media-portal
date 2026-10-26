/* ================= الأقسام: الإعلانات والتصاميم، والعروض والشرائح، والمواد التعليمية =================
   كل مسار (هوية) يُفتح على أقسامه: شريط أقسام بارز أعلى صفحات المسار، وصفحة «الأقسام» تختار فيها القسم ثم المسار،
   وبطاقات الأقسام في الرئيسية، و«الأقسام» في شريط التنقل. */
function secHasStudy() { return visibleTpls().some(function (t) { return t.type === 'study'; }); }
function secList() {
  return [
    { id: 'design', name: 'الإعلانات والتصاميم', short: 'الإعلانات', desc: 'إعلانات اللقاءات والمسابقات والتهاني، وأغلفة يوتيوب ومنشورات التواصل', ic: 'image', tone: 't-or', href: function (tid) { return '#/g/' + tid; } },
    progFeat('slides') ? { id: 'slides', name: 'العروض والشرائح', short: 'العروض', desc: 'دروس ومحاضرات تُعرض بملء الشاشة، مع القلم والقرعة ونقاط الفرق وإجابات الطلاب', ic: 'slides', tone: 't-bl', star: true, href: function (tid) { return '#/s/' + tid; } } : null,
    secHasStudy() ? { id: 'study', name: 'المواد التعليمية', short: 'المواد', desc: 'أوراق عمل وملخصات وبطاقات مراجعة وكتيّبات للطباعة بمقاس A4', ic: 'book', tone: 't-gr', href: function (tid) { return '#/g/' + tid + '/study'; } } : null
  ].filter(Boolean);
}
function secCount(id) {
  const V = visibleTpls();
  if (id === 'design') return V.filter(function (t) { return t.type !== 'study'; }).length;
  if (id === 'study') return V.filter(function (t) { return t.type === 'study'; }).length;
  return typeof sampleDecks === 'function' && tracksOf()[0] ? sampleDecks(tracksOf()[0]).length : 0;
}
function secSub(s) { const n = secCount(s.id); return s.id === 'slides' ? (n ? n + ' عروض جاهزة · وأدوات للدرس' : 'عروض وأدوات للدرس') : n + ' قالباً'; }
// شريط الأقسام أعلى صفحات المسار
function secBar(T, active) {
  const list = secList(); if (list.length < 2) return null;
  return el('nav', { class: 'secbar wrap', 'aria-label': 'أقسام ' + T.name }, list.map(function (s) {
    const on = s.id === active;
    return el('a', { class: 'secb sc-' + s.tone.slice(2) + (on ? ' on' : ''), href: s.href(T.id), 'aria-current': on ? 'page' : null, 'data-sec': s.id }, [
      el('span', { class: 'icon-tile ' + s.tone }, [ico(s.ic)]),
      el('span', { class: 'secb-t' }, [el('b', { text: s.name }), el('small', { text: secSub(s) })]),
      s.star && !on ? el('span', { class: 'pill pu secstar', text: 'مهم' }) : null
    ]);
  }));
}
// اختيار المسار بعد القسم: مباشرة إن كان مساراً واحداً
function secGo(s) {
  const tr = tracksOf(); if (!tr.length) return;
  if (tr.length === 1) { go(s.href(tr[0].id)); return; }
  go('#/sections?s=' + s.id);
}
// صفحة الأقسام بخطوتين: (١) الأقسام الثلاثة وحدها، (٢) صفحة القسم وفيها مساراته، فتختار المسار وتدخل
function showSections6() {
  const tracks = tracksOf(), list = secList();
  if (!tracks.length) { go('#/'); return; }
  const want = (location.hash.split('?s=')[1] || '').replace(/[^a-z]/g, '');
  const cur = list.find(function (s) { return s.id === want; });
  const P = V6.prog ? V6.prog.name : '';
  if (!cur) {
    document.title = 'الأقسام';
    view(el('div', { class: 'wrap page secpage' }, [
      el('div', { class: 'phead' }, [el('span', { class: 'eyebrow', text: P }), H('h1', 'الأقسام'), el('p', { class: 'muted rv', text: 'اختر القسم، ثم المسار.' })]),
      el('div', { class: 'secpick3' }, list.map(function (s, i) {
        return el('a', { class: 'seccard3 hover-lift rv sc-' + s.tone.slice(2), style: '--d:' + i, href: tracks.length === 1 ? s.href(tracks[0].id) : '#/sections?s=' + s.id, 'data-sec': s.id }, [
          el('span', { class: 'icon-tile ' + s.tone }, [ico(s.ic)]),
          el('b', { text: s.name }), el('span', { class: 'muted small', text: s.desc }),
          el('span', { class: 'hsecmeta' }, [el('small', { text: secSub(s) }), s.star ? el('span', { class: 'pill pu', text: 'مهم' }) : null, ico('chev')])
        ]);
      }))
    ]));
    return;
  }
  document.title = cur.name;
  const last = TRACKS[ls('lastTrack')] ? ls('lastTrack') : '';
  const groups = [['track', 'المسارات'], ['act', 'الأنشطة والهويات']];
  const known = tracks.every(function (t) { return groups.some(function (g) { return g[0] === t.group; }); });
  const sets = known ? groups.map(function (g) { return [g[1], tracks.filter(function (t) { return t.group === g[0]; })]; }).filter(function (x) { return x[1].length; }) : [['', tracks]];
  const body = [];
  sets.forEach(function (g) {
    if (g[0] && sets.length > 1) body.push(el('h3', { class: 'secgh', text: g[0] }));
    const n = g[1].length, cols = n <= 5 ? Math.max(2, n) : [5, 4, 3].sort(function (a, b) { return ((a - n % a) % a) - ((b - n % b) % b) || b - a; })[0];   // أعمدة تمتلئ فلا تبقى بطاقة وحدها
    body.push(el('div', { class: 'sectracks', style: '--cols:' + cols }, g[1].map(function (t, i) {
      return el('a', { class: 'sectr hover-lift rv' + (t.id === last ? ' last' : ''), style: '--tc:' + t.c.p + ';--d:' + Math.min(i, 8), href: cur.href(t.id) }, [
        IMG[t.logo] ? el('img', { src: ASSETS[t.logo], alt: '' }) : el('i', { style: 'background:' + t.c.p }),
        el('span', { text: t.full.replace('ـ', '') }), ico('chev')]);
    })));
  });
  view(el('div', { class: 'wrap page secpage sc-' + cur.tone.slice(2) }, [
    el('a', { class: 'secback', href: '#/sections' }, [ico('chev'), el('span', { text: 'الأقسام' })]),
    el('div', { class: 'sechead2' }, [el('span', { class: 'icon-tile ' + cur.tone }, [ico(cur.ic)]), el('div', {}, [H('h1', cur.name), el('p', { class: 'muted', text: cur.desc })])]),
    el('p', { class: 'secstep', text: 'اختر المسار' }),
    el('div', { class: 'secgrid2' }, body)
  ]));
}
// الرئيسية: الأقسام في مكان بارز تحت الترحيب
function homeSections() {
  const list = secList(); if (list.length < 2 || !tracksOf().length) return null;
  return el('section', { class: 'hsec homesecs' }, [
    el('div', { class: 'shead' }, [H('h2', 'الأقسام'), el('a', { class: 'btn sm line', href: '#/sections', text: 'كل الأقسام والمسارات' })]),
    el('div', { class: 'hsecgrid' }, list.map(function (s, i) {
      return el('a', { class: 'hseccard hover-lift rv sc-' + s.tone.slice(2), href: tracksOf().length === 1 ? s.href(tracksOf()[0].id) : '#/sections?s=' + s.id, style: '--d:' + i, 'data-sec': s.id }, [
        el('span', { class: 'icon-tile ' + s.tone }, [ico(s.ic)]),
        el('b', { text: s.name }), el('span', { class: 'muted small', text: s.desc }),
        el('span', { class: 'hsecmeta' }, [el('small', { text: secSub(s) }), s.star ? el('span', { class: 'pill pu', text: 'مهم' }) : null, ico('chev')])
      ]);
    }))
  ]);
}
// تطبيق الجوال: الأقسام شريحة أعلى شاشة القوالب
function mSecSeg(T, active) {
  const list = secList(); if (list.length < 2) return null;
  return el('div', { class: 'msecseg', role: 'tablist' }, list.map(function (s) {
    return el('a', { class: 'msecb' + (s.id === active ? ' on' : ''), href: s.href(T.id), role: 'tab', 'aria-selected': s.id === active ? 'true' : 'false', onclick: function () { if (typeof haptic === 'function') haptic(); } }, [ico(s.ic), el('span', { text: s.short })]);
  }));
}
