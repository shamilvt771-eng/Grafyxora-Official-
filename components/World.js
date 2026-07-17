/* ==========================================================================
   GRAFYXORA 2026 — GAME WORLD GENERATOR (Procedural Terrain & Buildings)
   ========================================================================== */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// --- Global Shared Terrain Height Calculation Function ---
export function getTerrainHeight(x, z) {
  const distFromCenter = Math.sqrt(x*x + z*z);
  
  // 1. Ocean Boundary slope
  if (distFromCenter > 195) {
    return -6.0;
  }
  
  // 2. Winding River Bed: cuts through the landscape
  // River runs along z = sin(x*0.06)*22
  const riverDelta = Math.abs(z - Math.sin(x * 0.05) * 25);
  if (riverDelta < 6.5) {
    // If on a bridge coordinate, don't drop the height!
    // Bridge 1: Center road crossing (around x = 0)
    // Bridge 2: East road crossing (around x = 80)
    if (Math.abs(x) < 7 || Math.abs(x - 85) < 7) {
      return 0.5; // Bridge roadway height
    }
    return -2.2; // River bed depth
  }

  // 3. Flat Circular Roadway track (r = 85 to 125)
  if (distFromCenter >= 78 && distFromCenter <= 122) {
    return 0.5; // Flat surface for racing physics
  }
  
  // 4. Central Valley / Village plains
  let height = 0.5;
  
  // 5. Eastern Observation Pagoda Mountain Peak
  if (x > 35 && z < -35) {
    const peakDist = Math.sqrt((x - 65)*(x - 65) + (z + 65)*(z + 65));
    if (peakDist < 60) {
      height += (60 - peakDist) * 0.42; // Peak height goes up to ~25m
    }
  }

  // 6. Central hills procedural noise
  height += Math.sin(x * 0.04) * Math.cos(z * 0.04) * 3.8;
  
  return Math.max(0.2, height);
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.buildings = [];
    this.collectibles = [];
    
    // Core PBR materials
    this.woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.85 }); // brown
    this.roofMat = new THREE.MeshStandardMaterial({ color: 0xd95d39, roughness: 0.5, metalness: 0.1 }); // orange eave tiles
    this.wallMat = new THREE.MeshStandardMaterial({ color: 0xfbfbfb, roughness: 0.9 }); // white walls
    this.neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    this.neonPinkMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
    
    this.createTerrain();
    this.createWater();
    this.createBridges();
    this.createVegetation();
    this.createObservationPagoda();
    this.createPortfolioBuildings();
    this.createCollectibles();
  }

  // --- Create Procedural Low-Poly Island Terrain ---
  createTerrain() {
    const size = 440;
    const segments = 120;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);
    
    const pos = geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      const vx = pos[i];
      const vz = pos[i + 2];
      pos[i + 1] = getTerrainHeight(vx, vz);
    }
    
    geometry.computeVertexNormals();
    
    // Stylized Forest Green Land Material
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x092e25,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true
    });
    
    const land = new THREE.Mesh(geometry, terrainMat);
    land.receiveShadow = true;
    land.castShadow = true;
    this.scene.add(land);
  }

  // --- Physically Rendered Blue Ocean Base ---
  createWater() {
    const waterGeom = new THREE.PlaneGeometry(800, 800);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x051d20,
      roughness: 0.15,
      metalness: 0.8,
      transparent: true,
      opacity: 0.82
    });
    const water = new THREE.Mesh(waterGeom, waterMat);
    water.rotateX(-Math.PI / 2);
    water.position.y = -0.5; // Just below coastlines
    this.scene.add(water);
  }

  // --- Wooden Bridges crossing the riverbed ---
  createBridges() {
    const bridgePositions = [
      { x: 0, y: 0.5, z: 0, rotY: 0 },
      { x: 85, y: 0.5, z: -25, rotY: 0.4 }
    ];
    
    bridgePositions.forEach(b => {
      const bridgeGroup = new THREE.Group();
      
      // Main Deck
      const deck = new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, 14), this.woodMat);
      deck.castShadow = true;
      deck.receiveShadow = true;
      bridgeGroup.add(deck);
      
      // Railings
      const railGeom = new THREE.BoxGeometry(0.2, 0.8, 14);
      const railL = new THREE.Mesh(railGeom, this.woodMat);
      railL.position.set(-3.4, 0.4, 0);
      const railR = railL.clone();
      railR.position.x = 3.4;
      
      bridgeGroup.add(railL);
      bridgeGroup.add(railR);
      
      // Red support Torii arches at bridge entry points
      const torii = this.createToriiGate();
      torii.position.set(0, 0, -6.5);
      torii.scale.set(0.7, 0.7, 0.7);
      bridgeGroup.add(torii);
      
      const torii2 = torii.clone();
      torii2.position.z = 6.5;
      torii2.rotation.y = Math.PI;
      bridgeGroup.add(torii2);
      
      bridgeGroup.position.set(b.x, b.y, b.z);
      bridgeGroup.rotation.y = b.rotY;
      this.scene.add(bridgeGroup);
    });
  }

  // --- Helper to build Torii Arch Gate ---
  createToriiGate() {
    const torii = new THREE.Group();
    const toriiMat = new THREE.MeshStandardMaterial({ color: 0xd95d39, roughness: 0.4 }); // red orange eave e.g. vermilion
    
    // Pillars
    const pillarGeom = new THREE.CylinderGeometry(0.2, 0.25, 4.5, 6);
    const pilL = new THREE.Mesh(pillarGeom, toriiMat);
    pilL.position.set(-2, 2.25, 0);
    const pilR = pilL.clone();
    pilR.position.x = 2;
    torii.add(pilL, pilR);
    
    // Roof Beam lintels
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.35, 0.4), toriiMat);
    lintel.position.set(0, 4.3, 0);
    torii.add(lintel);
    
    const topLintel = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.2, 0.5), this.roofMat);
    topLintel.position.set(0, 4.6, 0);
    torii.add(topLintel);
    
    return torii;
  }

  // --- Bamboo Forests & Sakura Trees ---
  createVegetation() {
    // 1. Bamboo Forest (North-West)
    const bambooCount = 130;
    const bambooGreen = new THREE.MeshStandardMaterial({ color: 0x3a5f0b, roughness: 0.9, flatShading: true });
    
    for (let i = 0; i < bambooCount; i++) {
      const bx = (Math.random() - 0.5) * 80 - 65;
      const bz = (Math.random() - 0.5) * 80 + 65;
      const by = getTerrainHeight(bx, bz);
      
      if (by > 0) {
        const height = Math.random() * 5 + 3.5;
        const bamboo = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, height, 5), bambooGreen);
        bamboo.position.set(bx, by + height/2, bz);
        bamboo.castShadow = true;
        this.scene.add(bamboo);
      }
    }

    // 2. Cherry Blossom Sakura Trees (Scattered around village)
    const sakuraCount = 45;
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.9 });
    const leafPinkMat = new THREE.MeshStandardMaterial({ color: 0xffb7c5, roughness: 0.65, flatShading: true });
    
    for (let i = 0; i < sakuraCount; i++) {
      // Scattered along roadsides
      const theta = Math.random() * Math.PI * 2;
      const radius = 60 + Math.random() * 20; // Near circles road
      const sx = Math.cos(theta) * radius;
      const sz = Math.sin(theta) * radius;
      const sy = getTerrainHeight(sx, sz);
      
      if (sy > 0) {
        const treeGroup = new THREE.Group();
        
        // Trunk
        const trunkHeight = Math.random() * 2.5 + 2.0;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, trunkHeight, 5), trunkMat);
        trunk.position.y = trunkHeight/2;
        trunk.castShadow = true;
        treeGroup.add(trunk);
        
        // Leaf Cluster spheres
        const foliageGeom = new THREE.DodecahedronGeometry(1.6, 1);
        const foliage = new THREE.Mesh(foliageGeom, leafPinkMat);
        foliage.position.y = trunkHeight + 0.6;
        foliage.castShadow = true;
        treeGroup.add(foliage);
        
        const fol2 = foliage.clone();
        fol2.scale.set(0.7, 0.7, 0.7);
        fol2.position.set(0.8, trunkHeight + 0.3, 0.4);
        treeGroup.add(fol2);
        
        treeGroup.position.set(sx, sy, sz);
        this.scene.add(treeGroup);
      }
    }
  }

  // --- Large Observation Pagoda on high mountain (East Peak) ---
  createObservationPagoda() {
    const pagodaGroup = new THREE.Group();
    
    const wallP = new THREE.Mesh(new THREE.BoxGeometry(6, 4.5, 6), this.wallMat);
    wallP.position.y = 2.25;
    wallP.castShadow = true;
    pagodaGroup.add(wallP);
    
    // Multitier roofs
    for (let tier = 0; tier < 3; tier++) {
      const scale = 1.0 - (tier * 0.2);
      const heightOffset = 4.3 + (tier * 3.2);
      
      const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2 * scale, 1.8, 4), this.roofMat);
      roof.position.y = heightOffset;
      roof.rotation.y = Math.PI / 4; // square pagoda layout eave
      roof.castShadow = true;
      pagodaGroup.add(roof);
      
      // Upper tier structural core pillars
      if (tier < 2) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(4.2 * scale, 3.2, 4.2 * scale), this.wallMat);
        pillar.position.y = heightOffset + 1.6;
        pagodaGroup.add(pillar);
      }
    }
    
    // Spire peak
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.15, 2.5, 5), this.woodMat);
    spire.position.y = 11.8;
    pagodaGroup.add(spire);
    
    // Pagoda coordinates: Mountain peak
    const px = 65;
    const pz = -65;
    const py = getTerrainHeight(px, pz);
    
    pagodaGroup.position.set(px, py, pz);
    this.scene.add(pagodaGroup);
  }

  // --- Portfolio Pagodas / Buildings (Graphic, Branding, Poster, Contact, Resume) ---
  createPortfolioBuildings() {
    const buildingDefs = [
      { id: 'brand-identity', name: 'Brand Identity House', x: 0, z: -40, color: 0x00f0ff },
      { id: 'poster-gallery', name: 'Poster & Campaign Temple', x: -50, z: 20, color: 0xff007f },
      { id: 'social-agency', name: 'Social Media Agency', x: 50, z: 20, color: 0x8a2be2 },
      { id: 'resume-center', name: 'Resume Pagoda', x: -60, z: -40, color: 0xffbd2e },
      { id: 'contact-office', name: 'Communication Terminal', x: 60, z: 50, color: 0x16c79a }
    ];
    
    buildingDefs.forEach(def => {
      const buildGroup = new THREE.Group();
      
      // Base Foundation
      const base = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 8), this.woodMat);
      base.position.y = 0.3;
      base.castShadow = true;
      base.receiveShadow = true;
      buildGroup.add(base);
      
      // Walls
      const wall = new THREE.Mesh(new THREE.BoxGeometry(6.4, 4.2, 6.4), this.wallMat);
      wall.position.y = 2.4;
      wall.castShadow = true;
      buildGroup.add(wall);
      
      // Large Pagoda Roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(5.8, 2.3, 4), this.roofMat);
      roof.position.y = 5.25;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      buildGroup.add(roof);
      
      // Entrance Portal glowing eave banner (Emissive color indicators)
      const glowMat = new THREE.MeshBasicMaterial({ color: def.color });
      const portalBanner = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.4, 0.15), glowMat);
      portalBanner.position.set(0, 3.4, -3.22);
      buildGroup.add(portalBanner);
      
      // Coordinate clamp snapping
      const by = getTerrainHeight(def.x, def.z);
      buildGroup.position.set(def.x, by, def.z);
      
      // Rotate building to face the central roads
      const angle = Math.atan2(-def.z, -def.x); // Facing center
      buildGroup.rotation.y = angle - Math.PI/2;
      
      this.scene.add(buildGroup);
      
      // Add building to interactive list
      this.buildings.push({
        id: def.id,
        name: def.name,
        position: new THREE.Vector3(def.x, by, def.z),
        radius: 12.0 // Interaction threshold
      });
      
      // Generate two glowing hanging lanterns
      this.createHangingLanterns(buildGroup, def.color);
    });
  }

  // --- Hanging Lanterns under building eaves ---
  createHangingLanterns(parentGroup, colorHex) {
    const lanternGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 6);
    const lanternMat = new THREE.MeshBasicMaterial({ color: colorHex });
    
    // Left eave lantern
    const lanL = new THREE.Mesh(lanternGeom, lanternMat);
    lanL.position.set(-2.8, 3.8, -3.0);
    
    // Light source
    const lightL = new THREE.PointLight(colorHex, 2.5, 6);
    lightL.position.copy(lanL.position);
    
    // Right eave lantern
    const lanR = lanL.clone();
    lanR.position.x = 2.8;
    const lightR = lightL.clone();
    lightR.position.x = 2.8;
    
    parentGroup.add(lanL, lanR);
    parentGroup.add(lightL, lightR);
  }

  // --- 3D Floating Collectibles (Scrolls) ---
  createCollectibles() {
    const scrollPositions = [
      { x: 12, z: 65, name: 'Sip Zone Blueprint' },
      { x: -75, z: 12, name: 'Traditional Pattern Scroll' },
      { x: -45, z: -80, name: 'Typographic Ink Seal' },
      { x: 75, z: -70, name: 'Chronos Digital Interface' },
      { x: -5, z: -15, name: 'Zip Coz Monogram Seal' },
      { x: 65, z: 65, name: 'Creative Village Key' }
    ];
    
    const cylGeom = new THREE.CylinderGeometry(0.18, 0.18, 1.2, 8);
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xfffed3, roughness: 0.9 }); // parchment paper
    const ribbonMat = new THREE.MeshBasicMaterial({ color: 0xff007f }); // ribbon pink
    
    scrollPositions.forEach((pos, idx) => {
      const scrollGroup = new THREE.Group();
      
      // Scroll body cylinder
      const cyl = new THREE.Mesh(cylGeom, paperMat);
      cyl.castShadow = true;
      scrollGroup.add(cyl);
      
      // Red Ribbon tie
      const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15, 8), ribbonMat);
      scrollGroup.add(tie);
      
      // Floating glowing light ring
      const ringGeom = new THREE.RingGeometry(0.5, 0.65, 8);
      ringGeom.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeom, new THREE.MeshBasicMaterial({ color: 0x39ff14, side: THREE.DoubleSide }));
      scrollGroup.add(ring);
      
      const sy = getTerrainHeight(pos.x, pos.z) + 1.2;
      scrollGroup.position.set(pos.x, sy, pos.z);
      
      this.scene.add(scrollGroup);
      
      this.collectibles.push({
        name: pos.name,
        mesh: scrollGroup,
        position: new THREE.Vector3(pos.x, sy, pos.z),
        collected: false,
        id: idx
      });
    });
  }

  // --- Rotates and animates collectibles ---
  update(time) {
    this.collectibles.forEach(col => {
      if (!col.collected && col.mesh) {
        // Floating hover motion
        col.mesh.position.y = getTerrainHeight(col.position.x, col.position.z) + 1.0 + Math.sin(time * 3.5 + col.id) * 0.15;
        // Rotation spins
        col.mesh.rotation.y += 0.025;
        col.mesh.rotation.z = Math.sin(time * 1.5 + col.id) * 0.25;
      }
    });
  }
}
