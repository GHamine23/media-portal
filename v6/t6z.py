import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
"""المواد التعليمية: النوع الجديد في المعرض، والكتيّب متعدد الصفحات، وملف PDF للطباعة بمقاس A4."""
import asyncio, sys
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT
from playwright.async_api import async_playwright
def ok(c, m): print(('✓ ' if c else '✗ ') + m)
async def menu(pg, text):
    await pg.evaluate("t => { const b=[...document.querySelectorAll('.menu button')].find(x=>x.textContent.trim()===t); if (b) b.click(); return !!b; }", text)
async def main():
    async with async_playwright() as p:
        print('start', flush=True); b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1440, 'height': 900}, accept_downloads=True); print('page', flush=True)
        errs = await setup(pg); print('setup done', flush=True)
        await pg.goto(URL + '#/g/ishraq'); await pg.wait_for_timeout(2500)
        txt = await pg.inner_text('#view')
        ok('المواد التعليمية' in txt, 'gallery shows the «المواد التعليمية» section')
        n = await pg.evaluate("visibleTpls().filter(t=>t.type==='study').length"); ok(n == 7, 'seven study templates visible: %d' % n)
        ok(await pg.evaluate("!!visibleTpls().find(t=>t.id==='st_week' && t.type==='cover') && !!visibleTpls().find(t=>t.id==='st_cert' && t.type==='thanks')"), 'weekly table under covers, certificate under thanks')
        # الكتيّب
        await pg.goto(URL + '#/e/ishraq/st_cover'); await pg.wait_for_timeout(3000)
        await pg.evaluate("document.querySelectorAll('.coach,.gintro').forEach(x=>x.remove())")
        ok(await pg.evaluate("ED.doc.kind") == 'book', 'booklet cover opens a multi-page «book» document')
        ok(await pg.evaluate("!!document.querySelector('#e_pages .pg.add')"), 'pages strip with add button')
        await pg.click('#e_pages .pg.add'); await pg.wait_for_timeout(400); await menu(pg, 'صفحة نص'); await pg.wait_for_timeout(1200)
        await pg.click('#e_pages .pg.add'); await pg.wait_for_timeout(400); await menu(pg, 'خريطة مفاهيم'); await pg.wait_for_timeout(1200)
        st = await pg.evaluate("JSON.stringify(ED.doc.pages.map(p=>[p.tpl,p.size]))")
        ok(st == '[["st_cover","a4"],["st_page","a4"],["st_map","a4"]]', 'pages added in A4: ' + st)
        ok(await pg.evaluate("S.d.__n") == '٣', 'page number on the third page')
        await pg.screenshot(path=OUT + 'z1_book.png')
        async with pg.expect_download() as dl:
            await pg.evaluate("commitPage(); ED.doc.pages.forEach(p=>p.ph={}); exportPdf6(); void 0")
        d = await dl.value; path = OUT + 'z_book.pdf'; await d.save_as(path)
        data = open(path, 'rb').read()
        ok(data.count(b'/Type /Page ') + data.count(b'/Type /Page\n') + data.count(b'/Type /Page>') >= 3 or data.count(b'/MediaBox') == 3, 'PDF has three pages')
        ok(b'595.28' in data and b'841.89' in data, 'PDF pages are A4 (595×842 pt)')
        # تصميم A4 مفرد: خيار PDF في التنزيل
        await pg.evaluate("ED.leaveOK=true"); await pg.goto(URL + '#/e/ishraq/st_sheet'); await pg.wait_for_timeout(2500)
        await pg.evaluate("document.querySelectorAll('.coach,.gintro').forEach(x=>x.remove())")
        await pg.evaluate("dlMenu(document.querySelector('#e_dl') || document.body)"); await pg.wait_for_timeout(300)
        ok('ملف PDF للطباعة' in await pg.evaluate("(document.querySelector('.menu')||{}).textContent||''"), 'single A4 design offers a print PDF')
        await pg.evaluate("document.querySelectorAll('.menu').forEach(m=>m.remove())")
        await pg.evaluate("ED.leaveOK=true"); await pg.goto(URL + '#/e/ishraq/ann_panel'); await pg.wait_for_timeout(2500)
        await pg.evaluate("dlMenu(document.body)"); await pg.wait_for_timeout(300)
        ok('PDF' not in await pg.evaluate("(document.querySelector('.menu')||{}).textContent||''"), 'social post has no PDF option (unchanged)')
        print('ERRORS', [e for e in errs if '404' not in e][:5]); await b.close()
if __name__ == "__main__": asyncio.run(main())
