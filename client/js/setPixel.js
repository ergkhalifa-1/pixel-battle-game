// Pixel buffer primitive used by every drawing tool.
export function setPixel(imageData, canvasSize, x, y, r, g, b, alpha = 255) {
  if (x < 0 || y < 0 || x >= canvasSize || y >= canvasSize) return false;
  const index = (y * canvasSize + x) * 4;
  imageData.data[index] = r;
  imageData.data[index + 1] = g;
  imageData.data[index + 2] = b;
  imageData.data[index + 3] = alpha;
  return true;
}
