import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
"""زر الحذف في المحرر: يحذف العنصر المضاف، ويزيل عنصر القالب (ويعود بالتراجع)."""
import asyncio, sys
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT
from playwright.async_api import async_playwright
def ok(c, m): print(('✓ ' if c else '✗ ') + m, flush=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 1440, 'height': 900})).new_page()
        errs = await setup(pg)
        await pg.goto(URL + '#/s/ithmar'); await pg.wait_for_timeout(1500)
        await pg.evaluate("openDeckNew('ithmar', sampleDecks(trackOf('ithmar'))[1].slides, 'حذف')"); await pg.wait_for_timeout(2500)
        await pg.evaluate("document.querySelectorAll('.coach,.gintro,.gx-intro').forEach(x=>x.remove())")
        g = await pg.evaluate("Object.keys(LASTG).find(k=>!k.startsWith('L:') && fieldsOfGroup(k).length)")
        await pg.evaluate("select(%r)" % g); await pg.wait_for_timeout(200)
        await pg.evaluate("document.activeElement && document.activeElement.blur()")
        await pg.keyboard.press('Delete'); await pg.wait_for_timeout(400)
        ok(await pg.evaluate("S.hide['g_' + %r] === true && !S.sel" % g), 'Delete removes a template element: %s' % g)
        await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(400)
        ok(await pg.evaluate("!S.hide['g_' + %r]" % g), 'Ctrl+Z brings it back')
        await pg.evaluate("addLayer6({t:'text', x:.2, y:.2, w:.3, h:.1, text:'تجربة'})"); await pg.wait_for_timeout(400)
        n = await pg.evaluate("S.layers.length")
        await pg.evaluate("document.activeElement && document.activeElement.blur()")
        await pg.keyboard.press('Backspace'); await pg.wait_for_timeout(400)
        ok(await pg.evaluate("S.layers.length") == n - 1, 'Backspace deletes an added element')
        print('ERRORS', [e for e in errs if '404' not in e][:5]); await b.close()
asyncio.run(main())
