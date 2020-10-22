// set up express server
var express = require("express");
var app = express();
var portNum = process.env.PORT || '5000';
var server = app.listen(portNum);
app.use(express.static("public"));

let sessions = new Map();



console.log("server running on port: " + portNum);

// set up socket.io on express server
var io = require("socket.io")(server);

app.get('/', (req,res) => {
    console.log("Test");
    res.send('Welcome to Chalkboard');
});

io.on('connection', (socket) => {
    console.log("new connection: " + socket.id);
    socket.send("hello");


    socket.on('startPos', (data) => {
        socket.broadcast.emit('lock');        // broadcast to all sockets except sender who triggered event
        console.log("Start position");
        io.emit('startPos', data);            // broadcast to all sockets, including sender who triggered event
    });

    socket.on('mousePos', (data) => {
        socket.broadcast.emit('lock');
        console.log("Start position");
        io.emit('mousePos', data);
    });

    socket.on('finishPos', () => {
        console.log("Start position");

        io.emit('finishPos');
    });

    // chat handling

    // sends chat message to the chat box
    socket.on("sendChatMessage", (message, user) => {
        let time = new Date();
        let formattedTime = time.toLocaleString("en-US", {hour: "numeric", minute: "numeric"});
        io.emit("chat-message", user.name + " at " + formattedTime + ":\n" + message);
    });

    // broadcasts a message when a user is typing
    socket.on("typingMsg", (data, user) => {
        socket.broadcast.emit("typing", data, user.name);
    });
    // getting username from auth.js and passing it to the client (prob dont need to do this actually)
    socket.on("getUsernameFromAuth", (username) => {
        socket.emit("giveUsername", username);
    });

    socket.on("sessionID", (sessionID) =>  {
        
        // checking to see if the session exists, but for now just create one if it doesn't exist
        
        /*  if (sessions.has(sessionID)) {
            socket.join(sessionID);
        }  */

        sessions.set(sessionID, []);
        socket.join(sessionID);
    });



});


exports.server = server;
