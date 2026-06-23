/* ═══════════════════════════════════════════════════════════════════════════
   Shared Types
   Used across all atomic layers.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  raw: string;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  encodedPolyline: string;
  /** Indices into the intermediates array (not the full locations array) */
  optimizedOrder: number[];
}
