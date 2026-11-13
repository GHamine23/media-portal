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
  if (!progFeat('slides')) return featOff('الشرائح');
  const T = trackOf(tid) || tracksOf()[0]; if (!T) return go('#/');
  S.track = T;
  document.title = 'العروض والشرائح — ' + T.name;
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
    typeof secBar === 'function' ? secBar(T, 'slides') : null,
    el('section', { class: 'slhero wrap' }, [
      el('div', { class: 'slhero-t' }, [el('span', { class: 'eyebrow rv', text: 'بهوية ' + T.full.replace('ـ', '') }), H('h1', 'العروض والشرائح'),
        el('p', { class: 'muted rv', style: '--d:1', text: 'عروض للقاءات والمحاضرات، من نقاطك أو من درس، تُعرض حيّة أو تُنزَّل PDF.' }),
        el('div', { class: 'row wrapr rv', style: '--d:2' }, [
          el('button', { type: 'button', class: 'btn dark', onclick: function () { openDeckNew(T.id, [{ tpl: 'sl_cover', d: {} }, { tpl: 'sl_points', d: {} }], 'عرض جديد'); } }, [ico('plus'), 'عرض جديد']),
          el('button', { type: 'button', class: 'btn or slup', onclick: function () { pickReadyDeck(T); } }, [ico('upload'), 'ارفع عرضًا جاهزًا']),
          el('a', { class: 'btn line', href: '#/mine', onclick: function () { ls('mineTab', 'mine'); }, text: 'عروضي المحفوظة' })]),
        idSel]),
      heroPv
    ]),
    el('div', { class: 'wrap slpage' }, [
      el('section', { class: 'hsec' }, [el('div', { class: 'shead' }, [H('h2', 'ابدأ من عرض جاهز'), el('span', { class: 'tiny', text: 'افتحه ثم بدّل النصوص' })]),
        stripNav(el('div', { class: 'strip sldecks' }, samples.map(function (s, i) {
          const first = s.slides[0], tpl = slideTpl(first.tpl), st = { d: Object.assign(defaults(tpl, T), first.d), variant: s.style || tpl.variants[0].id, k: 1 };
          return el('div', { class: 'sldeck hover-lift rv', style: '--d:' + i }, [tplThumb(tpl, T, 'slide', 320, st), el('div', { class: 'sldeck-m' }, [el('b', { text: s.name }), el('small', { class: 'tiny', text: s.slides.length + ' شرائح' })]),
            el('div', { class: 'sldeck-a' }, [el('button', { type: 'button', class: 'btn sm dark', onclick: function () { openDeckNew(T.id, s.slides, s.name); } }, [ico('pencil'), 'افتح']), el('button', { type: 'button', class: 'btn sm line', onclick: function () { openDeckNew(T.id, s.slides, s.name); setTimeout(function () { present6(false, 0); }, 900); } }, [ico('play'), 'اعرض'])])]);
        })))]),
      el('div', { class: 'card slready rv', role: 'button', tabindex: '0', onclick: function () { pickReadyDeck(T); }, onkeydown: function (e) { if (e.key === 'Enter') pickReadyDeck(T); } }, [
        el('span', { class: 'icon-tile t-or' }, [ico('upload')]),
        el('div', { class: 'slready-t' }, [el('h3', { text: 'عندك عرض جاهز؟ ارفعه واعرضه هنا' }), el('p', { class: 'muted small', text: 'ملف PDF (من باوربوينت أو كانفا أو قوقل) أو صور الشرائح: تصير كل صفحة شريحة، وتعرضه بأداة العرض المعتادة: ملء الشاشة، وعرض المقدّم، والقلم والقرعة ونقاط الفرق.' })]),
        el('span', { class: 'btn dark' }, [ico('upload'), 'اختر الملف'])]),
      el('div', { class: 'grid two slways' }, [
        lessonCard(T),
        el('div', { class: 'card rv', style: '--d:1' }, [el('span', { class: 'icon-tile t-bl' }, [ico('content')]), el('h3', { text: 'من نقاطك' }), el('p', { class: 'muted small', text: 'السطر الأول عنوان العرض، و## تبدأ قسماً، والشرطة نقطة، و> عبارة، و«رقم: وصف» شريحة أرقام.' }),
          el('div', { class: 'fld' }, [ta]), el('button', { type: 'button', class: 'btn dark', onclick: function () { if (!ta.value.trim()) { ta.focus(); return; } const sl = deckFromOutline(ta.value, T); if (!sl) { toast('لم نفهم المخطط'); return; } openDeckNew(T.id, sl, String(sl[0].d.title || 'عرض جديد').replace(/\n/g, ' ')); } }, [ico('slides'), 'اصنع العرض'])])
      ]),
      el('section', { class: 'hsec', id: 'mydecks' }, [el('div', { class: 'shead' }, [H('h2', 'عروضك الأخيرة'), el('a', { class: 'btn sm line', href: '#/mine', onclick: function () { ls('mineTab', 'mine'); }, text: 'كلها' })]), stripNav(recent)]),
      el('section', { class: 'slfeat' }, [['trophy', 'أدوات الدرس', 'القلم والقرعة ونقاط الفرق وإجابات الطلاب أثناء العرض، وكاهوت وورقة العمل.'], ['sparkles', 'انتقالات وحركات', 'انتقال بين الشرائح، وحركة لكل عنصر، من تبويب «الحركة».'], ['play', 'عرض حي بملء الشاشة', 'ظهور بنقرة، ومؤقّت، وملاحظات، ونظرة على كل الشرائح.'], ['image', 'فيديو وصوت ويوتيوب', 'تعمل داخل العرض، ولكل مقطع إعدادات تشغيله.'], ['ai', 'من درس إلى عرض', 'الصق النص أو ارفع PDF أو Word ويرتّبه المساعد.']].map(function (f, i) {
        return el('div', { class: 'slf rv', style: '--d:' + i }, [el('span', { class: 'icon-tile t-pu' }, [ico(f[0])]), el('b', { text: f[1] }), el('small', { class: 'tiny', text: f[2] })]);
      }))
    ])
  );
  showAllNow($('#view'));
  API6.me('item_list').then(function (list) {
    const decks = list.filter(function (x) { return x.kind === 'deck' && (x.mine || x.shared); }).sort(function (a, b) { return (b.at || 0) - (a.at || 0); }).slice(0, 12);
    recent.innerHTML = '';
    if (!decks.length) { const md = $('#mydecks'); if (md) md.hidden = true; return; }
    decks.forEach(function (x, i) {
      recent.appendChild(el('div', { class: 'sldeck hover-lift rv', style: '--d:' + i }, [el('img', { src: x.thumb || '', alt: '', loading: 'lazy' }), el('div', { class: 'sldeck-m' }, [el('b', { text: x.name }), el('small', { class: 'tiny', text: (x.mine ? '' : x.owner + ' · ') + fmtTime(x.at) })]),
        el('div', { class: 'sldeck-a' }, [el('a', { class: 'btn sm dark', href: '#/d/' + x.id }, [ico('pencil'), 'افتح']), el('a', { class: 'btn sm line', href: '#/p/' + x.id }, [ico('play'), 'اعرض'])])]));
    });
    showAllNow(recent, true);
  }).catch(function () { const md = $('#mydecks'); if (md) md.hidden = true; });
}
// صفحة الشرائح تظهر كاملة من أول لحظة بدل انتظار التمرير. عند فتح الصفحة تكفي حركة انتقال الصفحة نفسها،
// فتظهر الأقسام فوراً (الانتظار لإطار الرسم يتأخر نحو ثانية أثناء انتقال الصفحة فتبدو فارغة)؛ وما يصل لاحقاً يدخل بتلاشٍ ناعم
function showAllNow(root, soft) {
  const on = function () { $$('.rv,.bwrap', root).forEach(function (x) { x.classList.add('in-view'); }); };
  if (soft) requestAnimationFrame(function () { requestAnimationFrame(on); }); else on();
}


