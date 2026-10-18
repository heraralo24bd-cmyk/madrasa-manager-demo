window.MM = window.MM || {};
MM.printing = (() => {
  const e = MM.util.esc, t = text => MM.i18n.t(text);
  const papers = {A4:[210,297], A5:[148,210], Letter:[215.9,279.4], Legal:[215.9,355.6]};
  function fitPreview(viewport, page, size = {width:210,height:297}) {
    const update = (next = size) => {
      size = next;
      page.style.width = size.width + 'mm';
      page.style.minHeight = size.height + 'mm';
      const css = getComputedStyle(viewport);
      const available = viewport.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
      // CSS zoom uniformly scales a physically sized page and its layout box.
      // Text and images therefore retain their proportions on smaller screens.
      page.style.zoom = String(Math.min(1, Math.max(.1, available / (size.width * 96 / 25.4))));
    };
    const resize = new ResizeObserver(() => update());resize.observe(viewport);
    const detached = new MutationObserver(() => {
      if (!viewport.isConnected) {resize.disconnect();detached.disconnect();}
    });detached.observe(document.body,{childList:true});
    update();
    return {update,disconnect:() => {resize.disconnect();detached.disconnect();}};
  }
  function configuration(paperSize, landscape, scalePercent) {
    if (!Object.hasOwn(papers, paperSize)) throw Error(t('কাগজের মাপ সঠিক নয়'));
    if (!Number.isFinite(scalePercent) || scalePercent < 50 || scalePercent > 150) throw Error(t('মুদ্রণের মাপ ৫০% থেকে ১৫০% এর মধ্যে দিন'));
    const [width,height] = papers[paperSize];
    return {paperSize, landscape, scalePercent, width:landscape ? height : width, height:landscape ? width : height};
  }
  function printStyle(config) {
    // A per-job named page overrides the legacy A4 style for every report type.
    // The native settings use the same physical dimensions, rather than merely
    // shrinking a preview while leaving the exported page at A4.
    const style = document.createElement('style');
    const nonce = document.querySelector('style[nonce]')?.nonce;
    if (nonce) style.nonce = nonce;
    style.dataset.mmPrintPage = '';
    style.textContent = '@media print { @page { size:' + config.width + 'mm ' + config.height + 'mm; margin:10mm; } @page mm-selected { size:' + config.width + 'mm ' + config.height + 'mm; margin:10mm; } body.r-printing {display:block!important;} body.r-printing > .r-print-only { page:mm-selected!important; width:' + (config.width-20) + 'mm!important; max-width:none!important; margin:0!important; } }';
    // App stylesheets live at the end of body; job rules must follow them.
    document.body.append(style);
    return style;
  }
  function sheetPage(content, config, count) {
    const page = document.createElement('section');
    page.className = 'mm-print-sheet-page';
    page.style.width = config.width + 'mm'; page.style.height = config.height + 'mm';
    const inner = document.createElement('div');
    inner.className = 'mm-print-page-content';
    inner.style.height = (config.height - 20 - .2) + 'mm';
    inner.style.gridTemplateRows = 'repeat(' + (config.landscape ? 1 : count) + ',minmax(0,1fr))';
    inner.style.gridTemplateColumns = 'repeat(' + (config.landscape ? count : 1) + ',minmax(0,1fr))';
    content.forEach(sheet => {
      const slot = document.createElement('div'); slot.className = 'mm-print-slot';
      const scale = document.createElement('div'); scale.className = 'mm-marksheet-scale';
      scale.append(sheet.cloneNode(true)); slot.append(scale); inner.append(slot);
    });
    page.append(inner); return page;
  }
  async function fitSheets(pages) {
    MM.settings.applyHeaderSizes?.(pages);
    await document.fonts.ready;
    await Promise.all([...pages.querySelectorAll('img')].map(img => img.decode()));
    for (const slot of pages.querySelectorAll('.mm-print-slot')) {
      const holder = slot.firstElementChild, sheet = holder.firstElementChild;
      holder.style.zoom = '1'; holder.style.transform = ''; holder.style.width = Math.max(slot.clientWidth, 190 * 96 / 25.4) + 'px'; holder.style.height = 'auto';
      const width = sheet.offsetWidth, height = Math.max(sheet.offsetHeight, sheet.scrollHeight);
      let scale = Math.min(1, (slot.clientWidth - 3) / width, (slot.clientHeight - 4) / height);
      holder.style.width = width + 'px'; holder.style.height = 'auto';
      holder.style.zoom = String(scale);
      // WebView rounds font metrics at each zoom level, so long names can wrap
      // differently after fitting. Check the actual painted card before use.
      for (let attempt = 0; attempt < 6; attempt++) {
        const card = sheet.getBoundingClientRect(), bounds = slot.getBoundingClientRect();
        const correction = Math.min(1, (bounds.width - 2) / card.width, (bounds.height - 3) / card.height);
        if (correction >= .9999) break;
        scale *= correction; holder.style.zoom = String(scale);
      }
      holder.dataset.fitScale = String(scale);
      holder.style.left = 'auto';
    }
  }
  function open(title, content, {letterhead = true, landscape = false, marksheet = false, paperSize = 'A4', scalePercent = 100} = {}) {
    configuration(paperSize, landscape, scalePercent);
    const paper = (letterhead ? MM.settings.headerHTML() + '<h3>' + e(title) + '</h3>' : '') + content + (letterhead ? MM.settings.footerHTML() : '');
    const source = document.createElement('div'); source.innerHTML = paper;
    const sheets = marksheet ? [...source.querySelectorAll('[data-marksheet]')] : [];
    const pagedSheets = sheets.length > 0;
    const form = MM.records.modal('প্রিন্ট', '<p class="mm-print-preview-note" data-preview-note role="status"></p><div class="mm-print-viewport"><article class="mm-print-paper" translate="no">' + paper + '</article></div>' +
      '<div class="mm-print-controls"><label>' + t('প্রিন্টার') + '<select data-printer></select></label>' +
      '<label>' + t('কপি') + '<input data-copies type="number" min="1" max="99" value="1"></label>' +
      '<div class="mm-print-layout" role="group" aria-label="' + t('পাতার দিক') + '"><button type="button" data-layout="portrait">' + t('লম্বালম্বি') + '</button><button type="button" data-layout="landscape">' + t('আড়াআড়ি') + '</button></div>' +
      '<label>' + t('পৃষ্ঠা') + '<input data-pages placeholder="' + t('সব পৃষ্ঠা') + '" maxlength="200"></label>' +
      '<label>' + t('কাগজের মাপ') + '<select data-paper-size>' + Object.keys(papers).map(size => '<option value="' + size + '"' + (size === paperSize ? ' selected' : '') + '>' + size + ' (' + papers[size].join(' × ') + ' mm)</option>').join('') + '</select></label>' +
      (pagedSheets ? '<label>' + t('প্রতি পৃষ্ঠায় মার্কশিট') + '<select data-marksheets-per-page><option value="1">' + t('১টি — আলাদা পৃষ্ঠা') + '</option><option value="2">' + t('২টি — একই পৃষ্ঠায়') + '</option></select></label>' : '') +
      '<label>' + t('মুদ্রণের মাপ') + '<select data-scale><option value="fit">' + t('স্বাভাবিক (১০০%)') + '</option><option value="custom">' + t('নিজের মাপ') + '</option></select></label>' +
      '<label class="mm-print-custom-scale" hidden>' + t('শতকরা') + '<input data-scale-percent type="number" min="50" max="150" step="1" value="' + scalePercent + '"></label>' +
      '<button type="button" class="btn btn-ghost" data-pdf>' + MM.records.icon('file') + t('পিডিএফ সংরক্ষণ') + '</button></div>', async () => {}, 'প্রিন্ট');
    form.classList.add('mm-print-dialog');
    form.classList.toggle('mm-print-marksheets', pagedSheets);
    const controls = form.querySelector('.mm-print-controls'), status = form.querySelector('.r-status');
    controls.append(form.querySelector('.r-actions'), status);
    const submit = form.querySelector('#rSave'), cancel = form.querySelector('#rCancel'), pdf = form.querySelector('[data-pdf]');
    submit.type = 'button'; submit.innerHTML = MM.records.icon('print') + t('প্রিন্ট'); submit.disabled = true;
    form.querySelector('h3').textContent = t('প্রিন্ট') + ' · ' + title;
    const viewport = form.querySelector('.mm-print-viewport'), preview = form.querySelector('.mm-print-paper');
    MM.settings.applyHeaderSizes?.(preview);
    if (pagedSheets) { preview.className = 'mm-print-pages'; preview.innerHTML = ''; }
    const paperSelect = form.querySelector('[data-paper-size]'), scaleSelect = form.querySelector('[data-scale]'), scaleInput = form.querySelector('[data-scale-percent]');
    scaleSelect.value = scalePercent === 100 ? 'fit' : 'custom';
    const fit = fitPreview(viewport, preview);
    let paginationTicket = 0, paginationReady = !pagedSheets, printersReady = false;
    const updatePrintButtons = () => { submit.disabled = !printersReady || !paginationReady; pdf.disabled = !paginationReady; };
    const previewNote = () => {
      const config = configuration(paperSelect.value, landscape, 100);
      const percent = scaleSelect.value === 'fit' ? 100 : Number(scaleInput.value);
      const perPage = pagedSheets ? Number(form.querySelector('[data-marksheets-per-page]').value) : 1;
      const pageCount = pagedSheets ? Math.ceil(sheets.length / perPage) : 0;
      const note = form.querySelector('[data-preview-note]');
      note.dataset.printPageCount = String(pageCount);
      note.textContent = paperSelect.value + ' · ' + config.width + ' × ' + config.height + ' mm · ' + t(landscape ? 'আড়াআড়ি' : 'লম্বালম্বি') + ' · ' + t('মুদ্রণের মাপ') + ': ' + percent + '%' + (pagedSheets ? ' · ' + t('মার্কশিট') + ': ' + MM.util.bnNum(sheets.length) + ' · ' + t('পৃষ্ঠা') + ': ' + MM.util.bnNum(pageCount) : '');
    };
    const previewSize = async () => {
      const config = configuration(paperSelect.value, landscape, 100);
      preview.dataset.paperSize = paperSelect.value;
      fit.update(config);
      previewNote();
      if (!pagedSheets) return;
      const ticket = ++paginationTicket;
      paginationReady = false; form.dataset.paginationReady = 'false'; updatePrintButtons();
      const perPage = Number(form.querySelector('[data-marksheets-per-page]').value);
      preview.replaceChildren();
      for (let i = 0; i < sheets.length; i += perPage) {
        const page = sheetPage(sheets.slice(i, i + perPage), config, perPage);
        page.setAttribute('aria-label', t('পৃষ্ঠা') + ' ' + MM.util.bnNum(i / perPage + 1));
        preview.append(page);
      }
      try {
        await fitSheets(preview);
        if (ticket !== paginationTicket || !form.isConnected) return;
        paginationReady = true; form.dataset.paginationReady = 'true'; updatePrintButtons();
      } catch (error) {
        if (ticket === paginationTicket && form.isConnected) { status.className = 'r-status bad'; status.textContent = String(error); }
      }
    };
    const portrait = () => {
      form.classList.toggle('is-landscape', landscape);
      form.querySelectorAll('[data-layout]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.layout === 'landscape') === landscape)));
      previewSize();
    };
    portrait();
    form.querySelectorAll('[data-layout]').forEach(b => b.onclick = () => {landscape = b.dataset.layout === 'landscape';portrait();});
    paperSelect.onchange = previewSize;
    if (pagedSheets) form.querySelector('[data-marksheets-per-page]').onchange = () => {landscape = form.querySelector('[data-marksheets-per-page]').value === '2'; portrait();};
    const setScale = () => {
      const custom = scaleSelect.value === 'custom';
      form.querySelector('.mm-print-custom-scale').hidden = !custom;
      scaleInput.disabled = !custom;
      previewNote();
    };
    scaleSelect.onchange = setScale;setScale();
    scaleInput.oninput = previewNote;
    MM.tauri.invoke('print_printers').then(printers => {
      if (!form.isConnected) return;
      const select = form.querySelector('[data-printer]');
      select.innerHTML = printers.length ? printers.map(p => '<option value="' + e(p.name) + '"' + (p.default ? ' selected' : '') + '>' + e(p.name) + '</option>').join('') : '<option value="">' + t('প্রিন্টার নেই') + '</option>';
      printersReady = !!printers.length; updatePrintButtons();
    }).catch(err => { if (form.isConnected) {status.textContent = String(err);status.classList.add('bad');} });
    async function send(asPDF) {
      if (form.dataset.busy === 'true' || !paginationReady || !form.reportValidity()) return;
      if (document.querySelector('.r-print-only')) {status.textContent = t('অপেক্ষা করুন…');return;}
      const copies = Number(form.querySelector('[data-copies]').value);
      let config;
      try {config = configuration(paperSelect.value, landscape, scaleSelect.value === 'fit' ? 100 : Number(scaleInput.value));}
      catch (error) {status.className = 'r-status bad';status.textContent = String(error);return;}
      const options = {printer: form.querySelector('[data-printer]').value, copies: asPDF ? 1 : copies, landscape, pages: asPDF ? '' : form.querySelector('[data-pages]').value.trim(), pdf: asPDF, paper_size:config.paperSize, scale_percent:config.scalePercent};
      const section = document.createElement('section');
      section.className = 'r-print-only' + (marksheet ? ' q-print-only' : '') + (landscape ? ' is-landscape' : '') + (pagedSheets ? ' mm-print-pages' : '');
      if (pagedSheets) section.replaceChildren(...[...preview.children].map(node => node.cloneNode(true)));
      else section.innerHTML = paper;
      document.body.append(section);
      MM.settings.applyHeaderSizes?.(section);
      const style = printStyle(config);
      if (pagedSheets) style.textContent += '@media print { .r-print-only.mm-print-pages {display:block!important;} .r-print-only .mm-print-sheet-page {width:' + (config.width-20) + 'mm!important;height:' + (config.height-20-.2) + 'mm!important;padding:0!important;margin:0!important;box-shadow:none!important;break-after:page;break-inside:avoid;} .r-print-only .mm-print-sheet-page:last-child {break-after:auto;} }';
      form.dataset.busy = 'true';
      const disabled = [...form.querySelectorAll('button,input,select')].map(el => [el, el.disabled]);
      disabled.forEach(([el]) => el.disabled = true);
      status.className = 'r-status';status.textContent = t('অপেক্ষা করুন…');
      try {
        await document.fonts.ready;
        await Promise.all([...section.querySelectorAll('img')].map(img => img.decode()));
        document.body.classList.add('r-printing');
        const path = await MM.tauri.invoke('print_document', {options});
        status.textContent = path ? t('পিডিএফ সংরক্ষিত হয়েছে') + ': ' + path : t('প্রিন্ট পাঠানো হয়েছে');
      } catch (err) {status.classList.add('bad');status.textContent = String(err);}
      finally {
        document.body.classList.remove('r-printing');section.remove();style.remove();
        form.dataset.busy = 'false';disabled.forEach(([el,value]) => el.disabled = value);
      }
    }
    submit.onclick = () => send(false);pdf.onclick = () => send(true);
    form.onsubmit = ev => {ev.preventDefault();send(false);};
    cancel.focus();
    return form;
  }
  let exporting=false;
  async function savePDF(title,content,{landscape=false,paperSize='A4',scalePercent=100}={}) {
    if(exporting || document.querySelector('.r-print-only'))throw Error(t('অপেক্ষা করুন…'));
    const config=configuration(paperSize,landscape,scalePercent);
    exporting=true;
    const section=document.createElement('section');
    section.className='r-print-only'+(landscape?' is-landscape':'');
    section.innerHTML=MM.settings.headerHTML()+'<h3>'+e(title)+'</h3>'+content+MM.settings.footerHTML();
    document.body.append(section);
    MM.settings.applyHeaderSizes?.(section);
    const style=printStyle(config);
    try {
      await document.fonts.ready;
      await Promise.all([...section.querySelectorAll('img')].map(img=>img.decode()));
      document.body.classList.add('r-printing');
      return await MM.tauri.invoke('print_document',{options:{printer:'',copies:1,landscape,pages:'',pdf:true,paper_size:config.paperSize,scale_percent:config.scalePercent}});
    } finally {document.body.classList.remove('r-printing');section.remove();style.remove();exporting=false;}
  }
  return {open,savePDF,fitPreview};
})();
