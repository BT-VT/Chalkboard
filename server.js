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

    let name;
    if (name === undefined) {
        name =  "Guest" +  Math.floor( Math.random() * 10000);
    }

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

    socket.on("sentMessage", (message) => {
        socket.broadcast.emit(message);
    });

    // chat handling

    socket.on("sendChatMessage", (message) => {
        let time = new Date();
        let formattedTime = time.toLocaleString("en-US", {hour: "numeric", minute: "numeric"});
        io.emit("chat-message", name + " at " + formattedTime + ":\n" + message);
    });


    socket.on("typingMsg", (data) => {
        socket.broadcast.emit("typing", name, data);
    });

    // username handling
    socket.on("username", (username) => {
         name = username;
         console.log(name);
    });

});


exports.server = server;
