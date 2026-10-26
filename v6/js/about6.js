/* ================= التعريف بأثر: صفحة الدخول وصفحة «تعرّف على أثر» =================
   المقاطع المتحركة (motion6.js) تعريف دعائي بالمنصة، فمكانها أول لقاء بها: نصف صفحة الدخول، وصفحة عامة #/about تُفتح بلا تسجيل دخول.
   الفيلم يعمل صامتاً داخل الصفحة (إطار بعد إطار من محرك الحركة)، و«شاهد بالصوت» يفتح المشغّل الكامل. */
IC.film = '<rect x="3" y="5" width="18" height="14" rx="3.5"/><path d="M10.2 9.4v5.2l4.4-2.6z"/>';
// نص التعريف كما اعتمده المستخدم
const ABOUT_TXT = {
  title: 'أثر: منصة البرامج الإعلامية',
  lines: [['palette', 'لكل برنامج هويته جاهزة: قوالب بألوانه وشعاره وخطوطه.'], ['ai', 'محرر سهل، ومصمّم ذكي يقترح عليك التصاميم من كلماتك.'], ['send', 'إعلانات، وعروض للدروس، ومواد تعليمية للطباعة، تنشرها في قناة برنامجك من مكانك.']],
  account: 'حسابك ينشئه مشرف برنامجك.'
};
// عبارة دعائية لكل لمحة (لا عنوان قسم)
const ABOUT_PROMO = {
  home: ['يومك كله في صفحة', 'الرئيسية'], gallery: ['هويتك جاهزة في كل قالب', 'القوالب والهويات'], editor: ['اكتب، ولوّن، ونزّل بجودة كاملة', 'المحرر'],
  make: ['قل فكرتك، ونصمّمها لك', 'المصمّم الذكي'], publish: ['من التصميم إلى القناة بضغطة', 'النص المصاحب والنشر'], cal: ['مواعيدك ومهام فريقك في مكان واحد', 'التقويم والمهام'],
  slides: ['من الدرس إلى عرض حيّ', 'الشرائح والعروض'], lesson: ['قلمٌ وقرعة ونقاط أمام طلابك', 'أدوات الدرس'], presenter: ['يرون الشريحة، ولوحتك لك', 'عرض المقدّم'], mine: ['عملك محفوظ، وفريقك معك', 'تصاميمي والفريق'], app: ['أثر في جيبك', 'تطبيق الجوال'], admin: ['برامجك كلها تحت عينك', 'لوحة الإدارة']
};
function aboutReady() { return typeof renderMotionFrame === 'function' && typeof MOTION_CLIPS !== 'undefined' && MOTION_CLIPS.length; }
function aboutClip(id) { return aboutReady() ? MOTION_CLIPS.find(function (c) { return c.id === id; }) || null : null; }
function aboutReduced() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
function aboutDur(d) { d = Math.round(+d || 0); const n = function (x) { return x.toLocaleString('ar-EG'); }; return d < 60 ? n(d) + ' ث' : n(Math.floor(d / 60)) + ':' + n(100 + d % 60).slice(-2) + ' د'; }
function aboutPlay(id) { if (typeof playMotion !== 'function') return; try { track('guide', { tool: 'about_' + id }); } catch (e) {} playMotion(id, {}); }

/* ---------- الفيلم صامتاً داخل الصفحة ----------
   يُرسم ٣٠ إطاراً في الثانية ما دام ظاهراً على الشاشة والصفحة مفتوحة، ويقف حين يخرج منها. ومن طلب تقليل الحركة يرى إطاراً ثابتاً. */
