import type { FireConfig } from "./sim/types";

export type BackgroundMode = "none" | "checkers" | "image" | "video";

export interface Scene {
  gravity: number;
  dt: number;
  numIters: number;
  frameNr: number;
  obstacleX: number;
  obstacleY: number;
  obstacleCupW: number;
  obstacleCupH: number;
  obstacleWall: number;
  burningObstacle: boolean;
  burningFloor: boolean;
  paused: boolean;
  showObstacle: boolean;
  showSwirls: boolean;
  showTemperatureLegend: boolean;
  background: BackgroundMode;
  swirlProbability: number;
  swirlMaxRadius: number;
}

export function createDefaultScene(): Scene {
  return {
    gravity: 0.0,
    dt: 1.0 / 60.0,
    numIters: 10,
    frameNr: 0,
    obstacleX: 0.0,
    obstacleY: 0.0,
    obstacleCupW: 0.2,
    obstacleCupH: 0.24,
    obstacleWall: 0.025,
    burningObstacle: false,
    burningFloor: true,
    paused: false,
    showObstacle: true,
    showSwirls: false,
    showTemperatureLegend: false,
    background: "video",
    swirlProbability: 50.0,
    swirlMaxRadius: 0.05,
  };
}

export function getFireConfig(scene: Scene): FireConfig {
  return {
    burningFloor: scene.burningFloor,
    burningObstacle: scene.burningObstacle,
    obstacle: {
      x: scene.obstacleX,
      y: scene.obstacleY,
      dims: {
        w: scene.obstacleCupW,
        h: scene.obstacleCupH,
        wall: scene.obstacleWall,
      },
    },
    swirlProbability: scene.swirlProbability,
    swirlMaxRadius: scene.swirlMaxRadius,
  };
}

export const scene: Scene = createDefaultScene();