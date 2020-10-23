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

    //join the default session when they first join
    socket.join("default");

    socket.on('startPos', (data, user) => {
        console.log(user.sessionID);
        socket.to(user.sessionID).emit('lock');        // broadcast to all sockets except sender who triggered event
        console.log("Start position");
        io.to(user.sessionID).emit('startPos', data);            // broadcast to all sockets, including sender who triggered event
    });

    socket.on('mousePos', (data, user) => {
        socket.to(user.sessionID).emit('lock');
        io.to(user.sessionID).emit('mousePos', data);
    });

    socket.on('finishPos', (user) => {
        console.log("Start position");

        io.to(user.sessionID).emit('finishPos');
    });

    // chat handling

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
    // getting username from auth.js and passing it to the client (prob dont need to do this actually)
    socket.on("getUsernameFromAuth", (username) => {
        socket.emit("giveUsername", username);
    });

    socket.on("joinSession", (user, prevSession) =>  {
        // checking to see if the session exists, but for now just create one if it doesn't exist
            
            socket.leave(prevSession);
            
          if (sessions.has(user.sessionID)) {
            sessions.get(user.sessionID).push(user);
            socket.join(user.sessionID);
            console.log(sessions.get(user.sessionID))
        } else {
            sessions.set(user.sessionID, [user]);
            socket.join(user.sessionID);
            console.log(sessions.get(user.sessionID))
        }
    });



});


exports.server = server;
