import {socket} from "./paperSockets.js"

let sendContainer = document.getElementById("send-container");
let messageInput = document.getElementById("message-input");
let messageContainer = document.getElementById("message-container");

let hideBTn = document.getElementById("hide-display");
let typingMsg = document.getElementById("whoIsTyping");
let showHideNum = 0;
let isTyping = 0;
let name;



socket.on("chat-message", (msg) => {
    console.log(msg);
    appendMessage(msg);
});



sendContainer.addEventListener("submit", e => {
    e.preventDefault();
    let message = messageInput.value;
    socket.emit("sendChatMessage", message, name);
    messageInput.value = "";
})

function appendMessage(message) {
    let messageElement = document.createElement("div");
    messageElement.innerHTML = message;
    messageContainer.append(messageElement);
}

hideBTn.onclick = function() {
    if (showHideNum === 0) {
        sendContainer.style.display = "none";
        messageContainer.style.display = "none";
        typingMsg.style.display = "none";
        showHideNum = 1;
    } else {
        sendContainer.style.display = "block";
        messageContainer.style.display = "block";
        typingMsg.style.display = "block";
        showHideNum = 0;
    }
}


socket.on("typing", (data, name) => {
    if (data === 1) {
        typingMsg.innerHTML = name + " is typing...";
    } else {
        typingMsg.innerHTML = "";
    }
});

messageInput.addEventListener("keyup", () => {
    if (messageInput.value.length > 0) {
        isTyping = 1;
    } else {
        isTyping = 0;
    }
    socket.emit("typingMsg", isTyping, name);
});


// get the username when the user is signed in, username is -1 if not logged in
socket.on("giveUsername" , (username) => {
    console.log("username is working")
    if (username != -1) {
        name = username;
    } else {
        name =  "Guest" +  Math.floor( Math.random() * 10000);
    }
});
