'use client';

import { useEffect, useRef } from 'react';

/**
 * The login emblem: a point-cloud globe with the recycling mark spelled out in
 * dots across its face.
 *
 * Drawn on a plain 2D canvas — no three.js, no WebGL, no SVG sprite. The whole
 * thing is a couple of KB, which matters on a PWA that people open on a phone
 * connection, and this box already builds at the edge of its disk.
 *
 * It is 3D in the way that counts: real points on a real sphere, rotated and
 * divided through by depth, so the silhouette and the parallax are genuine
 * rather than a looping animation of a globe. The mark itself is sampled out of
 * a glyph drawn once offscreen, so changing the emblem means changing a drawing
 * command, not hand-placing dots.
 */

interface Props {
  /** CSS pixels. The backing store is this times the device pixel ratio. */
  size?: number;
  className?: string;
}

/** Enough points to read as a surface, few enough for a cheap phone. */
const POINTS = 520;
const RINGS = 6;
const RING_STEPS = 40;
/** Grid spacing, in px, when sampling the glyph into dots. */
const SAMPLE_STEP = 5;

interface Pt { x: number; y: number; z: number }

/**
 * Fibonacci sphere: the cheap way to scatter points *evenly*. A lat/long grid
 * bunches everything at the poles, and the bunching is where the eye goes first.
 */
function sphere(n: number): Pt[] {
  const out: Pt[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = phi * i;
    out.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r });
  }
  return out;
}

function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * The three chasing arrows, stroked onto an offscreen canvas. Sampling this
 * rather than positioning dots by hand means the mark stays correct at any size.
 */
