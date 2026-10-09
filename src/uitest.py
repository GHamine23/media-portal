import asyncio, sys
from playwright.async_api import async_playwright
OUT='/home/claude/app/shots/'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for vw,tag in [((1366,860),'d'),((390,844),'m')]:
            pg = await b.new_page(viewport={'width':vw[0],'height':vw[1]})
            errs=[]
            pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto('file:///home/claude/app/dist/index.html')
            await pg.wait_for_selector('.welcome .wcard', timeout=20000)
            await pg.wait_for_timeout(1200)
            await pg.screenshot(path=OUT+f'ui_{tag}_welcome.png')
            await pg.fill('.wform input[type=text]','أ. خالد العمر'); await pg.fill('.wform .pin','1234')
            await pg.click('.wform button[type=submit]')
            await pg.wait_for_timeout(1500)
            await pg.screenshot(path=OUT+f'ui_{tag}_tour.png')
            # skip tour
            if await pg.query_selector('.tour'): await pg.click('.ttip .link')
            await pg.wait_for_timeout(300)
            await pg.screenshot(path=OUT+f'ui_{tag}_home.png', full_page=True)
            await pg.goto('file:///home/claude/app/dist/index.html#/ithmar'); await pg.wait_for_timeout(1500)
            if await pg.query_selector('.tour'): await pg.click('.ttip .link')
            await pg.screenshot(path=OUT+f'ui_{tag}_gallery.png')
            await pg.goto('file:///home/claude/app/dist/index.html#/tiryaq/k/social'); await pg.wait_for_timeout(1800)
            await pg.screenshot(path=OUT+f'ui_{tag}_social.png')
            await pg.goto('file:///home/claude/app/dist/index.html#/tiryaq/e/ann_night'); await pg.wait_for_timeout(1500)
            if await pg.query_selector('.tour'): await pg.click('.ttip .link')
            await pg.click('.tabs button:nth-child(3)'); await pg.wait_for_timeout(500)
            await pg.screenshot(path=OUT+f'ui_{tag}_editor.png')
            await pg.goto('file:///home/claude/app/dist/index.html#/budhoor/slides'); await pg.wait_for_timeout(1500)
            await pg.screenshot(path=OUT+f'ui_{tag}_slides.png', full_page=True)
            await pg.click('.samples .tcard'); await pg.wait_for_timeout(1500)
            if await pg.query_selector('.tour'): await pg.click('.ttip .link')
            await pg.screenshot(path=OUT+f'ui_{tag}_deck.png')
            print(tag, 'errors:', errs[:8])
            await pg.close()
        await b.close()
asyncio.run(main())
