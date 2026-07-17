/* ==========================================================================
   GRAFYXORA 2026 — GAME SYSTEM DATA & UI CONTROLLER
   ========================================================================== */

export const ProjectData = {
  "brand-identity": {
    name: "Brand Identity House",
    headline: "PREMIUM VECTOR BRANDS & MONOGRAMS",
    description: "Designing memorable graphic footprints for concepts combining geometry, custom letterforms, and lighting balances.",
    items: [
      {
        title: "Sip Zone Cafe",
        tag: "Logo & Branding",
        desc: "High-end brand mark developed around stylized coffee mug profiles, utilizing warm gold gradients and glowing neon outlines.",
        image: "assets/sip_zone.jpg",
        tools: "Pixellab Pro, Canva",
        live: "#"
      },
      {
        title: "Zip Coz",
        tag: "Monogram Logo",
        desc: "Custom lettering visual monogram blending corporate structure elegance and sharp visual styling.",
        image: "https://ik.imagekit.io/6087szajn/portfolio/1779838269923.jpeg",
        tools: "Pixellab Pro",
        live: "#"
      },
      {
        title: "Kerala Family",
        tag: "Blend Identity",
        desc: "Integrating traditional regional shapes with sleek modern design guidelines to build family-centric brand guidelines.",
        image: "https://ik.imagekit.io/6087szajn/portfolio/1779841106455.jpeg",
        tools: "Adobe Illustrator",
        live: "#"
      },
      {
        title: "Criovibe Monomark",
        tag: "Modern Monogram",
        desc: "Abstract digital logo emphasizing high contrast curves and technical proportions for brand agencies.",
        image: "https://ik.imagekit.io/6087szajn/portfolio/1779840323389.jpeg",
        tools: "Adobe Illustrator, Photoshop",
        live: "#"
      }
    ]
  },
  "poster-gallery": {
    name: "Poster & Campaign Temple",
    headline: "VIBRANT DONGHUA-GRADE GRAPHIC POSTERS",
    description: "Architecting eye-catching layouts for events, admissions drives, and commercial YouTube campaigns that attract click-through traffic.",
    items: [
      {
        title: "Nexus Admissions Campaign",
        tag: "Admission Drive",
        desc: "High-impact educational admission campaign layouts designed to captivate technical and art candidate streams.",
        image: "assets/admission.jpg",
        tools: "Canva, Photoshop, Picsart",
        live: "#"
      },
      {
        title: "Events Poster Archives",
        tag: "Cultural Events",
        desc: "A massive collection of posters blending traditional themes, Arabic/Malayalam typography, and corporate alignment panels.",
        image: "https://ik.imagekit.io/6087szajn/portfolio/Events%20Poster/PixelLab_Dark_S_20260410_173452.jpg?updatedAt=1779972754992",
        tools: "Pixellab Pro, Canva",
        live: "#"
      },
      {
        title: "Festival Greetings",
        tag: "Greeting Posters",
        desc: "Vibrant designs capturing regional festival values using local cultural graphic palettes.",
        image: "https://ik.imagekit.io/6087szajn/portfolio/Festival%20posters/20251024_193609.jpg?updatedAt=1779973227415",
        tools: "Pixellab Pro, Picsart",
        live: "#"
      },
      {
        title: "YouTube Thumbnail Kit",
        tag: "Thumbnails",
        desc: "High-contrast YouTube video thumb assets mapped to raise conversion ratios on search results pages.",
        image: "https://ik.imagekit.io/6087szajn/portfolio/YouTube%20/Screenshot_2026-05-28-17-54-59-96_7352322957d4404136654ef4adb64504.jpg?updatedAt=1779973421133",
        tools: "Picsart, Canva",
        live: "#"
      }
    ]
  },
  "social-agency": {
    name: "Social Media Agency",
    headline: "HIGH-CONVERSION DIGITAL CAMPAIGNS",
    description: "Delivering sleek visual advertisements optimized for corporate audiences, product launches, and commercial feeds.",
    items: [
      {
        title: "Chronos Cyber Smartwatch",
        tag: "Product Promo",
        desc: "A luxury smartwatch advertisement combining floating product angles, chrome textures, and digital neon HUD details.",
        image: "assets/social_ad.jpg",
        tools: "Photoshop, Adobe Express",
        live: "#"
      },
      {
        title: "Sip Zone Social Ads",
        tag: "Beverage Ads",
        desc: "Promotional templates optimized for instagram posts, building a cohesive brand voice for local coffee houses.",
        image: "https://ik.imagekit.io/6087szajn/portfolio/Social%20media%20advertisements/Screenshot_2026-05-28-17-48-13-59_7352322957d4404136654ef4adb64504.jpg",
        tools: "Canva, Adobe Express",
        live: "#"
      }
    ]
  },
  "resume-center": {
    name: "Biographical Resume Pagoda",
    headline: "CREATIVE PROFILE DATA & SKILLS CHIPS",
    description: "Detailing Shamil's 3+ years experience, visual expertise, tools mastery, and credentials.",
    items: [
      {
        title: "Design Experience Profile",
        tag: "Resume Info",
        desc: "3+ Years of Graphic Design. Successfully launched over 60+ branding/poster layouts in English, Arabic, and Malayalam.",
        image: "assets/admission.jpg",
        tools: "Pixellab Pro, Picsart, Canva, Photoshop, Illustrator, Figma",
        live: "#"
      }
    ]
  },
  "contact-office": {
    name: "Communication Terminal",
    headline: "TRANSMIT CORE SECURE LINKAGES",
    description: "Launch direct freelance channels or submit a form linked to the Supabase log and Render server.",
    items: [
      {
        title: "Secure Messaging Node",
        tag: "Contact Forms",
        desc: "Provide your name, email, and message to connect immediately with Shamil VT. Email: shamilvt743@gmail.com",
        image: "assets/social_ad.jpg",
        tools: "API Form Submission Engine",
        live: "#"
      }
    ]
  }
};

