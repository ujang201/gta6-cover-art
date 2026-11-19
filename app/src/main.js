// Neon Bay — editor wiring. Loads photos, lets the user pick layouts,
// select and drag panels, tune the caption, grade and effects, and export
// PNGs. The preview canvas redraws on every change. All original code.

import { LAYOUTS, GRADES, SAMPLES, CAPTIONS, EXPORT_SIZES, defaultState } from './presets.js';
import { drawPoster, layoutRects, exportPoster } from './poster.js';

const $ = (id) => document.getElementById(id);
const state = defaultState();
const canvas = $('poster');
const ctx = canvas.getContext('2d');
let images = new Map(); // src -> HTMLImageElement

function loadImage(src) {
  if (images.has(src)) return images.get(src);
  const img = new Image();
  img.src = src;
  images.set(src, img);
  return img;
}

function fitCanvas() {
  const box = canvas.parentElement.getBoundingClientRect();
  const w = Math.min(box.width, 720);
  canvas.style.width = w + 'px';
  canvas.style.height = (w * 0.66) + 'px';
  canvas.width = 960;
  canvas.height = 640;
  redraw();
}

function redraw() {
  drawPoster(ctx, canvas.width, canvas.height, state);
  updatePanelInfo();
}

function updatePanelInfo() {
  const panel = state.panels[state.selected];
  $('panel-label').textContent = `Panel ${state.selected + 1} of ${state.panels.length}`;
  $('zoom').value = panel ? panel.zoom : 1;
  $('zoom-val').textContent = panel ? `${panel.zoom.toFixed(2)}×` : '—';
}

function assignPhoto(img, src, index) {
  const panel = state.panels[index];
  if (!panel) return;
  panel.img = img;
  panel.src = src;
  panel.panX = 0;
  panel.panY = 0;
  panel.zoom = 1;
  redraw();
}

function loadSample(id) {
  const sample = SAMPLES.find((s) => s.id === id);
  if (!sample) return;
  const img = loadImage(sample.src);
  const apply = () => assignPhoto(img, sample.src, state.selected);
  if (img.complete && img.naturalWidth) apply();
  else img.onload = apply;
}

function loadUserFiles(files) {
  [...files].slice(0, state.panels.length).forEach((file, i) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => assignPhoto(img, reader.result, i);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function fillAll() {
  const srcPanel = state.panels[state.selected];
  if (!srcPanel || !srcPanel.img) return;
  state.panels.forEach((p) => {
    p.img = srcPanel.img;
    p.src = srcPanel.src;
    p.panX = 0;
    p.panY = 0;
    p.zoom = 1;
  });
  redraw();
}

function setLayout(id) {
  if (!LAYOUTS[id]) return;
  const old = state.panels;
  state.layout = id;
  state.panels = LAYOUTS[id].panels.map((_, i) => old[i] ?? { img: null, src: '', panX: 0, panY: 0, zoom: 1 });
  state.selected = 0;
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === id));
  redraw();
}

function setGrade(id) {
  if (!GRADES[id]) return;
  state.grade = id;
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === id));
  redraw();
}

function canvasPos(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPos(e);
  const rects = layoutRects(state.layout, canvas.width, canvas.height);
  const hit = rects.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
  if (hit < 0) return;
  state.selected = hit;
  canvas.setPointerCapture(e.pointerId);
  drag = { x: p.x, y: p.y, panX: state.panels[hit].panX, panY: state.panels[hit].panY };
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPos(e);
  const panel = state.panels[state.selected];
  const scale = canvas.width / canvas.getBoundingClientRect().width;
  panel.panX = drag.panX + (p.x - drag.x);
  panel.panY = drag.panY + (p.y - drag.y);
  void scale;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

function download(canvasEl, name) {
  canvasEl.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

async function exportSize(size) {
  await document.fonts.load('16px Anton');
  await document.fonts.ready;
  const out = exportPoster(size.w, size.h, state);
  download(out, `neon-bay-${size.id}-${size.w}x${size.h}.png`);
  return out;
}

function exportAll() {
  EXPORT_SIZES.forEach((s, i) => setTimeout(() => exportSize(s), i * 400));
}

// --- controls ---
$('photos').addEventListener('change', (e) => loadUserFiles(e.target.files));
document.querySelectorAll('[data-sample]').forEach((b) => b.addEventListener('click', () => loadSample(b.dataset.sample)));
document.querySelectorAll('[data-layout]').forEach((b) => b.addEventListener('click', () => setLayout(b.dataset.layout)));
document.querySelectorAll('[data-grade]').forEach((b) => b.addEventListener('click', () => setGrade(b.dataset.grade)));
$('fill-all').addEventListener('click', fillAll);
$('zoom').addEventListener('input', (e) => {
  const panel = state.panels[state.selected];
  if (panel) panel.zoom = parseFloat(e.target.value);
  redraw();
});
$('caption').addEventListener('input', (e) => { state.caption.text = e.target.value; redraw(); });
$('cap-size').addEventListener('input', (e) => {
  state.caption.size = parseFloat(e.target.value);
  $('cap-size-val').textContent = Math.round(state.caption.size * 100) + '%';
  redraw();
});
$('cap-color').addEventListener('input', (e) => { state.caption.color = e.target.value; redraw(); });
$('cap-place').addEventListener('change', (e) => { state.caption.placement = e.target.value; redraw(); });
$('cap-tilt').addEventListener('input', (e) => {
  state.caption.tilt = parseFloat(e.target.value);
  $('cap-tilt-val').textContent = state.caption.tilt + '°';
  redraw();
});
$('cap-bar').addEventListener('change', (e) => { state.caption.bar = e.target.checked; redraw(); });
['grain', 'halftone', 'vignette'].forEach((name) => {
  $(`fx-${name}`).addEventListener('change', (e) => { state.effects[name] = e.target.checked; redraw(); });
});
document.querySelectorAll('[data-export]').forEach((b) => b.addEventListener('click', () => {
  const size = EXPORT_SIZES.find((s) => s.id === b.dataset.export);
  if (size) exportSize(size);
}));
$('export-all').addEventListener('click', exportAll);
window.addEventListener('resize', fitCanvas);

// Caption presets.
const capRow = $('caption-presets');
CAPTIONS.forEach((c) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = c;
  b.addEventListener('click', () => { state.caption.text = c; $('caption').value = c; redraw(); });
  capRow.appendChild(b);
});

// Query-string boot for screenshots:
// ?shot=editor|cover&photo=boulevard|pier&caption=..&layout=..&grade=..&size=square|portrait|wide
async function boot() {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  if (shot === 'cover') document.body.classList.add('cover-only');
  const layout = q.get('layout');
  if (layout && LAYOUTS[layout]) setLayout(layout);
  const grade = q.get('grade');
  if (grade && GRADES[grade]) setGrade(grade);
  const caption = q.get('caption');
  if (caption) { state.caption.text = caption; $('caption').value = caption; }
  const photo = q.get('photo');
  if (photo) {
    const sample = SAMPLES.find((s) => s.id === photo);
    if (sample) {
      const img = loadImage(sample.src);
      await new Promise((res) => { if (img.complete && img.naturalWidth) res(); else { img.onload = res; img.onerror = res; } });
      state.panels.forEach((_, i) => assignPhoto(img, sample.src, i));
    }
  }
  await document.fonts.load('16px Anton');
  await document.fonts.ready;
  fitCanvas();
  redraw();
  if (shot === 'cover') document.body.classList.add('ready');
}

// Test / screenshot hook.
window.__neonBay = { state, exportPoster, exportSize, drawPoster, loadSample, setLayout, setGrade };

boot();
