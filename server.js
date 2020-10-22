// set up express server
var express = require("express");
var app = express();
var portNum = process.env.PORT || '4000';
var server = app.listen(portNum);
app.use(express.static("public"));
app.use(express.static(__dirname + "/node_modules/paper/dist"));
// set up socket.io on express server
var io = require("socket.io")(server);
var paths = [];    // paths = [[pathName, obj], ... , [pathName, obj]]
var newUsers = []; // new socket connections waiting to add existing paths
let LOCKED = false;

console.log("server running on port: " + portNum);

app.get('/', (req,res) => {
    console.log("Test");
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
            console.log('sending paths to socket ' + socket.id);
            let newSocket = newUsers.shift();
            socket.broadcast.to(newSocket.id).emit('addPaths', paths); // send paths to next new user in queue
        }
        response(newUsers.length);
    });
}

// called when new client socket connects to server
io.on('connection', (socket) => {
    console.log("new connection: " + socket.id);

    // ================ CANVAS HANDLING =========================

    tryToSendPaths(socket);

    // called when new client socket finishes drawing all pre-existing
    // paths onto their canvas.
    socket.on('pathsLoaded', () => {
        console.log('paths successfully added to ' + socket.id);
        socket.emit('unlockCanvas');
    });

    // called when mousedown event is detected by client. pathAttr obj is
    // created by getPathAttributes() function on client-side.
    socket.on('beginDrawing', (pathAttr) => {
        console.log(pathAttr);
        LOCKED = socket.id;
        socket.broadcast.emit('lockCanvas', socket.id);  // broadcast to all sockets except sender who triggered event
        io.emit('newPath', pathAttr);                    // broadcast to all sockets, including sender who triggered event
    });

    // called when mousedrag event is detecte by client. loc is an object
    // with x and y keys corresponding to float coordinates.
    socket.on('draw', (loc) => {
        //socket.broadcast.emit('lock');
        io.emit('newPoint', loc);
    });

    // called when mouseup event is detected by client. Adds finished path to
    // paths list and determines how to release lock.
    // pathData = { pathName: "pathN", path: ["Path", obj] }
    socket.on('endDrawing', async (pathData) => {

        let pathName = pathData.pathName;
        let pathObj = pathData.path[1];
        paths.push([pathName, pathObj]);

        await checkForNewUsers(socket);
        // if no new users are waiting, unlock all users canvas's.
        LOCKED = false;
        io.emit('finishPath');
    });



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
