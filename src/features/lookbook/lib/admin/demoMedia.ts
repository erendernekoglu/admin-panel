/**
 * Local image sources for demo mode.
 *
 * Demo records keep canonical managed paths, but those paths are never
 * requested from a server. Chosen uploads are registered here as local object
 * URLs; everything else resolves to a deterministic inline SVG placeholder so
 * the editor shows a stable, synthetic image with zero network traffic.
 */

const localSources = new Map<string, string>();

export function registerDemoMedia(storagePath: string, source: string): void {
  localSources.set(storagePath, source);
}

export function hasDemoMedia(storagePath: string): boolean {
  return localSources.has(storagePath);
}

/** Stable, cheap hash so each asset gets its own placeholder colours. */
function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index++) {
    result = (result * 31 + value.charCodeAt(index)) % 360;
  }
  return result;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Deterministic inline SVG; no fonts, scripts or external references. */
export function demoPlaceholderDataUrl(seed: string, label = "Demo image"): string {
  const hue = hash(seed);
  const accent = (hue + 38) % 360;
  const text = escapeXml(label.slice(0, 64));
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" role="img">',
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0" stop-color="hsl(${hue} 24% 82%)"/>`,
    `<stop offset="1" stop-color="hsl(${accent} 30% 62%)"/>`,
    `</linearGradient></defs>`,
    '<rect width="600" height="800" fill="url(#g)"/>',
    `<circle cx="300" cy="330" r="120" fill="hsl(${hue} 30% 94%)" opacity="0.55"/>`,
    `<path d="M180 560h240l-40 150H220z" fill="hsl(${hue} 22% 40%)" opacity="0.35"/>`,
    `<text x="300" y="730" text-anchor="middle" font-family="system-ui, sans-serif" font-size="28" fill="hsl(${hue} 18% 22%)">${text}</text>`,
    "</svg>",
  ].join("");
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Resolve an image for demo rendering. Registered local bytes win; otherwise a
 * synthetic placeholder is returned. Never returns a server URL.
 */
export function demoMediaSrc(storagePath: string, label = "Demo image"): string {
  return localSources.get(storagePath) ?? demoPlaceholderDataUrl(storagePath, label);
}
