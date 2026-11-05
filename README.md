# Pixel Battle

A multiplayer pixel-drawing game prototype inspired by shared canvas games such as Reddit r/place. The project uses HTML, CSS, Vanilla JavaScript, and the HTML Canvas API to provide a responsive desktop and mobile drawing interface.

## Features

- Separate welcome and game pages.
- Username entry, team selection, and persistent player profiles using `localStorage`.
- Team Red, Team Blue, and Team Green selection.
- A blank $128 \times 128$ shared-style pixel canvas.
- Pixel pen, line, circle, polygon, and flood-fill tools.
- Colour palette with RGB, HEX, and HSB values.
- Five-second drawing cooldown countdown.
- Pixel coordinates, zoom controls, reset view, grid display, clear canvas, and replay history.
- Team ownership indicators and simulated scoreboard activity.
- Desktop and mobile responsive layouts.

## Rasterization

The canvas uses an `ImageData` buffer sized at $128 \times 128$ pixels. A custom `setPixel()` function updates the RGBA value at a pixel's coordinate, while nearest-neighbour scaling keeps the pixels sharp when the canvas is zoomed or displayed on different screen sizes.

Actual drawing algorithms are implemented using custom pixel operations rather than Canvas drawing methods such as `fillRect()`, `lineTo()`, `arc()`, or `stroke()`.

## Implemented Algorithms

### Bresenham's Line Algorithm

Calculates integer-coordinate pixels along a line between two selected points. This produces efficient, stepped raster lines using only essential pixel increments and avoids floating-point drawing operations.

### Midpoint Circle Algorithm

Uses midpoint decisions and eight-way symmetry to determine the boundary pixels of a circle. The player selects the circle centre and a radius endpoint on the canvas.

### Scan-Line Polygon Fill

Calculates edge intersections for each horizontal scan line, sorts them, and fills the pairs of intersections. This rasterizes a user-defined polygon into individual pixels.

### Flood Fill

Uses an iterative stack-based region fill to colour all connected pixels matching the selected starting colour. It continues across neighbouring up, down, left, and right pixels until the connected region is filled.

### Pixel Pen

Writes one or more individual pixels to the `ImageData` buffer while the player clicks or drags across the canvas.

## Project Structure

The frontend is organized under `client/`:

- `client/index.html` - game dashboard.
- `client/welcome.html` - welcome and onboarding page.
- `client/css/` - shared and welcome-page styles.
- `client/js/main.js` - dashboard initialization.
- `client/js/welcome.js` - welcome-page interactions.
- `client/js/tools/` - line, circle, polygon, flood-fill, and pen implementations.

The `server/` and `tests/` directories are reserved for future backend and automated test implementations.

## Run Locally

From the project root:

```powershell
npm start
```

Then open:

```text
http://127.0.0.1:4173/client/welcome.html
```
