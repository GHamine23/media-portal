import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # جذر المستودع (يعمل في أي نسخة عمل)
"""اختبار بنية الموقع (ia): الرأس وقائمة الصورة بلا تكرار، حسابي مركز شخصي بترتيب عناوين سليم، الرئيسية بلا فراغ تحت التحية،
أول ١٢ مصغّراً تُرسم فوراً، أقسام الإدارة مجمّعة، الروابط القديمة تتحول، وشاشات التطبيق بلا تكرار لشريط التبويب. axe اختياري إن وُجد."""
import asyncio, sys, glob
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT, THM
from playwright.async_api import async_playwright
APP = URL.replace('index.html', 'app.html')
def ok(c, m): print(('✓ ' if c else '✗ ') + m)
AXE = (glob.glob('/tmp/claude-0/*/*/scratchpad/axe/node_modules/axe-core/axe.min.js') + glob.glob(_R + '/node_modules/axe-core/axe.min.js') + [''])[0]
HEADS = "Array.from(document.querySelectorAll('#view h1,#view h2,#view h3,#view h4')).filter(h=>h.getClientRects().length).map(h=>+h.tagName[1])"
def skips(levels): return [i for i in range(1, len(levels)) if levels[i] > levels[i - 1] + 1]
async def settle(pg, ms=1200):
    await pg.wait_for_timeout(ms)
    await pg.evaluate("document.querySelectorAll('.rv,.bwrap').forEach(x=>x.classList.add('in-view')); void 0")
