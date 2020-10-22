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
	let curPath;
	let curPathName;
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
		// add each path from server to client paths array. pathObj is a Path-like
		// object that must be converted to a Paper.js Path
		for(let [pathName, pathObj] of newPaths) {
			let pathsItem = {
				pathName: pathName,
				path: new paper.Path(pathObj)
			}
			paths.push(pathsItem);
			paths[paths.length-1].path.simplify();	// smooths the path
			curPath = paths[paths.length-1].path;
		}
		// initial unlocking of client canvas
		pathsLoaded = true;
		socket.emit('pathsLoaded');
	}

	// notify users to create a new path
	tool.onMouseDown = function(event) {
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
		// create new path
		curPath = new paper.Path();
		//set the color
		let r = pathAttr.strokeColor[1];
		let g = pathAttr.strokeColor[2];
		let b = pathAttr.strokeColor[3];
		curPath.strokeColor = new paper.Color(r,g,b);

		// curPath.strokeColor = new Color(selectedColor);

		// rotateColors();
		// add new path to paths array
		let pathsItem = {
			pathName: 'path' + paths.length,
			path: curPath
		}
		curPathName = pathsItem.pathName;
		paths.push(pathsItem);
		console.log(paths);
	}

	// notifies users to add new point to curPath
	tool.onMouseDrag = function(event) {
	    let loc = { x: event.point.x, y: event.point.y }
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
	    let point = new paper.Point(loc.x, loc.y);
	    curPath.add(point);
	}

	// called when user releases a click, used to notify server of event
	tool.onMouseUp = function(event) {
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
