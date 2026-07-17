/* ==========================================================================
   GRAFYXORA 2026 — AAA CAR SYSTEM PHYSICS & CONTROLLER
   ========================================================================== */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class Vehicle {
  constructor(scene, soundEngine) {
    this.scene = scene;
    this.sfx = soundEngine;
    this.mesh = null;
    this.wheels = [];
    
    // Physics parameters
    this.position = new THREE.Vector3(0, 1.2, 50); // Start on road
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3(0, 0, -1);
    this.yaw = -Math.PI / 2; // Facing down road
    
    this.speed = 0;
    this.maxSpeed = 1.3;
    this.acceleration = 0.022;
    this.deceleration = 0.015;
    this.friction = 0.982;
    
    this.steering = 0;
    this.maxSteering = 0.038;
    this.steeringSpeed = 0.003;
    this.steeringReturn = 0.0055;
    
    // Suspension bounce offsets
    this.roll = 0;
    this.pitch = 0;
    
    // States
    this.isDrifting = false;
    this.isNitro = false;
    
    // Input state
    this.inputs = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      nitro: false,
      brake: false
    };
    
    this.createCarMesh();
    this.setupControls();
  }

  // --- Construct Premium Stylized Low-Poly Sports Car ---
  createCarMesh() {
    const carGroup = new THREE.Group();
    
    // 1. Chassis / Lower Body (Deep Carbon Obsidian Material)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x111820,
      roughness: 0.2,
      metalness: 0.9,
      flatShading: true
    });
    
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x16c79a, // Accent cyan/teal
      roughness: 0.1,
      metalness: 0.8
    });
    
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x051410,
      roughness: 0.0,
      metalness: 1.0,
      transparent: true,
      opacity: 0.75
    });

    const chassisGeom = new THREE.BoxGeometry(2.3, 0.45, 4.8);
    const chassis = new THREE.Mesh(chassisGeom, bodyMat);
    chassis.position.y = 0.35;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    carGroup.add(chassis);
    
    // 2. Cabin / Greenhouse
    const cabinGeom = new THREE.BoxGeometry(1.9, 0.5, 2.3);
    const cabin = new THREE.Mesh(cabinGeom, glassMat);
    cabin.position.set(0, 0.75, -0.2);
    cabin.castShadow = true;
    carGroup.add(cabin);
    
    // 3. Hood Nose & Grille (Slanted Wedge)
    const noseGeom = new THREE.BoxGeometry(2.2, 0.3, 1.4);
    const nose = new THREE.Mesh(noseGeom, bodyMat);
    nose.position.set(0, 0.3, -1.8);
    nose.rotation.x = -0.1;
    nose.castShadow = true;
    carGroup.add(nose);
    
    // Spoiler Eaves
    const spoilerPostGeom = new THREE.BoxGeometry(0.15, 0.4, 0.15);
    const spoilerPostL = new THREE.Mesh(spoilerPostGeom, trimMat);
    spoilerPostL.position.set(-0.85, 0.6, 2.2);
    const spoilerPostR = spoilerPostL.clone();
    spoilerPostR.position.x = 0.85;
    carGroup.add(spoilerPostL);
    carGroup.add(spoilerPostR);
    
    const wingGeom = new THREE.BoxGeometry(2.5, 0.08, 0.6);
    const wing = new THREE.Mesh(wingGeom, trimMat);
    wing.position.set(0, 0.8, 2.25);
    wing.rotation.x = 0.05;
    wing.castShadow = true;
    carGroup.add(wing);

    // 4. Glowing Headlights (LED Neon Cyan)
    const lightGeom = new THREE.BoxGeometry(0.4, 0.15, 0.1);
    const lightL = new THREE.Mesh(lightGeom, new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    lightL.position.set(-0.85, 0.4, -2.4);
    
    const lightR = lightL.clone();
    lightR.position.x = 0.85;
    
    carGroup.add(lightL);
    carGroup.add(lightR);
    
    // Headlight Spotlights
    const targetL = new THREE.Object3D();
    targetL.position.set(-0.85, 0, -15);
    carGroup.add(targetL);
    
    const spotL = new THREE.SpotLight(0x00f0ff, 15, 40, Math.PI / 4, 0.5, 1);
    spotL.position.set(-0.85, 0.4, -2.5);
    spotL.target = targetL;
    carGroup.add(spotL);
    
    const targetR = targetL.clone();
    targetR.position.x = 0.85;
    carGroup.add(targetR);
    
    const spotR = new THREE.SpotLight(0x00f0ff, 15, 40, Math.PI / 4, 0.5, 1);
    spotR.position.set(0.85, 0.4, -2.5);
    spotR.target = targetR;
    carGroup.add(spotR);
    
    // 5. Tail/Brake Lights
    this.brakeLightMat = new THREE.MeshBasicMaterial({ color: 0xaa0000 });
    const tailL = new THREE.Mesh(lightGeom, this.brakeLightMat);
    tailL.position.set(-0.85, 0.45, 2.4);
    const tailR = tailL.clone();
    tailR.position.x = 0.85;
    
    carGroup.add(tailL);
    carGroup.add(tailR);

    // 6. Wheels (Steel/Carbon Cylinders)
    const wheelGeom = new THREE.CylinderGeometry(0.55, 0.55, 0.42, 12);
    wheelGeom.rotateZ(Math.PI / 2);
    
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8,
      flatShading: true
    });
    
    const wheelPositions = [
      { x: -1.2, y: 0.25, z: -1.5, name: 'FL' }, // Front Left
      { x: 1.2, y: 0.25, z: -1.5, name: 'FR' },  // Front Right
      { x: -1.2, y: 0.25, z: 1.6, name: 'RL' },  // Rear Left
      { x: 1.2, y: 0.25, z: 1.6, name: 'RR' }   // Rear Right
    ];
    
    wheelPositions.forEach((pos) => {
      const wMesh = new THREE.Mesh(wheelGeom, wheelMat);
      wMesh.position.set(pos.x, pos.y, pos.z);
      wMesh.castShadow = true;
      carGroup.add(wMesh);
      this.wheels.push({ mesh: wMesh, name: pos.name, startX: pos.x });
    });
    
    // 7. Nitro Jet Engine Thruster
    const exhaustGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.4, 8);
    exhaustGeom.rotateX(Math.PI / 2);
    const exhaust = new THREE.Mesh(exhaustGeom, new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.9 }));
    exhaust.position.set(0, 0.25, 2.4);
    carGroup.add(exhaust);
    
    // Booster Flame basic mesh
    this.flameMat = new THREE.MeshBasicMaterial({ color: 0xff3300, transparent: true, opacity: 0.0 });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 8), this.flameMat);
    flame.rotateX(-Math.PI / 2);
    flame.position.set(0, 0.25, 2.9);
    carGroup.add(flame);
    this.flameMesh = flame;

    // Apply scaling
    carGroup.scale.set(0.9, 0.9, 0.9);
    this.scene.add(carGroup);
    this.mesh = carGroup;
    this.mesh.position.copy(this.position);
  }

  // --- Keyboard Event Listeners ---
  setupControls() {
    window.addEventListener('keydown', (e) => {
      this.sfx.init(); // Initialize audio context on keyboard play
      
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          this.inputs.forward = true;
          break;
        case 's':
        case 'arrowdown':
          this.inputs.backward = true;
          break;
        case 'a':
        case 'arrowleft':
          this.inputs.left = true;
          break;
        case 'd':
        case 'arrowright':
          this.inputs.right = true;
          break;
        case 'shift':
          this.inputs.nitro = true;
          break;
        case 'space':
          this.inputs.brake = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          this.inputs.forward = false;
          break;
        case 's':
        case 'arrowdown':
          this.inputs.backward = false;
          break;
        case 'a':
        case 'arrowleft':
          this.inputs.left = false;
          break;
        case 'd':
        case 'arrowright':
          this.inputs.right = false;
          break;
        case 'shift':
          this.inputs.nitro = false;
          break;
        case 'space':
          this.inputs.brake = false;
          break;
      }
    });
  }

  // --- Mobile Controls Interface Binding ---
  bindMobileHUDControls() {
    const bindBtn = (id, key) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.sfx.init();
          this.inputs[key] = true;
        });
        btn.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.inputs[key] = false;
        });
      }
    };
    
    bindBtn('hud-mobile-gas', 'forward');
    bindBtn('hud-mobile-brake', 'backward');
    bindBtn('hud-mobile-nitro', 'nitro');
    bindBtn('hud-mobile-handbrake', 'brake');
    
    // Steer joystick mapping
    const joystick = document.getElementById('hud-mobile-joystick');
    if (joystick) {
      let touchId = null;
      let startX = 0;
      
      joystick.addEventListener('touchstart', (e) => {
        touchId = e.changedTouches[0].identifier;
        startX = e.changedTouches[0].clientX;
        this.sfx.init();
      });
      
      joystick.addEventListener('touchmove', (e) => {
        if (touchId === null) return;
        for (let t of e.touches) {
          if (t.identifier === touchId) {
            const dx = t.clientX - startX;
            // Map horizontal swipe delta to steering inputs
            const clampX = Math.max(-50, Math.min(50, dx)) / 50; // -1 to 1
            if (clampX < -0.15) {
              this.inputs.left = true;
              this.inputs.right = false;
            } else if (clampX > 0.15) {
              this.inputs.right = true;
              this.inputs.left = false;
            } else {
              this.inputs.left = false;
              this.inputs.right = false;
            }
          }
        }
      });
      
      joystick.addEventListener('touchend', () => {
        touchId = null;
        this.inputs.left = false;
        this.inputs.right = false;
      });
    }
  }

  // --- Main Physics Update Loop ---
  update(terrainHeightCallback) {
    if (!this.mesh) return;

    // 1. Acceleration / Throttle Logic
    const currentAccel = this.inputs.nitro ? this.acceleration * 1.8 : this.acceleration;
    const speedLimit = this.inputs.nitro ? this.maxSpeed * 1.45 : this.maxSpeed;
    this.isNitro = this.inputs.nitro && this.inputs.forward && this.speed > 0.2;

    if (this.inputs.forward) {
      this.speed += currentAccel;
      if (this.speed > speedLimit) this.speed = speedLimit;
    } else if (this.inputs.backward) {
      this.speed -= this.acceleration * 0.7;
      if (this.speed < -this.maxSpeed * 0.4) this.speed = -this.maxSpeed * 0.4;
    } else {
      // Natural rolling friction deceleration
      this.speed *= this.friction;
      if (Math.abs(this.speed) < 0.005) this.speed = 0;
    }

    // Handbrake Stop
    if (this.inputs.brake) {
      this.speed *= 0.88;
      this.brakeLightMat.color.setHex(0xff0000); // Glowing bright red brake lights
      this.isDrifting = Math.abs(this.speed) > 0.35 && (this.inputs.left || this.inputs.right);
    } else {
      this.brakeLightMat.color.setHex(0x550000); // Standard dim red tail lights
      this.isDrifting = false;
    }

    // 2. Steering & Yaw Turning Rotation
    if (this.inputs.left) {
      this.steering += this.steeringSpeed;
      if (this.steering > this.maxSteering) this.steering = this.maxSteering;
    } else if (this.inputs.right) {
      this.steering -= this.steeringSpeed;
      if (this.steering < -this.maxSteering) this.steering = -this.maxSteering;
    } else {
      // Auto-centering tires
      if (this.steering > 0) {
        this.steering -= this.steeringReturn;
        if (this.steering < 0) this.steering = 0;
      } else if (this.steering < 0) {
        this.steering += this.steeringReturn;
        if (this.steering > 0) this.steering = 0;
      }
    }

    // Apply heading angle yaw rotation based on speed and steering
    const turnFactor = this.speed >= 0 ? 1 : -1;
    this.yaw += this.steering * Math.min(1.0, Math.abs(this.speed) * 2.5) * turnFactor;

    // 3. Translate position vectors
    this.direction.set(Math.cos(this.yaw), 0, Math.sin(this.yaw)).normalize();
    
    // Speed-based drift sliding
    const driftAngle = this.isDrifting ? this.steering * 0.4 : 0;
    const velocityHeading = this.direction.clone().applyAxisAngle(new THREE.Vector3(0,1,0), driftAngle);
    
    this.position.addScaledVector(velocityHeading, this.speed);

    // Bound position within island boundaries to avoid driving off sky
    const terrainBound = 220;
    if (this.position.x > terrainBound) this.position.x = terrainBound;
    if (this.position.x < -terrainBound) this.position.x = -terrainBound;
    if (this.position.z > terrainBound) this.position.z = terrainBound;
    if (this.position.z < -terrainBound) this.position.z = -terrainBound;

    // Apply terrain snap height clamping
    const terrainH = terrainHeightCallback(this.position.x, this.position.z);
    this.position.y = THREE.MathUtils.lerp(this.position.y, terrainH + 0.3, 0.2);

    // Apply vehicle placement transformations
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = -this.yaw + Math.PI / 2; // Sync 3D orientation
    
    // Dynamic pitch/roll based on centrifugal force and deceleration (Suspension bounce)
    this.roll = THREE.MathUtils.lerp(this.roll, -this.steering * this.speed * 2.2, 0.1);
    this.pitch = THREE.MathUtils.lerp(this.pitch, (this.inputs.forward ? 0.05 : 0) - (this.inputs.backward ? 0.05 : 0), 0.1);
    
    this.mesh.rotation.z = this.roll;
    this.mesh.rotation.x = this.pitch;

    // 4. Wheels spinning animations & steering pitch angle
    this.wheels.forEach((w) => {
      // Spinning based on speed
      w.mesh.rotation.x += this.speed * 0.8;
      
      // Steering angle on front wheels
      if (w.name === 'FL' || w.name === 'FR') {
        w.mesh.rotation.y = this.steering * 1.5;
      }
    });

    // 5. Update sounds synthesis engine
    const normalizedSpeed = Math.min(1.0, Math.abs(this.speed) / this.maxSpeed);
    this.sfx.updateEngine(normalizedSpeed, this.isNitro);
    this.sfx.setTireScreech(this.isDrifting ? 0.8 : 0.0);

    // 6. Thruster flame visibility
    if (this.isNitro) {
      this.flameMat.opacity = 0.8 + Math.random() * 0.2;
      this.flameMesh.scale.set(1, 1 + Math.random() * 0.5, 1);
    } else {
      this.flameMat.opacity = 0.0;
    }

    // 7. Update HTML dashboard speedometers
    const speedKmh = Math.floor(Math.abs(this.speed) * 110);
    const speedEl = document.getElementById('stat-speed');
    if (speedEl) speedEl.textContent = `${speedKmh} KM/H`;
    
    const nitroBar = document.getElementById('stat-nitro-bar');
    if (nitroBar) {
      nitroBar.style.width = this.isNitro ? '40%' : '100%';
    }
  }

  // --- Force Stop (when entering building interactions) ---
  stop() {
    this.speed = 0;
    this.steering = 0;
    this.isDrifting = false;
    this.isNitro = false;
    this.inputs = { forward: false, backward: false, left: false, right: false, nitro: false, brake: false };
    if (this.flameMat) this.flameMat.opacity = 0.0;
    if (this.sfx) {
      this.sfx.updateEngine(0, false);
      this.sfx.setTireScreech(0);
    }
  }
}
