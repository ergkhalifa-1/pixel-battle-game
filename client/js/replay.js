export class DrawingReplay {
  constructor(limit = 40) {
    this.frames = [];
    this.limit = limit;
  }

  record(imageData) {
    this.frames.push(new Uint8ClampedArray(imageData.data));
    if (this.frames.length > this.limit) this.frames.shift();
  }

  clear() {
    this.frames.length = 0;
  }
}
