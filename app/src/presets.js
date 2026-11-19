// Neon Bay — presets: poster layouts, colour grades, defaults.
// All original to this entry. Layouts are fractions of the poster size;
// the renderer turns them into pixel rects with a gap and an outer frame.

export const LAYOUTS = {
  hero: {
    label: 'Hero split',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 0.5 },
      { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
    ],
  },
  trio: {
    label: 'Comic trio',
    panels: [
      { x: 0, y: 0, w: 0.34, h: 1 },
      { x: 0.34, y: 0, w: 0.33, h: 1 },
      { x: 0.67, y: 0, w: 0.33, h: 1 },
    ],
  },
  grid: {
    label: 'Four grid',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  solo: {
    label: 'Solo',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
};

// Grades are drawn as overlays on top of the photos. Each entry lists
// the photo filter applied while drawing, plus gradient stops laid over
// the whole poster afterwards.
export const GRADES = {
  sunset: {
    label: 'Sunset',
    photoFilter: 'saturate(1.25) contrast(1.06)',
    overlays: [
      { type: 'linear', from: [0, 0], to: [0, 1], stops: [[0, 'rgba(255,150,60,0.30)'], [0.55, 'rgba(255,90,80,0.10)'], [1, 'rgba(150,30,110,0.34)']], blend: 'overlay' },
      { type: 'linear', from: [0, 1], to: [0, 0], stops: [[0, 'rgba(255,120,40,0.16)'], [1, 'rgba(255,120,40,0)']], blend: 'soft-light' },
    ],
  },
  neon: {
    label: 'Neon night',
    photoFilter: 'saturate(1.45) contrast(1.1)',
    overlays: [
      { type: 'linear', from: [0, 0], to: [1, 1], stops: [[0, 'rgba(255,0,150,0.30)'], [0.5, 'rgba(120,0,200,0.10)'], [1, 'rgba(0,220,255,0.30)']], blend: 'overlay' },
      { type: 'linear', from: [0, 0], to: [0, 1], stops: [[0, 'rgba(10,0,40,0.18)'], [1, 'rgba(10,0,40,0)']], blend: 'multiply' },
    ],
  },
  noir: {
    label: 'Palm noir',
    photoFilter: 'grayscale(1) contrast(1.18) brightness(0.92)',
    overlays: [
      { type: 'linear', from: [0, 0], to: [0, 1], stops: [[0, 'rgba(20,30,50,0.22)'], [1, 'rgba(0,0,0,0.30)']], blend: 'multiply' },
      { type: 'linear', from: [0, 0], to: [1, 0], stops: [[0, 'rgba(0,200,180,0.10)'], [1, 'rgba(0,200,180,0)']], blend: 'soft-light' },
    ],
  },
  none: { label: 'No grade', photoFilter: 'none', overlays: [] },
};

export const SAMPLES = [
  { id: 'boulevard', label: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'pier', label: 'Pier', src: 'samples/pier.jpg' },
];

export const CAPTIONS = ['NEON BAY', 'VICE CITY', 'SUNSET DRIVE', 'MIDNIGHT RUN'];

export const EXPORT_SIZES = [
  { id: 'square', label: '1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: '1920 × 1080', w: 1920, h: 1080 },
];

export function defaultState() {
  return {
    layout: 'hero',
    grade: 'sunset',
    caption: {
      text: 'NEON BAY',
      size: 0.115, // fraction of poster width
      color: '#ffffff',
      placement: 'bottom',
      tilt: -2, // degrees
      bar: true,
    },
    effects: { grain: true, halftone: false, vignette: true },
    panels: LAYOUTS.hero.panels.map(() => ({ img: null, src: '', panX: 0, panY: 0, zoom: 1 })),
    selected: 0,
  };
}