export class UIController {
  constructor(soundEngine) {
    this.sfx = soundEngine;
    this.collectiblesCollected = 0;
    this.totalCollectibles = 6;
    this.unlockedAchievements = new Set();
    
    // UI elements references
    this.promptBox = document.getElementById('hud-prompt');
    this.dashboard = document.getElementById('hud-dashboard');
    this.modal = document.getElementById('hud-building-modal');
    this.terminal = document.getElementById('hud-terminal-console');
    
    this.setupModalClosing();
  }

  showPrompt(buildingName) {
    if (!this.promptBox) return;
    this.promptBox.innerHTML = `
      <div class="prompt-glow-border"></div>
      <div class="prompt-text">
        <span class="prompt-ping"></span>
        APPROACHING: <strong class="text-gradient">${buildingName.toUpperCase()}</strong>
      </div>
      <div class="prompt-key">PRESS <kbd>E</kbd> OR TAP HERE TO ENTER</div>
    `;
    this.promptBox.classList.add('visible');
  }

  hidePrompt() {
    if (this.promptBox) this.promptBox.classList.remove('visible');
  }

  showBuildingModal(buildingId) {
    const data = ProjectData[buildingId];
    if (!data) return;
    
    this.sfx.playSuccess();
    
    // Populate Modal Content
    const modalTitle = document.getElementById('modal-building-name');
    const modalHeadline = document.getElementById('modal-building-headline');
    const modalDesc = document.getElementById('modal-building-desc');
    const modalGrid = document.getElementById('modal-projects-grid');
    
    if (modalTitle) modalTitle.textContent = data.name.toUpperCase();
    if (modalHeadline) modalHeadline.textContent = data.headline;
    if (modalDesc) modalDesc.textContent = data.description;
    
    // Populate Grid
    if (modalGrid) {
      modalGrid.innerHTML = '';
      data.items.forEach(proj => {
        const item = document.createElement('div');
        item.className = 'modal-project-card glassmorphic-card';
        item.innerHTML = `
          <div class="card-media-box">
            <img src="${proj.image}" alt="${proj.title}" class="card-img-element">
            <div class="card-tag-element">${proj.tag}</div>
          </div>
          <div class="card-info-box">
            <h4>${proj.title}</h4>
            <p>${proj.desc}</p>
            <div class="card-chips">
              <span class="chip-label">PIPELINE:</span>
              <span class="chip-val">${proj.tools}</span>
            </div>
          </div>
        `;
        modalGrid.appendChild(item);
      });
      
      // If Contact building, append the contact form
      if (buildingId === 'contact-office') {
        const formWrap = document.createElement('div');
        formWrap.className = 'contact-form-wrapper glassmorphic-card';
        formWrap.innerHTML = `
          <h4>TRANSMIT ENCRYPTED MESSAGE</h4>
          <form id="game-contact-form" class="secure-form">
            <div class="form-row">
              <input type="text" id="game-form-name" required placeholder="Identity / Name" class="game-input">
            </div>
            <div class="form-row">
              <input type="email" id="game-form-email" required placeholder="Email Address" class="game-input">
            </div>
            <div class="form-row">
              <input type="text" id="game-form-phone" placeholder="WhatsApp / Phone (Optional)" class="game-input">
            </div>
            <div class="form-row">
              <textarea id="game-form-message" required placeholder="Project Brief / Message..." class="game-input game-textarea"></textarea>
            </div>
            <button type="submit" class="game-submit-btn">INITIATE PAYLOAD TRANSMISSION</button>
            <div id="game-form-status" class="form-status-box"></div>
          </form>
        `;
        modalGrid.appendChild(formWrap);
        this.setupContactForm();
      }
    }
    
    if (this.modal) this.modal.classList.add('visible');
  }

