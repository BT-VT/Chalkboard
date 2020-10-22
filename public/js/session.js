import {socket} from "./chat.js"
let sessionForm = document.querySelector("#session-form");
let sessionId;

sessionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let modal = document.querySelector("#modal-session");

    // get session Id
     sessionId = sessionForm["session-id"].value;
     M.Modal.getInstance(modal).close();
     sessionForm.reset();

    

    //console.log(sessionId);
});

