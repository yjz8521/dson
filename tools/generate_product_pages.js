const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { renderStaticLegalFooter } = require("./generate_site_footer");
const siteFooterData = require("./site-footer-data");

const root = path.resolve(__dirname, "..");
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "product-data.js"), "utf8"), context);

const products = context.window.DSON_PRODUCTS;
const siteOrigin = "https://www.deshengtest.com";
const INQUIRY_EMAIL = siteFooterData.inquiryEmail;

const staticSpecSources = {
  dth: { file: "dth.html", kind: "legacy", label: "DTH 标准型号、性能、降温时间与主要装置" },
  multilayer: { file: "catalog-specs.html", kind: "catalog", id: "multilayer", label: "JHHS-415T 标准规格" },
  rapid: { file: "rapid-temperature.html", kind: "legacy", label: "800L 标准型、系统配置与执行标准" },
  drug: { file: "catalog-specs.html", kind: "catalog", id: "drug-stability", label: "PJHH-B / PJHH-D 型号规格" },
  walkin: { file: "dath.html", kind: "legacy", label: "DATH 步入式标准型号与共通配置" },
  photovoltaic: { file: "catalog-specs.html", kind: "catalog", id: "photovoltaic", label: "JHWA / JHWB 光伏组件机型参数" },
  twoZoneShock: { file: "dlct.html", kind: "legacy", label: "DLCT 标准型号、回复时间与控制配置" },
  threeZoneShock: { file: "catalog-specs.html", kind: "catalog", id: "three-zone", label: "JHS 系列规格" },
  equalShock: { file: "catalog-specs.html", kind: "catalog", id: "equal-temperature", label: "JHSR 系列规格" },
  vibration: { file: "catalog-specs.html", kind: "catalog", id: "vibration", label: "JHVE-415T 标准规格" },
  ess: { file: "catalog-specs.html", kind: "catalog", id: "ess", label: "JHESS-512L 标准规格" },
  saltSpray: { file: "catalog-specs.html", kind: "catalog", id: "salt-spray", label: "JHL 系列型号规格" },
  rain: { file: "catalog-specs.html", kind: "catalog", id: "rain-test", label: "JHR 系列防水试验参数" },
  sandDust: { file: "catalog-specs.html", kind: "catalog", id: "sand-dust", label: "JH-1000 系列规格" }
};

const sourceCache = new Map();

function sourceHtml(file) {
  if (!sourceCache.has(file)) {
    sourceCache.set(file, fs.readFileSync(path.join(root, file), "utf8"));
  }
  return sourceCache.get(file);
}

function extractStaticSpecifications(key) {
  const source = staticSpecSources[key];
  if (!source) throw new Error(`Missing static specification source for ${key}`);

  const html = sourceHtml(source.file);
  let blocks = [];

  if (source.kind === "catalog") {
    const startMarker = `<article class="catalog-spec-section" id="${source.id}">`;
    const start = html.indexOf(startMarker);
    const end = start >= 0 ? html.indexOf("</article>", start) : -1;
    if (start < 0 || end < 0) throw new Error(`Missing catalog specification section ${source.id}`);
    blocks = [html.slice(start, end + "</article>".length)];
  } else {
    blocks = [...html.matchAll(/<article\s+class="spec-panel"[\s\S]*?<\/article>/gi)].map((match) => match[0]);
    if (!blocks.length) throw new Error(`Missing legacy specification panels in ${source.file}`);
  }

  return `
        <div class="section-heading"><div><p class="section-label">FULL SPECIFICATIONS</p><h2>完整规格与型号参数</h2><p>${escapeHtml(source.label)}</p></div></div>
        ${blocks.join("\n        ")}
        <p class="product-detail-note">以上规格可依实际需求与配置调整，请以正式报价书及技术协议为准。</p>`;
}