  hideBuildingModal(onCloseCallback) {
    if (this.modal) {
      this.modal.classList.remove('visible');
      this.sfx.playClick();
      if (onCloseCallback) onCloseCallback();
    }
  }

  setupModalClosing() {
    const closeBtn = document.getElementById('modal-hud-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideBuildingModal();
      });
    }
    
    // Close on escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && this.modal.classList.contains('visible')) {
        this.hideBuildingModal();
      }
    });
  }

  // --- Secure contact form linked to Render Backend ---
  setupContactForm() {
    const form = document.getElementById('game-contact-form');
    const status = document.getElementById('game-form-status');
    if (!form || !status) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.sfx.playClick();
      
      const name = document.getElementById('game-form-name').value;
      const email = document.getElementById('game-form-email').value;
      const phone = document.getElementById('game-form-phone').value;
      const message = document.getElementById('game-form-message').value;

      status.style.display = 'block';
      status.className = 'form-status-box info';
      status.textContent = "ESTABLISHING ENCRYPTED LINK TO RENDER HOST...";

      const formData = {
        name: name,
        email: email,
        contact: phone,
        message: message
      };

      try {
        const response = await fetch("https://grafyxora.onrender.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          status.className = 'form-status-box success';
          status.innerHTML = `TRANSMISSION SECURED!<br>Thank you, ${name.toUpperCase()}. Shamil has been notified.`;
          this.sfx.playSuccess();
          this.unlockAchievement('Messenger Node Activated');
          form.reset();
        } else {
          status.className = 'form-status-box error';
          status.textContent = "TRANSMISSION REFUSED. PLEASE RETRY.";
          this.sfx.playError();
        }
      } catch (err) {
        console.error("Form Post Error", err);
        status.className = 'form-status-box error';
        status.textContent = "NETWORK TIMEOUT. CONNECTION FAILED.";
        this.sfx.playError();
      }
    });
  }

  // --- Achievement & Collectible Trackers ---
  collectItem(itemName) {
    this.collectiblesCollected++;
    this.sfx.playSuccess();
    
    // Update dashboard counter
    const countEl = document.getElementById('stat-scrolls');
    if (countEl) countEl.textContent = `${this.collectiblesCollected}/${this.totalCollectibles}`;
    
    this.notifyGame(`COLLECTIBLE DISCOVERED: ${itemName}`);
    
    if (this.collectiblesCollected === this.totalCollectibles) {
      this.unlockAchievement('Islands Archeologist');
    }
  }

  unlockAchievement(title) {
    if (this.unlockedAchievements.has(title)) return;
    this.unlockedAchievements.add(title);
    
    // Pop up notification
    const pop = document.createElement('div');
    pop.className = 'achievement-toast glassmorphic-card';
    pop.innerHTML = `
      <div class="ach-icon"><i class="fa-solid fa-trophy"></i></div>
      <div class="ach-info">
        <span class="ach-lbl">ACHIEVEMENT UNLOCKED</span>
        <h5 class="ach-title">${title.toUpperCase()}</h5>
      </div>
    `;
    document.body.appendChild(pop);
    
    // Play achievement audio chord
    this.sfx.playSuccess();
    
    setTimeout(() => {
      pop.classList.add('visible');
    }, 100);
    
    setTimeout(() => {
      pop.classList.remove('visible');
      setTimeout(() => pop.remove(), 600);
    }, 4500);
  }

  notifyGame(message) {
    const notifyBox = document.getElementById('hud-notifications');
    if (!notifyBox) return;
    
    const note = document.createElement('div');
    note.className = 'hud-note';
    note.innerHTML = `<span class="note-arrow">►</span> ${message}`;
    notifyBox.appendChild(note);
    
    setTimeout(() => {
      note.classList.add('visible');
    }, 50);

    setTimeout(() => {
      note.classList.remove('visible');
      setTimeout(() => note.remove(), 400);
    }, 3500);
  }
}
