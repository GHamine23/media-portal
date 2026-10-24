/* ================= الإضافات: صور مجانية (Pexels)، ورمز QR، وأيقونات Tabler، وآيات وأحاديث موثقة، وتصحيح وتشكيل بالذكاء ================= */

/* ---------- صور مجانية: Openverse (بلا مفتاح، من المتصفح مباشرة) وويكيميديا، وPixabay/Pexels إن ضُبط مفتاح، وتوليد صور بالذكاء (Pollinations، مجاني بلا مفتاح) ----------
   الصورة التي تختارها تُحفظ بأصلها كاملاً في مكتبتك عبر الخادم، مع اسم المصوّر ورخصته. */
const IMG_SRC = [['openverse', 'Openverse'], ['wikimedia', 'ويكيميديا'], ['keyed', 'Pixabay/Pexels'], ['ai', 'توليد بالذكاء']];
async function openverseFind(q, page, orient) {
  const ar = orient === 'portrait' ? 'tall' : orient === 'landscape' ? 'wide' : orient === 'square' ? 'square' : '';
  const r = await fetch('https://api.openverse.org/v1/images/?q=' + encodeURIComponent(q) + '&page_size=20&page=' + page + '&mature=false&license_type=commercial' + (ar ? '&aspect_ratio=' + ar : ''), { headers: { Accept: 'application/json' } });
  if (r.status === 429) throw new Error('بلغنا حد البحث الآن في Openverse؛ انتظر دقيقة');
  if (!r.ok) throw new Error('Openverse ' + r.status);
  const j = await r.json();
  return { total: j.result_count || 0, photos: (j.results || []).map(function (p) { return { id: p.id, w: p.width || 0, h: p.height || 0, thumb: p.thumbnail || p.url, big: p.url, orig: p.url, by: p.creator || '', byUrl: p.creator_url || '', url: p.foreign_landing_url || '', alt: p.title || '', license: p.license ? ('CC ' + String(p.license).toUpperCase() + ' ' + (p.license_version || '')).trim() : '', licenseUrl: p.license_url || '', src: 'Openverse' + (p.source ? ' · ' + p.source : '') }; }) };
}
async function wikimediaFind(q, page, orient) {
  const r = await fetch('https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' + encodeURIComponent('filetype:bitmap ' + q) + '&gsrnamespace=6&gsrlimit=24&gsroffset=' + ((page - 1) * 24) + '&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=480&iiextmetadatafilter=Artist|LicenseShortName|LicenseUrl|ImageDescription&format=json&origin=*');
  if (!r.ok) throw new Error('ويكيميديا ' + r.status);
  const j = await r.json(), pages = (j.query && j.query.pages) || {};
  const list = Object.keys(pages).map(function (k) { return pages[k]; }).sort(function (a, b) { return (a.index || 0) - (b.index || 0); }).filter(function (p) { return p.imageinfo && p.imageinfo[0] && /^image\/(jpeg|png|webp)/.test(p.imageinfo[0].mime || 'image/jpeg'); }).map(function (p) {
    const ii = p.imageinfo[0], m = ii.extmetadata || {}, strip = function (h) { return String((h && h.value) || '').replace(/<[^>]+>/g, '').trim(); };
    return { id: p.pageid, w: ii.width, h: ii.height, thumb: ii.thumburl || ii.url, big: ii.url, orig: ii.url, by: strip(m.Artist).slice(0, 60), byUrl: '', url: ii.descriptionurl || '', alt: String(p.title || '').replace(/^File:/, '').replace(/\.[a-z]+$/i, ''), license: strip(m.LicenseShortName), licenseUrl: strip(m.LicenseUrl), src: 'Wikimedia Commons' };
  });
  const want = orient === 'portrait' ? function (p) { return p.h > p.w * 1.1; } : orient === 'landscape' ? function (p) { return p.w > p.h * 1.2; } : orient === 'square' ? function (p) { return Math.abs(p.w - p.h) < p.w * 0.25; } : null;
  return { total: list.length, photos: want ? list.filter(want) : list };
}
function freeImagesSection(b) {
  b.appendChild(el('h4', { class: 'psh', text: 'صور مجانية' }));
  b.appendChild(el('p', { class: 'tiny', text: 'ابحث في ملايين الصور بتراخيص المشاع الإبداعي، أو ولّد صورة بالذكاء من وصفك. ما تختاره يُحفظ بجودته الكاملة في مكتبتك.' }));
  const keyed = V6.settings && V6.settings.imgKeys && (V6.settings.imgKeys.pixabay || V6.settings.imgKeys.pexels);
  let src = ls('imgSrc') || 'openverse'; if (src === 'keyed' && !keyed) src = 'openverse';
  const q = el('input', { type: 'search', class: 'inp sm', placeholder: 'ابحث: mosque, nature, book…', 'aria-label': 'بحث عن صورة' });
  let orient = sizeOrient();
  const res = el('div', { class: 'pxgrid' }), more = el('button', { type: 'button', class: 'btn sm line', text: 'المزيد', hidden: true });
  const suggest = el('label', { class: 'tog tiny' }, [el('input', { type: 'checkbox', id: 'px_sug' }), el('span', { text: 'اقترحها لمكتبة البرنامج' })]);
  const credit = el('p', { class: 'tiny pxcredit' });
  let page = 1, lastQ = '', gen = 0;
  const srcSeg = segOf(IMG_SRC.filter(function (x) { return x[0] !== 'keyed' || keyed; }), src, function (v) { src = v; ls('imgSrc', v); lastQ = ''; res.innerHTML = ''; more.hidden = true; aiBox.hidden = v !== 'ai'; searchRow.hidden = v === 'ai'; setCredit(); if (v !== 'ai' && q.value.trim()) search(1); });
  function setCredit() {
    credit.innerHTML = '';
    if (src === 'openverse') credit.append('الصور من ', el('a', { href: 'https://openverse.org', target: '_blank', rel: 'noopener', text: 'Openverse' }), ' بتراخيص المشاع الإبداعي (فليكر، ويكيميديا، وغيرها). يُحفظ اسم المصوّر والرخصة مع كل صورة، واذكرهما عند النشر إن طلبت الرخصة ذلك.');
    else if (src === 'wikimedia') credit.append('الصور من ', el('a', { href: 'https://commons.wikimedia.org', target: '_blank', rel: 'noopener', text: 'Wikimedia Commons' }), ' برخصها الحرة؛ يُحفظ المصدر والرخصة مع الصورة.');
    else if (src === 'keyed') credit.append('الصور من ', el('a', { href: 'https://pixabay.com', target: '_blank', rel: 'noopener', text: 'Pixabay' }), ' و', el('a', { href: 'https://www.pexels.com', target: '_blank', rel: 'noopener', text: 'Pexels' }), ' برخصتيهما المجانيتين.');
    else credit.append('التوليد عبر ', el('a', { href: 'https://pollinations.ai', target: '_blank', rel: 'noopener', text: 'Pollinations' }), ' (مجاني، بلا مفتاح). الصور المولّدة قد تخطئ في التفاصيل والنصوص؛ راجعها، ولا تولّد وجوهاً أو شخصيات.');
  }
  async function search(p) {
    const text = q.value.trim(); if (!text) { q.focus(); return; }
    if (text !== lastQ) { res.innerHTML = ''; page = 1; } else page = p || page; res.className = 'pxgrid';
    lastQ = text; more.hidden = true;
    const my = ++gen, sk = el('p', { class: 'tiny' }, [el('span', { class: 'spin' }), ' نبحث…']); res.appendChild(sk);
    try {
      let r;
      if (src === 'openverse') { try { r = await openverseFind(text, page, orient); } catch (e) { r = await API6.me('img_search', text, page, orient); } }
      else if (src === 'wikimedia') r = await wikimediaFind(text, page, orient);
      else r = await API6.me('img_search', text, page, orient);
      if (my !== gen) return;   // بحث أحدث بدأ
      sk.remove();
      if (!r.photos.length && page === 1) { res.appendChild(el('p', { class: 'tiny', text: 'لا نتائج. جرّب كلمة إنجليزية أو مصدراً آخر.' })); return; }
      r.photos.forEach(function (p, i) {
        const bt = el('button', { type: 'button', class: 'pxb rv', style: '--d:' + (i % 8) + ';background-color:' + (p.color || '#e9e9e9'), title: (p.alt || '') + (p.by ? ' — ' + p.by : '') + (p.license ? ' · ' + p.license : ''), onclick: function () { return pickFree(p, bt); } });
        const im = new Image(); im.onload = function () { bt.style.backgroundImage = 'url(' + p.thumb + ')'; bt.classList.add('ld'); }; im.onerror = function () { bt.classList.add('bad'); }; im.src = p.thumb;
        bt.appendChild(el('small', { text: p.by || p.src || '' }));
        if (p.license) bt.appendChild(el('i', { class: 'lic', text: p.license.replace(/^CC /, '') }));
        res.appendChild(bt);
      });
      revealAll(res);
      more.hidden = r.photos.length < 18;
    } catch (e) { if (my !== gen) return; sk.remove(); res.appendChild(el('p', { class: 'err tiny', text: e.message })); }
  }
  async function pickFree(p, bt) {
    bt.classList.add('busy');
    try {
      const r = await API6.me('img_pick', JSON.stringify({ orig: p.orig, thumb: p.thumb, name: (p.alt || 'صورة') + (p.by ? ' — ' + p.by : ''), alt: p.alt, by: p.by, byUrl: p.byUrl, url: p.url, license: p.license || '', licenseUrl: p.licenseUrl || '', src: p.src || '', prompt: p.prompt || '', program: V6.prog.id, suggest: $('#px_sug') && $('#px_sug').checked }));
      V6.assets[r.asset.id] = r.asset; if (r.asset.scope === 'user') V6.mine.unshift(r.asset);
      addLayer6({ t: 'img', ref: 'asset:' + r.asset.id, w: 0.6 });
      bt.classList.add('picked'); flashOk(bt);
      toast(r.request ? 'أُضيفت إلى تصميمك ومكتبتك، وأُرسل اقتراحها للمشرف' : (r.asset.scope === 'program' ? 'أُضيفت إلى مكتبة البرنامج' : 'أُضيفت إلى تصميمك ومكتبتك'));
      track('tool', { tool: src === 'ai' ? 'imggen' : 'freeimg' });
    } catch (e) { toast(e.message); }
    bt.classList.remove('busy');
  }
  more.onclick = function () { return search(page + 1); };
  q.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); search(1); } });
  const ai = aiReady() ? el('button', { type: 'button', class: 'btn sm line', title: 'يقترح كلمات بحث من نصوص تصميمك', onclick: function (e) {
    return withBusy(e.currentTarget, async function () { const words = await imgQueryAI(); if (words.length) { q.value = words[0]; search(1); const alt = el('div', { class: 'row wrapr' }, words.slice(1, 4).map(function (w) { return el('button', { type: 'button', class: 'chip', onclick: function () { q.value = w; search(1); } }, [w]); })); res.parentNode.insertBefore(alt, res); } }, { done: 'اقترح' });
  } }, [ico('ai'), 'اقترح']) : null;
  const searchRow = el('div', {}, [el('div', { class: 'row' }, [q, el('button', { type: 'button', class: 'btn sm dark', 'aria-label': 'ابحث', onclick: function () { return search(1); } }, [ico('search')]), ai]),
    el('div', { class: 'row wrapr' }, [segOf([['', 'الكل'], ['portrait', 'طولي'], ['landscape', 'عرضي'], ['square', 'مربع']], orient, function (v) { orient = v; if (lastQ) { lastQ = ''; search(1); } }), suggest])]);
  // توليد بالذكاء: وصف → أربع صور بمقاس التصميم
  const prompt = el('textarea', { class: 'inp sm', rows: '2', dir: 'auto', placeholder: 'صف الصورة: مسجد عند الفجر بألوان دافئة، زخرفة إسلامية هندسية، كتاب مفتوح على طاولة خشبية…' });
  const styleSel = el('select', { class: 'inp sm', 'aria-label': 'الأسلوب' }, [['photo', 'صورة واقعية'], ['illustration', 'رسم توضيحي'], ['watercolor', 'ألوان مائية'], ['flat', 'تصميم مسطّح'], ['pattern', 'زخرفة إسلامية'], ['minimal', 'بسيط هادئ']].map(function (o) { return el('option', { value: o[0], text: o[1] }); }));
  const STYLE_EN = { photo: 'professional photograph, natural light, high detail', illustration: 'clean digital illustration, soft shading', watercolor: 'watercolor painting, soft edges, paper texture', flat: 'flat vector design, simple shapes, limited palette', pattern: 'islamic geometric pattern, arabesque, symmetrical, ornamental', minimal: 'minimalist, calm, lots of negative space, soft colors' };
  function genSize() { const sz = SIZES[S.size] || { w: 1080, h: 1350 }; const r = sz.w / sz.h; return r > 1.2 ? [1280, 800] : r < 0.9 ? [832, 1216] : [1024, 1024]; }
  async function generate(translated) {
    const text = (translated || prompt.value).trim(); if (!text) { prompt.focus(); return; }
    res.innerHTML = ''; res.className = 'pxgrid two'; more.hidden = true;
    const dim = genSize(), base = text + ', ' + (STYLE_EN[styleSel.value] || '') + ', no text, no watermark, no people faces, tasteful, modest';
    [0, 1, 2, 3].forEach(function (i) {
      const seed = Math.floor(Math.random() * 1e6);
      const u = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(base) + '?width=' + dim[0] + '&height=' + dim[1] + '&seed=' + seed + '&nologo=true&safe=true&enhance=true';
      const p = { id: 'gen' + seed, w: dim[0], h: dim[1], thumb: u, big: u, orig: u, by: 'مولَّدة بالذكاء', byUrl: '', url: '', alt: text.slice(0, 80), license: '', src: 'توليد بالذكاء', prompt: text };
      const bt = el('button', { type: 'button', class: 'pxb gen rv', style: '--d:' + i, title: 'انقر لإضافتها إلى التصميم', onclick: function () { return pickFree(p, bt); } }, [el('span', { class: 'spin' })]);
      const im = new Image(); im.onload = function () { bt.style.backgroundImage = 'url(' + u + ')'; bt.classList.add('ld'); bt.innerHTML = ''; bt.appendChild(el('small', { text: 'صورة ' + (i + 1) })); }; im.onerror = function () { bt.classList.add('bad'); bt.innerHTML = ''; bt.appendChild(el('small', { text: 'تعذّر التوليد' })); }; im.src = u;
      res.appendChild(bt);
    });
    revealAll(res);
    track('tool', { tool: 'imggen_req' });
  }
  const genBtn = el('button', { type: 'button', class: 'btn sm dark', onclick: function (e) {
    const b = e.currentTarget, text = prompt.value.trim(); if (!text) { prompt.focus(); return; }
    // إن كان الوصف عربياً والمساعد متاحاً: نترجمه إلى وصف إنجليزي أدق للتوليد
    if (/[؀-ۿ]/.test(text) && aiReady()) return withBusy(b, async function () { let en = text; try { const raw = await API6.call('ai_make', V6.token, JSON.stringify({ kind: 'imgq', program: V6.prog.id, system: 'ترجم وصف الصورة إلى موجّه إنجليزي دقيق لمولّد صور (جملة واحدة غنية بالتفاصيل البصرية: الموضوع، الإضاءة، الألوان، الزاوية). محتشم ومناسب لبيئة إسلامية، بلا وجوه. أعد JSON: {prompt}', prompt: text, schema: { type: 'OBJECT', properties: { prompt: { type: 'STRING' } }, required: ['prompt'] }, temperature: 0.4 })); en = JSON.parse(raw).prompt || text; } catch (er) {} await generate(en); }, { busy: 'نولّد…', done: 'وُلّدت' });
    return withBusy(b, function () { return generate(text); }, { busy: 'نولّد…', done: 'وُلّدت' });
  } }, [ico('sparkles'), 'ولّد ٤ صور']);
  const aiBox = el('div', { class: 'genbox', hidden: src !== 'ai' }, [withEmoji(prompt, { sm: true }), el('div', { class: 'row wrapr' }, [styleSel, genBtn]), aiNotice('الصور المولّدة تقريبية وقد تخطئ في التفاصيل؛ لا تستعملها لتمثيل أشخاص أو أماكن حقيقية.')]);
  searchRow.hidden = src === 'ai';
  b.appendChild(srcSeg); b.appendChild(searchRow); b.appendChild(aiBox);
  b.appendChild(res); b.appendChild(more); setCredit(); b.appendChild(credit);
}
function sizeOrient() { const sz = SIZES[S.size] || {}; return !sz.w ? '' : sz.w > sz.h * 1.2 ? 'landscape' : sz.h > sz.w * 1.1 ? 'portrait' : 'square'; }
async function imgQueryAI() {
  const texts = Object.keys(S.d || {}).map(function (k) { return typeof S.d[k] === 'string' ? S.d[k] : ''; }).filter(Boolean).join(' | ').slice(0, 600);
  const raw = await API6.call('ai_make', V6.token, JSON.stringify({ kind: 'imgq', program: V6.prog.id, system: 'تقترح كلمات بحث إنجليزية قصيرة لصور فوتوغرافية مجانية تناسب تصميماً تربوياً عربياً. أعد JSON: queries مصفوفة من ٤ عبارات إنجليزية (كلمتان إلى ثلاث)، محتشمة ومناسبة لبيئة إسلامية، بلا أشخاص إلا من الخلف أو بعيدين.', prompt: 'نصوص التصميم: ' + (texts || 'إعلان تربوي'), schema: { type: 'OBJECT', properties: { queries: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['queries'] }, temperature: 0.5 }));
  const o = JSON.parse(raw); return (o.queries || []).map(function (x) { return String(x).trim(); }).filter(Boolean);
}

/* ---------- رمز QR وأيقونات Tabler في لوحة العناصر ---------- */
function qrSection(b) {
  b.appendChild(el('h4', { class: 'psh', text: 'رمز QR' }));
  b.appendChild(el('p', { class: 'tiny', text: 'رابط التسجيل أو القناة يصير رمزاً يُمسح بالهاتف. يُولَّد هنا بلا خدمة خارجية.' }));
  const u = el('input', { type: 'url', class: 'inp sm', dir: 'ltr', placeholder: 'https://…', 'aria-label': 'رابط الرمز' });
  const add = function () { const v = u.value.trim(); if (!/^https?:\/\/\S+$/.test(v)) { toast('اكتب رابطاً يبدأ بـ https://'); u.focus(); return; } addLayer6({ t: 'qr', url: v, w: 0.22, c: '', bg: '#ffffff' }); u.value = ''; };
  u.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); add(); } });
  b.appendChild(el('div', { class: 'row' }, [u, el('button', { type: 'button', class: 'btn sm dark', onclick: add }, [ico('plus'), 'أضف'])]));
  const P = V6.prog && V6.prog.tg; if (P && P.link) b.appendChild(el('button', { type: 'button', class: 'chip', onclick: function () { u.value = P.link; add(); } }, ['رابط قناة البرنامج']));
}
function ticonSection(b) {
  if (typeof TICONS === 'undefined') return;
  b.appendChild(el('h4', { class: 'psh', text: 'أيقونات أكثر' }));
  const C = S.track.c, q = el('input', { type: 'search', class: 'inp sm', placeholder: 'ابحث باسم الأيقونة…', 'aria-label': 'بحث عن أيقونة' });
  const g = el('div', { class: 'libg' });
  function fill() {
    g.innerHTML = ''; const t = q.value.trim();
    Object.keys(TICONS).filter(function (k) { return !t || TICONS[k][0].indexOf(t) >= 0 || k.indexOf(t.toLowerCase()) >= 0; }).slice(0, t ? 94 : 40).forEach(function (k) {
      const bt = el('button', { type: 'button', class: 'libb ticb', title: TICONS[k][0], 'aria-label': TICONS[k][0], onclick: function () { addLayer6({ t: 'ticon', ref: k, w: 0.09, c: C.s, lw: 2 }); } });
      bt.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="' + C.s + '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + TICONS[k][1] + '"/></svg><small>' + TICONS[k][0] + '</small>';
      g.appendChild(bt);
    });
    if (!t) g.appendChild(el('p', { class: 'tiny', text: 'اكتب للبحث في ' + Object.keys(TICONS).length + ' أيقونة.' }));
  }
  q.addEventListener('input', fill); fill();
  b.appendChild(q); b.appendChild(g);
  b.appendChild(el('p', { class: 'tiny', text: 'الأيقونات من مجموعة Tabler المفتوحة (رخصة MIT).' }));
}

