import type { Scene, BackgroundMode } from "../scene";

export interface SettingsMenuCallbacks {
  onStepSimulation: () => void;
  onBackgroundChange: (mode: BackgroundMode) => void;
}

export class SettingsMenu {
  private scene: Scene;
  private callbacks: SettingsMenuCallbacks;
  private settingsButton: HTMLButtonElement;
  private settingsMenu: HTMLElement;

  constructor(scene: Scene, callbacks: SettingsMenuCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.settingsButton = document.getElementById(
      "settingsButton",
    ) as HTMLButtonElement;
    this.settingsMenu = document.getElementById("settingsMenu") as HTMLElement;

    this.setupListeners();
  }

  setSettingsOpen(open: boolean): void {
    this.settingsMenu.classList.toggle("open", open);
    this.settingsButton.setAttribute("aria-expanded", String(open));
  }

  private setupListeners(): void {
    this.settingsButton.addEventListener("click", () => {
      this.setSettingsOpen(!this.settingsMenu.classList.contains("open"));
    });

    document.addEventListener("click", (event) => {
      const target = event.target as Node;
      if (
        this.settingsMenu.classList.contains("open") &&
        !this.settingsMenu.contains(target) &&
        !this.settingsButton.contains(target)
      ) {
        this.setSettingsOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "p":
          this.scene.paused = !this.scene.paused;
          break;
        case "m":
          this.scene.paused = false;
          this.callbacks.onStepSimulation();
          this.scene.paused = true;
          break;
        case "Escape":
          this.setSettingsOpen(false);
          break;
      }
    });

    const burningFloor = document.getElementById(
      "burningFloor",
    ) as HTMLInputElement | null;
    burningFloor?.addEventListener("change", (event) => {
      this.scene.burningFloor = (event.target as HTMLInputElement).checked;
    });

    const burningObstacle = document.getElementById(
      "burningObstacle",
    ) as HTMLInputElement | null;
    burningObstacle?.addEventListener("change", (event) => {
      this.scene.burningObstacle = (event.target as HTMLInputElement).checked;
    });

    const swirlButton = document.getElementById(
      "swirlButton",
    ) as HTMLInputElement | null;
    swirlButton?.addEventListener("change", (event) => {
      this.scene.showSwirls = (event.target as HTMLInputElement).checked;
    });

    const tempLegendToggle = document.getElementById(
      "tempLegendToggle",
    ) as HTMLInputElement | null;
    tempLegendToggle?.addEventListener("change", (event) => {
      this.scene.showTemperatureLegend = (
        event.target as HTMLInputElement
      ).checked;
    });

    document
      .querySelectorAll('input[name="background"]')
      .forEach((el) => {
        el.addEventListener("change", (event) => {
          const mode = (event.target as HTMLInputElement)
            .value as BackgroundMode;
          this.scene.background = mode;
          this.callbacks.onBackgroundChange(mode);
        });
      });

    const probabilitySlider = document.getElementById(
      "probabilitySlider",
    ) as HTMLInputElement | null;
    probabilitySlider?.addEventListener("input", (event) => {
      this.scene.swirlProbability = parseFloat(
        (event.target as HTMLInputElement).value,
      );
    });
  }
}
