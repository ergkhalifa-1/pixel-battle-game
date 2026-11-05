export function bresenhamLine(setPixel, imageData, canvasSize, x0, y0, x1, y1, r, g, b) {
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;

  while (true) {
    setPixel(imageData, canvasSize, x0, y0, r, g, b);
    if (x0 === x1 && y0 === y1) break;
    const doubledError = 2 * error;
    if (doubledError >= dy) { error += dy; x0 += sx; }
    if (doubledError <= dx) { error += dx; y0 += sy; }
  }
}
