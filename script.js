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

let opened = false;

/* ==================
   CLICK TO OPEN
================== */
wrapper.addEventListener("click", openEnvelope);

function openEnvelope() {
    if (opened) return;
    opened = true;
    wrapper.classList.add("open");

    if (sealSound) {
        sealSound.currentTime = 0;
        sealSound.play();
    }

    setTimeout(() => {
        if (openSound) {
            openSound.currentTime = 0;
            openSound.play();
        }
    }, 500);

    setTimeout(() => {
        document.body.classList.add("read-mode");
    }, 2000);

    setTimeout(() => {
        if (bgMusic) {
            bgMusic.volume = 0.1;
            bgMusic.play().catch(() => console.log("Music blocked until user interaction."));
        }
    }, 1200);

    letter.scrollTop = 0;
}

document.querySelectorAll("img").forEach(img => img.draggable = false);

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") openEnvelope();
});

letter.addEventListener("scroll", () => {
    const maxScroll = letter.scrollHeight - letter.clientHeight;
    const progress = letter.scrollTop / maxScroll;
    letter.style.boxShadow = `0 20px 50px rgba(0,0,0,.45), 0 0 ${progress * 60}px rgba(255, 180, 180,.35)`;
});

const preload = ["assets/background.jpg", "assets/envelope-bottom.png", "assets/envelope-flap.png", "assets/paper.png", "assets/wax-seal.png", "assets/petal.png"];
preload.forEach(src => { const img = new Image(); img.src = src; });

/* =========================================================
   ABSOLUTE ASSET PRE-LOADER (Waits for Audio & Images)
========================================================= */
const assetsToLoad = [
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

let loadedCount = 0;
const preloader = document.getElementById("preloader");

function assetLoaded() {
    loadedCount++;
    // When all files are successfully loaded
    if (loadedCount >= assetsToLoad.length) {
        startExperience();
    }
}

function startExperience() {
    setTimeout(() => {
        preloader.style.opacity = "0"; // Fade out
        setTimeout(() => {
            preloader.style.display = "none"; // Remove from screen
            wrapper.animate([
                { transform: "translateY(50px)", opacity: 0 },
                { transform: "translateY(0)", opacity: 1 }
            ], { duration: 1200, easing: "ease-out" });
        }, 1000);
    }, 1000);
}

// Loop through the list and force the browser to load them
assetsToLoad.forEach(src => {
    if (src.endsWith(".mp3")) {
        const audio = new Audio();
        audio.src = src;
        audio.addEventListener("canplaythrough", assetLoaded, { once: true });
        audio.load();
    } else {
        const img = new Image();
        img.src = src;
        img.onload = assetLoaded;
        img.onerror = assetLoaded; // Prevents getting stuck if a file fails
    }
});

// SAFETY FALLBACK: Mobile browsers sometimes block background audio loading to save data.
// If 6 seconds pass and it's still loading, we force it to open anyway so she doesn't get stuck.
setTimeout(() => {
    if (loadedCount < assetsToLoad.length) {
        loadedCount = assetsToLoad.length;
        startExperience();
    }
}, 6000);

wrapper.addEventListener("touchstart", openEnvelope);

const particleContainer = document.getElementById("particles");
function createParticle() {
    const p = document.createElement("div");
    p.classList.add("particle");
    p.style.left = Math.random() * window.innerWidth + "px";
    p.style.top = window.innerHeight + "px";
    p.style.animationDuration = (6 + Math.random() * 8) + "s";
    p.style.opacity = 0.2 + Math.random() * 0.8;
    p.style.transform = `scale(${0.5 + Math.random()})`;
    particleContainer.appendChild(p);
    setTimeout(() => p.remove(), 15000);
}
setInterval(createParticle, 180);

const petalContainer = document.getElementById("petals");
function createPetal() {
    const petal = document.createElement("img");
    petal.src = "assets/petal.png";
    petal.classList.add("petal");
    petal.style.left = Math.random() * window.innerWidth + "px";
    petal.style.top = "-100px";
    petal.style.width = (40 + Math.random() * 5) + "px";
    petal.style.animationDuration = (8 + Math.random() * 6) + "s";
    petal.style.transform = `rotate(${Math.random() * 360}deg)`;
    petalContainer.appendChild(petal);
    setTimeout(() => petal.remove(), 16000);
}
setInterval(createPetal, 600);


/* ============================
   SMART TYPEWRITER EFFECT
============================ */
const textContainer = document.querySelector(".letter-text");
const originalText = textContainer.innerHTML;
textContainer.innerHTML = "";
let index = 0;

function typeWriter() {
    if (index < originalText.length) {
        let char = originalText.charAt(index);

        // 1. Check if we hit an HTML tag (like <br> or <h2>)
        if (char === '<') {
            let tag = "";
            while (index < originalText.length) {
                tag += originalText.charAt(index);
                if (originalText.charAt(index) === '>') {
                    index++;
                    break;
                }
                index++;
            }
            textContainer.innerHTML += tag;
            typeWriter(); // Instantly fire next character so there's no delay for tags
            
        // 2. Check if we hit an HTML symbol code (like &amp;)
        } else if (char === '&') {
            let entity = "";
            while (index < originalText.length) {
                entity += originalText.charAt(index);
                if (originalText.charAt(index) === ';') {
                    index++;
                    break;
                }
                index++;
            }
            textContainer.innerHTML += entity;
            typeWriter(); // Instantly fire next character
            
        // 3. Normal text characters type out slowly
} else {
  textContainer.innerHTML += char;
  index++;
  setTimeout(typeWriter, 20); 
}
    } else {
        // Show "(Scroll Down)" hint once the typewriter effect finishes completely
        if (scrollHint) {
            scrollHint.classList.add("show");
        }
    }
}

wrapper.addEventListener("click", () => {
    if (index === 0) setTimeout(typeWriter, 1800);
});


/* ============================
   FINAL MESSAGE & NEXT ARROW
============================ */
const finalMessage = document.createElement("div");
finalMessage.className = "final-message";
finalMessage.innerHTML = "<br><br>I Love You Forever<br><br>Sandhiya";

const letterContent = letter.querySelector(".letter-content");
letterContent.insertBefore(finalMessage, nextArrow);

letter.addEventListener("scroll", () => {
    const distance = letter.scrollHeight - letter.clientHeight;
    if (letter.scrollTop >= distance - 50) {
        finalMessage.classList.add("show");
        setTimeout(() => {
            nextArrow.classList.add("show");
        }, 800);
    }
});

document.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - .5) * 15;
    const y = (e.clientY / window.innerHeight - .5) * 15;
    document.body.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
});

