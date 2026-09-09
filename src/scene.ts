import type { Fluid } from "./fluid";

export interface Scene {
  gravity: number;
  dt: number;
  numIters: number;
  frameNr: number;
  obstacleX: number;
  obstacleY: number;
  obstacleHalfSize: number;
  burningObstacle: boolean;
  burningFloor: boolean;
  paused: boolean;
  showObstacle: boolean;
  showSwirls: boolean;
  swirlProbability: number;
  swirlMaxRadius: number;
  fluid: Fluid | null;
}

export const scene: Scene = {
  gravity: 0.0,
  dt: 1.0 / 60.0,
  numIters: 10,
  frameNr: 0,
  obstacleX: 0.0,
  obstacleY: 0.0,
  obstacleHalfSize: 0.1,
  burningObstacle: false, //true,
  burningFloor: true, // false,
  paused: false,
  showObstacle: false,
  showSwirls: false,
  swirlProbability: 50.0,
  swirlMaxRadius: 0.05,
  fluid: null,
};