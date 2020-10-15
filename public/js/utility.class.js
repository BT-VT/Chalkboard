import Point from "./point.class.js";
export default class Utility {
  static getMouseCoordsOnCanvas(t, a) {
    // return current co-ordinates of pointer
    let e = t.getBoundingClientRect(),
      i = a.clientX - e.left,
      n = a.clientY - e.top;
    return new Point(i, n);
  }
  static calcHypotenuse(t, a) {
    //calculate hypotenuse
    return Math.sqrt(Math.pow(a.x - t.x, 2) + Math.pow(a.y - t.y, 2));
  }
}
