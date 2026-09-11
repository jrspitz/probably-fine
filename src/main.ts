import "./style.css";
import "@fontsource/bangers";
import { Fluid } from "./fluid";
import { cupHandle, isCupWall } from "./obstacle";
import { scene } from "./scene";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="canvas-wrap">
    <div class="settings">
      <button
        id="settingsButton"
        type="button"
        class="settings-button"
        aria-label="Settings"
        aria-expanded="false"
        aria-controls="settingsMenu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
      <div class="settings-menu" id="settingsMenu">
        <label class="setting"><input type = "checkbox" id = "burningFloor" checked>Hot Floor</label>
        <label class="setting"><input type = "checkbox" id = "burningObstacle">Hot Cup</label>
        <label class="setting"><input type = "checkbox" id = "swirlButton"> Swirls</label>
        <label class="setting"><input type = "checkbox" id = "tempLegendToggle"> Legend</label>
        <label class="setting"><input type = "checkbox" id = "checkerToggle"> Checker</label>
        <div class="setting"><label for = "probabilitySlider">Probability</label>
        <input type = "range" min = "0" max = "100" value = "50" id = "probabilitySlider" class = "slider"></div>
      </div>
    </div>
    <canvas id="myCanvas" style="border:2px solid"></canvas>
  </div>
