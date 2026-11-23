/** Adds an alpha channel to a `#RGB` or `#RRGGBB` color; other formats are returned unchanged. */
export function withAlpha(hexColor: string, alpha: number): string {
  const short = /^#([0-9A-F])([0-9A-F])([0-9A-F])$/i.exec(hexColor);
  const full = short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : hexColor;
  if (!/^#[0-9A-F]{6}$/i.test(full)) return hexColor;
  const alphaHex = Math.round(Math.min(1, Math.max(0, alpha)) * 255).toString(16).padStart(2, '0');
  return `${full}${alphaHex}`;
}
