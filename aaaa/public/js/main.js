/* 
  Geeta Traders - Interactivity Script
*/

document.addEventListener('DOMContentLoaded', () => {
  // ─── Header Scroll Effect ───
  const header = document.getElementById('mainHeader');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // ─── Mobile Menu Toggle ───
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNav = document.getElementById('mobileNav');
  
  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      
      // Animate hamburger
      const lines = mobileMenuBtn.querySelectorAll('.hamburger-line');
      lines.forEach(line => line.classList.toggle('active'));
    });
    
    // Close menu when clicking a link
    mobileNav.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
      });
    });
  }

  // ─── Counter Animation for Trust Section ───
  const counters = document.querySelectorAll('.trust-number');
  const counterOptions = {
    threshold: 1,
    rootMargin: "0px 0px -100px 0px"
  };

  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const countTo = parseInt(target.getAttribute('data-count'));
        let currentCount = 0;
        const duration = 2000; // 2 seconds
        const step = countTo / (duration / 30);
        
        const timer = setInterval(() => {
          currentCount += step;
          if (currentCount >= countTo) {
            target.innerText = countTo + (target.innerText.includes('+') ? '+' : '');
            clearInterval(timer);
          } else {
            target.innerText = Math.floor(currentCount);
          }
        }, 30);
        
        observer.unobserve(target);
      }
    });
  }, counterOptions);

  counters.forEach(counter => counterObserver.observe(counter));

  // ─── Carousel logic for Featured Products (if present) ───
  const track = document.querySelector('.carousel-track');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  
  if (track && prevBtn && nextBtn) {
    let scrollAmount = 0;
    const cardWidth = 320; // card width + gap
    
    nextBtn.addEventListener('click', () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      scrollAmount = Math.min(scrollAmount + cardWidth, maxScroll);
      track.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
    });
    
    prevBtn.addEventListener('click', () => {
      scrollAmount = Math.max(scrollAmount - cardWidth, 0);
      track.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
    });
  }
});
