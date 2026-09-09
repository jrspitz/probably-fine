export interface CupDims {
  w: number;
  h: number;
  wall: number;
}

export function cupHandle(dims: CupDims) {
  const rx = 0.225 * dims.w;
  const ry = 0.25 * dims.h;
  return { cx: dims.w / 2 + rx, cy: 0.01, rx, ry };
}

export function isCupWall(
  dx: number,
  dy: number,
  dims: CupDims,
  pad = 0,
): boolean {
  const hw = dims.w / 2;
  const hh = dims.h / 2;
  const wt = dims.wall;

  const inBox = (cx: number, cy: number, hx: number, hy: number) =>
    Math.abs(dx - cx) <= hx + pad && Math.abs(dy - cy) <= hy + pad;

  // left + right walls (full height, open top), bottom wall
  if (inBox(-hw + wt / 2, 0, wt / 2, hh)) return true;
  if (inBox(hw - wt / 2, 0, wt / 2, hh)) return true;
  if (inBox(0, -hh + wt / 2, hw, wt / 2)) return true;

  // handle: elliptical ring on the +x side
  const hd = cupHandle(dims);
  const r = Math.sqrt(
    ((dx - hd.cx) / hd.rx) ** 2 + ((dy - hd.cy) / hd.ry) ** 2,
  );
  if (Math.abs(r - 1) * Math.min(hd.rx, hd.ry) <= wt / 2 + pad) return true;

  return false;
}
