import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # جذر المستودع (يعمل في أي نسخة عمل)
"""اختبار: المصمّم الذكي في الرئيسية، والأزرار داخل الهوية، والمشاركة بالرابط والتعديل المشترك، ورابط العرض، وإعادة الضبط."""
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
        errs = await setup(pg, 'ahmad', 'Ahmad#2026')
        await pg.goto(URL + '#/'); await pg.wait_for_timeout(2000); await clean(pg)
        ok(await pg.query_selector('.aibox') is not None and await pg.query_selector('.hero .quick') is None, 'home: AI box instead of quick cards')
        await pg.screenshot(path=OUT + 'g1_home.png')
        await pg.fill('.aita', 'ورشة عن إدارة الوقت'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(1200)
        ok((await pg.evaluate("location.hash")).startswith('#/make') and (await pg.evaluate("document.getElementById('mk_text').value")) == 'ورشة عن إدارة الوقت', 'AI box hands the idea to make page')
        await pg.goto(URL + '#/g/ithmar'); await pg.wait_for_timeout(2000)
        ok(await pg.evaluate("document.querySelectorAll('.quick .qcard').length") == 3, 'quick cards inside identity page (make, blank, slides)')
        await pg.screenshot(path=OUT + 'g2_gallery.png')
        # save, share with coedit
        await pg.goto(URL + '#/e/ithmar/ann_cards'); await pg.wait_for_timeout(2500); await clean(pg)
        await pg.fill('#f6_title', 'لقاء *مشترك*'); await pg.wait_for_timeout(400)
        ok(await pg.query_selector('#e_reset') is not None, 'reset button beside undo/redo')
        await pg.click('#e_save'); await pg.wait_for_timeout(400); await pg.fill('#sv_name', 'لقاء مشترك')
        await pg.click('.modal .tog:nth-of-type(1) input'); await pg.click('.modal .tog.sub input'); await pg.click('.modal .btn.dark'); await pg.wait_for_timeout(2500)
        iid = await pg.evaluate("ED.doc.id")
        await pg.click('#e_share'); await pg.wait_for_timeout(600)
        links = await pg.evaluate("Array.from(document.querySelectorAll('.modal .linkrow input')).map(i=>i.value)")
        ok(len(links) == 2 and '#/p/' + iid in links[0] and '#/d/' + iid in links[1], 'share links shown: ' + ' | '.join(links))
        await pg.screenshot(path=OUT + 'g3_share.png'); await pg.keyboard.press('Escape')
        # reset keeps texts
        await pg.evaluate("S.gs = { title: { s: 1.5 } }; changed6()"); await pg.wait_for_timeout(300)
        await pg.click('#e_reset'); await pg.wait_for_timeout(400); await pg.click('.modal .btn.dark'); await pg.wait_for_timeout(600)
        ok(await pg.evaluate("S.d.title") == 'لقاء *مشترك*' and await pg.evaluate("Object.keys(S.gs).length") == 0, 'reset keeps texts, clears styles')
        # teammate edits the same item
        await relogin(pg, 'admin', 'Admin#2026')
        await pg.goto(URL + '#/d/' + iid); await pg.wait_for_timeout(3000); await clean(pg)
        ok(await pg.evaluate("ED.doc.id") == iid and await pg.evaluate("!!ED.doc.teammate"), 'teammate opens the same item (co-edit)')
        await pg.fill('#f6_title', 'عدّله المدير'); await pg.wait_for_timeout(5000)
        it = await pg.evaluate("API6.me('item_get', '%s')" % iid)
        ok(it['pages'][0]['d']['title'] == 'عدّله المدير' and it['editedBy'] and it['owner'] != 'مدير المنصة', 'teammate edit saved, owner kept: ' + str(it['owner']) + ' / ' + str(it.get('editedBy')))
        await pg.goto(URL + '#/p/' + iid); await pg.wait_for_timeout(2500)
        ok(await pg.query_selector('.pview canvas') is not None, 'present link renders the design')
        await pg.screenshot(path=OUT + 'g4_present.png')
        # element prev/next
        await pg.goto(URL + '#/e/ithmar/ann_cards'); await pg.wait_for_timeout(2500); await clean(pg)
        await pg.evaluate("openElPanel('title')"); await pg.wait_for_timeout(400)
        await pg.click('.elnav .nx'); await pg.wait_for_timeout(400)
        ok(await pg.evaluate("ED.elG") != 'title', 'element next arrow works: ' + await pg.evaluate("ED.elG"))
        print('ERRORS', [e for e in errs if '404' not in e][:8])
        await b.close()
asyncio.run(main())
