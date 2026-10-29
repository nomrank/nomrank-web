// Geometry for the rating plate: a 300×300 ring of 10 slices, each split in two for half-point scores.
// Angles are degrees clockwise from the top, where slice 1 starts.

// Rounded to 2 places: the server and the browser disagree in the last digits of sin/cos, and the markup must match.
const r2 = (n: number) => Math.round(n * 100) / 100;
export const point = (radius: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [r2(150 + radius * Math.sin(a)), r2(150 - radius * Math.cos(a))] as const;
};

// A ring segment between two angles, as an SVG path.
export function sector(a0: number, a1: number, outer: number, inner: number) {
  const [x0, y0] = point(outer, a0);
  const [x1, y1] = point(outer, a1);
  const [x2, y2] = point(inner, a1);
  const [x3, y3] = point(inner, a0);
  const big = a1 - a0 > 180 ? 1 : 0;
  return `M${x0} ${y0}A${outer} ${outer} 0 ${big} 1 ${x1} ${y1}L${x2} ${y2}A${inner} ${inner} 0 ${big} 0 ${x3} ${y3}Z`;
}

export const angleOf = (dx: number, dy: number) => (Math.atan2(dx, -dy) * 180) / Math.PI;

// The score under a pointer angle: 0.5 to 10 in half steps, each slice holding two (the first half of slice 1 is 0.5).
// While dragging, pass the current score as `prev` so crossing the top stops at 10 or 0.5 instead of wrapping round.
export function scoreAtAngle(deg: number, prev = 0) {
  const a = ((deg % 360) + 360) % 360;
  const v = Math.max(0.5, Math.ceil(a / 18) / 2);
  if (prev >= 9 && v <= 1.5) return 10;
  if (prev > 0 && prev <= 1.5 && v >= 9) return 0.5;
  return v;
}
