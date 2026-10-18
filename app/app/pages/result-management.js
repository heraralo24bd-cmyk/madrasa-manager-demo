window.MM = window.MM || {};
MM.resultManagement = (() => {
  const e = MM.util.esc, api = (action, payload) => MM.records.invoke(action, payload);
  const t = text => MM.i18n.t(text);
  const n = value => MM.i18n.lang === 'en' ? String(value ?? '-') : MM.util.bnNum(value ?? '-');
  const ascii = value => String(value ?? '').trim().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));
  const opts = (values, selected, empty) => (empty === undefined ? '' : '<option value="">' + e(empty) + '</option>') + values.map(v => '<option value="' + e(v) + '"' + (String(v) === String(selected) ? ' selected' : '') + '>' + e(v) + '</option>').join('');
  const button = (id, label, icon = 'file', primary = false) => MM.records.button(id, t(label), icon, primary);
  let active = null;

  async function render(root, params = {}) {
    const token = Symbol('result-management');
    root._resultManagementToken = token;
    const alive = () => root.isConnected && root._resultManagementToken === token;
    root.innerHTML = '<section class="records smart-results"><header class="sm-heading"><div class="sm-heading-title"><span class="sm-heading-icon">' + MM.records.icon('cap') + '</span><div><h2>Result Management</h2><p>' + t('দ্রুত নম্বর প্রদান · নির্ভুল ফলাফল · প্রস্তুত মার্কশিট') + '</p></div></div><div class="sm-heading-badges"><span class="sm-exam-state" data-exam-state>' + t('পরীক্ষা নির্বাচন করুন') + '</span><span class="sm-offline"><i aria-hidden="true"></i>' + t('সম্পূর্ণ অফলাইন') + '</span></div></header><div class="sm-body"></div></section>';
    const body = root.querySelector('.sm-body');
    const catalog = await api('result_catalog', {});
    if (!alive()) return;
    const preferred = catalog.exams.find(ex => Number(ex.id) === Number(params.examId)) || catalog.exams.find(ex => !params.class || ex.class === params.class);
    const years = [...new Set((catalog.years || []).map(ascii))];
    const initialYear = ascii(preferred?.academic_year) || (years.includes(ascii(MM.settings.value?.academic_year)) ? ascii(MM.settings.value.academic_year) : years[0] || '');
    let examInfo = null, current = null, sequence = 0, busy = false, printing = false;
    let chain = Promise.resolve(), rows = new Map(), scopeKey = '', filters = {year: initialYear, class: params.class || preferred?.class || catalog.classes[0] || '', id: Number(preferred?.id || 0), department: preferred?.department || ''};
    body.innerHTML = '<section class="sm-config" aria-label="' + t('পরীক্ষা নির্বাচন') + '"><div class="sm-filters">' +
      MM.records.select('smYear', t('শিক্ষাবর্ষ'), opts(years, filters.year, t('সকল শিক্ষাবর্ষ (পুরোনো পরীক্ষা)'))) +
      MM.records.select('smClass', t('শ্রেণি'), opts(catalog.classes, filters.class, t('শ্রেণি নির্বাচন করুন'))) +
      MM.records.select('smExam', t('পরীক্ষা'), '') +
      MM.records.select('smDepartment', t('বিভাগ'), opts(catalog.departments || [], filters.department, t('সকল বিভাগ'))) + '</div>' +
      '<div class="sm-tools"><div class="sm-exam-tools">' + button('smNewExam', 'নতুন পরীক্ষা', 'cap') + button('smRules', 'পরীক্ষার নিয়ম', 'list') + button('smPublish', 'ফলাফল প্রকাশ', 'cap') + '</div><div class="sm-save-tools">' + button('smRetry', 'অসংরক্ষিত নম্বর সংরক্ষণ', 'save') + button('smReload', 'নম্বর আবার আনুন', 'refresh') + '</div></div></section>' +
      '<div class="sm-progress" aria-live="polite"></div>' +
      '<div class="sm-workspace"><aside class="sm-sidebar"><form class="sm-search" autocomplete="off"><div class="sm-panel-title">' + MM.records.icon('search') + '<h3>' + t('শিক্ষার্থী খুঁজুন') + '</h3><kbd>Enter</kbd></div><label for="smQuery">' + t('ফরম নম্বর অথবা রোল নম্বর') + '</label><div class="sm-search-line"><select id="smMode" aria-label="' + t('খোঁজার ধরন') + '"><option value="auto">' + t('ফরম / রোল') + '</option><option value="form">' + t('ফরম নম্বর') + '</option><option value="roll">' + t('রোল নম্বর') + '</option></select><input id="smQuery" type="search" inputmode="numeric" maxlength="100" placeholder="' + t('নম্বর লিখুন') + '" aria-describedby="smHint"><button id="smFind" class="btn btn-primary" type="submit">' + MM.records.icon('search') + t('খুঁজুন') + '</button></div><p id="smHint">' + t('নির্বাচিত পরীক্ষা ও শ্রেণির সঠিক শিক্ষার্থী খুঁজুন।') + '</p></form>' +
      '<div class="sm-status" role="status" aria-live="polite"></div><div class="sm-candidates"></div><section class="sm-summary-panel"><div class="sm-panel-title">' + MM.records.icon('grid') + '<h3>' + t('শিক্ষার্থীর ফলাফল') + '</h3></div><div class="sm-result-summary" data-result-summary><p class="sm-summary-empty">' + t('শিক্ষার্থী নির্বাচন করলে ফলাফলের সারসংক্ষেপ দেখা যাবে।') + '</p></div></section>' +
      '<section class="sm-reports-panel"><div class="sm-panel-title">' + MM.records.icon('print') + '<h3>' + t('ফলাফল ও প্রিন্ট') + '</h3></div><div class="sm-reports">' + button('smAllResults', 'সকল ফলাফল', 'list') + button('smPrintResults', 'ফলাফল প্রিন্ট', 'print') + button('smTabulation', 'ট্যাবুলেশন শিট', 'print') + button('smMarksheet', 'এই শিক্ষার্থীর মার্কশিট', 'file') + button('smAllMarksheets', 'সকল মার্কশিট', 'print') + '</div></section></aside><main class="sm-student" aria-label="' + t('শিক্ষার্থীর নম্বর') + '"></main></div>';
    const $ = id => body.querySelector('#' + id), message = body.querySelector('.sm-status');
    const scope = () => ({id: Number(filters.id), year: filters.year, class: filters.class, department: filters.department});
    const identify = () => JSON.stringify(scope());
    function status(text, bad = false) { if (alive()) { message.className = 'sm-status' + (bad ? ' bad' : ''); message.textContent = t(text); } }
    function controls() {
      if (!alive()) return;
      const saving = [...rows.values()].some(r => r.busy);
      body.querySelectorAll('.sm-filters select').forEach(el => el.disabled = busy || saving || printing);
      if (examInfo?.exam.department) $('smDepartment').disabled = true;
      $('smNewExam').disabled = busy || saving || printing;
      $('smFind').disabled = busy || !examInfo;
      $('smQuery').disabled = busy || !examInfo;
      $('smMode').disabled = busy || !examInfo;
      ['smRules','smPublish','smAllResults','smPrintResults','smTabulation','smAllMarksheets'].forEach(id => $(id).disabled = busy || saving || printing || !examInfo);
      $('smMarksheet').disabled = busy || saving || printing || !current;
      $('smRetry').disabled = busy || saving || ![...rows.values()].some(r => r.saved !== r.key);
      $('smReload').disabled = busy || saving || printing || !current;
      $('smPublish').innerHTML = MM.records.icon('cap') + t(examInfo?.exam.published ? 'প্রকাশ বন্ধ করুন' : 'ফলাফল প্রকাশ');
      $('smPublish').classList.toggle('sm-published-action',!!examInfo?.exam.published);
      const examState = root.querySelector('[data-exam-state]');
      examState.textContent = t(examInfo ? examInfo.exam.published ? 'প্রকাশিত ফলাফল' : 'নম্বর প্রদান চলছে' : 'পরীক্ষা নির্বাচন করুন');
      examState.dataset.published = String(!!examInfo?.exam.published);
      const edit = $('smEditStudent');
      if (edit) edit.disabled = busy || saving || printing || !current;
      body.querySelector('.sm-student').setAttribute('aria-busy', String(busy));
    }
    function progress(data) {
      if (!alive()) return;
      const p = data?.progress || {};
      const percent = p.total ? Math.max(0,Math.min(100,Math.round((p.completed || 0) / p.total * 100))) : 0;
      body.querySelector('.sm-progress').innerHTML = [['মোট পরীক্ষার্থী',p.total || 0,'users'],['সম্পূর্ণ',p.completed || 0,'calendar'],['বাকি',p.pending || 0,'clock'],['সংরক্ষিত বিষয়',p.saved_marks || 0,'save']].map(([label,value,icon]) => '<div class="sm-metric"><span class="sm-metric-icon">' + MM.records.icon(icon) + '</span><span>' + t(label) + '</span><strong>' + n(value) + '</strong></div>').join('') + '<section class="sm-progress-meter" aria-label="' + t('নম্বর প্রদান সম্পন্ন') + '"><span>' + n(percent) + '%</span><div role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + percent + '" aria-label="' + t('নম্বর প্রদান সম্পন্ন') + '"><i style="width:' + percent + '%"></i></div></section>';
    }
    function examOptions(chosen = 0) {
      const available = catalog.exams.filter(ex => (!filters.class || ex.class === filters.class) && (!ex.academic_year || ascii(ex.academic_year) === filters.year));
      if (!available.some(ex => Number(ex.id) === Number(chosen))) chosen = available[0]?.id || 0;
      filters.id = Number(chosen);
      $('smExam').innerHTML = '<option value="">' + t('পরীক্ষা নির্বাচন করুন') + '</option>' + available.map(ex => '<option value="' + e(ex.id) + '"' + (Number(ex.id) === filters.id ? ' selected' : '') + '>' + e(ex.name) + (ex.published ? ' · ' + t('প্রকাশিত') : '') + '</option>').join('');
    }
    function setDepartments(values = []) {
      const configured = examInfo?.exam.department || '';
      const all = [...new Set([...(catalog.departments || []), ...values, filters.department, configured].filter(Boolean))];
      if (configured) filters.department = configured;
      $('smDepartment').innerHTML = configured ? opts([configured], configured) : opts(all, filters.department, t('সকল বিভাগ'));
    }
    function resetStudent(text = 'নম্বর লিখে শিক্ষার্থী খুঁজুন') {
      rows.forEach(row => clearTimeout(row.timer)); rows = new Map(); current = null;
      body.querySelector('.sm-candidates').innerHTML = '';
      body.querySelector('.sm-student').innerHTML = '<div class="sm-empty"><span class="sm-empty-icon">' + MM.records.icon('cap') + '</span><h3>' + t(text) + '</h3><p>' + t('শিক্ষার্থীর বিষয়ভিত্তিক নম্বর, গ্রেড ও ফলাফল এখানে দেখা যাবে।') + '</p><div class="sm-empty-steps"><span><b>1</b>' + t('পরীক্ষা নির্বাচন') + '</span><span><b>2</b>' + t('শিক্ষার্থী খুঁজুন') + '</span><span><b>3</b>' + t('নম্বর দিন ও সংরক্ষণ করুন') + '</span></div></div>';
      body.querySelector('[data-result-summary]').innerHTML = '<p class="sm-summary-empty">' + t('শিক্ষার্থী নির্বাচন করলে ফলাফলের সারসংক্ষেপ দেখা যাবে।') + '</p>';
      controls();
    }
    async function loadExam() {
      const ticket = ++sequence; busy = true; examInfo = null; resetStudent(); controls();
      try {
        if (!filters.id || !filters.class) { progress(null); status('প্রথমে শ্রেণি ও পরীক্ষা নির্বাচন করুন'); return; }
        const configured = catalog.exams.find(ex => Number(ex.id) === filters.id);
        if (configured?.department) filters.department = configured.department;
        const data = await api('result_progress', scope());
        if (!alive() || ticket !== sequence) return;
        examInfo = data; scopeKey = identify(); setDepartments(data.departments); progress(data);
        status(data.exam.published ? 'প্রকাশিত ফলাফল। শিক্ষার্থী খুঁজে “নম্বর সম্পাদনা” চাপলে সংশোধন করতে পারবেন।' : 'প্রস্তুত। ফরম বা রোল নম্বর লিখে Enter চাপুন।');
      } catch (error) { if (alive() && ticket === sequence) { status(String(error),true); progress(null); } }
      finally { if (alive() && ticket === sequence) { busy = false; controls(); } }
    }
    function parse(input) {
      const raw = ascii(input.value);
      if (!raw) return null;
      if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) throw Error(t('নম্বর সঠিকভাবে লিখুন (সর্বোচ্চ দুই দশমিক ঘর)।'));
      const value = Number(raw), max = Number(input.dataset.max);
      if (!Number.isFinite(value) || value < 0 || value > max) throw Error(t('নম্বর হতে হবে ০ থেকে') + ' ' + n(max));
      return value;
    }
    function draft(row) {
      const absent = row.element.querySelector('[data-absent]').checked;
      if (absent) return {marks:null, absent:true, written:null, practical:null};
      if (row.split) return {marks:null, absent:false, written:parse(row.element.querySelector('[data-written]')), practical:parse(row.element.querySelector('[data-practical]'))};
      return {marks:parse(row.element.querySelector('[data-score]')), absent:false, written:null, practical:null};
    }
    const key = value => JSON.stringify(value);
    function paintRow(row, state, text) {
      if (!row.element.isConnected) return;
      row.element.dataset.state = state;
      row.element.querySelector('[data-save-status]').textContent = t(text);
      row.element.querySelector('[data-retry]').hidden = state !== 'error';
    }
    function read(row) {
      try { row.value = draft(row); row.key = key(row.value); row.error = ''; paintRow(row,row.key === row.saved && row.complete ? 'saved' : 'pending',row.key === row.saved ? row.complete ? 'সংরক্ষিত' : 'বাকি' : 'অসংরক্ষিত'); }
      catch (error) { row.error = String(error); paintRow(row,'error',String(error)); }
      controls(); return !row.error;
    }
    function paintTotals(data) {
      const result = data?.result;
      const box = body.querySelector('[data-result-summary]');
      if (!box || !result) return;
      box.dataset.complete = String(!!result.complete);
      box.innerHTML = [['মোট', n(result.total) + ' / ' + n(result.full)],['গড়', result.complete ? n(Number(result.average || 0).toFixed(2)) : '-'],['গ্রেড',e(MM.i18n.lang === 'en' ? result.grade_en : result.grade)],['GPA',result.gpa === null || result.gpa === undefined ? t(result.gpa_configured ? 'অসম্পূর্ণ' : 'নিয়ম নির্ধারিত নয়') : n(Number(result.gpa).toFixed(2))],['ফলাফল',result.passed === null || result.passed === undefined ? t('অসম্পূর্ণ') : t(result.passed ? 'পাস' : 'ফেল')]].map(([label,value]) => '<div><span>' + t(label) + '</span><b>' + value + '</b></div>').join('');
      progress(data);
    }
    function nextInput(origin) {
      if (!alive() || !current) return;
      const inputs = [...body.querySelectorAll('.sm-marks input[data-mark-input]')].filter(input => !input.disabled);
      const index = inputs.indexOf(origin), ordered = [...inputs.slice(index + 1),...inputs.slice(0,index + 1)];
      const next = ordered.find(input => input.value === '');
      if (next) { next.focus({preventScroll:true}); next.scrollIntoView({block:'nearest',behavior:'instant'}); }
      else { $('smQuery').focus({preventScroll:true}); $('smQuery').select(); status([...rows.values()].every(row=>row.key===row.saved && row.complete) ? 'এই শিক্ষার্থীর নম্বর সংরক্ষিত হয়েছে। পরবর্তী ফরম বা রোল নম্বর লিখুন।' : 'অন্য নম্বরগুলো সংরক্ষণ হচ্ছে। পরবর্তী ফরম বা রোল নম্বর লিখলে আগে সংরক্ষণ সম্পূর্ণ হবে।'); }
    }
    async function persist(row, origin = null, advance = false) {
      clearTimeout(row.timer);
      if (!current || scopeKey !== identify() || !read(row)) { if (origin) origin.focus(); return false; }
      const studentId = Number(current.student.student_id), context = scope(), lookupTicket = sequence;
      if (row.key === row.saved) { if (advance) nextInput(origin); return true; }
      const request = {...row.value}, sentKey = row.key;
      row.busy = true; paintRow(row,'saving','সংরক্ষণ হচ্ছে…'); controls();
      const job = chain.then(async () => {
        // Another input event may have queued this identical snapshot while the
        // first save was awaiting SQLite. Never send it twice or move focus twice.
        if (row.saved === sentKey) return true;
        try {
          const result = await api('result_mark_save', {...context,student_id:studentId,subject_id:row.subject.id,revision:examInfo.exam.revision,...request});
          if (!alive() || lookupTicket !== sequence) return true;
          examInfo.exam = result.exam; current = {...current,...result}; row.saved = sentKey;
          row.complete = !!result.result?.subject_results?.find(sr => Number(sr.subject_id) === Number(row.subject.id))?.recorded;
          read(row); paintTotals(result); row.error = '';
          if (row.key === sentKey) {
            paintRow(row,'saved',row.complete ? 'সংরক্ষিত ✓' : 'অংশ সংরক্ষিত — বাকি নম্বর দিন');
            status('নম্বর স্থায়ীভাবে সংরক্ষিত হয়েছে।');
            if (advance) nextInput(origin);
          } else { paintRow(row,'pending','অসংরক্ষিত'); row.timer = setTimeout(() => persist(row).catch(() => {}),400); }
          return true;
        } catch (error) {
          if (alive() && lookupTicket === sequence) { row.error = String(error); paintRow(row,'error','সংরক্ষণ হয়নি: ' + String(error)); status('নম্বর সংরক্ষণ হয়নি: ' + String(error),true); if (advance && origin?.isConnected) origin.focus(); }
          return false;
        } finally { row.busy = false; controls(); }
      });
      chain = job.then(() => {}); return job;
    }
    async function flush() {
      if (!alive()) return true;
      rows.forEach(row => clearTimeout(row.timer));
      await chain;
      for (const row of rows.values()) {
        if (!read(row)) { row.element.querySelector('[data-mark-input]:not(:disabled)')?.focus(); status(row.error,true); return false; }
        if (row.key !== row.saved && !(await persist(row))) return false;
      }
      return true;
    }
    function paintStudent(data) {
      if (!alive()) return;
      current = data; examInfo.exam = data.exam; rows = new Map(); scopeKey = identify();
      const student = data.student;
      body.querySelector('.sm-candidates').innerHTML = '';
      const description = [['ফরম',student.form_no],['রোল',student.roll],['শ্রেণি',student.class],['শিক্ষাবর্ষ',student.year],['বিভাগ',student.department || '—']];
      body.querySelector('.sm-student').innerHTML = '<section class="sm-identity"><div class="sm-identity-top"><div class="sm-student-name"><span class="sm-avatar">' + MM.records.icon('admin') + '</span><div><h3 translate="no">' + e(student.name) + '</h3><p>' + e(student.sid) + (student.year_source === 'exam_date' ? ' · ' + t('পুরোনো রেকর্ড: পরীক্ষার তারিখ থেকে শিক্ষাবর্ষ') : '') + '</p></div></div><div class="sm-edit-actions"><span class="sm-student-state" data-student-publish-state="' + (data.exam.published ? 'published' : 'draft') + '">' + t(data.exam.published ? 'প্রকাশিত · সম্পাদনা লক' : 'সম্পাদনার জন্য প্রস্তুত') + '</span><button type="button" id="smEditStudent" data-student-edit class="btn btn-primary">' + MM.records.icon('file') + t('নম্বর সম্পাদনা') + '</button></div></div><dl>' + description.map(([label,value]) => '<div><dt>' + t(label) + '</dt><dd translate="no">' + e(value || '—') + '</dd></div>').join('') + '</dl></section><section class="sm-mark-workbench"><div class="sm-workbench-title"><h3>' + t('বিষয়ভিত্তিক নম্বর') + '</h3><span>' + n(data.subjects?.length || 0) + ' ' + t('বিষয়') + ' · ' + t('স্বয়ংক্রিয় সংরক্ষণ') + '</span></div><div class="sm-mark-columns" aria-hidden="true"><span>' + t('বিষয় ও পূর্ণ নম্বর') + '</span><span>' + t('প্রাপ্ত নম্বর') + '</span><span>' + t('উপস্থিতি') + '</span><span>' + t('সংরক্ষণের অবস্থা') + '</span></div><div class="sm-marks">' + (data.subjects || []).map((subject,index) => {
        const stored = data.marks.find(mark => Number(mark.subject_id) === Number(subject.id));
        const absent = !!stored?.absent, split = Number(subject.practical_full || 0) > 0;
        const input = (kind, value, max, label) => '<label class="' + (split ? 'sm-split-field' : 'sm-single-field') + '"><span class="sm-field-label">' + t(label) + ' <small>/ ' + n(max) + '</small></span><input type="text" inputmode="decimal" autocomplete="off" data-mark-input data-' + kind + ' data-max="' + max + '" value="' + e(value ?? '') + '" aria-label="' + e(subject.name + ' ' + t(label) + ' / ' + n(max)) + '"' + (data.exam.published || absent ? ' disabled' : '') + '></label>';
        return '<div class="sm-mark-row" data-subject="' + subject.id + '"><div class="sm-subject"><span>' + n(index + 1) + '</span><div><strong translate="no">' + e(subject.name) + '</strong><small>' + t('পূর্ণ') + ' ' + n(subject.full) + ' · ' + t('পাস') + ' ' + n(subject.pass) + '</small></div></div><div class="sm-mark-fields">' + (split ? input('written',stored?.written,subject.written_full,'লিখিত') + input('practical',stored?.practical,subject.practical_full,'ব্যবহারিক') : input('score',stored?.marks,subject.full,'নম্বর')) + '</div><label class="sm-absent"><input type="checkbox" data-absent' + (absent ? ' checked' : '') + (data.exam.published ? ' disabled' : '') + '><span>' + t('অনুপস্থিত') + '</span></label><div class="sm-save"><span data-save-status role="status"></span><button type="button" data-retry hidden>' + t('আবার চেষ্টা') + '</button></div></div>';
      }).join('') + '</div><p class="sm-keyboard"><kbd>Enter</kbd>' + t('সংরক্ষণ ও পরবর্তী ফাঁকা ঘর') + '<span>' + t('লেখার পর স্বয়ংক্রিয় সংরক্ষণ') + '</span></p></section>';
      body.querySelectorAll('[data-subject]').forEach(element => {
        const subject = data.subjects.find(s => Number(s.id) === Number(element.dataset.subject));
        const complete = !!data.result?.subject_results?.find(sr => Number(sr.subject_id) === Number(subject.id))?.recorded;
        const row = {element,subject,split:Number(subject.practical_full || 0) > 0,complete,busy:false,error:'',timer:null};
        row.value = draft(row); row.key = key(row.value); row.saved = row.key; rows.set(Number(subject.id),row);
        paintRow(row,complete ? 'saved' : 'pending',complete ? 'সংরক্ষিত' : 'বাকি');
        element.querySelectorAll('[data-mark-input]').forEach(input => {
          input.oninput = () => { read(row); clearTimeout(row.timer); if (!row.error) row.timer = setTimeout(() => persist(row).catch(() => {}),650); };
          input.onblur = () => { if (!row.error && row.key !== row.saved) persist(row).catch(() => {}); };
          input.onkeydown = event => { if (event.key !== 'Enter') return; event.preventDefault(); if (input.value === '' && row.saved === row.key) { status('নম্বর লিখুন অথবা অনুপস্থিত নির্বাচন করুন।',true); return; } persist(row,input,true).catch(error => status(String(error),true)); };
        });
        element.querySelector('[data-absent]').onchange = () => {
          const absent = element.querySelector('[data-absent]').checked;
          element.querySelectorAll('[data-mark-input]').forEach(input => {input.disabled = absent || !!data.exam.published; if(absent) input.value = '';});
          read(row); persist(row).catch(() => {});
        };
        element.querySelector('[data-retry]').onclick = () => persist(row,element.querySelector('[data-mark-input]'),false).catch(() => {});
      });
      $('smEditStudent').onclick = () => editStudent().catch(error => status(String(error),true));
      paintTotals(data); controls();
      const first = [...body.querySelectorAll('[data-mark-input]')].find(input => !input.disabled && input.value === '');
      if (first && root.getAttribute('inert') === null && !root.classList.contains('mm-route-staging')) first.focus({preventScroll:true});
      else if (!first) { $('smQuery').focus({preventScroll:true}); $('smQuery').select(); }
    }
    function focusMark() {
      const input = body.querySelector('[data-mark-input]:not(:disabled)');
      if (!input) return;
      input.focus({preventScroll:true}); input.select();
      input.scrollIntoView({block:'nearest',behavior:'instant'});
    }
    async function changePublication(published, editSelected = false) {
      if (busy || printing || !examInfo || !(await flush())) return false;
      if (published && examInfo.progress.pending > 0) { status('সব শিক্ষার্থীর সব বিষয়ের নম্বর বা অনুপস্থিতি সংরক্ষণ করার পরে ফলাফল প্রকাশ করুন।',true); return false; }
      const context = scope(), expectedScope = identify(), studentId = Number(current?.student.student_id || 0), revision = examInfo.exam.revision;
      const prompt = published ? 'সংরক্ষিত ফলাফল প্রকাশ করবেন?' : editSelected ? 'নম্বর সংশোধনের জন্য এই পরীক্ষার ফলাফল প্রকাশ বন্ধ করতে হবে। সংরক্ষিত নম্বর থাকবে। সম্পাদনা শেষে আবার ফলাফল প্রকাশ করতে পারবেন। প্রকাশ বন্ধ করে এই শিক্ষার্থীর নম্বর সম্পাদনা করবেন?' : 'এই পরীক্ষার ফলাফল প্রকাশ বন্ধ করবেন? সংরক্ষিত নম্বর থাকবে এবং সম্পাদনা শেষে আবার প্রকাশ করতে পারবেন।';
      if (!(await MM.util.confirm(t(prompt))) || !alive() || busy || expectedScope !== identify()) return false;
      const ticket = ++sequence; busy = true; controls();
      try {
        await api('exam_publish',{id:context.id,published,revision});
        const fresh = await api('result_progress',context);
        if (!alive() || ticket !== sequence) return false;
        examInfo = fresh;
        const catalogExam = catalog.exams.find(ex => Number(ex.id) === context.id);
        if (catalogExam) { catalogExam.published = fresh.exam.published; catalogExam.revision = fresh.exam.revision; }
        progress(fresh); examOptions(context.id);
        if (studentId) {
          const student = await api('result_student',{...context,student_id:studentId});
          if (!alive() || ticket !== sequence) return false;
          paintStudent(student);
        }
        status(published ? 'ফলাফল প্রকাশিত হয়েছে।' : editSelected ? 'সম্পাদনা চালু হয়েছে। নম্বর পরিবর্তন করে Enter চাপুন। শেষে আবার ফলাফল প্রকাশ করুন।' : 'প্রকাশ বন্ধ হয়েছে। এখন নম্বর সম্পাদনা করা যাবে।');
        if (editSelected) focusMark();
        return true;
      } catch (error) { if (alive() && ticket === sequence) status(String(error),true); return false; }
      finally { if (alive() && ticket === sequence) { busy = false; controls(); } }
    }
    async function editStudent() {
      if (busy || printing || !current || !examInfo) return;
      if (examInfo.exam.published) { await changePublication(false,true); return; }
      if (!(await flush()) || !alive()) return;
      status('নম্বর পরিবর্তন করে Enter চাপুন। প্রতিটি পরিবর্তন স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।');
      focusMark();
    }
    async function lookup(studentId = 0) {
      if (busy || !examInfo || !(await flush())) return;
      const query = $('smQuery').value.trim();
      if (!studentId && !query) { status('ফরম নম্বর অথবা রোল নম্বর লিখুন।',true); $('smQuery').focus(); return; }
      const ticket = ++sequence; busy = true; controls(); status('শিক্ষার্থী খোঁজা হচ্ছে…');
      try {
        const data = await api(studentId ? 'result_student' : 'result_lookup', {...scope(),...(studentId ? {student_id:studentId} : {query,mode:$('smMode').value})});
        if (!alive() || ticket !== sequence) return;
        resetStudent();
        if (data.status === 'found') { paintStudent(data); status(data.exam.published ? '“নম্বর সম্পাদনা” চাপুন। নিশ্চিত করার পরে এই শিক্ষার্থীর নম্বর সংশোধন করতে পারবেন।' : 'নম্বর লিখে Enter চাপুন। আগের নম্বরও সরাসরি সংশোধন করা যাবে।'); }
        else if (data.status === 'ambiguous') {
          status('একই নম্বরে একাধিক শিক্ষার্থী আছে। সঠিক শিক্ষার্থী নির্বাচন করুন।',true);
          body.querySelector('.sm-candidates').innerHTML = data.candidates.map(s => '<button type="button" data-candidate="' + s.student_id + '"><strong translate="no">' + e(s.name) + '</strong><span>' + t('ফরম') + ' ' + e(s.form_no || '—') + ' · ' + t('রোল') + ' ' + e(s.roll || '—') + ' · ' + e(s.class) + ' · ' + e(s.department || '—') + ' · ' + e(s.year) + ' · ' + e(s.sid) + '</span></button>').join('');
          body.querySelectorAll('[data-candidate]').forEach(b => b.onclick = () => lookup(Number(b.dataset.candidate)).catch(error => status(String(error),true)));
        } else status('এই পরীক্ষা, শিক্ষাবর্ষ, শ্রেণি ও বিভাগের মধ্যে শিক্ষার্থী পাওয়া যায়নি।',true);
      } catch (error) { if (alive() && ticket === sequence) { resetStudent(); status(String(error),true); } }
      finally { if (alive() && ticket === sequence) { busy = false; controls(); if (current) { const first = [...body.querySelectorAll('[data-mark-input]')].find(input => !input.disabled && input.value === ''); first?.focus({preventScroll:true}); } else $('smQuery').focus({preventScroll:true}); } }
    }
    async function filterChange(kind) {
      const prior = {...filters};
      if (!(await flush())) { $('smYear').value=prior.year; $('smClass').value=prior.class; $('smExam').value=String(prior.id); $('smDepartment').value=prior.department; return; }
      filters.year = $('smYear').value; filters.class = $('smClass').value; filters.department = $('smDepartment').value;
      if (kind === 'exam') { filters.id = Number($('smExam').value); const ex = catalog.exams.find(ex => Number(ex.id) === filters.id); filters.department = ex?.department || ''; }
      else if (kind !== 'department') { filters.department = ''; examOptions(); }
      await loadExam();
    }
    async function report() { if (!(await flush())) return null; return api('result_report',scope()); }
    const stateLabel = result => result.passed === null || result.passed === undefined ? t('অসম্পূর্ণ') : t(result.passed ? 'পাস' : 'ফেল');
    const gpa = result => result.gpa === null || result.gpa === undefined ? '—' : n(Number(result.gpa).toFixed(2));
    function reportTable(data, tabulation = false, actions = false, selected = null) {
      const heads = [...(selected ? ['<label class="sm-result-check"><input type="checkbox" data-result-select-all aria-label="'+t('এই পরীক্ষার সকল শিক্ষার্থী নির্বাচন')+'"><span>'+t('সকল')+'</span></label>'] : []),t('রোল'),t('ফরম'),t('শিক্ষার্থীর নাম'),...(tabulation ? data.subjects.map(s => e(s.name)+' ('+n(s.full)+')') : []),t('মোট / পূর্ণ'),t('গড়'),t('গ্রেড'),'GPA',t('ফলাফল'),t('মেধাক্রম'),...(actions ? [t('কাজ')] : [])];
      const values = data.students.map(s => MM.records.cells([...(selected ? ['<label class="sm-result-check"><input type="checkbox" data-result-select="'+e(s.student_id)+'" aria-label="'+e(t('মার্কশিট নির্বাচন')+' — '+s.name)+'"'+(selected.has(Number(s.student_id)) ? ' checked' : '')+'><span class="sm-result-sr-only">'+t('নির্বাচন')+'</span></label>'] : []),e(s.roll || '—'),e(s.form_no || '—'),'<strong translate="no">'+e(s.name)+'</strong><small>'+e(s.sid)+'</small>',...(tabulation ? data.subjects.map(sub => {const sr = s.subject_results.find(r => Number(r.subject_id) === Number(sub.id)); return !sr?.recorded ? '—' : sr.absent ? t('অনুপস্থিত') : n(sr.marks);}) : []),n(s.total)+' / '+n(s.full),s.complete ? n(Number(s.average || 0).toFixed(2)) : '—',e(MM.i18n.lang === 'en' ? s.grade_en : s.grade),gpa(s),stateLabel(s),n(s.rank ?? '—'),...(actions ? ['<button type="button" class="btn btn-ghost" data-result-open="'+s.student_id+'">'+MM.records.icon('file')+t('মার্কশিট')+'</button>'] : [])]));
      return {heads,values};
    }
    async function withReport(work) {
      if (printing || busy || !examInfo) return;
      printing = true; controls();
      try { const data = await report(); if(data && alive()) await work(data); }
      catch(error) {status(String(error),true);}
      finally {printing=false;controls();}
    }
    $('smYear').onchange=()=>filterChange('year').catch(error=>status(String(error),true));
    $('smClass').onchange=()=>filterChange('class').catch(error=>status(String(error),true));
    $('smExam').onchange=()=>filterChange('exam').catch(error=>status(String(error),true));
    $('smDepartment').onchange=()=>filterChange('department').catch(error=>status(String(error),true));
    body.querySelector('.sm-search').onsubmit=event=>{event.preventDefault();lookup().catch(error=>status(String(error),true));};
    $('smRetry').onclick=()=>flush().catch(error=>status(String(error),true));
    $('smReload').onclick=async()=>{
      if(busy || !current)return;
      const pending=[...rows.values()].some(row=>row.key!==row.saved || row.error);
      if(pending && !(await MM.util.confirm(t('অসংরক্ষিত পরিবর্তন বাদ দিয়ে ডাটাবেজের নম্বর আবার আনবেন?'))))return;
      rows.forEach(row=>clearTimeout(row.timer));await chain;
      const studentId=Number(current.student.student_id),ticket=++sequence;busy=true;controls();
      try{const data=await api('result_student',{...scope(),student_id:studentId});if(alive()&&ticket===sequence){paintStudent(data);status('সংরক্ষিত নম্বর হালনাগাদ হয়েছে।');}}
      catch(error){status(String(error),true);}finally{busy=false;controls();}
    };
    $('smNewExam').onclick=async()=>{if(await flush())MM.router.go('exams',{class:filters.class,create:true});};
    $('smRules').onclick=async()=>{
      if (!(await flush()) || !examInfo) return;
      if (examInfo.exam.published) {status('পরীক্ষার নিয়ম পরিবর্তনের আগে প্রকাশ বন্ধ করুন।',true);return;}
      rules(examInfo, async () => {const next=await api('result_catalog',{});Object.assign(catalog,next);const selected=catalog.exams.find(ex=>Number(ex.id)===filters.id);if(selected?.academic_year)filters.year=ascii(selected.academic_year);if(selected?.department)filters.department=selected.department;$('smYear').innerHTML=opts(catalog.years.map(ascii),filters.year,t('সকল শিক্ষাবর্ষ (পুরোনো পরীক্ষা)'));examOptions(filters.id);await loadExam();});
    };
    $('smPublish').onclick=()=>changePublication(!examInfo?.exam.published).catch(error=>status(String(error),true));
    $('smAllResults').onclick=()=>withReport(async data=>{
      const selected = new Set(), expectedScope = identify();
      const form=MM.records.modal(t('সকল ফলাফল'),'<div class="sm-report-meta">'+e(data.exam.name)+' · '+e(filters.class)+' · '+e(filters.year||t('সকল শিক্ষাবর্ষ'))+'</div><div class="sm-selection-tools"><div><strong>'+t('প্রয়োজনীয় শিক্ষার্থীর মার্কশিট নির্বাচন করুন')+'</strong><span data-result-selected-count aria-live="polite"></span></div>'+button('smPrintSelected','নির্বাচিত মার্কশিট প্রিন্ট','print',true)+'</div><p class="sm-selection-status" data-result-selection-status role="status" aria-live="polite"></p><div class="r-report" data-all-results></div>',async()=>{},t('ফলাফল প্রিন্ট'));
      form.classList.add('sm-report-dialog');
      const printSelected = form.querySelector('#smPrintSelected'), selectionStatus = form.querySelector('[data-result-selection-status]');
      const modalAlive = () => alive() && form.isConnected && !form.closest('.r-modal')?.classList.contains('r-closing') && expectedScope === identify();
      let preparing = false;
      function selectionControls() {
        if (!modalAlive()) return;
        form.querySelector('[data-result-selected-count]').textContent = t('নির্বাচিত')+' '+n(selected.size)+' / '+n(data.students.length)+' '+t('জন');
        printSelected.disabled = preparing || !selected.size;
        printSelected.innerHTML = MM.records.icon('print')+t(preparing ? 'মার্কশিট প্রস্তুত হচ্ছে…' : 'নির্বাচিত মার্কশিট প্রিন্ট');
        form.querySelectorAll('[data-result-select]').forEach(input => {input.checked=selected.has(Number(input.dataset.resultSelect));input.disabled=preparing;});
        const all = form.querySelector('[data-result-select-all]');
        if (all) {all.checked=!!data.students.length && selected.size===data.students.length;all.indeterminate=selected.size>0 && selected.size<data.students.length;all.disabled=preparing || !data.students.length;}
        form.querySelectorAll('[data-result-open]').forEach(b=>b.disabled=preparing);
        form.querySelector('#rSave').disabled=preparing;
      }
      const {heads}=reportTable(data,false,true,selected);
      MM.records.paged(form.querySelector('[data-all-results]'),heads,()=>reportTable(data,false,true,selected).values,box=>{
        box.querySelectorAll('[data-result-select]').forEach(input=>input.onchange=()=>{if(!modalAlive() || preparing)return;const id=Number(input.dataset.resultSelect);if(input.checked)selected.add(id);else selected.delete(id);selectionControls();});
        box.querySelector('[data-result-select-all]').onchange=event=>{if(!modalAlive() || preparing)return;selected.clear();if(event.target.checked)data.students.forEach(s=>selected.add(Number(s.student_id)));selectionControls();};
        box.querySelectorAll('[data-result-open]').forEach(b=>b.onclick=()=>{if(modalAlive()&&!preparing)MM.marksheet.open(data,Number(b.dataset.resultOpen));});
        selectionControls();
      },undefined,'smResults');
      printSelected.onclick=async()=>{
        if(!modalAlive() || preparing || printing || busy || !selected.size)return;
        const students=data.students.filter(s=>selected.has(Number(s.student_id)));
        if(!students.length)return;
        preparing=true;printing=true;selectionStatus.classList.remove('bad');selectionStatus.textContent=t('নির্বাচিত মার্কশিট প্রস্তুত হচ্ছে…');selectionControls();controls();
        try {
          await MM.marksheet.openBulk({...data,students},modalAlive,(done,total)=>{if(modalAlive())selectionStatus.textContent=t('মার্কশিট প্রস্তুত হচ্ছে')+' '+n(done)+' / '+n(total);});
          if(modalAlive())selectionStatus.textContent=t('নির্বাচিত মার্কশিট প্রস্তুত। প্রিন্টের আগে পৃষ্ঠার বিন্যাস বেছে নিন।');
        } catch(error) {if(modalAlive()){selectionStatus.classList.add('bad');selectionStatus.textContent=String(error);}}
        finally {preparing=false;printing=false;selectionControls();controls();}
      };
      form.querySelector('#rSave').type='button';form.querySelector('#rSave').onclick=()=>{if(!modalAlive()||preparing)return;const table=reportTable(data);MM.printing.open(data.exam.name+' · '+t('ফলাফল'),MM.records.table(table.heads,table.values));};
      selectionControls();
    });
    $('smPrintResults').onclick=()=>withReport(data=>{const table=reportTable(data);MM.printing.open(data.exam.name+' · '+filters.class+' · '+t('ফলাফল'),MM.records.table(table.heads,table.values));});
    $('smTabulation').onclick=()=>withReport(data=>{const table=reportTable(data,true);MM.printing.open(data.exam.name+' · '+filters.class+' · '+t('ট্যাবুলেশন শিট'),MM.records.table(table.heads,table.values),{landscape:true});});
    $('smMarksheet').onclick=()=>withReport(data=>MM.marksheet.open(data,Number(current.student.student_id)));
    $('smAllMarksheets').onclick=()=>withReport(data=>MM.marksheet.openBulk(data,alive,(done,total)=>status(t('মার্কশিট প্রস্তুত হচ্ছে')+' '+n(done)+' / '+n(total))));
    examOptions(filters.id); await loadExam();
    if (!alive()) return;
    if (params.studentId && examInfo) await lookup(Number(params.studentId));
    if (!alive()) return;
    active={root,alive,flush,activate:()=>{if(alive()&&!busy){$('smQuery').focus({preventScroll:true});$('smQuery').select();}}};
  }

  function rules(data, onSaved) {
    const ex=data.exam, grading=data.grading || [];
    const f=MM.records.modal(t('পরীক্ষার নিয়ম'),'<p>'+t('গ্রেড ও GPA প্রতিষ্ঠানের নির্ধারিত নিয়ম অনুযায়ী দিন। GPA ফাঁকা থাকলে GPA হিসাব করা হবে না।')+'</p><div class="r-form-grid">'+MM.records.field('smRuleYear',t('শিক্ষাবর্ষ (পুরোনো পরীক্ষা হলে ফাঁকা রাখা যায়)'),'text',ex.academic_year||'','maxlength="30"')+MM.records.field('smRuleDepartment',t('বিভাগ (সকল হলে ফাঁকা)'),'text',ex.department||'','maxlength="120"')+'</div><h4>'+t('গ্রেড ও GPA')+'</h4><div class="sm-grade-rules">'+grading.map((g,i)=>'<div data-rule="'+i+'"><label>'+t('ন্যূনতম শতাংশ')+'<input data-min type="number" min="0" max="100" step="0.01" required value="'+e(g.minimum)+'"></label><label>'+t('বাংলা গ্রেড')+'<input data-name required maxlength="100" value="'+e(g.grade)+'"></label><label>English<input data-en required maxlength="100" value="'+e(g.grade_en)+'"></label><label>GPA<input data-gpa type="number" min="0" max="10" step="0.01" value="'+e(g.gpa??'')+'" placeholder="'+t('ঐচ্ছিক')+'"></label></div>').join('')+'</div><h4>'+t('লিখিত ও ব্যবহারিক নম্বর')+'</h4><p>'+t('লিখিত ও ব্যবহারিক পূর্ণ নম্বরের যোগফল বিষয়ের পূর্ণ নম্বর হতে হবে। ব্যবহারিক না থাকলে ব্যবহারিক পূর্ণ ও পাস নম্বর ০ দিন।')+'</p><div class="sm-component-rules">'+data.subjects.map(s=>'<div data-rule-subject="'+s.id+'"><strong translate="no">'+e(s.name)+' · '+t('পূর্ণ')+' '+n(s.full)+' / '+t('পাস')+' '+n(s.pass)+'</strong><div>'+[['written_full','লিখিত পূর্ণ',s.written_full??s.full],['practical_full','ব্যবহারিক পূর্ণ',s.practical_full??0],['written_pass','লিখিত পাস',s.written_pass??0],['practical_pass','ব্যবহারিক পাস',s.practical_pass??0]].map(([field,label,value])=>'<label>'+t(label)+'<input data-component="'+field+'" type="number" min="0" max="'+s.full+'" step="1" required value="'+e(value)+'"></label>').join('')+'</div></div>').join('')+'</div>',async form=>{
      const ruleRows=[...form.querySelectorAll('[data-rule]')];
      const nextGrades=ruleRows.map((row,i)=>({...grading[i],minimum:Number(row.querySelector('[data-min]').value),grade:row.querySelector('[data-name]').value.trim(),grade_en:row.querySelector('[data-en]').value.trim(),gpa:row.querySelector('[data-gpa]').value===''?null:Number(row.querySelector('[data-gpa]').value)}));
      const subjects=[...form.querySelectorAll('[data-rule-subject]')].map(row=>({id:Number(row.dataset.ruleSubject),...Object.fromEntries([...row.querySelectorAll('[data-component]')].map(input=>[input.dataset.component,Number(input.value)]))}));
      await api('result_config_save',{id:ex.id,revision:ex.revision,academic_year:ascii(form.querySelector('#smRuleYear').value),department:form.querySelector('#smRuleDepartment').value.trim(),grading:nextGrades,subjects});
      try{await onSaved();}catch(error){MM.util.toast(t('নিয়ম সংরক্ষিত হয়েছে। পেজ আবার খুলুন: ')+String(error),'err');}
    });
    f.classList.add('sm-rules-dialog');return f;
  }
  async function beforeLeave(){return active?.alive() ? active.flush() : true;}
  function activate(root){if(active?.root===root)active.activate();}
  return {render,beforeLeave,activate};
})();
