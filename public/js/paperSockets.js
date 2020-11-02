window.globalVar = ""
window.selectedColor = ""

import User from "./user.js"

export let user = new User("Guest" + Math.floor(Math.random() * 10000), "default");
export let socket = io();
export function paperSockets() {

	let toolType = null;
	//window.onload = function() {

	function requestPaths() {
		var path = location.hash;
			if (path === "#/home") {
				//location.reload();
		}
	};

	window.addEventListener('hashchange', requestPaths);

	// Simple example, see optional options for more configuration.
	const pickr = Pickr.create({
		el: '.color-picker',
		theme: 'classic', // or 'monolith', or 'nano'
		default: '#ff0000',
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
		window.selectedColor = hexColor.toString()

	})
	pickr.on('save', (color, instance) => {
		pickr.addSwatch(color.toHEXA().toString());
	})


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

	let attributes = {
		multicolor: false,
		strokeWidth: 5,
		strokeCap: 'round',
		dashOffset: 1,
		scale: 2
	}

	let drawingTools = {
		marker: true,
		circle: false,
		rect: false,
		ellipse: false,
		triangle: false,
		selector: false,
		eraser: false
	}

	// socket listeners
	socket.on('addPaths', addPaths);					// initializes the canvas
	socket.on('lockCanvas', lockCanvas);				// prevents user from drawing
	socket.on('createNewDrawing', createNewDrawing);	// starts a path
	socket.on('drawSegment', drawSegment);				// extends a path
	socket.on('drawTrackingCircle', drawTrackingCircle);
	socket.on('drawTrackingRect', drawTrackingRect);
	socket.on('drawTrackingTriangle', drawTrackingTriangle);
	socket.on('erasePath', erasePath);
	socket.on('finishDrawing', finishDrawing);			// ends a path and unlocks canvas
	socket.on('finishCircle', finishCircle);
	socket.on('finishRect', finishRect);
	socket.on('finishTriangle', finishTriangle);
	socket.on('unlockCanvas', unlockCanvas);			// allows user to draw
	socket.on('deleteLastPath', deleteLastPath);		// send when "undo" is clicked
	socket.on('deleteCurPath', deleteCurPath);			// sent if lock owner is disconnected.
	socket.on('movePath', movePath);

	// notify server to send existing session paths
	socket.emit('hello', user);


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
		if (owner == false || LOCKED == owner) {
			LOCKED = false;
			console.log('canvas is UNLOCKED');
		}
		return LOCKED;
	}

	//Random Name generator for the images that are uploaded to storage
	function generateURL() {
		let result = "";
		for (var i = 0; i < 8; i++) {
			result += Math.floor(Math.random() * 100).toString(36);

		}
		return result;
	}

	// called when socket receives an 'addPaths' message from server. Adds all
	// previously existing session paths to new client's canvas and allows client
	// to begin to receive canvas updates when other users are drawing.
	// newPaths = [ [pathName, pathObj], ... , [pathName, pathObj] ]
	function addPaths(newPaths) {
		if (!initialPathsReceived) {
			LOCKED = false;
			initialPathsReceived = true;
			console.log('adding new paths ...... ');
			// add each path from server to client paths array. pathObj is a Path-like
			// object that must be converted to a Paper.js Path
			for (let [pathName, pathObj] of newPaths) {
				let pathsItem = { pathName: pathName }
				console.log('adding path ' + pathsItem.pathName);
				if (pathName.search('path') > -1) {
					pathsItem.path = new paper.Path(pathObj);
					pathsItem.path.simplify();
				}
				else if (pathName.search('circle') > -1) {
					pathsItem.path = new paper.Path.Circle(pathObj);
				}
				else if (pathName.search('rect') > -1) {
					pathsItem.path = new paper.Path.Rectangle(pathObj);
				}
				else if (pathName.search('ellipse') > -1) {
					pathsItem.path = new paper.Path.Ellipse(pathObj);
				}
				else if (pathName.search('triangle') > -1) {
					pathsItem.path = new paper.Path(pathObj);
				}
				setPathFunctions(pathsItem, attributes.scale);
				paths.push(pathsItem);
			}
		}
	}

	// notify users to create a new path. Repetitive for debugging purposes
	tool.onMouseDown = function (event) {
		if (!LOCKED || LOCKED == socket.id) {
			if (drawingTools.marker) {
				let pathAttr = getPathAttributes(attributes.multicolor);
				socket.emit('requestNewDrawing', pathAttr, user);
			}
			else if (drawingTools.circle) {
				socket.emit('requestLock', user);
			}
			else if (drawingTools.rect || drawingTools.ellipse) {
				socket.emit('requestLock', user);
			}
			else if (drawingTools.triangle) {
				socket.emit('requestLock', user);
			}
			else if (drawingTools.eraser) {
				socket.emit('requestLock', user);
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
		if (attributes.multicolor) { rotateColors(); }
	}

	// notifies users to add new point to curPath
	tool.onMouseDrag = function (event) {
		if (LOCKED != socket.id) { return; }
		if (drawingTools.marker) {
			let loc = { x: event.point.x, y: event.point.y }
			socket.emit('requestSegment', loc, user);
		}
		else if (drawingTools.circle) {
			let circleAttr = {
				position: [event.downPoint.x, event.downPoint.y],
				radius: Math.round(event.downPoint.subtract(event.point).length),
				dashArray: [2, 2],
				strokeColor: window.selectedColor,
				selectedColor: 'red'
			}
			socket.emit('requestTrackingCircle', circleAttr, user);
		}
		else if (drawingTools.rect || drawingTools.ellipse) {
			let rectAttr = {
				from: [event.downPoint.x, event.downPoint.y],
				to: [event.point.x, event.point.y],
				dashArray: [2, 2],
				strokeColor: window.selectedColor,
				isEllipse: drawingTools.ellipse
			}
			socket.emit('requestTrackingRect', rectAttr, user);
		}
		else if (drawingTools.triangle) {
			let triangleAttr = {
				segments: [
					[event.downPoint.x, event.downPoint.y],
					[event.point.x, event.point.y],
					[event.downPoint.x, event.point.y]
				],
				dashArray: [2, 2],
				strokeColor: window.selectedColor,
				closed: true
			}
			socket.emit('requestTrackingTriangle', triangleAttr, user);
		}
		// paths = [ {pathName: "pathN", path: Path} ]
		else if (drawingTools.eraser && event.item) {
			let pathsItemArr = paths.filter(pathsItem => pathsItem.path == event.item);
			if (pathsItemArr.length == 1) {
				socket.emit('requestErase', pathsItemArr[0].pathName, user);
			}
		}
		return;
	}

	// called when socket receives "newPoint" message. adds the supplied
	// point to the current path (which draws it)
	function drawSegment(loc) {
		if (!initialPathsReceived) { return; }
		// Add a segment to the path at the position of the mouse:
		let point = new paper.Point(loc.x, loc.y);
		curPath.add(point);
	}

	function drawTrackingCircle(circleAttr) {
		if (!initialPathsReceived) { return; }
		curPath.remove();
		curPath = new paper.Path.Circle(circleAttr);
		curPath.onFrame = function (event) {
			this.dashOffset += attributes.dashOffset;
		}
	}

	function drawTrackingRect(rectAttr) {
		if (!initialPathsReceived) { return; }
		curPath.remove();
		if (rectAttr.isEllipse) { curPath = new paper.Path.Ellipse(rectAttr); }
		else { curPath = new paper.Path.Rectangle(rectAttr); }
		curPath.onFrame = function (event) {
			this.dashOffset += attributes.dashOffset;
		}
	}

	function drawTrackingTriangle(triangleAttr) {
		if (!initialPathsReceived) { return; }
		curPath.remove();
		curPath = new paper.Path(triangleAttr);
		curPath.onFrame = function (event) {
			this.dashOffset += attributes.dashOffset;
		}
	}

	function erasePath(pathName) {
		console.log("inital: " + initialPathsReceived);
		if (!initialPathsReceived) { return; }
		let pathRemoved = null;
		for (let i = 0; i < paths.length; i++) {
			// if path is found try to remove it from canvas
			if (paths[i].pathName == pathName && paths[i].path.remove()) {
				console.log('erased ' + pathName);
				// if removed successfully, remove from paths list
				paths = paths.filter(pathsItem => pathsItem.pathName != pathName);
				if (LOCKED == socket.id) {
					// have lock owner confirm removal with server
					socket.emit('confirmErasePath', pathName, user);
				}
				break;
			}
		}
	}

	// called when user releases a click, used to notify server of event
	tool.onMouseUp = function (event) {
		if (LOCKED != socket.id) { return; }
		if (drawingTools.marker) {
			socket.emit('requestFinishDrawing', user);
			return;
		}
		else if (drawingTools.circle) {
			socket.emit('requestFinishCircle', user);
			return;
		}
		else if (drawingTools.rect || drawingTools.ellipse) {
			socket.emit('requestFinishRect', drawingTools.ellipse, user);
			return;
		}
		else if (drawingTools.triangle) {
			socket.emit('requestFinishTriangle', user);
			return;
		}
		else if (drawingTools.eraser) {
			socket.emit('requestFinishErasing', user);
			return;
		}
	}

	// called when socket receives "finishPath" message. Smooths the path, adds
	// finished path to paths array, and unlocks the canvas for drawing.
	function finishDrawing(pathID, user) {
		if (initialPathsReceived == false) {
			console.log('waiting to load paths');
			return;
		}
		curPath.simplify();
		// add new path to paths array
		let pathsItem = {
			pathName: 'path-' + pathID,
			path: curPath
		}
		setPathFunctions(pathsItem, attributes.scale);
		paths.push(pathsItem);
		curPath = new paper.Path();
		console.log(paths);
		console.log(pathsItem.path);
		if (LOCKED == socket.id) {
			socket.emit('confirmDrawingDone', pathsItem, user);
		}
	}

	function finishCircle(pathID) {
		if (!initialPathsReceived) { return; }
		curPath.dashArray = null;
		curPath.onFrame = null;
		let pathsItem = {
			pathName: 'circle-' + pathID,
			path: curPath
		}
		setPathFunctions(pathsItem, attributes.scale);
		paths.push(pathsItem);
		console.log(paths);
		curPath = new paper.Path.Circle();

		if (LOCKED == socket.id) {
			socket.emit('confirmCircleDone', pathsItem, user);
		}
	}

	function finishRect(pathID, isEllipse) {
		if (!initialPathsReceived) { return; }
		curPath.dashArray = null;
		let type = isEllipse ? 'ellipse-' : 'rect-';

		let pathsItem = {
			pathName: type + pathID,
			path: curPath
		}
		setPathFunctions(pathsItem, attributes.scale);
		paths.push(pathsItem);
		console.log(paths);
		curPath = new paper.Path.Rectangle();

		if (LOCKED == socket.id) {
			socket.emit('confirmRectDone', pathsItem, user);
		}
	}

	function finishTriangle(pathID) {
		if (!initialPathsReceived) { return; }
		curPath.dashArray = null;
		let pathsItem = {
			pathName: 'triangle-' + pathID,
			path: curPath
		}
		setPathFunctions(pathsItem, attributes.scale);
		paths.push(pathsItem);
		console.log(paths);
		curPath = new paper.Path();

		if (LOCKED == socket.id) {
			socket.emit('confirmTriangleDone', pathsItem, user);
		}
	}

	function movePath(newPosition, index) {
		if (!initialPathsReceived) { return; }
		console.log('index of path to move: ' + index);
		paths[index].path.position = newPosition;
	}

	// called when socket receives 'deleteLastPath' message from server. sent
	// when 'undo' button is clicked by user. Pops last drawn path from paths
	// array and removes path from canvas.
	// paths = [ {pathName: "pathN", path: Path} ]
	function deleteLastPath(pathName) {
		if (!initialPathsReceived) { return; }
		let pathObj = paths[paths.length - 1];
		// confirm path to be removed
		if (pathObj && pathObj.pathName == pathName) {
			paths.pop();
			pathObj.path.remove();
			console.log('removed ' + pathObj.pathName);
		}
	}

	// called when socket receives "deleteCurPath" message from server. Signals that
	// lock owner was disconnected and curPath should be removed & LOCK should be unlocked.
	function deleteCurPath(owner) {
		if (!initialPathsReceived) { return; }
		console.log('socket ' + owner + ' disconnected while drawing, releasing lock...');
		curPath.remove();
		curPath = new paper.Path();
		unlockCanvas(owner);
	}

	// returns an object of path attributes
	function getPathAttributes(rand = false) {
		let strokeColor;
		if (rand == true) {
			strokeColor = rgbToHex(Math.random(), Math.random(), Math.random());
			console.log(strokeColor);
		}
		else {
			strokeColor = window.selectedColor;
		}

		let attr = {
			strokeColor: strokeColor,
			strokeWidth: attributes.strokeWidth,
			strokeCap: attributes.strokeCap
		};
		return attr;
	}

	// sets path state other than attributes
	function setPathFunctions(pathsItem, scale) {
		let path = pathsItem.path;
		let pathName = pathsItem.pathName;
		let pathInd = null;			// index of path in paths array on client and server
		let entered = false;		// stops 'leave' event from firing when object is created
		path.onMouseEnter = function (event) {
			if (!entered) {
				entered = true;
				path.strokeWidth = path.strokeWidth + attributes.scale;
			}
		}
		path.onMouseLeave = function (event) {
			if (entered) {
				entered = false;
				path.strokeWidth = path.strokeWidth - attributes.scale;
			}
		}
		// called when path is clicked on
		path.onMouseDown = function (event) {
			// if you arent the lock owner, gtfo
			if (LOCKED && LOCKED != socket.id) { return; }
			// search paths array for path selected
			for (let i = 0; i < paths.length; i++) {
				if (paths[i].path == path) {
					// save index of path in paths array
					pathInd = i;
					// set drawingTool to selector
					setDrawingTool('selector');
					socket.emit('requestLock', user);
					break;
				}
			}
		}
		// called when path is clicked on and dragged
		path.onMouseDrag = function (event) {
			//console.log(event.downPoint);
			if (LOCKED != socket.id) { return; }
			// get new position of path based on new position of mouse
			let x = event.point.x;
			let y = event.point.y;
			// send notification to update location of path at specified index
			socket.emit('requestPathMove', [x, y], pathInd, user);
		}
		// called when path is 'released' from drag
		path.onMouseUp = function (event) {
			if (LOCKED != socket.id) { return; }
			// get final coords of path location and send to server so server
			// can update its records. Sending now prevents server from doing
			// unnecessary updates of path locations while path is still moving.
			let x = paths[pathInd].path.position.x;
			let y = paths[pathInd].path.position.y;
			socket.emit('confirmPathMoved', [x, y], pathInd, user);
		}
	}

	function rgbToHex(r, g, b) {
		r = Math.round(r * 255).toString(16);
		g = Math.round(g * 255).toString(16);
		b = Math.round(b * 255).toString(16);

		if (r.length == 1) { r = "0" + r; }
		if (g.length == 1) { g = "0" + g; }
		if (b.length == 1) { b = "0" + b; }

		return "#" + r + g + b;
	}

	// rotate colors of existing paths
	function rotateColors() {
		if (paths.length > 1) {
			// save color of first path
			let path0Color = paths[0].path.strokeColor;
			// change the rest of the colors by shifting them to the left
			// (to the left to the left, the color that you own pass to the Path on your left)
			for (let i = 0; i < paths.length - 1; i++) {
				paths[i].path.strokeColor = paths[i + 1].path.strokeColor;
			}
			// last path gets firt paths original color
			paths[paths.length - 1].path.strokeColor = path0Color;
		}
	}

	// set all drawing tools to false except the one passed as argument.
	function setDrawingTool(toolChosen) {
		for (let tool in drawingTools) {
			drawingTools[tool] = false;
		}
		drawingTools[toolChosen] = true;
		return drawingTools[toolChosen];
	}

	// returns the tool (string name) that is currently selected, else false.
	function getDrawingTool() {
		for (let tool in drawingTools) {
			if (drawingTools[tool]) { return tool; }
		}
		return false;
	}

	function removeClass(el, className) {
		var elClass = el.className;
		while (elClass.indexOf(className) != -1) {
			elClass = elClass.replace(className, '');
			elClass = elClass.trim();
		}
		el.className = elClass;
	}

	var colorBtns = document.querySelectorAll(".color-box");
	colorBtns.forEach((btn) => {
		btn.onclick = function () {
			//make all buttons inactive
			colorBtns.forEach((btn) => {
				removeClass(btn, "active");
			});

			//make selected button active
			btn.className += " active";

			//set color to button color
			window.selectedColor = btn.attributes["data-color"].value;
			if (window.selectedColor == '#c46f0f') { attributes.multicolor = true; }
			else { attributes.multicolor = false; }
			console.log(window.selectedColor);
		};
	});

	/*     ===================================================================
								   DOWNLOAD & UPLOAD BUTTON
		   =================================================================== */
	var commandBtn = document.querySelector(".download");
	if (commandBtn) {
		commandBtn.onclick = function () {
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
	if (uploadBtn) {
		uploadBtn.addEventListener('click', async (e) => {
			console.log("test uploadbtn with events");
			//selectedFile = e.target.files[0];
			//let i = 0;

			var canvas = document.getElementById("canvas");
			var image = canvas
				.toDataURL("image/png", 1.0);
			//.replace("image/png", "image/octet-stream");
			console.log(typeof (image));
			//console.log(image);
			let imageId = generateURL();



			// create storage ref to empty storage object
			// https://firebase.google.com/docs/reference/js/firebase.storage.Reference#getdownloadurl
			let storageRef = storage.ref();

			// upload file to storage ref location
			image = image.split(',');
			let uploadTask = storageRef.child('chalkboards/' + imageId).putString(image[1], "base64", { contentType: 'image/png' });

			uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
				function (snapshot) {
					// Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
					var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
					var message = document.getElementById('navProgress');
					console.log('Upload is ' + progress + '% done');
					message.innerHTML = 'Uploading: ' + progress + '% ';
					switch (snapshot.state) {
						case firebase.storage.TaskState.PAUSED: // or 'paused'
							console.log('Upload is paused');
							message.innerHTML = 'Upload is paused';
							break;
						case firebase.storage.TaskState.RUNNING: // or 'running'
							console.log('Upload is running');
							break;
					}
				}, function (error) {

					// A full list of error codes is available at
					// https://firebase.google.com/docs/storage/web/handle-errors
					switch (error.code) {
						case 'storage/unauthorized':
							// User doesn't have permission to access the object
							alert('Permission denied.' + error)
							break;

						case 'storage/canceled':
							// User canceled the upload
							alert('Cancelled upload' + error);
							break;

						case 'storage/unknown':
							// Unknown error occurred, inspect error.serverResponse
							alert('Unknown error: ' + error)
							break;
					}
				},
				function () {
					let today = new Date();
					let message = document.getElementById("navProgress");
					message.innerHTML = "Upload complete.";
					uploadTask.snapshot.ref.getDownloadURL()
						.then(
							// Add a new chalkboard with a generated id.
							function (url) {
								db.collection("chalkboards").add({
									owner: auth.currentUser.email,
									img: url,
									date_saved: today
								})
									.then(function (docRef) {
										console.log("SUCCESS: Document written with ID: ", docRef.id);
									})
									.catch(function (error) {
										console.error("Error adding document: ", error);
										alert("Error adding document: ", error);
									});
							}
						);
					message.innerHTML = "";
				});
		});
	}

	var undoBtn = document.querySelector(".undo");
	if (undoBtn) {
		undoBtn.onclick = function () {
			if (!LOCKED) {
				//document.querySelector("[data-tool].active").classList.toggle("active");
				//undoBtn.classList.toggle("active");
				console.log('undo clicked!');
				socket.emit('undo', user);
			}
		}
	}
	else { console.log('undo button not found'); }

	let markerBtn = document.querySelector("#marker");
	if (markerBtn) {
		markerBtn.onclick = function () {
			if (setDrawingTool('marker')) {
				document.querySelector("[data-tool].active").classList.toggle("active");
				markerBtn.classList.toggle("active");
				console.log('marker selected');
			}
			else { console.log('failed to select marker'); }
		}
	}
	else { console.log('marker button not found'); }

	let circleBtn = document.querySelector("#circle");
	if (circleBtn) {
		circleBtn.onclick = function () {
			if (setDrawingTool('circle')) {
				document.querySelector("[data-tool].active").classList.toggle("active");
				circleBtn.classList.toggle("active");
				console.log('circle selected!');
			}
			else { console.log('failed to select circle'); }
		}
	}
	else { console.log('circle button not found'); }

	let ellipseBtn = document.querySelector("#ellipse");
	if (ellipseBtn) {
		ellipseBtn.onclick = function () {
			if (setDrawingTool('ellipse')) {
				document.querySelector("[data-tool].active").classList.toggle("active");
				ellipseBtn.classList.toggle("active");
				console.log('ellipse selected!');
			}
			else { console.log('failed to select ellipse'); }
		}
	}
	else { console.log('ellipse button not found'); }

	let rectBtn = document.querySelector("#rect");
	if (rectBtn) {
		rectBtn.onclick = function () {
			if (setDrawingTool('rect')) {
				
				
				document.querySelector("[data-tool].active").classList.toggle("active");
				rectBtn.classList.toggle("active");
				console.log('rectangle selected!');
			}
			else { console.log('failed to select rectange'); }
		}
	}
	else { console.log('rectangle button not found'); }

	let triangleBtn = document.querySelector("#triangle");
	if (triangleBtn) {
		triangleBtn.onclick = function () {
			if (setDrawingTool('triangle')) {
				document.querySelector("[data-tool].active").classList.toggle("active");
				triangleBtn.classList.toggle("active");
				console.log('triangle selected!');
			}
			else { console.log('failed to select triangle'); }
		}
	}
	else { console.log('triangle button not found'); }

	let eraserBtn = document.querySelector("#eraser");
	if (eraserBtn) {
		eraserBtn.onclick = function () {
			if (setDrawingTool("eraser")) {
				document.querySelector("[data-tool].active").classList.toggle("active");
				eraserBtn.classList.toggle("active");
				console.log('eraser selected');
			}
			else { console.log('failed to select eraser'); }
		}
	}
	else { console.log('eraser button not found'); }
}