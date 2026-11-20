// Neon Bay — editor. Wires the controls to the poster engine, loads photos,
// handles drag-to-pan per panel, and exports PNGs in the three post sizes.
// Everything runs offline: photos are read on this machine, never uploaded.
import { SIZES, LAYOUTS, GRADES, CAPTION_COLORS, drawPoster, layoutRects, panelCount } from './poster.js';
import { SAMPLES, defaultState, defaultPanels } from './presets.js';

const $ = (id) => document.getElementById(id);
const state = defaultState();
const photos = new Map(); // id -> { img, w, h, label }
let selectedPanel = 0;
let lastRects = [];
let userPhotoCount = 0;

window.__neonBay = { state, photos, exportSize };

async function loadFont() {
  try {
    const face = new FontFace('Anton', "url('fonts/Anton-Regular.ttf')");
    await face.load();
    document.fonts.add(face);
  } catch (_) { /* canvas falls back to a narrow sans */ }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ img, w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}

async function loadSamples() {
  for (const s of SAMPLES) {
    try {
      const p = await loadImage(s.src);
      photos.set(s.id, { ...p, label: s.label });
    } catch (_) { /* a missing sample just leaves its panels blank */ }
  }
}

function panelPhoto(panel) {
  const p = photos.get(panel.photoId);
  return p ? { ...p, panX: panel.panX, panY: panel.panY, zoom: panel.zoom } : null;
}

function renderState() {
  return {
    ...state,
    panels: state.panels.map((panel) => ({ ...panel, photo: panelPhoto(panel) })),
  };
}

function drawPreview() {
  const canvas = $('preview');
  const size = SIZES[state.size];
  const pw = 960;
  const ph = Math.round((960 * size.h) / size.w);
  if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
  const ctx = canvas.getContext('2d');
  lastRects = drawPoster(ctx, renderState(), pw, ph);
  $('sizeLabel').textContent = `${size.label} — preview ${pw}×${ph}`;
}

function drawCoverView() {
  const canvas = $('coverCanvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  canvas.width = Math.round(vw * dpr);
  canvas.height = Math.round(vh * dpr);
  canvas.style.width = `${vw}px`;
  canvas.style.height = `${vh}px`;
  const ctx = canvas.getContext('2d');
  drawPoster(ctx, renderState(), canvas.width, canvas.height);
}

function refresh() {
  if (document.body.dataset.mode === 'cover') drawCoverView();
  else drawPreview();
  syncControls();
}

function syncControls() {
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
  document.querySelectorAll('[data-effect]').forEach((b) => b.classList.toggle('active', !!state.effects[b.dataset.effect]));
  document.querySelectorAll('[data-color]').forEach((b) => b.classList.toggle('active', b.dataset.color === state.caption.color));
  document.querySelectorAll('[data-place]').forEach((b) => b.classList.toggle('active', b.dataset.place === state.caption.place));
  $('captionText').value = state.caption.text;
  $('captionSize').value = Math.round(state.caption.size * 100);
  $('captionSizeVal').textContent = `${Math.round(state.caption.size * 100)}%`;
  $('captionTilt').value = state.caption.tilt;
  $('captionTiltVal').textContent = `${state.caption.tilt}°`;
  $('barToggle').classList.toggle('active', !!state.caption.bar);
  $('zoomSlider').value = Math.round(((state.panels[selectedPanel]?.zoom || 1) - 1) * 100);
  $('zoomVal').textContent = `${Math.round((state.panels[selectedPanel]?.zoom || 1) * 100)}%`;
  $('panelLabel').textContent = `Panel ${selectedPanel + 1} of ${state.panels.length}`;
}

function setLayout(layout) {
  const sampleIds = [...photos.keys()];
  const keep = state.panels.map((p) => p.photoId);
  state.layout = layout;
  state.panels = defaultPanels(layout, keep.length ? keep : sampleIds);
  selectedPanel = 0;
  refresh();
}

function setGrade(grade) { state.grade = grade; refresh(); }
function setSize(sizeId) { state.size = sizeId; refresh(); }

function fillAll(photoId) {
  state.panels.forEach((p) => { p.photoId = photoId; p.panX = 0; p.panY = 0; });
  refresh();
}

function buildPhotoButtons() {
  const wrap = $('photoList');
  wrap.innerHTML = '';
  for (const [id, p] of photos) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb';
    b.textContent = p.label;
    b.title = `Use ${p.label} for the selected panel`;
    b.addEventListener('click', () => {
      state.panels[selectedPanel].photoId = id;
      state.panels[selectedPanel].panX = 0;
      state.panels[selectedPanel].panY = 0;
      refresh();
    });
    wrap.appendChild(b);
  }
  const fill = document.createElement('button');
  fill.type = 'button';
  fill.className = 'thumb fill';
  fill.textContent = 'Fill all panels';
  fill.title = 'Fill every panel with the selected panel’s photo';
  fill.addEventListener('click', () => fillAll(state.panels[selectedPanel].photoId));
  wrap.appendChild(fill);
}

