window.MM = window.MM || {};
MM.settings = (() => {
  let value = null;
  const printSizes = Object.freeze([
    {key:'print_logo_size_px', label:'লোগোর মাপ', value:64, min:24, max:120, unit:'px', css:'--mm-logo-size'},
    {key:'print_calligraphy_width_mm', label:'ক্যালিগ্রাফির প্রস্থ', value:145, min:60, max:180, unit:'mm', css:'--mm-calligraphy-width'},
    {key:'print_calligraphy_height_px', label:'ক্যালিগ্রাফির সর্বোচ্চ উচ্চতা', value:65, min:24, max:120, unit:'px', css:'--mm-calligraphy-height'},
    {key:'print_name_bn_size_px', label:'বাংলা নামের অক্ষরের মাপ', value:32, min:16, max:48, unit:'px', css:'--mm-name-bn-size'},
    {key:'print_name_en_size_px', label:'ইংরেজি নামের অক্ষরের মাপ', value:20, min:10, max:32, unit:'px', css:'--mm-name-en-size'},
    {key:'print_address_size_px', label:'ঠিকানার অক্ষরের মাপ', value:14, min:9, max:24, unit:'px', css:'--mm-address-size'},
    {key:'print_contact_size_px', label:'যোগাযোগের অক্ষরের মাপ', value:13, min:9, max:22, unit:'px', css:'--mm-contact-size'}
  ].map(Object.freeze));
  function printSize(field, settings = value) {
    const n = Number(settings?.[field.key]);
    return Number.isInteger(n) && n >= field.min && n <= field.max ? n : field.value;
  }
  function applyHeaderSizes(root = document) {
    const headers = [];
    if (root?.matches?.('.mm-print-letterhead')) headers.push(root);
    if (root?.querySelectorAll) headers.push(...root.querySelectorAll('.mm-print-letterhead'));
    for (const header of headers) {
      let settings = value;
      if (header.hasAttribute('data-print-sizes')) {
        settings = {};
        try {
          const stored = JSON.parse(header.getAttribute('data-print-sizes'));
          if (stored && typeof stored === 'object' && !Array.isArray(stored)) settings = stored;
        } catch (_) {}
      }
      // Individual CSSOM assignments remain valid when native CSP rejects style attributes.
      for (const field of printSizes) header.style.setProperty(field.css, printSize(field, settings) + field.unit);
    }
  }
  const ready = MM.tauri.ready() ? MM.tauri.invoke('settings_get').then(s => {
    value = s;
    if (s.language) window.setLanguage(s.language);
    applyProfile();
    MM.tauri.invoke('app_info').then(info => {
      if (info.restore_completed) MM.util.toast(MM.i18n.t('ব্যাকআপ ফেরানো হয়েছে'));
    }).catch(() => {});
    return s;
  }).catch(err => { MM.util.toast(String(err), 'err'); return null; }) : Promise.resolve(null);
  function applyProfile() {
    const name = document.querySelector('.profile b');
    if (name && value) name.textContent = value.administrator_name;
  }
  function headerHTML({variant = '', fallbackLogo = false, settings = value} = {}) {
    const s = settings || {}, e = MM.util.esc;
    const logo = s.logo || (fallbackLogo ? 'assets/support-logo.png' : '');
    const marksheet = variant === 'q-letterhead';
    const addressIcon = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5M5.5 9v11h13V9M9 20v-7h6v7"/></svg>';
    const sizeValues = Object.fromEntries(printSizes.map(field => [field.key, printSize(field,s)]));
    const sizes = printSizes.map(field => field.css + ':' + sizeValues[field.key] + field.unit).join(';');
    return '<header class="mm-print-letterhead ' + e(variant) + '" translate="no" data-print-sizes="' + e(JSON.stringify(sizeValues)) + '" style="' + sizes + '">' +
      '<div class="mm-letterhead-marks">' +
      (logo ? '<img class="mm-letterhead-logo' + (marksheet ? ' q-logo' : '') + '" alt="" src="' + e(logo) + '">' : '<span></span>') +
      (s.calligraphy ? '<img class="mm-letterhead-calligraphy" alt="" src="' + e(s.calligraphy) + '">' : '') +
      '<span></span></div>' +
      '<h1>' + e(s.name_bn || 'মাদরাসা ম্যানেজার') + '</h1>' +
      (s.name_en ? '<div class="mm-letterhead-name-en' + (marksheet ? ' q-name-en' : '') + '">' + e(s.name_en) + '</div>' : '') +
      (s.address ? '<div class="mm-letterhead-address' + (marksheet ? ' q-address' : '') + '">' + addressIcon + '<span>' + e(s.address) + '</span></div>' : '') +
      '<div class="mm-letterhead-contact' + (marksheet ? ' q-contacts' : '') + '">' + [s.phone, s.whatsapp, s.email].filter(Boolean).map(e).join(' | ') + '</div></header>';
  }
  function footerHTML() {
    return value?.receipt_footer ? '<footer style="text-align:center;margin-top:20px;font-size:12px;white-space:pre-wrap">' + MM.util.esc(value.receipt_footer) + '</footer>' : '';
  }
  return { ready, printSizes, printSize, applyHeaderSizes, get value() { return value; }, set(s) { value = s; applyProfile(); }, applyProfile, headerHTML, footerHTML };
})();

