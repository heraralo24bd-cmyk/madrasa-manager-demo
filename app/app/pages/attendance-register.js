window.MM = window.MM || {};
MM.attendanceRegister = (() => {
  const e = MM.util.esc, t = text => MM.i18n.t(text);
  const names = {present:'উপস্থিত',absent:'অনুপস্থিত',leave:'ছুটি',late:'বিলম্ব'};
  const mounts = new Set();
  const number = value => MM.i18n.lang === 'en' ? String(value) : MM.util.bnNum(value);
  function html(data) {
    const english = MM.i18n.lang === 'en', codes = english ? {present:'P',absent:'A',leave:'L',late:'T'} : {present:'উ',absent:'অ',leave:'ছ',late:'ব'};
    const entries = new Map(data.entries.map(r => [r.id + '|' + Number(r.day.slice(8)),r]));
    const legend = Object.keys(names).map(s => '<span class="a-key a-' + s + '">' + codes[s] + ' = ' + t(names[s]) + '</span>').join('') + '<span class="a-key">— = ' + t('হাজিরা নেওয়া হয়নি') + '</span>';
    return '<div class="a-register-legend">' + legend + '</div><div class="a-register-scroll"><table class="a-register"><thead><tr><th>' + t('রোল') + '</th><th class="a-name">' + t('নাম') + '</th>' +
      Array.from({length:data.days},(_,i) => '<th>' + number(i+1) + '</th>').join('') + Object.values(names).map(n => '<th>' + t(n) + '</th>').join('') + '</tr></thead><tbody>' +
      (data.rows.length ? data.rows.map(s => {
        const counts = {present:0,absent:0,leave:0,late:0};
        const days = Array.from({length:data.days},(_,i) => {
          const r = entries.get(s.id + '|' + (i+1));
          if (r) counts[r.status]++;
          return '<td class="a-day ' + (r ? 'a-' + r.status : '') + '" data-day="' + (i+1) + '" title="' + e(data.month+'-'+String(i+1).padStart(2,'0') + ': ' + (r ? t(names[r.status]) + (r.note ? ' · ' + r.note : '') : t('হাজিরা নেওয়া হয়নি'))) + '">' + (r ? codes[r.status] : '—') + '</td>';
        }).join('');
        return '<tr data-register-student="' + s.id + '"><td translate="no">' + number(e(s.roll || '-')) + '</td><th scope="row" class="a-name" translate="no">' + e(s.name_bn) + '<small>' + e(s.student_id) + '</small></th>' + days + Object.values(counts).map(c => '<td class="a-total">' + number(c) + '</td>').join('') + '</tr>';
      }).join('') : '<tr><td colspan="' + (data.days+6) + '">' + t('কোনো তথ্য নেই') + '</td></tr>') + '</tbody></table></div>';
  }
  function mount(root, {studentId = 0, className = '', month = MM.util.today().slice(0,7), alive = () => true} = {}) {
    for (const old of mounts) if (!old.root.isConnected || old.root === root) mounts.delete(old);
    let data, sequence=0;
    const state={root,refresh:load}; mounts.add(state);
    root.innerHTML = '<div class="r-toolbar"><label>' + t('মাস') + '<input data-register-month type="month" value="' + e(month) + '" min="1900-01" max="2200-12" required></label>' +
      '<button type="button" class="btn btn-ghost" data-register-prev aria-label="' + t('আগের মাস') + '" title="' + t('আগের মাস') + '">' + MM.records.icon('chevron') + '</button>' +
      '<button type="button" class="btn btn-ghost" data-register-next aria-label="' + t('পরের মাস') + '" title="' + t('পরের মাস') + '">' + MM.records.icon('chevron') + '</button>' +
      '<label>' + t('সংরক্ষিত মাস') + '<select data-register-history></select></label><button type="button" class="btn btn-ghost" data-register-print disabled>' + MM.records.icon('print') + t('প্রিন্ট') + '</button></div>' +
      '<div class="r-status" data-register-status role="status"></div><div data-register-grid></div>';
    const input=root.querySelector('[data-register-month]'), status=root.querySelector('[data-register-status]'), print=root.querySelector('[data-register-print]');
    async function load() {
      const n=++sequence, selected=input.value;
      data=null;print.disabled=true;
      root.querySelector('[data-register-grid]').innerHTML='';
      status.textContent=t('লোড হচ্ছে…');status.className='r-status';
      try {
        const next=await MM.records.invoke('attendance_register',{month:selected,class:className,student_id:studentId});
        if (!root.isConnected || !alive() || n!==sequence) return;
        data=next;status.textContent='';
        root.querySelector('[data-register-grid]').innerHTML=html(data);
        const months=[...new Set([selected,...data.months.map(m=>m.month)])].sort().reverse();
        root.querySelector('[data-register-history]').innerHTML=months.map(m=>'<option value="'+e(m)+'"'+(m===selected?' selected':'')+'>'+number(e(m))+'</option>').join('');
        print.disabled=!data.rows.length;
      } catch(error) {if(root.isConnected && n===sequence){status.classList.add('bad');status.textContent=String(error);}}
    }
    input.onchange=load;
    root.querySelector('[data-register-history]').onchange=ev=>{input.value=ev.target.value;load();};
    for(const [key,delta] of [['prev',-1],['next',1]]) root.querySelector('[data-register-'+key+']').onclick=()=>{
      if(!/^\d{4}-\d{2}$/.test(input.value))return;
      const [y,m]=input.value.split('-').map(Number), date=new Date(y,m-1+delta,1);
      if(date.getFullYear()<1900 || date.getFullYear()>2200)return;
      input.value=date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0');load();
    };
    print.onclick=()=>data && MM.printing.open(t('হাজিরা রিপোর্ট')+' · '+number(data.month)+(className?' · '+className:''),html(data),{landscape:true});
    load();
    return state;
  }
  const refresh=()=>{for(const state of mounts) {if(!state.root.isConnected)mounts.delete(state);else state.refresh();}};
  document.addEventListener('mm-attendance-change',refresh);
  window.addEventListener('focus',refresh);
  return {mount,html};
})();