function createHeart() {
    const heart = document.createElement("div");
    heart.innerHTML = "❤";
    heart.style.position = "absolute";
    heart.style.left = Math.random() * window.innerWidth + "px";
    heart.style.bottom = "-40px";
    heart.style.color = "rgba(255,180,220,.5)";
    heart.style.fontSize = (25 + Math.random() * 30) + "px";
    heart.style.pointerEvents = "none";
    heart.style.transition = "all 10s linear";
    document.body.appendChild(heart);
    setTimeout(() => {
        heart.style.transform = `translateY(-${window.innerHeight + 300}px) rotate(${Math.random() * 720}deg)`;
        heart.style.opacity = 0;
    }, 100);
    setTimeout(() => heart.remove(), 11000);
}
setInterval(createHeart, 2500);

/* =========================================================
   PARTICLE TEXT ANIMATION & FINAL BURST
========================================================= */

nextArrow.addEventListener("click", () => {
  document.body.classList.add("particle-mode");
  setTimeout(startParticleAnimation, 1200);
  
  // 1. Pause the original background music
  if (bgMusic) {
    bgMusic.pause();
  }
  
  // 2. Play the new countdown music
  if (countdownMusic) {
    countdownMusic.volume = 0.25; // Adjust this number to change the volume
    countdownMusic.currentTime = 0;
    countdownMusic.play().catch(() => console.log("Music blocked by browser."));
  }
});

const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');
let width, height;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const chars = ['♥']; 
const textParticles = []; 
let isHeartPhase = false;
let heartTime = 0;
let hasBurst = false;

class TextParticle {
    constructor(x, y, color) {
        this.x = width / 2 + (Math.random() - 0.5) * 200;
        this.y = height / 2 + (Math.random() - 0.5) * 200;
        this.baseTargetX = x;
        this.baseTargetY = y;
        this.targetX = x;
        this.targetY = y;
        this.color = color || '#ffffff';
        this.char = chars[Math.floor(Math.random() * chars.length)];
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.82;
        this.spring = 0.08;
        this.isExploding = false;
        this.isActive = true;
    }

