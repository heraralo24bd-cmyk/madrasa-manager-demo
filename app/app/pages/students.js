/* =========================================================
   পেজ: শিক্ষার্থী তালিকা  (খোঁজা / সম্পাদনা / মুছে ফেলা / প্রিন্ট)
   ========================================================= */
window.MM = window.MM || {};

MM.pageStudents = (function () {
  const e = MM.util.esc;
  let loadTicket = 0;
  let state = { search: '', cls: '', page: 0, limit: 24, total: 0, rows: [],
  view: (function(){ try { return localStorage.getItem('mm-student-view') || 'cards'; } catch(e){ return 'cards'; } })() };

  function shell() {
    return '' +
'<section class="hero"><div class="hero-title"><span class="hero-icon"><svg><use href="#i-list"/></svg></span>' +
'<h2>শিক্ষার্থী তালিকা</h2></div><div class="hero-center"><p>ভর্তিকৃত সকল শিক্ষার্থীর তথ্য এক নজরে</p></div></section>' +

'<section class="fcard toolbar-card"><div class="fcard-body toolbar">' +
  '<div class="search-box"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>' +
    '<input id="stSearch" type="text" placeholder="নাম, পিতা, আইডি, রোল বা মোবাইল দিয়ে খুঁজুন"></div>' +
  '<select id="stClass" class="tool-select"><option value="">সকল শ্রেণি</option>' +
    MM.CLASSES.map(c => '<option value="' + e(c) + '">' + e(c) + '</option>').join('') + '</select>' +
  '<button class="btn btn-ghost" id="stClasses">শ্রেণি পরিচালনা</button>' +
  '<button class="btn btn-ghost" id="stRefresh"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/></svg>রিফ্রেশ</button>' +
  '<button class="btn btn-ghost" id="stPrint"><svg viewBox="0 0 24 24"><path d="M7 9V3h10v6M7 17H4v-6h16v6h-3M7 14h10v7H7z"/></svg>তালিকা প্রিন্ট</button>' +
  '<button class="btn btn-primary" id="stNew"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M2 21v-2a6 6 0 0 1 12 0v2m4-12v6m-3-3h6"/></svg>নতুন ভর্তি</button>' +
'</div></section>' +

'<section class="fcard"><div class="fcard-head">' +
  '<svg viewBox="0 0 24 24"><path d="M9 6h12M9 12h12M9 18h12M3 6h1m-1 6h1m-1 6h1"/></svg>শিক্ষার্থীগণ' +
  '<span class="count-badge" id="stCount">০</span>' +
  '<div class="view-switch">' +
    '<button class="vs" data-view="cards" title="কার্ড"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg></button>' +
    '<button class="vs" data-view="table" title="তালিকা"><svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>' +
  '</div></div>' +
'<div id="stBox"></div>' +
'<div class="table-foot"><span id="stInfo"></span><div class="pager">' +
  '<button class="btn btn-ghost" id="stPrev">← আগের</button><button class="btn btn-ghost" id="stNext">পরের →</button>' +
'</div></div></section>' +
'<footer class="support-footer"><span>সেবা ও সহযোগিতা: <b>01733445568</b></span><button>যোগাযোগ</button></footer>';
  }

  function rowHtml(s, i) {
    const photo = s.photo
      ? '<img class="row-photo" src="' + s.photo + '">'
      : '<span class="row-photo empty">' + (s.name_bn ? s.name_bn.trim().charAt(0) : '·') + '</span>';
    const st = s.status || 'সক্রিয়';
    const stCls = st === 'সক্রিয়' ? 'ok' : (st === 'নিষ্ক্রিয়' ? 'off' : 'warn');
    return '<tr>' +
      '<td class="dim">' + MM.util.bnNum(state.page * state.limit + i + 1) + '</td>' +
      '<td><span class="sid">' + e(s.student_id) + '</span></td>' +
      '<td>' + photo + '</td>' +
      '<td><b>' + e(s.name_bn) + '</b>' + (s.name_en ? '<span class="sub">' + e(s.name_en) + '</span>' : '') + '</td>' +
      '<td>' + e(s.father) + '</td>' +
      '<td>' + e(s.class) + '</td>' +
      '<td>' + MM.util.bnNum(e(s.roll)) + '</td>' +
      '<td>' + MM.util.bnNum(e(s.phone)) + '</td>' +
      '<td>' + MM.util.bnNum(e(s.admission_date)) + '</td>' +
      '<td><span class="pill ' + stCls + '">' + e(st) + '</span></td>' +
      '<td><div class="row-act">' +
        '<button class="mini" data-view="' + s.id + '" title="বিস্তারিত"><svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button>' +
        '<button class="mini" data-edit="' + s.id + '" title="সম্পাদনা"><svg viewBox="0 0 24 24"><path d="M4 20h4l10-10-4-4L4 16z"/></svg></button>' +
        '<button class="mini" data-print="' + s.id + '" title="প্রিন্ট"><svg viewBox="0 0 24 24"><path d="M7 9V3h10v6M7 17H4v-6h16v6h-3M7 14h10v7H7z"/></svg></button>' +
        '<button class="mini danger" data-del="' + s.id + '" title="মুছুন"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m-8 0 1 14h8l1-14"/></svg></button>' +
      '</div></td></tr>';
  }

  function tableHtml(rows) {
    return '<div class="table-wrap"><table class="mm-table"><thead><tr>' +
      '<th style="width:42px">#</th><th style="width:118px">আইডি</th><th style="width:58px">ছবি</th><th>নাম</th><th>পিতার নাম</th>' +
      '<th style="width:140px">শ্রেণি</th><th style="width:62px">রোল</th><th style="width:118px">মোবাইল</th>' +
      '<th style="width:106px">ভর্তির তারিখ</th><th style="width:84px">অবস্থা</th><th style="width:150px">কাজ</th>' +
      '</tr></thead><tbody>' + rows.map(rowHtml).join('') + '</tbody></table></div>';
  }

  function cardHtml(s, i) {
    const photo = s.photo
      ? '<img src="' + s.photo + '">'
      : '<span class="sc-ph-empty">' + e((s.name_bn || '·').trim().charAt(0)) + '</span>';
    const st = s.status || 'সক্রিয়';
    const stCls = st === 'সক্রিয়' ? 'ok' : (st === 'নিষ্ক্রিয়' ? 'off' : 'warn');
    return '<div class="scard" data-open="' + s.id + '">' +
      '<div class="sc-top">' + photo +
        '<span class="sc-status pill ' + stCls + '">' + e(st) + '</span>' +
        '<span class="sc-id">' + e(s.student_id) + '</span>' +
      '</div>' +
      '<div class="sc-body">' +
        '<span class="sc-class">' + e(s.class || '-') + '</span>' +
        '<h4 class="sc-name">' + e(s.name_bn) + '</h4>' +
        (s.name_en ? '<span class="sc-name-en">' + e(s.name_en) + '</span>' : '') +
        '<div class="sc-meta">' +
          '<span><i>রোল</i><b>' + MM.util.bnNum(s.roll || '-') + '</b></span>' +
          '<span><i>পিতা</i><b>' + e(s.father || '-') + '</b></span>' +
          '<span><i>মোবাইল</i><b>' + MM.util.bnNum(s.phone || '-') + '</b></span>' +
        '</div>' +
      '</div>' +
      '<div class="sc-act">' +
        '<button class="mini" data-view="' + s.id + '" title="বিস্তারিত"><svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button>' +
        '<button class="mini" data-edit="' + s.id + '" title="সম্পাদনা"><svg viewBox="0 0 24 24"><path d="M4 20h4l10-10-4-4L4 16z"/></svg></button>' +
        '<button class="mini" data-print="' + s.id + '" title="প্রিন্ট"><svg viewBox="0 0 24 24"><path d="M7 9V3h10v6M7 17H4v-6h16v6h-3M7 14h10v7H7z"/></svg></button>' +
        '<button class="mini danger" data-del="' + s.id + '" title="মুছুন"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m-8 0 1 14h8l1-14"/></svg></button>' +
      '</div></div>';
  }

  async function load() {
    const ticket = ++loadTicket;
    const box = document.getElementById('stBox');
    if (!box) return;
    box.setAttribute('aria-busy', 'true');
    if (!box.hasChildNodes()) box.innerHTML = '<div class="empty-box">লোড হচ্ছে…</div>';
    try {
      const res = await MM.students.list({ search: state.search, cls: state.cls, limit: state.limit, offset: state.page * state.limit });
      if (ticket !== loadTicket || !box.isConnected) return;
      if (!res.rows.length && res.total && state.page) { state.page = Math.floor((res.total-1)/state.limit); return load(); }
      state.rows = res.rows; state.total = res.total;
      if (!res.rows.length) {
        box.innerHTML = '<div class="empty-box">' +
          (state.search || state.cls ? 'কোনো শিক্ষার্থী পাওয়া যায়নি' :
          'এখনো কোনো শিক্ষার্থী ভর্তি করা হয়নি — <b>নতুন ভর্তি</b> বোতামে চাপুন') + '</div>';
      } else if (state.view === 'table') {
        box.innerHTML = tableHtml(res.rows);
      } else {
        box.innerHTML = '<div class="scard-grid">' + res.rows.map(cardHtml).join('') + '</div>';
      }
      MM.i18n && MM.i18n.apply(MM.i18n.lang);
      document.getElementById('stCount').textContent = MM.util.bnNum(res.total);
      const from = res.total ? state.page * state.limit + 1 : 0;
      const to = Math.min((state.page + 1) * state.limit, res.total);
      document.getElementById('stInfo').textContent =
        'মোট ' + MM.util.bnNum(res.total) + ' জনের মধ্যে ' + MM.util.bnNum(from) + '–' + MM.util.bnNum(to) + ' দেখানো হচ্ছে';
      document.getElementById('stPrev').disabled = state.page === 0;
      document.getElementById('stNext').disabled = (state.page + 1) * state.limit >= res.total;
    } catch (err) {
      if (ticket !== loadTicket || !box.isConnected) return;
      box.innerHTML = '<div class="empty-box">ডেটাবেজ পাওয়া যায়নি — ' + e(String(err)) + '</div>';
    } finally {
      if (ticket === loadTicket && box.isConnected) box.removeAttribute('aria-busy');
    }
  }

  function details(s) {
    const r = (a, b) => b ? '<div class="d-row"><span>' + a + '</span><b>' + e(b) + '</b></div>' : '';
    const wrap = document.createElement('div');
    let closing = false;
    wrap.className = 'mm-modal';
    wrap.innerHTML = '<div class="mm-modal-box wide">' +
      '<div class="d-head">' + (s.photo ? '<img src="' + s.photo + '">' : '<span class="row-photo empty big">' + e((s.name_bn || '·').charAt(0)) + '</span>') +
      '<div><h3>' + e(s.name_bn) + '</h3><p>' + e(s.student_id) + ' · ' + e(s.class) + '</p></div></div>' +
      '<div class="d-grid">' +
        r('পিতার নাম', s.father) + r('জন্ম তারিখ', s.dob) + r('জন্ম নিবন্ধন', s.birth_reg) + r('রক্তের গ্রুপ', s.blood) +
        r('লিঙ্গ', s.gender) + r('ধরন', s.stype) + r('রোল', s.roll) + r('ভর্তির তারিখ', s.admission_date) +
        r('শিক্ষাবর্ষ', s.year) + r('ফরম নম্বর', s.form_no) + r('পূর্বের প্রতিষ্ঠান', s.prev_school) +
        r('অভিভাবক', s.guardian) + r('সম্পর্ক', s.relation) + r('মোবাইল', s.phone) + r('বিকল্প মোবাইল', s.phone2) +
        r('পেশা', s.occupation) + r('এনআইডি', s.nid) + r('মাসিক আয়', s.income) +
        r('গ্রাম', s.village) + r('ডাকঘর', s.post_office) + r('উপজেলা', s.upazila) + r('জেলা', s.district) +
        r('বর্তমান ঠিকানা', s.present_address) +
        r('ভর্তি ফি', s.admission_fee) + r('মাসিক বেতন', s.monthly_fee) + r('খাবার ফি', s.food_fee) +
        r('ছাড়', s.discount) + r('মন্তব্য', s.remarks) + r('অবস্থা', s.status) +
      '</div><div class="mm-modal-act">' +
        '<button class="btn btn-ghost" data-close>বন্ধ করুন</button>' +
        '<button class="btn btn-green" data-pr>প্রিন্ট</button>' +
        '<button class="btn btn-primary" data-ed>সম্পাদনা</button></div></div>';
    document.body.appendChild(wrap);
    const close = (afterClose) => {
      if (closing) return;
      closing = true;
      wrap.classList.add('mm-modal-closing');
      window.setTimeout(() => {
        wrap.remove();
        afterClose?.();
      }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150);
    };
    wrap.querySelector('[data-close]').onclick = () => close();
    wrap.querySelector('[data-pr]').onclick = () => MM.printStudent(s);
    wrap.querySelector('[data-ed]').onclick = () => close(() => MM.router.go('admission', { id: s.id }));
  }

  async function printList() {
    const button=document.getElementById('stPrint');
    if(button.disabled)return;
    button.disabled=true;
    const filter={search:document.getElementById('stSearch').value,cls:state.cls};
    try {
    const students=[];
    for(let offset=0;;) {
      const batch=await MM.students.list({...filter,limit:1000,offset});
      students.push(...batch.rows);
      offset+=batch.rows.length;
      if(offset>=batch.total)break;
      if(!batch.rows.length)throw new Error('তালিকা পরিবর্তিত হয়েছে। আবার চেষ্টা করুন।');
    }
    const rows = students.map((s, i) =>
      '<tr><td>' + MM.util.bnNum(i + 1) + '</td><td>' + e(s.student_id) + '</td><td>' + e(s.name_bn) +
      '</td><td>' + e(s.father) + '</td><td>' + e(s.class) + '</td><td>' + e(s.roll) + '</td><td>' + e(s.phone) + '</td></tr>').join('');
    MM.printing.open('শিক্ষার্থী তালিকা' + (filter.cls ? ' · ' + filter.cls : ''),
      '<table><thead><tr><th>ক্রম</th><th>আইডি</th><th>নাম</th><th>পিতার নাম</th><th>শ্রেণি</th><th>রোল</th><th>মোবাইল</th></tr></thead><tbody>' + rows + '</tbody></table>');
    } catch(err) {MM.util.toast('তালিকা প্রিন্ট করা যায়নি: '+err,'err');}
    finally {if(button.isConnected)button.disabled=false;}
  }

  async function render(root) {
    root.innerHTML = shell();
    state.page = 0;

    const search = document.getElementById('stSearch');
    search.value = state.search;
    document.getElementById('stClass').value = state.cls;
    let classCatalog = null;
    const updateClassOptions = () => {
      const select = root.querySelector('#stClass');
      if (!select || !classCatalog) return;
      const names = MM.records.classNames(classCatalog);
      if (state.cls && !names.includes(state.cls)) state.cls = '';
      select.innerHTML = '<option value="">সকল শ্রেণি</option>' +
        names.map(name => '<option value="' + e(name) + '">' + e(name) + '</option>').join('');
      select.value = state.cls;
    };
    const classButton = root.querySelector('#stClasses');
    classButton.disabled = true;
    const catalogReady = MM.records.invoke('catalog').then(c => {
      if (!root.isConnected) return;
      classCatalog = c;
      updateClassOptions();
      classButton.disabled = false;
    }).catch(err => {
      MM.util.toast('শ্রেণির তালিকা আনা যায়নি: ' + err, 'err');
    });
    classButton.onclick = () => {
      if (!classCatalog) return;
      MM.records.manageClasses(classCatalog, async () => {
        updateClassOptions();
        await load();
      });
    };

    let t = null;
    search.oninput = () => { clearTimeout(t); t = setTimeout(() => { state.search = search.value; state.page = 0; load(); }, 250); };
    document.getElementById('stClass').onchange = (ev) => { state.cls = ev.target.value; state.page = 0; load(); };
    document.getElementById('stRefresh').onclick = () => load();
    document.getElementById('stNew').onclick = () => MM.router.go('admission');
    document.getElementById('stPrint').onclick = () => printList();
    document.getElementById('stPrev').onclick = () => { if (state.page > 0) { state.page--; load(); } };
    document.getElementById('stNext').onclick = () => { if ((state.page + 1) * state.limit < state.total) { state.page++; load(); } };

    root.querySelectorAll('.vs').forEach(function (b) {
      if (b.dataset.view === state.view) b.classList.add('active');
      b.onclick = function () {
        state.view = b.dataset.view;
        try { localStorage.setItem('mm-student-view', state.view); } catch (e) {}
        root.querySelectorAll('.vs').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        load();
      };
    });

    document.getElementById('stBox').addEventListener('click', async (ev) => {
      const b = ev.target.closest('button');
      if (!b) {
        const card = ev.target.closest('[data-open]');
        if (card) MM.router.go('student', { id: Number(card.dataset.open) });
        return;
      }
      const id = Number(b.dataset.view || b.dataset.edit || b.dataset.del || b.dataset.print);
      const s = state.rows.find(x => x.id === id);
      if (b.dataset.view) MM.router.go('student', { id: id });
      else if (b.dataset.edit) MM.router.go('admission', { id: id });
      else if (b.dataset.print && s) MM.printStudent(s);
      else if (b.dataset.del && s) {
        if (await MM.util.confirm('“' + s.name_bn + '” এবং তাঁর সব ফি/পেমেন্ট, হাজিরা, ছাড় ও পরীক্ষার ফল স্থায়ীভাবে মুছে যাবে। পরে আর ফেরত আনা যাবে না। মুছে ফেলবেন?')) {
          b.disabled = true;
          try { await MM.students.remove(id); MM.util.toast('শিক্ষার্থী ও তাঁর সংশ্লিষ্ট সব তথ্য স্থায়ীভাবে মুছে ফেলা হয়েছে'); await load(); }
          catch (err) { MM.util.toast('মুছে ফেলা যায়নি: ' + err, 'err'); }
          finally { if (b.isConnected) b.disabled = false; }
        }
      }
    });

    await catalogReady;
    if (root.isConnected) await load();
  }

  return { render: render };
})();
