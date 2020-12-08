
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

// set up firestore connection
const admin = require('firebase-admin');
const {auth} = require('google-auth-library');
const serviceAccEnvVar = process.env.SERVICE_ACCOUNT_KEY;
const serviceAccount = JSON.parse(serviceAccEnvVar);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
// set up express server
var express = require("express");
var app = express();
var portNum = process.env.PORT || '5000';
var server = app.listen(portNum);
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.static(__dirname + "/node_modules/paper/dist"));

let sessions = new Map();
let webRoom = "default";


/*
sessions = map : {
    sessionID: {
        paths: [ {pathName: name, path: pathObj}, ... , {pathName: name, path: pathObj} ],
        LOCKED: false,
        usersInSession: [user.name],
        newUsers: []
    }
}
*/

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
    for(let [sessionName, sessionObj] of sessions) {
        if(sessionName == 'default') { continue; }
        // create new DB document with title == sessionName in ChalkboardStates collection
        const pathsRef = db.collection('chalkboards').doc(sessionName);
        try {
            // add session name and session paths to DB document
            await pathsRef.set({
                date_saved: new Date(),
                sessionID: sessionName,
                edits: sessionObj.paths
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
function tryToSendPaths(socket, sessionID) {
    return new Promise((response, reject) => {
        let sessionObj = sessions.get(sessionID);
        if(!sessionObj.LOCKED) {
            console.log('sending paths from session: "' + sessionID + '" to socket ' + socket.id);
            socket.emit('addPaths', sessionObj.paths);
            response(socket);
        }
        else {
            console.log('adding socket ' + socket.id + ' to queue for session ' + sessionID);
            sessionObj.newUsers.push(socket);
            response(socket);
        }
    });
}

// called when user finishes drawing. Attempts to send session paths to new
// users who are waiting to receive them in the newUsers queue.
function checkForNewUsers(socket, sessionID) {
    return new Promise((response, reject) => {
        // get newUsers array for the session of socket who called function
        let newUsers = sessions.get(sessionID).newUsers;
        // send all waiting sockets the session paths
        while(newUsers.length) {
            let newSocket = newUsers.shift();
            console.log('sending paths to socket ' + newSocket.id + ' waiting in newUser queue of session: ' + sessionID);
            //socket.broadcast.to(newSocket.id).emit('addPaths', sessions.get(user.sessionID).paths); // send paths to next new user in queue
            io.to(newSocket.id).emit('addPaths', sessions.get(sessionID).paths); // send paths to next new user in queue
        }
        response(newUsers.length);
    });
}

// called when new client socket connects to server
io.on('connection', (socket) => {
    console.log("new connection: " + socket.id);

    socket.on('hello', () => {
        setTimeout(() => {



             socket.emit("updateRoom", webRoom);
             webRoom = "default";



        }, 500)


    })

    socket.on('confirmSessionJoined', (user) => {
        socket.to(user.sessionID).broadcast.emit('userJoinedSession', socket.id);
    });

    // ================ CANVAS HANDLING =========================

    // initial message from client to request session path

    // called by a user who has caused a mouseDown event to fire. set LOCKED to
    // callers socket ID on server and broadcast notification to lock client canvas's
    socket.on('requestLock', (user) => {
        sessions.get(user.sessionID).LOCKED = socket.id;
        console.log('lock given to ' + socket.id + ' in session: ' + user.sessionID);
        io.to(user.sessionID).emit('lockCanvas', socket.id, user);
    });

    // called when mousedown event is detected by client. pathAttr obj is
    // created by getPathAttributes() function on client-side.
    socket.on('requestNewDrawing', (pathAttr, user) => {
        sessions.get(user.sessionID).LOCKED = socket.id;
        console.log('begin drawing, LOCKED set to: ' + socket.id + ' in session: ' + user.sessionID);
        io.to(user.sessionID).emit('lockCanvas', socket.id, user);       // broadcast to all sockets except sender who triggered event
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

    socket.on('requestAddImageToCanvas', (url, user) => {
        let pathID = uuidv4();
        io.to(user.sessionID).emit('addImageToCanvas', url, pathID);
    });

    socket.on('requestErase', (pathName, user) => {
        console.log('request erase ' + pathName);
        io.to(user.sessionID).emit('erasePath', pathName);
    });
    socket.on('confirmErasePath', async (pathName, user) => {
        console.log('confirm erase ' + pathName);
        // remove path from paths array of path item objects (pathsItem = {pathName: pathName, path: pathObj})
        if(user.sessionID != 'default') {
            let sessionObj = sessions.get(user.sessionID);
            sessionObj.paths = sessionObj.paths.filter(pathsItem => pathsItem.pathName != pathName);
        }
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

    socket.on('requestFinishEditText', (user) => {
        io.to(user.sessionID).emit('finishEditText');
    });

    socket.on('requestFinishErasing', async (user) => {
        await checkForNewUsers(socket, user.sessionID);
        // if no new users are waiting, unlock all users canvas's.
        sessions.get(user.sessionID).LOCKED = false;
        console.log('end drawing, LOCKED set to false in session: ' + user.sessionID);
        io.to(user.sessionID).emit('unlockCanvas', socket.id);
    });

    // REPITITION TO KEEP SHAPE DATA FLOW SEPERATE FOR DEBUGGING

    // pathData = { pathName: path-pathID, path: ['Path', pathObj] }
    socket.on('confirmDrawingDone', async (pathData, user) => {
        let pathName = pathData.pathName;
        let pathObj = pathData.path;

        if(user.sessionID != 'default') {
            sessions.get(user.sessionID).paths.push({pathName: pathName, path: pathObj});
        }

        await checkForNewUsers(socket, user.sessionID);
        // if no new users are waiting, unlock all users canvas's.
        sessions.get(user.sessionID).LOCKED = false;
        console.log('ended drawing, LOCKED set to false in session: ' + user.sessionID);
        io.to(user.sessionID).emit('unlockCanvas', socket.id);
    });

    // pathData = { pathName: circle-pathID, path: ['Path', pathObj] }
    socket.on('confirmCircleDone', async (pathData, user) => {
        let pathName = pathData.pathName;
        let pathObj = pathData.path;
        pathObj.dashArray = null;

        if(user.sessionID != 'default') {
            sessions.get(user.sessionID).paths.push({pathName: pathName, path: pathObj});
        }

        await checkForNewUsers(socket, user.sessionID);
        // if no new users are waiting, unlock all users canvas's.
        sessions.get(user.sessionID).LOCKED = false;
        console.log('ended drawing, LOCKED set to false in session: ' + user.sessionID);
        io.to(user.sessionID).emit('unlockCanvas', socket.id);
    });

    // pathData = { pathName: rect-pathID, path: ['Path', pathObj] }
    socket.on('confirmRectDone', async (pathData, user) => {
        let pathName = pathData.pathName;
        let pathObj = pathData.path;
        pathObj.dashArray = null;

        if(user.sessionID != 'default') {
            sessions.get(user.sessionID).paths.push({pathName: pathName, path: pathObj});
        }

        await checkForNewUsers(socket, user.sessionID);
        // if no new users are waiting, unlock all users canvas's.
        sessions.get(user.sessionID).LOCKED = false;
        console.log('ended drawing, LOCKED set to false in session: ' + user.sessionID);
        io.to(user.sessionID).emit('unlockCanvas', socket.id);
    });

    // pathData = { pathName: circle-pathID, path: ['Path', pathObj] }
    socket.on('confirmTriangleDone', async (pathData, user) => {
        let pathName = pathData.pathName;
        let pathObj = pathData.path;
        pathObj.dashArray = null;

        if(user.sessionID != 'default') {
            sessions.get(user.sessionID).paths.push({pathName: pathName, path: pathObj});
        }

        await checkForNewUsers(socket, user.sessionID);
        // if no new users are waiting, unlock all users canvas's.
        sessions.get(user.sessionID).LOCKED = false;
        console.log('ended drawing, LOCKED set to false in session: ' + user.sessionID);
        io.to(user.sessionID).emit('unlockCanvas', socket.id);
    });

    // pathData = { pathName: circle-pathID, path: ['Path', pathObj] }
    socket.on('confirmLineDone', async (pathData, user) => {
        let pathName = pathData.pathName;
        let pathObj = pathData.path;
        pathObj.dashArray = null;

        if(user.sessionID != 'default') {
            sessions.get(user.sessionID).paths.push({pathName: pathName, path: pathObj});
        }

        await checkForNewUsers(socket, user.sessionID);
        // if no new users are waiting, unlock all users canvas's.
        sessions.get(user.sessionID).LOCKED = false;
        console.log('ended drawing, LOCKED set to false in session: ' + user.sessionID);
        io.to(user.sessionID).emit('unlockCanvas', socket.id);
    });

    // pathData = { pathName: circle-pathID, path: ['Path', pathObj] }
    socket.on('confirmTextDone', async (pathData, user) => {
        let pathName = pathData.pathName;
        let pathObj = pathData.path;

        if(user.sessionID != 'default') {
            sessions.get(user.sessionID).paths.push({pathName: pathName, path: pathObj});
        }

        await checkForNewUsers(socket, user.sessionID);
        // if no new users are waiting, unlock all users canvas's.
        sessions.get(user.sessionID).LOCKED = false;
        console.log('ended text, LOCKED set to false in session: ' + user.sessionID);
        io.to(user.sessionID).emit('unlockCanvas', socket.id);
    });

    // pathData = { pathName: circle-pathID, path: ['Path', pathObj] }
    socket.on('confirmImageUpload', async (pathData, user) => {
        let pathName = pathData.pathName;
        let pathObj = pathData.path;

        if(user.sessionID != 'default') {
            sessions.get(user.sessionID).paths.push({pathName: pathName, path: pathObj});
        }

        await checkForNewUsers(socket, user.sessionID);
        // if no new users are waiting, unlock all users canvas's.
        sessions.get(user.sessionID).LOCKED = false;
        console.log('ended image upload, LOCKED set to false in session: ' + user.sessionID);
        io.to(user.sessionID).emit('unlockCanvas', socket.id);
    });

    socket.on('requestPathMove', (newPosition, index, user) => {
        io.to(user.sessionID).emit('movePath', newPosition, index);
    });

    socket.on('requestPathRotate', (degrees, index, user) => {
        io.to(user.sessionID).emit('rotatePath', degrees, index);
    });

    socket.on('requestNewStrokeColor', (color, index, user) => {
        io.to(user.sessionID).emit('newStrokeColor', color, index, socket.id);
    });

    socket.on('requestColorFill', (color, index, user) => {
        io.to(user.sessionID).emit('colorFill', color, index, socket.id);
    });

    socket.on('requestEditText', (index, user) => {
        io.to(user.sessionID).emit('editText', index);
    });

    socket.on('requestUpdateImageSize', (newBounds, index, user) => {
        io.to(user.sessionID).emit('updateImageSize', newBounds, index);
    });

    // called when lock owner releases a path that was being moved. notifies
    // server that a path location needs to be updated in the paths array.
    // paths = [{pathName: name, path: pathObj}, ... , {pathName: name, path: pathObj}]
    socket.on('confirmPathUpdated', async (updatedPath, index, user) => {
        // get the paths array for the session the user is in, then get the
        // pathData obj at the specified index in the paths array, then update
        // the path variable for that pathData obj.
        if(user.sessionID != 'default') {
            sessions.get(user.sessionID).paths[index].path = updatedPath;
        }
        // always check for new users before letting a client release the lock
        await checkForNewUsers(socket, user.sessionID);
        // if no new users are waiting, unlock all users canvas's.
        sessions.get(user.sessionID).LOCKED = false;
        console.log('finished updating path, lock set to false in session: ' + user.sessionID);
        io.to(user.sessionID).emit('unlockCanvas', socket.id);
    });

    // received by client when 'undo' button is clicked. If there is a path to
    // undo, pop it from the paths array and send message for clients to remove
    // paths = [{pathName: name, path: pathObj}, ... , {pathName: name, path: pathObj}]
    socket.on('undo', (user) => {
        if(sessions.get(user.sessionID).paths.length > 0) {
            let pathsItem = sessions.get(user.sessionID).paths.pop();
            console.log('removing ' + pathsItem.pathName + ' in session ' + user.sessionID);
            io.to(user.sessionID).emit('deleteLastPath', pathsItem.pathName);
        }
    });

    socket.on('disconnecting', async () => {

        let userSessions = Object.keys(socket.rooms);   // always includes 'self' session, not controlled by users.

        if (userSessions.length > 1) {
            // tell other users to disconnect video call with this user who is leaving the session
            socket.to(userSessions[1]).emit('userLeftSession', socket.id);
        }

        // if user was drawing while disconnected, remove the path being drawn and set the session lock to false.
        if(userSessions.length > 1 && sessions.get(userSessions[1]).LOCKED == socket.id) {
            await checkForNewUsers(socket, userSessions[1]);
            sessions.get(userSessions[1]).LOCKED = false;
            console.log('socket ' + socket.id + ' disconnected while drawing, releasing lock from session ' + userSessions[1]);
            io.to(userSessions[1]).emit('deleteCurPath', socket.id);
        }

        let previousSessionUserIDs = sessions.get(userSessions[1]).sessionUserIDs;
        let previousSessionUsers = sessions.get(userSessions[1]).sessionUsers;
        let index = previousSessionUserIDs.indexOf(socket.id);

        if (index != -1) {
            previousSessionUserIDs.splice(index, 1);
            previousSessionUsers.splice(index, 1);
            sessions.get(userSessions[1]).sessionUserIDs = previousSessionUserIDs;
            sessions.get(userSessions[1]).sessionUsers = previousSessionUsers;
            io.to(userSessions[1]).emit("updateUserList", "\n" + previousSessionUsers.join("\n"));
         }


    });

    // =============== CHAT HANDLING ============================

    // sends chat message to the chat box
    socket.on("sendChatMessage", (message, user) => {
        let time = new Date();
        let formattedTime = time.toLocaleString("en-US", {hour: "numeric", minute: "numeric"});
        io.to(user.sessionID).emit("chat-message", user.name + " at " + formattedTime + ":\n" + message);

    });

    // broadcasts a message when a user is typing
    socket.on("typingMsg", (data, user) => {
        socket.to(user.sessionID).emit("typing", data, user.name);
    });
    // getting username from auth.js and passing it to the client (there is prob a better way to do this)
    socket.on("getUsernameFromAuth", (username) => {
        socket.emit("giveUsername", username);
    });

    // ================ ROOM HANDLING ====================


    socket.on("joinSession", async (user, prevSession) =>  {
        try {


          //  console.log(prevSession);
            if (prevSession != null && sessions.has(prevSession)) {
                socket.leave(prevSession);

                // removing name from list
                let previousSessionUsers = sessions.get(prevSession).sessionUsers;
                let previousSessionUserIDs =sessions.get(prevSession).sessionUserIDs;
                let index = previousSessionUsers.indexOf(user.name);

                if (index != -1) {
                    sessions.get(prevSession).sessionUsers = previousSessionUsers.splice(index, 1);
                    sessions.get(prevSession).sessionUserIDs = previousSessionUserIDs.splice(index,1);
                    io.to(prevSession).emit("updateUserList", "\n" + sessions.get(prevSession).sessionUsers.join("\n"));
                }
            }


            // check if session already exists on server
            if (sessions.has(user.sessionID)) {
                //   sessions.get(user.sessionID).push(user);
                socket.join(user.sessionID);
                sessions.get(user.sessionID).sessionUsers.push(user.name);
                sessions.get(user.sessionID).sessionUserIDs.push(socket.id);
                console.log("current users: " + sessions.get(user.sessionID).sessionUsers)
                io.to(user.sessionID).emit("updateUserList", "\n" + sessions.get(user.sessionID).sessionUsers.join("\n"));
                //  io.to(user.sessionID).emit("chat-message", user.name + " has joined the " + user.sessionID + " session!" );
                console.log('user requested to join existing session: ' + user.sessionID);
                await tryToSendPaths(socket, user.sessionID);

            } else {

                let sessionObj = {
                    paths: [],
                    LOCKED: false,

                    newUsers: [],
                    sessionUsers: [],
                    sessionUserIDs: []

                }
                // check if session exists in dB. If it does, add it to the server and
                // add the user to the session, else create a new session and add the user.
                const docRef = db.collection('chalkboards').doc(user.sessionID);
                const docObj = await docRef.get();
                if(docObj && docObj.exists) {
                    const sessObj = docObj.data();
                    sessionObj.paths = sessObj.edits;
                    console.log('user requested to join session from dB: ' + user.sessionID);

                }
                else {
                    console.log('user requested to join new session: ' + user.sessionID);
                }
                sessions.set(user.sessionID, sessionObj);
                socket.join(user.sessionID);
                sessions.get(user.sessionID).sessionUsers.push(user.name);
                sessions.get(user.sessionID).sessionUserIDs.push(socket.id);
                console.log("current users: " + sessions.get(user.sessionID).sessionUsers)
                io.to(user.sessionID).emit("updateUserList", "\n" + sessions.get(user.sessionID).sessionUsers.join("\n"));
                await tryToSendPaths(socket, user.sessionID);
            }
        }
        catch(err) {
            console.log("error retreiving session from dB: ", err);
        }
    });






});

exports.server = server;
