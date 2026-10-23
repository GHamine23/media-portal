/* ================= الرئيسية ومعرض القوالب ================= */
function firstName(n) { return String(n || '').trim().replace(/^(أ\.|د\.|م\.|الأستاذ|الأستاذة)\s*/, '').split(/\s+/)[0] || ''; }
function tracksOf(group) { return Object.keys(TRACKS).map(function (k) { return TRACKS[k]; }).filter(function (t) { return !group || t.group === group; }); }
// القوالب المتاحة لهذا المستخدم: مواقع التواصل لمن له صلاحيتها
function visibleTpls() { return TEMPLATES.filter(function (t) { return !t.hidden && t.type !== 'slide' && (canSocial() || t.type !== 'social'); }); }
function sizesFor(tpl) { const s = tpl.sizes.filter(function (z) { return canSocial() || z !== 'story'; }); return s.length ? s : tpl.sizes.slice(0, 1); }

// رسم مصغّر عند ظهور البطاقة فقط، فلا تتأخر الصفحة
let THUMB_IO = null;
function lazyThumb(cv, fn) {
  if (!THUMB_IO) THUMB_IO = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { THUMB_IO.unobserve(e.target); const f = e.target._draw; if (f) requestAnimationFrame(function () { try { f(); } catch (er) { console.warn(er); } e.target.classList.add('drawn'); }); } }); }, { rootMargin: '200px' });
  cv._draw = fn; THUMB_IO.observe(cv);
}
function tplThumb(tpl, T, szk, w, st) {
  const sz = SIZES[szk], sc = w / sz.w;
  const cv = el('canvas', { width: Math.round(sz.w * sc), height: Math.round(sz.h * sc), class: 'thumbcv' });
  lazyThumb(cv, function () { renderTo(cv, tpl, szk, st || { d: defaults(tpl, T), variant: tpl.variants[0].id, k: 1 }, T, sc * (window.devicePixelRatio > 1 ? 2 : 1)); cv.style.width = '100%'; });
  return cv;
}

