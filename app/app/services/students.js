/* =========================================================
   Data Service Layer (Frontend)
   UI কখনো সরাসরি ডেটাবেজে যায় না — সব কিছু এই স্তরের মধ্য দিয়ে যায়।
   ভবিষ্যতে ডেটাবেজ বদলালেও UI-তে হাত দিতে হবে না।
   ========================================================= */
window.MM = window.MM || {};

MM.tauri = {
  ready() {
    return !!(window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke);
  },
  invoke(cmd, args) {
    if (!this.ready()) return Promise.reject(new Error('ডেস্কটপ অ্যাপের বাইরে ডেটাবেজ পাওয়া যায় না'));
    return window.__TAURI__.core.invoke(cmd, args || {});
  }
};

MM.students = {
  nextId(year)          { return MM.tauri.invoke('students_next_id', { year: year || null }); },
  create(s)             { return MM.tauri.invoke('students_create', { s: s }); },
  update(s)             { return MM.tauri.invoke('students_update', { s: s }); },
  remove(id)            { return MM.tauri.invoke('students_delete', { id: id }); },
  get(id)               { return MM.tauri.invoke('students_get', { id: id }); },
  list(opt) {
    opt = opt || {};
    return MM.tauri.invoke('students_list', {
      search: opt.search || '',
      class: opt.cls || '',
      limit: opt.limit || 50,
      offset: opt.offset || 0
    });
  },
  stats()               { return MM.tauri.invoke('students_stats'); },
  backup(target)        { return MM.tauri.invoke('students_backup', { target: target }); }
};

/* মাদরাসার শ্রেণিসমূহ — এক জায়গায়, সব পেজে একই */
MM.CLASSES = [
  'নূরানী ১ম শ্রেণি','নূরানী ২য় শ্রেণি','নূরানী ৩য় শ্রেণি','নাজেরা','হিফজুল কুরআন',
  'তাইসীর / খুসুসি','মিজান','নাহবেমীর','হেদায়াতুন্নাহু','কাফিয়া','শরহে জামী',
  'শরহে বেকায়া','জালালাইন','মিশকাত','দাওরায়ে হাদীস'
];

/* ছোট সহায়ক */
MM.util = {
  esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
  bnNum(v) {
    const d = '০১২৩৪৫৬৭৮৯';
    return String(v == null ? '' : v).replace(/[0-9]/g, (n) => d[+n]);
  },
  today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },
  toast(msg, type) {
    let box = document.getElementById('mm-toast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'mm-toast';
      document.body.appendChild(box);
    }
    const el = document.createElement('div');
    el.className = 'mm-toast-item ' + (type || 'ok');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 300); }, 3200);
  },
  confirm(msg) {
    return new Promise((resolve) => {
      const wrap = document.createElement('div');
      let closing = false;
      wrap.className = 'mm-modal';
      wrap.innerHTML =
        '<div class="mm-modal-box"><div class="mm-modal-msg"></div>' +
        '<div class="mm-modal-act"><button class="btn btn-ghost" data-no>' + (MM.i18n?.t('না') || 'না') + '</button>' +
        '<button class="btn btn-primary" data-yes>' + (MM.i18n?.t('হ্যাঁ') || 'হ্যাঁ') + '</button></div></div>';
      wrap.querySelector('.mm-modal-msg').textContent = msg;
      document.body.appendChild(wrap);
      const close = (answer) => {
        if (closing) return;
        closing = true;
        wrap.classList.add('mm-modal-closing');
        window.setTimeout(() => {
          wrap.remove();
          resolve(answer);
        }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150);
      };
      wrap.querySelector('[data-no]').onclick = () => close(false);
      wrap.querySelector('[data-yes]').onclick = () => close(true);
    });
  }
};
