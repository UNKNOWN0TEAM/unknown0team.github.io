if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

const dynamicSections = ['members', 'achievements', 'ctfs', 'gallery', 'posts'];
let currentSection = '';

function loadStaticSections() {
  fetch('sections/about.html')
    .then(response => response.text())
    .then(html => {
      document.getElementById('about-container').innerHTML = html;
    })
    .catch(error => console.error('Error loading about:', error));
  
  fetch('sections/contact.html')
    .then(response => response.text())
    .then(html => {
      document.getElementById('contact-container').innerHTML = html;
    })
    .catch(error => console.error('Error loading contact:', error));
}

function loadSection(sectionName) {
  const container = document.getElementById('section-container');
  const loader = document.getElementById('loader');
  
  if (!container) return;
  
  if (!dynamicSections.includes(sectionName)) {
    scrollToSection(sectionName);
    return;
  }
  
  loader.style.display = 'block';
  container.style.opacity = '0';
  container.style.display = 'block';
  
  fetch(`sections/${sectionName}.html`)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })
    .then(html => {
      container.innerHTML = html;
      loader.style.display = 'none';
      container.style.opacity = '1';
      currentSection = sectionName;
      
      history.pushState({ section: sectionName }, '', `#${sectionName}`);
      
      setTimeout(() => {
        scrollToSection(sectionName);
      }, 100);
    })
    .catch(error => {
      console.error('Error loading section:', error);
      container.innerHTML = `<div class="content" style="text-align:center;padding:100px;"><p style="color:var(--red2)">⚠️ Error loading content. Please try again.</p></div>`;
      loader.style.display = 'none';
      container.style.opacity = '1';
    });
}

function scrollToSection(sectionName) {
  let element = null;
  
  if (sectionName === 'about') {
    element = document.getElementById('about-container');
  } else if (sectionName === 'contact') {
    element = document.getElementById('contact-container');
  } else {
    element = document.querySelector(`#${sectionName}`);
  }
  
  if (element) {
    const navHeight = 72;
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - navHeight;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}

document.querySelectorAll('[data-section]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = link.getAttribute('data-section');
    if (section) {
      loadSection(section);
    }
  });
});

function handleHashChange() {
  const hash = window.location.hash.slice(1);
  if (hash && dynamicSections.includes(hash)) {
    loadSection(hash);
  } else if (hash === 'about' || hash === 'contact') {
    scrollToSection(hash);
  } else if (!hash) {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

window.addEventListener('popstate', (e) => {
  const section = e.state?.section;
  if (section && dynamicSections.includes(section)) {
    loadSection(section);
  } else {
    handleHashChange();
  }
});

loadStaticSections();
handleHashChange();

function updateActiveNavLink() {
  const scrollPosition = window.scrollY + 100;
  
  const aboutContainer = document.getElementById('about-container');
  const contactContainer = document.getElementById('contact-container');
  const heroSection = document.getElementById('hero');
  
  let activeSection = '';
  
  if (heroSection && scrollPosition < heroSection.offsetHeight) {
    activeSection = 'hero';
  } else if (aboutContainer && scrollPosition >= aboutContainer.offsetTop - 100) {
    activeSection = 'about';
  } else if (contactContainer && scrollPosition >= contactContainer.offsetTop - 100) {
    activeSection = 'contact';
  } else {
    dynamicSections.forEach(section => {
      const element = document.querySelector(`#${section}`);
      if (element && scrollPosition >= element.offsetTop - 100) {
        activeSection = section;
      }
    });
  }
  
  document.querySelectorAll('[data-section]').forEach(link => {
    const section = link.getAttribute('data-section');
    if (section === activeSection) {
      link.style.color = 'var(--red2)';
    } else {
      link.style.color = '';
    }
  });
}

window.addEventListener('scroll', updateActiveNavLink);
updateActiveNavLink();

function initGalleryLightbox() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <span class="modal-close">&times;</span>
    <img class="modal-img" src="" alt="">
  `;
  document.body.appendChild(modal);
  
  const modalImg = modal.querySelector('.modal-img');
  const closeBtn = modal.querySelector('.modal-close');
  
  galleryItems.forEach(item => {
    const img = item.querySelector('.gallery-img');
    if (img) {
      item.addEventListener('click', () => {
        modalImg.src = img.src;
        modalImg.alt = img.alt;
        modal.classList.add('active');
      });
    }
  });
  
  const closeModal = () => {
    modal.classList.remove('active');
    modalImg.src = '';
  };
  
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

if (document.getElementById('gallery')) {
  initGalleryLightbox();
}

// ─── BOUTON SONORE — COMPATIBLE PC + MOBILE SANS BEEP ───
function initHeroSoundButton() {
  const soundBtn = document.getElementById('soundBtn');
  if (!soundBtn) return;

  let audioCtx = null;
  let buffer1 = null;
  let buffer2 = null;
  let loaded = false;

  // Crée l'AudioContext au premier geste utilisateur
  const getAudioContext = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume si suspendu (politique mobile)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  };

  // Charge un fichier audio en ArrayBuffer puis le décode
  const loadBuffer = async (ctx, url) => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer);
  };

  // Précharge les deux sons dès le premier clic
  const ensureLoaded = async () => {
    if (loaded) return;
    const ctx = getAudioContext();
    try {
      [buffer1, buffer2] = await Promise.all([
        loadBuffer(ctx, './assets/sounds/alert-1.mp3'),
        loadBuffer(ctx, './assets/sounds/alert-2.mp3')
      ]);
      loaded = true;
    } catch (e) {
      console.error('Erreur chargement audio:', e);
    }
  };

  // Joue un buffer avec volume et délai optionnel
  const playBuffer = (buffer, volume = 1.0, delayMs = 0) => {
    if (!buffer || !audioCtx) return;
    setTimeout(() => {
      const source = audioCtx.createBufferSource();
      const gainNode = audioCtx.createGain();
      source.buffer = buffer;
      gainNode.gain.value = volume;
      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      source.start(0);
    }, delayMs);
  };

  soundBtn.addEventListener('click', async () => {
    await ensureLoaded();
    if (!loaded) return;

    // Animation du bouton
    soundBtn.classList.add('playing');
    const icon = soundBtn.querySelector('.sound-icon');
    const text = soundBtn.querySelector('.sound-text');
    const originalIcon = icon?.textContent;
    const originalText = text?.textContent;
    if (icon) icon.textContent = '⚡';
    if (text) text.textContent = 'PLAYING';

    // Jouer alert-1 immédiatement, alert-2 après 150ms
    playBuffer(buffer1, 0.85, 0);
    playBuffer(buffer2, 0.15, 150);

    setTimeout(() => {
      soundBtn.classList.remove('playing');
      if (icon) icon.textContent = originalIcon;
      if (text) text.textContent = originalText;
    }, 400);
  });
}
// ─── HAMBURGER MENU ───
const hamburger = document.getElementById('navHamburger');
const navLinks = document.querySelector('.nav-links');

hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});

// Fermer le menu quand on clique sur un lien
document.querySelectorAll('[data-section]').forEach(link => {
  link.addEventListener('click', () => {
    hamburger?.classList.remove('open');
    navLinks?.classList.remove('open');
  });
});

document.addEventListener('DOMContentLoaded', initHeroSoundButton);
