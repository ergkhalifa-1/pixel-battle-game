export function floodFill(getPixelColour, setPixel, imageData, canvasSize, startX, startY, r, g, b) {
  const target = getPixelColour(startX, startY);
  const replacement = [r, g, b].join(",");
  if (target === replacement) return;
  const stack = [[startX, startY]];

  while (stack.length) {
    const [x, y] = stack.pop();
    if (getPixelColour(x, y) !== target) continue;
    setPixel(imageData, canvasSize, x, y, r, g, b);
    if (x > 0) stack.push([x - 1, y]);
    if (x + 1 < canvasSize) stack.push([x + 1, y]);
    if (y > 0) stack.push([x, y - 1]);
    if (y + 1 < canvasSize) stack.push([x, y + 1]);
  }
}
