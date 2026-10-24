import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # جذر المستودع (يعمل في أي نسخة عمل)
"""اختبار «دليل أثر»: صفحة المقدمات (البطل، المسار، التقدّم وحفظه في التفضيلات)، مقدمة أول دخول (مرة، تخطَّ، لا تعرض، لا فوق نافذة، لا في أول ثواني المحرر)،
«اسأل أثر» (السياق والمخطط، الجواب بخطوات وروابط ومقدمة، الإحالة إلى الإشراف ببلاغ من نوع سؤال، البحث في الدليل بلا مساعد)، ونقاط الدخول، والتطبيق بعرض ٣٩٠.
وحدتا الحركة والمعرفة تُقلَّدان هنا فقط (تُحقن قبل الاستعمال)، فلا يحتاج الاختبار وجودهما في المستودع."""
import asyncio, sys, json
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT, THM
from playwright.async_api import async_playwright
def ok(c, m): print(('✓ ' if c else '✗ ') + m); RES.append(bool(c))
RES = []
APP = URL.replace('index.html', 'app.html')
# بدائل وحدتي الحركة والمعرفة (بالواجهة المتفق عليها)
STUBS = r'''(function(){
  const C = [['launch','أثر في دقيقة','المنصة',60],['home','الرئيسية','الرئيسية',20],['gallery','القوالب والهويات','القوالب',20],['editor','المحرر','المحرر',25],['make','اصنع إعلانك','المصمّم الذكي',20],
    ['publish','النشر إلى القناة','النشر',20],['cal','التقويم والمهام','التقويم',20],['slides','الشرائح','الشرائح',20],['mine','تصاميمي','تصاميمي',15],['app','تطبيق الجوال','التطبيق',20],['admin','لوحة الإدارة','الإدارة',30,1]];
  window.MOTION_CLIPS = C.map(function (c) { return { id: c[0], title: c[1], section: c[2], dur: c[3], desc: 'وصف قصير لمقدمة ' + c[1] + ' يشرح أهم ما فيها.', admin: !!c[4] }; });
  window.PLAYED = [];
  window.playMotion = function (id, opt) { PLAYED.push({ id: id, intro: !!(opt && opt.intro) }); const o = document.createElement('div'); o.className = 'motion6-open'; o.style.cssText = 'position:fixed;inset:0;z-index:300;background:#111;color:#fff;display:grid;place-items:center;font-size:30px'; o.textContent = '▶ ' + id; document.body.appendChild(o);
    return new Promise(function (r) { setTimeout(function () { o.remove(); r({ watched: !window.ABORT, at: Date.now() }); }, window.PLAY_MS || 300); }); };
  window.motionPoster = function (id, w) { const d = document.createElement('div'); d.className = 'mposter'; const hue = { launch: 250, home: 210, gallery: 160, editor: 20, make: 280, publish: 190, cal: 40, slides: 330, mine: 350, app: 120, admin: 0 }[id] || 200;
    d.style.cssText = 'background:linear-gradient(135deg,hsl(' + hue + ',70%,55%),hsl(' + (hue + 40) + ',75%,35%));display:grid;place-items:center;color:#fff;font:600 ' + Math.round(w / 12) + 'px sans-serif'; d.textContent = id; return d; };
  window.KB_FAQ = [
    { q: 'كيف أنشر التصميم في قناة البرنامج؟', a: 'افتح التصميم، ثم تبويب «النشر»، واكتب النص المصاحب، واضغط «أرسل».', link: '#/cal', page: 'editor' },
    { q: 'كيف أغيّر لون الواجهة؟', a: 'من «حسابي» ← المظهر ← لون الواجهة.', link: '#/account' },
    { q: 'كيف أجدول منشوراً؟', a: 'من تبويب «النشر» في المحرر اختر «جدولة» وحدد الموعد، وتجده في التقويم.', link: '#/cal', page: 'cal' },
    { q: 'أين أجد تصاميمي المحفوظة؟', a: 'في صفحة «تصاميمي».', link: '#/mine', page: 'mine' },
    { q: 'كيف أصنع إعلاناً بالمساعد؟', a: 'من «اصنع إعلانك» اكتب فكرتك بكلماتك.', link: '#/make', page: 'make' },
    { q: 'كيف أرفع خطاً جديداً؟', a: 'من لوحة الخطوط في المحرر: «ارفع خطاً».', page: 'editor' },
    { q: 'كيف أطلب مراجعة لتصميمي؟', a: 'زر «مراجعة» في المحرر.', page: 'editor' }];
  window.KB_SECTIONS = [{ id: 'cal', title: 'التقويم والمهام', route: '#/cal', desc: 'المنشورات المجدولة والمهام وتذكيراتها.' }, { id: 'mine', title: 'تصاميمي', route: '#/mine', desc: 'ما حفظته من تصاميم ونماذج فريقك.' }];
  window.KB_CLIPS = { home: 'الرئيسية في عشرين ثانية' };
  window.kbPageName = function (r) { return /^#\/cal/.test(r) ? 'التقويم والمهام' : /^#\/(e|d)\//.test(r) ? 'المحرر' : /^#\/guide/.test(r) ? 'دليل أثر' : /^#\/mine/.test(r) ? 'تصاميمي' : 'الرئيسية'; };
  window.KBCTX = [];
  window.kbContext = function (route, role, extra) { KBCTX.push({ route: route, role: role, extra: extra }); return 'دليل المنصة: [سياق ' + kbPageName(route) + '] الدور ' + role; };
})(); void 0'''
# مساعد مقلّد يجيب طلبات «help» جواباً ثابتاً
MOCK = r'''window.HELP_N = 0; window.DEMO_AI = function (body) {
  const b = JSON.parse(body), sys = b.systemInstruction ? b.systemInstruction.parts[0].text : b.messages[0].content, prm = b.contents ? b.contents[0].parts[0].text : b.messages[1].content;
  if (/مساعد منصة الأثر الإعلامي/.test(sys)) { HELP_N++; window.HELP_LAST = { sys: sys, prompt: prm, cfg: b.generationConfig };
    if (/حذف البرنامج/.test(prm)) return JSON.stringify({ answer: 'حذف البرنامج قرار من الإدارة، والإشراف سيساعدك.', steps: [], links: [], clip: '', escalate: true });
    return JSON.stringify({ answer: 'تنشر من تبويب «النشر» في المحرر، وتتابع المنشور في التقويم.', steps: ['1. افتح التصميم في المحرر', 'اضغط تبويب «النشر»', 'اكتب النص المصاحب ثم اضغط «أرسل»'],
      links: [{ label: 'التقويم', hash: '#/cal' }, { label: 'رابط خارجي', hash: 'https://evil.example' }, { label: 'صفحة غير موجودة', hash: '#/nowhere/x/y' }], clip: 'publish', escalate: false }); }
  return '{}';
};'''
async def prefs(pg): return await pg.evaluate("JSON.parse(JSON.stringify((V6.me.prefs||{}).guide||{}))")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        errs = await setup(pg)
        # ٠) بلا وحدتي الحركة والمعرفة: الصفحة تعمل، ولا مقدمات تلقائية، والجولة القديمة كما هي
        await pg.goto(URL + '#/guide'); await pg.wait_for_timeout(1500)
        real = await pg.evaluate("typeof playMotion === 'function'")
        if not real:
            ok(await pg.evaluate("document.querySelectorAll('.gstep').length") >= 9 and await pg.evaluate("!!document.querySelector('.ghero .gposter.fb')"), 'guide renders without motion/kb (fallback posters)')
            ok('قريباً' in await pg.inner_text('.ghero'), 'without motion: "coming soon" instead of play')
            ok(await pg.evaluate("!gIntrosActive()"), 'intros inactive without motion module')
        else:
            ok(await pg.evaluate("document.querySelectorAll('.gstep').length") >= 9 and await pg.evaluate("!!document.querySelector('.ghero .gfilm') && !document.querySelector('.ghero .gposter.fb')"), 'guide renders with the real motion module (real posters)')
        await pg.screenshot(path=OUT + 'w0_guide_nomotion.png')
        # ١) مع الوحدتين
        await pg.evaluate(STUBS); await pg.evaluate("GAS._props.GEMINI_KEY='k-demo-AIzaSy0123456789abcdefghijklmnop'; " + MOCK + "; void 0"); await pg.evaluate("refreshBundle()"); await pg.wait_for_timeout(1200)
        await pg.evaluate("location.hash='#/'"); await pg.wait_for_timeout(300)
        await pg.evaluate("$$('.gx-intro').forEach(function(x){x.remove()}); GUIDE.prompt=null; location.hash='#/guide'"); await pg.wait_for_timeout(1600)
        ok(await pg.evaluate("document.querySelectorAll('.gstep').length") == 10, 'learning path: 10 section cards (admin sees admin clip): %d' % await pg.evaluate("document.querySelectorAll('.gstep').length"))
        ok(await pg.evaluate("!!document.querySelector('.ghero .gfilm .mposter') && !!document.querySelector('.gstep .gthumb .mposter')"), 'posters from motionPoster')
        import re as _re
        ok(bool(_re.search('[٠-٩]+ث', await pg.inner_text('.gpath'))) and bool(_re.search('[٠-٩]:[٠-٩]{2}', await pg.inner_text('.ghero'))), 'durations in Arabic digits')
        ok(await pg.evaluate("document.querySelectorAll('.gfaq .gfq').length") == 6 and await pg.evaluate("!!document.querySelector('.gfaqcol > .btn')"), 'FAQ: 6 shown + show all')
        await pg.evaluate("document.querySelectorAll('.rv,.bwrap').forEach(function(x){x.classList.add('in-view')})")
        await pg.screenshot(path=OUT + 'w1_guide.png', full_page=True)
        await pg.screenshot(path=OUT + 'w1_guide_top.png')
        # التشغيل والتقدّم
        await pg.click('.ghero .gfilm'); await pg.wait_for_timeout(900)
        ok(await pg.evaluate("PLAYED[PLAYED.length-1].id") == 'launch', 'hero plays launch film')
        g = await prefs(pg); ok('launch' in (g.get('seen') or {}), 'watched launch saved in prefs.guide.seen')
        ok('شوهد ✓' in await pg.inner_text('.ghero') and 'تابع من حيث توقفت: الرئيسية' in await pg.inner_text('.ghero'), 'hero shows seen + continue where you left off')
        await pg.click('.gstep[data-clip=home] .gthumb'); await pg.wait_for_timeout(900)
        await pg.click('.gcont'); await pg.wait_for_timeout(900)
        ok(await pg.evaluate("PLAYED.slice(-2).map(function(x){return x.id}).join(',')") == 'home,gallery', 'card plays + continue plays next unseen')
        ok(await pg.evaluate("document.querySelectorAll('.gstep.seen').length") == 2 and await pg.evaluate("document.querySelector('.gstep.next').dataset.clip") == 'editor', 'seen cards marked, next highlighted')
        ok('شاهدت ٣ من ١١' in await pg.inner_text('.gprog'), 'progress ring text: ' + (await pg.inner_text('.gprog')).replace('\n', ' '))
        # التقدّم يتبع المستخدم: إعادة التحميل تقرأه من الخادم
        await pg.reload(); await pg.wait_for_timeout(4000); await pg.evaluate(STUBS); await pg.evaluate("location.hash='#/'"); await pg.wait_for_timeout(200); await pg.evaluate("location.hash='#/guide'"); await pg.wait_for_timeout(1500)
        ok(await pg.evaluate("document.querySelectorAll('.gstep.seen').length") == 2 and await pg.evaluate("!!V6.me.prefs.guide.seen.launch"), 'progress persisted on server (after reload)')
        # رابط مباشر لمقدمة
        await pg.goto(URL + '#/guide/cal'); await pg.wait_for_timeout(1500)
        ok(await pg.evaluate("(typeof PLAYED !== 'undefined' && PLAYED.length && PLAYED[PLAYED.length-1].id === 'cal') || !!document.querySelector('.mo-pl')"), '#/guide/<clipId> opens the clip directly')
        await pg.evaluate("document.querySelectorAll('.mo-pl').forEach(function(x){x.remove()}); if (typeof MO !== 'undefined' && MO.current && MO.current.close) try { MO.current.close(); } catch (e) {}"); await pg.wait_for_timeout(400)
        await pg.evaluate(STUBS)
        # ٢) مقدمة أول دخول
        await pg.evaluate("gSave({ seen: V6.me.prefs.guide.seen, asked: {}, nag: {}, off: false })"); await pg.wait_for_timeout(300)
        await pg.evaluate("location.hash='#/mine'"); await pg.wait_for_timeout(700)
        ok(await pg.query_selector('.gx-intro') is None, 'no prompt in the first second')
        await pg.wait_for_timeout(1500)
        ok(await pg.query_selector('.gx-intro.on') is not None and 'تصاميمي' in await pg.inner_text('.gx-intro'), 'first visit to mine: prompt «مقدمة قصيرة عن تصاميمي»')
        ok(bool(__import__('re').search('\\([٠-٩]+ث\\)', await pg.inner_text('.gx-intro'))), 'prompt shows duration')
        await pg.screenshot(path=OUT + 'w2_intro.png')
        await pg.click('.gx-intro .btn.dark'); await pg.wait_for_timeout(900)
        ok(await pg.evaluate("PLAYED[PLAYED.length-1].id === 'mine' && PLAYED[PLAYED.length-1].intro"), 'watch → playMotion(id, {intro:true})')
        ok((await prefs(pg)).get('asked', {}).get('mine') == 1, 'decision remembered in prefs (asked.mine)')
        await pg.evaluate("location.hash='#/'"); await pg.wait_for_timeout(200); await pg.evaluate("location.hash='#/mine'"); await pg.wait_for_timeout(2600)
        ok(await pg.query_selector('.gx-intro') is None, 'second visit: no prompt again')
        ok('شاهد مقدمة تصاميمي' in await pg.inner_text('#view'), 'empty state points to the section intro')
        # تخطَّ
        await pg.evaluate("location.hash='#/cal'"); await pg.wait_for_timeout(2600)
        n = await pg.evaluate("document.querySelectorAll('.gx-intro').length")
        ok(n == 1, 'cal prompt shown once (one per visit): %d' % n)
        await pg.click('.gx-intro .btn.ghost'); await pg.wait_for_timeout(500)
        ok(await pg.query_selector('.gx-intro.on') is None and (await prefs(pg)).get('asked', {}).get('cal') == 1 and not await pg.evaluate("PLAYED.some(function(x){return x.id==='cal' && x.intro})"), 'skip: hidden, remembered, not played')
        # لا فوق نافذة مفتوحة
        await pg.evaluate("location.hash='#/make'"); await pg.wait_for_timeout(300)
        await pg.evaluate("modal({title:'نافذة', body:[el('p',{text:'x'})], acts:[{t:'حسناً'}]})"); await pg.wait_for_timeout(2600)
        ok(await pg.query_selector('.gx-intro') is None, 'no prompt over an open modal')
        await pg.evaluate("closeModals()"); await pg.wait_for_timeout(1800)
        ok(await pg.query_selector('.gx-intro.on') is not None, 'prompt appears after the modal closes')
        # لا تعرض المقدمات
        await pg.click('.gx-intro .gxi-off'); await pg.wait_for_timeout(500)
        ok((await prefs(pg)).get('off') is True, '«لا تعرض المقدمات» → prefs.guide.off')
        await pg.evaluate("location.hash='#/g/ishraq'"); await pg.wait_for_timeout(2600)
        ok(await pg.query_selector('.gx-intro') is None, 'intros off: no prompt in gallery')
        # المحرر: لا في الثواني الأولى، ولا مع الجولة القديمة
        await pg.evaluate("gSave({ off: false, asked: { mine: 1, cal: 1, make: 1, gallery: 1, home: 1 } })"); await pg.wait_for_timeout(300)
        await pg.evaluate("V6.me.prefs.tours = {}")
        await pg.goto(URL + '#/e/ishraq/ann_panel'); await pg.wait_for_timeout(3000)
        await pg.evaluate(STUBS)
        ok(await pg.query_selector('.gx-intro') is None, 'editor: no prompt during first seconds of loading')
        ok(await pg.query_selector('.coach') is None, 'editor: old coach tour replaced by the intro (not both)')
        await pg.wait_for_timeout(2500)
        has = await pg.query_selector('.gx-intro.on') is not None
        if not has: await pg.evaluate("gOnRoute()"); await pg.wait_for_timeout(5000); has = await pg.query_selector('.gx-intro.on') is not None
        ok(has and 'المحرر' in await pg.inner_text('.gx-intro'), 'editor intro after loading settles')
        ok(await pg.evaluate("!!document.querySelector('.e-top #e_help')"), 'editor top bar has the «؟» help button')
        await pg.screenshot(path=OUT + 'w3_editor_intro.png')
        await pg.click('.gx-intro .btn.ghost'); await pg.wait_for_timeout(400)
        # تبويب النشر ← مقدمة النشر (زيارة جديدة)
        await pg.evaluate("GUIDE.visit++; GUIDE.shown=false; openTab('pub')"); await pg.wait_for_timeout(2200)
        ok(await pg.query_selector('.gx-intro.on') is not None and 'النشر' in await pg.inner_text('.gx-intro'), 'publish tab → publish intro')
        await pg.click('.gx-intro .btn.ghost'); await pg.wait_for_timeout(300)
        # ٣) اسأل أثر
        await pg.evaluate("ED.leaveOK=true"); await pg.goto(URL + '#/cal'); await pg.wait_for_timeout(1800); await pg.evaluate(STUBS); await pg.evaluate(MOCK + "; void 0")
        ok(await pg.evaluate("!!document.querySelector('#gxfab') && getComputedStyle(document.querySelector('#gxfab')).display !== 'none'"), 'floating help button on site pages')
        fr = await pg.evaluate("(function(){const a=document.querySelector('#gxfab').getBoundingClientRect(); const m=document.querySelector('#morecue .morebtn'); const c=m?m.getBoundingClientRect():null; return [a.left,a.bottom,innerHeight, c?[c.left,c.right]:null]})()")
        ok(fr[0] < 40 and fr[2] - fr[1] < 40 and (not fr[3] or fr[3][0] > fr[0] + 60), 'FAB bottom-left, not overlapping «المزيد» cue: %s' % fr)
        await pg.click('#gxfab'); await pg.wait_for_timeout(700)
        ok(await pg.query_selector('.gx-panel.on') is not None and 'التقويم والمهام' in await pg.inner_text('.gx-where'), 'panel opens with current page name (kbPageName)')
        sug = await pg.evaluate("Array.from(document.querySelectorAll('.gx-sugg .chip')).map(function(x){return x.textContent})")
        ok(len(sug) >= 3 and 'أجدول' in sug[0], 'suggested questions filtered by page first: %s' % sug[:2])
        await pg.screenshot(path=OUT + 'w4_panel.png')
        await pg.fill('.gx-in', 'كيف أنشر في القناة؟'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(2500)
        ok(await pg.evaluate("HELP_N") == 1, 'one help request sent')
        ctx = await pg.evaluate("KBCTX[KBCTX.length-1]")
        ok(ctx['route'] == '#/cal' and ctx['role'] == 'super' and ctx['extra']['question'] == 'كيف أنشر في القناة؟', 'kbContext(route, role, {question,…})')
        ok(await pg.evaluate("/\\[سياق التقويم والمهام\\]/.test(HELP_LAST.sys) && /escalate/.test(HELP_LAST.sys) && /publish:/.test(HELP_LAST.sys)"), 'system = rules + kbContext + clip list')
        ok(await pg.evaluate("HELP_LAST.cfg.temperature") == 0.2 and await pg.evaluate("!!HELP_LAST.cfg.responseSchema.properties.escalate"), 'temperature 0.2 + schema with escalate')
        ok(await pg.evaluate("!/أحمد|ahmad|@/.test(HELP_LAST.prompt + HELP_LAST.sys)"), 'no personal data in the request')
        ok(await pg.evaluate("document.querySelectorAll('.gx-steps li').length") == 3 and '1.' not in await pg.inner_text('.gx-steps'), 'answer steps rendered (numbering cleaned)')
        links = await pg.evaluate("Array.from(document.querySelectorAll('.gx-links a')).map(function(a){return a.getAttribute('href')})")
        ok(links == ['#/cal'], 'only known in-app links kept: %s' % links)
        ok(await pg.query_selector('.gx-links .gx-clip') is not None, '«شاهد مقدمة النشر» button from clip')
        await pg.screenshot(path=OUT + 'w5_answer.png')
        # المحادثة القصيرة
        await pg.fill('.gx-in', 'وهل أستطيع جدولته؟'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(2500)
        ok(await pg.evaluate("/المحادثة السابقة/.test(HELP_LAST.prompt) && /كيف أنشر في القناة/.test(HELP_LAST.prompt)"), 'short conversation history sent with follow-up')
        # لم تُحلّ ← اسأل الإشراف ← بلاغ من نوع سؤال
        btns = await pg.query_selector_all('.gx-solved .btn')
        await btns[-1].click(); await pg.wait_for_timeout(400)
        await pg.click('.gx-esc .gx-ask-sup'); await pg.wait_for_timeout(1500)
        fb = await pg.evaluate("API6.me('fb_mine')")
        q = [x for x in fb if x['kind'] == 'q']
        ok(len(q) == 1 and 'وهل أستطيع جدولته' in q[0]['text'] and 'جواب المساعد' in q[0]['text'] and q[0]['page'] == '#/cal', 'escalation creates a feedback of kind q with question, page, answer')
        ok('وصل سؤالك' in await pg.inner_text('.gx-esc'), 'escalation confirmed (busy → ✓)')
        await pg.screenshot(path=OUT + 'w6_escalate.png')
        # escalate من المساعد مباشرة
        await pg.fill('.gx-in', 'أريد حذف البرنامج كله'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(2500)
        ok(await pg.evaluate("document.querySelectorAll('.gx-msg.bot').length && !!document.querySelector('.gx-msg.bot:last-child .gx-esc .gx-ask-sup')"), 'escalate=true → «اسأل الإشراف» shown directly')
        # الرابط ينقل والصفحة تُحدَّث في رأس اللوحة
        await pg.click('.gx-links a[href="#/cal"]'); await pg.wait_for_timeout(300)
        await pg.evaluate("location.hash='#/mine'"); await pg.wait_for_timeout(800)
        ok('تصاميمي' in await pg.inner_text('.gx-where'), 'panel stays on site and follows the current page')
        await pg.click('.gx-x'); await pg.wait_for_timeout(500)
        # ٤) بلا مساعد: بحث بالكلمات في الأسئلة والأقسام
        await pg.evaluate("GAS._props.GEMINI_KEY=''; window.DEMO_AI = null; void 0")
        await pg.evaluate("(function(){ const o = API6.call; API6.call = function (fn) { if (fn === 'ai_make') return Promise.reject(new Error('بلغت حد اليوم (20 طلباً). جرّب غداً.')); return o.apply(API6, arguments); }; })(); void 0")
        await pg.evaluate("askAthar('كيف أجدول منشور في التقويم')"); await pg.wait_for_timeout(1500)
        t = await pg.inner_text('.gx-msg.bot:last-child')
        ok('حد المساعد' in t and 'أجدول' in t, 'AI limit → friendly message + best FAQ match')
        await pg.evaluate("askAthar('من فاز بالمباراة أمس')"); await pg.wait_for_timeout(1500)
        ok(await pg.query_selector('.gx-msg.bot:last-child .gx-ask-sup') is not None, 'no match → offer to ask supervisors')
        await pg.screenshot(path=OUT + 'w7_fallback.png')
        await pg.click('.gx-x'); await pg.wait_for_timeout(400)
        # ٥) نقاط الدخول: قائمة الصورة، ما الجديد
        await pg.click('#avatar'); await pg.wait_for_timeout(300)
        mt = await pg.inner_text('.menu')
        ok('دليل أثر' in mt and 'جولة تعريفية' not in mt, 'avatar menu: «دليل أثر» replaces the tour item (one place)')
        await pg.keyboard.press('Escape'); await pg.mouse.click(700, 500); await pg.wait_for_timeout(200)
        await pg.evaluate("showNews()"); await pg.wait_for_timeout(500)
        ok(await pg.query_selector('.modal .gnews') is not None, '«ما الجديد» links to the guide')
        await pg.click('.modal .gnews'); await pg.wait_for_timeout(1200)
        ok(await pg.evaluate("location.hash") == '#/guide' and await pg.query_selector('.modal') is None, 'news card opens the guide and closes the dialog')
        # الجولات تبقى من الدليل
        await pg.click('.gtour'); await pg.wait_for_timeout(2000)
        ok(await pg.query_selector('.coach') is not None and await pg.query_selector('.gx-intro') is None, 'tour from the guide still works (no intro during it)')
        await pg.evaluate("document.querySelector('.coach') && document.querySelector('.coach').remove()")
        ok(not [e for e in errs if 'favicon' not in e and 'Failed to load resource' not in e], 'no console errors: %s' % errs[:3])
        # ٦) التطبيق ٣٩٠
        ctx2 = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
        m = await ctx2.new_page(); merrs = []
        m.on('pageerror', lambda e: merrs.append(str(e)))
        await m.goto(APP); await m.evaluate("localStorage.clear()"); await m.goto(APP + '#/login'); await m.wait_for_timeout(1000)
        await m.evaluate("DEMO.reset()"); await m.evaluate("DEMO.seed(%s)" % THM); await m.wait_for_timeout(300)
        await m.evaluate(STUBS)
        await m.fill('#lg_id', 'ahmad'); await m.fill('#lg_pw', 'Ahmad#2026'); await m.click('.lgform button[type=submit]')
        await m.wait_for_selector('.mtab:not([hidden])', timeout=60000); await m.wait_for_timeout(3500)
        for _ in range(3):
            if await m.query_selector('.msheet-wrap'): await m.evaluate("closeModals()"); await m.wait_for_timeout(1800)
        await m.wait_for_timeout(1500)
        ok(await m.query_selector('.gx-intro.on') is not None and 'التطبيق' in await m.inner_text('.gx-intro'), 'app first launch → app intro (bottom card above the tab bar)')
        r = await m.evaluate("(function(){const a=document.querySelector('.gx-intro').getBoundingClientRect(), t=document.querySelector('.mtab').getBoundingClientRect(); return [a.left, a.right, a.bottom, t.top]})()")
        ok(r[0] >= 8 and r[1] <= 382 and r[2] <= r[3], 'app intro fits 390 and sits above the tab bar: %s' % r)
        await m.screenshot(path=OUT + 'w8_app_intro.png')
        await m.click('.gx-intro .btn.ghost'); await m.wait_for_timeout(400)
        ok(await m.evaluate("!!document.querySelector('.mscreen .mnav .bar .gx-q')"), 'app: «؟» in screen header')
        ok(await m.evaluate("getComputedStyle(document.querySelector('#gxfab') || document.body).display === 'none' || !document.querySelector('#gxfab')"), 'app: no floating site button')
        await m.evaluate("location.hash='#/more'"); await m.wait_for_timeout(1500)
        ok('دليل أثر' in await m.inner_text('.mscreen') and 'اسأل أثر' in await m.inner_text('.mscreen'), 'app More: help card with guide + ask')
        await m.screenshot(path=OUT + 'w9_app_more.png', full_page=True)
        await m.evaluate("Array.from(document.querySelectorAll('.mline')).find(function(a){return /دليل أثر/.test(a.textContent)}).click()"); await m.wait_for_timeout(1500)
        ok(await m.evaluate("location.hash") == '#/guide' and await m.query_selector('.mscreen .gpage') is not None, 'app guide screen with mscreen header')
        ok(await m.evaluate("document.querySelectorAll('.gstep').length") == 9, 'app: user does not see admin clip (9 cards)')
        ok(await m.evaluate("document.documentElement.scrollWidth <= 391"), 'app guide: no horizontal overflow')
        ok(await m.query_selector('.gtours') is None, 'app: no coach tours section (tours disabled in app)')
        await m.evaluate("document.querySelectorAll('.rv,.bwrap').forEach(function(x){x.classList.add('in-view')})")
        await m.screenshot(path=OUT + 'w10_app_guide.png')
        await m.screenshot(path=OUT + 'w10_app_guide_full.png', full_page=True)
        await m.click('.mscreen .mnav .bar .gx-q'); await m.wait_for_timeout(800)
        pr = await m.evaluate("(function(){const p=document.querySelector('.gx-panel').getBoundingClientRect(); return [p.left, p.right, p.bottom, innerHeight, p.height]})()")
        ok(await m.query_selector('.gx-scrim.on .gx-panel.on') is not None and pr[0] >= 0 and pr[1] <= 391 and pr[2] <= pr[3] + 1, 'app: ask sheet from the bottom, full width: %s' % pr)
        await m.evaluate("(function(){ const o = API6.call; API6.call = function (fn) { if (fn === 'ai_make') return Promise.reject(new Error('المساعد يحتاج صلاحية من مشرف البرنامج')); return o.apply(API6, arguments); }; })(); void 0")
        await m.fill('.gx-in', 'أين أجد تصاميمي؟'); await m.evaluate("document.querySelector('.gx-foot').requestSubmit()"); await m.wait_for_timeout(1200)
        ok('تصاميمي' in await m.inner_text('.gx-msg.bot:last-child'), 'app: fallback answer without AI permission')
        await m.screenshot(path=OUT + 'w11_app_ask.png')
        # مستخدم يسأل الإشراف ← يصل المدير العام إشعار
        sb = await m.query_selector_all('.gx-msg.bot:last-child .gx-solved .btn'); await sb[-1].click(); await m.wait_for_timeout(400)
        await m.click('.gx-msg.bot:last-child .gx-ask-sup'); await m.wait_for_timeout(1500)
        ok('وصل سؤالك' in await m.inner_text('.gx-msg.bot:last-child'), 'app: user escalation sent')
        nts = await m.evaluate("DEMO.call('auth_login', ['admin', 'Admin#2026']).then(function (r) { const t = (typeof r === 'string' ? JSON.parse(r) : r).token; return DEMO.call('nt_list', [t]); }).then(function (r) { return typeof r === 'string' ? r : JSON.stringify(r); })")
        ok('سؤال جديد' in nts and 'أين أجد تصاميمي' in nts, 'admin notified of the user question')
        await m.click('.gx-msg.bot:last-child .gx-hit a'); await m.wait_for_timeout(1200)
        ok(await m.evaluate("location.hash") == '#/mine' and await m.query_selector('.gx-panel.on') is None, 'app: link navigates and closes the sheet')
        # المحرر في التطبيق: «اسأل أثر» في قائمة «…»
        await m.evaluate("location.hash='#/e/ishraq/ann_cards'"); await m.wait_for_timeout(3500)
        await m.click('.e-more'); await m.wait_for_timeout(500)
        ok('اسأل أثر' in await m.inner_text('.mact'), 'app editor «…» menu has «اسأل أثر»')
        await m.click('.mact .cancel'); await m.wait_for_timeout(300)
        ok(not merrs, 'app: no page errors %s' % merrs[:2])
        await b.close()
    print('%d/%d' % (sum(RES), len(RES)))
asyncio.run(main())
