/* =========================================================
   Router — সাইডবারের বিদ্যমান বোতামগুলোকেই পেজের সাথে যুক্ত করে।
   ড্যাশবোর্ডের মূল HTML অপরিবর্তিত রাখা হয় (প্রথমে সংরক্ষণ করে রাখা হয়)।
   ========================================================= */
window.MM = window.MM || {};

MM.router = (function () {
  let dashboardHTML = "";
  let contentEl = null;
  let current = "dashboard";
  let currentParams = null;
  let stack = [];
  let activeView = null, retainedView = null, pendingView = null;
  let navigationSequence = 0;
  let committedPage = 'dashboard', committedParams = null;

  const SOON_T = { routine: 'ক্লাস রুটিন', income: 'আয়', expense: 'খরচ' };
  function renderSoon(root, page) {
    root.innerHTML = '<div class="mhome"><header class="mhome-bar"><button class="mhome-menu" aria-label="মেনু"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button><div class="mhome-title"><b>' + (SOON_T[page] || '') + '</b></div></header>' +
      '<div class="soon"><div class="soon-ic">🚧</div><h3>শীঘ্রই আসছে</h3><p>এই ফিচারটি মোবাইল ভার্সনে যোগ করা হচ্ছে।</p><button class="btn" data-back>পেছনে যান</button></div></div>';
    root.querySelector('.mhome-menu').onclick = () => document.querySelector('.sidebar')?.classList.toggle('show');
    root.querySelector('[data-back]').onclick = () => go('dashboard');
  }
  function renderReports(root) {
    const items = [
      ['শিক্ষার্থী রিপোর্ট', 'students'], ['আর্থিক রিপোর্ট', 'fees'],
      ['উপস্থিতি রিপোর্ট', 'attendance'], ['ফলাফল রিপোর্ট', 'results'],
    ];
    root.innerHTML = '<div class="mhome"><header class="mhome-bar"><button class="mhome-menu" aria-label="মেনু"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button><div class="mhome-title"><b>রিপোর্ট</b></div></header>' +
      '<div class="mhome-grid">' + items.map((x, i) => '<button class="mcard" data-i="' + i + '"><span class="mcard-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 8V3h10v5"/><rect x="3" y="8" width="18" height="9" rx="2"/><path d="M7 14h10v7H7z"/></svg></span><span class="mcard-t">' + x[0] + '</span></button>').join('') + '</div></div>';
    root.querySelector('.mhome-menu').onclick = () => document.querySelector('.sidebar')?.classList.toggle('show');
    root.querySelectorAll('.mcard').forEach(b => b.onclick = () => go(items[+b.dataset.i][1]));
  }
  function renderPage(root, page, params) {
    if (page === 'dashboard') {
      if (MM.mobileHome?.isMobile()) return MM.mobileHome.render(root);
      root.innerHTML = dashboardHTML;
      return MM.refreshDashboard?.(root);
    }
    if (page === 'routine' || page === 'income' || page === 'expense') return renderSoon(root, page);
    if (page === 'reports') return renderReports(root);
    if (page === 'students') return MM.pageStudents.render(root);
    if (page === 'admission') return MM.pageAdmission.render(root, params);
    if (page === 'student') return MM.pageStudentProfile.render(root, params);
    if (page === 'help') return MM.pageHelp.render(root);
    if (page === 'settings') return MM.pageSettings.render(root, params);
    if (page === 'result-management') return MM.resultManagement.render(root, params);
    return MM.records?.render(root, page, params);
  }

  async function navigate(page, params, noPush) {
    if (!contentEl) return;
    const ticket = ++navigationSequence;
    const nextParams = params || {};
    const history = stack.slice();
    if (!noPush && committedPage && (committedPage !== page || JSON.stringify(committedParams || {}) !== JSON.stringify(nextParams))) {
      history.push({page: committedPage, params: committedParams});
      if (history.length > 20) history.shift();
    }
    if (page === 'dashboard') history.length = 0;
    current = page;
    currentParams = params || null;
    if (pendingView) pendingView.remove();
    if (!retainedView && activeView) {
      // Keep a static finished view on screen; its fields must never shadow the new form's IDs.
      retainedView = activeView.cloneNode(true);
      retainedView.classList.add('mm-route-retained');
      retainedView.inert = true;
      retainedView.setAttribute('aria-hidden', 'true');
      for (const element of [retainedView, ...retainedView.querySelectorAll('*')]) {
        for (const attr of [...element.attributes]) {
          if (attr.name === 'id' || attr.name.startsWith('data-')) element.removeAttribute(attr.name);
        }
      }
      activeView._recordsToken = null;
      activeView.replaceWith(retainedView);
      activeView = null;
    }
    const stage = document.createElement('div');
    stage.className = 'mm-route-view mm-route-staging';
    stage.inert = true;
    stage.setAttribute('aria-hidden', 'true');
    const inset = getComputedStyle(contentEl);
    stage.style.left = inset.paddingLeft;
    stage.style.right = inset.paddingRight;
    stage.style.top = inset.paddingTop;
    pendingView = stage;
    contentEl.appendChild(stage);
    contentEl.setAttribute('aria-busy', 'true');
    contentEl.dataset.routePending = page;
    setActiveNav(page);
    try {
      await renderPage(stage, page, nextParams);
      try {
        MM.mobileHome?.buildNav(); MM.mobileHome?.setActive(page);
        document.body.classList.toggle('mhome-active', page === 'dashboard' && !!MM.mobileHome?.isMobile());
      } catch (_) {}
      if (ticket !== navigationSequence || !stage.isConnected) return;
      MM.i18n?.apply(MM.i18n.lang || 'bn');
      await document.fonts.ready;
      if (ticket !== navigationSequence || !stage.isConnected) return;
    } catch (error) {
      if (ticket !== navigationSequence || !stage.isConnected) return;
      stage.innerHTML = '<section class="fcard"><div class="fcard-body"><h2>মডিউলটি খোলা যায়নি</h2><p>আবার চেষ্টা করুন।</p><button type="button" class="btn btn-primary">আবার খুলুন</button></div></section>';
      stage.querySelector('button').onclick = () => go(page, nextParams, true);
    }
    if (ticket !== navigationSequence) return;
    retainedView?.remove();
    retainedView = null;
    stage.classList.remove('mm-route-staging');
    stage.removeAttribute('style');
    stage.removeAttribute('aria-hidden');
    stage.inert = false;
    stage.classList.add('mm-route-ready');
    activeView = stage;
    pendingView = null;
    committedPage = page;
    committedParams = params || null;
    stack = history;
    contentEl.dataset.route = page;
    delete contentEl.dataset.routePending;
    contentEl.setAttribute('aria-busy', 'false');
    window.scrollTo({top: 0, left: 0, behavior: 'instant'});
    updateBackBtn();
    if (page === 'result-management') MM.resultManagement.activate(stage);
  }

  function setActiveNav(page) {
    const originalPage = page;
    closeMenuGroups();
    document.querySelectorAll('.nav-item,.subnav button').forEach(button => {
      button.classList.remove('active', 'contains-current');
      button.removeAttribute('aria-current');
    });
    if (page === 'student') page = 'students';
    if (page === 'staff-profile' || page === 'staff-attendance') page = 'staff';
    let selected;
    if (page === 'settings') {
      const tab = currentParams?.tab === 'backup' ? 'backup' : 'institution';
      selected = document.querySelector('[data-settings-tab="'+tab+'"]');
    } else if (page === 'help') selected = document.querySelector('[data-support-page]');
    else if (page === 'dashboard') selected = document.querySelector('[data-nav-page="dashboard"]');
    else if (page === 'students' || page === 'admission') selected = document.querySelector('[data-nav-page="'+page+'"]');
    else {
      const candidates = [...document.querySelectorAll('[data-record-page="'+page+'"]')];
      selected = page === 'staff' && currentParams?.new ? candidates.find(b => /নতুন স্টাফ|Add Staff|New Staff/.test(b.textContent)) : candidates[0];
      if (!selected && page === 'dues') selected = document.querySelector('[data-record-page="fees"]');
    }
    if (selected) {
      selected.classList.add('active');
      selected.setAttribute('aria-current', 'page');
      const group = selected.parentElement;
      if (group?.classList.contains('subnav')) {
        setMenuGroup(group.previousElementSibling, true);
        group.previousElementSibling?.classList.add('contains-current');
      }
    }
    const labels = {dashboard:'ড্যাশবোর্ড',students:'শিক্ষার্থী তালিকা',admission:'ছাত্র ভর্তি',student:'শিক্ষার্থীর ড্যাশবোর্ড',staff:'স্টাফ তালিকা','staff-profile':'স্টাফ ড্যাশবোর্ড','staff-attendance':'স্টাফ উপস্থিতি',fees:'ফি সংগ্রহ',dues:'বকেয়া ব্যবস্থাপনা',salary:'বেতন ব্যবস্থাপনা',attendance:'উপস্থিতি ব্যবস্থাপনা',exams:'পরীক্ষা',results:'ফলাফল','result-management':'Result Management',settings:'সেটিংস',help:'সাহায্য','question-bank':'প্রশ্ন ব্যাংক'};
    const label = labels[originalPage] || selected?.textContent.trim() || originalPage;
    const pageIndicator = document.getElementById('mmCurrentPage');
    if (pageIndicator) pageIndicator.textContent = MM.i18n?.t(label) || label;
    document.title = (MM.i18n?.lang === 'en' ? 'Madrasa Manager' : 'মাদরাসা ম্যানেজার')+' — '+(MM.i18n?.t(label) || label);
  }

  function setMenuGroup(button, open) {
    if (!button?.classList.contains('drop')) return;
    button.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
    button.nextElementSibling?.classList.toggle('show', open);
  }
  function closeMenuGroups(except = null) {
    document.querySelectorAll('.nav-item.drop').forEach(button => {
      if (button !== except) setMenuGroup(button, false);
    });
  }

  function updateBackBtn() {
    const b = document.getElementById("mmBack");
    if (b) b.classList.toggle("show", stack.length > 0);
  }

  async function back() {
    if (current === 'result-management' && !(await MM.resultManagement.beforeLeave())) return;
    if (current === 'settings' && MM.pageSettings.busy) return;
    if (current === 'settings' && MM.pageSettings.dirty) {
      return MM.util.confirm(MM.i18n.t('অসংরক্ষিত পরিবর্তন বাতিল করবেন?')).then(yes => {
        if (yes) { MM.pageSettings.discard(); back(); }
      });
    }
    const prev = stack.pop();
    if (prev) go(prev.page, prev.params, true);
    else go("dashboard", null, true);
  }

  async function go(page, params, noPush) {
    if (current === 'result-management' && !(await MM.resultManagement.beforeLeave())) return;
    if (current === 'settings' && MM.pageSettings.busy) return;
    if (current === 'settings' && page === 'settings' && MM.pageSettings.dirty) {
      const tab = ['institution','general','backup','about'].includes(params?.tab) ? params.tab : 'institution';
      const btn = document.querySelector('[data-tab="' + tab + '"]');
      if (btn) {
        btn.click();
        return;
      }
      return MM.util.confirm(MM.i18n.t('অসংরক্ষিত পরিবর্তন বাতিল করবেন?')).then(yes => {
        if (yes) { MM.pageSettings.discard(); go(page, params, noPush); }
      });
    }
    if (current === 'settings' && page !== 'settings' && MM.pageSettings.dirty) {
      return MM.util.confirm(MM.i18n.t('অসংরক্ষিত পরিবর্তন বাতিল করবেন?')).then(yes => {
        if (yes) { MM.pageSettings.discard(); go(page, params, noPush); }
      });
    }
    return navigate(page, params, noPush);
  }

  function initBackButton() {
    const bar = document.querySelector(".topbar");
    if (!bar || document.getElementById("mmBack")) return;
    const b = document.createElement("button");
    b.id = "mmBack";
    b.className = "mm-back";
    b.title = "পিছনে যান";
    b.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg><span>পিছনে</span>';
    b.onclick = back;
    bar.insertBefore(b, bar.firstChild);
    const pageIndicator = document.createElement('span');
    pageIndicator.id = 'mmCurrentPage';
    pageIndicator.className = 'mm-current-page';
    pageIndicator.setAttribute('aria-live', 'polite');
    bar.insertBefore(pageIndicator, b.nextSibling);
  }

  function init() {
    contentEl = document.querySelector(".content");
    if (!contentEl) return;
    initBackButton();
    dashboardHTML = contentEl.innerHTML; // মূল ড্যাশবোর্ড হুবহু সংরক্ষিত
    activeView = document.createElement('div');
    activeView.className = 'mm-route-view';
    activeView.append(...contentEl.childNodes);
    contentEl.appendChild(activeView);
    contentEl.dataset.route = 'dashboard';
    contentEl.setAttribute('aria-busy', 'false');
    // মোবাইলে প্রথম লোডেই মোবাইল হোম দেখাও
    if (MM.mobileHome?.isMobile()) {
      try { MM.mobileHome.buildNav(); MM.mobileHome.setActive('dashboard'); document.body.classList.add('mhome-active'); } catch (_) {}
      MM.mobileHome.render(activeView);
    }

    // সাইডবারের বিদ্যমান বোতামগুলোতে সংযোগ (নতুন কোনো মেনু যোগ করা হয়নি)
    document.querySelectorAll(".subnav button").forEach((b) => {
      const t = b.textContent.trim();
      if (["শিক্ষার্থী তালিকা", "Student List"].includes(t)) b.dataset.navPage = 'students';
      if (["ছাত্র ভর্তি", "Student Admission"].includes(t)) b.dataset.navPage = 'admission';
      if (t === "শিক্ষার্থী তালিকা" || t === "Student List")
        b.addEventListener("click", () => go("students"));
      if (t === "ছাত্র ভর্তি" || t === "Student Admission")
        b.addEventListener("click", () => go("admission"));
      if (["প্রতিষ্ঠান", "Institution", "ব্যাকআপ", "Backup"].includes(t)) {
        const tab = ["ব্যাকআপ", "Backup"].includes(t) ? 'backup' : 'institution';
        b.dataset.settingsTab = tab;
        b.addEventListener('click', () => {
          if (current === 'settings' && MM.pageSettings.dirty) {
            document.querySelector('[data-tab="' + tab + '"]')?.click();
          } else go('settings', {tab});
        });
      }
    });
    document.querySelectorAll(".nav-item").forEach((b) => {
      if (b.classList.contains('drop')) {
        b.setAttribute('aria-expanded', 'false');
        b.addEventListener('click', () => {
          const opening = !b.classList.contains('open');
          closeMenuGroups(b);
          setMenuGroup(b, opening);
        });
      }
      if (b.textContent.trim().includes("সাহায্য") || b.textContent.trim().includes("Help")) {
        b.dataset.supportPage = "help";
        b.addEventListener("click", () => go("help"));
      }
      if (b.textContent.trim().indexOf("Dashboard") === 0)
        { b.dataset.navPage = 'dashboard'; b.addEventListener("click", () => go("dashboard")); }
    });

    // ড্যাশবোর্ডের কুইক-অ্যাকশন কার্ডগুলোও কাজ করবে (ডিজাইন অপরিবর্তিত)
    contentEl.addEventListener("click", (ev) => {
      if (ev.target.closest('.support-footer button')) {
        go('help');
        return;
      }
      const q = ev.target.closest(".quick");
      if (!q) return;
      const t = q.textContent.trim();
      if (t === "শিক্ষার্থী তালিকা" || t === "Student List") go("students");
      else if (t === "ছাত্র ভর্তি" || t === "Student Admission")
        go("admission");
      else if (t === 'সেটিংস' || t === 'Settings') go('settings');
      else if (t === 'লেনদেন ইতিহাস' || t === 'Transaction History')
        go('fees', { tab: 'receipts' });
      else if (routes[t])
        go(routes[t], { new: ["স্টাফ যোগ", "Add Staff"].includes(t) });
    });

    MM.refreshDashboard();
    const routes = {
      "ফি সংগ্রহ": "fees",
      "Fee Collection": "fees",
      "বেতন ব্যবস্থাপনা": "salary",
      "Salary Management": "salary",
      "প্রশ্ন ব্যাংক": "question-bank",
      "Question Bank": "question-bank",
      "বকেয়া ব্যবস্থাপনা": "dues",
      "বকেয়া ব্যবস্থাপনা": "dues",
      "Arrears Management": "dues",
      "Due Management": "dues",
      "উপস্থিতি ব্যবস্থাপনা": "attendance",
      "Attendance Management": "attendance",
      উপস্থিতি: "attendance",
      Attendance: "attendance",
      "স্টাফ তালিকা": "staff",
      "Staff List": "staff",
      "নতুন স্টাফ": "staff",
      "New Staff": "staff",
      "স্টাফ যোগ": "staff",
      "Add Staff": "staff",
      পরীক্ষা: "exams",
      Exam: "exams",
      Exams: "exams",
      ফলাফল: "results",
      Results: "results",
      'Result Management': 'result-management',
      "আর্থিক রিপোর্ট": "fees",
      "Financial Report": "fees",
      "লেনদেন ইতিহাস": "fees",
      "Transaction History": "fees",
      "শিক্ষার্থী রিপোর্ট": "students",
      "Student Report": "students",
    };
    document.querySelectorAll(".subnav button,.nav-item").forEach((b) => {
      const text = b.textContent.trim(),
        page = routes[text];
      if (!page) return;
      b.dataset.recordPage = page;
      b.addEventListener("click", () =>
        go(page, {
          new: ["নতুন স্টাফ", "New Staff", "স্টাফ যোগ", "Add Staff"].includes(
            text,
          ),
        }),
      );
    });
    const staffBtn = contentEl.querySelector(".outline-btn");
    if (staffBtn) staffBtn.dataset.recordPage = "staff";
    contentEl.addEventListener("click", (ev) => {
      const staff = ev.target.closest(".outline-btn");
      if (staff) go("staff");
      const link = ev.target.closest(".table-head a");
      if (link) {
        const isDues =
          link.parentElement.textContent.includes("বকে") ||
          link.parentElement.textContent.includes("Due");
        if (isDues) go("dues");
        else go("fees", { tab: "receipts" });
      }
    });
    document.querySelector('.top-icon')?.addEventListener('click', () => go('settings', {tab:'general'}));
    setActiveNav(current);
  }

  return {
    init: init,
    go: go,
    back: back,
    refreshNav: () => setActiveNav(current),
    get current() {
      return current;
    },
  };
})();

