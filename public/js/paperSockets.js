export let socket = io();
export function paperSockets() {
//window.onload = function() {
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
		marker: true,
		circle: false,
		eraser: false
	}

	// socket listeners
	socket.on('addPaths', addPaths);					// initializes the canvas
	socket.on('lockCanvas', lockCanvas);				// prevents user from drawing
	socket.on('createNewDrawing', createNewDrawing);	// starts a path
	socket.on('drawSegment', drawSegment);				// extends a path
	socket.on('drawTrackingCircle', drawTrackingCircle);
	socket.on('erasePath', erasePath);
	socket.on('finishDrawing', finishDrawing);			// ends a path and unlocks canvas
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
		console.log("CHECK ADDPATHS!")
		LOCKED = false;
		initialPathsReceived = true;
		console.log('adding new paths ...... ');
		// add each path from server to client paths array. pathObj is a Path-like
		// object that must be converted to a Paper.js Path
		for(let [pathName, pathObj] of newPaths) {
			let pathsItem = { pathName: pathName }
			if(pathName.search('path') > -1) {
				console.log('adding path' + pathsItem.pathName);
				pathsItem.path = new paper.Path(pathObj);
				pathsItem.path.simplify();
			}
			else if(pathName.search('circle') > -1) {
				console.log('adding circle' + pathsItem.pathName);
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
				socket.emit('requestNewDrawing', pathAttr);
			}
			else if(drawingTools.circle) {
				socket.emit('requestLock');
			}
			else if(drawingTools.eraser) {
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
	function createNewDrawing(pathAttr) {
		// create new path
		curPath = new paper.Path(pathAttr);
		if(attributes.multicolor) { rotateColors(); }
	}

	// notifies users to add new point to curPath
	tool.onMouseDrag = function(event) {
		if(LOCKED != socket.id) { return; }
		if(drawingTools.marker) {
			let loc = { x: event.point.x, y: event.point.y }
		    socket.emit('requestSegment', loc);
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
		// paths = [ {pathName: "pathN", path: Path} ]
		else if(drawingTools.eraser && event.item) {
			let pathsItemArr = paths.filter(pathsItem => pathsItem.path == event.item);
			if(pathsItemArr.length == 1) {
				socket.emit('requestErase', pathsItemArr[0].pathName);
			}
		}
		return;
	}

	// called when socket receives "newPoint" message. adds the supplied
	// point to the current path (which draws it)
	function drawSegment(loc) {
	    // Add a segment to the path at the position of the mouse:
	    let point = new paper.Point(loc.x, loc.y);
	    curPath.add(point);
	}

	function drawTrackingCircle(circleAttr) {
		curCircle.remove();
		curCircle = new paper.Path.Circle(circleAttr);

	}

	function erasePath(pathName) {
		console.log('attempt to erase ' + pathName);
		let pathRemoved = null;
		for(let i = 0; i < paths.length; i++) {
			// if path is found try to remove it from canvas
			console.log(paths[i].pathName);
			console.log(pathName);
			console.log('equal: ');
			console.log(paths[i].pathName == pathName);
			if(paths[i].pathName == pathName) {
				console.log('found path in paths');
				if(paths[i].path.remove()) {


					console.log('erased ' + pathName);
					// if removed successfully, remove from paths list
					paths = paths.filter(pathsItem => pathsItem.pathName != pathName);
					if(LOCKED == socket.id) {
						// have lock owner confirm removal with server
						socket.emit('confirmErasePath', pathName);
					}
					break;
				}
			}
		}
	}

	// called when user releases a click, used to notify server of event
	tool.onMouseUp = function(event) {
		if(LOCKED != socket.id) { return; }
		if(drawingTools.marker) {
		    socket.emit('requestFinishDrawing');
			return;
		}
		else if(drawingTools.circle) {
			socket.emit('requestFinishCircle');
			return;
		}
		else if(drawingTools.eraser) {
			socket.emit('requestFinishErasing');
			return;
		}
	}

	// called when socket receives "finishPath" message. Smooths the path, adds
	// finished path to paths array, and unlocks the canvas for drawing.
	function finishDrawing(pathID) {
		if(initialPathsReceived == false) {
			console.log('waiting to load paths');
			return;
		}
		curPath.simplify();
		// add new path to paths array
		let pathsItem = {
			pathName: 'path-' + pathID,
			path: curPath
		}
		paths.push(pathsItem);
		curPath = null;
		console.log(paths);
		if(LOCKED == socket.id) {
			socket.emit('confirmDrawingDone', pathsItem);
		}
	}

	function finishCircle(pathID) {
		curCircle.dashArray = null;
		let pathsItem = {
			pathName: 'circle-' + pathID,
			path: curCircle
		}
		paths.push(pathsItem);
		console.log(paths);
		curCircle = new paper.Path.Circle();

		if(LOCKED == socket.id) {
			socket.emit('confirmCircleDone', pathsItem);
		}
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

	var commandBtn = document.querySelector(".download");
	if (commandBtn){
		commandBtn.onclick = function() {
			console.log("testing download");
			var canvas = document.getElementById("canvas");
			var image = canvas
				.toDataURL("image/png", 1.0)
				.replace("image/png", "image/octet-stream");
			var link = document.createElement("a");
			link.download = "my-image.png";
			link.href = image;
			link.click();
		}
	}


	var uploadBtn = document.querySelector(".upload");
	var selectedFile; 
	if (uploadBtn){
		uploadBtn.addEventListener('click', (e) => {
			console.log("test uploadbtn with events");
			//selectedFile = e.target.files[0];
			//let i = 0;

			var canvas = document.getElementById("canvas");
			var image = canvas
				.toDataURL("image/png", 1.0);
				//.replace("image/png", "image/octet-stream");
			console.log(typeof(image));
			console.log(image);
			

       
            // create storage ref to empty storage object
            // https://firebase.google.com/docs/reference/js/firebase.storage.Reference#getdownloadurl
            let storageRef = firebase.storage().ref('chalkboards/' + "testUpload-930PM.png");

			// upload file to storage ref location
			image = image.split(',');
			
            let task = storageRef.putString(image[1],"base64", {contentType:'image/png'});
            // update progress bar and save download URL
            // https://firebase.google.com/docs/reference/js/firebase.storage.UploadTask#on
            task.on('state_changed',
                // called when upload fails
                function error(err) {
                    console.log(err);
                },
                // called when upload finishes, get URL and display corresponding image
                async function complete() {
                    try {
                        let url = await storageRef.getDownloadURL();
                        let displayResponse = await displayImg(url);
                        console.log(displayResponse);
                    } catch (err) {
                        console.log(err);
                    }
                }
            );
	});
}


	// var testBtn = document.querySelector(".upload");
	// if (testBtn){
	// 	testBtn.onclick = function() {
	// 		//console.log("testing download");
	// 		var storageRef = firebase.storage().ref('chalkboards/');
	// 		var filename = 
	// 	}
	// }



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

	var eraserBtn = document.querySelector("#eraser");
	if(eraserBtn) {
		eraserBtn.onclick = function() {
			if(setDrawingTool("eraser")) {
				console.log('eraser selected');
			}
			else { console.log('failed to select eraser'); }
		}
	}
	else { console.log('eraser button not found'); }
}