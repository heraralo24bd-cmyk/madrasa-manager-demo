/* =========================================================
   DEMO STUB — GitHub Pages ডেমোর জন্য ভুয়া Tauri ব্যাকএন্ড
   - সব রিডে ডেমো ডাটা দেয়
   - যেকোনো সেভ/পরিবর্তনে সাফল্য দেখিয়ে ডাটা রিসেট করে দেয়
     (ডেমো মোড: কিছুই স্থায়ীভাবে সংরক্ষণ হয় না)
   ========================================================= */
(function () {
  'use strict';

  const CLASSES = ['নূরানী ১ম শ্রেণি','নূরানী ২য় শ্রেণি','নূরানী ৩য় শ্রেণি','নাজেরা','হিফজুল কুরআন','মিজান','নাহবেমীর','হেদায়াতুন্নাহু','কাফিয়া','শরহে জামী'];

  function mkStudents() {
    const names = [
      ['মোঃ আব্দুল্লাহ','MD ABDULLAH','মোঃ করিম উদ্দিন'],['মোঃ তানভীর হাসান','MD TANVIR HASAN','মোঃ রহিম মিয়া'],
      ['মোঃ সাইফুল ইসলাম','MD SAIFUL ISLAM','মোঃ জামাল হোসেন'],['মোঃ মাহমুদুল হক','MD MAHMUDUL HAQUE','মোঃ সালাম মিয়া'],
      ['মোঃ রফিকুল ইসলাম','MD RAFIQUL ISLAM','মোঃ কালাম মিয়া'],['মোঃ ইমরান হোসেন','MD IMRAN HOSSAIN','মোঃ বাবুল মিয়া'],
      ['মোঃ শাকিল আহমেদ','MD SHAKIL AHMED','মোঃ নূরুল ইসলাম'],['মোঃ হাবিবুর রহমান','MD HABIBUR RAHMAN','মোঃ আঃ মালেক'],
      ['মোঃ ফয়সাল কবির','MD FAISAL KABIR','মোঃ আনোয়ার হোসেন'],['মোঃ নাঈম উদ্দিন','MD NAIM UDDIN','মোঃ সিরাজুল ইসলাম'],
      ['মোঃ তৌহিদুল ইসলাম','MD TOUHIDUL ISLAM','মোঃ মফিজুল হক'],['মোঃ আরিফুল হক','MD ARIFUL HAQUE','মোঃ দেলোয়ার হোসেন'],
    ];
    return names.map((n, i) => ({
      id: i + 1,
      student_id: 'MM-2026-' + String(i + 1).padStart(4, '0'),
      name_bn: n[0], name_en: n[1], father: n[2],
      class: CLASSES[i % CLASSES.length],
      roll: String(i + 1),
      phone: '017' + String(11111111 + i * 1111111).slice(0, 8),
      status: 'সক্রিয়', admission_date: '2026-01-05',
    }));
  }
  function mkStaff() {
    const s = [
      ['মোঃ আব্দুর রহিম','মুহতামিম','০১৭১০০০০০০১'],['মোঃ ইলিয়াস হোসেন','শিক্ষক','০১৭১০০০০০০২'],
      ['মোঃ কামরুল ইসলাম','শিক্ষক','০১৭১০০০০০০৩'],['মোঃ মাহবুব আলম','হিসাবরক্ষক','০১৭১০০০০০০৪'],
    ];
    return s.map((x, i) => ({ id: i + 1, name_bn: x[0], role: x[1], phone: x[2], salary: 8000 + i * 1500, status: 'সক্রিয়' }));
  }

  const PRISTINE = {
    students: mkStudents(),
    staff: mkStaff(),
    feeTypes: [
      { id: 1, name: 'মাসিক বেতন', amount: 500, active: true },
      { id: 2, name: 'ভর্তি ফি', amount: 1000, active: true },
      { id: 3, name: 'পরীক্ষা ফি', amount: 300, active: true },
    ],
    fees: [
      { id: 1, student_id: 'MM-2026-0001', name_bn: 'মোঃ আব্দুল্লাহ', class: 'নূরানী ১ম শ্রেণি', month: '২০২৬-১০', type: 'মাসিক বেতন', amount: 500, paid: 500, due: 0 },
      { id: 2, student_id: 'MM-2026-0005', name_bn: 'মোঃ রফিকুল ইসলাম', class: 'হেদায়াতুন্নাহু', month: '২০২৬-১০', type: 'মাসিক বেতন', amount: 500, paid: 0, due: 500 },
      { id: 3, student_id: 'MM-2026-0009', name_bn: 'মোঃ ফয়সাল কবির', class: 'কাফিয়া', month: '২০২৬-১০', type: 'মাসিক বেতন', amount: 500, paid: 200, due: 300 },
    ],
    exams: [{ id: 1, name: 'অর্ধ-বার্ষিক পরীক্ষা', class: 'হিফজুল কুরআন' }],
    subjects: [{ id: 1, name: 'কুরআন মাজীদ', full: 100 }, { id: 2, name: 'হাদীস', full: 100 }, { id: 3, name: 'ফিকহ', full: 100 }],
  };
  let DB = JSON.parse(JSON.stringify(PRISTINE));

  /* ---------- ডেমো টোস্ট ---------- */
  function demoToast() {
    try {
      if (window.MM && MM.util && MM.util.toast) { MM.util.toast('ডেমো মোড: পরিবর্তন সংরক্ষণ করা হয়নি'); return; }
      let t = document.getElementById('demo-toast');
      if (!t) { t = document.createElement('div'); t.id = 'demo-toast'; t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#0c2340;color:#fde68a;padding:10px 22px;border-radius:12px;z-index:9999;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,.3)'; document.body.appendChild(t); }
      t.textContent = 'ডেমো মোড: পরিবর্তন সংরক্ষণ করা হয়নি';
      t.style.display = 'block';
      clearTimeout(t._h); t._h = setTimeout(() => t.style.display = 'none', 2200);
    } catch (_) {}
  }
  /* যেকোনো মিউটেশন → সাফল্যের ভান + ডাটা রিসেট */
  function mutated(ret) {
    DB = JSON.parse(JSON.stringify(PRISTINE));
    setTimeout(demoToast, 50);
    return Promise.resolve(ret === undefined ? { ok: true } : ret);
  }

  const catalog = () => ({
    classes: CLASSES.map(n => ({ name: n })), class_catalog_configured: true,
    types: DB.feeTypes, class_rates: [],
    exams: DB.exams,
  });
  const dashboard = () => ({
    income: 12500,
    dues: DB.fees.filter(f => f.due > 0).map(f => ({ name: f.name_bn, cls: f.class, due: f.due })),
    next: DB.exams.map(x => ({ name: x.name })),
    attendance: [{ status: 'present', count: 231 }, { status: 'absent', count: 17 }],
    staff: [{ role: 'শিক্ষক', count: 14 }, { role: 'কর্মচারী', count: 4 }],
    payments: [{ name: 'মোঃ তানভীর হাসান', amount: 2000, date: '১৮ অক্টোবর ২০২৬' }, { name: 'মোঃ সাইফুল ইসলাম', amount: 1500, date: '১৭ অক্টোবর ২০২৬' }],
  });
  const examDetail = () => {
    const subs = DB.subjects;
    const gradeOf = p => p >= 80 ? ['মুমতাজ', 'mumtaz'] : p >= 65 ? ['জাইয়্যিদ জিদ্দান', 'jayyid_jiddan'] : p >= 50 ? ['জাইয়্যিদ', 'jayyid'] : p >= 33 ? ['মাকবুল', 'maqbul'] : ['রাসিব', 'rasib'];
    const mk = [];
    const sts = DB.students.slice(0, 6).map(s => {
      const sr = subs.map((sub, i) => { const m = 72 + ((s.id * 7 + i * 13) % 26); mk.push({ student_id: s.id, subject_id: sub.id, marks: m, absent: 0 }); return { subject_id: sub.id, marks: m, recorded: true, absent: 0 }; });
      const total = sr.reduce((t, r) => t + r.marks, 0), pct = Math.round(total / 3 * 100) / 100, [g, gc] = gradeOf(pct);
      return { id: s.id, student_id: s.id, roll: s.roll, name_bn: s.name_bn, name: s.name_bn, sid: s.student_id, subject_results: sr, total, full: 300, percentage: pct, grade: g, grade_code: gc, complete: true };
    });
    return { exam: DB.exams[0], subjects: subs, students: sts, marks: mk };
  };

  /* ---------- invoke ---------- */
  async function invoke(cmd, args) {
    args = args || {};
    const P = (args.payload) || {};
    /* লাইসেন্স — ডেমোতে সবসময় সচল */
    if (cmd === 'license_status' || cmd === 'license_refresh')
      return { state: 'active', allowed: true, customer_name: 'ডেমো মাদরাসা', message: '', mode: 'offline' };
    if (cmd === 'license_activate') return mutated({ ok: true });

    /* ছাত্র — রিড */
    if (cmd === 'students_stats') return { total: DB.students.length };
    if (cmd === 'students_list') return { rows: DB.students, total: DB.students.length };
    if (cmd === 'students_get') return DB.students.find(s => s.id === args.id) || DB.students[0];
    if (cmd === 'students_next_id') return 'MM-2026-' + String(DB.students.length + 1).padStart(4, '0');
    if (cmd === 'student_summary') return { student: DB.students[0], fees: DB.fees.slice(0, 2), attendance: { present: 20, absent: 2 } };
    if (cmd === 'student_exams' || cmd === 'student_results') return { rows: [] };
    if (cmd === 'next_roll') return { roll: String(DB.students.length + 1) };
    /* ছাত্র — মিউটেশন */
    if (cmd === 'students_create') return mutated({ id: 999, student_id: 'MM-2026-0999', ...(args.s || {}) });
    if (cmd === 'students_update' || cmd === 'students_delete' || cmd === 'students_backup') return mutated({ ok: true });

    /* সেটিংস */
    if (cmd === 'settings_get') return { institution: 'ডেমো মাদরাসা', address: 'ডেমো ঠিকানা', phone: '০১৭০০০০০০০০', logo: 'assets/support-logo.png' };
    if (cmd === 'settings_save' || cmd === 'settings_restore') return mutated({ ok: true });
    if (cmd === 'app_info') return { version: 'ডেমো', name: 'Madrasa Manager' };
    if (cmd === 'open_data_folder' || cmd === 'support_open') return { ok: true };
    if (cmd === 'support_info') return {};
    if (cmd === 'backup_create') return mutated({ ok: true, path: 'demo-backup.zip' });
    if (cmd === 'backup_list') return { rows: [] };

    /* প্রিন্ট */
    if (cmd === 'print_printers') return [];
    if (cmd === 'print_document' || cmd === 'attendance_report_export') return mutated({ ok: true });

    if (cmd === 'records_call') {
      const a = args.action || '';
      /* --- রিড --- */
      if (a === 'dashboard') return dashboard();
      if (a === 'catalog') return catalog();
      if (a === 'fee_list') return { rows: DB.fees, total: DB.fees.length };
      if (a === 'attendance_get') return { day: P.day, rows: DB.students.map(s => ({ id: s.id, roll: s.roll, student_id: s.student_id, name_bn: s.name_bn, status: 'present', note: '' })) };
      if (a === 'exam_get') return examDetail();
      if (a === 'staff_dashboard') return { total: DB.staff.length, present: DB.staff.length, rows: DB.staff };
      if (a === 'staff_get') return DB.staff[0] || {};
      if (a === 'staff_attendance_get') return { rows: DB.staff.map(s => ({ id: s.id, name_bn: s.name_bn, status: 'present' })) };
      if (a === 'salary_list') return { rows: DB.staff.map(s => ({ id: s.id, name_bn: s.name_bn, role: s.role, salary: s.salary, paid: 0, due: s.salary })) };
      if (a === 'salary_terms_get') return { rows: [] };
      if (a === 'discount_get') return { rows: [] };
      if (a === 'discount_students') return { rows: DB.students.slice(0, 3) };
      if (a === 'generator_info') return {};
      /* --- মিউটেশন --- */
      if (a === 'fee_pay') return mutated({ id: 1001 });
      if (a === 'salary_pay') return mutated({ id: 501 });
      return mutated({ ok: true });
    }
    return null;
  }

  window.__TAURI__ = {
    core: { invoke },
    window: { getCurrentWindow: () => ({ close: () => {} }) },
    event: { listen: () => Promise.resolve(() => {}) },
  };

  /* ---------- ডেমো রিবন ---------- */
  function ribbon() {
    if (document.getElementById('demo-ribbon')) return;
    const r = document.createElement('div');
    r.id = 'demo-ribbon';
    r.textContent = 'ডেমো';
    r.style.cssText = 'position:fixed;top:14px;right:-34px;transform:rotate(45deg);background:#d4a017;color:#fff;font-weight:800;font-size:13px;padding:5px 40px;z-index:9999;box-shadow:0 3px 10px rgba(0,0,0,.25);letter-spacing:2px';
    document.body.appendChild(r);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ribbon);
  else ribbon();
})();
