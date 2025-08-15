function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }
function hexToRgb(hex: string) {
  const h = hex.replace('#','');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}
function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}
function lighten(hex: string, amt: number) {
  const { r, g, b } = hexToRgb(hex);
  const nr = Math.round(r + (255 - r) * clamp01(amt));
  const ng = Math.round(g + (255 - g) * clamp01(amt));
  const nb = Math.round(b + (255 - b) * clamp01(amt));
  return rgbToHex(nr, ng, nb);
}
function darken(hex: string, amt: number) {
  const { r, g, b } = hexToRgb(hex);
  const nr = Math.round(r * (1 - clamp01(amt)));
  const ng = Math.round(g * (1 - clamp01(amt)));
  const nb = Math.round(b * (1 - clamp01(amt)));
  return rgbToHex(nr, ng, nb);
}

export function setPrimaryColor(hex: string) {
  if (!/^#?[0-9a-fA-F]{6}$/.test(hex) && !/^#?[0-9a-fA-F]{3}$/.test(hex)) return;
  if (!hex.startsWith('#')) hex = '#' + hex;
  const base = hex;
  const light = lighten(base, 0.1);
  const dark = darken(base, 0.1);
  const root = document.documentElement;
  root.style.setProperty('--primary', base);
  root.style.setProperty('--primary-500', light);
  root.style.setProperty('--primary-600', dark);
}
