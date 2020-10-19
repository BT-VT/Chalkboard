let socket = io();

let canvas;
let c;

// variables
let selectedColor = "black";
let painting = false;      // prevents drawing when mouse isnt clicked down
let LOCKED = false;
const mouseBuff = 2;       // moves line above mouse cursor

window.addEventListener('load', () => {

    // grab canvas element, get context of drawing type, and size canvas appropriately
    canvas = document.querySelector("#canvas");
    c = canvas.getContext('2d');
    c.startPos = {x: 0, y: 0};
    c.currentPos = {x: 0, y: 0};
    resizeCanvas();

    // event listeners
    canvas.addEventListener("mousedown", startPosition);
    canvas.addEventListener("mouseup", finishPosition);
    //canvas.addEventListener("mousemove", toolSelection);
    // window.addEventListener('resize', resizeCanvas);

    //add event listener to call toolSelections when a new button is selected.
    toolSelection("pencil");

    // socket listeners
    socket.on('startPos', remoteStartPosition);
    socket.on('lock', lockDrawing);
    socket.on('finishPos', remoteFinishPosition);

});

// gets mouse position relative to canvas in current viewport
function getMouseCoordsOnCanvas(canvas, e) {
    // getBoundingClientRect returns dimensions of an HTML obj (like a div, or canvas)
    // relative to the viewport
    let rect = canvas.getBoundingClientRect(), // abs. size of element (usually viewport)
        scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for X
        scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y

    // e.clientX & e.clientY are coordinates of e (canvas) relative to viewport
    // rect.left & rect.top are the distances of the canvas left & top borders to the viewport.
    // scale mouse coordinates after they have been adjusted to be relative to element.
    let cords = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
    return cords;
}

// set attributes for a canvas line
// set rand = false to limit amount of random colors used
function getLineAttributes(rand = false) {

    let colors = ["#8093F1", "#F9DC5C", "#EA526F", "#70F8BA", "#1B98E0", ];

    let lineWidth = 10;
    let lineCap = "round";
    let strokeStyle = colors[Math.floor(Math.random()*5)];
    if(rand == true) {
        strokeStyle = `rgba(${Math.random() * 255},
                              ${Math.random() * 255},
                              ${Math.random() * 255}, 1)`;
    }else {
        strokeStyle = selectedColor;
    }
    return {
        lineWidth: lineWidth,
        lineCap: lineCap,
        strokeStyle: strokeStyle
    }
}

// called by every other client when one client begins drawing.
// prevents other clients from emitting drawing coordinates to server
function lockDrawing() {
    LOCKED = true;
    console.log('*********** lock is LOCKED');
}
// called when mouse button is pressed down, allows draw() to start
// emitting drawing coordinate data to server
function startPosition(e) {
    if(LOCKED) {
        console.log('cant draw, lock is locked');
        return;
    }
    painting = true;
    c.startPos = getMouseCoordsOnCanvas(canvas, e);
    let attr = getLineAttributes();
    let data = {
        pos: c.startPos,
        attr: attr
    }
    socket.emit('startPos', data);       // this emit is only necessary for drawing single points
}

// called when socket detects incoming data labeled as 'startPos', indicating that
// a client has clicked on the canvas to begin drawing (starting with a single point)
function remoteStartPosition(data) {
    c.moveTo(data.x, data.y);   // go to start location of path
}

// called when mouse is released, stops draw() from emiting Drawing
// coordinates to server when mouse is moved without being clicked
function finishPosition(e) {
    c.currentPos = getMouseCoordsOnCanvas(canvas, e);
    painting = false;
    socket.emit('finishPos');
}

// called when socket detects incoming data labeled as 'finishPos', indicating that
// the client who has been drawing is finished
function remoteFinishPosition() {
    c.beginPath();          // end the old drawing path
    LOCKED = false;
    console.log('lock is unlocked');
}

// called when mouse is moved. If permitted, sends drawing coordinates to server.

// called when socket detects incoming drawing coordinates from server ('mousePos').

// not currently used
function resizeCanvas(x=-1, y=-1) {
    if(x < 0 || y < 0) {
      canvas.width = window.innerWidth * 0.8;
      canvas.height = window.innerHeight * 0.8;
    }
    else {
      canvas.width = x;
      canvas.height = y;
    }
}

