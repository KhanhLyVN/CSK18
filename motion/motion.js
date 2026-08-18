(() => {
    'use strict';
  
    const revealSelectors = [
      '.hero',
      '.page-header',
      '.content-wrap > section',
      '.content-wrap > article',
      '.content-wrap > .card',
      '.main-content > .wrap',
      '.main-content > section',
      '.login-card',
      '.form-card',
      '.ticket-detail',
      '.chat-container'
    ].join(',');
  
    const cardSelectors = [
      '.card', '.stat-card', '.settings-card', '.report-card', '.account-panel',
      '.ticket-card', '.faq-item', '.step', '.firebase-box', '.profile-preview'
    ].join(',');
  
    const init = () => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const revealItems = [...document.querySelectorAll(revealSelectors)];
      const cards = document.querySelectorAll(cardSelectors);
      const overlays = document.querySelectorAll('.drawer, .modal, [role="dialog"]');
  
      cards.forEach(card => card.classList.add('motion-hover-card'));
      overlays.forEach(overlay => overlay.classList.add(overlay.classList.contains('drawer') ? 'motion-drawer' : 'motion-modal'));
  
      if (reduceMotion) return;
  
      document.documentElement.classList.add('motion-js');
      revealItems.forEach((item, index) => {
        item.dataset.motionReveal = index === 0 ? 'side' : 'scale';
        item.style.setProperty('--motion-delay', `${Math.min(index, 7) * 52}ms`);
      });
  
      if (!('IntersectionObserver' in window)) {
        revealItems.forEach(item => item.classList.add('motion-visible'));
        return;
      }
  
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('motion-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -28px' });
  
      revealItems.forEach(item => observer.observe(item));
    };
  
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
  })();
  
  