/* ড্যাশবোর্ডের সংখ্যা হালনাগাদ (ডিজাইন অপরিবর্তিত — শুধু সংখ্যা বসে) */
MM.refreshDashboard = async function (scope = document) {
  if (!MM.tauri.ready()) return;
  try {
    const st = await MM.students.stats();
    scope.querySelectorAll(".stat").forEach((card) => {
      const label = card.querySelector("small");
      const value = card.querySelector("strong");
      if (label && value && label.textContent.trim() === "মোট শিক্ষার্থী") {
        value.textContent = MM.util.bnNum(st.total);
      }
    });
    const sum = [...scope.querySelectorAll(".summary-card")].find(
      (c) => c.textContent.indexOf("মোট শিক্ষার্থী") === 0,
    );
    if (sum && sum.querySelector("b"))
      sum.querySelector("b").textContent = MM.util.bnNum(st.total);
    if (!MM.records || MM.router.current !== "dashboard") return;
    const d = await MM.records.invoke("dashboard", { day: MM.util.today() });
    if (MM.router.current !== "dashboard") return;
    const values = scope.querySelectorAll(".stat strong");
    const due = d.dues.reduce((sum, r) => sum + r.due, 0);
    if (values[0]) values[0].textContent = MM.records.money(d.income);
    if (values[2]) values[2].textContent = MM.records.money(due);
    if (values[3]) {
      values[3].textContent = d.next[0]?.name || "কোনো পরীক্ষা নেই";
      values[3].style.setProperty("white-space", "normal", "important");
      values[3].style.fontSize = "15px";
    }
    const counts = Object.fromEntries(
      d.attendance.map((a) => [a.status, a.count]),
    );
    const present = (counts.present || 0) + (counts.late || 0),
      absent = counts.absent || 0,
      total = d.attendance.reduce((s, a) => s + a.count, 0),
      pct = total ? Math.round((present / total) * 100) : 0;
    const donut = scope.querySelector(".donut");
    if (donut) {
      donut.style.background =
        "conic-gradient(#1eb980 0 " + pct + "%,#ef476f " + pct + "% 100%)";
      donut.style.setProperty(
        "--attendance-percent",
        '"' + MM.util.bnNum(pct) + '%"',
      );
      donut.parentElement.querySelector("small").innerHTML =
        "উপস্থিত " +
        MM.util.bnNum(present) +
        "<br>অনুপস্থিত " +
        MM.util.bnNum(absent);
    }
    const staff = scope.querySelectorAll(".summary-card b");
    if (staff[0])
      staff[0].textContent = MM.util.bnNum(
        d.staff.find((s) => s.role === "শিক্ষক")?.count || 0,
      );
    if (staff[1])
      staff[1].textContent = MM.util.bnNum(
        d.staff
          .filter((s) => s.role !== "শিক্ষক")
          .reduce((n, s) => n + s.count, 0),
      );
    const tables = scope.querySelectorAll(".lower .empty-table tbody");
    const esc = MM.util.esc;
    if (tables[0])
      tables[0].innerHTML = d.dues.length
        ? d.dues
            .slice(0, 5)
            .map(
              (r) =>
                "<tr><td>" +
                esc(r.name_bn) +
                "</td><td>" +
                esc(r.class) +
                "</td><td>" +
                MM.records.money(r.due) +
                "</td></tr>",
            )
            .join("")
        : '<tr><td colspan="3">কোনো বকেয়া নেই</td></tr>';
    if (tables[1])
      tables[1].innerHTML = d.recent.length
        ? d.recent
            .map(
              (r) =>
                "<tr><td>" +
                esc(r.name_bn) +
                "</td><td>" +
                esc(r.class) +
                "</td><td>" +
                MM.records.money(r.amount) +
                "</td><td>" +
                MM.util.bnNum(esc(r.pay_date)) +
                "</td></tr>",
            )
            .join("")
        : '<tr><td colspan="4">কোনো পরিশোধ নেই</td></tr>';
    const bars = scope.querySelectorAll(".chart-placeholder .bar");
    bars.forEach((bar, i) => {
      const count = st.per_class?.[i]?.count || 0;
      bar.style.height =
        (count ? Math.max(10, Math.min(100, (count / st.total) * 100)) : 0) +
        "%";
      bar.title = st.per_class?.[i]?.class || "";
    });
  } catch (e) {}
};

document.addEventListener("DOMContentLoaded", function () {
  MM.router.init();
});
if (document.readyState !== "loading") MM.router.init();
