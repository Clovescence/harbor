import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initAnimations() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cinematicIntro = document.getElementById('cinematic-intro');

  // Reduced motion: show everything immediately
  if (prefersReducedMotion) {
    if (cinematicIntro) cinematicIntro.style.display = 'none';
    document.querySelectorAll('section:not(#home)').forEach(el => gsap.set(el, { opacity: 1, y: 0 }));
    return;
  }

  // ─── Cinematic Intro Sequence ────────────────────────────────────────────────
  const tl = gsap.timeline();
  
  if (cinematicIntro) {
    tl.to('.intro-title', { opacity: 1, duration: 1.2, ease: 'power2.out' })
      .to('.intro-title', { opacity: 0, duration: 0.8, ease: 'power2.in', delay: 0.5 })
      .to('#cinematic-intro', { opacity: 0, duration: 0.8, ease: 'power2.inOut' }, '-=0.4')
      .set('#cinematic-intro', { display: 'none' });
  }

  // ─── Nav entrance (once on load) ────────────────────────────────────────────
  tl.fromTo('.nav-brand',
    { opacity: 0, y: -16 },
    { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' },
    '-=0.2'
  );
  tl.fromTo('.nav-links li',
    { opacity: 0, y: -16 },
    { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'power3.out' },
    '<0.2'
  );

  // ─── Hero: animate in once, stays visible forever ───────────────────────────
  tl.fromTo('.watermark-home',
    { opacity: 0, scale: 0.92 },
    { opacity: 1, scale: 1, duration: 2.5, ease: 'power2.out' },
    '<'
  );
  tl.fromTo('.home-intro',
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out' },
    '<0.2'
  );
  tl.fromTo('.home-widget',
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out' },
    '<0.3'
  );

  // ─── All non-hero sections ───────────────────────────────────────────────────
  // CSS already hides them (opacity: 0, translateY(70px)) — GSAP animates in/out
  const sections = document.querySelectorAll('section:not(#home)');

  sections.forEach(section => {
    ScrollTrigger.create({
      trigger: section,
      // 'top 100%' = fire only when section top crosses the very bottom of the viewport
      // This guarantees it never fires on initial load
      start: 'top 100%',
      onEnter: () => {
        gsap.to(section, {
          opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
          clearProps: 'will-change', // clean up after animation
        });
      },
      onLeaveBack: () => {
        gsap.to(section, { opacity: 0, y: 70, duration: 0.7, ease: 'power3.in' });
      },
    });
  });
}
