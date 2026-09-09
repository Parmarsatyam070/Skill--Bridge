import React, { useEffect, useRef } from 'react';

/**
 * Premium Abstract Futuristic Animated Background for SkillBridge.
 *
 * Architecture:
 * - GPU-accelerated WebGL shader rendering continuous 3D flowing ribbons & waves.
 * - Multi-layer visual depth:
 *     Layer 1 (Background): Soft, slow volumetric dark indigo/navy swells.
 *     Layer 2 (Middle): Flowing 3D ribbons twisting in space with dynamic front/back illumination.
 *     Layer 3 (Foreground): Slender cresting ribbons with luminous cyan/sky rim highlights.
 * - Restrained, dark futuristic palette: #05070a base with deep blues, cyans, and purples.
 * - Zero CPU load: all math runs on the GPU at 60 FPS.
 * - Automatically falls back to high-fidelity Canvas 2D bezier ribbons if WebGL is unavailable.
 * - Respects prefers-reduced-motion: reduce (renders static frame).
 * - Mobile optimized (capped resolution, reduced overhead).
 * - pointer-events: none, position: fixed inset-0, strictly behind all UI.
 */
export const FluidRibbonBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = mediaQuery.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    mediaQuery.addEventListener('change', handleMotionChange);

    let animationFrameId: number;
    let isCleanedUp = false;

    // Try WebGL first
    let gl: WebGLRenderingContext | null = null;
    try {
      gl =
        (canvas.getContext('webgl', {
          alpha: false,
          antialias: false,
          depth: false,
          stencil: false,
          powerPreference: 'high-performance',
        }) as WebGLRenderingContext | null) ||
        (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    } catch {
      gl = null;
    }

    if (gl) {
      // ── WebGL GPU Pipeline ──────────────────────────────────────────
      const vsSource = `
        attribute vec2 a_position;
        varying vec2 v_uv;
        void main() {
          v_uv = (a_position + 1.0) * 0.5;
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

      const fsSource = `
        precision mediump float;
        uniform vec2 u_resolution;
        uniform float u_time;
        varying vec2 v_uv;

        // Rotation helper
        vec2 rotate(vec2 p, float angle) {
          float s = sin(angle);
          float c = cos(angle);
          return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
        }

        void main() {
          // Normalized centered aspect coordinates
          vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.y, u_resolution.x);

          // Subtle overall spatial drift
          p = rotate(p, sin(u_time * 0.03) * 0.08);

          // Base canvas dark space (#05070a)
          vec3 baseColor = vec3(0.0196, 0.0275, 0.0392);
          vec3 finalColor = baseColor;

          // ── LAYER 1: Background Volumetric Swells (Deep Indigo & Navy) ──
          float bgWave1 = sin(p.x * 0.75 + u_time * 0.06) * 0.42 + cos(p.x * 0.35 - u_time * 0.04) * 0.25;
          float bgDist1 = abs(p.y - bgWave1);
          float bgGlow1 = exp(-bgDist1 * 2.2);
          vec3 bgCol1 = mix(vec3(0.02, 0.04, 0.14), vec3(0.06, 0.02, 0.16), sin(p.x * 0.5 + u_time * 0.05) * 0.5 + 0.5);
          finalColor += bgCol1 * bgGlow1 * 0.45;

          float bgWave2 = cos(p.x * 0.9 - u_time * 0.08) * 0.38 - 0.2;
          float bgDist2 = abs(p.y - bgWave2);
          float bgGlow2 = exp(-bgDist2 * 2.6);
          vec3 bgCol2 = vec3(0.01, 0.06, 0.15);
          finalColor += bgCol2 * bgGlow2 * 0.4;

          // ── LAYER 2: Middle 3D Flowing Ribbons (Twisting Ribbons with Shading) ──
          // Ribbon A (Primary Blue/Cyan Twisted Ribbon)
          float ribbon1Y = sin(p.x * 1.35 + u_time * 0.14 + cos(p.x * 0.65 - u_time * 0.09)) * 0.35 + 0.08;
          float twist1 = sin(p.x * 1.65 + u_time * 0.19);
          float width1 = 0.05 + 0.11 * abs(twist1);
          float d1 = p.y - ribbon1Y;
          float uRibbon1 = clamp(d1 / max(width1, 0.001), -1.0, 1.0);
          float mask1 = smoothstep(1.0, 0.15, abs(uRibbon1));

          // 3D Lighting on Ribbon A
          float faceLighting1 = (twist1 * 0.5 + 0.5) * (0.65 + 0.35 * cos(uRibbon1 * 3.14159));
          float edgeRim1 = pow(smoothstep(0.45, 1.0, abs(uRibbon1)), 2.2) * 0.55;
          float halo1 = exp(-abs(d1) * 4.2) * 0.32;

          vec3 ribbon1Color = mix(
            vec3(0.03, 0.22, 0.58), // Electric Royal Blue
            vec3(0.02, 0.48, 0.62), // Cyan Luminous
            sin(p.x * 1.2 + u_time * 0.15) * 0.5 + 0.5
          );
          ribbon1Color = mix(ribbon1Color, vec3(0.18, 0.08, 0.42), smoothstep(-0.5, 0.5, twist1) * 0.4);

          finalColor += ribbon1Color * (mask1 * faceLighting1 + edgeRim1 + halo1) * 0.52;

          // Ribbon B (Counter-flowing Intertwining Indigo/Cobalt Ribbon)
          float ribbon2Y = cos(p.x * 1.15 - u_time * 0.12 + sin(p.x * 0.85 + u_time * 0.08)) * 0.30 - 0.18;
          float twist2 = cos(p.x * 1.45 - u_time * 0.16);
          float width2 = 0.045 + 0.095 * abs(twist2);
          float d2 = p.y - ribbon2Y;
          float uRibbon2 = clamp(d2 / max(width2, 0.001), -1.0, 1.0);
          float mask2 = smoothstep(1.0, 0.2, abs(uRibbon2));

          float faceLighting2 = (twist2 * 0.5 + 0.5) * (0.6 + 0.4 * cos(uRibbon2 * 3.14159));
          float edgeRim2 = pow(smoothstep(0.4, 1.0, abs(uRibbon2)), 2.0) * 0.48;
          float halo2 = exp(-abs(d2) * 4.8) * 0.28;

          vec3 ribbon2Color = mix(
            vec3(0.02, 0.15, 0.48), // Deep Blue
            vec3(0.14, 0.06, 0.42), // Indigo Purple
            cos(p.x * 0.9 - u_time * 0.12) * 0.5 + 0.5
          );
          finalColor += ribbon2Color * (mask2 * faceLighting2 + edgeRim2 + halo2) * 0.44;

          // ── LAYER 3: Foreground Delicate Luminous Filament (Crisp Edge Crest) ──
          float fgY = sin(p.x * 1.85 + u_time * 0.18) * 0.24 + cos(p.x * 1.1 + u_time * 0.13) * 0.18 - 0.02;
          float fgDist = abs(p.y - fgY);
          float fgFilament = 0.0035 / (fgDist + 0.008);
          float fgGlow = exp(-fgDist * 7.5) * 0.35;

          vec3 fgColor = mix(
            vec3(0.10, 0.65, 0.85), // Vivid Sky Cyan
            vec3(0.22, 0.40, 0.98), // Bright Azure
            sin(p.x * 2.0 + u_time * 0.2) * 0.5 + 0.5
          );
          finalColor += fgColor * (fgFilament * 0.45 + fgGlow * 0.35) * 0.45;

          // Subtle Atmospheric Depth Vignette
          float vignette = 1.0 - smoothstep(0.65, 1.5, length(p));
          finalColor *= (0.85 + 0.15 * vignette);

          // Output clamped color
          gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
        }
      `;

      // Shader compilation helper
      const createShader = (type: number, source: string) => {
        const shader = gl!.createShader(type);
        if (!shader) return null;
        gl!.shaderSource(shader, source);
        gl!.compileShader(shader);
        if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
          console.warn('WebGL shader compilation warning:', gl!.getShaderInfoLog(shader));
          gl!.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vertexShader = createShader(gl.VERTEX_SHADER, vsSource);
      const fragmentShader = createShader(gl.FRAGMENT_SHADER, fsSource);

      if (vertexShader && fragmentShader) {
        const program = gl.createProgram();
        if (program) {
          gl.attachShader(program, vertexShader);
          gl.attachShader(program, fragmentShader);
          gl.linkProgram(program);

          if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.useProgram(program);

            // Quad buffer
            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            const positions = new Float32Array([
              -1, -1,
               1, -1,
              -1,  1,
              -1,  1,
               1, -1,
               1,  1,
            ]);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

            const aPosition = gl.getAttribLocation(program, 'a_position');
            gl.enableVertexAttribArray(aPosition);
            gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

            const uResolution = gl.getUniformLocation(program, 'u_resolution');
            const uTime = gl.getUniformLocation(program, 'u_time');

            // Responsive sizing
            const handleResize = () => {
              if (!canvas || !gl) return;
              const isMobile = window.innerWidth < 768;
              // Cap DPR at 1.0 on mobile, 1.25 on desktop to ensure smooth 60fps performance
              const dpr = isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.25);
              const width = Math.floor(window.innerWidth * dpr);
              const height = Math.floor(window.innerHeight * dpr);

              if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
                gl.viewport(0, 0, width, height);
              }
            };

            window.addEventListener('resize', handleResize);
            handleResize();

            let startTime = performance.now();
            let simulatedTime = 0;
            let lastTimestamp = startTime;

            const render = (timestamp: number) => {
              if (isCleanedUp || !gl) return;

              const delta = (timestamp - lastTimestamp) * 0.001;
              lastTimestamp = timestamp;

              if (!prefersReducedMotion) {
                // Smooth continuous time evolution
                simulatedTime += Math.min(delta, 0.05);
              }

              gl.uniform2f(uResolution, canvas.width, canvas.height);
              gl.uniform1f(uTime, simulatedTime);
              gl.drawArrays(gl.TRIANGLES, 0, 6);

              animationFrameId = requestAnimationFrame(render);
            };

            animationFrameId = requestAnimationFrame(render);

            return () => {
              isCleanedUp = true;
              cancelAnimationFrame(animationFrameId);
              window.removeEventListener('resize', handleResize);
              mediaQuery.removeEventListener('change', handleMotionChange);
              if (program && gl) {
                gl.deleteProgram(program);
                gl.deleteShader(vertexShader);
                gl.deleteShader(fragmentShader);
                if (positionBuffer) gl.deleteBuffer(positionBuffer);
              }
            };
          }
        }
      }
    }

    // ── Fallback: Canvas 2D Smooth Fluid Ribbons Pipeline ─────────────────
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize2D = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize2D);
    handleResize2D();

    let t = 0;
    const render2D = () => {
      if (isCleanedUp || !ctx) return;

      if (!prefersReducedMotion) {
        t += 0.01;
      }

      const w = canvas.width;
      const h = canvas.height;

      // Base background
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, w, h);

      // Layer 1: Background Soft Swell
      ctx.save();
      ctx.filter = 'blur(60px)';
      const gradBg = ctx.createLinearGradient(0, h * 0.2, w, h * 0.8);
      gradBg.addColorStop(0, 'rgba(10, 20, 50, 0.35)');
      gradBg.addColorStop(0.5, 'rgba(25, 10, 55, 0.25)');
      gradBg.addColorStop(1, 'rgba(6, 25, 45, 0.3)');

      ctx.beginPath();
      ctx.moveTo(0, h * 0.5 + Math.sin(t * 0.4) * 80);
      ctx.bezierCurveTo(
        w * 0.3, h * 0.3 + Math.cos(t * 0.5) * 90,
        w * 0.7, h * 0.7 + Math.sin(t * 0.6) * 90,
        w, h * 0.5 + Math.cos(t * 0.4) * 80
      );
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = gradBg;
      ctx.fill();
      ctx.restore();

      // Layer 2: Flowing 3D Ribbons (Middle Layer)
      const ribbons = [
        {
          start: h * 0.45,
          cp1Y: h * 0.25 + Math.sin(t * 0.7) * 70,
          cp2Y: h * 0.65 + Math.cos(t * 0.8) * 80,
          end: h * 0.5 + Math.sin(t * 0.6) * 60,
          stroke: 'rgba(14, 165, 233, 0.25)',
          glow: 'rgba(59, 130, 246, 0.2)',
          width: 38,
        },
        {
          start: h * 0.55,
          cp1Y: h * 0.75 + Math.cos(t * 0.6) * 75,
          cp2Y: h * 0.35 + Math.sin(t * 0.75) * 85,
          end: h * 0.45 + Math.cos(t * 0.55) * 65,
          stroke: 'rgba(99, 102, 241, 0.22)',
          glow: 'rgba(79, 70, 229, 0.18)',
          width: 32,
        },
      ];

      ribbons.forEach(r => {
        ctx.save();
        ctx.shadowColor = r.glow;
        ctx.shadowBlur = 40;
        ctx.strokeStyle = r.stroke;
        ctx.lineWidth = r.width;
        ctx.beginPath();
        ctx.moveTo(0, r.start);
        ctx.bezierCurveTo(w * 0.33, r.cp1Y, w * 0.66, r.cp2Y, w, r.end);
        ctx.stroke();
        ctx.restore();
      });

      // Layer 3: Foreground Crest Filament
      ctx.save();
      ctx.shadowColor = 'rgba(56, 189, 248, 0.45)';
      ctx.shadowBlur = 25;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.48 + Math.sin(t * 0.9) * 45);
      ctx.bezierCurveTo(
        w * 0.35, h * 0.32 + Math.cos(t * 1.0) * 55,
        w * 0.65, h * 0.62 + Math.sin(t * 1.1) * 60,
        w, h * 0.46 + Math.cos(t * 0.95) * 50
      );
      ctx.stroke();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render2D);
    };

    animationFrameId = requestAnimationFrame(render2D);

    return () => {
      isCleanedUp = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize2D);
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default FluidRibbonBackground;
