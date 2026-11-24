/* Trazos a mano: generadores con temblor (jitter) y semilla fija para que siempre queden igual. */

export type Pt = [number, number];

let seed = 11;
export const setSeed = (n: number) => { seed = n; };
export const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export const jit = (a: number) => (rnd() - 0.5) * a;
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Catmull-Rom → segmentos Bézier cúbicos [p1, c1, c2, p2], redondeados como en el path. */
export function bezierSegments(P: Pt[]): [Pt, Pt, Pt, Pt][] {
  const r = (v: number) => +v.toFixed(1);
  const segs: [Pt, Pt, Pt, Pt][] = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
    segs.push([
      [r(p1[0]), r(p1[1])],
      [r(p1[0] + (p2[0] - p0[0]) / 6), r(p1[1] + (p2[1] - p0[1]) / 6)],
      [r(p2[0] - (p3[0] - p1[0]) / 6), r(p2[1] - (p3[1] - p1[1]) / 6)],
      [r(p2[0]), r(p2[1])],
    ]);
  }
  return segs;
}

/** Catmull-Rom → Bézier */
export function smooth(P: Pt[]): string {
  if (P.length < 2) return '';
  let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

export const lines = (P: Pt[]) => P.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');

export const SH = {
  ellipse(cx: number, cy: number, rx: number, ry: number, turns = 1.15): string {
    const P: Pt[] = [], a0 = -2.3, n = Math.round(22 * turns);
    for (let i = 0; i <= n; i++) {
      const a = a0 + i / n * turns * Math.PI * 2, g = 1 + i / n * 0.08;
      P.push([cx + Math.cos(a) * rx * g + jit(2), cy + Math.sin(a) * ry * g + jit(2)]);
    }
    return smooth(P);
  },
  crown(x: number, y: number, w: number, h: number): string {
    const P = ([[x, y], [x + w * 0.06, y - h * 0.95], [x + w * 0.3, y - h * 0.42], [x + w * 0.5, y - h * 1.12], [x + w * 0.7, y - h * 0.42], [x + w * 0.94, y - h * 0.95], [x + w, y], [x + w * 0.02, y + 2]] as Pt[])
      .map(p => [p[0] + jit(2.5), p[1] + jit(2.5)] as Pt);
    return lines(P);
  },
  heart(cx: number, cy: number, s: number): string {
    const P: Pt[] = [];
    for (let i = 0; i <= 26; i++) {
      const t = i / 26 * Math.PI * 2 + 0.15;
      P.push([cx + 16 * Math.sin(t) ** 3 * s / 32 + jit(0.8), cy - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s / 32 + jit(0.8)]);
    }
    return smooth(P);
  },
  star(cx: number, cy: number, r: number, k = 7): string {
    const P: Pt[] = [];
    for (let i = 0; i <= k * 2; i++) {
      const a = i / (k * 2) * Math.PI * 2 - Math.PI / 2, R = i % 2 ? r * (0.3 + rnd() * 0.12) : r * (0.75 + rnd() * 0.5);
      P.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
    }
    return lines(P);
  },
  arrow(x1: number, y1: number, x2: number, y2: number, bend = 20): string {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, cx = mx + nx * bend, cy = my + ny * bend;
    const P: Pt[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      P.push([(1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t * t * x2 + jit(1.2), (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t * t * y2 + jit(1.2)]);
    }
    const ang = Math.atan2(y2 - cy, x2 - cx), h = 11;
    return smooth(P) + ` M${(x2 - h * Math.cos(ang - 0.5)).toFixed(1)} ${(y2 - h * Math.sin(ang - 0.5)).toFixed(1)} L${x2} ${y2} L${(x2 - h * Math.cos(ang + 0.5)).toFixed(1)} ${(y2 - h * Math.sin(ang + 0.5)).toFixed(1)}`;
  },
  bubble(cx: number, cy: number, w: number, h: number, tx: number, ty: number): string {
    const a1 = Math.atan2(ty - cy, tx - cx), P: Pt[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = a1 + 0.3 + i / 24 * (Math.PI * 2 - 0.6);
      P.push([cx + Math.cos(a) * w / 2 + jit(1.5), cy + Math.sin(a) * h / 2 + jit(1.5)]);
    }
    return smooth(P) + ` L${tx} ${ty} L${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
  },
  sun(cx: number, cy: number, r: number): string {
    let d = SH.ellipse(cx, cy, r, r, 1.05);
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2 + jit(0.2);
      d += ` M${(cx + Math.cos(a) * (r + 6)).toFixed(1)} ${(cy + Math.sin(a) * (r + 6)).toFixed(1)} L${(cx + Math.cos(a) * (r + 15 + jit(5))).toFixed(1)} ${(cy + Math.sin(a) * (r + 15 + jit(5))).toFixed(1)}`;
    }
    return d;
  },
  rect(w: number, h: number, pad = 4): string {
    const P: Pt[] = [[pad + jit(4), pad + jit(4)], [w - pad + jit(4), pad + jit(3)], [w - pad + jit(3), h - pad + jit(4)], [pad + jit(3), h - pad + jit(3)], [pad + 8 + jit(4), pad - 2 + jit(3)]];
    return lines(P);
  },
};

export type ShapeName = keyof typeof SH;
