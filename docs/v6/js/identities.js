/* ================= الهويات: المسارات والأنشطة ================= */
/* كل هوية بطاقة واحدة: اسمها وشعارها وألوانها. القوالب لا تعرف إلا هذه الأسماء:
   p أساسي، pd أساسي داكن، pl أساسي فاتح، s ثانوي، sd ثانوي داكن، sdd أدكن،
   a تمييز، a2 تمييز ثانٍ، paper ورق، warm ورق دافئ، ink حبر، muted رمادي، teal لون ليلي، tealL فاتحه
   group: track مسار، act نشاط تربوي.  logos: نسخ الشعار (مثل الدفعات) */
const TRACKS = {
  judhoor: {
    id: 'judhoor', group: 'track', name: 'جذور', full: 'مسار جـذور', logo: 'logo',
    desc: 'المرحلة التأسيسية',
    c: { p: '#467839', pd: '#2d4d24', pl: '#68b251', s: '#654b37', sd: '#433125', sdd: '#33251c', a: '#fbb03b', a2: '#f99229',
      paper: '#f8f8f8', warm: '#ebe7e1', ink: '#2b2b2b', muted: '#8d8d8d', teal: '#0e423e', tealL: '#4b9d97' }
  },
  ishraq: {
    id: 'ishraq', group: 'track', name: 'إشراق', full: 'مسار إشـراق', logo: 'lg_ishraq',
    desc: 'البرتقالي الدافئ والورق الوردي',
    c: { p: '#f4793d', pd: '#bc450b', pl: '#f8a57a', s: '#8a3a12', sd: '#5e2509', sdd: '#3b1a0b', a: '#fbb03b', a2: '#e8642a',
      paper: '#fff8f4', warm: '#fdebe1', ink: '#2b2b2b', muted: '#8d8d8d', teal: '#1f4f4b', tealL: '#5fa9a3' }
  },
  budhoor: {
    id: 'budhoor', group: 'track', name: 'بذور', full: 'مسار بـذور', logo: 'lg_budhoor',
    desc: 'البنفسجي والبرتقالي',
    c: { p: '#672e8f', pd: '#451e5f', pl: '#9a62c2', s: '#d9661e', sd: '#9a4210', sdd: '#2a1340', a: '#faa854', a2: '#f68b1f',
      paper: '#faf8fc', warm: '#efe9f3', ink: '#2b2b2b', muted: '#8d8d8d', teal: '#1c2a45', tealL: '#6f7fa8' }
  },
  ithmar: {
    id: 'ithmar', group: 'track', name: 'إثمار', full: 'مسار إثـمار', logo: 'lg_ithmar',
    logos: [['lg_ithmar', 'بلا رقم'], ['lg_ithmar2', 'الدفعة ٢'], ['lg_ithmar3', 'الدفعة ٣']],
    desc: 'العنابي والبرتقالي',
    c: { p: '#8a1e50', pd: '#571435', pl: '#c0557f', s: '#8f5a74', sd: '#5a3046', sdd: '#3a1626', a: '#fa9020', a2: '#f26b21',
      paper: '#f9f5f6', warm: '#efe6ea', ink: '#2b2b2b', muted: '#8d8d8d', teal: '#2f3a52', tealL: '#7d8fb0' }
  },
  sanabel: {
    id: 'sanabel', group: 'track', name: 'سنابل', full: 'مسار سنـابل', logo: 'lg_sanabel',
    desc: 'البنفسجي الرمادي والأخضر الفاتح',
    c: { p: '#5a5881', pd: '#3b3a5c', pl: '#8a88b5', s: '#7d8f3e', sd: '#55632a', sdd: '#262540', a: '#c5d36f', a2: '#93a642',
      paper: '#f8f8fa', warm: '#ecebf2', ink: '#2b2b2b', muted: '#8d8d8d', teal: '#2f3d3a', tealL: '#7a9a8e' }
  },
  anshita: {
    id: 'anshita', group: 'act', name: 'الأنشطة التربوية', full: 'الأنشطة التربوية', logo: 'lg_anshita',
    desc: 'هوية الأنشطة العامة',
    c: { p: '#16817a', pd: '#0e5753', pl: '#4bb0a8', s: '#512c62', sd: '#3b1f48', sdd: '#2a1534', a: '#f7931e', a2: '#f45905',
      paper: '#f8f8f8', warm: '#eceae6', ink: '#2b2b2b', muted: '#8d8d8d', teal: '#0d4f4b', tealL: '#4b9d97' }
  },
  tiryaq: {
    id: 'tiryaq', group: 'act', name: 'ترياق', full: 'ترياق ٧', logo: 'lg_tiryaq',
    logos: [['lg_tiryaq', 'ترياق'], ['lg_risala', 'مع حملة الرسالة']],
    desc: 'الأخضر المزرق والليل',
    c: { p: '#2f7a70', pd: '#1e4f49', pl: '#7fb3a9', s: '#3a4152', sd: '#2c3242', sdd: '#1d2230', a: '#f2a33a', a2: '#e0782f',
      paper: '#f1f2ef', warm: '#e4e8e4', ink: '#2b2b2b', muted: '#8d8d8d', teal: '#1d2e40', tealL: '#5d7f8c' }
  },
  multaqa: {
    id: 'multaqa', group: 'act', name: 'الملتقى الجامعي', full: 'الملتقى الجامعي', logo: 'lg_multaqa',
    desc: 'الموفي والكريمي',
    c: { p: '#855970', pd: '#5c3a4d', pl: '#b58da2', s: '#6b5560', sd: '#4a3540', sdd: '#2e2028', a: '#e8a25b', a2: '#c96f3b',
      paper: '#f6efea', warm: '#efe1d8', ink: '#2b2b2b', muted: '#8d8d8d', teal: '#3b2d40', tealL: '#8a7090' }
  },
  rifaq: {
    id: 'rifaq', group: 'act', name: 'رفاق الأنشطة', full: 'رفاق الأنشطة', logo: 'lg_rifaq',
    desc: 'الكحلي والعنابي والذهبي',
    c: { p: '#2a8a84', pd: '#1c424b', pl: '#7cc0bb', s: '#981b47', sd: '#6e1233', sdd: '#14323a', a: '#fbb03b', a2: '#e9883b',
      paper: '#fafafa', warm: '#f1ece4', ink: '#2b2b2b', muted: '#8d8d8d', teal: '#1c424b', tealL: '#5f9aa2' }
  },
  academy: {
    id: 'academy', group: 'act', name: 'الأكاديمية', full: 'أكاديمية الجيل الصاعد', logo: 'lg_academy',
    desc: 'للإعلانات العامة',
    c: { p: '#16817a', pd: '#0e5753', pl: '#4bb0a8', s: '#512c62', sd: '#3b1f48', sdd: '#24122e', a: '#f7931e', a2: '#c70d3a',
      paper: '#f8f8f8', warm: '#eceae6', ink: '#2b2b2b', muted: '#8d8d8d', teal: '#0d4f4b', tealL: '#4b9d97' }
  }
};
const GROUPS = [['track', 'المسارات'], ['act', 'الأنشطة التربوية']];
// ألوان الأكاديمية: هوية الموقع نفسه
const ACADEMY = { orange: '#f45905', red: '#c70d3a', purple: '#512c62', teal: '#16817a' };