function showHome() {
  const P = V6.prog, me = V6.me;
  document.title = 'منصة الأثر الإعلامي';
  if (!P) { view(el('div', { class: 'wrap page' }, [H('h1', 'لا برنامج لحسابك بعد'), el('p', { class: 'muted', text: 'اطلب من مدير المنصة إضافتك إلى برنامجك.' })])); return; }
  const tracks = tracksOf();
  const first = tracks[0];
  const search = el('input', { type: 'search', class: 'hsearch', placeholder: 'ابحث في القوالب: مسابقة، ورشة، تهنئة، جدول…', 'aria-label': 'ابحث في القوالب', onkeydown: function (e) { if (e.key === 'Enter' && first) go('#/g/' + (ls('lastTrack') || first.id) + '?q=' + encodeURIComponent(search.value)); } });
  const lastT = TRACKS[ls('lastTrack')] ? ls('lastTrack') : (first && first.id);
  const quick = [
    ['#/make', 'اصنع إعلانك', 'اكتب فكرتك، ونقترح التصاميم', 'ai', 't-pu'],
    [lastT ? '#/e/' + lastT + '/blank' : '#/', 'صفحة بيضاء', 'صمّم من الصفر بحرية كاملة', 'wand', 't-ink'],
    [lastT ? '#/s/' + lastT : '#/', 'الشرائح', 'عروض للقاءات والمحاضرات', 'slides', 't-bl'],
    ['#/mine', 'تصاميمي', 'ما حفظته وما شاركه فريقك', 'heart', 't-gr']
  ].filter(function (q) { return q[0] !== '#/make' || true; }).map(function (q, i) {
    return el('a', { href: q[0], class: 'qcard hover-lift rv', style: '--d:' + i, 'data-tour': 'q' + i }, [el('span', { class: 'icon-tile ' + q[4] }, [ico(q[3])]), el('div', {}, [el('b', { text: q[1] }), el('span', { text: q[2] })])]);
  });
  const groups = [['track', 'المسارات'], ['act', 'الأنشطة والهويات']];
  const idSections = tracks.length ? groups.map(function (g) {
    const list = tracksOf(g[0]); if (!list.length) return null;
    return el('section', { class: 'hsec' }, [el('div', { class: 'shead' }, [H('h2', g[1])]),
      el('div', { class: 'idgrid' }, list.map(function (t, i) { return idCard6(t, i); }))]);
  }) : [el('div', { class: 'section empty-prog rv' }, [el('span', { class: 'icon-tile t-or' }, [ico('palette')]), el('h3', { text: 'هوية ' + P.name + ' لم تُضف بعد' }),
    el('p', { class: 'muted', text: isAdmin() ? 'أضف ألوان البرنامج وشعاره من لوحة الإدارة، فتظهر كل القوالب بهويته.' : 'يجهّز المشرف هوية البرنامج، وتظهر القوالب هنا قريباً.' }),
    isAdmin() ? el('a', { class: 'btn dark', href: '#/admin/programs', text: 'أضف الهوية' }) : null])];
  const recent = el('div', { class: 'strip', id: 'recent' });
  const newOnes = visibleTpls().filter(function (t) { return t.isNew || t.pack; }).slice(0, 10);
  view(
    el('section', { class: 'hero wrap' }, [
      el('span', { class: 'eyebrow rv', text: P.name }),
      H('h1', 'ماذا ستصمّم اليوم يا ' + firstName(me.name) + '؟'),
      el('div', { class: 'searchrow rv', style: '--d:2' }, [ico('search'), search]),
      el('div', { class: 'quick' }, quick)
    ]),
    el('div', { class: 'wrap' }, idSections.concat([
      el('section', { class: 'hsec', id: 'recentsec', hidden: true }, [el('div', { class: 'shead' }, [H('h2', 'آخر تصاميمك'), el('a', { class: 'btn sm line', href: '#/mine', text: 'كل تصاميمي' })]), recent]),
      newOnes.length && first ? el('section', { class: 'hsec' }, [el('div', { class: 'shead' }, [H('h2', 'جديد القوالب')]),
        el('div', { class: 'strip' }, newOnes.map(function (tpl, i) { const T = tracks[i % tracks.length]; const szk = sizesFor(tpl)[0]; return el('a', { class: 'scard hover-lift', href: '#/e/' + T.id + '/' + tpl.id }, [tplThumb(tpl, T, szk, 220), el('b', { text: tpl.name })]); }))]) : null
    ]))
  );
  loadRecent(recent);
}
function idCard6(t, i) {
  const im = IMG[t.logo];
  const box = el('div', { class: 'idlogo' });
  if (im) box.appendChild(el('img', { src: ASSETS[t.logo], alt: '' }));
  else box.appendChild(el('span', { class: 'idname', style: 'color:' + t.c.p, text: t.name }));
  return el('a', { href: '#/g/' + t.id, class: 'idcard hover-lift rv', style: '--d:' + (i % 6) + ';--tc:' + t.c.p, 'data-tour': i === 0 ? 'identity' : null }, [
    box,
    el('div', { class: 'idmeta' }, [el('b', { text: t.full.replace('ـ', '') }), el('div', { class: 'sw' }, ['pd', 'p', 'pl', 's', 'a'].map(function (k) { return el('i', { style: 'background:' + t.c[k] }); }))])
  ]);
}
async function loadRecent(box) {
  try {
    const list = (await API6.me('item_list')).filter(function (x) { return x.mine && x.program === V6.prog.id; }).slice(0, 8);
    if (!list.length) return;
    $('#recentsec').hidden = false;
    list.forEach(function (x) { box.appendChild(el('a', { class: 'scard hover-lift', href: '#/d/' + x.id }, [el('img', { src: x.thumb || '', alt: '', loading: 'lazy' }), el('b', { text: x.name }), el('span', { class: 'tiny', text: ago(x.at) })])); });
  } catch (e) {}
}

