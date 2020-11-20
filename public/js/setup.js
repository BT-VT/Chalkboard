import {socket, paperSockets} from '/js/paperSockets.js';

window.addEventListener("hashchange", function () {
    if (location.hash == "#/my-chalkboards") {
        chalkboardGrid();
    }
});

window.addEventListener("load", function() {
    if (location.hash != "#/my-chalkboards") {
        console.log("running paperSockets from onLoad listener");
        paperSockets();
    }
});
