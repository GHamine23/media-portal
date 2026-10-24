import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # جذر المستودع (يعمل في أي نسخة عمل)
"""اختبار النص المصاحب والإرسال إلى القناة والجدولة والتقويم."""
import asyncio, sys
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT
from playwright.async_api import async_playwright
def ok(c, m): print(('✓ ' if c else '✗ ') + m)
async def clean(pg):
    for _ in range(3):
        if await pg.query_selector('.coach'): await pg.evaluate("document.querySelector('.coach').remove()")
        if await pg.query_selector('.modal'): await pg.keyboard.press('Escape'); await pg.wait_for_timeout(250)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        errs = await setup(pg)
        # الإعدادات: رمز البوت
        await pg.evaluate("typeof ED!=='undefined' && ED.open && (ED.leaveOK=true)"); await pg.goto(URL + '#/admin/settings'); await pg.wait_for_timeout(1500)
        await pg.fill('input[aria-label="رمز البوت"]', '123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij'); await pg.click('#abody > .btn.dark'); await pg.wait_for_timeout(1500)
        ok('مضبوط' in await pg.inner_text('#abody'), 'bot token saved')
        await pg.click('text=اختبر البوت'); await pg.wait_for_timeout(800)
        ok('athar_demo_bot' in await pg.inner_text('body'), 'bot test toast')
        # البرنامج: القناة والقوالب والنماذج
        await pg.evaluate("typeof ED!=='undefined' && ED.open && (ED.leaveOK=true)"); await pg.goto(URL + '#/admin/programs'); await pg.wait_for_timeout(1500)
        await pg.click('.pcard:nth-of-type(1) button:has-text("قناة تليجرام")'); await pg.wait_for_timeout(600)
        await pg.fill('.modal input[placeholder^="@channel"]', '@jeel_demo'); await pg.fill('.modal input[type=url]', 'https://example.org/join'); await pg.fill('.modal input[placeholder="الأنشطة_التربوية"]', 'الأنشطة_التربوية')
        await pg.fill('.modal textarea[placeholder^="الصق"]', 'نموذج رسالة ١\n---\nنموذج ٢')
        await pg.click('.modal button:has-text("قالب من الأساسي")'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT + 'm1_tgform.png')
        await pg.click('.modal .acts .btn.dark'); await pg.wait_for_timeout(2500)
        ok('@jeel_demo' in await pg.inner_text('#abody'), 'program channel saved')
        # المحرر: النص المصاحب
        await pg.evaluate("typeof ED!=='undefined' && ED.open && (ED.leaveOK=true)"); await pg.goto(URL + '#/e/ithmar/ann_cards'); await pg.wait_for_timeout(2500); await clean(pg)
        await pg.fill('#f6_title', 'لقاء *الأسبوع*'); await pg.fill('#f6_when', 'الأحد 8:00م') if await pg.query_selector('#f6_when') else None
        await pg.click('#e_cap'); await pg.wait_for_timeout(800)
        cap = await pg.evaluate("edToTg(document.querySelector('.caped'))")
        ok('لقاء الأسبوع' in cap and 'https://example.org/join' in cap and '#الأنشطة_التربوية' in cap, 'caption filled from design + program: ' + cap.replace('\n', ' | ')[:120])
        ok(await pg.evaluate("document.querySelector('.tgprev b') !== null"), 'telegram preview renders bold')
        await pg.screenshot(path=OUT + 'm2_caption.png')
        await pg.click('.capsend .btn.dark'); await pg.wait_for_timeout(400); await pg.click('.capsend .btn.arm'); await pg.wait_for_timeout(4000)   # الإرسال الفوري بضغطتين على الزر نفسه
        calls = await pg.evaluate("(window.DEMO_TG||[]).map(c=>c.url.split('/').pop())")
        ok(calls.count('sendPhoto') == 1 and calls.count('sendDocument') == 1, 'sent photo + document: ' + str(calls))
        ok('t.me/jeel_demo/' in (await pg.evaluate("(document.querySelector('.capafter a[target=_blank]')||{}).href||''")), 'post link shown inline')
        ok(await pg.evaluate("document.querySelector('.capsend .btn.dark').classList.contains('done') && /أُرسل/.test(document.querySelector('.capsend .btn.dark').textContent)"), 'send button shows done state')
        await pg.screenshot(path=OUT + 'm3_sent.png'); await clean(pg)
        # جدولة
        await pg.click('#e_cap'); await pg.wait_for_timeout(600)
        import datetime; when = (datetime.datetime.now() + datetime.timedelta(days=2)).strftime('%Y-%m-%dT10:30')
        await pg.click('.capsend .seg button:has-text("في موعد")'); await pg.wait_for_timeout(200)
        await pg.fill('.capwhen input[type=date]', when.split('T')[0]); await pg.fill('.capwhen input[type=time]', when.split('T')[1]); await pg.click('.capsend .btn.dark'); await pg.wait_for_timeout(3000)
        ok(await pg.evaluate("document.querySelector('.capsend .btn.dark').classList.contains('done') && /جُدول في/.test(document.querySelector('.capsend .btn.dark').textContent)"), 'schedule button turns into done state with time')
        await pg.fill('.capwhen input[type=time]', '11:45'); await pg.wait_for_timeout(300)
        ok(await pg.evaluate("!document.querySelector('.capsend .btn.dark').classList.contains('done') && /حدّث الجدولة/.test(document.querySelector('.capsend .btn.dark').textContent)"), 'changing time reverts button to update action')
        await pg.click('.capsend .btn.dark'); await pg.wait_for_timeout(1500)
        ok(await pg.evaluate("/حُدّثت/.test(document.querySelector('.capsend .btn.dark').textContent)"), 'schedule updated in place')
        q = await pg.evaluate("API6.me('tg_queue','academy')"); ok(len([x for x in q if x['status']=='queued']) == 1 and any('11:45' in __import__('datetime').datetime.fromtimestamp(x['when']/1000).strftime('%H:%M') for x in q if x['status']=='queued'), 'queue has one updated scheduled post')
        await pg.screenshot(path=OUT + 'm3b_scheduled.png'); await clean(pg)
        await pg.evaluate("typeof ED!=='undefined' && ED.open && (ED.leaveOK=true)"); await pg.goto(URL + '#/'); await pg.wait_for_timeout(2500); await clean(pg)
        ok(await pg.evaluate("document.querySelectorAll('.cal6 .cd.has').length") == 1 and 'القادم في التقويم' in await pg.inner_text('.clock6'), 'calendar shows the scheduled post')
        await pg.screenshot(path=OUT + 'm4_calendar.png')
        await pg.evaluate("typeof ED!=='undefined' && ED.open && (ED.leaveOK=true)"); await pg.goto(URL + '#/admin/tg'); await pg.wait_for_timeout(2000)
        t = await pg.inner_text('#abody'); ok('مجدول' in t and 'أُرسل' in t, 'admin queue lists sent + scheduled')
        await pg.screenshot(path=OUT + 'm5_queue.png')
        # مستخدم بلا صلاحية: نسخ فقط
        await pg.evaluate("logout()"); await pg.wait_for_timeout(800)
        await pg.fill('#lg_id', 'ahmad'); await pg.fill('#lg_pw', 'Ahmad#2026'); await pg.click('.lgform button[type=submit]'); await pg.wait_for_selector('#top:not([hidden])', timeout=60000); await pg.wait_for_timeout(1500); await clean(pg)
        await pg.evaluate("typeof ED!=='undefined' && ED.open && (ED.leaveOK=true)"); await pg.goto(URL + '#/e/ithmar/ann_cards'); await pg.wait_for_timeout(2500); await clean(pg)
        await pg.click('#e_cap'); await pg.wait_for_timeout(600)
        ok(await pg.evaluate("document.querySelector('.capsend .btn.dark').disabled") and 'صلاحية' in await pg.inner_text('.capsend'), 'no send without permission: button disabled with explanation')
        print('ERRORS', [e for e in errs if '404' not in e][:8])
        await b.close()
asyncio.run(main())
