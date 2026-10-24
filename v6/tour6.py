import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # جذر المستودع (يعمل في أي نسخة عمل)
"""جولة مراجعة: لقطة شاشة لكل صفحة ونافذة في نسخة التجربة (سطح مكتب وجوال) لمراجعتها واحدةً واحدة."""
import asyncio, sys, os
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT
from playwright.async_api import async_playwright
TOUR = OUT + 'tour/'
os.makedirs(TOUR, exist_ok=True)
async def shot(pg, name, full=True):
    await pg.screenshot(path=TOUR + name + '.png', full_page=full)
async def clean(pg):
    for _ in range(3):
        if await pg.query_selector('.coach'): await pg.evaluate("document.querySelector('.coach').remove()")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        await pg.goto(URL + '#/login'); await pg.wait_for_timeout(1200); await shot(pg, '00_login', False)
        errs = await setup(pg)
        await pg.wait_for_timeout(1500); await shot(pg, '01_home_top', False); await shot(pg, '01_home_full')
        for tid in ['ishraq']:
            await pg.goto(URL + '#/g/' + tid); await pg.wait_for_timeout(2500); await shot(pg, '02_gallery')
        await pg.goto(URL + '#/e/ishraq/ann_cards'); await pg.wait_for_timeout(3000); await clean(pg); await shot(pg, '03_editor', False)
        await pg.evaluate("ED.mode='full'; buildRail()")
        tabs = await pg.evaluate("Array.from(document.querySelectorAll('#e_rail button[data-tab]')).map(b=>b.dataset.tab)")
        print('rail tabs', tabs)
        for t in tabs:
            await pg.click('#e_rail button[data-tab=%s]' % t); await pg.wait_for_timeout(1200); await shot(pg, '04_panel_' + t, False)
        # النص المصاحب
        await pg.evaluate("captionDialog()"); await pg.wait_for_timeout(1500); await shot(pg, '05_caption', False)
        await pg.evaluate("Array.from(document.querySelectorAll('.seg button')).find(b=>b.textContent==='في موعد')?.click()"); await pg.wait_for_timeout(500); await shot(pg, '05_caption_sched', False)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        # الإضافات
        fns = await pg.evaluate("Object.keys(window).filter(k=>/^(extras|openExtras|showExtras|pImg|imgDialog|hadith|quran)/i.test(k))")
        print('extras fns', fns)
        await pg.goto(URL + '#/make'); await pg.wait_for_timeout(1500); await shot(pg, '06_make')
        await pg.goto(URL + '#/mine'); await pg.wait_for_timeout(1500); await shot(pg, '07_mine')
        await pg.goto(URL + '#/s/ishraq'); await pg.wait_for_timeout(2000); await shot(pg, '08_slides')
        await pg.goto(URL + '#/account'); await pg.wait_for_timeout(1500); await shot(pg, '09_account')
        await pg.goto(URL + '#/tips'); await pg.wait_for_timeout(1500); await shot(pg, '10_tips')
        await pg.goto(URL + '#/week'); await pg.wait_for_timeout(2000); await shot(pg, '11_week')
        await pg.goto(URL + '#/reviews'); await pg.wait_for_timeout(1500); await shot(pg, '12_reviews')
        for t in ['overview', 'archive', 'accounts', 'programs', 'assets', 'fonts', 'models', 'reviews', 'week', 'ai', 'tg', 'feedback', 'broadcasts', 'changelog', 'settings', 'audit']:
            await pg.goto(URL + '#/admin/' + t); await pg.wait_for_timeout(1800); await shot(pg, '13_admin_' + t)
        # الجرس والقوائم
        await pg.goto(URL + '#/'); await pg.wait_for_timeout(1500)
        btns = await pg.evaluate("Array.from(document.querySelectorAll('#top button')).map(b=>b.getAttribute('aria-label')||b.title||b.className)")
        print('top buttons', btns)
        print('ERRORS', [e for e in errs if 'favicon' not in e][:20])
        m = await b.new_page(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
        me = await setup(m)
        await m.wait_for_timeout(1200); await shot(m, '20_m_home')
        await m.goto(URL + '#/g/ishraq'); await m.wait_for_timeout(2000); await shot(m, '21_m_gallery')
        await m.goto(URL + '#/e/ishraq/ann_cards'); await m.wait_for_timeout(3000); await clean(m); await shot(m, '22_m_editor', False)
        await m.evaluate("captionDialog()"); await m.wait_for_timeout(1500); await shot(m, '23_m_caption', False)
        await m.keyboard.press('Escape')
        await m.goto(URL + '#/make'); await m.wait_for_timeout(1500); await shot(m, '24_m_make')
        await m.goto(URL + '#/mine'); await m.wait_for_timeout(1500); await shot(m, '25_m_mine')
        await m.goto(URL + '#/admin/tg'); await m.wait_for_timeout(1500); await shot(m, '26_m_admin_tg')
        print('M ERRORS', [e for e in me if 'favicon' not in e][:10])
        await b.close()
if __name__ == '__main__': asyncio.run(main())
