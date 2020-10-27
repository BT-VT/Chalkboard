window.globalVar = ""
window.selectedColor = ""
// Simple example, see optional options for more configuration.
const pickr = Pickr.create({
    el: '.color-picker',
    theme: 'classic', // or 'monolith', or 'nano'
    default: '#ffffff',
    swatches: [
        'rgba(255, 0, 0, 1)',
        'rgba(255, 127, 0, 1)',
        'rgba(255, 255, 0, 1)',
        'rgba(0, 255, 0, 1)',
        'rgba(0, 0, 255, 1)',
        'rgba(46, 43, 95, 1)',
        'rgba(139, 0, 255, 1)',
    ],

    components: {

        // Main components
        preview: true,
        opacity: true,
        hue: true,

        // Input / output Options
        interaction: {
            hex: true,
            rgba: true,
            input: true,
            clear: true,
            save: true
        }
    }
});

pickr.on('change', (color, instance) => {
    var hexColor = color.toHEXA().toString();
    console.log(hexColor)
    window.globalVar = hexColor;
    window.selectedColor=hexColor.toString()
   
})
pickr.on('save',(color,instance)=>{
    pickr.addSwatch(color.toHEXA().toString());
})


let socket = io();
let LOCKED = false;

// global obj that contains all paths that are drawn
let paths = {};
let curPath;
let curPathName;
console.log("SELECTED: "+selectedColor)
// global settings for all paths, can (and will) be overridden
project.currentStyle = {
	strokeWidth: 5,
	strokeCap: 'round',
	strokeColor: '#FFF'
} 
 
// socket listeners
socket.on('addPaths', addPaths);
socket.on('lockCanvas', lockCanvas);
socket.on('newPath', createNewPath);
socket.on('newPoint', addPointToPath);
socket.on('unlockCanvas', unlockCanvas);

// called by every other client when one client begins drawing.
// prevents other clients from emitting drawing coordinates to server
function lockCanvas() {
    LOCKED = true;
    console.log('*********** lock is LOCKED');
    return LOCKED;
}

// called when socket receives an 'addPaths' message from server when socket
// connection is first established between client/server.
// Adds all previously existing drawings on chalkboard to new client canvas.
// newPaths is an object consisting of Path-like object values that can be used by the
// Path constructor to create actual Path objects.
// newPaths = [ [pathName, pathObj], ... , [pathName, pathObj] ]
function addPaths(newPaths) {

	for(let [pathName, pathObj] of newPaths) {
		// use the same keys for path that are found in newPaths
		paths.pathName = new Path(pathObj);
		paths.pathName.simplify();
		curPath = paths.pathName;
	}
	socket.emit('pathsLoaded');
}

// notify users to create a new path
function onMouseDown(event) {
	if(LOCKED) {
        console.log('cant draw, lock is locked');
        return;
    }

	let pathAttr = getPathAttributes();
	socket.emit('beginDrawing', pathAttr);
}

// callback, called when newPath socket message is received. Make a new path,
// set it as curPath, add it to the paths obj.
function createNewPath(pathAttr) {
	console.log(pathAttr);
	// create new path
	curPath = new Path();
	//set the color
	let r = pathAttr.strokeColor[1];
	let g = pathAttr.strokeColor[2];
	let b = pathAttr.strokeColor[3];
	curPath.strokeColor = new Color(r,g,b);

	// curPath.strokeColor = new Color(selectedColor);

	// rotateColors();
	// add new path to paths object
	curPathName = 'path'+ Object.keys(paths).length;
	paths[curPathName] = curPath;
	console.log(paths);
}

// This function is called whenever the user
// clicks the mouse in the view:
function onMouseDrag(event) {
    loc = { x: event.point.x, y: event.point.y }
    socket.emit('draw', loc);
}

// called when socket receives "newPoint" message. adds the supplied
// point to the current path (which draws it)
function addPointToPath(loc) {
    // Add a segment to the path at the position of the mouse:
    point = new Point(loc.x, loc.y);
    curPath.add(point);
}

// called when user releases a click, used to notify server of event
function onMouseUp(event) {
	let pathData = {
		pathName: curPathName,
		path: curPath
	}
    socket.emit('endDrawing', pathData);
}

// called when socket receives "unlockCanvas" message. Smooths the path
// and unlocks the canvas for drawing.
function unlockCanvas(event) {
	if(curPath != null) { curPath.simplify(); }
    LOCKED = false;
    console.log('lock is unlocked');
}

// returns an object of path attributes
function getPathAttributes(rand = false) {
	let strokeColor;
	if(rand == true) {
		strokeColor = new Color(Math.random(), Math.random(), Math.random());
	}
	else {
		strokeColor = new Color(selectedColor);
	}

	let attr = {
		strokeColor: strokeColor
	};
	return attr;
}

// rotate colors of existing paths
function rotateColors() {
	// create array of paths obj keys
	let keys = Object.keys(paths);
	if(keys.length > 1) {
		// save color of first path
		let path0Color = paths[keys[0]].strokeColor;
		// change the rest of the colors
		for(let i = 0; i < keys.length-1; i++) {
			paths[keys[i]].strokeColor = paths[keys[i+1]].strokeColor;
		}
		// last path gets firt paths original color
		paths[keys[keys.length-1]].strokeColor = path0Color;
	}
}

function removeClass(el, className){
    var elClass = el.className;
    while(elClass.indexOf(className) != -1) {
        elClass = elClass.replace(className, '');
        elClass = elClass.trim();
    }
    el.className = elClass;
}

var colorBtns = document.querySelectorAll(".color-box");
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

   