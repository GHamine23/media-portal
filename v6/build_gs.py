"""يبني ملف الخادم الواحد server/Code.gs من src/Code.gs: يضيف هويات الأكاديمية ومكتبة الخطوط المفتوحة."""
import json, pathlib, subprocess, urllib.parse
ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / 'src/Code.gs').read_text()
ids = json.loads(subprocess.check_output(['node', '-e', """
const fs=require('fs'), vm=require('vm'); const ctx={console}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[1],'utf8').replace(/^const /mg,'var '), ctx);
console.log(JSON.stringify(Object.keys(ctx.TRACKS).map(id=>{const t=ctx.TRACKS[id]; return {id, group:t.group, name:t.name, full:t.full, desc:t.desc||'', logo:t.logo, logos:t.logos||null, c:t.c};})));
""", str(ROOT / 'src/identities.js')]))
V = lambda f: urllib.parse.quote(f, safe='/')
fonts = []
def static(fid, label, d, files):
    for w, fn in files: fonts.append([fid, label, d + '/' + V(fn), str(w), 's'])
def var(fid, label, d, fn, rng): fonts.append([fid, label, d + '/' + V(fn), rng, 'v'])
static('tajawal', 'تجوال', 'tajawal', [(300, 'Tajawal-Light.ttf'), (400, 'Tajawal-Regular.ttf'), (500, 'Tajawal-Medium.ttf'), (700, 'Tajawal-Bold.ttf'), (800, 'Tajawal-ExtraBold.ttf'), (900, 'Tajawal-Black.ttf')])
static('zain', 'زين', 'zain', [(300, 'Zain-Light.ttf'), (400, 'Zain-Regular.ttf'), (700, 'Zain-Bold.ttf'), (800, 'Zain-ExtraBold.ttf'), (900, 'Zain-Black.ttf')])
static('plexar', 'بلكس العربي', 'ibmplexsansarabic', [(300, 'IBMPlexSansArabic-Light.ttf'), (400, 'IBMPlexSansArabic-Regular.ttf'), (500, 'IBMPlexSansArabic-Medium.ttf'), (600, 'IBMPlexSansArabic-SemiBold.ttf'), (700, 'IBMPlexSansArabic-Bold.ttf')])
static('almarai', 'المراعي', 'almarai', [(300, 'Almarai-Light.ttf'), (400, 'Almarai-Regular.ttf'), (700, 'Almarai-Bold.ttf'), (800, 'Almarai-ExtraBold.ttf')])
static('amiri', 'أميري', 'amiri', [(400, 'Amiri-Regular.ttf'), (700, 'Amiri-Bold.ttf')])
static('ruqaa', 'عارف رقعة', 'arefruqaa', [(400, 'ArefRuqaa-Regular.ttf'), (700, 'ArefRuqaa-Bold.ttf')])
static('lalezar', 'لاله‌زار', 'lalezar', [(400, 'Lalezar-Regular.ttf')])
var('beiruti', 'بيروتي', 'beiruti', 'Beiruti[wght].ttf', '200 900')
var('alexandria', 'الإسكندرية', 'alexandria', 'Alexandria[wght].ttf', '100 900')
var('readex', 'ريدكس', 'readexpro', 'ReadexPro[HEXP,wght].ttf', '160 700')
var('kufi', 'نوتو كوفي', 'notokufiarabic', 'NotoKufiArabic[wght].ttf', '100 900')
var('cairo', 'القاهرة', 'cairo', 'Cairo[slnt,wght].ttf', '200 1000')
var('changa', 'تشانجا', 'changa', 'Changa[wght].ttf', '200 800')
var('messiri', 'المسيري', 'elmessiri', 'ElMessiri[wght].ttf', '400 700')
var('reemkufi', 'ريم كوفي', 'reemkufi', 'ReemKufi[wght].ttf', '400 700')
var('marhey', 'مرحى', 'marhey', 'Marhey[wght].ttf', '300 700')
var('lemonada', 'ليمونادة', 'lemonada', 'Lemonada[wght].ttf', '300 700')
var('naskh', 'نوتو نسخ', 'notonaskharabic', 'NotoNaskhArabic[wght].ttf', '400 700')
var('baloo', 'بالو بهايجان', 'baloobhaijaan2', 'BalooBhaijaan2[wght].ttf', '400 800')
var('vazir', 'وزير متن', 'vazirmatn', 'Vazirmatn[wght].ttf', '100 900')
var('rubik', 'روبيك', 'rubik', 'Rubik[wght].ttf', '300 900')
var('handjet', 'هاندجت', 'handjet', 'Handjet[ELGR,ELSH,wght].ttf', '100 900')
out = src.replace('/*SEED_IDENTITIES*/[]', json.dumps(ids, ensure_ascii=False)).replace('/*OPEN_FONTS*/[]', json.dumps(fonts, ensure_ascii=False))
assert '/*SEED' not in out and '/*OPEN_FONTS' not in out
(ROOT / 'server').mkdir(exist_ok=True)
(ROOT / 'server/Code.gs').write_text(out)
print('server/Code.gs', len(out) // 1024, 'KB |', len(ids), 'identities |', len(fonts), 'font files')
