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