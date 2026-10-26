"""يبني الإصدار السادس:
  docs/v6/          الموقع المنشور (معاينة حتى الإطلاق)، ملفات js منفصلة برقم إصدار
  dist6/index.html  صفحة تجربة محلية تشغّل الخادم نفسه داخل المتصفح (لا تُنشر)
لا أصول برامج ولا خطوط في هذا البناء: كلها تأتي من الخادم بعد الدخول."""
import hashlib, json, pathlib, re, shutil, sys
V6 = pathlib.Path(__file__).resolve().parent
ROOT = V6.parent; SRC = ROOT / 'src'
OUT = ROOT / 'docs' / ('v6' if '--root' not in sys.argv else '')
OUT = OUT if '--root' not in sys.argv else ROOT / 'docs'
(OUT / 'js').mkdir(parents=True, exist_ok=True)
api_url = (SRC / 'api_url.txt').read_text().strip()

brand = {k: (V6 / 'brand' / (k + '.svg')).read_text() if k != 'mark' else (V6 / 'brand/mark.svg').read_text() for k in ['logo_a', 'logo_b', 'logo_c', 'mark']}
brand_js = 'const BRAND = ' + json.dumps({'a': brand['logo_a'], 'b': brand['logo_b'], 'c': brand['logo_c'], 'mark': brand['mark']}, ensure_ascii=False) + ';\n'

parts = {}
parts['config.js'] = 'const API_URL = %s;\n' % json.dumps(api_url)
parts['konva.min.js'] = (V6 / 'vendor/konva.min.js').read_text()
for f in ['engine.js', 'identities.js', 'templates.js', 'templates2.js', 'templates3.js', 'templates4.js', 'core5.js', 'studio.js', 'slides.js', 'qr.js', 'ticons.js']:
    parts[f] = (SRC / f).read_text()
parts['brand6.js'] = brand_js
ORDER6 = ['core6.js', 'freetpl6.js', 'assets6.js', 'auth6.js', 'home6.js', 'sections6.js', 'updates6.js', 'motion6.js', 'kb6.js', 'guide6.js', 'about6.js', 'editor6.js', 'panels6.js', 'docs6.js', 'make6.js', 'caption6.js', 'cal6.js', 'slides6.js', 'tilawa6.js', 'lesson6.js', 'extras6.js', 'tips6.js', 'social6.js', 'mine6.js', 'admin6.js', 'pstats6.js', 'app6.js']
for f in ORDER6: parts[f] = (V6 / 'js' / f).read_text()
ORDER = ['config.js', 'konva.min.js', 'engine.js', 'identities.js', 'templates.js', 'templates2.js', 'templates3.js', 'templates4.js', 'core5.js', 'studio.js', 'slides.js', 'qr.js', 'ticons.js', 'brand6.js'] + ORDER6

bad = 0
for name in ORDER6:
    js = parts[name]
    if '</script' in js.lower(): bad += 1; print('SCRIPT CLOSE in', name)
def ver(t): return hashlib.sha1(t.encode()).hexdigest()[:10]
# بصمة الخادم المتوقعة (تطابق ما يضعه build_gs.py في server/Code.gs)
SRV = hashlib.sha1((SRC / 'Code.gs').read_text().encode()).hexdigest()[:8]
parts['admin6.js'] = parts['admin6.js'].replace('/*SRV_VER*/', SRV)
for n in ORDER: (OUT / 'js' / n).write_text(parts[n])
shell = (V6 / 'shell.html').read_text()
css = (V6 / 'style6.css').read_text()
# أوراق أنماط إضافية لكل قسم (v6/css/*.css) تُلحق بالترتيب الأبجدي، فلا تتزاحم التعديلات على ملف واحد
css += ''.join('\n/* ===== ' + f.name + ' ===== */\n' + f.read_text() for f in sorted((V6 / 'css').glob('*.css'))) if (V6 / 'css').exists() else ''
site = 'https://ghamine23.github.io/media-portal/' + ('' if '--root' in sys.argv else 'v6/')
shell = shell.replace('/*SITE*/', site).replace('<!--STYLE-->', '<style>\n' + css + '\n</style>').replace('<!--MARK-->', brand['mark'])
tags = '\n'.join('<script src="js/%s?v=%s"></script>' % (n, ver(parts[n])) for n in ORDER)
(OUT / 'index.html').write_text(shell.replace('<!--SCRIPTS-->', tags))
(OUT / '.nojekyll').write_text('') if '--root' in sys.argv else None
# خطوط مدمجة مفتوحة الترخيص (خط المصحف «أميري قرآن» برخصة OFL) — لا خطوط مرخّصة هنا
if (V6 / 'fonts').exists(): shutil.copytree(V6 / 'fonts', OUT / 'fonts', dirs_exist_ok=True)
# صفحة الاستماع العامة (رمز QR في المطبوعات): q.html#السورة.من-إلى.القارئ.التكرار
(OUT / 'q.html').write_text((V6 / 'q.html').read_text().replace('/*TLV*/', ver(parts['tilawa6.js'])))
# أيقونات التطبيق ومعاينة الرابط
ICONS = V6 / 'brand/png'
(OUT / 'icons').mkdir(exist_ok=True)
for n in ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png']:
    if (ICONS / n).exists(): shutil.copy(ICONS / n, OUT / 'icons' / n)