/*
====================================================================================
                                        LINE TOOL
====================================================================================
*/

function line(e) {
    console.log("HERE!");
    let pos = getMouseCoordsOnCanvas(canvas, e);
    let attr = getLineAttributes();
    console.log("Start: " + c.startPos.x + ", " + c.startPos.y);
    console.log("Ends: " + c.currentPos.x + ", " + c.currentPos.y);
    let data = {
        sPos: {x: c.startPos.x, y: c.startPos.y},
        ePos: pos,
        attr: attr
    }
    c.beginPath();
    socket.emit('mousePos', data);

}

function remoteLine(data) {
    console.log("REMOTE LINE");
    c.beginPath();
    c.moveTo(data.sPos.x, data.sPos.y);
    c.lineWidth = data.attr.lineWidth;
    c.lineCap = data.attr.lineCap;
    c.strokeStyle = data.attr.strokeStyle;

    c.lineTo(data.ePos.x, data.ePos.y);
    c.stroke();
                // makes each dot a unique color, instead of each line

}

/*
====================================================================================
                                    RECTANGLE TOOL
====================================================================================
*/
function rectangle(e) {


}

function remoteRectangle(data) {


}

/*
====================================================================================
                                    CIRCLE TOOL
====================================================================================
*/
function circle(e) {


}

function remoteCircle(data) {


}

/*
====================================================================================
                                    TRIANGLE TOOL
====================================================================================
*/
function triangle(e) {


}

function remoteTriangle(data) {


}

/*
====================================================================================
                                    PENCIL TOOL
====================================================================================
*/
function pencil(e) {
    // if mouse isnt clicked down or someone else is drawing, return
    if(!painting || LOCKED) return;

    let pos = getMouseCoordsOnCanvas(canvas, e);
    let attr = getLineAttributes();
    let data = {
        pos: pos,
        attr: attr
    }
    socket.emit('mousePos', data);
}

function remotePencil(data) {
    // set line attributes according to data received from server
    //c.moveTo(c.startPos.x, c.startPos.y);
    c.lineWidth = data.attr.lineWidth;
    c.lineCap = data.attr.lineCap;
    c.strokeStyle = data.attr.strokeStyle;

    c.lineTo(data.pos.x, data.pos.y);
    c.stroke();
    //c.beginPath();              // makes each dot a unique color, instead of each line
    c.moveTo(data.pos.x, data.pos.y);
}

/*
====================================================================================
                                    ERASER TOOL
====================================================================================
*/
function eraser(e) {


}

function remoteEraser(data) {


}

// function  getMousePos(canvas, e) {
//     // getBoundingClientRect returns dimensions of an HTML obj (like a div, or canvas)
//     // relative to the viewport
//     var rect = canvas.getBoundingClientRect(), // abs. size of element (usually viewport)
//         scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for X
//         scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y

//     // e.clientX & e.clientY are coordinates of e (canvas) relative to viewport
//     // rect.left & rect.top are the distances of the canvas left & top borders to the viewport
//     return {
//         x: (e.clientX - rect.left) * scaleX - mouseBuff,   // scale mouse coordinates after they have
//         y: (e.clientY - rect.top) * scaleY - mouseBuff     // been adjusted to be relative to element
//   }
// }


function toolSelection(toolUsed) {
    switch(toolUsed) {
        case "pencil":
            canvas.addEventListener("mousemove", pencil);
            socket.on('mousePos', remotePencil);
            break;
        case "line":
            canvas.addEventListener("mouseup", line);
            socket.on('mousePos', remoteLine);
            break;
        default:

            break;
    }

}

function removeClass(el, removeClassName){
    var elClass = el.className;
    while(elClass.indexOf(removeClassName) != -1) {
        elClass = elClass.replace(removeClassName, '');
        elClass = elClass.trim();
    }
    el.className = elClass;
}

var colorBtns = document.querySelectorAll(".color-box");
console.log(colorBtns);
colorBtns.forEach((btn) => {
    btn.onclick = function () {
        //make all buttons inactive
        colorBtns.forEach((btn) =>{
            removeClass(btn, "active");
        });

        //make selected button active
        btn.className += " active";

        //set color to button color
        selectedColor = btn.attributes["data-color"].value;
        console.log(selectedColor);
    };
});
