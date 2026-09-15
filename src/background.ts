import bgUrl from "./assets/placeholderbg.jpeg";
import type { BackgroundMode } from "./scene";

export function applyBackground(
  canvas: HTMLCanvasElement,
  mode: BackgroundMode,
): void {
  canvas.classList.toggle("bg-checkers", mode === "checkers");
  canvas.classList.toggle("bg-image", mode === "image");
  canvas.style.backgroundImage = mode === "image" ? `url(${bgUrl})` : "";
}
