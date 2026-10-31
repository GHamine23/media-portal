/* بيئة الخادمين معًا للاختبار: أثر ومنصة الأنشطة، كلٌّ في محاكٍ مستقل، وطلبات كل منهما تُوجَّه إلى الآخر. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.resolve(__dirname, '../..'), SHIM = path.join(ROOT, 'v6/gas/shim.js');
function freshShim() { delete require.cache[require.resolve(SHIM)]; return require(SHIM); }
module.exports = function () {
  const base = { console: { log() {}, warn() {} }, JSON, Date, Math, Object, Array, String, Number, Error, RegExp, encodeURIComponent, parseInt };
  const GA = freshShim();
  const A = vm.createContext(Object.assign({}, base, GA));
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'server/Code.gs'), 'utf8'), A, { filename: 'atar.gs' });
  const GN = freshShim(); require('./shim_ext.js')(GN);
  const N = vm.createContext(Object.assign({}, base, GN));
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'anshita/server/Code.gs'), 'utf8'), N, { filename: 'anshita.gs' });
  const ctl = { offline: false, calls: 0 };
  const post = (ctx, payload) => ({ code: 200, body: ctx.doPost({ postData: { contents: payload } }).getContent() });
  const route = (url, opt) => {
    if (ctl.offline && (url === N.ATAR_API || url === A.ANSHITA_API)) return { code: 500, body: '<html>' };
    if (url === N.ATAR_API) { ctl.calls++; return post(A, opt.payload); }
    if (url === A.ANSHITA_API) { ctl.calls++; return post(N, opt.payload); }
    if (url.indexOf('api.telegram.org') >= 0) return { code: 200, body: '{"ok":true,"result":{"message_id":1}}' };
    return { code: 404, body: '' };
  };
  GA._fetch.handler = route; GN._fetch.handler = route;
  return { A, N, GA, GN, ctl, post: (which, payload) => post(which === 'atar' ? A : N, payload).body };
};
