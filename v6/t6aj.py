import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
"""«ارفع عرضًا جاهزًا»: ملف PDF يصير عرضًا (شريحة لكل صفحة) يُعرض بأداة العرض المعتادة.
يحتاج ملفًا تجريبيًا في /home/claude/test_deck.pdf (ثلاث صفحات 16:9)."""
import asyncio, sys
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT
from playwright.async_api import async_playwright
fails = []
def ok(c, m): print(('✓ ' if c else '✗ ') + m); (None if c else fails.append(m))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1280, 'height': 900})
        errs = await setup(pg)
        await pg.goto(URL + '#/s/judhoor'); await pg.wait_for_timeout(2500)
        ok(await pg.evaluate("!!document.querySelector('.slup') && !!document.querySelector('.slready')"), 'prominent «ارفع عرضًا جاهزًا» in the header and as a wide card')
        await pg.evaluate("document.querySelectorAll('.coach,.gintro').forEach(x=>x.remove())")
        await pg.screenshot(path=OUT + 'aj_slides.png')
        # الرفع: من زر الصفحة نفسه، باختيار الملف
        async with pg.expect_file_chooser() as fc:
            await pg.click('.slready')
        ch = await fc.value
        await ch.set_files('/home/claude/test_deck.pdf')
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=OUT + 'aj_progress.png')
        for _ in range(60):
            if await pg.evaluate("!!(window.ED && ED.doc && ED.doc.kind === 'deck' && ED.doc.pages.length === 3)"): break
            await pg.wait_for_timeout(500)
        r = await pg.evaluate("ED.doc && [ED.doc.kind, ED.doc.pages.length, ED.doc.pages.map(p=>p.tpl).join(','), ED.doc.name, ED.doc.pages.every(p=>p.d.photo && /^asset:/.test(p.d.photo.src))]")
        ok(r and r[0] == 'deck' and r[1] == 3 and r[2] == 'sl_pdf,sl_pdf,sl_pdf', 'each PDF page becomes a slide: ' + str(r))
        ok(r and r[3] == 'test deck', 'deck named after the file')
        ok(r and r[4], 'pages saved in the user library (asset:)')
        await pg.wait_for_timeout(1500)
        await pg.evaluate("document.querySelectorAll('.coach,.gintro,.modal').forEach(x=>x.remove())")
        await pg.screenshot(path=OUT + 'aj_editor.png')
        # العرض بأداة العرض المعتادة
        await pg.evaluate("present6(false, 0)"); await pg.wait_for_timeout(2000)
        ok(await pg.evaluate("!!document.querySelector('.pstage, .present, .pres6')"), 'plays in the live presenter')
        await pg.screenshot(path=OUT + 'aj_present.png')
        bad = [e for e in errs if 'favicon' not in e and 'ERR_' not in e and '404' not in e]
        ok(not bad, 'no console errors: ' + str(bad[:3]))
        await b.close()
    print('FAILS', len(fails)); sys.exit(1 if fails else 0)
asyncio.run(main())
