import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
"""عرض المقدّم: نافذة المقدّم في الصفحة، ونافذة العرض (#/stage) تعرض الشرائح وحدها وتتبع الأوامر."""
import asyncio, sys
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT
from playwright.async_api import async_playwright
def ok(c, m): print(('✓ ' if c else '✗ ') + m, flush=True)
async def clean(pg):
    await pg.evaluate("document.querySelectorAll('.coach,.gintro,.gx-intro').forEach(x=>x.remove())")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 1440, 'height': 900})
        pg = await ctx.new_page()
        errs = await setup(pg)
        await pg.goto(URL + '#/s/ithmar'); await pg.wait_for_timeout(1500)
        await pg.evaluate("openDeckNew('ithmar', sampleDecks(trackOf('ithmar'))[1].slides, 'درس المقدّم')"); await pg.wait_for_timeout(2500); await clean(pg)
        await pg.evaluate("ED.doc.pages[0].notes = 'رحّب بالحضور، ثم اسألهم عن توقعاتهم.'")
        ok(await pg.locator('#e_presenter').count() == 1, 'editor has the «عرض المقدّم» button')
        async with ctx.expect_page() as pinfo:
            await pg.click('#e_presenter')
        st = await pinfo.value
        st_errs = []; st.on('pageerror', lambda e: st_errs.append(str(e)))
        await st.wait_for_selector('.present6.follower', timeout=30000); await st.wait_for_timeout(1500)
        await pg.wait_for_timeout(800)
        con = await pg.evaluate("({on: !!document.querySelector('.pcon'), thumbs: document.querySelectorAll('.pc-t').length, notes: document.querySelector('.pc-notes-t').textContent, status: document.querySelector('.pc-status').textContent})")
        ok(con['on'] and con['thumbs'] >= 4 and 'رحّب' in con['notes'], 'console: thumbnails, current slide and notes: %s' % con)
        sv = await st.evaluate("({title: document.title, bar: getComputedStyle(document.querySelector('.present6 .pbar')).display, top: document.querySelector('#top').hidden, cv: !!document.querySelector('.present6 .pslide canvas')})")
        ok(sv['title'].startswith('عرض:') and sv['bar'] == 'none' and sv['top'] and sv['cv'], 'stage window shows the slides alone, titled for sharing: %s' % sv)
        await pg.wait_for_timeout(1500)
        ok('متصلة' in await pg.evaluate("document.querySelector('.pc-status').textContent"), 'console sees the stage window as connected')
        await pg.screenshot(path=OUT + 'ae1_console.png'); await st.screenshot(path=OUT + 'ae2_stage.png')
        # التنقل من نافذة المقدّم
        await pg.keyboard.press('ArrowLeft'); await pg.wait_for_timeout(900)
        a = await pg.evaluate("document.querySelector('.pc-count').textContent"); s_txt = await st.evaluate("document.querySelector('.pcount').textContent")
        ok(a.split('·')[0].strip() == s_txt.split('·')[0].strip() and not a.startswith('1 /'), 'next from the console moves the stage: %s | %s' % (a, s_txt))
        await pg.click('.pc-t >> nth=3'); await pg.wait_for_timeout(900)
        ok((await st.evaluate("document.querySelector('.pcount').textContent")).startswith('4 /'), 'clicking a thumbnail jumps the stage to that slide')
        # التنقل من نافذة العرض يعود إلى المقدّم
        await st.keyboard.press('ArrowRight'); await st.wait_for_timeout(900)
        ok((await pg.evaluate("document.querySelector('.pc-count').textContent")).split('/')[0].strip() == (await st.evaluate("document.querySelector('.pcount').textContent")).split('/')[0].strip(), 'keys in the stage window keep the console in step')
        # الشاشة السوداء
        await pg.keyboard.press('b'); await st.wait_for_timeout(500)
        ok(await st.evaluate("!document.querySelector('.pblank').hidden && document.querySelector('.pblank').dataset.c === '#000'"), 'B in the console blacks out the stage')
        await pg.keyboard.press('b'); await st.wait_for_timeout(400)
        ok(await st.evaluate("document.querySelector('.pblank').hidden"), 'B again brings the slide back')
        # القلم: ما يُكتب في نافذة المقدّم يظهر على الشريحة عند الطلاب
        await pg.keyboard.press('p'); await pg.wait_for_timeout(200)
        box = await pg.locator('.pc-ink').bounding_box()
        await pg.mouse.move(box['x'] + box['width'] * .3, box['y'] + box['height'] * .4); await pg.mouse.down()
        for k in range(12): await pg.mouse.move(box['x'] + box['width'] * (.3 + k * .03), box['y'] + box['height'] * (.4 + (k % 3) * .02))
        await pg.mouse.up(); await pg.wait_for_timeout(600)
        ink = await st.evaluate("(()=>{const c=document.querySelector('.present6 .pdraw'); const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n=0; for(let k=3;k<d.length;k+=4) if(d[k]>0) n++; return n})()")
        ok(ink > 50, 'pen strokes from the console appear on the stage (%d px)' % ink)
        await pg.keyboard.press('p')
        # النقاط والقرعة
        await pg.keyboard.press('s'); await pg.wait_for_timeout(300)
        await pg.click('.pc-team >> nth=0 >> .pcs.add'); await pg.wait_for_timeout(500)
        sc = await st.evaluate("({shown: !document.querySelector('.pscore').hidden, p: document.querySelector('.pscore .sct .scp') && document.querySelector('.pscore .sct .scp').textContent})")
        ok(sc['shown'] and sc['p'] == '١', 'team points from the console show on the stage: %s' % sc)
        await pg.keyboard.press('r'); await pg.wait_for_timeout(400)
        await pg.click('.pc-go'); await st.wait_for_timeout(2600)
        pk = await st.evaluate("(()=>{const x=document.querySelector('.ppick .pkname'); return x ? x.textContent : ''})()")
        ok(pk and pk != '؟', 'the draw runs on the stage: %s' % pk)
        await pg.screenshot(path=OUT + 'ae3_console_tools.png'); await st.screenshot(path=OUT + 'ae4_stage_tools.png')
        await pg.keyboard.press('r'); await pg.wait_for_timeout(300)
        # إنهاء
        await pg.click('.pc-end'); await pg.wait_for_timeout(1200)
        ok(st.is_closed() and not await pg.evaluate("!!document.querySelector('.pcon')"), 'ending closes the stage window and the console')
        print('ERRORS', [e for e in errs + st_errs if '404' not in e][:5]); await b.close()
asyncio.run(main())
