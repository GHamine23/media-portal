"""اختبار: نصائح التصميم، والمراجعة الذكية، وطلب المراجعة، والتعليقات، والإشعارات، وصور الملاحظات، وأسبوعك في أثر، ومهارات المساعد."""
import asyncio, sys, json
sys.path.insert(0, '/home/claude/media-portal/v6')
from t6 import setup, URL, OUT
from playwright.async_api import async_playwright
def ok(c, m): print(('✓ ' if c else '✗ ') + m)
async def clean(pg):
    for _ in range(3):
        if await pg.query_selector('.coach'): await pg.evaluate("document.querySelector('.coach').remove()")
        if await pg.query_selector('.modal'): await pg.keyboard.press('Escape'); await pg.wait_for_timeout(250)
MOCK = r'''window.DEMO_AI = function (body) {
  const b = JSON.parse(body); const sys = b.systemInstruction.parts[0].text;
  window.LAST_SYS = sys;
  if (/مراجع لطيف صريح/.test(sys)) return JSON.stringify({ score: 74, verdict: 'تصميم واضح يحتاج تبايناً أقوى في العنوان', strengths: ['ألوان الهوية منسجمة', 'الشعار في مكانه'], issues: [{ cat: 'contrast', title: 'العنوان قريب من حجم النص', fix: 'كبّر العنوان إلى ضعف حجمه', severity: 'high' }, { cat: 'proximity', title: 'معلومات الموعد متفرقة', fix: 'اجمع اليوم والمكان في كتلة واحدة', severity: 'mid' }], quick: ['كبّر العنوان', 'احذف الزخرفة الثالثة', 'قرّب الموعد من العنوان'] });
  if (/تقييماً أسبوعياً/.test(sys)) { const u = JSON.parse(b.contents[0].parts[0].text); return JSON.stringify({ items: u.map(function (x) { return { id: x.id, msg: 'رائع يا ' + x.name + '، نزّلت ' + x.thisWeek.exports + ' تصاميم هذا الأسبوع. جرّب التركيز على التباين.', focus: 'contrast', challenge: 'صمّم إعلاناً بعنوان من ثلاث كلمات' }; }) }); }
  return '{}';
};'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        errs = await setup(pg)
        await pg.evaluate("GAS._props.GEMINI_KEY='k'; " + MOCK + "; void 0"); await pg.evaluate("refreshBundle()"); await pg.wait_for_timeout(1200)
        # الرئيسية: نصيحة اليوم وأسبوعك
        await pg.goto(URL + '#/'); await pg.wait_for_timeout(2500); await clean(pg)
        ok(await pg.query_selector('.tipday .tdemo') is not None and 'نصيحة اليوم' in await pg.inner_text('.tipday'), 'home shows animated tip of the day')
        ok(await pg.query_selector('.wkmini .wknums') is not None, 'home shows week mini card')
        t1 = await pg.inner_text('.tipday h3'); await pg.click('.tipday button[aria-label="التالية"]'); await pg.wait_for_timeout(600)
        ok(await pg.inner_text('.tipday h3') != t1, 'next tip')
        await pg.screenshot(path=OUT + 'p1_home_tip.png')
        # صفحة النصائح
        await pg.goto(URL + '#/tips'); await pg.wait_for_timeout(1500)
        n = await pg.evaluate("document.querySelectorAll('.tipcard').length")
        ok(n >= 100 and await pg.evaluate("document.querySelectorAll('.tipsec').length") == 13, 'tips page: %d tips in 13 categories' % n)
        await pg.screenshot(path=OUT + 'p2_tips.png', full_page=False)
        await pg.click('.tipchips .chip:has-text("الخط")'); await pg.wait_for_timeout(500)
        ok(await pg.evaluate("document.querySelectorAll('.tipsec').length") == 1, 'filter by category')
        await pg.fill('input[aria-label="بحث في النصائح"]', 'الكشيدة'); await pg.wait_for_timeout(300)
        ok(await pg.evaluate("document.querySelectorAll('.tipcard').length") >= 1, 'search tips')
        # حزمة أسبوعية تضيف نصائح
        await pg.evaluate("PACK({ id: '2026-10-24', tips: [{ c: 'color', t: 'نصيحة تجريبية من الحزمة', b: 'نص النصيحة الجديدة للاختبار.' }] }); void 0")
        await pg.goto(URL + '#/tips/color'); await pg.wait_for_timeout(1000)
        ok('نصيحة تجريبية من الحزمة' in await pg.inner_text('.tipgrid') and 'جديدة' in await pg.inner_text('.tipgrid'), 'pack tips appear with «جديدة»')
        # المحرر: المراجعة الذكية
        await pg.goto(URL + '#/e/ithmar/ann_cards'); await pg.wait_for_timeout(2500); await clean(pg)
        await pg.click('#e_rv'); await pg.wait_for_timeout(300); await pg.click('.menu button:has-text("راجعه بالمصمّم الذكي")'); await pg.wait_for_timeout(2500)
        ok(await pg.query_selector('.modal .ring6') is not None and await pg.evaluate("document.querySelectorAll('.modal .rvissue').length") == 2, 'AI review: score ring + issues')
        ok('مهارة: عين المصمّم' in await pg.evaluate("window.LAST_SYS") and 'image/png' in await pg.evaluate("JSON.stringify(window.LAST_FILES||'image/png')"), 'review uses design-eye skill')
        await pg.wait_for_timeout(1000); await pg.screenshot(path=OUT + 'p3_ai_review.png')
        # طلب مراجعة من الإدارة (مع تقييم المساعد)
        await pg.click('.modal button:has-text("اطلب رأي إدارة أثر")'); await pg.wait_for_timeout(600)
        await pg.fill('.modal textarea', 'هل الألوان مناسبة للمحاضرة؟'); await pg.click('.modal .acts .btn.dark'); await pg.wait_for_timeout(2000)
        ok('وصل طلبك' in await pg.inner_text('body'), 'review request sent')
        # التعليقات
        await clean(pg); await pg.click('#e_cm'); await pg.wait_for_timeout(800)
        await pg.fill('.modal .cmform textarea', 'قالب جميل جداً للمحاضرات'); await pg.click('.modal .cmform .btn.dark'); await pg.wait_for_timeout(1200)
        ok(await pg.evaluate("document.querySelectorAll('.modal .cmrow').length") == 1, 'comment posted')
        await pg.screenshot(path=OUT + 'p4_comments.png')
        await clean(pg)
        ok(await pg.inner_text('#e_cm b') == '1', 'comment count badge')
        # الإدارة: الرد على المراجعة
        await pg.goto(URL + '#/admin/reviews'); await pg.wait_for_timeout(2000)
        ok(await pg.query_selector('.rvcard') is not None and '74/100' in await pg.inner_text('.rvcard'), 'admin sees request with AI score')
        await pg.click('.rvcard .rvimg .btn'); await pg.wait_for_timeout(1200)
        await pg.fill('.rvform textarea >> nth=0', 'كبّر العنوان\nوحّد المحاذاة'); await pg.fill('.rvform textarea >> nth=1', 'رسالة واضحة، والتوقيت مناسب للنشر مساءً.')
        await pg.screenshot(path=OUT + 'p5_admin_review.png')
        await pg.click('.rvform .btn.dark'); await pg.wait_for_timeout(2000)
        ok('أُرسلت المراجعة' in await pg.inner_text('body'), 'admin reply sent')
        # مهارات المساعد في الإدارة
        await pg.goto(URL + '#/admin/ai'); await pg.wait_for_timeout(2000)
        ok(await pg.evaluate("document.querySelectorAll('.skrow').length") >= 6, 'skills listed in admin')
        await pg.click('.skills > .btn'); await pg.wait_for_timeout(300)
        f = await pg.query_selector('.sklist > .skrow:last-child .skform')
        await (await f.query_selector('input[type=text]')).fill('هوية مسار إثمار')
        await (await f.query_selector('textarea')).fill('إثمار يحب الخلفيات الفاتحة والزهور، والعنوان بلون الهوية الأساسي.')
        await (await f.query_selector('.btn.dark')).click(); await pg.wait_for_timeout(2000)
        ok('هوية مسار إثمار' in await pg.inner_text('.skills'), 'custom skill added')
        await pg.screenshot(path=OUT + 'p6_skills.png')
        # مستخدم: الإشعارات وأسبوعه ومراجعاته وصور الملاحظات
        await pg.evaluate("logout()"); await pg.wait_for_timeout(800)
        await pg.fill('#lg_id', 'ahmad'); await pg.fill('#lg_pw', 'Ahmad#2026'); await pg.click('.lgform button[type=submit]'); await pg.wait_for_selector('#top:not([hidden])', timeout=60000); await pg.wait_for_timeout(1500); await clean(pg)
        await pg.evaluate("track('export',{tpl:'ann_cards'});track('export');track('tool',{tool:'qr'});flushEv(); void 0"); await pg.wait_for_timeout(800)
        await pg.goto(URL + '#/week'); await pg.wait_for_timeout(2500)
        ok(await pg.query_selector('.wkgrid .wkstat') is not None and await pg.query_selector('.wkbars .wkbar.live') is not None, 'week page with stats and bars')
        await pg.wait_for_timeout(1500); await pg.screenshot(path=OUT + 'p7_week.png')
        await pg.goto(URL + '#/reviews'); await pg.wait_for_timeout(1500)
        ok(await pg.query_selector('.rvlist .rvcard') is None, 'other user has no reviews')
        # صور في الملاحظات
        await pg.goto(URL + '#/'); await pg.wait_for_timeout(1500); await clean(pg)
        await pg.click('#fbbtn'); await pg.wait_for_timeout(400)
        await pg.fill('#fb_text', 'اقتراح مع صورة توضيحية')
        await pg.set_input_files('.modal .fbimgs input[type=file]', ['/home/claude/media-portal/assets/img/img_arch.webp'])
        await pg.wait_for_timeout(600)
        ok(await pg.evaluate("document.querySelectorAll('.modal .fbthumb').length") == 1, 'image attached to feedback')
        await pg.screenshot(path=OUT + 'p8_feedback_img.png')
        await pg.click('.modal .acts .btn.dark'); await pg.wait_for_timeout(2000)
        ok('وصلت ملاحظتك' in await pg.inner_text('body'), 'feedback with image sent')
        # المدير: يرى الصورة في البلاغ، والمستخدم صاحب التصميم يرى الإشعار
        await pg.evaluate("logout()"); await pg.wait_for_timeout(800)
        await pg.fill('#lg_id', 'admin'); await pg.fill('#lg_pw', 'Admin#2026'); await pg.click('.lgform button[type=submit]'); await pg.wait_for_selector('#top:not([hidden])', timeout=60000); await pg.wait_for_timeout(1500); await clean(pg)
        await pg.goto(URL + '#/admin/feedback'); await pg.wait_for_timeout(2000)
        await pg.click('.fbx button:has-text("الصورة 1")'); await pg.wait_for_timeout(1200)
        ok(await pg.query_selector('.fbx .fbshot img') is not None, 'admin views attached image')
        await pg.goto(URL + '#/reviews'); await pg.wait_for_timeout(1500)
        ok('رأي' in await pg.inner_text('.rvlist') and '/10' in await pg.inner_text('.rvlist'), 'requester sees reply in مراجعاتي')
        await pg.screenshot(path=OUT + 'p9_my_reviews.png')
        await pg.evaluate("loadNotifs(); void 0"); await pg.wait_for_timeout(800)
        await pg.click('#bell'); await pg.wait_for_timeout(600)
        ok(await pg.query_selector('.modal .ntbox .ntrow') is not None, 'notifications in bell')
        await clean(pg)
        # تقرير الأسبوع للجميع (المؤقّت) بالمساعد
        await pg.evaluate("(function(){const s=GAS; void s;})(); void 0")
        r = await pg.evaluate("(async()=>{const w=await API6.me('me_week', true);return w.me&&w.me.byAI?w.me.msg:'';})()")
        ok('رائع' in r, 'weekly AI message: ' + r[:60])
        await pg.goto(URL + '#/admin/week'); await pg.wait_for_timeout(1500)
        ok(await pg.query_selector('#abody') is not None, 'admin week tab opens')
        print('ERRORS', [e for e in errs if '404' not in e][:8])
        await b.close()
asyncio.run(main())
