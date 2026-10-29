// The Nomrank mark, redrawn as vectors from the owner's artwork (2026-10-29): a cream arch with a spoon cut out of it,
// and a mustard four-point sparkle over its shoulder. Used inline in the app and as an image in generated icons and cards.

// Drawn on a 512 box; the view box crops to the mark with a little air.
export const MARK_VIEWBOX = "92 91 334 334";
// The arch, with the spoon (bowl and handle, open at the bottom) as a hole: draw with fill-rule="evenodd".
export const ARCH = "M100 422V305a125 125 0 0 1 250 0v117ZM212 422l7.5-82.7a37 52 0 1 1 11 0L238 422Z";
export const SPARKLE = "M353 95Q360 153 418 160Q360 167 353 225Q346 167 288 160Q346 153 353 95Z";

export const CREAM = "#fff4ea";
export const MUSTARD = "#ffc23c";

export function markSvg(arch = CREAM, sparkle = MUSTARD) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}"><path fill="${arch}" fill-rule="evenodd" d="${ARCH}"/><path fill="${sparkle}" d="${SPARKLE}"/></svg>`;
}

export const markUri = (arch?: string, sparkle?: string) => `data:image/svg+xml,${encodeURIComponent(markSvg(arch, sparkle))}`;
