/* ================= ما الجديد، ورسائل الإدارة، والبلاغات، والجولة التعريفية ================= */
let NEWS = { log: [], bc: [] };
async function loadNews() {
  try {
    const r = await Promise.all([API6.json('cl_list'), API6.me('bc_list')]);
    NEWS.log = r[0] || []; NEWS.bc = r[1] || [];
  } catch (e) { return false; }
  const seenV = ls('seenV'), latest = NEWS.log[0];
  const bell = $('#bell'); if (bell) bell.classList.toggle('dot-badge', !!latest && seenV !== latest.v);
  if (typeof loadNotifs === 'function') loadNotifs();
  // الإصدار الكبير يُعرض مرة في نافذة، والصغير يكتفي بالنقطة على الجرس
  let shown = false;
  if (latest && latest.major && seenV !== latest.v && ls('seenMajor') !== latest.v) { ls('seenMajor', latest.v); shown = true; setTimeout(function () { if (!$('.coach')) showNews(true); }, 600); }
  showBanners();
  return shown;
}
function showBanners() {
  const box = $('#banner'); box.innerHTML = '';
  const hid = ls('hiddenBc') || [];
  NEWS.bc.filter(function (b) { return hid.indexOf(b.id) < 0; }).forEach(function (b) {
    if (b.kind === 'modal') { if (hid.indexOf(b.id) < 0) { hid.push(b.id); ls('hiddenBc', hid); modal({ title: b.title, body: [el('p', { class: 'muted', text: b.body }), b.link ? el('a', { class: 'btn line', href: b.link, target: '_blank', rel: 'noopener', text: 'التفاصيل' }) : null], acts: [{ t: 'حسناً', cls: 'dark' }] }); } return; }
    if (b.kind === 'tip') return;
    box.appendChild(el('div', { class: 'banner' }, [el('div', { class: 'wrap in' }, [ico('megaphone'), el('b', { text: b.title }), el('span', { text: b.body }),
      b.link ? el('a', { href: b.link, target: '_blank', rel: 'noopener', text: 'التفاصيل', style: 'color:#fff' }) : null,
      el('button', { type: 'button', class: 'x', 'aria-label': 'إخفاء', onclick: function (e) { hid.push(b.id); ls('hiddenBc', hid); e.currentTarget.closest('.banner').remove(); } }, [ico('close')])])]));
  });
}
function showNews(auto) {
  const latest = NEWS.log[0];
  if (latest) ls('seenV', latest.v);
  const bell = $('#bell'); if (bell) bell.classList.remove('dot-badge');
  const tips = NEWS.bc.filter(function (b) { return b.kind === 'tip'; });
  const nb = typeof notifsBlock === 'function' ? notifsBlock() : null;
  modal({ title: nb ? 'الإشعارات وما الجديد' : 'ما الجديد', wide: true, body: [
    nb,
    el('div', { class: 'news' }, NEWS.log.slice(0, 6).map(function (v, i) {
      return el('article', { class: 'nitem' + (i === 0 ? ' first' : '') }, [
        el('div', { class: 'row' }, [el('span', { class: 'pill ' + (v.major ? 'pu' : ''), text: 'الإصدار ' + v.v }), el('span', { class: 'tiny', text: v.date || '' })]),
        el('h4', { text: v.title || '' }),
        el('ul', { class: 'nlist' }, (v.items || []).map(function (it) { return el('li', {}, [el('b', { text: it.t }), it.d ? el('span', { text: ' — ' + it.d }) : null]); }))
      ]);
    }).concat(tips.length ? [el('article', { class: 'nitem' }, [el('h4', { text: 'نصائح من الفريق' }), el('ul', { class: 'nlist' }, tips.map(function (b) { return el('li', {}, [el('b', { text: b.title }), el('span', { text: ' — ' + b.body })]); }))])] : [])
      .concat(NEWS.log.length ? [] : [el('p', { class: 'empty', text: 'لا جديد الآن.' })]))
  ], acts: [{ t: auto ? 'ابدأ' : 'إغلاق', cls: 'dark' }, auto ? { t: 'خذني في جولة', fn: function () { setTimeout(function () { maybeTour('home', true); }, 300); } } : null] });
}

