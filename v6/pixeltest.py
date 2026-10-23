"""تجربة التطابق: كل قالب يُرسم في الإصدار الخامس والسادس بالحالة نفسها، وتُقارن الصورتان بكسلاً بكسلاً."""
import asyncio, base64, io, sys
sys.path.insert(0, '/home/claude/media-portal/v6')
from t6 import setup, URL
from PIL import Image, ImageChops
from playwright.async_api import async_playwright
JS = """async function(){ const out={}; const T=trackOf('ishraq');
  const list=TEMPLATES.filter(function(t){return t.id!=='blank';});
  if (typeof ensureFonts==='function') { await ensureFonts(['tajarib','handi']); }
  await document.fonts.ready;
  for (const tpl of list) { const c=document.createElement('canvas'); const st={d:defaults(tpl,T),variant:tpl.variants[0].id,k:1};
    if (tpl.type==='slide') st.d.__n='';
    renderTo(c,tpl,tpl.sizes[0],st,T,0.5); out[tpl.id]=c.toDataURL('image/png'); }
  return out; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        a = await b.new_page(viewport={'width': 1200, 'height': 800})
        await a.goto('file:///home/claude/media-portal/dist/index.html'); await a.wait_for_selector('.welcome .wcard', timeout=30000); await a.wait_for_timeout(800)
        v5 = await a.evaluate('(' + JS + ')()')
        n = await b.new_page(viewport={'width': 1200, 'height': 800})
        await setup(n)
        await n.evaluate("useProgram('academy', true)")
        v6 = await n.evaluate('(' + JS + ')()')
        same = diff = 0; bad = []
        for k in v5:
            if k not in v6: bad.append((k, 'missing')); continue
            i5 = Image.open(io.BytesIO(base64.b64decode(v5[k].split(',')[1]))).convert('RGBA')
            i6 = Image.open(io.BytesIO(base64.b64decode(v6[k].split(',')[1]))).convert('RGBA')
            if i5.size != i6.size: bad.append((k, 'size')); diff += 1; continue
            d = ImageChops.difference(i5, i6); bbox = d.getbbox()
            if not bbox: same += 1
            else:
                px = sum(1 for v in d.convert('L').getdata() if v > 8)
                diff += 1; bad.append((k, px)); d.convert('L').point(lambda v: 255 if v > 8 else 0).save('/tmp/claude-0/-home-claude/70f68a14-a7f8-546d-a4d0-039a53fab0d1/scratchpad/v6/diff_' + k + '.png')
        print('templates', len(v5), 'identical', same, 'different', diff, bad[:20])
        await b.close()
asyncio.run(main())
