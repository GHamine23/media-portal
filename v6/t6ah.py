import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
"""قوالب «الشبكة والتذاكر» وخطوط القالب: الخطوط المدمجة مسجّلة، والقالب يرسم بخطوطه ما لم يختر المصمم خطوطاً عامة، ولوحة الخطوط تُظهر خط القالب."""
import asyncio, sys
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT
from playwright.async_api import async_playwright
fails = []
def ok(c, m): print(('✓ ' if c else '✗ ') + m); (None if c else fails.append(m))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        errs = await setup(pg)
        await pg.evaluate("useProgram('academy')"); await pg.wait_for_timeout(2500)
        ok(await pg.evaluate("!!FONTS.alyamama && !!FONTS.notosans && !!FONTS.zain && !!FONTS.readex"), 'builtin fonts registered (alyamama, notosans, zain, readex)')
        ok(await pg.evaluate("tplFontFams().indexOf('alyamama') >= 0"), 'template fonts collected for preloading')
        ok(await pg.evaluate("document.fonts.check('900 20px alyamama', 'بسم')"), 'alyamama loaded with the program')
        ok(await pg.evaluate("!!LATF.alyamama"), 'Latin companion face for alyamama')
        r = await pg.evaluate("""(function(){ const T=trackOf('judhoor'), tpl=TEMPLATES.find(t=>t.id==='nt_ticket'); const c=document.createElement('canvas');
          const fams=[]; const of=fontOf; window.fontOf=function(r,b,t){ const x=of(r,b,t); fams.push(x.fam.split('|')[0]); return x; };
          try { renderTo(c,tpl,'post',{d:defaults(tpl,T),variant:'night',k:1},T,0.3); } finally { window.fontOf=of; }
          const a=fams.slice(); fams.length=0; window.fontOf=function(r,b,t){ const x=of(r,b,t); fams.push(x.fam.split('|')[0]); return x; };
          try { renderTo(c,tpl,'post',{d:defaults(tpl,T),variant:'night',k:1,fs:{title:FS.title,body:FS.body}},T,0.3); } finally { window.fontOf=of; }
          return [Array.from(new Set(a)), Array.from(new Set(fams)), TPLF]; })()""")
        ok('readex' in r[0] and 'alyamama' in r[0], 'template draws with its own fonts: ' + str(r[0]))
        ok('readex' not in r[1] and 'alyamama' not in r[1], 'design-wide font choice overrides template fonts: ' + str(r[1]))
        ok(r[2] is None, 'TPLF reset after drawing')
        ok(await pg.evaluate("ntClean('كيفية إدارة المشاريعـ ؟') === 'كيفية إدارة المشاريع؟'"), 'clean: no space before ? and no trailing tatweel')
        ok(await pg.evaluate("ntClean('يوم الأحد 1/6/1448هـ') === 'يوم الأحد 1/6/1448هـ' && ntClean('سنة 1448 هـ.') === 'سنة 1448 هـ.'"), 'clean: keeps the Hijri abbreviation')
        ok(await pg.evaluate("familyOf('82a81fe1-1793792989822_TheYearofHandicrafts-SemiBold.otf').family === 'handicrafts' && weightOf('TheYearofHandicrafts-SemiBold.otf') === '600' && weightOf('The Year of Handicrafts-Black.otf') === '900' && familyOf('TheYearofHandicraftsTTF-Reg.ttf').label === 'عام الحرف اليدوية'"), 'academy font files map to one family with the right weights')
        ok(await pg.evaluate("TRACKS.academy && TRACKS.academy.fonts.title === 'handicrafts' && TRACKS.academy.c.p === '#00837b' && ACADEMY.purple === '#522b60'"), 'academy identity: official colours and its font')
        # المحرر: لوحة الخطوط تُظهر خط القالب
        await pg.goto(URL + '#/e/judhoor/nt_ticket'); await pg.wait_for_timeout(3000)
        await pg.evaluate("document.querySelectorAll('.coach,.gintro').forEach(x=>x.remove())")
        ok(await pg.evaluate("tplFont('title') === 'readex' && tplFont('body') === 'alyamama'"), 'editor knows template fonts')
        await pg.evaluate("ED.mode='full'; buildRail()"); await pg.click('#e_rail button[data-tab=fonts]'); await pg.wait_for_timeout(1200)
        t = await pg.inner_text('.ftargets')
        ok('ريدكس' in t, 'font panel shows template title font')
        await pg.screenshot(path=OUT + 'ah_editor.png')
        # حقل خاص بنسخة: الصور تظهر في «ملف وصور» فقط
        await pg.goto(URL + '#/e/judhoor/nt_folder'); await pg.wait_for_timeout(3000)
        await pg.evaluate("document.querySelectorAll('.coach,.gintro').forEach(x=>x.remove())")
        n1 = await pg.evaluate("document.querySelectorAll('.pform .imfld, .pform [data-k=p1], .pform .fld').length")
        has1 = await pg.evaluate("document.querySelector('.pform') ? document.querySelector('.pform').innerText.indexOf('الصورة الأولى') >= 0 : null")
        ok(has1 is False, 'photo fields hidden outside the photos variant')
        ok(not [e for e in errs if 'PAGEERR' in e], 'no page errors ' + str([e for e in errs if 'PAGEERR' in e][:2]))
        await b.close()
    print('FAILS', fails)
asyncio.run(main())
