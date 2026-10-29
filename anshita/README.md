# منصة الأنشطة التربوية

تخطيط أنشطة المسارات ومتابعتها — أكاديمية الجيل الصاعد الإلكترونية.

- `server/Code.gs` الخادم على Google Apps Script (حساب الأنشطة): الحسابات، جدول الفصل، الأنشطة، تقويم جوجل، بوت التذكيرات.
- `web/` الواجهة (ملف واحد يُبنى): `core.js` النواة، `views1.js` الصفحات، `views2.js` النوافذ وصفحات الربط، `app.css` الهوية.
- `tools/build.py` يبني `docs/anshita/index.html` (الموقع المنشور) ونسخة التجربة.
- `test/test_server.js` يختبر الخادم كاملًا في Node عبر محاكي خدمات جوجل.

```
TZ=Asia/Riyadh node anshita/test/test_server.js
python3 anshita/tools/build.py
```

خط ثمانية لا يُرفع إلى المستودع (شرط الترخيص): يُحمَّل في الموقع من الخادم.
