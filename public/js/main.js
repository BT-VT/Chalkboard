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

     user.sessionID = sessionId;

    socket.emit("sessionID", user);

    //console.log(sessionId);
});

// get the username when the user is signed in, username is -1 if not logged in
socket.on("giveUsername" , (username) => {
    console.log("username is working")
    if (username != -1) {
        user.name = username;
    } else {
        name =  "Guest" +  Math.floor( Math.random() * 10000);
    }
});
