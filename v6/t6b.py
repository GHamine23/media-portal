"""اختبارات وظيفية للواجهة السادسة في وضع التجربة."""
import asyncio, sys
sys.path.insert(0, '/home/claude/media-portal/v6')
from t6 import setup, URL, OUT
from playwright.async_api import async_playwright
def ok(c, m):
    print(('✓ ' if c else '✗ ') + m)
async def clean(pg):
    for _ in range(3):
        if await pg.query_selector('.coach'): await pg.evaluate("document.querySelector('.coach').remove()")
        if await pg.query_selector('.modal'): await pg.keyboard.press('Escape'); await pg.wait_for_timeout(250)
async def center(pg, g):
    return await pg.evaluate("(function(){const p=ED.proxies['%s']; const r=p.getClientRect(); const cr=document.querySelector('.e-canvas').getBoundingClientRect(); return [cr.left+r.x+r.width/2, cr.top+r.y+r.height/2];})()" % g)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1440, 'height': 900}, accept_downloads=True)
        errs = await setup(pg)
        # ---------- المحرر: المحتوى والحفظ ----------
        await pg.goto(URL + '#/e/ithmar/ann_cards'); await pg.wait_for_timeout(2500); await clean(pg)
        await pg.fill('#f6_title', 'ورشة *إدارة الوقت*'); await pg.wait_for_timeout(600)
        ok(await pg.evaluate("S.d.title") == 'ورشة *إدارة الوقت*', 'content field updates design')
        ok(await pg.evaluate("phList().indexOf('العنوان الرئيسي') < 0"), 'placeholder no longer dimmed after typing')
        # Shift drag
        c = await center(pg, 'title'); before = await pg.evaluate("JSON.stringify(S.pos)")
        await pg.mouse.move(c[0], c[1]); await pg.keyboard.down('Shift'); await pg.mouse.down()
        for i in range(1, 12): await pg.mouse.move(c[0] - i * 7, c[1] + i * 2); await pg.wait_for_timeout(16)
        await pg.mouse.up(); await pg.keyboard.up('Shift'); await pg.wait_for_timeout(400)
        pos = await pg.evaluate("JSON.stringify((S.pos[S.size]||{}).title||{})")
        ok('"dy":0' in pos and '"dx":-' in pos, 'shift-drag locks to horizontal: ' + pos)
        # undo
        await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(400)
        ok(await pg.evaluate("!((S.pos[S.size]||{}).title||{}).dx"), 'undo restores position')
        await pg.keyboard.press('Control+Shift+z'); await pg.wait_for_timeout(300)
        # resize with transformer anchor
        await pg.mouse.click(c[0], c[1]); await pg.wait_for_timeout(300)
        anc = await pg.evaluate("(function(){const a=ED.tr.findOne('.bottom-left'); const r=a.getClientRect(); const cr=document.querySelector('.e-canvas').getBoundingClientRect(); return [cr.left+r.x+r.width/2, cr.top+r.y+r.height/2];})()")
        await pg.mouse.move(anc[0], anc[1]); await pg.mouse.down()
        for i in range(1, 10): await pg.mouse.move(anc[0] - i * 6, anc[1] + i * 6); await pg.wait_for_timeout(16)
        await pg.mouse.up(); await pg.wait_for_timeout(400)
        ok((await pg.evaluate("(S.gs.title||{}).s || 1")) > 1.05, 'corner handle scales the element: ' + str(await pg.evaluate("JSON.stringify(S.gs)")))
        # add text layer + color
        await pg.evaluate("ED.mode='full'; buildRail()"); await pg.click('#e_rail button[data-tab=text]'); await pg.wait_for_timeout(500)
        await pg.click('.addtxt.display'); await pg.wait_for_timeout(500)
        ok(await pg.evaluate("S.layers.length") == 1 and (await pg.evaluate("S.sel")).startswith('L:'), 'text layer added and selected')
        await pg.screenshot(path=OUT + 'b1_layer.png')
        # save to account
        await pg.click('#e_save'); await pg.wait_for_timeout(400)
        await pg.fill('#sv_name', 'ورشة إدارة الوقت'); await pg.click('.modal .btn.dark'); await pg.wait_for_timeout(1500)
        items = await pg.evaluate("API6.me('item_list')")
        ok(any(x['name'] == 'ورشة إدارة الوقت' for x in items), 'saved to account')
        iid = [x for x in items if x['name'] == 'ورشة إدارة الوقت'][0]['id']
        # export: placeholder warning then download
        dl_task = asyncio.ensure_future(pg.wait_for_event('download', timeout=20000))
        await pg.click('#e_dl'); await pg.wait_for_timeout(300); await pg.click('.menu button:nth-of-type(1)'); await pg.wait_for_timeout(800)
        warned = await pg.query_selector('.modal h3')
        wt = await warned.inner_text() if warned else ''
        if 'عناوين عامة' in wt: await pg.click('.modal .acts .btn:not(.dark)'); await pg.wait_for_timeout(500)
        ok('عناوين عامة' in wt, 'placeholder warning before export')
        d = await dl_task; ok(d.suggested_filename.endswith('.png'), 'download: ' + d.suggested_filename)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        # reopen saved
        await pg.goto(URL + '#/mine'); await pg.wait_for_timeout(1200); await pg.screenshot(path=OUT + 'b2_mine.png')
        await pg.goto(URL + '#/d/' + iid); await pg.wait_for_timeout(2500); await clean(pg)
        ok(await pg.evaluate("S.d.title") == 'ورشة *إدارة الوقت*' and await pg.evaluate("S.layers.length") == 1, 'reopened saved design')
        # upload image
        await pg.click('#e_rail button[data-tab=imgs]'); await pg.wait_for_timeout(400)
        await pg.set_input_files('.e-panel input[type=file]', '/home/claude/media-portal/assets/img/img_dome.webp'); await pg.wait_for_timeout(2500)
        ok(await pg.evaluate("S.layers.some(function(L){return L.t==='img' && /^asset:/.test(L.ref)})"), 'uploaded image added as layer')
        await pg.screenshot(path=OUT + 'b3_upload.png')
        # ---------- الشرائح ----------
        await pg.goto(URL + '#/s/ishraq'); await pg.wait_for_timeout(1500)
        await pg.click('.sldeck .btn.dark'); await pg.wait_for_timeout(2500); await clean(pg)
        n = await pg.evaluate("ED.doc.pages.length"); ok(n >= 5, 'deck opened with %d slides' % n)
        await pg.click('#e_pages .pg:nth-child(2)'); await pg.wait_for_timeout(600)
        ok(await pg.evaluate("ED.cur") == 1, 'page switch')
        await pg.screenshot(path=OUT + 'b4_deck.png')
        dl_task = asyncio.ensure_future(pg.wait_for_event('download', timeout=40000))
        await pg.evaluate("exportPdf6()")
        await pg.wait_for_timeout(800)
        if await pg.query_selector('.modal'): await pg.click('.modal .acts .btn:not(.dark)')
        d = await dl_task; ok(d.suggested_filename.endswith('.pdf'), 'pdf: ' + d.suggested_filename)
        # ---------- البلاغات ----------
        await pg.goto(URL + '#/'); await pg.wait_for_timeout(800)
        await pg.evaluate("showFeedback6()"); await pg.wait_for_timeout(300)
        await pg.fill('#fb_text', 'زر التنزيل لا يظهر في الجوال'); await pg.click('.modal .btn.dark'); await pg.wait_for_timeout(800)
        await pg.goto(URL + '#/admin/feedback'); await pg.wait_for_timeout(1200)
        ok('زر التنزيل' in await pg.inner_text('.fbadmin'), 'feedback reaches admin')
        await pg.select_option('.fbx select', 'done'); await pg.fill('.fbx textarea', 'أُصلح'); await pg.click('.fbx .btn.dark'); await pg.wait_for_timeout(600)
        await pg.goto(URL + '#/account'); await pg.wait_for_timeout(1200)
        ok('تم' in await pg.inner_text('.fblist') and 'أُصلح' in await pg.inner_text('.fblist'), 'user sees status and reply')
        # ---------- إنشاء حساب ----------
        await pg.goto(URL + '#/admin/accounts'); await pg.wait_for_timeout(1200)
        await pg.click('.ahead .btn.dark'); await pg.wait_for_timeout(300)
        await pg.fill('#ac_name', 'سارة'); await pg.fill('#ac_user', 'sara'); await pg.click('.modal .acts .btn.dark'); await pg.wait_for_timeout(1500)
        ok('كلمة المرور' in await pg.inner_text('.modal'), 'temp password shown for new account')
        await pg.screenshot(path=OUT + 'b5_temp.png')
        await pg.keyboard.press('Escape')
        # ---------- المساعد الذكي (بنموذج مقلّد) ----------
        await pg.evaluate("""DEMO.srv; GAS._props.GEMINI_KEY='k-demo-AIzaSy0123456789abcdefghijklmnop'; window.DEMO_AI=function(body){ return JSON.stringify({info:{title:'بيوت *مطمئنة*',who:'الشيخ خالد',time:'بعد العشاء',place:'مسجد الحي',kind:'لقاء أسري'},designs:[{tpl:'ann_panel',why:'لوحة هادئة',fields:[{k:'title',v:'بيوت *مطمئنة*'}]},{tpl:'ann_circle',why:'دائرة',fields:[]}],missing:['تاريخ اللقاء']}); };""")
        await pg.evaluate("refreshBundle()"); await pg.wait_for_timeout(1500)
        await pg.goto(URL + '#/make'); await pg.wait_for_timeout(1000)
        ok(await pg.evaluate("aiReady()"), 'ai ready for admin')
        await pg.fill('#mk_text', 'لقاء أسري عن البيوت المطمئنة يقدمه الشيخ خالد بعد العشاء في مسجد الحي'); await pg.click('.mkform .btn.dark'); await pg.wait_for_timeout(2500)
        for _ in range(5):
            if await pg.query_selector('.mkwiz'): await pg.click('.mkctl .btn.dark'); await pg.wait_for_timeout(700)
        await pg.wait_for_timeout(3000)
        txt = await pg.inner_text('#mkbody')
        ok('تاريخ اللقاء' in txt and await pg.evaluate("document.querySelectorAll('#mkbody .tcard6').length") >= 2, 'ai results + missing info')
        await pg.screenshot(path=OUT + 'b6_ai.png', full_page=True)
        await pg.click('#mkbody .tcard6:nth-of-type(2)'); await pg.wait_for_timeout(2500); await clean(pg)
        ok(await pg.evaluate("S.d.title") == 'بيوت *مطمئنة*', 'ai design opens in editor with texts')
        await pg.screenshot(path=OUT + 'b7_ai_editor.png')
        print('ERRORS', [e for e in errs if '404' not in e][:10])
        # ---------- مستخدم عادي: لا مواقع تواصل ولا إدارة ----------
        u = await b.new_page(viewport={'width': 1280, 'height': 860})
        ue = await setup(u, 'ahmad', 'Ahmad#2026')
        ok(await u.evaluate("!canSocial() && !visibleTpls().some(function(t){return t.type==='social'})"), 'social hidden without permission')
        ok(await u.evaluate("!document.querySelector('.nav a[href=\"#/admin\"]')"), 'no admin link for user')
        ok(await u.evaluate("V6.bundle.programs.length") == 2, 'user sees his two programs')
        await u.goto(URL + '#/'); await u.wait_for_timeout(800)
        await u.evaluate("useProgram('alim').then(buildTop)"); await u.wait_for_timeout(1200); await u.goto(URL + '#/'); await u.wait_for_timeout(1000)
        await u.screenshot(path=OUT + 'b8_alim_empty.png')
        print('USER ERRORS', [e for e in ue if '404' not in e][:10])
        s = await b.new_page(viewport={'width': 1280, 'height': 860})
        se = await setup(s, 'mushrif', 'Mushrif#2026')
        await s.goto(URL + '#/admin'); await s.wait_for_selector('.anav a', timeout=15000)
        tabs = await s.evaluate("Array.from(document.querySelectorAll('.anav a')).map(function(a){return a.textContent})")
        ok('الإعدادات' not in tabs and 'الحسابات' in tabs, 'supervisor tabs limited: ' + ','.join(tabs))
        print('SUP ERRORS', [e for e in se if '404' not in e][:10])
        await b.close()
if __name__ == '__main__': asyncio.run(main())
