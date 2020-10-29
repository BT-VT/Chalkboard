class User {
    constructor(name, sessionID) {
        this.name = name;
        this.sessionID = sessionID;
    }

     getName() {
        return this.name;
    }

     setName(value) {
        this.name = value;
    }
     getSessionID() {
        return this.sessionID;
    }
   
     setSessionID(value) {
        this.sessionID = value;
    }

}

export let socket = io();
export let user = new User( "Guest" +  Math.floor( Math.random() * 10000), "default");
let sessionForm = document.querySelector("#session-form");
let sessionId;


sessionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let modal = document.querySelector("#modal-session");

    // get session Id
     sessionId = sessionForm["session-id"].value;
     M.Modal.getInstance(modal).close();
     sessionForm.reset();

     let prevSession = user.sessionID;
     user.sessionID = sessionId;

     console.log(user.name);
     socket.emit("joinSession", user, prevSession);
     window.location.replace(window.location.origin + "/" + user.sessionID);
    //console.log(sessionId);
});

socket.on("updateRoom", (room) => {
    user.sessionID = room;
    socket.emit("joinSession", user);
});

// get the username when the user is signed in, username is -1 if not logged in
socket.on("giveUsername" , (username) => {
    if (username != -1) {
        user.name = username;
    } else {
        user.name =  "Guest" +  Math.floor( Math.random() * 10000);
    }
});


