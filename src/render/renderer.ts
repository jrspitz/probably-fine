import type { Viewport } from "./viewport";
import type { Fluid } from "../sim/fluid";
import type { Scene } from "../scene";
import { getFireColor } from "./fire-palette";
import { drawCup } from "./cup-view";

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  viewport: Viewport;

  constructor(canvas: HTMLCanvasElement, viewport: Viewport) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.viewport = viewport;
  }

  render(scene: Scene, fluid: Fluid): void {
    const { ctx, canvas, viewport } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const f = fluid;
    const n = f.numY;
    const cellScale = 1.1;
    const h = f.h;

    const id = ctx.getImageData(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < f.numX; i++) {
      for (let j = 0; j < f.numY; j++) {
        const t = f.t[i * n + j];
        const color = getFireColor(t);

        const x = Math.floor(viewport.toScreenX(i * h));
        const y = Math.floor(viewport.toScreenY((j + 1) * h));
        const cx = Math.floor(viewport.cScale * cellScale * h) + 1;
        const cy = Math.floor(viewport.cScale * cellScale * h) + 1;

        const r = color[0];
        const g = color[1];
        const b = color[2];
        const a = color[3];

        for (let yi = y; yi < y + cy; yi++) {
          let p = 4 * (yi * canvas.width + x);

          for (let xi = 0; xi < cx; xi++) {
            id.data[p++] = r;
            id.data[p++] = g;
            id.data[p++] = b;
            id.data[p++] = a;
          }
        }
      }
    }

    ctx.putImageData(id, 0, 0);

    if (scene.showObstacle) {
      drawCup(
        ctx,
        {
          toX: (x) => viewport.toScreenX(x),
          toY: (y) => viewport.toScreenY(y),
          scale: viewport.cScale,
          cellPx: viewport.cScale * h,
        },
        scene.obstacleX,
        scene.obstacleY,
        {
          w: scene.obstacleCupW,
          h: scene.obstacleCupH,
          wall: scene.obstacleWall,
        },
      );
    }

    if (scene.showSwirls) {
      for (let i = 0; i < f.numSwirls; i++) {
        const x = f.swirlX[i];
        const y = f.swirlY[i];
        const r = scene.swirlMaxRadius;

        ctx.lineWidth = 1.0;
        ctx.strokeStyle = "#303030";
        ctx.beginPath();
        ctx.arc(
          viewport.toScreenX(x),
          viewport.toScreenY(y),
          viewport.cScale * r,
          0.0,
          2.0 * Math.PI,
        );
        ctx.closePath();
        ctx.stroke();
      }
    }

    if (scene.showTemperatureLegend) {
      this.drawTemperatureLegend();
    }
  }

  drawTemperatureLegend(): void {
    const { ctx, canvas } = this;
    ctx.save();

    const margin = 12;
    const barW = Math.min(240, canvas.width - margin * 2);
    const barH = 14;
    const pad = 8;
    const panelW = barW + pad * 2;
    const panelH = barH + 22 + pad * 2;
    const px = margin;
    const py = canvas.height - margin - panelH;

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(px, py, panelW, panelH);

    const check = 7;
    for (let cy = 0; cy < barH; cy += check) {
      for (let cx = 0; cx < barW; cx += check) {
        ctx.fillStyle =
          (cx / check + cy / check) % 2 === 0 ? "#808080" : "#c0c0c0";
        ctx.fillRect(
          px + pad + cx,
          py + pad + cy,
          Math.min(check, barW - cx),
          Math.min(check, barH - cy),
        );
      }
    }

    for (let x = 0; x < barW; x++) {
      const color = getFireColor(x / (barW - 1));
      ctx.fillStyle = `rgba(${color[0] | 0},${color[1] | 0},${color[2] | 0},${color[3] / 255})`;
      ctx.fillRect(px + pad + x, py + pad, 1, barH);
    }

    ctx.fillStyle = "#fff";
    ctx.font = "11px monospace";
    ctx.textBaseline = "top";
    ctx.fillText("0", px + pad, py + pad + barH + 4);
    ctx.fillText("0.5", px + pad + barW / 2 - 8, py + pad + barH + 4);
    ctx.fillText("1", px + pad + barW - 6, py + pad + barH + 4);

    ctx.restore();
  }
}
