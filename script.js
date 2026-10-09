/* =========================================================
   To My Dear Sandhiya — script.js (v2)
   Works together with index.html and style.css (v2).
========================================================= */
(() => {
'use strict';

/* ---------- shortcuts ---------- */
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const isSmallScreen = () =>
  window.matchMedia('(max-width: 900px)').matches ||
  window.matchMedia('(pointer: coarse)').matches;

const wrapper        = $('envelopeWrapper');
const letter         = $('letter');
const bgMusic        = $('bgMusic');
const heartMusic     = $('heartMusic');
const sealSound      = $('sealSound');
const openSound      = $('openSound');
const countdownMusic = $('countdownMusic');
const nextArrow      = $('nextArrow');
const scrollHint     = $('scrollHint');
const preloader      = $('preloader');
const loaderPercent  = $('loaderPercent');
const loaderStatus   = $('loaderStatus');

/* One heart shape, used for every heart on the page. It is drawn as a
   vector (not a text symbol) so phones can never swap it for a red emoji. */
const HEART_PATH = 'M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4c0,9.4,9.5,11.9,16,21.2c6.1-9.3,16-12.1,16-21.2C32,3.8,28.2,0,23.6,0z';
function makeHeart(sizePx, color) {
  const d = document.createElement('div');
  d.style.cssText = `color:${color};font-size:${sizePx}px;line-height:0;pointer-events:none;`;
  d.innerHTML = `<svg viewBox="0 0 32 29.6" style="width:1em;height:1em;display:block" aria-hidden="true"><path fill="currentColor" d="${HEART_PATH}"/></svg>`;
  return d;
}

function playSound(a, volume) {
  if (!a) return;
  try {
    a.currentTime = 0;
    if (volume != null) a.volume = volume;
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
  } catch (_) {}
}

/* =========================================================
   1. LOADING SCREEN — loads everything before the page begins
========================================================= */
const IMAGES = [
  'assets/background.jpg',
  'assets/envelope-bottom.png',
  'assets/envelope-flap.png',
  'assets/paper.png',
  'assets/wax-seal.png',
  'assets/petal.png'
];
const SOUNDS = [
  'assets/music.mp3',
  'assets/seal-break.mp3',
  'assets/open.mp3',
  'assets/heart-music.mp3',
  'assets/countdown.mp3'
];

const prog = {
  fonts: 0,
  images: new Array(IMAGES.length).fill(0),
  sounds: new Array(SOUNDS.length).fill(0)
};
const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

let allSettled = false;
let started = false;

/* Download a file and report 0..1 as it arrives. The browser keeps the
   file, so the page and the audio tags get it instantly afterwards. */
async function fetchTracked(url, report) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const total = Number(res.headers.get('content-length')) || 0;
  if (!res.body || !total) { await res.blob(); report(1); return; }
  const reader = res.body.getReader();
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    got += value.length;
    report(Math.min(got / total, 0.99));
  }
  report(1);
}

async function loadImage(src, i) {
  const report = (v) => { prog.images[i] = v; };
  try {
    await fetchTracked(src, report);
  } catch (_) {
    // opened from a folder (file://) or fetch blocked: let the image tag do it
    await new Promise((r) => { const im = new Image(); im.onload = im.onerror = r; im.src = src; });
  }
  try { const im = new Image(); im.src = src; if (im.decode) await im.decode(); } catch (_) {}
  report(1);
}

async function loadSound(src, i) {
  const report = (v) => { prog.sounds[i] = v; };
  try {
    await fetchTracked(src, report);
  } catch (_) {
    await new Promise((r) => {
      const a = new Audio();
      a.preload = 'auto';
      a.addEventListener('canplaythrough', r, { once: true });
      a.addEventListener('error', r, { once: true });
      setTimeout(r, 4000);
      a.src = src;
    });
  }
  report(1);
}

