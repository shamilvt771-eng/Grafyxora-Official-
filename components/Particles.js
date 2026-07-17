/* ==========================================================================
   GRAFYXORA 2026 — GAME PARTICLE SYSTEM ENGINE
   ========================================================================== */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class Particles {
  constructor(scene) {
    this.scene = scene;
    this.systems = {};
  }

  // --- Falling Sakura Petals ---
  createSakuraPetals(count = 150) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];
    const rotations = [];
    
    for (let i = 0; i < count; i++) {
      // Spawn within a bounding box around the island core
      positions[i * 3] = (Math.random() - 0.5) * 350;     // X
      positions[i * 3 + 1] = Math.random() * 80 + 10;     // Y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 350; // Z
      
      velocities.push({
        x: (Math.random() - 0.5) * 0.4 - 0.2, // Drift sideways
        y: -(Math.random() * 0.15 + 0.08),     // Falling speed
        z: (Math.random() - 0.5) * 0.3
      });
      
      rotations.push({
        x: Math.random() * Math.PI,
        y: Math.random() * Math.PI,
        speedX: Math.random() * 0.02 - 0.01,
        speedY: Math.random() * 0.03 - 0.015
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Sakura petal material - Custom pink particles
    const material = new THREE.PointsMaterial({
      color: 0xffb7c5, // Soft pink cherry blossom color
      size: 0.95,
      transparent: true,
      opacity: 0.85,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    
    this.systems['sakura'] = {
      points: points,
      velocities: velocities,
      rotations: rotations,
      positions: positions,
      count: count
    };
  }

  // --- Rain Weather System ---
  createRain(count = 800) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 450;
      positions[i * 3 + 1] = Math.random() * 150 + 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 450;
      
      velocities.push({
        x: -0.15, // wind slant
        y: -(Math.random() * 1.5 + 1.2), // high velocity
        z: (Math.random() - 0.5) * 0.1
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0x4fc3f7, // light electric blue
      size: 0.45,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    points.visible = false; // Starts hidden, activated on rainy weather
    this.scene.add(points);

    this.systems['rain'] = {
      points: points,
      velocities: velocities,
      positions: positions,
      count: count
    };
  }

  // --- Glowing Forest Fireflies ---
  createFireflies(count = 80) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const timeOffsets = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Group them around specific bamboo / forest segments
      positions[i * 3] = (Math.random() - 0.5) * 200 + 40;
      positions[i * 3 + 1] = Math.random() * 8 + 1.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200 - 40;
      
      timeOffsets[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0x39ff14, // neon yellow-green
      size: 0.8,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    this.systems['fireflies'] = {
      points: points,
      positions: positions,
      timeOffsets: timeOffsets,
      count: count
    };
  }

  // --- Update Loop ---
  update(time) {
    // 1. Update Sakura Petals
    const sakura = this.systems['sakura'];
    if (sakura) {
      const pos = sakura.points.geometry.attributes.position.array;
      for (let i = 0; i < sakura.count; i++) {
        // Apply wind velocity
        pos[i * 3] += sakura.velocities[i].x + Math.sin(time + i) * 0.05;
        pos[i * 3 + 1] += sakura.velocities[i].y;
        pos[i * 3 + 2] += sakura.velocities[i].z;
        
        // Reset if hitting ground
        if (pos[i * 3 + 1] < 0.2) {
          pos[i * 3] = (Math.random() - 0.5) * 350;
          pos[i * 3 + 1] = Math.random() * 80 + 20;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 350;
        }
      }
      sakura.points.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Update Rain
    const rain = this.systems['rain'];
    if (rain && rain.points.visible) {
      const pos = rain.points.geometry.attributes.position.array;
      for (let i = 0; i < rain.count; i++) {
        pos[i * 3] += rain.velocities[i].x;
        pos[i * 3 + 1] += rain.velocities[i].y;
        pos[i * 3 + 2] += rain.velocities[i].z;
        
        if (pos[i * 3 + 1] < 0.1) {
          pos[i * 3] = (Math.random() - 0.5) * 450;
          pos[i * 3 + 1] = Math.random() * 150 + 50;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 450;
        }
      }
      rain.points.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Update Fireflies
    const fireflies = this.systems['fireflies'];
    if (fireflies) {
      const pos = fireflies.points.geometry.attributes.position.array;
      for (let i = 0; i < fireflies.count; i++) {
        const offset = fireflies.timeOffsets[i];
        // Swarming wavy hover movement
        pos[i * 3] += Math.sin(time * 0.5 + offset) * 0.02;
        pos[i * 3 + 1] += Math.cos(time * 0.8 + offset) * 0.01;
        pos[i * 3 + 2] += Math.cos(time * 0.5 + offset) * 0.02;
        
        // Pulse firefly opacity dynamically
        fireflies.points.material.opacity = 0.4 + Math.sin(time * 2.0 + offset) * 0.5;
      }
      fireflies.points.geometry.attributes.position.needsUpdate = true;
    }
  }

  setRainState(visible) {
    if (this.systems['rain']) {
      this.systems['rain'].points.visible = visible;
    }
  }
}
