// Sequoia - WebGL Atmosphere (Three.js)

if (typeof THREE !== 'undefined') {
  const initWebGL = () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'gl-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '-2';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geometry = new THREE.PlaneGeometry(2, 2);

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform float uRainIntensity;
      varying vec2 vUv;

      // Random noise function
      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      // Smooth noise
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                   mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
      }

      void main() {
        vec2 st = gl_FragCoord.xy / uResolution.xy;
        st.x *= uResolution.x / uResolution.y;

        // Slow drift
        vec2 pos = st * 3.0;
        pos.y -= uTime * 0.05;
        pos.x += uTime * 0.02;

        // Subtle mouse influence
        pos += (uMouse - 0.5) * 0.2;

        float n = noise(pos * 2.0 + uTime * 0.05);
        n += noise(pos * 4.0 - uTime * 0.1) * 0.5;
        
        // Base grain
        float grain = hash(st * (100.0 + uTime * 10.0)) * 0.04;

        // Color blending
        vec3 color1 = vec3(0.04, 0.10, 0.07); // Deep racing green
        vec3 color2 = vec3(0.02, 0.06, 0.04); // Forest shadow
        
        float mixVal = smoothstep(0.2, 1.5, n);
        vec3 finalColor = mix(color1, color2, mixVal) + grain;

        // Weather adjustment
        if (uRainIntensity > 0.0) {
           finalColor -= vec3(0.01); // Darker
           finalColor += hash(st * 200.0 + uTime * 20.0) * 0.04 * uRainIntensity; // Heavier grain
        }

        gl_FragColor = vec4(finalColor, 0.85);
      }
    `;

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uRainIntensity: { value: 0.0 }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Mouse tracking
    let targetMouse = new THREE.Vector2(0.5, 0.5);
    window.addEventListener('mousemove', (e) => {
      targetMouse.x = e.clientX / window.innerWidth;
      targetMouse.y = 1.0 - (e.clientY / window.innerHeight);
    });

    // Resize
    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    });

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      uniforms.uTime.value = clock.getElapsedTime();
      
      // Smooth mouse interpolate
      // We implement custom lerp since THREE.Vector2.lerp creates garbage or modifies in-place depending on version
      uniforms.uMouse.value.x += (targetMouse.x - uniforms.uMouse.value.x) * 0.05;
      uniforms.uMouse.value.y += (targetMouse.y - uniforms.uMouse.value.y) * 0.05;
      
      // Sync weather flag
      if (window.isRaining) {
         uniforms.uRainIntensity.value += (1.0 - uniforms.uRainIntensity.value) * 0.01;
      }
      
      renderer.render(scene, camera);
    };

    animate();

    // Hide old CSS grain
    const cssGrain = document.getElementById('film-grain');
    if (cssGrain) cssGrain.style.display = 'none';
  };

  document.addEventListener('DOMContentLoaded', initWebGL);
}
