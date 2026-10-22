import asyncio, json
from playwright.async_api import async_playwright
OUT='/tmp/claude-0/-home-claude/70f68a14-a7f8-546d-a4d0-039a53fab0d1/scratchpad/p1/'
URL='file:///home/claude/media-portal/dist/index.html'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':1366,'height':860})
        errs=[]
        pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_selector('.welcome .wcard', timeout=20000)
        await pg.click('.welcome .link'); await pg.wait_for_timeout(600)
        await pg.evaluate("localStorage.setItem('jz1.tour', 'x')")
        await pg.goto(URL+'#/ishraq/e/ann_panel'); await pg.wait_for_timeout(1500)
        while await pg.query_selector('.tour'): await pg.click('.ttip .link'); await pg.wait_for_timeout(200)
        g = await pg.evaluate("JSON.stringify(Object.keys(LASTG))"); print('groups', g)
        before = await pg.evaluate("JSON.stringify(LASTG)")
        # select presenter group via its center
        c = await pg.evaluate("(function(){const b=LASTG.who; const r=pv.getBoundingClientRect(), sz=SIZES[S.size], k=r.width/sz.w; return [r.left+(b.x0+b.x1)/2*k, r.top+(b.y0+b.y1)/2*k];})()")
        await pg.mouse.click(c[0], c[1]); await pg.wait_for_timeout(300)
        print('sel', await pg.evaluate("S.sel"))
        await pg.screenshot(path=OUT+'sel_who.png')
        # scale presenter to 150%
        await pg.evaluate("(function(){const r=document.querySelector('#selbar input[aria-label=\"حجم العنصر\"]'); r.value='1.5'; r.dispatchEvent(new Event('input')); r.dispatchEvent(new Event('change'));})()")
        await pg.wait_for_timeout(400)
        after = json.loads(await pg.evaluate("JSON.stringify(LASTG)")); bef=json.loads(before)
        changed=[k for k in bef if k in after and bef[k]!=after[k]]
        print('changed groups after scaling who:', changed, 'gs', await pg.evaluate("JSON.stringify(S.gs)"))
        # color presenter text
        await pg.click('#selbar .gsrow .sws button:nth-child(3)'); await pg.wait_for_timeout(300)
        print('gs after color', await pg.evaluate("JSON.stringify(S.gs)"))
        await pg.screenshot(path=OUT+'who_scaled.png')
        # double click on title
        c = await pg.evaluate("(function(){const b=LASTG.title; const r=pv.getBoundingClientRect(), sz=SIZES[S.size], k=r.width/sz.w; return [r.left+(b.x0+b.x1)/2*k, r.top+(b.y0+b.y1)/2*k];})()")
        await pg.mouse.dblclick(c[0], c[1]); await pg.wait_for_timeout(400)
        n = await pg.evaluate("document.querySelectorAll('.ied textarea').length"); print('inline editors', n)
        await pg.keyboard.type('عنوان تجريبي جديد'); await pg.wait_for_timeout(400)
        print('title now', await pg.evaluate("S.d.title"))
        await pg.screenshot(path=OUT+'inline_edit.png')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        # shift drag of title: horizontal mostly with vertical jitter
        b0 = await pg.evaluate("JSON.stringify(LASTG.title)")
        await pg.mouse.move(c[0], c[1]); await pg.keyboard.down('Shift'); await pg.mouse.down()
        for i in range(1,11): await pg.mouse.move(c[0]-i*8, c[1]+i*2); await pg.wait_for_timeout(16)
        await pg.mouse.up(); await pg.keyboard.up('Shift'); await pg.wait_for_timeout(300)
        print('title before', b0, 'after', await pg.evaluate("JSON.stringify(LASTG.title)"), 'pos', await pg.evaluate("JSON.stringify(S.pos)"))
        # view scroll
        print('view', await pg.evaluate("(function(){const v=document.querySelector('.view'); return [getComputedStyle(v).overflowY, v.scrollHeight, v.clientHeight];})()"))
        # feedback dialog
        await pg.click('#userbox .tbtn'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT+'feedback.png')
        print('errors', errs[:8])
        # mobile
        m = await b.new_page(viewport={'width':390,'height':844}, has_touch=True, is_mobile=True)
        await m.goto(URL); await m.wait_for_selector('.welcome .wcard', timeout=20000)
        await m.click('.welcome .link'); await m.wait_for_timeout(500)
        await m.evaluate("localStorage.setItem('jz1.tour', 'x')")
        await m.goto(URL+'#/ishraq/e/ann_panel'); await m.wait_for_timeout(1500)
        while await m.query_selector('.tour'): await m.click('.ttip .link'); await m.wait_for_timeout(200)
        c = await m.evaluate("(function(){const b=LASTG.title; const r=pv.getBoundingClientRect(), sz=SIZES[S.size], k=r.width/sz.w; return [r.left+(b.x0+b.x1)/2*k, r.top+(b.y0+b.y1)/2*k];})()")
        await m.touchscreen.tap(c[0], c[1]); await m.wait_for_timeout(120); await m.touchscreen.tap(c[0], c[1]); await m.wait_for_timeout(500)
        print('mobile inline', await m.evaluate("document.querySelectorAll('.ied').length"))
        await m.screenshot(path=OUT+'m_inline.png')
        await b.close()
asyncio.run(main())
