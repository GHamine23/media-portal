/* ================= البدء ================= */
(async function () {
  await loadAssets();
  const b = $('#boot'); if (b) b.remove();
  const mk = $('.top .mark'); if (mk && ASSETS.lg_mark) mk.appendChild(el('img', { src: ASSETS.lg_mark, alt: '' }));
  applyFonts();
  const s = await restoreSession();
  await loadPacks();
  userChip();
  route();
  if (!s || s === 'out') showWelcome();
  setTimeout(flushFeedback, 3000);
})();
