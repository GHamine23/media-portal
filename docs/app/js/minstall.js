/* ================= التثبيت على الشاشة الرئيسية وعامل الخدمة =================
   أندرويد/كروم: حدث beforeinstallprompt يتيح زر تثبيت مباشر. آيفون: لا حدث، فنعرض خطوات «مشاركة ← إضافة إلى الشاشة الرئيسية» مصوّرة. */
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); M.installEvt = e; $$('.mbanner').forEach(function (b) { b.hidden = false; }); });
window.addEventListener('appinstalled', function () { M.installEvt = null; toast('ثُبّت التطبيق على جهازك 🎉'); haptic('ok'); $$('.mbanner').forEach(function (b) { b.remove(); }); try { ls('installDismiss', null); } catch (e) {} });
function shareIcon() { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'shareic'); s.innerHTML = '<path d="M12 16V3M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 11v8.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'; return s; }
function installSheet() {
  const icon = el('img', { class: 'appicon', src: 'icons/icon-192.png', alt: '' });
  if (M.installEvt) {
    msheet({ title: 'ثبّت تطبيق أثر', body: [el('div', { class: 'minstall' }, [icon, el('p', { text: 'يُضاف إلى شاشتك الرئيسية ويفتح بملء الشاشة كأي تطبيق، ويعمل أسرع لأن ملفاته محفوظة على جهازك.' })])],
      acts: [{ t: 'ثبّت الآن', cls: 'dark', fn: async function () { const ev = M.installEvt; if (!ev) return; ev.prompt(); try { const r = await ev.userChoice; if (r.outcome === 'accepted') haptic('ok'); } catch (e) {} M.installEvt = null; } }, { t: 'ليس الآن' }] });
    return;
  }
  const ios = isIOS();
  msheet({ title: 'ثبّت تطبيق أثر', body: [el('div', { class: 'minstall' }, [icon,
    el('p', { text: ios ? 'في سفاري، ثلاث خطوات:' : 'من قائمة المتصفح:' }),
    el('ol', {}, ios ? [
      el('li', {}, ['اضغط زر ', el('b', { text: 'المشاركة ' }), shareIcon(), ' في أسفل الشاشة (أو أعلاها في آيباد).']),
      el('li', {}, ['اختر ', el('b', { text: '«إضافة إلى الشاشة الرئيسية»' }), '.']),
      el('li', {}, ['اضغط ', el('b', { text: '«إضافة»' }), '، ثم افتح أثر من شاشتك الرئيسية.'])
    ] : [
      el('li', {}, ['افتح قائمة المتصفح (النقاط الثلاث ⋮).']),
      el('li', {}, ['اختر ', el('b', { text: '«تثبيت التطبيق»' }), ' أو ', el('b', { text: '«إضافة إلى الشاشة الرئيسية»' }), '.'])
    ]),
    ios && !/Safari/.test(navigator.userAgent) || (ios && /CriOS|FxiOS/.test(navigator.userAgent)) ? el('p', { class: 'tiny', text: 'التثبيت في آيفون يكون من متصفح سفاري فقط؛ افتح هذا الرابط فيه.' }) : null,
    el('p', { class: 'tiny', text: 'التطبيق هو المنصة نفسها بواجهة الجوال: حسابك وتصاميمك واحدة في كل مكان.' })])],
    acts: [{ t: 'فهمت' }] });
}
// بطاقة في الرئيسية تدعو إلى التثبيت (تختفي بعد التثبيت، وتُؤجَّل أسبوعاً عند الرفض)
function installBanner() {
  if (isStandalone()) return null;
  const until = ls('installDismiss'); if (until && until > Date.now()) return null;
  const b = el('div', { class: 'mbanner' }, [el('img', { src: 'icons/icon-192.png', alt: '' }), el('span', { class: 'mt' }, [el('b', { text: 'ثبّت أثر على شاشتك الرئيسية' }), el('small', { text: 'يفتح كتطبيق، وأسرع، وبلا شريط المتصفح' })]),
    el('button', { type: 'button', class: 'btn', text: 'ثبّت', onclick: function () { installSheet(); } }),
    el('button', { type: 'button', class: 'ib', 'aria-label': 'لاحقاً', style: 'color:#fff;min-width:36px', onclick: function () { ls('installDismiss', Date.now() + 7 * 864e5); b.remove(); } }, [ico('close')])]);
  return b;
}
// عامل الخدمة: يحفظ ملفات التطبيق، ويخبرنا بالنسخة الجديدة
function registerSW() {
  if (!('serviceWorker' in navigator) || window.DEMO || location.protocol === 'file:') return;
  navigator.serviceWorker.register('./sw.js').then(function (reg) {
    try { reg.update(); } catch (e) {}
    reg.addEventListener('updatefound', function () {
      const nw = reg.installing; if (!nw) return;
      nw.addEventListener('statechange', function () {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
          const t = el('div', { class: 'toast show', role: 'status' }, [el('span', { text: 'نسخة جديدة من التطبيق جاهزة ' }), el('button', { type: 'button', class: 'btn sm', style: 'margin-inline-start:8px;background:#fff;color:#000;min-height:30px', text: 'حدّث', onclick: function () { nw.postMessage({ type: 'SKIP_WAITING' }); } })]);
          document.body.appendChild(t); setTimeout(function () { t.remove(); }, 15000);
        }
      });
    });
  }).catch(function () {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () { if (reloaded) return; reloaded = true; location.reload(); });
}