/* ---------- آية أو حديث موثّق: نص من مصدر معتمد مع الموضع أو حكم المحدث ---------- */
function verifiedTextDialog(done) {
  let kind = 'ayah', showWeak = false, hsrc = ls('hadithSrc') || 'sunnah';
  const q = el('input', { type: 'search', class: 'inp', placeholder: 'كلمات من الآية، أو: الإسراء ٢٣', 'aria-label': 'بحث' });
  const list = el('div', { class: 'vlist' });
  const hint = el('p', { class: 'tiny', text: 'المصدر: مصحف المدينة (رواية حفص) عبر alquran.cloud.' });
  const weak = el('label', { class: 'tog tiny', hidden: true }, [el('input', { type: 'checkbox', onchange: function (e) { showWeak = e.target.checked; render(); } }), el('span', { text: 'أظهر ما حكمه الضعف أيضاً' })]);
  let items = [];
  function arabicDigits(s) { return String(s).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); }
  function render() {
    list.innerHTML = '';
    const show = kind === 'ayah' ? items : items.filter(function (h) { return showWeak || h.sahih; });
    if (!show.length) { list.appendChild(el('p', { class: 'tiny', text: items.length ? 'كل النتائج ضعيفة الحكم؛ فعّل إظهارها إن أردت.' : 'لا نتائج.' })); return; }
    show.forEach(function (it) {
      const ref = kind === 'ayah' ? '[' + it.surah + ': ' + arabicDigits(it.n) + ']' : (it.source ? it.source + (it.page ? ' ' + arabicDigits(it.page) : '') : '');
      const row = el('div', { class: 'vrow' + (kind === 'hadith' && !it.sahih ? ' weak' : '') }, [
        el('p', { class: 'vtext', text: kind === 'ayah' ? '﴿' + it.text + '﴾' : '«' + it.text + '»' }),
        kind === 'hadith' && it.full && it.full !== it.text ? el('details', { class: 'vfull' }, [el('summary', { class: 'tiny', text: 'النص كاملاً بالسند' }), el('p', { class: 'tiny', dir: 'rtl', text: it.full })]) : null,
        el('div', { class: 'row wrapr tiny' }, [el('span', { class: 'pill', text: kind === 'ayah' ? it.surah + ' ' + arabicDigits(it.n) : (it.grade || 'بلا حكم') }), kind === 'hadith' ? el('span', { text: [it.rawi && 'الراوي: ' + it.rawi, it.muhaddith && 'المحدث: ' + it.muhaddith, ref].filter(Boolean).join(' · ') }) : null,
          el('span', { class: 'sp' }), el('button', { type: 'button', class: 'btn sm dark', text: 'أدرج', onclick: function () { done({ kind: kind, text: it.text, ref: ref, grade: it.grade || '', line: kind === 'ayah' ? '﴿' + it.text + '﴾ ' + ref : '«' + it.text + '» ' + (it.source ? '— ' + ref : '') }); closeTop(); } })])
      ]);
      list.appendChild(row);
    });
  }
  async function search() {
    const t = q.value.trim(); if (!t) { q.focus(); return; }
    list.innerHTML = ''; list.appendChild(el('p', { class: 'tiny', text: 'نبحث…' }));
    const tq = t.replace(/[٠-٩]/g, function (d) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)); });
    try { items = kind === 'ayah' ? await quranFind(tq) : await hadithFind(tq, hsrc); if (kind === 'hadith' && items.length && items[0].fallback) toast('تعذّر الوصول إلى الدرر السنية؛ هذه النتائج من الصحيحين والسنن'); render(); } catch (e) { list.innerHTML = ''; list.appendChild(el('p', { class: 'err tiny', text: e.message })); }
  }
  q.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); search(); } });
  const srcSeg = segOf([['sunnah', 'الصحيحان والسنن'], ['dorar', 'الدرر السنية']], hsrc, function (v) { hsrc = v; ls('hadithSrc', v); hintFor(); if (q.value.trim()) search(); }); srcSeg.hidden = true;
  function hintFor() { hint.textContent = kind === 'ayah' ? 'المصدر: مصحف المدينة (رواية حفص) عبر alquran.cloud.' : hsrc === 'dorar' ? 'المصدر: الموسوعة الحديثية في الدرر السنية مع خلاصة حكم المحدث (عبر الخادم). يُعرض الصحيح والحسن أولاً.' : 'المصدر: قاعدة sunnah.com (صحيح البخاري ومسلم والسنن ورياض الصالحين…) بدرجة الحديث. يُعرض المتن، والنص الكامل بالسند عند الطلب.'; }
  const seg = segOf([['ayah', 'آية'], ['hadith', 'حديث']], kind, function (v) { kind = v; items = []; list.innerHTML = ''; q.placeholder = v === 'ayah' ? 'كلمات من الآية، أو: الإسراء ٢٣' : 'كلمات من الحديث'; hintFor(); weak.hidden = v !== 'hadith'; srcSeg.hidden = v !== 'hadith'; });
  let closeTop = function () {};
  seg.style.flex = 'none';
  modal({ title: 'آية أو حديث موثّق', wide: true, body: [el('div', { class: 'row' }, [seg, q, el('button', { type: 'button', class: 'btn sm dark', onclick: function () { return search(); } }, [ico('search')])]), el('div', { class: 'row wrapr' }, [srcSeg, hint]), weak, list], acts: [{ t: 'إغلاق' }] });
  closeTop = function () { const m = $$('.modal,.msheet').pop(); if (m) { const x = m.querySelector('.acts .btn,.sx'); if (x) x.click(); } };
  setTimeout(function () { q.focus(); }, 50);
}
// إدراج النص الموثّق: في الحقل النصي المحدد، أو طبقة نص جديدة
function insertVerified(r) {
  const g = S.sel && !isLayer(S.sel) ? S.sel : null;
  const f = g ? (S.tpl.fields || []).find(function (x) { return x.k && (x.kind === 'area' || !x.kind) && groupOfField(x.k) === g; }) : null;
  if (f) { S.d[f.k] = r.kind === 'ayah' ? '﴿' + r.text + '﴾' : '«' + r.text + '»'; const src = (S.tpl.fields || []).find(function (x) { return /^(src|by|who|sub)$/.test(x.k) && groupOfField(x.k) !== g; }); if (src && !S.d[src.k]) S.d[src.k] = r.ref; changed6(); buildPanel(); toast('أُدرج في «' + f.label + '»'); }
  else { addLayer6({ t: 'text', txt: r.line, al: 'center', c: '', sz: 0.045, b: 0.6, w: 0.8 }); }
  track('tool', { tool: r.kind });
}