async def axe(pg, name):
    if not AXE: return
    await pg.add_script_tag(path=AXE)
    r = await pg.evaluate("axe.run(document,{resultTypes:['violations']}).then(r=>r.violations.filter(v=>v.impact==='serious'||v.impact==='critical'||v.id==='heading-order').map(v=>v.id+':'+v.nodes.length))")
    print('  axe ' + name + ': ' + (', '.join(r) or 'نظيف'))
    return r
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        errs = await setup(pg)
        # الرأس: الأقسام في التنقل، وما يخصك في قائمة الصورة
        nav = await pg.evaluate("Array.from(document.querySelectorAll('.nav a')).map(a=>a.textContent)")
        ok(nav == ['الرئيسية', 'اصنع إعلانك', 'تصاميمي', 'التقويم', 'نصائح', 'الإدارة'], 'top nav: ' + '،'.join(nav))
        await pg.click('#avatar'); await pg.wait_for_timeout(300)
        menu = await pg.evaluate("Array.from(document.querySelectorAll('.menu a,.menu button')).map(a=>a.textContent.trim())")
        ok(not (set(menu) & set(nav)) and {'حسابي', 'أسبوعي في أثر', 'مراجعاتي', 'خروج'} <= set(menu), 'avatar menu personal only, no nav duplicates: ' + '،'.join(menu))
        await pg.keyboard.press('Escape'); await pg.mouse.click(700, 600); await pg.wait_for_timeout(200)
        # الرئيسية: القادم في التقويم في عمود التحية، ولا فراغ قبل المصمّم الذكي
        for w, h in [(1440, 900), (1920, 1080)]:
            await pg.set_viewport_size({'width': w, 'height': h}); await pg.goto(URL + '#/'); await settle(pg, 2000)
            g = await pg.evaluate("""(function(){const r=s=>document.querySelector(s).getBoundingClientRect(); const hg=r('.hgreet'),ck=r('.clock6'),up=r('.hgreet .hup'),ai=r('.aibox');
              return {up: !!document.querySelector('.hgreet .hup .calmini'), inClock: !!document.querySelector('.clock6 .calmini'), gap: Math.round(ai.top-Math.max(hg.bottom,ck.bottom)), diff: Math.round(Math.abs(up.bottom-ck.bottom)), side: up.left > ck.right};})()""")
            ok(g['up'] and not g['inClock'] and g['side'], '%d: upcoming sits beside the clock, in the greeting column' % w)
            ok(g['gap'] < 60 and g['diff'] < 60, '%d: no empty gap under the hero (gap %dpx, bottoms differ %dpx)' % (w, g['gap'], g['diff']))
            await pg.screenshot(path=OUT + 'r_home_%d.png' % w)
        await pg.set_viewport_size({'width': 1440, 'height': 900})
        lv = await pg.evaluate(HEADS); ok(not skips(lv), 'home heading order without skips: ' + str(lv[:12]))
        await axe(pg, 'home')
        # المعرض: أول ١٢ مصغّراً فوراً، والباقي عند الظهور
        await pg.goto(URL + '#/g/ishraq'); await pg.wait_for_timeout(500)
        try: await pg.wait_for_function("Array.from(document.querySelectorAll('.tgrid canvas')).slice(0,12).every(c=>c.classList.contains('drawn'))", timeout=30000)  # المحرك بطيء بلا معالج رسوم في المتصفح الآلي
        except Exception: pass
        d = await pg.evaluate("Array.from(document.querySelectorAll('.tgrid canvas')).map(c=>c.classList.contains('drawn'))")
        ok(len(d) > 16 and all(d[:12]), 'gallery: first 12 thumbnails drawn without scrolling (%d drawn of %d)' % (sum(d), len(d)))
        ok(not d[-1], 'gallery: thumbnails far below stay lazy')
        q = await pg.evaluate("Array.from(document.querySelectorAll('.quick .qcard b')).map(b=>b.textContent)")
        ok(q == ['اصنع إعلانك', 'صفحة بيضاء', 'الشرائح'] and not await pg.query_selector('.ghead6 .btn'), 'identity page: one place per start action: ' + '،'.join(q))
        await pg.screenshot(path=OUT + 'r_gallery.png')
        await axe(pg, 'gallery')
        # حسابي
        await pg.goto(URL + '#/account'); await settle(pg, 2000)
        lv = await pg.evaluate(HEADS)
        ok(lv and lv[0] == 1 and not skips(lv), 'account heading order h1→h2→h3: ' + str(lv))
        fs = await pg.evaluate("[getComputedStyle(document.querySelector('.card > h2.ch')).fontSize, document.querySelectorAll('.card > h2.ch').length]")
        ok(fs[0] == '19px' and fs[1] >= 4, 'account card titles are h2 with the old card-title size: ' + str(fs))
        txt = await pg.inner_text('#view')
        ok(all(k in txt for k in ['المظهر', 'لون الواجهة', 'الحركة في الواجهة', 'نشاطك', 'مراجعاتي', 'أسبوعك في أثر', 'ملاحظاتي وبلاغاتي', 'أرشيف البرنامج', 'تطبيق الجوال']), 'account is the personal hub (profile, look, activity, feedback, app)')
        ok(await pg.evaluate("!!document.querySelector('#avatar.on')"), 'avatar marked while in account')
        await pg.screenshot(path=OUT + 'r_account.png', full_page=True)
        await axe(pg, 'account')
        await pg.goto(URL + '#/reviews'); await pg.wait_for_timeout(1200)
        ok(await pg.evaluate("!!document.querySelector('.crumb[href=\"#/account\"]')"), 'reviews page links back to account')
        # الروابط القديمة والروابط القادمة من التطبيق
        for h, want in [('#/more', '#/account'), ('#/fb', '#/account?fb'), ('#/tpl', '#/g/')]:
            await pg.goto(URL + h); await pg.wait_for_timeout(900)
            got = await pg.evaluate("location.hash"); ok(got.startswith(want), 'route %s → %s' % (h, got))
            if h == '#/fb': await pg.wait_for_timeout(1500); ok(await pg.evaluate("history.length") >= 1 and await pg.evaluate("document.querySelector('#acfb').getBoundingClientRect().top < innerHeight - 150 && scrollY > 100"), 'feedback link scrolls to «ملاحظاتي وبلاغاتي»')
        # الإدارة: أقسام مجمّعة، والروابط كما هي
        await pg.goto(URL + '#/admin/tg'); await pg.wait_for_timeout(1500)
        a = await pg.evaluate("[document.querySelectorAll('.anav .agrp').length, document.querySelectorAll('.anav a').length, (document.querySelector('.anav a.on')||{}).getAttribute ? document.querySelector('.anav a.on').getAttribute('href') : '', Array.from(document.querySelectorAll('.agh')).map(x=>x.textContent)]")
        ok(a[0] == 5 and a[1] == 16 and a[2] == '#/admin/tg', 'admin: 16 sections in 5 groups, old hash still opens its tab: ' + '،'.join(a[3]))
        await pg.goto(URL + '#/admin'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=OUT + 'r_admin.png')
        await axe(pg, 'admin')
        # النصائح بلا سطر المراجع التقني
        await pg.goto(URL + '#/tips'); await pg.wait_for_timeout(1000)
        ok(not await pg.query_selector('.tipsrc') and 'الصياغة للمنصة' not in await pg.inner_text('#view'), 'tips: no references/technical footer')
        # الشاشة الضيقة: أقسام التنقل تنتقل إلى قائمة الصورة
        await pg.set_viewport_size({'width': 800, 'height': 900}); await pg.goto(URL + '#/'); await pg.wait_for_timeout(1000)
        await pg.click('#avatar'); await pg.wait_for_timeout(300)
        menu = await pg.evaluate("Array.from(document.querySelectorAll('.menu a,.menu button')).map(a=>a.textContent.trim())")
        ok({'تصاميمي', 'التقويم', 'نصائح', 'الإدارة', 'حسابي'} <= set(menu), 'narrow: nav sections reachable from avatar menu')
        await pg.mouse.click(400, 700)
        # الهاتف (موقع): لا تمرير أفقي، والهويات عمودان
        await pg.set_viewport_size({'width': 390, 'height': 844}); await pg.goto(URL + '#/'); await settle(pg, 1800)
        r = await pg.evaluate("[document.documentElement.scrollWidth, getComputedStyle(document.querySelector('.idgrid')).gridTemplateColumns.split(' ').length]")
        ok(r[0] <= 390 and r[1] == 2, '390: no horizontal scroll, identities in 2 columns: ' + str(r))
        await pg.screenshot(path=OUT + 'r_home_390.png', full_page=True)
        print('ERRORS', [e for e in errs if '404' not in e][:8])
        # التطبيق
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        m = await ctx.new_page(); me = []
        m.on('pageerror', lambda e: me.append(str(e)))
        await m.goto(APP); await m.evaluate("localStorage.clear()"); await m.goto(APP + '#/login'); await m.wait_for_timeout(900)
        await m.evaluate("DEMO.reset()"); await m.evaluate("DEMO.seed(%s)" % THM)
        await m.fill('#lg_id', 'admin'); await m.fill('#lg_pw', 'Admin#2026'); await m.click('.lgform button[type=submit]')
        await m.wait_for_selector('.mtab:not([hidden])', timeout=60000); await m.wait_for_timeout(2000)
        await m.evaluate("closeModals()")
        hrefs = await m.evaluate("Array.from(document.querySelectorAll('.mquick a')).map(a=>a.getAttribute('href'))")
        ok(not any(h in ('#/tpl', '#/cal') for h in hrefs) and len(hrefs) >= 4, 'app home quick: no tab-bar duplicates: ' + ' '.join(hrefs))
        await m.screenshot(path=OUT + 'r_app_home.png')
        await m.goto(APP + '#/more'); await m.wait_for_timeout(1000)
        tiles = await m.evaluate("Array.from(document.querySelectorAll('.mtile b')).map(b=>b.textContent)")
        ok(not ({'التقويم', 'تصاميمي', 'نصائح'} & set(tiles)) and 'ملاحظة للفريق' in tiles and len(tiles) == 4, 'app more tiles without tab/home duplicates: ' + '،'.join(tiles))
        await m.screenshot(path=OUT + 'r_app_more.png', full_page=True)
        await m.goto(APP + '#/account'); await m.wait_for_timeout(1500)
        ok(not await m.query_selector('.aclook') and not await m.query_selector('.acapp') and not await m.query_selector('#acact') and await m.query_selector('.pfcard') and await m.query_selector('#acfb'), 'app account: appearance/week/reviews live only in More; profile + feedback here')
        await m.screenshot(path=OUT + 'r_app_account.png', full_page=True)
        await m.goto(APP + '#/g/ishraq'); await m.wait_for_timeout(500)
        try: await m.wait_for_function("Array.from(document.querySelectorAll('.mtgrid canvas')).slice(0,12).every(c=>c.classList.contains('drawn'))", timeout=30000)
        except Exception: pass
        d = await m.evaluate("Array.from(document.querySelectorAll('.mtgrid canvas')).map(c=>c.classList.contains('drawn'))")
        ok(len(d) > 12 and all(d[:12]), 'app templates: first 12 drawn at once (%d of %d)' % (sum(d), len(d)))
        print('APP ERRORS', me[:5])
        await b.close()
if __name__ == '__main__': asyncio.run(main())
