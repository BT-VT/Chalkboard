import {socket, paperSockets} from '/js/paperSockets.js';

window.addEventListener("hashchange", function () {
    if (location.hash == "#/my-chalkboards") {
        chalkboardGrid();
    } else {
        paperSockets();

    }
});

window.addEventListener("load", function() {
    paperSockets();
});
