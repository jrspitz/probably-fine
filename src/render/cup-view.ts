import { cupHandle } from "../sim/obstacle";
import type { CupDims } from "../sim/types";

export interface CupView {
  toX: (x: number) => number;
  toY: (y: number) => number;
  scale: number; // px per sim unit (cScale)
  cellPx: number; // px per sim cell, for the heat-zone padding
}

export function drawCup(
  ctx: CanvasRenderingContext2D,
  view: CupView,
  ox: number,
  oy: number,
  dims: CupDims,
): void {
  const hw = dims.w / 2;
  const hh = dims.h / 2;
  const cScale = view.scale;

  ctx.save();
  const wallPx = Math.max(2, cScale * dims.wall);
  ctx.lineJoin = "round";

  // handle behind mug: single shaded band, no outline stroke.
  // Drawn first so the opaque mug base covers the left arc where it
  // would otherwise overlap the body.
  const hd = cupHandle(dims);
  ctx.beginPath();
  ctx.ellipse(
    view.toX(ox + hd.cx),
    view.toY(oy + hd.cy),
    cScale * hd.rx,
    cScale * hd.ry,
    0,
    0.0,
    2.0 * Math.PI,
  );
  const hcx = view.toX(ox + hd.cx);
  const hrx = cScale * hd.rx;
  const hgrad = ctx.createLinearGradient(hcx - hrx, 0, hcx + hrx, 0);
  hgrad.addColorStop(0, "#bdbdbd");
  hgrad.addColorStop(0.3, "#f2f2f2");
  hgrad.addColorStop(0.5, "#ffffff");
  hgrad.addColorStop(0.75, "#d9d9d9");
  hgrad.addColorStop(1, "#b0b0b0");
  ctx.strokeStyle = hgrad;
  ctx.lineWidth = wallPx;
  ctx.stroke();

  // opaque mug base with cylindrical shading (covers the background
  // behind the cup, plus the handle's left arc so it reads as attached
  // behind the body). Padded one cell beyond the physics dims so the
  // rounded bottom corners still cover the square heat zone.
  const padPx = view.cellPx;
  const bw = cScale * dims.w + 2 * padPx;
  const bh = cScale * dims.h + 2 * padPx;
  const bottomRadius = Math.min(bw, bh) * 0.15;
  const topRadius = Math.min(bw, bh) * 0.03;
  const x0 = view.toX(ox - hw) - padPx;
  const y0 = view.toY(oy + hh) - padPx;
  const grad = ctx.createLinearGradient(x0, 0, x0 + bw, 0);
  grad.addColorStop(0, "#cfcfcf");
  grad.addColorStop(0.18, "#f2f2f2");
  grad.addColorStop(0.38, "#ffffff");
  grad.addColorStop(0.62, "#f1f1f1");
  grad.addColorStop(0.85, "#d4d4d4");
  grad.addColorStop(1, "#bdbdbd");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x0, y0, bw, bh, [
    topRadius,
    topRadius,
    bottomRadius,
    bottomRadius,
  ]);
  ctx.fill();

  // mug label (raised half an em)
  ctx.fillStyle = "#222";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontPx = Math.max(10, cScale * dims.w * 0.26);
  ctx.font = `${fontPx}px Bangers, Impact, "Arial Black", sans-serif`;
  const halfEm = (0.5 * fontPx) / cScale;
  ctx.fillText("THIS IS", view.toX(ox), view.toY(oy + 0.02 + halfEm));
  ctx.fillText("FINE", view.toX(ox), view.toY(oy - 0.03 + halfEm));
  ctx.restore();
  ctx.lineWidth = 1.0;
}
