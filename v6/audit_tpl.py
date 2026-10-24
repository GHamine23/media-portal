import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
"""تدقيق القوالب: يرسم كل قالب بكل متغيّر وحجم، بالنصوص الافتراضية ثم بنصوص طويلة (حتى الحد الأقصى)،
ويرصد: نصاً خارج اللوحة، وتداخل نصوص عناصر مختلفة، وخطاً صغُر حتى لا يُقرأ. ويحفظ صور المرصود للمراجعة."""
import asyncio, sys, json, base64
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT
from playwright.async_api import async_playwright
O = OUT + 'audit/'; os.makedirs(O, exist_ok=True)
JS = r"""async function(arg){ const out=[]; const T=trackOf(arg.tid); await document.fonts.ready;
  const LONG = 'نص تجريبي طويل لاختبار اتساع العنصر وسلامة التخطيط في القالب ';
  const stress = function(tpl, d){ tpl.fields.forEach(function(f){ if(!f.k || f.kind==='image'||f.kind==='choice'||f.kind==='toggle'||f.kind==='date'||f.kind==='hidden') return; const v=d[f.k]; if(typeof v!=='string') return;
      const mx = f.max || (f.kind==='area'?120:30); if (f.k==='rows'||f.k==='items'||/\|/.test(v)) return; let s=''; const base = (v && v.trim()) ? v.replace(/\n/g,' ') + ' ' : LONG; while (s.length < mx) s += base; d[f.k] = s.slice(0, mx).trim(); }); return d; };
  for (const tpl of TEMPLATES.filter(t=>t.id!=='blank' && (!arg.only || arg.only.indexOf(t.id)>=0) && t.type!=='slide')) {
    for (const v of tpl.variants) for (const sz of tpl.sizes) for (const mode of ['def','long']) {
      const S0=SIZES[sz]; const c=document.createElement('canvas'); let d=defaults(tpl,T); if(mode==='long') d=stress(tpl,d);
      BOXES=[]; let err='';
      const ce=console.error; console.error=function(){ err = err || [].join.call(arguments,' ').slice(0,120); };
      try { renderTo(c,tpl,sz,{d:d,variant:v.id,k:1},T,0.4); } catch(e){ err=String(e); } finally { console.error=ce; }
      const bx = (BOXES||[]).filter(b=>b.k==='text'); BOXES=null;
      const issues=[]; if (err) issues.push('ERR '+err);
      const m = 4;
      bx.forEach(function(b){ if (b.x0 < -m || b.y0 < -m || b.x1 > S0.w+m || b.y1 > S0.h+m) issues.push('OUT['+b.g+'] '+b.t.slice(0,25)); });
      for (let i=0;i<bx.length;i++) for (let j=i+1;j<bx.length;j++) { const a=bx[i], b=bx[j]; if (!a.g || !b.g || a.g===b.g) continue;
        const ix=Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0), iy=Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0); if (ix<=2||iy<=2) continue;
        const ar=Math.min((a.x1-a.x0)*(a.y1-a.y0),(b.x1-b.x0)*(b.y1-b.y0)); if (ix*iy > ar*0.12) issues.push('OVL['+a.g+'×'+b.g+'] '+a.t.slice(0,18)+' / '+b.t.slice(0,18)); }
      bx.forEach(function(b){ const h=b.y1-b.y0; if (b.t.length>3 && h < S0.w*0.012) issues.push('TINY['+b.g+'] '+Math.round(h)+'px '+b.t.slice(0,20)); });
      const u = Array.from(new Set(issues));
      out.push({id:tpl.id, v:v.id, sz:sz, mode:mode, issues:u, img: u.length ? c.toDataURL('image/jpeg',0.8) : ''});
    } }
  return out; }"""
async def main():
    tid = os.environ.get('TID', 'ishraq'); only = sys.argv[1:] or None
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1300, 'height': 900})
        errs = await setup(pg)
        if tid == 'khartah':
            from t6y import make_omr
            await make_omr(pg); await pg.evaluate("useProgram('omr')"); await pg.wait_for_timeout(2500)
        else:
            await pg.evaluate("useProgram('academy', true)"); await pg.wait_for_timeout(1500)
        await pg.evaluate("ensureFonts(Object.keys(FONTS).slice(0,3))"); await pg.wait_for_timeout(800)
        res = await pg.evaluate('(' + JS + ')', {'tid': tid, 'only': only})
        bad = [r for r in res if r['issues']]
        for r in bad:
            open(O + '%s_%s_%s_%s_%s.jpg' % (tid, r['id'], r['v'], r['sz'], r['mode']), 'wb').write(base64.b64decode(r['img'].split(',')[1]))
        rep = {}
        for r in bad: rep.setdefault(r['id'], []).append('%s/%s/%s: %s' % (r['v'], r['sz'], r['mode'], ' | '.join(r['issues'][:4])))
        json.dump(rep, open(O + 'report_%s.json' % tid, 'w'), ensure_ascii=False, indent=1)
        print('renders', len(res), 'flagged', len(bad), 'templates', len(rep))
        for k, v in rep.items(): print('##', k, len(v)); [print('  ', x) for x in v[:6]]
        print('ERRORS', [e for e in errs if '404' not in e][:4]); await b.close()
asyncio.run(main())
