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
HELPERS
==========================================================
*/

function scrambleText(element, targetText, duration = 900) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%&*#@!~";
    const start = performance.now();

    function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);

        let output = "";

        for (let i = 0; i < targetText.length; i++) {
            if (i < Math.floor(progress * targetText.length)) {
                output += targetText[i];
            } else {
                output += alphabet[Math.floor(Math.random() * alphabet.length)];
            }
        }

        element.textContent = output;

        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            element.textContent = targetText;
        }
    }

    requestAnimationFrame(tick);
}

function animateHeroRoles() {
    const roleItems = [...document.querySelectorAll(".hero__roles li")];

    if (!roleItems.length) return;

    roleItems.forEach((item, index) => {
        const finalText = item.textContent.trim();

        item.textContent = "";
        item.style.opacity = "0";
        item.style.transform = "translateY(10px)";
        item.style.filter = "blur(2px)";

        window.setTimeout(() => {
            item.style.transition = "opacity 220ms ease, transform 220ms ease, filter 220ms ease";
            item.style.opacity = "1";
            item.style.transform = "translateY(0)";
            item.style.filter = "blur(0)";
            scrambleText(item, finalText, 700 + index * 180);
        }, 250 + index * 260);
    });
}

/*
==========================================================
JOURNEY
==========================================================
*/

function leavePrologue() {
    if (!prologue) return;

    prologue.classList.add("is-leaving");
    window.setTimeout(revealHarbor, TRANSITION_DURATION);
}

function revealHarbor() {
    if (!harbor) return;

    harbor.classList.add("is-visible");
    harbor.removeAttribute("aria-hidden");

    if (prologue) {
        prologue.remove();
    }

    window.setTimeout(animateHeroRoles, 150);
}

/*
==========================================================
EVENTS
==========================================================
*/

if (castOffButton) {
    castOffButton.addEventListener("click", leavePrologue);
}

/*
==========================================================
INITIALIZATION
==========================================================
*/

document.addEventListener("DOMContentLoaded", () => {
    if (harbor) {
        harbor.setAttribute("aria-hidden", "true");
    }

    if (!prologue) {
        animateHeroRoles();
    }
});