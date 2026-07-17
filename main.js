import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { AudioSynth } from './components/AudioSynth.js';

// UI ബട്ടണുകൾ സെലക്ട് ചെയ്യുന്നു
const button = document.querySelector('.start-btn') || document.querySelector('button');
const overlay = document.querySelector('.loader-overlay') || document.querySelector('.loader');

if (button) {
    button.addEventListener('click', () => {
        // ബട്ടൺ അമർത്തുമ്പോൾ ലാൻഡിംഗ് പേജ് മറയ്ക്കുന്നു
        if (overlay) overlay.style.display = 'none';
        
        // 3D ഡിജിറ്റൽ ലോകം സ്റ്റാർട്ട് ചെയ്യുന്നു!
        init3D();
    });
} else {
    // ബട്ടൺ ഇല്ലെങ്കിൽ നേരിട്ട് സ്റ്റാർട്ട് ചെയ്യും
    init3D();
}

function init3D() {
    // 1. ഓഡിയോ സിസ്റ്റം ഓൺ ആക്കുന്നു
    const audio = new AudioSynth();
    audio.init();
    audio.setMute(false);
    if (typeof audio.playSystemSweep === 'function') {
        audio.playSystemSweep();
    }

    // 2. 3D സീൻ (Scene) ഉണ്ടാക്കുന്നു
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x051410); // നിങ്ങളുടെ തീമിന് ചേർന്ന ഡാർക്ക് ഗ്രീൻ

    // 3. ക്യാമറ സെറ്റ് ചെയ്യുന്നു
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // 4. വെബ്‌ജിഎൽ റെൻഡറർ (WebGL Renderer) ഉണ്ടാക്കുന്നു
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.classList.add('experience');
    document.body.appendChild(renderer.domElement);

    // 5. നിങ്ങളുടെ ഡിസൈൻ ഗ്രിഡ് മാച്ചിങ് ആയ ഒരു 3D ഗ്രിഡ് ഫ്ലോർ ചേർക്കുന്നു
    const gridHelper = new THREE.GridHelper(100, 100, 0x16c79a, 0x0a2920);
    scene.add(gridHelper);

    // 6. നടുവിലായി ഒരു 3D ടെസ്റ്റ് ഒബ്ജക്റ്റ് (വയർഫ്രെയിം ക്യൂബ്) വെക്കുന്നു
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0x16c79a, wireframe: true });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.y = 1;
    scene.add(cube);

    // 7. ആനിമേഷൻ ലൂപ്പ് (ഇതാണ് 3D ചലിപ്പിക്കുന്നത്)
    function animate() {
        requestAnimationFrame(animate);
        
        // 3D ഒബ്ജക്റ്റ് ചെറുതായി കറക്കുന്നു
        cube.rotation.y += 0.01;
        
        renderer.render(scene, camera);
    }
    animate();

    // ഫോൺ തിരിക്കുമ്പോൾ സ്ക്രീൻ സൈസ് ഓട്ടോമാറ്റിക് ആയി അഡ്ജസ്റ്റ് ആകാൻ
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
