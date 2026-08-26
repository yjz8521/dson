(function () {
  const data = {"companyName":"东莞市得声试验仪器设备有限公司","address":"广东省东莞市黄江镇田美宝龙三街 16 号","phone":"0769-82654576","inquiryEmail":"jason@tw-vision.com.cn","icpRecord":"粤ICP备2026105488号","unifiedSocialCreditCode":"","copyrightYear":"2026"};
  const TODO_CREDIT_CODE_COMMENT = "<!-- TODO: 统一社会信用代码待客户提供后填入此处 -->";
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
    ].join("\n");
  }

  window.installLegalFooter = function installLegalFooter(footer) {
    if (!footer || footer.querySelector(".footer-legal")) return;
    footer.insertAdjacentHTML("beforeend", renderLegalFooter());
  };
})();
