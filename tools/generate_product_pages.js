const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "product-data.js"), "utf8"), context);

const products = context.window.DSON_PRODUCTS;
const siteOrigin = "https://www.deshengtest.com";

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
          <p>${escapeHtml(product.intro)}</p>
          <div class="product-detail-actions">
            <a class="btn btn-primary" href="mailto:jason@tw-vision.com.cn?subject=${mailSubject}">邮件询价</a>
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
      <div class="container" data-full-specifications>
        <p class="product-detail-note">正在载入完整规格表。若未自动显示，请打开<a href="catalog-specs.html">规格汇总页</a>查看。</p>
      </div>
    </section>
    <section class="section section-accent">
      <div class="container contact-card-cta">
        <p class="section-label">PROJECT INQUIRY</p>
        <h2>提供试验条件，确认适用配置</h2>
        <p>请提供样品尺寸与重量、试验标准、温湿度范围、变化速率、供电、冷却方式与场地条件。</p>
        <div class="product-detail-actions">
          <a class="btn btn-primary" href="mailto:jason@tw-vision.com.cn?subject=${mailSubject}">发送询价邮件</a>
          <a class="btn btn-secondary" href="index.html#contact">查看完整联系方式</a>
        </div>
      </div>
    </section>
  </main>
  <script src="product-data.js?v=site-20260805"></script>
  <script src="product-detail.js?v=site-20260805"></script>
</body>
</html>
`;
}

for (const [key, product] of Object.entries(products)) {
  fs.writeFileSync(path.join(root, product.slug), productPage(key, product), "utf8");
}

console.log(`Generated ${Object.keys(products).length} product pages.`);
