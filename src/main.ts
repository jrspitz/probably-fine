import "./style.css";
import "@fontsource/bangers";
import { Fluid } from "./sim/fluid";
import { Viewport } from "./render/viewport";
import { Renderer } from "./render/renderer";
import { DragControls } from "./ui/drag-controls";
import { SettingsMenu } from "./ui/settings-menu";
import { applyBackground } from "./background";
import { scene, getFireConfig } from "./scene";

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const viewport = new Viewport(canvas);
const renderer = new Renderer(canvas, viewport);

let fluid: Fluid | null = null;

function setupScene(): void {
  const { simWidth, simHeight } = viewport.resize();

  const numCells = 50000;
  const h = Math.sqrt((simWidth * simHeight) / numCells);

  const numX = Math.floor(simWidth / h);
  const numY = Math.floor(simHeight / h);

  if (numX < numY) {
    scene.swirlProbability = 80.0;
    scene.swirlMaxRadius = 0.04;
  }

  scene.obstacleX = 0.5 * numX * h;
  scene.obstacleY = 0.3 * numY * h;
  scene.showObstacle = true;

  fluid = new Fluid(numX, numY, h);
}

function moveObstacle(x: number, y: number, isReset: boolean): void {
  let vx = 0.0;
  let vy = 0.0;

  if (!isReset) {
    vx = (x - scene.obstacleX) / scene.dt;
    vy = (y - scene.obstacleY) / scene.dt;
  }

  scene.obstacleX = x;
  scene.obstacleY = y;
  scene.showObstacle = true;

  if (fluid) {
    fluid.applyObstacleImpulse(
      x,
      y,
      {
        w: scene.obstacleCupW,
        h: scene.obstacleCupH,
        wall: scene.obstacleWall,
      },
      vx,
      vy,
    );
  }
}

function simulate(): void {
  if (!scene.paused && fluid) {
    fluid.simulate(
      scene.dt,
      scene.gravity,
      scene.numIters,
      getFireConfig(scene),
    );
  }
  scene.frameNr++;
}

function update(): void {
  simulate();
  if (fluid) {
    renderer.render(scene, fluid);
  }
  requestAnimationFrame(update);
}

// Setup interactions and UI
new DragControls(canvas, viewport, moveObstacle);
new SettingsMenu(scene, {
  onStepSimulation: simulate,
  onBackgroundChange: (mode) => applyBackground(canvas, mode),
});

let resizeTimer = 0;
window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(setupScene, 300);
});

// Initialize
applyBackground(canvas, scene.background);
setupScene();
update();
