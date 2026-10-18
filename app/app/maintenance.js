(function () {
  'use strict';
  const invoke = window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke;
  const controls = document.querySelector('.win-ctrl');
  if (!invoke || !controls) return;
  const style = document.createElement('style');
  style.textContent = '.win-ctrl .mm-version{width:70px;flex:0 0 70px;font:11px var(--app-font-en,Poppins,sans-serif);color:var(--navy,#0d213d);white-space:nowrap}.mm-maintenance h2{font-size:17px;margin:0 0 14px}.mm-maintenance p{font-size:13px;margin:8px 0}.mm-maintenance code{display:block;white-space:normal;overflow-wrap:anywhere;font-size:12px;color:#455166}.mm-maintenance .mm-modal-act{flex-wrap:wrap}.mm-maintenance [role=status]{min-height:40px;overflow-wrap:anywhere}.mm-maintenance .btn{min-height:34px;font-size:12px}.mm-maintenance [data-backup]{min-width:110px}';
  document.head.appendChild(style);
  const button = document.createElement('button');
  button.className = 'wc mm-version';
  button.title = 'সংস্করণ ও ব্যাকআপ';
  button.setAttribute('aria-label', button.title);
  button.textContent = 'v1.3.4';
  controls.insertBefore(button, controls.firstChild);
  let info;
  invoke('app_info').then(function (value) { info = value; button.textContent = 'v' + value.version; }).catch(function () {});

  button.addEventListener('click', async function () {
    if (document.getElementById('mm-maintenance')) return;
    if (!info) {
      try { info = await invoke('app_info'); } catch (error) { if (window.MM) MM.util.toast(String(error), 'err'); return; }
    }
    const wrap = document.createElement('div');
    wrap.id = 'mm-maintenance';
    wrap.className = 'mm-modal';
    wrap.innerHTML = '<div class="mm-modal-box mm-maintenance" role="dialog" aria-modal="true" aria-labelledby="mm-maintenance-title">' +
      '<h2 id="mm-maintenance-title">সংস্করণ ও ব্যাকআপ</h2><p data-version></p>' +
      '<p>ডেটার অবস্থান</p><code data-data></code><p>ব্যাকআপের অবস্থান</p><code data-backups></code>' +
      '<p role="status" aria-live="polite"></p><div class="mm-modal-act">' +
      '<button class="btn btn-ghost" data-data-folder>ডেটা ফোল্ডার</button>' +
      '<button class="btn btn-ghost" data-backup-folder>ব্যাকআপ ফোল্ডার</button>' +
      '<button class="btn btn-primary" data-backup>ব্যাকআপ করুন</button>' +
      '<button class="btn btn-ghost" data-close>বন্ধ</button></div></div>';
    wrap.querySelector('[data-version]').textContent = 'Madrasa Manager v' + info.version;
    wrap.querySelector('[data-data]').textContent = info.data_dir;
    wrap.querySelector('[data-backups]').textContent = info.backup_dir;
    document.body.appendChild(wrap);
    const status = wrap.querySelector('[role=status]');
    let closing = false;
    const close = function () {
      if (closing) return;
      closing = true;
      document.removeEventListener('keydown', onKey);
      wrap.classList.add('mm-modal-closing');
      window.setTimeout(function () {
        wrap.remove();
        button.focus();
      }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150);
    };
    wrap.querySelector('[data-close]').onclick = close;
    function onKey(event) {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'Tab') {
        const buttons = [...wrap.querySelectorAll('button:not(:disabled)')];
        const index = buttons.indexOf(document.activeElement);
        if (index === -1) { buttons[event.shiftKey ? buttons.length - 1 : 0].focus(); event.preventDefault(); }
        else if (event.shiftKey && index === 0) { buttons[buttons.length - 1].focus(); event.preventDefault(); }
        else if (!event.shiftKey && index === buttons.length - 1) { buttons[0].focus(); event.preventDefault(); }
      }
    }
    document.addEventListener('keydown', onKey);
    function folder(backups) { invoke('open_data_folder', { backups: backups }).catch(function (error) { status.textContent = String(error); }); }
    wrap.querySelector('[data-data-folder]').onclick = function () { folder(false); };
    wrap.querySelector('[data-backup-folder]').onclick = function () { folder(true); };
    const backup = wrap.querySelector('[data-backup]');
    backup.onclick = async function () {
      backup.disabled = true;
      status.textContent = 'আপনার ডেটা নিরাপদে ব্যাকআপ করা হচ্ছে...';
      try { const path = await invoke('backup_create'); status.textContent = 'ব্যাকআপ সম্পূর্ণ হয়েছে: ' + path; }
      catch (error) { status.textContent = 'ব্যাকআপ হয়নি: ' + String(error); }
      finally { backup.disabled = false; if (wrap.isConnected) backup.focus(); }
    };
    backup.focus();
  });
})();
