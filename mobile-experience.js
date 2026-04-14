(() => {
  const MOBILE_QUERY = '(max-width: 768px)';
  const mobileMedia = window.matchMedia(MOBILE_QUERY);

  const debounce = (fn, delay = 120) => {
    let timer = null;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), delay);
    };
  };

  const initMobileMenu = () => {
    const header = document.querySelector('.site-header');
    const nav = document.querySelector('.site-nav');
    if (!header || !nav || nav.dataset.mobileReady === 'true') return;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'mobile-nav-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'primary-mobile-nav');
    toggle.textContent = 'Menu';

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'mobile-nav-close';
    close.setAttribute('aria-label', 'Fermer le menu mobile');
    close.textContent = '×';

    const backdrop = document.createElement('div');
    backdrop.className = 'mobile-nav-backdrop';
    backdrop.hidden = true;

    if (!nav.id) nav.id = 'primary-mobile-nav';
    nav.prepend(close);

    const originalParent = nav.parentElement;
    const originalNextSibling = nav.nextElementSibling;

    const placeNavForViewport = () => {
      if (mobileMedia.matches) {
        if (nav.parentElement !== document.body) document.body.appendChild(nav);
      } else if (originalParent && nav.parentElement !== originalParent) {
        if (originalNextSibling && originalNextSibling.parentElement === originalParent) {
          originalParent.insertBefore(nav, originalNextSibling);
        } else {
          originalParent.appendChild(nav);
        }
      }
    };

    const closeMenu = () => {
      nav.classList.remove('is-open');
      header.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('mobile-menu-open');
      window.setTimeout(() => {
        if (!document.body.classList.contains('mobile-menu-open')) backdrop.hidden = true;
      }, 180);
    };

    const openMenu = () => {
      if (!mobileMedia.matches) return;
      backdrop.hidden = false;
      nav.classList.add('is-open');
      header.classList.add('menu-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('mobile-menu-open');
      close.focus();
    };

    toggle.addEventListener('click', () => {
      if (nav.classList.contains('is-open')) closeMenu();
      else openMenu();
    });

    close.addEventListener('click', closeMenu);
    backdrop.addEventListener('click', closeMenu);

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (mobileMedia.matches) closeMenu();
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });

    nav.before(toggle);
    document.body.appendChild(backdrop);
    nav.dataset.mobileReady = 'true';
    placeNavForViewport();

    const syncMenu = () => {
      placeNavForViewport();
      if (!mobileMedia.matches) closeMenu();
    };

    mobileMedia.addEventListener('change', syncMenu);
  };

  const initCardReveal = () => {
    const cards = document.querySelectorAll('.card, .info-card, .duo-profile, .about-hero, .about-highlight');
    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-inview');
        });
      },
      { threshold: 0.12 }
    );

    cards.forEach((card, index) => {
      card.style.setProperty('--delay', `${Math.min(index * 55, 280)}ms`);
      card.classList.add(index % 2 === 0 ? 'reveal-left' : 'reveal-right');
      observer.observe(card);
    });
  };

  const initScrollProgress = () => {
    if (document.querySelector('.scroll-progress')) return;

    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      bar.style.setProperty('--progress', `${Math.min(progress, 100)}%`);
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', debounce(updateProgress, 30));
  };

  const initRippleButtons = () => {
    document.querySelectorAll('.btn, .random-pick-btn, .mobile-nav-toggle, .mobile-collapse-toggle').forEach((button) => {
      if (button.dataset.rippleReady === 'true') return;
      button.dataset.rippleReady = 'true';

      button.addEventListener('pointerdown', (event) => {
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple-dot';
        ripple.style.left = `${event.clientX - rect.left}px`;
        ripple.style.top = `${event.clientY - rect.top}px`;
        button.appendChild(ripple);
        window.setTimeout(() => ripple.remove(), 520);
      });
    });
  };

  const initParallaxHero = () => {
    const hero = document.querySelector('.hero-map');
    if (!hero) return;

    const applyParallax = () => {
      if (!mobileMedia.matches) {
        hero.style.removeProperty('--parallax-y');
        return;
      }
      const rect = hero.getBoundingClientRect();
      const offset = Math.max(Math.min(rect.top * -0.04, 10), -10);
      hero.style.setProperty('--parallax-y', `${offset}px`);
    };

    applyParallax();
    window.addEventListener('scroll', applyParallax, { passive: true });
    window.addEventListener('resize', debounce(applyParallax, 50));
  };

  const initMobileAccordions = () => {
    const containers = document.querySelectorAll('main section .grid-links, main section .cards');
    containers.forEach((container) => {
      if (container.dataset.collapseReady === 'true') return;
      if (container.children.length < 4) return;

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'mobile-collapse-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'Voir plus';

      container.classList.add('mobile-collapsible', 'is-collapsed');
      container.after(toggle);
      container.dataset.collapseReady = 'true';

      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        container.classList.toggle('is-collapsed', expanded);
        toggle.textContent = expanded ? 'Voir plus' : 'Voir moins';
      });
    });

    const syncCollapse = () => {
      document.querySelectorAll('.mobile-collapsible').forEach((container) => {
        if (mobileMedia.matches) return;
        container.classList.remove('is-collapsed');
      });
      document.querySelectorAll('.mobile-collapse-toggle').forEach((toggle) => {
        if (!mobileMedia.matches) {
          toggle.setAttribute('aria-expanded', 'true');
          toggle.textContent = 'Voir moins';
        }
      });
    };

    mobileMedia.addEventListener('change', syncCollapse);
    syncCollapse();
  };

  const init = () => {
    initMobileMenu();
    initCardReveal();
    initScrollProgress();
    initRippleButtons();
    initParallaxHero();
    initMobileAccordions();
  };

  const boot = debounce(init, 20);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
