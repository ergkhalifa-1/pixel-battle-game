// Pixel Battle frontend prototype
// All pixels are stored in one ImageData object.
// Shape tools use beginner-friendly custom graphics algorithms.

const canvas = document.getElementById("pixelCanvas");
const context = canvas ? canvas.getContext("2d", { alpha: false }) : null;
const canvasStage = document.getElementById("canvasStage");
const coordX = document.getElementById("coordX");
const coordY = document.getElementById("coordY");
const zoomLabel = document.getElementById("zoomLabel");
const cooldownTime = document.getElementById("cooldownTime");
const cooldownProgress = document.getElementById("cooldownProgress");
const actionCountElement = document.getElementById("actionCount");
const activityList = document.getElementById("activityList");
const toastElement = document.getElementById("toast");

if (!canvas) {
  window.location.href = "welcome.html";
}

if (canvas) {
const CANVAS_SIZE = 128;
const imageData = context.createImageData(CANVAS_SIZE, CANVAS_SIZE);
let selectedColour = "#8B5CF6";
let selectedTool = "pen";
let selectedTeam = "Blue";
let playerUsername = "Nova";
const ownerGrid = new Uint8Array(CANVAS_SIZE * CANVAS_SIZE);
const replayFrames = [];
let actionCount = 128;
let zoom = 100;
let cooldownUntil = 0;
let lineStart = null;
let circleStart = null;
let polygonPoints = [];
let drawingWithPen = false;
let toastTimer = null;

const PROFILE_STORAGE_KEY = "pixelBattlePlayerProfile";

function getSavedProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY));
  } catch (error) {
    return null;
  }
}

function saveProfile() {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ username: playerUsername, team: selectedTeam }));
}

function getPlayerInitial() {
  return playerUsername.trim().charAt(0).toUpperCase() || "P";
}

function applyPlayerProfile() {
  const initial = getPlayerInitial();
  const teamClass = selectedTeam.toLowerCase();

  document.querySelectorAll(".player-avatar:not(.large)").forEach(avatar => { avatar.textContent = initial; });
  const largeAvatar = document.querySelector(".player-avatar.large");
  if (largeAvatar) largeAvatar.textContent = initial;

  document.querySelectorAll(".player-copy strong, .player-summary > div:last-child > strong").forEach(name => { name.textContent = playerUsername; });
  document.querySelectorAll(".team-dot").forEach(dot => { dot.className = `team-dot ${teamClass}`; });
  document.querySelectorAll(".player-copy span, .player-summary span").forEach(label => {
    label.innerHTML = `<i class="team-dot ${teamClass}"></i> Team ${selectedTeam}`;
  });

  document.querySelectorAll(".player-avatar").forEach(avatar => {
    avatar.style.background = selectedTeam === "Red"
      ? "linear-gradient(135deg, #ef5b67, #b91c1c)"
      : selectedTeam === "Green"
        ? "linear-gradient(135deg, #36d399, #15803d)"
        : "linear-gradient(135deg, #4f46e5, #22d3ee)";
  });
}

const palette = [
  "#FFFFFF", "#E2E8F0", "#94A3B8", "#475569", "#1E293B", "#090D18", "#EF4444", "#F97316",
  "#FACC15", "#22C55E", "#10B981", "#22D3EE", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899"
];

const toolNames = {
  pen: "Pixel Pen",
  line: "Line Tool",
  circle: "Circle Tool",
  polygon: "Polygon Fill",
  bucket: "Paint Bucket"
};

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.substring(0, 2), 16),
    g: parseInt(value.substring(2, 4), 16),
    b: parseInt(value.substring(4, 6), 16)
  };
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(value => value.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function rgbToHsb(r, g, b) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const difference = max - min;

  let hue = 0;
  if (difference !== 0) {
    if (max === red) hue = 60 * (((green - blue) / difference) % 6);
    if (max === green) hue = 60 * ((blue - red) / difference + 2);
    if (max === blue) hue = 60 * ((red - green) / difference + 4);
  }
  if (hue < 0) hue += 360;

  const saturation = max === 0 ? 0 : difference / max;
  return { h: Math.round(hue), s: Math.round(saturation * 100), b: Math.round(max * 100) };
}