async function loadFonts() {
  const link = document.querySelector('link[href*="fonts.googleapis.com"]');
  if (link && !link.sheet) {
    await Promise.race([
      new Promise((r) => {
        link.addEventListener('load', r, { once: true });
        link.addEventListener('error', r, { once: true });
      }),
      wait(5000)
    ]);
  }
  prog.fonts = 0.5;
  if (document.fonts && document.fonts.load) {
    await Promise.race([
      Promise.all([
        document.fonts.load('600 1em Cinzel'),
        document.fonts.load('1em "Great Vibes"'),
        document.fonts.load('300 1em Poppins'),
        document.fonts.load('400 1em Poppins'),
        document.fonts.load('500 1em Poppins'),
        document.fonts.load('600 1em Poppins')
      ]),
      wait(5000)
    ]).catch(() => {});
  }
  prog.fonts = 1;
}

function overallProgress() {
  // script.js and style.css are already here, so "code" counts as done (6%)
  return 0.06 + 0.10 * prog.fonts + 0.36 * avg(prog.images) + 0.48 * avg(prog.sounds);
}

function statusText() {
  if (prog.fonts < 1) return 'Getting things ready…';
  if (avg(prog.images) < 1) return 'Preparing the envelope…';
  if (avg(prog.sounds) < 1) return 'Tuning the music…';
  return 'Almost there…';
}

(function runLoader() {
  const t0 = performance.now();
  const MIN_SHOW = 900;      // never flash the loader for a split second
  const HARD_LIMIT = 20000;  // never get stuck on a bad connection
  let shown = 0;
  let lastStatus = '';
  let lastPct = -1;

  Promise.allSettled([
    loadFonts(),
    ...IMAGES.map(loadImage),
    ...SOUNDS.map(loadSound)
  ]).then(() => { allSettled = true; });

  function frame(now) {
    const timedOut = now - t0 > HARD_LIMIT;
    const target = (allSettled || timedOut) ? 1 : Math.min(overallProgress(), 0.99);
    shown += (target - shown) * 0.14;
    if (target - shown < 0.002) shown = target;

    const pct = Math.round(shown * 100);
    if (preloader) preloader.style.setProperty('--p', (shown * 100).toFixed(1));
    if (loaderPercent && pct !== lastPct) { loaderPercent.textContent = pct + '%'; lastPct = pct; }
    const st = shown >= 0.995 ? 'Ready ♥' : statusText();
    if (loaderStatus && st !== lastStatus) { loaderStatus.textContent = st; lastStatus = st; }

    if (shown >= 0.995 && now - t0 > MIN_SHOW) {
      setTimeout(startExperience, 350);
    } else {
      requestAnimationFrame(frame);
    }
  }
  requestAnimationFrame(frame);
})();

function startExperience() {
  if (started) return;
  started = true;
  if (preloader) {
    preloader.classList.add('is-done');
    setTimeout(() => preloader.remove(), 1100);
  }
  document.body.classList.remove('loading');
  try {
    wrapper.animate(
      [{ translate: '0 50px', opacity: 0 }, { translate: '0 0', opacity: 1 }],
      { duration: 1200, easing: 'ease-out' }
    );
  } catch (_) {}
  startAmbient();
}

/* =========================================================
   2. OPEN THE ENVELOPE
========================================================= */
let opened = false;

wrapper.setAttribute('role', 'button');
wrapper.setAttribute('tabindex', '0');
wrapper.setAttribute('aria-label', 'Open the letter');

/* Phones only let a sound start after a tap. The first tap "unlocks" every
   sound quietly so the timed ones (music, open sound) still play later. */
function unlockAudio() {
  [openSound, bgMusic, heartMusic, countdownMusic].forEach((a) => {
    if (!a) return;
    try {
      a.muted = true;
      const p = a.play();
      Promise.resolve(p).then(() => { a.pause(); a.currentTime = 0; a.muted = false; })
        .catch(() => { a.muted = false; });
    } catch (_) { a.muted = false; }
  });
}

