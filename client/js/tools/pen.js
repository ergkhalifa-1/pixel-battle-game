export function drawPenPixel(setPixel, imageData, canvasSize, x, y, colour, ownerTeam) {
  const rgb = hexToRgb(colour);
  return setPixel(imageData, canvasSize, x, y, rgb.r, rgb.g, rgb.b);
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.substring(0, 2), 16),
    g: parseInt(value.substring(2, 4), 16),
    b: parseInt(value.substring(4, 6), 16)
  };
}
