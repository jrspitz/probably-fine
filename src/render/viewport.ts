export class Viewport {
  canvas: HTMLCanvasElement;
  cScale = 1.0;
  simHeight = 1.0;
  simWidth = 1.0;

  static readonly MAX_CANVAS_WIDTH = 1600;
  static readonly CANVAS_BORDER_TOTAL = 4; // 2px inline border on each side

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.resize();
  }

  resize(): { simWidth: number; simHeight: number } {
    this.canvas.width = Math.max(
      50,
      Math.min(window.innerWidth, Viewport.MAX_CANVAS_WIDTH) -
        Viewport.CANVAS_BORDER_TOTAL,
    );
    this.canvas.height = Math.max(
      50,
      window.innerHeight - 20 - Viewport.CANVAS_BORDER_TOTAL,
    );

    this.simHeight = 1.0;
    this.cScale = this.canvas.height / this.simHeight;
    this.simWidth = this.canvas.width / this.cScale;

    return { simWidth: this.simWidth, simHeight: this.simHeight };
  }

  toScreenX(x: number): number {
    return x * this.cScale;
  }

  toScreenY(y: number): number {
    return this.canvas.height - y * this.cScale;
  }

  clientToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const bounds = this.canvas.getBoundingClientRect();
    const mx = clientX - bounds.left - this.canvas.clientLeft;
    const my = clientY - bounds.top - this.canvas.clientTop;
    return {
      x: mx / this.cScale,
      y: (this.canvas.height - my) / this.cScale,
    };
  }
}
