import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/* A faceted "eye" crystal: elongated octahedron shell, gold edges, glowing amethyst pupil. */
export function startCrystal(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0, 7.2);

  const group = new THREE.Group();
  scene.add(group);

  const shellGeo = new THREE.OctahedronGeometry(1.6, 0);
  shellGeo.scale(1.45, 0.95, 0.75);
  const shell = new THREE.Mesh(shellGeo, new THREE.MeshStandardMaterial({
    color: 0xd9c6f5, metalness: 0.35, roughness: 0.12, flatShading: true, transparent: true, opacity: 0.55
  }));
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(shellGeo),
    new THREE.LineBasicMaterial({ color: 0xd9b26f, transparent: true, opacity: 0.9 })
  );
  const pupil = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.62, 1),
    new THREE.MeshStandardMaterial({ color: 0x5a2f9a, emissive: 0x6b3fc0, emissiveIntensity: 0.9, flatShading: true, roughness: 0.3 })
  );
  group.add(shell, edges, pupil);

  scene.add(new THREE.HemisphereLight(0xf1e6ff, 0x1a1030, 1.1));
  const gold = new THREE.PointLight(0xffd58a, 55, 20); gold.position.set(3.5, 2.5, 4);
  const violet = new THREE.PointLight(0x9b6bff, 40, 20); violet.position.set(-4, -2, 3);
  scene.add(gold, violet);

  const size = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 600 ? 8.6 : 7.2;
    camera.updateProjectionMatrix();
  };
  size();
  addEventListener('resize', size);

  // tilt with pointer, or with the phone when the browser allows it
  const tilt = { x: 0, y: 0 };
  addEventListener('pointermove', e => {
    tilt.x = (e.clientX / innerWidth - 0.5) * 0.9;
    tilt.y = (e.clientY / innerHeight - 0.5) * 0.6;
  }, { passive: true });
  addEventListener('deviceorientation', e => {
    if (e.gamma == null) return;
    tilt.x = Math.max(-1, Math.min(1, e.gamma / 45)) * 0.5;
    tilt.y = Math.max(-1, Math.min(1, ((e.beta || 0) - 45) / 45)) * 0.35;
  }, { passive: true });

  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(canvas);

  const clock = new THREE.Clock();
  const frame = () => {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    group.rotation.y += (t * 0.35 + tilt.x - group.rotation.y) * 0.04;
    group.rotation.x += (tilt.y * 0.8 + Math.sin(t * 0.6) * 0.08 - group.rotation.x) * 0.05;
    group.position.y = Math.sin(t * 0.9) * 0.08;
    pupil.rotation.z = t * 0.5;
    pupil.material.emissiveIntensity = 0.8 + Math.sin(t * 1.6) * 0.25;
    renderer.render(scene, camera);
  };
  frame();
  canvas.classList.add('is-on');
}
