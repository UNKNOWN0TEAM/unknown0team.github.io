if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// Gestion du chargement dynamique des sections (sauf about et contact qui sont statiques)
const dynamicSections = ['members', 'achievements', 'ctfs', 'gallery', 'posts'];
let currentSection = '';

// Charger about et contact au démarrage
function loadStaticSections() {
  // Charger about
  fetch('sections/about.html')
    .then(response => response.text())
    .then(html => {
      document.getElementById('about-container').innerHTML = html;
    })
    .catch(error => console.error('Error loading about:', error));
  
  // Charger contact
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
  
  // Vérifier si c'est une section dynamique
  if (!dynamicSections.includes(sectionName)) {
    // Pour about et contact, on scroll vers la section correspondante
    scrollToSection(sectionName);
    return;
  }
  
  // Afficher le loader
  loader.style.display = 'block';
  container.style.opacity = '0';
  container.style.display = 'block';
  
  // Charger le fichier HTML correspondant
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
      
      // Mettre à jour l'URL sans recharger
      history.pushState({ section: sectionName }, '', `#${sectionName}`);
      
      // Scroll vers la section chargée
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

// Fonction de scroll smooth vers une section
function scrollToSection(sectionName) {
  let element = null;
  
  // Pour about et contact, ils ont leur propre conteneur
  if (sectionName === 'about') {
    element = document.getElementById('about-container');
  } else if (sectionName === 'contact') {
    element = document.getElementById('contact-container');
  } else {
    // Pour les sections dynamiques, chercher l'élément dans le container
    element = document.querySelector(`#${sectionName}`);
  }
  
  if (element) {
    const navHeight = 72; // Hauteur de la navbar + police band
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - navHeight;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}

// Navigation
document.querySelectorAll('[data-section]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = link.getAttribute('data-section');
    if (section) {
      loadSection(section);
    }
  });
});

// Gestion du hash initial et du bouton retour/avant
function handleHashChange() {
  const hash = window.location.hash.slice(1);
  if (hash && dynamicSections.includes(hash)) {
    loadSection(hash);
  } else if (hash === 'about' || hash === 'contact') {
    scrollToSection(hash);
  } else if (!hash) {
    // Par défaut, scroll vers about
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

// Chargement initial
loadStaticSections();
handleHashChange();

// Mettre en surbrillance le lien actif dans la navigation
function updateActiveNavLink() {
  const scrollPosition = window.scrollY + 100;
  
  // Vérifier les sections statiques
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
    // Vérifier les sections dynamiques
    dynamicSections.forEach(section => {
      const element = document.querySelector(`#${section}`);
      if (element && scrollPosition >= element.offsetTop - 100) {
        activeSection = section;
      }
    });
  }
  
  // Mettre à jour les couleurs des liens
  document.querySelectorAll('[data-section]').forEach(link => {
    const section = link.getAttribute('data-section');
    if (section === activeSection) {
      link.style.color = 'var(--red2)';
    } else {
      link.style.color = '';
    }
  });
}

// Écouter le scroll pour mettre à jour le lien actif
window.addEventListener('scroll', updateActiveNavLink);
updateActiveNavLink();

// Lightbox pour la galerie (agrandir les photos au clic)
function initGalleryLightbox() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  
  // Créer le modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <span class="modal-close">&times;</span>
    <img class="modal-img" src="" alt="">
  `;
  document.body.appendChild(modal);
  
  const modalImg = modal.querySelector('.modal-img');
  const closeBtn = modal.querySelector('.modal-close');
  
  // Ouvrir le modal au clic sur une image
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
  
  // Fermer le modal
  const closeModal = () => {
    modal.classList.remove('active');
    modalImg.src = '';
  };
  
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  // Fermer avec Echap
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

// Appeler la fonction après le chargement de la galerie
// À mettre dans le callback de chargement des sections
if (document.getElementById('gallery')) {
  initGalleryLightbox();
}

// ─── BOUTON SONORE AVEC FICHIERS ALERT-1 ET ALERT-2 (COMPATIBLE MOBILE) ───
function initHeroSoundButton() {
  const soundBtn = document.getElementById('soundBtn');
  if (!soundBtn) return;
  
  let sound1 = null;
  let sound2 = null;
  let audioInitialized = false;
  
  // Fonction pour précharger les sons
  const initAudio = () => {
    if (audioInitialized) return;
    
    sound1 = new Audio('./assets/sounds/alert-1.mp3');
    sound2 = new Audio('./assets/sounds/alert-2.mp3');
    
    sound1.volume = 0.85;
    sound2.volume = 0.15;
    sound1.preload = 'auto';
    sound2.preload = 'auto';
    
    audioInitialized = true;
  };
  
  const playBothSounds = () => {
    // Initialiser au premier clic
    if (!audioInitialized) {
      initAudio();
    }
    
    // Ajouter l'animation
    soundBtn.classList.add('playing');
    
    // Changer l'icône
    const icon = soundBtn.querySelector('.sound-icon');
    const text = soundBtn.querySelector('.sound-text');
    const originalIcon = icon.textContent;
    const originalText = text.textContent;
    
    icon.textContent = '⚡';
    text.textContent = 'PLAYING';
    
    // Jouer les sons
    sound1.currentTime = 0;
    sound1.play().catch(e => console.log('Son1 erreur:', e));
    
    setTimeout(() => {
      sound2.currentTime = 0;
      sound2.play().catch(e => console.log('Son2 erreur:', e));
    }, 150);
    
    setTimeout(() => {
      soundBtn.classList.remove('playing');
      icon.textContent = originalIcon;
      text.textContent = originalText;
    }, 400);
  };
  
  soundBtn.addEventListener('click', playBothSounds);
}

document.addEventListener('DOMContentLoaded', initHeroSoundButton);

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', initHeroSoundButton);
