import {socket, paperSockets} from '/js/paperSockets.js';

window.addEventListener("hashchange", function () {
    if (location.hash == "#/my-chalkboards") {
        chalkboardGrid();
    } else {
        console.log("running paperSockets from hashchange");
        paperSockets();

    }
});

// window.addEventListener("load", function() {
//     paperSockets();
// });

window.onload = () => {
    console.log("running paperSockets from window.onload()");
    paperSockets();
}