/* ---------- «ارفع عرضًا جاهزًا»: ملف PDF أو صور الشرائح يصير عرضًا يُعرض بأداة العرض المعتادة ----------
   كل صفحة تُرسم صورة بدقة 1920 بكسل في المتصفح (pdf.js، يُحمَّل عند الحاجة وحدها من vendor/pdfjs)، وتُحفظ في مكتبة صاحبها،
   وتصير شريحة sl_pdf. ثم يُفتح العرض في المحرر: «اعرض» أو «عرض المقدّم» وكل أدوات الدرس تعمل عليه. */
const READY_MAX = 120, READY_W = 1920;
function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  return new Promise(function (ok, bad) {
    const sc = document.createElement('script'); sc.src = FONT_BASE + 'vendor/pdfjs/pdf.min.js';
    sc.onload = function () { try { pdfjsLib.GlobalWorkerOptions.workerSrc = FONT_BASE + 'vendor/pdfjs/pdf.worker.min.js'; ok(pdfjsLib); } catch (e) { bad(e); } };
    sc.onerror = function () { bad(new Error('تعذّر تحميل قارئ PDF، تحقق من الاتصال وجرّب مرة أخرى')); };
    document.head.appendChild(sc);
  });
}
function pickReadyDeck(T) {
  const fi = el('input', { type: 'file', accept: 'application/pdf,.pdf,image/png,image/jpeg,image/webp', multiple: true, hidden: true });
  fi.onchange = function () { const fs = Array.from(fi.files || []); fi.remove(); if (fs.length) importReadyDeck(T, fs); };
  document.body.appendChild(fi); fi.click();
}
async function importReadyDeck(T, files) {
  const pdf = files.find(function (f) { return /pdf$/i.test(f.name) || f.type === 'application/pdf'; });
  const imgs = files.filter(function (f) { return /^image\//.test(f.type); }).sort(function (a, b) { return a.name.localeCompare(b.name, 'ar', { numeric: true }); });
  if (!pdf && !imgs.length) { toast('اختر ملف PDF أو صور الشرائح'); return; }
  const maxMb = (V6.settings.maxUploadMb || 20) * 3;
  if (pdf && pdf.size > maxMb * 1048576) { toast('الملف أكبر من ' + maxMb + ' ميغابايت'); return; }
  const name = String((pdf || imgs[0]).name).replace(/\.[^.]+$/, '').replace(/[_\-]+/g, ' ').trim().slice(0, 60) || 'عرض جاهز';
  const bar = el('i'), msg = el('p', { class: 'muted', 'aria-live': 'polite', text: 'نقرأ الملف…' });
  let stop = false;
  const dlg = modal({ title: 'نجهّز «' + name + '»', sticky: true, body: [msg, el('div', { class: 'slprog' }, [bar]), el('p', { class: 'tiny muted', text: 'تُحفظ الصفحات في مكتبتك على المنصة، فيعمل العرض من أي جهاز. أبقِ الصفحة مفتوحة حتى ينتهي.' })],
    acts: [{ t: 'إلغاء', fn: function () { stop = true; } }] });
  const step = function (i, n, t) { msg.textContent = t; bar.style.width = Math.round(i / Math.max(1, n) * 100) + '%'; };
  try {
    // ١) الصفحات صورًا
    const blobs = [];
    if (pdf) {
      const lib = await loadPdfJs();
      const doc = await lib.getDocument({ data: new Uint8Array(await pdf.arrayBuffer()) }).promise;
      const n = Math.min(doc.numPages, READY_MAX);
      if (doc.numPages > READY_MAX) toast('في الملف ' + doc.numPages + ' صفحة، فتؤخذ أول ' + READY_MAX);
      for (let i = 1; i <= n; i++) {
        if (stop) return;
        step(i - 1, n * 2, 'نرسم الصفحة ' + i + ' من ' + n + '…');
        const pg = await doc.getPage(i), v0 = pg.getViewport({ scale: 1 }), sc = READY_W / Math.max(v0.width, v0.height * 16 / 9), vp = pg.getViewport({ scale: Math.min(4, sc) });
        const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
        const cx = c.getContext('2d'); cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, c.width, c.height);
        await pg.render({ canvasContext: cx, viewport: vp }).promise;
        blobs.push(await new Promise(function (ok) { c.toBlob(ok, 'image/jpeg', 0.92); }));
        pg.cleanup();
      }
      doc.destroy();
    } else imgs.slice(0, READY_MAX).forEach(function (f) { blobs.push(f); });
    if (!blobs.length) throw new Error('لم نجد صفحات في الملف');
    // ٢) الحفظ في مكتبة صاحبها (ثلاث معًا)
    const n = blobs.length, ids = new Array(n); let done = 0;
    await pool(blobs.map(function (b, i) { return i; }), 3, async function (i) {
      if (stop) return;
      const b = blobs[i], fl = new File([b], name + ' - ' + (i + 1) + (b.type === 'image/png' ? '.png' : '.jpg'), { type: b.type || 'image/jpeg' });
      const thumb = await thumbFromFile(fl, 320);
      const res = await uploadAsset(fl, { kind: 'image', thumb: thumb });
      ASSET_IMG[res.id] = await loadImg(URL.createObjectURL(fl)); V6.mine.unshift(res); V6.assets[res.id] = res;
      ids[i] = res.id; done++; step(n + done, n * 2, 'نحفظ الشرائح: ' + done + ' من ' + n + '…');
    });
    if (stop) return;
    const lost = ids.filter(function (x) { return !x; }).length;
    if (lost === n) throw new Error('تعذّر حفظ الشرائح، جرّب مرة أخرى');
    // ٣) العرض: شريحة لكل صفحة، ثم يُفتح في المحرر
    const slides = ids.filter(Boolean).map(function (id) { return { tpl: 'sl_pdf', d: { photo: { src: 'asset:' + id, z: 1, ox: 0, oy: 0 } } }; });
    dlg.close();
    openDeckNew(T.id, slides, name);
    track('tool', { tool: 'ready_deck', n: slides.length });
    setTimeout(function () { toast(lost ? 'جاهز، وتعذّرت ' + lost + ' صفحة. اضغط «اعرض» أو «عرض المقدّم»، واحفظه ليبقى في «عروضي».' : 'جاهز ✓ اضغط «اعرض» أو «عرض المقدّم»، واحفظه ليبقى في «عروضي».'); }, 900);
  } catch (e) { dlg.close(); toast(e.message || 'تعذّر تجهيز العرض'); }
}
