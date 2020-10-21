import Paint from "./paint.class.js";
import Tool from "./tool.class.js";
//import io from 'socket.io-client';
//var client = app.listen(portNum);
var socket;
io.connect('http://localhost:5000/');
console.log("Csadsa");
console.log(socket);



socket.on('hello', (socket) => {
  console.log("Hello!");
});
let paint = new Paint("canvas");
(paint.activeTool = Tool.TOOL_RECTANGLE), //set defaut tool in start of app to line tool
  (paint.lineWidth = "1"), // set line width in pixels
  (paint.selectedColor = "#000000"), // set default color to black in start of app
  paint.init(), // initialise paint class
  document.querySelectorAll("[data-command]").forEach((el) => {
    el.addEventListener("click", (e) => {
      let command = el.getAttribute("data-command");

      if (command == "undo") {
        paint.undoPaint();
      } else if (command == "download") {
        var canvas = document.getElementById("canvas");
        var image = canvas
          .toDataURL("image/png", 1.0)
          .replace("image/png", "image/octet-stream");
        var link = document.createElement("a");
        link.download = "my-image.png";
        link.href = image;
        link.click();
      }
    });
  });

// select all elements on page with tata attribute as tool and add a event listener to all of them
document.querySelectorAll("[data-tool]").forEach((e) => {
  
  // add event listener of click to elements and declare a arrow fuction to be invoked upon event
  e.addEventListener("click", (t) => {
    //remove active class from previous tool (changes background color)
    document.querySelector("[data-tool].active").classList.toggle("active"),
      //add background color to tool by putting active
      e.classList.toggle("active");
    let o = e.getAttribute("data-tool");
    //check what is current tool and do appropriate action
    switch (((paint.activeTool = o), o)) {
      case Tool.TOOL_LINE:
      case Tool.TOOL_RECTANGLE:
      case Tool.TOOL_CIRCLE:
      case Tool.TOOL_TRIANGLE:
      case Tool.TOOL_PENCIL:
        (document.querySelector(".group.pencil").style.display = "block");

        break;
      default:
        (document.querySelector(".group.pencil").style.display = "none");
    }
  });
}),
  // get data elements with color attribute and run a for loop on them
  document.querySelectorAll("[data-color]").forEach((e) => {
    //add event listener to each color box and change color when clicked
    e.addEventListener("click", (t) => {
      // chenge front end to show what color is selected
      document.querySelector("[data-color].active").classList.toggle("active"),
        e.classList.toggle("active"),
        //change backend to select color and use it in future tools from now
        (paint.selectedColor = e.getAttribute("data-color"));
    });
  });
