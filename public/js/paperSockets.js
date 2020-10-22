export let socket = io();
window.onload = function() {
	// Setup directly from canvas id:
	paper.setup('canvas');
	var tool = new paper.Tool();
	// When a client first joins a session, they must wait until it is their turn to
	// load the existing session paths. Their canvas starts as locked and a special
	// flag 'pathsLoaded' prevents them from adding paths that are currently being
	// drawn by other users.
	let LOCKED = true;
	let pathsLoaded = false;

	// global array of objects containing info about each path drawn. similar to
	// paths array on server
	let paths = [];		// paths = [ {pathName: "pathN", path: Path} ]
	let curPath = new paper.Path();
	let selectedColor = '#000000';
	// global settings for all paths, can (and will) be overridden
	paper.project.currentStyle = {
		strokeWidth: 5,
		strokeCap: 'round',
		strokeColor: 'black'
	}

	// socket listeners
	socket.on('addPaths', addPaths);					// initializes the canvas
	socket.on('lockCanvas', lockCanvas);				// prevents user from drawing
	socket.on('newPath', createNewPath);				// starts a path
	socket.on('newPoint', addPointToPath);				// extends a path
	socket.on('finishPath', finishPath);				// ends a path and unlocks canvas
	socket.on('unlockCanvas', unlockCanvas);			// allows user to draw

	// notify server to send existing session paths
	socket.emit('hello');

	// called by every non-drawing client when one client begins drawing.
	// prevents other clients from emitting drawing coordinates to server
	function lockCanvas(owner) {
	    LOCKED = owner;
	    console.log('canvas LOCKED by socket ' + owner);
	    return LOCKED;
	}

	function unlockCanvas(owner) {
		if(owner == false || LOCKED == owner) {
			LOCKED = false;
		    console.log('lock is unlocked');
		}
		return LOCKED;
	}

	// called when socket receives an 'addPaths' message from server. Adds all
	// previously existing session paths to new client's canvas and allows client
	// to begin to receive canvas updates when other users are drawing.
	// newPaths = [ [pathName, pathObj], ... , [pathName, pathObj] ]
	function addPaths(newPaths) {
		console.log('adding new paths ...... ');
		// add each path from server to client paths array. pathObj is a Path-like
		// object that must be converted to a Paper.js Path
		for(let [pathName, pathObj] of newPaths) {
			let pathsItem = {
				pathName: pathName,
				path: new paper.Path(pathObj)
			}
			paths.push(pathsItem);
			paths[paths.length-1].path.simplify();	// smooths the path
		}

		pathsLoaded = true;
		// initial unlocking of client canvas
		socket.emit('pathsLoaded');
	}

	// notify users to create a new path
	tool.onMouseDown = function(event) {
		if(!LOCKED || LOCKED == socket.id) {
			let pathAttr = getPathAttributes();
			socket.emit('beginDrawing', pathAttr);
			return;
	    }
		console.log('my socket id: ' + socket.id);
		console.log('cant start new path, lock is locked to socket ' + LOCKED);
		return;
	}

	// callback, called when newPath socket message is received. Make a new path,
	// set it as curPath, add it to the paths obj.
	function createNewPath(pathAttr) {
		// create new path
		curPath = new paper.Path();
		//set the color
		let r = pathAttr.strokeColor[1];
		let g = pathAttr.strokeColor[2];
		let b = pathAttr.strokeColor[3];
		curPath.strokeColor = new paper.Color(r,g,b);

		// curPath.strokeColor = new Color(selectedColor);

		// rotateColors();
		console.log(paths);
	}

	// notifies users to add new point to curPath
	tool.onMouseDrag = function(event) {
		if(LOCKED != socket.id) { return; }
		let loc = { x: event.point.x, y: event.point.y }
	    socket.emit('draw', loc);
	}

	// called when socket receives "newPoint" message. adds the supplied
	// point to the current path (which draws it)
	function addPointToPath(loc) {
	    // Add a segment to the path at the position of the mouse:
	    let point = new paper.Point(loc.x, loc.y);
	    curPath.add(point);
	}

	// called when user releases a click, used to notify server of event
	tool.onMouseUp = function(event) {
		if(LOCKED != socket.id) { return; }
		let pathData = {
			pathName: "path" + paths.length,
			path: curPath
		}
	    socket.emit('endDrawing', pathData);
	}

	// called when socket receives "finishPath" message. Smooths the path, adds
	// finished path to paths array, and unlocks the canvas for drawing.
	function finishPath(event) {
		if(pathsLoaded == false) {
			console.log('waiting to load paths');
			return;
		}
		curPath.simplify();
		// add new path to paths array
		let pathsItem = {
			pathName: 'path' + paths.length,
			path: curPath
		}
		paths.push(pathsItem);
	    unlockCanvas();
	}

	// returns an object of path attributes
	function getPathAttributes(rand = false) {
		let strokeColor;
		if(rand == true) {
			strokeColor = new paper.Color(Math.random(), Math.random(), Math.random());
		}
		else {
			strokeColor = new paper.Color(selectedColor);
		}

		let attr = {
			strokeColor: strokeColor
		};
		return attr;
	}

	// rotate colors of existing paths
	function rotateColors() {
		if(paths.length > 1) {
			// save color of first path
			let path0Color = paths[0].path.strokeColor;
			// change the rest of the colors by shifting them to the left
			// (to the left to the left, the color that you own pass to the Path on your left)
			for(let i = 0; i < paths.length-1; i++) {
				paths[i].path.strokeColor = paths[i+1].path.strokeColor;
			}
			// last path gets firt paths original color
			paths[i].path.strokeColor = path0Color;
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
}
