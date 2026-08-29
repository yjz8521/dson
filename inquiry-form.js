(function () {
  "use strict";

  // ============================================================
  // 询价表单 + 规格总表 PDF 下载（Web3Forms）
  // 设定方式见 README.md「询价表单（Web3Forms）设置」一节：
  //   1. 到 https://web3forms.com 用收件信箱申请 access key
  //   2. 把 key 填入下面的 ACCESS_KEY
  //   3. 任一表单送出一笔测试信确认
  // 日后更换收件信箱：只需到 Web3Forms 后台修改，不用改本文件。
  // ============================================================
  var ACCESS_KEY = "YOUR_WEB3FORMS_ACCESS_KEY";
  var ENDPOINT = "https://api.web3forms.com/submit";
  var PDF_URL = "assets/DSON-spec-sheet.pdf";

  var FIELDS = [
    { name: "company_name", label: "公司名称", type: "text", required: true },
    { name: "contact_person", label: "联系人", type: "text", required: true },
    { name: "email", label: "电子邮箱", type: "email", required: true },
    { name: "phone", label: "联系电话", type: "tel", required: false },
    { name: "test_standard", label: "试验依据", hint: "标准编号、章节、客户规范或自定义曲线", type: "textarea" },
    { name: "sample_info", label: "样品资料", hint: "尺寸、重量、数量、材质、摆放与治具", type: "textarea" },
    { name: "operating_status", label: "运行状态", hint: "是否带电、发热、充放电、旋转或动作", type: "textarea" },
    { name: "test_curve", label: "试验曲线", hint: "范围、速率、驻留、循环与恢复判定", type: "textarea" },
    { name: "safety_boundaries", label: "安全边界", hint: "气体、溶剂、压力、腐蚀、粉尘与火灾风险", type: "textarea" },
    { name: "measurement_interface", label: "量测接口", hint: "测试孔、线缆、传感器、记录与通讯需求", type: "textarea" },
    { name: "site_conditions", label: "现场条件", hint: "空间、搬运、电源、用水、排水、排风与冷却", type: "textarea" },
    { name: "acceptance", label: "验收方式", hint: "空载或带载、测点、容差、文件与见证要求", type: "textarea" }
  ];

  var css = document.createElement("style");
  css.textContent = [
    ".inq-form{max-width:720px}",
    ".inq-form .inq-row{margin-bottom:14px}",
    ".inq-form label{display:block;font-size:14px;margin-bottom:4px}",
    ".inq-form label em{color:#c0392b;font-style:normal;margin-left:2px}",
    ".inq-form label small{color:#666;font-size:12px;margin-left:6px}",
    ".inq-form input,.inq-form textarea{width:100%;box-sizing:border-box;padding:9px 10px;border:1px solid #ccc;border-radius:6px;font:inherit;font-size:14px}",
    ".inq-form textarea{min-height:56px;resize:vertical}",
    ".inq-form .inq-status{margin-top:10px;font-size:14px}",
    ".inq-form .inq-status.ok{color:#1a7d4f}",
    ".inq-form .inq-status.err{color:#c0392b}",
    ".dl-gate{padding:18px 20px;border:1px solid #ddd;border-radius:10px;background:#fafafa}",
    ".dl-gate p{margin:0 0 10px;font-size:14px}",
    ".dl-gate .dl-row{display:flex;gap:10px;flex-wrap:wrap}",
    ".dl-gate input{flex:1;min-width:220px;padding:9px 10px;border:1px solid #ccc;border-radius:6px;font:inherit;font-size:14px}",
    ".dl-gate .dl-status{margin-top:10px;font-size:14px}"
  ].join("\n");
  document.head.appendChild(css);

  function configured() {
    return ACCESS_KEY && ACCESS_KEY !== "YOUR_WEB3FORMS_ACCESS_KEY";
  }

  function send(payload, cb) {
    payload.access_key = ACCESS_KEY;
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (data) { cb(data && data.success); })
      .catch(function () { cb(false); });
  }

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text) n.textContent = text;
    return n;
  }

  function buildForm(container) {
    var product = container.getAttribute("data-product") || "";
    var form = el("form", { class: "inq-form", novalidate: "novalidate" });

    FIELDS.forEach(function (f) {
      var row = el("div", { class: "inq-row" });
      var label = el("label", { for: "inq-" + f.name });
      label.appendChild(document.createTextNode(f.label));
      if (f.required) label.appendChild(el("em", null, "*"));
      if (f.hint) label.appendChild(el("small", null, f.hint));
      row.appendChild(label);
      var input = f.type === "textarea"
        ? el("textarea", { id: "inq-" + f.name, name: f.name, rows: "2" })
        : el("input", { id: "inq-" + f.name, name: f.name, type: f.type });
      if (f.required) input.required = true;
      row.appendChild(input);
      form.appendChild(row);
    });

    if (product) form.appendChild(el("input", { type: "hidden", name: "product_name", value: product }));
    form.appendChild(el("input", { type: "hidden", name: "_subject", value: product ? "官网询价：" + product : "官网询价（未指定产品）" }));
    form.appendChild(el("input", { type: "hidden", name: "来源页面", value: location.pathname }));

    var status = el("p", { class: "inq-status", "aria-live": "polite" });
    var btn = el("button", { class: "btn btn-primary", type: "submit" }, "提交询价");
    form.appendChild(btn);
    form.appendChild(status);

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!configured()) {
        status.className = "inq-status err";
        status.textContent = "表单服务尚未设置（缺少 Web3Forms access key），请参照 README.md 完成设置。";
        return;
      }
      var invalid = form.querySelector(":invalid");
      if (invalid) {
        status.className = "inq-status err";
        status.textContent = "请填写必填字段：" + (invalid.previousElementSibling ? invalid.closest(".inq-row").querySelector("label").textContent.replace("*", "") : "");
        invalid.focus();
        return;
      }
      btn.disabled = true;
      status.className = "inq-status";
      status.textContent = "正在提交…";
      var payload = { from_name: "DSON 官网询价表单" };
      new FormData(form).forEach(function (v, k) {
        if (v) payload[k] = v;
      });
      send(payload, function (success) {
        btn.disabled = false;
        if (success) {
          status.className = "inq-status ok";
          status.textContent = "已收到，我们会尽快与您联系。";
          form.reset();
        } else {
          status.className = "inq-status err";
          status.textContent = "提交失败，请稍后重试，或直接邮件联系 jason@tw-vision.com.cn。";
        }
      });
    });

    container.appendChild(form);
  }

  function buildDownload(container) {
    var gate = el("div", { class: "dl-gate" });
    gate.appendChild(el("p", null, "输入电子邮箱，即可下载《DSON 规格总表》PDF（含 14 个产品系列完整规格）。"));

    function reveal() {
      gate.innerHTML = "";
      gate.appendChild(el("p", null, "感谢！下载链接如下，可直接保存："));
      gate.appendChild(el("a", { class: "btn btn-primary", href: PDF_URL, download: "DSON-spec-sheet.pdf" }, "下载规格总表 PDF"));
    }

    if (!configured()) {
      console.warn("Web3Forms access key 未设置，规格总表 PDF 直接开放下载。");
      reveal();
      container.appendChild(gate);
      return;
    }

    var row = el("div", { class: "dl-row" });
    var input = el("input", { type: "email", placeholder: "你的电子邮箱", "aria-label": "电子邮箱" });
    var btn = el("button", { class: "btn btn-primary", type: "button" }, "获取下载链接");
    var status = el("p", { class: "dl-status", "aria-live": "polite" });
    row.appendChild(input);
    row.appendChild(btn);
    gate.appendChild(row);
    gate.appendChild(status);

    btn.addEventListener("click", function () {
      var email = (input.value || "").trim();
      if (!email || email.indexOf("@") < 1) {
        status.className = "dl-status err";
        status.textContent = "请输入有效的电子邮箱。";
        input.focus();
        return;
      }
      btn.disabled = true;
      status.className = "dl-status";
      status.textContent = "正在处理…";
      send({
        from_name: "DSON 规格总表下载",
        email: email,
        subject: "规格总表 PDF 下载",
        来源页面: location.pathname
      }, function (success) {
        if (success) {
          reveal();
        } else {
          btn.disabled = false;
          status.className = "dl-status err";
          status.textContent = "处理失败，请稍后重试。";
        }
      });
    });

    container.appendChild(gate);
  }

  function init() {
    document.querySelectorAll("[data-inquiry-form]").forEach(buildForm);
    document.querySelectorAll("[data-spec-download]").forEach(buildDownload);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
