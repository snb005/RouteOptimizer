/* ═══════════════════════════════════════════════════════════════════════════
   Utility — Google Maps Link Parser
   Extracts lat/lng from various Google Maps URL formats.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Extract lat/lng from various Google Maps URL formats:
 *  - https://maps.google.com/?q=LAT,LNG
 *  - https://www.google.com/maps/place/.../@LAT,LNG,ZOOMz/...
 *  - Plain "LAT,LNG"
 */
export function parseGoogleMapsLink(raw: string): { lat: number; lng: number; name: string } | null {
  const text = raw.trim();

  // Plain coordinate "12.345,67.890" or "12.345, 67.890"
  const plain = text.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (plain) {
    return { lat: parseFloat(plain[1]), lng: parseFloat(plain[2]), name: text };
  }

  // @LAT,LNG in URL (most common Google Maps share format)
  const atMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]), name: labelFromUrl(text) };
  }

  // ?q=LAT,LNG
  const qMatch = text.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]), name: labelFromUrl(text) };
  }

  // ll=LAT,LNG
  const llMatch = text.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (llMatch) {
    return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]), name: labelFromUrl(text) };
  }

  // /place/NAME/@LAT,LNG
  const placeMatch = text.match(/\/place\/([^/]+)\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (placeMatch) {
    return {
      lat: parseFloat(placeMatch[2]),
      lng: parseFloat(placeMatch[3]),
      name: decodeURIComponent(placeMatch[1].replace(/\+/g, " ")),
    };
  }

  return null;
}

function labelFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/place\/([^/]+)/);
    if (m) return decodeURIComponent(m[1].replace(/\+/g, " "));
    return u.hostname;
  } catch {
    return url.slice(0, 30);
  }
}
