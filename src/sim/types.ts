export interface CupDims {
  w: number;
  h: number;
  wall: number;
}

export interface ObstacleState {
  x: number;
  y: number;
  dims: CupDims;
}

export interface FireConfig {
  burningFloor: boolean;
  burningObstacle: boolean;
  obstacle?: ObstacleState;
  swirlProbability: number;
  swirlMaxRadius: number;
}

export const U_FIELD = 0;
export const V_FIELD = 1;
export const T_FIELD = 2;

export type FieldType = typeof U_FIELD | typeof V_FIELD | typeof T_FIELD;
