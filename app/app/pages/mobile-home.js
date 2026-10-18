/* =========================================================
   মোবাইল হোম — কার্ড গ্রিড + অ্যাপ হেডার (ছোট স্ক্রিনে ড্যাশবোর্ডের বদলে)
   ========================================================= */
window.MM = window.MM || {};

MM.mobileHome = (() => {
  const e = (s) => MM.util.esc(s == null ? '' : s);
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const isMobile = () => window.matchMedia('(max-width:760px)').matches;

  const IC = {
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1.4"/><circle cx="4" cy="12" r="1.4"/><circle cx="4" cy="18" r="1.4"/></svg>',
    userplus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10" cy="8" r="4"/><path d="M3 21v-1a7 7 0 0 1 14 0v1"/><path d="M19 8v6M16 11h6"/></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 12h.01M18 12h.01"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="m10 15 2 2 4-4"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
    staff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10" cy="8" r="3.5"/><path d="M4 20a6 6 0 0 1 12 0"/><circle cx="17.5" cy="9.5" r="2.2"/><path d="M17.5 12.5v5M15.5 15h4"/></svg>',
    cap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/><path d="M22 9v5"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 8V3h10v5"/><rect x="3" y="8" width="18" height="9" rx="2"/><path d="M7 14h10v7H7z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-1.7-1L15 3h-3l-.4 2.6a7.6 7.6 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 1.7 1L12 21h3l.4-2.6a7.6 7.6 0 0 0 1.7-1l2.3 1 2-3.4z"/></svg>',
  };

  const CARDS = [
    { t: 'শিক্ষার্থী তালিকা', i: 'list', go: 'students' },
    { t: 'ছাত্র ভর্তি', i: 'userplus', go: 'admission' },
    { t: 'ফি সংগ্রহ', i: 'cash', go: 'fees' },
    { t: 'উপস্থিতি', i: 'cal', go: 'attendance' },
    { t: 'রুটিন', i: 'clock', go: 'routine' },
    { t: 'স্টাফ যোগ', i: 'staff', go: 'staff', params: { new: true } },
    { t: 'ফলাফল', i: 'cap', go: 'results' },
    { t: 'রিপোর্ট', i: 'print', go: 'reports' },
  ];

  let instName = '', instLogo = 'assets/support-logo.png';
  async function loadInst() {
    try {
      const s = await MM.tauri.invoke('settings_get');
      if (s) { instName = s.institution || s.madrasa_name || ''; instLogo = s.logo || instLogo; }
    } catch (_) {}
  }

  function render(root) {
    loadInst().then(() => {
      const nm = $('.mhome-name', root); if (nm) nm.textContent = instName || 'মাদরাসা ম্যানেজার';
      const lg = $('.mhome-logo', root); if (lg && instLogo) lg.src = instLogo;
    });
    root.innerHTML =
      '<div class="mhome">' +
      '<header class="mhome-bar">' +
      '<button class="mhome-menu" aria-label="মেনু">' + IC.menu + '</button>' +
      '<img class="mhome-logo" src="' + e(instLogo) + '" alt="">' +
      '<div class="mhome-title"><b>Madrasa Manager</b><span class="mhome-name">' + e(instName || 'মাদরাসা ম্যানেজার') + '</span></div>' +
      '<button class="mhome-gear" aria-label="সেটিংস">' + IC.gear + '</button>' +
      '</header>' +
      '<div class="mhome-grid">' +
      CARDS.map((c, i) =>
        '<button class="mcard" data-i="' + i + '"><span class="mcard-ic">' + IC[c.i] + '</span><span class="mcard-t">' + e(c.t) + '</span></button>'
      ).join('') +
      '</div></div>';
    $('.mhome-menu', root).onclick = () => document.querySelector('.sidebar')?.classList.toggle('show');
    $('.mhome-gear', root).onclick = () => MM.router.go('settings');
    $$('.mcard', root).forEach(b => b.onclick = () => {
      const c = CARDS[+b.dataset.i];
      MM.router.go(c.go, c.params || null);
    });
  }

  /* নিচের নেভিগেশন */
  const NAV = [
    { t: 'শিক্ষার্থী', i: 'list', go: 'students' },
    { t: 'ফি/বেতন', i: 'cash', go: 'fees' },
    { t: '', i: 'userplus', go: 'admission', fab: true },
    { t: 'আয়', i: 'trend', go: 'income' },
    { t: 'খরচ', i: 'wallet', go: 'expense' },
    { t: 'হাজিরা', i: 'calcheck', go: 'attendance' },
  ];
  const NIC = {
    list: IC.list, cash: IC.cash, userplus: IC.userplus,
    trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/></svg>',
    calcheck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="m10 15 2 2 4-4"/></svg>',
  };
  function buildNav() {
    if (document.querySelector('.mnav')) return;
    const n = document.createElement('nav');
    n.className = 'mnav';
    n.innerHTML = NAV.map((x, i) =>
      x.fab
        ? '<button class="mnav-fab" data-i="' + i + '" aria-label="নতুন ভর্তি">' + NIC[x.i] + '</button>'
        : '<button class="mnav-it" data-i="' + i + '">' + NIC[x.i] + '<span>' + e(x.t) + '</span></button>'
    ).join('');
    document.body.appendChild(n);
    n.addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b) return;
      MM.router.go(NAV[+b.dataset.i].go);
    });
  }
  function setActive(page) {
    const n = document.querySelector('.mnav'); if (!n) return;
    const map = { students: 0, fees: 1, admission: 2, income: 3, expense: 4, attendance: 5 };
    $$('.mnav-it,.mnav-fab', n).forEach(b => b.classList.remove('active'));
    const idx = map[page];
    if (idx !== undefined) { const b = n.querySelector('[data-i="' + idx + '"]'); if (b) b.classList.add('active'); }
  }

  return { render, buildNav, setActive, isMobile, CARDS };
})();
