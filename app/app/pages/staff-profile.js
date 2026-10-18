window.MM = window.MM || {};
MM.staffProfile = (() => {
  const r=()=>MM.records, e=MM.util.esc, t=s=>MM.i18n.t(s);
  const statuses=[['present','উপস্থিত'],['absent','অনুপস্থিত'],['leave','ছুটি'],['late','বিলম্ব']];
  const mounts=new Set();
  const num=v=>MM.i18n.lang==='en'?String(v):MM.util.bnNum(v);
  const date=v=>v?num(v):'-';
  const address=p=>['village','post_office','union','upazila','district','division','postcode','country'].map(k=>p?.[k]).filter(Boolean).join(', ');
  const detail=rows=>'<dl class="sp-details">'+rows.map(([label,value])=>'<div><dt>'+t(label)+'</dt><dd translate="no">'+e(value||'-')+'</dd></div>').join('')+'</dl>';
  const section=(title,body)=>'<section class="sp-section"><h3>'+t(title)+'</h3>'+body+'</section>';
  function counts(entries){return Object.fromEntries(statuses.map(([key])=>[key,entries.filter(row=>row.status===key).length]));}
  function monthly(s,data){
    const c=counts(data.entries),codes=MM.i18n.lang==='en'?{present:'P',absent:'A',leave:'L',late:'T'}:{present:'উ',absent:'অ',leave:'ছ',late:'ব'};
    const days=new Map(data.entries.map(row=>[Number(row.day.slice(8)),row]));
    return '<section class="sp-att-report" data-staff-month="'+e(data.month)+'"><h3>'+e(s.name)+' · '+date(data.month)+'</h3><div class="sp-att-summary">'+statuses.map(([key,label])=>'<div class="sp-count '+key+'"><span>'+t(label)+'</span><strong>'+num(c[key])+'</strong></div>').join('')+'</div><div class="a-register-legend">'+statuses.map(([key,label])=>'<span class="a-key a-'+key+'">'+codes[key]+' = '+t(label)+'</span>').join('')+'<span>— = '+t('হাজিরা নেওয়া হয়নি')+'</span></div><div class="sp-register-scroll"><table class="sp-register"><thead><tr>'+Array.from({length:data.days},(_,i)=>'<th>'+num(i+1)+'</th>').join('')+'</tr></thead><tbody><tr>'+Array.from({length:data.days},(_,i)=>{const row=days.get(i+1);return '<td data-sp-day="'+(i+1)+'" class="'+(row?'a-'+row.status:'')+'" title="'+e(data.month+'-'+String(i+1).padStart(2,'0')+(row?' · '+t(statuses.find(([key])=>key===row.status)[1])+(row.note?' · '+row.note:''):''))+'">'+(row?codes[row.status]:'—')+'</td>';}).join('')+'</tr></tbody></table></div>'+section('ছুটির কারণ',data.entries.some(row=>row.status==='leave')?'<ul class="sp-leave-notes">'+data.entries.filter(row=>row.status==='leave').map(row=>'<li><time>'+date(row.day)+'</time><span translate="no">'+e(row.note||t('কারণ লেখা হয়নি'))+'</span></li>').join('')+'</ul>':'<p class="sp-empty">'+t('এই মাসে ছুটির রেকর্ড নেই')+'</p>')+'</section>';
  }
  async function render(ctx){
    const {body,params}=ctx,id=Number(params.staffId);let data,tab=params.tab||'bio',sequence=0,viewSequence=0,month=MM.util.today().slice(0,7),payMonth='',salaryMonth='',payrollUpdate=null,latestLoad=null;
    if(!['bio','attendance','payroll','documents','history'].includes(tab))tab='bio';
    const state={root:body,refresh:load};mounts.add(state);
    const valid=()=>body.isConnected&&ctx.alive();
    function load(){latestLoad=loadData();return latestLoad;}
    async function loadData(){
      const n=++sequence;
      try{const next=await r().invoke('staff_dashboard',{id});if(!valid()||n!==sequence)return;
        const staffChanged=data&&JSON.stringify(data.staff)!==JSON.stringify(next.staff);data=next;
        if(!body.querySelector('[data-sp-content]'))paint();
        else{
          if(staffChanged){const fresh=document.createElement('div');fresh.innerHTML=heading(data.staff);body.querySelector('.sp-heading').replaceWith(fresh.firstElementChild);bindHeading();}
          for(const [key,value] of Object.entries({salary:data.staff.salary,...data.summary})){const el=body.querySelector('[data-sp-total="'+key+'"]');if(el)el.textContent=r().money(value);}
          if(tab==='payroll'&&payrollUpdate)payrollUpdate();else showTab();
        }
        return next;
      }catch(error){if(valid()&&n===sequence){if(!data)body.innerHTML='<div class="r-error">'+e(error)+'</div>';else MM.util.toast(String(error),'err');}}
    }
    function heading(s){const p=s.profile;return '<div class="sp-heading">'+(p.photo?'<img class="sp-photo" src="'+e(p.photo)+'" alt="'+e(s.name)+'">':'<span class="sp-photo sp-photo-empty">'+r().icon('users')+'</span>')+'<div><h2 translate="no">'+e(s.name)+'</h2><p translate="no">'+e(p.name_en||'')+'</p><p><span translate="no">'+e(p.employee_code||'ST-'+s.id)+'</span> · <span translate="no">'+e(p.designation||s.role)+'</span>'+ (p.department?' · <span translate="no">'+e(p.department)+'</span>':'')+'</p><span class="sp-badge '+(s.active?'active':'inactive')+'">'+t(s.active?'সক্রিয়':'নিষ্ক্রিয়')+'</span> <span>'+t('যোগদান')+' '+date(s.join_date)+'</span></div><div class="sp-heading-actions">'+r().button('spPaySalary',t('বেতন প্রদান'),'money',true)+r().button('spEdit',t('সম্পাদনা'),'file')+r().button('spRefresh',t('হালনাগাদ'),'refresh')+'</div></div>';}
    function bindHeading(){
      body.querySelector('#spEdit').onclick=()=>MM.staffDetails.openEdit(id,load);
      body.querySelector('#spRefresh').onclick=load;
      body.querySelector('#spPaySalary').onclick=()=>{if(tab!=='payroll'){tab='payroll';showTab();}body.querySelector('#spSalaryMonth')?.focus({preventScroll:true});};
    }
    function paint(){
      const s=data.staff;
      body.classList.add('staff-dashboard');
      body.innerHTML=heading(s)+'<div class="sp-totals">'+[['মাসিক প্রদেয় বেতন',s.salary,'salary'],['নির্ধারিত বেতন',data.summary.charged,'charged'],['মোট প্রদান',data.summary.paid,'paid'],['বকেয়া বেতন',data.summary.due,'due']].map(([label,value,key])=>'<div class="sp-total '+key+'"><span>'+t(label)+'</span><strong data-sp-total="'+key+'">'+r().money(value)+'</strong></div>').join('')+'</div><div class="r-tabs sp-tabs" role="tablist">'+[['bio','পরিচয়'],['attendance','হাজিরা'],['payroll','বেতন ও বকেয়া'],['documents','যোগ্যতা ও কাগজপত্র'],['history','ইতিহাস']].map(([key,label])=>'<button type="button" role="tab" data-sp-tab="'+key+'" aria-selected="'+String(tab===key)+'" class="'+(tab===key?'active':'')+'">'+t(label)+'</button>').join('')+'</div><div data-sp-content></div>';
      bindHeading();
      body.querySelectorAll('[data-sp-tab]').forEach(button=>button.onclick=()=>{if(tab===button.dataset.spTab)return;tab=button.dataset.spTab;showTab();});
      showTab();
    }
    function showTab(){
      const s=data.staff,p=s.profile;payrollUpdate=null;++viewSequence;
      body.querySelectorAll('[data-sp-tab]').forEach(button=>{const active=button.dataset.spTab===tab;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));});
      const content=body.querySelector('[data-sp-content]');
      if(tab==='attendance')attendance(content,s);
      else if(tab==='payroll')payroll(content,s);
      else if(tab==='documents')documents(content,p);
      else if(tab==='history')history(content,s);
      else bio(content,s,p);
    }
    function bio(content,s,p){
      content.innerHTML=section('ব্যক্তিগত তথ্য',detail([['নাম (বাংলা)',s.name],['নাম (ইংরেজি)',p.name_en],['পিতার নাম',p.father],['মাতার নাম',p.mother],['জন্ম তারিখ',date(p.dob)],['লিঙ্গ',p.gender],['জাতীয় পরিচয়পত্র',p.nid],['জন্ম নিবন্ধন',p.birth_reg],['রক্তের গ্রুপ',p.blood],['বৈবাহিক অবস্থা',p.marital],['ধর্ম',p.religion],['জাতীয়তা',p.nationality]]))+section('ঠিকানা ও যোগাযোগ',detail([['মোবাইল',s.phone],['হোয়াটসঅ্যাপ',p.whatsapp],['বিকল্প মোবাইল',p.phone2],['ইমেইল',p.email],['বর্তমান ঠিকানা',address(p.present)],['স্থায়ী ঠিকানা',address(p.permanent)],['জরুরি যোগাযোগ',[p.emergency?.name,p.emergency?.relation,p.emergency?.phone].filter(Boolean).join(' · ')]]))+section('চাকরি ও বেতন',detail([['স্টাফ আইডি',p.employee_code||'ST-'+s.id],['স্টাফের ধরন',s.role],['পদবি',p.designation],['বিভাগ',p.department],['যোগদান',date(s.join_date)],['চাকরির ধরন',p.employment_type],['মূল বেতন',r().money(p.base_salary??s.salary)],['ভাতা',r().money(p.allowance)],['কর্তন',r().money(p.deduction)],['মাসিক প্রদেয় বেতন',r().money(s.salary)],['মাধ্যম',p.pay_method],['হিসাব / মোবাইল নম্বর',p.account],['ব্যাংক / শাখা',p.bank]]))+section('মন্তব্য','<p class="sp-remarks" translate="no">'+e(p.remarks||'-')+'</p>')+'<div class="sp-bottom-actions">'+r().button('spPrintProfile',t('প্রোফাইল প্রিন্ট'),'print')+'</div>';
      content.querySelector('#spPrintProfile').onclick=()=>{const heading=body.querySelector('.sp-heading').cloneNode(true);heading.querySelector('.sp-heading-actions').remove();r().print(t('স্টাফ প্রোফাইল')+' · '+s.name,heading.outerHTML+[...content.querySelectorAll('.sp-section')].map(el=>el.outerHTML).join(''));};
    }
    async function attendance(content,s){
      const n=++viewSequence;
      const years=[...new Set([month.slice(0,4),MM.util.today().slice(0,4),...data.months.map(row=>row.month.slice(0,4))])].sort().reverse();
      const names=['জানুয়ারী','ফেব্রুয়ারী','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
      content.innerHTML='<div class="r-toolbar">'+r().select('spYear',t('বছর'),years.map(y=>'<option '+(y===month.slice(0,4)?'selected ':'')+'value="'+y+'">'+num(y)+'</option>').join(''))+r().button('spEnterAttendance',t('হাজিরা দিন'),'calendar')+'</div><div class="sp-months">'+names.map((name,i)=>{const m=month.slice(0,4)+'-'+String(i+1).padStart(2,'0');return '<button type="button" data-sp-month="'+m+'" aria-pressed="'+String(month===m)+'" class="'+(data.months.some(row=>row.month===m)?'recorded':'')+'">'+t(name)+'</button>';}).join('')+'</div><div class="r-status" data-sp-att-status role="status"></div><div data-sp-attendance></div><div class="sp-bottom-actions">'+r().button('spPrintAttendance',t('এই মাসের হাজিরা তথ্য প্রিন্ট করুন'),'print')+'</div>';
      content.querySelector('#spYear').onchange=ev=>{month=ev.target.value+'-'+month.slice(5);attendance(content,data.staff);};
      content.querySelectorAll('[data-sp-month]').forEach(button=>button.onclick=()=>{month=button.dataset.spMonth;attendance(content,data.staff);});
      content.querySelector('#spEnterAttendance').onclick=()=>MM.router.go('staff-attendance',{staffId:id});
      const status=content.querySelector('[data-sp-att-status]'),print=content.querySelector('#spPrintAttendance');print.disabled=true;
      try{const register=await r().invoke('staff_attendance_register',{id,month});if(!valid()||!content.isConnected||n!==viewSequence)return;
        const html=monthly(s,register);content.querySelector('[data-sp-attendance]').innerHTML=html;print.disabled=false;print.onclick=()=>MM.printing.open(t('শিক্ষকদের হাজিরা')+' · '+s.name,html,{landscape:true});
      }catch(error){if(valid()&&content.isConnected&&n===viewSequence){status.textContent=String(error);status.classList.add('bad');}}
    }
    function payroll(content){
      const cycle=row=>row.cycle_start&&row.cycle_end?date(row.cycle_start)+' – '+date(row.cycle_end):date(row.month);
      const monthOf=value=>String(value||'').slice(0,7);
      const cycleDates=value=>{const [year,mo]=value.split('-').map(Number),end=new Date(year,mo,5);return {start:value+'-06',end:end.getFullYear()+'-'+String(end.getMonth()+1).padStart(2,'0')+'-05'};};
      const current=()=>{const today=MM.util.today();if(Number(today.slice(8))>=6)return today.slice(0,7);const before=new Date(Number(today.slice(0,4)),Number(today.slice(5,7))-2,1);return before.getFullYear()+'-'+String(before.getMonth()+1).padStart(2,'0');};
      if(!salaryMonth)salaryMonth=data.current_cycle_month||data.cycle_month||current();
      content.innerHTML='<section class="sp-section sp-pay-panel"><h3>'+t('বেতন প্রদান')+'</h3><p>'+t('মাস নির্বাচন করে এই শিক্ষক বা কর্মচারীর বেতন প্রদান করুন। আংশিক বা সম্পূর্ণ বেতন দেওয়া যাবে।')+'</p><div class="r-toolbar">'+r().field('spSalaryMonth',t('বেতন-চক্রের মাস'),'month',salaryMonth,'required')+r().button('spTerms',t('বেতনের ইতিহাস'),'calendar')+'</div><div class="sp-pay-preview" data-sp-pay-preview></div><div class="r-status" id="spPayStatus" role="status" aria-live="polite"></div></section><div class="r-toolbar">'+r().select('spPayMonth',t('মাস'),'<option value="">'+t('সকল মাস')+'</option>')+r().button('spSalaryPage',t('বেতন ব্যবস্থাপনা'),'money')+'</div><h3>'+t('মাসভিত্তিক বেতন')+'</h3><div id="spBills"></div><h3 class="r-history">'+t('প্রদান ইতিহাস')+'</h3><div id="spPayments"></div><div class="sp-bottom-actions">'+r().button('spPrintSalary',t('বেতন রিপোর্ট প্রিন্ট'),'print')+'</div>';
      const monthInput=content.querySelector('#spSalaryMonth'),status=content.querySelector('#spPayStatus');let preparing=false,paymentOpening=false;
      function message(value,bad=false){if(!status.isConnected)return;status.className='r-status'+(bad?' bad':'');status.textContent=t(value);}
      function openPayment(row){
        if(paymentOpening||!valid()||tab!=='payroll'||!content.isConnected||document.querySelector('.r-modal:not(.r-closing)'))return;
        const latest=data.bills.find(bill=>bill.id===row?.id);
        if(!latest||latest.due<=0){message('এই মাসের বেতন পরিশোধিত');return;}
        paymentOpening=true;
        try{r().pay({...latest,name:data.staff.name},true,load);}finally{window.setTimeout(()=>{paymentOpening=false;},250);}
      }
      function preview(){
        const panel=content.querySelector('[data-sp-pay-preview]');if(!panel)return;
        if(!/^\d{4}-\d{2}$/.test(salaryMonth)){panel.innerHTML='<p class="sp-empty">'+t('বেতন-চক্রের মাস নির্বাচন করুন')+'</p>';return;}
        const selected=data.bills.filter(row=>monthOf(row.month)===salaryMonth),period=cycleDates(salaryMonth),primary=selected.find(row=>row.due>0)?.id;
        if(selected.length){panel.innerHTML=selected.map(row=>'<div class="r-banner"><strong>'+t('বেতন-চক্র')+': '+cycle(row)+'</strong><span>'+t('নির্ধারিত')+' '+r().money(row.amount)+' · '+t('প্রদান')+' '+r().money(row.paid)+' · '+t('বকেয়া')+' '+r().money(row.due)+'</span>'+(row.due>0?'<button type="button"'+(row.id===primary?' id="spPaySelected"':'')+' class="btn btn-primary" data-sp-selected="'+row.id+'">'+r().icon('money')+t('বেতন প্রদান')+'</button>':'<span class="sp-badge active">'+t('পরিশোধিত')+'</span>')+'</div>').join('');panel.querySelectorAll('[data-sp-selected]').forEach(button=>button.onclick=()=>openPayment(data.bills.find(row=>row.id===Number(button.dataset.spSelected))));}
        else{panel.innerHTML='<div class="r-banner"><strong>'+t('বেতন-চক্র')+': '+date(period.start)+' – '+date(period.end)+'</strong><span>'+t('এই মাসের বেতন এখনও প্রস্তুত করা হয়নি')+'</span>'+r().button('spPrepareSalary',t('এই মাসের বেতন প্রস্তুত করুন'),'money',true)+'</div>';panel.querySelector('#spPrepareSalary').onclick=prepare;}
      }
      function prepare(){
        if(preparing||!valid()||tab!=='payroll'||document.querySelector('.r-modal:not(.r-closing)')||!monthInput.reportValidity())return;
        const selectedMonth=monthInput.value;if(!/^\d{4}-\d{2}$/.test(selectedMonth))return;
        const period=cycleDates(selectedMonth),staffName=data.staff.name;
        preparing=true;
        const form=r().modal(t('বেতন প্রস্তুত করুন'),'<div class="r-banner"><strong translate="no">'+e(staffName)+'</strong><span>'+t('বেতন-চক্র')+': '+date(period.start)+' – '+date(period.end)+'</span></div><p>'+t('শুধু এই শিক্ষক বা কর্মচারীর নির্বাচিত মাসের বেতন প্রস্তুত হবে। আগে তৈরি বেতন বা প্রদানের হিসাব পরিবর্তন হবে না।')+'</p><p>'+t('যোগদানের তারিখ ও সংরক্ষিত বেতনের হার অনুযায়ী হিসাব হবে। প্রস্তুত হওয়ার পরে টাকা ও তারিখ দিয়ে বেতন প্রদান করুন।')+'</p>',async()=>{
          await r().invoke('salary_generate',{month:selectedMonth,staff_id:id});
          const refreshed=await load();
          if(!valid())return;
          if(!refreshed){message('বেতন প্রস্তুত হয়েছে; হালনাগাদ করে দেখুন',true);return;}
          if(!data.bills.some(row=>monthOf(row.month)===selectedMonth))throw Error(t('এই মাসে প্রদেয় বেতন নেই। যোগদানের তারিখ, চাকরির অবস্থা ও বেতনের ইতিহাস যাচাই করুন।'));
          message('বেতন প্রস্তুত হয়েছে। বেতন প্রদান বাটনে ক্লিক করুন।');
        },t('বেতন প্রস্তুত করুন'));
        const observer=new MutationObserver(()=>{if(!form.isConnected){preparing=false;observer.disconnect();}});observer.observe(document.body,{childList:true});
      }
      function update(){
        if(!valid()||tab!=='payroll'||!content.isConnected)return;
        const months=[...new Set(data.bills.map(row=>monthOf(row.month)))].sort().reverse(),filter=content.querySelector('#spPayMonth');
        if(payMonth&&!months.includes(payMonth))payMonth='';
        const options='<option value="">'+t('সকল মাস')+'</option>'+months.map(m=>'<option value="'+e(m)+'"'+(payMonth===m?' selected':'')+'>'+date(m)+'</option>').join('');if(filter.innerHTML!==options)filter.innerHTML=options;
        const bills=data.bills.filter(row=>!payMonth||monthOf(row.month)===payMonth),receipts=data.receipts.filter(row=>!payMonth||monthOf(row.month)===payMonth);
        r().paged(content.querySelector('#spBills'),['মাস','নির্ধারিত','প্রদান','বকেয়া','কাজ'].map(t),bills.map(row=>r().cells([cycle(row),r().money(row.amount),r().money(row.paid),r().money(row.due),row.due>0?'<button type="button" class="btn btn-primary" data-sp-pay="'+row.id+'">'+r().icon('money')+t('বেতন প্রদান')+'</button>':t('পরিশোধিত')])),box=>box.querySelectorAll('[data-sp-pay]').forEach(button=>button.onclick=()=>openPayment(data.bills.find(row=>row.id===Number(button.dataset.spPay)))),()=>{},'spB');
        r().paged(content.querySelector('#spPayments'),['ভাউচার','মাস','টাকা','তারিখ','মাধ্যম','মন্তব্য','অবস্থা','কাজ'].map(t),receipts.map(row=>r().cells(['SP-'+row.id,cycle(row),r().money(row.amount),date(row.pay_date),e(row.method),e(row.note||'-'),row.void_reason?t('বাতিল')+': '+e(row.void_reason):t('প্রদান'),'<button type="button" class="btn btn-ghost" title="'+t('ভাউচার প্রিন্ট')+'" data-sp-receipt="'+row.id+'">'+r().icon('print')+'</button>'])),box=>box.querySelectorAll('[data-sp-receipt]').forEach(button=>button.onclick=()=>r().receipt(data.receipts.find(row=>row.id===Number(button.dataset.spReceipt)),true)),()=>{},'spR');
        preview();
      }
      payrollUpdate=update;monthInput.onchange=()=>{salaryMonth=monthInput.value;message('');preview();};
      content.querySelector('#spPayMonth').onchange=ev=>{payMonth=ev.target.value;update();};
      content.querySelector('#spTerms').onclick=()=>MM.staffDetails.terms(id,load);
      content.querySelector('#spSalaryPage').onclick=()=>MM.router.go('salary');
      content.querySelector('#spPrintSalary').onclick=()=>r().print(t('বেতন রিপোর্ট')+' · '+data.staff.name,r().table(['মাস','নির্ধারিত','প্রদান','বকেয়া'].map(t),data.bills.filter(row=>!payMonth||monthOf(row.month)===payMonth).map(row=>r().cells([cycle(row),r().money(row.amount),r().money(row.paid),r().money(row.due)]))));
      update();
    }
    function documents(content,p){
      content.innerHTML=section('শিক্ষাগত যোগ্যতা',r().table(['ডিগ্রি','প্রতিষ্ঠান','সাল','ফলাফল'].map(t),(p.qualifications||[]).map(row=>r().cells([e(row.degree),e(row.institute),e(row.year),e(row.result)]))))+section('অভিজ্ঞতা',detail([['অভিজ্ঞতা',p.experience],['পাঠদানের বিষয়',p.subjects],['পূর্ববর্তী প্রতিষ্ঠান',p.previous_work]]))+section('কাগজপত্র',(p.documents||[]).length?p.documents.map((doc,i)=>'<div class="staff-doc"><span translate="no">'+e(doc.name)+'</span><button type="button" class="btn btn-ghost" data-sp-doc="'+i+'" title="'+t('কাগজপত্র ডাউনলোড')+'">'+r().icon('file')+'</button></div>').join(''):'<p class="sp-empty">'+t('কোনো তথ্য নেই')+'</p>')+section('স্বাক্ষর',p.signature?'<img class="staff-sign" src="'+e(p.signature)+'" alt="'+t('স্বাক্ষর')+'">':'<p class="sp-empty">'+t('কোনো তথ্য নেই')+'</p>');
      content.querySelectorAll('[data-sp-doc]').forEach(button=>button.onclick=()=>MM.staffDetails.download(p.documents[Number(button.dataset.spDoc)]));
    }
    async function history(content,s){
      const n=++viewSequence;
      const rows=[{day:s.join_date,type:'যোগদান',text:ptext(s.profile.designation||s.role)}];
      for(const row of data.receipts)rows.push({day:row.pay_date,type:row.void_reason?'বাতিল ভাউচার':'বেতন প্রদান',text:['SP-'+row.id,r().money(row.amount),row.month,row.method,row.note,row.void_reason].filter(Boolean).join(' · ')});
      content.innerHTML='<div class="r-status" role="status"></div><div data-sp-history></div>';
      try{
        for(const m of data.months){const register=await r().invoke('staff_attendance_register',{id,month:m.month});if(!valid()||!content.isConnected||n!==viewSequence)return;for(const row of register.entries)rows.push({day:row.day,type:statuses.find(([key])=>key===row.status)[1],text:row.note||'-'});}
        rows.sort((a,b)=>b.day.localeCompare(a.day));
        r().paged(content.querySelector('[data-sp-history]'),['তারিখ','কার্যক্রম','বিবরণ'].map(t),rows.map(row=>r().cells([date(row.day),t(row.type),'<span translate="no">'+e(row.text)+'</span>'])),()=>{},()=>{},'spH');
      }catch(error){if(valid()&&content.isConnected&&n===viewSequence)content.querySelector('.r-status').textContent=String(error);}
    }
    const ptext=value=>value||'-';
    let ready=load();
    while(ready){await ready;if(!valid()||ready===latestLoad)break;ready=latestLoad;}
  }
  async function daily(ctx){
    const {body,params}=ctx;let data,key='',sequence=0;
    body.innerHTML='<div class="r-toolbar">'+r().field('sdDay',t('তারিখ'),'date',MM.util.today(),'required')+r().button('sdLoad',t('হাজিরা'),'calendar')+r().button('sdPresent',t('সব উপস্থিত'),'users')+r().button('sdAbsent',t('সব অনুপস্থিত'),'users')+r().button('sdSave',t('সংরক্ষণ'),'file',true)+'</div><div class="r-status" id="sdStatus" role="status"></div><div id="sdRows"></div>';
    const $=id=>body.querySelector('#'+id),status=$('sdStatus');
    function capture(){if(!data)return;body.querySelectorAll('[data-sd-row]').forEach(tr=>{const row=data.rows.find(row=>row.id===Number(tr.dataset.sdRow));if(row.status==='leave')row.note=tr.querySelector('input').value;});}
    function update(tr,row){tr.querySelectorAll('[data-sd-status]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.sdStatus===row.status)));const input=tr.querySelector('input');input.disabled=row.status!=='leave';input.value=row.note;}
    async function load(){
      const n=++sequence,day=$('sdDay').value;key='';$('sdSave').disabled=true;
      try{const next=await r().invoke('staff_attendance_get',{day,staff_id:Number(params.staffId||0)});if(!ctx.alive()||n!==sequence)return;data=next;key=day;data.rows.forEach(row=>row.savedNote=row.note);status.textContent='';
        r().paged($('sdRows'),['আইডি','নাম','পদ','হাজিরা','মন্তব্য'].map(t),()=>data.rows.map(row=>r().cells([e(row.employee_code||'ST-'+row.id),'<span translate="no">'+e(row.name)+'</span>',e(row.designation||row.role),'<div class="a-status-buttons">'+statuses.map(([key,label])=>'<button type="button" data-sd-status="'+key+'" aria-pressed="'+String(row.status===key)+'">'+t(label)+'</button>').join('')+'</div>','<input aria-label="'+e(row.name)+' '+t('ছুটির কারণ')+'" maxlength="1000" value="'+e(row.note)+'"'+(row.status==='leave'?'':' disabled')+'>'],'data-sd-row="'+row.id+'"')),box=>box.querySelectorAll('[data-sd-row]').forEach(tr=>{const row=data.rows.find(row=>row.id===Number(tr.dataset.sdRow));tr.querySelector('input').oninput=capture;tr.querySelectorAll('[data-sd-status]').forEach(button=>button.onclick=()=>{capture();row.status=button.dataset.sdStatus;if(row.status!=='leave')row.note=row.savedNote;update(tr,row);});}),capture,'sd');$('sdSave').disabled=!data.rows.length;
      }catch(error){if(ctx.alive()){status.textContent=String(error);status.classList.add('bad');}}
    }
    async function save(){if($('sdSave').disabled)return;$('sdSave').disabled=true;try{if(key!==$('sdDay').value)throw Error(t('আবার হাজিরা খুলুন'));capture();if(data.rows.some(row=>!row.status))throw Error(t('সব স্টাফের হাজিরা নির্বাচন করুন'));await r().invoke('staff_attendance_save',{day:key,revision:data.revision,rows:data.rows.map(({id,status,note})=>({id,status,note}))});await load();if(ctx.alive())status.textContent=t('সংরক্ষিত হয়েছে');}catch(error){if(ctx.alive()){status.textContent=String(error);status.classList.add('bad');}}finally{if(ctx.alive())$('sdSave').disabled=!key||!data?.rows.length;}}
    $('sdSave').onclick=save;$('sdLoad').onclick=load;
    $('sdDay').onchange=()=>{++sequence;key='';$('sdSave').disabled=true;$('sdRows').innerHTML='<div class="r-empty">'+t('হাজিরা খুলুন')+'</div>';};
    for(const [button,value] of [['sdPresent','present'],['sdAbsent','absent']])$(button).onclick=()=>{if(!key)return;capture();data.rows.forEach(row=>{row.status=value;row.note=row.savedNote;});body.querySelectorAll('[data-sd-row]').forEach(tr=>update(tr,data.rows.find(row=>row.id===Number(tr.dataset.sdRow))));};
    await load();
  }
  function refresh(){for(const state of mounts){if(!state.root.isConnected)mounts.delete(state);else state.refresh();}}
  document.addEventListener('mm-staff-change',refresh);window.addEventListener('focus',refresh);
  return {render,daily};
})();