/* ---------- تصحيح إملائي وتشكيل بالذكاء ---------- */
function spellDialog() {
  if (!aiReady()) { toast('يحتاج المساعد الذكي'); return; }
  const fields = (S.tpl.fields || []).filter(function (f) { return f.k && (f.kind === 'area' || !f.kind) && typeof S.d[f.k] === 'string' && S.d[f.k].trim(); });
  const layers = (S.layers || []).filter(function (L) { return L.t === 'text' && String(L.txt || '').trim(); });
  if (!fields.length && !layers.length) { toast('لا نصوص في التصميم'); return; }
  let mode = 'fix';
  const picks = {}; fields.forEach(function (f) { picks['f:' + f.k] = true; }); layers.forEach(function (L) { picks['L:' + L.id] = true; });
  const items = fields.map(function (f) { return { id: 'f:' + f.k, label: f.label, text: S.d[f.k] }; }).concat(layers.map(function (L) { return { id: 'L:' + L.id, label: 'نص حر', text: L.txt }; }));
  const list = el('div', { class: 'splist' }, items.map(function (it) { return el('label', { class: 'tog' }, [el('input', { type: 'checkbox', checked: true, onchange: function (e) { picks[it.id] = e.target.checked; } }), el('span', { text: it.label + ': ' + it.text.replace(/\s+/g, ' ').slice(0, 50) })]); }));
  const out = el('div', { class: 'spout' });
  let result = null;
  async function run() {
    const chosen = items.filter(function (it) { return picks[it.id]; }); if (!chosen.length) { toast('اختر نصاً'); return; }
    out.innerHTML = ''; out.appendChild(el('p', { class: 'tiny', text: 'يراجع المساعد…' }));
    const sys = ['أنت مدقق لغوي عربي لنصوص تصميم تربوي قصيرة.', mode === 'fix' ? 'صحّح الإملاء والهمزات والتاء المربوطة وعلامات الترقيم فقط، ولا تغيّر الأسلوب ولا الكلمات ولا الأسطر.' : mode === 'full' ? 'صحّح الإملاء ثم شكّل النص تشكيلاً كاملاً صحيحاً (كل الحروف)، مع إبقاء الكلمات والأسطر كما هي.' : 'صحّح الإملاء وضع التشكيل حيث يُزيل اللبس فقط (أواخر الكلمات والحروف المشتبهة)، مع إبقاء الكلمات والأسطر كما هي.',
      'احتفظ بعلامات * كما هي في مواضعها (تلوين)، وبالأسطر الجديدة. أعد JSON: items مصفوفة بنفس الترتيب: {id, text, note} وnote سطر قصير بما غيّرت أو فارغ.'].join('\n');
    try {
      const raw = await API6.call('ai_make', V6.token, JSON.stringify({ kind: 'spell', program: V6.prog.id, system: sys, prompt: JSON.stringify(chosen.map(function (c) { return { id: c.id, text: c.text }; })), schema: { type: 'OBJECT', properties: { items: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, text: { type: 'STRING' }, note: { type: 'STRING' } }, required: ['id', 'text'] } } }, required: ['items'] }, temperature: 0.1 }));
      result = JSON.parse(raw).items || [];
      out.innerHTML = '';
      if (!result.length) { out.appendChild(el('p', { class: 'tiny', text: 'لم يعد المساعد شيئاً.' })); return; }
      result.forEach(function (r) { const src = chosen.find(function (c) { return c.id === r.id; }); if (!src) return; const same = src.text === r.text; out.appendChild(el('div', { class: 'sprow' + (same ? ' same' : '') }, [el('small', { class: 'tiny', text: src.label + (same ? ' — لا تغيير' : (r.note ? ' — ' + r.note : '')) }), same ? null : el('del', { text: src.text }), same ? null : el('ins', { text: r.text })])); });
    } catch (e) { out.innerHTML = ''; out.appendChild(el('p', { class: 'err tiny', text: e.message })); }
  }
  modal({ title: 'تصحيح وتشكيل', wide: true, body: [aiNotice('التصحيح من المساعد: راجع الفروق قبل التطبيق، خاصة الأسماء والمصطلحات.'), segOf([['fix', 'تصحيح فقط'], ['part', 'تشكيل حيث يلزم'], ['full', 'تشكيل كامل']], mode, function (v) { mode = v; result = null; out.innerHTML = ''; }), list, el('button', { type: 'button', class: 'btn sm line', onclick: run }, [ico('ai'), 'راجع']), out],
    acts: [{ t: 'طبّق التغييرات', cls: 'dark', fn: function () { if (!result) { toast('اضغط «راجع» أولاً'); return false; } let n = 0; result.forEach(function (r) { const it = items.find(function (x) { return x.id === r.id; }); if (!it || it.text === r.text) return; n++; if (r.id.slice(0, 2) === 'f:') S.d[r.id.slice(2)] = r.text; else { const L = layerById(r.id.slice(2)); if (L) L.txt = r.text; } }); changed6(); buildPanel(); toast(n ? 'طُبّق على ' + n + ' نصاً' : 'لا تغييرات'); track('tool', { tool: 'spell' }); } }, { t: 'إلغاء' }] });
}

