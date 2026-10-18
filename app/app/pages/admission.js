/* =========================================================
   পেজ: ছাত্র ভর্তি  (Application Logic)
   ডিজাইন ড্যাশবোর্ডের হুবহু একই টোকেন ব্যবহার করে।
   ========================================================= */
window.MM = window.MM || {};

MM.pageAdmission = (function () {
  const e = MM.util.esc;

  function field(label, name, ph, req, hint, cls) {
    return '<div class="field ' + (cls || '') + '"><label>' + label + (req ? ' <span class="req">*</span>' : '') +
      '</label><input type="text" name="' + name + '" placeholder="' + (ph || '') + '">' +
      (hint ? '<span class="hint">' + hint + '</span>' : '') + '</div>';
  }
  function sel(label, name, opts, req, cls) {
    return '<div class="field ' + (cls || '') + '"><label>' + label + (req ? ' <span class="req">*</span>' : '') +
      '</label><select name="' + name + '">' + opts.map(o => '<option value="' + MM.util.esc(o) + '">' + MM.util.esc(o) + '</option>').join('') + '</select></div>';
  }
  function dt(label, name, req, cls) {
    return '<div class="field ' + (cls || '') + '"><label>' + label + (req ? ' <span class="req">*</span>' : '') +
      '</label><input type="date" name="' + name + '"></div>';
  }

  let renderSequence = 0;

  function html(editing, classes) {
    return '' +
'<section class="hero"><div class="hero-title"><span class="hero-icon"><svg><use href="#i-userplus"/></svg></span>' +
'<h2>' + (editing ? 'শিক্ষার্থীর তথ্য সম্পাদনা' : 'ছাত্র ভর্তি') + '</h2></div>' +
'<div class="hero-center"><p>' + (editing ? 'তথ্য পরিবর্তন করে সংরক্ষণ করুন' : 'নতুন শিক্ষার্থী ভর্তির ফরম — সকল তথ্য সঠিকভাবে পূরণ করুন') + '</p></div></section>' +

'<form class="form-wrap" id="admissionForm" autocomplete="off">' +

'<section class="fcard"><div class="fcard-head"><span class="num">১</span>' +
'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg>শিক্ষার্থীর মৌলিক তথ্য</div>' +
'<div class="fcard-body basic-grid">' +
  '<div class="grid3">' +
    field('শিক্ষার্থীর নাম (বাংলা)', 'name_bn', 'যেমনঃ মুহাম্মাদ আব্দুল্লাহ', true) +
    field('Student Name (English)', 'name_en', 'MUHAMMAD ABDULLAH') +
    field('পিতার নাম', 'father', 'পিতার পূর্ণ নাম', true) +
    dt('জন্ম তারিখ', 'dob') +
    field('জন্ম নিবন্ধন নম্বর', 'birth_reg', '১৭ সংখ্যার নম্বর') +
    sel('রক্তের গ্রুপ', 'blood', ['— নির্বাচন —', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']) +
    '<div class="field"><label>লিঙ্গ</label><div class="choice">' +
      '<label><input type="radio" name="gender" value="ছাত্র" checked><span>ছাত্র</span></label>' +
      '<label><input type="radio" name="gender" value="ছাত্রী"><span>ছাত্রী</span></label></div></div>' +
    sel('শিক্ষার্থীর ধরন', 'stype', ['আবাসিক', 'অনাবাসিক', 'ডে-কেয়ার']) +
  '</div>' +
  '<div class="photo-box"><label class="photo-label">ছবি</label>' +
    '<div class="photo-drop" id="photoDrop"><img id="photoPrev" alt=""><span class="photo-empty">' +
      '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6 9.5 3h5L16 6"/></svg>' +
      '<br>পাসপোর্ট সাইজ<br>ছবি যুক্ত করুন</span></div>' +
    '<input type="file" id="photoInput" accept="image/*" hidden>' +
    '<div style="display:flex;gap:6px"><button type="button" class="photo-btn" id="photoPick">ছবি নির্বাচন</button>' +
    '<button type="button" class="photo-btn" id="photoClear" style="color:var(--danger)">মুছুন</button></div>' +
  '</div>' +
'</div></section>' +

'<section class="fcard"><div class="fcard-head"><span class="num">২</span>' +
'<svg viewBox="0 0 24 24"><path d="m2 9 10-5 10 5-10 5zM6 11v5c3 3 9 3 12 0v-5"/></svg>ভর্তি ও শ্রেণি সংক্রান্ত তথ্য</div>' +
'<div class="fcard-body"><div class="grid4">' +
  '<div class="field"><label>শ্রেণি <span class="req">*</span></label><div class="class-select-row">' +
    '<select name="class" required><option value="">— নির্বাচন করুন —</option>' + classes.map(o => '<option value="' + e(o) + '">' + e(o) + '</option>').join('') + '</select>' +
    '<button type="button" class="photo-btn" id="classManage">শ্রেণি পরিচালনা</button></div></div>' +
  '<div class="field"><label>রোল নম্বর</label><div class="id-row">' +
    '<input type="text" id="studentRoll" name="roll" placeholder="স্বয়ংক্রিয় রোল">' +
    '<button type="button" id="rollAutoBtn" class="photo-btn">অটো রোল</button></div>' +
    '<span class="hint" id="rollHint">শ্রেণি নির্বাচন করলে স্বয়ংক্রিয়ভাবে পরবর্তী রোল বসবে</span></div>' +
  '<div class="field"><label>আইডি নম্বর</label><div class="id-row">' +
    '<input type="text" id="studentId" name="student_id" readonly>' +
    '<button type="button" id="idToggle" class="photo-btn">কাস্টম</button></div>' +
    '<span class="hint" id="idHint">স্বয়ংক্রিয় — প্রতি নতুন ভর্তিতে নম্বর ১ করে বাড়বে</span></div>' +
  dt('ভর্তির তারিখ', 'admission_date', true) +
  sel('শিক্ষাবর্ষ', 'year', ['২০২৬', '২০২৭', '২০২৮']) +
  field('পূর্বের মাদরাসা/স্কুল', 'prev_school', 'প্রযোজ্য হলে') +
  field('ফরম নম্বর', 'form_no', 'যেমনঃ ১০২৫') +
  field('বিভাগ', 'department', 'প্রযোজ্য হলে, যেমনঃ হিফজ / কিতাব') +
  sel('অবস্থা', 'status', ['সক্রিয়', 'নিষ্ক্রিয়', 'টিসি প্রাপ্ত']) +
'</div></div></section>' +

'<section class="fcard"><div class="fcard-head"><span class="num">৩</span>' +
'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M2 21v-2a6 6 0 0 1 12 0v2M16 4a4 4 0 0 1 0 8"/></svg>অভিভাবকের তথ্য</div>' +
'<div class="fcard-body"><div class="grid4">' +
  field('অভিভাবকের নাম', 'guardian', 'অভিভাবকের পূর্ণ নাম') +
  sel('সম্পর্ক', 'relation', ['পিতা', 'মাতা', 'ভাই', 'চাচা', 'মামা', 'অন্যান্য']) +
  field('মোবাইল নম্বর', 'phone', '০১XXXXXXXXX', true) +
  field('বিকল্প মোবাইল', 'phone2', '০১XXXXXXXXX') +
  field('পেশা', 'occupation', 'যেমনঃ ব্যবসা') +
  field('জাতীয় পরিচয়পত্র নম্বর', 'nid', '১০/১৩/১৭ সংখ্যার') +
  field('মাসিক আয়', 'income', 'যেমনঃ ২৫০০০') +
  sel('অভিভাবকের ধরন', 'gtype', ['স্থানীয়', 'প্রবাসী', 'অন্যান্য']) +
'</div></div></section>' +

'<section class="fcard"><div class="fcard-head"><span class="num">৪</span>' +
'<svg viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>ঠিকানা</div>' +
'<div class="fcard-body"><div class="grid4">' +
  field('গ্রাম / মহল্লা', 'village', 'গ্রামের নাম') +
  field('ডাকঘর', 'post_office', 'ডাকঘরের নাম') +
  field('উপজেলা / থানা', 'upazila', 'উপজেলার নাম') +
  field('জেলা', 'district', 'জেলার নাম') +
  '<div class="field span3"><label>বর্তমান ঠিকানা (ভিন্ন হলে)</label><textarea name="present_address" placeholder="বিস্তারিত ঠিকানা লিখুন"></textarea></div>' +
  '<div class="field"><label>স্থায়ী ঠিকানা একই?</label><div class="choice">' +
    '<label><input type="radio" name="same_address" value="হ্যাঁ" checked><span>হ্যাঁ</span></label>' +
    '<label><input type="radio" name="same_address" value="না"><span>না</span></label></div></div>' +
'</div></div></section>' +

'<section class="fcard"><div class="fcard-head"><span class="num">৫</span>' +
'<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>ফি ও অন্যান্য তথ্য</div>' +
'<div class="fcard-body"><div class="grid4">' +
  field('ভর্তি ফি (৳)', 'admission_fee', 'যেমনঃ ২০০০') +
  field('মাসিক বেতন (৳)', 'monthly_fee', 'যেমনঃ ৮০০') +
  field('খাবার/আবাসন ফি (৳)', 'food_fee', 'প্রযোজ্য হলে') +
  sel('বৃত্তি / ছাড়', 'discount', ['নাই', 'এতিম (সম্পূর্ণ ফ্রি)', 'গরিব (৫০%)', 'মেধাবী (২৫%)', 'অন্যান্য']) +
  '<div class="field span4"><div id="admissionFeePreview" class="admission-fee-preview"></div></div>' +
  '<div class="field span3"><label>মন্তব্য / বিশেষ নির্দেশনা</label><textarea name="remarks" placeholder="প্রয়োজনীয় কোনো তথ্য থাকলে লিখুন"></textarea></div>' +
'</div></div></section>' +

'<section class="fcard"><div class="fcard-head"><span class="num">৬</span>' +
'<svg viewBox="0 0 24 24"><path d="M3 18c3-1 5-9 8-9s3 7 6 7 3-3 4-4"/><path d="M3 21h18"/></svg>স্বাক্ষর</div>' +
'<div class="fcard-body"><div class="sign-grid">' +
  '<div class="sign-box">' +
    '<label>প্রধান শিক্ষক / মুহতামিমের স্বাক্ষর</label>' +
    '<div class="sign-drop" id="signHeadDrop"><img id="signHeadImg" alt=""><span class="sign-empty">' +
      '<svg viewBox="0 0 24 24"><path d="M3 17c3-1 5-8 8-8s3 6 6 6 3-2.5 4-3.5"/><path d="M3 20h18"/></svg>' +
      '<br>স্বাক্ষরের ছবি যুক্ত করুন</span></div>' +
    '<input type="file" id="signHeadInput" accept="image/*" hidden>' +
    '<div class="sign-act"><button type="button" class="photo-btn" data-pick="signHead">ছবি নির্বাচন</button>' +
    '<button type="button" class="photo-btn" data-clear="signHead" style="color:var(--danger)">মুছুন</button></div>' +
    '<input type="text" name="head_name" placeholder="প্রধান শিক্ষকের নাম">' +
  '</div>' +
  '<div class="sign-box">' +
    '<label>শ্রেণি শিক্ষকের স্বাক্ষর</label>' +
    '<div class="sign-drop" id="signTeacherDrop"><img id="signTeacherImg" alt=""><span class="sign-empty">' +
      '<svg viewBox="0 0 24 24"><path d="M3 17c3-1 5-8 8-8s3 6 6 6 3-2.5 4-3.5"/><path d="M3 20h18"/></svg>' +
      '<br>স্বাক্ষরের ছবি যুক্ত করুন</span></div>' +
    '<input type="file" id="signTeacherInput" accept="image/*" hidden>' +
    '<div class="sign-act"><button type="button" class="photo-btn" data-pick="signTeacher">ছবি নির্বাচন</button>' +
    '<button type="button" class="photo-btn" data-clear="signTeacher" style="color:var(--danger)">মুছুন</button></div>' +
    '<input type="text" name="teacher_name" placeholder="শ্রেণি শিক্ষকের নাম">' +
  '</div>' +
'</div></div></section>' +

'<div class="form-actions">' +
  '<div class="left"><svg class="tiny-ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v5l3 2"/></svg>' +
  '<span><b>*</b> চিহ্নিত ঘরগুলো অবশ্যই পূরণ করতে হবে</span></div>' +
  '<div class="act-btns">' +
    '<button type="button" class="btn btn-danger" data-act="cancel"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>বাতিল</button>' +
    '<button type="button" class="btn btn-ghost" data-act="reset"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/></svg>ফরম খালি করুন</button>' +
    '<button type="button" class="btn btn-green" data-act="save-print"><svg viewBox="0 0 24 24"><path d="M7 9V3h10v6M7 17H4v-6h16v6h-3M7 14h10v7H7z"/></svg>সংরক্ষণ ও প্রিন্ট</button>' +
    '<button type="button" class="btn btn-primary" data-act="save"><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-9"/></svg>সংরক্ষণ করুন</button>' +
  '</div>' +
'</div></form>' +
'<footer class="support-footer"><span>সেবা ও সহযোগিতা: <b>01733445568</b></span><button>যোগাযোগ</button></footer>';
  }

  /* ---------- ফরম <-> ডেটা ---------- */
  function readForm() {
    const f = document.getElementById('admissionForm');
    const o = {};
    f.querySelectorAll('input[name],select[name],textarea[name]').forEach((el) => {
      if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
      else o[el.name] = el.value.trim();
    });
    o.photo = document.getElementById('photoPrev').getAttribute('src') || '';
    o.sign_head = document.getElementById('signHeadImg').getAttribute('src') || '';
    o.sign_teacher = document.getElementById('signTeacherImg').getAttribute('src') || '';
    return o;
  }

  function fillForm(s) {
    const f = document.getElementById('admissionForm');
    Object.keys(s || {}).forEach((k) => {
      const els = f.querySelectorAll('[name="' + k + '"]');
      if (!els.length) return;
      if (els[0].type === 'radio') {
        els.forEach((el) => { el.checked = (el.value === s[k]); });
      } else {
        if (els[0].tagName === 'SELECT' && s[k] && ![...els[0].options].some(o => o.value === String(s[k]))) {
          els[0].add(new Option(String(s[k]), String(s[k])));
        }
        els[0].value = s[k] == null ? '' : s[k];
      }
    });
    if (s && s.photo) setPhoto(s.photo);
    if (s && s.sign_head) setSign('signHead', s.sign_head);
    if (s && s.sign_teacher) setSign('signTeacher', s.sign_teacher);
  }

  function setPhoto(dataUrl) {
    const img = document.getElementById('photoPrev');
    const drop = document.getElementById('photoDrop');
    if (dataUrl) { img.src = dataUrl; drop.classList.add('has'); }
    else { img.removeAttribute('src'); drop.classList.remove('has'); }
  }

  function setSign(key, dataUrl) {
    const img = document.getElementById(key + 'Img');
    const drop = document.getElementById(key + 'Drop');
    if (!img) return;
    if (dataUrl) { img.src = dataUrl; drop.classList.add('has'); }
    else { img.removeAttribute('src'); drop.classList.remove('has'); }
  }

  function bindSign(key) {
    const file = document.getElementById(key + 'Input');
    const drop = document.getElementById(key + 'Drop');
    if (!file || !drop) return;
    drop.onclick = () => file.click();
    document.querySelector('[data-pick="' + key + '"]').onclick = () => file.click();
    document.querySelector('[data-clear="' + key + '"]').onclick = () => { setSign(key, ''); file.value = ''; };
    file.onchange = () => {
      const f = file.files && file.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          const W = 320, H = Math.max(1, Math.round(img.height * (320 / img.width)));
          c.width = W; c.height = H;
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
          ctx.drawImage(img, 0, 0, W, H);
          setSign(key, c.toDataURL('image/jpeg', 0.85));
        };
        img.src = rd.result;
      };
      rd.readAsDataURL(f);
    };
  }

  /* ---------- রেন্ডার ---------- */
  async function render(root, params) {
    const editing = params && params.id;
    const sequence = ++renderSequence;
    root.innerHTML = '<div class="page-loading">শ্রেণির তালিকা লোড হচ্ছে…</div>';
    let catalog;
    try {
      catalog = await MM.records.invoke('catalog');
    } catch (error) {
      if (sequence === renderSequence && MM.router.current === 'admission') {
        root.innerHTML = '<div class="r-error">শ্রেণির তালিকা আনা যায়নি: ' + e(String(error)) + '</div>';
      }
      return;
    }
    if (sequence !== renderSequence || MM.router.current !== 'admission' || !root.isConnected) return;
    const classes = MM.records.classNames(catalog);
    root.innerHTML = html(!!editing, classes);

    const idInput = document.getElementById('studentId');
    const idBtn = document.getElementById('idToggle');
    const idHint = document.getElementById('idHint');
    const form = document.getElementById('admissionForm');
    root.querySelector('#classManage').onclick = () => MM.records.manageClasses(catalog, async () => {
      const selected = form.querySelector('[name="class"]').value;
      const names = MM.records.classNames(catalog);
      form.querySelector('[name="class"]').innerHTML = '<option value="">— নির্বাচন করুন —</option>' + names.map(o => '<option value="' + e(o) + '">' + e(o) + '</option>').join('');
      if (names.includes(selected)) form.querySelector('[name="class"]').value = selected;
    });

    form.querySelector('[name="admission_date"]').value = MM.util.today();
    if (!editing && MM.settings) {
      await MM.settings.ready;
      if (sequence !== renderSequence || MM.router.current !== 'admission' || !root.isConnected) return;
      const year = MM.settings.value?.academic_year;
      if (year) {
        const select = form.querySelector('[name="year"]');
        if (![...select.options].some(o => o.value === year)) select.add(new Option(year,year));
        select.value = year;
      }
    }

    // স্বয়ংক্রিয় আইডি ও স্বয়ংক্রিয় রোল নম্বর
    let autoId = '';
    if (!editing) {
      try { autoId = await MM.students.nextId(); idInput.value = autoId; }
      catch (err) { idInput.value = ''; idInput.placeholder = 'সংরক্ষণের সময় তৈরি হবে'; }
    }
    const rollInput = document.getElementById('studentRoll');
    const rollAutoBtn = document.getElementById('rollAutoBtn');
    const rollHint = document.getElementById('rollHint');
    const classSelect = form.querySelector('[name="class"]');
    let rollCustomEdited = !!editing;
    async function refreshAutoRoll(force) {
      const cls = classSelect ? classSelect.value.trim() : '';
      if (!cls || cls.indexOf('—') === 0) {
        if (force && rollInput) rollInput.value = MM.util.bnNum('01');
        return;
      }
      if (!force && rollCustomEdited && rollInput && rollInput.value.trim()) return;
      try {
        const res = await MM.records.invoke('next_roll', {
          class: cls,
          student_id: editing ? Number(params.id || 0) : 0,
        });
        const nextR = String(res?.roll || '1');
        const formatted = Number(nextR) > 0 && Number(nextR) < 10 ? ('0' + Number(nextR)) : nextR;
        if (rollInput) {
          rollInput.value = MM.util.bnNum(formatted);
          rollCustomEdited = false;
        }
        if (rollHint) {
          rollHint.textContent = '"' + cls + '" শ্রেণির পরবর্তী স্বয়ংক্রিয় রোল: ' + MM.util.bnNum(formatted);
        }
      } catch (_) {}
    }
    if (classSelect) {
      classSelect.addEventListener('change', () => refreshAutoRoll(true));
    }
    if (rollInput) {
      rollInput.addEventListener('input', () => {
        rollCustomEdited = rollInput.value.trim().length > 0;
      });
    }
    if (rollAutoBtn) {
      rollAutoBtn.addEventListener('click', () => refreshAutoRoll(true));
    }

    idBtn.addEventListener('click', () => {
      if (idInput.hasAttribute('readonly')) {
        idInput.removeAttribute('readonly'); idInput.classList.add('custom');
        idInput.focus(); idInput.select();
        idBtn.textContent = 'স্বয়ংক্রিয়'; idHint.textContent = 'কাস্টম — নিজের ইচ্ছেমতো আইডি লিখুন';
      } else {
        idInput.setAttribute('readonly', 'readonly'); idInput.classList.remove('custom');
        idInput.value = autoId || idInput.value;
        idBtn.textContent = 'কাস্টম'; idHint.textContent = 'স্বয়ংক্রিয় — প্রতি নতুন ভর্তিতে নম্বর ১ করে বাড়বে';
      }
    });

    // ছবি
    const pick = document.getElementById('photoPick');
    const file = document.getElementById('photoInput');
    pick.onclick = () => file.click();
    document.getElementById('photoDrop').onclick = () => file.click();
    document.getElementById('photoClear').onclick = (ev) => { ev.stopPropagation(); setPhoto(''); file.value = ''; };
    file.onchange = () => {
      const f = file.files && file.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        // ছোট করে সংরক্ষণ (ডেটাবেজ হালকা রাখতে)
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          const W = 220, H = Math.round(img.height * (220 / img.width));
          c.width = W; c.height = H;
          c.getContext('2d').drawImage(img, 0, 0, W, H);
          setPhoto(c.toDataURL('image/jpeg', 0.82));
        };
        img.src = rd.result;
      };
      rd.readAsDataURL(f);
    };

    bindSign('signHead');
    bindSign('signTeacher');

    // সম্পাদনা হলে তথ্য বসানো
    let current = null;
    if (editing) {
      try {
        current = await MM.students.get(Number(params.id));
        if (sequence !== renderSequence || MM.router.current !== 'admission' || !root.isConnected) return;
        if (current) { fillForm(current); idInput.value = current.student_id; }
      } catch (err) { MM.util.toast('তথ্য আনা যায়নি: ' + err, 'err'); }
    }

    async function save(alsoPrint) {
      const data = readForm();
      if (!data.name_bn) { MM.util.toast('শিক্ষার্থীর নাম লিখুন', 'err'); form.querySelector('[name=name_bn]').focus(); return; }
      if (!data.father) { MM.util.toast('পিতার নাম লিখুন', 'err'); form.querySelector('[name=father]').focus(); return; }
      if (!data.class || data.class.indexOf('—') === 0) { MM.util.toast('শ্রেণি নির্বাচন করুন', 'err'); form.querySelector('[name=class]').focus(); return; }
      try {
        data.discount_rule = form._discountRead ? form._discountRead() : null;
        if (editing && current) {
          data.id = current.id;
          data.revision = current.revision;
          data.created_at = current.created_at;
          await MM.students.update(data);
          MM.util.toast('তথ্য হালনাগাদ হয়েছে ✓');
        } else {
          await MM.students.create(data);
          MM.util.toast('সংরক্ষণ হয়েছে ✓  আইডি: ' + (data.student_id || 'স্বয়ংক্রিয়'));
        }
        if (alsoPrint) MM.printStudent(data);
        MM.router.go('students');
      } catch (err) {
        MM.util.toast('সমস্যা: ' + err, 'err');
      }
    }

    form.querySelector('[data-act="save"]').onclick = () => save(false);
    form.querySelector('[data-act="save-print"]').onclick = () => save(true);
    form.querySelector('[data-act="cancel"]').onclick = () => MM.router.go(editing ? 'students' : 'dashboard');
    form.querySelector('[data-act="reset"]').onclick = async () => {
      if (!(await MM.util.confirm('ফরমের সব তথ্য মুছে ফেলবেন?'))) return;
      render(root, {});
    };
    function parseAmount(v) {
      const s = String(v || '').replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).replace(/[^0-9]/g, '');
      return Math.min(100000000, Math.max(0, Number(s || 0)));
    }
    function updateFeePreview() {
      const box = form.querySelector('#admissionFeePreview');
      if (!box) return;
      const adm = parseAmount(form.querySelector('[name="admission_fee"]')?.value);
      const mon = parseAmount(form.querySelector('[name="monthly_fee"]')?.value);
      const food = parseAmount(form.querySelector('[name="food_fee"]')?.value);
      const money = (n) => MM.records ? MM.records.money(n) : ('৳' + MM.util.bnNum(n));
      const totalInitial = adm + mon + food;
      box.innerHTML =
        '<div class="afp-head">' +
          '<span class="afp-title">স্বয়ংক্রিয় ফি লেজার সংযোগ প্রিভিউ</span>' +
          '<span class="afp-badge">' + (adm > 0 || food > 0 ? 'সংরক্ষণ করলেই লেজারে যুক্ত হবে ✓' : 'ভর্তি ফি ও খাবার ফি স্বয়ংক্রিয়ভাবে লেজারে যুক্ত হবে') + '</span>' +
        '</div>' +
        '<div class="afp-grid">' +
          '<div class="afp-item' + (adm > 0 ? ' active' : '') + '"><small>ভর্তি ফি (এককালীন)</small><strong>' + money(adm) + '</strong><span>' + (adm > 0 ? 'এককালীন বিল তৈরি হবে' : 'নির্ধারিত নেই') + '</span></div>' +
          '<div class="afp-item' + (mon > 0 ? ' active' : '') + '"><small>মাসিক বেতন (প্রতি মাস)</small><strong>' + money(mon) + '</strong><span>' + (mon > 0 ? 'শিক্ষার্থীর মাসিক হার' : 'শ্রেণির হার প্রযোজ্য') + '</span></div>' +
          '<div class="afp-item' + (food > 0 ? ' active' : '') + '"><small>খাবার/আবাসন ফি (মাসিক)</small><strong>' + money(food) + '</strong><span>' + (food > 0 ? 'ভর্তি মাসের বিল তৈরি হবে' : 'প্রযোজ্য নয়') + '</span></div>' +
          '<div class="afp-item total"><small>মোট প্রাথমিক নির্ধারিত হার</small><strong>' + money(totalInitial) + '</strong><span>লেজার ও প্রোফাইলে সংযুক্ত</span></div>' +
        '</div>';
    }
    ['admission_fee', 'monthly_fee', 'food_fee'].forEach((name) => {
      const el = form.querySelector('[name="' + name + '"]');
      if (el) el.addEventListener('input', updateFeePreview);
    });
    updateFeePreview();

    try { await MM.discounts.mountAdmission(form,current); }
    catch(err) { MM.util.toast('ছাড়ের তথ্য আনা যায়নি: '+err,'err'); }
  }

  return { render: render };
})();

