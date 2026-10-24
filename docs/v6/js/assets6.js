/* ================= أصول البرامج: الهويات والشعارات والصور والخطوط =================
   كل ملف يُطلب من الخادم مرة، ثم يُحفظ في المتصفح (IndexedDB) فلا يُنزَّل ثانية إلا إذا تغيّر */
const ASSET_URL = {};     // معرّف الأصل ← رابط محلي
const ASSET_IMG = {};     // معرّف الأصل ← صورة محمّلة
const FONT_REG = {};      // العائلة ← {label, scope, files: [...]}
const FONT_LOADED = {};   // العائلة|الوزن ← وعد التحميل

async function assetBlob(meta, pub) {
  const key = 'a:' + meta.id + ':' + (meta.ver || 1);
  let blob = await IDB.get(key);
  if (!blob) {
    let b64;
    if (pub) b64 = await API6.call('ui_font_get', meta.id);
    else { const r = await API6.me('asset_get', meta.id); b64 = r.b64; }
    blob = b64ToBlob(b64, meta.mime);
    IDB.put(key, blob);
  }
  return blob;
}
async function assetURL(meta, pub) {
  if (ASSET_URL[meta.id]) return ASSET_URL[meta.id];
  const b = await assetBlob(meta, pub);
  return (ASSET_URL[meta.id] = URL.createObjectURL(b));
}
// تحميل عدة ملفات معاً بحد أقصى للتوازي
async function pool(items, n, fn) {
  const out = []; let i = 0;
  async function worker() { while (i < items.length) { const k = i++; try { out[k] = await fn(items[k], k); } catch (e) { console.warn('asset', items[k] && items[k].name, e); } } }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return out;
}
function weightOf(name) {
  const n = String(name || '').toLowerCase();
  const map = [['thin', 100], ['extralight', 200], ['ultralight', 200], ['light', 300], ['regular', 400], ['book', 400], ['medium', 500], ['semibold', 600], ['demibold', 600], ['extrabold', 800], ['ultrabold', 800], ['bold', 700], ['black', 900], ['heavy', 900]];
  for (const m of map) if (n.replace(/[\s_\-]/g, '').indexOf(m[0]) >= 0) return String(m[1]);
  return '400';
}
// اسم العائلة من اسم الملف، مع تسمية ثابتة لخطوط ثمانية لأن الواجهة تعتمد عليها
function familyOf(fileName) {
  const n = String(fileName || '').toLowerCase().replace(/\.(otf|ttf|woff2?)$/, '');
  if (/thmanyah.*serif.*display/.test(n)) return { family: 'thm-display', label: 'ثمانية للعناوين' };
  if (/thmanyah.*serif.*text/.test(n)) return { family: 'thm-text', label: 'ثمانية للنصوص' };
  if (/thmanyah.*sans/.test(n)) return { family: 'thm-sans', label: 'ثمانية' };
  const base = n.split(/[-_]/)[0].replace(/[^a-z0-9]/g, '') || 'font';
  return { family: base, label: base };
}

/* ---------- خطوط الواجهة: تُحمَّل قبل الدخول ---------- */
async function loadUiFonts() {
  let list = ls('uifonts') || [];
  const fresh = API6.json('ui_fonts').then(function (l) { ls('uifonts', l); return l; }).catch(function () { return list; });
  if (!list.length) list = await Promise.race([fresh, new Promise(function (ok) { setTimeout(function () { ok([]); }, 6000); })]);
  await pool(list, 6, async function (f) {
    const url = await assetURL(f, true);
    const ff = new FontFace(f.family, 'url(' + url + ')', { weight: f.wrange || f.weight || '400', style: f.style || 'normal', display: 'swap' });
    await ff.load(); document.fonts.add(ff);
  });
}

