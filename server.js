
// set up express server
var express = require("express");
var app = express();
var portNum = process.env.PORT || '5000';
var server = app.listen(portNum);
app.use(express.static("public"));
app.use(express.static(__dirname + "/node_modules/paper/dist"));

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
        io.emit('startPos', data);            // broadcast to all sockets, including sender who triggered event
    });

    socket.on('mousePos', (data) => {
        socket.broadcast.emit('lock');
        io.emit('mousePos', data);
    });

    socket.on('finishPos', () => {
        io.emit('finishPos');
    });

    // chat handling

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
