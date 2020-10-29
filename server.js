// set up express server
const { v4: uuidv4 } = require('uuid');
var express = require("express");
var app = express();
var portNum = process.env.PORT || '5000';
var server = app.listen(portNum);
app.use(express.static("public"));
app.use(express.static(__dirname + "/node_modules/paper/dist"));

let sessions = new Map();
let webRoom = "default";

console.log("server running on port: " + portNum);

// set up socket.io on express server
var io = require("socket.io")(server);
var paths = [];    // paths = [[pathName, obj], ... , [pathName, obj]]
var newUsers = []; // new socket connections waiting to add existing paths
let LOCKED = false;

console.log("server running on port: " + portNum);

app.get('/', (req,res) => {
    res.send('Welcome to Chalkboard');
    
});

app.get("/:room", (req, res) => {
    webRoom = req.params.room;
    res.sendFile(__dirname + "/public/index.html");
});

// called when new client socket connection first established
function tryToSendPaths(socket) {
    return new Promise((response, reject) => {
        if(!LOCKED) {
            console.log('sending paths to socket ' + socket.id);
            socket.emit('addPaths', paths);
            response(socket);
        }
        else {
            console.log('adding socket ' + socket.id + ' to queue');
            newUsers.push(socket);
            reject(socket);
        }
    });
}

// called when user finishes drawing. Attempts to send session paths to new
// users who are waiting to receive them in the newUsers queue.
function checkForNewUsers(socket) {
    return new Promise((response, reject) => {
        while(newUsers.length) {
            let newSocket = newUsers.shift();
            console.log('sending paths to socket ' + newSocket.id);
            socket.broadcast.to(newSocket.id).emit('addPaths', paths); // send paths to next new user in queue
        }
        response(newUsers.length);
    });
}