/* ---------- البلاغات والاقتراحات ---------- */
function showFeedback6(preset) {
  let kind = (preset && preset.kind) || 'bug';
  const ta = el('textarea', { rows: '5', id: 'fb_text', placeholder: 'اكتب ما حدث أو فكرتك باختصار…' });
  const hasDesign = !!(window.ED && ED.open);
  const shotI = el('input', { type: 'checkbox', checked: hasDesign });
  const msg = el('p', { class: 'muted small', role: 'status' });
  const imgs = [], thumbs = el('div', { class: 'fbthumbs' });
  const fileI = el('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true, onchange: async function (e) {
    const fs = Array.from(e.target.files); e.target.value = '';
    for (const f of fs) {
      if (imgs.length >= 4) { toast('أربع صور كحد أقصى'); break; }
      if (f.size > 10 * 1048576) { toast(f.name + ' أكبر من ١٠ ميغابايت'); continue; }
      const u = await new Promise(function (ok) { const r = new FileReader(); r.onload = function () { ok(r.result); }; r.readAsDataURL(f); });
      imgs.push(u);
      const t = el('div', { class: 'fbthumb', style: 'background-image:url(' + u + ')' }, [el('button', { type: 'button', class: 'x', 'aria-label': 'إزالة', onclick: function () { const i = imgs.indexOf(u); if (i >= 0) imgs.splice(i, 1); t.remove(); } }, [ico('close')])]);
      thumbs.appendChild(t);
    }
  } });
  const imgPick = el('div', { class: 'fbimgs' }, [fileI, el('button', { type: 'button', class: 'btn sm line', onclick: function () { fileI.click(); } }, [ico('image'), 'أرفق صوراً من جهازك']), el('span', { class: 'tiny', text: 'حتى أربع صور بجودتها' }), thumbs]);
  const m = modal({ title: 'ملاحظة للفريق', body: [
    segOf([['bug', 'مشكلة'], ['idea', 'اقتراح'], ['q', 'سؤال']], kind, function (v) { kind = v; }),
    el('div', { class: 'fld' }, [el('label', { for: 'fb_text', text: 'ملاحظتك' }), withEmoji(ta)]),
    hasDesign ? el('label', { class: 'tog' }, [shotI, el('span', { text: 'أرفق صورة التصميم المفتوح' })]) : null,
    imgPick,
    el('p', { class: 'tiny', text: 'تتابع حالتها وردّ الفريق من «حسابي».' }),
    msg
  ], acts: [{ t: 'إرسال', cls: 'dark', keep: true, fn: async function (close) {
    if (ta.value.trim().length < 4) { msg.textContent = 'اكتب ملاحظتك أولاً.'; ta.focus(); return; }
    msg.textContent = 'جارٍ الإرسال…';
    let shot = '';
    if (shotI.checked && hasDesign) { try { shot = ED.snapshot(700); } catch (e) {} }
    const it = { kind: kind, text: ta.value.trim(), page: location.hash, tpl: hasDesign ? ED.tplId() : '', track: S.track ? S.track.id : '', program: V6.prog ? V6.prog.id : '',
      ua: navigator.userAgent, vw: innerWidth + '×' + innerHeight, errors: ERRS6.slice(-8), shot: shot, imgs: imgs, v: 6 };
    try { await API6.call('fb_send', V6.token, JSON.stringify(it)); toast('وصلت ملاحظتك، شكراً لك'); close(); track('feedback'); }
    catch (e) { msg.textContent = 'تعذّر الإرسال: ' + e.message; }
  } }, { t: 'إلغاء' }] });
  return m;
}

