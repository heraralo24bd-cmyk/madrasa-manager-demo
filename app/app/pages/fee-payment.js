window.MM = window.MM || {};
MM.feePayment = (() => {
  const e = MM.util.esc, bn = MM.util.bnNum, money = n => MM.records.money(n);
  let active = false;
  const image = (src, alt, cls) => src && /^(data:image\/(png|jpeg|webp|gif);base64,|https?:|asset:)/i.test(src)
    ? `<img class="${cls}" src="${e(src)}" alt="${e(alt)}">` : `<div class="${cls} mm-pay-placeholder" aria-label="${e(alt)}">${e((alt || 'শ').trim().charAt(0))}</div>`;
  async function open(row, reload, alive = () => true) {
    if (active || !alive()) return;
    if (!Number.isInteger(Number(row.id)) || Number(row.id) < 1 || !Number.isInteger(Number(row.student_key)) || Number(row.student_key) < 1 || !Number.isFinite(Number(row.due)) || Number(row.due) <= 0) throw 'পরিশোধের হিসাব বা বকেয়া সঠিক নয়।';
    active = true;
    let student, settings;
    try { [student, settings] = await Promise.all([MM.students.get(row.student_key), MM.tauri.invoke('settings_get')]); }
    catch (err) { active = false; throw err; }
    if (!alive()) { active = false; return; }
    if (!student || Number(student.id) !== Number(row.student_key)) { active = false; throw 'শিক্ষার্থী পাওয়া যায়নি।'; }
    const previous = document.activeElement, wrap = document.createElement('div');
    wrap.className = 'r-modal mm-pay-overlay';
    let busy = false, saved = false, payload = null, closing = false;
    const request_id = crypto.randomUUID();
    function close() {
      if (busy || closing) return;
      closing = true;
      document.removeEventListener('keydown', keys);
      wrap.classList.add('mm-pay-closing');
      window.setTimeout(() => {
        wrap.remove();
        active = false;
        if (previous?.isConnected) previous.focus();
      }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 170);
    }
    function keys(ev) {
      if (document.querySelector('.mm-print-dialog')) return;
      if (ev.key === 'Escape') { ev.preventDefault(); close(); }
      if (ev.key === 'Tab') {
        const items = [...wrap.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (ev.shiftKey && (document.activeElement === first || !wrap.contains(document.activeElement))) { ev.preventDefault(); last.focus(); }
        if (!ev.shiftKey && (document.activeElement === last || !wrap.contains(document.activeElement))) { ev.preventDefault(); first.focus(); }
      }
    }
    wrap.innerHTML = `<form class="r-dialog mm-pay-card" role="dialog" aria-modal="true" aria-labelledby="mmPayTitle">
      <button type="button" class="mm-pay-x" aria-label="বন্ধ করুন" id="rCancel">×</button>
      <h2 id="mmPayTitle">ফি জমা</h2>
      ${image(student.photo, student.name_bn, 'mm-pay-photo')}
      <div class="mm-pay-student"><div><small>শিক্ষার্থীর নাম</small><strong>${e(student.name_bn)}</strong></div><div><small>রোল</small><strong>${bn(e(student.roll || '—'))}</strong></div><div><small>শ্রেণি</small><strong>${e(row.class || student.class)}</strong></div></div>
      <div class="mm-pay-grid"><label>কী বাবদ পরিশোধ<input value="${e(row.fee_name)} · ${e(row.period)}" readonly></label><label>পরিশোধের পরিমাণ<input id="rAmount" type="number" min="1" max="${Number(row.due)}" step="1" value="${Number(row.due)}" required><small>বকেয়া ${money(row.due)}</small></label>
      <label>পরিশোধকারীর স্বাক্ষর (নাম লিখুন)<input id="rPayer" maxlength="150" autocomplete="name" placeholder="পরিশোধকারীর নাম"></label><label>পরিশোধের তারিখ<input id="rPayDate" type="date" value="${MM.util.today()}" required></label>
      <label>পেমেন্ট মাধ্যম<select id="rMethod"><option>নগদ</option><option>ব্যাংক</option><option>বিকাশ</option><option>নগদ মোবাইল</option><option>অন্যান্য</option></select></label><label>মন্তব্য<input id="rNote" maxlength="750"></label></div>
      <p id="mmPayStatus" role="status" aria-live="polite"></p><button id="rSave" class="btn btn-primary mm-pay-submit" type="submit">পরিশোধ করুন</button>
    </form>`;
    document.body.appendChild(wrap); document.addEventListener('keydown', keys);
    wrap.querySelector('#rCancel').onclick = close;
    wrap.querySelector('#rAmount').focus();
    const form = wrap.querySelector('form');
    form.onsubmit = async ev => {
      ev.preventDefault(); if (busy || saved || !form.reportValidity()) return;
      if (!alive()) { close(); return; }
      busy = true;
      // Keep the original request and fields for an uncertain-response retry.
      if (!payload) {
        const payer = form.querySelector('#rPayer').value.trim();
        const note = form.querySelector('#rNote').value.trim();
        payload = {charge_id:row.id, amount:Number(form.querySelector('#rAmount').value), pay_date:form.querySelector('#rPayDate').value, method:form.querySelector('#rMethod').value, note:note + (payer ? `${note ? '\n' : ''}পরিশোধকারীর স্বাক্ষর (নাম): ${payer}` : ''), request_id};
      }
      const controls = [...form.querySelectorAll('input,select,button')]; controls.forEach(el => el.disabled = true);
      const status = form.querySelector('#mmPayStatus'); status.textContent = 'পরিশোধ সংরক্ষণ হচ্ছে…';
      let result;
      try { result = await MM.records.invoke('fee_pay', payload); }
      catch (err) {
        busy = false;
        // Backend validation errors are definite; transport errors remain retry-only.
        const definite = typeof err === 'string';
        if (definite) payload = null;
        controls.forEach(el => el.disabled = !definite && el.matches('input,select'));
        status.textContent = String(err) + (definite ? '' : ' একই তথ্য দিয়ে আবার পরিশোধ করুন।'); return;
      }
      saved = true;
      let receipt = {...row, ...payload, id:result.id, name_bn:student.name_bn, student_id:student.student_id, bill_payable:row.amount, paid_total:Number(row.paid)+payload.amount, due_at_receipt:Number(row.due)-payload.amount};
      let notice = '';
      try { const ledger = await MM.records.invoke('fee_list', {student_id:student.id,class:'',search:'',dues:false}); receipt = ledger.receipts.find(r => r.id === result.id) || receipt; }
      catch { notice = 'পরিশোধ সংরক্ষিত। তালিকা পুনরায় খুললে সর্বশেষ তথ্য পাবেন।'; }
      busy = false;
      success(receipt, notice);
      Promise.resolve().then(() => alive() && reload?.()).catch(() => { const msg=wrap.querySelector('#mmPayStatus'); if(msg) msg.textContent='পরিশোধ সংরক্ষিত। তালিকা পুনরায় খুললে সর্বশেষ তথ্য পাবেন।'; });
    };
    function success(r, notice) {
      wrap.className = 'mm-pay-overlay mm-pay-success-overlay';
      let stamp = r.pay_date;
      if (r.created_at) { const d=new Date(r.created_at.replace(' ','T')+'Z'); if (!isNaN(d)) stamp += ' · ' + d.toLocaleTimeString('bn-BD',{hour:'2-digit',minute:'2-digit'}); }
      wrap.innerHTML = `<section class="mm-pay-card mm-pay-success" role="dialog" aria-modal="true" aria-labelledby="mmPayTitle"><button type="button" class="mm-pay-x" aria-label="বন্ধ করুন" data-close>×</button>
        <header>${image(settings.logo, settings.name_bn || 'মাদরাসা', 'mm-pay-logo')}<h2>${e(settings.name_bn || settings.name_en || 'মাদরাসা ম্যানেজার')}</h2><p>${e(settings.address || '')}</p><p>${[settings.phone, settings.email].filter(Boolean).map(e).join(' · ')}</p><span class="mm-pay-pill">অফিশিয়াল ডিজিটাল পরিশোধ রসিদ</span></header>
        <h2 id="mmPayTitle" class="mm-pay-thanks">ধন্যবাদ! পরিশোধ সম্পন্ন হয়েছে</h2>
        <div class="mm-pay-meta"><div><small>লেনদেন নম্বর</small><strong>MM-${bn(r.id)}</strong></div><div><small>তারিখ ও সময়</small><strong>${bn(e(stamp))}</strong></div></div>
        <div class="mm-pay-details"><div class="mm-pay-grid"><div><small>শিক্ষার্থীর নাম</small><strong>${e(r.name_bn)}</strong></div><div><small>আইডি নম্বর</small><strong>${e(r.student_id)}</strong></div><div><small>শ্রেণি</small><strong>${e(row.class || student.class)}</strong></div><div><small>রোল নম্বর</small><strong>${bn(e(student.roll || '—'))}</strong></div></div><div class="mm-pay-line"><span>${e(r.fee_name)} (${bn(e(r.period))})</span><strong>${money(r.amount)}</strong></div><div class="mm-pay-total"><strong>সর্বমোট আদায়কৃত</strong><strong>${money(r.amount)}</strong></div>${Number(r.due_at_receipt)>0 ? `<p class="mm-pay-balance">অবশিষ্ট বকেয়া: ${money(r.due_at_receipt)}</p>` : ''}</div>
        <div class="mm-pay-footer"><div><small>পেমেন্ট মাধ্যম: <b>${e(r.method)}</b></small><strong class="mm-pay-paid">✓ Paid (পরিশোধিত)</strong></div><div class="mm-pay-qr" aria-label="রসিদের তথ্যের QR কোড"></div></div>
        <p id="mmPayStatus" role="status">${e(notice)}</p><div class="mm-pay-actions"><button class="btn btn-ghost" type="button" data-close>বন্ধ করুন</button><button class="btn btn-primary" type="button" data-print>${MM.records.icon('print')} রসিদ প্রিন্ট করুন</button></div></section>`;
      wrap.querySelectorAll('[data-close]').forEach(el => el.onclick = close);
      wrap.querySelector('[data-print]').onclick = () => MM.records.receipt(r,false);
      if (typeof qrcode === 'function') { const qr=qrcode(0,'M');qr.addData('Receipt MM-'+r.id+' | Student '+r.student_id+' | BDT '+r.amount+' | '+r.pay_date);qr.make();wrap.querySelector('.mm-pay-qr').innerHTML=qr.createSvgTag(2,0)+'<small>রসিদের তথ্য</small>'; }
      wrap.querySelector('[data-print]').focus(); confetti(wrap);
    }
  }
  function confetti(wrap) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const layer=document.createElement('div');layer.className='mm-pay-confetti';layer.setAttribute('aria-hidden','true');wrap.appendChild(layer);
    const colors=['#6548eb','#ff759c','#55d5e8','#8ce562','#ffcb67','#ecea58'];
    for(let i=0;i<24;i++){const p=document.createElement('i');p.style.cssText=`--x:${(Math.random()-.5)*70}vw;--spin:${Math.random()*700-350}deg;--delay:${Math.random()*.2}s;background:${colors[i%colors.length]};left:${35+Math.random()*30}%;`;layer.appendChild(p);}
    setTimeout(()=>layer.remove(),3600);
  }
  return {open};
})();
