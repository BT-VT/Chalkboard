"use strict";

function routerFw(params) {

    var contentId = params.contentId || "content";
    var startLink = params.startLink || "#/home";
    var routes = params.routes;

    function inject(what) {
        document.getElementById(contentId).innerHTML = "";
        document.getElementById(contentId).appendChild(what);
    }

    function router() {
        
        var path = location.hash;
        console.log('path is ' + path);

        if (routes[path]) {
            var ele = routes[path]();
            inject(ele);
        } else {
            var ele = routes[startLink]();
            inject(ele);
        }
    }

    window.addEventListener('hashchange', router);
    location.hash = "xxx";
    location.hash = startLink;
}