/* ---------- الجولة التعريفية: تضيء الميزة وتشرحها بسطر ---------- */
const TOURS6 = {
  home: [
    ['[data-tour=q0]', 'المصمّم الذكي', 'اكتب فكرة الإعلان بكلماتك، أو اضغط «دعه يبدع»، فيقترح المساعد تصاميم جاهزة بهوية برنامجك.'],
    ['[data-tour=identity]', 'الهويات', 'لكل مسار أو نشاط هويته، وكل القوالب تعمل بها. اختر الهوية ثم القالب.'],
    ['#progsw', 'برامجك', 'إن كنت في أكثر من برنامج، تنتقل بينها من هنا.'],
    ['#fbbtn', 'ملاحظاتك تصلنا', 'وجدت مشكلة أو عندك فكرة؟ أرسلها من أي صفحة، وتتابع حالتها.'],
    ['#bell', 'ما الجديد', 'كل تحديث في المنصة تجده هنا.']
  ],
  editor: [
    ['.e-rail', 'الأدوات', 'المحتوى، والقوالب، والنصوص، والعناصر، والصور، والألوان، والطبقات. كل أداة تفتح لوحتها هنا.'],
    ['.e-stage', 'التصميم', 'انقر أي عنصر لتحديده، ثم غيّر حجمه أو لونه أو خطه من الشريط فوقه. انقر نقراً مزدوجاً على النص لتكتب فيه مباشرة.'],
    ['.e-stage', 'التحريك الدقيق', 'اسحب العنصر فيلتصق بالمنتصف والهوامش. اضغط Shift أثناء السحب ليتحرك أفقياً أو رأسياً فقط.'],
    ['#e_dl', 'التنزيل والمشاركة', 'نزّل بجودة عالية، أو شارك مباشرة من الجوال.']
  ]
};
function maybeTour(kind, force) {
  if ($('.coach')) return;
  if ($('.modal') && !force) { setTimeout(function () { maybeTour(kind); }, 1500); return; }
  const steps = (TOURS6[kind] || []).filter(function (s) { const n = $(s[0]); return n && n.getBoundingClientRect().width > 0; });
  if (!steps.length) return;
  const done = (V6.me && V6.me.prefs && V6.me.prefs.tours) || {};
  if (done[kind] && !force) return;
  let i = 0;
  const hole = el('div', { class: 'hole' }), tip = el('div', { class: 'tip', role: 'dialog' }), wrap = el('div', { class: 'coach' }, [hole, tip]);
  document.body.appendChild(wrap);
  function finish() { wrap.remove(); const t = Object.assign({}, done); t[kind] = 1; savePrefs6({ tours: t }); window.removeEventListener('resize', place); }
  function place() {
    const s = steps[i], n = $(s[0]); if (!n) return finish();
    n.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const r = n.getBoundingClientRect(), pad = 8;
    Object.assign(hole.style, { left: (r.left - pad) + 'px', top: (r.top - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (r.height + pad * 2) + 'px' });
    tip.innerHTML = '';
    tip.appendChild(el('h4', { text: s[1] })); tip.appendChild(el('p', { class: 'muted small', text: s[2] }));
    tip.appendChild(el('div', { class: 'acts' }, [
      el('button', { type: 'button', class: 'btn dark sm', text: i < steps.length - 1 ? 'التالي' : 'تم', onclick: function () { i++; if (i >= steps.length) finish(); else place(); } }),
      i < steps.length - 1 ? el('button', { type: 'button', class: 'btn ghost sm', text: 'تخطّ', onclick: finish }) : null,
      el('span', { class: 'n', text: (i + 1) + ' / ' + steps.length })
    ]));
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = Math.min(innerWidth - tw - 16, Math.max(16, r.left + r.width / 2 - tw / 2));
    let y = r.bottom + 18; if (y + th > innerHeight - 16) y = Math.max(16, r.top - th - 18);
    if (r.height > innerHeight * 0.6) { y = Math.max(16, innerHeight / 2 - th / 2); x = r.left > tw + 40 ? r.left - tw - 24 : Math.min(innerWidth - tw - 16, r.right + 24); }
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  window.addEventListener('resize', place);
  place();
}
