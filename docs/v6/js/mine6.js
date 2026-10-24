/* ================= تصاميمي وتصاميم الفريق، وبداية الشرائح ================= */
async function showMine6() {
  document.title = 'تصاميمي';
  let tab = ls('mineTab') || 'mine', q = '';
  const grid = el('div', { class: 'mgrid' }, [1, 2, 3, 4].map(function () { return el('div', { class: 'skel', style: 'aspect-ratio:4/5' }); }));
  if (['mine', 'team', 'models'].indexOf(tab) < 0) tab = 'mine';
  const tabs = segOf([['mine', 'تصاميمي'], ['team', 'تصاميم الفريق'], ['models', 'النماذج']], tab, function (v) { tab = v; ls('mineTab', v); fill(); });
  const search = el('input', { type: 'search', class: 'inp', placeholder: 'ابحث بالاسم…', 'aria-label': 'بحث', oninput: function (e) { q = norm(e.target.value); fill(); } });
  view(el('div', { class: 'wrap page' }, [
    el('div', { class: 'phead' }, [H('h1', 'تصاميمي'), el('p', { class: 'muted rv', text: 'ما تحفظه لك وحدك حتى تشاركه، وتجده من أي جهاز. وما شاركه فريق ' + (V6.prog ? V6.prog.name : 'برنامجك') + ' تبدأ منه بنسخة لك.' })]),
    el('div', { class: 'gbar' }, [tabs, search]), grid
  ]));
  let list = [];
  try { list = await API6.me('item_list'); } catch (e) { grid.innerHTML = ''; grid.appendChild(el('p', { class: 'err', text: e.message })); return; }
  function fill() {
    grid.innerHTML = '';
    const items = list.filter(function (x) { return (tab === 'models' ? x.model : tab === 'mine' ? x.mine : (!x.mine && x.shared)) && (!q || norm(x.name).indexOf(q) >= 0); })
      .sort(function (a, b) { return ((b.program === V6.prog.id) - (a.program === V6.prog.id)) || (b.at || 0) - (a.at || 0); });
    if (!items.length) { grid.appendChild(el('p', { class: 'empty', text: tab === 'mine' ? 'لم تحفظ تصميماً بعد. افتح أي قالب ثم اضغط «حفظ».' : tab === 'models' ? 'لا نماذج في برنامجك بعد. النماذج تصاميم جاهزة يختارها المشرف لتبدأ منها.' : 'لم يشارك أحد من فريقك تصميماً بعد.' })); return; }
    items.forEach(function (x, i) {
      const T = TRACKS[x.track], prog = V6.bundle.programs.find(function (p) { return p.id === x.program; });
      const card = el('div', { class: 'mcard hover-lift rv', style: '--d:' + (i % 8) }, [
        el('a', { href: '#/d/' + x.id, class: 'mthumb' }, [el('img', { src: x.thumb || '', alt: '', loading: 'lazy' }), x.shared ? el('span', { class: 'pill bl mshare', text: x.coedit ? 'تعديل مشترك' : 'مشارك' }) : null, x.model ? el('span', { class: 'pill or mmodel', text: 'نموذج' }) : null, x.kind === 'deck' ? el('span', { class: 'pill mdeck', text: 'عرض' }) : null]),
        el('div', { class: 'mmeta' }, [el('b', { text: x.name }), el('span', { class: 'tiny', text: [T ? T.name : (prog ? prog.name : ''), x.mine ? '' : 'من ' + x.owner, ago(x.at || 0)].filter(Boolean).join(' · ') })]),
        (x.mine || canAdminProg(x.program)) ? el('button', { type: 'button', class: 'ib sm mmore', 'aria-label': 'خيارات', onclick: function (e) {
          const modelIt = canAdminProg(x.program) ? { t: x.model ? 'إزالة من النماذج' : 'اجعله نموذجاً للبرنامج', ic: 'model', fn: async function () { try { await API6.me('item_model', x.id, !x.model); x.model = !x.model; fill(); toast(x.model ? 'صار نموذجاً يظهر لكل مستخدمي البرنامج' : 'أُزيل من النماذج'); } catch (er) { toast(er.message); } } } : null;
          if (!x.mine) { popMenu(e.currentTarget, [{ t: x.coedit ? 'عدّل مع الفريق' : 'فتح نسخة لي', ic: x.coedit ? 'pencil' : 'grid', href: '#/d/' + x.id }, { t: 'عرض', ic: 'play', href: '#/p/' + x.id }, modelIt]); return; }
          popMenu(e.currentTarget, [
            { t: 'فتح', ic: 'grid', href: '#/d/' + x.id }, { t: 'عرض', ic: 'play', href: '#/p/' + x.id },
            x.shared ? { t: 'روابط المشاركة', ic: 'share', fn: function () { modal({ title: x.name, body: [linkRow('رابط العرض', shareUrl('p', x.id)), linkRow('رابط التعديل', shareUrl('d', x.id))], acts: [{ t: 'إغلاق', cls: 'dark' }] }); } } : null, modelIt,
            { t: x.shared ? 'إلغاء المشاركة' : 'مشاركة مع الفريق', ic: 'users', fn: async function () { try { const it = await API6.me('item_get', x.id); it.shared = !x.shared; delete it.mine; await API6.me('item_save', JSON.stringify(it)); x.shared = it.shared; fill(); toast(x.shared ? 'صار ظاهراً لفريقك' : 'لم يعد مشاركاً'); } catch (er) { toast(er.message); } } },
            '-', { t: 'حذف', ic: 'trash', fn: async function () { if (!(await ask('حذف التصميم', '«' + x.name + '» سيُحذف من حسابك.', 'حذف', true))) return; try { await API6.me('item_del', x.id); list = list.filter(function (y) { return y.id !== x.id; }); fill(); } catch (er) { toast(er.message); } } }
          ]);
        } }, [ico('more')]) : null
      ]);
      grid.appendChild(card);
    });
    revealAll(grid);
  }
  fill();
}

