// DOM elements
const loggedOutLinks = document.querySelectorAll('.logged-out');
const loggedInLinks = document.querySelectorAll('.logged-in');
const accountDetails = document.querySelector(".account-details");
const navEmail = document.getElementById("navEmail");

const setupUI = (user) => {
    if (user) {
        //show user info in account modal
        var html = `
        <div>Logged in as ${user.email}</div>
    `;
        accountDetails.innerHTML = html;
        // toggle user UI elements
        loggedInLinks.forEach(item => item.style.display = 'block');
        loggedOutLinks.forEach(item => item.style.display = 'none');

        //show user email in nav
        var email = document.createElement("div");
        email.innerHTML = user.email;
        navEmail.appendChild(email);

        auth.user_email = user.email;
    } else {
        //hide user info
        accountDetails.innerHTML = '';
        // toggle user elements
        loggedInLinks.forEach(item => item.style.display = 'none');
        loggedOutLinks.forEach(item => item.style.display = 'block');
    }
};

// setup materialize components
document.addEventListener('DOMContentLoaded', function () {

    var modals = document.querySelectorAll('.modal');
    M.Modal.init(modals);

    var items = document.querySelectorAll('.collapsible');
    M.Collapsible.init(items);

});