function openEnvelope() {
  if (opened || !started) return;
  opened = true;

  wrapper.classList.add('open');
  playSound(sealSound);
  unlockAudio();

  setTimeout(() => playSound(openSound), 500);
  setTimeout(() => playSound(bgMusic, 0.5), 1200);
  setTimeout(startTypewriter, 1800);
  setTimeout(enterReadMode, 2000);
  letter.scrollTop = 0;
}

wrapper.addEventListener('click', openEnvelope);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    if (!opened && started) { e.preventDefault(); openEnvelope(); }
  }
});

/* Full-screen reading: the letter leaves the (scaled-down) envelope and
   glides to fill the screen. This is what makes it readable on phones. */
function enterReadMode() {
  const first = letter.getBoundingClientRect();
  document.body.appendChild(letter);
  document.body.classList.add('read-mode');
  letter.scrollTop = 0;
  const last = letter.getBoundingClientRect();
  const box = (r) => ({
    left: (r.left + r.width / 2) + 'px',
    top: (r.top + r.height / 2) + 'px',
    width: r.width + 'px',
    height: r.height + 'px'
  });
  try {
    letter.animate([box(first), box(last)], { duration: 1500, easing: 'ease-in-out' });
  } catch (_) {}
}

/* =========================================================
   3. TYPEWRITER (types the letter without re-building it each letter)
========================================================= */
const textContainer = document.querySelector('.letter-text');
const typingOps = [];
const CHAR_MS = 20;
let typingDone = false;
let typingStarted = false;

(function planTyping() {
  const walk = (parent) => {
    parent.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        const s = n.nodeValue.replace(/\s+/g, ' ');
        if (s.trim() === '') return;
        typingOps.push({ t: 'text', chars: Array.from(s) });
      } else if (n.nodeType === 1) {
        if (n.tagName === 'BR') {
          typingOps.push({ t: 'node', el: n });
        } else {
          typingOps.push({ t: 'open', el: n });
          walk(n);
          typingOps.push({ t: 'close' });
        }
      }
    });
  };
  walk(textContainer);
  textContainer.textContent = '';
})();

function startTypewriter() {
  if (typingStarted) return;
  typingStarted = true;
  const stack = [textContainer];
  let i = 0;
  let pos = 0;
  let node = null;
  let acc = 0;
  let last = performance.now();

  function frame(now) {
    acc += Math.min(now - last, 100);
    last = now;
    let budget = Math.floor(acc / CHAR_MS);
    acc -= budget * CHAR_MS;

    while (i < typingOps.length) {
      const op = typingOps[i];
      if (op.t === 'open') {
        const el = op.el.cloneNode(false);
        stack[stack.length - 1].appendChild(el);
        stack.push(el);
        i++;
      } else if (op.t === 'close') {
        stack.pop();
        i++;
      } else if (op.t === 'node') {
        stack[stack.length - 1].appendChild(op.el.cloneNode(false));
        i++;
      } else {
        if (!node) {
          node = document.createTextNode('');
          stack[stack.length - 1].appendChild(node);
          pos = 0;
        }
        if (budget <= 0) break;
        const take = Math.min(budget, op.chars.length - pos);
        pos += take;
        budget -= take;
        node.data = op.chars.slice(0, pos).join('');
        if (pos >= op.chars.length) { node = null; i++; }
      }
    }

    if (i < typingOps.length) {
      requestAnimationFrame(frame);
    } else {
      typingDone = true;
      if (scrollHint) scrollHint.classList.add('show');
      checkEnd();
    }
  }
  requestAnimationFrame((t) => { last = t; frame(t); });
}

/* =========================================================
   4. FINAL MESSAGE + NEXT ARROW
========================================================= */
const finalMessage = document.createElement('div');
finalMessage.className = 'final-message';
finalMessage.innerHTML = '<br><br>I Love You Forever<br><br>Sandhiya';
const letterContent = letter.querySelector('.letter-content');
letterContent.insertBefore(finalMessage, nextArrow);

