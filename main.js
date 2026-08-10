const revealItems = document.querySelectorAll(".reveal");
const hero = document.querySelector(".hero");
const orbs = document.querySelectorAll(".orb");
const yearNode = document.querySelector("[data-year]");

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

revealItems.forEach((item) => revealObserver.observe(item));

if (hero && orbs.length) {
  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 28;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 28;

    orbs[0].style.transform = `translate(${x * 1.1}px, ${y * 1.1}px) scale(1.05)`;
    orbs[1].style.transform = `translate(${x * -0.9}px, ${y * -0.9}px) scale(1.08)`;
    orbs[2].style.transform = `translate(${x * 0.7}px, ${y * 0.7}px) scale(1.12)`;
  });

  hero.addEventListener("pointerleave", () => {
    orbs.forEach((orb) => {
      orb.style.transform = "translate(0, 0) scale(1)";
    });
  });
}

window.addEventListener("load", () => {
  requestAnimationFrame(() => {
    document.body.classList.add("is-ready");
  });
});
