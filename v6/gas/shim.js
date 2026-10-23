/* محاكي خدمات Google Apps Script بالقدر الذي يستعمله الخادم: يشغّل Code.gs في Node (للاختبار)
   وفي المتصفح (وضع التجربة) دون نشر. التخزين في الذاكرة، ويمكن حفظه وتحميله كاملاً. */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  function utf8(s) { return isNode ? Array.from(Buffer.from(String(s), 'utf8')) : Array.from(new TextEncoder().encode(String(s))); }
  function fromUtf8(bytes) { const u = Uint8Array.from(bytes.map(function (b) { return b & 255; })); return isNode ? Buffer.from(u).toString('utf8') : new TextDecoder().decode(u); }
  function signed(arr) { return Array.from(arr, function (b) { b &= 255; return b > 127 ? b - 256 : b; }); }
  function b64enc(bytes) { const u = Uint8Array.from(bytes.map(function (b) { return b & 255; })); if (isNode) return Buffer.from(u).toString('base64'); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
  function b64dec(s) { if (isNode) return signed(Buffer.from(String(s), 'base64')); const bin = atob(String(s)); const out = new Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return signed(out); }

  /* ---------- SHA-256 و HMAC (متزامن، ليعمل في المتصفح أيضاً) ---------- */
  const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  function sha256(bytes) {
    const m = bytes.map(function (b) { return b & 255; }), l = m.length * 8;
    m.push(0x80); while (m.length % 64 !== 56) m.push(0);
    for (let i = 7; i >= 0; i--) m.push(i > 3 ? 0 : (l >>> (i * 8)) & 255);
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19], w = new Array(64);
    for (let o = 0; o < m.length; o += 64) {
      for (let i = 0; i < 16; i++) w[i] = (m[o + i * 4] << 24) | (m[o + i * 4 + 1] << 16) | (m[o + i * 4 + 2] << 8) | m[o + i * 4 + 3];
      for (let i = 16; i < 64; i++) { const a = w[i - 15], b = w[i - 2]; const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3), s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0; }
      let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (let i = 0; i < 64; i++) {
        const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7)), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[i] + w[i]) | 0;
        const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10)), mj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0; H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    const out = []; H.forEach(function (x) { out.push((x >>> 24) & 255, (x >>> 16) & 255, (x >>> 8) & 255, x & 255); });
    return out;
  }
  function hmac(value, key) {
    let k = key.map(function (b) { return b & 255; }); if (k.length > 64) k = sha256(k); while (k.length < 64) k.push(0);
    const ip = k.map(function (b) { return b ^ 0x36; }), op = k.map(function (b) { return b ^ 0x5c; });
    return sha256(op.concat(sha256(ip.concat(value.map(function (b) { return b & 255; })))));
  }

  /* ---------- درايف ---------- */
  function makeStore() { return { files: {}, folders: {}, seq: 1 }; }
  let ST = makeStore();
  function nid(p) { return p + (ST.seq++).toString(36) + Math.random().toString(36).slice(2, 8); }
  function Iter(list) { let i = 0; return { hasNext: function () { return i < list.length; }, next: function () { return list[i++]; } }; }
  function Blob(bytes, mime, name) {
    this._b = bytes || []; this._m = mime || 'application/octet-stream'; this._n = name || '';
  }
  Blob.prototype.getBytes = function () { return this._b.slice(); };
  Blob.prototype.getDataAsString = function () { return fromUtf8(this._b); };
  Blob.prototype.getContentType = function () { return this._m; };
  Blob.prototype.getName = function () { return this._n; };
  Blob.prototype.setName = function (n) { this._n = n; return this; };
  function File(rec) { this.r = rec; }
  File.prototype.getId = function () { return this.r.id; };
  File.prototype.getName = function () { return this.r.name; };
  File.prototype.getBlob = function () { return new Blob(this.r.bytes, this.r.mime, this.r.name); };
  File.prototype.getMimeType = function () { return this.r.mime; };
  File.prototype.getSize = function () { return this.r.bytes.length; };
  File.prototype.setContent = function (s) { this.r.bytes = utf8(s); this.r.upd = Date.now(); return this; };
  File.prototype.isTrashed = function () { return !!this.r.trashed; };
  File.prototype.setTrashed = function (t) { this.r.trashed = !!t; return this; };
  File.prototype.getLastUpdated = function () { return new Date(this.r.upd); };
  File.prototype.setDescription = function (d) { this.r.desc = d; return this; };
  File.prototype.getThumbnail = function () { return this.getBlob(); };
  File.prototype.makeCopy = function (folder) { const rec = Object.assign({}, this.r, { id: nid('f'), bytes: this.r.bytes.slice(), parent: folder ? folder.r.id : this.r.parent, upd: Date.now() }); ST.files[rec.id] = rec; return new File(rec); };
  function Folder(rec) { this.r = rec; }
  Folder.prototype.getId = function () { return this.r.id; };
  Folder.prototype.getName = function () { return this.r.name; };
  Folder.prototype._files = function () { const id = this.r.id; return Object.keys(ST.files).map(function (k) { return ST.files[k]; }).filter(function (f) { return f.parent === id; }); };
  Folder.prototype.getFilesByName = function (n) { return Iter(this._files().filter(function (f) { return f.name === n; }).map(function (f) { return new File(f); })); };
  Folder.prototype.getFiles = function () { return Iter(this._files().filter(function (f) { return !f.trashed; }).map(function (f) { return new File(f); })); };
  Folder.prototype.searchFiles = function (q) {
    let list = this._files();
    if (/trashed\s*=\s*false/.test(q)) list = list.filter(function (f) { return !f.trashed; });
    const m = /mimeType contains '([^']+)'/.exec(q); if (m) list = list.filter(function (f) { return f.mime.indexOf(m[1]) >= 0; });
    return Iter(list.map(function (f) { return new File(f); }));
  };
  Folder.prototype.getFoldersByName = function (n) { const id = this.r.id; return Iter(Object.keys(ST.folders).map(function (k) { return ST.folders[k]; }).filter(function (f) { return f.parent === id && f.name === n; }).map(function (f) { return new Folder(f); })); };
  Folder.prototype.createFolder = function (n) { const r = { id: nid('d'), name: n, parent: this.r.id }; ST.folders[r.id] = r; return new Folder(r); };
  Folder.prototype.createFile = function (a, b, c) {
    let rec;
    if (a instanceof Blob) rec = { name: a._n || 'file', bytes: a._b.slice(), mime: a._m };
    else rec = { name: a, bytes: utf8(b == null ? '' : b), mime: c || 'text/plain' };
    rec.id = nid('f'); rec.parent = this.r.id; rec.upd = Date.now(); rec.trashed = false;
    ST.files[rec.id] = rec; return new File(rec);
  };
  const DriveApp = {
    getFolderById: function (id) { if (!ST.folders[id]) ST.folders[id] = { id: id, name: id, parent: null }; return new Folder(ST.folders[id]); },
    getFileById: function (id) { if (!ST.files[id]) throw new Error('File not found: ' + id); return new File(ST.files[id]); }
  };

  /* ---------- بقية الخدمات ---------- */
  const CACHE = {}, PROPS = {};
  const CacheService = { getScriptCache: function () { return {
    get: function (k) { const v = CACHE[k]; if (!v || v.e < Date.now()) return null; return v.v; },
    put: function (k, v, ttl) { if (String(v).length > 100000) throw new Error('Argument too large'); CACHE[k] = { v: String(v), e: Date.now() + (ttl || 600) * 1000 }; },
    remove: function (k) { delete CACHE[k]; },
    getAll: function (ks) { const o = {}; ks.forEach(function (k) { const v = CACHE[k]; if (v && v.e > Date.now()) o[k] = v.v; }); return o; },
    putAll: function (o, ttl) { Object.keys(o).forEach(function (k) { CACHE[k] = { v: String(o[k]), e: Date.now() + (ttl || 600) * 1000 }; }); }
  }; } };
  const PropertiesService = { getScriptProperties: function () { return {
    getProperty: function (k) { return PROPS.hasOwnProperty(k) ? PROPS[k] : null; }, setProperty: function (k, v) { PROPS[k] = String(v); return this; },
    deleteProperty: function (k) { delete PROPS[k]; return this; }, getProperties: function () { return Object.assign({}, PROPS); }
  }; } };
  let LOCKED = false;
  const LockService = { getScriptLock: function () { return { waitLock: function () { if (LOCKED) throw new Error('nested lock (deadlock in real Apps Script)'); LOCKED = true; }, tryLock: function () { if (LOCKED) return false; LOCKED = true; return true; }, releaseLock: function () { LOCKED = false; } }; } };
  function uuid() { const h = '0123456789abcdef'; let s = ''; for (let i = 0; i < 32; i++) s += h[Math.floor(Math.random() * 16)]; return s.slice(0, 8) + '-' + s.slice(8, 12) + '-4' + s.slice(13, 16) + '-a' + s.slice(17, 20) + '-' + s.slice(20, 32); }
  function pad(n) { return ('0' + n).slice(-2); }
  const Utilities = {
    DigestAlgorithm: { SHA_256: 'SHA_256' }, Charset: { UTF_8: 'UTF_8' },
    getUuid: uuid,
    computeDigest: function (alg, v) { return signed(sha256(typeof v === 'string' ? utf8(v) : v)); },
    computeHmacSha256Signature: function (v, k) { return signed(hmac(typeof v === 'string' ? utf8(v) : v, typeof k === 'string' ? utf8(k) : k)); },
    base64Encode: function (v) { return b64enc(typeof v === 'string' ? utf8(v) : v); },
    base64EncodeWebSafe: function (v) { return b64enc(typeof v === 'string' ? utf8(v) : v).replace(/\+/g, '-').replace(/\//g, '_'); },
    base64Decode: b64dec,
    newBlob: function (data, mime, name) { return new Blob(typeof data === 'string' ? utf8(data) : (data || []).slice(), mime, name); },
    formatDate: function (d, tz, fmt) { const x = new Date(d.getTime() + 3 * 3600000); return fmt.replace('yyyy', x.getUTCFullYear()).replace('MM', pad(x.getUTCMonth() + 1)).replace('dd', pad(x.getUTCDate())); },
    sleep: function () {}
  };
  const ContentService = { MimeType: { JSON: 'json' }, createTextOutput: function (s) { return { s: s, setMimeType: function () { return this; }, getContent: function () { return this.s; } }; } };
  const HtmlService = { XFrameOptionsMode: { ALLOWALL: 1 }, createHtmlOutput: function (h) { return { h: h, setTitle: function () { return this; }, addMetaTag: function () { return this; }, setXFrameOptionsMode: function () { return this; }, getContent: function () { return this.h; } }; } };
  const FETCH = { handler: null };
  const UrlFetchApp = { fetch: function (url, opt) {
    const r = FETCH.handler ? FETCH.handler(url, opt || {}) : { code: 404, body: '' };
    return { getResponseCode: function () { return r.code; }, getContentText: function () { return typeof r.body === 'string' ? r.body : fromUtf8(r.body); },
      getBlob: function () { return new Blob(typeof r.body === 'string' ? utf8(r.body) : r.body, r.mime || 'application/octet-stream', url.split('/').pop()); } };
  } };
  const TRIG = [];
  const ScriptApp = { getProjectTriggers: function () { return TRIG.slice(); }, deleteTrigger: function (t) { const i = TRIG.indexOf(t); if (i >= 0) TRIG.splice(i, 1); },
    newTrigger: function (fn) { const t = { getHandlerFunction: function () { return fn; } }; const b = { timeBased: function () { return b; }, everyHours: function () { return b; }, everyMinutes: function () { return b; }, onWeekDay: function () { return b; }, atHour: function () { return b; }, everyWeeks: function () { return b; }, create: function () { TRIG.push(t); return t; } }; return b; },
    getOAuthToken: function () { return 'tok'; }, WeekDay: { SATURDAY: 'SATURDAY', SUNDAY: 'SUNDAY' } };

  const GAS = { DriveApp: DriveApp, CacheService: CacheService, PropertiesService: PropertiesService, LockService: LockService, Utilities: Utilities, ContentService: ContentService,
    HtmlService: HtmlService, UrlFetchApp: UrlFetchApp, ScriptApp: ScriptApp,
    _fetch: FETCH, _cache: CACHE, _props: PROPS,
    _dump: function () { return JSON.stringify({ st: ST, props: PROPS }); },
    _load: function (s) { const o = JSON.parse(s); ST = o.st; Object.keys(PROPS).forEach(function (k) { delete PROPS[k]; }); Object.assign(PROPS, o.props || {}); Object.keys(CACHE).forEach(function (k) { delete CACHE[k]; }); },
    _reset: function () { ST = makeStore(); Object.keys(PROPS).forEach(function (k) { delete PROPS[k]; }); Object.keys(CACHE).forEach(function (k) { delete CACHE[k]; }); LOCKED = false; },
    _store: function () { return ST; } };
  if (isNode) module.exports = GAS; else root.GAS = GAS;
})(typeof window !== 'undefined' ? window : this);
