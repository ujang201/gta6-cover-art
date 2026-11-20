// Neon Bay — poster engine. Draws the multi-panel cover art onto any canvas,
// at any size, from one state object. Pure canvas 2D, no dependencies.
// A state is: { layout, size, panels: [{ photo, panX, panY, zoom }],
//   caption: { text, size, color, place, tilt, bar },
//   grade, effects: { grain, halftone, vignette } }.
// A photo is { img, w, h } — an Image already loaded (sample or user file).

export const SIZES = {
  square: { id: 'square', label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  portrait: { id: 'portrait', label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  wide: { id: 'wide', label: 'Wide 1920 × 1080', w: 1920, h: 1080 },
};

export const LAYOUTS = {
  hero: { id: 'hero', label: 'Hero split', hint: 'One big panel, two small' },
  trio: { id: 'trio', label: 'Comic trio', hint: 'Three tall panels' },
  grid: { id: 'grid', label: 'Four grid', hint: 'Two by two' },
  solo: { id: 'solo', label: 'Solo', hint: 'One full-bleed photo' },
};

export const GRADES = {
  sunset: {
    id: 'sunset', label: 'Sunset',
    filter: 'saturate(1.4) contrast(1.08) sepia(0.28) hue-rotate(-14deg)',
    wash: [['#ff9a3c', 0.16], ['#ff2e63', 0.2]],
  },
  neon: {
    id: 'neon', label: 'Neon night',
    filter: 'saturate(1.7) contrast(1.15) hue-rotate(24deg) brightness(0.96)',
    wash: [['#00e5ff', 0.1], ['#ff2fb3', 0.2]],
  },
  noir: {
    id: 'noir', label: 'Palm noir',
    filter: 'grayscale(1) contrast(1.3) brightness(0.9)',
    wash: [['#0a2e1f', 0.14], ['#000000', 0.1]],
  },
  none: { id: 'none', label: 'No grade', filter: 'none', wash: [] },
};

export const CAPTION_COLORS = ['#ffffff', '#ffd60a', '#ff5da2', '#37e6ff', '#ff6b35'];

// Panel rects (pixels) for a layout inside w x h, with a gutter between panels.
export function layoutRects(layout, w, h) {
  const g = Math.max(4, Math.round(Math.min(w, h) * 0.012)); // gutter
  const full = [{ x: 0, y: 0, w, h }];
  if (layout === 'solo') return full;
  if (layout === 'hero') {
    const leftW = Math.round(w * 0.62) - g;
    const rightX = Math.round(w * 0.62) + g;
    const rightW = w - rightX;
    const topH = Math.round(h / 2) - g;
    return [
      { x: 0, y: 0, w: leftW, h },
      { x: rightX, y: 0, w: rightW, h: topH },
      { x: rightX, y: topH + 2 * g, w: rightW, h: h - topH - 2 * g },
    ];
  }
  if (layout === 'trio') {
    const pw = Math.round((w - 2 * g) / 3);
    return [0, 1, 2].map((i) => ({ x: i * (pw + g), y: 0, w: pw, h }));
  }
  // grid
  const cw = Math.round((w - g) / 2);
  const ch = Math.round((h - g) / 2);
  return [
    { x: 0, y: 0, w: cw, h: ch },
    { x: cw + g, y: 0, w: cw, h: ch },
    { x: 0, y: ch + g, w: cw, h: ch },
    { x: cw + g, y: ch + g, w: cw, h: ch },
  ];
}

export function panelCount(layout) {
  return layoutRects(layout, 100, 100).length;
}

// Deterministic PRNG so the grain looks the same on every render.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawPhoto(ctx, photo, rect, grade) {
  const { img, w: iw, h: ih } = photo;
  const z = photo.zoom || 1;
  const scale = Math.max(rect.w / iw, rect.h / ih) * z;
  const dw = iw * scale;
  const dh = ih * scale;
  const ox = (dw - rect.w) / 2;
  const oy = (dh - rect.h) / 2;
  const dx = rect.x + (rect.w - dw) / 2 + (photo.panX || 0) * ox;
  const dy = rect.y + (rect.h - dh) / 2 + (photo.panY || 0) * oy;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = grade.filter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawWash(ctx, w, h, grade) {
  if (!grade.wash.length) return;
  const grad = ctx.createLinearGradient(0, 0, w * 0.3, h);
  grade.wash.forEach(([color, alpha], i) => {
    grad.addColorStop(i / Math.max(1, grade.wash.length - 1), hexA(color, alpha));
  });
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function hexA(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function drawGrain(ctx, w, h) {
  const rnd = mulberry32(1337);
  const n = Math.round((w * h) / 1100);
  ctx.save();
  for (let i = 0; i < n; i++) {
    const v = rnd();
    ctx.fillStyle = v > 0.5 ? `rgba(255,255,255,${0.03 + rnd() * 0.09})` : `rgba(0,0,0,${0.03 + rnd() * 0.09})`;
    ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 1.5, 1 + rnd() * 1.5);
  }
  ctx.restore();
}

function drawHalftone(ctx, w, h) {
  const step = Math.max(10, Math.round(w / 130));
  const r = Math.max(1.2, step * 0.16);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.055)';
  for (let y = step / 2; y < h; y += step) {
    const off = (Math.round(y / step) % 2) * (step / 2);
    for (let x = step / 2 + off; x < w; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawVignette(ctx, w, h) {
  const grad = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawCaption(ctx, w, h, caption) {
  const text = (caption.text || '').trim().toUpperCase();
  if (!text) return;
  const size = Math.round(w * (caption.size || 0.09));
  const cx = w / 2;
  const cy = caption.place === 'top' ? h * 0.1 + size * 0.5 : h * 0.9 - size * 0.5;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((caption.tilt || 0) * Math.PI) / 180);
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  try { ctx.letterSpacing = `${Math.round(size * 0.06)}px`; } catch (_) { /* older canvas */ }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tw = ctx.measureText(text).width;
  const pad = size * 0.45;
  if (caption.bar) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    const bw = tw + pad * 2;
    const bh = size * 1.5;
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
  }
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = size * 0.12;
  ctx.shadowOffsetY = size * 0.04;
  ctx.fillStyle = caption.color || '#ffffff';
  ctx.fillText(text, 0, size * 0.04);
  ctx.restore();
}

// Draw the whole poster onto ctx at w x h. Photos are { img, w, h, panX, panY, zoom }.
export function drawPoster(ctx, state, w, h) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  const rects = layoutRects(state.layout, w, h);
  ctx.save();
  ctx.fillStyle = '#0b0b10';
  ctx.fillRect(0, 0, w, h);
  rects.forEach((rect, i) => {
    const panel = state.panels[i];
    if (panel && panel.photo) drawPhoto(ctx, { ...panel.photo, panX: panel.panX, panY: panel.panY, zoom: panel.zoom }, rect, grade);
  });
  drawWash(ctx, w, h, grade);
  if (state.effects?.grain) drawGrain(ctx, w, h);
  if (state.effects?.halftone) drawHalftone(ctx, w, h);
  if (state.effects?.vignette) drawVignette(ctx, w, h);
  drawCaption(ctx, w, h, state.caption);
  ctx.restore();
  return rects;
}