let finalShown = false;
function checkEnd() {
  if (!typingDone || finalShown) return;
  const distance = letter.scrollHeight - letter.clientHeight;
  if (letter.scrollTop >= distance - 50) {
    finalShown = true;
    finalMessage.classList.add('show');
    setTimeout(() => nextArrow.classList.add('show'), 800);
  }
}
letter.addEventListener('scroll', checkEnd, { passive: true });

/* =========================================================
   5. BACKGROUND MAGIC (particles, petals, floating hearts)
========================================================= */
const particleLayer = $('particles');
const petalLayer = $('petals');
const body = document.body;

/* Pauses while the tab is hidden, during the heart show, and (on phones)
   while the letter covers the screen — saves battery and keeps it smooth. */
function ambientOn() {
  if (document.hidden) return false;
  if (body.classList.contains('particle-mode')) return false;
  if (isSmallScreen() && body.classList.contains('read-mode')) return false;
  return true;
}

function createParticle() {
  if (!ambientOn() || particleLayer.childElementCount > 70) return;
  const p = document.createElement('div');
  p.className = 'particle';
  p.style.left = Math.random() * window.innerWidth + 'px';
  p.style.top = window.innerHeight + 'px';
  p.style.animationDuration = (6 + Math.random() * 8) + 's';
  p.style.opacity = 0.2 + Math.random() * 0.8;
  particleLayer.appendChild(p);
  setTimeout(() => p.remove(), 15000);
}

function createPetal() {
  if (!ambientOn() || petalLayer.childElementCount > 30) return;
  const petal = document.createElement('img');
  petal.src = 'assets/petal.png';
  petal.alt = '';
  petal.draggable = false;
  petal.className = 'petal';
  petal.style.left = Math.random() * window.innerWidth + 'px';
  petal.style.top = '-100px';
  petal.style.width = (40 + Math.random() * 5) + 'px';
  petal.style.animationDuration = (8 + Math.random() * 6) + 's';
  petalLayer.appendChild(petal);
  petal.addEventListener('animationend', () => petal.remove(), { once: true });
  setTimeout(() => petal.remove(), 16000);
}

