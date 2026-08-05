const products = window.DSON_PRODUCTS || {};

const fullSpecSources = {
  dth: { url: "dth.html", selector: ".spec-panel table", label: "DTH 标准型号、性能、降温时间与主要装置" },
  multilayer: { url: "catalog-specs.html", selector: "#multilayer table", label: "JHHS-415T 标准规格" },
  rapid: { url: "rapid-temperature.html", selector: ".spec-panel table", label: "800L 标准型、系统配置与执行标准" },
  drug: { url: "catalog-specs.html", selector: "#drug-stability table", label: "PJHH-B / PJHH-D 型号规格" },
  walkin: { url: "dath.html", selector: ".spec-panel table", label: "DATH 步入式标准型号与共通配置" },
  photovoltaic: { url: "catalog-specs.html", selector: "#photovoltaic table", label: "JHWA / JHWB 光伏组件机型参数" },
  twoZoneShock: { url: "dlct.html", selector: ".spec-panel table", label: "DLCT 标准型号、回复时间与控制配置" },
  threeZoneShock: { url: "catalog-specs.html", selector: "#three-zone table", label: "JHS 系列规格" },
  equalShock: { url: "catalog-specs.html", selector: "#equal-temperature table", label: "JHSR 系列规格" },
  vibration: { url: "catalog-specs.html", selector: "#vibration table", label: "JHVE-415T 标准规格" },
  ess: { url: "catalog-specs.html", selector: "#ess table", label: "JHESS-512L 标准规格" },
  saltSpray: { url: "catalog-specs.html", selector: "#salt-spray table", label: "JHL 系列型号规格" },
  rain: { url: "catalog-specs.html", selector: "#rain-test table", label: "JHR 系列防水试验参数" },
  sandDust: { url: "catalog-specs.html", selector: "#sand-dust table", label: "JH-1000 系列规格" }
};

async function loadFullSpecifications(target, source) {
  try {
    const response = await fetch(source.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const documentSource = new DOMParser().parseFromString(await response.text(), "text/html");
    const tables = [...documentSource.querySelectorAll(source.selector)];
    if (!tables.length) throw new Error("No specification tables found");

    target.innerHTML = `<div class="section-heading"><div><p class="section-label">FULL SPECIFICATIONS</p><h2>完整规格与型号参数</h2><p>${source.label}</p></div></div>${tables.map((table) => `<div class="spec-table-wrap product-full-spec-table">${table.outerHTML}</div>`).join("")}<p class="product-detail-note">以上规格可依实际需求与配置调整，请以正式报价书及技术协议为准。</p>`;
  } catch (error) {
    target.innerHTML = `<div class="product-detail-feature"><p class="section-label">FULL SPECIFICATIONS</p><h2>完整规格表</h2><p>完整规格资料暂时无法载入，请打开下方资料页查看。</p><a class="btn btn-secondary" href="${source.url}">查看完整规格表</a></div>`;
  }
}

const detailRoot = document.querySelector("[data-product-detail]");
if (detailRoot) {
  const product = products[detailRoot.dataset.productKey];
  if (product) {
    if (!detailRoot.hasAttribute("data-static-product-content")) {
      detailRoot.innerHTML = `
      <section class="product-detail-hero"><div class="container product-detail-hero-grid"><div><p class="eyebrow">${product.family}</p><h1>${product.name}</h1><p>${product.intro}</p><div class="product-detail-actions"><a class="btn btn-primary" href="index.html#contact">咨询此产品</a><a class="btn btn-secondary" href="products.html">返回产品中心</a></div></div><div class="product-detail-image"><img src="${product.image}" alt="${product.name}" /></div></div></section>
      <section class="section product-detail-content"><div class="container"><div class="section-heading"><div><p class="section-label">CORE SPECIFICATIONS</p><h2>核心规格</h2></div></div><dl class="product-spec-list">${product.specs.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl><div class="product-detail-feature"><p class="section-label">APPLICATION & CONFIGURATION</p><h2>设备特点与配置方向</h2><ul>${product.features.map((feature) => `<li>${feature}</li>`).join("")}</ul></div></div></section>
      <section class="section product-full-specs"><div class="container" data-full-specifications><p class="product-detail-note">正在载入完整规格表...</p></div></section>
      <section class="section section-accent"><div class="container contact-card-cta"><p class="section-label">PROJECT INQUIRY</p><h2>提供试验条件，确认适用配置</h2><p>请提供样品尺寸与重量、试验标准、温湿度范围、变化速率、供电、冷却方式与场地条件。</p><a class="btn btn-primary" href="index.html#contact">联系得声</a></div></section>`;
    }
    loadFullSpecifications(detailRoot.querySelector("[data-full-specifications]"), fullSpecSources[detailRoot.dataset.productKey]);
  }
}

function installIcpFooter() {
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="container footer-row">
      <div>
        <p class="footer-brand">东莞市得声试验仪器设备有限公司</p>
        <p class="footer-copy">环境试验设备与可靠性验证方案。</p>
      </div>
      <div class="footer-links">
        <a href="index.html">首页</a>
        <a href="about.html">公司介绍</a>
        <a href="products.html">产品中心</a>
        <a href="selection-guide.html">选型指南</a>
        <a href="index.html#contact">联系我们</a>
      </div>
    </div>
    <p class="container footer-icp"><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">粤ICP备2026105488号</a></p>`;
  document.body.appendChild(footer);
}

function installCompactContactWidget() {
  if (document.querySelector(".compact-contact-widget")) return;

  const widget = document.createElement("aside");
  widget.className = "compact-contact-widget";
  widget.setAttribute("aria-label", "得声在线咨询");
  widget.innerHTML = `
    <button class="compact-contact-toggle" type="button" aria-expanded="false">
      <span>咨询</span>
    </button>
    <div class="compact-contact-panel" hidden>
      <div class="compact-contact-head">
        <strong>联系得声</strong>
        <button type="button" aria-label="收起咨询窗口">×</button>
      </div>
      <p>提供试验条件、样品尺寸与温湿度范围，我们协助确认设备方案。</p>
      <a href="tel:+8676982654576">电话：0769-82654576</a>
      <a href="mailto:jason@tw-vision.com.cn">邮箱：jason@tw-vision.com.cn</a>
      <a href="index.html#contact">查看联系方式</a>
    </div>
  `;

  const toggle = widget.querySelector(".compact-contact-toggle");
  const close = widget.querySelector(".compact-contact-head button");
  const panel = widget.querySelector(".compact-contact-panel");

  function setOpen(isOpen) {
    widget.classList.toggle("is-open", isOpen);
    panel.hidden = !isOpen;
    toggle.setAttribute("aria-expanded", String(isOpen));
  }

  toggle.addEventListener("click", () => setOpen(!widget.classList.contains("is-open")));
  close.addEventListener("click", () => setOpen(false));
  document.body.appendChild(widget);
}

installIcpFooter();
installCompactContactWidget();
