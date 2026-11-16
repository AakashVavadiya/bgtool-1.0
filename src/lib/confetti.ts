/**
 * Lightweight Zero-Dependency Canvas Confetti Explosion Engine
 * Safe for modern browsers, automatically removes canvas after animation
 */
export function fireConfetti(options?: {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
}) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const particleCount = options?.particleCount ?? 80;
  const spread = options?.spread ?? 70;
  const originX = options?.origin?.x ?? 0.5;
  const originY = options?.origin?.y ?? 0.45;
  const colors = options?.colors ?? [
    "#10b981", // emerald
    "#34d399", // light emerald
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#f59e0b", // amber
    "#ec4899", // pink
    "#06b6d4", // cyan
  ];

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "99999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
    shape: "rect" | "circle";
  }

  const particles: Particle[] = [];
  const startX = width * originX;
  const startY = height * originY;

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.random() - 0.5) * (spread * (Math.PI / 180)) - Math.PI / 2;
    const speed = Math.random() * 12 + 8;
    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)] ?? "#10b981",
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
      shape: Math.random() > 0.4 ? "rect" : "circle",
    });
  }

  const gravity = 0.38;
  const drag = 0.96;
  let startTime = performance.now();

  function animate(now: number) {
    const elapsed = now - startTime;
    ctx!.clearRect(0, 0, width, height);

    let activeCount = 0;
    for (const p of particles) {
      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      // Fade out smoothly after 1.2s
      if (elapsed > 1200) {
        p.opacity = Math.max(0, 1 - (elapsed - 1200) / 1000);
      }

      if (p.opacity > 0 && p.y < height + 50) {
        activeCount++;
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.globalAlpha = p.opacity;
        ctx!.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx!.beginPath();
          ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx!.fill();
        }

        ctx!.restore();
      }
    }

    if (activeCount > 0 && elapsed < 2600) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(animate);
}
