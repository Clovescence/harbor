import * as THREE from 'three';
import { gsap } from 'gsap';

export function initWebGL() {
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Particles
  const particlesCount = 400;
  const positions = new Float32Array(particlesCount * 3);
  const scales = new Float32Array(particlesCount);

  for (let i = 0; i < particlesCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    scales[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

  // Determine initial color based on theme
  const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
  const getThemeColor = () => isLightTheme ? new THREE.Color(0x18392B) : new THREE.Color(0xE7E4D8);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: getThemeColor() },
      uScrollY: { value: window.scrollY }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uScrollY;
      attribute float aScale;
      varying vec2 vUv;
      void main() {
        vec3 pos = position;
        
        // Create a gentle parallax effect with scroll
        pos.y += uScrollY * 0.003; 
        
        // Wrap around vertically
        pos.y = mod(pos.y + 5.0, 10.0) - 5.0;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = (15.0 * aScale) * (1.0 / -mvPosition.z);
        
        // Add subtle wave motion
        gl_Position.x += sin(uTime * 0.5 + pos.y * 2.0) * 0.03 * aScale;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      void main() {
        // Soft circle
        float dist = distance(gl_PointCoord, vec2(0.5));
        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(uColor, alpha * 0.5);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: isLightTheme ? THREE.NormalBlending : THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Theme change listener
  window.addEventListener('theme-changed', (e) => {
    const isLight = e.detail.theme === 'light';
    gsap.to(material.uniforms.uColor.value, {
      r: isLight ? 0x18 / 255 : 0xE7 / 255,
      g: isLight ? 0x39 / 255 : 0xE4 / 255,
      b: isLight ? 0x2B / 255 : 0xD8 / 255,
      duration: 1,
      ease: "power2.inOut"
    });
    material.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
  });

  // Scroll listener
  let targetScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    targetScrollY = window.scrollY;
  });

  // Resize listener
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animation loop
  const clock = new THREE.Clock();
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  function animate() {
    requestAnimationFrame(animate);
    
    if (!prefersReducedMotion.matches) {
      material.uniforms.uTime.value = clock.getElapsedTime();
    }
    
    // Smooth scroll interpolation
    material.uniforms.uScrollY.value += (targetScrollY - material.uniforms.uScrollY.value) * 0.05;
    
    renderer.render(scene, camera);
  }

  animate();
}
