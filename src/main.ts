import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="simControls">
    <input type = "checkbox" id = "burningFloor" checked> Floor
    <input type = "checkbox" id = "burningObstacle"> Ring
    <input type = "checkbox" id = "swirlButton"> Swirls
    <input type = "range" min = "0" max = "100" value = "50" id = "probabilitySlider" class = "slider"> Probability
  </div>
  <div class="canvas-wrap">
    <canvas id="myCanvas" style="border:2px solid"></canvas>
  </div>
  <div class="color-temp">Colors here</div>
`;

interface Scene {
  gravity: number;
  dt: number;
  numIters: number;
  frameNr: number;
  obstacleX: number;
  obstacleY: number;
  obstacleRadius: number;
  burningObstacle: boolean;
  burningFloor: boolean;
  paused: boolean;
  showObstacle: boolean;
  showSwirls: boolean;
  swirlProbability: number;
  swirlMaxRadius: number;
  fluid: Fluid | null;
}

const scene: Scene = {
  gravity: 0.0,
  dt: 1.0 / 60.0,
  numIters: 10,
  frameNr: 0,
  obstacleX: 0.0,
  obstacleY: 0.0,
  obstacleRadius: 0.2,
  burningObstacle: false, //true,
  burningFloor: true, // false,
  paused: false,
  showObstacle: false,
  showSwirls: false,
  swirlProbability: 50.0,
  swirlMaxRadius: 0.05,
  fluid: null,
};

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const c = canvas.getContext("2d")!;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 100;

canvas.focus();

let cScale = 1.0;

const U_FIELD = 0;
const V_FIELD = 1;
const T_FIELD = 2;

type FieldType = typeof U_FIELD | typeof V_FIELD | typeof T_FIELD;

// pretty sure this is a debug var
// let cnt = 0;

function cX(x: number) {
  return x * cScale;
}

function cY(y: number) {
  return canvas.height - y * cScale;
}

// ----------------- start of simulator ------------------------------

class Fluid {
  numX: number;
  numY: number;
  numCells: number;
  h: number;
  u: Float32Array;
  v: Float32Array;
  newU: Float32Array;
  newV: Float32Array;
  s: Float32Array;
  t: Float32Array;
  newT: Float32Array;
  numSwirls: number;
  maxSwirls: number;
  swirlGlobalTime: number;
  swirlX: Float32Array;
  swirlY: Float32Array;
  swirlOmega: Float32Array;
  swirlRadius: Float32Array;
  swirlTime: Float32Array;

  constructor(numX: number, numY: number, h: number) {
    this.numX = numX + 2;
    this.numY = numY + 2;
    this.numCells = this.numX * this.numY;
    this.h = h;
    this.u = new Float32Array(this.numCells);
    this.v = new Float32Array(this.numCells);
    this.newU = new Float32Array(this.numCells);
    this.newV = new Float32Array(this.numCells);
    this.s = new Float32Array(this.numCells);
    this.t = new Float32Array(this.numCells);
    this.newT = new Float32Array(this.numCells);
    this.t.fill(0.0);
    this.s.fill(1.0);

    this.numSwirls = 0;
    this.maxSwirls = 100;
    this.swirlGlobalTime = 0.0;
    this.swirlX = new Float32Array(this.maxSwirls);
    this.swirlY = new Float32Array(this.maxSwirls);
    this.swirlOmega = new Float32Array(this.maxSwirls);
    this.swirlRadius = new Float32Array(this.maxSwirls);
    this.swirlTime = new Float32Array(this.maxSwirls);
    this.swirlTime.fill(0.0);
  }

  integrate(dt: number, gravity: number) {
    const n = this.numY;
    for (let i = 1; i < this.numX; i++) {
      for (let j = 1; j < this.numY - 1; j++) {
        if (this.s[i * n + j] != 0.0 && this.s[i * n + j - 1] != 0.0)
          this.v[i * n + j] += gravity * dt;
      }
    }
  }

  solveIncompressibility(numIters: number) {
    const n = this.numY;
    const overRelaxation = 1.9;

    for (let iter = 0; iter < numIters; iter++) {
      for (let i = 1; i < this.numX - 1; i++) {
        for (let j = 1; j < this.numY - 1; j++) {
          if (this.s[i * n + j] == 0.0) continue;

          const sx0 = this.s[(i - 1) * n + j];
          const sx1 = this.s[(i + 1) * n + j];
          const sy0 = this.s[i * n + j - 1];
          const sy1 = this.s[i * n + j + 1];
          const neighborSum = sx0 + sx1 + sy0 + sy1;
          if (neighborSum == 0.0) continue;

          const div =
            this.u[(i + 1) * n + j] -
            this.u[i * n + j] +
            this.v[i * n + j + 1] -
            this.v[i * n + j];

          let p = -div / neighborSum;
          p *= overRelaxation;
          this.u[i * n + j] -= sx0 * p;
          this.u[(i + 1) * n + j] += sx1 * p;
          this.v[i * n + j] -= sy0 * p;
          this.v[i * n + j + 1] += sy1 * p;
        }
      }
    }
  }

  extrapolate() {
    const n = this.numY;
    for (let i = 0; i < this.numX; i++) {
      this.u[i * n + 0] = this.u[i * n + 1];
      this.u[i * n + this.numY - 1] = this.u[i * n + this.numY - 2];
    }
    for (let j = 0; j < this.numY; j++) {
      this.v[0 * n + j] = this.v[1 * n + j];
      this.v[(this.numX - 1) * n + j] = this.v[(this.numX - 2) * n + j];
    }
  }

  sampleField(x: number, y: number, field: FieldType) {
    const n = this.numY;
    const h = this.h;
    const h1 = 1.0 / h;
    const h2 = 0.5 * h;

    x = Math.max(Math.min(x, this.numX * h), h);
    y = Math.max(Math.min(y, this.numY * h), h);

    const fieldData: Record<
      FieldType,
      { f: Float32Array; dx: number; dy: number }
    > = {
      [U_FIELD]: { f: this.u, dx: 0, dy: h2 },
      [V_FIELD]: { f: this.v, dx: h2, dy: 0 },
      [T_FIELD]: { f: this.t, dx: h2, dy: h2 },
    };
    const { f, dx, dy } = fieldData[field];

    const x0 = Math.min(Math.floor((x - dx) * h1), this.numX - 1);
    const tx = (x - dx - x0 * h) * h1;
    const x1 = Math.min(x0 + 1, this.numX - 1);

    const y0 = Math.min(Math.floor((y - dy) * h1), this.numY - 1);
    const ty = (y - dy - y0 * h) * h1;
    const y1 = Math.min(y0 + 1, this.numY - 1);

    const sx = 1.0 - tx;
    const sy = 1.0 - ty;

    const val =
      sx * sy * f[x0 * n + y0] +
      tx * sy * f[x1 * n + y0] +
      tx * ty * f[x1 * n + y1] +
      sx * ty * f[x0 * n + y1];

    return val;
  }

  avgU(i: number, j: number) {
    const n = this.numY;
    const u =
      (this.u[i * n + j - 1] +
        this.u[i * n + j] +
        this.u[(i + 1) * n + j - 1] +
        this.u[(i + 1) * n + j]) *
      0.25;
    return u;
  }

  avgV(i: number, j: number) {
    const n = this.numY;
    const v =
      (this.v[(i - 1) * n + j] +
        this.v[i * n + j] +
        this.v[(i - 1) * n + j + 1] +
        this.v[i * n + j + 1]) *
      0.25;
    return v;
  }

  advectVel(dt: number) {
    this.newU.set(this.u);
    this.newV.set(this.v);

    const n = this.numY;
    const h = this.h;
    const h2 = 0.5 * h;

    for (let i = 1; i < this.numX; i++) {
      for (let j = 1; j < this.numY; j++) {
        // cnt++;

        // u component
        if (
          this.s[i * n + j] != 0.0 &&
          this.s[(i - 1) * n + j] != 0.0 &&
          j < this.numY - 1
        ) {
          let x = i * h;
          let y = j * h + h2;
          let u = this.u[i * n + j];
          const v = this.avgV(i, j);
          x = x - dt * u;
          y = y - dt * v;
          u = this.sampleField(x, y, U_FIELD);
          this.newU[i * n + j] = u;
        }
        // v component
        if (
          this.s[i * n + j] != 0.0 &&
          this.s[i * n + j - 1] != 0.0 &&
          i < this.numX - 1
        ) {
          let x = i * h + h2;
          let y = j * h;
          const u = this.avgU(i, j);
          let v = this.v[i * n + j];
          x = x - dt * u;
          y = y - dt * v;
          v = this.sampleField(x, y, V_FIELD);
          this.newV[i * n + j] = v;
        }
      }
    }

    this.u.set(this.newU);
    this.v.set(this.newV);
  }

  advectTemperature(dt: number) {
    this.newT.set(this.t);

    const n = this.numY;
    const h = this.h;
    const h2 = 0.5 * h;

    for (let i = 1; i < this.numX - 1; i++) {
      for (let j = 1; j < this.numY - 1; j++) {
        if (this.s[i * n + j] != 0.0) {
          const u = (this.u[i * n + j] + this.u[(i + 1) * n + j]) * 0.5;
          const v = (this.v[i * n + j] + this.v[i * n + j + 1]) * 0.5;
          const x = i * h + h2 - dt * u;
          const y = j * h + h2 - dt * v;

          this.newT[i * n + j] = this.sampleField(x, y, T_FIELD);
        }
      }
    }
    this.t.set(this.newT);
  }

  updateFire(dt: number) {
    const h = this.h;

    const swirlTimeSpan = 1.0;
    const swirlOmega = 20.0;
    const swirlDamping = 10.0 * dt;
    const swirlProbability = scene.swirlProbability * h * h;

    const fireCooling = 1.2 * dt;
    const smokeCooling = 0.3 * dt;
    const lift = 3.0;
    const acceleration = 6.0 * dt;
    const kernelRadius = scene.swirlMaxRadius;

    // update swirls

    const n = this.numY;
    const maxX = (this.numX - 1) * this.h;
    const maxY = (this.numY - 1) * this.h;

    // kill swirls

    let num = 0;
    for (let nr = 0; nr < this.numSwirls; nr++) {
      this.swirlTime[nr] -= dt;
      if (this.swirlTime[nr] > 0.0) {
        this.swirlTime[num] = this.swirlTime[nr];
        this.swirlX[num] = this.swirlX[nr];
        this.swirlY[num] = this.swirlY[nr];
        this.swirlOmega[num] = this.swirlOmega[nr];
        num++;
      }
    }
    this.numSwirls = num;

    // advect and modify velocity field

    for (let nr = 0; nr < this.numSwirls; nr++) {
      let x = this.swirlX[nr];
      let y = this.swirlY[nr];
      const swirlU = (1.0 - swirlDamping) * this.sampleField(x, y, U_FIELD);
      const swirlV = (1.0 - swirlDamping) * this.sampleField(x, y, V_FIELD);
      x += swirlU * dt;
      y += swirlV * dt;
      x = Math.min(Math.max(x, h), maxX);
      y = Math.min(Math.max(y, h), maxY);

      this.swirlX[nr] = x;
      this.swirlY[nr] = y;
      const omega = this.swirlOmega[nr];

      // update surrounding velocity field

      const x0 = Math.max(Math.floor((x - kernelRadius) / h), 0);
      const y0 = Math.max(Math.floor((y - kernelRadius) / h), 0);
      const x1 = Math.min(
        Math.floor((x + kernelRadius) / h) + 1,
        this.numX - 1,
      );
      const y1 = Math.min(
        Math.floor((y + kernelRadius) / h) + 1,
        this.numY - 1,
      );

      for (let i = x0; i <= x1; i++) {
        for (let j = y0; j <= y1; j++) {
          for (let dim = 0; dim < 2; dim++) {
            const vx = dim == 0 ? i * h : (i + 0.5) * h;
            const vy = dim == 0 ? (j + 0.5) * h : j * h;

            const rx = vx - x;
            const ry = vy - y;
            const r = Math.sqrt(rx * rx + ry * ry);

            if (r < kernelRadius) {
              let s = 1.0;
              if (r > 0.8 * kernelRadius) {
                s = 5.0 - (5.0 / kernelRadius) * r;
              }

              if (dim == 0) {
                const target = ry * omega + swirlU;
                const u = this.u[n * i + j];
                this.u[n * i + j] = (target - u) * s;
              } else {
                const target = -rx * omega + swirlV;
                const v = this.v[n * i + j];
                this.v[n * i + j] += (target - v) * s;
              }
            }
          }
        }
      }
    }

    // update temperatures

    const minR = 0.85 * scene.obstacleRadius;
    const maxR = scene.obstacleRadius + h;

    for (let i = 0; i < this.numX; i++) {
      for (let j = 0; j < this.numY; j++) {
        const t = this.t[i * n + j];

        const cooling = t < 0.3 ? smokeCooling : fireCooling;
        this.t[i * n + j] = Math.max(t - cooling, 0.0);
        const v = this.v[i * n + j];
        const targetV = t * lift;
        this.v[i * n + j] += (targetV - v) * acceleration;

        let numNewSwirls = 0;

        // obstacle burning
        if (scene.burningObstacle) {
          const dx = (i + 0.5) * this.h - scene.obstacleX;
          const dy = (j + 0.5) * this.h - scene.obstacleY - 3.0 * this.h;
          const d = dx * dx + dy * dy;
          if (minR * minR <= d && d < maxR * maxR) {
            this.t[i * n + j] = 1.0;
            if (Math.random() < 0.5 * swirlProbability) numNewSwirls++;
          }
        }

        // floor burning
        if (j < 4 && scene.burningFloor) {
          this.t[i * n + j] = 1.0;
          this.u[i * n + j] = 0.0;
          this.v[i * n + j] = 0.0;
          if (Math.random() < swirlProbability) numNewSwirls++;
        }

        for (let k = 0; k < numNewSwirls; k++) {
          if (this.numSwirls >= this.maxSwirls) break;
          const nr = this.numSwirls;
          this.swirlX[nr] = i * h;
          this.swirlY[nr] = j * h;
          this.swirlOmega[nr] = (-1.0 + 2.0 * Math.random()) * swirlOmega;
          this.swirlTime[nr] = swirlTimeSpan;
          this.numSwirls++;
        }
      }
    }

    // foo: maybe for obstacle

    // smooth temperatures

    for (let i = 1; i < this.numX - 1; i++) {
      for (let j = 1; j < this.numY - 1; j++) {
        const t = this.t[i * n + j];
        if (t == 1.0) {
          const avg =
            (this.t[(i - 1) * n + (j - 1)] +
              this.t[(i + 1) * n + (j - 1)] +
              this.t[(i + 1) * n + (j + 1)] +
              this.t[(i - 1) * n + (j + 1)]) *
            0.25;
          this.t[i * n + j] = avg;
        }
      }
    }
  }

  // ----------------- end of simulator ------------------------------

  simulate(dt: number, gravity: number, numIters: number) {
    this.integrate(dt, gravity);

    this.solveIncompressibility(numIters);
    this.extrapolate();
    this.advectVel(dt);
    this.advectTemperature(dt);
    this.updateFire(dt);
  }
}

function setupScene() {
  const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 20;

  const simHeight = 1.0;
  cScale = canvas.height / simHeight;
  const simWidth = canvas.width / cScale;

  const numCells = 100000;
  const h = Math.sqrt((simWidth * simHeight) / numCells);

  const numX = Math.floor(simWidth / h);
  const numY = Math.floor(simHeight / h);

  if (numX < numY) {
    scene.swirlProbability = 80.0;
    scene.swirlMaxRadius = 0.04;
  }

  scene.obstacleX = 0.5 * numX * h;
  scene.obstacleY = 0.3 * numY * h;
  scene.showObstacle = scene.burningObstacle;

  scene.fluid = new Fluid(numX, numY, h);
}

// draw -------------------------------------------------------

function getFireColor(val: number) {
  val = Math.min(Math.max(val, 0.0), 1.0);
  let r, g, b;

  if (val < 0.3) {
    const s = val / 0.3;
    r = 0.2 * s;
    g = 0.2 * s;
    b = 0.2 * s;
  } else if (val < 0.5) {
    const s = (val - 0.3) / 0.2;
    r = 0.2 + 0.8 * s;
    g = 0.1;
    b = 0.1;
  } else {
    const s = (val - 0.5) / 0.48;
    r = 1.0;
    g = s;
    b = 0.0;
  }
  return [255 * r, 255 * g, 255 * b, 255];
}

function draw() {
  c.clearRect(0, 0, canvas.width, canvas.height);

  c.fillStyle = "#FF0000";
  const f = scene.fluid!;
  const n = f.numY;

  const cellScale = 1.1;

  const h = f.h;

  const id = c.getImageData(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < f.numX; i++) {
    for (let j = 0; j < f.numY; j++) {
      const t = f.t[i * n + j];
      const color = getFireColor(t);

      const x = Math.floor(cX(i * h));
      const y = Math.floor(cY((j + 1) * h));
      const cx = Math.floor(cScale * cellScale * h) + 1;
      const cy = Math.floor(cScale * cellScale * h) + 1;

      const r = color[0];
      const g = color[1];
      const b = color[2];

      for (let yi = y; yi < y + cy; yi++) {
        let p = 4 * (yi * canvas.width + x);

        for (let xi = 0; xi < cx; xi++) {
          id.data[p++] = r;
          id.data[p++] = g;
          id.data[p++] = b;
          id.data[p++] = 255;
        }
      }
    }
  }

  c.putImageData(id, 0, 0);

  if (scene.showObstacle) {
    const r = scene.obstacleRadius + f.h;

    // scene.showPressure doesn't exist
    // if (scene.showPressure) c.fillStyle = "#000000";
    // else c.fillStyle = "#DDDDDD";
    // c.beginPath();
    // c.arc(
    // 	cX(scene.obstacleX), cY(scene.obstacleY), cScale * r, 0.0, 2.0 * Math.PI);
    // c.closePath();
    // c.fill();

    c.fillStyle = "#DDDDDD";
    c.lineWidth = 20.0;
    c.strokeStyle = "#404040";
    c.beginPath();
    c.arc(
      cX(scene.obstacleX),
      cY(scene.obstacleY),
      cScale * r,
      0.0,
      2.0 * Math.PI,
    );
    c.closePath();
    c.stroke();
    c.lineWidth = 1.0;
  }

  if (scene.showSwirls) {
    for (let i = 0; i < f.numSwirls; i++) {
      const x = f.swirlX[i];
      const y = f.swirlY[i];
      const r = scene.swirlMaxRadius;

      c.lineWidth = 1.0;
      c.strokeStyle = "#303030";
      c.beginPath();
      c.arc(cX(x), cY(y), cScale * r, 0.0, 2.0 * Math.PI);
      c.closePath();
      c.stroke();
      c.lineWidth = 1.0;
    }
  }
}

function setObstacle(x: number, y: number, reset: boolean) {
  let vx = 0.0;
  let vy = 0.0;

  if (!reset) {
    vx = (x - scene.obstacleX) / scene.dt;
    vy = (y - scene.obstacleY) / scene.dt;
  }

  scene.obstacleX = x;
  scene.obstacleY = y;
  scene.showObstacle = true;

  const r = scene.obstacleRadius;
  const f = scene.fluid!;
  const n = f.numY;

  for (let i = 1; i < f.numX - 2; i++) {
    for (let j = 1; j < f.numY - 2; j++) {
      f.s[i * n + j] = 1.0;

      const dx = (i + 0.5) * f.h - x;
      const dy = (j + 0.5) * f.h - y;

      const d2 = dx * dx + dy * dy;
      if (d2 < r * r) {
        // f.s[i*n + j] = 0.0;
        f.u[i * n + j] += 0.2 * vx;
        f.u[(i + 1) * n + j] += 0.2 * vx;
        f.v[i * n + j] += 0.2 * vy;
        f.v[i * n + j + 1] += 0.2 * vy;
      }
    }
  }
}

// interaction -------------------------------------------------------

let mouseDown = false;

function startDrag(x: number, y: number) {
  const bounds = canvas.getBoundingClientRect();

  const mx = x - bounds.left - canvas.clientLeft;
  const my = y - bounds.top - canvas.clientTop;
  mouseDown = true;

  x = mx / cScale;
  y = (canvas.height - my) / cScale;

  setObstacle(x, y, true);
}

function drag(x: number, y: number) {
  if (mouseDown) {
    const bounds = canvas.getBoundingClientRect();
    const mx = x - bounds.left - canvas.clientLeft;
    const my = y - bounds.top - canvas.clientTop;
    x = mx / cScale;
    y = (canvas.height - my) / cScale;
    setObstacle(x, y, false);
  }
}

function endDrag() {
  mouseDown = false;
}

function setupEventListeners() {
  canvas.addEventListener("mousedown", (event) => {
    startDrag(event.x, event.y);
  });

  canvas.addEventListener("mouseup", (_event) => {
    endDrag();
  });

  canvas.addEventListener("mousemove", (event) => {
    drag(event.x, event.y);
  });

  canvas.addEventListener("touchstart", (event) => {
    startDrag(event.touches[0].clientX, event.touches[0].clientY);
  });

  canvas.addEventListener("touchend", () => {
    endDrag();
  });

  canvas.addEventListener(
    "touchmove",
    (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      drag(event.touches[0].clientX, event.touches[0].clientY);
    },
    { passive: false },
  );

  document.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "p":
        scene.paused = !scene.paused;
        break;
      case "m":
        scene.paused = false;
        simulate();
        scene.paused = true;
        break;
    }
  });

  document.getElementById("burningFloor")!.addEventListener("change", (event) => {
    scene.burningFloor = (event.target as HTMLInputElement).checked;
  });

  document.getElementById("burningObstacle")!.addEventListener("change", (event) => {
    scene.burningObstacle = (event.target as HTMLInputElement).checked;
  });

  document.getElementById("swirlButton")!.addEventListener("change", (event) => {
    scene.showSwirls = (event.target as HTMLInputElement).checked;
  });

  document.getElementById("probabilitySlider")!.oninput = function () {
    scene.swirlProbability = parseFloat((this as HTMLInputElement).value);
  };

  let resizeTimer = 0;

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setupScene, 300);
  }

  document.body.addEventListener("resize", onResize);
}

// main -------------------------------------------------------
setupEventListeners();

function simulate() {
  if (!scene.paused && scene.fluid)
    scene.fluid.simulate(scene.dt, scene.gravity, scene.numIters);
  scene.frameNr++;
}

function update() {
  simulate();
  draw();
  requestAnimationFrame(update);
}

setupScene();

update();
