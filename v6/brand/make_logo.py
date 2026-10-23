"""يرسم شعار المنصة من خط ثمانية مسارات SVG (الشعار استخدام مسموح في ترخيص الخط، ولا يُضمَّن ملف الخط نفسه).
   يُخرج: logo_a (سطر)، logo_b (كلمة بارزة)، logo_c (علامة + كلمة)، mark (العلامة وحدها)."""
import uharfbuzz as hb, pathlib
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
FD = pathlib.Path('/home/claude/fonts_thm'); OUT = pathlib.Path(__file__).resolve().parent
_cache = {}
def text(fontfile, s, size):
    """يعيد (d, xmin, ymin, xmax, ymax) بإحداثيات SVG (الأسفل موجب)، والخط الأساسي عند y=0"""
    if fontfile not in _cache:
        tt = TTFont(str(fontfile)); _cache[fontfile] = (tt, tt.getGlyphSet(), tt['head'].unitsPerEm, tt.getGlyphOrder(), hb.Font(hb.Face(hb.Blob.from_file_path(str(fontfile)))))
    tt, gs, upem, order, font = _cache[fontfile]
    buf = hb.Buffer(); buf.add_str(s); buf.guess_segment_properties(); hb.shape(font, buf, {})
    sc = size / upem; pen = SVGPathPen(gs); bp = BoundsPen(gs); x = 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        g = gs[order[info.codepoint]]; m = (sc, 0, 0, -sc, x + pos.x_offset * sc, -pos.y_offset * sc)
        g.draw(TransformPen(pen, m)); g.draw(TransformPen(bp, m)); x += pos.x_advance * sc
    b = bp.bounds
    return pen.getCommands(), b[0], b[1], b[2], b[3]
def place(t, dx, dy, fill='#000'):
    return f'<path fill="{fill}" d="{t[0]}" transform="translate({dx:.1f},{dy:.1f})"/>'
def save(name, w, h, body):
    (OUT / name).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}">{body}</svg>')
D = lambda w: FD / f'thmanyahserifdisplay-{w}.otf'
T = lambda w: FD / f'thmanyahseriftext-{w}.otf'
pad = 4
# أ) «منصّة» صغيرة فوق «الأثـــر الإعلامي» من اليمين
big = text(D('Bold'), 'الأثـــر الإعلامي', 100); sm = text(T('Medium'), 'منصّة', 30)
W = big[3] - big[1] + 2 * pad
top_sm = pad - sm[2]; base_big = top_sm + (sm[4] - sm[2]) + 8 - big[2]
H = base_big + big[4] + pad
save('logo_a.svg', W, H, place(sm, W - pad - sm[3], top_sm) + place(big, pad - big[1], base_big))
# ب) «أثـــر» بارزة وتحتها «منصة الأثر الإعلامي»
w1 = text(D('Black'), 'أثـــر', 160); cap = text(T('Regular'), 'منصة الأثر الإعلامي', 30)
W = max(w1[3] - w1[1], cap[3] - cap[1]) + 2 * pad
b1 = pad - w1[2]; bc = b1 + w1[4] + 18 - cap[2]
save('logo_b.svg', W, bc + cap[4] + pad, place(w1, W - pad - w1[3], b1) + place(cap, W - pad - cap[3], bc, '#5e5e5e'))
# ج) دائرة سوداء فيها «أثر» صغيرة، ثم الكلمة
mk = text(D('Black'), 'أثر', 44); word = text(D('Bold'), 'الأثـــر الإعلامي', 64)
R = 46; gap = 18
wordW = word[3] - word[1]; W = wordW + gap + 2 * R + 2 * pad
H = max(2 * R, word[4] - word[2]) + 2 * pad
cy = H / 2; cx = W - pad - R
mark = f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{R}" fill="#000"/>' + place(mk, cx - (mk[1] + mk[3]) / 2, cy - (mk[2] + mk[4]) / 2, '#fff')
save('logo_c.svg', W, H, mark + place(word, pad - word[1], cy - (word[2] + word[4]) / 2 + 4))
save('mark.svg', 2 * R + 2, 2 * R + 2, f'<circle cx="{R+1}" cy="{R+1}" r="{R}" fill="#000"/>' + place(mk, R + 1 - (mk[1] + mk[3]) / 2, R + 1 - (mk[2] + mk[4]) / 2, '#fff'))
print('ok')
