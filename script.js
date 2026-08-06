const mainCD = document.getElementById('mainCD');
const mainCDImg = mainCD.querySelector('img');
let isSpinning = false;
let originalScrollPos = 0;

// === Open directly to the About Me screen on load ===
window.addEventListener('load', () => {
  window.scrollTo(0, 0);

  // Set state to active & spinning on launch
  isSpinning = true;
  mainCD.classList.add('spinning');
  document.body.classList.add('lock-scroll', 'showing-screen');
  
  // Display the matching content screen (cd4.png / About Me)
  updateScreen();
});

// === Show correct content screen ===
function updateScreen() {
  const currentCDSrc = mainCDImg.src;
  const allScreens = document.querySelectorAll('.cd-screen');
  allScreens.forEach(screen => {
    const screenCD = screen.getAttribute('data-cd');
    if (currentCDSrc.includes(screenCD)) {
      screen.classList.add('active');
    } else {
      screen.classList.remove('active');
    }
  });
}

// === Main CD click: spin + reveal ===
mainCD.addEventListener('click', () => {
  isSpinning = !isSpinning;
  mainCD.classList.toggle('spinning');

  if (isSpinning) {
    originalScrollPos = window.scrollY;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.classList.add('lock-scroll', 'showing-screen');
    updateScreen();
  } else {
    document.body.classList.remove('lock-scroll', 'showing-screen');
    window.scrollTo({ top: originalScrollPos || document.body.scrollHeight, behavior: 'smooth' });
    document.querySelectorAll('.cd-screen').forEach(s => s.classList.remove('active'));
  }
});

// === Carousel setup ===
const track = document.getElementById('carouselTrack');
const cds = Array.from(track.children);
const cdWidth = cds[0].offsetWidth;
const totalCDs = cds.length;

// --- Clone for infinite loop (still required, but hidden)
const cloneBefore = cds.map(cd => cd.cloneNode(true));
const cloneAfter = cds.map(cd => cd.cloneNode(true));
cloneBefore.forEach(c => track.insertBefore(c, track.firstChild));
cloneAfter.forEach(c => track.appendChild(c));

// --- Start centered on real CDs (no visible duplicates)
const loopWidth = cdWidth * totalCDs;
let targetTranslate = 0;
let currentTranslate = targetTranslate;
let velocity = 0;
let startX = 0;
let prevX = 0;
let dragging = false;
let animationFrame;

// --- Normalize scroll to loop seamlessly off-screen (no jump)
function normalizePosition() {
  const minTranslate = -loopWidth * 1.5; // extended buffer before reset
  const maxTranslate = -loopWidth * 0.5;

  if (currentTranslate > maxTranslate) {
    currentTranslate -= loopWidth;
    targetTranslate -= loopWidth;
  } else if (currentTranslate < minTranslate) {
    currentTranslate += loopWidth;
    targetTranslate += loopWidth;
  }
}

// === Smoother animation loop ===
function animateScroll() {
  const diff = targetTranslate - currentTranslate;
  currentTranslate += diff * 0.15; // easing factor
  targetTranslate += velocity;
  velocity *= 0.8; // slower friction
  normalizePosition();
  track.style.transform = `translateX(${currentTranslate}px)`;

  if (dragging || Math.abs(velocity) > 0.1 || Math.abs(diff) > 0.1) {
    animationFrame = requestAnimationFrame(animateScroll);
  } else {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
}

function startDrag(x) {
  dragging = true;
  startX = x;
  prevX = x;
  velocity = 0;
  if (!animationFrame) animationFrame = requestAnimationFrame(animateScroll);
}

function moveDrag(x) {
  if (!dragging) return;
  const diff = x - prevX;
  targetTranslate += diff;
  velocity = diff;
  prevX = x;
}

function endDrag() {
  dragging = false;
}

// === Mouse & touch support ===
track.addEventListener('mousedown', e => startDrag(e.clientX));
window.addEventListener('mousemove', e => moveDrag(e.clientX));
window.addEventListener('mouseup', endDrag);

track.addEventListener('touchstart', e => startDrag(e.touches[0].clientX));
window.addEventListener('touchmove', e => moveDrag(e.touches[0].clientX));
window.addEventListener('touchend', endDrag);

// === Wheel scroll ===
const container = document.querySelector('.carousel-container');
container.addEventListener('wheel', e => {
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
    e.preventDefault();
    velocity -= e.deltaX * 0.03; // smoother wheel
    if (!animationFrame) animationFrame = requestAnimationFrame(animateScroll);
  }
}, { passive: false });

// === CD swapping ===
function addSwapListeners() {
  const allCDs = document.querySelectorAll('.carousel-cd img');
  allCDs.forEach(cdImg => {
    cdImg.parentElement.onclick = () => {
      const tempSrc = mainCDImg.src;
      mainCDImg.classList.add('swap-animate');
      cdImg.classList.add('swap-animate');
      setTimeout(() => {
        mainCDImg.src = cdImg.src;
        cdImg.src = tempSrc;
        mainCDImg.classList.remove('swap-animate');
        cdImg.classList.remove('swap-animate');
        if (isSpinning) updateScreen();
        addSwapListeners(); // rebind for clones too
      }, 200);
    };
  });
}

addSwapListeners();
animationFrame = requestAnimationFrame(animateScroll);