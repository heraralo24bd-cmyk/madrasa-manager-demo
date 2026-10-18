/* =========================================================
   পেজ: ছাত্রের ড্যাশবোর্ড (Student Profile)
   বায়োডাটা = বাস্তব ডেটাবেজ থেকে।
   আর্থিক ও শিক্ষার সারাংশ বাস্তব সংরক্ষিত তথ্য থেকে আসে।
   ========================================================= */
window.MM = window.MM || {};

MM.pageStudentProfile = (function () {
  const e = MM.util.esc;
  const bn = MM.util.bnNum;
  let S = null;
  let renderSequence = 0, activeAcademic = null, activeFinancial = null;
  function refreshActiveFinancial() {
    if(!activeFinancial?.alive()){activeFinancial=null;return;}
    activeFinancial.refresh();
  }
  document.addEventListener('mm-financial-change',refreshActiveFinancial);
  window.addEventListener('focus',refreshActiveFinancial);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshActiveFinancial();});

  function refreshActiveResults() {
    if (!activeAcademic?.alive()) { activeAcademic = null; return; }
    activeAcademic.refresh();
  }
  document.addEventListener('mm-academic-change', refreshActiveResults);
  window.addEventListener('focus', refreshActiveResults);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshActiveResults();
  });

  const ic = {
    user:  '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20v-1.6a6 6 0 0 1 11 0V20M16.5 4.6a3.4 3.4 0 0 1 0 6.8"/>',
    cake:  '<path d="M4 20h16v-6H4zM6 14v-3m6 3V9m6 5v-3"/><circle cx="12" cy="6" r="1.2"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.4"/><path d="M11 18.6h2"/>',
    pin:   '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    cal:   '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4m8-4v4M3 10h18"/>',
    tag:   '<path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
    home:  '<path d="M4 11 12 4l8 7v8a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19z"/>',
    cap:   '<path d="m2 9 10-5 10 5-10 5zM6 11v5c3 3 9 3 12 0v-5"/>',
    note:  '<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h5"/>',
    money: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-5"/>',
    minus: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>'
  };
  const svg = (d, cls) => '<svg class="' + (cls || '') + '" viewBox="0 0 24 24">' + d + '</svg>';

  function row(icon, label, value) {
    return '<div class="bio-row">' + svg(ic[icon] || ic.user, 'bio-ic') +
      '<span class="bio-lbl">' + label + '</span><i>:</i>' +
      '<b class="bio-val">' + (value ? bn(e(value)) : '-') + '</b></div>';
  }

  function statCard(icon, cls, title, value, sub) {
    return '<div class="pstat ' + cls + '"><span class="pstat-ic">' + svg(ic[icon], '') + '</span>' +
      '<div><span class="pstat-t">' + title + '</span>' +
      '<strong class="pstat-v">' + value + '</strong>' +
      '<span class="pstat-s">' + sub + '</span></div></div>';
  }

  function donut(pct) {
    const r = 46, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
    return '<svg class="p-donut" viewBox="0 0 120 120">' +
      '<circle cx="60" cy="60" r="' + r + '" class="d-bg"/>' +
      '<circle cx="60" cy="60" r="' + r + '" class="d-fg" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/>' +
      '<text x="60" y="57" class="d-num">' + bn(pct) + '%</text>' +
      '<text x="60" y="74" class="d-lbl">উপস্থিতির হার</text></svg>';
  }

  function html(s) {
    const addr = [s.village, s.post_office, s.upazila, s.district].filter(Boolean).join(', ');
    const photo = s.photo
      ? '<img class="p-photo" src="' + s.photo + '">'
      : '<span class="p-photo empty">' + e((s.name_bn || '·').trim().charAt(0)) + '</span>';
    const st = s.status || 'সক্রিয়';
    const stCls = st === 'সক্রিয়' ? 'ok' : (st === 'নিষ্ক্রিয়' ? 'off' : 'warn');

    return '' +
'<div class="crumb"><button class="crumb-back" data-act="back">' + svg('<path d="M15 6l-6 6 6 6"/>', '') + 'শিক্ষার্থী তালিকা</button>' +
'<span class="crumb-sep">›</span><span class="crumb-now">ছাত্রের ড্যাশবোর্ড</span></div>' +

/* ---- হিরো ---- */
'<section class="p-hero">' +
  '<div class="p-hero-left">' + photo +
    '<div class="p-id">' +
      '<h2>' + e(s.name_bn) + '</h2>' +
      '<div class="p-meta">' +
        '<span>' + svg(ic.tag, '') + 'রোল<i>:</i><b>' + bn(s.roll || '-') + '</b></span>' +
        '<span>' + svg(ic.cap, '') + 'শ্রেণি<i>:</i><b>' + e(s.class || '-') + '</b></span>' +
        '<span>' + svg(ic.note, '') + 'Student ID<i>:</i><b>' + e(s.student_id) + '</b></span>' +
      '</div>' +
      '<span class="p-status ' + stCls + '">' + e(st) + '</span>' +
    '</div>' +
  '</div>' +
  '<div class="p-hero-right">' +
    '<div class="p-actions">' +
      '<button class="btn btn-primary profile-pay-primary" data-profile-pay disabled>' + svg(ic.money, '') + 'ফি / বেতন জমা</button>' +
      '<button class="btn btn-ghost" data-act="edit">' + svg('<path d="M4 20h4l10-10-4-4L4 16z"/>', '') + 'সম্পাদনা</button>' +
      '<button class="btn btn-ghost" data-act="print">' + svg('<path d="M7 9V3h10v6M7 17H4v-6h16v6h-3M7 14h10v7H7z"/>', '') + 'প্রিন্ট</button>' +
      '<button class="btn btn-ghost" data-act="more">আরও ' + svg('<path d="m6 9 6 6 6-6"/>', '') + '</button>' +
    '</div>' +
    '<p class="p-quote">“ইলম অর্জন প্রতিটি মুসলিমের জন্য ফরজ”</p>' +
  '</div>' +
'</section>' +

/* ---- ৪টি স্ট্যাট ---- */
'<div class="pstat-row">' +
  statCard('money', 'blue',  'মোট বেতন',   '৳ ' + bn(0), '(বার্ষিক)') +
  statCard('check', 'green', 'মোট পরিশোধ', '৳ ' + bn(0), '(এ পর্যন্ত)') +
  statCard('minus', 'red',   'মোট বকেয়া',  '৳ ' + bn(0), '(এ পর্যন্ত)') +
  statCard('cal',   'amber', 'বকেয়া মাস',  bn(0) + ' মাস', '(চলমান)') +
'</div>' +

/* ---- ট্যাব ---- */
'<div class="p-tabs">' +
  '<button class="p-tab active" data-tab="bio">' + svg(ic.user, '') + 'বায়োডাটা</button>' +
  '<button class="p-tab" data-tab="fee">' + svg(ic.money, '') + 'বেতন/ফি</button>' +
  '<button class="p-tab" data-tab="discount">' + svg(ic.money, '') + 'ছাড়</button>' +
  '<button class="p-tab" data-tab="att">' + svg(ic.users, '') + 'উপস্থিতি</button>' +
  '<button class="p-tab" data-tab="res">' + svg(ic.note, '') + 'ফলাফল</button>' +
  '<button class="p-tab" data-tab="his">' + svg(ic.clock, '') + 'ইতিহাস</button>' +
'</div>' +

/* ---- মূল অংশ ---- */
'<div class="p-grid">' +
  '<section class="fcard"><div class="fcard-head">' + svg(ic.user, '') + 'ছাত্রের ব্যক্তিগত তথ্য' +
    '<button class="chip-btn" data-act="edit">আরও তথ্য ›</button></div>' +
    '<div class="fcard-body bio-body">' +
      row('user',  'নাম', s.name_bn) +
      row('users', 'পিতার নাম', s.father) +
      row('cake',  'জন্ম তারিখ', s.dob) +
      row('phone', 'মোবাইল', s.phone) +
      row('phone', 'অভিভাবকের মোবাইল', s.phone2 || s.phone) +
      row('users', 'অভিভাবক', s.guardian) +
      row('pin',   'ঠিকানা', addr) +
      row('cal',   'ভর্তি তারিখ', s.admission_date) +
      row('tag',   'শিক্ষার্থীর ধরন', s.stype) +
      row('cap',   'বিভাগ', s.department) +
      row('cal',   'শিক্ষাবর্ষ', s.year) +
      row('tag',   'ফরম নম্বর', s.form_no) +
      row('money', 'ভর্তি ফি', s.admission_fee ? '৳ ' + bn(s.admission_fee) : '-') +
      row('money', 'মাসিক বেতন', s.monthly_fee ? '৳ ' + bn(s.monthly_fee) : '-') +
      row('money', 'খাবার/আবাসন ফি', s.food_fee ? '৳ ' + bn(s.food_fee) : '-') +
      row('home',  'জন্ম নিবন্ধন', s.birth_reg) +
      row('cap',   'পূর্ববর্তী প্রতিষ্ঠান', s.prev_school) +
      row('clock', 'সর্বশেষ হালনাগাদ (লোকাল টাইম)', s.updated_at || s.created_at || '-') +
      row('note',  'বিশেষ তথ্য', s.remarks) +
    '</div></section>' +

  '<section class="fcard"><div class="fcard-head">' + svg(ic.money, '') + 'বেতন/ফি হিসাব' +
    '<button class="chip-btn soon" disabled>পরিশোধ করুন</button></div>' +
    '<div class="table-wrap"><table class="mm-table compact"><thead><tr>' +
      '<th>মাস</th><th>নির্ধারিত</th><th>পরিশোধ</th><th>বকেয়া</th><th>অবস্থা</th></tr></thead>' +
      '<tbody><tr><td colspan="5" class="empty-row soon-row">' +
        svg(ic.clock, 'soon-ic') + 'বেতন/ফি মডিউল পরবর্তী ধাপে যুক্ত হবে<br>' +
        '<span>নির্ধারিত মাসিক বেতন: ৳ ' + bn(s.monthly_fee || 0) + '</span></td></tr></tbody></table></div>' +
    '<div class="fee-total"><span>' + svg(ic.money, '') + 'মোট বকেয়া</span><b>৳ ' + bn(0) + '</b></div>' +
  '</section>' +

  '<div class="p-side">' +
    '<section class="fcard"><div class="fcard-head">' + svg(ic.users, '') + 'উপস্থিতির সারাংশ</div>' +
      '<div class="fcard-body att-body">' + donut(0) +
        '<ul class="legend">' +
          '<li><i class="dot g"></i>মোট দিন<b>' + bn(0) + '</b></li>' +
          '<li><i class="dot b"></i>উপস্থিত<b>' + bn(0) + '</b></li>' +
          '<li><i class="dot r"></i>অনুপস্থিত<b>' + bn(0) + '</b></li>' +
          '<li><i class="dot y"></i>ছুটি<b>' + bn(0) + '</b></li>' +
        '</ul></div></section>' +

    '<section class="fcard"><div class="fcard-head">' + svg(ic.note, '') + 'পরীক্ষার ফলাফল' +
      '<button class="chip-btn soon" disabled>সকল ফলাফল</button></div>' +
      '<div class="table-wrap"><table class="mm-table compact"><thead><tr>' +
        '<th>পরীক্ষা</th><th>বিষয়</th><th>নম্বর</th><th>গ্রেড</th></tr></thead>' +
        '<tbody><tr><td colspan="4" class="empty-row soon-row">' + svg(ic.clock, 'soon-ic') +
        'পরীক্ষা ও ফলাফল মডিউল পরবর্তী ধাপে যুক্ত হবে</td></tr></tbody></table></div></section>' +
  '</div>' +
'</div>' +

/* ---- সাম্প্রতিক কার্যক্রম ---- */
'<div class="p-bottom">' +
  '<section class="fcard"><div class="fcard-head">' + svg(ic.clock, '') + 'সাম্প্রতিক কার্যক্রম</div>' +
    '<div class="fcard-body act-row">' +
      actItem('cal',   'ভর্তি সম্পন্ন', s.admission_date, 'প্রদান') +
      actItem('money', 'শেষ ফি পরিশোধ', '', 'পেমেন্ট') +
      actItem('users', 'শেষ উপস্থিতি', '', 'উপস্থিতি') +
      actItem('note',  'শেষ পরীক্ষা', '', 'পরীক্ষা') +
      actItem('home',  'নোটিশ', '', 'নোটিশ') +
    '</div></section>' +
'</div>' +
'<footer class="support-footer"><span>সেবা ও সহযোগিতা: <b>01733445568</b></span><button>যোগাযোগ</button></footer>';
  }

  function actItem(icon, title, date, tag) {
    return '<div class="act-item"><span class="act-ic">' + svg(ic[icon], '') + '</span>' +
      '<div><b>' + title + '</b><span>' + (date ? bn(e(date)) : '-') + '</span>' +
      '<small>(' + tag + ')</small></div></div>';
  }

  async function render(root, params) {
    const sequence = ++renderSequence;
    activeAcademic = null;
    activeFinancial = null;
    root.innerHTML = '<div class="page-loading">লোড হচ্ছে…</div>';
    let student;
    try {
      student = await MM.students.get(Number(params.id));
    } catch (err) {
      if (sequence !== renderSequence || MM.router.current !== 'student') return;
      root.innerHTML = '<div class="page-loading">তথ্য আনা যায়নি: ' + e(String(err)) + '</div>';
      return;
    }
    if (sequence !== renderSequence || MM.router.current !== 'student' || !root.isConnected) return;
    S = student;
    if (!S) { root.innerHTML = '<div class="page-loading">শিক্ষার্থী পাওয়া যায়নি</div>'; return; }

    root.innerHTML = html(S);
    const anchor = root.querySelector('.p-hero');
    const alive = () => root.isConnected && sequence === renderSequence && MM.router.current === 'student' && root.contains(anchor);
    let summary;
    try {
      summary = await MM.records.invoke('student_summary', {id:student.id});
      if (!alive()) return;
    } catch (err) {
      if (!alive()) return;
      root.querySelector('.p-grid').innerHTML = '<div class="r-error">' + e(String(err)) + '</div>';
      return;
    }
    let feeRows = summary.fees.rows;
    let paymentRequest = false, paymentChoice = null, generateForm = null, feePage = 0;
    const paid=feeRows.reduce((n,r)=>n+r.paid,0), due=feeRows.reduce((n,r)=>n+Math.max(0,r.due),0);
    const statValues=root.querySelectorAll('.pstat-v');
    statValues[0].textContent=MM.records.money(feeRows.reduce((n,r)=>n+r.amount,0));
    statValues[1].textContent=MM.records.money(paid);statValues[2].textContent=MM.records.money(due);
    statValues[3].textContent=bn(new Set(feeRows.filter(r=>r.due>0).map(r=>r.period)).size)+' টি';
    root.querySelectorAll('.pstat-s').forEach(b=>b.textContent='(সংরক্ষিত হিসাব)');
    const discountData=await MM.records.invoke('discount_get',{student_id:student.id});
    if (!alive()) return;
    let discountHTML='<div class="r-toolbar"><button class="btn btn-primary" data-discount>ছাড় পরিবর্তন</button></div>'+MM.discounts.summaryHTML(discountData)+MM.discounts.historyHTML(discountData);
    const fmtPeriod = (p) => p === 'once' ? 'এককালীন' : bn(e(p));
    const feeState = r => Number(r.due)<0?'অগ্রিম':Number(r.due)===0?'পরিশোধিত':Number(r.paid)>0?'আংশিক':'বকেয়া';
    const feeAction = r => Number(r.due)>0
      ? '<button type="button" class="btn btn-primary" data-profile-charge="'+Number(r.id)+'" aria-label="'+e(r.fee_name+' · '+r.period+' জমা দিন')+'">জমা দিন</button>'
      : '<span class="profile-result-state published">'+feeState(r)+'</span>';
    const feeActionsHTML = () => '<div class="profile-fee-actions"><button type="button" class="btn btn-primary" data-profile-pay>'+svg(ic.money,'')+'ফি / বেতন জমা</button><button type="button" class="btn btn-ghost" data-profile-generate>'+svg(ic.cal,'')+'নতুন মাসের হিসাব</button></div>';
    const feeScheduleHTML=()=> {
      const available=summary.available_fees||[];
      const schedule=available.length
        ? MM.records.table(['ফি','নির্ধারিত হার','সময়','অবস্থা'],available.map(f=>{const posted=feeRows.some(r=>Number(r.type_id)===Number(f.id));return MM.records.cells([e(f.name),MM.records.money(f.amount),e({monthly:'মাসিক',yearly:'বার্ষিক',once:'এককালীন',manual:'অন্যান্য'}[f.frequency]||f.frequency),posted?'লেজারে সংযুক্ত ✓':'হিসাব তৈরির অপেক্ষায়']);}))
        : '';
      return schedule;
    };
    const overviewFeeHTML = () => '<div class="fcard-head">'+svg(ic.money,'')+'বেতন/ফি হিসাব<button type="button" class="chip-btn" data-profile-fee-tab>সব হিসাব</button></div>'+feeActionsHTML()+
      MM.records.table(['সময় / ফি','নির্ধারিত','পরিশোধ','বকেয়া','কাজ'],feeRows.slice(0,6).map(r=>MM.records.cells([fmtPeriod(r.period)+'<small>'+e(r.fee_name)+'</small>',MM.records.money(r.amount),MM.records.money(r.paid),MM.records.money(r.due),feeAction(r)])))+
      '<div class="fee-total"><span>মোট বকেয়া</span><b>'+MM.records.money(feeRows.reduce((n,r)=>n+Math.max(0,Number(r.due)),0))+'</b></div>';
    const historyHTML = () => MM.records.table(['রসিদ','তারিখ','ফি / সময়','টাকা','অবস্থা','কাজ'],summary.fees.receipts.map(r=>MM.records.cells(['MM-'+bn(r.id),bn(e(r.pay_date)),e(r.fee_name)+'<small>'+fmtPeriod(r.period)+'</small>',MM.records.money(r.amount),r.void_reason?'বাতিল':'জমা','<button type="button" class="btn btn-ghost" data-profile-receipt="'+Number(r.id)+'">'+MM.records.icon('print')+'রসিদ</button>'])));
    const attendance=summary.attendance, total=attendance.length, present=attendance.filter(r=>['present','late'].includes(r.status)).length, absent=attendance.filter(r=>r.status==='absent').length, leave=attendance.filter(r=>r.status==='leave').length;
    const attHTML='<div class="fcard-body att-body">'+donut(total?Math.round(present/total*100):0)+'<ul class="legend"><li>রেকর্ডকৃত দিন<b>'+bn(total)+'</b></li><li>উপস্থিত / বিলম্ব<b>'+bn(present)+'</b></li><li>অনুপস্থিত<b>'+bn(absent)+'</b></li><li>ছুটি<b>'+bn(leave)+'</b></li></ul></div>';
    let academic = {exams:summary.result_exams,results:summary.results}, resultSequence = 0;
    const resultState = ex => '<span class="profile-result-state '+(ex.published?'published':'draft')+'">'+(ex.published?'প্রকাশিত':'খসড়া')+'</span>';
    const previewHTML = () => MM.records.table(['পরীক্ষা','মোট / গ্রেড','অবস্থা'],academic.exams.slice(0,5).map(({exam:ex,result:r}) => MM.records.cells([
      e(ex.name)+'<small>'+bn(e(ex.day))+'</small>',bn(r.total)+' / '+bn(r.full)+'<small>'+e(r.grade)+'</small>',resultState(ex)
    ])));
    const bindAcademic = box => box.querySelectorAll('[data-result-exam]').forEach(b => {
      b.onclick=async()=>{
        b.disabled=true;
        try {await MM.marksheet.openStudent(Number(b.dataset.resultExam),student.id,alive);}
        catch(err) {if(alive())MM.util.toast(String(err),'err');}
        finally {if(b.isConnected)b.disabled=false;}
      };
    });
    function resultPanel() {
      const grid=root.querySelector('.p-grid');
      grid.innerHTML='<section class="records profile-results"><div class="r-toolbar"><button class="btn btn-primary" data-open>'+svg(ic.note,'')+'সকল ফলাফল</button><button class="btn btn-ghost" data-smart-results>Result Management</button><button class="btn btn-ghost profile-result-refresh" data-result-refresh title="ফলাফল হালনাগাদ" aria-label="ফলাফল হালনাগাদ">'+MM.records.icon('refresh')+'</button></div><div role="status" data-result-status></div><div data-result-exams></div><h3>বিষয়ভিত্তিক নম্বর</h3><div data-result-subjects></div></section>';
      grid.querySelector('[data-open]').onclick=()=>MM.router.go('results',{studentId:student.id,class:student.class});
      grid.querySelector('[data-smart-results]').onclick=()=>MM.router.go('result-management',{class:student.class,studentId:student.id});
      grid.querySelector('[data-result-refresh]').onclick=refreshResults;
      MM.records.paged(grid.querySelector('[data-result-exams]'),['পরীক্ষা','তারিখ','অবস্থা','মোট / পূর্ণ','গড়','গ্রেড','GPA','শতকরা','মেধাক্রম','কাজ'],academic.exams.map(({exam:ex,result:r})=>MM.records.cells([
        e(ex.name),bn(e(ex.day)),resultState(ex),bn(r.total)+' / '+bn(r.full),r.complete ? bn(Number(r.average||0).toFixed(2)) : '-',e(r.grade),r.gpa===null || r.gpa===undefined ? '-' : bn(Number(r.gpa).toFixed(2)),r.complete?bn(r.percentage.toFixed(2))+'%':'-',bn(r.rank??'-'),'<button class="btn btn-ghost" data-result-exam="'+ex.id+'">'+MM.records.icon('file')+'মার্কশিট</button>'
      ])),bindAcademic,undefined,'resultExams');
      MM.records.paged(grid.querySelector('[data-result-subjects]'),['পরীক্ষা','বিষয়','নম্বর','গ্রেড'],academic.results.map(r=>MM.records.cells([
        e(r.name)+'<small>'+bn(e(r.day))+'</small>',e(r.subject),!r.recorded?'-':r.absent?'অনুপস্থিত':bn(r.marks)+' / '+bn(r.full),e(r.grade)
      ])),undefined,undefined,'resultSubjects');
      MM.i18n?.apply(MM.i18n.lang);
    }
    async function refreshResults() {
      const n=++resultSequence;
      const button=root.querySelector('[data-result-refresh]');
      if(button)button.disabled=true;
      try {
        const next=await MM.records.invoke('student_results',{student_id:student.id});
        if(!alive() || n!==resultSequence)return;
        academic=next;
        const currentTab=root.querySelector('.p-tab.active')?.dataset.tab;
        const card=root.querySelector('[data-profile-result-card]');
        if(card)card.innerHTML=resultCard();
        updateBioResults();
        if(currentTab==='res')resultPanel();
        bindRecords(root);
        const last=root.querySelectorAll('.act-item > div > span')[3];
        if(last)last.textContent=academic.exams[0]?.exam.day||'-';
      } catch(err) {
        if(alive() && n===resultSequence) {
          const status=root.querySelector('[data-result-status]');
          if(status) {status.className='r-error';status.textContent=String(err);}
          else MM.util.toast('ফলাফল আনা যায়নি: '+err,'err');
        }
      } finally {if(button?.isConnected && n===resultSequence)button.disabled=false;}
    }
    function bindRecords(box) {
      box.querySelectorAll('[data-record]').forEach(b=>b.onclick=()=>MM.router.go(b.dataset.record,{studentId:student.id,class:student.class}));
      box.querySelectorAll('[data-profile-pay]').forEach(b=>{b.disabled=false;b.onclick=()=>openPayment();});
      box.querySelectorAll('[data-profile-charge]').forEach(b=>b.onclick=()=>openPayment(Number(b.dataset.profileCharge)));
      box.querySelectorAll('[data-profile-generate]').forEach(b=>b.onclick=()=>openGenerate());
      box.querySelectorAll('[data-profile-fee-tab]').forEach(b=>b.onclick=()=>root.querySelector('.p-tab[data-tab="fee"]').click());
      box.querySelectorAll('[data-profile-receipt]').forEach(b=>b.onclick=()=>{
        const receipt=summary.fees.receipts.find(r=>Number(r.id)===Number(b.dataset.profileReceipt));
        if(receipt)MM.records.receipt(receipt,false);
      });
    }
    function feePanel() {
      const grid=root.querySelector('.p-grid');
      grid.innerHTML='<section class="records profile-wide profile-fees"><div class="r-toolbar">'+feeActionsHTML()+'</div><p class="profile-fee-note">যে মাস ও ফি বাবদ টাকা জমা দেবেন, সেই হিসাবের “জমা দিন” বাটন চাপুন। আংশিক পরিশোধও করা যাবে।</p><div data-profile-fees></div><details class="profile-fee-schedule"><summary>চলমান ফি নির্ধারণ</summary><div data-profile-fee-schedule>'+feeScheduleHTML()+'</div></details></section>';
      updateFeePage();bindRecords(grid);
    }
    function updateFeePage() {
      const box=root.querySelector('[data-profile-fees]');
      if(!box)return;
      feePage=Math.min(feePage,Math.max(0,Math.ceil(feeRows.length/50)-1));
      box.innerHTML=MM.records.table(['সময়','ফি','মূল ফি','ছাড়','পরিশোধযোগ্য','পরিশোধ','বকেয়া','কাজ'],feeRows.slice(feePage*50,(feePage+1)*50).map(r=>MM.records.cells([fmtPeriod(r.period),e(r.fee_name),MM.records.money(r.original_amount),MM.records.money(r.discount_amount),MM.records.money(r.amount),MM.records.money(r.paid),MM.records.money(r.due),feeAction(r)])))+
        '<div class="r-pager"><span>'+bn(feeRows.length)+' টি</span><div><button type="button" class="btn btn-ghost" data-profile-fee-prev>আগের</button><button type="button" class="btn btn-ghost" data-profile-fee-next>পরের</button></div></div>';
      const prev=box.querySelector('[data-profile-fee-prev]'),next=box.querySelector('[data-profile-fee-next]');
      prev.disabled=feePage===0;next.disabled=(feePage+1)*50>=feeRows.length;
      prev.onclick=()=>{feePage--;updateFeePage();};next.onclick=()=>{feePage++;updateFeePage();};
      bindRecords(box);
    }
    async function openPayment(chargeId=0) {
      if(!alive()||paymentRequest)return;
      if(paymentChoice?.isConnected){paymentChoice.querySelector('button')?.focus();return;}
      paymentRequest=true;
      root.querySelectorAll('[data-profile-pay],[data-profile-charge]').forEach(b=>b.disabled=true);
      try {
        // Read the current balance immediately before a payment, never a cached amount.
        const ledger=await MM.records.invoke('fee_list',{student_id:student.id,class:'',search:'',dues:false});
        if(!alive())return;
        const dueRows=ledger.rows.filter(r=>Number(r.student_key)===Number(student.id)&&Number(r.due)>0);
        if(chargeId) {
          const charge=dueRows.find(r=>Number(r.id)===Number(chargeId));
          if(!charge){await refreshFinancial();if(alive())MM.util.toast('এই হিসাবের কোনো বকেয়া নেই। সর্বশেষ হিসাব দেখানো হয়েছে।');return;}
          await MM.feePayment.open(charge,refreshFinancial,alive);
        } else if(dueRows.length===1) {
          await MM.feePayment.open(dueRows[0],refreshFinancial,alive);
        } else if(dueRows.length>1) {
          choosePayment(dueRows);
        } else {
          await refreshFinancial();
          if(alive())openGenerate('এই শিক্ষার্থীর কোনো বকেয়া নেই। নতুন মাসের ফি জমা দিতে আগে সেই মাসের হিসাব তৈরি করুন।');
        }
      } catch(err) {if(alive())MM.util.toast('পরিশোধের ফরম খোলা যায়নি: '+err,'err');}
      finally {paymentRequest=false;if(alive())root.querySelectorAll('[data-profile-pay],[data-profile-charge]').forEach(b=>b.disabled=false);}
    }
    function choosePayment(rows) {
      const previous=document.activeElement,wrap=document.createElement('div');
      paymentChoice=wrap;wrap.className='r-modal profile-fee-picker';
      wrap.innerHTML='<section class="r-dialog" role="dialog" aria-modal="true" aria-labelledby="profileFeeChoiceTitle"><div class="r-dialog-head"><h3 id="profileFeeChoiceTitle">কোন মাসের ফি / বেতন জমা দেবেন?</h3><button type="button" class="r-dialog-close" data-profile-choice-close aria-label="বন্ধ">×</button></div><p class="profile-fee-note">'+e(student.name_bn)+' · '+e(student.student_id)+'<br>একটি হিসাব বেছে নিন। পরের ধাপে টাকা, তারিখ ও মাধ্যম নির্ধারণ করতে পারবেন।</p><div class="profile-fee-choices">'+rows.map(r=>'<button type="button" class="profile-fee-choice" data-profile-choose="'+Number(r.id)+'"><span><strong>'+e(r.fee_name)+'</strong><small>'+fmtPeriod(r.period)+' · '+feeState(r)+'</small></span><span><small>বকেয়া</small><strong>'+MM.records.money(r.due)+'</strong></span></button>').join('')+'</div><div class="r-actions"><button type="button" class="btn btn-ghost" data-profile-choice-close>বন্ধ করুন</button></div></section>';
      function close(restore=true) {document.removeEventListener('keydown',key);wrap.remove();if(paymentChoice===wrap)paymentChoice=null;if(restore&&previous?.isConnected)previous.focus();}
      function key(ev) {
        if(ev.key==='Escape'){ev.preventDefault();close();}
        if(ev.key==='Tab'){
          const items=[...wrap.querySelectorAll('button')].filter(b=>!b.disabled),first=items[0],last=items.at(-1);
          if(ev.shiftKey&&(document.activeElement===first||!wrap.contains(document.activeElement))){ev.preventDefault();last.focus();}
          else if(!ev.shiftKey&&(document.activeElement===last||!wrap.contains(document.activeElement))){ev.preventDefault();first.focus();}
        }
      }
      wrap.querySelectorAll('[data-profile-choice-close]').forEach(b=>b.onclick=()=>close());
      wrap.querySelectorAll('[data-profile-choose]').forEach(b=>b.onclick=()=>{const id=Number(b.dataset.profileChoose);close();if(alive())openPayment(id);});
      document.body.append(wrap);document.addEventListener('keydown',key);wrap.querySelector('[data-profile-choose]').focus();
    }
    function openGenerate(note='') {
      if(!alive())return;
      if(generateForm?.isConnected){generateForm.querySelector('select')?.focus();return;}
      const fees=summary.available_fees||[];
      if(!fees.length){MM.util.toast('এই শিক্ষার্থীর জন্য কোনো সক্রিয় ফি নির্ধারিত নেই। আগে ফি নির্ধারণ করুন।','err');return;}
      const defaultFee=fees.find(f=>f.frequency==='monthly'&&Number(f.amount)>0)||fees.find(f=>f.frequency==='monthly')||fees[0];
      generateForm=MM.records.modal('এই শিক্ষার্থীর নতুন ফি হিসাব',
        '<div class="r-banner"><strong>'+e(student.name_bn)+'</strong> · '+e(student.student_id)+'</div><p class="profile-fee-note">'+e(note||'শুধু এই শিক্ষার্থীর নির্বাচিত ফি ও মাসের হিসাব তৈরি হবে। আগের হিসাব বা পরিশোধ পরিবর্তন হবে না।')+'</p><div class="r-form-grid">'+
        MM.records.select('profileFeeType','কোন ফি বাবদ',fees.map(f=>'<option value="'+Number(f.id)+'"'+(f.id===defaultFee.id?' selected':'')+'>'+e(f.name)+' — '+MM.records.money(f.amount)+'</option>').join(''))+
        MM.records.field('profileFeeMonth','হিসাবের মাস','month',MM.util.today().slice(0,7),'required')+'</div><p class="profile-fee-note" data-profile-generate-note></p>',
        async form=>{
          if(!alive())throw 'শিক্ষার্থীর পেজটি বন্ধ হয়েছে। আবার খুলে চেষ্টা করুন।';
          const typeId=Number(form.querySelector('#profileFeeType').value),month=form.querySelector('#profileFeeMonth').value;
          if(!fees.some(f=>Number(f.id)===typeId)||!/^\d{4}-\d{2}$/.test(month))throw 'ফি ও মাস সঠিকভাবে নির্বাচন করুন।';
          const result=await MM.records.invoke('fee_generate',{type_id:typeId,month,class:'',student_id:student.id});
          const refreshed=await refreshFinancial();
          if(!alive())return;
          MM.util.toast(Number(result.created)>0?'নতুন হিসাব তৈরি হয়েছে। এখন টাকা জমা দিতে পারবেন।':'নির্বাচিত সময়ের হিসাব আগে থেকেই আছে; আগের হিসাব অক্ষত আছে।');
          if(!refreshed)return;
          const fee=fees.find(f=>Number(f.id)===typeId),period=fee.frequency==='once'?'once':fee.frequency==='yearly'?month.slice(0,4):month;
          const charge=feeRows.find(r=>Number(r.type_id)===typeId&&r.period===period&&Number(r.due)>0);
          if(charge)window.setTimeout(()=>{if(alive())openPayment(Number(charge.id));},180);
        },'হিসাব তৈরি করে জমা দিন');
      const noteBox=generateForm.querySelector('[data-profile-generate-note]');
      function updateNote(){const f=fees.find(x=>Number(x.id)===Number(generateForm.querySelector('#profileFeeType').value));noteBox.textContent=f?.frequency==='once'?'এককালীন ফি: আগে হিসাব থাকলে আবার তৈরি হবে না।':f?.frequency==='yearly'?'বার্ষিক ফি: নির্বাচিত মাসের বছরের জন্য হিসাব হবে।':'নির্বাচিত মাসের হিসাব তৈরি হবে; বকেয়া থাকলে পরিশোধের ফরম খুলবে।';}
      generateForm.querySelector('#profileFeeType').onchange=updateNote;updateNote();
    }
    const resultCard=()=>'<div class="fcard-head">'+svg(ic.note,'')+'পরীক্ষার ফলাফল<button class="chip-btn" data-record="results">সকল ফলাফল</button></div>'+previewHTML();
    const feeCard=root.querySelectorAll('.p-grid > .fcard')[1];
    feeCard.classList.add('profile-fee-card','records');
    feeCard.setAttribute('data-profile-fee-card','');
    feeCard.innerHTML=overviewFeeHTML();
    const sideCards=root.querySelectorAll('.p-side .fcard');
    sideCards[0].innerHTML='<div class="fcard-head">'+svg(ic.users,'')+'উপস্থিতির সারাংশ<button class="chip-btn" data-record="attendance">হাজিরা</button></div>'+attHTML;
    sideCards[1].setAttribute('data-profile-result-card','');
    sideCards[1].classList.add('records');
    sideCards[1].innerHTML=resultCard();
    bindRecords(root);
    const activities=root.querySelectorAll('.act-item > div > span');
    if(activities[1])activities[1].textContent=summary.fees.receipts.find(r=>!r.void_reason)?.pay_date||'-';
    if(activities[2])activities[2].textContent=attendance[0]?.day||'-';
    if(activities[3])activities[3].textContent=academic.exams[0]?.exam.day||'-';
    let bioHTML=root.querySelector('.p-grid').innerHTML;
    function updateBioResults() {
      const copy=document.createElement('div');
      copy.innerHTML=bioHTML;
      copy.querySelector('[data-profile-result-card]').innerHTML=resultCard();
      bioHTML=copy.innerHTML;
    }
    let financialSequence=0;
    async function refreshFinancial() {
      const ticket=++financialSequence;
      try {
        const [next,discount]=await Promise.all([
          MM.records.invoke('student_summary',{id:student.id}),
          MM.records.invoke('discount_get',{student_id:student.id})
        ]);
        if(!alive()||ticket!==financialSequence)return;
        summary=next;feeRows=next.fees.rows;
        const values=root.querySelectorAll('.pstat-v');
        values[0].textContent=MM.records.money(feeRows.reduce((n,r)=>n+r.amount,0));
        values[1].textContent=MM.records.money(feeRows.reduce((n,r)=>n+r.paid,0));
        values[2].textContent=MM.records.money(feeRows.reduce((n,r)=>n+Math.max(0,r.due),0));
        values[3].textContent=bn(new Set(feeRows.filter(r=>r.due>0).map(r=>r.period)).size)+' টি';
        discountHTML='<div class="r-toolbar"><button class="btn btn-primary" data-discount>ছাড় পরিবর্তন</button></div>'+MM.discounts.summaryHTML(discount)+MM.discounts.historyHTML(discount);
        const copy=document.createElement('div');copy.innerHTML=bioHTML;
        copy.querySelector('[data-profile-fee-card]').innerHTML=overviewFeeHTML();
        bioHTML=copy.innerHTML;
        const last=root.querySelectorAll('.act-item > div > span')[1];
        if(last)last.textContent=next.fees.receipts.find(r=>!r.void_reason)?.pay_date||'-';
        const tab=root.querySelector('.p-tab.active')?.dataset.tab;
        const visibleFee=root.querySelector('[data-profile-fee-card]');
        if(visibleFee)visibleFee.innerHTML=overviewFeeHTML();
        if(tab==='fee'){
          updateFeePage();
          const schedule=root.querySelector('[data-profile-fee-schedule]');if(schedule)schedule.innerHTML=feeScheduleHTML();
        }
        if(tab==='discount'){
          const box=root.querySelector('.profile-discounts');
          if(box){box.innerHTML=discountHTML;box.querySelector('[data-discount]').onclick=()=>MM.discounts.manage(student.id,refreshFinancial);}
        }
        if(tab==='his'){const history=root.querySelector('[data-profile-history]');if(history)history.innerHTML=historyHTML();}
        bindRecords(root);
        MM.i18n?.apply(MM.i18n.lang);
        return next;
      } catch(err) {if(alive()&&ticket===financialSequence)MM.util.toast('হিসাব হালনাগাদ করা যায়নি: '+err,'err');return null;}
    }
    activeFinancial={alive,refresh:refreshFinancial};
    activeAcademic={alive,refresh:refreshResults};

    root.querySelectorAll('[data-act="back"]').forEach(b => b.onclick = () => MM.router.go('students'));
    root.querySelectorAll('[data-act="edit"]').forEach(b => b.onclick = () => {if(alive())MM.router.go('admission', { id: student.id });});
    root.querySelectorAll('[data-act="print"]').forEach(b => b.onclick = () => {if(alive())MM.printStudent(student);});
    const more = root.querySelector('[data-act="more"]');
    if (more) more.onclick = async () => {
      if (await MM.util.confirm('“' + student.name_bn + '” এবং তাঁর সব ফি/পেমেন্ট, হাজিরা, ছাড় ও পরীক্ষার ফল স্থায়ীভাবে মুছে যাবে। পরে আর ফেরত আনা যাবে না। মুছে ফেলবেন?')) {
        if(!alive())return;
        try { await MM.students.remove(student.id); MM.util.toast('শিক্ষার্থী ও তাঁর সংশ্লিষ্ট সব তথ্য স্থায়ীভাবে মুছে ফেলা হয়েছে'); if(alive())MM.router.go('students'); }
        catch (err) { MM.util.toast('মুছে ফেলা যায়নি: ' + err, 'err'); }
      }
    };

    root.querySelectorAll('.p-tab').forEach((t) => {
      t.onclick = () => {
        if(t.classList.contains('active'))return;
        root.querySelectorAll('.p-tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        const grid=root.querySelector('.p-grid');
        MM.records.animateTab(grid);
        if(t.dataset.tab==='discount'){grid.innerHTML='<section class="records profile-wide profile-discounts" style="grid-column:1/-1">'+discountHTML+'</section>';grid.querySelector('[data-discount]').onclick=()=>MM.discounts.manage(student.id,refreshFinancial);return;}
        if(t.dataset.tab==='bio'){grid.innerHTML=bioHTML;bindRecords(grid);grid.querySelectorAll('[data-act="edit"]').forEach(b=>b.onclick=()=>MM.router.go('admission',{id:student.id}));return;}
        if(t.dataset.tab==='res'){resultPanel();refreshResults();return;}
        if(t.dataset.tab==='att'){
          grid.innerHTML='<section class="records profile-attendance" style="grid-column:1/-1"></section>';
          MM.studentAttendance.mount(grid.querySelector('section'),{studentId:student.id,alive,month:attendance[0]?.day.slice(0,7)});
          return;
        }
        if(t.dataset.tab==='fee') {
          feePanel();
          return;
        }
        grid.innerHTML='<section class="records profile-wide profile-history" style="grid-column:1/-1"><div class="r-toolbar">'+feeActionsHTML()+'</div><div data-profile-history>'+historyHTML()+'</div></section>';
        bindRecords(grid);
      };
    });
  }

  return { render: render };
})();
