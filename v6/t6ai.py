import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
"""خط الأكاديمية ومعايير العنوان (الحرف المطوّل والكشيدة)، والتصميم السريع بالقوالب من بوت أثر (#/make?tq=1).
يحتاج ملفات «عام الحرف اليدوية» في /home/claude/fonts_hc/ (لا تُرفع إلى المستودع: حقوقها محفوظة)."""
import asyncio, sys, json, base64
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT
from playwright.async_api import async_playwright
fails = []
def ok(c, m): print(('✓ ' if c else '✗ ') + m); (None if c else fails.append(m))
HC = ['TheYearofHandicrafts-Regular.otf', 'TheYearofHandicrafts-Medium.otf', 'TheYearofHandicrafts-SemiBold.otf', 'TheYearofHandicrafts-Bold.otf', 'TheYearofHandicrafts-Black.otf']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1280, 'height': 900})
        errs = await setup(pg)
        # رفع خط الأكاديمية كما يرفعه المدير من «الخطوط»
        for f in HC:
            data = base64.b64encode(open('/home/claude/fonts_hc/' + f, 'rb').read()).decode()
            await pg.evaluate("""([f, d]) => { const fm = familyOf(f); return API6.me('asset_put', JSON.stringify({ kind: 'font', name: f, family: fm.family, label: fm.label, weight: weightOf(f), mime: 'font/otf', scope: 'program', program: 'academy' }), d); }""", [f, data])
        await pg.evaluate("refreshBundle()"); await pg.wait_for_timeout(2500)
        await pg.evaluate("useProgram('academy')"); await pg.wait_for_timeout(3000)
        ok(await pg.evaluate("FS.title === 'handicrafts' && FS.body === 'handicrafts'"), 'academy program draws with its font by default')
        ok(await pg.evaluate("TITLE_RULES.sw && TITLE_RULES.ksh && !!SWF.handicrafts"), 'title rules on, swash face registered')
        ok(await pg.evaluate("document.fonts.check('700 20px handicrafts_sw', 'بيت')"), 'swash face loaded')
        # الحرف المطوّل: آخر كلمة مناسبة في السطر
        r = await pg.evaluate("""(function(){ const c=document.createElement('canvas').getContext('2d');
          const f1=fit(c,'لقاء الأسرة المطمئنة',{maxW:2000,size:80,title:true});
          const f2=fit(c,'بيوت هادئة\\nالبيت',{maxW:2000,size:80,title:true});
          const sw=function(f){ return f.lines.map(function(l){ return l.words.map(function(w){ return w.map(function(g){ return (g.sw?'^':'')+g.t; }).join(''); }).join(' '); }); };
          const f3=fit(c,'الثبات على الطريق في زمن الفتن',{maxW:650,size:80,title:true});
          const f4=fit(c,'الصبر',{maxW:2000,size:80,title:false,role:'body'});
          const f5=fit(c,'لقاء الأسـرة',{maxW:2000,size:80,title:true});
          return [sw(f1),sw(f2),sw(f3),f3.lines.map(function(l){return Math.round(l.w);}),sw(f4),sw(f5)]; })()""")
        print(json.dumps(r, ensure_ascii=False))
        ok(r[0] == ['لقاء الأسرة المطمئنة'], 'no swash letter at the end (ة) → unchanged')
        ok(r[1] == ['بيوت هادئة', '^البيت'], 'last word of a shorter line ending in ت gets the swash form')
        r2 = await pg.evaluate("(function(){ const c=document.createElement('canvas').getContext('2d'); const f=fit(c,'لقاء المسابقات',{maxW:2000,size:80,title:true}); return f.lines[0].words.some(w=>w.some(g=>g.sw)); })()")
        ok(not r2, 'a one-line title is not widened by the swash')
        ok(len(r[2]) == 2 and 'ـ' in r[2][1] and 'ـ' not in r[2][0], 'long title: kashida added to balance the shorter line only')
        ok(r[4] == ['الصبر'], 'body text untouched')
        ok(r[5] == ['لقاء الأسـرة'], 'a title with a hand-written tatweel is left as written')
        # هوية الأكاديمية: كل القوالب بخطها، حتى ما له خطه الخاص؛ وهويات المسارات تبقى بخطوط قوالبها
        r3 = await pg.evaluate("""(function(){ const tpl = TEMPLATES.find(function (t) { return t.fonts && t.fonts.title && FONTS[t.fonts.title] && t.fonts.title !== 'handicrafts'; }); if (!tpl || !TRACKS.academy) return null;
          const P = CanvasRenderingContext2D.prototype, d0 = Object.getOwnPropertyDescriptor(P, 'font'); let used = [];
          Object.defineProperty(P, 'font', { configurable: true, get: d0.get, set: function (v) { used.push(String(v)); d0.set.call(this, v); } });
          const run = function (T) { used = []; renderTo(document.createElement('canvas'), tpl, tpl.sizes[0], { d: defaults(tpl, T), variant: tpl.variants[0].id, k: 1 }, T, 0.2); return used.join('|'); };
          const fam = FONTS[tpl.fonts.title].family || tpl.fonts.title;
          const a = run(TRACKS.academy), other = Object.keys(TRACKS).map(function (k) { return TRACKS[k]; }).find(function (t) { return !t.fonts; }), b = run(other);
          Object.defineProperty(P, 'font', d0);
          return [tpl.id, fam, a.indexOf(fam) >= 0, /handicrafts/.test(a), b.indexOf(fam) >= 0]; })()""")
        print('identity font override', r3)
        ok(r3 and not r3[2] and r3[3] and r3[4], 'academy identity: template fonts give way to the identity font; tracks keep template fonts')
        # التصميم السريع بالقوالب: كل قوالب النوع مملوءة بالأجوبة
        info = {'title': 'بُيوتٌ *مطمئنّة*', 'kind': 'محاضرة', 'who': 'د. محمد', 'date': '2026-11-20', 'time': '8:30 م', 'place': 'عبر زوم'}
        f = base64.urlsafe_b64encode(json.dumps(info, ensure_ascii=False).encode()).decode().rstrip('=')
        await pg.goto(URL + '#/make?tq=1&prog=academy&tid=judhoor&type=ann&size=post&f=' + f); await pg.wait_for_timeout(5000)
        n = await pg.evaluate("document.querySelectorAll('.mkcard').length")
        ok(n >= 5, 'all announcement templates shown filled: %d' % n)
        ok(await pg.evaluate("/راجع قبل أن تنشر/.test(document.querySelector('.mkrev').innerText)"), 'review note shown')
        await pg.screenshot(path=OUT + 'ai_tq.png', full_page=False)
        await pg.set_viewport_size({'width': 390, 'height': 844}); await pg.wait_for_timeout(800); await pg.screenshot(path=OUT + 'ai_tq_m.png'); await pg.set_viewport_size({'width': 1280, 'height': 900})
        # فتح أحدها يحمل البيانات إلى المحرر
        await pg.evaluate("document.querySelector('.mkcard').click()"); await pg.wait_for_timeout(3500)
        d = await pg.evaluate("JSON.stringify(ED && ED.doc ? ED.doc.pages[0].d : {})")
        ok('مطمئنّة' in d and 'د. محمد' in d, 'the chosen template opens in the editor with the answers')
        await pg.evaluate("document.querySelectorAll('.coach,.gintro,.modal').forEach(x=>x.remove())")
        await pg.screenshot(path=OUT + 'ai_editor.png')
        bad = [e for e in errs if 'favicon' not in e and 'ERR_' not in e and '404' not in e]
        ok(not bad, 'no console errors: ' + str(bad[:3]))
        await b.close()
    print('FAILS', len(fails)); sys.exit(1 if fails else 0)
asyncio.run(main())