if (ICONS / 'og.png').exists(): shutil.copy(ICONS / 'og.png', OUT / 'og.png')
(OUT / 'manifest.webmanifest').write_text(json.dumps({
    'name': 'منصة الأثر الإعلامي', 'short_name': 'الأثر الإعلامي', 'lang': 'ar', 'dir': 'rtl', 'start_url': './', 'scope': './', 'display': 'standalone',
    'background_color': '#ffffff', 'theme_color': '#ffffff',
    'icons': [{'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'}, {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
              {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]}, ensure_ascii=False, indent=1))
# صفحة التجربة المحلية: نفس الملفات، مع الخادم في المتصفح
D = ROOT / 'dist6'; D.mkdir(exist_ok=True)
rel = '../docs/' + ('' if '--root' in sys.argv else 'v6/') + 'js/'
demo_tags = '<script>window.DEMO = true;</script>\n<script src="../v6/gas/shim.js"></script>\n<script src="../v6/demo6.js"></script>\n' + '\n'.join(
    '<script src="%s%s?v=%s"></script>' % (rel, n, ver(parts[n])) if n != 'config.js' else "<script>const API_URL = '';</script>" for n in ORDER)
(D / 'index.html').write_text(shell.replace('<!--SCRIPTS-->', demo_tags).replace('href="manifest.webmanifest"', 'href="#"'))
# ---- تطبيق الجوال (PWA): docs/app/ يعيد استعمال ملفات js نفسها من docs/v6/js ويضيف وحداته ----
APP = ROOT / 'docs' / 'app'; (APP / 'js').mkdir(parents=True, exist_ok=True); (APP / 'icons').mkdir(exist_ok=True)
APP_ORDER = ['ios6.js', 'mscreens.js', 'meditor.js', 'minstall.js', 'mapp.js']
app_parts = {n: (V6 / 'app' / 'js' / n).read_text() for n in APP_ORDER}
for n in APP_ORDER: (APP / 'js' / n).write_text(app_parts[n])
app_css = (V6 / 'app' / 'app.css').read_text()
app_css += ''.join('\n/* ===== ' + f.name + ' ===== */\n' + f.read_text() for f in sorted((V6 / 'app' / 'css').glob('*.css'))) if (V6 / 'app' / 'css').exists() else ''
app_shell = (V6 / 'app' / 'shell.html').read_text().replace('/*SITE*/', site.replace('v6/', 'app/')).replace('<!--STYLE-->', '<style>\n' + css + '\n</style>').replace('<!--APPSTYLE-->', '<style>\n' + app_css + '\n</style>').replace('<!--MARK-->', brand['mark'])
shared = [n for n in ORDER if n != 'app6.js']
app_tags = '\n'.join('<script src="../v6/js/%s?v=%s"></script>' % (n, ver(parts[n])) for n in shared) + '\n' + '\n'.join('<script src="js/%s?v=%s"></script>' % (n, ver(app_parts[n])) for n in APP_ORDER)
(APP / 'index.html').write_text(app_shell.replace('<!--SCRIPTS-->', app_tags))
for n in ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png']:
    if (ICONS / n).exists(): shutil.copy(ICONS / n, APP / 'icons' / n)
if (ICONS / 'og.png').exists(): shutil.copy(ICONS / 'og.png', APP / 'og.png')
(APP / 'manifest.webmanifest').write_text(json.dumps({
    'name': 'أثر — منصة الأثر الإعلامي', 'short_name': 'أثر', 'description': 'صمّم إعلانات برنامجك بهويته من هاتفك، وانشرها إلى القناة، وتابع تقويمك ومهامك.', 'lang': 'ar', 'dir': 'rtl', 'id': './', 'start_url': './?src=pwa', 'scope': './', 'display': 'standalone', 'orientation': 'portrait',
    'background_color': '#f2f2f7', 'theme_color': '#f2f2f7', 'categories': ['productivity', 'education'],
    'icons': [{'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'}, {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'}, {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}],
    'shortcuts': [{'name': 'اصنع إعلانك', 'url': './#/make'}, {'name': 'التقويم والمهام', 'url': './#/cal'}, {'name': 'تصاميمي', 'url': './#/mine'}]}, ensure_ascii=False, indent=1))
# عامل الخدمة: قائمة الملفات بإصداراتها حتى يُحدَّث الكاش مع كل بناء
sw = (V6 / 'app' / 'sw.js').read_text()
assets = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'] + ['../v6/js/%s?v=%s' % (n, ver(parts[n])) for n in shared] + ['js/%s?v=%s' % (n, ver(app_parts[n])) for n in APP_ORDER]
(APP / 'sw.js').write_text(sw.replace('/*ASSETS*/', json.dumps(assets)).replace('/*VER*/', ver(''.join(parts[n] for n in shared) + ''.join(app_parts.values()) + app_css + css)))
# نسخة التجربة للتطبيق
app_demo_tags = '<script>window.DEMO = true;</script>\n<script src="../v6/gas/shim.js"></script>\n<script src="../v6/demo6.js"></script>\n' + '\n'.join('<script src="%s%s?v=%s"></script>' % (rel, n, ver(parts[n])) if n != 'config.js' else "<script>const API_URL = '';</script>" for n in shared) + '\n' + '\n'.join('<script src="../docs/app/js/%s?v=%s"></script>' % (n, ver(app_parts[n])) for n in APP_ORDER)
(D / 'app.html').write_text(app_shell.replace('<!--SCRIPTS-->', app_demo_tags).replace('href="manifest.webmanifest"', 'href="#"'))
size = sum((OUT / 'js' / n).stat().st_size for n in ORDER)
print('v6 →', OUT.relative_to(ROOT), '|', size // 1024, 'KB js |', len(ORDER), 'files | api', bool(api_url), '| pitfalls', bad)

# الإطلاق: النسخة السادسة هي الموقع الأساسي (docs/) وتبقى نسخة في docs/v6 للروابط القديمة
if '--root' not in sys.argv:
    import subprocess; subprocess.run([sys.executable, __file__, '--root'], check=True)
