 var socket = io();

let sendContainer = document.getElementById("send-container");
let messageInput = document.getElementById("message-input");
let messageContainer = document.getElementById("message-container");

let hideBTn = document.getElementById("hide-display");
let typingMsg = document.getElementById("whoIsTyping");
let showHideNum = 0;
let isTyping = 0;



socket.on("chat-message", (msg) => {
    console.log(msg);
    appendMessage(msg);
});



sendContainer.addEventListener("submit", e => {
    e.preventDefault();
    let message = messageInput.value;
    socket.emit("sendChatMessage", message);
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
        hideBTn.innerHTML = "Show Chat";
        showHideNum = 1;
    } else {
        sendContainer.style.display = "block";
        messageContainer.style.display = "block";
        hideBTn.innerHTML = "Hide Chat";
        showHideNum = 0;
    }
}


socket.on("typing", (name, data) => {
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
    socket.emit("typingMsg", isTyping);
});
