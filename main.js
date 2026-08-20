const revealItems = document.querySelectorAll(".reveal");
const hero = document.querySelector(".hero");
const orbs = document.querySelectorAll(".orb");
const yearNode = document.querySelector("[data-year]");
const navLinks = document.querySelectorAll('.nav a[href^="#"]');
const navSections = [...navLinks]
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

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

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      navLinks.forEach((link) => {
        const isCurrent = link.getAttribute("href") === `#${entry.target.id}`;
        if (isCurrent) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    });
  },
  { rootMargin: "-35% 0px -55%", threshold: 0 }
);

navSections.forEach((section) => navObserver.observe(section));

const studioGallery = document.querySelector("[data-gallery]");

if (studioGallery) {
  const works = [
    {
      href: "https://www.instagram.com/p/DUhJgeaE_pX/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
      src: "instagram-posts/post-1-optimized.jpg",
      alt: "A visual study combining climbing leaves and a wave-like emblem",
      caption: "A mark looking for a place to land.",
    },
    {
      href: "https://www.instagram.com/p/DPNQtujE5JN/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
      src: "instagram-posts/post-2-optimized.jpg",
      alt: "A green hillside and calm river under a clouded sky",
      caption: "Water, weather, and one place to stay.",
    },
    {
      href: "https://www.instagram.com/p/DRaGJ5kE6tO/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
      src: "instagram-posts/post-3-optimized.jpg",
      alt: "A camera held up against a dark sea and clouded sky",
      caption: "The camera as a way of asking.",
    },
    {
      href: "https://www.instagram.com/p/DPeBN2LE1zC/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
      src: "instagram-posts/post-4-optimized.jpg",
      alt: "Close view of a green field jacket with a colorful embroidered patch",
      caption: "A field jacket, held close.",
    },
    {
      href: "https://www.instagram.com/p/DYG1nmNlD-u/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
      src: "instagram-posts/post-5-optimized.jpg",
      alt: "A group of students in green jackets gathering outdoors",
      caption: "Study is never only solitary.",
    },
    {
      href: "https://www.instagram.com/p/DVD6J_tk6nr/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
      src: "instagram-posts/post-6-optimized.jpg",
      alt: "A person sitting beside a lit roadside late at night",
      caption: "A pause at the edge of the road.",
    },
  ];
  const galleryImage = studioGallery.querySelector("img");
  const galleryLink = studioGallery.querySelector("[data-gallery-link]");
  const galleryCount = studioGallery.querySelector("[data-gallery-count]");
  const galleryCaption = studioGallery.querySelector("[data-gallery-caption]");
  const previousButton = studioGallery.querySelector("[data-gallery-previous]");
  const nextButton = studioGallery.querySelector("[data-gallery-next]");
  const slideButtons = [...studioGallery.querySelectorAll("[data-gallery-slide]")];
  let currentWork = 0;

  const showWork = (index) => {
    currentWork = (index + works.length) % works.length;
    const work = works[currentWork];

    galleryImage.src = work.src;
    galleryImage.alt = work.alt;
    galleryLink.href = work.href;
    galleryLink.setAttribute(
      "aria-label",
      `Open visual journal entry ${currentWork + 1} on Instagram`
    );
    galleryCount.textContent = `${String(currentWork + 1).padStart(2, "0")} / ${String(works.length).padStart(2, "0")}`;
    galleryCaption.textContent = work.caption;

    slideButtons.forEach((button, buttonIndex) => {
      const isCurrent = buttonIndex === currentWork;
      button.classList.toggle("is-active", isCurrent);
      if (isCurrent) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  };

  previousButton.addEventListener("click", () => showWork(currentWork - 1));
  nextButton.addEventListener("click", () => showWork(currentWork + 1));

  slideButtons.forEach((button) => {
    button.addEventListener("click", () => showWork(Number(button.dataset.gallerySlide)));
  });

  studioGallery.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    showWork(currentWork + (event.key === "ArrowRight" ? 1 : -1));
    slideButtons[currentWork].focus();
  });
}

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
