import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # جذر المستودع (يعمل في أي نسخة عمل)
"""اختبار معرفة «اسأل أثر» (v6/js/kb6.js): شكل الأقسام والأسئلة والمقاطع، وkbContext لكل صفحة ودور وسؤال (الصلة، والحد، ولا نص إداري لغير المشرفين)،
وkbPageName، وأن كل رابط في الدليل يطابق مساراً حقيقياً في الموقع والتطبيق، وأن كل اسم زر بين «» موجود فعلاً في شيفرة الواجهة."""
import asyncio, sys, re, glob, json
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT
from playwright.async_api import async_playwright
APP = URL.replace('index.html', 'app.html')
def ok(c, m): print(('✓ ' if c else '✗ ') + m); return c

# أسماء مفاهيم لا أزراراً (مسموح ألا تظهر حرفياً في الواجهة)
CONCEPTS = {'اسأل الإشراف'}
def label_check():
    kb = open(_R + '/v6/js/kb6.js').read()
    files = [f for f in glob.glob(_R + '/v6/js/*.js') + glob.glob(_R + '/v6/app/js/*.js') + glob.glob(_R + '/src/*.js') if not f.endswith('kb6.js')]
    # رسائل الخادم تظهر للمستخدم كما هي (تنبيهات وأخطاء)، فتُقبل من Code.gs أيضاً
    src = ''.join(open(f).read() for f in files + [_R + '/src/Code.gs']).replace('\\n', '\n')
    labels = sorted(set(q.strip() for q in re.findall(r'«([^«»\n]+)»', kb)))
    miss = [q for q in labels if q not in CONCEPTS and not any(c and c in src for c in [q, q.rstrip('…').strip(), q.split('…')[0].strip()])]
    return labels, miss