    update() {
        if (!this.isActive) return;
        if (this.isExploding) {
            this.vx *= 0.94;
            this.vy *= 0.94;
            this.x += this.vx;
            this.y += this.vy;
        } else {
            let tx = this.targetX;
            let ty = this.targetY;
            if (isHeartPhase) {
                const cx = width / 2;
                const cy = height / 2;
                const scale = 1 + Math.sin(heartTime) * 0.06;
                tx = cx + (this.baseTargetX - cx) * scale;
                ty = cy + (this.baseTargetY - cy) * scale;
            }
            const dx = tx - this.x;
            const dy = ty - this.y;
            this.vx += dx * this.spring;
            this.vy += dy * this.spring;
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.x += this.vx;
            this.y += this.vy;
        }
    }

    draw(ctx) {
    if (!this.isActive) return;

    // 1. Give each particle a random starting timer so they don't all blink at the exact same time
    if (!this.lastFlash) {
      this.lastFlash = Date.now() - Math.floor(Math.random() * 200);
    }

    // 2. Check if 300 milliseconds have passed. If so, pick a new random color!
    if (Date.now() - this.lastFlash > 200) {
      this.hue = Math.floor(Math.random() * 360);
      this.lastFlash = Date.now();
    }

    // 3. Apply the color
    ctx.fillStyle = `hsl(${this.hue}, 100%, 60%)`;
    ctx.font = '11px Courier New';
    ctx.fillText(this.char, this.x, this.y);
  }
}

function getTextPoints(text, fontSize) {
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    offCanvas.width = width;
    offCanvas.height = height;
    
    offCtx.fillStyle = 'black';
    offCtx.fillRect(0, 0, width, height);
    offCtx.fillStyle = 'white';
    offCtx.font = `bold ${fontSize}px Arial`;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillText(text, width / 2, height / 2);

    const imageData = offCtx.getImageData(0, 0, width, height).data;
    const points = [];
    const step = 8; 
    
    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            const index = (y * width + x) * 4;
            if (imageData[index] > 128) {
                points.push({ 
                    x: x + (Math.random() - 0.5) * 4, 
                    y: y + (Math.random() - 0.5) * 4 
                });
            }
        }
    }
    return points;
}

function getHeartPoints() {
    const points = [];
    const scale = Math.min(width, height) / 50; 
    const cx = width / 2;
    const cy = height / 2 - 20; 

    for (let t = 0; t < Math.PI * 2; t += 0.02) {
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        for(let i = 0; i < 5; i++) {
            points.push({
                x: cx + x * scale + (Math.random() - 0.5) * 20,
                y: cy + y * scale + (Math.random() - 0.5) * 20
            });
        }
    }
    return points;
}

function updateTargets(newTargets, color) {
    for (let i = 0; i < newTargets.length; i++) {
        if (i < textParticles.length) {
            textParticles[i].baseTargetX = newTargets[i].x;
            textParticles[i].baseTargetY = newTargets[i].y;
            textParticles[i].targetX = newTargets[i].x;
            textParticles[i].targetY = newTargets[i].y;
            textParticles[i].color = color;
            textParticles[i].isActive = true;
            textParticles[i].isExploding = false;
        } else {
            textParticles.push(new TextParticle(newTargets[i].x, newTargets[i].y, color));
        }
    }
    for (let i = newTargets.length; i < textParticles.length; i++) {
        textParticles[i].isActive = false;
    }
}

function explode() {
    textParticles.forEach(p => {
        if (p.isActive) {
            const angle = Math.random() * Math.PI * 2;
            const force = 15 + Math.random() * 35; 
            p.vx = Math.cos(angle) * force;
            p.vy = Math.sin(angle) * force;
            p.isExploding = true;
        }
    });
}

function startFallingHearts() {
    setInterval(() => {
        const heart = document.createElement("div");
        heart.innerHTML = "❤";
        heart.className = "falling-heart";
        heart.style.left = Math.random() * window.innerWidth + "px";
        heart.style.fontSize = (15 + Math.random() * 20) + "px";
        heart.style.animationDuration = (3 + Math.random() * 3) + "s";
        document.body.appendChild(heart);
        
        setTimeout(() => {
            heart.remove();
        }, 6000);
    }, 100); 
}

