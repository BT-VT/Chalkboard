let socket = io();
let LOCKED = false;

// global obj that contains all paths that are drawn
let paths = {};
let curPath;
// global settings for all paths, can (and will) be overridden
project.currentStyle = {
	strokeWidth: 5,
	strokeCap: 'round',
	strokeColor: 'black'
}

// socket listeners
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
	// create new path
	curPath = new Path();
	//curPath.strokeColor = pathAttr.strokecolor;

    // extract color ratios and set strokeColor
    let r = pathAttr.strokeColor.r;
    let g = pathAttr.strokeColor.g;
    let b = pathAttr.strokeColor.b;
    curPath.strokeColor = new Color(r,g,b);

    // curPath.strokeColor = 'red';
	rotateColors();
	// add new path to paths object
	paths['path'+ Object.keys(paths).length] = curPath;
	console.log(paths);
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
    socket.emit('endDrawing');
}

// called when socket receives "unlockCanvas" message. Smooths the path
// and unlocks the canvas for drawing.
function unlockCanvas(event) {
    curPath.simplify();
    LOCKED = false;
    console.log('lock is unlocked');
}

// returns an object of path attributes
function getPathAttributes() {
	// let strokeColor = new Color(Math.random(), Math.random(), Math.random());
    let strokeColor = {
        r: Math.random(),
        g: Math.random(),
        b: Math.random()
    }
	let attr = {
		strokeColor: strokeColor
	};

	return attr
}
