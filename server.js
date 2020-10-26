// set up express server
const { v4: uuidv4 } = require('uuid');
var express = require("express");
var app = express();
var portNum = process.env.PORT || '5000';
var server = app.listen(portNum);
app.use(express.static("public"));
app.use(express.static(__dirname + "/node_modules/paper/dist"));
// set up socket.io on express server
var io = require("socket.io")(server);
var paths = [];    // paths = [[pathName, obj], ... , [pathName, obj]]
var newUsers = []; // new socket connections waiting to add existing paths
let curPathData = null;
let LOCKED = false;

console.log("server running on port: " + portNum);

app.get('/', (req,res) => {
    res.send('Welcome to Chalkboard');
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

    // called when new client socket finishes drawing all pre-existing
    // paths onto their canvas.
    socket.on('pathsLoaded', () => {
        console.log('paths successfully added to ' + socket.id);
        socket.emit('userInitialized', LOCKED);
    });

    // called when mousedown event is detected by client. pathAttr obj is
    // created by getPathAttributes() function on client-side.
    socket.on('requestNewDrawing', (pathAttr) => {
        LOCKED = socket.id;
        console.log('begin drawing, LOCKED set to: ' + LOCKED);
        io.emit('lockCanvas', socket.id);       // broadcast to all sockets except sender who triggered event
        io.emit('createNewDrawing', pathAttr);  // broadcast to all sockets, including sender who triggered event
    });

    socket.on('requestLock', () => {
        LOCKED = socket.id;
        console.log('lock given to ' + LOCKED);
        io.emit('lockCanvas', socket.id);
    });

    // called when mousedrag event is detecte by client. loc is an object
    // with x and y keys corresponding to float coordinates.
    socket.on('requestSegment', (loc) => {
        io.emit('drawSegment', loc);
    });

    socket.on('requestTrackingCircle', (circleAttr) => {
        curPathData = circleAttr;
        io.emit('drawTrackingCircle', circleAttr);
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

    // called when mouseup event is detected by client. Adds finished path to
    // paths list and determines how to release lock.
    // pathData = { pathName: "pathN", path: ["Path", obj] }
    socket.on('requestFinishDrawing', () => {
        let pathID = uuidv4();
        io.emit('finishDrawing', pathID);
    });

    // pathData = { pathName: 'circleN', path: [ 'Path', obj ] }
    socket.on('requestFinishCircle', () => {
        let pathID = uuidv4();
        io.emit('finishCircle', pathID);
    });

    socket.on('requestFinishErasing', async () => {
        await checkForNewUsers(socket);
        // if no new users are waiting, unlock all users canvas's.
        LOCKED = false;
        console.log('end drawing, LOCKED set to: ' + LOCKED);
        io.emit('unlockCanvas', socket.id);
    });

    // pathData = { pathName: path-pathID, path: ['Path', pathObj] }
    socket.on('confirmDrawingDone', async (pathData) => {
        let pathName = pathData.pathName;
        let pathObj = pathData.path[1];
        paths.push([pathName, pathObj]);

        await checkForNewUsers(socket);
        // if no new users are waiting, unlock all users canvas's.
        LOCKED = false;
        console.log('end drawing, LOCKED set to: ' + LOCKED);
        io.emit('unlockCanvas', socket.id);
    });

    // pathData = { pathName: circle-pathID, path: ['Path'], pathObj] }
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
    socket.on("sendChatMessage", (message, name) => {
        let time = new Date();
        let formattedTime = time.toLocaleString("en-US", {hour: "numeric", minute: "numeric"});
        io.emit("chat-message", name + " at " + formattedTime + ":\n" + message);
    });

    // broadcasts a message when a user is typing
    socket.on("typingMsg", (data, name) => {
        socket.broadcast.emit("typing", data, name);
    });

    socket.on("getUsernameFromAuth", (username) => {
        socket.emit("giveUsername", username);
    });


});


exports.server = server;