function footerMarkup() {
  return `
  <footer class="site-footer">
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
${renderStaticLegalFooter()}
  </footer>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function productPage(key, product) {
  const canonical = `${siteOrigin}/${product.slug}`;
  const mailSubject = encodeURIComponent(`得声设备询价：${product.name}`);
  const specs = product.specs
    .map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join("");
  const features = product.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("");
  const staticSpecifications = extractStaticSpecifications(key);
  const detailIntro = product.detailIntro || product.intro;
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: "DSON 得声" },
    manufacturer: { "@type": "Organization", name: "东莞市得声试验仪器设备有限公司" },
    description: product.intro,
    image: `${siteOrigin}/${product.image}`,
    url: canonical
  });

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(product.name)}｜得声试验设备</title>
  <meta name="description" content="${escapeHtml(product.intro)}" />
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" href="assets/brand/dson-mark.png" type="image/png" />
  <link rel="stylesheet" href="styles.css?v=site-20260805" />
  <script type="application/ld+json">${schema}</script>
</head>
<body class="product-detail-page">
  <header class="site-header">
    <div class="container header-row">
      <a class="brand" href="index.html" aria-label="东莞市得声试验仪器设备有限公司首页">
        <img class="brand-logo" src="assets/brand/dson-logo.webp" width="600" height="196" alt="DSON 得声" />
        <strong class="brand-company">东莞市得声试验仪器设备有限公司</strong>
      </a>
      <a class="detail-back" href="products.html">产品中心</a>
    </div>
  </header>
  <main data-product-detail data-product-key="${escapeHtml(key)}" data-static-product-content>
    <section class="product-detail-hero">
      <div class="container product-detail-hero-grid">
        <div>
          <p class="eyebrow">${escapeHtml(product.family)}</p>
          <h1>${escapeHtml(product.name)}</h1>
          <p>${escapeHtml(detailIntro)}</p>
          <div class="product-detail-actions">
            <a class="btn btn-primary" href="mailto:${INQUIRY_EMAIL}?subject=${mailSubject}">邮件询价</a>
            <a class="btn btn-secondary" href="tel:+8676982654576">电话咨询</a>
          </div>
        </div>
        <div class="product-detail-image">
          <picture>
            <source srcset="${escapeHtml(product.image)}" type="image/webp" />
            <img src="${escapeHtml(product.imageFallback)}" width="1254" height="1254" alt="${escapeHtml(product.name)}" />
          </picture>
        </div>
      </div>
    </section>
    <section class="section product-detail-content">
      <div class="container">
        <div class="section-heading"><div><p class="section-label">CORE SPECIFICATIONS</p><h2>核心规格</h2></div></div>
        <dl class="product-spec-list">${specs}</dl>
        <div class="product-detail-feature">
          <p class="section-label">APPLICATION &amp; CONFIGURATION</p>
          <h2>设备特点与配置方向</h2>
          <ul>${features}</ul>
        </div>
      </div>
    </section>
    <section class="section product-full-specs">
      <div class="container" data-full-specifications data-static-full-specifications>
${staticSpecifications}
      </div>
    </section>
    <section class="section section-accent">
      <div class="container contact-card-cta">
        <p class="section-label">PROJECT INQUIRY</p>
        <h2>提供试验条件，确认适用配置</h2>
        <p>请提供样品尺寸与重量、试验标准、温湿度范围、变化速率、供电、冷却方式与场地条件。</p>
        <div class="product-detail-actions">
          <a class="btn btn-primary" href="mailto:${INQUIRY_EMAIL}?subject=${mailSubject}">发送询价邮件</a>
          <a class="btn btn-secondary" href="index.html#contact">查看完整联系方式</a>
        </div>
      </div>
    </section>
  </main>
${footerMarkup()}
  <script src="product-data.js?v=site-20260805"></script>
  <script src="footer-legal.js?v=site-20260826"></script>
  <script src="product-detail.js?v=site-20260805"></script>
</body>
</html>
`;
}

for (const [key, product] of Object.entries(products)) {
  fs.writeFileSync(path.join(root, product.slug), productPage(key, product), "utf8");
}

console.log(`Generated ${Object.keys(products).length} product pages.`);
