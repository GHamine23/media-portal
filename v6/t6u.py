import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # جذر المستودع (يعمل في أي نسخة عمل)
"""اختبار أفلام الحركة (motion6.js): الواجهة العامة، تشغيل كل مقطع وتقديمه وإغلاقه، التخطّي، الصوت، الحركة الهادئة، الجوال 390 أفقياً وطولياً، بلا أخطاء."""
import asyncio, sys, json
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT, THM
from playwright.async_api import async_playwright
APP = URL.replace('index.html', 'app.html')
IDS = ['launch', 'home', 'gallery', 'editor', 'make', 'publish', 'cal', 'slides', 'lesson', 'presenter', 'mine', 'app', 'admin']
def ok(c, m): print(('✓ ' if c else '✗ ') + m); return c
def clean(errs): return [e for e in errs if 'favicon' not in e and '404' not in e]
async def start(pg, js):
    await pg.evaluate("window.__mr = null; (%s).then(r => window.__mr = r); void 0" % js)
async def result(pg, wait=2000):
    for _ in range(wait // 100):
        r = await pg.evaluate("window.__mr")
        if r is not None: return r
        await pg.wait_for_timeout(100)
    return None
async def main():
    ok('motion6.js' in open(_R + '/v6/build6.py').read().split("'updates6.js', ")[1][:14], 'motion6.js in ORDER6 right after updates6.js')
    html = open(_R + '/docs/app/index.html').read(); ok('../v6/js/motion6.js' in html, 'app shares motion6.js')
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        errs = await setup(pg)
        L = json.loads(await pg.evaluate("JSON.stringify(MOTION_CLIPS)"))
        ok([c['id'] for c in L] == IDS, 'MOTION_CLIPS ids: ' + ','.join(c['id'] for c in L))
        ok(all(c['title'] and c['section'] and c['desc'] and c['dur'] > 0 for c in L), 'every clip has title, section, desc, dur')
        lc = L[0]; ok(60 <= lc['dur'] <= 90, 'launch film length %.1fs' % lc['dur'])
        ok(all(15 <= c['dur'] <= 30 for c in L[1:]), 'section clips 15–30s: ' + ', '.join('%s %.0f' % (c['id'], c['dur']) for c in L[1:]))
        ok([c['id'] for c in L if c.get('admin')] == ['admin'], 'only admin clip flagged admin')
        ok(all(c.get('route') is None or isinstance(c['route'], str) for c in L) and await pg.evaluate("MOTION_CLIPS.filter(c=>c.route).every(c=>{new RegExp(c.route); return true})"), 'routes are regex strings')
        ok(await pg.evaluate("new RegExp(MOTION_CLIPS.find(c=>c.id==='cal').route).test('/cal') && new RegExp(MOTION_CLIPS.find(c=>c.id==='home').route).test('/') && !new RegExp(MOTION_CLIPS.find(c=>c.id==='home').route).test('/cal')"), 'route regex matches paths')
        ok(await pg.evaluate("typeof playMotion==='function' && typeof motionPoster==='function' && typeof renderMotionFrame==='function'"), 'API functions exist')
        # الصورة الممثلة
        pv = await pg.evaluate("(function(){const e=motionPoster('editor',320); document.body.appendChild(e); const r=e.getBoundingClientRect(); const n=e.querySelectorAll('.mo-stage *').length; e.remove(); return [r.width, r.height, n];})()")
        ok(pv[0] == 320 and abs(pv[1] - 180) < 1 and pv[2] > 30, 'motionPoster 320×180 with content: %s' % pv)
        fr = await pg.evaluate("(function(){const h=document.createElement('div'); h.style.cssText='width:270px;height:480px;position:fixed;left:0;top:0'; document.body.appendChild(h); const tl=renderMotionFrame('launch', 20, h); const a=[tl.v, h.querySelector('.mo-stage').getBoundingClientRect().width]; renderMotionFrame('launch', 40, h); a.push(h.querySelectorAll('.mo-stage').length, tl.t); h.remove(); return a;})()")
        ok(fr[0] is True and abs(fr[1] - 270) < 1 and fr[2] == 1 and fr[3] == 40, 'renderMotionFrame portrait host, reuses stage, seeks: %s' % fr)
        # كل مقطع: يعمل، يتقدم، يُقدَّم، يُغلق
        for c in L:
            await start(pg, "playMotion(%r)" % c['id']); await pg.wait_for_timeout(700)
            st = await pg.evaluate("(function(){const m=MO.current; const f=document.querySelector('.mo-frame').getBoundingClientRect(); return [!!document.querySelector('.mo-pl'), m.playing, m.t, f.width, f.height, m.tl.v];})()")
            await pg.evaluate("MO.current.seek(MO.current.dur*0.55)"); await pg.wait_for_timeout(250)
            t2 = await pg.evaluate("MO.current.t")
            if c['id'] in ('launch', 'make', 'cal'): await pg.screenshot(path=OUT + 'u_%s.png' % c['id'])
            await pg.keyboard.press('Escape'); r = await result(pg)
            gone = await pg.evaluate("!document.querySelector('.mo-pl') || !document.querySelector('.mo-pl.on')")
            ok(st[0] and st[1] and st[2] > 0.05 and st[3] > 1000 and st[5] is False and t2 >= c['dur'] * 0.55 - 0.05 and r and r['watched'] is False and gone, '%s plays (t=%.1f), seeks (%.1f), closes → %s %s' % (c['id'], st[2], t2, r, '' if st[3] > 1000 and gone else st))
        # الإكمال حتى النهاية
        await start(pg, "playMotion('home')"); await pg.wait_for_timeout(400)
        await pg.evaluate("MO.current.seek(MO.current.dur-0.4)"); await pg.wait_for_timeout(1200)
        ok(await pg.evaluate("!!document.querySelector('.mo-end') && !MO.current.playing"), 'end card with replay at the end')
        await pg.click('.mo-end .mo-eb2.ghost'); r = await result(pg); ok(r and r['watched'] is True, 'watched to the end → %s' % r)
        # التخطّي
        await start(pg, "playMotion('cal',{intro:true})"); await pg.wait_for_timeout(500)
        ok(await pg.is_visible('.mo-skip'), 'skip button shown for intro')
        await pg.click('.mo-skip'); r = await result(pg); ok(r and r['watched'] is False and r['at'] > 0, 'skip returns watched:false → %s' % r)
        await start(pg, "playMotion('cal')"); await pg.wait_for_timeout(300)
        ok(not await pg.query_selector('.mo-skip'), 'no skip without intro')
        # التحكم: إيقاف بالمسافة، الصوت يُحفظ، الشريط، الفصول
        await pg.keyboard.press('Space'); await pg.wait_for_timeout(200); ok(not await pg.evaluate("MO.current.playing"), 'space pauses')
        t1 = await pg.evaluate("MO.current.t"); await pg.wait_for_timeout(400); ok(abs(await pg.evaluate("MO.current.t") - t1) < 0.01, 'paused time is frozen')
        await pg.click('.mo-row .mo-b[aria-label="كتم الصوت"]'); ok(await pg.evaluate("localStorage.getItem('mo.snd')") == '0' and not await pg.evaluate("MO.current.sound"), 'sound off remembered')
        await pg.evaluate("document.querySelector('.mo-pl').classList.remove('idle')")
        bx = await pg.evaluate("(function(){const r=document.querySelector('.mo-bar').getBoundingClientRect(); return [r.left, r.right, r.top + r.height/2];})()")
        await pg.mouse.click(bx[0] + (bx[1] - bx[0]) * 0.25, bx[2]); await pg.wait_for_timeout(200)
        tt = await pg.evaluate("MO.current.t / MO.current.dur"); ok(0.7 < tt < 0.8, 'scrub bar is RTL (click at 25%% from left → %.2f)' % tt)
        n_ch = await pg.evaluate("document.querySelectorAll('.mo-tk').length"); ok(n_ch >= 4, 'chapter marks on bar: %d' % n_ch)
        await pg.evaluate("MO.current.seek(0.5)"); await pg.click('.mo-row .mo-b[aria-label="الفصل التالي"]'); await pg.wait_for_timeout(100)
        ok(await pg.evaluate("MO.current.t") > 2, 'next chapter jumps')
        await pg.keyboard.press('Escape'); await result(pg)
        await start(pg, "playMotion('cal')"); await pg.wait_for_timeout(300)
        ok(await pg.evaluate("MO.current.sound === false"), 'sound choice persists across plays')
        await pg.keyboard.press('Escape'); await result(pg)
        await pg.evaluate("localStorage.setItem('mo.snd','1')")
        print('ERRORS', clean(errs)[:10]); ok(not clean(errs), 'no console errors (site)')
        await pg.close()
        # الحركة الهادئة مع تفضيل تقليل الحركة
        ctx = await b.new_context(viewport={'width': 1280, 'height': 800}, reduced_motion='reduce'); rp = await ctx.new_page()
        await rp.goto(URL); await rp.wait_for_timeout(800)
        await start(rp, "playMotion('launch')"); await rp.wait_for_timeout(400)
        ok(await rp.evaluate("MO.current.calm === true && document.querySelector('.mo-row .mo-b.on') !== null"), 'prefers-reduced-motion → calm mode on')
        await rp.evaluate("MO.current.seek(9)"); await rp.screenshot(path=OUT + 'u_calm.png')
        await rp.keyboard.press('Escape'); await ctx.close()
        # التطبيق 390
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        m = await ctx.new_page(); me = []
        m.on('console', lambda x: me.append(x.text) if x.type == 'error' else None); m.on('pageerror', lambda e: me.append('PAGEERR ' + str(e)))
        await m.goto(APP); await m.evaluate("localStorage.clear()"); await m.goto(APP + '#/login'); await m.wait_for_timeout(1000)
        await m.evaluate("DEMO.reset()"); await m.evaluate("DEMO.seed(%s)" % THM); await m.wait_for_timeout(300)
        await m.fill('#lg_id', 'admin'); await m.fill('#lg_pw', 'Admin#2026'); await m.click('.lgform button[type=submit]')
        await m.wait_for_selector('.mtab:not([hidden])', timeout=60000); await m.wait_for_timeout(1500)
        ok(await m.evaluate("typeof playMotion==='function' && MOTION_CLIPS.length===13"), 'API available in the app')
        await start(m, "playMotion('launch',{intro:true})"); await m.wait_for_timeout(900)
        g = await m.evaluate("(function(){const f=document.querySelector('.mo-frame').getBoundingClientRect(), b=document.querySelector('.mo-bot').getBoundingClientRect(), s=document.querySelector('.mo-skip').getBoundingClientRect(), row=document.querySelector('.mo-row'); return [f.width,f.height,f.top,b.bottom,s.left,s.bottom, MO.current.tl.v, row.scrollWidth<=row.clientWidth+1, document.documentElement.scrollWidth];})()")
        ok(g[6] is True and g[0] <= 390 and g[1] <= 844 and g[3] <= 844 and g[4] >= 0 and g[7] and g[8] <= 390, 'app 390: portrait stage fits, controls in view, no overflow: %s' % g)
        await m.evaluate("MO.current.pause(); MO.current.seek(24)"); await m.wait_for_timeout(200); await m.screenshot(path=OUT + 'u_m_launch.png')
        await m.set_viewport_size({'width': 844, 'height': 390}); await m.wait_for_timeout(500)
        g2 = await m.evaluate("(function(){const f=document.querySelector('.mo-frame').getBoundingClientRect(); return [f.width,f.height,MO.current.tl.v, Math.round(MO.current.t)];})()")
        ok(g2[2] is False and g2[0] <= 844 and g2[1] <= 390 and g2[3] == 24, 'rotating to landscape rebuilds a horizontal stage at the same time: %s' % g2)
        await m.screenshot(path=OUT + 'u_m_land.png')
        await m.set_viewport_size({'width': 390, 'height': 844}); await m.wait_for_timeout(300)
        await m.tap('.mo-skip'); r = await result(m); ok(r and r['watched'] is False, 'app skip → %s' % r)
        print('M ERRORS', clean(me)[:10]); ok(not clean(me), 'no console errors (app)')
        await b.close()
if __name__ == '__main__': asyncio.run(main())