function setPixel(x, y, colourHex, ownerTeam = null) {
  if (x < 0 || y < 0 || x >= CANVAS_SIZE || y >= CANVAS_SIZE) return;
  const rgb = hexToRgb(colourHex);
  const pixelIndex = y * CANVAS_SIZE + x;
  const dataIndex = pixelIndex * 4;
  imageData.data[dataIndex] = rgb.r;
  imageData.data[dataIndex + 1] = rgb.g;
  imageData.data[dataIndex + 2] = rgb.b;
  imageData.data[dataIndex + 3] = 255;

  if (ownerTeam) {
    ownerGrid[pixelIndex] = ownerTeam === "Red" ? 1 : ownerTeam === "Green" ? 3 : 2;
  } else {
    ownerGrid[pixelIndex] = 0;
  }
}

function recordReplayFrame() {
  replayFrames.push(new Uint8ClampedArray(imageData.data));
  if (replayFrames.length > 40) replayFrames.shift();
}

function getPixelColour(x, y) {
  if (x < 0 || y < 0 || x >= CANVAS_SIZE || y >= CANVAS_SIZE) return null;
  const index = (y * CANVAS_SIZE + x) * 4;
  return rgbToHex(imageData.data[index], imageData.data[index + 1], imageData.data[index + 2]);
}

function paintAll(colourHex) {
  for (let y = 0; y < CANVAS_SIZE; y++) {
    for (let x = 0; x < CANVAS_SIZE; x++) setPixel(x, y, colourHex, null);
  }
  ownerGrid.fill(0);
}

function renderCanvas() {
  context.putImageData(imageData, 0, 0);
}

// Bresenham line algorithm. Uses only setPixel for line pixels.
function bresenhamLine(x0, y0, x1, y1, colourHex) {
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;

  while (true) {
    setPixel(x0, y0, colourHex, selectedTeam);
    if (x0 === x1 && y0 === y1) break;
    const error2 = 2 * error;
    if (error2 >= dy) {
      error += dy;
      x0 += sx;
    }
    if (error2 <= dx) {
      error += dx;
      y0 += sy;
    }
  }
}

// Midpoint circle algorithm. Symmetry draws all eight pixel groups.
function midpointCircle(centerX, centerY, radius, colourHex) {
  let x = 0;
  let y = radius;
  let decision = 1 - radius;

  function drawCirclePoints(cx, cy, xPoint, yPoint) {
    setPixel(cx + xPoint, cy + yPoint, colourHex, selectedTeam);
    setPixel(cx - xPoint, cy + yPoint, colourHex, selectedTeam);
    setPixel(cx + xPoint, cy - yPoint, colourHex, selectedTeam);
    setPixel(cx - xPoint, cy - yPoint, colourHex, selectedTeam);
    setPixel(cx + yPoint, cy + xPoint, colourHex, selectedTeam);
    setPixel(cx - yPoint, cy + xPoint, colourHex, selectedTeam);
    setPixel(cx + yPoint, cy - xPoint, colourHex, selectedTeam);
    setPixel(cx - yPoint, cy - xPoint, colourHex, selectedTeam);
  }

  drawCirclePoints(centerX, centerY, x, y);
  while (x < y) {
    x++;
    if (decision < 0) {
      decision += 2 * x + 1;
    } else {
      y--;
      decision += 2 * (x - y) + 1;
    }
    drawCirclePoints(centerX, centerY, x, y);
  }
}

