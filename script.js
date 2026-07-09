const headerToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");

if (headerToggle && nav) {
  headerToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    headerToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      headerToggle.setAttribute("aria-expanded", "false");
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
