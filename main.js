const yearNode = document.querySelector("[data-year]");
const revealItems = document.querySelectorAll(".reveal");
const navLinks = document.querySelectorAll('.nav a[href^="#"]');
const navSections = [...navLinks].map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
const progressNode = document.querySelector("[data-reading-progress]");
const siteHeader = document.querySelector("[data-site-header]");
const tendedDate = document.querySelector("[data-tended-date]");

if (yearNode) yearNode.textContent = new Date().getFullYear();
if (tendedDate) {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  tendedDate.textContent = `${day}.${month}.${year}`;
  tendedDate.dateTime = now.toISOString().slice(0, 10);
}

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    revealObserver.unobserve(entry.target);
  }), { threshold: 0.14 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
document.querySelectorAll(".hero .reveal").forEach((item) => item.classList.add("is-visible"));

if ("IntersectionObserver" in window) {
  const navObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => {
      const current = link.getAttribute("href") === `#${entry.target.id}`;
      link.toggleAttribute("aria-current", current);
      if (current) link.setAttribute("aria-current", "location");
    });
  }), { rootMargin: "-38% 0px -52%", threshold: 0 });
  navSections.forEach((section) => navObserver.observe(section));
}

const updateScrollChrome = () => {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
  if (progressNode) progressNode.style.transform = `scaleX(${progress})`;
  if (siteHeader) siteHeader.classList.toggle("is-compact", window.scrollY > 48);
};

updateScrollChrome();
window.addEventListener("scroll", updateScrollChrome, { passive: true });
window.addEventListener("resize", updateScrollChrome);