/* ---------- لوحة الإدارة: طلبات الصور المقترحة لمكتبة البرنامج ---------- */
async function imgRequestsCard(body, prog) {
  let list; try { list = await API6.me('img_requests', prog); } catch (e) { return; }
  const open = list.filter(function (r) { return r.status === 'new'; });
  if (!open.length) return;
  const card = el('div', { class: 'card hl' }, [el('h3', { text: 'صور اقترحها الفريق للمكتبة' }), el('p', { class: 'tiny', text: 'من الصور المجانية (Pexels). بالموافقة تُنسخ الصورة بأصلها إلى مكتبة البرنامج فيراها الجميع.' })]); body.appendChild(card);
  open.forEach(function (r) {
    const row = el('div', { class: 'imgreq' }, [el('div', { class: 'imgreq-th', style: r.thumb ? 'background-image:url(' + r.thumb + ')' : '' }), el('div', { class: 'grow' }, [el('b', { text: r.title }), el('small', { class: 'tiny', text: 'اقترحها ' + r.name + ' · ' + fmtTime(r.at) + (r.by ? ' · تصوير ' + r.by : '') })]),
      el('button', { type: 'button', class: 'btn sm dark', text: 'أضفها للمكتبة', onclick: async function () { try { await API6.me('img_decide', r.id, true); row.remove(); toast('أُضيفت'); await refreshBundle(); } catch (e) { toast(e.message); } } }),
      el('button', { type: 'button', class: 'btn sm line', text: 'لا', onclick: async function () { try { await API6.me('img_decide', r.id, false); row.remove(); } catch (e) { toast(e.message); } } })]);
    card.appendChild(row);
  });
}

