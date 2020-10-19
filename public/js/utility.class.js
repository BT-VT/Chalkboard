import Point from "./point.class.js";
export default class Utility {
  // gets mouse position relative to canvas in current viewport
  static getMouseCoordsOnCanvas(canvas, e) {
      // getBoundingClientRect returns dimensions of an HTML obj (like a div, or canvas)
      // relative to the viewport
      let rect = canvas.getBoundingClientRect(), // abs. size of element (usually viewport)
          scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for X
          scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y

      // e.clientX & e.clientY are coordinates of e (canvas) relative to viewport
      // rect.left & rect.top are the distances of the canvas left & top borders to the viewport.
      // scale mouse coordinates after they have been adjusted to be relative to element.
      return new Point((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
  }



  static calcHypotenuse(t, a) {
    //calculate hypotenuse
    return Math.sqrt(Math.pow(a.x - t.x, 2) + Math.pow(a.y - t.y, 2));
  }
}
