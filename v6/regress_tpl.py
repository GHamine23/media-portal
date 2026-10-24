import os, sys; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
"""مقارنة كل القوالب (كل متغيّر وحجم، بالنصوص الافتراضية) بين نسخة مرجعية والنسخة الحالية: يكشف أي تغيير غير مقصود."""
import asyncio, base64, io, json
from PIL import Image, ImageChops
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/wt/base'
JS = """async function(){ const out={}; const T=trackOf('ishraq'); if (typeof ensureFonts==='function') await ensureFonts(['tajarib','handi']); await document.fonts.ready;
  for (const tpl of TEMPLATES.filter(t=>t.id!=='blank' && t.type!=='slide' && !t.set)) for (const v of tpl.variants) for (const sz of tpl.sizes) {
    const c=document.createElement('canvas'); renderTo(c,tpl,sz,{d:defaults(tpl,T),variant:v.id,k:1},T,0.4); out[tpl.id+'|'+v.id+'|'+sz]=c.toDataURL('image/png'); }
  return out; }"""
async def grab(p, root):
    sys.path.insert(0, root + '/v6')
    import importlib, t6; importlib.reload(t6)
    pg = await p.new_page(viewport={'width': 1200, 'height': 800})
    URL = 'http://localhost:8765/' + os.path.relpath(root, '/home/claude') + '/dist6/index.html'
    t6.URL = URL
    await t6.setup(pg); await pg.evaluate("useProgram('academy', true)"); await pg.wait_for_timeout(1500)
    r = await pg.evaluate('(' + JS + ')()'); await pg.close(); sys.path.pop(0); return r
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        a = await grab(p=b, root=BASE); n = await grab(p=b, root=_R)
        diff = []
        for k in a:
            if k not in n: diff.append((k, 'missing')); continue
            i1 = Image.open(io.BytesIO(base64.b64decode(a[k].split(',')[1]))).convert('RGB'); i2 = Image.open(io.BytesIO(base64.b64decode(n[k].split(',')[1]))).convert('RGB')
            if i1.size != i2.size: diff.append((k, 'size')); continue
            bb = ImageChops.difference(i1, i2).getbbox()
            if bb: diff.append((k, bb))
        print('compared', len(a), 'changed', len(diff)); [print(' ', d) for d in diff[:40]]
        await b.close()
asyncio.run(main())
