import {socket} from "./chat.js"
// listen for auth status changes
auth.onAuthStateChanged(user => {
    if (user) {
        setupUI(user);
        socket.emit("getUsernameFromAuth", auth.currentUser.email);
    } else {
        setupUI();
        socket.emit("getUsernameFromAuth", -1);
    }
})

// signup
const signupForm = document.querySelector('#signup-form');
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // get user info
    const email = signupForm['signup-email'].value;
    const password = signupForm['signup-password'].value;
    

    // sign up the user
    auth.createUserWithEmailAndPassword(email, password).then(cred => {
        // close the signup modal & reset form
        const modal = document.querySelector('#modal-signup');
        M.Modal.getInstance(modal).close();
        signupForm.reset();
    });
});

// logout
const logout = document.querySelector('#logout');
logout.addEventListener('click', (e) => {
    //e.preventDefault();
    auth.signOut();
    document.querySelector(".account-details").innerHTML = `
            <h4>Logged out.</h4>
        `;
    document.getElementById("navEmail").innerHTML = "";
});

// login
const loginForm = document.querySelector('#login-form');
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    

    // get user info
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;

    // log the user in
    auth.signInWithEmailAndPassword(email, password).then((cred) => {
        // close the signup modal & reset form
        const modal = document.querySelector('#modal-login');
        M.Modal.getInstance(modal).close();
        loginForm.reset();
       
    });

});

//delete account
const deleteBtn = document.querySelector('#delete-account');
deleteBtn.addEventListener('click', (e) => {
    e.preventDefault();
    auth.currentUser.delete().then(function () {
        // User deleted.
        document.querySelector(".account-details").innerHTML = `
            <h4>Account successfully deleted.</h4>
        `;
        document.getElementById("navEmail").innerHTML = "";
    }).catch(function (error) {
        // An error happened.
        console.log(error);
    });
});
