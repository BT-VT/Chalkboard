// set up express server
var express = require("express");
var app = express();
var portNum = process.env.PORT || '5000';
var server = app.listen(portNum);
app.use(express.static("public"));

console.log("server running on port: " + portNum);

// set up socket.io on express server
var io = require("socket.io")(server);

app.get('/', (req,res) => {
    res.send('Welcome to Chalkboard');
});

io.on('connection', (socket) => {
    console.log("new connection: " + socket.id);

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
    socket.on("sendChatMessage", (message) => {
        let time = new Date();
        let formattedTime = time.toLocaleString("en-US", {hour: "numeric", minute: "numeric"});
        io.emit("chat-message", name + " at " + formattedTime + ":\n" + message);
    });

    // broadcasts a message when a user is typing
    socket.on("typingMsg", (data) => {
        socket.broadcast.emit("typing", name, data);
    });

    // get the username when the user is signed in, username is -1 if not logged in
    socket.on("giveUsername" , (username) => {
        if (username != -1) {
            name = username;
        } else {
            name =  "Guest" +  Math.floor( Math.random() * 10000);
        }
    });


});


exports.server = server;
