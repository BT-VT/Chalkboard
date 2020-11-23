import {socket, user} from "./paperSockets.js"

let sendContainer = document.getElementById("send-container");
let messageInput = document.getElementById("message-input");
let messageContainer = document.getElementById("message-container");
let sessionMembers = document.getElementById("sessionList");

let hideBTn = document.getElementById("hide-display");
let typingMsg = document.getElementById("whoIsTyping");
let showHideNum = 1;
let isTyping = 0;



socket.on("chat-message", (msg) => {
    console.log(msg);
    appendMessage(msg);
});

socket.on("updateUserList", (userList) => {
    sessionMembers.innerHTML = "Users in Session:\n" + userList;
});



sendContainer.addEventListener("submit", e => {
    e.preventDefault();
    let message = messageInput.value;
    socket.emit("sendChatMessage", message, user);
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
        sessionMembers.style.display = "none"
        showHideNum = 1;
    } else {
        sendContainer.style.display = "block";
        messageContainer.style.display = "block";
        typingMsg.style.display = "block";
        sessionMembers.style.display = "block";
        showHideNum = 0;
    }
}

socket.on("typing", (data, user) => {
    if (data === 1) {
        typingMsg.innerHTML = user + " is typing...";
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
    socket.emit("typingMsg", isTyping, user);
});
