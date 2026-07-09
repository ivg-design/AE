// logo3d.js — Build-a-Bar 3D logo: shiny copper/anodized metal, studio
// reflections, gentle idle spin + pointer parallax. Self-contained, lazy,
// respects reduced-motion, pauses when off-screen.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const stage = document.getElementById('logo3d');
const canvas = document.getElementById('logo3dCanvas');
if (stage && canvas && window.WebGLRenderingContext) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { stage.classList.add('logo3d--fallback'); }

  if (renderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.15, 7.4);

    // Extra directional highlights for crisp specular streaks on the metal.
    const key = new THREE.DirectionalLight(0xffffff, 2.0);
    key.position.set(5, 7, 6);
    const warm = new THREE.DirectionalLight(0xffd9a8, 1.3);
    warm.position.set(-6, 1.5, 3);
    const cool = new THREE.DirectionalLight(0x9fc6ff, 0.8);
    cool.position.set(-2, -3, -6);
    scene.add(key, warm, cool);

    // Pivot the model tilts on (pointer parallax); spin lives on an inner group.
    const pivot = new THREE.Group();
    const spinner = new THREE.Group();
    pivot.add(spinner);
    scene.add(pivot);

    const loader = new GLTFLoader();
    let loaded = false;
    loader.load(
      'assets/logo-3d.glb',
      (gltf) => {
        const model = gltf.scene;
        model.traverse((o) => {
          if (!o.isMesh || !o.material) return;
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of mats) {
            if ('metalness' in m) m.metalness = 1.0;
            if ('roughness' in m) m.roughness = Math.min(m.roughness ?? 0.2, 0.22);
            m.envMapIntensity = 1.35;
            m.needsUpdate = true;
          }
        });
        // Center on origin (GLB already exports Y-up, facing the camera).
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        spinner.add(model);
        // Frame to the logo's height (it's a wide, short plaque) with headroom
        // for the idle spin + pointer tilt, and a tiny top-down angle.
        const size = box.getSize(new THREE.Vector3());
        const halfExtent = size.y / 2 + size.z * 0.3;
        const dist = halfExtent / Math.tan((camera.fov * Math.PI / 180) / 2);
        camera.position.set(0, size.y * 0.12, dist * 1.5);
        camera.lookAt(0, 0, 0);
        loaded = true;
        resize();
      },
      undefined,
      () => { stage.classList.add('logo3d--fallback'); }
    );

    // Pointer parallax (damped) + idle spin.
    let targetX = 0, targetY = 0, curX = 0, curY = 0, spin = 0;
    const onMove = (e) => {
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      targetY = px * 0.7;           // yaw toward cursor
      targetX = py * 0.4;           // pitch toward cursor
    };
    const onLeave = () => { targetX = 0; targetY = 0; };
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);

    function resize() {
      const w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    let visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.01 })
        .observe(stage);
    }

    function frame() {
      requestAnimationFrame(frame);
      if (!loaded || !visible) return;
      if (!reduce) spin += 0.0032;
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      spinner.rotation.y = spin;
      pivot.rotation.x = curX;
      pivot.rotation.y = curY;
      renderer.render(scene, camera);
    }
    frame();
  } else {
    stage.classList.add('logo3d--fallback');
  }
}
