const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
const brushSizeInput = document.getElementById('brushSize');
const paintBtn = document.getElementById('paintMode');
const grabBtn = document.getElementById('grabMode');
const eraseBtn = document.getElementById('eraseMode');
const resetBtn = document.getElementById('reset');

// State
let mode = 'paint'; // 'paint' | 'grab' | 'erase'
let brushSize = parseInt(brushSizeInput.value, 10);
let isDrawing = false;
let isGrabbing = false;
let lastX = 0, lastY = 0;
let offsetX = 0, offsetY = 0;
let viewX = 0, viewY = 0;
let paths = [];
let scale = 1;
const MIN_SCALE = 0.3;
const MAX_SCALE = 3;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  redraw();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function setMode(newMode) {
  mode = newMode;
  [paintBtn, grabBtn, eraseBtn].forEach(btn => btn.classList.remove('active'));
  if (mode === 'paint') paintBtn.classList.add('active');
  if (mode === 'grab') grabBtn.classList.add('active');
  if (mode === 'erase') eraseBtn.classList.add('active');
  canvas.style.cursor = mode === 'grab' ? 'grab' : (mode === 'erase' ? 'cell' : 'crosshair');
}

paintBtn.onclick = () => setMode('paint');
grabBtn.onclick = () => setMode('grab');
eraseBtn.onclick = () => setMode('erase');

brushSizeInput.oninput = e => {
  brushSize = parseInt(e.target.value, 10);
};

resetBtn.onclick = () => {
  paths = [];
  brushSizeInput.value = 5;
  brushSize = 5;
  redraw();
};

canvas.addEventListener('wheel', function(e) {
  if (e.ctrlKey || e.metaKey || !e.altKey) {
    e.preventDefault();
    const mouseX = e.clientX - viewX;
    const mouseY = e.clientY - viewY;
    const prevScale = scale;
    if (e.deltaY < 0) {
      scale *= 1.1;
    } else {
      scale /= 1.1;
    }
    scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
    // Adjust viewX/viewY so zoom is centered on mouse
    viewX -= (mouseX) * (scale/prevScale - 1);
    viewY -= (mouseY) * (scale/prevScale - 1);
    redraw();
  }
}, { passive: false });

function redraw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, viewX, viewY);
  for (const p of paths) {
    ctx.save();
    ctx.strokeStyle = p.type === 'erase' ? '#232326' : '#f3f3f7';
    ctx.lineWidth = p.size;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < p.points.length; i++) {
      const pt = p.points[i];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

canvas.onmousedown = e => {
  const x = (e.clientX - viewX) / scale;
  const y = (e.clientY - viewY) / scale;
  if (mode === 'paint' || mode === 'erase') {
    isDrawing = true;
    lastX = x;
    lastY = y;
    paths.push({
      type: mode,
      size: brushSize,
      points: [{x, y}]
    });
  } else if (mode === 'grab') {
    isGrabbing = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.style.cursor = 'grabbing';
  }
};

canvas.onmousemove = e => {
  if (isDrawing) {
    const x = (e.clientX - viewX) / scale;
    const y = (e.clientY - viewY) / scale;
    const path = paths[paths.length - 1];
    path.points.push({x, y});
    redraw();
  } else if (isGrabbing) {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    viewX += dx;
    viewY += dy;
    lastX = e.clientX;
    lastY = e.clientY;
    redraw();
  }
};

canvas.onmouseup = canvas.onmouseleave = e => {
  isDrawing = false;
  if (isGrabbing) {
    isGrabbing = false;
    canvas.style.cursor = 'grab';
  }
};

// Touch support
canvas.ontouchstart = e => {
  const t = e.touches[0];
  const x = (t.clientX - viewX) / scale;
  const y = (t.clientY - viewY) / scale;
  if (mode === 'paint' || mode === 'erase') {
    isDrawing = true;
    lastX = x;
    lastY = y;
    paths.push({
      type: mode,
      size: brushSize,
      points: [{x, y}]
    });
  } else if (mode === 'grab') {
    isGrabbing = true;
    lastX = t.clientX;
    lastY = t.clientY;
    canvas.style.cursor = 'grabbing';
  }
};
canvas.ontouchmove = e => {
  if (isDrawing) {
    const t = e.touches[0];
    const x = (t.clientX - viewX) / scale;
    const y = (t.clientY - viewY) / scale;
    const path = paths[paths.length - 1];
    path.points.push({x, y});
    redraw();
  } else if (isGrabbing) {
    const t = e.touches[0];
    const dx = t.clientX - lastX;
    const dy = t.clientY - lastY;
    viewX += dx;
    viewY += dy;
    lastX = t.clientX;
    lastY = t.clientY;
    redraw();
  }
  e.preventDefault();
};
canvas.ontouchend = canvas.ontouchcancel = e => {
  isDrawing = false;
  if (isGrabbing) {
    isGrabbing = false;
    canvas.style.cursor = 'grab';
  }
};

setMode('paint'); 