/**
 * High-Precision 3D-Flutter Canvas Confetti & Streamer Celebration Engine
 * - Delta-time normalized (60Hz / 120Hz / 144Hz consistent)
 * - Balanced multi-emitter burst (left cannon, right cannon, and center fountain)
 * - 3D ribbon tilt/flip, stars, and circles with gentle air-resistance sway
 */
export function fireConfetti(options?: {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
}) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const totalCount = options?.particleCount ?? 110;
  const colors = options?.colors ?? [
    "#ff5500", // Brand Orange
    "#10b981", // Emerald
    "#fbbf24", // Gold / Amber
    "#3b82f6", // Royal Blue
    "#ec4899", // Rose Pink
    "#8b5cf6", // Violet
    "#06b6d4", // Cyan
  ];

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
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

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = window.innerWidth;
  let height = window.innerHeight;

  const updateCanvasSize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  updateCanvasSize();

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    width: number;
    height: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    tiltAngle: number;
    tiltSpeed: number;
    swayPhase: number;
    swaySpeed: number;
    opacity: number;
    shape: "ribbon" | "circle" | "star";
    delayMs: number;
  }

  const particles: Particle[] = [];

  // Create balanced emitters across the screen so confetti frames the entire success view
  const emitters = options?.origin
    ? [{ x: options.origin.x, y: options.origin.y, angleDeg: -90, spreadDeg: options.spread ?? 100, weight: 1 }]
    : [
        // Left side upward-inward cannon
        { x: 0.18, y: 0.55, angleDeg: -62, spreadDeg: 55, weight: 0.35 },
        // Center wide celebration fountain
        { x: 0.5, y: 0.38, angleDeg: -90, spreadDeg: 115, weight: 0.3 },
        // Right side upward-inward cannon
        { x: 0.82, y: 0.55, angleDeg: -118, spreadDeg: 55, weight: 0.35 },
      ];

  for (const emitter of emitters) {
    const count = Math.max(12, Math.round(totalCount * emitter.weight));
    const startX = width * emitter.x;
    const startY = height * emitter.y;

    for (let i = 0; i < count; i++) {
      const angleRad =
        ((emitter.angleDeg + (Math.random() - 0.5) * emitter.spreadDeg) * Math.PI) / 180;
      // Wide velocity range (px per 60fps frame) so particles reach across the screen
      const speed = 11 + Math.random() * 18;
      const shapeRoll = Math.random();
      const shape: Particle["shape"] =
        shapeRoll < 0.58 ? "ribbon" : shapeRoll < 0.82 ? "circle" : "star";

      const baseSize = 6 + Math.random() * 6;
      particles.push({
        x: startX + (Math.random() - 0.5) * 28,
        y: startY + (Math.random() - 0.5) * 18,
        vx: Math.cos(angleRad) * speed,
        vy: Math.sin(angleRad) * speed,
        width: shape === "ribbon" ? baseSize * 1.45 : baseSize,
        height: shape === "ribbon" ? baseSize * 0.58 : baseSize,
        color: colors[Math.floor(Math.random() * colors.length)] ?? "#ff5500",
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.16,
        tiltAngle: Math.random() * Math.PI * 2,
        tiltSpeed: 0.08 + Math.random() * 0.12,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.04 + Math.random() * 0.05,
        opacity: 1,
        shape,
        delayMs: Math.random() * 90,
      });
    }
  }

  const drawStar = (c: CanvasRenderingContext2D, radius: number) => {
    const spikes = 4;
    const outerRadius = radius;
    const innerRadius = radius * 0.42;
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;

    c.beginPath();
    c.moveTo(0, -outerRadius);
    for (let i = 0; i < spikes; i++) {
      c.lineTo(Math.cos(rot) * outerRadius, Math.sin(rot) * outerRadius);
      rot += step;
      c.lineTo(Math.cos(rot) * innerRadius, Math.sin(rot) * innerRadius);
      rot += step;
    }
    c.closePath();
    c.fill();
  };

  const startTime = performance.now();
  let lastTime = startTime;
  const totalDurationMs = 2800;

  function animate(now: number) {
    const elapsed = now - startTime;
    // Normalize step to 60fps (16.667ms) so 120Hz/144Hz displays animate at the exact same speed
    const dt = Math.min(2.5, Math.max(0.25, (now - lastTime) / 16.667));
    lastTime = now;

    ctx!.clearRect(0, 0, width, height);

    let activeCount = 0;

    for (const p of particles) {
      if (elapsed < p.delayMs) {
        activeCount++;
        continue;
      }

      const activeElapsed = elapsed - p.delayMs;

      // Air resistance & terminal velocity flutter
      const dragX = Math.pow(0.978, dt);
      const dragY = Math.pow(0.982, dt);
      const gravity = 0.28 * dt;

      p.vx *= dragX;
      p.vy = Math.min(5.2, p.vy * dragY + gravity);

      p.tiltAngle += p.tiltSpeed * dt;
      p.swayPhase += p.swaySpeed * dt;
      p.rotation += p.rotationSpeed * dt;

      // Gentle horizontal paper-flutter sway as particles descend
      const swayX = Math.sin(p.swayPhase) * 0.85 * dt;
      p.x += p.vx * dt + swayX;
      p.y += p.vy * dt;

      // Smooth fade out in the final second
      if (activeElapsed > 1550) {
        p.opacity = Math.max(0, 1 - (activeElapsed - 1550) / 1050);
      }

      if (p.opacity > 0.01 && p.y < height + 40) {
        activeCount++;
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rotation);

        // 3D tumble illusion by scaling Y with cos(tiltAngle)
        const scaleY = Math.cos(p.tiltAngle);
        ctx!.scale(1, Math.abs(scaleY) < 0.15 ? 0.15 : scaleY);

        ctx!.globalAlpha = p.opacity;
        ctx!.fillStyle = p.color;

        if (p.shape === "ribbon") {
          const rx = -p.width / 2;
          const ry = -p.height / 2;
          ctx!.beginPath();
          ctx!.roundRect(rx, ry, p.width, p.height, 2);
          ctx!.fill();
        } else if (p.shape === "circle") {
          ctx!.beginPath();
          ctx!.arc(0, 0, p.width * 0.45, 0, Math.PI * 2);
          ctx!.fill();
        } else {
          drawStar(ctx!, p.width * 0.6);
        }

        ctx!.restore();
      }
    }

    if (activeCount > 0 && elapsed < totalDurationMs) {
      requestAnimationFrame(animate);
    } else {
      window.removeEventListener("resize", updateCanvasSize);
      canvas.remove();
    }
  }

  window.addEventListener("resize", updateCanvasSize);
  requestAnimationFrame(animate);
}

