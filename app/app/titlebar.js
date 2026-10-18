/* =========================================================
   উইন্ডোর নিজস্ব টাইটেল বার — উপরের ফাঁকা ধূসর জায়গা সরানো হলো।
   বিদ্যমান topbar-ই এখন উইন্ডো সরানোর জায়গা এবং তার ডানে
   minimize / maximize / close বোতাম বসানো হয়েছে।
   ========================================================= */
window.MM = window.MM || {};
(function () {
  function init() {
    const bar = document.querySelector('.topbar');
    if (!bar || bar.querySelector('.win-ctrl')) return;

    bar.setAttribute('data-tauri-drag-region', '');
    bar.classList.add('has-winctrl');

    const wrap = document.createElement('div');
    wrap.className = 'win-ctrl';
    wrap.innerHTML =
      '<button class="wc" data-w="min" title="ছোট করুন"><svg viewBox="0 0 12 12"><path d="M2 6h8"/></svg></button>' +
      '<button class="wc" data-w="max" title="বড় করুন"><svg viewBox="0 0 12 12"><rect x="2.5" y="2.5" width="7" height="7" rx="1"/></svg></button>' +
      '<button class="wc close" data-w="close" title="বন্ধ করুন"><svg viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6"/></svg></button>';
    bar.appendChild(wrap);
    const maintenance = document.createElement('script');
    maintenance.src = 'app/maintenance.js';
    document.head.appendChild(maintenance);

    const W = (window.__TAURI__ && window.__TAURI__.window) ? window.__TAURI__.window : null;
    const win = W ? W.getCurrentWindow() : null;
    wrap.addEventListener('click', function (ev) {
      const b = ev.target.closest('.wc[data-w]'); if (!b || !win) return;
      if (b.dataset.w === 'min') win.minimize();
      else if (b.dataset.w === 'max') win.toggleMaximize();
      else if (b.dataset.w === 'close') win.close();
    });
  }
  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();
})();
