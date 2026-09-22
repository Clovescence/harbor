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
      uniform float uColorShift;
      uniform float uWaveSpeed;
      uniform float uWaveHeight;
      varying vec2 vUv;

      // Random noise function
      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      // Smooth noise (Simplex-ish)
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                   mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
      }
      
      // Fractional Brownian Motion for complex terrain
      float fbm(vec2 x) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i = 0; i < 5; ++i) {
          v += a * noise(x);
          x = rot * x * 2.0 + shift;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 st = gl_FragCoord.xy / uResolution.xy;
        st.x *= uResolution.x / uResolution.y;

        // Slow drift + API driven speed
        vec2 pos = st * 3.0;
        float time_factor = uTime * (0.05 * uWaveSpeed);
        pos.y -= time_factor;
        pos.x += time_factor * 0.5;

        // Mouse influence
        pos += (uMouse - 0.5) * 0.3;

        // Create height map using FBM and API driven height
        float h = fbm(pos + time_factor);
        h += fbm(pos * 2.0 - time_factor) * 0.5 * uWaveHeight;
        
        // Topographic contour lines
        // We take the fractional part of the height multiplied by some scale
        float contour = fract(h * 8.0);
        
        // Anti-alias the lines
        // We want a line where contour is close to 0.0 or 1.0
        float lineThickness = 0.05;
        float lines = smoothstep(lineThickness, 0.0, contour) + smoothstep(1.0 - lineThickness, 1.0, contour);
        
        // Base grain
        float grain = hash(st * (100.0 + uTime * 10.0)) * 0.04;

        // Color blending
        // Background colors driven by uColorShift (which we can control via time-of-day or backend)
        vec3 colorBg = vec3(0.04 + uColorShift * 0.02, 0.10, 0.07); // Deep racing green
        vec3 colorLine = vec3(0.78, 0.66, 0.43) * 0.4; // Muted gold for lines
        
        // Add subtle gradient to the height map to give depth
        float depth = smoothstep(0.2, 1.5, h);
        vec3 finalColor = mix(colorBg, colorBg * 0.5, depth);
        
        // Add lines
        finalColor = mix(finalColor, colorLine, lines * 0.3); // 30% opacity lines
        
        // Add grain
        finalColor += grain;

        // Weather adjustment
        if (uRainIntensity > 0.0) {
           finalColor -= vec3(0.01); // Darker
           finalColor += hash(st * 200.0 + uTime * 20.0) * 0.04 * uRainIntensity; // Heavier grain
           // Ripple effect from rain
           float ripples = sin(length(st - 0.5) * 50.0 - uTime * 10.0) * 0.5 + 0.5;
           finalColor += vec3(0.02) * ripples * uRainIntensity;
        }

        gl_FragColor = vec4(finalColor, 0.85);
      }
    `;

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uRainIntensity: { value: 0.0 },
      uColorShift: { value: 0.0 }, // from backend
      uWaveSpeed: { value: 1.0 }, // from backend
      uWaveHeight: { value: 1.0 } // from backend
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

    // Sync with backend GL Data
    const fetchGLData = async () => {
       try {
          const res = await fetch('http://localhost:8000/api/gl-data');
          const data = await res.json();
          if (data) {
             if (data.colorShift !== undefined) uniforms.uColorShift.value = data.colorShift;
             if (data.waveSpeed !== undefined) uniforms.uWaveSpeed.value = data.waveSpeed;
             if (data.waveHeight !== undefined) uniforms.uWaveHeight.value = data.waveHeight;
          }
       } catch (e) {
          // ignore
       }
    };
    setInterval(fetchGLData, 1000);

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
