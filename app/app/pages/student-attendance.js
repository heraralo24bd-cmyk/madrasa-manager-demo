window.MM = window.MM || {};
MM.studentAttendance = (() => {
  const e = MM.util.esc, t = text => MM.i18n.t(text);
  const number = value => MM.i18n.lang === 'en' ? String(value) : MM.util.bnNum(value);
  const monthLabel = month => new Intl.DateTimeFormat(MM.i18n.lang === 'en' ? 'en-GB' : 'bn-BD', {month:'long',year:'numeric'}).format(new Date(Number(month.slice(0,4)),Number(month.slice(5))-1,1));
  const mounts = new Set();
  function totals(data) {
    const counts = {present:0,absent:0,late:0,leave:0};
    data.entries.forEach(row => { if (row.status in counts) counts[row.status]++; });
    return counts;
  }
  function notes(data) {
    return data.entries.filter(row => row.status === 'leave').sort((a,b) => a.day.localeCompare(b.day));
  }
  function summaryHTML(data) {
    const counts = totals(data);
    return '<section class="sa-summary"><h3>'+t('মাসের হাজিরার সারাংশ')+'</h3><dl>'+Object.entries({present:'উপস্থিত',absent:'অনুপস্থিত',late:'বিলম্ব',leave:'ছুটি'}).map(([key,label]) => '<div class="a-'+key+'"><dt>'+t(label)+'</dt><dd>'+number(counts[key])+' <small>'+t('দিন')+'</small></dd></div>').join('')+'</dl><p>'+t('রেকর্ডকৃত দিন')+': '+number(data.entries.length)+' · '+t('হাজিরা নেওয়া হয়নি')+': '+number(data.days-data.entries.length)+'</p></section>';
  }
  function notesHTML(data) {
    const rows = notes(data);
    return '<section class="sa-notes"><h3>'+t('ছুটির কারণ')+'</h3>'+(rows.length ? '<ul>'+rows.map(row => '<li><time>'+number(e(row.day))+'</time><span translate="no">'+e(row.note || t('কারণ লেখা হয়নি'))+'</span></li>').join('')+'</ul>' : '<p>'+t('এই মাসে ছুটির রেকর্ড নেই')+'</p>')+'</section>';
  }
  function reportHTML(data) {
    const student = data.rows[0];
    return '<section class="sa-report" data-attendance-report="'+e(data.month)+'"><h2>'+e(monthLabel(data.month))+'</h2><p class="sa-student" translate="no">'+e(student?.name_bn || '')+' · '+e(student?.student_id || '')+'</p><div class="sa-summary-grid">'+summaryHTML(data)+notesHTML(data)+'</div>'+MM.attendanceRegister.html(data)+'</section>';
  }
  async function image(data) {
    await document.fonts.ready;
    const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
    const font = getComputedStyle(document.body).getPropertyValue('--app-font-bn').trim() || 'HindSiliguri';
    const setFont = (size,weight=400) => ctx.font = weight+' '+size+'px '+font+', sans-serif';
    const wrap = (text,width) => {
      const lines=[];let line='';
      for (const word of String(text).split(/\s+/)) {
        if (ctx.measureText(word).width > width) {
          if (line) { lines.push(line);line=''; }
          for (const char of word) { if(ctx.measureText(line+char).width>width && line){lines.push(line);line='';} line+=char; }
        } else if (line && ctx.measureText(line+' '+word).width>width) {lines.push(line);line=word;}
        else line+=(line?' ':'')+word;
      }
      if(line)lines.push(line);
      return lines.length?lines:[''];
    };
    setFont(24);
    const leaveRows = notes(data).map(row => ({day:row.day,lines:wrap(row.note || t('কারণ লেখা হয়নি'),1350)}));
    const institution = document.createElement('div');institution.innerHTML=MM.settings.headerHTML();
    const headerLines = [...institution.querySelector('header').children].filter(el=>el.tagName!=='IMG').flatMap(el=>el.textContent.split('\n')).map(s=>s.trim()).filter(Boolean);
    const logoSource = institution.querySelector('img')?.getAttribute('src');
    let logo;
    if(logoSource) {logo=new Image();logo.src=logoSource;await logo.decode();}
    const counts=totals(data), student=data.rows[0];
    setFont(28,600);const studentLines=wrap((student?.name_bn || '')+' · '+(student?.student_id || ''),1560);
    canvas.width=1800;canvas.height=850+headerLines.length*38+studentLines.length*36+leaveRows.reduce((n,row)=>n+Math.max(1,row.lines.length)*34+22,0);
    if(canvas.height>16000)throw Error(t('প্রতিবেদনটি বড়; পিডিএফ সংরক্ষণ করুন'));
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle='#157556';ctx.lineWidth=2;ctx.strokeRect(24,24,canvas.width-48,canvas.height-48);
    let y=70;
    if(logo)ctx.drawImage(logo,60,y,100,100);
    ctx.textAlign='center';ctx.fillStyle='#173b53';
    headerLines.forEach((line,i)=>{setFont(i?24:32,i?400:600);ctx.fillText(line,950,y+24,1500);y+=38;});
    y=Math.max(y,170)+35;setFont(32,600);ctx.fillText(t('হাজিরা রিপোর্ট')+' · '+monthLabel(data.month),900,y);y+=46;
    setFont(28,600);studentLines.forEach(line=>{ctx.fillText(line,900,y);y+=36;});y+=30;
    ctx.textAlign='left';
    const labels={present:'উপস্থিত',absent:'অনুপস্থিত',late:'বিলম্ব',leave:'ছুটি'}, colors={present:'#11795c',absent:'#b23348',late:'#966817',leave:'#2e6fbc'};
    Object.keys(counts).forEach((key,i)=>{const x=60+i*420;ctx.fillStyle='#f5f8fa';ctx.fillRect(x,y,400,100);ctx.fillStyle=colors[key];setFont(24);ctx.fillText(t(labels[key]),x+22,y+35);setFont(32,600);ctx.fillText(number(counts[key])+' '+t('দিন'),x+22,y+78);});
    y+=137;setFont(24);ctx.fillStyle='#526674';ctx.fillText(t('রেকর্ডকৃত দিন')+': '+number(data.entries.length)+' · '+t('হাজিরা নেওয়া হয়নি')+': '+number(data.days-data.entries.length),60,y);y+=30;
    const cells=new Map(data.entries.map(row=>[Number(row.day.slice(8)),row]));
    const codes=MM.i18n.lang==='en'?{present:'P',absent:'A',leave:'L',late:'T'}:{present:'উ',absent:'অ',leave:'ছ',late:'ব'};
    const cellWidth=1680/data.days;
    for(let i=0;i<data.days;i++) {
      const x=60+i*cellWidth, row=cells.get(i+1);
      ctx.strokeStyle='#a4b6ad';ctx.fillStyle='#edf5f0';ctx.fillRect(x,y,cellWidth,48);ctx.strokeRect(x,y,cellWidth,48);ctx.strokeRect(x,y+48,cellWidth,55);
      ctx.textAlign='center';ctx.fillStyle='#173b53';setFont(23,600);ctx.fillText(number(i+1),x+cellWidth/2,y+32);
      ctx.fillStyle=row?colors[row.status]:'#526674';ctx.fillText(row?codes[row.status]:'—',x+cellWidth/2,y+84);
    }
    ctx.textAlign='left';y+=146;setFont(22);ctx.fillStyle='#526674';ctx.fillText(Object.keys(labels).map(key=>codes[key]+' = '+t(labels[key])).join('    ')+'    — = '+t('হাজিরা নেওয়া হয়নি'),60,y);y+=58;
    ctx.fillStyle='#173b53';setFont(28,600);ctx.fillText(t('ছুটির কারণ'),60,y);y+=40;
    setFont(24);
    if(!leaveRows.length) {ctx.fillStyle='#526674';ctx.fillText(t('এই মাসে ছুটির রেকর্ড নেই'),60,y);}
    for(const row of leaveRows) {ctx.fillStyle='#2e6fbc';ctx.fillText(number(row.day),60,y);ctx.fillStyle='#173b53';row.lines.forEach(line=>{ctx.fillText(line,300,y);y+=34;});y+=22;}
    return canvas.toDataURL('image/png').split(',')[1];
  }
  function mount(root,{studentId,month=MM.util.today().slice(0,7),alive=()=>true}={}) {
    for(const old of mounts)if(!old.root.isConnected || old.root===root)mounts.delete(old);
    let data=null,sequence=0,busy=false;
    const valid=()=>root.isConnected && alive();
    root.innerHTML='<div class="sa-month-heading"><h3>'+t('মাসভিত্তিক হাজিরা')+'</h3><label>'+t('বছর')+'<select data-sa-year></select></label></div><div class="sa-months" role="group" aria-label="'+t('মাস')+'"></div><div class="r-status" data-sa-status role="status"></div><div data-sa-report></div><div class="sa-actions"><button type="button" class="btn btn-ghost" data-sa-image>'+MM.records.icon('file')+t('হাজিরার তথ্য ইমেজ আকারে ডাউনলোড করুন')+'</button><button type="button" class="btn btn-ghost" data-sa-pdf>'+MM.records.icon('file')+t('হাজিরার তথ্য পিডিএফ আকারে ডাউনলোড করুন')+'</button><button type="button" class="btn btn-primary" data-sa-print>'+MM.records.icon('print')+t('এই মাসের হাজিরা তথ্য প্রিন্ট করুন')+'</button><button type="button" class="btn btn-ghost" data-sa-all>'+MM.records.icon('print')+t('সকল মাসের হাজিরা তথ্য একত্রে প্রিন্ট করুন')+'</button></div>';
    const status=root.querySelector('[data-sa-status]'),year=root.querySelector('[data-sa-year]');
    const state={root,refresh:()=>{if(!busy)load();}};mounts.add(state);
    function controls() {
      root.querySelectorAll('.sa-actions button').forEach(button=>button.disabled=busy || !data?.rows.length);
      root.querySelectorAll('.sa-months button,[data-sa-year]').forEach(button=>button.disabled=busy);
    }
    function months() {
      const years=[...new Set([month.slice(0,4),MM.util.today().slice(0,4),...data.months.map(m=>m.month.slice(0,4))])].sort().reverse();
      year.innerHTML=years.map(y=>'<option value="'+y+'"'+(y===month.slice(0,4)?' selected':'')+'>'+number(y)+'</option>').join('');
      root.querySelector('.sa-months').innerHTML=Array.from({length:12},(_,i)=>{
        const key=month.slice(0,4)+'-'+String(i+1).padStart(2,'0');
        const label=new Intl.DateTimeFormat(MM.i18n.lang==='en'?'en-GB':'bn-BD',{month:'long'}).format(new Date(2000,i,1));
        return '<button type="button" data-sa-month="'+key+'" aria-pressed="'+(key===month)+'" class="'+(data.months.some(m=>m.month===key)?'has-records':'')+'">'+e(label)+'</button>';
      }).join('');
      root.querySelectorAll('[data-sa-month]').forEach(button=>button.onclick=()=>{month=button.dataset.saMonth;load();});
    }
    async function load() {
      const n=++sequence,selected=month;data=null;controls();status.className='r-status';status.textContent=t('লোড হচ্ছে…');
      root.querySelector('[data-sa-report]').innerHTML='';
      try {
        const next=await MM.records.invoke('attendance_register',{student_id:studentId,month:selected,class:''});
        if(!valid() || n!==sequence)return;
        data=next;months();root.querySelector('[data-sa-report]').innerHTML=reportHTML(data);status.textContent='';controls();
      } catch(error) {if(valid() && n===sequence){status.classList.add('bad');status.textContent=String(error);}}
    }
    year.onchange=()=>{month=year.value+'-'+month.slice(5);load();};
    async function action(task) {
      if(busy || !data)return;
      const selected=data,n=sequence;busy=true;controls();status.className='r-status';status.textContent=t('অপেক্ষা করুন…');
      try {const message=await task(selected);if(valid() && n===sequence)status.textContent=message || '';}
      catch(error) {if(valid()){status.classList.add('bad');status.textContent=String(error);}}
      finally {busy=false;if(valid())controls();}
    }
    root.querySelector('[data-sa-image]').onclick=()=>action(async selected=>t('ডাউনলোড সম্পন্ন')+': '+await MM.tauri.invoke('attendance_report_export',{png:await image(selected),pdfName:null,month:selected.month}));
    root.querySelector('[data-sa-pdf]').onclick=()=>action(async selected=>{
      const path=await MM.printing.savePDF(t('হাজিরা রিপোর্ট'),reportHTML(selected),{landscape:true});
      return t('ডাউনলোড সম্পন্ন')+': '+await MM.tauri.invoke('attendance_report_export',{png:null,pdfName:path.split(/[\\/]/).pop(),month:selected.month});
    });
    root.querySelector('[data-sa-print]').onclick=()=>data && MM.printing.open(t('হাজিরা রিপোর্ট'),reportHTML(data),{landscape:true});
    root.querySelector('[data-sa-all]').onclick=()=>action(async selected=>{
      const reports=[],keys=[...new Set(selected.months.map(m=>m.month))].sort();
      if(!keys.length)keys.push(selected.month);
      for(const key of keys) {const report=key===selected.month?selected:await MM.records.invoke('attendance_register',{student_id:studentId,month:key,class:''});if(!valid())return;reports.push(reportHTML(report));}
      if(valid())MM.printing.open(t('সকল মাসের হাজিরা তথ্য'),reports.join(''),{landscape:true});
    });
    load();return state;
  }
  const refresh=()=>{for(const state of mounts){if(!state.root.isConnected)mounts.delete(state);else state.refresh();}};
  document.addEventListener('mm-attendance-change',refresh);window.addEventListener('focus',refresh);
  return {mount,reportHTML,totals};
})();