/* ---------- بعد الدخول: البرامج وأصولها ---------- */
async function loadBundle() {
  const b = await API6.me('bundle');
  V6.bundle = b; V6.settings = b.settings || {}; V6.mine = b.mine || [];
  V6.assets = {}; b.assets.forEach(function (a) { V6.assets[a.id] = a; });
  b.mine.forEach(function (a) { V6.assets[a.id] = a; });
  // سجل الخطوط: العامة وخطوط البرامج وخطوط المستخدم
  Object.keys(FONT_REG).forEach(function (k) { delete FONT_REG[k]; });
  // خطوط واجهة المنصة (ثمانية) للواجهة فقط، لا للتصاميم
  b.assets.concat(b.mine).filter(function (a) { return a.kind === 'font' && !a.ui; }).forEach(function (a) {
    const r = FONT_REG[a.family] = FONT_REG[a.family] || { family: a.family, label: a.label || a.family, scope: a.scope, program: a.program, files: [] };
    r.files.push(a);
  });
  await loadPacks6();
  const want = ls('prog'), list = b.programs;
  const p = list.find(function (x) { return x.id === want; }) || list[0] || null;
  if (p) await useProgram(p.id, true);
}
// تبديل البرنامج: هوياته في TRACKS، وشعاراته وصوره في ASSETS وIMG
async function useProgram(id, silent) {
  const p = V6.bundle.programs.find(function (x) { return x.id === id; });
  if (!p) return;
  V6.prog = p; ls('prog', id); if (typeof applyAccent === 'function' && curAccent() === 'prog') applyAccent('prog');
  Object.keys(TRACKS).forEach(function (k) { delete TRACKS[k]; });
  (p.identities || []).forEach(function (t) { TRACKS[t.id] = finishTrack(JSON.parse(JSON.stringify(t))); });
  if (id === 'academy') PACK_IDS.forEach(function (t) { if (!TRACKS[t.id]) TRACKS[t.id] = t; });   // هويات أضافتها حزم المهمة الأسبوعية
  // حساب محصور في هويات معيّنة (إثمار فقط مثلاً): إن كان في هذا البرنامج شيء منها، تظهر وحدها
  const only = (V6.me && V6.me.role === 'user' && V6.me.tracks) || [];
  if (only.length && Object.keys(TRACKS).some(function (k) { return only.indexOf(k) >= 0; })) Object.keys(TRACKS).forEach(function (k) { if (only.indexOf(k) < 0) delete TRACKS[k]; });
  const mine = Object.keys(V6.assets).map(function (k) { return V6.assets[k]; }).filter(function (a) { return (a.kind === 'logo' || a.kind === 'photo') && (a.scope === 'global' || a.program === id) && a.key; });
  if (!silent) { document.body.classList.add('loading-prog'); if (!$('#progld')) document.body.appendChild(el('div', { id: 'progld', class: 'progld' }, [loader6('ننتقل إلى ' + p.name + '…')])); }
  await prefetch(mine);
  await pool(mine, 6, async function (a) {
    const url = await assetURL(a);
    ASSETS[a.key] = url;
    IMG[a.key] = await loadImg(url);
  });
  // صور المكتبة للقوالب
  DATE_LIB.length = 0;
  mine.filter(function (a) { return a.kind === 'photo'; }).forEach(function (a) { DATE_LIB.push(a.key); LIB_NAMES[a.key] = a.name; });
  Object.keys(TINT).forEach(function (k) { delete TINT[k]; });
  registerFonts();
  // خط القوالب الافتراضي لهذا البرنامج
  const pref = (p.fonts && p.fonts.title) || (FONT_REG.tajarib ? 'tajarib' : (FONT_REG.tajawal ? 'tajawal' : Object.keys(FONT_REG)[0]));
  FS.title = pref; FS.body = (p.fonts && p.fonts.body) || pref; FS.tw = '';
  await ensureFonts([FS.title, FS.body]);
  document.body.classList.remove('loading-prog'); const pl = $('#progld'); if (pl) pl.remove();
  applyProgramColor(p);
}
function applyProgramColor(p) {
  document.documentElement.style.setProperty('--prog', p.color || '#000');
}

/* ---------- الخطوط للقوالب: كل عائلة بأوزانها، تُحمَّل عند أول استعمال ---------- */
function registerFonts() {
  Object.keys(FONTS).forEach(function (k) { delete FONTS[k]; });
  Object.keys(FONT_REG).forEach(function (fam) {
    const r = FONT_REG[fam];
    if (r.scope === 'program' && r.program && V6.prog && r.program !== V6.prog.id) return;
    const ws = []; let vr = null;
    r.files.forEach(function (f) { if (f.wrange) { const m = f.wrange.split(/\s+/).map(Number); vr = [m[0], m[1] || m[0]]; } else ws.push(+f.weight || 400); });
    const pick = function (w) {
      if (vr) return Math.max(vr[0], Math.min(vr[1], w));
      return ws.slice().sort(function (a, b) { return Math.abs(a - w) - Math.abs(b - w) || b - a; })[0] || 400;
    };
    const w = {}; [['l', 300], ['r', 400], ['m', 500], ['b', 700], ['k', 900]].forEach(function (q) { w[q[0]] = fam + '|' + pick(q[1]); });
    FONTS[fam] = { name: r.label, w: w, fake: !vr && ws.length === 1, v6: true };
  });
  if (!FONTS.tajarib && FONTS.tajawal) FONTS.tajarib = FONTS.tajawal;   // تصاميم قديمة تشير إلى «تجارب»
}
function fontFileFor(fam, weight) {
  const r = FONT_REG[fam]; if (!r) return null;
  const v = r.files.find(function (f) { return f.wrange; }); if (v) return v;
  return r.files.slice().sort(function (a, b) { return Math.abs((+a.weight || 400) - weight) - Math.abs((+b.weight || 400) - weight); })[0];
}
// يضمن تحميل كل أوزان العائلات المطلوبة قبل الرسم
async function ensureFonts(fams) {
  const jobs = [];
  (fams || []).filter(Boolean).forEach(function (fam) {
    const F = FONTS[fam]; if (!F) return;
    Object.keys(F.w).forEach(function (k) {
      const parts = F.w[k].split('|'), w = +parts[1] || 400, f = fontFileFor(parts[0], w);
      if (!f) return;
      const key = f.id;
      if (!FONT_LOADED[key]) FONT_LOADED[key] = (async function () {
        const url = await assetURL(f, !!f.ui);
        const ff = new FontFace(parts[0], 'url(' + url + ')', { weight: f.wrange || String(f.weight || 400), style: f.style || 'normal' });
        await ff.load(); document.fonts.add(ff);
      })().catch(function (e) { console.warn('font', fam, e); delete FONT_LOADED[key]; });
      jobs.push(FONT_LOADED[key]);
    });
  });
  await Promise.all(jobs);
}
// الخطوط التي يستعملها تصميم معيّن
function fontsOfState(st) {
  const s = [FS.title, FS.body];
  Object.keys((st && st.gs) || {}).forEach(function (g) { if (st.gs[g].f) s.push(st.gs[g].f); });
  ((st && st.layers) || []).forEach(function (L) { if (L.f) s.push(L.f); });
  return s.filter(function (x, i, a) { return x && a.indexOf(x) === i; });
}