// Iterative flood fill avoids recursive stack overflow.
function floodFill(startX, startY, replacementHex) {
  const target = getPixelColour(startX, startY);
  if (target === replacementHex) return;

  const stack = [[startX, startY]];
  while (stack.length > 0) {
    const [x, y] = stack.pop();
    if (getPixelColour(x, y) !== target) continue;

    setPixel(x, y, replacementHex, selectedTeam);
    if (x > 0) stack.push([x - 1, y]);
    if (x + 1 < CANVAS_SIZE) stack.push([x + 1, y]);
    if (y > 0) stack.push([x, y - 1]);
    if (y + 1 < CANVAS_SIZE) stack.push([x, y + 1]);
  }
}

// Scan-line polygon fill: computes edge intersections for each horizontal row.
function scanlinePolygonFill(points, colourHex) {
  if (points.length < 3) return;

  let minimumY = CANVAS_SIZE;
  let maximumY = 0;
  points.forEach(point => {
    minimumY = Math.min(minimumY, point.y);
    maximumY = Math.max(maximumY, point.y);
  });

  for (let y = minimumY; y <= maximumY; y++) {
    const intersections = [];

    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const next = points[(i + 1) % points.length];
      if (current.y === next.y) continue;

      if (y >= Math.min(current.y, next.y) && y < Math.max(current.y, next.y)) {
        const x = current.x + ((y - current.y) * (next.x - current.x)) / (next.y - current.y);
        intersections.push(Math.round(x));
      }
    }

    intersections.sort((a, b) => a - b);
    for (let i = 0; i + 1 < intersections.length; i += 2) {
      for (let x = intersections[i]; x <= intersections[i + 1]; x++) {
        setPixel(x, y, colourHex, selectedTeam);
      }
    }
  }
}

function createSampleArtwork() {
  paintAll("#EEF2F7");

  // Dark pixel border
  for (let y = 18; y < 110; y++) {
    for (let x = 18; x < 110; x++) {
      if (x === 18 || x === 109 || y === 18 || y === 109) setPixel(x, y, "#172033");
    }
  }

  // Purple mountain/planet scene
  const purple = "#7C3AED";
  const cyan = "#22D3EE";
  const blue = "#3B82F6";
  const pink = "#EC4899";
  const gold = "#FBBF24";
  const navy = "#1E293B";

  for (let y = 32; y < 84; y++) {
    for (let x = 30; x < 98; x++) {
      if ((x - 64) * (x - 64) + (y - 58) * (y - 58) < 29 * 29) setPixel(x, y, "#DCE6F3");
    }
  }

  for (let y = 40; y < 95; y++) {
    for (let x = 38; x < 90; x++) {
      const peak = 76 - Math.abs(x - 64) / 2;
      if (y > peak && y < 96) setPixel(x, y, blue);
    }
  }

  scanlinePolygonFill([{x:42,y:78},{x:64,y:48},{x:86,y:78},{x:78,y:78},{x:64,y:61},{x:50,y:78}], purple);
  scanlinePolygonFill([{x:54,y:78},{x:64,y:57},{x:74,y:78},{x:69,y:78},{x:64,y:66},{x:59,y:78}], cyan);

  // Pixel sun and stars
  for (let y = 34; y <= 46; y++) {
    for (let x = 35; x <= 47; x++) {
      if ((x - 41) * (x - 41) + (y - 40) * (y - 40) <= 38) setPixel(x, y, gold);
    }
  }
  [[20,25],[92,28],[101,45],[31,55],[99,72],[29,89],[91,96],[52,27],[107,91]].forEach(([x,y]) => setPixel(x, y, navy));

  // Water and islands
  for (let y = 78; y < 106; y++) {
    for (let x = 20; x < 108; x++) {
      if ((x + y) % 13 === 0) setPixel(x, y, "#60A5FA");
      if ((x * 3 + y) % 29 === 0) setPixel(x, y, cyan);
    }
  }
  scanlinePolygonFill([{x:45,y:94},{x:64,y:84},{x:83,y:94},{x:76,y:103},{x:52,y:103}], navy);
  scanlinePolygonFill([{x:51,y:98},{x:64,y:89},{x:77,y:98},{x:73,y:101},{x:55,y:101}], pink);

  // Reflected highlights
  for (let x = 58; x < 70; x += 3) {
    setPixel(x, 106, pink);
    setPixel(x + 1, 107, cyan);
  }
}