function aboutFilm(id, cls) {
  const c = aboutClip(id);
  const stage = el('div', { class: 'abfilm-st', 'aria-hidden': 'true' });
  const box = el('div', { class: 'abfilm ' + (cls || '') }, [stage,
    el('button', { type: 'button', class: 'abfilm-play', 'aria-label': 'شاهد ' + (c ? c.title : 'الفيلم') + ' بالصوت', onclick: function () { aboutPlay(id); } }, [el('span', { class: 'abfp-i' }, [ico('play')]), el('span', { class: 'abfp-t' }, [el('b', { text: 'شاهد بالصوت' }), c ? el('small', { text: c.title + ' · ' + aboutDur(c.dur) }) : null])])
  ]);
  if (!c) { box.classList.add('fb'); return box; }
  let t = c.id === 'launch' ? 0 : 0.5, last = 0, raf = 0, seen = false, built = false;
  const draw = function () { try { renderMotionFrame(id, t, stage, { portrait: false }); built = true; } catch (e) { stop(); } };
  const loop = function (now) {
    raf = 0; if (!box.isConnected) return;
    if (!seen || document.hidden) return;
    if (now - last >= 33) { const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now; t += dt; if (t >= c.dur - 0.05) t = 0; draw(); }
    raf = requestAnimationFrame(loop);
  };
  const start = function () { if (!raf && seen && !document.hidden && !aboutReduced()) { last = 0; raf = requestAnimationFrame(loop); } };
  const stop = function () { if (raf) cancelAnimationFrame(raf); raf = 0; };
  // أول إطار بعد أن يأخذ الصندوق مقاسه
  requestAnimationFrame(function () { if (!box.isConnected) return; if (aboutReduced()) t = (MO.clips[id] && MO.clips[id].poster) || 3; draw(); });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (es) { seen = es.some(function (e) { return e.isIntersecting; }); if (seen) start(); else stop(); }, { threshold: 0.15 });
    io.observe(box);
  } else { seen = true; setTimeout(start, 300); }
  document.addEventListener('visibilitychange', function () { if (!box.isConnected) return; if (document.hidden) stop(); else start(); });
  // تغيّر المقاس يعيد حساب التصغير
  if ('ResizeObserver' in window) new ResizeObserver(function () { if (built && box.isConnected) draw(); }).observe(stage);
  return box;
}

// صورة اللمحة بعرض البطاقة نفسها (فلا تُقصّ ولا تُكبَّر)
function aboutThumb(c) {
  const th = el('span', { class: 'abc-th' }, [el('span', { class: 'gplay sm' }, [ico('play')]), el('span', { class: 'gdur', text: aboutDur(c.dur) })]);
  const put = function () { if (!th.isConnected || typeof motionPoster !== 'function') return; const w = Math.round(th.clientWidth) || 280; if (th._w === w) return; th._w = w; const old = th.querySelector('.mo-pv'); if (old) old.remove(); th.insertBefore(motionPoster(c.id, w), th.firstChild); };
  requestAnimationFrame(function () { requestAnimationFrame(put); });
  if ('ResizeObserver' in window) new ResizeObserver(function () { put(); }).observe(th);
  return th;
}

/* ---------- نصف صفحة الدخول: التعريف والفيلم ---------- */
function loginIntro() {
  return el('div', { class: 'lgintro' }, [
    el('span', { class: 'eyebrow rv', text: 'تعرّف على المنصة' }),
    H('h2', ABOUT_TXT.title, 'lgi-h rv'),
    el('div', { class: 'rv', style: '--d:1' }, [aboutFilm('launch', 'lgfilm')]),
    el('ul', { class: 'lgi-pts' }, ABOUT_TXT.lines.map(function (l, i) { return el('li', { class: 'rv', style: '--d:' + (i + 2) }, [el('span', { class: 'lgi-ic' }, [ico(l[0])]), el('span', { text: l[1] })]); })),
    el('a', { class: 'lgi-more rv', style: '--d:5', href: '#/about' }, [el('span', { text: 'تعرّف على أثر: الفيلم ولمحات من كل قسم' }), ico('chev')])
  ]);
}

