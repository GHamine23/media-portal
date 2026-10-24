import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # جذر المستودع
"""هوية «خارطة الثغور»: نسخ الشعار ورقم الدفعة ولون الشعار، وشعار البرنامج في الرئيسية.
الشعارات تُقرأ من مجلد العمل المؤقت (لا تُرفع إلى المستودع)."""
import asyncio, sys, base64, json
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT, THM
from playwright.async_api import async_playwright
LG = os.environ.get('OMR_LOGOS', '/tmp/claude-0/-home-claude/c52b6293-5ec5-5831-a8f0-81095c1243b7/scratchpad/omr_logos')
def ok(c, m): print(('✓ ' if c else '✗ ') + m)
C = {'p': '#273e72', 'pd': '#1a2a52', 'pl': '#4d6398', 's': '#bc914c', 'sd': '#946f37', 'sdd': '#5e4521', 'a': '#bc914c', 'a2': '#a27a3d', 'paper': '#f7f4ee', 'warm': '#efe8da', 'ink': '#1f2a44', 'muted': '#8a877f', 'teal': '#16234a', 'tealL': '#3b5288'}
async def make_omr(pg):
    files = [('lg_khartah', 'خارطة الثغور', 'khartah_full.png'), ('lg_khartah_swap', 'ذهبي على كحلي', 'khartah_swap.png'), ('lg_khartah_word', 'الخط وحده', 'khartah_word.png')]
    await pg.evaluate("API6.me('prog_save', JSON.stringify({id:'omr', name:'مشروع العمر', desc:'', color:'#273e72', features:{social:true, slides:true, ai:true}, identities:[]}))")
    for key, name, fn in files:
        b64 = base64.b64encode(open(LG + '/' + fn, 'rb').read()).decode()
        await pg.evaluate("""async ([b64, key, name]) => { const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0)); const f = new File([bin], key + '.png', {type: 'image/png'}); await uploadAsset(f, {kind:'logo', scope:'program', program:'omr', key: key, name: name, thumb: ''}); }""", [b64, key, name])
    ident = {'id': 'khartah', 'group': 'act', 'name': 'خارطة الثغور', 'full': 'خارطة الثغور', 'desc': '', 'logo': 'lg_khartah', 'logos': [[k, n] for k, n, _ in files], 'c': C, 'lgo': {'n': '٤', 'show': True, 'x': 0.1, 'y': 0.3, 's': 0.3}}
    await pg.evaluate("p => API6.me('prog_save', JSON.stringify(p))", {'id': 'omr', 'identities': [ident], 'logo': 'lg_khartah', 'tagline': 'الدفعة الرابعة'})
    await pg.evaluate("refreshBundle()"); await pg.wait_for_timeout(1500)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        errs = await setup(pg)
        await make_omr(pg)
        await pg.evaluate("refreshBundle()"); await pg.wait_for_timeout(1500)
        await pg.evaluate("useProgram('omr')"); await pg.wait_for_timeout(2500)
        saved = await pg.evaluate("JSON.stringify(V6.prog.identities[0].lgo)")
        ok('"n":"٤"' in saved, 'server keeps batch settings: ' + saved)
        await pg.evaluate("go('#/'); render()"); await pg.wait_for_timeout(2500)
        ok(await pg.evaluate("!!document.querySelector('.hero .pmark canvas')"), 'programme logo shown on home')
        ok('الدفعة الرابعة' in await pg.inner_text('.pmark'), 'tagline under the logo')
        await pg.screenshot(path=OUT + 'y1_home.png')
        # المحرر: الشعار في القالب برقم الدفعة، ثم تبديل النسخة واللون وإخفاء الرقم
        await pg.goto(URL + '#/e/khartah/ann_panel'); await pg.wait_for_timeout(3000)
        await pg.evaluate("document.querySelectorAll('.coach,.gintro').forEach(x=>x.remove())")
        await pg.screenshot(path=OUT + 'y2_editor.png')
        await pg.click('#e_rail button[data-tab=colors]'); await pg.wait_for_timeout(1200)
        ok(await pg.evaluate("document.querySelectorAll('.lgopts .lgver').length") == 3, 'three logo shapes offered in colours panel')
        await pg.evaluate("document.querySelector('.lgopts').scrollIntoView()"); await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT + 'y3_panel.png')
        await pg.click('.lgopts .lgver:nth-child(3)'); await pg.wait_for_timeout(1000)
        ok(await pg.evaluate("S.lg && S.lg.v") == 'lg_khartah_word', 'picking a shape stores it in the design')
        await pg.evaluate("setLg('n','٥'); setLg('ncol','#c0392b'); changed6()"); await pg.wait_for_timeout(1000)
        await pg.evaluate("commitPage()")
        ok(await pg.evaluate("ED.doc.pages[0].lg.n") == '٥', 'batch number override saved in the page')
        await pg.screenshot(path=OUT + 'y4_variant.png')
        await pg.evaluate("setLg('show', false); setLg('col', '#bc914c'); changed6()"); await pg.wait_for_timeout(1000)
        await pg.screenshot(path=OUT + 'y5_nonum_gold.png')
        # طقم خارطة الثغور: لا يظهر إلا بعد تفعيله في البرنامج، وكل قوالبه تُرسم بلا خطأ
        ok(await pg.evaluate("visibleTpls().filter(t=>t.set==='omr').length") == 0, 'omr set hidden until enabled')
        await pg.evaluate("API6.me('prog_save', JSON.stringify({id:'omr', sets:['omr']}))"); await pg.evaluate("refreshBundle()"); await pg.wait_for_timeout(1500)
        n = await pg.evaluate("visibleTpls().filter(t=>t.set==='omr').length"); ok(n == 8, 'omr set visible after enabling: %d templates' % n)
        bad = await pg.evaluate("""(async()=>{ const T=trackOf('khartah'), bad=[]; for (const tpl of TEMPLATES.filter(t=>t.set==='omr')) for (const v of tpl.variants) for (const sz of tpl.sizes) { const c=document.createElement('canvas'); const errs=[]; const ce=console.error; console.error=function(){errs.push([].join.call(arguments,' '))}; try { renderTo(c,tpl,sz,{d:defaults(tpl,T),variant:v.id,k:1},T,0.3); } finally { console.error=ce; } if (errs.length) bad.push(tpl.id+'/'+v.id+'/'+sz+': '+errs[0].slice(0,80)); } return bad; })()""")
        ok(not bad, 'all omr templates render without errors ' + str(bad[:3]))
        await pg.evaluate("useProgram('academy')"); await pg.wait_for_timeout(2000)
        ok(await pg.evaluate("visibleTpls().filter(t=>t.set==='omr').length") == 0, 'academy gallery unchanged (no omr templates)')
        await pg.evaluate("useProgram('omr')"); await pg.wait_for_timeout(2000)
        # الهويات الأخرى بلا تغيير: لا قسم للشعار في هوية بلا نسخ ولا دفعة
        await pg.evaluate("ED.leaveOK=true"); await pg.evaluate("useProgram('academy')"); await pg.wait_for_timeout(2500)
        tid = await pg.evaluate("Object.keys(TRACKS).find(k => !hasLogoOpts(TRACKS[k]))")
        await pg.goto(URL + '#/e/%s/ann_panel' % tid); await pg.wait_for_timeout(2500)
        await pg.evaluate("document.querySelectorAll('.coach,.gintro').forEach(x=>x.remove())")
        await pg.click('#e_rail button[data-tab=colors]'); await pg.wait_for_timeout(800)
        ok(not await pg.evaluate("!!document.querySelector('.lgopts')"), 'identities without versions/batch show no new section (%s)' % tid)
        # الجوال
        await pg.evaluate("ED.leaveOK=true; useProgram('omr')"); await pg.wait_for_timeout(2000)
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        m = await ctx.new_page(); APP = URL.replace('index.html', 'app.html')
        await m.goto(APP); await m.evaluate("localStorage.clear()"); await m.goto(APP + '#/login'); await m.wait_for_timeout(1000)
        await m.evaluate("DEMO.reset()"); await m.evaluate("DEMO.seed(%s)" % THM); await m.wait_for_timeout(300)
        await m.fill('#lg_id', 'admin'); await m.fill('#lg_pw', 'Admin#2026'); await m.click('.lgform button[type=submit]')
        await m.wait_for_selector('.mtab:not([hidden])', timeout=60000); await m.wait_for_timeout(2000)
        await m.evaluate("closeModals()")
        await make_omr(m)
        await m.evaluate("useProgram('omr').then(()=>{go('#/'); render();})"); await m.wait_for_timeout(2500)
        await m.evaluate("closeModals()"); await m.wait_for_timeout(300)
        ok(await m.evaluate("!!document.querySelector('.pmark canvas')"), 'app home shows the programme logo')
        await m.screenshot(path=OUT + 'y6_app.png')
        print('ERRORS', [e for e in errs if '404' not in e][:5]); await b.close()
asyncio.run(main())
