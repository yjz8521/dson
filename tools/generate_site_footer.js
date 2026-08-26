const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const siteFooterData = require("./site-footer-data");
const TODO_CREDIT_CODE_COMMENT = "<!-- TODO: 统一社会信用代码待客户提供后填入此处 -->";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderCreditCodeLine(data, indent) {
  return data.unifiedSocialCreditCode
    ? `${indent}<p>统一社会信用代码：${escapeHtml(data.unifiedSocialCreditCode)}</p>`
    : `${indent}${TODO_CREDIT_CODE_COMMENT}`;
}

function renderStaticLegalFooter(data = siteFooterData) {
  return [
    '    <div class="container footer-legal">',
    `      <p>${escapeHtml(data.companyName)}</p>`,
    `      <p>地址：${escapeHtml(data.address)}　电话：<a href="tel:${escapeHtml(data.phone.replaceAll("-", ""))}">${escapeHtml(data.phone)}</a></p>`,
    renderCreditCodeLine(data, "      "),
    `      <p><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">${escapeHtml(data.icpRecord)}</a></p>`,
    `      <p>© ${escapeHtml(data.copyrightYear)} ${escapeHtml(data.companyName)}　版权所有</p>`,
    "    </div>"
  ].join("\n");
}

function renderBrowserHelper(data = siteFooterData) {
  return `(function () {
  const data = ${JSON.stringify(data)};
  const TODO_CREDIT_CODE_COMMENT = ${JSON.stringify(TODO_CREDIT_CODE_COMMENT)};
  window.DSON_INQUIRY_EMAIL = data.inquiryEmail;

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderLegalFooter() {
    const creditCode = data.unifiedSocialCreditCode
      ? "<p>统一社会信用代码：" + escapeHtml(data.unifiedSocialCreditCode) + "</p>"
      : TODO_CREDIT_CODE_COMMENT;

    return [
      '<div class="container footer-legal">',
      '<p>' + escapeHtml(data.companyName) + '</p>',
      '<p>地址：' + escapeHtml(data.address) + '　电话：<a href="tel:' + escapeHtml(data.phone.replaceAll("-", "")) + '">' + escapeHtml(data.phone) + '</a></p>',
      creditCode,
      '<p><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">' + escapeHtml(data.icpRecord) + '</a></p>',
      '<p>© ' + escapeHtml(data.copyrightYear) + ' ' + escapeHtml(data.companyName) + '　版权所有</p>',
      '</div>'
    ].join("\\n");
  }

  window.installLegalFooter = function installLegalFooter(footer) {
    if (!footer || footer.querySelector(".footer-legal")) return;
    footer.insertAdjacentHTML("beforeend", renderLegalFooter());
  };
})();
`;
}

function addRuntimeHelperScript(html) {
  if (html.includes('src="footer-legal.js')) return html;

  const lineEnding = html.includes("\r\n") ? "\r\n" : "\n";
  const mainScriptPattern = /(\r?\n  <script src="(?:script|product-detail)\.js[^"]*"><\/script>)/;
  if (!mainScriptPattern.test(html)) {
    throw new Error("Missing script.js or product-detail.js include");
  }

  return html.replace(
    mainScriptPattern,
    `${lineEnding}  <script src="footer-legal.js?v=site-20260826"></script>$1`
  );
}

function generateSiteFooter() {
  fs.writeFileSync(path.join(root, "footer-legal.js"), renderBrowserHelper(), "utf8");

  const legalBlockPattern = /    <div class="container footer-legal">[\s\S]*?    <\/div>/;
  const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith(".html"));
  let updatedPages = 0;

  for (const file of htmlFiles) {
    const filePath = path.join(root, file);
    const html = fs.readFileSync(filePath, "utf8");
    if (!legalBlockPattern.test(html)) continue;

    const nextHtml = addRuntimeHelperScript(
      html.replace(legalBlockPattern, renderStaticLegalFooter())
    );
    if (nextHtml !== html) {
      fs.writeFileSync(filePath, nextHtml, "utf8");
      updatedPages += 1;
    }
  }

  const contactFiles = ["index.html", "llms.txt", "script.js", "product-detail.js"];
  const emailPattern = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
  let updatedContactFiles = 0;

  for (const file of contactFiles) {
    const filePath = path.join(root, file);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");
    const nextContent = content.replace(emailPattern, siteFooterData.inquiryEmail);
    if (nextContent !== content) {
      fs.writeFileSync(filePath, nextContent, "utf8");
      updatedContactFiles += 1;
    }
  }

  console.log(
    `Generated footer-legal.js, updated ${updatedPages} HTML pages and ${updatedContactFiles} contact files.`
  );
}

if (require.main === module) {
  generateSiteFooter();
}

module.exports = { renderStaticLegalFooter };
