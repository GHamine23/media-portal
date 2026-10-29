/* إضافات على محاكي خدمات Apps Script (v6/gas/shim.js) بالقدر الذي تحتاجه منصة الأنشطة:
   التقويم، والمجلد الجذر في درايف، وتحليل CSV، والمنطقة الزمنية، والسجل.
   يعمل في Node (للاختبار) وفي المتصفح (وضع التجربة). */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  function extend(GAS, opt) {
    opt = opt || {};
    const OFF = (opt.offsetHours == null ? 3 : opt.offsetHours) * 3600000;   // Asia/Riyadh
    const TZ = opt.tz || 'Asia/Riyadh';
    const st = GAS._store();
    // درايف: المجلد الجذر وإنشاء مجلد فيه
    GAS.DriveApp.getRootFolder = function () { return GAS.DriveApp.getFolderById('root'); };
    GAS.DriveApp.createFolder = function (n) { return GAS.DriveApp.getRootFolder().createFolder(n); };
    void st;
    // تنسيق التاريخ بالمنطقة الزمنية (يدعم yyyy MM dd HH H mm)
    function pad(n) { return ('0' + n).slice(-2); }
    GAS.Utilities.formatDate = function (d, tz, fmt) {
      const x = new Date(d.getTime() + OFF);
      return fmt.replace('yyyy', x.getUTCFullYear()).replace('MM', pad(x.getUTCMonth() + 1)).replace('dd', pad(x.getUTCDate()))
        .replace('HH', pad(x.getUTCHours())).replace(/\bH\b/, x.getUTCHours()).replace('mm', pad(x.getUTCMinutes()));
    };
    GAS.Utilities.parseCsv = function (text) {
      const rows = []; let row = [], cell = '', q = false;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
        else if (ch === '"') q = true;
        else if (ch === ',') { row.push(cell); cell = ''; }
        else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
        else cell += ch;
      }
      if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
      return rows;
    };
    GAS.Session = { getScriptTimeZone: function () { return TZ; } };
    GAS.Logger = { log: function (s) { GAS._logs = GAS._logs || []; GAS._logs.push(String(s)); } };

    /* ---------- التقويم ---------- */
    const CAL = GAS._cal = opt.cal || { cals: {}, seq: 1 };
    function mkCal(id, name, own) { if (!CAL.cals[id]) CAL.cals[id] = { id: id, name: name, own: own !== false, events: {} }; return CAL.cals[id]; }
    mkCal('me@demo', 'التقويم الأساسي', true);
    function wrapEv(c, e) {
      return {
        getId: function () { return e.id; }, getTitle: function () { return e.title; }, getDescription: function () { return e.desc; },
        getStartTime: function () { return new Date(e.start); }, getEndTime: function () { return new Date(e.end); }, isAllDayEvent: function () { return !!e.allDay; },
        getColor: function () { return e.color || ''; },
        setTitle: function (t) { e.title = t; return this; }, setDescription: function (d) { e.desc = d; return this; },
        setTime: function (s, en) { e.start = s.getTime(); e.end = en.getTime(); e.allDay = false; return this; },
        setAllDayDate: function (d) { e.start = d.getTime(); e.end = d.getTime() + 864e5; e.allDay = true; return this; },
        setColor: function (col) { e.color = col; return this; },
        deleteEvent: function () { delete c.events[e.id]; }
      };
    }
    function wrapCal(c) {
      return {
        getId: function () { return c.id; }, getName: function () { return c.name; }, isOwnedByMe: function () { return c.own; },
        createEvent: function (t, s, en, o) { const e = { id: 'ev' + (CAL.seq++) + '@google.com', title: t, start: s.getTime(), end: en.getTime(), desc: (o && o.description) || '', allDay: false }; c.events[e.id] = e; return wrapEv(c, e); },
        createAllDayEvent: function (t, d, o) { const e = { id: 'ev' + (CAL.seq++) + '@google.com', title: t, start: d.getTime(), end: d.getTime() + 864e5, desc: (o && o.description) || '', allDay: true }; c.events[e.id] = e; return wrapEv(c, e); },
        getEventById: function (id) { const e = c.events[id]; return e ? wrapEv(c, e) : null; },
        _events: function () { return Object.keys(c.events).map(function (k) { return c.events[k]; }); }
      };
    }
    GAS.CalendarApp = {
      getDefaultCalendar: function () { return wrapCal(CAL.cals['me@demo']); },
      getCalendarById: function (id) { return CAL.cals[id] ? wrapCal(CAL.cals[id]) : null; },
      getAllCalendars: function () { return Object.keys(CAL.cals).map(function (k) { return wrapCal(CAL.cals[k]); }); },
      getAllOwnedCalendars: function () { return Object.keys(CAL.cals).filter(function (k) { return CAL.cals[k].own; }).map(function (k) { return wrapCal(CAL.cals[k]); }); },
      createCalendar: function (name) { const id = 'c' + (CAL.seq++) + '@group.calendar.google.com'; return wrapCal(mkCal(id, name, true)); },
      _add: mkCal
    };
    return GAS;
  }
  if (isNode) module.exports = extend; else root.GAS_EXT = extend;
})(typeof window !== 'undefined' ? window : this);
