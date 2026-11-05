export function scanlinePolygonFill(setPixel, imageData, canvasSize, points, r, g, b) {
  if (points.length < 3) return;
  let minimumY = canvasSize;
  let maximumY = 0;
  points.forEach(point => { minimumY = Math.min(minimumY, point.y); maximumY = Math.max(maximumY, point.y); });

  for (let y = minimumY; y <= maximumY; y++) {
    const intersections = [];
    for (let index = 0; index < points.length; index++) {
      const current = points[index];
      const next = points[(index + 1) % points.length];
      if (current.y === next.y) continue;
      if (y >= Math.min(current.y, next.y) && y < Math.max(current.y, next.y)) {
        intersections.push(Math.round(current.x + ((y - current.y) * (next.x - current.x)) / (next.y - current.y)));
      }
    }
    intersections.sort((a, b) => a - b);
    for (let index = 0; index + 1 < intersections.length; index += 2) {
      for (let x = intersections[index]; x <= intersections[index + 1]; x++) {
        setPixel(imageData, canvasSize, x, y, r, g, b);
      }
    }
  }
}
