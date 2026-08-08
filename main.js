/*
==========================================================
Harbor
Oak 0.1 — Departure
Author: Haga Pradiva
==========================================================
*/


/*
==========================================================
ELEMENTS
==========================================================
*/

const prologue = document.querySelector("#prologue");
const harbor = document.querySelector("#harbor");
const castOffButton = document.querySelector("#cast-off");


/*
==========================================================
CONFIGURATION
==========================================================
*/

const TRANSITION_DURATION = 1400;


/*
==========================================================
JOURNEY
==========================================================
*/

/**
 * Begins Harbor.
 * The prologue quietly departs before revealing the website.
 */
function leavePrologue() {

    prologue.classList.add("is-leaving");

    window.setTimeout(revealHarbor, TRANSITION_DURATION);

}


/**
 * Reveals Harbor after the prologue has departed.
 */
function revealHarbor() {

    harbor.classList.add("is-visible");
    harbor.removeAttribute("aria-hidden");

    prologue.remove();

}


/*
==========================================================
EVENTS
==========================================================
*/

castOffButton.addEventListener("click", leavePrologue);


/*
==========================================================
INITIALIZATION
==========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    harbor.setAttribute("aria-hidden", "true");

});