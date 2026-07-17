/* ==========================================================================
   GRAFYXORA 2026 — CENTRAL WebGL GAME ENGINE & CONTROLLER
   ========================================================================== */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

import { AudioSynth } from './components/AudioSynth.js';
import { UIController } from './components/UIController.js';
import { Particles } from './components/Particles.js';
import { Vehicle } from './components/Vehicle.js';
import { World, getTerrainHeight } from './components/World.js';

class GameEngine {
  constructor() {
    this.container = document.getElementById('game-container');
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();
    
    // Core Game Systems
    this.audio = new AudioSynth();
    this.ui = new UIController(this.audio);
    this.particles = null;
    this.world = null;
    this.vehicle = null;
    
    // Camera settings
    this.cameraMode = 'follow'; // 'follow', 'cinematic', 'drone'
    this.cameraTargetPos = new THREE.Vector3();
    this.cameraTargetLook = new THREE.Vector3();
    
    // Day/Night & Lighting
    this.sunLight = null;
    this.ambientLight = null;
    this.timeOfDay = 12.0; // 0 to 24 hours
    
    // States
    this.activeBuildingId = null;
    this.inCinematic = false;
    this.cinematicTime = 0;
    this.isRainy = false;
    
    this.initWebGL();
    this.setupLighting();
    this.initSubsystems();
    this.setupEventBindings();
    this.runSimulatedLoader();
  }

