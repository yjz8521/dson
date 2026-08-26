const products = window.DSON_PRODUCTS || {};

const detailRoot = document.querySelector("[data-product-detail]");
if (detailRoot) {
  const product = products[detailRoot.dataset.productKey];
  if (product) {
    if (!detailRoot.hasAttribute("data-static-product-content")) {
      detailRoot.innerHTML = `
      <section class="product-detail-hero"><div class="container product-detail-hero-grid"><div><p class="eyebrow">${product.family}</p><h1>${product.name}</h1><p>${product.detailIntro || product.intro}</p><div class="product-detail-actions"><a class="btn btn-primary" href="index.html#contact">咨询此产品</a><a class="btn btn-secondary" href="products.html">返回产品中心</a></div></div><div class="product-detail-image"><img src="${product.image}" alt="${product.name}" /></div></div></section>
      <section class="section product-detail-content"><div class="container"><div class="section-heading"><div><p class="section-label">CORE SPECIFICATIONS</p><h2>核心规格</h2></div></div><dl class="product-spec-list">${product.specs.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl><div class="product-detail-feature"><p class="section-label">APPLICATION & CONFIGURATION</p><h2>设备特点与配置方向</h2><ul>${product.features.map((feature) => `<li>${feature}</li>`).join("")}</ul></div></div></section>
      <section class="section product-full-specs"><div class="container" data-full-specifications><p class="product-detail-note">正在载入完整规格表...</p></div></section>
      <section class="section section-accent"><div class="container contact-card-cta"><p class="section-label">PROJECT INQUIRY</p><h2>提供试验条件，确认适用配置</h2><p>请提供样品尺寸与重量、试验标准、温湿度范围、变化速率、供电、冷却方式与场地条件。</p><a class="btn btn-primary" href="index.html#contact">联系得声</a></div></section>`;
    }
  }
}

function installIcpFooter() {
  let footer = document.querySelector(".site-footer");
  if (!footer) {
    footer = document.createElement("footer");
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
      </div>`;
    document.body.appendChild(footer);
  }

  if (!footer.querySelector(".footer-legal")) {
    footer.insertAdjacentHTML(
      "beforeend",
      `<div class="container footer-legal">
        <p>东莞市得声试验仪器设备有限公司</p>
        <p>地址：广东省东莞市黄江镇田美宝龙三街 16 号　电话：<a href="tel:076982654576">0769-82654576</a></p>
        <p>统一社会信用代码：待补</p>
        <p><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">粤ICP备2026105488号</a></p>
        <p>© 2026 东莞市得声试验仪器设备有限公司　版权所有</p>
      </div>`
    );
  }
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