/* ---------- معرض قوالب الهوية ---------- */
function showGallery6(tid, type) {
  const q0 = (location.hash.split('?q=')[1] || '');
  tid = tid.split('?')[0]; type = (type || 'all').split('?')[0];
  const T = trackOf(tid); if (!T) return go('#/');
  ls('lastTrack', T.id);
  document.title = 'قوالب ' + T.name;
  const VIS = visibleTpls();
  const types = TYPES.filter(function (ty) { return VIS.some(function (t) { return t.type === ty.id; }); });
  let cur = type;
  const chips = el('div', { class: 'chips rv' }, [['all', 'الكل'], ['new', 'الجديد']].concat(types.map(function (t) { return [t.id, t.name]; })).map(function (c) {
    return el('button', { type: 'button', class: 'chip' + (c[0] === cur ? ' on' : ''), onclick: function (e) { cur = c[0]; $$('.chip', chips).forEach(function (x) { x.classList.remove('on'); }); e.currentTarget.classList.add('on'); fill(); history.replaceState(null, '', '#/g/' + T.id + (cur === 'all' ? '' : '/' + cur)); } }, [c[1]]);
  }));
  const search = el('input', { type: 'search', class: 'inp gsearch', placeholder: 'ابحث في القوالب…', value: decodeURIComponent(q0), 'aria-label': 'بحث' });
  const grid = el('div', { class: 'tgrid' });
  const empty = el('p', { class: 'empty', text: 'لا قالب يطابق بحثك.', hidden: true });
  function fill() {
    grid.innerHTML = '';
    const qs = norm(search.value).split(/\s+/).filter(Boolean);
    let list = cur === 'all' ? VIS : cur === 'new' ? VIS.filter(function (t) { return t.isNew || t.pack; }) : VIS.filter(function (t) { return t.type === cur; });
    list = list.filter(function (t) { const ty = TYPES.find(function (x) { return x.id === t.type; }) || {}; const hay = norm([t.name, t.tags, ty.name].join(' ')); return qs.every(function (w) { return hay.indexOf(w) >= 0; }); });
    empty.hidden = list.length > 0;
    list.forEach(function (tpl, i) {
      const ty = TYPES.find(function (x) { return x.id === tpl.type; }) || { name: '' };
      const szs = sizesFor(tpl), szk = szs[0];
      grid.appendChild(el('a', { class: 'tcard6 hover-lift', href: '#/e/' + T.id + '/' + tpl.id, style: '--d:' + (i % 8) }, [
        el('div', { class: 'tthumb' }, [tplThumb(tpl, T, szk, 300), (tpl.isNew || tpl.pack) ? el('span', { class: 'pill or tnew', text: 'جديد' }) : null]),
        el('div', { class: 'tmeta6' }, [el('b', { text: tpl.name }), el('span', { class: 'tiny', text: ty.name + ' · ' + szs.map(function (s) { return SIZES[s].name; }).join('، ') })])
      ]));
    });
  }
  search.addEventListener('input', fill);
  const im = IMG[T.logo];
  view(el('div', { class: 'wrap page' }, [
    el('div', { class: 'ghead6' }, [
      el('a', { href: '#/', class: 'ib back', 'aria-label': 'رجوع' }, [ico('chev')]),
      im ? el('img', { class: 'glogo rv', src: ASSETS[T.logo], alt: '' }) : null,
      el('div', { class: 'gt' }, [H('h1', T.full.replace('ـ', '')), el('div', { class: 'sw rv' }, ['pd', 'p', 'pl', 's', 'sd', 'a', 'a2'].map(function (k) { return el('i', { style: 'background:' + T.c[k], title: T.c[k] }); }))]),
      el('span', { class: 'sp' }),
      el('a', { class: 'btn dark', href: '#/e/' + T.id + '/blank' }, [ico('plus'), 'صفحة بيضاء'])
    ]),
    el('div', { class: 'gbar' }, [chips, search]),
    grid, empty
  ]));
  fill();
}
