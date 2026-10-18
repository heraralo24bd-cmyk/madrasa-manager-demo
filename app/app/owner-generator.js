(() => {
 const $=id=>document.getElementById(id);let busy=false,ready=false;
 const invoke=(command,args={})=>window.__TAURI__.core.invoke(command,args);
 function status(message,bad=false){$('status').textContent=message;$('status').classList.toggle('bad',bad)}
 $('period').onchange=()=>{$('daysLabel').hidden=$('period').value!=='custom'};
 async function copy(){const value=$('output').value;if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(value);status('লাইসেন্স কী কপি হয়েছে।');return}catch{}}$('output').focus();$('output').select();status(document.execCommand('copy')?'লাইসেন্স কী কপি হয়েছে।':'কীটি নির্বাচন করে Ctrl+C চাপুন।')}
 $('copy').onclick=copy;
 $('issueForm').onsubmit=async event=>{
  event.preventDefault();if(busy||!ready)return;
  const period=$('period').value,days=period==='custom'?Number($('days').value):(period?Number(period):null);
  if(days!==null&&(!Number.isInteger(days)||days<1||days>3650)){status('১ থেকে ৩৬৫০ দিনের মধ্যে মেয়াদ দিন।',true);return}
  busy=true;$('generate').disabled=true;status('লাইসেন্স তৈরি হচ্ছে…');
  try{const result=await invoke('generator_save',{customer:$('customer').value.trim(),deviceCode:$('device').value.trim(),days});const license=result.license;
   $('resultCustomer').textContent=license.customer_name;$('resultExpiry').textContent=license.expires_at?new Date(license.expires_at*1000).toLocaleString('bn-BD'):'আজীবন';$('output').value=license.key;$('empty').hidden=true;$('result').hidden=false;status('লাইসেন্স তৈরি ও Issued-Licenses ফোল্ডারে সংরক্ষণ হয়েছে।')
  }catch(error){status(String(error),true)}finally{busy=false;$('generate').disabled=!ready}
 };
 $('generate').disabled=true;
 invoke('generator_info').then(info=>{ready=info.ready;$('generate').disabled=!ready;status(info.message,!ready)}).catch(()=>status('জেনারেটর চালু হয়নি। আবার খুলুন।',true));
})();
