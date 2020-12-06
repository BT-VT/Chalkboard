window.globalVar = "";
window.selectedColor = '#000000';

import User from "./user.js";
import Homepage from "./homepage.js";

export let user = new User(
  "Guest" + Math.floor(Math.random() * 10000),
  "default"
);
export let socket = io();
export function paperSockets() {

	let toolType = null;
	//window.onload = function() {

	// Simple example, see optional options for more configuration.
	const pickr = Pickr.create({
		el: '.color-picker',
		theme: 'classic', // or 'monolith', or 'nano'
		default: window.selectedColor,
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
		window.selectedColor = hexColor.toString();
		document.getElementsByClassName('pcr-button')[0].style.color= hexColor;

	})
	pickr.on('save', (color, instance) => {
		pickr.addSwatch(color.toHEXA().toString());
	})


/* ======================================== Paper.js ============================================ */

	// Setup directly from canvas id:
	paper.setup('canvas');
	//document.getElementById('canvas').height = 5000;
	paper.view.viewSize.height = 3500;
	paper.view.viewSize.width = 2000;
	var tool = new paper.Tool();
    const homepage = new Homepage();

    // video and audio global variables
    const videoGrid = document.getElementById('video-grid');
    const myVideo = document.createElement('video');            // video obj for this client
    myVideo.muted = true;                                       // client mutes own video obj to stop from hearing self
    const myCalls = {};
    let myPeer;

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
    var slider = document.getElementById("slider");
    slider.addEventListener("input", sliderChange);
    var sliderSize;
    function sliderChange() {
		sliderSize = this.value;
		document.getElementById('valueSlider').innerHTML = sliderSize;
        attributes.fontSize = sliderSize;
        attributes.strokeWidth = sliderSize;
        console.log(sliderSize);
	}

	let attributes = {
		multicolor: false,
		strokeWidth: slider.value,
		strokeCap: 'round',
        fontFamily: 'Courier New',
        //fontSize: 14,
		dashOffset: 1,
		scale: 2,
		rotation: 1
	}

	let drawingTools = {
		marker: true,
		circle: false,
		rect: false,
		ellipse: false,
		triangle: false,
		line: false,
		colorFill: false,
		grab: false,
        text: false,
        textEdit: false,
		eraser: false,
        save: false
	}

	// socket listeners
	socket.on('addPaths', addPaths);					// initializes the canvas
    socket.on('userLeftSession', userLeftSession);
	socket.on('lockCanvas', lockCanvas);				// prevents user from drawing
	socket.on('createNewDrawing', createNewDrawing);	// starts a path
	socket.on('drawSegment', drawSegment);				// extends a path
	socket.on('drawTrackingCircle', drawTrackingCircle);
	socket.on('drawTrackingRect', drawTrackingRect);
	socket.on('drawTrackingTriangle', drawTrackingTriangle);
	socket.on('drawTrackingLine', drawTrackingLine);
    socket.on('updateImageSize', updateImageSize);
    socket.on('setPointText', setPointText);
    socket.on('editText', editText);
    socket.on('textBackspace', textBackspace);
    socket.on('addTextChar', addTextChar);
    socket.on('addImageToCanvas', addImageToCanvas);
	socket.on('erasePath', erasePath);
	socket.on('finishDrawing', finishDrawing);			// ends a path and unlocks canvas
	socket.on('finishCircle', finishCircle);
	socket.on('finishRect', finishRect);
	socket.on('finishTriangle', finishTriangle);
	socket.on('finishLine', finishLine);
    socket.on('finishText', finishText);
    socket.on('finishEditText', finishEditText);
	socket.on('unlockCanvas', unlockCanvas);			// allows user to draw
	socket.on('deleteLastPath', deleteLastPath);		// send when "undo" is clicked
	socket.on('deleteCurPath', deleteCurPath);			// sent if lock owner is disconnected.
	socket.on('movePath', movePath);
	socket.on('rotatePath', rotatePath);
	socket.on('newStrokeColor', newStrokeColor);
	socket.on('colorFill', colorFill);

	// notify server to send existing session paths
	socket.emit('hello', user);

	// called by every non-drawing client when one client begins drawing.
	// prevents other clients from emitting drawing coordinates to server
	function lockCanvas(owner, user) {
		LOCKED = owner;
		console.log('canvas LOCKED by socket ' + owner);
		let msg = document.getElementById("navProgress");
		msg.setAttribute('style', 'font-size: 16px;color:#FFF;padding-top:10px;padding-right:75px');
		msg.innerHTML = user.name + " is drawing...";
		return LOCKED;
	}

	function unlockCanvas(owner) {
		if (owner == false || LOCKED == owner) {
			LOCKED = false;
			console.log('canvas is UNLOCKED');
		}
		let msg = document.getElementById('navProgress');
		msg.innerHTML = "";
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
	// newPaths = [ {pathName: name, path: pathObj}, ... , {pathName: name, path: pathObj} ]
	function addPaths(newPaths) {
        if(user.sessionID == 'default') {
            LOCKED = false;
            initialPathsReceived = true;
            setupVideoRoom();
            homepage.addWelcomeText();
            return;
        }
		if (!initialPathsReceived) {
			LOCKED = false;
			initialPathsReceived = true;
			console.log('adding new paths ...... ');
			// add each path from server to client paths array. pathObj is a Path-like
			// object that must be converted to a Paper.js Path
			for (let newPathsItem of newPaths) {
				// extract newPathsItem values
				let pathName = newPathsItem.pathName;
				let pathObj = newPathsItem.path;
				let pathsItem = { pathName: pathName }

				console.log('adding path ' + pathsItem.pathName);
				if (pathName.search('path') > -1) {
					pathsItem.path = new paper.Path().importJSON(pathObj);
				}
				else if (pathName.search('circle') > -1) {
					pathsItem.path = new paper.Path.Circle().importJSON(pathObj);
				}
				else if (pathName.search('rect') > -1) {
					pathsItem.path = new paper.Path.Rectangle().importJSON(pathObj);
				}
				else if (pathName.search('ellipse') > -1) {
					pathsItem.path = new paper.Path.Ellipse().importJSON(pathObj);
				}
				else if (pathName.search('triangle') > -1) {
					pathsItem.path = new paper.Path().importJSON(pathObj);
				}
				else if (pathName.search('line') > -1) {
					pathsItem.path = new paper.Path.Line().importJSON(pathObj);
				}
                else if (pathName.search('text') > -1) {
                    pathsItem.path = new paper.PointText().importJSON(pathObj);
                }
                else if (pathName.search('image') > -1) {
                    pathsItem.path = new paper.Raster().importJSON(pathObj);
                }
				setPathFunctions(pathsItem, attributes.scale);
				paths.push(pathsItem);
			}

            setupVideoRoom();
		}
	}

    // called when client receives userLeftSession message from server. Manually
    // ends the call with another client, which is faster than waiting for peer.js
    // to do it automatically. (not currently used)
    function userLeftSession(userID) {
        if(myCalls[userID]) {
            console.log('user:' + userID + ' leaving session');
            myCalls[userID].close();
        }
    }

    function setupVideoRoom() {
        // connect to the peer server
        myPeer = new Peer(socket.id);
        // request to use video/audio from client device
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        }).then(stream => {
            stream.getTracks().forEach(track => track.enabled = false);
            // add clients own video stream to clients video grid
            addVideoStream(myVideo, stream);

            // let server know client is connected, so server can broadcast
            // userJoinedSession message to all clients in the same session
            socket.emit('confirmSessionJoined', user);

            // when server notifies this client that a new user has joined the
            // session, call that new user user to begin sharing video streams.
            // userID is the socket ID of the new user joining the session, which
            // acts as the user ID for the new user in the video call
            socket.on('userJoinedSession', (userID) => {
                connectToNewUser(userID, stream);
            });

            // when client receives a call from another client, answer it and
            // add that clients stream to this clients video grid
            myPeer.on('call', (call) => {
                call.answer(stream);
                const video = document.createElement('video');
                call.on('stream', (userVideoStream) => {
                    addVideoStream(video, userVideoStream);
                });

                // set listener to remove stream on receiving clients end if
                // initiating client disconnects
                call.on('close', () => {
                    console.log('removing video stream');
                    video.remove();
                })

                // add call to call-list, tracks which client is linked to which call,
                // call.peer is peerID of peer on other end of call.
                myCalls[call.peer] = call;
            });

            // when a client clicks the mute button, toggle audio/video stream off
            // for that client
            let muteBtn = document.querySelector("#mute");
        	if (muteBtn) {
        		muteBtn.onclick = function() {
                    console.log('mute clicked!')
                    muteBtn.classList.toggle("active");
                    stream.getTracks().forEach(track => track.enabled = !track.enabled);
                }
            }
        })
    }

    // send a new user this clients video stream, then when the user responds
    // with their video stream, add it to this clients video grid
    function connectToNewUser(userID, stream) {
        console.log('connecting to new user: ' + userID);
        const call = myPeer.call(userID, stream);
        const video = document.createElement('video');
        call.on('stream', (userVideoStream) => {
            addVideoStream(video, userVideoStream);
        });
        // set listener to remove stream on initiating clients end if receiving
        // client disconnects
        call.on('close', () => {
            console.log('removing video stream');
            video.remove();
        })

        // add call to call list to track which client is linked to which call,
        // call.peer is peerID of peer on other end of call.
        myCalls[call.peer] = call;
    }

    // assigns video stream to video object and appends video object to
    // the html video array for viewing on client's webpage
    function addVideoStream(video, stream)  {
        video.srcObject = stream;
        video.addEventListener('loadedmetadata', () => {
            video.play();
        })
        videoGrid.append(video);
    }

    // event listener called when a keyboard key is pressed
	tool.onKeyDown = (event) => {
		console.log(event.key + ' key was pressed');
        // a list of keys to ignore default actions for
        let keys = ['backspace', 'space', 'left', 'right', "'", 'enter'];
        // a list of attributes that use keyboard keys, if one is being used,
        // the keys in the keys array should have their default actions prevented
        let attrs = [drawingTools.colorFill, drawingTools.grab, drawingTools.text, drawingTools.textEdit];
        const hasTrueVal = (acc, curVal) => acc || curVal;

        if(keys.includes(event.key) && attrs.reduce(hasTrueVal)) {
            event.preventDefault();
        }

        // if the text box is selected and this user owns the lock, aka has
        // clicked on the canvas to create a PointText / claim the lock, Then
        // edit the PointText accordingly
        if(LOCKED == socket.id && (drawingTools.text || drawingTools.textEdit)){
            console.log('current text: ' + curPath.content);
            // the shift+enter key combo creates new line
            if(paper.Key.isDown('shift') && paper.Key.isDown('enter')) {
                socket.emit('requestAddTextChar', socket.id, '\n', user);
            }
            // enter key ends text editing
            else if(paper.Key.isDown('enter')) {
                // if a user was editing a pre-existing text string, it should be handled
                // differently than a string that needs to be added to the paths list when complete.
                if(drawingTools.textEdit) { socket.emit('requestFinishEditText', user); }
                else { socket.emit('requestFinishText', user); }
            }
            // remove the last char in the text box
            else if(event.key == 'backspace') {
                socket.emit('requestTextBackspace', socket.id, user);
            }
            // add the char pressed to the text box, ignoring non-character keys
            else if(event.character != '') {
                socket.emit('requestAddTextChar', socket.id, event.character, user);
            }
        }
	}

    function textBackspace(lockOwner) {
        if(!initialPathsReceived || LOCKED != lockOwner) { return }
        curPath.content = curPath.content.slice(0, -1);
        curPath.data.setBounds(curPath);
    }

    function addTextChar(lockOwner, char) {
        console.log('adding char to text');
        if(!initialPathsReceived || LOCKED != lockOwner) { return }
        curPath.content += char;
        // adjust the boundary box using custom func attached to path
        curPath.data.setBounds(curPath);
    }

	// notify users to create a new path. Repetitive for debugging purposes
	tool.onMouseDown = function (event) {
		if (!LOCKED || LOCKED == socket.id) {
			if (drawingTools.marker) {
				let pathAttr = getPathAttributes(attributes.multicolor);
				socket.emit('requestNewDrawing', pathAttr, user);
			}
			else if (drawingTools.circle) {
        let pathAttr = getPathAttributes(attributes.multicolor);
				socket.emit('requestLock', user);
			}
			else if (drawingTools.rect || drawingTools.ellipse) {
        let pathAttr = getPathAttributes(attributes.multicolor);
				socket.emit('requestLock', user);
			}
			else if (drawingTools.triangle) {
        let pathAttr = getPathAttributes(attributes.multicolor);
				socket.emit('requestLock', user);
			}
			else if (drawingTools.line) {
        let pathAttr = getPathAttributes(attributes.multicolor);
				socket.emit('requestLock', user);
			}
            else if (drawingTools.text) {
              let pathAttr = getPathAttributes(attributes.multicolor);
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
        strokeWidth: attributes.strokeWidth
			}
			socket.emit('requestTrackingCircle', circleAttr, user);
		}
		else if (drawingTools.rect || drawingTools.ellipse) {
			let rectAttr = {
				from: [event.downPoint.x, event.downPoint.y],
				to: [event.point.x, event.point.y],
				dashArray: [2, 2],
				strokeColor: window.selectedColor,
				strokeWidth: attributes.strokeWidth,
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
				strokeWidth: attributes.strokeWidth,
				closed: true
			}
			socket.emit('requestTrackingTriangle', triangleAttr, user);
		}
		else if (drawingTools.line) {
			let lineAttr = {
				from: [event.downPoint.x, event.downPoint.y],
				to: [event.point.x, event.point.y],
				dashArray: [2, 2],
				strokeColor: window.selectedColor,
				strokeWidth: attributes.strokeWidth
			}
			socket.emit('requestTrackingLine', lineAttr, user);
		}
		// paths = [ {pathName: "pathN", path: Path} ]
		else if (drawingTools.eraser && event.item) {
            // require shift to be held in order to erase an image
            if(event.item.data.type == 'image' && !paper.Key.isDown('shift')) { return; }
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

	function drawTrackingLine(lineAttr) {
		if (!initialPathsReceived) { return; }
		curPath.remove();
		curPath = new paper.Path.Line(lineAttr);
		curPath.onFrame = function (event) {
			this.dashOffset += attributes.dashOffset;
		}
	}

    // called when updateImageSize is received from server. changes the size of
    // a raster specified by its index location in the paths array.
    function updateImageSize(newBounds, index) {
        if (!initialPathsReceived) { return; }
        paths[index].path.bounds = newBounds;
    }

    // called when setPointText is received from server.
    // creates a new paper.js text object at a location specified by the user.
    // the location and all attributes are stored in pointTextAttr..
    function setPointText(pointTextAttr) {
        if (!initialPathsReceived) { return; }
        // remove existing path, including boundary rectangle if new PointText
        // is requested in the middle of another PointText's creation
        if(curPath.data.bounds) { curPath.data.bounds.remove(); }
        curPath.remove();
        // create new textPoint, add red dashed bounding rectangle to show
        // text box while text is still being edited
        curPath = new paper.PointText(pointTextAttr);
        // create a function that will reset the bounding rectangle of text
        // when called
        curPath.data.setBounds = (txt) => {
            // remove existing bounding rectangle if one exists
            if(txt.data.bounds) { txt.data.bounds.remove(); }
            // create new one based on bounds of text (provided by paper.js)
            txt.data.bounds = new paper.Path.Rectangle(txt.bounds);
            txt.data.bounds.style = {
                dashArray: [2, 2],
                strokeColor: 'red',
                strokeWidth: 2
            }
            // make dashes animated
            txt.data.bounds.onFrame = function (event) {
    			this.dashOffset += attributes.dashOffset;
    		}
        }
    }

    // called when editText message is received from server, signifying a user
    // is trying to edit an existing text box.
    function editText(index) {
        if (!initialPathsReceived) { return; }
        curPath.remove();
        curPath = paths[index].path;
        curPath.data.setBounds(curPath);
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
		else if (drawingTools.line) {
			socket.emit('requestFinishLine', user);
			return;
		}
        else if (drawingTools.text) {
            let pointTextAttr = {
				point: [event.point.x, event.point.y],
				fillColor: window.selectedColor,
				fontFamily: attributes.fontFamily,
                fontSize: attributes.fontSize,
                content:''
			}
			socket.emit('requestPointText', pointTextAttr, user);
        }
		else if (drawingTools.eraser) {
			socket.emit('requestFinishErasing', user);
			return;
		}
	}

	// takes a pathsItem, which is stored in a Paths array of the client, and
	// returns a copy of it where its path variable is serialized as a JSON string.
	// The serialized version will be sent to the server, and is now in a format
	// that can be stored in the FireStore DB.
	let serializedPathsItem = (pathsItem) => {
        // if path is scaled up from being hovered over with mouse, scale it down
        // before serialization
        if(pathsItem.path.data.scaled) {
            pathsItem.path.strokeWidth = pathsItem.path.strokeWidth - attributes.scale;
            pathsItem.path.data.scaled = false;
        }
		return {
			pathName: pathsItem.pathName,
			path: pathsItem.path.exportJSON()
		}
	}

	// takes a client-side paths array with pathsItems containing paper.js Paths
	// objects, and returns an equivalent array where the Paths objects are
	// serialized in JSON string format, which allows the paths array to be
	// saved to the FireStore DB.
	let serializedPaths = (paths) => {
		return paths.map( pathsItem => {
			return serializedPathsItem(pathsItem);
		});
	}

	// called when socket receives "finishPath" message. Smooths the path, adds
	// finished path to paths array, and unlocks the canvas for drawing.
	// pathID is a uuid created by the server that will uniquely ID the new path
	// from all other paths that exist or will exist
	function finishDrawing(pathID, user) {
		if (initialPathsReceived == false) {
			console.log('waiting to load paths');
			return;
		}
		curPath.simplify();
        curPath.data.scaled = false;
        curPath.data.type = 'path';
        curPath.data.id = pathID;
		// add new path to paths array as path Item
		let pathsItem = {
			pathName: 'path-' + pathID,
			path: curPath
		}
        // set listeners for individual paths, then add path to paths list
		setPathFunctions(pathsItem, attributes.scale);
		paths.push(pathsItem);
		curPath = new paper.Path();
		console.log(paths);

		if (LOCKED == socket.id) {
			console.log(socket.id + ' sending drawingDone confirmation to server');
			// serialize path before sending to server
			socket.emit('confirmDrawingDone', serializedPathsItem(pathsItem), user);
		}
	}

	function finishCircle(pathID) {
		if (!initialPathsReceived) { return; }
		curPath.dashArray = null;
		curPath.onFrame = null;
        curPath.data.scaled = false;
        curPath.data.type = 'circle';
        curPath.data.id = pathID;
        // add new path to paths array as pathItem
		let pathsItem = {
			pathName: 'circle-' + pathID,
			path: curPath
		}
        // set listeners for individual paths, then add path to paths list
		setPathFunctions(pathsItem, attributes.scale);
		paths.push(pathsItem);
		console.log(paths);
		curPath = new paper.Path.Circle();

		if (LOCKED == socket.id) {
			socket.emit('confirmCircleDone', serializedPathsItem(pathsItem), user);
		}
	}

	function finishRect(pathID, isEllipse) {
		if (!initialPathsReceived) { return; }
		let type = isEllipse ? 'ellipse' : 'rect';
        curPath.dashArray = null;
        curPath.onFrame = null;
        curPath.data.scaled = false;
        curPath.data.type = type;
        curPath.data.id = pathID;
        // add new path to paths array as pathItem
		let pathsItem = {
			pathName: type + '-' + pathID,
			path: curPath
		}
        // set listeners for individual paths, then add path to paths list
		setPathFunctions(pathsItem, attributes.scale);
		paths.push(pathsItem);
		console.log(paths);
		curPath = new paper.Path.Rectangle();

		if (LOCKED == socket.id) {
			socket.emit('confirmRectDone', serializedPathsItem(pathsItem), user);
		}
	}

	function finishTriangle(pathID) {
		if (!initialPathsReceived) { return; }
		curPath.dashArray = null;
        curPath.onFrame = null;
        curPath.data.scaled = false;
        curPath.data.type = 'triangle';
        curPath.data.id = pathID;
		let pathsItem = {
			pathName: 'triangle-' + pathID,
			path: curPath
		}
        // set listeners for individual paths, then add path to paths list
		setPathFunctions(pathsItem, attributes.scale);
		paths.push(pathsItem);
		console.log(paths);
		curPath = new paper.Path();

		if (LOCKED == socket.id) {
			socket.emit('confirmTriangleDone', serializedPathsItem(pathsItem), user);
		}
	}

	function finishLine(pathID) {
		if (!initialPathsReceived) { return; }
		curPath.dashArray = null;
        curPath.onFrame = null;
        curPath.data.scaled = false;
        curPath.data.type = 'line';
        curPath.data.id = pathID;

		let pathsItem = {
			pathName: 'line-' + pathID,
			path: curPath
		}
        // set listeners for individual paths, then add path to paths list
		setPathFunctions(pathsItem, attributes.scale);
		paths.push(pathsItem);
		console.log(paths);
		curPath = new paper.Path.Line();

		if (LOCKED == socket.id) {
			socket.emit('confirmLineDone', serializedPathsItem(pathsItem), user);
		}
	}

    function finishText(pathID) {
        if (!initialPathsReceived) { return; }
        curPath.data.bounds.remove();
        curPath.data.scaled = false;
        curPath.data.type = 'text';
        curPath.data.id = pathID;
        let pathsItem = {
            pathName: 'text-' + pathID,
            path: curPath
        }
        // set listeners for individual paths, then add path to paths list
        setPathFunctions(pathsItem, attributes.scale);
        paths.push(pathsItem);
        console.log(paths);
        curPath = new paper.PointText();

        if(LOCKED == socket.id) {
            socket.emit('confirmTextDone', serializedPathsItem(pathsItem), user);
        }
    }

    function finishEditText() {
        if (!initialPathsReceived) { return; }
        // get index of text path being edited
        let index = paths.findIndex(pathItem => pathItem.path == curPath);
        // remove the boundary box
        curPath.data.bounds.remove();
        console.log(paths);
        curPath = new paper.PointText();
        if(LOCKED == socket.id) {
            setDrawingTool('grab');
            let updatedPath = serializedPathsItem(paths[index]).path;
            socket.emit('confirmPathUpdated', updatedPath, index, user);
        }
    }

	// callback when socket receives message from server to change location of path.
	// index is the index of the path to make changes to in the paths array.
	function movePath(newPosition, index) {
		if (!initialPathsReceived) { return; }
		console.log('index of path to move: ' + index);
		paths[index].path.position = newPosition;
	}
	// callback for rotating a path
	function rotatePath(degrees, index) {
		if(!initialPathsReceived) { return; }
		console.log('rotating path ' + degrees + ' degrees');
		paths[index].path.rotate(degrees);
	}
	// callback for changing stroke color of a path.
    // check colorFill() for details
	function newStrokeColor(color, index, owner) {
		if(!initialPathsReceived) { return; }
        // change stroke color of path
        if(paths[index].path.data.type != 'text') {
            paths[index].path.strokeColor = color;
            if(socket.id == owner) {
                let updatedPath = serializedPathsItem(paths[index]).path;
                socket.emit('confirmPathUpdated', updatedPath, index, user);
            }
        }
	}
	// callback for changing fill color of a path, or text color. Also removes
    // fill color or text bounds box
	function colorFill(color, index, owner) {
		if (!initialPathsReceived) { return; }
        console.log('change path color to: ' + color);
        // dont set text colorFill to null, this is equivalent to setting a
        // shapes strokeColor to null.
        if (color || paths[index].path.data.type != 'text') {
            // change the color of the path
    		paths[index].path.fillColor = color;
            // if this is the client who requested the color change, notify server
            if(socket.id == owner) {
                console.log('sending updated path to server');
                // serialize updated path and send to server to be saved on sererside
                let updatedPath = serializedPathsItem(paths[index]).path;
                socket.emit('confirmPathUpdated', updatedPath, index, user);
            }
        }
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

	// sets path state other than attributes, such as functions for making paths
	// 'pop' when hovered over (enter/leave), and functions for grabbing/moving.
	// This function sets event listeners directly on individual paths
	function setPathFunctions(pathsItem, scale) {
		let path = pathsItem.path;
		let pathName = pathsItem.pathName;
		let pathInd = null;			// index of path in paths array on client and server
		// mouseEnter and mouseLeave used to make path 'pop' when hovered over
		path.onMouseEnter = function (event) {
			if (!path.data.scaled) {
				path.strokeWidth = Number(path.strokeWidth) + attributes.scale;
                path.data.scaled = true;
			}
		}
		path.onMouseLeave = function (event) {
			if (path.data.scaled) {
				path.strokeWidth = Number(path.strokeWidth) - attributes.scale;
                path.data.scaled = false;
			}
		}
		// called when path is clicked on
		path.onMouseDown = function (event) {
			// if canvas is locked and you're not the owner, gtfo
			if (LOCKED && LOCKED != socket.id) { return; }

			if(drawingTools.grab) {
				// search paths array for path selected
				pathInd = paths.findIndex(pathItem => pathItem.path == path);
				socket.emit('requestLock', user);
			}
			else if(drawingTools.colorFill) {
				pathInd = paths.findIndex(pathItem => pathItem.path == path);
				// if delete/backspace key is held down when line is clicked on
				if(paper.Key.isDown('backspace')) {
					// tell server to notify clients to set path fill color no empty
					socket.emit('requestColorFill', null, pathInd, user);
				}
				// if the 'shift' key is held down when line is clicked on
				else if(paper.Key.isDown('shift')) {
					// change stroke color of path instead of fill color of path
					socket.emit('requestNewStrokeColor', window.selectedColor, pathInd, user);
				}
				else {
					socket.emit('requestColorFill', window.selectedColor, pathInd, user);
				}
			}
		}
		// called when path is clicked on and dragged
		path.onMouseDrag = function (event) {
			// if you don't own the lock or the drawing tool wasnt selected, dont move item
			if (LOCKED != socket.id || drawingTools.grab != true) { return; }
			if(paper.Key.isDown('left')) {
				socket.emit('requestPathRotate', (-1)*attributes.rotation, pathInd, user);
			}
			else if (paper.Key.isDown('right')) {
				socket.emit('requestPathRotate', attributes.rotation, pathInd, user);
			}
            else if(paper.Key.isDown('shift') && path.data.type != 'text') {
                // if client is trying to adjust size of image, get new image bounds
                // and send to server.
                let newBounds = {
                    x: path.bounds.x,
                    y: path.bounds.y,
                    width: event.point.x - path.bounds.x,
                    height: event.point.y - path.bounds.y
                }
                socket.emit('requestUpdateImageSize', newBounds, pathInd, user);
            }
			else if(!paper.Key.isDown('shift')) {
				// get new position of path based on new position of mouse
				let x = event.point.x;
				let y = event.point.y;
				// send notification to update location of path at specified index
				socket.emit('requestPathMove', [x, y], pathInd, user);
			}
		}
		// called when path is 'released' from drag
		path.onMouseUp = function (event) {
			if (LOCKED != socket.id || drawingTools.grab != true) { return; }
            console.log('up event on specific path, should only be called when tool = grab');

            if(paper.Key.isDown('shift') && path.data.type == 'text') {
                setDrawingTool('textEdit');
                socket.emit('requestEditText', pathInd, user);
            }
            else {
                // get the serialized version of the path that was moved, which contains
    			// its new coordinates. Then send it to the server so the server can
    			// update its paths array.
    			let updatedPath = serializedPathsItem(paths[pathInd]).path;
    			socket.emit('confirmPathUpdated', updatedPath, pathInd, user);
            }
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


/* ================================ IMAGE UPLOAD TO CANVAS ================================= */

// use image to trigger file selection when clicked
let fileButton = document.getElementById('image-upload');
let fileInput = document.getElementById('file-input');

if(fileButton && fileInput) {
    // on image click, trigger file selection click.
    fileButton.onclick = () => { fileInput.click(); }
    // handle file input click
    fileInput.onclick = () => {
        console.log('file Button clicked');
        if(!LOCKED) { socket.emit('requestLock', user); }
    }
    // when new file is selected, add it to cloud storage and send url of image
    // to server so server can broadcast it to all clients to download/upload (addImageToCanvas)
    fileInput.addEventListener('change', async (e) => {
        console.log('file button changed...');
        if(!LOCKED || LOCKED == socket.id) {
            console.log('lock is free, uploading image to cloud');
            let url = await uploadImageToCloud(e);
            console.log('adding image to canvas');
            // call function that takes URL as arg and adds img to canvas.
            socket.emit('requestAddImageToCanvas', url, user);
            // addImageToCanvas(url);
        }
        else {
            console.log('lock not owned, cannot upload image');
        }
    });
}

// called when single client selects file with file selector button
let uploadImageToCloud = (e) => {
    return new Promise( (resolve, reject) => {
        console.log('uploading image to google cloud storage');
        // get file
        let file = e.target.files[0];
        if(!file) { reject(false); }
        // create storage ref to empty storage object
        // https://firebase.google.com/docs/reference/js/firebase.storage.Reference#getdownloadurl
        let storageRef = firebase.storage().ref('chalkboardImages/' + file.name);
        // upload file to storage ref location
        let task = storageRef.put(file);

        // update progress log and save download URL
        // https://firebase.google.com/docs/reference/js/firebase.storage.UploadTask#on
        task.on('state_changed',
            // called when upload state of upload changes
            function progress(snapshot) {
                // update progress log
                let percentage = snapshot.bytesTransferred /
                                    snapshot.totalBytes * 100;
                console.log('upload: ' + percentage + '%');
            },
            // called when upload fails
            function error(err) {
                console.log(err);
            },
            // called when upload finishes, get URL and display corresponding image
            async function complete() {
                console.log('upload complete');
                try {
                    let url = await storageRef.getDownloadURL();
                    if(url) {
                        console.log('retrieved url of image from cloud storage');
                        resolve(url);
                    }
                } catch (err) {
                    console.log(err);
                    reject(false);
                }
            }
        );
    });
}

// use a supplied URL to download an image and add it to the canvas
function addImageToCanvas(url, pathID) {
    let raster = new paper.Raster( { crossOrigin: 'anonymous', source: url } );
    raster.onLoad = () => {
        console.log('image loaded to canvas');
        // adjust image to half size of canvas
        raster.scale(0.5);
        raster.bounds.topLeft = {x: 0, y: 0};

        // add individual path data that's used for other functions
        raster.data.scaled = false;
        raster.data.type = 'image';
        raster.data.id = pathID;
		// add new path to paths array as path Item
		let pathsItem = {
			pathName: 'image-' + pathID,
			path: raster
		}
        // set listeners for individual paths, then add path to paths list
		setPathFunctions(pathsItem, attributes.scale);
		paths.push(pathsItem);
		console.log(paths);

		if (LOCKED == socket.id) {
			console.log(socket.id + ' sending imageUploadDone confirmation to server');
			// serialize path before sending to server
			socket.emit('confirmImageUpload', serializedPathsItem(pathsItem), user);
		}
        return raster;
    }
}

/* ================================ DONE IMAGE UPLOAD TO CANVAS ============================ */


	var uploadBtn = document.querySelector(".upload");
	var selectedFile;
	if (uploadBtn) {
		uploadBtn.addEventListener('click', async (e) => {
            if(user.sessionID == 'default') {
                console.log('cannot save default page');
                return;
            }
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


			uploadTask.on(
				firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
				function (snapshot) {
				  // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
				  var progress =
					(snapshot.bytesTransferred / snapshot.totalBytes) * 100;
				  var message = document.getElementById("navProgress");
				  console.log("Upload is " + progress + "% done");
				  message.innerHTML = "Uploading: " + progress + "% ";
				  switch (snapshot.state) {
					case firebase.storage.TaskState.PAUSED: // or 'paused'
					  console.log("Upload is paused");
					  message.innerHTML = "Upload is paused";
					  break;
					case firebase.storage.TaskState.RUNNING: // or 'running'
					  console.log("Upload is running");
					  break;
				  }
				},
				function (error) {
				  // A full list of error codes is available at
				  // https://firebase.google.com/docs/storage/web/handle-errors
				  switch (error.code) {
					case "storage/unauthorized":
					  // User doesn't have permission to access the object
					  alert("Permission denied." + error);
					  break;

					case "storage/canceled":
					  // User canceled the upload
					  alert("Cancelled upload" + error);
					  break;

					case "storage/unknown":
					  // Unknown error occurred, inspect error.serverResponse
					  alert("Unknown error: " + error);
					  break;
				  }
				},
				function () {
				  let today = new Date();
				  let message = document.getElementById("navProgress");
				  message.innerHTML = "Upload complete.";
				  // Get chalkboard paths from server in serialized form to save to database
				  let edits = serializedPaths(paths);
				  let href = window.location.href;
				  let title_span = document.getElementById("chalkboard-title");
				  title_span.innerHTML = user.sessionID;
				  let chalkboard_title = title_span.value || "";
				  let session_id = user.sessionID;
				  uploadTask.snapshot.ref
					.getDownloadURL()
					.then(
					  // Add a new chalkboard with a generated id.
					  function (url) {
						db.collection("chalkboards").doc(session_id)
						  .set({
							owner: auth.currentUser.email,
							img: url,
							date_saved: today,
							edits: edits,
							url: href,
							title: chalkboard_title
						  })
						  .then(function (docRef) {
							console.log(
								//	This throws an error when adding a document with a custom ID
							  //"SUCCESS: Document written with ID: ",
							  //docRef.id
							  "SUCCESS: Document was written to database."
							);
						  })
						  .catch(function (error) {
							console.error("Error adding document: ", error);
							alert("Error adding document: ", error);
							message.innerHTML = "Error uploading document: " + error;
						  });
					  }
					)
					.catch(function (error) {
					  console.error("Error adding document: ", error);
					  alert("Error adding document: ", error);
					  message.innerHTML = "Error uploading document: " + error;
					});
				  message.innerHTML = "";
				}
			  );
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
        document.querySelector('#canvas').style.cursor = "url(images/pen-2.png), auto";
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
        document.querySelector('#canvas').style.cursor = "auto";
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
        document.querySelector('#canvas').style.cursor = "auto";
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
        document.querySelector('#canvas').style.cursor = "auto";
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
        document.querySelector('#canvas').style.cursor = "auto";
				console.log('triangle selected!');
			}
			else { console.log('failed to select triangle'); }
		}
	}
	else { console.log('triangle button not found'); }

	let lineBtn = document.querySelector("#line");
	if(lineBtn) {
		lineBtn.onclick = function() {
			if(setDrawingTool('line')) {
				document.querySelector("[data-tool].active").classList.toggle("active");
        lineBtn.classList.toggle("active");
        document.querySelector('#canvas').style.cursor = "auto";
				console.log('line selected!');
			}
			else { console.log('failed to select line'); }
		}
	}
	else { console.log('line button not found'); }

	let fillBtn = document.querySelector("#fill");
	if(fillBtn) {
		fillBtn.onclick = function() {
			if(setDrawingTool('colorFill')) {
				document.querySelector("[data-tool].active").classList.toggle("active");
        fillBtn.classList.toggle("active");
        document.querySelector('#canvas').style.cursor = "url(images/paint-fill.png), auto";
				console.log('color fill selected!');
			}
			else { console.log('failed to select color fill'); }
		}
	}
	else { console.log('fill button not found'); }

	let grabBtn = document.querySelector("#grab");
	if(grabBtn) {
		grabBtn.onclick = function() {
			if(setDrawingTool('grab')) {
				document.querySelector("[data-tool].active").classList.toggle("active");
        grabBtn.classList.toggle("active");
        document.querySelector('#canvas').style.cursor = "url(images/grab-2.png), auto";
				console.log('grab selected!');
			}
			else { console.log('failed to select grab'); }
		}
	}
	else { console.log('grab button not found'); }

    let textBtn = document.querySelector("#text");
	if(textBtn) {
		textBtn.onclick = function() {
			if(setDrawingTool('text')) {
				document.querySelector("[data-tool].active").classList.toggle("active");
        textBtn.classList.toggle("active");
        document.querySelector('#canvas').style.cursor = "text";
				console.log('text selected!');
			}
			else { console.log('failed to select text'); }
		}
	}
	else { console.log('Text button not found'); }

	let eraserBtn = document.querySelector("#eraser");
	if (eraserBtn) {
		eraserBtn.onclick = function () {
			if (setDrawingTool("eraser")) {
				document.querySelector("[data-tool].active").classList.toggle("active");
        eraserBtn.classList.toggle("active");
        document.querySelector('#canvas').style.cursor = "url(images/eraser-2.png), auto";
				console.log('eraser selected');
			}
			else { console.log('failed to select eraser'); }
		}
	}
	else { console.log('eraser button not found'); }

    let saveBtn = document.querySelector("#save-button");
	if (saveBtn) {
		saveBtn.onclick = function () {
			if (setDrawingTool("save")) {
				document.querySelector("[data-tool].active").classList.toggle("active");
        saveBtn.classList.toggle("active");
        document.querySelector('#canvas').style.cursor = "url(images/save-icon.png), auto";
				console.log('save selected');
			}
			else { console.log('failed to select save button'); }
		}
	}
	else { console.log('save button not found'); }
}