async function addUserPhotos(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const url = URL.createObjectURL(file);
    try {
      const p = await loadImage(url);
      const id = `user-${++userPhotoCount}`;
      photos.set(id, { ...p, label: file.name.replace(/\.[^.]+$/, '').slice(0, 18) || 'Photo' });
      state.panels[selectedPanel].photoId = id;
    } catch (_) { URL.revokeObjectURL(url); }
  }
  buildPhotoButtons();
  refresh();
}

function exportSize(sizeId) {
  return new Promise((resolve) => {
    const size = SIZES[sizeId];
    const canvas = document.createElement('canvas');
    canvas.width = size.w;
    canvas.height = size.h;
    drawPoster(canvas.getContext('2d'), renderState(), size.w, size.h);
    canvas.toBlob((blob) => {
      if (!blob) { resolve(null); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `neon-bay-${size.w}x${size.h}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(blob);
    }, 'image/png');
  });
}

async function exportAll() {
  for (const id of Object.keys(SIZES)) await exportSize(id);
}

function bindPointer() {
  const canvas = $('preview');
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  function point(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ((ev.clientX - r.left) / r.width) * canvas.width, y: ((ev.clientY - r.top) / r.height) * canvas.height };
  }
  canvas.addEventListener('pointerdown', (ev) => {
    const p = point(ev);
    const i = lastRects.findIndex((r) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h);
    if (i >= 0) { selectedPanel = i; dragging = true; lastX = p.x; lastY = p.y; canvas.setPointerCapture(ev.pointerId); syncControls(); }
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!dragging) return;
    const p = point(ev);
    const panel = state.panels[selectedPanel];
    const rect = lastRects[selectedPanel];
    if (!panel || !rect) return;
    panel.panX = Math.max(-1, Math.min(1, panel.panX + ((p.x - lastX) / rect.w) * 2));
    panel.panY = Math.max(-1, Math.min(1, panel.panY + ((p.y - lastY) / rect.h) * 2));
    lastX = p.x; lastY = p.y;
    drawPreview();
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
}

function bindControls() {
  document.querySelectorAll('[data-layout]').forEach((b) => b.addEventListener('click', () => setLayout(b.dataset.layout)));
  document.querySelectorAll('[data-grade]').forEach((b) => b.addEventListener('click', () => setGrade(b.dataset.grade)));
  document.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => setSize(b.dataset.size)));
  document.querySelectorAll('[data-effect]').forEach((b) => b.addEventListener('click', () => {
    state.effects[b.dataset.effect] = !state.effects[b.dataset.effect];
    refresh();
  }));
  document.querySelectorAll('[data-color]').forEach((b) => b.addEventListener('click', () => { state.caption.color = b.dataset.color; refresh(); }));
  document.querySelectorAll('[data-place]').forEach((b) => b.addEventListener('click', () => { state.caption.place = b.dataset.place; refresh(); }));
  $('captionText').addEventListener('input', (ev) => { state.caption.text = ev.target.value; refresh(); });
  $('captionSize').addEventListener('input', (ev) => { state.caption.size = Number(ev.target.value) / 100; refresh(); });
  $('captionTilt').addEventListener('input', (ev) => { state.caption.tilt = Number(ev.target.value); refresh(); });
  $('barToggle').addEventListener('click', () => { state.caption.bar = !state.caption.bar; refresh(); });
  $('zoomSlider').addEventListener('input', (ev) => {
    const panel = state.panels[selectedPanel];
    if (panel) { panel.zoom = 1 + Number(ev.target.value) / 100; drawPreview(); syncControls(); }
  });
  $('fileInput').addEventListener('change', (ev) => addUserPhotos(ev.target.files));
  $('exportAll').addEventListener('click', exportAll);
  document.querySelectorAll('[data-export]').forEach((b) => b.addEventListener('click', () => exportSize(b.dataset.export)));
  window.addEventListener('resize', () => { if (document.body.dataset.mode === 'cover') drawCoverView(); });
}

function applyQuery() {
  const q = new URLSearchParams(window.location.search);
  const shot = q.get('shot');
  if (q.get('layout') && LAYOUTS[q.get('layout')]) setLayout(q.get('layout'));
  if (q.get('grade') && GRADES[q.get('grade')]) state.grade = q.get('grade');
  if (q.get('size') && SIZES[q.get('size')]) state.size = q.get('size');
  if (q.get('caption') !== null) state.caption.text = q.get('caption');
  if (q.get('photo')) {
    const id = q.get('photo');
    if (photos.has(id)) state.panels.forEach((p) => { p.photoId = id; });
  }
  if (shot === 'cover') {
    document.body.dataset.mode = 'cover';
    document.body.classList.add('cover-mode');
  }
}

async function init() {
  await loadFont();
  await loadSamples();
  buildPhotoButtons();
  bindControls();
  bindPointer();
  applyQuery();
  refresh();
  document.body.dataset.ready = 'true';
}

init();
