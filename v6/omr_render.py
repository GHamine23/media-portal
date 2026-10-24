import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
"""معاينة طقم خارطة الثغور: يرسم كل قالب بكل متغيّراته وأحجامه بهوية البرنامج ويحفظ لوحات مصغّرات للمراجعة البصرية."""
import asyncio, sys, base64, io
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT
from t6y import make_omr
from PIL import Image
from playwright.async_api import async_playwright
O = OUT + (os.environ.get('OUTDIR') or ('omr_p/' if os.environ.get('PHOTO') else 'omr/')); os.makedirs(O, exist_ok=True)
JS = """async function(ids){ const out={}; const T=trackOf(window.__tid||'khartah');
  await document.fonts.ready;
  for (const tpl of TEMPLATES.filter(t=>ids.indexOf(t.id)>=0)) {
    for (const v of tpl.variants) for (const sz of tpl.sizes) {
      const c=document.createElement('canvas'); const st={d:defaults(tpl,T),variant:v.id,k:1}; if (window.__photo && st.d.photo !== undefined) st.d.photo={src:'lib:img_dome',z:1};
      renderTo(c,tpl,sz,st,T,0.5); out[tpl.id+'|'+v.id+'|'+sz]=c.toDataURL('image/jpeg',0.9); } }
  return out; }"""
async def main():
    ids = sys.argv[1:] or ['om_meet', 'om_table', 'om_info', 'om_cert', 'om_notice', 'om_event', 'om_badge', 'om_yt']
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        errs = await setup(pg)
        await make_omr(pg)
        await pg.evaluate("useProgram('omr')"); await pg.wait_for_timeout(2500)
        await pg.evaluate("ensureFonts([FS.title, FS.body])"); await pg.wait_for_timeout(800)
        if os.environ.get('PHOTO'): await pg.evaluate('window.__photo=1')
        if os.environ.get('TID'): await pg.evaluate("tid => { window.__tid = tid; return useProgram('academy') }", os.environ['TID']); await pg.wait_for_timeout(2000)
        out = await pg.evaluate('(' + JS + ')', ids)
        by = {}
        for k, v in out.items():
            t, var, sz = k.split('|'); im = Image.open(io.BytesIO(base64.b64decode(v.split(',')[1]))).convert('RGB')
            im.save(O + '%s_%s_%s.jpg' % (t, var, sz), quality=90); by.setdefault(t, []).append((var, sz, im))
        for t, L in by.items():
            TH = 560; ws = []
            for var, sz, im in L: r = TH / im.height; ws.append(int(im.width * r))
            sheet = Image.new('RGB', (sum(ws) + 12 * (len(L) + 1), TH + 24), '#777'); x = 12
            for (var, sz, im), w in zip(L, ws): sheet.paste(im.resize((w, TH)), (x, 12)); x += w + 12
            sheet.save(O + 'sheet_%s.jpg' % t, quality=85)
        print('rendered', len(out)); print('ERRORS', [e for e in errs if '404' not in e][:6]); await b.close()
asyncio.run(main())
