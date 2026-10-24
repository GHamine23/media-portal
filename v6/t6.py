import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # جذر المستودع (يعمل في أي نسخة عمل)
"""اختبار الواجهة السادسة محلياً (يحتاج خادماً محلياً على المنفذ 8765 يخدم /home/claude)."""
import asyncio, sys
from playwright.async_api import async_playwright
OUT = '/tmp/claude-0/-home-claude/c52b6293-5ec5-5831-a8f0-81095c1243b7/scratchpad/v6/' + ('' if os.path.basename(_R) == 'media-portal' else os.path.basename(_R) + '/')
os.makedirs(OUT, exist_ok=True)
URL = 'http://localhost:8765/' + os.path.relpath(_R, '/home/claude') + '/dist6/index.html'
THM = ['thmanyahserifdisplay-Medium.otf', 'thmanyahserifdisplay-Bold.otf', 'thmanyahserifdisplay-Black.otf', 'thmanyahseriftext-Light.otf', 'thmanyahseriftext-Regular.otf', 'thmanyahseriftext-Medium.otf']
async def setup(pg, user='admin', pw='Admin#2026'):
    errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    await pg.goto(URL)
    await pg.evaluate("localStorage.clear()")
    await pg.goto(URL + '#/login'); await pg.wait_for_timeout(800)
    await pg.evaluate("DEMO.reset()")
    await pg.evaluate("DEMO.seed(%s)" % THM)
    await pg.evaluate("loadUiFonts()"); await pg.wait_for_timeout(600)
    await pg.fill('#lg_id', user); await pg.fill('#lg_pw', pw)
    await pg.click('.lgform button[type=submit]')
    await pg.wait_for_selector('#top:not([hidden])', timeout=60000)
    await pg.wait_for_timeout(1500)
    for _ in range(4):
        if await pg.query_selector('.modal'): await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        if await pg.query_selector('.coach'): await pg.evaluate("document.querySelector('.coach').remove()")
    return errs
async def shot(pg, name, full=False): await pg.screenshot(path=OUT + name + '.png', full_page=full)
async def main():
    which = sys.argv[1] if len(sys.argv) > 1 else 'all'
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        await pg.goto(URL + '#/login'); await pg.wait_for_timeout(1500)
        await shot(pg, '01_login_nofont')
        errs += await setup(pg)
        await shot(pg, '02_home', True)
        await pg.goto(URL + '#/g/ishraq'); await pg.wait_for_timeout(2500)
        await shot(pg, '03_gallery')
        await pg.goto(URL + '#/e/ishraq/ann_panel'); await pg.wait_for_timeout(3000)
        for _ in range(3):
            if await pg.query_selector('.coach'): await pg.evaluate("document.querySelector('.coach').remove()")
        await shot(pg, '04_editor')
        # select presenter by clicking proxy center
        c = await pg.evaluate("(function(){const p=ED.proxies.who; const r=p.getClientRect(); const cr=document.querySelector('.e-canvas').getBoundingClientRect(); return [cr.left+r.x+r.width/2, cr.top+r.y+r.height/2];})()")
        await pg.mouse.click(c[0], c[1]); await pg.wait_for_timeout(500)
        print('sel', await pg.evaluate('S.sel'))
        await shot(pg, '05_selected')
        c = await pg.evaluate("(function(){const p=ED.proxies.title; const r=p.getClientRect(); const cr=document.querySelector('.e-canvas').getBoundingClientRect(); return [cr.left+r.x+r.width/2, cr.top+r.y+r.height/2];})()")
        await pg.mouse.dblclick(c[0], c[1]); await pg.wait_for_timeout(600)
        print('inline', await pg.evaluate("document.querySelectorAll('.ied6 textarea').length"))
        await pg.keyboard.type('لقاء الأسرة'); await pg.wait_for_timeout(500)
        await shot(pg, '06_inline')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        for t in ['colors', 'els', 'fonts', 'layers', 'tpls']:
            if t in ('els', 'fonts', 'layers'): await pg.evaluate("ED.mode='full'; buildRail()")
            await pg.click('#e_rail button[data-tab=%s]' % t); await pg.wait_for_timeout(1200)
            await shot(pg, '07_panel_' + t)
        print('title', await pg.evaluate('S.d.title'), 'ph', await pg.evaluate('JSON.stringify(ED.doc.pages[0].ph)'))
        await pg.goto(URL + '#/make'); await pg.wait_for_timeout(1200)
        await pg.fill('#mk_text', 'لقاء الأسرة التربوي\nأ. خالد العمر\nالخميس 8:00 مساءً\nعبر زوم'); await pg.click('.mkform button[type=submit]'); await pg.wait_for_timeout(3000)
        await shot(pg, '08_make', True)
        await pg.goto(URL + '#/admin'); await pg.wait_for_timeout(1500); await shot(pg, '09_admin', True)
        for t in ['accounts', 'programs', 'fonts', 'feedback']:
            await pg.goto(URL + '#/admin/' + t); await pg.wait_for_timeout(1500); await shot(pg, '10_admin_' + t, True)
        await pg.goto(URL + '#/mine'); await pg.wait_for_timeout(1000); await shot(pg, '11_mine')
        print('ERRORS', [e for e in errs if 'favicon' not in e][:15])
        m = await b.new_page(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
        me = await setup(m)
        await shot(m, '20_m_home', True)
        await m.goto(URL + '#/e/budhoor/ann_cards'); await m.wait_for_timeout(3000)
        if await m.query_selector('.coach'): await m.evaluate("document.querySelector('.coach').remove()")
        await shot(m, '21_m_editor')
        await m.evaluate("openTab('colors')"); await m.wait_for_timeout(1200); await shot(m, '22_m_sheet')
        print('M ERRORS', [e for e in me if 'favicon' not in e][:10])
        await b.close()
if __name__ == '__main__': asyncio.run(main())