/* ---------- الشرائح: عينات جاهزة، أو من نقاطك، أو فارغ ---------- */
function showSlides6(tid) {
  const T = trackOf(tid) || tracksOf()[0]; if (!T) return go('#/');
  S.track = T;
  document.title = 'الشرائح — ' + T.name;
  const samples = sampleDecks(T), tracks = tracksOf();
  const ta = el('textarea', { id: 'sl_out', rows: '6', dir: 'auto', placeholder: '# عنوان العرض\n## القسم الأول\n- نقطة\n- نقطة\n> عبارة مختارة\n٨٠٪: نسبة الحضور' });
  // معاينة حية في الرأس: شرائح العيّنة تتبدل بحركة
  const heroPv = el('div', { class: 'slhero-pv' });
  (function () {
    const pages = samples[0] ? samples[0].slides.slice(0, 4) : []; let k = 0;
    function show() {
      if (!pages.length) return; const sl = pages[k % pages.length], tpl = slideTpl(sl.tpl), st = { d: Object.assign(defaults(tpl, T), sl.d), variant: samples[0].style || tpl.variants[0].id, k: 1 };
      const c = tplThumb(tpl, T, 'slide', 640, st); c.className = 'slhero-c'; heroPv.appendChild(c);
      requestAnimationFrame(function () { c.classList.add('in'); }); const olds = $$('.slhero-c', heroPv).slice(0, -1); olds.forEach(function (o) { o.classList.add('out'); setTimeout(function () { o.remove(); }, 700); }); k++;
    }
    show(); const t = setInterval(function () { if (!document.body.contains(heroPv)) { clearInterval(t); return; } show(); }, 3200);
  })();
  const idSel = tracks.length > 1 ? el('div', { class: 'row wrapr slids' }, tracks.map(function (t) { return el('a', { class: 'chip' + (t.id === T.id ? ' on' : ''), href: '#/s/' + t.id, text: t.name }); })) : null;
  const recent = el('div', { class: 'strip sldecks' }, [1, 2, 3].map(function () { return el('div', { class: 'skel', style: 'width:240px;aspect-ratio:16/9;flex:none' }); }));
  view(
    el('section', { class: 'slhero wrap' }, [
      el('div', { class: 'slhero-t' }, [el('span', { class: 'eyebrow rv', text: 'بهوية ' + T.full.replace('ـ', '') }), H('h1', 'الشرائح'),
        el('p', { class: 'muted rv', style: '--d:1', text: 'عروض للقاءات والمحاضرات، من نقاطك أو من درس، تُعرض حيّة أو تُنزَّل PDF.' }),
        el('div', { class: 'row wrapr rv', style: '--d:2' }, [
          el('button', { type: 'button', class: 'btn dark', onclick: function () { openDeckNew(T.id, [{ tpl: 'sl_cover', d: {} }, { tpl: 'sl_points', d: {} }], 'عرض جديد'); } }, [ico('plus'), 'عرض جديد']),
          el('a', { class: 'btn line', href: '#/mine', onclick: function () { ls('mineTab', 'mine'); }, text: 'عروضي المحفوظة' })]),
        idSel]),
      heroPv
    ]),
    el('div', { class: 'wrap' }, [
      el('section', { class: 'hsec' }, [el('div', { class: 'shead' }, [H('h2', 'ابدأ من عرض جاهز'), el('span', { class: 'tiny', text: 'افتحه ثم بدّل النصوص' })]),
        stripNav(el('div', { class: 'strip sldecks' }, samples.map(function (s, i) {
          const first = s.slides[0], tpl = slideTpl(first.tpl), st = { d: Object.assign(defaults(tpl, T), first.d), variant: s.style || tpl.variants[0].id, k: 1 };
          return el('div', { class: 'sldeck hover-lift rv', style: '--d:' + i }, [tplThumb(tpl, T, 'slide', 320, st), el('div', { class: 'sldeck-m' }, [el('b', { text: s.name }), el('small', { class: 'tiny', text: s.slides.length + ' شرائح' })]),
            el('div', { class: 'sldeck-a' }, [el('button', { type: 'button', class: 'btn sm dark', onclick: function () { openDeckNew(T.id, s.slides, s.name); } }, [ico('pencil'), 'افتح']), el('button', { type: 'button', class: 'btn sm line', onclick: function () { openDeckNew(T.id, s.slides, s.name); setTimeout(function () { present6(false, 0); }, 900); } }, [ico('play'), 'اعرض'])])]);
        })))]),
      el('div', { class: 'grid two slways' }, [
        lessonCard(T),
        el('div', { class: 'card rv', style: '--d:1' }, [el('span', { class: 'icon-tile t-bl' }, [ico('content')]), el('h3', { text: 'من نقاطك' }), el('p', { class: 'muted small', text: 'السطر الأول عنوان العرض، و## تبدأ قسماً، والشرطة نقطة، و> عبارة، و«رقم: وصف» شريحة أرقام.' }),
          el('div', { class: 'fld' }, [ta]), el('button', { type: 'button', class: 'btn dark', onclick: function () { if (!ta.value.trim()) { ta.focus(); return; } const sl = deckFromOutline(ta.value, T); if (!sl) { toast('لم نفهم المخطط'); return; } openDeckNew(T.id, sl, String(sl[0].d.title || 'عرض جديد').replace(/\n/g, ' ')); } }, [ico('slides'), 'اصنع العرض'])])
      ]),
      el('section', { class: 'hsec', id: 'mydecks' }, [el('div', { class: 'shead' }, [H('h2', 'عروضك الأخيرة'), el('a', { class: 'btn sm line', href: '#/mine', onclick: function () { ls('mineTab', 'mine'); }, text: 'كلها' })]), stripNav(recent)]),
      el('section', { class: 'slfeat' }, [['sparkles', 'حركات دخول وانتقالات', 'من تبويب «الحركة» في المحرر: لكل الشرائح أو لكل عنصر.'], ['play', 'عرض حي بملء الشاشة', 'ظهور بنقرة، ومؤقّت، وملاحظات للمقدّم، ونافذة مقدّم.'], ['image', 'فيديو وصوت ويوتيوب', 'من لوحة «العناصر»، تعمل أثناء العرض.'], ['ai', 'من درس إلى عرض', 'الصق النص أو ارفع PDF أو Word ويرتّبه المساعد.']].map(function (f, i) {
        return el('div', { class: 'slf rv', style: '--d:' + i }, [el('span', { class: 'icon-tile t-pu' }, [ico(f[0])]), el('b', { text: f[1] }), el('small', { class: 'tiny', text: f[2] })]);
      }))
    ])
  );
  API6.me('item_list').then(function (list) {
    const decks = list.filter(function (x) { return x.kind === 'deck' && (x.mine || x.shared); }).sort(function (a, b) { return (b.at || 0) - (a.at || 0); }).slice(0, 12);
    recent.innerHTML = '';
    if (!decks.length) { $('#mydecks').hidden = true; return; }
    decks.forEach(function (x, i) {
      recent.appendChild(el('div', { class: 'sldeck hover-lift rv', style: '--d:' + i }, [el('img', { src: x.thumb || '', alt: '', loading: 'lazy' }), el('div', { class: 'sldeck-m' }, [el('b', { text: x.name }), el('small', { class: 'tiny', text: (x.mine ? '' : x.owner + ' · ') + fmtTime(x.at) })]),
        el('div', { class: 'sldeck-a' }, [el('a', { class: 'btn sm dark', href: '#/d/' + x.id }, [ico('pencil'), 'افتح']), el('a', { class: 'btn sm line', href: '#/p/' + x.id }, [ico('play'), 'اعرض'])])]));
    });
    revealAll(recent);
  }).catch(function () { $('#mydecks').hidden = true; });
}
