#!/usr/bin/env python3
"""يبني منصة الأنشطة في ملف HTML واحد.
   python3 anshita/tools/build.py            → docs/anshita/index.html (يتصل بالخادم الحقيقي)
   python3 anshita/tools/build.py --demo OUT → نسخة تجربة كاملة في OUT (الخادم داخل المتصفح، والخط مضمّن)
   لا تُرفع ملفات خط ثمانية إلى المستودع: نسخة الموقع تطلبها من الخادم، ونسخة التجربة لا تُنشر في المستودع."""
import base64, json, os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
A = os.path.join(ROOT, 'anshita')
rd = lambda p: open(p, encoding='utf-8').read()
LOGO_SRC = {'anshita': 'assets/logos/anshita.webp', 'sanabel': 'assets/logos/sanabel.webp', 'budhoor': 'assets/logos/budhoor.webp',
            'judhoor': 'assets/img/logo.png', 'ishraq': 'assets/logos/ishraq.webp', 'ithmar2': 'assets/logos/ithmar2.webp', 'ithmar3': 'assets/logos/ithmar3.webp'}
FONTS = [('thm-display', '500', 'thmanyahserifdisplay-Medium'), ('thm-display', '700', 'thmanyahserifdisplay-Bold'),
         ('thm-text', '400', 'thmanyahseriftext-Regular'), ('thm-text', '500', 'thmanyahseriftext-Medium'), ('thm-text', '700', 'thmanyahseriftext-Bold'),
         ('thm-sans', '400', 'thmanyahsans-Regular'), ('thm-sans', '500', 'thmanyahsans-Medium'), ('thm-sans', '700', 'thmanyahsans-Bold')]

def datauri(path):
    ext = path.rsplit('.', 1)[1].lower()
    mime = {'webp': 'image/webp', 'png': 'image/png', 'otf': 'font/otf'}[ext]
    return 'data:%s;base64,%s' % (mime, base64.b64encode(open(path, 'rb').read()).decode())

def page(config, logos, icon, demo=''):
    js = '\n'.join(rd(os.path.join(A, 'web', f)) for f in ['core.js', 'views1.js', 'cards.js', 'views2.js'])
    h = rd(os.path.join(A, 'web', 'shell.html'))
    h = h.replace('/*CSS*/', rd(os.path.join(A, 'web', 'app.css')))
    h = h.replace('/*CONFIG*/', json.dumps(config, ensure_ascii=False)).replace('/*LOGOS*/', json.dumps(logos, ensure_ascii=False))
    h = h.replace('/*ICON*/', icon).replace('/*DEMO*/', demo).replace('/*JS*/', js)
    return h

def live():
    out = os.path.join(ROOT, 'docs', 'anshita'); os.makedirs(os.path.join(out, 'img'), exist_ok=True)
    logos = {}
    for k, p in LOGO_SRC.items():
        name = k + '.' + p.rsplit('.', 1)[1]
        shutil.copyfile(os.path.join(ROOT, p), os.path.join(out, 'img', name))
        logos[k] = 'img/' + name
    api = rd(os.path.join(A, 'api_url.txt')).strip() if os.path.exists(os.path.join(A, 'api_url.txt')) else ''
    font_api = rd(os.path.join(ROOT, 'src', 'api_url.txt')).strip()
    cfg = {'api': api, 'fontApi': font_api, 'demo': False}
    open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(page(cfg, logos, 'img/anshita.webp'))
    print('→ docs/anshita/index.html', 'api=' + (api or '(لم يُضبط)'))

def demo(outp, fonts_dir, sem2):
    logos = {k: datauri(os.path.join(ROOT, p)) for k, p in LOGO_SRC.items()}
    fonts = []
    if fonts_dir and os.path.isdir(fonts_dir):
        files = os.listdir(fonts_dir)
        for fam, w, stem in FONTS:
            f = next((x for x in files if x.endswith(stem + '.otf')), None)
            if f: fonts.append({'family': fam, 'weight': w, 'url': datauri(os.path.join(fonts_dir, f))})
    cfg = {'demo': True, 'fonts': fonts or None}
    shim = rd(os.path.join(ROOT, 'v6', 'gas', 'shim.js'))
    ext = rd(os.path.join(A, 'test', 'shim_ext.js'))
    gs = rd(os.path.join(A, 'server', 'Code.gs'))
    sem = rd(sem2) if sem2 and os.path.exists(sem2) else '{}'
    bundle = ('<script>' + shim.replace('</script', '<\\/script') + '</script>\n<script>' + ext + '</script>\n'
              '<script>window.GAS_SRC=' + json.dumps(gs, ensure_ascii=False).replace('</', '<\\/') + ';window.SEM2=' + sem + ';</script>\n'
              '<script>' + rd(os.path.join(A, 'web', 'demo.js')) + '</script>')
    open(outp, 'w', encoding='utf-8').write(page(cfg, logos, logos['anshita'], bundle))
    print('→', outp, '(%d خطوط)' % len(fonts), '%.1f MB' % (os.path.getsize(outp) / 1e6))

if __name__ == '__main__':
    if '--demo' in sys.argv:
        i = sys.argv.index('--demo')
        demo(sys.argv[i + 1], sys.argv[i + 2] if len(sys.argv) > i + 2 else '', sys.argv[i + 3] if len(sys.argv) > i + 3 else '')
    else:
        live()
