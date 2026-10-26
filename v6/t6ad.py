import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
"""الأقسام (الإعلانات، العروض، المواد التعليمية) في الرئيسية والتنقل وصفحات المسار والتطبيق، وروابط «دليل أثر»."""
import asyncio, sys
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT, THM
from playwright.async_api import async_playwright
def ok(c, m): print(('✓ ' if c else '✗ ') + m, flush=True)
async def clean(pg):
    await pg.evaluate("document.querySelectorAll('.coach,.gintro,.gx-intro').forEach(x=>x.remove())")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        errs = await setup(pg)
        await pg.goto(URL + '#/'); await pg.wait_for_timeout(2500); await clean(pg)
        ok(await pg.evaluate("document.querySelectorAll('.homesecs .hseccard').length") == 3, 'three sections on the home page')
        ok(await pg.evaluate("!!document.querySelector('#top .nav a[href=\"#/sections\"]')"), 'الأقسام in the top navigation')
        await pg.evaluate("document.querySelector('.homesecs').scrollIntoView({block:'center'})"); await pg.wait_for_timeout(600)
        await pg.screenshot(path=OUT + 'ad1_home.png')
        # القسم ثم المسار
        await pg.click('.hseccard[data-sec=slides]'); await pg.wait_for_timeout(1500); await clean(pg)
        ok('/sections?s=slides' in pg.url and await pg.evaluate("/العروض/.test(document.querySelector('.sechead2 h1').textContent)"), 'step 2: the slides section page')
        n = await pg.evaluate("document.querySelectorAll('.secgrid2 .sectr').length")
        ok(n >= 2 and await pg.evaluate("[...document.querySelectorAll('.secgrid2 .sectr')].every(a=>/#\\/s\\//.test(a.getAttribute('href')))"), 'its tracks lead to the slides of each track (%d)' % n)
        await pg.goto(URL + '#/sections'); await pg.wait_for_timeout(1200)
        ok(await pg.evaluate("document.querySelectorAll('.secpick3 .seccard3').length") == 3 and await pg.evaluate("!document.querySelector('.sectr')"), 'step 1: the three sections alone, no tracks')
        await pg.click('.seccard3[data-sec=slides]'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=OUT + 'ad2_sections.png')
        await pg.click('.secgrid2 .sectr >> nth=0'); await pg.wait_for_timeout(1800); await clean(pg)
        ok('#/s/' in pg.url and await pg.evaluate("document.querySelector('.secbar .secb.on').dataset.sec") == 'slides', 'slides page opens with the section bar')
        await pg.screenshot(path=OUT + 'ad3_slides.png')
        await pg.click('.secbar .secb[data-sec=design]'); await pg.wait_for_timeout(1800); await clean(pg)
        st = await pg.evaluate("({on: document.querySelector('.secbar .secb.on').dataset.sec, study: [...document.querySelectorAll('.tcard6 .tiny')].some(x=>/مواد تعليمية/.test(x.textContent)), n: document.querySelectorAll('.tcard6').length, chips: [...document.querySelectorAll('.gbar .chip')].map(c=>c.textContent)})")
        ok(st['on'] == 'design' and not st['study'] and st['n'] > 10 and 'مواد تعليمية' not in st['chips'], 'designs section without study materials: %s' % {k: st[k] for k in ('on', 'n')})
        await pg.screenshot(path=OUT + 'ad4_designs.png')
        await pg.click('.secbar .secb[data-sec=study]'); await pg.wait_for_timeout(1800); await clean(pg)
        st = await pg.evaluate("({on: document.querySelector('.secbar .secb.on').dataset.sec, all: [...document.querySelectorAll('.tcard6')].every(c=>/\\/st_/.test(c.getAttribute('href'))), n: document.querySelectorAll('.tcard6').length, url: location.hash})")
        ok(st['on'] == 'study' and st['all'] and st['n'] >= 5 and st['url'].endswith('/study'), 'study section shows only study materials: %s' % st)
        await pg.screenshot(path=OUT + 'ad5_study.png')
        ok(await pg.evaluate("document.querySelector('#top .nav a[href=\"#/sections\"]').classList.contains('on')"), 'nav marks الأقسام on track pages')
        # روابط دليل أثر
        await pg.goto(URL + '#/guide'); await pg.wait_for_timeout(2500); await clean(pg)
        links = await pg.evaluate("[...document.querySelectorAll('.glink')].map(a=>a.getAttribute('href'))")
        ok(links and all(l.startswith('#/') and '^' not in l and '(' not in l for l in links), 'guide links are real pages: %s' % links)
        bad = []
        for l in links + ['#/tpl', '#/sections', '#/news']:
            await pg.goto(URL + l); await pg.wait_for_timeout(1500)
            page = await pg.evaluate("document.body.dataset.page")
            h = await pg.evaluate("location.hash")
            if l != '#/' and (h in ('', '#/') and l not in ('#/news',)): bad.append((l, h, page))
        ok(not bad, 'every guide link opens its page (no fallback to home): %s' % bad)
        # التطبيق
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        m = await ctx.new_page(); APP = URL.replace('index.html', 'app.html')
        await m.goto(APP); await m.evaluate("localStorage.clear()"); await m.goto(APP + '#/login'); await m.wait_for_timeout(1000)
        await m.evaluate("DEMO.reset()"); await m.evaluate("DEMO.seed(%s)" % THM); await m.wait_for_timeout(300)
        await m.fill('#lg_id', 'admin'); await m.fill('#lg_pw', 'Admin#2026'); await m.click('.lgform button[type=submit]')
        await m.wait_for_selector('.mtab:not([hidden])', timeout=60000); await m.wait_for_timeout(1200); await m.evaluate("closeModals()")
        await m.goto(APP + '#/tpl'); await m.wait_for_timeout(2000)
        ok(await m.evaluate("document.querySelectorAll('.msecseg .msecb').length") == 3, 'app templates screen has the three sections')
        await m.screenshot(path=OUT + 'ad6_app.png')
        await m.click('.msecseg .msecb >> nth=2'); await m.wait_for_timeout(1500)
        ok('/study' in m.url and await m.evaluate("[...document.querySelectorAll('.mtc')].every(a=>/\\/st_/.test(a.getAttribute('href')))"), 'app study section')
        print('ERRORS', [e for e in errs if '404' not in e][:5]); await b.close()
asyncio.run(main())
