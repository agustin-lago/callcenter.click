'use strict';

const backgroundCanvas = document.getElementById('backgroundCanvas');
const backgroundContext = backgroundCanvas.getContext('2d', { alpha: true });
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileQuery = window.matchMedia('(max-width: 699px)');

let viewportWidth = 0;
let viewportHeight = 0;
let glows = [];
let particles = [];
let animationFrame = null;
let previousTime = 0;

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}

function createGlow() {
  const minimumSize = Math.min(viewportWidth, viewportHeight) * 0.18;
  const maximumSize = Math.max(viewportWidth, viewportHeight) * 0.38;

  return {
    x: randomBetween(0, viewportWidth),
    y: randomBetween(0, viewportHeight),
    radius: randomBetween(minimumSize, maximumSize),
    velocityX: randomBetween(-7, 7),
    velocityY: randomBetween(-5, 5),
    phase: randomBetween(0, Math.PI * 2),
    pulseSpeed: randomBetween(0.18, 0.34),
    opacity: randomBetween(0.07, 0.14)
  };
}

function createParticle() {
  return {
    x: randomBetween(0, viewportWidth),
    y: randomBetween(0, viewportHeight),
    radius: randomBetween(0.7, 1.8),
    velocityY: randomBetween(-8, -3),
    phase: randomBetween(0, Math.PI * 2),
    opacity: randomBetween(0.12, 0.38)
  };
}

function createScene() {
  const glowCount = mobileQuery.matches ? 5 : 8;
  const particleCount = mobileQuery.matches ? 10 : 20;
  glows = Array.from({ length: glowCount }, createGlow);
  particles = Array.from({ length: particleCount }, createParticle);
}

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;
  backgroundCanvas.width = Math.round(viewportWidth * pixelRatio);
  backgroundCanvas.height = Math.round(viewportHeight * pixelRatio);
  backgroundContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  createScene();
  drawScene(0);
}

function updateScene(deltaSeconds) {
  glows.forEach((glow) => {
    glow.x += glow.velocityX * deltaSeconds;
    glow.y += glow.velocityY * deltaSeconds;
    glow.phase += glow.pulseSpeed * deltaSeconds;

    if (glow.x < -glow.radius) glow.x = viewportWidth + glow.radius;
    if (glow.x > viewportWidth + glow.radius) glow.x = -glow.radius;
    if (glow.y < -glow.radius) glow.y = viewportHeight + glow.radius;
    if (glow.y > viewportHeight + glow.radius) glow.y = -glow.radius;
  });

  particles.forEach((particle) => {
    particle.y += particle.velocityY * deltaSeconds;
    particle.phase += deltaSeconds;

    if (particle.y < -4) {
      particle.y = viewportHeight + 4;
      particle.x = randomBetween(0, viewportWidth);
    }
  });
}

function drawScene(timeSeconds) {
  backgroundContext.clearRect(0, 0, viewportWidth, viewportHeight);
  backgroundContext.save();
  backgroundContext.globalCompositeOperation = 'lighter';

  glows.forEach((glow) => {
    const radius = glow.radius * (1 + Math.sin(glow.phase + timeSeconds * 0.15) * 0.08);
    const gradient = backgroundContext.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, radius);
    gradient.addColorStop(0, `rgba(255, 227, 154, ${glow.opacity})`);
    gradient.addColorStop(0.35, `rgba(245, 173, 47, ${glow.opacity * 0.65})`);
    gradient.addColorStop(1, 'rgba(200, 120, 8, 0)');
    backgroundContext.fillStyle = gradient;
    backgroundContext.fillRect(glow.x - radius, glow.y - radius, radius * 2, radius * 2);
  });

  particles.forEach((particle) => {
    const opacity = particle.opacity * (0.55 + Math.sin(particle.phase + timeSeconds) * 0.45);
    backgroundContext.beginPath();
    backgroundContext.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    backgroundContext.fillStyle = `rgba(255, 227, 154, ${opacity})`;
    backgroundContext.fill();
  });

  backgroundContext.restore();
}

function animate(currentTime) {
  if (document.hidden || reducedMotionQuery.matches) {
    animationFrame = null;
    return;
  }

  if (currentTime - previousTime < 1000 / 30) {
    animationFrame = requestAnimationFrame(animate);
    return;
  }

  const deltaSeconds = Math.min((currentTime - previousTime) / 1000, 0.1);
  previousTime = currentTime;
  updateScene(deltaSeconds);
  drawScene(currentTime / 1000);
  animationFrame = requestAnimationFrame(animate);
}

function startAnimation() {
  if (animationFrame || document.hidden || reducedMotionQuery.matches) return;
  previousTime = performance.now();
  animationFrame = requestAnimationFrame(animate);
}

function stopAnimation() {
  if (!animationFrame) return;
  cancelAnimationFrame(animationFrame);
  animationFrame = null;
}

function handleMotionPreference() {
  stopAnimation();
  drawScene(0);
  startAnimation();
}

function handleVisibilityChange() {
  if (document.hidden) {
    stopAnimation();
  } else {
    startAnimation();
  }
}

window.addEventListener('resize', resizeCanvas, { passive: true });
document.addEventListener('visibilitychange', handleVisibilityChange);
reducedMotionQuery.addEventListener('change', handleMotionPreference);
mobileQuery.addEventListener('change', resizeCanvas);

resizeCanvas();
startAnimation();