function showToast(message) {
  toastElement.textContent = message;
  toastElement.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastElement.classList.remove("show"), 1800);
}

function startCooldown() {
  cooldownUntil = Date.now() + 5000;
  document.querySelector(".cooldown-stat")?.classList.add("active");
  updateCooldown();
}

function updateCooldown() {
  const remaining = Math.max(0, cooldownUntil - Date.now());
  if (remaining === 0) {
    cooldownTime.textContent = "Ready";
    cooldownTime.className = "ready";
    cooldownProgress.style.width = "100%";
    cooldownProgress.style.background = "var(--green)";
    document.querySelector(".cooldown-stat")?.classList.remove("active");
    return;
  }

  const seconds = (remaining / 1000).toFixed(1);
  cooldownTime.textContent = `${seconds}s`;
  cooldownTime.className = "counting";
  cooldownProgress.style.width = `${remaining / 50}%`;
  cooldownProgress.style.background = "var(--purple)";
  requestAnimationFrame(updateCooldown);
}

function canPerformAction() {
  if (Date.now() < cooldownUntil) {
    showToast("Cooldown active. Please wait.");
    return false;
  }
  startCooldown();
  actionCount++;
  actionCountElement.textContent = actionCount;
  return true;
}

function addActivity(message, initial, className) {
  const item = document.createElement("div");
  item.className = "activity-item";
  item.innerHTML = `<span class="activity-avatar ${className}">${initial}</span><div><p>${message}</p><time>just now</time></div>`;
  activityList.prepend(item);
  while (activityList.children.length > 3) activityList.lastElementChild.remove();
}

function updateColour(colour) {
  selectedColour = colour.toUpperCase();
  const rgb = hexToRgb(selectedColour);
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  document.querySelectorAll(".swatch").forEach(swatch => {
    swatch.classList.toggle("selected", swatch.dataset.colour === selectedColour);
  });
  document.getElementById("selectedTag").textContent = selectedColour;
  document.getElementById("rgbValue").textContent = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
  document.getElementById("hexValue").textContent = selectedColour;
  document.getElementById("hsbValue").textContent = `${hsb.h}°, ${hsb.s}%, ${hsb.b}%`;
}

function buildPalette() {
  const grid = document.getElementById("colourGrid");
  palette.forEach(colour => {
    const button = document.createElement("button");
    button.className = "swatch";
    button.type = "button";
    button.dataset.colour = colour;
    button.style.background = colour;
    button.style.setProperty("--swatch", colour);
    button.setAttribute("aria-label", `Select ${colour}`);
    button.addEventListener("click", () => updateColour(colour));
    grid.appendChild(button);
  });
  updateColour(selectedColour);
}

function getCanvasCoordinates(event) {
  const rect = canvas.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;
  const x = Math.floor(((clientX - rect.left) / rect.width) * CANVAS_SIZE);
  const y = Math.floor(((clientY - rect.top) / rect.height) * CANVAS_SIZE);
  return { x: Math.max(0, Math.min(CANVAS_SIZE - 1, x)), y: Math.max(0, Math.min(CANVAS_SIZE - 1, y)) };
}

function setZoom(nextZoom) {
  zoom = Math.max(100, Math.min(200, nextZoom));
  const baseSize = window.innerWidth <= 500 ? 320 : window.innerWidth <= 720 ? 390 : window.innerWidth <= 1180 ? 430 : 512;
  canvasStage.style.width = `${Math.round(baseSize * zoom / 100)}px`;
  canvasStage.style.height = `${Math.round(baseSize * zoom / 100)}px`;
  zoomLabel.textContent = `${zoom}%`;
  canvasStage.classList.toggle("grid-visible", zoom >= 150);
}

