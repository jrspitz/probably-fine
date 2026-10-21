import bgUrl from "./assets/outpainted.jpeg";
import videoUrl from "./assets/animated.mp4";
import type { BackgroundMode } from "./scene";

const video = document.getElementById("bgVideo") as HTMLVideoElement | null;

if (video) {
  video.src = videoUrl;
}

export function applyBackground(
  canvas: HTMLCanvasElement,
  mode: BackgroundMode,
): void {
  const isVideo = mode === "video";

  canvas.classList.toggle("bg-checkers", mode === "checkers");
  canvas.classList.toggle("bg-image", mode === "image");
  canvas.classList.toggle("bg-video", isVideo);
  canvas.style.backgroundImage = mode === "image" ? `url(${bgUrl})` : "";

  if (video) {
    video.classList.toggle("visible", isVideo);
    if (isVideo) {
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }
}