`;

const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const c = canvas.getContext("2d")!;
const MAX_CANVAS_WIDTH = 1600;
const CANVAS_BORDER_TOTAL = 4; // 2px inline border on each side (see template)
canvas.width = Math.max(
  50,
  Math.min(window.innerWidth, MAX_CANVAS_WIDTH) - CANVAS_BORDER_TOTAL,
);
canvas.height = Math.max(50, window.innerHeight - 100 - CANVAS_BORDER_TOTAL);

canvas.focus();

let cScale = 1.0;

// pretty sure this is a debug var
// let cnt = 0;

function cX(x: number) {
  return x * cScale;
}

function cY(y: number) {
  return canvas.height - y * cScale;
}

function setupScene() {
  const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
  canvas.width = Math.max(
    50,
    Math.min(window.innerWidth, MAX_CANVAS_WIDTH) - CANVAS_BORDER_TOTAL,
  );
  canvas.height = Math.max(50, window.innerHeight - 20 - CANVAS_BORDER_TOTAL);

  const simHeight = 1.0;
  cScale = canvas.height / simHeight;
  const simWidth = canvas.width / cScale;

  // const numCells = 100000;
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

  scene.fluid = new Fluid(numX, numY, h);
}

// draw -------------------------------------------------------

function getFireColor(val: number) {
  val = Math.min(Math.max(val, 0.0), 1.0);
  let r, g, b, a;

  if (val < 0.3) {
    const s = val / 0.3;
    r = 0.2 * s;
    g = 0.2 * s;
    b = 0.2 * s;
    a = 0.55 * s;
  } else if (val < 0.5) {
    const s = (val - 0.3) / 0.2;
    r = 0.2 + 0.8 * s;
    g = 0.1;
    b = 0.1;
    a = 0.55 + 0.15 * s;
  } else {
    const t = (val - 0.5) / 0.5;
    const s = t * t * (3 - 2 * t);
    r = 1.0;
    g = s;
    b = 0.0;
    a = 0.7 + 0.2 * s;
  }
  return [255 * r, 255 * g, 255 * b, 255 * a];
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
      const a = color[3];

      for (let yi = y; yi < y + cy; yi++) {
        let p = 4 * (yi * canvas.width + x);

        for (let xi = 0; xi < cx; xi++) {
          id.data[p++] = r;
          id.data[p++] = g;
          id.data[p++] = b;
          id.data[p++] = a;
        }
      }
    }
  }

  c.putImageData(id, 0, 0);

  if (scene.showObstacle) {
    const dims = {
      w: scene.obstacleCupW,
      h: scene.obstacleCupH,
      wall: scene.obstacleWall,
    };
    const hw = dims.w / 2;
    const hh = dims.h / 2;
    const ox = scene.obstacleX;
    const oy = scene.obstacleY;

    c.save();
    const wallPx = Math.max(2, cScale * dims.wall);
    c.lineJoin = "round";

    // handle behind mug: dark outline pass + opaque fill pass.
    // Drawn first so the opaque mug base covers the left arc where it
    // would otherwise overlap the body.
    const hd = cupHandle(dims);
    c.beginPath();
    c.ellipse(
      cX(ox + hd.cx),
      cY(oy + hd.cy),
      cScale * hd.rx,
      cScale * hd.ry,
      0,
      0.0,
      2.0 * Math.PI,
    );
    c.strokeStyle = "#404040";
    c.lineWidth = wallPx + 4;
    c.stroke();
    c.beginPath();
    c.ellipse(
      cX(ox + hd.cx),
      cY(oy + hd.cy),
      cScale * hd.rx,
      cScale * hd.ry,
      0,
      0.0,
      2.0 * Math.PI,
    );
    const hcx = cX(ox + hd.cx);
    const hrx = cScale * hd.rx;
    const hgrad = c.createLinearGradient(hcx - hrx, 0, hcx + hrx, 0);
    hgrad.addColorStop(0, "#bdbdbd");
    hgrad.addColorStop(0.3, "#f2f2f2");
    hgrad.addColorStop(0.5, "#ffffff");
    hgrad.addColorStop(0.75, "#d9d9d9");
    hgrad.addColorStop(1, "#b0b0b0");
    c.strokeStyle = hgrad;
    c.lineWidth = wallPx;
    c.stroke();

    // opaque mug base with cylindrical shading (covers fluid/checker
    // behind the cup, plus the handle's left arc so it reads as attached
    // behind the body)
    const bw = cScale * dims.w;
    const bh = cScale * dims.h;
    const radius = Math.min(bw, bh) * 0.15;
    const x0 = cX(ox - hw);
    const y0 = cY(oy + hh);
    const grad = c.createLinearGradient(x0, 0, x0 + bw, 0);
    grad.addColorStop(0, "#cfcfcf");
    grad.addColorStop(0.18, "#f2f2f2");
    grad.addColorStop(0.38, "#ffffff");
    grad.addColorStop(0.62, "#f1f1f1");
    grad.addColorStop(0.85, "#d4d4d4");
    grad.addColorStop(1, "#bdbdbd");
    c.fillStyle = grad;
    c.beginPath();
    c.roundRect(x0, y0, bw, bh, radius);
    c.fill();

    // mug label (raised half an em)
    c.fillStyle = "#222";
    c.textAlign = "center";
    c.textBaseline = "middle";
    const fontPx = Math.max(10, cScale * dims.w * 0.26);
    c.font = `${fontPx}px Bangers, Impact, "Arial Black", sans-serif`;
    const halfEm = (0.5 * fontPx) / cScale;
    c.fillText("THIS IS", cX(ox), cY(oy + 0.02 + halfEm));
    c.fillText("FINE", cX(ox), cY(oy - 0.03 + halfEm));
    c.restore();
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

  if (scene.showTemperatureLegend) drawTemperatureLegend();
}

function drawTemperatureLegend() {
  c.save();

  const margin = 12;
  const barW = Math.min(240, canvas.width - margin * 2);
  const barH = 14;
  const pad = 8;
  const panelW = barW + pad * 2;
  const panelH = barH + 22 + pad * 2;
  const px = margin;
  const py = canvas.height - margin - panelH;

  c.fillStyle = "rgba(0,0,0,0.55)";
  c.fillRect(px, py, panelW, panelH);

  const check = 7;
  for (let cy = 0; cy < barH; cy += check) {
    for (let cx = 0; cx < barW; cx += check) {
      c.fillStyle = (cx / check + cy / check) % 2 === 0 ? "#808080" : "#c0c0c0";
      c.fillRect(
        px + pad + cx,
        py + pad + cy,
        Math.min(check, barW - cx),
        Math.min(check, barH - cy),
      );
    }
  }

  for (let x = 0; x < barW; x++) {
    const color = getFireColor(x / (barW - 1));
    c.fillStyle = `rgba(${color[0] | 0},${color[1] | 0},${color[2] | 0},${color[3] / 255})`;
    c.fillRect(px + pad + x, py + pad, 1, barH);
  }

  c.fillStyle = "#fff";
  c.font = "11px monospace";
  c.textBaseline = "top";
  c.fillText("0", px + pad, py + pad + barH + 4);
  c.fillText("0.5", px + pad + barW / 2 - 8, py + pad + barH + 4);
  c.fillText("1", px + pad + barW - 6, py + pad + barH + 4);

  c.restore();
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

  const dims = {
    w: scene.obstacleCupW,
    h: scene.obstacleCupH,
    wall: scene.obstacleWall,
  };
  const f = scene.fluid!;
  const n = f.numY;

  for (let i = 1; i < f.numX - 2; i++) {
    for (let j = 1; j < f.numY - 2; j++) {
      f.s[i * n + j] = 1.0;

      const dx = (i + 0.5) * f.h - x;
      const dy = (j + 0.5) * f.h - y;

      if (isCupWall(dx, dy, dims, f.h)) {
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
      case "Escape":
        setSettingsOpen(false);
        break;
    }
  });

  document
    .getElementById("burningFloor")!
    .addEventListener("change", (event) => {
      scene.burningFloor = (event.target as HTMLInputElement).checked;
    });

  document
    .getElementById("burningObstacle")!
    .addEventListener("change", (event) => {
      scene.burningObstacle = (event.target as HTMLInputElement).checked;
    });

  document
    .getElementById("swirlButton")!
    .addEventListener("change", (event) => {
      scene.showSwirls = (event.target as HTMLInputElement).checked;
    });

  document
    .getElementById("tempLegendToggle")!
    .addEventListener("change", (event) => {
      scene.showTemperatureLegend = (event.target as HTMLInputElement).checked;
    });

  document
    .getElementById("checkerToggle")!
    .addEventListener("change", (event) => {
      const checked = (event.target as HTMLInputElement).checked;
      scene.showCheckerboard = checked;
      canvas.classList.toggle("checker", checked);
    });

  document.getElementById("probabilitySlider")!.oninput = function () {
    scene.swirlProbability = parseFloat((this as HTMLInputElement).value);
  };

  const settingsButton = document.getElementById("settingsButton")!;
  const settingsMenu = document.getElementById("settingsMenu")!;

  function setSettingsOpen(open: boolean) {
    settingsMenu.classList.toggle("open", open);
    settingsButton.setAttribute("aria-expanded", String(open));
  }

  settingsButton.addEventListener("click", () =>
    setSettingsOpen(!settingsMenu.classList.contains("open")),
  );

  document.addEventListener("click", (event) => {
    if (
      settingsMenu.classList.contains("open") &&
      !settingsMenu.contains(event.target as Node) &&
      !settingsButton.contains(event.target as Node)
    ) {
      setSettingsOpen(false);
    }
  });

  let resizeTimer = 0;

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setupScene, 300);
  }

  window.addEventListener("resize", onResize);
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
