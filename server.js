
const { v4: uuidv4 } = require('uuid');

// set up firestore connection
const admin = require('firebase-admin');
const serviceAccount = require('./chalkboardPrivate/ServiceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
// set up express server
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

// the pathObj in the paths array on the server is serialized, and is in a JSON string format. This allows
// it to be stored in the FireStore database.
var paths = [];    // paths = [{pathName: name, path: pathObj}, ... , {pathName: name, path: pathObj}]
var newUsers = []; // new socket connections waiting to add existing paths
let LOCKED = false;

app.get('/', (req,res) => {
    res.send('Welcome to Chalkboard');

});

app.get("/:room", (req, res) => {
    webRoom = req.params.room;
    res.sendFile(__dirname + "/public/index.html");
});

// listeners for (ctrl + c) server termination.
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// called when server shuts down. put tasks for graceful shutdown in here.
async function handleShutdown() {
    console.log('\nclosing server');
    // save paths array to db
    for(let [sessionName, pathsItem] of sessions) {
        // create new DB document with title == sessionName in ChalkboardStates collection
        const pathsRef = db.collection('chalkboards').doc(sessionName);
        try {
            // add session name and session paths to DB document
            await pathsRef.set({
                sessionID: sessionName,
                edits: pathsItem
            }, { merge: true });
            console.log('saved chalkboard session ' + sessionName + ' state to database.');
        }
        catch(err) {
            console.log('error saving chalkboard session ' + sessionName + ' state to database...');
            console.log(err);
        };
    }

    process.exit();
}

// called when new client socket connection first established


// called when user finishes drawing. Attempts to send session paths to new
// users who are waiting to receive them in the newUsers queue.
function checkForNewUsers(socket) {
    return new Promise((response, reject) => {
        while(newUsers.length) {
            let newSocket = newUsers.shift();
            console.log('sending paths to socket ' + newSocket.id);
            socket.broadcast.to(newSocket.id).emit('addPaths', sessions.get(user.sessionID)); // send paths to next new user in queue
        }
        response(newUsers.length);
    });
}

// called when new client socket connects to server
io.on('connection', (socket) => {
    console.log("new connection: " + socket.id);


         socket.emit("updateRoom", webRoom);
         webRoom = "default";



    // ================ CANVAS HANDLING =========================

    // initial message from client to request session path

    // called by a user who has caused a mouseDown event to fire. set LOCKED to
    // callers socket ID on server and broadcast notification to lock client canvas's
    socket.on('requestLock', (user) => {
        LOCKED = socket.id;
        console.log('lock given to ' + LOCKED);
        io.to(user.sessionID).emit('lockCanvas', socket.id);
    });

    // called when mousedown event is detected by client. pathAttr obj is
    // created by getPathAttributes() function on client-side.
    socket.on('requestNewDrawing', (pathAttr, user) => {
        LOCKED = socket.id;
        console.log('begin drawing, LOCKED set to: ' + LOCKED);
        io.to(user.sessionID).emit('lockCanvas', socket.id);       // broadcast to all sockets except sender who triggered event
        io.to(user.sessionID).emit('createNewDrawing', pathAttr);  // broadcast to all sockets, including sender who triggered event
    });

    // called when mousedrag event is detecte by client. loc is an object
    // with x and y keys corresponding to float coordinates.
    socket.on('requestSegment', (loc, user) => {
        io.to(user.sessionID).emit('drawSegment', loc);
    });

    socket.on('requestTrackingCircle', (circleAttr, user) => {
        io.to(user.sessionID).emit('drawTrackingCircle', circleAttr);
    });

    socket.on('requestTrackingRect', (rectAttr, user) => {
        io.to(user.sessionID).emit('drawTrackingRect', rectAttr);
    });

    socket.on('requestTrackingTriangle', (triangleAttr, user) => {
        io.to(user.sessionID).emit('drawTrackingTriangle', triangleAttr);
    });

    socket.on('requestTrackingLine', (lineAttr, user) => {
        io.to(user.sessionID).emit('drawTrackingLine', lineAttr);
    });

    socket.on('requestPointText', (pointTextAttr, user) => {
        io.to(user.sessionID).emit('setPointText', pointTextAttr);
    });

    socket.on('requestTextBackspace', (lockOwner, user) => {
        io.to(user.sessionID).emit('textBackspace', lockOwner);
    });

    socket.on('requestAddTextChar', (lockOwner, char, user) => {
        io.to(user.sessionID).emit('addTextChar', lockOwner, char);
    });

    socket.on('requestErase', (pathName, user) => {
        console.log('request erase ' + pathName);
        io.to(user.sessionID).emit('erasePath', pathName);
    });
    socket.on('confirmErasePath', async (pathName, user) => {
        console.log('confirm erase ' + pathName);
        // remove path from paths array of path item objects (pathsItem = {pathName: pathName, path: pathObj})
        sessions.set(user.sessionID, sessions.get(user.sessionID).filter(pathsItem => pathsItem.pathName != pathName));
    });

    // called when mouseup event is detected by client. creates pathID and
    // broadcasts instructions to end path and save it to paths list
    socket.on('requestFinishDrawing', (user) => {
        let pathID = uuidv4();
        io.to(user.sessionID).emit('finishDrawing', pathID, user);
    });

    socket.on('requestFinishCircle', (user) => {
        let pathID = uuidv4();
        io.to(user.sessionID).emit('finishCircle', pathID);
    });

    socket.on('requestFinishRect', (isEllipse, user) => {
        let pathID = uuidv4();
        io.to(user.sessionID).emit('finishRect', pathID, isEllipse);
    });

    socket.on('requestFinishTriangle', (user) => {
        let pathID = uuidv4();
        io.to(user.sessionID).emit('finishTriangle', pathID);
    });

    socket.on('requestFinishLine', (user) => {
        let pathID = uuidv4();
        io.to(user.sessionID).emit('finishLine', pathID);
    });

    socket.on('requestFinishText', (user) => {
        let pathID = uuidv4();
        io.to(user.sessionID).emit('finishText', pathID);
    });

    socket.on('requestFinishErasing', async (user) => {
        await checkForNewUsers(socket);
        // if no new users are waiting, unlock all users canvas's.
        LOCKED = false;
        console.log('end drawing, LOCKED set to: ' + LOCKED);
        io.to(user.sessionID).emit('unlockCanvas', socket.id);
    });

    // REPITITION TO KEEP SHAPE DATA FLOW SEPERATE FOR DEBUGGING

    // pathData = { pathName: path-pathID, path: ['Path', pathObj] }
    socket.on('confirmDrawingDone', async (pathData, user) => {
        let pathName = pathData.pathName;
        let pathObj = pathData.path;

        sessions.get(user.sessionID).push({pathName: pathName, path: pathObj});

        await checkForNewUsers(socket);
        // if no new users are waiting, unlock all users canvas's.
        LOCKED = false;
        console.log(socket.id + ' ended drawing, LOCKED set to: ' + LOCKED);
        io.to(user.sessionID).emit('unlockCanvas', socket.id);
    });

    // pathData = { pathName: circle-pathID, path: ['Path', pathObj] }
    socket.on('confirmCircleDone', async (pathData, user) => {
        let pathName = pathData.pathName;
        let pathObj = pathData.path;
        pathObj.dashArray = null;

        sessions.get(user.sessionID).push({pathName: pathName, path: pathObj});

        await checkForNewUsers(socket);
        // if no new users are waiting, unlock all users canvas's.
        LOCKED = false;
        console.log('end drawing, LOCKED set to: ' + LOCKED);
        io.to(user.sessionID).emit('unlockCanvas', socket.id);
    });

    // pathData = { pathName: rect-pathID, path: ['Path', pathObj] }
    socket.on('confirmRectDone', async (pathData, user) => {
        let pathName = pathData.pathName;
        let pathObj = pathData.path;
        pathObj.dashArray = null;
        sessions.get(user.sessionID).push({pathName: pathName, path: pathObj});

        await checkForNewUsers(socket);
        // if no new users are waiting, unlock all users canvas's.
        LOCKED = false;
        console.log('end drawing, LOCKED set to: ' + LOCKED);
        io.to(user.sessionID).emit('unlockCanvas', socket.id);
    });

    // pathData = { pathName: circle-pathID, path: ['Path', pathObj] }
    socket.on('confirmTriangleDone', async (pathData, user) => {
        let pathName = pathData.pathName;
        let pathObj = pathData.path;
        pathObj.dashArray = null;
        sessions.get(user.sessionID).push({pathName: pathName, path: pathObj});

        await checkForNewUsers(socket);
        // if no new users are waiting, unlock all users canvas's.
        LOCKED = false;
        console.log('end drawing, LOCKED set to: ' + LOCKED);
        io.to(user.sessionID).emit('unlockCanvas', socket.id);
    });

    // pathData = { pathName: circle-pathID, path: ['Path', pathObj] }
    socket.on('confirmLineDone', async (pathData, user) => {
        let pathName = pathData.pathName;
        let pathObj = pathData.path;
        pathObj.dashArray = null;
        sessions.get(user.sessionID).push({pathName: pathName, path: pathObj});

        await checkForNewUsers(socket);
        // if no new users are waiting, unlock all users canvas's.
        LOCKED = false;
        console.log('end drawing, LOCKED set to: ' + LOCKED);
        io.to(user.sessionID).emit('unlockCanvas', socket.id);
    });

    // pathData = { pathName: circle-pathID, path: ['Path', pathObj] }
    socket.on('confirmTextDone', async (pathData, user) => {
        let pathName = pathData.pathName;
        let pathObj = pathData.path;
        sessions.get(user.sessionID).push({pathName: pathName, path: pathObj});

        await checkForNewUsers(socket);
        // if no new users are waiting, unlock all users canvas's.
        LOCKED = false;
        console.log('end text, LOCKED set to: ' + LOCKED);
        io.to(user.sessionID).emit('unlockCanvas', socket.id);
    });

    socket.on('requestPathMove', (newPosition, index, user) => {
        io.to(user.sessionID).emit('movePath',newPosition, index);
    });

    socket.on('requestPathRotate', (degrees, index, user) => {
        io.to(user.sessionID).emit('rotatePath', degrees, index);
    });

    socket.on('requestNewStrokeColor', (color, index, user) => {
        io.to(user.sessionID).emit('newStrokeColor', color, index);
    });

    socket.on('requestColorFill', (color, index, user) => {
        io.to(user.sessionID).emit('colorFill', color, index);
    });

    // called when lock owner releases a path that was being moved. notifies
    // server that a path location needs to be updated in the paths array.
    // paths = [{pathName: name, path: pathObj}, ... , {pathName: name, path: pathObj}]
    socket.on('confirmPathMoved', async (updatedPath, index, user) => {

        sessions.get(user.sessionID)[index].path = updatedPath;
        // always check for new users before letting a client release the lock
        await checkForNewUsers(socket);
        // if no new users are waiting, unlock all users canvas's.
        LOCKED = false;
        io.to(user.sessionID).emit('unlockCanvas', socket.id);
    });

    // received by client when 'undo' button is clicked. If there is a path to
    // undo, pop it from the paths array and send message for clients to remove
    // paths = [{pathName: name, path: pathObj}, ... , {pathName: name, path: pathObj}]
    socket.on('undo', (user) => {
        if(sessions.get(user.sessionID).length > 0) {
            let pathsItem = sessions.get(user.sessionID).pop();
            console.log('removing ' + pathsItem.pathName);
            io.to(user.sessionID).emit('deleteLastPath', pathsItem.pathName);
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



    socket.on("joinSession", (user, prevSession) =>  {
            if (prevSession != null)
                socket.leave(prevSession);

    // checking to see if the session exists, but for now just create one if it doesn't exist
          if (sessions.has(user.sessionID)) {
         //   sessions.get(user.sessionID).push(user);
            socket.join(user.sessionID);
          //  io.to(user.sessionID).emit("chat-message", user.name + " has joined the " + user.sessionID + " session!" );
            console.log('sending paths to client joining session...')
            io.to(user.sessionID).emit('addPaths', sessions.get(user.sessionID));
        } else {
            sessions.set(user.sessionID, []);
            socket.join(user.sessionID);
          //  io.to(user.sessionID).emit("chat-message", user.name + " has joined the " + user.sessionID + " session!" );
          console.log('sending paths to client joining new session...')
            io.to(user.sessionID).emit('addPaths', sessions.get(user.sessionID));
        }
    });



});


exports.server = server;
