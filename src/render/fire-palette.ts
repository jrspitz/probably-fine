export function getFireColor(val: number): [number, number, number, number] {
  val = Math.min(Math.max(val, 0.0), 1.0);
  let r: number, g: number, b: number, a: number;

  if (val < 0.3) {
    const s = val / 0.3;
    r = 0.2 * s;
    g = 0.2 * s;
    b = 0.2 * s;
    a = 0.55 * s;
  } else if (val < 0.5) {
    const s = (val - 0.3) / 0.2;
    r = 0.2 + 0.8 * s;
    g = 0.1;
    b = 0.1;
    a = 0.55 + 0.15 * s;
  } else {
    const t = (val - 0.5) / 0.5;
    const s = t * t * (3 - 2 * t);
    r = 1.0;
    g = s;
    b = 0.0;
    a = 0.7 + 0.2 * s;
  }
  return [255 * r, 255 * g, 255 * b, 255 * a];
}