/* Soft hearts drifting up. `force` is used by the final "Yes" celebration. */
function createHeart(force) {
  if (!force && !ambientOn()) return;
  const size = 25 + Math.random() * 30;
  const h = makeHeart(size, 'rgb(255,180,220)');
  h.style.position = 'fixed';
  h.style.left = Math.random() * window.innerWidth + 'px';
  h.style.bottom = '-40px';
  h.style.zIndex = force ? '10002' : '0';
  body.appendChild(h);
  const rise = window.innerHeight + 300;
  try {
    const a = h.animate(
      [
        { transform: 'translateY(0) rotate(0deg)', opacity: force ? 0.9 : 0.5 },
        { transform: `translateY(-${rise}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
      ],
      { duration: 10000, easing: 'linear' }
    );
    a.onfinish = () => h.remove();
  } catch (_) {
    setTimeout(() => h.remove(), 10000);
  }
}

function startAmbient() {
  const small = isSmallScreen();
  setInterval(createParticle, small ? 420 : 180);
  setInterval(createPetal, small ? 1100 : 600);
  setInterval(() => createHeart(false), small ? 4000 : 2500);

  // gentle background drift with the mouse (laptops only)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let pending = false;
    let mx = 0, my = 0;
    document.addEventListener('mousemove', (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 15;
      my = (e.clientY / window.innerHeight - 0.5) * 15;
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        body.style.backgroundPosition = `${50 + mx}% ${50 + my}%`;
      });
    }, { passive: true });
  }
}

/* Music follows the app: pauses when you switch tabs, resumes on return */
const resumeList = [];
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    resumeList.length = 0;
    [bgMusic, heartMusic, countdownMusic].forEach((a) => {
      if (a && !a.paused) { resumeList.push(a); a.pause(); }
    });
  } else {
    resumeList.forEach((a) => { const p = a.play(); if (p && p.catch) p.catch(() => {}); });
    resumeList.length = 0;
  }
});

/* =========================================================
   6. HEART SHOW — rose-pink hearts spell the countdown, then a heart
   One colour only: shades of rose with a soft light that ripples
   through them (no blinking, no rainbow).
========================================================= */
const canvas = $('animationCanvas');
const ctx = canvas.getContext('2d');
let W = window.innerWidth, H = window.innerHeight, DPR = 1;

const bgMatch = (getComputedStyle(canvas).backgroundColor || '').match(/[\d.]+/g);
const BG_RGB = bgMatch && bgMatch.length >= 3 ? bgMatch.slice(0, 3).join(',') : '26,26,28';

const HUE = 338;      // rose pink — the one colour of the show
const TONES = 8;      // how many shades of that rose are used
let sprites = [];
let spriteBox = 12;

function heartShape(g, r) {
  g.beginPath();
  g.moveTo(0, r * 0.9);
  g.bezierCurveTo(-r * 1.5, r * 0.1, -r * 1.0, -r * 0.95, 0, -r * 0.4);
  g.bezierCurveTo(r * 1.0, -r * 0.95, r * 1.5, r * 0.1, 0, r * 0.9);
  g.closePath();
}

/* Each shade is drawn once (with its soft glow) and stamped for every heart */
function buildSprites() {
  const sz = clamp(Math.min(W, H) / 80, 6.5, 10);
  spriteBox = Math.ceil(sz * 2.6);
  sprites = [];
  for (let k = 0; k < TONES; k++) {
    const t = k / (TONES - 1);
    const c = document.createElement('canvas');
    c.width = c.height = Math.ceil(spriteBox * DPR);
    const g = c.getContext('2d');
    g.scale(DPR, DPR);
    g.translate(spriteBox / 2, spriteBox / 2);
    const r = sz * 0.5;
    g.shadowColor = `hsla(${HUE},100%,${62 + t * 14}%,${0.45 + 0.4 * t})`;
    g.shadowBlur = sz * (0.8 + 0.6 * t) * DPR;
    heartShape(g, r);
    const gr = g.createLinearGradient(0, -r, 0, r);
    gr.addColorStop(0, `hsl(${HUE},${96 - t * 20}%,${56 + t * 30}%)`);
    gr.addColorStop(1, `hsl(${HUE},${96 - t * 10}%,${44 + t * 26}%)`);
    g.fillStyle = gr;
    g.fill();
    sprites.push(c);
  }
}

function sizeCanvas() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = canvas.clientWidth || window.innerWidth;
  H = canvas.clientHeight || window.innerHeight;
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  buildSprites();
}
sizeCanvas();

const particles = [];
let isHeartPhase = false;
let heartTime = 0;
let hasBurst = false;
let currentStage = -1;

class HeartParticle {
  constructor(x, y) {
    this.x = W / 2 + (Math.random() - 0.5) * 200;
    this.y = H / 2 + (Math.random() - 0.5) * 200;
    this.baseTargetX = x;
    this.baseTargetY = y;
    this.vx = 0;
    this.vy = 0;
    this.phase = Math.random() * Math.PI * 2;
    this.tone = Math.random();
    this.scale = 0.85 + Math.random() * 0.4;
    this.isExploding = false;
    this.isActive = true;
  }

  step() {
    if (!this.isActive) return;
    if (this.isExploding) {
      this.vx *= 0.94;
      this.vy *= 0.94;
    } else {
      let tx = this.baseTargetX;
      let ty = this.baseTargetY;
      if (isHeartPhase) {
        const cx = W / 2;
        const cy = H / 2;
        const s = 1 + Math.sin(heartTime) * 0.06;   // heartbeat
        tx = cx + (this.baseTargetX - cx) * s;
        ty = cy + (this.baseTargetY - cy) * s;
      }
      this.vx += (tx - this.x) * 0.08;
      this.vy += (ty - this.y) * 0.08;
      this.vx *= 0.82;
      this.vy *= 0.82;
    }
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(t) {
    if (!this.isActive) return;
    // a slow wave of light travels through the hearts; each one also
    // glows gently on its own — smooth, never a flash
    const d = isHeartPhase
      ? Math.hypot(this.x - W / 2, this.y - H / 2) * 0.013
      : this.x * 0.0045 + this.y * 0.0032;
    const wave = 0.5 + 0.5 * Math.sin(t * 2.0 - d);
    const glow = 0.5 + 0.5 * Math.sin(t * 2.6 + this.phase);
    const v = 0.5 * wave + 0.25 * glow + 0.25 * this.tone;
    const level = Math.min(TONES - 1, Math.floor(v * TONES));
    const size = spriteBox * this.scale;
    ctx.globalAlpha = 0.6 + 0.4 * v;
    ctx.drawImage(sprites[level], this.x - size / 2, this.y - size / 2, size, size);
  }
}

function getTextPoints(text, fontSize, step) {
  const off = document.createElement('canvas');
  const o = off.getContext('2d');
  off.width = W;
  off.height = H;

  // make sure the word always fits the width of the screen
  o.font = `bold ${fontSize}px Arial`;
  const w = o.measureText(text).width;
  if (w > W * 0.86) fontSize *= (W * 0.86) / w;

  o.fillStyle = 'black';
  o.fillRect(0, 0, W, H);
  o.fillStyle = 'white';
  o.font = `bold ${fontSize}px Arial`;
  o.textAlign = 'center';
  o.textBaseline = 'middle';
  o.fillText(text, W / 2, H / 2);

  const data = o.getImageData(0, 0, W, H).data;
  const points = [];
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      if (data[(y * W + x) * 4] > 128) {
        points.push({
          x: x + (Math.random() - 0.5) * step * 0.5,
          y: y + (Math.random() - 0.5) * step * 0.5
        });
      }
    }
  }
  return points;
}

function getHeartPoints() {
  const points = [];
  const scale = Math.min(W, H) / 50;
  const cx = W / 2;
  const cy = H / 2 - 20;
  const spread = clamp(Math.min(W, H) / 20, 14, 20);
  for (let t = 0; t < Math.PI * 2; t += 0.02) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    for (let i = 0; i < 5; i++) {
      points.push({
        x: cx + x * scale + (Math.random() - 0.5) * spread,
        y: cy + y * scale + (Math.random() - 0.5) * spread
      });
    }
  }
  return points;
}

function updateTargets(newTargets) {
  for (let i = 0; i < newTargets.length; i++) {
    if (i < particles.length) {
      const p = particles[i];
      p.baseTargetX = newTargets[i].x;
      p.baseTargetY = newTargets[i].y;
      p.isActive = true;
      p.isExploding = false;
    } else {
      particles.push(new HeartParticle(newTargets[i].x, newTargets[i].y));
    }
  }
  for (let i = newTargets.length; i < particles.length; i++) {
    particles[i].isActive = false;
  }
}

function explode() {
  particles.forEach((p) => {
    if (p.isActive) {
      const angle = Math.random() * Math.PI * 2;
      const force = (15 + Math.random() * 35) * clamp(Math.min(W, H) / 700, 0.6, 1);
      p.vx = Math.cos(angle) * force;
      p.vy = Math.sin(angle) * force;
      p.isExploding = true;
    }
  });
}

/* ---------- falling hearts after the burst ---------- */
let fallingTimer = null;
let fallingCount = 0;
function startFallingHearts() {
  if (fallingTimer) return;
  const small = isSmallScreen();
  fallingTimer = setInterval(() => {
    if (document.hidden || fallingCount > (small ? 40 : 70)) return;
    const h = makeHeart(15 + Math.random() * 20, '#ffb3d9');
    h.className = 'falling-heart';
    h.style.left = Math.random() * window.innerWidth + 'px';
    h.style.animationDuration = (3 + Math.random() * 3) + 's';
    body.appendChild(h);
    fallingCount++;
    const done = () => { h.remove(); fallingCount--; };
    h.addEventListener('animationend', done, { once: true });
  }, small ? 160 : 100);
}

/* ---------- the sequence: 3 · 2 · 1 · You · Are · My · Love · ♥ ---------- */
const sequence = [
  { type: 'text', val: '3' },
  { type: 'text', val: '2' },
  { type: 'text', val: '1' },
  { type: 'text', val: 'You' },
  { type: 'text', val: 'Are' },
  { type: 'text', val: 'My' },
  { type: 'text', val: 'Love' },
  { type: 'heart' }
];
let currentIndex = 0;

function applyStage(i) {
  const s = sequence[i];
  if (!s) return;
  const m = Math.min(W, H);
  if (s.type === 'text') {
    updateTargets(getTextPoints(s.val, m * 0.45, Math.max(5, Math.round(m / 96))));
  } else {
    updateTargets(getHeartPoints());
  }
}

function nextSequence() {
  if (currentIndex >= sequence.length) return;
  const current = sequence[currentIndex];
  currentStage = currentIndex;
  applyStage(currentIndex);

  if (current.type === 'text') {
    setTimeout(() => {
      explode();
      setTimeout(() => { currentIndex++; nextSequence(); }, 700);
    }, 1400);
  } else {
    isHeartPhase = true;
    setTimeout(() => body.classList.add('heart-ready'), 1000);
  }
}

function drawCaption(t) {
  const fs = clamp(W * 0.062, 14, 26);
  const label = 'I LOVE YOU SANDHIYA';
  ctx.font = `bold ${fs}px "Courier New", monospace`;
  const tw = ctx.measureText(label).width;
  const gap = fs * 0.45;
  const hw = fs * 0.85;
  const startX = W / 2 - (tw + gap + hw) / 2;

  ctx.globalAlpha = 0.88 + 0.12 * Math.sin(t * 3);
  ctx.fillStyle = '#ffb3d9';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(label, startX, H / 2);
  ctx.save();
  ctx.translate(startX + tw + gap + hw / 2, H / 2 - fs * 0.34);
  heartShape(ctx, fs * 0.42);
  ctx.fill();
  ctx.restore();

  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255, 179, 217, 0.45)';
  ctx.font = `${clamp(fs * 0.5, 10, 13)}px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('(Tap Here)', W / 2, H / 2 + fs + 4);
}

let animating = false;
let lastFrame = 0;
let physicsAcc = 0;
const STEP_MS = 1000 / 60;

function animateParticles(now) {
  const dt = lastFrame ? Math.min(now - lastFrame, 50) : STEP_MS;
  lastFrame = now;

  // fade the previous frame a little (soft trails)
  ctx.globalAlpha = 1;
  ctx.fillStyle = `rgba(${BG_RGB},${1 - Math.pow(0.7, dt / STEP_MS)})`;
  ctx.fillRect(0, 0, W, H);

  // physics runs at a steady 60 steps a second on any screen
  physicsAcc += dt;
  while (physicsAcc >= STEP_MS) {
    physicsAcc -= STEP_MS;
    if (isHeartPhase) heartTime += 0.08;
    for (let i = 0; i < particles.length; i++) particles[i].step();
  }

  const t = now / 1000;
  for (let i = 0; i < particles.length; i++) particles[i].draw(t);
  ctx.globalAlpha = 1;

  if (isHeartPhase && !hasBurst) drawCaption(t);
  requestAnimationFrame(animateParticles);
}

function startParticleAnimation() {
  if (animating) return;
  animating = true;
  setTimeout(nextSequence, 500);
  requestAnimationFrame(animateParticles);
}

let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    sizeCanvas();
    if (animating && currentStage >= 0 && !hasBurst) applyStage(currentStage);
  }, 150);
});