/* Offline admission form in the shared print preview. */
MM.printStudent = function (s) {
  const e = MM.util.esc;
  const row = (a, b) => '<tr><th>' + a + '</th><td>' + e(b || '-') + '</td></tr>';
  return MM.printing.open('ছাত্র ভর্তি ফরম',
    (s.photo ? '<img class="mm-admission-photo" src="' + e(s.photo) + '">' : '') + '<table>' +
    row('আইডি নম্বর', s.student_id) + row('শিক্ষার্থীর নাম', s.name_bn) + row('Name (English)', s.name_en) +
    row('পিতার নাম', s.father) + row('জন্ম তারিখ', s.dob) + row('শ্রেণি', s.class) + row('রোল', s.roll) + row('শিক্ষাবর্ষ',s.year) + row('বিভাগ',s.department) + row('ফরম নম্বর',s.form_no) +
    row('ভর্তির তারিখ', s.admission_date) + row('অভিভাবক', s.guardian) + row('মোবাইল', s.phone) +
    row('ঠিকানা', [s.village, s.post_office, s.upazila, s.district].filter(Boolean).join(', ')) +
    row('ভর্তি ফি', s.admission_fee) + row('মাসিক বেতন', s.monthly_fee) + row('খাবার/আবাসন ফি', s.food_fee) + row('বৃত্তি / ছাড়', s.discount) +
    '</table><div class="mm-admission-sign">' +
      '<div class="sg"><span>অভিভাবকের স্বাক্ষর</span></div>' +
      '<div class="sg">' + (s.sign_teacher ? '<img src="' + s.sign_teacher + '">' : '') +
        '<span>শ্রেণি শিক্ষকের স্বাক্ষর' + (s.teacher_name ? '<br>' + e(s.teacher_name) : '') + '</span></div>' +
      '<div class="sg">' + (s.sign_head ? '<img src="' + s.sign_head + '">' : '') +
        '<span>প্রধান শিক্ষকের স্বাক্ষর' + (s.head_name ? '<br>' + e(s.head_name) : '') + '</span></div>' +
    '</div>');
};
