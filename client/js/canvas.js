// Canvas state and rendering helpers.
// The main module uses ImageData as the shared 128 x 128 pixel buffer.
export const CANVAS_SIZE = 128;

export function paintAll(imageData, colourHex) {
  const hex = colourHex.replace("#", "");
  const red = parseInt(hex.substring(0, 2), 16);
  const green = parseInt(hex.substring(2, 4), 16);
  const blue = parseInt(hex.substring(4, 6), 16);

  for (let index = 0; index < imageData.data.length; index += 4) {
    imageData.data[index] = red;
    imageData.data[index + 1] = green;
    imageData.data[index + 2] = blue;
    imageData.data[index + 3] = 255;
  }
}
