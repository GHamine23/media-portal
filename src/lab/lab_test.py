"""مختبر الحزم الأسبوعية: يجرّب حزمة قوالب قبل رفعها إلى درايف.
الاستعمال:
    python3 lab_test.py <مجلد ملفات الموقع> <ملف الحزمة.js> [مجلد الصور]
المجلد يحوي ما نُزّل من «٠- ملفات الموقع»: engine.js و identities.js و templates.js و templates2.js و studio.js (لا حاجة لـ assets.js).
يرسم كل قالب في الحزمة بكل مقاساته وألوانه، بكل الهويات، ويكتب صوراً وورقة مجمّعة، ويبلغ عن:
  - أخطاء الرسم (أي استثناء)
  - تداخل النصوص مع بعضها أو مع الزخارف، وخروج النص عن حدود التصميم
الشعارات والخطوط هنا بدائل مؤقتة (مستطيلات وخط النظام)، فالحكم على المواضع والتداخل لا على الجمال النهائي."""
import asyncio, base64, io, json, pathlib, sys
from PIL import Image, ImageDraw
from playwright.async_api import async_playwright

src = pathlib.Path(sys.argv[1]); pack = pathlib.Path(sys.argv[2])
out = pathlib.Path(sys.argv[3] if len(sys.argv) > 3 else 'lab_out'); out.mkdir(exist_ok=True)

def stub(w, h, col, mask=False):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=h // 5, fill=(255, 255, 255, 255) if mask else col)
    b = io.BytesIO(); im.save(b, 'PNG'); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
assets = {'logo': stub(300, 120, (70, 120, 57, 255)), 'academy': stub(260, 75, 0, True), 'social': stub(250, 70, 0, True)}
for k, wh in {'lg_ishraq': (300, 260), 'lg_budhoor': (300, 140), 'lg_ithmar': (180, 310), 'lg_ithmar2': (180, 310), 'lg_ithmar3': (180, 310),
              'lg_sanabel': (300, 150), 'lg_tiryaq': (300, 270), 'lg_risala': (300, 100), 'lg_multaqa': (200, 115), 'lg_rifaq': (290, 180),
              'lg_anshita': (320, 100), 'lg_arwah': (250, 50), 'lg_mark': (200, 150), 'lg_academy': (250, 300)}.items():
    assets[k] = stub(wh[0], wh[1], (120, 80, 140, 255))
for k in ['img_dome', 'img_mosque', 'img_quran', 'img_arch']: assets[k] = stub(600, 500, (180, 170, 150, 255))

parts = ['engine.js', 'identities.js', 'templates.js', 'templates2.js', 'studio.js']
js = 'const ASSETS = ' + json.dumps(assets) + ';\n'
for p in parts:
    f = src / p
    if f.exists(): js += '\n' + f.read_text() + '\n'
    else: print('تنبيه: لم أجد', p)
html = '<!doctype html><html dir="rtl"><body><script>\n' + js + '\n</script><script>\nconst S = {}; function $(){return null;}\n' + pack.read_text() + '\n</script></body></html>'
(out / 'harness.html').write_text(html)

TEST = r'''async () => {
  await loadAssets();
  const ids = (PACKS[PACKS.length - 1] || {}).id;
  const tpls = TEMPLATES.filter(t => t.pack === ids);
  const res = { images: [], issues: [], errors: [], tpls: tpls.map(t => t.id), ids: Object.keys(TRACKS) };
  function ov(a, b, pad) { return Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > pad && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > pad; }
  for (const tpl of tpls) for (const tid of Object.keys(TRACKS)) for (const sz of tpl.sizes) for (const v of tpl.variants) {
    const T = TRACKS[tid], W = SIZES[sz].w, H = SIZES[sz].h, c = document.createElement('canvas');
    c.width = W * 0.5; c.height = H * 0.5; const ctx = c.getContext('2d'); ctx.setTransform(0.5, 0, 0, 0.5, 0, 0);
    const d = {}; tpl.fields.forEach(f => { if (f.k) d[f.k] = f.kind === 'image' ? (f.def ? { src: 'lib:' + f.def, z: 1, ox: 0, oy: 0 } : null) : f.def; });
    const P = {}; tpl.fields.forEach(f => { if (f.kind === 'image' && d[f.k]) P[f.k] = { im: IMG[d[f.k].src.slice(4)], z: 1, ox: 0, oy: 0, lib: true }; });
    HIDE = {}; OV = {}; OFF = {}; GHIDE = {}; BGFX = null; CUR_T = T; BOXES = [];
    try { tpl.draw(ctx, W, H, d, T, v.id, 1, P); G(ctx, null); } catch (e) { res.errors.push([tpl.id, tid, sz, v.id, String(e)]); }
    const bx = BOXES; BOXES = null;
    bx.forEach((a, i) => {
      if (a.k === 'text' && (a.x0 < -1 || a.x1 > W + 1 || a.y0 < -1 || a.y1 > H + 1)) res.issues.push([tpl.id, tid, sz, v.id, 'خارج الحدود', a.t]);
      bx.forEach((b2, j) => { if (j <= i) return; if (a.k !== 'text' && b2.k !== 'text') return; if (['area', 'photo'].includes(a.k) || ['area', 'photo'].includes(b2.k)) return;
        if (ov(a, b2, 2)) res.issues.push([tpl.id, tid, sz, v.id, a.k + '×' + b2.k, String(a.t).slice(0, 30) + ' | ' + String(b2.t).slice(0, 30)]); });
    });
    if (tid === 'judhoor' || tid === Object.keys(TRACKS)[Object.keys(TRACKS).length - 1] || sz === tpl.sizes[0] && v === tpl.variants[0]) res.images.push([tpl.id + '_' + tid + '_' + sz + '_' + v.id, c.toDataURL('image/jpeg', 0.8)]);
  }
  return res;
}'''

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + str((out / 'harness.html').resolve()))
        res = await pg.evaluate(TEST)
        await b.close()
    ims = []
    for name, url in res['images']:
        f = out / (name + '.jpg'); f.write_bytes(base64.b64decode(url.split(',')[1])); ims.append(Image.open(f))
    if ims:
        h = 360; ims = [i.resize((int(i.width * h / i.height), h)) for i in ims]
        cols = 8; rows = [ims[i:i + cols] for i in range(0, len(ims), cols)]
        Wd = max(sum(i.width for i in r) + 8 * (len(r) + 1) for r in rows)
        sheet = Image.new('RGB', (Wd, (h + 8) * len(rows) + 8), (110, 110, 110)); y = 8
        for r in rows:
            x = 8
            for i in r: sheet.paste(i, (x, y)); x += i.width + 8
            y += h + 8
        sheet.save(out / '_sheet.jpg', quality=80)
    print('القوالب:', res['tpls']); print('أخطاء الصفحة:', errs[:5]); print('أخطاء الرسم:', res['errors'][:10])
    seen = set()
    for i in res['issues']:
        k = (i[0], i[4], i[5])
        if k not in seen: seen.add(k); print('تداخل:', i)
    print('الصور في', out, '— الورقة المجمّعة _sheet.jpg')
asyncio.run(main())
