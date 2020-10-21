let socket = io();

// When a client first joins a session, they must wait until it is their turn to
// load the existing session paths. Their canvas starts as locked and a special
// flag 'pathsLoaded' prevents them from adding paths that are currently being
// drawn by other users.
let LOCKED = true;
let pathsLoaded = false;

// global obj that contains all paths that are drawn. Matches paths array on server
let paths = {};
let curPath;
let curPathName;
let selectedColor = '#000000';
// global settings for all paths, can (and will) be overridden
project.currentStyle = {
	strokeWidth: 5,
	strokeCap: 'round',
	strokeColor: 'black'
}

// socket listeners
socket.on('addPaths', addPaths);					// initializes the canvas
socket.on('lockCanvas', lockCanvas);				// prevents user from drawing
socket.on('newPath', createNewPath);				// starts a path
socket.on('newPoint', addPointToPath);				// extends a path
socket.on('unlockCanvas', unlockCanvas);			// ends a path, allows new user to draw

// called by every non-drawing client when one client begins drawing.
// prevents other clients from emitting drawing coordinates to server
function lockCanvas(owner) {
    LOCKED = owner;
    console.log('*********** lock is LOCKED');
    return LOCKED;
}

// called when socket receives an 'addPaths' message from server. Adds all
// previously existing session paths to new client's canvas and allows client
// to begin to receive canvas updates when other users are drawing.
// newPaths = [ [pathName, pathObj], ... , [pathName, pathObj] ]
function addPaths(newPaths) {
	console.log('adding new paths ...... ');
	LOCKED = false;
	for(let [pathName, pathObj] of newPaths) {
		// use the same keys for path that are found in newPaths
		paths.pathName = new Path(pathObj);
		paths.pathName.simplify();
		curPath = paths.pathName;
	}
	// initial unlocking of client canvas
	pathsLoaded = true;
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
	if(!pathsLoaded) {
		console.log('waiting to load paths');
		return;
	}
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

// notifies users to add new point to curPath
function onMouseDrag(event) {
    loc = { x: event.point.x, y: event.point.y }
    socket.emit('draw', loc);
}

// called when socket receives "newPoint" message. adds the supplied
// point to the current path (which draws it)
function addPointToPath(loc) {
	if(!pathsLoaded) {
		console.log('waiting to load paths');
		return;
	}
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
	if(!pathsLoaded) {
		console.log('waiting to load paths');
		return;
	}
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
