"""تصدير أفلام الحركة إلى فيديو MP4 بصوت المؤثرات (بلا موسيقى).

يرسم الإطارات واحداً واحداً بالمحرك نفسه (renderMotionFrame في v6/js/motion6.js) داخل Chromium بلا واجهة،
ويولّد المؤثرات الصوتية بالدوال نفسها في سياق صوتي غير متصل (OfflineAudioContext) ثم يضبطها numpy ويكتبها WAV،
ثم يجمع ffmpeg الصورة والصوت.

الاستعمال (من جذر المستودع، بعد python3 v6/build6.py):
  python3 v6/motion_render.py                          فيلم الإطلاق، طولي 1080×1920 وأفقي 1920×1080
  python3 v6/motion_render.py --clip cal --formats h   مقطع قسم بعينه
  python3 v6/motion_render.py --stills 0.5,3,12        صور PNG لأزمنة محددة للمراجعة
  python3 v6/motion_render.py --thm ~/fonts/thmanyah   بخطوط ثمانية المحلية (لا تُرفع للمستودع)
المخرجات في --out (افتراضياً مجلد المسودات، لا داخل المستودع).
"""
import argparse, asyncio, base64, functools, http.server, os, pathlib, shutil, socketserver, subprocess, sys, threading, time, wave
import numpy as np
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEF_OUT = '/tmp/claude-0/-home-claude/c52b6293-5ec5-5831-a8f0-81095c1243b7/scratchpad/v6/motion/'
FFMPEG = shutil.which('ffmpeg') or '/usr/local/bin/ffmpeg'
SIZES = {'v': (1080, 1920), 'h': (1920, 1080)}


def serve(thm):
    """خادم محلي مؤقت لجذر المستودع (و/thm/ لخطوط ثمانية إن وُجدت)."""
    class H(http.server.SimpleHTTPRequestHandler):
        def translate_path(self, path):
            p = path.split('?')[0]
            if thm and '/thm/' in p: return os.path.join(thm, os.path.basename(p))
            return super().translate_path(path)
        def log_message(self, *a): pass
    httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(H, directory=str(ROOT)))
    httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, 'http://127.0.0.1:%d/v6/motion_render.html' % httpd.server_address[1]


async def open_page(b, url, w, hh, clip, thm, ac):
    ctx = await b.new_context(viewport={'width': w, 'height': hh}, device_scale_factor=1)
    pg = await ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    q = '?w=%d&h=%d&clip=%s%s%s' % (w, hh, clip, '&thm=1' if thm else '', '&ac=' + ac if ac else '')
    await pg.goto(url + q)
    await pg.evaluate('moReady')
    if errs: raise RuntimeError('page errors: %s' % errs[:3])
    return ctx, pg


async def audio(b, url, clip, out, thm):
    ctx, pg = await open_page(b, url, 1920, 1080, clip, thm, None)
    r = await pg.evaluate("MO.audio(%r, 48000)" % clip)
    await ctx.close()
    L = np.frombuffer(base64.b64decode(r['L']), dtype=np.float32)
    R = np.frombuffer(base64.b64decode(r['R']), dtype=np.float32)
    x = np.stack([L, R], 1).astype(np.float64)
    # ضبط: إزالة الانحراف، حدّ ناعم، ثم رفع القمة إلى -1 dBFS، وتلاشٍ قصير في الطرفين
    x -= x.mean(0)
    x = np.tanh(x * 1.15) / np.tanh(1.15)
    pk = np.abs(x).max() or 1.0
    x *= (10 ** (-1 / 20)) / pk
    n = len(x); f = int(0.01 * 48000)
    x[:f] *= np.linspace(0, 1, f)[:, None]; x[-f:] *= np.linspace(1, 0, f)[:, None]
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(48000); w.writeframes(pcm.tobytes())
    return r['dur'], r['n']


