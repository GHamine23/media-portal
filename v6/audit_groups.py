import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
"""تدقيق «العناصر» القابلة للتحديد في القوالب: صندوق يخرج عن اللوحة، أو صندوق ضخم، أو عنصر مكوّن من أجزاء متباعدة
(كبطاقات منفصلة تحت اسم واحد) فلا يتوسّط ولا يتحرك كما يتوقع المستخدم."""
import asyncio, sys, json
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT
from playwright.async_api import async_playwright
JS = r"""async function(arg){ const T=trackOf(arg.tid); await document.fonts.ready; const out=[];
  for (const tpl of TEMPLATES.filter(t=>t.id!=='blank' && t.type!=='slide' && (!arg.only || arg.only.indexOf(t.id)>=0))) {
    for (const sz of tpl.sizes) { const v = tpl.variants[0]; const c=document.createElement('canvas'); const S0=SIZES[sz];
      BOXES=[]; const gb = renderTo(c,tpl,sz,{d:defaults(tpl,T),variant:v.id,k:1},T,0.25,true) || {}; const bx=(BOXES||[]).slice(); BOXES=null;
      const iss=[];
      Object.keys(gb).forEach(function(g){ const b=gb[g]; const m=0.02*S0.w;
        if (b.x0 < -m || b.y0 < -m || b.x1 > S0.w+m || b.y1 > S0.h+m) iss.push('OUT '+g+' ['+[b.x0,b.y0,b.x1,b.y1].map(Math.round)+']');
        const ar=(b.x1-b.x0)*(b.y1-b.y0)/(S0.w*S0.h); if (ar>0.5 && ['deco','panel','band','frame','photo','bg','ring','shape'].indexOf(g)<0) iss.push('BIG '+g+' '+Math.round(ar*100)+'%');
        // تجميع صناديق العنصر: أجزاء متباعدة؟
        const own=bx.filter(x=>x.g===g && x.k!=='area'); if (own.length<2) return;
        const cl=[]; own.forEach(function(x){ const gap=0.025*S0.w; let hit=null; cl.forEach(function(c){ if (!(x.x0>c.x1+gap||x.x1<c.x0-gap||x.y0>c.y1+gap||x.y1<c.y0-gap)) { if (!hit) { hit=c; c.x0=Math.min(c.x0,x.x0); c.y0=Math.min(c.y0,x.y0); c.x1=Math.max(c.x1,x.x1); c.y1=Math.max(c.y1,x.y1); } } }); if(!hit) cl.push({x0:x.x0,y0:x.y0,x1:x.x1,y1:x.y1}); });
        // دمج متكرر
        let ch=true; while(ch){ ch=false; for(let i=0;i<cl.length;i++) for(let j=i+1;j<cl.length;j++){ const a=cl[i],c=cl[j],gap=0.025*S0.w; if(!(a.x0>c.x1+gap||a.x1<c.x0-gap||a.y0>c.y1+gap||a.y1<c.y0-gap)){ a.x0=Math.min(a.x0,c.x0);a.y0=Math.min(a.y0,c.y0);a.x1=Math.max(a.x1,c.x1);a.y1=Math.max(a.y1,c.y1); cl.splice(j,1); ch=true; break; } } if(ch) break; }
        const big=cl.filter(c=>(c.x1-c.x0)*(c.y1-c.y0) > S0.w*S0.h*0.004);
        if (big.length>1) iss.push('MULTI '+g+' ×'+big.length);
      });
      if (iss.length) out.push({id:tpl.id, sz:sz, iss:iss});
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
        else: await pg.evaluate("useProgram('academy', true)"); await pg.wait_for_timeout(1500)
        res = await pg.evaluate('(' + JS + ')', {'tid': tid, 'only': only})
        by = {}
        for r in res: by.setdefault(r['id'], set()).update(r['iss'])
        for k, v in by.items(): print(k, '|', ' ; '.join(sorted(v))[:400])
        print('templates flagged', len(by)); await b.close()
if __name__ == "__main__": asyncio.run(main())