/* ---------- go to the heart show ---------- */
let showStarted = false;
function goToHeartShow() {
  if (showStarted) return;
  showStarted = true;
  body.classList.add('particle-mode');
  setTimeout(startParticleAnimation, 1200);
  if (bgMusic) bgMusic.pause();
  if (countdownMusic) playSound(countdownMusic, 0.25);
}
nextArrow.addEventListener('click', goToHeartShow);
nextArrow.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToHeartShow(); }
});

/* ---------- tap the heart: burst, music, then the question ---------- */
canvas.addEventListener('click', () => {
  if (!isHeartPhase || hasBurst) return;
  hasBurst = true;
  body.classList.remove('heart-ready');
  explode();
  startFallingHearts();

  if (bgMusic) bgMusic.pause();
  if (countdownMusic) { countdownMusic.pause(); countdownMusic.currentTime = 0; }
  playSound(heartMusic, 0.5);

  setTimeout(() => $('loveQuestion').classList.add('show'), 4000);
});

/* =========================================================
   7. "DO YOU LOVE ME?" — the runaway No button
========================================================= */
const btnNo = $('btnNo');
const btnYes = $('btnYes');
let noX = 0, noY = 0, noOpacity = 1;

function moveNoButton(e) {
  if (e && e.cancelable) e.preventDefault();

  const r = btnNo.getBoundingClientRect();
  const baseL = r.left - noX;           // where it sits before any moving
  const baseT = r.top - noY;
  const yes = btnYes.getBoundingClientRect();
  const m = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const reach = isSmallScreen() ? 130 : 160;

  let pick = null;
  for (let i = 0; i < 14 && !pick; i++) {
    const nx = (Math.random() * 2 - 1) * reach;
    const ny = (Math.random() * 2 - 1) * reach;
    const L = baseL + nx;
    const T = baseT + ny;
    const inside = L >= m && T >= m && L + r.width <= vw - m && T + r.height <= vh - m;
    const hitsYes = !(L + r.width < yes.left - 10 || L > yes.right + 10 ||
                      T + r.height < yes.top - 10 || T > yes.bottom + 10);
    const moved = Math.hypot(nx - noX, ny - noY) > 60;
    if (inside && !hitsYes && moved) pick = { nx, ny };
  }
  if (!pick) {
    // no good spot found: hop to the other side, kept on screen
    let nx = noX > 0 ? -reach * 0.8 : reach * 0.8;
    let ny = (Math.random() * 2 - 1) * reach * 0.5;
    nx = clamp(nx, m - baseL, vw - m - r.width - baseL);
    ny = clamp(ny, m - baseT, vh - m - r.height - baseT);
    pick = { nx, ny };
  }

  noX = pick.nx;
  noY = pick.ny;
  noOpacity = Math.max(0.35, noOpacity - 0.08);
  const rotation = Math.random() * 40 - 20;
  btnNo.style.transform = `translate(${noX}px, ${noY}px) rotate(${rotation}deg) scale(0.85)`;
  btnNo.style.opacity = String(noOpacity);
}

btnNo.addEventListener('mouseover', moveNoButton);
btnNo.addEventListener('focus', moveNoButton);
btnNo.addEventListener('touchstart', moveNoButton, { passive: false });
btnNo.addEventListener('click', moveNoButton);

btnYes.addEventListener('click', () => {
  $('loveQuestion').innerHTML = '<h2>I knew it! ❤️<br>You are my everything.</h2>';
  for (let i = 0; i < 20; i++) {
    setTimeout(() => createHeart(true), i * 150);
  }
});

})();
