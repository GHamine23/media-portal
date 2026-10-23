/* ================= تصاميمي وتصاميم الفريق، وبداية الشرائح ================= */
async function showMine6() {
  document.title = 'تصاميمي';
  let tab = ls('mineTab') || 'mine', q = '';
  const grid = el('div', { class: 'mgrid' }, [1, 2, 3, 4].map(function () { return el('div', { class: 'skel', style: 'aspect-ratio:4/5' }); }));
  if (['mine', 'team', 'models'].indexOf(tab) < 0) tab = 'mine';
  const tabs = segOf([['mine', 'تصاميمي'], ['team', 'تصاميم الفريق'], ['models', 'النماذج']], tab, function (v) { tab = v; ls('mineTab', v); fill(); });
  const search = el('input', { type: 'search', class: 'inp', placeholder: 'ابحث بالاسم…', 'aria-label': 'بحث', oninput: function (e) { q = norm(e.target.value); fill(); } });
  view(el('div', { class: 'wrap page' }, [
    el('div', { class: 'phead' }, [H('h1', 'تصاميمي'), el('p', { class: 'muted rv', text: 'ما حفظته يبقى في حسابك وتجده من أي جهاز، وما شاركه فريق ' + (V6.prog ? V6.prog.name : 'برنامجك') + ' تبدأ منه بنسخة لك.' })]),
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
  const samples = sampleDecks(T);
  const ta = el('textarea', { id: 'sl_out', rows: '7', dir: 'auto', placeholder: '# عنوان العرض\n## القسم الأول\n- نقطة\n- نقطة\n> عبارة مختارة\n٨٠٪: نسبة الحضور' });
  view(el('div', { class: 'wrap page' }, [
    el('div', { class: 'phead' }, [H('h1', 'الشرائح'), el('p', { class: 'muted rv', text: 'عروض للقاءات والمحاضرات بهوية ' + T.full.replace('ـ', '') + '، تُنزَّل PDF أو تُعرض بملء الشاشة.' })]),
    el('div', { class: 'grid two' }, [
      el('div', { class: 'card rv' }, [el('span', { class: 'icon-tile t-bl' }, [ico('content')]), el('h3', { text: 'من نقاطك' }), el('p', { class: 'muted small', text: 'السطر الأول عنوان العرض، و## تبدأ قسماً، والشرطة نقطة، و> عبارة، و«رقم: وصف» شريحة أرقام.' }),
        el('div', { class: 'fld' }, [ta]), el('button', { type: 'button', class: 'btn dark', text: 'اصنع العرض', onclick: function () { if (!ta.value.trim()) { ta.focus(); return; } const sl = deckFromOutline(ta.value, T); if (!sl) { toast('لم نفهم المخطط'); return; } openDeckNew(T.id, sl, String(sl[0].d.title || 'عرض جديد').replace(/\n/g, ' ')); } })]),
      el('div', { class: 'card rv', style: '--d:1' }, [el('span', { class: 'icon-tile t-or' }, [ico('slides')]), el('h3', { text: 'ابدأ من عرض جاهز' }),
        el('div', { class: 'slsamples' }, samples.map(function (s) {
          const first = s.slides[0], tpl = slideTpl(first.tpl), st = { d: Object.assign(defaults(tpl, T), first.d), variant: s.style || tpl.variants[0].id, k: 1 };
          return el('button', { type: 'button', class: 'slsample hover-lift', onclick: function () { openDeckNew(T.id, s.slides, s.name); } }, [tplThumb(tpl, T, 'slide', 220, st), el('b', { text: s.name }), el('small', { class: 'tiny', text: s.slides.length + ' شرائح' })]);
        }).concat([el('button', { type: 'button', class: 'slsample blank hover-lift', onclick: function () { openDeckNew(T.id, [{ tpl: 'sl_cover', d: {} }, { tpl: 'sl_points', d: {} }], 'عرض جديد'); } }, [ico('plus'), el('b', { text: 'عرض فارغ' })])]))]),
      lessonCard(T),
      el('div', { class: 'card rv', style: '--d:3' }, [el('span', { class: 'icon-tile t-gr' }, [ico('play')]), el('h3', { text: 'في العرض الحي' }),
        el('ul', { class: 'feat6' }, [['انتقالات بين الشرائح: تلاشٍ وانزلاق وتكبير وقلب، للعرض كله أو لشريحة بعينها.'], ['ظهور تدريجي: اختر ما يظهر بنقرة من قائمة الشريحة (زر ⋯ تحت الشرائح).'], ['فيديو وصوت من جهازك ورابط يوتيوب من لوحة «العناصر».'], ['شريحة سؤال يظهر جوابها بنقرة، ومؤقّت (T)، وملاحظات المقدّم (N) أو في نافذة ثانية.']].map(function (x) { return el('li', { text: x[0] }); }))])
    ])
  ]));
}
