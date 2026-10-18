window.MM = window.MM || {};
MM.marksheet = (() => {
  const e = MM.util.esc, t = text => MM.i18n.t(text);
  const number = value => MM.i18n.lang === 'en' ? String(value ?? '-') : MM.util.bnNum(value ?? '-');
  const image = value => /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=\r\n]+$/i.test(value || '') ? value : '';
  const grade = row => e(MM.i18n.lang === 'en' ? row.grade_en : row.grade);

  function html(d, result, student, institution) {
    const ref = 'MM-' + d.exam.id + '-' + result.student_id + '-R' + d.exam.revision;
    const qr = qrcode(0, 'M');
    // This is an offline record reference, not an online authenticity certificate.
    qr.addData(ref + '|total=' + result.total + '/' + result.full + '|grade=' + (result.grade_code || 'incomplete') + '|published=' + Number(d.exam.published));
    qr.make();
    const photo = image(student.photo);
    const row = (label, value) => '<tr><th scope="row">' + t(label) + '</th><td>' + e(value || '-') + '</td></tr>';
    const identityRow = (label, value) => '<tr><th scope="row">' + t(label) + '</th><td colspan="3">' + e(value || '-') + '</td></tr>';
    const pair = (label, value, otherLabel, otherValue) => '<tr><th scope="row">' + t(label) + '</th><td>' + e(value || '-') + '</td><th scope="row">' + t(otherLabel) + '</th><td>' + e(otherValue || '-') + '</td></tr>';
    return '<article class="q-mark-sheet" data-marksheet data-student-id="' + e(result.student_id) + '" lang="' + MM.i18n.lang + '">' +
      MM.settings.headerHTML({variant:'q-letterhead',fallbackLogo:true,settings:institution}) +
      '<div class="q-exam-heading"><strong translate="no">' + e(d.exam.name) + '</strong><span>' + number(e(d.exam.day)) + '</span></div>' +
      '<div class="q-identity"><div class="q-photo">' + (photo ? '<img src="' + e(photo) + '" alt="' + t('শিক্ষার্থীর ছবি') + '">' : '<span>' + t('ছবি') + '</span>') + '</div>' +
      '<table class="q-student-info"><colgroup><col style="width:20%"><col style="width:30%"><col style="width:20%"><col style="width:30%"></colgroup><tbody>' + identityRow('শিক্ষার্থীর নাম (বাংলা)', result.name) +
      (student.name_en ? identityRow('English Name', student.name_en) : '') + identityRow('পিতার নাম', student.father) +
      pair('শ্রেণি',d.exam.class,'বিভাগ',result.department || student.department) +
      pair('নতুন রোল (মেধাক্রম)',number(result.exam_new_roll || result.rank || result.roll || student.roll || '-'),'পূর্বের রোল নম্বর',number(result.prev_roll || result.roll || student.roll || '-')) +
      pair('ফরম নম্বর',number(result.form_no || student.form_no || '-'),'শিক্ষাবর্ষ',number(d.exam.academic_year || result.year || student.year || '-')) +
      pair('আইডি নম্বর',result.sid,'জন্ম তারিখ',number(student.dob || '-')) + '</tbody></table></div>' +
      '<table class="q-subject-table"><colgroup><col class="q-col-serial"><col class="q-col-subject"><col class="q-col-mark"><col class="q-col-mark"><col class="q-col-mark"><col class="q-col-grade"></colgroup><thead><tr>' +
      ['ক্রমিক','বিষয়','প্রাপ্ত নম্বর','পূর্ণ নম্বর','পাস নম্বর','গ্রেড'].map(x => '<th scope="col">' + t(x) + '</th>').join('') + '</tr></thead><tbody>' +
      result.subject_results.map((r, i) => '<tr><td>' + number(i + 1) + '</td><th scope="row">' + e(r.subject) + '</th><td>' +
        (!r.recorded ? '-' : r.absent ? t('অনুপস্থিত') : number(r.marks)) +
        (Number(r.practical_full || 0) > 0 && !r.absent ? '<small class="q-component">' + t('লিখিত') + ' ' + number(r.written) + ' / ' + number(r.written_full) + ' · ' + t('ব্যবহারিক') + ' ' + number(r.practical) + ' / ' + number(r.practical_full) + '</small>' : '') + '</td><td>' + number(r.full) + '</td><td>' + number(r.pass) + '</td><td class="q-grade" data-grade="' + e(r.grade_code || '') + '">' + grade(r) + '</td></tr>').join('') +
      '</tbody><tfoot><tr><th colspan="2">' + t('মোট প্রাপ্ত নম্বর') + '</th><td>' + number(result.total) + '</td><td>' + number(result.full) + '</td><td colspan="2">' + t(result.complete ? 'ফলাফল' : 'অসম্পূর্ণ') + '</td></tr></tfoot></table>' +
      '<table class="q-result-summary"><tbody>' + row('শতকরা', result.complete ? number(result.percentage.toFixed(2)) + '%' : '-') +
      '<tr><th scope="row">' + t('বিভাগ') + '</th><td class="q-grade" data-grade="' + e(result.grade_code || '') + '">' + grade(result) + '</td></tr>' +
      row('গড়', result.complete && result.average !== undefined ? number(Number(result.average).toFixed(2)) : '-') +
      row('GPA', result.gpa === null || result.gpa === undefined ? t(result.gpa_configured ? 'অসম্পূর্ণ' : 'নিয়ম নির্ধারিত নয়') : number(Number(result.gpa).toFixed(2))) +
      row('ফলাফল', result.passed === null || result.passed === undefined ? t('অসম্পূর্ণ') : t(result.passed ? 'পাস' : 'ফেল')) +
      row('মেধাক্রম', number(result.rank)) + '</tbody></table>' +
      '<div class="q-signatures">' + ['শ্রেণি শিক্ষকের স্বাক্ষর','পরীক্ষা নিয়ন্ত্রকের স্বাক্ষর','মুহতামিমের স্বাক্ষর'].map(x => '<div><span></span>' + t(x) + '</div>').join('') + '</div>' +
      '<footer class="q-footer"><div>' + (institution.receipt_footer ? '<p>' + e(institution.receipt_footer) + '</p>' : '') +
      '<p>' + t('ফলাফলের রেফারেন্স') + ': <b>' + e(ref) + '</b></p></div><img class="q-qr" src="' + qr.createDataURL(3,12) + '" alt="' + t('ফলাফলের রেফারেন্স') + '"></footer></article>';
  }

  async function print(sheet) {
    return MM.printing.open(t('মার্কশিট'), sheet.outerHTML, {letterhead:false, marksheet:true});
  }

  async function open(d, id) {
    const result = d.students.find(s => s.student_id === id);
    if (!result) { MM.util.toast(t('শিক্ষার্থী পাওয়া যায়নি'), 'err'); return; }
    const form = MM.records.modal('মার্কশিট', '<div class="r-report q-mark-preview" role="status">' + t('লোড হচ্ছে…') + '</div>', async () => {}, 'মার্কশিট প্রিন্ট');
    form.classList.add('q-mark-dialog');
    const button = form.querySelector('#rSave');
    button.type = 'button'; button.disabled = true;
    button.innerHTML = MM.records.icon('print') + t('মার্কশিট প্রিন্ট');
    try {
      const [student, institution] = await Promise.all([MM.students.get(id), MM.tauri.invoke('settings_get')]);
      if (!form.isConnected) return;
      if (!student) throw Error(t('শিক্ষার্থী পাওয়া যায়নি'));
      form.querySelector('.r-report').innerHTML = '<div class="q-mark-page">' + html(d, result, student, institution) + '</div>';
      MM.settings.applyHeaderSizes?.(form.querySelector('.q-mark-page'));
      MM.printing.fitPreview?.(form.querySelector('.q-mark-preview'), form.querySelector('.q-mark-page'));
      button.disabled = false;
      button.onclick = () => print(form.querySelector('[data-marksheet]'));
      MM.i18n.apply(MM.i18n.lang);
    } catch (error) {
      if (form.isConnected) {
        form.querySelector('.r-report').textContent = String(error);
        form.querySelector('.r-status').classList.add('bad');
        form.querySelector('.r-status').textContent = String(error);
      }
    }
  }
  async function openStudent(examId, studentId, alive = () => true) {
    const d = await MM.records.invoke('exam_get', {id:examId});
    if (alive()) return open(d, studentId);
  }
  async function openBulk(d, alive = () => true, progress = () => {}) {
    if (!d.students?.length) throw Error(t('শিক্ষার্থী পাওয়া যায়নি'));
    const institution = await MM.tauri.invoke('settings_get');
    const sheets = new Array(d.students.length);
    let cursor = 0, done = 0;
    // Keep the interface responsive and avoid thousands of simultaneous IPC
    // requests or database locks when preparing a large institution's sheets.
    async function worker() {
      while (cursor < d.students.length && alive()) {
        const index = cursor++, result = d.students[index];
        const student = await MM.students.get(Number(result.student_id));
        if (!student) throw Error(t('শিক্ষার্থী পাওয়া যায়নি') + ': ' + result.sid);
        sheets[index] = html(d, result, student, institution);
        done++; if (done % 25 === 0 || done === d.students.length) progress(done, d.students.length);
        if (done % 50 === 0) await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    await Promise.all(Array.from({length:Math.min(8,d.students.length)}, worker));
    if (!alive()) return;
    return MM.printing.open(d.exam.name + ' · ' + t('সকল মার্কশিট'), sheets.join(''), {letterhead:false,marksheet:true});
  }
  return {open, openStudent, openBulk, html};
})();