/* ---------- البحث في القرآن من المتصفح مباشرة (alquran.cloud يسمح بذلك)، والخادم بديلاً ---------- */
const QAPI = 'https://api.alquran.cloud/v1/';
let Q_SURAHS = null;
function arNorm(t) { return String(t || '').replace(/[ً-ٰٟۖ-ۭـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').trim(); }
function surahLabel(n) { return String(n || '').replace(/[ً-ٰٟۖ-ۭ]/g, '').replace(/^سورة\s*/, '').trim(); }
async function qget(path) { const r = await fetch(QAPI + path); if (!r.ok) throw new Error('q' + r.status); const j = await r.json(); if (j.code !== 200) throw new Error('q'); return j.data; }
async function quranFind(q) {
  try {
    const m = /^(.+?)\s+(\d{1,3})(?:\s*[-–:]\s*(\d{1,3}))?$/.exec(q);
    if (m) {
      if (!Q_SURAHS) Q_SURAHS = await qget('surah');
      const want = arNorm(m[1]).replace(/^سوره\s*/, '').replace(/^ال/, '').replace(/\s+/g, '');
      const s = Q_SURAHS.find(function (x) { return arNorm(x.name).replace(/^سوره\s*/, '').replace(/^ال/, '').replace(/\s+/g, '') === want; });
      if (s) {
        const a1 = +m[2], a2 = Math.min(a1 + 9, Math.max(a1, +(m[3] || a1)));
        const refs = []; for (let n = a1; n <= a2 && n <= s.numberOfAyahs; n++) refs.push(s.number + ':' + n);
        const out = await Promise.all(refs.map(function (r) { return qget('ayah/' + r + '/quran-simple'); }));
        return out.map(function (d) { return { text: d.text, surah: surahLabel(d.surah.name), sn: d.surah.number, n: d.numberInSurah }; });
      }
    }
    // البحث بالكلمات في النص المجرّد من التشكيل، ثم جلب النص المشكول لكل نتيجة
    const words = q.replace(/[ً-ٰٟ]/g, '').trim();
    let hits = [];
    try { hits = (await qget('search/' + encodeURIComponent(words) + '/all/quran-simple-clean')).matches || []; } catch (e) { hits = []; }
    hits = hits.slice(0, 15);
    const full = await Promise.all(hits.map(function (h) { return qget('ayah/' + h.number + '/quran-simple').catch(function () { return h; }); }));
    return full.map(function (d) { return { text: d.text, surah: surahLabel(d.surah.name), sn: d.surah.number, n: d.numberInSurah }; });
  } catch (e) {
    return await API6.me('quran_find', q);   // إن منع المتصفح الوصول، يبحث الخادم
  }
}
// الأحاديث: أولاً من قاعدة sunnah.com عبر api.islamic.app مباشرة من المتصفح (الصحيحان والسنن ورياض الصالحين… بلا مفتاح)،
// ثم الدرر السنية عبر الخادم (بحكم المحدث)؛ وإن تعذّر أحدهما أكمل الآخر
const SUNNAH_BOOKS6 = { bukhari: 'صحيح البخاري', muslim: 'صحيح مسلم', nasai: 'سنن النسائي', abudawud: 'سنن أبي داود', tirmidhi: 'جامع الترمذي', ibnmajah: 'سنن ابن ماجه', malik: 'موطأ مالك', ahmad: 'مسند أحمد', darimi: 'سنن الدارمي', adab: 'الأدب المفرد', shamail: 'الشمائل المحمدية', riyadussalihin: 'رياض الصالحين', mishkat: 'مشكاة المصابيح', bulugh: 'بلوغ المرام', forty: 'الأربعون النووية', hisn: 'حصن المسلم', virtues: 'فضائل الآيات والسور' };
function matnOf6(t) {
  let s = String(t || '').replace(/\s+/g, ' ').replace(/‏/g, '').trim().replace(/\s*قَالَ أَبُو عِيسَى[\s\S]*$/, '').replace(/\s*قَالَ أَبُو دَاوُدَ[\s\S]*$/, '').trim();
  const qs = s.match(/"\s*([^"]{20,})\s*"/g);
  if (qs) return qs.map(function (x) { return x.replace(/^"\s*|\s*"$/g, ''); }).join(' ').replace(/\s*\.\s*$/, '').trim();
  let m = s.match(/صلى الله عليه وسلم\s*[:،]?\s*(?:قَالَ|يَقُولُ|فَقَالَ|قَالَتْ|فَقَالَتْ)\s*[:«]?\s*([\s\S]{20,})$/);
  if (!m) m = s.match(/(?:^|[،,.]\s*|\s)(?:قَالَ|قَالَتْ)\s+([\s\S]{25,})$/);
  return (m ? m[1] : s).replace(/^[«"\s]+|[»"\s.]+$/g, '').trim();
}
async function sunnahFind(q) {
  const r = await fetch('https://api.islamic.app/v1/hadith/search?q=' + encodeURIComponent(q) + '&lang=ar&limit=25');
  if (!r.ok) throw new Error('مصدر الأحاديث ' + r.status);
  const j = await r.json(), list = (j.data && j.data.results) || [];
  return list.filter(function (x) { return x.ar && x.ar.text; }).map(function (x) {
    const grade = (x.ar.grades && x.ar.grades[0] && x.ar.grades[0].grade) || ((x.collection === 'bukhari' || x.collection === 'muslim') ? 'صحيح' : '');
    return { text: matnOf6(x.ar.text), full: x.ar.text, rawi: '', muhaddith: x.collection === 'bukhari' ? 'البخاري' : x.collection === 'muslim' ? 'مسلم' : '', source: SUNNAH_BOOKS6[x.collection] || x.collection, page: String(x.hadithNumber || ''), grade: grade, sahih: /صحيح|حسن/.test(grade) && !/ضعيف|موضوع|منكر/.test(grade), src: 'sunnah' };
  });
}
async function hadithFind(q, src) {
  if (src === 'dorar') { try { return await API6.me('hadith_find', q, 'dorar'); } catch (e) { if (/غير معروف/.test(e.message)) throw new Error('بحث الدرر يعمل بعد نشر ملف الخادم الجديد في Apps Script.'); throw e; } }
  try { const r = await sunnahFind(q); if (r.length) return r; } catch (e) { console.warn('sunnah', e); }
  try { return await API6.me('hadith_find', q, 'sunnah'); } catch (e) { return await API6.me('hadith_find', q, 'dorar'); }
}
