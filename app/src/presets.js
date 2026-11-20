// Neon Bay — presets: the built-in sample photos and the default editor state.
// The two sample photos ship with the kit (made with an image model for make.fun).

export const SAMPLES = [
  { id: 'boulevard', src: 'samples/boulevard.jpg', label: 'Boulevard' },
  { id: 'pier', src: 'samples/pier.jpg', label: 'Pier' },
];

export function defaultCaption() {
  return { text: 'NEON BAY', size: 0.09, color: '#ffffff', place: 'bottom', tilt: -2, bar: true };
}

export function defaultEffects() {
  return { grain: true, halftone: false, vignette: true };
}

// Panels for a layout, each filled with the given sample ids in turn.
export function defaultPanels(layout, sampleIds) {
  const counts = { hero: 3, trio: 3, grid: 4, solo: 1 };
  const n = counts[layout] || 1;
  return Array.from({ length: n }, (_, i) => ({
    photoId: sampleIds[i % sampleIds.length],
    panX: 0, panY: 0, zoom: 1,
  }));
}

export function defaultState() {
  return {
    layout: 'hero',
    size: 'wide',
    panels: defaultPanels('hero', ['pier', 'boulevard', 'pier']),
    caption: defaultCaption(),
    grade: 'sunset',
    effects: defaultEffects(),
  };
}