function drawRecycleGlyph(ctx: CanvasRenderingContext2D, size: number) {
  const c = size / 2;
  const r = size * 0.29;
  const w = size * 0.085;

  ctx.strokeStyle = '#fff';
  ctx.fillStyle = '#fff';
  ctx.lineWidth = w;
  ctx.lineCap = 'butt';

  for (let k = 0; k < 3; k++) {
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate((k * 2 * Math.PI) / 3);

    // Each arm is two thirds of the way round its third of the circle; the gap
    // left over is what makes the three arrows read as separate arrows.
    const a0 = -Math.PI / 2 + 0.30;
    const a1 = a0 + (2 * Math.PI) / 3 - 0.72;

    ctx.beginPath();
    ctx.arc(0, 0, r, a0, a1);
    ctx.stroke();

    // Arrowhead: a triangle on the tangent at the end of the arc.
    const hx = Math.cos(a1) * r;
    const hy = Math.sin(a1) * r;
    const tx = -Math.sin(a1);
    const ty = Math.cos(a1);
    const nx = Math.cos(a1);
    const ny = Math.sin(a1);
    const head = w * 1.5;

    ctx.beginPath();
    ctx.moveTo(hx + tx * head * 1.5, hy + ty * head * 1.5);
    ctx.lineTo(hx + nx * head, hy + ny * head);
    ctx.lineTo(hx - nx * head, hy - ny * head);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

/** Grid-sample the glyph's painted pixels into dot positions. */
function sampleGlyph(size: number): { x: number; y: number }[] {
  const off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  const ctx = off.getContext('2d');
  if (!ctx) return [];
  drawRecycleGlyph(ctx, size);

  const data = ctx.getImageData(0, 0, size, size).data;
  const dots: { x: number; y: number }[] = [];
  for (let y = 0; y < size; y += SAMPLE_STEP) {
    for (let x = 0; x < size; x += SAMPLE_STEP) {
      // Alpha of the pixel; anything painted at all counts.
      if (data[(y * size + x) * 4 + 3] > 90) dots.push({ x, y });
    }
  }
  return dots;
}

export default function EcoGlobe({ size = 210, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const pts = sphere(POINTS);
    const glyph = sampleGlyph(size);
    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.36;
    // Camera distance in sphere radii: close enough that the near face reads
    // bigger, far enough not to fish-eye.
    const CAM = 3.2;

    let theme = readTheme();
    function readTheme() {
      return {
        accent: cssVar('--pm-green', '#12805c'),
        soft: cssVar('--pm-green-soft', '#35b98a'),
        dot: cssVar('--pm-text-strong', '#10231c'),
      };
    }
    const themeObserver = new MutationObserver(() => { theme = readTheme(); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let spin = 0.4;
    let t = 0;
    let last = performance.now();
    let visible = true;

    // A canvas animating in a background tab is pure battery cost on a phone.
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);
    const onVisibility = () => { if (!document.hidden) last = performance.now(); };
    document.addEventListener('visibilitychange', onVisibility);

    function project(p: Pt, sin: number, cos: number, tiltS: number, tiltC: number) {
      const x1 = p.x * cos + p.z * sin;
      const z1 = -p.x * sin + p.z * cos;
      const y2 = p.y * tiltC - z1 * tiltS;
      const z2 = p.y * tiltS + z1 * tiltC;
      const k = CAM / (CAM + z2);
      return { sx: cx + x1 * R * k, sy: cy + y2 * R * k, depth: z2, k };
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);

      const sin = Math.sin(spin);
      const cos = Math.cos(spin);
      // A fixed tilt keeps the poles visible so the sphere never degenerates
      // into a flat spinning disc.
      const tiltS = Math.sin(-0.4);
      const tiltC = Math.cos(-0.4);

      /* ── latitude rings, faint ── */
      ctx.lineWidth = 1;
      ctx.strokeStyle = theme.dot;
      for (let r = 1; r < RINGS; r++) {
        const y = -1 + (2 * r) / RINGS;
        const rad = Math.sqrt(Math.max(0, 1 - y * y));
        for (let i = 0; i < RING_STEPS; i++) {
          const a0 = (i / RING_STEPS) * Math.PI * 2;
          const a1 = ((i + 1) / RING_STEPS) * Math.PI * 2;
          const p0 = project({ x: Math.cos(a0) * rad, y, z: Math.sin(a0) * rad }, sin, cos, tiltS, tiltC);
          const p1 = project({ x: Math.cos(a1) * rad, y, z: Math.sin(a1) * rad }, sin, cos, tiltS, tiltC);
          // The far side is drawn faintly — that is what sells a transparent
          // shell rather than a filled ball.
          ctx.globalAlpha = p0.depth < 0 ? 0.13 : 0.05;
          ctx.beginPath();
          ctx.moveTo(p0.sx, p0.sy);
          ctx.lineTo(p1.sx, p1.sy);
          ctx.stroke();
        }
      }

      /* ── the sphere's own points, far half first ── */
      for (const pass of [1, -1]) {
        for (const p of pts) {
          const pr = project(p, sin, cos, tiltS, tiltC);
          if (pass === 1 ? pr.depth < 0 : pr.depth >= 0) continue;
          const back = pr.depth >= 0;
          ctx.globalAlpha = back ? 0.10 : 0.26;
          ctx.fillStyle = theme.dot;
          ctx.beginPath();
          ctx.arc(pr.sx, pr.sy, (back ? 0.8 : 1.2) * pr.k, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* ── the mark, in dots, sitting on the near face ── */
      for (let i = 0; i < glyph.length; i++) {
        const g = glyph[i];
        // A slow wave across the mark rather than a uniform blink: it reads as
        // material catching light, and it never obscures the shape.
        const wave = Math.sin(t * 1.6 - (g.x + g.y) * 0.035);
        const lift = 0.5 + 0.5 * wave;
        ctx.globalAlpha = 0.55 + lift * 0.45;
        ctx.fillStyle = lift > 0.6 ? theme.soft : theme.accent;
        ctx.beginPath();
        ctx.arc(g.x, g.y, 1.5 + lift * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      /* ── halo ── */
      ctx.globalAlpha = 1;
      const glow = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.45);
      glow.addColorStop(0, withAlpha(theme.accent, 0.14));
      glow.addColorStop(1, withAlpha(theme.accent, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);
      ctx.globalAlpha = 1;
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      // Clamped, so returning from a background tab does not teleport the spin.
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible || document.hidden) return;
      spin += dt * 0.22;
      t += dt;
      draw();
    }

    if (reduced) draw();
    else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: size, height: size, display: 'block' }}
      role="img"
      aria-label="نشان بازیافت روی کرهٔ زمین"
    />
  );
}

/** Applies an alpha to a colour that may be hex or `rgb()` — both occur here. */
function withAlpha(color: string, a: number): string {
  const c = color.trim();
  if (c.startsWith('#')) {
    const hex = c.length === 4 ? c.slice(1).split('').map((ch) => ch + ch).join('') : c.slice(1, 7);
    const n = parseInt(hex, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }
  const nums = c.match(/[\d.]+/g);
  if (nums && nums.length >= 3) return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${a})`;
  return c;
}
