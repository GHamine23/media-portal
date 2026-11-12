import os; _R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
"""بوت أثر: التطبيق المصغّر داخل تيليجرام (بمحاكي Telegram.WebApp وبيانات موقّعة حقيقية): طلب الدخول، والموافقة، والدخول، والتسليم في المحادثة، وكلمة سر للموقع، وبطاقات الإدارة."""
import asyncio, sys, json
sys.path.insert(0, _R + '/v6')
from t6 import setup, URL, OUT
from playwright.async_api import async_playwright
APP = URL.replace('/index.html', '/app.html')
TOKEN = '555666777:AtharBotTokenAtharBotTokenAtharBotTok'
fails = []
def ok(c, m): print(('✓ ' if c else '✗ ') + m); (None if c else fails.append(m))
SIGN = """async function (a) {
  const enc = new TextEncoder(), f = { auth_date: String(Math.floor(Date.now() / 1000)), query_id: 'AAQ1', user: JSON.stringify(a.user) };
  const dcs = Object.keys(f).sort().map(k => k + '=' + f[k]).join('\\n');
  const k1 = await crypto.subtle.importKey('raw', enc.encode('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const secret = await crypto.subtle.sign('HMAC', k1, enc.encode(a.token));
  const k2 = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const h = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', k2, enc.encode(dcs)))).map(b => b.toString(16).padStart(2, '0')).join('');
  return Object.keys(f).map(k => k + '=' + encodeURIComponent(f[k])).join('&') + '&hash=' + h;
}"""
MOCK = """window.__tg = { back: 0, closed: 0 };
window.Telegram = { WebApp: { initData: %s, colorScheme: 'light', ready: function () {}, expand: function () {}, onEvent: function () {}, close: function () { __tg.closed++; },
  BackButton: { onClick: function () {}, show: function () { __tg.back = 1; }, hide: function () { __tg.back = 0; } }, HapticFeedback: { notificationOccurred: function () {} } } };"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 1280, 'height': 860})
        pg = await ctx.new_page(); errs = await setup(pg)
        await pg.evaluate("GAS._props.ATHAR_BOT = %s; GAS._props.ATHAR_BOT_USER = 'mediaManarMuslihen_ai'; GAS._props.ATHAR_HOOK = 'sec'; DEMO.tick()" % json.dumps(TOKEN))
        # المدير: بطاقة بوت أثر في الإعدادات، وقسم الطلبات، وزر «اربط تيليجرام» في حسابي
        await pg.goto(URL + '#/admin/settings'); await pg.wait_for_timeout(2500)
        t = await pg.inner_text('#abody'); ok('بوت أثر' in t and 'mediaManarMuslihen_ai' in t, 'settings: Athar bot card with status')
        await pg.screenshot(path=OUT + 'tg_settings.png')
        await pg.goto(URL + '#/account'); await pg.wait_for_timeout(1800)
        ok('اربط تيليجرام' in await pg.inner_text('main, body'), 'account page: link Telegram button')
        SALEM = {'id': 4242, 'first_name': 'سالم', 'username': 'salem_k'}
        init = await pg.evaluate(SIGN, {'token': TOKEN, 'user': SALEM})
        await pg.close()   # صفحة واحدة مفتوحة في كل مرة: حالة الخادم التجريبي في المتصفح نفسه
        merrs = []
        async def mini(route):
            m = await ctx.new_page(); m.set_default_timeout(60000)
            await m.set_viewport_size({'width': 390, 'height': 800})
            await m.route('https://telegram.org/**', lambda r: r.fulfill(status=200, content_type='text/javascript', body=''))
            await m.add_init_script(MOCK % json.dumps(init)); m.on('pageerror', lambda e: merrs.append(str(e)))
            await m.goto(APP + route); await m.wait_for_timeout(6000); return m
        async def admin(h):
            a = await ctx.new_page(); await a.goto(URL + h); await a.wait_for_timeout(6000)
            for _ in range(3):
                if await a.query_selector('.modal'): await a.keyboard.press('Escape'); await a.wait_for_timeout(300)
            return a
        m = await mini('?tg=1&r=%2Fsections')
        ok(await m.evaluate("TG6.on() && document.documentElement.classList.contains('tgapp')"), 'mini app detected Telegram')
        t = await m.inner_text('body'); ok('اطلب الدخول' in t, 'unknown user sees the request form')
        await m.screenshot(path=OUT + 'tg_request.png')
        await m.fill('.tgx input[aria-label="اسم الدخول"]', 'salem.k'); await m.click('.tgx button[type=submit]'); await m.wait_for_timeout(1500)
        ok('يتم مراجعة حسابك' in await m.inner_text('body'), 'request sent → waiting screen')
        await m.screenshot(path=OUT + 'tg_pending.png'); await m.close()
        # الموافقة من لوحة المدير
        pg = await admin('#/admin/tgreq')
        t = await pg.inner_text('#abody'); ok('سالم' in t and 'salem.k' in t and 'قبول بحساب جديد' in t, 'admin sees the Telegram request')
        await pg.screenshot(path=OUT + 'tg_admin_req.png')
        await pg.click('#abody button:has-text("قبول بحساب جديد")'); await pg.wait_for_timeout(2500)
        ok('قُبل' in await pg.inner_text('#abody'), 'approved from the admin panel')
        sent = await pg.evaluate("(window.DEMO_TG||[]).filter(x => String(x.payload && x.payload.chat_id) === '4242').map(x => x.url.split('/').pop())")
        ok(sent.count('sendWidget') == 1 and len(sent) == 1, 'welcome + tour in ONE card: ' + str(sent))
        await pg.close()
        # الدخول بعد القبول
        m = await mini('?tg=1&r=%2Fsections')
        ok(await m.evaluate("!!V6.me && V6.me.username === 'salem.k' && /#tg#/.test(V6.token) && !/#tg#/.test(localStorage.getItem('mp6.token') || '')"), 'logged in by Telegram; session not stored in the browser')
        ok(await m.evaluate("location.hash === '#/sections' && __tg.back === 1"), 'opened on the requested page, Telegram back button shown')
        await m.screenshot(path=OUT + 'tg_app_sections.png')
        # التسليم في المحادثة
        await m.evaluate("go('#/e/ishraq/ann_panel')"); await m.wait_for_timeout(7000)
        await m.evaluate("document.querySelectorAll('.coach,.gintro,.modal').forEach(x=>x.remove())")
        await m.evaluate("window.checkPlaceholders = async function () { return true; }; exportImg6('png')"); await m.wait_for_timeout(5000)
        docs = await m.evaluate("(window.DEMO_TG||[]).filter(x => /sendDocument$/.test(x.url) && String(x.payload.chat_id) === '4242').length")
        ok(docs == 1, 'download → design sent to the chat as a document')
        ok('وصلك في المحادثة' in await m.inner_text('body'), 'confirmation shown')
        await m.screenshot(path=OUT + 'tg_delivered.png'); await m.close()
        # التصميم السريع: الاقتراحات مباشرة، و«أرسله لي» يصل المحادثة بلا فتح المحرر
        import urllib.parse as up
        qr = '/make?quick=1&prog=academy&tid=ishraq&type=ann&size=post&idea=' + up.quote('لقاء بيوت مطمئنة مع د. محمد الخميس ٨:٣٠ مساء')
        m = await mini('?tg=1&r=' + up.quote(qr, safe=''))
        await m.wait_for_selector('.mkcard .mksend', timeout=60000)
        ok(await m.locator('.mkcard').count() >= 2 and not await m.query_selector('.gx-intro'), 'quick design opens the suggestions directly, no intro popup')
        await m.screenshot(path=OUT + 'tg_quick.png')
        n0 = await m.evaluate("(window.DEMO_TG||[]).filter(x => /sendDocument$/.test(x.url)).length")
        await m.locator('.mkcard .mksend').first.click(); await m.wait_for_timeout(5000)
        n1 = await m.evaluate("(window.DEMO_TG||[]).filter(x => /sendDocument$/.test(x.url) && String(x.payload.chat_id) === '4242').length")
        ok(n1 == n0 + 1 or n1 >= 2, 'quick «send it to me» delivers the design to the chat: %s→%s' % (n0, n1))
        await m.close()
        # كلمة سر للموقع
        m = await mini('?tg=1&r=%2Ftgpw')
        t = await m.inner_text('body'); ok('كلمة سر للموقع' in t and 'salem.k' in t, 'site-password page explains why')
        await m.screenshot(path=OUT + 'tg_pw.png')
        pw = m.locator('.tgx input[type=password]'); await pw.nth(0).fill('SalemPass123'); await pw.nth(1).fill('SalemPass123')
        await m.click('.tgx button[type=submit]'); await m.wait_for_timeout(1500)
        ok('صارت لك كلمة سر' in await m.inner_text('body'), 'site password set')
        await m.close()
        pg = await admin('#/')
        r = await pg.evaluate("DEMO.call('auth_login', ['salem.k', 'SalemPass123']).then(r => !!JSON.parse(r).token)")
        ok(r, 'the same account now logs into the normal site')
        # شاشة الدخول العادية تنبّه لمستخدمي البوت
        await pg.evaluate("localStorage.removeItem('mp6.token')"); await pg.goto(URL + '#/login'); await pg.reload(); await pg.wait_for_timeout(3000)
        ok('بوت تيليجرام' in await pg.inner_text('body'), 'login screen explains the Telegram password')
        ok(not [e for e in merrs if 'telegram' not in e.lower()], 'no page errors in the mini app: ' + str(merrs[:3]))
        await b.close()
    print('FAILS', fails)
asyncio.run(main())
