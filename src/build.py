"""يبني البوابة الإعلامية من المصادر.
  docs/            الموقع المنشور على GitHub Pages (صفحة + ملفات js منفصلة يحفظها المتصفح)
  dist/index.html  الموقع كاملاً في ملف واحد، للتجربة على الجهاز دون خادم
الخطوط في assets/fonts بصيغة woff2 كاملة بلا حذف، والشعارات في assets/logos بلا فقد.
رابط الخادم (Apps Script) في src/api_url.txt."""
import base64, hashlib, re, sys, pathlib, shutil
SRC = pathlib.Path(__file__).resolve().parent
ROOT = SRC.parent
FNT, LG, IMG = ROOT / 'assets/fonts', ROOT / 'assets/logos', ROOT / 'assets/img'
DOCS, DIST = ROOT / 'docs' / 'v5', ROOT / 'dist'   # بعد إطلاق السادس في الجذر يبقى الخامس في docs/v5
DOCS.mkdir(parents=True, exist_ok=True); (DOCS / 'js').mkdir(exist_ok=True); DIST.mkdir(exist_ok=True)

def b64(p, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(p.read_bytes()).decode()

assets = {
    'hc_m': b64(FNT / 'hc.woff2', 'font/woff2'),
    'tj_l': b64(FNT / 'tj_Light.woff2', 'font/woff2'),
    'tj_r': b64(FNT / 'tj_Regular.woff2', 'font/woff2'),
    'tj_m': b64(FNT / 'tj_Medium.woff2', 'font/woff2'),
    'tj_b': b64(FNT / 'tj_Bold.woff2', 'font/woff2'),
    'tj_k': b64(FNT / 'tj_Black.woff2', 'font/woff2'),
    'logo': b64(IMG / 'logo.png', 'image/png'),
    'academy': b64(IMG / 'academy.png', 'image/png'),
    'social': b64(IMG / 'social.png', 'image/png'),
}
for n in ['img_dome', 'img_mosque', 'img_quran', 'img_arch']:
    assets[n] = b64(IMG / (n + '.webp'), 'image/webp')
for n in ['ishraq', 'budhoor', 'ithmar', 'ithmar2', 'ithmar3', 'sanabel', 'tiryaq', 'risala', 'multaqa', 'rifaq', 'anshita', 'arwah', 'mark']:
    assets['lg_' + n] = b64(LG / (n + '.webp'), 'image/webp')
assets['lg_academy'] = b64(LG / 'academy_full.webp', 'image/webp')
# حزمة أصول إضافية يضيفها التطوير الأسبوعي: كل ملف في assets/extra يصبح مفتاحاً باسمه
EXTRA = ROOT / 'assets/extra'
if EXTRA.exists():
    for p in sorted(EXTRA.iterdir()):
        mime = {'.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2'}.get(p.suffix)
        if mime: assets[p.stem] = b64(p, mime)

api_url = (SRC / 'api_url.txt').read_text().strip() if (SRC / 'api_url.txt').exists() else ''
parts = {
    'assets.js': 'const ASSETS = {\n' + ',\n'.join('  %s: "%s"' % (k, v.replace('/', '\\/')) for k, v in assets.items()) + '\n};\n',
    'config.js': 'const API_URL = %s;\n' % ('"' + api_url + '"' if api_url else "''"),
}
ORDER = ['engine.js', 'identities.js', 'templates.js', 'templates2.js', 'core5.js', 'studio.js', 'slides.js', 'account.js', 'ui.js', 'boot.js']
for f in ORDER: parts[f] = (SRC / f).read_text()
shell = (SRC / 'shell.html').read_text()

# فحوص: لا "//" ولا "/*" داخل النصوص (مزلق Apps Script)، ولا وسم إغلاق السكربت
bad = 0
for name, js in parts.items():
    if name == 'assets.js': continue
    if '</script' in js.lower(): bad += 1; print('SCRIPT CLOSE in', name)
    for m in re.finditer(r'"(?:[^"\\\n]|\\.)*"|\'(?:[^\'\\\n]|\\.)*\'', js):
        s = m.group(0)
        if ('//' in s or '/*' in s or '*/' in s) and name != 'config.js':
            bad += 1; print('STRING PITFALL', name, s[:80])

# ١) الموقع المنشور: كل ملف منفصل برقم إصدار، فيحفظه المتصفح ولا ينزّله إلا إذا تغيّر
def ver(t): return hashlib.sha1(t.encode()).hexdigest()[:10]
for name, js in parts.items(): (DOCS / 'js' / name).write_text(js)
html = shell.replace('<!--FILE:assets.js-->', '<script src="js/config.js?v=%s"></script>\n<!--FILE:assets.js-->' % ver(parts['config.js']))
for m in re.findall(r'<!--FILE:([\w.-]+)-->', shell):
    html = html.replace('<!--FILE:%s-->' % m, '<script src="js/%s?v=%s"></script>' % (m, ver(parts[m])))
html = html.replace('<!--PACKS-->', '')
(DOCS / 'index.html').write_text(html)
(DOCS / '.nojekyll').write_text('')
# تطبيق على الشاشة الرئيسية ومعاينة الرابط
import json
PWA = ROOT / 'assets/pwa'
(DOCS / 'icons').mkdir(exist_ok=True)
for n in ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon-64.png']:
    if (PWA / n).exists(): shutil.copy(PWA / n, DOCS / 'icons' / n)
if (PWA / 'og.png').exists(): shutil.copy(PWA / 'og.png', DOCS / 'og.png')
(DOCS / 'manifest.webmanifest').write_text(json.dumps({
    'name': 'البوابة الإعلامية للبرامج الإلكترونية', 'short_name': 'البوابة الإعلامية', 'lang': 'ar', 'dir': 'rtl',
    'start_url': './', 'scope': './', 'display': 'standalone', 'background_color': '#f3f1ed', 'theme_color': '#2d4d24',
    'icons': [{'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
              {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
              {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]
}, ensure_ascii=False, indent=1))

# ٢) ملف واحد للتجربة المحلية
one = shell.replace('<!--FILE:assets.js-->', "<script>\nconst API_URL = '';\n</script>\n<!--FILE:assets.js-->")   # التجربة المحلية لا تتصل بالخادم
for m in re.findall(r'<!--FILE:([\w.-]+)-->', shell):
    one = one.replace('<!--FILE:%s-->' % m, '<script>\n' + parts[m] + '\n</script>')
packs = ''
pdir = ROOT / 'packs_local'
if pdir.exists():
    for p in sorted(pdir.glob('*.js')):
        packs += '<script>\ntry {\n' + p.read_text() + '\n} catch (e) { console.error("pack", e); }\n</script>\n'
(DIST / 'index.html').write_text(one.replace('<!--PACKS-->', packs))
(DIST / 'main.js').write_text('\n'.join(parts[f] for f in ORDER))
shutil.copy(SRC / 'Code.gs', DIST / 'Code.gs')
print('docs', sum((DOCS / 'js' / n).stat().st_size for n in parts) // 1024, 'KB', '| single file', len(one) // 1024, 'KB', '| api', bool(api_url), '| pitfalls', bad)
