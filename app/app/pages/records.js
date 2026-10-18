window.MM = window.MM || {};
MM.records = (() => {
  const e = MM.util.esc,
    bn = MM.util.bnNum;
  const invoke = async (action, payload = {}) => {
    const result = await MM.tauri.invoke("records_call", { action, payload });
    if (["marks_save", "result_mark_save", "result_config_save", "exam_publish", "exam_save", "exam_delete"].includes(action)) {
      document.dispatchEvent(new CustomEvent("mm-academic-change"));
    }
    if (action === "attendance_save") document.dispatchEvent(new CustomEvent("mm-attendance-change"));
    if (["staff_save","staff_attendance_save","salary_pay","salary_void","salary_generate","salary_terms_save"].includes(action)) document.dispatchEvent(new CustomEvent("mm-staff-change"));
    if (["fee_pay","fee_void","fee_generate","fee_type_save","fee_type_delete","discount_save"].includes(action)) document.dispatchEvent(new CustomEvent("mm-financial-change"));
    if (["class_save","class_delete"].includes(action)) document.dispatchEvent(new CustomEvent("mm-class-change"));
    return result;
  };
  const money = (n) => "৳ " + bn(Number(n || 0).toLocaleString("en-US"));
  const icon = (name) =>
    '<svg aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  const button = (id, label, ic = "file", primary = false) =>
    '<button type="button" class="btn ' +
    (primary ? "btn-primary" : "btn-ghost") +
    '" id="' +
    id +
    '">' +
    icon(ic) +
    label +
    "</button>";
  const field = (id, label, type, value = "", attrs = "") =>
    "<label>" +
    label +
    '<input id="' +
    id +
    '" name="' +
    id +
    '" type="' +
    type +
    '" value="' +
    e(value) +
    '" ' +
    attrs +
    "></label>";
  const options = (rows, key, label, selected) =>
    rows
      .map(
        (r) =>
          '<option value="' +
          e(r[key]) +
          '"' +
          (String(r[key]) === String(selected) ? " selected" : "") +
          ">" +
          e(r[label]) +
          "</option>",
      )
      .join("");
  const select = (id, label, opts) =>
    "<label>" + label + '<select id="' + id + '">' + opts + "</select></label>";
  const classes = (catalog) => [
    ...new Set(
      catalog.classes.length || catalog.class_catalog_configured
        ? catalog.classes.map((r) => r.name)
        : MM.CLASSES,
    ),
  ];
  const classOptions = (catalog, all = true, selected = "") =>
    (all ? '<option value="">সকল শ্রেণি</option>' : "") +
    classes(catalog)
      .map(
        (c) =>
          '<option value="' + e(c) + '"' +
          (c === selected ? " selected" : "") +
          ">" +
          e(c) +
          "</option>",
      )
      .join("");
  const classNames = (catalog) => classes(catalog);
  const animateTab = (element) => {
    if (!element) return;
    element.classList.remove("mm-tab-content-enter");
  };
  const num = (el) => Number(el.value);
  const currentMonth = () => MM.util.today().slice(0, 7);
  function table(head, rows) {
    return (
      '<div class="r-table-wrap"><table><thead><tr>' +
      head.map((h) => "<th>" + h + "</th>").join("") +
      "</tr></thead><tbody>" +
      (rows.length
        ? rows.join("")
        : '<tr><td colspan="' +
          head.length +
          '" class="r-empty">কোনো তথ্য নেই</td></tr>') +
      "</tbody></table></div>"
    );
  }
  const cells = (cols, attr = "") =>
    "<tr " +
    attr +
    ">" +
    cols.map((c) => "<td>" + c + "</td>").join("") +
    "</tr>";
  function print(title, html) {
    return MM.printing.open(title, html);
  }
  function paged(root, head, rows, bind = () => {}, before = () => {}, prefix = 'r') {
    let page = 0;
    function show() {
      const items = typeof rows === "function" ? rows() : rows;
      root.innerHTML =
        table(head, items.slice(page * 50, (page + 1) * 50)) +
        '<div class="r-pager"><span>' +
        bn(items.length) +
        " টি</span><div>" +
        button(prefix+"Prev", "আগের", "chevron") +
        button(prefix+"Next", "পরের", "chevron") +
        "</div></div>";
      root.querySelector('#'+prefix+'Prev').disabled = page === 0;
      root.querySelector('#'+prefix+'Next').disabled = (page + 1) * 50 >= items.length;
      root.querySelector('#'+prefix+'Prev').onclick = () => {
        before();
        page--;
        show();
      };
      root.querySelector('#'+prefix+'Next').onclick = () => {
        before();
        page++;
        show();
      };
      bind(root);
    }
    show();
  }
  async function run(buttonEl, work, status) {
    if (buttonEl.disabled) return;
    buttonEl.disabled = true;
    try {
      const result = await work();
      if (status?.isConnected) {
        status.className = "r-status";
        status.textContent = "সংরক্ষিত হয়েছে";
      }
      return result;
    } catch (error) {
      if (status?.isConnected) {
        status.className = "r-status bad";
        status.textContent = String(error);
      } else MM.util.toast(String(error), "err");
      return null;
    } finally {
      if (buttonEl.isConnected) buttonEl.disabled = false;
    }
  }
  function modal(title, body, save, label = "সংরক্ষণ") {
    const previous = document.activeElement,
      wrap = document.createElement("div");
    wrap.className = "r-modal";
    wrap.innerHTML =
      '<form class="r-dialog" role="dialog" aria-modal="true" aria-label="' +
      e(title) +
      '"><div class="r-dialog-head"><h3>' +
      e(title) +
      '</h3><button type="button" class="r-dialog-close" aria-label="বন্ধ" title="বন্ধ">×</button></div>' +
      body +
      '<div class="r-status" role="status"></div><div class="r-actions">' +
      button("rCancel", "বন্ধ", "chevron") +
      '<button class="btn btn-primary" id="rSave" type="submit">' +
      icon("file") +
      label +
      "</button></div></form>";
    document.body.append(wrap);
    const form = wrap.querySelector("form"),
      status = wrap.querySelector(".r-status");
    let busy = false,
      closing = false;
    const close = () => {
      if (busy || closing || form.dataset.busy === 'true') return;
      closing = true;
      document.removeEventListener("keydown", key);
      wrap.classList.add("r-closing");
      window.setTimeout(() => {
        wrap.remove();
        previous?.isConnected && previous.focus();
      }, 160);
    };
    const key = (ev) => {
      if ([...document.querySelectorAll('.r-modal')].at(-1) !== wrap) return;
      if (ev.key === "Escape") {
        ev.preventDefault();
        close();
      }
      if (ev.key === "Tab") {
        const items = [
          ...form.querySelectorAll("button,input,select,textarea"),
        ].filter((x) => !x.disabled && x.getClientRects().length);
        if (!items.length) return;
        const first = items[0],
          last = items.at(-1);
        if (ev.shiftKey && document.activeElement === first) {
          ev.preventDefault();
          last.focus();
        } else if (!ev.shiftKey && document.activeElement === last) {
          ev.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    wrap.querySelector("#rCancel").onclick = close;
    wrap.querySelector(".r-dialog-close").onclick = close;
    form.onsubmit = async (ev) => {
      ev.preventDefault();
      if (busy || !form.reportValidity()) return;
      busy = true;
      form.querySelector("#rSave").disabled = true;
      form.querySelector("#rCancel").disabled = true;
      status.className = "r-status";
      status.textContent = "সংরক্ষণ হচ্ছে";
      try {
        await save(form);
        busy = false;
        close();
      } catch (err) {
        status.className = "r-status bad";
        status.textContent = String(err);
        busy = false;
        form.querySelector("#rSave").disabled = false;
        form.querySelector("#rCancel").disabled = false;
      }
    };
    form.querySelector("input,select,button")?.focus();
    return form;
  }
  function manageClasses(catalog, changed = () => {}) {
    const rows = catalog.classes.map((row) => ({ name: row.name }));
    const form = modal(
      "শ্রেণি পরিচালনা",
      '<div class="r-form-grid">' +
        select(
          "rClassOld",
          "সম্পাদনার শ্রেণি (নতুন যোগ করতে ফাঁকা রাখুন)",
          '<option value="">নতুন শ্রেণি</option>' +
            options(rows, "name", "name", ""),
        ) +
        field("rClassName", "শ্রেণির নাম", "text", "", 'required maxlength="120"') +
        "</div>" +
        button("rClassDelete", "নির্বাচিত শ্রেণি মুছুন", "trash"),
      async (f) => {
        await invoke("class_save", {
          old_name: f.querySelector("#rClassOld").value,
          name: f.querySelector("#rClassName").value,
        });
        const next = await invoke("catalog");
        Object.assign(catalog, next);
        await changed(catalog);
      },
    );
    const old = form.querySelector("#rClassOld");
    const name = form.querySelector("#rClassName");
    old.onchange = () => {
      name.value = old.value;
      if (old.value) name.focus();
    };
    form.querySelector("#rClassDelete").onclick = async (event) => {
      const buttonEl = event.currentTarget;
      if (!old.value) {
        form.querySelector(".r-status").textContent = "আগে একটি শ্রেণি নির্বাচন করুন";
        return;
      }
      if (!(await MM.util.confirm("শ্রেণিটি মুছলে ওই শ্রেণির শিক্ষার্থীদের বর্তমান শ্রেণি ফাঁকা হবে। শিক্ষার্থীদের তথ্য এবং আগের ফি, হাজিরা ও পরীক্ষার ইতিহাস অক্ষত থাকবে। মুছবেন?"))) return;
      buttonEl.disabled = true;
      try {
        await invoke("class_delete", { name: old.value });
        const next = await invoke("catalog");
        Object.assign(catalog, next);
        await changed(catalog);
        form.querySelector("#rCancel").click();
      } catch (error) {
        form.querySelector(".r-status").className = "r-status bad";
        form.querySelector(".r-status").textContent = String(error);
      } finally {
        if (buttonEl.isConnected) buttonEl.disabled = false;
      }
    };
    return form;
  }
  async function studentPicker(onSelect) {
    const f = modal(
      "শিক্ষার্থী নির্বাচন",
      field("rQuery", "নাম বা আইডি", "search") +
        '<div class="r-picker-results"></div>',
      async () => {
        throw new Error("শিক্ষার্থী নির্বাচন করুন");
      },
    );
    f.querySelector("#rSave").hidden = true;
    let ticket = 0;
    async function load() {
      const t = ++ticket;
      try {
        const result = await MM.students.list({
          search: f.querySelector("#rQuery").value,
          limit: 24,
        });
        if (!f.isConnected || t !== ticket) return;
        const box = f.querySelector(".r-picker-results");
        box.innerHTML =
          result.rows
            .map(
              (s) =>
                '<button type="button" data-st="' +
                s.id +
                '">' +
                e(s.name_bn) +
                " · " +
                e(s.student_id) +
                " · " +
                e(s.class) +
                "</button>",
            )
            .join("") || '<div class="r-empty">পাওয়া যায়নি</div>';
        box.querySelectorAll("button").forEach(
          (b) =>
            (b.onclick = () => {
              onSelect(result.rows.find((s) => s.id === Number(b.dataset.st)));
              f.querySelector("#rCancel").click();
            }),
        );
      } catch (err) {
        f.querySelector(".r-status").textContent = String(err);
      }
    }
    let timer;
    f.querySelector("#rQuery").oninput = () => {
      clearTimeout(timer);
      timer = setTimeout(load, 200);
    };
    await load();
  }
  async function render(root, page, params = {}) {
    const labels = {
      fees: "বেতন ও ফি",
      dues: "বকেয়া ব্যবস্থাপনা",
      "question-bank": "প্রশ্ন ব্যাংক",
      salary: "স্টাফের বেতন",
      staff: "শিক্ষক ও কর্মচারী",
      'staff-profile': "স্টাফ প্রোফাইল",
      'staff-attendance': "শিক্ষকদের হাজিরা",
      attendance: "উপস্থিতি ব্যবস্থাপনা",
      exams: "পরীক্ষা",
      results: "ফলাফল",
    };
    const token = Symbol();
    root._recordsToken = token;
    root.innerHTML =
      '<section class="records"><header><h2>' +
      (labels[page] || labels.fees) +
      '</h2></header><div class="r-body"><div class="r-empty">লোড হচ্ছে</div></div></section>';
    const body = root.querySelector(".r-body");
    try {
      const catalog = await invoke("catalog");
      if (root._recordsToken !== token || !root.isConnected) return;
      const ctx = {
        root,
        body,
        catalog,
        page,
        params,
        alive: () => root.isConnected && root._recordsToken === token && root.contains(body),
      };
      if (page === "question-bank") {
        ctx.body.innerHTML =
          '<section class="records-page"><div class="fcard"><div class="fcard-body"><p class="r-empty">প্রশ্ন ব্যাংকের মডিউল প্রস্তুত করা হচ্ছে।</p></div></div></section>';
      } else if (page === "fees" || page === "dues") await fees(ctx);
      else if (page === "staff") await MM.staffDetails.render(ctx);
      else if (page === "staff-profile") await MM.staffProfile.render(ctx);
      else if (page === "staff-attendance") await MM.staffProfile.daily(ctx);
      else if (page === "salary") await salary(ctx);
      else if (page === "attendance") await attendance(ctx);
      else await exams(ctx);
    } catch (err) {
      if (root._recordsToken === token && root.isConnected)
        body.innerHTML = '<div class="r-error">' + e(String(err)) + "</div>";
    }
  }
  async function fees(ctx) {
    const { body, catalog, params } = ctx;
    let sid = Number(params.studentId || 0),
      tab =
        ctx.page === "dues" || params.tab === "dues"
          ? "dues"
          : ["charges", "dues", "receipts", "types", "discounts"].includes(params.tab)
            ? params.tab
            : "charges",
      sequence = 0,
      data = null;
    body.innerHTML =
      '<div class="r-tabs">' +
      [
        ["charges", "ফি সংগ্রহ"],
        ["dues", "বকেয়া"],
        ["receipts", "রসিদ"],
        ["types", "ফি নির্ধারণ"],
        ["discounts", "ছাড়ের তালিকা"],
      ]
        .map(([id, t]) => '<button data-tab="' + id + '">' + t + "</button>")
        .join("") +
      '</div><div class="r-toolbar">' +
      field("rSearch", "নাম বা আইডি", "search") +
      select("rClass", "শ্রেণি", classOptions(catalog)) +
      select(
        "rFeeFilter",
        "ফি",
        '<option value="">সকল ফি</option>' +
          options(catalog.types, "id", "name", ""),
      ) +
      button("rStudent", "শিক্ষার্থী", "users") +
      button("rAll", "সব শিক্ষার্থী", "list") +
      button("rRate", "মাসিক বেতন", "money") +
      button("rDiscount", "ছাড়", "money") +
      button("rPrint", "প্রিন্ট", "print") +
      '</div><div class="r-banner" id="rStudentName"></div><div id="rGenerate" class="r-toolbar">' +
      field("rMonth", "মাস", "month", currentMonth(), "required") +
      select(
        "rType",
        "ফি",
        options(
          catalog.types.filter((t) => t.active),
          "id",
          "name",
          1,
        ),
      ) +
      button("rGenerateBtn", "হিসাব তৈরি", "file", true) +
      '</div><div id="rTotals" class="r-summary"></div><div class="r-status" role="status"></div><div id="rRows"></div>';
    const $ = (id) => body.querySelector("#" + id);
    const status = body.querySelector(".r-status");
    if (sid) {
      const s = await MM.students.get(sid);
      if (!ctx.alive()) return;
      $("rStudentName").textContent = s ? s.name_bn + " · " + s.student_id : "";
    }
    function paint() {
      if (!ctx.alive() || !data) return;
      body
        .querySelectorAll("[data-tab]")
        .forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
      $("rGenerate").hidden = ['types','receipts','discounts'].includes(tab);
      $("rFeeFilter").hidden = !["charges", "dues", "receipts"].includes(tab);
      ["rSearch", "rClass", "rFeeFilter"].forEach(
        (id) => ($(id).closest("label").hidden = !["charges", "dues", "receipts"].includes(tab)),
      );
      ["rStudent", "rAll"].forEach(
        (id) => ($(id).hidden = !["charges", "dues"].includes(tab)),
      );
      ["rRate", "rDiscount"].forEach(
        (id) => ($(id).hidden = !["charges", "dues"].includes(tab)),
      );
      $("rRate").disabled = !sid;
      $("rDiscount").disabled = !sid;
      $("rAll").disabled = !sid;
      $('rPrint').hidden = tab === 'discounts';
      if (tab === 'discounts') {
        $('rTotals').innerHTML='';
        MM.discounts.renderList($('rRows'),catalog);
        return;
      }
      if (tab === "types") {
        $("rTotals").innerHTML = button("rNewType", "নতুন ফি", "money", true);
        $("rNewType").onclick = () => editType();
        paged(
          $("rRows"),
          ["নাম", "পরিমাণ", "সময়", "শ্রেণি", "অবস্থা", "কাজ"],
          catalog.types.map((t) =>
            cells([
              e(t.name),
              t.tuition && t.amount === 0
                ? "শিক্ষার্থীভিত্তিক"
                : money(t.amount),
              e(
                {
                  monthly: "মাসিক",
                  yearly: "বার্ষিক",
                  once: "এককালীন",
                  manual: "অন্যান্য",
                }[t.frequency],
              ),
              e(t.class || "সকল"),
              t.active ? "চালু" : "বন্ধ",
              '<div class="r-actions"><button class="btn btn-ghost" data-edit="' +
                t.id +
                '">' +
                icon("file") +
                "সম্পাদনা</button>" +
                (t.id === 1
                  ? ""
                  : '<button class="btn btn-ghost" data-delete="' +
                    t.id +
                    '" title="ফি মুছুন">' +
                    icon("trash") +
                    "মুছুন</button>") +
                "</div>",
            ]),
          ),
          (box) => {
            box
              .querySelectorAll("[data-edit]")
              .forEach(
                (b) =>
                  (b.onclick = () =>
                    editType(
                      catalog.types.find(
                        (t) => t.id === Number(b.dataset.edit),
                      ),
                    )),
              );
            box.querySelectorAll("[data-delete]").forEach((b) => {
              b.onclick = async () => {
                const targetType = catalog.types.find(
                  (t) => t.id === Number(b.dataset.delete),
                );
                if (
                  !(await MM.util.confirm(
                    (targetType ? '"' + targetType.name + '" — ' : "") +
                      "এই ফি মুছবেন? কোনো হিসাব বা ছাড়ের ইতিহাস থাকলে মুছতে দেওয়া হবে না।",
                  ))
                )
                  return;
                await run(
                  b,
                  async () => {
                    await invoke("fee_type_delete", {
                      id: Number(b.dataset.delete),
                    });
                    const tr = b.closest("tr");
                    if (tr) {
                      tr.style.transition =
                        "opacity .18s ease, transform .18s cubic-bezier(.22,1,.36,1)";
                      tr.style.opacity = "0";
                      tr.style.transform = "translateX(10px) scale(.985)";
                      await new Promise((r) => setTimeout(r, 140));
                    }
                    const next = await invoke("catalog");
                    catalog.types = next.types;
                    catalog.class_rates = next.class_rates;
                    $("rType").innerHTML = options(
                      catalog.types.filter((type) => type.active),
                      "id",
                      "name",
                      1,
                    );
                    $("rFeeFilter").innerHTML =
                      '<option value="">সকল ফি</option>' +
                      options(catalog.types, "id", "name", "");
                    await load();
                    MM.util.toast("ফি সফলভাবে মুছে ফেলা হয়েছে");
                  },
                  status,
                );
              };
            });
          },
        );
        typeControls();
        return;
      }
      if (tab === "receipts") {
        $("rTotals").textContent = "মোট রসিদ: " + bn(data.receipts.length);
        paged(
          $("rRows"),
          [
            "ক্রম",
            "রসিদ",
            "শিক্ষার্থী",
            "ফি / সময়",
            "তারিখ",
            "পরিমাণ",
            "অবস্থা",
            "কাজ",
          ],
          data.receipts.map((r, index) =>
            cells([
              bn(index + 1),
              "MM-" + r.id,
              e(r.name_bn),
              e(r.fee_name) + " · " + e(r.period),
              bn(e(r.pay_date)),
              money(r.amount),
              r.void_reason ? "বাতিল: " + e(r.void_reason) : "জমা",
              '<div class="r-actions"><button class="btn btn-ghost" data-print="' +
                r.id +
                '">' +
                icon("print") +
                "</button>" +
                (!r.void_reason
                  ? '<button class="btn btn-ghost" data-void="' +
                    r.id +
                    '">বাতিল</button>'
                  : "") +
                "</div>",
            ]),
          ),
          (box) => {
            box.querySelectorAll("[data-print]").forEach((b) => {
              b.title = "রসিদ প্রিন্ট";
              b.onclick = () =>
                receipt(
                  data.receipts.find((r) => r.id === Number(b.dataset.print)),
                  false,
                );
            });
            box
              .querySelectorAll("[data-void]")
              .forEach(
                (b) =>
                  (b.onclick = () =>
                    voidPayment(false, Number(b.dataset.void), load)),
              );
          },
        );
        return;
      }
      const rows =
        tab === "dues" ? data.rows.filter((r) => r.due > 0) : data.rows;
      $("rTotals").innerHTML =
        "মূল ফি <b>" + money(rows.reduce((n,r)=>n+r.original_amount,0)) +
        "</b> ছাড় <b>" + money(rows.reduce((n,r)=>n+r.discount_amount,0)) +
        "</b> পরিশোধযোগ্য <b>" +
        money(rows.reduce((n, r) => n + r.amount, 0)) +
        "</b> পরিশোধ <b>" +
        money(rows.reduce((n, r) => n + r.paid, 0)) +
        "</b> বকেয়া <b>" +
        money(rows.reduce((n, r) => n + Math.max(0, r.due), 0)) +
        "</b>";
      paged(
        $("rRows"),
        [
          "ক্রম",
          "শিক্ষার্থী",
          "শ্রেণি",
          "ফি",
          "সময়",
          "মূল ফি / ছাড়",
          "পরিশোধযোগ্য",
          "পরিশোধ",
          "বকেয়া / অগ্রিম",
          "কাজ",
        ],
        rows.map((r, index) =>
          cells([
            bn(index + 1),
            e(r.name_bn) + "<small>" + e(r.student_id) + "</small>",
            e(r.class),
            e(r.fee_name),
            e(r.period === "once" ? "এককালীন" : r.period),
            money(r.original_amount) + '<small>ছাড়: ' + money(r.discount_amount) + ' · ' + e(MM.discounts.label(r)) + '</small>',
            money(r.amount),
            money(r.paid),
            money(Math.abs(r.due)) + (r.due < 0 ? " অগ্রিম" : ""),
            r.due > 0
              ? '<button class="btn btn-primary" data-pay="' +
                r.id +
                '">' +
                icon("money") +
                "জমা</button>"
              : "পরিশোধিত",
          ]),
        ),
        (box) =>
          box.querySelectorAll("[data-pay]").forEach(
            (b) =>
              (b.onclick = () =>
                pay(
                  data.rows.find((r) => r.id === Number(b.dataset.pay)),
                  false,
                  load,
                )),
          ),
      );
    }
    async function load() {
      const n = ++sequence;
      const result = await invoke("fee_list", {
        student_id: sid,
        class: $("rClass").value,
        search: $("rSearch").value,
        type_id: num($("rFeeFilter")) || 0,
        dues: false,
      });
      if (!ctx.alive() || n !== sequence) return;
      data = result;
      paint();
    }
    function refresh() {
      load().catch((err) => {
        if (ctx.alive()) {
          status.className = "r-status bad";
          status.textContent = String(err);
        }
      });
    }
    body.querySelectorAll("[data-tab]").forEach(
      (b) =>
        (b.onclick = () => {
          tab = b.dataset.tab;
          const h2 = ctx.root.querySelector("header h2");
          if (h2 && (ctx.page === "dues" || ctx.page === "fees")) {
            const title = tab === "dues" ? "বকেয়া ব্যবস্থাপনা" : "বেতন ও ফি";
            h2.textContent = MM.i18n ? MM.i18n.t(title) : title;
          }
          animateTab($("rTotals"));
          animateTab($("rRows"));
          paint();
        }),
    );
    let t;
    $("rSearch").oninput = () => {
      clearTimeout(t);
      t = setTimeout(refresh, 200);
    };
    $("rClass").onchange = refresh;
    $("rFeeFilter").onchange = refresh;
    $("rStudent").onclick = () =>
      studentPicker((s) => {
        sid = s.id;
        $("rStudentName").textContent = s.name_bn + " · " + s.student_id;
        refresh();
      });
    $("rAll").onclick = () => {
      sid = 0;
      $("rStudentName").textContent = "";
      refresh();
    };
    $("rDiscount").onclick = () => MM.discounts.manage(sid, refresh);
    $("rRate").onclick = () =>
      modal(
        "মাসিক বেতন নির্ধারণ",
        field(
          "rAmount",
          "টাকা",
          "number",
          "",
          'min="0" max="100000000" step="1" required',
        ),
        async (f) => {
          await invoke("rate_save", {
            student_id: sid,
            amount: num(f.querySelector("#rAmount")),
          });
          MM.util.toast("পরবর্তী নতুন মাসের হিসাবে প্রযোজ্য হবে");
        },
      );
    $("rGenerateBtn").onclick = () =>
      run(
        $("rGenerateBtn"),
        async () => {
          if (
            !(await MM.util.confirm(
              "নির্বাচিত মাসের হিসাব তৈরি করবেন? আগে তৈরি করা হিসাব বদলাবে না।",
            ))
          )
            return;
          const r = await invoke("fee_generate", {
            type_id: num($("rType")),
            month: $("rMonth").value,
            class: $("rClass").value,
            student_id: sid,
          });
          $("rFeeFilter").value = $("rType").value;
          await load();
          status.textContent = bn(r.created) + " টি নতুন হিসাব তৈরি";
        },
        status,
      );
    $("rPrint").onclick = () => {
      if (tab === "types")
        print(
          "ফি নির্ধারণ",
          table(
            ["ফি", "টাকা", "সময়"],
            catalog.types.map((r) =>
              cells([e(r.name), money(r.amount), e(r.frequency)]),
            ),
          ),
        );
      else if (tab === "receipts")
        print(
          "রসিদ তালিকা",
          table(
            ["রসিদ", "নাম", "সময়", "টাকা", "অবস্থা"],
            data.receipts.map((r) =>
              cells([
                "MM-" + r.id,
                e(r.name_bn),
                e(r.period),
                money(r.amount),
                r.void_reason ? "বাতিল" : "জমা",
              ]),
            ),
          ),
        );
      else
        print(
          tab === "dues" ? "বকেয়া তালিকা" : "ফি হিসাব",
          table(
            ["নাম", "ফি", "সময়", "মূল ফি", "ছাড়", "পরিশোধযোগ্য", "জমা", "বকেয়া"],
            data.rows
              .filter((r) => tab !== "dues" || r.due > 0)
              .map((r) =>
                cells([
                  e(r.name_bn),
                  e(r.fee_name),
                  e(r.period),
                  money(r.original_amount),
                  money(r.discount_amount),
                  money(r.amount),
                  money(r.paid),
                  money(r.due),
                ]),
              ),
          ) + '<div class="r-summary">'+$('rTotals').innerHTML+'</div>',
        );
    };
    function editType(
      type = {
        id: 0,
        name: "",
        amount: 0,
        frequency: "monthly",
        class: "",
        active: 1,
      },
    ) {
      modal(
        "ফি নির্ধারণ",
        '<div class="r-form-grid">' +
          field(
            "rName",
            "ফি-র নাম",
            "text",
            type.name,
            'required maxlength="200"',
          ) +
          field(
            "rAmount",
            "টাকা",
            "number",
            type.amount,
            'min="0" max="100000000" step="1" required',
          ) +
          select(
            "rFrequency",
            "সময়",
            options(
              [
                { id: "monthly", name: "মাসিক" },
                { id: "yearly", name: "বার্ষিক" },
                { id: "once", name: "এককালীন" },
                { id: "manual", name: "অন্যান্য / মাসভিত্তিক" },
              ],
              "id",
              "name",
              type.frequency,
            ),
          ) +
          select(
            "rTypeClass",
            "শ্রেণি",
            classOptions(catalog, true, type.class),
          ) +
          select(
            "rActive",
            "অবস্থা",
            options(
              [
                { id: 1, name: "চালু" },
                { id: 0, name: "বন্ধ" },
              ],
              "id",
              "name",
              type.active,
            ),
          ) +
          "</div>",
        async (f) => {
          await invoke("fee_type_save", {
            id: type.id,
            name: f.querySelector("#rName").value,
            amount: num(f.querySelector("#rAmount")),
            frequency: f.querySelector("#rFrequency").value,
            class: f.querySelector("#rTypeClass").value,
            active: num(f.querySelector("#rActive")),
          });
          const c = await invoke("catalog");
          catalog.types = c.types;
          catalog.class_rates = c.class_rates;
          $("rType").innerHTML = options(
            catalog.types.filter((t) => t.active),
            "id",
            "name",
            1,
          );
          $("rFeeFilter").innerHTML =
            '<option value="">সকল ফি</option>' +
            options(catalog.types, "id", "name", "");
          await load();
        },
      );
    }
    function typeControls() {
      if ($("rClassRate")) return;
      $("rTotals").insertAdjacentHTML(
        "beforeend",
        button("rClassRate", "শ্রেণির ফি", "cap"),
      );
      $("rClassRate").onclick = () => {
        const rates = catalog.class_rates || [];
        const f = modal(
          "শ্রেণিভিত্তিক ফি",
          '<div class="r-form-grid">' +
            select("rFeeType", "ফি", options(catalog.types, "id", "name", 1)) +
            select("rFeeClass", "শ্রেণি", classOptions(catalog, false)) +
            field(
              "rFeeAmount",
              "টাকা",
              "number",
              0,
              'min="0" max="100000000" step="1" required',
            ) +
            "</div>",
          async (form) => {
            await invoke("class_rate_save", {
              type_id: num(form.querySelector("#rFeeType")),
              class: form.querySelector("#rFeeClass").value,
              amount: num(form.querySelector("#rFeeAmount")),
            });
            catalog.class_rates = (await invoke("catalog")).class_rates;
          },
        );
        const update = () => {
          f.querySelector("#rFeeAmount").value =
            rates.find(
              (r) =>
                r.type_id === num(f.querySelector("#rFeeType")) &&
                r.class === f.querySelector("#rFeeClass").value,
            )?.amount ??
            catalog.types.find(
              (r) => r.id === num(f.querySelector("#rFeeType")),
            )?.amount ??
            0;
        };
        f.querySelector("#rFeeType").onchange = f.querySelector(
          "#rFeeClass",
        ).onchange = update;
        update();
      };
    }
    await load();
  }
  function pay(row, salary, reload) {
    if (!salary) { MM.feePayment.open(row, reload).catch(err => MM.util.toast(String(err), "err")); return; }
    const request_id = crypto.randomUUID();
    modal(
      salary ? "বেতন প্রদান" : "ফি জমা",
      '<div class="r-banner"><strong>' +
        e(row.name_bn || row.name) +
        "</strong> · " +
        e(salary && row.cycle_start && row.cycle_end ? row.cycle_start + ' – ' + row.cycle_end : row.period || row.month) +
        " · বকেয়া " +
        money(row.due) +
        '</div><div class="r-form-grid">' +
        field(
          "rAmount",
          "টাকা",
          "number",
          row.due,
          'min="1" max="' + row.due + '" step="1" required',
        ) +
        field("rPayDate", "তারিখ", "date", MM.util.today(), "required") +
        select(
          "rMethod",
          "মাধ্যম",
          "<option>নগদ</option><option>ব্যাংক</option><option>বিকাশ</option><option>নগদ মোবাইল</option><option>অন্যান্য</option>",
        ) +
        field("rNote", "মন্তব্য", "text", "", 'maxlength="1000"') +
        "</div>",
      async (f) => {
        const r = await invoke(salary ? "salary_pay" : "fee_pay", {
          charge_id: row.id,
          amount: num(f.querySelector("#rAmount")),
          pay_date: f.querySelector("#rPayDate").value,
          method: f.querySelector("#rMethod").value,
          note: f.querySelector("#rNote").value,
          request_id,
        });
        await reload();
        MM.util.toast("রসিদ " + (salary ? "SP-" : "MM-") + r.id + " সংরক্ষিত");
      },
    );
  }
  function receipt(r, salary) {
    print(
      (salary ? "বেতন ভাউচার SP-" : "ফি রসিদ MM-") + r.id,
      table(
        ["বিবরণ", "তথ্য"],
        [
          ...(r.identity_legacy ? [cells(["পুরোনো রসিদ","পরিচয় আপডেটের সময়কার সংরক্ষিত তথ্য; মূল পরিচয় আগে সংরক্ষিত ছিল না"])] : []),
          cells(["নাম", e(r.name_bn || r.name)]),
          cells(["আইডি", e(r.student_id || "")]),
          cells([
            "ফি / মাস",
            e(r.fee_name || "বেতন") + " · " + e(r.period || r.month),
          ]),
          cells(["তারিখ", bn(e(r.pay_date))]),
          ...(!salary ? [
            cells(["মূল ফি",money(r.original_amount)]),
            cells(["ছাড় · "+MM.discounts.label(r),money(r.discount_amount)]),
            cells(["পরিশোধযোগ্য",money(r.bill_payable)]),
            cells(["মোট জমা (এই রসিদ পর্যন্ত)",money(r.paid_total)]),
            cells(["বকেয়া (এই রসিদে)",money(r.due_at_receipt)]),
          ] : []),
          cells(["টাকা", money(r.amount)]),
          cells(["মাধ্যম", e(r.method)]),
          cells(["মন্তব্য", e(r.note)]),
          cells([
            "অবস্থা",
            r.void_reason ? "বাতিল: " + e(r.void_reason) : "জমা",
          ]),
        ],
      ),
    );
  }
  function voidPayment(salary, id, reload) {
    modal(
      "রসিদ বাতিল",
      field("rReason", "বাতিলের কারণ", "text", "", 'required maxlength="1000"'),
      async (f) => {
        await invoke(salary ? "salary_void" : "fee_void", {
          id,
          reason: f.querySelector("#rReason").value,
        });
        await reload();
      },
      "বাতিল করুন",
    );
  }
  function staff(ctx) {
    const { body, catalog } = ctx;
    body.innerHTML =
      '<div class="r-toolbar">' +
      button("rNewStaff", "নতুন স্টাফ", "staff", true) +
      button("rPrint", "প্রিন্ট", "print") +
      '</div><div id="rRows"></div>';
    function paint() {
      paged(
        body.querySelector("#rRows"),
        ["নাম", "পদ", "মোবাইল", "মাসিক বেতন", "যোগদান", "অবস্থা", "কাজ"],
        catalog.staff.map((s) =>
          cells([
            e(s.name),
            e(s.role),
            bn(e(s.phone)),
            money(s.salary),
            bn(e(s.join_date)),
            s.active ? "সক্রিয়" : "নিষ্ক্রিয়",
            '<button class="btn btn-ghost" data-edit="' +
              s.id +
              '">' +
              icon("file") +
              "সম্পাদনা</button>",
          ]),
        ),
        (box) =>
          box
            .querySelectorAll("[data-edit]")
            .forEach(
              (b) =>
                (b.onclick = () =>
                  edit(
                    catalog.staff.find((s) => s.id === Number(b.dataset.edit)),
                  )),
            ),
      );
    }
    function edit(
      s = {
        id: 0,
        name: "",
        role: "শিক্ষক",
        phone: "",
        salary: 0,
        join_date: MM.util.today(),
        active: 1,
      },
    ) {
      modal(
        "স্টাফ তথ্য",
        '<div class="r-form-grid">' +
          field("rName", "নাম", "text", s.name, 'required maxlength="200"') +
          select(
            "rRole",
            "পদ",
            options(
              [
                { id: "শিক্ষক", name: "শিক্ষক" },
                { id: "কর্মচারী", name: "কর্মচারী" },
              ],
              "id",
              "name",
              s.role,
            ),
          ) +
          field("rPhone", "মোবাইল", "text", s.phone, 'maxlength="50"') +
          field(
            "rSalary",
            "মাসিক বেতন",
            "number",
            s.salary,
            'min="0" step="1" max="100000000" required',
          ) +
          field("rJoined", "যোগদান", "date", s.join_date, "required") +
          select(
            "rActive",
            "অবস্থা",
            options(
              [
                { id: 1, name: "সক্রিয়" },
                { id: 0, name: "নিষ্ক্রিয়" },
              ],
              "id",
              "name",
              s.active,
            ),
          ) +
          "</div>",
        async (f) => {
          await invoke("staff_save", {
            id: s.id,
            name: f.querySelector("#rName").value,
            role: f.querySelector("#rRole").value,
            phone: f.querySelector("#rPhone").value,
            salary: num(f.querySelector("#rSalary")),
            join_date: f.querySelector("#rJoined").value,
            active: num(f.querySelector("#rActive")),
          });
          catalog.staff = (await invoke("catalog")).staff;
          if (ctx.alive()) paint();
        },
      );
    }
    body.querySelector("#rNewStaff").onclick = () => edit();
    body.querySelector("#rPrint").onclick = () =>
      print(
        "স্টাফ তালিকা",
        table(
          ["নাম", "পদ", "মোবাইল", "বেতন", "অবস্থা"],
          catalog.staff.map((s) =>
            cells([
              e(s.name),
              e(s.role),
              bn(e(s.phone)),
              money(s.salary),
              s.active ? "সক্রিয়" : "নিষ্ক্রিয়",
            ]),
          ),
        ),
      );
    paint();
    if (ctx.params.new) edit();
  }
  async function salary(ctx) {
    const { body } = ctx;
    let data, monthInitialized = false;
    body.innerHTML =
      '<div class="r-toolbar">' +
      field("rMonth", "মাস", "month", currentMonth(), "required") +
      button("rGenerate", "বেতন হিসাব তৈরি", "money", true) +
      button("rStaff", "স্টাফ তালিকা", "staff") +
      button("rPrint", "প্রিন্ট", "print") +
      '</div><div class="r-status" role="status"></div><div class="r-summary" id="rTotals"></div><div id="rRows"></div><h3 class="r-history">প্রদান ইতিহাস</h3><div id="rReceipts"></div>';
    const $ = (id) => body.querySelector("#" + id);
    async function load() {
      data = await invoke("salary_list");
      if (!ctx.alive()) return;
      if (!monthInitialized && data.cycle_month) {
        $("rMonth").value = data.cycle_month;
        monthInitialized = true;
      }
      $("rTotals").innerHTML =
        "বকেয়া <b>" +
        money(data.rows.reduce((s, r) => s + Math.max(0, r.due), 0)) +
        "</b>";
      paged(
        $("rRows"),
        ["নাম", "পদ", "মাস", "নির্ধারিত", "প্রদান", "বকেয়া", "কাজ"],
        data.rows.map((r) =>
          cells([
            e(r.name),
            e(r.role),
            e(r.cycle_start && r.cycle_end ? r.cycle_start + " – " + r.cycle_end : r.month),
            money(r.amount),
            money(r.paid),
            money(r.due),
            r.due > 0
              ? '<button class="btn btn-primary" data-pay="' +
                r.id +
                '">' +
                icon("money") +
                "প্রদান</button>"
              : "পরিশোধিত",
          ]),
        ),
        (box) =>
          box.querySelectorAll("[data-pay]").forEach(
            (b) =>
              (b.onclick = () =>
                pay(
                  data.rows.find((r) => r.id === Number(b.dataset.pay)),
                  true,
                  load,
                )),
          ),
      );
      paged(
        $("rReceipts"),
        ["ভাউচার", "নাম", "মাস", "টাকা", "তারিখ", "অবস্থা", "কাজ"],
        data.receipts.map((r) =>
          cells([
            "SP-" + r.id,
            e(r.name),
            e(r.cycle_start && r.cycle_end ? r.cycle_start + " – " + r.cycle_end : r.month),
            money(r.amount),
            e(r.pay_date),
            r.void_reason ? "বাতিল: " + e(r.void_reason) : "প্রদান",
            '<div class="r-actions"><button class="btn btn-ghost" title="ভাউচার প্রিন্ট" data-print="' +
              r.id +
              '">' +
              icon("print") +
              "</button>" +
              (!r.void_reason
                ? '<button class="btn btn-ghost" data-void="' +
                  r.id +
                  '">বাতিল</button>'
                : "") +
              "</div>",
          ]),
        ),
        (box) => {
          box.querySelectorAll("[data-print]").forEach(
            (b) =>
              (b.onclick = () =>
                receipt(
                  data.receipts.find((r) => r.id === Number(b.dataset.print)),
                  true,
                )),
          );
          box
            .querySelectorAll("[data-void]")
            .forEach(
              (b) =>
                (b.onclick = () =>
                  voidPayment(true, Number(b.dataset.void), load)),
            );
        },
      );
    }
    $("rGenerate").onclick = () =>
      run(
        $("rGenerate"),
        async () => {
          await invoke("salary_generate", { month: $("rMonth").value });
          await load();
        },
        body.querySelector(".r-status"),
      );
    $("rStaff").onclick = () => MM.router.go("staff");
    $("rPrint").onclick = () =>
      print(
        "বেতন হিসাব",
        table(
          ["নাম", "মাস", "বেতন", "প্রদান", "বকেয়া"],
          data.rows.map((r) =>
            cells([
              e(r.name),
              e(r.month),
              money(r.amount),
              money(r.paid),
              money(r.due),
            ]),
          ),
        ),
      );
    await load();
  }
  async function attendance(ctx) {
    const {body,catalog,params}=ctx;
    let dayData,dayKey='',sequence=0;
    body.innerHTML='<div class="a-view-tabs" role="tablist"><button type="button" role="tab" id="rDailyTab" aria-selected="true">হাজিরা</button><button type="button" role="tab" id="rReportTab" aria-selected="false">রিপোর্ট</button></div><div id="rDaily"><div class="r-toolbar">'+
      field('rDay','তারিখ','date',MM.util.today(),'required')+select('rClass','শ্রেণি',classOptions(catalog,false,params.class||catalog.classes[0]?.name||MM.CLASSES[0]))+
      button('rLoad','হাজিরা','calendar')+button('rAllPresent','সব উপস্থিত','users')+button('rAllAbsent','সব অনুপস্থিত','users')+button('rSave','সংরক্ষণ','file',true)+
      '</div><div class="r-status" role="status"></div><div id="rRows"></div></div><div id="rMonthly" hidden></div>';
    const $=id=>body.querySelector('#'+id),status=body.querySelector('.r-status');
    const statuses=[['present','উপস্থিত'],['absent','অনুপস্থিত'],['leave','ছুটি'],['late','বিলম্ব']];
    function capture() {
      if(!dayData)return;
      body.querySelectorAll('tr[data-st]').forEach(tr=>{
        const r=dayData.rows.find(r=>r.id===Number(tr.dataset.st));
        if(r.status==='leave')r.note=tr.querySelector('input').value;
      });
    }
    function update(tr,r) {
      tr.querySelectorAll('[data-status]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.status===r.status)));
      const input=tr.querySelector('input');input.disabled=r.status!=='leave';input.value=r.note;
    }
    async function load() {
      const n=++sequence,day=$('rDay').value,className=$('rClass').value;
      const result=await invoke('attendance_get',{day,class:className});
      if(!ctx.alive() || n!==sequence)return;
      dayData=result;dayKey=day+'|'+className;result.rows.forEach(r=>r.savedNote=r.note);status.textContent='';
      paged($('rRows'),['রোল','আইডি','নাম','হাজিরা','মন্তব্য'],()=>result.rows.map(r=>cells([
        bn(e(r.roll)),e(r.student_id),e(r.name_bn),
        '<div class="a-status-buttons" role="group" aria-label="'+e(r.name_bn)+' হাজিরা">'+statuses.map(([s,label])=>'<button type="button" data-status="'+s+'" aria-pressed="'+String(s===r.status)+'">'+MM.i18n.t(label)+'</button>').join('')+'</div>',
        '<input aria-label="'+e(r.name_bn)+' মন্তব্য" value="'+e(r.note)+'" maxlength="1000"'+(r.status==='leave'?'':' disabled')+'>'
      ],'data-st="'+r.id+'"')),box=>{
        box.querySelectorAll('tr[data-st]').forEach(tr=>{
          const r=result.rows.find(r=>r.id===Number(tr.dataset.st));
          tr.querySelector('input').oninput=capture;
          tr.querySelectorAll('[data-status]').forEach(b=>b.onclick=()=>{capture();r.status=b.dataset.status;if(r.status!=='leave')r.note=r.savedNote;update(tr,r);});
        });
      },capture);
      $('rSave').disabled=!result.rows.length;
    }
    $('rLoad').onclick=()=>run($('rLoad'),load,status);
    $('rDay').onchange=$('rClass').onchange=()=>{
      ++sequence;dayKey='';$('rSave').disabled=true;$('rRows').innerHTML='<div class="r-empty">হাজিরা খুলুন</div>';
    };
    function bulk(value) {
      if(!dayKey)return;
      capture();dayData.rows.forEach(r=>{r.status=value;r.note=r.savedNote;});
      body.querySelectorAll('tr[data-st]').forEach(tr=>update(tr,dayData.rows.find(r=>r.id===Number(tr.dataset.st))));
    }
    $('rAllPresent').onclick=()=>bulk('present');$('rAllAbsent').onclick=()=>bulk('absent');
    $('rSave').onclick=()=>run($('rSave'),async()=>{
      if(dayKey!==$('rDay').value+'|'+$('rClass').value)throw Error('আবার হাজিরা খুলুন');
      capture();
      if(dayData.rows.some(r=>!r.status))throw Error('সব শিক্ষার্থীর হাজিরা নির্বাচন করুন');
      await invoke('attendance_save',{day:$('rDay').value,class:$('rClass').value,revision:dayData.revision,rows:dayData.rows.map(r=>({id:r.id,status:r.status,note:r.note}))});
      await load();
    },status);
    function view(report) {
      capture();$('rDaily').hidden=report;$('rMonthly').hidden=!report;
      $('rDailyTab').setAttribute('aria-selected',String(!report));$('rReportTab').setAttribute('aria-selected',String(report));
      if(report) {
        $('rMonthly').innerHTML='<div class="r-toolbar">'+select('rReportClass','শ্রেণি',classOptions(catalog,true,params.studentId?'':$('rClass').value))+'</div><div data-monthly-register></div>';
        const refresh=()=>MM.attendanceRegister.mount(body.querySelector('[data-monthly-register]'),{className:$('rReportClass').value,studentId:Number(params.studentId||0),alive:ctx.alive});
        $('rReportClass').onchange=refresh;refresh();
      }
    }
    $('rDailyTab').onclick=()=>view(false);$('rReportTab').onclick=()=>view(true);
    await load();
    if(params.studentId)view(true);
  }
  async function exams(ctx) {
    const { body, catalog, params } = ctx;
    if (params.studentId) {
      catalog.exams = await invoke("student_exams", {student_id:Number(params.studentId)});
      if (!ctx.alive()) return;
    }
    const allClassNames = () => {
      const base = classNames(catalog);
      const fromExams = (catalog.exams || []).map(x => x.class).filter(Boolean);
      return [...new Set([...base, ...fromExams])];
    };
    const initialExamObj = catalog.exams.find(x => x.id === Number(params.examId)) || catalog.exams[0] || null;
    let selectedClass = params.class || (initialExamObj ? initialExamObj.class : "");
    let selectedExam = initialExamObj ? initialExamObj.id : "";
    let data = null,
      sequence = 0,
      loadingExam = false,
      deletingExam = false,
      openingEditor = false,
      preparingBulk = false,
      manager = null,
      managerRows = [];

    function filteredExams(cls) {
      if (!cls) return catalog.exams || [];
      return (catalog.exams || []).filter(x => x.class === cls);
    }
    function examOptionsHTML(cls, chosenId) {
      const list = filteredExams(cls);
      return '<option value="">নির্বাচন করুন</option>' +
        list.map(x => {
          const label = cls ? x.name : (x.name + ' (' + x.class + ')');
          return '<option value="' + e(x.id) + '"' + (String(x.id) === String(chosenId ?? '') ? ' selected' : '') + '>' + e(label) + '</option>';
        }).join('');
    }
    function classFilterOptionsHTML(chosenClass) {
      const names = allClassNames();
      return '<option value="">সকল শ্রেণি</option>' +
        names.map(n => '<option value="' + e(n) + '"' + (n === chosenClass ? ' selected' : '') + '>' + e(n) + '</option>').join('');
    }
    function parseRollInt(r) {
      const ascii = String(r ?? '').trim().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).replace(/[^0-9]/g, '');
      const n = parseInt(ascii, 10);
      return n > 0 ? n : 999999;
    }
    function formatRoll(r, idx) {
      const raw = String(r ?? '').trim();
      const val = raw || String((idx ?? 0) + 1);
      const ascii = val.replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));
      if (/^\d+$/.test(ascii) && Number(ascii) > 0 && Number(ascii) < 10) {
        return bn('0' + Number(ascii));
      }
      return bn(val);
    }
    function bnOrdinal(n) {
      const numVal = Number(n);
      if (!numVal || numVal <= 0) return '-';
      const map = { 1: '১ম', 2: '২য়', 3: '৩য়', 4: '৪র্থ', 5: '৫ম', 6: '৬ষ্ঠ', 7: '৭ম', 8: '৮ম', 9: '৯ম', 10: '১০ম' };
      return map[numVal] || (bn(numVal) + 'তম');
    }

    body.innerHTML =
      '<div class="r-toolbar">' +
      select("rExamClass", "শ্রেণি নির্বাচন", classFilterOptionsHTML(selectedClass)) +
      select("rExam", "পরীক্ষা", examOptionsHTML(selectedClass, selectedExam)) +
      button("rNew", "নতুন পরীক্ষা / রেজাল্ট তৈরি", "cap", true) +
      button("rManageExams", "সকল পরীক্ষা", "list") +
      button("rEdit", "সম্পাদনা", "file") +
      button("rDelete", "পরীক্ষা মুছুন", "trash") +
      button("rPrint", "ফলাফল প্রিন্ট", "print") +
      button("rGrades", "গ্রেড তালিকা", "list") +
      (ctx.page === "results" ? button("rBulkMarksheets", "সকলের আলাদা মার্কশিট", "print") : "") +
      '</div><div class="r-tabs"><button data-tab="marks">নম্বর প্রদান</button><button data-tab="results">ফলাফল ও নতুন রোল সিরিয়াল</button></div><div class="r-status" role="status"></div><div id="rExamBody"></div>';
    const $ = (id) => body.querySelector("#" + id),
      status = body.querySelector(".r-status");
    let tab = ctx.page === "results" ? "results" : "marks";
    function updateExamControls() {
      if (!ctx.alive()) return;
      const ready = !loadingExam && !deletingExam && !openingEditor && data && Number(data.exam.id) === num($("rExam"));
      ["rEdit", "rDelete", "rPrint"].forEach(id => $(id).disabled = !ready);
      if ($("rBulkMarksheets")) {
        $("rBulkMarksheets").disabled = !ready || preparingBulk || !data.students?.length;
        $("rBulkMarksheets").innerHTML = icon("print") + (preparingBulk ? "মার্কশিট প্রস্তুত হচ্ছে…" : "সকলের আলাদা মার্কশিট" + (data?.students?.length ? " (" + bn(data.students.length) + " জন)" : ""));
      }
      $("rExamBody").inert = loadingExam || deletingExam;
      $("rExamBody").setAttribute("aria-busy", String(loadingExam || deletingExam));
      body.querySelectorAll("[data-tab]").forEach(b => b.disabled = loadingExam || deletingExam);
    }

    function capture() {
      if (tab !== "marks" || !data || loadingExam || deletingExam) return;
      body.querySelectorAll("[data-mark]").forEach((td) => {
        const subject = Number(td.dataset.subject),
          student = Number(td.dataset.student),
          input = td.querySelector("input[type=number]"),
          absent = td.querySelector("input[type=checkbox]").checked;
        let m = data.marks.find(
          (m) => m.subject_id === subject && m.student_id === student,
        );
        if (!m) {
          m = { subject_id: subject, student_id: student };
          data.marks.push(m);
        }
        m.marks = input.value === "" ? null : Number(input.value);
        m.absent = absent ? 1 : 0;
      });
    }

    function ensureStudentRollsAndMerit(students) {
      const list = students || [];
      const used = new Set();
      list.forEach(s => {
        const n = parseRollInt(s.roll);
        if (n < 999999) used.add(n);
      });
      let nextR = 1;
      list.forEach(s => {
        if (!String(s.roll ?? '').trim()) {
          while (used.has(nextR)) nextR++;
          s.roll = String(nextR);
          used.add(nextR);
          nextR++;
        }
        s.prev_roll = s.roll;
        s.has_marks = (s.subject_results || []).some(r => r.recorded);
      });
      // Sort copy by exam performance to determine 1st, 2nd, 3rd... serial and new exam roll
      const rankedOrder = [...list].sort((a, b) => {
        if (a.has_marks !== b.has_marks) return a.has_marks ? -1 : 1;
        const aPass = a.complete && a.grade_code !== 'rasib';
        const bPass = b.complete && b.grade_code !== 'rasib';
        if (aPass !== bPass) return aPass ? -1 : 1;
        if ((b.total || 0) !== (a.total || 0)) return (b.total || 0) - (a.total || 0);
        if ((b.percentage || 0) !== (a.percentage || 0)) return (b.percentage || 0) - (a.percentage || 0);
        return parseRollInt(a.prev_roll) - parseRollInt(b.prev_roll);
      });
      rankedOrder.forEach((s, idx) => {
        const serial = idx + 1;
        s.merit_serial = s.has_marks ? serial : null;
        s.merit_label = s.has_marks ? bnOrdinal(serial) : 'অসম্পূর্ণ';
        s.exam_new_roll = s.has_marks ? String(serial) : s.prev_roll;
        if (s.has_marks && !s.rank) {
          s.rank = serial;
        }
      });
      return rankedOrder;
    }

    function paint() {
      if (!ctx.alive()) return;
      updateExamControls();
      body
        .querySelectorAll("[data-tab]")
        .forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
      if (!data) {
        const cls = $("rExamClass") ? $("rExamClass").value : "";
        const list = filteredExams(cls);
        if (cls && !list.length) {
          $("rExamBody").innerHTML =
            '<div class="r-empty r-exam-empty-cta">' +
              '<strong>"' + e(cls) + '" শ্রেণির জন্য এখনো কোনো পরীক্ষা বা ফলাফল তৈরি করা হয়নি</strong>' +
              '<p>এই শ্রেণির সকল শিক্ষার্থীর স্বয়ংক্রিয় রোল ও ফলাফল শিট তৈরি করতে নিচের বাটনে ক্লিক করুন।</p>' +
              button("rCreateClassExam", '"' + cls + '" শ্রেণির রেজাল্ট শিট তৈরি করুন', "cap", true) +
            '</div>';
          const btn = $("rCreateClassExam");
          if (btn) btn.onclick = () => edit({
            exam: { id: 0, name: "২য় সাময়িক পরীক্ষা", class: cls, day: MM.util.today() },
            subjects: [
              { name: "কুরআন মাজীদ ও তাজবীদ", full: 100, pass: 33 },
              { name: "হাদীস শরীফ ও ফিকহ", full: 100, pass: 33 },
              { name: "আরবি ও বাংলা সাহিত্য", full: 100, pass: 33 }
            ]
          });
        } else {
          $("rExamBody").innerHTML =
            '<div class="r-empty">শ্রেণি ও পরীক্ষা নির্বাচন করুন অথবা <b>নতুন পরীক্ষা / রেজাল্ট তৈরি</b> বাটনে ক্লিক করুন</div>';
        }
        return;
      }
      const d = data,
        exam = d.exam;
      const componentExam = d.subjects.some(sub => Number(sub.practical_full || 0) > 0);
      const rankedStudents = ensureStudentRollsAndMerit(d.students);
      const topThree = rankedStudents.filter(s => s.has_marks).slice(0, 3);
      const topSummaryHTML = topThree.length
        ? '<div class="r-merit-strip">' +
            '<span class="r-merit-strip-title">ফলাফল অনুযায়ী শীর্ষ সিরিয়াল (নতুন রোল):</span>' +
            topThree.map(s =>
              '<span class="r-merit-chip rank-' + s.merit_serial + '">' +
                '<b>' + e(s.merit_label) + ' (নতুন রোল ' + e(formatRoll(s.exam_new_roll)) + ')</b>: ' +
                e(s.name) + ' (' + bn(s.total) + '/' + bn(s.full) + ')' +
              '</span>'
            ).join('') +
          '</div>'
        : '';

      $("rExamBody").innerHTML =
        '<div class="r-banner">' +
          '<div class="r-banner-main"><strong>' + e(exam.name) + '</strong>' +
          ' <span class="r-class-pill">শ্রেণি: ' + e(exam.class) + '</span>' +
          ' · তারিখ: ' + bn(e(exam.day)) +
          ' · মোট পরীক্ষার্থী: <b>' + bn((d.students || []).length) + ' জন</b>' +
          ' · অবস্থা: <span class="r-pub-badge ' + (exam.published ? 'pub' : 'draft') + '">' + (exam.published ? "প্রকাশিত" : "খসড়া") + '</span></div>' +
          topSummaryHTML +
        '</div><div class="r-toolbar">' +
        (tab === "marks"
          ? button("rSaveMarks", "নম্বর সংরক্ষণ", "file", true)
          : button("rApplyMeritRoll", "ফলাফল অনুযায়ী নতুন রোল স্থায়ী করুন (১ম = রোল ০১)", "cap", true)) +
        button("rSyncRoster", "অটো রোল ও ছাত্র সিঙ্ক", "staff") +
        button(
          "rPublish",
          exam.published ? "প্রকাশ বন্ধ" : "ফলাফল প্রকাশ",
          "cap",
        ) +
        '</div>' + (tab === 'marks' && componentExam ? '<p class="r-banner">লিখিত ও ব্যবহারিক নম্বর আলাদা করে দিতে পরীক্ষা ও ফলাফল মেনুর Result Management পেজ খুলুন।</p>' : '') + '<div id="rGrid"></div>';

      if ($("rApplyMeritRoll")) {
        $("rApplyMeritRoll").onclick = () =>
          run(
            $("rApplyMeritRoll"),
            async () => {
              if (!(await MM.util.confirm('"' + exam.name + '"-এর প্রাপ্ত নম্বরের সিরিয়াল অনুযায়ী (১ম = রোল ০১, ২য় = রোল ০২, ৩য় = রোল ০৩...) সকল ছাত্রের রোল নম্বর আপডেট করবেন?'))) return;
              const res = await invoke("exam_apply_merit_rolls", { id: exam.id });
              await load();
              status.textContent = "ফলাফলের সিরিয়াল অনুযায়ী (১ম = রোল ০১, ২য় = রোল ০২...) " + bn(res.updated || 0) + " জন ছাত্রের নতুন রোল স্থায়ীভাবে নির্ধারণ হয়েছে ✓";
            },
            status,
          );
      }

      $("rSyncRoster").onclick = () =>
        run(
          $("rSyncRoster"),
          async () => {
            capture();
            const res = await invoke("exam_sync_roster", { id: exam.id, resequence: false });
            await load();
            status.textContent = "শ্রেণির " + bn(res.synced || 0) + " জন শিক্ষার্থী ও রোল সিঙ্ক হয়েছে ✓";
          },
          status,
        );

      $("rPublish").onclick = () =>
        run(
          $("rPublish"),
          async () => {
            capture();
            if (!exam.published) {
              if(componentExam) throw Error("লিখিত ও ব্যবহারিক নম্বরের ফলাফল প্রকাশ করতে পরীক্ষা ও ফলাফল মেনুর Result Management পেজ খুলুন।");
              const missingRows = [];
              for (const s of d.students) {
                for (const sub of d.subjects) {
                  const m = d.marks.find(x => x.student_id === s.student_id && x.subject_id === sub.id);
                  if (!m || (m.marks === null || m.marks === undefined || m.marks === "") && !m.absent) {
                    missingRows.push({ subject_id: sub.id, student_id: s.student_id });
                  }
                }
              }
              if (missingRows.length > 0) {
                const autoFill = await MM.util.confirm(
                  "কিছু শিক্ষার্থীর নম্বর এখনো দেওয়া হয়নি। ফাঁকা ঘরগুলো সংরক্ষণ করে ফলাফল প্রকাশ করবেন?"
                );
                if (!autoFill) return;
                for (const miss of missingRows) {
                  let m = d.marks.find(x => x.subject_id === miss.subject_id && x.student_id === miss.student_id);
                  if (!m) {
                    m = { subject_id: miss.subject_id, student_id: miss.student_id, marks: null, absent: 1 };
                    d.marks.push(m);
                  } else {
                    m.absent = 1;
                  }
                }
                await invoke("marks_save", {
                  id: exam.id,
                  revision: exam.revision,
                  rows: d.marks.map((m) => ({
                    subject_id: m.subject_id,
                    student_id: m.student_id,
                    marks: m.marks,
                    absent: !!m.absent,
                  })),
                });
              } else if (tab === "marks") {
                await invoke("marks_save", {
                  id: exam.id,
                  revision: exam.revision,
                  rows: d.marks.map((m) => ({
                    subject_id: m.subject_id,
                    student_id: m.student_id,
                    marks: m.marks,
                    absent: !!m.absent,
                  })),
                });
              } else {
                if (!(await MM.util.confirm("সংরক্ষিত ফলাফল প্রকাশ করবেন?"))) return;
              }
            } else {
              if (!(await MM.util.confirm("প্রকাশ বন্ধ করে ফলাফল সম্পাদনা করবেন?"))) return;
            }
            await invoke("exam_publish", {
              id: exam.id,
              published: !exam.published,
            });
            await load();
          },
          status,
        );

      if (tab === "marks") {
        const rows = () =>
          d.students.map((s, idx) =>
            cells([
              '<span class="r-roll-badge">' + e(formatRoll(s.prev_roll, idx)) + '</span>',
              '<strong>' + e(s.name) + '</strong><small>আইডি: ' + e(s.sid) + (s.has_marks ? ' · ফলাফল সিরিয়াল: <b>' + e(s.merit_label) + ' (নতুন রোল ' + e(formatRoll(s.exam_new_roll)) + ')</b>' : '') + '</small>',
              ...d.subjects.map((sub) => {
                const m = d.marks.find(
                  (m) =>
                    m.student_id === s.student_id && m.subject_id === sub.id,
                );
                return (
                  '<div data-mark data-subject="' +
                  sub.id +
                  '" data-student="' +
                  s.student_id +
                  '"><input aria-label="' +
                  e(s.name) +
                  " " +
                  e(sub.name) +
                  '" type="number" min="0" max="' +
                  sub.full +
                  '" step="0.01" value="' +
                  e(m?.marks ?? "") +
                  '" ' +
                  (exam.published || componentExam ? "disabled" : "") +
                  '><label class="r-mark-absent"><input type="checkbox" ' +
                  (m?.absent ? "checked" : "") +
                  " " +
                  (exam.published || componentExam ? "disabled" : "") +
                  ">অনুপস্থিত</label></div>"
                );
              }),
            ]),
          );
        paged(
          $("rGrid"),
          [
            "বর্তমান রোল",
            "শিক্ষার্থী ও আইডি",
            ...d.subjects.map((s) => e(s.name) + " (" + bn(s.full) + ")"),
          ],
          rows,
          (box) => {
            box
              .querySelectorAll("input")
              .forEach((i) => (i.onchange = capture));
          },
          capture,
        );
        $("rSaveMarks").disabled = !!exam.published || componentExam;
        $("rSaveMarks").onclick = () =>
          run(
            $("rSaveMarks"),
            async () => {
              capture();
              await invoke("marks_save", {
                id: exam.id,
                revision: exam.revision,
                rows: d.marks.map((m) => ({
                  subject_id: m.subject_id,
                  student_id: m.student_id,
                  marks: m.marks,
                  absent: !!m.absent,
                })),
              });
              await load();
              status.textContent = "নম্বর সংরক্ষিত হয়েছে এবং ১ম, ২য়, ৩য় সিরিয়াল অনুযায়ী ফলাফল প্রস্তুত ✓";
            },
            status,
          );
      } else {
        // Result Sheet sorted in 1, 2, 3... serial order (highest marks first)
        const students = params.studentId
          ? rankedStudents.filter((s) => s.student_id === Number(params.studentId))
          : rankedStudents;
        paged(
          $("rGrid"),
          [
            "মেধাক্রম / সিরিয়াল",
            "পরীক্ষার রোল (নতুন রোল)",
            "শিক্ষার্থীর নাম ও আইডি",
            ...d.subjects.map((sub) => e(sub.name) + " (" + bn(sub.full) + ")"),
            "মোট / পূর্ণ",
            "শতকরা",
            "গ্রেড",
            "কাজ",
          ],
          students.map((s, idx) => {
            const newRollFormatted = formatRoll(s.exam_new_roll, idx);
            const prevRollFormatted = formatRoll(s.prev_roll, idx);
            return cells([
              s.merit_serial
                ? '<span class="r-serial-badge rank-' + (s.merit_serial <= 3 ? s.merit_serial : 'n') + '">' + e(s.merit_label) + ' (' + bn(s.merit_serial) + ')</span>'
                : '<span class="r-sub-pending">-</span>',
              '<div class="r-roll-cell"><span class="r-roll-badge">রোল ' + e(newRollFormatted) + '</span>' +
                '<small class="r-prev-roll">পূর্বের রোল: ' + e(prevRollFormatted) + '</small></div>',
              '<strong>' + e(s.name) + '</strong><small>আইডি: ' + e(s.sid) + '</small>',
              ...d.subjects.map((sub) => {
                const sr = (s.subject_results || []).find(r => r.subject_id === sub.id);
                if (!sr || !sr.recorded) return '<span class="r-sub-pending">-</span>';
                if (sr.absent) return '<span class="r-sub-absent">অনুপস্থিত</span>';
                return '<b>' + bn(sr.marks) + '</b>';
              }),
              '<b>' + bn(s.total) + '</b> / ' + bn(s.full),
              bn(s.percentage.toFixed(2)) + "%",
              '<span class="r-grade-pill" data-grade="' + e(s.grade_code || '') + '">' + e(s.grade) + '</span>',
              '<button class="btn btn-ghost" data-report="' +
                s.student_id +
                '">' +
                icon("file") +
                "মার্কশিট</button>",
            ]);
          }),
          (box) =>
            box
              .querySelectorAll("[data-report]")
              .forEach(
                (b) =>
                  (b.onclick = () => MM.marksheet.open(d, Number(b.dataset.report))),
              ),
        );
      }
    }
    async function refreshExams(preferredId, preferredClass) {
      const next = await invoke("catalog");
      managerRows = next.exams || [];
      const available = params.studentId
        ? await invoke("student_exams", { student_id: Number(params.studentId) })
        : managerRows;
      if (ctx.alive()) {
        const currentId = preferredId === undefined ? num($("rExam")) : Number(preferredId || 0);
        selectedClass = preferredClass === undefined ? $("rExamClass").value : preferredClass;
        Object.assign(catalog, next, { exams: available });
        // Keep a manager-selected exam accessible from an individual student's results view.
        const chosen = managerRows.find(x => Number(x.id) === currentId);
        if (chosen && !catalog.exams.some(x => Number(x.id) === currentId)) {
          catalog.exams = [...catalog.exams, chosen];
        }
        if (selectedClass && !allClassNames().includes(selectedClass)) selectedClass = "";
        const list = filteredExams(selectedClass);
        selectedExam = list.some(x => Number(x.id) === currentId) ? currentId : list[0]?.id || "";
        $("rExamClass").innerHTML = classFilterOptionsHTML(selectedClass);
        $("rExam").innerHTML = examOptionsHTML(selectedClass, selectedExam);
        await load();
      }
      paintManager();
    }

    async function deleteExam(exam) {
      if (deletingExam || !exam) return false;
      deletingExam = true;
      updateExamControls();
      try {
        const yes = await MM.util.confirm(
          '“' + exam.name + '” (' + exam.class + ') পরীক্ষাটি সম্পূর্ণ মুছে ফেলবেন? ' +
          'এই পরীক্ষার সকল বিষয়, নম্বর ও প্রকাশিত/খসড়া ফলাফল স্থায়ীভাবে মুছে যাবে। পরে ফেরত আনা যাবে না। শিক্ষার্থীদের মূল তথ্য অক্ষত থাকবে।'
        );
        if (!yes) return false;
        await invoke("exam_delete", { id: Number(exam.id), revision: Number(exam.revision) });
        // Remove stale content immediately, even if a subsequent catalog refresh fails.
        if (data && Number(data.exam.id) === Number(exam.id)) {
          data = null;
          ++sequence;
        }
        catalog.exams = catalog.exams.filter(x => Number(x.id) !== Number(exam.id));
        managerRows = managerRows.filter(x => Number(x.id) !== Number(exam.id));
        paintManager();
        try {
          await refreshExams();
        } catch (error) {
          if (ctx.alive()) {
            const id = num($("rExam"));
            const list = filteredExams($("rExamClass").value);
            selectedExam = list.some(x => Number(x.id) === id) ? id : list[0]?.id || "";
            $("rExam").innerHTML = examOptionsHTML($("rExamClass").value, selectedExam);
            loadingExam = false;
            paint();
          }
          MM.util.toast("পরীক্ষা মুছে ফেলা হয়েছে। তালিকা আবার খুলুন: " + String(error), "err");
        }
        if (status.isConnected) {
          status.className = "r-status";
          status.textContent = "পরীক্ষা ও সংশ্লিষ্ট ফলাফল সম্পূর্ণ মুছে ফেলা হয়েছে";
        }
        return true;
      } finally {
        deletingExam = false;
        updateExamControls();
      }
    }

    async function openEditor(id, onSaved = () => {}) {
      let d = await invoke("exam_get", { id: Number(id) });
      if (!ctx.alive() && !manager?.isConnected) return;
      if (d.exam.published) {
        if (!(await MM.util.confirm('“' + d.exam.name + '” পরীক্ষার ফলাফল প্রকাশ বন্ধ করে সম্পাদনা করবেন? সম্পাদনা শেষে আবার ফলাফল প্রকাশ করতে পারবেন।'))) return;
        await invoke("exam_publish", { id: Number(id), published: false });
        await refreshExams();
        d = await invoke("exam_get", { id: Number(id) });
      }
      if (!ctx.alive() && !manager?.isConnected) return;
      return edit(d, onSaved);
    }

    function paintManager() {
      if (!manager?.isConnected) return;
      const cls = manager.querySelector("#rManagerClass").value;
      const search = manager.querySelector("#rManagerSearch").value.trim().toLocaleLowerCase();
      const rows = managerRows.filter(ex => (!cls || ex.class === cls) &&
        (!search || (ex.name + " " + ex.class + " " + ex.day).toLocaleLowerCase().includes(search)));
      manager.querySelector("#rExamCount").textContent = "মোট " + bn(managerRows.length) + "টি পরীক্ষা · দেখানো হচ্ছে " + bn(rows.length) + "টি";
      paged(manager.querySelector("#rManagerRows"), ["পরীক্ষার নাম", "শ্রেণি", "তারিখ", "অবস্থা", "কাজ"], rows.map(ex => cells([
        '<strong>' + e(ex.name) + '</strong>', e(ex.class), bn(e(ex.day)),
        ex.published ? "প্রকাশিত" : "খসড়া",
        '<div class="r-actions">' +
          '<button type="button" class="btn btn-ghost" data-exam-open="' + e(ex.id) + '" aria-label="' + e(ex.name + ' খুলুন') + '">' + icon("cap") + 'খুলুন</button>' +
          '<button type="button" class="btn btn-ghost" data-exam-edit="' + e(ex.id) + '" aria-label="' + e(ex.name + ' সম্পাদনা করুন') + '">' + icon("file") + 'সম্পাদনা</button>' +
          '<button type="button" class="btn btn-ghost" data-exam-delete="' + e(ex.id) + '" aria-label="' + e(ex.name + ' স্থায়ীভাবে মুছুন') + '">' + icon("trash") + 'মুছুন</button></div>',
      ])), box => {
        box.querySelectorAll("[data-exam-open],[data-exam-edit],[data-exam-delete]").forEach(b => {
          b.onclick = () => managerAction(async () => {
            const id = Number(b.dataset.examOpen || b.dataset.examEdit || b.dataset.examDelete);
            const ex = managerRows.find(x => Number(x.id) === id);
            if (!ex) return;
            if (b.dataset.examDelete) {
              if (await deleteExam(ex)) {
                const message = manager.querySelector(".r-status");
                message.textContent = "পরীক্ষা ও সংশ্লিষ্ট ফলাফল সম্পূর্ণ মুছে ফেলা হয়েছে";
              }
            } else if (b.dataset.examEdit) {
              await openEditor(id, paintManager);
            } else if (ctx.alive()) {
              capture();
              await refreshExams(id, ex.class);
              manager.dataset.busy = "false";
              manager.querySelector("#rCancel").disabled = false;
              manager.querySelector("#rCancel").click();
            }
          });
        });
      }, () => {}, "rManager");
    }

    async function managerAction(work) {
      const form = manager;
      if (!form?.isConnected || form.dataset.busy === "true") return;
      form.dataset.busy = "true";
      form.querySelectorAll("button,input,select").forEach(el => el.disabled = true);
      const message = form.querySelector(".r-status");
      message.className = "r-status";
      message.textContent = "";
      try {
        await work();
      } catch (error) {
        if (message.isConnected) {
          message.className = "r-status bad";
          message.textContent = String(error);
        }
      } finally {
        form.dataset.busy = "false";
        if (form.isConnected) {
          form.querySelectorAll("button,input,select").forEach(el => el.disabled = false);
          // Repaint restores the pager's correct disabled states after a mutation.
          paintManager();
        }
      }
    }

    async function showManager() {
      if (manager?.isConnected) return;
      manager = modal("সকল পরীক্ষা পরিচালনা",
        '<p>সব শ্রেণির তৈরি পরীক্ষাগুলো এখান থেকে খুলুন, সম্পাদনা করুন অথবা সম্পূর্ণ মুছে ফেলুন।</p><div class="r-form-grid">' +
          select("rManagerClass", "শ্রেণি", '<option value="">সকল শ্রেণি</option>') +
          field("rManagerSearch", "পরীক্ষার নাম খুঁজুন", "search", "", 'placeholder="নাম, শ্রেণি বা তারিখ"') +
        '</div><div class="r-banner" id="rExamCount"></div><div id="rManagerRows"><div class="r-empty">লোড হচ্ছে</div></div>', async () => {});
      manager.classList.add("exam-manager-dialog");
      manager.querySelector("#rSave").hidden = true;
      manager.onsubmit = event => event.preventDefault();
      manager.querySelector("#rManagerClass").onchange = paintManager;
      manager.querySelector("#rManagerSearch").oninput = paintManager;
      await managerAction(async () => {
        const next = await invoke("catalog");
        managerRows = next.exams || [];
        const names = [...new Set([...classNames(next), ...managerRows.map(x => x.class).filter(Boolean)])];
        manager.querySelector("#rManagerClass").innerHTML = '<option value="">সকল শ্রেণি</option>' + names.map(name => '<option value="' + e(name) + '">' + e(name) + '</option>').join("");
        paintManager();
      });
    }

    async function load() {
      const n = ++sequence,
        id = num($("rExam"));
      selectedExam = id || "";
      loadingExam = !!id;
      updateExamControls();
      if (!id) {
        data = null;
        paint();
        return;
      }
      try {
        let d = await invoke("exam_get", { id });
        if (!ctx.alive() || n !== sequence) return;
        if (d && d.students && d.students.some(s => !String(s.roll ?? '').trim())) {
          try {
            await invoke("exam_sync_roster", { id, resequence: false });
            d = await invoke("exam_get", { id });
          } catch (_) {}
        }
        if (!ctx.alive() || n !== sequence) return;
        data = d;
        loadingExam = false;
        if (d?.exam?.class && $("rExamClass").value && $("rExamClass").value !== d.exam.class) {
          $("rExamClass").value = d.exam.class;
        }
        paint();
      } catch (error) {
        if (!ctx.alive() || n !== sequence) return;
        loadingExam = false;
        data = null;
        paint();
        throw error;
      }
    }
    body.querySelectorAll("[data-tab]").forEach(
      (b) =>
        (b.onclick = () => {
          capture();
          tab = b.dataset.tab;
          animateTab($("rExamBody"));
          paint();
        }),
    );
    $("rExamClass").onchange = () => {
      capture();
      status.className = "r-status";
      status.textContent = "";
      selectedClass = $("rExamClass").value;
      const list = filteredExams(selectedClass);
      selectedExam = list[0]?.id || "";
      $("rExam").innerHTML = examOptionsHTML(selectedClass, selectedExam);
      load().catch((err) => {
        if (ctx.alive()) {
          status.className = "r-status bad";
          status.textContent = String(err);
        }
      });
    };
    $("rExam").onchange = () => {
      status.className = "r-status";
      status.textContent = "";
      load().catch((err) => {
        if (ctx.alive()) {
          status.className = "r-status bad";
          status.textContent = String(err);
        }
      });
    };
    $("rNew").onclick = () => {
      const cls = $("rExamClass")?.value || catalog.classes[0]?.name || MM.CLASSES[0];
      edit({
        exam: {
          id: 0,
          name: "",
          class: cls,
          day: MM.util.today(),
          academic_year: String(MM.settings.value?.academic_year || MM.util.today().slice(0,4)).replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)),
          department: '',
        },
        subjects: [
          { name: "কুরআন মাজীদ", full: 100, pass: 33 },
          { name: "হাদীস ও ফিকহ", full: 100, pass: 33 },
        ],
      });
    };
    $("rManageExams").onclick = showManager;
    $("rEdit").onclick = async () => {
      if (!data || loadingExam || deletingExam || openingEditor) return;
      openingEditor = true;
      updateExamControls();
      try {
        await openEditor(data.exam.id);
      } catch (error) {
        if (status.isConnected) {
          status.className = "r-status bad";
          status.textContent = String(error);
        }
      } finally {
        openingEditor = false;
        updateExamControls();
      }
    };
    $("rDelete").onclick = async () => {
      if (!data || loadingExam || deletingExam) return;
      try {
        await deleteExam(data.exam);
      } catch (error) {
        if (status.isConnected) {
          status.className = "r-status bad";
          status.textContent = String(error);
        }
      }
    };
    $("rGrades").onclick = () => {
      const grading = data?.grading || [
        { minimum: 80, grade: "মুমতাজ", grade_en: "Mumtaz" },
        { minimum: 65, grade: "জাইয়্যিদ জিদ্দান", grade_en: "Jayyid Jiddan" },
        { minimum: 50, grade: "জাইয়্যিদ", grade_en: "Jayyid" },
        { minimum: 33, grade: "মাকবুল", grade_en: "Maqbul" },
        { minimum: 0, grade: "রাসিব", grade_en: "Rasib" },
      ];
      const f = modal('গ্রেড তালিকা', '<div class="r-report">' + table(['ক্রমিক','বাংলা নাম','English Name','ন্যূনতম শতাংশ'], grading.map((g,i) => cells([bn(i+1),'<span lang="bn" translate="no">'+e(g.grade)+'</span>',e(g.grade_en),bn(g.minimum)+'%']))) + '</div>', async () => {});
      f.querySelector('#rSave').hidden = true;
    };
    $("rPrint").onclick = () => {
      if (!data) return;
      const rankedStudents = ensureStudentRollsAndMerit(data.students);
      print(
        data.exam.name +
          " · শ্রেণি: " +
          data.exam.class +
          " (ফলাফল অনুযায়ী ১ম, ২য়, ৩য় সিরিয়াল ও নতুন রোল)" +
          (data.exam.published ? "" : " · খসড়া"),
        table(
          [
            "মেধাক্রম / সিরিয়াল",
            "নতুন রোল",
            "পূর্বের রোল",
            "শিক্ষার্থীর নাম",
            "আইডি",
            ...data.subjects.map((sub) => e(sub.name)),
            "মোট নম্বর",
            "শতকরা",
            "গ্রেড",
          ],
          rankedStudents
            .filter(
              (s) =>
                !params.studentId || s.student_id === Number(params.studentId),
            )
            .map((s, idx) =>
              cells([
                e(s.merit_label || bn(idx + 1)),
                e(formatRoll(s.exam_new_roll, idx)),
                e(formatRoll(s.prev_roll, idx)),
                e(s.name),
                e(s.sid),
                ...data.subjects.map((sub) => {
                  const sr = (s.subject_results || []).find(r => r.subject_id === sub.id);
                  if (!sr || !sr.recorded) return "-";
                  if (sr.absent) return "অনুপস্থিত";
                  return bn(sr.marks);
                }),
                bn(s.total) + " / " + bn(s.full),
                bn(s.percentage.toFixed(2)) + "%",
                e(s.grade),
              ]),
            ),
        ),
      );
    };
    if ($("rBulkMarksheets")) $("rBulkMarksheets").onclick = async () => {
      if (preparingBulk || loadingExam || deletingExam || !data?.students?.length) return;
      const examId = Number(data.exam.id), ticket = sequence;
      const current = () => ctx.alive() && sequence === ticket && !loadingExam && !deletingExam &&
        Number(selectedExam) === examId && num($("rExam")) === examId && Number(data?.exam?.id) === examId;
      preparingBulk = true;
      updateExamControls();
      status.className = "r-status";
      status.textContent = "সকল শিক্ষার্থীর আলাদা মার্কশিট প্রস্তুত হচ্ছে…";
      try {
        // Reload persisted marks, not a paginated table or unsaved input draft.
        const fresh = await invoke("exam_get", { id: examId });
        if (!current()) return;
        await MM.marksheet.openBulk(fresh, current, (done, total) => {
          if (current()) status.textContent = bn(done) + " / " + bn(total) + " জনের মার্কশিট প্রস্তুত হয়েছে";
        });
        if (current()) status.textContent = bn(fresh.students.length) + " জনের আলাদা মার্কশিট প্রস্তুত। প্রিন্ট বা PDF সংরক্ষণ করুন।";
      } catch (error) {
        if (current()) {
          status.className = "r-status bad";
          status.textContent = "মার্কশিট প্রস্তুত হয়নি: " + String(error);
        }
      } finally {
        preparingBulk = false;
        updateExamControls();
      }
    };
    function edit(
      d = {
        exam: {
          id: 0,
          name: "",
          class: $("rExamClass")?.value || catalog.classes[0]?.name || MM.CLASSES[0],
          day: MM.util.today(),
        },
        subjects: [{ name: "", full: 100, pass: 33 }],
      },
      onSaved = () => {},
    ) {
      const ex = d.exam;
      const editClasses = classOptions(catalog, false, ex.class) +
        (ex.class && !classNames(catalog).includes(ex.class)
          ? '<option value="' + e(ex.class) + '" selected>' + e(ex.class) + '</option>' : "");
      const f = modal(
        ex.id ? "পরীক্ষা ও বিষয় সম্পাদনা" : "নতুন পরীক্ষা ও রেজাল্ট শিট তৈরি",
        '<div class="r-form-grid">' +
          select("rClass", "শ্রেণি নির্বাচন", editClasses) +
          field(
            "rName",
            "পরীক্ষার নাম",
            "text",
            ex.name,
            'required maxlength="200" placeholder="যেমনঃ ২য় সাময়িক / বার্ষিক পরীক্ষা"',
          ) +
          field("rDate", "তারিখ", "date", ex.day, "required") +
          field("rAcademicYear", "শিক্ষাবর্ষ", "text", ex.academic_year || '', 'maxlength="30" placeholder="যেমনঃ ২০২৬"') +
          field("rExamDepartment", "বিভাগ", "text", ex.department || '', 'maxlength="120" placeholder="সকল বিভাগ হলে ফাঁকা রাখুন"') +
          '</div><div id="rSubjects"></div><div class="r-toolbar">' +
          button("rAddSubject", "বিষয় যোগ", "file") +
          "</div>",
        async (form) => {
          const subjects = [...form.querySelectorAll(".r-subject")].map(
            (row) => ({
              id: Number(row.dataset.subjectId || 0),
              name: row.querySelector("[name=name]").value.trim(),
              full: num(row.querySelector("[name=full]")),
              pass: num(row.querySelector("[name=pass]")),
            }),
          );
          const name = form.querySelector("#rName").value.trim();
          if (!name) throw new Error("পরীক্ষার নাম লিখুন");
          if (!subjects.length || subjects.length > 50) throw new Error("১ থেকে ৫০টি বিষয় দিন");
          if (subjects.some(s => !s.name || !Number.isInteger(s.full) || !Number.isInteger(s.pass) || s.full < 1 || s.full > 1000 || s.pass < 0 || s.pass > s.full)) {
            throw new Error("প্রতিটি বিষয়ের নাম ও নম্বর সঠিকভাবে দিন। পাস নম্বর পূর্ণ নম্বরের বেশি হতে পারবে না।");
          }
          if (new Set(subjects.map(s => s.name)).size !== subjects.length) throw new Error("একই বিষয়ের নাম একাধিকবার দেওয়া যাবে না");
          const chosenClass = form.querySelector("#rClass").value;
          if (!chosenClass) throw new Error("একটি শ্রেণি নির্বাচন করুন");
          const removed = (d.subjects || []).filter(s => s.id && !subjects.some(next => next.id === Number(s.id)));
          if (removed.some(s => (d.marks || []).some(mark => Number(mark.subject_id) === Number(s.id)))) {
            if (!(await MM.util.confirm("বাদ দেওয়া বিষয়ের সংরক্ষিত নম্বর স্থায়ীভাবে মুছে যাবে। পরিবর্তন সংরক্ষণ করবেন?"))) {
              throw new Error("পরিবর্তন সংরক্ষণ করা হয়নি। প্রয়োজনে বিষয়গুলো আবার যোগ করুন।");
            }
          }
          const r = await invoke("exam_save", {
            id: ex.id,
            revision: ex.revision,
            name,
            class: chosenClass,
            day: form.querySelector("#rDate").value,
            academic_year: form.querySelector("#rAcademicYear").value.trim().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)),
            department: form.querySelector("#rExamDepartment").value.trim(),
            subjects,
          });
          try {
            await refreshExams(r.id, chosenClass);
            await onSaved();
          } catch (error) {
            // A successful save must close the editor so retrying cannot create a duplicate exam.
            MM.util.toast("পরীক্ষা সংরক্ষিত হয়েছে। তালিকা আবার খুলুন: " + String(error), "err");
          }
          if (status.isConnected) {
            status.className = "r-status";
            status.textContent = "পরীক্ষা সংরক্ষিত হয়েছে";
          }
        },
      );
      function add(s = { name: "", full: 100, pass: 33 }) {
        const row = document.createElement("div");
        row.className = "r-subject";
        row.dataset.subjectId = String(s.id || 0);
        row.innerHTML =
          '<label>বিষয়<input name="name" value="' +
          e(s.name) +
          '" required maxlength="200" placeholder="বিষয়ের নাম"></label><label>পূর্ণ নম্বর<input name="full" type="number" min="1" max="1000" step="1" value="' +
          s.full +
          '" required></label><label>পাস নম্বর<input name="pass" type="number" min="0" max="1000" step="1" value="' +
          s.pass +
          '" required></label><button type="button" class="btn btn-ghost" title="বিষয় বাদ">' +
          icon("chevron") +
          "</button>";
        row.querySelector("button").onclick = () => row.remove();
        f.querySelector("#rSubjects").append(row);
      }
      d.subjects.forEach(add);
      f.querySelector("#rAddSubject").onclick = () => add();
      return f;
    }
    await load();
    if (params.create && ctx.alive()) edit();
  }
  return { invoke, render, table, cells, money, print, bn, e, modal, field, select, options, button, icon, paged, pay, receipt, classNames, manageClasses, animateTab };
})();
