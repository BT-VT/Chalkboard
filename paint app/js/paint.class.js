import Utility from "./utility.class.js";
import Tool from "./tool.class.js";
export default class Paint {
  constructor(t) {
    (this.canvas = document.getElementById(t)), //select canvas from front end using documant query slector
      (this.context = canvas.getContext("2d")), // get 2d context of canvas element
      (this.undoStack = []), //set empty undo stack
      (this.undoLimit = 5); // set undo stack limit
  }
  set activeTool(t) {
    // set active tool when passed to it
    this.tool = t;
  }
  set selectedColor(t) {
    //set passed color to selected color and use it
    (this.color = t), (this.context.strokeStyle = this.color); // set stroke style for pencil
  }
  set lineWidth(t) {
    this._lineWidth = t; // set line width to initial defined pixel value in app.js
  }
  // initialise canvas using a mousedown arrow function
  init() {
    this.canvas.onmousedown = (t) => this.onMouseDown(t);
  }
  // function definition of mouse down function
  onMouseDown(t) {
    // set height and width of canvas equal to width of white box on screen
    (this.savedImage = this.context.getImageData(
      0,
      0,
      this.context.canvas.width,
      this.context.canvas.height
    )),
      // if undo stack is full remove oldest entry
      this.undoStack.length >= this.undoLimit && this.undoStack.shift(),
      // add a new entry to undo stack
      this.undoStack.push(this.savedImage),
      // call mouse move function when mouse is moved on canvas element
      (this.canvas.onmousemove = (t) => this.onMouseMove(t)),
      // call mouse up function when mouse released on canvas element
      (document.onmouseup = (t) => this.onMouseUp(t)),
      // get starting positon of move on canvas element
      (this.startPos = Utility.getMouseCoordsOnCanvas(this.canvas, t)),
      // Begin printing on canvas context using pencil tool
      this.context.beginPath(); // begin pah
    this.context.moveTo(this.startPos.x, this.startPos.y); // next pixel to go to
  }
  onMouseMove(t) {
    //definition of mouse move function
    //chekc what tool is currently selected
    switch (
      ((this.currentPos = Utility.getMouseCoordsOnCanvas(this.canvas, t)),
      this.tool)
    ) {
      case Tool.TOOL_LINE:
      case Tool.TOOL_RECTANGLE:
      case Tool.TOOL_CIRCLE:
      case Tool.TOOL_TRIANGLE:
        // if any of above 4 tools are selected we draw that shape
        this.drawShape();
        break;
      case Tool.TOOL_PENCIL:
        // if pencil tool is selected we draw freehand lines
        this.drawFreeLine(this._lineWidth);
        break;
    }
  }
  onMouseUp(t) {
    // if mouse is released then remove painting fucntions from event listeners and don't print anything on screen when mouse moves
    (this.canvas.onmousemove = null), (document.onmouseup = null);
  }
  drawShape() {
    // definition of draw shape funciton
    // set image data and begin path common for all shapes and then check if current selected tool is line tool
    if (
      (this.context.putImageData(this.savedImage, 0, 0),
      this.context.beginPath(),
      (this.context.lineWidth = this._lineWidth),
      Tool.TOOL_LINE == this.tool)
    )
      //if line tool is sleected then make a straign line using only start and end points
      this.context.moveTo(this.startPos.x, this.startPos.y),
        this.context.lineTo(this.currentPos.x, this.currentPos.y);
    else if (Tool.TOOL_RECTANGLE == this.tool)
      // if rectangle tool is selected then make a rectangle by passing it cordinates of start and end it can figure out rest 2 point on it's own
      this.context.rect(
        this.startPos.x, //start
        this.startPos.y, //start
        this.currentPos.x - this.startPos.x, //end
        this.currentPos.y - this.startPos.y //end
      );
    else if (Tool.TOOL_CIRCLE == this.tool) {
      // if circle tool is selected then find length of mouse drag on screen using hypotenuse function
      let t = Utility.calcHypotenuse(this.startPos, this.currentPos);
      // make a circle of that radius
      this.context.arc(this.startPos.x, this.startPos.y, t, 0, 2 * Math.PI, !1);
    } else
      Tool.TOOL_TRIANGLE == this.tool &&
        // else trianglr tool is selected and use simple geometry formulas to find out cordinares of 3 points
        (this.context.moveTo(
          this.startPos.x + (this.currentPos.x - this.startPos.x) / 2,
          this.startPos.y
        ),
        this.context.lineTo(this.startPos.x, this.currentPos.y), // make first line
        this.context.lineTo(this.currentPos.x, this.currentPos.y), // make scond line
        this.context.closePath()); // make third line which closes shape and results in triangle
    // most important line of function all work done above stays at backend
    // to show changes to user we stroke it on canvas element
    this.context.stroke();
  }

  drawFreeLine(t) {
    // definition of freehand lines function
    (this.context.lineWidth = t), // get line width defined at start of program
      this.context.lineTo(this.currentPos.x, this.currentPos.y), // get co-ords to point where buttoon ws pressed
      // make shape drawn a cirlcle [like we take a sketchpen and put a dot on sheet then it is a small cirlce]
      (this.context.lineCap = "round"),
      (this.context.lineJoin = "round"),
      // show output on screen and strokes of lines to user
      this.context.stroke();
  }

  undoPaint() {
    if (this.undoStack.length > 0) {
      this.context.putImageData(
        this.undoStack[this.undoStack.length - 1],
        0,
        0
      );
      this.undoStack.pop();
    } else {
      alert("No undo available");
    }
  }
}
