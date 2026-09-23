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

  // --- Minimal Particle System ---
  const particleCount = 200;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;     
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20; 
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10; 
    
    // Slow, constant upward drift
    velocities.push((Math.random() * 0.005) + 0.002);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0xE7E4D8) },
      uOpacity: { value: 0.3 }
    },
    vertexShader: `
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = 6.0 * (10.0 / -mvPosition.z); // size attenuation
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() {
        vec2 xy = gl_PointCoord.xy - vec2(0.5);
        float ll = length(xy);
        if (ll > 0.5) discard;
        float alpha = smoothstep(0.5, 0.1, ll) * uOpacity;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Weather listener strictly for subtle opacity adjustments.
  // The overall brightness/color is controlled via CSS variables in variables.css.
  window.addEventListener('weather-changed', (e) => {
    const weather = e.detail.weather;
    let targetOpacity = 0.3;
    
    if (weather === 'rain') targetOpacity = 0.5;
    else if (weather === 'storm') targetOpacity = 0.8; 
    else if (weather === 'snow') targetOpacity = 0.9;
    else if (weather === 'clear') targetOpacity = 0.1;
    
    gsap.to(material.uniforms.uOpacity, { value: targetOpacity, duration: 2, ease: "power2.inOut" });
  });

  // Animation Loop
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  function animate() {
    requestAnimationFrame(animate);
    
    if (!prefersReducedMotion.matches) {
      const positionsAttr = particles.geometry.attributes.position;
      const positions = positionsAttr.array;

      for (let i = 0; i < particleCount; i++) {
        // Drift upwards
        positions[i * 3 + 1] += velocities[i];
        
        // Wrap around vertically
        if (positions[i * 3 + 1] > 10) {
          positions[i * 3 + 1] = -10;
        }
      }
      positionsAttr.needsUpdate = true;
    }
    
    renderer.render(scene, camera);
  }

  animate();
}
