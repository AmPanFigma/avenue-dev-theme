let images = gsap.utils.toArray(".avi-image img");

images.forEach((image)=>{
    gsap.set(image, {scale:1.2});
    gsap.to(image,{
        scale:1,
        scrollTrigger:{
                trigger: image,
                pin:false,
                markers:false,
                scrub:1
                }
    })
    })

/* Add .active to header after a small scroll */
;(function () {
  const header = document.querySelector('header');
  if (!header) return;
  const THRESHOLD = 50; // px scrolled before header becomes "active"
  const toggle = (y) => header.classList.toggle('active', y > THRESHOLD);

  // Hook into Lenis if present, otherwise fall back to native scroll.
  if (window.lenis && typeof window.lenis.on === 'function') {
    window.lenis.on('scroll', ({ scroll }) => toggle(scroll));
  } else {
    window.addEventListener('scroll', () => toggle(window.scrollY), { passive: true });
  }
  toggle(window.scrollY); // set correct state on load
})();

/* Home banner logo -> header logo scroll transition */
;(function () {
  if (typeof gsap === 'undefined') return;
  const bannerLogo = document.querySelector('.banner.home .bct-image');
  const headerLogo = document.querySelector('header .header-logo');
  if (!bannerLogo || !headerLogo) return; // only on the home page

  if (typeof ScrollTrigger !== 'undefined' && gsap.registerPlugin) {
    gsap.registerPlugin(ScrollTrigger);
  }

  // Header logo starts hidden + small; it grows into place as you scroll.
  gsap.set(headerLogo, { autoAlpha: 0, scale: 0.55, transformOrigin: 'center center' });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.banner.home',
      start: 'top top',
      end: '+=600',     // distance over which the transition plays
      scrub: 0.5
    }
  });

  // Banner logo lifts up, shrinks toward the header, and fades out.
  tl.to(bannerLogo, {
    y: () => -(bannerLogo.getBoundingClientRect().top + bannerLogo.offsetHeight * 0.5),
    scale: 0.18,
    autoAlpha: 0,
    ease: 'none'
  }, 0);

  // Header logo scales up into place in sync with the banner logo (starts at 0).
  tl.to(headerLogo, {
    autoAlpha: 1,
    scale: 1,
    ease: 'none'
  }, 0.2);
})();

/* Clip-path image reveal on scroll-into-view */
;(function () {
  if (typeof gsap === 'undefined') return;
  if (typeof ScrollTrigger !== 'undefined' && gsap.registerPlugin) {
    gsap.registerPlugin(ScrollTrigger);
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll('.about-avenue .avi-image, .about-avenue .avbl-image, .ici-image, .bi-image').forEach(function (el) {
    gsap.fromTo(el,
      { clipPath: 'inset(0 0 100% 0)' },
      {
        clipPath: 'inset(0 0 0% 0)',
        duration: 1.8,
        ease: 'power3.out',
        markers: true,
        scrollTrigger: { trigger: el, start: 'top 70%', once: true }
      }
    );
  });
})();

/* Word-by-word reveal for headings (h1, h2) */
;(function () {
  if (typeof gsap === 'undefined') return;
  if (typeof ScrollTrigger !== 'undefined' && gsap.registerPlugin) {
    gsap.registerPlugin(ScrollTrigger);
  }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('h1, h2, h3, .subheading p').forEach(function (h) {
    // skip already-processed, empty, or markup-containing headings (e.g. logo image)
    if (h.dataset.reveal || h.children.length > 0) return;
    var text = h.textContent.trim();
    if (!text) return;
    h.dataset.reveal = 'done';

    var inners = [];
    var words = text.split(/\s+/);
    h.textContent = '';
    words.forEach(function (word, i) {
      var outer = document.createElement('span');
      outer.className = 'reveal-word';
      var inner = document.createElement('span');
      inner.textContent = word;
      outer.appendChild(inner);
      h.appendChild(outer);
      if (i < words.length - 1) h.appendChild(document.createTextNode(' '));
      inners.push(inner);
    });

    if (reduce) { gsap.set(inners, { yPercent: 0 }); return; }

    gsap.set(inners, { yPercent: 110 });
    gsap.to(inners, {
      yPercent: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: { trigger: h, start: 'top 88%', once: true }
    });
  });
})();