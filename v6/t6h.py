"""اختبار الشرائح: العرض الحي (انتقالات، ظهور تدريجي، سؤال، مؤقّت، ملاحظات)، ووسائط الشريحة، ومن درس إلى عرض بالذكاء."""
import asyncio, sys, json
sys.path.insert(0, '/home/claude/media-portal/v6')
from t6 import setup, URL, OUT
from playwright.async_api import async_playwright
def ok(c, m): print(('✓ ' if c else '✗ ') + m)
async def clean(pg):
    for _ in range(3):
        if await pg.query_selector('.coach'): await pg.evaluate("document.querySelector('.coach').remove()")
        if await pg.query_selector('.modal'): await pg.keyboard.press('Escape'); await pg.wait_for_timeout(250)
MOCK = r'''window.DEMO_AI = function (body) {
  const b = JSON.parse(body); const sys = b.systemInstruction.parts[0].text;
  if (/مخطط عرض شرائح/.test(sys)) return JSON.stringify({ title: 'بر الوالدين', sub: 'من مقرر الأسبوع', sections: [
    { title: 'مكانة الوالدين', points: ['قرن الله برهما بتوحيده', 'الإحسان إليهما في الكبر آكد'], quote: 'وقضى ربك ألا تعبدوا إلا إياه وبالوالدين إحسانا', quoteBy: 'الإسراء ٢٣' },
    { title: 'صور البر', points: ['الكلمة الطيبة', 'طاعتهما في المعروف', 'الدعاء لهما'] },
    { title: 'ثمرات البر', points: ['رضا الله', 'بركة العمر والرزق'] }],
    questions: [{ q: 'أي الأعمال أحب إلى الله بعد الصلاة على وقتها؟', options: ['الجهاد', 'بر الوالدين', 'الصدقة', 'الصيام'], answer: 2 }], closing: 'اللهم اغفر لنا ولوالدينا' });
  return '{}';
};'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        errs = await setup(pg)
        await pg.evaluate("GAS._props.GEMINI_KEY='k'; " + MOCK + "; void 0"); await pg.evaluate("refreshBundle()"); await pg.wait_for_timeout(1500)
        # صفحة الشرائح: بطاقة الدرس والميزات
        await pg.goto(URL + '#/s/ithmar'); await pg.wait_for_timeout(1500); await clean(pg)
        t = await pg.inner_text('.page')
        ok('من درس إلى عرض بالذكاء' in t and 'في العرض الحي' in t, 'slides page shows lesson card + live features')
        await pg.screenshot(path=OUT + 'n1_slides_page.png')
        # من درس إلى مخطط إلى شرائح
        await pg.fill('.card textarea[placeholder^="الصق نص الدرس"]', 'درس عن بر الوالدين: مكانتهما وصور البر وثمراته…')
        await pg.click('button:has-text("رتّبه عرضاً")'); await pg.wait_for_timeout(2500)
        m = await pg.evaluate("document.querySelector('.modal h3').textContent + '|' + [...document.querySelectorAll('.modal .osec input[type=text]')].map(i=>i.value).join('|') + '|' + document.querySelector('.modal').innerText")
        ok('مخطط العرض' in m and 'مكانة الوالدين' in m and 'سؤال' in m, 'outline dialog with sections + question')
        await pg.screenshot(path=OUT + 'n2_outline.png')
        # عطّل قسماً ثم ابنِ
        await pg.click('.osec:nth-of-type(3) input[type=checkbox]'); await pg.click('.modal .acts .btn.dark'); await pg.wait_for_timeout(3000); await clean(pg)
        n = await pg.evaluate("ED.doc.pages.length"); tpls = await pg.evaluate("ED.doc.pages.map(p=>p.tpl)")
        ok(await pg.evaluate("ED.doc.kind") == 'deck' and n == 8 and 'sl_quiz' in tpls and 'sl_quote' in tpls, 'deck built from outline (%d slides): %s' % (n, ','.join(tpls)))
        await pg.screenshot(path=OUT + 'n3_deck.png')
        # لوحة العناصر: قسم الوسائط للعرض
        await pg.evaluate("openTab('els'); void 0"); await pg.wait_for_timeout(600)
        pt = await pg.inner_text('#e_panel')
        ok('وسائط للعرض الحي' in pt and 'رابط يوتيوب' in pt, 'media section in elements panel')
        # رابط يوتيوب → طبقة yt
        await pg.evaluate("window.__pt = promptText; window.promptText = (function () { let n = 0; return async function () { n++; return n === 1 ? 'https://youtu.be/dQw4w9WgXcQ' : 'مقطع الدرس'; }; })(); void 0")
        await pg.click('#e_panel button:has-text("رابط يوتيوب")'); await pg.wait_for_timeout(800)
        L = await pg.evaluate("(S.layers||[]).filter(l=>l.t==='yt')")
        ok(len(L) == 1 and 'dQw4w9WgXcQ' in L[0]['url'] and L[0]['title'] == 'مقطع الدرس', 'youtube layer added: ' + json.dumps(L, ensure_ascii=False)[:90])
        await pg.evaluate("window.promptText = window.__pt; void 0")
        await pg.screenshot(path=OUT + 'n4_yt_layer.png')
        # إعدادات الشريحة: الظهور التدريجي والملاحظات والانتقال (الشريحة ٤: نقاط)
        await pg.evaluate("commitPage(); loadPage(3); afterPages(); void 0"); await pg.wait_for_timeout(500)
        await pg.click('#e_pages .ib'); await pg.wait_for_timeout(400)
        await pg.click('.menu button:has-text("الظهور التدريجي")')
        await pg.wait_for_timeout(600)
        chips = await pg.evaluate("[...document.querySelectorAll('.modal .chip')].map(c=>c.textContent)")
        ok(len(chips) >= 2, 'step chips offered: ' + ','.join(chips))
        await pg.click('.modal .chip:has-text("النقاط")') if 'النقاط' in ''.join(chips) else await pg.click('.modal .chip')
        await pg.fill('.modal textarea', 'اذكر قصة أويس القرني هنا')
        await pg.click('.modal .seg button:has-text("تكبير")'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT + 'n5_slide_settings.png')
        await pg.click('.modal .acts .btn.dark'); await pg.wait_for_timeout(500)
        pg4 = await pg.evaluate("ED.doc.pages[3]")
        ok(len(pg4.get('steps', [])) == 1 and pg4.get('notes', '').startswith('اذكر') and pg4.get('trans') == 'zoom', 'slide settings saved: ' + json.dumps({k: pg4.get(k) for k in ('steps', 'notes', 'trans')}, ensure_ascii=False))
        # العرض الحي
        await pg.evaluate("present6(); void 0"); await pg.wait_for_timeout(900)
        ok(await pg.query_selector('.present6 .pstage canvas') is not None and await pg.query_selector('.present6 .pbar') is not None, 'presenter opened with stage + bar')
        await pg.evaluate("document.querySelector('.present6').classList.add('awake'); void 0")
        await pg.screenshot(path=OUT + 'n6_present.png')
        # الشريحة ٤ (عند الفتح من المحرر يبدأ من الحالية = ٤): خطوة واحدة
        c0 = await pg.inner_text('.pcount'); ok('4 / 8' in c0 and '0/1' in c0, 'starts at current slide with step counter: ' + c0)
        await pg.keyboard.press('ArrowLeft'); await pg.wait_for_timeout(500)
        c1 = await pg.inner_text('.pcount'); ok('4 / 8' in c1 and '1/1' in c1, 'first click reveals the step, stays on slide: ' + c1)
        await pg.keyboard.press('ArrowLeft'); await pg.wait_for_timeout(700)
        ok('5 / 8' in await pg.inner_text('.pcount'), 'then advances to next slide')
        # شريحة السؤال: الجواب بنقرة
        qi = tpls.index('sl_quiz')
        await pg.evaluate("void 0"); await pg.keyboard.press('End'); await pg.wait_for_timeout(500); await pg.keyboard.press('ArrowRight'); await pg.wait_for_timeout(500)
        cq = await pg.inner_text('.pcount'); ok(('%d / 8' % (qi + 1)) in cq and '0/1' in cq, 'quiz slide has an answer step: ' + cq)
        before = await pg.evaluate("document.querySelector('.pstage canvas').toDataURL().length")
        await pg.keyboard.press('ArrowLeft'); await pg.wait_for_timeout(600)
        after = await pg.evaluate("document.querySelector('.pstage canvas').toDataURL().length")
        ok(before != after and '1/1' in await pg.inner_text('.pcount'), 'answer revealed on click')
        await pg.screenshot(path=OUT + 'n7_quiz_reveal.png')
        # الملاحظات والمؤقّت
        await pg.keyboard.press('Home'); await pg.wait_for_timeout(400)
        await pg.keyboard.press('n'); await pg.wait_for_timeout(400)
        ok(await pg.evaluate("!document.querySelector('.pnotes').hidden"), 'notes panel toggles with N')
        await pg.keyboard.press('t'); await pg.wait_for_timeout(400); await pg.fill('.modal input[type=number]', '1'); await pg.click('.modal .acts .btn.dark'); await pg.wait_for_timeout(1300)
        tm = await pg.inner_text('.ptimer'); ok(tm.startswith('0:5'), 'timer counting: ' + tm)
        await pg.screenshot(path=OUT + 'n8_notes_timer.png')
        # الوسائط: بطاقة يوتيوب (على الغلاف) تظهر رابطاً فوق مكانها
        href = await pg.evaluate("(document.querySelector('.pmedia .pmyt')||{}).href||''")
        ok('youtube.com/watch?v=dQw4w9WgXcQ' in href, 'youtube overlay link placed over the card: ' + href)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        ok(await pg.query_selector('.present6') is None, 'presenter closes')
        # الحفظ يحفظ الخطوات والملاحظات
        await pg.evaluate("saveDialog(); void 0"); await pg.wait_for_timeout(500)
        await pg.fill('.modal input[type=text]', 'عرض بر الوالدين'); await pg.click('.modal .acts .btn.dark'); await pg.wait_for_timeout(2500); await clean(pg)
        saved = await pg.evaluate("(async()=>{const l=await API6.me('item_list');const it=l.find(i=>i.name==='عرض بر الوالدين');return await API6.me('item_get',it.id);})()")
        pages = saved.get('pages')
        ok(pages and pages[3].get('notes', '').startswith('اذكر') and pages[3].get('steps'), 'saved item keeps steps + notes')
        print('ERRORS', [e for e in errs if '404' not in e][:8])
        await b.close()
asyncio.run(main())
