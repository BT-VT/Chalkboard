export let socket = io();
window.onload = function() {
	// Setup directly from canvas id:
	paper.setup('canvas');
	var tool = new paper.Tool();
	// When a client first joins a session, they must wait until it is their turn to
	// load the existing session paths. Their canvas starts as locked and a special
	// flag 'initialPathsReceived' prevents them from adding paths that are currently being
	// drawn by other users.
	let LOCKED = true;
	let initialPathsReceived = false;

	// global array of objects containing info about each path drawn. similar to
	// paths array on server
	let paths = [];		// paths = [ {pathName: "pathN", path: Path} ]
	let curPath = new paper.Path();
	let curCircle = new paper.Path.Circle(0,0,0);

	let attributes = {
		selectedColor: '#000000',
		multicolor: false
	}

	let drawingTools = {
		circle: true,
		marker: false
	}

	// socket listeners
	socket.on('addPaths', addPaths);					// initializes the canvas
	socket.on('lockCanvas', lockCanvas);				// prevents user from drawing
	socket.on('newPath', createNewPath);				// starts a path
	socket.on('drawTrackingCircle', drawTrackingCircle);
	socket.on('newPoint', addPointToPath);				// extends a path
	socket.on('finishPath', finishPath);				// ends a path and unlocks canvas
	socket.on('finishCircle', finishCircle);
	socket.on('unlockCanvas', unlockCanvas);			// allows user to draw
	socket.on('deleteLastPath', deleteLastPath);		// send when "undo" is clicked
	socket.on('deleteCurPath', deleteCurPath);			// sent if lock owner is disconnected.

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
		console.log('LOCKED: ' + LOCKED);
		console.log('owner: ' + owner);
		if(owner == false || LOCKED == owner) {
			LOCKED = false;
		    console.log('canvas is UNLOCKED');
		}
		return LOCKED;
	}

	// called when socket receives an 'addPaths' message from server. Adds all
	// previously existing session paths to new client's canvas and allows client
	// to begin to receive canvas updates when other users are drawing.
	// newPaths = [ [pathName, pathObj], ... , [pathName, pathObj] ]
	function addPaths(newPaths) {
		LOCKED = false;
		initialPathsReceived = true;
		console.log('adding new paths ...... ');
		// add each path from server to client paths array. pathObj is a Path-like
		// object that must be converted to a Paper.js Path
		for(let [pathName, pathObj] of newPaths) {
			let pathsItem = { pathName: pathName }
			if(pathName.search('path') > -1) {
				pathsItem.path = new paper.Path(pathObj).simplify();
			}
			else if(pathName.search('circle') > -1) {
				pathsItem.path = new paper.Path.Circle(pathObj);
			}
			paths.push(pathsItem);
		}
		// initial unlocking of client canvas
		socket.emit('initialPathsReceived');
	}

	// notify users to create a new path
	tool.onMouseDown = function(event) {
		if(!LOCKED || LOCKED == socket.id) {
			if(drawingTools.marker) {
				let pathAttr = getPathAttributes(attributes.multicolor);
				socket.emit('beginDrawing', pathAttr);
			}
			else if(drawingTools.circle) {
				socket.emit('requestLock');
			}
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
		curPath = new paper.Path(pathAttr);
		if(attributes.multicolor) { rotateColors(); }
		console.log(paths);
	}

	// notifies users to add new point to curPath
	tool.onMouseDrag = function(event) {
		if(LOCKED != socket.id) { return; }
		if(drawingTools.marker) {
			let loc = { x: event.point.x, y: event.point.y }
		    socket.emit('draw', loc);
		}
		else if(drawingTools.circle) {
			let circleAttr = {
			    position: [event.downPoint.x, event.downPoint.y],
			    radius: Math.round(event.downPoint.subtract(event.point).length),
			    dashArray: [2, 2],
		        strokeColor: attributes.selectedColor
			}
			socket.emit('requestTrackingCircle', circleAttr);
		}
	}

	// called when socket receives "newPoint" message. adds the supplied
	// point to the current path (which draws it)
	function addPointToPath(loc) {
	    // Add a segment to the path at the position of the mouse:
	    let point = new paper.Point(loc.x, loc.y);
	    curPath.add(point);
	}

	function drawTrackingCircle(circleAttr) {
		curCircle.remove();
		curCircle = new paper.Path.Circle(circleAttr);

	}

	// called when user releases a click, used to notify server of event
	tool.onMouseUp = function(event) {
		if(LOCKED != socket.id) { return; }
		if(drawingTools.marker) {
			let pathData = {
				pathName: "path" + paths.length,
				path: curPath
			}
		    socket.emit('endDrawing', pathData);
			return;
		}
		else if(drawingTools.circle) {
			socket.emit('requestFinishCircle');
			return;
		}
	}

	function finishCircle(event) {
		curCircle.dashArray = null;
		let pathsItem = {
			pathName: 'circle' + paths.length,
			path: curCircle
		}
		paths.push(pathsItem);
		curCircle = new paper.Path.Circle();

		if(LOCKED == socket.id) {
			socket.emit('confirmCircleDone', pathsItem.pathName);
		}
	}



	// called when socket receives "finishPath" message. Smooths the path, adds
	// finished path to paths array, and unlocks the canvas for drawing.
	function finishPath(owner) {
		if(initialPathsReceived == false) {
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
		curPath = null;
	    unlockCanvas(owner);
	}


	// called when socket receives 'deleteLastPath' message from server. sent
	// when 'undo' button is clicked by user. Pops last drawn path from paths
	// array and removes path from canvas.
	// paths = [ {pathName: "pathN", path: Path} ]
	function deleteLastPath(pathName) {
		let pathObj = paths[paths.length - 1];
		// confirm path to be removed
		if(pathObj && pathObj.pathName == pathName) {
			paths.pop();
			pathObj.path.remove();
			console.log('removed ' + pathObj.pathName);
		}
	}

	// called when socket receives "deleteCurPath" message from server. Signals that
	// lock owner was disconnected and curPath should be removed & LOCK should be unlocked.
	function deleteCurPath(owner) {
		console.log('socket ' + owner + ' disconnected while drawing, releasing lock...');
		curPath.remove();
		curPath = null;
		unlockCanvas(owner);
	}

	// returns an object of path attributes
	function getPathAttributes(rand = false) {
		let strokeColor;
		if(rand == true) {
			strokeColor = rgbToHex(Math.random(), Math.random(), Math.random());
			console.log(strokeColor);
		}
		else {
			strokeColor = attributes.selectedColor;
		}

		let attr = {
			strokeColor: strokeColor,
			strokeWidth: 5,
			strokeCap: 'round'
		};
		return attr;
	}

	function rgbToHex(r,g,b) {
		r = Math.round(r*255).toString(16);
		g = Math.round(g*255).toString(16);
		b = Math.round(b*255).toString(16);

		if (r.length == 1) { r = "0" + r; }
		if (g.length == 1) { g = "0" + g; }
		if (b.length == 1) { b = "0" + b; }

  		return "#" + r + g + b;
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
			paths[paths.length - 1].path.strokeColor = path0Color;
		}
	}

	// set all drawing tools to false except the one passed as argument.
	function setDrawingTool(toolChosen) {
		for(let tool in drawingTools) {
			drawingTools[tool] = false;
		}
		drawingTools[toolChosen] = true;
		return drawingTools[toolChosen];
	}

	// returns the tool (string name) that is currently selected, else false.
	function getDrawingTool() {
		for(let tool in drawingTools) {
			if(drawingTools[tool]) { return tool; }
		}
		return false;
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
	        attributes.selectedColor = btn.attributes["data-color"].value;
			if(attributes.selectedColor == '#c46f0f') { attributes.multicolor = true; }
			else { attributes.multicolor = false; }
	        console.log(attributes.selectedColor);
	    };
	});

	var undoBtn = document.querySelector(".undo");
	if(undoBtn) {
		undoBtn.onclick = function() {
			if(!LOCKED) {
				console.log('undo clicked!');
				socket.emit('undo');
			}
		}
	}
	else { console.log('undo button not found'); }

	let markerBtn = document.querySelector("#marker");
	if(markerBtn) {
		markerBtn.onclick = function() {
			if(setDrawingTool('marker')) {
				console.log('marker selected');
			}
			else { console.log('failed to select marker'); }
		}
	}
	else { console.log('marker button not found'); }

	let circleBtn = document.querySelector("#circle");
	if(circleBtn) {
		circleBtn.onclick = function() {
			if(setDrawingTool('circle')) {
				console.log('circle selected!');

			}
			else { console.log('failed to select circle'); }
		}
	}
	else { console.log('circle button not found'); }
}