canvas.addEventListener("click", () => {
    if (isHeartPhase && !hasBurst) {
        hasBurst = true;
        document.body.classList.remove("heart-ready");
        explode();
        startFallingHearts();
        
        if (bgMusic) bgMusic.pause();
        if (countdownMusic) {
            countdownMusic.pause();
            countdownMusic.currentTime = 0;
        }
        if (heartMusic) {
            heartMusic.volume = 0.5; 
            heartMusic.currentTime = 0; 
            heartMusic.play().catch(() => console.log("Heart music blocked."));
        }

        // ---> NEW: Show the question 4 seconds after the heart bursts <---
        setTimeout(() => {
            document.getElementById("loveQuestion").classList.add("show");
        }, 4000);
    }
});

const sequence = [
{ type: 'text', val: '3', color: '#FFD700' },    // Gold
{ type: 'text', val: '2', color: '#FF8C00' },    // Dark Orange
{ type: 'text', val: '1', color: '#FF69B4' },    // Hot Pink
{ type: 'text', val: 'You', color: '#00FFFF' },  // Cyan / Bright Blue
{ type: 'text', val: 'Are', color: '#98FB98' },  // Mint Green
{ type: 'text', val: 'My', color: '#DDA0DD' },   // Plum / Light Purple
{ type: 'text', val: 'Love', color: '#FF3333' }, // Bright Red
{ type: 'heart', color: '#ff66b2' }              // (Kept the original pink for the heart shape)
];

let currentIndex = 0;

function nextSequence() {
    if (currentIndex >= sequence.length) return;
    const current = sequence[currentIndex];
    let targets = [];

    if (current.type === 'text') {
        const fontSize = Math.min(width, height) * 0.45; 
        targets = getTextPoints(current.val, fontSize);
        updateTargets(targets, current.color);
        
        setTimeout(() => {
            explode();
            setTimeout(() => {
                currentIndex++;
                nextSequence();
            }, 700); 
        }, 1400); 
        
    } else if (current.type === 'heart') {
        targets = getHeartPoints();
        updateTargets(targets, current.color); // fixed parameter assignment syntax
        isHeartPhase = true;
        
        setTimeout(() => {
            document.body.classList.add("heart-ready");
        }, 1000);
    }
}

function animateParticles() {
    ctx.fillStyle = 'rgba(26, 26, 28, 0.3)';
    ctx.fillRect(0, 0, width, height);

    if (isHeartPhase) {
        heartTime += 0.08; 
        
        if (!hasBurst) {
            ctx.fillStyle = '#ffb3d9';
            ctx.font = 'bold 26px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText("I LOVE YOU SANDHIYA ♥", width / 2, height / 2);
            
            // Instruction 3: Low-opacity "(Tap Here)" text inside the heart, just beneath her name
            ctx.fillStyle = 'rgba(255, 179, 217, 0.45)'; // Low opacity soft pink
            ctx.font = '13px Courier New';
            ctx.fillText("(Tap Here)", width / 2, (height / 2) + 30);
        }
    }

    textParticles.forEach(p => {
        p.update();
        p.draw(ctx);
    });
    requestAnimationFrame(animateParticles);
}

function startParticleAnimation() {
    setTimeout(() => {
        nextSequence();
    }, 500);
    animateParticles();
}

/* ============================
   RUNAWAY BUTTON LOGIC
============================ */
const btnNo = document.getElementById("btnNo");
const btnYes = document.getElementById("btnYes");

function moveNoButton(e) {
    e.preventDefault(); 
    
    // Calculates a wider random jump
    const x = Math.random() * 300 - 150; 
    const y = Math.random() * 300 - 150; 
    
    // Adds a random tilt/rotation so it looks like it's tumbling away
    const rotation = Math.random() * 40 - 20; 
    
    // Moves it, rotates it, and shrinks it slightly so it looks intimidated!
    btnNo.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(0.85)`;
    
    // Makes it fade out slightly every time she tries to catch it
    btnNo.style.opacity = "0.7";
}

// Triggers when the mouse hovers over it
btnNo.addEventListener("mouseover", moveNoButton);
// Triggers when a finger tries to tap it on a phone
btnNo.addEventListener("touchstart", moveNoButton);

// What happens when she finally clicks YES
btnYes.addEventListener("click", () => {
    const questionBox = document.getElementById("loveQuestion");
    
    // Change the text to a happy message
    questionBox.innerHTML = `<h2>I knew it! ❤️<br>You are my everything.</h2>`;
    
    // Spawn a massive burst of extra hearts
    for(let i = 0; i < 20; i++) {
        setTimeout(createHeart, i * 150);
    }
});
