/* Offline licence UI. All permission checks are enforced by the Rust backend. */
window.MM=window.MM||{};
MM.license=(()=>{
 let layer,current,busy=false,polling=false,manage=false,wasAllowed=false;
 const titles={activation_required:'আপনার সফটওয়্যার সক্রিয় করুন',unconfigured:'লাইসেন্স প্রস্তুত নেই',invalid:'লাইসেন্স আবার দিন',expired:'লাইসেন্সের মেয়াদ শেষ',revoked:'লাইসেন্স বাতিল করা হয়েছে',clock_error:'কম্পিউটারের সময় ঠিক করুন',active:'অফলাইন লাইসেন্স সক্রিয়'};
 const expiry=seconds=>seconds?new Date(seconds*1000).toLocaleString('bn-BD'):'আজীবন';
 function draw(next){
  current=next;const allowed=next.allowed===true,show=!allowed||manage;layer.hidden=!show;
  document.querySelector('.app').inert=show;document.documentElement.classList.toggle('mm-license-locked',show);
  layer.querySelector('[data-license-title]').textContent=titles[next.state]||'লাইসেন্স যাচাই';layer.querySelector('[data-license-message]').textContent=next.message||'';
  layer.querySelector('#mmComputerCode').value=next.device_id||'';layer.querySelector('[data-license-customer]').textContent=next.customer_name||'মাদরাসা ম্যানেজার';
  layer.querySelector('[data-license-until]').textContent=next.customer_name?expiry(next.expires_at):'সক্রিয় করা হয়নি';layer.querySelector('[data-license-return]').hidden=!allowed;
  layer.querySelector('[data-license-activate]').disabled=busy||next.state==='unconfigured';
  if(allowed&&!wasAllowed)MM.refreshDashboard?.();wasAllowed=allowed;
 }
 function feedback(value){layer.querySelector('[data-license-feedback]').textContent=value}
 async function status(){if(polling||!layer)return;polling=true;try{draw(await MM.tauri.invoke('license_status'))}catch{layer.hidden=false;document.querySelector('.app').inert=true;layer.querySelector('[data-license-message]').textContent='লাইসেন্সের তথ্য পাওয়া যায়নি। অ্যাপ আবার খুলুন।'}finally{polling=false}}
 async function copyCode(){const field=layer.querySelector('#mmComputerCode');try{await navigator.clipboard.writeText(field.value)}catch{field.focus();field.select();if(!document.execCommand('copy')){feedback('কোডটি নির্বাচন করে Ctrl+C চাপুন।');return}}feedback('কম্পিউটারের কোড কপি হয়েছে। সরবরাহকারীকে পাঠিয়ে লাইসেন্স কী নিন।')}
 function init(){
  if(layer||!MM.tauri?.ready())return;
  layer=document.createElement('section');layer.className='mm-license-screen';layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-labelledby','mmLicenseTitle');
  layer.innerHTML='<div class="mm-license-window"><button type="button" class="mm-license-close" aria-label="সফটওয়্যার বন্ধ করুন" data-license-close>×</button></div><div class="mm-license-card">'+
   '<div class="mm-license-brand"><img src="assets/support-logo.png" alt="" width="64" height="64"><div><p>মাদরাসা ম্যানেজার</p><span>সম্পূর্ণ অফলাইন · আপনার তথ্য আপনার কম্পিউটারে</span></div></div><span class="mm-license-tag">কম্পিউটারভিত্তিক অফলাইন লাইসেন্স</span><h1 id="mmLicenseTitle" data-license-title>লাইসেন্স যাচাই হচ্ছে</h1><p class="mm-license-message" data-license-message></p>'+
   '<label for="mmComputerCode">১. এই কম্পিউটারের কোড সরবরাহকারীকে দিন</label><textarea id="mmComputerCode" rows="2" readonly spellcheck="false"></textarea><div class="mm-license-actions"><button type="button" data-license-copy>কম্পিউটার কোড কপি করুন</button></div>'+
   '<form id="mmLicenseForm"><label for="mmLicenseKey">২. সরবরাহকারীর দেওয়া লাইসেন্স কী বসান</label><textarea id="mmLicenseKey" rows="4" maxlength="4096" autocomplete="off" spellcheck="false" placeholder="MM1. দিয়ে শুরু হওয়া সম্পূর্ণ লাইসেন্স কী পেস্ট করুন" required></textarea><button type="submit" data-license-activate>অ্যাক্টিভ করুন</button></form>'+
   '<p class="mm-license-feedback" role="status" aria-live="polite" data-license-feedback></p><dl class="mm-license-details"><div><dt>প্রতিষ্ঠান</dt><dd data-license-customer>—</dd></div><div><dt>লাইসেন্সের মেয়াদ</dt><dd data-license-until>—</dd></div></dl>'+
   '<div class="mm-license-actions"><button type="button" data-license-backup>তথ্যের ব্যাকআপ নিন</button><button type="button" data-license-return hidden>কাজে ফিরে যান</button></div><p class="mm-license-help">সহযোগিতা: <b dir="ltr">01733445568</b></p><p class="mm-license-note">ইন্টারনেট লাগবে না। এক কম্পিউটারের লাইসেন্স কী অন্য কম্পিউটারে চলবে না। Windows নতুন করে ইনস্টল করে কোড পরিবর্তিত হলে সরবরাহকারীর সঙ্গে যোগাযোগ করুন।</p></div>';
  document.body.append(layer);layer.querySelector('[data-license-copy]').onclick=copyCode;layer.querySelector('[data-license-return]').onclick=()=>{manage=false;if(current)draw(current)};
  layer.querySelector('form').onsubmit=async event=>{
   event.preventDefault();if(busy)return;const key=layer.querySelector('#mmLicenseKey').value.trim();if(!key)return;
   busy=true;layer.querySelector('[data-license-activate]').disabled=true;feedback('লাইসেন্স যাচাই হচ্ছে…');
   try{const next=await MM.tauri.invoke('license_activate',{key});if(next.allowed){manage=false;layer.querySelector('#mmLicenseKey').value=''}draw(next);feedback(next.allowed?'লাইসেন্স সক্রিয় হয়েছে।':next.message)}catch(error){feedback(String(error))}finally{busy=false;if(current)draw(current)}
  };
  layer.querySelector('[data-license-backup]').onclick=async event=>{event.target.disabled=true;try{await MM.tauri.invoke('backup_create');feedback('ব্যাকআপ সংরক্ষণ হয়েছে।')}catch{feedback('ব্যাকআপ তৈরি হয়নি। আবার চেষ্টা করুন।')}finally{event.target.disabled=false}};
  layer.querySelector('[data-license-close]').onclick=()=>window.__TAURI__.window.getCurrentWindow().close();
  document.addEventListener('keydown',event=>{if(layer.hidden||event.key!=='Tab')return;const elements=[...layer.querySelectorAll('button:not(:disabled),textarea')].filter(el=>el.offsetParent!==null),first=elements[0],last=elements.at(-1);if(event.shiftKey&&(document.activeElement===first||!layer.contains(document.activeElement))){event.preventDefault();last?.focus()}else if(!event.shiftKey&&(document.activeElement===last||!layer.contains(document.activeElement))){event.preventDefault();first?.focus()}});
  document.querySelector('.app').inert=true;status();setInterval(status,3000);
 }
 function open(){init();if(!layer)return;manage=true;if(current)draw(current);status();layer.querySelector('#mmLicenseKey').focus()}
 document.addEventListener('DOMContentLoaded',init);if(document.readyState!=='loading')init();return{open,status,get current(){return current}};
})();