  // --- Initializing WebGL Renderer & Camera ---
  initWebGL() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x051410);
    this.scene.fog = new THREE.FogExp2(0x051410, 0.0035);
    
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    this.container.appendChild(this.renderer.domElement);
    
    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xdcffff, 0.45);
    this.scene.add(this.ambientLight);
    
    this.sunLight = new THREE.DirectionalLight(0xfff8e7, 1.25);
    this.sunLight.position.set(60, 100, 40);
    this.sunLight.castShadow = true;
    
    // Soft shadow parameters
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 300;
    
    const d = 160;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    
    this.scene.add(this.sunLight);
  }

  initSubsystems() {
    this.particles = new Particles(this.scene);
    this.world = new World(this.scene);
    this.vehicle = new Vehicle(this.scene, this.audio);
    
    // Bind touch controls on mobile HUD elements
    this.vehicle.bindMobileHUDControls();
    
    // Create base particles
    this.particles.createSakuraPetals(140);
    this.particles.createRain(750);
    this.particles.createFireflies(85);
  }

  // --- Dynamic Day / Night Cycle Calculations ---
  updateDayNightCycle(hour) {
    this.timeOfDay = hour;
    
    // Map hour to angles
    const angle = (hour / 24) * Math.PI * 2 - Math.PI / 2;
    const sy = Math.sin(angle);
    const sx = Math.cos(angle);
    
    this.sunLight.position.set(sx * 120, sy * 120, 20);
    
    // Interpolate light intensities & sky colors based on sun height
    if (sy > 0.1) {
      // Daytime
      const intensity = Math.min(1.3, sy * 1.5);
      this.sunLight.intensity = intensity;
      this.sunLight.color.setHex(0xfff8e7);
      this.ambientLight.intensity = 0.45;
      this.scene.fog.color.setHex(0x051410);
      this.scene.background.setHex(0x051410);
    } else if (sy < -0.1) {
      // Nighttime
      this.sunLight.intensity = 0.05;
      this.sunLight.color.setHex(0x9a88ff); // Dim moonlight
      this.ambientLight.intensity = 0.12;
      this.scene.fog.color.setHex(0x010504);
      this.scene.background.setHex(0x010504);
    } else {
      // Dawn / Golden hour sunset transitions
      const t = (sy + 0.1) / 0.2; // 0 to 1
      this.sunLight.intensity = THREE.MathUtils.lerp(0.05, 1.0, t);
      this.sunLight.color.setHex(0xff5533); // Golden vermilion hue
      this.ambientLight.intensity = THREE.MathUtils.lerp(0.12, 0.45, t);
      this.scene.fog.color.setHex(0x1a0a05);
      this.scene.background.setHex(0x1a0a05);
    }
  }

  // --- Bind Event Handlers ---
  setupEventBindings() {
    // Sound Toggle Click Handler
    const soundBtn = document.getElementById('hud-audio-toggle');
    const soundText = document.getElementById('hud-audio-text');
    
    soundBtn.addEventListener('click', () => {
      this.audio.init();
      const nextMute = !this.audio.isMuted;
      this.audio.setMute(nextMute);
      
      if (nextMute) {
        soundBtn.classList.remove('sound-on');
        soundText.textContent = "AUDIO: OFF";
        soundBtn.querySelector('.hud-icon').innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
      } else {
        soundBtn.classList.add('sound-on');
        soundText.textContent = "AUDIO: ON";
        soundBtn.querySelector('.hud-icon').innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        this.audio.playSuccess();
      }
    });

    // Time Slider Cycle Listener
    const slider = document.getElementById('hud-time-slider');
    const sliderVal = document.getElementById('hud-time-val');
    slider.addEventListener('input', (e) => {
      const hour = parseFloat(e.target.value);
      const min = Math.floor((hour % 1) * 60).toString().padStart(2, '0');
      const hourInt = Math.floor(hour).toString().padStart(2, '0');
      sliderVal.textContent = `${hourInt}:${min}`;
      this.updateDayNightCycle(hour);
    });

    // Weather Buttons Binds
    const bindWeather = (id, isRain, isStorm) => {
      const btn = document.getElementById(id);
      btn.addEventListener('click', () => {
        document.querySelectorAll('.weather-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.isRainy = isRain;
        this.particles.setRainState(isRain || isStorm);
        
        if (isStorm) {
          this.scene.fog.density = 0.0075;
          this.audio.playError();
        } else {
          this.scene.fog.density = 0.0035;
        }
        this.audio.playClick();
      });
    };
    bindWeather('weather-sunny', false, false);
    bindWeather('weather-rainy', true, false);
    bindWeather('weather-storm', false, true);

    // Keyboard bindings for Modal & camera toggle
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'e') {
        this.handleBuildingEntryInput();
      }
      if (e.key.toLowerCase() === 'v') {
        this.toggleCameraMode();
      }
      if (e.key.toLowerCase() === 't') {
        this.toggleDevConsole();
      }
    });

    // Proximity tap handler (Tap HUD prompt on mobile)
    const prompt = document.getElementById('hud-prompt');
    prompt.addEventListener('click', () => {
      this.handleBuildingEntryInput();
    });

    // Dev terminal submit binds
    const termInput = document.getElementById('hud-terminal-input');
    const termBuffer = document.getElementById('hud-terminal-buffer');
    const termClose = document.getElementById('hud-terminal-close');
    
    termInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = termInput.value.trim().toLowerCase();
        termInput.value = '';
        if (cmd === '') return;
        
        // Print command
        this.logConsole(`shell:~# ${cmd}`, 'user');
        this.audio.playClick();
        
        // Execute terminal inventory commands
        if (cmd === 'help') {
          this.logConsole("INVENTORY COMMANDS:");
          this.logConsole("  about     Print developer biographical profile.");
          this.logConsole("  skills    Print engine proficiencies.");
          this.logConsole("  teleport  Warp vehicle coordinates to center.");
          this.logConsole("  weather   Toggle atmospheric rain storm cycle.");
          this.logConsole("  clear     Clear console buffer logs.");
        } else if (cmd === 'clear') {
          termBuffer.innerHTML = '';
        } else if (cmd === 'about') {
          this.logConsole("Shamil VT — Graphic Designer with 3+ years experience.");
          this.logConsole("Specializing in branding monologue, vector calligraphy, and event campaigns.");
        } else if (cmd === 'skills') {
          this.logConsole("Pixellab (95%), Photoshop (92%), Illustrator (90%), Canva (90%), Picsart (88%).");
        } else if (cmd === 'teleport') {
          this.vehicle.position.set(0, 1.2, 50);
          this.vehicle.stop();
          this.logConsole("Warp sequence initialized. Vehicle repositioned.", "success");
        } else if (cmd === 'weather') {
          this.isRainy = !this.isRainy;
          this.particles.setRainState(this.isRainy);
          this.logConsole(`Weather modified: Rain set to ${this.isRainy}`, "success");
        } else {
          this.logConsole(`Command not found: '${cmd}'. Type 'help'.`, 'error');
          this.audio.playError();
        }
      }
    });

    termClose.addEventListener('click', () => this.toggleDevConsole());

    // Restart cinematic buttons
    const restartBtn = document.getElementById('cinematic-restart-btn');
    restartBtn.addEventListener('click', () => {
      const cinLayer = document.getElementById('game-cinematic-end');
      cinLayer.classList.remove('visible');
      this.inCinematic = false;
      this.cameraMode = 'follow';
      this.ui.collectiblesCollected = 0;
      document.getElementById('stat-scrolls').textContent = `0/6`;
      this.world.collectibles.forEach(col => {
        col.collected = false;
        col.mesh.visible = true;
      });
      this.vehicle.position.set(0, 1.2, 50);
      this.vehicle.stop();
    });
  }

  // --- Compile procedural loaders ---
  runSimulatedLoader() {
    const progressEl = document.getElementById('loader-progress');
    const statusEl = document.getElementById('loader-status');
    const startBtn = document.getElementById('start-game-btn');
    
    const steps = [
      "LOADING DONGHUA SHADERS...",
      "BUILDING PROCEDURAL HIGHLANDS...",
      "POSITIONING VERMILION TORII ARCHES...",
      "POPLUATING CHERRY BLOSSOM CANOPIES...",
      "ACTIVATING SOUND OSCILLATORS...",
      "GRID MAP ALIGNMENT STABLE."
    ];
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 9) + 3;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        progressEl.style.width = '100%';
        statusEl.textContent = steps[steps.length - 1];
        startBtn.classList.remove('disabled');
      } else {
        progressEl.style.width = `${progress}%`;
        const stepIdx = Math.floor((progress / 100) * steps.length);
        if (stepIdx < steps.length - 1) {
          statusEl.textContent = steps[stepIdx];
        }
      }
    }, 120);

    startBtn.addEventListener('click', () => {
      this.audio.init();
      this.audio.playSystemSweep();
      
      const loader = document.getElementById('game-loader');
      loader.classList.add('fade-out');
      document.body.classList.remove('game-loading');
      
      // Begin game loop animations
      this.clock.getDelta(); // reset clock
      this.animate();
      
      this.ui.notifyGame("WELCOME TO GRAFYXORA: CHOOSE WASD TO DRIVE.");
      
      // Trigger random temple bell ring at start
      setTimeout(() => this.audio.playTempleBell(), 2000);
    });
  }

  // --- Toggle Dev Terminal ---
  toggleDevConsole() {
    const consoleEl = document.getElementById('hud-terminal-console');
    consoleEl.classList.toggle('visible');
    if (consoleEl.classList.contains('visible')) {
      document.getElementById('hud-terminal-input').focus();
    }
  }

  logConsole(text, type = 'system') {
    const termBuffer = document.getElementById('hud-terminal-buffer');
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    line.textContent = text;
    termBuffer.appendChild(line);
    termBuffer.scrollTop = termBuffer.scrollHeight;
  }

  // --- Camera View Modes Toggles ---
  toggleCameraMode() {
    if (this.cameraMode === 'follow') {
      this.cameraMode = 'drone';
      this.ui.notifyGame("CAMERA MODE: DRONE FLYOVER VIEW");
    } else {
      this.cameraMode = 'follow';
      this.ui.notifyGame("CAMERA MODE: THIRD-PERSON DRIVE VIEW");
    }
    this.audio.playClick();
  }

  // --- Interaction Checks: Proximity Triggers ---
  updateInteractionPrompts() {
    if (this.cameraMode === 'cinematic') return;
    
    let nearBuilding = null;
    
    // Check building distances
    this.world.buildings.forEach(b => {
      const dist = this.vehicle.position.distanceTo(b.position);
      if (dist < b.radius) {
        nearBuilding = b;
      }
    });

    if (nearBuilding) {
      this.activeBuildingId = nearBuilding.id;
      this.ui.showPrompt(nearBuilding.name);
      
      // Auto-open doors details overlay on absolute proximity (closer approach)
      const dist = this.vehicle.position.distanceTo(nearBuilding.position);
      if (dist < 7.0 && !this.ui.modal.classList.contains('visible')) {
        this.enterBuildingExperience();
      }
    } else {
      this.activeBuildingId = null;
      this.ui.hidePrompt();
    }

    // Check scrolls collectibles distances
    this.world.collectibles.forEach(col => {
      if (!col.collected) {
        const dist = this.vehicle.position.distanceTo(col.position);
        if (dist < 4.0) {
          col.collected = true;
          col.mesh.visible = false;
          this.ui.collectItem(col.name);
          
          // Trigger final cinematic if 6/6 scrolls collected!
          if (this.ui.collectiblesCollected === 6) {
            this.triggerFinalCinematic();
          }
        }
      }
    });
  }

  handleBuildingEntryInput() {
    if (this.activeBuildingId) {
      this.enterBuildingExperience();
    }
  }

  // --- Enter Building Cinematic view ---
  enterBuildingExperience() {
    this.cameraMode = 'cinematic';
    this.vehicle.stop();
    this.ui.hidePrompt();
    
    // Calculate cinematic camera position directly facing pagoda entry
    const bPos = this.world.buildings.find(b => b.id === this.activeBuildingId).position;
    
    // Position camera inside the pagoda courtyard look down
    this.cameraTargetPos.set(bPos.x, bPos.y + 6.0, bPos.z - 11);
    this.cameraTargetLook.copy(bPos);
    
    this.ui.showBuildingModal(this.activeBuildingId);
    
    // Set callback on close
    this.ui.modal.querySelector('#modal-hud-close').onclick = () => {
      this.ui.hideBuildingModal(() => {
        this.cameraMode = 'follow';
      });
    };
  }

  // --- Trigger AAA Drone flight final cutscene ---
  triggerFinalCinematic() {
    this.inCinematic = true;
    this.cameraMode = 'drone';
    this.vehicle.stop();
    this.cinematicTime = 0;
    
    const endOverlay = document.getElementById('game-cinematic-end');
    endOverlay.classList.add('visible');
    
    this.ui.unlockAchievement('Voyager Master');
    this.ui.notifyGame("TRIGGERING FINAL CINEMATIC TRANSIT...");
    
    // Play bells chord BGM
    setTimeout(() => this.audio.playTempleBell(), 1000);
    setTimeout(() => this.audio.playTempleBell(), 2200);
  }

  // --- Follow Camera Lerps ---
  updateCamera(delta) {
    if (this.cameraMode === 'follow') {
      // Lerp behind vehicle position
      const offset = new THREE.Vector3(-this.vehicle.direction.x * 12.0, 4.8, -this.vehicle.direction.z * 12.0);
      const targetPos = this.vehicle.position.clone().add(offset);
      
      this.camera.position.lerp(targetPos, 0.08);
      
      // Look slightly ahead of car
      const lookAtPos = this.vehicle.position.clone().addScaledVector(this.vehicle.direction, 3);
      this.camera.lookAt(lookAtPos);
      
    } else if (this.cameraMode === 'cinematic') {
      // Cinematic camera placement lerp
      this.camera.position.lerp(this.cameraTargetPos, 0.05);
      
      // Look targets
      const currentLook = new THREE.Vector3(0,0,-1).applyQuaternion(this.camera.quaternion);
      currentLook.lerp(this.cameraTargetLook.clone().sub(this.camera.position).normalize(), 0.05);
      
      const targetLook = this.camera.position.clone().add(currentLook);
      this.camera.lookAt(targetLook);
      
    } else if (this.cameraMode === 'drone') {
      // Automatic orbit flyover
      const time = this.clock.getElapsedTime();
      const px = Math.cos(time * 0.08) * 110;
      const pz = Math.sin(time * 0.08) * 110;
      
      this.cameraTargetPos.set(px, 45.0, pz);
      this.cameraTargetLook.set(0, 5, 0); // Focus island center
      
      this.camera.position.lerp(this.cameraTargetPos, 0.05);
      
      // Smooth lookAt
      const lookTarget = new THREE.Vector3();
      lookTarget.lerpVectors(this.camera.position.clone().add(new THREE.Vector3(0,0,-1).applyQuaternion(this.camera.quaternion)), this.cameraTargetLook, 0.05);
      this.camera.lookAt(lookTarget);
    }
  }

  // --- Dynamic 2D Minimap Canvas Update ---
  updateMinimap() {
    const mCanvas = document.getElementById('minimap-canvas');
    if (!mCanvas) return;
    
    const mCtx = mCanvas.getContext('2d');
    mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
    
    // Draw Island boundary circle representation
    mCtx.beginPath();
    mCtx.arc(65, 65, 58, 0, Math.PI * 2);
    mCtx.strokeStyle = 'rgba(22, 199, 154, 0.2)';
    mCtx.lineWidth = 2;
    mCtx.stroke();
    
    // Map bounds coordinates: -220m to 220m
    const mapToCanvas = (val) => {
      return 65 + (val / 220) * 52;
    };

    // Draw building dots
    this.world.buildings.forEach(b => {
      const cx = mapToCanvas(b.position.x);
      const cz = mapToCanvas(b.position.z);
      mCtx.beginPath();
      mCtx.arc(cx, cz, 4, 0, Math.PI * 2);
      mCtx.fillStyle = '#00f0ff';
      mCtx.fill();
    });

    // Draw active collectible scrolls
    this.world.collectibles.forEach(col => {
      if (!col.collected) {
        const cx = mapToCanvas(col.position.x);
        const cz = mapToCanvas(col.position.z);
        mCtx.beginPath();
        mCtx.arc(cx, cz, 3, 0, Math.PI * 2);
        mCtx.fillStyle = '#39ff14'; // green
        mCtx.fill();
      }
    });

    // Draw player car location indicator
    const px = mapToCanvas(this.vehicle.position.x);
    const pz = mapToCanvas(this.vehicle.position.z);
    
    mCtx.beginPath();
    mCtx.arc(px, pz, 5, 0, Math.PI * 2);
    mCtx.fillStyle = '#ff007f'; // pink player pointer
    mCtx.fill();
    mCtx.strokeStyle = '#ffffff';
    mCtx.lineWidth = 1;
    mCtx.stroke();
    
    // Update dashboard area text based on player coordinates
    const areaText = document.getElementById('hud-area-name');
    if (areaText) {
      if (this.vehicle.position.x > 35 && this.vehicle.position.z < -35) {
        areaText.textContent = "OBSERVATION MOUNTAIN";
      } else if (this.vehicle.position.x < -35 && this.vehicle.position.z > 35) {
        areaText.textContent = "BAMBOO FOREST COVE";
      } else if (this.vehicle.position.distanceTo(new THREE.Vector3(0, 0, -40)) < 18) {
        areaText.textContent = "BRAND IDENTITY HOUSE";
      } else if (this.vehicle.position.distanceTo(new THREE.Vector3(-50, 0, 20)) < 18) {
        areaText.textContent = "CAMPAIGN TEMPLE";
      } else {
        areaText.textContent = "CENTRAL SEAMLESS BRIDGE";
      }
    }
  }

  // --- Window Resizes ---
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // --- Core WebGL Render Animate loop ---
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();
    
    // 1. Update vehicle physics (only if not in modals)
    if (this.cameraMode !== 'cinematic') {
      this.vehicle.update(getTerrainHeight);
    }
    
    // 2. Snaps interaction prompts & collections checking
    this.updateInteractionPrompts();
    
    // 3. Update Camera Lerps follow targets
    this.updateCamera(delta);
    
    // 4. Update Particle systems
    this.particles.update(time);
    
    // 5. Rotate collectibles meshes
    this.world.update(time);
    
    // 6. Update minimap
    this.updateMinimap();
    
    // 7. Render scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Start Game Engine on DOM load
window.addEventListener('load', () => {
  new GameEngine();
});
