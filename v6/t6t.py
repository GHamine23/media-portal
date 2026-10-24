import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # جذر المستودع (يعمل في أي نسخة عمل)
"""اختبار المصمّم الذكي الجديد: طلب واحد بمخطط صارم، مراحل الانتظار، الترتيب و«الأنسب»، تنظيف النصوص وحدودها، إخفاء العناوين العامة،
الأنماط الحرة المدروسة، تعديل اقتراح واحد (أقصر/عنوان آخر/بكلماتك)، دعه يبدع باتجاهات في طلب واحد، إعدادات المساعدين واختبارها، والجوال."""
import asyncio, sys, json
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT, THM
from playwright.async_api import async_playwright
def ok(c, m): print(('✓ ' if c else '✗ ') + m)
APP = URL.replace('index.html', 'app.html')
# نموذج مقلّد يفهم صيغتي Gemini وOpenAI، ويعدّ الطلبات بأنواعها
MOCK = r'''window.AI_N = {}; window.DEMO_AI = function (body) {
  const b = JSON.parse(body), sys = b.systemInstruction ? b.systemInstruction.parts[0].text : b.messages[0].content, prm = b.contents ? b.contents[0].parts[0].text : b.messages[1].content;
  const kind = /تستخرج معلومات/.test(sys) ? 'intake' : /محرر إعلانات/.test(sys) ? 'refine' : /مدير إبداعي/.test(sys) ? (/دعه يبدع/.test(sys) ? 'creative' : 'design') : /أجب بـ JSON/.test(sys) ? 'test' : 'other';
  AI_N[kind] = (AI_N[kind] || 0) + 1; window.AI_LAST = { kind: kind, sys: sys, prompt: prm, cfg: b.generationConfig };
  if (kind === 'test') return '{"ok":"تم"}';
  if (kind === 'intake') return JSON.stringify({ type: 'ann', audience: 'parents', tone: 'warm', size: 'post', title: '', who: 'الشيخ خالد', time: 'الخميس بعد العشاء', place: 'مسجد الحي', date: '' });
  if (kind === 'refine') { const f = JSON.parse(prm.split('\n')[0].replace('النصوص: ', '')); return JSON.stringify({ fields: f.map(function (x) { return { k: x.k, v: x.k === 'title' ? 'بيوت *تُصغي*' : x.v }; }) }); }
  const dir = kind === 'creative';
  return JSON.stringify({ understanding: 'لقاء أسري لأولياء الأمور عن الحوار مع الأبناء، بنبرة دافئة.',
    info: { title: '«بيوتٌ *مطمئنة*»', sub: 'لقاء أسري في فن الحوار مع الأبناء وبناء الثقة داخل البيت المسلم المعاصر بخطوات عملية 🌿', kind: 'لقاء أسري', who: 'الشيخ خالد', time: 'الخميس بعد العشاء', place: 'مسجد الحي', badge: 'لقاء أسري', note: '', body: '' },
    titles: ['بيوتٌ *تُصغي*', 'حوارٌ *يبني*', 'كلمة *تجمعنا*'],
    designs: [
      { tpl: 'ann_circle', score: 7, why: 'دائرة تبرز الموعد', mood: 'brand', fields: [{ k: 'title', v: 'بيوتٌ *مطمئنة*' }], dir: dir ? 'bold' : null },
      { tpl: 'ann_panel', score: 9.5, why: 'لوحة هادئة دافئة', mood: 'dark', variant: 'brown', fields: [{ k: 'title', v: 'بيوتٌ *مطمئنة* في زمن الضجيج والسرعة والانشغال الدائم 😊😊' }, { k: 'who', v: 'الشيخ خالد' }], dir: dir ? 'calm' : null },
      { tpl: 'ann_cards', score: 8, why: 'بطاقات مرتبة', mood: 'light', fields: [{ k: 'title', v: 'بيوتٌ *مطمئنة*' }], dir: dir ? 'classic' : null },
      { tpl: 'nope_tpl', score: 10, why: 'غير موجود', fields: [] }],
    free: [{ arch: 'hero', dark: 'pd', light: 'paper', deco: 'star8', pattern: 'girih', score: 9, why: 'عنوان ضخم على خلفية داكنة', dir: dir ? 'bold' : null },
      { arch: 'photo', dark: 'teal', light: 'warm', deco: 'crescent', pattern: 'none', photo: 'img_dome', score: 8.5, why: 'صورة القبة بطبقة ليلية', dir: dir ? 'calm' : null },
      { arch: 'frame', dark: 'sd', light: 'warm', deco: 'petal', score: 6, why: 'إطار وقور', dir: dir ? 'classic' : null }],
    missing: ['تاريخ اللقاء'] });
};'''
async def gen(pg, idea, creative=False):
    await pg.goto(URL + ('#/make?creative=1' if creative else '#/make?new=1')); await pg.wait_for_timeout(1000)
    await pg.fill('#mk_text', idea)
    await pg.click('.mkform .btn.line.lg' if creative else '.mkform .btn.dark'); await pg.wait_for_timeout(1500)
    for _ in range(5):
        if await pg.query_selector('.mkwiz'): await pg.click('.mkctl .btn.dark'); await pg.wait_for_timeout(500)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        errs = await setup(pg)
        await pg.evaluate("GAS._props.GEMINI_KEY='k-demo-AIzaSy0123456789abcdefghijklmnop'; " + MOCK + "; void 0"); await pg.evaluate("refreshBundle()"); await pg.wait_for_timeout(1500)
        # ١) مراحل الانتظار: نبطئ طلب التصميم لنرى المراحل
        await pg.evaluate("""(function(){ const o = API6.call; API6.call = function (fn, tok, js) { const a = arguments; if (fn === 'ai_make' && /"kind":"design"/.test(js || '')) return new Promise(function (r) { setTimeout(r, 2500); }).then(function () { return o.apply(API6, a); }); return o.apply(API6, a); }; })(); void 0""")
        await gen(pg, 'لقاء لأولياء الأمور عن الحوار مع الأبناء يقدمه الشيخ خالد الخميس بعد العشاء في مسجد الحي')
        await pg.wait_for_timeout(300)
        st = await pg.evaluate("Array.from(document.querySelectorAll('.mksteps li')).map(function(l){return l.className})")
        ok(st == ['done', 'now', ''], 'progress steps: understood ✓, writing (spinner), drawing: ' + str(st))
        await pg.screenshot(path=OUT + 't1_wait.png')
        await pg.wait_for_selector('.tgrid .tcard6', timeout=20000); await pg.wait_for_timeout(1500)
        ok(await pg.evaluate("AI_LAST.cfg.thinkingConfig && AI_LAST.cfg.thinkingConfig.thinkingLevel") == 'low' and await pg.evaluate("AI_LAST.cfg.responseSchema.properties.designs.items.properties.tpl.enum.indexOf('ann_panel') >= 0"), 'design request: strict schema with template enum, low thinking')
        ok(await pg.evaluate("/≤34/.test(AI_LAST.sys) && /كاتب الإعلانات/.test(AI_LAST.sys) && /أدوار ألوان الهوية/.test(AI_LAST.sys) && /الأنماط الحرة/.test(AI_LAST.sys)"), 'prompt carries field limits, copy skill, identity colours, free patterns')
        ok(await pg.evaluate("AI_N.design") == 1 and await pg.evaluate("AI_N.intake") == 1, 'one intake + one design request (was up to 3)')
        # ٢) الترتيب و«الأنسب» والفهم
        first = await pg.evaluate("MK.results[0].designs[0].tpl")
        ok(first == 'ann_panel' and await pg.query_selector('.tgrid .tcard6:first-child .mkbest') is not None, 'ranked by score, best badge on first: ' + first)
        ok('فهم المساعد' in await pg.inner_text('.mkgot'), 'understanding shown')
        ok('تاريخ اللقاء' in await pg.inner_text('#mkbody'), 'missing info shown')
        ok(await pg.evaluate("MK.results[0].designs.every(function(d){return d.tpl !== 'nope_tpl'})"), 'unknown template dropped')
        # ٣) النصوص: بلا رموز تعبيرية ولا علامات «»، وضمن حد كل خانة، والتمييز سليم
        chk = await pg.evaluate("""(function(){ const bad = []; MK.results[0].designs.forEach(function (d) { const t = TEMPLATES.find(function (x) { return x.id === d.tpl; }); t.fields.forEach(function (f) { const v = d.page.d[f.k]; if (typeof v !== 'string' || (d.page.hide||{})['f_' + f.k]) return; if (/\\p{Extended_Pictographic}/u.test(v)) bad.push(d.tpl + ':' + f.k + ' emoji'); if (f.max && v.replace(/\\*/g, '').length > f.max * 1.1) bad.push(d.tpl + ':' + f.k + ' long ' + v); if ((v.match(/\\*/g) || []).length % 2) bad.push(d.tpl + ':' + f.k + ' stars'); if (/^«/.test(v)) bad.push(d.tpl + ':' + f.k + ' quotes'); }); }); return bad; })()""")
        ok(not chk, 'texts cleaned and within limits: ' + str(chk[:4]))
        pt = await pg.evaluate("MK.results[0].designs.find(function(d){return d.tpl==='ann_panel'}).page")
        ok(pt['variant'] == 'brown' and pt['d']['title'].startswith('بيوتٌ *مطمئنة*') and len(pt['d']['title'].replace('*', '')) <= 37, 'variant applied; overlong title shortened at a word: ' + pt['d']['title'])
        vis = await pg.evaluate("MK.results[0].designs.filter(function(d){return Object.keys(d.page.ph||{}).some(function(k){return /^(kicker|chip|top|badge|note|sub|tag)$/.test(k) && d.page.ph[k]===d.page.d[k] && !(d.page.hide||{})['f_'+k]})}).map(function(d){return d.tpl})")
        ok(not vis, 'no visible generic placeholder in optional fields: ' + str(vis))
        fr = await pg.evaluate("MK.results[0].designs.filter(function(d){return d.free}).map(function(d){return JSON.parse(d.page.d.layout).bg.kind + '/' + (d.page.d.photo||'')})")
        ok(len(fr) == 3 and 'solid/' in fr and any(x.startswith('photo/') for x in fr), 'free designs from curated patterns: ' + str(fr))
        ok(await pg.evaluate("(function(){ const d = MK.results[0].designs.find(function(d){return d.free && JSON.parse(d.page.d.layout).bg.kind==='solid'}); return JSON.parse(d.page.d.layout).bg.pattern; })()") == 'girih', 'pattern from AI applied to hero')
        await pg.screenshot(path=OUT + 't2_results.png', full_page=True)
        await pg.evaluate("window.scrollTo(0, 0)"); await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT + 't2b_results_top.png')
        # ٤) تعديل اقتراح واحد: «عنوان آخر» من البدائل دون طلب، ثم «أقصر» بطلب واحد
        n0 = await pg.evaluate("AI_N.refine || 0")
        await pg.click('.tgrid .tcard6:first-child .mkfix'); await pg.wait_for_timeout(300)
        ok(await pg.query_selector('.menu') is not None and 'عنوان آخر' in await pg.inner_text('.menu'), 'refine menu opens')
        await pg.screenshot(path=OUT + 't3_refine_menu.png')
        await pg.click('.menu button:nth-child(5)'); await pg.wait_for_timeout(900)
        t1 = await pg.evaluate("MK.results[0].designs[0].page.d.title")
        ok(t1 == 'بيوتٌ *تُصغي*' and (await pg.evaluate("AI_N.refine || 0")) == n0, 'another title from alternatives, no AI call: ' + t1)
        await pg.click('.tgrid .tcard6:first-child .mkfix'); await pg.wait_for_timeout(300)
        await pg.click('.menu button:nth-child(5)'); await pg.wait_for_timeout(900)
        ok(await pg.evaluate("MK.results[0].designs[0].page.d.title") == 'حوارٌ *يبني*', 'next alternative title')
        await pg.click('.tgrid .tcard6:nth-child(2) .mkfix'); await pg.wait_for_timeout(300)
        await pg.click('.menu button:nth-child(1)'); await pg.wait_for_timeout(1500)
        ok((await pg.evaluate("AI_N.refine")) == n0 + 1 and await pg.evaluate("AI_LAST.kind") == 'refine' and 'أقصر' not in await pg.evaluate("AI_LAST.prompt") and 'اختصر' in await pg.evaluate("AI_LAST.prompt"), 'shorter → one refine request for that card only')
        ok(await pg.evaluate("MK.results[0].designs[1].page.d.title") == 'بيوت *تُصغي*', 'refined text applied to the card')
        ok(await pg.evaluate("JSON.parse(sessionStorage.getItem('mk_last')).results[0].designs[1].page.d.title") == 'بيوت *تُصغي*', 'refinement kept when coming back')
        await pg.click('.tgrid .tcard6:nth-child(3) .mkfix'); await pg.wait_for_timeout(300)
        await pg.click('.menu button:last-child'); await pg.wait_for_timeout(400)
        await pg.fill('.modal input', 'اجعل العنوان سؤالاً'); await pg.screenshot(path=OUT + 't4_refine_own.png')
        await pg.click('.modal .btn.dark'); await pg.wait_for_timeout(1500)
        ok('اجعل العنوان سؤالاً' in await pg.evaluate("AI_LAST.prompt"), 'own-words refinement sent')
        # ٥) فتح تصميم حر في المحرر
        idx = await pg.evaluate("MK.results[0].designs.findIndex(function(d){return d.free})")
        await pg.click('.tgrid .tcard6:nth-child(%d) .tthumb' % (idx + 1)); await pg.wait_for_timeout(3000)
        ok(await pg.evaluate("S.tpl.id") == 'ai_free' and '*' in await pg.evaluate("S.d.title"), 'free design opens in editor')
        await pg.screenshot(path=OUT + 't5_editor.png')
        await pg.evaluate("ED.leaveOK=true")
        # ٦) «اقتراحات أخرى» يطلب تجنّب العناوين السابقة
        await pg.goto(URL + '#/make'); await pg.wait_for_timeout(1500)
        await pg.click('.mkres-h .btn.dark'); await pg.wait_for_selector('.tgrid .tcard6', timeout=20000); await pg.wait_for_timeout(800)
        ok('لا تكرر هذه العناوين' in await pg.evaluate("AI_LAST.sys"), 'more suggestions avoid previous titles')
        # ٧) دعه يبدع: ثلاثة اتجاهات من طلب واحد
        nd = await pg.evaluate("AI_N.creative || 0")
        await gen(pg, 'لقاء أسري عن الحوار', True)
        await pg.wait_for_selector('.tgrid .tcard6', timeout=20000); await pg.wait_for_timeout(800)
        ok(await pg.evaluate("AI_N.creative") == nd + 1 and await pg.evaluate("document.querySelectorAll('.mkres-h .seg button').length") == 3, 'creative: three directions from ONE request')
        dirs = await pg.evaluate("MK.results.map(function(r){return r.designs.map(function(d){return d.tpl}).join(',')})")
        ok('ann_panel' in dirs[0] and 'ann_circle' not in dirs[0] and 'ann_circle' in dirs[1] and 'ann_cards' in dirs[2], 'designs grouped by direction: ' + str(dirs))
        await pg.screenshot(path=OUT + 't6_creative.png')
        # ٨) إعدادات المساعدين
        await pg.goto(URL + '#/admin/settings'); await pg.wait_for_timeout(2500)
        t = await pg.inner_text('#abody')
        ok('المساعدون الإضافيون' in t and 'Cloudflare' in t and 'تعديل اقتراح' in t, 'settings: extra providers card with Cloudflare and new task routes')
        btn = await pg.query_selector('button:has-text("اختبر المساعدين")'); await btn.click(); await pg.wait_for_timeout(2500)
        rows = await pg.evaluate("Array.from(document.querySelectorAll('.aitrow')).map(function(r){return r.className + ' ' + r.textContent})")
        ok(len(rows) == 4 and 'ok' in rows[0] and 'off' in rows[1], 'provider test rows: ' + ' | '.join(rows))
        card = await pg.query_selector('.card:has(.aih)'); await card.scroll_into_view_if_needed(); await card.screenshot(path=OUT + 't7_settings.png')
        print('ERRORS', [e for e in errs if '404' not in e][:8])
        # ٩) الجوال (التطبيق ٣٩٠)
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        m = await ctx.new_page(); merrs = []
        m.on('pageerror', lambda e: merrs.append('PAGEERR ' + str(e)))
        await m.goto(APP); await m.evaluate("localStorage.clear()"); await m.goto(APP + '#/login'); await m.wait_for_timeout(1000)
        await m.evaluate("DEMO.reset()"); await m.evaluate("DEMO.seed(%s)" % THM); await m.wait_for_timeout(300)
        await m.fill('#lg_id', 'admin'); await m.fill('#lg_pw', 'Admin#2026'); await m.click('.lgform button[type=submit]')
        await m.wait_for_selector('.mtab:not([hidden])', timeout=60000); await m.wait_for_timeout(2000)
        await m.evaluate("typeof closeModals==='function' && closeModals(); GAS._props.GEMINI_KEY='k-demo-AIzaSy0123456789abcdefghijklmnop'; " + MOCK + "; void 0"); await m.evaluate("refreshBundle()"); await m.wait_for_timeout(1500)
        await m.goto(APP + '#/make?new=1'); await m.wait_for_timeout(1200)
        await m.fill('#mk_text', 'لقاء لأولياء الأمور عن الحوار مع الأبناء'); await m.click('.mkform .btn.dark'); await m.wait_for_timeout(1500)
        for _ in range(5):
            if await m.query_selector('.mkwiz'): await m.click('.mkctl .btn.dark'); await m.wait_for_timeout(500)
        await m.wait_for_selector('.tgrid .tcard6', timeout=20000); await m.wait_for_timeout(1500)
        w = await m.evaluate("document.documentElement.scrollWidth")
        ok(w <= 391, 'app: no horizontal scroll on results (%d)' % w)
        await m.screenshot(path=OUT + 't8_app_results.png')
        await m.click('.tgrid .tcard6:first-child .mkfix'); await m.wait_for_timeout(600)
        ok(await m.evaluate("!!document.querySelector('.mact, .menu')"), 'app: refine opens as action sheet')
        await m.screenshot(path=OUT + 't9_app_refine.png')
        print('APP ERRORS', merrs[:5])
        await b.close()
asyncio.run(main())
