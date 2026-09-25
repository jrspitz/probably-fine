import type { Viewport } from "../render/viewport";

export class DragControls {
  private canvas: HTMLCanvasElement;
  private viewport: Viewport;
  private onMoveObstacle: (x: number, y: number, isReset: boolean) => void;
  private isDragging = false;

  constructor(
    canvas: HTMLCanvasElement,
    viewport: Viewport,
    onMoveObstacle: (x: number, y: number, isReset: boolean) => void,
  ) {
    this.canvas = canvas;
    this.viewport = viewport;
    this.onMoveObstacle = onMoveObstacle;
    this.setupListeners();
  }

  private startDrag(clientX: number, clientY: number): void {
    this.isDragging = true;
    const pos = this.viewport.clientToWorld(clientX, clientY);
    this.onMoveObstacle(pos.x, pos.y, true);
  }

  private drag(clientX: number, clientY: number): void {
    if (!this.isDragging) return;
    const pos = this.viewport.clientToWorld(clientX, clientY);
    this.onMoveObstacle(pos.x, pos.y, false);
  }

  private endDrag(): void {
    this.isDragging = false;
  }

  private setupListeners(): void {
    this.canvas.addEventListener("mousedown", (e) => {
      this.startDrag(e.clientX, e.clientY);
    });

    window.addEventListener("mouseup", () => {
      this.endDrag();
    });

    this.canvas.addEventListener("mousemove", (e) => {
      this.drag(e.clientX, e.clientY);
    });

    this.canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length > 0) {
        this.startDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    });

    this.canvas.addEventListener("touchend", () => {
      this.endDrag();
    });

    this.canvas.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length > 0) {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.drag(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: false },
    );
  }
}