// called when new client socket connects to server
io.on('connection', (socket) => {
    console.log("new connection: " + socket.id);

    // ================ CANVAS HANDLING =========================

    // initial message from client to request session paths
    socket.on('hello', () => {
        if(LOCKED) { socket.emit('lockCanvas', LOCKED); }
        tryToSendPaths(socket);
    });

    // called by a user who has caused a mouseDown event to fire. set LOCKED to
    // callers socket ID on server and broadcast notification to lock client canvas's
    socket.on('requestLock', () => {
        LOCKED = socket.id;
        console.log('lock given to ' + LOCKED);
        io.emit('lockCanvas', socket.id);
    });

    // called when mousedown event is detected by client. pathAttr obj is
    // created by getPathAttributes() function on client-side.
    socket.on('requestNewDrawing', (pathAttr) => {
        LOCKED = socket.id;
        console.log('begin drawing, LOCKED set to: ' + LOCKED);
        io.emit('lockCanvas', socket.id);       // broadcast to all sockets except sender who triggered event
        io.emit('createNewDrawing', pathAttr);  // broadcast to all sockets, including sender who triggered event
    });

    // called when mousedrag event is detecte by client. loc is an object
    // with x and y keys corresponding to float coordinates.
    socket.on('requestSegment', (loc) => {
        io.emit('drawSegment', loc);
    });

    socket.on('requestTrackingCircle', (circleAttr) => {
        io.emit('drawTrackingCircle', circleAttr);
    });

    socket.on('requestTrackingRect', (rectAttr) => {
        io.emit('drawTrackingRect', rectAttr);
    });

    socket.on('requestTrackingTriangle', (triangleAttr) => {
        io.emit('drawTrackingTriangle', triangleAttr);
    });

    socket.on('requestErase', (pathName) => {
        console.log('request erase ' + pathName);
        io.emit('erasePath', pathName);
    });
    socket.on('confirmErasePath', async (pathName) => {
        console.log('confirm erase ' + pathName);
        // remove path from paths item array
        paths = paths.filter(pathsItem => pathsItem[0] != pathName);
    });

    // called when mouseup event is detected by client. creates pathID and
    // broadcasts instructions to end path and save it to paths list
    socket.on('requestFinishDrawing', () => {
        let pathID = uuidv4();
        io.emit('finishDrawing', pathID);
    });

    socket.on('requestFinishCircle', () => {
        let pathID = uuidv4();
        io.emit('finishCircle', pathID);
    });

    socket.on('requestFinishRect', (isEllipse) => {
        let pathID = uuidv4();
        io.emit('finishRect', pathID, isEllipse);
    });

    socket.on('requestFinishTriangle', () => {
        let pathID = uuidv4();
        io.emit('finishTriangle', pathID);
    })

    socket.on('requestFinishErasing', async () => {
        await checkForNewUsers(socket);
        // if no new users are waiting, unlock all users canvas's.
        LOCKED = false;
        console.log('end drawing, LOCKED set to: ' + LOCKED);
        io.emit('unlockCanvas', socket.id);
    });

    // REPITITION TO KEEP SHAPE DATA FLOW SEPERATE FOR DEBUGGING

    // pathData = { pathName: path-pathID, path: ['Path', pathObj] }
    socket.on('confirmDrawingDone', async (pathData) => {
        console.log(pathData.path[1].catdog);
        let pathName = pathData.pathName;
        let pathObj = pathData.path[1];
        paths.push([pathName, pathObj]);

        await checkForNewUsers(socket);
        // if no new users are waiting, unlock all users canvas's.
        LOCKED = false;
        console.log('end drawing, LOCKED set to: ' + LOCKED);
        io.emit('unlockCanvas', socket.id);
    });

    // pathData = { pathName: circle-pathID, path: ['Path', pathObj] }
    socket.on('confirmCircleDone', async (pathData) => {
        let pathName = pathData.pathName;
        let pathObj = pathData.path[1];
        pathObj.dashArray = null;
        paths.push([pathName, pathObj]);

        await checkForNewUsers(socket);
        // if no new users are waiting, unlock all users canvas's.
        LOCKED = false;
        console.log('end drawing, LOCKED set to: ' + LOCKED);
        io.emit('unlockCanvas', socket.id);
    });

    // pathData = { pathName: rect-pathID, path: ['Path', pathObj] }
    socket.on('confirmRectDone', async (pathData) => {
        let pathName = pathData.pathName;
        let pathObj = pathData.path[1];
        pathObj.dashArray = null;
        paths.push([pathName, pathObj]);

        await checkForNewUsers(socket);
        // if no new users are waiting, unlock all users canvas's.
        LOCKED = false;
        console.log('end drawing, LOCKED set to: ' + LOCKED);
        io.emit('unlockCanvas', socket.id);
    });

    // pathData = { pathName: circle-pathID, path: ['Path', pathObj] }
    socket.on('confirmTriangleDone', async (pathData) => {
        let pathName = pathData.pathName;
        let pathObj = pathData.path[1];
        pathObj.dashArray = null;
        paths.push([pathName, pathObj]);

        await checkForNewUsers(socket);
        // if no new users are waiting, unlock all users canvas's.
        LOCKED = false;
        console.log('end drawing, LOCKED set to: ' + LOCKED);
        io.emit('unlockCanvas', socket.id);
    });

    socket.on('requestPathMove', (newPosition, index) => {
        io.emit('movePath',newPosition, index);
    });

    // called when lock owner releases a path that was being moved. notifies
    // server that a path location needs to be updated in the paths array.
    // paths = [[pathName, obj], ... , [pathName, obj]]
    socket.on('confirmPathMoved', async (newPosition, index) => {

        paths[index][1].position = newPosition;
        // always check for new users before letting a client release the lock
        await checkForNewUsers(socket);
        // if no new users are waiting, unlock all users canvas's.
        LOCKED = false;
        io.emit('unlockCanvas', socket.id);
    });

    // received by client when 'undo' button is clicked. If there is a path to
    // undo, pop it from the paths array and send message for clients to remove
    // the path. paths = [[pathName, obj], ... , [pathName, obj]]
    socket.on('undo', () => {
        if(paths.length > 0) {
            let pathArray = paths.pop();
            console.log('removing ' + pathArray[0]);
            io.emit('deleteLastPath', pathArray[0]);
        }
    });

    socket.on('disconnect', async (reson) => {
        if(LOCKED == socket.id) {
            await checkForNewUsers(socket);
            LOCKED = false;
            console.log('socket ' + socket.id + ' disconnected while drawing, releasing lock...');
            io.emit('deleteCurPath', socket.id);
        }
    })




    // =============== CHAT HANDLING ============================

    // sends chat message to the chat box
    socket.on("sendChatMessage", (message, user) => {
        console.log(user.sessionID);
        let time = new Date();
        let formattedTime = time.toLocaleString("en-US", {hour: "numeric", minute: "numeric"});
        io.to(user.sessionID).emit("chat-message", user.name + " at " + formattedTime + ":\n" + message);
    });

    // broadcasts a message when a user is typing
    socket.on("typingMsg", (data, user) => {
       // console.log(name);
        socket.to(user.sessionID).emit("typing", data, user.name);
    });
    // getting username from auth.js and passing it to the client (there is prob a better way to do this)
    socket.on("getUsernameFromAuth", (username) => {
        socket.emit("giveUsername", username);
    });

    // ================ ROOM HANDLING ====================

 //delays moving to the room initially to give time to update the username first
    setTimeout( () => {
        socket.emit("updateRoom", webRoom);
        webRoom = "default";
    }, 500)

    socket.on("joinSession", (user, prevSession) =>  {
            if (prevSession != null)
                socket.leave(prevSession);

    // checking to see if the session exists, but for now just create one if it doesn't exist
          if (sessions.has(user.sessionID)) {
            sessions.get(user.sessionID).push(user);
            socket.join(user.sessionID);
            io.to(user.sessionID).emit("chat-message", user.name + " has joined the " + user.sessionID + " session!" );
            console.log(sessions.get(user.sessionID))
        } else {
            sessions.set(user.sessionID, [user]);
            socket.join(user.sessionID);
            io.to(user.sessionID).emit("chat-message", user.name + " has joined the " + user.sessionID + " session!" );
            console.log(sessions.get(user.sessionID))
        }
    });



});


exports.server = server;