/* ---------- صور المستخدم المحفوظة على الخادم ---------- */
function assetImage(id) {
  if (ASSET_IMG[id]) return ASSET_IMG[id];
  if (ASSET_IMG[id] === null) return null;
  ASSET_IMG[id] = null;
  const meta = V6.assets[id] || { id: id, ver: 1, mime: 'image/png' };
  assetURL(meta).then(loadImg).then(function (im) { ASSET_IMG[id] = im; if (typeof redraw === 'function') redraw(); }).catch(function () {});
  return null;
}
async function uploadAsset(file, meta) {
  const b64 = await blobToB64(file);
  const m = Object.assign({ name: file.name, mime: file.type || 'application/octet-stream' }, meta);
  const res = await API6.me('asset_put', JSON.stringify(m), b64);
  IDB.put('a:' + res.id + ':' + res.ver, file);
  V6.assets[res.id] = res;
  if (res.scope === 'user') V6.mine.unshift(res);
  return res;
}

/* ---------- حزم القوالب الأسبوعية: نفس حزم الإصدار الخامس، تُحفظ في المتصفح وتتحدّث في الخلفية ---------- */
const PACK_IDS = [];
let PACKS_DONE = false;
async function loadPacks6() {
  if (PACKS_DONE) return; PACKS_DONE = true;
  let list = ls('packs');
  const fresh = API6.json('api_packs').then(function (l) { const old = JSON.stringify(ls('packs') || []); ls('packs', l); if (list && old !== JSON.stringify(l)) toast('أُضيفت قوالب جديدة، وتظهر عند فتح المنصة القادم.'); return l; }).catch(function () { return null; });
  if (!list) list = (await Promise.race([fresh, new Promise(function (ok) { setTimeout(function () { ok(null); }, 9000); })])) || [];
  const before = {}; Object.keys(TRACKS).forEach(function (k) { before[k] = 1; });
  list.forEach(function (p) {
    const sc = document.createElement('script');
    sc.text = 'try {\n' + p.code + '\n} catch (e) { console.error("pack", ' + JSON.stringify(String(p.name)) + ', e); }';
    document.head.appendChild(sc);
  });
  Object.keys(TRACKS).forEach(function (k) { if (!before[k]) PACK_IDS.push(TRACKS[k]); });
  await Promise.all(Object.keys(ASSETS).filter(function (k) { return !IMG[k] && /^data:/.test(ASSETS[k]); }).map(async function (k) { IMG[k] = await loadImg(ASSETS[k]); }));
}

// أول تحميل: الملفات الصغيرة غير المحفوظة في المتصفح تُطلب دفعات في طلبات قليلة
async function prefetch(list) {
  const need = [];
  for (const a of list) { if (ASSET_URL[a.id]) continue; const hit = await IDB.get('a:' + a.id + ':' + (a.ver || 1)); if (!hit && (a.size || 0) < 1500000) need.push(a); }
  const groups = []; let g = [], sz = 0;
  need.forEach(function (a) { if (g.length >= 10 || sz + (a.size || 0) > 6e6) { groups.push(g); g = []; sz = 0; } g.push(a); sz += a.size || 0; });
  if (g.length) groups.push(g);
  await pool(groups, 3, async function (grp) {
    const r = await API6.me('asset_batch', grp.map(function (a) { return a.id; }));
    grp.forEach(function (a) { if (r[a.id]) { const blob = b64ToBlob(r[a.id], a.mime); IDB.put('a:' + a.id + ':' + (a.ver || 1), blob); ASSET_URL[a.id] = URL.createObjectURL(blob); } });
  });
}
