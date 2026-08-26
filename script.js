const headerToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");

if (headerToggle && nav) {
  headerToggle.setAttribute("aria-label", "打开导航菜单");

  headerToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    headerToggle.setAttribute("aria-expanded", String(isOpen));
    headerToggle.setAttribute("aria-label", isOpen ? "关闭导航菜单" : "打开导航菜单");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      headerToggle.setAttribute("aria-expanded", "false");
      headerToggle.setAttribute("aria-label", "打开导航菜单");
    });
  });
}

const slides = Array.from(document.querySelectorAll(".hero-slide"));
const dotsHost = document.querySelector(".hero-dots");
const prevButton = document.querySelector('[data-dir="prev"]');
const nextButton = document.querySelector('[data-dir="next"]');
let currentSlide = 0;
let autoplayId = null;

function renderSlide(index) {
  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === index);
  });

  if (dotsHost) {
    dotsHost.querySelectorAll(".hero-dot").forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === index);
    });
  }
}

function goToSlide(index) {
  currentSlide = (index + slides.length) % slides.length;
  renderSlide(currentSlide);
}

function stepSlide(direction) {
  goToSlide(currentSlide + direction);
}

function resetAutoplay() {
  if (autoplayId) {
    window.clearInterval(autoplayId);
  }

  autoplayId = window.setInterval(() => {
    stepSlide(1);
  }, 5200);
}

if (slides.length && dotsHost) {
  slides.forEach((_, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hero-dot";
    button.setAttribute("aria-label", `切換到第 ${index + 1} 張`);
    button.addEventListener("click", () => {
      goToSlide(index);
      resetAutoplay();
    });
    dotsHost.appendChild(button);
  });

  renderSlide(currentSlide);
  resetAutoplay();
}

if (prevButton) {
  prevButton.addEventListener("click", () => {
    stepSlide(-1);
    resetAutoplay();
  });
}

if (nextButton) {
  nextButton.addEventListener("click", () => {
    stepSlide(1);
    resetAutoplay();
  });
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