async def worker(b, url, clip, w, hh, fps, frames, seg, thm, ac, prog):
    ctx, pg = await open_page(b, url, w, hh, clip, thm, ac)
    ff = subprocess.Popen([FFMPEG, '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(fps), '-c:v', 'png', '-i', '-',
                           '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', str(fps), seg], stdin=subprocess.PIPE)
    cdp = await ctx.new_cdp_session(pg)
    for i in frames:
        await pg.evaluate('moFrame(%r, %f)' % (clip, i / fps))
        # التقاط سريع بلا ضغط مكلف (الجودة نفسها: PNG بلا فقد)
        r = await cdp.send('Page.captureScreenshot', {'format': 'png', 'optimizeForSpeed': True, 'captureBeyondViewport': False})
        ff.stdin.write(base64.b64decode(r['data'])); prog[0] += 1
    ff.stdin.close(); ff.wait(); await ctx.close()
    if ff.returncode: raise RuntimeError('ffmpeg failed for ' + seg)


async def render(args):
    out = pathlib.Path(args.out); out.mkdir(parents=True, exist_ok=True)
    httpd, url = serve(args.thm)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required', '--font-render-hinting=none'])
            ctx, pg = await open_page(b, url, 1920, 1080, args.clip, args.thm, args.ac)
            dur = await pg.evaluate('MO.info(%r, false).dur' % args.clip)
            await ctx.close()
            print('clip', args.clip, 'duration %.2fs' % dur)
            if args.stills:
                for fmt in args.formats.split(','):
                    w, hh = SIZES[fmt]
                    ctx, pg = await open_page(b, url, w, hh, args.clip, args.thm, args.ac)
                    for t in [float(x) for x in args.stills.split(',')]:
                        await pg.evaluate('moFrame(%r, %f)' % (args.clip, t))
                        f = out / ('%s_%s_%06.2f.png' % (args.clip, fmt, t)); await pg.screenshot(path=str(f)); print(f)
                    await ctx.close()
                return
            wav = str(out / (args.clip + '_sfx.wav'))
            adur, nev = await audio(b, url, args.clip, wav, args.thm)
            print('audio', wav, '%d events' % nev)
            n = int(round(dur * args.fps)) + 1
            for fmt in args.formats.split(','):
                w, hh = SIZES[fmt]; t0 = time.time()
                k = max(1, args.workers); chunks = [list(range(i * n // k, (i + 1) * n // k)) for i in range(k)]
                segs = [str(out / ('.%s_%s_%d.mp4' % (args.clip, fmt, i))) for i in range(k)]
                prog = [0]
                async def report():
                    while prog[0] < n:
                        await asyncio.sleep(10); print('  %s %d/%d frames (%.0fs)' % (fmt, prog[0], n, time.time() - t0), flush=True)
                rep = asyncio.ensure_future(report())
                await asyncio.gather(*[worker(b, url, args.clip, w, hh, args.fps, chunks[i], segs[i], args.thm, args.ac, prog) for i in range(k)])
                rep.cancel()
                lst = out / ('.%s_%s.txt' % (args.clip, fmt)); lst.write_text(''.join("file '%s'\n" % s for s in segs))
                name = out / ('%s_%s_%dx%d.mp4' % (args.clip, 'vertical' if fmt == 'v' else 'horizontal', w, hh))
                subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', str(lst), '-i', wav,
                                '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-t', '%.3f' % ((n - 1) / args.fps + 1 / args.fps),
                                '-movflags', '+faststart', str(name)], check=True)
                for s in segs: os.remove(s)
                lst.unlink()
                print('video', name, '%.0fs render' % (time.time() - t0))
            await b.close()
    finally:
        httpd.shutdown()


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--clip', default='launch')
    ap.add_argument('--formats', default='v,h', help='v طولي 1080×1920، h أفقي 1920×1080')
    ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--workers', type=int, default=4)
    ap.add_argument('--out', default=DEF_OUT)
    ap.add_argument('--stills', default='', help='أزمنة بالثواني مفصولة بفواصل لتصدير صور PNG فقط')
    ap.add_argument('--thm', default='', help='مجلد خطوط ثمانية المحلية (اختياري)')
    ap.add_argument('--ac', default='', help='لون الواجهة بلا # (افتراضي 4f46e5)')
    a = ap.parse_args()
    if a.thm: a.thm = os.path.expanduser(a.thm)
    if not (ROOT / 'docs/v6/js/brand6.js').exists(): subprocess.run([sys.executable, str(ROOT / 'v6/build6.py')], check=True)
    asyncio.run(render(a))
