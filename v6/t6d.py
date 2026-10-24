import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # جذر المستودع (يعمل في أي نسخة عمل)
"""اختبار: درجات التعديل، وحصر الهويات، والاسم والصورة، وإعدادات الخطوط، ومقاس يوتيوب، والطبقات والخطوط الجديدة."""
import asyncio, sys
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT
from playwright.async_api import async_playwright
def ok(c, m): print(('✓ ' if c else '✗ ') + m)
async def clean(pg):
    for _ in range(3):
        if await pg.query_selector('.coach'): await pg.evaluate("document.querySelector('.coach').remove()")
        if await pg.query_selector('.modal'): await pg.keyboard.press('Escape'); await pg.wait_for_timeout(250)
async def relogin(pg, user, pw):
    await pg.evaluate("logout()"); await pg.wait_for_timeout(800)
    await pg.fill('#lg_id', user); await pg.fill('#lg_pw', pw); await pg.click('.lgform button[type=submit]')
    await pg.wait_for_selector('#top:not([hidden])', timeout=60000); await pg.wait_for_timeout(1500); await clean(pg)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        errs = await setup(pg)
        # المشرف يحصر أحمد في إثمار ودرجة «المحتوى فقط»، ويجعل خطاً من هوية البرنامج ويحجب آخر
        await relogin(pg, 'mushrif', 'Mushrif#2026')
        uid = await pg.evaluate("API6.me('acc_list').then(l => l.find(a => a.username === 'ahmad').uid)")
        await pg.evaluate("API6.me('acc_save', JSON.stringify({ uid: '%s', tracks: ['ithmar'], editLevel: 'content' }))" % uid)
        await pg.goto(URL + '#/admin/fonts'); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=OUT + 'f1_fonts_admin.png')
        rows = await pg.query_selector_all('.frow')
        ok(len(rows) >= 3, 'fonts library rows: %d' % len(rows))
        await pg.click('.frow:nth-of-type(2) .fctl label:nth-child(1) input'); await pg.wait_for_timeout(1500)
        await pg.click('.frow:last-of-type .fctl label:nth-child(2) input'); await pg.wait_for_timeout(1500)
        P = await pg.evaluate("JSON.stringify((V6.bundle.programs.find(p=>p.id==='academy')))")
        ok('"fontsId":["' in P and '"block":{"fonts":["' in P, 'identity + blocked font saved')
        await pg.goto(URL + '#/admin/accounts'); await pg.wait_for_timeout(2000)
        await pg.evaluate("accForm(null, function(){})"); await pg.wait_for_timeout(500)
        ok('الهويات التي يدخلها' in await pg.inner_text('.modal') and 'درجة التعديل' in await pg.inner_text('.modal'), 'account form has identities + edit level')
        await pg.screenshot(path=OUT + 'f2_accform.png'); await pg.keyboard.press('Escape')
        # أحمد
        await relogin(pg, 'ahmad', 'Ahmad#2026')
        await pg.evaluate("useProgram('academy').then(buildTop)"); await pg.wait_for_timeout(1500)
        ok(await pg.evaluate("Object.keys(TRACKS).join(',')") == 'ithmar', 'user sees only his identity: ' + await pg.evaluate("Object.keys(TRACKS).join(',')"))
        await pg.goto(URL + '#/e/ithmar/ann_photo'); await pg.wait_for_timeout(3000); await clean(pg)
        tabs = await pg.evaluate("Array.from(document.querySelectorAll('#e_rail button')).map(b=>b.dataset.tab).join(',')")
        ok(tabs == 'content,tpls,imgs,pub', 'content-only rail (+ publishing): ' + tabs)
        ok(await pg.evaluate("ED.locked && !Object.values(ED.proxies)[0].draggable()"), 'elements locked')
        sizes = await pg.evaluate("Array.from(document.querySelectorAll('#e_size option')).map(o=>o.textContent).join(',')")
        ok('غلاف يوتيوب' in sizes, 'youtube size offered: ' + sizes)
        await pg.select_option('#e_size', 'yt'); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=OUT + 'f3_yt.png')
        fonts = await pg.evaluate("fontChoices()")
        ok(len(fonts['ident']) >= 1 and all(f not in fonts['general'] for f in fonts['ident']), 'identity fonts listed first: ' + str(fonts['ident']))
        # الاسم والصورة
        await pg.evaluate("ED.leaveOK=true"); await pg.goto(URL + '#/account'); await pg.wait_for_timeout(1500)
        await pg.fill('#pf_name', 'أحمد الجديد')
        await pg.set_input_files('.pfcard input[type=file]', _R + '/v6/brand/png/icon-192.png'); await pg.wait_for_timeout(800)
        await pg.click('.pfcard .btn.dark'); await pg.wait_for_timeout(1500)
        ok(await pg.evaluate("V6.me.name") == 'أحمد الجديد' and await pg.evaluate("!!document.querySelector('#avatar img')"), 'profile name + avatar saved and shown')
        await pg.screenshot(path=OUT + 'f4_account.png')
        print('ERRORS', [e for e in errs if '404' not in e][:8])
        await b.close()
asyncio.run(main())
