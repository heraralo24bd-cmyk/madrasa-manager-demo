window.MM = window.MM || {};
MM.discounts = (() => {
  const R=()=>MM.records, e=MM.util.esc;
  const kinds=[{id:'none',name:'ছাড় নেই'},{id:'percentage',name:'শতাংশ'},{id:'free',name:'সম্পূর্ণ ফ্রি'},{id:'fixed',name:'নির্দিষ্ট টাকা'}];
  const categories=[{id:'none',name:'নেই'},{id:'poor',name:'গরিব'},{id:'orphan',name:'এতিম'},{id:'scholarship',name:'মেধাবী'},{id:'special',name:'বিশেষ'},{id:'legacy-waiver',name:'পুরোনো ছাড়'}];
  function label(r){const kind=r.discount_type||r.kind, value=r.discount_value??r.value;return kind==='percentage'?MM.util.bnNum(value/100)+'%':kind==='free'?'সম্পূর্ণ ফ্রি':kind==='fixed'?R().money(value):'ছাড় নেই';}
  function controls(data,prefix,initial={}){
    const r=R(), f=(k,l,t,v,a='')=>r.field(prefix+k,l,t,v,a), s=(k,l,rows,v)=>r.select(prefix+k,l,r.options(rows,'id','name',v));
    return '<div class="r-form-grid">'+s('Fee','প্রযোজ্য ফি',data.types,initial.type_id||1)+s('Kind','ছাড়ের ধরন',kinds,initial.kind||'none')+f('Value','পরিমাণ / শতাংশ','number',initial.kind==='percentage'?initial.value/100:initial.value||0,'min="0" max="100000000" step="0.01" required')+s('Category','কারণ',categories,initial.category||'special')+f('Month','কার্যকর মাস','month',MM.util.today().slice(0,7),'required')+s('Active','অবস্থা',[{id:1,name:'সক্রিয়'},{id:0,name:'বন্ধ'}],initial.active??1)+'</div>';
  }
  function bindKind(form,prefix){const k=form.querySelector('#'+prefix+'Kind'),v=form.querySelector('#'+prefix+'Value');const change=()=>{v.disabled=k.value==='free'||k.value==='none';if(k.value==='free')v.value=100;if(k.value==='none')v.value=0;v.max=k.value==='percentage'?100:100000000;v.step=k.value==='percentage'?'0.01':'1';};k.addEventListener('change',change);change();}
  function read(form,prefix,data){const get=k=>form.querySelector('#'+prefix+k).value;const type=Number(get('Fee'));return {type_id:type,kind:get('Kind'),value:Number(get('Value')),category:get('Category'),effective_month:get('Month'),active:Number(get('Active')),revision:Math.max(0,...data.history.filter(r=>r.type_id===type).map(r=>r.id))};}
  function historyHTML(data){const r=R();return (data.review.length?'<div class="discount-review">যাচাই প্রয়োজন: '+data.review.map(x=>e(x.legacy_value)+' · '+e(x.reason)).join('<br>')+'</div>':'')+r.table(['ফি','ছাড়','কারণ','কার্যকর মাস','অবস্থা','পরিবর্তনের সময়'],data.history.map(x=>r.cells([e(x.fee_name),e(label(x)),e(categories.find(c=>c.id===x.category)?.name||x.category),e(x.effective_month),x.active?'সক্রিয়':'বন্ধ',e(x.created_at)])));}
  async function manage(sid,reload=()=>{}){
    try{const data=await R().invoke('discount_get',{student_id:sid});const f=R().modal('শিক্ষার্থীর ছাড়',controls(data,'d')+'<div class="discount-policy">শুধু নতুন বিল। আগে তৈরি পরিশোধিত ও বকেয়া বিল অপরিবর্তিত থাকবে।</div><h4>ছাড়ের ইতিহাস</h4>'+historyHTML(data),async form=>{await R().invoke('discount_save',{student_id:sid,...read(form,'d',data)});await reload();});bindKind(f,'d');}
    catch(err){MM.util.toast(String(err),'err');}
  }
  async function mountAdmission(form,current){
    const source=form.querySelector('[name=discount]');if(!source)return;
    if(current?.discount&&!Array.from(source.options).some(o=>o.value===current.discount)){
      source.append(new Option(current.discount,current.discount,true,true));
    }
    const data=current?await R().invoke('discount_get',{student_id:current.id}):{history:[],review:[],types:(await R().invoke('catalog')).types};
    if(!form.isConnected)return;
    const monthly=data.history.filter(r=>r.type_id===1).sort((a,b)=>b.effective_month.localeCompare(a.effective_month)||b.id-a.id)[0];
    const wrap=document.createElement('section');wrap.className='discount-admission';wrap.innerHTML='<h4>বিলের ছাড়</h4>'+controls(data,'ad',monthly||{});source.closest('.field').parentElement.append(wrap);
    bindKind(form,'ad');let dirty=false;wrap.addEventListener('input',()=>dirty=true);wrap.addEventListener('change',()=>dirty=true);
    const preset=()=>{const value=source.value;const kind=value.includes('এতিম')?'free':value.includes('গরিব')||value.includes('মেধাবী')?'percentage':'none';form.querySelector('#adKind').value=kind;form.querySelector('#adValue').value=value.includes('গরিব')?50:value.includes('মেধাবী')?25:kind==='free'?100:0;form.querySelector('#adCategory').value=value.includes('এতিম')?'orphan':value.includes('গরিব')?'poor':value.includes('মেধাবী')?'scholarship':value==='অন্যান্য'?'special':'none';form.querySelector('#adKind').dispatchEvent(new Event('change'));};
    if(!monthly){preset();dirty=false;}
    source.addEventListener('change',()=>{preset();dirty=true;});
    form._discountRead=()=>{if(!dirty&&current)return null;for(const el of wrap.querySelectorAll('input,select')){if(!el.reportValidity())throw Error('ছাড়ের ঘরগুলো সঠিকভাবে পূরণ করুন');}return read(form,'ad',data);};
  }
  function summaryHTML(data){const m=MM.util.today().slice(0,7),latest=new Map();data.history.filter(x=>x.effective_month<=m).forEach(x=>{if(!latest.has(x.type_id))latest.set(x.type_id,x);});return [...latest.values()].map(x=>'<div class="discount-summary"><strong>'+e(x.fee_name)+' · '+e(x.active?label(x):'বন্ধ')+'</strong><small>'+e(categories.find(c=>c.id===x.category)?.name||x.category)+' · '+e(x.effective_month)+'</small></div>').join('')||'<div class="discount-summary">কোনো কার্যকর ছাড় নেই</div>';}
  async function renderList(root,catalog){
    const r=R();root.innerHTML='<div class="r-toolbar">'+r.select('dlFee','ফি',r.options(catalog.types,'id','name',1))+r.select('dlKind','ছাড়','<option value="">সকল</option><option value="free">সম্পূর্ণ ফ্রি</option><option value="percentage">শতাংশ</option><option value="fixed">নির্দিষ্ট টাকা</option><option value="none">ছাড় নেই</option><option value="inactive">বন্ধ</option><option value="review">যাচাই প্রয়োজন</option>')+r.select('dlCategory','কারণ','<option value="">সকল</option>'+r.options(categories,'id','name',''))+'</div><div id="dlRows"></div>';let rows=[],ticket=0;
    const paint=()=>{if(!root.isConnected)return;const kind=root.querySelector('#dlKind').value,category=root.querySelector('#dlCategory').value;const list=rows.filter(s=>(!category||s.category===category)&&(!kind||kind==='review'&&s.needs_review||kind==='inactive'&&s.active===0||kind==='none'&&(!s.kind||s.kind==='none'||!s.active)||s.active===1&&s.kind===kind));r.paged(root.querySelector('#dlRows'),['শিক্ষার্থী','শ্রেণি','ছাড়','কারণ','কার্যকর মাস','কাজ'],list.map(s=>r.cells([e(s.name_bn)+'<small>'+e(s.sid)+'</small>',e(s.class),s.needs_review?'যাচাই প্রয়োজন':e(s.active?label(s):'ছাড় নেই'),e(categories.find(c=>c.id===s.category)?.name||s.category||'-'),e(s.effective_month||'-'),'<button class="btn btn-ghost" data-dl="'+s.student_id+'">'+r.icon('file')+'পরিবর্তন</button>'])),box=>box.querySelectorAll('[data-dl]').forEach(b=>b.onclick=()=>manage(Number(b.dataset.dl),load)));};
    const load=async()=>{const n=++ticket;try{const result=await r.invoke('discount_students',{type_id:Number(root.querySelector('#dlFee').value),month:MM.util.today().slice(0,7)});if(n!==ticket||!root.querySelector('#dlRows'))return;rows=result;paint();}catch(err){if(root.isConnected)root.querySelector('#dlRows').textContent=String(err);}};
    root.querySelector('#dlFee').onchange=load;root.querySelector('#dlKind').onchange=paint;root.querySelector('#dlCategory').onchange=paint;await load();
  }
  return {label,manage,mountAdmission,historyHTML,summaryHTML,renderList};
})();
