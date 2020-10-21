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

// called when new client socket connects to server
io.on('connection', (socket) => {
    console.log("new connection: " + socket.id);

    // ================ CANVAS HANDLING =========================
    console.log('LOCKED: ' + LOCKED);
    if(!LOCKED) {
        LOCKED = socket.id;
        socket.broadcast.emit('lockCanvas', socket.id);     // lock canvas for all other users
        socket.emit('addPaths', paths);                     // notify new socket to add existing paths
    }
    else {
        // add new users to queue
        newUsers.push(socket.id);
    }

    // called before a socket broadcasts an unlock message when done drawing.
    // If new user is waiting to draw existing paths, release lock to them.
    function checkForNewUsers(socket) {
        if(newUsers.length > 0) {
            let socketid = newUsers.shift();
            socket.emit('lockCanvas', socketid);                   // lock canvas for socket that just finished drawing
            socket.broadcast.to(socketid).emit('addPaths', paths); // notify longest waiting newcomer to add existing paths
            return true;
        }
        return false
    }

    // called when new client socket finishes drawing all pre-existing
    // paths onto their canvas.
    socket.on('pathsLoaded', () => {
        // if there are new users waiting, pass lock to them and leave
        // all other user canvas's locked.
        if(checkForNewUsers(socket)) { return; }
        // if no new users are waiting, unlock all users canvas's.
        LOCKED = false;
        io.emit('unlockCanvas');
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
    socket.on('endDrawing', (pathData) => {

        let pathName = pathData.pathName;
        let pathObj = pathData.path[1];
        paths.push([pathName, pathObj]);
        // if there are new users waiting, pass lock to them and leave
        // all other user canvas's locked.
        if(checkForNewUsers(socket)) { return; }
        // if no new users are waiting, unlock all users canvas's.
        LOCKED = false;
        io.emit('unlockCanvas');
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