/* ---------- صفحة «تعرّف على أثر» (#/about): تُفتح للزائر وللمستخدم ---------- */
function showAbout6() {
  document.title = 'تعرّف على أثر — منصة الأثر الإعلامي';
  const inApp = document.body.classList.contains('mapp'), logged = !!(V6.token && V6.me);
  if (!logged && !inApp) { const top = $('#top'); if (top) top.hidden = true; }
  if (typeof splashHide === 'function') splashHide();
  // لوحة الإدارة شرحها في الدليل للمشرفين، لا في التعريف العام
  const clips = aboutReady() ? MOTION_CLIPS.filter(function (c) { return c.id !== 'launch' && !c.admin; }) : [];
  const cta = logged
    ? el('div', { class: 'row wrapr abcta' }, [el('a', { class: 'btn dark lg', href: '#/' }, [ico('home'), 'إلى الرئيسية']), el('a', { class: 'btn line lg', href: '#/guide' }, [ico('guide'), 'دليل أثر: الشرح العملي'])])
    : el('div', { class: 'row wrapr abcta' }, [el('a', { class: 'btn dark lg', href: '#/login' }, [ico('user'), 'ادخل إلى منصتك']), el('span', { class: 'muted small', text: ABOUT_TXT.account })]);
  const head = logged || inApp ? null : el('header', { class: 'abtop wrap' }, [el('a', { href: '#/login', class: 'abbrand', 'aria-label': 'صفحة الدخول' }, [brandImg('c', 'abbrand-i')]), el('a', { class: 'btn sm line', href: '#/login', text: 'الدخول' })]);
  view(el('div', { class: 'abpage' + (logged ? '' : ' pub') }, [
    head,
    el('div', { class: 'wrap page' }, [
      el('section', { class: 'abhero' }, [
        el('div', { class: 'abh-tx' }, [
          el('span', { class: 'eyebrow rv', text: 'منصة الأثر الإعلامي' }),
          H('h1', 'تعرّف على أثر', 'rv'),
          el('p', { class: 'lead rv', style: '--d:1', text: ABOUT_TXT.title.replace(/^أثر:\s*/, '') + '. ' + ABOUT_TXT.lines[0][1] }),
          el('ul', { class: 'lgi-pts' }, ABOUT_TXT.lines.slice(1).map(function (l, i) { return el('li', { class: 'rv', style: '--d:' + (i + 2) }, [el('span', { class: 'lgi-ic' }, [ico(l[0])]), el('span', { text: l[1] })]); })),
          cta
        ]),
        el('div', { class: 'abh-film rv', style: '--d:1' }, [aboutFilm('launch', 'abbig')])
      ]),
      clips.length ? el('section', { class: 'hsec absec' }, [
        el('div', { class: 'shead' }, [el('div', {}, [H('h2', 'ماذا تستطيع أن تفعل'), el('p', { class: 'muted small rv', text: 'لمحات قصيرة، كل واحدة أقل من نصف دقيقة. اضغط أي بطاقة لتشاهدها بالصوت.' })])]),
        el('div', { class: 'abgrid' }, clips.map(function (c, i) {
          const p = ABOUT_PROMO[c.id] || [c.title, c.section];
          return el('button', { type: 'button', class: 'abcard rv hover-lift', style: '--d:' + Math.min(i, 8), 'aria-label': p[0] + ' · ' + p[1] + ' · شاهد', onclick: function () { aboutPlay(c.id); } }, [
            aboutThumb(c),
            el('span', { class: 'abc-tx' }, [el('b', { text: p[0] }), el('small', { class: 'muted', text: p[1] })])
          ]);
        }))
      ]) : null,
      logged ? el('section', { class: 'card flat abguide rv' }, [el('span', { class: 'icon-tile t-pu' }, [ico('guide')]), el('div', {}, [el('h3', { text: 'تريد الشرح خطوة بخطوة؟' }), el('p', { class: 'muted small', text: '«دليل أثر» يشرح كل قسم عملياً، و«اسأل أثر» يجيبك وأنت تعمل.' })]), el('a', { class: 'btn line', href: '#/guide' }, ['افتح دليل أثر', ico('chev')])]) : null
    ])
  ]));
}