function updatePixelSelection(point) {
  coordX.textContent = point.x.toString().padStart(3, "0");
  coordY.textContent = point.y.toString().padStart(3, "0");

  const selection = document.getElementById("pixelSelection");
  selection.classList.add("visible");
  selection.style.left = `${(point.x / CANVAS_SIZE) * 100}%`;
  selection.style.top = `${(point.y / CANVAS_SIZE) * 100}%`;

  const ownerValue = ownerGrid[point.y * CANVAS_SIZE + point.x];
  const ownerChip = document.getElementById("pixelOwner");
  ownerChip.className = "owner-chip";
  if (ownerValue === 1) {
    ownerChip.classList.add("red");
    ownerChip.lastChild.textContent = " Red";
  } else if (ownerValue === 2) {
    ownerChip.classList.add("blue");
    ownerChip.lastChild.textContent = " Blue";
  } else if (ownerValue === 3) {
    ownerChip.classList.add("green");
    ownerChip.lastChild.textContent = " Green";
  } else {
    ownerChip.lastChild.textContent = " Unclaimed";
  }
}

canvas.addEventListener("pointermove", event => {
  const point = getCanvasCoordinates(event);
  updatePixelSelection(point);

  if (drawingWithPen && selectedTool === "pen") {
    if (canPerformAction()) {
      setPixel(point.x, point.y, selectedColour, selectedTeam);
      renderCanvas();
      updatePixelSelection(point);
      recordReplayFrame();
    }
  }
});

canvas.addEventListener("pointerleave", () => {
  coordX.textContent = "--";
  coordY.textContent = "--";
});

canvas.addEventListener("pointerdown", event => {
  event.preventDefault();
  try {
    canvas.setPointerCapture?.(event.pointerId);
  } catch (error) {
    // Synthetic events may not have an active pointer to capture.
  }
  const point = getCanvasCoordinates(event);

  if (selectedTool === "pen") {
    drawingWithPen = true;
    updatePixelSelection(point);
    if (!canPerformAction()) return;
    setPixel(point.x, point.y, selectedColour, selectedTeam);
    renderCanvas();
    updatePixelSelection(point);
    recordReplayFrame();
  } else if (selectedTool === "bucket") {
    if (!canPerformAction()) return;
    floodFill(point.x, point.y, selectedColour);
    renderCanvas();
    recordReplayFrame();
    updatePixelSelection(point);
    addActivity(`<strong>You</strong> filled an area`, "N", "blue-avatar");
  } else if (selectedTool === "line") {
    if (!lineStart) {
      lineStart = point;
      showToast(`Line start set at ${point.x}, ${point.y}`);
    } else {
      if (!canPerformAction()) return;
      bresenhamLine(lineStart.x, lineStart.y, point.x, point.y, selectedColour);
      renderCanvas();
      recordReplayFrame();
      updatePixelSelection(point);
      lineStart = null;
      addActivity(`<strong>You</strong> drew a line`, "N", "blue-avatar");
    }
  } else if (selectedTool === "circle") {
    if (!circleStart) {
      circleStart = point;
      showToast(`Circle centre set at ${point.x}, ${point.y}`);
    } else {
      if (!canPerformAction()) return;
      const radius = Math.round(Math.sqrt((point.x - circleStart.x) ** 2 + (point.y - circleStart.y) ** 2));
      midpointCircle(circleStart.x, circleStart.y, radius, selectedColour);
      renderCanvas();
      recordReplayFrame();
      updatePixelSelection(point);
      circleStart = null;
      addActivity(`<strong>You</strong> drew a circle`, "N", "blue-avatar");
    }
  } else if (selectedTool === "polygon") {
    if (!canPerformAction()) return;
    polygonPoints.push(point);
    setPixel(point.x, point.y, selectedColour);
    renderCanvas();
    showToast(`${polygonPoints.length} polygon point${polygonPoints.length === 1 ? "" : "s"}; double-click to fill`);
  }
});

