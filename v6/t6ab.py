import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
"""التلاوة في العروض: زر يُسمِع الآيات بصوت قارئ مختار، مع التكرار وتغيير القارئ أثناء العرض."""
import asyncio, sys, json, io, wave
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT
from playwright.async_api import async_playwright
def ok(c, m): print(('✓ ' if c else '✗ ') + m, flush=True)
def silent():
    b = io.BytesIO(); w = wave.open(b, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(8000); w.writeframes(b'\0\0' * 80000); w.close(); return b.getvalue()
WAV = silent()
NAMES = {112: 'سُورَةُ الإخلاص'}
async def audio_route(route):
    await route.fulfill(status=200, body=WAV, headers={'Content-Type': 'audio/wav', 'Access-Control-Allow-Origin': '*'})
async def quran_route(route):
    u = route.request.url
    if '/surah/' in u and 'offset' in u:
        a = int(u.split('offset=')[1].split('&')[0]) + 1; n2 = a + int(u.split('limit=')[1].split('&')[0])
        data = {'ayahs': [{'numberInSurah': k, 'text': ('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ' if k == 1 else '') + 'قُلْ هُوَ ٱللَّهُ أَحَدٌ'} for k in range(a, n2)]}
        await route.fulfill(status=200, body=json.dumps({'code': 200, 'data': data}), headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}); return
    if u.endswith('/surah'): data = [{'number': 112, 'name': NAMES[112], 'numberOfAyahs': 4}]
    else:
        ref = u.split('/ayah/')[1].split('/')[0]; s, n = map(int, ref.split(':'))
        data = {'text': ('ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ ' if 'uthmani' in u else 'نص الآية ') + str(n), 'surah': {'name': NAMES.get(s, 'سُورَةُ'), 'number': s}, 'numberInSurah': n}
    await route.fulfill(status=200, body=json.dumps({'code': 200, 'data': data}), headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'})
async def clean(pg):
    for _ in range(3):
        await pg.evaluate("document.querySelectorAll('.coach,.gintro').forEach(x=>x.remove())")
        if await pg.query_selector('.modal'): await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        errs = await setup(pg)
        await pg.route('**/everyayah.com/**', audio_route)
        await pg.route('**/api.alquran.cloud/**', quran_route)
        await pg.goto(URL + '#/s/ithmar'); await pg.wait_for_timeout(1500)
        await pg.evaluate("openDeckNew('ithmar', sampleDecks(trackOf('ithmar'))[1].slides, 'عرض التلاوة')"); await pg.wait_for_timeout(2500); await clean(pg)
        # اللوحة: بطاقة التلاوة في قسم الوسائط
        await pg.evaluate("openTab('imgs')"); await pg.wait_for_timeout(600)
        ok(await pg.evaluate("!!document.querySelector('.mdtile.tl')"), 'recitation tile in the media section')
        await pg.click('.mdtile.tl'); await pg.wait_for_timeout(500)
        ok(await pg.evaluate("document.querySelectorAll('.modal select')[1].options.length") == 15, 'fifteen reciters to choose from')
        await pg.select_option('.modal select >> nth=0', '112'); await pg.wait_for_timeout(200)
        await pg.fill('.tlrange label:nth-child(2) input', '4'); await pg.dispatch_event('.tlrange label:nth-child(2) input', 'change')
        await pg.select_option('.modal select >> nth=1', 'afasy')
        await pg.click('.modal .tseg button:has-text("مرتان")')
        info = await pg.inner_text('.tlinfo')
        ok('الإخلاص' in info and '٤ آيات' in info, 'range summary: ' + info)
        await pg.screenshot(path=OUT + 'ab1_dialog.png')
        await pg.click('.modal .acts .btn.dark'); await pg.wait_for_timeout(1500)
        L = await pg.evaluate("S.layers.find(l=>l.qr)")
        ok(L and L['qr'] == {'s': 112, 'a': 1, 'b': 4, 'r': 'afasy', 'rep': 2} and L['title'] == 'استمع: الإخلاص ١–٤', 'recitation layer saved: ' + str(L and (L['qr'], L['title'])))
        txt = await pg.evaluate("(S.layers.find(l=>l.t==='text')||{}).txt || Object.values(S.d).find(v=>typeof v==='string' && v.indexOf('﴿')>=0) || ''")
        ok('﴿' in txt and '۝٤' in txt and 'الإخلاص' in txt, 'verse text added with numbers: ' + txt[:60])
        # إعدادات العنصر
        await pg.evaluate("openElPanel('L:' + S.layers.find(l=>l.qr).id)"); await pg.wait_for_timeout(600)
        t = await pg.inner_text('#e_panel')
        ok('التلاوة' in t and 'الآيات والقارئ' in t and 'تكرار كل آية' in t, 'element settings for the recitation')
        await pg.screenshot(path=OUT + 'ab2_settings.png')
        # العرض الحي
        await pg.evaluate("present6(false, ED.cur); void 0"); await pg.wait_for_timeout(1500)
        src = lambda: pg.evaluate("document.querySelector('.pm-tl audio').src.split('/data/')[1]")
        ok(await pg.evaluate("!!document.querySelector('.present6 .pm-tl .pmaudio')"), 'play button over the slide')
        ok(await src() == 'Alafasy_128kbps/001001.mp3', 'starts with the basmala: ' + await src())
        await pg.click('.pm-tl .pmaudio', force=True); await pg.wait_for_timeout(500)
        ok(await pg.evaluate("document.querySelector('.pm-tl').classList.contains('playing')"), 'playing state')
        seq = []
        for _ in range(4):
            await pg.evaluate("document.querySelector('.pm-tl audio').dispatchEvent(new Event('ended'))"); await pg.wait_for_timeout(150); seq.append((await src()).split('/')[1])
        ok(seq == ['112001.mp3', '112001.mp3', '112002.mp3', '112002.mp3'], 'each verse twice, in order: %s' % seq)
        ok(await pg.evaluate("document.querySelector('.pm-tl .tlnum').textContent") == '٢', 'current verse number shown')
        await pg.evaluate("document.querySelector('.present6').classList.add('awake')")
        await pg.click('.pm-tl .tlqari'); await pg.wait_for_timeout(300)
        ok(await pg.evaluate("document.querySelectorAll('.pm-tl .tlmenu button').length") == 15, 'reciter menu during the presentation')
        await pg.screenshot(path=OUT + 'ab3_present_menu.png')
        await pg.click('.pm-tl .tlmenu button:has-text("محمود خليل الحصري")'); await pg.wait_for_timeout(300)
        ok(await src() == 'Husary_128kbps/112002.mp3', 'switching reciter continues from the same verse: ' + await src())
        await pg.keyboard.press('ArrowLeft'); await pg.wait_for_timeout(1200)
        ok(await pg.evaluate("!document.querySelector('.pm-tl')"), 'leaving the slide stops the recitation')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
        # من «آية أو حديث موثّق»: الآيات المتتالية مع التلاوة
        await pg.evaluate("S.layers = []; changed6(); verifiedTextDialog(insertVerified)"); await pg.wait_for_timeout(400)
        await pg.fill('.modal input[type=search]', 'الإخلاص 1-4'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(1200)
        ok(await pg.evaluate("document.querySelectorAll('.modal .vrow button').length") == 8, 'every verse has «مع التلاوة»')
        await pg.click('.modal .vrun button'); await pg.wait_for_timeout(900)
        L = await pg.evaluate("S.layers.find(l=>l.qr)")
        ok(L and L['qr']['s'] == 112 and L['qr']['a'] == 1 and L['qr']['b'] == 4, 'consecutive verses inserted with one recitation button')
        await pg.screenshot(path=OUT + 'ab4_slide.png')
        # الرسم العثماني بخط المصحف
        await pg.evaluate("S.layers = []; changed6(); localStorage.removeItem('mp6.rasm'); verifiedTextDialog(insertVerified)"); await pg.wait_for_timeout(400)
        ok(await pg.evaluate("document.querySelector('.rasmseg .on').textContent") == 'الرسم العثماني', 'Uthmani script is the default')
        await pg.fill('.modal input[type=search]', 'الإخلاص 1-2'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(1200)
        await pg.evaluate("S.sel=null; document.querySelector('.modal .vrun .btn').click()"); await pg.wait_for_timeout(1500)
        L = await pg.evaluate("S.layers.find(l=>l.t==='text')")
        ok(L and L.get('f') == 'quran' and 'ٱ' in L['txt'], 'Uthmani text set in the Mushaf font: ' + str(L and (L.get('f'), L['txt'][:30])))
        ok(await pg.evaluate("document.fonts.check('40px quran', 'ٱلْحَمْدُ')"), 'Mushaf font loaded from the site')
        await pg.evaluate("const L=S.layers.find(l=>l.t==='text'); L.sz=0.09; L.y=0.4; changed6(); drawNow()"); await pg.wait_for_timeout(800)
        await pg.screenshot(path=OUT + 'ab5_uthmani.png')
        # التصاميم: رمز استماع للمطبوعات
        await pg.evaluate("ED.leaveOK=true"); await pg.goto(URL + '#/e/ishraq/ann_panel'); await pg.wait_for_timeout(2500); await clean(pg)
        await pg.evaluate("openTab('els')"); await pg.wait_for_timeout(600)
        await pg.click('.qrlisten'); await pg.wait_for_timeout(400)
        await pg.select_option('.modal select >> nth=0', '112'); await pg.fill('.tlrange label:nth-child(2) input', '4'); await pg.dispatch_event('.tlrange label:nth-child(2) input', 'change')
        await pg.select_option('.modal select >> nth=1', 'basit')
        await pg.click('.modal .acts .btn.dark'); await pg.wait_for_timeout(900)
        qr = await pg.evaluate("S.layers.filter(l=>l.t==='qr' || l.t==='text').map(l=>l.url||l.txt)")
        ok(qr == ['https://ghamine23.github.io/media-portal/q.html#112.1-4.basit', 'امسح لتستمع'], 'listening QR with its caption: %s' % qr)
        ok(not await pg.evaluate("S.layers.some(l=>l.t==='audio')"), 'no presentation button in a print design')
        await pg.screenshot(path=OUT + 'ab6_qr_design.png')
        # صفحة الاستماع
        QP = URL.split('/dist6/')[0] + '/docs/v6/q.html'
        for vw, name in [((1280, 860), 'ab7_listen.png'), ((390, 844), 'ab8_listen_m.png')]:
            await pg.set_viewport_size({'width': vw[0], 'height': vw[1]})
            await pg.goto(QP + '#112.1-4.afasy.2'); await pg.wait_for_timeout(1800)
            await pg.screenshot(path=OUT + name)
        ok(await pg.evaluate("document.querySelectorAll('.v').length") == 4, 'listening page shows the four verses')
        ok(await pg.evaluate("document.querySelector('.v').textContent.indexOf('بِسْمِ') < 0 && !!document.querySelector('.basmala')"), 'basmala on its own line, not inside verse one')
        await pg.click('#play'); await pg.wait_for_timeout(400)
        await pg.evaluate("document.querySelectorAll('.v')[2].click()"); await pg.wait_for_timeout(400)
        ok(await pg.evaluate("document.querySelector('.v.on').dataset.n") == '3', 'tapping a verse plays from it')
        await pg.select_option('#qari', 'minshawi'); await pg.wait_for_timeout(300)
        nw = await pg.evaluate("document.querySelector('#now').textContent")
        ok('المنشاوي' in nw, 'reciter switch on the listening page: ' + nw)
        await pg.goto(QP); await pg.wait_for_timeout(800)
        ok(await pg.evaluate("!!document.querySelector('#cs') && document.querySelectorAll('#cs option').length === 114"), 'listening page without a passage offers a chooser')
        errs = [e for e in errs if '404' not in e]; print('ERRORS', errs[:3])
        await b.close()
asyncio.run(main())
