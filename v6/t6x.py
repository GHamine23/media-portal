import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # جذر المستودع
"""إصلاحات ما قبل الإطلاق: حفظ خطوط التصميم العامة، وإيقاف ميزات البرنامج، ومراجعة الذكاء بلا Gemini."""
import asyncio, sys
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT
from playwright.async_api import async_playwright
def ok(c, m): print(('✓ ' if c else '✗ ') + m)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        errs = await setup(pg)
        await pg.goto(URL + '#/e/ishraq/ann_cards'); await pg.wait_for_timeout(3000)
        await pg.evaluate("document.querySelectorAll('.coach,.gintro').forEach(x=>x.remove())")
        prog = await pg.evaluate("FS_PROG && FS_PROG.title")
        alt = await pg.evaluate("Object.keys(FONTS).find(k=>k!==FS.title)")
        await pg.evaluate("(function(v){ const t=fontTargets().find(x=>x.id==='all_title'); t.set(v); changed6(); })('%s')" % alt); await pg.wait_for_timeout(800)
        await pg.evaluate("commitPage()")
        ok(await pg.evaluate("ED.doc.pages[0].fs && ED.doc.pages[0].fs.title") == alt, 'design-wide title font stored in the page')
        await pg.evaluate("ED.leaveOK=true; leaveEditor()")
        ok(await pg.evaluate("FS.title") == prog, 'leaving the editor restores the programme font')
        await pg.evaluate("loadPage; ED.open=false")
        doc = await pg.evaluate("JSON.stringify(ED.doc)")
        await pg.evaluate("showEditor6(JSON.parse(%r))" % doc); await pg.wait_for_timeout(2000)
        ok(await pg.evaluate("FS.title") == alt, 'reopening the design brings its font back')
        await pg.evaluate("ED.leaveOK=true"); await pg.goto(URL + '#/'); await pg.wait_for_timeout(1500)
        await pg.evaluate("V6.prog.features = Object.assign({}, V6.prog.features, {slides:false, ai:false}); buildTop(); render()"); await pg.wait_for_timeout(1500)
        ok(not await pg.evaluate("!!document.querySelector('.nav a[href=\"#/make\"]')"), 'make hidden from nav when programme disables it')
        await pg.goto(URL + '#/s/ishraq'); await pg.wait_for_timeout(1200)
        ok('متوقف في هذا البرنامج' in await pg.inner_text('#view'), 'slides route explains it is disabled')
        ok(await pg.evaluate("V6.settings.ai.vision = false; !aiVision()"), 'AI design review hidden without a vision key')
        print('ERRORS', [e for e in errs if '404' not in e][:5]); await b.close()
asyncio.run(main())