MM.pageSettings = (() => {
  const e = MM.util.esc, t = s => MM.i18n.t(s);
  let dirty = false, busy = false, generation = 0;
  const icon = id => '<svg aria-hidden="true"><use href="#i-' + id + '"/></svg>';
  const field = (key, label, s, max, type = 'text') => '<label>' + label + '<input name="' + key + '" type="' + type +
    '" maxlength="' + max + '" value="' + e(s[key]) + '"' + (['name_bn','administrator_name'].includes(key) ? ' required' : '') + '></label>';
  const area = (key, label, s, max) => '<label class="settings-wide">' + label + '<textarea name="' + key + '" maxlength="' + max + '" rows="3">' + e(s[key]) + '</textarea></label>';
  function status(root, message, error = false) {
    const box = root.querySelector('#settingsStatus');
    if (box) { box.textContent = t(message); box.classList.toggle('error', error); }
  }
  async function render(root, params = {}) {
    const run = ++generation;
    dirty = false; busy = false;
    root.innerHTML = '<div class="settings-page"><h2>সেটিংস</h2><p role="status">লোড হচ্ছে…</p></div>';
    try {
      await MM.settings.ready;
      const [s, info] = await Promise.all([MM.tauri.invoke('settings_get'), MM.tauri.invoke('app_info')]);
      if (run !== generation || MM.router.current !== 'settings') return;
      MM.settings.set(s);
      const isBackupPage = params.tab === 'backup';
      root.innerHTML = '<section class="settings-page"><header class="settings-heading"><h2>' + icon(isBackupPage ? 'save' : 'theme') + (isBackupPage ? 'ব্যাকআপ' : 'সেটিংস') + '</h2>' +
        '<span id="settingsStatus" role="status" aria-live="polite"></span></header>' +
        (isBackupPage ? '' : '<div class="settings-tabs" role="tablist" aria-label="সেটিংস">' +
        [['institution','প্রতিষ্ঠান'],['general','সাধারণ'],['about','সফটওয়্যার']].map(([id,label]) =>
          '<button type="button" id="tab-' + id + '" role="tab" aria-controls="panel-' + id + '" data-tab="' + id + '">' + label + '</button>').join('') + '</div>') +
        '<form id="settingsForm"><section id="panel-institution" role="tabpanel" aria-labelledby="tab-institution" data-panel="institution">' +
        '<div class="settings-logo"><img id="institutionLogo" src="' + e(s.logo || 'assets/support-logo.png') + '" alt="প্রতিষ্ঠানের লোগো" width="96" height="96">' +
        '<div><b>প্রতিষ্ঠানের লোগো</b><div class="settings-actions"><button class="btn btn-ghost" type="button" id="logoChoose">' + icon('file') + 'ছবি নির্বাচন</button>' +
        '<button class="btn btn-ghost" type="button" id="logoRemove">' + icon('trash') + 'সরান</button></div></div>' +
        '<input type="file" id="settingsLogoFile" accept="image/png,image/jpeg,image/webp" hidden></div>' +
        '<div class="settings-calligraphy"><img id="institutionCalligraphy" src="' + e(s.calligraphy || 'assets/support-logo.png') + '" alt="প্রিন্টের ক্যালিগ্রাফি" width="240" height="72">' +
        '<div><b>প্রিন্টের ক্যালিগ্রাফি</b><p>এটি মার্কশিট ও রিপোর্টে মাদরাসার নামের উপরে দেখাবে। PNG, JPEG বা WebP ছবি দিতে পারবেন।</p>' +
        '<div class="settings-actions"><button class="btn btn-ghost" type="button" id="calligraphyChoose">' + icon('file') + 'ক্যালিগ্রাফি/ছবি নির্বাচন</button>' +
        '<button class="btn btn-ghost" type="button" id="calligraphyRemove">' + icon('trash') + 'সরান</button></div></div>' +
        '<input type="file" id="settingsCalligraphyFile" accept="image/png,image/jpeg,image/webp" hidden></div>' +
        '<div class="settings-grid">' + field('name_bn','প্রতিষ্ঠানের নাম',s,160) + field('name_en','প্রতিষ্ঠানের নাম (English)',s,160) +
        area('address','সম্পূর্ণ ঠিকানা',s,600) + field('phone','মোবাইল নম্বর',s,30,'tel') + field('whatsapp','হোয়াটসঅ্যাপ নম্বর',s,30,'tel') +
        field('email','ইমেইল',s,160,'email') + '</div>' +
        '<section class="settings-print-sizing" aria-labelledby="printSizingTitle"><div class="settings-print-heading"><div><h3 id="printSizingTitle">প্রিন্টের শিরোনামের মাপ</h3>' +
        '<p>লোগো, ক্যালিগ্রাফি ও লেখার মাপ বদলে নিচে দেখুন। সংরক্ষণ করলে সব রিপোর্ট ও মার্কশিটে প্রযোজ্য হবে। ছবির অনুপাত অপরিবর্তিত থাকবে।</p></div>' +
        '<button type="button" id="settingsPrintSizeReset" class="btn btn-ghost">স্বাভাবিক মাপ ফিরিয়ে আনুন</button></div>' +
        '<div class="settings-grid settings-size-grid">' + MM.settings.printSizes.map(f => '<label>' + f.label + ' (' + f.unit + ')' +
          '<input type="number" name="' + f.key + '" min="' + f.min + '" max="' + f.max + '" step="1" required value="' + MM.settings.printSize(f,s) + '" data-print-size>' +
          '<small>' + f.min + '–' + f.max + ' ' + f.unit + '</small></label>').join('') + '</div>' +
        '<div class="settings-print-preview-label">শিরোনামের সরাসরি নমুনা <span>দীর্ঘ নাম বা বড় মাপের কারণে বেশি জায়গা লাগতে পারে।</span></div>' +
        '<div class="settings-print-preview"><div id="settingsPrintHeaderPreview" aria-label="প্রিন্টের শিরোনামের নমুনা"></div></div></section></section>' +
        '<section id="panel-general" role="tabpanel" aria-labelledby="tab-general" data-panel="general" hidden><div class="settings-grid">' +
        field('academic_year','শিক্ষাবর্ষ',s,20) + field('administrator_name','পরিচালকের নাম',s,80) +
        '<label>প্রাথমিক ভাষা<select name="language" id="settingsLang">' + [['','সর্বশেষ ব্যবহৃত ভাষা'],['bn','বাংলা'],['en','English']].map(([v,l]) =>
          '<option value="' + v + '"' + (v === s.language ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label>' +
        area('receipt_footer','প্রিন্টের নিচের লেখা',s,300) + '</div></section>' +
        '<div id="settingsSaveBar" class="settings-save"><button type="submit" class="btn btn-primary" id="settingsSave">' + icon('save') + 'সংরক্ষণ করুন</button>' +
        '<button type="button" class="btn btn-ghost" id="settingsCancel">বাতিল</button></div></form>' +
        '<section id="panel-backup" role="tabpanel" aria-labelledby="tab-backup" data-panel="backup" hidden>' +
        '<div class="settings-actions"><button class="btn btn-primary" id="settingsBackup">' + icon('save') + 'নতুন ব্যাকআপ</button>' +
        '<button class="btn btn-ghost" id="settingsBackupFolder">' + icon('file') + 'ব্যাকআপ ফোল্ডার</button>' +
        '<button class="btn btn-ghost" id="settingsBackupRefresh" title="রিফ্রেশ">' + icon('refresh') + '</button></div>' +
        '<div id="settingsBackupList"></div></section>' +
        '<section id="panel-about" role="tabpanel" aria-labelledby="tab-about" data-panel="about" hidden>' +
        '<dl class="settings-info"><dt>সফটওয়্যার</dt><dd>Madrasa Manager</dd><dt>সংস্করণ</dt><dd>' + e(info.version) +
        '</dd><dt>সংযোগ</dt><dd>তথ্য ও কম্পিউটারভিত্তিক লাইসেন্স সম্পূর্ণ অফলাইন</dd><dt>টাইমজোন ও সময়</dt><dd>কম্পিউটারের স্থানীয় সময়</dd><dt>তথ্যের ফোল্ডার</dt><dd>' + e(info.data_dir) +
        '</dd></dl>' +
        '<div class="settings-actions"><button class="btn btn-ghost" id="settingsDataFolder">' + icon('file') + 'তথ্যের ফোল্ডার</button>' +
        '<button class="btn btn-primary" id="settingsHelp">' + icon('bell') + 'সাহায্য ও যোগাযোগ</button>' +
        '<button type="button" class="btn btn-ghost" id="settingsLicenseManage">' + icon('file') + 'লাইসেন্স ও অ্যাক্টিভেশন</button></div></section></section>';
      const form = root.querySelector('#settingsForm');
      let logo = s.logo, calligraphy = s.calligraphy || '';
      const logoJob = {value:0}, calligraphyJob = {value:0};
      function previewSettings() {
        const fields = [...form.elements].filter(el => el.name).map(el => [el.name, el.value]);
        const current = {...s, ...Object.fromEntries(fields), logo, calligraphy};
        for (const field of MM.settings.printSizes) current[field.key] = Number(current[field.key]);
        return current;
      }
      function updatePrintPreview() {
        const preview = root.querySelector('#settingsPrintHeaderPreview');
        preview.innerHTML = MM.settings.headerHTML({settings:previewSettings()});
        MM.settings.applyHeaderSizes(preview);
      }
      function mark() { dirty = true; status(root, 'অসংরক্ষিত পরিবর্তন'); updatePrintPreview(); }
      function setBusy(v) {
        busy = v;
        root.querySelectorAll('button,input,select,textarea').forEach(el => el.disabled = v);
      }
      function selectTab(tab, focus = false) {
        root.querySelectorAll('[data-tab]').forEach(b => {
          const selected = b.dataset.tab === tab;
          b.setAttribute('aria-selected', String(selected)); b.tabIndex = selected ? 0 : -1;
          if (selected && focus) b.focus();
        });
        root.querySelectorAll('[data-panel]').forEach(p => p.hidden = p.dataset.panel !== tab);
        root.querySelector('#settingsSaveBar').hidden = !['institution','general'].includes(tab);
      }
      root.querySelectorAll('[data-tab]').forEach(b => {
        b.onclick = () => selectTab(b.dataset.tab);
        b.onkeydown = ev => {
          const tabs = [...root.querySelectorAll('[data-tab]')], i = tabs.indexOf(b);
          let next;
          if (ev.key === 'ArrowRight') next = (i+1)%tabs.length;
          if (ev.key === 'ArrowLeft') next = (i+tabs.length-1)%tabs.length;
          if (ev.key === 'Home') next = 0;
          if (ev.key === 'End') next = tabs.length-1;
          if (next !== undefined) { ev.preventDefault(); selectTab(tabs[next].dataset.tab, true); }
        };
      });
      form.addEventListener('input', mark);
      form.addEventListener('change', mark);
      root.querySelector('#settingsPrintSizeReset').onclick = () => {
        for (const field of MM.settings.printSizes) form.elements.namedItem(field.key).value = field.value;
        mark();
      };
      root.querySelector('#logoChoose').onclick = () => root.querySelector('#settingsLogoFile').click();
      root.querySelector('#logoRemove').onclick = () => { ++logoJob.value; logo = ''; root.querySelector('#institutionLogo').src = 'assets/support-logo.png'; mark(); };
      root.querySelector('#calligraphyChoose').onclick = () => root.querySelector('#settingsCalligraphyFile').click();
      root.querySelector('#calligraphyRemove').onclick = () => { ++calligraphyJob.value; calligraphy = ''; root.querySelector('#institutionCalligraphy').src = 'assets/support-logo.png'; mark(); };
      async function readPng(file, dimension) {
        const data = await new Promise((resolve,reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(new Error(t('ছবি পড়া যায়নি'))); r.readAsDataURL(file); });
        const img = await new Promise((resolve,reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error(t('ছবি সঠিক নয়'))); img.src = data; });
        if (!img.width || !img.height || img.width*img.height > 40_000_000) throw new Error(t('ছবি অতিরিক্ত বড়'));
        const scale = Math.min(1, dimension/Math.max(img.width,img.height)), c = document.createElement('canvas');
        c.width = Math.max(1,Math.round(img.width*scale)); c.height = Math.max(1,Math.round(img.height*scale));
        c.getContext('2d').drawImage(img,0,0,c.width,c.height);
        return c.toDataURL('image/png');
      }
      async function selectImage(ev, target, job, dimension) {
        const file = ev.target.files[0], currentJob = ++job.value;
        if (!file) return;
        try {
          if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 8*1024*1024) throw new Error(t('PNG, JPEG অথবা WebP ছবি দিন (সর্বোচ্চ ৮ MB)।'));
          setBusy(true);
          const png = await readPng(file, dimension);
          if (run !== generation || currentJob !== job.value) return;
          target.value = png;
          root.querySelector(target.preview).src = png;
          mark();
        } catch (err) { status(root, String(err.message || err), true); }
        finally { if (run === generation) setBusy(false); ev.target.value = ''; }
      }
      root.querySelector('#settingsLogoFile').onchange = ev => selectImage(ev,{preview:'#institutionLogo',set value(v){logo=v;}},logoJob,320);
      root.querySelector('#settingsCalligraphyFile').onchange = ev => selectImage(ev,{preview:'#institutionCalligraphy',set value(v){calligraphy=v;}},calligraphyJob,900);
      form.onsubmit = async ev => {
        ev.preventDefault(); if (busy) return;
        // Both tabs belong to one form; reveal an invalid hidden field before focus.
        const invalid = [...form.querySelectorAll('[name]')].find(el => !el.checkValidity());
        if (invalid) { selectTab(invalid.closest('[data-panel]').dataset.panel); invalid.reportValidity(); return; }
        const settings = {...s, ...Object.fromEntries(new FormData(form)), logo, calligraphy};
        for (const field of MM.settings.printSizes) settings[field.key] = Number(settings[field.key]);
        setBusy(true); status(root, 'সংরক্ষণ হচ্ছে…');
        try {
          const saved = await MM.tauri.invoke('settings_save', {settings});
          Object.assign(s, saved); MM.settings.set(saved); dirty = false;
          if (saved.language) window.setLanguage(saved.language);
          status(root, 'সেটিংস সংরক্ষণ হয়েছে');
        } catch (err) { status(root, String(err), true); }
        finally { if (run === generation) setBusy(false); }
      };
      form.noValidate = true;
      const langSel = root.querySelector('#settingsLang');
      if (langSel) langSel.addEventListener('change', () => { if (langSel.value) window.setLanguage(langSel.value); });
      root.querySelector('#settingsCancel').onclick = async () => {
        if (dirty && !await MM.util.confirm(t('অসংরক্ষিত পরিবর্তন বাতিল করবেন?'))) return;
        dirty = false; render(root, {tab:root.querySelector('[aria-selected="true"]').dataset.tab});
      };
      async function refreshBackups() {
        const backups = await MM.tauri.invoke('backup_list');
        if (run !== generation || MM.router.current !== 'settings') return;
        root.querySelector('#settingsBackupList').innerHTML = MM.records.table(['ব্যাকআপ','কাজ'], backups.map(b =>
          MM.records.cells([e(b.name), '<button type="button" class="btn btn-ghost" data-restore="' + e(b.name) + '">' + icon('refresh') + 'ফেরত আনুন</button>']))) ;
        root.querySelectorAll('[data-restore]').forEach(b => b.onclick = async () => {
          if (busy) return;
          if (!await MM.util.confirm(t('এই ব্যাকআপের সব তথ্য ফিরিয়ে আনবেন? বর্তমান তথ্যের নিরাপদ কপি রাখা হবে এবং অ্যাপ আবার খুলবে।'))) return;
          if (dirty && !await MM.util.confirm(t('অসংরক্ষিত পরিবর্তন বাতিল করবেন?'))) return;
          setBusy(true); status(root, 'ব্যাকআপ ফেরানো হচ্ছে…');
          try { await MM.tauri.invoke('settings_restore', {name:b.dataset.restore}); }
          catch (err) { setBusy(false); status(root,String(err),true); }
        });
        MM.i18n.apply(MM.i18n.lang);
      }
      root.querySelector('#settingsBackup').onclick = async () => {
        setBusy(true); status(root,'ব্যাকআপ তৈরি হচ্ছে…');
        try { await MM.tauri.invoke('backup_create'); await refreshBackups(); status(root,'ব্যাকআপ তৈরি হয়েছে'); }
        catch (err) { status(root,String(err),true); }
        finally { if (run === generation) setBusy(false); }
      };
      root.querySelector('#settingsBackupRefresh').onclick = () => refreshBackups().catch(err => status(root,String(err),true));
      root.querySelector('#settingsBackupFolder').onclick = () => MM.tauri.invoke('open_data_folder',{backups:true}).catch(err => status(root,String(err),true));
      root.querySelector('#settingsDataFolder').onclick = () => MM.tauri.invoke('open_data_folder',{backups:false}).catch(err => status(root,String(err),true));
      root.querySelector('#settingsHelp').onclick = () => MM.router.go('help');
      root.querySelector('#settingsLicenseManage').onclick = () => MM.license.open();
      updatePrintPreview();
      selectTab(isBackupPage ? 'backup' : (['institution','general','about'].includes(params.tab) ? params.tab : 'institution'));
      MM.i18n.apply(MM.i18n.lang);
      await refreshBackups();
    } catch (err) {
      if (run === generation) root.innerHTML = '<div class="settings-page"><h2>সেটিংস</h2><p role="alert">' + e(err) + '</p><button class="btn btn-primary" id="settingsRetry">রিফ্রেশ</button></div>';
      root.querySelector('#settingsRetry')?.addEventListener('click', () => render(root,params));
    }
  }
  return { render, get dirty() { return dirty; }, get busy() { return busy; }, discard() { dirty = false; } };
})();