function finishTrack(t) {
  if (!t.swatches) { const c = t.c; t.swatches = [c.pd, c.p, c.pl, c.sdd, c.sd, c.s, c.teal, c.a, c.a2, c.warm, c.paper, '#ffffff', '#2b2b2b']; }
  t.swatches = t.swatches.map(function (x) { return x.toLowerCase(); }).filter(function (x, i, a) { return a.indexOf(x) === i; });
  return t;
}
Object.keys(TRACKS).forEach(function (k) { finishTrack(TRACKS[k]); });

/* ألوان المقترحات في القوالب كُتبت بألوان جذور؛ تُترجم لكل هوية عبر اسم اللون */
const JZ_REV = {};
(function () { const c = TRACKS.judhoor.c; Object.keys(c).forEach(function (k) { if (!JZ_REV[c[k].toLowerCase()]) JZ_REV[c[k].toLowerCase()] = k; }); })();
function swOf(arr, T) { return (arr || []).map(function (h) { const k = JZ_REV[String(h).toLowerCase()]; return k && T.c[k] ? T.c[k] : h; }); }

/* الهوية مع اختيار المستخدم لنسخة الشعار (مثل دفعة إثمار) */
function trackOf(id) {
  const t = TRACKS[id]; if (!t) return null;
  const pref = (typeof PREFS !== 'undefined' && PREFS.logos && PREFS.logos[id]) || '';
  if (t.logos && pref && t.logos.some(function (x) { return x[0] === pref; })) return Object.assign({}, t, { logo: pref });
  return t;
}
/* تسجيل حزمة مضافة أسبوعياً من مجلد «حزم القوالب»: هويات وقوالب جديدة */
const PACKS = [];
function PACK(p) {
  try {
    (p.identities || []).forEach(function (t) {
      if (!t.id || !t.c) return;
      if (t.logoData) { ASSETS['lg_' + t.id] = t.logoData; t.logo = 'lg_' + t.id; }
      TRACKS[t.id] = finishTrack(Object.assign({ group: 'act', full: t.name, desc: '' }, t));
    });
    (p.assets || []).forEach(function (a) { if (a.key && a.data) ASSETS[a.key] = a.data; });
    (p.templates || []).forEach(function (tpl) {
      if (!tpl.id || typeof tpl.draw !== 'function') return;
      const i = TEMPLATES.findIndex(function (x) { return x.id === tpl.id; });
      tpl.pack = p.id || 'pack';
      if (i >= 0) TEMPLATES[i] = tpl; else TEMPLATES.push(tpl);
    });
    PACKS.push({ id: p.id, note: p.note || '', n: (p.templates || []).length });
  } catch (e) { console.error('pack', p && p.id, e); }
}
