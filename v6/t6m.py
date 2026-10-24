"""اختبار تطبيق الجوال (dist6/app.html): الدخول، الرئيسية، القوالب، المحرر بورقة الأدوات، الأوراق السفلية، التقويم، المزيد، التثبيت، وعامل الخدمة في البناء."""
import asyncio, sys, json, os
sys.path.insert(0, '/home/claude/media-portal/v6')
from t6 import THM, OUT
from playwright.async_api import async_playwright
APP = 'http://localhost:8765/media-portal/dist6/app.html'
def ok(c, m): print(('✓ ' if c else '✗ ') + m)
async def main():
    # البناء
    ok(os.path.exists('/home/claude/media-portal/docs/app/sw.js') and 'athar-app-' in open('/home/claude/media-portal/docs/app/sw.js').read(), 'service worker built with version')
    mf = json.load(open('/home/claude/media-portal/docs/app/manifest.webmanifest')); ok(mf['display'] == 'standalone' and mf['dir'] == 'rtl' and len(mf['icons']) == 3, 'manifest standalone rtl icons')
    html = open('/home/claude/media-portal/docs/app/index.html').read(); ok('apple-mobile-web-app-capable' in html and 'js/mapp.js' in html and '../v6/js/core6.js' in html, 'app shell references shared js + app modules')
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
        pg = await ctx.new_page(); errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        await pg.goto(APP); await pg.evaluate("localStorage.clear()"); await pg.goto(APP + '#/login'); await pg.wait_for_timeout(1000)
        await pg.evaluate("DEMO.reset()"); await pg.evaluate("DEMO.seed(%s)" % THM); await pg.wait_for_timeout(300)
        ok(await pg.evaluate("document.body.classList.contains('mapp') && !!document.querySelector('.lgform')"), 'login screen in app mode')
        await pg.fill('#lg_id', 'admin'); await pg.fill('#lg_pw', 'Admin#2026'); await pg.click('.lgform button[type=submit]')
        await pg.wait_for_selector('.mtab:not([hidden])', timeout=60000); await pg.wait_for_timeout(2500)
        for _ in range(3):
            if await pg.query_selector('.msheet-wrap'): await pg.evaluate("closeModals()"); await pg.wait_for_timeout(300)
        ok(await pg.evaluate("document.querySelectorAll('.mtab a').length") == 5 and await pg.evaluate("document.querySelector('.mtab a.on').dataset.r") == 'home', 'tab bar with 5 tabs, home active')
        ok(await pg.evaluate("!!document.querySelector('.mquick') && document.querySelectorAll('.mq').length >= 4"), 'home quick actions')
        ok(await pg.evaluate("!!document.querySelector('.mbanner')"), 'install banner shown when not installed (iOS UA)')
        await pg.click('.mbanner .btn'); await pg.wait_for_timeout(700)
        ok('إضافة إلى الشاشة الرئيسية' in await pg.inner_text('.msheet'), 'iOS install instructions sheet')
        await pg.evaluate("closeModals()"); await pg.wait_for_timeout(300)
        # زر + : ورقة الإنشاء
        await pg.click('.mtab a.plus'); await pg.wait_for_timeout(500)
        ok('اصنع إعلانك' in await pg.inner_text('.mact'), 'create action sheet')
        await pg.click('.mact button.cancel'); await pg.wait_for_timeout(400)
        # القوالب
        await pg.click('.mtab a[data-r=tpl]'); await pg.wait_for_timeout(2000)
        ok(await pg.evaluate("document.querySelectorAll('.mtc').length") > 10 and await pg.evaluate("document.querySelectorAll('.mid').length") >= 3, 'templates grid + identities row')
        await pg.fill('.msearch input', 'مسابقة'); await pg.wait_for_timeout(300)
        n1 = await pg.evaluate("document.querySelectorAll('.mtc').length"); ok(0 < n1 < 10, 'template search filters: %d' % n1)
        # المحرر: التصميم ظاهر والورقة بثلاثة مستويات
        await pg.goto(APP + '#/e/ishraq/ann_cards'); await pg.wait_for_timeout(3000)
        ok(await pg.evaluate("document.body.classList.contains('in-editor') && !!document.querySelector('.e-panel .mrail') && document.querySelector('.e-panel').classList.contains('peek')"), 'editor opens with tools sheet at peek')
        cv = await pg.evaluate("(function(){const r=document.querySelector('.e-cv').getBoundingClientRect(); const p=document.querySelector('.e-panel').getBoundingClientRect(); return [r.bottom, p.top, r.width];})()")
        ok(cv[0] <= cv[1] + 2 and cv[2] > 250, 'canvas fully visible above the sheet: %s' % cv)
        await pg.click('.e-panel .mrail button[data-tab=colors]'); await pg.wait_for_timeout(700)
        ok(await pg.evaluate("MED.detent === 'half' && document.querySelector('.e-panel').getBoundingClientRect().height > 300"), 'tapping a tool opens half sheet')
        await pg.evaluate("sheetTo('full')"); await pg.wait_for_timeout(600)
        ok(await pg.evaluate("document.querySelector('.e-panel').getBoundingClientRect().height > innerHeight*0.8"), 'full detent')
        await pg.click('.e-panel .mrail button[data-tab=colors]'); await pg.wait_for_timeout(600)
        ok(await pg.evaluate("MED.detent === 'peek'"), 'tapping active tool collapses to peek')
        order = await pg.evaluate("Array.from(document.querySelectorAll('.e-panel .mrail button')).map(b=>b.dataset.tab)")
        ok(order[:4] == ['content', 'colors', 'imgs', 'bg'], 'tools prioritized for phone: ' + ','.join(order))
        await pg.click('.e-top .mmore'); await pg.wait_for_timeout(500)
        ok('النص المصاحب' in await pg.inner_text('.mact') and 'المقاس' in await pg.inner_text('.mact'), 'editor more-menu')
        await pg.evaluate("closeModals()"); await pg.wait_for_timeout(300)
        # اختيار عنصر: الشريط السياقي يظهر فوق الورقة
        c = await pg.evaluate("(function(){const p=ED.proxies.title; const r=p.getClientRect(); const cr=document.querySelector('.e-canvas').getBoundingClientRect(); return [cr.left+r.x+r.width/2, cr.top+r.y+r.height/2];})()")
        await pg.touchscreen.tap(c[0], c[1]); await pg.wait_for_timeout(500)
        ok(await pg.evaluate("S.sel === 'title' && document.querySelector('#e_tb').classList.contains('show')"), 'tap selects element and shows contextual bar')
        tb = await pg.evaluate("(function(){const t=document.querySelector('#e_tb').getBoundingClientRect(), p=document.querySelector('.e-panel').getBoundingClientRect(); return [t.bottom, p.top];})()")
        ok(tb[0] <= tb[1] + 2, 'contextual bar sits above the sheet')
        # النص المصاحب يفتح ورقة سفلية
        await pg.evaluate("captionDialog()"); await pg.wait_for_timeout(900)
        ok(await pg.evaluate("!!document.querySelector('.msheet .caped')"), 'caption dialog renders as bottom sheet')
        await pg.screenshot(path=OUT + 'm1_caption_sheet.png')
        await pg.evaluate("closeModals()"); await pg.wait_for_timeout(300)
        await pg.evaluate("leaveEditor()")
        # التقويم والمزيد
        await pg.goto(APP + '#/cal'); await pg.wait_for_timeout(2500)
        ok(await pg.evaluate("!!document.querySelector('.mscreen .cgrid') && !!document.querySelector('.mback')"), 'calendar wrapped with app header + back')
        await pg.click('.mnav .nb[aria-label="مهمة جديدة"]'); await pg.wait_for_timeout(700)
        ok(await pg.evaluate("!!document.querySelector('.msheet input[aria-label=\"العنوان\"]')"), 'new task sheet from nav button')
        await pg.fill('.msheet input[aria-label="العنوان"]', 'مهمة من الجوال'); await pg.click('.msheet .btn.dark:has-text("أضف المهمة")'); await pg.wait_for_timeout(1800)
        ok(await pg.evaluate("API6.me('task_list','academy').then(l=>l.length)") == 1, 'task saved from the app')
        await pg.goto(APP + '#/more'); await pg.wait_for_timeout(1200)
        ok(await pg.evaluate("document.querySelectorAll('.mgroup').length") >= 4 and 'خروج' in await pg.inner_text('#view'), 'more screen groups')
        await pg.goto(APP + '#/mine'); await pg.wait_for_timeout(1500)
        ok(await pg.evaluate("!!document.querySelector('.mscreen .mgrid')"), 'mine screen wrapped')
        await pg.goto(APP + '#/'); await pg.wait_for_timeout(1500)
        ok('مهمة من الجوال' in await pg.inner_text('#view'), 'home upcoming lists the task')
        await pg.screenshot(path=OUT + 'm2_home.png')
        print('ERRORS', [e for e in errs if 'favicon' not in e and '404' not in e][:10])
        await b.close()
if __name__ == '__main__': asyncio.run(main())
