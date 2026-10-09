import asyncio
from playwright.async_api import async_playwright
U='file:///home/claude/app/dist/index.html'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width':1366,'height':860}, accept_downloads=True)
        pg = await ctx.new_page(); errs=[]
        pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(U); await pg.wait_for_selector('.welcome .wcard')
        await pg.click('.wform .link'); await pg.wait_for_timeout(800)
        await pg.evaluate("document.querySelectorAll('.tour').forEach(x=>x.remove()); PREFS.tour={home:1,gallery:1,editor:1,deck:1}")
        # outline -> deck
        await pg.goto(U+'#/sanabel/slides'); await pg.wait_for_timeout(800)
        await pg.fill('.outline', '# خطة الفصل\nأ. سالم\n## الأهداف\n- الحفظ\n- الفهم\n> العلم نور\n120: طالباً\n30: لقاءً\n## الختام\n- شكر')
        await pg.click('.dcol.side .btn.main'); await pg.wait_for_timeout(1500)
        n = await pg.evaluate("S.deck.slides.map(s=>s.tpl).join(',')"); print('deck', n)
        async with pg.expect_download() as d: await pg.click('.actions .btn.main')
        dl = await d.value; path = await dl.path(); data=open(path,'rb').read(); print('pdf', dl.suggested_filename, len(data), data[:8], data[-6:])
        open('/home/claude/app/shots/test.pdf','wb').write(data)
        # change layout of slide 2
        await pg.click('.strip .slw:nth-child(2) .sl'); await pg.click('.tabs button:nth-child(2)'); await pg.wait_for_timeout(400)
        await pg.click('.layouts .lay:nth-child(4)'); await pg.wait_for_timeout(500)
        print('layout', await pg.evaluate("S.deck.slides[1].tpl"))
        await pg.goto(U+'#/sanabel/slides'); await pg.wait_for_timeout(800)
        print('decks listed', await pg.evaluate("document.querySelectorAll('.decks .tcard').length"))
        # identity switch
        await pg.goto(U+'#/judhoor/e/ann_circle'); await pg.wait_for_timeout(800)
        await pg.fill('#f_title', 'تجربة النقل'); await pg.wait_for_timeout(600)
        await pg.select_option('.idsw select', 'rifaq'); await pg.wait_for_timeout(1000)
        print('switched', await pg.evaluate("location.hash + ' ' + S.d.title + ' ' + S.d.arc"))
        # theme save
        await pg.click('.tabs button:nth-child(3)'); await pg.wait_for_timeout(300)
        await pg.click('.swt >> nth=0'); await pg.wait_for_timeout(400)
        await pg.click('.tsave .mini'); await pg.wait_for_timeout(400)
        print('themes', await pg.evaluate("JSON.stringify(PREFS.themes)"))
        # logo variant
        await pg.goto(U+'#/ithmar'); await pg.wait_for_timeout(800)
        await pg.click('.lgpick button:nth-child(3)'); await pg.wait_for_timeout(300)
        print('logo', await pg.evaluate("S.track.logo + ' ' + PREFS.logos.ithmar"))
        # wizard + studio + mine
        await pg.goto(U+'#/tiryaq/make'); await pg.wait_for_timeout(800)
        await pg.goto(U+'#/tiryaq/studio'); await pg.wait_for_timeout(800)
        await pg.goto(U+'#/multaqa/e/story_cover'); await pg.wait_for_timeout(800)
        await pg.click('.actions .btn:nth-child(3)'); await pg.wait_for_timeout(300)
        await pg.click('.saved .btn.main'); await pg.wait_for_timeout(1200)
        await pg.goto(U+'#/multaqa/mine'); await pg.wait_for_timeout(800)
        print('mine', await pg.evaluate("document.querySelectorAll('.gallery .tcard').length"))
        await pg.goto(U+'#/budhoor/k/social'); await pg.wait_for_timeout(1500)
        print('social cards', await pg.evaluate("document.querySelectorAll('.gallery.all .tcard').length"))
        print('errors', errs[:6])
        await b.close()
asyncio.run(main())
