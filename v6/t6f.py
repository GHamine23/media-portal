import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # جذر المستودع (يعمل في أي نسخة عمل)
"""اختبار المصمّم الذكي: الأسئلة المتكيّفة، والتصاميم الحرة، ودعه يبدع، وسجل الذكاء في الإدارة."""
import asyncio, sys, json
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT
from playwright.async_api import async_playwright
def ok(c, m): print(('✓ ' if c else '✗ ') + m)
async def clean(pg):
    for _ in range(3):
        if await pg.query_selector('.coach'): await pg.evaluate("document.querySelector('.coach').remove()")
        if await pg.query_selector('.modal'): await pg.keyboard.press('Escape'); await pg.wait_for_timeout(250)
MOCK = r'''window.DEMO_AI = function (body) {
  const b = JSON.parse(body); const sys = b.systemInstruction.parts[0].text;
  if (/تستخرج معلومات/.test(sys)) return JSON.stringify({ type: 'ann', audience: '', tone: '', size: '', title: 'بيوت *مطمئنة*', who: 'الشيخ خالد', time: 'بعد العشاء', place: 'مسجد الحي', date: '' });
  return JSON.stringify({ info: { title: 'بيوت *مطمئنة*', sub: 'لقاء أسري', who: 'الشيخ خالد', time: 'بعد العشاء', place: 'مسجد الحي', note: 'الدعوة عامة', badge: 'لقاء' },
    designs: [{ tpl: 'ann_panel', why: 'لوحة هادئة', fields: [{ k: 'title', v: 'بيوت *مطمئنة*' }] }, { tpl: 'ann_circle', why: 'دائرة', fields: [] }],
    free: [{ why: 'تخطيط مائل', layout: { bg: { kind: 'diagonal', role: 'paper', role2: 'pd', ratio: 0.5, pos: 'bottom' }, deco: [{ shape: 'petal', x: 0.15, y: 0.15, r: 0.06, role: 'a', alpha: 1 }], blocks: [{ k: 'logo', x: 0.7, y: 0.05, w: 0.24, h: 0.12, align: 'right' }, { k: 'badge', x: 0.07, y: 0.4, w: 0.4, h: 0.05, align: 'right', size: 0.03, fill: 'a' }, { k: 'title', x: 0.07, y: 0.56, w: 0.86, h: 0.2, align: 'right', size: 0.1 }, { k: 'sub', x: 0.07, y: 0.77, w: 0.86, h: 0.05, align: 'right', size: 0.036 }, { k: 'who', x: 0.07, y: 0.84, w: 0.6, h: 0.04, align: 'right', size: 0.032 }, { k: 'time', x: 0.07, y: 0.9, w: 0.42, h: 0.04, align: 'right', size: 0.03 }, { k: 'place', x: 0.5, y: 0.9, w: 0.42, h: 0.04, align: 'right', size: 0.03 }] } }],
    missing: ['التاريخ'] });
};'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        errs = await setup(pg)
        # بلا مساعد: أسئلة متكيّفة من القواعد المحلية
        await pg.goto(URL + '#/make'); await pg.wait_for_timeout(1200); await clean(pg)
        await pg.fill('#mk_text', 'لقاء أسري بعنوان «بيوت مطمئنة» يقدمه الشيخ خالد مساء الخميس 8:00 في مسجد الحي'); await pg.click('.mkform .btn.dark'); await pg.wait_for_timeout(1500)
        q = await pg.inner_text('.mkwiz h2')
        ok('لمن' in q, 'local intake skips type (known) and asks audience: ' + q)
        known = await pg.inner_text('.mkknown')
        ok('المقدّم: الشيخ خالد' in known and 'النوع' in known, 'known chips from the idea: ' + known.replace('\n', ' '))
        await pg.screenshot(path=OUT + 'k1_ask.png')
        await pg.click('.chips .chip:nth-child(1)'); await pg.wait_for_timeout(400)   # الجمهور
        await pg.click('.chips .chip:nth-child(2)'); await pg.wait_for_timeout(400)   # النبرة
        await pg.click('.chips .chip:nth-child(1)'); await pg.wait_for_timeout(3000)  # المقاس → توليد
        n = await pg.evaluate("document.querySelectorAll('.tgrid .tcard6').length"); fr = await pg.evaluate("document.querySelectorAll('.tgrid .pill.pu').length")
        ok(n >= 8 and fr >= 3, 'local results: %d designs incl. %d free layouts' % (n, fr))
        await pg.screenshot(path=OUT + 'k2_results.png', full_page=True)
        await pg.click('.tgrid .tcard6'); await pg.wait_for_timeout(3000); await clean(pg)
        ok(await pg.evaluate("S.tpl.id") == 'ai_free' and await pg.evaluate("S.d.who") == 'الشيخ خالد', 'free design opens in editor with texts')
        ok(await pg.evaluate("Object.keys(LASTG).length") >= 5, 'free design elements are editable groups: ' + await pg.evaluate("Object.keys(LASTG).join(',')"))
        await pg.screenshot(path=OUT + 'k3_free_editor.png')
        # بالمساعد (محاكى)
        await pg.evaluate("GAS._props.GEMINI_KEY='k-demo-AIzaSy0123456789abcdefghijklmnop'; " + MOCK + "; void 0"); await pg.evaluate("refreshBundle()"); await pg.wait_for_timeout(1500)
        await pg.goto(URL + '#/make?new=1'); await pg.wait_for_timeout(1000); await clean(pg)
        await pg.fill('#mk_text', 'لقاء أسري عن البيوت المطمئنة'); await pg.click('.mkform .btn.dark'); await pg.wait_for_timeout(2500)
        q = await pg.inner_text('.mkwiz h2'); ok('لمن' in q, 'AI intake: type known from AI, asks audience: ' + q)
        await pg.click('.mkctl .btn.ghost:nth-of-type(1)') if False else None
        for _ in range(4):
            if await pg.query_selector('.mkwiz'): await pg.click('.mkctl .btn.dark'); await pg.wait_for_timeout(700)
        await pg.wait_for_timeout(3000)
        n = await pg.evaluate("document.querySelectorAll('.tgrid .tcard6').length"); txt = await pg.inner_text('#mkbody')
        ok(n >= 3 and 'التاريخ' in txt, 'AI results with free layout + missing info: %d' % n)
        await pg.screenshot(path=OUT + 'k4_ai_results.png', full_page=True)
        # دعه يبدع: ثلاثة اتجاهات
        await pg.goto(URL + '#/make?creative=1'); await pg.wait_for_timeout(1000); await clean(pg)
        await pg.click('.mkform .btn.line.lg'); await pg.wait_for_timeout(2500)
        if await pg.query_selector('.mkwiz'): await pg.click('.chips .chip:nth-child(1)'); await pg.wait_for_timeout(4000)
        ok(await pg.evaluate("document.querySelectorAll('.mkres-h .seg button').length") == 3, 'creative mode shows three directions')
        await pg.screenshot(path=OUT + 'k5_creative.png')
        # سجل الذكاء
        await pg.goto(URL + '#/admin/ai'); await pg.wait_for_timeout(2500)
        t = await pg.inner_text('#abody')
        ok('فهم الفكرة' in t and 'اقتراح تصاميم' in t, 'admin AI log shows kinds')
        await pg.screenshot(path=OUT + 'k6_ai_admin.png', full_page=True)
        print('ERRORS', [e for e in errs if '404' not in e][:8])
        await b.close()
asyncio.run(main())