async def main():
    labels, miss = label_check()
    ok(not miss, 'every quoted UI label («…») exists in the UI code: %d labels%s' % (len(labels), (' · missing: ' + '، '.join(miss)) if miss else ''))
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        errs = await setup(pg)
        st = await pg.evaluate("""(function(){
          const ids = KB_SECTIONS.map(s=>s.id), badRe = [], badShape = [];
          KB_SECTIONS.forEach(s=>{ if(!s.id||!s.title||!Array.isArray(s.routes)||typeof s.keywords!=='string'||typeof s.text!=='string'||s.text.length<120) badShape.push(s.id);
            (s.routes||[]).forEach(r=>{ try{ new RegExp(r);}catch(e){ badRe.push(s.id+':'+r);} });
            if (s.roles && s.roles.some(r=>['super','sup','user'].indexOf(r)<0)) badShape.push(s.id+':roles'); });
          return { n: KB_SECTIONS.length, uniq: new Set(ids).size === ids.length, badRe, badShape, chars: KB_SECTIONS.reduce((a,s)=>a+s.text.length,0),
            faq: KB_FAQ.length, faqBad: KB_FAQ.filter(f=>!f.q||!f.a||f.a.length<20).length, clips: Object.keys(KB_CLIPS).sort().join(','),
            admin: KB_SECTIONS.filter(s=>s.roles).length, fns: [typeof kbContext, typeof kbPageName].join(',') };})()""")
        ok(st['uniq'] and not st['badRe'] and not st['badShape'], 'KB_SECTIONS shape: %d sections, %d chars of manual, %d admin-only; bad: %s' % (st['n'], st['chars'], st['admin'], st['badRe'] + st['badShape']))
        ok(25 <= st['faq'] <= 40 and not st['faqBad'], 'KB_FAQ: %d questions with answers' % st['faq'])
        ok(st['clips'] == 'admin,app,cal,editor,gallery,home,make,mine,publish,slides', 'KB_CLIPS ids: ' + st['clips'])
        ok(st['fns'] == 'function,function', 'kbContext and kbPageName exposed')

        async def ctx(route, role, extra=None):
            return await pg.evaluate("([r,ro,x]) => kbContext(r, ro, x)", [route, role, extra or {}])
        # الصفحة الحالية تجلب قسمها
        c = await ctx('#/', 'user')
        ok('## الصفحة الرئيسية' in c and 'الصفحة الحالية: الرئيسية' in c and 'نبذة عن المنصة' in c and 'دليل الأماكن' in c, 'home: overview + home section + index (%d chars)' % len(c))
        c = await ctx('#/e/ishraq/ann_panel', 'user', {'tab': 'colors'})
        ok('الصفحة الحالية: المحرر — تبويب الألوان' in c and '## المحرر — تبويب الألوان' in c and '## المحرر: الشريط العلوي والأساسيات' in c, 'editor + colors tab: tab section and editor basics (%d chars)' % len(c))
        c = await ctx('#/e/ishraq/ann_panel', 'user', {'tab': 'pub', 'question': 'لماذا لا يرسل التصميم إلى القناة؟'})
        ok('## المحرر — تبويب النشر' in c and '## لا يُرسل إلى القناة' in c, 'editor publish tab + question → publish + telegram troubleshooting')
        c = await ctx('#/d/abc', 'user', {'tab': 'imgs', 'deck': True, 'question': 'كيف أضيف فيديو يوتيوب'})
        ok('تبويب الوسائط' in c and '## العروض — الوسائط' in c, 'deck media tab named «الوسائط» and media section included')
        c = await ctx('#/cal', 'user')
        ok('## التقويم والمهام' in c and 'الصفحة الحالية: التقويم والمهام' in c, 'calendar route → calendar section (%d chars)' % len(c))
        c = await ctx('#/cal', 'user', {'question': 'كيف أصدّر المنشورات إلى إكسل؟'})
        ok('صدّر CSV' in c, 'calendar export question → «صدّر CSV»')
        # الأسئلة من أي صفحة
        qs = [('#/', 'الخط لا يتغير في التصميم', 'تبويب الخطوط'), ('#/', 'كيف أثبت التطبيق على الآيفون؟', 'تطبيق الجوال'), ('#/mine', 'نسيت كلمة السر', 'الدخول وكلمة المرور'),
              ('#/', 'البوت ليس مشرفا في القناة', 'لا يُرسل إلى القناة'), ('#/', 'أين المسودة؟ لم أحفظ التصميم', 'الحفظ والمسودات'), ('#/', 'كيف أغير لون الواجهة', 'المظهر'),
              ('#/', 'التذكير لم يصلني', 'المهام والتذكيرات'), ('#/', 'ما الفرق بين الانتقال وحركة العناصر', 'تبويب الحركة'), ('#/tips', 'الصورة كبيرة لا ترفع', 'تبويب الصور'),
              ('#/', 'أريد صلاحية الإرسال', 'الصلاحيات'), ('#/', 'كيف أرسل سؤالا للمشرف', 'ملاحظة للفريق'), ('#/make', 'بلغت حد اليوم', 'المساعد الذكي')]
        for r, q, want in qs:
            c = await ctx(r, 'user', {'question': q})
            ok(('## ' + want) in c or ('— ' + want) in c or want in c.split('دليل الأماكن')[0], 'question «%s» → %s' % (q, want))
        # الأدوار: لا نص إداري لغير المشرفين
        c = await ctx('#/admin/settings', 'user')
        ok('#/admin' not in c and 'الإدارة —' not in c and 'رمز البوت' not in c and 'لوحة الإدارة وأقسامها' not in c, 'admin route with role user → no admin text or links')
        c = await ctx('#/admin/settings', 'user', {'question': 'كيف أضيف مفتاح Gemini وأنشئ حساب جديد'})
        ok('#/admin' not in c and 'الإدارة — ' not in c, 'admin question with role user → still no admin sections')
        c = await ctx('#/admin/settings', 'super')
        ok('## الإدارة — الإعدادات' in c and 'الصفحة الحالية: لوحة الإدارة — الإعدادات' in c, 'admin settings for super → settings section')
        c = await ctx('#/admin/settings', 'sup')
        ok('## الإدارة — الإعدادات' not in c and '#/admin/settings' not in c, 'settings (super-only) hidden from programme supervisors')
        c = await ctx('#/admin/accounts', 'sup', {'question': 'كيف أنشئ حسابا جديدا لعضو'})
        ok('## الإدارة — الحسابات' in c, 'supervisor accounts question → accounts section')
        # الحد: كل صفحة × دور × أسئلة
        routes = ['#/', '#/login', '#/g/ishraq', '#/e/ishraq/ann_panel', '#/d/x', '#/s/ishraq', '#/p/x', '#/make', '#/mine', '#/cal', '#/cal?view=list', '#/account', '#/week', '#/reviews', '#/tips', '#/tips/color', '#/more', '#/tpl', '#/admin', '#/admin/settings', '#/admin/accounts']
        sizes = await pg.evaluate("""(rs) => { const out=[]; const Q=['', 'كيف أنشر وأجدول منشوراً متكرراً في القناة وأغيّر الخط واللون وأضيف صورة وفيديو يوتيوب؟', 'التطبيق آيفون تثبيت المهام التذكير الصلاحيات الإدارة الحسابات مفتاح البوت'];
          rs.forEach(r=>['user','sup','super'].forEach(ro=>Q.forEach(q=>['colors','fonts',''].forEach(t=>{ const c=kbContext(r,ro,{question:q,tab:t}); out.push([r,ro,c.length, ro==='user' && /#\\/admin|الإدارة — /.test(c)]); })))); return out; }""", routes)
        mx = max(x[2] for x in sizes); leak = [x for x in sizes if x[3]]
        ok(mx <= 8000, 'kbContext stays ≤ 8000 chars across %d combinations (max %d)' % (len(sizes), mx))
        ok(not leak, 'no admin text for role user in any combination')
        # اسم الصفحة
        names = await pg.evaluate("""[kbPageName('#/'), kbPageName('#/e/ishraq/ann_panel',{tab:'colors'}), kbPageName('#/e/ishraq/blank'), kbPageName('#/g/ishraq'), kbPageName('#/admin/fonts'), kbPageName('#/cal?d=2026-10-24'), kbPageName('#/d/x',{tab:'imgs',deck:true}), kbPageName('/mine')]""")
        ok(names[0] == 'الرئيسية' and names[1] == 'المحرر — تبويب الألوان' and 'صفحة بيضاء' in names[2] and names[3].startswith('معرض القوالب — هوية') and names[4] == 'لوحة الإدارة — الخطوط' and names[5] == 'التقويم والمهام' and names[6] == 'المحرر — تبويب الوسائط' and names[7] == 'تصاميمي', 'kbPageName: ' + ' | '.join(names))
        # الروابط: كل رابط في الدليل يطابق مساراً حقيقياً (لا المسار الاحتياطي)
        LINKS = """(function(){ const ls=new Set(); KB_SECTIONS.forEach(s=>{ if(s.link) ls.add(s.link); (s.text.match(/#\\/[^\\s)،.»]*/g)||[]).forEach(x=>ls.add(x)); }); KB_FAQ.forEach(f=>{ if(f.link) ls.add(f.link); });
          const real = ROUTES.slice(0, -1); return Array.from(ls).map(h=>{ const p=h.replace(/^#/,''); return [h, real.some(r=>r.re.test(p))]; }); })()"""
        site = await pg.evaluate(LINKS)
        bad = [h for h, k in site if not k]
        ok(site and not bad, 'site: all %d KB links match a real route%s' % (len(site), (' · broken: ' + ', '.join(bad)) if bad else ''))
        print('  links:', ' '.join(h for h, _ in site))
        print('  ERRORS', [e for e in errs if 'favicon' not in e][:6])
        # التطبيق: المعرفة محمّلة، ومساراته تطابق الروابط، والسياق يعرف أنه في التطبيق
        m = await b.new_page(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
        await m.goto(APP); await m.wait_for_timeout(500)
        me = await setup(m)
        await m.goto(APP + '#/'); await m.wait_for_timeout(1500)
        app = await m.evaluate(LINKS)
        bad = [h for h, k in app if not k]
        ok(app and not bad, 'app: all %d KB links match an app route%s' % (len(app), (' · broken: ' + ', '.join(bad)) if bad else ''))
        c = await m.evaluate("kbContext(location.hash, V6.me.role, {question: 'كيف أصل إلى أداة الألوان في المحرر؟', tab: ''})")
        ok('(في تطبيق الجوال)' in c, 'app context says it is in the mobile app')
        c = await m.evaluate("kbContext('#/e/ishraq/ann_panel', 'user', {tab: 'colors'})")
        ok('## المحرر في تطبيق الجوال' in c, 'app editor context includes the mobile editor section')
        open(OUT + 'kb_sample_editor_colors.txt', 'w').write(await pg.evaluate("kbContext('#/e/ishraq/ann_panel','user',{tab:'colors', question:'كيف أغير لون العنوان؟'})"))
        open(OUT + 'kb_sample_home_user.txt', 'w').write(await pg.evaluate("kbContext('#/','user',{})"))
        print('  samples:', OUT + 'kb_sample_editor_colors.txt')
        print('  APP ERRORS', [e for e in me if 'favicon' not in e][:6])
        await b.close()
if __name__ == '__main__': asyncio.run(main())
