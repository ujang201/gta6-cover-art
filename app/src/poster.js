// Neon Bay — poster renderer. Draws the multi-panel cover onto any 2D
// canvas at any size: panels with per-panel pan/zoom, colour grade
// overlays, bold caption lettering and the grain / halftone / vignette
// effects. Pure drawing code — no DOM, no network, no side effects.

import { LAYOUTS, GRADES } from './presets.js';

const GAP_FRAC = 0.012; // panel gap as a fraction of poster width
const FRAME_FRAC = 0.02; // outer frame as a fraction of poster width

// Pixel rects for a layout, with gaps and an outer frame.
export function layoutRects(layoutId, W, H) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS.hero;
  const frame = Math.round(W * FRAME_FRAC);
  const gap = Math.round(W * GAP_FRAC);
  const innerW = W - frame * 2;
  const innerH = H - frame * 2;
  return layout.panels.map((p) => {
    const x = frame + p.x * innerW + (p.x > 0 ? gap / 2 : 0);
    const y = frame + p.y * innerH + (p.y > 0 ? gap / 2 : 0);
    const w = p.w * innerW - (p.x > 0 ? gap / 2 : 0) - (p.x + p.w < 1 ? gap / 2 : 0);
    const h = p.h * innerH - (p.y > 0 ? gap / 2 : 0) - (p.y + p.h < 1 ? gap / 2 : 0);
    return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
  });
}

// Cover-fit draw of one photo into a rect, with pan (pixels) and zoom.
function drawPhoto(ctx, img, rect, panX, panY, zoom) {
  if (!img || !img.naturalWidth) return false;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * base;
  const dh = img.naturalHeight * base;
  // Clamp the pan so the photo always covers the panel.
  const maxX = Math.max(0, (dw - rect.w) / 2);
  const maxY = Math.max(0, (dh - rect.h) / 2);
  const ox = Math.max(-maxX, Math.min(maxX, panX));
  const oy = Math.max(-maxY, Math.min(maxY, panY));
  ctx.drawImage(img, rect.x + (rect.w - dw) / 2 + ox, rect.y + (rect.h - dh) / 2 + oy, dw, dh);
  return true;
}

function emptyPanel(ctx, rect, label) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  g.addColorStop(0, '#241b3a');
  g.addColorStop(1, '#120e1e');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = Math.max(1, rect.w * 0.004);
  ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `600 ${Math.round(rect.w * 0.045)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2);
}

function applyGrade(ctx, W, H, gradeId) {
  const grade = GRADES[gradeId] ?? GRADES.none;
  for (const o of grade.overlays) {
    const x0 = o.from[0] * W, y0 = o.from[1] * H;
    const x1 = o.to[0] * W, y1 = o.to[1] * H;
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    for (const [stop, color] of o.stops) g.addColorStop(stop, color);
    ctx.save();
    ctx.globalCompositeOperation = o.blend;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  return grade.photoFilter;
}

// Film grain: a small noise tile, drawn tiled at low alpha.
let noiseTile = null;
function grainTile() {
  if (noiseTile) return noiseTile;
  const t = document.createElement('canvas');
  t.width = 128;
  t.height = 128;
  const c = t.getContext('2d');
  const data = c.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 100 + Math.floor(Math.random() * 110);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  c.putImageData(data, 0, 0);
  noiseTile = t;
  return t;
}

function applyEffects(ctx, W, H, effects) {
  if (effects.halftone) {
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#000000';
    const step = Math.max(6, Math.round(W * 0.012));
    for (let y = step / 2; y < H; y += step) {
      for (let x = step / 2; x < W; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.6, step * 0.14), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  if (effects.grain) {
    const tile = grainTile();
    const pattern = ctx.createPattern(tile, 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (effects.vignette) {
    const r = Math.hypot(W, H) / 2;
    const g = ctx.createRadialGradient(W / 2, H / 2, r * 0.45, W / 2, H / 2, r);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
}

// Wrap caption text to lines that fit maxWidth at the given font.
function wrapCaption(ctx, text, maxWidth) {
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? line + ' ' + word : word;
    if (ctx.measureText(trial).width <= maxWidth || !line) line = trial;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function drawCaption(ctx, W, H, caption) {
  const text = (caption.text || '').trim();
  if (!text) return;
  const fontPx = Math.round(W * caption.size);
  ctx.save();
  ctx.font = `${fontPx}px Anton, 'Arial Narrow', sans-serif`;
  try { ctx.letterSpacing = `${Math.round(fontPx * 0.04)}px`; } catch { /* older canvas */ }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const maxWidth = W * 0.9;
  const lines = wrapCaption(ctx, text, maxWidth);
  const lineH = fontPx * 1.04;
  const blockH = lines.length * lineH;
  const frame = W * FRAME_FRAC;
  const cy = caption.placement === 'top'
    ? frame + blockH / 2 + fontPx * 0.25
    : H - frame - blockH / 2 - fontPx * 0.25;
  ctx.translate(W / 2, cy);
  ctx.rotate((caption.tilt * Math.PI) / 180);
  if (caption.bar) {
    const barH = blockH + fontPx * 0.5;
    ctx.fillStyle = 'rgba(8,4,18,0.72)';
    ctx.fillRect(-W / 2, -barH / 2, W, barH);
  }
  ctx.fillStyle = caption.color || '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = Math.round(fontPx * 0.08);
  ctx.shadowOffsetY = Math.round(fontPx * 0.03);
  lines.forEach((line, i) => {
    ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * lineH);
  });
  ctx.restore();
}

// Draw the whole poster. state: { layout, grade, caption, effects, panels }.
export function drawPoster(ctx, W, H, state) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0d0916';
  ctx.fillRect(0, 0, W, H);
  const rects = layoutRects(state.layout, W, H);
  const grade = GRADES[state.grade] ?? GRADES.none;
  state.panels.forEach((panel, i) => {
    const rect = rects[i];
    if (!rect) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    ctx.filter = grade.photoFilter;
    const drawn = drawPhoto(ctx, panel.img, rect, panel.panX, panel.panY, panel.zoom);
    ctx.filter = 'none';
    if (!drawn) emptyPanel(ctx, rect, 'ADD PHOTO');
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(2, Math.round(W * 0.004));
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });
  applyGrade(ctx, W, H, state.grade);
  drawCaption(ctx, W, H, state.caption);
  applyEffects(ctx, W, H, state.effects);
}

// Render the poster at export size and return the canvas.
export function exportPoster(w, h, state) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawPoster(canvas.getContext('2d'), w, h, state);
  return canvas;
}