canvas.addEventListener("pointerup", () => {
  drawingWithPen = false;
});

canvas.addEventListener("dblclick", event => {
  if (selectedTool !== "polygon" || polygonPoints.length < 3) return;
  event.preventDefault();
  if (!canPerformAction()) return;
  scanlinePolygonFill(polygonPoints, selectedColour);
  renderCanvas();
  recordReplayFrame();
  polygonPoints = [];
  addActivity(`<strong>You</strong> filled a polygon`, "N", "blue-avatar");
});

canvas.addEventListener("contextmenu", event => event.preventDefault());

const toolButtons = document.querySelectorAll(".tool-button");
toolButtons.forEach(button => {
  button.addEventListener("click", () => {
    toolButtons.forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    selectedTool = button.dataset.tool;
    document.getElementById("canvasMode").textContent = toolNames[selectedTool];
    lineStart = null;
    circleStart = null;
    polygonPoints = [];
  });
});

const teamCards = document.querySelectorAll(".team-card");
teamCards.forEach(card => {
  card.addEventListener("click", () => {
    teamCards.forEach(item => item.classList.remove("selected"));
    card.classList.add("selected");
    selectedTeam = card.dataset.team;
    document.querySelectorAll(".team-dot").forEach(dot => {
      dot.className = `team-dot ${selectedTeam.toLowerCase()}`;
    });
    document.querySelector(".player-copy span").innerHTML = `<i class="team-dot ${selectedTeam.toLowerCase()}"></i> Team ${selectedTeam}`;
    document.querySelector(".player-summary span").innerHTML = `<i class="team-dot ${selectedTeam.toLowerCase()}"></i> Team ${selectedTeam}`;
    applyPlayerProfile();
    saveProfile();
    showToast(`Joined Team ${selectedTeam}`);
  });
});

 document.getElementById("zoomIn").addEventListener("click", () => setZoom(zoom + 25));
document.getElementById("zoomOut").addEventListener("click", () => setZoom(zoom - 25));
document.getElementById("resetView").addEventListener("click", () => setZoom(100));

document.getElementById("clearCanvas").addEventListener("click", () => {
  paintAll("#FFFFFF");
  replayFrames.length = 0;
  recordReplayFrame();
  renderCanvas();
  lineStart = null;
  circleStart = null;
  polygonPoints = [];
  addActivity(`<strong>You</strong> cleared the canvas`, "N", "blue-avatar");
  showToast("Canvas cleared");
});

document.getElementById("settingsButton").addEventListener("click", () => showToast("Settings are available after backend integration"));

document.getElementById("replayDrawing").addEventListener("click", () => {
  if (replayFrames.length === 0) {
    showToast("No drawing history to replay");
    return;
  }

  showToast("Replaying drawing history");
  let frameIndex = 0;
  const replayTimer = setInterval(() => {
    imageData.data.set(replayFrames[frameIndex]);
    renderCanvas();
    frameIndex++;
    if (frameIndex >= replayFrames.length) clearInterval(replayTimer);
  }, 90);
});

window.addEventListener("resize", () => setZoom(zoom));

buildPalette();
paintAll("#FFFFFF");
renderCanvas();
setZoom(100);
updateCooldown();

const savedProfile = getSavedProfile();
if (savedProfile && savedProfile.username && savedProfile.team) {
  playerUsername = savedProfile.username.trim().slice(0, 18);
  selectedTeam = ["Red", "Blue", "Green"].includes(savedProfile.team) ? savedProfile.team : "Blue";
  applyPlayerProfile();
} else {
  window.location.href = "welcome.html";
}
}
