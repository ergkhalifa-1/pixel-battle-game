export function midpointCircle(setPixel, imageData, canvasSize, centerX, centerY, radius, r, g, b) {
  let x = 0;
  let y = radius;
  let decision = 1 - radius;

  function plotPoints(pointX, pointY) {
    setPixel(imageData, canvasSize, centerX + pointX, centerY + pointY, r, g, b);
    setPixel(imageData, canvasSize, centerX - pointX, centerY + pointY, r, g, b);
    setPixel(imageData, canvasSize, centerX + pointX, centerY - pointY, r, g, b);
    setPixel(imageData, canvasSize, centerX - pointX, centerY - pointY, r, g, b);
    setPixel(imageData, canvasSize, centerX + pointY, centerY + pointX, r, g, b);
    setPixel(imageData, canvasSize, centerX - pointY, centerY + pointX, r, g, b);
    setPixel(imageData, canvasSize, centerX + pointY, centerY - pointX, r, g, b);
    setPixel(imageData, canvasSize, centerX - pointY, centerY - pointX, r, g, b);
  }

  plotPoints(x, y);
  while (x < y) {
    x++;
    if (decision < 0) decision += 2 * x + 1;
    else { y--; decision += 2 * (x - y) + 1; }
    plotPoints(x, y);
  }
}
