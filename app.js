const MAP_SVG_PATH = './france-departements.svg';
const ARIEGE_CODE = '09';
const VIEWBOX_PADDING = 12;
const TOAST_MESSAGE = 'Bientôt disponible. JamaisToutVu commence par l’Ariège.';

const mapRoot = document.getElementById('map-root');
const modalOverlay = document.getElementById('modal-overlay');
const modalCloseButton = document.getElementById('modal-close');
const toast = document.getElementById('toast');

const ariegeTag = document.getElementById('ariege-tag');
const mobileSheet = document.getElementById('mobile-map-sheet');
const mobileSheetOverlay = document.getElementById('mobile-sheet-overlay');
const mobileSheetClose = document.getElementById('mobile-sheet-close');
const mobileSheetContent = document.getElementById('mobile-sheet-content');
const mapOpenTriggers = document.querySelectorAll('.map-open-trigger');
const mobileStickyCta = document.querySelector('.mobile-sticky-cta');
const heroSection = document.querySelector('.hero-map');

const OUTING_POOL = [
  {
    name: 'Pont du Diable : balade famille gratuite',
    href: '/blog/pont-du-diable-montoulieu-balade-famille.html',
    image: '/images/pont-diable.webp',
    alt: 'Pont du Diable',
    description: 'Accès libre, conseils parking et idée de boucle courte avec enfants.',
  },
  {
    name: 'Aire de jeux Mercus-Garrabet : sortie famille',
    href: '/blog/aire-de-jeux-mercus-garrabet-famille.html',
    image: '/images/aire-jeux-mercus.webp',
    alt: 'Aire de jeux Mercus-Garrabet',
    description: 'Jeux, tyrolienne et city stade pour une pause famille rapide et gratuite.',
  },
  {
    name: 'Fontaine de Fontestorbe : sortie famille',
    href: '/blog/fontaine-de-fontestorbe-sortie-famille.html',
    image: '/images/fontestorbe.webp',
    alt: 'Fontaine de Fontestorbe',
    description: 'Une source spectaculaire et facile d’accès à observer avec les enfants.',
  },
  {
    name: 'Plaine des sports d\'Auzat : sortie famille',
    href: '/blog/plaine-des-sports-auzat-sortie-famille.html',
    image: '/images/plaine-sports-auzat.webp',
    alt: 'Plaine des sports d\'Auzat',
    description: 'Aire de jeux, skatepark et bike park pour se dépenser en famille.',
  },
  {
    name: 'Château de Miglos : visite libre en Ariège',
    href: '/blog/chateau-de-miglos-visite-libre-famille.html',
    image: '/images/chateau-miglos.webp',
    alt: 'Château de Miglos',
    description: 'Un site médiéval à explorer gratuitement avec panorama sur la vallée.',
  },
];

const OUTING_STORAGE_KEY = 'jtv-home-outings-last';

const isMobileViewport = () => window.innerWidth <= 768;

let mapOriginalParent = null;
let mapOriginalNextSibling = null;

let toastTimer;
let lastFocusedElement = null;

