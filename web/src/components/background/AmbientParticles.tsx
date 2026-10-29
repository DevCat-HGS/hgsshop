import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  phase: number;
  alpha: number;
  mint: boolean;
}

const DENSITY = 1 / 26000; // partículas por píxel de pantalla: ~40 en un escritorio 1440×900
const MAX_PARTICLES = 60;

function createParticle(width: number, height: number, anywhere: boolean): Particle {
  return {
    x: Math.random() * width,
    y: anywhere ? Math.random() * height : height + 10,
    radius: 0.6 + Math.random() * 1.6,
    speed: 0.08 + Math.random() * 0.22,
    drift: 0.2 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
    alpha: 0.15 + Math.random() * 0.45,
    // La menta es un detalle (docs/marca/paleta.md): una de cada doce partículas.
    mint: Math.random() < 1 / 12,
  };
}

/**
 * Partículas en suspensión que suben despacio, como plancton en agua profunda. Decorativas: el
 * canvas es aria-hidden, no captura eventos, se pausa cuando la pestaña no está visible y, con
 * movimiento reducido, se dibuja una sola vez y queda quieto.
 */
export function AmbientParticles({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let time = 0;

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      canvas!.width = width * ratio;
      canvas!.height = height * ratio;
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(MAX_PARTICLES, Math.round(width * height * DENSITY));
      particles = Array.from({ length: count }, () => createParticle(width, height, true));
    }

    function draw() {
      context!.clearRect(0, 0, width, height);
      for (const p of particles) {
        const x = p.x + Math.sin(time * 0.0006 * p.drift + p.phase) * 14;
        context!.beginPath();
        context!.arc(x, p.y, p.radius, 0, Math.PI * 2);
        context!.fillStyle = p.mint ? `rgba(72, 214, 176, ${p.alpha})` : `rgba(169, 203, 255, ${p.alpha})`;
        context!.fill();
      }
    }

    function tick(now: number) {
      time = now;
      for (let i = 0; i < particles.length; i++) {
        particles[i].y -= particles[i].speed;
        if (particles[i].y < -10) particles[i] = createParticle(width, height, false);
      }
      draw();
      frame = requestAnimationFrame(tick);
    }

    function handleVisibility() {
      cancelAnimationFrame(frame);
      if (!document.hidden && !reducedMotion) frame = requestAnimationFrame(tick);
    }

    resize();
    draw();
    if (!reducedMotion) frame = requestAnimationFrame(tick);

    const observer = new ResizeObserver(() => {
      resize();
      draw();
    });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none size-full ${className}`} />;
}
