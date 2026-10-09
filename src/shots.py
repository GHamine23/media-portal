import asyncio, base64, sys, pathlib, json
from playwright.async_api import async_playwright
OUT = pathlib.Path('/home/claude/app/shots'); OUT.mkdir(exist_ok=True)
only = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] != '-' else ''
K = float(sys.argv[2]) if len(sys.argv) > 2 else 1
LONG = len(sys.argv) > 3 and sys.argv[3] == 'long'
TRK = sys.argv[4] if len(sys.argv) > 4 else 'judhoor'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1300, 'height': 900})
        errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/app/dist/index.html')
        await pg.wait_for_selector('.tracks', timeout=20000)
        res = await pg.evaluate('''(arg) => { const only = arg.only;
          const out = [], issues = [];
          const T = TRACKS[arg.trk];
          function ov(a, b, pad) { return Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > pad && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > pad; }
          TEMPLATES.forEach(tpl => {
            if (only && !tpl.id.startsWith(only)) return;
            const d = defaults(tpl, T);
            if (arg.long) Object.keys(d).forEach(k => { const f = tpl.fields.find(x => x.k === k); if (f && f.max && typeof d[k] === 'string') { let x = d[k].replace(/\\n/g, ' '); while (x.length < f.max) x += ' ' + x; d[k] = x.slice(0, f.max); } });
            tpl.sizes.forEach(sz => tpl.variants.forEach(v => {
              const c = document.createElement('canvas');
              BOXES = [];
              renderTo(c, tpl, sz, {d: d, variant: v.id, k: arg.k, hide: {}, ov: {}}, T, 0.5);
              const bx = BOXES; BOXES = null;
              const W = SIZES[sz].w, H = SIZES[sz].h;
              bx.forEach((a, i) => {
                if (a.k === 'text' && (a.x0 < -1 || a.x1 > W + 1 || a.y0 < -1 || a.y1 > H + 1)) issues.push([tpl.id, sz, v.id, 'OUT', a.t]);
                bx.forEach((b2, j) => {
                  if (j <= i) return;
                  if (a.k !== 'text' && b2.k !== 'text') return; if (a.k === 'area' || b2.k === 'area' || a.k === 'photo' || b2.k === 'photo') return;
                  if (ov(a, b2, 2)) issues.push([tpl.id, sz, v.id, a.k + '×' + b2.k, a.t.slice(0, 30) + ' | ' + b2.t.slice(0, 30)]);
                });
              });
              out.push([arg.trk + '_' + tpl.id + '_' + sz + '_' + v.id, c.toDataURL('image/jpeg', 0.85)]);
            }));
          });
          return {out, issues};
        }''', {'only': only, 'k': K, 'long': LONG, 'trk': TRK})
        for name, url in res['out']:
            (OUT / (name + '.jpg')).write_bytes(base64.b64decode(url.split(',')[1]))
        print(len(res['out']), 'images; errors:', errs[:5])
        seen=set()
        for i in res['issues']:
            k=(i[0],i[3],i[4])
            if k in seen: continue
            seen.add(k); print('ISSUE', i)
        await b.close()
asyncio.run(main())