const normalizeText = (value) =>
  (value || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const getDepartmentCode = (node) => {
  const idMatch = node.id?.match(/^dep_(\d{2}|2a|2b)$/i);
  if (idMatch) return idMatch[1].toUpperCase();

  const text = `${node.id || ''} ${node.querySelector('title')?.textContent || ''}`;
  const codeMatch = text.match(/\b(0[1-9]|[1-8][0-9]|9[0-5]|2A|2B)\b/i);
  return codeMatch ? codeMatch[1].toUpperCase() : '';
};

const isAriegeDepartment = (node) => {
  const code = getDepartmentCode(node);
  if (code === ARIEGE_CODE) return true;

  const text = `${node.id || ''} ${node.getAttribute('aria-label') || ''} ${
    node.querySelector('title')?.textContent || ''
  }`;
  return normalizeText(text).includes('ariege');
};

const getDepartmentName = (node) => node.querySelector('title')?.textContent?.trim() || '';

const updateSvgViewBox = (svg, shapes) => {
  const bounds = shapes
    .map((shape) => {
      try {
        return shape.getBBox();
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (!bounds.length) return;

  const minX = Math.min(...bounds.map((box) => box.x));
  const minY = Math.min(...bounds.map((box) => box.y));
  const maxX = Math.max(...bounds.map((box) => box.x + box.width));
  const maxY = Math.max(...bounds.map((box) => box.y + box.height));

  const width = maxX - minX;
  const height = maxY - minY;

  svg.setAttribute(
    'viewBox',
    `${minX - VIEWBOX_PADDING} ${minY - VIEWBOX_PADDING} ${width + VIEWBOX_PADDING * 2} ${height + VIEWBOX_PADDING * 2}`
  );
};

const showToast = () => {
  window.clearTimeout(toastTimer);
  toast.textContent = TOAST_MESSAGE;
  toast.classList.add('show');
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2600);
};

const openModal = () => {
  lastFocusedElement = document.activeElement;
  modalOverlay.classList.add('open');
  modalOverlay.setAttribute('aria-hidden', 'false');
  modalCloseButton.focus();
};

const closeModal = () => {
  modalOverlay.classList.remove('open');
  modalOverlay.setAttribute('aria-hidden', 'true');
  if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
};

const activateDepartment = (departmentNode) => {
  if (departmentNode.classList.contains('is-ariege')) {
    openModal();
    return;
  }
  showToast();
};

const enhanceDepartment = (departmentNode) => {
  const code = getDepartmentCode(departmentNode);
  const isAriege = isAriegeDepartment(departmentNode);
  const name = getDepartmentName(departmentNode);

  if (isAriege && departmentNode.id !== 'dep_09') {
    departmentNode.id = 'dep_09';
  }

  departmentNode.classList.add('department');
  if (isAriege) departmentNode.classList.add('is-ariege');

  departmentNode.setAttribute('tabindex', '0');
  departmentNode.setAttribute('role', 'button');
  departmentNode.setAttribute(
    'aria-label',
    `Département ${isAriege ? ARIEGE_CODE : code || '?'}${name ? ` — ${name}` : ''}`
  );
};


const positionAriegeTag = (svg) => {
  if (!ariegeTag) return;

  const ariegeNode = svg.querySelector('.department.is-ariege');
  if (!ariegeNode) return;

  try {
    const shapeBox = ariegeNode.getBBox();
    const svgBox = svg.getBBox();
    const x = ((shapeBox.x + shapeBox.width * 1.05 - svgBox.x) / svgBox.width) * 100;
    const y = ((shapeBox.y + shapeBox.height * 0.35 - svgBox.y) / svgBox.height) * 100;
    ariegeTag.style.left = `${x}%`;
    ariegeTag.style.top = `${y}%`;
    ariegeTag.classList.add('is-visible');
  } catch {
    ariegeTag.classList.remove('is-visible');
  }
};

const bindMapInteractions = (svg, departments) => {
  departments.forEach(enhanceDepartment);

  svg.addEventListener('click', (event) => {
    const departmentNode = event.target.closest('.department');
    if (!departmentNode) return;
    activateDepartment(departmentNode);
  });

  svg.addEventListener('keydown', (event) => {
    const departmentNode = event.target.closest('.department');
    if (!departmentNode) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateDepartment(departmentNode);
    }
  });
};

const injectMapSvg = async () => {
  try {
    const response = await fetch(MAP_SVG_PATH);
    if (!response.ok) throw new Error('Carte indisponible');

    mapRoot.innerHTML = await response.text();
    const svg = mapRoot.querySelector('svg');
    if (!svg) throw new Error('SVG invalide');

    const departments = [...svg.querySelectorAll('path[id^="dep_"], polygon[id^="dep_"]')];
    if (!departments.length) throw new Error('Départements introuvables');

    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Carte interactive des départements français');

    updateSvgViewBox(svg, departments);
    bindMapInteractions(svg, departments);
    positionAriegeTag(svg);
  } catch {
    mapRoot.textContent = 'Impossible de charger la carte pour le moment.';
  }
};

const moveMapToMobileSheet = () => {
  if (!isMobileViewport() || !mobileSheetContent) return;

  const mapStage = document.querySelector('.map-composition .map-stage');
  if (!mapStage) return;

  if (!mapOriginalParent) {
    mapOriginalParent = mapStage.parentElement;
    mapOriginalNextSibling = mapStage.nextElementSibling;
  }

  if (mobileSheetContent.contains(mapStage)) return;
  mobileSheetContent.appendChild(mapStage);
};

const restoreMapPosition = () => {
  if (isMobileViewport() || !mapOriginalParent) return;
  const mapStage = mobileSheetContent?.querySelector('.map-stage');
  if (!mapStage) return;

  if (mapOriginalNextSibling) {
    mapOriginalParent.insertBefore(mapStage, mapOriginalNextSibling);
  } else {
    mapOriginalParent.appendChild(mapStage);
  }
};

const openMobileSheet = () => {
  if (!isMobileViewport() || !mobileSheet || !mobileSheetOverlay) return;
  moveMapToMobileSheet();
  mobileSheet.hidden = false;
  mobileSheetOverlay.hidden = false;
  requestAnimationFrame(() => mobileSheet.classList.add('open'));
  document.body.classList.add('sheet-open');
  mobileSheetClose?.focus();
};

const closeMobileSheet = () => {
  if (!mobileSheet || !mobileSheetOverlay) return;
  mobileSheet.classList.remove('open');
  mobileSheetOverlay.hidden = true;
  document.body.classList.remove('sheet-open');
  window.setTimeout(() => {
    mobileSheet.hidden = true;
  }, 220);
};

const initMobileMapSheet = () => {
  if (!mobileSheet || !mobileSheetOverlay || !mobileSheetContent) return;

  mapOpenTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      if (!isMobileViewport()) return;
      event.preventDefault();
      openMobileSheet();
    });
  });

  mobileSheetClose?.addEventListener('click', closeMobileSheet);
  mobileSheetOverlay.addEventListener('click', closeMobileSheet);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileSheet.classList.contains('open')) {
      closeMobileSheet();
    }
  });

  window.addEventListener('resize', () => {
    if (!isMobileViewport()) {
      closeMobileSheet();
      restoreMapPosition();
    }
  });
};

