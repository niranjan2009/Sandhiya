const wrapper = document.getElementById("envelopeWrapper");
const seal = document.getElementById("seal");
const flap = document.getElementById("flap");
const letter = document.getElementById("letter");
const bgMusic = document.getElementById("bgMusic");
const heartMusic = document.getElementById("heartMusic");
const sealSound = document.getElementById("sealSound");
const openSound = document.getElementById("openSound");
const nextArrow = document.getElementById("nextArrow");
const scrollHint = document.getElementById("scrollHint");
const countdownMusic = document.getElementById("countdownMusic");

const isSmall = window.matchMedia("(max-width: 900px)").matches; // phones / small tablets

let opened = false;
let experienceStarted = false; // becomes true after "Tap to open" on the loader
let typingStarted = false;

function safePlay(a) {
    if (!a) return;
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
}

/* ==========================================
   LOVE PRELOADER - "Loading our memories"
   Loads every image + audio (+ fonts) first, then waits for a
   tap. The tap also unlocks all sounds for phones.
========================================== */
const BASE_ASSETS = [
    "assets/background.jpg",
    "assets/envelope-bottom.png",
    "assets/envelope-flap.png",
    "assets/paper.png",
    "assets/wax-seal.png",
    "assets/petal.png",
    "assets/music.mp3",
    "assets/seal-break.mp3",
    "assets/open.mp3",
    "assets/heart-music.mp3",
    "assets/countdown.mp3"
];

const LOADER_MSGS = [
    "Gathering our first smiles...",
    "Pressing rose petals...",
    "Tuning our song...",
    "Folding every little memory...",
    "Sealing the envelope with love..."
];

function buildLoader() {
    let el = document.getElementById("loader");
    if (el) return el;

    const heart = "M50 84 C18 60 4 44 4 26 C4 13 14 4 27 4 C37 4 45 9 50 17 C55 9 63 4 73 4 C86 4 96 13 96 26 C96 44 82 60 50 84 Z";
    el = document.createElement("div");
    el.id = "loader";
    el.innerHTML =
        '<div class="loader-floaters"></div>' +
        '<div class="loader-stage">' +
            '<div class="loader-heart">' +
                '<svg viewBox="0 0 100 90" aria-hidden="true">' +
                    '<defs><clipPath id="heartClip"><path d="' + heart + '"/></clipPath></defs>' +
                    '<g clip-path="url(#heartClip)"><rect class="heart-fill" x="0" y="0" width="100" height="90"/></g>' +
                    '<path class="heart-outline" d="' + heart + '"/>' +
                '</svg>' +
                '<div class="loader-percent">0%</div>' +
            '</div>' +
            '<div class="loader-title">Loading our memories...</div>' +
            '<div class="loader-msg"></div>'
