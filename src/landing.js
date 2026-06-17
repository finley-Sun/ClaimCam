// landing.js
// Reads the 'portal' URL parameter on page load and redirects to index.html
// if the parameter is already set to a recognised portal value ('owner' or 'tenant').
// All other navigation is handled by the anchor tags in the HTML.

"use strict";

document.addEventListener("DOMContentLoaded", function () {
    var params = new URLSearchParams(window.location.search);
    var portal = params.get("portal");

    if (portal === "owner" || portal === "tenant") {
        window.location.href = "index.html?portal=" + portal;
    }
});