const initStickyMobileCta = () => {
  if (!mobileStickyCta || !heroSection) return;

  if (!isMobileViewport()) {
    mobileStickyCta.classList.remove('is-visible');
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        mobileStickyCta.classList.toggle('is-visible', !entry.isIntersecting);
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -35% 0px',
    }
  );

  observer.observe(heroSection);

  window.addEventListener('resize', () => {
    if (!isMobileViewport()) {
      mobileStickyCta.classList.remove('is-visible');
    }
  });
};

const initReveal = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
};


const shuffleArray = (items) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const createOutingCardMarkup = (outing) => `
  <article class="info-card info-card-detail blog-card outing-card" data-outing-name="${outing.name}">
    <img class="article-image-slot" src="${outing.image}" alt="${outing.alt}" loading="lazy" decoding="async" />
    <h3><a href="${outing.href}">${outing.name}</a></h3>
    <p>${outing.description}</p>
  </article>
`;

const initHomeOutings = () => {
  const outingGrid = document.getElementById('outing-grid');
  if (!outingGrid) return;

  const previousSignature = window.localStorage.getItem(OUTING_STORAGE_KEY) || '';
  let attempts = 0;
  let selected = [];

  while (attempts < 8) {
    selected = shuffleArray(OUTING_POOL).slice(0, 3);
    const signature = selected.map((item) => item.href).sort().join('|');
    if (signature !== previousSignature || OUTING_POOL.length <= 3) break;
    attempts += 1;
  }

  outingGrid.innerHTML = selected.map(createOutingCardMarkup).join('');
  const newSignature = selected.map((item) => item.href).sort().join('|');
  window.localStorage.setItem(OUTING_STORAGE_KEY, newSignature);
};

const initRandomOutingPicker = () => {
  const randomButton = document.getElementById('random-pick-btn');
  const outingCards = [...document.querySelectorAll('.outing-card')];
  if (!randomButton || !outingCards.length) return;

  randomButton.addEventListener('click', () => {
    outingCards.forEach((card) => card.classList.remove('is-spotlight'));
    const randomCard = outingCards[Math.floor(Math.random() * outingCards.length)];
    randomCard.classList.add('is-spotlight');

    const outingName = randomCard.dataset.outingName || 'sortie famille';
    toast.textContent = `Suggestion surprise : ${outingName}`;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 2200);
  });
};

const initModalEvents = () => {
  modalCloseButton.addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal();
  });
};

document.getElementById('year').textContent = String(new Date().getFullYear());
initModalEvents();
initReveal();
injectMapSvg();
initMobileMapSheet();
initStickyMobileCta();
initHomeOutings();
initRandomOutingPicker();
